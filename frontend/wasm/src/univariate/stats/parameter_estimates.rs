use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ ConfidenceInterval, ParameterEstimateEntry, ParameterEstimates },
};
use std::collections::HashMap;

use super::common::*;
use super::core::*;
use super::factor_utils;

/// Calculate parameter estimates using a General Linear Model (GLM) approach.
pub fn calculate_parameter_estimates(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<ParameterEstimates, String> {
    if !config.options.param_est {
        return Ok(ParameterEstimates { estimates: Vec::new(), notes: Vec::new() });
    }

    let design_info = create_design_response_weights(data, config)?;

    if design_info.n_samples == 0 {
        return Ok(ParameterEstimates { estimates: Vec::new(), notes: Vec::new() });
    }

    if
        design_info.p_parameters == 0 &&
        !config.model.intercept &&
        config.main.fix_factor.as_ref().map_or(true, |ff| ff.is_empty()) &&
        config.main.covar.as_ref().map_or(true, |cv| cv.is_empty())
    {
        return Ok(ParameterEstimates { estimates: Vec::new(), notes: Vec::new() });
    }

    let ztwz_matrix = create_cross_product_matrix(&design_info)?;
    let swept_info = perform_sweep_and_extract_results(&ztwz_matrix, design_info.p_parameters)?;

    let beta_hat_vec = &swept_info.beta_hat;
    let g_inv_matrix = &swept_info.g_inv;
    let rss = swept_info.s_rss;

    let n_samples = design_info.n_samples;
    let r_x_rank = design_info.r_x_rank;

    let df_error_val = if n_samples > r_x_rank { (n_samples - r_x_rank) as f64 } else { 0.0 };

    if df_error_val < 0.0 {
        return Err(
            format!("Degrees of freedom for error ({}) must be non-negative.", df_error_val)
        );
    }
    let df_error_usize = df_error_val as usize;

    let mse = if df_error_val > 0.0 { rss / df_error_val } else { f64::NAN };
    let mut estimates = Vec::new();
    let sig_level = config.options.sig_level;
    let sig_level_opt = Some(sig_level);

    // Get model terms
    let model_terms = factor_utils::generate_model_design_terms(data, config)?;

    // Build a mapping of all factor levels for easier reference
    let mut factor_levels_map: HashMap<String, Vec<String>> = HashMap::new();
    if let Some(fixed_factors) = &config.main.fix_factor {
        for factor in fixed_factors {
            let mut levels = get_factor_levels(data, factor)?;
            levels.sort_by(|a, b| {
                // Natural sort
                let a_num = a.parse::<f64>();
                let b_num = b.parse::<f64>();
                match (a_num, b_num) {
                    (Ok(a_val), Ok(b_val)) =>
                        a_val.partial_cmp(&b_val).unwrap_or(std::cmp::Ordering::Equal),
                    (Ok(_), Err(_)) => std::cmp::Ordering::Less, // numbers come before non-numbers
                    (Err(_), Ok(_)) => std::cmp::Ordering::Greater, // non-numbers come after numbers
                    (Err(_), Err(_)) => a.cmp(b), // both non-numbers, sort alphabetically
                }
            });
            factor_levels_map.insert(factor.clone(), levels);
        }
    }
    // Also populate for random factors
    if let Some(random_factors) = &config.main.rand_factor {
        for factor in random_factors {
            if !factor_levels_map.contains_key(factor) {
                let mut levels = get_factor_levels(data, factor)?;
                levels.sort_by(|a, b| {
                    // Natural sort
                    let a_num = a.parse::<f64>();
                    let b_num = b.parse::<f64>();
                    match (a_num, b_num) {
                        (Ok(a_val), Ok(b_val)) =>
                            a_val.partial_cmp(&b_val).unwrap_or(std::cmp::Ordering::Equal),
                        (Ok(_), Err(_)) => std::cmp::Ordering::Less,
                        (Err(_), Ok(_)) => std::cmp::Ordering::Greater,
                        (Err(_), Err(_)) => a.cmp(b),
                    }
                });
                factor_levels_map.insert(factor.clone(), levels);
            }
        }
    }
    // And ensure covariates are in the map with empty levels for consistency with estimable_function logic
    if let Some(covariates_config) = &config.main.covar {
        for covar_name in covariates_config {
            factor_levels_map.entry(covar_name.clone()).or_insert_with(Vec::new);
        }
    }

    // term_is_aliased tracks if ANY parameter within a term (e.g. any level of a factor) is aliased.
    let mut term_is_aliased_map: HashMap<String, bool> = HashMap::new();

    // --- Start: Replicate logic from estimable_function.rs for parameter naming ---

    // B. Get `model_terms_for_betas` (sorted model terms)
    let mut model_terms_initial = factor_utils::generate_model_design_terms(data, config)?;
    let mut sorted_model_terms = Vec::new();

    if config.model.intercept {
        if let Some(pos) = model_terms_initial.iter().position(|t| t == "Intercept") {
            sorted_model_terms.push(model_terms_initial.remove(pos));
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
        sorted_model_terms.extend(temp_covs);
    }
    if let Some(ffs) = &config.main.fix_factor {
        let mut temp_ffs = Vec::new();
        model_terms_initial.retain(|term| {
            // Ensure it's a main effect fixed factor, not part of an interaction already caught by name
            if ffs.contains(term) && !term.contains('*') {
                temp_ffs.push(term.clone());
                false
            } else {
                true
            }
        });
        temp_ffs.sort();
        sorted_model_terms.extend(temp_ffs);
    }
    if let Some(rfs) = &config.main.rand_factor {
        let mut temp_rfs = Vec::new();
        model_terms_initial.retain(|term| {
            // Ensure it's a main effect random factor
            if rfs.contains(term) && !term.contains('*') {
                temp_rfs.push(term.clone());
                false
            } else {
                true
            }
        });
        temp_rfs.sort();
        sorted_model_terms.extend(temp_rfs);
    }
    // Add remaining terms (interactions), sorted by order and then alphabetically
    model_terms_initial.sort_by_key(|a| (a.matches('*').count(), a.clone()));
    sorted_model_terms.extend(model_terms_initial);

    // C. Generate `actual_beta_names` (corresponds to `estimable_beta_param_names` from estimable_function.rs)
    // This list will map directly to beta_hat_vec and g_inv_matrix.
    let actual_beta_names = generate_parameter_names(
        &sorted_model_terms,
        &factor_levels_map,
        config
    );

    // --- End: Replicate logic from estimable_function.rs for parameter naming ---

    // --- Start: Replicate generate_all_row_parameter_names_sorted and helpers ---

    // Helper function to parse a parameter string (copied from estimable_function.rs)
    fn parse_parameter_string_to_btreemap_for_pe(
        param_str: &str
    ) -> std::collections::BTreeMap<String, String> {
        let mut map = std::collections::BTreeMap::new();
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

    // Helper function to get the reference level (copied from estimable_function.rs)
    fn get_reference_level_for_pe(
        factor_name: &str,
        factor_levels_map: &HashMap<String, Vec<String>>
    ) -> Option<String> {
        factor_levels_map.get(factor_name).and_then(|levels| levels.last().cloned())
    }

    // Adapted from generate_all_row_parameter_names_sorted in estimable_function.rs
    fn generate_display_parameter_names_for_pe(
        _data: &AnalysisData, // Pass if needed by helpers, currently not directly by this simplified version
        config: &UnivariateConfig,
        model_terms: &Vec<String>, // This is sorted_model_terms
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
                    sorted_covariates.push(covar_name.clone());
                }
            }
            sorted_covariates.sort();
            all_params.extend(sorted_covariates);
        }

        // 3. Fixed Factors (Main Effects - sorted by factor name, then by original level order)
        if let Some(fixed_factors_config) = &config.main.fix_factor {
            let mut main_effect_param_groups: std::collections::BTreeMap<
                String,
                Vec<String>
            > = std::collections::BTreeMap::new();
            for factor_name in fixed_factors_config {
                if model_terms.contains(factor_name) {
                    if let Some(levels) = factor_levels_map.get(factor_name) {
                        let mut params_for_factor = Vec::new();
                        for level in levels {
                            params_for_factor.push(format!("[{}={}]", factor_name, level));
                        }
                        main_effect_param_groups.insert(factor_name.clone(), params_for_factor);
                    }
                }
            }
            for (_factor_name, params) in main_effect_param_groups {
                all_params.extend(params);
            }
        }

        // 4. Random Factors (Main Effects - sorted by factor name, then by original level order)
        if let Some(random_factors_config) = &config.main.rand_factor {
            let mut random_main_effect_param_groups: std::collections::BTreeMap<
                String,
                Vec<String>
            > = std::collections::BTreeMap::new();
            for factor_name in random_factors_config {
                if model_terms.contains(factor_name) {
                    if let Some(levels) = factor_levels_map.get(factor_name) {
                        let mut params_for_factor = Vec::new();
                        for level in levels {
                            params_for_factor.push(format!("[{}={}]", factor_name, level));
                        }
                        random_main_effect_param_groups.insert(
                            factor_name.clone(),
                            params_for_factor
                        );
                    }
                }
            }
            for (_factor_name, params) in random_main_effect_param_groups {
                all_params.extend(params);
            }
        }

        // 5. Interaction effects
        let mut interaction_params_by_order: std::collections::BTreeMap<
            usize,
            std::collections::BTreeMap<String, Vec<String>>
        > = std::collections::BTreeMap::new();

        for term_name in model_terms {
            if term_name.contains('*') {
                let factors_in_term = factor_utils::parse_interaction_term(term_name);
                // Covariates should not be in interaction terms here.
                let is_valid_factor_interaction = factors_in_term
                    .iter()
                    .all(
                        |f_name|
                            config.main.fix_factor
                                .as_ref()
                                .map_or(false, |ff| ff.contains(f_name)) ||
                            config.main.rand_factor.as_ref().map_or(false, |rf| rf.contains(f_name))
                    );

                if !is_valid_factor_interaction {
                    // This should ideally not be hit if term generation in factor_utils is correct
                    // and covariates are not part of interaction terms.
                    // If it is, we might log an error or skip.
                    // For now, skip to avoid panic if factor_levels_map doesn't have a covariate.
                    continue;
                }

                let order = factors_in_term.len();
                let mut sorted_factors_for_term_key = factors_in_term.clone();
                sorted_factors_for_term_key.sort();
                let canonical_term_key = sorted_factors_for_term_key.join("*");

                let mut level_sets: Vec<(&String, &Vec<String>)> = Vec::new();
                for factor_name_key in &sorted_factors_for_term_key {
                    if let Some(levels_for_key) = factor_levels_map.get(factor_name_key) {
                        if
                            levels_for_key.is_empty() &&
                            (config.main.fix_factor
                                .as_ref()
                                .map_or(false, |ff| ff.contains(factor_name_key)) ||
                                config.main.rand_factor
                                    .as_ref()
                                    .map_or(false, |rf| rf.contains(factor_name_key)))
                        {
                            return Err(
                                format!(
                                    "Factor '{}' in interaction '{}' has no levels.",
                                    factor_name_key,
                                    term_name
                                )
                            );
                        }
                        level_sets.push((factor_name_key, levels_for_key));
                    } else {
                        return Err(
                            format!(
                                "Levels not found for factor '{}' in interaction term '{}'",
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
                    let mut param_parts_for_display = std::collections::BTreeMap::new();
                    for (idx, (factor_name, levels_ref)) in level_sets.iter().enumerate() {
                        let level_to_display = &levels_ref[current_combination_indices[idx]];
                        param_parts_for_display.insert(
                            factor_name.to_string(),
                            format!("[{}={}]", factor_name, level_to_display)
                        );
                    }

                    let mut display_parts_collected = Vec::new();
                    for factor_name_key in &sorted_factors_for_term_key {
                        if
                            let Some(part_display_name) =
                                param_parts_for_display.get(factor_name_key)
                        {
                            display_parts_collected.push(part_display_name.clone());
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
    // --- End: Replicate generate_all_row_parameter_names_sorted and helpers ---

    let display_parameter_names = generate_display_parameter_names_for_pe(
        data,
        config,
        &sorted_model_terms,
        &factor_levels_map
    )?;

    // The old param_names generation logic is now replaced by actual_beta_names
    // We will use actual_beta_names for mapping to beta_hat and g_inv
    // And display_parameter_names for the final list of parameters in the output table.

    // Process parameter estimates
    // Create a map for quick lookup of estimated beta values and their indices
    let mut estimated_params_map: HashMap<String, (usize, f64, f64)> = HashMap::new(); // param_name -> (index, beta_val, g_ii)
    for i in 0..design_info.p_parameters {
        let param_name = &actual_beta_names[i];
        let beta_val = beta_hat_vec.get(i).cloned().unwrap_or(0.0);
        let g_ii = g_inv_matrix.get((i, i)).cloned().unwrap_or(0.0);
        estimated_params_map.insert(param_name.clone(), (i, beta_val, g_ii));
    }

    for param_name_display in &display_parameter_names {
        let (
            final_b,
            final_std_err,
            final_t_val,
            final_param_sig,
            final_ci_lower,
            final_ci_upper,
            final_partial_eta_sq,
            final_non_cent_param,
            final_obs_power,
            is_redundant_param,
        ) = if let Some((_idx, beta_val, g_ii)) = estimated_params_map.get(param_name_display) {
            // This is an estimable parameter (non-reference or non-aliased part of reference)
            let is_redundant = g_ii.abs() < 1e-9 || g_ii.is_nan();
            term_is_aliased_map
                .entry(
                    param_name_display.split('=').next().unwrap_or(param_name_display).to_string()
                )
                .and_modify(|e| {
                    *e = *e || is_redundant;
                })
                .or_insert(is_redundant);

            if is_redundant {
                (
                    0.0,
                    f64::NAN,
                    f64::NAN,
                    f64::NAN,
                    f64::NAN,
                    f64::NAN,
                    f64::NAN,
                    f64::NAN,
                    f64::NAN,
                    true,
                )
            } else {
                let std_err = if mse.is_nan() || mse < 0.0 || *g_ii < 0.0 {
                    f64::NAN
                } else {
                    (mse * *g_ii).sqrt()
                };
                let t_val = if std_err.is_nan() || std_err.abs() < 1e-9 {
                    f64::NAN
                } else {
                    *beta_val / std_err
                };
                let param_sig = if t_val.is_nan() || df_error_usize == 0 {
                    f64::NAN
                } else {
                    calculate_t_significance(t_val.abs(), df_error_usize)
                };
                let t_crit = if df_error_usize == 0 {
                    f64::NAN
                } else {
                    calculate_t_critical(sig_level_opt, df_error_usize)
                };
                let (ci_lower, ci_upper) = if t_crit.is_nan() || std_err.is_nan() {
                    (f64::NAN, f64::NAN)
                } else {
                    (*beta_val - t_crit * std_err, *beta_val + t_crit * std_err)
                };
                let non_cent_param = if t_val.is_nan() { f64::NAN } else { t_val.abs() };
                let obs_power = if t_val.is_nan() || df_error_usize == 0 {
                    f64::NAN
                } else {
                    calculate_observed_power_t(t_val.abs(), df_error_usize, sig_level_opt)
                };
                let partial_eta_sq_val = if t_val.is_nan() {
                    f64::NAN
                } else if df_error_val == 0.0 {
                    if beta_val.abs() > 1e-9 { 1.0 } else { f64::NAN }
                } else {
                    let t_sq = t_val.powi(2);
                    let den = t_sq + df_error_val;
                    if den.abs() > 1e-12 {
                        (t_sq / den).max(0.0).min(1.0)
                    } else {
                        if t_sq.abs() < 1e-12 { 0.0 } else { f64::NAN }
                    }
                };
                (
                    *beta_val,
                    std_err,
                    t_val,
                    param_sig,
                    ci_lower,
                    ci_upper,
                    partial_eta_sq_val,
                    non_cent_param,
                    obs_power,
                    false,
                )
            }
        } else {
            // This is a reference parameter not in actual_beta_names
            term_is_aliased_map
                .entry(
                    param_name_display.split('=').next().unwrap_or(param_name_display).to_string()
                )
                .or_insert(false); // Not aliased by default, but b=0
            (
                0.0,
                f64::NAN,
                f64::NAN,
                f64::NAN,
                f64::NAN,
                f64::NAN,
                f64::NAN,
                f64::NAN,
                f64::NAN,
                false,
            ) // Not redundant in the sense of g_ii, but b=0 by definition
        };

        estimates.push(ParameterEstimateEntry {
            parameter: param_name_display.clone(),
            b: final_b,
            std_error: final_std_err,
            t_value: final_t_val,
            significance: final_param_sig,
            confidence_interval: ConfidenceInterval {
                lower_bound: final_ci_lower,
                upper_bound: final_ci_upper,
            },
            partial_eta_squared: final_partial_eta_sq,
            noncent_parameter: final_non_cent_param,
            observed_power: final_obs_power,
        });
    }

    // Add notes for aliased parameters if any
    let mut notes = Vec::new();
    let mut aliased_terms_for_note: Vec<String> = term_is_aliased_map
        .iter()
        .filter(|(_, &is_aliased)| is_aliased)
        .map(|(term_name, _)| term_name.clone())
        .collect();
    aliased_terms_for_note.sort(); // Sort for consistent note ordering
    aliased_terms_for_note.dedup();

    // Note letter counter
    let mut note_letter = 'a';

    if !aliased_terms_for_note.is_empty() {
        let note_message =
            format!("{}. This parameter is set to zero because it is redundant.", note_letter);
        notes.push(note_message);
        note_letter = ((note_letter as u8) + 1) as char;
    }

    if df_error_val == 0.0 {
        notes.push(
            format!("{}. Degrees of freedom for error are 0. Statistics depending on df_error (like t-tests, CIs, Obs. Power, Significance) may not be computable or meaningful.", note_letter)
        );
        note_letter = ((note_letter as u8) + 1) as char;
    }

    // Add note about significance level used in computations
    notes.push(format!("{}. Computed using alpha = {:.2}", note_letter, sig_level));
    note_letter = ((note_letter as u8) + 1) as char;

    // Add note about observed power calculation
    notes.push(
        format!(
            "{}. Observed Power (for t-tests) is computed using alpha = {:.2} for its critical value.",
            note_letter,
            sig_level
        )
    );

    Ok(ParameterEstimates { estimates, notes })
}

// Helper function to generate parameter names dynamically
fn generate_parameter_names(
    model_terms: &Vec<String>,
    factor_levels_map: &HashMap<String, Vec<String>>,
    config: &UnivariateConfig
) -> Vec<String> {
    let mut param_names = Vec::new();

    // Add intercept if present
    if config.model.intercept && model_terms.contains(&"Intercept".to_string()) {
        param_names.push("Intercept".to_string());
    }

    // Add main effects
    for term in model_terms {
        if !term.contains('*') && term != "Intercept" {
            if let Some(levels) = factor_levels_map.get(term) {
                for level in levels {
                    param_names.push(format!("[{}={}]", term, level));
                }
            }
        }
    }

    // Add interactions
    for term in model_terms {
        if term.contains('*') {
            let factors = factor_utils::parse_interaction_term(term);
            let mut level_combinations = Vec::new();

            // Generate all possible level combinations
            let mut current_indices = vec![0; factors.len()];
            'outer: loop {
                let mut combination = Vec::new();
                for (i, factor) in factors.iter().enumerate() {
                    if let Some(levels) = factor_levels_map.get(factor) {
                        combination.push(format!("[{}={}]", factor, levels[current_indices[i]]));
                    }
                }
                level_combinations.push(combination.join("*"));

                // Increment indices
                let mut i = factors.len() - 1;
                loop {
                    if let Some(levels) = factor_levels_map.get(&factors[i]) {
                        current_indices[i] += 1;
                        if current_indices[i] < levels.len() {
                            break;
                        }
                        current_indices[i] = 0;
                    }
                    if i == 0 {
                        break 'outer;
                    }
                    i -= 1;
                }
            }
            param_names.extend(level_combinations);
        }
    }

    param_names
}
