use wasm_bindgen::prelude::*;

use crate::overals::models::{
    config::OVERALSAnalysisConfig,
    data::AnalysisData,
    result::OVERALSAnalysisResult,
};
use crate::overals::utils::{ converter::string_to_js_error, error::ErrorCollector };
use crate::overals::stats::core;

pub fn run_analysis(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig,
    error_collector: &mut ErrorCollector
) -> Result<Option<OVERALSAnalysisResult>, JsValue> {
    web_sys::console::log_1(&"Starting OVERALS analysis".into());

    // Initialize result with executed functions tracking
    let mut executed_functions = Vec::new();

    // Log configuration to track which methods will be executed
    web_sys::console::log_1(&format!("Config: {:?}", config).into());

    // Step 1: Case Processing Summary (always executed)
    executed_functions.push("case_processing_summary".to_string());
    let case_processing_summary = match core::calculate_case_processing_summary(data, config) {
        Ok(summary) => summary,
        Err(e) => {
            error_collector.add_error("case_processing_summary", &e);
            return Err(string_to_js_error(e));
        }
    };

    let mut prepared_data = match core::prepare_data(data, config) {
        Ok(prepared) => prepared,
        Err(e) => {
            error_collector.add_error("filter_valid_cases", &e);
            // Continue execution despite errors for filtering
            data.clone() // Use original data if filtering fails
        }
    };

    // Step 2: Variable Processing
    executed_functions.push("process_variables".to_string());
    let variables = match core::process_variables(&prepared_data, config) {
        Ok(var_info) => var_info,
        Err(e) => {
            error_collector.add_error("process_variables", &e);
            return Err(string_to_js_error(e));
        }
    };

    // Step 3: Calculate Centroids
    executed_functions.push("calculate_centroids".to_string());
    let centroids = match core::calculate_centroids(&prepared_data, config) {
        Ok(cent_result) => cent_result,
        Err(e) => {
            error_collector.add_error("calculate_centroids", &e);
            return Err(string_to_js_error(e));
        }
    };

    // Step 4: Calculate Iteration History
    executed_functions.push("calculate_iteration_history".to_string());
    let iteration_history = match core::calculate_iteration_history(&prepared_data, config) {
        Ok(history) => history,
        Err(e) => {
            error_collector.add_error("calculate_iteration_history", &e);
            return Err(string_to_js_error(e));
        }
    };

    // Step 5: Calculate Summary Analysis
    executed_functions.push("calculate_summary_analysis".to_string());
    let summary_analysis = match core::calculate_summary_analysis(&prepared_data, config) {
        Ok(summary) => summary,
        Err(e) => {
            error_collector.add_error("calculate_summary_analysis", &e);
            return Err(string_to_js_error(e));
        }
    };

    // Step 6: Calculate Weights
    executed_functions.push("calculate_weights".to_string());
    let weights = match core::calculate_weights(&prepared_data, config) {
        Ok(weight_result) => weight_result,
        Err(e) => {
            error_collector.add_error("calculate_weights", &e);
            return Err(string_to_js_error(e));
        }
    };

    // Step 7: Calculate Component Loadings
    executed_functions.push("calculate_component_loadings".to_string());
    let component_loadings = match core::calculate_component_loadings(&prepared_data, config) {
        Ok(loadings) => loadings,
        Err(e) => {
            error_collector.add_error("calculate_component_loadings", &e);
            return Err(string_to_js_error(e));
        }
    };

    // Step 8: Calculate Fit Measures
    executed_functions.push("calculate_fit_measures".to_string());
    let fit_measures = match core::calculate_fit_measures(&prepared_data, config) {
        Ok(measures) => measures,
        Err(e) => {
            error_collector.add_error("calculate_fit_measures", &e);
            return Err(string_to_js_error(e));
        }
    };

    // Step 9: Calculate Object Scores
    executed_functions.push("calculate_object_scores".to_string());
    let object_scores = match core::calculate_object_scores(&prepared_data, config) {
        Ok(scores) => scores,
        Err(e) => {
            error_collector.add_error("calculate_object_scores", &e);
            return Err(string_to_js_error(e));
        }
    };

    // Step 10: Generate Transformation Plots
    executed_functions.push("generate_transformation_plots".to_string());
    let transformation_plots = match core::generate_transformation_plots(&prepared_data, config) {
        Ok(plots) => plots,
        Err(e) => {
            error_collector.add_error("generate_transformation_plots", &e);
            return Err(string_to_js_error(e));
        }
    };

    // Create the final result
    let result = OVERALSAnalysisResult {
        case_processing_summary,
        variables,
        centroids,
        iteration_history,
        summary_analysis,
        weights,
        component_loadings,
        fit_measures,
        object_scores,
        transformation_plots,
    };

    Ok(Some(result))
}

pub fn get_results(result: &Option<OVERALSAnalysisResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => Ok(serde_wasm_bindgen::to_value(result).unwrap()),
        None => Err(string_to_js_error("No analysis results available".to_string())),
    }
}

pub fn get_executed_functions(result: &Option<OVERALSAnalysisResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => Ok(serde_wasm_bindgen::to_value(result).unwrap()),
        None => Err(string_to_js_error("No analysis results available".to_string())),
    }
}

pub fn get_all_errors(error_collector: &ErrorCollector) -> JsValue {
    JsValue::from_str(&error_collector.get_error_summary())
}

pub fn clear_errors(error_collector: &mut ErrorCollector) -> JsValue {
    error_collector.clear();
    JsValue::from_str("Error collector cleared")
}
