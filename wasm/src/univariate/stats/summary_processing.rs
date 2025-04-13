// summary_processing.rs
use std::collections::HashMap;

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
) -> Result<Option<HashMap<String, BetweenSubjectFactors>>, String> {
    if data.fix_factor_data.is_empty() {
        return Ok(None);
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

        result.insert(factor_name.clone(), BetweenSubjectFactors { factors: level_counts });
    }

    Ok(Some(result))
}
