use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::SavedVariables,
};
use nalgebra::DVector;

use super::core::*;

/// Menghitung dan menyimpan variabel-variabel statistik yang diminta dalam konfigurasi analisis.
///
/// Fungsi ini melakukan analisis regresi untuk menghitung berbagai metrik diagnostik dan hasil,
/// seperti nilai prediksi, residual, dan statistik pengaruh (leverage, Cook's distance).
/// Proses ini melibatkan pembuatan matriks desain, estimasi parameter model, dan
/// perhitungan statistik untuk setiap titik data.
///
/// # Arguments
/// * `data` - Referensi ke `AnalysisData` yang berisi data input (variabel dependen, independen, dan bobot).
/// * `config` - Referensi ke `UnivariateConfig` yang berisi pengaturan analisis, termasuk variabel apa yang akan disimpan.
///
/// # Returns
/// * `Ok(SavedVariables)` - Struct yang berisi vektor-vektor hasil perhitungan jika berhasil.
/// * `Err(String)` - Pesan error jika terjadi masalah (misalnya, tidak ada data atau derajat kebebasan negatif).
pub fn save_variables(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<SavedVariables, String> {
    // Inisialisasi struct untuk menampung hasil perhitungan.
    // Vektor-vektor ini akan diisi sesuai dengan permintaan dalam `config.save`.
    let mut result = SavedVariables {
        predicted_values: Vec::new(),
        weighted_predicted_values: Vec::new(),
        residuals: Vec::new(),
        weighted_residuals: Vec::new(),
        deleted_residuals: Vec::new(),
        standardized_residuals: Vec::new(),
        studentized_residuals: Vec::new(),
        standard_errors: Vec::new(),
        cook_distances: Vec::new(),
        leverages: Vec::new(),
    };

    // Langkah 1: Buat matriks desain (X), vektor respons (y), dan vektor bobot (w).
    // Informasi ini diekstrak dari data input berdasarkan konfigurasi model.
    let design_info = create_design_response_weights(data, config)?;

    let n = design_info.n_samples; // Jumlah sampel (pengamatan)
    let p = design_info.p_parameters; // Jumlah parameter model (termasuk intersep)
    let rank = design_info.r_x_rank; // Rank dari matriks desain

    // Jika tidak ada data, kembalikan hasil kosong tanpa error.
    if n == 0 {
        return Ok(result);
    }

    // Jika tidak ada parameter dalam model, perhitungan tidak dapat dilanjutkan.
    if p == 0 {
        return Err("No model parameters for saved variables calculation".to_string());
    }

    let x = &design_info.x;
    let y = &design_info.y;

    // Langkah 2: Buat matriks cross-product (Z'WZ) dan lakukan operasi SWEEP.
    // Operasi SWEEP adalah metode komputasi efisien untuk menyelesaikan sistem persamaan linear
    // dalam regresi, yang menghasilkan estimasi koefisien (beta_hat) dan matriks invers (X'WX)^-1.
    let ztwz_matrix = create_cross_product_matrix(&design_info)?;
    let swept_info = perform_sweep_and_extract_results(&ztwz_matrix, p)?;

    let beta_hat = &swept_info.beta_hat; // Vektor koefisien regresi (β̂)
    let g_inv = &swept_info.g_inv; // Matriks (X'WX)⁻¹

    // Hitung nilai prediksi (ŷ) dan residual (e).
    // Rumus: ŷ = X * β̂
    // Rumus: e = y - ŷ
    let y_hat = x * beta_hat;
    let residuals = y - &y_hat;

    // Hitung Mean Squared Error (MSE), yaitu estimasi varians dari error (σ²).
    // Rumus: MSE = RSS / df_residual, di mana RSS adalah Residual Sum of Squares.
    let df_residual = (n - rank) as f64; // Derajat kebebasan untuk error
    if df_residual <= 0.0 {
        return Err(
            "Cannot calculate saved variables with zero or negative degrees of freedom for error.".to_string()
        );
    }
    let mse = swept_info.s_rss / df_residual;

    // Ambil nilai bobot, default ke 1.0 jika tidak disediakan (regresi biasa).
    let weight_values = match &design_info.w {
        Some(w) => w.clone_owned(),
        None => DVector::from_element(n, 1.0),
    };

    // Hitung elemen diagonal dari matriks 'hat' (H) tanpa bobot.
    // Rumus untuk elemen ke-i: h_i = x_i' * (X'WX)⁻¹ * x_i
    // h_i mengukur pengaruh dari observasi x_i terhadap nilai prediksinya sendiri.
    let h_diag = DVector::from_iterator(
        n,
        (0..n).map(|i| {
            let x_i = x.row(i);
            let temp = x_i * g_inv;
            (temp * x_i.transpose())[(0, 0)]
        })
    );

    // Iterasi melalui setiap observasi untuk menghitung statistik yang diminta.
    for i in 0..n {
        let weight = weight_values[i];
        let residual = residuals[i];

        // h_i adalah komponen leverage yang tidak dibobot.
        let h_i = h_diag[i];

        // Leverage (h_ii) adalah ukuran pengaruh suatu observasi terhadap model.
        // Rumus: leverage_i = w_i * x_i' * (X'WX)⁻¹ * x_i
        let leverage = weight * h_i;

        // Komponen penyebut untuk menghitung standard error dari residual,
        // yang juga digunakan dalam studentized residuals dan Cook's D.
        // Var(e_i) = σ² * (1/w_i - h_i)
        let se_residual_denom = 1.0 / weight - h_i;

        // Standard Error dari Residual
        // Mengestimasi deviasi standar dari residual ke-i.
        let se_residual = if weight > 0.0 && se_residual_denom > 0.0 {
            (mse * se_residual_denom).sqrt()
        } else {
            f64::NAN
        };

        // --- Simpan Variabel Hasil ---

        // Nilai prediksi (unstandardized)
        if config.save.unstandardized_pre {
            result.predicted_values.push(y_hat[i]);
        }

        // Nilai prediksi yang dibobot
        if config.save.weighted_pre {
            result.weighted_predicted_values.push(y_hat[i] * weight.sqrt());
        }

        // Standard Error dari Nilai Prediksi
        // Mengukur ketidakpastian dalam estimasi nilai prediksi rata-rata.
        // Rumus: SE(ŷ_i) = sqrt(MSE * h_i)
        if config.save.std_statistics {
            result.standard_errors.push((mse * h_i).sqrt());
        }

        // Residual (unstandardized)
        if config.save.unstandardized_res {
            result.residuals.push(residual);
        }

        // Residual yang dibobot (sering disebut residual Pearson)
        if config.save.weighted_res {
            result.weighted_residuals.push(residual * weight.sqrt());
        }

        // Deleted (PRESS) Residuals
        // Perbedaan antara nilai observasi y_i dan nilai prediksinya dari model
        // yang dibangun tanpa observasi ke-i.
        // Rumus: d_i = e_i / (1 - leverage_i)
        if config.save.deleted_res {
            if weight > 0.0 && se_residual_denom > 0.0 {
                // Catatan: implementasi di sini menggunakan `se_residual_denom`,
                // yang mungkin berbeda dari `(1 - leverage)`.
                result.deleted_residuals.push(residual / se_residual_denom);
            } else {
                result.deleted_residuals.push(f64::NAN);
            }
        }

        // Standardized (Pearson) Residuals
        // Residual yang diskalakan dengan estimasi standar deviasinya.
        // Rumus: r_std_i = e_i / sqrt(MSE / w_i)
        if config.save.standardized_res {
            if weight > 0.0 {
                result.standardized_residuals.push(residual / (mse / weight).sqrt());
            } else {
                result.standardized_residuals.push(f64::NAN);
            }
        }

        // Studentized Residuals
        // Mirip dengan standardized residual, tetapi menggunakan standard error
        // yang memperhitungkan leverage. Lebih sensitif terhadap outlier.
        // Rumus: r_stud_i = e_i / SE(e_i) = e_i / sqrt(MSE * (1/w_i - h_i))
        if config.save.studentized_res {
            if se_residual.is_finite() && se_residual > 0.0 {
                result.studentized_residuals.push(residual / se_residual);
            } else {
                result.studentized_residuals.push(f64::NAN);
            }
        }

        // Cook's Distance
        // Mengukur pengaruh gabungan dari leverage dan besarnya residual suatu titik data.
        // Nilai yang tinggi menunjukkan observasi yang berpengaruh.
        // Rumus: D_i = (r_stud_i² / p) * (leverage_i / (1 - leverage_i))
        if config.save.cooks_d {
            if se_residual.is_finite() && se_residual > 0.0 && leverage < 1.0 && leverage >= 0.0 {
                let stud_res = residual / se_residual;
                let cook_d = (stud_res.powi(2) / (rank as f64)) * (leverage / (1.0 - leverage));
                result.cook_distances.push(cook_d);
            } else {
                result.cook_distances.push(f64::NAN);
            }
        }

        // Leverages
        if config.save.leverage {
            result.leverages.push(leverage);
        }
    }

    Ok(result)
}
