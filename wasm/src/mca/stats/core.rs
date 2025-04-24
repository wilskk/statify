use nalgebra::{ DMatrix, DVector, SVD };
use std::collections::{ HashMap, HashSet };
use rand::Rng;
use rand_distr::{ Distribution, Normal };

use crate::mca::models::{
    config::{ MCAConfig, NormalizationMethod, DiscretizeMethod },
    data::{ AnalysisData, DataRecord, DataValue, VariableDefinition },
    result::*,
};

/// Helper function to check if a value is missing
fn is_missing(value: &DataValue) -> bool {
    match value {
        DataValue::Number(val) => *val < 1.0,
        DataValue::Null => true,
        _ => false,
    }
}

/// Parse variable and weight from "variable_name (weight)" format
fn parse_variable_weight(var_str: &str) -> (String, f64) {
    if let Some(paren_pos) = var_str.find('(') {
        let variable = var_str[0..paren_pos].trim().to_string();
        let weight_str = var_str[paren_pos..].trim_matches(|c| (c == '(' || c == ')' || c == ' '));

        if let Ok(weight) = weight_str.parse::<f64>() {
            return (variable, weight);
        }
    }

    // Default if no weight specified or parsing failed
    (var_str.trim().to_string(), 1.0)
}

/// Parse discretization settings from variable strings
fn parse_discretization_setting(var_str: &str) -> (String, String, Option<u8>, Option<bool>) {
    if let Some(paren_pos) = var_str.find('(') {
        let variable = var_str[0..paren_pos].trim().to_string();
        let settings_str = var_str[paren_pos..].trim_matches(
            |c| (c == '(' || c == ')' || c == ' ')
        );

        let parts: Vec<&str> = settings_str.split_whitespace().collect();

        if parts.is_empty() {
            // Default if no settings
            return (variable, "Unspecified".to_string(), None, None);
        }

        let method = parts[0].to_string();

        if method == "Grouping" {
            if parts.len() == 2 {
                // Format: "age (Grouping 9)" - Equal Intervals
                if let Ok(value) = parts[1].parse::<u8>() {
                    return (variable, method, Some(value), None);
                }
            } else if parts.len() >= 3 {
                // Format: "age (Grouping Normal 7)" or "age (Grouping Uniform 7)"
                let distribution = match parts[1] {
                    "Normal" => true, // Normal distribution
                    "Uniform" => false, // Uniform distribution
                    _ => true, // Default to Normal
                };

                if let Ok(value) = parts[2].parse::<u8>() {
                    return (variable, method, Some(value), Some(distribution));
                }
            }
        }

        return (variable, method, None, None);
    }

    // Default if no settings
    (var_str.trim().to_string(), "Unspecified".to_string(), None, None)
}

/// Parse missing value handling settings
fn parse_missing_value_strategy(var_str: &str) -> (String, String) {
    if let Some(paren_pos) = var_str.find('(') {
        let variable = var_str[0..paren_pos].trim().to_string();
        let strategy_str = var_str[paren_pos..].trim_matches(
            |c| (c == '(' || c == ')' || c == ' ')
        );

        return (variable, strategy_str.to_string());
    }

    // No strategy specified, return the variable name and empty strategy
    (var_str.trim().to_string(), "".to_string())
}

/// Calculate the mode (most frequent value) for a variable
fn calculate_mode(dataset: &[DataRecord], var_name: &str) -> Option<DataValue> {
    let mut value_counts = HashMap::new();

    for record in dataset {
        if let Some(value) = record.values.get(var_name) {
            if !is_missing(value) {
                *value_counts.entry(value.clone()).or_insert(0) += 1;
            }
        }
    }

    if value_counts.is_empty() {
        return None;
    }

    value_counts
        .into_iter()
        .max_by_key(|(_, count)| *count)
        .map(|(value, _)| value)
}

/// Find the maximum category value for a variable
fn find_max_category(dataset: &[DataRecord], var_name: &str) -> f64 {
    let mut max_cat = 0.0;

    for record in dataset {
        if let Some(DataValue::Number(val)) = record.values.get(var_name) {
            if *val >= 1.0 && *val > max_cat {
                max_cat = *val;
            }
        }
    }

    max_cat
}

/// Collect all valid categories for a variable
fn collect_valid_categories(dataset: &[DataRecord], var_name: &str) -> Vec<DataValue> {
    let mut valid_categories = Vec::new();
    let mut seen_categories = HashSet::new();

    for record in dataset {
        if let Some(value) = record.values.get(var_name) {
            if !is_missing(value) {
                // Use a HashSet to track seen categories for deduplication
                let key = match value {
                    DataValue::Number(num) => format!("num_{}", num),
                    DataValue::Text(text) => format!("text_{}", text),
                    DataValue::Boolean(b) => format!("bool_{}", b),
                    DataValue::Null => {
                        continue;
                    }
                };

                if !seen_categories.contains(&key) {
                    seen_categories.insert(key);
                    valid_categories.push(value.clone());
                }
            }
        }
    }

    valid_categories
}

/// Get all variable names from the data
fn get_all_variables(data: &AnalysisData) -> Vec<String> {
    let mut variables = HashSet::new();

    for dataset in &data.analysis_data {
        if let Some(record) = dataset.first() {
            for var_name in record.values.keys() {
                variables.insert(var_name.clone());
            }
        }
    }

    variables.into_iter().collect()
}

/// Approximation of normal quantile function for discretization
fn normal_quantile(p: f64) -> f64 {
    // Simple approximation of the normal quantile function
    // More accurate implementations exist (e.g., inverse error function)
    if p <= 0.0 {
        return -3.0;
    }
    if p >= 1.0 {
        return 3.0;
    }

    // Very rough approximation
    (p - 0.5) * 6.0
}

/// Calculate the indicator matrix for MCA
fn calculate_indicator_matrix(
    dataset: &[DataRecord],
    variables: &[String],
    config: &MCAConfig
) -> Result<(Vec<DMatrix<f64>>, Vec<Vec<DataValue>>), String> {
    let mut indicator_matrices = Vec::new();
    let mut categories_per_var = Vec::new();

    for var_name in variables {
        // Collect all valid categories for the variable
        let categories = collect_valid_categories(dataset, var_name);
        if categories.is_empty() {
            return Err(format!("No valid categories found for variable: {}", var_name));
        }

        // Create indicator matrix for this variable
        let n_rows = dataset.len();
        let n_cols = categories.len();
        let mut indicator = DMatrix::zeros(n_rows, n_cols);

        for (row_idx, record) in dataset.iter().enumerate() {
            if let Some(value) = record.values.get(var_name) {
                if !is_missing(value) {
                    // Find category index
                    if
                        let Some(col_idx) = categories.iter().position(|cat| {
                            match (cat, value) {
                                (DataValue::Number(a), DataValue::Number(b)) =>
                                    (a - b).abs() < 1e-10,
                                (DataValue::Text(a), DataValue::Text(b)) => a == b,
                                (DataValue::Boolean(a), DataValue::Boolean(b)) => a == b,
                                _ => false,
                            }
                        })
                    {
                        // Set indicator to 1 for the matching category
                        indicator[(row_idx, col_idx)] = 1.0;
                    }
                }
            }
        }

        indicator_matrices.push(indicator);
        categories_per_var.push(categories);
    }

    Ok((indicator_matrices, categories_per_var))
}

/// Calculate the Burt matrix (cross-tabulation of all variables)
fn calculate_burt_matrix(indicator_matrices: &[DMatrix<f64>], var_weights: &[f64]) -> DMatrix<f64> {
    // Calculate total number of columns
    let total_cols: usize = indicator_matrices
        .iter()
        .map(|m| m.ncols())
        .sum();

    // Initialize Burt matrix
    let mut burt = DMatrix::zeros(total_cols, total_cols);

    // Calculate cross-products
    let mut row_start = 0;
    for (i, g_i) in indicator_matrices.iter().enumerate() {
        let weight_i = var_weights[i];
        let cols_i = g_i.ncols();

        let mut col_start = 0;
        for (j, g_j) in indicator_matrices.iter().enumerate() {
            let weight_j = var_weights[j];
            let cols_j = g_j.ncols();

            // Calculate weighted cross-product
            let cross_product = (weight_i * weight_j).sqrt() * (g_i.transpose() * g_j);

            // Copy to appropriate part of Burt matrix
            for r in 0..cols_i {
                for c in 0..cols_j {
                    burt[(row_start + r, col_start + c)] = cross_product[(r, c)];
                }
            }

            col_start += cols_j;
        }

        row_start += cols_i;
    }

    burt
}

/// Update category quantifications based on object scores
fn update_category_quantifications(
    indicator: &DMatrix<f64>,
    object_scores: &DMatrix<f64>,
    weight: f64
) -> DMatrix<f64> {
    // Calculate D_j^-1 * G_j' * X
    // Where D_j is diagonal matrix with category frequencies
    // G_j is the indicator matrix
    // X is the object scores matrix

    let category_freqs = indicator.transpose() * DVector::from_element(indicator.nrows(), 1.0);
    let weighted_scores = indicator.transpose() * object_scores;

    // Create diagonal matrix D_j^-1
    let mut d_inv = DMatrix::zeros(category_freqs.len(), category_freqs.len());
    for i in 0..category_freqs.len() {
        if category_freqs[i] > 0.0 {
            d_inv[(i, i)] = 1.0 / category_freqs[i];
        }
    }

    // Calculate quantifications
    d_inv * weighted_scores
}

