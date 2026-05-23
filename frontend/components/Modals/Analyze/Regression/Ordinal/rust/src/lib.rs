mod data;
mod derivatives;
mod likelihood;
mod links;
mod model;
mod optimizer;
mod output;
mod parallel;
mod statistics;
mod types;
mod utils;
mod validation;

pub use data::*;
pub use derivatives::*;
pub use likelihood::*;
pub use links::*;
pub use model::*;
pub use optimizer::*;
pub use output::*;
pub use parallel::*;
pub use statistics::*;
pub use types::*;
pub use validation::*;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn plum_version() -> String {
    "statify_ordinal-0.1.0".to_string()
}

#[wasm_bindgen]
pub fn plum_validate(input: JsValue) -> Result<JsValue, JsValue> {
    let parsed: PlumFitInput = serde_wasm_bindgen::from_value(input)
        .map_err(|e| JsValue::from_str(&format!("Invalid input: {e}")))?;
    let validation = validation::validate_input(&parsed);
    serde_wasm_bindgen::to_value(&validation)
        .map_err(|e| JsValue::from_str(&format!("Output serialization failed: {e}")))
}

#[wasm_bindgen]
pub fn plum_fit(input: JsValue) -> Result<JsValue, JsValue> {
    let parsed: PlumFitInput = serde_wasm_bindgen::from_value(input)
        .map_err(|e| JsValue::from_str(&format!("Invalid input: {e}")))?;

    let validation = validation::validate_input(&parsed);
    if !validation.valid {
        return Err(JsValue::from_str(&validation.errors.join("; ")));
    }

    let data = data::aggregate_data(&parsed)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let spec = PlumSpec::from_input(&parsed)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let options = EstimationOptions::from_payload(parsed.payload.estimation.as_ref());
    let fit = optimizer::fit_plum(&data, &spec, &options)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let output = output::build_plum_output(&parsed, &data, &spec, &fit)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    serde_wasm_bindgen::to_value(&output)
        .map_err(|e| JsValue::from_str(&format!("Output serialization failed: {e}")))
}
