use std::collections::{ HashMap, HashSet, BTreeMap };
use itertools::Itertools;
use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ DesignMatrixInfo, GeneralEstimableFunction, GeneralEstimableFunctionEntry },
};

use super::core::*;

// Helper to get coefficients for a specific cell mean
fn get_coeffs_for_cell_mean(
    cell_levels: &HashMap<String, String>,
    all_model_param_names: &[String],
    _factor_details: &HashMap<String, FactorDetail> // Factor details might still be needed for other logic if any
) -> Vec<i32> {
    let mut coeffs = vec![0; all_model_param_names.len()];

    for (i, model_param_name) in all_model_param_names.iter().enumerate() {
        if model_param_name == "Intercept" {
            coeffs[i] = 1;
            continue;
        }

        let param_factor_levels = parse_parameter_name(model_param_name);

        if param_factor_levels.get("Intercept").is_some() {
            continue;
        }
        if param_factor_levels.is_empty() {
            continue;
        }

        let mut parameter_contributes_to_cell = true;
        for (p_factor, p_level) in &param_factor_levels {
            match cell_levels.get(p_factor) {
                Some(cell_level_for_this_factor) if cell_level_for_this_factor == p_level => {}
                _ => {
                    parameter_contributes_to_cell = false;
                    break;
                }
            }
        }

        if parameter_contributes_to_cell {
            coeffs[i] = 1;
        }
    }
    coeffs
}

// Structure to hold factor details
#[derive(Debug, Clone)]
struct FactorDetail {
    name: String,
    levels: Vec<String>,
    reference_level: String, // First level after sorting
    pivot_level: String, // Last level after sorting
}

// Helper to generate mu notation string from cell levels and ordered factors
fn generate_mu_notation(
    cell_levels: &HashMap<String, String>,
    ordered_factors: &[String]
) -> String {
    // Create a BTreeMap for ordered iteration needed for mu_notation consistency
    let ordered_cell_levels: BTreeMap<_, _> = cell_levels.iter().collect();

    let mut notation = "μ".to_string();
    for factor_name in ordered_factors {
        if let Some(level) = ordered_cell_levels.get(factor_name) {
            notation.push_str(
                &level
                    .chars()
                    .next()
                    .map(|c| c.to_string())
                    .unwrap_or_else(|| "_".to_string())
            );
        } else {
            notation.push('_'); // Fallback if a factor in ordered_factors is not in cell_levels
        }
    }
    notation
}

