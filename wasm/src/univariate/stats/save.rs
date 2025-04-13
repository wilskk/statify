use std::collections::HashMap;

use crate::univariate::models::{
    config::{ SaveConfig, UnivariateConfig },
    data::{ AnalysisData, DataRecord, DataValue },
    result::SavedVariables,
};

use super::core::{ extract_dependent_value };

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
        return Ok(None);
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
            if let Some(y) = extract_dependent_value(record, &dep_var_name) {
                y_values.push(y);

                // Create row for X matrix
                let mut x_row = Vec::new();

                // Add intercept
                if config.model.intercept {
                    x_row.push(1.0);
                }

                // Add factors
                if let Some(factor_str) = &config.main.fix_factor {
                    for factor in factor_str.split(',').map(|s| s.trim()) {
                        // Get factor value
                        for (key, value) in &record.values {
                            if key == factor {
                                // Create dummy variables for factor levels
                                let factor_levels = super::core::get_factor_levels(data, factor)?;
                                let factor_value = match value {
                                    DataValue::Number(n) => n.to_string(),
                                    DataValue::Text(t) => t.clone(),
                                    DataValue::Boolean(b) => b.to_string(),
                                    DataValue::Null => "null".to_string(),
                                };

                                for level in &factor_levels {
                                    x_row.push(if *level == factor_value { 1.0 } else { 0.0 });
                                }
                                break;
                            }
                        }
                    }
                }

                // Add covariates
                if let Some(covar_str) = &config.main.covar {
                    for covar in covar_str.split(',').map(|s| s.trim()) {
                        // Get covariate value
                        let mut value = 0.0;
                        for (key, val) in &record.values {
                            if key == covar {
                                value = match val {
                                    DataValue::Number(n) => *n,
                                    DataValue::Boolean(b) => if *b { 1.0 } else { 0.0 }
                                    _ => 0.0,
                                };
                                break;
                            }
                        }
                        x_row.push(value);
                    }
                }

                x_matrix.push(x_row);

                // Add weight value
                let mut weight = 1.0;
                if let Some(wls_weight) = &config.main.wls_weight {
                    for (key, value) in &record.values {
                        if key == wls_weight {
                            weight = match value {
                                DataValue::Number(n) => *n,
                                DataValue::Boolean(b) => if *b { 1.0 } else { 0.0 }
                                _ => 1.0,
                            };
                            break;
                        }
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

    // Create matrices
    let mut x = Vec::new();
    for i in 0..n {
        let mut row = Vec::new();
        for j in 0..p {
            row.push(x_matrix[i][j]);
        }
        x.push(row);
    }

    // Calculate X'X
    let mut xtx = vec![vec![0.0; p]; p];
    for i in 0..p {
        for j in 0..p {
            let mut sum = 0.0;
            for k in 0..n {
                sum += x[k][i] * x[k][j] * weight_values[k];
            }
            xtx[i][j] = sum;
        }
    }

    // Calculate (X'X)^-1
    let mut xtx_inv = vec![vec![0.0; p]; p];

    // Simple matrix inversion for 1x1 matrix
    if p == 1 {
        xtx_inv[0][0] = 1.0 / xtx[0][0];
    } else {
        // For larger matrices, use a library like nalgebra
        // This is a placeholder - in practice, use a linear algebra library
        for i in 0..p {
            for j in 0..p {
                xtx_inv[i][j] = if i == j { 1.0 / xtx[i][i] } else { 0.0 };
            }
        }
    }

    // Calculate X'Y
    let mut xty = vec![0.0; p];
    for i in 0..p {
        let mut sum = 0.0;
        for j in 0..n {
            sum += x[j][i] * y_values[j] * weight_values[j];
        }
        xty[i] = sum;
    }

    // Calculate beta = (X'X)^-1 X'Y
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
            sum += x[i][j] * beta[j];
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
                h_ij += x[i][j] * xtx_inv[j][k] * x[i][k];
            }
            sum += h_ij;
        }
        h_diag[i] = sum;
    }

    // Calculate MSE
    let mut mse = 0.0;
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
