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

    // Process each case
    for case_idx in 0..num_cases {
        let mut row = Vec::with_capacity(variables.len());
        let mut has_missing = false;

        // For each variable, find its value across all datasets
        'var_loop: for var in &variables {
            for dataset in &data.target_data {
                if case_idx < dataset.len() {
                    if let Some(DataValue::Number(val)) = dataset[case_idx].values.get(var) {
                        row.push(*val);
                        continue 'var_loop;
                    }
                }
            }

            // Variable not found or not numeric
            has_missing = true;
            if !config.options.exclude_list_wise {
                row.push(0.0); // Default value if not excluding list-wise
            } else {
                break; // Skip this case if excluding list-wise
            }
        }

        // Add the row if complete or if not doing list-wise exclusion
        if (!has_missing || !config.options.exclude_list_wise) && row.len() == variables.len() {
            data_matrix.push(row);
            case_numbers.push((case_idx + 1) as i32);
        }
    }

    if data_matrix.is_empty() {
        return Err("No valid data records after preprocessing".to_string());
    }

    Ok(ProcessedData {
        variables,
        data_matrix,
        case_numbers,
    })
}
