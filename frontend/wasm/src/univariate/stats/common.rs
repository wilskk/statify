use statrs::distribution::{ ContinuousCDF, FisherSnedecor, StudentsT, ChiSquared, Gamma, Normal };
use statrs::{ Statistics, Mean, StandardDeviation, Variance };
use nalgebra::{ DMatrix, DVector };
use rayon::prelude::*;

use std::collections::{ HashMap, HashSet };
use crate::univariate::models::{
    data::{ AnalysisData, DataRecord, DataValue },
    config::UnivariateConfig,
};

/// Calculate mean of values using statrs
pub fn calculate_mean(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    values.mean()
}

/// Calculate variance of values using statrs
pub fn calculate_variance(values: &[f64], mean: Option<f64>) -> f64 {
    if values.len() <= 1 {
        return 0.0;
    }

    match mean {
        Some(m) =>
            values
                .iter()
                .map(|x| (x - m).powi(2))
                .sum::<f64>() / (values.len() as f64),
        None => values.variance(),
    }
}

/// Calculate standard deviation of values using statrs
pub fn calculate_std_deviation(values: &[f64], mean: Option<f64>) -> f64 {
    if values.len() <= 1 {
        return 0.0;
    }

    match mean {
        Some(m) => calculate_variance(values, Some(m)).sqrt(),
        None => values.std_dev(),
    }
}

/// Calculate F significance (p-value) for F statistic
pub fn calculate_f_significance(df1: usize, df2: usize, f_value: f64) -> f64 {
    if df1 == 0 || df2 == 0 || f_value.is_nan() {
        return 0.0;
    }

    FisherSnedecor::new(df1 as f64, df2 as f64)
        .map(|dist| 1.0 - dist.cdf(f_value))
        .unwrap_or(0.0)
}

/// Calculate t significance (p-value) for t statistic
pub fn calculate_t_significance(df: usize, t_value: f64) -> f64 {
    if df == 0 || t_value.is_nan() {
        return 0.0;
    }

    StudentsT::new(0.0, 1.0, df as f64)
        .map(|dist| 2.0 * (1.0 - dist.cdf(t_value.abs())))
        .unwrap_or(0.0)
}

/// Calculate critical t value for confidence intervals
pub fn calculate_t_critical(df: usize, alpha: f64) -> f64 {
    if df == 0 {
        return Normal::new(0.0, 1.0)
            .map(|dist| dist.inverse_cdf(1.0 - alpha / 2.0))
            .unwrap_or(1.96); // Default to normal approximation
    }

    StudentsT::new(0.0, 1.0, df as f64)
        .map(|dist| dist.inverse_cdf(1.0 - alpha / 2.0))
        .unwrap_or(1.96)
}

/// Calculate observed power for F-test
pub fn calculate_observed_power(df1: usize, df2: usize, f_value: f64, alpha: f64) -> f64 {
    if df1 == 0 || df2 == 0 || f_value <= 0.0 || alpha <= 0.0 || alpha >= 1.0 {
        return 0.0;
    }

    // Non-central F distribution approximation
    let ncp = f_value * (df1 as f64);
    let crit_f = FisherSnedecor::new(df1 as f64, df2 as f64)
        .map(|dist| dist.inverse_cdf(1.0 - alpha))
        .unwrap_or(4.0);

    // Approximation of power
    1.0 -
        FisherSnedecor::new(df1 as f64, df2 as f64)
            .map(|dist| dist.cdf(crit_f))
            .unwrap_or(0.5)
}

/// Calculate observed power for t-test
pub fn calculate_observed_power_t(df: usize, t_value: f64, alpha: f64) -> f64 {
    if df == 0 || t_value.abs() <= 0.0 || alpha <= 0.0 || alpha >= 1.0 {
        return 0.0;
    }

    let abs_t = t_value.abs();
    let crit_t = StudentsT::new(0.0, 1.0, df as f64)
        .map(|dist| dist.inverse_cdf(1.0 - alpha / 2.0))
        .unwrap_or(1.96);

    // Approximation of power for two-tailed test
    if abs_t <= crit_t {
        return 0.0;
    }

    StudentsT::new(0.0, 1.0, df as f64)
        .map(|dist| dist.cdf(-crit_t) + (1.0 - dist.cdf(crit_t)))
        .unwrap_or(0.0)
}

