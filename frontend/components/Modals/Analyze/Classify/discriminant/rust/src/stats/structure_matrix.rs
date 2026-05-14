use std::collections::HashMap;

use crate::models::{result::StructureMatrix, AnalysisData, DiscriminantConfig};

use super::core::{
    calculate_canonical_functions,
    calculate_eigen_statistics,
    extract_analyzed_dataset,
    EPSILON,
};

/// Calculate structure matrix for discriminant functions
///
/// This function calculates the pooled within-groups correlations between
/// each original variable and each discriminant function (structure loadings).
///
/// The structure loading formula (SPSS convention):
///   Loading(X_i, Z_m) = Cov(X_i, Z_m) / StdDev(X_i)
/// where:
///   Z_m = sum_k(b_k[m] * X_k)  — the m-th discriminant function
///   Cov(X_i, Z_m) = sum_k(S_pooled[i][k] * b_k[m])
///                 — row-i of pooled covariance matrix dot column-m of unstandardized coefs
///
/// # Parameters
/// * `data` - The analysis data
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A StructureMatrix object with correlations between variables and functions
pub fn calculate_structure_matrix(
    data: &AnalysisData,
    config: &DiscriminantConfig,
) -> Result<StructureMatrix, String> {
    web_sys::console::log_1(&"Executing calculate_structure_matrix".into());

    // IMPORTANT: Filter out the grouping variable — same filter used in
    // calculate_canonical_functions and calculate_eigen_statistics so that
    // the coefficient lookups succeed (no key mismatch).
    let grouping_var = &config.main.grouping_variable;
    let variables: Vec<String> = config
        .main
        .independent_variables
        .iter()
        .filter(|v| *v != grouping_var)
        .cloned()
        .collect();

    let num_vars = variables.len();
    if num_vars == 0 {
        return Err("No independent variables found after filtering grouping variable.".into());
    }

    // Get canonical functions and eigen statistics
    let canonical_functions = calculate_canonical_functions(data, config)?;
    let eigen_stats = calculate_eigen_statistics(data, config)?;
    let num_functions = eigen_stats.eigenvalue.len();

    if num_functions == 0 {
        return Ok(StructureMatrix {
            variables,
            correlations: HashMap::new(),
        });
    }

    // --- STEP 1: Compute pooled within-groups covariance matrix (S_pooled) ---
    // Use extract_analyzed_dataset to get properly structured data — this gives us
    // variable values organized as HashMap<String, HashMap<String, Vec<f64>>>
    // where outer key = variable name, inner key = group label
    let dataset = extract_analyzed_dataset(data, config)?;

    let mut w_matrix = vec![vec![0.0; num_vars]; num_vars];
    let mut total_df = 0.0;

    for group_label in &dataset.group_labels {
        // Get values for this group per variable
        let mut g_values: Vec<&[f64]> = Vec::with_capacity(num_vars);
        for var_name in &variables {
            if let Some(vals) = dataset.group_data.get(var_name).and_then(|g| g.get(group_label)) {
                g_values.push(vals.as_slice());
            } else {
                g_values.push(&[]);
            }
        }

        let actual_n = g_values.get(0).map(|v| v.len()).unwrap_or(0);
        if actual_n <= 1 {
            continue;
        }

        let df = (actual_n - 1) as f64;
        total_df += df;

        // Compute group means
        let mut g_means = vec![0.0; num_vars];
        for var_idx in 0..num_vars {
            if !g_values[var_idx].is_empty() {
                g_means[var_idx] = g_values[var_idx].iter().sum::<f64>() / (actual_n as f64);
            }
        }

        // Accumulate sum of squares and cross-products: Σ (x_i - x̄_i)(x_j - x̄_j)
        for i in 0..num_vars {
            for j in 0..num_vars {
                let vals_i = g_values[i];
                let vals_j = g_values[j];
                let mut sum = 0.0;
                for k in 0..actual_n {
                    let di = vals_i[k] - g_means[i];
                    let dj = vals_j[k] - g_means[j];
                    sum += di * dj;
                }
                // Weight by df (equivalent to �� (n_g-1) * cov_g for each group)
                w_matrix[i][j] += df * sum;
            }
        }
    }

    if total_df <= 0.0 {
        return Err("Insufficient degrees of freedom to calculate pooled covariance.".into());
    }

    // Divide by total df to get pooled covariance matrix
    let mut s_pooled = vec![vec![0.0; num_vars]; num_vars];
    let mut std_devs = vec![0.0; num_vars];

    for i in 0..num_vars {
        for j in 0..num_vars {
            s_pooled[i][j] = w_matrix[i][j] / total_df;
        }
        // Pooled std dev of variable X_i is sqrt of pooled variance
        std_devs[i] = s_pooled[i][i].sqrt();
    }

    // --- STEP 2: Compute structure loadings via direct algebra ---
    // For variable X_i and discriminant function Z_m:
    //   Cov(X_i, Z_m) = sum_k( S_pooled[i][k] * b_k[m] )
    //   Loading = Cov(X_i, Z_m) / StdDev(X_i)
    let mut correlations = HashMap::new();

    for i in 0..num_vars {
        let mut var_correlations = Vec::with_capacity(num_functions);

        for m in 0..num_functions {
            let mut cov_xz = 0.0;

            for k in 0..num_vars {
                let var_k_name = &variables[k];
                if let Some(coefs) = canonical_functions.coefficients.get(var_k_name) {
                    if m < coefs.len() {
                        // Row i of S_pooled dot column m of unstandardized coefficients (b)
                        cov_xz += s_pooled[i][k] * coefs[m];
                    }
                }
            }

            // Structure loading: Cov(X_i, Z_m) / StdDev(X_i)
            let loading = if std_devs[i] > EPSILON {
                cov_xz / std_devs[i]
            } else {
                0.0
            };

            var_correlations.push(loading);
        }

        correlations.insert(variables[i].clone(), var_correlations);
    }

    Ok(StructureMatrix {
        variables,
        correlations,
    })
}