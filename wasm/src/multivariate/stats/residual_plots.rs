use std::collections::HashMap;

use crate::multivariate::models::{ config::MultivariateConfig, data::AnalysisData };

use super::core::{ build_design_matrix_and_response, calculate_mean, to_dmatrix, to_dvector };

/// Calculate residual plots data
pub fn calculate_residual_plots(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<(), String> {
    // Check if residual plots are requested
    if !config.options.res_plot {
        return Ok(());
    }

    // Get dependent variables
    let dependent_vars = data.dependent_data_defs
        .iter()
        .flat_map(|defs| defs.iter().map(|def| def.name.clone()))
        .collect::<Vec<String>>();

    for dep_var in &dependent_vars {
        // Build design matrix and response vector
        let (x_matrix, y_vector) = build_design_matrix_and_response(data, config, dep_var)?;

        // Fit the model
        let x_mat = to_dmatrix(&x_matrix);
        let y_vec = to_dvector(&y_vector);

        let x_transpose_x = &x_mat.transpose() * &x_mat;
        let x_transpose_y = &x_mat.transpose() * &y_vec;

        // Get parameter estimates
        let beta = match x_transpose_x.try_inverse() {
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
                let h_ii = x_i * &xtx_inv * x_i.transpose();
                h_ii[0]
            })
            .collect::<Vec<f64>>();

        // Calculate standardized residuals
        let n = y_vector.len();
        let p = x_matrix[0].len();
        let df_error = n - p;

        let ss_error = residuals
            .iter()
            .map(|r| r.powi(2))
            .sum::<f64>();
        let ms_error = ss_error / (df_error as f64);

        let standardized_residuals = residuals
            .iter()
            .enumerate()
            .map(|(i, r)| r / (ms_error * (1.0 - hat_diag[i])).sqrt())
            .collect::<Vec<f64>>();

        // Generate residual plot data
        let mut residual_plot_data = Vec::new();

        for i in 0..n {
            residual_plot_data.push((
                y_hat[i], // Predicted value
                residuals[i], // Unstandardized residual
                standardized_residuals[i], // Standardized residual
                hat_diag[i], // Leverage
            ));
        }

        // Store plot data for further use
        // ...

        // Add spread vs level plot data

        // Group by predicted values (rounded to nearest 0.5 for binning)
        let mut level_groups: HashMap<f64, Vec<f64>> = HashMap::new();

        for i in 0..n {
            let level = (y_hat[i] * 2.0).round() / 2.0; // Round to nearest 0.5
            let spread = residuals[i].abs();

            level_groups.entry(level).or_insert_with(Vec::new).push(spread);
        }

        // Calculate mean spread for each level
        let mut spread_level_points = Vec::new();

        for (level, spreads) in level_groups {
            let mean_spread = calculate_mean(&spreads);

            spread_level_points.push((level, mean_spread));
        }

        // Sort points by level for proper plotting
        spread_level_points.sort_by(|a, b|
            a.0.partial_cmp(&b.0).unwrap_or(std::cmp::Ordering::Equal)
        );

        // Store spread vs level plot data
        // ...
    }

    Ok(())
}
