use std::collections::HashMap;
use crate::univariate::models::{
    config::{ CategoryMethod, UnivariateConfig },
    data::AnalysisData,
    result::{ ConfidenceInterval, ParameterEstimateEntry },
};

use super::core::*;

/// Get values for a specific factor level
fn get_level_values(
    data: &AnalysisData,
    factor: &str,
    level: &str,
    dep_var: &str
) -> Result<Vec<f64>, String> {
    let mut values = Vec::new();
    // Assuming dependent data is in the first group for simplicity
    if let Some(dependent_records) = data.dependent_data.get(0) {
        for record in dependent_records {
            if let Some(value) = record.values.get(factor) {
                if data_value_to_string(value) == level {
                    if let Some(dep_val) = extract_numeric_from_record(record, dep_var) {
                        values.push(dep_val);
                    }
                }
            }
        }
    }
    Ok(values)
}

/// Calculate level statistics (mean, variance, etc.)
fn calculate_level_statistics(
    data: &AnalysisData,
    factor: &str,
    level: &str,
    dep_var: &str
) -> Result<(String, Vec<f64>, f64, f64), String> {
    let values = get_level_values(data, factor, level, dep_var)?;
    if values.is_empty() {
        // Variance of a single point is undefined, return 0.0 or NaN depending on desired behavior for empty/single point data
        // Returning 0.0 for variance of empty set.
        return Ok((level.to_string(), values, 0.0, 0.0));
    }
    let mean = calculate_mean(&values);
    // Calculate sample variance (n-1 denominator)
    let variance =
        values
            .iter()
            .map(|x| (x - mean).powi(2))
            .sum::<f64>() / ((values.len() - 1).max(1) as f64); // Ensure denominator is at least 1 for single point
    Ok((level.to_string(), values, mean, variance))
}

/// Calculate pooled statistics across levels
fn calculate_pooled_statistics(
    level_data: &[(String, Vec<f64>, f64, f64)]
) -> (f64, f64, f64, f64) {
    let total_n: usize = level_data
        .iter()
        .map(|(_, values, _, _)| values.len())
        .sum();

    let grand_mean: f64 = if total_n == 0 {
        0.0
    } else {
        level_data
            .iter()
            .map(|(_, values, mean, _)| (values.len() as f64) * mean)
            .sum::<f64>() / (total_n as f64)
    };

    // Pooled variance (MSE) calculation requires at least 2 levels with data and total_n > num_levels
    let num_levels_with_data = level_data.len();
    let pooled_variance = if total_n > num_levels_with_data && num_levels_with_data > 1 {
        level_data
            .iter()
            .map(|(_, values, _, variance)| ((values.len() - 1) as f64) * variance)
            .sum::<f64>() / ((total_n - num_levels_with_data) as f64)
    } else {
        0.0 // Or NaN, depending on desired behavior
    };

    let s_pp = f64::sqrt(pooled_variance);
    let n_h = if level_data.is_empty() {
        0.0
    } else {
        (level_data.len() as f64) /
            level_data
                .iter()
                .filter(|(_, values, _, _)| !values.is_empty())
                .map(|(_, values, _, _)| 1.0 / (values.len() as f64))
                .sum::<f64>()
    };

    (grand_mean, pooled_variance, s_pp, n_h)
}

/// Calculate test-specific statistics for a pairwise comparison
fn calculate_test_statistics(
    level_data: &[(String, Vec<f64>, f64, f64)],
    i: usize,
    j: usize,
    grand_mean: f64,
    s_pp: f64
) -> (f64, f64, f64, f64, f64, f64) {
    // Added n_i and n_j to return
    let (_, values_i, mean_i, _var_i) = &level_data[i];
    let (_, values_j, mean_j, _var_j) = &level_data[j];

    let n_i = values_i.len() as f64;
    let n_j = values_j.len() as f64;
    let mean_diff = mean_i - mean_j;
    let r = (j - i) as f64; // Number of steps between means

    // Q_i,j definition from documentation
    let q_i_j = s_pp * f64::sqrt((1.0 / n_i + 1.0 / n_j) / 2.0);

    // Deviation from grand mean for effect size calculation
    let grand_mean_effect = (mean_i - grand_mean).powi(2) + (mean_j - grand_mean).powi(2);

    (mean_diff, r, q_i_j, grand_mean_effect, n_i, n_j) // Return n_i, n_j
}

