use std::collections::{ BTreeMap, HashMap, HashSet };
use nalgebra::{ DMatrix, DVector };

use crate::univariate::{
    models::{
        config::{ CIMethod, UnivariateConfig },
        data::{ AnalysisData, DataValue },
        result::{
            EMMeansResult,
            EMMeansEstimates,
            EMMeansEstimatesEntry,
            PairwiseComparisons,
            PairwiseComparisonsEntry,
            UnivariateTests,
            UnivariateTestsEntry,
            ContrastCoefficientsEntry,
            ConfidenceInterval,
        },
    },
    stats::{
        core::*, // For data_value_to_string, calculate_t_significance, calculate_t_critical, calculate_f_significance
        design_matrix::{
            create_cross_product_matrix,
            create_design_response_weights,
            perform_sweep_and_extract_results,
        },
        factor_utils::{
            generate_all_row_parameter_names_sorted,
            get_factor_levels,
            parse_interaction_term,
            parse_parameter_name,
        },
    },
};

// --- Helper Function: Generate L-vectors for EMMs ---
fn generate_l_vectors_for_emmeans(
    level_combinations_for_spec: &[BTreeMap<String, String>],
    all_model_parameters_names: &[String],
    p_parameters: usize,
    all_factors_in_model_with_their_levels: &HashMap<String, Vec<String>>,
    covariate_means_map: &HashMap<String, f64>,
    covariate_names_from_config: &Vec<String>
) -> Result<(Vec<Vec<f64>>, Vec<String>), String> {
    let mut l_matrix_rows: Vec<Vec<f64>> = Vec::new();
    let mut l_labels: Vec<String> = Vec::new();

    for level_combo_map_for_emm_spec in level_combinations_for_spec {
        let mut l_vector = vec![0.0; p_parameters];
        let mut num_params_in_l = 0; // Count parameters contributing to this L-vector

        let emm_param_name_parts: Vec<String> = level_combo_map_for_emm_spec
            .iter()
            .map(|(f, l)| format!("{}={}", f, l))
            .collect();
        l_labels.push(format!("EMM: {}", emm_param_name_parts.join(", ")));

        for (param_idx, model_param_full_name) in all_model_parameters_names.iter().enumerate() {
            let mut current_param_l_coeff = 1.0;
            let mut matches_current_emm_combo_factors = true; // Assume it matches until a mismatch found

            if model_param_full_name == "Intercept" {
                current_param_l_coeff = 1.0;
            } else if covariate_means_map.contains_key(model_param_full_name) {
                // Pure covariate or pure product-of-covariates parameter
                current_param_l_coeff = *covariate_means_map
                    .get(model_param_full_name)
                    .unwrap_or(&0.0);
            } else {
                // Factor-based parameter, possibly interacting with other factors or covariates
                let parsed_model_param_constituents = parse_parameter_name(model_param_full_name);
                if parsed_model_param_constituents.is_empty() {
                    current_param_l_coeff = 0.0; // Unparseable, non-contributing
                    matches_current_emm_combo_factors = false; // Doesn't match EMM spec
                } else {
                    for (
                        factor_or_cov_name_in_param,
                        level_in_param_if_factor,
                    ) in parsed_model_param_constituents {
                        if factor_or_cov_name_in_param == "Intercept" {
                            continue;
                        }

                        if level_combo_map_for_emm_spec.contains_key(&factor_or_cov_name_in_param) {
                            // This factor from the model parameter IS part of the current EMM specification
                            if
                                level_combo_map_for_emm_spec.get(&factor_or_cov_name_in_param) !=
                                Some(&level_in_param_if_factor)
                            {
                                // Level mismatch for a specified factor -> this model parameter is zero for this EMM
                                matches_current_emm_combo_factors = false;
                                current_param_l_coeff = 0.0;
                                break; // No need to check other parts of this model_param_full_name
                            }
                            // If levels match, its contribution to current_param_l_coeff remains 1 (multiplicatively)
                        } else if
                            covariate_names_from_config.contains(&factor_or_cov_name_in_param)
                        {
                            // This part of the model parameter is a covariate
                            current_param_l_coeff *= *covariate_means_map
                                .get(&factor_or_cov_name_in_param)
                                .unwrap_or(&0.0);
                        } else if
                            all_factors_in_model_with_their_levels.contains_key(
                                &factor_or_cov_name_in_param
                            )
                        {
                            // This factor from the model parameter is NOT in the current EMM specification (e.g., averaging over it)
                            if
                                let Some(other_factor_levels) =
                                    all_factors_in_model_with_their_levels.get(
                                        &factor_or_cov_name_in_param
                                    )
                            {
                                if !other_factor_levels.is_empty() {
                                    current_param_l_coeff /= other_factor_levels.len() as f64;
                                } else {
                                    current_param_l_coeff = 0.0; // Factor with no levels, non-estimable contribution
                                    matches_current_emm_combo_factors = false;
                                    break;
                                }
                            }
                        } else {
                            // Part of model param is not in EMM spec, not a known covariate, and not a known factor from the model.
                            // This might indicate an issue or a parameter that doesn't fit the EMMean structure as defined.
                            // e.g. a product of a factor and a covariate, where the factor itself is not in EMM spec or covariate config
                            // For now, this implies it does not contribute or makes it non-estimable here.
                            current_param_l_coeff = 0.0;
                            matches_current_emm_combo_factors = false;
                            break;
                        }
                    }
                }
            }

            if matches_current_emm_combo_factors {
                // Only assign if all factor parts matched EMM spec (or were averaged/covariate)
                l_vector[param_idx] = current_param_l_coeff;
                if current_param_l_coeff.abs() > 1e-9 {
                    // Check for non-zero contribution
                    num_params_in_l += 1;
                }
            } else {
                l_vector[param_idx] = 0.0; // Ensure it's zero if EMM spec factors didn't match
            }
        }

        // Retain the non-estimable (all zeros) check if needed by downstream, SPSS often shows these as non-estimable.
        if num_params_in_l == 0 && !l_vector.iter().any(|&x| x.abs() > 1e-9) {
            // Non-estimable, ensure vector is all zeros explicitly if logic above didn't guarantee it for some edge case.
            // l_vector = vec![0.0; p_parameters]; // already mostly zero from init or conditions
        }
        l_matrix_rows.push(l_vector);
    }
    Ok((l_matrix_rows, l_labels))
}

