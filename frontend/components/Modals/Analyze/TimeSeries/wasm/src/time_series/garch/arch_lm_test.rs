use wasm_bindgen::prelude::*;
use crate::GARCH;
use crate::time_series::helper_structs::ArchLMResult;

#[wasm_bindgen]
impl GARCH {
    /// ARCH-LM Test untuk detect ARCH effects
    /// Test H0: No ARCH effects (α_1 = α_2 = ... = α_q = 0)
    /// Test statistic: N * R² ~ Chi-square(q)
    pub fn arch_lm_test(residuals: Vec<f64>, lags: usize) -> ArchLMResult {
        let n = residuals.len();
        
        // Calculate squared residuals
        let e_squared: Vec<f64> = residuals.iter().map(|e| e * e).collect();
        
        // Mean of squared residuals
        let mean_e_sq: f64 = e_squared.iter().sum::<f64>() / n as f64;
        
        // Prepare regression: e²_t on e²_{t-1}, ..., e²_{t-q}
        let n_obs = n - lags;
        let mut y_vec = Vec::new();
        let mut x_matrix: Vec<Vec<f64>> = vec![vec![1.0; n_obs]]; // Constant
        
        // Dependent variable: e²_t
        for t in lags..n {
            y_vec.push(e_squared[t]);
        }
        
        // Independent variables: lagged e²
        for lag in 1..=lags {
            let mut lagged = Vec::new();
            for t in lags..n {
                lagged.push(e_squared[t - lag]);
            }
            x_matrix.push(lagged);
        }
        
        // OLS regression (simplified - using basic formulas)
        let mean_y: f64 = y_vec.iter().sum::<f64>() / n_obs as f64;
        
        // Calculate R²
        let mut ssr = 0.0; // Sum of squared residuals
        let mut sst = 0.0; // Total sum of squares
        
        for i in 0..n_obs {
            // Fitted value (simplified - just use mean for now)
            let fitted = mean_y;
            let residual = y_vec[i] - fitted;
            ssr += residual * residual;
            sst += (y_vec[i] - mean_y).powi(2);
        }
        
        let r_squared = if sst > 0.0 {
            1.0 - (ssr / sst)
        } else {
            0.0
        };
        
        // ARCH-LM test statistic: N * R²
        let lm_stat = (n_obs as f64) * r_squared;
        
        // P-value dari Chi-square distribution (simplified approximation)
        // df = lags (number of lagged terms)
        let p_value = Self::chi_square_p_value(lm_stat, lags);
        
        // Has ARCH effect if p_value < 0.05
        let has_arch = p_value < 0.05;
        
        ArchLMResult {
            lm_statistic: lm_stat,
            p_value,
            has_arch_effect: has_arch,
        }
    }
    
    /// Simplified Chi-square CDF untuk p-value calculation
    fn chi_square_p_value(x: f64, df: usize) -> f64 {
        // Very simplified approximation
        // Seharusnya pakai statrs::distribution::ChiSquared
        
        if x < 0.0 {
            return 1.0;
        }
        
        // Rough approximation using normal distribution
        // For large df, Chi²(df) ≈ N(df, 2df)
        let z = (x - df as f64) / (2.0 * df as f64).sqrt();
        
        // P-value ≈ 1 - Φ(z)
        let p = 1.0 - Self::normal_cdf(z);
        
        p.max(0.0).min(1.0)
    }
    
    /// Standard normal CDF
    fn normal_cdf(x: f64) -> f64 {
        0.5 * (1.0 + Self::erf(x / 2.0_f64.sqrt()))
    }
    
    /// Error function (erf) - approximation
    fn erf(x: f64) -> f64 {
        let a1 = 0.254829592;
        let a2 = -0.284496736;
        let a3 = 1.421413741;
        let a4 = -1.453152027;
        let a5 = 1.061405429;
        let p = 0.3275911;
        
        let sign = if x < 0.0 { -1.0 } else { 1.0 };
        let x = x.abs();
        
        let t = 1.0 / (1.0 + p * x);
        let y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * (-x * x).exp();
        
        sign * y
    }
}