/// Calculate standard error and degrees of freedom for a pairwise comparison
fn calculate_std_error_and_df(
    level_data: &[(String, Vec<f64>, f64, f64)],
    i: usize,
    j: usize,
    config: &UnivariateConfig,
    pooled_variance: f64,
    total_n: usize
) -> (f64, usize) {
    let (_, values_i, _, _var_i) = &level_data[i];
    let (_, values_j, _, _var_j) = &level_data[j];
    let n_i = values_i.len() as f64;
    let n_j = values_j.len() as f64;
    let num_levels_with_data = level_data.len();

    if config.posthoc.tam || config.posthoc.dunt || config.posthoc.games || config.posthoc.dunc {
        // For unequal variance tests (Tamhane's T2, Dunnett's T3, Games-Howell, Dunnett's C)
        // Standard error is sqrt(s_i^2/n_i + s_j^2/n_j)
        let std_error = f64::sqrt(_var_i / n_i + _var_j / n_j);

        // Calculate df using Welch-Satterthwaite equation
        let numerator = (_var_i / n_i + _var_j / n_j).powi(2);
        let denominator = if n_i > 1.0 && n_j > 1.0 {
            (_var_i / n_i).powi(2) / (n_i - 1.0) + (_var_j / n_j).powi(2) / (n_j - 1.0)
        } else if n_i > 1.0 {
            (_var_i / n_i).powi(2) / (n_i - 1.0)
        } else if n_j > 1.0 {
            (_var_j / n_j).powi(2) / (n_j - 1.0)
        } else {
            // Handle cases with n=1 for one or both groups - df is typically 0 or 1
            // For n=1, variance is often undefined or 0 depending on calculation.
            // If variance is 0, denominator becomes 0. Set df to 0 or a small number.
            // Let's return a small df like 1 if possible, otherwise 0.
            if n_i + n_j > 0.0 {
                1.0
            } else {
                0.0
            }
        };

        let df_value = if denominator.abs() > 1e-9 { numerator / denominator } else { 1.0 }; // Avoid division by zero
        let df = df_value.round() as usize;

        (std_error, df.max(1)) // Ensure df is at least 1
    } else {
        // For equal variance tests
        let ms_error = pooled_variance;
        let std_error = f64::sqrt(ms_error * (1.0 / n_i + 1.0 / n_j));
        let df = total_n - num_levels_with_data;
        (std_error, df.max(1)) // Ensure df is at least 1
    }
}