// --- Helper Function: Generate EMMeans Estimates Table ---
fn generate_em_estimates_table(
    l_matrix_for_emms: &[Vec<f64>], // Each inner Vec is an L-vector for an EMM
    level_combinations_for_spec: &[BTreeMap<String, String>], // For display names
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>,
    mse: f64,
    df_error: i64,
    sig_level: f64,
    factor_spec_emmeans: &str
) -> EMMeansEstimates {
    let mut emm_estimates_entries = Vec::new();
    let mut emm_levels_collector: Vec<String> = Vec::new();
    let mut emm_means_collector: Vec<f64> = Vec::new();
    let mut emm_std_errors_collector: Vec<f64> = Vec::new();
    let mut emm_ci_collector: Vec<ConfidenceInterval> = Vec::new();

    for (idx, l_vector_data) in l_matrix_for_emms.iter().enumerate() {
        let level_combo_map = &level_combinations_for_spec[idx];
        let emm_param_name_parts: Vec<String> = level_combo_map
            .iter()
            .map(|(f, l)| format!("{}={}", f, l))
            .collect();
        emm_levels_collector.push(emm_param_name_parts.join(", "));

        if l_vector_data.iter().all(|&x| x == 0.0) {
            // Check for non-estimable (zero L-vector)
            emm_means_collector.push(f64::NAN);
            emm_std_errors_collector.push(f64::NAN);
            emm_ci_collector.push(ConfidenceInterval {
                lower_bound: f64::NAN,
                upper_bound: f64::NAN,
            });
            continue;
        }

        let l_vector = DVector::from_column_slice(l_vector_data);
        let emm_value_scalar = (l_vector.transpose() * beta_hat)[(0, 0)];

        let variance_of_emm_matrix = l_vector.transpose() * g_inv * &l_vector * mse;
        let std_error_emm = if variance_of_emm_matrix[(0, 0)] >= 0.0 {
            variance_of_emm_matrix[(0, 0)].sqrt()
        } else {
            f64::NAN
        };

        let t_crit_emm = calculate_t_critical(Some(sig_level), df_error as usize);
        let ci_width_emm = if !t_crit_emm.is_nan() && !std_error_emm.is_nan() {
            std_error_emm * t_crit_emm
        } else {
            f64::NAN
        };

        emm_means_collector.push(emm_value_scalar);
        emm_std_errors_collector.push(std_error_emm);
        emm_ci_collector.push(ConfidenceInterval {
            lower_bound: if !ci_width_emm.is_nan() {
                emm_value_scalar - ci_width_emm
            } else {
                f64::NAN
            },
            upper_bound: if !ci_width_emm.is_nan() {
                emm_value_scalar + ci_width_emm
            } else {
                f64::NAN
            },
        });
    }

    if !emm_levels_collector.is_empty() {
        // Ensure there was at least one level combination
        emm_estimates_entries.push(EMMeansEstimatesEntry {
            levels: emm_levels_collector,
            mean: emm_means_collector,
            standard_error: emm_std_errors_collector,
            confidence_interval: emm_ci_collector,
        });
    }

    EMMeansEstimates {
        entries: emm_estimates_entries,
        notes: vec![format!("Estimates for {}", factor_spec_emmeans)],
    }
}

// --- Helper Function: Generate Pairwise Comparisons Table ---
fn generate_pairwise_comparisons_table(
    main_effect_name: &str,
    main_effect_levels: &[String],
    l_matrix_for_emms: &[Vec<f64>], // L-vectors for the EMMs of the main effect
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>,
    mse: f64,
    df_error: i64,
    config: &UnivariateConfig
) -> Option<PairwiseComparisons> {
    let num_levels_main_effect = main_effect_levels.len();
    if num_levels_main_effect < 2 {
        return None;
    }

    let mut pairwise_entries = Vec::new();
    let num_pairwise_comparisons = (num_levels_main_effect * (num_levels_main_effect - 1)) / 2;
    if num_pairwise_comparisons == 0 {
        return None;
    } // Should be caught by num_levels < 2

    let alpha_pairwise_sig = match config.emmeans.confi_interval_method {
        CIMethod::Bonferroni => config.options.sig_level / (num_pairwise_comparisons as f64),
        CIMethod::Sidak =>
            1.0 - (1.0 - config.options.sig_level).powf(1.0 / (num_pairwise_comparisons as f64)),
        CIMethod::LsdNone => config.options.sig_level,
    };

    for i in 0..num_levels_main_effect {
        for j in 0..num_levels_main_effect {
            // Full table i vs j
            if i == j {
                continue;
            }

            let l_vector_i_data = &l_matrix_for_emms[i];
            let l_vector_j_data = &l_matrix_for_emms[j];

            if
                l_vector_i_data.iter().all(|&x| x == 0.0) ||
                l_vector_j_data.iter().all(|&x| x == 0.0)
            {
                // One of the EMMs is non-estimable, so comparison is also non-estimable
                pairwise_entries.push(PairwiseComparisonsEntry {
                    parameter: vec![
                        format!("{}={}", main_effect_name, main_effect_levels[i]),
                        format!("{}={}", main_effect_name, main_effect_levels[j])
                    ],
                    mean_difference: vec![f64::NAN],
                    standard_error: vec![f64::NAN],
                    significance: vec![f64::NAN],
                    confidence_interval: vec![ConfidenceInterval {
                        lower_bound: f64::NAN,
                        upper_bound: f64::NAN,
                    }],
                });
                continue;
            }

            let l_vector_i = DVector::from_column_slice(l_vector_i_data);
            let l_vector_j = DVector::from_column_slice(l_vector_j_data);

            let emm_i_val = (l_vector_i.transpose() * beta_hat)[(0, 0)];
            let emm_j_val = (l_vector_j.transpose() * beta_hat)[(0, 0)];
            let mean_diff = emm_i_val - emm_j_val;

            let l_vector_diff = &l_vector_i - &l_vector_j;
            let variance_of_diff_matrix = l_vector_diff.transpose() * g_inv * &l_vector_diff * mse;
            let std_error_diff = if variance_of_diff_matrix[(0, 0)] >= 0.0 {
                variance_of_diff_matrix[(0, 0)].sqrt()
            } else {
                f64::NAN
            };

            let t_value_diff = if !std_error_diff.is_nan() && std_error_diff != 0.0 {
                mean_diff / std_error_diff
            } else {
                f64::NAN
            };

            let raw_significance_diff = if !t_value_diff.is_nan() && df_error > 0 {
                calculate_t_significance(t_value_diff.abs(), df_error as usize)
            } else {
                f64::NAN
            };

            let adjusted_significance_diff = if !raw_significance_diff.is_nan() {
                match config.emmeans.confi_interval_method {
                    CIMethod::Bonferroni =>
                        (raw_significance_diff * (num_pairwise_comparisons as f64)).min(1.0),
                    CIMethod::Sidak =>
                        (
                            1.0 -
                            (1.0 - raw_significance_diff).powf(num_pairwise_comparisons as f64)
                        ).min(1.0),
                    CIMethod::LsdNone => raw_significance_diff,
                }
            } else {
                f64::NAN
            };

            // For CI, SPSS uses the adjusted alpha (e.g. Bonferroni/Sidak corrected alpha) for CI width in pairwise table
            let t_crit_pairwise = calculate_t_critical(
                Some(alpha_pairwise_sig / 2.0),
                df_error as usize
            );
            let ci_width_diff = if !t_crit_pairwise.is_nan() && !std_error_diff.is_nan() {
                std_error_diff * t_crit_pairwise
            } else {
                f64::NAN
            };

            pairwise_entries.push(PairwiseComparisonsEntry {
                parameter: vec![
                    format!("{}={}", main_effect_name, main_effect_levels[i]),
                    format!("{}={}", main_effect_name, main_effect_levels[j])
                ],
                mean_difference: vec![mean_diff],
                standard_error: vec![std_error_diff],
                significance: vec![adjusted_significance_diff],
                confidence_interval: vec![ConfidenceInterval {
                    lower_bound: if !ci_width_diff.is_nan() {
                        mean_diff - ci_width_diff
                    } else {
                        f64::NAN
                    },
                    upper_bound: if !ci_width_diff.is_nan() {
                        mean_diff + ci_width_diff
                    } else {
                        f64::NAN
                    },
                }],
            });
        }
    }
    Some(PairwiseComparisons {
        entries: pairwise_entries,
        notes: vec![
            format!(
                "Pairwise comparisons for {}. Adjustment for multiple comparisons: {:?}.",
                main_effect_name,
                config.emmeans.confi_interval_method
            )
        ],
    })
}

