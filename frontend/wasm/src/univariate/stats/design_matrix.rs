use std::collections::HashMap;

use crate::univariate::models::data::{ AnalysisData, DataValue };
use super::core::*;
use super::factor_utils::{ parse_interaction_term, generate_level_combinations };

/// Helper function to create design matrix for a main effect
pub fn create_main_effect_design_matrix(
    data: &AnalysisData,
    factor: &str
) -> Result<Vec<Vec<f64>>, String> {
    let levels = get_factor_levels(data, factor)?;
    let n_total = count_total_cases(data);
    let mut x_matrix = vec![vec![0.0; levels.len()]; n_total];
    let mut row_idx = 0;

    // For each dependent data record, find corresponding fixed factor value
    for dep_records in &data.dependent_data {
        for dep_record in dep_records {
            if row_idx >= n_total {
                break;
            }

            // Add the dependent variable value to the results
            if
                let Some(dep_value) = dep_record.values
                    .iter()
                    .find_map(|(k, v)| (
                        if let DataValue::Number(num) = v {
                            Some((k.clone(), *num))
                        } else {
                            None
                        }
                    ))
            {
                println!(
                    "Found dependent value {} = {} at row {}",
                    dep_value.0,
                    dep_value.1,
                    row_idx
                );
            }

            // Look for this factor in the fix_factor_data
            let mut factor_level: Option<String> = None;

            // Search through fix_factor_data to find the factor value
            for fix_factor_group in &data.fix_factor_data {
                for fix_record in fix_factor_group {
                    if let Some(value) = fix_record.values.get(factor) {
                        factor_level = Some(data_value_to_string(value));
                        break;
                    }
                }
                if factor_level.is_some() {
                    break;
                }
            }

            // Set indicator variables based on the factor level
            if let Some(level) = factor_level {
                for (j, lvl) in levels.iter().enumerate() {
                    x_matrix[row_idx][j] = if lvl == &level { 1.0 } else { 0.0 };
                }
            }

            row_idx += 1;
        }
    }

    Ok(x_matrix)
}

/// Helper function to create design matrix for an interaction term
pub fn create_interaction_design_matrix(
    data: &AnalysisData,
    interaction_term: &str
) -> Result<Vec<Vec<f64>>, String> {
    let term_factors = parse_interaction_term(interaction_term);
    let mut factor_levels = Vec::new();

    // Get levels for each factor in this term
    for factor in &term_factors {
        let levels = get_factor_levels(data, factor)?;
        factor_levels.push((factor.clone(), levels));
    }

    // Generate all level combinations
    let mut level_combinations = Vec::new();
    let mut current_combo = HashMap::new();

    generate_level_combinations(&factor_levels, &mut current_combo, 0, &mut level_combinations);

    let n_total = count_total_cases(data);
    let mut x_matrix = vec![vec![0.0; level_combinations.len()]; n_total];
    let mut row_idx = 0;

    // For each dependent record, create indicators for all level combinations
    for dep_records in &data.dependent_data {
        for _dep_record in dep_records {
            if row_idx >= n_total {
                break;
            }

            // For each level combination, check if the fixed factors match
            for (col_idx, combo) in level_combinations.iter().enumerate() {
                let mut all_factors_match = true;

                for (factor, expected_level) in combo {
                    let mut factor_match = false;

                    // Look for this factor's value in fix_factor_data
                    for fix_factor_group in &data.fix_factor_data {
                        for fix_record in fix_factor_group {
                            if let Some(value) = fix_record.values.get(factor) {
                                let actual_level = data_value_to_string(value);
                                if &actual_level == expected_level {
                                    factor_match = true;
                                    break;
                                }
                            }
                        }
                        if factor_match {
                            break;
                        }
                    }

                    if !factor_match {
                        all_factors_match = false;
                        break;
                    }
                }

                // Set indicator variable (1 if matches, 0 otherwise)
                x_matrix[row_idx][col_idx] = if all_factors_match { 1.0 } else { 0.0 };
            }

            row_idx += 1;
        }
    }

    Ok(x_matrix)
}

