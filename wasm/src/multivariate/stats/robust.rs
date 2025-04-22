use std::collections::HashMap;

use nalgebra::{ DMatrix, DVector };

use crate::multivariate::models::{
    config::MultivariateConfig,
    data::AnalysisData,
    result::{ ConfidenceInterval, ParameterEstimateEntry, ParameterEstimates },
};

use super::core::{
    build_design_matrix_and_response,
    calculate_observed_power_t,
    calculate_t_critical,
    calculate_t_significance,
    generate_parameter_names,
    to_dmatrix,
    to_dvector,
};

/// Calculate robust parameter estimates
pub fn calculate_robust_parameter_estimates(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<ParameterEstimates, String> {
    // Robust parameter estimates would use heteroskedasticity-consistent (HC) standard errors
    // This is a complex implementation that would require calculating robust variance-covariance matrices
    // For simplicity, we'll provide a basic implementation of HC3 estimator

    let mut estimates = HashMap::new();

    // Get dependent variables
    let dependent_vars = data.dependent_data_defs
        .iter()
        .flat_map(|defs| defs.iter().map(|def| def.name.clone()))
        .collect::<Vec<String>>();

    for dep_var in &dependent_vars {
        let (x_matrix, y_vector) = build_design_matrix_and_response(data, config, dep_var)?;

        // Fit the model
        let x_mat = to_dmatrix(&x_matrix);
        let y_vec = to_dvector(&y_vector);

        let x_transpose_x = &x_mat.transpose() * &x_mat;
        let x_transpose_y = &x_mat.transpose() * &y_vec;

        // Get parameter estimates (beta coefficients)
        let beta = match x_transpose_x.clone().try_inverse() {
            Some(inv) => inv * x_transpose_y,
            None => {
                return Err(
                    "Could not invert X'X matrix - possibly due to multicollinearity".to_string()
                );
            }
        };

        // Calculate fitted values and residuals
        let y_hat = &x_mat * &beta;
        let residuals = &y_vec - &y_hat;

        // Calculate hat matrix diagonal elements (leverage values)
        let xtx_inv = x_transpose_x.try_inverse().unwrap();
        let hat_diag = (0..x_mat.nrows())
            .map(|i| {
                let x_i = x_mat.row(i);
                let h_ii = x_i * xtx_inv.clone() * x_i.transpose();
                h_ii[0]
            })
            .collect::<Vec<f64>>();

        // Calculate HC3 weights for residuals
        let hc3_weights = residuals
            .iter()
            .zip(hat_diag.iter())
            .map(|(r, h)| r.powi(2) / (1.0 - h).powi(2))
            .collect::<Vec<f64>>();

        // Calculate HC3 variance-covariance matrix
        let hc3_matrix =
            &x_mat.transpose() * DMatrix::from_diagonal(&DVector::from(hc3_weights)) * &x_mat;
        let robust_var_cov = xtx_inv.clone() * hc3_matrix * xtx_inv;

        // Calculate robust standard errors and t-statistics
        let n = y_vector.len();
        let p = x_matrix[0].len();
        let df_error = n - p;

        // Generate parameter names
        let param_names = generate_parameter_names(data, config)?;

        // Calculate parameter estimates and statistics with robust standard errors
        let mut param_estimates = Vec::new();

        for (i, param_name) in param_names.iter().enumerate() {
            let b_value = beta[i];
            let robust_std_error = robust_var_cov[(i, i)].sqrt();
            let robust_t_value = b_value / robust_std_error;
            let robust_significance = calculate_t_significance(df_error, robust_t_value);

            // Calculate confidence interval (default 95%)
            let alpha = 0.05;
            let t_critical = calculate_t_critical(df_error, alpha / 2.0);
            let ci_lower = b_value - t_critical * robust_std_error;
            let ci_upper = b_value + t_critical * robust_std_error;

            // Calculate partial eta squared
            let partial_eta_squared =
                robust_t_value.powi(2) / (robust_t_value.powi(2) + (df_error as f64));

            // Calculate noncentrality parameter and observed power
            let noncent_parameter = robust_t_value.abs();
            let observed_power = calculate_observed_power_t(df_error, robust_t_value, alpha);

            param_estimates.push(ParameterEstimateEntry {
                parameter: param_name.clone(),
                b: b_value,
                std_error: robust_std_error,
                t_value: robust_t_value,
                significance: robust_significance,
                confidence_interval: ConfidenceInterval {
                    lower_bound: ci_lower,
                    upper_bound: ci_upper,
                },
                partial_eta_squared: Some(partial_eta_squared),
                noncent_parameter: Some(noncent_parameter),
                observed_power: Some(observed_power),
            });
        }

        estimates.insert(dep_var.clone(), param_estimates);
    }

    Ok(ParameterEstimates { estimates })
}
