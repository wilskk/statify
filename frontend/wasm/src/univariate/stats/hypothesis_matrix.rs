use std::collections::{ HashMap, HashSet };
use itertools::Itertools;
use nalgebra::{ DMatrix, DVector };

use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::DesignMatrixInfo,
};
use crate::univariate::stats::factor_utils::{
    get_factor_levels,
    parse_interaction_term,
    parse_parameter_name,
    generate_all_row_parameter_names_sorted,
};
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
    _all_model_terms: &[String], // May not be strictly needed if all info derived from design_info + data
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<DMatrix<f64>, String> {
    // 1. Get all_model_param_names (full list of parameter names for X columns)
    // These names must correspond 1-to-1 with the columns of design_info.x
    let all_model_param_names = generate_all_row_parameter_names_sorted(design_info, data)?;
    if all_model_param_names.len() != design_info.p_parameters {
        return Err(
            format!(
                "Mismatch between generated param names ({}) and p_parameters ({}). Param names: {:?}",
                all_model_param_names.len(),
                design_info.p_parameters,
                all_model_param_names
            )
        );
    }

    // 2. Get all unique factor names from design_info.term_names and their levels/counts
    let mut factor_levels_map: HashMap<String, Vec<String>> = HashMap::new();
    let mut unique_true_factor_names_in_model = HashSet::new(); // Only names of actual factors, not covariates

    // Populate unique_true_factor_names_in_model by checking against config's factor/covariate lists
    for term_in_design in &design_info.term_names {
        if term_in_design == "Intercept" {
            continue;
        }
        let components = parse_interaction_term(term_in_design); // Splits "A*B" into ["A", "B"]
        for potential_factor_name in components {
            let is_covariate = config.main.covar
                .as_ref()
                .map_or(false, |c_list| { c_list.contains(&potential_factor_name) });
            let is_fix_factor = config.main.fix_factor
                .as_ref()
                .map_or(false, |f_list| { f_list.contains(&potential_factor_name) });
            let is_rand_factor = config.main.rand_factor
                .as_ref()
                .map_or(false, |r_list| { r_list.contains(&potential_factor_name) });

            if !is_covariate && (is_fix_factor || is_rand_factor) {
                unique_true_factor_names_in_model.insert(potential_factor_name.clone());
            }
        }
    }

    for factor_name_str in &unique_true_factor_names_in_model {
        match get_factor_levels(data, factor_name_str) {
            Ok(levels) => {
                if levels.is_empty() {
                    return Err(
                        format!("Factor '{}' (identified as a true factor from config) has no levels defined in the data.", factor_name_str)
                    );
                }
                factor_levels_map.insert(factor_name_str.clone(), levels);
            }
            Err(e) => {
                // This should ideally not happen if unique_true_factor_names_in_model was populated correctly
                return Err(
                    format!(
                        "Error getting levels for presumed factor '{}': {}. This might indicate an inconsistency.",
                        factor_name_str,
                        e
                    )
                );
            }
        }
    }

    let mut l_rows: Vec<DVector<f64>> = Vec::new();
    let p = design_info.p_parameters;

    // Determine if the term_of_interest is a covariate
    let is_covariate_term =
        config.main.covar
            .as_ref()
            .map_or(false, |covars| covars.iter().any(|c| c == term_of_interest)) &&
        !term_of_interest.contains('*') && // Ensure it's not an interaction term like "Cov*Factor"
        term_of_interest != "Intercept";

    // Case 1: term_of_interest is "Intercept"
    if term_of_interest == "Intercept" {
        let mut l_vec = DVector::from_element(p, 0.0);
        for (j, param_name) in all_model_param_names.iter().enumerate() {
            if param_name == "Intercept" {
                l_vec[j] = 1.0;
            } else {
                let param_components = parse_parameter_name(param_name); // E.g. {"F1":"L1", "F2":"L2"}
                let mut coeff_prod = 1.0;
                let mut is_pure_factor_based_param = !param_components.is_empty();

                for (factor_in_param, _level_in_param) in &param_components {
                    if let Some(levels) = factor_levels_map.get(factor_in_param) {
                        coeff_prod *= 1.0 / (levels.len() as f64);
                    } else {
                        // This component of the parameter is not in factor_levels_map.
                        // It means it's not a "true factor" identified earlier (e.g., it's a covariate).
                        // The intercept L-vector definition averages over factor levels.
                        // If a parameter involves a non-factor, its coefficient for the Intercept L is 0.
                        is_pure_factor_based_param = false;
                        break;
                    }
                }

                if is_pure_factor_based_param {
                    l_vec[j] = coeff_prod;
                } else {
                    // If param_name is not "Intercept" and not purely factor-based, its coeff is 0 for Intercept L.
                    l_vec[j] = 0.0;
                }
            }
        }
        l_rows.push(l_vec);
    } else if is_covariate_term {
        // Case: term_of_interest is a Covariate
        // The L-matrix for a covariate is a row vector with 1 at the covariate's parameter index and 0 otherwise.
        if let Some(param_idx) = all_model_param_names.iter().position(|pn| pn == term_of_interest) {
            let mut l_vec = DVector::from_element(p, 0.0);
            l_vec[param_idx] = 1.0;
            l_rows.push(l_vec);
        } else {
            // This warning indicates that the covariate defined in the model config
            // was not found among the generated parameter names. This will result in an empty L-matrix for this term.
            web_sys::console::warn_1(
                &format!(
                    "Hypothesis matrix (Type III): Covariate term '{}' from config was not found in the generated parameter names ({:?}). L-matrix for this term will be empty.",
                    term_of_interest,
                    all_model_param_names
                ).into()
            );
        }
    } else if
        // Case 2: term_of_interest is a Main Effect (and is a known factor)
        !term_of_interest.contains('*') &&
        factor_levels_map.contains_key(term_of_interest)
    {
        let f_levels = factor_levels_map.get(term_of_interest).unwrap();
        let num_f_levels = f_levels.len();
        if num_f_levels >= 2 {
            let ref_level_f = f_levels.last().unwrap().clone(); // Using last level as reference
            for i in 0..num_f_levels - 1 {
                let current_level_f = f_levels[i].clone();
                let mut l_vec = DVector::from_element(p, 0.0);

                for (j, param_name) in all_model_param_names.iter().enumerate() {
                    let param_components = parse_parameter_name(param_name);
                    // Check if the parameter involves the term_of_interest (F)
                    if let Some(level_in_param_for_f) = param_components.get(term_of_interest) {
                        let mut f_contrast_coeff: f64 = 0.0;
                        if level_in_param_for_f == &current_level_f {
                            f_contrast_coeff = 1.0;
                        } else if level_in_param_for_f == &ref_level_f {
                            f_contrast_coeff = -1.0;
                        }

                        if f_contrast_coeff.abs() > 1e-9 {
                            // This parameter is part of the contrast for F
                            let mut avg_coeff_for_other_factors = 1.0;
                            let mut is_param_structure_valid_for_avg = true;

                            for (factor_in_param, _level_in_param) in &param_components {
                                if factor_in_param != term_of_interest {
                                    // This is an "other factor" within the parameter
                                    if
                                        let Some(other_factor_levels) =
                                            factor_levels_map.get(factor_in_param)
                                    {
                                        avg_coeff_for_other_factors *=
                                            1.0 / (other_factor_levels.len() as f64);
                                    } else {
                                        // This "other component" in the param is not a known factor (e.g., a covariate).
                                        // The averaging rule applies to *other factors*.
                                        // If it's an interaction with a covariate (e.g. F*Cov), this logic may need adjustment
                                        // or such parameters should get coefficient 0 for this main effect L.
                                        is_param_structure_valid_for_avg = false;
                                        break;
                                    }
                                }
                            }

                            if is_param_structure_valid_for_avg {
                                l_vec[j] = f_contrast_coeff * avg_coeff_for_other_factors;
                            }
                            // else l_vec[j] remains 0.0
                        }
                    }
                    // else: param does not contain term_of_interest, so l_vec[j] remains 0.0
                }
                l_rows.push(l_vec);
            }
        }
        // If num_f_levels < 2, no contrasts, l_rows remains empty for this term_of_interest.
    } else if
        // Case 3: term_of_interest is an Interaction
        term_of_interest.contains('*')
    {
        let interaction_factors_names_in_term_of_interest =
            parse_interaction_term(term_of_interest);
        let mut factor_contrast_plans = Vec::new(); // Stores Vec<(non_ref_level, ref_level)> for each factor in interaction
        let mut interaction_possible_and_valid = true;

        for f_name in &interaction_factors_names_in_term_of_interest {
            if let Some(levels) = factor_levels_map.get(f_name) {
                if levels.len() < 2 {
                    interaction_possible_and_valid = false;
                    break;
                }
                let ref_level = levels.last().unwrap().clone();
                let mut contrasts_for_this_factor = Vec::new();
                for i in 0..levels.len() - 1 {
                    contrasts_for_this_factor.push((levels[i].clone(), ref_level.clone()));
                }
                factor_contrast_plans.push(contrasts_for_this_factor);
            } else {
                // One of the factors in term_of_interest is not a known factor (e.g. a covariate named like F*Cov)
                interaction_possible_and_valid = false;
                break;
            }
        }

        if interaction_possible_and_valid && !factor_contrast_plans.is_empty() {
            // Generate all combinations of chosen contrasts, one from each factor's plan
            // e.g., factor_contrast_plans = [ [(A1,A_ref)], [(B1,B_ref),(B2,B_ref)] ]
            // Itertools::multi_cartesian_product will give:
            // 1. ( (A1,A_ref), (B1,B_ref) )
            // 2. ( (A1,A_ref), (B2,B_ref) )
            for specific_contrast_combination in factor_contrast_plans
                .iter()
                .map(|plan| plan.iter()) // Need iterators for multi_cartesian_product
                .multi_cartesian_product() {
                // specific_contrast_combination is Vec<&(non_ref_level, ref_level)>
                let mut l_vec = DVector::from_element(p, 0.0);
                for (j_param_idx, param_name) in all_model_param_names.iter().enumerate() {
                    let param_components = parse_parameter_name(param_name); // e.g. {"A":"A1", "B":"B1", "C":"C2"}
                    let mut final_param_coeff_for_this_l: f64 = 1.0;
                    let mut param_relevant_to_this_l = true;

                    // Part 1: Calculate product of contrast coefficients for factors IN the term_of_interest
                    for (
                        k_int_factor,
                        int_factor_name,
                    ) in interaction_factors_names_in_term_of_interest.iter().enumerate() {
                        if
                            let Some(level_of_int_factor_in_param) =
                                param_components.get(int_factor_name)
                        {
                            let (non_ref_level_for_contrast, ref_level_for_contrast) =
                                specific_contrast_combination[k_int_factor]; // This is & (String, String)

                            if level_of_int_factor_in_param == non_ref_level_for_contrast {
                                final_param_coeff_for_this_l *= 1.0;
                            } else if level_of_int_factor_in_param == ref_level_for_contrast {
                                final_param_coeff_for_this_l *= -1.0;
                            } else {
                                // This param's level for this int_factor_name is not part of the current contrast definition
                                final_param_coeff_for_this_l = 0.0;
                                break; // No need to check other factors for this L
                            }
                        } else {
                            // The parameter does not contain this specific interaction factor from term_of_interest.
                            // So, this parameter is not relevant for this specific L-vector.
                            param_relevant_to_this_l = false;
                            break;
                        }
                    }

                    if !param_relevant_to_this_l || final_param_coeff_for_this_l.abs() < 1e-9 {
                        l_vec[j_param_idx] = 0.0;
                        continue;
                    }

                    // Part 2: Average over levels of factors NOT IN the term_of_interest but present in the parameter
                    for (factor_in_param_name, _level_in_param) in param_components.iter() {
                        if
                            !interaction_factors_names_in_term_of_interest.contains(
                                factor_in_param_name
                            )
                        {
                            // This factor_in_param_name is an "other" factor
                            if
                                let Some(other_factor_levels) =
                                    factor_levels_map.get(factor_in_param_name)
                            {
                                final_param_coeff_for_this_l *=
                                    1.0 / (other_factor_levels.len() as f64);
                            } else {
                                // This "other" component in param is not a known factor (e.g., a covariate)
                                // Per user: "If there is an interaction with a third factor, the coefficient for the
                                // three-way interaction will be the product of the two-way coefficient and the weight of the third factor."
                                // This implies averaging only over "other factors". If it's a covariate, no averaging.
                                // So, the term becomes irrelevant for this specific L construction (based on averaging factors)
                                final_param_coeff_for_this_l = 0.0;
                                break;
                            }
                        }
                    }
                    l_vec[j_param_idx] = final_param_coeff_for_this_l;
                }
                l_rows.push(l_vec);
            }
        }
    }
    // Note: The constructive method for Type III SS now handles Intercept, main effects of factors,
    // interactions between factors, and main effects of covariates (as a single parameter hypothesis).
    // The L-matrix for a covariate 'C' will test H0: beta_C = 0.
    // Interactions involving covariates (e.g., Cov*Factor) are typically handled as part of the
    // 'Interaction' case if their structure fits the factor-interaction pattern, or might
    // require specific L-matrix construction if they have unique parameterization.

    if l_rows.is_empty() {
        Ok(DMatrix::zeros(0, p))
    } else {
        let row_d_vectors: Vec<nalgebra::RowDVector<f64>> = l_rows
            .into_iter()
            .map(|dv_col| dv_col.transpose())
            .collect();
        Ok(DMatrix::from_rows(&row_d_vectors))
    }
}

