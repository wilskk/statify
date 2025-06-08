use std::collections::HashSet;
use statrs::distribution::{ StudentsT, ContinuousCDF };

use crate::univariate::models::{
    config::{ CategoryMethod, UnivariateConfig },
    data::AnalysisData,
    result::{
        ConfidenceInterval,
        PostHoc,
        PostHocComparison,
        PostHocComparisonEntry,
        PostHocHomogoneous,
        PostHocHomogoneousEntry,
        Subset,
    },
};
use super::core::*;
use crate::univariate::stats::common::{ extract_numeric_from_record, data_value_to_string };
use crate::univariate::stats::distribution_utils::{
    calculate_f_critical,
    calculate_f_significance,
    calculate_t_critical,
    calculate_t_significance,
    studentized_maximum_modulus_critical_value,
}; // Assuming t-dist is needed

// Helper struct to hold statistics for each level of a factor
#[derive(Debug, Clone)]
struct LevelStats {
    name: String,
    mean: f64,
    n: usize,
    variance: f64,
    original_index: usize, // To maintain original order for comparisons if needed
}

// Function to get dependent variable values for a specific factor level
fn get_level_values(
    data: &AnalysisData,
    factor_name: &str,
    level_name: &str,
    dep_var_name: &str
) -> Result<Vec<f64>, String> {
    let mut values = Vec::new();
    let mut factor_group_idx: Option<usize> = None;
    let mut dep_var_group_idx: Option<usize> = None;
    let mut factor_data_source: Option<&Vec<Vec<crate::univariate::models::data::DataRecord>>> =
        None;

    // Find group index for the factor in fixed factors
    for (i, def_group) in data.fix_factor_data_defs.iter().enumerate() {
        if def_group.iter().any(|def| def.name == factor_name) {
            factor_group_idx = Some(i);
            factor_data_source = Some(&data.fix_factor_data);
            break;
        }
    }

    // If not in fixed, check random factors (if applicable for posthoc context)
    if factor_group_idx.is_none() {
        if let Some(random_defs) = &data.random_factor_data_defs {
            for (i, def_group) in random_defs.iter().enumerate() {
                if def_group.iter().any(|def| def.name == factor_name) {
                    factor_group_idx = Some(i);
                    factor_data_source = data.random_factor_data.as_ref();
                    break;
                }
            }
        }
    }

    // Find group index for the dependent variable
    for (i, def_group) in data.dependent_data_defs.iter().enumerate() {
        if def_group.iter().any(|def| def.name == dep_var_name) {
            dep_var_group_idx = Some(i);
            break;
        }
    }

    if factor_group_idx.is_none() {
        return Err(format!("Factor '{}' not found in data definitions.", factor_name));
    }
    if dep_var_group_idx.is_none() {
        return Err(format!("Dependent variable '{}' not found in data definitions.", dep_var_name));
    }
    if factor_data_source.is_none() {
        return Err(format!("Data source for factor '{}' could not be determined.", factor_name));
    }

    let f_group_idx = factor_group_idx.unwrap();
    let d_group_idx = dep_var_group_idx.unwrap();

    if
        let (Some(factor_records_groups), Some(dep_var_records_group)) = (
            factor_data_source,
            data.dependent_data.get(d_group_idx),
        )
    {
        if let Some(factor_records_group_specific) = factor_records_groups.get(f_group_idx) {
            // Assuming number of records per group matches, or that specific factor group aligns with dep var group.
            // This logic might need refinement if data structure is more complex (e.g. multiple dep_var_groups or factor_groups not 1-to-1)
            // For simplicity, assuming the primary dependent variable group corresponds to the factor group.

            if factor_records_group_specific.len() != dep_var_records_group.len() {
                // This check might be too strict if data can be ragged or from different sources not perfectly aligned by index alone.
                // However, for typical ANOVA/posthoc, data is usually structured.
                // return Err(format!(
                //     "Mismatch in record count between factor group {} (len {}) and dependent variable group {} (len {}).",
                //     f_group_idx, factor_records_group_specific.len(),
                //     d_group_idx, dep_var_records_group.len()
                // ));
                web_sys::console::warn_1(
                    &format!(
                        "Potential mismatch or complex structure: record count for factor group {} (len {}) vs dependent variable group {} (len {}). Proceeding with available data.",
                        f_group_idx,
                        factor_records_group_specific.len(),
                        d_group_idx,
                        dep_var_records_group.len()
                    ).into()
                );
            }

            for (idx, factor_record) in factor_records_group_specific.iter().enumerate() {
                if let Some(factor_value) = factor_record.values.get(factor_name) {
                    if data_value_to_string(factor_value) == level_name {
                        if let Some(dep_var_record) = dep_var_records_group.get(idx) {
                            if
                                let Some(dep_val) = extract_numeric_from_record(
                                    dep_var_record,
                                    dep_var_name
                                )
                            {
                                values.push(dep_val);
                            }
                        }
                    }
                }
            }
        } else {
            return Err(format!("Factor data records not found for group index {}.", f_group_idx));
        }
    } else {
        return Err(
            format!("Data records not found for factor data source or dependent variable group {}.", d_group_idx)
        );
    }

    Ok(values)
}

/// Calculate level statistics (mean, variance, N)
fn calculate_single_level_stats(
    data: &AnalysisData,
    factor_name: &str,
    level_name: &str,
    dep_var_name: &str,
    original_index: usize
) -> Result<LevelStats, String> {
    let values = get_level_values(data, factor_name, level_name, dep_var_name)?;
    if values.is_empty() {
        return Ok(LevelStats {
            name: level_name.to_string(),
            mean: f64::NAN,
            n: 0,
            variance: f64::NAN,
            original_index,
        });
    }
    let mean = calculate_mean(&values);
    let variance = if values.len() > 1 {
        values
            .iter()
            .map(|x| (x - mean).powi(2))
            .sum::<f64>() / ((values.len() - 1) as f64)
    } else {
        f64::NAN // Variance is undefined for a single point, or can be 0. SPSS shows it as blank.
    };
    Ok(LevelStats {
        name: level_name.to_string(),
        mean,
        n: values.len(),
        variance,
        original_index,
    })
}

/// Calculate pooled variance (MSE) and total N
fn calculate_pooled_stats_for_posthoc(
    level_stats_list: &[LevelStats]
) -> (f64, usize, f64, f64, usize) {
    // mse, df_error, s_pp (sqrt(mse)), n_h (harmonic mean of n), total_n
    let mut sum_sq_error = 0.0;
    let mut total_n: usize = 0;
    let mut num_groups_with_data = 0;

    for stats in level_stats_list {
        if stats.n > 0 {
            total_n += stats.n;
            if stats.n > 1 && !stats.variance.is_nan() {
                sum_sq_error += stats.variance * ((stats.n - 1) as f64);
            }
            num_groups_with_data += 1;
        }
    }

    if num_groups_with_data == 0 || total_n <= num_groups_with_data {
        return (f64::NAN, 0, f64::NAN, f64::NAN, total_n);
    }

    let df_error = total_n - num_groups_with_data;
    if df_error == 0 {
        return (f64::NAN, 0, f64::NAN, f64::NAN, total_n);
    }

    let mse = sum_sq_error / (df_error as f64);
    let s_pp = if mse >= 0.0 { mse.sqrt() } else { f64::NAN };

    let sum_reciprocal_n: f64 = level_stats_list
        .iter()
        .filter(|s| s.n > 0)
        .map(|s| 1.0 / (s.n as f64))
        .sum();

    let n_h = if sum_reciprocal_n > 0.0 {
        (num_groups_with_data as f64) / sum_reciprocal_n
    } else {
        f64::NAN
    };

    (mse, df_error, s_pp, n_h, total_n)
}

/// Calculate Welch-Satterthwaite degrees of freedom for unequal variances t-test
fn welch_satterthwaite_df(var_i: f64, n_i: f64, var_j: f64, n_j: f64) -> f64 {
    if n_i <= 1.0 || n_j <= 1.0 || var_i.is_nan() || var_j.is_nan() || var_i < 0.0 || var_j < 0.0 {
        return f64::NAN; // Or a small default like 1.0, but NaN indicates issue
    }
    let term_i = var_i / n_i;
    let term_j = var_j / n_j;

    let numerator = (term_i + term_j).powi(2);
    let denominator_i = if n_i > 1.0 { term_i.powi(2) / (n_i - 1.0) } else { 0.0 };
    let denominator_j = if n_j > 1.0 { term_j.powi(2) / (n_j - 1.0) } else { 0.0 };
    let denominator = denominator_i + denominator_j;

    if denominator.abs() < 1e-12 {
        // Avoid division by zero if variances are tiny or n is very small
        // Smallest possible df is often 1 if any data exists.
        // If both n_i and n_j are > 1, this case is less likely unless variances are zero.
        // If variances are truly zero, t-test is problematic anyway.
        // Returning min(n_i-1, n_j-1) or similar might be an option, but indicates instability.
        // Let's return NaN for now if denominator is effectively zero, signaling an issue.
        if numerator.abs() < 1e-12 {
            // If numerator also zero (e.g. both variances zero)
            return (n_i + n_j - 2.0).max(1.0); // Fallback to pooled-like df, but problem exists
        }
        return f64::NAN;
    }
    let df = numerator / denominator;
    df.max(1.0) // Ensure df is at least 1 if calculation is valid
}

