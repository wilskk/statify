use nalgebra::{ DMatrix, DVector };
use crate::models::{ config::UnivariateConfig, data::AnalysisData, result::DesignMatrixInfo };

use super::core::*;

/**
 * Menghitung Sum of Squares (SS) untuk suatu term hipotesis berdasarkan matriks L.
 * Fungsi ini merupakan implementasi inti dari uji hipotesis linier umum.
 *
 * Rumus Statistik yang Digunakan:
 * - Nama: Statistik Kuadratik untuk Hipotesis Linier Umum (sering digunakan dalam konteks Uji Wald).
 * - Formula: SS(H) = (L * beta_hat)^T * (L * G_inv * L')^-1 * (L * beta_hat)
 *   di mana G_inv adalah generalized inverse dari matriks (X'WX), yang proporsional
 *   dengan matriks kovarians dari beta_hat.
 *
 * Tujuan:
 * Menguji hipotesis nol H0: L * beta = 0. Jika nilai SS(H) besar, ini memberikan bukti
 * untuk menolak H0, yang berarti kombinasi linier dari parameter yang diuji (didefinisikan
 * oleh matriks L) secara statistik signifikan.
 *
 * Interpretasi Hasil:
 * - `ss`: Nilai Sum of Squares. Semakin besar nilainya, semakin signifikan efek term tersebut.
 * - `df`: Derajat kebebasan (degrees of freedom) yang terkait dengan SS, yang digunakan dalam
 *         perhitungan Mean Square (MS) dan uji-F.
 */
pub fn calculate_ss_for_term(
    l_matrix: &DMatrix<f64>,
    beta_hat_model: &DVector<f64>,
    g_inv_model: &DMatrix<f64>,
    term_of_interest: &str
) -> Result<(f64, usize), String> {
    // Jika matriks L tidak memiliki baris atau kolom, berarti tidak ada hipotesis yang perlu diuji.
    if l_matrix.nrows() == 0 || l_matrix.ncols() == 0 {
        return Ok((0.0, 0));
    }

    // Validasi dimensi: jumlah kolom L harus sama dengan jumlah baris/elemen beta_hat.
    if beta_hat_model.nrows() != l_matrix.ncols() {
        return Err(
            format!(
                "L-matrix ({},{}) and Beta-hat ({}) dimensions mismatch for term '{}'",
                l_matrix.nrows(),
                l_matrix.ncols(),
                beta_hat_model.nrows(),
                term_of_interest
            )
        );
    }

    // Validasi dimensi: G_inv harus matriks persegi dengan dimensi sama dengan jumlah kolom L.
    if g_inv_model.nrows() != l_matrix.ncols() || g_inv_model.ncols() != l_matrix.ncols() {
        return Err(
            format!(
                "L-matrix ({},{}) and G_inv ({},{}) dimensions mismatch for term '{}'",
                l_matrix.nrows(),
                l_matrix.ncols(),
                g_inv_model.nrows(),
                g_inv_model.ncols(),
                term_of_interest
            )
        );
    }

    // Menghitung (L * beta_hat), yaitu estimasi nilai dari kombinasi linier hipotesis.
    let l_beta_hat = l_matrix * beta_hat_model;

    // Menghitung (L * G_inv * L'), yang merupakan bagian inti dari bentuk kuadratik SS.
    // Matriks ini proporsional dengan matriks kovarians dari (L * beta_hat).
    let l_g_inv_lt = l_matrix * g_inv_model * l_matrix.transpose();

    // Derajat kebebasan (df) untuk term ini adalah rank dari matriks (LGL').
    // Rank menunjukkan jumlah hipotesis linier independen yang sedang diuji.
    let df_term = l_g_inv_lt.rank(1e-8);
    if df_term == 0 {
        return Ok((0.0, 0));
    }

    // Menghitung pseudo-inverse dari (LGL'), diperlukan jika matriks tersebut singular.
    // Ini memungkinkan perhitungan SS bahkan ketika beberapa hipotesis bersifat dependen secara linier.
    let l_g_inv_lt_inv_tolerance = 1e-12;
    let l_g_inv_lt_inv = l_g_inv_lt
        .clone()
        .svd(true, true)
        .pseudo_inverse(l_g_inv_lt_inv_tolerance)
        .map_err(|e|
            format!(
                "Singular (LGL') matrix for term '{}', pseudo-inverse failed: {}. Cannot compute SS. LGL' norm: {:.2e}",
                term_of_interest,
                e,
                l_g_inv_lt.norm()
            )
        )?;

    // Menghitung SS(H) = (L*beta)^T * (LGL')^-1 * (L*beta).
    // Hasilnya harus berupa matriks 1x1 yang berisi nilai SS skalar.
    let ss_matrix = l_beta_hat.transpose() * l_g_inv_lt_inv * l_beta_hat;

    // Memastikan hasil perhitungan SS adalah sebuah skalar sebelum mengembalikannya.
    if ss_matrix.nrows() == 1 && ss_matrix.ncols() == 1 {
        // SS tidak boleh negatif; ambil nilai maksimal antara hasil perhitungan dan 0.0.
        Ok((ss_matrix[(0, 0)].max(0.0), df_term))
    } else {
        Err(
            format!(
                "SS calculation for term '{}' resulted in a non-scalar matrix ({}x{}).",
                term_of_interest,
                ss_matrix.nrows(),
                ss_matrix.ncols()
            )
        )
    }
}

