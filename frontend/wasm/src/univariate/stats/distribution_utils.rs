use statrs::distribution::{
    ChiSquared,
    FisherSnedecor,
    Normal,
    StudentsT,
    Poisson,
    ContinuousCDF,
    Discrete,
};
use statrs::function::beta::beta_inc;
use statrs::function::gamma::gamma;

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

/// Noncentral F CDF (series expansion using Poisson weights for stability)
pub fn noncentral_f_cdf(x: f64, df1: f64, df2: f64, lambda: f64, max_iter: usize) -> f64 {
    if x < 0.0 || df1 <= 0.0 || df2 <= 0.0 || lambda < 0.0 {
        // lambda must be >= 0 by definition
        return 0.0;
    }

    let nu1_div_2 = df1 / 2.0;
    let b_div_2 = df2 / 2.0;

    let x_for_ib_num = df1 * x;
    let x_for_ib_den = df2 + x_for_ib_num; // df2 + df1*x

    let x_for_ib = if x_for_ib_den == 0.0 {
        if x_for_ib_num == 0.0 {
            0.0
        } else {
            1.0
        } // Should ideally not be hit if df1, df2 > 0
    } else {
        (x_for_ib_num / x_for_ib_den).max(0.0).min(1.0) // Clamp x_for_ib to [0,1]
    };

    // If lambda is effectively zero, it's a central F-distribution.
    if lambda.abs() < 1e-9 {
        return beta_inc(nu1_div_2, b_div_2, x_for_ib).max(0.0).min(1.0);
    }

    let poisson_mean = lambda / 2.0;
    if poisson_mean < 0.0 {
        // Should be caught by lambda < 0.0 check, but good for safety.
        return 0.0;
    }

    let poisson_dist = match Poisson::new(poisson_mean) {
        Ok(dist) => dist,
        Err(_) => {
            return f64::NAN;
        } // Cannot create Poisson distribution (e.g., mean is negative or NaN)
    };

    let mut cdf_sum = 0.0;

    for j_idx in 0..max_iter {
        let j_f64 = j_idx as f64;
        let poisson_weight = poisson_dist.pmf(j_idx as u64); // PMF involves e^(-mean)

        // If Poisson weight is negligible, and we are far into the tail, we can stop.
        if poisson_weight < 1e-30 {
            // Absolute check on Poisson weight
            // Heuristic: check if j_idx is sufficiently past the mean of the Poisson distribution
            let std_devs_away = 10.0; // Number of standard deviations
            let poisson_std_dev = poisson_mean.sqrt();
            if j_f64 > poisson_mean + std_devs_away * poisson_std_dev.max(1.0) + 20.0 {
                // Add a buffer
                break;
            }
        }

        let shape1_ib = nu1_div_2 + j_f64;
        let shape2_ib = b_div_2;

        // beta_inc requires positive shape parameters. df1, df2 > 0 handled. nu1_div_2+j_f64 >= 0 handled.
        if shape1_ib <= 0.0 || shape2_ib <= 0.0 {
            // Should not be hit due to prior checks on df1,df2
            break;
        }

        let ib_val = beta_inc(shape1_ib, shape2_ib, x_for_ib);

        if ib_val.is_nan() {
            // If beta_inc fails, the sum becomes unreliable. Depending on policy, could return NaN or current sum.
            // Returning NaN is safer to indicate computation issues.
            return f64::NAN;
        }

        let term_to_add = poisson_weight * ib_val;
        cdf_sum += term_to_add;

        // Convergence check based on the term just added to the sum.
        if term_to_add.abs() < 1e-16 && poisson_weight < 1e-16 {
            // If both components are tiny
            // More robust check: if j_idx is significantly past the Poisson mean
            if j_f64 > poisson_mean + 7.0 * poisson_mean.sqrt().max(1.0) + 30.0 {
                break;
            }
        }
    }

    cdf_sum.max(0.0).min(1.0) // The sum itself is the CDF value.
}

