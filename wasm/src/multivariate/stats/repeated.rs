use std::collections::HashMap;

use nalgebra::DMatrix;

use crate::multivariate::models::{
    config::MultivariateConfig,
    data::AnalysisData,
    result::{ MauchlyTest, MauchlyTestEntry },
};

use super::core::{ build_design_matrix_and_response, chi_square_cdf, to_dmatrix, to_dvector };

/// Calculate Mauchly's test of sphericity for repeated measures analysis
pub fn calculate_mauchly_test(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<Option<MauchlyTest>, String> {
    // Check if this is a repeated measures design
    if config.wsfactors.is_empty() {
        return Ok(None);
    }

    // Get dependent variables
    let dependent_vars = data.dependent_data_defs
        .iter()
        .flat_map(|defs| defs.iter().map(|def| def.name.clone()))
        .collect::<Vec<String>>();

    let mut mauchly_results = HashMap::new();

    // For each within-subjects effect
    for wsfactor in &config.wsfactors {
        let factor_name = &wsfactor.name;
        let factor_levels = wsfactor.levels;

        // Skip if less than 3 levels (sphericity is not testable)
        if factor_levels < 3 {
            continue;
        }

        // Create the M transformation matrix using polynomial contrasts
        let m_matrix = create_transform_matrix(factor_levels)?;

        // For each dependent variable
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

            // Calculate residuals
            let y_hat = &x_mat * &beta;
            let residuals = &y_vec - &y_hat;

            // Calculate residual SSCP matrix
            let residual_sscp = &residuals * &residuals.transpose();

            // Transform the residual SSCP matrix using M matrix
            let m_mat = to_dmatrix(&m_matrix);
            let transformed_sscp = &m_mat.transpose() * &residual_sscp * &m_mat;

            // Calculate Mauchly's W statistic
            let transformed_trace = transformed_sscp.trace();
            let transformed_det = transformed_sscp.determinant();
            let m = factor_levels - 1; // dimension of transformed SSCP matrix

            let mauchly_w = if transformed_trace > 0.0 {
                transformed_det / (transformed_trace / (m as f64)).powi(m as i32)
            } else {
                0.0
            };

            // Calculate degrees of freedom
            let n = y_vector.len();
            let p = x_matrix[0].len();
            let df_error = n - p;

            let f = (m * (m + 1)) / 2 - 1;

            // Calculate rho
            let rho = 1.0 - (2.0 * m.pow(2) + m + 2.0) / (6.0 * (m as f64) * (df_error as f64));

            // Calculate chi-square statistic
            let chi_square = -rho * (df_error as f64) * mauchly_w.ln();

            // Calculate significance
            let significance = 1.0 - chi_square_cdf(chi_square, f as f64);

            // Calculate epsilon corrections
            let greenhouse_geisser_epsilon = calculate_greenhouse_geisser_epsilon(
                &transformed_sscp
            );
            let huynh_feldt_epsilon = calculate_huynh_feldt_epsilon(
                greenhouse_geisser_epsilon,
                m,
                df_error
            );
            let lower_bound_epsilon = 1.0 / (m as f64);

            // Store results
            mauchly_results.insert(factor_name.clone(), MauchlyTestEntry {
                effect: factor_name.clone(),
                mauchly_w,
                chi_square,
                df: f,
                significance,
                greenhouse_geisser_epsilon,
                huynh_feldt_epsilon,
                lower_bound_epsilon,
            });
        }
    }

    if mauchly_results.is_empty() {
        Ok(None)
    } else {
        Ok(
            Some(MauchlyTest {
                tests: mauchly_results,
            })
        )
    }
}

/// Helper function to create transformation matrix for Mauchly's test
fn create_transform_matrix(levels: usize) -> Result<Vec<Vec<f64>>, String> {
    if levels < 2 {
        return Err("Factor must have at least 2 levels".to_string());
    }

    let mut matrix = Vec::new();

    // Create polynomial contrasts
    // For simplicity, we use orthogonal polynomial contrasts

    // First, create the standard matrix with levels rows and levels-1 columns
    for i in 0..levels {
        let mut row = Vec::new();

        // Linear term
        let x = (2.0 * (i as f64)) / ((levels as f64) - 1.0) - 1.0;
        row.push(x);

        // Higher order terms
        for j in 2..levels {
            let term = match j {
                2 => 1.5 * x.powi(2) - 0.5, // Quadratic
                3 => 2.5 * x.powi(3) - 1.5 * x, // Cubic
                4 => 4.375 * x.powi(4) - 3.75 * x.powi(2) + 0.375, // Quartic
                _ => {
                    // Higher terms would need to use proper Legendre polynomials
                    // This is a simplified approach
                    let mut term = 0.0;
                    for k in 0..=j {
                        term += x.powi(k as i32) * (j as f64).powi(k as i32);
                    }
                    term
                }
            };
            row.push(term);
        }

        matrix.push(row);
    }

    // Orthonormalize the matrix columns
    for j in 0..levels - 1 {
        // Calculate column length
        let mut length = 0.0;
        for i in 0..levels {
            length += matrix[i][j].powi(2);
        }
        length = length.sqrt();

        // Normalize
        for i in 0..levels {
            matrix[i][j] /= length;
        }

        // Make subsequent columns orthogonal to this one
        for k in j + 1..levels - 1 {
            let mut dot_product = 0.0;
            for i in 0..levels {
                dot_product += matrix[i][j] * matrix[i][k];
            }

            for i in 0..levels {
                matrix[i][k] -= dot_product * matrix[i][j];
            }
        }
    }

    Ok(matrix)
}

/// Calculate Greenhouse-Geisser epsilon
fn calculate_greenhouse_geisser_epsilon(transformed_sscp: &DMatrix<f64>) -> f64 {
    let trace = transformed_sscp.trace();
    let m = transformed_sscp.nrows();
    let trace_squared = trace.powi(2);
    let trace_of_square = (transformed_sscp * transformed_sscp).trace();

    if trace_of_square > 0.0 {
        trace_squared / ((m as f64) * trace_of_square)
    } else {
        1.0 / (m as f64) // Lower bound
    }
}

/// Calculate Huynh-Feldt epsilon
fn calculate_huynh_feldt_epsilon(greenhouse_geisser: f64, m: usize, df_error: usize) -> f64 {
    let n = df_error + 1; // Number of subjects
    let epsilon_hf =
        ((n as f64) * (m as f64) * greenhouse_geisser - 2.0) /
        (((m as f64) - 1.0) * ((n as f64) - (m as f64) * greenhouse_geisser));

    // Epsilon is capped at 1.0
    epsilon_hf.min(1.0).max(1.0 / (m as f64))
}
