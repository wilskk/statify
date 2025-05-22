use statrs::distribution::{
    ChiSquared,
    FisherSnedecor,
    Normal,
    StudentsT,
    ContinuousCDF,
    Continuous,
};
use statrs::function::beta::beta_inc;
use statrs::function::gamma::{ gamma, ln_gamma };

/// Calculate F significance (p-value) for F statistic
pub fn calculate_f_significance(df1: usize, df2: usize, f_value: f64) -> f64 {
    if df1 == 0 || df2 == 0 || f_value.is_nan() || f_value < 0.0 {
        return f64::NAN;
    }
    FisherSnedecor::new(df1 as f64, df2 as f64).map_or(f64::NAN, |dist| {
        let cdf_val = dist.cdf(f_value);
        (1.0 - cdf_val).max(0.0) // Clamp p-value to be >= 0
    })
}

/// Calculate Chi-squared significance (p-value) for Chi-squared statistic
pub fn calculate_chi_sq_significance(chi_sq_value: f64, df: u64) -> f64 {
    if df == 0 || chi_sq_value.is_nan() || chi_sq_value < 0.0 {
        return f64::NAN;
    }
    ChiSquared::new(df as f64).map_or(f64::NAN, |dist| {
        let cdf_val = dist.cdf(chi_sq_value);
        (1.0 - cdf_val).max(0.0)
    })
}

/// Calculate t significance (p-value) for t statistic
pub fn calculate_t_significance(t_value: f64, df: usize) -> f64 {
    // Swapped order to t_value, df
    if df == 0 || t_value.is_nan() {
        return f64::NAN; // Return NaN for invalid input
    }
    StudentsT::new(0.0, 1.0, df as f64) // Location 0, Scale 1 for standard t-distribution
        .map_or(f64::NAN, |dist| 2.0 * dist.cdf(-t_value.abs())) // P(T <= -|t|) or P(T >= |t|)
}

/// Calculate critical t value for confidence intervals
pub fn calculate_t_critical(alpha: Option<f64>, df: usize) -> f64 {
    // alpha is Option<f64>
    let current_alpha = match alpha {
        Some(a) if a > 0.0 && a < 1.0 => a,
        _ => 0.05, // Default alpha if None or invalid
    };
    if df == 0 {
        Normal::new(0.0, 1.0).map_or(1.96, |dist| dist.inverse_cdf(1.0 - current_alpha / 2.0))
    } else {
        StudentsT::new(0.0, 1.0, df as f64).map_or(f64::NAN, |dist|
            dist.inverse_cdf(1.0 - current_alpha / 2.0)
        )
    }
}

/// Calculate non-centrality parameter for F-test (lambda = F * df1)
pub fn calculate_f_non_centrality(f_value: f64, df1: f64, _df2: f64) -> f64 {
    if f_value.is_nan() || f_value < 0.0 || df1 < 0.0 {
        return f64::NAN;
    }
    f_value * df1
}

/// Noncentral F CDF (series expansion)
pub fn noncentral_f_cdf(x: f64, df1: f64, df2: f64, lambda: f64, max_iter: usize) -> f64 {
    if x < 0.0 || df1 <= 0.0 || df2 <= 0.0 || lambda < 0.0 {
        return 0.0;
    }
    let a = df1 / 2.0;
    let b = df2 / 2.0;
    let z = (df1 * x) / (df2 + df1 * x);
    let mut sum = 0.0;
    let mut j = 0;
    let exp_term = (-lambda / 2.0).exp();
    let mut lambda_pow = 1.0;
    let mut factorial = 1.0;
    while j < max_iter {
        let ib = beta_inc(a + (j as f64), b, z);
        sum += (lambda_pow / factorial) * ib;
        j += 1;
        lambda_pow *= lambda / 2.0;
        factorial *= j as f64;
        if (lambda_pow / factorial) * ib < 1e-10 {
            break;
        }
    }
    exp_term * sum
}

