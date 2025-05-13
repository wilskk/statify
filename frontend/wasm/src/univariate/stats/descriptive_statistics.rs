// descriptive_statistics.rs
use std::collections::{ HashMap, HashSet, BTreeMap };

use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ DescriptiveStatistics, StatGroup, StatsEntry },
};

use super::core::{
    calculate_mean,
    calculate_std_deviation,
    extract_dependent_value,
    data_value_to_string,
};

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
    let dep_var_name = match &config.main.dep_var {
        Some(name) => name,
        None => {
            return Err("No dependent variable specified in configuration".to_string());
        }
    };

    let mut result = HashMap::new();

    // Get factors from config
    let factors = match &config.main.fix_factor {
        Some(f) => f.clone(),
        None => Vec::new(),
    };

    // Create combined dataset for easier processing
    let combined_data = create_combined_dataset(data, dep_var_name, &factors)?;

    // Process combinations and get entries with metadata
    let entries_with_metadata = process_all_combinations(&combined_data, dep_var_name, &factors)?;

    // Build hierarchical structure
    let groups = build_hierarchical_groups(&entries_with_metadata, &factors);

    // Store result
    result.insert(dep_var_name.clone(), DescriptiveStatistics {
        dependent_variable: dep_var_name.clone(),
        groups,
    });

    Ok(result)
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

/// Create a combined dataset for easier processing
fn create_combined_dataset(
    data: &AnalysisData,
    dep_var_name: &str,
    factors: &[String]
) -> Result<Vec<HashMap<String, String>>, String> {
    let mut combined = Vec::new();

    // For each record in the dependent data
    for (record_idx, record_set) in data.dependent_data.iter().enumerate() {
        if record_idx >= record_set.len() {
            continue;
        }

        for (idx, record) in record_set.iter().enumerate() {
            // Extract dependent variable value
            if let Some(value) = extract_dependent_value(record, dep_var_name) {
                let mut record_data = HashMap::new();

                // Add dependent variable value
                record_data.insert(dep_var_name.to_string(), value.to_string());

                // Add factor values
                for (factor_idx, factor) in factors.iter().enumerate() {
                    if
                        factor_idx < data.fix_factor_data.len() &&
                        idx < data.fix_factor_data[factor_idx].len()
                    {
                        let factor_record = &data.fix_factor_data[factor_idx][idx];
                        if let Some(val) = factor_record.values.get(factor) {
                            record_data.insert(factor.clone(), data_value_to_string(val));
                        }
                    }
                }

                // Add complete record to dataset
                combined.push(record_data);
            }
        }
    }

    Ok(combined)
}

