use std::collections::HashMap;
use statrs::statistics::Statistics;

use crate::univariate::models::{
    config::{ SumOfSquaresMethod, UnivariateConfig },
    data::{ AnalysisData },
    result::{ TestEffectEntry, TestsBetweenSubjectsEffects },
};

use super::core::*;
use super::hypothesis_matrix;

/// Calculate between-subjects effects for the statistical model
pub fn calculate_tests_between_subjects_effects(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<TestsBetweenSubjectsEffects, String> {
    let design_info = create_design_response_weights(data, config).map_err(|e| {
        format!("Failed to create design matrix for Between Subjects Effects: {}", e)
    })?;

    let (r_squared, adj_r_squared, source_map) = if design_info.n_samples == 0 {
        let y_mean = design_info.y.mean();
        let ss_total_corrected = if design_info.n_samples > 0 {
            design_info.y
                .iter()
                .map(|val| (val - y_mean).powi(2))
                .sum::<f64>()
        } else {
            0.0
        };
        let mut source = HashMap::new();
        source.insert("Corrected Total".to_string(), TestEffectEntry {
            sum_of_squares: ss_total_corrected,
            df: design_info.n_samples.saturating_sub(1),
            mean_square: if design_info.n_samples > 1 {
                ss_total_corrected / ((design_info.n_samples - 1) as f64)
            } else {
                0.0
            },
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: f64::NAN,
            noncent_parameter: f64::NAN,
            observed_power: f64::NAN,
        });
        (0.0, 0.0, source)
    } else if design_info.p_parameters == 0 {
        let y_mean = design_info.y.mean();
        let ss_total_corrected = design_info.y
            .iter()
            .map(|val| (val - y_mean).powi(2))
            .sum::<f64>();
        let mut source = HashMap::new();
        source.insert("Corrected Total".to_string(), TestEffectEntry {
            sum_of_squares: ss_total_corrected,
            df: design_info.n_samples.saturating_sub(1),
            mean_square: if design_info.n_samples > 1 {
                ss_total_corrected / ((design_info.n_samples - 1) as f64)
            } else {
                0.0
            },
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: f64::NAN,
            noncent_parameter: f64::NAN,
            observed_power: f64::NAN,
        });
        (0.0, 0.0, source)
    } else {
        let ztwz_matrix = create_cross_product_matrix(&design_info).map_err(|e| {
            format!("Failed to create cross-product matrix: {}", e)
        })?;

        let swept_info_option = perform_sweep_and_extract_results(
            &ztwz_matrix,
            design_info.p_parameters
        )
            .map_err(|e| format!("Failed during SWEEP operation: {}", e))
            .ok();

        let mut current_source_map: HashMap<String, TestEffectEntry> = HashMap::new();

        let y_mean = design_info.y.mean();
        let ss_total_corrected = design_info.y
            .iter()
            .map(|val| (val - y_mean).powi(2))
            .sum::<f64>();
        let df_total = design_info.n_samples.saturating_sub(1);

        let ss_error = swept_info_option
            .as_ref()
            .map(|info| info.s_rss)
            .unwrap_or(0.0);
        let df_error = design_info.n_samples - design_info.r_x_rank;

        if df_error <= 0 {
            if design_info.n_samples == design_info.r_x_rank && design_info.n_samples > 0 {
                // Saturated model
            } else {
                return Err(
                    format!("Error degrees of freedom ({}) is not positive. Cannot proceed.", df_error)
                );
            }
        }
        let ms_error = if df_error > 0 { ss_error / (df_error as f64) } else { 0.0 };
        let ss_model_corrected = (ss_total_corrected - ss_error).max(0.0);
        let df_model =
            design_info.r_x_rank - (if design_info.intercept_column.is_some() { 1 } else { 0 });

        let current_r_squared = if ss_total_corrected.abs() > 1e-9 {
            (ss_model_corrected / ss_total_corrected).max(0.0).min(1.0)
        } else {
            0.0
        };
        let current_adj_r_squared = if df_total > 0 && df_error > 0 && df_total != df_model {
            (1.0 - ((1.0 - current_r_squared) * (df_total as f64)) / (df_error as f64)).max(0.0)
        } else {
            current_r_squared
        };

        let mut model_terms_for_table: Vec<String> = design_info.term_column_indices
            .keys()
            .cloned()
            .collect();
        model_terms_for_table.sort();

        if config.model.intercept && design_info.intercept_column.is_some() {
            let sum_y = design_info.y.iter().sum::<f64>();
            let ss_intercept = if design_info.n_samples > 0 {
                sum_y.powi(2) / (design_info.n_samples as f64)
            } else {
                0.0
            };
            let df_intercept = 1;
            let ms_intercept = ss_intercept;
            let f_intercept = if ms_error > 1e-9 { ms_intercept / ms_error } else { f64::NAN };
            let sig_intercept = calculate_f_significance(df_intercept, df_error, f_intercept);
            current_source_map.insert("Intercept".to_string(), TestEffectEntry {
                sum_of_squares: ss_intercept,
                df: df_intercept,
                mean_square: ms_intercept,
                f_value: f_intercept,
                significance: sig_intercept,
                partial_eta_squared: f64::NAN,
                noncent_parameter: f64::NAN,
                observed_power: f64::NAN,
            });
        }

        if
            config.model.sum_of_square_method == SumOfSquaresMethod::TypeIII ||
            config.model.sum_of_square_method == SumOfSquaresMethod::TypeIV
        {
            for term_name in model_terms_for_table.iter() {
                if term_name == "Intercept" {
                    continue;
                } // Usually Type III/IV not for intercept row here

                let l_matrix_for_term = (match config.model.sum_of_square_method {
                    SumOfSquaresMethod::TypeIII => {
                        hypothesis_matrix::construct_type_iii_l_matrix(
                            &design_info,
                            term_name,
                            &design_info.term_names,
                            config,
                            data,
                            &swept_info_option
                        )
                    }
                    SumOfSquaresMethod::TypeIV => {
                        // TODO: Differentiate Type IV L-matrix construction if needed
                        hypothesis_matrix::construct_type_iv_l_matrix(
                            &design_info,
                            term_name,
                            &design_info.term_names,
                            config,
                            data,
                            &swept_info_option
                        )
                    }
                    _ => unreachable!("SS method already checked"),
                })?; // Propagate error if L-matrix construction fails

                // Ensure swept_info exists before proceeding
                if swept_info_option.is_none() {
                    return Err(
                        "SWEEP operation failed, cannot calculate Type III/IV SS.".to_string()
                    );
                }
                let swept_info = swept_info_option.as_ref().unwrap();

                let (ss_term, df_term) = calculate_type_iii_ss(
                    &l_matrix_for_term,
                    &swept_info.beta_hat,
                    &swept_info.g_inv,
                    term_name
                )?;

                if df_term == 0 && l_matrix_for_term.nrows() > 0 {
                    current_source_map.insert(term_name.clone(), TestEffectEntry {
                        sum_of_squares: 0.0,
                        df: 0,
                        mean_square: 0.0,
                        f_value: f64::NAN,
                        significance: f64::NAN,
                        partial_eta_squared: 0.0,
                        noncent_parameter: 0.0,
                        observed_power: 0.0,
                    });
                    continue;
                } else if l_matrix_for_term.nrows() == 0 {
                    current_source_map.insert(term_name.clone(), TestEffectEntry {
                        sum_of_squares: 0.0,
                        df: 0,
                        mean_square: 0.0,
                        f_value: f64::NAN,
                        significance: f64::NAN,
                        partial_eta_squared: 0.0,
                        noncent_parameter: 0.0,
                        observed_power: 0.0,
                    });
                    continue;
                }

                let ms_term = if df_term > 0 { ss_term / (df_term as f64) } else { 0.0 };
                let f_value = if ms_error > 1e-9 && df_term > 0 {
                    ms_term / ms_error
                } else {
                    f64::NAN
                };
                let significance = calculate_f_significance(df_term, df_error, f_value);
                let partial_eta_sq = if (ss_term + ss_error).abs() > 1e-9 && ss_error >= 0.0 {
                    (ss_term / (ss_term + ss_error)).max(0.0).min(1.0)
                } else if ss_term.abs() > 1e-9 {
                    1.0
                } else {
                    0.0
                };

                let non_centrality = calculate_f_non_centrality(
                    f_value,
                    df_term as f64,
                    df_error as f64
                );
                let obs_power = calculate_observed_power_f(
                    f_value,
                    df_term as f64,
                    df_error as f64,
                    config.options.sig_level
                );

                current_source_map.insert(term_name.clone(), TestEffectEntry {
                    sum_of_squares: ss_term,
                    df: df_term,
                    mean_square: ms_term,
                    f_value,
                    significance,
                    partial_eta_squared: partial_eta_sq,
                    noncent_parameter: non_centrality,
                    observed_power: obs_power,
                });
            }
        } else if config.model.sum_of_square_method == SumOfSquaresMethod::TypeI {
            return Err(
                "Type I SS for Between Subjects Effects not yet fully refactored.".to_string()
            );
        } else if config.model.sum_of_square_method == SumOfSquaresMethod::TypeII {
            return Err(
                "Type II SS for Between Subjects Effects not yet fully refactored.".to_string()
            );
        }

        // Calculate and add Corrected Model statistics
        let df_model_corrected =
            design_info.r_x_rank - (if design_info.intercept_column.is_some() { 1 } else { 0 });
        let ss_model_corrected = (ss_total_corrected - ss_error).max(0.0);

        if df_model_corrected > 0 {
            let ms_model_corrected = ss_model_corrected / (df_model_corrected as f64);
            let f_model_corrected = if ms_error > 1e-9 {
                ms_model_corrected / ms_error
            } else {
                f64::NAN
            };
            let sig_model_corrected = calculate_f_significance(
                df_model_corrected,
                df_error,
                f_model_corrected
            );
            // Partial Eta Squared for Corrected Model is equivalent to R-squared
            let pes_model_corrected = if ss_total_corrected.abs() > 1e-9 {
                (ss_model_corrected / ss_total_corrected).max(0.0).min(1.0)
            } else {
                0.0
            };
            let ncp_model_corrected = calculate_f_non_centrality(
                f_model_corrected,
                df_model_corrected as f64,
                df_error as f64
            );
            let power_model_corrected = calculate_observed_power_f(
                f_model_corrected,
                df_model_corrected as f64,
                df_error as f64,
                config.options.sig_level
            );

            current_source_map.insert("Corrected Model".to_string(), TestEffectEntry {
                sum_of_squares: ss_model_corrected,
                df: df_model_corrected,
                mean_square: ms_model_corrected,
                f_value: f_model_corrected,
                significance: sig_model_corrected,
                partial_eta_squared: pes_model_corrected, // This is R-squared essentially for this row
                noncent_parameter: ncp_model_corrected,
                observed_power: power_model_corrected,
            });
        }

        current_source_map.insert("Error".to_string(), TestEffectEntry {
            sum_of_squares: ss_error,
            df: df_error,
            mean_square: ms_error,
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: f64::NAN,
            noncent_parameter: f64::NAN,
            observed_power: f64::NAN,
        });
        current_source_map.insert("Corrected Total".to_string(), TestEffectEntry {
            sum_of_squares: ss_total_corrected,
            df: df_total,
            mean_square: if df_total > 0 {
                ss_total_corrected / (df_total as f64)
            } else {
                0.0
            },
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: f64::NAN,
            noncent_parameter: f64::NAN,
            observed_power: f64::NAN,
        });

        // Calculate Total Sum of Squares (Uncorrected)
        let ss_total_uncorrected = design_info.y
            .iter()
            .map(|val| val.powi(2))
            .sum::<f64>();
        let df_total_uncorrected = design_info.n_samples;

        current_source_map.insert("Total".to_string(), TestEffectEntry {
            sum_of_squares: ss_total_uncorrected,
            df: df_total_uncorrected,
            mean_square: if df_total_uncorrected > 0 {
                ss_total_uncorrected / (df_total_uncorrected as f64)
            } else {
                0.0
            },
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: f64::NAN,
            noncent_parameter: f64::NAN,
            observed_power: f64::NAN,
        });

        (current_r_squared, current_adj_r_squared, current_source_map)
    };

    Ok(TestsBetweenSubjectsEffects {
        source: source_map,
        r_squared,
        adjusted_r_squared: adj_r_squared,
        notes: Vec::new(),
    })
}
