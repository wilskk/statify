use std::collections::HashMap;

use crate::univariate::models::{
    config::{ CIMethod, EmmmeansConfig, UnivariateConfig },
    data::AnalysisData,
    result::{ ConfidenceInterval, ParameterEstimateEntry },
};

use super::core::{
    calculate_t_critical,
    calculate_t_significance,
    extract_dependent_value,
    get_factor_combinations,
    get_factor_levels,
    matches_combination,
};

/// Calculate estimated marginal means if requested
pub fn calculate_emmeans(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HashMap<String, Vec<ParameterEstimateEntry>>, String> {
    if config.emmeans.src_list.is_empty() {
        return Ok(None);
    }

    let dep_var_name = match &config.main.dep_var {
        Some(name) => name.clone(),
        None => {
            return Err("No dependent variable specified in configuration".to_string());
        }
    };

    let mut result = HashMap::new();

    // Process each source in the EMMEANS list
    for src in &config.emmeans.src_list {
        let mut estimates = Vec::new();

        // Check if source is a single factor or an interaction term
        let factors: Vec<&str> = src
            .split('*')
            .map(|s| s.trim())
            .collect();

        // Get all combinations of levels for the factors
        let mut all_level_combinations = Vec::new();
        let mut factor_levels = Vec::new();

        for factor in &factors {
            let levels = get_factor_levels(data, factor)?;
            factor_levels.push(levels);
        }

        // Generate all combinations of factor levels
        fn generate_combinations(
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
                generate_combinations(
                    current_combination,
                    factor_list,
                    level_list,
                    index + 1,
                    result
                );
                current_combination.pop();
            }
        }

        let mut current = Vec::new();
        let mut combinations = Vec::new();
        generate_combinations(&mut current, &factors, &factor_levels, 0, &mut combinations);

        // Calculate marginal means for each combination
        for combination in combinations {
            // Convert to HashMap for easier lookup
            let combo_map: HashMap<String, String> = combination
                .iter()
                .map(|(factor, level)| (factor.clone(), level.clone()))
                .collect();

            // Extract values matching this combination
            let mut values = Vec::new();
            let mut weight_sum = 0.0;

            for records in &data.dependent_data {
                for record in records {
                    let mut matches = true;

                    for (factor, level) in &combo_map {
                        let mut factor_match = false;

                        for (key, value) in &record.values {
                            if key == factor {
                                let record_level = match value {
                                    crate::univariate::models::data::DataValue::Number(n) =>
                                        n.to_string(),
                                    crate::univariate::models::data::DataValue::Text(t) =>
                                        t.clone(),
                                    crate::univariate::models::data::DataValue::Boolean(b) =>
                                        b.to_string(),
                                    crate::univariate::models::data::DataValue::Null =>
                                        "null".to_string(),
                                };

                                if record_level == *level {
                                    factor_match = true;
                                }
                                break;
                            }
                        }

                        if !factor_match {
                            matches = false;
                            break;
                        }
                    }

                    if matches {
                        if let Some(value) = extract_dependent_value(record, &dep_var_name) {
                            values.push(value);
                            weight_sum += 1.0; // Could be adjusted for weighted designs
                        }
                    }
                }
            }

            if values.is_empty() {
                continue;
            }

            // Calculate mean and standard error
            let mean = values.iter().sum::<f64>() / (values.len() as f64);
            let variance =
                values
                    .iter()
                    .map(|x| (x - mean).powi(2))
                    .sum::<f64>() / ((values.len() - 1) as f64);
            let std_error = (variance / (values.len() as f64)).sqrt();

            // Calculate t-value and significance
            let df = values.len() - 1;
            let t_value = mean / std_error;
            let significance = calculate_t_significance(df, t_value);

            // Calculate confidence interval
            let alpha = match config.emmeans.confi_interval_method {
                CIMethod::Bonferroni => config.options.sig_level / (combinations.len() as f64),
                CIMethod::Sidak =>
                    1.0 - (1.0 - config.options.sig_level).powf(1.0 / (combinations.len() as f64)),
                CIMethod::LsdNone => config.options.sig_level,
            };

            let t_critical = calculate_t_critical(df, alpha / 2.0);
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
                    // Simplified power calculation
                    1.0 - (-t_value.abs() * 0.5).exp()
                } else {
                    0.0
                },
            });
        }

        // Add comparisons if requested
        if config.emmeans.comp_main_effect && factors.len() == 1 {
            // Add pairwise comparisons for main effects
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
                    let significance = calculate_t_significance(df, t_value);

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
                    let t_critical = calculate_t_critical(df, config.options.sig_level / 2.0);
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
                    });
                }
            }
        }

        // Add results for this source
        result.insert(src.clone(), estimates);
    }

    Ok(result)
}