/// Calculate adjusted significance based on test type
fn calculate_adjusted_significance(
    t_value: f64,
    df: usize,
    config: &UnivariateConfig,
    k_star: usize,
    r: f64,
    alpha: f64,
    i: usize,
    j: usize,
    ref_index: usize,
    mean_diff: f64,
    n_i: f64,
    n_j: f64,
    s_pp: f64,
    var_i: f64,
    var_j: f64
) -> (f64, &'static str) {
    let t_abs = t_value.abs();
    let significance = calculate_t_significance(t_value, df);
    let k = config.posthoc.fix_factor_vars.as_ref().map_or(0, |v| v.len()); // Number of levels

    match () {
        _ if config.posthoc.lsd => (significance, "LSD"),
        _ if config.posthoc.bonfe => ((significance * (k_star as f64)).min(1.0), "Bonferroni"),
        _ if config.posthoc.sidak =>
            (1.0 - (1.0 - significance).powf(1.0 / (k_star as f64)), "Sidak"),
        _ if config.posthoc.scheffe => {
            // Formula from documentation: sqrt(2*(k-1)*F_{1-alpha}(k-1,f))
            // The significance calculation in the original code seems to be based on F. Let's stick to that.
            let f_value = t_value.powi(2);
            // Use k-1 and df for F-distribution
            let adjusted_significance =
                1.0 - calculate_f_significance((k.max(1) - 1) as usize, df, f_value);
            (adjusted_significance, "Scheffe")
        }
        _ if config.posthoc.tu => {
            // Tukey's HSD - uses k for all comparisons
            // This requires studentized range distribution critical values, which are not directly available.
            // The current approximation using t-distribution with adjusted alpha is a workaround.
            let adjusted_alpha = alpha / (k_star as f64);
            let t_critical = calculate_t_critical(Some(adjusted_alpha / 2.0), df);
            (if t_abs > t_critical { alpha / 2.0 } else { 1.0 - alpha / 2.0 }, "Tukey") // Return p-value based on comparison with critical t
        }
        _ if config.posthoc.tub => {
            // Tukey's b - average of SNK and HSD
            // Approximation with t-distribution
            let adjusted_alpha = alpha / (k_star as f64);
            let t_critical = calculate_t_critical(Some(adjusted_alpha / 2.0), df);
            (if t_abs > t_critical { alpha / 2.0 } else { 1.0 - alpha / 2.0 }, "Tukey's b")
        }
        _ if config.posthoc.snk => {
            // Student-Newman-Keuls - uses r (steps between means)
            // Requires studentized range critical values. Approximation with t-distribution.
            let step_adjusted_alpha = alpha / r;
            let t_critical = calculate_t_critical(Some(step_adjusted_alpha / 2.0), df);
            (
                if t_abs > t_critical {
                    step_adjusted_alpha / 2.0
                } else {
                    1.0 - step_adjusted_alpha / 2.0
                },
                "SNK",
            )
        }
        _ if config.posthoc.dun => {
            // Duncan
            // Requires Duncan's multiple range critical values. Approximation with t-distribution.
            let adjusted_alpha = 1.0 - (1.0 - alpha).powf(r - 1.0);
            let t_critical = calculate_t_critical(Some(adjusted_alpha / 2.0), df);
            (
                if t_abs > t_critical { adjusted_alpha / 2.0 } else { 1.0 - adjusted_alpha / 2.0 },
                "Duncan",
            )
        }
        _ if config.posthoc.hoc => {
            // Hochberg's GT2 - Uses studentized maximum modulus critical values. Approximation.
            let adjusted_alpha = alpha / (k_star as f64);
            let t_critical = calculate_t_critical(Some(adjusted_alpha / 2.0), df);
            (if t_abs > t_critical { alpha / 2.0 } else { 1.0 - alpha / 2.0 }, "Hochberg's GT2")
        }
        _ if config.posthoc.gabriel => {
            // Gabriel - Uses studentized maximum modulus critical values. Formula from documentation.
            // The test statistic is |mean_i - mean_j| / (s_pp * sqrt(1/(2*n_i) + 1/(2*n_j)))
            let gabriel_stat_denominator = s_pp * f64::sqrt(1.0 / (2.0 * n_i) + 1.0 / (2.0 * n_j));
            let adjusted_t = if gabriel_stat_denominator.abs() > 1e-9 {
                mean_diff.abs() / gabriel_stat_denominator
            } else {
                f64::NAN
            };
            // This requires Studentized Maximum Modulus critical values. Approximating with t-distribution.
            (calculate_t_significance(adjusted_t, df), "Gabriel")
        }
        _ if config.posthoc.regwf => {
            // Ryan-Einot-Gabriel-Welsch F - Formula from documentation.
            let gamma_r = if r < (k as f64) - 1.0 && k > 0 {
                1.0 - (1.0 - alpha).powf(r / (k as f64))
            } else {
                alpha
            };
            let f_value = t_value.powi(2);
            let adjusted_significance = 1.0 - calculate_f_significance(1, df, f_value / gamma_r);
            (adjusted_significance, "R-E-G-W F")
        }
        _ if config.posthoc.regwq => {
            // Ryan-Einot-Gabriel-Welsch Q - Formula from documentation.
            let gamma_r = if r < (k as f64) - 1.0 && k > 0 {
                1.0 - (1.0 - alpha).powf(r / (k as f64))
            } else {
                alpha
            };
            let t_critical = calculate_t_critical(Some(gamma_r / 2.0), df);
            (if t_abs > t_critical { gamma_r / 2.0 } else { 1.0 - gamma_r / 2.0 }, "R-E-G-W Q")
        }
        _ if config.posthoc.waller => {
            // Waller-Duncan - Formula from documentation requires F-ratio and specific critical values.
            // This implementation is an approximation based on the documentation's statistic structure.
            // The formula for f_crit below was likely incorrect. Using the structure from documentation.
            // t_WD = |mean_i - mean_j| / (s_pp * sqrt(2/n)) for equal n, or using n_h for unequal n.
            // The documentation is not perfectly clear on the unequal n formula with F-ratio.
            // Reverting to a simplified t-test like structure using s_pp and n_i, n_j as an approximation.
            let waller_denom = s_pp * f64::sqrt(1.0 / n_i + 1.0 / n_j); // Using s_pp and n_i, n_j for approximation
            let adjusted_t = if waller_denom.abs() > 1e-9 {
                mean_diff.abs() / waller_denom
            } else {
                f64::NAN
            };
            // This requires Waller-Duncan specific critical values. Approximating with t-distribution.
            (calculate_t_significance(adjusted_t, df), "Waller-Duncan")
        }
        _ if config.posthoc.dunnett => {
            // Dunnett
            let is_control_comparison = i == ref_index || j == ref_index;
            if !is_control_comparison {
                (1.0, "Dunnett") // Not a comparison with the control group
            } else if config.posthoc.twosided {
                (significance, "Dunnett")
            } else if config.posthoc.lt_control && mean_diff < 0.0 {
                (calculate_t_significance(t_value, df), "Dunnett") // One-sided p-value
            } else if config.posthoc.gt_control && mean_diff > 0.0 {
                (calculate_t_significance(-t_value, df), "Dunnett") // One-sided p-value
            } else {
                (1.0, "Dunnett") // Not significant in the specified one-sided direction
            }
        }
        _ if config.posthoc.tam => {
            // Tamhane's T2 - Uses Bonferroni with unequal variances (as per original code logic)
            ((significance * (k_star as f64)).min(1.0), "Tamhane's T2")
        }
        _ if config.posthoc.dunt => {
            // Dunnett's T3 - Uses studentized maximum modulus with unequal variances. Approximation.
            let adjusted_alpha = alpha / (k_star as f64);
            let adjusted_t_crit = calculate_t_critical(Some(adjusted_alpha / 2.0), df);
            (if t_abs > adjusted_t_crit { alpha / 2.0 } else { 1.0 - alpha / 2.0 }, "Dunnett's T3")
        }
        _ if config.posthoc.games => {
            // Games-Howell - Uses studentized range with unequal variances. Approximation.
            let adjusted_alpha = alpha / (k_star as f64);
            let t_critical = calculate_t_critical(Some(adjusted_alpha / 2.0), df);
            (if t_abs > t_critical { alpha / 2.0 } else { 1.0 - alpha / 2.0 }, "Games-Howell")
        }
        _ if config.posthoc.dunc => {
            // Dunnett's C - Uses Dunnett's C critical value. Approximation.
            // The formula provided in the original code was incorrect. This requires a special table.
            // Using a simplified approximation based on unequal variance t-test structure.
            let dunc_denom = f64::sqrt(var_i / n_i + var_j / n_j); // Unequal variance std error
            let adjusted_t = if dunc_denom.abs() > 1e-9 {
                mean_diff.abs() / dunc_denom
            } else {
                f64::NAN
            };
            // This requires Dunnett's C critical values. Approximating with t-distribution.
            let adjusted_alpha = alpha / (k as f64); // Simple adjustment as before
            let t_critical = calculate_t_critical(Some(adjusted_alpha / 2.0), df);
            (if adjusted_t > t_critical { alpha / 2.0 } else { 1.0 - alpha / 2.0 }, "Dunnett's C")
        }
        _ => (significance, "No Test"), // Default to no adjustment
    }
}

