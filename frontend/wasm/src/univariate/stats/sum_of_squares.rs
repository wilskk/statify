use std::collections::HashMap;
use nalgebra::{ DMatrix, DVector };
use crate::univariate::models::{
    config::{ SumOfSquaresMethod, UnivariateConfig },
    data::{ AnalysisData, DataValue },
};

use super::{ core::* };

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

/// Helper for Type II SS calculation given Y, X_reduced, and X_term
fn calculate_type_ii_ss_from_components(
    y_nalgebra: &DVector<f64>,
    x_reduced_nalgebra: &DMatrix<f64>,
    x_term_nalgebra: &DMatrix<f64>,
    term_name: &str, // For error messages
    n_obs: usize
) -> Result<f64, String> {
    if
        x_term_nalgebra.nrows() != n_obs ||
        (x_reduced_nalgebra.ncols() > 0 && x_reduced_nalgebra.nrows() != n_obs)
    {
        return Err(
            format!(
                "Matrix row mismatch for Type II SS of term '{}': Y({}), X_reduced({}x{}), X_term({}x{}). Expected {} rows.",
                term_name,
                y_nalgebra.len(),
                x_reduced_nalgebra.nrows(),
                x_reduced_nalgebra.ncols(),
                x_term_nalgebra.nrows(),
                x_term_nalgebra.ncols(),
                n_obs
            )
        );
    }
    if y_nalgebra.len() != n_obs {
        return Err(
            format!(
                "Y vector length mismatch for Type II SS of term '{}'. Expected {}, got {}.",
                term_name,
                n_obs,
                y_nalgebra.len()
            )
        );
    }

    // M_reduced = I - X_reduced (X_reduced' X_reduced)^-1 X_reduced'
    let p_reduced = if x_reduced_nalgebra.ncols() == 0 || x_reduced_nalgebra.nrows() == 0 {
        // If X_reduced is empty (e.g. only intercept and it was absorbed, or no other terms)
        DMatrix::zeros(n_obs, n_obs)
    } else {
        let x_reduced_t = x_reduced_nalgebra.transpose();
        let x_reduced_t_x_reduced = &x_reduced_t * x_reduced_nalgebra;
        let x_reduced_t_x_reduced_inv = x_reduced_t_x_reduced
            .svd(true, true)
            .pseudo_inverse(1e-10) // Use pseudo-inverse for stability
            .map_err(|e|
                format!(
                    "(X_reduced'X_reduced) pseudo-inversion failed for Type II SS of term '{}': {}",
                    term_name,
                    e
                )
            )?;
        x_reduced_nalgebra * x_reduced_t_x_reduced_inv * &x_reduced_t
    };
    let identity_n = DMatrix::<f64>::identity(n_obs, n_obs);
    let m_reduced = identity_n - p_reduced;

    // SS = Y' M_reduced X_term (X_term' M_reduced X_term)^-1 X_term' M_reduced Y
    let m_reduced_x_term = &m_reduced * x_term_nalgebra;
    if m_reduced_x_term.ncols() == 0 {
        // If X_term is empty or becomes null after projection
        return Ok(0.0);
    }
    let m_reduced_x_term_t = m_reduced_x_term.transpose();

    let term_in_inverse = &m_reduced_x_term_t * &m_reduced_x_term;
    if term_in_inverse.iter().all(|&x| x.abs() < 1e-9) || term_in_inverse.ncols() == 0 {
        return Ok(0.0);
    }

    let term_in_inverse_inv = term_in_inverse
        .svd(true, true)
        .pseudo_inverse(1e-10) // Use pseudo-inverse for stability
        .map_err(|e|
            format!(
                "(X_term' M_reduced X_term) pseudo-inversion failed for Type II SS of term '{}': {}",
                term_name,
                e
            )
        )?;

    let l_beta_equivalent = &m_reduced_x_term_t * (&m_reduced * y_nalgebra);
    let ss_matrix = l_beta_equivalent.transpose() * term_in_inverse_inv * l_beta_equivalent;

    if ss_matrix.nrows() == 1 && ss_matrix.ncols() == 1 {
        Ok(ss_matrix[(0, 0)].max(0.0))
    } else {
        Err(
            format!("Type II SS calculation for term '{}' resulted in a non-scalar matrix", term_name)
        )
    }
}

