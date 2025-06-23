use statrs::distribution::{ ChiSquared, FisherSnedecor, Normal, StudentsT, ContinuousCDF };

/// Menghitung signifikansi F (p-value) untuk statistik F.
///
/// # Arguments
/// * `df1` - Derajat kebebasan (degrees of freedom) untuk numerator.
/// * `df2` - Derajat kebebasan untuk denominator.
/// * `f_value` - Nilai statistik F yang dihitung.
///
/// # Returns
/// Nilai p-value, yang merepresentasikan probabilitas mengamati nilai F yang sama atau lebih ekstrim
/// jika hipotesis nol benar. Mengembalikan `f64::NAN` jika input tidak valid.
pub fn calculate_f_significance(df1: usize, df2: usize, f_value: f64) -> f64 {
    if df1 == 0 || df2 == 0 || f_value.is_nan() || f_value < 0.0 {
        return f64::NAN;
    }
    // Menggunakan distribusi Fisher-Snedecor untuk menghitung p-value.
    // p-value = 1 - CDF(f_value), di mana CDF adalah Cumulative Distribution Function.
    FisherSnedecor::new(df1 as f64, df2 as f64).map_or(f64::NAN, |dist| {
        let cdf_val = dist.cdf(f_value);
        (1.0 - cdf_val).max(0.0) // Menjamin p-value tidak negatif.
    })
}

/// Menghitung signifikansi Chi-kuadrat (p-value) untuk statistik Chi-kuadrat.
///
/// # Arguments
/// * `chi_sq_value` - Nilai statistik Chi-kuadrat.
/// * `df` - Derajat kebebasan (degrees of freedom).
///
/// # Returns
/// Nilai p-value yang sesuai. Mengembalikan `f64::NAN` jika input tidak valid.
pub fn calculate_chi_sq_significance(chi_sq_value: f64, df: u64) -> f64 {
    if df == 0 || chi_sq_value.is_nan() || chi_sq_value < 0.0 {
        return f64::NAN;
    }
    // p-value dihitung sebagai 1 - CDF dari nilai chi-kuadrat.
    ChiSquared::new(df as f64).map_or(f64::NAN, |dist| {
        let cdf_val = dist.cdf(chi_sq_value);
        (1.0 - cdf_val).max(0.0)
    })
}

/// Menghitung signifikansi t (p-value) untuk statistik t (uji dua sisi).
///
/// # Arguments
/// * `t_value` - Nilai statistik t.
/// * `df` - Derajat kebebasan (degrees of freedom).
///
/// # Returns
/// Nilai p-value untuk uji dua sisi. Mengembalikan `f64::NAN` jika input tidak valid.
pub fn calculate_t_significance(t_value: f64, df: usize) -> f64 {
    if df == 0 || t_value.is_nan() {
        return f64::NAN;
    }
    // Menggunakan distribusi t-Student standar (lokasi 0, skala 1).
    // Untuk uji dua sisi, p-value = 2 * P(T >= |t_value|), yang sama dengan 2 * P(T <= -|t_value|).
    StudentsT::new(0.0, 1.0, df as f64).map_or(f64::NAN, |dist| 2.0 * dist.cdf(-t_value.abs()))
}

/// Menghitung nilai t kritis untuk interval kepercayaan (uji dua sisi).
///
/// # Arguments
/// * `alpha` - Tingkat signifikansi (misalnya, 0.05 untuk kepercayaan 95%). Jika `None` atau tidak valid, default ke 0.05.
/// * `df` - Derajat kebebasan.
///
/// # Returns
/// Nilai t kritis. Jika df = 0, digunakan pendekatan distribusi Normal.
pub fn calculate_t_critical(alpha: Option<f64>, df: usize) -> f64 {
    let current_alpha = match alpha {
        Some(a) if a > 0.0 && a < 1.0 => a,
        _ => 0.05, // Nilai alpha default jika tidak ada atau tidak valid.
    };
    if df == 0 {
        // Jika df tidak tersedia (0), aproksimasi dengan distribusi Normal (z-score).
        Normal::new(0.0, 1.0).map_or(1.96, |dist| dist.inverse_cdf(1.0 - current_alpha / 2.0))
    } else {
        // Menggunakan Inverse CDF (quantile function) dari distribusi t-Student untuk menemukan nilai kritis.
        StudentsT::new(0.0, 1.0, df as f64).map_or(f64::NAN, |dist|
            dist.inverse_cdf(1.0 - current_alpha / 2.0)
        )
    }
}

