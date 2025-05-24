use statrs::statistics::{ Statistics, Distribution };
use statrs::distribution::ContinuousCDF;
use rayon::prelude::*;
use std::collections::HashMap;
use crate::univariate::stats::design_matrix::{
    create_design_response_weights,
    DesignMatrixInfo,
    create_cross_product_matrix,
    perform_sweep_and_extract_results,
};
use crate::univariate::stats::sum_of_squares;
use crate::univariate::models::config::SumOfSquaresMethod;

use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ LeveneTest, LeveneTestEntry },
};

// Import necessary common utilities
use crate::univariate::stats::common::{
    data_value_to_string,
    extract_numeric_from_record,
    get_factor_combinations,
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
            if data.dependent_data.is_empty() || data.dependent_data[0].is_empty() {
                return Err("No dependent variable data found.".to_string());
            }
            data.dependent_data[0][0].values.keys().cloned().collect::<Vec<_>>()
        }
    };

    if dep_vars.is_empty() {
        return Err("No dependent variables found for Levene's test".to_string());
    }

    // Build design string (for reporting purposes, not directly for calculation here)
    let mut design_string = if config.model.intercept {
        "Design: Intercept".to_string()
    } else {
        "Design: ".to_string()
    };

    if let Some(covariates) = &config.main.covar {
        for covariate in covariates {
            design_string.push_str(" + ");
            design_string.push_str(covariate);
        }
    }

    let fix_factors = config.main.fix_factor.clone().unwrap_or_default();

    for factor in &fix_factors {
        design_string.push_str(" + ");
        design_string.push_str(factor);
    }
    if fix_factors.len() > 1 && config.model.term_text.is_none() {
        design_string.push_str(" + Interactions involving fixed factors");
    }
    if let Some(term_text) = &config.model.term_text {
        for term in term_text.split('+') {
            let trimmed = term.trim();
            if trimmed.contains('*') {
                design_string.push_str(" + ");
                design_string.push_str(trimmed);
            }
        }
    }

    let mut factor_source_indices: HashMap<String, usize> = HashMap::new();
    if !fix_factors.is_empty() {
        for (def_group_idx, def_group) in data.fix_factor_data_defs.iter().enumerate() {
            if data.fix_factor_data.get(def_group_idx).is_some() {
                for factor_def in def_group {
                    if fix_factors.contains(&factor_def.name) {
                        factor_source_indices.insert(factor_def.name.clone(), def_group_idx);
                    }
                }
            }
        }
    }

    let results: Vec<LeveneTest> = dep_vars
        .into_par_iter()
        .filter_map(|dep_var_name| {
            let mut grouped_data_map: HashMap<String, Vec<f64>> = HashMap::new();

            if data.dependent_data.is_empty() || data.dependent_data[0].is_empty() {
                return None;
            }

            let num_cases = data.dependent_data[0].len();

            // Conditional data preparation for Levene's test
            let data_for_levene: Vec<f64>;
            let mut original_indices_for_grouping: Vec<usize>; // Will hold original case indices for the data being grouped

            if
                config.main.covar.is_none() ||
                config.main.covar.as_ref().map_or(true, |c| c.is_empty())
            {
                // NO COVARIATES: Use raw dependent variable values directly
                let mut raw_values = Vec::with_capacity(num_cases);
                let mut temp_original_indices = Vec::with_capacity(num_cases);
                for case_idx in 0..num_cases {
                    // Assuming data.dependent_data[0] exists and has `num_cases` elements from earlier checks
                    if
                        let Some(dep_val) = extract_numeric_from_record(
                            &data.dependent_data[0][case_idx],
                            &dep_var_name
                        )
                    {
                        raw_values.push(dep_val);
                        temp_original_indices.push(case_idx); // Original index is just case_idx
                    }
                }
                data_for_levene = raw_values;
                original_indices_for_grouping = temp_original_indices;
                if data_for_levene.is_empty() {
                    return None;
                }
            } else {
                // COVARIATES PRESENT: Calculate residuals from ANCOVA model
                match get_residuals_for_levene_ancova(&dep_var_name, data, config) {
                    Ok(Some((residuals, anova_case_indices))) => {
                        data_for_levene = residuals;
                        original_indices_for_grouping = anova_case_indices;
                        if data_for_levene.is_empty() {
                            return None;
                        }
                        if data_for_levene.len() != original_indices_for_grouping.len() {
                            return None; // Critical error
                        }
                    }
                    Ok(None) => {
                        return None;
                    }
                    Err(e) => {
                        return None;
                    }
                }
            }

            // Now, group data_for_levene by fixed factors
            // The num_effective_cases_for_levene should guide the iteration if residuals are used
            // This grouping logic needs to be careful about case alignment if residuals length < original num_cases.
            // For now, the grouping loop iterates up to num_effective_cases_for_levene, assuming data_for_levene[i] corresponds to original factors of case i (IF NO FILTERING in create_design_response_weights).

            for (idx_in_data_for_levene, &original_case_idx) in original_indices_for_grouping
                .iter()
                .enumerate() {
                let value_to_group = data_for_levene[idx_in_data_for_levene];
                let mut group_key_parts: Vec<String> = Vec::with_capacity(fix_factors.len());
                let mut skip_case_due_to_missing_factor = false;

                if fix_factors.is_empty() {
                    // No factors, key will be "__OVERALL__"
                } else {
                    for factor_name in &fix_factors {
                        match factor_source_indices.get(factor_name) {
                            Some(source_idx) => {
                                match data.fix_factor_data.get(*source_idx) {
                                    Some(factor_data_records) => {
                                        match factor_data_records.get(original_case_idx) {
                                            // Use original_case_idx here
                                            Some(factor_record) => {
                                                match factor_record.values.get(factor_name) {
                                                    Some(factor_val_enum) => {
                                                        group_key_parts.push(
                                                            format!(
                                                                "{}={}",
                                                                factor_name,
                                                                data_value_to_string(
                                                                    factor_val_enum
                                                                )
                                                            )
                                                        );
                                                    }
                                                    None => {
                                                        skip_case_due_to_missing_factor = true;
                                                        break;
                                                    }
                                                }
                                            }
                                            None => {
                                                skip_case_due_to_missing_factor = true;
                                                break;
                                            }
                                        }
                                    }
                                    None => {
                                        skip_case_due_to_missing_factor = true;
                                        break;
                                    }
                                }
                            }
                            None => {
                                skip_case_due_to_missing_factor = true;
                                break;
                            }
                        }
                    }
                }

                if skip_case_due_to_missing_factor {
                    continue;
                }

                let group_key = if group_key_parts.is_empty() {
                    "__OVERALL__".to_string()
                } else {
                    group_key_parts.sort();
                    group_key_parts.join(".")
                };
                grouped_data_map.entry(group_key).or_default().push(value_to_group);
            }

            if grouped_data_map.is_empty() {
                if num_cases > 0 {
                } else {
                }
                return None; // No groups to analyze
            }

            let groups: Vec<Vec<f64>>;
            let num_groups_for_df1: usize;

            if
                config.main.covar.is_none() ||
                config.main.covar.as_ref().map_or(true, |c| c.is_empty())
            {
                // NO COVARIATES: Filter out groups with N <= 1 observation
                let original_group_count = grouped_data_map.len();
                let filtered_grouped_data_map: HashMap<String, Vec<f64>> = grouped_data_map
                    .into_iter()
                    .filter(|(key, values)| {
                        if values.len() <= 1 { false } else { true }
                    })
                    .collect();

                if filtered_grouped_data_map.is_empty() {
                    return None;
                }
                groups = filtered_grouped_data_map.values().cloned().collect();
                num_groups_for_df1 = groups.len();
            } else {
                // COVARIATES PRESENT: Use all groups from fixed factors, do NOT filter N<=1 for df calculation, as per SPSS behavior with covariates.
                groups = grouped_data_map.values().cloned().collect();
                num_groups_for_df1 = groups.len(); // Should be 12 in your example dataset
            }

            // df1 is based on num_groups_for_df1 (which might be different from groups.len() if we were to filter groups *after* this for some reason)
            // However, calculate_levene_anova itself uses groups.len() for its internal df1.
            // The key is that the `groups` variable passed to calculate_levene_anova is now correctly formed.

            // Skip if not enough groups for analysis (applies to either filtered or unfiltered group set)
            if num_groups_for_df1 < 2 {
                return None;
            }

            let mut levene_entries: Vec<LeveneTestEntry> = Vec::new();

            if
                config.main.covar.is_none() ||
                config.main.covar.as_ref().map_or(true, |c| c.is_empty())
            {
                // No covariates, calculate all four types (using potentially filtered groups)
                match calculate_levene_anova(&groups, LeveneCenter::Mean, data, config) {
                    Ok((f_mean, df1_mean, df2_mean, sig_mean)) => {
                        levene_entries.push(LeveneTestEntry {
                            function: "Based on Mean".to_string(),
                            levene_statistic: f_mean,
                            df1: df1_mean,
                            df2: df2_mean as f64,
                            significance: sig_mean,
                        });
                    }
                    Err(e) => {}
                }

                match calculate_levene_anova(&groups, LeveneCenter::Median, data, config) {
                    Ok((f_median, df1_median, df2_median, sig_median)) => {
                        levene_entries.push(LeveneTestEntry {
                            function: "Based on Median".to_string(),
                            levene_statistic: f_median,
                            df1: df1_median,
                            df2: df2_median as f64,
                            significance: sig_median,
                        });
                    }
                    Err(e) => {}
                }

                match calculate_levene_anova_adjusted_df(&groups, data, config) {
                    Ok((f_median_adj, df1_median_adj, df2_median_adj_float, sig_median_adj)) => {
                        levene_entries.push(LeveneTestEntry {
                            function: "Based on Median and with adjusted df".to_string(),
                            levene_statistic: f_median_adj,
                            df1: df1_median_adj,
                            df2: df2_median_adj_float,
                            significance: sig_median_adj,
                        });
                    }
                    Err(e) => {}
                }

                match
                    calculate_levene_anova(&groups, LeveneCenter::TrimmedMean(0.05), data, config)
                {
                    Ok((f_trimmed, df1_trimmed, df2_trimmed, sig_trimmed)) => {
                        levene_entries.push(LeveneTestEntry {
                            function: "Based on trimmed mean".to_string(),
                            levene_statistic: f_trimmed,
                            df1: df1_trimmed,
                            df2: df2_trimmed as f64,
                            significance: sig_trimmed,
                        });
                    }
                    Err(e) => {}
                }
            } else {
                // Covariates are present, calculate standard Levene's test (based on mean)
                // using ALL groups formed by fixed factors (N<=1 filter was skipped for `groups` variable in this path)
                match calculate_levene_anova(&groups, LeveneCenter::Mean, data, config) {
                    // `groups` here will have all 12 groups if covariates present
                    Ok((f_statistic, df1, df2, significance)) => {
                        levene_entries.push(LeveneTestEntry {
                            function: "Levene".to_string(), // Or "Based on Mean" as SPSS does with covariates
                            levene_statistic: f_statistic,
                            df1,
                            df2: df2 as f64,
                            significance,
                        });
                    }
                    Err(e) => {
                        return None; // If the primary Levene test fails with covariates, skip this dep_var
                    }
                }
            }

            if levene_entries.is_empty() {
                return None;
            }

            // Create result
            Some(LeveneTest {
                dependent_variable: dep_var_name,
                entries: levene_entries,
                design: design_string.clone(),
            })
        })
        .collect();

    if results.is_empty() {
        Err("No valid Levene test results could be calculated".to_string())
    } else {
        Ok(results)
    }
}

