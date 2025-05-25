use statrs::distribution::ContinuousCDF;
use rayon::prelude::*;
use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ LeveneTest, LeveneTestEntry },
};

use super::core::*;

/// Enum to specify the centering method for Levene's test
#[derive(Clone, Copy, Debug)]
enum LeveneCenter {
    Mean,
    Median,
    TrimmedMean(f64), // Argument is the proportion to trim from each end
}

/// Calculate Levene's Test for homogeneity of variances if requested
pub fn calculate_levene_test(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<Vec<LeveneTest>, String> {
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

    let design_string = generate_design_string(config);

    let results: Vec<LeveneTest> = dep_vars
        .into_par_iter()
        .filter_map(|dep_var_name| {
            // Create design matrix for the dependent variable
            let mut temp_config = config.clone();
            temp_config.main.dep_var = Some(dep_var_name.clone());
            let design_info = match create_design_response_weights(data, &temp_config) {
                Ok(info) => info,
                Err(_) => {
                    return None;
                }
            };

            // Get data for Levene test
            let (data_for_levene, indices) = if
                config.main.covar.is_none() ||
                config.main.covar.as_ref().map_or(true, |c| c.is_empty())
            {
                // If no covariates, use raw dependent variable values
                (design_info.y.as_slice().to_vec(), design_info.case_indices_to_keep.clone())
            } else {
                // If covariates exist, calculate residuals
                let ztwz_matrix = match create_cross_product_matrix(&design_info) {
                    Ok(matrix) => matrix,
                    Err(_) => {
                        return None;
                    }
                };
                let swept_info = match
                    perform_sweep_and_extract_results(&ztwz_matrix, design_info.p_parameters)
                {
                    Ok(info) => info,
                    Err(_) => {
                        return None;
                    }
                };
                let y_hat = &design_info.x * &swept_info.beta_hat;
                let residuals = &design_info.y - y_hat;
                (residuals.as_slice().to_vec(), design_info.case_indices_to_keep.clone())
            };

            let groups = create_groups_from_design_matrix(&design_info, &data_for_levene, &indices);
            if groups.is_empty() {
                return None;
            }

            let levene_entries = calculate_levene_entries(&groups, data, config)?;
            if levene_entries.is_empty() {
                return None;
            }

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

pub fn calculate_levene_entries(
    groups: &[Vec<f64>],
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Option<Vec<LeveneTestEntry>> {
    let mut entries = Vec::new();
    let has_no_covariates =
        config.main.covar.is_none() || config.main.covar.as_ref().map_or(true, |c| c.is_empty());

    if has_no_covariates {
        // Calculate all four types
        if let Ok((f, df1, df2, sig)) = calculate_levene_anova(groups, LeveneCenter::Mean) {
            entries.push(LeveneTestEntry {
                function: "Based on Mean".to_string(),
                levene_statistic: f,
                df1,
                df2: df2 as f64,
                significance: sig,
            });
        }

        if let Ok((f, df1, df2, sig)) = calculate_levene_anova(groups, LeveneCenter::Median) {
            entries.push(LeveneTestEntry {
                function: "Based on Median".to_string(),
                levene_statistic: f,
                df1,
                df2: df2 as f64,
                significance: sig,
            });
        }

        if let Ok((f, df1, df2, sig)) = calculate_levene_anova_adjusted_df(groups, data, config) {
            entries.push(LeveneTestEntry {
                function: "Based on Median and with adjusted df".to_string(),
                levene_statistic: f,
                df1,
                df2,
                significance: sig,
            });
        }

        if
            let Ok((f, df1, df2, sig)) = calculate_levene_anova(
                groups,
                LeveneCenter::TrimmedMean(0.05)
            )
        {
            entries.push(LeveneTestEntry {
                function: "Based on trimmed mean".to_string(),
                levene_statistic: f,
                df1,
                df2: df2 as f64,
                significance: sig,
            });
        }
    } else {
        // Calculate only standard Levene's test
        if let Ok((f, df1, df2, sig)) = calculate_levene_anova(groups, LeveneCenter::Mean) {
            entries.push(LeveneTestEntry {
                function: "Levene".to_string(),
                levene_statistic: f,
                df1,
                df2: df2 as f64,
                significance: sig,
            });
        }
    }

    if entries.is_empty() {
        None
    } else {
        Some(entries)
    }
}

/// Calculate Levene test statistics
fn calculate_levene_anova(
    groups: &[Vec<f64>],
    center_method: LeveneCenter
) -> Result<(f64, usize, usize, f64), String> {
    if groups.iter().any(|g| g.is_empty()) || groups.len() < 2 {
        return Ok((f64::NAN, 0, 0, f64::NAN));
    }

    // Calculate group centers (mean, median, or trimmed mean)
    let group_centers: Vec<f64> = groups
        .iter()
        .map(|group| {
            match center_method {
                LeveneCenter::Mean => calculate_mean(group),
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
    let overall_mean = calculate_mean(&all_deviations);

    // Calculate sum of squares between groups
    let ss_between = abs_deviations
        .iter()
        .enumerate()
        .map(|(i, group)| {
            let group_mean = calculate_mean(group);
            let group_size = groups[i].len() as f64;
            group_size * (group_mean - overall_mean).powi(2)
        })
        .sum::<f64>();

    // Calculate sum of squares within groups
    let ss_within = abs_deviations
        .iter()
        .enumerate()
        .map(|(_i, group)| {
            let group_mean = calculate_mean(group);
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

    // Calculate significance using the utility function
    let significance = calculate_f_significance(df1, df2, f_statistic);

    Ok((f_statistic, df1, df2, significance))
}

// Specific function for "Based on Median and with adjusted df"
pub fn calculate_levene_anova_adjusted_df(
    groups: &[Vec<f64>],
    _original_data: &AnalysisData,
    _original_config: &UnivariateConfig
) -> Result<(f64, usize, f64, f64), String> {
    // Step 1: Calculate z_id = |x_id - Median_i|
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

    // Step 2: Calculate F-statistic using existing function
    let (f_stat, df1, df2_unadjusted, sig_unadjusted) = calculate_levene_anova(
        groups,
        LeveneCenter::Median
    )?;

    if df1 == 0 || groups.iter().all(|g| g.len() <= 1) {
        return Ok((f_stat, df1, df2_unadjusted as f64, sig_unadjusted));
    }

    // Step 3: Calculate adjusted df2 (v)
    let k = groups.len();
    let mut u_values: Vec<f64> = Vec::with_capacity(k);
    let mut v_i_values: Vec<f64> = Vec::with_capacity(k);

    for i in 0..k {
        let z_values_group_i = &abs_deviations_b[i];
        let m_i = z_values_group_i.len();

        if m_i == 0 {
            u_values.push(0.0);
            v_i_values.push(0.0);
            continue;
        }

        let z_bar_i_b = calculate_mean(z_values_group_i);
        let u_i = z_values_group_i
            .iter()
            .map(|z| (z - z_bar_i_b).powi(2))
            .sum::<f64>();
        u_values.push(u_i);
        v_i_values.push(m_i.saturating_sub(1) as f64);
    }

    let sum_u_i: f64 = u_values.iter().sum();
    let sum_u_i_sq_over_v_i: f64 = u_values
        .iter()
        .zip(v_i_values.iter())
        .map(|(&ui, &vi)| {
            if vi == 0.0 {
                if ui == 0.0 { 0.0 } else { f64::NAN }
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
            df2_adjusted = df2_unadjusted as f64;
        } else {
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
        match statrs::distribution::FisherSnedecor::new(df1 as f64, df2_adjusted) {
            Ok(dist) => {
                significance_adj = 1.0 - dist.cdf(f_stat);
            }
            Err(_) => {
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
        return 0.0;
    }

    // Data must be sorted for trimming
    let mut sorted_group = group.to_vec();
    sorted_group.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    let trim_target_count_float = proportion_alpha * n_float;
    let g = trim_target_count_float.floor();
    let g_usize = g as usize;
    let fraction = trim_target_count_float - g;

    // Check if trimming is too aggressive
    let effective_n_for_denominator = n_float * (1.0 - 2.0 * proportion_alpha);
    if effective_n_for_denominator < 1e-9 {
        return calculate_mean(group);
    }

    if group.len() <= 2 * g_usize {
        if group.len() == 1 {
            return sorted_group[0];
        }
    }

    let mut weighted_sum = 0.0;

    // Sum of fully included central elements
    let central_sum_start_idx = g_usize + 1;
    let central_sum_end_idx = if group.len() > g_usize + 1 {
        group.len() - g_usize - 2
    } else {
        central_sum_start_idx - 1
    };

    if central_sum_start_idx <= central_sum_end_idx && central_sum_end_idx < group.len() {
        for i in central_sum_start_idx..=central_sum_end_idx {
            weighted_sum += sorted_group[i];
        }
    }

    // Add weighted boundary values
    if fraction == 0.0 {
        if g_usize < group.len() {
            weighted_sum += sorted_group[g_usize];
        }
        if
            g_usize != group.len() - 1 - g_usize &&
            group.len() - 1 - g_usize < group.len() &&
            g_usize < group.len() - 1 - g_usize
        {
            weighted_sum += sorted_group[group.len() - 1 - g_usize];
        }
    } else {
        if g_usize < group.len() {
            weighted_sum += (1.0 - fraction) * sorted_group[g_usize];
        }

        let upper_boundary_idx = group.len() - 1 - g_usize;
        if g_usize < upper_boundary_idx && upper_boundary_idx < group.len() {
            weighted_sum += (1.0 - fraction) * sorted_group[upper_boundary_idx];
        }
    }

    weighted_sum / effective_n_for_denominator
}