/// Menghitung nilai F kritis untuk tingkat signifikansi (alpha), df1, dan df2 tertentu.
///
/// # Arguments
/// * `alpha` - Tingkat signifikansi.
/// * `df1` - Derajat kebebasan numerator.
/// * `df2` - Derajat kebebasan denominator.
///
/// # Returns
/// Nilai F kritis. Mengembalikan `f64::NAN` jika input tidak valid.
pub fn calculate_f_critical(alpha: f64, df1: usize, df2: usize) -> f64 {
    if df1 == 0 || df2 == 0 || alpha <= 0.0 || alpha >= 1.0 {
        return f64::NAN;
    }
    // Menggunakan Inverse CDF dari distribusi Fisher-Snedecor.
    FisherSnedecor::new(df1 as f64, df2 as f64).map_or(f64::NAN, |dist|
        dist.inverse_cdf(1.0 - alpha)
    )
}

/// Menghitung parameter non-sentralitas (lambda) untuk uji F.
/// Rumus: lambda = F * df1.
///
/// # Arguments
/// * `f_value` - Nilai statistik F.
/// * `df1` - Derajat kebebasan numerator.
/// * `_df2` - Derajat kebebasan denominator (tidak digunakan dalam rumus ini).
///
/// # Returns
/// Parameter non-sentralitas (lambda).
pub fn calculate_f_non_centrality(f_value: f64, df1: f64, _df2: f64) -> f64 {
    if f_value.is_nan() || f_value < 0.0 || df1 < 0.0 {
        return f64::NAN;
    }
    f_value * df1
}

/// Menghitung Cumulative Distribution Function (CDF) untuk distribusi F non-sentral
/// menggunakan Aproksimasi Patnaik (diadaptasi dari Abramowitz & Stegun, formula 26.6.26).
///
/// # Arguments
/// * `f_prime` - Nilai F (quantile) yang diamati.
/// * `df1` - Derajat kebebasan numerator.
/// * `df2` - Derajat kebebasan denominator.
/// * `lambda` - Parameter non-sentralitas.
///
/// # Returns
/// Nilai CDF (probabilitas) atau `f64::NAN` jika input tidak valid.
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

    // Aproksimasi Patnaik mengubah distribusi F non-sentral menjadi distribusi F sentral
    // dengan menyesuaikan nilai F dan derajat kebebasan numerator.
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

/// Menghitung CDF untuk distribusi t non-sentral menggunakan aproksimasi
/// dari Abramowitz & Stegun, formula 26.7.10.
/// Rumus: P(t'|ν, δ) ≈ P_norm((t' - δ) / sqrt(1 + (t'^2)/(2ν)))
///
/// # Arguments
/// * `t_prime` - Nilai t (quantile) yang diamati.
/// * `nu` - Derajat kebebasan (ν).
/// * `delta` - Parameter non-sentralitas (δ).
///
/// # Returns
/// Nilai CDF aproksimasi.
pub fn noncentral_t_cdf(t_prime: f64, nu: f64, delta: f64) -> f64 {
    // Validasi input: Derajat kebebasan ν harus positif.
    if nu <= 0.0 {
        return f64::NAN;
    }

    let numerator = t_prime - delta;
    let den_sqrt_term2_den = 2.0 * nu;
    let den_under_sqrt = 1.0 + t_prime.powi(2) / den_sqrt_term2_den;

    if den_under_sqrt <= 0.0 {
        return f64::NAN; // Argumen untuk akar kuadrat harus positif.
    }

    let denominator = den_under_sqrt.sqrt();

    if denominator == 0.0 {
        return f64::NAN; // Menghindari pembagian dengan nol.
    }

    let x_approx = numerator / denominator;

    // Menghitung CDF Normal standar N(0,1) pada x_approx.
    match Normal::new(0.0, 1.0) {
        Ok(norm_dist) => {
            let cdf_val = norm_dist.cdf(x_approx);
            cdf_val.max(0.0).min(1.0) // Memastikan hasil dalam rentang [0,1].
        }
        Err(_) => f64::NAN, // Seharusnya tidak terjadi untuk N(0,1).
    }
}

