use statrs::distribution::{ ChiSquared, FisherSnedecor, Normal, StudentsT, ContinuousCDF };
use statrs::function::{ beta::beta_inc, gamma::gamma };
use std::f64::consts::{ SQRT_2, PI };

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
pub fn noncentral_t_cdf(x: f64, df: f64, lambda: f64, max_iter: usize) -> f64 {
    if df <= 0.0 {
        // Degrees of freedom must be positive
        return if x < 0.0 {
            0.0
        } else {
            1.0
        }; // Or NaN, but this follows limiting behavior
    }

    let y_beta_num = x * x;
    let y_beta_den = df + y_beta_num;

    let y_beta = if y_beta_den == 0.0 {
        if y_beta_num == 0.0 {
            0.0
        } else {
            1.0
        } // Should ideally not happen if df > 0
    } else {
        (y_beta_num / y_beta_den).max(0.0).min(1.0) // Clamp y_beta to [0,1]
    };

    // Corrected exp_coeff to match e^(-λ²/2) from the formula
    let exp_coeff = ((-lambda * lambda) / 2.0).exp();

    // If exp_coeff is zero (e.g. lambda is huge), and lambda is not zero, the sum effectively becomes zero.
    if exp_coeff == 0.0 && lambda != 0.0 {
        return if x <= 0.0 { 0.0 } else { 1.0 };
    }
    // If lambda is zero, it's a central t-distribution.
    // The formula should converge to central T, but direct calculation is better.
    if lambda.abs() < 1e-9 {
        return StudentsT::new(0.0, 1.0, df).map_or(f64::NAN, |dist| dist.cdf(x));
    }

    // Corrected lambda_series_base to match (λ√2) or (-λ√2) from the formula
    let lambda_series_base = if x <= 0.0 { lambda * SQRT_2 } else { -lambda * SQRT_2 };

    let mut current_sum = 0.0;
    let mut term_lambda_power_j = 1.0; // (lambda_series_base)^j for j=0
    let mut term_factorial_j = 1.0; // j! for j=0
    let sqrt_pi = PI.sqrt();

    for j_idx in 0..max_iter {
        let j_f64 = j_idx as f64;
        let shape1_beta = (j_f64 + 1.0) / 2.0;
        let shape2_beta = df / 2.0;

        if shape1_beta <= 0.0 || shape2_beta <= 0.0 {
            // beta_inc requires positive shape parameters
            break;
        }

        let gamma_ratio_val = gamma(shape1_beta) / sqrt_pi;
        let beta_val = beta_inc(shape1_beta, shape2_beta, y_beta);

        if gamma_ratio_val.is_nan() || beta_val.is_nan() {
            // If any component fails, the sum is unreliable, return based on x
            return if x <= 0.0 {
                0.0
            } else {
                1.0
            }; // Or NaN for error
        }

        let summand_j = (term_lambda_power_j / term_factorial_j) * gamma_ratio_val * beta_val;
        current_sum += summand_j;

        // Convergence check
        if summand_j.abs() < 1e-15 {
            // More robust convergence: check if relative to sum, or if sum itself is tiny.
            if current_sum.abs() < 1e-15 || (summand_j / current_sum).abs() < 1e-15 {
                if (j_idx as f64) > ((lambda * lambda) / 4.0).abs().max(10.0) {
                    // Ensure we are past the peak of Poisson-like terms
                    break;
                }
            }
        }

        // Prepare for next iteration (j_idx + 1)
        term_lambda_power_j *= lambda_series_base;
        term_factorial_j *= j_f64 + 1.0;

        if
            term_factorial_j == 0.0 ||
            term_factorial_j.is_infinite() ||
            term_lambda_power_j.is_infinite() ||
            (term_lambda_power_j == 0.0 && lambda_series_base != 0.0)
        {
            break; // Unstable terms
        }
    }

    let calculated_cdf = if x <= 0.0 {
        0.5 * exp_coeff * current_sum
    } else {
        1.0 - 0.5 * exp_coeff * current_sum
    };

    calculated_cdf.max(0.0).min(1.0) // Ensure CDF is in [0,1]
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

    // LANGKAH 1: Hitung Parameter Non-sentralitas (c)
    let ncp = t_value.abs(); // noncentrality_c = AbsoluteValue(t_statistic)

    // LANGKAH 2: Hitung Nilai t Kritis (t_critical)
    let central_t_dist_res = StudentsT::new(0.0, 1.0, df as f64);
    let crit_t_abs = match central_t_dist_res {
        Ok(dist) => dist.inverse_cdf(1.0 - current_alpha / 2.0).abs(),
        Err(_) => {
            return f64::NAN;
        } // Gagal membuat distribusi t sentral
    };

    if crit_t_abs.is_nan() {
        return f64::NAN; // t kritis tidak valid
    }

    let df_f64 = df as f64;

    // LANGKAH 3: Hitung Observed Power
    // power = 1 - CumulativeNonCentralTDistribution(t_critical, df_residual, noncentrality_c) +
    //         CumulativeNonCentralTDistribution(-t_critical, df_residual, noncentrality_c)
    let cdf_pos_crit = noncentral_t_cdf(crit_t_abs, df_f64, ncp, 50);
    let cdf_neg_crit = noncentral_t_cdf(-crit_t_abs, df_f64, ncp, 50);

    if cdf_pos_crit.is_nan() || cdf_neg_crit.is_nan() {
        return f64::NAN; // Salah satu hasil CDF non-sentral tidak valid
    }

    let power = 1.0 - cdf_pos_crit + cdf_neg_crit;

    // Periksa Batasan (clamping)
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