/// Constructs the L-matrix for Type IV Sum of Squares for a given term.
/// Builds upon Type III logic and adjusts for empty cells in the design.
pub fn construct_type_iv_l_matrix(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String],
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<DMatrix<f64>, String> {
    // 1. Perform Type III calculation.
    let l_matrix_base_type_iv = construct_type_iii_l_matrix(
        design_info,
        term_of_interest,
        all_model_terms,
        data,
        config
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
                                    combo.insert(factor_name.clone(), data_value_to_string(val));
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

                            // Create a record for matching
                            let mut record = HashMap::new();
                            for (factor_name, level) in &combo {
                                record.insert(factor_name.clone(), level.clone());
                            }

                            // Get the factor values for the term of interest
                            if
                                let Some(factor_values) = get_numeric_values_from_source(
                                    Some(&data.fix_factor_data_defs),
                                    Some(&data.fix_factor_data),
                                    term_of_interest,
                                    "Fixed factor"
                                ).ok()
                            {
                                // Get matching rows
                                let matching_rows = matches_combination(&record, data);

                                // Count matches where factor level matches
                                for factor_val in factor_values {
                                    if
                                        matching_rows.contains(&factor_val) &&
                                        factor_val.to_string() == *f_level_str
                                    {
                                        n_level_f_in_effect_context += 1;
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
                            // If term_of_interest (F) is not a simple factor directly in the combination
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
