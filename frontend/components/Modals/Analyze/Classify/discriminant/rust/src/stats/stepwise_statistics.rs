use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::collections::HashSet;

use crate::{
    models::{
        result::{
            PairwiseComparison, StepwiseNote, StepwiseStatistics, VariableInAnalysis,
            VariableNotInAnalysis,
        },
        AnalysisData, DiscriminantConfig,
    },
    stats::core::{
        calculate_p_value_from_f,
        calculate_univariate_f, // Tetap di-import jika dipakai di tempat lain
        extract_analyzed_dataset,
        AnalyzedDataset,
    },
};

use super::core::{
    analyze_variables_in_model, analyze_variables_not_in_model, calculate_min_mahalanobis_distance,
    calculate_overall_wilks_lambda, determine_method_type, find_best_variable_to_enter,
    find_worst_variable_to_remove, generate_pairwise_comparisons,
};

/// Method type enum for different stepwise methods
#[derive(Copy, Clone, Debug, PartialEq)]
pub enum MethodType {
    Wilks,
    Unexplained,
    Mahalanobis,
    FRatio,
    Raos,
}

/// Helper struct to store step data
#[derive(Debug, Serialize, Deserialize, Clone)]
struct StepData {
    variable_entered: Option<String>,
    variable_removed: Option<String>,
    min_d_squared: f64,
    wilks_lambda: f64,
    f_to_enter: f64,
    f_to_enter_df1: i32,
    f_to_enter_df2: i32,
    significance: f64,
    variables_in_analysis: Vec<VariableInAnalysis>,
    variables_not_in_analysis: Vec<VariableNotInAnalysis>,
    pairwise_comparisons: HashMap<String, Vec<PairwiseComparison>>,
}

/// Calculate statistics for stepwise discriminant analysis
///
/// This function performs stepwise variable selection and calculates
/// associated statistics for discriminant analysis.
///
/// # Parameters
/// * `data` - The analysis data
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A StepwiseStatistics object with variable selection results
pub fn calculate_stepwise_statistics(
    data: &AnalysisData,
    config: &DiscriminantConfig,
) -> Result<StepwiseStatistics, String> {
    // Check if stepwise analysis is requested
    if !config.main.stepwise {
        let err = "Stepwise analysis not requested".to_string();
        return Err(err);
    }

    // Get variables and extract analyzed dataset
    let variables = &config.main.independent_variables;

    let dataset = match extract_analyzed_dataset(data, config) {
        Ok(ds) => ds,
        Err(e) => {
            return Err(e);
        }
    };

    if dataset.num_groups < 2 {
        let err = format!(
            "Not enough valid groups for analysis: found {} groups",
            dataset.num_groups
        );
        return Err(err);
    }

    // Perform stepwise analysis
    let steps_data = if config.method.f_value || config.method.f_probability {
        match perform_stepwise_analysis(&dataset, variables, config) {
            Ok(data) => data,
            Err(e) => {
                return Err(e);
            }
        }
    } else {
        vec![create_initial_step(&dataset, variables, config)]
    };

    // Convert step data to output format
    match convert_steps_to_output(steps_data, config) {
        Ok(result) => Ok(result),
        Err(e) => Err(e),
    }
}

