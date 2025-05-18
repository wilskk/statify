use std::collections::HashMap;

use crate::univariate::models::{ config::SumOfSquaresMethod, data::AnalysisData };

use crate::univariate::stats::{
    common::{ calculate_mean, extract_dependent_value, get_factor_levels, get_level_values },
    design_matrix::{
        create_contrast_coded_interaction_matrix,
        create_contrast_coded_main_effect_matrix,
        create_interaction_design_matrix,
        create_main_effect_design_matrix,
        create_type_iv_interaction_matrix,
        create_type_iv_main_effect_matrix,
    },
    factor_utils::{ calculate_interaction_df, check_for_missing_cells, parse_interaction_term },
    matrix_utils::{
        calculate_l_beta,
        create_l_matrix,
        matrix_inverse,
        matrix_multiply,
        matrix_transpose,
        matrix_vec_multiply,
        extract_column,
        add_column_to_matrix,
    },
};

use super::data_value_to_string;
use super::factor_utils::generate_level_combinations;

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
        SumOfSquaresMethod::TypeIII =>
            calculate_type_iii_factor_ss(data, factor, dep_var_name, grand_mean),
        SumOfSquaresMethod::TypeIV => {
            // Check if there are missing cells in the design
            let has_missing_cells = check_for_missing_cells(data, factor)?;

            if has_missing_cells {
                // If missing cells, use Type IV calculation
                calculate_type_iv_factor_ss(data, factor, dep_var_name, grand_mean)
            } else {
                // If no missing cells, Type IV is equivalent to Type III
                calculate_type_iii_factor_ss(data, factor, dep_var_name, grand_mean)
            }
        }
    }
}

