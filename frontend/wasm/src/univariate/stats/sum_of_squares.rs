use std::collections::HashMap;

use nalgebra::{ DMatrix, DVector };

use crate::univariate::models::{
    config::{ SumOfSquaresMethod, UnivariateConfig },
    data::{ AnalysisData, DataValue },
};
// use crate::univariate::stats::common::generate_interaction_terms; // No longer needed from common

use super::core::*;
use super::matrix_utils::{ create_l_matrix, to_dmatrix, to_dvector };

use crate::univariate::stats::common; // For get_all_dependent_values, get_factor_levels, get_covariate_values, check_for_missing_cells etc.
// use crate::univariate::models::config::UnivariateConfig; // Already imported
// use super::factor_utils::generate_level_combinations; // Already imported via factor_utils below
// use super::design_matrix::{ // These will be removed/moved
//     create_main_effect_design_matrix,
//     create_interaction_design_matrix,
//     create_contrast_coded_main_effect_matrix,
//     create_contrast_coded_interaction_matrix,
//     create_type_iv_main_effect_matrix,
//     create_type_iv_interaction_matrix,
// };
// use super::design_matrix; // This will be removed
use super::factor_utils; // Will provide design matrix functions and term generation

/// Calculate sum of squares for a factor based on the method
/*
pub fn calculate_factor_ss(
    data: &AnalysisData,
    config: &UnivariateConfig,
    factor: &str,
    dep_var_name: &str,
    grand_mean: f64,
    ss_method: SumOfSquaresMethod,
    residual_values: Option<&[f64]>,
    _residual_mean: Option<f64> 
) -> Result<f64, String> {
    match ss_method {
        SumOfSquaresMethod::TypeI =>
            calculate_type_i_ss(
                data,
                config,
                factor,
                residual_values.ok_or_else(|| "Residual values required for Type I SS".to_string())?                
            ),
        SumOfSquaresMethod::TypeII => {
            calculate_type_ii_ss(data, config, factor, dep_var_name)
        }
        SumOfSquaresMethod::TypeIII => {
            calculate_type_iii_ss(data, config, factor, dep_var_name, grand_mean)
        }
        SumOfSquaresMethod::TypeIV => {
            let has_missing_cells = check_for_missing_cells(data, factor)?;
            if has_missing_cells {
                calculate_type_iv_ss(data, config, factor, dep_var_name, grand_mean)
            } else {
                calculate_type_iii_ss(data, config, factor, dep_var_name, grand_mean)
            }
        }
    }
}
*/
// FUNCTION calculate_factor_ss REMOVED - Replaced by direct calls to calculate_type_i_ss etc.

// Helper for Type I SS calculation given term matrix and residuals
fn calculate_type_i_ss_for_term_matrix(
    x_term_nalgebra: &DMatrix<f64>,
    residuals_nalgebra: &DVector<f64>,
    term_name: &str // For error messages
) -> Result<f64, String> {
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

    let xtx_inv = xtx
        .try_inverse()
        .ok_or_else(|| { format!("X'X inversion failed for term '{}' in Type I SS.", term_name) })?;

    let b_hat = &xtx_inv * (&xt * residuals_nalgebra);
    let ss_term = b_hat.dot(&(&xt * residuals_nalgebra));

    Ok(ss_term.max(0.0))
}

/// New Public API for Type I SS
pub fn calculate_type_i_ss(
    data: &AnalysisData,
    _config: &UnivariateConfig, // config might not be needed if residuals are directly provided
    term_of_interest: &str,
    residuals: &[f64]
) -> Result<f64, String> {
    if residuals.is_empty() {
        return Ok(0.0);
    }

    let x_term_vecs = if term_of_interest.contains('*') {
        factor_utils::create_interaction_design_matrix(data, term_of_interest)?
    } else {
        factor_utils::create_main_effect_design_matrix(data, term_of_interest)?
    };

    if x_term_vecs.is_empty() || x_term_vecs.get(0).map_or(true, |row| row.is_empty()) {
        return Ok(0.0); // Term results in no design columns
    }
    let x_term_nalgebra = to_dmatrix(&x_term_vecs)?;
    let residuals_nalgebra = to_dvector(residuals);

    calculate_type_i_ss_for_term_matrix(&x_term_nalgebra, &residuals_nalgebra, term_of_interest)
}

