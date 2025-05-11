//! Statistical tests for discriminant analysis.
//!
//! This module implements various statistical tests used in discriminant analysis,
//! including univariate F tests, Wilks' Lambda, and tolerance calculations.

use rayon::prelude::*;
use web_sys::console;

use crate::discriminant::{
    models::{ result::WilksLambdaTest, AnalysisData, DiscriminantConfig },
    stats::core::{ calculate_correlation, AnalyzedDataset, EPSILON },
};

use super::core::{
    calculate_between_within_matrices,
    calculate_eigen_statistics,
    calculate_p_value_from_chi_square,
    extract_analyzed_dataset,
};

/// Log a message to the console with a tag for easier tracing
fn log_debug(tag: &str, message: &str) {
    console::log_1(&format!("[STATISTICAL][{}] {}", tag, message).into());
}

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
    log_debug("UNIVARIATE_F", &format!("Calculating univariate F test for {}", variable));

    // Extract variable data
    let overall_mean = *dataset.overall_means.get(variable).unwrap_or(&0.0);
    log_debug("MEAN", &format!("Overall mean for {}: {:.4}", variable, overall_mean));

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

    log_debug(
        "SS",
        &format!(
            "{}: Between SS = {:.4}, Within SS = {:.4}, Valid groups = {}, Valid cases = {}",
            variable,
            between_ss,
            within_ss,
            valid_groups,
            valid_cases
        )
    );

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

    log_debug(
        "RESULT",
        &format!("{}: F = {:.4}, Wilks' Lambda = {:.4}", variable, f_value, wilks_lambda)
    );

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
    log_debug(
        "OVERALL_LAMBDA",
        &format!("Calculating overall Wilks' Lambda for {} variables", variables.len())
    );

    if variables.is_empty() {
        log_debug("EMPTY", "No variables provided, returning 1.0");
        return 1.0;
    }

    // Calculate between-groups and within-groups matrices
    log_debug("MATRICES", "Calculating between and within-groups matrices");
    let (between_mat, within_mat) = calculate_between_within_matrices(dataset, variables);

    // Wilks' lambda = |W| / |B + W|
    let within_det = match within_mat.clone().determinant() {
        det if det > 0.0 => {
            log_debug("WITHIN_DET", &format!("Within-groups determinant = {:.4}", det));
            det
        }
        _ => {
            log_debug("WARNING", "Within-groups matrix is singular, using 1.0");
            1.0 // Fallback for singular matrix
        }
    };

    let total_mat = &between_mat + &within_mat;
    let total_det = match total_mat.determinant() {
        det if det > 0.0 => {
            log_debug("TOTAL_DET", &format!("Total determinant = {:.4}", det));
            det
        }
        _ => {
            log_debug("WARNING", "Total matrix is singular, using 1.0");
            1.0 // Fallback for singular matrix
        }
    };

    let lambda = if total_det > 0.0 { within_det / total_det } else { 1.0 };

    log_debug("RESULT", &format!("Overall Wilks' Lambda = {:.4}", lambda));
    lambda
}

