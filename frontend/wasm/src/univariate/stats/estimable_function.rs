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
    reference_level: String,
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
    let mut notation = "μ".to_string();
    for factor_name in ordered_factors {
        if let Some(level) = cell_levels.get(factor_name) {
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
                }
            });
            if !entry.levels.contains(&level) {
                entry.levels.push(level.clone());
            }
        }
    }

    // Determine reference levels (e.g., first alphabetically/numerically)
    for detail in factor_details.values_mut() {
        detail.levels.sort();
        if let Some(first_level) = detail.levels.first() {
            detail.reference_level = first_level.clone();
        } else {
            return Err(format!("Factor {} has no levels defined.", detail.name));
        }
    }
    console::log_1(
        &format!("Factor processing order by appearance (v8): {:?}", all_factors_ordered).into()
    );

    // Base map with all factors at their reference levels
    let base_all_ref_levels: HashMap<String, String> = all_factors_ordered
        .iter()
        .filter_map(|fname|
            factor_details.get(fname).map(|d| (fname.clone(), d.reference_level.clone()))
        )
        .collect();

    let mut l_matrix_rows: Vec<Vec<i32>> = Vec::new();
    let mut l_labels: Vec<String> = Vec::new();
    let mut contrast_info_strings: Vec<String> = Vec::new();
    let mut l_overall_counter = 0; // Single counter for L-labels
    let mut encountered_l_vectors: HashSet<Vec<i32>> = HashSet::new();

    let mut add_l_vector_if_valid = |l_vec: Vec<i32>, description: String| {
        if !l_vec.iter().all(|&x| x == 0) && encountered_l_vectors.insert(l_vec.clone()) {
            l_overall_counter += 1;
            l_labels.push(format!("L{}", l_overall_counter));
            l_matrix_rows.push(l_vec);
            contrast_info_strings.push(description);
        }
    };

    // 1. Mean of the All-Reference-Levels Cell
    console::log_1(&"Generating mean of all-reference-levels cell...".into());
    let l_vec_all_ref_mean = get_coeffs_for_cell_mean(
        &base_all_ref_levels,
        &all_model_param_names,
        &factor_details
    );
    let mu_notation_all_ref = generate_mu_notation(&base_all_ref_levels, &all_factors_ordered);
    add_l_vector_if_valid(
        l_vec_all_ref_mean,
        format!("Mean of reference cell {}", mu_notation_all_ref)
    );

    // 2. Main Effects (k-1 per factor, others at REF)
    console::log_1(&"Generating main effects (others at ref)...".into());
    for factor_of_interest_name in &all_factors_ordered {
        if let Some(detail_factor_of_interest) = factor_details.get(factor_of_interest_name) {
            for non_ref_level in detail_factor_of_interest.levels
                .iter()
                .filter(|l| *l != &detail_factor_of_interest.reference_level) {
                let mut cell1_levels = base_all_ref_levels.clone();
                cell1_levels.insert(factor_of_interest_name.clone(), non_ref_level.clone());

                let mut cell2_levels = base_all_ref_levels.clone(); // Already has factor_of_interest at its ref level

                let coeffs1 = get_coeffs_for_cell_mean(
                    &cell1_levels,
                    &all_model_param_names,
                    &factor_details
                );
                let coeffs2 = get_coeffs_for_cell_mean(
                    &cell2_levels,
                    &all_model_param_names,
                    &factor_details
                );
                let l_vec_me: Vec<i32> = coeffs1
                    .iter()
                    .zip(coeffs2.iter())
                    .map(|(a, b)| a - b)
                    .collect();

                let mu1_notation = generate_mu_notation(&cell1_levels, &all_factors_ordered);
                let mu2_notation = generate_mu_notation(&cell2_levels, &all_factors_ordered);
                let desc = format!(
                    "Main Effect {}({} vs {} | Others at Ref): {} - {}",
                    factor_of_interest_name,
                    non_ref_level,
                    detail_factor_of_interest.reference_level,
                    mu1_notation,
                    mu2_notation
                );
                add_l_vector_if_valid(l_vec_me, desc);
            }
        }
    }

    // 3. N-way Interactions (non-involved factors at REF)
    console::log_1(&"Generating N-way interactions (non-involved at ref)...".into());
    for k_interaction_way in 2..=all_factors_ordered.len() {
        for interacting_factors_names_tuple in all_factors_ordered
            .iter()
            .cloned()
            .combinations(k_interaction_way) {
            let mut level_choices_for_each_interacting_factor: Vec<Vec<String>> = Vec::new();
            let mut possible_interaction_levels = true;
            for factor_name_in_interaction in &interacting_factors_names_tuple {
                if let Some(detail) = factor_details.get(factor_name_in_interaction) {
                    let non_ref_levels = detail.levels
                        .iter()
                        .filter(|l| *l != &detail.reference_level)
                        .cloned()
                        .collect::<Vec<_>>();
                    if non_ref_levels.is_empty() {
                        possible_interaction_levels = false;
                        break;
                    }
                    level_choices_for_each_interacting_factor.push(non_ref_levels);
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

            for specific_non_ref_levels_for_interaction_instance in level_choices_for_each_interacting_factor
                .into_iter()
                .multi_cartesian_product() {
                let mut l_vec_interaction = vec![0i32; all_model_param_names.len()];
                let mut contrast_description_terms: Vec<String> = Vec::new();

                let interaction_term_name_str = interacting_factors_names_tuple.iter().join("*");
                let interaction_levels_short_desc = interacting_factors_names_tuple
                    .iter()
                    .zip(specific_non_ref_levels_for_interaction_instance.iter())
                    .map(|(f, l)|
                        format!(
                            "{}={}",
                            f.split('=').next().unwrap_or(f),
                            l.chars().next().unwrap_or('L')
                        )
                    )
                    .join(",");
                let full_desc_prefix = format!(
                    "Interaction {}({}) | Others at Ref",
                    interaction_term_name_str,
                    interaction_levels_short_desc
                );

                for i_term_construction in 0..1 << k_interaction_way {
                    let mut current_cell_levels_map: HashMap<
                        String,
                        String
                    > = base_all_ref_levels.clone(); // Start with non-interacting factors at REF
                    let mut num_ref_levels_in_this_term_for_interacting_factors = 0;

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
                            &specific_non_ref_levels_for_interaction_instance[idx_in_interaction]
                        } else {
                            num_ref_levels_in_this_term_for_interacting_factors += 1;
                            &factor_detail_for_interacting.reference_level
                        };
                        current_cell_levels_map.insert(
                            interacting_factor_name.clone(),
                            level_for_this_interacting_factor_in_term.clone()
                        );
                    }

                    let current_cell_levels: HashMap<String, String> = current_cell_levels_map
                        .into_iter()
                        .collect();
                    let mu_term_notation = generate_mu_notation(
                        &current_cell_levels,
                        &all_factors_ordered
                    );
                    let cell_coeffs = get_coeffs_for_cell_mean(
                        &current_cell_levels,
                        &all_model_param_names,
                        &factor_details
                    );
                    let sign = if num_ref_levels_in_this_term_for_interacting_factors % 2 == 0 {
                        1i32
                    } else {
                        -1i32
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
                add_l_vector_if_valid(
                    l_vec_interaction,
                    format!("{}: {}", full_desc_prefix, contrast_description_terms.join(" "))
                );
            }
        }
    }

    let mut notes = Vec::new();
    notes.push(format!("a. Design: {}", generate_design_string(&design_info)));
    if is_redundant_vec.iter().any(|&x| x) {
        notes.push("b. One or more β parameters may be redundant.".to_string());
    }
    notes.push(
        "c. Reference levels are first alphabetically/numerically for each factor independently.".to_string()
    );
    notes.push(
        "d. L-vectors for main effects and interactions are defined with non-involved factors at their respective reference levels.".to_string()
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
