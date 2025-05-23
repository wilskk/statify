use crate::univariate::models::{
    config::UnivariateConfig,
    data::{ AnalysisData },
    result::{ BPTest, FTest, HeteroscedasticityTests, ModifiedBPTest, WhiteTest },
};
use nalgebra::{ DMatrix, DVector };
use std::collections::{ HashMap, HashSet };
use web_sys::console; // Add this for logging

use super::core::*;

// Helper to convert f64 column to a hashable representation for uniqueness check
fn col_to_hashable_repr(col: &DVector<f64>) -> Vec<u64> {
    col.iter()
        .map(|&val| val.to_bits())
        .collect()
}

// Helper to check if a column in the design matrix corresponds to a continuous covariate
fn col_is_continuous(
    original_col_idx_in_x: usize, // Index in the original design_info.x
    design_info: &DesignMatrixInfo,
    config: &UnivariateConfig
) -> bool {
    if design_info.intercept_column == Some(original_col_idx_in_x) {
        return false; // Intercept is not a continuous covariate for squaring/interactions
    }
    for (term_name, (start_idx, end_idx)) in &design_info.term_column_indices {
        if original_col_idx_in_x >= *start_idx && original_col_idx_in_x <= *end_idx {
            // Check if this term_name is listed in config.main.covar
            if config.main.covar.as_ref().map_or(false, |covars| covars.contains(term_name)) {
                // Additional check: ensure the term itself is not a factor that expanded into multiple columns
                // where this specific column is just one of its dummy variables.
                // A simple check is if the term associated with this column produces only one column.
                // More robust: check if term_name is directly in covar list.
                return true;
            }
        }
    }
    false
}

fn run_simple_ols(
    y_aux_vec: &DVector<f64>,
    x_aux_matrix: &DMatrix<f64>
) -> Result<(f64, f64, f64, usize, usize), String> {
    // R_sq, ESS, RSS, df_regressors_in_aux_Z, df_residuals_aux
    let n_obs = y_aux_vec.len();
    if n_obs == 0 {
        return Ok((0.0, 0.0, 0.0, 0, 0));
    }
    if x_aux_matrix.nrows() != n_obs {
        return Err(format!("Aux OLS: X nrows ({}) != Y len ({}).", x_aux_matrix.nrows(), n_obs));
    }

    if x_aux_matrix.ncols() == 0 {
        // No regressors in auxiliary model. R^2 = 0.
        // RSS becomes TSS of y_aux_vec if we consider a model with no predictors.
        let y_mean_aux = y_aux_vec.mean();
        let rss = y_aux_vec
            .iter()
            .map(|&yi| (yi - y_mean_aux).powi(2))
            .sum::<f64>();
        return Ok((0.0, 0.0, rss, 0, n_obs)); // df_regressors = 0, df_residuals = N
    }

    let xtx = x_aux_matrix.transpose() * x_aux_matrix;
    let xtx_inv = xtx
        .svd(true, true)
        .pseudo_inverse(1e-10)
        .map_err(|e| format!("Matrix pseudo-inversion failed in run_simple_ols: {}", e))?;
    let beta_aux = &xtx_inv * x_aux_matrix.transpose() * y_aux_vec;
    let y_hat_aux = x_aux_matrix * beta_aux;
    let residuals_aux_vec = y_aux_vec - &y_hat_aux;

    let y_mean_aux = y_aux_vec.mean();
    let ess = y_hat_aux
        .iter()
        .map(|&yh| (yh - y_mean_aux).powi(2))
        .sum::<f64>();
    let rss = residuals_aux_vec
        .iter()
        .map(|&e| e.powi(2))
        .sum::<f64>();
    let tss = y_aux_vec
        .iter()
        .map(|&yi| (yi - y_mean_aux).powi(2))
        .sum::<f64>();
    let r_squared = if tss.abs() < 1e-9 { 0.0 } else { ess / tss };

    let df_regressors_in_z = x_aux_matrix.ncols(); // Total number of columns in the auxiliary design matrix Z
    let df_residuals = n_obs.saturating_sub(df_regressors_in_z);

    Ok((r_squared.max(0.0).min(1.0), ess, rss, df_regressors_in_z, df_residuals))
}