/// Enum to specify the centering method for Levene's test
#[derive(Clone, Copy, Debug)]
enum LeveneCenter {
    Mean,
    Median,
    TrimmedMean(f64), // Argument is the proportion to trim from each end
}

/// Calculate Levene test statistics
fn calculate_levene_anova(
    groups: &[Vec<f64>],
    center_method: LeveneCenter,
    original_data: &AnalysisData,
    original_config: &UnivariateConfig
) -> Result<(f64, usize, usize, f64), String> {
    if groups.iter().any(|g| g.is_empty()) || groups.len() < 2 {
        return Ok((f64::NAN, 0, 0, f64::NAN));
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
                    calculate_interpolated_trimmed_mean(group, proportion)
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
        return Ok((f64::NAN, df1, df2, f64::NAN));
    }

    let f_statistic: f64;
    if ss_within < 1e-12 {
        if ss_between < 1e-12 {
            f_statistic = 0.0; // All deviations are zero or near zero, perfect homogeneity
        } else {
            f_statistic = f64::INFINITY; // Zero within-group variance, but some between-group variance
        }
    } else {
        let ms_between = ss_between / (df1 as f64);
        let ms_within = ss_within / (df2 as f64);
        f_statistic = ms_between / ms_within;
    }

    // Calculate significance
    let significance = calculate_f_significance(df1, df2, f_statistic);

    Ok((f_statistic, df1, df2, significance))
}

