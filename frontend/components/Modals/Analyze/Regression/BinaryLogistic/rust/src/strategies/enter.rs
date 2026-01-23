use nalgebra::{DMatrix, DVector};
use statrs::distribution::{ChiSquared, ContinuousCDF};
use std::error::Error;

use crate::models::config::LogisticConfig;
use crate::models::result::{
    CategoricalCoding, CorrelationOfEstimatesRow, FittingWarnings, IterationHistoryBlock, IterationHistoryRow,
    LogisticResult, ModelInfo, ModelSummary, OmniTests, RemainderTest, StepDetail,
    VariableNotInEquation, VariableRow,
};
// Tambahkan import hosmer_lemeshow, casewise, correlation_of_estimates, classification_plot, dan saved_predictions
use crate::stats::{casewise, classification_plot, correlation_of_estimates, hosmer_lemeshow, irls, saved_predictions, score_test, table};

pub fn run(
    x_raw: &DMatrix<f64>,
    y_vector: &DVector<f64>,
    config: &LogisticConfig,
    feature_names: &[String],
    codings: Option<Vec<CategoricalCoding>>,
) -> Result<LogisticResult, Box<dyn Error>> {
    let n_samples = x_raw.nrows();
    let n_features = x_raw.ncols();

    let mut steps_details: Vec<StepDetail> = Vec::new();

    // ==========================================
    // BLOCK 0: NULL MODEL (Hanya Constant) - STEP 0
    // ==========================================
    let x_null = DMatrix::from_element(n_samples, 1, 1.0);
    
    // Use fit_with_history if iteration_history is enabled
    let (null_model, null_iteration_history) = if config.iteration_history {
        let result = irls::fit_with_history(
            &x_null,
            y_vector,
            config.max_iterations,
            config.convergence_threshold,
        )?;
        (result.model, Some(result.iteration_history))
    } else {
        let result = irls::fit(
            &x_null,
            y_vector,
            config.max_iterations,
            config.convergence_threshold,
        )?;
        (result, None)
    };

    // PENTING: Gunakan RAW Log Likelihood (Negatif)
    let null_log_likelihood = null_model.final_log_likelihood;
    let null_log_likelihood = null_model.final_log_likelihood;

    // Calculate z-score from confidence level
    let z_score_block0 = crate::utils::probability::z_score_from_confidence(config.confidence_level);

    // --- 1. Constant Statistics (Null Model) ---
    let se_const0 = null_model.covariance_matrix[(0, 0)].sqrt();
    let wald_const0 = (null_model.beta[0] / se_const0).powi(2);
    let sig_const0 = 1.0 - ChiSquared::new(1.0)?.cdf(wald_const0);

    let block_0_constant = VariableRow {
        label: "Constant".to_string(),
        b: null_model.beta[0],
        error: se_const0,
        wald: wald_const0,
        df: 1,
        sig: sig_const0,
        exp_b: null_model.beta[0].exp(),
        lower_ci: (null_model.beta[0] - z_score_block0 * se_const0).exp(),
        upper_ci: (null_model.beta[0] + z_score_block0 * se_const0).exp(),
    };

    // --- 2. Classification Table (Null Model) ---
    let class_table_null =
        table::calculate_classification_table(&null_model.predictions, y_vector, config.cutoff);

    // --- 3. SCORE TEST (Variables Not in Equation - Block 0) ---
    let mut vars_not_in_eq_null = Vec::new();
    let residuals_null = y_vector - &null_model.predictions;
    let prob_null = null_model.predictions[0];
    let variance_null = prob_null * (1.0 - prob_null);

    for i in 0..n_features {
        let col = x_raw.column(i);
        let col_vec: DVector<f64> = col.into();
        let center_col = &col_vec.add_scalar(-col_vec.mean());

        let u: f64 = center_col.dot(&residuals_null);
        let info: f64 = center_col.iter().map(|v| v * v * variance_null).sum();

        let score_stat = if info > 1e-12 { (u * u) / info } else { 0.0 };
        let sig_val = if score_stat > 0.0 {
            1.0 - ChiSquared::new(1.0)?.cdf(score_stat)
        } else {
            1.0
        };

        let label = if i < feature_names.len() {
            feature_names[i].clone()
        } else {
            format!("Var_{}", i + 1)
        };

        vars_not_in_eq_null.push(VariableNotInEquation {
            label,
            score: score_stat,
            df: 1,
            sig: sig_val,
        });
    }

    // Global Score Test for Step 0
    let (g_chi, g_df, g_sig) = score_test::calculate_global_score_test(x_raw, y_vector, prob_null);

    // Build iteration history block for Block 0 (null model)
    let block_0_iter_history: Option<IterationHistoryBlock> = if config.iteration_history {
        null_iteration_history.as_ref().map(|history| {
            IterationHistoryBlock {
                block: 0,
                step: 0,
                variable_names: vec!["Constant".to_string()],
                rows: history.iter().map(|rec| IterationHistoryRow {
                    iteration: rec.iteration,
                    neg2_log_likelihood: rec.neg2_log_likelihood,
                    coefficients: rec.coefficients.clone(),
                }).collect(),
                initial_neg2ll: Some(-2.0 * null_log_likelihood),
                converged: null_model.converged,
                final_iteration: null_model.iterations,
            }
        })
    } else {
        None
    };

    // Simpan Snapshot Step 0
    steps_details.push(StepDetail {
        step: 0,
        action: "Start".to_string(),
        variable_changed: None,
        summary: ModelSummary {
            log_likelihood: null_log_likelihood, // RAW
            cox_snell_r_square: 0.0,
            nagelkerke_r_square: 0.0,
            converged: null_model.converged,
            iterations: null_model.iterations,
        },
        classification_table: class_table_null,
        variables_in_equation: vec![block_0_constant.clone()],
        variables_not_in_equation: vars_not_in_eq_null.clone(),
        remainder_test: Some(RemainderTest {
            chi_square: g_chi,
            df: g_df,
            sig: g_sig,
        }),
        omni_tests: None,
        step_omni_tests: None,
        model_if_term_removed: None,
        hosmer_lemeshow: None, // Step 0 usually doesn't have meaningful HL test
        correlation_of_estimates: None, // Step 0 (null model) tidak punya correlation matrix relevan
        iteration_history: block_0_iter_history, // BARU: Iteration History untuk Block 0
        classification_plot_data: None, // Step 0 tidak punya classification plot
    });

    // ==========================================
    // BLOCK 1: FULL MODEL (Enter Method) - STEP 1
    // ==========================================
    let mut x_full = x_raw.clone();
    if config.include_constant {
        x_full = x_full.insert_column(0, 1.0);
    }

    // Use fit_with_history if iteration_history is enabled
    let (full_model, full_iteration_history) = if config.iteration_history {
        let result = irls::fit_with_history(
            &x_full,
            y_vector,
            config.max_iterations,
            config.convergence_threshold,
        )?;
        (result.model, Some(result.iteration_history))
    } else {
        let result = irls::fit(
            &x_full,
            y_vector,
            config.max_iterations,
            config.convergence_threshold,
        )?;
        (result, None)
    };

    // PENTING: Gunakan RAW Log Likelihood (Negatif)
    let full_log_likelihood = full_model.final_log_likelihood;

    // --- Hitung Pseudo R-Squares ---
    let n = n_samples as f64;
    let likelihood_diff = null_log_likelihood - full_log_likelihood;
    let cox_snell = 1.0 - (likelihood_diff * (2.0 / n)).exp();
    let max_cox_snell = 1.0 - (null_log_likelihood * (2.0 / n)).exp();

    let nagelkerke = if max_cox_snell > 1e-12 {
        cox_snell / max_cox_snell
    } else {
        0.0
    };

    let model_summary = ModelSummary {
        log_likelihood: full_log_likelihood,
        cox_snell_r_square: cox_snell,
        nagelkerke_r_square: nagelkerke,
        converged: full_model.converged,
        iterations: full_model.iterations,
    };

    let classification_table =
        table::calculate_classification_table(&full_model.predictions, y_vector, config.cutoff);

    // Variables in Equation (Full)
    let mut variables_rows = Vec::new();
    // Calculate z-score from confidence level (use helper function)
    let z_score = crate::utils::probability::z_score_from_confidence(config.confidence_level);
    let chi_dist_1df = ChiSquared::new(1.0)?;

    for (i, &beta) in full_model.beta.iter().enumerate() {
        let cov_val = full_model.covariance_matrix[(i, i)];
        let std_error = if cov_val > 0.0 { cov_val.sqrt() } else { 0.0 };
        let wald = if std_error > 1e-12 {
            (beta / std_error).powi(2)
        } else {
            0.0
        };
        let sig = if wald > 0.0 {
            1.0 - chi_dist_1df.cdf(wald)
        } else {
            1.0
        };
        let lower_ci = (beta - z_score * std_error).exp();
        let upper_ci = (beta + z_score * std_error).exp();

        let label = if config.include_constant && i == 0 {
            "Constant".to_string()
        } else {
            let feature_idx = if config.include_constant { i - 1 } else { i };
            if feature_idx < feature_names.len() {
                feature_names[feature_idx].clone()
            } else {
                format!("Var_{}", feature_idx + 1)
            }
        };

        variables_rows.push(VariableRow {
            label,
            b: beta,
            error: std_error,
            wald,
            df: 1,
            sig,
            exp_b: beta.exp(),
            lower_ci,
            upper_ci,
        });
    }

    // --- Hitung Omnibus Tests ---
    let chi_sq_model = 2.0 * (full_log_likelihood - null_log_likelihood);
    let df_model = (x_full.ncols() as i32) - (x_null.ncols() as i32);
    let chi_sq_model = if chi_sq_model < 0.0 {
        0.0
    } else {
        chi_sq_model
    };

    let sig_omni = if df_model > 0 {
        1.0 - ChiSquared::new(df_model as f64)?.cdf(chi_sq_model)
    } else {
        1.0
    };

    let omni_tests = OmniTests {
        chi_square: chi_sq_model,
        df: df_model,
        sig: sig_omni,
    };

    // --- BARU: Hitung Hosmer-Lemeshow Jika Diminta ---
    let hl_result = if config.hosmer_lemeshow {
        // Default deciles = 10
        match hosmer_lemeshow::calculate(y_vector, &full_model.predictions, 10) {
            Ok(res) => Some(res),
            Err(_) => None, // Jika gagal (misal sampel terlalu kecil), kembalikan None
        }
    } else {
        None
    };

    // --- BARU: Hitung Casewise Listing Jika Diminta ---
    let casewise_result = if config.casewise_listing {
        // Untuk label Y, kita perlu tahu label asli dari encoding
        // Default ke "0" dan "1" jika tidak ada info
        let y_label_0 = "0";
        let y_label_1 = "1";
        
        Some(casewise::calculate_casewise_list(
            &x_full,
            y_vector,
            &full_model,
            config,
            y_label_0,
            y_label_1,
        ))
    } else {
        None
    };

    // --- BARU: Hitung Classification Plot Data Jika Diminta ---
    let classification_plot_result = if config.classification_plots {
        // Untuk label Y, kita perlu tahu label asli dari encoding
        // Default ke "FALSE" dan "TRUE" jika tidak ada info
        let y_label_0 = "FALSE";
        let y_label_1 = "TRUE";
        
        Some(classification_plot::calculate_classification_plot(
            y_vector,
            &full_model.predictions,
            config.cutoff,
            y_label_0,
            y_label_1,
        ))
    } else {
        None
    };

    // --- BARU: Hitung Correlation of Estimates Jika Diminta ---
    let corr_estimates_result: Option<Vec<CorrelationOfEstimatesRow>> = if config.correlations {
        // Build variable names for correlation matrix (including Constant)
        let mut var_names_for_corr: Vec<String> = Vec::new();
        if config.include_constant {
            var_names_for_corr.push("Constant".to_string());
        }
        var_names_for_corr.extend(feature_names.iter().cloned());
        
        Some(correlation_of_estimates::calculate_correlation_of_estimates(
            &full_model.covariance_matrix,
            &var_names_for_corr,
        ))
    } else {
        None
    };

    // --- BARU: Build Iteration History Block for Block 1 ---
    let block_1_iter_history: Option<IterationHistoryBlock> = if config.iteration_history {
        // Build variable names for Block 1 (Constant + all covariates)
        let mut var_names: Vec<String> = Vec::new();
        if config.include_constant {
            var_names.push("Constant".to_string());
        }
        var_names.extend(feature_names.iter().cloned());

        full_iteration_history.as_ref().map(|history| {
            IterationHistoryBlock {
                block: 1,
                step: 1,
                variable_names: var_names,
                rows: history.iter().map(|rec| IterationHistoryRow {
                    iteration: rec.iteration,
                    neg2_log_likelihood: rec.neg2_log_likelihood,
                    coefficients: rec.coefficients.clone(),
                }).collect(),
                initial_neg2ll: Some(-2.0 * full_log_likelihood),
                converged: full_model.converged,
                final_iteration: full_model.iterations,
            }
        })
    } else {
        None
    };

    // Simpan Snapshot Step 1
    // --- BARU: Calculate Saved Predictions Jika Ada Opsi Save yang Diaktifkan ---
    let saved_predictions_result = saved_predictions::calculate_saved_predictions(
        &x_full,
        y_vector,
        &full_model,
        config,
    );

    steps_details.push(StepDetail {
        step: 1,
        action: "Entered".to_string(),
        variable_changed: Some("All Variables".to_string()),
        summary: model_summary.clone(),
        classification_table: classification_table.clone(),
        variables_in_equation: variables_rows.clone(),
        variables_not_in_equation: Vec::new(),
        remainder_test: None,
        omni_tests: Some(omni_tests.clone()),
        step_omni_tests: Some(omni_tests.clone()),
        model_if_term_removed: None,
        hosmer_lemeshow: hl_result.clone(), // Tambahkan ke step detail
        correlation_of_estimates: corr_estimates_result.clone(), // BARU: Correlation of Estimates
        iteration_history: block_1_iter_history, // BARU: Iteration History untuk Block 1
        classification_plot_data: classification_plot_result.clone(), // Classification Plot untuk Step 1
    });

    let overall_test = RemainderTest {
        chi_square: g_chi,
        df: g_df,
        sig: g_sig,
    };

    // --- BARU: Convert irls::FittingWarnings ke result::FittingWarnings ---
    let fitting_warnings_result: Option<FittingWarnings> = {
        let w = &full_model.warnings;
        // Hanya include jika ada warning yang non-trivial
        if w.possible_separation || w.quasi_separation || w.step_halving_used 
           || w.ridge_increased || w.near_singular_hessian || !w.messages.is_empty() {
            Some(FittingWarnings {
                possible_separation: w.possible_separation,
                quasi_separation: w.quasi_separation,
                step_halving_used: w.step_halving_used,
                step_halving_count: w.step_halving_count,
                ridge_increased: w.ridge_increased,
                final_lambda: w.final_lambda,
                near_singular_hessian: w.near_singular_hessian,
                messages: w.messages.clone(),
            })
        } else {
            None
        }
    };

    Ok(LogisticResult {
        model_info: ModelInfo::default(),
        summary: model_summary,
        classification_table,
        variables: variables_rows,
        variables_not_in_equation: vars_not_in_eq_null,
        block_0_constant,
        block_0_variables_not_in: None,
        omni_tests,
        step_history: None,
        steps_detail: Some(steps_details),
        method_used: "Enter".to_string(),
        assumption_tests: None,
        overall_remainder_test: Some(overall_test),
        categorical_codings: codings,
        hosmer_lemeshow: hl_result,
        casewise_list: casewise_result,
        classification_plot_data: classification_plot_result, // BARU: Classification Plot Data
        correlation_of_estimates: corr_estimates_result, // BARU: Correlation of Estimates
        step_summary: None, // Enter tidak memerlukan step summary
        saved_predictions: saved_predictions_result, // BARU: Saved Predictions
        fitting_warnings: fitting_warnings_result, // BARU: Fitting Warnings dari IRLS
    })
}
