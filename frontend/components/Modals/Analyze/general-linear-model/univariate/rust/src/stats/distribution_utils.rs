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
/// menggunakan Aproksimasi (diadaptasi dari Abramowitz & Stegun, formula 26.6.26).
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
