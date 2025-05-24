/// This module implements the design matrix creation and statistical computations for linear models.
///
/// # Statistical Background
///
/// The statistical analysis is based on the Gauss-Jordan method of matrix inversion, which is
/// implemented through the sweep operation. Key matrices in this process include:
///
/// - X: Design matrix containing the predictor variables
/// - Y: Response vector containing the dependent variable
/// - W: Optional weight matrix (diagonal) for weighted least squares
/// - Z: Combined matrix [X Y]
/// - Z'WZ: Cross-product matrix that forms the basis of the sweep operation
///
/// After sweeping the first p rows and columns of Z'WZ, we obtain:
///
/// ```text
/// [  -G    B̂  ]
/// [  B̂'    S  ]
/// ```
///
/// where:
/// - G is the p×p symmetric g₂ general inverse of X'WX
/// - B̂ is the p×r matrix of parameter estimates
/// - S is the symmetric r×r matrix of residual sums of squares and cross-products
///
/// This implementation is based on Algorithm AS 178 by M.R.B. Clarke (1982) and includes
/// detection of collinearity among the predictor variables.
use nalgebra::{ DMatrix, DVector };
use std::collections::HashMap;
use crate::univariate::models::{ config::UnivariateConfig, data::AnalysisData };

use super::core::*;

pub struct DesignMatrixInfo {
    pub x: DMatrix<f64>,
    pub y: DVector<f64>,
    pub w: Option<DVector<f64>>,
    pub n_samples: usize,
    pub p_parameters: usize,
    pub r_x_rank: usize,
    pub term_column_indices: HashMap<String, (usize, usize)>,
    pub intercept_column: Option<usize>,
    pub term_names: Vec<String>,
    pub case_indices_to_keep: Vec<usize>,
}

#[derive(Debug)]
pub struct SweptMatrixInfo {
    /// G: p×p symmetric g₂ general inverse of X'WX (after negation of swept result)
    pub g_inv: DMatrix<f64>,
    /// B̂: p×r matrix of parameter estimates
    pub beta_hat: DVector<f64>,
    /// S: symmetric r×r matrix of residual sums of squares and cross-products
    pub s_rss: f64,
}