/// Calculate effect size and power
fn calculate_effect_size_and_power(
    t_value: f64,
    df: usize,
    config: &UnivariateConfig
) -> (f64, f64, f64) {
    let t_abs = t_value.abs();
    // Partial Eta Squared calculation based on t-value and df
    let partial_eta_squared = if config.options.est_effect_size {
        // Formula: t^2 / (t^2 + df)
        let effect_size = t_value.powi(2) / (t_value.powi(2) + (df as f64));
        // The adjustment with grand_mean_effect seems specific and not standard partial eta squared.
        // Sticking to the standard formula t^2 / (t^2 + df) for now.
        effect_size
    } else {
        // If effect size estimation is not requested, return 0.0
        0.0
    };

    // Noncentrality parameter for power calculation
    // For a t-test, noncentrality parameter is typically |mean_diff| / SE, or t_value
    // The documentation doesn't specify how to calculate this for post-hoc tests.
    // Using t_abs as a proxy, as in the original code.
    let noncent_parameter = t_abs;

    // Observed Power calculation (approximation)
    // This requires the noncentral t-distribution, which is not directly available.
    // The original code's power calculation formula 1.0 - (-noncent_parameter * 0.5).exp() is not standard.
    // Returning 0.0 for observed power if calculation is not feasible or standard formula is unavailable.
    let observed_power = if config.options.obs_power {
        0.0 // Placeholder: Requires noncentral t-distribution CDF
    } else {
        0.0
    };

    (partial_eta_squared, noncent_parameter, observed_power)
}

