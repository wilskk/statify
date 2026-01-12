use crate::models::config::LogisticConfig;
use crate::models::result::{
    ClassificationTable, LogisticResult, ModelIfTermRemovedRow, ModelSummary, OmniTests,
    RemainderTest, StepDetail, StepHistory, VariableNotInEquation, VariableRow, CategoricalCoding,
};
use crate::stats::irls::{fit, FittedModel};
use crate::stats::score_test::calculate_score_test;
use nalgebra::{DMatrix, DVector};
use statrs::distribution::{ChiSquared, ContinuousCDF};
use wasm_bindgen::JsValue;

pub fn run(
    x_matrix: &DMatrix<f64>,
    y_vector: &DVector<f64>,
    config: &LogisticConfig,
    feature_names: &[String],
    codings: Option<Vec<CategoricalCoding>>
) -> Result<LogisticResult, JsValue> {
    let n_samples = x_matrix.nrows();
    let n_total_vars = x_matrix.ncols();

    let mut included_indices: Vec<usize> = Vec::new();
    let mut steps_history: Vec<StepHistory> = Vec::new();
    let mut steps_details: Vec<StepDetail> = Vec::new();

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

    // Tracking untuk Step Chi-Square
    let mut prev_log_likelihood = null_log_likelihood;
    let mut prev_n_vars = 0;

    // CAPTURE STEP 0
    let step0_detail = calculate_step_snapshot(
        0,
        "Start".to_string(),
        None,
        &current_model,
        x_matrix,
        y_vector,
        &included_indices,
        null_log_likelihood,
        prev_log_likelihood,
        prev_n_vars,
        feature_names,
        config,
    );
    steps_details.push(step0_detail);

    let block_0_row = steps_details[0].variables_in_equation[0].clone();
    let mut step_count = 0;

    // --- STEPWISE LOOP ---
    loop {
        step_count += 1;
        if step_count > n_total_vars * 2 {
            break;
        }

        let mut best_candidate_idx = None;
        let mut best_score_stat = 0.0;
        let mut min_p_value = 1.0;

        // A. FORWARD ENTRY
        let current_x_for_score = build_design_matrix(x_matrix, &included_indices, n_samples);

        for i in 0..n_total_vars {
            if !included_indices.contains(&i) {
                let candidate_col = x_matrix.column(i).into_owned();
                let (stat, p_val) = calculate_score_test(
                    &current_model.residuals,
                    &current_model.weights,
                    &current_x_for_score,
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

        // Jika ada kandidat masuk
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
                    variable: feature_names[idx_in].clone(),
                    score_statistic: best_score_stat,
                    improvement_chi_sq: best_score_stat,
                    model_log_likelihood: new_model.final_log_likelihood,
                    nagelkerke_r2: calculate_nagelkerke(
                        null_log_likelihood,
                        new_model.final_log_likelihood,
                        n_samples,
                    ),
                });

                prev_log_likelihood = current_model.final_log_likelihood;
                prev_n_vars = included_indices.len();

                included_indices = trial_indices;
                current_model = new_model;
                variable_added = true;

                let step_detail = calculate_step_snapshot(
                    step_count,
                    "Entered".to_string(),
                    Some(feature_names[idx_in].clone()),
                    &current_model,
                    x_matrix,
                    y_vector,
                    &included_indices,
                    null_log_likelihood,
                    prev_log_likelihood,
                    prev_n_vars,
                    feature_names,
                    config,
                );
                steps_details.push(step_detail);
            }
        }

        // B. BACKWARD REMOVAL
        if variable_added && included_indices.len() > 1 {
            let chi_dist_1df = ChiSquared::new(1.0).unwrap();
            let mut worst_idx_loc = None;
            let mut max_p_val = 0.0;

            for (k, &original_idx) in included_indices.iter().enumerate() {
                let beta_idx = k + 1;
                let b = current_model.beta[beta_idx];
                let se = current_model.covariance_matrix[(beta_idx, beta_idx)].sqrt();
                let wald = (b / se).powi(2);
                let p_val_remove = 1.0 - chi_dist_1df.cdf(wald);

                if Some(original_idx) != best_candidate_idx {
                    if p_val_remove > config.p_removal && p_val_remove > max_p_val {
                        max_p_val = p_val_remove;
                        worst_idx_loc = Some(k);
                    }
                }
            }

            if let Some(loc) = worst_idx_loc {
                let removed_var_idx = included_indices[loc];

                prev_log_likelihood = current_model.final_log_likelihood;
                prev_n_vars = included_indices.len();

                included_indices.remove(loc);

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
                        variable: feature_names[removed_var_idx].clone(),
                        score_statistic: 0.0,
                        improvement_chi_sq: 2.0
                            * (current_model.final_log_likelihood
                                - reduced_model.final_log_likelihood)
                                .abs(),
                        model_log_likelihood: reduced_model.final_log_likelihood,
                        nagelkerke_r2: calculate_nagelkerke(
                            null_log_likelihood,
                            reduced_model.final_log_likelihood,
                            n_samples,
                        ),
                    });

                    current_model = reduced_model;

                    let step_detail = calculate_step_snapshot(
                        step_count,
                        "Removed".to_string(),
                        Some(feature_names[removed_var_idx].clone()),
                        &current_model,
                        x_matrix,
                        y_vector,
                        &included_indices,
                        null_log_likelihood,
                        prev_log_likelihood,
                        prev_n_vars,
                        feature_names,
                        config,
                    );
                    steps_details.push(step_detail);
                }
            }
        }

        if !variable_added {
            break;
        }
    }

    let final_step = steps_details.last().unwrap().clone();

    let omni = final_step.omni_tests.unwrap_or(OmniTests {
        chi_square: 0.0,
        df: 0,
        sig: 1.0,
    });

    Ok(LogisticResult {
        summary: final_step.summary,
        classification_table: final_step.classification_table,
        variables: final_step.variables_in_equation,
        variables_not_in_equation: final_step.variables_not_in_equation,
        omni_tests: omni,
        step_history: Some(steps_history),
        steps_detail: Some(steps_details),
        block_0_constant: block_0_row,
        block_0_variables_not_in: None,
        method_used: "Forward Conditional".to_string(),
        assumption_tests: None,
        overall_remainder_test: final_step.remainder_test,
        categorical_codings: codings,
    })
}

