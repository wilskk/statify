use crate::models::config::LogisticConfig;
use crate::models::result::{
    ClassificationTable, LogisticResult, ModelIfTermRemovedRow, ModelSummary, OmniTests,
    RemainderTest, StepDetail, StepHistory, VariableNotInEquation, VariableRow,
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
) -> Result<LogisticResult, JsValue> {
    let n_samples = x_matrix.nrows();
    let n_total_vars = x_matrix.ncols();
    let chi_dist_1df = ChiSquared::new(1.0).unwrap();

    // ========================================================================
    // BLOCK 0: NULL MODEL (ANALYTICAL APPROACH)
    // ========================================================================
    let sum_y: f64 = y_vector.sum();
    let n_1 = sum_y;
    let n_0 = n_samples as f64 - n_1;

    if n_1 == 0.0 || n_0 == 0.0 {
        return Err(JsValue::from_str("Data Y harus memiliki minimal satu kelas 0 dan satu kelas 1."));
    }

    // B0 = ln(n_1 / n_0)
    let b0_val = (n_1 / n_0).ln();
    // SE = sqrt( 1/n1 + 1/n0 )
    let b0_se = (1.0 / n_1 + 1.0 / n_0).sqrt();
    let b0_wald = (b0_val / b0_se).powi(2);
    let b0_sig = 1.0 - chi_dist_1df.cdf(b0_wald);

    // LL0
    let p_null = n_1 / (n_samples as f64);
    let null_log_likelihood = n_1 * p_null.ln() + n_0 * (1.0 - p_null).ln();

    // Block 0 Row
    let block_0_row = VariableRow {
        label: "Constant".to_string(),
        b: b0_val,
        error: b0_se,
        wald: b0_wald,
        df: 1,
        sig: b0_sig,
        exp_b: b0_val.exp(),
        lower_ci: (b0_val - 1.96 * b0_se).exp(),
        upper_ci: (b0_val + 1.96 * b0_se).exp(),
    };

    // Variables Not in Equation Block 0 (Score Tests)
    let null_residuals = y_vector.map(|y| y - p_null);
    let null_weight_scalar = p_null * (1.0 - p_null);
    let null_weights = DVector::from_element(n_samples, null_weight_scalar);
    let null_design_matrix = DMatrix::from_element(n_samples, 1, 1.0);
    let null_cov_scalar = b0_se.powi(2);
    let null_cov_matrix = DMatrix::from_element(1, 1, null_cov_scalar);

    let mut block_0_vars_not_in = Vec::new();
    let mut overall_score_stat = 0.0; 

    for i in 0..n_total_vars {
        let candidate_col = x_matrix.column(i).into_owned();
        let (stat, p_val) = calculate_score_test(
            &null_residuals,
            &null_weights,
            &null_design_matrix,
            &candidate_col,
            &null_cov_matrix,
        );
        let label = if i < feature_names.len() { feature_names[i].clone() } else { format!("Var_{}", i) };
        block_0_vars_not_in.push(VariableNotInEquation {
            label,
            score: stat,
            df: 1,
            sig: p_val,
        });
    }
    
    // Overall Stats Block 0
    let dummy_null_model_struct = FittedModel {
        beta: DVector::from_element(1, b0_val),
        covariance_matrix: null_cov_matrix.clone(),
        final_log_likelihood: null_log_likelihood,
        iterations: 0,
        converged: true,
        residuals: null_residuals.clone(),
        weights: null_weights.clone(),
        predictions: DVector::from_element(n_samples, p_null),
    };
    let empty_indices: Vec<usize> = Vec::new(); 
    if let Some(test) = calculate_overall_remainder_stats(x_matrix, y_vector, &empty_indices, &dummy_null_model_struct) {
        overall_score_stat = test.chi_square;
    }
    block_0_vars_not_in.push(VariableNotInEquation {
        label: "Overall Statistics".to_string(),
        score: overall_score_stat,
        df: n_total_vars as i32,
        sig: if overall_score_stat > 1e-9 { 1.0 - ChiSquared::new(n_total_vars as f64).unwrap().cdf(overall_score_stat) } else { 1.0 },
    });

    // ========================================================================
    // BLOCK 1: BACKWARD LR (START WITH FULL MODEL)
    // ========================================================================

    // --- STEP 1 (Start): FULL MODEL ---
    let mut included_indices: Vec<usize> = (0..n_total_vars).collect();
    let mut steps_history: Vec<StepHistory> = Vec::new();
    let mut steps_details: Vec<StepDetail> = Vec::new();

    // Fit Full Model
    let full_x = build_design_matrix(x_matrix, &included_indices, n_samples);
    let mut current_model = fit(
        &full_x,
        y_vector,
        config.max_iterations,
        config.convergence_threshold,
    )
    .map_err(|e| JsValue::from_str(&format!("IRLS Error (Full Model): {}", e)))?;

    // Tracker Step Chi-Square
    let mut prev_model_chi_sq = 2.0 * (current_model.final_log_likelihood - null_log_likelihood);

    // Snapshot Step 1 (Full Model)
    let step1_detail = calculate_step_snapshot(
        1,
        "Entered".to_string(),
        Some("All Variables".to_string()),
        &current_model,
        x_matrix,
        y_vector,
        &included_indices,
        null_log_likelihood,
        0.0, // Start
        feature_names,
        config,
        n_samples,
    );
    steps_details.push(step1_detail);

    let mut step_count = 1;

    // --- LOOP ELIMINASI (Likelihood Ratio) ---
    loop {
        step_count += 1;
        let mut worst_idx_loc: Option<usize> = None;
        let mut max_p_val = -1.0;
        let mut worst_change_val = 0.0;

        // 1. Cek Candidate Removal (-2LL Change)
        if included_indices.len() > 0 {
            for (loc, &_original_idx) in included_indices.iter().enumerate() {
                let mut temp_indices = included_indices.clone();
                temp_indices.remove(loc);

                let reduced_ll;
                if temp_indices.is_empty() {
                    reduced_ll = null_log_likelihood;
                } else {
                    let reduced_x = build_design_matrix(x_matrix, &temp_indices, n_samples);
                    if let Ok(temp_model) = fit(
                        &reduced_x,
                        y_vector,
                        config.max_iterations,
                        config.convergence_threshold,
                    ) {
                        reduced_ll = temp_model.final_log_likelihood;
                    } else {
                        continue;
                    }
                }

                // Change = 2 * |LL_Full - LL_Reduced|
                let change_abs = 2.0 * (current_model.final_log_likelihood - reduced_ll).abs();
                let p_val_remove = if change_abs < 1e-9 { 1.0 } else { 1.0 - chi_dist_1df.cdf(change_abs) };

                if p_val_remove > max_p_val {
                    max_p_val = p_val_remove;
                    worst_idx_loc = Some(loc);
                    worst_change_val = change_abs;
                }
            }
        }

        // 2. Eksekusi Penghapusan
        let mut variable_removed = false;
        if let Some(loc) = worst_idx_loc {
            if max_p_val > config.p_removal {
                let removed_var_idx = included_indices[loc];
                let removed_var_name = feature_names[removed_var_idx].clone();

                included_indices.remove(loc);

                let reduced_x = build_design_matrix(x_matrix, &included_indices, n_samples);
                if let Ok(new_model) = fit(
                    &reduced_x,
                    y_vector,
                    config.max_iterations,
                    config.convergence_threshold,
                ) {
                    current_model = new_model;

                    // Hitung Statistik Step (Negative Chi-Square)
                    let current_model_chi_sq = 2.0 * (current_model.final_log_likelihood - null_log_likelihood);
                    let step_chi_sq_val = current_model_chi_sq - prev_model_chi_sq;
                    prev_model_chi_sq = current_model_chi_sq;

                    let (cox, nagel) = calculate_r_squares(null_log_likelihood, current_model.final_log_likelihood, n_samples);

                    steps_history.push(StepHistory {
                        step: step_count,
                        action: "Removed".to_string(),
                        variable: removed_var_name.clone(),
                        score_statistic: 0.0, 
                        improvement_chi_sq: step_chi_sq_val, 
                        model_log_likelihood: current_model.final_log_likelihood,
                        nagelkerke_r2: nagel,
                    });

                    let step_detail = calculate_step_snapshot(
                        step_count,
                        "Removed".to_string(),
                        Some(removed_var_name),
                        &current_model,
                        x_matrix,
                        y_vector,
                        &included_indices,
                        null_log_likelihood,
                        step_chi_sq_val,
                        feature_names,
                        config,
                        n_samples,
                    );
                    steps_details.push(step_detail);
                    variable_removed = true;
                }
            }
        }

        if !variable_removed || included_indices.is_empty() {
            break;
        }
    }

    let final_step = steps_details.last().unwrap().clone();

    // Final Omni
    let chi_sq_model = 2.0 * (current_model.final_log_likelihood - null_log_likelihood).abs();
    let df_model = included_indices.len() as i32;
    let omni_sig = if df_model > 0 {
        1.0 - ChiSquared::new(df_model as f64).unwrap().cdf(chi_sq_model)
    } else { 1.0 };
    let omni = OmniTests { chi_square: chi_sq_model, df: df_model, sig: omni_sig };

    Ok(LogisticResult {
        summary: final_step.summary,
        classification_table: final_step.classification_table, 
        variables: final_step.variables_in_equation,
        variables_not_in_equation: final_step.variables_not_in_equation,
        block_0_constant: block_0_row,
        block_0_variables_not_in: Some(block_0_vars_not_in), 
        omni_tests: omni,
        step_history: Some(steps_history),
        steps_detail: Some(steps_details),
        method_used: "Backward LR".to_string(), // Label Method
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

fn calculate_r_squares(null_ll: f64, model_ll: f64, n: usize) -> (f64, f64) {
    let ratio_exponent = (2.0 / n as f64) * (null_ll - model_ll);
    let cox_snell = 1.0 - ratio_exponent.exp();
    let max_r2 = 1.0 - ((2.0 / n as f64) * null_ll).exp();
    let nagelkerke = if max_r2 > 1e-12 { cox_snell / max_r2 } else { 0.0 };
    (cox_snell, nagelkerke)
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
    step_chi_sq_val: f64, 
    feature_names: &[String],
    config: &LogisticConfig,
    n_samples: usize,
) -> StepDetail {
    let n_total_vars = full_x.ncols();
    let chi_dist_1df = ChiSquared::new(1.0).unwrap();

    let (cox, nagel) = calculate_r_squares(null_ll, model.final_log_likelihood, n_samples);
    let summary = ModelSummary {
        log_likelihood: model.final_log_likelihood,
        cox_snell_r_square: cox, 
        nagelkerke_r_square: nagel,
        converged: model.converged,
        iterations: model.iterations,
    };

    let chi_sq_model = 2.0 * (model.final_log_likelihood - null_ll).abs();
    let df_model = included_indices.len() as i32;
    let sig_model = if df_model > 0 {
        1.0 - ChiSquared::new(df_model as f64).unwrap().cdf(chi_sq_model)
    } else { 1.0 };
    let omni_tests_model = OmniTests { chi_square: chi_sq_model, df: df_model, sig: sig_model };

    let sig_step = if step_chi_sq_val.abs() > 1e-9 {
        1.0 - chi_dist_1df.cdf(step_chi_sq_val.abs())
    } else { 
        if step == 1 { 0.0 } else { 1.0 } 
    };
    
    let final_step_chi = if step == 1 { chi_sq_model } else { step_chi_sq_val };
    let final_step_df = if step == 1 { df_model } else { 1 };
    let final_step_sig = if step == 1 { sig_model } else { sig_step };

    let omni_tests_step = OmniTests { 
        chi_square: final_step_chi, 
        df: final_step_df, 
        sig: final_step_sig 
    };

    let model_if_term_removed = calculate_model_if_term_removed(
        model.final_log_likelihood,
        full_x,
        y_vector,
        included_indices,
        null_ll,
        config,
        feature_names,
        n_samples,
    );

    let mut tn = 0; let mut fp = 0; let mut fn_ = 0; let mut tp = 0;
    let cutoff = config.cutoff;
    for (i, &pred) in model.predictions.iter().enumerate() {
        let actual = y_vector[i] > 0.5;
        let predicted = pred > cutoff;
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
        percentage_correct_0: if (tn + fp) > 0 { tn as f64 / (tn + fp) as f64 * 100.0 } else { 0.0 },
        observed_1_predicted_0: fn_,
        observed_1_predicted_1: tp,
        percentage_correct_1: if (tp + fn_) > 0 { tp as f64 / (tp + fn_) as f64 * 100.0 } else { 0.0 },
        overall_percentage: (tn + tp + fn_ + fp) as f64 / n_samples as f64 * 100.0,
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
        let label = if idx < feature_names.len() { feature_names[idx].clone() } else { format!("Var_{}", idx) };
        
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
    let current_design_matrix = build_design_matrix(full_x, included_indices, n_samples);

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

            let label = if i < feature_names.len() { feature_names[i].clone() } else { format!("Var_{}", i) };
            variables_not_in.push(VariableNotInEquation {
                label,
                score: stat,
                df: 1,
                sig: p_val,
            });
        }
    }

    let remainder_test = calculate_overall_remainder_stats(full_x, y_vector, included_indices, model);

    StepDetail {
        step,
        action,
        variable_changed,
        summary,
        classification_table: class_table,
        variables_in_equation: variables_in,
        variables_not_in_equation: variables_not_in,
        model_if_term_removed,
        remainder_test,
        omni_tests: Some(omni_tests_model),
        step_omni_tests: Some(omni_tests_step),
    }
}

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
    if included_indices.is_empty() { return None; }
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
            if let Ok(reduced_model) = fit(&x_subset, y_vector, config.max_iterations, config.convergence_threshold) {
                reduced_ll = reduced_model.final_log_likelihood;
            } else { continue; }
        }

        let change_val = 2.0 * (current_model_ll - reduced_ll).abs();
        let sig = if change_val < 1e-9 { 1.0 } else { 1.0 - chi_dist.cdf(change_val) };

        let label = if idx_to_remove < feature_names.len() {
            feature_names[idx_to_remove].clone()
        } else { format!("Var_{}", idx_to_remove) };

        rows.push(ModelIfTermRemovedRow {
            label,
            model_log_likelihood: reduced_ll,
            change_in_neg2ll: change_val,
            df: 1,
            sig_change: sig,
        });
    }
    if rows.is_empty() { None } else { Some(rows) }
}