/// Menghitung power statistik yang diamati untuk uji F.
/// Power adalah probabilitas menolak hipotesis nol padahal hipotesis alternatif benar.
///
/// # Arguments
/// * `f_value` - Nilai statistik F yang diamati.
/// * `df1` - Derajat kebebasan numerator.
/// * `df2` - Derajat kebebasan denominator.
/// * `alpha_for_test` - Tingkat signifikansi (alpha) yang digunakan untuk uji hipotesis.
///
/// # Returns
/// Nilai power (antara 0 dan 1).
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

    // Menghitung parameter non-sentralitas (lambda).
    let ncp = f_value * df1;

    // Mencari nilai F kritis dari distribusi F sentral.
    let central_dist_res = FisherSnedecor::new(df1, df2);
    let crit_f = match central_dist_res {
        Ok(dist) => dist.inverse_cdf(1.0 - alpha_for_test),
        Err(_) => {
            return f64::NAN;
        }
    };

    if crit_f.is_nan() {
        return f64::NAN;
    }

    // Menghitung CDF dari distribusi F non-sentral pada nilai F kritis.
    let cdf_patnaik = noncentral_f_cdf(crit_f, df1, df2, ncp);

    // Power = 1 - CDF_noncentral(F_critical).
    let power = if cdf_patnaik.is_nan() { f64::NAN } else { (1.0 - cdf_patnaik).max(0.0).min(1.0) };

    power
}

/// Menghitung power statistik yang diamati untuk uji t.
///
/// # Arguments
/// * `t_value` - Nilai statistik t yang diamati.
/// * `df` - Derajat kebebasan.
/// * `alpha` - Tingkat signifikansi (alpha). Default ke 0.05 jika `None` atau tidak valid.
///
/// # Returns
/// Nilai power (antara 0 dan 1).
pub fn calculate_observed_power_t(t_value: f64, df: usize, alpha: Option<f64>) -> f64 {
    let current_alpha = match alpha {
        Some(a) if a > 0.0 && a < 1.0 => a,
        _ => 0.05, // Nilai alpha default.
    };

    if df == 0 || t_value.is_nan() {
        return f64::NAN;
    }

    // Parameter non-sentralitas adalah nilai absolut dari statistik t.
    let ncp = t_value.abs();

    // Mencari nilai t kritis absolut dari distribusi t sentral untuk uji dua sisi.
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

    // Power = P(t' > t_crit | H_a) + P(t' < -t_crit | H_a)
    //       = (1 - CDF(t_crit)) + CDF(-t_crit)
    let cdf_pos_crit = noncentral_t_cdf(crit_t_abs, df_f64, ncp);
    let cdf_neg_crit = noncentral_t_cdf(-crit_t_abs, df_f64, ncp);

    if cdf_pos_crit.is_nan() || cdf_neg_crit.is_nan() {
        return f64::NAN;
    }

    let power = 1.0 - cdf_pos_crit + cdf_neg_crit;

    if power.is_nan() {
        return f64::NAN;
    }
    power.max(0.0).min(1.0)
}

/// Menghitung CDF untuk distribusi Chi-kuadrat menggunakan pustaka `statrs`.
pub fn chi_square_cdf(x: f64, df: f64) -> f64 {
    if x < 0.0 || df <= 0.0 {
        return 0.0;
    }
    ChiSquared::new(df).map_or(0.0, |dist| dist.cdf(x).max(0.0).min(1.0))
}

/// Menghitung CDF untuk distribusi F menggunakan pustaka `statrs`.
pub fn f_distribution_cdf(x: f64, df1: f64, df2: f64) -> f64 {
    if x < 0.0 || df1 <= 0.0 || df2 <= 0.0 {
        return 0.0;
    }
    FisherSnedecor::new(df1, df2).map_or(0.0, |dist| dist.cdf(x).max(0.0).min(1.0))
}

// --- MULAI Data Tabel SMM dan Fungsi Bantu ---

// Sumbu bersama untuk k (jumlah grup).
// Nilai dari Stoline dan Ury (1979), Tabel untuk m_{alpha,k*,v}.
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

// Sumbu bersama untuk v (derajat kebebasan).
// Nilai dari Stoline dan Ury (1979), Tabel untuk m_{alpha,k*,v}.
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

// Tabel SMM untuk alpha = 0.01 (Stoline dan Ury, 1979, Tabel 1).
// Dimensi: V_VALS.len() baris, K_STAR_VALS.len() kolom.
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

// Tabel SMM untuk alpha = 0.05 (Stoline dan Ury, 1979, Tabel 3, hlm.89).
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

