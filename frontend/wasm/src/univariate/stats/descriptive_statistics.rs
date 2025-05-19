// descriptive_statistics.rs
use std::collections::{ HashMap, HashSet };

use crate::univariate::models::{
    config::UnivariateConfig,
    data::{ AnalysisData },
    result::{ DescriptiveStatistics, StatsEntry },
};

use super::common::{
    extract_dependent_value,
    extract_numeric_value,
    map_factors_to_datasets,
    add_factor_to_entry,
    collect_factor_levels_from_records,
    create_combination_key,
    calculate_stats_for_values,
};

/// Calculate descriptive statistics for univariate analysis
pub fn calculate_descriptive_statistics(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HashMap<String, DescriptiveStatistics>, String> {
    if !config.options.desc_stats || data.dependent_data.is_empty() {
        return Err(
            "Descriptive statistics not requested or no dependent data available".to_string()
        );
    }

    let dep_var_name = config.main.dep_var
        .as_ref()
        .ok_or_else(|| "No dependent variable specified in configuration".to_string())?;

    let all_factors = collect_all_factors(config);

    if all_factors.is_empty() {
        // This behavior is kept from previous versions. If no factors are defined,
        // descriptive stats by factor combinations are not meaningful in the current design.
        // An overall statistic (ignoring factors) could be a separate feature.
        return Err("No factors specified for descriptive statistics".to_string());
    }

    let combined_data = create_combined_dataset(
        data,
        dep_var_name,
        &all_factors,
        config.main.wls_weight.as_ref() // Pass WLS variable name if specified
    )?;

    let factor_levels = get_factor_levels_from_data(data, &all_factors);
    let all_combinations = generate_all_factor_combinations(&factor_levels);

    let stats_entries = calculate_stats_for_all_combinations(
        &combined_data,
        dep_var_name,
        &all_combinations
    );

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

/// Collect all factors from configuration
fn collect_all_factors(config: &UnivariateConfig) -> Vec<String> {
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
    all_factors
}

/// Calculate statistics for all factor combinations
fn calculate_stats_for_all_combinations(
    combined_data: &Vec<HashMap<String, String>>,
    dep_var_name: &str,
    all_combinations: &[HashMap<String, String>]
) -> HashMap<String, StatsEntry> {
    let mut stats_entries = HashMap::new();

    for combo in all_combinations {
        let combo_key = create_combination_key(combo);
        let filtered_values_with_weights = filter_dataset_for_combination(
            combined_data,
            dep_var_name,
            combo
        );

        if filtered_values_with_weights.iter().all(|(_, w)| *w <= 1e-9) {
            // Check if all weights are effectively zero
            // Try case-insensitive search if exact search yields no usable data (all zero weights)
            let case_insensitive_values_with_weights = filter_dataset_case_insensitive(
                combined_data,
                dep_var_name,
                combo
            );

            if !case_insensitive_values_with_weights.iter().all(|(_, w)| *w <= 1e-9) {
                let stats = calculate_stats_for_values(&case_insensitive_values_with_weights);
                stats_entries.insert(combo_key, stats);
            } else {
                // If both attempts yield no data (or all zero weights), insert empty stats
                stats_entries.insert(combo_key, StatsEntry { mean: 0.0, std_deviation: 0.0, n: 0 });
            }
        } else {
            let stats = calculate_stats_for_values(&filtered_values_with_weights);
            stats_entries.insert(combo_key, stats);
        }
    }
    stats_entries
}

/// Create a dataset combining dependent variable, all factor values, and WLS weight
fn create_combined_dataset(
    data: &AnalysisData,
    dep_var_name: &str,
    factors: &[String],
    wls_weight_var_name: Option<&String>
) -> Result<Vec<HashMap<String, String>>, String> {
    let mut combined_dataset = Vec::new();
    let factor_to_dataset_map = map_factors_to_datasets(data, factors);

    for (_record_set_idx, dep_record_set) in data.dependent_data.iter().enumerate() {
        for (record_idx, dep_record) in dep_record_set.iter().enumerate() {
            if let Some(dependent_value_str) = extract_dependent_value(dep_record, dep_var_name) {
                let mut entry: HashMap<String, String> = HashMap::new();
                entry.insert(dep_var_name.to_string(), dependent_value_str.to_string());

                let mut all_factors_found = true;
                for factor_name in factors {
                    if
                        !add_factor_to_entry(
                            data,
                            &factor_to_dataset_map,
                            factor_name,
                            record_idx,
                            dep_record,
                            &mut entry
                        )
                    {
                        all_factors_found = false;
                        break;
                    }
                }

                if all_factors_found {
                    let mut weight_str = "1.0".to_string(); // Default weight for all cases initially

                    if let Some(wls_var_name) = wls_weight_var_name {
                        // wls_var_name is &String
                        // Attempt to get weight from the FIRST WLS dataset only.
                        // If any step fails, weight remains "1.0".
                        if let Some(wls_data_sets) = &data.wls_data {
                            if let Some(first_wls_dataset) = wls_data_sets.get(0) {
                                // Get the Vec<DataRecord>
                                if let Some(wls_data_record) = first_wls_dataset.get(record_idx) {
                                    // Use wls_var_name (which is &String) directly for the HashMap get.
                                    if
                                        let Some(wls_data_val) =
                                            wls_data_record.values.get(wls_var_name)
                                    {
                                        if
                                            let Some(num_weight) =
                                                extract_numeric_value(wls_data_val)
                                        {
                                            if num_weight >= 0.0 {
                                                // Ensure non-negative
                                                weight_str = num_weight.to_string();
                                            }
                                            // If num_weight is negative, it remains "1.0" (default)
                                        }
                                        // If not numeric, remains "1.0" (default)
                                    }
                                    // If wls_var_name not in record, remains "1.0" (default)
                                }
                                // If record_idx out of bounds, remains "1.0" (default)
                            }
                            // If no first_wls_dataset, remains "1.0" (default)
                        }
                        // If wls_data is None, remains "1.0" (default)
                    }
                    // If wls_weight_var_name was None, weight is already "1.0"

                    entry.insert("wls_weight_value".to_string(), weight_str);
                    combined_dataset.push(entry);
                }
            }
        }
    }
    Ok(combined_dataset)
}

/// Get all unique values (levels) for each factor from the original data
fn get_factor_levels_from_data(
    data: &AnalysisData,
    factors: &[String]
) -> HashMap<String, Vec<String>> {
    let mut factor_levels_map = HashMap::new();
    let factor_to_dataset_map = map_factors_to_datasets(data, factors);

    for factor_name in factors {
        let mut levels = HashSet::new();

        if let Some((source_type, source_idx)) = factor_to_dataset_map.get(factor_name) {
            match source_type.as_str() {
                "fixed" =>
                    collect_factor_levels_from_records(
                        &data.fix_factor_data[*source_idx],
                        factor_name,
                        &mut levels
                    ),
                "random" => {
                    if let Some(rds) = &data.random_factor_data {
                        collect_factor_levels_from_records(
                            &rds[*source_idx],
                            factor_name,
                            &mut levels
                        );
                    }
                }
                "covariate" => {
                    if let Some(cds) = &data.covariate_data {
                        collect_factor_levels_from_records(
                            &cds[*source_idx],
                            factor_name,
                            &mut levels
                        );
                    }
                }
                _ => {}
            }
        } else {
            // If not mapped to a specific factor dataset, try collecting from all dependent data records
            for dep_record_set in &data.dependent_data {
                collect_factor_levels_from_records(dep_record_set, factor_name, &mut levels);
            }
        }

        if levels.is_empty() {
            levels.insert("Unknown".to_string()); // Default level if none found
        }
        levels.insert("Total".to_string()); // Ensure "Total" is always a level

        let mut sorted_levels: Vec<String> = levels.into_iter().collect();
        sorted_levels.sort_by(|a, b| {
            if a == "Total" {
                std::cmp::Ordering::Greater
            } else if b == "Total" {
                std::cmp::Ordering::Less
            } else {
                a.cmp(b)
            }
        });
        factor_levels_map.insert(factor_name.clone(), sorted_levels);
    }
    factor_levels_map
}

/// Generate all possible combinations of factor levels, including "Total"
fn generate_all_factor_combinations(
    factor_levels_map: &HashMap<String, Vec<String>>
) -> Vec<HashMap<String, String>> {
    let mut factors_vec: Vec<(String, Vec<String>)> = factor_levels_map
        .iter()
        .map(|(f_name, f_levels)| (f_name.clone(), f_levels.clone()))
        .collect();
    factors_vec.sort_by(|a, b| a.0.cmp(&b.0)); // Consistent ordering

    let mut all_combinations_list = Vec::new();
    let mut grand_total_combo = HashMap::new();
    for (f_name, _) in &factors_vec {
        grand_total_combo.insert(f_name.clone(), "Total".to_string());
    }
    if !grand_total_combo.is_empty() || factors_vec.is_empty() {
        // Add grand total if factors exist, or if no factors (empty map is a valid combo for overall)
        all_combinations_list.push(grand_total_combo);
    }

    let max_depth = if factors_vec.len() > 10 { 3 } else { factors_vec.len() }; // Limit interaction depth for performance
    for depth in 1..=max_depth {
        let mut selected_indices = Vec::new();
        generate_combinations_recursive(
            &factors_vec,
            &mut selected_indices,
            0,
            depth,
            &mut all_combinations_list
        );
    }
    // If no factors, all_combinations_list might just contain the empty HashMap (grand total).
    // If factors exist but generate_combinations_recursive doesn't add (e.g. max_depth=0, though it's 1..=),
    // it ensures at least grand_total is there.
    if factors_vec.is_empty() && all_combinations_list.is_empty() {
        all_combinations_list.push(HashMap::new()); // Ensure at least one combo for no-factor case
    }
    all_combinations_list
}

/// Recursively select factors to form combinations up to a max_depth
fn generate_combinations_recursive(
    factors_vec: &[(String, Vec<String>)],
    selected_indices: &mut Vec<usize>,
    start_idx: usize,
    max_depth: usize,
    all_combinations_list: &mut Vec<HashMap<String, String>>
) {
    if selected_indices.len() == max_depth {
        let mut base_combo = HashMap::new();
        for (i, (f_name, _)) in factors_vec.iter().enumerate() {
            if !selected_indices.contains(&i) {
                base_combo.insert(f_name.clone(), "Total".to_string());
            }
        }
        generate_level_combinations(
            factors_vec,
            selected_indices,
            &base_combo,
            0,
            all_combinations_list
        );
        return;
    }
    if start_idx >= factors_vec.len() {
        return;
    }

    for i in start_idx..factors_vec.len() {
        selected_indices.push(i);
        generate_combinations_recursive(
            factors_vec,
            selected_indices,
            i + 1,
            max_depth,
            all_combinations_list
        );
        selected_indices.pop();
    }
}

/// Generate all level combinations for the currently selected set of factors
fn generate_level_combinations(
    factors_vec: &[(String, Vec<String>)],
    selected_indices: &[usize],
    base_combo: &HashMap<String, String>,
    current_factor_idx_in_selection: usize,
    all_combinations_list: &mut Vec<HashMap<String, String>>
) {
    if current_factor_idx_in_selection >= selected_indices.len() {
        all_combinations_list.push(base_combo.clone());
        return;
    }

    let actual_factor_idx = selected_indices[current_factor_idx_in_selection];
    let (factor_name, levels) = &factors_vec[actual_factor_idx];

    for level in levels {
        if level != "Total" {
            // "Total" is handled by base_combo for non-selected factors
            let mut next_combo = base_combo.clone();
            next_combo.insert(factor_name.clone(), level.clone());
            generate_level_combinations(
                factors_vec,
                selected_indices,
                &next_combo,
                current_factor_idx_in_selection + 1,
                all_combinations_list
            );
        }
    }
}

/// Filter dataset for a specific factor combination, returning (value, weight) tuples
fn filter_dataset_for_combination(
    dataset: &[HashMap<String, String>],
    dep_var_name: &str,
    combination: &HashMap<String, String>
) -> Vec<(f64, f64)> {
    dataset
        .iter()
        .filter(|record| {
            combination.iter().all(|(factor, expected_val)| {
                if expected_val == "Total" {
                    return true;
                } // "Total" level matches any value for that factor
                match record.get(factor) {
                    Some(actual_val) => {
                        if actual_val == expected_val {
                            true
                        } else {
                            // Try numeric comparison for robustness
                            match (actual_val.parse::<f64>(), expected_val.parse::<f64>()) {
                                (Ok(v_num), Ok(e_num)) => (v_num - e_num).abs() < 1e-9,
                                _ => false,
                            }
                        }
                    }
                    None => false, // Factor not in record, so no match
                }
            })
        })
        .filter_map(|record| {
            let dep_val_opt = record.get(dep_var_name).and_then(|s| s.parse::<f64>().ok());
            let weight_opt = record
                .get("wls_weight_value") // Key used in create_combined_dataset
                .and_then(|s| s.parse::<f64>().ok())
                .map(|w| w.max(0.0)) // Ensure weight is non-negative
                .unwrap_or(1.0); // Default to 1.0 if missing or unparseable

            dep_val_opt.map(|dep_val| (dep_val, weight_opt))
        })
        .collect()
}

/// Case-insensitive version of filter_dataset_for_combination
fn filter_dataset_case_insensitive(
    dataset: &[HashMap<String, String>],
    dep_var_name: &str,
    combination: &HashMap<String, String>
) -> Vec<(f64, f64)> {
    dataset
        .iter()
        .filter(|record| {
            combination.iter().all(|(factor, expected_val)| {
                if expected_val == "Total" {
                    return true;
                }
                record
                    .get(factor)
                    .map_or(false, |actual_val| {
                        actual_val.to_lowercase() == expected_val.to_lowercase()
                    })
            })
        })
        .filter_map(|record| {
            let dep_val_opt = record.get(dep_var_name).and_then(|s| s.parse::<f64>().ok());
            let weight_opt = record
                .get("wls_weight_value")
                .and_then(|s| s.parse::<f64>().ok())
                .map(|w| w.max(0.0))
                .unwrap_or(1.0);
            dep_val_opt.map(|dep_val| (dep_val, weight_opt))
        })
        .collect()
}
