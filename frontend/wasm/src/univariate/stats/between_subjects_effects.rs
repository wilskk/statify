use std::collections::HashMap;

use crate::univariate::models::{
    config::{ SumOfSquaresMethod, UnivariateConfig },
    data::{ AnalysisData, DataRecord },
    result::{ TestEffectEntry, TestsBetweenSubjectsEffects },
};

use super::common::{
    calculate_f_significance,
    calculate_mean,
    calculate_observed_power,
    count_total_cases,
    data_value_to_string,
    extract_dependent_value,
    generate_interaction_terms,
    get_factor_combinations,
    get_factor_levels,
    get_level_values,
    matrix_inverse,
    matrix_multiply,
    matrix_transpose,
    matrix_vec_multiply,
    parse_interaction_term,
};

/// Calculate sum of squares for interaction effects with specified method
pub fn calculate_interaction_ss(
    data: &AnalysisData,
    interaction_term: &str,
    dep_var_name: &str,
    grand_mean: f64,
    ss_method: SumOfSquaresMethod,
    factors: &[String],
    residual_values: Option<&[f64]>,
    residual_mean: Option<f64>
) -> Result<f64, String> {
    let interaction_factors = parse_interaction_term(interaction_term);

    match ss_method {
        SumOfSquaresMethod::TypeI =>
            calculate_type_i_interaction_ss(
                data,
                &interaction_factors,
                interaction_term,
                dep_var_name,
                grand_mean,
                residual_values,
                residual_mean
            ),
        SumOfSquaresMethod::TypeII =>
            calculate_type_ii_interaction_ss(
                data,
                &interaction_factors,
                interaction_term,
                dep_var_name,
                grand_mean,
                factors
            ),
        SumOfSquaresMethod::TypeIII | SumOfSquaresMethod::TypeIV =>
            calculate_type_iii_interaction_ss(
                data,
                &interaction_factors,
                interaction_term,
                dep_var_name,
                grand_mean,
                factors
            ),
    }
}

/// Calculate Type I (sequential) sum of squares for interaction effects
fn calculate_type_i_interaction_ss(
    data: &AnalysisData,
    interaction_factors: &[String],
    interaction_term: &str,
    dep_var_name: &str,
    grand_mean: f64,
    residual_values: Option<&[f64]>,
    residual_mean: Option<f64>
) -> Result<f64, String> {
    // Type I: Sequential SS - each term adjusted for terms that precede it
    if let (Some(residuals), Some(res_mean)) = (residual_values, residual_mean) {
        // Get all possible combinations of factor levels for this interaction
        let mut factor_levels_map = Vec::new();
        for factor in interaction_factors {
            let levels = get_factor_levels(data, factor)?;
            factor_levels_map.push((factor.clone(), levels));
        }

        // Generate all combinations of levels
        let mut level_combinations = Vec::new();
        let mut current_combo = HashMap::new();

        generate_level_combinations(
            &factor_levels_map,
            &mut current_combo,
            0,
            &mut level_combinations
        );

        // Calculate means for each interaction level combination using the residual values
        let mut combination_means = Vec::new();
        let mut combination_counts = Vec::new();

        for combo in &level_combinations {
            let mut values_for_combo = Vec::new();
            let mut indices_for_combo = Vec::new();

            // First, identify indices of all records that match this combination
            for (record_idx, dep_record) in data.fix_factor_data.iter().flatten().enumerate() {
                if record_idx >= residuals.len() {
                    continue;
                }

                // Search for matching factor levels across the fix_factor_data
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

                if all_factors_match {
                    indices_for_combo.push(record_idx);
                }
            }

            // Now collect residual values for these indices
            for &idx in &indices_for_combo {
                values_for_combo.push(residuals[idx]);
            }

            if !values_for_combo.is_empty() {
                let combo_mean = calculate_mean(&values_for_combo);
                combination_means.push(combo_mean);
                combination_counts.push(values_for_combo.len());
            } else {
                combination_means.push(0.0);
                combination_counts.push(0);
            }
        }

        // Calculate the weighted grand mean of the residuals
        let total_count: usize = combination_counts.iter().sum();
        if total_count > 0 {
            let weighted_mean =
                combination_means
                    .iter()
                    .zip(combination_counts.iter())
                    .map(|(mean, &count)| mean * (count as f64))
                    .sum::<f64>() / (total_count as f64);

            // Calculate Type I SS for the interaction
            let mut ss_interaction = 0.0;
            for (mean, &count) in combination_means.iter().zip(combination_counts.iter()) {
                ss_interaction += (count as f64) * (mean - weighted_mean).powi(2);
            }

            return Ok(ss_interaction);
        }

        Ok(0.0) // No valid combinations found
    } else {
        Err("Type I SS requires residual values and mean".to_string())
    }
}

