use crate::univariate::models::{
    config::UnivariateConfig,
    data::{ AnalysisData, DataValue, DataRecord },
    result::{ BPTest, FTest, HeteroscedasticityTests, ModifiedBPTest, WhiteTest },
};
use nalgebra::{ DMatrix, DVector };
use std::collections::HashMap;
use std::collections::HashSet;

use super::core::*;

// Helper function for simple OLS: returns (R_squared, ESS, RSS, df_regressors, df_residuals)
fn run_simple_ols(
    y_vec: &DVector<f64>,
    x_matrix: &DMatrix<f64>,
    n_obs: usize
) -> Result<(f64, f64, f64, usize, usize), String> {
    if n_obs == 0 || x_matrix.nrows() != n_obs || y_vec.len() != n_obs {
        return Err("Observation count mismatch or zero observations in run_simple_ols".to_string());
    }
    if x_matrix.ncols() == 0 {
        return Err("No regressors in x_matrix for run_simple_ols".to_string());
    }

    let xtx = x_matrix.transpose() * x_matrix;
    let xtx_inv = match xtx.try_inverse() {
        Some(inv) => inv,
        None => {
            return Err(
                "Matrix inversion failed in run_simple_ols auxiliary regression".to_string()
            );
        }
    };
    let beta_aux = &xtx_inv * x_matrix.transpose() * y_vec;
    let y_hat_aux = x_matrix * beta_aux;
    let residuals_aux = y_vec - &y_hat_aux;

    let y_mean_aux = if n_obs > 0 { y_vec.mean() } else { 0.0 };

    let ess = y_hat_aux
        .iter()
        .map(|&yh| (yh - y_mean_aux).powi(2))
        .sum::<f64>();
    let rss = residuals_aux
        .iter()
        .map(|&e| e.powi(2))
        .sum::<f64>();
    let tss = y_vec
        .iter()
        .map(|&yi| (yi - y_mean_aux).powi(2))
        .sum::<f64>();

    let r_squared = if tss.abs() < 1e-9 { 0.0 } else { ess / tss };

    let df_regressors = x_matrix.ncols() - 1; // Number of slope regressors
    let df_residuals = n_obs - x_matrix.ncols();

    Ok((r_squared, ess, rss, df_regressors, df_residuals))
}

