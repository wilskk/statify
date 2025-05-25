// descriptive_statistics.rs
use std::collections::HashMap;

use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::DescriptiveStatistics,
};

use super::{
    basic_math::calculate_stats_for_values,
    common::{ extract_numeric_from_record, data_value_to_string },
    factor_utils::{ get_factor_levels, generate_level_combinations },
};

/// Calculate descriptive statistics for univariate analysis
pub fn calculate_descriptive_statistics(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HashMap<String, DescriptiveStatistics>, String> {
    let dep_var_name = config.main.dep_var
        .as_ref()
        .ok_or_else(|| "No dependent variable specified in configuration".to_string())?;

    // Collect all factors from configuration
    let mut all_factors = Vec::new();
    if let Some(fix_factors) = &config.main.fix_factor {
        all_factors.extend(fix_factors.clone());
    }
    if let Some(rand_factors) = &config.main.rand_factor {
        all_factors.extend(rand_factors.clone());
    }
    if let Some(covariates) = &config.main.covar {
        all_factors.extend(covariates.clone());
    }

    if all_factors.is_empty() {
        return Err("No factors specified for descriptive statistics".to_string());
    }

    // Get factor levels and generate combinations
    let mut factor_levels = Vec::new();
    for factor in &all_factors {
        let levels = get_factor_levels(data, factor)?;
        factor_levels.push((factor.clone(), levels));
    }

    let mut all_combinations = Vec::new();
    generate_level_combinations(&factor_levels, &mut HashMap::new(), 0, &mut all_combinations);

    // Calculate statistics for each combination
    let mut stats_entries = HashMap::new();
    for combo in &all_combinations {
        let combo_key = combo
            .iter()
            .map(|(k, v)| format!("{}={}", k, v))
            .collect::<Vec<String>>()
            .join(";");

        let mut values_with_weights = Vec::new();
        for record_set in &data.dependent_data {
            for record in record_set {
                if let Some(dep_val) = extract_numeric_from_record(record, dep_var_name) {
                    let mut matches = true;
                    for (factor, level) in combo {
                        if let Some(val) = record.values.get(factor) {
                            if data_value_to_string(val) != *level {
                                matches = false;
                                break;
                            }
                        } else {
                            matches = false;
                            break;
                        }
                    }

                    if matches {
                        let weight = if let Some(wls_var) = &config.main.wls_weight {
                            extract_numeric_from_record(record, wls_var).unwrap_or(1.0)
                        } else {
                            1.0
                        };
                        values_with_weights.push((dep_val, weight));
                    }
                }
            }
        }

        let stats = calculate_stats_for_values(&values_with_weights);
        stats_entries.insert(combo_key, stats);
    }

    Ok(
        HashMap::from([
            (
                dep_var_name.clone(),
                DescriptiveStatistics {
                    dependent_variable: dep_var_name.clone(),
                    stats_entries,
                    factor_names: all_factors,
                },
            ),
        ])
    )
}
