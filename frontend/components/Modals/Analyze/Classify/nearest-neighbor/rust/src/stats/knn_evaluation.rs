use crate::models::{
    config::KnnConfig,
    data::{DataValue, KnnData},
    result::{PredictionResultRow, RegressionFeatureImportanceBaseDebugRow},
};

use super::{
    feature_selection::selected_feature_weights, prediction::category_key,
    prediction_results::build_prediction_result_rows_for_knn_data,
};

pub fn evaluate_knn_error(
    knn_data: &KnnData,
    config: &KnnConfig,
    k: usize,
    selected_features: &[usize],
) -> Result<f64, String> {
    evaluate_knn_error_with_options(knn_data, config, k, selected_features, false, false)
}

pub fn evaluate_knn_feature_importance_error(
    knn_data: &KnnData,
    config: &KnnConfig,
    k: usize,
    selected_features: &[usize],
) -> Result<f64, String> {
    evaluate_knn_error_with_options(knn_data, config, k, selected_features, true, true)
}

pub fn evaluate_knn_regression_feature_importance_base(
    knn_data: &KnnData,
    config: &KnnConfig,
    k: usize,
    selected_features: &[usize],
) -> Result<(f64, Vec<RegressionFeatureImportanceBaseDebugRow>), String> {
    if !knn_data.target_is_numeric_scale() {
        return Ok((0.0, Vec::new()));
    }

    let weights = selected_unit_feature_weights(knn_data, selected_features);
    let evaluation_indices = knn_data.training_indices.clone();
    let base_predictions =
        unweighted_prediction_rows(knn_data, config, k, &weights, &evaluation_indices);
    let mut rows = Vec::with_capacity(base_predictions.len());
    let mut base_error = 0.0;

    for prediction in &base_predictions {
        if let (DataValue::Number(actual_y), DataValue::Number(yhat)) =
            (&prediction.actual, &prediction.predicted)
        {
            let squared_error = (*actual_y - *yhat).powi(2);
            base_error += squared_error;
            rows.push(RegressionFeatureImportanceBaseDebugRow {
                case_id: prediction.case_id,
                row_index: prediction.row_index,
                actual_y: *actual_y,
                yhat_unweighted_normal: *yhat,
                yhat_feature_importance_base: *yhat,
                squared_error,
            });
        }
    }

    Ok((base_error, rows))
}

fn unweighted_prediction_rows(
    knn_data: &KnnData,
    config: &KnnConfig,
    k: usize,
    weights: &[f64],
    ordered_indices: &[usize],
) -> Vec<PredictionResultRow> {
    build_prediction_result_rows_for_knn_data(knn_data, config, k, Some(weights), ordered_indices)
}

fn evaluate_knn_error_with_options(
    knn_data: &KnnData,
    config: &KnnConfig,
    k: usize,
    selected_features: &[usize],
    use_unit_feature_weights_for_evaluation: bool,
    return_sse_for_numeric_target: bool,
) -> Result<f64, String> {
    if knn_data.target_values.is_empty()
        || knn_data
            .target_values
            .iter()
            .all(|value| matches!(value, DataValue::Null))
    {
        return Err("Target values are required for KNN evaluation".to_string());
    }

    let weights = if use_unit_feature_weights_for_evaluation {
        selected_unit_feature_weights(knn_data, selected_features)
    } else {
        selected_feature_weights(knn_data, config, selected_features)
    };
    let target_is_numeric = knn_data.target_is_numeric_scale();
    let evaluation_indices = if target_is_numeric && return_sse_for_numeric_target {
        knn_data.training_indices.clone()
    } else {
        evaluation_case_indices(knn_data)
    };
    let evaluation_strategy = if target_is_numeric && return_sse_for_numeric_target {
        "training_loo"
    } else if !knn_data.holdout_indices.is_empty() {
        "holdout"
    } else {
        "training_loo"
    };

    if evaluation_indices.is_empty() || knn_data.training_indices.is_empty() {
        return Ok(0.0);
    }

    let prediction_rows = build_prediction_result_rows_for_knn_data(
        knn_data,
        config,
        k,
        Some(&weights),
        &evaluation_indices,
    );
    let mut total_error = 0.0;
    let mut evaluated = 0usize;

    for prediction in &prediction_rows {
        if target_is_numeric {
            if let (DataValue::Number(actual), DataValue::Number(predicted)) =
                (&prediction.actual, &prediction.predicted)
            {
                total_error += (*actual - *predicted).powi(2);
                evaluated += 1;
            }
        } else if let Some(actual_key) = category_key(Some(&prediction.actual)) {
            total_error += if Some(actual_key) == category_key(Some(&prediction.predicted)) {
                0.0
            } else {
                1.0
            };
            evaluated += 1;
        }
    }

    let average_error = if evaluated > 0 {
        total_error / (evaluated as f64)
    } else {
        0.0
    };

    if target_is_numeric {
        log_diagnostic(&format!(
            "KNN scale error evaluation: evaluation_strategy={}, total_cases={}, total_error={:.12}, average_error={:.12}, query_indices=[{}]",
            evaluation_strategy,
            evaluated,
            total_error,
            average_error,
            format_indices(&evaluation_indices)
        ));
    }

    if target_is_numeric && return_sse_for_numeric_target {
        Ok(total_error)
    } else {
        Ok(average_error)
    }
}

