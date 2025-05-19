// descriptive_statistics.rs
use std::collections::{ HashMap, HashSet, BTreeMap };
use rayon::prelude::*;
use statrs::statistics::{ Statistics };

use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ DescriptiveStatistics, StatsEntry },
};

use super::common::{ extract_dependent_value, data_value_to_string, get_factor_levels };

/// Calculate descriptive statistics for univariate analysis
pub fn calculate_descriptive_statistics(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HashMap<String, DescriptiveStatistics>, String> {
    // Check if descriptive statistics are requested
    if !config.options.desc_stats || data.dependent_data.is_empty() {
        return Err(
            "Descriptive statistics not requested or no dependent data available".to_string()
        );
    }

    // Get dependent variable name
    let dep_var_name = config.main.dep_var
        .as_ref()
        .ok_or_else(|| "No dependent variable specified in configuration".to_string())?;

    // Collect all factors from config
    let mut all_factors = Vec::new();

    // Add fixed factors
    if let Some(fix_factors) = &config.main.fix_factor {
        all_factors.extend(fix_factors.clone());
    }

    // Add random factors
    if let Some(rand_factors) = &config.main.rand_factor {
        all_factors.extend(rand_factors.clone());
    }

    // Add covariates
    if let Some(covariates) = &config.main.covar {
        all_factors.extend(covariates.clone());
    }

    // If no factors, we can't calculate descriptive statistics
    if all_factors.is_empty() {
        return Err("No factors specified for descriptive statistics".to_string());
    }

    // Create combined dataset with all variables

    let combined_data = create_combined_dataset(data, dep_var_name, &all_factors)?;

    // Get all unique values for each factor

    let factor_levels = get_factor_levels_from_data(data, &all_factors);

    // Log the number of levels for each factor
    for (factor, levels) in &factor_levels {
    }

    // Generate all possible combinations of factor levels including Totals

    let all_combinations = generate_all_factor_combinations(&factor_levels);

    // Calculate statistics for each combination

    let mut stats_entries = HashMap::new();
    let total_combinations = all_combinations.len();
    let mut filtered_combinations = 0;

    for (i, combo) in all_combinations.iter().enumerate() {
        if i % 100 == 0 || i == total_combinations - 1 {
        }

        // Debug: log the combo being processed

        let combo_key = create_combination_key(combo);

        let filtered_values = filter_dataset_for_combination(&combined_data, dep_var_name, combo);

        if filtered_values.is_empty() {
            // For debugging: Try a case-insensitive search to see if that works

            let case_insensitive_values = filter_dataset_case_insensitive(
                &combined_data,
                dep_var_name,
                combo
            );

            if !case_insensitive_values.is_empty() {
                let stats = calculate_stats_for_values(&case_insensitive_values);
                stats_entries.insert(combo_key, stats);
                filtered_combinations += 1;
            }
        } else {
            let stats = calculate_stats_for_values(&filtered_values);
            stats_entries.insert(combo_key, stats);
            filtered_combinations += 1;
        }
    }

    // Return the descriptive statistics

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

/// Create a dataset combining dependent variable and all factor values
fn create_combined_dataset(
    data: &AnalysisData,
    dep_var_name: &str,
    factors: &[String]
) -> Result<Vec<HashMap<String, String>>, String> {
    let mut combined_dataset = Vec::new();

    // Log the first few records from each data source for debugging
    if let Some(first_records) = data.dependent_data.first().and_then(|rs| rs.first()) {
    }

    if let Some(first_records) = data.fix_factor_data.first().and_then(|rs| rs.first()) {
    }

    // Map fixed factor variables to their data sets
    let mut factor_to_dataset = HashMap::new();
    for factor in factors {
        for (idx, defs) in data.fix_factor_data_defs.iter().enumerate() {
            if defs.iter().any(|def| &def.name == factor) {
                factor_to_dataset.insert(factor.clone(), ("fixed", idx));
            }
        }
    }

    // Map random factor variables
    if
        let (Some(rand_defs), Some(rand_data)) = (
            &data.random_factor_data_defs,
            &data.random_factor_data,
        )
    {
        for factor in factors {
            for (idx, defs) in rand_defs.iter().enumerate() {
                if defs.iter().any(|def| &def.name == factor) {
                    factor_to_dataset.insert(factor.clone(), ("random", idx));
                }
            }
        }
    }

    // Map covariate variables
    if let (Some(cov_defs), Some(cov_data)) = (&data.covariate_data_defs, &data.covariate_data) {
        for factor in factors {
            for (idx, defs) in cov_defs.iter().enumerate() {
                if defs.iter().any(|def| &def.name == factor) {
                    factor_to_dataset.insert(factor.clone(), ("covariate", idx));
                }
            }
        }
    }

    // If we couldn't find a factor in any dataset, log a warning
    for factor in factors {
        if !factor_to_dataset.contains_key(factor) {
        }
    }

    for (record_set_idx, record_set) in data.dependent_data.iter().enumerate() {
        for (record_idx, record) in record_set.iter().enumerate() {
            // Get dependent variable value
            if let Some(dependent_value) = extract_dependent_value(record, dep_var_name) {
                let mut entry = HashMap::new();

                // Add dependent variable
                entry.insert(dep_var_name.to_string(), dependent_value.to_string());

                // Add all factors from their respective datasets
                for factor in factors {
                    let mut factor_found = false;

                    if let Some((source_type, source_idx)) = factor_to_dataset.get(factor) {
                        match *source_type {
                            "fixed" => {
                                if
                                    let Some(fix_record) = data.fix_factor_data
                                        .get(*source_idx)
                                        .and_then(|records| records.get(record_idx))
                                {
                                    if let Some(value) = fix_record.values.get(factor) {
                                        entry.insert(factor.clone(), data_value_to_string(value));
                                        factor_found = true;
                                    }
                                }
                            }
                            "random" => {
                                if let Some(rand_data) = &data.random_factor_data {
                                    if
                                        let Some(rand_record) = rand_data
                                            .get(*source_idx)
                                            .and_then(|records| records.get(record_idx))
                                    {
                                        if let Some(value) = rand_record.values.get(factor) {
                                            entry.insert(
                                                factor.clone(),
                                                data_value_to_string(value)
                                            );
                                            factor_found = true;
                                        }
                                    }
                                }
                            }
                            "covariate" => {
                                if let Some(cov_data) = &data.covariate_data {
                                    if
                                        let Some(cov_record) = cov_data
                                            .get(*source_idx)
                                            .and_then(|records| records.get(record_idx))
                                    {
                                        if let Some(value) = cov_record.values.get(factor) {
                                            entry.insert(
                                                factor.clone(),
                                                data_value_to_string(value)
                                            );
                                            factor_found = true;
                                        }
                                    }
                                }
                            }
                            _ => {}
                        }
                    }

                    // Also check in the dependent record itself
                    if !factor_found {
                        if let Some(value) = record.values.get(factor) {
                            entry.insert(factor.clone(), data_value_to_string(value));
                            factor_found = true;
                        }
                    }
                }

                // Check if all factors are present
                let missing_factors: Vec<_> = factors
                    .iter()
                    .filter(|f| !entry.contains_key(*f))
                    .collect();

                if !missing_factors.is_empty() {
                    // Skip this record if any factors are missing
                    continue;
                }

                // Log entry contents if it's one of the first few records
                if record_idx < 3 {
                }

                combined_dataset.push(entry);
            }
        }
    }

    Ok(combined_dataset)
}

/// Get all unique values for each factor directly from the original data (not from combined dataset)
fn get_factor_levels_from_data(
    data: &AnalysisData,
    factors: &[String]
) -> HashMap<String, Vec<String>> {
    let mut factor_levels = HashMap::new();

    // Map fixed factor variables to their data sets
    let mut factor_to_dataset = HashMap::new();
    for factor in factors {
        for (idx, defs) in data.fix_factor_data_defs.iter().enumerate() {
            if defs.iter().any(|def| &def.name == factor) {
                factor_to_dataset.insert(factor.clone(), ("fixed", idx));
            }
        }
    }

    // Map random factor variables
    if let (Some(rand_defs), Some(_)) = (&data.random_factor_data_defs, &data.random_factor_data) {
        for factor in factors {
            for (idx, defs) in rand_defs.iter().enumerate() {
                if defs.iter().any(|def| &def.name == factor) {
                    factor_to_dataset.insert(factor.clone(), ("random", idx));
                }
            }
        }
    }

    // Map covariate variables
    if let (Some(cov_defs), Some(_)) = (&data.covariate_data_defs, &data.covariate_data) {
        for factor in factors {
            for (idx, defs) in cov_defs.iter().enumerate() {
                if defs.iter().any(|def| &def.name == factor) {
                    factor_to_dataset.insert(factor.clone(), ("covariate", idx));
                }
            }
        }
    }

    for factor in factors {
        let mut levels = std::collections::HashSet::new();
        let mut level_sources = Vec::new();

        if let Some((source_type, source_idx)) = factor_to_dataset.get(factor) {
            match *source_type {
                "fixed" => {
                    // Get values from fixed factor data
                    for (j, record) in data.fix_factor_data[*source_idx].iter().enumerate() {
                        if let Some(value) = record.values.get(factor) {
                            let str_value = data_value_to_string(value);
                            levels.insert(str_value.clone());
                            if j < 3 {
                                // Log just a few examples
                                level_sources.push(
                                    format!(
                                        "{}={} (from fixed factor {})",
                                        factor,
                                        str_value,
                                        source_idx
                                    )
                                );
                            }
                        }
                    }
                }
                "random" => {
                    if let Some(random_data) = &data.random_factor_data {
                        for (j, record) in random_data[*source_idx].iter().enumerate() {
                            if let Some(value) = record.values.get(factor) {
                                let str_value = data_value_to_string(value);
                                levels.insert(str_value.clone());
                                if j < 3 {
                                    // Log just a few examples
                                    level_sources.push(
                                        format!(
                                            "{}={} (from random factor {})",
                                            factor,
                                            str_value,
                                            source_idx
                                        )
                                    );
                                }
                            }
                        }
                    }
                }
                "covariate" => {
                    if let Some(cov_data) = &data.covariate_data {
                        for (j, record) in cov_data[*source_idx].iter().enumerate() {
                            if let Some(value) = record.values.get(factor) {
                                let str_value = data_value_to_string(value);
                                levels.insert(str_value.clone());
                                if j < 3 {
                                    // Log just a few examples
                                    level_sources.push(
                                        format!(
                                            "{}={} (from covariate {})",
                                            factor,
                                            str_value,
                                            source_idx
                                        )
                                    );
                                }
                            }
                        }
                    }
                }
                _ => {}
            }
        } else {
            // Try to find in all data sources

            // Check in dependent data
            for (i, record_set) in data.dependent_data.iter().enumerate() {
                for (j, record) in record_set.iter().enumerate() {
                    if let Some(value) = record.values.get(factor) {
                        let str_value = data_value_to_string(value);
                        levels.insert(str_value.clone());
                        if j < 3 {
                            level_sources.push(
                                format!("{}={} (from dependent data {})", factor, str_value, i)
                            );
                        }
                    }
                }
            }
        }

        // If no levels found, log a warning
        if levels.is_empty() {
            // Add a default level to avoid empty factor levels
            levels.insert("Unknown".to_string());
        }

        // Add Total
        levels.insert("Total".to_string());

        // Sort, Total at the end
        let mut sorted_levels: Vec<String> = levels.into_iter().collect();
        sorted_levels.sort_by(|a, b| {
            if a == "Total" {
                return std::cmp::Ordering::Greater;
            }
            if b == "Total" {
                return std::cmp::Ordering::Less;
            }
            a.cmp(b)
        });

        factor_levels.insert(factor.clone(), sorted_levels);
    }
    factor_levels
}

/// Generate all possible combinations of factor levels including Totals
fn generate_all_factor_combinations(
    factor_levels: &HashMap<String, Vec<String>>
) -> Vec<HashMap<String, String>> {
    let mut factors: Vec<(String, Vec<String>)> = factor_levels
        .iter()
        .map(|(factor, levels)| (factor.clone(), levels.clone()))
        .collect();

    // Sort factors to ensure consistent ordering
    factors.sort_by(|a, b| a.0.cmp(&b.0));

    let mut all_combinations = Vec::new();

    // Add the grand total combination (all factors = Total)
    let mut grand_total = HashMap::new();
    for (factor, _) in &factors {
        grand_total.insert(factor.clone(), "Total".to_string());
    }
    all_combinations.push(grand_total);

    // Maximum depth of interactions to generate (limit for large number of factors)
    let max_interaction_depth = if factors.len() > 10 { 3 } else { factors.len() };

    // Generate combinations for each interaction depth (1-way, 2-way, 3-way, etc.)
    for depth in 1..=max_interaction_depth {
        let mut selected_factors = Vec::new();
        generate_combinations_recursive(
            &factors,
            &mut selected_factors,
            0,
            depth,
            &mut all_combinations
        );
    }

    all_combinations
}

/// Recursively select factors for combinations
fn generate_combinations_recursive(
    factors: &[(String, Vec<String>)],
    selected_factors: &mut Vec<usize>,
    start_index: usize,
    max_depth: usize,
    all_combinations: &mut Vec<HashMap<String, String>>
) {
    // If we've selected enough factors, generate level combinations
    if selected_factors.len() == max_depth {
        let selected_factors_names: Vec<String> = selected_factors
            .iter()
            .map(|&idx| factors[idx].0.clone())
            .collect();
        let mut base_combination = HashMap::new();

        // Set all non-selected factors to "Total"
        for (i, (factor, _)) in factors.iter().enumerate() {
            if !selected_factors.contains(&i) {
                base_combination.insert(factor.clone(), "Total".to_string());
            }
        }

        // Generate level combinations for selected factors
        let combinations_before = all_combinations.len();
        generate_level_combinations(
            factors,
            selected_factors,
            &base_combination,
            0,
            all_combinations
        );

        return;
    }

    // Skip if we've reached the end of factors
    if start_index >= factors.len() {
        return;
    }

    // For each remaining factor, either select it or skip it
    for i in start_index..factors.len() {
        selected_factors.push(i);
        generate_combinations_recursive(
            factors,
            selected_factors,
            i + 1,
            max_depth,
            all_combinations
        );
        selected_factors.pop();
    }
}

/// Generate all level combinations for selected factors
fn generate_level_combinations(
    factors: &[(String, Vec<String>)],
    selected_factors: &[usize],
    base_combination: &HashMap<String, String>,
    current_index: usize,
    all_combinations: &mut Vec<HashMap<String, String>>
) {
    if current_index >= selected_factors.len() {
        // We've assigned values to all selected factors
        all_combinations.push(base_combination.clone());
        return;
    }

    let factor_idx = selected_factors[current_index];
    let (factor, levels) = &factors[factor_idx];

    for level in levels {
        // Skip "Total" level when generating specific combinations
        if level != "Total" {
            let mut new_combination = base_combination.clone();
            new_combination.insert(factor.clone(), level.clone());

            generate_level_combinations(
                factors,
                selected_factors,
                &new_combination,
                current_index + 1,
                all_combinations
            );
        }
    }
}

/// Filter the dataset to get values matching a specific combination
fn filter_dataset_for_combination(
    dataset: &[HashMap<String, String>],
    dep_var_name: &str,
    combination: &HashMap<String, String>
) -> Vec<f64> {
    let filtered = dataset
        .iter()
        .filter(|record| {
            let matches = combination.iter().all(|(factor, expected_value)| {
                if expected_value == "Total" {
                    true // Total matches everything
                } else {
                    let result = match record.get(factor) {
                        Some(value) => {
                            // Try exact match first
                            if value == expected_value {
                                true
                            } else {
                                // Try numeric comparison
                                let numeric_match = match
                                    (value.parse::<f64>(), expected_value.parse::<f64>())
                                {
                                    (Ok(v), Ok(e)) => (v - e).abs() < 1e-6,
                                    _ => false,
                                };
                                numeric_match
                            }
                        }
                        None => { false }
                    };
                    result
                }
            });
            if !matches {
            }
            matches
        })
        .filter_map(|record| {
            let parse_result = record.get(dep_var_name).and_then(|value| value.parse::<f64>().ok());
            if parse_result.is_none() {
            }
            parse_result
        })
        .collect::<Vec<f64>>();

    filtered
}

/// Calculate statistics for a set of values
fn calculate_stats_for_values(values: &[f64]) -> StatsEntry {
    if values.is_empty() {
        return StatsEntry {
            mean: 0.0,
            std_deviation: 0.0,
            n: 0,
        };
    }

    let mean = values.mean();
    let std_deviation = if values.len() > 1 { values.std_dev() } else { 0.0 };

    StatsEntry {
        mean,
        std_deviation,
        n: values.len(),
    }
}

/// Create a string key for a factor combination
fn create_combination_key(combination: &HashMap<String, String>) -> String {
    let mut sorted_pairs: Vec<_> = combination.iter().collect();
    sorted_pairs.sort_by(|a, b| a.0.cmp(b.0));

    sorted_pairs
        .iter()
        .map(|(factor, value)| format!("{}={}", factor, value))
        .collect::<Vec<_>>()
        .join(".")
}

/// Filter dataset with case-insensitive matching
fn filter_dataset_case_insensitive(
    dataset: &[HashMap<String, String>],
    dep_var_name: &str,
    combination: &HashMap<String, String>
) -> Vec<f64> {
    dataset
        .iter()
        .filter(|record| {
            combination.iter().all(|(factor, expected_value)| {
                if expected_value == "Total" {
                    true // Total matches everything
                } else {
                    record
                        .get(factor)
                        .map_or(
                            false,
                            |value| value.to_lowercase() == expected_value.to_lowercase()
                        )
                }
            })
        })
        .filter_map(|record| {
            record.get(dep_var_name).and_then(|value| value.parse::<f64>().ok())
        })
        .collect()
}
