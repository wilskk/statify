use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use nalgebra::{DMatrix, DVector};
use statrs::distribution::{ChiSquared, ContinuousCDF};

// --- 1. STRUKTUR INPUT (Dari JS) ---
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")] 
pub struct LogisticInput {
    pub y: Vec<f64>,                
    pub x: Vec<Vec<f64>>,           
    pub config: LogisticConfig,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")] 
pub struct LogisticConfig {
    pub cutoff: f64,                
    pub max_iterations: usize,   
    pub include_constant: bool,     
}

// --- 2. STRUKTUR OUTPUT (Ke JS) ---
#[derive(Serialize)]
pub struct LogisticResult {
    pub model_summary: ModelSummary,
    pub classification_table: ClassificationTable,
    pub variables_in_equation: Vec<VariableRow>,
    pub omni_tests: OmniTests,
}

#[derive(Serialize)]
pub struct ModelSummary {
    pub log_likelihood: f64,        // -2 Log Likelihood
    pub cox_snell_r2: f64,
    pub nagelkerke_r2: f64,
}

#[derive(Serialize)]
pub struct ClassificationTable {
    pub predicted_0_observed_0: i32,
    pub predicted_1_observed_0: i32,
    pub predicted_0_observed_1: i32,
    pub predicted_1_observed_1: i32,
    pub overall_percentage: f64,
}

#[derive(Serialize)]
pub struct VariableRow {
    pub label: String,      // "X", "X2", "Constant"
    pub b: f64,             // Koefisien (B)
    pub se: f64,            // S.E.
    pub wald: f64,          // Wald
    pub df: i32,            // df (biasanya 1)
    pub sig: f64,           // Sig. (P-Value)
    pub exp_b: f64,         // Exp(B) / Odds Ratio
}

#[derive(Serialize)]
pub struct OmniTests {
    pub chi_square: f64,
    pub df: i32,
    pub sig: f64,
}

#[wasm_bindgen]
pub fn calculate_logistic_regression(input_val: JsValue) -> Result<JsValue, JsValue> {
    let input: LogisticInput = serde_wasm_bindgen::from_value(input_val)?;
    
    let n = input.y.len();
    let p_count = input.x[0].len(); // Jumlah predictor
    
    // 1. Persiapan Matriks X (Tambah Intercept jika perlu)
    let mut x_vec = Vec::with_capacity(n * (p_count + 1));
    for row in &input.x {
        if input.config.include_constant {
            x_vec.push(1.0); // Kolom konstanta (biasanya di awal)
        }
        x_vec.extend_from_slice(row);
    }
    
    let cols = if input.config.include_constant { p_count + 1 } else { p_count };
    let x_matrix = DMatrix::from_row_slice(n, cols, &x_vec);
    let y_vector = DVector::from_vec(input.y);

    // 2. Iteratively Reweighted Least Squares (IRLS)
    // Inisialisasi Beta dengan 0
    let mut beta = DVector::zeros(cols);
    let mut final_likelihood = 0.0;
    let mut var_matrix = DMatrix::zeros(cols, cols);

    for _iter in 0..input.config.max_iterations {
        // Hitung Probabilitas (Sigmoid): p = 1 / (1 + e^-(X * beta))
        let linear_pred = &x_matrix * &beta;
        let p: DVector<f64> = linear_pred.map(|z| 1.0 / (1.0 + (-z).exp()));
        
        // Hitung Matriks Bobot Diagonal (W) = p * (1 - p)
        let w_diag: Vec<f64> = p.iter().map(|&pi| pi * (1.0 - pi)).collect();
        let w_matrix = DMatrix::from_diagonal(&DVector::from_vec(w_diag));
        
        // Hitung Hessian (X^T * W * X)
        let hessian = &x_matrix.transpose() * &w_matrix * &x_matrix;
        
        // Invers Hessian (Variance-Covariance Matrix)
        // Ini krusial untuk Standard Error (S.E.)
        match hessian.try_inverse() {
            Some(inv_hessian) => var_matrix = inv_hessian,
            None => return Err(JsValue::from_str("Singular matrix, cannot invert")),
        }

        // Update Beta: New = Old + (Hessian^-1 * Gradient)
        // Gradient = X^T * (y - p)
        let gradient = &x_matrix.transpose() * (&y_vector - &p);
        let step = &var_matrix * gradient;
        
        let old_beta = beta.clone();
        beta += step;

        // Cek Konvergensi (jika perubahan sangat kecil, stop)
        if (&beta - old_beta).norm() < 1e-6 {
            break;
        }
    }

    // 3. Hitung Log Likelihood Akhir (-2LL)
    let linear_pred = &x_matrix * &beta;
    let p_final: DVector<f64> = linear_pred.map(|z| 1.0 / (1.0 + (-z).exp()));
    
    let mut log_likelihood = 0.0;
    for i in 0..n {
        let yi = y_vector[i];
        let pi = p_final[i];
        // Mencegah log(0)
        let safe_pi = if pi < 1e-10 { 1e-10 } else if pi > 1.0 - 1e-10 { 1.0 - 1e-10 } else { pi };
        log_likelihood += yi * safe_pi.ln() + (1.0 - yi) * (1.0 - safe_pi).ln();
    }
    let minus_2ll = -2.0 * log_likelihood;

    // 4. Hitung R-Square (Cox & Snell dan Nagelkerke)
    // Butuh Log Likelihood Null Model (Hanya Intercept)
    let mean_y = y_vector.sum() / n as f64;
    let ll_null = n as f64 * (mean_y * mean_y.ln() + (1.0 - mean_y) * (1.0 - mean_y).ln());
    let minus_2ll_null = -2.0 * ll_null;
    
    let cox_snell = 1.0 - (ll_null / log_likelihood).exp().powf(2.0 / n as f64); // Aproksimasi
    // Rumus Cox & Snell asli: 1 - (L_null / L_model)^(2/n)
    let l_null = (-minus_2ll_null / 2.0).exp();
    let l_model = (-minus_2ll / 2.0).exp();
    let cox_snell_real = 1.0 - (l_null / l_model).powf(2.0 / n as f64);
    
    let max_r2 = 1.0 - l_null.powf(2.0 / n as f64);
    let nagelkerke = cox_snell_real / max_r2;

    // 5. Konstruksi Tabel "Variables in the Equation"
    let mut variables_stats = Vec::new();
    
    // Ambil nama variabel dari input (ideally passed in config, here we simulate)
    // Urutan beta: [Constant, X1, X2, X3...] jika include_constant true
    
    // Chi-Square Distribution untuk Sig.
    let chi_dist = ChiSquared::new(1.0).unwrap();

    for i in 0..cols {
        let b = beta[i];
        let variance = var_matrix[(i, i)];
        let se = variance.sqrt();
        let wald = (b / se).powi(2);
        let df = 1;
        let sig = 1.0 - chi_dist.cdf(wald); // P-Value
        let exp_b = b.exp();
        
        let label = if input.config.include_constant && i == 0 {
            "Constant".to_string()
        } else {
             // Logic untuk mapping nama variabel X1, X2...
             // Perlu disesuaikan indexnya
             format!("Var {}", i) 
        };

        variables_stats.push(VariableRow {
            label, b, se, wald, df, sig, exp_b
        });
    }

    // 6. Classification Table
    let mut pred_0_obs_0 = 0;
    let mut pred_1_obs_0 = 0;
    let mut pred_0_obs_1 = 0;
    let mut pred_1_obs_1 = 0;
    let mut correct = 0;

    for i in 0..n {
        let predicted_prob = p_final[i];
        let observed = y_vector[i] as i32;
        let predicted = if predicted_prob >= input.config.cutoff { 1 } else { 0 };
        
        if observed == 0 {
            if predicted == 0 { pred_0_obs_0 += 1; correct += 1; }
            else { pred_1_obs_0 += 1; }
        } else {
            if predicted == 0 { pred_0_obs_1 += 1; }
            else { pred_1_obs_1 += 1; correct += 1; }
        }
    }

    // 7. Return Hasil Akhir
    let result = LogisticResult {
        model_summary: ModelSummary {
            log_likelihood: minus_2ll,
            cox_snell_r2: cox_snell_real,
            nagelkerke_r2: nagelkerke,
        },
        classification_table: ClassificationTable {
            predicted_0_observed_0: pred_0_obs_0,
            predicted_1_observed_0: pred_1_obs_0,
            predicted_0_observed_1: pred_0_obs_1,
            predicted_1_observed_1: pred_1_obs_1,
            overall_percentage: (correct as f64 / n as f64) * 100.0,
        },
        variables_in_equation: variables_stats,
        omni_tests: OmniTests {
            chi_square: minus_2ll_null - minus_2ll, // Model Chi-Square
            df: p_count as i32,
            sig: 1.0 - ChiSquared::new(p_count as f64).unwrap().cdf(minus_2ll_null - minus_2ll),
        },
    };

    Ok(serde_wasm_bindgen::to_value(&result)?)
}