// --- Helper Function: Generate Univariate Test Table ---
fn generate_univariate_test_table(
    main_effect_name: &str,
    num_levels_main_effect: usize,
    l_matrix_for_emms: &[Vec<f64>], // L-vectors for the EMMs of the main effect
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>,
    mse: f64,
    df_error: i64,
    p_parameters: usize,
    s_rss: f64, // Sum of Squares for Error (needed for Partial Eta Squared)
    sig_level_option: f64, // Significance level for power calculation if available
    est_effect_size: bool,
    obs_power: bool
) -> Option<UnivariateTests> {
    if num_levels_main_effect < 2 {
        return None;
    }
    let df_hypothesis_uni = num_levels_main_effect - 1;

    // Placeholder for the "Error" row entry
    let error_entry = UnivariateTestsEntry {
        source: "Error".to_string(),
        sum_of_squares: s_rss, // SSE from overall model
        df: df_error as usize, // df_error from overall model
        mean_square: mse, // MSE from overall model
        f_value: f64::NAN,
        significance: f64::NAN,
        partial_eta_squared: 0.0,
        noncent_parameter: 0.0,
        observed_power: 0.0,
    };

    if df_hypothesis_uni == 0 {
        let contrast_entry = UnivariateTestsEntry {
            source: main_effect_name.to_string(),
            sum_of_squares: f64::NAN,
            df: 0,
            mean_square: f64::NAN,
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: 0.0,
            noncent_parameter: 0.0,
            observed_power: 0.0, // Or f64::NAN if preferred for non-tests
        };
        return Some(UnivariateTests {
            entries: vec![contrast_entry, error_entry],
            notes: vec![format!("No hypothesis to test for {} (df_hyp=0)", main_effect_name)],
        });
    }

    // Check if all EMM L-vectors are non-estimable (all zeros)
    if l_matrix_for_emms.iter().all(|l_vec| l_vec.iter().all(|&x| x == 0.0)) {
        let contrast_entry = UnivariateTestsEntry {
            source: main_effect_name.to_string(),
            sum_of_squares: f64::NAN,
            df: df_hypothesis_uni,
            mean_square: f64::NAN,
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: 0.0,
            noncent_parameter: 0.0,
            observed_power: 0.0, // Or f64::NAN
        };
        return Some(UnivariateTests {
            entries: vec![contrast_entry, error_entry],
            notes: vec![
                format!("Cannot perform univariate test for {} (all EMMs non-estimable)", main_effect_name)
            ],
        });
    }

    let mut l_matrix_uni_test_rows_as_vecs: Vec<Vec<f64>> = Vec::new();
    let l_vector_last_level_data = &l_matrix_for_emms[num_levels_main_effect - 1];

    for i in 0..num_levels_main_effect - 1 {
        let l_vector_i_data = &l_matrix_for_emms[i];
        // If either L-vector for the EMMs being contrasted is non-estimable (all zeros), this contrast is also non-estimable for the F-test.
        // However, the F-test construction typically uses k-1 independent contrasts. If some EMMs are non-estimable,
        // the effective df_hypothesis might reduce. For simplicity here, if a component L-vector is zero,
        // that specific contrast row might become zero or problematic. A robust F-test construction might omit such levels.
        // Here, we proceed, and if L*G_inv*L' becomes singular, it's handled.

        let diff_row_data: Vec<f64> = l_vector_i_data
            .iter()
            .zip(l_vector_last_level_data.iter())
            .map(|(a, b)| a - b)
            .collect();
        l_matrix_uni_test_rows_as_vecs.push(diff_row_data);
    }

    let num_uni_rows = l_matrix_uni_test_rows_as_vecs.len();
    let num_uni_cols = if num_uni_rows > 0 {
        l_matrix_uni_test_rows_as_vecs[0].len()
    } else {
        p_parameters
    }; // p_parameters is num_uni_cols

    if num_uni_rows == 0 {
        // This implies df_hypothesis_uni was 0, which should have been caught by the (df_hypothesis_uni == 0) check.
        // However, as a safeguard if L-matrix construction results in no rows for a non-zero df_hyp (unlikely for main effects):
        let contrast_entry = UnivariateTestsEntry {
            source: main_effect_name.to_string(),
            sum_of_squares: f64::NAN,
            df: df_hypothesis_uni, // df_hypothesis_uni would be non-zero here if the first check didn't catch it
            mean_square: f64::NAN,
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: 0.0,
            noncent_parameter: 0.0,
            observed_power: 0.0, // Or f64::NAN
        };
        return Some(UnivariateTests {
            entries: vec![contrast_entry, error_entry],
            notes: vec![
                format!("Cannot perform univariate test for {} (L-matrix has no rows but df_hyp > 0)", main_effect_name)
            ],
        });
    }

    let l_uni_test_nalgebra = DMatrix::from_row_slice(
        num_uni_rows,
        num_uni_cols,
        &l_matrix_uni_test_rows_as_vecs.iter().flatten().cloned().collect::<Vec<f64>>()
    );

    let l_beta_uni: DVector<f64> = &l_uni_test_nalgebra * beta_hat;
    let l_ginv_lt_uni: DMatrix<f64> =
        &l_uni_test_nalgebra * g_inv * l_uni_test_nalgebra.transpose();

    let mut ssh_uni = f64::NAN;
    let mut msh_uni = f64::NAN;
    let mut f_value_uni = f64::NAN;
    let mut sig_uni = f64::NAN;
    let (mut partial_eta_sq_uni, mut noncent_param_uni, mut obs_power_uni) = (
        f64::NAN,
        f64::NAN,
        f64::NAN,
    );

    if let Some(l_ginv_lt_uni_inv) = l_ginv_lt_uni.clone().try_inverse() {
        let ssh_matrix_uni = l_beta_uni.transpose() * l_ginv_lt_uni_inv * &l_beta_uni;
        if ssh_matrix_uni.nrows() == 1 && ssh_matrix_uni.ncols() == 1 {
            ssh_uni = ssh_matrix_uni[(0, 0)];
            if ssh_uni < 0.0 && ssh_uni.abs() > 1e-9 {
                ssh_uni = f64::NAN;
            } else if ssh_uni < 0.0 {
                ssh_uni = 0.0;
            }

            if !ssh_uni.is_nan() && df_hypothesis_uni > 0 {
                msh_uni = ssh_uni / (df_hypothesis_uni as f64);
                if !mse.is_nan() && mse > 1e-12 && df_error > 0 {
                    // Check mse > 0 (small epsilon for float comparison)
                    f_value_uni = msh_uni / mse;

                    if est_effect_size {
                        // Partial Eta Squared = SSH / (SSH + SSE)
                        // SSE (Sum of Squares Error) is s_rss here.
                        if !s_rss.is_nan() && (ssh_uni + s_rss).abs() > 1e-12 {
                            partial_eta_sq_uni = ssh_uni / (ssh_uni + s_rss);
                        } else {
                            partial_eta_sq_uni = 0.0;
                        }
                    }

                    if obs_power {
                        // Noncentrality parameter (lambda) for F-distribution
                        noncent_param_uni = f_value_uni * (df_hypothesis_uni as f64);

                        // Observed Power Calculation
                        if df_error > 0 {
                            obs_power_uni = calculate_observed_power_f(
                                f_value_uni,
                                df_hypothesis_uni as f64,
                                df_error as f64,
                                sig_level_option
                            );
                        } else {
                            obs_power_uni = f64::NAN;
                        }
                    }
                } else if mse == 0.0 && msh_uni > 1e-9 {
                    f_value_uni = f64::INFINITY;
                    if est_effect_size {
                        partial_eta_sq_uni = if ssh_uni > 0.0 { 1.0 } else { 0.0 };
                    }
                    if obs_power {
                        noncent_param_uni = f64::INFINITY;
                        obs_power_uni = if ssh_uni > 0.0 { 1.0 } else { 0.0 };
                    }
                }
                if !f_value_uni.is_nan() && df_error > 0 && df_hypothesis_uni > 0 {
                    sig_uni = calculate_f_significance(
                        df_hypothesis_uni,
                        df_error as usize,
                        f_value_uni
                    );
                }
            }
        }
    } else {
        let is_l_beta_zero = l_beta_uni.iter().all(|&x| x.abs() < 1e-9);
        if is_l_beta_zero {
            ssh_uni = 0.0;
            msh_uni = 0.0;
            f_value_uni = if mse > 0.0 { 0.0 } else { f64::NAN };

            if est_effect_size {
                partial_eta_sq_uni = 0.0;
            }
            if obs_power {
                noncent_param_uni = 0.0;
                // noncent_param_uni remains 0.0
                obs_power_uni = if !f_value_uni.is_nan() && df_hypothesis_uni > 0 && df_error > 0 {
                    calculate_observed_power_f(
                        f_value_uni, // which is 0.0 here if mse > 0
                        df_hypothesis_uni as f64,
                        df_error as f64,
                        sig_level_option
                    )
                } else {
                    f64::NAN
                };
            }

            if !f_value_uni.is_nan() && df_hypothesis_uni > 0 && df_error > 0 {
                sig_uni = calculate_f_significance(
                    df_hypothesis_uni,
                    df_error as usize,
                    f_value_uni
                );
            }
        }
    }

    let contrast_entry = UnivariateTestsEntry {
        source: main_effect_name.to_string(),
        sum_of_squares: ssh_uni,
        df: df_hypothesis_uni,
        mean_square: msh_uni,
        f_value: f_value_uni,
        significance: sig_uni,
        partial_eta_squared: partial_eta_sq_uni,
        noncent_parameter: noncent_param_uni,
        observed_power: obs_power_uni,
    };

    Some(UnivariateTests {
        entries: vec![contrast_entry, error_entry],
        notes: vec![format!("Univariate test for {}", main_effect_name)],
    })
}

