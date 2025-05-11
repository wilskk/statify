use serde::{ Deserialize, Serialize };
use std::collections::HashMap;
use web_sys::console;

use crate::discriminant::{
    models::{
        result::{
            PairwiseComparison,
            StepwiseNote,
            StepwiseStatistics,
            VariableInAnalysis,
            VariableNotInAnalysis,
        },
        AnalysisData,
        DiscriminantConfig,
    },
    stats::core::{ calculate_p_value_from_f, extract_analyzed_dataset, AnalyzedDataset },
};

use super::core::{
    analyze_variables_in_model,
    analyze_variables_not_in_model,
    calculate_overall_f_statistic,
    calculate_overall_wilks_lambda,
    determine_method_type,
    find_best_variable_to_enter,
    find_worst_variable_to_remove,
    generate_pairwise_comparisons,
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
    wilks_lambda: f64,
    f_value: f64,
    df1: i32,
    df2: i32,
    df3: i32,
    exact_f: f64,
    exact_df1: i32,
    exact_df2: i32,
    significance: f64,
    variables_in_analysis: Vec<VariableInAnalysis>,
    variables_not_in_analysis: Vec<VariableNotInAnalysis>,
    pairwise_comparisons: HashMap<String, Vec<PairwiseComparison>>,
}

/// Log a message to the console with a tag for easier tracing
fn log_debug(tag: &str, message: &str) {
    console::log_1(&format!("[STEPWISE][{}] {}", tag, message).into());
}