// Specific function for "Based on Median and with adjusted df"
// This function will now return df2 as f64 to match LeveneTestEntry and the nature of 'v'.
fn calculate_levene_anova_adjusted_df(
    groups: &[Vec<f64>],
    original_data: &AnalysisData,
    original_config: &UnivariateConfig
) -> Result<(f64, usize, f64, f64), String> {
    // Step 1: Calculate z_id = |x_id - Median_i|
    // These are the 'abs_deviations_b' based on median.
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

    let abs_deviations_b: Vec<Vec<f64>> = groups
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

    // Step 2: Calculate F-statistic (La) using these z_id^(b) values.
    // We can use the existing calculate_levene_anova logic for this, passing LeveneCenter::Median.
    // Note: calculate_levene_anova internally calculates its own abs_deviations based on the center_method.
    // So, it will re-calculate what we did in abs_deviations_b if we pass LeveneCenter::Median.
    // This is slightly redundant but reuses existing validated code for F-statistic calculation.
    let (f_stat, df1, _df2_unadjusted, _sig_unadjusted) = calculate_levene_anova(
        groups,
        LeveneCenter::Median,
        original_data,
        original_config
    )?;

    if df1 == 0 || groups.iter().all(|g| g.len() <= 1) {
        // Not enough groups or not enough data within groups for adjusted df calculation
        return Ok((f_stat, df1, _df2_unadjusted as f64, _sig_unadjusted));
    }

    // Step 3: Calculate adjusted df2 (v)
    let k = groups.len();
    let mut u_values: Vec<f64> = Vec::with_capacity(k);
    let mut v_i_values: Vec<f64> = Vec::with_capacity(k); // m_i - 1

    for i in 0..k {
        let z_values_group_i = &abs_deviations_b[i];
        let m_i = z_values_group_i.len();

        if m_i == 0 {
            // Should not happen if groups with 0 elements are filtered earlier, but as a safeguard
            u_values.push(0.0);
            v_i_values.push(0.0);
            continue;
        }

        let z_bar_i_b = z_values_group_i.mean(); // Mean of |x_id - Median_i| for group i
        let u_i = z_values_group_i
            .iter()
            .map(|z| (z - z_bar_i_b).powi(2))
            .sum::<f64>();
        u_values.push(u_i);
        v_i_values.push(m_i.saturating_sub(1) as f64); // m_i - 1, ensure non-negative
    }

    let sum_u_i: f64 = u_values.iter().sum();
    let sum_u_i_sq_over_v_i: f64 = u_values
        .iter()
        .zip(v_i_values.iter())
        .map(|(&ui, &vi)| {
            if vi == 0.0 {
                if ui == 0.0 {
                    0.0
                } else {
                    f64::NAN
                } // u_i^2 / 0 where u_i != 0 leads to Inf or error. If u_i=0, term is 0.
            } else {
                ui.powi(2) / vi
            }
        })
        .sum();

    let df2_adjusted: f64;
    if sum_u_i_sq_over_v_i.is_nan() {
        df2_adjusted = f64::NAN;
    } else if sum_u_i_sq_over_v_i == 0.0 {
        if sum_u_i == 0.0 {
            // This case implies all u_i are 0. All within-group variances of z_ij are 0.
            // df2 becomes 0/0. Use unadjusted df2 or a sensible default like N-k.
            df2_adjusted = _df2_unadjusted as f64; // Fallback or specific handling
        } else {
            // (non-zero)^2 / 0 -> Inf.
            df2_adjusted = f64::INFINITY;
        }
    } else {
        df2_adjusted = sum_u_i.powi(2) / sum_u_i_sq_over_v_i;
    }

    // Step 4: Calculate significance using F(df1, df2_adjusted)
    let significance_adj;
    if
        f_stat.is_nan() ||
        df1 == 0 ||
        df2_adjusted.is_nan() ||
        df2_adjusted <= 0.0 ||
        df2_adjusted.is_infinite()
    {
        significance_adj = f64::NAN;
    } else {
        // Using statrs directly for f64 df.
        match statrs::distribution::FisherSnedecor::new(df1 as f64, df2_adjusted) {
            Ok(dist) => {
                significance_adj = 1.0 - dist.cdf(f_stat);
            }
            Err(e) => {
                significance_adj = f64::NAN;
            }
        }
    }

    Ok((f_stat, df1, df2_adjusted, significance_adj))
}

