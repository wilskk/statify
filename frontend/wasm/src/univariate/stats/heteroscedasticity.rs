use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ BPTest, DesignMatrixInfo, FTest, HeteroscedasticityTests, ModifiedBPTest, WhiteTest },
};
use nalgebra::{ DMatrix, DVector };
use std::collections::HashSet;
use std::f64;

use super::core::*;

pub fn calculate_heteroscedasticity_tests(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HeteroscedasticityTests, String> {
    let design_info = create_design_response_weights(data, config).map_err(|e|
        format!("Failed to create design matrix for main model: {}", e)
    )?;

    if design_info.n_samples == 0 {
        return Err("No data for main model fitting in heteroscedasticity tests.".to_string());
    }

    let ztwz_matrix = create_cross_product_matrix(&design_info).map_err(|e|
        format!("Failed to create Z'WZ matrix for main model: {}", e)
    )?;

    let swept_info = perform_sweep_and_extract_results(
        &ztwz_matrix,
        design_info.p_parameters
    ).map_err(|e| format!("SWEEP failed for main model: {}", e))?;

    // Calculate residuals directly
    let y_hat = &design_info.x * &swept_info.beta_hat;
    let residuals_vec = &design_info.y - &y_hat;
    let n_obs = design_info.n_samples;

    let squared_residuals_data: Vec<f64> = residuals_vec
        .iter()
        .map(|e| e.powi(2))
        .collect();
    let y_aux_for_tests = DVector::from_vec(squared_residuals_data);

    let z_pred_matrix_option = create_predicted_aux_matrix(&y_hat, &design_info, n_obs);

    let mut white_test_result = None;
    let mut bp_test_result = None;
    let mut modified_bp_test_result = None;
    let mut f_test_kb_result = None;

    if config.options.white_test {
        white_test_result = calculate_white_test(&y_aux_for_tests, &design_info, config, n_obs);
    }

    if config.options.brusch_pagan {
        if let Some(z_p) = &z_pred_matrix_option {
            bp_test_result = calculate_bp_test(&y_aux_for_tests, z_p, n_obs, swept_info.s_rss);
        } else {
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

    if config.options.mod_brusch_pagan {
        if let Some(z_p) = &z_pred_matrix_option {
            modified_bp_test_result = calculate_modified_bp_test(&y_aux_for_tests, z_p, n_obs);
        } else {
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

    if config.options.f_test {
        if let Some(z_p) = &z_pred_matrix_option {
            f_test_kb_result = calculate_f_test(&y_aux_for_tests, z_p, n_obs);
        } else {
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

    Ok(HeteroscedasticityTests {
        white: white_test_result,
        breusch_pagan: bp_test_result,
        modified_breusch_pagan: modified_bp_test_result,
        f_test: f_test_kb_result,
    })
}

// Helper to run simple OLS regression and return key statistics
fn run_simple_ols(
    y_aux_vec: &DVector<f64>,
    x_aux_matrix: &DMatrix<f64>
) -> Result<(f64, f64, f64, usize, usize), String> {
    // Returns: (R_sq, ESS, RSS, df_regressors_in_aux_Z, df_residuals_aux)
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

// Create auxiliary matrix for White test
fn create_white_aux_matrix(
    design_info: &DesignMatrixInfo,
    config: &UnivariateConfig,
    n_obs: usize
) -> Result<DMatrix<f64>, String> {
    if n_obs == 0 {
        return Ok(DMatrix::zeros(0, 0));
    }

    let mut aux_cols: Vec<DVector<f64>> = Vec::new();
    let mut existing_col_hashes: HashSet<Vec<u64>> = HashSet::new();

    // Collect original non-intercept predictor columns
    let mut original_non_intercept_predictors: Vec<(usize, DVector<f64>)> = Vec::new();
    for j in 0..design_info.x.ncols() {
        if design_info.intercept_column != Some(j) {
            let col = design_info.x.column(j).into_owned();
            original_non_intercept_predictors.push((j, col.clone()));

            // Add original column
            let hash_repr: Vec<u64> = col
                .iter()
                .map(|&val| val.to_bits())
                .collect();
            if !existing_col_hashes.contains(&hash_repr) {
                existing_col_hashes.insert(hash_repr);
                aux_cols.push(col);
            }
        }
    }

    if original_non_intercept_predictors.is_empty() {
        return if !aux_cols.is_empty() {
            Ok(DMatrix::from_columns(&aux_cols))
        } else {
            Ok(DMatrix::zeros(n_obs, 0))
        };
    }

    // Add squared terms of continuous predictors
    for (original_idx, predictor_col) in &original_non_intercept_predictors {
        // Check if column is continuous
        let is_continuous = if design_info.intercept_column == Some(*original_idx) {
            false
        } else {
            let mut is_cont = false;
            for (term_name, (start_idx, end_idx)) in &design_info.term_column_indices {
                if original_idx >= start_idx && original_idx <= end_idx {
                    if
                        config.main.covar
                            .as_ref()
                            .map_or(false, |covars| covars.contains(term_name))
                    {
                        is_cont = true;
                        break;
                    }
                }
            }
            is_cont
        };

        if is_continuous {
            let squared_col = predictor_col.map(|val| val * val);
            let hash_repr: Vec<u64> = squared_col
                .iter()
                .map(|&val| val.to_bits())
                .collect();
            if !existing_col_hashes.contains(&hash_repr) {
                existing_col_hashes.insert(hash_repr);
                aux_cols.push(squared_col);
            }
        }
    }

    // Add cross-product terms for continuous variables
    for i in 0..original_non_intercept_predictors.len() {
        for k in i + 1..original_non_intercept_predictors.len() {
            let (_, predictor1) = &original_non_intercept_predictors[i];
            let (_, predictor2) = &original_non_intercept_predictors[k];
            let cross_product_col = predictor1.component_mul(predictor2);

            let hash_repr: Vec<u64> = cross_product_col
                .iter()
                .map(|&val| val.to_bits())
                .collect();
            if !existing_col_hashes.contains(&hash_repr) {
                existing_col_hashes.insert(hash_repr);
                aux_cols.push(cross_product_col);
            }
        }
    }

    if aux_cols.is_empty() {
        Ok(DMatrix::zeros(n_obs, 0))
    } else {
        Ok(DMatrix::from_columns(&aux_cols))
    }
}

// Create auxiliary matrix for predicted value tests (BP, Modified BP, F-test)
fn create_predicted_aux_matrix(
    y_hat: &DVector<f64>,
    design_info: &DesignMatrixInfo,
    n_obs: usize
) -> Option<DMatrix<f64>> {
    let mut aux_cols: Vec<DVector<f64>> = Vec::new();
    let mut existing_col_hashes: HashSet<Vec<u64>> = HashSet::new();

    // Use intercept from design matrix if it exists
    if let Some(intercept_idx) = design_info.intercept_column {
        let intercept_col = design_info.x.column(intercept_idx).into_owned();
        let hash_repr: Vec<u64> = intercept_col
            .iter()
            .map(|&val| val.to_bits())
            .collect();
        if !existing_col_hashes.contains(&hash_repr) {
            existing_col_hashes.insert(hash_repr);
            aux_cols.push(intercept_col);
        }
    }

    // Add predicted values
    let hash_repr: Vec<u64> = y_hat
        .iter()
        .map(|&val| val.to_bits())
        .collect();
    if !existing_col_hashes.contains(&hash_repr) {
        existing_col_hashes.insert(hash_repr);
        aux_cols.push(y_hat.clone_owned());
    }

    if !aux_cols.is_empty() && aux_cols[0].len() == n_obs {
        Some(DMatrix::from_columns(&aux_cols))
    } else {
        None
    }
}

// Calculate White test
fn calculate_white_test(
    y_aux: &DVector<f64>,
    design_info: &DesignMatrixInfo,
    config: &UnivariateConfig,
    n_obs: usize
) -> Option<WhiteTest> {
    if design_info.p_parameters - (if design_info.intercept_column.is_some() { 1 } else { 0 }) == 0 {
        return Some(WhiteTest {
            statistic: 0.0,
            df: 0,
            p_value: 1.0,
            note: vec![
                "White test not applicable: No non-intercept predictors in the main model.".to_string()
            ],
        });
    }

    match create_white_aux_matrix(design_info, config, n_obs) {
        Ok(z_white) => {
            if z_white.ncols() <= 1 {
                return Some(WhiteTest {
                    statistic: 0.0,
                    df: 0,
                    p_value: 1.0,
                    note: vec![
                        "White test: Auxiliary model only contains an intercept.".to_string()
                    ],
                });
            }

            match run_simple_ols(y_aux, &z_white) {
                Ok((r_sq_aux, _, _, k_total_aux_white, _)) => {
                    let lm_statistic_white = (n_obs as f64) * r_sq_aux;
                    let df_chi_sq_white = k_total_aux_white.saturating_sub(1);

                    if df_chi_sq_white > 0 {
                        let p_value_white = calculate_chi_sq_significance(
                            lm_statistic_white,
                            df_chi_sq_white as u64
                        );
                        Some(WhiteTest {
                            statistic: lm_statistic_white,
                            df: df_chi_sq_white,
                            p_value: p_value_white,
                            note: vec![
                                "Auxiliary regression on original predictors (and their squares/cross-products if applicable).".to_string()
                            ],
                        })
                    } else {
                        Some(WhiteTest {
                            statistic: 0.0,
                            df: 0,
                            p_value: 1.0,
                            note: vec![
                                "White test: No non-intercept regressors in aux model.".to_string()
                            ],
                        })
                    }
                }
                Err(e) =>
                    Some(WhiteTest {
                        statistic: f64::NAN,
                        df: 0,
                        p_value: f64::NAN,
                        note: vec![format!("White test aux regression failed: {}", e)],
                    }),
            }
        }
        Err(e) =>
            Some(WhiteTest {
                statistic: f64::NAN,
                df: 0,
                p_value: f64::NAN,
                note: vec![format!("Failed to create White test aux matrix: {}", e)],
            }),
    }
}

// Calculate Breusch-Pagan test
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
            note: vec![
                "BP Test (on Z_pred): Aux model (intercept, y_hat) has < 2 distinct columns.".to_string()
            ],
        });
    }

    match run_simple_ols(y_aux, z_pred) {
        Ok((_, ess_aux, _, k_total_aux, _)) => {
            let sigma_sq_mle_main = if n_obs > 0 {
                rss_main_model / (n_obs as f64)
            } else {
                f64::NAN
            };

            if sigma_sq_mle_main.is_nan() || sigma_sq_mle_main.abs() < 1e-12 {
                return Some(BPTest {
                    statistic: f64::NAN,
                    df: k_total_aux.saturating_sub(1),
                    p_value: f64::NAN,
                    note: vec![
                        "BP Test (on Z_pred): Main model sigma^2 (MLE) is zero or NaN.".to_string()
                    ],
                });
            }

            let bp_statistic_val = ess_aux / (2.0 * sigma_sq_mle_main.powi(2));
            let df_chi_sq_bp_val = k_total_aux.saturating_sub(1);

            if df_chi_sq_bp_val > 0 {
                let p_value_bp_val = calculate_chi_sq_significance(
                    bp_statistic_val,
                    df_chi_sq_bp_val as u64
                );
                Some(BPTest {
                    statistic: bp_statistic_val,
                    df: df_chi_sq_bp_val,
                    p_value: p_value_bp_val,
                    note: vec![
                        "Breusch-Pagan test (ESS_aux/(2*sigma_main_mle^2)). Aux reg on predicted y.".to_string()
                    ],
                })
            } else {
                Some(BPTest {
                    statistic: 0.0,
                    df: 0,
                    p_value: 1.0,
                    note: vec![
                        "BP Test (on Z_pred): No non-intercept regressors in aux model.".to_string()
                    ],
                })
            }
        }
        Err(e) =>
            Some(BPTest {
                statistic: f64::NAN,
                df: 0,
                p_value: f64::NAN,
                note: vec![format!("BP test (on Z_pred) aux regression failed: {}", e)],
            }),
    }
}

// Calculate Modified Breusch-Pagan test
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
            note: vec![
                "ModBP (N*R-sq on Z_pred): Aux model (intercept,y_hat) has < 2 distinct columns.".to_string()
            ],
        });
    }

    match run_simple_ols(y_aux, z_pred) {
        Ok((r_sq_aux, _, _, k_total_aux, _)) => {
            let lm_statistic_modbp = (n_obs as f64) * r_sq_aux;
            let df_chi_sq_modbp = k_total_aux.saturating_sub(1);

            if df_chi_sq_modbp > 0 {
                let p_value_modbp = calculate_chi_sq_significance(
                    lm_statistic_modbp,
                    df_chi_sq_modbp as u64
                );
                Some(ModifiedBPTest {
                    statistic: lm_statistic_modbp,
                    df: df_chi_sq_modbp,
                    p_value: p_value_modbp,
                    note: vec![
                        "Modified Breusch-Pagan (N*R-sq version). Auxiliary regression on predicted y.".to_string()
                    ],
                })
            } else {
                Some(ModifiedBPTest {
                    statistic: 0.0,
                    df: 0,
                    p_value: 1.0,
                    note: vec![
                        "Modified BP (N*R-sq on Z_pred): No non-intercept terms in aux model.".to_string()
                    ],
                })
            }
        }
        Err(e) =>
            Some(ModifiedBPTest {
                statistic: f64::NAN,
                df: 0,
                p_value: f64::NAN,
                note: vec![format!("Modified BP (N*R-sq on Z_pred) aux regression failed: {}", e)],
            }),
    }
}