/// Chi-square CDF using statrs
pub fn chi_square_cdf(x: f64, df: f64) -> f64 {
    if x <= 0.0 {
        return 0.0;
    }

    ChiSquared::new(df)
        .map(|dist| dist.cdf(x))
        .unwrap_or(0.0)
}

/// F distribution CDF using statrs
pub fn f_distribution_cdf(x: f64, df1: f64, df2: f64) -> f64 {
    if x <= 0.0 {
        return 0.0;
    }

    FisherSnedecor::new(df1, df2)
        .map(|dist| dist.cdf(x))
        .unwrap_or(0.0)
}

/// Count total cases in the data
pub fn count_total_cases(data: &AnalysisData) -> usize {
    data.dependent_data
        .iter()
        .map(|records| records.len())
        .sum()
}

/// Extract dependent variable value from a record
pub fn extract_dependent_value(record: &DataRecord, dep_var_name: &str) -> Option<f64> {
    record.values.get(dep_var_name).and_then(|value| {
        match value {
            DataValue::Number(n) => Some(*n),
            _ => None,
        }
    })
}

/// Convert DataValue to String representation
pub fn data_value_to_string(value: &DataValue) -> String {
    match value {
        DataValue::Number(n) => n.to_string(),
        DataValue::Text(t) => t.clone(),
        DataValue::Boolean(b) => b.to_string(),
        DataValue::Null => "null".to_string(),
    }
}

pub fn get_factor_levels(data: &AnalysisData, factor: &str) -> Result<Vec<String>, String> {
    let mut level_set = HashSet::new();

    for (i, factor_defs) in data.fix_factor_data_defs.iter().enumerate() {
        for factor_def in factor_defs {
            if factor_def.name == factor {
                // Found our factor, extract levels
                for records in &data.fix_factor_data[i] {
                    if let Some(value) = records.values.get(factor) {
                        level_set.insert(data_value_to_string(value));
                    }
                }

                return Ok(level_set.into_iter().collect());
            }
        }
    }

    Err(format!("Factor '{}' not found in the data", factor))
}