/// REVISED Public API for Type II SS
pub fn calculate_type_ii_ss(
    design_info: &DesignMatrixInfo,
    config: &UnivariateConfig, // Still needed for model term definitions for Type II logic
    term_of_interest: &str
) -> Result<f64, String> {
    if design_info.n_samples == 0 {
        return Ok(0.0);
    }
    let y_nalgebra = &design_info.y;
    let n_obs = design_info.n_samples;

    // Extract X_term for term_of_interest
    let (term_start_col, term_end_col) = design_info.term_column_indices
        .get(term_of_interest)
        .ok_or_else(||
            format!("Term '{}' not found in design matrix for Type II SS.", term_of_interest)
        )?;
    let num_cols_for_term = term_end_col - term_start_col + 1;
    if num_cols_for_term == 0 {
        return Ok(0.0); // Term has no columns
    }
    let x_term_nalgebra = design_info.x.columns(*term_start_col, num_cols_for_term).into_owned();

    // Construct X_reduced based on Type II rules for term_of_interest
    // X_reduced contains intercept (if in model) + all other terms not containing term_of_interest or its factors.
    let mut x_reduced_cols_indices: Vec<(usize, usize)> = Vec::new();

    if let Some(intercept_idx) = design_info.intercept_column {
        x_reduced_cols_indices.push((intercept_idx, intercept_idx));
    }

    let factors_in_term_of_interest_set: std::collections::HashSet<_> = parse_interaction_term(
        term_of_interest
    )
        .into_iter()
        .collect();

    // Iterate over all terms defined in the model (via config or implicitly from design_info.term_column_indices keys)
    // Using design_info.term_column_indices.keys() is safer as it reflects actual matrix columns.
    for (other_term_name, &(other_start_col, other_end_col)) in &design_info.term_column_indices {
        if other_term_name == term_of_interest || other_term_name == "Intercept" {
            continue;
        }

        let other_term_factors_set: std::collections::HashSet<_> = parse_interaction_term(
            other_term_name
        )
            .into_iter()
            .collect();

        let include_this_other_term_in_x_reduced = if term_of_interest.contains('*') {
            // Term of interest is an INTERACTION (e.g., A*B)
            // X_reduced includes: main effects (A, B, C), other interactions not containing A*B (e.g. A*C, C*D), covariates.
            // Exclude: A*B itself, and higher-order interactions containing A*B (e.g. A*B*C).
            let is_higher_order_and_contains_current =
                factors_in_term_of_interest_set.is_subset(&other_term_factors_set) &&
                other_term_factors_set.len() > factors_in_term_of_interest_set.len();
            !is_higher_order_and_contains_current
        } else {
            // Term of interest is a MAIN EFFECT or COVARIATE (e.g., A)
            // X_reduced includes: other main effects (B, C), interactions of those other main effects (B*C), other covariates.
            // Exclude: A itself, and any interaction involving A (A*B, A*C).
            // Check if there's any overlap in factors.
            factors_in_term_of_interest_set.is_disjoint(&other_term_factors_set)
        };

        if include_this_other_term_in_x_reduced {
            x_reduced_cols_indices.push((other_start_col, other_end_col));
        }
    }

    // Assemble x_reduced_nalgebra from design_info.x using collected indices
    let mut x_reduced_final_cols: Vec<DMatrix<f64>> = Vec::new();
    // Sort indices to ensure original column order is preserved as much as possible
    x_reduced_cols_indices.sort_by_key(|k| k.0);
    x_reduced_cols_indices.dedup(); // Remove duplicates if intercept was also listed as a term

    for (start_idx, end_idx) in x_reduced_cols_indices {
        let num_cols = end_idx - start_idx + 1;
        x_reduced_final_cols.push(design_info.x.columns(start_idx, num_cols).into_owned());
    }

    let x_reduced_nalgebra = if x_reduced_final_cols.is_empty() {
        DMatrix::zeros(n_obs, 0) // Ensure it has n_obs rows even if 0 columns
    } else {
        nalgebra::Matrix::from_columns(
            &x_reduced_final_cols
                .iter()
                .flat_map(|m| m.column_iter())
                .collect::<Vec<_>>()
        )
    };
    if x_reduced_nalgebra.nrows() != n_obs && x_reduced_nalgebra.ncols() > 0 {
        // Check row consistency after assembly
        return Err(
            format!(
                "Constructed X_reduced for term '{}' has {} rows, expected {}.",
                term_of_interest,
                x_reduced_nalgebra.nrows(),
                n_obs
            )
        );
    }

    calculate_type_ii_ss_from_components(
        y_nalgebra,
        &x_reduced_nalgebra,
        &x_term_nalgebra,
        term_of_interest,
        n_obs
    )
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
    design_info: &DesignMatrixInfo,
    l_matrix: &DMatrix<f64>, // Contrast matrix for the hypothesis L * beta = 0
    term_of_interest: &str // For error messages and context
    // dep_var_name: &str, // y is now in design_info
    // grand_mean_for_fallback: f64, // Fallback logic might need re-evaluation
    // is_type_iv_calculation: bool // Type IV specifics handled in L matrix construction
) -> Result<f64, String> {
    let x = &design_info.x;
    let y = &design_info.y;
    let w_opt = &design_info.w;

    if x.nrows() != y.len() {
        return Err(
            format!(
                "Mismatch in dimensions for term '{}': X has {} rows, Y has {} rows.",
                term_of_interest,
                x.nrows(),
                y.len()
            )
        );
    }
    if l_matrix.ncols() != x.ncols() {
        return Err(
            format!(
                "Mismatch in dimensions for term '{}': L matrix has {} cols, X matrix has {} cols (p_parameters).",
                term_of_interest,
                l_matrix.ncols(),
                x.ncols()
            )
        );
    }
    if l_matrix.nrows() == 0 {
        // No hypothesis to test for this term (e.g. aliased term)
        return Ok(0.0);
    }

    let xtwx = match w_opt {
        Some(w) => {
            if w.len() != x.nrows() {
                return Err("WLS weight vector length mismatch with X matrix rows.".to_string());
            }
            let w_diag = DMatrix::from_diagonal(w);
            x.transpose() * &w_diag * x
        }
        None => x.transpose() * x,
    };

    let xty = match w_opt {
        Some(w) => {
            if w.len() != y.len() {
                return Err("WLS weight vector length mismatch with Y vector.".to_string());
            }
            let w_diag = DMatrix::from_diagonal(w);
            x.transpose() * &w_diag * y
        }
        None => x.transpose() * y,
    };

    let xtx_inv = xtwx
        .svd(true, true)
        .pseudo_inverse(1e-10)
        .map_err(|e|
            format!(
                "Singular or ill-conditioned X'WX matrix for term '{}', pseudo-inverse failed: {}. Cannot compute Type III/IV SS.",
                term_of_interest,
                e
            )
        )?;

    let beta_hat = &xtx_inv * xty;
    let l_beta_hat = l_matrix * beta_hat;
    let l_xtx_inv_lt = l_matrix * xtx_inv * l_matrix.transpose();

    // Check if L_xtx_inv_Lt is all zeros or near zero, which means the hypothesis is not testable or SS is 0.
    if l_xtx_inv_lt.iter().all(|&val| val.abs() < 1e-9) {
        // If L*beta_hat is also zero, then SS is 0. If L*beta_hat is non-zero, this indicates a non-estimable contrast with non-zero estimate,
        // which is problematic. SPSS might show SS as 0 and df as 0 for such cases.
        // For now, if the matrix for inversion is null, SS is 0.
        return Ok(0.0);
    }

    let l_xtx_inv_lt_inv = l_xtx_inv_lt
        .svd(true, true)
        .pseudo_inverse(1e-10)
        .map_err(|e|
            format!(
                "Singular (L(X'WX)^-1L') matrix for term '{}', pseudo-inverse failed: {}. Cannot compute Type III/IV SS. Check for estimability or redundant contrasts.",
                term_of_interest,
                e
            )
        )?;

    let ss_matrix = l_beta_hat.transpose() * l_xtx_inv_lt_inv * l_beta_hat;

    if ss_matrix.nrows() == 1 && ss_matrix.ncols() == 1 {
        Ok(ss_matrix[(0, 0)].max(0.0))
    } else {
        Err(
            format!(
                "Type III/IV SS calculation for term '{}' resulted in a non-scalar matrix ({}x{}).",
                term_of_interest,
                ss_matrix.nrows(),
                ss_matrix.ncols()
            )
        )
    }

    // Old logic based on building specific X matrices for the term is removed.
    // The L matrix now defines the hypothesis for the term against the full model X.
}

