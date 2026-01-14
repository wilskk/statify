use wasm_bindgen::prelude::*;
use crate::ECM;
use crate::time_series::ecm::ols_helper::OLSResult;

#[wasm_bindgen]
impl ECM {
    /// OLS regression: Y_t = β₀ + β₁X_t + ε_t
    pub fn estimate_long_run(&self) -> OLSResult {
        let y = &self.y;
        let x = &self.x;
        let n = y.len();
        
        // Calculate means
        let mean_x: f64 = x.iter().sum::<f64>() / n as f64;
        let mean_y: f64 = y.iter().sum::<f64>() / n as f64;
        
        // Calculate β₁ = Cov(X,Y) / Var(X)
        let mut numerator = 0.0;
        let mut denominator = 0.0;
        
        for i in 0..n {
            numerator += (x[i] - mean_x) * (y[i] - mean_y);
            denominator += (x[i] - mean_x).powi(2);
        }
        
        let beta1 = numerator / denominator;
        let beta0 = mean_y - beta1 * mean_x;
        
        // Calculate residuals
        let residuals: Vec<f64> = y.iter().zip(x.iter())
            .map(|(yi, xi)| yi - beta0 - beta1 * xi)
            .collect();
        
        OLSResult::new(beta0, beta1, residuals)
    }
}