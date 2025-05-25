use std::collections::HashSet;
use std::collections::HashMap;

use nalgebra::{ DMatrix };

use crate::univariate::models::AnalysisData;
use crate::univariate::models::UnivariateConfig;

use super::core::*;

/// Constructs the L-matrix for Type I Sum of Squares for a given term F_j.
/// Steps:
/// 1. L0 = upper p x p submatrix of Z'WZ.
/// 2. SWEEP L0 on columns for effects before F_j.
/// 3. Set columns and rows of L0 for effects before F_j to 0.
/// 4. For rows of L0 for effects after F_j, set these rows to 0.
/// 5. Remove all 0 rows.
/// 6. Use row operations to remove linearly dependent rows. Result is L_I.
pub fn construct_type_i_l_matrix(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str, // F_j
    all_model_terms_in_order: &[String], // F0, F1, ..., Fm
    original_ztwz: &DMatrix<f64> // The full (p+r) x (p+r) Z'WZ matrix
) -> Result<DMatrix<f64>, String> {
    // Step 1: L0 = upper p x p submatrix of Z'WZ.
    if design_info.p_parameters == 0 {
        return Ok(DMatrix::zeros(0, 0));
    }
    if
        original_ztwz.nrows() < design_info.p_parameters ||
        original_ztwz.ncols() < design_info.p_parameters
    {
        return Err("Z'WZ matrix too small for p_parameters for Type I L.".to_string());
    }
    let l0 = original_ztwz
        .view((0, 0), (design_info.p_parameters, design_info.p_parameters))
        .clone_owned();

    // Identify columns for effects before F_j
    let mut cols_before_fj: Vec<usize> = Vec::new();
    let mut fj_found = false;
    for term_name in all_model_terms_in_order {
        if term_name == term_of_interest {
            fj_found = true;
            break;
        }
        if let Some((start, end)) = design_info.term_column_indices.get(term_name) {
            for col_idx in *start..=*end {
                if col_idx < design_info.p_parameters {
                    // Ensure within p_parameters bounds
                    cols_before_fj.push(col_idx);
                }
            }
        }
    }
    if !fj_found {
        return Err(
            format!("Term of interest '{}' not found in ordered model terms for Type I L.", term_of_interest)
        );
    }

    // Step 2: SWEEP L0 on columns for effects before F_j.
    let mut l0_swept = sweep_matrix_on_columns(l0, &cols_before_fj);
    // Step 3: Set columns and rows of (swept) L0 for effects before F_j to 0.
    for &col_idx in &cols_before_fj {
        if col_idx < l0_swept.ncols() {
            for r in 0..l0_swept.nrows() {
                l0_swept[(r, col_idx)] = 0.0;
            }
        }
        if col_idx < l0_swept.nrows() {
            for c in 0..l0_swept.ncols() {
                l0_swept[(col_idx, c)] = 0.0;
            }
        }
    }

    // Step 4: For rows of L0 for effects after F_j, set these rows to 0 (sesuai dokumentasi Type I SS)
    let mut fj_passed = false;
    for term_name in all_model_terms_in_order {
        if term_name == term_of_interest {
            fj_passed = true;
            continue;
        }
        if fj_passed {
            // Effect is after F_j
            if let Some((start, end)) = design_info.term_column_indices.get(term_name) {
                for row_idx in *start..=*end {
                    // These are parameter indices, map to rows of L0
                    if row_idx < l0_swept.nrows() {
                        for c in 0..l0_swept.ncols() {
                            l0_swept[(row_idx, c)] = 0.0;
                        }
                    }
                }
            }
        }
    }

    // Step 5 & 6: Remove 0 rows and linearly dependent rows (RRE/basis extraction)
    // Collect nonzero rows
    let mut nonzero_rows = Vec::new();
    for i in 0..l0_swept.nrows() {
        if
            l0_swept
                .row(i)
                .iter()
                .any(|&x| x.abs() > 1e-10)
        {
            nonzero_rows.push(l0_swept.row(i).clone_owned());
        }
    }
    // Extract a basis (linearly independent rows)
    let mut basis_rows = Vec::new();
    for row in nonzero_rows {
        let mut temp = basis_rows.clone();
        temp.push(row.clone());
        if DMatrix::from_rows(&temp).rank(1e-8) > basis_rows.len() {
            basis_rows.push(row);
        }
    }
    if basis_rows.is_empty() {
        return Ok(DMatrix::zeros(0, l0_swept.ncols()));
    }
    Ok(DMatrix::from_rows(&basis_rows))
}

