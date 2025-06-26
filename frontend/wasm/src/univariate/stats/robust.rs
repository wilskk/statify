// robust.rs
use nalgebra::{ DMatrix, DVector };

use crate::univariate::models::{
    config::UnivariateConfig,
    data::{ AnalysisData, DataValue },
    result::{ ConfidenceInterval, ParameterEstimateEntry, ParameterEstimates },
};

use super::core::*;

/// Calculate parameter estimates with robust standard errors
pub fn calculate_robust_parameter_estimates(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<ParameterEstimates, String> {
    if !config.options.param_est_rob_std_err {
        return Err("Robust parameter estimates not requested in configuration".to_string());
    }

    let dep_var_name = match &config.main.dep_var {
        Some(name) => name.clone(),
        None => {
            return Err("No dependent variable specified in configuration".to_string());
        }
    };

    // Extract data for analysis
    let mut y_values = Vec::new();
    let mut x_matrix = Vec::new();
    let mut parameter_names = Vec::new();

    // Add intercept parameter if included
    if config.model.intercept {
        parameter_names.push("Intercept".to_string());
    }

    // Add fixed factors
    if let Some(factors) = &config.main.fix_factor {
        for factor in factors {
            let factor_levels = get_factor_levels(data, factor)?;

            // For factors, create parameter names
            for level in &factor_levels {
                parameter_names.push(format!("{}={}", factor, level));
            }
        }
    }

    // Add covariates if any
    if let Some(covariates) = &config.main.covar {
        parameter_names.extend(covariates.clone());
    }

    // Extract y values and build X matrix
    for records in &data.dependent_data {
        for record in records {
            if let Some(y) = extract_numeric_from_record(record, &dep_var_name) {
                y_values.push(y);

                // Create a row for X matrix
                let mut x_row = Vec::new();

                // Add intercept if needed
                if config.model.intercept {
                    x_row.push(1.0);
                }

                // Add factors and covariates
                if let Some(factors) = &config.main.fix_factor {
                    for factor in factors {
                        // Find factor value
                        let factor_level = record.values.get(factor).map(data_value_to_string);

                        if let Some(level) = factor_level {
                            // Add dummy variables for each level (except reference level)
                            let factor_levels = get_factor_levels(data, factor)?;
                            for fl in &factor_levels {
                                x_row.push(if *fl == level { 1.0 } else { 0.0 });
                            }
                        } else {
                            // Add zeros for all levels of this factor
                            let factor_levels = get_factor_levels(data, factor)?;
                            for _ in &factor_levels {
                                x_row.push(0.0);
                            }
                        }
                    }
                }

                // Add covariates if any
                if let Some(covariates) = &config.main.covar {
                    for covar in covariates {
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
            }
        }
    }

    // Convert to nalgebra matrices for calculations
    let n = y_values.len();
    let p = if x_matrix.is_empty() { 0 } else { x_matrix[0].len() };

    if n == 0 || p == 0 {
        return Err("No valid data for robust standard errors calculation".to_string());
    }

    let y = DVector::from_row_slice(&y_values);

    // Convert x_matrix to DMatrix
    let nrows = x_matrix.len();
    let ncols = if nrows > 0 { x_matrix[0].len() } else { 0 };
    let mut x_data = Vec::with_capacity(nrows * ncols);
    for row in &x_matrix {
        x_data.extend_from_slice(row);
    }
    let x = DMatrix::from_row_slice(nrows, ncols, &x_data);

    // Calculate OLS parameters and residuals
    let xtx = &x.transpose() * &x;
    if let Some(xtx_inv) = xtx.try_inverse() {
        let beta = &xtx_inv * &x.transpose() * &y;
        let y_hat = &x * &beta;
        let residuals = &y - &y_hat;

        // Calculate hat matrix diagonal elements (leverages)
        let h_diag = (0..n)
            .map(|i| {
                let x_i = x.row(i);
                let h_i = x_i * &xtx_inv * x_i.transpose();
                h_i[(0, 0)]
            })
            .collect::<Vec<f64>>();

        // Create matrix for HC variance estimator
        let mut omega = DMatrix::zeros(n, n);

        // Select HC method
        if config.options.hc0 {
            // HC0: White's original estimator
            for i in 0..n {
                omega[(i, i)] = residuals[i].powi(2);
            }
        } else if config.options.hc1 {
            // HC1: Finite sample correction
            let correction = (n as f64) / ((n - p) as f64);
            for i in 0..n {
                omega[(i, i)] = residuals[i].powi(2) * correction;
            }
        } else if config.options.hc2 {
            // HC2: Leverage adjustment
            for i in 0..n {
                omega[(i, i)] = residuals[i].powi(2) / (1.0f64 - h_diag[i]);
            }
        } else if config.options.hc3 {
            // HC3: Secondary leverage adjustment
            for i in 0..n {
                omega[(i, i)] = residuals[i].powi(2) / (1.0f64 - h_diag[i]).powi(2);
            }
        } else if config.options.hc4 {
            // HC4: Cribari-Neto adjustment
            for i in 0..n {
                let delta_i = (4.0f64).min(((n as f64) * h_diag[i]) / (p as f64));
                omega[(i, i)] = residuals[i].powi(2) / (1.0f64 - h_diag[i]).powf(delta_i);
            }
        } else {
            // Default to HC3 if none specified
            for i in 0..n {
                omega[(i, i)] = residuals[i].powi(2) / (1.0f64 - h_diag[i]).powi(2);
            }
        }

        // Calculate robust covariance matrix
        let bread = &xtx_inv;
        let meat = &x.transpose() * &omega * &x;
        let robust_cov = bread * meat * bread;

        // Extract robust standard errors
        let robust_se = (0..p).map(|i| robust_cov[(i, i)].sqrt()).collect::<Vec<f64>>();

        // Calculate parameter estimates
        let mut estimates = Vec::new();

        for i in 0..p {
            if i >= parameter_names.len() {
                continue;
            }

            let b = beta[i];
            let std_error = robust_se[i];
            let t_value = b / std_error;
            let df = n - p;
            let significance = calculate_t_significance(t_value, df);

            // Calculate confidence interval
            let t_critical = calculate_t_critical(Some(config.options.sig_level / 2.0), df);
            let ci_width = std_error * t_critical;

            // Add parameter
            estimates.push(ParameterEstimateEntry {
                parameter: parameter_names[i].clone(),
                b,
                std_error,
                t_value,
                significance,
                confidence_interval: ConfidenceInterval {
                    lower_bound: b - ci_width,
                    upper_bound: b + ci_width,
                },
                partial_eta_squared: t_value.powi(2) / (t_value.powi(2) + (df as f64)),
                noncent_parameter: t_value.abs(),
                observed_power: if config.options.obs_power {
                    1.0f64 - (-t_value.abs() * 0.5).exp()
                } else {
                    0.0
                },
                is_redundant: false,
            });
        }

        // Add notes about the robust estimation method used
        let mut notes = Vec::new();

        // Determine which HC method was used
        let hc_method = if config.options.hc0 {
            "HC0 (White's original estimator)"
        } else if config.options.hc1 {
            "HC1 (Finite sample correction)"
        } else if config.options.hc2 {
            "HC2 (Leverage adjustment)"
        } else if config.options.hc3 {
            "HC3 (Secondary leverage adjustment)"
        } else if config.options.hc4 {
            "HC4 (Cribari-Neto adjustment)"
        } else {
            "HC3 (Secondary leverage adjustment)" // Default
        };

        notes.push(format!("a. Robust standard errors calculated using {} method", hc_method));
        notes.push(format!("b. Computed using alpha = {:.2}", config.options.sig_level));
        if config.options.obs_power {
            notes.push("c. Observed Power is computed using alpha = .05".to_string());
        }

        Ok(ParameterEstimates { estimates, notes })
    } else {
        Err("Matrix inversion failed in robust standard errors calculation".to_string())
    }
}
