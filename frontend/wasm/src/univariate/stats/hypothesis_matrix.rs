use nalgebra::{ DMatrix, DVector };
use std::collections::HashMap;

use super::core::*;
use crate::univariate::models::{ config::UnivariateConfig, data::AnalysisData };

/// Constructs the L-matrix for Type II Sum of Squares for a given term.
/// L = (0 CX_2' W M_1 W X_2  CX_2' W M_1 W X_3)
/// where M_1 = I - W X_1 (X_1' W X_1)^- X_1' W and C = (X_2' W M_1 W X_2)^-
pub fn construct_type_ii_l_matrix(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String] // All terms in the model, sorted appropriately
    // config: &UnivariateConfig, // May need for term parsing or model details
    // data: &AnalysisData, // May be needed if W involves data lookups not in design_info
) -> Result<DMatrix<f64>, String> {
    // TODO: Implement Type II L-matrix construction logic based on documentation.
    // 1. Partition X into X1, X2, X3 based on term_of_interest and all_model_terms.
    //    X1: columns for effects not containing F.
    //    X2: columns for F (term_of_interest).
    //    X3: columns for effects containing F (and are not F itself).
    // 2. Get W (weights matrix, identity if not WLS) from design_info.
    // 3. Calculate M1 = I - W*X1*(X1'*W*X1)^- * X1'*W. (Use pseudo-inverse for ^-)
    // 4. Calculate C = (X2'*W*M1*W*X2)^-. (Use pseudo-inverse)
    // 5. Construct L matrix:
    //    L will have rows = rank(X2) or num_cols(X2), and cols = design_info.p_parameters.
    //    L_block_for_X1_params = 0
    //    L_block_for_X2_params = C * X2' * W * M1 * W * X2
    //    L_block_for_X3_params = C * X2' * W * M1 * W * X3
    //    Assemble these blocks into the full L matrix according to original parameter order.

    Err(format!("construct_type_ii_l_matrix for term '{}' not yet implemented.", term_of_interest))
}

/// Constructs the L-matrix for Type III Sum of Squares for a given term.
/// This involves procedures based on H = (X'WX)^- X'WX and row operations.
pub fn construct_type_iii_l_matrix(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String],
    _config: &UnivariateConfig,
    _data: &AnalysisData, // May be needed for checking cell properties or factor levels
    swept_info: &Option<SweptMatrixInfo> // To get G_inv = (X'WX)^-
) -> Result<DMatrix<f64>, String> {
    // TODO: Implement Type III L-matrix construction logic based on documentation.
    // 1. Get G = (X'WX)^- (from swept_info.g_inv or recompute if necessary).
    // 2. Get X, W from design_info.
    // 3. Compute H_full = G * (X' * W * X).
    // 4. Let L_initial be the rows of H_full corresponding to parameters of term_of_interest.
    // 5. Zero out columns in L_initial that correspond to parameters of effects NOT containing term_of_interest
    //    (and are not term_of_interest itself, nor intercept unless term_of_interest is intercept).
    //    This is often done by SWEEPing L_initial on these "irrelevant" columns.
    // 6. Perform row operations (e.g., to RRE form) on the modified L_initial.
    // 7. Remove zero rows. The result is the Type III L matrix.

    // Fallback to current simple L matrix for now.
    // This should be replaced with the full Type III logic.
    let (term_start_col, term_end_col) = design_info.term_column_indices
        .get(term_of_interest)
        .ok_or_else(||
            format!("Term '{}' not found in design matrix column map for Type III L.", term_of_interest)
        )?;

    let num_cols_for_term = term_end_col - term_start_col + 1;
    if num_cols_for_term == 0 {
        return Ok(DMatrix::zeros(0, design_info.p_parameters));
    }

    let mut l_matrix = DMatrix::zeros(num_cols_for_term, design_info.p_parameters);
    for i in 0..num_cols_for_term {
        if term_start_col + i < design_info.p_parameters {
            l_matrix[(i, term_start_col + i)] = 1.0;
        }
    }
    Ok(l_matrix)
    // Err(format!("construct_type_iii_l_matrix for term '{}' not yet implemented.", term_of_interest))
}

/// Constructs the L-matrix for Type IV Sum of Squares for a given term.
/// Builds upon Type III logic and adjusts for empty cells in the design.
pub fn construct_type_iv_l_matrix(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String],
    config: &UnivariateConfig,
    data: &AnalysisData, // Crucial for cell occupancy and factor level details
    swept_info: &Option<SweptMatrixInfo>
) -> Result<DMatrix<f64>, String> {
    // TODO: Implement Type IV L-matrix construction logic based on documentation.
    // 1. Start with an L-matrix similar to Type III (e.g., L_initial from Type III steps).
    // 2. If no effects "contain" term_of_interest, Type IV L is similar to Type III L.
    // 3. Otherwise, adjust coefficients in L_initial based on cell means / estimability rules:
    //    For each row in L_initial (representing a contrast for term_of_interest):
    //    a. If L_row[k_F] (coefficient for a parameter of F at level f_i) is 0,
    //       then for any parameter beta_m of an effect E_m that CONTAINS F and involves f_i,
    //       set L_row[m] = 0.
    //    b. If L_row[k_F] (for level f_i of F) is non-zero:
    //       Count N(f_i): number of times f_i occurs with common levels of other effects
    //       involved in interactions that contain F (requires checking data for occupied cells).
    //       For any parameter beta_m of an effect E_m that CONTAINS F and involves f_i,
    //       set L_row[m] = L_row[k_F] / N(f_i) (if N(f_i) > 0).
    //    c. If N(f_i) is 0 or makes a coefficient undefined, set L_row[m] = 0.
    // 4. Resulting L is the Type IV L matrix.

    // Fallback to current simple L matrix for now.
    // This should be replaced with the full Type IV logic.
    let (term_start_col, term_end_col) = design_info.term_column_indices
        .get(term_of_interest)
        .ok_or_else(||
            format!("Term '{}' not found in design matrix column map for Type IV L.", term_of_interest)
        )?;

    let num_cols_for_term = term_end_col - term_start_col + 1;
    if num_cols_for_term == 0 {
        return Ok(DMatrix::zeros(0, design_info.p_parameters));
    }

    let mut l_matrix = DMatrix::zeros(num_cols_for_term, design_info.p_parameters);
    for i in 0..num_cols_for_term {
        if term_start_col + i < design_info.p_parameters {
            l_matrix[(i, term_start_col + i)] = 1.0;
        }
    }
    Ok(l_matrix)
    //Err(format!("construct_type_iv_l_matrix for term '{}' not yet implemented.", term_of_interest))
}

