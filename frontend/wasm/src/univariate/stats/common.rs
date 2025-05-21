use statrs::distribution::{ ContinuousCDF, FisherSnedecor, StudentsT, ChiSquared, Normal };
use statrs::statistics::{ Statistics };
use std::collections::{ HashMap, HashSet };

use crate::univariate::models::config::BuildTermMethod;
use crate::univariate::models::{
    data::{ AnalysisData, DataRecord, DataValue },
    config::UnivariateConfig,
};
use super::core::*;
use crate::univariate::models::result::StatsEntry;
use crate::univariate::models::result::TestEffectEntry;

/// Calculate mean of values using statrs
pub fn calculate_mean(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    values.mean()
}

/// Calculate population variance of values.
/// If mean is provided, it's used. Otherwise, mean is calculated internally.
pub fn calculate_variance(values: &[f64], known_mean: Option<f64>) -> f64 {
    let n = values.len();
    if n == 0 {
        return 0.0; // Or f64::NAN
    }
    if n == 1 && known_mean.is_none() {
        // Variance of a single point is 0 if we don't have a known mean to compare against.
        // If a known_mean is provided, we can calculate (value - known_mean)^2.
        // statrs .variance() returns NaN for n=1, .population_variance() would be more explicit.
        return 0.0;
    }

    let mean = known_mean.unwrap_or_else(|| values.mean());
    values
        .iter()
        .map(|x| (x - mean).powi(2))
        .sum::<f64>() / (n as f64)
}

/// Calculate population standard deviation of values.
/// If mean is provided, it's used. Otherwise, mean is calculated internally.
pub fn calculate_std_deviation(values: &[f64], known_mean: Option<f64>) -> f64 {
    calculate_variance(values, known_mean).sqrt()
}

/// Calculate F significance (p-value) for F statistic
pub fn calculate_f_significance(df1: usize, df2: usize, f_value: f64) -> f64 {
    if df1 == 0 || df2 == 0 || f_value.is_nan() || f_value < 0.0 {
        return f64::NAN;
    }
    FisherSnedecor::new(df1 as f64, df2 as f64).map_or(f64::NAN, |dist| {
        let cdf_val = dist.cdf(f_value);
        (1.0 - cdf_val).max(0.0) // Clamp p-value to be >= 0
    })
}

/// Calculate t significance (p-value) for t statistic
pub fn calculate_t_significance(df: usize, t_value: f64) -> f64 {
    if df == 0 || t_value.is_nan() {
        return f64::NAN; // Return NaN for invalid input
    }
    StudentsT::new(0.0, 1.0, df as f64) // Location 0, Scale 1 for standard t-distribution
        .map_or(f64::NAN, |dist| 2.0 * dist.cdf(-t_value.abs())) // P(T <= -|t|) or P(T >= |t|)
}

/// Calculate critical t value for confidence intervals
pub fn calculate_t_critical(df: usize, alpha: f64) -> f64 {
    if alpha <= 0.0 || alpha >= 1.0 {
        return f64::NAN; // Alpha out of bounds
    }
    if df == 0 {
        // Use Normal distribution as approximation if df is 0
        Normal::new(0.0, 1.0).map_or(1.96, |dist| dist.inverse_cdf(1.0 - alpha / 2.0))
    } else {
        StudentsT::new(0.0, 1.0, df as f64).map_or(f64::NAN, |dist|
            dist.inverse_cdf(1.0 - alpha / 2.0)
        )
    }
}

