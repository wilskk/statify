//! Matrix calculations for discriminant analysis.
//!
//! This module implements the matrix operations needed for discriminant analysis,
//! including between-groups and within-groups matrices, Mahalanobis distances,
//! and statistical metrics derived from these matrices.

use std::collections::HashMap;

use nalgebra::{DMatrix, DVector};
use rayon::prelude::*;

use crate::{
    models::{
        result::{CovarianceMatrices, PooledMatrices},
        AnalysisData, DiscriminantConfig,
    },
    stats::core::{calculate_covariance, AnalyzedDataset, EPSILON},
};

use super::core::extract_analyzed_dataset;

/// Calculate between-groups and within-groups matrices
///
/// These are fundamental matrices for discriminant analysis:
/// - Between-groups: represents variation between group means
/// - Within-groups: represents pooled variation within groups
///
/// # Parameters
/// * `dataset` - The analyzed dataset containing group data and means
/// * `variables` - The variables to include in the matrices
///
/// # Returns
/// A tuple containing (between-groups matrix, within-groups matrix)
pub fn calculate_between_within_matrices(
    dataset: &AnalyzedDataset,
    variables: &[String],
) -> (DMatrix<f64>, DMatrix<f64>) {
    let p = variables.len();

    // Initialize matrices
    let mut between_matrix = DMatrix::zeros(p, p);
    let mut within_matrix = DMatrix::zeros(p, p);

    // Calculate between-groups matrix
    for (i, var_i) in variables.iter().enumerate() {
        for (j, var_j) in variables.iter().enumerate() {
            let overall_mean_i = *dataset.overall_means.get(var_i).unwrap_or(&0.0);
            let overall_mean_j = *dataset.overall_means.get(var_j).unwrap_or(&0.0);

            let mut sum = 0.0;

            for group_label in &dataset.group_labels {
                if let (Some(values_i), Some(mean_i), Some(mean_j)) = (
                    dataset
                        .group_data
                        .get(var_i)
                        .and_then(|g| g.get(group_label)),
                    dataset
                        .group_means
                        .get(group_label)
                        .and_then(|m| m.get(var_i)),
                    dataset
                        .group_means
                        .get(group_label)
                        .and_then(|m| m.get(var_j)),
                ) {
                    let n_g = values_i.len() as f64;
                    if n_g > 0.0 {
                        sum += n_g * (mean_i - overall_mean_i) * (mean_j - overall_mean_j);
                    }
                }
            }

            between_matrix[(i, j)] = sum;
        }
    }

    // Calculate within-groups matrix - parallel across group pairs
    let mut total_df = 0;

    let group_contributions: Vec<(DMatrix<f64>, usize)> = dataset
        .group_labels
        .par_iter()
        .filter_map(|group_label| {
            // For each group, calculate contribution to within-groups matrix
            let mut group_within = DMatrix::zeros(p, p);

            // Check if group has data
            let n = dataset
                .group_data
                .get(&variables[0])
                .and_then(|g| g.get(group_label))
                .map_or(0, |v| v.len());

            if n <= 1 {
                return None;
            }

            let df = n - 1;

            // Calculate group covariance matrix
            for (i, var_i) in variables.iter().enumerate() {
                for (j, var_j) in variables.iter().enumerate() {
                    if let (Some(values_i), Some(values_j)) = (
                        dataset
                            .group_data
                            .get(var_i)
                            .and_then(|g| g.get(group_label)),
                        dataset
                            .group_data
                            .get(var_j)
                            .and_then(|g| g.get(group_label)),
                    ) {
                        if values_i.len() > 1 && values_i.len() == values_j.len() {
                            let mean_i = dataset.group_means[group_label][var_i];
                            let mean_j = dataset.group_means[group_label][var_j];

                            // Calculate covariance
                            let cov = calculate_covariance(
                                values_i,
                                values_j,
                                Some(mean_i),
                                Some(mean_j),
                            );

                            group_within[(i, j)] = (df as f64) * cov;
                        }
                    }
                }
            }

            Some((group_within, df))
        })
        .collect();

    // Combine group contributions
    for (group_within, df) in group_contributions {
        within_matrix += &group_within;
        total_df += df;
    }

    if total_df > 0 {
        within_matrix /= total_df as f64;
    }

    (between_matrix, within_matrix)
}

