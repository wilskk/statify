//! Canonical discriminant functions calculation.
//!
//! This module implements the computation of canonical discriminant functions,
//! which are linear combinations of the original variables that maximize
//! the separation between groups.

use nalgebra::DMatrix;
use rayon::prelude::*;
use std::collections::HashMap;

use crate::models::{
    result::{CanonicalFunctions, EigenDescription},
    AnalysisData, DiscriminantConfig,
};

use super::core::{
    calculate_pooled_within_matrix, calculate_stepwise_statistics, extract_analyzed_dataset,
    AnalyzedDataset, EPSILON,
};

/// Calculate eigenvalues and eigenvectors for discriminant functions
///
/// This function solves the eigenvalue problem to find the discriminant functions
/// that maximize the separation between groups.
///
/// # Parameters
/// * `data` - The analysis data
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// An EigenDescription containing eigenvalues, eigenvectors, and related statistics
pub fn calculate_eigen_statistics(
    data: &AnalysisData,
    config: &DiscriminantConfig,
) -> Result<EigenDescription, String> {
    web_sys::console::log_1(&"Executing calculate_eigen_statistics".into());

    // Extract analyzed dataset
    let dataset = extract_analyzed_dataset(data, config)?;

    // Exclude grouping variable from canonical function calculation
    let grouping_var = &config.main.grouping_variable;
    let variables_to_use: Vec<String> = config
        .main
        .independent_variables
        .iter()
        .filter(|v| *v != grouping_var)
        .cloned()
        .collect();

    // Calculate number of discriminant functions
    let num_functions = std::cmp::min(dataset.num_groups - 1, variables_to_use.len());

    if num_functions == 0 {
        return Err("Not enough groups or variables for canonical functions".to_string());
    }

    // Calculate pooled within-groups matrix
    let pooled_within = calculate_pooled_within_matrix(&dataset, &variables_to_use);

    // Calculate between-groups matrix
    let between_groups = calculate_between_groups_matrix(&dataset, &variables_to_use);

    // Solve eigenvalue problem
    let (eigenvalues, eigenvectors) =
        solve_eigenvalue_problem(&pooled_within, &between_groups, num_functions);

    // Calculate variance statistics
    let (variance_percentage, cumulative_percentage) = calculate_variance_percentages(&eigenvalues);

    // Calculate canonical correlations
    let canonical_correlation: Vec<f64> = eigenvalues
        .iter()
        .map(|&eigen| {
            let corr = (eigen / (1.0 + eigen)).sqrt();
            if corr.is_nan() {
                0.0
            } else {
                corr
            }
        })
        .collect();

    // Flatten the eigenvectors matrix into a single vector for storage
    let flat_eigenvectors: Vec<f64> = eigenvectors
        .iter()
        .flat_map(|vec| vec.iter().copied())
        .collect();

    // Create function names (Function 1, Function 2, etc.)
    let functions: Vec<String> = (1..=num_functions)
        .map(|i| format!("Function {}", i))
        .collect();

    Ok(EigenDescription {
        functions,
        eigenvalue: eigenvalues,
        eigenvector: flat_eigenvectors,
        variance_percentage,
        cumulative_percentage,
        canonical_correlation,
    })
}

/// Calculate canonical discriminant functions
///
/// This function calculates the coefficients for the canonical discriminant functions
/// and the function values at group centroids.
///
/// # Parameters
/// * `data` - The analysis data
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A CanonicalFunctions object containing coefficients and function values
pub fn calculate_canonical_functions(
    data: &AnalysisData,
    config: &DiscriminantConfig,
) -> Result<CanonicalFunctions, String> {
    web_sys::console::log_1(&"Executing calculate_canonical_functions".into());

    // First calculate the eigenvalues and eigenvectors
    let eigen_desc = calculate_eigen_statistics(data, config)?;

    // Extract analyzed dataset
    let dataset = extract_analyzed_dataset(data, config)?;

    // Exclude grouping variable from canonical function calculation
    let grouping_var = &config.main.grouping_variable;
    let variables_to_use: Vec<String> = config
        .main
        .independent_variables
        .iter()
        .filter(|v| *v != grouping_var)
        .cloned()
        .collect();

    // Calculate number of discriminant functions
    let num_functions = std::cmp::min(dataset.num_groups - 1, variables_to_use.len());

    // Reshape the flat eigenvectors back to the original matrix form
    let num_variables = variables_to_use.len();
    let mut eigenvectors = Vec::with_capacity(num_variables);

    for i in 0..num_variables {
        let mut row = Vec::with_capacity(num_functions);
        for j in 0..num_functions {
            let index = i * num_functions + j;
            if index < eigen_desc.eigenvector.len() {
                row.push(eigen_desc.eigenvector[index]);
            } else {
                row.push(0.0); // Fill with zeros if we're out of bounds
            }
        }
        eigenvectors.push(row);
    }

    // Calculate pooled within-groups matrix (needed for coefficients)
    let pooled_within = calculate_pooled_within_matrix(&dataset, &variables_to_use);

    // Process coefficients, standardized coefficients, and constants
    let (coefficients, standardized_coefficients) = process_discriminant_coefficients(
        &eigenvectors,
        &variables_to_use,
        &pooled_within,
        &dataset.overall_means,
        num_functions,
    );

    // Calculate function at group centroids
    let function_at_centroids = calculate_function_at_group_centroids(
        &dataset,
        &eigenvectors,
        &variables_to_use,
        num_functions,
    );

    // Return only the fields defined in the CanonicalFunctions struct from result.rs
    Ok(CanonicalFunctions {
        coefficients,
        standardized_coefficients,
        function_at_centroids,
    })
}