/// Center and orthonormalize a matrix using SVD
fn center_and_orthonormalize_matrix(matrix: &DMatrix<f64>) -> (DMatrix<f64>, Vec<f64>) {
    let n_rows = matrix.nrows();

    // Center the matrix
    let mut centered = matrix.clone();

    for j in 0..matrix.ncols() {
        let col_mean = matrix.column(j).sum() / (n_rows as f64);

        for i in 0..n_rows {
            centered[(i, j)] -= col_mean;
        }
    }

    // Perform SVD
    let svd = SVD::new(centered.clone(), true, true);

    // Get eigenvectors and eigenvalues
    let u = svd.u.unwrap();
    let singular_values = svd.singular_values;

    // Extract eigenvalues
    let eigenvalues: Vec<f64> = singular_values
        .iter()
        .map(|s| (s * s) / (n_rows as f64))
        .collect();

    // Orthonormalize using the left singular vectors
    let orthonormalized = u * DMatrix::from_diagonal(&singular_values);

    (orthonormalized, eigenvalues)
}

/// Calculate correlation between two vectors
fn calculate_correlation_vectors(vec1: &DVector<f64>, vec2: &DVector<f64>) -> Result<f64, String> {
    if vec1.len() != vec2.len() || vec1.len() < 2 {
        return Err("Vectors must have the same length and at least 2 elements".to_string());
    }

    let n = vec1.len();

    // Calculate means
    let mean1 = vec1.sum() / (n as f64);
    let mean2 = vec2.sum() / (n as f64);

    // Calculate covariance and variances
    let mut cov = 0.0;
    let mut var1 = 0.0;
    let mut var2 = 0.0;

    for i in 0..n {
        let diff1 = vec1[i] - mean1;
        let diff2 = vec2[i] - mean2;

        cov += diff1 * diff2;
        var1 += diff1 * diff1;
        var2 += diff2 * diff2;
    }

    // Calculate Pearson correlation
    if var1 > 0.0 && var2 > 0.0 {
        Ok(cov / (var1.sqrt() * var2.sqrt()))
    } else {
        Ok(0.0)
    }
}

/// Calculate correlation between two variables
fn calculate_correlation(
    dataset: &[DataRecord],
    var1: &str,
    var2: &str,
    transformed: bool
) -> Result<f64, String> {
    let mut values1 = Vec::new();
    let mut values2 = Vec::new();

    for record in dataset {
        if let (Some(val1), Some(val2)) = (record.values.get(var1), record.values.get(var2)) {
            if let (DataValue::Number(num1), DataValue::Number(num2)) = (val1, val2) {
                if !is_missing(val1) && !is_missing(val2) {
                    values1.push(*num1);
                    values2.push(*num2);
                }
            }
        }
    }

    if values1.len() < 2 {
        return Ok(0.0); // Not enough data
    }

    // Calculate means
    let mean1: f64 = values1.iter().sum::<f64>() / (values1.len() as f64);
    let mean2: f64 = values2.iter().sum::<f64>() / (values2.len() as f64);

    // Calculate covariance and variances
    let mut cov = 0.0;
    let mut var1 = 0.0;
    let mut var2 = 0.0;

    for i in 0..values1.len() {
        let diff1 = values1[i] - mean1;
        let diff2 = values2[i] - mean2;

        cov += diff1 * diff2;
        var1 += diff1 * diff1;
        var2 += diff2 * diff2;
    }

    // Calculate Pearson correlation
    if var1 > 0.0 && var2 > 0.0 {
        Ok(cov / (var1.sqrt() * var2.sqrt()))
    } else {
        Ok(0.0)
    }
}