/// Calculate general estimable functions.
/// This table shows, for each non-redundant parameter in the model, a linear combination
/// (L-vector) that estimates it, potentially as a contrast against a reference level.
pub fn calculate_general_estimable_function(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<GeneralEstimableFunction, String> {
    // Starting calculate_general_estimable_function

    let design_info: DesignMatrixInfo = create_design_response_weights(data, config)?;

    if design_info.n_samples == 0 || design_info.p_parameters == 0 {
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

    let all_model_param_names = generate_all_row_parameter_names_sorted(&design_info, data)?;

    if all_model_param_names.is_empty() {
        return Ok(GeneralEstimableFunction {
            estimable_function: GeneralEstimableFunctionEntry {
                parameter: Vec::new(),
                l_label: Vec::new(),
                l_matrix: Vec::new(),
                contrast_information: Vec::new(),
            },
            notes: vec![
                "No parameters in the model (after parameter name generation).".to_string()
            ],
        });
    }

    let param_estimates_result = calculate_parameter_estimates(data, config)?;
    let is_redundant_vec: Vec<bool> = param_estimates_result.estimates
        .iter()
        .map(|e| e.is_redundant)
        .collect();

    let mut factor_details: HashMap<String, FactorDetail> = HashMap::new();
    let mut all_factors_ordered: Vec<String> = Vec::new();

    let covariate_names_set: HashSet<String> = config.main.covar
        .as_ref()
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .collect();

    for param_name in &all_model_param_names {
        if param_name == "Intercept" {
            continue;
        }
        let parsed_param_components = parse_parameter_name(param_name);
        for (param_component_name, level) in parsed_param_components {
            if param_component_name == "Intercept" {
                // Should not happen if outer param_name is not "Intercept"
                continue;
            }
            // If this component is a known covariate, skip adding it to factor_details
            // It should not be treated as a factor for GEF contrast construction.
            if covariate_names_set.contains(&param_component_name) {
                continue;
            }

            let entry = factor_details.entry(param_component_name.clone()).or_insert_with(|| {
                if !all_factors_ordered.contains(&param_component_name) {
                    all_factors_ordered.push(param_component_name.clone());
                }
                FactorDetail {
                    name: param_component_name.clone(),
                    levels: Vec::new(),
                    reference_level: String::new(),
                    pivot_level: String::new(),
                }
            });
            if !entry.levels.contains(&level) {
                entry.levels.push(level.clone());
            }
        }
    }

    for detail in factor_details.values_mut() {
        detail.levels.sort();
        if let Some(first_level) = detail.levels.first() {
            detail.reference_level = first_level.clone();
        }
        if let Some(last_level) = detail.levels.last() {
            detail.pivot_level = last_level.clone();
        } else {
            return Err(format!("Factor {} has no levels to determine a pivot level.", detail.name));
        }
    }

    // --- Determine Effective Base All Pivot Levels using Descriptive Stats ---
    let base_all_pivot_levels: HashMap<String, String> = all_factors_ordered
        .iter()
        .filter_map(|fname|
            factor_details.get(fname).map(|d| (fname.clone(), d.pivot_level.clone()))
        )
        .collect();

    // Base_all_pivot_levels (standard definition): {:?}
    // --- End Determine Effective Base All Pivot Levels ---

    let mut collected_l_functions: Vec<(usize, String, Vec<i32>, String)> = Vec::new();
    let mut encountered_l_vectors: HashSet<Vec<i32>> = HashSet::new();

    let mut add_to_collection_if_valid = |
        l_vec: Vec<i32>,
        description: String,
        expected_l_number: usize,
        expected_l_label: String
    | {
        if l_vec.iter().all(|&x| x == 0) || !encountered_l_vectors.insert(l_vec.clone()) {
            // L-vector for '{}' ({}) is all zero or duplicate. Skipping.
            return;
        }
        collected_l_functions.push((expected_l_number, expected_l_label, l_vec, description));
    };

    // --- Generate L-vectors for model parameters ---
    // The L-vector for the Intercept IS the vector for the mean of the all-pivot-levels cell.
    // For other effects, the L-vector is a contrast relative to the pivot level(s).
    if let Some(k) = all_model_param_names.iter().position(|p| p == "Intercept") {
        if !is_redundant_vec[k] {
            let l_vec_intercept = get_coeffs_for_cell_mean(
                &base_all_pivot_levels,
                &all_model_param_names,
                &factor_details
            );
            let mu_notation = generate_mu_notation(&base_all_pivot_levels, &all_factors_ordered);
            let desc = format!("Mean of all-pivot cell {}", mu_notation);
            add_to_collection_if_valid(l_vec_intercept, desc, k + 1, format!("L{}", k + 1));
        }
    }

    for (k, param_name) in all_model_param_names.iter().enumerate() {
        if param_name == "Intercept" || is_redundant_vec[k] {
            continue; // Skip intercept (handled) and redundant params
        }

        let l_num = k + 1;
        let l_label_str = format!("L{}", l_num);

        if covariate_names_set.contains(param_name) {
            let mut l_vec_covariate = vec![0i32; all_model_param_names.len()];
            l_vec_covariate[k] = 1;
            let description = format!("Covariate: {}", param_name);
            add_to_collection_if_valid(l_vec_covariate, description, l_num, l_label_str);
        }
    }

    // Main Effects
    for factor_of_interest_name in &all_factors_ordered {
        if let Some(detail_factor_of_interest) = factor_details.get(factor_of_interest_name) {
            let pivot_level_for_factor_of_interest = &detail_factor_of_interest.pivot_level;
            for non_pivot_level in detail_factor_of_interest.levels
                .iter()
                .filter(|l| *l != pivot_level_for_factor_of_interest) {
                let param_to_find = format!("[{}={}]", factor_of_interest_name, non_pivot_level);
                if let Some(k) = all_model_param_names.iter().position(|p| p == &param_to_find) {
                    if is_redundant_vec[k] {
                        continue;
                    }

                    let mut cell_a_levels = base_all_pivot_levels.clone();
                    cell_a_levels.insert(factor_of_interest_name.clone(), non_pivot_level.clone());
                    let cell_b_levels = base_all_pivot_levels.clone();

                    let coeffs_a = get_coeffs_for_cell_mean(
                        &cell_a_levels,
                        &all_model_param_names,
                        &factor_details
                    );
                    let coeffs_b = get_coeffs_for_cell_mean(
                        &cell_b_levels,
                        &all_model_param_names,
                        &factor_details
                    );

                    let l_vec_sme: Vec<i32> = coeffs_a
                        .iter()
                        .zip(coeffs_b.iter())
                        .map(|(a, b)| a - b)
                        .collect();

                    let mu_a_notation = generate_mu_notation(&cell_a_levels, &all_factors_ordered);
                    let mu_b_notation = generate_mu_notation(&cell_b_levels, &all_factors_ordered);
                    let desc = format!(
                        "Main Effect {}({} vs {} | Others at Pivot): {} - {}",
                        factor_of_interest_name,
                        non_pivot_level,
                        pivot_level_for_factor_of_interest,
                        mu_a_notation,
                        mu_b_notation
                    );

                    let l_num = k + 1;
                    let l_label_str = format!("L{}", l_num);
                    add_to_collection_if_valid(l_vec_sme, desc, l_num, l_label_str);
                }
            }
        }
    }

    // N-way Interactions
    for k_interaction_way in 2..=all_factors_ordered.len() {
        for interacting_factors_names_tuple in all_factors_ordered
            .iter()
            .cloned()
            .combinations(k_interaction_way) {
            let mut base_levels_for_interaction_context = base_all_pivot_levels.clone();
            for f_name_interacting in &interacting_factors_names_tuple {
                base_levels_for_interaction_context.remove(f_name_interacting);
            }

            let mut level_choices_for_each_interacting_factor: Vec<Vec<String>> = Vec::new();
            let mut possible_interaction_levels = true;
            for factor_name_in_interaction in &interacting_factors_names_tuple {
                if let Some(detail) = factor_details.get(factor_name_in_interaction) {
                    let non_pivot_levels = detail.levels
                        .iter()
                        .filter(|l| *l != &detail.pivot_level)
                        .cloned()
                        .collect::<Vec<_>>();
                    if non_pivot_levels.is_empty() {
                        possible_interaction_levels = false;
                        break;
                    }
                    level_choices_for_each_interacting_factor.push(non_pivot_levels);
                } else {
                    possible_interaction_levels = false;
                    break;
                }
            }
            if
                !possible_interaction_levels ||
                level_choices_for_each_interacting_factor.len() != k_interaction_way
            {
                continue;
            }

            for specific_non_pivot_levels_for_interaction_instance in level_choices_for_each_interacting_factor
                .into_iter()
                .multi_cartesian_product() {
                let param_name_parts: Vec<String> = interacting_factors_names_tuple
                    .iter()
                    .zip(specific_non_pivot_levels_for_interaction_instance.iter())
                    .map(|(factor_name, level)| format!("[{}={}]", factor_name, level))
                    .collect();
                let param_to_find = param_name_parts.join("*");

                if let Some(k) = all_model_param_names.iter().position(|p| p == &param_to_find) {
                    if is_redundant_vec[k] {
                        continue;
                    }

                    let mut l_vec_interaction = vec![0i32; all_model_param_names.len()];
                    let mut contrast_description_terms: Vec<String> = Vec::new();

                    let interaction_levels_desc_parts: Vec<String> = interacting_factors_names_tuple
                        .iter()
                        .zip(specific_non_pivot_levels_for_interaction_instance.iter())
                        .map(|(f_name, non_pivot_level)| {
                            format!(
                                "{} ({} vs {})",
                                f_name,
                                non_pivot_level,
                                factor_details.get(f_name.as_str()).unwrap().pivot_level
                            )
                        })
                        .collect();
                    let full_desc_prefix = format!(
                        "Interaction {} | Non-involved at Pivot",
                        interaction_levels_desc_parts.join(", ")
                    );

                    for i_term_construction in 0..1 << k_interaction_way {
                        let mut current_cell_levels_map =
                            base_levels_for_interaction_context.clone();
                        let mut num_pivot_levels_for_interacting_factors_in_this_term = 0;
                        for (
                            idx_in_interaction,
                            interacting_factor_name,
                        ) in interacting_factors_names_tuple.iter().enumerate() {
                            let factor_detail_for_interacting = factor_details
                                .get(interacting_factor_name)
                                .unwrap();
                            let level_for_this_interacting_factor_in_term = if
                                ((i_term_construction >> idx_in_interaction) & 1) == 1
                            {
                                &specific_non_pivot_levels_for_interaction_instance[
                                    idx_in_interaction
                                ]
                            } else {
                                num_pivot_levels_for_interacting_factors_in_this_term += 1;
                                &factor_detail_for_interacting.pivot_level
                            };
                            current_cell_levels_map.insert(
                                interacting_factor_name.clone(),
                                level_for_this_interacting_factor_in_term.clone()
                            );
                        }

                        let cell_coeffs = get_coeffs_for_cell_mean(
                            &current_cell_levels_map,
                            &all_model_param_names,
                            &factor_details
                        );
                        let mu_term_notation = generate_mu_notation(
                            &current_cell_levels_map,
                            &all_factors_ordered
                        );

                        let num_non_pivot_levels_for_interacting_factors_in_this_term =
                            k_interaction_way -
                            num_pivot_levels_for_interacting_factors_in_this_term;
                        let sign = if
                            num_non_pivot_levels_for_interacting_factors_in_this_term % 2 == 0
                        {
                            1i32
                        } else {
                            -1i32
                        };

                        if !cell_coeffs.iter().all(|&c| c == 0) {
                            if sign == 1 {
                                contrast_description_terms.push(format!("+{}", mu_term_notation));
                            } else {
                                contrast_description_terms.push(format!("-{}", mu_term_notation));
                            }
                            for (j_coeff_idx, coeff_val) in cell_coeffs.iter().enumerate() {
                                l_vec_interaction[j_coeff_idx] += sign * coeff_val;
                            }
                        }
                    }
                    contrast_description_terms.sort_by_key(|k| k.starts_with('-'));

                    let l_num = k + 1;
                    let l_label_str = format!("L{}", l_num);
                    add_to_collection_if_valid(
                        l_vec_interaction,
                        format!("{}: {}", full_desc_prefix, contrast_description_terms.join(" ")),
                        l_num,
                        l_label_str
                    );
                }
            }
        }
    }

    let mut l_labels: Vec<String> = Vec::new();
    let mut l_matrix_rows: Vec<Vec<i32>> = Vec::new();
    let mut contrast_info_strings: Vec<String> = Vec::new();

    collected_l_functions.sort_by_key(|k| k.0);
    for (_l_num, l_label_str, l_vec_coeffs, desc_str) in collected_l_functions {
        l_labels.push(l_label_str);
        l_matrix_rows.push(l_vec_coeffs);
        contrast_info_strings.push(desc_str);
    }

    let mut notes = Vec::new();
    notes.push(format!("a. Design: {}", generate_design_string(&design_info)));
    if is_redundant_vec.iter().any(|&x| x) {
        notes.push(
            "b. One or more β parameters may be redundant (i.e., non-estimable due to data structure).".to_string()
        );
    }
    notes.push(
        "c. Reference levels are first alphabetically/numerically; Pivot levels are last alphabetically/numerically for each factor.".to_string()
    );
    notes.push(
        format!(
            "e. Factor processing order for effects based on first appearance in parameters: {:?}",
            all_factors_ordered
        )
    );
    notes.push(format!("f. Total unique, non-zero, L-vectors generated: {}", l_matrix_rows.len()));

    let estimable_function_entry = GeneralEstimableFunctionEntry {
        parameter: all_model_param_names.clone(),
        l_label: l_labels,
        l_matrix: l_matrix_rows,
        contrast_information: contrast_info_strings,
    };

    // Finished calculate_general_estimable_function. Generated {} L-functions.
    Ok(GeneralEstimableFunction {
        estimable_function: estimable_function_entry,
        notes,
    })
}
