use nalgebra::{DMatrix, DVector};
use statrs::distribution::{ChiSquared, ContinuousCDF};
use std::error::Error;

use crate::models::config::LogisticConfig;
use crate::models::result::{
    LogisticResult, ModelSummary, OmniTests, RemainderTest, StepDetail, VariableNotInEquation,
    VariableRow,
};
use crate::stats::{irls, score_test, table};

pub fn run(
    x_raw: &DMatrix<f64>,
    y_vector: &DVector<f64>,
    config: &LogisticConfig,
    feature_names: &[String],
) -> Result<LogisticResult, Box<dyn Error>> {
    let n_samples = x_raw.nrows();
    let n_features = x_raw.ncols();

    let mut steps_details: Vec<StepDetail> = Vec::new();

    // ==========================================
    // BLOCK 0: NULL MODEL (Hanya Constant) - STEP 0
    // ==========================================
    let x_null = DMatrix::from_element(n_samples, 1, 1.0);
    let null_model = irls::fit(
        &x_null,
        y_vector,
        config.max_iterations,
        config.convergence_threshold,
    )?;

    // PENTING: Gunakan RAW Log Likelihood (Negatif)
    let null_log_likelihood = null_model.final_log_likelihood;

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
        lower_ci: (null_model.beta[0] - 1.96 * se_const0).exp(),
        upper_ci: (null_model.beta[0] + 1.96 * se_const0).exp(),
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
        // Fix: Tambahkan field omni_tests (None untuk Step 0)
        omni_tests: None,
        step_omni_tests: None,
        model_if_term_removed: None,
    });

    // ==========================================
    // BLOCK 1: FULL MODEL (Enter Method) - STEP 1
    // ==========================================
    let mut x_full = x_raw.clone();
    if config.include_constant {
        x_full = x_full.insert_column(0, 1.0);
    }

    let full_model = irls::fit(
        &x_full,
        y_vector,
        config.max_iterations,
        config.convergence_threshold,
    )?;

    // PENTING: Gunakan RAW Log Likelihood (Negatif)
    let full_log_likelihood = full_model.final_log_likelihood;

    // --- PERBAIKAN: Hitung Pseudo R-Squares (Cox & Snell + Nagelkerke) dengan Benar ---
    let n = n_samples as f64;

    // Hitung Cox & Snell
    // (LL0 - LL1) akan bernilai negatif atau nol karena LL1 (Full) >= LL0 (Null)
    let likelihood_diff = null_log_likelihood - full_log_likelihood;
    let cox_snell = 1.0 - (likelihood_diff * (2.0 / n)).exp();

    // Hitung Max Cox & Snell (untuk Nagelkerke)
    // Max R2 = 1 - L0^(2/n) = 1 - exp(LL0 * 2/n)
    let max_cox_snell = 1.0 - (null_log_likelihood * (2.0 / n)).exp();

    let nagelkerke = if max_cox_snell > 1e-12 {
        cox_snell / max_cox_snell
    } else {
        0.0
    };

    let model_summary = ModelSummary {
        log_likelihood: full_log_likelihood, // Formatter JS akan mengalikan ini dengan -2
        cox_snell_r_square: cox_snell,
        nagelkerke_r_square: nagelkerke,
        converged: full_model.converged,
        iterations: full_model.iterations,
    };

    let classification_table =
        table::calculate_classification_table(&full_model.predictions, y_vector, config.cutoff);

    // Variables in Equation (Full)
    let mut variables_rows = Vec::new();
    let z_score = 1.96;
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

    // --- Hitung Omnibus Tests SEBELUM Snapshot ---
    // Agar bisa dimasukkan ke dalam StepDetail Step 1
    let chi_sq_model = 2.0 * (full_log_likelihood - null_log_likelihood);
    let df_model = (x_full.ncols() as i32) - (x_null.ncols() as i32);

    // Safety check untuk Chi-Square negatif (floating point error)
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

    // Simpan Snapshot Step 1
    steps_details.push(StepDetail {
        step: 1,
        action: "Entered".to_string(),
        variable_changed: Some("All Variables".to_string()),
        summary: model_summary.clone(),
        classification_table: classification_table.clone(),
        variables_in_equation: variables_rows.clone(),
        variables_not_in_equation: Vec::new(),
        remainder_test: None,
        // Fix: Masukkan omni_tests ke snapshot
        omni_tests: Some(omni_tests.clone()),
        step_omni_tests: Some(omni_tests.clone()),
        model_if_term_removed: None,
    });

    let overall_test = RemainderTest {
        chi_square: g_chi,
        df: g_df,
        sig: g_sig,
    };

    Ok(LogisticResult {
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
    })
}
