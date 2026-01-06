use nalgebra::{DMatrix, DVector};
use statrs::distribution::{ChiSquared, ContinuousCDF};
use std::error::Error;

use crate::models::config::LogisticConfig;
use crate::models::result::{LogisticResult, OmniTests, VariableNotInEquation, VariableRow};
use crate::stats::{irls, metrics, table};

pub fn run(
    x_raw: &DMatrix<f64>,
    y_vector: &DVector<f64>,
    config: &LogisticConfig,
) -> Result<LogisticResult, Box<dyn Error>> {
    let n_samples = x_raw.nrows();
    let n_features = x_raw.ncols();

    // ==========================================
    // BLOCK 0: NULL MODEL (Hanya Constant)
    // ==========================================
    let x_null = DMatrix::from_element(n_samples, 1, 1.0);
    let null_model = irls::fit(
        &x_null,
        y_vector,
        config.max_iterations,
        config.convergence_threshold,
    )?;
    let neg2ll_null = -2.0 * null_model.final_log_likelihood;

    // Constant Statistics
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
        lower_ci: 0.0,
        upper_ci: 0.0,
    };

    // --- SCORE TEST (Variables Not in Equation) ---
    // Rumus Score: S = U^2 / I
    // U = residual * x
    // I = p(1-p) * x^2
    let mut vars_not_in_eq = Vec::new();
    let residuals_null = y_vector - &null_model.predictions;
    let prob_null = null_model.predictions[0]; // Konstan untuk semua row
    let variance_null = prob_null * (1.0 - prob_null);

    for i in 0..n_features {
        let col = x_raw.column(i);

        // 1. Hitung U (Score Vector component)
        let u: f64 = col.dot(&residuals_null);

        // 2. Hitung Information (Variance component)
        // SPSS: Score = (Sum(resid * x))^2 / Sum(p(1-p) * (x - x_bar)^2) ?
        // Tidak, Rao Score test menggunakan uncentered second moment jika ada intercept di null model.

        // Versi Robust:
        // Score Statistic = U^T * inv(I) * U
        // Untuk 1 variabel tambahan: U^2 / (X^T W X - (X^T W 1)^2 / (1^T W 1))
        // Kita gunakan pendekatan residual murni karena model null sudah menyerap intercept.

        // Simplifikasi yang sering dipakai software untuk Block 0:
        let col_vec: DVector<f64> = col.into();
        let center_col = &col_vec.add_scalar(-col_vec.mean()); // Centering X meningkatkan akurasi Score test
        let info: f64 = center_col.iter().map(|v| v * v * variance_null).sum();

        let score_stat = if info > 1e-12 { (u * u) / info } else { 0.0 };
        let sig_val = if score_stat > 0.0 {
            1.0 - ChiSquared::new(1.0)?.cdf(score_stat)
        } else {
            1.0
        };

        vars_not_in_eq.push(VariableNotInEquation {
            label: format!("Var {}", i + 1),
            score: score_stat,
            df: 1,
            sig: sig_val,
        });
    }

    // ==========================================
    // BLOCK 1: FULL MODEL
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
    let neg2ll_full = -2.0 * full_model.final_log_likelihood;

    // --- OUTPUT ---
    let model_summary = metrics::calculate_r_squares(
        neg2ll_null,
        neg2ll_full,
        n_samples,
        full_model.converged,
        full_model.iterations,
    );

    let chi_sq_model = neg2ll_null - neg2ll_full;
    let df_model = (x_full.ncols() as i32) - (x_null.ncols() as i32);
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

    let classification_table =
        table::calculate_classification_table(&full_model.predictions, y_vector, config.cutoff);

    // Variables in Equation
    let mut variables_rows = Vec::new();
    let z_score = 1.96; // 95% CI

    for (i, &beta) in full_model.beta.iter().enumerate() {
        let cov_val = full_model.covariance_matrix[(i, i)];

        // Hindari NaN jika covariance negatif (floating point error)
        let std_error = if cov_val > 0.0 { cov_val.sqrt() } else { 0.0 };

        let wald = if std_error > 1e-12 {
            (beta / std_error).powi(2)
        } else {
            0.0
        };
        let sig = if wald > 0.0 {
            1.0 - ChiSquared::new(1.0)?.cdf(wald)
        } else {
            1.0
        };

        let lower_ci = (beta - z_score * std_error).exp();
        let upper_ci = (beta + z_score * std_error).exp();

        let label = if config.include_constant && i == 0 {
            "Constant".to_string()
        } else {
            let var_idx = if config.include_constant { i } else { i + 1 };
            format!("Var {}", var_idx)
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

    Ok(LogisticResult {
        summary: model_summary,
        classification_table,
        variables: variables_rows,
        variables_not_in_equation: vars_not_in_eq,
        block_0_constant,
        omni_tests,
        step_history: None,
        method_used: "Enter".to_string(),
        assumption_tests: None,
    })
}
