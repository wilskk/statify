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

    // Main effects
    for term_name in &design_info.term_names {
        if term_name == "Intercept" {
            // Intercept
            let mut active = HashMap::new();
            active.insert("Intercept".to_string(), 1);
            let l_vec = matches_construct_l_matrix(&all_row_parameter_names, &active, None, None);
            l_matrix_values.push(l_vec);
            l_labels.push(format!("L{}", l_counter));
            contrast_information.push("Mean (Intercept)".to_string());
            l_counter += 1;
        } else if term_name.contains('*') {
            // Interaction
            let factors = parse_interaction_term(term_name);
            let mut factor_levels = Vec::new();
            for factor in &factors {
                let levels = get_factor_levels(data, factor)?;
                factor_levels.push((factor.clone(), levels));
            }
            let mut level_combinations = Vec::new();
            generate_level_combinations(
                &factor_levels,
                &mut HashMap::new(),
                0,
                &mut level_combinations
            );
            if let Some(reference_combo) = level_combinations.first() {
                for combo in level_combinations.iter().skip(1) {
                    let mut active = HashMap::new();
                    let target_param = factors
                        .iter()
                        .map(|f| format!("[{}={}]", f, combo.get(f).unwrap()))
                        .collect::<Vec<_>>()
                        .join("*");
                    let reference_param = factors
                        .iter()
                        .map(|f| format!("[{}={}]", f, reference_combo.get(f).unwrap()))
                        .collect::<Vec<_>>()
                        .join("*");
                    active.insert(target_param.clone(), -1);
                    active.insert(reference_param.clone(), 1);

                    // Create target and reference level maps for interactions
                    let mut target_levels = HashMap::new();
                    let mut reference_levels = HashMap::new();
                    for factor in &factors {
                        target_levels.insert(factor.clone(), combo.get(factor).unwrap().clone());
                        reference_levels.insert(
                            factor.clone(),
                            reference_combo.get(factor).unwrap().clone()
                        );
                    }

                    let l_vec = matches_construct_l_matrix(
                        &all_row_parameter_names,
                        &active,
                        Some(&target_levels),
                        Some(&reference_levels)
                    );
                    l_matrix_values.push(l_vec);
                    l_labels.push(format!("L{}", l_counter));
                    contrast_information.push(
                        format!("{}: {} vs {}", term_name, target_param, reference_param)
                    );
                    l_counter += 1;
                }
            }
        } else if !term_name.contains('*') {
            // Main effect
            if let Ok(levels) = get_factor_levels(data, term_name) {
                if levels.len() > 1 {
                    let reference_level = &levels[0];
                    for level in levels.iter().skip(1) {
                        let mut active = HashMap::new();
                        active.insert(format!("[{}={}]", term_name, level), -1);
                        active.insert(format!("[{}={}]", term_name, reference_level), 1);

                        // Create target and reference level maps
                        let mut target_levels = HashMap::new();
                        target_levels.insert(term_name.clone(), level.clone());
                        let mut reference_levels = HashMap::new();
                        reference_levels.insert(term_name.clone(), reference_level.clone());

                        let l_vec = matches_construct_l_matrix(
                            &all_row_parameter_names,
                            &active,
                            Some(&target_levels),
                            Some(&reference_levels)
                        );
                        l_matrix_values.push(l_vec);
                        l_labels.push(format!("L{}", l_counter));
                        contrast_information.push(
                            format!(
                                "{}: [{}={}] vs [{}={}]",
                                term_name,
                                term_name,
                                level,
                                term_name,
                                reference_level
                            )
                        );
                        l_counter += 1;
                    }
                }
            }
        }
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