/// Solve the eigenvalue problem for discriminant analysis
///
/// This function solves the eigenvalue problem (T-W)V = λWV to find the eigenvalues
/// and eigenvectors that define the discriminant functions.
///
/// # Parameters
/// * `pooled_within` - The pooled within-groups covariance matrix
/// * `between_groups` - The between-groups covariance matrix
/// * `num_functions` - The number of discriminant functions to calculate
///
/// # Returns
/// A tuple containing (eigenvalues, eigenvectors)
pub fn solve_eigenvalue_problem(
    pooled_within: &DMatrix<f64>,
    between_groups: &DMatrix<f64>,
    num_functions: usize,
) -> (Vec<f64>, Vec<Vec<f64>>) {
    let n = pooled_within.nrows();

    // 1. Hitung W^(-1/2) menggunakan Symmetric Eigen Decomposition (Aman untuk kondisi singular/multikolinear)
    let eigen_w = pooled_within.clone().symmetric_eigen();
    let d_w = eigen_w.eigenvalues;
    let v_w = eigen_w.eigenvectors;

    let mut d_w_inv_sqrt = DMatrix::zeros(n, n);
    for i in 0..n {
        // Gunakan threshold epsilon yang rasional untuk memotong (truncate) zero eigenvalues
        if d_w[i] > 1e-9 {
            d_w_inv_sqrt[(i, i)] = 1.0 / d_w[i].sqrt();
        } else {
            d_w_inv_sqrt[(i, i)] = 0.0; // Mencegah pembagian dengan nol (pseudo-inverse logic)
        }
    }

    // W^(-1/2) = V * D^(-1/2) * V^T
    let w_inv_sqrt = &v_w * &d_w_inv_sqrt * v_w.transpose();

    // 2. Transformasi matriks: W^(-1/2) * B * W^(-1/2)
    let transformed = &w_inv_sqrt * between_groups * &w_inv_sqrt;

    // 3. Dekomposisi eigen dari matriks yang ditransformasi
    let eigen_b = transformed.symmetric_eigen();
    let eigenvalues_raw = eigen_b.eigenvalues;
    let eigenvectors_raw = eigen_b.eigenvectors;

    // nalgebra mengurutkan ascending secara default. Kita butuh descending (dari varians terbesar).
    let mut indices: Vec<usize> = (0..n).collect();
    indices.sort_by(|&i, &j| {
        eigenvalues_raw[j]
            .partial_cmp(&eigenvalues_raw[i])
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    let mut eigenvalues = Vec::with_capacity(num_functions);
    let mut eigenvectors: Vec<Vec<f64>> = vec![vec![0.0; num_functions]; n];

    let actual_functions = num_functions.min(n);

    for func_idx in 0..actual_functions {
        let orig_idx = indices[func_idx];
        eigenvalues.push(eigenvalues_raw[orig_idx]);

        // Ekstraksi kolom vektor eigen yang berkorespondensi
        let transformed_v = eigenvectors_raw.column(orig_idx);

        // Kembalikan ke ruang aslinya: V_original = W^(-1/2) * V_transformed
        let original_v = &w_inv_sqrt * transformed_v;

        for var_idx in 0..n {
            eigenvectors[var_idx][func_idx] = original_v[var_idx];
        }
    }

    (eigenvalues, eigenvectors)
}

/// Calculate the between-groups covariance matrix
///
/// This matrix represents the variance and covariance between group means.
///
/// Note: This is the SSCP (Sum of Squares and Cross Products) matrix, not the covariance.
/// To get the covariance matrix, divide by (n - g).
///
/// # Parameters
/// * `dataset` - The analyzed dataset
/// * `variables` - The variables to include in the matrix
///
/// # Returns
/// The between-groups SSCP matrix
fn calculate_between_groups_matrix(
    dataset: &AnalyzedDataset,
    variables: &[String],
) -> DMatrix<f64> {
    let num_vars = variables.len();
    let mut between_groups = DMatrix::zeros(num_vars, num_vars);

    // Compute the between-groups SSCP matrix
    // Formula: B_ij = Σ n_g × (x̄_gi - x̄_i) × (x̄_gj - x̄_j)
    // This is consistent with the formula in calculate_between_within_matrices

    for (i, var_i) in variables.iter().enumerate() {
        for (j, var_j) in variables.iter().enumerate() {
            let mut sum = 0.0;

            for group in &dataset.group_labels {
                if let (Some(values), Some(group_mean_i), Some(group_mean_j)) = (
                    dataset.group_data.get(var_i).and_then(|g| g.get(group)),
                    dataset.group_means.get(group).and_then(|m| m.get(var_i)),
                    dataset.group_means.get(group).and_then(|m| m.get(var_j)),
                ) {
                    let n = values.len() as f64;
                    if n > 0.0 {
                        let overall_mean_i = dataset.overall_means.get(var_i).unwrap_or(&0.0);
                        let overall_mean_j = dataset.overall_means.get(var_j).unwrap_or(&0.0);
                        sum +=
                            n * (group_mean_i - overall_mean_i) * (group_mean_j - overall_mean_j);
                    }
                }
            }

            between_groups[(i, j)] = sum;
        }
    }

    between_groups
}

/// Process discriminant coefficients
///
/// This function calculates the unstandardized and standardized coefficients
/// for the discriminant functions.
///
/// Standardized coefficients are calculated as:
/// Standardized = Unstandardized × sqrt(pooled_within_covariance[i][i])
///
/// This makes the coefficients comparable across variables with different scales.
///
/// # Parameters
/// * `eigenvectors` - Eigenvectors from the eigenvalue problem
/// * `variables` - Variables in the model
/// * `pooled_within` - Pooled within-groups covariance matrix
/// * `overall_means` - Overall means for each variable
/// * `num_functions` - Number of discriminant functions
///
/// # Returns
/// A tuple of (unstandardized coefficients, standardized coefficients)
pub fn process_discriminant_coefficients(
    eigenvectors: &[Vec<f64>],
    variables: &[String],
    pooled_within: &DMatrix<f64>,
    overall_means: &HashMap<String, f64>,
    num_functions: usize,
) -> (HashMap<String, Vec<f64>>, HashMap<String, Vec<f64>>) {
    let num_vars = variables.len();

    // Extract standard deviations from pooled within-groups covariance matrix diagonal
    // Standardized coefficient = Unstandardized × Pooled_StD
    let std_devs: Vec<f64> = (0..num_vars)
        .map(|i| pooled_within[(i, i)].sqrt())
        .collect();

    // Unstandardized coefficients
    let mut coefficients: HashMap<String, Vec<f64>> = variables
        .iter()
        .enumerate()
        .map(|(var_idx, var)| {
            let coef_values: Vec<f64> = (0..num_functions)
                .map(|func_idx| {
                    if var_idx < eigenvectors.len() && func_idx < eigenvectors[var_idx].len() {
                        eigenvectors[var_idx][func_idx]
                    } else {
                        0.0
                    }
                })
                .collect();
            (var.clone(), coef_values)
        })
        .collect();

    // Standardized coefficients = Unstandardized × Pooled_Within_StD
    // This follows SPSS convention for standardized canonical discriminant function coefficients
    let standardized_coefficients: HashMap<String, Vec<f64>> = variables
        .iter()
        .enumerate()
        .map(|(var_idx, var)| {
            let std_dev = if var_idx < std_devs.len() {
                std_devs[var_idx]
            } else {
                1.0
            };
            let std_coef_values: Vec<f64> = (0..num_functions)
                .map(|func_idx| {
                    if var_idx < eigenvectors.len()
                        && func_idx < eigenvectors[var_idx].len()
                        && std_dev > EPSILON
                    {
                        eigenvectors[var_idx][func_idx] * std_dev
                    } else {
                        0.0
                    }
                })
                .collect();
            (var.clone(), std_coef_values)
        })
        .collect();

    // Calculate constants for each function
    // Constant = -Σ(coef × mean) for each function
    let mut constants = Vec::with_capacity(num_functions);

    for func_idx in 0..num_functions {
        let constant = variables.iter().fold(0.0, |acc, var| {
            if let Some(coef_values) = coefficients.get(var) {
                if func_idx < coef_values.len() {
                    let coef = coef_values[func_idx];
                    let mean = overall_means.get(var).copied().unwrap_or(0.0);
                    acc - coef * mean
                } else {
                    acc
                }
            } else {
                acc
            }
        });
        constants.push(constant);
    }

    // Add constants to the coefficients map
    coefficients.insert("(Constant)".to_string(), constants);

    (coefficients, standardized_coefficients)
}

/// Get variables selected by stepwise procedure
///
/// This function retrieves the variables selected by the stepwise procedure.
///
/// # Parameters
/// * `data` - The analysis data
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A vector of selected variable names
pub fn get_stepwise_selected_variables(
    data: &AnalysisData,
    config: &DiscriminantConfig,
) -> Result<Vec<String>, String> {
    let grouping_var = &config.main.grouping_variable;

    if !config.main.stepwise {
        return Ok(config
            .main
            .independent_variables
            .iter()
            .filter(|v| *v != grouping_var)
            .cloned()
            .collect());
    }

    match calculate_stepwise_statistics(data, config) {
        Ok(stepwise_stats) => {
            let final_step = stepwise_stats
                .variables_in_analysis
                .keys()
                .filter_map(|k| k.parse::<i32>().ok())
                .max()
                .unwrap_or(0)
                .to_string();

            if let Some(vars_in_model) = stepwise_stats.variables_in_analysis.get(&final_step) {
                let selected_vars: Vec<String> =
                    vars_in_model.iter().map(|v| v.variable.clone()).collect();

                if selected_vars.is_empty() {
                    Ok(config
                        .main
                        .independent_variables
                        .iter()
                        .filter(|v| *v != grouping_var)
                        .cloned()
                        .collect())
                } else {
                    Ok(selected_vars)
                }
            } else {
                Ok(config
                    .main
                    .independent_variables
                    .iter()
                    .filter(|v| *v != grouping_var)
                    .cloned()
                    .collect())
            }
        }
        Err(_) => Ok(config
            .main
            .independent_variables
            .iter()
            .filter(|v| *v != grouping_var)
            .cloned()
            .collect()),
    }
}

/// Calculate function values at group centroids
///
/// This function evaluates the discriminant functions at the centroid
/// (mean) of each group.
///
/// # Parameters
/// * `dataset` - The analyzed dataset
/// * `eigenvectors` - Eigenvectors from the eigenvalue problem
/// * `variables` - Variables in the model
/// * `num_functions` - Number of discriminant functions
///
/// # Returns
/// A hashmap of group names to function values
pub fn calculate_function_at_group_centroids(
    dataset: &AnalyzedDataset,
    eigenvectors: &[Vec<f64>],
    variables: &[String],
    num_functions: usize,
) -> HashMap<String, Vec<f64>> {
    let mut function_at_centroids = HashMap::new();

    // Process each group in parallel
    let results: Vec<(String, Vec<f64>)> = dataset
        .group_labels
        .par_iter()
        .map(|group| {
            let mut centroid_values = vec![0.0; num_functions];

            for func_idx in 0..num_functions {
                // First add constant (negative sum of coefficient * overall_mean)
                let constant =
                    variables
                        .iter()
                        .enumerate()
                        .fold(0.0, |acc, (var_idx, variable)| {
                            if var_idx < eigenvectors.len()
                                && func_idx < eigenvectors[var_idx].len()
                            {
                                acc - eigenvectors[var_idx][func_idx]
                                    * dataset.overall_means.get(variable).copied().unwrap_or(0.0)
                            } else {
                                acc
                            }
                        });

                centroid_values[func_idx] = constant;

                // Then add variable contributions
                for (var_idx, variable) in variables.iter().enumerate() {
                    if var_idx < eigenvectors.len() && func_idx < eigenvectors[var_idx].len() {
                        if let Some(group_mean) =
                            dataset.group_means.get(group).and_then(|m| m.get(variable))
                        {
                            centroid_values[func_idx] +=
                                group_mean * eigenvectors[var_idx][func_idx];
                        }
                    }
                }
            }

            (group.clone(), centroid_values)
        })
        .collect();

    // Combine results
    for (group, values) in results {
        function_at_centroids.insert(group, values);
    }

    function_at_centroids
}

/// Calculate variance percentages for discriminant functions
///
/// This function calculates the percentage of variance explained by each
/// discriminant function and the cumulative percentage.
///
/// # Parameters
/// * `eigenvalues` - Eigenvalues from the eigenvalue problem
///
/// # Returns
/// A tuple of (variance percentages, cumulative percentages)
pub fn calculate_variance_percentages(eigenvalues: &[f64]) -> (Vec<f64>, Vec<f64>) {
    let total_eigenvalue: f64 = eigenvalues.iter().sum();

    let variance_percentage: Vec<f64> = if total_eigenvalue > EPSILON {
        eigenvalues
            .iter()
            .map(|&eigen| (100.0 * eigen) / total_eigenvalue)
            .collect()
    } else {
        vec![100.0 / eigenvalues.len() as f64; eigenvalues.len()]
    };

    let mut cumulative_percentage = Vec::with_capacity(eigenvalues.len());
    let mut cumsum = 0.0;
    for percent in &variance_percentage {
        cumsum += percent;
        cumulative_percentage.push(cumsum);
    }

    (variance_percentage, cumulative_percentage)
}