// Tabel SMM untuk alpha = 0.10 (Stoline dan Ury, 1979, Tabel 3, hlm.90).
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

/// Mencari batas indeks dan fraksi interpolasi untuk sebuah nilai pada sumbu data.
///
/// Fungsi ini menentukan posisi sebuah `value` relatif terhadap `axis`.
///
/// # Returns
/// `Some((idx_low, idx_high, fraction))` di mana:
/// * `idx_low`, `idx_high` adalah indeks batas bawah dan atas pada `axis`.
/// * `fraction` adalah faktor interpolasi (t) antara 0 dan 1.
/// Jika `value` cocok persis dengan sebuah titik pada sumbu, `idx_low` == `idx_high` dan `fraction` == 0.0.
/// Mengembalikan `None` jika `value` berada di luar rentang sumbu.
fn find_axis_bounds(value: f64, axis: &[f64]) -> Option<(usize, usize, f64)> {
    // Pengecekan awal apakah nilai berada di luar rentang sumbu.
    if
        axis.is_empty() ||
        (value < axis[0] && value != f64::INFINITY) || // Perbaikan: Tak hingga tidak boleh kurang dari elemen pertama
        (value > axis[axis.len() - 1] && value != f64::INFINITY)
    {
        // Kasus khusus untuk infinity, jika ada di akhir sumbu
        if value == f64::INFINITY && axis.last() == Some(&f64::INFINITY) {
            let last_idx = axis.len() - 1;
            return Some((last_idx, last_idx, 0.0));
        }
        return None;
    }

    // Menggunakan binary search untuk menemukan posisi nilai dengan efisien.
    match
        axis.binary_search_by(|probe| probe.partial_cmp(&value).unwrap_or(std::cmp::Ordering::Less))
    {
        Ok(idx) => Some((idx, idx, 0.0)), // Nilai ditemukan persis, tidak perlu interpolasi.
        Err(insertion_idx) => {
            if insertion_idx == 0 {
                // Seharusnya ditangani oleh pengecekan batas di awal.
                None
            } else if insertion_idx == axis.len() {
                // Jika nilai lebih besar dari semua elemen, tetapi bukan tak hingga (sudah dicek).
                // Atau jika nilai dan elemen terakhir adalah tak hingga.
                if axis.last() == Some(&f64::INFINITY) && value == f64::INFINITY {
                    let last_idx = axis.len() - 1;
                    Some((last_idx, last_idx, 0.0))
                } else {
                    None
                }
            } else {
                // Kasus standar: nilai berada di antara dua titik pada sumbu.
                let idx_low = insertion_idx - 1;
                let idx_high = insertion_idx;
                let val_low = axis[idx_low];
                let val_high = axis[idx_high];

                // Menghitung fraksi interpolasi.
                let fraction = if (val_high - val_low).abs() < f64::EPSILON {
                    0.0
                } else {
                    (value - val_low) / (val_high - val_low)
                };
                Some((idx_low, idx_high, fraction))
            }
        }
    }
}

