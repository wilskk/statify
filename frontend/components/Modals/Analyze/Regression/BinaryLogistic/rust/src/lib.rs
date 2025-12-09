// src/lib.rs

// Pastikan semua module dideklarasikan
pub mod models;
pub mod stats;
pub mod strategies;
pub mod utils;

use models::config::{LogisticConfig, RegressionMethod};
use nalgebra::{DMatrix, DVector};
use wasm_bindgen::prelude::*;

// Helper untuk error
fn api_error(msg: &str) -> JsValue {
    JsValue::from_str(msg)
}

#[wasm_bindgen]
pub fn calculate_binary_logistic(
    data_x: &[f64],
    rows: usize,
    cols: usize,
    data_y: &[f64],
    config_json: String,
) -> Result<JsValue, JsValue> {
    web_sys::console::log_1(&format!("RUST RECEIVED CONFIG: {}", config_json).into());

    // 1. Parse Config
    let config: LogisticConfig = serde_json::from_str(&config_json)
        .map_err(|e| api_error(&format!("Gagal parsing config JSON: {}", e)))?;

    // 2. Validasi Data
    if rows == 0 || cols == 0 {
        return Err(api_error("Data input kosong"));
    }
    if data_x.len() != rows * cols {
        return Err(api_error("Dimensi data X salah"));
    }
    if data_y.len() != rows {
        return Err(api_error("Dimensi data Y salah"));
    }

    // 3. Buat Matrix
    let x_matrix = DMatrix::from_row_slice(rows, cols, data_x);
    let y_vector = DVector::from_column_slice(data_y);

    // 4. Pilih Strategi
    let result_struct = match config.method {
        RegressionMethod::Enter => strategies::enter::run(&x_matrix, &y_vector, &config)
            .map_err(|e| api_error(&format!("Error di Metode Enter: {}", e)))?,

        RegressionMethod::ForwardConditional => {
            strategies::forward_conditional::run(&x_matrix, &y_vector, &config)
                .map_err(|e| api_error(&format!("Error di Metode Forward Conditional: {:?}", e)))?
        }

        // Metode lain bisa di-handle error dulu
        _ => return Err(api_error("Metode ini belum diimplementasikan")),
    };

    // 5. Serialize Hasil
    let result_json = serde_wasm_bindgen::to_value(&result_struct)
        .map_err(|e| api_error(&format!("Gagal serialize output: {}", e)))?;

    Ok(result_json)
}