fn build_design_matrix(original_x: &DMatrix<f64>, indices: &[usize], rows: usize) -> DMatrix<f64> {
    let mut columns = vec![DVector::from_element(rows, 1.0)];
    for &idx in indices {
        columns.push(original_x.column(idx).into_owned());
    }
    DMatrix::from_columns(&columns)
}

fn calculate_nagelkerke(null_ll: f64, model_ll: f64, n: usize) -> f64 {
    let diff = null_ll - model_ll;
    let cox_snell = 1.0 - (diff * (2.0 / n as f64)).exp();
    let max_r2 = 1.0 - (null_ll * (2.0 / n as f64)).exp();
    if max_r2 > 1e-12 {
        cox_snell / max_r2
    } else {
        0.0
    }
}

// --- HELPER UNTUK OVERALL STATISTICS (RESIDUAL CHI-SQUARE) ---
fn calculate_overall_remainder_stats(
    full_x: &DMatrix<f64>,
    y_vector: &DVector<f64>, // Digunakan untuk hitung manual residuals
    included_indices: &[usize],
    model: &FittedModel,
) -> Option<RemainderTest> {
    let n_total_vars = full_x.ncols();
    // 1. Identifikasi variabel yang belum masuk (Excluded)
    let excluded_indices: Vec<usize> = (0..n_total_vars)
        .filter(|i| !included_indices.contains(i))
        .collect();

    if excluded_indices.is_empty() {
        return None;
    }

    // 2. Bangun Matriks X untuk Excluded Variables (X_out)
    // Tanpa Intercept, karena intercept sudah ada di model (included)
    let mut x_out_cols = Vec::new();
    for &idx in &excluded_indices {
        x_out_cols.push(full_x.column(idx).into_owned());
    }
    let x_out = DMatrix::from_columns(&x_out_cols);

    // 3. Bangun Matriks X untuk Included Variables (X_in)
    let x_in = build_design_matrix(full_x, included_indices, full_x.nrows());

    // 4. Hitung Score Vector: U = X_out^T * (y - p)
    // PERBAIKAN: Hitung manual raw residuals (y - p)
    let raw_residuals = y_vector - &model.predictions;
    let u = x_out.transpose() * &raw_residuals;

    // 5. Hitung Matriks Informasi
    // Gunakan model.weights yang merupakan p(1-p)
    let mut x_out_weighted = x_out.clone();
    for (row_idx, &weight) in model.weights.iter().enumerate() {
        for col_idx in 0..x_out.ncols() {
            x_out_weighted[(row_idx, col_idx)] *= weight;
        }
    }

    let v_out = x_out.transpose() * &x_out_weighted; // X_out^T W X_out
    let v_cross = x_out_weighted.transpose() * &x_in; // X_out^T W X_in

    // 6. Variance Score yang Disesuaikan (Adjusted Variance)
    // inv_info_in = (X_in^T W X_in)^-1 (Covariance Matrix dari model)
    let inv_info_in = &model.covariance_matrix;

    let correction = &v_cross * inv_info_in * v_cross.transpose();
    let adjusted_var = v_out - correction;

    // 7. Hitung Statistik Score Global: S = U^T * Var(U)^-1 * U
    let score_stat = match adjusted_var.cholesky() {
        Some(chol) => {
            let sol = chol.solve(&u);
            u.dot(&sol)
        }
        None => 0.0,
    };

    let df = excluded_indices.len() as i32;
    let sig = if score_stat > 0.0 && df > 0 {
        1.0 - ChiSquared::new(df as f64).unwrap().cdf(score_stat)
    } else {
        1.0
    };

    Some(RemainderTest {
        chi_square: score_stat,
        df,
        sig,
    })
}

