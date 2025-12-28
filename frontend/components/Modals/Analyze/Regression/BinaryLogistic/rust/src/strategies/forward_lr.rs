use crate::models::config::LogisticConfig;
use crate::models::result::{
    ClassificationTable, LogisticResult, ModelSummary, OmniTests, StepHistory,
    VariableNotInEquation, VariableRow,
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
) -> Result<LogisticResult, JsValue> {
    let n_samples = x_matrix.nrows();
    let n_total_vars = x_matrix.ncols();

    let mut included_indices: Vec<usize> = Vec::new();
    let mut steps_history: Vec<StepHistory> = Vec::new();

    // --- STEP 0: NULL MODEL (Block 0) ---
    // Model tanpa variabel, hanya Intercept
    let null_x = DMatrix::from_element(n_samples, 1, 1.0);

    let mut current_model = fit(
        &null_x,
        y_vector,
        config.max_iterations,
        config.convergence_threshold,
    )
    .map_err(|e| JsValue::from_str(&format!("IRLS Error (Null Model): {}", e)))?;

    let null_log_likelihood = current_model.final_log_likelihood;

    // Siapkan Data Block 0 Constant
    let chi_dist_1df = ChiSquared::new(1.0).unwrap();
    let b0_val = current_model.beta[0];
    let b0_se = current_model.covariance_matrix[(0, 0)].sqrt();
    let b0_wald = (b0_val / b0_se).powi(2);

    let block_0_row = VariableRow {
        label: "Constant".to_string(),
        b: b0_val,
        error: b0_se,
        wald: b0_wald,
        df: 1,
        sig: 1.0 - chi_dist_1df.cdf(b0_wald),
        exp_b: b0_val.exp(),
        lower_ci: (b0_val - 1.96 * b0_se).exp(),
        upper_ci: (b0_val + 1.96 * b0_se).exp(),
    };

    let mut step_count = 0;

    // --- STEPWISE LOOP ---
    loop {
        step_count += 1;
        // Safety break untuk mencegah infinite loop
        if step_count > n_total_vars * 2 + 10 {
            break;
        }

        let mut best_candidate_idx = None;
        let mut best_score_stat = 0.0;
        let mut min_p_value = 1.0;

        // ---------------------------------------------------------
        // A. FORWARD ENTRY: Score Test (Sama seperti Conditional)
        // ---------------------------------------------------------
        // Standar industri (SPSS/SAS) menggunakan Score Test untuk entry
        // karena komputasinya efisien (tidak perlu re-fit).

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

        // Jika ada kandidat layak masuk (P < P_entry)
        if let Some(idx_in) = best_candidate_idx {
            let mut trial_indices = included_indices.clone();
            trial_indices.push(idx_in);

            let trial_x = build_design_matrix(x_matrix, &trial_indices, n_samples);

            // Fit model baru
            if let Ok(new_model) = fit(
                &trial_x,
                y_vector,
                config.max_iterations,
                config.convergence_threshold,
            ) {
                steps_history.push(StepHistory {
                    step: step_count,
                    action: "Entered".to_string(),
                    variable: format!("Var_{}", idx_in + 1),
                    score_statistic: best_score_stat,
                    improvement_chi_sq: best_score_stat, // Score stat approximate ChiSq improvement
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
            }
        }

        // ---------------------------------------------------------
        // B. BACKWARD REMOVAL: Likelihood Ratio (LR) Test
        // ---------------------------------------------------------
        // Bedanya dengan Conditional: Kita Re-Fit model n kali.

        // Kita hanya melakukan backward check jika ada variabel (selain intercept)
        // dan (opsional) jika baru saja ada variabel masuk atau memang loop berjalan.
        if included_indices.len() > 0 {
            let mut worst_idx_loc = None;
            let mut max_p_val = -1.0;
            let mut best_reduced_fit: Option<FittedModel> = None;
            let mut lr_stat_removed = 0.0;

            // Loop setiap variabel yang ada di model untuk dites "dibuang"
            for (k, &original_idx) in included_indices.iter().enumerate() {
                // Jangan buang variabel yang BARU SAJA masuk di step ini (untuk mencegah cycling)
                if variable_added && Some(original_idx) == best_candidate_idx {
                    continue;
                }

                // 1. Buat subset variabel tanpa variabel ke-k
                let mut temp_indices = included_indices.clone();
                temp_indices.remove(k);

                // 2. Build Matrix & Re-Fit (Heavy computation part)
                let reduced_x = build_design_matrix(x_matrix, &temp_indices, n_samples);

                if let Ok(reduced_model) = fit(
                    &reduced_x,
                    y_vector,
                    config.max_iterations,
                    config.convergence_threshold,
                ) {
                    // 3. Hitung LR Statistic
                    // Formula: -2 * (LL_reduced - LL_full)
                    // Karena LL log likelihood (biasanya negatif), LL_full > LL_reduced.
                    // Maka diff = LL_full - LL_reduced (positif).
                    let deviance_diff = 2.0
                        * (current_model.final_log_likelihood - reduced_model.final_log_likelihood);

                    // Pastikan tidak negatif karena floating point error
                    let lr_stat = if deviance_diff < 0.0 {
                        0.0
                    } else {
                        deviance_diff
                    };

                    // 4. Hitung P-Value (df=1)
                    let p_val_remove = 1.0 - chi_dist_1df.cdf(lr_stat);

                    // Cari P-Value terbesar (paling tidak signifikan)
                    if p_val_remove > config.p_removal && p_val_remove > max_p_val {
                        max_p_val = p_val_remove;
                        worst_idx_loc = Some(k);
                        best_reduced_fit = Some(reduced_model);
                        lr_stat_removed = lr_stat;
                    }
                }
            }

            // Hapus jika kriteria terpenuhi (P > P_out)
            if let Some(loc) = worst_idx_loc {
                let removed_var_idx = included_indices[loc];
                included_indices.remove(loc);

                if let Some(reduced_model) = best_reduced_fit {
                    steps_history.push(StepHistory {
                        step: step_count,
                        action: "Removed".to_string(),
                        variable: format!("Var_{}", removed_var_idx + 1),
                        score_statistic: 0.0, // Tidak relevan untuk removal
                        improvement_chi_sq: lr_stat_removed, // Nilai LR Change
                        model_log_likelihood: reduced_model.final_log_likelihood,
                        nagelkerke_r2: calculate_nagelkerke(
                            null_log_likelihood,
                            reduced_model.final_log_likelihood,
                            n_samples,
                        ),
                    });

                    current_model = reduced_model;
                    // Reset variable_added agar loop berlanjut mengecek variabel lain
                    // atau memberi kesempatan variable lain masuk (ping-pong effect check)
                }
            }
        }

        // Jika tidak ada variable masuk DAN tidak ada yang keluar di step ini, berhenti.
        // Catatan: Jika ada yang keluar, variable_added mungkin true/false tapi state berubah,
        // jadi kita butuh flag 'changed' sebenarnya.
        // Namun di logika ini, jika `variable_added` false, dan backward tidak menemukan `worst_idx_loc`,
        // maka loop selesai.
        // Jika `variable_added` true, loop lanjut.
        // Jika backward membuang variabel, loop harusnya lanjut (step berikutnya).
        // Kita sederhanakan: Break jika Step ini "Sepi" (No entry, no removal).
        // Karena `steps_history` mencatat aksi per step, kita bisa cek length history.

        let last_step_num = steps_history.last().map(|s| s.step).unwrap_or(0);
        if last_step_num < step_count {
            break;
        }
    }

    // --- FINAL CALCULATION ---

    // Calculate Variables Not In Equation untuk Final Model
    let mut variables_not_in_equation_list: Vec<VariableNotInEquation> = Vec::new();
    let current_x_final = build_design_matrix(x_matrix, &included_indices, n_samples);

    for i in 0..n_total_vars {
        if !included_indices.contains(&i) {
            let candidate_col = x_matrix.column(i).into_owned();

            // Score Test untuk variabel luar
            let (stat, p_val) = calculate_score_test(
                &current_model.residuals,
                &current_model.weights,
                &current_x_final,
                &candidate_col,
                &current_model.covariance_matrix,
            );

            variables_not_in_equation_list.push(VariableNotInEquation {
                label: format!("Var_{}", i + 1),
                score: stat,
                df: 1,
                sig: p_val,
            });
        }
    }

    format_result(
        current_model,
        null_log_likelihood,
        &included_indices,
        y_vector,
        steps_history,
        block_0_row,
        variables_not_in_equation_list,
    )
}

// --- HELPER FUNCTIONS (Sama seperti forward_conditional) ---

fn build_design_matrix(original_x: &DMatrix<f64>, indices: &[usize], rows: usize) -> DMatrix<f64> {
    let mut columns = vec![DVector::from_element(rows, 1.0)]; // Intercept
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

fn format_result(
    model: FittedModel,
    null_ll: f64,
    included_indices: &[usize],
    y_vector: &DVector<f64>,
    history: Vec<StepHistory>,
    block_0_row: VariableRow,
    vars_not_in: Vec<VariableNotInEquation>,
) -> Result<LogisticResult, JsValue> {
    let n = y_vector.len();
    let chi_dist = ChiSquared::new(1.0).unwrap();

    // 1. Summary
    let summary = ModelSummary {
        log_likelihood: model.final_log_likelihood,
        cox_snell_r_square: 0.0, // Opsional: tambahkan rumus jika perlu
        nagelkerke_r_square: calculate_nagelkerke(null_ll, model.final_log_likelihood, n),
        converged: model.converged,
        iterations: model.iterations,
    };

    // 2. Variables in Equation
    let mut variables_in = Vec::new();

    // Intercept
    let b_int = model.beta[0];
    let se_int = model.covariance_matrix[(0, 0)].sqrt();
    let wald_int = (b_int / se_int).powi(2);

    variables_in.push(VariableRow {
        label: "Constant".to_string(),
        b: b_int,
        error: se_int,
        wald: wald_int,
        df: 1,
        sig: 1.0 - chi_dist.cdf(wald_int),
        exp_b: b_int.exp(),
        lower_ci: (b_int - 1.96 * se_int).exp(),
        upper_ci: (b_int + 1.96 * se_int).exp(),
    });

    // Predictors
    for (k, &idx) in included_indices.iter().enumerate() {
        let beta_idx = k + 1;
        let b = model.beta[beta_idx];
        let se = model.covariance_matrix[(beta_idx, beta_idx)].sqrt();
        let wald = (b / se).powi(2);

        variables_in.push(VariableRow {
            label: format!("Var_{}", idx + 1),
            b,
            error: se,
            wald,
            df: 1,
            sig: 1.0 - chi_dist.cdf(wald),
            exp_b: b.exp(),
            lower_ci: (b - 1.96 * se).exp(),
            upper_ci: (b + 1.96 * se).exp(),
        });
    }

    // 3. Classification Table
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

    // 4. Omnibus Tests
    let chi_sq_model = 2.0 * (model.final_log_likelihood - null_ll).abs();
    let df_model = included_indices.len() as i32;
    let omni_sig = if df_model > 0 {
        1.0 - ChiSquared::new(df_model as f64).unwrap().cdf(chi_sq_model)
    } else {
        1.0
    };

    Ok(LogisticResult {
        summary,
        classification_table: class_table,
        variables: variables_in,
        variables_not_in_equation: vars_not_in,
        omni_tests: OmniTests {
            chi_square: chi_sq_model,
            df: df_model,
            sig: omni_sig,
        },
        step_history: Some(history),
        block_0_constant: block_0_row,
        method_used: "Forward LR".to_string(),
    })
}
