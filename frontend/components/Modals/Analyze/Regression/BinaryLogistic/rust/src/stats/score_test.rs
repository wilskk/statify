use nalgebra::{DMatrix, DVector};
use statrs::distribution::{ChiSquared, ContinuousCDF};

/// Menghitung Score Test untuk satu variabel kandidat
/// Berdasarkan model yang sudah ada (current_model)
pub fn calculate_score(
    residuals: &DVector<f64>, // (y - p) dari model saat ini
    weights_diag: &DVector<f64>, // p * (1-p) dari model saat ini
    x_current: &DMatrix<f64>, // Matriks X variabel yang SUDAH ada di model
    x_candidate: &DVector<f64>, // Vektor X variabel kandidat
) -> (f64, f64) { // (Score Statistic, P-Value)

    let _n = x_current.nrows();

    // 1. Hitung Gradient (U) untuk kandidat
    // U = Sum(residual * x_candidate)
    let u: f64 = residuals.dot(x_candidate);

    // 2. Hitung Information Matrix Components
    // Kita perlu elemen diagonal Information Matrix yang sesuai dengan kandidat,
    // dikoreksi (adjusted) terhadap variabel yang sudah ada di model.
    // Rumus: V = I_cc - I_cm * inv(I_mm) * I_mc
    
    // Matriks Bobot W (diagonal)
    // Untuk efisiensi, kita lakukan perkalian manual tanpa membuat matriks diagonal W penuh
    
    // Hitung X_cand^T * W * X_cand (Skalar I_cc)
    let i_cc: f64 = x_candidate.iter().zip(weights_diag.iter())
        .map(|(x, w)| x * x * w)
        .sum();

    // Hitung X_current^T * W * X_candidate (Vektor I_mc)
    // Hasilnya adalah vektor ukuran k (jumlah var di model)
    let mut i_mc = DVector::zeros(x_current.ncols());
    for j in 0..x_current.ncols() {
        let col = x_current.column(j);
        let val: f64 = col.iter().zip(x_candidate.iter()).zip(weights_diag.iter())
            .map(|((xj, xc), w)| xj * xc * w)
            .sum();
        i_mc[j] = val;
    }

    // Hitung Information Matrix Inverse dari model saat ini (inv(I_mm))
    // I_mm = X_current^T * W * X_current
    // Karena kita tidak mau hitung ulang invers setiap saat, idealnya ini dipass dari IRLS result.
    // TAPI, untuk amannya kita hitung ulang di sini (sedikit lebih lambat tapi akurat).
    let mut i_mm = DMatrix::zeros(x_current.ncols(), x_current.ncols());
    for r in 0..x_current.ncols() {
        for c in 0..x_current.ncols() {
            let col_r = x_current.column(r);
            let col_c = x_current.column(c);
            let val: f64 = col_r.iter().zip(col_c.iter()).zip(weights_diag.iter())
                .map(|((xr, xc), w)| xr * xc * w)
                .sum();
            i_mm[(r, c)] = val;
        }
    }

    // Invers I_mm
    if let Some(i_mm_inv) = i_mm.try_inverse() {
        // V_adjust = I_cc - I_mc^T * inv(I_mm) * I_mc
        let adjustment = i_mc.transpose() * i_mm_inv * i_mc;
        let v_score = i_cc - adjustment[(0,0)];

        if v_score > 1e-10 {
            let score_stat = (u * u) / v_score;
            let p_val = 1.0 - ChiSquared::new(1.0).unwrap().cdf(score_stat);
            return (score_stat, p_val);
        }
    }

    (0.0, 1.0)
}