//! Statistical tests for discriminant analysis.
//!
//! This module implements various statistical tests used in discriminant analysis,
//! including univariate F tests, Wilks' Lambda, and tolerance calculations.

use rayon::prelude::*;
use nalgebra::{DMatrix, DVector};

use crate::{
    models::{ result::WilksLambdaTest, AnalysisData, DiscriminantConfig },
    stats::core::{ calculate_correlation, AnalyzedDataset, EPSILON },
};

use super::core::{
    calculate_between_within_matrices,
    calculate_eigen_statistics,
    calculate_p_value_from_chi_square,
    extract_analyzed_dataset,
    get_stepwise_selected_variables,
};

/// Calculate univariate F test for a variable
///
/// This tests the null hypothesis that the means of a variable are equal
/// across all groups, using the F-statistic.
///
/// # Parameters
/// * `variable` - The variable to test
/// * `dataset` - The analyzed dataset containing group data and means
///
/// # Returns
/// A tuple of (F value, Wilks' lambda)
pub fn calculate_univariate_f(variable: &str, dataset: &AnalyzedDataset) -> (f64, f64) {
    // Extract variable data
    let overall_mean = *dataset.overall_means.get(variable).unwrap_or(&0.0);

    // Calculate between-groups and within-groups sums of squares
    let mut between_ss = 0.0;
    let mut within_ss = 0.0;
    let mut valid_groups = 0;
    let mut valid_cases = 0;

    for group_label in &dataset.group_labels {
        if
            let Some(group_values) = dataset.group_data
                .get(variable)
                .and_then(|g| g.get(group_label))
        {
            if group_values.is_empty() {
                continue;
            }

            valid_groups += 1;
            valid_cases += group_values.len();

            let group_mean = dataset.group_means
                .get(group_label)
                .and_then(|m| m.get(variable))
                .copied()
                .unwrap_or(0.0);

            // Between-groups SS
            between_ss += (group_values.len() as f64) * (group_mean - overall_mean).powi(2);

            // Within-groups SS
            within_ss += group_values
                .iter()
                .map(|&val| (val - group_mean).powi(2))
                .sum::<f64>();
        }
    }

    // Calculate F statistic
    let f_value = if within_ss > 0.0 && valid_groups > 1 {
        let between_df = valid_groups - 1;
        let within_df = valid_cases - valid_groups;

        between_ss / (between_df as f64) / (within_ss / (within_df as f64))
    } else {
        0.0
    };

    // Calculate Wilks' lambda
    let wilks_lambda = if between_ss + within_ss > 0.0 {
        within_ss / (between_ss + within_ss)
    } else {
        1.0
    };

    (f_value, wilks_lambda)
}

/// Calculate overall Wilks' lambda for a set of variables
///
/// Wilks' lambda is the ratio of the within-groups determinant to the total
/// determinant, and measures the proportion of variance not explained by group
/// differences.
///
/// # Parameters
/// * `dataset` - The analyzed dataset containing group data and means
/// * `variables` - The set of variables to include in the calculation
///
/// # Returns
/// The Wilks' lambda value (between 0 and 1)
pub fn calculate_overall_wilks_lambda(dataset: &AnalyzedDataset, variables: &[String]) -> f64 {
    if variables.is_empty() {
        return 1.0;
    }

    // Calculate between-groups and within-groups matrices
    let (between_mat, within_mat) = calculate_between_within_matrices(dataset, variables);

    // Wilks' lambda = |W| / |B + W|
    let within_det = match within_mat.clone().determinant() {
        det if det > 0.0 => { det }
        _ => {
            1.0 // Fallback for singular matrix
        }
    };

    let total_mat = &between_mat + &within_mat;
    let total_det = match total_mat.determinant() {
        det if det > 0.0 => { det }
        _ => {
            1.0 // Fallback for singular matrix
        }
    };

    let lambda = if total_det > 0.0 { within_det / total_det } else { 1.0 };

    lambda
}

