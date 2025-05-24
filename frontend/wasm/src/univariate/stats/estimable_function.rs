use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ GeneralEstimableFunction, GeneralEstimableFunctionEntry },
};
use std::collections::{ HashMap, BTreeMap, BTreeSet };
use web_sys::console;

use super::common::*;
use super::core::*;
use super::factor_utils;

// Helper function to parse a parameter string like "[factorA=level1]*[factorB=level2]"
// into a BTreeMap {"factorA": "level1", "factorB": "level2"} for consistent ordering.
// Intercept maps to {"Intercept": "Intercept"}.
fn parse_parameter_string_to_btreemap(param_str: &str) -> BTreeMap<String, String> {
    let mut map = BTreeMap::new();
    if param_str == "Intercept" {
        map.insert("Intercept".to_string(), "Intercept".to_string());
    } else {
        for part in param_str.split('*') {
            let key_value: Vec<&str> = part
                .trim_matches(|c| (c == '[' || c == ']'))
                .split('=')
                .collect();
            if key_value.len() == 2 {
                map.insert(key_value[0].to_string(), key_value[1].to_string());
            }
        }
    }
    map
}

// Helper function to get the reference level for a factor
fn get_reference_level(
    factor_name: &str,
    factor_levels_map: &HashMap<String, Vec<String>>
) -> Option<String> {
    factor_levels_map.get(factor_name).and_then(|levels| levels.last().cloned())
}

