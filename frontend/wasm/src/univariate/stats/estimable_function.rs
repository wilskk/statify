use std::collections::{ HashMap, HashSet };
use itertools::Itertools;
use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{
        DesignMatrixInfo,
        GeneralEstimableFunction,
        GeneralEstimableFunctionEntry,
        DescriptiveStatistics,
        StatsEntry,
    },
};
use crate::univariate::stats::factor_utils::parse_parameter_name;
use web_sys::console;
use nalgebra::{ DMatrix, DVector };

use super::core::*;
use super::descriptive_statistics::calculate_descriptive_statistics;

// Helper to get coefficients for a specific cell mean
fn get_coeffs_for_cell_mean(
    cell_levels: &HashMap<String, String>,
    all_model_param_names: &[String],
    _factor_details: &HashMap<String, FactorDetail>, // Factor details might still be needed for other logic if any
    stats_entries_map: &HashMap<String, StatsEntry>,
    desc_stats_factor_order: &[String]
) -> Vec<i32> {
    let lookup_key = generate_descriptive_stats_key(cell_levels, desc_stats_factor_order);
    let cell_is_problematic = stats_entries_map
        .get(&lookup_key)
        .map_or(true, |entry| (entry.n == 0 || entry.mean.abs() < 1e-9 || entry.mean.is_nan())); // Default to problematic if key not found

    if cell_is_problematic {
        // console::log_1(&format!("Cell {:?} (key: '{}') has N=0 or mean=0/NaN. Returning all-zero coefficients.", cell_levels, lookup_key).into());
        return vec![0; all_model_param_names.len()];
    }

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

// Helper function to generate a key for descriptive statistics lookup
fn generate_descriptive_stats_key(
    cell_config: &HashMap<String, String>,
    ordered_factors_for_key: &[String]
) -> String {
    ordered_factors_for_key
        .iter()
        .filter_map(|factor_name_from_desc_order| {
            cell_config
                .get(factor_name_from_desc_order)
                .map(|level| format!("{}={}", factor_name_from_desc_order, level))
        })
        .collect::<Vec<String>>()
        .join(";")
}

/// Calculate general estimable functions.
/// This table shows, for each non-redundant parameter in the model, a linear combination
/// (L-vector) that estimates it, potentially as a contrast against a reference level.
pub fn calculate_general_estimable_function(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<GeneralEstimableFunction, String> {
    console::log_1(
        &"Starting calculate_general_estimable_function (v-cell_specific_zeroing)".into()
    );

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

    // --- Estimability Check Setup ---
    let xtx_matrix: DMatrix<f64>;
    if let Some(w_vec) = &design_info.w {
        let w_diag = DMatrix::from_diagonal(w_vec);
        xtx_matrix = design_info.x.transpose() * w_diag * &design_info.x;
    } else {
        xtx_matrix = design_info.x.transpose() * &design_info.x;
    }

    let ztwz_matrix = create_cross_product_matrix(&design_info)?;
    let swept_info = perform_sweep_and_extract_results(&ztwz_matrix, design_info.p_parameters)?;
    let g_inv_matrix = swept_info.g_inv;
    let epsilon_estimability = 1e-9;

    fn is_estimable(
        l_coeffs_i32: &[i32],
        xtx: &DMatrix<f64>,
        g_inv: &DMatrix<f64>,
        epsilon: f64
    ) -> bool {
        if l_coeffs_i32.iter().all(|&x| x == 0) {
            return true; // Treat all-zero L-vector as estimable (though it won't be added later)
        }
        let l_vec_f64: Vec<f64> = l_coeffs_i32
            .iter()
            .map(|&x| x as f64)
            .collect();
        let l_matrix_f64 = DMatrix::from_row_slice(1, l_vec_f64.len(), &l_vec_f64);

        if g_inv.ncols() != xtx.nrows() || l_matrix_f64.ncols() != g_inv.nrows() {
            console::error_1(
                &format!(
                    "Dimension mismatch for estimability check: L({}x{}), G_inv({}x{}), XTX({}x{})",
                    l_matrix_f64.nrows(),
                    l_matrix_f64.ncols(),
                    g_inv.nrows(),
                    g_inv.ncols(),
                    xtx.nrows(),
                    xtx.ncols()
                ).into()
            );
            return false; // Cannot perform check
        }

        let l_g_inv_xtx = l_matrix_f64 * g_inv * xtx;

        if l_g_inv_xtx.nrows() != 1 || l_g_inv_xtx.ncols() != l_coeffs_i32.len() {
            console::error_1(&"Dimension mismatch for L_prime in estimability check.".into());
            return false;
        }

        for (i, original_coeff_i32) in l_coeffs_i32.iter().enumerate() {
            let original_coeff_f64 = *original_coeff_i32 as f64;
            let calculated_coeff = l_g_inv_xtx[(0, i)];
            if (original_coeff_f64 - calculated_coeff).abs() > epsilon {
                return false;
            }
        }
        true
    }
    // --- End Estimability Check Setup ---

    // --- Descriptive Statistics Setup ---
    let dep_var_name_for_desc = config.main.dep_var
        .as_ref()
        .ok_or("Dependent variable not specified for descriptive statistics")?
        .clone();
    let all_descriptive_stats = calculate_descriptive_statistics(data, config)?;
    let descriptive_stats_for_dep_var = all_descriptive_stats
        .get(&dep_var_name_for_desc)
        .ok_or_else(||
            format!("Descriptive statistics not found for dependent var: {}", dep_var_name_for_desc)
        )?;
    let stats_entries_map = &descriptive_stats_for_dep_var.stats_entries;
    let desc_stats_factor_order = &descriptive_stats_for_dep_var.factor_names; // This is Vec<String>
    // --- End Descriptive Statistics Setup ---

    let all_model_param_names = generate_all_row_parameter_names_sorted(&design_info, data)?;
    console::log_1(
        &format!("all_model_param_names (v-g_inv_only): {:?}", all_model_param_names).into()
    );

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

    for param_name in &all_model_param_names {
        if param_name == "Intercept" {
            continue;
        }
        let parsed_param_components = parse_parameter_name(param_name);
        for (factor, level) in parsed_param_components {
            if factor == "Intercept" {
                continue;
            }
            let entry = factor_details.entry(factor.clone()).or_insert_with(|| {
                if !all_factors_ordered.contains(&factor) {
                    all_factors_ordered.push(factor.clone());
                }
                FactorDetail {
                    name: factor.clone(),
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
    console::log_1(
        &format!("Base_all_pivot_levels (standard definition): {:?}", base_all_pivot_levels).into()
    );
    // --- End Determine Effective Base All Pivot Levels ---

    let mut collected_l_functions: Vec<(usize, String, Vec<i32>, String)> = Vec::new();
    let mut encountered_l_vectors: HashSet<Vec<i32>> = HashSet::new();

    let mut add_to_collection_if_valid = |
        l_vec: Vec<i32>,
        description: String,
        expected_l_number: usize,
        expected_l_label: String
    | {
        if !is_estimable(&l_vec, &xtx_matrix, &g_inv_matrix, epsilon_estimability) {
            console::log_1(
                &format!(
                    "L-vector for '{}' ({}) is NOT estimable. Skipping.",
                    description,
                    expected_l_label
                ).into()
            );
            return;
        }
        if l_vec.iter().all(|&x| x == 0) || !encountered_l_vectors.insert(l_vec.clone()) {
            console::log_1(
                &format!(
                    "L-vector for '{}' ({}) is all zero or duplicate. Skipping.",
                    description,
                    expected_l_label
                ).into()
            );
            return;
        }
        collected_l_functions.push((expected_l_number, expected_l_label, l_vec, description));
    };

    // 1. Mean of the All-Pivot-Levels Cell (L1 / Intercept)
    console::log_1(&"Generating L1 (Intercept)...".into());
    let l_vec_l1 = get_coeffs_for_cell_mean(
        &base_all_pivot_levels,
        &all_model_param_names,
        &factor_details,
        stats_entries_map,
        desc_stats_factor_order
    );
    let mu_notation_l1 = generate_mu_notation(&base_all_pivot_levels, &all_factors_ordered); // Notation based on intended full pivot cell
    match all_model_param_names.iter().position(|p_name| p_name == "Intercept") {
        Some(k) => {
            let l_num = k + 1;
            let l_label_str = format!("L{}", l_num);
            add_to_collection_if_valid(
                l_vec_l1,
                format!("Mean of all-pivot cell {}", mu_notation_l1),
                l_num,
                l_label_str
            );
        }
        None => {
            web_sys::console::error_1(&"'Intercept' parameter not found for L1 generation!".into());
        }
    }

    // 2. Main Effects
    console::log_1(&"Generating Main Effects...".into());
    for factor_of_interest_name in &all_factors_ordered {
        if let Some(detail_factor_of_interest) = factor_details.get(factor_of_interest_name) {
            let pivot_level_for_factor_of_interest = &detail_factor_of_interest.pivot_level;
            for non_pivot_level in detail_factor_of_interest.levels
                .iter()
                .filter(|l| *l != pivot_level_for_factor_of_interest) {
                let mut cell_a_levels = base_all_pivot_levels.clone();
                cell_a_levels.insert(factor_of_interest_name.clone(), non_pivot_level.clone());

                let mut cell_b_levels = base_all_pivot_levels.clone();
                // No need to insert for FoI in cell_b, it's already at its pivot from base_all_pivot_levels.
                // base_all_pivot_levels has FoI at its pivot. If FoI is the only factor, cell_b is just {FoI:pivot}

                let coeffs_a = get_coeffs_for_cell_mean(
                    &cell_a_levels,
                    &all_model_param_names,
                    &factor_details,
                    stats_entries_map,
                    desc_stats_factor_order
                );
                let coeffs_b = get_coeffs_for_cell_mean(
                    &cell_b_levels,
                    &all_model_param_names,
                    &factor_details,
                    stats_entries_map,
                    desc_stats_factor_order
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

    // 3. N-way Interactions
    console::log_1(&"Generating N-way Interactions...".into());
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
                    let mut current_cell_levels_map = base_levels_for_interaction_context.clone(); // Start with non-involved factors at their standard pivots
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
                            &specific_non_pivot_levels_for_interaction_instance[idx_in_interaction]
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
                        &factor_details,
                        stats_entries_map,
                        desc_stats_factor_order
                    );
                    let mu_term_notation = generate_mu_notation(
                        &current_cell_levels_map,
                        &all_factors_ordered
                    );

                    let num_non_pivot_levels_for_interacting_factors_in_this_term =
                        k_interaction_way - num_pivot_levels_for_interacting_factors_in_this_term;
                    let sign = if
                        num_non_pivot_levels_for_interacting_factors_in_this_term % 2 == 0
                    {
                        1i32
                    } else {
                        -1i32
                    };

                    if cell_coeffs.iter().all(|&c| c == 0) {
                        // If this specific cell was zeroed out, its mu notation reflects that it contributes nothing
                        // Don't add to description terms, or add as "+0" or similar if explicitly needed.
                        // For now, just skip adding it to the sum for l_vec_interaction and description.
                    } else {
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
                            &format!(
                                "Interaction parameter not found: {}. (param_parts: {:?})",
                                param_to_find,
                                param_name_parts
                            ).into()
                        );
                    }
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
        "d. Coefficients for individual cell means are zeroed out if N=0 or mean=0/NaN for that specific cell before forming contrasts. This may affect L-vector values.".to_string()
    );
    notes.push(
        format!(
            "e. Factor processing order for effects based on first appearance in parameters: {:?}",
            all_factors_ordered
        )
    );
    notes.push(
        format!("f. Total unique, non-zero, estimable L-vectors generated: {}", l_matrix_rows.len())
    );
    notes.push(
        "g. Final estimability check L(X'X)^-(X'X) = L performed with epsilon_estimability = 1e-9.".to_string()
    );

    let estimable_function_entry = GeneralEstimableFunctionEntry {
        parameter: all_model_param_names.clone(),
        l_label: l_labels,
        l_matrix: l_matrix_rows,
        contrast_information: contrast_info_strings,
    };

    console::log_1(
        &format!(
            "Finished calculate_general_estimable_function (v-cell_specific_zeroing). Generated {} L-functions.",
            estimable_function_entry.l_matrix.len()
        ).into()
    );
    Ok(GeneralEstimableFunction {
        estimable_function: estimable_function_entry,
        notes,
    })
}