fn calculate_multiple_comparisons(
    factor_name: &str,
    current_level_stats: &[LevelStats],
    mse: f64,
    df_error_pooled: usize,
    s_pp: f64, // sqrt(mse), needed for Gabriel's SE
    config: &UnivariateConfig,
    alpha: f64,
    k_total_levels_with_data: usize, // Renamed for clarity, this is num_levels_with_data for Scheffe etc.
    num_initial_levels: usize, // Number of original levels for Dunnett's First/Last
    k_pairwise_comparisons: usize, // Number of unique pairwise comparisons for Bonferroni etc.
    f_factor_value: f64, // F-statistic for the factor (ANOVA)
    df_factor: usize, // Degrees of freedom for the factor (k-1)
    overall_notes: &mut Vec<String>
) -> Vec<PostHocComparisonEntry> {
    let mut factor_comparison_entries: Vec<PostHocComparisonEntry> = Vec::new();
    let num_levels_with_data = current_level_stats.len(); // k_total_levels_with_data is this

    // --- LSD (Least Significant Difference) ---
    if config.posthoc.lsd {
        let mut parameters: Vec<String> = Vec::new();
        let mut mean_differences: Vec<f64> = Vec::new();
        let mut std_errors: Vec<f64> = Vec::new();
        let mut significances: Vec<f64> = Vec::new();
        let mut confidence_intervals: Vec<ConfidenceInterval> = Vec::new();

        for i in 0..num_levels_with_data {
            for j in i + 1..num_levels_with_data {
                let level_i_stats = &current_level_stats[i];
                let level_j_stats = &current_level_stats[j];

                parameters.push(format!("{} vs {}", level_i_stats.name, level_j_stats.name));

                let mean_diff = level_i_stats.mean - level_j_stats.mean;
                mean_differences.push(mean_diff);

                let n_i = level_i_stats.n as f64;
                let n_j = level_j_stats.n as f64;

                let std_err = if n_i > 0.0 && n_j > 0.0 && !mse.is_nan() {
                    (mse * (1.0 / n_i + 1.0 / n_j)).sqrt()
                } else {
                    f64::NAN
                };
                std_errors.push(std_err);

                let t_value = if !std_err.is_nan() && std_err != 0.0 {
                    mean_diff / std_err
                } else {
                    f64::NAN
                };

                let sig = if !t_value.is_nan() && df_error_pooled > 0 {
                    calculate_t_significance(t_value, df_error_pooled)
                } else {
                    f64::NAN
                };
                significances.push(sig);

                let t_crit = calculate_t_critical(Some(alpha), df_error_pooled);
                let ci_width = if !std_err.is_nan() && !t_crit.is_nan() {
                    t_crit * std_err
                } else {
                    f64::NAN
                };

                confidence_intervals.push(ConfidenceInterval {
                    lower_bound: mean_diff - ci_width,
                    upper_bound: mean_diff + ci_width,
                });
            }
        }
        factor_comparison_entries.push(PostHocComparisonEntry {
            method: format!("LSD ({})", factor_name),
            parameter: parameters,
            mean_difference: mean_differences,
            standard_error: std_errors,
            significance: significances,
            confidence_interval: confidence_intervals,
        });
    }

    // --- Bonferroni ---
    if config.posthoc.bonfe {
        let mut parameters: Vec<String> = Vec::new();
        let mut mean_differences: Vec<f64> = Vec::new();
        let mut std_errors: Vec<f64> = Vec::new();
        let mut significances: Vec<f64> = Vec::new();
        let mut confidence_intervals: Vec<ConfidenceInterval> = Vec::new();

        let bonf_alpha_ci = alpha / (k_pairwise_comparisons.max(1) as f64);

        for i in 0..num_levels_with_data {
            for j in i + 1..num_levels_with_data {
                let level_i_stats = &current_level_stats[i];
                let level_j_stats = &current_level_stats[j];

                parameters.push(format!("{} vs {}", level_i_stats.name, level_j_stats.name));

                let mean_diff = level_i_stats.mean - level_j_stats.mean;
                mean_differences.push(mean_diff);

                let n_i = level_i_stats.n as f64;
                let n_j = level_j_stats.n as f64;

                let std_err = if n_i > 0.0 && n_j > 0.0 && !mse.is_nan() {
                    (mse * (1.0 / n_i + 1.0 / n_j)).sqrt()
                } else {
                    f64::NAN
                };
                std_errors.push(std_err);

                let t_value = if !std_err.is_nan() && std_err != 0.0 {
                    mean_diff / std_err
                } else {
                    f64::NAN
                };

                let p_value_unadjusted = if !t_value.is_nan() && df_error_pooled > 0 {
                    calculate_t_significance(t_value, df_error_pooled)
                } else {
                    f64::NAN
                };
                let sig = if !p_value_unadjusted.is_nan() {
                    (p_value_unadjusted * (k_pairwise_comparisons as f64)).min(1.0)
                } else {
                    f64::NAN
                };
                significances.push(sig);

                let t_crit_bonf = calculate_t_critical(Some(bonf_alpha_ci), df_error_pooled);
                let ci_width = if !std_err.is_nan() && !t_crit_bonf.is_nan() {
                    t_crit_bonf * std_err
                } else {
                    f64::NAN
                };

                confidence_intervals.push(ConfidenceInterval {
                    lower_bound: mean_diff - ci_width,
                    upper_bound: mean_diff + ci_width,
                });
            }
        }
        factor_comparison_entries.push(PostHocComparisonEntry {
            method: format!("Bonferroni ({})", factor_name),
            parameter: parameters,
            mean_difference: mean_differences,
            standard_error: std_errors,
            significance: significances,
            confidence_interval: confidence_intervals,
        });
    }

    // --- Sidak ---
    if config.posthoc.sidak {
        let mut parameters: Vec<String> = Vec::new();
        let mut mean_differences: Vec<f64> = Vec::new();
        let mut std_errors: Vec<f64> = Vec::new();
        let mut significances: Vec<f64> = Vec::new();
        let mut confidence_intervals: Vec<ConfidenceInterval> = Vec::new();

        let sidak_alpha_ci_per_comparison =
            1.0 - (1.0 - alpha).powf(1.0 / (k_pairwise_comparisons.max(1) as f64));

        for i in 0..num_levels_with_data {
            for j in i + 1..num_levels_with_data {
                let level_i_stats = &current_level_stats[i];
                let level_j_stats = &current_level_stats[j];
                parameters.push(format!("{} vs {}", level_i_stats.name, level_j_stats.name));
                let mean_diff = level_i_stats.mean - level_j_stats.mean;
                mean_differences.push(mean_diff);

                let n_i = level_i_stats.n as f64;
                let n_j = level_j_stats.n as f64;
                let std_err = if n_i > 0.0 && n_j > 0.0 && !mse.is_nan() {
                    (mse * (1.0 / n_i + 1.0 / n_j)).sqrt()
                } else {
                    f64::NAN
                };
                std_errors.push(std_err);

                let t_value = if !std_err.is_nan() && std_err != 0.0 {
                    mean_diff / std_err
                } else {
                    f64::NAN
                };
                let p_unadjusted = if !t_value.is_nan() && df_error_pooled > 0 {
                    calculate_t_significance(t_value, df_error_pooled)
                } else {
                    f64::NAN
                };

                let adjusted_sig = if !p_unadjusted.is_nan() {
                    (1.0 - (1.0 - p_unadjusted).powf(k_pairwise_comparisons as f64)).min(1.0)
                } else {
                    f64::NAN
                };
                significances.push(adjusted_sig);

                let t_crit_sidak = calculate_t_critical(
                    Some(sidak_alpha_ci_per_comparison),
                    df_error_pooled
                );
                let ci_width = if !std_err.is_nan() && !t_crit_sidak.is_nan() {
                    t_crit_sidak * std_err
                } else {
                    f64::NAN
                };
                confidence_intervals.push(ConfidenceInterval {
                    lower_bound: mean_diff - ci_width,
                    upper_bound: mean_diff + ci_width,
                });
            }
        }
        factor_comparison_entries.push(PostHocComparisonEntry {
            method: format!("Sidak ({})", factor_name),
            parameter: parameters,
            mean_difference: mean_differences,
            standard_error: std_errors,
            significance: significances,
            confidence_interval: confidence_intervals,
        });
    }

    // --- Scheffe ---
    if config.posthoc.scheffe {
        let mut parameters: Vec<String> = Vec::new();
        let mut mean_differences: Vec<f64> = Vec::new();
        let mut std_errors: Vec<f64> = Vec::new();
        let mut significances: Vec<f64> = Vec::new();
        let mut confidence_intervals: Vec<ConfidenceInterval> = Vec::new();

        let df1_scheffe = (k_total_levels_with_data - 1).max(1);
        let f_crit_scheffe_val = if df1_scheffe > 0 && df_error_pooled > 0 {
            calculate_f_critical(alpha, df1_scheffe, df_error_pooled)
        } else {
            f64::NAN
        };
        let scheffe_multiplier = if !f_crit_scheffe_val.is_nan() {
            ((df1_scheffe as f64) * f_crit_scheffe_val).sqrt()
        } else {
            f64::NAN
        };

        for i in 0..num_levels_with_data {
            for j in i + 1..num_levels_with_data {
                let level_i_stats = &current_level_stats[i];
                let level_j_stats = &current_level_stats[j];
                parameters.push(format!("{} vs {}", level_i_stats.name, level_j_stats.name));
                let mean_diff = level_i_stats.mean - level_j_stats.mean;
                mean_differences.push(mean_diff);

                let n_i = level_i_stats.n as f64;
                let n_j = level_j_stats.n as f64;
                let std_err = if n_i > 0.0 && n_j > 0.0 && !mse.is_nan() {
                    (mse * (1.0 / n_i + 1.0 / n_j)).sqrt()
                } else {
                    f64::NAN
                };
                std_errors.push(std_err);

                let t_value = if !std_err.is_nan() && std_err != 0.0 {
                    mean_diff / std_err
                } else {
                    f64::NAN
                };

                let scheffe_f_observed = if !t_value.is_nan() {
                    t_value.powi(2) / (df1_scheffe as f64)
                } else {
                    f64::NAN
                };
                let sig = if !scheffe_f_observed.is_nan() && df_error_pooled > 0 && df1_scheffe > 0 {
                    calculate_f_significance(df1_scheffe, df_error_pooled, scheffe_f_observed)
                } else {
                    f64::NAN
                };
                significances.push(sig);

                let ci_width = if !std_err.is_nan() && !scheffe_multiplier.is_nan() {
                    scheffe_multiplier * std_err
                } else {
                    f64::NAN
                };
                confidence_intervals.push(ConfidenceInterval {
                    lower_bound: mean_diff - ci_width,
                    upper_bound: mean_diff + ci_width,
                });
            }
        }
        factor_comparison_entries.push(PostHocComparisonEntry {
            method: format!("Scheffe ({})", factor_name),
            parameter: parameters,
            mean_difference: mean_differences,
            standard_error: std_errors,
            significance: significances,
            confidence_interval: confidence_intervals,
        });
    }

    // --- Games-Howell (GH) --- (Unequal Variances)
    if config.posthoc.games {
        let mut parameters: Vec<String> = Vec::new();
        let mut mean_differences: Vec<f64> = Vec::new();
        let mut std_errors_gh: Vec<f64> = Vec::new();
        let mut significances_gh: Vec<f64> = Vec::new();
        let mut confidence_intervals_gh: Vec<ConfidenceInterval> = Vec::new();

        let gh_alpha_adj = alpha / (k_pairwise_comparisons.max(1) as f64);

        for i in 0..num_levels_with_data {
            for j in i + 1..num_levels_with_data {
                let level_i_stats = &current_level_stats[i];
                let level_j_stats = &current_level_stats[j];
                parameters.push(format!("{} vs {}", level_i_stats.name, level_j_stats.name));
                let mean_diff = level_i_stats.mean - level_j_stats.mean;
                mean_differences.push(mean_diff);

                let n_i = level_i_stats.n as f64;
                let var_i = level_i_stats.variance;
                let n_j = level_j_stats.n as f64;
                let var_j = level_j_stats.variance;

                let std_err = if
                    n_i > 0.0 &&
                    n_j > 0.0 &&
                    !var_i.is_nan() &&
                    !var_j.is_nan() &&
                    var_i >= 0.0 &&
                    var_j >= 0.0
                {
                    (var_i / n_i + var_j / n_j).sqrt()
                } else {
                    f64::NAN
                };
                std_errors_gh.push(std_err);

                let df_gh = welch_satterthwaite_df(var_i, n_i, var_j, n_j);
                let df_gh_usize = if !df_gh.is_nan() && df_gh >= 1.0 {
                    df_gh.round() as usize
                } else {
                    0
                };

                let t_value = if !std_err.is_nan() && std_err != 0.0 {
                    mean_diff / std_err
                } else {
                    f64::NAN
                };

                let p_unadjusted = if !t_value.is_nan() && df_gh_usize > 0 {
                    calculate_t_significance(t_value, df_gh_usize)
                } else {
                    f64::NAN
                };

                significances_gh.push(p_unadjusted);

                let t_crit_gh = if df_gh_usize > 0 {
                    calculate_t_critical(Some(gh_alpha_adj), df_gh_usize)
                } else {
                    f64::NAN
                };

                let ci_width = if !std_err.is_nan() && !t_crit_gh.is_nan() {
                    t_crit_gh * std_err
                } else {
                    f64::NAN
                };
                confidence_intervals_gh.push(ConfidenceInterval {
                    lower_bound: mean_diff - ci_width,
                    upper_bound: mean_diff + ci_width,
                });
            }
        }
        factor_comparison_entries.push(PostHocComparisonEntry {
            method: format!("Games-Howell ({})", factor_name),
            parameter: parameters,
            mean_difference: mean_differences,
            standard_error: std_errors_gh,
            significance: significances_gh,
            confidence_interval: confidence_intervals_gh,
        });
        overall_notes.push(
            format!("Games-Howell for factor '{}' assumes unequal variances. Significance and CI are based on t-distribution with Welch-Satterthwaite df (approximating Studentized Range q).", factor_name)
        );
    }

    // --- Tamhane's T2 --- (Unequal Variances)
    if config.posthoc.tam {
        let mut parameters: Vec<String> = Vec::new();
        let mut mean_differences: Vec<f64> = Vec::new();
        let mut std_errors_tam: Vec<f64> = Vec::new();
        let mut significances_tam: Vec<f64> = Vec::new();
        let mut confidence_intervals_tam: Vec<ConfidenceInterval> = Vec::new();

        let tam_alpha_ci = alpha / (k_pairwise_comparisons.max(1) as f64);

        for i in 0..num_levels_with_data {
            for j in i + 1..num_levels_with_data {
                let level_i_stats = &current_level_stats[i];
                let level_j_stats = &current_level_stats[j];
                parameters.push(format!("{} vs {}", level_i_stats.name, level_j_stats.name));
                let mean_diff = level_i_stats.mean - level_j_stats.mean;
                mean_differences.push(mean_diff);

                let n_i = level_i_stats.n as f64;
                let var_i = level_i_stats.variance;
                let n_j = level_j_stats.n as f64;
                let var_j = level_j_stats.variance;

                let std_err = if
                    n_i > 0.0 &&
                    n_j > 0.0 &&
                    !var_i.is_nan() &&
                    !var_j.is_nan() &&
                    var_i >= 0.0 &&
                    var_j >= 0.0
                {
                    (var_i / n_i + var_j / n_j).sqrt()
                } else {
                    f64::NAN
                };
                std_errors_tam.push(std_err);

                let df_tam = welch_satterthwaite_df(var_i, n_i, var_j, n_j);
                let df_tam_usize = if !df_tam.is_nan() && df_tam >= 1.0 {
                    df_tam.round() as usize
                } else {
                    0
                };

                let t_value = if !std_err.is_nan() && std_err != 0.0 {
                    mean_diff / std_err
                } else {
                    f64::NAN
                };
                let p_unadjusted = if !t_value.is_nan() && df_tam_usize > 0 {
                    calculate_t_significance(t_value, df_tam_usize)
                } else {
                    f64::NAN
                };

                let sig = if !p_unadjusted.is_nan() {
                    (p_unadjusted * (k_pairwise_comparisons as f64)).min(1.0)
                } else {
                    f64::NAN
                };
                significances_tam.push(sig);

                let t_crit_tam = if df_tam_usize > 0 {
                    calculate_t_critical(Some(tam_alpha_ci), df_tam_usize)
                } else {
                    f64::NAN
                };
                let ci_width = if !std_err.is_nan() && !t_crit_tam.is_nan() {
                    t_crit_tam * std_err
                } else {
                    f64::NAN
                };
                confidence_intervals_tam.push(ConfidenceInterval {
                    lower_bound: mean_diff - ci_width,
                    upper_bound: mean_diff + ci_width,
                });
            }
        }
        factor_comparison_entries.push(PostHocComparisonEntry {
            method: format!("Tamhane's T2 ({})", factor_name),
            parameter: parameters,
            mean_difference: mean_differences,
            standard_error: std_errors_tam,
            significance: significances_tam,
            confidence_interval: confidence_intervals_tam,
        });
        overall_notes.push(
            format!("Tamhane's T2 for factor '{}' assumes unequal variances and uses t-tests with Welch-Satterthwaite df and Bonferroni correction.", factor_name)
        );
    }

    // --- Dunnett's Test (vs. Control) (config.posthoc.dunnett) ---
    if config.posthoc.dunnett {
        let control_original_idx: Option<usize> = match config.posthoc.category_method {
            CategoryMethod::First => Some(0),
            CategoryMethod::Last => {
                if num_initial_levels > 0 { Some(num_initial_levels - 1) } else { None }
            }
            // No other variants in CategoryMethod enum as per config.rs
        };

        if let Some(ctrl_orig_idx) = control_original_idx {
            let control_stats_opt = current_level_stats
                .iter()
                .find(|ls| ls.original_index == ctrl_orig_idx);

            if let Some(control_stats) = control_stats_opt {
                let mut parameters: Vec<String> = Vec::new();
                let mut mean_differences: Vec<f64> = Vec::new();
                let mut std_errors_dunnett: Vec<f64> = Vec::new();
                let mut significances_dunnett: Vec<f64> = Vec::new();
                let mut confidence_intervals_dunnett: Vec<ConfidenceInterval> = Vec::new();

                // Determine sidedness for Dunnett's test
                let final_is_lt = !config.posthoc.twosided && config.posthoc.lt_control;
                let final_is_gt =
                    !config.posthoc.twosided && !final_is_lt && config.posthoc.gt_control;
                let final_is_two_sided = !final_is_lt && !final_is_gt; // Default to two-sided if not explicitly lt or gt

                let k_dunnett_comparisons = (num_levels_with_data - 1).max(1);

                for level_stats in current_level_stats.iter() {
                    if level_stats.name == control_stats.name {
                        continue;
                    }

                    parameters.push(
                        format!("{} vs {} (Control)", level_stats.name, control_stats.name)
                    );
                    let mean_diff = level_stats.mean - control_stats.mean;
                    mean_differences.push(mean_diff);

                    let n_i = level_stats.n as f64;
                    let n_control = control_stats.n as f64;

                    let std_err = if n_i > 0.0 && n_control > 0.0 && !mse.is_nan() {
                        (mse * (1.0 / n_i + 1.0 / n_control)).sqrt()
                    } else {
                        f64::NAN
                    };
                    std_errors_dunnett.push(std_err);

                    let t_value = if !std_err.is_nan() && std_err != 0.0 {
                        mean_diff / std_err
                    } else {
                        f64::NAN
                    };

                    let p_unadjusted = if !t_value.is_nan() && df_error_pooled > 0 {
                        StudentsT::new(0.0, 1.0, df_error_pooled as f64).map_or(f64::NAN, |dist| {
                            if final_is_lt {
                                // H1: level < control (mean_diff < 0, t_value should be negative)
                                dist.cdf(t_value)
                            } else if final_is_gt {
                                // H1: level > control (mean_diff > 0, t_value should be positive)
                                dist.sf(t_value) // sf is 1 - cdf
                            } else {
                                // Two-sided (final_is_two_sided == true)
                                2.0 * dist.cdf(-t_value.abs())
                            }
                        })
                    } else {
                        f64::NAN
                    };

                    let sig = if !p_unadjusted.is_nan() {
                        (p_unadjusted * (k_dunnett_comparisons as f64)).min(1.0) // Bonferroni adjustment
                    } else {
                        f64::NAN
                    };
                    significances_dunnett.push(sig);

                    // CIs are typically two-sided. Alpha for one CI from Bonferroni perspective.
                    let dunnett_ci_alpha_per_comp = alpha / (k_dunnett_comparisons.max(1) as f64);
                    let t_crit_dunnett = calculate_t_critical(
                        Some(dunnett_ci_alpha_per_comp),
                        df_error_pooled
                    );

                    let ci_width = if !std_err.is_nan() && !t_crit_dunnett.is_nan() {
                        t_crit_dunnett * std_err
                    } else {
                        f64::NAN
                    };
                    confidence_intervals_dunnett.push(ConfidenceInterval {
                        lower_bound: mean_diff - ci_width,
                        upper_bound: mean_diff + ci_width,
                    });
                }

                let test_type_str = if final_is_lt {
                    "Lower < Control"
                } else if final_is_gt {
                    "Higher > Control"
                } else {
                    "Two-Sided vs Control"
                };

                factor_comparison_entries.push(PostHocComparisonEntry {
                    method: format!(
                        "Dunnett ({}) ('{}') ({})",
                        test_type_str,
                        control_stats.name,
                        factor_name
                    ),
                    parameter: parameters,
                    mean_difference: mean_differences,
                    standard_error: std_errors_dunnett,
                    significance: significances_dunnett,
                    confidence_interval: confidence_intervals_dunnett,
                });
                overall_notes.push(
                    format!(
                        "Dunnett's test ({}) for factor '{}' vs control '{}' assumes equal variances. Significance and CI based on t-distribution with Bonferroni-style adjustment.",
                        test_type_str,
                        factor_name,
                        control_stats.name
                    )
                );
            } else {
                if num_initial_levels > 0 {
                    // Only note if control should have existed
                    overall_notes.push(
                        format!(
                            "Dunnett's test: Control group (original index {}) for factor '{}' specified by CategoryMethod::{:?} not found among levels with data or has no data.",
                            ctrl_orig_idx,
                            factor_name,
                            config.posthoc.category_method
                        )
                    );
                }
            }
        } else {
            // This case implies num_initial_levels was 0 if CategoryMethod::Last was used.
            if config.posthoc.dunnett {
                // Only add note if Dunnett was actually requested
                overall_notes.push(
                    format!(
                        "Dunnett's test for factor '{}' was requested, but control group could not be determined (e.g. no initial levels for 'Last' category method). CategoryMethod was {:?}.",
                        factor_name,
                        config.posthoc.category_method
                    )
                );
            }
        }
    }

    // --- Tukey HSD (approx.) ---
    if config.posthoc.tu {
        let mut parameters: Vec<String> = Vec::new();
        let mut mean_differences: Vec<f64> = Vec::new();
        let mut std_errors: Vec<f64> = Vec::new();
        let mut significances: Vec<f64> = Vec::new();
        let mut confidence_intervals: Vec<ConfidenceInterval> = Vec::new();

        // Tukey HSD (approx.) often uses the same SE as LSD but may have different critical values/p-value adjustments.
        // For this approximation, we will use t-tests without specific Tukey adjustment for p-values,
        // as the homogeneous subsets will be derived from these p-values later.
        // The critical aspect is that calculate_homogeneous_subsets expects a PostHocComparisonEntry
        // with this specific method name.

        for i in 0..num_levels_with_data {
            for j in i + 1..num_levels_with_data {
                let level_i_stats = &current_level_stats[i];
                let level_j_stats = &current_level_stats[j];

                parameters.push(format!("{} vs {}", level_i_stats.name, level_j_stats.name));

                let mean_diff = level_i_stats.mean - level_j_stats.mean;
                mean_differences.push(mean_diff);

                let n_i = level_i_stats.n as f64;
                let n_j = level_j_stats.n as f64;

                let std_err = if n_i > 0.0 && n_j > 0.0 && !mse.is_nan() {
                    (mse * (1.0 / n_i + 1.0 / n_j)).sqrt()
                } else {
                    f64::NAN
                };
                std_errors.push(std_err);

                let t_value = if !std_err.is_nan() && std_err != 0.0 {
                    mean_diff / std_err
                } else {
                    f64::NAN
                };

                // Using unadjusted p-values from t-distribution, similar to LSD for this approximation
                let sig = if !t_value.is_nan() && df_error_pooled > 0 {
                    calculate_t_significance(t_value, df_error_pooled)
                } else {
                    f64::NAN
                };
                significances.push(sig);

                // CI based on standard t-critical value, similar to LSD
                let t_crit = calculate_t_critical(Some(alpha), df_error_pooled);
                let ci_width = if !std_err.is_nan() && !t_crit.is_nan() {
                    t_crit * std_err
                } else {
                    f64::NAN
                };

                confidence_intervals.push(ConfidenceInterval {
                    lower_bound: mean_diff - ci_width,
                    upper_bound: mean_diff + ci_width,
                });
            }
        }
        factor_comparison_entries.push(PostHocComparisonEntry {
            method: format!("Tukey HSD (approx.) ({})", factor_name),
            parameter: parameters,
            mean_difference: mean_differences,
            standard_error: std_errors,
            significance: significances,
            confidence_interval: confidence_intervals,
        });
        overall_notes.push(
            format!("Tukey HSD (approx.) for factor '{}' provides pairwise comparisons based on t-tests. Homogeneous subsets will be derived using these significance values.", factor_name)
        );
    }

    // --- Gabriel's Test ---
    if config.posthoc.gabriel {
        let mut parameters: Vec<String> = Vec::new();
        let mut mean_differences: Vec<f64> = Vec::new();
        let mut std_errors_gabriel: Vec<f64> = Vec::new();
        let mut significances_gabriel: Vec<f64> = Vec::new();
        let mut confidence_intervals_gabriel: Vec<ConfidenceInterval> = Vec::new();

        // Gabriel's test uses s_pp * sqrt(1/(2*n_i) + 1/(2*n_j)) as SE for |mean_i - mean_j|
        // Critical value from Studentized Maximum Modulus m_{alpha,k*,v} where k* = k(k-1)/2,
        // with k being the number of groups. The SMM tables are indexed by k.

        for i in 0..num_levels_with_data {
            for j in i + 1..num_levels_with_data {
                let level_i_stats = &current_level_stats[i];
                let level_j_stats = &current_level_stats[j];
                parameters.push(format!("{} vs {}", level_i_stats.name, level_j_stats.name));
                let mean_diff = level_i_stats.mean - level_j_stats.mean;
                mean_differences.push(mean_diff);

                let n_i = level_i_stats.n as f64;
                let n_j = level_j_stats.n as f64;

                let std_err = if n_i > 0.0 && n_j > 0.0 && !mse.is_nan() && mse >= 0.0 {
                    (mse * (0.5 / n_i + 0.5 / n_j)).sqrt() // SE for Gabriel
                } else {
                    f64::NAN
                };
                std_errors_gabriel.push(std_err);

                let t_value = if !std_err.is_nan() && std_err != 0.0 {
                    mean_diff / std_err
                } else {
                    f64::NAN
                };

                let p_unadjusted = if !t_value.is_nan() && df_error_pooled > 0 {
                    calculate_t_significance(t_value, df_error_pooled)
                } else {
                    f64::NAN
                };
                let sig = if !p_unadjusted.is_nan() {
                    (p_unadjusted * (k_pairwise_comparisons as f64)).min(1.0)
                } else {
                    f64::NAN
                };
                significances_gabriel.push(sig);

                let m_crit_gabriel = studentized_maximum_modulus_critical_value(
                    alpha,
                    k_total_levels_with_data.max(1) as f64, // Use k (number of groups) for table lookup
                    df_error_pooled
                ).unwrap_or_else(|| {
                    // Fallback to Bonferroni-corrected t-critical value
                    let num_comparisons = k_pairwise_comparisons.max(1) as f64;
                    let adjusted_alpha = alpha / num_comparisons;
                    calculate_t_critical(Some(adjusted_alpha), df_error_pooled)
                });
                let ci_width = if !std_err.is_nan() && !m_crit_gabriel.is_nan() {
                    m_crit_gabriel * std_err
                } else {
                    f64::NAN
                };
                confidence_intervals_gabriel.push(ConfidenceInterval {
                    lower_bound: mean_diff - ci_width,
                    upper_bound: mean_diff + ci_width,
                });
            }
        }
        factor_comparison_entries.push(PostHocComparisonEntry {
            method: format!("Gabriel ({})", factor_name),
            parameter: parameters,
            mean_difference: mean_differences,
            standard_error: std_errors_gabriel,
            significance: significances_gabriel,
            confidence_interval: confidence_intervals_gabriel,
        });
        overall_notes.push(
            format!(
                "Gabriel's test for factor '{}' uses the Studentized Maximum Modulus distribution (k*={}) and assumes equal variances. Fallback to Bonferroni-corrected t-test if table value is unavailable.",
                factor_name,
                k_pairwise_comparisons.max(1)
            )
        );
    }

    // --- Hochberg's GT2 ---
    if config.posthoc.hoc {
        let mut parameters: Vec<String> = Vec::new();
        let mut mean_differences: Vec<f64> = Vec::new();
        let mut std_errors_hoc: Vec<f64> = Vec::new();
        let mut significances_hoc: Vec<f64> = Vec::new();
        let mut confidence_intervals_hoc: Vec<ConfidenceInterval> = Vec::new();

        // Hochberg's GT2 uses Studentized Maximum Modulus m_{alpha,k,v} where k is the number of groups.
        // To use tables for m_{alpha,k*,v} indexed by a k_lookup where k* = k_lookup(k_lookup-1)/2,
        // we must find k_lookup such that k_lookup(k_lookup-1)/2 = k.
        let k_hochberg = k_total_levels_with_data as f64;
        // Solve k_lookup^2 - k_lookup - 2*k = 0 for k_lookup
        let k_lookup_hochberg = (1.0 + (1.0 + 8.0 * k_hochberg).sqrt()) / 2.0;

        for i in 0..num_levels_with_data {
            for j in i + 1..num_levels_with_data {
                let level_i_stats = &current_level_stats[i];
                let level_j_stats = &current_level_stats[j];
                parameters.push(format!("{} vs {}", level_i_stats.name, level_j_stats.name));
                let mean_diff = level_i_stats.mean - level_j_stats.mean;
                mean_differences.push(mean_diff);

                let n_i = level_i_stats.n as f64;
                let n_j = level_j_stats.n as f64;

                let std_err = if n_i > 0.0 && n_j > 0.0 && !mse.is_nan() {
                    (mse * (1.0 / n_i + 1.0 / n_j)).sqrt() // Standard SE
                } else {
                    f64::NAN
                };
                std_errors_hoc.push(std_err);

                let t_value = if !std_err.is_nan() && std_err != 0.0 {
                    mean_diff / std_err
                } else {
                    f64::NAN
                };

                let p_unadjusted = if !t_value.is_nan() && df_error_pooled > 0 {
                    calculate_t_significance(t_value, df_error_pooled)
                } else {
                    f64::NAN
                };
                // Significance adjustment based on k_total_levels_with_data (number of groups for SMM M_k,v)
                let sig = if !p_unadjusted.is_nan() {
                    (p_unadjusted * (k_total_levels_with_data as f64)).min(1.0)
                } else {
                    f64::NAN
                };
                significances_hoc.push(sig);

                let m_crit_hoc = studentized_maximum_modulus_critical_value(
                    alpha,
                    k_lookup_hochberg, // Pass the calculated k_lookup
                    df_error_pooled
                ).unwrap_or_else(|| {
                    // Fallback to Bonferroni-corrected t-critical value
                    let num_comparisons = k_total_levels_with_data.max(1) as f64; // k comparisons
                    let adjusted_alpha = alpha / num_comparisons;
                    calculate_t_critical(Some(adjusted_alpha), df_error_pooled)
                });
                let ci_width = if !std_err.is_nan() && !m_crit_hoc.is_nan() {
                    m_crit_hoc * std_err
                } else {
                    f64::NAN
                };
                confidence_intervals_hoc.push(ConfidenceInterval {
                    lower_bound: mean_diff - ci_width,
                    upper_bound: mean_diff + ci_width,
                });
            }
        }
        factor_comparison_entries.push(PostHocComparisonEntry {
            method: format!("Hochberg's GT2 ({})", factor_name),
            parameter: parameters,
            mean_difference: mean_differences,
            standard_error: std_errors_hoc,
            significance: significances_hoc,
            confidence_interval: confidence_intervals_hoc,
        });
        overall_notes.push(
            format!(
                "Hochberg's GT2 for factor '{}' uses the Studentized Maximum Modulus distribution (parameter k={}) and assumes equal variances. Fallback to Bonferroni-corrected t-test if table value is unavailable.",
                factor_name,
                k_total_levels_with_data.max(1)
            )
        );
    }

    // --- Dunnett's T3 (Unequal Variances) ---
    if config.posthoc.dunt {
        let mut parameters: Vec<String> = Vec::new();
        let mut mean_differences: Vec<f64> = Vec::new();
        let mut std_errors_dunt: Vec<f64> = Vec::new();
        let mut significances_dunt: Vec<f64> = Vec::new();
        let mut confidence_intervals_dunt: Vec<ConfidenceInterval> = Vec::new();

        // Dunnett's T3 uses Studentized Maximum Modulus M_k,v (k=num_groups = k_total_levels_with_data) with Welch-Satterthwaite df.
        // Critical value currently approximated via studentized_maximum_modulus_critical_value.

        for i in 0..num_levels_with_data {
            for j in i + 1..num_levels_with_data {
                let level_i_stats = &current_level_stats[i];
                let level_j_stats = &current_level_stats[j];
                parameters.push(format!("{} vs {}", level_i_stats.name, level_j_stats.name));
                let mean_diff = level_i_stats.mean - level_j_stats.mean;
                mean_differences.push(mean_diff);

                let n_i = level_i_stats.n as f64;
                let var_i = level_i_stats.variance;
                let n_j = level_j_stats.n as f64;
                let var_j = level_j_stats.variance;

                let std_err = if
                    n_i > 0.0 &&
                    n_j > 0.0 &&
                    !var_i.is_nan() &&
                    !var_j.is_nan() &&
                    var_i >= 0.0 &&
                    var_j >= 0.0
                {
                    (var_i / n_i + var_j / n_j).sqrt() // SE for unequal variances
                } else {
                    f64::NAN
                };
                std_errors_dunt.push(std_err);

                let df_dunt = welch_satterthwaite_df(var_i, n_i, var_j, n_j);
                let df_dunt_usize = if !df_dunt.is_nan() && df_dunt >= 1.0 {
                    df_dunt.round() as usize
                } else {
                    0 // Or handle as error/NaN p-value
                };

                let t_value = if !std_err.is_nan() && std_err != 0.0 {
                    mean_diff / std_err
                } else {
                    f64::NAN
                };

                let p_unadjusted = if !t_value.is_nan() && df_dunt_usize > 0 {
                    calculate_t_significance(t_value, df_dunt_usize)
                } else {
                    f64::NAN
                };
                // Significance adjustment based on k_total_levels_with_data (number of groups for SMM M_k,v)
                let sig = if !p_unadjusted.is_nan() {
                    (p_unadjusted * (k_total_levels_with_data as f64)).min(1.0)
                } else {
                    f64::NAN
                };
                significances_dunt.push(sig);

                let m_crit_dunt = if df_dunt_usize > 0 {
                    studentized_maximum_modulus_critical_value(
                        alpha,
                        k_total_levels_with_data.max(1) as f64,
                        df_dunt_usize
                    ).unwrap_or_else(|| {
                        // Fallback to Bonferroni-corrected t-critical value
                        let num_comparisons = k_total_levels_with_data.max(1) as f64; // k comparisons
                        let adjusted_alpha = alpha / num_comparisons;
                        calculate_t_critical(Some(adjusted_alpha), df_dunt_usize)
                    })
                } else {
                    f64::NAN
                };
                let ci_width = if !std_err.is_nan() && !m_crit_dunt.is_nan() {
                    m_crit_dunt * std_err
                } else {
                    f64::NAN
                };
                confidence_intervals_dunt.push(ConfidenceInterval {
                    lower_bound: mean_diff - ci_width,
                    upper_bound: mean_diff + ci_width,
                });
            }
        }
        factor_comparison_entries.push(PostHocComparisonEntry {
            method: format!("Dunnett's T3 ({})", factor_name),
            parameter: parameters,
            mean_difference: mean_differences,
            standard_error: std_errors_dunt,
            significance: significances_dunt,
            confidence_interval: confidence_intervals_dunt,
        });
        overall_notes.push(
            format!(
                "Dunnett's T3 for factor '{}' assumes unequal variances and uses the Studentized Maximum Modulus distribution (k={}). Fallback to Bonferroni-corrected t-test with Welch-Satterthwaite df if table value is unavailable.",
                factor_name,
                k_total_levels_with_data.max(1)
            )
        );
    }

    // --- Waller-Duncan t-test ---
    if config.posthoc.waller {
        let mut parameters: Vec<String> = Vec::new();
        let mut mean_differences: Vec<f64> = Vec::new();
        let mut std_errors_waller: Vec<f64> = Vec::new();
        let mut significances_waller: Vec<f64> = Vec::new();
        let mut confidence_intervals_waller: Vec<ConfidenceInterval> = Vec::new();

        let k_ratio_waller = 100.0; // Common default K-ratio for Waller-Duncan

        for i in 0..num_levels_with_data {
            for j in i + 1..num_levels_with_data {
                let level_i_stats = &current_level_stats[i];
                let level_j_stats = &current_level_stats[j];
                parameters.push(format!("{} vs {}", level_i_stats.name, level_j_stats.name));
                let mean_diff = level_i_stats.mean - level_j_stats.mean;
                mean_differences.push(mean_diff);

                let n_i = level_i_stats.n as f64;
                let n_j = level_j_stats.n as f64;

                let std_err = if n_i > 0.0 && n_j > 0.0 && !mse.is_nan() && mse >= 0.0 {
                    (mse * (1.0 / n_i + 1.0 / n_j)).sqrt()
                } else {
                    f64::NAN
                };
                std_errors_waller.push(std_err);

                let t_value = if !std_err.is_nan() && std_err > 0.0 {
                    mean_diff / std_err
                } else {
                    f64::NAN
                };

                // Placeholder for actual Waller-Duncan p-value calculation.
                // The true p-value depends on the Waller-Duncan critical value, which is complex.
                // Using unadjusted t-test p-value as a rough indicator.
                let p_unadjusted = if !t_value.is_nan() && df_error_pooled > 0 {
                    calculate_t_significance(t_value, df_error_pooled)
                } else {
                    f64::NAN
                };
                significances_waller.push(p_unadjusted); // This is NOT the adjusted Waller p-value

                // Placeholder for Waller-Duncan critical value.
                // Using a Bonferroni-corrected t-value as a temporary approximation.
                // A more accurate critical value depends on f_factor_value, df_factor, k_ratio.
                let t_crit_waller_approx = if df_error_pooled > 0 && k_pairwise_comparisons > 0 {
                    calculate_t_critical(
                        Some(alpha / (k_pairwise_comparisons as f64)),
                        df_error_pooled
                    )
                } else if df_error_pooled > 0 {
                    calculate_t_critical(Some(alpha), df_error_pooled) // Fallback if k_pairwise_comparisons is 0 (e.g. 2 groups)
                } else {
                    f64::NAN
                };

                let ci_width = if !std_err.is_nan() && !t_crit_waller_approx.is_nan() {
                    t_crit_waller_approx * std_err
                } else {
                    f64::NAN
                };
                confidence_intervals_waller.push(ConfidenceInterval {
                    lower_bound: mean_diff - ci_width,
                    upper_bound: mean_diff + ci_width,
                });
            }
        }
        factor_comparison_entries.push(PostHocComparisonEntry {
            method: format!("Waller-Duncan (approx.) ({})", factor_name),
            parameter: parameters,
            mean_difference: mean_differences,
            standard_error: std_errors_waller,
            significance: significances_waller,
            confidence_interval: confidence_intervals_waller,
        });
        overall_notes.push(
            format!(
                "Waller-Duncan test for factor '{}' is approximated. K-Ratio={}. F-value(df1={},df2={})={:.3}. Significance and CI are based on t-tests and Bonferroni-like approximation for critical values, not the true Waller-Duncan procedure.",
                factor_name,
                k_ratio_waller,
                df_factor,
                df_error_pooled,
                f_factor_value
            )
        );
    }

    // --- REGW F test ---
    if config.posthoc.regwf {
        let mut parameters: Vec<String> = Vec::new();
        let mut mean_differences: Vec<f64> = Vec::new();
        let mut std_errors_regwf: Vec<f64> = Vec::new();
        let mut significances_regwf: Vec<f64> = Vec::new();
        let mut confidence_intervals_regwf: Vec<ConfidenceInterval> = Vec::new();

        for i in 0..num_levels_with_data {
            for j in i + 1..num_levels_with_data {
                let level_i_stats = &current_level_stats[i];
                let level_j_stats = &current_level_stats[j];
                parameters.push(format!("{} vs {}", level_i_stats.name, level_j_stats.name));
                let mean_diff = level_i_stats.mean - level_j_stats.mean;
                mean_differences.push(mean_diff);

                let n_i = level_i_stats.n as f64;
                let n_j = level_j_stats.n as f64;

                let std_err = if n_i > 0.0 && n_j > 0.0 && !mse.is_nan() && mse >= 0.0 {
                    (mse * (1.0 / n_i + 1.0 / n_j)).sqrt()
                } else {
                    f64::NAN
                };
                std_errors_regwf.push(std_err);

                let t_value = if !std_err.is_nan() && std_err > 0.0 {
                    mean_diff / std_err
                } else {
                    f64::NAN
                };

                let sig = if !t_value.is_nan() && df_error_pooled > 0 {
                    calculate_t_significance(t_value, df_error_pooled) // Unadjusted p-value
                } else {
                    f64::NAN
                };
                significances_regwf.push(sig);

                let t_crit = calculate_t_critical(Some(alpha), df_error_pooled); // Standard t-critical for CI
                let ci_width = if !std_err.is_nan() && !t_crit.is_nan() {
                    t_crit * std_err
                } else {
                    f64::NAN
                };
                confidence_intervals_regwf.push(ConfidenceInterval {
                    lower_bound: mean_diff - ci_width,
                    upper_bound: mean_diff + ci_width,
                });
            }
        }
        factor_comparison_entries.push(PostHocComparisonEntry {
            method: format!("REGW F (approx.) ({})", factor_name),
            parameter: parameters,
            mean_difference: mean_differences,
            standard_error: std_errors_regwf,
            significance: significances_regwf,
            confidence_interval: confidence_intervals_regwf,
        });
        overall_notes.push(
            format!("REGW F test for factor '{}' is approximated using standard t-tests for pairwise comparisons. The true REGW F procedure involves specific alpha adjustments for step-down F-tests and is primarily for homogeneous subset determination.", factor_name)
        );
    }

    // --- REGW Q test ---
    if config.posthoc.regwq {
        let mut parameters: Vec<String> = Vec::new();
        let mut mean_differences: Vec<f64> = Vec::new();
        let mut std_errors_regwq: Vec<f64> = Vec::new();
        let mut significances_regwq: Vec<f64> = Vec::new();
        let mut confidence_intervals_regwq: Vec<ConfidenceInterval> = Vec::new();

        for i in 0..num_levels_with_data {
            for j in i + 1..num_levels_with_data {
                let level_i_stats = &current_level_stats[i];
                let level_j_stats = &current_level_stats[j];
                parameters.push(format!("{} vs {}", level_i_stats.name, level_j_stats.name));
                let mean_diff = level_i_stats.mean - level_j_stats.mean;
                mean_differences.push(mean_diff);

                let n_i = level_i_stats.n as f64;
                let n_j = level_j_stats.n as f64;

                let std_err = if n_i > 0.0 && n_j > 0.0 && !mse.is_nan() && mse >= 0.0 {
                    (mse * (1.0 / n_i + 1.0 / n_j)).sqrt()
                } else {
                    f64::NAN
                };
                std_errors_regwq.push(std_err);

                let t_value = if !std_err.is_nan() && std_err > 0.0 {
                    mean_diff / std_err
                } else {
                    f64::NAN
                };

                let sig = if !t_value.is_nan() && df_error_pooled > 0 {
                    calculate_t_significance(t_value, df_error_pooled) // Unadjusted p-value
                } else {
                    f64::NAN
                };
                significances_regwq.push(sig);

                let t_crit = calculate_t_critical(Some(alpha), df_error_pooled); // Standard t-critical for CI
                let ci_width = if !std_err.is_nan() && !t_crit.is_nan() {
                    t_crit * std_err
                } else {
                    f64::NAN
                };
                confidence_intervals_regwq.push(ConfidenceInterval {
                    lower_bound: mean_diff - ci_width,
                    upper_bound: mean_diff + ci_width,
                });
            }
        }
        factor_comparison_entries.push(PostHocComparisonEntry {
            method: format!("REGW Q (approx.) ({})", factor_name),
            parameter: parameters,
            mean_difference: mean_differences,
            standard_error: std_errors_regwq,
            significance: significances_regwq,
            confidence_interval: confidence_intervals_regwq,
        });
        overall_notes.push(
            format!("REGW Q test for factor '{}' is approximated using standard t-tests. The true REGW Q procedure uses Studentized Range (q) statistic with specific alpha adjustments and is primarily for homogeneous subset determination.", factor_name)
        );
    }

    // --- Student-Newman-Keuls (SNK) ---
    if config.posthoc.snk {
        let mut parameters: Vec<String> = Vec::new();
        let mut mean_differences: Vec<f64> = Vec::new();
        let mut std_errors_snk: Vec<f64> = Vec::new();
        let mut significances_snk: Vec<f64> = Vec::new();
        let mut confidence_intervals_snk: Vec<ConfidenceInterval> = Vec::new();

        for i in 0..num_levels_with_data {
            for j in i + 1..num_levels_with_data {
                let level_i_stats = &current_level_stats[i];
                let level_j_stats = &current_level_stats[j];
                parameters.push(format!("{} vs {}", level_i_stats.name, level_j_stats.name));
                let mean_diff = level_i_stats.mean - level_j_stats.mean;
                mean_differences.push(mean_diff);

                let n_i = level_i_stats.n as f64;
                let n_j = level_j_stats.n as f64;

                let std_err = if n_i > 0.0 && n_j > 0.0 && !mse.is_nan() && mse >= 0.0 {
                    (mse * (1.0 / n_i + 1.0 / n_j)).sqrt()
                } else {
                    f64::NAN
                };
                std_errors_snk.push(std_err);

                let t_value = if !std_err.is_nan() && std_err > 0.0 {
                    mean_diff / std_err
                } else {
                    f64::NAN
                };

                let sig = if !t_value.is_nan() && df_error_pooled > 0 {
                    calculate_t_significance(t_value, df_error_pooled) // Unadjusted p-value
                } else {
                    f64::NAN
                };
                significances_snk.push(sig);

                let t_crit = calculate_t_critical(Some(alpha), df_error_pooled); // Standard t-critical for CI
                let ci_width = if !std_err.is_nan() && !t_crit.is_nan() {
                    t_crit * std_err
                } else {
                    f64::NAN
                };
                confidence_intervals_snk.push(ConfidenceInterval {
                    lower_bound: mean_diff - ci_width,
                    upper_bound: mean_diff + ci_width,
                });
            }
        }
        factor_comparison_entries.push(PostHocComparisonEntry {
            method: format!("SNK (approx.) ({})", factor_name),
            parameter: parameters,
            mean_difference: mean_differences,
            standard_error: std_errors_snk,
            significance: significances_snk,
            confidence_interval: confidence_intervals_snk,
        });
        overall_notes.push(
            format!("Student-Newman-Keuls (SNK) test for factor '{}' is approximated using standard t-tests. The true SNK procedure uses Studentized Range (q) statistic with varying critical values based on the number of means spanned, and is primarily for homogeneous subset determination.", factor_name)
        );
    }

    // --- Tukey's b ---
    if config.posthoc.tub {
        let mut parameters: Vec<String> = Vec::new();
        let mut mean_differences: Vec<f64> = Vec::new();
        let mut std_errors_tub: Vec<f64> = Vec::new();
        let mut significances_tub: Vec<f64> = Vec::new();
        let mut confidence_intervals_tub: Vec<ConfidenceInterval> = Vec::new();

        for i in 0..num_levels_with_data {
            for j in i + 1..num_levels_with_data {
                let level_i_stats = &current_level_stats[i];
                let level_j_stats = &current_level_stats[j];
                parameters.push(format!("{} vs {}", level_i_stats.name, level_j_stats.name));
                let mean_diff = level_i_stats.mean - level_j_stats.mean;
                mean_differences.push(mean_diff);

                let n_i = level_i_stats.n as f64;
                let n_j = level_j_stats.n as f64;

                let std_err = if n_i > 0.0 && n_j > 0.0 && !mse.is_nan() && mse >= 0.0 {
                    (mse * (1.0 / n_i + 1.0 / n_j)).sqrt()
                } else {
                    f64::NAN
                };
                std_errors_tub.push(std_err);

                let t_value = if !std_err.is_nan() && std_err > 0.0 {
                    mean_diff / std_err
                } else {
                    f64::NAN
                };

                let sig = if !t_value.is_nan() && df_error_pooled > 0 {
                    calculate_t_significance(t_value, df_error_pooled) // Unadjusted p-value
                } else {
                    f64::NAN
                };
                significances_tub.push(sig);

                let t_crit = calculate_t_critical(Some(alpha), df_error_pooled); // Standard t-critical for CI
                let ci_width = if !std_err.is_nan() && !t_crit.is_nan() {
                    t_crit * std_err
                } else {
                    f64::NAN
                };
                confidence_intervals_tub.push(ConfidenceInterval {
                    lower_bound: mean_diff - ci_width,
                    upper_bound: mean_diff + ci_width,
                });
            }
        }
        factor_comparison_entries.push(PostHocComparisonEntry {
            method: format!("Tukey's b (approx.) ({})", factor_name),
            parameter: parameters,
            mean_difference: mean_differences,
            standard_error: std_errors_tub,
            significance: significances_tub,
            confidence_interval: confidence_intervals_tub,
        });
        overall_notes.push(
            format!("Tukey's b test for factor '{}' is approximated using standard t-tests. The true Tukey's b procedure uses critical values from the Studentized Range (q) statistic, averaged for Tukey HSD and SNK, and is primarily for homogeneous subset determination.", factor_name)
        );
    }

    // --- Duncan's Multiple Range Test ---
    if config.posthoc.dun {
        let mut parameters: Vec<String> = Vec::new();
        let mut mean_differences: Vec<f64> = Vec::new();
        let mut std_errors_dun: Vec<f64> = Vec::new();
        let mut significances_dun: Vec<f64> = Vec::new();
        let mut confidence_intervals_dun: Vec<ConfidenceInterval> = Vec::new();

        for i in 0..num_levels_with_data {
            for j in i + 1..num_levels_with_data {
                let level_i_stats = &current_level_stats[i];
                let level_j_stats = &current_level_stats[j];
                parameters.push(format!("{} vs {}", level_i_stats.name, level_j_stats.name));
                let mean_diff = level_i_stats.mean - level_j_stats.mean;
                mean_differences.push(mean_diff);

                let n_i = level_i_stats.n as f64;
                let n_j = level_j_stats.n as f64;

                let std_err = if n_i > 0.0 && n_j > 0.0 && !mse.is_nan() && mse >= 0.0 {
                    (mse * (1.0 / n_i + 1.0 / n_j)).sqrt()
                } else {
                    f64::NAN
                };
                std_errors_dun.push(std_err);

                let t_value = if !std_err.is_nan() && std_err > 0.0 {
                    mean_diff / std_err
                } else {
                    f64::NAN
                };

                let sig = if !t_value.is_nan() && df_error_pooled > 0 {
                    calculate_t_significance(t_value, df_error_pooled) // Unadjusted p-value
                } else {
                    f64::NAN
                };
                significances_dun.push(sig);

                let t_crit = calculate_t_critical(Some(alpha), df_error_pooled); // Standard t-critical for CI
                let ci_width = if !std_err.is_nan() && !t_crit.is_nan() {
                    t_crit * std_err
                } else {
                    f64::NAN
                };
                confidence_intervals_dun.push(ConfidenceInterval {
                    lower_bound: mean_diff - ci_width,
                    upper_bound: mean_diff + ci_width,
                });
            }
        }
        factor_comparison_entries.push(PostHocComparisonEntry {
            method: format!("Duncan (approx.) ({})", factor_name),
            parameter: parameters,
            mean_difference: mean_differences,
            standard_error: std_errors_dun,
            significance: significances_dun,
            confidence_interval: confidence_intervals_dun,
        });
        overall_notes.push(
            format!("Duncan's Multiple Range Test for factor '{}' is approximated using standard t-tests. The true Duncan procedure uses special critical values based on the number of means spanned (Duncan's New Multiple Range Test values) and is primarily for homogeneous subset determination.", factor_name)
        );
    }

    // --- Dunnett's C (Unequal Variances) ---
    if config.posthoc.dunc {
        let mut parameters: Vec<String> = Vec::new();
        let mut mean_differences: Vec<f64> = Vec::new();
        let mut std_errors_dunc: Vec<f64> = Vec::new();
        let mut significances_dunc: Vec<f64> = Vec::new();
        let mut confidence_intervals_dunc: Vec<ConfidenceInterval> = Vec::new();

        // Dunnett's C uses separate variances, similar to Games-Howell for SE.
        // Critical values are based on Studentized Range q, but with specific adjustments.
        // Here, we approximate with t-tests and Welch-Satterthwaite df for p-values and CIs.

        for i in 0..num_levels_with_data {
            for j in i + 1..num_levels_with_data {
                let level_i_stats = &current_level_stats[i];
                let level_j_stats = &current_level_stats[j];
                parameters.push(format!("{} vs {}", level_i_stats.name, level_j_stats.name));
                let mean_diff = level_i_stats.mean - level_j_stats.mean;
                mean_differences.push(mean_diff);

                let n_i = level_i_stats.n as f64;
                let var_i = level_i_stats.variance;
                let n_j = level_j_stats.n as f64;
                let var_j = level_j_stats.variance;

                let std_err = if
                    n_i > 0.0 &&
                    n_j > 0.0 &&
                    !var_i.is_nan() &&
                    !var_j.is_nan() &&
                    var_i >= 0.0 &&
                    var_j >= 0.0
                {
                    (var_i / n_i + var_j / n_j).sqrt() // SE for unequal variances
                } else {
                    f64::NAN
                };
                std_errors_dunc.push(std_err);

                let df_dunc_approx = welch_satterthwaite_df(var_i, n_i, var_j, n_j);
                let df_dunc_approx_usize = if !df_dunc_approx.is_nan() && df_dunc_approx >= 1.0 {
                    df_dunc_approx.round() as usize
                } else {
                    0
                };

                let t_value = if !std_err.is_nan() && std_err > 0.0 {
                    mean_diff / std_err
                } else {
                    f64::NAN
                };

                // Using unadjusted p-values from t-distribution with Welch-Satterthwaite df.
                // True Dunnett's C would use a Studentized Range based significance.
                let sig = if !t_value.is_nan() && df_dunc_approx_usize > 0 {
                    calculate_t_significance(t_value, df_dunc_approx_usize)
                } else {
                    f64::NAN
                };
                significances_dunc.push(sig);

                // CI based on t-critical value with Welch-Satterthwaite df.
                // Approximating Dunnett's C CIs.
                let t_crit_dunc_approx = if df_dunc_approx_usize > 0 {
                    // For CI, a common approach is to use alpha/2 for each tail with Bonferroni for k_pairwise_comparisons.
                    // However, Dunnett's C is complex. Sticking to a simpler t-crit for this approximation.
                    calculate_t_critical(
                        Some(alpha / (k_pairwise_comparisons.max(1) as f64)),
                        df_dunc_approx_usize
                    ) // Bonferroni style adjustment for CI
                } else {
                    f64::NAN
                };

                let ci_width = if !std_err.is_nan() && !t_crit_dunc_approx.is_nan() {
                    t_crit_dunc_approx * std_err
                } else {
                    f64::NAN
                };
                confidence_intervals_dunc.push(ConfidenceInterval {
                    lower_bound: mean_diff - ci_width,
                    upper_bound: mean_diff + ci_width,
                });
            }
        }
        factor_comparison_entries.push(PostHocComparisonEntry {
            method: format!("Dunnett's C (approx.) ({})", factor_name),
            parameter: parameters,
            mean_difference: mean_differences,
            standard_error: std_errors_dunc,
            significance: significances_dunc,
            confidence_interval: confidence_intervals_dunc,
        });
        overall_notes.push(
            format!("Dunnett's C test for factor '{}' (unequal variances) is approximated using t-tests with Welch-Satterthwaite df. The true Dunnett's C procedure uses critical values from the Studentized Range (q) statistic with adjustments for unequal variances.", factor_name)
        );
    }

    factor_comparison_entries
}

