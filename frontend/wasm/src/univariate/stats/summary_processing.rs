// summary_processing.rs
use std::collections::{ HashMap, BTreeMap };

use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::BetweenSubjectFactors,
};

use super::{ core::data_value_to_string, factor_utils::get_factor_levels };

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

    // Process fixed factors
    for factor_name in factor_names {
        let levels = get_factor_levels(data, factor_name)?;
        let mut level_counts = HashMap::new();

        // Count occurrences of each level
        for level in levels {
            level_counts.insert(level, 0);
        }

        // Find the group containing this factor
        for (group_idx, def_group) in data.fix_factor_data_defs.iter().enumerate() {
            if def_group.iter().any(|def| &def.name == factor_name) {
                if let Some(data_records) = data.fix_factor_data.get(group_idx) {
                    for record in data_records {
                        if let Some(value) = record.values.get(factor_name) {
                            let level = data_value_to_string(value);
                            *level_counts.entry(level).or_insert(0) += 1;
                        }
                    }
                }
            }
        }

        // Convert HashMap to BTreeMap to sort by key
        let sorted_counts = level_counts.into_iter().collect::<BTreeMap<String, usize>>();
        result.insert(factor_name.clone(), BetweenSubjectFactors { factors: sorted_counts });
    }

    // Process random factors if present
    if let Some(random_factors) = &config.main.rand_factor {
        if let Some(random_factor_data) = &data.random_factor_data {
            for factor_name in random_factors {
                let levels = get_factor_levels(data, factor_name)?;
                let mut level_counts = HashMap::new();

                // Count occurrences of each level
                for level in levels {
                    level_counts.insert(level, 0);
                }

                // Find the group containing this factor
                if let Some(random_defs_groups) = &data.random_factor_data_defs {
                    for (group_idx, def_group) in random_defs_groups.iter().enumerate() {
                        if def_group.iter().any(|def| &def.name == factor_name) {
                            if let Some(data_records) = random_factor_data.get(group_idx) {
                                for record in data_records {
                                    if let Some(value) = record.values.get(factor_name) {
                                        let level = data_value_to_string(value);
                                        *level_counts.entry(level).or_insert(0) += 1;
                                    }
                                }
                            }
                        }
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

    // // Process covariates if present
    // if let Some(covariates) = &config.main.covar {
    //     if let Some(covariate_data) = &data.covariate_data {
    //         for covariate_name in covariates {
    //             let levels = get_factor_levels(data, covariate_name)?;
    //             let mut level_counts = HashMap::new();

    //             // Count occurrences of each level
    //             for level in levels {
    //                 level_counts.insert(level, 0);
    //             }

    //             // Find the group containing this covariate
    //             if let Some(covariate_defs_groups) = &data.covariate_data_defs {
    //                 for (group_idx, def_group) in covariate_defs_groups.iter().enumerate() {
    //                     if def_group.iter().any(|def| &def.name == covariate_name) {
    //                         if let Some(data_records) = covariate_data.get(group_idx) {
    //                             for record in data_records {
    //                                 if let Some(value) = record.values.get(covariate_name) {
    //                                     let level = data_value_to_string(value);
    //                                     *level_counts.entry(level).or_insert(0) += 1;
    //                                 }
    //                             }
    //                         }
    //                     }
    //                 }
    //             }

    //             // Convert HashMap to BTreeMap to sort by key
    //             let sorted_counts = level_counts.into_iter().collect::<BTreeMap<String, usize>>();
    //             result.insert(format!("{} (Covariate)", covariate_name), BetweenSubjectFactors {
    //                 factors: sorted_counts,
    //             });
    //         }
    //     }
    // }

    Ok(result)
}
