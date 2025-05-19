// summary_processing.rs
use std::collections::{ HashMap, BTreeMap };

use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::BetweenSubjectFactors,
};

use super::core::data_value_to_string;

/// Process basic data summary - always executed
pub fn basic_processing_summary(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HashMap<String, BetweenSubjectFactors>, String> {
    if data.fix_factor_data.is_empty() {
        return Err("No fixed factor data available".to_string());
    }

    let mut result = HashMap::new();
    let factor_names = match &config.main.fix_factor {
        Some(names) => names,
        None => {
            return Err("No fixed factors specified in configuration".to_string());
        }
    };

    for (i, factor_name) in factor_names.iter().enumerate() {
        if i >= data.fix_factor_data.len() {
            continue;
        }

        let mut level_counts = HashMap::new();
        for records in &data.fix_factor_data[i] {
            if let Some(value) = records.values.get(factor_name) {
                let level = data_value_to_string(value);
                *level_counts.entry(level).or_insert(0) += 1;
            }
        }

        // Convert HashMap to BTreeMap to sort by key
        let sorted_counts = level_counts.into_iter().collect::<BTreeMap<String, usize>>();

        result.insert(factor_name.clone(), BetweenSubjectFactors { factors: sorted_counts });
    }

    // Process random factors if present
    if let Some(random_factors) = &config.main.rand_factor {
        if let Some(random_factor_data) = &data.random_factor_data {
            for (i, factor_name) in random_factors.iter().enumerate() {
                if i >= random_factor_data.len() {
                    continue;
                }

                let mut level_counts = HashMap::new();
                for records in &random_factor_data[i] {
                    if let Some(value) = records.values.get(factor_name) {
                        let level = data_value_to_string(value);
                        *level_counts.entry(level).or_insert(0) += 1;
                    }
                }

                // Convert HashMap to BTreeMap to sort by key
                let sorted_counts = level_counts.into_iter().collect::<BTreeMap<String, usize>>();

                result.insert(format!("{} (Random)", factor_name), BetweenSubjectFactors {
                    factors: sorted_counts,
                });
            }
        }
    }

    Ok(result)
}