/// Calculate post-hoc tests based on the configuration
pub fn calculate_posthoc_tests(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HashMap<String, Vec<ParameterEstimateEntry>>, String> {
    let dep_var_name = config.main.dep_var
        .as_ref()
        .ok_or_else(|| "No dependent variable specified in configuration".to_string())?;

    let mut result = HashMap::new();
    let factors_to_process = if let Some(factors) = &config.posthoc.fix_factor_vars {
        factors.clone()
    } else {
        Vec::new()
    };

    if factors_to_process.is_empty() {
        return Err("No factors specified for post-hoc tests".to_string());
    }

    for factor in &factors_to_process {
        let mut factor_results = Vec::new();
        let factor_levels = get_factor_levels(data, factor)?;

        if factor_levels.len() < 2 {
            continue;
        }

        let ref_index = match config.posthoc.category_method {
            CategoryMethod::First => 0,
            CategoryMethod::Last => factor_levels.len() - 1,
        };

        let mut level_data = Vec::new();
        for level in &factor_levels {
            let stats = calculate_level_statistics(data, factor, level, &dep_var_name)?;
            if !stats.1.is_empty() {
                level_data.push(stats);
            }
        }

        if level_data.len() < 2 {
            continue;
        }

        let (grand_mean, pooled_variance, s_pp, _n_h) = calculate_pooled_statistics(&level_data);
        let total_n: usize = level_data
            .iter()
            .map(|(_, values, _, _)| values.len())
            .sum();
        let k_star = (level_data.len() * (level_data.len() - 1)) / 2; // k* = k(k-1)/2 where k is number of levels with data
        let alpha = config.options.sig_level;

        for i in 0..level_data.len() {
            for j in i + 1..level_data.len() {
                // Skip if testing with Dunnett and neither is reference level
                if config.posthoc.dunnett && i != ref_index && j != ref_index {
                    continue;
                }

                let (mean_diff, r, _q_i_j, grand_mean_effect, n_i, n_j) = calculate_test_statistics(
                    &level_data,
                    i,
                    j,
                    grand_mean,
                    s_pp
                );

                let (std_error, df) = calculate_std_error_and_df(
                    &level_data,
                    i,
                    j,
                    config,
                    pooled_variance,
                    total_n
                );

                let t_value = if std_error.abs() > 1e-9 { mean_diff / std_error } else { f64::NAN }; // Avoid division by zero

                let (adjusted_significance, test_name) = calculate_adjusted_significance(
                    t_value,
                    df,
                    config,
                    k_star,
                    r,
                    alpha,
                    i,
                    j,
                    ref_index,
                    mean_diff,
                    n_i,
                    n_j,
                    s_pp,
                    level_data[i].3,
                    level_data[j].3
                );

                let (partial_eta_squared, noncent_parameter, observed_power) =
                    calculate_effect_size_and_power(t_value, df, config);

                // Calculate confidence interval only if std_error is not zero/NaN and t_value is not NaN
                let confidence_interval = if std_error.abs() > 1e-9 && t_value.is_finite() {
                    let t_critical = calculate_t_critical(Some(config.options.sig_level / 2.0), df);
                    let ci_width = std_error * t_critical;
                    ConfidenceInterval {
                        lower_bound: mean_diff - ci_width,
                        upper_bound: mean_diff + ci_width,
                    }
                } else {
                    // Return a default or NaN interval if calculation is not possible
                    ConfidenceInterval { lower_bound: f64::NAN, upper_bound: f64::NAN }
                };

                if adjusted_significance < config.options.sig_level || config.posthoc.lsd {
                    factor_results.push(ParameterEstimateEntry {
                        parameter: format!(
                            "{}: {} vs {} ({})",
                            factor,
                            level_data[i].0,
                            level_data[j].0,
                            test_name
                        ),
                        b: mean_diff,
                        std_error,
                        t_value,
                        significance: adjusted_significance,
                        confidence_interval,
                        partial_eta_squared,
                        noncent_parameter,
                        observed_power,
                    });
                }
            }
        }

        if !factor_results.is_empty() {
            result.insert(factor.clone(), factor_results);
        }
    }

    if result.is_empty() {
        Err("No significant post-hoc results found or calculated.".to_string())
    } else {
        Ok(result)
    }
}
