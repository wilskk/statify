use std::collections::HashMap;
use nalgebra::DMatrix;

use crate::models::{
    config::MultivariateConfig,
    data::AnalysisData,
    result::BoxTest,
};

use super::common::compute_per_group_covariances;
use super::core::{
    matrix_determinant,
    chi_square_cdf,
    calculate_f_significance,
    from_dmatrix,
};

/// Calculate Box's M test for homogeneity of covariance matrices
///
/// Box's M Test tests the null hypothesis that the observed
/// covariance matrices of the dependent variables are equal across groups.
pub fn calculate_box_test(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<BoxTest, String> {
    // Step 1: Verify we have the necessary data
    if config.main.dep_var.is_none() || config.main.dep_var.as_ref().unwrap().is_empty() {
        return Err("No dependent variables specified for Box's M test".to_string());
    }

    if config.main.fix_factor.is_none() || config.main.fix_factor.as_ref().unwrap().is_empty() {
        return Err("No factors specified for Box's M test".to_string());
    }

    let dependent_vars = config.main.dep_var.as_ref().unwrap();

    // Step 2 + 3: Build per-group (S_i, n_i) tuples via the shared helper so
    // Welch-Satterthwaite Hotelling T² can reuse the exact same grouping
    // logic. Fall back to an explicit error when no group survives the
    // n > p screening that compute_per_group_covariances already enforces.
    let all_factors = config.main.fix_factor.as_ref().cloned().unwrap_or_default();
    let group_summaries = compute_per_group_covariances(data, config, &all_factors)?;

    let group_covariance_matrices: Vec<
        (HashMap<String, String>, DMatrix<f64>, usize)
    > = group_summaries
        .into_iter()
        .map(|g| (g.label, g.covariance, g.n))
        .collect();

    if group_covariance_matrices.is_empty() {
        return Err("Insufficient data in groups for Box's M test".to_string());
    }

    // Step 4: Calculate the pooled covariance matrix
    let p = dependent_vars.len(); // Number of variables
    let mut pooled_cov_matrix = DMatrix::zeros(p, p);
    let mut total_df = 0;

    for (_, cov_matrix, n) in &group_covariance_matrices {
        let df = n - 1;
        total_df += df;
        pooled_cov_matrix += cov_matrix.clone() * (df as f64);
    }

    pooled_cov_matrix /= total_df as f64;

    // Step 5: Calculate Box's M statistic
    let mut box_m = 0.0;

    // Try to get determinant of pooled matrix
    let ln_det_pooled;
    match matrix_determinant(&from_dmatrix(&pooled_cov_matrix)) {
        Ok(det) => {
            if det <= 0.0 {
                return Err("Pooled covariance matrix is singular".to_string());
            }
            ln_det_pooled = det.ln();
        }
        Err(e) => {
            return Err(format!("Error calculating determinant: {}", e));
        }
    }

    for (_, cov_matrix, n) in &group_covariance_matrices {
        let df = n - 1;

        match matrix_determinant(&from_dmatrix(cov_matrix)) {
            Ok(det) => {
                if det <= 0.0 {
                    return Err("Group covariance matrix is singular".to_string());
                }
                box_m += (df as f64) * (det.ln() - ln_det_pooled);
            }
            Err(e) => {
                return Err(format!("Error calculating determinant: {}", e));
            }
        }
    }

    box_m = -box_m;

    // Step 6: Calculate approximation with Box's correction factor.
    let g = group_covariance_matrices.len(); // Number of groups
    let df1 = (p * (p + 1) * (g - 1)) / 2;

    let mut sum_reciprocal = 0.0;
    for (_, _, n) in &group_covariance_matrices {
        let df = n - 1;
        sum_reciprocal += 1.0 / (df as f64);
    }

    let c =
        ((2.0 * (p as f64).powi(2) + 3.0 * (p as f64) - 1.0) /
            (6.0 * ((p as f64) + 1.0) * ((g as f64) - 1.0))) *
        (sum_reciprocal - (1.0 / (total_df as f64)));

    let chi_square = ((1.0 - c) * box_m).max(0.0);

    // Use an F-like scaled statistic for the displayed "F" column while keeping
    // significance derived from an F distribution with residual df.
    let (f_statistic, df2, significance) = if total_df > 0 {
        let f_statistic = chi_square / (df1 as f64);
        let df2 = total_df as f64;
        let significance = calculate_f_significance(df1, total_df, f_statistic);
        (f_statistic, df2, significance)
    } else {
        let significance = 1.0 - chi_square_cdf(chi_square, df1 as f64);
        (chi_square, 0.0, significance)
    };

    // Step 7: Assemble result

    // Create the result
    Ok(BoxTest {
        box_m,
        f: f_statistic,
        df1,
        df2,
        significance,
        design: Some(format!("Box's M Test of Equality of Covariance Matrices")),
        description: Some(
            format!(
                "Tests the null hypothesis that the observed covariance matrices of the dependent variables are equal across groups."
            )
        ),
    })
}