fn create_white_aux_matrix(
    design_info: &DesignMatrixInfo,
    config: &UnivariateConfig,
    n_obs: usize
) -> Result<DMatrix<f64>, String> {
    console::log_1(&"[create_white_aux_matrix] Entry".into());
    if n_obs == 0 {
        console::log_1(&"[create_white_aux_matrix] n_obs is 0, returning empty matrix".into());
        return Ok(DMatrix::zeros(0, 0));
    }

    let mut aux_cols: Vec<DVector<f64>> = Vec::new();
    let mut existing_col_hashes: HashSet<Vec<u64>> = HashSet::new();

    let try_add_col = |
        col_name: &str,
        col: DVector<f64>,
        cols_list: &mut Vec<DVector<f64>>,
        hashes_set: &mut HashSet<Vec<u64>>
    | {
        if col.iter().all(|x| x.is_finite()) {
            let hash_repr = col_to_hashable_repr(&col);
            if !hashes_set.contains(&hash_repr) {
                hashes_set.insert(hash_repr);
                cols_list.push(col);
                // console::log_1(&format!("[create_white_aux_matrix] Added column: {}, Total aux_cols: {}", col_name, cols_list.len()).into());
            } else {
                // console::log_1(&format!("[create_white_aux_matrix] Skipped duplicate column: {}", col_name).into());
            }
        }
    };

    // 1. Add intercept
    let intercept_col = DVector::from_element(n_obs, 1.0);
    try_add_col("Intercept", intercept_col, &mut aux_cols, &mut existing_col_hashes);
    console::log_1(
        &format!(
            "[create_white_aux_matrix] After adding intercept, aux_cols: {}",
            aux_cols.len()
        ).into()
    );

    // Collect original non-intercept predictor columns and their original indices
    let mut original_non_intercept_predictors: Vec<(usize, DVector<f64>)> = Vec::new();
    for j in 0..design_info.x.ncols() {
        if design_info.intercept_column != Some(j) {
            let col = design_info.x.column(j).into_owned();
            original_non_intercept_predictors.push((j, col.clone()));
            // 2. Add original non-intercept predictors
            try_add_col(&format!("OrigPred_{}", j), col, &mut aux_cols, &mut existing_col_hashes);
        }
    }
    console::log_1(
        &format!(
            "[create_white_aux_matrix] Added {} original non-intercept predictors. Total aux_cols: {}",
            original_non_intercept_predictors.len(),
            aux_cols.len()
        ).into()
    );

    if original_non_intercept_predictors.is_empty() {
        console::log_1(&"[create_white_aux_matrix] No original non-intercept predictors.".into());
        if !aux_cols.is_empty() {
            return Ok(DMatrix::from_columns(&aux_cols));
        } else {
            return Ok(DMatrix::zeros(n_obs, 0));
        }
    }

    // 3. Add squared terms of continuous original predictors
    let mut squared_terms_added = 0;
    for (original_idx, predictor_col) in &original_non_intercept_predictors {
        if col_is_continuous(*original_idx, design_info, config) {
            let squared_col = predictor_col.map(|val| val * val);
            try_add_col(
                &format!("SquaredPred_{}", original_idx),
                squared_col,
                &mut aux_cols,
                &mut existing_col_hashes
            );
            squared_terms_added += 1;
        }
    }
    console::log_1(
        &format!(
            "[create_white_aux_matrix] Added {} squared terms. Total aux_cols: {}",
            squared_terms_added,
            aux_cols.len()
        ).into()
    );

    // 4. Add unique cross-product terms ONLY if continuous variables were present (i.e., squared terms were added)
    //    If only factor variables are present, their interactions are typically already handled by the original design matrix if it's a full model.
    //    This adjustment helps match SPSS White test df for factor-only models where original X effectively serves as White's Z.
    let mut cp_terms_added = 0;
    if squared_terms_added > 0 {
        console::log_1(
            &"[create_white_aux_matrix] Continuous variables present, attempting to add cross-products.".into()
        );
        for i in 0..original_non_intercept_predictors.len() {
            for k in i + 1..original_non_intercept_predictors.len() {
                let (orig_idx1, predictor1) = &original_non_intercept_predictors[i];
                let (orig_idx2, predictor2) = &original_non_intercept_predictors[k];
                let cross_product_col = predictor1.component_mul(predictor2);
                let initial_len = aux_cols.len();
                try_add_col(
                    &format!("CP_{}_{}", orig_idx1, orig_idx2),
                    cross_product_col,
                    &mut aux_cols,
                    &mut existing_col_hashes
                );
                if aux_cols.len() > initial_len {
                    cp_terms_added += 1;
                }
            }
        }
    } else {
        console::log_1(
            &"[create_white_aux_matrix] No continuous variables (no squared terms added), skipping cross-products for White test.".into()
        );
    }
    console::log_1(
        &format!(
            "[create_white_aux_matrix] Added {} cross-product terms. Final aux_cols: {}",
            cp_terms_added,
            aux_cols.len()
        ).into()
    );

    if aux_cols.is_empty() {
        Ok(DMatrix::zeros(n_obs, 0))
    } else {
        Ok(DMatrix::from_columns(&aux_cols))
    }
}