/// Calculate overall F statistic for a set of variables
///
/// This approximates the significance of Wilks' lambda using an F approximation.
///
/// # Parameters
/// * `wilks_lambda` - The Wilks' lambda value
/// * `num_variables` - Number of variables in the model
/// * `num_groups` - Number of groups
/// * `total_cases` - Total number of cases
///
/// # Returns
/// A tuple of (F value, df1, df2, df3)
pub fn calculate_overall_f_statistic(
    wilks_lambda: f64,
    num_variables: usize,
    num_groups: usize,
    total_cases: usize
) -> (f64, i32, i32, i32) {
    web_sys::console::log_1(
        &format!(
            "F-statistic calculation: Lambda={}, Variables={}, Groups={}, Cases={}",
            wilks_lambda,
            num_variables,
            num_groups,
            total_cases
        ).into()
    );

    let p = num_variables as f64;
    let g = (num_groups as f64) - 1.0;
    let df1 = (p * g) as i32;
    let df2 = (p as i32) + 1;
    let df3 = ((total_cases as f64) - p - g) as i32;

    // Special case: If there's only one function (p*g = 1), use the exact F
    if p * g == 1.0 {
        // For a single function, F = ((1-lambda)/lambda) * (df3/1)
        let f_value = if wilks_lambda < 1.0 && wilks_lambda > 0.0 {
            ((1.0 - wilks_lambda) / wilks_lambda) * (df3 as f64)
        } else if wilks_lambda <= 0.0 {
            // Handle extreme case of perfect discrimination
            10000.0 // Use a very large value to indicate extreme significance
        } else {
            // Handle wilks_lambda = 1 (no discrimination)
            0.0
        };

        web_sys::console::log_1(
            &format!(
                "Using exact F for single function: F={}, df1={}, df2={}, df3={}",
                f_value,
                df1,
                df2,
                df3
            ).into()
        );

        return (f_value, df1, df2, df3);
    }

    // For multiple functions, use Rao's approximation
    let pgsq_minus_5 = p.powi(2) + g.powi(2) - 5.0;
    let pg_product = p.powi(2) * g.powi(2);

    // Check if we can calculate s safely
    let s = if pgsq_minus_5 > 0.0 && pg_product > 0.0 {
        ((4.0 * pgsq_minus_5) / pg_product).sqrt()
    } else {
        // Fall back to default if calculation would fail
        web_sys::console::log_1(
            &"Cannot calculate S safely (negative or zero value in sqrt). Using s=1.0".into()
        );
        1.0
    };

    let r = (total_cases as f64) - 1.0 - (p + g) / 2.0;

    // Calculate F value
    let f_value = if wilks_lambda < 1.0 && wilks_lambda > 0.0 && !s.is_nan() {
        let lambda_powered = wilks_lambda.powf(1.0 / s);
        if lambda_powered > 0.0 {
            ((1.0 - lambda_powered) / lambda_powered) * (r / p)
        } else {
            // Handle extreme case
            10000.0
        }
    } else if wilks_lambda <= 0.0 {
        // Handle extreme case of perfect discrimination
        10000.0
    } else {
        // Handle wilks_lambda = 1 (no discrimination)
        0.0
    };

    web_sys::console::log_1(
        &format!(
            "Rao's approximation: S={}, R={}, F={}, df1={}, df2={}, df3={}",
            s,
            r,
            f_value,
            df1,
            df2,
            df3
        ).into()
    );

    (f_value, df1, df2, df3)
}

