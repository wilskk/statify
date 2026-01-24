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
use crate::stats::irls::FittingWarnings as IrlsFittingWarnings;

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
    // BLOCK 0: NULL MODEL - STEP 0
    // ==========================================
    // PERBAIKAN: Penanganan berbeda untuk include_constant = true vs false
    // - Jika include_constant = true: Null model = intercept-only model
    // - Jika include_constant = false: Null model = "empty model" dengan prediksi P(Y=1) = 0.5
    //   Ini sesuai dengan standar SPSS/SAS untuk model tanpa intercept
    
    let (null_model, null_iteration_history, null_log_likelihood) = if config.include_constant {
        // Standard case: fit intercept-only model
        let x_null = DMatrix::from_element(n_samples, 1, 1.0);
        
        // Use fit_with_history if iteration_history is enabled
        if config.iteration_history {
            let result = irls::fit_with_history(
                &x_null,
                y_vector,
                config.max_iterations,
                config.convergence_threshold,
            )?;
            let ll = result.model.final_log_likelihood;
            (result.model, Some(result.iteration_history), ll)
        } else {
            let result = irls::fit(
                &x_null,
                y_vector,
                config.max_iterations,
                config.convergence_threshold,
            )?;
            let ll = result.final_log_likelihood;
            (result, None, ll)
        }
    } else {
        // No constant case: Calculate baseline LL analytically
        // Null model log-likelihood = n * ln(0.5) + n * ln(0.5) = -n * ln(2)
        // This represents predicting P(Y=1) = 0.5 for all cases
        let n = n_samples as f64;
        let null_ll = n * 0.5_f64.ln() + n * 0.5_f64.ln(); // = -n * ln(2)
        
        // Create "empty" model with predictions = 0.5 for all observations
        let predictions = DVector::from_element(n_samples, 0.5);
        let residuals = y_vector - &predictions;
        let weights = DVector::from_element(n_samples, 0.25); // 0.5 * (1 - 0.5)
        
        let dummy_model = irls::FittedModel {
            beta: DVector::zeros(0),
            covariance_matrix: DMatrix::zeros(0, 0),
            final_log_likelihood: null_ll,
            iterations: 0,
            converged: true,
            residuals,
            weights,
            predictions,
            warnings: IrlsFittingWarnings::default(),
        };
        
        (dummy_model, None, null_ll)
    };

    // Calculate z-score from confidence level
    let z_score_block0 = crate::utils::probability::z_score_from_confidence(config.confidence_level);

    // --- 1. Constant Statistics (Null Model) ---
    // PERBAIKAN: Hanya hitung constant statistics jika include_constant = true
    let block_0_constant = if config.include_constant && null_model.beta.len() > 0 {
        let se_const0 = if null_model.covariance_matrix.nrows() > 0 {
            null_model.covariance_matrix[(0, 0)].sqrt()
        } else {
            0.0
        };
        let wald_const0 = if se_const0 > 1e-12 {
            (null_model.beta[0] / se_const0).powi(2)
        } else {
            0.0
        };
        let sig_const0 = if wald_const0 > 0.0 {
            1.0 - ChiSquared::new(1.0).unwrap_or_else(|_| ChiSquared::new(1.0).unwrap()).cdf(wald_const0)
        } else {
            1.0
        };

        VariableRow {
            label: "Constant".to_string(),
            b: null_model.beta[0],
            error: se_const0,
            wald: wald_const0,
            df: 1,
            sig: sig_const0,
            exp_b: null_model.beta[0].exp(),
            lower_ci: (null_model.beta[0] - z_score_block0 * se_const0).exp(),
            upper_ci: (null_model.beta[0] + z_score_block0 * se_const0).exp(),
        }
    } else {
        // Placeholder untuk kasus tanpa constant - tidak akan ditampilkan di output
        VariableRow {
            label: "".to_string(),
            b: 0.0,
            error: 0.0,
            wald: 0.0,
            df: 0,
            sig: 1.0,
            exp_b: 1.0,
            lower_ci: 1.0,
            upper_ci: 1.0,
        }
    };

    // --- 2. Classification Table (Null Model) ---
    let class_table_null =
        table::calculate_classification_table(&null_model.predictions, y_vector, config.cutoff);

    // --- 3. SCORE TEST (Variables Not in Equation - Block 0) ---
    // PERBAIKAN: Gunakan fungsi score test yang menangani include_constant dengan benar
    let mut vars_not_in_eq_null = Vec::new();
    let prob_null = if null_model.predictions.len() > 0 {
        null_model.predictions[0]
    } else {
        0.5 // Default untuk model kosong
    };

    for i in 0..n_features {
        let col = x_raw.column(i);
        let col_vec: DVector<f64> = col.into();
        
        // Gunakan fungsi score test yang baru dengan parameter include_constant
        let (score_stat, _, sig_val) = score_test::calculate_single_score_test(
            &col_vec,
            y_vector,
            prob_null,
            config.include_constant,
        );

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
    // PERBAIKAN: Gunakan versi yang menangani include_constant
    let (g_chi, g_df, g_sig) = score_test::calculate_global_score_test_with_constant(
        x_raw, 
        y_vector, 
        prob_null,
        config.include_constant,
    );

    // Build iteration history block for Block 0 (null model)
    // PERBAIKAN: Hanya tampilkan iteration history jika include_constant = true
    let block_0_iter_history: Option<IterationHistoryBlock> = if config.iteration_history && config.include_constant {
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

    // Variables in Equation untuk Block 0
    // PERBAIKAN: Hanya sertakan constant jika include_constant = true
    let block_0_vars_in_equation = if config.include_constant && block_0_constant.label == "Constant" {
        vec![block_0_constant.clone()]
    } else {
        Vec::new()
    };

    // Simpan Snapshot Step 0
    // PERBAIKAN: Gunakan block_0_vars_in_equation yang sudah difilter
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
        variables_in_equation: block_0_vars_in_equation, // PERBAIKAN: Gunakan filtered list
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
        iteration_history: block_0_iter_history, // Iteration History untuk Block 0
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
    // PERBAIKAN: Gunakan baseline yang tepat untuk perhitungan R-squares
    // Ketika include_constant = false, kita tetap menggunakan null_log_likelihood 
    // yang sudah dihitung dengan benar di atas (either from null model or -n*ln(2))
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
    // PERBAIKAN: Perhitungan df yang benar untuk kedua kasus:
    // - Jika include_constant = true: df = k (jumlah kovariat, karena null model punya 1 parameter)
    // - Jika include_constant = false: df = k (jumlah kovariat, karena null model tidak punya parameter)
    // 
    // Chi-square = 2 * (LL_full - LL_null)
    // Note: LL sudah negatif, jadi full_log_likelihood - null_log_likelihood akan positif
    // jika model full lebih baik dari null model
    let chi_sq_model = 2.0 * (full_log_likelihood - null_log_likelihood);
    
    // df_model = jumlah parameter di full model - jumlah parameter di null model
    // Full model: include_constant ? (k + 1) : k, dimana k = jumlah kovariat
    // Null model: include_constant ? 1 : 0
    // Jadi: df = k dalam kedua kasus
    let df_model = n_features as i32;
    
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

        // PERBAIKAN: Initial -2LL untuk Block 1 adalah -2LL dari null model (Block 0)
        // Ini adalah starting point sebelum kovariat ditambahkan
        let block_1_initial_neg2ll = -2.0 * null_log_likelihood;

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
                initial_neg2ll: Some(block_1_initial_neg2ll),
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

    // PERBAIKAN: Buat ModelInfo dengan include_constant yang benar
    let model_info = ModelInfo {
        variables: feature_names.to_vec(),
        n_total: n_samples,
        n_missing: 0, // Will be overwritten by worker.js
        n_selected: n_samples,
        y_encoding: std::collections::HashMap::new(), // Will be overwritten by worker.js
        x_encodings: None, // Will be overwritten by worker.js
        include_constant: config.include_constant,
    };

    Ok(LogisticResult {
        model_info,
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
        classification_plot_data: classification_plot_result, // Classification Plot Data
        correlation_of_estimates: corr_estimates_result, // Correlation of Estimates
        step_summary: None, // Enter tidak memerlukan step summary
        saved_predictions: saved_predictions_result, // Saved Predictions
        fitting_warnings: fitting_warnings_result, // Fitting Warnings dari IRLS
    })
}
