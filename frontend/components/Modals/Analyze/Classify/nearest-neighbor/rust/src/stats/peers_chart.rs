use std::collections::HashMap;

use crate::models::{
    config::KnnConfig,
    data::AnalysisData,
    result::{FocalNeighborSet, NeighborDetail, PeersChart},
};

use super::core::{build_effective_feature_weights, find_k_nearest_neighbors, preprocess_knn_data};

pub fn calculate_peers_chart(
    data: &AnalysisData,
    config: &KnnConfig,
) -> Result<PeersChart, String> {
    // Preprocess data
    let knn_data = preprocess_knn_data(data, config)?;

    // Determine k value
    let k = if config.neighbors.specify {
        config.neighbors.specify_k as usize
    } else if config.neighbors.auto_selection {
        config.neighbors.min_k.unwrap_or(3).max(1) as usize
    } else {
        3 // Default k value
    };

    // Determine focal indices based on focal_case_iden_var
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

    let use_euclidean = config.neighbors.metric_eucli;
    let weights = build_effective_feature_weights(&knn_data, config)?;
    let mut focal_neighbor_sets = Vec::new();

    // Combine training and holdout indices for finding neighbors
    let mut all_candidate_indices = Vec::new();
    all_candidate_indices.extend_from_slice(&knn_data.training_indices);
    all_candidate_indices.extend_from_slice(&knn_data.holdout_indices);
    all_candidate_indices.sort();
    all_candidate_indices.dedup();

    // Process each focal point
    for &focal_idx in &focal_indices {
        let focal_record = knn_data.case_identifiers[focal_idx];

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
            Some(&knn_data.processed_case_indices),
        );

        // Create neighbor details
        let mut neighbor_details = Vec::new();
        let mut distances = Vec::new();

        for (idx, distance) in neighbors {
            let neighbor_id = knn_data.case_identifiers[idx];
            neighbor_details.push(NeighborDetail {
                id: neighbor_id,
                row_number: knn_data.processed_case_indices.get(idx).map(|idx| idx + 1),
                distance,
            });
            distances.push(distance);
        }

        // Add this focal point and its neighbors to the collection
        focal_neighbor_sets.push(FocalNeighborSet {
            focal_record,
            focal_row_number: knn_data
                .processed_case_indices
                .get(focal_idx)
                .map(|idx| idx + 1),
            neighbors: neighbor_details,
            distances,
            predicted_value: None,
        });
    }

    // Create feature map from the preprocessed matrix so the frontend can
    // render peer profiles directly from this result.
    let mut features = HashMap::new();

    for (feature_idx, feature) in knn_data.features.iter().enumerate() {
        let values = knn_data
            .data_matrix
            .iter()
            .filter_map(|row| row.get(feature_idx).copied())
            .collect();

        features.insert(feature.clone(), values);
    }

    Ok(PeersChart {
        focal_neighbor_sets,
        features,
    })
}
