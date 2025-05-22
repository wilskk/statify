use nalgebra::{ DMatrix, DVector };
use std::collections::HashMap;

use crate::univariate::models::{ config::UnivariateConfig, data::AnalysisData };
use crate::univariate::stats::common::{ extract_numeric_value, data_value_to_string };
use crate::univariate::stats::factor_utils;

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
}

#[derive(Debug)]
pub struct SweptMatrixInfo {
    pub g_inv: DMatrix<f64>,
    pub beta_hat: DVector<f64>,
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
        });
    }

    let y_nalgebra = DVector::from_vec(y_values);
    let w_nalgebra_opt = wls_weights.map(DVector::from_vec);

    let model_terms = factor_utils::generate_model_design_terms(data, config)?;
    let mut x_matrix_cols: Vec<DVector<f64>> = Vec::new();
    let mut term_column_map: HashMap<String, (usize, usize)> = HashMap::new();
    let mut current_col_idx = 0;
    let mut intercept_col_idx: Option<usize> = None;
    let mut final_term_names: Vec<String> = Vec::new();

    for term_name in &model_terms {
        final_term_names.push(term_name.clone());
        let term_start_col = current_col_idx;
        let mut term_matrix_cols: Vec<DVector<f64>> = Vec::new();

        if term_name == "Intercept" {
            if config.model.intercept {
                let intercept_vec = DVector::from_element(n_samples_effective, 1.0);
                term_matrix_cols.push(intercept_vec);
                intercept_col_idx = Some(current_col_idx);
            } else {
                continue;
            }
        } else if config.main.covar.as_ref().map_or(false, |c| c.contains(term_name)) {
            let mut cov_values_filtered: Vec<f64> = Vec::new();
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
                                        "Covariate '{}' not found in record {}",
                                        term_name,
                                        idx_to_keep
                                    )
                                );
                            }
                        } else {
                            return Err(
                                format!("Record index {} out of bounds for covariate data", idx_to_keep)
                            );
                        }
                    }
                } else {
                    return Err(format!("No data found for covariate '{}'", term_name));
                }
            }
            if !cov_values_filtered.is_empty() {
                term_matrix_cols.push(DVector::from_vec(cov_values_filtered));
            }
        } else if term_name.contains('*') {
            let interaction_matrix_res = factor_utils::create_interaction_design_matrix(
                data,
                term_name
            )?;
            if !interaction_matrix_res.is_empty() {
                let ncols = interaction_matrix_res[0].len();
                for j in 0..ncols {
                    let column_vec: DVector<f64> = DVector::from_vec(
                        interaction_matrix_res
                            .iter()
                            .map(|row| row[j])
                            .collect()
                    );
                    term_matrix_cols.push(column_vec);
                }
            }
        } else {
            let main_effect_matrix_res = factor_utils::create_main_effect_design_matrix(
                data,
                term_name
            )?;
            if !main_effect_matrix_res.is_empty() {
                let ncols = main_effect_matrix_res[0].len();
                for j in 0..ncols {
                    let column_vec: DVector<f64> = DVector::from_vec(
                        main_effect_matrix_res
                            .iter()
                            .map(|row| row[j])
                            .collect()
                    );
                    term_matrix_cols.push(column_vec);
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
    })
}

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
        Ok(z.transpose() * w_diag * z)
    } else {
        Ok(z.transpose() * z)
    }
}

