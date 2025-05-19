use statrs::distribution::{ ContinuousCDF, FisherSnedecor, StudentsT, ChiSquared, Normal };
use statrs::statistics::{ Statistics };
use std::collections::{ HashMap, HashSet };

use crate::univariate::models::config::BuildTermMethod;
use crate::univariate::models::{
    data::{ AnalysisData, DataRecord, DataValue },
    config::UnivariateConfig,
};
use super::core::*;

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
    // Use the noncentrality parameter for a better power approximation
    1.0 -
        FisherSnedecor::new(df1 as f64, df2 as f64)
            .map(|dist| dist.cdf(crit_f / (1.0 + ncp / (df1 as f64))))
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
            DataValue::Number(n) => Some(*n as f64),
            DataValue::NumberFloat(f) => Some(*f),
            _ => None,
        }
    })
}

/// Convert DataValue to String representation
pub fn data_value_to_string(value: &DataValue) -> String {
    match value {
        DataValue::Number(n) => n.to_string(),
        DataValue::NumberFloat(f) => f.to_string(),
        DataValue::Text(t) => t.clone(),
        DataValue::Boolean(b) => b.to_string(),
        DataValue::Date(d) => d.clone(),
        DataValue::DateTime(dt) => dt.clone(),
        DataValue::Time(t) => t.clone(),
        DataValue::Currency(c) => format!("{:.2}", c),
        DataValue::Scientific(s) => format!("{:e}", s),
        DataValue::Percentage(p) => format!("{}%", p * 100.0),
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
            factor_levels.push((factor.clone(), get_factor_levels(data, factor)?));
        }

        // Generate all combinations
        let mut combinations = Vec::new();
        let mut current = HashMap::new();
        super::factor_utils::generate_level_combinations(
            &factor_levels,
            &mut current,
            0,
            &mut combinations
        );

        Ok(combinations)
    } else {
        Ok(vec![HashMap::new()]) // No factors case
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
        super::factor_utils::generate_lower_order_terms(
            factors,
            size,
            &mut Vec::new(),
            0,
            &mut interactions
        );
    }

    interactions
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
        let levels = get_factor_levels(data, factor)?;
        factor_levels.push((factor.clone(), levels));
    }

    // Generate all possible level combinations for this interaction
    let mut level_combinations = Vec::new();
    let mut current = HashMap::new();

    super::factor_utils::generate_level_combinations(
        &factor_levels,
        &mut current,
        0,
        &mut level_combinations
    );

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
    level: &str
) -> Result<Vec<f64>, String> {
    super::factor_utils::get_level_values_adjusted(values, data, factor, level, "")
}

/// Extract random factor value from a record
pub fn extract_random_factor_value(record: &DataRecord, factor_name: &str) -> Option<String> {
    record.values.get(factor_name).map(data_value_to_string)
}

/// Extract covariate value from a record
pub fn extract_covariate_value(record: &DataRecord, covariate_name: &str) -> Option<f64> {
    record.values.get(covariate_name).and_then(|value| {
        match value {
            DataValue::Number(n) => Some(*n as f64),
            DataValue::NumberFloat(f) => Some(*f),
            _ => None,
        }
    })
}

/// Extract WLS weight value from a record
pub fn extract_wls_weight(record: &DataRecord, wls_weight_name: &str) -> Option<f64> {
    record.values.get(wls_weight_name).and_then(|value| {
        match value {
            DataValue::Number(n) => Some(*n as f64),
            DataValue::NumberFloat(f) => Some(*f),
            _ => None,
        }
    })
}

