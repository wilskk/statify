use statrs::distribution::{ ContinuousCDF, FisherSnedecor };

use crate::univariate::models::{ config::UnivariateConfig, data::AnalysisData, result::LeveneTest };

use super::core::{
    calculate_mean,
    data_value_to_string,
    extract_dependent_value,
    get_factor_combinations,
    matches_combination,
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
            // If no specific dependent variable is provided, use all dependent variables from the data
            let mut vars = Vec::new();
            for records in &data.dependent_data {
                for record in records {
                    for (name, _) in &record.values {
                        if !vars.contains(name) {
                            vars.push(name.clone());
                        }
                    }
                }
            }
            if vars.is_empty() {
                return Err("No dependent variables found in data".to_string());
            }
            vars
        }
    };

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

    // Add fixed factors
    if let Some(fix_factors) = &config.main.fix_factor {
        for factor in fix_factors {
            design.push_str(" + ");
            design.push_str(factor);
        }
    }

    // Add interactions if specified in model
    if let Some(term_text) = &config.model.term_text {
        for term in term_text.split('+') {
            if term.contains('*') {
                design.push_str(" + ");
                design.push_str(term.trim());
            }
        }
    }

    let mut results = Vec::new();

    for dep_var_name in dep_vars {
        // Get factor combinations
        let factor_combinations = get_factor_combinations(data, config)?;
        web_sys::console::log_1(&format!("Factor combinations: {:?}", factor_combinations).into());

        // Organize data values by group
        let mut groups: Vec<Vec<f64>> = Vec::new();

        // For each combination, find all matching records
        for combo in &factor_combinations {
            let mut group_values = Vec::new();

            // We need to iterate through all records in the dependent data
            for (dataset_idx, records) in data.dependent_data.iter().enumerate() {
                for (record_idx, record) in records.iter().enumerate() {
                    // Check if this record's corresponding factor values match the current combination
                    let mut matches = true;

                    if let Some(factors) = &config.main.fix_factor {
                        for (i, factor) in factors.iter().enumerate() {
                            if
                                i >= data.fix_factor_data.len() ||
                                record_idx >= data.fix_factor_data[i].len()
                            {
                                matches = false;
                                break;
                            }

                            let factor_record = &data.fix_factor_data[i][record_idx];
                            let record_level = factor_record.values
                                .get(factor)
                                .map(data_value_to_string);
                            let combo_level = combo.get(factor);

                            match (record_level, combo_level) {
                                (Some(ref r_level), Some(c_level)) if r_level == c_level => {
                                    continue;
                                }
                                _ => {
                                    matches = false;
                                    break;
                                }
                            }
                        }
                    }

                    // If this record matches, add its dependent value to the group
                    if matches {
                        if let Some(value) = extract_dependent_value(record, &dep_var_name) {
                            group_values.push(value);
                        }
                    }
                }
            }

            if !group_values.is_empty() {
                groups.push(group_values);
            }
        }

        web_sys::console::log_1(&format!("Groups for {}: {:?}", dep_var_name, groups).into());

        // Skip if not enough groups for analysis
        if groups.len() < 2 {
            continue;
        }

        // Calculate group means
        let group_means: Vec<f64> = groups
            .iter()
            .map(|group| calculate_mean(group))
            .collect();

        // Calculate absolute deviations from group means
        let mut abs_deviations: Vec<Vec<f64>> = Vec::new();
        for (i, group) in groups.iter().enumerate() {
            let mean = group_means[i];
            let deviations: Vec<f64> = group
                .iter()
                .map(|val| (val - mean).abs())
                .collect();
            abs_deviations.push(deviations);
        }

        // Calculate total sample size for correct df calculation
        let total_samples = groups
            .iter()
            .map(|group| group.len())
            .sum::<usize>();

        // Calculate the overall mean of absolute deviations
        let all_deviations: Vec<f64> = abs_deviations.iter().flatten().cloned().collect();
        let overall_mean = calculate_mean(&all_deviations);

        // Calculate sum of squares between groups
        let ss_between = abs_deviations
            .iter()
            .enumerate()
            .map(|(i, group)| {
                let group_mean = calculate_mean(group);
                (group.len() as f64) * (group_mean - overall_mean).powi(2)
            })
            .sum::<f64>();

        // Calculate sum of squares within groups
        let ss_within = abs_deviations
            .iter()
            .enumerate()
            .map(|(i, group)| {
                let group_mean = calculate_mean(group);
                group
                    .iter()
                    .map(|val| (val - group_mean).powi(2))
                    .sum::<f64>()
            })
            .sum::<f64>();

        // Calculate degrees of freedom
        let df1 = groups.len() - 1;
        let df2 = total_samples - groups.len();

        // Calculate F statistic
        let ms_between = ss_between / (df1 as f64);
        let ms_within = ss_within / (df2 as f64);
        let f_statistic = ms_between / ms_within;

        // Calculate significance
        let f_dist = FisherSnedecor::new(df1 as f64, df2 as f64).unwrap();
        let significance = 1.0 - f_dist.cdf(f_statistic);

        results.push(LeveneTest {
            dependent_variable: dep_var_name,
            f_statistic,
            df1,
            df2,
            significance,
            function: "Tests the null hypothesis that the error variance of the dependent variable is equal across groups.".to_string(),
            design: design.clone(),
        });
    }

    if results.is_empty() {
        return Err("Could not calculate Levene's test for any dependent variable".to_string());
    }

    Ok(results)
}