/// Calculate heteroscedasticity tests if requested
pub fn calculate_heteroscedasticity_tests(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HeteroscedasticityTests, String> {
    let dep_var_name = match &config.main.dep_var {
        Some(name) => name.clone(),
        None => {
            return Err("No dependent variable specified in configuration".to_string());
        }
    };

    // Extract data for analysis
    let mut y_values = Vec::new();
    let mut x_main_effects_rows = Vec::new(); // Rows for X matrix with main effects + intercept

    let mut actual_wls_weights = Vec::new();
    let wls_var_name_opt = config.main.wls_weight.as_ref();
    let mut use_extracted_weights = wls_var_name_opt.is_some();

    let mut base_predictor_names = Vec::new(); // Names of main effect predictors

    // Identify base predictors (main effects)
    if let Some(factors) = &config.main.fix_factor {
        base_predictor_names.extend(factors.clone());
    }
    if let Some(rand_factors) = &config.main.rand_factor {
        // Typically random factors aren't used as direct predictors in this way for het tests,
        // but following original structure for now.
        base_predictor_names.extend(rand_factors.clone());
    }
    if let Some(covariates) = &config.main.covar {
        base_predictor_names.extend(covariates.clone());
    }

    if base_predictor_names.is_empty() {
        return Err("No predictors specified for heteroscedasticity tests".to_string());
    }

    // Map predictor names to their actual data sources
    let factor_sources_map = map_factors_to_datasets(data, &base_predictor_names);

    // Create a map for quick lookup of base_predictor_names to their column index (0-based) in the main effects part
    let base_predictor_idx_map: HashMap<String, usize> = base_predictor_names
        .iter()
        .enumerate()
        .map(|(i, name)| (name.clone(), i))
        .collect();

    // Extract y values, build X matrix rows for main effects, and WLS weights
    for (dep_set_idx, dep_record_set) in data.dependent_data.iter().enumerate() {
        for (rec_idx_in_set, record) in dep_record_set.iter().enumerate() {
            if let Some(y_val) = extract_dependent_value(record, &dep_var_name) {
                y_values.push(y_val);

                // Create a row for X_main_effects matrix (intercept + main effects)
                let mut x_me_row = vec![1.0]; // Intercept
                for pred_name in &base_predictor_names {
                    let mut value = 0.0; // Default value for the predictor
                    if let Some((source_type, source_idx)) = factor_sources_map.get(pred_name) {
                        let factor_dataset_records_option: Option<&Vec<DataRecord>> = match
                            source_type.as_str()
                        {
                            "fixed" => data.fix_factor_data.get(*source_idx),
                            "random" =>
                                data.random_factor_data.as_ref().and_then(|d| d.get(*source_idx)),
                            "covariate" =>
                                data.covariate_data.as_ref().and_then(|d| d.get(*source_idx)),
                            _ => { None }
                        };

                        if let Some(factor_data_records) = factor_dataset_records_option {
                            if let Some(factor_record) = factor_data_records.get(rec_idx_in_set) {
                                if let Some(data_val) = factor_record.values.get(pred_name) {
                                    value = match data_val {
                                        DataValue::Number(n) => *n as f64,
                                        DataValue::NumberFloat(f) => *f,
                                        DataValue::Boolean(b) => if *b { 1.0 } else { 0.0 }
                                        _ => 0.0,
                                    };
                                }
                            }
                        }
                    }
                    x_me_row.push(value);
                }
                x_main_effects_rows.push(x_me_row);

                // Extract WLS weight (current logic seems fine)
                let mut weight_for_this_record = 1.0;
                if let Some(wls_var_name) = wls_var_name_opt {
                    if use_extracted_weights {
                        if let Some(wls_data_sets) = &data.wls_data {
                            if let Some(wls_record_set) = wls_data_sets.get(dep_set_idx) {
                                if let Some(wls_record) = wls_record_set.get(rec_idx_in_set) {
                                    if let Some(wls_data_val) = wls_record.values.get(wls_var_name) {
                                        if
                                            let Some(num_weight) =
                                                extract_numeric_value(wls_data_val)
                                        {
                                            if num_weight >= 0.0 {
                                                weight_for_this_record = num_weight;
                                            } else {
                                                weight_for_this_record = 1.0;
                                                use_extracted_weights = false;
                                            }
                                        } else {
                                            use_extracted_weights = false;
                                        }
                                    } else {
                                        use_extracted_weights = false;
                                    }
                                } else {
                                    use_extracted_weights = false;
                                }
                            } else {
                                use_extracted_weights = false;
                            }
                        } else {
                            use_extracted_weights = false;
                        }
                    }
                }
                actual_wls_weights.push(weight_for_this_record);
            }
        }
    }

    if y_values.is_empty() {
        return Err("No valid data points for heteroscedasticity tests".to_string());
    }
    let y_vec = DVector::from_vec(y_values.clone());
    let n_obs = y_values.len();

    // --- Build X_main_effects_only matrix (for White test Z construction) ---
    let nrows_x_me = x_main_effects_rows.len();
    let ncols_x_me = if nrows_x_me > 0 { x_main_effects_rows[0].len() } else { 0 };
    let mut x_me_data_flat = Vec::with_capacity(nrows_x_me * ncols_x_me);
    for row in &x_main_effects_rows {
        x_me_data_flat.extend_from_slice(row);
    }
    let x_main_effects_only = DMatrix::from_row_slice(nrows_x_me, ncols_x_me, &x_me_data_flat);
    // p_main_effects is number of columns in x_main_effects_only (intercept + main effects)
    let p_main_effects = x_main_effects_only.ncols();

    // --- Build X_full_design matrix (for main OLS: intercept + main effects + interactions) ---
    let interaction_term_names = generate_interaction_terms(&base_predictor_names);
    let mut x_full_design_rows = Vec::new();
    let mut x_full_design_col_names = vec!["Intercept".to_string()];
    x_full_design_col_names.extend(base_predictor_names.clone());
    x_full_design_col_names.extend(interaction_term_names.clone());

    for me_row in &x_main_effects_rows {
        // me_row is [1.0, val(P1), val(P2), ...]
        let mut full_row = me_row.clone();
        for interaction_str in &interaction_term_names {
            let constituent_predictor_names: Vec<&str> = interaction_str.split('*').collect();
            let mut interaction_value = 1.0;
            for &name_part in &constituent_predictor_names {
                if let Some(idx) = base_predictor_idx_map.get(name_part.trim()) {
                    // me_row[0] is intercept, me_row[idx+1] is value of predictor base_predictor_names[idx]
                    interaction_value *= me_row[*idx + 1];
                } else {
                    // This should not happen if generate_interaction_terms is correct
                    return Err(
                        format!(
                            "Predictor part '{}' not found in base_predictor_idx_map for interaction '{}'",
                            name_part,
                            interaction_str
                        )
                    );
                }
            }
            full_row.push(interaction_value);
        }
        x_full_design_rows.push(full_row);
    }

    let nrows_x_full = x_full_design_rows.len();
    let ncols_x_full = if nrows_x_full > 0 { x_full_design_rows[0].len() } else { 0 };
    let mut x_full_data_flat = Vec::with_capacity(nrows_x_full * ncols_x_full);
    for row in &x_full_design_rows {
        x_full_data_flat.extend_from_slice(row);
    }
    let x_full_design = DMatrix::from_row_slice(nrows_x_full, ncols_x_full, &x_full_data_flat);
    // p_full_model is number of columns in x_full_design
    // let p_full_model = x_full_design.ncols();

    // --- Perform main OLS using X_full_design ---
    let y_hat_full: DVector<f64>;
    let residuals_dvec_full: DVector<f64>;

    let xtx_full = &x_full_design.transpose() * &x_full_design;
    if let Some(xtx_inv_full) = xtx_full.clone().try_inverse() {
        let beta_full = &xtx_inv_full * &x_full_design.transpose() * &y_vec;
        y_hat_full = &x_full_design * &beta_full;
        residuals_dvec_full = &y_vec - &y_hat_full;
    } else {
        return Err("Matrix inversion failed for the main OLS model (xtx_full_design)".to_string());
    }

    // Determine effective weights to use
    let final_weights: Vec<f64> = if use_extracted_weights && actual_wls_weights.len() == n_obs {
        actual_wls_weights
    } else {
        vec![1.0; n_obs]
    };

    // Calculate u_i = w_i * epsilon_i^2 (dependent variable for auxiliary regressions)
    let u_values: Vec<f64> = residuals_dvec_full
        .iter()
        .zip(final_weights.iter())
        .map(|(&res, &w)| res.powi(2) * w)
        .collect();
    let aux_y_for_tests = DVector::from_vec(u_values.clone());

    // --- Generate design string for notes (based on full model) ---
    // Helper function to generate design string for notes
    let generate_full_design_string = |base_predictors: &[String]| -> String {
        let mut design_terms = vec!["Intercept".to_string()];
        design_terms.extend(base_predictors.to_vec());
        if base_predictors.len() >= 2 {
            let interactions = generate_interaction_terms(base_predictors); // This generates P1*P2, P1*P2*P3 etc.
            design_terms.extend(interactions);
        }
        design_terms.join(" + ")
    };
    let full_model_design_note_string = generate_full_design_string(&base_predictor_names);

    let mut test_results = HeteroscedasticityTests {
        breusch_pagan: None,
        white: None,
        modified_breusch_pagan: None,
        f_test: None,
    };

    // --- Breusch-Pagan test (Revised: regress u_i on intercept and y_hat_full) ---
    if config.options.brusch_pagan {
        // Auxiliary regressors: intercept and y_hat_full
        let mut x_aux_bp_data = Vec::with_capacity(n_obs * 2);
        for i in 0..n_obs {
            x_aux_bp_data.push(1.0); // Intercept
            x_aux_bp_data.push(y_hat_full[i]);
        }
        let x_aux_bp = DMatrix::from_row_slice(n_obs, 2, &x_aux_bp_data);

        match run_simple_ols(&aux_y_for_tests, &x_aux_bp, n_obs) {
            Ok((_r_squared_bp, ess_bp, _rss_bp, df_reg_bp, _df_res_bp)) => {
                let u_mean = aux_y_for_tests.mean();
                let bp_stat = if u_mean.abs() > 1e-12 {
                    // Avoid division by zero or very small numbers
                    ess_bp / (2.0 * u_mean.powi(2))
                } else {
                    0.0 // If mean of squared weighted residuals is zero, ESS_aux should also be zero.
                };
                // df_reg_bp from run_simple_ols is x_aux_bp.ncols() - 1, which is 1 for [intercept, y_hat]
                let df_bp = df_reg_bp;
                let p_value_bp = 1.0 - chi_square_cdf(bp_stat, df_bp as f64);

                let note_bp = vec![
                    format!("a. Dependent variable: {}", dep_var_name),
                    "b. Tests the null hypothesis that the variance of the errors does not depend on the values of the independent variables.".to_string(),
                    format!("c. Predicted values from design: {}", full_model_design_note_string)
                ];
                test_results.breusch_pagan = Some(BPTest {
                    statistic: bp_stat,
                    df: df_bp,
                    p_value: p_value_bp,
                    note: note_bp,
                });
            }
            Err(e) => {
                return Err(format!("Breusch-Pagan test OLS failed: {}", e));
            }
        }
    }

    // --- White test ---
    if config.options.white_test {
        // Create Z matrix for White test using x_main_effects_only (original predictors, their squares, cross-products)
        // x_main_effects_only has shape (n_obs, p_main_effects), where col 0 is intercept.

        let mut is_binary_predictor = vec![false; p_main_effects];
        // p_main_effects includes intercept, so predictor j is column j (1-indexed in matrix terms)

        if p_main_effects > 1 {
            // If there are actual predictors besides intercept
            for j_pred_idx_in_x_me in 1..p_main_effects {
                // Iterate through columns of x_main_effects_only (skip intercept)
                let mut all_binary = true;
                if n_obs == 0 {
                    all_binary = false;
                }
                for i_obs in 0..n_obs {
                    let val = x_main_effects_only[(i_obs, j_pred_idx_in_x_me)];
                    if !((val - 0.0).abs() < 1e-9 || (val - 1.0).abs() < 1e-9) {
                        all_binary = false;
                        break;
                    }
                }
                is_binary_predictor[j_pred_idx_in_x_me] = all_binary;
            }
        }

        // Determine which predictors should have their squares included to avoid multicollinearity
        let mut add_square_for_predictor = vec![false; p_main_effects]; // Indexed like is_binary_predictor
        if p_main_effects > 1 && n_obs > 0 {
            for j_col_idx in 1..p_main_effects {
                // For each actual predictor column in x_main_effects_only
                if !is_binary_predictor[j_col_idx] {
                    // If not already excluded by binary check
                    let mut unique_values_set = HashSet::new();
                    for i_obs in 0..n_obs {
                        // Use to_bits for f64 to ensure correct hashing for HashSet
                        unique_values_set.insert(x_main_effects_only[(i_obs, j_col_idx)].to_bits());
                    }
                    if unique_values_set.len() > 2 {
                        // Only add square if more than 2 unique values to avoid multicollinearity
                        // (e.g., if X has 2 levels, X and X^2 are perfectly collinear with an intercept)
                        add_square_for_predictor[j_col_idx] = true;
                    }
                }
            }
        }

        let mut z_data_white = Vec::new();
        for i_row in 0..n_obs {
            let mut z_row = vec![1.0]; // Intercept for Z_white
            // Original predictors (from x_main_effects_only, excluding its intercept column)
            for j_col_idx in 1..p_main_effects {
                z_row.push(x_main_effects_only[(i_row, j_col_idx)]);
            }
            // Squares of predictors, based on pre-calculated `add_square_for_predictor`
            for j_col_idx in 1..p_main_effects {
                if add_square_for_predictor[j_col_idx] {
                    z_row.push(x_main_effects_only[(i_row, j_col_idx)].powi(2));
                }
            }
            // Cross-products
            for j_col_idx in 1..p_main_effects {
                for k_col_idx in j_col_idx + 1..p_main_effects {
                    z_row.push(
                        x_main_effects_only[(i_row, j_col_idx)] *
                            x_main_effects_only[(i_row, k_col_idx)]
                    );
                }
            }
            z_data_white.push(z_row);
        }

        let nrows_z_white = z_data_white.len();
        let ncols_z_white = if nrows_z_white > 0 { z_data_white[0].len() } else { 0 };

        if nrows_z_white > 0 && ncols_z_white > 0 && nrows_z_white == n_obs {
            let mut z_flat_data_white = Vec::with_capacity(nrows_z_white * ncols_z_white);
            for row in &z_data_white {
                z_flat_data_white.extend_from_slice(row);
            }
            let z_white = DMatrix::from_row_slice(nrows_z_white, ncols_z_white, &z_flat_data_white);

            match run_simple_ols(&aux_y_for_tests, &z_white, n_obs) {
                Ok((r_squared_white, _ess, _rss, _df_reg, _df_res)) => {
                    let white_stat = (n_obs as f64) * r_squared_white;
                    // df_white is num regressors in Z_white (excluding its intercept)
                    let df_white = if ncols_z_white > 0 { ncols_z_white - 1 } else { 0 };
                    let p_value_white = 1.0 - chi_square_cdf(white_stat, df_white as f64);

                    let note_white = vec![
                        format!("a. Dependent variable: {}", dep_var_name),
                        "b. Tests the null hypothesis that the variance of the errors does not depend on the values of the independent variables.".to_string(),
                        // White test note per image seems to refer to main model design
                        format!("c. Design: {}", full_model_design_note_string)
                    ];
                    test_results.white = Some(WhiteTest {
                        statistic: white_stat,
                        df: df_white,
                        p_value: p_value_white,
                        note: note_white,
                    });
                }
                Err(e) => {
                    return Err(format!("White test OLS failed: {}", e));
                }
            }
        } else {
            return Err("Z matrix for White test could not be formed or was empty.".to_string());
        }
    }

    // --- Modified Breusch-Pagan test (Revised: regress u_i on intercept and y_hat_full) ---
    if config.options.mod_brusch_pagan {
        // Auxiliary regressors: intercept and y_hat_full (same as BP)
        let mut x_aux_mbp_data = Vec::with_capacity(n_obs * 2);
        for i in 0..n_obs {
            x_aux_mbp_data.push(1.0); // Intercept
            x_aux_mbp_data.push(y_hat_full[i]);
        }
        let x_aux_mbp = DMatrix::from_row_slice(n_obs, 2, &x_aux_mbp_data);

        match run_simple_ols(&aux_y_for_tests, &x_aux_mbp, n_obs) {
            Ok((r_squared_mbp, _ess, _rss, _df_reg, _df_res)) => {
                let mbp_stat = (n_obs as f64) * r_squared_mbp;
                let df_mbp = 1; // Regressing on y_hat
                let p_value_mbp = 1.0 - chi_square_cdf(mbp_stat, df_mbp as f64);

                let note_mbp = vec![
                    format!("a. Dependent variable: {}", dep_var_name),
                    "b. Tests the null hypothesis that the variance of the errors does not depend on the values of the independent variables.".to_string(),
                    format!("c. Predicted values from design: {}", full_model_design_note_string)
                ];
                test_results.modified_breusch_pagan = Some(ModifiedBPTest {
                    statistic: mbp_stat,
                    df: df_mbp,
                    p_value: p_value_mbp,
                    note: note_mbp,
                });
            }
            Err(e) => {
                return Err(format!("Modified Breusch-Pagan test OLS failed: {}", e));
            }
        }
    }

    // --- F-test (Revised: based on regressing u_i on intercept and y_hat_full) ---
    if config.options.f_test {
        // Auxiliary regressors: intercept and y_hat_full (same as BP)
        let mut x_aux_f_data = Vec::with_capacity(n_obs * 2);
        for i in 0..n_obs {
            x_aux_f_data.push(1.0); // Intercept
            x_aux_f_data.push(y_hat_full[i]);
        }
        let x_aux_f = DMatrix::from_row_slice(n_obs, 2, &x_aux_f_data);

        match run_simple_ols(&aux_y_for_tests, &x_aux_f, n_obs) {
            Ok((_r_squared_f, ess_f, rss_f, df_reg_f, df_res_f)) => {
                // df_reg_f from run_simple_ols is x_aux_f.ncols() - 1, which is 1 for [intercept, y_hat]
                // df_res_f from run_simple_ols is n_obs - x_aux_f.ncols()

                let f_statistic = if rss_f.abs() < 1e-12 || df_res_f == 0 || df_reg_f == 0 {
                    0.0
                } else {
                    ess_f / (df_reg_f as f64) / (rss_f / (df_res_f as f64))
                };

                // Assuming f_cdf is available in super::core similar to chi_square_cdf
                let p_value_f =
                    1.0 - f_distribution_cdf(f_statistic, df_reg_f as f64, df_res_f as f64);

                let note_f = vec![
                    format!("a. Dependent variable: {}", dep_var_name),
                    "b. Tests the null hypothesis that the variance of the errors does not depend on the values of the independent variables.".to_string(),
                    format!("c. Predicted values from design: {}", full_model_design_note_string)
                ];
                test_results.f_test = Some(FTest {
                    statistic: f_statistic,
                    df1: df_reg_f,
                    df2: df_res_f, // Corrected: use df_res_f from OLS output
                    p_value: p_value_f, // Corrected: use p_value from F-distribution
                    note: note_f,
                });
            }
            Err(e) => {
                return Err(format!("F-test OLS failed: {}", e));
            }
        }
    }

    Ok(test_results)
}
