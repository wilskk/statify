use std::collections::{ HashMap, HashSet };
use itertools::Itertools;
use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ DesignMatrixInfo, GeneralEstimableFunction, GeneralEstimableFunctionEntry },
};
use crate::univariate::stats::factor_utils::parse_parameter_name;
use web_sys::console;

use super::core::*;

// Helper to get coefficients for a specific cell mean
fn get_coeffs_for_cell_mean(
    cell_levels: &HashMap<String, String>, // Specific level for each factor defining the cell, e.g., {"lowup": "1", "section": "2"}
    all_model_param_names: &[String], // All parameter names in the model (e.g., "Intercept", "[lowup=1]", "[lowup=1]*[section=1]")
    _factor_details: &HashMap<String, FactorDetail> // Changed to HashMap
) -> Vec<i32> {
    let mut coeffs = vec![0; all_model_param_names.len()];

    for (i, model_param_name) in all_model_param_names.iter().enumerate() {
        if model_param_name == "Intercept" {
            coeffs[i] = 1; // Intercept always contributes with a coefficient of 1 to any cell mean.
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

// Helper to generate all combinations of levels for a given list of factor names
fn generate_level_combinations_for_factors(
    factors_to_combine: &[String],
    factor_details: &HashMap<String, FactorDetail> // Changed to HashMap
) -> Vec<HashMap<String, String>> {
    if factors_to_combine.is_empty() {
        return vec![HashMap::new()];
    }
    let mut level_sets: Vec<Vec<(String, String)>> = Vec::new();
    for factor_name in factors_to_combine {
        if let Some(detail) = factor_details.get(factor_name) {
            level_sets.push(
                detail.levels
                    .iter()
                    .map(|l| (factor_name.clone(), l.clone()))
                    .collect()
            );
        } else {
            // This should not happen if factors_to_combine contains valid factor names
            // Consider returning an Err or panicking in debug, for robustness.
            return Vec::new();
        }
    }
    level_sets
        .into_iter()
        .multi_cartesian_product()
        .map(|combo_vec| combo_vec.into_iter().collect::<HashMap<String, String>>())
        .collect()
}

// Helper to generate mu notation string from cell levels and ordered factors
fn generate_mu_notation(
    cell_levels: &HashMap<String, String>,
    ordered_factors: &[String]
) -> String {
    // Create a BTreeMap for ordered iteration needed for mu_notation consistency
    let ordered_cell_levels: std::collections::BTreeMap<_, _> = cell_levels.iter().collect();

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
    console::log_1(&"Starting calculate_general_estimable_function (v8)".into());

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
    web_sys::console::log_1(
        &format!("all_model_param_names (v8): {:?}", all_model_param_names).into()
    );

    if all_model_param_names.is_empty() {
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

    let param_estimates_result = calculate_parameter_estimates(data, config)?;
    let is_redundant_vec: Vec<bool> = param_estimates_result.estimates
        .iter()
        .map(|e| e.is_redundant)
        .collect();

    let mut factor_details: HashMap<String, FactorDetail> = HashMap::new();
    let mut all_factors_ordered: Vec<String> = Vec::new(); // To maintain a consistent order

    // Discover all factors and their levels from the parameter names
    for param_name in &all_model_param_names {
        if param_name == "Intercept" {
            continue;
        }
        let parsed_param_components = parse_parameter_name(param_name);
        for (factor, level) in parsed_param_components {
            if factor == "Intercept" {
                continue;
            } // Should not happen here if first check is done
            let entry = factor_details.entry(factor.clone()).or_insert_with(|| {
                if !all_factors_ordered.contains(&factor) {
                    all_factors_ordered.push(factor.clone());
                }
                FactorDetail {
                    name: factor.clone(),
                    levels: Vec::new(),
                    reference_level: String::new(), // Will be set after all levels are collected
                    pivot_level: String::new(), // Will be set after all levels are collected
                }
            });
            if !entry.levels.contains(&level) {
                entry.levels.push(level.clone());
            }
        }
    }

    // Determine reference levels (e.g., first alphabetically/numerically) and pivot levels (last)
    for detail in factor_details.values_mut() {
        detail.levels.sort(); // Sort levels to ensure consistent first/last
        if let Some(first_level) = detail.levels.first() {
            detail.reference_level = first_level.clone();
        } else {
            return Err(format!("Factor {} has no levels defined.", detail.name));
        }
        if let Some(last_level) = detail.levels.last() {
            detail.pivot_level = last_level.clone();
        } else {
            // This case should be covered by the first_level check, but as a safeguard:
            return Err(format!("Factor {} has no levels to determine a pivot level.", detail.name));
        }
    }
    console::log_1(
        &format!("Factor processing order by appearance (v8): {:?}", all_factors_ordered).into()
    );
    // Log factor details including pivot levels
    for factor_name in &all_factors_ordered {
        if let Some(detail) = factor_details.get(factor_name) {
            console::log_1(
                &format!(
                    "Factor: {}, Levels: {:?}, Ref: {}, Pivot: {}",
                    detail.name,
                    detail.levels,
                    detail.reference_level,
                    detail.pivot_level
                ).into()
            );
        }
    }

    // Base map with all factors at their reference levels
    let base_all_ref_levels: HashMap<String, String> = all_factors_ordered
        .iter()
        .filter_map(|fname|
            factor_details.get(fname).map(|d| (fname.clone(), d.reference_level.clone()))
        )
        .collect();

    // Create a base map with all factors at their PIVOT levels
    let base_all_pivot_levels: HashMap<String, String> = all_factors_ordered
        .iter()
        .filter_map(|fname|
            factor_details.get(fname).map(|d| (fname.clone(), d.pivot_level.clone()))
        )
        .collect();

    let mut l_matrix_rows: Vec<Vec<i32>> = Vec::new();
    let mut l_labels: Vec<String> = Vec::new();
    let mut contrast_info_strings: Vec<String> = Vec::new();

    // Temporary collection for L-functions before sorting
    let mut collected_l_functions: Vec<(usize, String, Vec<i32>, String)> = Vec::new();
    let mut encountered_l_vectors: HashSet<Vec<i32>> = HashSet::new();

    let mut add_to_collection_if_valid = |
        l_vec: Vec<i32>,
        description: String,
        expected_l_number: usize, // param_idx + 1
        expected_l_label: String // "L{param_idx + 1}"
    | {
        if l_vec.iter().all(|&x| x == 0) || !encountered_l_vectors.insert(l_vec.clone()) {
            return; // Not unique or all zero, do nothing
        }
        // We trust the caller to provide the correct l_number and l_label
        collected_l_functions.push((expected_l_number, expected_l_label, l_vec, description));
    };

    // 1. Mean of the All-Reference-Levels Cell
    console::log_1(&"Generating mean of all-reference-levels cell...".into());
    // Change to: Mean of the All-PIVOT-Levels Cell (like user's L1 examples)
    console::log_1(&"Generating mean of all-PIVOT-levels cell (new logic)...".into());
    let l_vec_all_pivot_mean = get_coeffs_for_cell_mean(
        &base_all_pivot_levels,
        &all_model_param_names,
        &factor_details
    );
    let mu_notation_all_pivot = generate_mu_notation(&base_all_pivot_levels, &all_factors_ordered);
    let intercept_param_name = "Intercept".to_string();
    match all_model_param_names.iter().position(|p_name| p_name == &intercept_param_name) {
        Some(k) => {
            let l_num = k + 1;
            let l_label_str = format!("L{}", l_num);
            add_to_collection_if_valid(
                l_vec_all_pivot_mean,
                format!("Mean of pivot cell {}", mu_notation_all_pivot),
                l_num,
                l_label_str
            );
        }
        None => {
            web_sys::console::error_1(
                &"'Intercept' parameter not found in all_model_param_names!".into()
            );
        }
    }

    // 2. Main Effects (k-1 per factor, others at REF)
    console::log_1(
        &"Generating main effects (others at ref)...was, now Simple Main Effects vs Pivot (new logic)".into()
    );
    for factor_of_interest_name in &all_factors_ordered {
        if let Some(detail_factor_of_interest) = factor_details.get(factor_of_interest_name) {
            let pivot_level_for_factor_of_interest = &detail_factor_of_interest.pivot_level;

            for non_pivot_level in detail_factor_of_interest.levels
                .iter()
                .filter(|l| *l != pivot_level_for_factor_of_interest) {
                // Iterate non-pivot levels

                // Cell A: Factor of interest at non_pivot_level, others at their pivot_levels
                let mut cell_a_levels = base_all_pivot_levels.clone();
                cell_a_levels.insert(factor_of_interest_name.clone(), non_pivot_level.clone());

                // Cell B: Factor of interest at its pivot_level, others at their pivot_levels
                let cell_b_levels = base_all_pivot_levels.clone(); // factor_of_interest already at pivot

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
                    .map(|(val_non_pivot, val_pivot)| val_non_pivot - val_pivot)
                    .collect();

                let mu_a_notation = generate_mu_notation(&cell_a_levels, &all_factors_ordered);
                let mu_b_notation = generate_mu_notation(&cell_b_levels, &all_factors_ordered);

                let desc = format!(
                    "Simple Main Effect {}({} vs {} | Others at Pivot): {} - {}",
                    factor_of_interest_name,
                    non_pivot_level,
                    pivot_level_for_factor_of_interest,
                    mu_a_notation,
                    mu_b_notation
                );

                let param_to_find = format!("[{}={}]", factor_of_interest_name, non_pivot_level);
                match all_model_param_names.iter().position(|p_name| p_name == &param_to_find) {
                    Some(k) => {
                        let l_num = k + 1;
                        let l_label_str = format!("L{}", l_num);
                        add_to_collection_if_valid(l_vec_sme, desc, l_num, l_label_str);
                    }
                    None => {
                        web_sys::console::error_1(
                            &format!("Main effect parameter not found: {}", param_to_find).into()
                        );
                    }
                }
            }
        }
    }

    // 3. N-way Interactions (non-involved factors at REF)
    console::log_1(
        &"Generating N-way interactions (non-involved at ref)... was, now non-involved at Pivot (new logic)".into()
    );
    for k_interaction_way in 2..=all_factors_ordered.len() {
        for interacting_factors_names_tuple in all_factors_ordered
            .iter()
            .cloned()
            .combinations(k_interaction_way) {
            // Base for this interaction: non-involved factors at their pivot levels.
            let mut base_levels_for_interaction = base_all_pivot_levels.clone();
            // Remove interacting factors from this base, as their levels will be set in the loop.
            for f_name in &interacting_factors_names_tuple {
                base_levels_for_interaction.remove(f_name);
            }

            let mut level_choices_for_each_interacting_factor: Vec<Vec<String>> = Vec::new();
            let mut possible_interaction_levels = true;
            for factor_name_in_interaction in &interacting_factors_names_tuple {
                if let Some(detail) = factor_details.get(factor_name_in_interaction) {
                    // Levels to choose from for this factor in the interaction term are its NON-PIVOT levels.
                    let non_pivot_levels = detail.levels
                        .iter()
                        .filter(|l| *l != &detail.pivot_level)
                        .cloned()
                        .collect::<Vec<_>>();
                    if non_pivot_levels.is_empty() {
                        // This factor only has one level (which is its pivot level), so no interaction contrast can be formed with it.
                        possible_interaction_levels = false;
                        break;
                    }
                    level_choices_for_each_interacting_factor.push(non_pivot_levels);
                } else {
                    possible_interaction_levels = false; // Should not happen
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
                let mut l_vec_interaction = vec![0i32; all_model_param_names.len()];
                let mut contrast_description_terms: Vec<String> = Vec::new();

                let interaction_term_name_str = interacting_factors_names_tuple.iter().join("*");

                // Description of which non-pivot levels are chosen for this specific interaction L-vector
                let interaction_levels_desc_parts: Vec<String> = interacting_factors_names_tuple
                    .iter()
                    .zip(specific_non_pivot_levels_for_interaction_instance.iter())
                    .map(|(f_name, non_pivot_level)| {
                        let pivot_level = &factor_details.get(f_name.as_str()).unwrap().pivot_level;
                        format!("{} ({} vs {})", f_name, non_pivot_level, pivot_level)
                    })
                    .collect();

                let full_desc_prefix = format!(
                    "Interaction {} | Non-involved at Pivot",
                    interaction_levels_desc_parts.join(", ")
                );

                // Loop to construct the 2^k_interaction_way terms for the interaction contrast
                for i_term_construction in 0..1 << k_interaction_way {
                    // Start with non-involved factors at PIVOT levels
                    let mut current_cell_levels_map: HashMap<
                        String,
                        String
                    > = base_levels_for_interaction.clone();
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
                            // This is the chosen NON-PIVOT level for this factor in this term
                            &specific_non_pivot_levels_for_interaction_instance[idx_in_interaction]
                        } else {
                            // This is the PIVOT level for this factor in this term
                            num_pivot_levels_for_interacting_factors_in_this_term += 1;
                            &factor_detail_for_interacting.pivot_level
                        };
                        current_cell_levels_map.insert(
                            interacting_factor_name.clone(),
                            level_for_this_interacting_factor_in_term.clone()
                        );
                    }

                    // Ensure all factors from all_factors_ordered are present for mu_notation
                    // This might add factors not in base_levels_for_interaction or interacting_factors_names_tuple,
                    // setting them to their pivot levels if not already set.
                    // However, base_levels_for_interaction + interacting factors should cover all factors.
                    // For safety/completeness for mu_notation, one might iterate all_factors_ordered and fill from current_cell_levels_map or pivot.
                    // Current logic for mu_notation should handle it if current_cell_levels_map is complete for its scope.

                    let mu_term_notation = generate_mu_notation(
                        &current_cell_levels_map, // Pass the map directly
                        &all_factors_ordered
                    );
                    let cell_coeffs = get_coeffs_for_cell_mean(
                        &current_cell_levels_map, // Pass the map directly
                        &all_model_param_names,
                        &factor_details
                    );

                    // Sign is positive if an even number of interacting factors are at their PIVOT level for this term
                    // (or, equivalently, an even number of factors are at their NON-PIVOT level, if k_interaction_way is even,
                    // or odd number if k_interaction_way is odd. Standard is (sum of levels) % 2 for dummy coding based on 0/1,
                    // here it's about number of factors at pivot vs non-pivot for the term construction sign).
                    // The standard for Type III contrasts: sign is (-1)^(number of factors at non-primary levels for this term).
                    // Here, primary level = pivot level. So, sign is (-1)^(number of factors at non-pivot levels).
                    // Number of non-pivot levels = k_interaction_way - num_pivot_levels_for_interacting_factors_in_this_term
                    let num_non_pivot_levels_for_interacting_factors_in_this_term =
                        k_interaction_way - num_pivot_levels_for_interacting_factors_in_this_term;

                    let sign = if
                        num_non_pivot_levels_for_interacting_factors_in_this_term % 2 == 0
                    {
                        1i32 // Even number of non-pivot levels (or zero) -> positive term
                    } else {
                        -1i32 // Odd number of non-pivot levels -> negative term
                    };

                    if sign == 1 {
                        contrast_description_terms.push(format!("+{}", mu_term_notation));
                    } else {
                        contrast_description_terms.push(format!("-{}", mu_term_notation));
                    }

                    for (j_coeff_idx, coeff_val) in cell_coeffs.iter().enumerate() {
                        l_vec_interaction[j_coeff_idx] += sign * coeff_val;
                    }
                }
                // Sort the terms: positive first, then negative.
                contrast_description_terms.sort_by_key(|k| k.starts_with('-'));

                // Construct the parameter name for this specific interaction instance,
                // respecting the order from interacting_factors_names_tuple.
                let param_name_parts: Vec<String> = interacting_factors_names_tuple
                    .iter()
                    .zip(specific_non_pivot_levels_for_interaction_instance.iter())
                    .map(|(factor_name, level)| format!("[{}={}]", factor_name, level))
                    .collect();
                let param_to_find = param_name_parts.join("*");

                match all_model_param_names.iter().position(|p_name| p_name == &param_to_find) {
                    Some(k) => {
                        let l_num = k + 1;
                        let l_label_str = format!("L{}", l_num);
                        add_to_collection_if_valid(
                            l_vec_interaction,
                            format!(
                                "{}: {}",
                                full_desc_prefix,
                                contrast_description_terms.join(" ")
                            ),
                            l_num,
                            l_label_str
                        );
                    }
                    None => {
                        web_sys::console::error_1(
                            &format!("Interaction parameter not found: {}. This may indicate a mismatch in how interaction parameter names are constructed versus how they are stored in all_model_param_names.", param_to_find).into()
                        );
                    }
                }
            }
        }
    }

    // Sort collected L-functions by their numeric L-value (target_param_idx + 1)
    collected_l_functions.sort_by_key(|k| k.0);

    // Populate final vectors from the sorted collection
    for (_l_num, l_label_str, l_vec_coeffs, desc_str) in collected_l_functions {
        l_labels.push(l_label_str);
        l_matrix_rows.push(l_vec_coeffs);
        contrast_info_strings.push(desc_str);
    }

    let mut notes = Vec::new();
    notes.push(format!("a. Design: {}", generate_design_string(&design_info)));
    if is_redundant_vec.iter().any(|&x| x) {
        notes.push("b. One or more β parameters may be redundant.".to_string());
    }
    notes.push(
        "c. Reference levels are first alphabetically/numerically; Pivot levels are last alphabetically/numerically for each factor.".to_string()
    );
    notes.push(
        "d. L-vectors for main effects and interactions are defined with non-involved factors at their respective pivot levels.".to_string()
    );
    notes.push(
        format!(
            "e. Factor processing order for effects based on first appearance in parameters: {:?}",
            all_factors_ordered
        )
    );
    notes.push(format!("f. Total unique non-zero L-vectors generated: {}", l_matrix_rows.len()));

    let estimable_function_entry = GeneralEstimableFunctionEntry {
        parameter: all_model_param_names.clone(),
        l_label: l_labels,
        l_matrix: l_matrix_rows,
        contrast_information: contrast_info_strings,
    };

    console::log_1(
        &format!(
            "Finished calculate_general_estimable_function (v8). Generated {} unique, non-zero estimable functions.",
            estimable_function_entry.l_matrix.len()
        ).into()
    );
    Ok(GeneralEstimableFunction {
        estimable_function: estimable_function_entry,
        notes,
    })
}
