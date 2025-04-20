// lack_of_fit.rs
use std::collections::{ HashMap, HashSet };

use crate::univariate::models::{
    config::UnivariateConfig,
    data::{ AnalysisData, DataRecord, DataValue },
    result::LackOfFitTests,
};

use super::core::{
    calculate_mean,
    calculate_f_significance,
    calculate_observed_power,
    count_total_cases,
    extract_dependent_value,
    matches_combination,
    data_value_to_string,
    to_dmatrix,
    to_dvector,
};

/// Calculate lack of fit tests if requested
pub fn calculate_lack_of_fit_tests(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<LackOfFitTests, String> {
    if !config.options.lack_of_fit {
        return Err("Lack of fit tests not requested in configuration".to_string());
    }

    let dep_var_name = match &config.main.dep_var {
        Some(name) => name.clone(),
        None => {
            return Err("No dependent variable specified in configuration".to_string());
        }
    };

    // Check if we have fixed factors to use as predictors
    let fixed_factors = match &config.main.fix_factor {
        Some(factors) if !factors.is_empty() => factors,
        _ => {
            return Err("No fixed factors specified for lack of fit test".to_string());
        }
    };

    // Identify unique combinations of predictor values
    let predictor_combinations = get_unique_predictor_combinations(data, config)?;
    let n_unique = predictor_combinations.len();
    let n_total = count_total_cases(data);

    web_sys::console::log_1(&format!("Number of unique combinations: {}", n_unique).into());
    web_sys::console::log_1(&format!("Total sample size: {}", n_total).into());

    // Collect all dependent values and corresponding predictor values
    let mut all_y_values = Vec::new(); // All dependent values
    let mut all_x_values = Vec::new(); // All predictor values (for regression)
    let mut combo_indices = Vec::new(); // To track which combination each record belongs to

    // First pass: collect all values and determine combination membership
    for records in &data.dependent_data {
        for record in records {
            if let Some(y_value) = extract_dependent_value(record, &dep_var_name) {
                all_y_values.push(y_value);

                // Create predictor row (design matrix)
                let mut x_row = Vec::new();
                x_row.push(1.0); // Intercept term

                // Add factor values
                for factor in fixed_factors {
                    // We need to find the corresponding record in fix_factor_data
                    let factor_value = find_factor_value(data, record, factor);
                    match factor_value {
                        Some(DataValue::Number(n)) => x_row.push(n),
                        Some(_) => {
                            // For non-numeric, we need a numeric representation
                            // This is simplified; proper dummy coding would be better
                            x_row.push(1.0);
                        }
                        None => x_row.push(0.0),
                    }
                }
                all_x_values.push(x_row);

                // Find which combination this record belongs to
                let mut combo_idx = 0;
                for (i, combo) in predictor_combinations.iter().enumerate() {
                    if matches_predictor_combination(record, combo, data, config) {
                        combo_idx = i;
                        break;
                    }
                }
                combo_indices.push(combo_idx);
            }
        }
    }

    if all_y_values.is_empty() || all_x_values.is_empty() {
        return Err("No valid data for lack of fit analysis".to_string());
    }

    // Calculate regression coefficients
    let coefficients = calculate_regression_coefficients(&all_x_values, &all_y_values)?;

    web_sys::console::log_1(&format!("Regression coefficients: {:?}", coefficients).into());

    // Calculate fitted values using regression model
    let fitted_values: Vec<f64> = all_x_values
        .iter()
        .map(|x_row| {
            // Calculate predicted value: b0 + b1*x1 + b2*x2 + ...
            x_row
                .iter()
                .zip(coefficients.iter())
                .map(|(x, coef)| x * coef)
                .sum()
        })
        .collect();

    // Group values by predictor combination
    let mut combo_y_values = vec![Vec::new(); n_unique];
    let mut combo_fitted_values = vec![Vec::new(); n_unique];

    for i in 0..all_y_values.len() {
        let combo_idx = combo_indices[i];
        combo_y_values[combo_idx].push(all_y_values[i]);
        combo_fitted_values[combo_idx].push(fitted_values[i]);
    }

    // Calculate residual sum of squares (total error)
    let residual_ss = all_y_values
        .iter()
        .zip(fitted_values.iter())
        .map(|(y, yhat)| (y - yhat).powi(2))
        .sum::<f64>();

    // Calculate pure error sum of squares (within groups)
    let mut pure_error_ss = 0.0;
    for combo_vals in &combo_y_values {
        if combo_vals.len() > 1 {
            // Only if we have multiple points for this combination
            let combo_mean = calculate_mean(combo_vals);
            for val in combo_vals {
                pure_error_ss += (val - combo_mean).powi(2);
            }
        }
    }

    web_sys::console::log_1(
        &format!("Residual SS: {}, Pure Error SS: {}", residual_ss, pure_error_ss).into()
    );

    // Calculate lack of fit sum of squares
    let lack_of_fit_ss = residual_ss - pure_error_ss;

    // Calculate degrees of freedom
    let num_parameters = coefficients.len(); // Intercept + coefficients for predictors
    let df_lack_of_fit = if n_unique > num_parameters {
        n_unique - num_parameters
    } else {
        web_sys::console::log_1(
            &"Warning: Not enough unique combinations for model parameters".into()
        );
        1 // Fallback to avoid zero/negative df
    };

    let df_pure_error = n_total - n_unique;

    web_sys::console::log_1(
        &format!("DF Lack of Fit: {}, DF Pure Error: {}", df_lack_of_fit, df_pure_error).into()
    );

    // Calculate mean squares
    let ms_lack_of_fit = if df_lack_of_fit > 0 {
        lack_of_fit_ss / (df_lack_of_fit as f64)
    } else {
        0.0
    };

    let ms_pure_error = if df_pure_error > 0 {
        pure_error_ss / (df_pure_error as f64)
    } else {
        0.0
    };

    // Calculate F statistic
    let f_value = if ms_pure_error > 0.0 { ms_lack_of_fit / ms_pure_error } else { 0.0 };

    // Calculate significance
    let significance = calculate_f_significance(df_lack_of_fit, df_pure_error, f_value);

    // Calculate effect size
    let partial_eta_squared = if lack_of_fit_ss + pure_error_ss > 0.0 {
        lack_of_fit_ss / (lack_of_fit_ss + pure_error_ss)
    } else {
        0.0
    };

    // Calculate noncentrality parameter
    let noncent_parameter = (df_lack_of_fit as f64) * f_value;

    // Calculate observed power
    let observed_power = calculate_observed_power(
        df_lack_of_fit,
        df_pure_error,
        f_value,
        config.options.sig_level
    );

    Ok(LackOfFitTests {
        sum_of_squares: lack_of_fit_ss,
        df: df_lack_of_fit,
        mean_square: ms_lack_of_fit,
        f_value,
        significance,
        partial_eta_squared,
        noncent_parameter,
        observed_power,
    })
}

/// Helper function to find factor value from fixed factor data
fn find_factor_value(
    data: &AnalysisData,
    record: &DataRecord,
    factor_name: &str
) -> Option<DataValue> {
    // Look through fix_factor_data to find the matching record and extract the factor value
    // This is simplified and assumes records are in the same order across datasets
    let record_index = data.dependent_data
        .iter()
        .flatten()
        .position(|r| (r as *const _) == (record as *const _))?;

    for factor_group in &data.fix_factor_data {
        if record_index < factor_group.len() {
            if let Some(value) = factor_group[record_index].values.get(factor_name) {
                return Some(value.clone());
            }
        }
    }
    None
}

/// Get unique predictor combinations for lack of fit tests
pub fn get_unique_predictor_combinations(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<Vec<HashMap<String, String>>, String> {
    let mut combinations = Vec::new();
    let mut unique_combos = HashSet::new();

    if let Some(factors) = &config.main.fix_factor {
        for (data_idx, records_group) in data.fix_factor_data.iter().enumerate() {
            for record in records_group {
                let mut combo = HashMap::new();

                for factor in factors {
                    if let Some(value) = record.values.get(factor) {
                        let level = data_value_to_string(value);
                        combo.insert(factor.to_string(), level);
                    }
                }

                // Generate a unique key for this combination
                let mut key = String::new();
                for factor in factors {
                    if let Some(level) = combo.get(factor) {
                        key.push_str(&format!("{}:{},", factor, level));
                    }
                }

                if !unique_combos.contains(&key) {
                    unique_combos.insert(key);
                    combinations.push(combo);
                }
            }
        }
    }

    Ok(combinations)
}

/// Check if a record matches a predictor combination for lack of fit tests
pub fn matches_predictor_combination(
    record: &DataRecord,
    combo: &HashMap<String, String>,
    data: &AnalysisData,
    config: &UnivariateConfig
) -> bool {
    // We need to check if the record matches the combination based on fixed factors
    if let Some(factors) = &config.main.fix_factor {
        // Find corresponding fixed factor records
        let record_index = data.dependent_data
            .iter()
            .flatten()
            .position(|r| (r as *const _) == (record as *const _));

        if let Some(idx) = record_index {
            for (factor_group_idx, factor_group) in data.fix_factor_data.iter().enumerate() {
                if idx < factor_group.len() {
                    let factor_record = &factor_group[idx];

                    // Check if this record matches the combination for all factors
                    for factor in factors {
                        if let Some(value) = factor_record.values.get(factor) {
                            let level = data_value_to_string(value);
                            if let Some(combo_level) = combo.get(factor) {
                                if &level != combo_level {
                                    return false;
                                }
                            } else {
                                return false;
                            }
                        } else {
                            return false;
                        }
                    }
                    return true;
                }
            }
        }
        return false;
    }

    // Fallback to original implementation
    matches_combination(record, combo, data, config)
}

/// Calculate regression coefficients using OLS
fn calculate_regression_coefficients(
    x_matrix: &[Vec<f64>],
    y_values: &[f64]
) -> Result<Vec<f64>, String> {
    if x_matrix.is_empty() || y_values.is_empty() {
        return Err("Empty data provided for regression".to_string());
    }

    if x_matrix.len() != y_values.len() {
        return Err(
            format!(
                "Mismatch between predictor and response data lengths: x={}, y={}",
                x_matrix.len(),
                y_values.len()
            )
        );
    }

    // Convert to nalgebra matrix formats
    let x = to_dmatrix(x_matrix);
    let y = to_dvector(y_values);

    // Calculate (X'X)^(-1)X'y
    let x_transpose = x.transpose();
    let xtx = &x_transpose * &x;

    match xtx.clone().try_inverse() {
        Some(xtx_inv) => {
            let beta = xtx_inv * (x_transpose * y);
            Ok(beta.as_slice().to_vec())
        }
        None => {
            // If matrix is singular, try adding a small regularization
            web_sys::console::log_1(
                &"Warning: X'X matrix is nearly singular, adding regularization".into()
            );

            // Add small regularization to diagonal (ridge-like)
            let n = xtx.nrows();
            let mut xtx_reg = xtx.clone();
            for i in 0..n {
                xtx_reg[(i, i)] += 1e-6;
            }

            match xtx_reg.try_inverse() {
                Some(xtx_inv) => {
                    let beta = xtx_inv * (x_transpose * y);
                    Ok(beta.as_slice().to_vec())
                }
                None =>
                    Err(
                        "Matrix X'X is singular and cannot be inverted, even with regularization".to_string()
                    ),
            }
        }
    }
}