/// Calculate pooled within-groups covariance matrix
///
/// This function computes the pooled within-groups covariance matrix,
/// which is used in discriminant analysis for classification and testing.
///
/// The matrix is calculated as:
/// W = Σ(nᵢ-1)Sᵢ / (n-g)
///
/// # Parameters
/// * `dataset` - The analyzed dataset
/// * `variables` - The variables to include in the matrix
///
/// # Returns
/// The pooled within-groups covariance matrix
pub fn calculate_pooled_within_matrix(
    dataset: &AnalyzedDataset,
    variables: &[String],
) -> DMatrix<f64> {
    let num_vars = variables.len();
    let mut pooled_within = DMatrix::zeros(num_vars, num_vars);
    let mut total_df = 0;

    // Process each group in parallel
    let group_contributions: Vec<(DMatrix<f64>, usize)> = dataset
        .group_labels
        .par_iter()
        .filter_map(|group_label| {
            // For each group, calculate contribution to pooled within matrix
            let mut group_within = DMatrix::zeros(num_vars, num_vars);

            // Check if group has data
            let n = dataset
                .group_data
                .get(&variables[0])
                .and_then(|g| g.get(group_label))
                .map_or(0, |v| v.len());

            if n <= 1 {
                return None;
            }

            let df = n - 1;

            // Calculate group covariance matrix
            for (i, var_i) in variables.iter().enumerate() {
                for (j, var_j) in variables.iter().enumerate() {
                    if let (Some(values_i), Some(values_j)) = (
                        dataset
                            .group_data
                            .get(var_i)
                            .and_then(|g| g.get(group_label)),
                        dataset
                            .group_data
                            .get(var_j)
                            .and_then(|g| g.get(group_label)),
                    ) {
                        if values_i.len() > 1 && values_i.len() == values_j.len() {
                            let mean_i = dataset.group_means[group_label][var_i];
                            let mean_j = dataset.group_means[group_label][var_j];

                            // Calculate covariance
                            let cov = calculate_covariance(
                                values_i,
                                values_j,
                                Some(mean_i),
                                Some(mean_j),
                            );

                            group_within[(i, j)] = (df as f64) * cov;
                        }
                    }
                }
            }

            Some((group_within, df))
        })
        .collect();

    // Combine group contributions
    for (group_within, df) in group_contributions {
        pooled_within += &group_within;
        total_df += df;
    }

    // Normalize by total degrees of freedom
    if total_df > 0 {
        pooled_within /= total_df as f64;
    }

    // Add small regularization for numerical stability
    for i in 0..num_vars {
        pooled_within[(i, i)] += EPSILON;
    }

    pooled_within
}

