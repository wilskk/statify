use std::collections::HashMap;
use nalgebra::DMatrix;
use crate::univariate::models::{
    config::{ SumOfSquaresMethod, UnivariateConfig },
    data::AnalysisData,
    result::{ HypothesisLMatrices, TermMatrix },
};

use super::core::*;

/// Menghitung matriks hipotesis L untuk berbagai metode sum of squares
///
/// Fungsi ini menghasilkan matriks L yang digunakan untuk menguji hipotesis kontras
/// dalam analisis varians. Matriks L mendefinisikan kombinasi linear dari parameter
/// yang akan diuji.
///
/// Matriks L digunakan dalam rumus: Lβ = 0, dimana β adalah vektor parameter model
pub fn calculate_hypothesis_l_matrices(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HypothesisLMatrices, String> {
    // Membuat matriks desain dan informasi terkait untuk analisis
    let design_info = create_design_response_weights(data, config).map_err(|e| {
        format!("Failed to create design matrix for L-Matrices: {}", e)
    })?;

    // Jika tidak ada parameter dalam model, kembalikan hasil kosong
    if design_info.p_parameters == 0 {
        return Ok(HypothesisLMatrices { matrices: vec![] });
    }

    // Matriks cross-product (Z'WZ) diperlukan untuk Type I SS
    let ztwz_matrix = if config.model.sum_of_square_method == SumOfSquaresMethod::TypeI {
        create_cross_product_matrix(&design_info).map_err(|e|
            format!("Failed to create cross-product matrix for L-Matrices: {}", e)
        )?
    } else {
        DMatrix::zeros(0, 0) // Tidak diperlukan untuk tipe lain
    };

    // Mendapatkan nama semua parameter model yang diurutkan
    let all_param_names = generate_all_row_parameter_names_sorted(&design_info, data)?;

    // Daftar semua term dalam model desain
    let all_model_terms_in_design = &design_info.term_names;

    // HashMap untuk menyimpan matriks L untuk setiap term
    let mut l_matrices_map: HashMap<String, DMatrix<f64>> = HashMap::new();

    // ===== GENERASI MATRIKS L UNTUK SETIAP TERM =====

    for term_name in all_model_terms_in_design {
        // Membuat matriks L berdasarkan metode sum of squares yang dipilih
        let l_matrix_result = match config.model.sum_of_square_method {
            SumOfSquaresMethod::TypeI =>
                // Type I: Sequential SS - matriks L berdasarkan urutan dalam model
                construct_type_i_l_matrix(
                    &design_info,
                    term_name,
                    all_model_terms_in_design,
                    &ztwz_matrix
                ),
            SumOfSquaresMethod::TypeII =>
                // Type II: Hierarchical SS - matriks L dengan mempertimbangkan hierarki
                construct_type_ii_l_matrix(&design_info, term_name, all_model_terms_in_design),
            SumOfSquaresMethod::TypeIII =>
                // Type III: Partial SS - matriks L dengan mengontrol efek lain
                construct_type_iii_l_matrix(
                    &design_info,
                    term_name,
                    all_model_terms_in_design,
                    data,
                    config
                ),
            SumOfSquaresMethod::TypeIV =>
                // Type IV: Marginal SS - matriks L untuk desain tidak seimbang
                construct_type_iv_l_matrix(
                    &design_info,
                    term_name,
                    all_model_terms_in_design,
                    data,
                    config
                ),
        };

        // Menyimpan matriks L jika berhasil dibuat
        if let Ok(l_matrix) = l_matrix_result {
            l_matrices_map.insert(term_name.clone(), l_matrix);
        } else if let Err(e) = l_matrix_result {
            // Log warning jika matriks tidak dapat dibuat untuk suatu term
            web_sys::console::warn_1(
                &format!("Could not generate L-matrix for term '{}': {}", term_name, e).into()
            );
        }
    }

    // ===== FORMATTING MATRIKS L UNTUK OUTPUT =====

    let mut matrices = Vec::new();

    // Menentukan string tipe sum of squares untuk catatan
    let ss_type_str = match config.model.sum_of_square_method {
        SumOfSquaresMethod::TypeI => "I",
        SumOfSquaresMethod::TypeII => "II",
        SumOfSquaresMethod::TypeIII => "III",
        SumOfSquaresMethod::TypeIV => "IV",
    };
    let note = format!("Based on Type {} Sums of Squares.", ss_type_str);

    // Iterasi dalam urutan asli term untuk menjaga konsistensi
    for term_name in all_model_terms_in_design {
        if let Some(l_matrix) = l_matrices_map.get(term_name) {
            // Skip matriks kosong
            if l_matrix.nrows() == 0 || l_matrix.ncols() == 0 {
                continue;
            }

            // Transpose matriks L untuk format output
            let l_transpose = l_matrix.transpose();
            let mut matrix_data: Vec<Vec<f64>> = Vec::new();

            // Konversi matriks ke format vector untuk output
            for r in 0..l_transpose.nrows() {
                matrix_data.push(l_transpose.row(r).iter().cloned().collect());
            }

            // Membuat nama kontras (L1, L2, L3, dst)
            let mut contrast_names = Vec::new();
            for i in 0..l_matrix.nrows() {
                contrast_names.push(format!("L{}", i + 1));
            }

            // Membuat entry TermMatrix untuk output
            matrices.push(TermMatrix {
                term: term_name.clone(),
                parameter_names: all_param_names.clone(),
                contrast_names,
                matrix: matrix_data,
                note: note.clone(),
            });
        }
    }

    Ok(HypothesisLMatrices { matrices })
}
