use std::collections::HashMap;

use crate::univariate::models::data::{ AnalysisData, DataRecord, DataValue };
use super::core::*;
use crate::univariate::models::config::UnivariateConfig;
use super::common; // For get_factor_levels, get_covariate_values, data_value_to_string, count_total_cases, map_factors_to_datasets, get_record_factor_value_string
use super::matrix_utils; // For to_dmatrix, to_dvector, matrix_transpose, extract_column, add_column_to_matrix
use nalgebra::{ DMatrix, DVector };

/// Generic helper to populate rows of a design matrix.
fn populate_design_matrix_rows<F>(
    data: &AnalysisData,
    n_total: usize,
    num_cols_for_term: usize,
    // factor_sources_map is not always needed directly by the filler if all info is captured or passed differently
    // For now, let's assume the filler might need it, or we can refine later.
    mut row_filler: F
) -> Result<Vec<Vec<f64>>, String>
    where
        F: FnMut(
            usize, // dep_set_idx
            usize, // rec_idx_in_set
            &mut Vec<f64> // current_row_values to be filled (should have num_cols_for_term elements)
        ) -> Result<(), String>
{
    if n_total == 0 {
        // No data, return an empty matrix (0x0 or 0xN_cols if num_cols_for_term > 0, but Vec::new() is fine for 0 rows)
        return Ok(Vec::new());
    }
    if num_cols_for_term == 0 {
        // N x 0 matrix: a vector of n_total empty vectors
        return Ok(vec![Vec::new(); n_total]);
    }

    let mut x_matrix = vec![vec![0.0; num_cols_for_term]; n_total];
    let mut row_idx = 0;

    for (dep_set_idx, dep_record_set) in data.dependent_data.iter().enumerate() {
        for (rec_idx_in_set, _dep_record) in dep_record_set.iter().enumerate() {
            if row_idx >= n_total {
                break; // Should not happen if n_total is correct count from dependent_data
            }

            row_filler(dep_set_idx, rec_idx_in_set, &mut x_matrix[row_idx])?;

            row_idx += 1;
        }
        if row_idx >= n_total {
            break;
        }
    }
    // Ensure matrix is fully populated if n_total was larger than actual iterated items
    // This should ideally not occur if n_total = count_total_cases(data)
    // If row_idx < n_total, the remaining rows in x_matrix will keep their initial 0.0 values.
    Ok(x_matrix)
}

/// Parse interaction term (e.g., "A*B") into a vector of factor names
/// Handles both interaction terms (A*B) and nesting terms (A(B) or A WITHIN B)
pub fn parse_interaction_term(interaction_term: &str) -> Vec<String> {
    // Handle nesting format "A WITHIN B"
    if interaction_term.contains("WITHIN") {
        let parts: Vec<&str> = interaction_term.split("WITHIN").collect();
        if parts.len() == 2 {
            return vec![parts[0].trim().to_string(), parts[1].trim().to_string()];
        }
    }

    // Handle nesting format "A(B)"
    if interaction_term.contains('(') && interaction_term.contains(')') {
        let mut factors = Vec::new();
        let mut current_term = interaction_term;

        while let Some(open_paren) = current_term.find('(') {
            // Extract the outer factor (before the parenthesis)
            let outer_factor = current_term[..open_paren].trim();
            if !outer_factor.is_empty() {
                factors.push(outer_factor.to_string());
            }

            // Check for matching closing parenthesis
            if let Some(close_paren) = find_matching_parenthesis(current_term, open_paren) {
                // Extract the inner term
                let inner_term = current_term[open_paren + 1..close_paren].trim();

                // Move to process the inner term
                current_term = inner_term;
            } else {
                // No matching parenthesis, stop processing
                break;
            }
        }

        // Add the innermost term if there is one
        if !current_term.is_empty() && !current_term.contains('(') && !current_term.contains(')') {
            factors.push(current_term.trim().to_string());
        }

        if !factors.is_empty() {
            return factors;
        }
    }

    // Default: standard interaction with "*"
    interaction_term
        .split('*')
        .map(|s| s.trim().to_string())
        .collect()
}

/// Helper function to find the matching closing parenthesis
pub fn find_matching_parenthesis(text: &str, open_pos: usize) -> Option<usize> {
    let chars: Vec<char> = text.chars().collect();
    let mut depth = 0;

    for i in open_pos..chars.len() {
        match chars[i] {
            '(' => {
                depth += 1;
            }
            ')' => {
                depth -= 1;
                if depth == 0 {
                    return Some(i);
                }
            }
            _ => {}
        }
    }

    None
}

