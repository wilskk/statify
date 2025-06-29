use std::collections::HashSet;

use crate::kmeans::models::{
    config::ClusterConfig,
    data::{ AnalysisData, DataValue },
    result::ProcessedData,
};

pub fn preprocess_data(
    data: &AnalysisData,
    config: &ClusterConfig
) -> Result<ProcessedData, String> {
    if data.target_data.is_empty() {
        return Err("No target data provided".to_string());
    }

    // Determine variables to use
    let variables = if let Some(target_var) = &config.main.target_var {
        target_var.clone()
    } else {
        // Collect all numeric variables from all datasets
        data.target_data
            .iter()
            .flat_map(|dataset| {
                dataset.iter().flat_map(|record| {
                    record.values
                        .iter()
                        .filter(|(_, value)| matches!(value, DataValue::Number(_)))
                        .map(|(key, _)| key.clone())
                })
            })
            .collect::<HashSet<String>>()
            .into_iter()
            .collect()
    };

    if variables.is_empty() {
        return Err("No valid clustering variables found".to_string());
    }

    // Get the number of cases
    let num_cases = data.target_data.first().map_or(0, |ds| ds.len());
    if num_cases == 0 {
        return Err("No cases found in data".to_string());
    }

    let mut data_matrix = Vec::new();
    let mut case_numbers = Vec::new();

    // Determine which exclusion method to use (list-wise takes precedence)
    let use_list_wise = config.options.exclude_list_wise;
    let use_pair_wise = config.options.exclude_pair_wise && !use_list_wise;

    // Process each case
    for case_idx in 0..num_cases {
        let mut row = Vec::with_capacity(variables.len());
        let mut has_missing = false;
        let mut complete_variables = Vec::new();

        // For each variable, find its value across all datasets
        for var in &variables {
            let mut var_found = false;

            for dataset in &data.target_data {
                if case_idx < dataset.len() {
                    if let Some(DataValue::Number(val)) = dataset[case_idx].values.get(var) {
                        row.push(*val);
                        complete_variables.push(var.clone());
                        var_found = true;
                        break;
                    }
                }
            }

            if !var_found {
                // Variable not found or not numeric
                has_missing = true;

                if use_list_wise {
                    break; // Skip this case if excluding list-wise
                } else if !use_pair_wise {
                    row.push(0.0); // Default value if not using any exclusion method
                }
                // For pair-wise, we simply skip this variable
            }
        }

        if use_list_wise {
            // For list-wise exclusion: only include complete cases
            if !has_missing && row.len() == variables.len() {
                data_matrix.push(row);
                case_numbers.push((case_idx + 1) as i32);
            }
        } else if use_pair_wise {
            // For pair-wise exclusion: include the case but only with non-missing variables
            if !complete_variables.is_empty() {
                // If using pair-wise, we need to track which variables were used for this case
                data_matrix.push(row);
                case_numbers.push((case_idx + 1) as i32);
            }
        } else {
            // No exclusion: include all cases with default values for missing variables
            if row.len() == variables.len() {
                data_matrix.push(row);
                case_numbers.push((case_idx + 1) as i32);
            }
        }
    }

    if data_matrix.is_empty() {
        return Err("No valid data records after preprocessing".to_string());
    }

    // Extract case names if case_data and case_target are available
    let case_names = if let Some(case_target) = &config.main.case_target {
        let mut names = Vec::with_capacity(case_numbers.len());

        for &case_idx in &case_numbers {
            let idx = (case_idx - 1) as usize; // Convert back to 0-based index
            let mut name = None;

            // Search for case name in case_data
            for dataset in &data.case_data {
                if idx < dataset.len() {
                    if let Some(value) = dataset[idx].values.get(case_target) {
                        match value {
                            DataValue::Text(text) => {
                                name = Some(text.clone());
                            }
                            DataValue::Number(num) => {
                                name = Some(num.to_string());
                            }
                            DataValue::Boolean(b) => {
                                name = Some(b.to_string());
                            }
                            _ => {}
                        }
                        break;
                    }
                }
            }

            if let Some(name_value) = name {
                names.push(name_value);
            } else {
                names.push(String::new()); // Use empty string instead of "Case X"
            }
        }

        Some(names)
    } else {
        None
    };

    Ok(ProcessedData {
        variables,
        data_matrix,
        case_numbers,
        case_names,
    })
}
