use statrs::statistics::Statistics;
use std::collections::{ HashMap, HashSet };
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

/// Count total cases in the data
pub fn count_total_cases(data: &AnalysisData) -> usize {
    data.dependent_data
        .iter()
        .map(|records| records.len())
        .sum()
}

/// Extract numeric value from a record's named field.
pub fn extract_numeric_from_record(record: &DataRecord, field_name: &str) -> Option<f64> {
    record.values.get(field_name).and_then(|value| {
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

pub fn get_factor_levels(data: &AnalysisData, factor_name: &str) -> Result<Vec<String>, String> {
    let mut level_set = HashSet::new();
    let mut factor_definition_found = false;

    for (group_idx, def_group) in data.fix_factor_data_defs.iter().enumerate() {
        if def_group.iter().any(|def| def.name == factor_name) {
            factor_definition_found = true;
            if let Some(data_records_for_group) = data.fix_factor_data.get(group_idx) {
                for record in data_records_for_group {
                    if let Some(value) = record.values.get(factor_name) {
                        level_set.insert(data_value_to_string(value));
                    }
                }
            }
        }
    }

    if let Some(random_defs_groups) = &data.random_factor_data_defs {
        for (group_idx, def_group) in random_defs_groups.iter().enumerate() {
            if def_group.iter().any(|def| def.name == factor_name) {
                factor_definition_found = true;
                if let Some(random_data_groups_vec) = &data.random_factor_data {
                    if let Some(data_records_for_group) = random_data_groups_vec.get(group_idx) {
                        for record in data_records_for_group {
                            if let Some(value) = record.values.get(factor_name) {
                                level_set.insert(data_value_to_string(value));
                            }
                        }
                    }
                }
            }
        }
    }

    if factor_definition_found {
        Ok(level_set.into_iter().collect())
    } else {
        // Check if it's a covariate, which shouldn't be used here
        let is_covariate = data.covariate_data_defs
            .as_ref()
            .map_or(false, |cov_defs_groups| {
                cov_defs_groups
                    .iter()
                    .any(|def_group| def_group.iter().any(|def| def.name == factor_name))
            });

        if is_covariate {
            Err(
                format!("'{}' is defined as a covariate. Covariates do not have discrete levels for this operation. Please use a categorical (fixed or random) factor.", factor_name)
            )
        } else {
            Err(
                format!("Factor '{}' not found or not defined as a categorical (fixed or random) factor.", factor_name)
            )
        }
    }
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

        let mut factor_levels = Vec::new();
        for factor in factors {
            factor_levels.push((factor.clone(), get_factor_levels(data, factor)?));
        }

        let mut combinations = Vec::new();
        let mut current = HashMap::new();
        crate::univariate::stats::factor_utils::generate_level_combinations(
            &factor_levels,
            &mut current,
            0,
            &mut combinations
        );

        Ok(combinations)
    } else {
        Ok(vec![HashMap::new()])
    }
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
                if let Some(value) = extract_numeric_from_record(record, dep_var_name) {
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

// Helper function to get numeric values from a specified data source
fn get_numeric_values_from_source(
    data_defs_option: Option<&Vec<Vec<crate::univariate::models::data::VariableDefinition>>>,
    data_records_option: Option<&Vec<Vec<DataRecord>>>,
    variable_name: &str,
    entity_type: &str
) -> Result<Vec<f64>, String> {
    let mut values = Vec::new();
    if let Some(data_defs_groups) = data_defs_option {
        for (i, def_group) in data_defs_groups.iter().enumerate() {
            if def_group.iter().any(|def| def.name == variable_name) {
                if let Some(data_records_groups) = data_records_option {
                    if let Some(data_records_for_group) = data_records_groups.get(i) {
                        for record in data_records_for_group {
                            if let Some(value) = extract_numeric_from_record(record, variable_name) {
                                values.push(value);
                            }
                        }
                    }
                }
                return Ok(values);
            }
        }
    }
    Err(format!("{} '{}' not found in the data", entity_type, variable_name))
}

/// Get random factor levels from data
pub fn get_random_factor_levels(data: &AnalysisData, factor: &str) -> Result<Vec<String>, String> {
    let mut level_set = HashSet::new();
    if let Some(random_factor_data_defs) = &data.random_factor_data_defs {
        for (i, factor_defs) in random_factor_data_defs.iter().enumerate() {
            for factor_def in factor_defs {
                if factor_def.name == factor {
                    if let Some(random_factor_data) = &data.random_factor_data {
                        if let Some(records_for_group) = random_factor_data.get(i) {
                            // Check if group exists
                            for records_item in records_for_group {
                                // Iterate over DataRecord
                                if let Some(value) = records_item.values.get(factor) {
                                    level_set.insert(data_value_to_string(value));
                                }
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
    get_numeric_values_from_source(
        data.covariate_data_defs.as_ref(),
        data.covariate_data.as_ref(),
        covariate,
        "Covariate"
    )
}

/// Get WLS weights for analysis
pub fn get_wls_weights(data: &AnalysisData, wls_weight: &str) -> Result<Vec<f64>, String> {
    get_numeric_values_from_source(
        data.wls_data_defs.as_ref(),
        data.wls_data.as_ref(),
        wls_weight,
        "WLS weight variable"
    )
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
    if let Some(wls_weight) = &config.main.wls_weight {
        let weights = get_wls_weights(data, wls_weight)?;
        if weights.len() != values.len() {
            return Err("WLS weights length does not match data length".to_string());
        }
        Ok(apply_weights(values, &weights))
    } else {
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

/// Checks if there are missing cells in the design for a factor
pub fn check_for_missing_cells(
    data: &AnalysisData,
    _config: &UnivariateConfig, // config is not used
    factor: &str
) -> Result<bool, String> {
    let mut all_factors = Vec::new();
    if let Some(fix_factor_defs_first_set) = data.fix_factor_data_defs.get(0) {
        for factor_def in fix_factor_defs_first_set {
            all_factors.push(factor_def.name.clone());
        }
    }
    for other_factor_name in &all_factors {
        if other_factor_name == factor {
            continue;
        }
        let levels_of_interest_factor = get_factor_levels(data, factor)?;
        let levels_of_other_factor = get_factor_levels(data, other_factor_name)?;
        if levels_of_interest_factor.is_empty() || levels_of_other_factor.is_empty() {
            continue;
        }
        let mut missing_combinations_found = Vec::new();
        for level_interest_factor in &levels_of_interest_factor {
            for level_other_factor in &levels_of_other_factor {
                let mut combination_exists = false;
                'record_search: for (dep_set_idx, dep_record_set) in data.dependent_data
                    .iter()
                    .enumerate() {
                    for (rec_idx_in_set, _dep_record) in dep_record_set.iter().enumerate() {
                        let mut interest_factor_matches = false;
                        let mut other_factor_matches = false;
                        if let Some(fix_factor_set) = data.fix_factor_data.get(dep_set_idx) {
                            if let Some(fix_factor_record) = fix_factor_set.get(rec_idx_in_set) {
                                if let Some(val) = fix_factor_record.values.get(factor) {
                                    if data_value_to_string(val) == *level_interest_factor {
                                        interest_factor_matches = true;
                                    }
                                }
                                if let Some(val) = fix_factor_record.values.get(other_factor_name) {
                                    if data_value_to_string(val) == *level_other_factor {
                                        other_factor_matches = true;
                                    }
                                }
                            }
                        }
                        if interest_factor_matches && other_factor_matches {
                            combination_exists = true;
                            break 'record_search;
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
            return Ok(true);
        }
    }
    Ok(false)
}

/// Helper to retrieve a factor's string value for a specific record using the factor_sources_map.
pub fn get_record_factor_value_string(
    data: &AnalysisData,
    factor_sources_map: &HashMap<String, (String, usize)>,
    factor_name: &str,
    _dep_set_idx: usize, // Not directly used, index is via source_idx from map
    rec_idx_in_set: usize
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
        return Ok(y_values);
    }
    for records_group in &data.dependent_data {
        for record in records_group {
            match record.values.get(dep_var_name) {
                Some(data_value) => {
                    match data_value {
                        DataValue::Number(n) => y_values.push(*n as f64),
                        DataValue::NumberFloat(f) => y_values.push(*f),
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
pub fn map_factors_to_datasets(
    data: &AnalysisData,
    factors: &[String]
) -> HashMap<String, (String, usize)> {
    let mut factor_map = HashMap::new();
    fn process_definitions(
        factor_map: &mut HashMap<String, (String, usize)>,
        definitions: &Vec<Vec<crate::univariate::models::data::VariableDefinition>>,
        data_source: Option<&Vec<Vec<DataRecord>>>,
        factors_to_find: &[String],
        source_type_name: &str
    ) {
        for (idx, defs) in definitions.iter().enumerate() {
            if data_source.map_or(false, |ds| ds.get(idx).is_some()) {
                for factor_name in factors_to_find {
                    if defs.iter().any(|def| &def.name == factor_name) {
                        factor_map.insert(factor_name.clone(), (source_type_name.to_string(), idx));
                    }
                }
            }
        }
    }
    process_definitions(
        &mut factor_map,
        &data.fix_factor_data_defs,
        Some(&data.fix_factor_data),
        factors,
        "fixed"
    );
    if
        let (Some(rand_defs_vec), Some(rand_data_vec)) = (
            &data.random_factor_data_defs,
            &data.random_factor_data,
        )
    {
        process_definitions(&mut factor_map, rand_defs_vec, Some(rand_data_vec), factors, "random");
    }
    if
        let (Some(cov_defs_vec), Some(cov_data_vec)) = (
            &data.covariate_data_defs,
            &data.covariate_data,
        )
    {
        process_definitions(
            &mut factor_map,
            cov_defs_vec,
            Some(cov_data_vec),
            factors,
            "covariate"
        );
    }
    factor_map
}

/// Add a factor's value to the current data entry being built.
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
        let get_value_from_source = |source_data_option: Option<&Vec<Vec<DataRecord>>>| {
            source_data_option
                .and_then(|records_groups| records_groups.get(*source_idx))
                .and_then(|records| records.get(record_idx))
                .and_then(|rec| rec.values.get(factor_name))
                .map(|val| data_value_to_string(val))
        };
        let value_str_option = match source_type.as_str() {
            "fixed" => get_value_from_source(Some(&data.fix_factor_data)),
            "random" => get_value_from_source(data.random_factor_data.as_ref()),
            "covariate" => get_value_from_source(data.covariate_data.as_ref()),
            _ => None,
        };
        if let Some(val_str) = value_str_option {
            entry.insert(factor_name.to_string(), val_str);
            factor_val_found = true;
        }
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
pub fn calculate_stats_for_values(values_with_weights: &[(f64, f64)]) -> StatsEntry {
    let valid_data: Vec<(f64, f64)> = values_with_weights
        .iter()
        .filter(|(_, w)| *w > 1e-9)
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
    if sum_of_weights.abs() < 1e-9 {
        return StatsEntry { mean: 0.0, std_deviation: 0.0, n: n_effective };
    }
    let mean: f64 =
        valid_data
            .iter()
            .map(|(v, w)| v * w)
            .sum::<f64>() / sum_of_weights;
    let std_deviation: f64 = if n_effective > 1 {
        let variance_numerator: f64 = valid_data
            .iter()
            .map(|(v, w)| *w * (v - mean).powi(2))
            .sum();
        let variance_denominator =
            (sum_of_weights * ((n_effective - 1) as f64)) / (n_effective as f64);
        if variance_denominator.abs() > 1e-9 {
            (variance_numerator / variance_denominator).sqrt()
        } else {
            if variance_numerator.abs() < 1e-9 { 0.0 } else { f64::NAN }
        }
    } else {
        0.0
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
        calculate_f_significance(df, error_df, f_value)
    } else {
        1.0
    };
    let partial_eta_squared = if sum_of_squares >= 0.0 && error_df > 0 {
        let error_ss = error_ms * (error_df as f64);
        let eta_sq = sum_of_squares / (sum_of_squares + error_ss);
        eta_sq.max(0.0).min(1.0)
    } else {
        0.0
    };
    let noncent_parameter = if f_value > 0.0 { f_value * (df as f64) } else { 0.0 };
    let observed_power = if f_value > 0.0 {
        calculate_observed_power_f(f_value, df as f64, error_df as f64, sig_level)
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
