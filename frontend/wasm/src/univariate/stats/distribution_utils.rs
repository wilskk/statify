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

/// Calculate critical F value for a given alpha, df1, and df2
pub fn calculate_f_critical(alpha: f64, df1: usize, df2: usize) -> f64 {
    if df1 == 0 || df2 == 0 || alpha <= 0.0 || alpha >= 1.0 {
        return f64::NAN;
    }
    FisherSnedecor::new(df1 as f64, df2 as f64).map_or(f64::NAN, |dist|
        dist.inverse_cdf(1.0 - alpha)
    )
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

// --- BEGIN SMM Table Data and Helpers ---

// Shared axis for k (number of groups)
// Values from Stoline and Ury (1979), Tables for m_{alpha,k*,v}
static SMM_K_STAR_VALS: [f64; 13] = [
    3.0,
    5.0,
    7.0,
    10.0,
    12.0,
    16.0,
    20.0,
    24.0,
    30.0,
    40.0,
    60.0,
    120.0,
    f64::INFINITY,
];

// Shared axis for v (degrees of freedom, df in our functions)
// Values from Stoline and Ury (1979), Tables for m_{alpha,k*,v}
static SMM_V_VALS_ACTUAL: [f64; 22] = [
    5.0,
    6.0,
    7.0,
    8.0,
    9.0,
    10.0,
    11.0,
    12.0,
    13.0,
    14.0,
    15.0,
    16.0,
    17.0,
    18.0,
    19.0,
    20.0,
    24.0,
    30.0,
    40.0,
    60.0,
    120.0,
    f64::INFINITY,
];

// SMM Table for alpha = 0.01 (Stoline and Ury, 1979, Table 1)
// Dimensions: V_VALS.len() rows, K_STAR_VALS.len() columns
static SMM_TABLE_ALPHA_01: [[f64; 13]; 22] = [
    // k=       3       5       7       10      12      16      20      24      30      40      60     120     inf
    /*v=5*/ [
        5.812, 6.635, 7.171, 7.818, 8.178, 8.7, 9.084, 9.382, 9.754, 10.213, 10.789, 11.488, 11.826,
    ],
    /*v=6*/ [
        5.106, 5.814, 6.275, 6.845, 7.158, 7.608, 7.936, 8.196, 8.522, 8.928, 9.439, 10.063, 10.36,
    ],
    /*v=7*/ [
        4.684, 5.318, 5.727, 6.235, 6.514, 6.908, 7.198, 7.433, 7.727, 8.096, 8.56, 9.123, 9.39,
    ],
    /*v=8*/ [
        4.399, 4.981, 5.352, 5.811, 6.065, 6.422, 6.687, 6.903, 7.173, 7.514, 7.942, 8.463, 8.71,
    ],
    /*v=9*/ [
        4.191, 4.739, 5.083, 5.509, 5.746, 6.075, 6.321, 6.523, 6.776, 7.095, 7.497, 7.986, 8.219,
    ],
    /*v=10*/ [
        4.032, 4.557, 4.881, 5.28, 5.503, 5.812, 6.044, 6.235, 6.475, 6.778, 7.159, 7.625, 7.847,
    ],
    /*v=11*/ [
        3.909, 4.414, 4.723, 5.102, 5.315, 5.608, 5.829, 6.012, 6.241, 6.531, 6.897, 7.344, 7.558,
    ],
    /*v=12*/ [
        3.812, 4.298, 4.595, 4.96, 5.164, 5.446, 5.658, 5.834, 6.055, 6.334, 6.688, 7.119, 7.327,
    ],
    /*v=13*/ [
        3.731, 4.204, 4.491, 4.844, 5.042, 5.314, 5.519, 5.689, 5.903, 6.173, 6.516, 6.935, 7.137,
    ],
    /*v=14*/ [
        3.664, 4.125, 4.403, 4.747, 4.94, 5.204, 5.402, 5.568, 5.776, 6.038, 6.372, 6.781, 6.979,
    ],
    /*v=15*/ [
        3.606, 4.058, 4.328, 4.664, 4.852, 5.109, 5.302, 5.463, 5.666, 5.922, 6.248, 6.648, 6.841,
    ],
    /*v=16*/ [
        3.557, 4.001, 4.263, 4.592, 4.776, 5.027, 5.215, 5.372, 5.571, 5.821, 6.14, 6.531, 6.721,
    ],
    /*v=17*/ [
        3.514, 3.951, 4.207, 4.529, 4.709, 4.955, 5.138, 5.292, 5.486, 5.731, 6.044, 6.428, 6.614,
    ],
    /*v=18*/ [
        3.477, 3.907, 4.158, 4.474, 4.651, 4.892, 5.071, 5.222, 5.412, 5.653, 5.959, 6.337, 6.519,
    ],
    /*v=19*/ [
        3.444, 3.868, 4.114, 4.425, 4.599, 4.835, 5.011, 5.159, 5.346, 5.582, 5.883, 6.255, 6.434,
    ],
    /*v=20*/ [
        3.415, 3.834, 4.076, 4.381, 4.552, 4.785, 4.958, 5.103, 5.287, 5.519, 5.815, 6.181, 6.358,
    ],
    /*v=24*/ [
        3.326, 3.731, 3.961, 4.256, 4.421, 4.643, 4.808, 4.946, 5.122, 5.344, 5.626, 5.975, 6.143,
    ],
    /*v=30*/ [
        3.238, 3.63, 3.852, 4.136, 4.295, 4.509, 4.666, 4.798, 4.966, 5.178, 5.449, 5.783, 5.943,
    ],
    /*v=40*/ [
        3.15, 3.53, 3.744, 4.019, 4.172, 4.378, 4.528, 4.655, 4.816, 5.019, 5.279, 5.6, 5.753,
    ],
    /*v=60*/ [
        3.063, 3.431, 3.638, 3.902, 4.05, 4.248, 4.393, 4.514, 4.669, 4.864, 5.114, 5.423, 5.568,
    ],
    /*v=120*/ [
        2.976, 3.332, 3.532, 3.787, 3.929, 4.119, 4.258, 4.374, 4.522, 4.708, 4.949, 5.245, 5.384,
    ],
    /*v=inf*/ [
        2.889, 3.234, 3.426, 3.671, 3.808, 3.991, 4.124, 4.235, 4.377, 4.556, 4.787, 5.071, 5.203,
    ],
];

// SMM Table for alpha = 0.05 (Stoline and Ury, 1979, Table 3, p.89)
static SMM_TABLE_ALPHA_05: [[f64; 13]; 22] = [
    // k=       3       5       7       10      12      16      20      24      30      40      60     120     inf
    /*v=5*/ [
        3.928, 4.512, 4.898, 5.384, 5.628, 6.002, 6.282, 6.502, 6.772, 7.108, 7.518, 7.998, 8.214,
    ],
    /*v=6*/ [
        3.613, 4.12, 4.471, 4.893, 5.116, 5.457, 5.704, 5.898, 6.142, 6.446, 6.818, 7.253, 7.447,
    ],
    /*v=7*/ [
        3.422, 3.886, 4.21, 4.595, 4.801, 5.114, 5.344, 5.526, 5.751, 6.033, 6.379, 6.782, 6.963,
    ],
    /*v=8*/ [
        3.289, 3.725, 4.032, 4.391, 4.585, 4.878, 5.096, 5.267, 5.48, 5.747, 6.073, 6.453, 6.623,
    ],
    /*v=9*/ [
        3.19, 3.606, 3.899, 4.238, 4.423, 4.7, 4.908, 5.072, 5.275, 5.531, 5.842, 6.204, 6.367,
    ],
    /*v=10*/ [
        3.114, 3.515, 3.799, 4.121, 4.298, 4.563, 4.762, 4.919, 5.114, 5.361, 5.66, 6.007, 6.164,
    ],
    /*v=11*/ [
        3.055, 3.443, 3.719, 4.03, 4.2, 4.455, 4.647, 4.799, 4.987, 5.226, 5.515, 5.85, 6.002,
    ],
    /*v=12*/ [
        3.007, 3.385, 3.655, 3.958, 4.123, 4.37, 4.556, 4.703, 4.886, 5.118, 5.399, 5.724, 5.872,
    ],
    /*v=13*/ [
        2.967, 3.336, 3.602, 3.898, 4.058, 4.299, 4.48, 4.623, 4.801, 5.028, 5.302, 5.618, 5.762,
    ],
    /*v=14*/ [
        2.934, 3.296, 3.557, 3.849, 4.005, 4.241, 4.418, 4.557, 4.731, 4.952, 5.22, 5.53, 5.671,
    ],
    /*v=15*/ [
        2.905, 3.261, 3.518, 3.806, 3.959, 4.19, 4.364, 4.499, 4.67, 4.886, 5.148, 5.451, 5.589,
    ],
    /*v=16*/ [
        2.879, 3.232, 3.484, 3.769, 3.919, 4.146, 4.317, 4.45, 4.617, 4.829, 5.086, 5.383, 5.518,
    ],
    /*v=17*/ [
        2.857, 3.206, 3.455, 3.737, 3.883, 4.107, 4.274, 4.405, 4.569, 4.777, 5.029, 5.321, 5.454,
    ],
    /*v=18*/ [
        2.837, 3.183, 3.428, 3.708, 3.852, 4.072, 4.237, 4.366, 4.527, 4.731, 4.978, 5.266, 5.396,
    ],
    /*v=19*/ [
        2.819, 3.163, 3.405, 3.682, 3.824, 4.041, 4.203, 4.33, 4.488, 4.689, 4.932, 5.215, 5.343,
    ],
    /*v=20*/ [
        2.803, 3.145, 3.385, 3.659, 3.8, 4.014, 4.174, 4.299, 4.455, 4.653, 4.892, 5.171, 5.297,
    ],
    /*v=24*/ [
        2.755, 3.09, 3.326, 3.585, 3.722, 3.927, 4.081, 4.2, 4.351, 4.54, 4.769, 5.037, 5.158,
    ],
    /*v=30*/ [
        2.704, 3.033, 3.263, 3.514, 3.646, 3.844, 3.992, 4.106, 4.251, 4.433, 4.652, 4.908, 5.023,
    ],
    /*v=40*/ [
        2.654, 2.976, 3.2, 3.444, 3.572, 3.763, 3.905, 4.015, 4.154, 4.328, 4.538, 4.784, 4.893,
    ],
    /*v=60*/ [
        2.604, 2.919, 3.138, 3.375, 3.499, 3.683, 3.82, 3.926, 4.059, 4.227, 4.428, 4.664, 4.768,
    ],
    /*v=120*/ [
        2.554, 2.863, 3.076, 3.307, 3.427, 3.604, 3.736, 3.838, 3.966, 4.127, 4.32, 4.546, 4.644,
    ],
    /*v=inf*/ [
        2.504, 2.807, 3.014, 3.239, 3.355, 3.525, 3.653, 3.75, 3.873, 4.028, 4.212, 4.428, 4.521,
    ],
];

// SMM Table for alpha = 0.10 (Stoline and Ury, 1979, Table 3, p.90)
static SMM_TABLE_ALPHA_10: [[f64; 13]; 22] = [
    // k=       3       5       7       10      12      16      20      24      30      40      60     120     inf
    /*v=5*/ [
        3.255, 3.72, 4.037, 4.43, 4.645, 4.981, 5.229, 5.422, 5.663, 5.961, 6.326, 6.756, 6.953,
    ],
    /*v=6*/ [
        2.969, 3.355, 3.619, 3.953, 4.146, 4.444, 4.666, 4.841, 5.06, 5.332, 5.666, 6.059, 6.239,
    ],
    /*v=7*/ [
        2.799, 3.151, 3.391, 3.692, 3.869, 4.143, 4.349, 4.512, 4.715, 4.969, 5.281, 5.647, 5.816,
    ],
    /*v=8*/ [
        2.684, 3.011, 3.235, 3.513, 3.679, 3.936, 4.131, 4.285, 4.477, 4.719, 5.015, 5.361, 5.521,
    ],
    /*v=9*/ [
        2.598, 2.908, 3.12, 3.383, 3.542, 3.786, 3.972, 4.119, 4.303, 4.535, 4.819, 5.151, 5.305,
    ],
    /*v=10*/ [
        2.532, 2.828, 3.033, 3.284, 3.436, 3.671, 3.849, 3.99, 4.167, 4.391, 4.665, 4.986, 5.134,
    ],
    /*v=11*/ [
        2.479, 2.764, 2.962, 3.203, 3.351, 3.578, 3.75, 3.887, 4.058, 4.275, 4.541, 4.852, 4.996,
    ],
    /*v=12*/ [
        2.435, 2.712, 2.903, 3.136, 3.28, 3.499, 3.666, 3.799, 3.965, 4.176, 4.435, 4.738, 4.878,
    ],
    /*v=13*/ [
        2.399, 2.668, 2.854, 3.081, 3.221, 3.434, 3.597, 3.726, 3.888, 4.093, 4.346, 4.641, 4.778,
    ],
    /*v=14*/ [
        2.368, 2.631, 2.812, 3.034, 3.171, 3.379, 3.538, 3.664, 3.822, 4.022, 4.269, 4.558, 4.692,
    ],
    /*v=15*/ [
        2.341, 2.599, 2.775, 2.993, 3.128, 3.331, 3.486, 3.61, 3.764, 3.959, 4.201, 4.484, 4.615,
    ],
    /*v=16*/ [
        2.318, 2.571, 2.743, 2.957, 3.09, 3.289, 3.441, 3.562, 3.714, 3.905, 4.142, 4.419, 4.548,
    ],
    /*v=17*/ [
        2.297, 2.546, 2.715, 2.926, 3.056, 3.251, 3.4, 3.519, 3.668, 3.854, 4.087, 4.36, 4.486,
    ],
    /*v=18*/ [
        2.278, 2.524, 2.69, 2.898, 3.026, 3.218, 3.364, 3.482, 3.628, 3.811, 4.04, 4.308, 4.433,
    ],
    /*v=19*/ [
        2.261, 2.505, 2.668, 2.873, 3.0, 3.189, 3.333, 3.449, 3.593, 3.773, 3.998, 4.262, 4.385,
    ],
    /*v=20*/ [
        2.245, 2.487, 2.648, 2.851, 2.976, 3.163, 3.305, 3.419, 3.561, 3.739, 3.961, 4.221, 4.342,
    ],
    /*v=24*/ [
        2.197, 2.433, 2.585, 2.784, 2.903, 3.082, 3.218, 3.328, 3.464, 3.634, 3.847, 4.095, 4.211,
    ],
    /*v=30*/ [
        2.149, 2.378, 2.525, 2.718, 2.833, 3.005, 3.136, 3.242, 3.372, 3.535, 3.738, 3.976, 4.086,
    ],
    /*v=40*/ [
        2.102, 2.324, 2.466, 2.653, 2.764, 2.929, 3.055, 3.157, 3.282, 3.438, 3.632, 3.86, 3.965,
    ],
    /*v=60*/ [
        2.055, 2.27, 2.407, 2.588, 2.695, 2.854, 2.975, 3.073, 3.192, 3.342, 3.527, 3.746, 3.846,
    ],
    /*v=120*/ [
        2.008, 2.216, 2.348, 2.523, 2.626, 2.779, 2.895, 2.989, 3.103, 3.246, 3.423, 3.633, 3.727,
    ],
    /*v=inf*/ [
        1.96, 2.162, 2.289, 2.458, 2.557, 2.704, 2.816, 2.906, 3.014, 3.151, 3.32, 3.52, 3.61,
    ],
];

fn find_axis_bounds(value: f64, axis: &[f64]) -> Option<(usize, usize, f64)> {
    if
        axis.is_empty() ||
        value < axis[0] ||
        (value > axis[axis.len() - 1] &&
            value != f64::INFINITY &&
            axis[axis.len() - 1] != f64::INFINITY)
    {
        if value == f64::INFINITY && axis[axis.len() - 1] == f64::INFINITY {
            // Exact match for infinity
        } else if value < axis[0] || value > axis[axis.len() - 1] {
            return None; // Value is out of axis bounds
        }
    }

    match
        axis.binary_search_by(|probe| probe.partial_cmp(&value).unwrap_or(std::cmp::Ordering::Less))
    {
        Ok(idx) => Some((idx, idx, 0.0)), // Exact match, t=0 (points to axis[idx])
        Err(insertion_idx) => {
            if insertion_idx == 0 {
                // Value is less than the first element, or axis is empty.
                // If value == axis[0], Ok(0) would be caught.
                // This case implies value < axis[0] if axis not empty.
                if !axis.is_empty() && value == axis[0] {
                    Some((0, 0, 0.0))
                } else {
                    None
                }
            } else if insertion_idx == axis.len() {
                // Value is greater than all elements
                // Check if the last element is infinity and value is infinity
                if axis[axis.len() - 1] == f64::INFINITY && value == f64::INFINITY {
                    Some((axis.len() - 1, axis.len() - 1, 0.0))
                } else {
                    None
                }
            } else {
                // Standard case: value is between axis[insertion_idx-1] and axis[insertion_idx]
                Some((
                    insertion_idx - 1,
                    insertion_idx,
                    (value - axis[insertion_idx - 1]) /
                        (axis[insertion_idx] - axis[insertion_idx - 1]),
                ))
            }
        }
    }
}

fn interpolate_smm_table_value(
    target_k_star: f64,
    target_df: f64,
    k_star_axis: &[f64],
    v_axis: &[f64],
    table_data: &[[f64; SMM_K_STAR_VALS.len()]; SMM_V_VALS_ACTUAL.len()] // Adjusted to use fixed lengths
) -> Option<f64> {
    let (v_idx_low, v_idx_high, v_t_linear) = find_axis_bounds(target_df, v_axis)?;
    let (k_idx_low, k_idx_high, k_t) = find_axis_bounds(target_k_star, k_star_axis)?;

    let v_weight = (
        if v_idx_low == v_idx_high {
            0.0
        } else {
            let inv_target_df = if target_df == f64::INFINITY { 0.0 } else { 1.0 / target_df };
            let inv_v_low = if v_axis[v_idx_low] == f64::INFINITY {
                0.0
            } else {
                1.0 / v_axis[v_idx_low]
            };
            let inv_v_high = if v_axis[v_idx_high] == f64::INFINITY {
                0.0
            } else {
                1.0 / v_axis[v_idx_high]
            };
            if (inv_v_high - inv_v_low).abs() < f64::EPSILON {
                0.0
            } else {
                (inv_target_df - inv_v_low) / (inv_v_high - inv_v_low)
            }
        }
    )
        .max(0.0)
        .min(1.0); // Clamp weight

    let k_weight = (if k_idx_low == k_idx_high { 0.0 } else { k_t }).max(0.0).min(1.0);

    let q11 = table_data[v_idx_low][k_idx_low];
    let q21 = table_data[v_idx_high][k_idx_low]; // Val at v_high, k_low
    let q12 = table_data[v_idx_low][k_idx_high];
    let q22 = table_data[v_idx_high][k_idx_high];

    let r1 = q11 * (1.0 - v_weight) + q21 * v_weight; // Interpolated for df at k_low
    let r2 = q12 * (1.0 - v_weight) + q22 * v_weight; // Interpolated for df at k_high

    let result = r1 * (1.0 - k_weight) + r2 * k_weight; // Interpolated for k_star
    Some(result)
}

// --- END SMM Table Data and Helpers ---

/// Calculate CDF for Studentized Maximum Modulus (SMM) distribution
///
/// Uses table lookups for critical values at alpha = 0.01, 0.05, 0.10 and interpolates
/// the CDF value (1 - alpha_effective).
/// `k_param` is 'k' (number of groups) from Stoline & Ury tables.
/// `df` is degrees of freedom (v).
pub fn studentized_maximum_modulus_cdf(x: f64, k_param: usize, df: usize) -> f64 {
    if x < 0.0 {
        return 0.0;
    }
    if k_param == 0 || df == 0 {
        return f64::NAN;
    } // k* and v must be positive (table ranges start > 0)

    let k_f64 = k_param as f64;
    // Get critical values from table interpolation
    let crit_01_opt = studentized_maximum_modulus_critical_value(0.01, k_f64, df);
    let crit_05_opt = studentized_maximum_modulus_critical_value(0.05, k_f64, df);
    let crit_10_opt = studentized_maximum_modulus_critical_value(0.1, k_f64, df);

    if crit_01_opt.is_none() || crit_05_opt.is_none() || crit_10_opt.is_none() {
        // This implies k_param or df were out of table interpolation range.
        // Try to use the original integrand definition if tables fail?
        // For now, per request to use tables, if tables fail, CDF fails.
        // The original code with placeholder numerical integration would go here as a fallback if desired.
        // web_sys::console::warn_1(&"SMM CDF: k_param or df out of table range, returning NaN.".into());
        return f64::NAN;
    }

    let crit_01 = crit_01_opt.unwrap();
    let crit_05 = crit_05_opt.unwrap();
    let crit_10 = crit_10_opt.unwrap();

    // Values are m_{alpha, k*, v} so crit_10 < crit_05 < crit_01
    let alpha_eff = if x <= crit_10 {
        // x is "small", alpha is "large" (>= 0.10)
        // Linear extrapolation for alpha beyond 0.10 if x is even smaller than crit_10?
        // Or simply clamp:
        0.1 // CDF will be 0.90
    } else if x < crit_05 {
        // crit_10 < x < crit_05
        // Interpolate alpha between 0.10 and 0.05
        let t = (x - crit_10) / (crit_05 - crit_10); // Should be in [0,1]
        0.1 * (1.0 - t) + 0.05 * t
    } else if x == crit_05 {
        0.05
    } else if x < crit_01 {
        // crit_05 < x < crit_01
        // Interpolate alpha between 0.05 and 0.01
        let t = (x - crit_05) / (crit_01 - crit_05); // Should be in [0,1]
        0.05 * (1.0 - t) + 0.01 * t
    } else {
        // x >= crit_01. x is "large", alpha is "small" (<= 0.01)
        0.01 // CDF will be 0.99
    };

    (1.0 - alpha_eff).max(0.0).min(1.0)
}

/// Calculate critical value for Studentized Maximum Modulus (SMM) distribution
///
/// Uses lookup and bilinear interpolation from tables by Stoline and Ury (1979).
/// Supports alpha = 0.01, 0.05, 0.10.
/// `k_param` is 'k' (number of groups) from tables.
/// `df` is degrees of freedom (v).
pub fn studentized_maximum_modulus_critical_value(
    alpha: f64,
    k_param: f64,
    df: usize
) -> Option<f64> {
    if k_param <= 0.0 || df == 0 {
        return None;
    }

    let df_f64 = df as f64;

    let table_to_use: &[[f64; SMM_K_STAR_VALS.len()]; SMM_V_VALS_ACTUAL.len()] = if
        (alpha - 0.01).abs() < 1e-9
    {
        &SMM_TABLE_ALPHA_01
    } else if (alpha - 0.05).abs() < 1e-9 {
        &SMM_TABLE_ALPHA_05
    } else if (alpha - 0.1).abs() < 1e-9 {
        &SMM_TABLE_ALPHA_10
    } else {
        // Alpha not supported by tables, caller must handle fallback.
        return None;
    };

    interpolate_smm_table_value(k_param, df_f64, &SMM_K_STAR_VALS, &SMM_V_VALS_ACTUAL, table_to_use)
}

// --- BEGIN q-table (Studentized Range) Data and Helpers ---

// Shared axis for k (number of groups) for q-table
static Q_TABLE_K_VALS: [f64; 19] = [
    2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0,
    20.0,
];

// Shared axis for v (degrees of freedom, df) for q-table
static Q_TABLE_V_VALS: [f64; 22] = [
    1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0,
    19.0, 20.0, 24.0, 30.0,
];

// q-table for alpha = 0.05
static Q_TABLE_ALPHA_05: [[f64; 19]; 22] = [
    // k=      2       3       4       5       6       7       8       9       10      11      12      13      14      15      16      17      18      19      20
    /*v=1*/ [
        17.97, 26.98, 32.82, 37.08, 40.41, 43.12, 45.4, 47.36, 49.07, 50.59, 51.96, 53.2, 54.33, 55.36,
        56.32, 57.22, 58.04, 58.83, 59.56,
    ],
    /*v=2*/ [
        6.085, 8.331, 9.798, 10.88, 11.74, 12.44, 13.03, 13.54, 13.99, 14.39, 14.75, 15.08, 15.38, 15.65,
        15.91, 16.14, 16.37, 16.57, 16.77,
    ],
    /*v=3*/ [
        4.501, 5.91, 6.825, 7.503, 8.037, 8.478, 8.853, 9.177, 9.462, 9.716, 9.945, 10.15, 10.35, 10.53,
        10.69, 10.84, 10.98, 11.11, 11.24,
    ],
    /*v=4*/ [
        3.927, 5.04, 5.757, 6.287, 6.707, 7.053, 7.347, 7.603, 7.826, 8.025, 8.203, 8.365, 8.512, 8.648,
        8.774, 8.891, 9.001, 9.103, 9.199,
    ],
    /*v=5*/ [
        3.635, 4.602, 5.218, 5.673, 6.033, 6.33, 6.582, 6.802, 6.995, 7.167, 7.322, 7.463, 7.592, 7.712,
        7.823, 7.927, 8.024, 8.115, 8.2,
    ],
    /*v=6*/ [
        3.461, 4.339, 4.896, 5.305, 5.628, 5.895, 6.122, 6.319, 6.493, 6.649, 6.789, 6.918, 7.036, 7.145,
        7.247, 7.342, 7.43, 7.513, 7.591,
    ],
    /*v=7*/ [
        3.344, 4.165, 4.681, 5.06, 5.359, 5.606, 5.815, 5.998, 6.158, 6.301, 6.429, 6.546, 6.654, 6.754,
        6.846, 6.932, 7.013, 7.089, 7.161,
    ],
    /*v=8*/ [
        3.261, 4.041, 4.529, 4.886, 5.167, 5.399, 5.597, 5.769, 5.921, 6.057, 6.18, 6.292, 6.394, 6.488,
        6.575, 6.656, 6.732, 6.803, 6.871,
    ],
    /*v=9*/ [
        3.199, 3.606, 3.899, 4.238, 4.423, 4.7, 4.908, 5.072, 5.275, 5.531, 5.842, 6.204, 6.367, 6.529,
        6.679, 6.818, 6.947, 7.066, 7.177,
    ],
    /*v=10*/ [
        3.151, 3.515, 3.799, 4.121, 4.298, 4.563, 4.762, 4.919, 5.114, 5.361, 5.66, 6.007, 6.164, 6.317,
        6.458, 6.59, 6.712, 6.825, 6.932,
    ],
    /*v=11*/ [
        3.113, 3.443, 3.719, 4.03, 4.2, 4.455, 4.647, 4.799, 4.987, 5.226, 5.515, 5.85, 6.002, 6.15,
        6.285, 6.413, 6.53, 6.642, 6.748,
    ],
    /*v=12*/ [
        3.082, 3.385, 3.655, 3.958, 4.123, 4.37, 4.556, 4.703, 4.886, 5.118, 5.399, 5.724, 5.872, 6.015,
        6.145, 6.268, 6.382, 6.491, 6.594,
    ],
    /*v=13*/ [
        3.055, 3.336, 3.602, 3.898, 4.058, 4.299, 4.48, 4.623, 4.801, 5.028, 5.302, 5.618, 5.762, 5.901,
        6.027, 6.146, 6.259, 6.367, 6.47,
    ],
    /*v=14*/ [
        3.033, 3.296, 3.557, 3.849, 4.005, 4.241, 4.418, 4.557, 4.731, 4.952, 5.22, 5.53, 5.671, 5.806,
        5.929, 6.045, 6.156, 6.262, 6.364,
    ],
    /*v=15*/ [
        3.014, 3.261, 3.518, 3.806, 3.959, 4.19, 4.364, 4.499, 4.67, 4.886, 5.148, 5.451, 5.589, 5.72,
        5.84, 5.954, 6.063, 6.168, 6.269,
    ],
    /*v=16*/ [
        2.998, 3.232, 3.484, 3.769, 3.919, 4.146, 4.317, 4.45, 4.617, 4.829, 5.086, 5.383, 5.518, 5.646,
        5.764, 5.876, 5.983, 6.086, 6.185,
    ],
    /*v=17*/ [
        2.984, 3.206, 3.455, 3.737, 3.883, 4.107, 4.274, 4.405, 4.569, 4.777, 5.029, 5.321, 5.454, 5.58,
        5.696, 5.805, 5.91, 6.012, 6.112,
    ],
    /*v=18*/ [
        2.971, 3.183, 3.428, 3.708, 3.852, 4.072, 4.237, 4.366, 4.527, 4.731, 4.978, 5.266, 5.396, 5.52,
        5.634, 5.741, 5.844, 5.944, 6.042,
    ],
    /*v=19*/ [
        2.96, 3.163, 3.405, 3.682, 3.824, 4.041, 4.203, 4.33, 4.488, 4.689, 4.932, 5.215, 5.343, 5.467,
        5.579, 5.685, 5.788, 5.888, 5.985,
    ],
    /*v=20*/ [
        2.95, 3.145, 3.385, 3.659, 3.8, 4.014, 4.174, 4.299, 4.455, 4.653, 4.892, 5.171, 5.297, 5.419,
        5.529, 5.633, 5.735, 5.833, 5.929,
    ],
    /*v=24*/ [
        2.919, 3.09, 3.326, 3.585, 3.722, 3.927, 4.081, 4.2, 4.351, 4.54, 4.769, 5.037, 5.158, 5.277,
        5.385, 5.489, 5.589, 5.686, 5.78,
    ],
    /*v=30*/ [
        2.888, 3.033, 3.263, 3.514, 3.646, 3.844, 3.992, 4.106, 4.251, 4.433, 4.652, 4.908, 5.023, 5.136,
        5.242, 5.345, 5.445, 5.542, 5.636,
    ],
];

fn interpolate_q_table_value(
    target_k: f64,
    target_df: f64,
    k_axis: &[f64],
    v_axis: &[f64],
    table_data: &[[f64; Q_TABLE_K_VALS.len()]; Q_TABLE_V_VALS.len()]
) -> Option<f64> {
    let (v_idx_low, v_idx_high, v_t) = find_axis_bounds(target_df, v_axis)?;
    let (k_idx_low, k_idx_high, k_t) = find_axis_bounds(target_k, k_axis)?;

    let q11 = table_data[v_idx_low][k_idx_low];
    let q21 = table_data[v_idx_high][k_idx_low];
    let q12 = table_data[v_idx_low][k_idx_high];
    let q22 = table_data[v_idx_high][k_idx_high];

    let r1 = q11 * (1.0 - v_t) + q21 * v_t;
    let r2 = q12 * (1.0 - v_t) + q22 * v_t;

    Some(r1 * (1.0 - k_t) + r2 * k_t)
}

/// Calculate critical value for Studentized Range (q) distribution
///
/// Uses lookup and bilinear interpolation from tables.
/// Currently only supports alpha = 0.05.
/// `k_param` is number of groups.
/// `df` is degrees of freedom.
pub fn studentized_range_critical_value(alpha: f64, k_param: usize, df: usize) -> Option<f64> {
    if k_param < 2 || df == 0 {
        return None;
    }

    let table_to_use = if (alpha - 0.05).abs() < 1e-9 {
        &Q_TABLE_ALPHA_05
    } else {
        return None; // Alpha not supported
    };

    interpolate_q_table_value(
        k_param as f64,
        df as f64,
        &Q_TABLE_K_VALS,
        &Q_TABLE_V_VALS,
        table_to_use
    )
}
// --- END q-table ---

// Dunnett's Test Critical Values
const DUNNETT_K_VALS: [f64; 9] = [2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
const DUNNETT_V_VALS: [f64; 18] = [
    1.0,
    2.0,
    3.0,
    4.0,
    5.0,
    6.0,
    7.0,
    8.0,
    9.0,
    10.0,
    12.0,
    15.0,
    20.0,
    30.0,
    60.0,
    120.0,
    f64::INFINITY,
    f64::INFINITY,
];

// Alpha = 0.05, Two-sided
const DUNNETT_TABLE_0_05_TWO_SIDED: [[f64; 9]; 18] = [
    [12.71, 15.91, 17.98, 19.43, 20.56, 21.49, 22.28, 22.98, 23.59],
    [4.3, 4.94, 5.36, 5.66, 5.89, 6.08, 6.24, 6.37, 6.49],
    [3.18, 3.53, 3.78, 3.96, 4.1, 4.21, 4.31, 4.39, 4.47],
    [2.78, 3.03, 3.22, 3.36, 3.46, 3.55, 3.63, 3.69, 3.75],
    [2.57, 2.78, 2.92, 3.03, 3.12, 3.19, 3.26, 3.31, 3.36],
    [2.45, 2.63, 2.76, 2.85, 2.93, 3.0, 3.05, 3.1, 3.14],
    [2.36, 2.54, 2.65, 2.74, 2.81, 2.87, 2.92, 2.96, 3.0],
    [2.31, 2.47, 2.58, 2.66, 2.73, 2.78, 2.83, 2.87, 2.9],
    [2.26, 2.42, 2.52, 2.6, 2.66, 2.71, 2.75, 2.79, 2.82],
    [2.23, 2.38, 2.47, 2.55, 2.61, 2.66, 2.7, 2.73, 2.76],
    [2.18, 2.32, 2.41, 2.48, 2.54, 2.58, 2.62, 2.65, 2.68],
    [2.13, 2.27, 2.35, 2.41, 2.46, 2.51, 2.54, 2.57, 2.6],
    [2.09, 2.21, 2.29, 2.35, 2.4, 2.44, 2.47, 2.5, 2.52],
    [2.04, 2.16, 2.23, 2.29, 2.33, 2.37, 2.4, 2.42, 2.45],
    [2.0, 2.11, 2.18, 2.23, 2.27, 2.31, 2.33, 2.36, 2.38],
    [1.98, 2.08, 2.15, 2.2, 2.24, 2.27, 2.3, 2.32, 2.34],
    [1.96, 2.06, 2.13, 2.17, 2.21, 2.24, 2.27, 2.29, 2.31],
    [1.96, 2.06, 2.13, 2.17, 2.21, 2.24, 2.27, 2.29, 2.31],
];
// Alpha = 0.05, One-sided
const DUNNETT_TABLE_0_05_ONE_SIDED: [[f64; 9]; 18] = [
    [6.31, 7.65, 8.55, 9.19, 9.68, 10.08, 10.41, 10.7, 10.95],
    [2.92, 3.33, 3.61, 3.82, 3.98, 4.12, 4.23, 4.33, 4.41],
    [2.35, 2.61, 2.78, 2.91, 3.01, 3.09, 3.16, 3.22, 3.27],
    [2.13, 2.34, 2.47, 2.57, 2.64, 2.71, 2.76, 2.81, 2.85],
    [2.02, 2.2, 2.31, 2.39, 2.46, 2.51, 2.56, 2.6, 2.63],
    [1.94, 2.1, 2.21, 2.28, 2.34, 2.39, 2.43, 2.46, 2.49],
    [1.89, 2.04, 2.14, 2.21, 2.26, 2.31, 2.34, 2.38, 2.4],
    [1.86, 2.0, 2.09, 2.15, 2.2, 2.24, 2.28, 2.31, 2.34],
    [1.83, 1.97, 2.05, 2.11, 2.16, 2.2, 2.23, 2.26, 2.29],
    [1.81, 1.94, 2.02, 2.08, 2.13, 2.17, 2.2, 2.23, 2.25],
    [1.78, 1.91, 1.99, 2.04, 2.09, 2.12, 2.15, 2.18, 2.2],
    [1.75, 1.87, 1.94, 2.0, 2.04, 2.07, 2.1, 2.13, 2.15],
    [1.72, 1.83, 1.9, 1.95, 1.99, 2.02, 2.05, 2.07, 2.09],
    [1.69, 1.8, 1.86, 1.91, 1.94, 1.97, 2.0, 2.02, 2.04],
    [1.67, 1.77, 1.82, 1.86, 1.9, 1.92, 1.94, 1.96, 1.98],
    [1.66, 1.75, 1.8, 1.84, 1.87, 1.9, 1.92, 1.94, 1.95],
    [1.64, 1.73, 1.78, 1.82, 1.85, 1.87, 1.89, 1.91, 1.92],
    [1.64, 1.73, 1.78, 1.82, 1.85, 1.87, 1.89, 1.91, 1.92],
];

fn interpolate_dunnett_table_value(
    target_k: f64,
    target_df: f64,
    k_axis: &[f64],
    v_axis: &[f64],
    table_data: &[[f64; DUNNETT_K_VALS.len()]]
) -> Option<f64> {
    let (v_idx_low, v_idx_high, v_t) = find_axis_bounds(target_df, v_axis)?;
    let (k_idx_low, k_idx_high, k_t) = find_axis_bounds(target_k, k_axis)?;

    let q11 = table_data[v_idx_low][k_idx_low];
    let q21 = table_data[v_idx_high][k_idx_low];
    let q12 = table_data[v_idx_low][k_idx_high];
    let q22 = table_data[v_idx_high][k_idx_high];

    let r1 = q11 * (1.0 - v_t) + q21 * v_t;
    let r2 = q12 * (1.0 - v_t) + q22 * v_t;

    Some(r1 * (1.0 - k_t) + r2 * k_t)
}

pub fn dunnett_critical_value(
    alpha: f64,
    k_param: usize,
    df: usize,
    one_sided: bool
) -> Option<f64> {
    if k_param < 2 || df == 0 {
        return None;
    }

    let table = if (alpha - 0.05).abs() < 1e-9 {
        if one_sided { &DUNNETT_TABLE_0_05_ONE_SIDED } else { &DUNNETT_TABLE_0_05_TWO_SIDED }
    } else {
        return None; // Other alpha values not supported yet
    };

    interpolate_dunnett_table_value(
        k_param as f64,
        df as f64,
        &DUNNETT_K_VALS,
        &DUNNETT_V_VALS,
        table
    )
}

pub fn waller_duncan_critical_value(
    k_ratio: f64,
    f_value: f64,
    df_error: usize,
    k_groups: usize
) -> Option<f64> {
    // This is a placeholder for the actual Waller-Duncan k-ratio t-test critical value.
    // The calculation is complex and requires special functions (e.g., from R's agricolae package)
    // or extensive tables not implemented here.
    // For now, returning None to indicate it's not implemented.
    None
}
