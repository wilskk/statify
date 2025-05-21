use statrs::statistics::{ Statistics };
use rayon::prelude::*;

use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ LeveneTest, LeveneTestEntry },
};

use super::core::*;

/// Calculate Levene's Test for homogeneity of variances if requested
pub fn calculate_levene_test(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<Vec<LeveneTest>, String> {
    if !config.options.homogen_test {
        return Err("Levene's test not requested in configuration".to_string());
    }

    // Get dependent variables
    let dep_vars = match &config.main.dep_var {
        Some(name) => vec![name.clone()],
        None => {
            // Extract all unique dependent variable names
            data.dependent_data
                .iter()
                .flat_map(|records| {
                    records.iter().flat_map(|record| { record.values.keys().cloned() })
                })
                .collect::<std::collections::HashSet<_>>()
                .into_iter()
                .collect::<Vec<_>>()
        }
    };

    if dep_vars.is_empty() {
        return Err("No dependent variables found in data".to_string());
    }

    // Build design string
    let mut design = if config.model.intercept {
        "Design: Intercept".to_string()
    } else {
        "Design: ".to_string()
    };

    // Add covariates
    if let Some(covariates) = &config.main.covar {
        for covariate in covariates {
            design.push_str(" + ");
            design.push_str(covariate);
        }
    }

    // Collect all terms (factors and interactions)
    let mut all_terms = Vec::new();

    // Add fixed factors and collect them for later interaction generation
    let fix_factors = config.main.fix_factor.clone().unwrap_or_default();

    // Add individual factors to design
    for factor in &fix_factors {
        design.push_str(" + ");
        design.push_str(factor);
        all_terms.push(factor.clone());
    }

    // Generate interactions if there's more than one factor and term_text isn't specified
    if fix_factors.len() > 1 && config.model.term_text.is_none() {
        let interaction_terms = generate_interaction_terms(&fix_factors);
        for term in &interaction_terms {
            design.push_str(" + ");
            design.push_str(term);
            all_terms.push((*term).to_string());
        }
    }

    // Add explicitly specified interactions if term_text is provided
    if let Some(term_text) = &config.model.term_text {
        for term in term_text.split('+') {
            let trimmed = term.trim();
            if trimmed.contains('*') {
                design.push_str(" + ");
                design.push_str(trimmed);
                all_terms.push(trimmed.to_string());
            }
        }
    }

    // Get factor combinations
    let factor_combinations = get_factor_combinations(data, config)?;

    // Process each dependent variable in parallel if possible
    let results: Vec<LeveneTest> = dep_vars
        .into_par_iter()
        .filter_map(|dep_var_name| {
            // Organize data values by group
            let groups = collect_groups(data, &dep_var_name, &fix_factors, &factor_combinations);

            // Skip if not enough groups for analysis
            if groups.len() < 2 {
                return None;
            }

            let mut levene_entries: Vec<LeveneTestEntry> = Vec::new();

            if
                config.main.covar.is_none() ||
                config.main.covar.as_ref().map_or(true, |c| c.is_empty())
            {
                // No covariates, calculate all four types
                let (f_mean, df1_mean, df2_mean, sig_mean) = calculate_levene_statistic(
                    &groups,
                    LeveneCenter::Mean
                );
                levene_entries.push(LeveneTestEntry {
                    function: "Based on Mean".to_string(),
                    levene_statistic: f_mean,
                    df1: df1_mean,
                    df2: df2_mean as f64,
                    significance: sig_mean,
                });

                let (f_median, df1_median, df2_median, sig_median) = calculate_levene_statistic(
                    &groups,
                    LeveneCenter::Median
                );
                levene_entries.push(LeveneTestEntry {
                    function: "Based on Median".to_string(),
                    levene_statistic: f_median,
                    df1: df1_median,
                    df2: df2_median as f64,
                    significance: sig_median,
                });

                // For "Based on Median and with adjusted df", we use the same median calculation
                // but potentially adjust df2 if needed (though current calculate_levene_statistic doesn't show df adjustment based on type)
                // SPSS output shows different df2 for "Median and with adjusted df" in one example, need to clarify how df is adjusted.
                // For now, using the same df2 as regular median.
                let (f_median_adj, df1_median_adj, df2_median_adj_float, sig_median_adj) =
                    calculate_levene_statistic_adjusted_df(&groups);
                levene_entries.push(LeveneTestEntry {
                    function: "Based on Median and with adjusted df".to_string(),
                    levene_statistic: f_median_adj,
                    df1: df1_median_adj,
                    df2: df2_median_adj_float,
                    significance: sig_median_adj,
                });

                let (f_trimmed, df1_trimmed, df2_trimmed, sig_trimmed) = calculate_levene_statistic(
                    &groups,
                    LeveneCenter::TrimmedMean(0.05)
                ); // Using 5% trim as per documentation
                levene_entries.push(LeveneTestEntry {
                    function: "Based on trimmed mean".to_string(),
                    levene_statistic: f_trimmed,
                    df1: df1_trimmed,
                    df2: df2_trimmed as f64,
                    significance: sig_trimmed,
                });
            } else {
                // Covariates are present, calculate standard Levene's test (based on mean)
                let (f_statistic, df1, df2, significance) = calculate_levene_statistic(
                    &groups,
                    LeveneCenter::Mean
                );
                levene_entries.push(LeveneTestEntry {
                    function: "Levene".to_string(), // As per original single entry logic
                    levene_statistic: f_statistic,
                    df1,
                    df2: df2 as f64,
                    significance,
                });
            }

            // Create result
            Some(LeveneTest {
                dependent_variable: dep_var_name,
                entries: levene_entries,
                design: design.clone(),
            })
        })
        .collect();

    if results.is_empty() {
        Err("No valid Levene test results could be calculated".to_string())
    } else {
        Ok(results)
    }
}

/// Collect data values organized by groups for Levene test
fn collect_groups(
    data: &AnalysisData,
    dep_var_name: &str,
    fix_factors: &[String],
    factor_combinations: &[std::collections::HashMap<String, String>]
) -> Vec<Vec<f64>> {
    let mut groups = Vec::new();

    // For each combination, find all matching records
    for combo in factor_combinations {
        let mut group_values = Vec::new();

        // We need to iterate through all records in the dependent data
        for records in &data.dependent_data {
            for (record_idx, record) in records.iter().enumerate() {
                // Check if this record matches the current combination
                if record_matches_combination(record, record_idx, data, combo, fix_factors) {
                    if let Some(value) = extract_dependent_value(record, dep_var_name) {
                        group_values.push(value);
                    }
                }
            }
        }

        if !group_values.is_empty() {
            groups.push(group_values);
        }
    }

    groups
}

/// Check if a record matches a specific factor combination
fn record_matches_combination(
    record: &crate::univariate::models::data::DataRecord,
    record_idx: usize,
    data: &AnalysisData,
    combo: &std::collections::HashMap<String, String>,
    fix_factors: &[String]
) -> bool {
    // If there are no fixed factors, every record is considered part of a single group.
    if fix_factors.is_empty() {
        // In Levene's test, if there are no factors, conceptually there is only one group.
        // The test is typically used to compare variances *across groups*.
        // However, to allow calculation (e.g., if a single overall variance check is intended),
        // we might return true. But usually, Levene's test needs >1 group.
        // The calling code already checks for groups.len() < 2.
        // So, if fix_factors is empty, get_factor_combinations should yield one empty combo,
        // leading to one group with all data.
        return true;
    }

    for (factor_key, combo_level_val) in combo {
        let mut factor_value_in_record: Option<String> = None;

        // Try to find the factor in fix_factor_data first
        if
            let Some(factor_idx_in_config) = fix_factors
                .iter()
                .position(|f_name| f_name == factor_key)
        {
            // Ensure the specific factor list (outer Vec) exists
            if let Some(factor_specific_data_list) = data.fix_factor_data.get(factor_idx_in_config) {
                // Ensure the record (inner Vec element) exists for that factor
                if let Some(factor_data_record) = factor_specific_data_list.get(record_idx) {
                    if let Some(val) = factor_data_record.values.get(factor_key) {
                        factor_value_in_record = Some(data_value_to_string(val));
                    }
                }
            }
        }

        // If not found in fix_factor_data or if the factor is not part of fix_factors (e.g. from other sources like dependent_data),
        // try to get it from the dependent_record's values. This provides a fallback.
        if factor_value_in_record.is_none() {
            if let Some(val_from_dep) = record.values.get(factor_key) {
                factor_value_in_record = Some(data_value_to_string(val_from_dep));
            }
        }

        match factor_value_in_record {
            Some(record_level) if &record_level == combo_level_val => {
                continue;
            }
            _ => {
                return false;
            } // Mismatch or factor not found for this record
        }
    }
    true
}

/// Enum to specify the centering method for Levene's test
#[derive(Clone, Copy)]
enum LeveneCenter {
    Mean,
    Median,
    TrimmedMean(f64), // Argument is the proportion to trim from each end
}

/// Calculate Levene test statistics
fn calculate_levene_statistic(
    groups: &[Vec<f64>],
    center_method: LeveneCenter
) -> (f64, usize, usize, f64) {
    if groups.iter().any(|g| g.is_empty()) || groups.len() < 2 {
        return (f64::NAN, 0, 0, f64::NAN);
    }
    // Calculate group centers (mean, median, or trimmed mean)
    let group_centers: Vec<f64> = groups
        .iter()
        .map(|group| {
            match center_method {
                LeveneCenter::Mean => group.mean(),
                LeveneCenter::Median => {
                    let mut sorted_group = group.clone();
                    sorted_group.sort_by(|a, b|
                        a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal)
                    );
                    if sorted_group.is_empty() {
                        0.0
                    } else if sorted_group.len() % 2 == 1 {
                        sorted_group[sorted_group.len() / 2]
                    } else {
                        (sorted_group[sorted_group.len() / 2 - 1] +
                            sorted_group[sorted_group.len() / 2]) /
                            2.0
                    }
                }
                LeveneCenter::TrimmedMean(proportion) => {
                    if group.is_empty() {
                        return 0.0;
                    }
                    let mut sorted_group = group.clone();
                    sorted_group.sort_by(|a, b|
                        a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal)
                    );

                    let n = sorted_group.len();
                    let trim_count = if n > 2 {
                        // Only apply special small N handling if n > 2
                        let calculated_trim_float = (n as f64) * proportion;
                        if calculated_trim_float < 1.0 {
                            // If 5% is less than 1 element
                            1 // Trim 1 element from each side for small N (3 to 19 for 5% trim)
                        } else {
                            calculated_trim_float.floor() as usize
                        }
                    } else {
                        // For n <= 2, or if proportion is very high.
                        // Standard calculation, likely results in 0 trim_count for n <= 2
                        ((n as f64) * proportion).floor() as usize
                    };

                    // Ensure we don't trim everything or more
                    if 2 * trim_count >= n {
                        // This case handles when trimming would empty the list or leave 1 element from center
                        // (e.g., n=3, trim_count=1 -> slice has 1 element; n=2, trim_count=1 -> slice is empty)
                        // Fallback to mean if trimming is too aggressive or group too small
                        return group.mean();
                    }

                    let trimmed_slice = &sorted_group[trim_count..n - trim_count];

                    if trimmed_slice.is_empty() {
                        // This should ideally be caught by the 2 * trim_count >= n check above,
                        // but kept as a safeguard.
                        group.mean() // Fallback to mean
                    } else {
                        trimmed_slice.mean()
                    }
                }
            }
        })
        .collect();

    // Calculate absolute deviations from group centers
    let abs_deviations: Vec<Vec<f64>> = groups
        .iter()
        .enumerate()
        .map(|(i, group)| {
            let mean = group_centers[i];
            group
                .iter()
                .map(|val| (val - mean).abs())
                .collect()
        })
        .collect();

    // Calculate total sample size
    let total_samples = groups
        .iter()
        .map(|group| group.len())
        .sum::<usize>();

    // Calculate the overall mean of absolute deviations
    let all_deviations: Vec<f64> = abs_deviations.iter().flatten().cloned().collect();
    let overall_mean = all_deviations.mean();

    // Calculate sum of squares between groups
    let ss_between = abs_deviations
        .iter()
        .enumerate()
        .map(|(i, group)| {
            let group_mean = group.mean();
            let group_size = groups[i].len() as f64;
            group_size * (group_mean - overall_mean).powi(2)
        })
        .sum::<f64>();

    // Calculate sum of squares within groups
    let ss_within = abs_deviations
        .iter()
        .enumerate()
        .map(|(i, group)| {
            let group_mean = group.mean();
            group
                .iter()
                .map(|val| (val - group_mean).powi(2))
                .sum::<f64>()
        })
        .sum::<f64>();

    // Degrees of freedom
    let df1 = groups.len() - 1;
    let df2 = total_samples - groups.len();

    if df2 == 0 {
        // Each group has 1 obs -> ss_within=0, ss_between=0. F is 0/0.
        return (f64::NAN, df1, df2, f64::NAN);
    }

    let f_statistic: f64;
    if ss_within < 1e-12 {
        // Using a small epsilon for floating point comparison to zero
        if ss_between < 1e-12 {
            f_statistic = 0.0; // All deviations are zero or near zero, perfect homogeneity
        } else {
            f_statistic = f64::INFINITY; // Zero within-group variance, but some between-group variance
        }
    } else {
        // df1 is always >= 1 here. df2 > 0. ss_within > 0.
        let ms_between = ss_between / (df1 as f64);
        let ms_within = ss_within / (df2 as f64);
        f_statistic = ms_between / ms_within;
    }

    // Calculate significance
    let significance = calculate_f_significance(df1, df2, f_statistic);

    (f_statistic, df1, df2, significance)
}