/// Helper function to create contrast-coded design matrix for a main effect
pub fn create_contrast_coded_main_effect_matrix(
    data: &AnalysisData,
    factor: &str
) -> Result<Vec<Vec<f64>>, String> {
    let levels = get_factor_levels(data, factor)?;
    let n_total = count_total_cases(data);

    // For effect coding, we use k-1 columns for k levels
    let n_cols = if levels.len() > 1 { levels.len() - 1 } else { 1 };
    let mut x_matrix = vec![vec![0.0; n_cols]; n_total];
    let mut row_idx = 0;

    // For each dependent record, create contrast-coded indicators
    for dep_records in &data.dependent_data {
        for _dep_record in dep_records {
            if row_idx >= n_total {
                break;
            }

            // Find the factor level for this record from fix_factor_data
            let mut factor_level: Option<String> = None;

            for fix_factor_group in &data.fix_factor_data {
                for fix_record in fix_factor_group {
                    if let Some(value) = fix_record.values.get(factor) {
                        factor_level = Some(data_value_to_string(value));
                        break;
                    }
                }
                if factor_level.is_some() {
                    break;
                }
            }

            // Apply effect coding
            if let Some(level) = factor_level {
                if levels.len() > 1 {
                    let is_reference = level == *levels.last().unwrap();

                    for (j, lvl) in levels.iter().enumerate() {
                        if j < levels.len() - 1 {
                            // Skip the last level (reference)
                            if level == *lvl {
                                x_matrix[row_idx][j] = 1.0;
                            } else if is_reference {
                                x_matrix[row_idx][j] = -1.0;
                            } else {
                                x_matrix[row_idx][j] = 0.0;
                            }
                        }
                    }
                } else {
                    // Single level case (intercept only)
                    x_matrix[row_idx][0] = 1.0;
                }
            }

            row_idx += 1;
        }
    }

    Ok(x_matrix)
}

/// Helper function to create contrast-coded design matrix for an interaction
pub fn create_contrast_coded_interaction_matrix(
    data: &AnalysisData,
    interaction_term: &str
) -> Result<Vec<Vec<f64>>, String> {
    let term_factors = parse_interaction_term(interaction_term);
    let mut factor_levels = Vec::new();

    // Get levels for each factor in this term
    for factor in &term_factors {
        let levels = get_factor_levels(data, factor)?;
        factor_levels.push((factor.clone(), levels));
    }

    // Generate all level combinations
    let mut level_combinations = Vec::new();
    let mut current_combo = HashMap::new();

    generate_level_combinations(&factor_levels, &mut current_combo, 0, &mut level_combinations);

    // Remove combinations containing the last level of any factor (for contrast coding)
    let valid_combinations: Vec<HashMap<String, String>> = level_combinations
        .iter()
        .filter(|combo| {
            !term_factors.iter().any(|f| {
                if let Some(levels) = factor_levels.iter().find(|(factor, _)| factor == f) {
                    if let Some(level) = combo.get(f) {
                        return level == levels.1.last().unwrap();
                    }
                }
                false
            })
        })
        .cloned()
        .collect();

    let n_total = count_total_cases(data);
    let mut x_matrix = vec![vec![0.0; valid_combinations.len()]; n_total];
    let mut row_idx = 0;

    // For each dependent record, assign contrast-coded values
    for dep_records in &data.dependent_data {
        for _dep_record in dep_records {
            if row_idx >= n_total {
                break;
            }

            // Get the factor values for this record from fix_factor_data
            let mut factor_values = HashMap::new();

            for factor in &term_factors {
                for fix_factor_group in &data.fix_factor_data {
                    for fix_record in fix_factor_group {
                        if let Some(value) = fix_record.values.get(factor) {
                            factor_values.insert(factor.clone(), data_value_to_string(value));
                            break;
                        }
                    }
                    if factor_values.contains_key(factor) {
                        break;
                    }
                }
            }

            // Check if any factor has the reference level
            let has_reference_level = term_factors.iter().any(|f| {
                if let Some(levels) = factor_levels.iter().find(|(factor, _)| factor == f) {
                    if let Some(level) = factor_values.get(f) {
                        return level == levels.1.last().unwrap();
                    }
                }
                false
            });

            // For each valid combination, set contrast-coded value
            for (col_idx, combo) in valid_combinations.iter().enumerate() {
                if has_reference_level {
                    // If any factor is at reference level, set -1 for all combinations
                    x_matrix[row_idx][col_idx] = -1.0;
                } else {
                    // Check if this record matches the current combination
                    let matches = combo
                        .iter()
                        .all(|(f, expected_level)| {
                            factor_values.get(f).map_or(false, |val| val == expected_level)
                        });

                    x_matrix[row_idx][col_idx] = if matches { 1.0 } else { 0.0 };
                }
            }

            row_idx += 1;
        }
    }

    Ok(x_matrix)
}

