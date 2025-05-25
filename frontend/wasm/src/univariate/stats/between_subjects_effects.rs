use std::collections::HashMap;
use nalgebra::{ DMatrix, DVector };

use crate::univariate::models::{
    config::{ SumOfSquaresMethod, UnivariateConfig },
    data::{ AnalysisData },
    result::{ TestEffectEntry, TestsBetweenSubjectsEffects },
};

use super::core::*;
use super::hypothesis_matrix;
use super::sum_of_squares;

/// Calculate between-subjects effects for the statistical model
pub fn calculate_tests_between_subjects_effects(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<TestsBetweenSubjectsEffects, String> {
    let design_info = create_design_response_weights(data, config).map_err(|e| {
        format!("Failed to create design matrix for Between Subjects Effects: {}", e)
    })?;

    // Handle cases with no data or no parameters early
    if design_info.n_samples == 0 {
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
        return Ok(TestsBetweenSubjectsEffects {
            source,
            r_squared: 0.0,
            adjusted_r_squared: 0.0,
            notes: Vec::new(),
        });
    }
    if
        design_info.p_parameters == 0 &&
        config.model.sum_of_square_method != SumOfSquaresMethod::TypeI
    {
        // Type I might still report Total SS
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
        return Ok(TestsBetweenSubjectsEffects {
            source,
            r_squared: 0.0,
            adjusted_r_squared: 0.0,
            notes: Vec::new(),
        });
    }

    let ztwz_matrix = create_cross_product_matrix(&design_info).map_err(|e| {
        format!("Failed to create cross-product matrix: {}", e)
    })?;

    // Perform a full sweep for overall model results (beta_hat, g_inv, final RSS)
    // This is needed for MS_Error, and for Type II, III, IV SS calculations.
    let swept_info_full_model_option = if design_info.p_parameters > 0 {
        perform_sweep_and_extract_results(&ztwz_matrix, design_info.p_parameters).ok()
    } else {
        // If no parameters, RSS is Y'WY (or Y'Corrected Y if intercept was notionally there)
        // ZTWZ here would be just Y'WY (1x1 matrix)
        Some(SweptMatrixInfo {
            g_inv: DMatrix::zeros(0, 0),
            beta_hat: DVector::zeros(0),
            s_rss: ztwz_matrix[(0, 0)], // Assuming ZTWZ is Y'WY if p=0
        })
    };

    let mut current_source_map: HashMap<String, TestEffectEntry> = HashMap::new();

    let y_mean = design_info.y.mean();
    let ss_total_corrected = design_info.y
        .iter()
        .map(|val| (val - y_mean).powi(2))
        .sum::<f64>();
    let df_total = design_info.n_samples.saturating_sub(1);

    let (ss_error, df_error, ms_error) = if let Some(ref swept_info) = swept_info_full_model_option {
        let current_ss_error = swept_info.s_rss;
        let current_df_error = design_info.n_samples - design_info.r_x_rank;
        if
            current_df_error <= 0 &&
            !(design_info.n_samples == design_info.r_x_rank && design_info.n_samples > 0)
        {
            return Err(format!("Error degrees of freedom ({}) is not positive.", current_df_error));
        }
        let current_ms_error = if current_df_error > 0 {
            current_ss_error / (current_df_error as f64)
        } else {
            0.0
        };
        (current_ss_error, current_df_error, current_ms_error)
    } else if design_info.p_parameters == 0 {
        // No model parameters, error is total corrected variation
        (
            ss_total_corrected,
            df_total,
            if df_total > 0 { ss_total_corrected / (df_total as f64) } else { 0.0 },
        )
    } else {
        return Err(
            "SWEEP operation failed for full model, cannot determine error terms.".to_string()
        );
    };

    let ss_model_corrected = (ss_total_corrected - ss_error).max(0.0);
    let df_model_overall =
        design_info.r_x_rank - (if design_info.intercept_column.is_some() { 1 } else { 0 });

    let current_r_squared = if ss_total_corrected.abs() > 1e-9 {
        (ss_model_corrected / ss_total_corrected).max(0.0).min(1.0)
    } else {
        0.0
    };

    let current_adj_r_squared = if df_total > 0 && df_error > 0 && df_total != df_model_overall {
        (1.0 - ((1.0 - current_r_squared) * (df_total as f64)) / (df_error as f64)).max(0.0)
    } else {
        current_r_squared
    };

    let model_terms_for_table: Vec<String> = design_info.term_names.clone(); // Use ordered terms

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

    if config.model.sum_of_square_method == SumOfSquaresMethod::TypeI {
        let swept_info = swept_info_full_model_option
            .as_ref()
            .ok_or_else(|| "SWEEP info required for Type I SS but not available.".to_string())?;

        for term_name in &model_terms_for_table {
            if term_name == "Intercept" && current_source_map.contains_key("Intercept") {
                continue; // Already handled
            }

            let (ss_term, df_term) = sum_of_squares::calculate_type_i_ss(
                &design_info,
                term_name,
                &model_terms_for_table,
                &swept_info.beta_hat,
                &swept_info.g_inv,
                &ztwz_matrix
            )?;

            if df_term == 0 {
                current_source_map.insert(term_name.clone(), TestEffectEntry::empty_effect(0));
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
            let obs_power = calculate_observed_power_t(
                f_value * (df_term as f64),
                df_error,
                Some(config.options.sig_level)
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
    } else if config.model.sum_of_square_method == SumOfSquaresMethod::TypeII {
        let swept_info = swept_info_full_model_option
            .as_ref()
            .ok_or_else(|| "SWEEP info required for Type II SS but not available.".to_string())?;
        for term_name in model_terms_for_table.iter().filter(|t| **t != "Intercept") {
            let l_matrix_for_term = hypothesis_matrix::construct_type_ii_l_matrix(
                &design_info,
                term_name,
                &design_info.term_names
            )?;
            let (ss_term, df_term) = sum_of_squares::calculate_type_iii_iv_ss_for_term(
                &l_matrix_for_term,
                &swept_info.beta_hat,
                &swept_info.g_inv,
                term_name
            )?;

            if df_term == 0 {
                current_source_map.insert(term_name.clone(), TestEffectEntry::empty_effect(0));
                continue;
            }
            let ms_term = ss_term / (df_term as f64);
            let f_value = if ms_error > 1e-9 { ms_term / ms_error } else { f64::NAN };
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
            let obs_power = calculate_observed_power_t(
                f_value * (df_term as f64),
                df_error,
                Some(config.options.sig_level)
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
    } else if
        config.model.sum_of_square_method == SumOfSquaresMethod::TypeIII ||
        config.model.sum_of_square_method == SumOfSquaresMethod::TypeIV
    {
        let swept_info = swept_info_full_model_option
            .as_ref()
            .ok_or_else(||
                "SWEEP info required for Type III/IV SS but not available.".to_string()
            )?;
        for term_name in model_terms_for_table.iter().filter(|t| **t != "Intercept") {
            let l_matrix_for_term = (match config.model.sum_of_square_method {
                SumOfSquaresMethod::TypeIII =>
                    hypothesis_matrix::construct_type_iii_l_matrix(
                        &design_info,
                        term_name,
                        &design_info.term_names,
                        &swept_info_full_model_option
                    ),
                SumOfSquaresMethod::TypeIV =>
                    hypothesis_matrix::construct_type_iv_l_matrix(
                        &design_info,
                        term_name,
                        &design_info.term_names,
                        &swept_info_full_model_option,
                        config,
                        data
                    ),
                _ => unreachable!(),
            })?;
            let (ss_term, df_term) = sum_of_squares::calculate_type_iii_iv_ss_for_term(
                &l_matrix_for_term,
                &swept_info.beta_hat,
                &swept_info.g_inv,
                term_name
            )?;

            if df_term == 0 {
                current_source_map.insert(term_name.clone(), TestEffectEntry::empty_effect(0));
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
            let obs_power = calculate_observed_power_t(
                f_value * (df_term as f64),
                df_error,
                Some(config.options.sig_level)
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
    }

    // Add Corrected Model, Error, Corrected Total, Total entries
    // ... (existing code for these entries - check consistency with df_model_overall)
    if df_model_overall > 0 {
        let ms_model_corrected = ss_model_corrected / (df_model_overall as f64);
        let f_model_corrected = if ms_error > 1e-9 {
            ms_model_corrected / ms_error
        } else {
            f64::NAN
        };
        let sig_model_corrected = calculate_f_significance(
            df_model_overall,
            df_error,
            f_model_corrected
        );
        let pes_model_corrected = if ss_total_corrected.abs() > 1e-9 {
            (ss_model_corrected / ss_total_corrected).max(0.0).min(1.0)
        } else {
            0.0
        };
        let ncp_model_corrected = calculate_f_non_centrality(
            f_model_corrected,
            df_model_overall as f64,
            df_error as f64
        );
        let power_model_corrected = calculate_observed_power_t(
            f_model_corrected * (df_model_overall as f64),
            df_error,
            Some(config.options.sig_level)
        );
        current_source_map.insert("Corrected Model".to_string(), TestEffectEntry {
            sum_of_squares: ss_model_corrected,
            df: df_model_overall,
            mean_square: ms_model_corrected,
            f_value: f_model_corrected,
            significance: sig_model_corrected,
            partial_eta_squared: pes_model_corrected,
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

    Ok(TestsBetweenSubjectsEffects {
        source: current_source_map,
        r_squared: current_r_squared,
        adjusted_r_squared: current_adj_r_squared,
        notes: if config.model.sum_of_square_method == SumOfSquaresMethod::TypeI {
            vec!["Type I SS placeholder due to missing incremental SWEEP.".to_string()]
        } else {
            Vec::new()
        },
    })
}

/// Membuat TestEffectEntry dengan statistik yang dihitung
pub fn create_effect_entry(
    sum_of_squares: f64,
    df: usize,
    error_ms: f64,
    error_df: usize,
    sig_level: f64
) -> TestEffectEntry {
    let mean_square = if df > 0 { sum_of_squares / (df as f64) } else { 0.0 };
    let f_value = if error_ms > 0.0 && mean_square > 0.0 { mean_square / error_ms } else { 0.0 };
    let significance = if f_value > 0.0 {
        calculate_f_significance(df, error_df, f_value)
    } else {
        1.0
    };
    let partial_eta_squared = if sum_of_squares >= 0.0 && error_df > 0 {
        let error_ss = error_ms * (error_df as f64);
        let eta_sq = sum_of_squares / (sum_of_squares + error_ss);
        eta_sq.max(0.0).min(1.0)
    } else {
        0.0
    };
    let noncent_parameter = if f_value > 0.0 { f_value * (df as f64) } else { 0.0 };
    let observed_power = if f_value > 0.0 {
        calculate_observed_power_t(f_value * (df as f64), error_df, Some(sig_level))
    } else {
        0.0
    };
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