/// Calculate pooled within-groups covariance matrix WITHOUT EPSILON diagonal regularization.
///
/// This is identical to `calculate_pooled_within_matrix` but does NOT add EPSILON
/// to the diagonal. Used for:
/// - Log Determinants table (must match Box's M internal computation)
/// - Box's M test (pooled log determinant must match table value)
///
/// The matrix is calculated as:
/// W = Σ(nᵢ-1)Sᵢ / (n-g)
///
/// # Parameters
/// * `dataset` - The analyzed dataset
/// * `variables` - The variables to include in the matrix
///
/// # Returns
/// The pooled within-groups covariance matrix (no EPSILON added)
pub fn calculate_pooled_within_matrix_no_epsilon(
    dataset: &AnalyzedDataset,
    variables: &[String],
) -> DMatrix<f64> {
    let num_vars = variables.len();
    let mut pooled_within = DMatrix::zeros(num_vars, num_vars);
    let mut total_df = 0;

    // Process each group in parallel
    let group_contributions: Vec<(DMatrix<f64>, usize)> = dataset
        .group_labels
        .par_iter()
        .filter_map(|group_label| {
            let mut group_within = DMatrix::zeros(num_vars, num_vars);

            let n = dataset
                .group_data
                .get(&variables[0])
                .and_then(|g| g.get(group_label))
                .map_or(0, |v| v.len());

            if n <= 1 {
                return None;
            }

            let df = n - 1;

            for (i, var_i) in variables.iter().enumerate() {
                for (j, var_j) in variables.iter().enumerate() {
                    if let (Some(values_i), Some(values_j)) = (
                        dataset
                            .group_data
                            .get(var_i)
                            .and_then(|g| g.get(group_label)),
                        dataset
                            .group_data
                            .get(var_j)
                            .and_then(|g| g.get(group_label)),
                    ) {
                        if values_i.len() > 1 && values_i.len() == values_j.len() {
                            let mean_i = dataset.group_means[group_label][var_i];
                            let mean_j = dataset.group_means[group_label][var_j];

                            let cov = calculate_covariance(
                                values_i,
                                values_j,
                                Some(mean_i),
                                Some(mean_j),
                            );

                            group_within[(i, j)] = (df as f64) * cov;
                        }
                    }
                }
            }

            Some((group_within, df))
        })
        .collect();

    for (group_within, df) in group_contributions {
        pooled_within += &group_within;
        total_df += df;
    }

    if total_df > 0 {
        pooled_within /= total_df as f64;
    }

    // NO EPSILON added here — this is the key difference from calculate_pooled_within_matrix

    pooled_within
}

/// Calculate pooled within-groups covariance and correlation matrices
///
/// This function computes both the pooled within-groups covariance matrix and
/// the corresponding correlation matrix for discriminant analysis.
///
/// # Parameters
/// * `data` - The analysis data
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A PooledMatrices object with covariance and correlation matrices
pub fn calculate_pooled_matrices(
    data: &AnalysisData,
    config: &DiscriminantConfig,
) -> Result<PooledMatrices, String> {
    web_sys::console::log_1(&"Executing calculate_pooled_matrices".into());

    // Extract analyzed dataset
    let dataset = extract_analyzed_dataset(data, config)?;

    // Exclude grouping variable from pooled matrices output
    let grouping_var = &config.main.grouping_variable;
    let variables: Vec<String> = config
        .main
        .independent_variables
        .iter()
        .filter(|v| *v != grouping_var)
        .cloned()
        .collect();

    // Calculate pooled within-groups covariance matrix
    let pooled_cov_matrix = calculate_pooled_within_matrix(&dataset, &variables);

    // Convert covariance matrix to HashMap format
    let mut covariance = HashMap::new();
    let mut correlation = HashMap::new();

    for (i, var_i) in variables.iter().enumerate() {
        let mut cov_row = HashMap::new();
        let mut corr_row = HashMap::new();

        for (j, var_j) in variables.iter().enumerate() {
            // Store covariance value
            cov_row.insert(var_j.clone(), pooled_cov_matrix[(i, j)]);

            // Calculate correlation value
            let var_i_std = pooled_cov_matrix[(i, i)].sqrt();
            let var_j_std = pooled_cov_matrix[(j, j)].sqrt();

            let corr_value = if var_i_std > EPSILON && var_j_std > EPSILON {
                pooled_cov_matrix[(i, j)] / (var_i_std * var_j_std)
            } else {
                0.0
            };

            corr_row.insert(var_j.clone(), corr_value);
        }

        covariance.insert(var_i.clone(), cov_row);
        correlation.insert(var_i.clone(), corr_row);
    }

    // Calculate degrees of freedom for the pooled matrix
    // For pooled covariance matrix, df = total_cases - num_groups
    let total_df = dataset.total_cases - dataset.num_groups;
    let note_df = format!(
        "a. The covariance matrix has {} degrees of freedom.",
        total_df
    );

    Ok(PooledMatrices {
        variables: variables.clone(),
        covariance,
        correlation,
        note_df,
    })
}