/// Create design matrix for Type IV sum of squares, which handles missing cells
pub fn create_type_iv_main_effect_matrix(
    data: &AnalysisData,
    factor: &str
) -> Result<Vec<Vec<f64>>, String> {
    let levels = get_factor_levels(data, factor)?;
    let n_total = count_total_cases(data);

    // Get all factors for checking interactions
    let mut all_factors = Vec::new();
    if let Some(fix_factor_defs) = data.fix_factor_data_defs.get(0) {
        for factor_def in fix_factor_defs {
            if factor_def.name != factor {
                all_factors.push(factor_def.name.clone());
            }
        }
    }

    // Create a matrix with one column per level (except the last, which is the reference)
    let n_cols = if levels.len() > 1 { levels.len() - 1 } else { 1 };
    let mut x_matrix = vec![vec![0.0; n_cols]; n_total];

    // For each record, we need to identify which level combinations exist
    let mut row_idx = 0;

    // Count occurrences of each level in interactions with other factors
    let mut level_counts = vec![0; levels.len()];

    // First pass: count occurrences
    for dep_records in &data.dependent_data {
        for _dep_record in dep_records {
            if row_idx >= n_total {
                break;
            }

            // Find this factor's level for the current record
            let mut factor_level: Option<String> = None;

            for fix_factor_group in &data.fix_factor_data {
                for fix_record in fix_factor_group {
                    if let Some(value) = fix_record.values.get(factor) {
                        factor_level = Some(data_value_to_string(value));
                        break;
                    }
                }
                if factor_level.is_some() {
                    break;
                }
            }

            // Count this level's occurrence
            if let Some(level) = &factor_level {
                for (i, lvl) in levels.iter().enumerate() {
                    if level == lvl {
                        level_counts[i] += 1;
                        break;
                    }
                }
            }

            row_idx += 1;
        }
    }

    // Second pass: apply Type IV coding
    row_idx = 0;
    for dep_records in &data.dependent_data {
        for _dep_record in dep_records {
            if row_idx >= n_total {
                break;
            }

            // Find this factor's level for the current record
            let mut factor_level: Option<String> = None;

            for fix_factor_group in &data.fix_factor_data {
                for fix_record in fix_factor_group {
                    if let Some(value) = fix_record.values.get(factor) {
                        factor_level = Some(data_value_to_string(value));
                        break;
                    }
                }
                if factor_level.is_some() {
                    break;
                }
            }

            // Apply Type IV coding
            if let Some(level) = factor_level {
                let is_reference = level == *levels.last().unwrap();

                for (j, lvl) in levels
                    .iter()
                    .enumerate()
                    .take(levels.len() - 1) {
                    if level == *lvl {
                        // This level gets weight based on its frequency in the design
                        let weight = 1.0 / (level_counts[j] as f64);
                        x_matrix[row_idx][j] = weight;
                    } else if is_reference {
                        // Reference level gets negative weight
                        let weight = 1.0 / (level_counts[levels.len() - 1] as f64);
                        x_matrix[row_idx][j] = -weight;
                    }
                }
            }

            row_idx += 1;
        }
    }

    Ok(x_matrix)
}

/// Create a Type IV interaction design matrix that handles missing cells
pub fn create_type_iv_interaction_matrix(
    data: &AnalysisData,
    interaction_term: &str
) -> Result<Vec<Vec<f64>>, String> {
    let term_factors = parse_interaction_term(interaction_term);

    // Get levels for each factor
    let mut factor_levels = Vec::new();
    for factor in &term_factors {
        let levels = get_factor_levels(data, factor)?;
        factor_levels.push((factor.clone(), levels));
    }

    // Generate all possible level combinations
    let mut level_combinations = Vec::new();
    let mut current_combo = HashMap::new();

    generate_level_combinations(&factor_levels, &mut current_combo, 0, &mut level_combinations);

    // Determine which combinations exist in the data
    let mut existing_combinations = Vec::new();
    let mut combination_counts = Vec::new();

    for combo in &level_combinations {
        let mut count = 0;

        for dep_records in &data.dependent_data {
            for _dep_record in dep_records {
                let mut matches_all = true;

                for (factor, expected_level) in combo {
                    let mut factor_match = false;

                    for fix_factor_group in &data.fix_factor_data {
                        for fix_record in fix_factor_group {
                            if let Some(value) = fix_record.values.get(factor) {
                                if &data_value_to_string(value) == expected_level {
                                    factor_match = true;
                                    break;
                                }
                            }
                        }
                        if factor_match {
                            break;
                        }
                    }

                    if !factor_match {
                        matches_all = false;
                        break;
                    }
                }

                if matches_all {
                    count += 1;
                }
            }
        }

        if count > 0 {
            existing_combinations.push(combo.clone());
            combination_counts.push(count);
        }
    }

    // Create design matrix
    let n_total = count_total_cases(data);
    let n_cols = existing_combinations.len();
    let mut x_matrix = vec![vec![0.0; n_cols]; n_total];

    // For each record, check if it matches any existing combination
    let mut row_idx = 0;

    for dep_records in &data.dependent_data {
        for _dep_record in dep_records {
            if row_idx >= n_total {
                break;
            }

            // Check against each existing combination
            for (col_idx, combo) in existing_combinations.iter().enumerate() {
                let mut matches_all = true;

                for (factor, expected_level) in combo {
                    let mut factor_match = false;

                    for fix_factor_group in &data.fix_factor_data {
                        for fix_record in fix_factor_group {
                            if let Some(value) = fix_record.values.get(factor) {
                                if &data_value_to_string(value) == expected_level {
                                    factor_match = true;
                                    break;
                                }
                            }
                        }
                        if factor_match {
                            break;
                        }
                    }

                    if !factor_match {
                        matches_all = false;
                        break;
                    }
                }

                // If record matches this combination, set weight based on frequency
                if matches_all {
                    x_matrix[row_idx][col_idx] = 1.0 / (combination_counts[col_idx] as f64);
                }
            }

            row_idx += 1;
        }
    }

    Ok(x_matrix)
}