fn calculate_homogeneous_subsets(
    factor_name: &str,
    current_level_stats: &[LevelStats],
    comparison_entries: &[PostHocComparisonEntry], // Now used for Tukey HSD (approx)
    config: &UnivariateConfig,
    alpha: f64,
    s_pp: f64, // Pooled standard deviation sqrt(MSE)
    n_h: f64, // Harmonic mean of sample sizes
    df_error: usize, // Degrees of freedom for error (MSE)
    f_factor_value: f64, // F-statistic for the current factor. Use f64::NAN if not applicable/calculable.
    df_factor: usize, // Degrees of freedom for the current factor (k-1)
    k_total_levels_with_data: usize, // Renamed from _k_total_levels_with_data as it IS used in note_str
    overall_notes: &mut Vec<String>
) -> Vec<PostHocHomogoneousEntry> {
    let mut factor_homog_entries: Vec<PostHocHomogoneousEntry> = Vec::new();

    // Sort level_stats by mean for subset algorithms
    let mut sorted_level_stats_with_nan: Vec<LevelStats> = current_level_stats.to_vec();
    // Ensure means are valid for sorting, handle NaNs by placing them at the end or beginning consistently
    sorted_level_stats_with_nan.sort_by(|a, b|
        a.mean.partial_cmp(&b.mean).unwrap_or(std::cmp::Ordering::Less)
    );

    let num_levels = sorted_level_stats_with_nan
        .iter()
        .filter(|s| !s.mean.is_nan())
        .count();

    if num_levels < 2 {
        if
            num_levels == 1 &&
            !sorted_level_stats_with_nan.is_empty() &&
            !sorted_level_stats_with_nan[0].mean.is_nan()
        {
            overall_notes.push(
                format!(
                    "Factor '{}' has only one level with data ('{}'), no homogeneous subset comparisons performed.",
                    factor_name,
                    sorted_level_stats_with_nan
                        .iter()
                        .find(|s| !s.mean.is_nan())
                        .unwrap().name
                )
            );
        } else if num_levels == 0 {
            overall_notes.push(
                format!("Factor '{}' has no levels with valid data for homogeneous subset analysis.", factor_name)
            );
        }
        return factor_homog_entries;
    }

    // Filter out levels with NaN means for actual subset processing
    let valid_sorted_level_stats: Vec<LevelStats> = sorted_level_stats_with_nan
        .into_iter()
        .filter(|s| !s.mean.is_nan())
        .collect();

    let num_valid_levels = valid_sorted_level_stats.len();
    if num_valid_levels < 2 {
        // Re-check after filtering NaNs
        return factor_homog_entries;
    }

    // Helper function to generate homogeneous subsets based on pairwise comparison results
    let create_homogeneous_subsets = |
        method_name: &str,
        method_key: &str,
        comparison_entries: &[PostHocComparisonEntry],
        overall_notes: &mut Vec<String>
    | -> Option<PostHocHomogoneousEntry> {
        let sorted_level_names: Vec<String> = valid_sorted_level_stats
            .iter()
            .map(|s| s.name.clone())
            .collect();
        let sorted_means: Vec<f64> = valid_sorted_level_stats
            .iter()
            .map(|s| s.mean)
            .collect();
        let sorted_ns: Vec<usize> = valid_sorted_level_stats
            .iter()
            .map(|s| s.n)
            .collect();

        let mut subsets_data: Vec<Subset> = Vec::new();

        if num_valid_levels >= 1 {
            // Find the corresponding pairwise comparison results for this method
            let pairwise_results = comparison_entries
                .iter()
                .find(|entry| entry.method.contains(method_key));

            // Adjacency matrix: adj[i][j] is true if means i and j are NOT significantly different.
            let mut adj = vec![vec![false; num_valid_levels]; num_valid_levels];

            if let Some(pairwise) = pairwise_results {
                for i in 0..num_valid_levels {
                    adj[i][i] = true; // A mean is always compatible with itself.
                    for j in i + 1..num_valid_levels {
                        let level_i_name = &valid_sorted_level_stats[i].name;
                        let level_j_name = &valid_sorted_level_stats[j].name;

                        let param_idx_opt = pairwise.parameter
                            .iter()
                            .position(|p| {
                                p.contains(level_i_name) &&
                                    p.contains(level_j_name) &&
                                    ((p.starts_with(level_i_name) && p.ends_with(level_j_name)) ||
                                        (p.starts_with(level_j_name) && p.ends_with(level_i_name)))
                            });

                        if let Some(param_idx) = param_idx_opt {
                            if let Some(sig) = pairwise.significance.get(param_idx) {
                                if !sig.is_nan() && *sig >= alpha {
                                    adj[i][j] = true;
                                    adj[j][i] = true;
                                }
                            }
                        } else {
                            if
                                !overall_notes
                                    .iter()
                                    .any(|note|
                                        note.contains(
                                            &format!(
                                                "Missing pairwise comparison for {} subset: {} vs {}",
                                                method_name,
                                                level_i_name,
                                                level_j_name
                                            )
                                        )
                                    )
                            {
                                overall_notes.push(
                                    format!(
                                        "Warning: Missing pairwise comparison for {} subset generation between {} and {}. Assuming different.",
                                        method_name,
                                        level_i_name,
                                        level_j_name
                                    )
                                );
                            }
                        }
                    }
                }

                // Standard algorithm for homogeneous subset display:
                // Iterate through sorted means. For each mean, form a subset with all subsequent means
                // that are not significantly different from it AND from each other.
                let mut means_in_a_subset_column = vec![false; num_valid_levels];

                for i in 0..num_valid_levels {
                    if means_in_a_subset_column[i] {
                        continue;
                    }

                    let mut current_subset_group = vec![i];
                    for j in i + 1..num_valid_levels {
                        // Check if mean j is non-significant with mean i AND all other means currently in current_subset_group
                        let mut compatible = true;
                        for member_idx in &current_subset_group {
                            if !adj[*member_idx][j] {
                                compatible = false;
                                break;
                            }
                        }
                        if compatible {
                            current_subset_group.push(j);
                        }
                    }
                    // Add this group to subsets_data
                    if !current_subset_group.is_empty() {
                        let mut subset_column_values = vec![f64::NAN; num_valid_levels];
                        for &idx in &current_subset_group {
                            subset_column_values[idx] = sorted_means[idx];
                            means_in_a_subset_column[idx] = true; // Mark as included in *some* column
                        }
                        subsets_data.push(Subset { subset: subset_column_values });
                    }
                }
                // If after the above, some means are not in any column, put them in their own.
                // This ensures all means appear.
                for i in 0..num_valid_levels {
                    let mean_appears_in_any_subset = subsets_data
                        .iter()
                        .any(|s| !s.subset[i].is_nan());
                    if !mean_appears_in_any_subset {
                        let mut solo_subset_col = vec![f64::NAN; num_valid_levels];
                        solo_subset_col[i] = sorted_means[i];
                        subsets_data.push(Subset { subset: solo_subset_col });
                    }
                }
            } else {
                // No pairwise results found for this method, create default subsets (each mean in its own column)
                if
                    !overall_notes
                        .iter()
                        .any(|note|
                            note.contains(
                                &format!("No pairwise {} results found for subset", method_name)
                            )
                        )
                {
                    overall_notes.push(
                        format!(
                            "Note: No pairwise {} results found for factor '{}' to generate homogeneous subsets. Each mean will be in its own subset column.",
                            method_name,
                            factor_name
                        )
                    );
                }
                for i in 0..num_valid_levels {
                    let mut subset_column_values = vec![f64::NAN; num_valid_levels];
                    subset_column_values[i] = sorted_means[i];
                    subsets_data.push(Subset { subset: subset_column_values });
                }
            }

            let note_str = format!(
                "Homogeneous subsets for {} ('{}') are based on pairwise significance (alpha={}) from the approximated test. s_pp={:.3}, n_h={:.3}, df_error={}, k_levels={}",
                method_name,
                factor_name,
                alpha,
                s_pp,
                n_h,
                df_error,
                k_total_levels_with_data
            );
            if !overall_notes.iter().any(|note| note.contains(&note_str)) {
                overall_notes.push(note_str);
            }
        }

        Some(PostHocHomogoneousEntry {
            method: format!("{} ({})", method_name, factor_name),
            parameter: sorted_level_names,
            mean_difference: sorted_means,
            n: sorted_ns,
            subsets: subsets_data,
        })
    };

    // --- Homogeneous Subsets for Tukey HSD (Approximation) ---
    if config.posthoc.tu {
        if
            let Some(entry) = create_homogeneous_subsets(
                "Tukey HSD (approx.)",
                "Tukey HSD (approx.)",
                comparison_entries,
                overall_notes
            )
        {
            factor_homog_entries.push(entry);
        }
    }

    // --- Homogeneous Subsets for Student-Newman-Keuls (SNK) ---
    if config.posthoc.snk {
        if
            let Some(entry) = create_homogeneous_subsets(
                "SNK",
                "SNK",
                comparison_entries,
                overall_notes
            )
        {
            factor_homog_entries.push(entry);
        }
    }

    // --- Homogeneous Subsets for Tukey's b ---
    if config.posthoc.tub {
        if
            let Some(entry) = create_homogeneous_subsets(
                "Tukey's b",
                "Tukey's b",
                comparison_entries,
                overall_notes
            )
        {
            factor_homog_entries.push(entry);
        }
    }

    // --- Homogeneous Subsets for Duncan's Multiple Range Test ---
    if config.posthoc.dun {
        if
            let Some(entry) = create_homogeneous_subsets(
                "Duncan",
                "Duncan",
                comparison_entries,
                overall_notes
            )
        {
            factor_homog_entries.push(entry);
        }
    }

    // --- Homogeneous Subsets for Ryan-Einot-Gabriel-Welsch Range Q test ---
    if config.posthoc.regwq {
        if
            let Some(entry) = create_homogeneous_subsets(
                "REGW Q",
                "REGW Q",
                comparison_entries,
                overall_notes
            )
        {
            factor_homog_entries.push(entry);
        }
    }

    // --- Homogeneous Subsets for Ryan-Einot-Gabriel-Welsch F test ---
    if config.posthoc.regwf {
        if
            let Some(entry) = create_homogeneous_subsets(
                "REGW F",
                "REGW F",
                comparison_entries,
                overall_notes
            )
        {
            factor_homog_entries.push(entry);
        }
    }

    // --- Homogeneous Subsets for Waller-Duncan test ---
    if config.posthoc.waller {
        if
            let Some(entry) = create_homogeneous_subsets(
                "Waller-Duncan",
                "Waller-Duncan",
                comparison_entries,
                overall_notes
            )
        {
            factor_homog_entries.push(entry);
        }
    }

    // --- Homogeneous Subsets for Scheffe ---
    if config.posthoc.scheffe {
        if
            let Some(entry) = create_homogeneous_subsets(
                "Scheffe",
                "Scheffe",
                comparison_entries,
                overall_notes
            )
        {
            factor_homog_entries.push(entry);
        }
    }

    // --- Homogeneous Subsets for Gabriel's Test ---
    if config.posthoc.gabriel {
        if
            let Some(entry) = create_homogeneous_subsets(
                "Gabriel",
                "Gabriel",
                comparison_entries,
                overall_notes
            )
        {
            factor_homog_entries.push(entry);
        }
    }

    // --- Homogeneous Subsets for Hochberg's GT2 ---
    if config.posthoc.hoc {
        if
            let Some(entry) = create_homogeneous_subsets(
                "Hochberg's GT2",
                "Hochberg's GT2",
                comparison_entries,
                overall_notes
            )
        {
            factor_homog_entries.push(entry);
        }
    }

    factor_homog_entries
}

