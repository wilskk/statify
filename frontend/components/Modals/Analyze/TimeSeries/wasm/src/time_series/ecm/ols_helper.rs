use wasm_bindgen::prelude::*;

// Helper struct for OLS result
// NOTE: Vec<f64> fields can't be public in WASM structs - use getters
#[wasm_bindgen]
pub struct OLSResult {
    pub beta0: f64,
    pub beta1: f64,
    residuals: Vec<f64>,  // Private - Vec can't be pub in WASM
}

#[wasm_bindgen]
impl OLSResult {
    pub fn new(beta0: f64, beta1: f64, residuals: Vec<f64>) -> OLSResult {
        OLSResult { beta0, beta1, residuals }
    }
    
    // Getter for residuals (clones because Vec can't be moved across WASM boundary)
    pub fn get_residuals(&self) -> Vec<f64> {
        self.residuals.clone()
    }
}