/// Get factor combinations for analysis
pub fn get_factor_combinations(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<Vec<HashMap<String, String>>, String> {
    if let Some(factors) = &config.main.fix_factor {
        if factors.is_empty() {
            return Ok(vec![HashMap::new()]);
        }

        // Get levels for each factor
        let mut factor_levels = Vec::new();
        for factor in factors {
            factor_levels.push(get_factor_levels(data, factor)?);
        }

        // Generate all combinations
        let mut combinations = Vec::new();
        let mut current = HashMap::new();
        generate_combinations(&mut current, factors, &factor_levels, 0, &mut combinations);

        Ok(combinations)
    } else {
        Ok(vec![HashMap::new()]) // No factors case
    }
}

/// Helper function to generate factor combinations
fn generate_combinations(
    current: &mut HashMap<String, String>,
    factors: &[String],
    levels: &[Vec<String>],
    index: usize,
    result: &mut Vec<HashMap<String, String>>
) {
    if index == factors.len() {
        result.push(current.clone());
        return;
    }

    for level in &levels[index] {
        current.insert(factors[index].clone(), level.clone());
        generate_combinations(current, factors, levels, index + 1, result);
    }
}

/// Generate all possible interaction terms from a list of factors
pub fn generate_interaction_terms(factors: &[String]) -> Vec<String> {
    if factors.is_empty() {
        return Vec::new();
    }

    let mut interactions = Vec::new();

    // Generate all possible combinations of factors from size 2 to size N
    for size in 2..=factors.len() {
        generate_factor_combinations(factors, size, &mut Vec::new(), 0, &mut interactions);
    }

    interactions
}

/// Helper function to recursively generate factor combinations of a specific size
fn generate_factor_combinations(
    factors: &[String],
    size: usize,
    current: &mut Vec<String>,
    start_idx: usize,
    result: &mut Vec<String>
) {
    if current.len() == size {
        result.push(current.join("*"));
        return;
    }

    for i in start_idx..factors.len() {
        current.push(factors[i].clone());
        generate_factor_combinations(factors, size, current, i + 1, result);
        current.pop();
    }
}

/// Parse an interaction term into its component factors
pub fn parse_interaction_term(term: &str) -> Vec<String> {
    term.split('*')
        .map(|s| s.trim().to_string())
        .collect()
}

/// Check if a record matches an interaction term
/// An interaction term might be something like "age*month" or "age*month*year"
pub fn record_matches_interaction(
    record: &DataRecord,
    combination: &HashMap<String, String>,
    interaction_term: &str
) -> bool {
    let factors = parse_interaction_term(interaction_term);

    for factor in &factors {
        if let Some(expected_level) = combination.get(factor) {
            let actual_level = record.values.get(factor).map(data_value_to_string);
            match actual_level {
                Some(ref level) if level == expected_level => {
                    continue;
                }
                _ => {
                    return false;
                }
            }
        } else {
            return false;
        }
    }

    true
}

/// Get factor combinations that include interactions
pub fn get_factor_combinations_with_interactions(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<Vec<HashMap<String, String>>, String> {
    let mut combinations = get_factor_combinations(data, config)?;

    // If there are no fixed factors or only one, return the basic combinations
    if config.main.fix_factor.is_none() || config.main.fix_factor.as_ref().unwrap().len() <= 1 {
        return Ok(combinations);
    }

    // Generate interaction terms
    let factors = config.main.fix_factor.as_ref().unwrap();
    let interaction_terms = generate_interaction_terms(factors);

    // For each combination, add derived values for each interaction term
    for combo in &mut combinations {
        for term in &interaction_terms {
            combo.insert(term.clone(), term.clone());
        }
    }

    Ok(combinations)
}

/// Extract values for records that match a specific interaction
pub fn get_interaction_level_values(
    data: &AnalysisData,
    interaction_term: &str,
    dep_var_name: &str
) -> Result<Vec<f64>, String> {
    let factors = parse_interaction_term(interaction_term);

    // Get the levels for each factor in the interaction
    let mut factor_levels = Vec::new();
    for factor in &factors {
        factor_levels.push(get_factor_levels(data, factor)?);
    }

    // Generate all possible level combinations for this interaction
    let mut level_combinations = Vec::new();
    let mut current = HashMap::new();

    fn generate_level_combinations(
        current: &mut HashMap<String, String>,
        factors: &[String],
        levels: &[Vec<String>],
        index: usize,
        result: &mut Vec<HashMap<String, String>>
    ) {
        if index == factors.len() {
            result.push(current.clone());
            return;
        }

        for level in &levels[index] {
            current.insert(factors[index].clone(), level.clone());
            generate_level_combinations(current, factors, levels, index + 1, result);
        }
    }

    generate_level_combinations(&mut current, &factors, &factor_levels, 0, &mut level_combinations);

    // Extract matching records for each combination
    let mut values = Vec::new();

    for combo in &level_combinations {
        for records in &data.dependent_data {
            for record in records {
                let mut matches = true;

                for (factor, expected_level) in combo {
                    let actual_level = record.values.get(factor).map(data_value_to_string);
                    match actual_level {
                        Some(ref level) if level == expected_level => {
                            continue;
                        }
                        _ => {
                            matches = false;
                            break;
                        }
                    }
                }

                if matches {
                    if let Some(value) = extract_dependent_value(record, dep_var_name) {
                        values.push(value);
                    }
                }
            }
        }
    }

    Ok(values)
}

/// Check if a record matches a particular factor combination
pub fn matches_combination(
    record: &DataRecord,
    combo: &HashMap<String, String>,
    _data: &AnalysisData,
    _config: &UnivariateConfig
) -> bool {
    for (factor, level) in combo {
        let record_level = record.values.get(factor).map(data_value_to_string);

        match record_level {
            Some(ref r_level) if r_level == level => {
                continue;
            }
            _ => {
                return false;
            }
        }
    }
    true
}

/// Get values for a specific factor level in the dependent variable
pub fn get_level_values(
    data: &AnalysisData,
    factor: &str,
    level: &str,
    dep_var_name: &str
) -> Result<Vec<f64>, String> {
    let mut values = Vec::new();

    for records in &data.dependent_data {
        for record in records {
            let factor_level = record.values.get(factor).map(data_value_to_string);

            if factor_level.as_deref() == Some(level) {
                if let Some(value) = extract_dependent_value(record, dep_var_name) {
                    values.push(value);
                }
            }
        }
    }

    Ok(values)
}

/// Get values adjusted for previous factors (for Type I SS)
pub fn get_level_values_adjusted(
    values: &[f64],
    data: &AnalysisData,
    factor: &str,
    level: &str,
    dep_var_name: &str
) -> Result<Vec<f64>, String> {
    let mut level_values = Vec::new();
    let mut i = 0;

    for records in &data.dependent_data {
        for record in records {
            if i >= values.len() {
                continue;
            }

            let factor_level = record.values.get(factor).map(data_value_to_string);

            if factor_level.as_deref() == Some(level) {
                level_values.push(values[i]);
            }

            i += 1;
        }
    }

    Ok(level_values)
}

/// Create DMatrix from Vec<Vec<f64>> efficiently
pub fn to_dmatrix(matrix: &[Vec<f64>]) -> DMatrix<f64> {
    if matrix.is_empty() || matrix[0].is_empty() {
        return DMatrix::zeros(0, 0);
    }

    let rows = matrix.len();
    let cols = matrix[0].len();
    let mut flat_data = Vec::with_capacity(rows * cols);

    for row in matrix {
        flat_data.extend_from_slice(row);
    }

    DMatrix::from_row_slice(rows, cols, &flat_data)
}

/// Create DVector from Vec<f64> efficiently
pub fn to_dvector(vector: &[f64]) -> DVector<f64> {
    DVector::from_row_slice(vector)
}

/// Convert DMatrix to Vec<Vec<f64>>
pub fn from_dmatrix(matrix: &DMatrix<f64>) -> Vec<Vec<f64>> {
    let (rows, cols) = matrix.shape();
    let mut result = vec![vec![0.0; cols]; rows];

    for i in 0..rows {
        for j in 0..cols {
            result[i][j] = matrix[(i, j)];
        }
    }

    result
}

/// Matrix multiplication using nalgebra
pub fn matrix_multiply(a: &[Vec<f64>], b: &[Vec<f64>]) -> Result<Vec<Vec<f64>>, String> {
    if a.is_empty() || b.is_empty() {
        return Err("Cannot multiply empty matrices".to_string());
    }

    let a_matrix = to_dmatrix(a);
    let b_matrix = to_dmatrix(b);

    let result = a_matrix * b_matrix;
    Ok(from_dmatrix(&result))
}

/// Matrix inverse using nalgebra
pub fn matrix_inverse(matrix: &[Vec<f64>]) -> Result<Vec<Vec<f64>>, String> {
    if matrix.is_empty() {
        return Err("Cannot invert empty matrix".to_string());
    }

    let na_matrix = to_dmatrix(matrix);

    match na_matrix.try_inverse() {
        Some(inverse) => Ok(from_dmatrix(&inverse)),
        None => Err("Matrix is not invertible".to_string()),
    }
}

/// Matrix determinant using nalgebra
pub fn matrix_determinant(matrix: &[Vec<f64>]) -> Result<f64, String> {
    if matrix.is_empty() {
        return Err("Cannot compute determinant of empty matrix".to_string());
    }

    let na_matrix = to_dmatrix(matrix);
    Ok(na_matrix.determinant())
}

/// Matrix transpose using nalgebra
pub fn matrix_transpose(matrix: &[Vec<f64>]) -> Vec<Vec<f64>> {
    if matrix.is_empty() {
        return Vec::new();
    }

    let na_matrix = to_dmatrix(matrix);
    from_dmatrix(&na_matrix.transpose())
}

/// Matrix-vector multiplication using nalgebra
pub fn matrix_vec_multiply(matrix: &[Vec<f64>], vector: &[f64]) -> Result<Vec<f64>, String> {
    if matrix.is_empty() || vector.is_empty() {
        return Err("Cannot multiply with empty matrix or vector".to_string());
    }

    let na_matrix = to_dmatrix(matrix);
    let na_vector = to_dvector(vector);

    if na_matrix.ncols() != na_vector.len() {
        return Err(
            format!(
                "Matrix columns ({}) must match vector length ({})",
                na_matrix.ncols(),
                na_vector.len()
            )
        );
    }

    let result = na_matrix * na_vector;
    Ok(result.iter().cloned().collect())
}

/// Solve linear system Ax = b using nalgebra
pub fn solve_linear_system(a: &[Vec<f64>], b: &[f64]) -> Result<Vec<f64>, String> {
    if a.is_empty() || b.is_empty() {
        return Err("Cannot solve system with empty matrix or vector".to_string());
    }

    let na_matrix = to_dmatrix(a);
    let na_vector = to_dvector(b);

    match na_matrix.clone().lu().solve(&na_vector) {
        Some(solution) => Ok(solution.iter().cloned().collect()),
        None => Err("Linear system could not be solved".to_string()),
    }
}
