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
        log_debug(&format!(
            "KNN scale error evaluation: evaluation_strategy={}, total_cases={}, total_error={:.12}, average_error={:.12}, query_indices=[{}]",
            evaluation_strategy,
            evaluated,
            total_error,
            average_error,
            format_indices(&evaluation_indices)
        ));
    }

    Ok(average_error)
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

fn log_debug(message: &str) {
    #[cfg(target_arch = "wasm32")]
    web_sys::console::log_1(&message.into());

    #[cfg(not(target_arch = "wasm32"))]
    eprintln!("{}", message);
}