/// Process all combinations of factors including totals
fn process_all_combinations(
    dataset: &[HashMap<String, String>],
    dep_var_name: &str,
    factors: &[String]
) -> Result<Vec<(StatsEntry, BTreeMap<String, String>)>, String> {
    let mut entries_with_metadata = Vec::new();
    let mut factor_levels = HashMap::new();

    // Get unique values for each factor
    for factor in factors {
        let mut values = HashSet::new();

        for record in dataset {
            if let Some(value) = record.get(factor) {
                values.insert(value.clone());
            }
        }

        // Convert to sorted vector
        let mut sorted_values: Vec<String> = values.into_iter().collect();

        // Try to sort numerically if all values are numeric
        if sorted_values.iter().all(|v| v.parse::<f64>().is_ok()) {
            sorted_values.sort_by(|a, b| {
                let a_val = a.parse::<f64>().unwrap();
                let b_val = b.parse::<f64>().unwrap();
                a_val.partial_cmp(&b_val).unwrap()
            });
        } else {
            sorted_values.sort();
        }

        factor_levels.insert(factor.clone(), sorted_values);
    }

    // Generate all combinations including "Total" at each level
    let mut combinations = Vec::new();
    generate_all_combinations(&mut combinations, &mut HashMap::new(), factors, &factor_levels, 0);

    // Process each combination
    for combination in combinations {
        // Calculate statistics for this combination
        let filtered_values = filter_dataset(dataset, dep_var_name, &combination);

        if !filtered_values.is_empty() {
            let mean = calculate_mean(&filtered_values);
            let std_deviation = calculate_std_deviation(&filtered_values, Some(mean));

            // Create entry
            let entry = StatsEntry {
                mean,
                std_deviation,
                n: filtered_values.len(),
            };

            // Extract metadata for this combination
            let metadata = extract_entry_metadata(&combination, factors);

            // Store entry with its metadata
            entries_with_metadata.push((entry, metadata));
        }
    }

    // Sort entries by metadata for hierarchical organization
    entries_with_metadata.sort_by(|(_, a_meta), (_, b_meta)| {
        for factor in factors {
            // Use string references directly to avoid temporary String objects
            let empty_string = String::new(); // Create a longer-lived empty string
            let a_val = a_meta.get(factor).unwrap_or(&empty_string);
            let b_val = b_meta.get(factor).unwrap_or(&empty_string);

            // "Total" should come after specific values
            if a_val == "Total" && b_val != "Total" {
                return std::cmp::Ordering::Greater;
            } else if a_val != "Total" && b_val == "Total" {
                return std::cmp::Ordering::Less;
            }

            // Try numeric comparison if possible
            if let (Ok(a_num), Ok(b_num)) = (a_val.parse::<f64>(), b_val.parse::<f64>()) {
                match a_num.partial_cmp(&b_num) {
                    Some(ord) if ord != std::cmp::Ordering::Equal => {
                        return ord;
                    }
                    _ => {
                        continue;
                    }
                }
            }

            // Fall back to string comparison
            match a_val.cmp(b_val) {
                std::cmp::Ordering::Equal => {
                    continue;
                }
                other => {
                    return other;
                }
            }
        }

        std::cmp::Ordering::Equal
    });

    Ok(entries_with_metadata)
}

/// Generate all combinations of factor levels including "Total" at each level
fn generate_all_combinations(
    combinations: &mut Vec<HashMap<String, Option<String>>>,
    current: &mut HashMap<String, Option<String>>,
    factors: &[String],
    factor_levels: &HashMap<String, Vec<String>>,
    factor_idx: usize
) {
    if factor_idx >= factors.len() {
        // We've processed all factors, add this combination
        combinations.push(current.clone());
        return;
    }

    let current_factor = &factors[factor_idx];

    // Add combinations with each specific value for this factor
    if let Some(values) = factor_levels.get(current_factor) {
        for value in values {
            current.insert(current_factor.clone(), Some(value.clone()));
            generate_all_combinations(
                combinations,
                current,
                factors,
                factor_levels,
                factor_idx + 1
            );
        }
    }

    // Add combination with "Total" for this factor
    current.insert(current_factor.clone(), None); // None represents "Total"
    generate_all_combinations(combinations, current, factors, factor_levels, factor_idx + 1);
}

/// Filter dataset based on combination and extract dependent variable values
fn filter_dataset(
    dataset: &[HashMap<String, String>],
    dep_var_name: &str,
    combination: &HashMap<String, Option<String>>
) -> Vec<f64> {
    let mut values = Vec::new();

    for record in dataset {
        let mut matches = true;

        // Check if record matches all specified factor values
        for (factor, value_opt) in combination {
            if let Some(required_value) = value_opt {
                // This factor has a specific value requirement
                if record.get(factor) != Some(required_value) {
                    matches = false;
                    break;
                }
            }
            // If value_opt is None, this means "Total" for this factor
            // so we don't filter on it
        }

        if matches {
            // Record matches criteria, extract dependent variable value
            if let Some(val_str) = record.get(dep_var_name) {
                if let Ok(value) = val_str.parse::<f64>() {
                    values.push(value);
                }
            }
        }
    }

    values
}

/// Extract metadata to organize output hierarchically
fn extract_entry_metadata(
    combination: &HashMap<String, Option<String>>,
    factors: &[String]
) -> BTreeMap<String, String> {
    let mut metadata = BTreeMap::new();

    for factor in factors {
        let value = match combination.get(factor) {
            Some(Some(val)) => val.clone(),
            _ => "Total".to_string(),
        };

        metadata.insert(factor.clone(), value);
    }

    metadata
}
