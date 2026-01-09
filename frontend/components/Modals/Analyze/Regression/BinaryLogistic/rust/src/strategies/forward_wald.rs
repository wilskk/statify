use crate::models::config::LogisticConfig;
use crate::models::result::{
    ClassificationTable, LogisticResult, ModelSummary, OmniTests, RemainderTest, StepDetail,
    StepHistory, VariableNotInEquation, VariableRow,
};
use crate::stats::irls::{fit, FittedModel};
use crate::stats::score_test;
use crate::stats::score_test::calculate_score_test;
use nalgebra::{DMatrix, DVector};
use statrs::distribution::{ChiSquared, ContinuousCDF};
use wasm_bindgen::JsValue;

pub fn run(
    x_matrix: &DMatrix<f64>,
    y_vector: &DVector<f64>,
    config: &LogisticConfig,
    feature_names: &[String], // <-- ARGUMEN BARU
) -> Result<LogisticResult, JsValue> {
    let n_samples = x_matrix.nrows();
    let n_total_vars = x_matrix.ncols();

    let mut included_indices: Vec<usize> = Vec::new();
    let mut steps_history: Vec<StepHistory> = Vec::new();
    // Vektor baru untuk menyimpan snapshot lengkap
    let mut steps_details: Vec<StepDetail> = Vec::new();

    let chi_dist_1df = ChiSquared::new(1.0).unwrap();

    // --- STEP 0: NULL MODEL ---
    let null_x = DMatrix::from_element(n_samples, 1, 1.0);
    let mut current_model = fit(
        &null_x,
        y_vector,
        config.max_iterations,
        config.convergence_threshold,
    )
    .map_err(|e| JsValue::from_str(&format!("IRLS Error (Null Model): {}", e)))?;

    let null_log_likelihood = current_model.final_log_likelihood;

    // --- CAPTURE STEP 0 (Block 0) ---
    let step0_detail = calculate_step_snapshot(
        0,
        "Start".to_string(),
        None,
        &current_model,
        x_matrix,
        y_vector,
        &included_indices,
        null_log_likelihood,
        feature_names, // Pass feature names
    );
    steps_details.push(step0_detail);

    // Ambil data Block 0 Constant dari snapshot yang baru dibuat
    let block_0_row = steps_details[0].variables_in_equation[0].clone();

    let mut step_count = 0;

    // --- STEPWISE LOOP ---
    loop {
        step_count += 1;
        if step_count > n_total_vars * 2 + 10 {
            break; // Safety break
        }

        let mut best_candidate_idx = None;
        let mut best_score_stat = 0.0;
        let mut min_p_value = 1.0;

        // ---------------------------------------------------------
        // A. FORWARD ENTRY: Score Test (Standard)
        // ---------------------------------------------------------
        let design_matrix = build_design_matrix(x_matrix, &included_indices, n_samples);

        for i in 0..n_total_vars {
            if !included_indices.contains(&i) {
                let candidate_col = x_matrix.column(i).into_owned();

                let (stat, p_val) = calculate_score_test(
                    &current_model.residuals,
                    &current_model.weights,
                    &design_matrix,
                    &candidate_col,
                    &current_model.covariance_matrix,
                );

                if p_val < config.p_entry && p_val < min_p_value {
                    min_p_value = p_val;
                    best_score_stat = stat;
                    best_candidate_idx = Some(i);
                }
            }
        }

        let mut variable_added = false;

        // Masukkan Variabel Terbaik
        if let Some(idx_in) = best_candidate_idx {
            let mut trial_indices = included_indices.clone();
            trial_indices.push(idx_in);
            let trial_x = build_design_matrix(x_matrix, &trial_indices, n_samples);

            if let Ok(new_model) = fit(
                &trial_x,
                y_vector,
                config.max_iterations,
                config.convergence_threshold,
            ) {
                steps_history.push(StepHistory {
                    step: step_count,
                    action: "Entered".to_string(),
                    variable: feature_names[idx_in].clone(), // GUNAKAN NAMA ASLI
                    score_statistic: best_score_stat,
                    improvement_chi_sq: best_score_stat,
                    model_log_likelihood: new_model.final_log_likelihood,
                    nagelkerke_r2: calculate_nagelkerke(
                        null_log_likelihood,
                        new_model.final_log_likelihood,
                        n_samples,
                    ),
                });

                included_indices = trial_indices;
                current_model = new_model;
                variable_added = true;

                // --- CAPTURE STEP N (Entered) ---
                let step_detail = calculate_step_snapshot(
                    step_count,
                    "Entered".to_string(),
                    Some(feature_names[idx_in].clone()), // NAMA ASLI
                    &current_model,
                    x_matrix,
                    y_vector,
                    &included_indices,
                    null_log_likelihood,
                    feature_names,
                );
                steps_details.push(step_detail);
            }
        }

        // ---------------------------------------------------------
        // B. BACKWARD REMOVAL: Wald Test
        // ---------------------------------------------------------
        if included_indices.len() > 0 {
            let mut worst_idx_loc = None;
            let mut max_p_val = -1.0;
            let mut wald_stat_removed = 0.0;

            for (k, &original_idx) in included_indices.iter().enumerate() {
                // Hindari membuang variabel yang baru saja masuk di langkah yang sama
                if variable_added && Some(original_idx) == best_candidate_idx {
                    continue;
                }

                // Ambil statistik Wald dari model saat ini
                // Beta index = k + 1 (karena index 0 adalah intercept)
                let beta_idx = k + 1;
                let b = current_model.beta[beta_idx];
                let se = current_model.covariance_matrix[(beta_idx, beta_idx)].sqrt();

                // Rumus Wald: (B / SE)^2
                let wald = (b / se).powi(2);
                let p_val_remove = 1.0 - chi_dist_1df.cdf(wald);

                if p_val_remove > config.p_removal && p_val_remove > max_p_val {
                    max_p_val = p_val_remove;
                    worst_idx_loc = Some(k);
                    wald_stat_removed = wald;
                }
            }

            // Eksekusi Penghapusan
            if let Some(loc) = worst_idx_loc {
                let removed_var_idx = included_indices[loc];
                included_indices.remove(loc);

                // Re-fit model setelah penghapusan
                let reduced_x = build_design_matrix(x_matrix, &included_indices, n_samples);

                if let Ok(reduced_model) = fit(
                    &reduced_x,
                    y_vector,
                    config.max_iterations,
                    config.convergence_threshold,
                ) {
                    steps_history.push(StepHistory {
                        step: step_count,
                        action: "Removed".to_string(),
                        variable: feature_names[removed_var_idx].clone(), // NAMA ASLI
                        score_statistic: 0.0,
                        improvement_chi_sq: wald_stat_removed,
                        model_log_likelihood: reduced_model.final_log_likelihood,
                        nagelkerke_r2: calculate_nagelkerke(
                            null_log_likelihood,
                            reduced_model.final_log_likelihood,
                            n_samples,
                        ),
                    });

                    current_model = reduced_model;

                    // --- CAPTURE STEP N (Removed) ---
                    let step_detail = calculate_step_snapshot(
                        step_count,
                        "Removed".to_string(),
                        Some(feature_names[removed_var_idx].clone()), // NAMA ASLI
                        &current_model,
                        x_matrix,
                        y_vector,
                        &included_indices,
                        null_log_likelihood,
                        feature_names,
                    );
                    steps_details.push(step_detail);
                }
            }
        }

        // Break condition
        let last_step_num = steps_history.last().map(|s| s.step).unwrap_or(0);
        if last_step_num < step_count {
            break;
        }
    }

    // --- FINAL RESULT CONSTRUCTION ---
    let final_step = steps_details.last().unwrap().clone();

    // Omnibus Tests
    let chi_sq_model = 2.0 * (current_model.final_log_likelihood - null_log_likelihood).abs();
    let df_model = included_indices.len() as i32;
    let omni_sig = if df_model > 0 {
        1.0 - ChiSquared::new(df_model as f64).unwrap().cdf(chi_sq_model)
    } else {
        1.0
    };

    Ok(LogisticResult {
        summary: final_step.summary,
        classification_table: final_step.classification_table,
        variables: final_step.variables_in_equation,
        variables_not_in_equation: final_step.variables_not_in_equation,
        omni_tests: OmniTests {
            chi_square: chi_sq_model,
            df: df_model,
            sig: omni_sig,
        },
        step_history: Some(steps_history),
        steps_detail: Some(steps_details),
        block_0_constant: block_0_row,
        method_used: "Forward Wald".to_string(),
        assumption_tests: None,
        overall_remainder_test: final_step.remainder_test,
    })
}