/// Calculate observed power for F-test
pub fn calculate_observed_power(df1: usize, df2: usize, f_value: f64, alpha: f64) -> f64 {
    if df1 == 0 || df2 == 0 || f_value <= 0.0 || alpha <= 0.0 || alpha >= 1.0 {
        return 0.0;
    }

    let central_dist = match FisherSnedecor::new(df1 as f64, df2 as f64) {
        Ok(dist) => dist,
        Err(_) => {
            return 0.0;
        } // Or f64::NAN
    };
    let crit_f = central_dist.inverse_cdf(1.0 - alpha);
    if crit_f.is_nan() {
        return 0.0;
    }

    // Non-central F distribution for power
    // ncp (non-centrality parameter) = f_value * df1 for observed power
    let ncp = f_value * (df1 as f64);
    // statrs does not directly expose a NonCentralFisherSnedecor constructor easily from parameters like this
    // or a direct power function for F-test. The original approximation is kept for now.
    // A more accurate calculation might involve a dedicated library or more complex statrs usage if available.

    // Using the existing approximation as direct power calculation with ncp in statrs is complex to set up here.
    // Power = P(F' > crit_f | H1 is true), where F' follows non-central F(df1, df2, ncp)
    // This often requires CDF of non-central F.
    // The original formula: 1.0 - FisherSnedecor::new(df1, df2).cdf(crit_f / (1.0 + ncp / df1)) is an approximation.
    // For now, retaining a simplified version of the original logic if direct statrs replacement is hard.
    // Power can be approximated by 1 - CDF_noncentral(crit_f, df1, df2, ncp)
    // Since statrs might not directly offer NonCentralF.cdf with dynamic ncp easily,
    // and the original code had an approximation, this part is tricky to replace without potentially changing results.
    // Let's stick to the original approximation if direct replacement isn't straightforward.
    match FisherSnedecor::new(df1 as f64, df2 as f64) {
        // This should be a non-central F if possible
        Ok(dist) => {
            // The term crit_f / (1.0 + ncp / (df1 as f64)) is from an approximation formula for non-central F CDF
            // Power is 1 - CDF_noncentral(F_critical)
            // This is an approximation of the CDF of a *central* F distribution at a modified value.
            let val_for_cdf = crit_f / (1.0 + ncp / (df1 as f64));
            if val_for_cdf.is_nan() || val_for_cdf < 0.0 {
                return 0.0;
            }
            (1.0 - dist.cdf(val_for_cdf)).max(0.0)
        }
        Err(_) => 0.0, // Or f64::NAN
    }
}

/// Calculate observed power for t-test
pub fn calculate_observed_power_t(df: usize, t_value: f64, alpha: f64) -> f64 {
    if df == 0 || t_value.abs() <= 1e-9 || alpha <= 0.0 || alpha >= 1.0 {
        return 0.0;
    }

    let central_t_dist = match StudentsT::new(0.0, 1.0, df as f64) {
        Ok(dist) => dist,
        Err(_) => {
            return 0.0;
        } // Or f64::NAN
    };
    let crit_t_abs = central_t_dist.inverse_cdf(1.0 - alpha / 2.0).abs();
    if crit_t_abs.is_nan() {
        return 0.0;
    }

    // Non-centrality parameter for t-distribution is often delta = mu / (sigma / sqrt(n))
    // For observed power, an approximation can use the observed t_value itself as a proxy for the non-centrality parameter.
    // Power for a two-tailed t-test: P(T' < -crit_t) + P(T' > crit_t)
    // where T' is a non-central t-distribution with ncp = t_value.
    // statrs StudentsT is central. A common approximation for power P(|T_obs| > t_crit) under H1:
    // P(T > t_crit - t_obs) + P(T < -t_crit - t_obs) where T is central t.
    // Or, using a non-central t-distribution directly if available.
    // The original code: dist.cdf(-crit_t) + (1.0 - dist.cdf(crit_t)) for central T IS NOT power.
    // It is alpha if |t_value| == crit_t. This needs correction if it's meant to be power.

    // Let's use a common approximation for power given observed t:
    // Power = P(Z > z_crit - |t_obs|) + P(Z < -z_crit - |t_obs|) for large df (Normal approx)
    // Or using non-central T: 1 - CDF_noncentral_T(crit_t, df, ncp=t_value) + CDF_noncentral_T(-crit_t, df, ncp=t_value)
    // Given statrs.StudentsT is central, a direct computation of non-central T power is not straightforward.
    // The original was likely an error. A simple approach is to use an approximation or a library that supports non-central T directly.
    // For now, returning a placeholder or a very rough approximation to avoid complex implementation without external libs for non-central T.

    // A common way to approximate power of a t-test is using normal distribution if df is large
    // or specific formulas. The original formula `dist.cdf(-crit_t) + (1.0 - dist.cdf(crit_t))` calculates alpha (type I error rate) if `t_value` was `crit_t`.
    // This is not power. Power is 1 - beta.
    // If |t_value| <= crit_t_abs, power is low, often approximated as alpha/2 or some small value if effect is in wrong direction.
    // If |t_value| > crit_t_abs, it suggests H1 might be true.
    // A proper power calculation needs non-central t-distribution.
    // For now, let's signal that the original calculation was problematic and return a generic low value if not significant.
    if t_value.abs() <= crit_t_abs {
        return alpha; // Or a small value like 0.05 if t_value just meets crit_t_abs
    }

    // Simplified (and potentially inaccurate) approximation of power for T > crit_t or T < -crit_t.
    // This is a placeholder as accurate power calculation needs non-central t-distribution.
    // One common approximation: Power ≈ Φ(|t_observed| - t_critical(α/2, df)) if one-sided test
    // For two-sided: P(|T_ncp| > t_crit(α/2, df)) where ncp = observed t_value
    // This is complex. Let's return a more meaningful value than the original if possible, or acknowledge limitation.
    // Given t_value is significant, power should be > alpha.
    // A very rough approximation: use normal CDF
    let normal_dist = Normal::new(0.0, 1.0).unwrap(); // Standard normal
    let power1 = 1.0 - normal_dist.cdf(crit_t_abs - t_value.abs());
    // let power2 = normal_dist.cdf(-crit_t_abs - t_value.abs()); // this term is usually very small if t_value.abs() > crit_t_abs
    // return (power1 + power2).max(alpha).min(1.0);
    // The above approximation can be problematic. The original code seems to be incorrect for power.
    // Returning a more standard, albeit still approximate or indicative value:
    // If the observed t_value is significant, the power should be higher than alpha.
    // A common R function `power.t.test` would use non-central t. Lacking that, direct port is hard.
    // Let's use the formula from a source like G*Power or similar approximations.
    // Power = 1 - CDF_t(t_crit, df, ncp = t_obs) + CDF_t(-t_crit, df, ncp = t_obs)
    // Since we only have central T, an approximation for P(T_central > t_crit - |t_obs|) can be used for one side.
    (1.0 - central_t_dist.cdf(crit_t_abs - t_value.abs())).max(alpha) // A common one-sided approximation, then max with alpha
}

