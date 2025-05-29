use std::collections::HashMap;
use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ DesignMatrixInfo, GeneralEstimableFunction, GeneralEstimableFunctionEntry },
};
use web_sys::console;

use super::core::*;

/// Calculate general estimable functions.
/// This table shows, for each non-redundant parameter in the model, a linear combination
/// (L-vector) that estimates it, potentially as a contrast against a reference level.
pub fn calculate_general_estimable_function(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<GeneralEstimableFunction, String> {
    console::log_1(&"Starting calculate_general_estimable_function".into());

    // Create design matrix info
    let design_info: DesignMatrixInfo = create_design_response_weights(data, config)?;

    if design_info.n_samples == 0 || design_info.p_parameters == 0 {
        console::log_1(&"No data or no parameters in the model".into());
        return Ok(GeneralEstimableFunction {
            estimable_function: GeneralEstimableFunctionEntry {
                parameter: Vec::new(),
                l_label: Vec::new(),
                l_matrix: Vec::new(),
                contrast_information: Vec::new(),
            },
            notes: vec!["No data or no parameters in the model.".to_string()],
        });
    }

    // Get all parameter names
    let all_row_parameter_names = generate_all_row_parameter_names_sorted(&design_info, data)?;

    if all_row_parameter_names.is_empty() {
        return Ok(GeneralEstimableFunction {
            estimable_function: GeneralEstimableFunctionEntry {
                parameter: Vec::new(),
                l_label: Vec::new(),
                l_matrix: Vec::new(),
                contrast_information: Vec::new(),
            },
            notes: vec!["No parameters in the model.".to_string()],
        });
    }

    // Get redundancy info
    let param_estimates_result = calculate_parameter_estimates(data, config)?;
    let is_redundant_vec: Vec<bool> = param_estimates_result.estimates
        .iter()
        .map(|e| e.is_redundant)
        .collect();

    // Build L-matrix - parameter-based
    let mut l_matrix_values: Vec<Vec<i32>> = Vec::new();
    let mut l_labels: Vec<String> = Vec::new();
    let mut l_counter = 1;
    let mut contrast_information: Vec<String> = Vec::new();

    // Get all unique factor names and their positions
    let mut factor_positions: HashMap<String, usize> = HashMap::new();
    let mut pos = 0;
    for param in &all_row_parameter_names {
        if param == "Intercept" {
            continue;
        }
        for part in param.split('*') {
            let (factor, _) = part
                .trim_matches(|c| (c == '[' || c == ']'))
                .split_once('=')
                .unwrap();
            if !factor_positions.contains_key(factor) {
                factor_positions.insert(factor.to_string(), pos);
                pos += 1;
            }
        }
    }

    // Process each parameter
    for param in &all_row_parameter_names {
        let mut active = HashMap::new();
        let mut mu_parts = vec!['_'; factor_positions.len()];

        if param == "Intercept" {
            // Intercept
            active.insert("Intercept".to_string(), 1);

            // Find all main factors (those without *)
            let main_factors: Vec<String> = all_row_parameter_names
                .iter()
                .filter(|p| !p.contains('*') && *p != "Intercept")
                .cloned()
                .collect();

            // Group main factors by their base name and take the last level
            let mut factor_groups: HashMap<String, Vec<String>> = HashMap::new();
            for param in &main_factors {
                if let Some((factor, _)) = param.split_once('=') {
                    let factor = factor.trim_matches(|c| c == '[');
                    factor_groups
                        .entry(factor.to_string())
                        .or_insert_with(Vec::new)
                        .push(param.clone());
                }
            }

            // For each group, take the last level and add to active params
            for (_, levels) in factor_groups {
                if let Some(last_level) = levels.last() {
                    active.insert(last_level.clone(), 1);
                }
            }

            contrast_information.push(format!("μ{}", "_".repeat(factor_positions.len())));
        } else {
            // Parse parameter into its components
            let parts: Vec<(String, String)> = param
                .split('*')
                .map(|s| {
                    let s = s.trim_matches(|c| (c == '[' || c == ']'));
                    let (factor, level) = s.split_once('=').unwrap();
                    (factor.to_string(), level.to_string())
                })
                .collect();

            // Set mu notation parts
            for (factor, level) in &parts {
                if let Some(&pos) = factor_positions.get(factor) {
                    mu_parts[pos] = level.chars().next().unwrap();
                }
            }

            // Set active params
            active.insert(param.clone(), -1);

            // Find reference parameter (first level of first factor)
            if let Some((first_factor, _)) = parts.first() {
                if let Some(&first_pos) = factor_positions.get(first_factor) {
                    let mut reference_parts = parts.clone();
                    if
                        let Some(first_level) = all_row_parameter_names
                            .iter()
                            .find(|p| p.starts_with(&format!("[{}=", first_factor)))
                    {
                        let (_, level) = first_level
                            .trim_matches(|c| (c == '[' || c == ']'))
                            .split_once('=')
                            .unwrap();
                        reference_parts[0] = (first_factor.clone(), level.to_string());
                        let reference_param = reference_parts
                            .iter()
                            .map(|(f, l)| format!("[{}={}]", f, l))
                            .collect::<Vec<_>>()
                            .join("*");
                        active.insert(reference_param, 1);
                    }
                }
            }

            contrast_information.push(format!("μ{}", mu_parts.iter().collect::<String>()));
        }

        let l_vec = matches_construct_l_matrix(&all_row_parameter_names, &active);
        l_matrix_values.push(l_vec);
        l_labels.push(format!("L{}", l_counter));
        l_counter += 1;
    }

    console::log_1(&format!("L-matrix values: {:?}", l_matrix_values).into());

    // Filtering: hanya L untuk parameter yang tidak redundant
    let mut filtered_l_matrix_values: Vec<Vec<i32>> = Vec::new();
    let mut filtered_l_labels: Vec<String> = Vec::new();
    for (i, l_vec) in l_matrix_values.iter().enumerate() {
        // Hanya masukkan jika parameter ke-i tidak redundant
        if i < is_redundant_vec.len() && !is_redundant_vec[i] {
            filtered_l_matrix_values.push(l_vec.clone());
            filtered_l_labels.push(l_labels[i].clone());
        }
    }

    // Prepare notes
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
        l_matrix: filtered_l_matrix_values,
        contrast_information,
    };

    console::log_1(&"Finished calculating general estimable function".into());
    Ok(GeneralEstimableFunction {
        estimable_function: estimable_function_entry,
        notes,
    })
}
