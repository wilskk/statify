// save.rs
use crate::univariate::models::{
    config::UnivariateConfig,
    data::{ AnalysisData, DataValue },
    result::SavedVariables,
};
use nalgebra::DMatrix;

use super::core::{ extract_numeric_from_record, get_factor_levels, data_value_to_string };

/// Save variables as requested in the configuration
pub fn save_variables(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<SavedVariables, String> {
    if
        !config.save.res_weighted &&
        !config.save.pre_weighted &&
        !config.save.std_statistics &&
        !config.save.cooks_d &&
        !config.save.leverage &&
        !config.save.unstandardized_res &&
        !config.save.weighted_res &&
        !config.save.standardized_res &&
        !config.save.studentized_res &&
        !config.save.deleted_res
    {
        return Err("Configuration does not request any saved variables".to_string());
    }

    let dep_var_name = match &config.main.dep_var {
        Some(name) => name.clone(),
        None => {
            return Err("No dependent variable specified in configuration".to_string());
        }
    };

    let mut result = SavedVariables {
        predicted_values: Vec::new(),
        weighted_predicted_values: Vec::new(),
        residuals: Vec::new(),
        weighted_residuals: Vec::new(),
        deleted_residuals: Vec::new(),
        standardized_residuals: Vec::new(),
        studentized_residuals: Vec::new(),
        standard_errors: Vec::new(),
        cook_distances: Vec::new(),
        leverages: Vec::new(),
    };

    // Extract X and Y data
    let mut y_values = Vec::new();
    let mut x_matrix = Vec::new();
    let mut weight_values = Vec::new();

    // Build design matrix based on factors and covariates
    for records in &data.dependent_data {
        for record in records {
            if let Some(y) = extract_numeric_from_record(record, &dep_var_name) {
                y_values.push(y);

                // Create row for X matrix
                let mut x_row = Vec::new();

                // Add intercept
                if config.model.intercept {
                    x_row.push(1.0);
                }

                // Add factors
                if let Some(factors) = &config.main.fix_factor {
                    for factor in factors {
                        // Get factor value
                        if let Some(factor_value) = record.values.get(factor) {
                            // Create dummy variables for factor levels
                            let factor_levels = get_factor_levels(data, factor)?;
                            let value_str = data_value_to_string(factor_value);

                            for level in &factor_levels {
                                x_row.push(if *level == value_str { 1.0 } else { 0.0 });
                            }
                        }
                    }
                }

                // Add covariates
                if let Some(covariates) = &config.main.covar {
                    for covar in covariates {
                        // Get covariate value
                        let value = record.values
                            .get(covar)
                            .map(|val| {
                                match val {
                                    DataValue::Number(n) => *n as f64,
                                    DataValue::NumberFloat(f) => *f,
                                    DataValue::Boolean(b) => if *b { 1.0 } else { 0.0 }
                                    _ => 0.0,
                                }
                            })
                            .unwrap_or(0.0);

                        x_row.push(value);
                    }
                }

                x_matrix.push(x_row);

                // Add weight value
                let mut weight = 1.0;
                if let Some(wls_weight) = &config.main.wls_weight {
                    if let Some(value) = record.values.get(wls_weight) {
                        weight = match value {
                            DataValue::Number(n) => *n as f64,
                            DataValue::NumberFloat(f) => *f,
                            DataValue::Boolean(b) => if *b { 1.0 } else { 0.0 }
                            _ => 1.0,
                        };
                    }
                }
                weight_values.push(weight);
            }
        }
    }

    // Calculate parameter estimates, predicted values, and residuals
    let n = y_values.len();
    let p = if x_matrix.is_empty() { 0 } else { x_matrix[0].len() };

    if n == 0 || p == 0 {
        return Err("No valid data for saved variables calculation".to_string());
    }

    // Calculate X'WX
    let mut xtx = vec![vec![0.0; p]; p];
    for i in 0..p {
        for j in 0..p {
            let mut sum = 0.0;
            for k in 0..n {
                sum += x_matrix[k][i] * x_matrix[k][j] * weight_values[k];
            }
            xtx[i][j] = sum;
        }
    }

    // Calculate (X'WX)^-1
    let xtx_matrix = DMatrix::from_vec(p, p, xtx.into_iter().flatten().collect());
    let xtx_inv = match xtx_matrix.try_inverse() {
        Some(inv) => inv,
        None => {
            return Err("Matrix is not invertible".to_string());
        }
    };
    let xtx_inv: Vec<Vec<f64>> = xtx_inv
        .as_slice()
        .chunks(p)
        .map(|chunk| chunk.to_vec())
        .collect();

    // Calculate X'WY
    let mut xty = vec![0.0; p];
    for i in 0..p {
        let mut sum = 0.0;
        for j in 0..n {
            sum += x_matrix[j][i] * y_values[j] * weight_values[j];
        }
        xty[i] = sum;
    }

    // Calculate beta = (X'WX)^-1 X'WY
    let mut beta = vec![0.0; p];
    for i in 0..p {
        let mut sum = 0.0;
        for j in 0..p {
            sum += xtx_inv[i][j] * xty[j];
        }
        beta[i] = sum;
    }

    // Calculate predicted values
    let mut y_hat = vec![0.0; n];
    for i in 0..n {
        let mut sum = 0.0;
        for j in 0..p {
            sum += x_matrix[i][j] * beta[j];
        }
        y_hat[i] = sum;
    }

    // Calculate residuals
    let mut residuals = vec![0.0; n];
    for i in 0..n {
        residuals[i] = y_values[i] - y_hat[i];
    }

    // Calculate hat matrix diagonal (leverages)
    let mut h_diag = vec![0.0; n];
    for i in 0..n {
        let mut sum = 0.0;
        for j in 0..p {
            let mut h_ij = 0.0;
            for k in 0..p {
                h_ij += x_matrix[i][j] * xtx_inv[j][k] * x_matrix[i][k];
            }
            sum += h_ij;
        }
        h_diag[i] = sum;
    }

    // Calculate MSE
    let mut mse: f64 = 0.0;
    for i in 0..n {
        mse += residuals[i].powi(2) * weight_values[i];
    }
    mse /= (n - p) as f64;

    // Fill result vectors
    for i in 0..n {
        // Predicted values
        if config.save.pre_weighted {
            result.predicted_values.push(y_hat[i]);
        }

        // Weighted predicted values
        if config.save.pre_weighted {
            result.weighted_predicted_values.push(y_hat[i] * weight_values[i].sqrt());
        }

        // Residuals
        if config.save.unstandardized_res {
            result.residuals.push(residuals[i]);
        }

        // Weighted residuals
        if config.save.weighted_res {
            result.weighted_residuals.push(residuals[i] * weight_values[i].sqrt());
        }

        // Deleted (PRESS) residuals
        if config.save.deleted_res {
            if weight_values[i] > 0.0 && weight_values[i] * h_diag[i] < 1.0 {
                result.deleted_residuals.push(residuals[i] / (1.0 / weight_values[i] - h_diag[i]));
            } else {
                result.deleted_residuals.push(f64::NAN);
            }
        }

        // Standardized residuals
        if config.save.standardized_res {
            if weight_values[i] > 0.0 {
                result.standardized_residuals.push(residuals[i] / (mse / weight_values[i]).sqrt());
            } else {
                result.standardized_residuals.push(f64::NAN);
            }
        }

        // Studentized residuals
        if config.save.studentized_res {
            let se_residual = if weight_values[i] > 0.0 && weight_values[i] * h_diag[i] < 1.0 {
                (mse * (1.0 / weight_values[i] - h_diag[i])).sqrt()
            } else {
                f64::NAN
            };

            if se_residual.is_finite() && se_residual > 0.0 {
                result.studentized_residuals.push(residuals[i] / se_residual);
            } else {
                result.studentized_residuals.push(f64::NAN);
            }
        }

        // Standard errors
        if config.save.std_statistics {
            result.standard_errors.push((mse * h_diag[i]).sqrt());
        }

        // Cook's distances
        if config.save.cooks_d {
            let se_residual = if weight_values[i] > 0.0 && weight_values[i] * h_diag[i] < 1.0 {
                (mse * (1.0 / weight_values[i] - h_diag[i])).sqrt()
            } else {
                f64::NAN
            };

            if se_residual.is_finite() && se_residual > 0.0 {
                let t = residuals[i] / se_residual;
                let cook_d = (t.powi(2) * h_diag[i]) / (1.0 - h_diag[i]) / (p as f64);
                result.cook_distances.push(cook_d);
            } else {
                result.cook_distances.push(f64::NAN);
            }
        }

        // Leverages
        if config.save.leverage {
            if weight_values[i] > 0.0 {
                result.leverages.push(weight_values[i] * h_diag[i]);
            } else {
                result.leverages.push(f64::NAN);
            }
        }
    }

    Ok(result)
}
