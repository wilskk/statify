use nalgebra::{DMatrix, DVector};
use statrs::distribution::{ChiSquared, ContinuousCDF};

/// Menghitung Score Statistic dan P-Value untuk calon variabel baru
pub fn calculate_score_test(
    residuals: &DVector<f64>,      // (y - pi)
    weights: &DVector<f64>,        // pi * (1 - pi)
    current_x: &DMatrix<f64>,      // Matriks X model saat ini
    candidate_col: &DVector<f64>,  // Kolom data kandidat
    inv_cov_matrix: &DMatrix<f64>, // Matriks Kovarians model saat ini
) -> (f64, f64) {
    // Mengembalikan (Score Chi-Sq, P-Value)

    // 1. Hitung Score Vector (U) = z' * (y - pi)
    let u_val = candidate_col.dot(residuals);

    // 2. Hitung Information Varians
    // V = z'Wz - z'WX * (X'WX)^-1 * X'Wz

    // a. z'Wz (Bobot diagonal, jadi element-wise)
    let weighted_candidate = candidate_col.component_mul(weights);
    let term1 = candidate_col.dot(&weighted_candidate);

    // b. z'WX
    let z_w_x = weighted_candidate.transpose() * current_x;

    // c. Bagian kanan: (z'WX) * CovMatrix * (X'Wz)
    let term2_mat = &z_w_x * inv_cov_matrix * z_w_x.transpose();
    let term2 = term2_mat[(0, 0)];

    let variance = term1 - term2;

    // Cek singularitas/variance 0
    if variance <= 1e-12 {
        return (0.0, 1.0); // P-value 1.0 (tidak signifikan)
    }

    // 3. Score Statistic = U^2 / V
    let score_stat = (u_val * u_val) / variance;

    // 4. Hitung P-Value (Chi-Square df=1)
    let p_value = match ChiSquared::new(1.0) {
        Ok(dist) => 1.0 - dist.cdf(score_stat),
        Err(_) => 1.0,
    };

    (score_stat, p_value)
}

// Menghitung apakah sekumpulan variabel X secara simultan signifikan dibandingkan Null Model
pub fn calculate_global_score_test(
    x: &DMatrix<f64>, // Matrix Covariates (TANPA kolom Intercept)
    y: &DVector<f64>,
    null_prob: f64, // Rata-rata Y (proporsi kasus positif)
) -> (f64, i32, f64) {
    // Returns: (ChiSquare, df, Sig)
    let n = x.nrows();
    let k = x.ncols(); // df = jumlah variabel

    // 1. Hitung Residuals Null Model: (y - p_0)
    // Residuals ini sama untuk semua baris jika p_0 konstan, tapi y beda (0/1)
    let residuals = y.map(|yi| yi - null_prob);

    // 2. Hitung Score Vector (U): X' * residuals
    // Ini mengukur gradien log-likelihood di titik null
    let u = x.transpose() * &residuals;

    // 3. Hitung Information Matrix (I) di titik Null
    // I = p(1-p) * (X'X - n * x_bar * x_bar')
    // Ini adalah matriks scatter terpusat yang diskalakan dengan varians p

    let w_val = null_prob * (1.0 - null_prob);

    // a. Hitung rata-rata tiap kolom X
    // Cara manual summing kolom agar efisien
    let ones = DVector::from_element(n, 1.0);
    let x_sums = x.transpose() * &ones; // Vector panjang k berisi sum tiap kolom

    // b. Information Matrix (Centered)
    // Rumus komputasi efisien: X'WX - (X'W1 * 1'WX) / sum(W)
    // Karena W konstan, bisa disederhanakan:
    // I = w * [ X'X - (1/n) * (sum_x * sum_x') ]

    let xt_x = x.transpose() * x;
    let correction = (&x_sums * x_sums.transpose()) / (n as f64);

    let centered_info_matrix = (xt_x - correction) * w_val;

    // 4. Hitung Score Statistic: U' * inv(I) * U
    let score_stat = match centered_info_matrix.clone().cholesky() {
        Some(chol) => {
            let solution = chol.solve(&u);
            u.dot(&solution) // U . (I^-1 . U)
        }
        None => {
            // Jika Cholesky gagal, gunakan matriks asli (yang masih ada karena di-clone sebelumnya)
            match centered_info_matrix.try_inverse() {
                Some(inv) => {
                    let term = &inv * &u;
                    u.dot(&term)
                }
                None => 0.0,
            }
        }
    };

    // 5. Hitung P-Value
    let sig = match ChiSquared::new(k as f64) {
        Ok(dist) => {
            if score_stat > 0.0 {
                1.0 - dist.cdf(score_stat)
            } else {
                1.0
            }
        }
        Err(_) => 1.0,
    };

    (score_stat, k as i32, sig)
}