/// Noncentral t CDF (series expansion)
pub fn noncentral_t_cdf(x: f64, df: f64, lambda: f64, max_iter: usize) -> f64 {
    use std::f64::consts::SQRT_2;
    let v = df;
    let mut sum = 0.0;
    let exp_term = ((-lambda * lambda) / 2.0).exp();
    let z = v / (v + x * x);
    let mut j = 0;
    let mut lambda_pow = 1.0;
    let mut factorial = 1.0;
    let gamma_half = gamma(0.5);
    while j < max_iter {
        let gamma_j = gamma(((j as f64) + 1.0) / 2.0);
        let ib = beta_inc(v / 2.0, ((j as f64) + 1.0) / 2.0, z);
        let term = ((lambda_pow * exp_term * gamma_j) / (factorial * gamma_half)) * ib;
        sum += term;
        j += 1;
        lambda_pow *= if x <= 0.0 { -lambda * SQRT_2 } else { lambda * SQRT_2 };
        factorial *= j as f64;
        if term.abs() < 1e-10 {
            break;
        }
    }
    if x <= 0.0 {
        0.5 * sum
    } else {
        1.0 - 0.5 * sum
    }
}

/// Calculate observed power for F-test (uses NonCentralFisherSnedecor)
pub fn calculate_observed_power_f(f_value: f64, df1: f64, df2: f64, alpha: f64) -> f64 {
    if
        df1 <= 0.0 ||
        df2 <= 0.0 ||
        f_value < 0.0 ||
        alpha <= 0.0 ||
        alpha >= 1.0 ||
        f_value.is_nan()
    {
        return 0.0; // Or f64::NAN if preferred for consistency
    }
    let central_dist = FisherSnedecor::new(df1, df2).ok();
    let crit_f = central_dist.map(|dist| dist.inverse_cdf(1.0 - alpha)).unwrap_or(f64::NAN);
    if crit_f.is_nan() {
        return 0.0;
    }
    let ncp = f_value * df1;
    (1.0 - noncentral_f_cdf(crit_f, df1, df2, ncp, 50)).max(0.0).min(1.0)
}

/// Calculate observed power for t-test (uses NonCentralStudentsT)
pub fn calculate_observed_power_t(t_value: f64, df: usize, alpha: Option<f64>) -> f64 {
    let current_alpha = match alpha {
        Some(a) if a > 0.0 && a < 1.0 => a,
        _ => 0.05, // Default alpha
    };
    if df == 0 || t_value.abs() <= 1e-9 {
        return 0.0; // Or f64::NAN
    }
    let central_t_dist = StudentsT::new(0.0, 1.0, df as f64).ok();
    let crit_t_abs = central_t_dist
        .map(|dist| dist.inverse_cdf(1.0 - current_alpha / 2.0).abs())
        .unwrap_or(f64::NAN);
    if crit_t_abs.is_nan() {
        return 0.0;
    }
    let ncp = t_value;
    let power =
        noncentral_t_cdf(-crit_t_abs, df as f64, ncp, 50) +
        (1.0 - noncentral_t_cdf(crit_t_abs, df as f64, ncp, 50));
    power.max(0.0).min(1.0)
}

/// Chi-square CDF using statrs
pub fn chi_square_cdf(x: f64, df: f64) -> f64 {
    if x < 0.0 || df <= 0.0 {
        // x can be 0 for CDF, df must be positive
        return 0.0;
    }
    ChiSquared::new(df).map_or(0.0, |dist| dist.cdf(x).max(0.0).min(1.0))
}

/// F distribution CDF using statrs
pub fn f_distribution_cdf(x: f64, df1: f64, df2: f64) -> f64 {
    if x < 0.0 || df1 <= 0.0 || df2 <= 0.0 {
        // x can be 0 for CDF, df1, df2 must be positive
        return 0.0;
    }
    FisherSnedecor::new(df1, df2).map_or(0.0, |dist| dist.cdf(x).max(0.0).min(1.0))
}