// --- Helper to generate level combinations for a specific factor_spec ---
fn get_factor_level_combinations(
    factors_in_spec: &[&str],
    all_factors_in_model_with_their_levels: &HashMap<String, Vec<String>>
) -> Result<Vec<BTreeMap<String, String>>, String> {
    let mut current_spec_factor_levels_map: HashMap<String, Vec<String>> = HashMap::new();
    for &factor_name_in_spec in factors_in_spec {
        if let Some(levels) = all_factors_in_model_with_their_levels.get(factor_name_in_spec) {
            current_spec_factor_levels_map.insert(factor_name_in_spec.to_string(), levels.clone());
        } else {
            return Err(
                format!("Factor '{}' not found in model or has no levels.", factor_name_in_spec)
            );
        }
    }

    let mut level_combinations_for_spec: Vec<BTreeMap<String, String>> = Vec::new();
    let mut temp_combo_vec: Vec<(String, String)> = Vec::new();

    generate_emmeans_level_combos_recursive(
        factors_in_spec,
        &current_spec_factor_levels_map,
        0,
        &mut temp_combo_vec,
        &mut level_combinations_for_spec
    );
    Ok(level_combinations_for_spec)
}

// Recursive helper for level combinations (renamed to avoid conflict if original is kept elsewhere)
fn generate_emmeans_level_combos_recursive(
    factors: &[&str],
    levels_map: &HashMap<String, Vec<String>>,
    current_idx: usize,
    current_path: &mut Vec<(String, String)>,
    output: &mut Vec<BTreeMap<String, String>>
) {
    if current_idx == factors.len() {
        let btree_map: BTreeMap<_, _> = current_path.iter().cloned().collect();
        output.push(btree_map);
        return;
    }
    let factor_name = factors[current_idx];
    if let Some(levels) = levels_map.get(factor_name) {
        for level in levels {
            current_path.push((factor_name.to_string(), level.clone()));
            generate_emmeans_level_combos_recursive(
                factors,
                levels_map,
                current_idx + 1,
                current_path,
                output
            );
            current_path.pop();
        }
    } else {
        // Factor not in levels_map, should have been caught by earlier checks in get_factor_level_combinations
        // Potentially skip or log an error if this path is reached.
        // For now, to ensure recursion completes for other factors, proceed without adding this one.
        generate_emmeans_level_combos_recursive(
            factors,
            levels_map,
            current_idx + 1,
            current_path,
            output
        );
    }
}