/// Calculate Type I (sequential) sum of squares for a factor
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

        // Create design matrix for this factor
        let x_factor = create_main_effect_design_matrix(data, factor)?;

        // Calculate X'X and X'y for the factor
        let x_transpose = matrix_transpose(&x_factor);
        let xtx = matrix_multiply(&x_transpose, &x_factor)?;
        let xty = matrix_vec_multiply(&x_transpose, residuals)?;

        // Calculate (X'X)^-1
        let xtx_inv = match matrix_inverse(&xtx) {
            Ok(inv) => inv,
            Err(_) => {
                return Err(format!("Could not invert matrix for factor {}", factor));
            }
        };

        // Calculate coefficients: b = (X'X)^-1 X'y
        let b = matrix_vec_multiply(&xtx_inv, &xty)?;

        // Calculate Type I SS = b'X'y
        let ss_factor = b
            .iter()
            .zip(xty.iter())
            .map(|(&b_i, &y_i)| b_i * y_i)
            .sum::<f64>();

        Ok(ss_factor)
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
    for records in &data.dependent_data {
        for record in records {
            if let Some(value) = extract_dependent_value(record, dep_var_name) {
                all_values.push(value);
            }
        }
    }

    // Get all factors in the model
    let mut all_factors = Vec::new();
    if let Some(fix_factor_defs) = data.fix_factor_data_defs.get(0) {
        for factor_def in fix_factor_defs {
            if factor_def.name != factor {
                all_factors.push(factor_def.name.clone());
            }
        }
    }

    // Create design matrix X_1 for factors that don't contain the factor of interest
    let mut x_1 = Vec::new();
    x_1.push(vec![1.0; all_values.len()]); // Intercept column

    for other_factor in &all_factors {
        let x_other = create_main_effect_design_matrix(data, other_factor)?;
        for col in 0..x_other[0].len() {
            let mut x_col = Vec::new();
            for row in 0..x_other.len() {
                x_col.push(x_other[row][col]);
            }
            x_1.push(x_col);
        }
    }

    // Transpose X_1 to make it [rows x columns]
    let x_1 = matrix_transpose(&x_1);

    // Create design matrix X_2 for the factor of interest
    let x_2 = create_main_effect_design_matrix(data, factor)?;

    // Calculate M_1 = I - X_1(X_1'X_1)^-1X_1'
    // First compute X_1'X_1
    let x_1_transpose = matrix_transpose(&x_1);
    let x_1t_x_1 = matrix_multiply(&x_1_transpose, &x_1)?;

    // Compute (X_1'X_1)^-1
    let x_1t_x_1_inv = match matrix_inverse(&x_1t_x_1) {
        Ok(inv) => inv,
        Err(_) => {
            return calculate_raw_factor_ss(data, factor, dep_var_name, grand_mean);
        }
    };

    // Compute X_1(X_1'X_1)^-1X_1'
    let x_1_x_1t_x_1_inv = matrix_multiply(&x_1, &x_1t_x_1_inv)?;
    let projection = matrix_multiply(&x_1_x_1t_x_1_inv, &x_1_transpose)?;

    // M_1 = I - P
    let n = all_values.len();
    let mut m_1 = vec![vec![0.0; n]; n];
    for i in 0..n {
        for j in 0..n {
            m_1[i][j] = if i == j { 1.0 } else { 0.0 };
            m_1[i][j] -= projection[i][j];
        }
    }

    // Calculate X_2'M_1X_2
    let x_2_transpose = matrix_transpose(&x_2);
    let x_2t_m_1 = matrix_multiply(&x_2_transpose, &m_1)?;
    let x_2t_m_1_x_2 = matrix_multiply(&x_2t_m_1, &x_2)?;

    // Calculate X_2'M_1y
    let x_2t_m_1_y = matrix_vec_multiply(&x_2t_m_1, &all_values)?;

    // Calculate (X_2'M_1X_2)^-1
    let c = match matrix_inverse(&x_2t_m_1_x_2) {
        Ok(inv) => inv,
        Err(_) => {
            return calculate_raw_factor_ss(data, factor, dep_var_name, grand_mean);
        }
    };

    // Calculate b = (X_2'M_1X_2)^-1 X_2'M_1y
    let b = matrix_vec_multiply(&c, &x_2t_m_1_y)?;

    // Calculate Type II SS = b'X_2'M_1y
    let ss = b
        .iter()
        .zip(x_2t_m_1_y.iter())
        .map(|(&b_i, &y_i)| b_i * y_i)
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
    for records in &data.dependent_data {
        for record in records {
            if let Some(value) = extract_dependent_value(record, dep_var_name) {
                all_values.push(value);
            }
        }
    }

    // Get all factors in the model
    let mut all_factors = Vec::new();
    if let Some(fix_factor_defs) = data.fix_factor_data_defs.get(0) {
        for factor_def in fix_factor_defs {
            all_factors.push(factor_def.name.clone());
        }
    }

    // Create the complete design matrix X with contrast coding
    let mut x_full = Vec::new();
    x_full.push(vec![1.0; all_values.len()]); // Intercept column

    let mut factor_columns = HashMap::new();
    let mut start_col = 1; // After intercept

    // Add columns for all factors
    for f in &all_factors {
        let x_f = if f == factor {
            create_contrast_coded_main_effect_matrix(data, f)?
        } else {
            create_main_effect_design_matrix(data, f)?
        };

        let num_cols = x_f[0].len();
        factor_columns.insert(f.clone(), (start_col, start_col + num_cols - 1));
        start_col += num_cols;

        for col in 0..x_f[0].len() {
            let mut x_col = Vec::new();
            for row in 0..x_f.len() {
                x_col.push(x_f[row][col]);
            }
            x_full.push(x_col);
        }
    }

    // Transpose to make X [rows x columns]
    let x = matrix_transpose(&x_full);

    // Get columns for the factor of interest
    let (start, end) = match factor_columns.get(factor) {
        Some(&range) => range,
        None => {
            return Err(format!("Factor {} not found in the model", factor));
        }
    };

    // Create the L matrix for the Type III test
    let l = create_l_matrix(start..=end, x_full.len());

    // Perform the hypothesis test
    perform_hypothesis_test(&x, &all_values, &l, ||
        calculate_raw_factor_ss(data, factor, dep_var_name, grand_mean)
    )
}

