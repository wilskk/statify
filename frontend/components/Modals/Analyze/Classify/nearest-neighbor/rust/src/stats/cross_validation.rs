use crate::models::{
    config::KnnConfig,
    data::{DataValue, KnnData},
};

use super::{
    distance::find_k_nearest_neighbors,
    feature_selection::build_effective_feature_weights,
    prediction::{
        calculate_categorical_prediction, calculate_mean_prediction, calculate_median_prediction,
    },
};

pub fn determine_k_value(config: &KnnConfig) -> usize {
    if config.neighbors.specify {
        config.neighbors.specify_k.max(1) as usize
    } else if config.neighbors.auto_selection {
        config.neighbors.min_k.unwrap_or(3).max(1) as usize
    } else {
        3
    }
}

pub fn perform_cross_validation(knn_data: &KnnData, config: &KnnConfig) -> Result<usize, String> {
    let min_k = config.neighbors.min_k.unwrap_or(3).max(1) as usize;
    let max_k = config
        .neighbors
        .max_k
        .unwrap_or(min_k as i32)
        .max(min_k as i32) as usize;
    let use_euclidean = config.neighbors.metric_eucli;
    let use_median = config.neighbors.predictions_median;
    let weights = build_effective_feature_weights(knn_data, config)?;

    if min_k >= max_k {
        return Ok(min_k);
    }

    if knn_data.cross_validation_folds.len() != knn_data.data_matrix.len() {
        return Err("Cross-validation folds do not match the processed data size".to_string());
    }

    let training_folds: Vec<usize> = knn_data
        .training_indices
        .iter()
        .filter_map(|&idx| knn_data.cross_validation_folds.get(idx).copied())
        .collect();

    let mut fold_groups = training_folds.clone();
    fold_groups.sort_unstable();
    fold_groups.dedup();

    if fold_groups.len() < 2 {
        return Ok(min_k);
    }

    let mut best_k = min_k;
    let mut min_error = f64::MAX;

    for k in min_k..=max_k {
        let mut total_error = 0.0;
        let mut evaluated_folds = 0;

        for &fold in &fold_groups {
            let validation_indices: Vec<usize> = training_folds
                .iter()
                .enumerate()
                .filter_map(|(idx, &fold_num)| {
                    if fold_num == fold {
                        Some(knn_data.training_indices[idx])
                    } else {
                        None
                    }
                })
                .collect();

            let training_indices: Vec<usize> = training_folds
                .iter()
                .enumerate()
                .filter_map(|(idx, &fold_num)| {
                    if fold_num != fold {
                        Some(knn_data.training_indices[idx])
                    } else {
                        None
                    }
                })
                .collect();

            if validation_indices.is_empty() || training_indices.is_empty() {
                continue;
            }

            let fold_error = calculate_fold_error(
                knn_data,
                &training_indices,
                &validation_indices,
                k,
                use_euclidean,
                use_median,
                weights.as_deref(),
            )?;

            total_error += fold_error;
            evaluated_folds += 1;
        }

        if evaluated_folds == 0 {
            continue;
        }

        let avg_error = total_error / (evaluated_folds as f64);
        if avg_error < min_error {
            min_error = avg_error;
            best_k = k;
        }
    }

    Ok(best_k)
}

fn calculate_fold_error(
    knn_data: &KnnData,
    training_indices: &[usize],
    validation_indices: &[usize],
    k: usize,
    use_euclidean: bool,
    use_median: bool,
    weights: Option<&[f64]>,
) -> Result<f64, String> {
    let mut total_error = 0.0;
    let mut count = 0;

    let target_is_categorical = knn_data
        .target_values
        .iter()
        .all(|v| matches!(v, DataValue::Text(_) | DataValue::Boolean(_)));

    for &idx in validation_indices {
        let neighbors = find_k_nearest_neighbors(
            &knn_data.data_matrix[idx],
            &knn_data.data_matrix,
            training_indices,
            k,
            use_euclidean,
            weights,
        );

        if target_is_categorical {
            let actual = &knn_data.target_values[idx];
            let predicted = calculate_categorical_prediction(&neighbors, &knn_data.target_values);

            match (actual, &predicted) {
                (DataValue::Text(a), DataValue::Text(p)) => {
                    if a != p {
                        total_error += 1.0;
                    }
                }
                (DataValue::Boolean(a), DataValue::Boolean(p)) => {
                    if a != p {
                        total_error += 1.0;
                    }
                }
                _ => total_error += 1.0,
            }
        } else if let DataValue::Number(actual) = knn_data.target_values[idx] {
            let prediction_fn = if use_median {
                calculate_median_prediction
            } else {
                calculate_mean_prediction
            };

            let predicted = if let DataValue::Number(val) =
                prediction_fn(&neighbors, &knn_data.target_values)
            {
                val
            } else {
                0.0
            };

            total_error += (actual - predicted).powi(2);
        }

        count += 1;
    }

    if count > 0 {
        Ok(total_error / (count as f64))
    } else {
        Ok(0.0)
    }
}
