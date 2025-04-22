use crate::multivariate::models::{
    config::{ MultivariateConfig, SumOfSquaresMethod },
    data::AnalysisData,
};

use super::core::{
    build_design_matrix_and_response,
    calculate_mean,
    calculate_type_i_ss,
    calculate_type_ii_ss,
    calculate_type_iii_ss,
    calculate_type_iv_ss,
    generate_interaction_terms,
    get_factor_columns,
    get_interaction_columns,
    to_dmatrix,
    to_dvector,
};

/// Calculate estimated effect size
pub fn calculate_effect_size(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<(), String> {
    // Check if effect size calculation is requested
    if !config.options.est_effect_size {
        return Ok(());
    }

    // For each dependent variable
    let dependent_vars = data.dependent_data_defs
        .iter()
        .flat_map(|defs| defs.iter().map(|def| def.name.clone()))
        .collect::<Vec<String>>();

    for dep_var in &dependent_vars {
        // Build design matrix and response vector
        let (x_matrix, y_vector) = build_design_matrix_and_response(data, config, dep_var)?;

        // Calculate total sum of squares
        let mean_y = calculate_mean(&y_vector);
        let ss_total = y_vector
            .iter()
            .map(|y| (y - mean_y).powi(2))
            .sum::<f64>();

        // Fit the model
        let x_mat = to_dmatrix(&x_matrix);
        let y_vec = to_dvector(&y_vector);

        let x_transpose_x = &x_mat.transpose() * &x_mat;
        let x_transpose_y = &x_mat.transpose() * &y_vec;

        // Get parameter estimates
        let beta = match x_transpose_x.try_inverse() {
            Some(inv) => inv * x_transpose_y,
            None => {
                return Err(
                    "Could not invert X'X matrix - possibly due to multicollinearity".to_string()
                );
            }
        };

        // Calculate fitted values and residuals
        let y_hat = &x_mat * &beta;
        let residuals = &y_vec - &y_hat;

        // Calculate error sum of squares
        let ss_error = residuals
            .iter()
            .map(|r| r.powi(2))
            .sum::<f64>();

        // Calculate model sum of squares
        let ss_model = ss_total - ss_error;

        // Calculate degrees of freedom
        let n = y_vector.len();
        let p = x_matrix[0].len(); // Number of parameters (including intercept)
        let df_model = p - 1;
        let df_error = n - p;
        let df_total = n - 1;

        // Calculate effect sizes for each factor
        if let Some(factors) = &config.main.fix_factor {
            for factor in factors {
                // Get columns in design matrix for this factor
                let factor_cols = get_factor_columns(&x_matrix, factor, data, config)?;
                let factor_df = factor_cols.len() - 1;

                if factor_df > 0 {
                    // Calculate factor SS based on the SS type
                    let factor_ss = match
                        config.model.sum_of_square_method
                            .as_ref()
                            .unwrap_or(&SumOfSquaresMethod::TypeIII)
                    {
                        SumOfSquaresMethod::TypeI => {
                            calculate_type_i_ss(&x_matrix, &y_vector, &factor_cols, data, config)?
                        }
                        SumOfSquaresMethod::TypeII => {
                            calculate_type_ii_ss(
                                &x_matrix,
                                &y_vector,
                                factor,
                                &factor_cols,
                                data,
                                config
                            )?
                        }
                        SumOfSquaresMethod::TypeIII => {
                            calculate_type_iii_ss(
                                &x_matrix,
                                &y_vector,
                                factor,
                                &factor_cols,
                                data,
                                config
                            )?
                        }
                        SumOfSquaresMethod::TypeIV => {
                            calculate_type_iv_ss(
                                &x_matrix,
                                &y_vector,
                                factor,
                                &factor_cols,
                                data,
                                config
                            )?
                        }
                    };

                    // Calculate various effect size measures

                    // Partial Eta Squared
                    let partial_eta_squared = factor_ss / (factor_ss + ss_error);

                    // Eta Squared
                    let eta_squared = factor_ss / ss_total;

                    // Omega Squared
                    let ms_error = ss_error / (df_error as f64);
                    let omega_squared =
                        (factor_ss - (factor_df as f64) * ms_error) / (ss_total + ms_error);

                    // Cohen's f² for this factor
                    let f_squared = partial_eta_squared / (1.0 - partial_eta_squared);

                    // Store the effect size results (would need to be added to MultivariateResult)
                    // ...
                }
            }

            // Calculate effect sizes for interaction terms if there are multiple factors
            if factors.len() > 1 {
                let interaction_terms = generate_interaction_terms(factors);

                for term in &interaction_terms {
                    // Calculate effect size for interaction terms
                    let interaction_cols = get_interaction_columns(&x_matrix, term, data, config)?;
                    let interaction_df = interaction_cols.len() - 1;

                    if interaction_df > 0 {
                        // Calculate interaction SS based on the SS type
                        let interaction_ss = match
                            config.model.sum_of_square_method
                                .as_ref()
                                .unwrap_or(&SumOfSquaresMethod::TypeIII)
                        {
                            SumOfSquaresMethod::TypeI => {
                                calculate_type_i_ss(
                                    &x_matrix,
                                    &y_vector,
                                    &interaction_cols,
                                    data,
                                    config
                                )?
                            }
                            SumOfSquaresMethod::TypeII => {
                                calculate_type_ii_ss(
                                    &x_matrix,
                                    &y_vector,
                                    term,
                                    &interaction_cols,
                                    data,
                                    config
                                )?
                            }
                            SumOfSquaresMethod::TypeIII => {
                                calculate_type_iii_ss(
                                    &x_matrix,
                                    &y_vector,
                                    term,
                                    &interaction_cols,
                                    data,
                                    config
                                )?
                            }
                            SumOfSquaresMethod::TypeIV => {
                                calculate_type_iv_ss(
                                    &x_matrix,
                                    &y_vector,
                                    term,
                                    &interaction_cols,
                                    data,
                                    config
                                )?
                            }
                        };

                        // Calculate effect size measures for interactions
                        let partial_eta_squared = interaction_ss / (interaction_ss + ss_error);
                        let eta_squared = interaction_ss / ss_total;
                        let ms_error = ss_error / (df_error as f64);
                        let omega_squared =
                            (interaction_ss - (interaction_df as f64) * ms_error) /
                            (ss_total + ms_error);

                        // Store the interaction effect size results
                        // ...
                    }
                }
            }
        }

        // Calculate overall effect size measures
        let r_squared = 1.0 - ss_error / ss_total;
        let adjusted_r_squared =
            1.0 - ss_error / (df_error as f64) / (ss_total / (df_total as f64));

        // Store overall effect size results
        // ...
    }

    Ok(())
}