/// Calculate Type IV sum of squares for a factor
fn calculate_type_iv_factor_ss(
    data: &AnalysisData,
    factor: &str,
    dep_var_name: &str,
    grand_mean: f64
) -> Result<f64, String> {
    // Extract all dependent values
    let mut all_values = Vec::new();
    for records in &data.dependent_data {
        for record in records {
            if let Some(value) = extract_dependent_value(record, dep_var_name) {
                all_values.push(value);
            }
        }
    }

    // Type IV is similar to Type III but handles missing cells differently
    // Check for missing cells in the design
    let has_missing_cells = check_for_missing_cells(data, factor)?;

    if !has_missing_cells {
        // If no missing cells, Type IV = Type III
        return calculate_type_iii_factor_ss(data, factor, dep_var_name, grand_mean);
    }

    // Get all factors in the model
    let mut all_factors = Vec::new();
    if let Some(fix_factor_defs) = data.fix_factor_data_defs.get(0) {
        for factor_def in fix_factor_defs {
            all_factors.push(factor_def.name.clone());
        }
    }

    // Create full design matrix
    let mut x_full = Vec::new();
    x_full.push(vec![1.0; all_values.len()]); // Intercept column

    // Add columns for other factors (not including the current factor)
    for other_factor in &all_factors {
        if other_factor != factor {
            add_factor_to_design_matrix(&mut x_full, data, other_factor)?;
        }
    }

    // Add columns for the factor of interest with Type IV coding
    let x_factor = create_type_iv_main_effect_matrix(data, factor)?;
    for col_idx in 0..x_factor[0].len() {
        let mut column = Vec::new();
        for row in 0..x_factor.len() {
            column.push(x_factor[row][col_idx]);
        }
        add_column_to_matrix(&mut x_full, &column);
    }

    // Transpose to make X [rows x columns]
    let x = matrix_transpose(&x_full);

    // Determine the columns for the factor of interest in the design matrix
    let other_cols_count =
        1 + // Intercept
        all_factors
            .iter()
            .filter(|&f| f != factor)
            .fold(0, |acc, f| {
                acc + get_factor_levels(data, f).map_or(0, |levels| levels.len())
            });

    let factor_levels = get_factor_levels(data, factor)?;
    let factor_cols_count = if factor_levels.len() > 1 { factor_levels.len() - 1 } else { 1 };
    let factor_cols_range = other_cols_count..other_cols_count + factor_cols_count;

    // Create L matrix for Type IV hypothesis
    let l = create_l_matrix(factor_cols_range.start..=factor_cols_range.end - 1, x_full.len());

    // Perform the hypothesis test
    perform_hypothesis_test(&x, &all_values, &l, ||
        calculate_raw_factor_ss(data, factor, dep_var_name, grand_mean)
    )
}

/// Helper function to calculate raw SS for a factor without adjustments
pub fn calculate_raw_factor_ss(
    data: &AnalysisData,
    factor: &str,
    dep_var_name: &str,
    grand_mean: f64
) -> Result<f64, String> {
    // Get the levels for this factor
    let factor_levels = get_factor_levels(data, factor)?;

    // Calculate the sum of squares for the factor
    let mut ss = 0.0;

    for level in &factor_levels {
        // Get values for this factor level
        let level_values = get_level_values(data, factor, level, dep_var_name)?;

        if !level_values.is_empty() {
            let level_mean = calculate_mean(&level_values);
            ss += (level_values.len() as f64) * (level_mean - grand_mean).powi(2);
        }
    }

    Ok(ss)
}

