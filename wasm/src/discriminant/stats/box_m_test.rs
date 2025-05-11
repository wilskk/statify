use nalgebra::DMatrix;
use statrs::distribution::ContinuousCDF;
use rayon::prelude::*;

use crate::discriminant::models::{ result::BoxMTest, AnalysisData, DiscriminantConfig };

use super::core::{
    AnalyzedDataset,
    extract_analyzed_dataset,
    calculate_log_determinant,
    calculate_covariance,
};

/// Calculates Box's M test for homogeneity of covariance matrices.
///
/// Box's M test is used to test the null hypothesis:
/// H₀: Σ₁ = Σ₂ = ... = Σₖ
///
/// Where Σᵢ is the covariance matrix for the ith group.
/// For moderate to small sample sizes, an F approximation is used to
/// compute the significance level using the formula:
///
/// F_approx = γM/f₁
///
/// Where:
/// - γ = (1-ρ-f₂/f₁)/f₁
/// - M = (n-g)log|S| - Σ(nᵢ-1)log|Sᵢ|
/// - f₁ = (g-1)p(p+1)/2
/// - f₂ = (f₁+2)/(ρ-τ/ρ²)
///
/// Returns: BoxMTest structure containing test statistics and p-value
pub fn calculate_box_m_test(
    data: &AnalysisData,
    config: &DiscriminantConfig
) -> Result<BoxMTest, String> {
    web_sys::console::log_1(&"Executing calculate_box_m_test".into());

    // Extract analyzed dataset
    let dataset = extract_analyzed_dataset(data, config)?;
    let independent_variables = &config.main.independent_variables;

    // Compute per-group covariance matrices and log determinants
    let (group_covs, group_log_dets, group_sizes) = compute_group_covariances(
        &dataset,
        independent_variables
    )?;

    if group_covs.is_empty() {
        return Err("No valid groups for Box's M test".to_string());
    }

    let p = independent_variables.len(); // Number of variables
    let k = group_covs.len(); // Number of groups
    let total_sample_size: usize = group_sizes.iter().sum();

    // Compute pooled covariance matrix
    let pooled_cov_matrix = compute_pooled_covariance_matrix(&group_covs, &group_sizes);
    let pooled_log_det = calculate_log_determinant(&pooled_cov_matrix);

    // Compute Box's M statistic: M = (n-g)log|S| - Σ(nᵢ-1)log|Sᵢ|
    let mut box_m = ((total_sample_size - k) as f64) * pooled_log_det;
    for (i, log_det) in group_log_dets.iter().enumerate() {
        box_m -= ((group_sizes[i] - 1) as f64) * log_det;
    }

    // Compute correction factors ρ and τ (named c1 and c2 in code)
    let c1 = compute_c1_factor(p, k); // ρ = 1 - (2p²+3p-1)/(6(p+1)(g-1))
    let c2 = compute_c2_factor(&group_sizes, total_sample_size); // τ calculation

    // Compute F approximation
    let v1 = ((p * (p + 1) * (k - 1)) as f64) / 2.0; // f₁ = (g-1)p(p+1)/2

    // Calculate γM where γ = (1-ρ-f₂/f₁)/f₁
    // This is implemented as adjusted_m = box_m * (1.0 - c1 - c2/box_m)
    let adjusted_m = box_m * (1.0 - c1 - c2 / (box_m + 1e-10));

    // F approximation = γM/f₁
    let f_approx = if adjusted_m > 0.0 && v1 > 0.0 { adjusted_m / v1 } else { 0.0 };

    // Compute degrees of freedom and p-value
    let df1 = v1; // First degrees of freedom
    let df2 = compute_df2(c1, c2, df1); // Second degrees of freedom

    // P-value calculation: 1 - CDF.F(F_approx, df1, df2)
    let p_value = if f_approx.is_finite() { compute_p_value(f_approx, df1, df2) } else { 1.0 };

    Ok(BoxMTest {
        box_m,
        f_approx,
        df1,
        df2,
        p_value,
    })
}

/// Computes group covariance matrices, their log determinants, and group sizes.
///
/// This function calculates the covariance matrix for each group with sufficient data,
/// along with the natural logarithm of the determinant of each covariance matrix.
fn compute_group_covariances(
    dataset: &AnalyzedDataset,
    variables: &[String]
) -> Result<(Vec<DMatrix<f64>>, Vec<f64>, Vec<usize>), String> {
    let mut group_covs = Vec::new();
    let mut group_log_dets = Vec::new();
    let mut group_sizes = Vec::new();

    // Process each group in parallel
    let results: Vec<Option<(DMatrix<f64>, f64, usize)>> = dataset.group_labels
        .par_iter()
        .map(|group| {
            // Check if group has enough data for covariance calculation
            let mut valid_values = true;
            for var in variables {
                if let Some(values) = dataset.group_data.get(var).and_then(|g| g.get(group)) {
                    if values.len() <= 1 {
                        valid_values = false;
                        break;
                    }
                } else {
                    valid_values = false;
                    break;
                }
            }

            if !valid_values {
                return None;
            }

            // Get group size
            let group_size = dataset.group_data
                .get(variables.first().unwrap_or(&String::new()))
                .and_then(|v| v.get(group))
                .map_or(0, |v| v.len());

            if group_size <= 1 {
                return None;
            }

            // Compute covariance matrix
            match compute_group_covariance_matrix(dataset, group, variables) {
                Ok(cov_matrix) => {
                    let log_det = calculate_log_determinant(&cov_matrix);
                    Some((cov_matrix, log_det, group_size))
                }
                Err(_) => None,
            }
        })
        .collect();

    // Collect valid results
    for result in results {
        if let Some((cov, log_det, size)) = result {
            group_covs.push(cov);
            group_log_dets.push(log_det);
            group_sizes.push(size);
        }
    }

    Ok((group_covs, group_log_dets, group_sizes))
}

