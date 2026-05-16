use wasm_bindgen::prelude::*;

use crate::models::result::{KSelectionCandidate, KSelectionChart};
use crate::models::{config::KnnConfig, data::AnalysisData, result::NearestNeighborAnalysis};
use crate::stats::core;
use crate::utils::converter::format_result;
use crate::utils::log::FunctionLogger;
use crate::utils::{converter::string_to_js_error, error::ErrorCollector};

pub fn run_analysis(
    data: &AnalysisData,
    config: &KnnConfig,
    error_collector: &mut ErrorCollector,
    logger: &mut FunctionLogger,
) -> Result<Option<NearestNeighborAnalysis>, JsValue> {
    // Step 1: System settings if requested
    let mut system_settings = None;
    if config.partition.set_seed {
        logger.add_log("system_settings");
        match core::generate_mersenne_twister(data, config) {
            Ok(seed) => {
                system_settings = Some(seed);
            }
            Err(e) => {
                error_collector.add_error("system_settings", &e);
            }
        }
    }

    // Step 1: Basic processing summary
    let mut case_processing_summary = None;
    if config.output.case_summary {
        logger.add_log("basic_processing_summary");
        match core::basic_processing_summary(data, config) {
            Ok(summary) => {
                case_processing_summary = Some(summary);
            }
            Err(e) => {
                error_collector.add_error("basic_processing_summary", &e);
            }
        };
    }

    let mut feature_selection_data = None;
    let mut feature_selection_resolution = None;
    if config.features.perform_selection {
        match core::preprocess_knn_data(data, config).and_then(|knn_data| {
            core::resolve_feature_selection(&knn_data, config)
                .map(|resolution| (knn_data, resolution))
        }) {
            Ok((knn_data, resolution)) => {
                feature_selection_data = Some(knn_data);
                feature_selection_resolution = Some(resolution);
            }
            Err(e) => error_collector.add_error("feature_selection", &e),
        }
    }

    let mut feature_selection_summary = None;
    let mut feature_selection_steps = None;
    let mut k_feature_selection_summary = None;
    if config.features.perform_selection && config.output.feature_selection_summary {
        logger.add_log("feature_selection");
        if let Some(resolution) = feature_selection_resolution.as_ref() {
            feature_selection_summary = resolution.summary.clone();
            feature_selection_steps = Some(resolution.steps.clone());
            k_feature_selection_summary = if resolution.k_summaries.is_empty() {
                None
            } else {
                Some(resolution.k_summaries.clone())
            };
        }
    }

    let mut k_selection_chart = None;
    if config.neighbors.auto_selection && config.output.k_selection_chart {
        logger.add_log("k_selection_chart");
        if config.features.perform_selection {
            if let Some(resolution) = feature_selection_resolution.as_ref() {
                if !resolution.k_summaries.is_empty() {
                    let summaries = resolution.k_summaries.clone();
                    k_selection_chart = Some(KSelectionChart {
                        selected_k: resolution.selected_k,
                        metric_name: "feature_selection_holdout_error".to_string(),
                        candidates: summaries
                            .into_iter()
                            .map(|summary| KSelectionCandidate {
                                k: summary.k,
                                average_error: summary.error,
                                selected: summary.selected,
                            })
                            .collect(),
                    });
                }
            }
        } else {
            match core::preprocess_knn_data(data, config)
                .and_then(|knn_data| core::calculate_k_selection_chart(&knn_data, config))
            {
                Ok(chart) => k_selection_chart = chart,
                Err(e) => error_collector.add_error("k_selection_chart", &e),
            }
        }
    }

    // Step 2: Nearest neighbors
    logger.add_log("nearest_neighbors");
    let mut nearest_neighbors = None;
    if config.output.show_neighbor_detail {
        match core::calculate_nearest_neighbors(data, config) {
            Ok(neighbors) => {
                nearest_neighbors = Some(neighbors);
            }
            Err(e) => {
                error_collector.add_error("nearest_neighbors", &e);
            }
        }
    };

    // Step 3: Classification results
    logger.add_log("classification_results");
    let mut classification_table = None;
    if config.output.confusion_matrix {
        match core::calculate_classification_table(data, config) {
            Ok(table) => {
                classification_table = Some(table);
            }
            Err(e) => {
                error_collector.add_error("classification_results", &e);
            }
        }
    };

    let mut prediction_results = None;
    if config.output.prediction_results {
        logger.add_log("prediction_results");
        match core::calculate_prediction_results(data, config) {
            Ok(result) => prediction_results = Some(result),
            Err(e) => error_collector.add_error("prediction_results", &e),
        }
    }

    // Step 4: Predictor importance / feature weights if requested by feature selection or weighting
    let mut predictor_importance = None;
    if config.features.perform_selection || config.neighbors.weight {
        logger.add_log("predictor_importance");

        if config.features.perform_selection {
            let target_var = config.main.target_var.as_deref();
            match (
                feature_selection_data.as_ref(),
                feature_selection_resolution.as_ref(),
                target_var,
            ) {
                (Some(knn_data), Some(resolution), Some(target_var)) => {
                    match core::compute_knn_feature_importance_for_subset(
                        knn_data,
                        config,
                        target_var,
                        resolution.selected_k,
                        &resolution.selected_indices,
                    ) {
                        Ok(importance) => {
                            predictor_importance = Some(importance);
                        }
                        Err(e) => {
                            error_collector.add_error("predictor_importance", &e);
                        }
                    }
                }
                (_, _, None) => {
                    error_collector.add_error(
                        "predictor_importance",
                        "A target variable is required for calculating feature importance",
                    );
                }
                _ => {}
            }
        } else {
            match core::compute_knn_feature_importance(data, config) {
                Ok(importance) => {
                    predictor_importance = Some(importance);
                }
                Err(e) => {
                    error_collector.add_error("predictor_importance", &e);
                }
            }
        }
    }

    // Step 5: Predictor space
    logger.add_log("predictor_space");
    let mut predictor_space = None;
    if config.output.predictor_space {
        match core::calculate_predictor_space(data, config) {
            Ok(space) => {
                predictor_space = Some(space);
            }
            Err(e) => {
                error_collector.add_error("predictor_space", &e);
            }
        }
    };

    // Step 6: Peers chart
    logger.add_log("peers_chart");
    let mut peers_chart = None;
    match core::calculate_peers_chart(data, config) {
        Ok(chart) => {
            peers_chart = Some(chart);
        }
        Err(e) => {
            error_collector.add_error("peers_chart", &e);
        }
    }

    // Step 7: Quadrant map
    logger.add_log("quadrant_map");
    let mut quadrant_map = None;
    match core::calculate_quadrant_map(data, config) {
        Ok(map) => {
            quadrant_map = Some(map);
        }
        Err(e) => {
            error_collector.add_error("quadrant_map", &e);
        }
    }

    // Step 8: Error summary
    logger.add_log("error_summary");
    let mut error_summary = None;
    match core::calculate_error_summary(&classification_table) {
        Ok(summary) => {
            error_summary = Some(summary);
        }
        Err(e) => {
            error_collector.add_error("error_summary", &e);
        }
    }

    // Step 9: Saved variables for Data Viewer
    let mut saved_variables = None;
    if config.save.has_target_var
        || config.save.is_cate_target_var
        || config.save.random_assign_to_partition
        || config.save.random_assign_to_fold
    {
        logger.add_log("saved_variables");
        match core::calculate_saved_variables(data, config) {
            Ok(saved) => {
                saved_variables = saved;
            }
            Err(e) => {
                error_collector.add_error("saved_variables", &e);
            }
        }
    }

    // Create the final result
    let result = NearestNeighborAnalysis {
        case_processing_summary,
        feature_selection_summary,
        feature_selection_steps,
        k_feature_selection_summary,
        k_selection_chart,
        prediction_results,
        system_settings,
        predictor_importance,
        classification_table,
        error_summary,
        predictor_space,
        peers_chart,
        nearest_neighbors,
        quadrant_map,
        saved_variables,
    };

    Ok(Some(result))
}

pub fn get_results(result: &Option<NearestNeighborAnalysis>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => Ok(serde_wasm_bindgen::to_value(result).unwrap()),
        None => Err(string_to_js_error(
            "No analysis results available".to_string(),
        )),
    }
}

pub fn get_formatted_results(result: &Option<NearestNeighborAnalysis>) -> Result<JsValue, JsValue> {
    format_result(result)
}

pub fn get_all_log(logger: &FunctionLogger) -> Result<JsValue, JsValue> {
    Ok(serde_wasm_bindgen::to_value(&logger.get_executed_functions()).unwrap_or(JsValue::NULL))
}

pub fn get_all_errors(error_collector: &ErrorCollector) -> JsValue {
    JsValue::from_str(&error_collector.get_error_summary())
}

pub fn clear_errors(error_collector: &mut ErrorCollector) -> JsValue {
    error_collector.clear();
    JsValue::from_str("Error collector cleared")
}