/// Helper function to add factor columns to a design matrix
pub fn add_factor_to_design_matrix(
    design_matrix: &mut Vec<Vec<f64>>,
    data: &AnalysisData,
    factor: &str
) -> Result<(), String> {
    let x_factor = create_main_effect_design_matrix(data, factor)?;
    for col_idx in 0..x_factor[0].len() {
        let column = extract_column(&x_factor, col_idx);
        add_column_to_matrix(design_matrix, &column);
    }
    Ok(())
}

/// Add a covariate to a design matrix
pub fn add_covariate_to_design_matrix(
    design_matrix: &mut Vec<Vec<f64>>,
    covariate_values: &[f64]
) -> Result<(), String> {
    if design_matrix.is_empty() {
        return Err("Design matrix is empty".to_string());
    }

    if design_matrix.len() != covariate_values.len() {
        return Err(
            format!(
                "Covariate length ({}) does not match design matrix rows ({})",
                covariate_values.len(),
                design_matrix.len()
            )
        );
    }

    // Center the covariate values
    let mean = covariate_values.iter().sum::<f64>() / (covariate_values.len() as f64);
    let centered_values: Vec<f64> = covariate_values
        .iter()
        .map(|&val| val - mean)
        .collect();

    // Add the centered covariate as a new column in the design matrix
    for (i, row) in design_matrix.iter_mut().enumerate() {
        row.push(centered_values[i]);
    }

    Ok(())
}

/// Helper function to create design matrix for covariate interactions (e.g., X1*X2 or X1*X1)
pub fn create_covariate_interaction_design_matrix(
    data: &AnalysisData,
    interaction_term: &str
) -> Result<Vec<Vec<f64>>, String> {
    // Parse the covariate interaction term (e.g., "X1*X2")
    let covariate_names = parse_interaction_term(interaction_term);

    // Get values for each covariate
    let mut covariate_values: Vec<Vec<f64>> = Vec::new();
    for covar in &covariate_names {
        let values = get_covariate_values(data, covar)?;
        covariate_values.push(values);
    }

    // Check that all covariates have the same number of observations
    let n_obs = if let Some(first) = covariate_values.first() {
        first.len()
    } else {
        return Err("No covariate values found".to_string());
    };

    for values in &covariate_values {
        if values.len() != n_obs {
            return Err("Covariates have different number of observations".to_string());
        }
    }

    // For each observation, calculate the product of covariate values
    let mut design_column = vec![0.0; n_obs];

    for i in 0..n_obs {
        let mut product = 1.0;
        for values in &covariate_values {
            product *= values[i];
        }
        design_column[i] = product;
    }

    // Create a design matrix with a single column (the product)
    let mut design_matrix = Vec::new();
    design_matrix.push(design_column);

    // Transpose to match expected format [rows × columns]
    Ok(matrix_transpose(&design_matrix))
}

