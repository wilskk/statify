// src/utils/probability.rs
use statrs::distribution::{ChiSquared, ContinuousCDF};

/// Menghitung P-Value untuk Chi-Square Test
/// (Digunakan di Omnibus Test & Stepwise Criteria)
pub fn chi_square_significance(chi_sq_val: f64, df: i32) -> f64 {
    if df <= 0 || chi_sq_val < 0.0 {
        return 1.0; // Tidak signifikan / Error safety
    }
    
    match ChiSquared::new(df as f64) {
        Ok(dist) => 1.0 - dist.cdf(chi_sq_val),
        Err(_) => 1.0,
    }
}

/// Menghitung P-Value untuk Wald Test (Z-distribution atau Chi-Sq 1 df)
/// Wald biasanya diasumsikan mengikuti Chi-Square dengan df=1
pub fn wald_significance(wald_stat: f64) -> f64 {
    chi_square_significance(wald_stat, 1)
}