// posthoc.rs
use std::{ collections::HashMap };

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

        // Calculate pooled variance (MSE)
        let pooled_variance =
            level_data
                .iter()
                .map(|(_, values, _, variance)| ((values.len() - 1) as f64) * variance)
                .sum::<f64>() / ((total_n - level_data.len()) as f64);

        // Calculate s_pp (square root of MSE) as per documentation
        let s_pp = pooled_variance.sqrt();

        // Calculate harmonic mean of sample sizes
        let n_h =
            (level_data.len() as f64) /
            level_data
                .iter()
                .map(|(_, values, _, _)| 1.0 / (values.len() as f64))
                .sum::<f64>();
        let q_h = s_pp / n_h.sqrt();

        // Alpha level from config or default to 0.05
        let alpha = config.options.sig_level;

        // Calculate k* = k(k-1)/2
        let k_star = (level_data.len() * (level_data.len() - 1)) / 2;

        // Total df for error
        let error_df = total_n - level_data.len();

        // Generate all pairwise comparisons
        for i in 0..level_data.len() {
            for j in i + 1..level_data.len() {
                let (level_i, values_i, mean_i, var_i) = &level_data[i];
                let (level_j, values_j, mean_j, var_j) = &level_data[j];

                // Skip if testing with Dunnett and neither is reference level
                if config.posthoc.dunnett && i != ref_index && j != ref_index {
                    continue;
                }

                let n_i = values_i.len() as f64;
                let n_j = values_j.len() as f64;
                let mean_diff = mean_i - mean_j;
                let r = (j - i) as f64; // Number of steps between means

                // Calculate Q_i,j as defined in documentation
                let q_i_j = s_pp * ((1.0 / n_i + 1.0 / n_j) / 2.0).sqrt();

                // Calculate deviation from grand mean (for effect size calculation)
                let grand_mean_effect =
                    (mean_i - grand_mean).powi(2) + (mean_j - grand_mean).powi(2);

                // Calculate standard error based on test type
                let (std_error, df) = if
                    config.posthoc.tam ||
                    config.posthoc.dunt ||
                    config.posthoc.games ||
                    config.posthoc.dunc
                {
                    // For unequal variance tests (Tamhane's T2, Dunnett's T3, Games-Howell, Dunnett's C)
                    let std_error = (var_i / n_i + var_j / n_j).sqrt();

                    // Calculate df using Welch-Satterthwaite equation
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

                // Calculate studentized range statistic Q
                let q = t_abs * (2.0_f64).sqrt();

                // Get appropriate significance based on the test
                let significance = calculate_t_significance(df, t_value);
                let mut test_name = "";

                // Apply appropriate adjustments for each test
                let adjusted_significance = if config.posthoc.lsd {
                    // Fisher's LSD - no adjustment
                    test_name = "LSD";
                    significance
                } else if config.posthoc.bonfe {
                    // Bonferroni
                    test_name = "Bonferroni";
                    // Use alpha' = epsilon/k*
                    (significance * (k_star as f64)).min(1.0)
                } else if config.posthoc.sidak {
                    // Sidak
                    test_name = "Sidak";
                    // alpha = 1-(1-epsilon)^(2/k(k-1))
                    1.0 - (1.0 - significance).powf(1.0 / (k_star as f64))
                } else if config.posthoc.scheffe {
                    // Scheffe
                    test_name = "Scheffe";
                    // R_r,v,f = sqrt(2(k-1)F_{1-alpha}(k-1,f))
                    let f = t_value.powi(2) * ((level_data.len() - 1) as f64);
                    1.0 - calculate_f_significance(level_data.len() - 1, df, f)
                } else if config.posthoc.tu {
                    // Tukey's HSD - uses k for all comparisons
                    test_name = "Tukey";
                    let critical_q = 0.0; // Would need actual critical value from studentized range table
                    // Approximate with t-distribution approach
                    let adjusted_alpha = alpha / (k_star as f64);
                    let t_critical = calculate_t_critical(df, adjusted_alpha / 2.0);
                    if t_abs > t_critical {
                        0.01
                    } else {
                        0.99
                    }
                } else if config.posthoc.tub {
                    // Tukey's b - average of SNK and HSD
                    test_name = "Tukey's b";
                    let adjusted_alpha = alpha / (k_star as f64);
                    let t_critical = calculate_t_critical(df, adjusted_alpha / 2.0);
                    if t_abs > t_critical {
                        0.01
                    } else {
                        0.99
                    }
                } else if config.posthoc.snk {
                    // Student-Newman-Keuls - uses r (steps between means)
                    test_name = "SNK";
                    // R_r,v,f = S_r,v,f
                    let step_adjusted_alpha = alpha / r;
                    let t_critical = calculate_t_critical(df, step_adjusted_alpha / 2.0);
                    if t_abs > t_critical {
                        0.01
                    } else {
                        0.99
                    }
                } else if config.posthoc.dun {
                    // Duncan
                    test_name = "Duncan";
                    // alpha_r = 1-(1-alpha)^(r-1)
                    let adjusted_alpha = 1.0 - (1.0 - alpha).powf(r - 1.0);
                    let t_critical = calculate_t_critical(df, adjusted_alpha / 2.0);
                    if t_abs > t_critical {
                        0.01
                    } else {
                        0.99
                    }
                } else if config.posthoc.hoc {
                    // Hochberg's GT2
                    test_name = "Hochberg's GT2";
                    // Uses studentized maximum modulus
                    let adjusted_alpha = alpha / (k_star as f64);
                    let t_critical = calculate_t_critical(df, adjusted_alpha / 2.0);
                    if t_abs > t_critical {
                        0.01
                    } else {
                        0.99
                    }
                } else if config.posthoc.gabriel {
                    // Gabriel
                    // |x̄i-x̄j| ≥ s_pp * (1/√(2ni)+1/√(2nj)) * M_k,k*,f
                    let adjustment = ((level_data.len() as f64) / (n_i * n_j)).sqrt();
                    let adjusted_t = t_abs / adjustment;
                    calculate_t_significance(df, adjusted_t)
                } else if config.posthoc.regwf {
                    // Ryan-Einot-Gabriel-Welsch F
                    test_name = "R-E-G-W F";
                    // γr = 1-(1-ε)^(r/k) if r < k-1, ε if r ≥ k-1
                    let gamma_r = if r < (level_data.len() as f64) - 1.0 {
                        1.0 - (1.0 - alpha).powf(r / (level_data.len() as f64))
                    } else {
                        alpha
                    };

                    let f = t_value.powi(2);
                    1.0 - calculate_f_significance(1, df, f / gamma_r)
                } else if config.posthoc.regwq {
                    // Ryan-Einot-Gabriel-Welsch Q
                    test_name = "R-E-G-W Q";
                    // Same gamma_r as REGW F
                    let gamma_r = if r < (level_data.len() as f64) - 1.0 {
                        1.0 - (1.0 - alpha).powf(r / (level_data.len() as f64))
                    } else {
                        alpha
                    };

                    let t_critical = calculate_t_critical(df, gamma_r / 2.0);
                    if t_abs > t_critical {
                        0.01
                    } else {
                        0.99
                    }
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
                            // Two-sided Dunnett test
                            significance
                        } else if config.posthoc.lt_control && mean_diff < 0.0 {
                            // Lower than control (one-sided)
                            significance / 2.0
                        } else if config.posthoc.gt_control && mean_diff > 0.0 {
                            // Greater than control (one-sided)
                            significance / 2.0
                        } else {
                            1.0 // Not significant in one-sided test
                        }
                    }
                } else if config.posthoc.tam {
                    // Tamhane's T2
                    test_name = "Tamhane's T2";
                    // Uses Bonferroni with unequal variances
                    (significance * (k_star as f64)).min(1.0)
                } else if config.posthoc.dunt {
                    // Dunnett's T3
                    test_name = "Dunnett's T3";
                    // Uses studentized maximum modulus with unequal variances
                    let adjusted_alpha = alpha / (k_star as f64);
                    let adjusted_t_crit = calculate_t_critical(df, adjusted_alpha / 2.0);
                    if t_abs > adjusted_t_crit {
                        0.01
                    } else {
                        0.99
                    }
                } else if config.posthoc.games {
                    // Games-Howell
                    test_name = "Games-Howell";
                    // Uses studentized range with unequal variances
                    let adjusted_alpha = alpha / (k_star as f64);
                    let t_critical = calculate_t_critical(df, adjusted_alpha / 2.0);
                    if t_abs > t_critical {
                        0.01
                    } else {
                        0.99
                    }
                } else if config.posthoc.dunc {
                    // Dunnett's C
                    test_name = "Dunnett's C";
                    let c_critical = ((2.0 * alpha.ln()) as f64).sqrt() * -1.0;
                    if t_abs > c_critical {
                        0.01
                    } else {
                        0.99
                    }
                } else {
                    // Default to no adjustment
                    test_name = "No Test";
                    significance
                };

                // Calculate confidence interval
                let t_critical = calculate_t_critical(df, config.options.sig_level / 2.0);
                let ci_width = std_error * t_critical;

                // Calculate effect size and power
                let partial_eta_squared = if config.options.est_effect_size {
                    // Use grand mean for more accurate effect size calculation
                    let effect_size = t_value.powi(2) / (t_value.powi(2) + (df as f64));
                    // Adjust with grand mean deviation when available
                    if grand_mean_effect > 0.0 {
                        effect_size * (grand_mean_effect / (mean_diff.powi(2) + 0.001))
                    } else {
                        effect_size
                    }
                } else {
                    t_value.powi(2) / (t_value.powi(2) + (df as f64))
                };
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
