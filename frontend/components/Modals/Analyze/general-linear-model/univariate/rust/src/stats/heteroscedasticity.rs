use crate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{
        BPTest,
        DesignMatrixInfo,
        FTest,
        HeteroscedasticityTests,
        ModifiedBPTest,
        WhiteTest,
        OlsResult,
    },
};
use nalgebra::{ DMatrix, DVector };
use rayon::prelude::*;
use std::f64;

use super::core::*;

pub fn calculate_heteroscedasticity_tests(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HeteroscedasticityTests, String> {
    let design_info = create_design_response_weights(data, config)?;

    let dep_var_name = config.main.dep_var.as_ref().unwrap();
    let design_string = generate_design_string(&design_info);
    let ztwz_matrix = create_cross_product_matrix(&design_info)?;
    let swept_info = perform_sweep_and_extract_results(&ztwz_matrix, design_info.p_parameters)?;

    // Hitung sisaan dengan lebih efisien
    let y_hat = &design_info.x * &swept_info.beta_hat;
    let residuals_vec = &design_info.y - &y_hat;
    let n_obs = design_info.n_samples;

    // Siapkan variabel dependen tambahan (kuadrat sisaan)
    let y_aux_for_tests = residuals_vec.map(|e| e.powi(2));

    // Buat matriks nilai prediksi menggunakan informasi desain
    let z_pred_matrix_option = create_predicted_aux_matrix(&y_hat, n_obs);

    // Inisialisasi hasil uji
    let mut white_test_result = None;
    let mut bp_test_result = None;
    let mut modified_bp_test_result = None;
    let mut f_test_result = None;

    // Jalankan uji yang diminta dengan implementasi yang dioptimalkan
    if config.options.white_test {
        let (white_test, white_aux_terms) = calculate_white_test(
            &y_aux_for_tests,
            &design_info,
            n_obs
        );
        white_test_result = Some(white_test);

        // Update white test note with proper auxiliary design string
        if let Some(test) = &mut white_test_result {
            if !white_aux_terms.is_empty() {
                let white_design = format!("Design: {}", white_aux_terms.join(" + "));
                test.note = Some(format!("Dependent Variable: {}. {}", dep_var_name, white_design));
            } else {
                test.note = Some(
                    format!("Dependent Variable: {}. {}", dep_var_name, design_string)
                );
            }
        }
    }

    if let Some(z_p) = &z_pred_matrix_option {
        if config.options.brusch_pagan {
            bp_test_result = calculate_bp_test(&y_aux_for_tests, z_p, n_obs, swept_info.s_rss);
        }
        if config.options.mod_brusch_pagan {
            modified_bp_test_result = calculate_modified_bp_test(&y_aux_for_tests, z_p, n_obs);
        }
        if config.options.f_test {
            f_test_result = calculate_f_test(&y_aux_for_tests, z_p, n_obs);
        }
    }

    // Tambahkan metadata ke catatan
    let note_string = format!("Dependent Variable: {}. {}", dep_var_name, design_string);

    // Perbarui hasil uji dengan catatan (except White test which is handled above)
    if let Some(test) = &mut bp_test_result {
        test.note = Some(note_string.clone());
    }
    if let Some(test) = &mut modified_bp_test_result {
        test.note = Some(note_string.clone());
    }
    if let Some(test) = &mut f_test_result {
        test.note = Some(note_string.clone());
    }

    Ok(HeteroscedasticityTests {
        white: white_test_result,
        breusch_pagan: bp_test_result,
        modified_breusch_pagan: modified_bp_test_result,
        f_test: f_test_result,
    })
}

fn run_ols(y_aux_vec: &DVector<f64>, x_aux_matrix: &DMatrix<f64>) -> Result<OlsResult, String> {
    let n_obs = y_aux_vec.nrows();
    let n_predictors = x_aux_matrix.ncols();

    if x_aux_matrix.nrows() != n_obs {
        return Err(
            format!(
                "Dimension mismatch: X has {} rows, Y has {} rows.",
                x_aux_matrix.nrows(),
                n_obs
            )
        );
    }

    // Hitung TSS dengan efisien
    let y_mean = if n_obs > 0 { y_aux_vec.mean() } else { 0.0 };
    let tss = y_aux_vec
        .iter()
        .map(|&y| (y - y_mean).powi(2))
        .sum::<f64>();

    if n_predictors == 0 {
        return Ok(OlsResult {
            r_squared: 0.0,
            ess: 0.0,
            df_regressors: 0,
            df_residuals: n_obs,
        });
    }

    // Gunakan dekomposisi QR untuk stabilitas numerik
    let qr = x_aux_matrix.clone().qr();
    let q = qr.q();
    let r = qr.r();

    let qty = q.transpose() * y_aux_vec;

    let beta_aux = r
        .solve_upper_triangular(&qty)
        .ok_or_else(||
            "Failed to solve linear system with QR decomposition (singular matrix).".to_string()
        )?;

    // Hitung RSS dan ESS dengan efisien
    let residuals = y_aux_vec - x_aux_matrix * &beta_aux;
    let rss = residuals.norm_squared();
    let ess = tss - rss;

    let r_squared = if tss.abs() < 1e-12 { 0.0 } else { (ess / tss).max(0.0).min(1.0) };

    let df_residuals = n_obs.saturating_sub(n_predictors);

    Ok(OlsResult {
        r_squared,
        ess,
        df_regressors: n_predictors,
        df_residuals,
    })
}

fn create_white_aux_matrix(
    design_info: &DesignMatrixInfo,
    n_obs: usize
) -> Result<(DMatrix<f64>, Vec<String>), String> {
    if n_obs == 0 {
        return Ok((DMatrix::zeros(0, 0), Vec::new()));
    }

    // Kumpulkan prediktor dengan lebih efisien menggunakan indeks matriks desain
    let predictors = collect_predictors(design_info);

    if predictors.is_empty() {
        return Ok((DMatrix::from_element(n_obs, 1, 1.0), vec!["Intercept".to_string()]));
    }

    let mut aux_cols: Vec<DVector<f64>> = Vec::with_capacity(1 + predictors.len() * 2);
    let mut aux_term_names: Vec<String> = Vec::with_capacity(1 + predictors.len() * 2);

    // Tambahkan intersep
    aux_cols.push(DVector::from_element(n_obs, 1.0));
    aux_term_names.push("Intercept".to_string());

    // Tambahkan prediktor asli dengan nama yang sesuai
    let mut predictor_names: Vec<String> = Vec::new();
    for (i, col) in predictors.iter().enumerate() {
        aux_cols.push(col.clone());
        let pred_name = format!("X{}", i + 1);
        aux_term_names.push(pred_name.clone());
        predictor_names.push(pred_name);
    }

    // Tambahkan kuadrat dan interaksi secara paralel dengan nama yang sesuai
    let interaction_data: Vec<(DVector<f64>, String)> = (0..predictors.len())
        .into_par_iter()
        .flat_map(|i| {
            let col1 = &predictors[i];
            let pred_name_i = &predictor_names[i];
            let mut terms = Vec::new();

            // Tambahkan istilah kuadrat (untuk variabel kontinu)
            terms.push((col1.component_mul(col1), format!("{}^2", pred_name_i)));

            // Tambahkan produk silang dengan prediktor lain
            for k in i + 1..predictors.len() {
                let col2 = &predictors[k];
                let pred_name_k = &predictor_names[k];
                terms.push((col1.component_mul(col2), format!("{}*{}", pred_name_i, pred_name_k)));
            }

            terms
        })
        .collect();

    for (col, name) in interaction_data {
        aux_cols.push(col);
        aux_term_names.push(name);
    }

    if aux_cols.is_empty() {
        Ok((DMatrix::zeros(n_obs, 0), Vec::new()))
    } else {
        Ok((DMatrix::from_columns(&aux_cols), aux_term_names))
    }
}

fn calculate_white_test(
    y_aux: &DVector<f64>,
    design_info: &DesignMatrixInfo,
    n_obs: usize
) -> (WhiteTest, Vec<String>) {
    // Periksa apakah kita memiliki prediktor non-intersep
    let num_non_intercept_predictors =
        design_info.p_parameters - (if design_info.intercept_column.is_some() { 1 } else { 0 });

    if num_non_intercept_predictors == 0 {
        return (
            WhiteTest {
                statistic: 0.0,
                df: 0,
                p_value: 1.0,
                note: None,
                interpretation: Some(
                    "The White test requires at least one non-intercept predictor in the model to check for heteroscedasticity. Since none were found, the test was not performed.".to_string()
                ),
            },
            Vec::new(),
        );
    }

    match create_white_aux_matrix(design_info, n_obs) {
        Ok((z_white_matrix, aux_term_names)) => {
            if z_white_matrix.ncols() <= 1 {
                return (
                    WhiteTest {
                        statistic: 0.0,
                        df: 0,
                        p_value: 1.0,
                        note: None,
                        interpretation: Some(
                            "The auxiliary regression for the White test has no predictors to test, so the test statistic is zero and the null hypothesis of homoscedasticity is not rejected.".to_string()
                        ),
                    },
                    aux_term_names,
                );
            }

            match run_ols(y_aux, &z_white_matrix) {
                Ok(ols_result) => {
                    let lm_statistic = (n_obs as f64) * ols_result.r_squared;
                    let df = ols_result.df_regressors.saturating_sub(1);

                    if df > 0 {
                        let p_value = calculate_chi_sq_significance(lm_statistic, df as u64);
                        (
                            WhiteTest {
                                statistic: lm_statistic,
                                df,
                                p_value,
                                note: None,
                                interpretation: Some(
                                    "A significant p-value (< 0.05) suggests that the variance of the errors is not constant, violating the assumption of homoscedasticity.".to_string()
                                ),
                            },
                            aux_term_names,
                        )
                    } else {
                        (
                            WhiteTest {
                                statistic: 0.0,
                                df: 0,
                                p_value: 1.0,
                                note: None,
                                interpretation: Some(
                                    "The auxiliary regression for the White test has no predictors to test, so the test statistic is zero and the null hypothesis of homoscedasticity is not rejected.".to_string()
                                ),
                            },
                            aux_term_names,
                        )
                    }
                }
                Err(_) =>
                    (
                        WhiteTest {
                            statistic: f64::NAN,
                            df: 0,
                            p_value: f64::NAN,
                            note: None,
                            interpretation: Some(
                                "The White test could not be performed due to an error in the auxiliary regression.".to_string()
                            ),
                        },
                        aux_term_names,
                    ),
            }
        }
        Err(_) =>
            (
                WhiteTest {
                    statistic: f64::NAN,
                    df: 0,
                    p_value: f64::NAN,
                    note: None,
                    interpretation: Some(
                        "The White test could not be performed because the auxiliary design matrix could not be created.".to_string()
                    ),
                },
                Vec::new(),
            ),
    }
}

fn collect_predictors(design_info: &DesignMatrixInfo) -> Vec<DVector<f64>> {
    let mut predictors = Vec::new();
    let has_intercept = design_info.intercept_column.is_some();

    // Proses setiap istilah menggunakan indeks matriks desain
    for term_name in &design_info.term_names {
        if term_name == "Intercept" {
            continue;
        }

        if let Some(&(start, end)) = design_info.term_column_indices.get(term_name) {
            let is_factor =
                design_info.fixed_factor_indices.contains_key(term_name) ||
                design_info.random_factor_indices.contains_key(term_name);
            let num_cols = end - start + 1;

            // Untuk faktor dengan intersep, lewati kolom terakhir untuk menghindari kolinearitas
            let cols_to_use = if is_factor && has_intercept && num_cols > 1 {
                num_cols - 1
            } else {
                num_cols
            };

            for i in 0..cols_to_use {
                let col_idx = start + i;
                if col_idx < design_info.x.ncols() {
                    predictors.push(design_info.x.column(col_idx).into_owned());
                }
            }
        }
    }

    predictors
}

fn create_predicted_aux_matrix(y_hat: &DVector<f64>, n_obs: usize) -> Option<DMatrix<f64>> {
    if n_obs == 0 {
        return Some(DMatrix::zeros(0, 0));
    }

    let mut aux_cols = vec![DVector::from_element(n_obs, 1.0)];

    // Periksa apakah y_hat tidak konstan
    if let Some(&first) = y_hat.get(0) {
        let is_constant = y_hat
            .iter()
            .skip(1)
            .all(|&v| (v - first).abs() < 1e-9);
        if !is_constant {
            aux_cols.push(y_hat.clone_owned());
        }
    }

    Some(DMatrix::from_columns(&aux_cols))
}

fn calculate_bp_test(
    y_aux: &DVector<f64>,
    z_pred: &DMatrix<f64>,
    n_obs: usize,
    rss_main_model: f64
) -> Option<BPTest> {
    if z_pred.ncols() < 2 {
        return Some(BPTest {
            statistic: 0.0,
            df: 0,
            p_value: 1.0,
            note: None,
            interpretation: Some(
                "The auxiliary model for the Breusch-Pagan test requires at least two distinct columns (intercept and predicted values). As this condition was not met, the test was not performed.".to_string()
            ),
        });
    }

    match run_ols(y_aux, z_pred) {
        Ok(ols_result) => {
            let sigma_sq_mle = if n_obs > 0 { rss_main_model / (n_obs as f64) } else { f64::NAN };

            if sigma_sq_mle.is_nan() || sigma_sq_mle.abs() < 1e-12 {
                return Some(BPTest {
                    statistic: f64::NAN,
                    df: ols_result.df_regressors.saturating_sub(1),
                    p_value: f64::NAN,
                    note: None,
                    interpretation: Some(
                        "The test could not be computed because the estimated error variance from the main model was zero or not a number, which prevents the calculation of the test statistic.".to_string()
                    ),
                });
            }

            let bp_statistic = ols_result.ess / (2.0 * sigma_sq_mle.powi(2));
            let df = ols_result.df_regressors.saturating_sub(1);

            if df > 0 {
                let p_value = calculate_chi_sq_significance(bp_statistic, df as u64);
                Some(BPTest {
                    statistic: bp_statistic,
                    df,
                    p_value,
                    note: None,
                    interpretation: Some(
                        "A significant p-value (< 0.05) suggests that the variance of the errors is related to the predicted values, indicating heteroscedasticity.".to_string()
                    ),
                })
            } else {
                Some(BPTest {
                    statistic: 0.0,
                    df: 0,
                    p_value: 1.0,
                    note: None,
                    interpretation: Some(
                        "The auxiliary regression for the Breusch-Pagan test has no predictors to test, so the test statistic is zero and the null hypothesis of homoscedasticity is not rejected.".to_string()
                    ),
                })
            }
        }
        Err(_) =>
            Some(BPTest {
                statistic: f64::NAN,
                df: 0,
                p_value: f64::NAN,
                note: None,
                interpretation: Some(
                    "The Breusch-Pagan test could not be performed due to an error in the auxiliary regression.".to_string()
                ),
            }),
    }
}

fn calculate_modified_bp_test(
    y_aux: &DVector<f64>,
    z_pred: &DMatrix<f64>,
    n_obs: usize
) -> Option<ModifiedBPTest> {
    if z_pred.ncols() < 2 {
        return Some(ModifiedBPTest {
            statistic: 0.0,
            df: 0,
            p_value: 1.0,
            note: None,
            interpretation: Some(
                "The auxiliary model for the Modified Breusch-Pagan test requires at least two distinct columns (intercept and predicted values). As this condition was not met, the test was not performed.".to_string()
            ),
        });
    }

    match run_ols(y_aux, z_pred) {
        Ok(ols_result) => {
            let lm_statistic = (n_obs as f64) * ols_result.r_squared;
            let df = ols_result.df_regressors.saturating_sub(1);

            if df > 0 {
                let p_value = calculate_chi_sq_significance(lm_statistic, df as u64);
                Some(ModifiedBPTest {
                    statistic: lm_statistic,
                    df,
                    p_value,
                    note: None,
                    interpretation: Some(
                        "This test is robust to non-normal errors. A significant p-value (< 0.05) suggests that the variance of the errors is related to the predicted values, indicating heteroscedasticity.".to_string()
                    ),
                })
            } else {
                Some(ModifiedBPTest {
                    statistic: 0.0,
                    df: 0,
                    p_value: 1.0,
                    note: None,
                    interpretation: Some(
                        "The auxiliary regression for the Modified Breusch-Pagan test has no predictors to test, so the test statistic is zero and the null hypothesis of homoscedasticity is not rejected.".to_string()
                    ),
                })
            }
        }
        Err(_) =>
            Some(ModifiedBPTest {
                statistic: f64::NAN,
                df: 0,
                p_value: f64::NAN,
                note: None,
                interpretation: Some(
                    "The Modified Breusch-Pagan test could not be performed due to an error in the auxiliary regression.".to_string()
                ),
            }),
    }
}

fn calculate_f_test(y_aux: &DVector<f64>, z_pred: &DMatrix<f64>, n_obs: usize) -> Option<FTest> {
    if z_pred.ncols() < 2 {
        return Some(FTest {
            statistic: f64::NAN,
            df1: 0,
            df2: n_obs.saturating_sub(z_pred.ncols()),
            p_value: f64::NAN,
            note: None,
            interpretation: Some(
                "The auxiliary model for the F-test requires at least two distinct columns (intercept and predicted values). As this condition was not met, the test was not performed.".to_string()
            ),
        });
    }

    match run_ols(y_aux, z_pred) {
        Ok(ols_result) => {
            let df1 = ols_result.df_regressors.saturating_sub(1);
            let df2 = ols_result.df_residuals;

            if df1 > 0 && df2 > 0 {
                let f_statistic =
                    ols_result.r_squared /
                    (df1 as f64) /
                    ((1.0 - ols_result.r_squared) / (df2 as f64));
                let p_value = calculate_f_significance(df1, df2, f_statistic);

                Some(FTest {
                    statistic: f_statistic,
                    df1,
                    df2,
                    p_value,
                    note: None,
                    interpretation: Some(
                        "This test is an alternative to the Chi-square based tests and may perform better in small samples. A significant p-value (< 0.05) suggests heteroscedasticity.".to_string()
                    ),
                })
            } else {
                Some(FTest {
                    statistic: f64::NAN,
                    df1,
                    df2,
                    p_value: f64::NAN,
                    note: None,
                    interpretation: Some(
                        "The F-test could not be performed because the degrees of freedom were invalid (e.g., zero or negative), which can happen with very small sample sizes.".to_string()
                    ),
                })
            }
        }
        Err(_) =>
            Some(FTest {
                statistic: f64::NAN,
                df1: 0,
                df2: 0,
                p_value: f64::NAN,
                note: None,
                interpretation: Some(
                    "The F-test could not be performed due to an error in the auxiliary regression.".to_string()
                ),
            }),
    }
}