/// Perform stepwise analysis
///
/// This function performs the stepwise variable selection procedure,
/// iteratively adding or removing variables based on the specified method.
///
/// # Parameters
/// * `dataset` - The analyzed dataset
/// * `variables` - Variables to consider for selection
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A vector of StepData containing results for each step
fn perform_stepwise_analysis(
    dataset: &AnalyzedDataset,
    variables: &Vec<String>,
    config: &DiscriminantConfig,
) -> Result<Vec<StepData>, String> {
    let mut current_variables: Vec<String> = Vec::new();
    let mut remaining_variables: Vec<String> = variables.clone();
    let mut steps_data: Vec<StepData> = Vec::new();

    // [ANTI-OSILASI]: Tracker kombinasi variabel
    let mut seen_states: HashSet<String> = HashSet::new();
    seen_states.insert(String::new());

    // Add initial step (Step 0)
    let initial_step = create_initial_step(dataset, variables, config);
    steps_data.push(initial_step.clone());

    let method_type = determine_method_type(config);
    let max_steps = variables.len() * 2;
    let mut step = 0;

    while step < max_steps {
        let mut step_action_taken = false;

        // PRIORITAS 1: Cek apakah ada variabel yang harus di-REMOVE
        if current_variables.len() > 1 {
            let (worst_var_to_remove, worst_stats) =
                find_worst_variable_to_remove(&current_variables, dataset, method_type, config);

            let should_remove = should_remove_variable(
                &worst_var_to_remove,
                &worst_stats,
                dataset.num_groups,
                dataset.total_cases,
                current_variables.len(),
                config,
            );

            if should_remove {
                if let Some(var_name) = worst_var_to_remove {
                    // Cek apakah state ini memicu infinite loop
                    let mut next_state = current_variables.clone();
                    next_state.retain(|v| v != &var_name);
                    next_state.sort();
                    let state_key = next_state.join(",");

                    if seen_states.contains(&state_key) {
                        break; // Loop terdeteksi, hentikan analisis!
                    }
                    seen_states.insert(state_key);

                    // Eksekusi Removal
                    current_variables.retain(|v| v != &var_name);
                    remaining_variables.push(var_name.clone());
                    step_action_taken = true;

                    let step_data = create_step_data(
                        dataset,
                        &current_variables,
                        &remaining_variables,
                        None,                   
                        Some(var_name.clone()), 
                        (step as i32) + 1,
                        method_type,
                        config,
                    );
                    steps_data.push(step_data);
                    
                    step += 1;
                    continue;
                }
            }
        }

        // PRIORITAS 2: Jika tidak ada yang di-remove, cek apakah ada yang bisa di-ENTER
        if !step_action_taken && !remaining_variables.is_empty() {
            let (best_var_to_enter, best_stats) = find_best_variable_to_enter(
                &remaining_variables,
                dataset,
                &current_variables,
                method_type,
                config,
            );

            let should_enter = should_enter_variable(
                &best_var_to_enter,
                &best_stats,
                dataset.num_groups,
                dataset.total_cases,
                current_variables.len(),
                config,
            );

            if should_enter {
                if let Some(var_name) = best_var_to_enter {
                    // Cek apakah state ini memicu infinite loop
                    let mut next_state = current_variables.clone();
                    next_state.push(var_name.clone());
                    next_state.sort();
                    let state_key = next_state.join(",");

                    if seen_states.contains(&state_key) {
                        break; // Loop terdeteksi, hentikan analisis!
                    }
                    seen_states.insert(state_key);

                    // Eksekusi Entry
                    current_variables.push(var_name.clone());
                    remaining_variables.retain(|v| v != &var_name);
                    step_action_taken = true;

                    let step_data = create_step_data(
                        dataset,
                        &current_variables,
                        &remaining_variables,
                        Some(var_name.clone()), 
                        None,                   
                        (step as i32) + 1,
                        method_type,
                        config,
                    );
                    steps_data.push(step_data);
                }
            }
        }

        if !step_action_taken {
            break;
        }

        step += 1;
    }

    Ok(steps_data)
}

/// Result of a single selection step
#[derive(Debug, Serialize, Deserialize, Clone)]
struct StepResult {
    changes_made: bool,
    step_data: Vec<StepData>,
}

fn should_enter_variable(
    var_opt: &Option<String>,
    stats: &VariableNotInAnalysis,
    num_groups: usize,
    total_cases: usize,
    num_current_vars: usize,
    config: &DiscriminantConfig,
) -> bool {
    if var_opt.is_none() {
        return false;
    }

    // Use SPSS defaults if thresholds are 0 or not set.
    // Default F-to-enter = 3.84, P-to-enter = 0.05
    let f_entry_threshold = if config.method.f_entry > 0.0 {
        config.method.f_entry
    } else {
        3.84
    };
    let p_entry_threshold = if config.method.p_entry > 0.0 {
        config.method.p_entry
    } else {
        0.05
    };

    if config.method.f_value {
        stats.f_to_enter >= f_entry_threshold
    } else if config.method.f_probability {
        let df1 = (num_groups - 1) as f64;
        let df2 = (total_cases - num_groups - num_current_vars) as f64;
        let p_value = calculate_p_value_from_f(stats.f_to_enter, df1, df2);
        p_value <= p_entry_threshold
    } else {
        false
    }
}

