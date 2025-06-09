use std::collections::{ HashMap };
use std::hash::{ Hash, Hasher };
use std::collections::hash_map::DefaultHasher;
use nalgebra::RowDVector;

use crate::univariate::models::{
    config::UnivariateConfig,
    data::{ AnalysisData },
    result::{ LackOfFitTests, LackOfFitTestsEntries },
};

use super::core::*;

// Helper to hash a DVector<f64> row to be used as a HashMap key
fn hash_dvector_row(row_vector: &RowDVector<f64>) -> u64 {
    let mut hasher = DefaultHasher::new();
    for val_ref in row_vector.iter() {
        val_ref.to_bits().hash(&mut hasher);
    }
    hasher.finish()
}

/// Calculate lack of fit tests if requested
pub fn calculate_lack_of_fit_tests(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<LackOfFitTests, String> {
    if !config.options.lack_of_fit {
        return Err("Lack of fit tests not requested in configuration".to_string());
    }

    // 1. Fit the main model using the new centralized functions
    let design_info = create_design_response_weights(data, config).map_err(|e|
        format!("LOF: Failed to create design matrix for main model: {}", e)
    )?;

    if design_info.n_samples == 0 {
        return Err("LOF: No data available for main model fitting.".to_string());
    }
    // p_parameters is num columns in X, r_x_rank is its rank.
    // For LOF, p often refers to number of distinct parameters estimated.
    let p_model_params = design_info.r_x_rank;

    let ztwz_matrix = create_cross_product_matrix(&design_info).map_err(|e|
        format!("LOF: Failed to create cross-product matrix for main model: {}", e)
    )?;
    let swept_info = perform_sweep_and_extract_results(
        &ztwz_matrix,
        design_info.p_parameters
    ).map_err(|e| format!("LOF: Failed during SWEEP operation for main model: {}", e))?;

    let ss_error_total = swept_info.s_rss; // Corrected field name
    // df_error_total is N - rank(X) = N - p_model_params
    let df_error_total = (design_info.n_samples as isize) - (p_model_params as isize);
    if df_error_total < 0 {
        return Err(
            format!(
                "LOF: df_error_total is negative ({}), N={}, p_params={}",
                df_error_total,
                design_info.n_samples,
                p_model_params
            )
        );
    }

    // 2. Calculate Pure Error Sum of Squares (SS_PE)
    let y_values = &design_info.y;
    let x_matrix = &design_info.x;
    let n_total = design_info.n_samples;

    // Group Y values by unique X rows (excluding intercept for uniqueness if always present and not a defining feature of "combination")
    // For simplicity here, we'll consider each unique full row of X as a unique predictor combination.
    // If intercept column exists and is always 1, it doesn't help distinguish combinations.
    // Consider using x_matrix.columns(first_pred_col, num_pred_cols) if intercept is always col 0.
    // For now, using full X rows:
    let mut groups_map: HashMap<u64, Vec<f64>> = HashMap::new();
    for i in 0..n_total {
        let x_row = x_matrix.row(i).into_owned(); // Convert to owned RowDVector
        let row_hash = hash_dvector_row(&x_row);
        groups_map.entry(row_hash).or_default().push(y_values[i]);
    }

    let c_unique_combinations = groups_map.len();
    let mut ss_pure_error = 0.0;

    for (_row_hash, y_group) in groups_map.iter() {
        if y_group.len() > 1 {
            // Only if there are replicate points for this combination
            let group_mean = calculate_mean(y_group); // Assuming calculate_mean from common.rs
            for &y_val in y_group {
                ss_pure_error += (y_val - group_mean).powi(2);
            }
        }
    }

    // df_pure_error is N_total - c_unique_combinations
    let df_pure_error = (n_total as isize) - (c_unique_combinations as isize);
    if df_pure_error < 0 {
        // This implies more unique combinations than observations, which shouldn't happen.
        // Or, if every observation is unique, df_pure_error will be 0, and SS_PE will be 0.
        // Set to 0 if negative, but log warning or error as it indicates issue.
        // e.g. if c_unique_combinations > n_total
        return Err(
            format!(
                "LOF: df_pure_error is negative ({}), N={}, c_unique={}. This indicates an issue.",
                df_pure_error,
                n_total,
                c_unique_combinations
            )
        );
    }

    // 3. Calculate Lack of Fit statistics
    let ss_lack_of_fit = (ss_error_total - ss_pure_error).max(0.0); // SS LOF cannot be negative

    // df_lack_of_fit is (N - p) - (N - c) = c - p
    let df_lack_of_fit = (c_unique_combinations as isize) - (p_model_params as isize);
    // Alternatively, df_lack_of_fit = df_error_total - df_pure_error;
    // Let's use c - p definition directly for clarity, assuming p_model_params is correctly defined.

    if df_lack_of_fit < 0 {
        // This can happen if p_model_params > c_unique_combinations (e.g. saturated model or more params than unique points)
        // In such cases, LOF test is not well-defined or df is 0.
        // Typically, if c_unique_combinations <= p_model_params, there is no LOF, df_lof = 0.
        // The F-test would not be meaningful. For now, let's proceed but the results might be NaN/Inf.
        // Consider returning an error or specific note if df_lack_of_fit <=0 when ms_pure_error is also 0.
    }

    let ms_lack_of_fit = if df_lack_of_fit > 0 {
        ss_lack_of_fit / (df_lack_of_fit as f64)
    } else {
        0.0 // Or NaN if ss_lack_of_fit is non-zero, indicating issue
    };

    let ms_pure_error = if df_pure_error > 0 {
        ss_pure_error / (df_pure_error as f64)
    } else {
        0.0 // If df_pure_error is 0 (all points unique), MS_PE is undefined or treated as 0 if SS_PE is 0.
        // If SS_PE > 0 and df_pure_error = 0, this is an issue.
    };

    let f_value_lof = if ms_pure_error > 1e-9 && df_lack_of_fit > 0 {
        // Avoid division by zero or if no LOF df
        (ms_lack_of_fit / ms_pure_error).max(0.0)
    } else if df_lack_of_fit == 0 && ss_lack_of_fit < 1e-9 {
        // No LOF sum of squares and no df for it
        0.0
    } else {
        f64::NAN // Undefined or problematic case
    };

    let significance_lof = if df_lack_of_fit > 0 && df_pure_error > 0 && !f_value_lof.is_nan() {
        calculate_f_significance(df_lack_of_fit as usize, df_pure_error as usize, f_value_lof)
    } else {
        f64::NAN // Significance is not calculable
    };

    let partial_eta_squared_lof = (
        if (ss_lack_of_fit + ss_pure_error).abs() > 1e-9 && ss_error_total.abs() > 1e-9 {
            // Partial Eta^2 for LOF = SS_LOF / (SS_LOF + SS_PE) = SS_LOF / SS_Error_Total
            // This seems to be the definition of Eta^2 for LOF, not partial Eta^2 in a multi-factor sense.
            // If SS_LOF + SS_PE = 0, then eta is 0.
            ss_lack_of_fit / ss_error_total
        } else {
            0.0
        }
    )
        .max(0.0)
        .min(1.0);

    let noncent_parameter_lof = if df_lack_of_fit > 0 && !f_value_lof.is_nan() {
        (df_lack_of_fit as f64) * f_value_lof
    } else {
        0.0
    };

    let observed_power_lof = if df_lack_of_fit > 0 && df_pure_error > 0 && !f_value_lof.is_nan() {
        calculate_observed_power_f(
            f_value_lof,
            df_lack_of_fit as f64,
            df_pure_error as f64,
            config.options.sig_level
        )
    } else {
        f64::NAN
    };

    Ok(LackOfFitTests {
        lack_of_fit: LackOfFitTestsEntries {
            sum_of_squares: ss_lack_of_fit,
            df: df_lack_of_fit.max(0) as usize,
            mean_square: ms_lack_of_fit,
            f_value: f_value_lof,
            significance: significance_lof,
            partial_eta_squared: partial_eta_squared_lof,
            noncent_parameter: noncent_parameter_lof,
            observed_power: observed_power_lof,
        },
        pure_error: LackOfFitTestsEntries {
            sum_of_squares: ss_pure_error,
            df: df_pure_error.max(0) as usize,
            mean_square: ms_pure_error,
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: f64::NAN,
            noncent_parameter: f64::NAN,
            observed_power: f64::NAN,
        },
        notes: vec![
            format!(
                "Significance level for F-test and power calculation: {}. Note: Partial eta-squared for Lack of Fit is calculated as SS_LOF / SS_Error_Total.",
                config.options.sig_level
            )
        ],
    })
}
