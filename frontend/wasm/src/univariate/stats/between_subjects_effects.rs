use std::collections::HashMap;
use statrs::statistics::Statistics;

use crate::univariate::models::{
    config::{ SumOfSquaresMethod, UnivariateConfig },
    data::{ AnalysisData },
    result::{ TestEffectEntry, TestsBetweenSubjectsEffects },
};

use super::core::*;

/// Calculate between-subjects effects for the statistical model
pub fn calculate_tests_between_subjects_effects(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<TestsBetweenSubjectsEffects, String> {
    let design_info = create_design_response_weights(data, config).map_err(|e|
        format!("Failed to create design matrix for Between Subjects Effects: {}", e)
    )?;

    if design_info.n_samples == 0 {
        return Err("No data available after processing for Between Subjects Effects.".to_string());
    }

    let (r_squared, adj_r_squared, source_map) = if design_info.p_parameters == 0 {
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
        (0.0, 0.0, source) // R_sq, Adj_R_sq, source_map for p_parameters == 0
    } else {
        let ztwz_matrix = create_cross_product_matrix(&design_info).map_err(|e|
            format!("Failed to create cross-product matrix: {}", e)
        )?;
        let swept_info = perform_sweep_and_extract_results(
            &ztwz_matrix,
            design_info.p_parameters
        ).map_err(|e| format!("Failed during SWEEP operation: {}", e))?;

        let mut current_source_map: HashMap<String, TestEffectEntry> = HashMap::new();

        let y_mean = design_info.y.mean();
        let ss_total_corrected = design_info.y
            .iter()
            .map(|val| (val - y_mean).powi(2))
            .sum::<f64>();
        let df_total = design_info.n_samples.saturating_sub(1);

        let ss_error = swept_info.s_rss;
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
            for term_name in model_terms_for_table.iter().filter(|t| **t != "Intercept") {
                let l_matrix_for_term = create_l_matrix_for_term(&design_info, term_name)?;
                let df_term = l_matrix_for_term.nrows();
                if df_term == 0 {
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

                let ss_term = calculate_type_iii_ss(&design_info, &l_matrix_for_term, term_name)?;

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
                    config.options.sig_level // sig_level is f64 in OptionsConfig
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
        (current_r_squared, current_adj_r_squared, current_source_map)
    };

    Ok(TestsBetweenSubjectsEffects {
        source: source_map, // source_map is now in scope
        r_squared, // r_squared is now in scope
        adjusted_r_squared: adj_r_squared, // adjusted_r_squared is now in scope
    })
}
