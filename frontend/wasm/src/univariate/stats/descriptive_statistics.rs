// descriptive_statistics.rs
use std::collections::{ HashMap, HashSet, BTreeMap };
use rayon::prelude::*;
use statrs::statistics::{ Statistics, Mean, StandardDeviation };

use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ DescriptiveStatistics, StatGroup, StatsEntry },
};

use super::common::{ extract_dependent_value, data_value_to_string };

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

    // Get factors from config
    let factors = config.main.fix_factor.clone().unwrap_or_default();

    // Create combined dataset for easier processing
    let combined_data = create_combined_dataset(data, dep_var_name, &factors)?;

    // Process combinations and get entries with metadata
    let entries_with_metadata = process_all_combinations(&combined_data, dep_var_name, &factors)?;

    // Build hierarchical structure
    let groups = build_hierarchical_groups(&entries_with_metadata, &factors);

    // Return result
    Ok(
        HashMap::from([
            (
                dep_var_name.clone(),
                DescriptiveStatistics {
                    dependent_variable: dep_var_name.clone(),
                    groups,
                },
            ),
        ])
    )
}

/// Build hierarchical groups from flat entries with metadata
fn build_hierarchical_groups(
    entries_with_metadata: &[(StatsEntry, BTreeMap<String, String>)],
    factors: &[String]
) -> Vec<StatGroup> {
    if factors.is_empty() {
        return Vec::new();
    }

    // Start with the top-level factor
    let top_factor = &factors[0];
    let mut top_groups = HashMap::new();

    // Group entries by the top-level factor
    for (entry, metadata) in entries_with_metadata {
        let factor_value = metadata.get(top_factor).unwrap_or(&"Total".to_string()).clone();

        // Skip processing if not for the top level
        if
            factors.len() > 1 &&
            factors[1..].iter().any(|f| metadata.get(f).unwrap_or(&"Total".to_string()) != "Total")
        {
            continue;
        }

        top_groups.entry(factor_value.clone()).or_insert_with(|| StatGroup {
            factor_name: top_factor.clone(),
            factor_value,
            stats: StatsEntry {
                mean: 0.0,
                std_deviation: 0.0,
                n: 0,
            },
            subgroups: Vec::new(),
        }).stats = entry.clone();
    }

    // If there are more factors, process subgroups recursively
    if factors.len() > 1 {
        let remaining_factors = &factors[1..];

        for (top_value, group) in &mut top_groups {
            // Filter entries for this specific top-level value
            let filtered_entries: Vec<
                (StatsEntry, BTreeMap<String, String>)
            > = entries_with_metadata
                .iter()
                .filter(|(_, metadata)| {
                    metadata.get(top_factor).unwrap_or(&"Total".to_string()) == top_value
                })
                .cloned()
                .collect();

            // Recursively build subgroups
            group.subgroups = build_hierarchical_groups_recursive(
                &filtered_entries,
                remaining_factors
            );
        }
    }

    // Convert HashMap to sorted Vec
    let mut result: Vec<StatGroup> = top_groups.into_values().collect();

    // Sort groups (put "Total" at the end)
    result.sort_by(|a, b| {
        if a.factor_value == "Total" {
            return std::cmp::Ordering::Greater;
        }
        if b.factor_value == "Total" {
            return std::cmp::Ordering::Less;
        }

        // Try numeric sort if possible
        if
            let (Ok(a_num), Ok(b_num)) = (
                a.factor_value.parse::<f64>(),
                b.factor_value.parse::<f64>(),
            )
        {
            return a_num.partial_cmp(&b_num).unwrap_or(std::cmp::Ordering::Equal);
        }

        a.factor_value.cmp(&b.factor_value)
    });

    result
}

/// Recursive helper to build subgroups
fn build_hierarchical_groups_recursive(
    entries: &[(StatsEntry, BTreeMap<String, String>)],
    factors: &[String]
) -> Vec<StatGroup> {
    if factors.is_empty() {
        return Vec::new();
    }

    let current_factor = &factors[0];
    let mut groups = HashMap::new();

    // Group entries by the current factor
    for (entry, metadata) in entries {
        let factor_value = metadata.get(current_factor).unwrap_or(&"Total".to_string()).clone();

        // Skip processing if not for this level
        if
            factors.len() > 1 &&
            factors[1..].iter().any(|f| metadata.get(f).unwrap_or(&"Total".to_string()) != "Total")
        {
            continue;
        }

        groups.entry(factor_value.clone()).or_insert_with(|| StatGroup {
            factor_name: current_factor.clone(),
            factor_value,
            stats: StatsEntry {
                mean: 0.0,
                std_deviation: 0.0,
                n: 0,
            },
            subgroups: Vec::new(),
        }).stats = entry.clone();
    }

    // If there are more factors, process subgroups recursively
    if factors.len() > 1 {
        let remaining_factors = &factors[1..];

        for (value, group) in &mut groups {
            // Filter entries for this specific value
            let filtered_entries: Vec<(StatsEntry, BTreeMap<String, String>)> = entries
                .iter()
                .filter(|(_, metadata)| {
                    metadata.get(current_factor).unwrap_or(&"Total".to_string()) == value
                })
                .cloned()
                .collect();

            // Recursively build subgroups
            group.subgroups = build_hierarchical_groups_recursive(
                &filtered_entries,
                remaining_factors
            );
        }
    }

    // Convert HashMap to sorted Vec
    let mut result: Vec<StatGroup> = groups.into_values().collect();

    // Sort groups (put "Total" at the end)
    result.sort_by(|a, b| {
        if a.factor_value == "Total" {
            return std::cmp::Ordering::Greater;
        }
        if b.factor_value == "Total" {
            return std::cmp::Ordering::Less;
        }

        // Try numeric sort if possible
        if
            let (Ok(a_num), Ok(b_num)) = (
                a.factor_value.parse::<f64>(),
                b.factor_value.parse::<f64>(),
            )
        {
            return a_num.partial_cmp(&b_num).unwrap_or(std::cmp::Ordering::Equal);
        }

        a.factor_value.cmp(&b.factor_value)
    });

    result
}