/// Log a JSON-stringified object to the console
fn log_object<T: serde::Serialize>(tag: &str, label: &str, obj: &T) {
    match serde_json::to_string(obj) {
        Ok(json) => {
            let truncated = if json.len() > 1000 {
                format!("{}... (truncated)", &json[0..1000])
            } else {
                json
            };
            console::log_1(&format!("[STEPWISE][{}] {}: {}", tag, label, truncated).into());
        }
        Err(e) => {
            console::error_1(
                &format!("[STEPWISE][{}] Error serializing {}: {}", tag, label, e).into()
            );
        }
    }
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
    config: &DiscriminantConfig
) -> Result<StepwiseStatistics, String> {
    log_debug("START", "Beginning stepwise discriminant analysis");
    log_object("CONFIG", "Analysis configuration", config);

    // Check if stepwise analysis is requested
    if !config.main.stepwise {
        let err = "Stepwise analysis not requested".to_string();
        log_debug("ERROR", &err);
        return Err(err);
    }

    // Get variables and extract analyzed dataset
    let variables = &config.main.independent_variables;
    log_debug("VARIABLES", &format!("Total variables to analyze: {}", variables.len()));

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

    if dataset.num_groups < 2 {
        let err = format!(
            "Not enough valid groups for analysis: found {} groups",
            dataset.num_groups
        );
        log_debug("ERROR", &err);
        return Err(err);
    }

    // Log selection criteria based on config
    if config.method.f_value {
        log_debug(
            "CRITERIA",
            &format!(
                "Using F-value criteria: F-to-enter >= {}, F-to-remove <= {}",
                config.method.f_entry,
                config.method.f_removal
            )
        );
    } else if config.method.f_probability {
        log_debug(
            "CRITERIA",
            &format!(
                "Using probability criteria: p-value <= {}, p-value >= {}",
                config.method.p_entry,
                config.method.p_removal
            )
        );
    }

    // Perform stepwise analysis
    log_debug("ANALYSIS", "Starting stepwise variable selection");
    let steps_data = if config.method.f_value || config.method.f_probability {
        match perform_stepwise_analysis(&dataset, variables, config) {
            Ok(data) => {
                log_debug(
                    "COMPLETE",
                    &format!("Stepwise analysis completed with {} steps", data.len())
                );
                data
            }
            Err(e) => {
                log_debug("ERROR", &format!("Error in stepwise analysis: {}", e));
                return Err(e);
            }
        }
    } else {
        log_debug("INITIAL", "No variable selection method specified, using initial step only");
        vec![create_initial_step(&dataset, variables, config)]
    };

    // Convert step data to output format
    log_debug("OUTPUT", "Converting step data to output format");
    match convert_steps_to_output(steps_data, config) {
        Ok(result) => {
            log_debug("SUCCESS", "Stepwise discriminant analysis completed successfully");
            Ok(result)
        }
        Err(e) => {
            log_debug("ERROR", &format!("Error converting step data: {}", e));
            Err(e)
        }
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
    config: &DiscriminantConfig
) -> Result<Vec<StepData>, String> {
    // Initialize variables for stepwise analysis
    let mut current_variables: Vec<String> = Vec::new();
    let mut remaining_variables: Vec<String> = variables.clone();
    let mut steps_data: Vec<StepData> = Vec::new();

    log_debug("STEPWISE", "Initializing stepwise procedure");
    log_debug(
        "REMAINING",
        &format!("Starting with {} variables to consider", remaining_variables.len())
    );

    // Add initial step
    let initial_step = create_initial_step(dataset, variables, config);
    steps_data.push(initial_step.clone());
    log_object("INITIAL", "Initial step data", &initial_step);

    // Determine which method to use
    let method_type = determine_method_type(config);
    log_debug("METHOD", &format!("Using method: {:?}", method_type));

    // Maximum number of steps (at most all variables × 2)
    let max_steps = variables.len() * 2; // Account for both additions and removals
    log_debug("MAX_STEPS", &format!("Maximum number of steps: {}", max_steps));

    // Perform stepwise selection
    let mut step = 0;
    while step < max_steps {
        log_debug("STEP", &format!("Processing step {}", step + 1));

        // Safety check - ensure we don't get stuck in an infinite loop
        if current_variables.len() > variables.len() {
            log_debug(
                "WARNING",
                &format!(
                    "Safety break: current variables ({}) exceeds total variables ({})",
                    current_variables.len(),
                    variables.len()
                )
            );
            break;
        }

        // Log current state
        log_debug(
            "STATE",
            &format!(
                "Current variables: {}, Remaining variables: {}",
                current_variables.len(),
                remaining_variables.len()
            )
        );

        if !current_variables.is_empty() {
            log_debug("CURRENT", &format!("Current variables: {:?}", current_variables));
        }

        // Process one step of variable selection
        log_debug("SELECTION", "Finding best variable to enter");
        let step_result = match
            process_selection_step(
                dataset,
                &mut current_variables,
                &mut remaining_variables,
                step,
                method_type,
                config
            )
        {
            Ok(result) => result,
            Err(e) => {
                log_debug("ERROR", &format!("Error in selection step: {}", e));
                return Err(e);
            }
        };

        log_debug("RESULT", &format!("Step result: changes made = {}", step_result.changes_made));

        // If no changes made, break
        if !step_result.changes_made {
            log_debug("COMPLETE", "No changes made in this step, stopping");
            break;
        }

        // Add step data
        steps_data.extend(step_result.step_data);

        // Log current model
        if !current_variables.is_empty() {
            log_debug("MODEL", &format!("Current model variables: {:?}", current_variables));
        }

        // If all variables are in the model, break
        if remaining_variables.is_empty() {
            log_debug("COMPLETE", "All variables are in the model, stopping");
            break;
        }

        step += 1;
    }

    log_debug(
        "DONE",
        &format!(
            "Stepwise procedure completed with {} steps, {} variables in model",
            steps_data.len(),
            current_variables.len()
        )
    );

    Ok(steps_data)
}

/// Result of a single selection step
#[derive(Debug, Serialize, Deserialize, Clone)]
struct StepResult {
    changes_made: bool,
    step_data: Vec<StepData>,
}

/// Process one step of variable selection
///
/// This function either adds a variable to the model or removes one,
/// depending on the statistical criteria.
///
/// # Parameters
/// * `dataset` - The analyzed dataset
/// * `current_variables` - Variables currently in the model
/// * `remaining_variables` - Variables not yet in the model
/// * `step` - Current step number
/// * `method_type` - The method to use for variable selection
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A StepResult with changes made and step data
fn process_selection_step(
    dataset: &AnalyzedDataset,
    current_variables: &mut Vec<String>,
    remaining_variables: &mut Vec<String>,
    step: usize,
    method_type: MethodType,
    config: &DiscriminantConfig
) -> Result<StepResult, String> {
    let mut steps_data = Vec::new();
    let mut changes_made = false;

    // Find best variable to enter
    log_debug("ENTER", "Looking for best variable to enter");
    let (best_var_to_enter, best_stats) = find_best_variable_to_enter(
        remaining_variables,
        dataset,
        current_variables,
        method_type,
        config
    );

    if let Some(var_name) = &best_var_to_enter {
        log_debug(
            "BEST",
            &format!(
                "Best variable to enter: {} (F={:.4}, Lambda={:.4})",
                var_name,
                best_stats.f_to_enter,
                best_stats.wilks_lambda
            )
        );
    } else {
        log_debug("BEST", "No eligible variable found to enter");
    }

    // Check if we should enter this variable
    let should_enter = should_enter_variable(
        &best_var_to_enter,
        &best_stats,
        dataset.num_groups,
        dataset.total_cases,
        current_variables.len(),
        config
    );

    log_debug("DECISION", &format!("Enter variable? {}", should_enter));

    // If no variable meets entry criteria, return
    if !should_enter || best_var_to_enter.is_none() {
        log_debug("SKIP", "No variable meets entry criteria");
        return Ok(StepResult {
            changes_made: false,
            step_data: steps_data,
        });
    }

    // Add variable to model
    if let Some(var_name) = best_var_to_enter {
        // Only add if not already in the model (safeguard against duplicates)
        if !current_variables.contains(&var_name) {
            log_debug("ADD", &format!("Adding variable {} to the model", var_name));
            current_variables.push(var_name.clone());
            remaining_variables.retain(|v| v != &var_name);
            changes_made = true;

            // Add step data for variable entry
            let step_data = create_step_data(
                dataset,
                current_variables,
                remaining_variables,
                Some(var_name.clone()),
                None,
                (step as i32) + 1,
                method_type,
                config
            );

            log_debug(
                "STATS",
                &format!(
                    "After addition: Wilks' Lambda = {:.4}, F = {:.4}, p = {:.4}",
                    step_data.wilks_lambda,
                    step_data.exact_f,
                    step_data.significance
                )
            );

            steps_data.push(step_data);

            // Check for variable removal if needed
            if step > 0 && current_variables.len() > 1 {
                log_debug("REMOVAL", "Checking if any variables should be removed");
                let removal_result = match
                    process_variable_removal(
                        dataset,
                        current_variables,
                        remaining_variables,
                        step,
                        method_type,
                        config
                    )
                {
                    Ok(result) => result,
                    Err(e) => {
                        log_debug("ERROR", &format!("Error in removal step: {}", e));
                        return Err(e);
                    }
                };

                if removal_result.changes_made {
                    log_debug(
                        "REMOVED",
                        &format!("Removed {} variables", removal_result.step_data.len())
                    );
                    steps_data.extend(removal_result.step_data);
                } else {
                    log_debug("REMOVED", "No variables removed");
                }
            }
        } else {
            log_debug(
                "DUPLICATE",
                &format!("Variable {} is already in the model, skipping", var_name)
            );
        }
    }

    Ok(StepResult {
        changes_made,
        step_data: steps_data,
    })
}

/// Process variable removal
///
/// This function checks if any variables should be removed from the model
/// based on the statistical criteria.
///
/// # Parameters
/// * `dataset` - The analyzed dataset
/// * `current_variables` - Variables currently in the model
/// * `remaining_variables` - Variables not yet in the model
/// * `step` - Current step number
/// * `method_type` - The method to use for variable selection
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A StepResult with changes made and step data
fn process_variable_removal(
    dataset: &AnalyzedDataset,
    current_variables: &mut Vec<String>,
    remaining_variables: &mut Vec<String>,
    step: usize,
    method_type: MethodType,
    config: &DiscriminantConfig
) -> Result<StepResult, String> {
    let mut steps_data = Vec::new();
    let mut changes_made = false;
    let mut removal_attempts = 0;
    let max_removal_attempts = current_variables.len(); // Limit removal attempts to prevent infinite loop
    let mut step_complete = false;

    log_debug(
        "REMOVAL_START",
        &format!("Starting removal process with {} variables in model", current_variables.len())
    );

    while !step_complete && removal_attempts < max_removal_attempts {
        removal_attempts += 1;
        log_debug("REMOVAL_ATTEMPT", &format!("Removal attempt {}", removal_attempts));

        // Find worst variable to remove
        let (worst_var_to_remove, worst_stats) = find_worst_variable_to_remove(
            current_variables,
            dataset,
            method_type,
            config
        );

        if let Some(var_name) = &worst_var_to_remove {
            log_debug(
                "WORST",
                &format!(
                    "Worst variable: {} (F={:.4}, Lambda={:.4})",
                    var_name,
                    worst_stats.f_to_remove,
                    worst_stats.wilks_lambda
                )
            );
        } else {
            log_debug("WORST", "No eligible variable found to remove");
        }

        // Check if we should remove this variable
        let should_remove = should_remove_variable(
            &worst_var_to_remove,
            &worst_stats,
            dataset.num_groups,
            dataset.total_cases,
            current_variables.len(),
            config
        );

        log_debug("DECISION", &format!("Remove variable? {}", should_remove));

        // If no variable meets removal criteria, break
        if !should_remove || worst_var_to_remove.is_none() {
            log_debug("NO_REMOVAL", "No variable meets removal criteria");
            step_complete = true;
            continue;
        }

        // Remove variable from model
        if let Some(var_name) = worst_var_to_remove {
            // Only remove if actually in the model
            if current_variables.contains(&var_name) {
                log_debug("REMOVE", &format!("Removing variable {} from model", var_name));
                current_variables.retain(|v| v != &var_name);
                if !remaining_variables.contains(&var_name) {
                    remaining_variables.push(var_name.clone());
                }
                changes_made = true;

                // Add step data for variable removal
                let step_data = create_step_data(
                    dataset,
                    current_variables,
                    remaining_variables,
                    None,
                    Some(var_name.clone()),
                    (step as i32) + 1,
                    method_type,
                    config
                );

                log_debug(
                    "STATS",
                    &format!(
                        "After removal: Wilks' Lambda = {:.4}, F = {:.4}, p = {:.4}",
                        step_data.wilks_lambda,
                        step_data.exact_f,
                        step_data.significance
                    )
                );

                steps_data.push(step_data);
            } else {
                log_debug(
                    "NOT_FOUND",
                    &format!("Variable {} not found in model, cannot remove", var_name)
                );
            }
        }
    }

    log_debug(
        "REMOVAL_COMPLETE",
        &format!("Removal process completed: {} variables removed", steps_data.len())
    );

    Ok(StepResult {
        changes_made,
        step_data: steps_data,
    })
}

/// Determine if a variable should be entered into the model
///
/// # Parameters
/// * `var_opt` - Optional variable name
/// * `stats` - Statistics for the variable
/// * `num_groups` - Number of groups
/// * `total_cases` - Total number of cases
/// * `num_current_vars` - Number of variables currently in the model
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// Boolean indicating whether the variable should be entered
fn should_enter_variable(
    var_opt: &Option<String>,
    stats: &VariableNotInAnalysis,
    num_groups: usize,
    total_cases: usize,
    num_current_vars: usize,
    config: &DiscriminantConfig
) -> bool {
    if var_opt.is_none() {
        return false;
    }

    let result = if config.method.f_value {
        // Use direct F value comparison
        let decision = stats.f_to_enter >= config.method.f_entry;
        log_debug(
            "ENTRY_F",
            &format!(
                "F-value criterion: {} >= {} ? {}",
                stats.f_to_enter,
                config.method.f_entry,
                decision
            )
        );
        decision
    } else if config.method.f_probability {
        // Calculate p-value and compare with probability threshold
        let p_value = calculate_p_value_from_f(
            stats.f_to_enter,
            (num_groups - 1) as f64,
            (total_cases - num_current_vars - num_groups) as f64
        );
        let decision = p_value <= config.method.p_entry;
        log_debug(
            "ENTRY_P",
            &format!("P-value criterion: {} <= {} ? {}", p_value, config.method.p_entry, decision)
        );
        decision
    } else {
        false
    };

    result
}

/// Determine if a variable should be removed from the model
///
/// # Parameters
/// * `var_opt` - Optional variable name
/// * `stats` - Statistics for the variable
/// * `num_groups` - Number of groups
/// * `total_cases` - Total number of cases
/// * `num_current_vars` - Number of variables currently in the model
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// Boolean indicating whether the variable should be removed
fn should_remove_variable(
    var_opt: &Option<String>,
    stats: &VariableInAnalysis,
    num_groups: usize,
    total_cases: usize,
    num_current_vars: usize,
    config: &DiscriminantConfig
) -> bool {
    if var_opt.is_none() {
        return false;
    }

    let result = if config.method.f_value {
        // Use direct F value comparison for removal
        // For removal, the F value must be LESS THAN OR EQUAL TO the threshold
        let decision = stats.f_to_remove <= config.method.f_removal;
        log_debug(
            "REMOVAL_F",
            &format!(
                "F-value criterion: {} <= {} ? {}",
                stats.f_to_remove,
                config.method.f_removal,
                decision
            )
        );
        decision
    } else if config.method.f_probability {
        // Calculate p-value and compare with probability threshold
        // For removal, the p-value must be GREATER THAN OR EQUAL TO the threshold
        let p_value = calculate_p_value_from_f(
            stats.f_to_remove,
            (num_groups - 1) as f64,
            (total_cases - num_current_vars + 1 - num_groups) as f64
        );
        let decision = p_value >= config.method.p_removal;
        log_debug(
            "REMOVAL_P",
            &format!("P-value criterion: {} >= {} ? {}", p_value, config.method.p_removal, decision)
        );
        decision
    } else {
        false
    };

    result
}

/// Create data for the initial step (no variables in the model)
///
/// # Parameters
/// * `dataset` - The analyzed dataset
/// * `variables` - Variables to consider
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// StepData for the initial step
fn create_initial_step(
    dataset: &AnalyzedDataset,
    variables: &[String],
    config: &DiscriminantConfig
) -> StepData {
    log_debug("INITIAL_STEP", "Creating initial step data (no variables in model)");

    let initial_variables_not_in = analyze_variables_not_in_model(variables, dataset, &[], config);

    log_debug(
        "VARIABLES_NOT_IN",
        &format!("Found {} variables not in model", initial_variables_not_in.len())
    );

    StepData {
        variable_entered: None,
        variable_removed: None,
        wilks_lambda: 1.0, // No discrimination initially
        f_value: 0.0,
        df1: 0,
        df2: 1,
        df3: (dataset.total_cases - dataset.num_groups) as i32,
        exact_f: 0.0,
        exact_df1: 0,
        exact_df2: (dataset.total_cases - dataset.num_groups) as i32,
        significance: 1.0,
        variables_in_analysis: Vec::new(),
        variables_not_in_analysis: initial_variables_not_in,
        pairwise_comparisons: HashMap::new(),
    }
}

/// Create data for a step in the stepwise procedure
///
/// # Parameters
/// * `dataset` - The analyzed dataset
/// * `current_variables` - Variables currently in the model
/// * `remaining_variables` - Variables not yet in the model
/// * `variable_entered` - Variable that was entered in this step
/// * `variable_removed` - Variable that was removed in this step
/// * `step` - Step number
/// * `method_type` - The method being used
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// StepData for the current step
fn create_step_data(
    dataset: &AnalyzedDataset,
    current_variables: &[String],
    remaining_variables: &[String],
    variable_entered: Option<String>,
    variable_removed: Option<String>,
    step: i32,
    method_type: MethodType,
    config: &DiscriminantConfig
) -> StepData {
    log_debug(
        "STEP_DATA",
        &format!(
            "Creating step data for step {}, variables in model: {}",
            step,
            current_variables.len()
        )
    );

    if let Some(var) = &variable_entered {
        log_debug("ENTERED", &format!("Variable entered: {}", var));
    }

    if let Some(var) = &variable_removed {
        log_debug("REMOVED", &format!("Variable removed: {}", var));
    }

    // Analyze variables in and out of the model
    log_debug("ANALYZE_IN", "Analyzing variables in the model");
    let vars_in_analysis = analyze_variables_in_model(
        current_variables,
        dataset,
        method_type,
        config
    );

    log_debug("ANALYZE_OUT", "Analyzing variables not in the model");
    let vars_not_in_analysis = analyze_variables_not_in_model(
        remaining_variables,
        dataset,
        current_variables,
        config
    );

    // Calculate overall statistics
    log_debug("WILKS", "Calculating overall Wilks' Lambda");
    let wilks_lambda = calculate_overall_wilks_lambda(dataset, current_variables);

    // Calculate F statistic
    log_debug("F_STAT", "Calculating overall F statistic");
    let (f_value, df1, df2, df3) = calculate_overall_f_statistic(
        wilks_lambda,
        current_variables.len(),
        dataset.num_groups,
        dataset.total_cases
    );

    // Calculate exact F for display
    let exact_f = f_value;
    let exact_df1 = df1;
    let exact_df2 = df3 - df1 + 1;

    // Calculate significance with error handling
    log_debug("SIGNIFICANCE", "Calculating significance");
    let significance = if exact_f.is_nan() || exact_f <= 0.0 || exact_df1 <= 0 || exact_df2 <= 0 {
        log_debug(
            "WARNING",
            &format!(
                "Invalid values for p-value calculation: F={}, df1={}, df2={}. Using p=1.0",
                exact_f,
                exact_df1,
                exact_df2
            )
        );
        1.0 // Default to non-significant when calculation fails
    } else {
        let p_value = calculate_p_value_from_f(exact_f, exact_df1 as f64, exact_df2 as f64);

        // Handle NaN p-values
        if p_value.is_nan() {
            log_debug("WARNING", "p-value calculation returned NaN. Using p=1.0");
            1.0
        } else {
            p_value
        }
    };

    log_debug(
        "OVERALL",
        &format!(
            "Step statistics: Lambda={:.4}, F={:.4} (df={},{}), p={:.4}",
            wilks_lambda,
            exact_f,
            exact_df1,
            exact_df2,
            significance
        )
    );

    // Generate pairwise comparisons if requested
    let pairwise_comparisons = if config.method.pairwise {
        log_debug("PAIRWISE", "Generating pairwise comparisons");
        generate_pairwise_comparisons(dataset, current_variables, step)
    } else {
        HashMap::new()
    };

    StepData {
        variable_entered,
        variable_removed,
        wilks_lambda,
        f_value,
        df1,
        df2,
        df3,
        exact_f,
        exact_df1,
        exact_df2,
        significance,
        variables_in_analysis: vars_in_analysis,
        variables_not_in_analysis: vars_not_in_analysis,
        pairwise_comparisons,
    }
}

/// Convert internal step data to the output format
///
/// # Parameters
/// * `steps_data` - Vector of StepData
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A StepwiseStatistics object for output
fn convert_steps_to_output(
    steps_data: Vec<StepData>,
    config: &DiscriminantConfig
) -> Result<StepwiseStatistics, String> {
    log_debug("CONVERT", &format!("Converting {} steps to output format", steps_data.len()));

    let mut result = StepwiseStatistics {
        variables_entered: Vec::new(),
        variables_removed: Vec::new(),
        wilks_lambda: Vec::new(),
        f_values: Vec::new(),
        df1: Vec::new(),
        df2: Vec::new(),
        df3: Vec::new(),
        exact_f: Vec::new(),
        exact_df1: Vec::new(),
        exact_df2: Vec::new(),
        significance: Vec::new(),
        variables_in_analysis: HashMap::new(),
        variables_not_in_analysis: HashMap::new(),
        pairwise_comparisons: HashMap::new(),
        note: create_stepwise_note(config),
    };

    // Extract data from step data
    for (step_idx, step) in steps_data.iter().enumerate() {
        // Add variables entered/removed
        result.variables_entered.push(step.variable_entered.clone().unwrap_or_default());
        result.variables_removed.push(step.variable_removed.clone());

        // Add statistical values
        result.wilks_lambda.push(step.wilks_lambda);
        result.f_values.push(step.f_value);
        result.df1.push(step.df1);
        result.df2.push(step.df2);
        result.df3.push(step.df3);
        result.exact_f.push(step.exact_f);
        result.exact_df1.push(step.exact_df1);
        result.exact_df2.push(step.exact_df2);
        result.significance.push(step.significance);

        // Add variables in analysis by step
        result.variables_in_analysis.insert(
            (step_idx + 1).to_string(),
            step.variables_in_analysis.clone()
        );

        // Add variables not in analysis by step
        result.variables_not_in_analysis.insert(
            step_idx.to_string(),
            step.variables_not_in_analysis.clone()
        );

        // Add pairwise comparisons if available
        if !step.pairwise_comparisons.is_empty() {
            result.pairwise_comparisons.insert(
                (step_idx + 1).to_string(),
                step.pairwise_comparisons.clone()
            );
        }
    }

    log_debug("OUTPUT", "Output conversion complete");
    Ok(result)
}

/// Create a StepwiseNote with configuration information
///
/// # Parameters
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A StepwiseNote object with method details
fn create_stepwise_note(config: &DiscriminantConfig) -> StepwiseNote {
    log_debug("NOTE", "Creating stepwise note");

    let max_steps = config.main.independent_variables.len() * 2;

    // Choose the appropriate message based on whether we're using F-values or p-values
    let (entry_msg, removal_msg) = if config.method.f_value {
        (
            format!("b. Minimum partial F to enter is {}.", config.method.f_entry),
            format!("c. Maximum partial F to remove is {}.", config.method.f_removal),
        )
    } else if config.method.f_probability {
        (
            format!("b. Maximum probability of F to enter is {}.", config.method.p_entry),
            format!("c. Minimum probability of F to remove is {}.", config.method.p_removal),
        )
    } else {
        (
            format!("b. Minimum partial F to enter is {}.", config.method.f_entry),
            format!("c. Maximum partial F to remove is {}.", config.method.f_removal),
        )
    };

    log_debug("NOTE_ENTRY", &entry_msg);
    log_debug("NOTE_REMOVAL", &removal_msg);

    StepwiseNote {
        max_steps: format!("a. Maximum number of steps is {}.", max_steps),
        min_f_to_enter: entry_msg,
        max_f_to_remove: removal_msg,
        note: "d. F level, tolerance, or VIN insufficient for further computation.".to_string(),
    }
}