fn should_remove_variable(
    var_opt: &Option<String>,
    stats: &VariableInAnalysis,
    num_groups: usize,
    total_cases: usize,
    num_current_vars: usize,
    config: &DiscriminantConfig,
) -> bool {
    if var_opt.is_none() {
        return false;
    }

    // Use SPSS defaults if thresholds are 0 or not set.
    // Default F-to-remove = 2.71, P-to-remove = 0.10
    let f_removal_threshold = if config.method.f_removal > 0.0 {
        config.method.f_removal
    } else {
        2.71
    };
    let p_removal_threshold = if config.method.p_removal > 0.0 {
        config.method.p_removal
    } else {
        0.10
    };

    if config.method.f_value || config.method.f_probability {
        // df2 must match how F-to-remove was computed in calculate_f_to_remove_wilks:
        // df2 = n - p - g (where p = num_current_vars)
        let df2 = (total_cases - num_groups - num_current_vars) as f64;
        let p_value = calculate_p_value_from_f(stats.f_to_remove, (num_groups - 1) as f64, df2);

        if config.method.f_value {
            stats.f_to_remove <= f_removal_threshold
        } else {
            p_value >= p_removal_threshold
        }
    } else {
        false
    }
}

/// Create data for the initial step (no variables in the model)
fn create_initial_step(
    dataset: &AnalyzedDataset,
    variables: &[String],
    config: &DiscriminantConfig,
) -> StepData {
    let initial_variables_not_in = analyze_variables_not_in_model(variables, dataset, &[], config);
    let k = dataset.num_groups as i32;
    let n = dataset.total_cases as i32;

    StepData {
        variable_entered: None,
        variable_removed: None,
        min_d_squared: 0.0,
        wilks_lambda: 1.0,
        f_to_enter: 0.0,
        f_to_enter_df1: 0,
        f_to_enter_df2: 0,
        significance: 1.0,
        variables_in_analysis: Vec::new(),
        variables_not_in_analysis: initial_variables_not_in,
        pairwise_comparisons: HashMap::new(),
    }
}

/// Create data for a step in the stepwise procedure
fn create_step_data(
    dataset: &AnalyzedDataset,
    current_variables: &[String],
    remaining_variables: &[String],
    variable_entered: Option<String>,
    variable_removed: Option<String>,
    step: i32,
    method_type: MethodType,
    config: &DiscriminantConfig,
) -> StepData {
    let vars_in_analysis =
        analyze_variables_in_model(current_variables, dataset, method_type, config);

    let vars_not_in_analysis =
        analyze_variables_not_in_model(remaining_variables, dataset, current_variables, config);

    // Build combined_vars to calculate the overall statistics
    let combined_vars = current_variables.to_vec();

    let wilks_lambda = if combined_vars.is_empty() {
        1.0
    } else {
        calculate_overall_wilks_lambda(dataset, &combined_vars)
    };

    // Compute Min D² for Mahalanobis method output (SPSS column: "Min. D Squared")
    let min_d_squared = if combined_vars.is_empty() {
        0.0
    } else {
        calculate_min_mahalanobis_distance(dataset, &combined_vars)
    };

    // Compute partial F-to-enter for the entered variable (SPSS "Exact F" column)
    // Formula: F = ((Λ_C - Λ_N) / Λ_N) * (df2 / df1)
    // df1 = g - 1, df2 = n - p - g
    // At entry time: Λ_C = Wilks' of current model (before entry), Λ_N = Wilks' of new model (after entry)
    let (f_to_enter, f_to_enter_df1, f_to_enter_df2) = if let Some(ref var_name) = variable_entered {
        let current_wilks = if combined_vars.len() == 1 {
            1.0
        } else {
            calculate_overall_wilks_lambda(dataset, current_variables)
        };
        let mut new_vars_check = current_variables.to_vec();
        new_vars_check.push(var_name.clone());
        let new_wilks = calculate_overall_wilks_lambda(dataset, &new_vars_check);

        let df1 = dataset.num_groups - 1;
        let df2 = dataset.total_cases - combined_vars.len() - dataset.num_groups;

        let f_val = if df2 > 0 && new_wilks < current_wilks && new_wilks > 0.0 {
            (((current_wilks - new_wilks) / new_wilks) * (df2 as f64)) / (df1 as f64)
        } else {
            0.0
        };
        (f_val, df1 as i32, df2 as i32)
    } else if let Some(ref var_name) = variable_removed {
        // For removal step: Λ_C = current Wilks (with var), Λ_R = reduced Wilks (without var)
        let current_wilks = wilks_lambda;
        let reduced_vars: Vec<String> = current_variables.iter().filter(|v| *v != var_name).cloned().collect();
        let reduced_wilks = if reduced_vars.is_empty() {
            1.0
        } else {
            calculate_overall_wilks_lambda(dataset, &reduced_vars)
        };

        let df1 = dataset.num_groups - 1;
        let df2 = dataset.total_cases - current_variables.len() - dataset.num_groups;

        let f_val = if df2 > 0 && reduced_wilks > current_wilks && current_wilks > 0.0 {
            (((reduced_wilks - current_wilks) / current_wilks) * (df2 as f64)) / (df1 as f64)
        } else {
            0.0
        };
        (f_val, df1 as i32, df2 as i32)
    } else {
        (0.0, 0, 0)
    };

    let significance = calculate_p_value_from_f(f_to_enter, f_to_enter_df1 as f64, f_to_enter_df2 as f64);

    let pairwise_comparisons = if config.method.pairwise {
        generate_pairwise_comparisons(dataset, current_variables, step)
    } else {
        HashMap::new()
    };

    StepData {
        variable_entered,
        variable_removed,
        min_d_squared,
        wilks_lambda,
        f_to_enter,
        f_to_enter_df1,
        f_to_enter_df2,
        significance,
        variables_in_analysis: vars_in_analysis,
        variables_not_in_analysis: vars_not_in_analysis,
        pairwise_comparisons,
    }
}