/// Calculate covariance matrices for each group
///
/// This function computes the covariance matrix for each group separately
/// in the discriminant analysis.
///
/// # Parameters
/// * `data` - The analysis data
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A CovarianceMatrices object with covariance matrices for each group
pub fn calculate_covariance_matrices(
    data: &AnalysisData,
    config: &DiscriminantConfig,
) -> Result<CovarianceMatrices, String> {
    web_sys::console::log_1(&"Executing calculate_covariance_matrices".into());

    // Extract analyzed dataset
    let dataset = extract_analyzed_dataset(data, config)?;
    let variables = &config.main.independent_variables;

    // Initialize collection for all matrices
    let mut matrices = HashMap::new();

    // Group degrees of freedom (not used for total covariance calculation)
    let mut group_dfs = 0;

    // Calculate covariance matrix for each group in parallel
    let group_matrices: Vec<(String, HashMap<String, HashMap<String, f64>>, usize)> = dataset
        .group_labels
        .par_iter()
        .filter_map(|group| {
            // Check if this group has enough data
            let group_size = dataset
                .group_data
                .get(&variables[0])
                .and_then(|g| g.get(group))
                .map_or(0, |v| v.len());

            if group_size <= 1 {
                return None; // Skip groups with insufficient data
            }

            // Calculate degrees of freedom for this group
            let df = group_size - 1;

            // Create covariance matrix for this group
            let mut group_matrix = HashMap::new();

            for (i, var_i) in variables.iter().enumerate() {
                let mut row = HashMap::new();

                for (j, var_j) in variables.iter().enumerate() {
                    if let (Some(values_i), Some(values_j)) = (
                        dataset.group_data.get(var_i).and_then(|g| g.get(group)),
                        dataset.group_data.get(var_j).and_then(|g| g.get(group)),
                    ) {
                        if values_i.len() > 1 && values_i.len() == values_j.len() {
                            let mean_i = dataset.group_means[group][var_i];
                            let mean_j = dataset.group_means[group][var_j];

                            let cov = calculate_covariance(
                                values_i,
                                values_j,
                                Some(mean_i),
                                Some(mean_j),
                            );

                            row.insert(var_j.clone(), cov);
                        } else {
                            row.insert(var_j.clone(), 0.0);
                        }
                    } else {
                        row.insert(var_j.clone(), 0.0);
                    }
                }

                group_matrix.insert(var_i.clone(), row);
            }

            Some((group.clone(), group_matrix, df))
        })
        .collect();

    // Combine results
    for (group, matrix, df) in group_matrices {
        matrices.insert(group, matrix);
        group_dfs += df;
    }

    // For total covariance matrix, df = total_cases - 1
    // This is greater than the pooled df because we're using all the data
    // without separating by groups
    let df = dataset.total_cases - 1;

    // Create note for degrees of freedom
    let note_df = format!(
        "a. The total covariance matrix has {} degrees of freedom.",
        df
    );

    Ok(CovarianceMatrices {
        groups: dataset.group_labels.clone(),
        variables: variables.clone(),
        matrices,
        note_df,
    })
}

