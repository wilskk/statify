// spread_vs_level.rs
use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ SpreadVsLevelPlots, SpreadVsLevelPoint },
};

use super::core::{ calculate_mean, calculate_std_deviation, extract_numeric_from_record };
use super::design_matrix::create_design_response_weights;
use super::factor_utils::{ generate_level_combinations, get_factor_levels };

/// Calculate spread vs. level plots if requested
pub fn calculate_spread_vs_level_plots(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<SpreadVsLevelPlots, String> {
    if !config.options.spr_vs_level {
        return Err("Spread vs. level plots not requested in configuration".to_string());
    }

    let dep_var_name = match &config.main.dep_var {
        Some(name) => name.clone(),
        None => {
            return Err("No dependent variable specified in configuration".to_string());
        }
    };

    // Create design matrix info to get the structure of the data
    let design_info = create_design_response_weights(data, config)?;

    let mut points = Vec::new();

    // Get factor levels for each term in the design matrix
    let mut factor_levels = Vec::new();
    for term_name in &design_info.term_names {
        if term_name != "Intercept" && !term_name.contains('*') {
            if let Some(levels) = get_factor_levels(data, term_name).ok() {
                factor_levels.push((term_name.clone(), levels));
            }
        }
    }

    // Generate all possible combinations of factor levels
    let mut combinations = Vec::new();
    generate_level_combinations(
        &factor_levels,
        &mut std::collections::HashMap::new(),
        0,
        &mut combinations
    );

    // Use the design matrix to check factor combinations
    for combo in &combinations {
        let mut values = Vec::new();

        for (row_idx, &case_idx) in design_info.case_indices_to_keep.iter().enumerate() {
            if let Some(records) = data.dependent_data.get(0) {
                if let Some(record) = records.get(case_idx) {
                    let mut matches = true;

                    // Check if this row matches the factor combination using design matrix
                    for (factor, level) in combo {
                        if
                            let Some((start_col, end_col)) =
                                design_info.term_column_indices.get(factor)
                        {
                            let mut factor_matches = false;
                            for col in *start_col..=*end_col {
                                if design_info.x[(row_idx, col)] == 1.0 {
                                    factor_matches = true;
                                    break;
                                }
                            }
                            if !factor_matches {
                                matches = false;
                                break;
                            }
                        } else {
                            matches = false;
                            break;
                        }
                    }

                    if matches {
                        if let Some(value) = extract_numeric_from_record(record, &dep_var_name) {
                            values.push(value);
                        }
                    }
                }
            }
        }

        if values.len() > 1 {
            let level_mean = calculate_mean(&values);
            let std_deviation = calculate_std_deviation(&values, Some(level_mean));

            points.push(SpreadVsLevelPoint {
                level_mean,
                spread_standard_deviation: std_deviation,
            });
        }
    }

    Ok(SpreadVsLevelPlots { points })
}
