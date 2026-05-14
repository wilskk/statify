use crate::models::{
    config::KnnConfig,
    data::{AnalysisData, DataValue},
    result::{FocalNeighborSet, NearestNeighbors, NeighborDetail},
};

use super::core::{
    build_effective_feature_weights, calculate_mean_prediction, calculate_median_prediction,
    determine_effective_k, find_k_nearest_neighbors, preprocess_knn_data,
};
use super::prediction::calculate_categorical_prediction_with_weights;

/// Calculates nearest neighbors for the whole dataset
pub fn calculate_nearest_neighbors(
    data: &AnalysisData,
    config: &KnnConfig,
) -> Result<NearestNeighbors, String> {
    // Preprocess data
    let knn_data = preprocess_knn_data(data, config)?;

    // Get focal case info
    let focal_indices =
        if !knn_data.focal_indices.is_empty() && config.main.focal_case_iden_var.is_some() {
            // If focal_case_iden_var is provided, use the focal indices from knn_data
            knn_data.focal_indices.clone()
        } else {
            // Otherwise, use all indices (not just training indices)
            let mut all_indices = Vec::new();
            for i in 0..knn_data.data_matrix.len() {
                all_indices.push(i);
            }
            all_indices
        };

    if focal_indices.is_empty() {
        return Err("No focal cases found".to_string());
    }

    // Determine k value - use auto-selection if specified
    let k = determine_effective_k(&knn_data, config)?;

    let use_euclidean = config.neighbors.metric_eucli;
    let distance_metric = if use_euclidean {
        "Euclidean".to_string()
    } else {
        "Manhattan".to_string()
    };

    let prediction_method = numeric_prediction_method(&knn_data, config);

    // Get feature weights if enabled
    let weights = build_effective_feature_weights(&knn_data, config)?;

    // Combine training and holdout indices for finding neighbors
    let mut all_candidate_indices = Vec::new();
    all_candidate_indices.extend_from_slice(&knn_data.training_indices);
    all_candidate_indices.extend_from_slice(&knn_data.holdout_indices);
    all_candidate_indices.sort();
    all_candidate_indices.dedup();

    // Process each focal point and find their neighbors
    let focal_neighbor_sets = focal_indices
        .iter()
        .map(|&focal_idx| {
            let focal_record = knn_data.case_identifiers[focal_idx];

            // Filter out any index that has the same case identifier as the focal record
            let candidate_indices: Vec<usize> = all_candidate_indices
                .iter()
                .filter(|&&idx| knn_data.case_identifiers[idx] != focal_record)
                .copied()
                .collect();

            // Find k nearest neighbors to this focal case
            let neighbors = find_k_nearest_neighbors(
                &knn_data.data_matrix[focal_idx],
                &knn_data.data_matrix,
                &candidate_indices,
                k,
                use_euclidean,
                weights.as_deref(),
            );

            // Create neighbor details
            let mut neighbor_details = Vec::with_capacity(neighbors.len());
            let mut distances = Vec::with_capacity(neighbors.len());

            let predicted_value = calculate_neighbor_prediction(&neighbors, &knn_data, config);

            for (idx, distance) in neighbors {
                let neighbor_id = knn_data.case_identifiers[idx];
                neighbor_details.push(NeighborDetail {
                    id: neighbor_id,
                    distance,
                });
                distances.push(distance);
            }

            // Return this focal point and its neighbors
            FocalNeighborSet {
                focal_record,
                neighbors: neighbor_details,
                distances,
                predicted_value,
            }
        })
        .collect();

    Ok(NearestNeighbors {
        k_value: k,
        distance_metric,
        weighting_enabled: config.neighbors.weight,
        prediction_method,
        focal_neighbor_sets,
    })
}

fn numeric_prediction_method(
    knn_data: &crate::models::data::KnnData,
    config: &KnnConfig,
) -> Option<String> {
    if !knn_data.target_is_numeric_scale() {
        return None;
    }

    if config.neighbors.predictions_median {
        Some("Median".to_string())
    } else {
        Some("Mean".to_string())
    }
}

fn calculate_neighbor_prediction(
    neighbors: &[(usize, f64)],
    knn_data: &crate::models::data::KnnData,
    config: &KnnConfig,
) -> Option<DataValue> {
    let prediction = if knn_data.target_is_numeric_scale() {
        if config.neighbors.predictions_median {
            calculate_median_prediction(neighbors, &knn_data.target_values)
        } else {
            calculate_mean_prediction(neighbors, &knn_data.target_values)
        }
    } else {
        calculate_categorical_prediction_with_weights(
            neighbors,
            &knn_data.target_values,
            config.neighbors.weight,
        )
    };

    match prediction {
        DataValue::Null => None,
        value => Some(value),
    }
}
