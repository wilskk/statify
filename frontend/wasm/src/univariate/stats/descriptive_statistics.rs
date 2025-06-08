use std::collections::HashMap;

use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ DescriptiveStatistics, DescriptiveStatGroup, StatsEntry },
};

use super::core::*;

fn build_groups_recursive(
    factor_names: &[String],
    factor_levels_map: &HashMap<String, Vec<String>>,
    stats_entries: &HashMap<String, StatsEntry>,
    level: usize,
    current_path: &mut Vec<(String, String)>
) -> Vec<DescriptiveStatGroup> {
    if level >= factor_names.len() {
        return vec![];
    }

    let factor_name = &factor_names[level];
    let mut levels = factor_levels_map.get(factor_name).cloned().unwrap_or_default();
    levels.push("Total".to_string());

    let mut groups = Vec::new();

    for value in levels {
        current_path.push((factor_name.clone(), value.clone()));

        // The key for Total for a factor at a given path is the path up to that factor,
        // with 'Total' for that factor and all subsequent factors.
        let mut key_map = current_path.iter().cloned().collect::<HashMap<_, _>>();
        for i in level + 1..factor_names.len() {
            key_map.insert(factor_names[i].clone(), "Total".to_string());
        }
        let key = factor_names
            .iter()
            .map(|f| format!("{}={}", f, key_map.get(f).unwrap_or(&"Total".to_string())))
            .collect::<Vec<_>>()
            .join(";");

        if let Some(stats) = stats_entries.get(&key) {
            let subgroups = build_groups_recursive(
                factor_names,
                factor_levels_map,
                stats_entries,
                level + 1,
                current_path
            );

            groups.push(DescriptiveStatGroup {
                factor_name: factor_name.clone(),
                factor_value: value.clone(),
                stats: stats.clone(),
                subgroups,
                is_total: value == "Total",
            });
        }

        current_path.pop();
    }

    groups
}

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

    if all_factors.is_empty() {
        // Handle case with no factors: just grand total
        let mut values_with_weights = Vec::new();
        if !data.dependent_data.is_empty() && !data.dependent_data[0].is_empty() {
            for i in 0..data.dependent_data[0].len() {
                if let Some(dep_rec) = data.dependent_data[0].get(i) {
                    if let Some(val_str) = dep_rec.values.get(dep_var_name) {
                        if let Ok(num) = data_value_to_string(val_str).parse::<f64>() {
                            values_with_weights.push((num, 1.0)); // Assuming weight 1.0
                        }
                    }
                }
            }
        }
        let stats = calculate_stats_for_values(&values_with_weights);
        return Ok(
            HashMap::from([
                (
                    dep_var_name.clone(),
                    DescriptiveStatistics {
                        dependent_variable: dep_var_name.clone(),
                        groups: vec![DescriptiveStatGroup {
                            factor_name: "".to_string(),
                            factor_value: "Total".to_string(),
                            stats: stats,
                            subgroups: vec![],
                            is_total: true,
                        }],
                        factor_names: all_factors,
                    },
                ),
            ])
        );
    }

    // Get factor levels and generate combinations (with 'Total')
    let mut factor_levels_with_total = Vec::new();
    let mut factor_levels_map = HashMap::new();
    for factor in &all_factors {
        let mut levels = get_factor_levels(data, factor)?;
        levels.sort();
        factor_levels_map.insert(factor.clone(), levels.clone());
        levels.push("Total".to_string());
        factor_levels_with_total.push((factor.clone(), levels));
    }

    let mut all_combinations = Vec::new();
    generate_level_combinations(
        &factor_levels_with_total,
        &mut HashMap::new(),
        0,
        &mut all_combinations
    );

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
                    .unwrap_or_else(|| "Total".to_string()); // Default to "Total" if somehow missing
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

    let groups = build_groups_recursive(
        &all_factors,
        &factor_levels_map,
        &stats_entries,
        0,
        &mut vec![]
    );

    Ok(
        HashMap::from([
            (
                dep_var_name.clone(),
                DescriptiveStatistics {
                    dependent_variable: dep_var_name.clone(),
                    groups,
                    factor_names: all_factors,
                },
            ),
        ])
    )
}
