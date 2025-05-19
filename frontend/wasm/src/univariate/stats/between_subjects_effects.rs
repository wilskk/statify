use std::collections::HashMap;

use crate::univariate::models::{
    config::{ SumOfSquaresMethod, UnivariateConfig },
    data::{ AnalysisData, DataValue },
    result::{ TestEffectEntry, TestsBetweenSubjectsEffects },
};

use super::core::*;

/// Calculate between-subjects effects for the statistical model
pub fn calculate_tests_between_subjects_effects(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<TestsBetweenSubjectsEffects, String> {
    if data.dependent_data.is_empty() {
        return Err("No dependent data available".to_string());
    }

    let dep_var_name = match &config.main.dep_var {
        Some(name) => name,
        None => {
            return Err("No dependent variable specified in configuration".to_string());
        }
    };

    let mut source = HashMap::new();
    let n_total = count_total_cases(data);

    // Extract all dependent values
    let mut all_values = Vec::new();
    for records in &data.dependent_data {
        for record in records {
            if let Some(value) = extract_dependent_value(record, dep_var_name) {
                all_values.push(value);
            }
        }
    }

    // Apply WLS weights if specified
    let mut weighted_values = all_values.clone();
    if let Some(wls_weight) = &config.main.wls_weight {
        let mut weights = Vec::new();
        let mut found_wls = false;

        // Try to find WLS weights in the data
        if let Some(wls_data) = &data.wls_data {
            for records in wls_data {
                for record in records {
                    if let Some(value) = extract_wls_weight(record, wls_weight) {
                        weights.push(value);
                        found_wls = true;
                    }
                }
            }
        }

        if !found_wls || weights.len() != all_values.len() {
            return Err(
                format!("Could not find WLS weight '{}' or weight count doesn't match data", wls_weight)
            );
        }

        // Apply weights to values
        weighted_values = apply_weights(&all_values, &weights);
    }

    // Calculate grand mean and total sum of squares (using weighted values if applicable)
    let grand_mean = if config.main.wls_weight.is_some() {
        calculate_mean(&weighted_values)
    } else {
        calculate_mean(&all_values)
    };

    let ss_total = if config.main.wls_weight.is_some() {
        weighted_values
            .iter()
            .map(|val| (val - grand_mean).powi(2))
            .sum::<f64>()
    } else {
        all_values
            .iter()
            .map(|val| (val - grand_mean).powi(2))
            .sum::<f64>()
    };

    // Calculate sum of squares based on the requested method
    let mut ss_model = 0.0;
    let factor_combinations = get_factor_combinations(data, config)?;

    // Generate model terms using the new function based on config.model settings
    let model_terms = generate_model_design_terms(data, config)?;

    // Extract factors and interactions from the model terms
    let mut factors = Vec::new();
    let mut interaction_terms = Vec::new();

    for term in &model_terms {
        if term == "Intercept" {
            continue; // Skip intercept as it's processed separately
        } else if term.contains('*') || term.contains("WITHIN") || term.contains('(') {
            // This is an interaction or nesting term
            interaction_terms.push(term.clone());
        } else if !config.main.covar.as_ref().map_or(false, |covars| covars.contains(term)) {
            // This is a factor (not a covariate)
            factors.push(term.clone());
        }
    }

    // Add intercept
    if config.model.intercept {
        let ss_intercept = (n_total as f64) * grand_mean.powi(2);
        ss_model += ss_intercept;

        // Create test effect entry for intercept
        let error_df = n_total - 1;
        let error_ms = ss_total / (error_df as f64);

        source.insert(
            "Intercept".to_string(),
            create_effect_entry(ss_intercept, 1, error_ms, error_df, config.options.sig_level)
        );
    }

    // Track total effects count for df calculations
    let mut total_effects = 0;

    // Process covariates if present
    if let Some(covariates) = &config.main.covar {
        total_effects += covariates.len();
    }

    // Process the factors and interactions based on the model terms
    total_effects += factors.len();
    total_effects += interaction_terms.len();

    // Choose the appropriate sum of squares method
    let values_to_use = if config.main.wls_weight.is_some() {
        &weighted_values
    } else {
        &all_values
    };

    match config.model.sum_of_square_method {
        SumOfSquaresMethod::TypeI => {
            process_type_i_factors_and_interactions(
                data,
                config,
                &factors,
                &interaction_terms,
                dep_var_name,
                grand_mean,
                values_to_use,
                n_total,
                ss_total,
                config.options.sig_level,
                &mut ss_model,
                &mut source
            )?;
        }
        SumOfSquaresMethod::TypeII => {
            process_type_ii_factors_and_interactions(
                data,
                &factors,
                &interaction_terms,
                dep_var_name,
                grand_mean,
                n_total,
                ss_total,
                config.options.sig_level,
                &mut ss_model,
                &mut source
            )?;
        }
        SumOfSquaresMethod::TypeIII =>
            process_type_iii_factors_and_interactions(
                data,
                &factors,
                &interaction_terms,
                dep_var_name,
                grand_mean,
                n_total,
                ss_total,
                config.options.sig_level,
                &mut ss_model,
                &mut source
            )?,
        SumOfSquaresMethod::TypeIV =>
            process_type_iv_factors_and_interactions(
                data,
                &factors,
                &interaction_terms,
                dep_var_name,
                grand_mean,
                n_total,
                ss_total,
                config.options.sig_level,
                &mut ss_model,
                &mut source
            )?,
    }

    // Process random factors if present
    if let Some(random_factors) = &config.main.rand_factor {
        total_effects += random_factors.len();

        // For each random factor, calculate its effect
        for random_factor in random_factors {
            let factor_levels = get_random_factor_levels(data, random_factor)?;
            let df = factor_levels.len() - 1;

            // Get random factor effects
            let random_effects = apply_random_factor_structure(
                data,
                &[random_factor.clone()],
                dep_var_name
            )?;

            // Calculate SS for this random factor
            let mut factor_ss = 0.0;
            let mut level_n = 0;

            for (_, level_values) in random_effects {
                if !level_values.is_empty() {
                    let level_mean = calculate_mean(&level_values);
                    factor_ss += (level_values.len() as f64) * (level_mean - grand_mean).powi(2);
                    level_n += level_values.len();
                }
            }

            ss_model += factor_ss;

            // Calculate error terms
            let error_df = n_total - df - 1; // -1 for intercept
            let error_ss = ss_total - ss_model;
            let error_ms = if error_df > 0 { error_ss / (error_df as f64) } else { 0.0 };

            // Add test effect entry for this random factor
            source.insert(
                format!("{} (Random)", random_factor),
                create_effect_entry(factor_ss, df, error_ms, error_df, config.options.sig_level)
            );
        }
    }

    // Calculate the total number of interaction terms
    let interaction_terms_count = interaction_terms.len();
    total_effects += interaction_terms_count;

    // Calculate error degrees of freedom, adjusting for all effects
    let df_error = n_total - (if config.model.intercept { 1 } else { 0 }) - total_effects;

    // Calculate error sum of squares and mean square
    let ss_error = ss_total - ss_model;
    let ms_error = if df_error > 0 { ss_error / (df_error as f64) } else { 0.0 };

    // Add error term
    source.insert("Error".to_string(), TestEffectEntry {
        sum_of_squares: ss_error,
        df: df_error,
        mean_square: ms_error,
        f_value: 0.0, // Not applicable for error
        significance: 0.0, // Not applicable for error
        partial_eta_squared: 0.0, // Not applicable for error
        noncent_parameter: 0.0, // Not applicable for error
        observed_power: 0.0, // Not applicable for error
    });

    // Calculate total sum of squares (use raw or weighted values as appropriate)
    let total_ss = if config.main.wls_weight.is_some() {
        weighted_values
            .iter()
            .map(|x| x.powi(2))
            .sum::<f64>()
    } else {
        all_values
            .iter()
            .map(|x| x.powi(2))
            .sum::<f64>()
    };

    // Add total
    source.insert("Total".to_string(), TestEffectEntry {
        sum_of_squares: total_ss,
        df: n_total,
        mean_square: 0.0, // Not applicable for total
        f_value: 0.0, // Not applicable for total
        significance: 0.0, // Not applicable for total
        partial_eta_squared: 0.0, // Not applicable for total
        noncent_parameter: 0.0, // Not applicable for total
        observed_power: 0.0, // Not applicable for total
    });

    // Add corrected total
    source.insert("Corrected Total".to_string(), TestEffectEntry {
        sum_of_squares: ss_total,
        df: n_total - 1,
        mean_square: 0.0, // Not applicable for corrected total
        f_value: 0.0, // Not applicable for corrected total
        significance: 0.0, // Not applicable for corrected total
        partial_eta_squared: 0.0, // Not applicable for corrected total
        noncent_parameter: 0.0, // Not applicable for corrected total
        observed_power: 0.0, // Not applicable for corrected total
    });

    // Calculate model degrees of freedom, accounting for all effects
    let model_df = total_effects + (if config.model.intercept { 1 } else { 0 }) - 1;

    // Add corrected model with all effects included
    let model_ms = if model_df > 0 { ss_model / (model_df as f64) } else { 0.0 };
    let model_f = if ms_error > 0.0 { model_ms / ms_error } else { 0.0 };
    let model_sig = calculate_f_significance(model_df, df_error, model_f);
    let model_eta = if ss_total > 0.0 { ss_model / ss_total } else { 0.0 };
    let model_noncent = model_f * (model_df as f64);
    let model_power = calculate_observed_power(
        model_df,
        df_error,
        model_f,
        config.options.sig_level
    );

    source.insert("Corrected Model".to_string(), TestEffectEntry {
        sum_of_squares: ss_model,
        df: model_df,
        mean_square: model_ms,
        f_value: model_f,
        significance: model_sig,
        partial_eta_squared: model_eta,
        noncent_parameter: model_noncent,
        observed_power: model_power,
    });

    // Calculate R-squared and adjusted R-squared
    let r_squared = if ss_total > 0.0 { ss_model / ss_total } else { 0.0 };
    let adjusted_r_squared =
        1.0 - ((1.0 - r_squared) * ((n_total - 1) as f64)) / ((n_total - model_df - 1) as f64);

    Ok(TestsBetweenSubjectsEffects {
        source,
        r_squared,
        adjusted_r_squared,
    })
}
