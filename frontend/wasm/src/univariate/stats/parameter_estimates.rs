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

    web_sys::console::log_1(&format!("Design Matrix X:\n{:?}", design_info.x).into());
    web_sys::console::log_1(&format!("Response Vector Y:\n{:?}", design_info.y).into());

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
    web_sys::console::log_1(
        &format!("g_inv_matrix in calculate_parameter_estimates: {:?}", g_inv_matrix).into()
    ); // Log g_inv_matrix
    let rss = swept_info.s_rss;
    web_sys::console::log_1(&format!("RSS (Residual Sum of Squares): {:?}", rss).into());

    let n_samples = design_info.n_samples;
    web_sys::console::log_1(&format!("n_samples (Number of samples): {:?}", n_samples).into());
    let r_x_rank = design_info.r_x_rank;
    web_sys::console::log_1(
        &format!("p_parameters: {}, r_x_rank: {}", design_info.p_parameters, r_x_rank).into()
    );

    let df_error_val = if n_samples > r_x_rank { (n_samples - r_x_rank) as f64 } else { 0.0 };
    web_sys::console::log_1(
        &format!("df_error_val (Degrees of freedom for error): {:?}", df_error_val).into()
    );

    if df_error_val < 0.0 {
        return Err(
            format!("Degrees of freedom for error ({}) must be non-negative.", df_error_val)
        );
    }
    let df_error_usize = df_error_val as usize;

    let mse = if df_error_val > 0.0 { rss / df_error_val } else { f64::NAN };
    web_sys::console::log_1(&format!("MSE (Mean Squared Error): {:?}", mse).into());
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
            levels.sort(); // Ensure levels are sorted
            factor_levels_map.insert(factor.clone(), levels);
        }
    }

    // term_is_aliased tracks if ANY parameter within a term (e.g. any level of a factor) is aliased.
    let mut term_is_aliased_map: HashMap<String, bool> = HashMap::new();

    // We'll track all term columns and match them with design matrix columns
    let mut param_names = vec![String::new(); design_info.p_parameters];
    let mut col_offset = 0;

    // Process each model term to assign parameter names
    for term_name in &model_terms {
        // Check if this term exists in the design matrix
        if let Some((start_idx, end_idx)) = design_info.term_column_indices.get(term_name) {
            let num_cols_for_term = end_idx - start_idx + 1;

            if term_name == "Intercept" {
                if num_cols_for_term == 1 && col_offset < param_names.len() {
                    param_names[col_offset] = "Intercept".to_string();
                    col_offset += 1;
                }
            } else if config.main.covar.as_ref().map_or(false, |covars| covars.contains(term_name)) {
                // Covariate term
                if num_cols_for_term == 1 && col_offset < param_names.len() {
                    param_names[col_offset] = term_name.clone();
                    col_offset += 1;
                }
            } else if term_name.contains('*') {
                // Interaction term
                let factors = factor_utils::parse_interaction_term(term_name);
                let mut factor_levels: Vec<Vec<String>> = Vec::new();
                let mut level_counts: Vec<usize> = Vec::new();

                for factor_name in &factors {
                    if let Some(levels) = factor_levels_map.get(factor_name) {
                        // For each factor, we use (levels.len() - 1) parameters (last level is reference)
                        level_counts.push(levels.len().saturating_sub(1));
                        factor_levels.push(levels.clone()); // Already sorted
                    } else {
                        let mut levels = get_factor_levels(data, factor_name)?;
                        levels.sort(); // Ensure levels are sorted
                        factor_levels_map.insert(factor_name.clone(), levels.clone());
                        level_counts.push(levels.len().saturating_sub(1));
                        factor_levels.push(levels);
                    }
                }

                // Generate parameter names for interaction terms based on the actual columns in design matrix
                if num_cols_for_term > 0 {
                    // Create all combinations of non-reference levels
                    let mut combinations = Vec::new();

                    // Initialize with first factor's levels
                    for i in 0..level_counts[0] {
                        let level = factor_levels[0][i].clone();
                        combinations.push(vec![(0, i, level)]);
                    }

                    // Add each subsequent factor's levels to create all combinations
                    for factor_idx in 1..factors.len() {
                        let mut new_combinations = Vec::new();

                        for combo in combinations {
                            for level_idx in 0..level_counts[factor_idx] {
                                let level = factor_levels[factor_idx][level_idx].clone();
                                let mut new_combo = combo.clone();
                                new_combo.push((factor_idx, level_idx, level));
                                new_combinations.push(new_combo);
                            }
                        }

                        combinations = new_combinations;
                    }

                    // Convert combinations to parameter names, limiting to the actual number of columns
                    for _ in 0..num_cols_for_term {
                        if col_offset < param_names.len() && !combinations.is_empty() {
                            let combo = &combinations.remove(0);
                            let mut param_parts = Vec::new();
                            for (factor_idx, _, level) in combo {
                                param_parts.push(format!("[{}={}]", factors[*factor_idx], level));
                            }
                            param_names[col_offset] = param_parts.join("*");
                            col_offset += 1;
                        }
                    }
                }
            } else {
                // Main effect (single factor)
                let levels = if let Some(levels) = factor_levels_map.get(term_name) {
                    levels.clone() // Already sorted
                } else {
                    let mut levels = get_factor_levels(data, term_name)?;
                    levels.sort(); // Ensure levels are sorted
                    factor_levels_map.insert(term_name.clone(), levels.clone());
                    levels
                };

                // Use the actual number of columns from the design matrix
                for i in 0..num_cols_for_term {
                    if col_offset < param_names.len() && i < levels.len() - 1 {
                        param_names[col_offset] = format!("[{}={}]", term_name, levels[i]);
                        col_offset += 1;
                    }
                }
            }
        }
    }

    // Make sure all parameters have names, including those we might have missed
    for i in 0..param_names.len() {
        if param_names[i].is_empty() {
            // Only assign generic names if we didn't already build proper names
            param_names[i] = format!("{}", i + 1);
        }
    }

    // Process parameter estimates
    for i in 0..design_info.p_parameters {
        let param_name = &param_names[i];
        let beta_val = beta_hat_vec.get(i).cloned().unwrap_or(0.0);
        let g_ii = g_inv_matrix.get((i, i)).cloned().unwrap_or(0.0); // g_ii for this parameter

        web_sys::console::log_1(&format!("Param: {}, g_ii: {}", param_name, g_ii).into()); // Log param_name and g_ii

        // Determine if parameter is redundant based on g_ii (from G inverse of X\'WX)
        // A very small or NaN g_ii indicates redundancy/collinearity.
        let is_redundant = g_ii.abs() < 1e-9 || g_ii.is_nan();

        // Extract the base term name for aliasing tracking (used for notes)
        let base_term_name_for_aliasing = if
            param_name.starts_with("[") &&
            param_name.contains("]")
        {
            param_name
                .replace("[", "")
                .replace("]", "")
                .split("*")
                .map(|part| part.split('=').next().unwrap_or("").trim())
                .filter(|s| !s.is_empty())
                .collect::<Vec<&str>>()
                .join("*")
        } else if
            param_name == "Intercept" ||
            config.main.covar.as_ref().map_or(false, |cv| cv.contains(param_name))
        {
            param_name.clone()
        } else {
            param_name.split('=').next().unwrap_or(param_name).to_string()
        };

        // Update the term_is_aliased_map based on redundancy
        term_is_aliased_map
            .entry(base_term_name_for_aliasing.clone()) // Use clone for aliasing map key
            .and_modify(|e| {
                *e = *e || is_redundant;
            })
            .or_insert(is_redundant);

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
        ) = if is_redundant {
            (
                0.0, // b_ij
                f64::NAN, // std_error (SYSMIS)
                f64::NAN, // t_value (SYSMIS)
                f64::NAN, // significance (SYSMIS)
                f64::NAN, // ci_lower (SYSMIS)
                f64::NAN, // ci_upper (SYSMIS)
                f64::NAN, // partial_eta_squared (SYSMIS)
                f64::NAN, // noncent_parameter (SYSMIS)
                f64::NAN, // observed_power (SYSMIS)
            )
        } else {
            // Standard Error: se(b_ij) = sqrt(mse * g_ii)
            // mse (sigma_jj_hat in doc) is scalar for univariate.
            // g_ii is the diagonal element from G = (X\'WX)^-1 for parameter i.
            let std_err = if mse.is_nan() || mse < 0.0 || g_ii < 0.0 {
                // g_ii must be positive for non-redundant
                f64::NAN
            } else {
                (mse * g_ii).sqrt()
            };

            // t-statistic: t = b_ij / se(b_ij)
            let t_val = if std_err.is_nan() || std_err.abs() < 1e-9 {
                // Check if se is positive
                f64::NAN // SYSMIS if std_err is not positive
            } else {
                beta_val / std_err
            };

            // Significance: 2 * (1 - CDF.T(|t|, N - r_X))
            let param_sig = if t_val.is_nan() || df_error_usize == 0 {
                f64::NAN
            } else {
                calculate_t_significance(t_val.abs(), df_error_usize) // t_val.abs() for two-tailed
            };

            // Critical t for Confidence Interval
            // t_alpha = IDF.T(0.5 * (1 + p/100), N - r_X)
            // where p is confidence level (e.g., 95 for 95%). config.options.sig_level is alpha (e.g. 0.05)
            // So, for CI, we need 1 - alpha/2. For example, if sig_level (alpha) is 0.05, then 1 - 0.05/2 = 0.975
            let t_crit_ci_prob = 1.0 - sig_level / 2.0;
            let t_crit = if df_error_usize == 0 {
                f64::NAN
            } else {
                // calculate_t_critical expects alpha (sig_level) for two-tailed,
                // or 1-prob for one-tailed from IDF.T.
                // Assuming calculate_t_critical takes sig_level (alpha) and handles two-tailed nature.
                calculate_t_critical(sig_level_opt, df_error_usize)
            };

            // Confidence Interval: b_ij +/- t_alpha * se(b_ij)
            let (ci_lower, ci_upper) = if t_crit.is_nan() || std_err.is_nan() {
                (f64::NAN, f64::NAN)
            } else {
                (beta_val - t_crit * std_err, beta_val + t_crit * std_err)
            };

            // Noncentrality Parameter: c = |t|
            let non_cent_param = if t_val.is_nan() { f64::NAN } else { t_val.abs() };

            // Observed Power
            // Uses fixed alpha = 0.05 for t_c calculation for power.
            // t_c = IDF.T(1 - 0.05/2, N - r_X) = IDF.T(0.975, N - r_X)
            let power_alpha = 0.05;
            let obs_power = if t_val.is_nan() || df_error_usize == 0 {
                f64::NAN
            } else {
                calculate_observed_power_t(t_val.abs(), df_error_usize, Some(power_alpha))
            };

            // Partial Eta Squared
            // eta^2 = t^2 / (t^2 + df_error) if df_error > 0
            // eta^2 = 1 if df_error == 0 and b_ij != 0
            // eta^2 = SYSMIS if df_error == 0 and b_ij == 0
            // eta^2 = SYSMIS otherwise (e.g. t_val is NaN)
            let partial_eta_sq_val = if t_val.is_nan() {
                f64::NAN // SYSMIS if t is not computable
            } else if df_error_val == 0.0 {
                // r_X = N (degrees of freedom for error is 0)
                if beta_val.abs() > 1e-9 {
                    // b_ij != 0
                    1.0
                } else {
                    // b_ij == 0
                    f64::NAN // SYSMIS
                }
            } else {
                // df_error_val > 0 (r_X < N)
                if t_val.is_infinite() {
                    1.0 // If t is infinite and df_error > 0, effect explains all possible variance.
                } else {
                    // t_val is finite and df_error_val > 0
                    let t_sq = t_val.powi(2);
                    let denominator = t_sq + df_error_val;
                    // Denominator should be positive because df_error_val > 0 and t_sq >= 0.
                    // Check for denominator being very close to zero for numerical stability.
                    if denominator.abs() > 1e-12 {
                        (t_sq / denominator).max(0.0).min(1.0) // Ensure 0 <= eta^2 <= 1
                    } else {
                        // This case implies t_sq is also near zero, as df_error_val > 0.
                        // If denominator is zero, and t_sq is zero, result is 0.
                        // If denominator is zero, and t_sq is not, it's an issue (but shouldn't happen here).
                        if t_sq.abs() < 1e-12 {
                            0.0
                        } else {
                            f64::NAN // Should not be reached if logic is sound for df_error_val > 0
                        }
                    }
                }
            };

            (
                beta_val,
                std_err,
                t_val,
                param_sig,
                ci_lower,
                ci_upper,
                partial_eta_sq_val,
                non_cent_param,
                obs_power,
            )
        };

        estimates.push(ParameterEstimateEntry {
            parameter: param_name.clone(),
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

    // Add entries for reference categories of fixed factors
    if let Some(fixed_factors_config) = &config.main.fix_factor {
        for factor_name in fixed_factors_config {
            // Check if the term itself (any of its non-reference levels) was NOT aliased.
            // If the whole term was aliased, SPSS might omit reference levels or show them as aliased.
            // Here, we add it if the *term* wasn't marked as fully aliased.
            // The term_is_aliased_map tracks if *any* parameter of a term is aliased. We want the opposite.
            // Let's refine: only add reference if the factor itself is present in design_info (meaning it has non-ref params)
            if design_info.term_column_indices.contains_key(factor_name) {
                if let Some(levels) = factor_levels_map.get(factor_name) {
                    if !levels.is_empty() {
                        let ref_level_name = levels.last().unwrap(); // Assuming last level is reference
                        let ref_param_name = format!("[{}={}]", factor_name, ref_level_name);

                        // Check if this specific reference parameter name already exists (e.g. from a different logic path or if it was somehow estimated)
                        if !estimates.iter().any(|est| est.parameter == ref_param_name) {
                            estimates.push(ParameterEstimateEntry {
                                parameter: ref_param_name,
                                b: 0.0, // Reference parameters are 0 by definition
                                std_error: f64::NAN,
                                t_value: f64::NAN,
                                significance: f64::NAN,
                                confidence_interval: ConfidenceInterval {
                                    lower_bound: f64::NAN,
                                    upper_bound: f64::NAN,
                                },
                                partial_eta_squared: f64::NAN,
                                noncent_parameter: f64::NAN,
                                observed_power: f64::NAN,
                            });
                        }
                    }
                }
            }
        }
    }

    // Add reference combinations for interaction terms
    for term_name in &model_terms {
        if term_name.contains('*') {
            let factors = factor_utils::parse_interaction_term(term_name);

            // Generate combinations involving reference levels
            let mut factor_level_maps: Vec<Vec<(String, String)>> = Vec::new();

            for factor_name in &factors {
                if let Some(levels) = factor_levels_map.get(factor_name) {
                    if !levels.is_empty() {
                        let mut current_levels = Vec::new();

                        // Include all levels for this factor
                        for level in levels {
                            current_levels.push((factor_name.clone(), level.clone()));
                        }

                        if !current_levels.is_empty() {
                            factor_level_maps.push(current_levels);
                        }
                    }
                }
            }

            // Generate all combinations that include at least one reference level
            if !factor_level_maps.is_empty() {
                let mut all_combinations = Vec::new();
                let mut current_combination = Vec::new();

                // Helper function to generate combinations recursively
                fn generate_combinations(
                    factor_level_maps: &[Vec<(String, String)>],
                    index: usize,
                    current: &mut Vec<(String, String)>,
                    result: &mut Vec<Vec<(String, String)>>,
                    include_reference: bool
                ) {
                    if index == factor_level_maps.len() {
                        if include_reference {
                            result.push(current.clone());
                        }
                        return;
                    }

                    let levels = &factor_level_maps[index];

                    // Try each level for this factor
                    for (i, level_pair) in levels.iter().enumerate() {
                        let is_reference = i == levels.len() - 1; // Last level is reference

                        current.push(level_pair.clone());
                        // If this level is a reference or we've already decided to include
                        generate_combinations(
                            factor_level_maps,
                            index + 1,
                            current,
                            result,
                            include_reference || is_reference
                        );
                        current.pop();
                    }
                }

                // Generate all combinations that include at least one reference level
                generate_combinations(
                    &factor_level_maps,
                    0,
                    &mut current_combination,
                    &mut all_combinations,
                    false
                );

                // Convert combinations to parameter names and add to estimates
                for combo in all_combinations {
                    // Skip combinations that don't have at least one reference level
                    let has_reference = combo
                        .iter()
                        .enumerate()
                        .any(|(i, (factor, level))| {
                            if let Some(levels) = factor_levels_map.get(factor) {
                                if !levels.is_empty() && i < factor_level_maps.len() {
                                    // Check if this is the reference level (last level in the list)
                                    levels.last().map_or(false, |ref_level| level == ref_level)
                                } else {
                                    false
                                }
                            } else {
                                false
                            }
                        });

                    if !has_reference {
                        continue;
                    }

                    // Build parameter name from combination
                    let param_parts: Vec<String> = combo
                        .iter()
                        .map(|(factor, level)| format!("[{}={}]", factor, level))
                        .collect();

                    let param_name = param_parts.join("*");

                    // Only add if not already in estimates
                    if !estimates.iter().any(|est| est.parameter == param_name) {
                        // If this is a combination with a reference level, add it with b=0
                        estimates.push(ParameterEstimateEntry {
                            parameter: param_name,
                            b: 0.0, // Reference parameters are 0 by definition
                            std_error: f64::NAN,
                            t_value: f64::NAN,
                            significance: f64::NAN,
                            confidence_interval: ConfidenceInterval {
                                lower_bound: f64::NAN,
                                upper_bound: f64::NAN,
                            },
                            partial_eta_squared: f64::NAN,
                            noncent_parameter: f64::NAN,
                            observed_power: f64::NAN,
                        });
                    }
                }
            }
        }
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
    notes.push(format!("{}. Observed Power is computed using alpha = .05", note_letter));

    Ok(ParameterEstimates { estimates, notes })
}
