use std::collections::HashMap;

use crate::univariate::models::{
    config::SumOfSquaresMethod,
    data::AnalysisData,
    result::TestEffectEntry,
};

use crate::univariate::stats::{
    common::{
        calculate_f_significance,
        calculate_mean,
        calculate_observed_power,
        extract_dependent_value,
        get_factor_levels,
    },
    design_matrix::{ create_main_effect_design_matrix, create_interaction_design_matrix },
    factor_utils::{ calculate_interaction_df, check_for_missing_cells, parse_interaction_term },
    sum_of_squares::{
        calculate_factor_ss,
        calculate_interaction_ss,
        calculate_raw_factor_ss,
        calculate_raw_interaction_ss,
        calculate_type_iv_interaction_ss,
    },
    matrix_utils::{ matrix_inverse, matrix_multiply, matrix_transpose, matrix_vec_multiply },
};

/// Create a TestEffectEntry with calculated statistics
pub fn create_effect_entry(
    sum_of_squares: f64,
    df: usize,
    error_ms: f64,
    error_df: usize,
    sig_level: f64
) -> TestEffectEntry {
    let mean_square = if df > 0 { sum_of_squares / (df as f64) } else { 0.0 };
    let f_value = if error_ms > 0.0 { mean_square / error_ms } else { 0.0 };
    let significance = calculate_f_significance(df, error_df, f_value);
    let partial_eta_squared = if sum_of_squares > 0.0 {
        sum_of_squares / (sum_of_squares + error_ms * (error_df as f64))
    } else {
        0.0
    };
    let noncent_parameter = f_value * (df as f64);
    let observed_power = calculate_observed_power(df, error_df, f_value, sig_level);

    TestEffectEntry {
        sum_of_squares,
        df,
        mean_square,
        f_value,
        significance,
        partial_eta_squared,
        noncent_parameter,
        observed_power,
    }
}

/// Process Type I factors and interactions
pub fn process_type_i_factors_and_interactions(
    data: &AnalysisData,
    factors: &[String],
    interaction_terms: &[String],
    dep_var_name: &str,
    grand_mean: f64,
    all_values: &[f64],
    n_total: usize,
    ss_total: f64,
    sig_level: f64,
    ss_model: &mut f64,
    source: &mut HashMap<String, TestEffectEntry>
) -> Result<(), String> {
    // Type I: Sequential SS - each term adjusts for preceding terms in the model

    // Create the complete design matrix Z'WZ with dimensions (p+r)×(p+r)
    // where p is the number of parameters and r is the dependent variables

    // First collect all dependent values
    let mut y_values = all_values.to_vec();

    // Start with residuals as the original values
    let mut residual_values = all_values.to_vec();
    let mut residual_mean = grand_mean;

    // Process main factors sequentially
    for factor in factors {
        let factor_levels = get_factor_levels(data, factor)?;
        let df = factor_levels.len() - 1;

        // Calculate factor SS using the sequential (Type I) approach
        let factor_ss = calculate_factor_ss(
            data,
            factor,
            dep_var_name,
            grand_mean,
            SumOfSquaresMethod::TypeI,
            Some(&residual_values),
            Some(residual_mean)
        )?;

        *ss_model += factor_ss;

        // Update residuals for this factor by applying SWEEP operator to columns
        // corresponding to this factor in the design matrix

        // Create design matrix for this factor
        let x_factor = create_main_effect_design_matrix(data, factor)?;

        // Adjust residuals
        let x_transpose = matrix_transpose(&x_factor);
        let xtx = matrix_multiply(&x_transpose, &x_factor)?;
        let xtx_inv = match matrix_inverse(&xtx) {
            Ok(inv) => inv,
            Err(_) => {
                return Err(format!("Could not invert matrix for factor {}", factor));
            }
        };

        let xty = matrix_vec_multiply(&x_transpose, &residual_values)?;
        let b = matrix_vec_multiply(&xtx_inv, &xty)?;

        // Update residuals: r = y - Xb
        for i in 0..residual_values.len() {
            let mut fitted = 0.0;
            for j in 0..b.len() {
                fitted += x_factor[i][j] * b[j];
            }
            residual_values[i] = residual_values[i] - fitted;
        }

        // Update residual mean
        residual_mean = calculate_mean(&residual_values);

        // Create effect entry
        let error_df =
            n_total -
            (factors
                .iter()
                .take_while(|&f| f != factor)
                .count() +
                1);
        let error_ss = residual_values
            .iter()
            .map(|r| r.powi(2))
            .sum::<f64>();
        let error_ms = if error_df > 0 { error_ss / (error_df as f64) } else { 0.0 };

        source.insert(
            factor.to_string(),
            create_effect_entry(factor_ss, df, error_ms, error_df, sig_level)
        );
    }

    // Process interaction terms sequentially for Type I
    for interaction_term in interaction_terms {
        let df = calculate_interaction_df(data, interaction_term)?;

        // Calculate interaction SS
        let interaction_ss = calculate_interaction_ss(
            data,
            interaction_term,
            dep_var_name,
            grand_mean,
            SumOfSquaresMethod::TypeI,
            factors,
            Some(&residual_values),
            Some(residual_mean)
        )?;

        *ss_model += interaction_ss;

        // Update residuals for this interaction
        let interaction_factors = parse_interaction_term(interaction_term);
        let x_interaction = create_interaction_design_matrix(data, interaction_term)?;

        // Adjust residuals
        let x_transpose = matrix_transpose(&x_interaction);
        let xtx = matrix_multiply(&x_transpose, &x_interaction)?;
        let xtx_inv = match matrix_inverse(&xtx) {
            Ok(inv) => inv,
            Err(_) => {
                return Err(format!("Could not invert matrix for interaction {}", interaction_term));
            }
        };

        let xty = matrix_vec_multiply(&x_transpose, &residual_values)?;
        let b = matrix_vec_multiply(&xtx_inv, &xty)?;

        // Update residuals: r = y - Xb
        for i in 0..residual_values.len() {
            let mut fitted = 0.0;
            for j in 0..b.len() {
                fitted += x_interaction[i][j] * b[j];
            }
            residual_values[i] = residual_values[i] - fitted;
        }

        // Update residual mean
        residual_mean = calculate_mean(&residual_values);

        // Determine error df for this interaction - counts all terms before this one
        let preceding_terms =
            factors.len() +
            interaction_terms
                .iter()
                .take_while(|&t| t != interaction_term)
                .count();
        let error_df = n_total - preceding_terms - 1;
        let error_ss = residual_values
            .iter()
            .map(|r| r.powi(2))
            .sum::<f64>();
        let error_ms = if error_df > 0 { error_ss / (error_df as f64) } else { 0.0 };

        source.insert(
            interaction_term.clone(),
            create_effect_entry(interaction_ss, df, error_ms, error_df, sig_level)
        );
    }

    Ok(())
}