/// Public API for Type III SS
pub fn calculate_type_iii_ss(
    design_info: &DesignMatrixInfo,
    l_matrix_for_term: &DMatrix<f64>, // L matrix specific to the term of interest
    term_of_interest: &str
    // data: &AnalysisData, // No longer needed directly here
    // config: &UnivariateConfig, // No longer needed directly here
    // dep_var_name: &str, // No longer needed directly here
    // grand_mean_for_fallback: f64 // Fallback logic review needed
) -> Result<f64, String> {
    // Type IV specific logic (like checking missing cells to decide if Type IV L matrix needed)
    // would happen *before* calling this, during the L matrix construction phase.
    // This function now assumes the L matrix is appropriate for Type III.
    calculate_type_iii_iv_ss_for_term(
        design_info,
        l_matrix_for_term,
        term_of_interest
        // false // is_type_iv_calculation
    )
}

/// Public API for Type IV SS
pub fn calculate_type_iv_ss(
    design_info: &DesignMatrixInfo,
    l_matrix_for_term: &DMatrix<f64>, // L matrix specific to the term, constructed with Type IV rules
    term_of_interest: &str
    // data: &AnalysisData, // No longer needed
    // config: &UnivariateConfig, // No longer needed
    // dep_var_name: &str, // No longer needed
    // grand_mean_for_fallback: f64 // Fallback logic review needed
) -> Result<f64, String> {
    // This function assumes the L matrix is already constructed according to Type IV rules
    // (e.g., by zeroing out rows/cols corresponding to missing cells effects).
    calculate_type_iii_iv_ss_for_term(
        design_info,
        l_matrix_for_term,
        term_of_interest
        // true // is_type_iv_calculation
    )
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
