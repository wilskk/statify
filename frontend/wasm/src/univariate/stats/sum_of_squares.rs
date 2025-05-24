use std::collections::HashMap;
use nalgebra::{ DMatrix, DVector };
use crate::univariate::models::{
    config::{ SumOfSquaresMethod, UnivariateConfig },
    data::{ AnalysisData, DataValue },
};

use super::{ core::*, hypothesis_matrix };

// Helper for Type I SS calculation given term matrix and residuals
fn calculate_type_i_ss_for_term_matrix(
    x_term_nalgebra: &DMatrix<f64>,
    residuals_nalgebra: &DVector<f64>,
    term_name: &str // For error messages
) -> Result<f64, String> {
    if x_term_nalgebra.nrows() == 0 || x_term_nalgebra.ncols() == 0 {
        return Ok(0.0); // No data or no columns for the term
    }
    if x_term_nalgebra.nrows() != residuals_nalgebra.len() {
        return Err(
            format!(
                "Term '{}' design matrix ({} rows) and residuals ({} elements) mismatch for Type I SS.",
                term_name,
                x_term_nalgebra.nrows(),
                residuals_nalgebra.len()
            )
        );
    }

    let xt = x_term_nalgebra.transpose();
    let xtx = &xt * x_term_nalgebra;

    // Use pseudo-inverse for stability, though for a term's X'X, it should ideally be invertible if term is well-defined.
    let xtx_inv = xtx
        .svd(true, true)
        .pseudo_inverse(1e-10)
        .map_err(|e|
            format!("X'X pseudo-inversion failed for term '{}' in Type I SS: {}", term_name, e)
        )?;

    let b_hat = &xtx_inv * (&xt * residuals_nalgebra);
    let ss_term = b_hat.dot(&(&xt * residuals_nalgebra));

    Ok(ss_term.max(0.0))
}

/// REVISED Public API for Type I SS
pub fn calculate_type_i_ss(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    residuals_nalgebra: &DVector<f64> // Residuals from model with PREVIOUS terms
) -> Result<f64, String> {
    if residuals_nalgebra.is_empty() || design_info.n_samples == 0 {
        return Ok(0.0);
    }
    if residuals_nalgebra.len() != design_info.n_samples {
        return Err(
            format!(
                "Residuals length ({}) does not match N_samples ({}) for Type I SS of term '{}'",
                residuals_nalgebra.len(),
                design_info.n_samples,
                term_of_interest
            )
        );
    }

    // Extract X_term (columns for the current term_of_interest) from the full design_info.x
    let (term_start_col, term_end_col) = design_info.term_column_indices
        .get(term_of_interest)
        .ok_or_else(||
            format!("Term '{}' not found in design matrix column map for Type I SS.", term_of_interest)
        )?;

    if term_start_col > term_end_col {
        // Should not happen if map is correct
        return Ok(0.0); // Or an error, indicates issue with term_column_indices
    }
    let num_cols_for_term = term_end_col - term_start_col + 1;
    if num_cols_for_term == 0 {
        return Ok(0.0); // Term has no columns in the design matrix
    }

    let x_term_nalgebra = design_info.x.columns(*term_start_col, num_cols_for_term).into_owned();

    calculate_type_i_ss_for_term_matrix(&x_term_nalgebra, residuals_nalgebra, term_of_interest)
}

/// REVISED Public API for Type II SS - now uses L-matrix approach
pub fn calculate_type_ii_ss(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    beta_hat: &DVector<f64>, // Parameter estimates from the overall model
    g_inv: &DMatrix<f64> // G = (X'WX)^-1 from the overall model
) -> Result<(f64, usize), String> {
    // Return (SS, df)
    if design_info.n_samples == 0 {
        return Ok((0.0, 0));
    }

    // Construct the L-matrix for Type II SS for the term_of_interest
    let l_matrix_for_term = hypothesis_matrix::construct_type_ii_l_matrix(
        design_info,
        term_of_interest,
        &design_info.term_names // Pass all model terms from design_info
    )?;

    if l_matrix_for_term.nrows() == 0 {
        // If L matrix has no rows (e.g., term is non-estimable or has 0 df by Type II rules)
        return Ok((0.0, 0));
    }

    // Use the common SS calculation function
    calculate_type_iii_iv_ss_for_term(&l_matrix_for_term, beta_hat, g_inv, term_of_interest)
}

fn check_for_missing_cells_in_interaction(
    data: &AnalysisData,
    config: &UnivariateConfig,
    interaction_term: &str
) -> Result<bool, String> {
    let factors_in_interaction = parse_interaction_term(interaction_term);
    for f_name in factors_in_interaction {
        if check_for_missing_cells(data, config, &f_name)? {
            return Ok(true);
        }
    }
    Ok(false)
}