/// Melakukan interpolasi bilinear pada tabel SMM untuk mendapatkan nilai kritis.
///
/// Fungsi ini menangani interpolasi untuk `target_k_star` (jumlah perlakuan) dan `target_df` (derajat kebebasan).
/// Interpolasi untuk `df` (v) menggunakan skala invers (1/v), yang lebih akurat untuk derajat kebebasan,
/// terutama saat mendekati tak hingga. Interpolasi untuk `k*` adalah linear.
///
/// # Arguments
/// * `target_k_star` - Nilai k* (jumlah grup) target.
/// * `target_df` - Nilai df (derajat kebebasan) target.
/// * `k_star_axis` - Irisan (slice) yang berisi nilai-nilai pada sumbu k*.
/// * `v_axis` - Irisan yang berisi nilai-nilai pada sumbu v (df).
/// * `table_data` - Referensi ke data tabel SMM untuk tingkat alpha tertentu.
///
/// # Returns
/// `Some(f64)` berisi nilai hasil interpolasi, atau `None` jika nilai target berada di luar rentang tabel.
fn interpolate_smm_table_value(
    target_k_star: f64,
    target_df: f64,
    k_star_axis: &[f64],
    v_axis: &[f64],
    table_data: &[[f64; SMM_K_STAR_VALS.len()]; SMM_V_VALS_ACTUAL.len()]
) -> Option<f64> {
    // Menentukan batas bawah, batas atas, dan fraksi interpolasi untuk df (v) dan k*.
    let (v_idx_low, v_idx_high, _v_t_linear) = find_axis_bounds(target_df, v_axis)?;
    let (k_idx_low, k_idx_high, k_t) = find_axis_bounds(target_k_star, k_star_axis)?;

    // Bobot untuk interpolasi df (v) dihitung menggunakan skala invers (1/v).
    // Ini memberikan hasil yang lebih baik ketika df mendekati tak hingga.
    let v_weight = (
        if v_idx_low == v_idx_high {
            0.0
        } else {
            // Mengkonversi ke skala invers (1/v), dengan tak hingga menjadi 0.
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

            // Menghitung bobot interpolasi pada skala invers.
            if (inv_v_high - inv_v_low).abs() < f64::EPSILON {
                0.0
            } else {
                (inv_target_df - inv_v_low) / (inv_v_high - inv_v_low)
            }
        }
    )
        .max(0.0)
        .min(1.0); // Memastikan bobot berada dalam rentang [0,1].

    // Bobot untuk interpolasi k* dihitung secara linear.
    let k_weight = (if k_idx_low == k_idx_high { 0.0 } else { k_t }).max(0.0).min(1.0);

    // Mengambil empat titik terdekat dari tabel untuk interpolasi bilinear.
    let q11 = table_data[v_idx_low][k_idx_low]; // v_low, k_low
    let q21 = table_data[v_idx_high][k_idx_low]; // v_high, k_low
    let q12 = table_data[v_idx_low][k_idx_high];
    let q22 = table_data[v_idx_high][k_idx_high];

    // Langkah 1: Interpolasi sepanjang sumbu v (df) pada k_low dan k_high.
    let r1 = q11 * (1.0 - v_weight) + q21 * v_weight;
    let r2 = q12 * (1.0 - v_weight) + q22 * v_weight;

    // Langkah 2: Interpolasi sepanjang sumbu k* dari hasil r1 dan r2.
    let result = r1 * (1.0 - k_weight) + r2 * k_weight;
    Some(result)
}

// --- AKHIR Data Tabel SMM dan Fungsi Bantu ---

/// Menghitung CDF untuk distribusi Studentized Maximum Modulus (SMM).
///
/// Menggunakan lookup tabel untuk nilai kritis pada alpha = 0.01, 0.05, 0.10 dan
/// menginterpolasi nilai CDF (yaitu, 1 - alpha_efektif).
///
/// # Arguments
/// * `x` - Nilai statistik (quantile) yang diamati.
/// * `k_param` - 'k' (jumlah grup) dari tabel Stoline & Ury.
/// * `df` - Derajat kebebasan (v).
///
/// # Returns
/// Nilai CDF (probabilitas).
pub fn studentized_maximum_modulus_cdf(x: f64, k_param: usize, df: usize) -> f64 {
    if x < 0.0 {
        return 0.0;
    }
    if k_param == 0 || df == 0 {
        return f64::NAN;
    }

    let k_f64 = k_param as f64;
    // Mendapatkan nilai kritis dari interpolasi tabel untuk tiga tingkat alpha.
    let crit_01_opt = studentized_maximum_modulus_critical_value(0.01, k_f64, df);
    let crit_05_opt = studentized_maximum_modulus_critical_value(0.05, k_f64, df);
    let crit_10_opt = studentized_maximum_modulus_critical_value(0.1, k_f64, df);

    if crit_01_opt.is_none() || crit_05_opt.is_none() || crit_10_opt.is_none() {
        // Jika k_param atau df di luar rentang tabel, tidak dapat melanjutkan.
        return f64::NAN;
    }

    let crit_01 = crit_01_opt.unwrap();
    let crit_05 = crit_05_opt.unwrap();
    let crit_10 = crit_10_opt.unwrap();

    // Menginterpolasi alpha efektif berdasarkan posisi x relatif terhadap nilai-nilai kritis.
    // Nilai kritis berbanding terbalik dengan alpha: crit_10 < crit_05 < crit_01.
    let alpha_eff = if x <= crit_10 {
        // Jika x sangat kecil, alpha dianggap besar (mendekati 0.10).
        0.1
    } else if x < crit_05 {
        // Interpolasi linear alpha antara 0.10 dan 0.05.
        let t = (x - crit_10) / (crit_05 - crit_10);
        0.1 * (1.0 - t) + 0.05 * t
    } else if x < crit_01 {
        // Interpolasi linear alpha antara 0.05 dan 0.01.
        let t = (x - crit_05) / (crit_01 - crit_05);
        0.05 * (1.0 - t) + 0.01 * t
    } else {
        // Jika x sangat besar, alpha dianggap kecil (mendekati 0.01).
        0.01
    };

    // CDF adalah 1 - alpha.
    (1.0 - alpha_eff).max(0.0).min(1.0)
}