// --- HELPER FUNCTIONS ---

fn build_design_matrix(original_x: &DMatrix<f64>, indices: &[usize], rows: usize) -> DMatrix<f64> {
    let mut columns = vec![DVector::from_element(rows, 1.0)];
    for &idx in indices {
        columns.push(original_x.column(idx).into_owned());
    }
    DMatrix::from_columns(&columns)
}

fn calculate_nagelkerke(null_ll: f64, model_ll: f64, n: usize) -> f64 {
    let l0 = (-2.0 * null_ll).exp();
    let l1 = (-2.0 * model_ll).exp();
    if l0 <= 0.0 || l1 <= 0.0 {
        return 0.0;
    }
    let cox_snell = 1.0 - (l0 / l1).powf(2.0 / n as f64);
    let max_r2 = 1.0 - l0.powf(2.0 / n as f64);
    if max_r2 == 0.0 {
        0.0
    } else {
        cox_snell / max_r2
    }
}

// Helper function untuk snapshot
fn calculate_step_snapshot(
    step: usize,
    action: String,
    variable_changed: Option<String>,
    model: &FittedModel,
    full_x: &DMatrix<f64>,
    y_vector: &DVector<f64>,
    included_indices: &[usize],
    null_ll: f64,
    feature_names: &[String], // ARGUMEN BARU
) -> StepDetail {
    let n = y_vector.len();
    let n_total_vars = full_x.ncols();
    let chi_dist_1df = ChiSquared::new(1.0).unwrap();

    // 1. Model Summary
    let summary = ModelSummary {
        log_likelihood: model.final_log_likelihood,
        cox_snell_r_square: 0.0,
        nagelkerke_r_square: calculate_nagelkerke(null_ll, model.final_log_likelihood, n),
        converged: model.converged,
        iterations: model.iterations,
    };

    // 2. Classification Table
    let mut tn = 0;
    let mut fp = 0;
    let mut fn_ = 0;
    let mut tp = 0;
    for (i, &pred) in model.predictions.iter().enumerate() {
        let actual = y_vector[i] > 0.5;
        let predicted = pred > 0.5;
        match (actual, predicted) {
            (false, false) => tn += 1,
            (false, true) => fp += 1,
            (true, false) => fn_ += 1,
            (true, true) => tp += 1,
        }
    }
    let class_table = ClassificationTable {
        observed_0_predicted_0: tn,
        observed_0_predicted_1: fp,
        percentage_correct_0: if (tn + fp) > 0 {
            tn as f64 / (tn + fp) as f64 * 100.0
        } else {
            0.0
        },
        observed_1_predicted_0: fn_,
        observed_1_predicted_1: tp,
        percentage_correct_1: if (tp + fn_) > 0 {
            tp as f64 / (tp + fn_) as f64 * 100.0
        } else {
            0.0
        },
        overall_percentage: (tn + tp + fn_ + fp) as f64 / n as f64 * 100.0,
    };

    // 3. Variables In Equation
    let mut variables_in = Vec::new();
    let b_int = model.beta[0];
    let se_int = model.covariance_matrix[(0, 0)].sqrt();
    let wald_int = (b_int / se_int).powi(2);
    variables_in.push(VariableRow {
        label: "Constant".to_string(),
        b: b_int,
        error: se_int,
        wald: wald_int,
        df: 1,
        sig: 1.0 - chi_dist_1df.cdf(wald_int),
        exp_b: b_int.exp(),
        lower_ci: (b_int - 1.96 * se_int).exp(),
        upper_ci: (b_int + 1.96 * se_int).exp(),
    });

    for (k, &idx) in included_indices.iter().enumerate() {
        let beta_idx = k + 1;
        let b = model.beta[beta_idx];
        let se = model.covariance_matrix[(beta_idx, beta_idx)].sqrt();
        let wald = (b / se).powi(2);

        // GUNAKAN NAMA ASLI
        let label = if idx < feature_names.len() {
            feature_names[idx].clone()
        } else {
            format!("Var_{}", idx + 1)
        };

        variables_in.push(VariableRow {
            label,
            b,
            error: se,
            wald,
            df: 1,
            sig: 1.0 - chi_dist_1df.cdf(wald),
            exp_b: b.exp(),
            lower_ci: (b - 1.96 * se).exp(),
            upper_ci: (b + 1.96 * se).exp(),
        });
    }

    // 4. Variables Not In Equation
    let mut variables_not_in = Vec::new();
    let current_design_matrix = build_design_matrix(full_x, included_indices, n);

    for i in 0..n_total_vars {
        if !included_indices.contains(&i) {
            let candidate_col = full_x.column(i).into_owned();
            let (stat, p_val) = calculate_score_test(
                &model.residuals,
                &model.weights,
                &current_design_matrix,
                &candidate_col,
                &model.covariance_matrix,
            );

            // GUNAKAN NAMA ASLI
            let label = if i < feature_names.len() {
                feature_names[i].clone()
            } else {
                format!("Var_{}", i + 1)
            };

            variables_not_in.push(VariableNotInEquation {
                label,
                score: stat,
                df: 1,
                sig: p_val,
            });
        }
    }

    // 5. Remainder Test
    let remainder_test = if !variables_not_in.is_empty() {
        // PERBAIKAN: Gunakan Global Score Test untuk Block 0 agar sama dengan SPSS
        if included_indices.is_empty() {
            let prob_null = model.predictions[0];
            let (g_chi, g_df, g_sig) =
                score_test::calculate_global_score_test(full_x, y_vector, prob_null);

            Some(RemainderTest {
                chi_square: g_chi,
                df: g_df,
                sig: g_sig,
            })
        } else {
            // Untuk step selanjutnya, gunakan sum sebagai aproksimasi standar
            let total_score: f64 = variables_not_in.iter().map(|v| v.score).sum();
            let total_df = variables_not_in.len() as i32;
            let total_sig = if total_df > 0 {
                1.0 - ChiSquared::new(total_df as f64).unwrap().cdf(total_score)
            } else {
                1.0
            };
            Some(RemainderTest {
                chi_square: total_score,
                df: total_df,
                sig: total_sig,
            })
        }
    } else {
        None
    };

    StepDetail {
        step,
        action,
        variable_changed,
        summary,
        classification_table: class_table,
        variables_in_equation: variables_in,
        variables_not_in_equation: variables_not_in,
        remainder_test,
    }
}