fn selected_unit_feature_weights(knn_data: &KnnData, selected_features: &[usize]) -> Vec<f64> {
    let mut weights = vec![0.0; knn_data.features.len()];

    for &feature_idx in selected_features {
        if feature_idx < weights.len() {
            weights[feature_idx] = 1.0;
        }
    }

    weights
}

fn evaluation_case_indices(knn_data: &KnnData) -> Vec<usize> {
    if knn_data.holdout_indices.is_empty() {
        knn_data.training_indices.clone()
    } else {
        knn_data.holdout_indices.clone()
    }
}

fn format_indices(indices: &[usize]) -> String {
    indices
        .iter()
        .map(|idx| idx.to_string())
        .collect::<Vec<_>>()
        .join(",")
}

fn log_diagnostic(_message: &str) {}

#[cfg(test)]
mod tests {
    use crate::models::{
        config::{
            FeaturesConfig, KnnConfig, MainConfig, NeighborsConfig, OutputConfig, PartitionConfig,
            SaveConfig,
        },
        data::{DataValue, KnnData, VariableMeasure},
    };

    use super::{evaluate_knn_error, evaluate_knn_feature_importance_error};

    #[test]
    fn scale_error_returns_mean_squared_error_for_general_model_evaluation() {
        let data = scale_test_data();

        let error = evaluate_knn_error(&data, &test_config(), 1, &[0]).unwrap();

        assert_eq!(error, 1.0);
    }

    #[test]
    fn scale_feature_importance_error_returns_training_leave_one_out_sum_of_squares() {
        let data = scale_test_data();

        let error = evaluate_knn_feature_importance_error(&data, &test_config(), 1, &[0]).unwrap();

        assert_eq!(error, 300.0);
    }

    fn scale_test_data() -> KnnData {
        KnnData {
            features: vec!["x".to_string()],
            data_matrix: vec![vec![0.0], vec![10.0], vec![20.0], vec![1.0], vec![19.0]],
            display_matrix: vec![vec![0.0], vec![10.0], vec![20.0], vec![1.0], vec![19.0]],
            target_values: vec![
                DataValue::Number(0.0),
                DataValue::Number(10.0),
                DataValue::Number(20.0),
                DataValue::Number(1.0),
                DataValue::Number(19.0),
            ],
            target_measure: VariableMeasure::Scale,
            case_identifiers: vec![1, 2, 3, 4, 5],
            case_labels: vec![
                "1".to_string(),
                "2".to_string(),
                "3".to_string(),
                "4".to_string(),
                "5".to_string(),
            ],
            processed_case_indices: vec![0, 1, 2, 3, 4],
            training_indices: vec![0, 1, 2],
            holdout_indices: vec![3, 4],
            excluded_indices: Vec::new(),
            cross_validation_folds: vec![0; 5],
            focal_indices: Vec::new(),
        }
    }

    fn test_config() -> KnnConfig {
        KnnConfig {
            main: MainConfig {
                target_var: Some("target".to_string()),
                feature_var: Some(vec!["x".to_string()]),
                case_iden_var: None,
                focal_case_iden_var: None,
                norm_covar: false,
            },
            neighbors: NeighborsConfig {
                specify: true,
                auto_selection: false,
                specify_k: 1,
                min_k: Some(1),
                max_k: Some(1),
                metric_eucli: true,
                metric_manhattan: false,
                weight: false,
                predictions_mean: true,
                predictions_median: false,
            },
            features: FeaturesConfig {
                forward_selection: None,
                forced_entry_var: None,
                features_to_evaluate: 0,
                forced_features: 0,
                perform_selection: false,
                max_reached: false,
                below_min: false,
                max_to_select: None,
                min_change: 0.0,
            },
            partition: PartitionConfig {
                src_var: None,
                partitioning_variable: None,
                use_randomly: false,
                use_variable: false,
                v_fold_partitioning_variable: None,
                v_fold_use_randomly: false,
                v_fold_use_partitioning_var: false,
                training_number: 70,
                num_partition: 2,
                set_seed: false,
                seed: None,
            },
            save: SaveConfig {
                auto_name: true,
                custom_name: false,
                max_cats_to_save: None,
                has_target_var: false,
                is_cate_target_var: false,
                random_assign_to_partition: false,
                random_assign_to_fold: false,
            },
            output: OutputConfig {
                case_summary: true,
                feature_selection_summary: true,
                k_selection_chart: true,
                predictor_space: true,
                prediction_results: true,
                confusion_matrix: true,
                show_neighbor_detail: false,
                chart_and_table: true,
                export_model_xml: false,
                xml_file_path: None,
                export_distance: false,
                create_dataset: false,
                write_data_file: false,
                new_data_file_path: None,
                dataset_name: None,
            },
        }
    }
}