// Static helper for adding columns to the z_aux_predicted_matrix
fn try_add_z_aux_predicted_col(
    _col_name: &str, // Currently not used for logging in this static version
    col: DVector<f64>,
    cols_list: &mut Vec<DVector<f64>>,
    hashes_set: &mut HashSet<Vec<u64>>
) {
    if col.iter().all(|x| x.is_finite()) {
        let hash_repr = col_to_hashable_repr(&col);
        if !hashes_set.contains(&hash_repr) {
            hashes_set.insert(hash_repr);
            cols_list.push(col);
        }
    }
}

pub fn calculate_heteroscedasticity_tests(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HeteroscedasticityTests, String> {
    console::log_1(&"[calc_hetero_tests] Entry V3".into());

    let design_info = create_design_response_weights(data, config).map_err(|e|
        format!("Failed to create design matrix for main model: {}", e)
    )?;
    console::log_1(
        &format!(
            "[calc_hetero_tests] design_info.n_samples: {}, design_info.p_parameters: {}",
            design_info.n_samples,
            design_info.p_parameters
        ).into()
    );

    if design_info.n_samples == 0 {
        return Err("No data for main model fitting in heteroscedasticity tests.".to_string());
    }
    let p_parameters_main_model_slopes =
        design_info.p_parameters - (if design_info.intercept_column.is_some() { 1 } else { 0 });
    console::log_1(
        &format!("[calc_hetero_tests] p_parameters_main_model_slopes: {}", p_parameters_main_model_slopes).into()
    );

    let ztwz_matrix = create_cross_product_matrix(&design_info).map_err(|e|
        format!("Failed to create Z'WZ matrix for main model: {}", e)
    )?;
    let swept_info = perform_sweep_and_extract_results(
        &ztwz_matrix,
        design_info.p_parameters
    ).map_err(|e| format!("SWEEP failed for main model: {}", e))?;

    let y_hat = &design_info.x * &swept_info.beta_hat;
    let residuals_vec = &design_info.y - y_hat.clone();
    let n_obs = design_info.n_samples;

    let squared_residuals_data: Vec<f64> = residuals_vec
        .iter()
        .map(|e| e.powi(2))
        .collect();
    let y_aux_for_tests = DVector::from_vec(squared_residuals_data);
    console::log_1(
        &format!("[calc_hetero_tests] y_aux_for_tests length: {}", y_aux_for_tests.len()).into()
    );

    let mut white_test_result = None;
    let mut bp_test_result = None;
    let mut modified_bp_test_result = None;
    let mut f_test_kb_result = None;

    // --- White Test --- (Correctly matches df=11 for factor-only models now)
    if config.options.white_test {
        console::log_1(&"[calc_hetero_tests] Starting White Test calculation".into());
        if p_parameters_main_model_slopes == 0 {
            white_test_result = Some(WhiteTest {
                statistic: 0.0,
                df: 0,
                p_value: 1.0,
                note: vec![
                    "White test not applicable: No non-intercept predictors in the main model.".to_string()
                ],
            });
        } else {
            match create_white_aux_matrix(&design_info, config, n_obs) {
                Ok(z_white) => {
                    console::log_1(
                        &format!(
                            "[calc_hetero_tests] White Test: z_white.ncols: {}, z_white.nrows: {}",
                            z_white.ncols(),
                            z_white.nrows()
                        ).into()
                    );
                    if z_white.ncols() > 0 && z_white.nrows() == n_obs {
                        if z_white.ncols() <= 1 {
                            white_test_result = Some(WhiteTest {
                                statistic: 0.0,
                                df: 0,
                                p_value: 1.0,
                                note: vec![
                                    "White test: Auxiliary model only contains an intercept.".to_string()
                                ],
                            });
                        } else {
                            match run_simple_ols(&y_aux_for_tests, &z_white) {
                                Ok(
                                    (r_sq_aux, _ess, _rss, k_total_aux_white, _df_res_aux_white),
                                ) => {
                                    console::log_1(
                                        &format!(
                                            "[calc_hetero_tests] White Test OLS: r_sq_aux: {}, k_total_aux_white: {}",
                                            r_sq_aux,
                                            k_total_aux_white
                                        ).into()
                                    );
                                    let lm_statistic_white = (n_obs as f64) * r_sq_aux;
                                    let df_chi_sq_white = k_total_aux_white.saturating_sub(1);
                                    console::log_1(
                                        &format!(
                                            "[calc_hetero_tests] White Test: lm_statistic: {}, df: {}",
                                            lm_statistic_white,
                                            df_chi_sq_white
                                        ).into()
                                    );
                                    if df_chi_sq_white > 0 {
                                        let p_value_white = calculate_chi_sq_significance(
                                            lm_statistic_white,
                                            df_chi_sq_white as u64
                                        );
                                        white_test_result = Some(WhiteTest {
                                            statistic: lm_statistic_white,
                                            df: df_chi_sq_white,
                                            p_value: p_value_white,
                                            note: vec![
                                                "Auxiliary regression on original predictors (and their squares/cross-products if applicable).".to_string()
                                            ],
                                        });
                                    } else {
                                        white_test_result = Some(WhiteTest {
                                            statistic: 0.0,
                                            df: 0,
                                            p_value: 1.0,
                                            note: vec![
                                                "White test: No non-intercept regressors in aux model.".to_string()
                                            ],
                                        });
                                    }
                                }
                                Err(e) => {
                                    console::log_1(
                                        &format!("[calc_hetero_tests] White Test OLS Error: {}", e).into()
                                    );
                                    white_test_result = Some(WhiteTest {
                                        statistic: f64::NAN,
                                        df: 0,
                                        p_value: f64::NAN,
                                        note: vec![
                                            format!("White test aux regression failed: {}", e)
                                        ],
                                    });
                                }
                            }
                        }
                    } else {
                        console::log_1(
                            &"[calc_hetero_tests] White Test: Z_white was empty or mismatched.".into()
                        );
                        white_test_result = Some(WhiteTest {
                            statistic: f64::NAN,
                            df: 0,
                            p_value: f64::NAN,
                            note: vec![
                                "White test: Aux design matrix Z_white empty/mismatched.".to_string()
                            ],
                        });
                    }
                }
                Err(e) => {
                    console::log_1(
                        &format!("[calc_hetero_tests] White Test create_white_aux_matrix Error: {}", e).into()
                    );
                    white_test_result = Some(WhiteTest {
                        statistic: f64::NAN,
                        df: 0,
                        p_value: f64::NAN,
                        note: vec![format!("Failed to create White test aux matrix: {}", e)],
                    });
                }
            }
        }
    }
    console::log_1(
        &format!("[calc_hetero_tests] White Test Result: {:?}", white_test_result).into()
    );

    // --- Auxiliary matrix Z_pred = [intercept, y_hat] ---
    // This is used for specific versions of BP and F-test to match reference images.
    let y_hat_col_for_pred_tests = y_hat.clone_owned();
    let intercept_col_for_pred_tests = DVector::from_element(n_obs, 1.0);
    let mut z_aux_predicted_cols_vec: Vec<DVector<f64>> = Vec::new();
    let mut z_aux_predicted_hashes_set: HashSet<Vec<u64>> = HashSet::new();

    try_add_z_aux_predicted_col(
        "Intercept_pred",
        intercept_col_for_pred_tests,
        &mut z_aux_predicted_cols_vec,
        &mut z_aux_predicted_hashes_set
    );
    try_add_z_aux_predicted_col(
        "y_hat_pred",
        y_hat_col_for_pred_tests,
        &mut z_aux_predicted_cols_vec,
        &mut z_aux_predicted_hashes_set
    );

    let z_pred_matrix_option = if
        !z_aux_predicted_cols_vec.is_empty() &&
        z_aux_predicted_cols_vec[0].len() == n_obs
    {
        Some(DMatrix::from_columns(&z_aux_predicted_cols_vec))
    } else {
        None
    };
    console::log_1(
        &format!(
            "[calc_hetero_tests] z_pred_matrix_option.is_some(): {}, ncols: {}",
            z_pred_matrix_option.is_some(),
            z_pred_matrix_option.as_ref().map_or(0, |m| m.ncols())
        ).into()
    );

    // --- Breusch-Pagan Test (Using Z_pred = [intercept, y_hat], specific formula ESS_aux / (2 * (RSS_main_mle)^2)) ---
    if config.options.brusch_pagan {
        console::log_1(
            &"[calc_hetero_tests] Starting Breusch-Pagan Test (on Z_pred, specific formula)".into()
        );
        if let Some(z_p) = &z_pred_matrix_option {
            if z_p.ncols() >= 2 {
                // Need intercept and y_hat
                match run_simple_ols(&y_aux_for_tests, z_p) {
                    Ok((_r_sq_aux, ess_aux, _rss_aux, k_total_aux, _df_res_aux)) => {
                        console::log_1(
                            &format!(
                                "[calc_hetero_tests] BP Test (on Z_pred) OLS: ess_aux: {}, k_total_aux: {}",
                                ess_aux,
                                k_total_aux
                            ).into()
                        );
                        let rss_main_model = swept_info.s_rss;
                        let sigma_sq_mle_main = if n_obs > 0 {
                            rss_main_model / (n_obs as f64)
                        } else {
                            f64::NAN
                        };
                        console::log_1(
                            &format!(
                                "[calc_hetero_tests] BP Test (on Z_pred): rss_main_model: {}, sigma_sq_mle_main: {}",
                                rss_main_model,
                                sigma_sq_mle_main
                            ).into()
                        );

                        if sigma_sq_mle_main.is_nan() || sigma_sq_mle_main.abs() < 1e-12 {
                            bp_test_result = Some(BPTest {
                                statistic: f64::NAN,
                                df: k_total_aux.saturating_sub(1),
                                p_value: f64::NAN,
                                note: vec![
                                    "BP Test (on Z_pred): Main model sigma^2 (MLE) is zero or NaN.".to_string()
                                ],
                            });
                        } else {
                            let bp_statistic_val = ess_aux / (2.0 * sigma_sq_mle_main.powi(2));
                            let df_chi_sq_bp_val = k_total_aux.saturating_sub(1);
                            console::log_1(
                                &format!(
                                    "[calc_hetero_tests] BP Test (on Z_pred): bp_statistic: {}, df: {}",
                                    bp_statistic_val,
                                    df_chi_sq_bp_val
                                ).into()
                            );

                            if df_chi_sq_bp_val > 0 {
                                let p_value_bp_val = calculate_chi_sq_significance(
                                    bp_statistic_val,
                                    df_chi_sq_bp_val as u64
                                );
                                bp_test_result = Some(BPTest {
                                    statistic: bp_statistic_val,
                                    df: df_chi_sq_bp_val,
                                    p_value: p_value_bp_val,
                                    note: vec![
                                        "Breusch-Pagan test (ESS_aux/(2*sigma_main_mle^2)). Aux reg on predicted y.".to_string()
                                    ],
                                });
                            } else {
                                bp_test_result = Some(BPTest {
                                    statistic: 0.0,
                                    df: 0,
                                    p_value: 1.0,
                                    note: vec![
                                        "BP Test (on Z_pred): No non-intercept regressors in aux model.".to_string()
                                    ],
                                });
                            }
                        }
                    }
                    Err(e) => {
                        console::log_1(
                            &format!("[calc_hetero_tests] BP Test (on Z_pred) OLS Error: {}", e).into()
                        );
                        bp_test_result = Some(BPTest {
                            statistic: f64::NAN,
                            df: 0,
                            p_value: f64::NAN,
                            note: vec![format!("BP test (on Z_pred) aux regression failed: {}", e)],
                        });
                    }
                }
            } else {
                bp_test_result = Some(BPTest {
                    statistic: 0.0,
                    df: 0,
                    p_value: 1.0,
                    note: vec![
                        "BP Test (on Z_pred): Aux model (intercept, y_hat) has < 2 distinct columns.".to_string()
                    ],
                });
            }
        } else {
            console::log_1(
                &"[calc_hetero_tests] BP Test (on Z_pred): z_pred_matrix_option was None.".into()
            );
            bp_test_result = Some(BPTest {
                statistic: f64::NAN,
                df: 0,
                p_value: f64::NAN,
                note: vec![
                    "BP Test (on Z_pred): Failed to construct aux matrix from predicted values.".to_string()
                ],
            });
        }
    }
    console::log_1(
        &format!("[calc_hetero_tests] BP Test (on Z_pred) Result: {:?}", bp_test_result).into()
    );

    // --- F-Test (Using Z_pred = [intercept, y_hat]) ---
    if config.options.f_test {
        console::log_1(&"[calc_hetero_tests] Starting F-Test (on Z_pred)".into());
        if let Some(z_p) = &z_pred_matrix_option {
            if z_p.ncols() >= 2 {
                // Need intercept and y_hat
                match run_simple_ols(&y_aux_for_tests, z_p) {
                    Ok((r_sq_aux, _ess, _rss, k_total_aux, df_res_aux)) => {
                        console::log_1(
                            &format!(
                                "[calc_hetero_tests] F-Test (on Z_pred) OLS: r_sq_aux: {}, k_total_aux: {}, df_res_aux: {}",
                                r_sq_aux,
                                k_total_aux,
                                df_res_aux
                            ).into()
                        );
                        let df1_f = k_total_aux.saturating_sub(1);
                        let df2_f = df_res_aux;
                        console::log_1(
                            &format!(
                                "[calc_hetero_tests] F-Test (on Z_pred): df1: {}, df2: {}",
                                df1_f,
                                df2_f
                            ).into()
                        );

                        if df1_f > 0 && df2_f > 0 {
                            let f_statistic_val =
                                r_sq_aux / (df1_f as f64) / ((1.0 - r_sq_aux) / (df2_f as f64));
                            let p_value_f_val = calculate_f_significance(
                                df1_f,
                                df2_f,
                                f_statistic_val
                            );
                            f_test_kb_result = Some(FTest {
                                statistic: f_statistic_val,
                                df1: df1_f,
                                df2: df2_f,
                                p_value: p_value_f_val,
                                note: vec![
                                    "F-test. Auxiliary regression on predicted y.".to_string()
                                ],
                            });
                        } else {
                            f_test_kb_result = Some(FTest {
                                statistic: f64::NAN,
                                df1: df1_f,
                                df2: df2_f,
                                p_value: f64::NAN,
                                note: vec!["F-Test (on Z_pred): df1 or df2 is zero.".to_string()],
                            });
                        }
                    }
                    Err(e) => {
                        console::log_1(
                            &format!("[calc_hetero_tests] F-Test (on Z_pred) OLS Error: {}", e).into()
                        );
                        f_test_kb_result = Some(FTest {
                            statistic: f64::NAN,
                            df1: 0,
                            df2: 0,
                            p_value: f64::NAN,
                            note: vec![format!("F-test (on Z_pred) aux regression failed: {}", e)],
                        });
                    }
                }
            } else {
                f_test_kb_result = Some(FTest {
                    statistic: f64::NAN,
                    df1: 0,
                    df2: n_obs.saturating_sub(z_p.ncols()),
                    p_value: f64::NAN,
                    note: vec![
                        "F-Test (on Z_pred): Aux model (intercept,y_hat) has < 2 distinct columns.".to_string()
                    ],
                });
            }
        } else {
            console::log_1(
                &"[calc_hetero_tests] F-Test (on Z_pred): z_pred_matrix_option was None.".into()
            );
            f_test_kb_result = Some(FTest {
                statistic: f64::NAN,
                df1: 0,
                df2: 0,
                p_value: f64::NAN,
                note: vec![
                    "F-Test (on Z_pred): Failed to construct aux matrix from predicted values.".to_string()
                ],
            });
        }
    }
    console::log_1(
        &format!("[calc_hetero_tests] F-Test (on Z_pred) Result: {:?}", f_test_kb_result).into()
    );

    // --- Modified Breusch-Pagan Test (N*R-sq version, using Z_pred = [intercept, y_hat]) ---
    // This matches the reference image for "Modified Breusch-Pagan Test" and is already correct.
    if config.options.mod_brusch_pagan {
        console::log_1(&"[calc_hetero_tests] Starting Modified BP Test (N*R-sq on Z_pred)".into());
        if let Some(z_p) = &z_pred_matrix_option {
            if z_p.ncols() >= 2 {
                // Need intercept and y_hat
                match run_simple_ols(&y_aux_for_tests, z_p) {
                    Ok((r_sq_aux, _ess, _rss, k_total_aux, _df_res_aux)) => {
                        console::log_1(
                            &format!(
                                "[calc_hetero_tests] ModBP (N*R-sq on Z_pred) OLS: r_sq_aux: {}, k_total_aux: {}",
                                r_sq_aux,
                                k_total_aux
                            ).into()
                        );
                        let lm_statistic_modbp = (n_obs as f64) * r_sq_aux;
                        let df_chi_sq_modbp = k_total_aux.saturating_sub(1);
                        console::log_1(
                            &format!(
                                "[calc_hetero_tests] ModBP (N*R-sq on Z_pred): lm_statistic: {}, df: {}",
                                lm_statistic_modbp,
                                df_chi_sq_modbp
                            ).into()
                        );

                        if df_chi_sq_modbp > 0 {
                            let p_value_modbp = calculate_chi_sq_significance(
                                lm_statistic_modbp,
                                df_chi_sq_modbp as u64
                            );
                            modified_bp_test_result = Some(ModifiedBPTest {
                                statistic: lm_statistic_modbp,
                                df: df_chi_sq_modbp,
                                p_value: p_value_modbp,
                                note: vec![
                                    "Modified Breusch-Pagan (N*R-sq version). Auxiliary regression on predicted y.".to_string()
                                ],
                            });
                        } else {
                            modified_bp_test_result = Some(ModifiedBPTest {
                                statistic: 0.0,
                                df: 0,
                                p_value: 1.0,
                                note: vec![
                                    "Modified BP (N*R-sq on Z_pred): No non-intercept terms in aux model.".to_string()
                                ],
                            });
                        }
                    }
                    Err(e) => {
                        console::log_1(
                            &format!("[calc_hetero_tests] ModBP (N*R-sq on Z_pred) OLS Error: {}", e).into()
                        );
                        modified_bp_test_result = Some(ModifiedBPTest {
                            statistic: f64::NAN,
                            df: 0,
                            p_value: f64::NAN,
                            note: vec![
                                format!("Modified BP (N*R-sq on Z_pred) aux regression failed: {}", e)
                            ],
                        });
                    }
                }
            } else {
                modified_bp_test_result = Some(ModifiedBPTest {
                    statistic: 0.0,
                    df: 0,
                    p_value: 1.0,
                    note: vec![
                        "ModBP (N*R-sq on Z_pred): Aux model (intercept,y_hat) has < 2 distinct columns.".to_string()
                    ],
                });
            }
        } else {
            console::log_1(
                &"[calc_hetero_tests] ModBP (N*R-sq on Z_pred): z_pred_matrix_option was None.".into()
            );
            modified_bp_test_result = Some(ModifiedBPTest {
                statistic: f64::NAN,
                df: 0,
                p_value: f64::NAN,
                note: vec![
                    "Modified BP (N*R-sq on Z_pred): Failed to construct aux matrix.".to_string()
                ],
            });
        }
    }
    console::log_1(
        &format!(
            "[calc_hetero_tests] ModBP (N*R-sq on Z_pred) Result: {:?}",
            modified_bp_test_result
        ).into()
    );

    Ok(HeteroscedasticityTests {
        white: white_test_result,
        breusch_pagan: bp_test_result,
        modified_breusch_pagan: modified_bp_test_result,
        f_test: f_test_kb_result,
    })
}
