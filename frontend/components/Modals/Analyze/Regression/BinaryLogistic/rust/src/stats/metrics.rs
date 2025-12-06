use nalgebra::DVector;
use statrs::distribution::{ChiSquared, ContinuousCDF};

pub struct ModelMetrics {
    pub null_log_likelihood: f64,
    pub model_log_likelihood: f64,
    pub cox_snell: f64,
    pub nagelkerke: f64,
}

pub fn calculate_model_metrics(model_ll: f64, y: &DVector<f64>) -> ModelMetrics {
    let n = y.len() as f64;

    // 1. Hitung Null Log Likelihood
    let p_null = y.sum() / n;
    let p_safe = p_null.clamp(1e-10, 1.0 - 1e-10);
    let null_ll = y.sum() * p_safe.ln() + (n - y.sum()) * (1.0 - p_safe).ln();

    // 2. Hitung Cox & Snell
    let likelihood_ratio = (null_ll - model_ll).exp();
    let cox_snell = 1.0 - likelihood_ratio.powf(2.0 / n);

    // 3. Hitung Nagelkerke
    // PERBAIKAN: Hapus 'let l_null = ...' yang tidak terpakai

    let max_r2 = 1.0 - (2.0 * null_ll / n).exp();

    let nagelkerke = if max_r2 > 1e-10 {
        cox_snell / max_r2
    } else {
        0.0
    };

    ModelMetrics {
        null_log_likelihood: null_ll,
        model_log_likelihood: model_ll,
        cox_snell,
        nagelkerke,
    }
}

pub fn calculate_omnibus_chi_square(null_ll: f64, model_ll: f64) -> f64 {
    2.0 * (model_ll - null_ll)
}

pub fn calculate_sig(chi_val: f64, df: i32) -> f64 {
    if df > 0 && chi_val > 0.0 {
        match ChiSquared::new(df as f64) {
            Ok(dist) => 1.0 - dist.cdf(chi_val),
            Err(_) => 0.0,
        }
    } else {
        0.0
    }
}