/// Helper for Type II SS calculation given Y, X_reduced, and X_term
fn calculate_type_ii_ss_from_components(
    y_nalgebra: &DVector<f64>,
    x_reduced_nalgebra: &DMatrix<f64>,
    x_term_nalgebra: &DMatrix<f64>,
    term_name: &str, // For error messages
    n_obs: usize
) -> Result<f64, String> {
    if x_term_nalgebra.nrows() != n_obs || x_reduced_nalgebra.nrows() != n_obs {
        return Err(
            format!(
                "Matrix row mismatch for Type II SS of term '{}': Y({}), X_reduced({}), X_term({}). Expected {}.
            ",
                term_name,
                y_nalgebra.len(),
                x_reduced_nalgebra.nrows(),
                x_term_nalgebra.nrows(),
                n_obs
            )
        );
    }

    let x_reduced_t = x_reduced_nalgebra.transpose();
    let x_reduced_t_x_reduced = &x_reduced_t * x_reduced_nalgebra;

    let p_reduced = if x_reduced_nalgebra.ncols() == 0 {
        DMatrix::zeros(n_obs, n_obs)
    } else {
        let x_reduced_t_x_reduced_inv = x_reduced_t_x_reduced
            .try_inverse()
            .ok_or_else(||
                format!("(X_reduced'X_reduced) inversion failed for Type II SS of term '{}'", term_name)
            )?;
        x_reduced_nalgebra * x_reduced_t_x_reduced_inv * &x_reduced_t
    };
    let identity_n = DMatrix::<f64>::identity(n_obs, n_obs);
    let m_reduced = identity_n - p_reduced;

    let m_reduced_x_term = &m_reduced * x_term_nalgebra;
    let m_reduced_x_term_t = m_reduced_x_term.transpose();

    let term_in_inverse = &m_reduced_x_term_t * &m_reduced_x_term;
    if term_in_inverse.iter().all(|&x| x.abs() < 1e-9) || term_in_inverse.ncols() == 0 {
        // Check if matrix is effectively zero or empty
        return Ok(0.0); // If X_term projected onto orthogonal space of X_reduced is null, SS is 0
    }

    let term_in_inverse_inv = term_in_inverse
        .try_inverse()
        .ok_or_else(|| {
            format!("(X_term' M_reduced X_term) inversion failed for Type II SS of term '{}'", term_name)
        })?;

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

/// New Public API for Type II SS
pub fn calculate_type_ii_ss(
    data: &AnalysisData,
    config: &UnivariateConfig,
    term_of_interest: &str,
    dep_var_name: &str
) -> Result<f64, String> {
    let y_vec = common::get_all_dependent_values(data, dep_var_name)?;
    if y_vec.is_empty() {
        return Ok(0.0);
    }
    let y_nalgebra = to_dvector(&y_vec);
    let n_obs = y_nalgebra.len();

    let all_model_terms = factor_utils::generate_model_design_terms(data, config)?;

    let x_term_vecs = if term_of_interest.contains('*') {
        factor_utils::create_interaction_design_matrix(data, term_of_interest)?
    } else {
        factor_utils::create_main_effect_design_matrix(data, term_of_interest)?
    };

    if x_term_vecs.is_empty() || x_term_vecs.get(0).map_or(true, |row| row.is_empty()) {
        return Ok(0.0); // Term has no columns
    }
    let x_term_nalgebra = to_dmatrix(&x_term_vecs)?;

    // Construct X_reduced based on Type II rules for term_of_interest
    let mut x_reduced_cols: Vec<DVector<f64>> = vec![DVector::from_element(n_obs, 1.0)]; // Intercept

    let factors_in_term_of_interest = factor_utils::parse_interaction_term(term_of_interest);

    for other_term_name in &all_model_terms {
        if other_term_name == term_of_interest || other_term_name == "Intercept" {
            continue;
        }

        let include_this_other_term_in_x_reduced = if term_of_interest.contains('*') {
            // Term of interest is an INTERACTION (e.g., A*B)
            // X_reduced includes: main effects (A, B, C), other interactions not containing A*B (e.g. A*C, C*D), covariates.
            // Exclude: A*B itself, and higher-order interactions containing A*B (e.g. A*B*C).
            let other_term_factors = factor_utils::parse_interaction_term(other_term_name);
            if other_term_name.contains('*') {
                // other_term is an interaction
                // Exclude if other_term is a higher-order interaction containing term_of_interest
                let is_higher_order_and_contains_current =
                    factors_in_term_of_interest.iter().all(|f| other_term_factors.contains(f)) &&
                    other_term_factors.len() > factors_in_term_of_interest.len();
                !is_higher_order_and_contains_current
            } else {
                // other_term is a main effect or covariate
                true
            }
        } else {
            // Term of interest is a MAIN EFFECT (e.g., A)
            // X_reduced includes: other main effects (B, C), interactions of those other main effects (B*C), covariates.
            // Exclude: A itself, and any interaction involving A (A*B, A*C).
            if other_term_name.contains('*') {
                // other_term is an interaction
                !factor_utils
                    ::parse_interaction_term(other_term_name)
                    .contains(&term_of_interest.to_string())
            } else {
                // other_term is another main effect or covariate
                true
            }
        };

        if include_this_other_term_in_x_reduced {
            let design_vecs_for_other_term = if other_term_name.contains('*') {
                factor_utils::create_interaction_design_matrix(data, other_term_name)?
            } else if
                config.main.covar.as_ref().map_or(false, |covs| covs.contains(other_term_name))
            {
                let vals = common::get_covariate_values(data, other_term_name)?;
                let mut cov_matrix_rows = Vec::with_capacity(n_obs);
                if vals.len() != n_obs && n_obs > 0 {
                    return Err(
                        format!("Covariate '{}' length mismatch for Type II X_reduced", other_term_name)
                    );
                }
                for i in 0..n_obs {
                    cov_matrix_rows.push(vec![vals.get(i).copied().unwrap_or(0.0)]);
                }
                cov_matrix_rows
            } else {
                factor_utils::create_main_effect_design_matrix(data, other_term_name)?
            };

            if
                !design_vecs_for_other_term.is_empty() &&
                !design_vecs_for_other_term.get(0).map_or(true, |r| r.is_empty())
            {
                let dmatrix_for_other_term = to_dmatrix(&design_vecs_for_other_term)?;
                if dmatrix_for_other_term.nrows() != n_obs && n_obs > 0 {
                    return Err(
                        format!(
                            "X_reduced term '{}' (Type II) has {} rows, expected {}",
                            other_term_name,
                            dmatrix_for_other_term.nrows(),
                            n_obs
                        )
                    );
                }
                for c_idx in 0..dmatrix_for_other_term.ncols() {
                    x_reduced_cols.push(dmatrix_for_other_term.column(c_idx).into_owned());
                }
            }
        }
    }
    let x_reduced_nalgebra = DMatrix::from_columns(&x_reduced_cols);

    calculate_type_ii_ss_from_components(
        &y_nalgebra,
        &x_reduced_nalgebra,
        &x_term_nalgebra,
        term_of_interest,
        n_obs
    )
}

/// Helper for Type III/IV SS: constructs full design matrix using contrast coding for specified terms
fn build_full_contrast_coded_design_matrix_internal(
    data: &AnalysisData,
    config: &UnivariateConfig,
    all_values_len: usize,
    term_names: &[String], // All terms in the model (factors, interactions, covariates)
    factor_of_interest: Option<&str>, // For Type III, the factor of interest gets contrast coded
    is_type_iv: bool
) -> Result<(DMatrix<f64>, HashMap<String, (usize, usize)>), String> {
    let mut x_cols: Vec<DVector<f64>> = vec![DVector::from_element(all_values_len, 1.0)]; // Intercept
    let mut term_col_ranges: HashMap<String, (usize, usize)> = HashMap::new();
    let mut current_col_idx = 1; // Start after intercept

    for term_name in term_names {
        let term_matrix_vec = if term_name.contains('*') {
            if is_type_iv && self::check_for_missing_cells_in_interaction(data, term_name)? {
                factor_utils::create_type_iv_interaction_matrix(data, term_name)?
            } else {
                factor_utils::create_contrast_coded_interaction_matrix(data, term_name)?
            }
        } else if config.main.covar.as_ref().map_or(false, |covs| covs.contains(term_name)) {
            // Covariate
            let cov_values = common::get_covariate_values(data, term_name)?;
            vec![cov_values] // Represent as a single column matrix (vec of vec)
        } else {
            // Main effect
            if
                is_type_iv &&
                factor_of_interest == Some(term_name.as_str()) &&
                common::check_for_missing_cells(data, term_name)?
            {
                factor_utils::create_type_iv_main_effect_matrix(data, term_name)?
            } else {
                factor_utils::create_contrast_coded_main_effect_matrix(data, term_name)?
            }
        };

        if term_matrix_vec.is_empty() || term_matrix_vec[0].is_empty() {
            continue;
        }
        let term_nalgebra_matrix = to_dmatrix(&term_matrix_vec)?;

        let term_start_col = current_col_idx;
        for i in 0..term_nalgebra_matrix.ncols() {
            x_cols.push(term_nalgebra_matrix.column(i).into_owned());
            current_col_idx += 1;
        }
        if term_nalgebra_matrix.ncols() > 0 {
            // Only insert if columns were actually added
            term_col_ranges.insert(term_name.clone(), (term_start_col, current_col_idx - 1));
        }
    }

    if x_cols.len() == 1 && x_cols[0].len() != all_values_len && all_values_len > 0 {
        return Err(
            "Cannot build design matrix for empty data or mismatched intercept length.".into()
        );
    } else if x_cols.len() == 1 && all_values_len == 0 {
        // Special case for no data at all
        return Ok((DMatrix::from_columns(&x_cols), term_col_ranges)); // Return intercept column of 0 rows
    }

    let x_full_nalgebra = DMatrix::from_columns(&x_cols);
    Ok((x_full_nalgebra, term_col_ranges))
}

fn check_for_missing_cells_in_interaction(
    data: &AnalysisData,
    interaction_term: &str
) -> Result<bool, String> {
    let factors_in_interaction = factor_utils::parse_interaction_term(interaction_term);
    for f_name in factors_in_interaction {
        if common::check_for_missing_cells(data, &f_name)? {
            return Ok(true);
        }
    }
    Ok(false)
}

/// New generic function for Type III/IV SS for a single term (factor or interaction)
fn calculate_type_iii_iv_ss_for_term(
    data: &AnalysisData,
    config: &UnivariateConfig,
    term_of_interest: &str,
    dep_var_name: &str,
    grand_mean_for_fallback: f64,
    is_type_iv_calculation: bool // True if this is a Type IV SS calculation overall
) -> Result<f64, String> {
    let y_vec = common::get_all_dependent_values(data, dep_var_name)?;
    if y_vec.is_empty() {
        return Ok(0.0);
    }
    let y_nalgebra = to_dvector(&y_vec);

    let all_model_terms = factor_utils::generate_model_design_terms(data, config)?;

    // Determine if the specific term_of_interest needs Type IV coding rules for its part of the design matrix
    let apply_type_iv_coding_for_this_term = if is_type_iv_calculation {
        if term_of_interest.contains('*') {
            check_for_missing_cells_in_interaction(data, term_of_interest)?
        } else {
            // For main effects (or covariates, though they usually don't trigger this path for SS directly)
            common::check_for_missing_cells(data, term_of_interest)?
        }
    } else {
        false // Not a Type IV calculation, so no Type IV specific coding needed
    };

    let (x_full_nalgebra, term_col_ranges) = build_full_contrast_coded_design_matrix_internal(
        data,
        config,
        y_nalgebra.len(),
        &all_model_terms,
        Some(term_of_interest), // The term for which specific Type IV coding might apply
        apply_type_iv_coding_for_this_term
    )?;

    let (l_start, l_end) = term_col_ranges
        .get(term_of_interest)
        .ok_or_else(|| {
            format!("Term '{}' not found in Type III/IV model columns map", term_of_interest)
        })?;

    let num_hypotheses = l_end - l_start + 1;
    if num_hypotheses == 0 {
        // This can happen if a factor has only one level or an interaction term effectively has no estimable contrasts.
        return Ok(0.0);
    }
    let mut l_nalgebra = DMatrix::<f64>::zeros(num_hypotheses, x_full_nalgebra.ncols());
    for i in 0..num_hypotheses {
        l_nalgebra[(i, l_start + i)] = 1.0;
    }

    match perform_hypothesis_test_nalgebra(&x_full_nalgebra, &y_nalgebra, &l_nalgebra) {
        Ok(ss) => Ok(ss.max(0.0)), // Ensure SS is not negative
        Err(err) => {
            eprintln!(
                "Nalgebra Type III/IV SS for term '{}' failed: {}. Falling back to raw calculation.",
                term_of_interest,
                err
            );
            // Fallback logic depends on whether it's an interaction or factor
            if term_of_interest.contains('*') {
                calculate_raw_ss_for_term_or_interaction(
                    data,
                    term_of_interest,
                    dep_var_name,
                    grand_mean_for_fallback
                )
            } else {
                calculate_raw_ss_for_term_or_interaction(
                    data,
                    term_of_interest,
                    dep_var_name,
                    grand_mean_for_fallback
                )
            }
        }
    }
}

/// New Public API for Type III SS
pub fn calculate_type_iii_ss(
    data: &AnalysisData,
    config: &UnivariateConfig,
    term_of_interest: &str,
    dep_var_name: &str,
    grand_mean_for_fallback: f64
) -> Result<f64, String> {
    calculate_type_iii_iv_ss_for_term(
        data,
        config,
        term_of_interest,
        dep_var_name,
        grand_mean_for_fallback,
        false // is_type_iv_calculation = false
    )
}

/// New Public API for Type IV SS
pub fn calculate_type_iv_ss(
    data: &AnalysisData,
    config: &UnivariateConfig,
    term_of_interest: &str,
    dep_var_name: &str,
    grand_mean_for_fallback: f64
) -> Result<f64, String> {
    calculate_type_iii_iv_ss_for_term(
        data,
        config,
        term_of_interest,
        dep_var_name,
        grand_mean_for_fallback,
        true // is_type_iv_calculation = true
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
    let term_factors = factor_utils::parse_interaction_term(term_or_interaction);

    let mut factor_levels_for_combo_gen = Vec::new();
    for factor_name in &term_factors {
        let levels = common::get_factor_levels(data, factor_name)?;
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
        factor_utils::generate_level_combinations(
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
                            if common::data_value_to_string(data_val) != *level_in_combo {
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
                    if let Some(value) = common::extract_dependent_value(record, dep_var_name) {
                        values_for_combo.push(value);
                    }
                }
            }
        }
        if !values_for_combo.is_empty() {
            let combo_mean = common::calculate_mean(&values_for_combo);
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