/// Get random factor levels from data
pub fn get_random_factor_levels(data: &AnalysisData, factor: &str) -> Result<Vec<String>, String> {
    let mut level_set = HashSet::new();

    if let Some(random_factor_data_defs) = &data.random_factor_data_defs {
        for (i, factor_defs) in random_factor_data_defs.iter().enumerate() {
            for factor_def in factor_defs {
                if factor_def.name == factor {
                    // Found our factor, extract levels
                    if let Some(random_factor_data) = &data.random_factor_data {
                        for records in &random_factor_data[i] {
                            if let Some(value) = records.values.get(factor) {
                                level_set.insert(data_value_to_string(value));
                            }
                        }
                    }
                    return Ok(level_set.into_iter().collect());
                }
            }
        }
    }

    Err(format!("Random factor '{}' not found in the data", factor))
}

/// Get covariate values for analysis
pub fn get_covariate_values(data: &AnalysisData, covariate: &str) -> Result<Vec<f64>, String> {
    let mut values = Vec::new();

    if let Some(covariate_data_defs) = &data.covariate_data_defs {
        for (i, covar_defs) in covariate_data_defs.iter().enumerate() {
            for covar_def in covar_defs {
                if covar_def.name == covariate {
                    // Found our covariate, extract values
                    if let Some(covariate_data) = &data.covariate_data {
                        for record in &covariate_data[i] {
                            if let Some(value) = extract_covariate_value(record, covariate) {
                                values.push(value);
                            }
                        }
                    }
                    return Ok(values);
                }
            }
        }
    }

    Err(format!("Covariate '{}' not found in the data", covariate))
}

/// Get WLS weights for analysis
pub fn get_wls_weights(data: &AnalysisData, wls_weight: &str) -> Result<Vec<f64>, String> {
    let mut weights = Vec::new();

    if let Some(wls_data_defs) = &data.wls_data_defs {
        for (i, wls_defs) in wls_data_defs.iter().enumerate() {
            for wls_def in wls_defs {
                if wls_def.name == wls_weight {
                    // Found our WLS weight variable, extract values
                    if let Some(wls_data) = &data.wls_data {
                        for record in &wls_data[i] {
                            if let Some(value) = extract_wls_weight(record, wls_weight) {
                                weights.push(value);
                            }
                        }
                    }
                    return Ok(weights);
                }
            }
        }
    }

    Err(format!("WLS weight variable '{}' not found in the data", wls_weight))
}

/// Apply weights to values (for weighted least squares)
pub fn apply_weights(values: &[f64], weights: &[f64]) -> Vec<f64> {
    if values.len() != weights.len() {
        return values.to_vec();
    }

    values
        .iter()
        .zip(weights.iter())
        .map(|(v, w)| v * w.sqrt())
        .collect()
}

/// Calculate weighted mean (for WLS)
pub fn calculate_weighted_mean(values: &[f64], weights: &[f64]) -> f64 {
    if values.is_empty() || values.len() != weights.len() {
        return 0.0;
    }

    let sum_weighted_values: f64 = values
        .iter()
        .zip(weights.iter())
        .map(|(v, w)| v * w)
        .sum();

    let sum_weights: f64 = weights.iter().sum();

    if sum_weights > 0.0 {
        sum_weighted_values / sum_weights
    } else {
        0.0
    }
}

/// Apply random factor structure to the model
pub fn apply_random_factor_structure(
    data: &AnalysisData,
    random_factors: &[String],
    dep_var_name: &str
) -> Result<HashMap<String, Vec<f64>>, String> {
    let mut random_effects = HashMap::new();

    for factor in random_factors {
        let factor_levels = get_random_factor_levels(data, factor)?;

        // For each level, collect dependent values and calculate mean effect
        for level in factor_levels {
            let level_key = format!("{}_{}", factor, level);
            let mut level_values = Vec::new();

            if let Some(random_factor_data) = &data.random_factor_data {
                for (i, records) in random_factor_data.iter().enumerate() {
                    for record in records {
                        if let Some(factor_value) = record.values.get(factor) {
                            if data_value_to_string(factor_value) == level {
                                if
                                    let Some(dep_value) = extract_dependent_value(
                                        record,
                                        dep_var_name
                                    )
                                {
                                    level_values.push(dep_value);
                                }
                            }
                        }
                    }
                }
            }

            random_effects.insert(level_key, level_values);
        }
    }

    Ok(random_effects)
}