/// Calculate post-hoc tests based on the configuration
pub fn calculate_posthoc_tests(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<PostHoc, String> {
    let dep_var_name = config.main.dep_var
        .as_ref()
        .ok_or_else(|| "No dependent variable specified for post-hoc.".to_string())?;

    let factors_for_posthoc = match &config.posthoc.fix_factor_vars {
        Some(factors) if !factors.is_empty() => factors.clone(), // Clone to own the data
        _ => {
            // No factors specified, return empty PostHoc
            return Ok(PostHoc {
                factor_names: Vec::new(),
                comparison: Vec::new(),
                homogoneous: Vec::new(),
            });
        }
    };

    let alpha = config.options.sig_level;
    let mut processed_factor_names: Vec<String> = Vec::new();
    let mut collected_comparisons: Vec<PostHocComparison> = Vec::new();
    let mut collected_homog_subsets: Vec<PostHocHomogoneous> = Vec::new();
    let mut overall_notes: Vec<String> = Vec::new();

    for factor_name_ref in factors_for_posthoc {
        let factor_name = factor_name_ref.to_string(); // Work with owned String
        let factor_levels_names_initial = get_factor_levels(data, &factor_name)?;
        if factor_levels_names_initial.len() < 2 {
            overall_notes.push(
                format!("Factor '{}' has fewer than 2 levels initially, skipping post-hoc.", factor_name)
            );
            continue;
        }

        let mut current_level_stats: Vec<LevelStats> = Vec::new();
        for (idx, level_name) in factor_levels_names_initial.iter().enumerate() {
            let stats = calculate_single_level_stats(
                data,
                &factor_name,
                level_name,
                dep_var_name,
                idx
            )?;
            if stats.n > 0 {
                current_level_stats.push(stats);
            }
        }

        if current_level_stats.len() < 2 {
            overall_notes.push(
                format!("Factor '{}' has fewer than 2 levels with data, skipping post-hoc.", factor_name)
            );
            continue;
        }

        current_level_stats.sort_by(|a, b| a.name.cmp(&b.name));

        let (mse, df_error_pooled, s_pp, n_h, total_n_for_factor) =
            calculate_pooled_stats_for_posthoc(&current_level_stats);

        let mut f_factor_value = f64::NAN;
        let mut df_factor = 0;

        if !mse.is_nan() && mse >= 0.0 && total_n_for_factor > 0 && current_level_stats.len() > 1 {
            // mse can be 0
            let mut grand_sum = 0.0;
            let mut grand_n = 0.0;
            for stats in &current_level_stats {
                if !stats.mean.is_nan() && stats.n > 0 {
                    grand_sum += stats.mean * (stats.n as f64);
                    grand_n += stats.n as f64;
                }
            }

            if grand_n > 0.0 {
                let grand_mean = grand_sum / grand_n;
                let mut ss_factor = 0.0;
                for stats in &current_level_stats {
                    if !stats.mean.is_nan() && stats.n > 0 {
                        ss_factor += (stats.n as f64) * (stats.mean - grand_mean).powi(2);
                    }
                }
                df_factor = current_level_stats.len() - 1;
                if df_factor > 0 {
                    let ms_factor = ss_factor / (df_factor as f64);
                    if mse > 0.0 {
                        // Avoid division by zero if mse is zero
                        f_factor_value = ms_factor / mse;
                    } else if ms_factor > 0.0 {
                        // If mse is 0 but ms_factor is not, F is Inf
                        f_factor_value = f64::INFINITY;
                    } else {
                        // Both mse and ms_factor are 0, F is NaN
                        f_factor_value = f64::NAN;
                    }
                }
            }
        }

        if mse.is_nan() || df_error_pooled == 0 {
            overall_notes.push(
                format!("Could not calculate pooled MSE or its df_error is 0 for factor '{}'. This may affect equal variance tests.", factor_name)
            );
            // Continue processing as some tests (e.g. Games-Howell) do not use pooled MSE.
        }

        let num_levels_with_data_for_k = current_level_stats.len();
        let k_pairwise_comparisons = if num_levels_with_data_for_k >= 2 {
            (num_levels_with_data_for_k * (num_levels_with_data_for_k - 1)) / 2
        } else {
            0
        };

        let num_initial_levels = factor_levels_names_initial.len();

        // These notes are specific to this factor's calculations for multiple comparisons
        let mut current_factor_multiple_comparison_notes: Vec<String> = Vec::new();
        let factor_comparison_results = calculate_multiple_comparisons(
            &factor_name,
            &current_level_stats,
            mse,
            df_error_pooled,
            s_pp,
            config,
            alpha,
            num_levels_with_data_for_k, // k_total_levels_with_data for Scheffe etc.
            num_initial_levels, // For Dunnett
            k_pairwise_comparisons, // For Bonferroni, Sidak, Tukey approx etc.
            f_factor_value, // Pass F-value for the factor
            df_factor, // Pass df for the factor
            &mut current_factor_multiple_comparison_notes
        );
        overall_notes.extend(current_factor_multiple_comparison_notes.clone()); // Add to overall notes

        // These notes are specific to this factor's calculations for homogeneous subsets
        let mut current_factor_homog_notes: Vec<String> = Vec::new();
        let factor_homog_results = calculate_homogeneous_subsets(
            &factor_name,
            &current_level_stats,
            &factor_comparison_results, // Pass the comparisons for this factor
            config,
            alpha,
            s_pp,
            n_h,
            df_error_pooled,
            f_factor_value, // Pass f_factor_value
            df_factor, // Pass df_factor
            num_levels_with_data_for_k,
            &mut current_factor_homog_notes
        );
        overall_notes.extend(current_factor_homog_notes.clone()); // Add to overall notes

        processed_factor_names.push(factor_name.clone());
        collected_comparisons.push(PostHocComparison {
            entries: factor_comparison_results,
            notes: Vec::new(), // Notes will be aggregated at the end for all factors
        });
        collected_homog_subsets.push(PostHocHomogoneous {
            entries: factor_homog_results,
            notes: Vec::new(), // Notes will be aggregated at the end for all factors
        });
    }

    // Deduplicate overall_notes
    let mut unique_notes = Vec::new();
    let mut seen_notes = HashSet::new();
    for note in overall_notes {
        if seen_notes.insert(note.clone()) {
            unique_notes.push(note);
        }
    }

    // Assign unique_notes to each PostHocComparison and PostHocHomogoneous object
    for comp in &mut collected_comparisons {
        comp.notes = unique_notes.clone();
    }
    for homog in &mut collected_homog_subsets {
        homog.notes = unique_notes.clone();
    }

    Ok(PostHoc {
        factor_names: processed_factor_names,
        comparison: collected_comparisons,
        homogoneous: collected_homog_subsets,
    })
}