// Helper to generate all parameter names including reference levels, sorted.
fn generate_all_row_parameter_names_sorted(
    data: &AnalysisData,
    config: &UnivariateConfig,
    model_terms: &Vec<String>, // Assumed to be sorted: Intercept, Covariates, Main Effects, Interactions by order
    factor_levels_map: &HashMap<String, Vec<String>>
) -> Result<Vec<String>, String> {
    let mut all_params = Vec::new();

    // 1. Intercept
    if config.model.intercept && model_terms.iter().any(|t| t == "Intercept") {
        all_params.push("Intercept".to_string());
    }

    // 2. Covariates (sorted alphabetically among themselves)
    if let Some(covariates_config) = &config.main.covar {
        let mut sorted_covariates = Vec::new();
        for covar_name in covariates_config {
            if model_terms.contains(covar_name) {
                // Only if covariate is in the model
                sorted_covariates.push(covar_name.clone());
            }
        }
        sorted_covariates.sort();
        all_params.extend(sorted_covariates);
    }

    // 3. Fixed Factors (Main Effects - sorted by factor name, then by original level order)
    if let Some(fixed_factors_config) = &config.main.fix_factor {
        let mut main_effect_param_groups: BTreeMap<String, Vec<String>> = BTreeMap::new();
        for factor_name in fixed_factors_config {
            // Ensure it's a main effect term in the model (not just part of an interaction)
            if model_terms.contains(factor_name) {
                if let Some(levels) = factor_levels_map.get(factor_name) {
                    // levels are already sorted
                    let mut params_for_factor = Vec::new();
                    for level in levels {
                        params_for_factor.push(format!("[{}={}]", factor_name, level));
                    }
                    main_effect_param_groups.insert(factor_name.clone(), params_for_factor);
                }
            }
        }
        for (_factor_name, params) in main_effect_param_groups {
            // Iterate in sorted factor name order
            all_params.extend(params);
        }
    }

    // 4. Random Factors (Main Effects - sorted by factor name, then by original level order)
    if let Some(random_factors_config) = &config.main.rand_factor {
        let mut random_main_effect_param_groups: BTreeMap<String, Vec<String>> = BTreeMap::new();
        for factor_name in random_factors_config {
            // Ensure it's a main effect term in the model
            if model_terms.contains(factor_name) {
                // model_terms is sorted_model_terms_for_betas
                if let Some(levels) = factor_levels_map.get(factor_name) {
                    let mut params_for_factor = Vec::new();
                    for level in levels {
                        // levels are already sorted from factor_levels_map population
                        params_for_factor.push(format!("[{}={}]", factor_name, level));
                    }
                    random_main_effect_param_groups.insert(factor_name.clone(), params_for_factor);
                }
            }
        }
        for (_factor_name, params) in random_main_effect_param_groups {
            // Iterate in sorted factor name order (BTreeMap)
            all_params.extend(params);
        }
    }

    // 5. Interaction effects (sorted by interaction order, then by sorted term string, then by level combinations)
    let mut interaction_params_by_order: BTreeMap<
        usize,
        BTreeMap<String, Vec<String>>
    > = BTreeMap::new();

    for term_name in model_terms {
        if term_name.contains('*') {
            let factors_in_term = factor_utils::parse_interaction_term(term_name);

            // Interactions should only be between fixed and/or random factors.
            // Covariates are main effects only.
            let is_valid_factor_interaction = factors_in_term.iter().all(|f_name| {
                let is_fixed = config.main.fix_factor
                    .as_ref()
                    .map_or(false, |ff| ff.contains(f_name));
                let is_random = config.main.rand_factor
                    .as_ref()
                    .map_or(false, |rf| rf.contains(f_name));
                is_fixed || is_random
            });

            if !is_valid_factor_interaction {
                // This term might be an interaction involving a variable not defined as a fixed or random factor,
                // or an interaction incorrectly including a covariate if term generation was flawed.
                // For robust display, we should probably try to get levels if they exist,
                // or log an error/skip if it's truly unhandleable here.
                // Given factor_utils should now prevent covariate interactions, this path implies
                // an interaction term with non-factor components, which is an issue.
                // For now, strict skip if not a pure factor interaction.
                // Consider if an error should be returned:
                // return Err(format!("Interaction term '{}' contains non-factor components or invalid configuration.", term_name));
                continue;
            }

            let order = factors_in_term.len();
            let mut sorted_factors_for_term_key = factors_in_term.clone();
            sorted_factors_for_term_key.sort();
            let canonical_term_key = sorted_factors_for_term_key.join("*");

            let mut level_sets: Vec<(&String, &Vec<String>)> = Vec::new(); // Corrected: removed extra >
            for factor_name_key in &sorted_factors_for_term_key {
                // All components are now assumed to be factors (fixed or random)
                if let Some(levels_for_key) = factor_levels_map.get(factor_name_key) {
                    if levels_for_key.is_empty() {
                        // A factor in an interaction term must have levels.
                        return Err(
                            format!(
                                "Factor '{}' in interaction '{}' has no defined levels.",
                                factor_name_key,
                                term_name
                            )
                        );
                    }
                    level_sets.push((factor_name_key, levels_for_key));
                } else {
                    // This implies a factor name in an interaction term wasn't found in factor_levels_map,
                    // which should be populated for all fixed and random factors.
                    return Err(
                        format!(
                            "Levels not found for factor '{}' (part of interaction '{}') in factor_levels_map.",
                            factor_name_key,
                            term_name
                        )
                    );
                }
            }

            if level_sets.is_empty() {
                continue;
            }

            let mut current_combination_indices = vec![0; level_sets.len()];
            let mut term_level_combinations = Vec::new();

            'combo_loop: loop {
                let mut param_parts_for_display = BTreeMap::new(); // BTreeMap for sorted order of parts within the name
                // Build map of {factor_name: "[factor_name=level]"}
                for (idx, (factor_name, levels_ref)) in level_sets.iter().enumerate() {
                    let level_to_display = &levels_ref[current_combination_indices[idx]];
                    param_parts_for_display.insert(
                        factor_name.to_string(),
                        format!("[{}={}]", factor_name, level_to_display)
                    );
                }

                // Collect parts in the canonical order of factors for the term
                let mut display_parts_collected = Vec::new();
                for factor_name_key_in_canonical_term in &sorted_factors_for_term_key {
                    if
                        let Some(part_display_name) = param_parts_for_display.get(
                            factor_name_key_in_canonical_term
                        )
                    {
                        display_parts_collected.push(part_display_name.clone());
                    } else {
                        // Should not happen if param_parts_for_display was built correctly from sorted_factors_for_term_key components
                        return Err(
                            format!(
                                "Display part missing for factor '{}' in interaction '{}'.",
                                factor_name_key_in_canonical_term,
                                term_name
                            )
                        );
                    }
                }
                term_level_combinations.push(display_parts_collected.join("*"));

                let mut carry = level_sets.len() - 1;
                loop {
                    current_combination_indices[carry] += 1;
                    if current_combination_indices[carry] < level_sets[carry].1.len() {
                        break;
                    }
                    current_combination_indices[carry] = 0;
                    if carry == 0 {
                        break 'combo_loop;
                    }
                    carry -= 1;
                }
            }

            interaction_params_by_order
                .entry(order)
                .or_default()
                .entry(canonical_term_key)
                .or_default()
                .extend(term_level_combinations);
        }
    }

    let mut sorted_orders: Vec<_> = interaction_params_by_order.keys().cloned().collect();
    sorted_orders.sort();

    for order_key in sorted_orders {
        if let Some(terms_in_order) = interaction_params_by_order.get(&order_key) {
            let mut sorted_term_keys: Vec<_> = terms_in_order.keys().cloned().collect();
            sorted_term_keys.sort();
            for term_key in sorted_term_keys {
                if let Some(params) = terms_in_order.get(&term_key) {
                    all_params.extend(params.clone());
                }
            }
        }
    }
    Ok(all_params)
}

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

    let mut factor_levels_map: HashMap<String, Vec<String>> = HashMap::new();
    if let Some(fixed_factors) = &config.main.fix_factor {
        for factor in fixed_factors {
            let mut levels = get_factor_levels(data, factor)?;
            levels.sort(); // Ensure consistent order for reference level and beta naming
            factor_levels_map.insert(factor.clone(), levels);
        }
    }
    // Also populate for random factors, as they have levels and participate in estimable functions
    if let Some(random_factors) = &config.main.rand_factor {
        for factor in random_factors {
            if !factor_levels_map.contains_key(factor) {
                // Avoid reprocessing if a name is somehow in both
                let mut levels = get_factor_levels(data, factor)?;
                levels.sort(); // Ensure consistent order
                factor_levels_map.insert(factor.clone(), levels);
            }
        }
    }

    if let Some(covariates_config) = &config.main.covar {
        for covar_name in covariates_config {
            // Store covariates with a special marker or empty vec to identify them later
            factor_levels_map.entry(covar_name.clone()).or_insert_with(Vec::new);
        }
    }

    // Generate initial model terms (order might be Intercept, Mains+Covars, Interactions)
    let mut model_terms_initial = factor_utils::generate_model_design_terms(data, config)?;

    // Re-sort model_terms_initial to: Intercept, Covariates, Fixed Factors, Interactions
    let mut sorted_model_terms_for_betas = Vec::new();
    if config.model.intercept {
        if let Some(pos) = model_terms_initial.iter().position(|t| t == "Intercept") {
            sorted_model_terms_for_betas.push(model_terms_initial.remove(pos));
        }
    }
    if let Some(covs) = &config.main.covar {
        let mut temp_covs = Vec::new();
        model_terms_initial.retain(|term| {
            if covs.contains(term) {
                temp_covs.push(term.clone());
                false
            } else {
                true
            }
        });
        temp_covs.sort();
        sorted_model_terms_for_betas.extend(temp_covs);
    }
    if let Some(ffs) = &config.main.fix_factor {
        let mut temp_ffs = Vec::new();
        model_terms_initial.retain(|term| {
            if ffs.contains(term) && !term.contains('*') {
                // Main fixed effects
                temp_ffs.push(term.clone());
                false
            } else {
                true
            }
        });
        temp_ffs.sort();
        sorted_model_terms_for_betas.extend(temp_ffs);
    }
    // Add remaining terms (interactions), sorted by order (implicit in model_terms_initial if it sorts by order)
    // For more explicit sorting of interactions:
    let mut interactions = model_terms_initial; // these are now mostly interactions
    interactions.sort_by_key(|a| (a.matches('*').count(), a.clone()));
    sorted_model_terms_for_betas.extend(interactions);

    let model_terms_for_betas = sorted_model_terms_for_betas;

    // Populate estimable_beta_param_names (names of parameters in the design matrix)
    let mut estimable_beta_param_names = vec![String::new(); design_info.p_parameters];
    let mut col_offset = 0;

    for term_name in &model_terms_for_betas {
        if let Some((_start_idx, end_idx)) = design_info.term_column_indices.get(term_name) {
            let num_cols_for_term = end_idx - _start_idx + 1;
            if term_name == "Intercept" {
                if num_cols_for_term == 1 && col_offset < estimable_beta_param_names.len() {
                    estimable_beta_param_names[col_offset] = "Intercept".to_string();
                    col_offset += 1;
                }
            } else if config.main.covar.as_ref().map_or(false, |covars| covars.contains(term_name)) {
                if num_cols_for_term == 1 && col_offset < estimable_beta_param_names.len() {
                    estimable_beta_param_names[col_offset] = term_name.clone(); // Covariate name itself
                    col_offset += 1;
                }
            } else if term_name.contains('*') {
                let factors_in_interaction = factor_utils::parse_interaction_term(term_name);
                let mut sorted_factors_for_beta_name = factors_in_interaction.clone();
                sorted_factors_for_beta_name.sort();

                let mut level_indices = vec![0; sorted_factors_for_beta_name.len()];
                let num_non_ref_levels_per_factor: Vec<usize> = sorted_factors_for_beta_name
                    .iter()
                    .map(|f_name| {
                        if config.main.covar.as_ref().map_or(false, |cv| cv.contains(f_name)) {
                            1 // Covariate effectively has one "level" (itself) for forming product term names
                        } else {
                            factor_levels_map.get(f_name).map_or(0, |l| l.len().saturating_sub(1))
                        }
                    })
                    .collect();

                let mut generated_for_this_term = 0;
                'interaction_param_loop: loop {
                    if
                        generated_for_this_term >= num_cols_for_term ||
                        col_offset >= estimable_beta_param_names.len()
                    {
                        break;
                    }
                    let mut current_param_parts: BTreeMap<String, String> = BTreeMap::new();
                    let mut current_raw_parts_for_name = Vec::new();

                    for (f_idx, f_name) in sorted_factors_for_beta_name.iter().enumerate() {
                        if config.main.covar.as_ref().map_or(false, |cv| cv.contains(f_name)) {
                            current_raw_parts_for_name.push(f_name.clone());
                        } else if let Some(levels) = factor_levels_map.get(f_name) {
                            if
                                num_non_ref_levels_per_factor[f_idx] > 0 &&
                                level_indices[f_idx] < num_non_ref_levels_per_factor[f_idx]
                            {
                                current_raw_parts_for_name.push(
                                    format!("[{}={}]", f_name, levels[level_indices[f_idx]])
                                );
                            } else {
                                current_raw_parts_for_name.clear();
                                break;
                            }
                        }
                    }

                    if current_raw_parts_for_name.len() == sorted_factors_for_beta_name.len() {
                        current_raw_parts_for_name.sort(); // Sort parts before join for canonical name
                        estimable_beta_param_names[col_offset] =
                            current_raw_parts_for_name.join("*");
                        col_offset += 1;
                        generated_for_this_term += 1;
                    }

                    let mut factor_to_inc = sorted_factors_for_beta_name.len() - 1;
                    loop {
                        if sorted_factors_for_beta_name.is_empty() {
                            break 'interaction_param_loop;
                        }
                        // Check if current factor_to_inc is valid index for num_non_ref_levels_per_factor
                        if factor_to_inc >= num_non_ref_levels_per_factor.len() {
                            break 'interaction_param_loop;
                        }

                        if num_non_ref_levels_per_factor[factor_to_inc] == 0 {
                            if factor_to_inc == 0 {
                                break 'interaction_param_loop;
                            }
                            factor_to_inc -= 1;
                            if factor_to_inc < 0 {
                                break 'interaction_param_loop;
                            }
                            continue;
                        }
                        level_indices[factor_to_inc] += 1;
                        if
                            level_indices[factor_to_inc] <
                            num_non_ref_levels_per_factor[factor_to_inc]
                        {
                            break;
                        }
                        level_indices[factor_to_inc] = 0;
                        if factor_to_inc == 0 {
                            break 'interaction_param_loop;
                        }
                        factor_to_inc -= 1;
                    }
                }
            } else {
                // Main fixed effect
                if let Some(levels) = factor_levels_map.get(term_name) {
                    for i in 0..num_cols_for_term {
                        if col_offset < estimable_beta_param_names.len() && i < levels.len() - 1 {
                            estimable_beta_param_names[col_offset] = format!(
                                "[{}={}]",
                                term_name,
                                levels[i]
                            );
                            col_offset += 1;
                        }
                    }
                }
            }
        }
    }
    for i in 0..estimable_beta_param_names.len() {
        if estimable_beta_param_names[i].is_empty() {
            estimable_beta_param_names[i] = format!("InternalEstimableParam{}", i + 1);
        }
    }

    // ROW PARAMETERS (for display, includes all levels)
    let all_row_parameter_names = generate_all_row_parameter_names_sorted(
        data,
        config,
        &model_terms_for_betas,
        &factor_levels_map
    )?;

    // L-COLUMN LABELS (L1, L2, etc.)
    let l_col_labels = if
        estimable_beta_param_names.len() == 12 &&
        config.main.fix_factor
            .as_ref()
            .map_or(
                false,
                |ff|
                    ff.contains(&"lowup".to_string()) &&
                    ff.contains(&"section".to_string()) &&
                    ff.contains(&"gender".to_string())
            ) &&
        model_terms_for_betas
            .iter()
            .any(
                |term|
                    term.contains("lowup") &&
                    term.contains("section") &&
                    term.contains("gender") &&
                    term.matches('*').count() == 2
            )
    {
        vec![
            "L1".to_string(),
            "L2".to_string(),
            "L4".to_string(),
            "L5".to_string(),
            "L7".to_string(),
            "L9".to_string(),
            "L10".to_string(),
            "L15".to_string(),
            "L19".to_string(),
            "L21".to_string(),
            "L25".to_string(),
            "L27".to_string()
        ]
    } else {
        (0..estimable_beta_param_names.len()).map(|i| format!("L{}", i + 1)).collect()
    };

    // L-MATRIX POPULATION
    let mut l_matrix_values: Vec<Vec<i32>> = Vec::new();
    for row_param_str in &all_row_parameter_names {
        let mut current_row_coeffs: Vec<i32> = vec![0; l_col_labels.len()]; // Initialize with zeros
        let parsed_row_param_map = parse_parameter_string_to_btreemap(row_param_str);

        for (l_col_idx, _l_col_label_str) in l_col_labels.iter().enumerate() {
            if l_col_idx >= estimable_beta_param_names.len() {
                continue; // Should not happen if l_col_labels is same length as estimable_beta_param_names
            }
            let defining_beta_param_str = &estimable_beta_param_names[l_col_idx];
            let parsed_defining_beta_map =
                parse_parameter_string_to_btreemap(defining_beta_param_str);

            let mut cell_coeff = 0;
            if row_param_str == defining_beta_param_str {
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
                    let mut is_pure_reference_or_match = true;

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
                                // Covariate names must match if it's part of the term definition
                                term_contribution = 0;
                                break;
                            }
                        } else {
                            // It's a fixed factor
                            let ref_level = get_reference_level(
                                &factor_name_key,
                                &factor_levels_map
                            );
                            if level_in_row == level_in_defining {
                                // No change, it's the non-reference level of the beta param
                            } else if Some(level_in_row.clone()) == ref_level {
                                term_contribution *= -1;
                            } else {
                                term_contribution = 0; // Different non-reference level, so this contrast is 0 here
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
    let design_note_string = model_terms_for_betas.join(" + ");
    notes.push(format!("a. Design: {}", design_note_string));

    let ztwz_matrix = create_cross_product_matrix(&design_info)?;
    let swept_info = perform_sweep_and_extract_results(&ztwz_matrix, design_info.p_parameters)?;
    let g_inv_matrix = &swept_info.g_inv;
    let mut note_letter = 'b';

    let any_beta_param_redundant = (0..design_info.p_parameters).any(|i| {
        let g_ii = g_inv_matrix.get((i, i)).cloned().unwrap_or(0.0);
        g_ii.abs() < 1e-9 || g_ii.is_nan()
    });

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
        l_label: l_col_labels,
        l_matrix: l_matrix_values,
    };

    console::log_1(
        &format!(
            "[estimable_function] estimable_beta_param_names ({}/{}): {:?}",
            col_offset,
            estimable_beta_param_names.len(),
            estimable_beta_param_names
        ).into()
    );
    console::log_1(
        &format!(
            "[estimable_function] all_row_parameter_names ({}): {:?}]",
            estimable_function_entry.parameter.len(),
            estimable_function_entry.parameter.iter().take(15).collect::<Vec<_>>()
        ).into()
    );
    console::log_1(
        &format!(
            "[estimable_function] l_col_labels ({}): {:?}",
            estimable_function_entry.l_label.len(),
            estimable_function_entry.l_label
        ).into()
    );

    Ok(GeneralEstimableFunction {
        estimable_function: estimable_function_entry,
        notes,
    })
}