/// Helper function to add factor columns to a design matrix
fn add_factor_to_design_matrix(
    design_matrix: &mut Vec<Vec<f64>>,
    data: &AnalysisData,
    factor: &str
) -> Result<(), String> {
    let x_factor = create_main_effect_design_matrix(data, factor)?;
    for col_idx in 0..x_factor[0].len() {
        let mut column = Vec::new();
        for row in 0..x_factor.len() {
            column.push(x_factor[row][col_idx]);
        }
        add_column_to_matrix(design_matrix, &column);
    }
    Ok(())
}

/// Helper function to perform the Type III/IV hypothesis test
pub fn perform_hypothesis_test(
    design_matrix: &[Vec<f64>],
    all_values: &[f64],
    l_matrix: &[Vec<f64>],
    fallback_fn: impl FnOnce() -> Result<f64, String>
) -> Result<f64, String> {
    // Calculate X'X and X'y
    let x_transpose = matrix_transpose(design_matrix);
    let xtx = matrix_multiply(&x_transpose, design_matrix)?;
    let xty = matrix_vec_multiply(&x_transpose, all_values)?;

    // Calculate (X'X)^-1
    let xtx_inv = match matrix_inverse(&xtx) {
        Ok(inv) => inv,
        Err(_) => {
            return fallback_fn();
        }
    };

    // Calculate β = (X'X)^-1 X'y
    let beta = matrix_vec_multiply(&xtx_inv, &xty)?;

    // Calculate L*β
    let l_beta = calculate_l_beta(l_matrix, &beta);

    // Calculate L * (X'X)^-1 * L'
    let l_xtx_inv = matrix_multiply(l_matrix, &xtx_inv)?;
    let l_xtx_inv_lt = matrix_multiply(&l_xtx_inv, &matrix_transpose(l_matrix))?;

    // Calculate (L * (X'X)^-1 * L')^-1
    let l_xtx_inv_lt_inv = match matrix_inverse(&l_xtx_inv_lt) {
        Ok(inv) => inv,
        Err(_) => {
            return fallback_fn();
        }
    };

    // Calculate SS = (Lβ)' * (L(X'X)^-1L')^-1 * (Lβ)
    let mut ss = 0.0;
    for i in 0..l_beta.len() {
        for j in 0..l_beta.len() {
            ss += l_beta[i] * l_xtx_inv_lt_inv[i][j] * l_beta[j];
        }
    }

    Ok(ss)
}

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
        SumOfSquaresMethod::TypeIII =>
            calculate_type_iii_interaction_ss(
                data,
                &interaction_factors,
                interaction_term,
                dep_var_name,
                grand_mean,
                factors
            ),
        SumOfSquaresMethod::TypeIV => {
            // For Type IV, check if there are missing cells in any of the interaction factors
            let mut has_missing_cells = false;
            for factor in &interaction_factors {
                has_missing_cells |= check_for_missing_cells(data, factor)?;
                if has_missing_cells {
                    break;
                }
            }

            if has_missing_cells {
                // If there are missing cells, we need to use a special calculation
                // that distributes weights based on available cells
                // For simplicity, we'll fall back to raw calculation here
                calculate_raw_interaction_ss(data, interaction_term, dep_var_name, grand_mean)
            } else {
                // If no missing cells, Type IV is equivalent to Type III
                calculate_type_iii_interaction_ss(
                    data,
                    &interaction_factors,
                    interaction_term,
                    dep_var_name,
                    grand_mean,
                    factors
                )
            }
        }
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
        // Create design matrix for the interaction term
        let x_interaction = create_interaction_design_matrix(data, interaction_term)?;

        // Calculate X'X and X'y
        let x_transpose = matrix_transpose(&x_interaction);
        let xtx = matrix_multiply(&x_transpose, &x_interaction)?;
        let xty = matrix_vec_multiply(&x_transpose, residuals)?;

        // Calculate (X'X)^-1
        let xtx_inv = match matrix_inverse(&xtx) {
            Ok(inv) => inv,
            Err(_) => {
                return Err(format!("Could not invert matrix for interaction {}", interaction_term));
            }
        };

        // Calculate coefficients: b = (X'X)^-1 X'y
        let b = matrix_vec_multiply(&xtx_inv, &xty)?;

        // Calculate Type I SS = b'X'y
        let ss_interaction = b
            .iter()
            .zip(xty.iter())
            .map(|(&b_i, &y_i)| b_i * y_i)
            .sum::<f64>();

        Ok(ss_interaction)
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
    // Extract all dependent values
    let mut all_values = Vec::new();
    for records in &data.dependent_data {
        for record in records {
            if let Some(value) = extract_dependent_value(record, dep_var_name) {
                all_values.push(value);
            }
        }
    }

    // Identify terms that don't contain this interaction
    let mut non_containing_terms = Vec::new();

    // Add intercept
    non_containing_terms.push("Intercept".to_string());

    // Add main effects and other interactions that don't contain this interaction
    for f in factors {
        if !interaction_factors.contains(f) {
            non_containing_terms.push(f.clone());
        } else {
            // Main effects that are part of the interaction
            non_containing_terms.push(f.clone());
        }
    }

    // Create design matrix X_1 for terms that don't fully contain the interaction
    let mut x_1 = Vec::new();
    x_1.push(vec![1.0; all_values.len()]); // Intercept column

    for term in &non_containing_terms {
        if term == "Intercept" {
            continue; // Already added
        }

        let x_term = if term.contains('*') {
            create_interaction_design_matrix(data, term)?
        } else {
            create_main_effect_design_matrix(data, term)?
        };

        for col in 0..x_term[0].len() {
            let mut x_col = Vec::new();
            for row in 0..x_term.len() {
                x_col.push(x_term[row][col]);
            }
            x_1.push(x_col);
        }
    }

    // Transpose X_1 to make it [rows x columns]
    let x_1 = matrix_transpose(&x_1);

    // Create design matrix X_2 for the interaction of interest
    let x_2 = create_interaction_design_matrix(data, interaction_term)?;

    // Calculate M_1 = I - X_1(X_1'X_1)^-1X_1'
    // First compute X_1'X_1
    let x_1_transpose = matrix_transpose(&x_1);
    let x_1t_x_1 = matrix_multiply(&x_1_transpose, &x_1)?;

    // Compute (X_1'X_1)^-1
    let x_1t_x_1_inv = match matrix_inverse(&x_1t_x_1) {
        Ok(inv) => inv,
        Err(_) => {
            return calculate_raw_interaction_ss(data, interaction_term, dep_var_name, grand_mean);
        }
    };

    // Compute X_1(X_1'X_1)^-1X_1'
    let x_1_x_1t_x_1_inv = matrix_multiply(&x_1, &x_1t_x_1_inv)?;
    let projection = matrix_multiply(&x_1_x_1t_x_1_inv, &x_1_transpose)?;

    // M_1 = I - P
    let n = all_values.len();
    let mut m_1 = vec![vec![0.0; n]; n];
    for i in 0..n {
        for j in 0..n {
            m_1[i][j] = if i == j { 1.0 } else { 0.0 };
            m_1[i][j] -= projection[i][j];
        }
    }

    // Calculate X_2'M_1X_2
    let x_2_transpose = matrix_transpose(&x_2);
    let x_2t_m_1 = matrix_multiply(&x_2_transpose, &m_1)?;
    let x_2t_m_1_x_2 = matrix_multiply(&x_2t_m_1, &x_2)?;

    // Calculate X_2'M_1y
    let x_2t_m_1_y = matrix_vec_multiply(&x_2t_m_1, &all_values)?;

    // Calculate (X_2'M_1X_2)^-1
    let c = match matrix_inverse(&x_2t_m_1_x_2) {
        Ok(inv) => inv,
        Err(_) => {
            return calculate_raw_interaction_ss(data, interaction_term, dep_var_name, grand_mean);
        }
    };

    // Calculate b = (X_2'M_1X_2)^-1 X_2'M_1y
    let b = matrix_vec_multiply(&c, &x_2t_m_1_y)?;

    // Calculate Type II SS = b'X_2'M_1y
    let ss = b
        .iter()
        .zip(x_2t_m_1_y.iter())
        .map(|(&b_i, &y_i)| b_i * y_i)
        .sum::<f64>();

    Ok(ss)
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
    // Extract all dependent values
    let mut all_values = Vec::new();
    for records in &data.dependent_data {
        for record in records {
            if let Some(value) = extract_dependent_value(record, dep_var_name) {
                all_values.push(value);
            }
        }
    }

    // Get all possible interaction terms
    let interaction_terms = generate_interaction_terms(factors);

    // Create the complete design matrix X with contrast coding
    let mut x_full = Vec::new();
    x_full.push(vec![1.0; all_values.len()]); // Intercept column

    let mut term_columns = HashMap::new();
    let mut start_col = 1; // After intercept

    // Add columns for all main effects
    for f in factors {
        let x_f = create_contrast_coded_main_effect_matrix(data, f)?;

        let num_cols = x_f[0].len();
        term_columns.insert(f.clone(), (start_col, start_col + num_cols - 1));
        start_col += num_cols;

        for col in 0..x_f[0].len() {
            let mut x_col = Vec::new();
            for row in 0..x_f.len() {
                x_col.push(x_f[row][col]);
            }
            x_full.push(x_col);
        }
    }

    // Add columns for all interaction terms
    for term in &interaction_terms {
        let x_term = create_contrast_coded_interaction_matrix(data, term)?;

        let num_cols = x_term[0].len();
        term_columns.insert(term.clone(), (start_col, start_col + num_cols - 1));
        start_col += num_cols;

        for col in 0..x_term[0].len() {
            let mut x_col = Vec::new();
            for row in 0..x_term.len() {
                x_col.push(x_term[row][col]);
            }
            x_full.push(x_col);
        }
    }

    // Transpose to make X [rows x columns]
    let x = matrix_transpose(&x_full);

    // Calculate X'X and X'y
    let x_transpose = matrix_transpose(&x);
    let xtx = matrix_multiply(&x_transpose, &x)?;
    let xty = matrix_vec_multiply(&x_transpose, &all_values)?;

    // Full design matrix hypothesis test matrix H = (X'X)^-
    let xtx_inv = match matrix_inverse(&xtx) {
        Ok(inv) => inv,
        Err(_) => {
            return calculate_raw_interaction_ss(data, interaction_term, dep_var_name, grand_mean);
        }
    };

    // Create L matrix for Type III hypothesis
    // Get columns for the interaction term of interest
    let (start, end) = match term_columns.get(interaction_term) {
        Some(&range) => range,
        None => {
            return Err(format!("Interaction term {} not found in the model", interaction_term));
        }
    };

    // Create the L matrix for the Type III test
    let mut l = Vec::new();
    for col in start..=end {
        let mut row = vec![0.0; xtx.len()];
        row[col] = 1.0;
        l.push(row);
    }

    // Calculate estimate β = (X'X)^-1 X'y
    let beta = matrix_vec_multiply(&xtx_inv, &xty)?;

    // Calculate L*β
    let mut l_beta = Vec::new();
    for row in &l {
        let mut sum = 0.0;
        for (i, &val) in row.iter().enumerate() {
            sum += val * beta[i];
        }
        l_beta.push(sum);
    }

    // Calculate L * (X'X)^-1 * L'
    let l_xtx_inv = matrix_multiply(&l, &xtx_inv)?;
    let l_xtx_inv_lt = matrix_multiply(&l_xtx_inv, &matrix_transpose(&l))?;

    // Calculate (L * (X'X)^-1 * L')^-1
    let l_xtx_inv_lt_inv = match matrix_inverse(&l_xtx_inv_lt) {
        Ok(inv) => inv,
        Err(_) => {
            return calculate_raw_interaction_ss(data, interaction_term, dep_var_name, grand_mean);
        }
    };

    // Calculate Type III SS = (Lβ)' * (L(X'X)^-1L')^-1 * (Lβ)
    let mut ss = 0.0;
    for i in 0..l_beta.len() {
        for j in 0..l_beta.len() {
            ss += l_beta[i] * l_xtx_inv_lt_inv[i][j] * l_beta[j];
        }
    }

    Ok(ss)
}