fn generate_l_vector_for_grand_mean(
    all_model_parameters_names: &[String],
    p_parameters: usize,
    all_factors_in_model_with_their_levels: &HashMap<String, Vec<String>>,
    _design_info_term_names: &[String], // Unused for now, but kept for signature consistency
    covariate_means_map: &HashMap<String, f64>,
    covariate_names_from_config: &Vec<String>
) -> Result<Vec<f64>, String> {
    let mut l_vector = vec![0.0; p_parameters];

    for (param_idx, model_param_full_name) in all_model_parameters_names.iter().enumerate() {
        if model_param_full_name == "Intercept" {
            l_vector[param_idx] = 1.0;
        } else if covariate_means_map.contains_key(model_param_full_name) {
            // Parameter is a pure covariate (e.g., "CovX") or a pure product of covariates (e.g., "CovX*CovY")
            // whose mean is already calculated and in covariate_means_map.
            l_vector[param_idx] = *covariate_means_map.get(model_param_full_name).unwrap_or(&0.0);
        } else {
            // Parameter is factor-based, or an interaction involving factors and potentially covariates.
            let parsed_model_param_parts = parse_interaction_term(model_param_full_name);
            let mut current_param_l_coeff = 1.0;
            let mut is_estimable_component = true;

            if parsed_model_param_parts.is_empty() && model_param_full_name != "Intercept" {
                // Should not happen if parsing is robust, means unparseable non-intercept param name
                current_param_l_coeff = 0.0; // Treat as non-contributing to grand mean
            } else {
                for part_name in parsed_model_param_parts {
                    if covariate_names_from_config.contains(&part_name) {
                        // This part is a configured covariate
                        current_param_l_coeff *= *covariate_means_map
                            .get(&part_name)
                            .unwrap_or(&0.0);
                    } else if all_factors_in_model_with_their_levels.contains_key(&part_name) {
                        // This part is a factor name
                        if
                            let Some(levels) = all_factors_in_model_with_their_levels.get(
                                &part_name
                            )
                        {
                            if !levels.is_empty() {
                                current_param_l_coeff /= levels.len() as f64;
                            } else {
                                // Factor with no levels, makes parameter non-estimable for grand mean contribution
                                is_estimable_component = false;
                                break;
                            }
                        }
                    } else {
                        // Part is neither a known covariate nor a known factor (e.g. specific level like "FactorA=1")
                        // For grand mean, we consider the factor name for averaging, not its specific levels.
                        // If model_param_full_name was "FactorA=1*FactorB=2", parse_interaction_term would give ["FactorA=1", "FactorB=2"]
                        // This logic needs to handle the fact that model_param_full_name from design matrix is already specific.
                        // The previous logic in generate_l_vector_for_grand_mean was closer for factor parts:
                        // It used parse_parameter_name which breaks "FactorA=1" into {"FactorA": "1"}
                        // Let's re-evaluate based on that.

                        // Reverting to logic more similar to the original grand mean, but integrating covariates:
                        // The goal is: for a parameter like [FactorA=level1]*[CovX], L-coeff is (1/N_levels_A) * mean(CovX)
                        // For [FactorA=level1]*[FactorB=level2], L-coeff is (1/N_levels_A) * (1/N_levels_B)
                        // This loop needs to identify factor names from parameter parts to get N_levels.
                        // The `model_param_full_name` is what we have. Example: "[gender=1]*[section=1]"
                        // We need to parse this into constituent factors/covariates.
                        // `parse_parameter_name` is better here as it gives map: {"gender": "1", "section": "1"}
                        // The L-coeff calculation should be outside this loop, once for the whole model_param_full_name.
                        // This loop was trying to do it part by part which is incorrect for interactions.
                        is_estimable_component = false; // Mark and break, will recalculate below using parse_parameter_name
                        break;
                    }
                }
            }

            if !is_estimable_component || model_param_full_name == "Intercept" {
                // Reset and re-evaluate with parse_parameter_name for interactions / complex terms
                current_param_l_coeff = 1.0; // Start fresh for product logic
                is_estimable_component = true; // Assume estimable until proven otherwise
                let detailed_parsed_param = parse_parameter_name(model_param_full_name);
                if detailed_parsed_param.is_empty() && model_param_full_name != "Intercept" {
                    current_param_l_coeff = 0.0; // Truly unparseable or not relevant
                } else {
                    for (name_part, _level_part) in detailed_parsed_param {
                        if name_part == "Intercept" {
                            continue;
                        }
                        if covariate_names_from_config.contains(&name_part) {
                            current_param_l_coeff *= *covariate_means_map
                                .get(&name_part)
                                .unwrap_or(&0.0);
                        } else if
                            let Some(levels) = all_factors_in_model_with_their_levels.get(
                                &name_part
                            )
                        {
                            if !levels.is_empty() {
                                current_param_l_coeff /= levels.len() as f64;
                            } else {
                                is_estimable_component = false;
                                break;
                            }
                        } else {
                            // Name part is not intercept, not a configured covariate, not a factor with levels => problem or unhandled case.
                            is_estimable_component = false;
                            break;
                        }
                    }
                }
            }

            l_vector[param_idx] = if is_estimable_component { current_param_l_coeff } else { 0.0 };
        }
    }
    Ok(l_vector)
}