/// Calculate Type II sum of squares for interaction effects
fn calculate_type_ii_interaction_ss(
    data: &AnalysisData,
    interaction_factors: &[String],
    interaction_term: &str,
    dep_var_name: &str,
    grand_mean: f64,
    factors: &[String]
) -> Result<f64, String> {
    // Type II: Adjusted for all main effects and any lower-order interactions

    // First, identify lower-order terms (main effects and lower-order interactions)
    let mut lower_order_terms = Vec::new();

    // Add all main effects contained in this interaction
    for factor in interaction_factors {
        lower_order_terms.push(factor.clone());
    }

    // Add any lower-order interactions
    if interaction_factors.len() > 2 {
        // Generate all possible interaction terms of lower order
        for size in 2..interaction_factors.len() {
            let mut current = Vec::new();
            generate_lower_order_terms(
                interaction_factors,
                size,
                &mut current,
                0,
                &mut lower_order_terms
            );
        }
    }

    // Create design matrix for adjustment
    let n_total = count_total_cases(data);
    let mut design_matrices = HashMap::new();
    let mut y_values = Vec::new();

    // Extract dependent variable values
    for records in &data.fix_factor_data {
        for record in records {
            if let Some(value) = extract_dependent_value(record, dep_var_name) {
                y_values.push(value);
            }
        }
    }

    // Create design matrix X for main effects and lower-order interactions
    for term in &lower_order_terms {
        let x_matrix = if term.contains('*') {
            create_interaction_design_matrix(data, term)?
        } else {
            create_main_effect_design_matrix(data, term)?
        };

        design_matrices.insert(term.clone(), x_matrix);
    }

    // Create design matrix for the interaction term being tested
    let x_interaction = create_interaction_design_matrix(data, interaction_term)?;

    // Compute projection matrix for lower-order terms
    if !design_matrices.is_empty() {
        // Combine all lower-order design matrices
        let nrows = design_matrices.values().next().unwrap().len();
        let ncols = design_matrices
            .values()
            .map(|m| m[0].len())
            .sum();
        let mut x_lower_order = vec![vec![0.0; ncols]; nrows];

        let mut col_offset = 0;
        for x_matrix in design_matrices.values() {
            for i in 0..nrows {
                for j in 0..x_matrix[0].len() {
                    x_lower_order[i][col_offset + j] = x_matrix[i][j];
                }
            }
            col_offset += x_matrix[0].len();
        }

        // Compute X'X and its inverse
        let x_transpose = matrix_transpose(&x_lower_order);
        let xtx = matrix_multiply(&x_transpose, &x_lower_order)?;
        let xtx_inv = matrix_inverse(&xtx)?;

        // Compute X'X^-1X'
        let xtx_inv_xt = matrix_multiply(&xtx_inv, &x_transpose)?;

        // Compute projection matrix P = X(X'X)^-1X'
        let p_matrix = matrix_multiply(&x_lower_order, &xtx_inv_xt)?;

        // Compute residuals e = (I - P)y
        let mut residuals = Vec::new();
        for i in 0..y_values.len() {
            let mut residual = y_values[i];
            for j in 0..y_values.len() {
                residual -= p_matrix[i][j] * y_values[j];
            }
            residuals.push(residual);
        }

        // Compute X_interaction'e
        let x_interaction_transpose = matrix_transpose(&x_interaction);
        let xte = matrix_vec_multiply(&x_interaction_transpose, &residuals)?;

        // Compute X_interaction'(I - P)X_interaction
        let mut xt_i_minus_p_x = vec![vec![0.0; x_interaction[0].len()]; x_interaction[0].len()];
        for i in 0..x_interaction[0].len() {
            for j in 0..x_interaction[0].len() {
                let mut sum = 0.0;
                for k in 0..y_values.len() {
                    for l in 0..y_values.len() {
                        let i_minus_p_kl = (if k == l { 1.0 } else { 0.0 }) - p_matrix[k][l];
                        sum += x_interaction[k][i] * i_minus_p_kl * x_interaction[l][j];
                    }
                }
                xt_i_minus_p_x[i][j] = sum;
            }
        }

        // Compute (X_interaction'(I - P)X_interaction)^-1
        let xt_i_minus_p_x_inv = matrix_inverse(&xt_i_minus_p_x)?;

        // Compute b = (X_interaction'(I - P)X_interaction)^-1 * X_interaction'e
        let b = matrix_vec_multiply(&xt_i_minus_p_x_inv, &xte)?;

        // Compute SS = b' * X_interaction'e
        let mut ss = 0.0;
        for i in 0..b.len() {
            ss += b[i] * xte[i];
        }

        return Ok(ss);
    }

    // Fallback to direct calculation if design matrices are empty
    calculate_raw_interaction_ss(data, interaction_term, dep_var_name, grand_mean)
}

/// Calculate Type III/IV sum of squares for interaction effects
fn calculate_type_iii_interaction_ss(
    data: &AnalysisData,
    interaction_factors: &[String],
    interaction_term: &str,
    dep_var_name: &str,
    grand_mean: f64,
    factors: &[String]
) -> Result<f64, String> {
    // Type III/IV: Fully adjusted and orthogonal to all other terms

    // First, identify all terms in the model
    let mut all_terms = Vec::new();

    // Add main effects
    all_terms.extend(factors.iter().cloned());

    // Add all interaction terms
    let interaction_terms = generate_interaction_terms(factors);
    all_terms.extend(interaction_terms);

    // Create design matrices for all terms
    let mut design_matrices = HashMap::new();
    let mut y_values = Vec::new();

    // Extract dependent variable values
    for records in &data.fix_factor_data {
        for record in records {
            if let Some(value) = extract_dependent_value(record, dep_var_name) {
                y_values.push(value);
            }
        }
    }

    // Create design matrix for each term using contrast coding
    for term in &all_terms {
        let x_matrix = if term.contains('*') {
            create_contrast_coded_interaction_matrix(data, term)?
        } else {
            create_contrast_coded_main_effect_matrix(data, term)?
        };

        design_matrices.insert(term.clone(), x_matrix);
    }

    // Exclude the term being tested
    let other_terms: Vec<String> = all_terms
        .iter()
        .filter(|&t| t != interaction_term)
        .cloned()
        .collect();

    // Get design matrix for the term being tested
    if let Some(x_term) = design_matrices.get(interaction_term) {
        if other_terms.is_empty() {
            // If no other terms, just use the raw SS calculation
            return calculate_raw_interaction_ss(data, interaction_term, dep_var_name, grand_mean);
        }

        // Create combined design matrix for all other terms
        let nrows = design_matrices.values().next().unwrap().len();
        let ncols = other_terms
            .iter()
            .filter_map(|t| design_matrices.get(t))
            .map(|m| m[0].len())
            .sum();

        // Initialize matrix
        let mut x_others = vec![vec![0.0; ncols]; nrows];

        // Fill the matrix
        let mut col_offset = 0;
        for term in &other_terms {
            if let Some(x_matrix) = design_matrices.get(term) {
                for i in 0..nrows {
                    for j in 0..x_matrix[0].len() {
                        x_others[i][col_offset + j] = x_matrix[i][j];
                    }
                }
                col_offset += x_matrix[0].len();
            }
        }

        // Compute Type III SS using orthogonal projection
        let x_others_transpose = matrix_transpose(&x_others);
        let xtx = matrix_multiply(&x_others_transpose, &x_others)?;

        // Try to invert X'X
        let xtx_inv = match matrix_inverse(&xtx) {
            Ok(inv) => inv,
            Err(_) => {
                return calculate_raw_interaction_ss(
                    data,
                    interaction_term,
                    dep_var_name,
                    grand_mean
                );
            }
        };

        // Compute projection matrix P = X(X'X)^-1X'
        let xtx_inv_xt = matrix_multiply(&xtx_inv, &x_others_transpose)?;
        let p_matrix = matrix_multiply(&x_others, &xtx_inv_xt)?;

        // Compute (I - P)X_term
        let mut i_minus_p_x = vec![vec![0.0; x_term[0].len()]; x_term.len()];
        for i in 0..x_term.len() {
            for j in 0..x_term[0].len() {
                let mut sum = 0.0;
                for k in 0..x_term.len() {
                    sum += ((if i == k { 1.0 } else { 0.0 }) - p_matrix[i][k]) * x_term[k][j];
                }
                i_minus_p_x[i][j] = sum;
            }
        }

        // Compute (I - P)X_term * ((I - P)X_term)'
        let i_minus_p_x_transpose = matrix_transpose(&i_minus_p_x);
        let q_matrix = matrix_multiply(&i_minus_p_x, &i_minus_p_x_transpose)?;

        // Compute y'Qy for SS
        let mut ss = 0.0;
        for i in 0..y_values.len() {
            for j in 0..y_values.len() {
                ss += y_values[i] * q_matrix[i][j] * y_values[j];
            }
        }

        return Ok(ss);
    }

    // Fallback to direct calculation if the term is not found
    calculate_raw_interaction_ss(data, interaction_term, dep_var_name, grand_mean)
}

