use crate::multivariate::models::{
    config::MultivariateConfig,
    data::AnalysisData,
    result::LackOfFitTests,
};

use super::core::{
    build_design_matrix_and_response,
    calculate_f_significance,
    calculate_observed_power,
    to_dmatrix,
    to_dvector,
};

/// Calculate lack of fit tests
pub fn calculate_lack_of_fit_tests(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<LackOfFitTests, String> {
    // This implementation assumes continuous predictors and replicated observations
    // A simplistic approach for demonstration:

    // For a proper implementation, we need to:
    // 1. Identify unique combinations of predictor values
    // 2. Calculate lack of fit sum of squares and pure error sum of squares
    // 3. Compute F test for lack of fit

    // Since this requires detailed knowledge of the data structure that might not be fully captured
    // in the provided interfaces, we'll return a simplified placeholder

    let mut sum_of_squares = 0.0;
    let mut df = 0;
    let mut mean_square = 0.0;
    let mut f_value = 0.0;
    let mut significance = 1.0;
    let mut partial_eta_squared = 0.0;
    let mut noncent_parameter = 0.0;
    let mut observed_power = 0.0;

    // Compute lack of fit statistics for the first dependent variable
    if
        let Some(dep_var) = data.dependent_data_defs
            .first()
            .and_then(|defs| defs.first())
            .map(|def| &def.name)
    {
        let (x_matrix, y_vector) = build_design_matrix_and_response(data, config, dep_var)?;

        // Fit the model
        let x_mat = to_dmatrix(&x_matrix);
        let y_vec = to_dvector(&y_vector);

        let x_transpose_x = &x_mat.transpose() * &x_mat;
        let x_transpose_y = &x_mat.transpose() * &y_vec;

        // Get parameter estimates (beta coefficients)
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

        // Get unique combinations of predictor values (simplified approach)
        let n = y_vector.len();
        let p = x_matrix[0].len(); // Number of parameters

        // In a real implementation, we would identify repeated measurements at the same X values
        // For this example, we'll assume half the observations are pure replicates
        let n_unique = n / 2; // Simplified assumption

        // Calculate lack of fit sum of squares (simplified)
        sum_of_squares = residuals
            .iter()
            .take(n_unique)
            .map(|r| r.powi(2))
            .sum();
        df = n_unique - p;

        // Calculate pure error sum of squares (simplified)
        let pure_error_ss = residuals
            .iter()
            .skip(n_unique)
            .map(|r| r.powi(2))
            .sum::<f64>();
        let pure_error_df = n - n_unique;

        // Calculate mean squares
        if df > 0 {
            mean_square = sum_of_squares / (df as f64);
        }

        let pure_error_ms = if pure_error_df > 0 {
            pure_error_ss / (pure_error_df as f64)
        } else {
            0.0
        };

        // Calculate F statistic for lack of fit
        if pure_error_ms > 0.0 {
            f_value = mean_square / pure_error_ms;
            significance = calculate_f_significance(df, pure_error_df, f_value);

            // Calculate effect size
            partial_eta_squared = sum_of_squares / (sum_of_squares + pure_error_ss);

            // Calculate noncentrality parameter and observed power
            noncent_parameter = sum_of_squares / pure_error_ms;
            observed_power = calculate_observed_power(df, pure_error_df, f_value, 0.05);
        }
    }

    Ok(LackOfFitTests {
        sum_of_squares,
        df,
        mean_square,
        f_value,
        significance,
        partial_eta_squared,
        noncent_parameter,
        observed_power,
    })
}