/// Calculate total unexplained variation between groups (SPSS "Residual Variance").
///
/// SPSS's Unexplained Variance (MINRESID) method minimizes the sum, over all pairs
/// of groups, of the unexplained variation. The unexplained variation for a pair
/// (i, j) is the 2-group Wilks' lambda computed with the pooled within-groups
/// covariance and the current variable set:
///
///   U_ij = (N - g) / ((N - g) + T²_ij),   T²_ij = D²_ij · n_i·n_j / (n_i + n_j)
///
/// Residual Variance = Σ_{i<j} U_ij. Lower = better separation. Verified against
/// SPSS output (e.g. {Fe2O3} → 1.137, decreasing as variables are added).
pub fn calculate_total_unexplained_variation(
    dataset: &AnalyzedDataset,
    variables: &[String],
) -> f64 {
    let num_pairs =
        (dataset.group_labels.len() * dataset.group_labels.len().saturating_sub(1) / 2) as f64;

    if variables.is_empty() {
        return num_pairs; // Each pair fully unexplained (U_ij = 1)
    }

    let n = dataset.total_cases as f64;
    let g = dataset.num_groups as f64;
    let df_w = n - g;
    if df_w <= 0.0 {
        return num_pairs;
    }

    let mut sum = 0.0;
    for (i, group_i) in dataset.group_labels.iter().enumerate() {
        let values: Vec<f64> = dataset.group_labels[i + 1..]
            .par_iter()
            .map(|group_j| {
                let d2 = calculate_group_mahalanobis_distance(dataset, group_i, group_j, variables);
                let n_i = group_size(dataset, &variables[0], group_i);
                let n_j = group_size(dataset, &variables[0], group_j);
                if n_i > 0.0 && n_j > 0.0 {
                    let t2 = d2 * (n_i * n_j) / (n_i + n_j);
                    df_w / (df_w + t2)
                } else {
                    1.0
                }
            })
            .collect();
        sum += values.iter().sum::<f64>();
    }

    sum
}

/// Helper: number of cases in a group for a given variable (as f64).
fn group_size(dataset: &AnalyzedDataset, variable: &str, group: &str) -> f64 {
    dataset
        .group_data
        .get(variable)
        .and_then(|g| g.get(group))
        .map_or(0.0, |v| v.len() as f64)
}

/// Result containing minimum Mahalanobis distance and the two closest groups
#[derive(Debug, Clone)]
pub struct MinMahalanobisResult {
    /// The minimum squared Mahalanobis distance
    pub min_d2: f64,
    /// First group of the closest pair
    pub group_i: String,
    /// Second group of the closest pair
    pub group_j: String,
    /// Sample size of first group
    pub n_i: usize,
    /// Sample size of second group
    pub n_j: usize,
}

/// Calculate minimum Mahalanobis distance between any two groups
///
/// Mahalanobis distance accounts for correlations in the data and
/// is scale-invariant, making it useful for multivariate analysis.
pub fn calculate_min_mahalanobis_distance(dataset: &AnalyzedDataset, variables: &[String]) -> f64 {
    calculate_min_mahalanobis_distance_with_groups(dataset, variables).min_d2
}

