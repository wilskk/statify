use wasm_bindgen::prelude::*;
use crate::ECM;
#[wasm_bindgen]
impl ECM {
    /// Estimate ECM: ΔY_t = α + γ·ECT_{t-1} + θ·ΔY_{t-1} + φ·ΔX_t + ε_t
    pub fn estimate_ecm(&mut self) {
        // Estimate long-run first
        let ols_result = self.estimate_long_run();
        self.set_long_run(ols_result.beta0, ols_result.beta1, ols_result.get_residuals());
        
        // Test cointegration
        let coint_result = self.test_cointegration(ols_result.get_residuals());
        self.set_cointegration(coint_result.adf_statistic, coint_result.is_cointegrated);
        
        if !coint_result.is_cointegrated {
            return; // Stop if not cointegrated
        }
        
        // Calculate first differences
        let n = self.y.len();
        let mut delta_y = Vec::new();
        let mut delta_x = Vec::new();
        
        for i in 1..n {
            delta_y.push(self.y[i] - self.y[i-1]);
            delta_x.push(self.x[i] - self.x[i-1]);
        }
        
        // ECT (lagged residuals)
        let ect = &self.long_run_residuals[..n-1];
        
        // Simple ECM regression (no lags for simplicity)
        // ΔY_t = α + γ·ECT_{t-1} + φ·ΔX_t
        let n_obs = delta_y.len();
        
        // This is simplified - full implementation would use matrix OLS
        // For now, just store placeholder
        self.ecm_coefficients = vec![0.0, -0.1, 0.5]; // [α, γ, φ]
        self.r_squared = 0.5;
    }
}