/// Calculate overall F statistic for a set of variables
///
/// This approximates the significance of Wilks' lambda using Rao's F approximation.
///
/// The F statistic is calculated as:
/// F = ((1 - Λ^(1/s)) / Λ^(1/s)) × ((n - g - p + 1) / (p × (g - 1)))
///
/// Where:
/// - Λ = Wilks' Lambda
/// - s = sqrt((p² × (g-1)² - 4) / (p² + (g-1)² - 5))
/// - p = number of variables
/// - g = number of groups
/// - n = total number of cases
///
/// This is the Rao's approximate F-test for Wilks' Lambda.
///
/// # Parameters
/// * `wilks_lambda` - The Wilks' lambda value
/// * `num_variables` - Number of variables in the model
/// * `num_groups` - Number of groups
/// * `total_cases` - Total number of cases
///
/// # Returns
/// A tuple of (F value, df1, df2)
pub fn calculate_overall_f_statistic(
    wilks_lambda: f64,
    num_variables: usize,
    num_groups: usize,
    total_cases: usize
) -> (f64, i32, i32) {
    let p = num_variables as f64;
    let g = num_groups as f64;
    let n = total_cases as f64;

    // Calculate s for the approximation
    // s = sqrt((p*(g-1))² - 4) / (p + (g-1) - 2)) if applicable
    let denominator = p.powi(2) + (g - 1.0).powi(2) - 5.0;
    let s = if denominator > EPSILON {
        ((p * (g - 1.0)).powi(2) - 4.0 / denominator).sqrt()
    } else {
        1.0
    };

    // Calculate df1 and df2
    // df1 = p * (g - 1)
    // df2 = s * (n - g - (p + g) / 2 + 1) or similar approximation
    let df1 = (p * (g - 1.0)).round() as i32;

    // For the denominator df, use the formula: df2 = s * (n - g - p/2 + 1)
    // or a simpler approximation based on sample size
    let temp_df2 = n - g - p / 2.0 + 1.0;
    let df2 = if s > EPSILON {
        (s * temp_df2).round() as i32
    } else {
        (temp_df2 * 2.0).round() as i32
    };

    // Calculate F statistic using Rao's approximation
    let f_value = if wilks_lambda > EPSILON && wilks_lambda < 1.0 - EPSILON && df1 > 0 && df2 > 0 {
        let lambda_power = wilks_lambda.powf(1.0 / s);
        let numerator = (1.0 - lambda_power) * (df2 as f64);
        let denominator = lambda_power * (df1 as f64);
        if denominator > EPSILON {
            numerator / denominator
        } else {
            0.0
        }
    } else if wilks_lambda <= EPSILON {
        // Handle extreme case of perfect discrimination
        f64::MAX
    } else {
        // Handle wilks_lambda close to 1 (no discrimination)
        0.0
    };

    (f_value, df1, df2)
}

/// Calculate tolerance for a variable
///
/// Tolerance measures the proportion of a variable's variance that is not
/// explained by the other independent variables in the model. Low tolerance
/// indicates multicollinearity.
///
/// This implementation uses the **multivariate** approach: regress the target
/// variable on ALL other variables simultaneously, then compute
/// tolerance = 1 - R² (where R² is from that multivariate regression).
///
/// This matches SPSS's "Tolerance" column in stepwise output.
///
/// # Parameters
/// * `variable` - The variable to test
/// * `dataset` - The analyzed dataset containing group data and means
/// * `other_variables` - Other variables already in the model
///
/// # Returns
/// A tuple of (tolerance, minimum tolerance)
pub fn calculate_tolerance(
    variable: &str,
    dataset: &AnalyzedDataset,
    other_variables: &[String]
) -> (f64, f64) {
    if other_variables.is_empty() {
        return (1.0, 1.0);
    }

    // Collect ALL observation vectors: target + all predictors
    let num_preds = other_variables.len();
    let mut all_values: Vec<Vec<f64>> = Vec::new();

    // Row 0 = target variable
    all_values.push(collect_variable_values(dataset, variable));

    // Rows 1..k = each predictor in other_variables
    for pred in other_variables {
        all_values.push(collect_variable_values(dataset, pred));
    }

    // Determine common length across all rows
    let n = all_values.iter().map(|v| v.len()).min().unwrap_or(0);
    if n <= num_preds {
        return (0.0, 0.0);
    }

    // Truncate all rows to n observations (already matching by construction)
    for row in &mut all_values {
        row.truncate(n);
    }

    let target_row = &all_values[0];
    let predictor_rows = &all_values[1..];

    // Build design matrix X [n x (p+1)] with intercept column
    let mut x_data: Vec<f64> = Vec::with_capacity(n * (num_preds + 1));
    for i in 0..n {
        x_data.push(1.0); // intercept
        for pred_row in predictor_rows {
            x_data.push(pred_row[i]);
        }
    }
    let x_matrix = DMatrix::from_vec(n, num_preds + 1, x_data);

    // Target vector y
    let y_vector = DVector::from_vec(target_row.clone());

    // Compute R² via OLS: b = (X'X)^-1 X'y
    // then R² = 1 - RSS/TSS
    let xt = x_matrix.transpose();
    let xtx = &xt * &x_matrix;

    // Add regularization for numerical stability
    let mut xtx_reg = xtx.clone();
    for i in 0..xtx_reg.ncols() {
        xtx_reg[(i, i)] += EPSILON;
    }

    let r_squared = match xtx_reg.try_inverse() {
        Some(xtx_inv) => {
            let xty = &xt * &y_vector;
            let b = &xtx_inv * &xty;     // coefficients [p+1]
            let y_hat = &x_matrix * &b;   // predicted values
            let y_mean = y_vector.mean();

            // TSS = Σ(y_i - ȳ)²
            let tss: f64 = y_vector.iter()
                .map(|&y| (y - y_mean).powi(2))
                .sum();

            // RSS = Σ(y_i - ŷ_i)²
            let rss: f64 = y_vector.iter()
                .zip(y_hat.iter())
                .map(|(y, yh)| (y - yh).powi(2))
                .sum();

            if tss > EPSILON { 1.0 - (rss / tss) } else { 0.0 }
        }
        None => {
            // Fallback: use bivariate R² with the strongest predictor
            let mut max_r2 = 0.0_f64;
            for pred_row in predictor_rows {
                let r = calculate_correlation(target_row, pred_row);
                let r2 = r.powi(2);
                if r2 > max_r2 { max_r2 = r2; }
            }
            max_r2
        }
    };

    let tolerance = 1.0 - r_squared;
    // min_tolerance = the variable's own multivariate tolerance
    let min_tolerance = tolerance;

    (tolerance, min_tolerance)
}