/// Calculate minimum Mahalanobis distance between any two groups with group information
///
/// This version returns detailed information about which groups are closest,
/// which is needed for the Exact F calculation in the Mahalanobis method.
pub fn calculate_min_mahalanobis_distance_with_groups(
    dataset: &AnalyzedDataset,
    variables: &[String],
) -> MinMahalanobisResult {
    if variables.is_empty() || dataset.group_labels.len() < 2 {
        web_sys::console::log_1(&format!("[DEBUG] calculate_min_mahalanobis_distance_with_groups: early exit - vars={:?}, groups={}", variables.len(), dataset.group_labels.len()).into());
        return MinMahalanobisResult {
            min_d2: 0.0,
            group_i: String::new(),
            group_j: String::new(),
            n_i: 0,
            n_j: 0,
        };
    }

    web_sys::console::log_1(
        &format!(
            "[DEBUG] calculate_min_mahalanobis_distance_with_groups: vars={:?}, groups={:?}",
            variables, dataset.group_labels
        )
        .into(),
    );

    let mut min_result = MinMahalanobisResult {
        min_d2: f64::MAX,
        group_i: String::new(),
        group_j: String::new(),
        n_i: 0,
        n_j: 0,
    };

    for (i, group_i) in dataset.group_labels.iter().enumerate() {
        for group_j in &dataset.group_labels[i + 1..] {
            let d = calculate_group_mahalanobis_distance(dataset, group_i, group_j, variables);
            web_sys::console::log_1(
                &format!("[DEBUG] D2({}, {}) = {}", group_i, group_j, d).into(),
            );

            if d < min_result.min_d2 {
                // Get group sizes
                let n_i = dataset
                    .group_data
                    .get(&variables[0])
                    .and_then(|g| g.get(group_i))
                    .map_or(0, |v| v.len());

                let n_j = dataset
                    .group_data
                    .get(&variables[0])
                    .and_then(|g| g.get(group_j))
                    .map_or(0, |v| v.len());

                min_result = MinMahalanobisResult {
                    min_d2: d,
                    group_i: group_i.clone(),
                    group_j: group_j.clone(),
                    n_i,
                    n_j,
                };
            }
        }
    }

    web_sys::console::log_1(
        &format!(
            "[DEBUG] Min D2 = {} between groups {} ({}) and {} ({})",
            min_result.min_d2,
            min_result.group_i,
            min_result.n_i,
            min_result.group_j,
            min_result.n_j
        )
        .into(),
    );

    min_result
}

/// Result of the smallest-F-ratio search: the minimum pairwise F and which pair.
#[derive(Debug, Clone)]
pub struct MinFRatioResult {
    /// Minimum F ratio across all group pairs
    pub min_f: f64,
    /// First group of the pair achieving the minimum
    pub group_i: String,
    /// Second group of the pair achieving the minimum
    pub group_j: String,
}

/// Calculate minimum F ratio between any two groups, tracking the pair.
///
/// Per-pair F: F_ij = D²_ij · (N-g-p+1) · n_i·n_j / (p · (N-g) · (n_i+n_j)),
/// distributed as F(p, N-g-p+1). SPSS's Smallest F Ratio method reports the
/// minimum of these and the "Between Groups" pair that achieves it.
pub fn calculate_min_f_ratio_with_groups(
    dataset: &AnalyzedDataset,
    variables: &[String],
) -> MinFRatioResult {
    let empty = MinFRatioResult {
        min_f: 0.0,
        group_i: String::new(),
        group_j: String::new(),
    };
    if variables.is_empty() || dataset.group_labels.len() < 2 {
        return empty;
    }

    let p = variables.len() as f64;
    let n = dataset.total_cases as f64;
    let g = dataset.num_groups as f64;

    let mut best = MinFRatioResult {
        min_f: f64::MAX,
        group_i: String::new(),
        group_j: String::new(),
    };

    for (i, group_i) in dataset.group_labels.iter().enumerate() {
        for group_j in &dataset.group_labels[i + 1..] {
            let d2 = calculate_group_mahalanobis_distance(dataset, group_i, group_j, variables);
            let n_i = group_size(dataset, &variables[0], group_i);
            let n_j = group_size(dataset, &variables[0], group_j);
            if n_i > 0.0 && n_j > 0.0 && p > 0.0 && (n - g) > 0.0 {
                let f =
                    (d2 * (n - g - p + 1.0) * (n_i * n_j)) / (p * (n - g) * (n_i + n_j));
                if f < best.min_f {
                    best = MinFRatioResult {
                        min_f: f,
                        group_i: group_i.clone(),
                        group_j: group_j.clone(),
                    };
                }
            }
        }
    }

    if best.min_f == f64::MAX {
        empty
    } else {
        best
    }
}

/// Calculate minimum F ratio between any two groups (value only).
pub fn calculate_min_f_ratio(dataset: &AnalyzedDataset, variables: &[String]) -> f64 {
    calculate_min_f_ratio_with_groups(dataset, variables).min_f
}