/// Computes the covariance matrix for a specific group.
fn compute_group_covariance_matrix(
    dataset: &AnalyzedDataset,
    group: &str,
    variables: &[String]
) -> Result<DMatrix<f64>, String> {
    let num_vars = variables.len();

    // Check if we have enough data
    let first_var = variables.first().ok_or_else(|| "No variables provided".to_string())?;
    let num_cases = dataset.group_data
        .get(first_var)
        .and_then(|g| g.get(group))
        .map_or(0, |v| v.len());

    if num_cases <= 1 {
        return Err("Group too small for covariance computation".to_string());
    }

    // Compute covariance matrix
    let mut cov_matrix = DMatrix::zeros(num_vars, num_vars);

    for (var1_idx, var1) in variables.iter().enumerate() {
        for (var2_idx, var2) in variables.iter().enumerate() {
            if
                let (Some(values1), Some(values2)) = (
                    dataset.group_data.get(var1).and_then(|g| g.get(group)),
                    dataset.group_data.get(var2).and_then(|g| g.get(group)),
                )
            {
                if !values1.is_empty() && !values2.is_empty() {
                    let mean1 = dataset.group_means
                        .get(group)
                        .and_then(|m| m.get(var1))
                        .unwrap_or(&0.0);
                    let mean2 = dataset.group_means
                        .get(group)
                        .and_then(|m| m.get(var2))
                        .unwrap_or(&0.0);

                    let cov = calculate_covariance(values1, values2, Some(*mean1), Some(*mean2));
                    cov_matrix[(var1_idx, var2_idx)] = cov;
                }
            }
        }
    }

    Ok(cov_matrix)
}

/// Computes the pooled covariance matrix across all groups.
///
/// The pooled matrix is calculated as:
/// S = Σ(nᵢ-1)Sᵢ / (n-g)
///
/// Where:
/// - nᵢ is the size of group i
/// - Sᵢ is the covariance matrix for group i
/// - n is the total sample size
/// - g is the number of groups
fn compute_pooled_covariance_matrix(
    group_covs: &[DMatrix<f64>],
    group_sizes: &[usize]
) -> DMatrix<f64> {
    let p = group_covs[0].nrows();
    let mut pooled_cov = DMatrix::zeros(p, p);
    let mut total_df = 0;

    for (cov, &size) in group_covs.iter().zip(group_sizes) {
        let df = size - 1;
        total_df += df;
        pooled_cov += cov * (df as f64);
    }

    if total_df > 0 {
        pooled_cov /= total_df as f64;
    }

    pooled_cov
}

/// Computes the c1 (rho) correction factor for Box's M test.
///
/// ρ = 1 - (2p²+3p-1)/(6(p+1)(g-1))
fn compute_c1_factor(p: usize, k: usize) -> f64 {
    (2.0 * (p as f64).powi(2) + 3.0 * (p as f64) - 1.0) /
        (6.0 * ((p as f64) + 1.0) * ((k as f64) - 1.0))
}

/// Computes the c2 (tau) correction factor for Box's M test.
///
/// τ = (r-1)(r+2)/(6(g-1)) * [Σ1/(nᵢ-1) - 1/(n-g)]
fn compute_c2_factor(group_sizes: &[usize], total_sample_size: usize) -> f64 {
    let k = group_sizes.len();
    let mut sum1 = 0.0;

    for &size in group_sizes {
        sum1 += 1.0 / ((size - 1) as f64);
    }

    sum1 -= 1.0 / ((total_sample_size - k) as f64);
    (sum1 * ((k as f64) - 1.0)) / 6.0
}

/// Computes the second degrees of freedom (df2) for F approximation.
///
/// f₂ = (f₁+2)/(c2/(1-c1)² + epsilon)
fn compute_df2(c1: f64, c2: f64, df1: f64) -> f64 {
    (df1 + 2.0) / (c2 / (1.0 - c1).powi(2) + 1e-10)
}

/// Computes the p-value from the F distribution.
///
/// P-value = 1 - F_CDF(f_approx, df1, df2)
fn compute_p_value(f_approx: f64, df1: f64, df2: f64) -> f64 {
    match statrs::distribution::FisherSnedecor::new(df1, df2) {
        Ok(dist) => dist.sf(f_approx).max(0.0).min(1.0),
        Err(_) => 1.0,
    }
}