/// Get values adjusted for previous factors (for Type I SS)
pub fn get_level_values_adjusted(
    residual_values: &[f64],
    data: &AnalysisData,
    factor: &str,
    level: &str,
    _dep_var_name: &str
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
                        let current_level = common::data_value_to_string(value);
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
pub fn generate_lower_order_terms(
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
pub fn generate_level_combinations(
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

/// Get degrees of freedom for a model term (factor, covariate, or interaction)
pub fn get_df_for_term(
    data: &AnalysisData,
    config: &UnivariateConfig,
    term_name: &str
) -> Result<usize, String> {
    if term_name == "Intercept" {
        return Ok(if config.model.intercept { 1 } else { 0 });
    }
    if config.main.covar.as_ref().map_or(false, |c| c.contains(&term_name.to_string())) {
        return Ok(1); // Covariates always have 1 df
    }
    if term_name.contains('*') {
        calculate_interaction_df(data, term_name)
    } else {
        // Main effect factor
        if
            !data.fix_factor_data_defs
                .iter()
                .any(|defs| defs.iter().any(|def| def.name == term_name)) &&
            !data.random_factor_data_defs
                .as_ref()
                .map_or(false, |r_defs|
                    r_defs.iter().any(|defs| defs.iter().any(|def| def.name == term_name))
                )
        {
            // If factor definition not found, it might be an issue or imply 0 DF if not in model explicitly.
            // However, generate_model_design_terms should only include valid terms.
            // For safety, if it somehow gets here with an unknown factor, treat as 0 df for now.
            return Ok(0);
        }
        let levels = common::get_factor_levels(data, term_name)?;
        if levels.len() > 1 {
            Ok(levels.len() - 1)
        } else {
            Ok(0) // Factor with one level has 0 df
        }
    }
}

/// Calculate degrees of freedom for an interaction term
pub fn calculate_interaction_df(
    data: &AnalysisData,
    interaction_term: &str
) -> Result<usize, String> {
    let factors_in_interaction = parse_interaction_term(interaction_term);
    if factors_in_interaction.is_empty() {
        return Ok(0);
    }

    let mut df_product = 1;
    for factor_name in &factors_in_interaction {
        // Check if this "factor" in the interaction is actually a covariate
        if
            data.covariate_data_defs
                .as_ref()
                .map_or(false, |defs_vec|
                    defs_vec.iter().any(|defs| defs.iter().any(|d| d.name == *factor_name))
                )
        {
            // If a covariate is part of an "interaction" term string, its df contribution is effectively 1 (as if it were a factor with 2 levels for df calculation purposes in product rule)
            // This scenario (covariate in interaction string like "FactorA*CovariateB") is complex and typically handled by forming product terms in the design matrix.
            // For df calculation, if it appears here, we might assume it contributes 1 to the product rule, or the design matrix construction handles it.
            // Let's assume for now it means (levels-1) which for a continuous variable is not well-defined in this simple product.
            // It's safer to say interactions should only be between categorical factors for this simple df_product rule.
            // If a covariate is named in an interaction term, it implies a product column whose df is determined by the df of the other factor(s).
            // For now, let's rely on the categorical factor interpretation. If `factor_name` is a known covariate, this rule is misapplied.
            // This function should primarily be for factor*factor interactions.
            // Let's be strict: if not a known fixed factor, it can't contribute to interaction DF this way.
            if
                !data.fix_factor_data_defs
                    .iter()
                    .any(|defs| defs.iter().any(|def| def.name == *factor_name)) &&
                !data.random_factor_data_defs
                    .as_ref()
                    .map_or(false, |r_defs|
                        r_defs.iter().any(|defs| defs.iter().any(|def| def.name == *factor_name))
                    )
            {
                return Err(
                    format!(
                        "Term '{}' in interaction '{}' is not a defined fixed or random factor.",
                        factor_name,
                        interaction_term
                    )
                );
            }
        }

        let levels = common::get_factor_levels(data, factor_name)?;
        if levels.len() <= 1 {
            return Ok(0); // Interaction df is 0 if any constituent factor has < 2 levels
        }
        df_product *= levels.len() - 1;
    }
    Ok(df_product)
}

/// Calculate degrees of freedom for an interaction term for Type IV SS
/// This might involve checking for non-estimable parameters due to empty cells.
pub fn calculate_interaction_df_type_iv(
    data: &AnalysisData,
    interaction_term: &str
) -> Result<usize, String> {
    // For Type IV, the DF of an interaction is often the same as Type III (product rule)
    // unless there are empty cells that make some contrasts non-estimable.
    // A full check involves forming the contrast matrix L for the interaction and checking its rank.
    // For simplicity, if check_for_missing_cells_in_interaction is true, it might be less.
    // However, sum_of_squares.rs's calculate_type_iii_iv_ss_for_term uses the L matrix approach for SS,
    // and its rank implicitly determines the actual DF for the SS calculation.
    // The most robust way would be to get the L matrix for this term and find its rank.
    // As a placeholder, returning the same as calculate_interaction_df.
    // The true Type IV DF is implicitly handled by the SS calculation's L matrix rank in sum_of_squares.
    // This function, if called explicitly for DF, should ideally reflect that.

    // TODO: Implement a more accurate Type IV DF calculation if needed, possibly by
    // constructing the relevant part of the design matrix and finding its rank.
    // For now, using the standard interaction DF calculation as a baseline.
    calculate_interaction_df(data, interaction_term)
}

/// Get design matrix columns for a specific term, possibly considering preceding terms (for Type I)
pub fn get_design_matrix_cols_for_term(
    data: &AnalysisData,
    config: &UnivariateConfig,
    term_name: &str,
    _all_y_values_for_analysis: &[f64], // May be needed if term generation depends on Y (e.g. centering)
    _preceding_terms: &[String] // For Type I, to build matrix relative to already accounted for terms
    // For other types, this might be ignored or used to get X_full vs X_reduced context
) -> Result<Vec<Vec<f64>>, String> {
    // This function needs to create the design matrix columns for `term_name`.
    // For Type I, it might need to be orthogonalized wrt `preceding_terms` or residuals used.
    // For now, let's return the basic design matrix for the term.
    // The `calculate_type_i_ss` in `sum_of_squares.rs` now takes residuals directly.
    // So, this function should just return the X matrix for the current term.

    let design_cols_vecs = if term_name == "Intercept" {
        let n_obs = common
            ::get_all_dependent_values(
                data,
                config.main.dep_var.as_ref().ok_or("Dep var missing")?
            )?
            .len();
        if n_obs == 0 {
            return Ok(vec![]);
        }
        vec![vec![1.0; n_obs]] // Column of ones for intercept
    } else if config.main.covar.as_ref().map_or(false, |c| c.contains(&term_name.to_string())) {
        // Covariate
        let cov_values = common::get_covariate_values(data, term_name)?;
        // Each covariate is a single column. to_dmatrix expects Vec<Vec<f64>> (rows of columns)
        // but design_matrix functions return Vec<Vec<f64>> where inner Vec is a row.
        // Let's return it as a single column wrapped in a Vec, consistent with how matrix_utils::transpose might expect it if it were columns.
        // Or, more simply, a matrix with one column.
        // The design_matrix module functions return Vec<Vec<f64>> where it's [obs x features_for_term].
        // So if a covariate is one feature, it's [obs x 1].
        // Let's make this function return Vec<Vec<f64>> [num_observations x num_cols_for_this_term]
        let n_obs = common
            ::get_all_dependent_values(
                data,
                config.main.dep_var.as_ref().ok_or("Dep var missing")?
            )?
            .len();
        if cov_values.len() != n_obs && n_obs > 0 {
            return Err(
                format!("Covariate '{}' length mismatch during design matrix column retrieval.", term_name)
            );
        }
        let mut single_col_matrix = Vec::with_capacity(n_obs);
        for val in cov_values {
            single_col_matrix.push(vec![val]);
        }
        single_col_matrix
    } else if term_name.contains('*') {
        create_interaction_design_matrix(data, config, term_name)?
    } else {
        create_main_effect_design_matrix(data, term_name)?
    };

    // The design_matrix functions are expected to return Vec<Vec<f64>> where each inner vec is a ROW of the design matrix for that term.
    // If this function is to return "columns", we need to transpose the result from design_matrix functions.
    // Let's clarify the expected output: `matrix_utils::matrix_transpose` takes `&[Vec<f64>]` where inner is row.
    // The call in `between_subjects_effects` `process_type_i` does `matrix_utils::matrix_transpose(&x_term_cols)`
    // implying `x_term_cols` should be columns.
    // However, `sum_of_squares` `calculate_type_i_ss` calls `to_dmatrix` on the output of design_matrix functions, and `to_dmatrix` expects rows.

    // Let's assume this function should return design matrix columns for the term as Vec<Vec<f64>> (list of columns).
    // The design_matrix::create_* functions return Vec<Vec<f64>> [obs x features_for_term]. This is already "column-major like" if you consider each inner vec a column of one feature across obs.
    // No, that's wrong. Standard representation Vec<Vec<f64>> is Vec of rows.
    // So, if design_matrix::create_* functions return [obs x features] (list of rows),
    // and this function needs to return list of columns, then transpose is needed.

    // If `design_cols_vecs` from design_matrix module is [obs x features_for_term] (list of rows),
    // and `x_term_cols` in `between_subjects_effects` needs to be a list of columns,
    // then we should transpose here.
    // Let's assume the design_matrix functions return standard row-major Vec<Vec<f64>>.
    // So, `design_cols_vecs` is `X_term` (observations as rows, features/columns of the term as columns).
    // If `get_design_matrix_cols_for_term` is to return *columns*, then it should transpose.
    if design_cols_vecs.is_empty() {
        return Ok(vec![]);
    }
    Ok(matrix_utils::matrix_transpose(&design_cols_vecs))
}

/// Regress Y values against X (design matrix columns) and return new residuals
/// Y_new = Y - X * beta_hat = Y - X * (X'X)^-1 * X'Y
pub fn regress_out_term_from_design_cols(
    y_values: &[f64],
    x_term_matrix_cols_transposed: &[Vec<f64>] // Should be X_term' (term features as rows, obs as columns)
) -> Result<(Vec<f64>, Vec<f64>), String> {
    // Returns (beta_hat, residuals)
    if y_values.is_empty() {
        return Ok((vec![], vec![]));
    }
    if x_term_matrix_cols_transposed.is_empty() || x_term_matrix_cols_transposed[0].is_empty() {
        // If X is empty, no regression happens, residuals are original Y
        return Ok((vec![], y_values.to_vec()));
    }

    // x_term_matrix_cols_transposed is X' (term_features x n_obs)
    // We need X (n_obs x term_features) for the formula P = X(X'X)^-1 X'
    // So, X = (X')'
    let x_term_nalgebra = matrix_utils::to_dmatrix(
        &matrix_utils::matrix_transpose(x_term_matrix_cols_transposed)
    )?;
    let y_nalgebra = matrix_utils::to_dvector(y_values);

    if x_term_nalgebra.nrows() != y_nalgebra.len() {
        return Err(
            format!(
                "Mismatch in rows for X ({}) and Y ({}) in regress_out_term_from_design_cols",
                x_term_nalgebra.nrows(),
                y_nalgebra.len()
            )
        );
    }

    let xt = x_term_nalgebra.transpose();
    let xtx = &xt * &x_term_nalgebra;

    let xtx_inv = xtx
        .try_inverse()
        .ok_or_else(|| "X'X inversion failed in regress_out_term".to_string())?;
    let beta_hat_nalgebra = &xtx_inv * (&xt * &y_nalgebra);

    let y_predicted_nalgebra = &x_term_nalgebra * &beta_hat_nalgebra;
    let residuals_nalgebra = y_nalgebra - y_predicted_nalgebra;

    Ok((matrix_utils::to_vec(&beta_hat_nalgebra), matrix_utils::to_vec(&residuals_nalgebra)))
}

/// Generate all possible interaction terms from a list of factors
pub fn generate_interaction_terms(factors: &[String]) -> Vec<String> {
    if factors.is_empty() {
        return Vec::new();
    }

    let mut interactions = Vec::new();

    // Generate all possible combinations of factors from size 2 to size N
    for size in 2..=factors.len() {
        // Assuming generate_lower_order_terms is in the same module (factor_utils)
        generate_lower_order_terms(factors, size, &mut Vec::new(), 0, &mut interactions);
    }

    interactions
}

/// Generate model design terms based on the configuration
pub fn generate_model_design_terms(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<Vec<String>, String> {
    let mut terms = Vec::new();

    if config.model.intercept {
        terms.push("Intercept".to_string());
    }

    if config.model.non_cust {
        generate_non_cust_terms(data, config, &mut terms)?;
    } else if config.model.custom {
        generate_custom_terms(data, config, &mut terms)?;
    } else if config.model.build_custom_term {
        // If TermText is provided, parse it directly as the model formula
        if let Some(term_formula) = &config.model.term_text {
            if !term_formula.trim().is_empty() {
                // Simple split by space for now, can be enhanced for proper parsing
                terms.extend(term_formula.split_whitespace().map(String::from));
            } else {
                // TermText is empty, fall back to FactorsModel if available
                generate_build_custom_terms_from_factors_model(config, &mut terms);
            }
        } else {
            // TermText not provided, use FactorsModel
            generate_build_custom_terms_from_factors_model(config, &mut terms);
        }
    }

    let non_intercept_terms_present = terms.iter().any(|t| t != "Intercept");

    if
        !non_intercept_terms_present &&
        !config.model.non_cust &&
        !config.model.custom &&
        !config.model.build_custom_term
    {
        if let Some(fix_factors) = &config.main.fix_factor {
            for factor in fix_factors {
                if !terms.contains(factor) {
                    terms.push(factor.clone());
                }
            }
        }
        if let Some(random_factors) = &config.main.rand_factor {
            for factor in random_factors {
                if !terms.contains(factor) {
                    terms.push(factor.clone());
                }
            }
        }
        if let Some(covariates) = &config.main.covar {
            for covar in covariates {
                if !terms.contains(covar) {
                    terms.push(covar.clone());
                }
            }
        }
    }
    if config.model.intercept {
        terms.retain(|x| x != "Intercept");
        terms.insert(0, "Intercept".to_string());
    }

    Ok(terms)
}

fn generate_non_cust_terms(
    _data: &AnalysisData, // data might be needed if generate_interaction_terms needs it
    config: &UnivariateConfig,
    terms: &mut Vec<String>
) -> Result<(), String> {
    let mut factors_for_interaction = Vec::new();

    if let Some(fix_factors) = &config.main.fix_factor {
        for factor_name in fix_factors {
            if !terms.contains(factor_name) {
                terms.push(factor_name.clone());
            }
            factors_for_interaction.push(factor_name.clone());
        }
    }
    if let Some(random_factors) = &config.main.rand_factor {
        for factor_name in random_factors {
            if !terms.contains(factor_name) {
                terms.push(factor_name.clone());
            }
            factors_for_interaction.push(factor_name.clone());
        }
    }

    // Add covariates as main effects only
    if let Some(covariates) = &config.main.covar {
        for covar_name in covariates {
            if !terms.contains(covar_name) {
                terms.push(covar_name.clone());
            }
        }
    }

    // Add all possible interaction terms among fixed and random factors only
    if factors_for_interaction.len() > 1 {
        terms.extend(generate_interaction_terms(&factors_for_interaction));
    }

    Ok(())
}

fn generate_custom_terms(
    _data: &AnalysisData, // Potentially needed by generate_interaction_terms
    config: &UnivariateConfig,
    terms: &mut Vec<String>
) -> Result<(), String> {
    // Add main effects from factors_model. These are candidates for interactions.
    if let Some(factors_model) = &config.model.factors_model {
        for factor_name in factors_model {
            if !terms.contains(factor_name) {
                terms.push(factor_name.clone());
            }
        }

        // Generate interactions based on build_term_method using ONLY factors_model components
        match config.model.build_term_method {
            crate::univariate::models::config::BuildTermMethod::MainEffects => {
                // Main effects from factors_model already added above.
            }
            crate::univariate::models::config::BuildTermMethod::Interaction => {
                if factors_model.len() > 1 {
                    terms.extend(generate_interaction_terms(factors_model));
                }
            }
            crate::univariate::models::config::BuildTermMethod::All2Way => {
                if factors_model.len() > 1 {
                    add_n_way_interactions(factors_model, 2, terms);
                }
            }
            crate::univariate::models::config::BuildTermMethod::All3Way => {
                if factors_model.len() > 1 {
                    add_n_way_interactions(factors_model, 2, terms); // Assuming N-way includes lower ways or they are added separately
                }
                if factors_model.len() > 2 {
                    add_n_way_interactions(factors_model, 3, terms);
                }
            }
            crate::univariate::models::config::BuildTermMethod::All4Way => {
                if factors_model.len() > 1 {
                    add_n_way_interactions(factors_model, 2, terms);
                }
                if factors_model.len() > 2 {
                    add_n_way_interactions(factors_model, 3, terms);
                }
                if factors_model.len() > 3 {
                    add_n_way_interactions(factors_model, 4, terms);
                }
            }
            crate::univariate::models::config::BuildTermMethod::All5Way => {
                if factors_model.len() > 1 {
                    add_n_way_interactions(factors_model, 2, terms);
                }
                if factors_model.len() > 2 {
                    add_n_way_interactions(factors_model, 3, terms);
                }
                if factors_model.len() > 3 {
                    add_n_way_interactions(factors_model, 4, terms);
                }
                if factors_model.len() > 4 {
                    add_n_way_interactions(factors_model, 5, terms);
                }
            }
        }
    }

    // Add covariates from cov_model as main effects only
    if let Some(cov_model_str) = &config.model.cov_model {
        for term_name in cov_model_str.split_whitespace() {
            if !terms.contains(&term_name.to_string()) {
                terms.push(term_name.to_string());
            }
        }
    }
    Ok(())
}

fn add_main_effects(factors_model: &[String], terms: &mut Vec<String>) {
    for factor in factors_model {
        terms.push(factor.clone());
    }
}

fn add_n_way_interactions(factors_model: &[String], n: usize, terms: &mut Vec<String>) {
    if factors_model.len() < n || n < 2 {
        return;
    } // n must be at least 2

    let mut current_interaction = Vec::with_capacity(n);
    generate_specific_n_way_interactions_recursive(
        factors_model,
        n,
        0,
        &mut current_interaction,
        terms
    );
}

fn generate_specific_n_way_interactions_recursive(
    factors: &[String],
    n_way: usize,
    start_index: usize,
    current_interaction: &mut Vec<String>,
    all_terms: &mut Vec<String>
) {
    if current_interaction.len() == n_way {
        all_terms.push(current_interaction.join("*"));
        return;
    }

    if start_index >= factors.len() {
        return;
    }

    // Include current factor
    current_interaction.push(factors[start_index].clone());
    generate_specific_n_way_interactions_recursive(
        factors,
        n_way,
        start_index + 1,
        current_interaction,
        all_terms
    );
    current_interaction.pop();

    // Exclude current factor (if enough remaining factors to form n-way interaction)
    if factors.len() - (start_index + 1) >= n_way - current_interaction.len() {
        generate_specific_n_way_interactions_recursive(
            factors,
            n_way,
            start_index + 1,
            current_interaction,
            all_terms
        );
    }
}

fn generate_build_custom_terms(config: &UnivariateConfig, terms: &mut Vec<String>) {
    // This function is now a wrapper or will be replaced by the logic above.
    // For now, let's assume it defaults to using factors_model if term_text is not used.
    if let Some(factors_model) = &config.model.factors_model {
        for term in factors_model {
            if !terms.contains(term) {
                // Ensure no duplicates if called after term_text parsing
                terms.push(term.clone());
            }
        }
    }
}

// Renamed original generate_build_custom_terms to avoid conflict
fn generate_build_custom_terms_from_factors_model(
    config: &UnivariateConfig,
    terms: &mut Vec<String>
) {
    if let Some(factors_model) = &config.model.factors_model {
        for term in factors_model {
            terms.push(term.clone());
        }
    }
}

/// Helper function to create design matrix for a main effect
pub fn create_main_effect_design_matrix(
    data: &AnalysisData,
    factor_name: &str
) -> Result<Vec<Vec<f64>>, String> {
    let n_total = common::count_total_cases(data);
    if n_total == 0 {
        return Ok(Vec::new());
    }

    let mut levels = common::get_factor_levels(data, factor_name)?;
    if levels.is_empty() {
        // Factor has no levels or doesn't exist, return N x 0 matrix
        return Ok(vec![Vec::new(); n_total]);
    }
    levels.sort(); // Ensure consistent order, last level will be reference

    let num_dummy_cols = if levels.len() > 1 { levels.len() - 1 } else { 0 };

    if num_dummy_cols == 0 {
        // If only one level, or no levels that lead to dummy variables (e.g. after k-1 logic)
        // This factor contributes no columns to the design matrix for its main effect in a k-1 scheme.
        // (Its effect is absorbed by the intercept if it's the only level present for all observations).
        // Return N x 0 matrix.
        return Ok(vec![Vec::new(); n_total]);
    }

    let mut design_matrix_rows: Vec<Vec<f64>> = vec![vec![0.0; num_dummy_cols]; n_total];
    let reference_level = levels.last().unwrap(); // Last sorted level is reference

    // Map factor name to its data source for efficient lookup
    let factor_sources_map = common::map_factors_to_datasets(data, &[factor_name.to_string()]);

    let mut current_row_idx = 0;
    for (dep_set_idx, dep_record_set) in data.dependent_data.iter().enumerate() {
        for (rec_idx_in_dep_set, _dep_record) in dep_record_set.iter().enumerate() {
            if current_row_idx >= n_total {
                break; // Should not happen
            }

            if
                let Some(record_level_str) = common::get_record_factor_value_string(
                    data,
                    &factor_sources_map,
                    factor_name,
                    dep_set_idx,
                    rec_idx_in_dep_set
                )
            {
                // Iterate through the levels that will form columns (all except reference)
                for k_col_idx in 0..num_dummy_cols {
                    let level_for_this_col = &levels[k_col_idx];
                    if record_level_str == *level_for_this_col {
                        design_matrix_rows[current_row_idx][k_col_idx] = 1.0;
                    } else {
                        // For standard dummy coding (0/1), if it's not this level, it's 0.
                        // The reference level implicitly has 0s in all these k-1 columns.
                        // No explicit -1 for reference level in these columns for this scheme.
                        design_matrix_rows[current_row_idx][k_col_idx] = 0.0;
                    }
                }
            } else {
                // Factor value not found for this record. Row will remain all zeros for this factor's columns.
                // This implies this observation will not contribute to differentiating these factor levels.
                // This might be fine if missing data handling means this row is effectively excluded later
                // or if 0 is the desired encoding for missing factor values in the model.
                // For now, they remain 0.0.
            }
            current_row_idx += 1;
        }
        if current_row_idx >= n_total {
            break;
        }
    }
    Ok(design_matrix_rows)
}

/// Helper function to create design matrix for an interaction term
pub fn create_interaction_design_matrix(
    data: &AnalysisData,
    config: &UnivariateConfig,
    interaction_term: &str
) -> Result<Vec<Vec<f64>>, String> {
    let factors_in_interaction = parse_interaction_term(interaction_term);
    if factors_in_interaction.is_empty() {
        let n_total = common::count_total_cases(data);
        return Ok(vec![Vec::new(); n_total]); // N x 0 matrix
    }

    let n_total = common::count_total_cases(data);
    if n_total == 0 {
        return Ok(Vec::new());
    }

    // Validate that no covariates are part of an interaction term string by this point
    for factor_name in &factors_in_interaction {
        if config.main.covar.as_ref().map_or(false, |c| c.contains(factor_name)) {
            return Err(
                format!(
                    "Error: Covariate '{}' found in interaction term '{}'. Covariates should only be main effects.",
                    factor_name,
                    interaction_term
                )
            );
        }
    }

    // Get dummy-coded columns for each factor in the interaction
    let mut factor_dummy_cols_map: HashMap<String, Vec<Vec<f64>>> = HashMap::new();
    let mut term_column_counts: Vec<usize> = Vec::new();

    for factor_name in &factors_in_interaction {
        let component_cols = create_main_effect_design_matrix(data, factor_name)?;

        if component_cols.is_empty() && n_total > 0 {
            // This factor has no levels or only one level, so it produces no dummy columns.
            return Ok(vec![Vec::new(); n_total]);
        }
        term_column_counts.push(component_cols[0].len());
        factor_dummy_cols_map.insert(factor_name.clone(), component_cols);
    }

    if term_column_counts.iter().any(|&count| count == 0) && !factors_in_interaction.is_empty() {
        // If any component has 0 columns (e.g., only one level), the interaction has 0 columns.
        return Ok(vec![Vec::new(); n_total]);
    }

    let total_interaction_cols = term_column_counts
        .iter()
        .filter(|&&c| c > 0)
        .product();
    if total_interaction_cols == 0 && !factors_in_interaction.is_empty() {
        return Ok(vec![Vec::new(); n_total]);
    }

    let mut final_interaction_matrix_rows: Vec<Vec<f64>> =
        vec![vec![0.0; total_interaction_cols]; n_total];

    // Helper to get column indices for each factor for a given interaction column
    let mut current_col_indices: Vec<usize> = vec![0; factors_in_interaction.len()];

    for final_col_idx in 0..total_interaction_cols {
        // Calculate the value for each row for this specific interaction column
        for row_idx in 0..n_total {
            let mut product_for_this_row_and_col = 1.0;
            let mut some_factor_contributed_zero = false;

            for (factor_idx, factor_name) in factors_in_interaction.iter().enumerate() {
                let factor_cols = factor_dummy_cols_map.get(factor_name).unwrap();
                let specific_dummy_col_idx_for_this_factor = current_col_indices[factor_idx];

                if factor_cols.is_empty() || factor_cols[row_idx].is_empty() {
                    // This can happen if a factor had 0 dummy columns initially
                    product_for_this_row_and_col = 0.0;
                    some_factor_contributed_zero = true;
                    break;
                }
                if specific_dummy_col_idx_for_this_factor >= factor_cols[row_idx].len() {
                    return Err(
                        format!(
                            "Internal error: Column index out of bounds for factor '{}' in interaction '{}' during product formation.",
                            factor_name,
                            interaction_term
                        )
                    );
                }

                product_for_this_row_and_col *=
                    factor_cols[row_idx][specific_dummy_col_idx_for_this_factor];
                if product_for_this_row_and_col == 0.0 {
                    some_factor_contributed_zero = true; // Optimization: if product is already zero, no need to multiply further for this row
                    break;
                }
            }
            final_interaction_matrix_rows[row_idx][final_col_idx] = if some_factor_contributed_zero {
                0.0
            } else {
                product_for_this_row_and_col
            };
        }

        // Increment current_col_indices for the next interaction column (like odometer)
        if total_interaction_cols > 0 {
            // only increment if there are columns to prevent panic on empty
            let mut factor_to_inc = factors_in_interaction.len() - 1;
            loop {
                current_col_indices[factor_to_inc] += 1;
                if
                    current_col_indices[factor_to_inc] < term_column_counts[factor_to_inc] ||
                    factor_to_inc == 0
                {
                    break;
                }
                current_col_indices[factor_to_inc] = 0;
                if factor_to_inc == 0 {
                    // Should not be reached if total_interaction_cols > 0 and logic is correct
                    break;
                }
                factor_to_inc -= 1;
            }
        }
    }

    Ok(final_interaction_matrix_rows)
}

/// Helper function to create contrast-coded design matrix for a main effect
pub fn create_contrast_coded_main_effect_matrix(
    data: &AnalysisData,
    factor: &str
) -> Result<Vec<Vec<f64>>, String> {
    let levels = common::get_factor_levels(data, factor)?;
    let n_total = common::count_total_cases(data);

    if n_total == 0 {
        return Ok(Vec::new());
    }

    let n_cols = if levels.is_empty() {
        0
    } else if levels.len() == 1 {
        // For contrast coding, a single level factor often means no columns or a column of 0s, depending on convention.
        // Or it could be treated as an intercept-like column if it's the only term.
        // Current logic implies 1 col for a single level (0 for empty). This might need review based on statistical package behavior.
        // For now, adhering to the n_cols calculation that was present.
        // If levels.len() == 1, n_cols was calculated as 1. This results in a column of 1.0 for that level.
        1
    } else {
        levels.len() - 1
    };

    if n_cols == 0 {
        return Ok(vec![Vec::new(); n_total]);
    }

    let factor_sources_map = common::map_factors_to_datasets(data, &[factor.to_string()]);
    // `levels` and `n_cols` need to be available in the closure
    // `levels` is Vec<String>, `n_cols` is usize. They can be moved or captured by reference.

    populate_design_matrix_rows(
        data,
        n_total,
        n_cols,
        move |dep_set_idx, rec_idx_in_set, current_row_values| {
            if
                let Some(level_str) = common::get_record_factor_value_string(
                    data,
                    &factor_sources_map,
                    factor,
                    dep_set_idx,
                    rec_idx_in_set
                )
            {
                if levels.len() > 1 {
                    let is_reference = levels
                        .last()
                        .map_or(false, |last_level| level_str == *last_level);
                    for (j, lvl) in levels.iter().enumerate() {
                        if j < n_cols {
                            // Iterate up to number of columns (0 to k-2 for k levels)
                            if j < current_row_values.len() {
                                // Bounds check
                                if *lvl == level_str {
                                    current_row_values[j] = 1.0;
                                } else if is_reference {
                                    current_row_values[j] = -1.0;
                                } else {
                                    current_row_values[j] = 0.0;
                                }
                            }
                        }
                    }
                } else if levels.len() == 1 {
                    if !current_row_values.is_empty() {
                        // Should have 1 column if n_cols = 1
                        current_row_values[0] = 1.0; // For a single-level factor, code as 1.0 in its column
                    }
                }
            }
            // If factor value not found, or levels.is_empty(), row remains 0.0s
            Ok(())
        }
    )
}

/// Helper function to create contrast-coded design matrix for an interaction
pub fn create_contrast_coded_interaction_matrix(
    data: &AnalysisData,
    interaction_term: &str
) -> Result<Vec<Vec<f64>>, String> {
    let term_factors = parse_interaction_term(interaction_term);
    if term_factors.is_empty() {
        let n_total = common::count_total_cases(data);
        return Ok(vec![Vec::new(); n_total]);
    }

    let mut factor_levels_map: HashMap<String, Vec<String>> = HashMap::new();
    for factor in &term_factors {
        let levels = common::get_factor_levels(data, factor)?;
        if levels.len() < 2 {
            let n_total = common::count_total_cases(data);
            return Ok(vec![Vec::new(); n_total]);
        }
        factor_levels_map.insert(factor.clone(), levels);
    }

    let factor_levels_for_combinations: Vec<(String, Vec<String>)> = term_factors
        .iter()
        .map(|f_name| (f_name.clone(), factor_levels_map.get(f_name).unwrap().clone()))
        .collect();

    let mut level_combinations = Vec::new(); // All combinations
    let mut current_combo_gen = HashMap::new();
    generate_level_combinations(
        &factor_levels_for_combinations,
        &mut current_combo_gen,
        0,
        &mut level_combinations
    );

    let valid_combinations: Vec<HashMap<String, String>> = level_combinations
        .into_iter()
        .filter(|combo| {
            !term_factors
                .iter()
                .any(|f_name| {
                    factor_levels_map
                        .get(f_name)
                        .map_or(true, |levels_for_factor| {
                            combo
                                .get(f_name)
                                .map_or(true, |level_in_combo| {
                                    level_in_combo == levels_for_factor.last().unwrap()
                                })
                        })
                })
        })
        .collect();

    let n_total = common::count_total_cases(data);
    if n_total == 0 {
        return Ok(Vec::new());
    }
    if valid_combinations.is_empty() {
        return Ok(vec![Vec::new(); n_total]);
    }
    let num_cols = valid_combinations.len();
    let factor_sources_map = common::map_factors_to_datasets(data, &term_factors);

    // valid_combinations, factor_sources_map, factor_levels_map, term_factors are captured.
    populate_design_matrix_rows(
        data,
        n_total,
        num_cols,
        move |dep_set_idx, rec_idx_in_set, current_row_values| {
            let mut current_record_factor_values = HashMap::new();
            for factor_name_in_term in &term_factors {
                if
                    let Some(val_str) = common::get_record_factor_value_string(
                        data,
                        &factor_sources_map,
                        factor_name_in_term,
                        dep_set_idx,
                        rec_idx_in_set
                    )
                {
                    current_record_factor_values.insert(factor_name_in_term.clone(), val_str);
                }
            }

            for (col_idx, valid_combo) in valid_combinations.iter().enumerate() {
                if col_idx < current_row_values.len() {
                    // Bounds check
                    let mut product_of_codes = 1.0;
                    let mut _matches_current_valid_combo_exactly = true; // Renamed as it was unused for assignment only

                    for (factor_in_combo, expected_level_in_combo) in valid_combo.iter() {
                        let actual_level_in_record_for_this_factor =
                            current_record_factor_values.get(factor_in_combo);
                        let all_levels_for_this_factor = factor_levels_map
                            .get(factor_in_combo)
                            .unwrap();
                        let reference_level_for_this_factor = all_levels_for_this_factor
                            .last()
                            .unwrap();

                        match actual_level_in_record_for_this_factor {
                            Some(actual_lvl_str) => {
                                if actual_lvl_str == expected_level_in_combo {
                                    // Code is 1
                                } else if actual_lvl_str == reference_level_for_this_factor {
                                    product_of_codes *= -1.0;
                                    _matches_current_valid_combo_exactly = false;
                                } else {
                                    product_of_codes = 0.0;
                                    _matches_current_valid_combo_exactly = false;
                                    break;
                                }
                            }
                            None => {
                                product_of_codes = 0.0;
                                _matches_current_valid_combo_exactly = false;
                                break;
                            }
                        }
                    }
                    current_row_values[col_idx] = product_of_codes;
                }
            }
            Ok(())
        }
    )
}

/// Create design matrix for Type IV sum of squares, which handles missing cells
pub fn create_type_iv_main_effect_matrix(
    data: &AnalysisData,
    factor: &str
) -> Result<Vec<Vec<f64>>, String> {
    let levels = common::get_factor_levels(data, factor)?;
    let n_total = common::count_total_cases(data);
    if n_total == 0 {
        return Ok(Vec::new());
    }
    let n_cols = if levels.len() > 1 {
        levels.len() - 1
    } else {
        if levels.is_empty() { 0 } else { 1 }
    };
    if n_cols == 0 {
        // Handles empty levels or single level resulting in 0 cols after k-1
        return Ok(vec![Vec::new(); n_total]);
    }
    let mut x_matrix = vec![vec![0.0; n_cols]; n_total];
    let mut level_counts = vec![0; levels.len()];

    let mut temp_row_idx_counter = 0;
    let factor_sources_map = common::map_factors_to_datasets(data, &[factor.to_string()]);
    for (dep_set_idx, dep_record_set) in data.dependent_data.iter().enumerate() {
        for (rec_idx_in_set, _dep_record) in dep_record_set.iter().enumerate() {
            if temp_row_idx_counter >= n_total {
                break;
            }
            if
                let Some(level_str) = common::get_record_factor_value_string(
                    data,
                    &factor_sources_map,
                    factor,
                    dep_set_idx,
                    rec_idx_in_set
                )
            {
                if let Some(idx) = levels.iter().position(|l| l == &level_str) {
                    level_counts[idx] += 1;
                }
            }
            temp_row_idx_counter += 1;
        }
        if temp_row_idx_counter >= n_total {
            break;
        }
    }

    let mut row_idx = 0;
    for (dep_set_idx, dep_record_set) in data.dependent_data.iter().enumerate() {
        for (rec_idx_in_set, _dep_record) in dep_record_set.iter().enumerate() {
            if row_idx >= n_total {
                break;
            }
            if
                let Some(level_str_pass2) = common::get_record_factor_value_string(
                    data,
                    &factor_sources_map,
                    factor,
                    dep_set_idx,
                    rec_idx_in_set
                )
            {
                if levels.len() > 1 {
                    let ref_level_str = levels.last().unwrap();
                    let is_reference = &level_str_pass2 == ref_level_str;
                    if
                        let Some(current_level_idx) = levels
                            .iter()
                            .position(|l| l == &level_str_pass2)
                    {
                        for j_col in 0..n_cols {
                            let level_for_this_col = &levels[j_col];
                            if level_str_pass2 == *level_for_this_col {
                                if level_counts[j_col] > 0 {
                                    x_matrix[row_idx][j_col] = 1.0 / (level_counts[j_col] as f64);
                                } else {
                                    x_matrix[row_idx][j_col] = 0.0;
                                }
                            } else if is_reference {
                                if level_counts[levels.len() - 1] > 0 {
                                    x_matrix[row_idx][j_col] =
                                        -1.0 / (level_counts[levels.len() - 1] as f64);
                                } else {
                                    x_matrix[row_idx][j_col] = 0.0;
                                }
                            } else {
                                x_matrix[row_idx][j_col] = 0.0;
                            }
                        }
                    }
                }
            }
            row_idx += 1;
        }
        if row_idx >= n_total {
            break;
        }
    }
    Ok(x_matrix)
}

/// Create a Type IV interaction design matrix that handles missing cells
pub fn create_type_iv_interaction_matrix(
    data: &AnalysisData,
    interaction_term: &str
) -> Result<Vec<Vec<f64>>, String> {
    let term_factors = parse_interaction_term(interaction_term);
    if term_factors.is_empty() {
        let n_total = common::count_total_cases(data);
        return Ok(vec![Vec::new(); n_total]); // N x 0 matrix
    }

    let mut factor_levels_list = Vec::new();
    for factor in &term_factors {
        let levels = common::get_factor_levels(data, factor)?;
        if levels.is_empty() {
            let n_total = common::count_total_cases(data);
            return Ok(vec![Vec::new(); n_total]);
        }
        factor_levels_list.push((factor.clone(), levels));
    }

    let mut all_possible_level_combinations = Vec::new();
    let mut current_combo_for_generation = HashMap::new();
    if !factor_levels_list.is_empty() {
        generate_level_combinations(
            &factor_levels_list,
            &mut current_combo_for_generation,
            0,
            &mut all_possible_level_combinations
        );
    }

    if all_possible_level_combinations.is_empty() {
        let n_total = common::count_total_cases(data);
        return Ok(vec![Vec::new(); n_total]);
    }

    let n_total_records = common::count_total_cases(data);
    if n_total_records == 0 {
        return Ok(Vec::new());
    }

    let mut record_factor_values_cache: Vec<HashMap<String, String>> = Vec::with_capacity(
        n_total_records
    );
    let factor_sources_map_for_cache = common::map_factors_to_datasets(data, &term_factors);
    let mut global_record_index_for_cache = 0;

    for (dep_set_idx, dep_record_set) in data.dependent_data.iter().enumerate() {
        for (rec_idx_in_set, _dep_record) in dep_record_set.iter().enumerate() {
            if global_record_index_for_cache >= n_total_records {
                break;
            }
            let mut current_record_map = HashMap::new();
            for factor_name in &term_factors {
                if
                    let Some(val_str) = common::get_record_factor_value_string(
                        data,
                        &factor_sources_map_for_cache,
                        factor_name,
                        dep_set_idx,
                        rec_idx_in_set
                    )
                {
                    current_record_map.insert(factor_name.clone(), val_str);
                }
            }
            record_factor_values_cache.push(current_record_map);
            global_record_index_for_cache += 1;
        }
        if global_record_index_for_cache >= n_total_records {
            break;
        }
    }

    let mut existing_combinations_with_counts: Vec<(HashMap<String, String>, usize)> = Vec::new();
    for combo_to_check in &all_possible_level_combinations {
        let mut count_for_this_combo = 0;
        for cached_record_factor_map in &record_factor_values_cache {
            let mut current_record_matches_combo = true;
            for (factor_in_combo, expected_level_in_combo) in combo_to_check {
                match cached_record_factor_map.get(factor_in_combo) {
                    Some(actual_level_in_record) if
                        actual_level_in_record == expected_level_in_combo
                    => {}
                    _ => {
                        current_record_matches_combo = false;
                        break;
                    }
                }
            }
            if current_record_matches_combo {
                count_for_this_combo += 1;
            }
        }
        if count_for_this_combo > 0 {
            existing_combinations_with_counts.push((combo_to_check.clone(), count_for_this_combo));
        }
    }

    let columns_for_x_matrix: Vec<HashMap<String, String>> = existing_combinations_with_counts
        .iter()
        .map(|(c, _)| c.clone())
        .collect();
    let counts_for_columns: Vec<usize> = existing_combinations_with_counts
        .iter()
        .map(|(_, n)| *n)
        .collect();

    let number_of_columns = columns_for_x_matrix.len();
    if number_of_columns == 0 {
        return Ok(vec![Vec::new(); n_total_records]);
    }

    let mut x_matrix = vec![vec![0.0; number_of_columns]; n_total_records];

    for (record_idx, cached_record_factor_map) in record_factor_values_cache.iter().enumerate() {
        if record_idx >= n_total_records {
            break;
        }
        for (col_idx, combination_for_this_column) in columns_for_x_matrix.iter().enumerate() {
            let mut record_matches_this_column_combination = true;
            for (
                factor_in_column_combo,
                expected_level_in_column_combo,
            ) in combination_for_this_column {
                match cached_record_factor_map.get(factor_in_column_combo) {
                    Some(actual_level_in_record) if
                        actual_level_in_record == expected_level_in_column_combo
                    => {}
                    _ => {
                        record_matches_this_column_combination = false;
                        break;
                    }
                }
            }

            if record_matches_this_column_combination {
                if counts_for_columns[col_idx] > 0 {
                    x_matrix[record_idx][col_idx] = 1.0 / (counts_for_columns[col_idx] as f64);
                } else {
                    x_matrix[record_idx][col_idx] = 0.0;
                }
            }
        }
    }
    Ok(x_matrix)
}

/// Helper function to create design matrix for nested terms (e.g., A(B) or A(B(C)))
pub fn create_nested_design_matrix(
    data: &AnalysisData,
    nested_term: &str
) -> Result<Vec<Vec<f64>>, String> {
    let mut hierarchy = Vec::new();
    let mut current_term_parser = nested_term.trim();

    if
        current_term_parser.is_empty() ||
        (!current_term_parser.contains('(') &&
            !current_term_parser.contains(')') &&
            current_term_parser.contains(char::is_whitespace))
    {
        let n_total = common::count_total_cases(data);
        return Ok(vec![Vec::new(); n_total]);
    }

    while let Some(open_paren) = current_term_parser.rfind('(') {
        let factor_before_paren = current_term_parser[..open_paren].trim();
        if let Some(matching_close) = find_matching_parenthesis(current_term_parser, open_paren) {
            if open_paren > 0 && !factor_before_paren.is_empty() {
                hierarchy.push(factor_before_paren.to_string());
            }
            current_term_parser = current_term_parser[open_paren + 1..matching_close].trim();
        } else {
            return Err(
                format!("Invalid nesting structure in term (mismatched parentheses): {}", nested_term)
            );
        }
    }
    if !current_term_parser.is_empty() {
        hierarchy.push(current_term_parser.to_string());
    }

    if hierarchy.is_empty() {
        let n_total = common::count_total_cases(data);
        return Ok(vec![Vec::new(); n_total]);
    }

    let n_total_records = common::count_total_cases(data);
    if n_total_records == 0 {
        return Ok(Vec::new());
    }

    let mut factor_name_to_levels_map: HashMap<String, Vec<String>> = HashMap::new();
    for factor_name in &hierarchy {
        let levels = common::get_factor_levels(data, factor_name)?;
        if levels.is_empty() {
            return Ok(vec![Vec::new(); n_total_records]);
        }
        factor_name_to_levels_map.insert(factor_name.clone(), levels);
    }

    let mut current_level_combinations: Vec<HashMap<String, String>> = Vec::new();
    if let Some(outermost_factor_name) = hierarchy.last() {
        if let Some(levels) = factor_name_to_levels_map.get(outermost_factor_name) {
            for level_val in levels {
                let mut combo = HashMap::new();
                combo.insert(outermost_factor_name.clone(), level_val.clone());
                current_level_combinations.push(combo);
            }
        }
    }

    for i in (0..hierarchy.len().saturating_sub(1)).rev() {
        let factor_name_at_this_level = &hierarchy[i];
        let levels_for_this_factor = factor_name_to_levels_map
            .get(factor_name_at_this_level)
            .unwrap();
        let mut next_stage_combinations = Vec::new();
        for existing_combo in &current_level_combinations {
            for level_val in levels_for_this_factor {
                let mut new_combo = existing_combo.clone();
                new_combo.insert(factor_name_at_this_level.clone(), level_val.clone());
                next_stage_combinations.push(new_combo);
            }
        }
        current_level_combinations = next_stage_combinations;
    }

    let final_unique_combinations = current_level_combinations;

    if final_unique_combinations.is_empty() {
        return Ok(vec![Vec::new(); n_total_records]);
    }

    let mut record_factor_values_cache: Vec<HashMap<String, String>> = Vec::with_capacity(
        n_total_records
    );
    let factor_sources_map_for_cache = common::map_factors_to_datasets(data, &hierarchy);
    let mut global_record_idx = 0;
    for (dep_set_idx, dep_record_set) in data.dependent_data.iter().enumerate() {
        for (rec_idx_in_set, _dep_record) in dep_record_set.iter().enumerate() {
            if global_record_idx >= n_total_records {
                break;
            }
            let mut current_record_map = HashMap::new();
            for factor_name in &hierarchy {
                if
                    let Some(val_str) = common::get_record_factor_value_string(
                        data,
                        &factor_sources_map_for_cache,
                        factor_name,
                        dep_set_idx,
                        rec_idx_in_set
                    )
                {
                    current_record_map.insert(factor_name.clone(), val_str);
                }
            }
            record_factor_values_cache.push(current_record_map);
            global_record_idx += 1;
        }
        if global_record_idx >= n_total_records {
            break;
        }
    }

    let mut x_matrix = vec![vec![0.0; final_unique_combinations.len()]; n_total_records];
    for (record_idx, cached_record_map) in record_factor_values_cache.iter().enumerate() {
        if record_idx >= n_total_records {
            break;
        }
        for (col_idx, combination_for_this_column) in final_unique_combinations.iter().enumerate() {
            let mut record_matches_this_column_combination = true;
            for (
                factor_in_column_combo,
                expected_level_in_column_combo,
            ) in combination_for_this_column {
                match cached_record_map.get(factor_in_column_combo) {
                    Some(actual_level_in_record) if
                        actual_level_in_record == expected_level_in_column_combo
                    => {}
                    _ => {
                        record_matches_this_column_combination = false;
                        break;
                    }
                }
            }

            if record_matches_this_column_combination {
                x_matrix[record_idx][col_idx] = 1.0;
            }
        }
    }
    Ok(x_matrix)
}