/// Helper to identify column indices for X1, X2, X3 for Type II SS L-matrix construction.
/// X1: Columns for effects not containing F (term_of_interest).
/// X2: Columns for F itself.
/// X3: Columns for effects that contain F (and are not F itself).
fn partition_column_indices_for_type_ii(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String] // Sorted list of all terms in the model
    // config: &UnivariateConfig // Might be needed for intercept handling or term parsing details
) -> Result<(Vec<usize>, Vec<usize>, Vec<usize>), String> {
    let mut x1_indices = Vec::new();
    let mut x2_indices = Vec::new();
    let mut x3_indices = Vec::new();

    let factors_in_f_set: std::collections::HashSet<_> = super::factor_utils
        ::parse_interaction_term(term_of_interest)
        .into_iter()
        .collect();

    // X2: Columns for the term_of_interest (F)
    if let Some((start, end)) = design_info.term_column_indices.get(term_of_interest) {
        for i in *start..=*end {
            x2_indices.push(i);
        }
    } else {
        return Err(
            format!("Term of interest '{}' not found in design_info.term_column_indices.", term_of_interest)
        );
    }

    for other_term_name in all_model_terms {
        if other_term_name == term_of_interest {
            continue; // Skip F itself, already handled for X2
        }
        if other_term_name == "Intercept" {
            // Handle intercept specifically later
            continue;
        }

        if let Some((start_j, end_j)) = design_info.term_column_indices.get(other_term_name) {
            let factors_in_j_set: std::collections::HashSet<_> = super::factor_utils
                ::parse_interaction_term(other_term_name)
                .into_iter()
                .collect();

            let j_contains_f = factors_in_f_set.is_subset(&factors_in_j_set);
            let f_contains_j = factors_in_j_set.is_subset(&factors_in_f_set); // F proper subset of J implies J is higher order

            for i_col in *start_j..=*end_j {
                if j_contains_f {
                    // This term J contains F.
                    // If J is higher order than F (i.e. F is a PROPER subset of J), then J belongs to X3.
                    // If J is F itself, it's X2 (already handled).
                    // This implies factors_in_j_set.len() > factors_in_f_set.len() for X3.
                    if factors_in_j_set.len() > factors_in_f_set.len() {
                        if !x3_indices.contains(&i_col) {
                            x3_indices.push(i_col);
                        }
                    }
                    // If factors_in_j_set.len() == factors_in_f_set.len(), it means J is F, already handled.
                } else if f_contains_j {
                    // F contains J (e.g. F = A*B, J = A). J belongs to X1.
                    // (An effect F contains J if J is one of the main effects that make up F, or a lower-order interaction)
                    if !x1_indices.contains(&i_col) {
                        x1_indices.push(i_col);
                    }
                } else {
                    // J does not contain F, and F does not contain J.
                    // This means J is unrelated in hierarchy or parallel. Belongs to X1.
                    // (e.g., F=A*B, J=C*D or J=A*C)
                    // More precise: J does not contain F as a sub-effect.
                    // Per SAS docs: "X1 consists of columns of X associated with effects that do not contain F"
                    // So, if factors_in_f_set.is_disjoint(&factors_in_j_set) OR J is lower order than F and not part of F.
                    // The condition for X1 is simply that J does not contain F.
                    if !x1_indices.contains(&i_col) {
                        x1_indices.push(i_col);
                    }
                }
            }
        }
    }

    // Handle intercept: belongs to X1 if it's in the model and not F itself.
    if design_info.intercept_column.is_some() && term_of_interest != "Intercept" {
        if let Some(intercept_idx) = design_info.intercept_column {
            // Ensure intercept isn't already somehow in X2 or X3 (shouldn't be if logic above is right)
            if !x2_indices.contains(&intercept_idx) && !x3_indices.contains(&intercept_idx) {
                if !x1_indices.contains(&intercept_idx) {
                    x1_indices.push(intercept_idx);
                }
            }
        }
    }

    // Sort indices to ensure DMatrix::select_columns works as expected and for consistency
    x1_indices.sort_unstable();
    x2_indices.sort_unstable(); // Should already be sorted if from a single range
    x3_indices.sort_unstable();

    // Deduplicate, as a column might be pushed from different logic paths if not careful
    x1_indices.dedup();
    x3_indices.dedup();

    Ok((x1_indices, x2_indices, x3_indices))
}
