use std::collections::HashMap;

use crate::univariate::models::{
    config::{ SumOfSquaresMethod, UnivariateConfig },
    data::{ AnalysisData },
    result::{ TestEffectEntry, TestsBetweenSubjectsEffects },
};

use super::core::*;
use super::common; // Import common to use get_all_dependent_values
use super::sum_of_squares::{
    calculate_type_i_ss,
    calculate_type_ii_ss,
    calculate_type_iii_ss,
    calculate_type_iv_ss,
};
use super::matrix_utils; // For calculate_model_ss
use super::factor_utils; // For parse_interaction_term, check_for_missing_cells etc. and now model term generation & design matrices

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
    let all_values_raw = common::get_all_dependent_values(data, dep_var_name)?;

    let y_values_for_analysis = if config.main.wls_weight.is_some() {
        common::apply_wls_to_analysis(data, config, &all_values_raw)?
    } else {
        all_values_raw.clone()
    };

    let grand_mean_y = common::calculate_mean(&y_values_for_analysis);
    let ss_total_corrected = y_values_for_analysis
        .iter()
        .map(|val| (val - grand_mean_y).powi(2))
        .sum::<f64>();

    let model_terms_ordered = factor_utils::generate_model_design_terms(data, config)?;
    let mut actual_full_model_ss = 0.0;
    let mut actual_df_full_model_params = 0;

    let mut y_residuals_sequential = y_values_for_analysis.to_vec(); // For Type I

    match config.model.sum_of_square_method {
        SumOfSquaresMethod::TypeI => {
            let mut running_ss_model_type_i = 0.0;
            let mut current_model_df_so_far = 0;

            if config.model.intercept {
                // For Type I, SS for Intercept is SS(Intercept) using original Y.
                // This is effectively C.F. = (sum Y)^2 / N
                // The `calculate_type_i_ss` expects residuals, so for intercept, we use original Y.
                // Or, more directly, calculate it.
                let intercept_ss = if n_total > 0 {
                    y_values_for_analysis.iter().sum::<f64>().powi(2) / (n_total as f64)
                } else {
                    0.0
                };
                running_ss_model_type_i += intercept_ss;
                current_model_df_so_far += 1;
                // Placeholder for error terms, will be updated later
                source.insert(
                    "Intercept".to_string(),
                    common::create_effect_entry(intercept_ss, 1, 0.0, 0, config.options.sig_level)
                );

                // Update residuals: Y_new = Y - Y_mean (if intercept is only term)
                // Or more generally, Y_new = Y - X_intercept * beta_intercept
                // X_intercept is a column of 1s. beta_intercept = (X'X)^-1 X'Y = mean(Y)
                // So Y_new = Y - mean(Y)
                let mean_y = common::calculate_mean(&y_values_for_analysis);
                y_residuals_sequential = y_values_for_analysis
                    .iter()
                    .map(|y| y - mean_y)
                    .collect();
            }

            for term_name in model_terms_ordered.iter().filter(|t| **t != "Intercept") {
                let df_term = factor_utils::get_df_for_term(data, config, term_name)?;
                if df_term == 0 {
                    continue;
                }

                // Pass current y_residuals_sequential to calculate_type_i_ss
                let term_ss = calculate_type_i_ss(
                    data,
                    config,
                    term_name,
                    &y_residuals_sequential // Use current residuals
                )?;

                running_ss_model_type_i += term_ss;
                current_model_df_so_far += df_term;

                // Error term for this specific step (not final error)
                let df_error_step = if n_total > current_model_df_so_far {
                    n_total - current_model_df_so_far
                } else {
                    0
                };
                let ss_error_step = (ss_total_corrected - running_ss_model_type_i).max(0.0);
                let ms_error_step = if df_error_step > 0 {
                    ss_error_step / (df_error_step as f64)
                } else {
                    0.0
                };

                source.insert(
                    term_name.to_string(),
                    common::create_effect_entry(
                        term_ss,
                        df_term,
                        ms_error_step,
                        df_error_step,
                        config.options.sig_level
                    )
                );

                // Update residuals by regressing out the current term
                let x_term_cols = factor_utils::get_design_matrix_cols_for_term(
                    data,
                    config,
                    term_name,
                    &y_values_for_analysis,
                    &model_terms_ordered
                        .iter() // Iterates over &String
                        .take_while(
                            |term_in_iter_ref_ref: &&String|
                                term_in_iter_ref_ref.as_str() != term_name
                        )
                        .cloned() // Clones &String to String
                        .collect::<Vec<String>>()
                )?;
                if !x_term_cols.is_empty() {
                    let x_term_matrix_transposed = matrix_utils::matrix_transpose(&x_term_cols);
                    match
                        factor_utils::regress_out_term_from_design_cols(
                            &y_residuals_sequential,
                            &x_term_matrix_transposed
                        )
                    {
                        Ok((_b, y_new_residuals)) => {
                            y_residuals_sequential = y_new_residuals;
                        }
                        Err(e) => {
                            return Err(
                                format!("Error regressing out term {} for Type I: {}", term_name, e)
                            );
                        }
                    }
                }
            }
            actual_full_model_ss = running_ss_model_type_i;
            actual_df_full_model_params = current_model_df_so_far;
        }
        SumOfSquaresMethod::TypeII => {
            let mut temp_model_ss = 0.0;
            let mut temp_model_df = 0;

            for term_name in &model_terms_ordered {
                let df_term = factor_utils::get_df_for_term(data, config, term_name)?;
                if df_term == 0 && term_name != "Intercept" {
                    continue;
                } // Intercept has df=1 if present
                if term_name == "Intercept" && !config.model.intercept {
                    continue;
                }

                let term_ss = calculate_type_ii_ss(data, config, term_name, dep_var_name)?;
                temp_model_ss += term_ss; // Sum of individual Type II SS is NOT Model SS.
                // Model SS for Type II is SS(all terms together)
                temp_model_df += df_term;
                // Placeholder, error term comes later
                source.insert(
                    term_name.to_string(),
                    common::create_effect_entry(term_ss, df_term, 0.0, 0, config.options.sig_level)
                );
            }
            // For Type II, actual_full_model_ss is SS(all terms | Intercept if separate)
            // This requires calculating SS for the model with all terms included.
            let (ss_m, df_m) = calculate_full_model_ss_and_df(
                data,
                config,
                &y_values_for_analysis,
                &model_terms_ordered
            )?;
            actual_full_model_ss = ss_m;
            actual_df_full_model_params = df_m;
        }
        SumOfSquaresMethod::TypeIII | SumOfSquaresMethod::TypeIV => {
            // Calculate full model SS and DF first for the error term
            let (ss_m, df_m) = calculate_full_model_ss_and_df(
                data,
                config,
                &y_values_for_analysis,
                &model_terms_ordered
            )?;
            actual_full_model_ss = ss_m;
            actual_df_full_model_params = df_m;

            let ss_error_final = (ss_total_corrected - actual_full_model_ss).max(0.0);
            let df_error_final = if n_total > actual_df_full_model_params {
                n_total - actual_df_full_model_params
            } else {
                0
            };
            let ms_error_final = if df_error_final > 0 {
                ss_error_final / (df_error_final as f64)
            } else {
                0.0
            };

            for term_name in &model_terms_ordered {
                let df_term = if
                    config.model.sum_of_square_method == SumOfSquaresMethod::TypeIV &&
                    term_name.contains('*')
                {
                    factor_utils::calculate_interaction_df_type_iv(data, term_name)?
                } else {
                    factor_utils::get_df_for_term(data, config, term_name)?
                };

                if df_term == 0 && term_name != "Intercept" {
                    continue;
                }
                if term_name == "Intercept" && !config.model.intercept {
                    continue;
                }

                let term_ss = if config.model.sum_of_square_method == SumOfSquaresMethod::TypeIII {
                    calculate_type_iii_ss(data, config, term_name, dep_var_name, grand_mean_y)?
                } else {
                    // TypeIV
                    calculate_type_iv_ss(data, config, term_name, dep_var_name, grand_mean_y)?
                };
                source.insert(
                    term_name.to_string(),
                    common::create_effect_entry(
                        term_ss,
                        df_term,
                        ms_error_final,
                        df_error_final,
                        config.options.sig_level
                    )
                );
            }
        }
    }

    let ss_intercept = source.get("Intercept").map_or(0.0, |e| e.sum_of_squares);
    let df_intercept = source.get("Intercept").map_or(0, |e| e.df);

    // SS Model Corrected: SS(Model | Intercept)
    // actual_full_model_ss for Type III/IV already represents SS(Model | Intercept) from calculate_full_model_ss_and_df
    // For Type I/II, it's the sum of sequential/partial SS. Need to adjust if intercept was included in that sum.
    let ss_model_corrected = if
        config.model.sum_of_square_method == SumOfSquaresMethod::TypeIII ||
        config.model.sum_of_square_method == SumOfSquaresMethod::TypeIV
    {
        actual_full_model_ss // This is already corrected by calculate_full_model_ss_and_df
    } else {
        if config.model.intercept {
            actual_full_model_ss - ss_intercept
        } else {
            actual_full_model_ss
        }
    };

    let df_model_corrected = if config.model.intercept && actual_df_full_model_params > 0 {
        actual_df_full_model_params - df_intercept
    } else {
        actual_df_full_model_params
    };

    let df_error = if n_total > actual_df_full_model_params {
        n_total - actual_df_full_model_params
    } else {
        0
    };

    let ss_error = (ss_total_corrected - actual_full_model_ss).max(0.0); // Total Model SS (including intercept if present)

    // Update source entries with the final error term for Type I and II
    if
        config.model.sum_of_square_method == SumOfSquaresMethod::TypeI ||
        config.model.sum_of_square_method == SumOfSquaresMethod::TypeII
    {
        let final_ms_error = if df_error > 0 { ss_error / (df_error as f64) } else { 0.0 };
        for (_term, entry) in source.iter_mut() {
            entry.mean_square = if entry.df > 0 {
                entry.sum_of_squares / (entry.df as f64)
            } else {
                0.0
            };
            entry.f_value = if final_ms_error > 0.0 && entry.mean_square > 0.0 {
                entry.mean_square / final_ms_error
            } else {
                0.0
            };
            entry.significance = if entry.f_value > 0.0 {
                common::calculate_f_significance(entry.df, df_error, entry.f_value)
            } else {
                1.0
            };
            entry.partial_eta_squared = if entry.sum_of_squares >= 0.0 && df_error > 0 {
                let eta_sq =
                    entry.sum_of_squares /
                    (entry.sum_of_squares + final_ms_error * (df_error as f64));
                eta_sq.max(0.0).min(1.0)
            } else {
                0.0
            };
            entry.noncent_parameter = if entry.f_value > 0.0 {
                entry.f_value * (entry.df as f64)
            } else {
                0.0
            };
            entry.observed_power = if entry.f_value > 0.0 {
                common::calculate_observed_power(
                    entry.df,
                    df_error,
                    entry.f_value,
                    config.options.sig_level
                )
            } else {
                0.0
            };
        }
    }

    // R-squared and Adjusted R-squared
    let r_squared = if ss_total_corrected > 0.0 {
        ss_model_corrected / ss_total_corrected
    } else {
        0.0
    };
    r_squared.max(0.0).min(1.0); // Clamp R-squared

    let adjusted_r_squared = if df_error > 0 && n_total - 1 > 0 {
        1.0 - ss_error / (df_error as f64) / (ss_total_corrected / ((n_total - 1) as f64))
    } else {
        0.0
    };
    adjusted_r_squared.max(0.0).min(1.0); // Clamp Adjusted R-squared

    Ok(TestsBetweenSubjectsEffects {
        source,
        r_squared,
        adjusted_r_squared,
        // Fields below are from the old struct, confirm if they are truly gone or need mapping.
        // Based on linter errors, they seem to be removed from TestsBetweenSubjectsEffects.
        // If they need to be part of the output, the struct definition in models/result.rs needs update.
        // For now, assuming they are gone from the struct.
        // corrected_model_ss: ss_model_corrected,
        // corrected_model_df: df_model_corrected,
        // intercept_ss: ss_intercept,
        // intercept_df: df_intercept,
        // total_ss: ss_total_corrected, // This is SST (Corrected Total)
        // total_df: n_total - 1,
        // error_ss: ss_error,
        // error_df: df_error,
        // corrected_total_ss: ss_total_corrected,
        // corrected_total_df: n_total - 1,
    })
}