/// Calculate Type IV sum of squares for interaction effects
pub fn calculate_type_iv_interaction_ss(
    data: &AnalysisData,
    interaction_factors: &[String],
    interaction_term: &str,
    dep_var_name: &str,
    grand_mean: f64,
    factors: &[String]
) -> Result<f64, String> {
    // Check for missing cells
    let mut has_missing_cells = false;

    // Get levels for each factor in the interaction
    let mut factor_levels = Vec::new();
    for factor in interaction_factors {
        let levels = get_factor_levels(data, factor)?;
        factor_levels.push((factor.clone(), levels));

        // Check if this factor has missing cells
        if check_for_missing_cells(data, factor)? {
            has_missing_cells = true;
        }
    }

    if !has_missing_cells {
        // If no missing cells, Type IV = Type III
        return calculate_type_iii_interaction_ss(
            data,
            interaction_factors,
            interaction_term,
            dep_var_name,
            grand_mean,
            factors
        );
    }

    // Extract all dependent values
    let mut all_values = Vec::new();
    for records in &data.dependent_data {
        for record in records {
            if let Some(value) = extract_dependent_value(record, dep_var_name) {
                all_values.push(value);
            }
        }
    }

    // Create full design matrix with all main effects and the interaction
    let mut x_full = Vec::new();
    x_full.push(vec![1.0; all_values.len()]); // Intercept

    // Add main effects
    for factor in factors {
        add_factor_to_design_matrix(&mut x_full, data, factor)?;
    }

    // Create Type IV interaction design matrix that distributes weights based on available cells
    let x_interaction = create_type_iv_interaction_matrix(data, interaction_term)?;

    // Add the interaction of interest with Type IV coding
    for col_idx in 0..x_interaction[0].len() {
        let column = extract_column(&x_interaction, col_idx);
        add_column_to_matrix(&mut x_full, &column);
    }

    // Transpose to make X [rows x columns]
    let x = matrix_transpose(&x_full);

    // Determine the columns for the interaction in the design matrix
    let main_effects_cols =
        1 + // Intercept
        factors
            .iter()
            .fold(0, |acc, f| {
                acc + get_factor_levels(data, f).map_or(0, |levels| levels.len())
            });

    let interaction_cols = x_interaction[0].len();
    let interaction_cols_range = main_effects_cols..main_effects_cols + interaction_cols;

    // Create L matrix for Type IV hypothesis
    let l = create_l_matrix(
        interaction_cols_range.start..=interaction_cols_range.end - 1,
        x_full.len()
    );

    // Perform the hypothesis test
    perform_hypothesis_test(&x, &all_values, &l, ||
        calculate_raw_interaction_ss(data, interaction_term, dep_var_name, grand_mean)
    )
}

/// Helper function to calculate raw SS for an interaction term without adjustments
pub fn calculate_raw_interaction_ss(
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

/// Helper function to generate all interaction terms from a list of factors
pub fn generate_interaction_terms(factors: &[String]) -> Vec<String> {
    if factors.len() <= 1 {
        return Vec::new();
    }

    let mut result = Vec::new();

    // Generate all 2-way interactions
    let mut current = Vec::new();
    for i in 2..=factors.len() {
        generate_lower_order_terms(factors, i, &mut current, 0, &mut result);
    }

    result
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
