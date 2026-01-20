use wasm_bindgen::prelude::*;
use crate::ECM;
use crate::time_series::helper_structs::CointegrationResult;

#[wasm_bindgen]
impl ECM {
    /// ADF test on residuals untuk cointegration
    pub fn test_cointegration(&self, residuals: Vec<f64>) -> CointegrationResult {
        let n = residuals.len();
        let max_lag = self.max_lag_adf;
        
        // First difference of residuals
        let mut delta_resid = Vec::new();
        for i in 1..n {
            delta_resid.push(residuals[i] - residuals[i-1]);
        }
        
        // Lagged level
        let resid_lag1: Vec<f64> = residuals[..n-1].to_vec();
        
        // Simple ADF regression (simplified)
        // Δε_t = γε_{t-1} + errors
        let n_obs = delta_resid.len() - max_lag;
        let y_vec = &delta_resid[max_lag..];
        let x_vec = &resid_lag1[max_lag..max_lag + n_obs];
        
        // OLS for γ
        let mean_x: f64 = x_vec.iter().sum::<f64>() / n_obs as f64;
        let mean_y: f64 = y_vec.iter().sum::<f64>() / n_obs as f64;
        
        let mut num = 0.0;
        let mut den = 0.0;
        for i in 0..n_obs {
            num += (x_vec[i] - mean_x) * (y_vec[i] - mean_y);
            den += (x_vec[i] - mean_x).powi(2);
        }
        
        let gamma = num / den;
        
        // Calculate standard error (simplified)
        let mut sse = 0.0;
        for i in 0..n_obs {
            let fitted = gamma * x_vec[i];
            let resid = y_vec[i] - fitted;
            sse += resid * resid;
        }
        
        let se = (sse / (n_obs - 1) as f64 / den).sqrt();
        let t_stat = gamma / se;
        
        // Critical value at 5% (approximate)
        let critical_5pct = -2.86;
        let is_cointegrated = t_stat < critical_5pct;
        
        CointegrationResult {
            adf_statistic: t_stat,
            is_cointegrated,
        }
    }
}