/// Helper function to create design matrix for nested terms (e.g., A(B) or A(B(C)))
pub fn create_nested_design_matrix(
    data: &AnalysisData,
    nested_term: &str
) -> Result<Vec<Vec<f64>>, String> {
    // Parse nested term structure
    // For example: "A(B)" -> A is nested within B
    //              "A(B(C))" -> A is nested within B which is nested within C

    // First identify the hierarchical structure
    let mut hierarchy = Vec::new();
    let mut current_term = nested_term;

    while let Some(open_paren) = current_term.find('(') {
        if let Some(matching_close) = find_matching_parenthesis(current_term, open_paren) {
            // Extract the outer factor (before the parenthesis)
            let outer_factor = current_term[..open_paren].trim();
            hierarchy.push(outer_factor.to_string());

            // Move to the inner term
            current_term = &current_term[open_paren + 1..matching_close];
        } else {
            return Err(format!("Invalid nesting structure in term: {}", nested_term));
        }
    }

    // The innermost factor (no more parentheses)
    if !current_term.is_empty() {
        hierarchy.push(current_term.trim().to_string());
    }

    // Reverse hierarchy to get from innermost to outermost
    hierarchy.reverse();

    // Build combinations based on the nesting structure
    let n_total = count_total_cases(data);
    let mut level_combinations: Vec<HashMap<String, String>> = Vec::new();

    // Get levels for each factor in the hierarchy
    let mut factor_levels = Vec::new();
    for factor in &hierarchy {
        let levels = get_factor_levels(data, factor)?;
        factor_levels.push((factor.clone(), levels));
    }

    // For each level of the outermost factor (last in hierarchy)
    if factor_levels.is_empty() {
        return Err("No valid factors found in nested term".to_string());
    }

    // Start with the outermost factor (last in our hierarchy)
    let (outer_factor, outer_levels) = &factor_levels[factor_levels.len() - 1];

    // For each level of the outermost factor
    let mut all_nested_combinations = Vec::new();

    for outer_level in outer_levels {
        // Start with this level for the outermost factor
        let mut base_combo = HashMap::new();
        base_combo.insert(outer_factor.clone(), outer_level.clone());

        // If we only have one factor, add this combination
        if factor_levels.len() == 1 {
            all_nested_combinations.push(base_combo);
            continue;
        }

        // For each level of the next factor inward
        let mut current_combos = vec![base_combo];

        // Process each factor from outer to inner (except the outermost which we already handled)
        for i in (0..factor_levels.len() - 1).rev() {
            let (inner_factor, inner_levels) = &factor_levels[i];
            let mut new_combos = Vec::new();

            // For each existing combination
            for combo in &current_combos {
                // For each level of this factor
                for inner_level in inner_levels {
                    // Create a new combination with this level
                    let mut new_combo = combo.clone();
                    new_combo.insert(inner_factor.clone(), inner_level.clone());
                    new_combos.push(new_combo);
                }
            }

            current_combos = new_combos;
        }

        // Add all combinations for this outer level
        all_nested_combinations.extend(current_combos);
    }

    // Create design matrix based on the nested combinations
    let mut x_matrix = vec![vec![0.0; all_nested_combinations.len()]; n_total];
    let mut row_idx = 0;

    // For each data record, check which combination applies
    for dep_records in &data.dependent_data {
        for _dep_record in dep_records {
            if row_idx >= n_total {
                break;
            }

            // Check each combination
            for (col_idx, combo) in all_nested_combinations.iter().enumerate() {
                let mut all_match = true;

                // Check if this record matches all factors in the combination
                for (factor, level) in combo {
                    let mut factor_match = false;

                    // Search through fix_factor_data to find the factor value
                    for fix_factor_group in &data.fix_factor_data {
                        for fix_record in fix_factor_group {
                            if let Some(value) = fix_record.values.get(factor) {
                                if data_value_to_string(value) == *level {
                                    factor_match = true;
                                    break;
                                }
                            }
                        }
                        if factor_match {
                            break;
                        }
                    }

                    if !factor_match {
                        all_match = false;
                        break;
                    }
                }

                // If this combination matches, set indicator to 1
                x_matrix[row_idx][col_idx] = if all_match { 1.0 } else { 0.0 };
            }

            row_idx += 1;
        }
    }

    Ok(x_matrix)
}

/// Helper function to find the matching closing parenthesis
fn find_matching_parenthesis(text: &str, open_pos: usize) -> Option<usize> {
    let chars: Vec<char> = text.chars().collect();
    let mut depth = 0;

    for i in open_pos..chars.len() {
        match chars[i] {
            '(' => {
                depth += 1;
            }
            ')' => {
                depth -= 1;
                if depth == 0 {
                    return Some(i);
                }
            }
            _ => {}
        }
    }

    None
}
