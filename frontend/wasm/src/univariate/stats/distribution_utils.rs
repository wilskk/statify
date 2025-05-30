use statrs::distribution::{ ChiSquared, FisherSnedecor, Normal, StudentsT, ContinuousCDF };

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

/// Formula 26.6.26 (Patnaik's Approximation) - DEFAULT noncentral_f_cdf
pub fn noncentral_f_cdf(f_prime: f64, df1: f64, df2: f64, lambda: f64) -> f64 {
    if f_prime < 0.0 || df1 <= 0.0 || df2 <= 0.0 || lambda < 0.0 {
        return f64::NAN;
    }

    let term_v1_plus_lambda = df1 + lambda;
    if term_v1_plus_lambda == 0.0 {
        return f64::NAN;
    }
    let term_v1_plus_2lambda = df1 + 2.0 * lambda;
    if term_v1_plus_2lambda == 0.0 {
        return f64::NAN;
    }

    let f_adjusted = (df1 / term_v1_plus_lambda) * f_prime;
    let df1_adjusted = term_v1_plus_lambda.powi(2) / term_v1_plus_2lambda;

    if df1_adjusted <= 0.0 {
        return f64::NAN;
    }

    match FisherSnedecor::new(df1_adjusted, df2) {
        Ok(dist) => dist.cdf(f_adjusted).max(0.0).min(1.0),
        Err(_) => f64::NAN,
    }
}

/// Noncentral t CDF (series expansion) based on provided formula image
pub fn noncentral_t_cdf(t_prime: f64, nu: f64, delta: f64) -> f64 {
    // Implementation of Abramowitz & Stegun formula 26.7.10 (Approximation)
    // P(t'|ν, δ) ≈ P_norm(x_approx)
    // x_approx = (t' - δ) / sqrt(1 + (t'^2)/(2ν))

    // Input validation
    if nu <= 0.0 {
        // Degrees of freedom ν must be positive
        return f64::NAN;
    }

    let numerator = t_prime - delta;

    let den_sqrt_term2_num = t_prime.powi(2);
    let den_sqrt_term2_den = 2.0 * nu;

    // Denominator for t'^2 / (2ν) must not be zero.
    // Since nu > 0, den_sqrt_term2_den will be > 0.

    let den_under_sqrt = 1.0 + den_sqrt_term2_num / den_sqrt_term2_den;

    if den_under_sqrt <= 0.0 {
        // Argument to sqrt must be positive.
        // Given 1.0 + ..., this implies t_prime^2/(2*nu) is very negative, which shouldn't happen if nu > 0.
        // However, as a safeguard.
        return f64::NAN;
    }

    let denominator = den_under_sqrt.sqrt();

    if denominator == 0.0 {
        // This case implies 1 + t_prime^2/(2*nu) = 0, which is unlikely for nu > 0.
        // Avoid division by zero. Resulting x_approx would be Inf/-Inf.
        return f64::NAN;
    }

    let x_approx = numerator / denominator;

    // Calculate Normal CDF N(0,1) at x_approx
    match Normal::new(0.0, 1.0) {
        Ok(norm_dist) => {
            let cdf_val = norm_dist.cdf(x_approx);
            cdf_val.max(0.0).min(1.0) // Clamp result to [0,1]
        }
        Err(_) => {
            // This should not happen for N(0,1)
            f64::NAN
        }
    }
}

/// Calculate observed power for F-test (uses local noncentral_f_cdf)
pub fn calculate_observed_power_f(f_value: f64, df1: f64, df2: f64, alpha_for_test: f64) -> f64 {
    if
        df1 <= 0.0 ||
        df2 <= 0.0 ||
        f_value < 0.0 ||
        f_value.is_nan() ||
        alpha_for_test <= 0.0 ||
        alpha_for_test >= 1.0
    {
        return f64::NAN;
    }

    let ncp = f_value * df1; // This is lambda for the CDF functions

    let central_dist_res = FisherSnedecor::new(df1, df2);
    let crit_f = match central_dist_res {
        // This is f_prime for the CDF functions
        Ok(dist) => dist.inverse_cdf(1.0 - alpha_for_test),
        Err(_) => {
            return f64::NAN;
        }
    };

    if crit_f.is_nan() {
        return f64::NAN;
    }

    // Calculate CDF using only the default method (Patnaik 26.6.26)
    let cdf_patnaik = noncentral_f_cdf(crit_f, df1, df2, ncp);

    // Calculate Power
    let power_patnaik = if cdf_patnaik.is_nan() {
        f64::NAN
    } else {
        (1.0 - cdf_patnaik).max(0.0).min(1.0)
    };

    // Return power from default method (Patnaik)
    power_patnaik
}

/// Calculate observed power for t-test (uses NonCentralStudentsT from statrs)
pub fn calculate_observed_power_t(t_value: f64, df: usize, alpha: Option<f64>) -> f64 {
    // df: df_residual (N - r_X)
    let current_alpha = match alpha {
        Some(a) if a > 0.0 && a < 1.0 => a,
        _ => 0.05, // Default alpha
    };

    // Validasi input dasar
    // Sesuai pseudocode: IF df_residual <= 0 THEN RETURN SYSMIS
    if df == 0 {
        // df adalah usize, jadi df <= 0 berarti df == 0
        return f64::NAN;
    }
    if t_value.is_nan() {
        return f64::NAN;
    }

    let ncp = t_value.abs(); // noncentrality_c = AbsoluteValue(t_statistic)

    let central_t_dist_res = StudentsT::new(0.0, 1.0, df as f64);
    let crit_t_abs = match central_t_dist_res {
        Ok(dist) => dist.inverse_cdf(1.0 - current_alpha / 2.0).abs(),
        Err(_) => {
            return f64::NAN;
        }
    };

    if crit_t_abs.is_nan() {
        return f64::NAN;
    }

    let df_f64 = df as f64;

    // Updated calls to noncentral_t_cdf (no max_iter)
    // Parameters: t_prime, nu, delta
    let cdf_pos_crit = noncentral_t_cdf(crit_t_abs, df_f64, ncp);
    let cdf_neg_crit = noncentral_t_cdf(-crit_t_abs, df_f64, ncp);

    if cdf_pos_crit.is_nan() || cdf_neg_crit.is_nan() {
        return f64::NAN;
    }

    let power = 1.0 - cdf_pos_crit + cdf_neg_crit;

    if power.is_nan() {
        return f64::NAN;
    }
    return power.max(0.0).min(1.0);
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
