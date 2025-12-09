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