// --- HELPER UNTUK MODEL IF TERM REMOVED ---
fn calculate_model_if_term_removed(
    current_model_ll: f64,
    x_matrix: &DMatrix<f64>,
    y_vector: &DVector<f64>,
    included_indices: &[usize],
    null_log_likelihood: f64,
    config: &LogisticConfig,
    feature_names: &[String],
    n_samples: usize,
) -> Option<Vec<ModelIfTermRemovedRow>> {
    if included_indices.is_empty() {
        return None;
    }

    let mut rows = Vec::new();
    let chi_dist = ChiSquared::new(1.0).unwrap();

    for (i, &idx_to_remove) in included_indices.iter().enumerate() {
        let mut subset_indices = included_indices.to_vec();
        subset_indices.remove(i);

        let reduced_ll;
        if subset_indices.is_empty() {
            reduced_ll = null_log_likelihood;
        } else {
            let x_subset = build_design_matrix(x_matrix, &subset_indices, n_samples);
            if let Ok(reduced_model) = fit(
                &x_subset,
                y_vector,
                config.max_iterations,
                config.convergence_threshold,
            ) {
                reduced_ll = reduced_model.final_log_likelihood;
            } else {
                continue;
            }
        }

        let change_val = 2.0 * (current_model_ll - reduced_ll).abs();
        let change_val_clean = if change_val < 1e-9 { 0.0 } else { change_val };

        let sig = if change_val_clean > 0.0 {
            1.0 - chi_dist.cdf(change_val_clean)
        } else {
            1.0
        };

        let label = if idx_to_remove < feature_names.len() {
            feature_names[idx_to_remove].clone()
        } else {
            format!("Var_{}", idx_to_remove)
        };

        rows.push(ModelIfTermRemovedRow {
            label,
            model_log_likelihood: reduced_ll,
            change_in_neg2ll: change_val_clean,
            df: 1,
            sig_change: sig,
        });
    }

    if rows.is_empty() {
        None
    } else {
        Some(rows)
    }
}

fn calculate_step_snapshot(
    step: usize,
    action: String,
    variable_changed: Option<String>,
    model: &FittedModel,
    full_x: &DMatrix<f64>,
    y_vector: &DVector<f64>,
    included_indices: &[usize],
    null_ll: f64,
    prev_ll: f64,
    prev_n_vars: usize,
    feature_names: &[String],
    config: &LogisticConfig,
) -> StepDetail {
    let n = y_vector.len();
    let n_total_vars = full_x.ncols();
    let chi_dist_1df = ChiSquared::new(1.0).unwrap();

    let diff = null_ll - model.final_log_likelihood;
    let cox_snell = 1.0 - (diff * (2.0 / n as f64)).exp();

    let summary = ModelSummary {
        log_likelihood: model.final_log_likelihood,
        cox_snell_r_square: cox_snell,
        nagelkerke_r_square: calculate_nagelkerke(null_ll, model.final_log_likelihood, n),
        converged: model.converged,
        iterations: model.iterations,
    };

    let chi_sq_model = 2.0 * (model.final_log_likelihood - null_ll).abs();
    let df_model = included_indices.len() as i32;
    let sig_model = if df_model > 0 {
        1.0 - ChiSquared::new(df_model as f64).unwrap().cdf(chi_sq_model)
    } else {
        1.0
    };

    let omni_tests_model = OmniTests {
        chi_square: chi_sq_model,
        df: df_model,
        sig: sig_model,
    };

    let chi_sq_step = 2.0 * (model.final_log_likelihood - prev_ll).abs();
    let df_step = (included_indices.len() as i32 - prev_n_vars as i32).abs();
    let sig_step = if df_step > 0 && chi_sq_step > 1e-9 {
        1.0 - ChiSquared::new(df_step as f64).unwrap().cdf(chi_sq_step)
    } else {
        1.0
    };

    let omni_tests_step = OmniTests {
        chi_square: chi_sq_step,
        df: df_step,
        sig: sig_step,
    };

    let model_if_term_removed = calculate_model_if_term_removed(
        model.final_log_likelihood,
        full_x,
        y_vector,
        included_indices,
        null_ll,
        config,
        feature_names,
        n,
    );

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

    // --- FIX: Gunakan helper dengan Raw Residuals ---
    let remainder_test =
        calculate_overall_remainder_stats(full_x, y_vector, included_indices, model);

    StepDetail {
        step,
        action,
        variable_changed,
        summary,
        classification_table: class_table,
        variables_in_equation: variables_in,
        variables_not_in_equation: variables_not_in,
        remainder_test,
        omni_tests: Some(omni_tests_model),
        step_omni_tests: Some(omni_tests_step),
        model_if_term_removed,
    }
}