// Calculate F-test
fn calculate_f_test(y_aux: &DVector<f64>, z_pred: &DMatrix<f64>, n_obs: usize) -> Option<FTest> {
    if z_pred.ncols() < 2 {
        return Some(FTest {
            statistic: f64::NAN,
            df1: 0,
            df2: n_obs.saturating_sub(z_pred.ncols()),
            p_value: f64::NAN,
            note: vec![
                "F-Test (on Z_pred): Aux model (intercept,y_hat) has < 2 distinct columns.".to_string()
            ],
        });
    }

    match run_simple_ols(y_aux, z_pred) {
        Ok((r_sq_aux, _, _, k_total_aux, df_res_aux)) => {
            let df1_f = k_total_aux.saturating_sub(1);
            let df2_f = df_res_aux;

            if df1_f > 0 && df2_f > 0 {
                let f_statistic_val =
                    r_sq_aux / (df1_f as f64) / ((1.0 - r_sq_aux) / (df2_f as f64));
                let p_value_f_val = calculate_f_significance(df1_f, df2_f, f_statistic_val);
                Some(FTest {
                    statistic: f_statistic_val,
                    df1: df1_f,
                    df2: df2_f,
                    p_value: p_value_f_val,
                    note: vec!["F-test. Auxiliary regression on predicted y.".to_string()],
                })
            } else {
                Some(FTest {
                    statistic: f64::NAN,
                    df1: df1_f,
                    df2: df2_f,
                    p_value: f64::NAN,
                    note: vec!["F-Test (on Z_pred): df1 or df2 is zero.".to_string()],
                })
            }
        }
        Err(e) =>
            Some(FTest {
                statistic: f64::NAN,
                df1: 0,
                df2: 0,
                p_value: f64::NAN,
                note: vec![format!("F-test (on Z_pred) aux regression failed: {}", e)],
            }),
    }
}