/// Calculate Mahalanobis distance between two groups
///
/// Uses the pooled within-groups covariance matrix from ALL groups in the dataset,
/// matching SPSS's discriminant analysis implementation.
fn calculate_group_mahalanobis_distance(
    dataset: &AnalyzedDataset,
    group_i: &str,
    group_j: &str,
    variables: &[String],
) -> f64 {
    if variables.is_empty() {
        web_sys::console::log_1(&format!("[DEBUG] calc_group_mahal: empty vars").into());
        return 0.0;
    }

    web_sys::console::log_1(
        &format!(
            "[DEBUG] calc_group_mahal: groups={}, {}, vars={:?}",
            group_i, group_j, variables
        )
        .into(),
    );

    // Extract means for both groups as vectors
    let mut mean_diff = DVector::zeros(variables.len());

    for (idx, var) in variables.iter().enumerate() {
        let mean_i = dataset
            .group_means
            .get(group_i)
            .and_then(|m| m.get(var))
            .copied()
            .unwrap_or(0.0);
        let mean_j = dataset
            .group_means
            .get(group_j)
            .and_then(|m| m.get(var))
            .copied()
            .unwrap_or(0.0);
        let diff = mean_i - mean_j;
        mean_diff[idx] = diff;
        web_sys::console::log_1(
            &format!(
                "[DEBUG] mean_diff[{}] {} - {} = {}",
                idx, mean_i, mean_j, diff
            )
            .into(),
        );
    }

    // Use pooled within-groups covariance from ALL groups (matches SPSS)
    let pooled_cov = calculate_pooled_within_matrix_no_epsilon(dataset, variables);
    web_sys::console::log_1(
        &format!(
            "[DEBUG] pooled_cov shape: {}x{}",
            pooled_cov.nrows(),
            pooled_cov.ncols()
        )
        .into(),
    );

    // Add small regularization for numerical stability before inversion
    let mut reg_cov = pooled_cov.clone();
    for i in 0..variables.len() {
        reg_cov[(i, i)] += EPSILON;
    }

    // Calculate Mahalanobis distance: D² = δ' * S⁻¹ * δ
    match reg_cov.try_inverse() {
        Some(inv_cov) => {
            let d2 = (mean_diff.transpose() * (&inv_cov * mean_diff))[0];
            web_sys::console::log_1(
                &format!(
                    "[DEBUG] D2({} vs {}) = {} (fallback=false)",
                    group_i, group_j, d2
                )
                .into(),
            );
            d2
        }
        None => {
            let d2 = mean_diff.norm_squared();
            web_sys::console::log_1(
                &format!(
                    "[DEBUG] D2({} vs {}) = {} (fallback=true)",
                    group_i, group_j, d2
                )
                .into(),
            );
            d2
        }
    }
}

/// Calculate Rao's V statistic
///
/// Rao's V (Lawley-Hotelling Trace) is a multivariate test statistic
/// that measures the separation between group means.
pub fn calculate_raos_v(dataset: &AnalyzedDataset, variables: &[String]) -> f64 {
    if variables.is_empty() {
        return 0.0;
    }

    // Calculate between-groups and within-groups matrices
    let (between_mat, within_mat) = calculate_between_within_matrices(dataset, variables);

    // Try to invert within-groups matrix
    // within_mat = S_pooled = W_SS / (n-k), so w_inv = S_pooled^{-1}
    // trace = tr(S_pooled^{-1} * B) = SPSS Rao's V directly
    // Do NOT divide by (n-k) again — that would give V/(n-k), not V.
    match within_mat.clone().try_inverse() {
        Some(w_inv) => {
            let product = w_inv * between_mat;
            (0..variables.len()).map(|i| product[(i, i)]).sum()
        }
        None => {
            // Fallback: singular matrix
            (0..variables.len()).map(|i| between_mat[(i, i)]).sum()
        }
    }
}