/// Constructs the L-matrix for Type II Sum of Squares for a given term.
/// L = (0 CX_2' W_sqrt M_1 W_sqrt X_2  CX_2' W_sqrt M_1 W_sqrt X_3)
/// where M_1 = I - W_sqrt X_1 (X_1' W X_1)^-1 X_1' W_sqrt and C = (X_2' W_sqrt M_1 W_sqrt X_2)^-
pub fn construct_type_ii_l_matrix(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String]
) -> Result<DMatrix<f64>, String> {
    let (x1_indices, x2_indices, x3_indices) = partition_column_indices_for_type_ii(
        design_info,
        term_of_interest,
        all_model_terms
    )?;

    if x2_indices.is_empty() {
        return Ok(DMatrix::zeros(0, design_info.p_parameters));
    }

    let x_full = &design_info.x;
    let n_samples = design_info.n_samples;
    let p_total = design_info.p_parameters;

    let w_sqrt_matrix: DMatrix<f64> = if let Some(w_diag_vector) = &design_info.w {
        if w_diag_vector.len() != n_samples {
            return Err("Weight vector length mismatch for W_sqrt_matrix.".to_string());
        }
        DMatrix::from_diagonal(&w_diag_vector.map(|val| val.sqrt()))
    } else {
        DMatrix::identity(n_samples, n_samples)
    };

    // W matrix (not W_sqrt) for X1'WX1 term as per doc for M1
    let w_matrix: DMatrix<f64> = if let Some(w_diag_vector) = &design_info.w {
        DMatrix::from_diagonal(w_diag_vector)
    } else {
        DMatrix::identity(n_samples, n_samples)
    };

    let x1 = if !x1_indices.is_empty() {
        x_full.select_columns(&x1_indices)
    } else {
        DMatrix::zeros(n_samples, 0)
    };
    let x2 = x_full.select_columns(&x2_indices);
    let x3 = if !x3_indices.is_empty() {
        x_full.select_columns(&x3_indices)
    } else {
        DMatrix::zeros(n_samples, 0)
    };

    // M_1 = I - W_sqrt*X1*(X1'*W*X1)^- * X1'*W_sqrt
    let m1_matrix: DMatrix<f64>;
    if x1.ncols() > 0 {
        let x1_t_w_x1 = x1.transpose() * &w_matrix * &x1; // X1'WX1
        let x1_t_w_x1_pinv = x1_t_w_x1
            .clone()
            .pseudo_inverse(1e-10)
            .map_err(|e| {
                format!(
                    "Pseudo-inverse failed for X1'WX1 in Type II M1: {}. Matrix norm: {:.2e}",
                    e,
                    x1_t_w_x1.norm()
                )
            })?;

        let w_sqrt_x1 = &w_sqrt_matrix * &x1; // W_sqrt * X1
        let x1_t_w_sqrt = x1.transpose() * &w_sqrt_matrix; // X1' * W_sqrt

        let p_m1 = &w_sqrt_x1 * x1_t_w_x1_pinv * x1_t_w_sqrt; // W_sqrt*X1*(X1'WX1)^-1*X1'*W_sqrt
        m1_matrix = DMatrix::identity(n_samples, n_samples) - p_m1;
    } else {
        m1_matrix = DMatrix::identity(n_samples, n_samples);
    }

    // C_inv_term = X2'*W_sqrt*M1*W_sqrt*X2
    let x2_t_w_sqrt = x2.transpose() * &w_sqrt_matrix; // X2'*W_sqrt
    let m1_w_sqrt_x2 = &m1_matrix * &w_sqrt_matrix * &x2; // M1*W_sqrt*X2
    let c_inv_term = &x2_t_w_sqrt * m1_w_sqrt_x2;

    let df_f = c_inv_term.rank(1e-8);
    if df_f == 0 {
        return Ok(DMatrix::zeros(0, p_total));
    }

    // C = (X2'*W_sqrt*M1*W_sqrt*X2)^-
    let c_matrix = c_inv_term
        .clone()
        .pseudo_inverse(1e-10)
        .map_err(|e| {
            format!(
                "Pseudo-inverse failed for C_inv_term in Type II C: {}. Matrix norm: {:.2e}",
                e,
                c_inv_term.norm()
            )
        })?;

    // L_X2_block = C * X2'*W_sqrt*M1*W_sqrt*X2 = C * C_inv_term
    // L_X3_block = C * X2'*W_sqrt*M1*W_sqrt*X3
    // These blocks are filled as per the Type II SS documentation (see appendix)
    let l_coeffs_for_x2_params = &c_matrix * &c_inv_term;
    let l_coeffs_for_x3_params = if x3.ncols() > 0 {
        let m1_w_sqrt_x3 = &m1_matrix * &w_sqrt_matrix * &x3; // M1*W_sqrt*X3
        &c_matrix * &x2_t_w_sqrt * m1_w_sqrt_x3
    } else {
        DMatrix::zeros(df_f, 0)
    };

    let mut l_final = DMatrix::zeros(df_f, p_total);
    for r in 0..df_f {
        for (block_col_idx, original_col_idx) in x2_indices.iter().enumerate() {
            if block_col_idx < l_coeffs_for_x2_params.ncols() {
                l_final[(r, *original_col_idx)] = l_coeffs_for_x2_params[(r, block_col_idx)];
            }
        }
        if x3.ncols() > 0 {
            for (block_col_idx, original_col_idx) in x3_indices.iter().enumerate() {
                if block_col_idx < l_coeffs_for_x3_params.ncols() {
                    l_final[(r, *original_col_idx)] = l_coeffs_for_x3_params[(r, block_col_idx)];
                }
            }
        }
    }
    Ok(l_final)
}