// Helper to prepare a map of means for covariates and covariate product terms
fn prepare_covariate_data_for_lmatrix(
    raw_data_matrix: &DMatrix<f64>, // Full raw data (n_obs x n_vars_in_raw)
    data_headers: &[String], // Headers for raw_data_matrix columns
    config_covariates: Option<&Vec<String>>, // Names of covariates from config
    all_model_parameter_names: &[String] // All parameters in the current model
) -> Result<HashMap<String, f64>, String> {
    let mut means_map = HashMap::new();
    if raw_data_matrix.nrows() == 0 {
        return Ok(means_map);
    }

    let Some(cfg_covars) = config_covariates else {
        // No covariates configured, so no specific means to calculate beyond what might be direct product terms
        // Still check for product terms made of things that might implicitly be covariates if they are params
        // For now, if no config_covariates, assume no covariate processing needed here.
        // This part might need refinement if model can have covariates not listed in config.main.covar
        // but present in all_model_parameter_names.
        // For robustness, should probably try to identify covariates from all_model_parameter_names if config_covariates is None/empty.
        // However, the primary source of truth for "what is a covariate" should be the config.
        return Ok(means_map);
    };

    // 1. Calculate means for individual covariates listed in config
    for cov_name in cfg_covars {
        if let Some(col_idx) = data_headers.iter().position(|h| h == cov_name) {
            if raw_data_matrix.ncols() > col_idx {
                let cov_mean = raw_data_matrix.column(col_idx).mean();
                means_map.insert(cov_name.clone(), cov_mean);
            } else {
                return Err(
                    format!(
                        "Covariate '{}' column index {} out of bounds for data matrix with {} columns.",
                        cov_name,
                        col_idx,
                        raw_data_matrix.ncols()
                    )
                );
            }
        } else {
            // If a configured covariate is part of the model parameters, it must be in data headers.
            if all_model_parameter_names.iter().any(|p| p == cov_name) {
                return Err(
                    format!("Covariate '{}' (in model parameters) not found in data headers.", cov_name)
                );
            }
        }
    }

    // 2. Calculate means for product-of-covariate terms that appear as model parameters
    for param_name in all_model_parameter_names {
        if means_map.contains_key(param_name) {
            continue;
        } // Already handled (is an individual covariate)
        if param_name == "Intercept" {
            continue;
        }

        // Attempt to parse as interaction, e.g., "COV1*COV2"
        let constituent_terms = parse_interaction_term(param_name);
        if constituent_terms.len() <= 1 {
            continue;
        } // Not a product term relevant here, or unparsable

        let mut is_product_of_known_config_covariates = true;
        let mut col_indices_for_product: Vec<usize> = Vec::new();

        for term_part_name in &constituent_terms {
            if cfg_covars.contains(term_part_name) {
                if let Some(col_idx) = data_headers.iter().position(|h| h == term_part_name) {
                    if raw_data_matrix.ncols() > col_idx {
                        col_indices_for_product.push(col_idx);
                    } else {
                        is_product_of_known_config_covariates = false;
                        break;
                    }
                } else {
                    // This part of product term is a configured covariate but not in data headers.
                    is_product_of_known_config_covariates = false;
                    break;
                }
            } else {
                // This part is not a configured covariate, so param_name is not a pure product-of-configured-covariates.
                is_product_of_known_config_covariates = false;
                break;
            }
        }

        if
            is_product_of_known_config_covariates &&
            !col_indices_for_product.is_empty() &&
            col_indices_for_product.len() == constituent_terms.len()
        {
            // Ensure all parts were resolved to columns
            let mut product_column_values = DVector::from_element(raw_data_matrix.nrows(), 1.0);
            for &col_idx in &col_indices_for_product {
                product_column_values.component_mul_assign(&raw_data_matrix.column(col_idx));
            }
            means_map.insert(param_name.clone(), product_column_values.mean());
        }
    }
    Ok(means_map)
}

