use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ GeneralEstimableFunction, GeneralEstimableFunctionEntry },
};
use std::collections::BTreeSet;

use super::core::*;

/// Calculate general estimable functions.
/// This table shows, for each parameter in the model, its estimate, standard error,
/// t-test, confidence interval, and related statistics.
/// Redundant parameters are set to zero.
pub fn calculate_general_estimable_function(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<GeneralEstimableFunction, String> {
    let design_info = create_design_response_weights(data, config)?;

    if design_info.n_samples == 0 || (design_info.p_parameters == 0 && !config.model.intercept) {
        return Ok(GeneralEstimableFunction {
            estimable_function: GeneralEstimableFunctionEntry {
                parameter: Vec::new(),
                l_label: Vec::new(),
                l_matrix: Vec::new(),
            },
            notes: vec!["No data or no parameters in the model.".to_string()],
        });
    }

    // Get all row parameter names and L labels
    let all_row_parameter_names = generate_all_row_parameter_names_sorted(&design_info, data)?;
    let l_labels = generate_l_labels(&design_info);

    // L-MATRIX POPULATION
    let mut l_matrix_values: Vec<Vec<i32>> = Vec::new();
    for row_param_str in &all_row_parameter_names {
        let mut current_row_coeffs: Vec<i32> = vec![0; l_labels.len()]; // Initialize with zeros
        let parsed_row_param_map = parse_parameter_name(row_param_str, &design_info);

        for (l_col_idx, _l_col_label_str) in l_labels.iter().enumerate() {
            if l_col_idx >= design_info.term_names.len() {
                continue;
            }
            let defining_beta_param_str = &design_info.term_names[l_col_idx];
            let parsed_defining_beta_map = parse_parameter_name(
                defining_beta_param_str,
                &design_info
            );

            let mut cell_coeff = 0;
            if row_param_str.as_str() == defining_beta_param_str.as_str() {
                cell_coeff = 1;
            } else {
                // Check if the row parameter represents a reference level for the defining_beta_param
                let row_factors = parsed_row_param_map.keys().cloned().collect::<BTreeSet<_>>();
                let defining_factors = parsed_defining_beta_map
                    .keys()
                    .cloned()
                    .collect::<BTreeSet<_>>();

                if
                    row_factors == defining_factors &&
                    !parsed_row_param_map.contains_key("Intercept")
                {
                    // Must be same term type
                    let mut term_contribution = 1;

                    for factor_name_key in defining_factors {
                        let level_in_row = parsed_row_param_map.get(&factor_name_key).unwrap();
                        let level_in_defining = parsed_defining_beta_map
                            .get(&factor_name_key)
                            .unwrap();

                        if
                            config.main.covar
                                .as_ref()
                                .map_or(false, |cv| cv.contains(&factor_name_key))
                        {
                            if level_in_row != level_in_defining {
                                term_contribution = 0;
                                break;
                            }
                        } else {
                            // It's a fixed factor
                            if level_in_row == level_in_defining {
                                // No change, it's the non-reference level of the beta param
                            } else {
                                term_contribution = 0; // Different level
                                break;
                            }
                        }
                    }
                    cell_coeff = term_contribution;
                }
            }
            current_row_coeffs[l_col_idx] = cell_coeff;
        }
        l_matrix_values.push(current_row_coeffs);
    }

    let mut notes = Vec::new();
    let design_note_string = generate_design_string(&design_info);
    notes.push(format!("a. Design: {}", design_note_string));

    let mut note_letter = 'b';

    // Get redundancy info from parameter_estimates
    let param_estimates = calculate_parameter_estimates(data, config)?;
    let is_redundant_vec: Vec<bool> = param_estimates.estimates
        .iter()
        .map(|e| e.is_redundant)
        .collect();

    // Filter l_matrix and generate l_labels for non-redundant parameters
    let mut filtered_l_matrix = Vec::new();
    let mut filtered_l_labels = Vec::new();
    let mut l_label_counter = 1;
    for (i, l_row) in l_matrix_values.iter().enumerate() {
        if i < is_redundant_vec.len() && !is_redundant_vec[i] {
            filtered_l_matrix.push(l_row.clone());
            filtered_l_labels.push(format!("L{}", l_label_counter));
            l_label_counter += 1;
        }
    }

    let any_beta_param_redundant = is_redundant_vec.iter().any(|&x| x);

    if any_beta_param_redundant {
        notes.push(
            format!("{}. One or more parameters in the model design may be redundant.", note_letter)
        );
        note_letter = ((note_letter as u8) + 1) as char;
    }

    let n_samples = design_info.n_samples;
    let r_x_rank = design_info.r_x_rank;
    let df_error_val = if n_samples > r_x_rank { (n_samples - r_x_rank) as f64 } else { 0.0 };
    if df_error_val == 0.0 && design_info.p_parameters > 0 {
        notes.push(format!("{}. Degrees of freedom for error are 0.", note_letter));
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