/// Process Type II factors and interactions
pub fn process_type_ii_factors_and_interactions(
    data: &AnalysisData,
    factors: &[String],
    interaction_terms: &[String],
    dep_var_name: &str,
    grand_mean: f64,
    n_total: usize,
    ss_total: f64,
    sig_level: f64,
    ss_model: &mut f64,
    source: &mut HashMap<String, TestEffectEntry>
) -> Result<(), String> {
    // Type II: Each effect adjusted for all other effects except those containing it

    // First, get all values for creating error terms
    let mut all_values = Vec::new();
    for records in &data.dependent_data {
        for record in records {
            if let Some(value) = extract_dependent_value(record, dep_var_name) {
                all_values.push(value);
            }
        }
    }

    // Calculate SS for each main factor
    for factor in factors {
        let factor_levels = get_factor_levels(data, factor)?;
        let df = factor_levels.len() - 1;

        // Calculate SS adjusted for all other terms except interactions that contain this factor
        let factor_ss = calculate_factor_ss(
            data,
            factor,
            dep_var_name,
            grand_mean,
            SumOfSquaresMethod::TypeII,
            None,
            None
        )?;

        *ss_model += factor_ss;

        // Create effect entry
        // Error df is n_total minus the number of parameters in the full model
        let error_df = n_total - factors.len() - interaction_terms.len();
        let error_ss = ss_total - *ss_model;
        let error_ms = if error_df > 0 { error_ss / (error_df as f64) } else { 0.0 };

        source.insert(
            factor.to_string(),
            create_effect_entry(factor_ss, df, error_ms, error_df, sig_level)
        );
    }

    // Process interaction terms for Type II
    for interaction_term in interaction_terms {
        let interaction_factors = parse_interaction_term(interaction_term);
        let df = calculate_interaction_df(data, interaction_term)?;

        // Calculate SS adjusted for all main effects and lower-order interactions
        let interaction_ss = calculate_interaction_ss(
            data,
            interaction_term,
            dep_var_name,
            grand_mean,
            SumOfSquaresMethod::TypeII,
            factors,
            None,
            None
        )?;

        *ss_model += interaction_ss;

        // Create effect entry
        let error_df = n_total - factors.len() - interaction_terms.len();
        let error_ss = ss_total - *ss_model;
        let error_ms = if error_df > 0 { error_ss / (error_df as f64) } else { 0.0 };

        source.insert(
            interaction_term.clone(),
            create_effect_entry(interaction_ss, df, error_ms, error_df, sig_level)
        );
    }

    Ok(())
}

