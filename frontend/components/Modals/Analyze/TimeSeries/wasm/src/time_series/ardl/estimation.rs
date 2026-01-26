use wasm_bindgen::prelude::*;
use crate::ARDL;
use nalgebra::{DMatrix, DVector};
use statrs::distribution::{StudentsT, ContinuousCDF};

#[wasm_bindgen]
impl ARDL {
    /// Estimate ARDL model using OLS
    pub fn estimate(&mut self) -> Result<(), JsValue> {
        // 1. Generate lags (X matrix and Y vector)
        // Note: generate_lags depends on self.p and self.q
        // x_raw: Vec<Vec<f64>> (columns)
        let (x_raw, y_vec) = self.generate_lags();
        
        let n = y_vec.len(); // Effective n (after lags)
        let k = x_raw.len(); // Number of parameters (including constant)
        
        if n <= k {
            return Err(JsValue::from_str("Insufficient degrees of freedom"));
        }
        
        // 2. Convert to nalgebra format
        // DMatrix::from_vec takes column-major. x_raw is separate columns (Vec<Vec<f64>>).
        // We need to flatten simple column-major or build appropriately.
        let mut x_flat_col_major = Vec::with_capacity(n * k);
        for col in &x_raw {
            if col.len() != n {
                 return Err(JsValue::from_str(&format!("Lag gen error: col len {} != n {}", col.len(), n)));
            }
            x_flat_col_major.extend_from_slice(col);
        }
        
        let x_mat = DMatrix::from_vec(n, k, x_flat_col_major);
        let y_vec_alg = DVector::from_vec(y_vec.clone());
        
        // 3. OLS Estimation: beta = (X'X)^-1 X'Y
        // Using SVD for stability: (X'X) might be singular-ish
        // Or simpler: x_mat.transpose() * x_mat ...
        
        let xt = x_mat.transpose();
        let xtx = &xt * &x_mat;
        let xty = &xt * &y_vec_alg;
        
        // Inverse of X'X
        let xtx_inv = match xtx.try_inverse() {
            Some(inv) => inv,
            None => return Err(JsValue::from_str("Matrix singular, cannot invert X'X")),
        };
        
        let beta = &xtx_inv * &xty;
        
        // 4. Residuals & Statistics
        let fitted = &x_mat * &beta;
        let residuals = &y_vec_alg - &fitted;
        let ssr: f64 = residuals.dot(&residuals);
        
        let y_mean = y_vec_alg.mean();
        let tss: f64 = y_vec_alg.iter().map(|y| (y - y_mean).powi(2)).sum();
        let r_squared = 1.0 - (ssr / tss);
        
        // Variance-Covariance Matrix of Beta: s^2 * (X'X)^-1
        let df = (n - k) as f64;
        let s2 = ssr / df;
        let cov_beta = xtx_inv.scale(s2);
        
        let mut std_errors = Vec::with_capacity(k);
        let mut t_stats = Vec::with_capacity(k);
        let mut p_vals = Vec::with_capacity(k);
        
        // Students T distribution for p-values
        let t_dist = match StudentsT::new(0.0, 1.0, df) {
            Ok(d) => d,
            Err(_) => return Err(JsValue::from_str("Failed to create T distribution")),
        };
        
        for i in 0..k {
            let var_beta = cov_beta[(i, i)];
            if var_beta < 0.0 {
                std_errors.push(0.0);
                t_stats.push(0.0);
                p_vals.push(1.0);
            } else {
                let se = var_beta.sqrt();
                let b = beta[i];
                let t = b / se;
                // Two-tailed p-value
                let p = 2.0 * (1.0 - t_dist.cdf(t.abs()));
                
                std_errors.push(se);
                t_stats.push(t);
                p_vals.push(p);
            }
        }
        
        // 5. Store results
        // Note: x_raw[0] is constant.
        self.coefficients = beta.data.as_vec().clone();
        self.standard_errors = std_errors;
        self.t_statistics = t_stats;
        self.p_values = p_vals;
        
        // fitted_values and residuals need to be padded with NaNs or 0s for missing start observations?
        // EViews usually keeps sample size reduced. 
        // For consistency with other arrays (which are length = original N usually?), 
        // we should probably check what GARCH does. GARCH returns max_lag..n variance.
        // But for plotting, we usually want aligned with dates.
        // For now, I'll return efficient vectors (length = n_effective). 
        // Frontend must handle date alignment based on self.p/max_lag.
        self.fitted_values = fitted.data.as_vec().clone();
        self.residuals = residuals.data.as_vec().clone();
        
        self.r_squared = r_squared;
        
        // Calculate long run coefficients
        self.long_run_coef = self.calculate_long_run_coefficients(self.coefficients.clone());
        
        // Calculate Bounds Test (Simplified - just placeholder for now or implement if time)
        // Real bounds test requires restricted regression (no levels). 
        // For now, setting 0.0 or reusing restricted SSR if we implemented it.
        // Leaving bounds_f_stat as 0.0 for this iteration (or implement restricted regression separately).
        
        Ok(())
    }
}