/// Constructs the L-matrix for Type III Sum of Squares for a given term.
/// This involves H = (X'WX)^- X'WX and detailed row operations.
pub fn construct_type_iii_l_matrix(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String],
    swept_info: &Option<SweptMatrixInfo>
) -> Result<DMatrix<f64>, String> {
    // --- Start of Type III ---
    let g_inv = swept_info
        .as_ref()
        .ok_or_else(|| "Swept matrix info (g_inv) is required for Type III L-matrix.".to_string())?
        .g_inv.clone();

    if design_info.p_parameters == 0 {
        return Ok(DMatrix::zeros(0, 0));
    }
    if g_inv.nrows() != design_info.p_parameters || g_inv.ncols() != design_info.p_parameters {
        return Err(
            format!(
                "G_inv dimensions ({},{}) do not match p_parameters ({}) for Type III L-matrix.",
                g_inv.nrows(),
                g_inv.ncols(),
                design_info.p_parameters
            )
        );
    }

    let x_matrix = &design_info.x;
    let w_matrix: DMatrix<f64> = if let Some(w_vec) = &design_info.w {
        if w_vec.len() != design_info.n_samples {
            return Err("Weight vector length mismatch for Type III L-matrix.".to_string());
        }
        DMatrix::from_diagonal(w_vec)
    } else {
        DMatrix::identity(design_info.n_samples, design_info.n_samples)
    };

    // 1. Calculate H = (X'WX)^* X'WX. (Assuming g_inv is (X'WX)^*)
    let xt_w = x_matrix.transpose() * &w_matrix;
    let xt_w_x = &xt_w * x_matrix;
    let mut h_matrix = &g_inv * xt_w_x; // This is H, p x p matrix

    let factors_in_f_set: HashSet<_> = parse_interaction_term(term_of_interest)
        .into_iter()
        .collect();

    // 2. Zero out columns of effects not containing F using row operations.
    // This is a complex series of specific row operations described in the documentation.
    // "a) For each column not yet 0, set non-zero element as pivot.
    //  b) Divide pivot row by pivot value.
    //  c) Use row ops to introduce zeros to other elements in pivot column.
    //  d) Set entire pivot row to 0.
    //  e) Continue for next non-zero column..."
    // This effectively makes rows of H orthogonal to these effects.

    // Identify columns for effects not containing F
    let mut cols_to_zero_in_h: Vec<usize> = Vec::new();
    for other_term_name in all_model_terms {
        if other_term_name == term_of_interest {
            continue;
        }

        let factors_in_other_set: HashSet<_> = parse_interaction_term(other_term_name)
            .into_iter()
            .collect();

        let other_contains_f = factors_in_f_set.is_subset(&factors_in_other_set);

        if !other_contains_f {
            // If other_term does NOT contain F
            if let Some((start, end)) = design_info.term_column_indices.get(other_term_name) {
                for i_col in *start..=*end {
                    if !cols_to_zero_in_h.contains(&i_col) {
                        cols_to_zero_in_h.push(i_col);
                    }
                }
            }
        }
    }
    // Step 2: For each column of effects not containing F (except F), perform row operations per documentation
    for &col_idx in &cols_to_zero_in_h {
        // Find pivot row (first row with nonzero entry in this column)
        let mut pivot_row = None;
        for r in 0..h_matrix.nrows() {
            if h_matrix[(r, col_idx)].abs() > 1e-10 {
                pivot_row = Some(r);
                break;
            }
        }
        if let Some(pivot) = pivot_row {
            let pivot_val = h_matrix[(pivot, col_idx)];
            if pivot_val.abs() > 1e-10 {
                // Divide pivot row by pivot value
                for c in 0..h_matrix.ncols() {
                    h_matrix[(pivot, c)] /= pivot_val;
                }
                // Zero out the rest of the column
                for r in 0..h_matrix.nrows() {
                    if r != pivot {
                        let factor = h_matrix[(r, col_idx)];
                        for c in 0..h_matrix.ncols() {
                            h_matrix[(r, c)] -= factor * h_matrix[(pivot, c)];
                        }
                    }
                }
                // Set the entire pivot row to zero
                for c in 0..h_matrix.ncols() {
                    h_matrix[(pivot, c)] = 0.0;
                }
            }
        }
    }

    // Extract rows for term_of_interest from this modified H to form L_intermediate
    let (term_start_col_idx, term_end_col_idx) = design_info.term_column_indices
        .get(term_of_interest)
        .ok_or_else(|| format!("Term '{}' not found for Type III L.", term_of_interest))?;
    let num_param_f = term_end_col_idx - term_start_col_idx + 1;
    if num_param_f == 0 {
        return Ok(DMatrix::zeros(0, design_info.p_parameters));
    }
    let l_intermediate = h_matrix.rows(*term_start_col_idx, num_param_f).clone_owned();

    // Step 3: Extract a basis (linearly independent rows) from l_intermediate
    let rank = l_intermediate.rank(1e-8);
    if rank == 0 {
        return Ok(DMatrix::zeros(0, design_info.p_parameters));
    }
    if l_intermediate.nrows() == 0 {
        return Ok(DMatrix::zeros(0, design_info.p_parameters));
    }
    let mut l_step3_rows: Vec<nalgebra::RowDVector<f64>> = Vec::with_capacity(rank);
    for i in 0..l_intermediate.nrows() {
        if l_step3_rows.len() == rank {
            break;
        }
        let current_row = l_intermediate.row(i).into_owned();
        let mut temp_rows = l_step3_rows.clone();
        temp_rows.push(current_row.clone());
        if DMatrix::from_rows(&temp_rows).rank(1e-8) > l_step3_rows.len() {
            l_step3_rows.push(current_row);
        }
    }
    if l_step3_rows.is_empty() {
        return Ok(DMatrix::zeros(0, design_info.p_parameters));
    }
    let l_basis = DMatrix::from_rows(&l_step3_rows);

    // Step 4: Partition rows into G0 (F-cols all 0) and G1 (F-cols not all 0), then orthogonalize G1 against G0
    let (term_start_col_idx, term_end_col_idx) = design_info.term_column_indices
        .get(term_of_interest)
        .ok_or_else(|| format!("Term '{}' not found for Type III L.", term_of_interest))?;
    let f_col_range = *term_start_col_idx..=*term_end_col_idx;
    let mut g0_rows = Vec::new();
    let mut g1_rows = Vec::new();
    for i in 0..l_basis.nrows() {
        let row = l_basis.row(i);
        let is_g0 = f_col_range.clone().all(|j| row[j].abs() < 1e-10);
        if is_g0 {
            g0_rows.push(row.clone_owned());
        } else {
            g1_rows.push(row.clone_owned());
        }
    }
    // Orthogonalize G1 rows against G0 rows (Gram-Schmidt process)
    let mut g1_orth: Vec<nalgebra::RowDVector<f64>> = Vec::new();
    for mut row in g1_rows {
        for g0 in &g0_rows {
            let dot = row.dot(&g0.transpose());
            let norm2 = g0.dot(&g0.transpose());
            if norm2 > 1e-12 {
                row -= g0 * (dot / norm2);
            }
        }
        // Only keep if not zero after orthogonalization
        if row.iter().any(|&x| x.abs() > 1e-10) {
            g1_orth.push(row);
        }
    }
    // Combine G1_orth and G0 as final L-matrix
    let mut l_final_rows = g1_orth;
    l_final_rows.extend(g0_rows);
    if l_final_rows.is_empty() {
        return Ok(DMatrix::zeros(0, design_info.p_parameters));
    }
    Ok(DMatrix::from_rows(&l_final_rows))
}

