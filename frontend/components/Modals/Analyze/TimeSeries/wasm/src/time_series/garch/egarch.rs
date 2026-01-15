use wasm_bindgen::prelude::*;
use crate::GARCH;

#[wasm_bindgen]
impl GARCH {
    /// EGARCH(p,q) - Exponential GARCH
    /// log(σ²_t) = ω + Σα_i·|z_{t-i}| + Σγ_i·z_{t-i} + Σβ_j·log(σ²_{t-j})
    /// where z_t = ε_t / σ_t (standardized residuals)
    pub fn calculate_egarch_variance(&self, omega: f64, alpha: Vec<f64>, gamma: Vec<f64>, beta: Vec<f64>) -> Vec<f64> {
        let data = self.get_data();
        let n = data.len();
        let max_lag = self.p.max(self.q);
        let mut variance = Vec::with_capacity(n);
        let mut log_variance = Vec::with_capacity(n);
        
        // Unconditional variance untuk initial values
        let var_uncon: f64 = data.iter().map(|r| r * r).sum::<f64>() / n as f64;
        let log_var_uncon = var_uncon.ln();
        
        for _ in 0..max_lag {
            variance.push(var_uncon);
            log_variance.push(log_var_uncon);
        }
        
        for t in max_lag..n {
            let mut log_var_t = omega;
            
            // ARCH terms: Σα_i·|z_{t-i}|
            for (i, &alpha_i) in alpha.iter().enumerate() {
                if t > i && variance[t - 1 - i] > 0.0 {
                    let z = data[t - 1 - i] / variance[t - 1 - i].sqrt();
                    log_var_t += alpha_i * z.abs();
                }
            }
            
            // Asymmetric terms: Σγ_i·z_{t-i}
            for (i, &gamma_i) in gamma.iter().enumerate() {
                if t > i && variance[t - 1 - i] > 0.0 {
                    let z = data[t - 1 - i] / variance[t - 1 - i].sqrt();
                    log_var_t += gamma_i * z;
                }
            }
            
            // GARCH terms: Σβ_j·log(σ²_{t-j})
            for (j, &beta_j) in beta.iter().enumerate() {
                if t > j {
                    log_var_t += beta_j * log_variance[t - 1 - j];
                }
            }
            
            log_variance.push(log_var_t);
            variance.push(log_var_t.exp().max(1e-8));
        }
        
        variance
    }
    
    /// Estimate EGARCH using initial parameters
    pub fn estimate_egarch(&mut self) {
        let data = self.get_data();
        let n = data.len();
        
        // Initial parameter estimates
        let var_uncon: f64 = data.iter().map(|r| r * r).sum::<f64>() / n as f64;
        let omega_init = var_uncon.ln() * 0.1;
        let alpha_init = vec![0.3; self.q];    // Magnitude effect
        let gamma_init = vec![-0.1; self.q];   // Asymmetry (negative news impact)
        let beta_init = vec![0.85; self.p];
        
        // Calculate variance
        let variance = self.calculate_egarch_variance(
            omega_init, 
            alpha_init.clone(), 
            gamma_init.clone(),
            beta_init.clone()
        );
        
        // Calculate log-likelihood
        let log_lik = self.calculate_log_likelihood(variance.clone());
        
        // Calculate diagnostics
        let aic = self.calculate_aic(log_lik);
        let bic = self.calculate_bic(log_lik, variance.len());
        
        // Store results
        self.set_omega(omega_init);
        self.set_alpha(alpha_init);
        // Note: gamma tidak disimpan di struct dasar, perlu extend struct
        self.set_beta(beta_init);
        self.set_variance(variance);
        self.set_log_likelihood(log_lik);
        self.set_aic(aic);
        self.set_bic(bic);
    }
}