/// Calculate tolerance for a variable
///
/// Tolerance measures the proportion of a variable's variance that is not
/// explained by the other independent variables in the model. Low tolerance
/// indicates multicollinearity.
///
/// # Parameters
/// * `variable` - The variable to test
/// * `dataset` - The analyzed dataset containing group data and means
/// * `other_variables` - Other variables in the model
///
/// # Returns
/// A tuple of (tolerance, minimum tolerance)
pub fn calculate_tolerance(
    variable: &str,
    dataset: &AnalyzedDataset,
    other_variables: &[String]
) -> (f64, f64) {
    log_debug(
        "TOLERANCE",
        &format!(
            "Calculating tolerance for {} with {} other variables",
            variable,
            other_variables.len()
        )
    );

    if other_variables.is_empty() {
        log_debug("EMPTY", "No other variables, returning tolerance = 1.0");
        return (1.0, 1.0);
    }

    // Extract values for target variable
    let mut target_values = Vec::new();

    for group_label in &dataset.group_labels {
        if let Some(values) = dataset.group_data.get(variable).and_then(|g| g.get(group_label)) {
            target_values.extend(values.iter().copied());
        }
    }

    if target_values.is_empty() {
        log_debug("ERROR", "No values found for target variable");
        return (0.0, 0.0);
    }

    log_debug("VALUES", &format!("Found {} values for target variable", target_values.len()));

    // Calculate R² between this variable and others
    if other_variables.len() == 1 {
        // Simple case with one predictor - calculate correlation coefficient
        let other_var = &other_variables[0];
        log_debug("SINGLE", &format!("Simple case: calculating correlation with {}", other_var));

        let mut other_values = Vec::new();

        for group_label in &dataset.group_labels {
            if
                let Some(values) = dataset.group_data
                    .get(other_var)
                    .and_then(|g| g.get(group_label))
            {
                other_values.extend(values.iter().copied());
            }
        }

        if other_values.len() == target_values.len() && !other_values.is_empty() {
            let r = calculate_correlation(&target_values, &other_values);
            let r_squared = r.powi(2);
            let tolerance = 1.0 - r_squared;
            let min_tolerance = tolerance * 0.8; // 80% of current tolerance

            log_debug(
                "RESULT",
                &format!(
                    "Correlation = {:.4}, R² = {:.4}, Tolerance = {:.4}",
                    r,
                    r_squared,
                    tolerance
                )
            );

            return (tolerance, min_tolerance);
        } else {
            log_debug("ERROR", "Length mismatch between target and predictor values");
        }
    }

    // Multiple predictors - more accurate computation with parallelism
    log_debug("MULTIPLE", "Multiple predictors: calculating R² with each predictor");

    let r_squared_values: Vec<f64> = other_variables
        .par_iter()
        .filter_map(|other_var| {
            let mut other_values = Vec::new();

            for group_label in &dataset.group_labels {
                if
                    let Some(values) = dataset.group_data
                        .get(other_var)
                        .and_then(|g| g.get(group_label))
                {
                    other_values.extend(values.iter().copied());
                }
            }

            if other_values.len() == target_values.len() && !other_values.is_empty() {
                let r = calculate_correlation(&target_values, &other_values);
                Some(r.powi(2))
            } else {
                None
            }
        })
        .collect();

    // Use maximum correlation for tolerance
    let max_r_squared = r_squared_values
        .iter()
        .fold(0.0, |max_val, &val| (max_val as f64).max(val));
    let tolerance = 1.0 - max_r_squared;
    let min_tolerance = tolerance * 0.8; // 80% of current tolerance

    log_debug(
        "RESULT",
        &format!(
            "Found {} valid correlations, max R² = {:.4}, Tolerance = {:.4}",
            r_squared_values.len(),
            max_r_squared,
            tolerance
        )
    );

    (tolerance, min_tolerance)
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
    log_debug("WILKS_TEST", "Calculating Wilks' Lambda test for discriminant functions");

    // Extract analyzed dataset
    log_debug("EXTRACT", "Extracting analyzed dataset");
    let dataset = match extract_analyzed_dataset(data, config) {
        Ok(ds) => {
            log_debug(
                "DATASET",
                &format!("Dataset extracted: {} groups, {} cases", ds.num_groups, ds.total_cases)
            );
            ds
        }
        Err(e) => {
            log_debug("ERROR", &format!("Failed to extract dataset: {}", e));
            return Err(e);
        }
    };

    // Get eigen statistics
    log_debug("EIGEN", "Calculating eigenvalue statistics");
    let eigen_stats = match calculate_eigen_statistics(data, config) {
        Ok(stats) => {
            log_debug("EIGENVALUES", &format!("Found {} eigenvalues", stats.eigenvalue.len()));
            stats
        }
        Err(e) => {
            log_debug("ERROR", &format!("Failed to calculate eigen statistics: {}", e));
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

    let variables = &config.main.independent_variables;
    let p = variables.len() as i32;
    let g = dataset.num_groups as i32;
    let n = dataset.total_cases as f64;

    log_debug(
        "PARAMS",
        &format!("Test parameters: variables p={}, groups g={}, cases n={}", p, g, n)
    );

    // Test each function and remaining functions
    for k in 0..num_functions {
        log_debug("FUNCTION", &format!("Testing function/s from {}", k + 1));

        // Test description (e.g., "1 through 3", "2 through 3", etc.)
        let test_desc = if k == 0 {
            format!("1 through {}", num_functions)
        } else {
            format!("{} through {}", k + 1, num_functions)
        };

        test_of_functions.push(test_desc.clone());
        log_debug("TEST", &test_desc);

        // Calculate Wilks' lambda for remaining functions
        // Lambda_k = Product(1/(1+lambda_i)) for i = k+1 to m
        let lambda_k = eigen_stats.eigenvalue
            .iter()
            .skip(k)
            .fold(1.0, |prod, &eigen| prod * (1.0 / (1.0 + eigen)));

        wilks_lambda.push(lambda_k);
        log_debug("LAMBDA", &format!("Wilks' Lambda = {:.4}", lambda_k));

        // Calculate chi-square approximation
        // chi^2 = -(n-(p+g)/2-1) * ln(Lambda_k)
        let chi_square_val = -(n - ((p + g) as f64) / 2.0 - 1.0) * lambda_k.ln();

        chi_square.push(chi_square_val);
        log_debug("CHI_SQUARE", &format!("Chi-square = {:.4}", chi_square_val));

        // Calculate degrees of freedom
        // df = (p-k)(g-k-1)
        let degrees_of_freedom = (p - (k as i32)) * (g - (k as i32) - 1);

        df.push(degrees_of_freedom);
        log_debug("DF", &format!("Degrees of freedom = {}", degrees_of_freedom));

        // Calculate p-value
        let p_value = calculate_p_value_from_chi_square(
            chi_square_val,
            degrees_of_freedom as usize
        );

        significance.push(p_value);
        log_debug("P_VALUE", &format!("p-value = {:.4}", p_value));
    }

    log_debug("COMPLETE", "Wilks' Lambda test calculation completed");

    Ok(WilksLambdaTest {
        test_of_functions,
        wilks_lambda,
        chi_square,
        df,
        significance,
    })
}