/// Constructs the L-matrix for Type IV Sum of Squares for a given term.
/// Builds upon Type III logic and adjusts for empty cells in the design.
pub fn construct_type_iv_l_matrix(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String],
    swept_info: &Option<SweptMatrixInfo>,
    config: &UnivariateConfig, // Added config parameter to get dep_var_name
    data: &AnalysisData // Keep data parameter for cell counting
) -> Result<DMatrix<f64>, String> {
    // 1. Perform Type III steps 1, 2, and 3.
    //    This means calling a modified Type III that can return the matrix from its step 3.
    let l_matrix_base_type_iv = construct_type_iii_l_matrix(
        design_info,
        term_of_interest,
        all_model_terms,
        swept_info
    )?;

    if l_matrix_base_type_iv.nrows() == 0 || design_info.p_parameters == 0 {
        return Ok(l_matrix_base_type_iv);
    }

    let factors_in_f_set: HashSet<_> = parse_interaction_term(term_of_interest)
        .into_iter()
        .collect();

    let mut effects_containing_f: Vec<&String> = Vec::new();
    for model_term_name in all_model_terms {
        if model_term_name == term_of_interest {
            continue;
        }
        let factors_in_model_term_set: HashSet<_> = parse_interaction_term(model_term_name)
            .into_iter()
            .collect();
        if factors_in_f_set.is_subset(&factors_in_model_term_set) {
            effects_containing_f.push(model_term_name);
        }
    }

    // 2. If no effects containing F, matrix from Type III (step 3) is Type IV L.
    if effects_containing_f.is_empty() {
        return Ok(l_matrix_base_type_iv);
    }

    // 3. Adjust coefficients based on cell occupancy (Type IV specific rules per documentation).
    // For each row of L, for each effect containing F, for each parameter column, adjust coefficients.
    let mut l_matrix_type_iv = l_matrix_base_type_iv.clone();

    // Get the dependent variable name from config
    let dep_var_name = config.main.dep_var
        .as_ref()
        .ok_or_else(|| "Dependent variable name not found in config.".to_string())?;

    for row_idx in 0..l_matrix_type_iv.nrows() {
        for &effect_name in &effects_containing_f {
            if let Some((start, end)) = design_info.term_column_indices.get(effect_name) {
                let effect_factors = parse_interaction_term(effect_name);

                for col_idx in *start..=*end {
                    let coeff = l_matrix_type_iv[(row_idx, col_idx)];

                    // If the coefficient is zero, the adjusted coefficient is also zero.
                    if coeff.abs() < 1e-10 {
                        l_matrix_type_iv[(row_idx, col_idx)] = 0.0;
                        continue;
                    }

                    // Determine the specific combination of factor levels represented by this design matrix column (col_idx).
                    // This requires inspecting the column vector design_info.x.column(col_idx).
                    // For simple main effects or standard contrast codings, a non-zero entry at a specific row
                    // indicates the level combination of that row corresponds to this column.
                    let mut represented_combo: Option<HashMap<String, String>> = None;
                    let design_col = design_info.x.column(col_idx);

                    // Find a data record index that corresponds to a non-zero entry in this design column.
                    // This assumes the order of rows in design_info.x corresponds to the order of records in data.dependent_data,
                    // and that design_info.case_indices_to_keep maps swept row index to original data index.
                    let mut sample_record_idx_in_kept_data: Option<usize> = None;
                    for i in 0..design_col.nrows() {
                        if design_col[i].abs() > 1e-10 {
                            sample_record_idx_in_kept_data = Some(i); // This is the index within the *kept* cases
                            break;
                        }
                    }

                    if let Some(kept_idx) = sample_record_idx_in_kept_data {
                        // Map back to original data index
                        let original_rec_idx = design_info.case_indices_to_keep[kept_idx];
                        // Get the factor levels for this record from the original data
                        if let Some(record) = data.dependent_data[0].get(original_rec_idx) {
                            // Assumes data.dependent_data[0] is the main data group
                            let mut combo = HashMap::new();
                            for factor_name in &effect_factors {
                                if let Some(val) = record.values.get(factor_name) {
                                    combo.insert(
                                        factor_name.clone(),
                                        crate::univariate::stats::common::data_value_to_string(val)
                                    );
                                } else {
                                    // This factor should be present if effect_name was parsed correctly.
                                    return Err(
                                        format!("Factor '{}' not found in data record for cell counting.", factor_name)
                                    );
                                }
                            }
                            represented_combo = Some(combo);
                        }
                    }

                    if let Some(combo) = represented_combo {
                        // Extract the level of the term_of_interest (F) from this combination
                        let f_level_in_combo = combo.get(term_of_interest);

                        if let Some(f_level_str) = f_level_in_combo {
                            // Count N(level F): number of non-missing cells for this level of F in the context of the containing effect combination represented by this column.
                            let mut n_level_f_in_effect_context = 0;

                            for records_group in &data.dependent_data {
                                for record in records_group {
                                    // Check if record matches the represented combination AND has a non-missing DV
                                    let matches_represented_combo = matches_combination(
                                        record,
                                        &combo
                                    );
                                    // Check if the record's level for term_of_interest matches the one represented by the column
                                    let matches_f_level_for_record = if
                                        let Some(val) = record.values.get(term_of_interest)
                                    {
                                        crate::univariate::stats::common::data_value_to_string(
                                            val
                                        ) == *f_level_str
                                    } else {
                                        false
                                    };

                                    // A record contributes to N(level F) for this column if it matches the combo *and* the F level *and* has a non-missing DV
                                    if matches_represented_combo && matches_f_level_for_record {
                                        if
                                            let Some(_) = extract_numeric_from_record(
                                                record,
                                                dep_var_name
                                            )
                                        {
                                            n_level_f_in_effect_context += 1;
                                        }
                                    }
                                }
                            }

                            // Apply adjustment: divide by N(level F) if > 0, else set to 0.
                            if n_level_f_in_effect_context > 0 {
                                l_matrix_type_iv[(row_idx, col_idx)] =
                                    coeff / (n_level_f_in_effect_context as f64);
                            } else {
                                l_matrix_type_iv[(row_idx, col_idx)] = 0.0;
                            }
                        } else {
                            // If term_of_interest (F) is not a simple factor directly in the combination (e.g., F is an interaction term itself)
                            // or extraction failed, we cannot determine the specific F level for adjustment based on this combo.
                            // Set to 0 as a conservative approach.
                            l_matrix_type_iv[(row_idx, col_idx)] = 0.0;
                        }
                    } else {
                        // If the level combination represented by the design matrix column cannot be determined,
                        // the adjustment rule based on cell occupancy cannot be applied. Set to 0.
                        l_matrix_type_iv[(row_idx, col_idx)] = 0.0;
                    }
                }
            }
        }
    }

    Ok(l_matrix_type_iv)
}

