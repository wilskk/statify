// emmeans.rs
use std::collections::HashMap;

use crate::univariate::models::{
    config::{ CIMethod, UnivariateConfig },
    data::AnalysisData,
    result::{ ConfidenceInterval, ParameterEstimateEntry },
};

use super::core::*;

pub fn calculate_emmeans(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HashMap<String, Vec<ParameterEstimateEntry>>, String> {
    // Check if target_list exists and is not empty
    let target_list = match &config.emmeans.target_list {
        Some(list) if !list.is_empty() => list,
        _ => {
            return Err("Target list is empty or not specified in configuration".to_string());
        } // Return early if target_list is empty or None
    };

    // Get dependent variable and fixed factors
    let dep_var = match &config.main.dep_var {
        Some(name) => name.clone(),
        None => {
            return Err("No dependent variable specified in configuration".to_string());
        }
    };

    let fix_factors = match &config.main.fix_factor {
        Some(factors) if !factors.is_empty() => factors.clone(),
        _ => {
            return Err("No fixed factors available for analysis".to_string());
        }
    };

    // Determine which factor combinations to analyze
    let factors_to_analyze: Vec<String> = if target_list.iter().any(|x| x == "(OVERALL)") {
        // Generate all possible combinations when (OVERALL) is present
        let mut base_factors = Vec::new();
        base_factors.push(dep_var.clone());
        for factor in &fix_factors {
            base_factors.push(factor.clone());
        }

        // Generate all possible combinations of all possible lengths
        let mut all_combinations = Vec::new();

        // Add individual factors
        for factor in &base_factors {
            all_combinations.push(factor.clone());
        }

        // Generate combinations of all other sizes (from 2 up to base_factors.len())
        generate_factor_combinations(&base_factors, &mut Vec::new(), 0, &mut all_combinations);

        all_combinations
    } else {
        // Use the target_list directly
        target_list.clone()
    };

    let mut result = HashMap::new();

    // Process each factor or factor combination
    for factor_spec in &factors_to_analyze {
        let mut estimates = Vec::new();

        // Split factor specification to identify individual factors vs. interaction terms
        let factors: Vec<&str> = factor_spec
            .split('*')
            .map(|s| s.trim())
            .collect();

        // Get all combinations of levels for the factors
        let mut factor_levels = Vec::new();
        for factor in &factors {
            let levels = get_factor_levels(data, factor)?;
            factor_levels.push(levels);
        }

        // Generate all combinations of factor levels
        let mut combinations = Vec::new();
        let mut current = Vec::new();
        generate_level_combinations(&mut current, &factors, &factor_levels, 0, &mut combinations);

        // Calculate marginal means for each combination
        for combination in &combinations {
            // Convert to HashMap for easier lookup
            let combo_map: HashMap<String, String> = combination
                .iter()
                .map(|(factor, level)| (factor.clone(), level.clone()))
                .collect();

            // Extract values matching this combination
            let mut values = Vec::new();

            for records in &data.dependent_data {
                for record in records {
                    let mut matches = true;

                    for (factor, level) in &combo_map {
                        let record_level = record.values.get(factor).map(data_value_to_string);

                        if record_level.as_deref() != Some(level) {
                            matches = false;
                            break;
                        }
                    }

                    if matches {
                        if let Some(value) = extract_numeric_from_record(record, &dep_var) {
                            values.push(value);
                        }
                    }
                }
            }

            if values.is_empty() {
                continue;
            }

            // Calculate mean and standard error
            let mean = calculate_mean(&values);
            let variance =
                values
                    .iter()
                    .map(|v| (v - mean).powi(2))
                    .sum::<f64>() / ((values.len() - 1) as f64);
            let std_error = (variance / (values.len() as f64)).sqrt();

            // Calculate t-value and significance
            let df = values.len() - 1;
            let t_value = mean / std_error;
            let significance = calculate_t_significance(t_value, df);

            // Calculate confidence interval
            let alpha = match config.emmeans.confi_interval_method {
                CIMethod::Bonferroni => config.options.sig_level / (combinations.len() as f64),
                CIMethod::Sidak =>
                    1.0 - (1.0 - config.options.sig_level).powf(1.0 / (combinations.len() as f64)),
                CIMethod::LsdNone => config.options.sig_level,
            };

            let t_critical = calculate_t_critical(Some(alpha / 2.0), df);
            let ci_width = std_error * t_critical;

            // Format parameter name from combination
            let parameter_name = combination
                .iter()
                .map(|(factor, level)| format!("{}={}", factor, level))
                .collect::<Vec<_>>()
                .join(", ");

            // Add entry to results
            estimates.push(ParameterEstimateEntry {
                parameter: parameter_name,
                b: mean,
                std_error,
                t_value,
                significance,
                confidence_interval: ConfidenceInterval {
                    lower_bound: mean - ci_width,
                    upper_bound: mean + ci_width,
                },
                partial_eta_squared: t_value.powi(2) / (t_value.powi(2) + (df as f64)),
                noncent_parameter: t_value.abs(),
                observed_power: if config.options.obs_power {
                    1.0 - (-t_value.abs() * 0.5).exp()
                } else {
                    0.0
                },
                is_redundant: false,
            });
        }

        // Add pairwise comparisons if requested
        if config.emmeans.comp_main_effect && factors.len() == 1 {
            let factor = factors[0];
            let levels = &factor_levels[0];

            for i in 0..levels.len() {
                for j in i + 1..levels.len() {
                    // Find corresponding means
                    let mut mean_i = 0.0;
                    let mut mean_j = 0.0;
                    let mut se_i = 0.0;
                    let mut se_j = 0.0;
                    let mut df_i = 0;
                    let mut df_j = 0;

                    for est in &estimates {
                        if est.parameter.contains(&format!("{}={}", factor, levels[i])) {
                            mean_i = est.b;
                            se_i = est.std_error;
                            df_i = est.confidence_interval.upper_bound.abs() as usize;
                        } else if est.parameter.contains(&format!("{}={}", factor, levels[j])) {
                            mean_j = est.b;
                            se_j = est.std_error;
                            df_j = est.confidence_interval.upper_bound.abs() as usize;
                        }
                    }

                    // Calculate comparison statistics
                    let mean_diff = mean_i - mean_j;
                    let std_error = (se_i.powi(2) + se_j.powi(2)).sqrt();
                    let df = (df_i + df_j) / 2; // Approximate
                    let t_value = mean_diff / std_error;
                    let significance = calculate_t_significance(t_value, df);

                    // Adjust significance based on method
                    let adjusted_significance = match config.emmeans.confi_interval_method {
                        CIMethod::Bonferroni =>
                            significance * (((levels.len() * (levels.len() - 1)) / 2) as f64),
                        CIMethod::Sidak =>
                            1.0 -
                                (1.0 - significance).powf(
                                    ((levels.len() * (levels.len() - 1)) / 2) as f64
                                ),
                        CIMethod::LsdNone => significance,
                    };

                    // Calculate confidence interval
                    let t_critical = calculate_t_critical(Some(config.options.sig_level / 2.0), df);
                    let ci_width = std_error * t_critical;

                    // Add to estimates
                    estimates.push(ParameterEstimateEntry {
                        parameter: format!(
                            "Pairwise: {}={} vs {}={}",
                            factor,
                            levels[i],
                            factor,
                            levels[j]
                        ),
                        b: mean_diff,
                        std_error,
                        t_value,
                        significance: adjusted_significance,
                        confidence_interval: ConfidenceInterval {
                            lower_bound: mean_diff - ci_width,
                            upper_bound: mean_diff + ci_width,
                        },
                        partial_eta_squared: t_value.powi(2) / (t_value.powi(2) + (df as f64)),
                        noncent_parameter: t_value.abs(),
                        observed_power: if config.options.obs_power {
                            1.0 - (-t_value.abs() * 0.5).exp()
                        } else {
                            0.0
                        },
                        is_redundant: false,
                    });
                }
            }
        }

        // Add all estimates for this factor to the result
        result.insert(factor_spec.clone(), estimates);
    }

    Ok(result)
}

/// Helper function to generate all possible combinations of factors
/// This creates combinations like "A", "B", "A*B", "A*B*C", etc.
fn generate_factor_combinations(
    all_factors: &[String],
    current_combination: &mut Vec<String>,
    start_index: usize,
    result: &mut Vec<String>
) {
    // Skip combinations of size 1 as we've already added them
    if current_combination.len() > 1 {
        // Join the current combination with "*" and add to result
        result.push(current_combination.join("*"));
    }

    // Try adding each remaining factor
    for i in start_index..all_factors.len() {
        current_combination.push(all_factors[i].clone());
        generate_factor_combinations(all_factors, current_combination, i + 1, result);
        current_combination.pop();
    }
}

/// Helper function to generate all combinations of factor levels
fn generate_level_combinations(
    current_combination: &mut Vec<(String, String)>,
    factor_list: &[&str],
    level_list: &[Vec<String>],
    index: usize,
    result: &mut Vec<Vec<(String, String)>>
) {
    if index == factor_list.len() {
        result.push(current_combination.clone());
        return;
    }

    for level in &level_list[index] {
        current_combination.push((factor_list[index].to_string(), level.clone()));
        generate_level_combinations(
            current_combination,
            factor_list,
            level_list,
            index + 1,
            result
        );
        current_combination.pop();
    }
}