/// Collect all observation values for a variable across all groups.
/// Returns a flat Vec<f64> of all observations.
fn collect_variable_values(dataset: &AnalyzedDataset, variable: &str) -> Vec<f64> {
    let mut values = Vec::new();
    for group_label in &dataset.group_labels {
        if let Some(vals) = dataset.group_data.get(variable).and_then(|g| g.get(group_label)) {
            values.extend(vals.iter().copied());
        }
    }
    values
}

/// Calculate Wilks' lambda test for discriminant functions
///
/// This function tests the significance of discriminant functions by calculating
/// Wilks' lambda and related chi-square statistics.
///
/// # Parameters
/// * `data` - The analysis data
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A WilksLambdaTest object with test statistics and significance values
pub fn calculate_wilks_lambda_test(
    data: &AnalysisData,
    config: &DiscriminantConfig
) -> Result<WilksLambdaTest, String> {
    // Extract analyzed dataset
    let dataset = match extract_analyzed_dataset(data, config) {
        Ok(ds) => { ds }
        Err(e) => {
            return Err(e);
        }
    };

    // Get eigen statistics
    let eigen_stats = match calculate_eigen_statistics(data, config) {
        Ok(stats) => { stats }
        Err(e) => {
            return Err(e);
        }
    };

    let num_functions = eigen_stats.eigenvalue.len();

    // Initialize result structures
    let mut test_of_functions = Vec::with_capacity(num_functions);
    let mut wilks_lambda = Vec::with_capacity(num_functions);
    let mut chi_square = Vec::with_capacity(num_functions);
    let mut df = Vec::with_capacity(num_functions);
    let mut significance = Vec::with_capacity(num_functions);

    let grouping_var = &config.main.grouping_variable;
    let variables: Vec<String> = if config.main.stepwise {
        get_stepwise_selected_variables(data, config)?
    } else {
        config.main.independent_variables.iter().filter(|v| *v != grouping_var).cloned().collect()
    };

    let p = variables.len() as i32;
    let g = dataset.num_groups as i32;
    let n = dataset.total_cases as f64;

    // Test each function and remaining functions
    for k in 0..num_functions {
        // Test description (e.g., "1 through 3", "2 through 3", etc.)
        let test_desc = if k == 0 {
            format!("1 through {}", num_functions)
        } else {
            format!("{} through {}", k + 1, num_functions)
        };

        test_of_functions.push(test_desc.clone());

        // Calculate Wilks' lambda for remaining functions
        // Lambda_k = Product(1/(1+lambda_i)) for i = k+1 to m
        let lambda_k = eigen_stats.eigenvalue
            .iter()
            .skip(k)
            .fold(1.0, |prod, &eigen| prod * (1.0 / (1.0 + eigen)));

        wilks_lambda.push(lambda_k);

        // Calculate chi-square approximation using Bartlett's formula
        // χ² = -[n - (p + g + 1)/2] × ln(Λ)
        // Note: Using (p + g + 1) / 2, not (p + g) / 2
        let chi_square_val = -(n - ((p + g) as f64 + 1.0) / 2.0) * lambda_k.ln();

        chi_square.push(chi_square_val);

        // Calculate degrees of freedom
        // df = (p-k)(g-k-1)
        let degrees_of_freedom = (p - (k as i32)) * (g - (k as i32) - 1);

        df.push(degrees_of_freedom);

        // Calculate p-value
        let p_value = calculate_p_value_from_chi_square(
            chi_square_val,
            degrees_of_freedom as usize
        );

        significance.push(p_value);
    }

    Ok(WilksLambdaTest {
        test_of_functions,
        wilks_lambda,
        chi_square,
        df,
        significance,
    })
}