/// Generates a processing summary for the MCA analysis
pub fn processing_summary(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<ProcessingSummary, String> {
    let mut total_cases = 0;
    let mut valid_cases = 0;
    let mut excluded_cases = 0;
    let mut active_cases_with_missing = 0;
    let mut supplementary_cases = 0;

    // Count total cases across all datasets
    for dataset in &data.analysis_data {
        total_cases += dataset.len();
    }

    if total_cases == 0 {
        return Err("No cases found in the data".to_string());
    }

    // Get analysis variables - parse "variable (weight)" format
    let var_names = match &config.main.analysis_vars {
        Some(vars) if !vars.is_empty() => {
            vars.iter()
                .map(|v| parse_variable_weight(v).0)
                .collect()
        }
        _ => get_all_variables(data),
    };

    // Count valid cases and cases with missing values
    for dataset in &data.analysis_data {
        for record in dataset {
            let mut is_valid = true;
            let mut has_missing = false;

            for var_name in &var_names {
                match record.values.get(var_name) {
                    Some(DataValue::Number(val)) if *val >= 1.0 => {} // Valid numeric value
                    Some(DataValue::Text(_)) => {} // Valid text value (will be discretized)
                    _ => {
                        has_missing = true;
                        if config.missing.exclude_objects {
                            is_valid = false;
                            break;
                        }
                    }
                }
            }

            if is_valid {
                valid_cases += 1;
                if has_missing {
                    active_cases_with_missing += 1;
                }
            } else {
                excluded_cases += 1;
            }
        }
    }

    // Count supplementary cases if configured
    if config.options.range_of_cases {
        if let (Some(first), Some(last)) = (config.options.first, config.options.last) {
            supplementary_cases = (last - first + 1) as usize;
            supplementary_cases = supplementary_cases.min(valid_cases); // Cap to valid cases
        }
    } else if config.options.single_case {
        if config.options.single_case_value.is_some() {
            supplementary_cases = 1;
        }
    }

    let cases_used_in_analysis = valid_cases - supplementary_cases;

    // Calculate percentages
    let valid_percent = if total_cases > 0 {
        Some(((valid_cases as f64) * 100.0) / (total_cases as f64))
    } else {
        None
    };

    let total_excluded_percent = if total_cases > 0 {
        Some(((excluded_cases as f64) * 100.0) / (total_cases as f64))
    } else {
        None
    };

    Ok(ProcessingSummary {
        valid_cases,
        excluded_cases,
        total_cases,
        valid_percent,
        missing_group_codes: None,
        missing_group_percent: None,
        missing_disc_vars: None,
        missing_disc_percent: None,
        both_missing: None,
        both_missing_percent: None,
        total_excluded_percent,
        active_cases_with_missing: Some(active_cases_with_missing),
        supplementary_cases: Some(supplementary_cases),
        cases_used_in_analysis: Some(cases_used_in_analysis),
    })
}

/// Filters valid cases from the data based on the configuration
pub fn filter_valid_cases(data: &AnalysisData, config: &MCAConfig) -> Result<AnalysisData, String> {
    // Get analysis variables - parse "variable (weight)" format
    let var_names = match &config.main.analysis_vars {
        Some(vars) if !vars.is_empty() => {
            vars.iter()
                .map(|v| parse_variable_weight(v).0)
                .collect()
        }
        _ => get_all_variables(data),
    };

    // Filter analysis data
    let mut filtered_analysis_data = Vec::new();

    for dataset in &data.analysis_data {
        let mut filtered_dataset = Vec::new();

        for record in dataset {
            let mut is_valid = true;

            for var_name in &var_names {
                match record.values.get(var_name) {
                    Some(DataValue::Number(val)) if *val >= 1.0 => {} // Valid numeric value
                    Some(DataValue::Text(_)) => {} // Valid text (will be discretized)
                    _ => {
                        if config.missing.exclude_objects {
                            is_valid = false;
                            break;
                        }
                    }
                }
            }

            if is_valid {
                filtered_dataset.push(record.clone());
            }
        }

        filtered_analysis_data.push(filtered_dataset);
    }

    // Filter supplementary data if available
    let mut filtered_supplement_data = Vec::new();

    if let Some(supp_vars) = &config.main.supple_vars {
        let supp_var_names: Vec<String> = supp_vars
            .iter()
            .map(|v| parse_variable_weight(v).0)
            .collect();

        for dataset in &data.supplement_data {
            let mut filtered_dataset = Vec::new();

            for record in dataset {
                let mut is_valid = true;

                for var_name in &supp_var_names {
                    match record.values.get(var_name) {
                        Some(DataValue::Number(val)) if *val >= 1.0 => {} // Valid numeric value
                        Some(DataValue::Text(_)) => {} // Valid text (will be discretized)
                        _ => {
                            if config.missing.exclude_objects {
                                is_valid = false;
                                break;
                            }
                        }
                    }
                }

                if is_valid {
                    filtered_dataset.push(record.clone());
                }
            }

            filtered_supplement_data.push(filtered_dataset);
        }
    } else {
        filtered_supplement_data = data.supplement_data.clone();
    }

    // Filter labeling data if available
    let filtered_labeling_data = if let Some(lab_data) = &data.labeling_data {
        let mut filtered_lab_data = Vec::new();

        if let Some(lab_vars) = &config.main.labeling_vars {
            let lab_var_names: Vec<String> = lab_vars
                .iter()
                .map(|v| parse_variable_weight(v).0)
                .collect();

            for dataset in lab_data {
                let mut filtered_dataset = Vec::new();

                for record in dataset {
                    let mut is_valid = true;

                    for var_name in &lab_var_names {
                        match record.values.get(var_name) {
                            Some(DataValue::Number(val)) if *val >= 1.0 => {} // Valid numeric value
                            Some(DataValue::Text(_)) => {} // Valid text (will be discretized)
                            _ => {
                                if config.missing.exclude_objects {
                                    is_valid = false;
                                    break;
                                }
                            }
                        }
                    }

                    if is_valid {
                        filtered_dataset.push(record.clone());
                    }
                }

                filtered_lab_data.push(filtered_dataset);
            }

            Some(filtered_lab_data)
        } else {
            data.labeling_data.clone()
        }
    } else {
        None
    };

    Ok(AnalysisData {
        analysis_data: filtered_analysis_data,
        supplement_data: filtered_supplement_data,
        labeling_data: filtered_labeling_data,
        analysis_data_defs: data.analysis_data_defs.clone(),
        supplement_data_defs: data.supplement_data_defs.clone(),
        labeling_data_defs: data.labeling_data_defs.clone(),
    })
}

/// Applies discretization to variables according to the configuration
pub fn apply_discretization(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<AnalysisData, String> {
    // Get variables to discretize with their settings
    let discretization_settings: Vec<(String, String, Option<u8>, Option<bool>)> = match
        &config.discretize.variables_list
    {
        Some(vars) if !vars.is_empty() => {
            vars.iter()
                .map(|v| parse_discretization_setting(v))
                .collect()
        }
        _ => {
            // If no variables specified, apply default discretization to all analysis variables
            match &config.main.analysis_vars {
                Some(vars) => {
                    vars.iter()
                        .map(|v| {
                            let (var_name, _) = parse_variable_weight(v);
                            (var_name, "Unspecified".to_string(), None, None)
                        })
                        .collect()
                }
                None => {
                    get_all_variables(data)
                        .iter()
                        .map(|v| (v.clone(), "Unspecified".to_string(), None, None))
                        .collect()
                }
            }
        }
    };

    if discretization_settings.is_empty() {
        return Ok(data.clone());
    }

    // Create a copy of the data for discretization
    let mut discretized_data = data.clone();

    // For each dataset, discretize the specified variables
    for dataset_idx in 0..discretized_data.analysis_data.len() {
        let dataset = &mut discretized_data.analysis_data[dataset_idx];

        for (var_name, method, value_opt, distribution_opt) in &discretization_settings {
            // Collect all values for the variable
            let mut values = Vec::new();

            for record in dataset.iter() {
                if let Some(value) = record.values.get(var_name) {
                    match value {
                        DataValue::Number(num) => values.push(*num),
                        DataValue::Text(text) => {
                            if let Ok(num) = text.parse::<f64>() {
                                values.push(num);
                            }
                        }
                        _ => {}
                    }
                }
            }

            if values.is_empty() {
                continue;
            }

            // Apply discretization based on method
            match method.as_str() {
                "Grouping" => {
                    if let Some(n_cats) = value_opt {
                        let n_cats = *n_cats as usize;

                        // Sort values
                        values.sort_by(|a, b| a.partial_cmp(b).unwrap());

                        // Determine boundaries for each category
                        let mut boundaries = Vec::new();

                        if let Some(is_normal) = distribution_opt {
                            if !is_normal {
                                // Uniform distribution
                                // Uniform distribution - equal number of cases per category
                                let n_values = values.len();
                                let target_per_cat = (
                                    (n_values as f64) / (n_cats as f64)
                                ).ceil() as usize;

                                for i in 1..n_cats {
                                    let idx = i * target_per_cat;
                                    if idx < values.len() {
                                        boundaries.push(values[idx]);
                                    }
                                }
                            } else {
                                // Normal distribution
                                // Normal distribution - equal intervals transformed to match normal distribution
                                let min_val = *values.first().unwrap();
                                let max_val = *values.last().unwrap();
                                let range = max_val - min_val;

                                // Use normal distribution quantiles (simplified)
                                for i in 1..n_cats {
                                    let quantile = (i as f64) / (n_cats as f64);
                                    // Approximating normal quantile
                                    let z_score = normal_quantile(quantile);
                                    let boundary = min_val + ((z_score + 3.0) * range) / 6.0; // Map z-scores [-3,3] to range
                                    boundaries.push(boundary);
                                }
                            }
                        } else {
                            // If no distribution specified, use Equal Intervals
                            let min_val = *values.first().unwrap();
                            let max_val = *values.last().unwrap();
                            let interval_size = (max_val - min_val) / (n_cats as f64);

                            for i in 1..n_cats {
                                boundaries.push(min_val + (i as f64) * interval_size);
                            }
                        }

                        // Discretize values
                        for record in dataset.iter_mut() {
                            if let Some(value) = record.values.get_mut(var_name) {
                                let num = match value {
                                    DataValue::Number(num) => *num,
                                    DataValue::Text(text) => {
                                        if let Ok(num) = text.parse::<f64>() {
                                            num
                                        } else {
                                            continue;
                                        }
                                    }
                                    _ => {
                                        continue;
                                    }
                                };

                                // Find category
                                let mut category = 1;
                                for (i, boundary) in boundaries.iter().enumerate() {
                                    if num < *boundary {
                                        category = i + 1;
                                        break;
                                    }
                                    category = n_cats;
                                }

                                *value = DataValue::Number(category as f64);
                            }
                        }
                    }
                }
                "Ranking" => {
                    // Create a sorted copy for ranking
                    let mut sorted_vals = values.clone();
                    sorted_vals.sort_by(|a, b| a.partial_cmp(b).unwrap());

                    // Create rank map, handling ties by averaging ranks
                    let mut rank_map = HashMap::new();
                    let mut i = 0;
                    while i < sorted_vals.len() {
                        let current_val = sorted_vals[i];
                        let mut j = i + 1;

                        // Find tied values
                        while j < sorted_vals.len() && sorted_vals[j] == current_val {
                            j += 1;
                        }

                        // Calculate average rank for tied values
                        let avg_rank = ((i + j - 1) as f64) / 2.0 + 1.0;
                        rank_map.insert(current_val, avg_rank);

                        // Move to the next distinct value
                        i = j;
                    }

                    // Assign ranks
                    for record in dataset.iter_mut() {
                        if let Some(value) = record.values.get_mut(var_name) {
                            let num = match value {
                                DataValue::Number(num) => *num,
                                DataValue::Text(text) => {
                                    if let Ok(num) = text.parse::<f64>() {
                                        num
                                    } else {
                                        continue;
                                    }
                                }
                                _ => {
                                    continue;
                                }
                            };

                            if let Some(rank) = rank_map.get(&num) {
                                *value = DataValue::Number(*rank);
                            }
                        }
                    }
                }
                "Multiplying" => {
                    // Calculate mean and std dev
                    let n = values.len();
                    let mean = values.iter().sum::<f64>() / (n as f64);

                    let variance =
                        values
                            .iter()
                            .map(|x| (*x - mean).powi(2))
                            .sum::<f64>() / (n as f64);

                    let std_dev = variance.sqrt();

                    // Find the minimum z-score to determine offset
                    let min_z = if std_dev > 0.0 {
                        values
                            .iter()
                            .map(|x| (*x - mean) / std_dev)
                            .fold(f64::INFINITY, |a, b| a.min(b))
                    } else {
                        0.0
                    };

                    let offset = if min_z < 0.0 { -min_z * 10.0 + 1.0 } else { 1.0 };

                    // Discretize values
                    for record in dataset.iter_mut() {
                        if let Some(value) = record.values.get_mut(var_name) {
                            let num = match value {
                                DataValue::Number(num) => *num,
                                DataValue::Text(text) => {
                                    if let Ok(num) = text.parse::<f64>() {
                                        num
                                    } else {
                                        continue;
                                    }
                                }
                                _ => {
                                    continue;
                                }
                            };

                            // Standardize, multiply by 10, round, add offset
                            let z_score = if std_dev > 0.0 { (num - mean) / std_dev } else { 0.0 };
                            let discretized = (z_score * 10.0).round() + offset;

                            *value = DataValue::Number(discretized);
                        }
                    }
                }
                "Unspecified" | _ => {
                    // Default behavior: group into 7 categories with normal distribution
                    let n_cats = (7).min(values.len());

                    // Sort values
                    values.sort_by(|a, b| a.partial_cmp(b).unwrap());

                    // Determine boundaries for each category (normal distribution)
                    let min_val = *values.first().unwrap();
                    let max_val = *values.last().unwrap();
                    let range = max_val - min_val;

                    let mut boundaries = Vec::new();
                    for i in 1..n_cats {
                        let quantile = (i as f64) / (n_cats as f64);
                        let z_score = normal_quantile(quantile);
                        let boundary = min_val + ((z_score + 3.0) * range) / 6.0;
                        boundaries.push(boundary);
                    }

                    // Discretize values
                    for record in dataset.iter_mut() {
                        if let Some(value) = record.values.get_mut(var_name) {
                            let num = match value {
                                DataValue::Number(num) => *num,
                                DataValue::Text(text) => {
                                    if let Ok(num) = text.parse::<f64>() {
                                        num
                                    } else {
                                        continue;
                                    }
                                }
                                _ => {
                                    continue;
                                }
                            };

                            // Find category
                            let mut category = 1;
                            for (i, boundary) in boundaries.iter().enumerate() {
                                if num < *boundary {
                                    category = i + 1;
                                    break;
                                }
                                category = n_cats;
                            }

                            *value = DataValue::Number(category as f64);
                        }
                    }
                }
            }
        }
    }

    Ok(discretized_data)
}

/// Handles missing values according to the configuration
pub fn handle_missing_values(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<AnalysisData, String> {
    // Create a copy of the data
    let mut processed_data = data.clone();

    // Check for "ExcludeObjects" in analysis_variables
    let exclude_objects = match &config.missing.analysis_variables {
        Some(vars) => vars.iter().any(|v| v == "ExcludeObjects"),
        None => false,
    };

    // Get analysis variables with missing strategy
    let missing_strategies = match &config.missing.analysis_variables {
        Some(vars) if !vars.is_empty() => {
            vars.iter()
                .filter(|v| *v != "ExcludeObjects")
                .map(|v| parse_missing_value_strategy(v))
                .collect::<Vec<(String, String)>>()
        }
        _ => Vec::new(),
    };

    if missing_strategies.is_empty() && !exclude_objects {
        return Ok(processed_data);
    }

    // Process each dataset
    for dataset_idx in 0..processed_data.analysis_data.len() {
        let dataset = &mut processed_data.analysis_data[dataset_idx];

        // Process each variable with its specific missing strategy
        for (var_name, strategy) in &missing_strategies {
            match strategy.as_str() {
                "Exclude-Mode" => {
                    // Passive treatment - mark for post-processing
                    // (In MCA this means objects with missing values don't contribute to the solution for this variable)
                    continue;
                }
                "Exclude-Extra" => {
                    // Passive treatment with extra category for missing
                    continue;
                }
                "Exclude-Random" => {
                    // Passive treatment with random imputation
                    continue;
                }
                "Impute-Mode" => {
                    // Active treatment - impute missing values with mode
                    let mode = calculate_mode(dataset, var_name);

                    for record in dataset.iter_mut() {
                        if let Some(value) = record.values.get(var_name) {
                            if is_missing(value) {
                                if let Some(mode_val) = mode.clone() {
                                    record.values.insert(var_name.clone(), mode_val);
                                }
                            }
                        }
                    }
                }
                "Impute-Extra" => {
                    // Active treatment - impute missing values with extra category
                    // Find max category and add 1
                    let max_cat = find_max_category(dataset, var_name);
                    let extra_cat = max_cat + 1.0;

                    for record in dataset.iter_mut() {
                        if let Some(value) = record.values.get(var_name) {
                            if is_missing(value) {
                                record.values.insert(
                                    var_name.clone(),
                                    DataValue::Number(extra_cat)
                                );
                            }
                        }
                    }
                }
                "Impute-Random" => {
                    // Active treatment - impute missing values with random category
                    let categories = collect_valid_categories(dataset, var_name);
                    if !categories.is_empty() {
                        let mut rng = rand::thread_rng();

                        for record in dataset.iter_mut() {
                            if let Some(value) = record.values.get(var_name) {
                                if is_missing(value) {
                                    let random_idx = rng.gen_range(0..categories.len());
                                    record.values.insert(
                                        var_name.clone(),
                                        categories[random_idx].clone()
                                    );
                                }
                            }
                        }
                    }
                }
                _ => {
                    // Default to passive treatment if strategy not recognized
                    continue;
                }
            }
        }
    }

    // If listwise deletion (ExcludeObjects) is required, remove records with any missing values
    if exclude_objects {
        let var_names: Vec<String> = missing_strategies
            .iter()
            .map(|(var, _)| var.clone())
            .collect();

        for dataset_idx in 0..processed_data.analysis_data.len() {
            let dataset = &mut processed_data.analysis_data[dataset_idx];

            // Filter records
            let filtered_records: Vec<DataRecord> = dataset
                .iter()
                .filter(|record| {
                    // Check if the record has missing values in any of the analysis variables
                    !var_names.iter().any(|var_name| {
                        match record.values.get(var_name) {
                            Some(value) => is_missing(value),
                            None => true, // Missing variable counts as missing value
                        }
                    })
                })
                .cloned()
                .collect();

            *dataset = filtered_records;
        }
    }

    Ok(processed_data)
}

/// Calculate iteration history for MCA
pub fn calculate_iteration_history(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<IterationHistory, String> {
    // Get analysis variables and their weights
    let var_names_weights: Vec<(String, f64)> = match &config.main.analysis_vars {
        Some(vars) if !vars.is_empty() => {
            vars.iter()
                .map(|v| parse_variable_weight(v))
                .collect()
        }
        _ => {
            get_all_variables(data)
                .iter()
                .map(|v| (v.clone(), 1.0))
                .collect()
        }
    };

    // Separate variable names and weights
    let var_names: Vec<String> = var_names_weights
        .iter()
        .map(|(var, _)| var.clone())
        .collect();
    let var_weights: Vec<f64> = var_names_weights
        .iter()
        .map(|(_, weight)| *weight)
        .collect();

    // Use the first dataset for analysis
    if data.analysis_data.is_empty() || data.analysis_data[0].is_empty() {
        return Err("No data available for analysis".to_string());
    }

    let dataset = &data.analysis_data[0];
    let n_cases = dataset.len();
    let p_dims = config.main.dimensions as usize;

    // Calculate indicator matrices
    let (indicator_matrices, categories_per_var) = calculate_indicator_matrix(
        dataset,
        &var_names,
        config
    )?;

    // Initialize random object scores if needed
    let mut object_scores = DMatrix::zeros(n_cases, p_dims);
    let mut rng = rand::thread_rng();
    for i in 0..n_cases {
        for j in 0..p_dims {
            object_scores[(i, j)] = rng.gen_range(-1.0..1.0);
        }
    }

    // Orthonormalize initial object scores
    let (centered_scores, _) = center_and_orthonormalize_matrix(&object_scores);
    object_scores = centered_scores;

    // Initialize variables for iteration history
    let mut iteration_number = Vec::new();
    let mut variance_accounted_total = Vec::new();
    let mut variance_accounted_increase = Vec::new();
    let mut loss = Vec::new();

    // Set up parameters for iterations
    let max_iterations = config.options.maximum_iterations as usize;
    let convergence_criterion = config.options.convergence;
    let mut iter = 0;
    let mut prev_vaf = 0.0;
    let mut vaf;
    let mut vaf_increase;
    let mut current_loss;

    // Iterative algorithm
    while iter < max_iterations {
        iter += 1;

        // Update category quantifications for each variable
        let mut quantifications = Vec::new();

        for (i, indicator) in indicator_matrices.iter().enumerate() {
            // Calculate optimal category quantifications
            let category_quant = update_category_quantifications(
                indicator,
                &object_scores,
                var_weights[i]
            );
            quantifications.push(category_quant);
        }

        // Update object scores
        let mut new_scores = DMatrix::zeros(n_cases, p_dims);

        for (i, indicator) in indicator_matrices.iter().enumerate() {
            let contrib = indicator * &quantifications[i] * var_weights[i];
            new_scores += contrib;
        }

        // Center and orthonormalize the new scores
        let (orthogonal_scores, eigenvalues) = center_and_orthonormalize_matrix(&new_scores);
        object_scores = orthogonal_scores;

        // Calculate variance accounted for
        vaf = eigenvalues.iter().sum::<f64>() / var_weights.iter().sum::<f64>();
        vaf_increase = vaf - prev_vaf;
        current_loss = var_weights.iter().sum::<f64>() - vaf;

        // Record iteration history
        iteration_number.push(iter as i32);
        variance_accounted_total.push(vaf);
        variance_accounted_increase.push(vaf_increase);
        loss.push(current_loss);

        // Check convergence
        if vaf_increase.abs() < convergence_criterion && iter > 1 {
            break;
        }

        prev_vaf = vaf;
    }

    // Note for stopping condition
    let note = if iter < max_iterations {
        Some(
            "The iteration process stopped because the convergence test value was reached.".to_string()
        )
    } else {
        Some(
            "The iteration process stopped because the maximum number of iterations was reached.".to_string()
        )
    };

    Ok(IterationHistory {
        iteration_number,
        variance_accounted_total,
        variance_accounted_increase,
        loss,
        note,
    })
}

/// Calculate model summary for MCA
pub fn calculate_model_summary(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<ModelSummary, String> {
    // Get analysis variables and their weights
    let var_names_weights: Vec<(String, f64)> = match &config.main.analysis_vars {
        Some(vars) if !vars.is_empty() => {
            vars.iter()
                .map(|v| parse_variable_weight(v))
                .collect()
        }
        _ => {
            get_all_variables(data)
                .iter()
                .map(|v| (v.clone(), 1.0))
                .collect()
        }
    };

    // Separate variable names and weights
    let var_names: Vec<String> = var_names_weights
        .iter()
        .map(|(var, _)| var.clone())
        .collect();
    let var_weights: Vec<f64> = var_names_weights
        .iter()
        .map(|(_, weight)| *weight)
        .collect();

    // Use the first dataset for analysis
    if data.analysis_data.is_empty() || data.analysis_data[0].is_empty() {
        return Err("No data available for analysis".to_string());
    }

    let dataset = &data.analysis_data[0];
    let n_cases = dataset.len();
    let p_dims = config.main.dimensions as usize;

    // Calculate indicator matrices
    let (indicator_matrices, _) = calculate_indicator_matrix(dataset, &var_names, config)?;

    // Get object scores (can reuse from iteration history if available)
    let object_scores = if let Ok(history) = calculate_iteration_history(data, config) {
        // Recompute the final object scores
        let mut rng = rand::thread_rng();
        let mut initial_scores = DMatrix::zeros(n_cases, p_dims);

        for i in 0..n_cases {
            for j in 0..p_dims {
                initial_scores[(i, j)] = rng.gen_range(-1.0..1.0);
            }
        }

        // Perform iterations to get final object scores
        let max_iterations = config.options.maximum_iterations as usize;
        let mut object_scores = initial_scores;

        for _ in 0..max_iterations {
            // Update category quantifications
            let mut quantifications = Vec::new();

            for (i, indicator) in indicator_matrices.iter().enumerate() {
                let category_quant = update_category_quantifications(
                    indicator,
                    &object_scores,
                    var_weights[i]
                );
                quantifications.push(category_quant);
            }

            // Update object scores
            let mut new_scores = DMatrix::zeros(n_cases, p_dims);

            for (i, indicator) in indicator_matrices.iter().enumerate() {
                let contrib = indicator * &quantifications[i] * var_weights[i];
                new_scores += contrib;
            }

            // Center and orthonormalize
            let (orthogonal_scores, _) = center_and_orthonormalize_matrix(&new_scores);
            object_scores = orthogonal_scores;
        }

        object_scores
    } else {
        // If no iteration history, perform quick computation
        let mut rng = rand::thread_rng();
        let mut initial_scores = DMatrix::zeros(n_cases, p_dims);

        for i in 0..n_cases {
            for j in 0..p_dims {
                initial_scores[(i, j)] = rng.gen_range(-1.0..1.0);
            }
        }

        let (centered_scores, _) = center_and_orthonormalize_matrix(&initial_scores);
        centered_scores
    };

    // Calculate Cronbach's alpha and eigenvalues
    let mut cronbachs_alpha = Vec::new();
    let mut eigenvalues = Vec::new();
    let mut inertia = Vec::new();
    let mut variance_percentage = Vec::new();

    // Calculate discrimination measures per dimension
    let mut discrimination_sums = Vec::new();

    for dim in 0..p_dims {
        let mut dim_sums = Vec::new();

        for (i, indicator) in indicator_matrices.iter().enumerate() {
            let scores_dim = object_scores.column(dim);
            let projected = indicator * indicator.transpose() * scores_dim;

            // Calculate discrimination measure (correlation squared)
            let scores_norm = scores_dim.norm_squared();
            let projected_norm = projected.norm_squared();
            let dot_product = scores_dim.dot(&projected);

            if scores_norm > 0.0 && projected_norm > 0.0 {
                let correlation = dot_product / (scores_norm.sqrt() * projected_norm.sqrt());
                let discrimination = correlation * correlation * var_weights[i];
                dim_sums.push(discrimination);
            } else {
                dim_sums.push(0.0);
            }
        }

        // Sum of discrimination measures equals eigenvalue
        let eigenvalue = dim_sums.iter().sum::<f64>();
        eigenvalues.push(eigenvalue);

        // Calculate inertia (eigenvalue / sum of weights)
        let weights_sum = var_weights.iter().sum::<f64>();
        let dim_inertia = eigenvalue / weights_sum;
        inertia.push(dim_inertia);

        // Calculate percentage of variance
        let total_categories: usize = indicator_matrices
            .iter()
            .map(|m| m.ncols())
            .sum();
        let max_variance = (total_categories as f64) - (var_names.len() as f64);
        let percentage = (eigenvalue / max_variance) * 100.0;
        variance_percentage.push(percentage);

        // Calculate Cronbach's alpha
        let alpha = if eigenvalue > 0.0 && weights_sum > 1.0 {
            (weights_sum * (eigenvalue - 1.0)) / (eigenvalue * (weights_sum - 1.0))
        } else {
            0.0
        };
        cronbachs_alpha.push(alpha);

        discrimination_sums.push(dim_sums);
    }

    // Create dimension labels
    let dimensions: Vec<String> = (1..=p_dims).map(|i| i.to_string()).collect();

    // Calculate total and mean values
    let total_eigenvalue: f64 = eigenvalues.iter().sum();
    let total_inertia: f64 = inertia.iter().sum();
    let total_percentage: f64 = variance_percentage.iter().sum();

    let mean_eigenvalue = total_eigenvalue / (p_dims as f64);
    let mean_inertia = total_inertia / (p_dims as f64);
    let mean_percentage = total_percentage / (p_dims as f64);

    // Calculate mean Cronbach's Alpha
    let mean_alpha = if mean_eigenvalue > 0.0 {
        let weights_sum = var_weights.iter().sum::<f64>();
        if weights_sum > 1.0 {
            (weights_sum * (mean_eigenvalue - 1.0)) / (mean_eigenvalue * (weights_sum - 1.0))
        } else {
            0.0
        }
    } else {
        0.0
    };

    // Create total and mean rows
    let total = TotalRow {
        cronbachs_alpha: None,
        eigenvalue: total_eigenvalue,
        inertia: total_inertia,
        percentage: total_percentage,
    };

    let mean = MeanRow {
        cronbachs_alpha: mean_alpha,
        eigenvalue: mean_eigenvalue,
        inertia: mean_inertia,
        percentage: mean_percentage,
        note: Some("Mean Cronbach's Alpha is based on the mean Eigenvalue.".to_string()),
    };

    Ok(ModelSummary {
        dimension: dimensions,
        cronbachs_alpha,
        variance_accounted_eigenvalue: eigenvalues,
        variance_accounted_inertia: inertia,
        variance_accounted_percentage: variance_percentage,
        total: Some(total),
        mean: Some(mean),
        note: None,
    })
}

/// Calculate correlations of original variables
pub fn calculate_original_correlations(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<CorrelationsMatrix, String> {
    // Get analysis variables - parse "variable (weight)" format
    let var_names_weights: Vec<(String, f64)> = match &config.main.analysis_vars {
        Some(vars) if !vars.is_empty() => {
            vars.iter()
                .map(|v| parse_variable_weight(v))
                .collect()
        }
        _ => {
            get_all_variables(data)
                .iter()
                .map(|v| (v.clone(), 1.0))
                .collect()
        }
    };

    // Extract variable names
    let var_names: Vec<String> = var_names_weights
        .iter()
        .map(|(var, _)| var.clone())
        .collect();

    // Use the first dataset for analysis
    if data.analysis_data.is_empty() || data.analysis_data[0].is_empty() {
        return Err("No data available for analysis".to_string());
    }

    let dataset = &data.analysis_data[0];

    // Create correlation matrix
    let mut correlations = HashMap::new();
    let mut eigenvalues = Vec::new();

    // For each pair of variables, calculate Pearson correlation
    for (i, var1) in var_names.iter().enumerate() {
        let mut var1_corrs = HashMap::new();

        for (j, var2) in var_names.iter().enumerate() {
            let correlation = calculate_correlation(dataset, var1, var2, false)?;
            var1_corrs.insert(var2.clone(), correlation);
        }

        correlations.insert(var1.clone(), var1_corrs);
    }

    // Extract correlation matrix as nalgebra matrix for eigenvalue calculation
    let n_vars = var_names.len();
    let mut corr_matrix = DMatrix::zeros(n_vars, n_vars);

    for i in 0..n_vars {
        for j in 0..n_vars {
            let corr = correlations
                .get(&var_names[i])
                .and_then(|row| row.get(&var_names[j]))
                .cloned()
                .unwrap_or(0.0);
            corr_matrix[(i, j)] = corr;
        }
    }

    // Calculate eigenvalues
    let svd = SVD::new(corr_matrix, false, false);
    for &s in svd.singular_values.iter() {
        eigenvalues.push(s * s);
    }

    // Sort eigenvalues in descending order
    eigenvalues.sort_by(|a, b| b.partial_cmp(a).unwrap());

    // Create dimension labels
    let dimensions: Vec<String> = (1..=n_vars).map(|i| i.to_string()).collect();

    Ok(CorrelationsMatrix {
        variables: var_names.clone(),
        dimensions: dimensions,
        eigenvalues,
        correlations,
    })
}

/// Calculate correlations of transformed variables
pub fn calculate_transformed_correlations(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<CorrelationsMatrix, String> {
    // Get analysis variables - parse "variable (weight)" format
    let var_names_weights: Vec<(String, f64)> = match &config.main.analysis_vars {
        Some(vars) if !vars.is_empty() => {
            vars.iter()
                .map(|v| parse_variable_weight(v))
                .collect()
        }
        _ => {
            get_all_variables(data)
                .iter()
                .map(|v| (v.clone(), 1.0))
                .collect()
        }
    };

    // Extract variable names
    let var_names: Vec<String> = var_names_weights
        .iter()
        .map(|(var, _)| var.clone())
        .collect();

    // Use the first dataset for analysis
    if data.analysis_data.is_empty() || data.analysis_data[0].is_empty() {
        return Err("No data available for analysis".to_string());
    }

    let dataset = &data.analysis_data[0];
    let p_dims = config.main.dimensions as usize;

    // Calculate indicator matrices
    let (indicator_matrices, _) = calculate_indicator_matrix(dataset, &var_names, config)?;

    // Get object scores (from model summary calculation)
    let model_summary = calculate_model_summary(data, config)?;
    let object_scores = calculate_object_scores(data, config)?;

    // Create a matrix from object scores
    let n_cases = dataset.len();
    let mut scores_matrix = DMatrix::zeros(n_cases, p_dims);

    for (i, case_num) in object_scores.case_numbers.iter().enumerate() {
        for dim in 0..p_dims {
            let dim_name = &object_scores.dimensions[dim];
            if let Some(score) = object_scores.scores.get(dim_name).map(|v| v[i]) {
                scores_matrix[(i, (*case_num as usize) - 1)] = score;
            }
        }
    }

    // Calculate correlations between transformed variables
    let mut correlations = HashMap::new();
    let mut eigenvalues = Vec::new();

    // For each dimension
    for dim in 0..p_dims {
        // Get the eigenvalue from model summary
        eigenvalues.push(model_summary.variance_accounted_eigenvalue[dim]);

        // For each pair of variables, calculate correlation between transformed variables
        for (i, var1) in var_names.iter().enumerate() {
            let mut var1_corrs = HashMap::new();

            for (j, var2) in var_names.iter().enumerate() {
                // Calculate correlation between transformed variables (quantified categories)
                let indicator1 = &indicator_matrices[i];
                let indicator2 = &indicator_matrices[j];

                // Get quantifications for dimension
                let scores_dim = scores_matrix.column(dim);
                let quant1 = update_category_quantifications(indicator1, &scores_matrix, 1.0)
                    .column(dim)
                    .into_owned();
                let quant2 = update_category_quantifications(indicator2, &scores_matrix, 1.0)
                    .column(dim)
                    .into_owned();

                // Calculate transformed values
                let trans1 = indicator1 * quant1;
                let trans2 = indicator2 * quant2;

                // Calculate correlation
                let mean1 = trans1.sum() / (n_cases as f64);
                let mean2 = trans2.sum() / (n_cases as f64);

                let mut cov = 0.0;
                let mut var1 = 0.0;
                let mut var2 = 0.0;

                for k in 0..n_cases {
                    let diff1 = trans1[k] - mean1;
                    let diff2 = trans2[k] - mean2;
                    cov += diff1 * diff2;
                    var1 += diff1 * diff1;
                    var2 += diff2 * diff2;
                }

                let correlation = if var1 > 0.0 && var2 > 0.0 {
                    cov / (var1.sqrt() * var2.sqrt())
                } else {
                    0.0
                };

                var1_corrs.insert(var2.clone(), correlation);
            }

            // Store correlations for this dimension and variable
            correlations.insert(var1.clone(), var1_corrs);
        }
    }

    // Create dimension labels
    let dimensions: Vec<String> = (1..=p_dims).map(|i| i.to_string()).collect();

    Ok(CorrelationsMatrix {
        variables: var_names.clone(),
        dimensions: dimensions,
        eigenvalues,
        correlations,
    })
}

/// Calculate object scores
pub fn calculate_object_scores(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<ObjectScores, String> {
    // Get analysis variables - parse "variable (weight)" format
    let var_names_weights: Vec<(String, f64)> = match &config.main.analysis_vars {
        Some(vars) if !vars.is_empty() => {
            vars.iter()
                .map(|v| parse_variable_weight(v))
                .collect()
        }
        _ => {
            get_all_variables(data)
                .iter()
                .map(|v| (v.clone(), 1.0))
                .collect()
        }
    };

    // Extract variable names
    let var_names: Vec<String> = var_names_weights
        .iter()
        .map(|(var, _)| var.clone())
        .collect();

    // Use the first dataset for analysis
    if data.analysis_data.is_empty() || data.analysis_data[0].is_empty() {
        return Err("No data available for analysis".to_string());
    }

    let dataset = &data.analysis_data[0];
    let n_cases = dataset.len();
    let p_dims = config.main.dimensions as usize;

    // Calculate indicator matrices
    let (indicator_matrices, _) = calculate_indicator_matrix(dataset, &var_names, config)?;

    // Get object scores (can reuse from iteration history calculation)
    let (object_scores, _) = if let Ok(history) = calculate_iteration_history(data, config) {
        // Re-compute final scores
        let mut rng = rand::thread_rng();
        let mut initial_scores = DMatrix::zeros(n_cases, p_dims);

        for i in 0..n_cases {
            for j in 0..p_dims {
                initial_scores[(i, j)] = rng.gen_range(-1.0..1.0);
            }
        }

        // Perform iterations to get final scores
        let max_iterations = config.options.maximum_iterations as usize;
        let mut scores = initial_scores;

        for _ in 0..max_iterations {
            // Update category quantifications
            let mut quantifications = Vec::new();

            for (i, indicator) in indicator_matrices.iter().enumerate() {
                let quant = update_category_quantifications(indicator, &scores, 1.0);
                quantifications.push(quant);
            }

            // Update object scores
            let mut new_scores = DMatrix::zeros(n_cases, p_dims);

            for (i, indicator) in indicator_matrices.iter().enumerate() {
                let contrib = indicator * &quantifications[i];
                new_scores += contrib;
            }

            // Orthonormalize
            let result = center_and_orthonormalize_matrix(&new_scores);
            scores = result.0;
        }

        (scores, None)
    } else {
        // If no iteration history, perform quick computation
        let mut rng = rand::thread_rng();
        let mut initial_scores = DMatrix::zeros(n_cases, p_dims);

        for i in 0..n_cases {
            for j in 0..p_dims {
                initial_scores[(i, j)] = rng.gen_range(-1.0..1.0);
            }
        }

        center_and_orthonormalize_matrix(&initial_scores)
    };

    // Normalize scores based on normalization method
    let normalized_scores = match config.options.normalization_method {
        NormalizationMethod::VariablePrincipal => object_scores,
        NormalizationMethod::ObjectPrincipal => object_scores, // Already centered on objects
        NormalizationMethod::Symmetrical => {
            // Sqrt of eigenvalues for symmetrical normalization
            let mut symmetrical = object_scores.clone();
            if let Some(eigenvalues) = &_ {
                for j in 0..p_dims {
                    if j < eigenvalues.len() {
                        let factor = eigenvalues[j].sqrt();
                        for i in 0..n_cases {
                            symmetrical[(i, j)] *= factor;
                        }
                    }
                }
            }
            symmetrical
        }
        NormalizationMethod::Independent => object_scores,
        NormalizationMethod::Custom => {
            if let Some(custom_value) = config.options.norm_custom_value {
                let mut custom = object_scores.clone();
                if let Some(eigenvalues) = &_ {
                    for j in 0..p_dims {
                        if j < eigenvalues.len() {
                            let factor = eigenvalues[j].powf((1.0 + custom_value) / 4.0);
                            for i in 0..n_cases {
                                custom[(i, j)] *= factor;
                            }
                        }
                    }
                }
                custom
            } else {
                object_scores
            }
        }
    };

    // Create dimension labels
    let dimensions: Vec<String> = (1..=p_dims).map(|i| i.to_string()).collect();

    // Create case numbers
    let case_numbers: Vec<i32> = (1..=n_cases).map(|i| i as i32).collect();

    // Organize scores by dimension
    let mut scores_by_dim = HashMap::new();

    for dim in 0..p_dims {
        let dim_name = &dimensions[dim];
        let mut dim_scores = Vec::new();

        for i in 0..n_cases {
            dim_scores.push(normalized_scores[(i, dim)]);
        }

        scores_by_dim.insert(dim_name.clone(), dim_scores);
    }

    Ok(ObjectScores {
        case_numbers,
        dimensions,
        scores: scores_by_dim,
    })
}

/// Calculate object contributions
pub fn calculate_object_contributions(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<ObjectContributions, String> {
    // Get analysis variables - parse "variable (weight)" format
    let var_names_weights: Vec<(String, f64)> = match &config.main.analysis_vars {
        Some(vars) if !vars.is_empty() => {
            vars.iter()
                .map(|v| parse_variable_weight(v))
                .collect()
        }
        _ => {
            get_all_variables(data)
                .iter()
                .map(|v| (v.clone(), 1.0))
                .collect()
        }
    };

    // Extract variable names
    let var_names: Vec<String> = var_names_weights
        .iter()
        .map(|(var, _)| var.clone())
        .collect();

    // Use the first dataset for analysis
    if data.analysis_data.is_empty() || data.analysis_data[0].is_empty() {
        return Err("No data available for analysis".to_string());
    }

    let dataset = &data.analysis_data[0];
    let n_cases = dataset.len();
    let p_dims = config.main.dimensions as usize;

    // Get object scores
    let object_scores_result = calculate_object_scores(data, config)?;
    let model_summary = calculate_model_summary(data, config)?;

    // Create object score matrix
    let mut scores_matrix = DMatrix::zeros(n_cases, p_dims);

    for dim in 0..p_dims {
        let dim_name = &object_scores_result.dimensions[dim];
        if let Some(scores) = object_scores_result.scores.get(dim_name) {
            for i in 0..n_cases {
                if i < scores.len() {
                    scores_matrix[(i, dim)] = scores[i];
                }
            }
        }
    }

    // Calculate mass (equal for all objects in basic MCA)
    let mass: Vec<f64> = vec![1.0 / n_cases as f64; n_cases];

    // Calculate inertia
    let mut inertia = Vec::new();

    for i in 0..n_cases {
        let mut obj_inertia = 0.0;

        for dim in 0..p_dims {
            let score = scores_matrix[(i, dim)];
            obj_inertia += score * score * mass[i];
        }

        inertia.push(obj_inertia);
    }

    // Contributions of point to inertia of dimension
    let mut point_to_inertia = HashMap::new();

    for dim in 0..p_dims {
        let dim_name = format!("Dimension {}", dim + 1);
        let mut contributions = Vec::new();

        let eigenvalue = model_summary.variance_accounted_eigenvalue[dim];

        for i in 0..n_cases {
            let score = scores_matrix[(i, dim)];
            let contrib = (mass[i] * score * score) / eigenvalue;
            contributions.push(contrib);
        }

        point_to_inertia.insert(dim_name, contributions);
    }

    // Contributions of dimension to inertia of point
    let mut dim_to_inertia_point = HashMap::new();

    for dim in 0..p_dims {
        let dim_name = format!("Dimension {}", dim + 1);
        let mut contributions = Vec::new();

        for i in 0..n_cases {
            let score = scores_matrix[(i, dim)];
            let contrib = if inertia[i] > 0.0 {
                (mass[i] * score * score) / inertia[i]
            } else {
                0.0
            };
            contributions.push(contrib);
        }

        dim_to_inertia_point.insert(dim_name, contributions);
    }

    // Calculate total contributions
    let mut total_to_inertia_point = Vec::new();

    for i in 0..n_cases {
        let mut total = 0.0;

        for dim in 0..p_dims {
            let dim_name = format!("Dimension {}", dim + 1);
            if let Some(contribs) = dim_to_inertia_point.get(&dim_name) {
                if i < contribs.len() {
                    total += contribs[i];
                }
            }
        }

        total_to_inertia_point.push(total);
    }

    Ok(ObjectContributions {
        case_numbers: object_scores_result.case_numbers,
        mass,
        inertia,
        point_to_inertia,
        dim_to_inertia_point,
        total_to_inertia_point,
    })
}

/// Calculate discrimination measures for the variables
pub fn calculate_discrimination_measures(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<DiscriminationMeasures, String> {
    // Get analysis variables - parse "variable (weight)" format
    let var_names_weights: Vec<(String, f64)> = match &config.main.analysis_vars {
        Some(vars) if !vars.is_empty() => {
            vars.iter()
                .map(|v| parse_variable_weight(v))
                .collect()
        }
        _ => {
            get_all_variables(data)
                .iter()
                .map(|v| (v.clone(), 1.0))
                .collect()
        }
    };

    // Extract variable names
    let var_names: Vec<String> = var_names_weights
        .iter()
        .map(|(var, _)| var.clone())
        .collect();

    // Use the first dataset for analysis
    if data.analysis_data.is_empty() || data.analysis_data[0].is_empty() {
        return Err("No data available for analysis".to_string());
    }

    let dataset = &data.analysis_data[0];
    let p_dims = config.main.dimensions as usize;

    // Get object scores
    let object_scores_result = calculate_object_scores(data, config)?;
    let model_summary = calculate_model_summary(data, config)?;

    // Create indicator matrices
    let (indicator_matrices, _) = calculate_indicator_matrix(dataset, &var_names, config)?;

    // Create scores matrix
    let n_cases = dataset.len();
    let mut scores_matrix = DMatrix::zeros(n_cases, p_dims);

    for dim in 0..p_dims {
        let dim_name = &object_scores_result.dimensions[dim];
        if let Some(scores) = object_scores_result.scores.get(dim_name) {
            for i in 0..n_cases {
                if i < scores.len() {
                    scores_matrix[(i, dim)] = scores[i];
                }
            }
        }
    }

    // Calculate discrimination measures for each variable and dimension
    let mut measures = HashMap::new();
    let mut active_total = vec![0.0; p_dims];

    for (var_idx, var_name) in var_names.iter().enumerate() {
        let mut var_measures = Vec::new();

        // For each dimension
        for dim in 0..p_dims {
            let scores_dim = scores_matrix.column(dim);

            // Calculate category quantifications
            let indicator = &indicator_matrices[var_idx];
            let quant = update_category_quantifications(indicator, &scores_matrix, 1.0);
            let quant_dim = quant.column(dim);

            // Calculate discrimination measure (variance of transformed variable)
            let transformed = indicator * quant_dim;
            let mean = transformed.sum() / (n_cases as f64);

            let mut variance = 0.0;
            for i in 0..n_cases {
                variance += (transformed[i] - mean).powi(2);
            }
            variance /= n_cases as f64;

            // Alternatively, discrimination measure is squared correlation
            let correlation = calculate_correlation_vectors(&scores_dim, &transformed)?;
            let discrimination = correlation * correlation;

            var_measures.push(discrimination);
            active_total[dim] += discrimination;
        }

        measures.insert(var_name.clone(), var_measures);
    }

    // Calculate mean discrimination per variable
    let mut mean_vec = Vec::new();

    for var_name in &var_names {
        if let Some(var_measures) = measures.get(var_name) {
            let mean = var_measures.iter().sum::<f64>() / (p_dims as f64);
            mean_vec.push(mean);
        }
    }

    // Calculate percentage of variance
    let percentage_of_variance = active_total
        .iter()
        .map(|&total| (total / (var_names.len() as f64)) * 100.0)
        .collect();

    // Create dimension labels
    let dimensions: Vec<String> = (1..=p_dims).map(|i| i.to_string()).collect();

    Ok(DiscriminationMeasures {
        variables: var_names,
        dimensions,
        mean: Some(mean_vec),
        measures,
        active_total,
        percentage_of_variance,
    })
}

/// Calculate category points (quantifications)
pub fn calculate_category_points(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<CategoryPoints, String> {
    // Get variables for which category quantifications are requested
    let quant_vars = match &config.output.cat_quantifications {
        Some(vars) if !vars.is_empty() => {
            vars.iter()
                .map(|v| parse_variable_weight(v).0)
                .collect()
        }
        _ => {
            match &config.main.analysis_vars {
                Some(vars) => {
                    vars.iter()
                        .map(|v| parse_variable_weight(v).0)
                        .collect()
                }
                None => get_all_variables(data),
            }
        }
    };

    // Use the first dataset for analysis
    if data.analysis_data.is_empty() || data.analysis_data[0].is_empty() {
        return Err("No data available for analysis".to_string());
    }

    let dataset = &data.analysis_data[0];
    let p_dims = config.main.dimensions as usize;

    // Get object scores
    let object_scores_result = calculate_object_scores(data, config)?;

    // Create scores matrix
    let n_cases = dataset.len();
    let mut scores_matrix = DMatrix::zeros(n_cases, p_dims);

    for (i, case_num) in object_scores_result.case_numbers.iter().enumerate() {
        for dim in 0..p_dims {
            let dim_name = &object_scores_result.dimensions[dim];
            if let Some(score) = object_scores_result.scores.get(dim_name).map(|v| v[i]) {
                scores_matrix[(i, (*case_num as usize) - 1)] = score;
            }
        }
    }

    // Calculate indicator matrices and category quantifications
    let mut categories_map = HashMap::new();
    let mut coordinates_map = HashMap::new();

    for var_name in &quant_vars {
        // Collect all categories for this variable
        let categories = collect_valid_categories(dataset, var_name);
        if categories.is_empty() {
            continue;
        }

        // Create string representation of categories
        let cat_labels: Vec<String> = categories
            .iter()
            .map(|cat| {
                match cat {
                    DataValue::Number(num) => num.to_string(),
                    DataValue::Text(text) => text.clone(),
                    DataValue::Boolean(b) => b.to_string(),
                    DataValue::Null => "Null".to_string(),
                }
            })
            .collect();

        // Create indicator matrix for this variable
        let n_cats = categories.len();
        let mut indicator = DMatrix::zeros(n_cases, n_cats);

        for (row_idx, record) in dataset.iter().enumerate() {
            if let Some(value) = record.values.get(var_name) {
                if !is_missing(value) {
                    // Find category index
                    if
                        let Some(col_idx) = categories.iter().position(|cat| {
                            match (cat, value) {
                                (DataValue::Number(a), DataValue::Number(b)) =>
                                    (a - b).abs() < 1e-10,
                                (DataValue::Text(a), DataValue::Text(b)) => a == b,
                                (DataValue::Boolean(a), DataValue::Boolean(b)) => a == b,
                                _ => false,
                            }
                        })
                    {
                        indicator[(row_idx, col_idx)] = 1.0;
                    }
                }
            }
        }

        // Calculate category quantifications (centroid coordinates)
        let quantifications = update_category_quantifications(&indicator, &scores_matrix, 1.0);

        // Store category coordinates by dimension
        let mut var_coords = HashMap::new();

        for dim in 0..p_dims {
            let mut dim_coords = Vec::new();

            for cat_idx in 0..n_cats {
                dim_coords.push(quantifications[(cat_idx, dim)]);
            }

            var_coords.insert(dim.to_string(), dim_coords);
        }

        categories_map.insert(var_name.clone(), cat_labels);
        coordinates_map.insert(var_name.clone(), var_coords);
    }

    // Create dimension labels
    let dimensions: Vec<String> = (1..=p_dims).map(|i| i.to_string()).collect();

    Ok(CategoryPoints {
        variables: quant_vars,
        categories: categories_map,
        dimension_coordinates: coordinates_map,
    })
}

/// Create object plots for MCA visualization
pub fn create_object_plots(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<HashMap<String, ObjectPointsLabeled>, String> {
    // Get analysis variables - parse "variable (weight)" format
    let var_names_weights: Vec<(String, f64)> = match &config.main.analysis_vars {
        Some(vars) if !vars.is_empty() => {
            vars.iter()
                .map(|v| parse_variable_weight(v))
                .collect()
        }
        _ => {
            get_all_variables(data)
                .iter()
                .map(|v| (v.clone(), 1.0))
                .collect()
        }
    };

    // Extract variable names
    let var_names: Vec<String> = var_names_weights
        .iter()
        .map(|(var, _)| var.clone())
        .collect();

    // Use the first dataset for analysis
    if data.analysis_data.is_empty() || data.analysis_data[0].is_empty() {
        return Err("No data available for analysis".to_string());
    }

    let dataset = &data.analysis_data[0];
    let p_dims = config.main.dimensions as usize;

    // Get object scores
    let object_scores_result = calculate_object_scores(data, config)?;

    // Prepare result
    let mut result = HashMap::new();

    // Create basic object plot
    if config.object_plots.object_points {
        let case_numbers = object_scores_result.case_numbers.clone();
        let dimensions = object_scores_result.dimensions.clone();
        let dimension_labels = dimensions.clone();

        // Use case numbers as labels
        let category_labels: Vec<String> = case_numbers
            .iter()
            .map(|num| num.to_string())
            .collect();

        // Copy scores
        let mut dimension_coordinates = HashMap::new();

        for dim in &dimensions {
            if let Some(scores) = object_scores_result.scores.get(dim) {
                dimension_coordinates.insert(dim.clone(), scores.clone());
            }
        }

        result.insert("object_points".to_string(), ObjectPointsLabeled {
            dimension_labels,
            case_numbers,
            category_labels,
            dimension_coordinates,
        });
    }

    // Create object plots labeled by variables if requested
    if config.object_plots.label_obj_label_by_var {
        if let Some(label_vars) = &config.object_plots.label_obj_selected_vars {
            let label_var_names: Vec<String> = label_vars
                .iter()
                .map(|v| parse_variable_weight(v).0)
                .collect();

            for label_var in label_var_names {
                // Get categories for this variable
                let categories = collect_valid_categories(dataset, &label_var);

                // Create category labels
                let mut category_labels = Vec::new();

                for (idx, case_num) in object_scores_result.case_numbers.iter().enumerate() {
                    let case_idx = (*case_num - 1) as usize;
                    if case_idx < dataset.len() {
                        if let Some(value) = dataset[case_idx].values.get(&label_var) {
                            let label = match value {
                                DataValue::Number(num) => num.to_string(),
                                DataValue::Text(text) => text.clone(),
                                DataValue::Boolean(b) => b.to_string(),
                                DataValue::Null => "Null".to_string(),
                            };
                            category_labels.push(label);
                        } else {
                            category_labels.push("Missing".to_string());
                        }
                    } else {
                        category_labels.push("Missing".to_string());
                    }
                }

                // Copy the rest from object scores
                let case_numbers = object_scores_result.case_numbers.clone();
                let dimensions = object_scores_result.dimensions.clone();
                let dimension_labels = dimensions.clone();

                let mut dimension_coordinates = HashMap::new();

                for dim in &dimensions {
                    if let Some(scores) = object_scores_result.scores.get(dim) {
                        dimension_coordinates.insert(dim.clone(), scores.clone());
                    }
                }

                // Add this plot to results
                result.insert(format!("object_points_{}", label_var), ObjectPointsLabeled {
                    dimension_labels,
                    case_numbers,
                    category_labels,
                    dimension_coordinates,
                });
            }
        }
    }

    // Create biplot if requested
    if config.object_plots.biplot {
        // Get variables to include in biplot
        let biplot_vars = if config.object_plots.bt_include_all_vars {
            var_names.clone()
        } else if config.object_plots.bt_include_selected_vars {
            match &config.object_plots.bt_selected_vars {
                Some(vars) if !vars.is_empty() => {
                    vars.iter()
                        .map(|v| parse_variable_weight(v).0)
                        .collect()
                }
                _ => var_names.clone(),
            }
        } else {
            var_names.clone()
        };

        // Get category points for these variables
        let category_points = calculate_category_points(data, config)?;

        // For each variable, create a biplot
        for var_name in &biplot_vars {
            if
                let (Some(categories), Some(coordinates)) = (
                    category_points.categories.get(var_name),
                    category_points.dimension_coordinates.get(var_name),
                )
            {
                // Combine object scores with category centroids
                let case_numbers = object_scores_result.case_numbers.clone();
                let dimensions = object_scores_result.dimensions.clone();
                let dimension_labels = dimensions.clone();

                // Use category labels for this plot
                let category_labels = categories.clone();

                // Need to restructure coordinates to match ObjectPointsLabeled format
                let mut dimension_coordinates = HashMap::new();

                for dim in &dimensions {
                    if let Some(dim_coords) = coordinates.get(dim) {
                        dimension_coordinates.insert(dim.clone(), dim_coords.clone());
                    }
                }

                // Add this biplot to results
                result.insert(format!("biplot_{}", var_name), ObjectPointsLabeled {
                    dimension_labels,
                    case_numbers: (1..=categories.len() as i32).collect(),
                    category_labels,
                    dimension_coordinates,
                });
            }
        }
    }

    Ok(result)
}

/// Create variable plots for MCA visualization
pub fn create_variable_plots(data: &AnalysisData, config: &MCAConfig) -> Result<(), String> {
    // This function prepares data for plotting, but the actual plot creation
    // would typically be handled by the frontend or visualization library

    // Check what types of plots are requested
    let category_plots_requested =
        config.variable_plots.cat_plots_var.is_some() &&
        !config.variable_plots.cat_plots_var.as_ref().unwrap().is_empty();

    let joint_category_plots_requested =
        config.variable_plots.joint_cat_plots_var.is_some() &&
        !config.variable_plots.joint_cat_plots_var.as_ref().unwrap().is_empty();

    let transformation_plots_requested =
        config.variable_plots.trans_plots_var.is_some() &&
        !config.variable_plots.trans_plots_var.as_ref().unwrap().is_empty();

    let discrimination_plots_requested =
        config.variable_plots.disc_measures_var.is_some() &&
        !config.variable_plots.disc_measures_var.as_ref().unwrap().is_empty();

    // If no plots are requested, return early
    if
        !category_plots_requested &&
        !joint_category_plots_requested &&
        !transformation_plots_requested &&
        !discrimination_plots_requested
    {
        return Ok(());
    }

    // Prepare data for requested plots

    // For category plots, we need category points
    if category_plots_requested || joint_category_plots_requested {
        let mut cat_vars = Vec::new();

        if category_plots_requested {
            // Parse variable name from "variable (weight)" format
            cat_vars.extend(
                config.variable_plots.cat_plots_var
                    .as_ref()
                    .unwrap()
                    .iter()
                    .map(|v| parse_variable_weight(v).0)
                    .collect::<Vec<String>>()
            );
        }

        if joint_category_plots_requested {
            // Parse variable name from "variable (weight)" format
            cat_vars.extend(
                config.variable_plots.joint_cat_plots_var
                    .as_ref()
                    .unwrap()
                    .iter()
                    .map(|v| parse_variable_weight(v).0)
                    .collect::<Vec<String>>()
            );
        }

        // Get category points for these variables
        let category_points = calculate_category_points(data, config)?;

        // The data is now prepared and can be passed to a plotting library
        // For this Rust implementation, we'll just return success
    }

    // For transformation plots, we need original and transformed values
    if transformation_plots_requested {
        // Get variables for transformation plots
        let trans_vars: Vec<String> = config.variable_plots.trans_plots_var
            .as_ref()
            .unwrap()
            .iter()
            .map(|v| parse_variable_weight(v).0)
            .collect();

        // Calculate transformed values (would be used in actual plot implementation)
        let object_scores = calculate_object_scores(data, config)?;

        // The data is now prepared and can be passed to a plotting library
    }

    // For discrimination measure plots, we need discrimination measures
    if discrimination_plots_requested {
        // Parse variable name from "variable (weight)" format
        let disc_vars: Vec<String> = config.variable_plots.disc_measures_var
            .as_ref()
            .unwrap()
            .iter()
            .map(|v| parse_variable_weight(v).0)
            .collect();

        // Calculate discrimination measures
        let discrimination_measures = calculate_discrimination_measures(data, config)?;

        // The data is now prepared and can be passed to a plotting library
    }

    Ok(())
}

/// Save model results (discretized data, transformed values, object scores)
pub fn save_model_results(data: &AnalysisData, config: &MCAConfig) -> Result<(), String> {
    // This function would typically save results to files or datasets
    // For this Rust implementation, we'll just prepare the data

    // Check what needs to be saved
    let save_discretized = config.save.discretized;
    let save_transformed = config.save.save_trans;
    let save_object_scores = config.save.save_obj_scores;

    // If nothing needs to be saved, return early
    if !save_discretized && !save_transformed && !save_object_scores {
        return Ok(());
    }

    // Save discretized data if requested
    if save_discretized {
        if config.save.disc_newdata || config.save.disc_write_newdata {
            // Apply discretization to get discretized data
            let discretized_data = apply_discretization(data, config)?;

            // In a real implementation, we would save this to a file or dataset
            // For now, we'll just log success
            web_sys::console::log_1(&"Discretized data prepared for saving".into());
        }
    }

    // Save transformed data if requested
    if save_transformed {
        if config.save.trans_newdata || config.save.trans_write_newdata {
            // Calculate object scores and category quantifications
            let object_scores = calculate_object_scores(data, config)?;
            let category_points = calculate_category_points(data, config)?;

            // Transform original data using quantifications
            // (This would be implemented in a real application)

            web_sys::console::log_1(&"Transformed data prepared for saving".into());
        }
    }

    // Save object scores if requested
    if save_object_scores {
        if config.save.obj_newdata || config.save.obj_write_newdata {
            // Calculate object scores
            let object_scores = calculate_object_scores(data, config)?;

            // In a real implementation, we would save this to a file or dataset
            web_sys::console::log_1(&"Object scores prepared for saving".into());
        }
    }

    Ok(())
}