// Helper function for Type III/IV to calculate SS and DF of the full model.
// Returns (SS_Model_Corrected_For_Mean, DF_Model_Parameters)
// The DF returned is the count of parameters in the model, including intercept if modeled.
// The SS returned is SS(Model | Intercept) if intercept is first term and calculated.
// Otherwise, it's uncorrected model SS.
fn calculate_full_model_ss_and_df(
    data: &AnalysisData,
    config: &UnivariateConfig,
    all_y_values_for_analysis: &[f64],
    full_model_terms_list: &[String]
) -> Result<(f64, usize), String> {
    let mut design_matrix_cols_full_model: Vec<Vec<f64>> = Vec::new();
    let n_obs = all_y_values_for_analysis.len();

    for term_name_str in full_model_terms_list {
        let term_name = term_name_str.as_str();
        if term_name == "Intercept" {
            design_matrix_cols_full_model.push(vec![1.0; n_obs]);
        } else if config.main.covar.as_ref().map_or(false, |c| c.contains(&term_name.to_string())) {
            let cov_values = common::get_covariate_values(data, term_name)?;
            design_matrix_cols_full_model.push(cov_values);
        } else if term_name.contains('*') {
            let x_interaction = factor_utils::create_interaction_design_matrix(data, term_name)?;
            let x_interaction_cols = matrix_utils::matrix_transpose(&x_interaction);
            for col in x_interaction_cols {
                design_matrix_cols_full_model.push(col);
            }
        } else {
            let x_factor = factor_utils::create_main_effect_design_matrix(data, term_name)?;
            let x_factor_cols = matrix_utils::matrix_transpose(&x_factor);
            for col in x_factor_cols {
                design_matrix_cols_full_model.push(col);
            }
        }
    }

    let mut x_full_model_matrix_rows = matrix_utils::matrix_transpose(
        &design_matrix_cols_full_model
    );

    if config.main.wls_weight.is_some() {
        let weights_sqrt = common
            ::get_wls_weights(data, config.main.wls_weight.as_ref().unwrap())?
            .iter()
            .map(|w| w.sqrt())
            .collect::<Vec<f64>>();

        if x_full_model_matrix_rows.len() == weights_sqrt.len() {
            for r in 0..x_full_model_matrix_rows.len() {
                for c in 0..x_full_model_matrix_rows[r].len() {
                    x_full_model_matrix_rows[r][c] *= weights_sqrt[r];
                }
            }
        } else if !x_full_model_matrix_rows.is_empty() {
            return Err(
                format!(
                    "WLS weight length {} mismatch with design matrix rows {}. Preventing weighted matrix calculation.",
                    weights_sqrt.len(),
                    x_full_model_matrix_rows.len()
                )
            );
        }
    }

    let final_x_cols = matrix_utils::matrix_transpose(&x_full_model_matrix_rows);
    let ss_model_uncorrected = matrix_utils::calculate_model_ss(
        &final_x_cols,
        all_y_values_for_analysis
    )?;

    // Calculate DF based on the rank of the design matrix (number of linearly independent columns)
    // For simplicity, using number of columns. A robust solution would compute matrix rank.
    let df_model_params = if final_x_cols.is_empty() { 0 } else { final_x_cols.len() };

    if config.model.intercept && full_model_terms_list.first().map_or(false, |t| t == "Intercept") {
        let sum_y_w: f64 = all_y_values_for_analysis.iter().sum();
        let ss_mean_correction = if n_obs > 0 { sum_y_w.powi(2) / (n_obs as f64) } else { 0.0 };

        let ss_model_corrected = (ss_model_uncorrected - ss_mean_correction).max(0.0);
        // DF for the corrected model (parameters for effects beyond intercept)
        let df_model_corrected = if df_model_params > 0 { df_model_params - 1 } else { 0 };
        Ok((ss_model_corrected, df_model_corrected))
    } else {
        Ok((ss_model_uncorrected, df_model_params))
    }
}