/// Menghitung nilai kritis untuk distribusi Studentized Maximum Modulus (SMM).
///
/// Menggunakan pencarian dan interpolasi bilinear dari tabel Stoline dan Ury (1979).
/// Hanya mendukung alpha = 0.01, 0.05, 0.10.
///
/// # Arguments
/// * `alpha` - Tingkat signifikansi (0.01, 0.05, atau 0.10).
/// * `k_param` - 'k' (jumlah grup) dari tabel.
/// * `df` - Derajat kebebasan (v).
///
/// # Returns
/// `Some(f64)` berisi nilai kritis, atau `None` jika alpha tidak didukung atau parameter di luar rentang.
pub fn studentized_maximum_modulus_critical_value(
    alpha: f64,
    k_param: f64,
    df: usize
) -> Option<f64> {
    if k_param <= 0.0 || df == 0 {
        return None;
    }

    let df_f64 = df as f64;

    // Memilih tabel yang sesuai berdasarkan nilai alpha.
    let table_to_use = if (alpha - 0.01).abs() < 1e-9 {
        &SMM_TABLE_ALPHA_01
    } else if (alpha - 0.05).abs() < 1e-9 {
        &SMM_TABLE_ALPHA_05
    } else if (alpha - 0.1).abs() < 1e-9 {
        &SMM_TABLE_ALPHA_10
    } else {
        return None; // Alpha tidak didukung oleh tabel yang tersedia.
    };

    interpolate_smm_table_value(k_param, df_f64, &SMM_K_STAR_VALS, &SMM_V_VALS_ACTUAL, table_to_use)
}

// --- MULAI Data Tabel q (Studentized Range) dan Fungsi Bantu ---

// Sumbu bersama untuk k (jumlah grup) untuk tabel q.
static Q_TABLE_K_VALS: [f64; 19] = [
    2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0,
    20.0,
];

// Sumbu bersama untuk v (derajat kebebasan) untuk tabel q.
static Q_TABLE_V_VALS: [f64; 22] = [
    1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0,
    19.0, 20.0, 24.0, 30.0,
];

// Tabel q untuk alpha = 0.05. Digunakan untuk uji seperti Tukey's HSD.
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

/// Melakukan interpolasi bilinear pada tabel q.
/// Berbeda dengan tabel SMM, fungsi ini menggunakan interpolasi linear untuk kedua sumbu (k dan df).
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

    // Interpolasi linear sepanjang sumbu v (df).
    let r1 = q11 * (1.0 - v_t) + q21 * v_t;
    let r2 = q12 * (1.0 - v_t) + q22 * v_t;

    // Interpolasi linear sepanjang sumbu k dari hasil sebelumnya.
    Some(r1 * (1.0 - k_t) + r2 * k_t)
}

/// Menghitung nilai kritis untuk distribusi Studentized Range (q).
///
/// Menggunakan pencarian dan interpolasi bilinear dari tabel.
/// Saat ini hanya mendukung alpha = 0.05.
///
/// # Arguments
/// * `alpha` - Tingkat signifikansi (hanya 0.05 yang didukung).
/// * `k_param` - Jumlah grup.
/// * `df` - Derajat kebebasan.
///
/// # Returns
/// `Some(f64)` berisi nilai q kritis, atau `None` jika tidak didukung.
pub fn studentized_range_critical_value(alpha: f64, k_param: usize, df: usize) -> Option<f64> {
    if k_param < 2 || df == 0 {
        return None;
    }

    // Memilih tabel q berdasarkan alpha.
    let table_to_use = if (alpha - 0.05).abs() < 1e-9 {
        &Q_TABLE_ALPHA_05
    } else {
        return None; // Alpha selain 0.05 belum didukung.
    };

    interpolate_q_table_value(
        k_param as f64,
        df as f64,
        &Q_TABLE_K_VALS,
        &Q_TABLE_V_VALS,
        table_to_use
    )
}

// --- AKHIR Data Tabel q ---

// --- MULAI Data Tabel Uji Dunnett dan Fungsi Bantu ---