fn calculate_interpolated_trimmed_mean(group: &[f64], proportion_alpha: f64) -> f64 {
    if group.is_empty() {
        return 0.0;
    }

    let n_float = group.len() as f64;
    if n_float == 0.0 {
        // Should be caught by is_empty, but as a safeguard
        return 0.0;
    }

    // Data must be sorted for trimming
    let mut sorted_group = group.to_vec();
    sorted_group.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    let trim_target_count_float = proportion_alpha * n_float; // e.g., 0.05 * n
    let g = trim_target_count_float.floor(); // Number of observations to completely trim from one end
    let g_usize = g as usize;
    let fraction = trim_target_count_float - g; // Fractional part

    // Check if trimming is too aggressive (e.g., would remove all data)
    // n_float - 2.0 * g must be > 0 for the sum of central elements if frac=0
    let effective_n_for_denominator = n_float * (1.0 - 2.0 * proportion_alpha);
    if effective_n_for_denominator < 1e-9 {
        // Effectively asking to trim everything or almost everything
        return group.mean(); // Fallback to simple mean of the original group
    }

    if group.len() <= 2 * g_usize {
        // If g would trim everything or overlap
        // This happens if, e.g. n=3, alpha=0.05 -> tc=0.15, g=0. frac=0.15. len=3, 2*g_usize=0. Ok.
        // e.g. n=3, alpha=0.4 -> tc=1.2, g=1. frac=0.2. len=3, 2*g_usize=2. sorted_group[g] is sorted[1]. sorted[n-1-g] is sorted[1].
        // This case (n <= 2g) means the "central sum" part is empty or negative, relies only on boundary.
        // Or if n is very small, like 1 or 2.
        if group.len() == 1 {
            return sorted_group[0];
        }
        // If n is small, the logic below should still work if indices are handled.
        // The original SPSS formula might have specific fallbacks for very small N.
        // Standard approach often falls back to median or mean for very small N where trimming is ill-defined.
        // For now, let the main logic attempt, with index guards.
    }

    let mut weighted_sum = 0.0;

    // Sum of fully included central elements
    // These are from index g_usize + 1 to n - 1 - (g_usize + 1) = n - g_usize - 2
    let central_sum_start_idx = g_usize + 1;
    let central_sum_end_idx = if group.len() > g_usize + 1 {
        // ensure n-g-2 is not negative
        group.len() - g_usize - 2
    } else {
        central_sum_start_idx - 1 // make loop empty if no central elements
    };

    if central_sum_start_idx <= central_sum_end_idx && central_sum_end_idx < group.len() {
        for i in central_sum_start_idx..=central_sum_end_idx {
            weighted_sum += sorted_group[i]; // These get full weight of 1
        }
    }

    // Add weighted boundary values
    // Lower boundary: sorted_group[g_usize]
    // Upper boundary: sorted_group[group.len() - 1 - g_usize]
    if fraction == 0.0 {
        // If tc is an integer, g elements are trimmed, next g_usize gets full weight
        if g_usize < group.len() {
            weighted_sum += sorted_group[g_usize]; // This is X_(g+1)
        }
        if
            g_usize != group.len() - 1 - g_usize &&
            group.len() - 1 - g_usize < group.len() &&
            g_usize < group.len() - 1 - g_usize
        {
            // Avoid double counting if only one element left, ensure valid index
            weighted_sum += sorted_group[group.len() - 1 - g_usize]; // This is X_(n-g)
        }
    } else {
        // Fractional trimming, boundary elements get partial weights (1-fraction)
        if g_usize < group.len() {
            // Lower boundary element y[g]
            weighted_sum += (1.0 - fraction) * sorted_group[g_usize];
        }

        // Check if upper boundary is distinct from lower boundary
        let upper_boundary_idx = group.len() - 1 - g_usize;
        if g_usize < upper_boundary_idx && upper_boundary_idx < group.len() {
            // Upper boundary element y[n-1-g]
            weighted_sum += (1.0 - fraction) * sorted_group[upper_boundary_idx];
        } else if g_usize == upper_boundary_idx && g_usize < group.len() {
            // This case means only one element is considered for boundary weighting (e.g. n=1, g=0, frac>0)
            // or n=2, g=0, frac>0. Or n=3, g=1 (tc=1.x). y[1] is middle.
            // If g_usize == upper_boundary_idx, it means sorted_group[g_usize] is the only one.
            // It already got (1-fraction) * sorted_group[g_usize]. It should not get more.
            // The sum of weights should be (1-2*alpha)*N.
            // If N=1, alpha=0.05, tc=0.05, g=0, frac=0.05. Sum = (1-0.05)*y[0]. Denom = 1*(1-0.1)=0.9. Result y[0]/0.9 (wrong).
            // This part of the logic is tricky. The denominator 0.9W implies the sum in {} is the sum of W values scaled.
            // The sum of weights for weighted_sum should be effective_n_for_denominator.
            // Current weights added: (1-f) + (1-f) + (n-2g-2) = 2-2f + n-2g-2 = n - 2(g+f) = n - 2*tc = effective_n_for_denominator. This seems right.
        }
    }

    let result = weighted_sum / effective_n_for_denominator;
    result
}

