use std::collections::HashMap;

use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::DescriptiveStatistics,
};

use super::core::*;

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

    // Get factor levels and generate combinations (with 'Total')
    let mut factor_levels = Vec::new();
    for factor in &all_factors {
        let mut levels = get_factor_levels(data, factor)?;
        levels.sort();
        levels.push("Total".to_string());
        factor_levels.push((factor.clone(), levels));
    }
    let mut all_combinations = Vec::new();
    generate_level_combinations(&factor_levels, &mut HashMap::new(), 0, &mut all_combinations);

    // Gabungkan data observasi per baris (berdasarkan index)
    let n_obs = if !data.dependent_data.is_empty() && !data.dependent_data[0].is_empty() {
        data.dependent_data[0].len()
    } else {
        return Err("No data available for descriptive statistics".to_string());
    };
    let mut all_records: Vec<HashMap<String, String>> = Vec::with_capacity(n_obs);
    for i in 0..n_obs {
        let mut record = HashMap::new();
        // Dependent
        if let Some(dep) = data.dependent_data[0].get(i) {
            for (k, v) in &dep.values {
                record.insert(k.clone(), data_value_to_string(v));
            }
        }
        // Fixed factors
        for fix_set in &data.fix_factor_data {
            if let Some(fix) = fix_set.get(i) {
                for (k, v) in &fix.values {
                    record.insert(k.clone(), data_value_to_string(v));
                }
            }
        }
        // Random factors
        if let Some(rand_sets) = &data.random_factor_data {
            for rand_set in rand_sets {
                if let Some(rand) = rand_set.get(i) {
                    for (k, v) in &rand.values {
                        record.insert(k.clone(), data_value_to_string(v));
                    }
                }
            }
        }

        // // Covariates
        // if let Some(cov_sets) = &data.covariate_data {
        //     for cov_set in cov_sets {
        //         if let Some(cov) = cov_set.get(i) {
        //             for (k, v) in &cov.values {
        //                 record.insert(k.clone(), data_value_to_string(v));
        //             }
        //         }
        //     }
        // }

        // // WLS weight
        // let weight = if let Some(wls_var) = &config.main.wls_weight {
        //     if let Some(wls_sets) = &data.wls_data {
        //         if let Some(wls_set) = wls_sets.get(0) {
        //             if let Some(wls_rec) = wls_set.get(i) {
        //                 extract_numeric_from_record(wls_rec, wls_var).unwrap_or(1.0).to_string()
        //             } else {
        //                 "1.0".to_string()
        //             }
        //         } else {
        //             "1.0".to_string()
        //         }
        //     } else {
        //         "1.0".to_string()
        //     }
        // } else {
        //     "1.0".to_string()
        // };
        // record.insert("wls_weight_value".to_string(), weight);

        all_records.push(record);
    }

    // Calculate statistics for each combination
    let mut stats_entries = HashMap::new();
    for combo in &all_combinations {
        // Generate a deterministic key based on the order in all_factors
        let combo_key_parts: Vec<String> = all_factors
            .iter()
            .map(|factor_name| {
                let level = combo
                    .get(factor_name)
                    .cloned()
                    .unwrap_or_else(|| "Total".to_string()); // Default to "Total" if somehow missing, though generate_level_combinations should ensure it.
                format!("{}={}", factor_name, level)
            })
            .collect();
        let combo_key = combo_key_parts.join(";");

        let mut values_with_weights = Vec::new();
        for record in &all_records {
            let mut matches = true;
            for (factor, level) in combo {
                if level == "Total" {
                    continue;
                }
                if let Some(val) = record.get(factor) {
                    if val != level {
                        matches = false;
                        break;
                    }
                } else {
                    matches = false;
                    break;
                }
            }
            if matches {
                let dep_val = record.get(dep_var_name).and_then(|s| s.parse::<f64>().ok());
                let weight = record
                    .get("wls_weight_value")
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or(1.0);
                if let Some(num) = dep_val {
                    values_with_weights.push((num, weight));
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