// Specific function for "Based on Median and with adjusted df"
// This function will now return df2 as f64 to match LeveneTestEntry and the nature of 'v'.
fn calculate_levene_statistic_adjusted_df(groups: &[Vec<f64>]) -> (f64, usize, f64, f64) {
    if groups.iter().any(|g| g.is_empty()) || groups.len() < 2 {
        return (f64::NAN, 0, f64::NAN, f64::NAN); // df2 is f64
    }

    // Calculate z_il_b (absolute deviations from group medians)
    let group_medians: Vec<f64> = groups
        .iter()
        .map(|group| {
            if group.is_empty() {
                return 0.0;
            }
            let mut sorted_group = group.clone();
            sorted_group.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
            if sorted_group.len() % 2 == 1 {
                sorted_group[sorted_group.len() / 2]
            } else {
                (sorted_group[sorted_group.len() / 2 - 1] + sorted_group[sorted_group.len() / 2]) /
                    2.0
            }
        })
        .collect();

    let abs_deviations_from_median: Vec<Vec<f64>> = groups
        .iter()
        .enumerate()
        .map(|(i, group)| {
            let median = group_medians[i];
            group
                .iter()
                .map(|val| (val - median).abs())
                .collect()
        })
        .collect();

    // Calculate components for the F-statistic (L_b)
    let k = groups.len();
    let n_total = groups
        .iter()
        .map(|g| g.len())
        .sum::<usize>();
    let df1 = k - 1;
    let df2_standard = if n_total > k { (n_total - k) as f64 } else { 0.0 }; // df2_standard as f64

    if df1 == 0 {
        // This case handles when k=2, making new df1 = 0.
        return (f64::NAN, df1, if df2_standard > 0.0 { df2_standard } else { 1.0 }, f64::NAN); // df2 is f64
    }

    let group_means_of_abs_dev: Vec<f64> = abs_deviations_from_median
        .iter()
        .map(|devs| if devs.is_empty() { 0.0 } else { devs.mean() })
        .collect();

    let overall_mean_of_abs_dev = {
        let all_devs_flat: Vec<f64> = abs_deviations_from_median
            .iter()
            .flatten()
            .cloned()
            .collect();
        if all_devs_flat.is_empty() {
            0.0
        } else {
            all_devs_flat.mean()
        }
    };

    let group_sizes: Vec<usize> = groups
        .iter()
        .map(|g| g.len())
        .collect();

    let ss_between_abs_dev = group_means_of_abs_dev
        .iter()
        .zip(group_sizes.iter())
        .map(
            |(&mean_val, &size_val)|
                (size_val as f64) * (mean_val - overall_mean_of_abs_dev).powi(2)
        )
        .sum::<f64>();

    let u_values: Vec<f64> = abs_deviations_from_median
        .iter()
        .zip(group_means_of_abs_dev.iter())
        .map(|(group_devs, &group_mean_val)| {
            group_devs
                .iter()
                .map(|&dev_val| (dev_val - group_mean_val).powi(2))
                .sum::<f64>()
        })
        .collect();

    let sum_u_i = u_values.iter().sum::<f64>();

    let f_statistic_median: f64;
    if df2_standard <= 1e-9 {
        // Effectively df2_standard is zero (N_total == k)
        // This implies sum_u_i (ss_within) is 0 and ss_between_abs_dev (ss_between) is 0. F is 0/0.
        f_statistic_median = f64::NAN;
    } else if sum_u_i < 1e-12 {
        // ss_within (sum_u_i) is effectively zero, but df2_standard > 0
        if ss_between_abs_dev < 1e-12 {
            // ss_between is also zero
            f_statistic_median = 0.0;
        } else {
            // ss_between is positive
            f_statistic_median = f64::INFINITY;
        }
    } else {
        // sum_u_i > 0 (ss_within > 0) and df2_standard > 0. df1 = k-1 >= 1 (since k >= 2).
        let ms_between_abs_dev = ss_between_abs_dev / (df1 as f64);
        let ms_within_abs_dev = sum_u_i / df2_standard;
        f_statistic_median = ms_between_abs_dev / ms_within_abs_dev;
    }

    // Calculate v (adjusted df2)
    let sum_u_i_sq_over_m_i_minus_1: f64 = u_values
        .iter()
        .zip(group_sizes.iter())
        .filter_map(|(&ui, &mi)| {
            if mi > 1 { Some(ui.powi(2) / ((mi - 1) as f64)) } else { None }
        })
        .sum();

    let df2_v_float = if sum_u_i < 1e-12 {
        df2_standard
    } else if sum_u_i_sq_over_m_i_minus_1 > 1e-12 {
        sum_u_i.powi(2) / sum_u_i_sq_over_m_i_minus_1
    } else {
        df2_standard
    };

    let final_df2_v = if df2_v_float.is_finite() && df2_v_float >= 1.0 {
        df2_v_float
    } else {
        if df2_standard > 0.0 {
            df2_standard
        } else {
            1.0 // Fallback if v is NaN, Inf, < 1.0 or zero, ensure df2 is at least 1.0
        }
    };

    // robust_final_df2_v is not strictly needed if final_df2_v handles the >= 1.0 condition.
    // let robust_final_df2_v = if final_df2_v < 1.0 { 1.0 } else { final_df2_v }; // Ensure df is at least 1
    let robust_df2_to_use = if final_df2_v < 1.0 { 1.0 } else { final_df2_v };

    let significance_adj = calculate_f_significance(
        df1,
        robust_df2_to_use.round() as usize,
        f_statistic_median
    );

    // Ensure f_statistic_median is not NaN if possible, default to 0 if so for consistent return types
    let f_to_return = if f_statistic_median.is_nan() { 0.0 } else { f_statistic_median };

    (f_to_return, df1, robust_df2_to_use, significance_adj) // Return robust_df2_to_use (f64)
}
