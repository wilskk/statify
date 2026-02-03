use wasm_bindgen::prelude::*;
use crate::GARCH;

#[wasm_bindgen]
impl GARCH {
    /// TGARCH(p,q) / GJR-GARCH - Threshold GARCH
    /// σ²_t = ω + Σ(α_i + γ_i·I_{t-i})·ε²_{t-i} + Σβ_j·σ²_{t-j}
    /// where I_{t-i} = 1 if ε_{t-i} < 0, else 0 (leverage effect indicator)
    pub fn calculate_tgarch_variance(&self, omega: f64, alpha: Vec<f64>, gamma: Vec<f64>, beta: Vec<f64>) -> Vec<f64> {
        let data = self.get_data();
        let n = data.len();
        let max_lag = self.p.max(self.q);
        let mut variance = Vec::with_capacity(n);
        
        // Unconditional variance untuk initial values
        let var_uncon: f64 = data.iter().map(|r| r * r).sum::<f64>() / n as f64;
        
        for _ in 0..max_lag {
            variance.push(var_uncon);
        }
        
        for t in max_lag..n {
            let mut var_t = omega;
            
            // ARCH terms with threshold: Σ(α_i + γ_i·I_{t-i})·ε²_{t-i}
            for (i, &alpha_i) in alpha.iter().enumerate() {
                if t > i {
                    let epsilon = data[t - 1 - i];
                    let indicator = if epsilon < 0.0 { 1.0 } else { 0.0 };
                    
                    // Coefficient untuk negative shock: α_i + γ_i
                    let coef = alpha_i + gamma.get(i).unwrap_or(&0.0) * indicator;
                    var_t += coef * epsilon * epsilon;
                }
            }
            
            // GARCH terms: Σβ_j·σ²_{t-j}
            for (j, &beta_j) in beta.iter().enumerate() {
                if t > j {
                    var_t += beta_j * variance[t - 1 - j];
                }
            }
            
            variance.push(var_t.max(1e-8)); // Ensure positive
        }
        
        variance
    }
    
    /// Estimate TGARCH using initial parameters
    pub fn estimate_tgarch(&mut self) {
        let data = self.get_data();
        let n = data.len();
        
        // Initial parameter estimates
        let var_uncon: f64 = data.iter().map(|r| r * r).sum::<f64>() / n as f64;
        let omega_init = var_uncon * 0.1;
        let alpha_init = vec![0.05; self.q];   // Symmetric effect
        let gamma_init = vec![0.08; self.q];   // Leverage effect (typically positive)
        let beta_init = vec![0.85; self.p];
        
        // Calculate variance
        let variance = self.calculate_tgarch_variance(
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
        // Note: gamma tidak disimpan di struct dasar
        self.set_beta(beta_init);
        self.set_variance(variance);
        self.set_log_likelihood(log_lik);
        self.set_aic(aic);
        self.set_bic(bic);
    }
}
