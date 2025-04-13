// posthoc.rs
use std::{ collections::HashMap, f32::consts::E };

use crate::univariate::models::{
    config::{ CategoryMethod, UnivariateConfig },
    data::AnalysisData,
    result::{ ConfidenceInterval, ParameterEstimateEntry },
};

use super::core::{
    calculate_mean,
    calculate_f_significance,
    calculate_t_critical,
    calculate_t_significance,
    get_factor_levels,
    get_level_values,
};

/// Calculate post-hoc tests based on the configuration
pub fn calculate_posthoc_tests(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HashMap<String, Vec<ParameterEstimateEntry>>, String> {
    // Return None if posthoc tests are not requested
    if config.posthoc.src_list.is_none() || config.posthoc.src_list.as_ref().unwrap().is_empty() {
        return Err("Post-hoc tests not requested in configuration".to_string());
    }

    let dep_var_name = match &config.main.dep_var {
        Some(name) => name.clone(),
        None => {
            return Err("No dependent variable specified in configuration".to_string());
        }
    };

    let mut result = HashMap::new();

    // Process factors specified for post-hoc tests
    let factors_to_process = if let Some(factors) = &config.posthoc.fix_factor_vars {
        factors.clone()
    } else if let Some(src_list) = &config.posthoc.src_list {
        src_list.clone()
    } else {
        Vec::new()
    };

    if factors_to_process.is_empty() {
        return Err("No factors specified for post-hoc tests".to_string());
    }

    // Process each factor
    for factor in &factors_to_process {
        let mut factor_results = Vec::new();

        // Get all levels for the factor
        let factor_levels = get_factor_levels(data, factor)?;
        if factor_levels.len() < 2 {
            continue; // Skip factors with less than 2 levels
        }

        // Determine reference category for Dunnett's tests
        let ref_index = match config.posthoc.category_method {
            CategoryMethod::First => 0,
            CategoryMethod::Last => factor_levels.len() - 1,
        };

        // Get values for each level
        let mut level_data = Vec::new();
        for level in &factor_levels {
            let values = get_level_values(data, factor, level, &dep_var_name)?;
            if !values.is_empty() {
                let mean = calculate_mean(&values);
                let variance =
                    values
                        .iter()
                        .map(|x| (x - mean).powi(2))
                        .sum::<f64>() / ((values.len() - 1) as f64);

                level_data.push((level.clone(), values, mean, variance));
            }
        }

        // Skip if not enough levels have data
        if level_data.len() < 2 {
            continue;
        }

        // Calculate grand mean and pooled variance
        let total_n: usize = level_data
            .iter()
            .map(|(_, values, _, _)| values.len())
            .sum();
        let grand_mean: f64 =
            level_data
                .iter()
                .map(|(_, values, mean, _)| (values.len() as f64) * mean)
                .sum::<f64>() / (total_n as f64);

        let pooled_variance =
            level_data
                .iter()
                .map(|(_, values, _, variance)| ((values.len() - 1) as f64) * variance)
                .sum::<f64>() / ((total_n - level_data.len()) as f64);

        // Generate all pairwise comparisons
        for i in 0..level_data.len() {
            for j in i + 1..level_data.len() {
                let (level_i, values_i, mean_i, var_i) = &level_data[i];
                let (level_j, values_j, mean_j, var_j) = &level_data[j];

                // Skip if testing with Dunnett and neither is reference level
                if config.posthoc.dunnett && i != ref_index && j != ref_index {
                    continue;
                }

                let n_i = values_i.len() as f64; // FIX: Removed '*' dereferencing operator
                let n_j = values_j.len() as f64; // FIX: Removed '*' dereferencing operator
                let mean_diff = mean_i - mean_j;

                // Calculate standard error based on test type
                let (std_error, df) = if
                    config.posthoc.tam ||
                    config.posthoc.dunt ||
                    config.posthoc.games ||
                    config.posthoc.dunc
                {
                    // For unequal variance tests (Tamhane's T2, Dunnett's T3, Games-Howell, Dunnett's C)
                    let std_error = (var_i / n_i + var_j / n_j).sqrt();
                    let df_value =
                        (var_i / n_i + var_j / n_j).powi(2) /
                        ((var_i / n_i).powi(2) / (n_i - 1.0) + (var_j / n_j).powi(2) / (n_j - 1.0));
                    (std_error, df_value.round() as usize)
                } else {
                    // For equal variance tests
                    let ms_error = pooled_variance;
                    let std_error = (ms_error * (1.0 / n_i + 1.0 / n_j)).sqrt();
                    let df = total_n - level_data.len();
                    (std_error, df)
                };

                let t_value = mean_diff / std_error;
                let t_abs = t_value.abs();

                // Get appropriate significance based on the test
                let mut significance = calculate_t_significance(df, t_value);
                let mut test_name = "";

                // Apply appropriate adjustments for each test
                let adjusted_significance = if config.posthoc.lsd {
                    // Fisher's LSD - no adjustment
                    test_name = "LSD";
                    significance
                } else if config.posthoc.bonfe {
                    // Bonferroni
                    test_name = "Bonferroni";
                    let num_comparisons = (level_data.len() * (level_data.len() - 1)) / 2;
                    (significance * (num_comparisons as f64)).min(1.0)
                } else if config.posthoc.sidak {
                    // Sidak
                    test_name = "Sidak";
                    let num_comparisons = (level_data.len() * (level_data.len() - 1)) / 2;
                    1.0 - (1.0 - significance).powf(1.0 / (num_comparisons as f64))
                } else if config.posthoc.scheffe {
                    // Scheffe
                    test_name = "Scheffe";
                    let f = t_value.powi(2) * ((level_data.len() - 1) as f64);
                    1.0 - calculate_f_significance(level_data.len() - 1, df, f)
                } else if config.posthoc.tu {
                    // Tukey's HSD
                    test_name = "Tukey";
                    let q = t_abs * (2.0_f64).sqrt(); // FIX: Added explicit f64 type annotation
                    // Use Tukey's studentized range distribution (approximated)
                    let alpha = 0.05; // Fixed alpha for now
                    let adjusted_q = q / ((2.0 * (alpha * 0.5)) as f64).ln().sqrt();
                    (1.0 - adjusted_q.exp()).max(0.0)
                } else if config.posthoc.tub {
                    // Tukey's b
                    test_name = "Tukey's b";
                    let q = t_abs * (2.0_f64).sqrt(); // FIX: Added explicit f64 type annotation
                    let alpha = 0.05;
                    let adjusted_q = q / ((2.0 * (alpha * 0.5)) as f64).ln().sqrt();
                    (1.0 - adjusted_q.exp()).max(0.0)
                } else if config.posthoc.snk {
                    // Student-Newman-Keuls
                    test_name = "SNK";
                    let num_steps = (j - i) as f64;
                    let q = t_abs * (2.0_f64).sqrt(); // FIX: Added explicit f64 type annotation
                    let alpha = 0.05;
                    let adjusted_q = q / (((2.0 * (alpha * 0.5)) as f64).ln() * num_steps).sqrt();
                    (1.0 - adjusted_q.exp()).max(0.0)
                } else if config.posthoc.dun {
                    // Duncan
                    test_name = "Duncan";
                    let num_steps = (j - i) as f64;
                    let q = t_abs * (2.0_f64).sqrt(); // FIX: Added explicit f64 type annotation
                    let alpha = 0.05;
                    let adjusted_alpha = 1.0 - ((1.0 - alpha) as f64).powf(num_steps);
                    let adjusted_q = q / ((2.0 * (adjusted_alpha * 0.5)) as f64).ln().sqrt();
                    (1.0 - adjusted_q.exp()).max(0.0)
                } else if config.posthoc.hoc {
                    // Hochberg's GT2
                    test_name = "Hochberg's GT2";
                    let num_comparisons = (level_data.len() * (level_data.len() - 1)) / 2;
                    1.0 - (1.0 - significance).powf(1.0 / ((num_comparisons as f64).ln() + 1.0))
                } else if config.posthoc.gabriel {
                    // Gabriel
                    test_name = "Gabriel";
                    let adjustment = ((level_data.len() as f64) / (n_i * n_j)).sqrt();
                    let adjusted_t = t_abs / adjustment;
                    calculate_t_significance(df, adjusted_t)
                } else if config.posthoc.regwf {
                    // Ryan-Einot-Gabriel-Welsch F
                    test_name = "R-E-G-W F";
                    let num_steps = (j - i) as f64;
                    let alpha = 0.05;
                    let adjusted_alpha = alpha / num_steps;
                    let f = t_value.powi(2);
                    1.0 - calculate_f_significance(1, df, f / adjusted_alpha)
                } else if config.posthoc.regwq {
                    // Ryan-Einot-Gabriel-Welsch Q
                    test_name = "R-E-G-W Q";
                    let num_steps = (j - i) as f64;
                    let q = t_abs * (2.0_f64).sqrt(); // FIX: Added explicit f64 type annotation
                    let alpha = 0.05;
                    let adjusted_alpha = alpha / num_steps;
                    let adjusted_q = q / ((2.0 * (adjusted_alpha * 0.5)) as f64).ln().sqrt();
                    (1.0 - adjusted_q.exp()).max(0.0)
                } else if config.posthoc.waller {
                    // Waller-Duncan
                    test_name = "Waller-Duncan";
                    let k_ratio = config.posthoc.error_ratio as f64;
                    let f_crit = (k_ratio * (n_i + n_j)) / (n_i * n_j);
                    let adjusted_t = t_abs / f_crit.sqrt();
                    calculate_t_significance(df, adjusted_t)
                } else if config.posthoc.dunnett {
                    // Dunnett
                    test_name = "Dunnett";
                    let is_control = i == ref_index || j == ref_index;
                    if !is_control {
                        1.0 // Skip
                    } else {
                        // One-sided or two-sided
                        if config.posthoc.twosided {
                            significance
                        } else if config.posthoc.lt_control && mean_diff < 0.0 {
                            significance / 2.0
                        } else if config.posthoc.gt_control && mean_diff > 0.0 {
                            significance / 2.0
                        } else {
                            1.0 // Not significant in one-sided test
                        }
                    }
                } else if config.posthoc.tam {
                    // Tamhane's T2
                    test_name = "Tamhane's T2";
                    let num_comparisons = (level_data.len() * (level_data.len() - 1)) / 2;
                    (significance * (num_comparisons as f64)).min(1.0)
                } else if config.posthoc.dunt {
                    // Dunnett's T3
                    test_name = "Dunnett's T3";
                    let num_comparisons = (level_data.len() * (level_data.len() - 1)) / 2;
                    let alpha = 0.05;
                    let adjusted_alpha = alpha / (num_comparisons as f64);
                    let adjusted_t_crit = calculate_t_critical(df, adjusted_alpha / 2.0);
                    if t_abs > adjusted_t_crit {
                        0.01
                    } else {
                        0.99
                    } // Approximate
                } else if config.posthoc.games {
                    // Games-Howell
                    test_name = "Games-Howell";
                    let q = t_abs * (2.0_f64).sqrt(); // FIX: Added explicit f64 type annotation
                    let alpha = 0.05;
                    let adjusted_q = q / ((2.0 * (alpha * 0.5)) as f64).ln().sqrt();
                    (1.0 - adjusted_q.exp()).max(0.0)
                } else if config.posthoc.dunc {
                    // Dunnett's C
                    test_name = "Dunnett's C";
                    let alpha: f64 = 0.05;
                    let c_value = ((2.0 * alpha.ln()) as f64).sqrt() * -1.0;
                    if t_abs > c_value {
                        0.01
                    } else {
                        0.99
                    } // Approximate
                } else {
                    // Default to no adjustment
                    test_name = "No Test";
                    significance
                };

                // Calculate confidence interval
                let t_critical = calculate_t_critical(df, config.options.sig_level / 2.0);
                let ci_width = std_error * t_critical;

                // Calculate effect size and power
                let partial_eta_squared = t_value.powi(2) / (t_value.powi(2) + (df as f64));
                let noncent_parameter = t_abs;
                let observed_power = if config.options.obs_power {
                    1.0 - (-noncent_parameter * 0.5).exp()
                } else {
                    0.0
                };

                // Add result to factor results
                if adjusted_significance < 1.0 || config.posthoc.lsd {
                    factor_results.push(ParameterEstimateEntry {
                        parameter: format!(
                            "{}: {} vs {} ({})",
                            factor,
                            level_i,
                            level_j,
                            test_name
                        ),
                        b: mean_diff,
                        std_error,
                        t_value,
                        significance: adjusted_significance,
                        confidence_interval: ConfidenceInterval {
                            lower_bound: mean_diff - ci_width,
                            upper_bound: mean_diff + ci_width,
                        },
                        partial_eta_squared,
                        noncent_parameter,
                        observed_power,
                    });
                }
            }
        }

        // Add results for this factor
        if !factor_results.is_empty() {
            result.insert(factor.clone(), factor_results);
        }
    }

    if result.is_empty() {
        Err("No significant post-hoc results found".to_string())
    } else {
        Ok(result)
    }
}
