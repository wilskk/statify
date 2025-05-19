use std::collections::HashMap;

use crate::univariate::models::{
    config::SumOfSquaresMethod,
    data::AnalysisData,
    result::TestEffectEntry,
    config::UnivariateConfig,
};

use super::core::*;

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

/// Apply weights to the analysis if WLS is specified
fn apply_wls_to_analysis(
    data: &AnalysisData,
    config: &UnivariateConfig,
    values: &[f64]
) -> Result<Vec<f64>, String> {
    // Check if WLS weight is specified
    if let Some(wls_weight) = &config.main.wls_weight {
        let weights = get_wls_weights(data, wls_weight)?;

        // Ensure weights are the same length as values
        if weights.len() != values.len() {
            return Err("WLS weights length does not match data length".to_string());
        }

        // Apply weights to values
        Ok(apply_weights(values, &weights))
    } else {
        // No WLS, return original values
        Ok(values.to_vec())
    }
}

/// Process Type I factors and interactions
pub fn process_type_i_factors_and_interactions(
    data: &AnalysisData,
    config: &UnivariateConfig,
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

    // Apply WLS if specified
    let weighted_values = apply_wls_to_analysis(data, config, &y_values)?;
    if config.main.wls_weight.is_some() {
        y_values = weighted_values;
    }

    // Start with residuals as the original values
    let mut residual_values = y_values.clone();
    let mut residual_mean = grand_mean;

    // Process covariates first if present
    if let Some(covariates) = &config.main.covar {
        for covariate in covariates {
            let covariate_values = get_covariate_values(data, covariate)?;

            // Apply WLS to covariates if needed
            let covariate_vec = if config.main.wls_weight.is_some() {
                let weights = get_wls_weights(data, config.main.wls_weight.as_ref().unwrap())?;
                apply_weights(&covariate_values, &weights)
            } else {
                covariate_values
            };

            // Calculate Sum of Squares for the covariate
            let covariate_ss = calculate_covariate_ss(
                &residual_values,
                &covariate_vec,
                residual_mean
            )?;

            *ss_model += covariate_ss;

            // Update residuals by regressing out the covariate
            let cov_centered: Vec<f64> = covariate_vec
                .iter()
                .map(|x| x - covariate_vec.iter().sum::<f64>() / (covariate_vec.len() as f64))
                .collect();

            let x_cov = vec![vec![1.0; residual_values.len()], cov_centered]
                .into_iter()
                .map(|col| col)
                .collect::<Vec<_>>();

            let x_transpose = matrix_transpose(&x_cov);
            let xtx = matrix_multiply(&x_transpose, &x_cov)?;
            let xtx_inv = matrix_inverse(&xtx)?;
            let xty = matrix_vec_multiply(&x_transpose, &residual_values)?;
            let b = matrix_vec_multiply(&xtx_inv, &xty)?;

            // Update residuals: r = y - Xb
            for i in 0..residual_values.len() {
                let mut fitted = 0.0;
                for j in 0..b.len() {
                    fitted += x_cov[i][j] * b[j];
                }
                residual_values[i] = residual_values[i] - fitted;
            }

            // Update residual mean
            residual_mean = calculate_mean(&residual_values);

            // Create effect entry for covariate
            let error_df = n_total - 2; // Intercept + covariate
            let error_ss = residual_values
                .iter()
                .map(|r| r.powi(2))
                .sum::<f64>();
            let error_ms = if error_df > 0 { error_ss / (error_df as f64) } else { 0.0 };

            source.insert(
                covariate.to_string(),
                create_effect_entry(covariate_ss, 1, error_ms, error_df, sig_level)
            );
        }
    }

    // Process fixed factors from the model terms
    for factor in factors {
        // Check if factor exists in fix_factor_data
        if !data.fix_factor_data_defs.iter().any(|defs| defs.iter().any(|def| def.name == *factor)) {
            continue; // Skip factors that don't exist in data
        }

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

        // Create effect entry for this factor
        let error_df = n_total - df - 1; // -1 for intercept
        let error_ss = residual_values
            .iter()
            .map(|r| r.powi(2))
            .sum::<f64>();
        let error_ms = if error_df > 0 { error_ss / (error_df as f64) } else { 0.0 };

        source.insert(
            factor.clone(),
            create_effect_entry(factor_ss, df, error_ms, error_df, sig_level)
        );
    }

    // Process interactions from the model terms
    for interaction_term in interaction_terms {
        // Check if this is a covariate interaction term (e.g., X1*X2)
        let is_covariate_interaction = config.main.covar.as_ref().map_or(false, |covars| {
            let parsed_terms = parse_interaction_term(interaction_term);
            parsed_terms.iter().all(|term| covars.contains(term))
        });

        // Check if this is a nesting term (e.g., A(B) or A WITHIN B)
        let is_nesting_term = interaction_term.contains('(') || interaction_term.contains("WITHIN");

        let interaction_factors = parse_interaction_term(interaction_term);

        // Skip if any factor doesn't exist in data
        if
            !is_covariate_interaction &&
            !is_nesting_term &&
            !interaction_factors
                .iter()
                .all(|f|
                    data.fix_factor_data_defs
                        .iter()
                        .any(|defs| defs.iter().any(|def| def.name == *f))
                )
        {
            continue;
        }

        // Calculate degrees of freedom based on term type
        let df = if is_covariate_interaction {
            1 // Covariate interactions typically have 1 degree of freedom
        } else if is_nesting_term {
            // For nested terms, DF depends on the number of unique combinations
            // Here we use a simplified approach - this would need refinement in practice
            let nested_term = if interaction_term.contains("WITHIN") {
                // Convert "A WITHIN B" to "A(B)" format
                let parts: Vec<&str> = interaction_term.split("WITHIN").collect();
                if parts.len() == 2 {
                    format!("{}({})", parts[0].trim(), parts[1].trim())
                } else {
                    interaction_term.to_string()
                }
            } else {
                interaction_term.to_string()
            };

            // Use create_nested_design_matrix to get the correct DF
            match create_nested_design_matrix(data, &nested_term) {
                Ok(matrix) => matrix[0].len(),
                Err(_) => {
                    // Fallback to default calculation if there's an error
                    calculate_interaction_df(data, interaction_term)?
                }
            }
        } else {
            // Regular interaction term
            calculate_interaction_df(data, interaction_term)?
        };

        // Calculate sum of squares based on the term type
        let interaction_ss = if is_covariate_interaction {
            // Use the covariate interaction design matrix
            let x_covar_interaction = create_covariate_interaction_design_matrix(
                data,
                interaction_term
            )?;

            // Perform Type I SS calculation for covariate interaction
            let x_transpose = matrix_transpose(&x_covar_interaction);
            let xtx = matrix_multiply(&x_transpose, &x_covar_interaction)?;
            let xtx_inv = matrix_inverse(&xtx)?;
            let xty = matrix_vec_multiply(&x_transpose, &residual_values)?;
            let b = matrix_vec_multiply(&xtx_inv, &xty)?;

            // Calculate SS = b'X'y
            b.iter()
                .zip(xty.iter())
                .map(|(&b_i, &y_i)| b_i * y_i)
                .sum::<f64>()
        } else if is_nesting_term {
            // Handle nesting term
            let nested_term = if interaction_term.contains("WITHIN") {
                // Convert "A WITHIN B" to "A(B)" format
                let parts: Vec<&str> = interaction_term.split("WITHIN").collect();
                if parts.len() == 2 {
                    format!("{}({})", parts[0].trim(), parts[1].trim())
                } else {
                    interaction_term.to_string()
                }
            } else {
                interaction_term.to_string()
            };

            let x_nested = create_nested_design_matrix(data, &nested_term)?;

            // Perform Type I SS calculation
            let x_transpose = matrix_transpose(&x_nested);
            let xtx = matrix_multiply(&x_transpose, &x_nested)?;
            let xtx_inv = match matrix_inverse(&xtx) {
                Ok(inv) => inv,
                Err(_) => {
                    return Err(format!("Could not invert matrix for nested term {}", nested_term));
                }
            };
            let xty = matrix_vec_multiply(&x_transpose, &residual_values)?;
            let b = matrix_vec_multiply(&xtx_inv, &xty)?;

            // Calculate SS = b'X'y
            b.iter()
                .zip(xty.iter())
                .map(|(&b_i, &y_i)| b_i * y_i)
                .sum::<f64>()
        } else {
            // Regular interaction term
            calculate_type_i_interaction_ss(
                data,
                &interaction_factors,
                interaction_term,
                dep_var_name,
                grand_mean,
                Some(&residual_values),
                Some(residual_mean)
            )?
        };

        *ss_model += interaction_ss;

        // Adjust residuals based on the term type
        let x_interaction = if is_covariate_interaction {
            create_covariate_interaction_design_matrix(data, interaction_term)?
        } else if is_nesting_term {
            let nested_term = if interaction_term.contains("WITHIN") {
                let parts: Vec<&str> = interaction_term.split("WITHIN").collect();
                if parts.len() == 2 {
                    format!("{}({})", parts[0].trim(), parts[1].trim())
                } else {
                    interaction_term.to_string()
                }
            } else {
                interaction_term.to_string()
            };

            create_nested_design_matrix(data, &nested_term)?
        } else {
            create_interaction_design_matrix(data, interaction_term)?
        };

        let x_transpose = matrix_transpose(&x_interaction);
        let xtx = matrix_multiply(&x_transpose, &x_interaction)?;
        let xtx_inv = match matrix_inverse(&xtx) {
            Ok(inv) => inv,
            Err(_) => {
                return Err(format!("Could not invert matrix for term {}", interaction_term));
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

        // Create effect entry for this term
        let error_df = n_total - df - 1; // -1 for intercept
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

    // Process random factors if present
    if let Some(random_factors) = &config.main.rand_factor {
        for factor in random_factors {
            let factor_levels = get_random_factor_levels(data, factor)?;
            let df = factor_levels.len() - 1;

            // Setup random factor design matrix
            let x_random = create_main_effect_design_matrix(data, factor)?;

            // Apply weights if using WLS
            let mut x_weighted = x_random.clone();
            if let Some(wls_weight) = &config.main.wls_weight {
                let weights = get_wls_weights(data, wls_weight)?;
                for i in 0..x_weighted.len() {
                    for j in 0..x_weighted[i].len() {
                        x_weighted[i][j] *= weights[i].sqrt();
                    }
                }
            }

            // Calculate SS for random factor - adjust for previous terms
            let x_transpose = matrix_transpose(&x_weighted);
            let xtx = matrix_multiply(&x_transpose, &x_weighted)?;
            let xtx_inv = matrix_inverse(&xtx)?;
            let xty = matrix_vec_multiply(&x_transpose, &residual_values)?;
            let b = matrix_vec_multiply(&xtx_inv, &xty)?;

            // Calculate SS
            let factor_ss = xty
                .iter()
                .zip(b.iter())
                .map(|(y, b)| y * b)
                .sum::<f64>();
            *ss_model += factor_ss;

            // Update residuals
            for i in 0..residual_values.len() {
                let mut fitted = 0.0;
                for j in 0..b.len() {
                    fitted += x_weighted[i][j] * b[j];
                }
                residual_values[i] = residual_values[i] - fitted;
            }

            // Update residual mean
            residual_mean = calculate_mean(&residual_values);

            // Create effect entry for random factor
            let error_df = n_total - df - 1; // -1 for intercept
            let error_ss = residual_values
                .iter()
                .map(|r| r.powi(2))
                .sum::<f64>();
            let error_ms = if error_df > 0 { error_ss / (error_df as f64) } else { 0.0 };

            source.insert(
                factor.clone(),
                create_effect_entry(factor_ss, df, error_ms, error_df, sig_level)
            );
        }
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
    // Type II: Each term adjusted for all appropriate terms
    // Calculate effect for each factor and interaction

    // Calculate error df and MS
    let total_effects = factors.len() + interaction_terms.len() + 1; // +1 for intercept
    let error_df = n_total - total_effects;
    let error_ss = ss_total - *ss_model;
    let error_ms = if error_df > 0 { error_ss / (error_df as f64) } else { 0.0 };

    // Process factors
    for factor in factors {
        // Check if factor exists in fix_factor_data
        if !data.fix_factor_data_defs.iter().any(|defs| defs.iter().any(|def| def.name == *factor)) {
            continue; // Skip factors that don't exist in data
        }

        let factor_levels = get_factor_levels(data, factor)?;
        let df = factor_levels.len() - 1;

        // Calculate Type II SS for this factor
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

        // Add effect to results
        source.insert(
            factor.clone(),
            create_effect_entry(factor_ss, df, error_ms, error_df, sig_level)
        );
    }

    // Process interactions
    for interaction_term in interaction_terms {
        // Parse factors in this interaction
        let interaction_factors = parse_interaction_term(interaction_term);

        // Skip if any factor doesn't exist in data
        if
            !interaction_factors
                .iter()
                .all(|f|
                    data.fix_factor_data_defs
                        .iter()
                        .any(|defs| defs.iter().any(|def| def.name == *f))
                )
        {
            continue;
        }

        let df = calculate_interaction_df(data, interaction_term)?;

        // Calculate Type II SS for this interaction
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

        // Add effect to results
        source.insert(
            interaction_term.clone(),
            create_effect_entry(interaction_ss, df, error_ms, error_df, sig_level)
        );
    }

    Ok(())
}

/// Process Type III factors and interactions
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
    // Type III: Each term adjusted for all other terms
    // Calculate effect for each factor and interaction

    // Calculate error df and MS
    let total_effects = factors.len() + interaction_terms.len() + 1; // +1 for intercept
    let error_df = n_total - total_effects;
    let error_ss = ss_total - *ss_model;
    let error_ms = if error_df > 0 { error_ss / (error_df as f64) } else { 0.0 };

    // Process factors
    for factor in factors {
        // Check if factor exists in fix_factor_data
        if !data.fix_factor_data_defs.iter().any(|defs| defs.iter().any(|def| def.name == *factor)) {
            continue; // Skip factors that don't exist in data
        }

        let factor_levels = get_factor_levels(data, factor)?;
        let df = factor_levels.len() - 1;

        // Calculate Type III SS for this factor
        let factor_ss = calculate_factor_ss(
            data,
            factor,
            dep_var_name,
            grand_mean,
            SumOfSquaresMethod::TypeIII,
            None,
            None
        )?;

        *ss_model += factor_ss;

        // Add effect to results
        source.insert(
            factor.clone(),
            create_effect_entry(factor_ss, df, error_ms, error_df, sig_level)
        );
    }

    // Process interactions
    for interaction_term in interaction_terms {
        // Parse factors in this interaction
        let interaction_factors = parse_interaction_term(interaction_term);

        // Skip if any factor doesn't exist in data
        if
            !interaction_factors
                .iter()
                .all(|f|
                    data.fix_factor_data_defs
                        .iter()
                        .any(|defs| defs.iter().any(|def| def.name == *f))
                )
        {
            continue;
        }

        let df = calculate_interaction_df(data, interaction_term)?;

        // Calculate Type III SS for this interaction
        let interaction_ss = calculate_interaction_ss(
            data,
            interaction_term,
            dep_var_name,
            grand_mean,
            SumOfSquaresMethod::TypeIII,
            factors,
            None,
            None
        )?;

        *ss_model += interaction_ss;

        // Add effect to results
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
    // Type IV: Designed for unbalanced models with empty cells
    // Calculate effect for each factor and interaction

    // Calculate error df and MS
    let total_effects = factors.len() + interaction_terms.len() + 1; // +1 for intercept
    let error_df = n_total - total_effects;
    let error_ss = ss_total - *ss_model;
    let error_ms = if error_df > 0 { error_ss / (error_df as f64) } else { 0.0 };

    // Process factors
    for factor in factors {
        // Check if factor exists in fix_factor_data
        if !data.fix_factor_data_defs.iter().any(|defs| defs.iter().any(|def| def.name == *factor)) {
            continue; // Skip factors that don't exist in data
        }

        let factor_levels = get_factor_levels(data, factor)?;
        let df = factor_levels.len() - 1;

        // Check if there are missing cells
        let has_missing_cells = check_for_missing_cells(data, factor)?;

        // Calculate SS - if missing cells, use Type IV, otherwise Type III
        let factor_ss = if has_missing_cells {
            calculate_factor_ss(
                data,
                factor,
                dep_var_name,
                grand_mean,
                SumOfSquaresMethod::TypeIV,
                None,
                None
            )?
        } else {
            calculate_factor_ss(
                data,
                factor,
                dep_var_name,
                grand_mean,
                SumOfSquaresMethod::TypeIII,
                None,
                None
            )?
        };

        *ss_model += factor_ss;

        // Add effect to results
        source.insert(
            factor.clone(),
            create_effect_entry(factor_ss, df, error_ms, error_df, sig_level)
        );
    }

    // Process interactions
    for interaction_term in interaction_terms {
        // Parse factors in this interaction
        let interaction_factors = parse_interaction_term(interaction_term);

        // Skip if any factor doesn't exist in data
        if
            !interaction_factors
                .iter()
                .all(|f|
                    data.fix_factor_data_defs
                        .iter()
                        .any(|defs| defs.iter().any(|def| def.name == *f))
                )
        {
            continue;
        }

        let df = calculate_interaction_df(data, interaction_term)?;

        // For Type IV, we need special handling for interactions with missing cells
        let has_missing_cells = interaction_factors
            .iter()
            .any(|f| check_for_missing_cells(data, f).unwrap_or(false));

        // Calculate appropriate SS
        let interaction_ss = if has_missing_cells {
            calculate_type_iv_interaction_ss(
                data,
                &interaction_factors,
                interaction_term,
                dep_var_name,
                grand_mean,
                factors
            )?
        } else {
            calculate_interaction_ss(
                data,
                interaction_term,
                dep_var_name,
                grand_mean,
                SumOfSquaresMethod::TypeIII,
                factors,
                None,
                None
            )?
        };

        *ss_model += interaction_ss;

        // Add effect to results
        source.insert(
            interaction_term.clone(),
            create_effect_entry(interaction_ss, df, error_ms, error_df, sig_level)
        );
    }

    Ok(())
}