/// REVISED calculate_type_iii_iv_ss_for_term
/// This function now assumes DesignMatrixInfo is provided,
/// and an L matrix specific to the term_of_interest has been constructed.
fn calculate_type_iii_iv_ss_for_term(
    l_matrix: &DMatrix<f64>, // Contrast matrix for the hypothesis L * beta = 0
    beta_hat_model: &DVector<f64>, // Parameter estimates B̂ from the overall model
    g_inv_model: &DMatrix<f64>, // G = (X'WX)⁻¹ from the overall model
    term_of_interest: &str // For error messages and context
) -> Result<(f64, usize), String> {
    // Return (SS, df)
    if l_matrix.nrows() == 0 || l_matrix.ncols() == 0 {
        // If L matrix is empty (e.g. 0 rows for a non-estimable term, or 0 cols if p_parameters is 0)
        // This check is more robust before multiplication.
        return Ok((0.0, 0));
    }
    if beta_hat_model.nrows() != l_matrix.ncols() {
        return Err(
            format!(
                "L-matrix ({},{}) and Beta-hat ({}) dimensions mismatch for term '{}'",
                l_matrix.nrows(),
                l_matrix.ncols(),
                beta_hat_model.nrows(),
                term_of_interest
            )
        );
    }
    if g_inv_model.nrows() != l_matrix.ncols() || g_inv_model.ncols() != l_matrix.ncols() {
        return Err(
            format!(
                "L-matrix ({},{}) and G_inv ({},{}) dimensions mismatch for term '{}'",
                l_matrix.nrows(),
                l_matrix.ncols(),
                g_inv_model.nrows(),
                g_inv_model.ncols(),
                term_of_interest
            )
        );
    }

    // L * B̂
    let l_beta_hat = l_matrix * beta_hat_model;

    // L * G * L'
    let l_g_inv_lt = l_matrix * g_inv_model * l_matrix.transpose();

    // The rank of LGL' gives the degrees of freedom for the hypothesis L*beta=0
    let df_term = l_g_inv_lt.rank(1e-8); // Use a small tolerance for rank calculation

    if df_term == 0 {
        // If rank is 0, LGL' is effectively zero, SS is 0.
        return Ok((0.0, 0));
    }

    let l_g_inv_lt_inv_tolerance = 1e-8;
    let l_g_inv_lt_inv = l_g_inv_lt
        .clone()
        .svd(true, true)
        .pseudo_inverse(l_g_inv_lt_inv_tolerance)
        .map_err(|e|
            format!(
                "Singular (LGL') matrix for term '{}', pseudo-inverse failed: {}. Cannot compute SS. LGL' norm: {:.2e}",
                term_of_interest,
                e,
                l_g_inv_lt.norm()
            )
        )?;

    // SS_H = (L B̂)' (L G L')⁻¹ (L B̂)
    let ss_matrix = l_beta_hat.transpose() * l_g_inv_lt_inv * l_beta_hat;

    if ss_matrix.nrows() == 1 && ss_matrix.ncols() == 1 {
        Ok((ss_matrix[(0, 0)].max(0.0), df_term))
    } else {
        Err(
            format!(
                "SS calculation for term '{}' resulted in a non-scalar matrix ({}x{}).",
                term_of_interest,
                ss_matrix.nrows(),
                ss_matrix.ncols()
            )
        )
    }
}

/// Public API for Type III SS
pub fn calculate_type_iii_ss(
    l_matrix_for_term: &DMatrix<f64>, // L matrix specific to the term of interest
    beta_hat: &DVector<f64>, // Parameter estimates from the overall model
    g_inv: &DMatrix<f64>, // G = (X'WX)^-1 from the overall model
    term_of_interest: &str
) -> Result<(f64, usize), String> {
    // Return (SS, df)
    calculate_type_iii_iv_ss_for_term(l_matrix_for_term, beta_hat, g_inv, term_of_interest)
}

/// Public API for Type IV SS
pub fn calculate_type_iv_ss(
    l_matrix_for_term: &DMatrix<f64>, // L matrix specific to the term, constructed with Type IV rules
    beta_hat: &DVector<f64>, // Parameter estimates from the overall model
    g_inv: &DMatrix<f64>, // G = (X'WX)^-1 from the overall model
    term_of_interest: &str
) -> Result<(f64, usize), String> {
    // Return (SS, df)
    calculate_type_iii_iv_ss_for_term(l_matrix_for_term, beta_hat, g_inv, term_of_interest)
}

