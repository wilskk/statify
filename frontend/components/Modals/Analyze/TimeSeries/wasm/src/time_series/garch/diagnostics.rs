use wasm_bindgen::prelude::*;
use crate::GARCH;
#[wasm_bindgen]
impl GARCH {
    /// Calculate AIC: -2·LL + 2·k
    pub fn calculate_aic(&self, log_likelihood: f64) -> f64 {
        let k = 1 + self.p + self.q; // omega + alpha + beta
        -2.0 * log_likelihood + 2.0 * k as f64
    }
    
    /// Calculate BIC: -2·LL + k·ln(n)
    pub fn calculate_bic(&self, log_likelihood: f64, n: usize) -> f64 {
        let k = 1 + self.p + self.q;
        -2.0 * log_likelihood + (k as f64) * (n as f64).ln()
    }
    
    /// Main estimation method (menggunakan initial values simple)
    pub fn estimate(&mut self) {
        let data = self.get_data();
        let n = data.len();
        
        // Initial parameter estimates
        let var_uncon: f64 = data.iter().map(|r| r * r).sum::<f64>() / n as f64;
        let omega_init = var_uncon * 0.1;
        let alpha_init = vec![0.05; self.q];
        let beta_init = vec![0.85; self.p];
        
        // Calculate variance
        let variance = self.calculate_variance(omega_init, alpha_init.clone(), beta_init.clone());
        
        // Calculate log-likelihood
        let log_lik = self.calculate_log_likelihood(variance.clone());
        
        // Calculate diagnostics
        let aic = self.calculate_aic(log_lik);
        let bic = self.calculate_bic(log_lik, variance.len());
        
        // Set hasil
        self.set_omega(omega_init);
        self.set_alpha(alpha_init);
        self.set_beta(beta_init);
        self.set_variance(variance);
        self.set_log_likelihood(log_lik);
        self.set_aic(aic);
        self.set_bic(bic);
    }
}