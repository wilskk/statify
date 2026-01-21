mod models;
mod stats;

use crate::models::config::{AnalysisData, MultinomialConfig};
use crate::stats::core::perform_primary_calculation;
use crate::stats::estimation::estimate_parameters;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn run_multinomial_analysis(js_data: JsValue, js_config: JsValue) -> Result<JsValue, JsError> {
    // 1. Deserialisasi data
    let data: AnalysisData =
        serde_wasm_bindgen::from_value(js_data).map_err(|e| JsError::new(&e.to_string()))?;

    let config: MultinomialConfig =
        serde_wasm_bindgen::from_value(js_config).map_err(|e| JsError::new(&e.to_string()))?;

    // 2. Perhitungan Primer
    let primary = perform_primary_calculation(&data, &config).map_err(|e| JsError::new(&e))?; // e di sini sudah &str dari Result<_, String>

    // 3. Estimasi Parameter
    let result = estimate_parameters(&primary, &config).map_err(|e| JsError::new(&e))?;

    // 4. Konversi balik ke JS
    Ok(serde_wasm_bindgen::to_value(&result)?)
}
