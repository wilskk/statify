use std::collections::HashMap;

use crate::models::{
    config::KnnConfig,
    data::{DataValue, KnnData},
};

use super::{
    distance::find_k_nearest_neighbors,
    feature_selection::selected_feature_weights,
    prediction::{calculate_mean_prediction, calculate_median_prediction, category_key},
};

pub fn evaluate_knn_error(
    knn_data: &KnnData,
    config: &KnnConfig,
    k: usize,
    selected_features: &[usize],
) -> Result<f64, String> {
    evaluate_knn_error_with_scale_mode(knn_data, config, k, selected_features, false)
}

pub fn evaluate_knn_feature_importance_error(
    knn_data: &KnnData,
    config: &KnnConfig,
    k: usize,
    selected_features: &[usize],
) -> Result<f64, String> {
    evaluate_knn_error_with_scale_mode(knn_data, config, k, selected_features, true)
}

fn evaluate_knn_error_with_scale_mode(
    knn_data: &KnnData,
    config: &KnnConfig,
    k: usize,
    selected_features: &[usize],
    return_scale_sse: bool,
) -> Result<f64, String> {
    if knn_data.target_values.is_empty()
        || knn_data
            .target_values
            .iter()
            .all(|value| matches!(value, DataValue::Null))
    {
        return Err("Target values are required for KNN evaluation".to_string());
    }

    let weights = selected_feature_weights(knn_data, config, selected_features);
    let evaluation_indices = evaluation_case_indices(knn_data);
    let use_holdout = !knn_data.holdout_indices.is_empty();
    let evaluation_strategy = if use_holdout {
        "holdout"
    } else {
        "training_loo"
    };

    if evaluation_indices.is_empty() || knn_data.training_indices.is_empty() {
        return Ok(0.0);
    }

    let target_is_numeric = knn_data.target_is_numeric_scale();
    let training_class_counts =
        class_counts_for_indices(&knn_data.target_values, &knn_data.training_indices);
    let mut total_error = 0.0;
    let mut evaluated = 0usize;

    for &idx in &evaluation_indices {
        if idx >= knn_data.data_matrix.len() || idx >= knn_data.target_values.len() {
            continue;
        }

        let training_indices: Vec<usize> = if use_holdout {
            knn_data.training_indices.clone()
        } else {
            knn_data
                .training_indices
                .iter()
                .copied()
                .filter(|&candidate_idx| candidate_idx != idx)
                .collect()
        };

        if training_indices.is_empty() {
            continue;
        }

        let predicted = predict_knn(
            knn_data,
            config,
            k,
            idx,
            &training_indices,
            &weights,
            &training_class_counts,
            target_is_numeric,
        );

        if target_is_numeric {
            if let (DataValue::Number(actual), DataValue::Number(predicted)) =
                (&knn_data.target_values[idx], predicted)
            {
                total_error += (*actual - predicted).powi(2);
                evaluated += 1;
            }
        } else if let Some(actual_key) = category_key(Some(&knn_data.target_values[idx])) {
            total_error += if Some(actual_key) == category_key(Some(&predicted)) {
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

    if target_is_numeric && return_scale_sse {
        Ok(total_error)
    } else {
        Ok(average_error)
    }
}

pub fn predict_knn(
    knn_data: &KnnData,
    config: &KnnConfig,
    k: usize,
    query_idx: usize,
    training_indices: &[usize],
    weights: &[f64],
    training_class_counts: &HashMap<String, usize>,
    target_is_numeric: bool,
) -> DataValue {
    let neighbors = find_k_nearest_neighbors(
        &knn_data.data_matrix[query_idx],
        &knn_data.data_matrix,
        training_indices,
        k,
        config.neighbors.metric_eucli,
        Some(weights),
        Some(&knn_data.processed_case_indices),
    );

    if target_is_numeric {
        if config.neighbors.predictions_median {
            calculate_median_prediction(&neighbors, &knn_data.target_values)
        } else {
            calculate_mean_prediction(&neighbors, &knn_data.target_values)
        }
    } else {
        predict_categorical_majority(&neighbors, &knn_data.target_values, training_class_counts)
    }
}

fn evaluation_case_indices(knn_data: &KnnData) -> Vec<usize> {
    if knn_data.holdout_indices.is_empty() {
        knn_data.training_indices.clone()
    } else {
        knn_data.holdout_indices.clone()
    }
}

fn class_counts_for_indices(
    target_values: &[DataValue],
    indices: &[usize],
) -> HashMap<String, usize> {
    let mut counts = HashMap::new();

    for &idx in indices {
        if let Some(key) = category_key(target_values.get(idx)) {
            *counts.entry(key).or_insert(0) += 1;
        }
    }

    counts
}

fn predict_categorical_majority(
    neighbors: &[(usize, f64)],
    target_values: &[DataValue],
    training_class_counts: &HashMap<String, usize>,
) -> DataValue {
    let mut votes: HashMap<String, usize> = HashMap::new();

    for &(idx, _) in neighbors {
        if let Some(key) = category_key(target_values.get(idx)) {
            *votes.entry(key).or_insert(0) += 1;
        }
    }

    votes
        .into_iter()
        .max_by(|(left_key, left_votes), (right_key, right_votes)| {
            left_votes
                .cmp(right_votes)
                .then_with(|| {
                    training_class_counts
                        .get(left_key)
                        .copied()
                        .unwrap_or(0)
                        .cmp(&training_class_counts.get(right_key).copied().unwrap_or(0))
                })
                // Final tie-break follows SPSS-style ascending class order.
                .then_with(|| right_key.cmp(left_key))
        })
        .map(|(key, _)| data_value_from_category_key(&key, target_values))
        .unwrap_or(DataValue::Null)
}

fn data_value_from_category_key(key: &str, target_values: &[DataValue]) -> DataValue {
    if let Some(value) = target_values
        .iter()
        .find(|value| category_key(Some(value)).as_deref() == Some(key))
    {
        return value.clone();
    }

    if key.eq_ignore_ascii_case("true") {
        DataValue::Boolean(true)
    } else if key.eq_ignore_ascii_case("false") {
        DataValue::Boolean(false)
    } else {
        DataValue::Text(key.to_string())
    }
}

fn format_indices(indices: &[usize]) -> String {
    indices
        .iter()
        .map(|idx| idx.to_string())
        .collect::<Vec<_>>()
        .join(",")
}

fn log_diagnostic(_message: &str) {
}

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
    fn scale_feature_importance_error_returns_total_sum_of_squares() {
        let data = scale_test_data();

        let error = evaluate_knn_feature_importance_error(&data, &test_config(), 1, &[0]).unwrap();

        assert_eq!(error, 2.0);
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