/// Calculate the sum of squares for a covariate (Refactored with nalgebra)
pub fn calculate_covariate_ss(
    dependent_values: &[f64],
    covariate_values: &[f64],
    _grand_mean_dep: f64 // Not directly used if centering both Y and X
) -> Result<f64, String> {
    if dependent_values.len() != covariate_values.len() {
        return Err(
            format!(
                "Dependent variable data count ({}) does not match covariate data count ({}).",
                dependent_values.len(),
                covariate_values.len()
            )
        );
    }
    if dependent_values.is_empty() {
        return Ok(0.0); // No data, so no SS
    }

    let y_dvec = to_dvector(dependent_values);
    let cov_dvec = to_dvector(covariate_values);

    // Center both dependent and covariate values
    let y_mean = y_dvec.mean();
    let cov_mean = cov_dvec.mean();

    let y_centered = y_dvec.map(|val| val - y_mean);
    let cov_centered = cov_dvec.map(|val| val - cov_mean);

    // Denominator for beta calculation: sum of squared centered covariate values (Sxx)
    let s_xx = cov_centered.dot(&cov_centered);

    if s_xx.abs() < 1e-12 {
        // Using a very small epsilon to check for zero variance of covariate
        // If covariate has no variance, it cannot explain any variance in Y.
        return Ok(0.0);
    }

    // Numerator for beta calculation: sum of products of centered Y and centered covariate (Sxy)
    let s_xy = y_centered.dot(&cov_centered);

    // Regression coefficient beta = Sxy / Sxx
    let beta = s_xy / s_xx;

    // Sum of Squares for covariate = beta * Sxy (or beta^2 * Sxx)
    let ss_covariate = beta * s_xy;

    Ok(ss_covariate.max(0.0)) // SS should not be negative
}

// Fallback SS calculation for factors or interactions (generic helper)
fn calculate_raw_ss_for_term_or_interaction(
    data: &AnalysisData,
    term_or_interaction: &str, // e.g., "FactorA" or "FactorA*FactorB"
    dep_var_name: &str,
    grand_mean: f64
) -> Result<f64, String> {
    let term_factors = parse_interaction_term(term_or_interaction);

    let mut factor_levels_for_combo_gen = Vec::new();
    for factor_name in &term_factors {
        let levels = get_factor_levels(data, factor_name)?;
        if levels.is_empty() {
            // If any constituent factor has no levels, this term/interaction is effectively empty.
            return Ok(0.0);
        }
        factor_levels_for_combo_gen.push((factor_name.clone(), levels));
    }

    let mut level_combinations = Vec::new();
    if !factor_levels_for_combo_gen.is_empty() {
        // If only one factor, generate_level_combinations will produce HashMaps like {"FactorA": "level1"}, {"FactorA": "level2"}
        // If multiple factors, it produces interaction combinations like {"FactorA": "A1", "FactorB": "B1"}, etc.
        generate_level_combinations(
            &factor_levels_for_combo_gen,
            &mut HashMap::new(), // Start with an empty current combination
            0, // Start at the first factor in factor_levels_for_combo_gen
            &mut level_combinations
        );
    }

    if level_combinations.is_empty() && !term_factors.is_empty() {
        // This case might occur if factors were parsed but no levels led to combinations.
        // Or if term_factors was empty initially (e.g. an empty string term), though caught earlier.
        return Ok(0.0);
    }

    let mut ss = 0.0;
    for combo_map in &level_combinations {
        let mut values_for_combo = Vec::new();
        // Iterate through all dependent data records
        for records_group in &data.dependent_data {
            for record in records_group {
                let mut current_record_matches_combo = true;
                // Check if the current record matches all factor levels in the combo_map
                for (factor_in_combo, level_in_combo) in combo_map.iter() {
                    match record.values.get(factor_in_combo) {
                        Some(data_val) => {
                            if data_value_to_string(data_val) != *level_in_combo {
                                current_record_matches_combo = false;
                                break; // This factor doesn't match, so the record doesn't match the combo
                            }
                        }
                        None => {
                            // Factor not present in the record
                            current_record_matches_combo = false;
                            break;
                        }
                    }
                }

                if current_record_matches_combo {
                    if let Some(value) = extract_numeric_from_record(record, dep_var_name) {
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

/// Nalgebra version of perform_hypothesis_test
fn perform_hypothesis_test_nalgebra(
    x_nalgebra: &DMatrix<f64>,
    y_nalgebra: &DVector<f64>,
    l_nalgebra: &DMatrix<f64>
) -> Result<f64, String> {
    let xt = x_nalgebra.transpose();
    let xtx = &xt * x_nalgebra;
    let xty = &xt * y_nalgebra;

    let xtx_inv = match xtx.try_inverse() {
        Some(inv) => inv,
        None => {
            return Err("X'X matrix inversion failed in hypothesis test".to_string());
        }
    };
    let beta_hat = &xtx_inv * xty;
    let l_beta = l_nalgebra * beta_hat;

    let l_xtx_inv_lt = l_nalgebra * xtx_inv * l_nalgebra.transpose();

    let middle_inv = match l_xtx_inv_lt.try_inverse() {
        Some(inv) => inv,
        None => {
            return Err("L(X'X)^-1L' matrix inversion failed in hypothesis test".to_string());
        }
    };

    // SS = (L*beta_hat)' * (L*(X'X)^-1*L')^-1 * (L*beta_hat)
    let ss_matrix = l_beta.transpose() * middle_inv * l_beta; // This will be a 1x1 matrix

    if ss_matrix.nrows() == 1 && ss_matrix.ncols() == 1 {
        Ok(ss_matrix[(0, 0)])
    } else {
        Err("SS calculation resulted in non-scalar matrix".to_string())
    }
}
