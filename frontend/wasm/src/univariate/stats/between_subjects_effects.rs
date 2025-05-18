use std::collections::HashMap;

use crate::univariate::models::{
    config::{ SumOfSquaresMethod, UnivariateConfig },
    data::{ AnalysisData, DataValue },
    result::{ TestEffectEntry, TestsBetweenSubjectsEffects },
};

use super::{
    common::{
        calculate_mean,
        calculate_f_significance,
        calculate_observed_power,
        count_total_cases,
        extract_dependent_value,
        get_factor_combinations,
    },
    matrix_utils::{ matrix_multiply, matrix_transpose, matrix_inverse, matrix_vec_multiply },
    design_matrix::{
        create_main_effect_design_matrix,
        create_interaction_design_matrix,
        create_contrast_coded_main_effect_matrix,
        create_contrast_coded_interaction_matrix,
        create_type_iv_main_effect_matrix,
        create_type_iv_interaction_matrix,
    },
    factor_utils::{
        calculate_interaction_df,
        check_for_missing_cells,
        generate_level_combinations,
        parse_interaction_term,
    },
    sum_of_squares::{
        calculate_factor_ss,
        calculate_interaction_ss,
        calculate_raw_factor_ss,
        calculate_raw_interaction_ss,
        generate_interaction_terms,
    },
    processing::{
        create_effect_entry,
        process_type_i_factors_and_interactions,
        process_type_ii_factors_and_interactions,
        process_type_iii_factors_and_interactions,
        process_type_iv_factors_and_interactions,
    },
};

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

    // Calculate grand mean and total sum of squares
    let grand_mean = calculate_mean(&all_values);
    let ss_total = all_values
        .iter()
        .map(|val| (val - grand_mean).powi(2))
        .sum::<f64>();

    // Calculate sum of squares based on the requested method
    let mut ss_model = 0.0;
    let factor_combinations = get_factor_combinations(data, config)?;

    // Generate all interaction terms if we have fixed factors
    let mut interaction_terms = Vec::new();
    if let Some(factors) = &config.main.fix_factor {
        if factors.len() > 1 {
            interaction_terms = generate_interaction_terms(factors);
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

    // Process factors and interactions based on sum of squares method
    if let Some(factors) = &config.main.fix_factor {
        match config.model.sum_of_square_method {
            SumOfSquaresMethod::TypeI => {
                process_type_i_factors_and_interactions(
                    data,
                    factors,
                    &interaction_terms,
                    dep_var_name,
                    grand_mean,
                    &all_values,
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
                    factors,
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
                    factors,
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
                    factors,
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
    }

    // Calculate the total number of interaction terms
    let interaction_terms_count = interaction_terms.len();

    // Calculate error degrees of freedom, adjusting for interactions
    let df_error =
        n_total -
        (if config.model.intercept { 1 } else { 0 }) -
        (if let Some(factors) = &config.main.fix_factor { factors.len() } else { 0 }) -
        interaction_terms_count;

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

    // Add total
    source.insert("Total".to_string(), TestEffectEntry {
        sum_of_squares: all_values
            .iter()
            .map(|x| x.powi(2))
            .sum::<f64>(),
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

    // Add corrected model with interaction terms included
    let model_df = if let Some(factors) = &config.main.fix_factor {
        factors.len() + interaction_terms_count + (if config.model.intercept { 1 } else { 0 }) - 1
    } else {
        (if config.model.intercept { 1 } else { 0 }) - 1
    };

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

    // Calculate R-squared statistics, adjusting for interaction terms
    let r_squared = if ss_total > 0.0 { ss_model / ss_total } else { 0.0 };
    let adjusted_r_squared =
        1.0 -
        (1.0 - r_squared) *
            (((n_total - 1) as f64) /
                ((n_total - factor_combinations.len() - interaction_terms_count) as f64));

    Ok(TestsBetweenSubjectsEffects {
        source,
        r_squared,
        adjusted_r_squared,
    })
}