// Sumbu k (jumlah grup perlakuan, tidak termasuk kontrol) untuk Uji Dunnett.
const DUNNETT_K_VALS: [f64; 9] = [2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];

// Sumbu v (derajat kebebasan) untuk Uji Dunnett.
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
    f64::INFINITY, // Baris duplikat untuk menangani interpolasi di dekat tak hingga
];

// Tabel Uji Dunnett untuk alpha = 0.05, uji dua sisi.
const DUNNETT_TABLE_0_05_TWO_SIDED: [[f64; 9]; 18] = [
    // k=      2      3      4      5      6      7      8      9     10
    /*v=1*/ [12.71, 15.91, 17.98, 19.43, 20.56, 21.49, 22.28, 22.98, 23.59],
    /*v=2*/ [4.3, 4.94, 5.36, 5.66, 5.89, 6.08, 6.24, 6.37, 6.49],
    /*v=3*/ [3.18, 3.53, 3.78, 3.96, 4.1, 4.21, 4.31, 4.39, 4.47],
    /*v=4*/ [2.78, 3.03, 3.22, 3.36, 3.46, 3.55, 3.63, 3.69, 3.75],
    /*v=5*/ [2.57, 2.78, 2.92, 3.03, 3.12, 3.19, 3.26, 3.31, 3.36],
    /*v=6*/ [2.45, 2.63, 2.76, 2.85, 2.93, 3.0, 3.05, 3.1, 3.14],
    /*v=7*/ [2.36, 2.54, 2.65, 2.74, 2.81, 2.87, 2.92, 2.96, 3.0],
    /*v=8*/ [2.31, 2.47, 2.58, 2.66, 2.73, 2.78, 2.83, 2.87, 2.9],
    /*v=9*/ [2.26, 2.42, 2.52, 2.6, 2.66, 2.71, 2.75, 2.79, 2.82],
    /*v=10*/ [2.23, 2.38, 2.47, 2.55, 2.61, 2.66, 2.7, 2.73, 2.76],
    /*v=12*/ [2.18, 2.32, 2.41, 2.48, 2.54, 2.58, 2.62, 2.65, 2.68],
    /*v=15*/ [2.13, 2.27, 2.35, 2.41, 2.46, 2.51, 2.54, 2.57, 2.6],
    /*v=20*/ [2.09, 2.21, 2.29, 2.35, 2.4, 2.44, 2.47, 2.5, 2.52],
    /*v=30*/ [2.04, 2.16, 2.23, 2.29, 2.33, 2.37, 2.4, 2.42, 2.45],
    /*v=60*/ [2.0, 2.11, 2.18, 2.23, 2.27, 2.31, 2.33, 2.36, 2.38],
    /*v=120*/ [1.98, 2.08, 2.15, 2.2, 2.24, 2.27, 2.3, 2.32, 2.34],
    /*v=inf*/ [1.96, 2.06, 2.13, 2.17, 2.21, 2.24, 2.27, 2.29, 2.31],
    /*v=inf*/ [1.96, 2.06, 2.13, 2.17, 2.21, 2.24, 2.27, 2.29, 2.31],
];