/// Menghitung Sum of Squares (SS) Tipe I menggunakan pendekatan matriks hipotesis.
///
/// SS Tipe I bersifat sekuensial; hasilnya bergantung pada urutan term dalam model.
/// Suatu term dievaluasi setelah term-term yang mendahuluinya dalam model dimasukkan.
/// Ini berguna untuk analisis di mana urutan penambahan prediktor memiliki makna teoretis.
pub fn calculate_type_i_ss(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String],
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>,
    ztwz_matrix: &DMatrix<f64>
) -> Result<(f64, usize), String> {
    // Membangun matriks hipotesis (L) yang sesuai untuk SS Tipe I.
    let l_matrix = construct_type_i_l_matrix(
        design_info,
        term_of_interest,
        all_model_terms,
        ztwz_matrix
    )?;
    // Menghitung SS menggunakan matriks L yang telah dibangun.
    calculate_ss_for_term(&l_matrix, beta_hat, g_inv, term_of_interest)
}

/// Menghitung Sum of Squares (SS) Tipe II menggunakan pendekatan matriks hipotesis.
///
/// SS Tipe II menguji efek suatu term setelah memperhitungkan semua term lain dalam model
/// yang TIDAK mengandung term tersebut (misalnya, interaksi tingkat lebih tinggi diabaikan).
/// Cocok untuk model tanpa interaksi signifikan.
pub fn calculate_type_ii_ss(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String],
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>
) -> Result<(f64, usize), String> {
    // Membangun matriks hipotesis (L) yang sesuai untuk SS Tipe II.
    let l_matrix = construct_type_ii_l_matrix(design_info, term_of_interest, all_model_terms)?;
    // Menghitung SS menggunakan matriks L yang telah dibangun.
    calculate_ss_for_term(&l_matrix, beta_hat, g_inv, term_of_interest)
}

/// Menghitung Sum of Squares (SS) Tipe III menggunakan pendekatan matriks hipotesis.
///
/// SS Tipe III menguji efek suatu term setelah memperhitungkan semua term lain dalam model,
/// termasuk interaksi. Ini adalah pendekatan yang paling umum digunakan ketika ada interaksi
/// dalam model, karena menguji hipotesis marginal.
pub fn calculate_type_iii_ss(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String],
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>,
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<(f64, usize), String> {
    // Membangun matriks hipotesis (L) yang sesuai untuk SS Tipe III.
    let l_matrix = construct_type_iii_l_matrix(
        design_info,
        term_of_interest,
        all_model_terms,
        data,
        config
    )?;
    // Menghitung SS menggunakan matriks L yang telah dibangun.
    calculate_ss_for_term(&l_matrix, beta_hat, g_inv, term_of_interest)
}

/// Menghitung Sum of Squares (SS) Tipe IV menggunakan pendekatan matriks hipotesis.
///
/// SS Tipe IV dirancang khusus untuk data yang tidak seimbang dengan sel kosong (missing cells)
/// dalam desain faktorial. Hipotesis yang diuji bergantung pada pola sel kosong tersebut.
pub fn calculate_type_iv_ss(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String],
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>,
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<(f64, usize), String> {
    // Membangun matriks hipotesis (L) yang sesuai untuk SS Tipe IV.
    let l_matrix = construct_type_iv_l_matrix(
        design_info,
        term_of_interest,
        all_model_terms,
        data,
        config
    )?;
    // Menghitung SS menggunakan matriks L yang telah dibangun.
    calculate_ss_for_term(&l_matrix, beta_hat, g_inv, term_of_interest)
}
