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

    // Log data
    web_sys::console::log_1(&format!("Data: {:?}", data).into());

    // Step 1: Case Processing Summary (always executed)
    executed_functions.push("case_processing_summary".to_string());
    let mut case_processing_summary = None;
    match core::calculate_case_processing_summary(data, config) {
        Ok(summary) => {
            web_sys::console::log_1(&format!("Case Processing Summary: {:?}", summary).into());
            case_processing_summary = Some(summary);
        }
        Err(e) => {
            error_collector.add_error("case_processing_summary", &e);
        }
    }

    let mut prepared_data = data.clone(); // Default to original data
    match core::prepare_data(data, config) {
        Ok(prepared) => {
            prepared_data = prepared;
        }
        Err(e) => {
            error_collector.add_error("filter_valid_cases", &e);
            // Continue execution despite errors for filtering
        }
    }

    // Prepared data for further processing
    web_sys::console::log_1(&format!("Prepared Data: {:?}", prepared_data).into());

    // Step 2: Variable Processing
    executed_functions.push("process_variables".to_string());
    let mut variables = None;
    match core::process_variables(&prepared_data, config) {
        Ok(var_info) => {
            variables = Some(var_info);
        }
        Err(e) => {
            error_collector.add_error("process_variables", &e);
        }
    }

    // Step 3: Calculate Centroids
    executed_functions.push("calculate_centroids".to_string());
    let mut centroids = None;
    match core::calculate_centroids(&prepared_data, config) {
        Ok(cent_result) => {
            centroids = Some(cent_result);
        }
        Err(e) => {
            error_collector.add_error("calculate_centroids", &e);
        }
    }

    // Step 4: Calculate Iteration History
    executed_functions.push("calculate_iteration_history".to_string());
    let mut iteration_history = None;
    match core::calculate_iteration_history(&prepared_data, config) {
        Ok(history) => {
            iteration_history = Some(history);
        }
        Err(e) => {
            error_collector.add_error("calculate_iteration_history", &e);
        }
    }

    // Step 5: Calculate Summary Analysis
    executed_functions.push("calculate_summary_analysis".to_string());
    let mut summary_analysis = None;
    match core::calculate_summary_analysis(&prepared_data, config) {
        Ok(summary) => {
            summary_analysis = Some(summary);
        }
        Err(e) => {
            error_collector.add_error("calculate_summary_analysis", &e);
        }
    }

    // Step 6: Calculate Weights
    executed_functions.push("calculate_weights".to_string());
    let mut weights = None;
    match core::calculate_weights(&prepared_data, config) {
        Ok(weight_result) => {
            weights = Some(weight_result);
        }
        Err(e) => {
            error_collector.add_error("calculate_weights", &e);
        }
    }

    // Step 7: Calculate Component Loadings
    executed_functions.push("calculate_component_loadings".to_string());
    let mut component_loadings = None;
    match core::calculate_component_loadings(&prepared_data, config) {
        Ok(loadings) => {
            component_loadings = Some(loadings);
        }
        Err(e) => {
            error_collector.add_error("calculate_component_loadings", &e);
        }
    }

    // Step 8: Calculate Fit Measures
    executed_functions.push("calculate_fit_measures".to_string());
    let mut fit_measures = None;
    match core::calculate_fit_measures(&prepared_data, config) {
        Ok(measures) => {
            fit_measures = Some(measures);
        }
        Err(e) => {
            error_collector.add_error("calculate_fit_measures", &e);
        }
    }

    // Step 9: Calculate Object Scores
    executed_functions.push("calculate_object_scores".to_string());
    let mut object_scores = None;
    match core::calculate_object_scores(&prepared_data, config) {
        Ok(scores) => {
            object_scores = Some(scores);
        }
        Err(e) => {
            error_collector.add_error("calculate_object_scores", &e);
        }
    }

    // Step 10: Generate Transformation Plots
    executed_functions.push("generate_transformation_plots".to_string());
    let mut transformation_plots = None;
    match core::generate_transformation_plots(&prepared_data, config) {
        Ok(plots) => {
            transformation_plots = Some(plots);
        }
        Err(e) => {
            error_collector.add_error("generate_transformation_plots", &e);
        }
    }

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