/// Generate model design terms based on the configuration
pub fn generate_model_design_terms(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<Vec<String>, String> {
    let mut terms = Vec::new();

    // Add intercept if enabled (always respect intercept setting)
    if config.model.intercept {
        terms.push("Intercept".to_string());
    }

    // Handle different model design modes
    if config.model.non_cust {
        // Mode 1: When non_cust is true, create a full factorial design from fix_factors and covariates
        if let Some(fix_factors) = &config.main.fix_factor {
            // Add main effects
            for factor in fix_factors {
                terms.push(factor.clone());
            }

            // Add interactions if there are multiple factors
            if fix_factors.len() > 1 {
                // Generate all possible interactions
                let interactions = generate_interaction_terms(fix_factors);
                terms.extend(interactions);
            }
        }

        // Add covariates
        if let Some(covariates) = &config.main.covar {
            for covar in covariates {
                terms.push(covar.clone());
            }
        }
    } else if config.model.custom {
        // Mode 2: When custom is true, use factors_model and respect build_term_method
        if let Some(factors_model) = &config.model.factors_model {
            match config.model.build_term_method {
                BuildTermMethod::MainEffects => {
                    // Only include main effects
                    for factor in factors_model {
                        terms.push(factor.clone());
                    }
                }
                BuildTermMethod::Interaction => {
                    // Include main effects and all possible interactions
                    for factor in factors_model {
                        terms.push(factor.clone());
                    }

                    if factors_model.len() > 1 {
                        let interactions = generate_interaction_terms(factors_model);
                        terms.extend(interactions);
                    }
                }
                BuildTermMethod::All2Way => {
                    // Include main effects and all 2-way interactions
                    for factor in factors_model {
                        terms.push(factor.clone());
                    }

                    if factors_model.len() > 1 {
                        for i in 0..factors_model.len() {
                            for j in i + 1..factors_model.len() {
                                terms.push(format!("{}*{}", factors_model[i], factors_model[j]));
                            }
                        }
                    }
                }
                BuildTermMethod::All3Way => {
                    // Include main effects, 2-way and 3-way interactions
                    for factor in factors_model {
                        terms.push(factor.clone());
                    }

                    // Add 2-way interactions
                    if factors_model.len() > 1 {
                        for i in 0..factors_model.len() {
                            for j in i + 1..factors_model.len() {
                                terms.push(format!("{}*{}", factors_model[i], factors_model[j]));
                            }
                        }
                    }

                    // Add 3-way interactions
                    if factors_model.len() > 2 {
                        for i in 0..factors_model.len() {
                            for j in i + 1..factors_model.len() {
                                for k in j + 1..factors_model.len() {
                                    terms.push(
                                        format!(
                                            "{}*{}*{}",
                                            factors_model[i],
                                            factors_model[j],
                                            factors_model[k]
                                        )
                                    );
                                }
                            }
                        }
                    }
                }
                BuildTermMethod::All4Way => {
                    // Include main effects and up to 4-way interactions
                    // Add 1-way effects (main effects)
                    for factor in factors_model {
                        terms.push(factor.clone());
                    }

                    // Add 2-way interactions
                    if factors_model.len() > 1 {
                        for i in 0..factors_model.len() {
                            for j in i + 1..factors_model.len() {
                                terms.push(format!("{}*{}", factors_model[i], factors_model[j]));
                            }
                        }
                    }

                    // Add 3-way interactions
                    if factors_model.len() > 2 {
                        for i in 0..factors_model.len() {
                            for j in i + 1..factors_model.len() {
                                for k in j + 1..factors_model.len() {
                                    terms.push(
                                        format!(
                                            "{}*{}*{}",
                                            factors_model[i],
                                            factors_model[j],
                                            factors_model[k]
                                        )
                                    );
                                }
                            }
                        }
                    }

                    // Add 4-way interactions
                    if factors_model.len() > 3 {
                        for i in 0..factors_model.len() {
                            for j in i + 1..factors_model.len() {
                                for k in j + 1..factors_model.len() {
                                    for l in k + 1..factors_model.len() {
                                        terms.push(
                                            format!(
                                                "{}*{}*{}*{}",
                                                factors_model[i],
                                                factors_model[j],
                                                factors_model[k],
                                                factors_model[l]
                                            )
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
                BuildTermMethod::All5Way => {
                    // Include main effects and up to 5-way interactions
                    // Add 1-way effects (main effects)
                    for factor in factors_model {
                        terms.push(factor.clone());
                    }

                    // Add 2-way interactions
                    if factors_model.len() > 1 {
                        for i in 0..factors_model.len() {
                            for j in i + 1..factors_model.len() {
                                terms.push(format!("{}*{}", factors_model[i], factors_model[j]));
                            }
                        }
                    }

                    // Add 3-way interactions
                    if factors_model.len() > 2 {
                        for i in 0..factors_model.len() {
                            for j in i + 1..factors_model.len() {
                                for k in j + 1..factors_model.len() {
                                    terms.push(
                                        format!(
                                            "{}*{}*{}",
                                            factors_model[i],
                                            factors_model[j],
                                            factors_model[k]
                                        )
                                    );
                                }
                            }
                        }
                    }

                    // Add 4-way interactions
                    if factors_model.len() > 3 {
                        for i in 0..factors_model.len() {
                            for j in i + 1..factors_model.len() {
                                for k in j + 1..factors_model.len() {
                                    for l in k + 1..factors_model.len() {
                                        terms.push(
                                            format!(
                                                "{}*{}*{}*{}",
                                                factors_model[i],
                                                factors_model[j],
                                                factors_model[k],
                                                factors_model[l]
                                            )
                                        );
                                    }
                                }
                            }
                        }
                    }

                    // Add 5-way interactions
                    if factors_model.len() > 4 {
                        for i in 0..factors_model.len() {
                            for j in i + 1..factors_model.len() {
                                for k in j + 1..factors_model.len() {
                                    for l in k + 1..factors_model.len() {
                                        for m in l + 1..factors_model.len() {
                                            terms.push(
                                                format!(
                                                    "{}*{}*{}*{}*{}",
                                                    factors_model[i],
                                                    factors_model[j],
                                                    factors_model[k],
                                                    factors_model[l],
                                                    factors_model[m]
                                                )
                                            );
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Add covariate model if specified
        if let Some(cov_model) = &config.model.cov_model {
            // Parse covariate model - could be simple or complex
            // For example: "X1" or "X1*X2" or "X1 X2"
            for term in cov_model.split_whitespace() {
                // Handle interaction terms in covariate model (X1*X2)
                if term.contains('*') {
                    terms.push(term.to_string());
                } else {
                    // Simple term
                    terms.push(term.to_string());
                }
            }
        }
    } else if config.model.build_custom_term {
        // Mode 3: When build_custom_term is true, directly use factors_model
        if let Some(factors_model) = &config.model.factors_model {
            for term in factors_model {
                // Parse terms - can be a main effect or interaction term
                if term.contains('*') || term.contains("WITHIN") || term.contains('(') {
                    // This is an interaction or nesting term
                    // Process according to the specification rules
                    terms.push(term.clone());
                } else {
                    // Simple main effect
                    terms.push(term.clone());
                }
            }
        }
    }

    // If no terms were generated, create a default design
    if terms.is_empty() && !config.model.intercept {
        // Default design: include all main effects
        if let Some(fix_factors) = &config.main.fix_factor {
            for factor in fix_factors {
                terms.push(factor.clone());
            }
        }

        // Add covariates
        if let Some(covariates) = &config.main.covar {
            for covar in covariates {
                terms.push(covar.clone());
            }
        }
    }

    // Return the model design terms
    Ok(terms)
}