/// Helper function to create design matrix for a main effect
fn create_main_effect_design_matrix(
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
fn create_interaction_design_matrix(
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
        for dep_record in dep_records {
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
fn create_contrast_coded_main_effect_matrix(
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
        for dep_record in dep_records {
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
fn create_contrast_coded_interaction_matrix(
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
        for dep_record in dep_records {
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

/// Helper function to calculate raw SS for an interaction term without adjustments
fn calculate_raw_interaction_ss(
    data: &AnalysisData,
    interaction_term: &str,
    dep_var_name: &str,
    grand_mean: f64
) -> Result<f64, String> {
    let interaction_factors = parse_interaction_term(interaction_term);

    // Get all possible combinations of factor levels for this interaction
    let mut factor_levels = Vec::new();
    for factor in &interaction_factors {
        let levels = get_factor_levels(data, factor)?;
        factor_levels.push((factor.clone(), levels));
    }

    // Generate all level combinations for the factors in this interaction
    let mut level_combinations = Vec::new();
    let mut current_combo = HashMap::new();

    generate_level_combinations(&factor_levels, &mut current_combo, 0, &mut level_combinations);

    // Calculate the sum of squares for the interaction
    let mut ss = 0.0;

    for combo in &level_combinations {
        // Get values that match this combination of factor levels
        let mut values_for_combo = Vec::new();

        for dep_records in &data.dependent_data {
            for dep_record in dep_records {
                // Check if all factors match this combination
                let mut all_factors_match = true;

                for (factor, expected_level) in combo {
                    let mut factor_match = false;

                    // Check if this factor's value in fix_factor_data matches expected level
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

                // If this record matches all factor levels, add its dependent value
                if all_factors_match {
                    if let Some(value) = extract_dependent_value(dep_record, dep_var_name) {
                        values_for_combo.push(value);
                    }
                }
            }
        }

        if !values_for_combo.is_empty() {
            let combo_mean = calculate_mean(&values_for_combo);
            ss += (values_for_combo.len() as f64) * (combo_mean - grand_mean).powi(2);
        }
    }

    Ok(ss)
}

/// Get values adjusted for previous factors (for Type I SS)
pub fn get_level_values_adjusted(
    residual_values: &[f64],
    data: &AnalysisData,
    factor: &str,
    level: &str,
    dep_var_name: &str
) -> Result<Vec<f64>, String> {
    let mut level_values = Vec::new();
    let mut i = 0;

    for dep_records in &data.dependent_data {
        for dep_record in dep_records {
            if i >= residual_values.len() {
                continue;
            }

            // Find if this record matches the specified factor level
            let mut factor_level_match = false;

            // Search through fix_factor_data to find if this record corresponds to the specified level
            for fix_factor_group in &data.fix_factor_data {
                for fix_record in fix_factor_group {
                    if let Some(value) = fix_record.values.get(factor) {
                        let current_level = data_value_to_string(value);
                        if current_level == level {
                            factor_level_match = true;
                            break;
                        }
                    }
                }
                if factor_level_match {
                    break;
                }
            }

            if factor_level_match {
                level_values.push(residual_values[i]);
            }

            i += 1;
        }
    }

    Ok(level_values)
}

/// Helper function to generate all lower-order terms from a list of factors
fn generate_lower_order_terms(
    factors: &[String],
    size: usize,
    current: &mut Vec<String>,
    start_idx: usize,
    result: &mut Vec<String>
) {
    if current.len() == size {
        result.push(current.join("*"));
        return;
    }

    for i in start_idx..factors.len() {
        current.push(factors[i].clone());
        generate_lower_order_terms(factors, size, current, i + 1, result);
        current.pop();
    }
}

/// Generate all combinations of factor levels for interaction analysis
fn generate_level_combinations(
    factor_levels: &[(String, Vec<String>)],
    current_combo: &mut HashMap<String, String>,
    index: usize,
    result: &mut Vec<HashMap<String, String>>
) {
    if index >= factor_levels.len() {
        // We've processed all factors, add this combination
        result.push(current_combo.clone());
        return;
    }

    let (factor, levels) = &factor_levels[index];

    // Process each level for the current factor
    for level in levels {
        current_combo.insert(factor.clone(), level.clone());
        generate_level_combinations(factor_levels, current_combo, index + 1, result);
    }

    // Remove the factor key after processing all its levels
    current_combo.remove(factor);
}

/// Calculate degrees of freedom for an interaction effect
pub fn calculate_interaction_df(
    data: &AnalysisData,
    interaction_term: &str
) -> Result<usize, String> {
    let factors = parse_interaction_term(interaction_term);
    let mut df = 1;

    // For each factor in the interaction, multiply by (levels - 1)
    for factor in &factors {
        let factor_levels = get_factor_levels(data, factor)?;
        if factor_levels.len() > 1 {
            df *= factor_levels.len() - 1;
        }
    }

    Ok(df)
}

/// Calculate sum of squares for a factor based on the method
pub fn calculate_factor_ss(
    data: &AnalysisData,
    factor: &str,
    dep_var_name: &str,
    grand_mean: f64,
    ss_method: SumOfSquaresMethod,
    residual_values: Option<&[f64]>,
    residual_mean: Option<f64>
) -> Result<f64, String> {
    match ss_method {
        SumOfSquaresMethod::TypeI =>
            calculate_type_i_factor_ss(data, factor, dep_var_name, residual_values, residual_mean),
        SumOfSquaresMethod::TypeII =>
            calculate_type_ii_factor_ss(data, factor, dep_var_name, grand_mean),
        SumOfSquaresMethod::TypeIII | SumOfSquaresMethod::TypeIV =>
            calculate_type_iii_factor_ss(data, factor, dep_var_name, grand_mean),
    }
}

/// Calculate Type I sum of squares for a factor
fn calculate_type_i_factor_ss(
    data: &AnalysisData,
    factor: &str,
    dep_var_name: &str,
    residual_values: Option<&[f64]>,
    residual_mean: Option<f64>
) -> Result<f64, String> {
    // Type I: Sequential SS - each term adjusted for terms that precede it
    if let (Some(residuals), Some(res_mean)) = (residual_values, residual_mean) {
        let factor_levels = get_factor_levels(data, factor)?;

        // Calculate adjusted SS for each level
        let level_means = factor_levels
            .iter()
            .map(|level| {
                let level_values = get_level_values_adjusted(
                    residuals,
                    data,
                    factor,
                    level,
                    dep_var_name
                )?;
                let level_mean = if !level_values.is_empty() {
                    calculate_mean(&level_values)
                } else {
                    0.0
                };
                Ok((level.clone(), level_mean, level_values.len()))
            })
            .collect::<Result<Vec<_>, String>>()?;

        // Calculate factor SS
        let factor_ss = level_means
            .iter()
            .map(|(_, level_mean, count)| (*count as f64) * (level_mean - res_mean).powi(2))
            .sum();

        Ok(factor_ss)
    } else {
        Err("Type I SS requires residual values and mean".to_string())
    }
}

/// Calculate Type II sum of squares for a factor
fn calculate_type_ii_factor_ss(
    data: &AnalysisData,
    factor: &str,
    dep_var_name: &str,
    grand_mean: f64
) -> Result<f64, String> {
    // Extract all dependent values
    let mut all_values = Vec::new();
    let mut factor_indicators = Vec::new();
    let mut other_factor_indicators = HashMap::new();

    // Get all other factors in the model
    let mut other_factors = Vec::new();
    if let Some(fix_factor_defs) = data.fix_factor_data_defs.get(0) {
        for factor_def in fix_factor_defs {
            if factor_def.name != factor {
                other_factors.push(factor_def.name.clone());
            }
        }
    }

    // If no other factors, use raw SS calculation
    if other_factors.is_empty() {
        return calculate_raw_factor_ss(data, factor, dep_var_name, grand_mean);
    }

    // Get all levels for this factor and other factors
    let factor_levels = get_factor_levels(data, factor)?;
    let mut other_factor_levels = HashMap::new();

    for other_factor in &other_factors {
        let levels = get_factor_levels(data, other_factor)?;
        other_factor_levels.insert(other_factor.clone(), levels);
    }

    // Extract dependent values and create indicators
    for dep_records in &data.dependent_data {
        for dep_record in dep_records {
            if let Some(value) = extract_dependent_value(dep_record, dep_var_name) {
                all_values.push(value);

                // Create indicator for the main factor
                let mut level_indicators = vec![0.0; factor_levels.len()];

                // Find the level of this factor for this record
                let mut main_factor_level = None;

                for fix_factor_group in &data.fix_factor_data {
                    for fix_record in fix_factor_group {
                        if let Some(value) = fix_record.values.get(factor) {
                            main_factor_level = Some(data_value_to_string(value));
                            break;
                        }
                    }
                    if main_factor_level.is_some() {
                        break;
                    }
                }

                // Set factor indicators based on level
                if let Some(level) = main_factor_level {
                    for (level_idx, lvl) in factor_levels.iter().enumerate() {
                        if lvl == &level {
                            level_indicators[level_idx] = 1.0;
                        }
                    }
                }

                factor_indicators.push(level_indicators);

                // Create indicators for other factors
                for other_factor in &other_factors {
                    if let Some(levels) = other_factor_levels.get(other_factor) {
                        let mut other_level_indicators = vec![0.0; levels.len()];
                        let mut other_factor_level = None;

                        // Find this other factor's level
                        for fix_factor_group in &data.fix_factor_data {
                            for fix_record in fix_factor_group {
                                if let Some(value) = fix_record.values.get(other_factor) {
                                    other_factor_level = Some(data_value_to_string(value));
                                    break;
                                }
                            }
                            if other_factor_level.is_some() {
                                break;
                            }
                        }

                        // Set other factor indicators based on level
                        if let Some(level) = other_factor_level {
                            for (level_idx, lvl) in levels.iter().enumerate() {
                                if lvl == &level {
                                    other_level_indicators[level_idx] = 1.0;
                                }
                            }
                        }

                        if !other_factor_indicators.contains_key(other_factor) {
                            other_factor_indicators.insert(other_factor.clone(), Vec::new());
                        }

                        other_factor_indicators
                            .get_mut(other_factor)
                            .unwrap()
                            .push(other_level_indicators);
                    }
                }
            }
        }
    }

    // Create design matrix for other factors (X_others)
    let n_obs = all_values.len();
    let n_cols = other_factors
        .iter()
        .filter_map(|f| other_factor_levels.get(f))
        .map(|levels| levels.len())
        .sum();

    let mut x_others = vec![vec![0.0; n_cols]; n_obs];

    let mut col_offset = 0;
    for other_factor in &other_factors {
        if let Some(indicators) = other_factor_indicators.get(other_factor) {
            for i in 0..n_obs {
                if i < indicators.len() {
                    for j in 0..indicators[i].len() {
                        x_others[i][col_offset + j] = indicators[i][j];
                    }
                }
            }

            if let Some(levels) = other_factor_levels.get(other_factor) {
                col_offset += levels.len();
            }
        }
    }

    // Compute projection matrix for other factors
    let x_others_transpose = matrix_transpose(&x_others);
    let xtx = matrix_multiply(&x_others_transpose, &x_others)?;

    // Try to invert X'X
    let xtx_inv = match matrix_inverse(&xtx) {
        Ok(inv) => inv,
        Err(_) => {
            // If matrix is singular, use a simplified approach
            return calculate_raw_factor_ss(data, factor, dep_var_name, grand_mean);
        }
    };

    // Calculate X_others'X_others^-1X_others'
    let xtx_inv_xt = matrix_multiply(&xtx_inv, &x_others_transpose)?;

    // Calculate projection matrix P = X_others(X_others'X_others)^-1X_others'
    let p_matrix = matrix_multiply(&x_others, &xtx_inv_xt)?;

    // Calculate (I - P)y for the residuals
    let mut residuals = all_values.clone();
    for i in 0..all_values.len() {
        for j in 0..all_values.len() {
            residuals[i] -= p_matrix[i][j] * all_values[j];
        }
    }

    // Create design matrix for the factor being tested (X_factor)
    let mut x_factor = Vec::new();
    for indicators in &factor_indicators {
        x_factor.push(indicators.clone());
    }

    // Calculate X_factor'(I - P)y
    let x_factor_transpose = matrix_transpose(&x_factor);
    let mut xtr = vec![0.0; factor_levels.len()];
    for i in 0..factor_levels.len() {
        for j in 0..residuals.len() {
            xtr[i] += x_factor_transpose[i][j] * residuals[j];
        }
    }

    // Calculate X_factor'(I - P)X_factor
    let mut xt_i_minus_p_x = vec![vec![0.0; factor_levels.len()]; factor_levels.len()];
    for i in 0..factor_levels.len() {
        for j in 0..factor_levels.len() {
            for k in 0..all_values.len() {
                for l in 0..all_values.len() {
                    let i_minus_p_kl = (if k == l { 1.0 } else { 0.0 }) - p_matrix[k][l];
                    xt_i_minus_p_x[i][j] +=
                        x_factor_transpose[i][k] * i_minus_p_kl * x_factor[l][j];
                }
            }
        }
    }

    // Calculate (X_factor'(I - P)X_factor)^-1
    let xt_i_minus_p_x_inv = match matrix_inverse(&xt_i_minus_p_x) {
        Ok(inv) => inv,
        Err(_) => {
            // If matrix is singular, use a simplified approach
            return calculate_raw_factor_ss(data, factor, dep_var_name, grand_mean);
        }
    };

    // Calculate b = (X_factor'(I - P)X_factor)^-1 * X_factor'(I - P)y
    let mut b = vec![0.0; factor_levels.len()];
    for i in 0..factor_levels.len() {
        for j in 0..factor_levels.len() {
            b[i] += xt_i_minus_p_x_inv[i][j] * xtr[j];
        }
    }

    // Calculate SS = b' * X_factor'(I - P)y
    let ss = b
        .iter()
        .zip(xtr.iter())
        .map(|(&b_i, &xtr_i)| b_i * xtr_i)
        .sum::<f64>();

    Ok(ss)
}

/// Calculate Type III/IV sum of squares for a factor
fn calculate_type_iii_factor_ss(
    data: &AnalysisData,
    factor: &str,
    dep_var_name: &str,
    grand_mean: f64
) -> Result<f64, String> {
    // Extract all dependent values
    let mut all_values = Vec::new();
    let mut x_matrix = Vec::new();

    // Get all factors in the model
    let mut all_factors = Vec::new();
    if let Some(fix_factor_defs) = data.fix_factor_data_defs.get(0) {
        for factor_def in fix_factor_defs {
            all_factors.push(factor_def.name.clone());
        }
    }

    // Get all levels for each factor
    let mut factor_levels_map = HashMap::new();
    for f in &all_factors {
        let levels = get_factor_levels(data, f)?;
        factor_levels_map.insert(f.clone(), levels);
    }

    // Generate all possible interactions
    let interaction_terms = generate_interaction_terms(&all_factors);

    // Extract dependent values and build design matrix
    for dep_records in &data.dependent_data {
        for dep_record in dep_records {
            if let Some(value) = extract_dependent_value(dep_record, dep_var_name) {
                all_values.push(value);

                let mut row = Vec::new();

                // Add column for intercept
                row.push(1.0);

                // Find all factor values for this record
                let mut record_factor_values = HashMap::new();

                for f in &all_factors {
                    let mut factor_level: Option<String> = None;

                    // Search in fix_factor_data for this factor level
                    for fix_factor_group in &data.fix_factor_data {
                        for fix_record in fix_factor_group {
                            if let Some(value) = fix_record.values.get(f) {
                                factor_level = Some(data_value_to_string(value));
                                break;
                            }
                        }
                        if factor_level.is_some() {
                            break;
                        }
                    }

                    if let Some(level) = factor_level {
                        record_factor_values.insert(f.clone(), level);
                    }
                }

                // Add columns for main effects (contrast coded)
                for f in &all_factors {
                    if let Some(levels) = factor_levels_map.get(f) {
                        if let Some(current_level) = record_factor_values.get(f) {
                            // Use effect coding (-1/1)
                            for (i, level) in levels.iter().enumerate() {
                                if i < levels.len() - 1 {
                                    // Skip last level for full rank
                                    if current_level == level {
                                        row.push(1.0);
                                    } else if i == levels.len() - 1 {
                                        row.push(-1.0);
                                    } else {
                                        row.push(0.0);
                                    }
                                }
                            }
                        } else {
                            // Factor level not found, use zeros
                            for i in 0..levels.len() - 1 {
                                row.push(0.0);
                            }
                        }
                    }
                }

                // Add columns for interactions (contrast coded)
                for term in &interaction_terms {
                    let term_factors = parse_interaction_term(term);

                    // Generate all combinations of levels for these factors
                    let mut factor_levels = Vec::new();
                    for f in &term_factors {
                        if let Some(levels) = factor_levels_map.get(f) {
                            factor_levels.push((f.clone(), levels.clone()));
                        }
                    }

                    let mut level_combinations = Vec::new();
                    let mut current_combo = HashMap::new();

                    generate_level_combinations(
                        &factor_levels,
                        &mut current_combo,
                        0,
                        &mut level_combinations
                    );

                    // Remove one combination per factor for full rank
                    let valid_combinations: Vec<&HashMap<String, String>> = level_combinations
                        .iter()
                        .filter(|combo| {
                            !term_factors.iter().any(|f| {
                                if let Some(levels) = factor_levels_map.get(f) {
                                    if let Some(level) = combo.get(f) {
                                        return level == levels.last().unwrap();
                                    }
                                }
                                false
                            })
                        })
                        .collect();

                    // Check if record has any reference level for these factors
                    let has_reference_level = term_factors.iter().any(|f| {
                        if let Some(levels) = factor_levels_map.get(f) {
                            if let Some(level) = record_factor_values.get(f) {
                                return level == levels.last().unwrap();
                            }
                        }
                        false
                    });

                    // Add indicator for each valid combination
                    for combo in &valid_combinations {
                        if has_reference_level {
                            // If any factor is at reference level, set -1 for all combinations
                            row.push(-1.0);
                        } else {
                            // Check if record matches this combo
                            let matches = combo
                                .iter()
                                .all(|(f, level)| {
                                    record_factor_values.get(f).map_or(false, |val| val == level)
                                });

                            row.push(if matches { 1.0 } else { 0.0 });
                        }
                    }
                }

                x_matrix.push(row);
            }
        }
    }

    // Find column indices for the factor being tested
    let mut factor_cols = Vec::new();
    let mut col_index = 1; // Start after intercept

    // Skip past preceding factors
    for f in &all_factors {
        if f == factor {
            if let Some(levels) = factor_levels_map.get(f) {
                for i in 0..levels.len() - 1 {
                    // Skip last level for full rank
                    factor_cols.push(col_index);
                    col_index += 1;
                }
            }
            break;
        } else {
            if let Some(levels) = factor_levels_map.get(f) {
                col_index += levels.len() - 1; // Skip last level for full rank
            }
        }
    }

    if factor_cols.is_empty() {
        return Err(format!("Factor '{}' not found in the model", factor));
    }

    // Create reduced design matrix (excluding columns for factor being tested)
    let mut x_reduced = Vec::new();
    for row in &x_matrix {
        let mut new_row = Vec::new();
        for (j, val) in row.iter().enumerate() {
            if !factor_cols.contains(&j) {
                new_row.push(*val);
            }
        }
        x_reduced.push(new_row);
    }

    // Calculate full model SS
    let x_transpose = matrix_transpose(&x_matrix);
    let xtx = matrix_multiply(&x_transpose, &x_matrix)?;
    let xty = matrix_vec_multiply(&x_transpose, &all_values)?;

    let xtx_inv = match matrix_inverse(&xtx) {
        Ok(inv) => inv,
        Err(_) => {
            // If matrix is singular, use a simplified approach
            return calculate_raw_factor_ss(data, factor, dep_var_name, grand_mean);
        }
    };

    let b_full = matrix_vec_multiply(&xtx_inv, &xty)?;

    let ss_full = b_full
        .iter()
        .zip(xty.iter())
        .map(|(&b, &y)| b * y)
        .sum::<f64>();

    // Calculate reduced model SS
    let x_reduced_transpose = matrix_transpose(&x_reduced);
    let xtx_reduced = matrix_multiply(&x_reduced_transpose, &x_reduced)?;
    let xty_reduced = matrix_vec_multiply(&x_reduced_transpose, &all_values)?;

    let xtx_reduced_inv = match matrix_inverse(&xtx_reduced) {
        Ok(inv) => inv,
        Err(_) => {
            // If matrix is singular, use a simplified approach
            return calculate_raw_factor_ss(data, factor, dep_var_name, grand_mean);
        }
    };

    let b_reduced = matrix_vec_multiply(&xtx_reduced_inv, &xty_reduced)?;

    let ss_reduced = b_reduced
        .iter()
        .zip(xty_reduced.iter())
        .map(|(&b, &y)| b * y)
        .sum::<f64>();

    // Type III SS is the difference between full and reduced model SS
    let ss = ss_full - ss_reduced;

    Ok(ss)
}

/// Calculate raw sum of squares for a factor
fn calculate_raw_factor_ss(
    data: &AnalysisData,
    factor: &str,
    dep_var_name: &str,
    grand_mean: f64
) -> Result<f64, String> {
    use statrs::statistics::Statistics;
    use rayon::prelude::*;

    // Get levels for this factor
    let levels = get_factor_levels(data, factor)?;

    // Parallelize level processing for large datasets
    let ss_factor: f64 = if levels.len() > 5 {
        levels
            .par_iter()
            .filter_map(|level| {
                let level_values = match get_level_values(data, factor, level, dep_var_name) {
                    Ok(values) => values,
                    Err(_) => {
                        return None;
                    }
                };

                if level_values.is_empty() {
                    return None;
                }

                let level_mean = level_values.mean();
                let n = level_values.len() as f64;

                Some(n * (level_mean - grand_mean).powi(2))
            })
            .sum()
    } else {
        // Sequential for small number of levels
        levels
            .iter()
            .filter_map(|level| {
                let level_values = match get_level_values(data, factor, level, dep_var_name) {
                    Ok(values) => values,
                    Err(_) => {
                        return None;
                    }
                };

                if level_values.is_empty() {
                    return None;
                }

                let level_mean = level_values.mean();
                let n = level_values.len() as f64;

                Some(n * (level_mean - grand_mean).powi(2))
            })
            .sum()
    };

    Ok(ss_factor)
}

/// Create a TestEffectEntry with calculated statistics
fn create_effect_entry(
    sum_of_squares: f64,
    df: usize,
    error_ms: f64,
    error_df: usize,
    sig_level: f64
) -> TestEffectEntry {
    let mean_square = if df > 0 { sum_of_squares / (df as f64) } else { 0.0 };
    let f_value = if error_ms > 0.0 { mean_square / error_ms } else { 0.0 };
    let significance = calculate_f_significance(df, error_df, f_value);
    let partial_eta_squared = if sum_of_squares > 0.0 {
        sum_of_squares / (sum_of_squares + error_ms * (error_df as f64))
    } else {
        0.0
    };
    let noncent_parameter = f_value * (df as f64);
    let observed_power = calculate_observed_power(df, error_df, f_value, sig_level);

    TestEffectEntry {
        sum_of_squares,
        df,
        mean_square,
        f_value,
        significance,
        partial_eta_squared,
        noncent_parameter,
        observed_power,
    }
}

/// Calculate between-subjects effects for the statistical model
pub fn calculate_tests_between_subjects_effects(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<TestsBetweenSubjectsEffects, String> {
    if data.dependent_data.is_empty() {
        return Err("No dependent data available".to_string());
    }

    let dep_var_name = match &config.main.dep_var {
        Some(name) => name,
        None => {
            return Err("No dependent variable specified in configuration".to_string());
        }
    };

    let mut source = HashMap::new();
    let n_total = count_total_cases(data);

    // Extract all dependent values
    let mut all_values = Vec::new();
    for records in &data.dependent_data {
        for record in records {
            if let Some(value) = extract_dependent_value(record, dep_var_name) {
                all_values.push(value);
            }
        }
    }

    // Calculate grand mean and total sum of squares
    let grand_mean = calculate_mean(&all_values);
    let ss_total = all_values
        .iter()
        .map(|val| (val - grand_mean).powi(2))
        .sum::<f64>();

    // Calculate sum of squares based on the requested method
    let mut ss_model = 0.0;
    let factor_combinations = get_factor_combinations(data, config)?;

    // Generate all interaction terms if we have fixed factors
    let mut interaction_terms = Vec::new();
    if let Some(factors) = &config.main.fix_factor {
        if factors.len() > 1 {
            interaction_terms = generate_interaction_terms(factors);
        }
    }

    // Add intercept
    if config.model.intercept {
        let ss_intercept = (n_total as f64) * grand_mean.powi(2);
        ss_model += ss_intercept;

        // Create test effect entry for intercept
        let error_df = n_total - 1;
        let error_ms = ss_total / (error_df as f64);

        source.insert(
            "Intercept".to_string(),
            create_effect_entry(ss_intercept, 1, error_ms, error_df, config.options.sig_level)
        );
    }

    // Process factors and interactions based on sum of squares method
    if let Some(factors) = &config.main.fix_factor {
        match config.model.sum_of_square_method {
            SumOfSquaresMethod::TypeI => {
                process_type_i_factors_and_interactions(
                    data,
                    factors,
                    &interaction_terms,
                    dep_var_name,
                    grand_mean,
                    &all_values,
                    n_total,
                    ss_total,
                    config.options.sig_level,
                    &mut ss_model,
                    &mut source
                )?;
            }
            SumOfSquaresMethod::TypeII => {
                process_type_ii_factors_and_interactions(
                    data,
                    factors,
                    &interaction_terms,
                    dep_var_name,
                    grand_mean,
                    n_total,
                    ss_total,
                    config.options.sig_level,
                    &mut ss_model,
                    &mut source
                )?;
            }
            SumOfSquaresMethod::TypeIII | SumOfSquaresMethod::TypeIV => {
                process_type_iii_factors_and_interactions(
                    data,
                    factors,
                    &interaction_terms,
                    dep_var_name,
                    grand_mean,
                    n_total,
                    ss_total,
                    config.options.sig_level,
                    &mut ss_model,
                    &mut source
                )?;
            }
        }
    }

    // Calculate the total number of interaction terms
    let interaction_terms_count = interaction_terms.len();

    // Calculate error degrees of freedom, adjusting for interactions
    let df_error =
        n_total -
        (if config.model.intercept { 1 } else { 0 }) -
        (if let Some(factors) = &config.main.fix_factor { factors.len() } else { 0 }) -
        interaction_terms_count;

    // Calculate error sum of squares and mean square
    let ss_error = ss_total - ss_model;
    let ms_error = if df_error > 0 { ss_error / (df_error as f64) } else { 0.0 };

    // Add error term
    source.insert("Error".to_string(), TestEffectEntry {
        sum_of_squares: ss_error,
        df: df_error,
        mean_square: ms_error,
        f_value: 0.0, // Not applicable for error
        significance: 0.0, // Not applicable for error
        partial_eta_squared: 0.0, // Not applicable for error
        noncent_parameter: 0.0, // Not applicable for error
        observed_power: 0.0, // Not applicable for error
    });

    // Add total
    source.insert("Total".to_string(), TestEffectEntry {
        sum_of_squares: all_values
            .iter()
            .map(|x| x.powi(2))
            .sum::<f64>(),
        df: n_total,
        mean_square: 0.0, // Not applicable for total
        f_value: 0.0, // Not applicable for total
        significance: 0.0, // Not applicable for total
        partial_eta_squared: 0.0, // Not applicable for total
        noncent_parameter: 0.0, // Not applicable for total
        observed_power: 0.0, // Not applicable for total
    });

    // Add corrected total
    source.insert("Corrected Total".to_string(), TestEffectEntry {
        sum_of_squares: ss_total,
        df: n_total - 1,
        mean_square: 0.0, // Not applicable for corrected total
        f_value: 0.0, // Not applicable for corrected total
        significance: 0.0, // Not applicable for corrected total
        partial_eta_squared: 0.0, // Not applicable for corrected total
        noncent_parameter: 0.0, // Not applicable for corrected total
        observed_power: 0.0, // Not applicable for corrected total
    });

    // Add corrected model with interaction terms included
    let model_df = if let Some(factors) = &config.main.fix_factor {
        factors.len() + interaction_terms_count + (if config.model.intercept { 1 } else { 0 }) - 1
    } else {
        (if config.model.intercept { 1 } else { 0 }) - 1
    };

    let model_ms = if model_df > 0 { ss_model / (model_df as f64) } else { 0.0 };
    let model_f = if ms_error > 0.0 { model_ms / ms_error } else { 0.0 };
    let model_sig = calculate_f_significance(model_df, df_error, model_f);
    let model_eta = if ss_total > 0.0 { ss_model / ss_total } else { 0.0 };
    let model_noncent = model_f * (model_df as f64);
    let model_power = calculate_observed_power(
        model_df,
        df_error,
        model_f,
        config.options.sig_level
    );

    source.insert("Corrected Model".to_string(), TestEffectEntry {
        sum_of_squares: ss_model,
        df: model_df,
        mean_square: model_ms,
        f_value: model_f,
        significance: model_sig,
        partial_eta_squared: model_eta,
        noncent_parameter: model_noncent,
        observed_power: model_power,
    });

    // Calculate R-squared statistics, adjusting for interaction terms
    let r_squared = if ss_total > 0.0 { ss_model / ss_total } else { 0.0 };
    let adjusted_r_squared =
        1.0 -
        (1.0 - r_squared) *
            (((n_total - 1) as f64) /
                ((n_total - factor_combinations.len() - interaction_terms_count) as f64));

    Ok(TestsBetweenSubjectsEffects {
        source,
        r_squared,
        adjusted_r_squared,
    })
}

/// Process Type I factors and interactions
fn process_type_i_factors_and_interactions(
    data: &AnalysisData,
    factors: &[String],
    interaction_terms: &[String],
    dep_var_name: &str,
    grand_mean: f64,
    all_values: &[f64],
    n_total: usize,
    ss_total: f64,
    sig_level: f64,
    ss_model: &mut f64,
    source: &mut HashMap<String, TestEffectEntry>
) -> Result<(), String> {
    // Type I: Sequential SS - each term adjusted for terms that precede it
    let mut residual_values = all_values.to_vec();
    let mut residual_mean = grand_mean;

    // Process main factors sequentially
    for factor in factors {
        let factor_levels = get_factor_levels(data, factor)?;
        let df = factor_levels.len() - 1;

        // Calculate factor SS
        let factor_ss = calculate_factor_ss(
            data,
            factor,
            dep_var_name,
            grand_mean,
            SumOfSquaresMethod::TypeI,
            Some(&residual_values),
            Some(residual_mean)
        )?;

        *ss_model += factor_ss;

        // Adjust residuals for this factor
        for (i, dep_record) in data.dependent_data.iter().flatten().enumerate() {
            if i >= residual_values.len() {
                continue;
            }

            // Find the level of this factor for the current record
            let mut factor_level: Option<String> = None;

            // Search in fix_factor_data for this factor's level
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

            // If we found the factor level, adjust the residual
            if let Some(level) = factor_level {
                let level_values = get_level_values_adjusted(
                    &residual_values,
                    data,
                    factor,
                    &level,
                    dep_var_name
                )?;

                if !level_values.is_empty() {
                    let level_mean = calculate_mean(&level_values);
                    residual_values[i] = residual_values[i] - (level_mean - residual_mean);
                }
            }
        }

        // Update residual mean
        residual_mean = calculate_mean(&residual_values);

        // Create effect entry
        let error_df = n_total - factors.len();
        let error_ms = (ss_total - *ss_model) / (error_df as f64);

        source.insert(
            factor.to_string(),
            create_effect_entry(factor_ss, df, error_ms, error_df, sig_level)
        );
    }

    // Process interaction terms sequentially for Type I
    process_type_i_interactions(
        data,
        interaction_terms,
        dep_var_name,
        grand_mean,
        factors,
        &residual_values,
        residual_mean,
        ss_model,
        n_total,
        ss_total,
        sig_level,
        source
    )
}

/// Process Type II factors and interactions
fn process_type_ii_factors_and_interactions(
    data: &AnalysisData,
    factors: &[String],
    interaction_terms: &[String],
    dep_var_name: &str,
    grand_mean: f64,
    n_total: usize,
    ss_total: f64,
    sig_level: f64,
    ss_model: &mut f64,
    source: &mut HashMap<String, TestEffectEntry>
) -> Result<(), String> {
    // Type II: Each effect adjusted for all other "appropriate" effects
    for factor in factors {
        let factor_levels = get_factor_levels(data, factor)?;
        let df = factor_levels.len() - 1;

        // Calculate factor SS
        let factor_ss = calculate_factor_ss(
            data,
            factor,
            dep_var_name,
            grand_mean,
            SumOfSquaresMethod::TypeII,
            None,
            None
        )?;

        *ss_model += factor_ss;

        // Create effect entry
        let error_df = n_total - factors.len();
        let error_ms = (ss_total - *ss_model) / (error_df as f64);

        source.insert(
            factor.to_string(),
            create_effect_entry(factor_ss, df, error_ms, error_df, sig_level)
        );
    }

    // Process interaction terms for Type II
    process_type_ii_interactions(
        data,
        interaction_terms,
        dep_var_name,
        grand_mean,
        factors,
        ss_model,
        n_total,
        ss_total,
        sig_level,
        source
    )
}

/// Process Type III/IV factors and interactions
fn process_type_iii_factors_and_interactions(
    data: &AnalysisData,
    factors: &[String],
    interaction_terms: &[String],
    dep_var_name: &str,
    grand_mean: f64,
    n_total: usize,
    ss_total: f64,
    sig_level: f64,
    ss_model: &mut f64,
    source: &mut HashMap<String, TestEffectEntry>
) -> Result<(), String> {
    // Type III/IV: Orthogonal to any effects that contain it
    for factor in factors {
        let factor_levels = get_factor_levels(data, factor)?;
        let df = factor_levels.len() - 1;

        // Calculate factor SS
        let factor_ss = calculate_factor_ss(
            data,
            factor,
            dep_var_name,
            grand_mean,
            SumOfSquaresMethod::TypeIII,
            None,
            None
        )?;

        *ss_model += factor_ss;

        // Create effect entry
        let error_df = n_total - factors.len() - interaction_terms.len();
        let error_ms = (ss_total - *ss_model) / (error_df as f64);

        source.insert(
            factor.to_string(),
            create_effect_entry(factor_ss, df, error_ms, error_df, sig_level)
        );
    }

    // Process interaction terms for Type III/IV
    process_type_iii_interactions(
        data,
        interaction_terms,
        dep_var_name,
        grand_mean,
        factors,
        ss_model,
        n_total,
        ss_total,
        sig_level,
        source
    )
}

/// Process Type I interaction terms
fn process_type_i_interactions(
    data: &AnalysisData,
    interaction_terms: &[String],
    dep_var_name: &str,
    grand_mean: f64,
    factors: &[String],
    residual_values: &[f64],
    residual_mean: f64,
    ss_model: &mut f64,
    n_total: usize,
    ss_total: f64,
    sig_level: f64,
    source: &mut HashMap<String, TestEffectEntry>
) -> Result<(), String> {
    let mut current_residuals = residual_values.to_vec();
    let mut current_residual_mean = residual_mean;

    for interaction_term in interaction_terms {
        let df = calculate_interaction_df(data, interaction_term)?;

        // Calculate interaction SS
        let ss_interaction = calculate_interaction_ss(
            data,
            interaction_term,
            dep_var_name,
            grand_mean,
            SumOfSquaresMethod::TypeI,
            factors,
            Some(&current_residuals),
            Some(current_residual_mean)
        )?;

        *ss_model += ss_interaction;

        // Create effect entry for the interaction
        let error_df = n_total - factors.len() - interaction_terms.len();
        let error_ms = (ss_total - *ss_model) / (error_df as f64);

        source.insert(
            interaction_term.clone(),
            create_effect_entry(ss_interaction, df, error_ms, error_df, sig_level)
        );

        // Update residuals for this interaction
        // For Type I, we need to adjust residuals after each term
        let interaction_factors = parse_interaction_term(interaction_term);
        let mut factor_levels_map = Vec::new();

        for factor in &interaction_factors {
            let levels = get_factor_levels(data, factor)?;
            factor_levels_map.push((factor.clone(), levels));
        }

        // Generate all level combinations
        let mut level_combinations = Vec::new();
        let mut current_combo = HashMap::new();

        generate_level_combinations(
            &factor_levels_map,
            &mut current_combo,
            0,
            &mut level_combinations
        );

        // Calculate means for each combination of residuals
        let mut combination_means = Vec::new();
        let mut combination_counts = Vec::new();
        let mut combination_indices = Vec::new();

        for combo in &level_combinations {
            let mut values_for_combo = Vec::new();
            let mut indices_for_combo = Vec::new();

            // Find all records that match this combination
            for (i, dep_record) in data.dependent_data.iter().flatten().enumerate() {
                if i >= current_residuals.len() {
                    continue;
                }

                // Check if all factors match this combination
                let all_factors_match = combo.iter().all(|(factor, expected_level)| {
                    // Look in fix_factor_data for this factor's value
                    for fix_factor_group in &data.fix_factor_data {
                        for fix_record in fix_factor_group {
                            if let Some(value) = fix_record.values.get(factor) {
                                let actual_level = data_value_to_string(value);
                                if &actual_level == expected_level {
                                    return true;
                                }
                            }
                        }
                    }
                    false
                });

                if all_factors_match {
                    values_for_combo.push(current_residuals[i]);
                    indices_for_combo.push(i);
                }
            }

            if !values_for_combo.is_empty() {
                let mean = calculate_mean(&values_for_combo);
                combination_means.push(mean);
                combination_counts.push(values_for_combo.len());
                combination_indices.push(indices_for_combo);
            } else {
                combination_means.push(0.0);
                combination_counts.push(0);
                combination_indices.push(Vec::new());
            }
        }

        // Calculate weighted grand mean for these combinations
        let total_count: usize = combination_counts.iter().sum();
        if total_count > 0 {
            let weighted_mean =
                combination_means
                    .iter()
                    .zip(combination_counts.iter())
                    .map(|(mean, &count)| mean * (count as f64))
                    .sum::<f64>() / (total_count as f64);

            // Update residuals for each record
            for (combo_idx, indices) in combination_indices.iter().enumerate() {
                if combo_idx < combination_means.len() {
                    for &idx in indices {
                        current_residuals[idx] =
                            current_residuals[idx] - (combination_means[combo_idx] - weighted_mean);
                    }
                }
            }

            // Update residual mean
            current_residual_mean = calculate_mean(&current_residuals);
        }
    }

    Ok(())
}

/// Process Type II interaction terms
fn process_type_ii_interactions(
    data: &AnalysisData,
    interaction_terms: &[String],
    dep_var_name: &str,
    grand_mean: f64,
    factors: &[String],
    ss_model: &mut f64,
    n_total: usize,
    ss_total: f64,
    sig_level: f64,
    source: &mut HashMap<String, TestEffectEntry>
) -> Result<(), String> {
    for interaction_term in interaction_terms {
        let df = calculate_interaction_df(data, interaction_term)?;

        // Calculate interaction SS for Type II
        let ss_interaction = calculate_interaction_ss(
            data,
            interaction_term,
            dep_var_name,
            grand_mean,
            SumOfSquaresMethod::TypeII,
            factors,
            None,
            None
        )?;

        *ss_model += ss_interaction;

        // Create effect entry for the interaction
        let error_df = n_total - factors.len() - interaction_terms.len();
        let error_ms = (ss_total - *ss_model) / (error_df as f64);

        source.insert(
            interaction_term.clone(),
            create_effect_entry(ss_interaction, df, error_ms, error_df, sig_level)
        );
    }

    Ok(())
}

/// Process Type III/IV interaction terms
fn process_type_iii_interactions(
    data: &AnalysisData,
    interaction_terms: &[String],
    dep_var_name: &str,
    grand_mean: f64,
    factors: &[String],
    ss_model: &mut f64,
    n_total: usize,
    ss_total: f64,
    sig_level: f64,
    source: &mut HashMap<String, TestEffectEntry>
) -> Result<(), String> {
    for interaction_term in interaction_terms {
        let df = calculate_interaction_df(data, interaction_term)?;

        // Calculate interaction SS for Type III/IV
        let ss_interaction = calculate_interaction_ss(
            data,
            interaction_term,
            dep_var_name,
            grand_mean,
            SumOfSquaresMethod::TypeIII,
            factors,
            None,
            None
        )?;

        *ss_model += ss_interaction;

        // Create effect entry for the interaction
        let error_df = n_total - factors.len() - interaction_terms.len();
        let error_ms = (ss_total - *ss_model) / (error_df as f64);

        source.insert(
            interaction_term.clone(),
            create_effect_entry(ss_interaction, df, error_ms, error_df, sig_level)
        );
    }

    Ok(())
}