/// Helper function to calculate residuals from a model including covariates and factors.
/// Returns a tuple of (residuals, original_case_indices_used_in_model) if successful.
fn get_residuals_for_levene_ancova(
    dep_var_name: &str,
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<Option<(Vec<f64>, Vec<usize>)>, String> {
    let mut temp_config = config.clone();
    temp_config.main.dep_var = Some(dep_var_name.to_string());

    if temp_config.main.covar.is_none() || temp_config.main.covar.as_ref().unwrap().is_empty() {
        return Ok(None);
    }

    match create_design_response_weights(data, &temp_config) {
        Ok(design_info) => {
            if design_info.n_samples == 0 || design_info.p_parameters == 0 {
                return Ok(None);
            }

            match create_cross_product_matrix(&design_info) {
                Ok(ztwz_matrix) => {
                    match perform_sweep_and_extract_results(&ztwz_matrix, design_info.p_parameters) {
                        Ok(swept_info) => {
                            let beta_hat = &swept_info.beta_hat;
                            if design_info.x.ncols() != beta_hat.len() {
                                return Err("X cols and beta_hat length mismatch.".to_string());
                            }

                            let y_hat = &design_info.x * beta_hat;
                            let residuals_dvector = &design_info.y - y_hat;
                            let residuals_vec: Vec<f64> = residuals_dvector
                                .iter()
                                .cloned()
                                .collect();

                            Ok(Some((residuals_vec, design_info.case_indices_to_keep)))
                        }
                        Err(e) => Err(format!("Error in sweep for residuals: {}", e)),
                    }
                }
                Err(e) => Err(format!("Error creating ZTWZ for residuals: {}", e)),
            }
        }
        Err(e) => Err(format!("Error creating design matrix for residuals: {}", e)),
    }
}
