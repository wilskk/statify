// descriptive_statistics.rs
use std::collections::HashMap;

use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ DescriptiveStatistics, DescriptiveStatisticsEntry },
};

use super::core::{
    calculate_mean,
    calculate_std_deviation,
    extract_dependent_value,
    get_factor_combinations,
    matches_combination,
};

/// Calculate descriptive statistics if requested
pub fn calculate_descriptive_statistics(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<Option<HashMap<String, DescriptiveStatistics>>, String> {
    if !config.options.desc_stats || data.dependent_data.is_empty() {
        return Ok(None);
    }

    let dep_var_name = match &config.main.dep_var {
        Some(name) => name,
        None => {
            return Err("No dependent variable specified in configuration".to_string());
        }
    };

    let mut result = HashMap::new();

    // Get factor combinations
    let factor_combinations = get_factor_combinations(data, config)?;
    let mut entries = Vec::new();

    for combo in &factor_combinations {
        // Extract relevant data points for this combination
        let mut values = Vec::new();

        for records in &data.dependent_data {
            for record in records {
                // Check if this record matches the factor combination
                if matches_combination(record, combo, data, config) {
                    if let Some(value) = extract_dependent_value(record, dep_var_name) {
                        values.push(value);
                    }
                }
            }
        }

        if !values.is_empty() {
            // Calculate statistics
            let n = values.len();
            let mean = calculate_mean(&values);
            let std_deviation = calculate_std_deviation(&values, Some(mean));

            entries.push(DescriptiveStatisticsEntry {
                mean,
                std_deviation,
                n,
            });
        }
    }

    result.insert(dep_var_name.clone(), DescriptiveStatistics { entries });
    Ok(Some(result))
}