/// Create unified dataset combining dependent and factor values
fn create_combined_dataset(
    data: &AnalysisData,
    dep_var_name: &str,
    factors: &[String]
) -> Result<Vec<HashMap<String, String>>, String> {
    let mut combined_dataset = Vec::new();

    for record_set in &data.dependent_data {
        for record in record_set {
            // Get dependent variable value
            if let Some(dependent_value) = extract_dependent_value(record, dep_var_name) {
                let mut entry = HashMap::new();

                // Add dependent variable
                entry.insert(dep_var_name.to_string(), dependent_value.to_string());

                // Add factor values
                for factor in factors {
                    if let Some(factor_value) = record.values.get(factor) {
                        entry.insert(factor.clone(), data_value_to_string(factor_value));
                    } else {
                        entry.insert(factor.clone(), "Total".to_string());
                    }
                }

                combined_dataset.push(entry);
            }
        }
    }

    Ok(combined_dataset)
}

/// Process all factor combinations and calculate statistics
fn process_all_combinations(
    dataset: &[HashMap<String, String>],
    dep_var_name: &str,
    factors: &[String]
) -> Result<Vec<(StatsEntry, BTreeMap<String, String>)>, String> {
    if dataset.is_empty() {
        return Ok(Vec::new());
    }

    // Create a HashMap to store unique factor levels
    let mut factor_levels = HashMap::new();

    // Extract unique levels for each factor
    for factor in factors {
        let mut levels = HashSet::new();

        for item in dataset {
            if let Some(value) = item.get(factor) {
                levels.insert(value.clone());
            }
        }

        // Add "Total" as a level
        levels.insert("Total".to_string());

        factor_levels.insert(factor.clone(), levels.into_iter().collect::<Vec<String>>());
    }

    // Generate all possible combinations of factor levels
    let mut combinations = Vec::new();
    let mut current = HashMap::new();

    // Special case for total
    let mut total_combo = HashMap::new();
    for factor in factors {
        total_combo.insert(factor.clone(), Some("Total".to_string()));
    }
    combinations.push(total_combo);

    // Generate all other combinations
    generate_all_combinations(&mut combinations, &mut current, factors, &factor_levels, 0);

    // Process each combination and calculate statistics
    let results = combinations
        .par_iter()
        .filter_map(|combination| {
            // Filter dataset for this combination
            let filtered_values = filter_dataset(dataset, dep_var_name, combination);

            if filtered_values.is_empty() {
                return None;
            }

            // Calculate statistics
            let mean = filtered_values.mean();
            let std_dev = filtered_values.std_dev();

            // Create stats entry
            let stats = StatsEntry {
                mean,
                std_deviation: std_dev,
                n: filtered_values.len(),
            };

            // Extract metadata for this combination
            let metadata = extract_entry_metadata(combination, factors);

            Some((stats, metadata))
        })
        .collect();

    Ok(results)
}

/// Generate all combinations of factor levels recursively
fn generate_all_combinations(
    combinations: &mut Vec<HashMap<String, Option<String>>>,
    current: &mut HashMap<String, Option<String>>,
    factors: &[String],
    factor_levels: &HashMap<String, Vec<String>>,
    factor_idx: usize
) {
    if factor_idx >= factors.len() {
        combinations.push(current.clone());
        return;
    }

    let factor = &factors[factor_idx];

    if let Some(levels) = factor_levels.get(factor) {
        // Handle each level
        for level in levels {
            if level != "Total" {
                // Create a combination where this factor is at this level
                let mut new_combo = current.clone();
                new_combo.insert(factor.clone(), Some(level.clone()));

                // Set all other factors to "Total"
                for i in factor_idx + 1..factors.len() {
                    new_combo.insert(factors[i].clone(), Some("Total".to_string()));
                }

                combinations.push(new_combo);

                // Create combinations where this level is combined with other factors' levels
                let mut with_other_factors = current.clone();
                with_other_factors.insert(factor.clone(), Some(level.clone()));
                generate_all_combinations(
                    combinations,
                    &mut with_other_factors,
                    factors,
                    factor_levels,
                    factor_idx + 1
                );
            }
        }
    }
}

/// Filter dataset based on a specific factor combination
fn filter_dataset(
    dataset: &[HashMap<String, String>],
    dep_var_name: &str,
    combination: &HashMap<String, Option<String>>
) -> Vec<f64> {
    dataset
        .iter()
        .filter(|item| {
            // Check if this item matches the combination
            combination.iter().all(|(factor, level)| {
                match level {
                    Some(l) if l != "Total" => {
                        item.get(factor).map_or(false, |value| value == l)
                    }
                    _ => true, // "Total" matches everything
                }
            })
        })
        .filter_map(|item| { item.get(dep_var_name).and_then(|value| value.parse::<f64>().ok()) })
        .collect()
}

/// Extract metadata from a factor combination
fn extract_entry_metadata(
    combination: &HashMap<String, Option<String>>,
    factors: &[String]
) -> BTreeMap<String, String> {
    let mut metadata = BTreeMap::new();

    for factor in factors {
        let value = combination
            .get(factor)
            .and_then(|v| v.clone())
            .unwrap_or_else(|| "Total".to_string());

        metadata.insert(factor.clone(), value);
    }

    metadata
}
