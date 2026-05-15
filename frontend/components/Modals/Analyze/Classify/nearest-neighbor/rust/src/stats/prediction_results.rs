use std::collections::HashSet;

use crate::models::{
    config::KnnConfig,
    data::{AnalysisData, DataValue},
    result::{PredictionResultRow, PredictionResults},
};

use super::{
    core::{build_effective_feature_weights, determine_effective_k},
    distance::find_k_nearest_neighbors,
    prediction::{
        calculate_categorical_prediction_with_weights, calculate_categorical_probabilities,
        calculate_mean_prediction, calculate_median_prediction, category_key,
        sorted_target_categories_for_indices,
    },
    preprocess_data::preprocess_knn_data,
};

pub fn calculate_prediction_results(
    data: &AnalysisData,
    config: &KnnConfig,
) -> Result<PredictionResults, String> {
    let knn_data = preprocess_knn_data(data, config)?;
    let k = determine_effective_k(&knn_data, config)?;
    let weights = build_effective_feature_weights(&knn_data, config)?;
    let target_is_numeric = knn_data.target_is_numeric_scale();
    let training_set: HashSet<usize> = knn_data.training_indices.iter().copied().collect();
    let holdout_set: HashSet<usize> = knn_data.holdout_indices.iter().copied().collect();
    let categories =
        sorted_target_categories_for_indices(&knn_data.target_values, &knn_data.training_indices);
    let mut ordered_indices = knn_data.holdout_indices.clone();
    ordered_indices.extend(knn_data.training_indices.iter().copied());

    let mut rows = Vec::new();
    for idx in ordered_indices {
        let sample_type = if holdout_set.contains(&idx) {
            "Holdout"
        } else if training_set.contains(&idx) {
            "Training"
        } else {
            continue;
        };
        let candidate_indices: Vec<usize> = knn_data
            .training_indices
            .iter()
            .copied()
            .filter(|&candidate_idx| candidate_idx != idx)
            .collect();
        if candidate_indices.is_empty() {
            continue;
        }

        let neighbors = find_k_nearest_neighbors(
            &knn_data.data_matrix[idx],
            &knn_data.data_matrix,
            &candidate_indices,
            k,
            config.neighbors.metric_eucli,
            weights.as_deref(),
            Some(&knn_data.processed_case_indices),
        );

        let actual = knn_data.target_values[idx].clone();
        let (predicted, correct, probability, error, squared_error) = if target_is_numeric {
            let predicted = if config.neighbors.predictions_median {
                calculate_median_prediction(&neighbors, &knn_data.target_values)
            } else {
                calculate_mean_prediction(&neighbors, &knn_data.target_values)
            };
            let (error, squared_error) = match (&actual, &predicted) {
                (DataValue::Number(actual), DataValue::Number(predicted)) => {
                    let error = actual - predicted;
                    (Some(error), Some(error.powi(2)))
                }
                _ => (None, None),
            };
            (predicted, None, None, error, squared_error)
        } else {
            let predicted = calculate_categorical_prediction_with_weights(
                &neighbors,
                &knn_data.target_values,
                config.neighbors.weight,
            );
            let probability = category_key(Some(&predicted)).and_then(|predicted_key| {
                calculate_categorical_probabilities(
                    &neighbors,
                    &knn_data.target_values,
                    &categories,
                )
                .into_iter()
                .find_map(|(key, value)| {
                    if key == predicted_key {
                        Some(value)
                    } else {
                        None
                    }
                })
            });
            let correct = Some(category_key(Some(&actual)) == category_key(Some(&predicted)));
            (predicted, correct, probability, None, None)
        };

        rows.push(PredictionResultRow {
            case_id: knn_data.case_identifiers[idx],
            row_index: knn_data.processed_case_indices[idx],
            sample_type: sample_type.to_string(),
            actual,
            predicted,
            correct,
            probability_predicted_class: probability,
            error,
            squared_error,
        });
    }

    Ok(PredictionResults {
        rows,
        target_type: if target_is_numeric {
            "continuous".to_string()
        } else {
            "categorical".to_string()
        },
    })
}