pub fn perform_sweep_and_extract_results(
    ztwz_matrix: &DMatrix<f64>,
    p_params_in_model: usize
) -> Result<SweptMatrixInfo, String> {
    if ztwz_matrix.nrows() != ztwz_matrix.ncols() {
        return Err("Z'WZ matrix must be square for SWEEP.".to_string());
    }
    if p_params_in_model == 0 && ztwz_matrix.nrows() > 0 {
        // Only Y, no X parameters
        if ztwz_matrix.nrows() == 1 && ztwz_matrix.ncols() == 1 {
            // Should be Y'Y
            return Ok(SweptMatrixInfo {
                g_inv: DMatrix::zeros(0, 0), // No G_inv
                beta_hat: DVector::zeros(0), // No Beta
                s_rss: ztwz_matrix[(0, 0)], // This is Y'Y (uncorrected SS for Y)
            });
        } else {
            return Err("Z'WZ matrix has unexpected dimensions for Y-only model.".to_string());
        }
    }
    if p_params_in_model >= ztwz_matrix.ncols() {
        // p_params_in_model should be less than total cols (p+r)
        return Err(
            format!(
                "Number of parameters to sweep ({}) is too large for Z'WZ matrix ({}x{}).",
                p_params_in_model,
                ztwz_matrix.nrows(),
                ztwz_matrix.ncols()
            )
        );
    }

    let mut c = ztwz_matrix.clone_owned();
    let mut sweep_successful_for_all_p = true;

    for k in 0..p_params_in_model {
        if c[(k, k)].abs() < 1e-12 {
            // Diagonal element is zero or very small, parameter k is redundant or aliased.
            // Set column k and row k to zero (except c[k,k] which remains as is or becomes 1/epsilon if pivot).
            // This is a simplified handling. True G2 inverse would require more complex algorithm for aliasing.
            // For now, if pivot is zero, we can't proceed with standard sweep for this param.
            // Mark as not successful and subsequent calculations will need to handle this (e.g. beta for this param is 0).
            // Or, skip sweeping this parameter and ensure its corresponding beta is 0 and G_inv entries are 0.
            // For simplicity, let's try to zero out its influence but this isn't a full G2 inverse.
            // A more robust sweep handles this by not pivoting on zero and recognizing aliasing.

            // If we simply skip sweeping, the G_inv will not be correct for g2 properties.
            // Let's signal that full rank sweep wasn't possible.
            // For now, this implementation assumes pivots are non-zero. If a zero pivot is encountered,
            // it indicates either a problem with X or the need for a more advanced sweep/g2 inverse.
            // For the purpose of GLM as described, a full rank X (or X'WX) is often assumed for parameter estimates.
            // If X is not full rank, some parameters are not uniquely estimable (aliased).
            // The SWEEP on X'X should produce a g2 inverse. If a pivot is zero, that part of g2 is zero.

            // For this implementation, we will proceed, but the resulting G_inv may not be a proper g2 if pivots are zero.
            // This case indicates linear dependency. GLM results might show these params as aliased or zeroed out.
            // No operation if pivot is zero to avoid division by zero. Beta for this will be effectively zero if C(k,j) remains unchanged.
            // G_inv(k,k) will also be zero if C(k,k) was zero. This aligns with some g2 properties for non-estimable params.
            sweep_successful_for_all_p = false; // Indicate potential rank deficiency
            // Continue to sweep other parameters if possible.
            // If c[k,k] is zero, the standard SWEEP formulas below would divide by zero.
            // We can skip this pivot, effectively zeroing out its contribution.
            for i in 0..c.nrows() {
                if i != k {
                    c[(i, k)] = 0.0;
                }
            }
            for j in 0..c.ncols() {
                if j != k {
                    c[(k, j)] = 0.0;
                }
            }
            // c[(k,k)] remains 0.0
            continue; // Skip standard sweep for this k if pivot is zero
        }

        let d = c[(k, k)];
        c[(k, k)] = -1.0 / d;

        for i in 0..c.nrows() {
            if i != k {
                c[(i, k)] /= d;
            }
        }
        for j in 0..c.ncols() {
            if j != k {
                c[(k, j)] /= d;
            }
        }
        for i in 0..c.nrows() {
            if i != k {
                for j in 0..c.ncols() {
                    if j != k {
                        c[(i, j)] += c[(i, k)] * c[(k, j)] * d;
                    }
                }
            }
        }
    }

    let mut g_inv_final = c.view((0, 0), (p_params_in_model, p_params_in_model)).into_owned();
    if p_params_in_model > 0 {
        // Avoid negating an empty matrix if p_params_in_model is 0
        g_inv_final.neg_mut(); // Store G = -(-G)
    }

    let beta_hat_final = c
        .view((0, p_params_in_model), (p_params_in_model, ztwz_matrix.ncols() - p_params_in_model))
        .column(0)
        .into_owned();
    let s_rss_final = c.view(
        (p_params_in_model, p_params_in_model),
        (ztwz_matrix.nrows() - p_params_in_model, ztwz_matrix.ncols() - p_params_in_model)
    )[(0, 0)]; // Assuming S_rss is a scalar at the bottom right of the p_params_in_model sweep

    Ok(SweptMatrixInfo {
        g_inv: g_inv_final,
        beta_hat: beta_hat_final,
        s_rss: s_rss_final,
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
        // This implies the term, though named, has no actual columns in X (e.g., fully aliased and removed during X construction).
        // Return an empty L matrix (0 rows), which should result in 0 df and 0 SS for this term.
        return Ok(DMatrix::zeros(0, design_info.p_parameters));
    }

    let mut l_matrix = DMatrix::zeros(num_cols_for_term, design_info.p_parameters);
    for i in 0..num_cols_for_term {
        l_matrix[(i, term_start_col + i)] = 1.0;
    }
    Ok(l_matrix)
}
