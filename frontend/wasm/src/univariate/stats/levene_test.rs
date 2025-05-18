use statrs::distribution::FisherSnedecor;
use statrs::statistics::{ Statistics, Mean };
use rayon::prelude::*;

use crate::univariate::models::{ config::UnivariateConfig, data::AnalysisData, result::LeveneTest };

use super::common::{
    data_value_to_string,
    extract_dependent_value,
    generate_interaction_terms,
    get_factor_combinations,
    calculate_f_significance,
};

/// Calculate Levene's Test for homogeneity of variances if requested
pub fn calculate_levene_test(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<Vec<LeveneTest>, String> {
    if !config.options.homogen_test {
        return Err("Levene's test not requested in configuration".to_string());
    }

    // Get dependent variables
    let dep_vars = match &config.main.dep_var {
        Some(name) => vec![name.clone()],
        None => {
            // Extract all unique dependent variable names
            data.dependent_data
                .iter()
                .flat_map(|records| {
                    records.iter().flat_map(|record| { record.values.keys().cloned() })
                })
                .collect::<std::collections::HashSet<_>>()
                .into_iter()
                .collect::<Vec<_>>()
        }
    };

    if dep_vars.is_empty() {
        return Err("No dependent variables found in data".to_string());
    }

    // Build design string
    let mut design = if config.model.intercept {
        "Design: Intercept".to_string()
    } else {
        "Design: ".to_string()
    };

    // Add covariates
    if let Some(covariates) = &config.main.covar {
        for covariate in covariates {
            design.push_str(" + ");
            design.push_str(covariate);
        }
    }

    // Collect all terms (factors and interactions)
    let mut all_terms = Vec::new();

    // Add fixed factors and collect them for later interaction generation
    let fix_factors = config.main.fix_factor.clone().unwrap_or_default();

    // Add individual factors to design
    for factor in &fix_factors {
        design.push_str(" + ");
        design.push_str(factor);
        all_terms.push(factor.clone());
    }

    // Generate interactions if there's more than one factor and term_text isn't specified
    if fix_factors.len() > 1 && config.model.term_text.is_none() {
        let interaction_terms = generate_interaction_terms(&fix_factors);
        for term in &interaction_terms {
            design.push_str(" + ");
            design.push_str(term);
            all_terms.push(term.clone());
        }
    }

    // Add explicitly specified interactions if term_text is provided
    if let Some(term_text) = &config.model.term_text {
        for term in term_text.split('+') {
            let trimmed = term.trim();
            if trimmed.contains('*') {
                design.push_str(" + ");
                design.push_str(trimmed);
                all_terms.push(trimmed.to_string());
            }
        }
    }

    // Get factor combinations
    let factor_combinations = get_factor_combinations(data, config)?;

    // Process each dependent variable in parallel if possible
    let results: Vec<LeveneTest> = dep_vars
        .into_par_iter()
        .filter_map(|dep_var_name| {
            // Organize data values by group
            let groups = collect_groups(data, &dep_var_name, &fix_factors, &factor_combinations);

            // Skip if not enough groups for analysis
            if groups.len() < 2 {
                return None;
            }

            // Calculate Levene statistics
            let (f_statistic, df1, df2, significance) = calculate_levene_statistic(&groups);

            // Create result
            Some(LeveneTest {
                dependent_variable: dep_var_name,
                f_statistic,
                df1,
                df2,
                significance,
                function: "Levene".to_string(),
                design: design.clone(),
            })
        })
        .collect();

    if results.is_empty() {
        Err("No valid Levene test results could be calculated".to_string())
    } else {
        Ok(results)
    }
}

/// Collect data values organized by groups for Levene test
fn collect_groups(
    data: &AnalysisData,
    dep_var_name: &str,
    fix_factors: &[String],
    factor_combinations: &[std::collections::HashMap<String, String>]
) -> Vec<Vec<f64>> {
    let mut groups = Vec::new();

    // For each combination, find all matching records
    for combo in factor_combinations {
        let mut group_values = Vec::new();

        // We need to iterate through all records in the dependent data
        for records in &data.dependent_data {
            for (record_idx, record) in records.iter().enumerate() {
                // Check if this record matches the current combination
                if record_matches_combination(record, record_idx, data, combo, fix_factors) {
                    if let Some(value) = extract_dependent_value(record, dep_var_name) {
                        group_values.push(value);
                    }
                }
            }
        }

        if !group_values.is_empty() {
            groups.push(group_values);
        }
    }

    groups
}

/// Check if a record matches a specific factor combination
fn record_matches_combination(
    record: &crate::univariate::models::data::DataRecord,
    record_idx: usize,
    data: &AnalysisData,
    combo: &std::collections::HashMap<String, String>,
    fix_factors: &[String]
) -> bool {
    if fix_factors.is_empty() {
        return true;
    }

    for (factor, combo_level) in combo {
        let mut found_match = false;

        // Look for the factor in fix_factor_data
        for (i, factor_name) in fix_factors.iter().enumerate() {
            if
                factor_name == factor &&
                i < data.fix_factor_data.len() &&
                record_idx < data.fix_factor_data[i].len()
            {
                let factor_record = &data.fix_factor_data[i][record_idx];
                if let Some(value) = factor_record.values.get(factor) {
                    let record_level = data_value_to_string(value);
                    if &record_level == combo_level {
                        found_match = true;
                        break;
                    }
                }
            }
        }

        if !found_match {
            return false;
        }
    }

    true
}

/// Calculate Levene test statistics
fn calculate_levene_statistic(groups: &[Vec<f64>]) -> (f64, usize, usize, f64) {
    // Calculate group means
    let group_means: Vec<f64> = groups
        .iter()
        .map(|group| group.mean())
        .collect();

    // Calculate absolute deviations from group means
    let abs_deviations: Vec<Vec<f64>> = groups
        .iter()
        .enumerate()
        .map(|(i, group)| {
            let mean = group_means[i];
            group
                .iter()
                .map(|val| (val - mean).abs())
                .collect()
        })
        .collect();

    // Calculate total sample size
    let total_samples = groups
        .iter()
        .map(|group| group.len())
        .sum::<usize>();

    // Calculate the overall mean of absolute deviations
    let all_deviations: Vec<f64> = abs_deviations.iter().flatten().cloned().collect();
    let overall_mean = all_deviations.mean();

    // Calculate sum of squares between groups
    let ss_between = abs_deviations
        .iter()
        .enumerate()
        .map(|(i, group)| {
            let group_mean = group.mean();
            (group.len() as f64) * (group_mean - overall_mean).powi(2)
        })
        .sum::<f64>();

    // Calculate sum of squares within groups
    let ss_within = abs_deviations
        .iter()
        .enumerate()
        .map(|(i, group)| {
            let group_mean = group.mean();
            group
                .iter()
                .map(|val| (val - group_mean).powi(2))
                .sum::<f64>()
        })
        .sum::<f64>();

    // Degrees of freedom
    let df1 = groups.len() - 1;
    let df2 = total_samples - groups.len();

    // Mean squares
    let ms_between = ss_between / (df1 as f64);
    let ms_within = ss_within / (df2 as f64);

    // F statistic
    let f_statistic = ms_between / ms_within;

    // Calculate significance
    let significance = calculate_f_significance(df1, df2, f_statistic);

    (f_statistic, df1, df2, significance)
}