pub fn calculate_emmeans(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<EMMeansResult, String> {
    let design_info = create_design_response_weights(data, config).map_err(|e| {
        format!("Failed to create design matrix for EMMeans: {}", e)
    })?;

    if design_info.p_parameters == 0 {
        return Err("No parameters in the model for EMMeans calculation.".to_string());
    }

    let all_model_parameters_names = generate_all_row_parameter_names_sorted(
        &design_info,
        data
    ).map_err(|e| { format!("Failed to generate model parameter names for EMMeans: {}", e) })?;

    // Prepare raw covariate matrix and its headers for mean calculation
    let (raw_covariate_matrix, raw_covariate_headers) = if
        let Some(config_cov_names) = config.main.covar.as_ref().filter(|c| !c.is_empty())
    {
        if
            let Some(cov_data_groups) = data.covariate_data
                .as_ref()
                .filter(|cdg| !cdg.is_empty() && !cdg[0].is_empty())
        {
            let data_records_for_covs = &cov_data_groups[0]; // Assuming first group holds the data
            let n_obs = data_records_for_covs.len();
            let n_covs = config_cov_names.len();
            let mut matrix_values_row_major = Vec::with_capacity(n_obs * n_covs);

            for obs_idx in 0..n_obs {
                let obs_record = &data_records_for_covs[obs_idx];
                for cov_name in config_cov_names {
                    match obs_record.values.get(cov_name) {
                        Some(data_value) => {
                            // Inlined logic to convert DataValue to Option<f64>
                            let val_opt: Option<f64> = match data_value {
                                DataValue::Number(n) => Some(*n as f64),
                                DataValue::NumberFloat(f) => Some(*f),
                                // Other DataValue types are treated as not convertible to f64 for this context
                                _ => None,
                            };
                            matrix_values_row_major.push(val_opt.unwrap_or(f64::NAN));
                        }
                        None => matrix_values_row_major.push(f64::NAN), // Covariate not found in this record
                    }
                }
            }
            (
                DMatrix::from_row_slice(n_obs, n_covs, &matrix_values_row_major),
                config_cov_names.clone(),
            )
        } else {
            // No covariate data records in AnalysisData, or first group is empty
            (DMatrix::<f64>::zeros(0, 0), Vec::new())
        }
    } else {
        // No covariates configured
        (DMatrix::<f64>::zeros(0, 0), Vec::new())
    };

    let covariate_means_map = prepare_covariate_data_for_lmatrix(
        &raw_covariate_matrix,
        &raw_covariate_headers, // Headers corresponding to raw_covariate_matrix
        config.main.covar.as_ref(), // Configured covariate names to guide processing in helper
        &all_model_parameters_names
    ).map_err(|e| format!("Failed to prepare covariate data for EMMeans: {}", e))?;

    let ztz_matrix = create_cross_product_matrix(&design_info).map_err(|e| {
        format!("Failed to create cross-product matrix for EMMeans: {}", e)
    })?;

    let swept_info = perform_sweep_and_extract_results(
        &ztz_matrix,
        design_info.p_parameters
    ).map_err(|e| { format!("Failed to perform sweep operations for EMMeans: {}", e) })?;

    let beta_hat = &swept_info.beta_hat;
    let g_inv = &swept_info.g_inv;
    let s_rss = swept_info.s_rss;
    let df_error = (design_info.n_samples as i64) - (design_info.r_x_rank as i64);
    let mse = if df_error > 0 { s_rss / (df_error as f64) } else { f64::NAN };

    if mse.is_nan() || df_error <= 0 {
        return Err(
            "MSE is NaN or df_error is not positive. Cannot proceed with EMMeans.".to_string()
        );
    }

    let mut all_factors_in_model_with_their_levels: HashMap<String, Vec<String>> = HashMap::new();
    let mut unique_factors_from_terms: HashSet<String> = HashSet::new();
    for term_name in &design_info.term_names {
        if term_name == "Intercept" {
            continue;
        }
        term_name.split('*').for_each(|f_name_part| {
            let f_name = f_name_part.trim().to_string();
            // Ensure it's a factor, not a covariate, before adding to unique_factors_from_terms
            let is_covariate = config.main.covar.as_ref().map_or(false, |c| c.contains(&f_name));
            let is_wls = config.main.wls_weight.as_ref().map_or(false, |w| w == &f_name);
            // Also check against dependent var just in case though unlikely to be a term component
            let is_dep_var = config.main.dep_var.as_ref().map_or(false, |d| d == &f_name);

            if !is_covariate && !is_wls && !is_dep_var {
                unique_factors_from_terms.insert(f_name);
            }
        });
    }
    for f_name in unique_factors_from_terms {
        if let Ok(levels) = get_factor_levels(data, &f_name) {
            if !levels.is_empty() {
                all_factors_in_model_with_their_levels.insert(f_name.clone(), levels);
            }
        }
    }

    // MODIFIED: If target_list is None or Some([]), return an empty result.
    // Otherwise, use the provided target_list. No default to all model terms.
    let factors_to_analyze_for_emmeans: Vec<String> = match config.emmeans.target_list.as_ref() {
        Some(targets) if !targets.is_empty() => targets.clone(), // Use if Some and not empty
        _ => {
            // Covers None and Some([])
            return Ok(EMMeansResult {
                parameter_names: Vec::new(),
                contrast_coefficients: Vec::new(),
                em_estimates: Vec::new(),
                pairwise_comparisons: None,
                univariate_tests: None,
            });
        }
    };

    let mut emmeans_results_param_names: Vec<String> = Vec::new();
    let mut emmeans_contrast_coeffs_list: Vec<ContrastCoefficientsEntry> = Vec::new();
    let mut emmeans_estimates_list: Vec<EMMeansEstimates> = Vec::new();
    let mut emmeans_pairwise_list: Vec<PairwiseComparisons> = Vec::new();
    let mut emmeans_univariate_tests_list: Vec<UnivariateTests> = Vec::new();

    for factor_spec_emmeans in &factors_to_analyze_for_emmeans {
        emmeans_results_param_names.push(factor_spec_emmeans.clone());

        if factor_spec_emmeans == "(OVERALL)" {
            let grand_mean_l_vector = match
                generate_l_vector_for_grand_mean(
                    &all_model_parameters_names,
                    design_info.p_parameters,
                    &all_factors_in_model_with_their_levels,
                    &design_info.term_names, // Pass all model terms for context if needed
                    &covariate_means_map,
                    &config.main.covar.as_ref().map_or_else(Vec::new, |v| v.clone()) // Pass covariate names from config
                )
            {
                Ok(vec) => vec,
                Err(e) => {
                    return Err(format!("Error generating L-vector for Grand Mean: {}", e));
                }
            };

            let grand_mean_em_estimates_table = generate_em_estimates_table(
                &[grand_mean_l_vector.clone()], // Pass as a single L-vector matrix
                &[BTreeMap::new()], // Represents a single overall group
                beta_hat,
                g_inv,
                mse,
                df_error,
                config.options.sig_level,
                "Grand Mean"
            );
            emmeans_estimates_list.push(grand_mean_em_estimates_table);

            if config.options.coefficient_matrix {
                emmeans_contrast_coeffs_list.push(ContrastCoefficientsEntry {
                    parameter: all_model_parameters_names.clone(),
                    l_label: vec!["Grand Mean".to_string()],
                    l_matrix: vec![grand_mean_l_vector],
                    contrast_information: vec!["L-Matrix for Grand Mean".to_string()],
                    notes: vec!["Defines the overall estimated grand mean.".to_string()],
                });
            }
            // No pairwise or univariate tests for Grand Mean
            continue; // Move to the next factor_spec_emmeans
        }

        let parsed_terms_in_spec: Vec<String> = parse_interaction_term(factor_spec_emmeans);
        let current_spec_factors: Vec<&str> = parsed_terms_in_spec
            .iter()
            .map(String::as_str)
            .collect();

        if
            current_spec_factors.is_empty() &&
            factor_spec_emmeans != "Intercept" &&
            !factor_spec_emmeans.is_empty()
        {
            // Handle case where spec is not empty but parses to no factors (e.g. a covariate name by itself)
            emmeans_estimates_list.push(EMMeansEstimates {
                entries: Vec::new(),
                notes: vec![format!("No level combinations for {}", factor_spec_emmeans)],
            });
            if config.options.coefficient_matrix {
                emmeans_contrast_coeffs_list.push(ContrastCoefficientsEntry {
                    parameter: all_model_parameters_names.clone(),
                    l_label: Vec::new(),
                    l_matrix: Vec::new(),
                    contrast_information: vec![
                        format!("L-Matrix for EMMEANS of {}", factor_spec_emmeans)
                    ],
                    notes: vec![format!("No level combinations for {}.", factor_spec_emmeans)],
                });
            }
            continue;
        }

        let level_combinations_for_spec = match
            get_factor_level_combinations(
                &current_spec_factors,
                &all_factors_in_model_with_their_levels
            )
        {
            Ok(combos) if combos.is_empty() => {
                // Add empty entries and continue
                emmeans_estimates_list.push(EMMeansEstimates {
                    entries: Vec::new(),
                    notes: vec![format!("No level combinations for {}", factor_spec_emmeans)],
                });
                if config.options.coefficient_matrix {
                    emmeans_contrast_coeffs_list.push(ContrastCoefficientsEntry {
                        parameter: all_model_parameters_names.clone(),
                        l_label: Vec::new(),
                        l_matrix: Vec::new(),
                        contrast_information: vec![
                            format!("L-Matrix for EMMEANS of {}", factor_spec_emmeans)
                        ],
                        notes: vec![format!("No level combinations for {}.", factor_spec_emmeans)],
                    });
                }
                continue;
            }
            Ok(combos) => combos,
            Err(e) => {
                return Err(
                    format!(
                        "Error generating level combinations for {}: {}",
                        factor_spec_emmeans,
                        e
                    )
                );
            }
        };

        let (l_matrix_rows_for_emms, l_labels_for_emms) = match
            generate_l_vectors_for_emmeans(
                &level_combinations_for_spec,
                &all_model_parameters_names,
                design_info.p_parameters,
                &all_factors_in_model_with_their_levels,
                &covariate_means_map,
                &config.main.covar.as_ref().map_or_else(Vec::new, |v| v.clone())
            )
        {
            Ok(res) => res,
            Err(e) => {
                return Err(
                    format!("Error generating L-vectors for {}: {}", factor_spec_emmeans, e)
                );
            }
        };

        let em_estimates_table = generate_em_estimates_table(
            &l_matrix_rows_for_emms,
            &level_combinations_for_spec,
            beta_hat,
            g_inv,
            mse,
            df_error,
            config.options.sig_level,
            factor_spec_emmeans
        );
        emmeans_estimates_list.push(em_estimates_table);

        if config.options.coefficient_matrix {
            emmeans_contrast_coeffs_list.push(ContrastCoefficientsEntry {
                parameter: all_model_parameters_names.clone(),
                l_label: l_labels_for_emms,
                l_matrix: l_matrix_rows_for_emms.clone(),
                contrast_information: vec![
                    format!("L-Matrix for EMMEANS of {}", factor_spec_emmeans)
                ],
                notes: vec![
                    format!("Defines the EMMs for {}. Each row is an L-vector.", factor_spec_emmeans)
                ],
            });
        }

        let is_main_effect_for_pairwise_uni = current_spec_factors.len() == 1;
        if is_main_effect_for_pairwise_uni && config.emmeans.comp_main_effect {
            let main_effect_name = current_spec_factors[0];
            if
                let Some(main_effect_levels) =
                    all_factors_in_model_with_their_levels.get(main_effect_name)
            {
                if
                    let Some(pairwise_table) = generate_pairwise_comparisons_table(
                        main_effect_name,
                        main_effect_levels,
                        &l_matrix_rows_for_emms, // These are L-vectors for EMMs of this main effect
                        beta_hat,
                        g_inv,
                        mse,
                        df_error,
                        config
                    )
                {
                    emmeans_pairwise_list.push(pairwise_table);
                }

                if
                    let Some(univariate_table) = generate_univariate_test_table(
                        main_effect_name,
                        main_effect_levels.len(),
                        &l_matrix_rows_for_emms, // L-vectors for EMMs of this main effect
                        beta_hat,
                        g_inv,
                        mse,
                        df_error,
                        design_info.p_parameters,
                        swept_info.s_rss, // Pass s_rss (SSE)
                        config.options.sig_level, // Pass sig_level for power calculation
                        config.options.est_effect_size,
                        config.options.obs_power
                    )
                {
                    emmeans_univariate_tests_list.push(univariate_table);
                }
            }
        }
    }

    Ok(EMMeansResult {
        parameter_names: emmeans_results_param_names,
        contrast_coefficients: emmeans_contrast_coeffs_list,
        em_estimates: emmeans_estimates_list,
        pairwise_comparisons: if emmeans_pairwise_list.is_empty() {
            None
        } else {
            Some(emmeans_pairwise_list)
        },
        univariate_tests: if emmeans_univariate_tests_list.is_empty() {
            None
        } else {
            Some(emmeans_univariate_tests_list)
        },
    })
}
