use std::collections::HashMap;
use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ DesignMatrixInfo, GeneralEstimableFunction, GeneralEstimableFunctionEntry },
};

use super::core::*;

/// Calculate general estimable functions.
/// This table shows, for each non-redundant parameter in the model, a linear combination
/// (L-vector) that estimates it, potentially as a contrast against a reference level.
pub fn calculate_general_estimable_function(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<GeneralEstimableFunction, String> {
    // create_design_response_weights should now return DesignMatrixInfo
    let design_info: DesignMatrixInfo = create_design_response_weights(data, config)?;

    if
        design_info.n_samples == 0 ||
        (design_info.p_parameters == 0 &&
            design_info.intercept_column.is_none() &&
            !config.model.intercept)
    {
        // Adjusted condition slightly if p_parameters might include intercept implicitly
        return Ok(GeneralEstimableFunction {
            estimable_function: GeneralEstimableFunctionEntry {
                parameter: Vec::new(),
                l_label: Vec::new(),
                l_matrix: Vec::new(),
            },
            notes: vec!["No data or no parameters in the model.".to_string()],
        });
    }

    // `all_row_parameter_names` are the names of the model parameters (β).
    // These correspond to the columns of the design matrix X and the L-matrix.
    // Their order must match the columns of design_info.x.
    let all_row_parameter_names = generate_all_row_parameter_names_sorted(&design_info, data)?;
    if all_row_parameter_names.is_empty() {
        // Simplified check, as p_parameters should reflect this
        return Ok(GeneralEstimableFunction {
            estimable_function: GeneralEstimableFunctionEntry {
                parameter: Vec::new(),
                l_label: Vec::new(),
                l_matrix: Vec::new(),
            },
            notes: vec!["No parameters in the model.".to_string()],
        });
    }

    // Get redundancy info from parameter_estimates
    // `param_estimates.estimates` must align with `all_row_parameter_names` by index.
    let param_estimates_result = calculate_parameter_estimates(data, config)?; // Pass design_info if needed
    let is_redundant_vec: Vec<bool> = param_estimates_result.estimates
        .iter()
        .map(|e| e.is_redundant)
        .collect();

    if is_redundant_vec.len() != all_row_parameter_names.len() {
        return Err(
            format!(
                "Mismatch between parameter names ({}) and redundancy information ({}). Ensure alignment. Parameter names: {:?}, Redundancy count: {}",
                all_row_parameter_names.len(),
                is_redundant_vec.len(),
                all_row_parameter_names,
                is_redundant_vec.len()
            )
        );
    }

    // --- Build Term-to-Reference-Parameter Map ---
    let mut term_to_ref_param_name: HashMap<String, String> = HashMap::new();

    // Helper to find the reference parameter for a given term.
    // A term (e.g., "age", "treatment") maps to a range of columns in the design matrix.
    // The parameters for this term are the names in `all_row_parameter_names` at these column indices.
    let find_ref_param_for_term = |
        term_key: &String,
        design_matrix_info: &DesignMatrixInfo,
        all_params: &Vec<String>, // These are all_row_parameter_names
        redundancy_flags: &Vec<bool>
    | -> Option<String> {
        if let Some(&(start_col, end_col)) = design_matrix_info.term_column_indices.get(term_key) {
            // Collect parameter names and their original indices for this term
            let mut term_params_with_indices: Vec<(String, usize)> = (start_col..end_col) // Assuming end_col is exclusive
                .filter_map(|col_idx| {
                    if col_idx < all_params.len() {
                        Some((all_params[col_idx].clone(), col_idx))
                    } else {
                        None // Should not happen if column indices are valid
                    }
                })
                .collect();

            // Sort parameters alphabetically by name to get a consistent "first"
            term_params_with_indices.sort_by(|a, b| a.0.cmp(&b.0));

            // Prefer the first non-redundant parameter (based on sorted name)
            for (p_name, original_idx) in &term_params_with_indices {
                if *original_idx < redundancy_flags.len() && !redundancy_flags[*original_idx] {
                    return Some(p_name.clone());
                }
            }
            // If all parameters for this term are redundant, pick the first one (alphabetically)
            // as a structural reference. Its L-vector might be filtered out later if it's redundant.
            if !term_params_with_indices.is_empty() {
                return Some(term_params_with_indices[0].0.clone());
            }
        }
        None
    };

    // Populate for terms listed in design_info.term_names.
    // design_info.term_names should not include "Intercept" if it's handled by intercept_column.
    // Or, if "Intercept" is a term, this loop should handle it or filter it out if needed.
    // Typically, "Intercept" doesn't have a "reference parameter" in the same way.
    for term_name in &design_info.term_names {
        if term_name == "Intercept" && design_info.intercept_column.is_some() {
            // Skip if intercept is handled separately
            continue;
        }
        if
            let Some(ref_param) = find_ref_param_for_term(
                term_name,
                &design_info,
                &all_row_parameter_names,
                &is_redundant_vec
            )
        {
            term_to_ref_param_name.insert(term_name.clone(), ref_param);
        }
    }

    // --- L-MATRIX POPULATION ---
    let mut l_matrix_values: Vec<Vec<i32>> =
        vec![vec![0; all_row_parameter_names.len()]; all_row_parameter_names.len()];

    let param_name_to_col_idx: HashMap<String, usize> = all_row_parameter_names
        .iter()
        .enumerate()
        .map(|(i, name)| (name.clone(), i))
        .collect();

    for (current_param_idx, current_param_name) in all_row_parameter_names.iter().enumerate() {
        // current_param_idx is the row index in l_matrix_values we are populating,
        // and also the column index in the design matrix for current_param_name.

        if let Some(current_param_col_in_l) = param_name_to_col_idx.get(current_param_name) {
            l_matrix_values[current_param_idx][*current_param_col_in_l] = 1;
        } else {
            continue;
        }

        // Check if this parameter is the intercept
        let is_intercept_param = design_info.intercept_column.map_or(
            false,
            |ic_idx| ic_idx == current_param_idx
        );
        if is_intercept_param || current_param_name == "Intercept" {
            // Double check by name for safety
            // Intercept is estimated directly. Default assignment (1 at its own column) is correct.
        } else {
            // Determine the "owning term" for current_param_name.
            let mut owning_term_key: Option<String> = None;
            for (term_key, &(start_col, end_col)) in &design_info.term_column_indices {
                if current_param_idx >= start_col && current_param_idx < end_col {
                    // current_param_idx is its column index
                    owning_term_key = Some(term_key.clone());
                    break;
                }
            }

            if let Some(term_key) = owning_term_key {
                if let Some(ref_param_for_term) = term_to_ref_param_name.get(&term_key) {
                    if current_param_name != ref_param_for_term {
                        if
                            let Some(ref_param_col_in_l) =
                                param_name_to_col_idx.get(ref_param_for_term)
                        {
                            if *ref_param_col_in_l != current_param_idx {
                                // Ensure not same parameter
                                l_matrix_values[current_param_idx][*ref_param_col_in_l] = -1;
                            }
                        }
                    }
                }
            }
        }
    }

    // --- Filter L-matrix rows based on parameter redundancy ---
    let mut filtered_l_matrix: Vec<Vec<i32>> = Vec::new();
    let mut filtered_l_labels: Vec<String> = Vec::new();

    for (param_idx, l_row_candidate) in l_matrix_values.iter().enumerate() {
        // The L-vector at l_matrix_values[param_idx] was constructed "for" all_row_parameter_names[param_idx].
        // Only include it if that parameter is not redundant.
        if param_idx < is_redundant_vec.len() && !is_redundant_vec[param_idx] {
            filtered_l_matrix.push(l_row_candidate.clone());
            filtered_l_labels.push(format!("L{}", param_idx + 1));
        }
    }

    // --- Prepare Notes ---
    let mut notes = Vec::new();
    let design_note_string = generate_design_string(&design_info);
    notes.push(format!("a. Design: {}", design_note_string));

    let any_beta_param_redundant = is_redundant_vec.iter().any(|&x| x);
    if any_beta_param_redundant {
        notes.push(
            format!(
                "b. One or more parameters in the model design may be redundant. L-functions are provided for non-redundant parameters."
            )
        );
    }

    let estimable_function_entry = GeneralEstimableFunctionEntry {
        parameter: all_row_parameter_names,
        l_label: filtered_l_labels,
        l_matrix: filtered_l_matrix,
    };

    Ok(GeneralEstimableFunction {
        estimable_function: estimable_function_entry,
        notes,
    })
}
