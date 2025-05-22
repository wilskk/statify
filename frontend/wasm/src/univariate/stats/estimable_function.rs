use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ GeneralEstimableFunction },
};

use super::core::*;

/// Calculate general estimable function if requested
pub fn calculate_general_estimable_function(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<GeneralEstimableFunction, String> {
    if !config.options.general_fun {
        return Err("General estimable function not requested in configuration".to_string());
    }

    // Attempt to use DesignMatrixInfo for more robust parameter indexing
    let design_info = match create_design_response_weights(data, config) {
        Ok(info) => info,
        Err(e) => {
            // If design matrix fails, GEF also likely fails or is ill-defined
            return Err(format!("Cannot generate design matrix for GEF: {}", e));
        }
    };

    let mut matrix_rows_data: Vec<Vec<i32>> = Vec::new();
    let num_params = design_info.p_parameters;
    if num_params == 0 {
        return Ok(GeneralEstimableFunction { matrix: Vec::new() });
    }

    // Row for overall intercept / constant
    if let Some(intercept_col) = design_info.intercept_column {
        let mut intercept_row = vec![0; num_params];
        intercept_row[intercept_col] = 1;
        matrix_rows_data.push(intercept_row);
    }

    // Add rows for each estimable parameter based on term_column_indices
    // This creates a row for each individual parameter column in X.
    // Sorting term names for consistent output order
    let mut sorted_terms: Vec<_> = design_info.term_column_indices.keys().cloned().collect();
    sorted_terms.sort();

    for term_name in sorted_terms {
        if let Some((start_col, end_col)) = design_info.term_column_indices.get(&term_name) {
            if term_name == "Intercept" {
                continue;
            } // Already handled

            for col_idx in *start_col..=*end_col {
                if col_idx < num_params {
                    // Ensure column index is within bounds
                    let mut param_row = vec![0; num_params];
                    param_row[col_idx] = 1;
                    matrix_rows_data.push(param_row);
                    // println!("GEF row for term: {}, param_col: {}", term_name, col_idx);
                }
            }
        }
    }

    // The original GEF logic had specific formatting for factor levels.
    // This revised version creates a simpler estimability matrix (L for L*beta).
    // The interpretation of these rows depends on the coding scheme used in X.
    // For (k-1) dummy coding, each row tests one dummy parameter.

    Ok(GeneralEstimableFunction { matrix: matrix_rows_data })
}
