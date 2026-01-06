pub mod models;
pub mod stats;
pub mod strategies;
pub mod utils;

use models::config::{LogisticConfig, RegressionMethod};
// Pastikan struct BoxTidwellRow dan VifRow di-export di result.rs dan di-pub di sini
use models::result::{BoxTidwellRow, VifRow};
use nalgebra::DMatrix;
use statrs::distribution::{ChiSquared, ContinuousCDF};
use wasm_bindgen::prelude::*;

// Helper untuk format error ke JS
fn api_error(msg: &str) -> JsValue {
    JsValue::from_str(msg)
}

// ========================================================================
// 1. BINARY LOGISTIC REGRESSION (MAIN)
// ========================================================================
#[wasm_bindgen]
pub fn calculate_binary_logistic(
    data_x: &[f64],
    rows: usize,
    cols: usize,
    data_y: &[f64],
    config_json: String,
) -> Result<JsValue, JsValue> {
    // A. Parse Konfigurasi
    let config: LogisticConfig = serde_json::from_str(&config_json)
        .map_err(|e| api_error(&format!("Gagal parsing config JSON: {}", e)))?;

    // B. Validasi Dimensi Data
    if rows == 0 || cols == 0 {
        return Err(api_error("Data input kosong (rows atau cols = 0)"));
    }
    if data_x.len() != rows * cols {
        return Err(api_error(&format!(
            "Dimensi data X salah. Harapan: {}, Aktual: {}",
            rows * cols,
            data_x.len()
        )));
    }
    if data_y.len() != rows {
        return Err(api_error(
            "Dimensi data Y tidak sesuai dengan jumlah baris X",
        ));
    }

    // C. Bentuk Matrix & Vector
    let x_matrix = DMatrix::from_row_slice(rows, cols, data_x);
    let y_vector = DMatrix::from_row_slice(rows, 1, data_y);

    // D. Router Metode Regresi
    // Panggil logika berdasarkan method yang dipilih (Enter, Forward, Backward)
    let result = match config.method {
        RegressionMethod::Enter => {
            strategies::enter::run(&x_matrix, &y_vector, &config)
            .map_err(|e| api_error(&format!("Error di Metode Enter: {}", e)))?
        },

        RegressionMethod::ForwardConditional => {
            strategies::forward_conditional::run(&x_matrix, &y_vector, &config)
                .map_err(|e| api_error(&format!("Error di Metode Forward Conditional: {:?}", e)))?
        },

        RegressionMethod::ForwardLR => {
            strategies::forward_lr::run(&x_matrix, &y_vector, &config)
                .map_err(|e| api_error(&format!("Error di Metode Forward LR: {:?}", e)))?
        },

        RegressionMethod::ForwardWald => {
            strategies::forward_wald::run(&x_matrix, &y_vector, &config)
                .map_err(|e| api_error(&format!("Error di Metode Forward Wald: {:?}", e)))?
        },

        RegressionMethod::BackwardConditional => {
            strategies::backward_conditional::run(&x_matrix, &y_vector, &config)
                .map_err(|e| api_error(&format!("Error di Metode Backward Conditional: {:?}", e)))?
        },

        // Metode lain bisa di-handle error dulu
        _ => return Err(api_error("Metode ini belum diimplementasikan")),
    };

    // E. Return Hasil
    match result {
        Ok(res) => {
            let json_output = serde_json::to_string(&res)
                .map_err(|e| api_error(&format!("Gagal serialize output: {}", e)))?;
            Ok(JsValue::from_str(&json_output))
        }
        Err(err_msg) => Err(api_error(&err_msg)),
    }
}

// ========================================================================
// 2. MULTICOLLINEARITY (VIF)
// ========================================================================
#[wasm_bindgen]
pub fn calculate_vif(data_x: &[f64], rows: usize, cols: usize) -> Result<JsValue, JsValue> {
    if rows == 0 || cols == 0 {
        return Err(api_error("Data kosong untuk VIF."));
    }

    // Reconstruct Matrix
    let x_matrix = DMatrix::from_row_slice(rows, cols, data_x);

    // Siapkan label dummy (karena worker JS yang akan mapping nama asli)
    let dummy_labels: Vec<String> = (0..cols).map(|i| format!("Var_{}", i)).collect();

    // Panggil logika statistik VIF
    // Pastikan stats::assumptions::calculate_vif tersedia di assumptions.rs
    match stats::assumptions::calculate_vif(&x_matrix, &dummy_labels) {
        Ok(vif_results) => {
            let json = serde_json::to_string(&vif_results)
                .map_err(|e| api_error(&format!("JSON Error: {}", e)))?;
            Ok(JsValue::from_str(&json))
        }
        Err(e) => Err(api_error(&e)),
    }
}

// ========================================================================
// 3. LINEARITY (BOX-TIDWELL)
// ========================================================================
#[derive(serde::Deserialize)]
struct BoxTidwellConfig {
    // Bisa tambahkan config khusus jika perlu, misal:
    // include_constant: bool
    #[serde(default)]
    feature_names: Vec<String>,
}

#[wasm_bindgen]
pub fn calculate_box_tidwell(
    data_x: &[f64],
    rows: usize,
    cols: usize,
    data_y: &[f64],
    config_json: String,
) -> Result<JsValue, JsValue> {
    // Parse config opsional (untuk nama fitur jika dikirim)
    let bt_config: BoxTidwellConfig =
        serde_json::from_str(&config_json).unwrap_or(BoxTidwellConfig {
            feature_names: (0..cols).map(|i| format!("Var_{}", i)).collect(),
        });

    let x_matrix = DMatrix::from_row_slice(rows, cols, data_x);
    let y_vector = DMatrix::from_row_slice(rows, 1, data_y);

    // Panggil logika statistik Box-Tidwell
    match stats::assumptions::calculate_box_tidwell(&x_matrix, &y_vector, &bt_config.feature_names)
    {
        Ok(bt_results) => {
            let json = serde_json::to_string(&bt_results)
                .map_err(|e| api_error(&format!("JSON Error: {}", e)))?;
            Ok(JsValue::from_str(&json))
        }
        Err(e) => Err(api_error(&e)),
    }
}
