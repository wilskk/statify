use std::collections::HashMap;
use nalgebra::DMatrix;
use crate::univariate::models::{
    config::{ SumOfSquaresMethod, UnivariateConfig },
    data::AnalysisData,
    result::{ HypothesisLMatrices, TermMatrix },
};
use crate::univariate::stats::core::{ create_design_response_weights, create_cross_product_matrix };
use crate::univariate::stats::factor_utils::generate_all_row_parameter_names_sorted;
use crate::univariate::stats::hypothesis_matrix::{
    construct_type_i_l_matrix,
    construct_type_ii_l_matrix,
    construct_type_iii_l_matrix,
    construct_type_iv_l_matrix,
};

pub fn calculate_hypothesis_l_matrices(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HypothesisLMatrices, String> {
    let design_info = create_design_response_weights(data, config).map_err(|e| {
        format!("Failed to create design matrix for L-Matrices: {}", e)
    })?;

    if design_info.p_parameters == 0 {
        return Ok(HypothesisLMatrices { matrices: vec![] });
    }

    // ztwz_matrix is needed for Type I
    let ztwz_matrix = if config.model.sum_of_square_method == SumOfSquaresMethod::TypeI {
        create_cross_product_matrix(&design_info).map_err(|e|
            format!("Failed to create cross-product matrix for L-Matrices: {}", e)
        )?
    } else {
        DMatrix::zeros(0, 0) // Not needed for other types
    };

    let all_param_names = generate_all_row_parameter_names_sorted(&design_info, data)?;
    let all_model_terms_in_design = &design_info.term_names;

    let mut l_matrices_map: HashMap<String, DMatrix<f64>> = HashMap::new();

    for term_name in all_model_terms_in_design {
        let l_matrix_result = match config.model.sum_of_square_method {
            SumOfSquaresMethod::TypeI =>
                construct_type_i_l_matrix(
                    &design_info,
                    term_name,
                    all_model_terms_in_design,
                    &ztwz_matrix
                ),
            SumOfSquaresMethod::TypeII =>
                construct_type_ii_l_matrix(&design_info, term_name, all_model_terms_in_design),
            SumOfSquaresMethod::TypeIII =>
                construct_type_iii_l_matrix(
                    &design_info,
                    term_name,
                    all_model_terms_in_design,
                    data,
                    config
                ),
            SumOfSquaresMethod::TypeIV =>
                construct_type_iv_l_matrix(
                    &design_info,
                    term_name,
                    all_model_terms_in_design,
                    data,
                    config
                ),
        };

        if let Ok(l_matrix) = l_matrix_result {
            l_matrices_map.insert(term_name.clone(), l_matrix);
        } else if let Err(e) = l_matrix_result {
            // Optionally log the error if a matrix can't be generated for a term
            web_sys::console::warn_1(
                &format!("Could not generate L-matrix for term '{}': {}", term_name, e).into()
            );
        }
    }

    // Now, format the collected L-matrices
    let mut matrices = Vec::new();
    let ss_type_str = match config.model.sum_of_square_method {
        SumOfSquaresMethod::TypeI => "I",
        SumOfSquaresMethod::TypeII => "II",
        SumOfSquaresMethod::TypeIII => "III",
        SumOfSquaresMethod::TypeIV => "IV",
    };
    let note = format!("Based on Type {} Sums of Squares.", ss_type_str);

    // Iterate in the original order of terms to maintain consistency
    for term_name in all_model_terms_in_design {
        if let Some(l_matrix) = l_matrices_map.get(term_name) {
            if l_matrix.nrows() == 0 || l_matrix.ncols() == 0 {
                continue;
            }

            let l_transpose = l_matrix.transpose();
            let mut matrix_data: Vec<Vec<f64>> = Vec::new();
            for r in 0..l_transpose.nrows() {
                matrix_data.push(l_transpose.row(r).iter().cloned().collect());
            }

            let mut contrast_names = Vec::new();
            // The number of contrasts is the number of rows in the L matrix
            for i in 0..l_matrix.nrows() {
                contrast_names.push(format!("L{}", i + 1));
            }

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