pub fn create_design_response_weights(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<DesignMatrixInfo, String> {
    let dep_var_name = config.main.dep_var
        .as_ref()
        .ok_or_else(|| "Dependent variable not specified.".to_string())?;

    let mut y_values: Vec<f64> = Vec::new();
    let mut wls_weights: Option<Vec<f64>> = if config.main.wls_weight.is_some() {
        Some(Vec::new())
    } else {
        None
    };
    let mut case_indices_to_keep: Vec<usize> = Vec::new();

    if data.dependent_data.is_empty() || data.dependent_data[0].is_empty() {
        return Ok(DesignMatrixInfo {
            x: DMatrix::zeros(0, 0),
            y: DVector::zeros(0),
            w: None,
            n_samples: 0,
            p_parameters: 0,
            r_x_rank: 0,
            term_column_indices: HashMap::new(),
            intercept_column: None,
            term_names: Vec::new(),
            case_indices_to_keep: Vec::new(),
        });
    }

    for (i, record) in data.dependent_data[0].iter().enumerate() {
        if let Some(dep_val_enum) = record.values.get(dep_var_name) {
            if let Some(dep_val) = extract_numeric_value(dep_val_enum) {
                if let Some(wls_var_name) = &config.main.wls_weight {
                    if let Some(wls_val_enum) = record.values.get(wls_var_name) {
                        if let Some(wls_val) = extract_numeric_value(wls_val_enum) {
                            if wls_val > 0.0 {
                                y_values.push(dep_val);
                                wls_weights.as_mut().unwrap().push(wls_val);
                                case_indices_to_keep.push(i);
                            }
                        } else {
                            return Err(format!("Non-numeric WLS weight for case {}", i));
                        }
                    } else {
                        return Err(
                            format!(
                                "WLS weight variable '{}' not found for case {}",
                                wls_var_name,
                                i
                            )
                        );
                    }
                } else {
                    y_values.push(dep_val);
                    case_indices_to_keep.push(i);
                }
            } else {
                return Err(format!("Non-numeric dependent variable value for case {}", i));
            }
        } else {
            return Err(format!("Dependent variable '{}' not found for case {}", dep_var_name, i));
        }
    }

    let n_samples_effective = y_values.len();
    if n_samples_effective == 0 {
        return Ok(DesignMatrixInfo {
            x: DMatrix::zeros(0, 0),
            y: DVector::zeros(0),
            w: None,
            n_samples: 0,
            p_parameters: 0,
            r_x_rank: 0,
            term_column_indices: HashMap::new(),
            intercept_column: None,
            term_names: Vec::new(),
            case_indices_to_keep: Vec::new(),
        });
    }

    let y_nalgebra = DVector::from_vec(y_values);
    let w_nalgebra_opt = wls_weights.map(DVector::from_vec);

    let model_terms = generate_model_design_terms(data, config)?;
    let mut x_matrix_cols: Vec<DVector<f64>> = Vec::new();
    let mut term_column_map: HashMap<String, (usize, usize)> = HashMap::new();
    let mut current_col_idx = 0;
    let mut intercept_col_idx: Option<usize> = None;
    let mut final_term_names: Vec<String> = Vec::new();

    // Use factor_utils for matrix generation
    use crate::univariate::stats::factor_utils;

    for term_name in &model_terms {
        final_term_names.push(term_name.clone());
        let term_start_col = current_col_idx;
        let mut term_matrix_cols: Vec<DVector<f64>> = Vec::new();

        if term_name == "Intercept" {
            if config.model.intercept {
                let intercept_vec = DVector::from_element(n_samples_effective, 1.0);
                term_matrix_cols.push(intercept_vec);
                // intercept_col_idx will be set based on the actual column index later if intercept is added
            } else {
                continue;
            }
        } else if config.main.covar.as_ref().map_or(false, |c| c.contains(term_name)) {
            let mut cov_values_filtered: Vec<f64> = Vec::with_capacity(case_indices_to_keep.len());
            if let Some(cov_data_set_option) = &data.covariate_data {
                if let Some(cov_data_set) = cov_data_set_option.get(0) {
                    for &idx_to_keep in &case_indices_to_keep {
                        if let Some(record) = cov_data_set.get(idx_to_keep) {
                            if let Some(val_enum) = record.values.get(term_name) {
                                cov_values_filtered.push(
                                    extract_numeric_value(val_enum).ok_or_else(||
                                        format!("Non-numeric covariate '{}'", term_name)
                                    )?
                                );
                            } else {
                                return Err(
                                    format!(
                                        "Covariate '{}' not found in record {} for original case {}",
                                        term_name,
                                        idx_to_keep,
                                        idx_to_keep
                                    )
                                );
                            }
                        } else {
                            return Err(
                                format!("Record index {} out of bounds for covariate data (original case index)", idx_to_keep)
                            );
                        }
                    }
                } else {
                    return Err(format!("No data found for covariate '{}'", term_name));
                }
            } else {
                return Err(
                    format!("Covariate data structure (covariate_data) is None, but covariate '{}' was specified.", term_name)
                );
            }
            if !cov_values_filtered.is_empty() {
                term_matrix_cols.push(DVector::from_vec(cov_values_filtered));
            }
        } else if term_name.contains('*') {
            // Interaction term
            let interaction_rows_unfiltered = factor_utils::create_interaction_design_matrix(
                data,
                config,
                term_name
            )?;
            if
                !interaction_rows_unfiltered.is_empty() &&
                !interaction_rows_unfiltered[0].is_empty()
            {
                for j_col in 0..interaction_rows_unfiltered[0].len() {
                    let mut column_data_filtered: Vec<f64> = Vec::with_capacity(
                        case_indices_to_keep.len()
                    );
                    for &idx_to_keep in &case_indices_to_keep {
                        if idx_to_keep < interaction_rows_unfiltered.len() {
                            column_data_filtered.push(
                                interaction_rows_unfiltered[idx_to_keep][j_col]
                            );
                        } else {
                            return Err(
                                format!(
                                    "Original case index {} out of bounds for unfiltered interaction term rows (len {}) for term '{}'",
                                    idx_to_keep,
                                    interaction_rows_unfiltered.len(),
                                    term_name
                                )
                            );
                        }
                    }
                    if !column_data_filtered.is_empty() {
                        term_matrix_cols.push(DVector::from_vec(column_data_filtered));
                    }
                }
            }
        } else {
            // Main effect (factor)
            let main_effect_rows_unfiltered = factor_utils::create_main_effect_design_matrix(
                data,
                term_name
            )?;
            if
                !main_effect_rows_unfiltered.is_empty() &&
                !main_effect_rows_unfiltered[0].is_empty()
            {
                for j_col in 0..main_effect_rows_unfiltered[0].len() {
                    let mut column_data_filtered: Vec<f64> = Vec::with_capacity(
                        case_indices_to_keep.len()
                    );
                    for &idx_to_keep in &case_indices_to_keep {
                        if idx_to_keep < main_effect_rows_unfiltered.len() {
                            column_data_filtered.push(
                                main_effect_rows_unfiltered[idx_to_keep][j_col]
                            );
                        } else {
                            return Err(
                                format!(
                                    "Original case index {} out of bounds for unfiltered main effect rows (len {}) for term '{}'",
                                    idx_to_keep,
                                    main_effect_rows_unfiltered.len(),
                                    term_name
                                )
                            );
                        }
                    }
                    if !column_data_filtered.is_empty() {
                        term_matrix_cols.push(DVector::from_vec(column_data_filtered));
                    }
                }
            }
        }

        if !term_matrix_cols.is_empty() {
            for col_vec in term_matrix_cols {
                if col_vec.len() == n_samples_effective {
                    x_matrix_cols.push(col_vec);
                    current_col_idx += 1;
                } else if col_vec.len() == 0 {
                    // This column was empty (e.g. factor level with no data, or aliased out entirely before full matrix built)
                    // Do not add it, do not increment current_col_idx
                } else {
                    return Err(
                        format!(
                            "Column for term '{}' has incorrect length {} (expected {}).",
                            term_name,
                            col_vec.len(),
                            n_samples_effective
                        )
                    );
                }
            }
            if current_col_idx > term_start_col {
                // Only add to map if columns were actually added
                term_column_map.insert(term_name.clone(), (term_start_col, current_col_idx - 1));
            }
        }
    }

    let x_nalgebra = if !x_matrix_cols.is_empty() {
        DMatrix::from_columns(&x_matrix_cols)
    } else {
        DMatrix::zeros(n_samples_effective, 0)
    };

    let p_parameters = x_nalgebra.ncols();
    let r_x_rank = if p_parameters > 0 { x_nalgebra.rank(1e-10) } else { 0 };

    // Update intercept_col_idx if intercept was added and is the first term
    if
        config.model.intercept &&
        x_nalgebra.ncols() > 0 &&
        model_terms.get(0) == Some(&"Intercept".to_string())
    {
        if let Some((start, end)) = term_column_map.get("Intercept") {
            if *start == 0 && *end == 0 {
                // Ensure it's a single column at the start
                intercept_col_idx = Some(0);
            }
        }
    }

    Ok(DesignMatrixInfo {
        x: x_nalgebra,
        y: y_nalgebra,
        w: w_nalgebra_opt,
        n_samples: n_samples_effective,
        p_parameters,
        r_x_rank,
        term_column_indices: term_column_map,
        intercept_column: intercept_col_idx,
        term_names: final_term_names,
        case_indices_to_keep,
    })
}

/// Creates the cross-product matrix Z'WZ where Z = [X Y].
///
/// This function constructs the matrix Z'WZ that is central to the Gauss-Jordan sweep operation.
/// Z is formed by concatenating the design matrix X and the response vector Y:
/// Z = [X Y]
///
/// The resulting Z'WZ matrix has the structure:
/// ```text
/// [  X'WX    X'WY  ]
/// [  Y'WX    Y'WY  ]
/// ```
///
/// When Z'WZ is swept on its first p rows and columns (where p is the number of parameters),
/// it produces the matrices G, B̂, and S as described in the perform_sweep_and_extract_results function.
///
/// # Parameters
///
/// * `design_info` - Contains the design matrix X, response vector Y, and optional weights W
///
/// # Returns
///
/// The Z'WZ matrix which will be used as input to the sweep operation
pub fn create_cross_product_matrix(design_info: &DesignMatrixInfo) -> Result<DMatrix<f64>, String> {
    let x = &design_info.x;
    let y = &design_info.y;
    let n = design_info.n_samples;
    let p = design_info.p_parameters;

    if n == 0 {
        return Ok(DMatrix::zeros(p + 1, p + 1));
    }

    let mut z_parts: Vec<DMatrix<f64>> = Vec::new();
    z_parts.push(x.clone_owned());
    let y_matrix = DMatrix::from_column_slice(y.nrows(), 1, y.as_slice());
    z_parts.push(y_matrix);

    let z_columns: Vec<_> = z_parts
        .iter()
        .flat_map(|m| m.column_iter())
        .collect();
    let z = DMatrix::from_columns(&z_columns);

    if let Some(w_vec) = &design_info.w {
        if w_vec.len() != n {
            return Err("Weight vector length mismatch for Z'WZ.".to_string());
        }
        let w_diag = DMatrix::from_diagonal(w_vec);
        let ztwz = z.transpose() * w_diag * z;
        Ok(ztwz)
    } else {
        let ztz = z.transpose() * z;
        Ok(ztz)
    }
}

/// Performs the sweep operation on a Z'WZ matrix and extracts the results.
///
/// # The Sweep Operation
///
/// The Sweep operation transforms the Z'WZ matrix (where Z = [X Y]) into a form that
/// directly provides parameter estimates, the g₂ inverse, and residual sums of squares.
///
/// After sweeping the first p rows and columns of Z'WZ, the resulting matrix has the form:
/// ```text
/// [  -G    B̂  ]
/// [  B̂'    S  ]
/// ```
/// where:
/// - G is a p×p symmetric g₂ general inverse of X'WX
/// - B̂ is a p×r matrix of parameter estimates
/// - S is a symmetric r×r matrix of residual sums of squares and cross-products
///
/// # Algorithm
///
/// This implementation is based on Algorithm AS 178: "The Gauss-Jordan Sweep Operator
/// with Detection of Collinearity" by M.R.B. Clarke (1982) published in the Journal of
/// the Royal Statistical Society. Series C (Applied Statistics).
///
/// For each row/column k being swept:
/// 1. If the pivot element c[k,k] is near zero, the parameter is likely collinear
/// 2. Otherwise, perform the standard sweep operation:
///    - c[k,k] = -1/c[k,k]
///    - For other elements in row k: c[k,j] = c[k,j]/d
///    - For other elements in column k: c[i,k] = c[i,k]/d
///    - For all other elements: c[i,j] = c[i,j] + c[i,k] * c[k,j] * d
///
/// # Parameters
///
/// * `ztwz_matrix` - The Z'WZ matrix where Z = [X Y]
/// * `p_params_in_model` - The number of parameters p in the model (columns of X)
///
/// # Returns
///
/// A `SweptMatrixInfo` containing:
/// - g_inv: The G matrix (negated from the direct sweep result)
/// - beta_hat: The B̂ matrix of parameter estimates
/// - s_rss: The S matrix (in this implementation, just the first element of S which is the residual sum of squares)
///
/// # References
///
/// - Clarke, M.R.B. (1982) "Algorithm AS 178: The Gauss-Jordan Sweep Operator with Detection of Collinearity"
/// - Ridout, M.S. and Cobby, J.M. (1989) "Remark AS R78: A Remark on Algorithm AS 178"
pub fn perform_sweep_and_extract_results(
    ztwz_matrix: &DMatrix<f64>,
    p_params_in_model: usize
) -> Result<SweptMatrixInfo, String> {
    if p_params_in_model == 0 {
        let s_rss = if ztwz_matrix.nrows() == 1 && ztwz_matrix.ncols() == 1 {
            ztwz_matrix[(0, 0)]
        } else if ztwz_matrix.nrows() > 0 && ztwz_matrix.ncols() > 0 {
            ztwz_matrix[(0, 0)]
        } else {
            0.0
        };
        return Ok(SweptMatrixInfo {
            g_inv: DMatrix::zeros(0, 0),
            beta_hat: DVector::zeros(0),
            s_rss,
        });
    }

    let total_dims = ztwz_matrix.nrows();
    if total_dims != p_params_in_model + 1 {
        return Err(
            format!(
                "Z'WZ matrix dimensions ({}x{}) inconsistent with p_params_in_model ({}). Expected {}x{}.",
                ztwz_matrix.nrows(),
                ztwz_matrix.ncols(),
                p_params_in_model,
                p_params_in_model + 1,
                p_params_in_model + 1
            )
        );
    }
    if ztwz_matrix.ncols() != total_dims {
        return Err(
            format!("Z'WZ matrix is not square ({}x{}).", ztwz_matrix.nrows(), ztwz_matrix.ncols())
        );
    }

    let mut c_matrix = ztwz_matrix.clone_owned();
    let mut swept_k_flags: Vec<bool> = vec![false; p_params_in_model];
    let mut original_diagonals: Vec<f64> = Vec::with_capacity(p_params_in_model);
    for k in 0..p_params_in_model {
        original_diagonals.push(c_matrix[(k, k)]);
    }
    let mut is_param_aliased: Vec<bool> = vec![false; p_params_in_model];
    let epsilon = 1e-12;

    for k in 0..p_params_in_model {
        let pivot_candidate = c_matrix[(k, k)];
        let s_k = original_diagonals[k];

        if pivot_candidate.abs() <= epsilon * s_k.abs() {
            is_param_aliased[k] = true;
            continue;
        }

        let is_inconsistent =
            (swept_k_flags[k] && pivot_candidate > epsilon) ||
            (!swept_k_flags[k] && pivot_candidate < -epsilon);
        if is_inconsistent {
            is_param_aliased[k] = true;
            continue;
        }

        let pivot_val = c_matrix[(k, k)];

        let mut old_col_k_vals = DVector::zeros(total_dims);
        let mut old_row_k_vals = DVector::zeros(total_dims);
        for i in 0..total_dims {
            old_col_k_vals[i] = c_matrix[(i, k)];
        }
        for j in 0..total_dims {
            old_row_k_vals[j] = c_matrix[(k, j)];
        }

        for i in 0..total_dims {
            if i == k {
                continue;
            }
            for j in 0..total_dims {
                if j == k {
                    continue;
                }
                c_matrix[(i, j)] -= (old_col_k_vals[i] * old_row_k_vals[j]) / pivot_val;
            }
        }

        for j in 0..total_dims {
            if j == k {
                continue;
            }
            c_matrix[(k, j)] /= pivot_val;
        }

        for i in 0..total_dims {
            if i == k {
                continue;
            }
            c_matrix[(i, k)] /= pivot_val;
        }

        c_matrix[(k, k)] = -1.0 / pivot_val;

        swept_k_flags[k] = !swept_k_flags[k];
    }

    let s_rss = c_matrix[(p_params_in_model, p_params_in_model)];

    let mut final_g_inv = DMatrix::zeros(p_params_in_model, p_params_in_model);
    let mut final_beta_hat = DVector::zeros(p_params_in_model);

    for i in 0..p_params_in_model {
        if !is_param_aliased[i] {
            final_beta_hat[i] = c_matrix[(i, p_params_in_model)];
            for j in 0..p_params_in_model {
                if !is_param_aliased[j] {
                    final_g_inv[(i, j)] = -c_matrix[(i, j)];
                } else {
                    final_g_inv[(i, j)] = 0.0;
                }
            }
        } else {
            final_beta_hat[i] = 0.0;
            for r in 0..p_params_in_model {
                final_g_inv[(i, r)] = 0.0;
                final_g_inv[(r, i)] = 0.0;
            }
        }
    }

    Ok(SweptMatrixInfo {
        g_inv: final_g_inv,
        beta_hat: final_beta_hat,
        s_rss,
    })
}

pub fn create_l_matrix_for_term(
    design_info: &DesignMatrixInfo,
    term_name: &str
) -> Result<DMatrix<f64>, String> {
    let (term_start_col, term_end_col) = design_info.term_column_indices
        .get(term_name)
        .ok_or_else(|| format!("Term '{}' not found in design matrix column map.", term_name))?;

    let num_cols_for_term = term_end_col - term_start_col + 1;
    if num_cols_for_term == 0 {
        return Ok(DMatrix::zeros(0, design_info.p_parameters));
    }

    let mut l_matrix = DMatrix::zeros(num_cols_for_term, design_info.p_parameters);
    for i in 0..num_cols_for_term {
        l_matrix[(i, term_start_col + i)] = 1.0;
    }
    Ok(l_matrix)
}