fn calculate_overall_remainder_stats(
    full_x: &DMatrix<f64>,
    y_vector: &DVector<f64>,
    included_indices: &[usize],
    model: &FittedModel,
) -> Option<RemainderTest> {
    let n_total_vars = full_x.ncols();
    let excluded_indices: Vec<usize> = (0..n_total_vars)
        .filter(|i| !included_indices.contains(i))
        .collect();

    if excluded_indices.is_empty() { return None; }

    let mut x_out_cols = Vec::new();
    for &idx in &excluded_indices {
        x_out_cols.push(full_x.column(idx).into_owned());
    }
    let x_out = DMatrix::from_columns(&x_out_cols);

    let raw_residuals = y_vector - &model.predictions;
    let u = x_out.transpose() * &raw_residuals;

    let x_in = if included_indices.is_empty() {
        DMatrix::from_element(full_x.nrows(), 1, 1.0)
    } else {
        build_design_matrix(full_x, included_indices, full_x.nrows())
    };

    let mut x_out_weighted = x_out.clone();
    for (row_idx, &weight) in model.weights.iter().enumerate() {
        for col_idx in 0..x_out.ncols() {
            x_out_weighted[(row_idx, col_idx)] *= weight;
        }
    }

    let v_out = x_out.transpose() * &x_out_weighted;
    let v_cross = x_out_weighted.transpose() * &x_in;
    let inv_info_in = &model.covariance_matrix;
    let correction = &v_cross * inv_info_in * v_cross.transpose();
    let adjusted_var = v_out - correction;

    let score_stat = match adjusted_var.cholesky() {
        Some(chol) => {
            let sol = chol.solve(&u);
            u.dot(&sol)
        }
        None => 0.0,
    };

    let df = excluded_indices.len() as i32;
    let sig = if score_stat > 1e-9 && df > 0 {
        1.0 - ChiSquared::new(df as f64).unwrap().cdf(score_stat)
    } else { 1.0 };

    Some(RemainderTest { chi_square: score_stat, df, sig })
}