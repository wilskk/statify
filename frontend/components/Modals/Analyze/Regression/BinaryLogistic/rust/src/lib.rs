mod models;
mod stats;
mod utils;

use models::config::LogisticConfig;
use models::result::{
    ClassificationTable, LogisticResult, ModelSummary, OmniTests, VariableNotInEquation,
    VariableRow,
};
use nalgebra::{DMatrix, DVector};
use serde_wasm_bindgen::{from_value, to_value};
use statrs::distribution::{ChiSquared, ContinuousCDF};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn calculate_binary_logistic(
    data_x: JsValue,
    data_y: JsValue,
    config_val: JsValue,
) -> Result<JsValue, JsValue> {
    // 1. Deserialisasi
    let x_vec: Vec<Vec<f64>> = from_value(data_x).map_err(|e| e.to_string())?;
    let y_vec: Vec<f64> = from_value(data_y).map_err(|e| e.to_string())?;
    let config: LogisticConfig = from_value(config_val).unwrap_or_default();

    let n_samples = y_vec.len();
    let n_features = x_vec[0].len(); // Jumlah variabel independen asli

    // Konversi Matriks
    let mut x_mat =
        DMatrix::from_vec(n_features, n_samples, x_vec.into_iter().flatten().collect()).transpose();
    let y_vec = DVector::from_vec(y_vec);

    // ---------------------------------------------------------
    // TAHAP 1: ANALISIS BLOCK 0 (Null Model / Hanya Intercept)
    // ---------------------------------------------------------

    // Hitung Mean Y (Probabilitas Null)
    let sum_y = y_vec.sum();
    let p_null = sum_y / n_samples as f64;
    let p_safe_null = p_null.clamp(1e-10, 1.0 - 1e-10);

    // Logit Null (B0 Constant) = ln(p / 1-p)
    let b0_val = (p_safe_null / (1.0 - p_safe_null)).ln();
    let b0_se = (1.0 / (n_samples as f64 * p_safe_null * (1.0 - p_safe_null))).sqrt(); // Approx SE
    let b0_wald = (b0_val / b0_se).powi(2);
    let b0_sig = 1.0 - ChiSquared::new(1.0).unwrap().cdf(b0_wald);

    let block_0_constant = VariableRow {
        label: "Constant".to_string(),
        b: b0_val,
        se: b0_se,
        wald: b0_wald,
        df: 1,
        sig: b0_sig,
        exp_b: b0_val.exp(),
        lower_ci: 0.0, // Tidak relevan untuk Block 0 preview
        upper_ci: 0.0,
    };

    // Hitung Score Test untuk "Variables Not in Equation" (Block 0)
    // Score Test memeriksa korelasi residual Block 0 dengan setiap Variabel Independen
    let mut vars_not_in_eq = Vec::new();
    let residuals: DVector<f64> = y_vec.map(|y| y - p_null); // Residual null model

    // Variance Global untuk Score Test: p(1-p)
    let global_variance = p_null * (1.0 - p_null);

    for i in 0..n_features {
        // Ambil kolom variabel X ke-i
        let col = x_mat.column(i);

        // 1. Hitung Score (U) = Sum(residual * x)
        // Centering X diperlukan untuk Score Test yang akurat pada intercept-only model
        let mean_x = col.sum() / n_samples as f64;
        let centered_x = col.map(|v| v - mean_x);

        let score: f64 = centered_x.dot(&residuals);

        // 2. Hitung Information (V) = Sum(x_centered^2) * p(1-p)
        let sum_sq_x = centered_x.map(|v| v * v).sum();
        let info = sum_sq_x * global_variance;

        // 3. Score Statistic = U^2 / V
        let score_stat = if info > 1e-10 {
            (score * score) / info
        } else {
            0.0
        };
        let p_val = 1.0 - ChiSquared::new(1.0).unwrap().cdf(score_stat);

        vars_not_in_eq.push(VariableNotInEquation {
            label: format!("Var {}", i + 1), // Nanti di-map di worker
            score: score_stat,
            df: 1,
            sig: p_val,
        });
    }

    // ---------------------------------------------------------
    // TAHAP 2: ANALISIS BLOCK 1 (Full Model)
    // ---------------------------------------------------------

    // Tambah Intercept ke Matriks X untuk fitting
    if config.include_constant {
        x_mat = x_mat.insert_column(0, 1.0);
    }

    // Jalankan Algoritma IRLS
    let irls_result = stats::irls::fit(
        &x_mat,
        &y_vec,
        config.max_iterations,
        config.convergence_threshold,
    )
    .map_err(|e| e.to_string())?;

    // Hitung Statistik Variabel (Variables in Equation Block 1)
    let mut variables_rows = Vec::new();
    let standard_errors = irls_result.covariance_matrix.diagonal().map(|v| v.sqrt());

    for i in 0..irls_result.beta.len() {
        let b = irls_result.beta[i];
        let se = standard_errors[i];
        let wald = if se > 1e-10 { (b / se).powi(2) } else { 0.0 };
        let sig = match ChiSquared::new(1.0) {
            Ok(dist) => 1.0 - dist.cdf(wald),
            Err(_) => 0.0,
        };
        let exp_b = b.exp();
        let z_score = 1.96; // 95% CI
        let lower = (b - z_score * se).exp();
        let upper = (b + z_score * se).exp();

        let label = if config.include_constant && i == 0 {
            "Constant".to_string()
        } else {
            let idx = if config.include_constant { i } else { i + 1 };
            format!("Var {}", idx)
        };

        variables_rows.push(VariableRow {
            label,
            b,
            se,
            wald,
            df: 1,
            sig,
            exp_b,
            lower_ci: lower,
            upper_ci: upper,
        });
    }

    // Hitung Metrics (Summary & Omnibus)
    let metrics = stats::metrics::calculate_model_metrics(irls_result.final_log_likelihood, &y_vec);
    let df_model = if config.include_constant {
        (x_mat.ncols() - 1) as i32
    } else {
        x_mat.ncols() as i32
    };
    let omni_chi = stats::metrics::calculate_omnibus_chi_square(
        metrics.null_log_likelihood,
        metrics.model_log_likelihood,
    );
    let omni_sig = stats::metrics::calculate_sig(omni_chi, df_model);

    let class_table = stats::table::calculate_classification_table(
        &irls_result.predictions,
        &y_vec,
        config.cutoff,
    );

    let result = LogisticResult {
        summary: ModelSummary {
            log_likelihood: -2.0 * metrics.model_log_likelihood,
            cox_snell_r_square: metrics.cox_snell,
            nagelkerke_r_square: metrics.nagelkerke,
            iterations: irls_result.iterations,
            converged: irls_result.converged,
        },
        classification_table: class_table,
        variables: variables_rows,

        // Tambahan Data Baru
        variables_not_in_equation: vars_not_in_eq,
        block_0_constant: block_0_constant,

        omni_tests: OmniTests {
            chi_square: omni_chi,
            df: df_model,
            sig: omni_sig,
        },
    };

    Ok(to_value(&result).map_err(|e| e.to_string())?)
}