/// Chi-square CDF using statrs
pub fn chi_square_cdf(x: f64, df: f64) -> f64 {
    if x < 0.0 || df <= 0.0 {
        // x can be 0 for CDF, df must be positive
        return 0.0;
    }
    ChiSquared::new(df).map_or(0.0, |dist| dist.cdf(x).max(0.0).min(1.0))
}

/// F distribution CDF using statrs
pub fn f_distribution_cdf(x: f64, df1: f64, df2: f64) -> f64 {
    if x < 0.0 || df1 <= 0.0 || df2 <= 0.0 {
        // x can be 0 for CDF, df1, df2 must be positive
        return 0.0;
    }
    FisherSnedecor::new(df1, df2).map_or(0.0, |dist| dist.cdf(x).max(0.0).min(1.0))
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

/// Apply weights to the analysis if WLS is specified
pub(super) fn apply_wls_to_analysis(
    data: &AnalysisData,
    config: &UnivariateConfig,
    values: &[f64]
) -> Result<Vec<f64>, String> {
    // Check if WLS weight is specified
    if let Some(wls_weight) = &config.main.wls_weight {
        let weights = get_wls_weights(data, wls_weight)?;

        // Ensure weights are the same length as values
        if weights.len() != values.len() {
            return Err("WLS weights length does not match data length".to_string());
        }

        // Apply weights to values
        Ok(apply_weights(values, &weights))
    } else {
        // No WLS, return original values
        Ok(values.to_vec())
    }
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
                for (_i, records) in random_factor_data.iter().enumerate() {
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

/// Checks if there are missing cells in the design for a factor
pub fn check_for_missing_cells(data: &AnalysisData, factor: &str) -> Result<bool, String> {
    // Get all factors defined in the first fixed factor dataset definition.
    // This matches the original logic from factor_utils.rs.
    // A more robust approach might consider all factor definitions across all datasets.
    let mut all_factors = Vec::new();
    if let Some(fix_factor_defs_first_set) = data.fix_factor_data_defs.get(0) {
        for factor_def in fix_factor_defs_first_set {
            all_factors.push(factor_def.name.clone());
        }
    }

    // For each other factor, check if all combinations with the factor of interest exist.
    for other_factor_name in &all_factors {
        if other_factor_name == factor {
            continue;
        }

        let levels_of_interest_factor = get_factor_levels(data, factor)?;
        let levels_of_other_factor = get_factor_levels(data, other_factor_name)?;

        if levels_of_interest_factor.is_empty() || levels_of_other_factor.is_empty() {
            // If either factor has no levels, cannot form combinations, assume no missing cells in this context.
            // Or, this could be an error condition depending on expectations.
            continue;
        }

        let mut missing_combinations_found = Vec::new();
        for level_interest_factor in &levels_of_interest_factor {
            for level_other_factor in &levels_of_other_factor {
                let mut combination_exists = false;
                // Check across all dependent data records and their corresponding fixed factor records.
                'record_search: for (dep_set_idx, dep_record_set) in data.dependent_data
                    .iter()
                    .enumerate() {
                    for (rec_idx_in_set, _dep_record) in dep_record_set.iter().enumerate() {
                        let mut interest_factor_matches = false;
                        let mut other_factor_matches = false;

                        // Check corresponding fixed factor data for this record
                        if let Some(fix_factor_set) = data.fix_factor_data.get(dep_set_idx) {
                            if let Some(fix_factor_record) = fix_factor_set.get(rec_idx_in_set) {
                                // Check level of the factor of interest
                                if let Some(val) = fix_factor_record.values.get(factor) {
                                    if data_value_to_string(val) == *level_interest_factor {
                                        interest_factor_matches = true;
                                    }
                                }
                                // Check level of the other factor
                                if let Some(val) = fix_factor_record.values.get(other_factor_name) {
                                    if data_value_to_string(val) == *level_other_factor {
                                        other_factor_matches = true;
                                    }
                                }
                            }
                        }
                        if interest_factor_matches && other_factor_matches {
                            combination_exists = true;
                            break 'record_search; // Found this combination, move to next combination
                        }
                    }
                }
                if !combination_exists {
                    missing_combinations_found.push((
                        level_interest_factor.clone(),
                        level_other_factor.clone(),
                    ));
                }
            }
        }

        if !missing_combinations_found.is_empty() {
            // If any pair of levels is missing for this other_factor, then missing cells exist.
            return Ok(true);
        }
    }

    Ok(false) // No missing cells detected for the factor in combination with any other defined factors.
}

/// Helper to retrieve a factor's string value for a specific record using the factor_sources_map.
pub fn get_record_factor_value_string(
    data: &AnalysisData,
    factor_sources_map: &HashMap<String, (String, usize)>,
    factor_name: &str,
    dep_set_idx: usize, // Index of the dataset within dependent_data
    rec_idx_in_set: usize // Index of the record within that dataset
) -> Option<String> {
    factor_sources_map.get(factor_name).and_then(|(source_type, source_idx)| {
        match source_type.as_str() {
            "fixed" =>
                data.fix_factor_data
                    .get(*source_idx)
                    .and_then(|records| records.get(rec_idx_in_set))
                    .and_then(|rec| rec.values.get(factor_name))
                    .map(data_value_to_string),
            "random" =>
                data.random_factor_data
                    .as_ref()
                    .and_then(|data_sets| data_sets.get(*source_idx))
                    .and_then(|records| records.get(rec_idx_in_set))
                    .and_then(|rec| rec.values.get(factor_name))
                    .map(data_value_to_string),
            // Covariates are typically numeric, but if needed as string, can be handled.
            // For now, design matrix functions usually fetch them directly as numbers.
            // If a string representation of a covariate is needed via this function, add here.
            _ => None,
        }
    })
}

/// Helper to get all dependent variable values from AnalysisData
pub fn get_all_dependent_values(
    data: &AnalysisData,
    dep_var_name: &str
) -> Result<Vec<f64>, String> {
    let mut y_values = Vec::new();
    if data.dependent_data.is_empty() {
        // Or return an error if dependent data is expected
        return Ok(y_values);
    }

    for records_group in &data.dependent_data {
        for record in records_group {
            match record.values.get(dep_var_name) {
                Some(data_value) => {
                    match data_value {
                        DataValue::Number(n) => y_values.push(*n as f64),
                        DataValue::NumberFloat(f) => y_values.push(*f),
                        // Other DataValue types are not numeric for dep var
                        _ => {
                            return Err(
                                format!(
                                    "Invalid data type for dependent variable '{}': {:?}. Expected numeric.",
                                    dep_var_name,
                                    data_value
                                )
                            );
                        }
                    }
                }
                None => {
                    return Err(
                        format!("Dependent variable '{}' not found in a record.", dep_var_name)
                    );
                }
            }
        }
    }
    Ok(y_values)
}

/// Helper to extract a numeric value from DataValue, typically for weights.
pub fn extract_numeric_value(data_value: &DataValue) -> Option<f64> {
    match data_value {
        DataValue::Number(n) => Some(*n as f64),
        DataValue::NumberFloat(f) => Some(*f),
        _ => None,
    }
}

/// Map factors to their data sources for efficient lookup.
/// This version ensures that data exists for the given index in the respective data arrays.
pub fn map_factors_to_datasets(
    data: &AnalysisData,
    factors: &[String]
) -> HashMap<String, (String, usize)> {
    let mut factor_map = HashMap::new();

    // Fixed factors
    for (idx, defs) in data.fix_factor_data_defs.iter().enumerate() {
        if data.fix_factor_data.get(idx).is_some() {
            for factor_name in factors {
                if defs.iter().any(|def| &def.name == factor_name) {
                    factor_map.insert(factor_name.clone(), ("fixed".to_string(), idx));
                }
            }
        }
    }

    // Random factors
    if
        let (Some(rand_defs_vec), Some(rand_data_vec)) = (
            &data.random_factor_data_defs,
            &data.random_factor_data,
        )
    {
        for (idx, defs) in rand_defs_vec.iter().enumerate() {
            if rand_data_vec.get(idx).is_some() {
                for factor_name in factors {
                    if defs.iter().any(|def| &def.name == factor_name) {
                        factor_map.insert(factor_name.clone(), ("random".to_string(), idx));
                    }
                }
            }
        }
    }

    // Covariates
    if
        let (Some(cov_defs_vec), Some(cov_data_vec)) = (
            &data.covariate_data_defs,
            &data.covariate_data,
        )
    {
        for (idx, defs) in cov_defs_vec.iter().enumerate() {
            if cov_data_vec.get(idx).is_some() {
                for factor_name in factors {
                    if defs.iter().any(|def| &def.name == factor_name) {
                        factor_map.insert(factor_name.clone(), ("covariate".to_string(), idx));
                    }
                }
            }
        }
    }
    factor_map
}

/// Add a factor's value to the current data entry being built.
/// Tries to find value from mapped factor sources, falling back to the dependent record.
pub fn add_factor_to_entry(
    data: &AnalysisData,
    factor_to_dataset_map: &HashMap<String, (String, usize)>,
    factor_name: &str,
    record_idx: usize,
    dependent_record: &DataRecord,
    entry: &mut HashMap<String, String>
) -> bool {
    let mut factor_val_found = false;

    if let Some((source_type, source_idx)) = factor_to_dataset_map.get(factor_name) {
        let mut found_in_source = false;
        match source_type.as_str() {
            "fixed" => {
                if
                    let Some(val_str) = data.fix_factor_data
                        .get(*source_idx)
                        .and_then(|records| records.get(record_idx))
                        .and_then(|rec| rec.values.get(factor_name))
                        .map(|val| data_value_to_string(val))
                {
                    entry.insert(factor_name.to_string(), val_str);
                    found_in_source = true;
                }
            }
            "random" => {
                if let Some(rand_data_sets) = &data.random_factor_data {
                    if
                        let Some(val_str) = rand_data_sets
                            .get(*source_idx)
                            .and_then(|records| records.get(record_idx))
                            .and_then(|rec| rec.values.get(factor_name))
                            .map(|val| data_value_to_string(val))
                    {
                        entry.insert(factor_name.to_string(), val_str);
                        found_in_source = true;
                    }
                }
            }
            "covariate" => {
                if let Some(cov_data_sets) = &data.covariate_data {
                    if
                        let Some(val_str) = cov_data_sets
                            .get(*source_idx)
                            .and_then(|records| records.get(record_idx))
                            .and_then(|rec| rec.values.get(factor_name))
                            .map(|val| data_value_to_string(val))
                    {
                        entry.insert(factor_name.to_string(), val_str);
                        found_in_source = true;
                    }
                }
            }
            _ => {}
        }
        factor_val_found = found_in_source;
    }

    if !factor_val_found {
        if let Some(value_in_dep) = dependent_record.values.get(factor_name) {
            entry.insert(factor_name.to_string(), data_value_to_string(value_in_dep));
            factor_val_found = true;
        }
    }
    factor_val_found
}

/// Helper to collect unique factor levels from a set of records.
/// Uses common::data_value_to_string.
pub fn collect_factor_levels_from_records(
    records: &[DataRecord],
    factor_name: &str,
    levels_set: &mut HashSet<String>
) {
    for record in records {
        if let Some(value) = record.values.get(factor_name) {
            levels_set.insert(data_value_to_string(value));
        }
    }
}

/// Create a sorted, dot-separated string key for a factor combination.
pub fn create_combination_key(combination: &HashMap<String, String>) -> String {
    if combination.is_empty() {
        return "Overall".to_string();
    }
    let mut sorted_pairs: Vec<_> = combination.iter().collect();
    sorted_pairs.sort_by(|a, b| a.0.cmp(b.0));
    sorted_pairs
        .iter()
        .map(|(factor, value)| format!("{}={}", factor, value))
        .collect::<Vec<_>>()
        .join(".")
}

/// Calculate weighted mean, std_deviation, and N for a set of (value, weight) tuples.
/// Assumes weights are analytical/reliability weights for the variance calculation formula used.
pub fn calculate_stats_for_values(values_with_weights: &[(f64, f64)]) -> StatsEntry {
    // Filter out entries with non-positive or very small weights
    let valid_data: Vec<(f64, f64)> = values_with_weights
        .iter()
        .filter(|(_, w)| *w > 1e-9) // Using a small epsilon for weight positivity
        .cloned()
        .collect();

    let n_effective = valid_data.len();

    if n_effective == 0 {
        return StatsEntry { mean: 0.0, std_deviation: 0.0, n: 0 };
    }

    let sum_of_weights: f64 = valid_data
        .iter()
        .map(|(_, w)| *w)
        .sum();

    // If sum of weights is effectively zero, cannot reliably calculate mean or std_dev
    if sum_of_weights.abs() < 1e-9 {
        // n_effective might be > 0 but all weights are zero. Mean is undefined or 0.
        return StatsEntry { mean: 0.0, std_deviation: 0.0, n: n_effective };
    }

    let mean: f64 =
        valid_data
            .iter()
            .map(|(v, w)| v * w)
            .sum::<f64>() / sum_of_weights;

    let std_deviation: f64 = if n_effective > 1 {
        // Numerator for weighted variance: sum(w_i * (v_i - mean)^2)
        let variance_numerator: f64 = valid_data
            .iter()
            .map(|(v, w)| *w * (v - mean).powi(2))
            .sum();

        // Denominator for specific type of weighted variance (e.g., SPSS "analytical weights")
        // V1 = sum_weights * (n_effective - 1) / n_effective
        // This provides an unbiased estimator if weights are related to reliability/precision.
        let variance_denominator =
            (sum_of_weights * ((n_effective - 1) as f64)) / (n_effective as f64);

        if variance_denominator.abs() > 1e-9 {
            (variance_numerator / variance_denominator).sqrt()
        } else {
            // This case might indicate all weights are the same and n_effective = 1, or other edge cases.
            // If variance_numerator is also 0, then std_dev is 0.
            // If variance_numerator is > 0 and denominator is 0, it implies an issue or undefined variance.
            if variance_numerator.abs() < 1e-9 {
                0.0
            } else {
                f64::NAN
            }
        }
    } else {
        // n_effective is 1
        0.0 // Standard deviation of a single data point is 0
    };

    StatsEntry {
        mean,
        std_deviation,
        n: n_effective,
    }
}

/// Create a TestEffectEntry with calculated statistics
pub fn create_effect_entry(
    sum_of_squares: f64,
    df: usize,
    error_ms: f64,
    error_df: usize,
    sig_level: f64
) -> TestEffectEntry {
    let mean_square = if df > 0 { sum_of_squares / (df as f64) } else { 0.0 };
    let f_value = if error_ms > 0.0 && mean_square > 0.0 { mean_square / error_ms } else { 0.0 };
    let significance = if f_value > 0.0 {
        calculate_f_significance(df, error_df, f_value) // Already in common.rs
    } else {
        1.0
    };

    // Correct partial eta squared calculation
    let partial_eta_squared = if sum_of_squares >= 0.0 && error_df > 0 {
        let error_ss = error_ms * (error_df as f64);
        let eta_sq = sum_of_squares / (sum_of_squares + error_ss);
        // Ensure the value is between 0 and 1
        eta_sq.max(0.0).min(1.0)
    } else {
        0.0
    };

    let noncent_parameter = if f_value > 0.0 { f_value * (df as f64) } else { 0.0 };
    let observed_power = if f_value > 0.0 {
        calculate_observed_power(df, error_df, f_value, sig_level) // Already in common.rs
    } else {
        0.0
    };

    TestEffectEntry {
        sum_of_squares,
        df,
        mean_square,
        f_value,
        significance,
        partial_eta_squared,
        noncent_parameter,
        observed_power,
    }
}