// Tabel Uji Dunnett untuk alpha = 0.05, uji satu sisi.
const DUNNETT_TABLE_0_05_ONE_SIDED: [[f64; 9]; 18] = [
    // k=      2      3      4      5      6      7      8      9     10
    /*v=1*/ [6.31, 7.65, 8.55, 9.19, 9.68, 10.08, 10.41, 10.7, 10.95],
    /*v=2*/ [2.92, 3.33, 3.61, 3.82, 3.98, 4.12, 4.23, 4.33, 4.41],
    /*v=3*/ [2.35, 2.61, 2.78, 2.91, 3.01, 3.09, 3.16, 3.22, 3.27],
    /*v=4*/ [2.13, 2.34, 2.47, 2.57, 2.64, 2.71, 2.76, 2.81, 2.85],
    /*v=5*/ [2.02, 2.2, 2.31, 2.39, 2.46, 2.51, 2.56, 2.6, 2.63],
    /*v=6*/ [1.94, 2.1, 2.21, 2.28, 2.34, 2.39, 2.43, 2.46, 2.49],
    /*v=7*/ [1.89, 2.04, 2.14, 2.21, 2.26, 2.31, 2.34, 2.38, 2.4],
    /*v=8*/ [1.86, 2.0, 2.09, 2.15, 2.2, 2.24, 2.28, 2.31, 2.34],
    /*v=9*/ [1.83, 1.97, 2.05, 2.11, 2.16, 2.2, 2.23, 2.26, 2.29],
    /*v=10*/ [1.81, 1.94, 2.02, 2.08, 2.13, 2.17, 2.2, 2.23, 2.25],
    /*v=12*/ [1.78, 1.91, 1.99, 2.04, 2.09, 2.12, 2.15, 2.18, 2.2],
    /*v=15*/ [1.75, 1.87, 1.94, 2.0, 2.04, 2.07, 2.1, 2.13, 2.15],
    /*v=20*/ [1.72, 1.83, 1.9, 1.95, 1.99, 2.02, 2.05, 2.07, 2.09],
    /*v=30*/ [1.69, 1.8, 1.86, 1.91, 1.94, 1.97, 2.0, 2.02, 2.04],
    /*v=60*/ [1.67, 1.77, 1.82, 1.86, 1.9, 1.92, 1.94, 1.96, 1.98],
    /*v=120*/ [1.66, 1.75, 1.8, 1.84, 1.87, 1.9, 1.92, 1.94, 1.95],
    /*v=inf*/ [1.64, 1.73, 1.78, 1.82, 1.85, 1.87, 1.89, 1.91, 1.92],
    /*v=inf*/ [1.64, 1.73, 1.78, 1.82, 1.85, 1.87, 1.89, 1.91, 1.92],
];

/// Melakukan interpolasi bilinear pada tabel Uji Dunnett.
/// Menggunakan interpolasi linear untuk kedua sumbu.
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

/// Menghitung nilai kritis untuk Uji Dunnett.
///
/// Uji ini membandingkan beberapa perlakuan dengan satu kontrol.
/// Saat ini mendukung alpha = 0.05 untuk uji satu sisi dan dua sisi.
///
/// # Arguments
/// * `alpha` - Tingkat signifikansi.
/// * `k_param` - Jumlah grup perlakuan (tidak termasuk kontrol).
/// * `df` - Derajat kebebasan.
/// * `one_sided` - `true` untuk uji satu sisi, `false` untuk dua sisi.
///
/// # Returns
/// `Some(f64)` berisi nilai kritis, atau `None` jika tidak didukung.
pub fn dunnett_critical_value(
    alpha: f64,
    k_param: usize,
    df: usize,
    one_sided: bool
) -> Option<f64> {
    if k_param < 2 || df == 0 {
        return None;
    }

    // Memilih tabel yang benar berdasarkan alpha dan jenis uji.
    let table = if (alpha - 0.05).abs() < 1e-9 {
        if one_sided { &DUNNETT_TABLE_0_05_ONE_SIDED } else { &DUNNETT_TABLE_0_05_TWO_SIDED }
    } else {
        return None; // Nilai alpha lain belum didukung.
    };

    interpolate_dunnett_table_value(
        k_param as f64,
        df as f64,
        &DUNNETT_K_VALS,
        &DUNNETT_V_VALS,
        table
    )
}

// --- AKHIR Data Tabel Uji Dunnett ---

/// Placeholder untuk menghitung nilai kritis Uji Waller-Duncan.
///
/// Uji Waller-Duncan adalah uji post-hoc yang menggunakan pendekatan Bayesian
/// untuk menentukan apakah perbedaan rata-rata signifikan secara statistik,
/// dengan mempertimbangkan rasio F dari ANOVA.
///
/// # Arguments
/// * `k_ratio` - Rasio k (rasio biaya kesalahan Tipe I dan Tipe II).
/// * `f_value` - Nilai F dari ANOVA.
/// * `df_error` - Derajat kebebasan galat (error).
/// * `k_groups` - Jumlah total grup.
///
/// # Returns
/// `None` karena implementasi lengkap memerlukan fungsi atau tabel khusus yang kompleks.
pub fn waller_duncan_critical_value(
    _k_ratio: f64,
    _f_value: f64,
    _df_error: usize,
    _k_groups: usize
) -> Option<f64> {
    // Implementasi ini sangat kompleks dan memerlukan fungsi khusus (misalnya, dari pustaka R `agricolae`)
    // atau tabel yang sangat luas yang tidak diimplementasikan di sini.
    // Mengembalikan None untuk menandakan bahwa fungsi ini belum diimplementasikan sepenuhnya.
    None
}