/// Process Type III/IV factors and interactions
pub fn process_type_iii_factors_and_interactions(
    data: &AnalysisData,
    factors: &[String],
    interaction_terms: &[String],
    dep_var_name: &str,
    grand_mean: f64,
    n_total: usize,
    ss_total: f64,
    sig_level: f64,
    ss_model: &mut f64,
    source: &mut HashMap<String, TestEffectEntry>
) -> Result<(), String> {
    // Type III/IV: Orthogonal to other effects, each term adjusted for all other terms

    // First, determine if we should use Type III or Type IV
    // Check if there are any missing cells in the design
    let mut has_missing_cells = false;
    for factor in factors {
        if check_for_missing_cells(data, factor)? {
            has_missing_cells = true;
            break;
        }
    }

    let ss_method = if has_missing_cells {
        SumOfSquaresMethod::TypeIV
    } else {
        SumOfSquaresMethod::TypeIII
    };

    // Process main factors
    for factor in factors {
        let factor_levels = get_factor_levels(data, factor)?;
        let df = factor_levels.len() - 1;

        // Calculate factor SS using the appropriate method
        let factor_ss = calculate_factor_ss(
            data,
            factor,
            dep_var_name,
            grand_mean,
            ss_method.clone(),
            None,
            None
        )?;

        *ss_model += factor_ss;

        // Create effect entry
        let error_df = n_total - factors.len() - interaction_terms.len();
        let error_ss = ss_total - *ss_model;
        let error_ms = if error_df > 0 { error_ss / (error_df as f64) } else { 0.0 };

        source.insert(
            factor.to_string(),
            create_effect_entry(factor_ss, df, error_ms, error_df, sig_level)
        );
    }

    // Process interaction terms
    for interaction_term in interaction_terms {
        let df = calculate_interaction_df(data, interaction_term)?;

        // Calculate interaction SS using the appropriate method
        let interaction_ss = calculate_interaction_ss(
            data,
            interaction_term,
            dep_var_name,
            grand_mean,
            ss_method.clone(),
            factors,
            None,
            None
        )?;

        *ss_model += interaction_ss;

        // Create effect entry
        let error_df = n_total - factors.len() - interaction_terms.len();
        let error_ss = ss_total - *ss_model;
        let error_ms = if error_df > 0 { error_ss / (error_df as f64) } else { 0.0 };

        source.insert(
            interaction_term.clone(),
            create_effect_entry(interaction_ss, df, error_ms, error_df, sig_level)
        );
    }

    Ok(())
}

/// Process Type IV factors and interactions
pub fn process_type_iv_factors_and_interactions(
    data: &AnalysisData,
    factors: &[String],
    interaction_terms: &[String],
    dep_var_name: &str,
    grand_mean: f64,
    n_total: usize,
    ss_total: f64,
    sig_level: f64,
    ss_model: &mut f64,
    source: &mut HashMap<String, TestEffectEntry>
) -> Result<(), String> {
    // Type IV: Orthogonal to other effects, each term adjusted for all other terms

    // Determine which sum of squares method to use
    let ss_method = SumOfSquaresMethod::TypeIV;

    // Process main factors
    for factor in factors {
        let factor_levels = get_factor_levels(data, factor)?;
        let df = factor_levels.len() - 1;

        // Calculate factor SS using contrast coding
        let factor_ss = calculate_factor_ss(
            data,
            factor,
            dep_var_name,
            grand_mean,
            ss_method.clone(),
            None,
            None
        )?;

        *ss_model += factor_ss;

        // Create effect entry
        let error_df = n_total - factors.len() - interaction_terms.len();
        let error_ss = ss_total - *ss_model;
        let error_ms = if error_df > 0 { error_ss / (error_df as f64) } else { 0.0 };

        source.insert(
            factor.to_string(),
            create_effect_entry(factor_ss, df, error_ms, error_df, sig_level)
        );
    }

    // Process interaction terms
    for interaction_term in interaction_terms {
        let df = calculate_interaction_df(data, interaction_term)?;

        // Calculate interaction SS using Type IV approach
        let interaction_ss = calculate_type_iv_interaction_ss(
            data,
            &parse_interaction_term(interaction_term),
            interaction_term,
            dep_var_name,
            grand_mean,
            factors
        )?;

        *ss_model += interaction_ss;

        // Create effect entry
        let error_df = n_total - factors.len() - interaction_terms.len();
        let error_ss = ss_total - *ss_model;
        let error_ms = if error_df > 0 { error_ss / (error_df as f64) } else { 0.0 };

        source.insert(
            interaction_term.clone(),
            create_effect_entry(interaction_ss, df, error_ms, error_df, sig_level)
        );
    }

    Ok(())
}
