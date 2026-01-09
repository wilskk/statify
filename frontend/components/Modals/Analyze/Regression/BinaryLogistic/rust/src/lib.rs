pub mod models;
pub mod stats;
pub mod strategies;
pub mod utils;

use models::config::{LogisticConfig, RegressionMethod};
// PERBAIKAN: Menghapus unused imports (BoxTidwellRow, VifRow)
use nalgebra::{DMatrix, DVector};
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
    feature_names_json: String,
) -> Result<JsValue, JsValue> {
    // A. Parse Konfigurasi
    let config: LogisticConfig = serde_json::from_str(&config_json)
        .map_err(|e| api_error(&format!("Gagal parsing config JSON: {}", e)))?;

    let feature_names: Vec<String> = serde_json::from_str(&feature_names_json)
        .map_err(|e| api_error(&format!("Gagal parsing feature names: {}", e)))?;

    // Validasi jumlah nama variabel match dengan cols
    if feature_names.len() != cols {
        return Err(api_error(&format!(
            "Mismatch features: Matrix cols={}, Names provided={}",
            cols,
            feature_names.len()
        )));
    }

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
    let y_vector = DVector::from_column_slice(data_y);

    // D. Router Metode Regresi
    let result = match config.method {
        RegressionMethod::Enter => {
            strategies::enter::run(&x_matrix, &y_vector, &config, &feature_names)
                .map_err(|e| api_error(&format!("Error di Metode Enter: {}", e)))?
        }

        RegressionMethod::ForwardConditional => {
            strategies::forward_conditional::run(&x_matrix, &y_vector, &config, &feature_names)
                .map_err(|e| api_error(&format!("Error di Metode Forward Conditional: {:?}", e)))?
        }

        RegressionMethod::ForwardLR => {
            strategies::forward_lr::run(&x_matrix, &y_vector, &config, &feature_names)
                .map_err(|e| api_error(&format!("Error di Metode Forward LR: {:?}", e)))?
        }

        RegressionMethod::ForwardWald => {
            strategies::forward_wald::run(&x_matrix, &y_vector, &config, &feature_names)
                .map_err(|e| api_error(&format!("Error di Metode Forward Wald: {:?}", e)))?
        }

        RegressionMethod::BackwardConditional => {
            strategies::backward_conditional::run(&x_matrix, &y_vector, &config, &feature_names)
                .map_err(|e| api_error(&format!("Error di Metode Backward Conditional: {:?}", e)))?
        }
    };

    // E. Return Hasil
    let json_output = serde_json::to_string(&result)
        .map_err(|e| api_error(&format!("Gagal serialize output: {}", e)))?;

    Ok(JsValue::from_str(&json_output))
}

// ========================================================================
// 2. MULTICOLLINEARITY (VIF)
// ========================================================================
#[wasm_bindgen]
pub fn calculate_vif(data_x: &[f64], rows: usize, cols: usize) -> Result<JsValue, JsValue> {
    if rows == 0 || cols == 0 {
        return Err(api_error("Data kosong untuk VIF."));
    }

    let x_matrix = DMatrix::from_row_slice(rows, cols, data_x);
    let dummy_labels: Vec<String> = (0..cols).map(|i| format!("Var_{}", i)).collect();

    match stats::assumptions::calculate_vif(&x_matrix, &dummy_labels) {
        Ok(vif_results) => {
            let json = serde_json::to_string(&vif_results)
                .map_err(|e| api_error(&format!("JSON Error: {}", e)))?;
            Ok(JsValue::from_str(&json))
        }
        Err(e) => Err(api_error(&e)),
    }
}

#[wasm_bindgen]
pub fn calculate_correlation_matrix(
    data_x: &[f64],
    rows: usize,
    cols: usize,
) -> Result<JsValue, JsValue> {
    if rows == 0 || cols == 0 {
        return Err(api_error("Data kosong untuk Correlation Matrix."));
    }

    let x_matrix = DMatrix::from_row_slice(rows, cols, data_x);
    // Nama variabel dummy sementara (akan di-mapping ulang di JS)
    let dummy_labels: Vec<String> = (0..cols).map(|i| format!("Var_{}", i)).collect();

    // Panggil logika perhitungan di stats::assumptions
    match stats::assumptions::calculate_correlation_matrix(&x_matrix, &dummy_labels) {
        Ok(corr_results) => {
            let json = serde_json::to_string(&corr_results)
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
    let bt_config: BoxTidwellConfig =
        serde_json::from_str(&config_json).unwrap_or(BoxTidwellConfig {
            feature_names: (0..cols).map(|i| format!("Var_{}", i)).collect(),
        });

    let x_matrix = DMatrix::from_row_slice(rows, cols, data_x);
    let y_vector = DVector::from_column_slice(data_y);

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
