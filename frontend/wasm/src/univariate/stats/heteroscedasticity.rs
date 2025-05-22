use crate::univariate::models::{
    config::UnivariateConfig,
    data::{ AnalysisData },
    result::{ BPTest, FTest, HeteroscedasticityTests, ModifiedBPTest, WhiteTest },
};
use nalgebra::{ DMatrix, DVector };
use std::collections::HashMap;

use super::core::*;

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
        let y_mean_aux = y_aux_vec.mean();
        let rss = y_aux_vec
            .iter()
            .map(|&yi| (yi - y_mean_aux).powi(2))
            .sum::<f64>();
        // For intercept-only aux model, R^2=0, ESS=0. df_regressors (slopes) = 0. df_residuals = N-1 (if intercept was conceptually there).
        // If x_aux_matrix is truly empty (no intercept either), then this is more like TSS.
        // Let's assume if ncols=0, it's an empty model, not intercept-only.
        return Ok((0.0, 0.0, rss, 0, n_obs));
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
    if design_info.p_parameters == 0 {
        return Err(
            "No predictors in main model; cannot compute residuals for heteroscedasticity tests.".to_string()
        );
    }

    let ztwz_matrix = create_cross_product_matrix(&design_info).map_err(|e|
        format!("Failed to create Z'WZ matrix for main model: {}", e)
    )?;
    let swept_info = perform_sweep_and_extract_results(
        &ztwz_matrix,
        design_info.p_parameters
    ).map_err(|e| format!("SWEEP failed for main model: {}", e))?;

    let y_hat = &design_info.x * &swept_info.beta_hat;
    let residuals_vec = &design_info.y - y_hat;
    let n_obs = design_info.n_samples;

    let squared_residuals_data: Vec<f64> = residuals_vec
        .iter()
        .map(|e| e.powi(2))
        .collect();
    let y_aux_for_tests = DVector::from_vec(squared_residuals_data);

    let mut white_test_result = None;
    let mut bp_test_result = None;
    let mut modified_bp_test_result = None;
    let mut f_test_kb_result = None; // Koenker-Bassett F-test

    // Auxiliary regressors for Breusch-Pagan & Koenker-Bassett F-test is the main model's X matrix
    let z_aux_bp = design_info.x.clone_owned();

    if config.options.brusch_pagan || config.options.f_test {
        if z_aux_bp.ncols() > 0 && z_aux_bp.nrows() == n_obs {
            match run_simple_ols(&y_aux_for_tests, &z_aux_bp) {
                Ok((r_sq_aux, _ess_aux, _rss_aux, k_total_aux, df_res_aux)) => {
                    // k_total_aux is total number of regressors in Z_aux_bp (including intercept if present)
                    // For Chi-sq DF for BP test: k_total_aux - 1 (if intercept is in Z_aux_bp)
                    // Or, more generally, number of slope parameters in Z_aux_bp.
                    // If design_info.x (so z_aux_bp) always includes intercept if specified by model,
                    // then number of slopes is k_total_aux - (1 if intercept_column.is_some() else 0)
                    let num_slopes_in_z_aux =
                        k_total_aux - (if design_info.intercept_column.is_some() { 1 } else { 0 });

                    if num_slopes_in_z_aux > 0 {
                        let lm_statistic_bp = (n_obs as f64) * r_sq_aux;
                        let df_chi_sq_bp = num_slopes_in_z_aux;
                        let p_value_bp = calculate_chi_sq_significance(
                            lm_statistic_bp,
                            df_chi_sq_bp as u64
                        );

                        if config.options.brusch_pagan {
                            bp_test_result = Some(BPTest {
                                statistic: lm_statistic_bp,
                                df: df_chi_sq_bp,
                                p_value: p_value_bp,
                                note: vec![
                                    "Auxiliary regression on original predictors.".to_string()
                                ],
                            });
                        }

                        if config.options.f_test {
                            // Koenker-Bassett F-Test
                            // F = (R^2_aux / num_slopes_in_Z_aux) / ((1-R^2_aux) / (N - k_total_aux))
                            // Here, df_res_aux = N - k_total_aux
                            if df_res_aux > 0 {
                                let f_stat_kb =
                                    r_sq_aux /
                                    (num_slopes_in_z_aux as f64) /
                                    ((1.0 - r_sq_aux) / (df_res_aux as f64));
                                let p_value_f_kb = calculate_f_significance(
                                    num_slopes_in_z_aux,
                                    df_res_aux,
                                    f_stat_kb
                                );
                                f_test_kb_result = Some(FTest {
                                    statistic: f_stat_kb,
                                    df1: num_slopes_in_z_aux,
                                    df2: df_res_aux,
                                    p_value: p_value_f_kb,
                                    note: vec![
                                        "Koenker-Bassett F-variant of Breusch-Pagan.".to_string()
                                    ],
                                });
                            } else {
                                f_test_kb_result = Some(FTest {
                                    statistic: f64::NAN,
                                    df1: num_slopes_in_z_aux,
                                    df2: 0,
                                    p_value: f64::NAN,
                                    note: vec!["df_residuals <=0 for F-test.".to_string()],
                                });
                            }
                        }
                    } else {
                        // num_slopes_in_z_aux == 0
                        let note_no_slopes =
                            "No non-intercept predictors in main model for BP/F-test.".to_string();
                        if config.options.brusch_pagan {
                            bp_test_result = Some(BPTest {
                                statistic: 0.0,
                                df: 0,
                                p_value: 1.0,
                                note: vec![note_no_slopes.clone()],
                            });
                        }
                        if config.options.f_test {
                            f_test_kb_result = Some(FTest {
                                statistic: f64::NAN,
                                df1: 0,
                                df2: n_obs -
                                (if design_info.intercept_column.is_some() { 1 } else { 0 }),
                                p_value: f64::NAN,
                                note: vec![note_no_slopes],
                            });
                        }
                    }
                }
                Err(e) => {
                    let note = format!("BP/F-test auxiliary regression failed: {}", e);
                    if config.options.brusch_pagan {
                        bp_test_result = Some(BPTest {
                            statistic: f64::NAN,
                            df: 0,
                            p_value: f64::NAN,
                            note: vec![note.clone()],
                        });
                    }
                    if config.options.f_test {
                        f_test_kb_result = Some(FTest {
                            statistic: f64::NAN,
                            df1: 0,
                            df2: 0,
                            p_value: f64::NAN,
                            note: vec![note],
                        });
                    }
                }
            }
        } else {
            let note_empty_z =
                "Auxiliary design matrix (Z_bp) was empty or mismatched for BP/F-test.".to_string();
            if config.options.brusch_pagan {
                bp_test_result = Some(BPTest {
                    statistic: f64::NAN,
                    df: 0,
                    p_value: f64::NAN,
                    note: vec![note_empty_z.clone()],
                });
            }
            if config.options.f_test {
                f_test_kb_result = Some(FTest {
                    statistic: f64::NAN,
                    df1: 0,
                    df2: 0,
                    p_value: f64::NAN,
                    note: vec![note_empty_z],
                });
            }
        }
    }

    // --- White Test --- (if requested)
    if config.options.white_test {
        // TODO: Construct Z_white (original X, their squares, and unique cross-products, excluding intercept from squares/cross-products)
        // This is a complex step and requires careful handling of factor dummies vs. covariates.
        // For now, placeholder:
        white_test_result = Some(WhiteTest {
            statistic: f64::NAN,
            df: 0,
            p_value: f64::NAN,
            note: vec![
                "White test Z-matrix construction and execution not yet fully implemented.".to_string()
            ],
        });
    }

    // --- Modified Breusch-Pagan Test ---
    if config.main.wls_weight.is_some() && config.options.mod_brusch_pagan {
        // TODO: Implement logic for modified BP, typically if WLS was used in the main model.
        // This might involve regressing e_i^2 on Z_i / sigma_i^2 or using weighted residuals in a specific way.
        modified_bp_test_result = Some(ModifiedBPTest {
            statistic: f64::NAN,
            df: 0,
            p_value: f64::NAN,
            note: vec!["Modified Breusch-Pagan for WLS not yet implemented.".to_string()],
        });
    }

    Ok(HeteroscedasticityTests {
        white: white_test_result,
        breusch_pagan: bp_test_result,
        modified_breusch_pagan: modified_bp_test_result,
        f_test: f_test_kb_result,
    })
}