/// Noncentral t CDF (series expansion) based on provided formula image
pub fn noncentral_t_cdf(x: f64, df: f64, lambda: f64, max_iter: usize) -> f64 {
    use std::f64::consts::{ SQRT_2, PI };

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

    let exp_coeff = ((-lambda * lambda) / 4.0).exp();

    // If exp_coeff is zero (e.g. lambda is huge), and lambda is not zero, the sum effectively becomes zero.
    if exp_coeff == 0.0 && lambda != 0.0 {
        return if x <= 0.0 { 0.0 } else { 1.0 };
    }
    // If lambda is zero, it's a central t-distribution.
    // The formula should converge to central T, but direct calculation is better.
    if lambda.abs() < 1e-9 {
        return StudentsT::new(0.0, 1.0, df).map_or(f64::NAN, |dist| dist.cdf(x));
    }

    let lambda_series_base = if x <= 0.0 { lambda / SQRT_2 } else { -lambda / SQRT_2 };

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
    // Use the alpha from the test for determining the critical F-value for power calculation.
    let alpha_for_power_critical_value = alpha_for_test;

    if
        df1 <= 0.0 ||
        df2 <= 0.0 ||
        f_value < 0.0 ||
        alpha_for_power_critical_value <= 0.0 || // Check the actual alpha being used
        alpha_for_power_critical_value >= 1.0 ||
        f_value.is_nan()
    {
        return 0.0;
    }

    let central_dist_res = FisherSnedecor::new(df1, df2);
    let crit_f = match central_dist_res {
        Ok(dist) => dist.inverse_cdf(1.0 - alpha_for_power_critical_value),
        Err(_) => {
            return f64::NAN;
        }
    };

    if crit_f.is_nan() {
        return f64::NAN;
    }

    let ncp = f_value * df1;
    if ncp < 0.0 {
        return f64::NAN;
    }

    // Call the local noncentral_f_cdf function
    let cdf_val = crate::univariate::stats::distribution_utils::noncentral_f_cdf(
        crit_f,
        df1,
        df2,
        ncp,
        1000
    );

    if cdf_val.is_nan() {
        // Handle potential NaN from custom CDF
        return f64::NAN;
    }

    (1.0 - cdf_val).max(0.0).min(1.0) // Power is 1 - CDF(crit_f)
}

/// Calculate observed power for t-test (uses NonCentralStudentsT from statrs)
pub fn calculate_observed_power_t(t_value: f64, df: usize, alpha: Option<f64>) -> f64 {
    let current_alpha = match alpha {
        Some(a) if a > 0.0 && a < 1.0 => a,
        _ => 0.05, // Default alpha
    };

    if df == 0 {
        // If df is 0, rx >= N. Power is 0 or undefined.
        return 0.0; // Consistent with SYSMIS, or user formula for rx >= N if it meant 0.
    }
    // If t_value is very small (effectively zero), non-centrality is zero, power might be alpha.
    // However, the formula implies using the t_value as ncp directly.
    // For robustness, if t_value is NaN, we should return NaN or 0.
    if t_value.is_nan() {
        return f64::NAN; // Or 0.0, depending on desired SYSMIS handling
    }

    let central_t_dist_res = StudentsT::new(0.0, 1.0, df as f64); // Standard central t-distribution
    let crit_t_abs = match central_t_dist_res {
        Ok(dist) => dist.inverse_cdf(1.0 - current_alpha / 2.0).abs(),
        Err(_) => {
            return f64::NAN; // Failed to create central T distribution
        }
    };

    if crit_t_abs.is_nan() {
        return 0.0; // If critical value is NaN, power is undefined or 0.
    }

    let ncp = t_value; // The observed t-statistic is the non-centrality parameter (c in user's formula)
    let df_f64 = df as f64;

    // Per user formula: p = 1 - NCDF.T(tc, df, c) + NCDF.T(-tc, df, c)
    // This is equivalent to: p = NCDF.T(-tc, df, c) + (1 - NCDF.T(tc, df, c))
    // Which means P(T < -tc) + P(T > tc) for a non-central T.

    // Reverting to use the local noncentral_t_cdf function
    let power =
        noncentral_t_cdf(-crit_t_abs, df_f64, ncp, 50) +
        (1.0 - noncentral_t_cdf(crit_t_abs, df_f64, ncp, 50));

    power.max(0.0).min(1.0) // Ensure power is in [0,1]
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