fn partition_column_indices_for_type_ii(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String]
) -> Result<(Vec<usize>, Vec<usize>, Vec<usize>), String> {
    let mut x1_indices = Vec::new();
    let mut x2_indices = Vec::new();
    let mut x3_indices = Vec::new();

    let factors_in_f_set: HashSet<_> = parse_interaction_term(term_of_interest)
        .into_iter()
        .collect();

    if let Some((start, end)) = design_info.term_column_indices.get(term_of_interest) {
        for i in *start..=*end {
            x2_indices.push(i);
        }
    } else {
        return Err(
            format!("Term '{}' not found in design_info for Type II partitioning.", term_of_interest)
        );
    }

    for other_term_name in all_model_terms {
        if other_term_name == term_of_interest {
            continue;
        }

        // Handle intercept separately for X1 if not F
        if other_term_name == "Intercept" {
            if term_of_interest != "Intercept" {
                if let Some(idx) = design_info.intercept_column {
                    if !x1_indices.contains(&idx) {
                        x1_indices.push(idx);
                    }
                }
            }
            continue;
        }

        if let Some((start_j, end_j)) = design_info.term_column_indices.get(other_term_name) {
            let factors_in_j_set: HashSet<_> = parse_interaction_term(other_term_name)
                .into_iter()
                .collect();

            let j_contains_f = factors_in_f_set.is_subset(&factors_in_j_set);
            // let f_contains_j = factors_in_j_set.is_subset(&factors_in_f_set); // Not used in Type II partitioning logic directly this way

            for i_col in *start_j..=*end_j {
                if j_contains_f {
                    // Effect J contains F (term_of_interest)
                    // If J is higher order than F (more factors), it's X3.
                    // If J is F itself, it's X2 (already handled).
                    if factors_in_j_set.len() > factors_in_f_set.len() {
                        if !x3_indices.contains(&i_col) {
                            x3_indices.push(i_col);
                        }
                    }
                } else {
                    // Effect J does not contain F - so it belongs to X1
                    if !x1_indices.contains(&i_col) {
                        x1_indices.push(i_col);
                    }
                }
            }
        }
    }

    x1_indices.sort_unstable();
    x1_indices.dedup();
    x2_indices.sort_unstable(); // Should be sorted from range
    x2_indices.dedup();
    x3_indices.sort_unstable();
    x3_indices.dedup();

    Ok((x1_indices, x2_indices, x3_indices))
}

/// SWEEP operator for a matrix on a list of columns (in order)
pub fn sweep_matrix_on_columns(mut matrix: DMatrix<f64>, cols_to_sweep: &[usize]) -> DMatrix<f64> {
    let n = matrix.nrows();
    for &k in cols_to_sweep {
        if k >= n {
            continue;
        }
        let pivot = matrix[(k, k)];
        if pivot.abs() < 1e-12 {
            continue;
        }
        for i in 0..n {
            for j in 0..n {
                if i != k && j != k {
                    matrix[(i, j)] -= (matrix[(i, k)] * matrix[(k, j)]) / pivot;
                }
            }
        }
        for j in 0..n {
            if j != k {
                matrix[(k, j)] /= pivot;
            }
        }
        for i in 0..n {
            if i != k {
                matrix[(i, k)] /= pivot;
            }
        }
        matrix[(k, k)] = -1.0 / pivot;
    }
    matrix
}