/// Convert internal step data to the output format
fn convert_steps_to_output(
    steps_data: Vec<StepData>,
    config: &DiscriminantConfig,
) -> Result<StepwiseStatistics, String> {
    let mut result = StepwiseStatistics {
        variables_entered: Vec::new(),
        variables_removed: Vec::new(),
        min_d_squared: Vec::new(),
        wilks_lambda: Vec::new(),
        f_to_enter: Vec::new(),
        f_to_enter_df1: Vec::new(),
        f_to_enter_df2: Vec::new(),
        significance: Vec::new(),
        variables_in_analysis: HashMap::new(),
        variables_not_in_analysis: HashMap::new(),
        pairwise_comparisons: HashMap::new(),
        note: create_stepwise_note(config),
    };

    for (step_idx, step) in steps_data.iter().enumerate() {
        // SKIP the initial step (index 0) — it's not a real SPSS step
        // The initial step only populates "Variables Not in Analysis" at the beginning
        if step_idx == 0 {
            continue;
        }

        result
            .variables_entered
            .push(step.variable_entered.clone().unwrap_or_default());
        result.variables_removed.push(step.variable_removed.clone());
        result.min_d_squared.push(step.min_d_squared);
        result.wilks_lambda.push(step.wilks_lambda);
        result.f_to_enter.push(step.f_to_enter);
        result.f_to_enter_df1.push(step.f_to_enter_df1);
        result.f_to_enter_df2.push(step.f_to_enter_df2);
        result.significance.push(step.significance);

        result
            .variables_in_analysis
            .insert((step_idx).to_string(), step.variables_in_analysis.clone());

        result
            .variables_not_in_analysis
            .insert((step_idx).to_string(), step.variables_not_in_analysis.clone());

        if !step.pairwise_comparisons.is_empty() {
            result.pairwise_comparisons.insert(
                (step_idx).to_string(),
                step.pairwise_comparisons.clone(),
            );
        }
    }

    Ok(result)
}

fn create_stepwise_note(config: &DiscriminantConfig) -> StepwiseNote {
    let max_steps = config.main.independent_variables.len() * 2;

    let (entry_msg, removal_msg) = if config.method.f_value {
        (
            format!(
                "b. Minimum partial F to enter is {}.",
                config.method.f_entry
            ),
            format!(
                "c. Maximum partial F to remove is {}.",
                config.method.f_removal
            ),
        )
    } else if config.method.f_probability {
        (
            format!(
                "b. Maximum probability of F to enter is {}.",
                config.method.p_entry
            ),
            format!(
                "c. Minimum probability of F to remove is {}.",
                config.method.p_removal
            ),
        )
    } else {
        (
            format!(
                "b. Minimum partial F to enter is {}.",
                config.method.f_entry
            ),
            format!(
                "c. Maximum partial F to remove is {}.",
                config.method.f_removal
            ),
        )
    };

    StepwiseNote {
        max_steps: format!("a. Maximum number of steps is {}.", max_steps),
        min_f_to_enter: entry_msg,
        max_f_to_remove: removal_msg,
        note: "d. F level, tolerance, or VIN insufficient for further computation.".to_string(),
    }
}
