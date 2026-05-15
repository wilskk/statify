use crate::models::{
    config::KnnConfig,
    data::{AnalysisData, DataValue, KnnData, VariableMeasure},
    result::{DataPoint, NeighborDetail, PredictorDimension, PredictorSpace},
};

use super::core::{
    build_effective_feature_weights, determine_effective_k, find_k_nearest_neighbors,
    preprocess_knn_data,
};

pub fn calculate_predictor_space(
    data: &AnalysisData,
    config: &KnnConfig,
) -> Result<PredictorSpace, String> {
    let knn_data = preprocess_knn_data(data, config)?;

    if knn_data.features.is_empty() {
        return Err("No features available for predictor space visualization".to_string());
    }

    let k = determine_effective_k(&knn_data, config)?;
    let weights = build_effective_feature_weights(&knn_data, config)?;
    let displayed_feature_indices: Vec<usize> = weights
        .as_ref()
        .map(|values| {
            values
                .iter()
                .enumerate()
                .filter_map(|(idx, weight)| if *weight > 0.0 { Some(idx) } else { None })
                .collect()
        })
        .unwrap_or_else(|| (0..knn_data.features.len()).collect());

    if displayed_feature_indices.is_empty() {
        return Err("No selected features available for predictor space visualization".to_string());
    }

    let display_indices: Vec<usize> = displayed_feature_indices.iter().copied().take(3).collect();
    let dimension_name = display_indices
        .iter()
        .filter_map(|idx| knn_data.features.get(*idx))
        .cloned()
        .collect::<Vec<_>>()
        .join(" vs ");

    let points = build_points(
        &knn_data,
        &display_indices,
        k,
        config.neighbors.metric_eucli,
        weights.as_deref(),
    );

    Ok(PredictorSpace {
        model_predictors: displayed_feature_indices.len(),
        actual_predictors: displayed_feature_indices.len(),
        target_variable: config.main.target_var.clone().unwrap_or_default(),
        target_measure: target_measure_label(&knn_data.target_measure).to_string(),
        has_focal_case_identifier: config.main.focal_case_iden_var.is_some(),
        k_value: k,
        dimensions: vec![PredictorDimension {
            name: dimension_name,
            points,
        }],
    })
}

fn build_points(
    knn_data: &KnnData,
    display_indices: &[usize],
    k: usize,
    use_euclidean: bool,
    weights: Option<&[f64]>,
) -> Vec<DataPoint> {
    knn_data
        .display_matrix
        .iter()
        .enumerate()
        .filter(|(idx, _)| {
            !knn_data.target_is_numeric_scale() || knn_data.training_indices.contains(idx)
        })
        .filter_map(|(idx, display_row)| {
            let model_row = knn_data.data_matrix.get(idx)?;
            let x = feature_value(display_row, display_indices, 0)?;
            let y = feature_value(display_row, display_indices, 1).unwrap_or(0.0);
            let z = feature_value(display_row, display_indices, 2).unwrap_or(0.0);

            let point_type = if knn_data.training_indices.contains(&idx) {
                "Training".to_string()
            } else if knn_data.holdout_indices.contains(&idx) {
                "Holdout".to_string()
            } else {
                "Unknown".to_string()
            };

            let target = knn_data.target_values.get(idx).unwrap_or(&DataValue::Null);
            let target_label = data_value_label(target);
            let target_number = match target {
                DataValue::Number(value) if value.is_finite() => Some(*value),
                _ => None,
            };
            let target_value = match target {
                DataValue::Number(n) => *n > 0.5,
                DataValue::Boolean(b) => *b,
                DataValue::Text(s) => s == "1" || s.to_lowercase() == "true",
                DataValue::Null => false,
            };

            let focal_record = knn_data.case_identifiers[idx];
            let candidate_indices: Vec<usize> = knn_data
                .training_indices
                .iter()
                .copied()
                .filter(|&candidate_idx| {
                    candidate_idx < knn_data.case_identifiers.len()
                        && knn_data.case_identifiers[candidate_idx] != focal_record
                })
                .collect();

            let neighbors = find_k_nearest_neighbors(
                model_row,
                &knn_data.data_matrix,
                &candidate_indices,
                k,
                use_euclidean,
                weights,
                Some(&knn_data.processed_case_indices),
            )
            .into_iter()
            .map(|(neighbor_idx, distance)| NeighborDetail {
                id: knn_data.case_identifiers[neighbor_idx],
                distance,
            })
            .collect();

            Some(DataPoint {
                id: focal_record,
                label: knn_data
                    .case_labels
                    .get(idx)
                    .cloned()
                    .unwrap_or_else(|| focal_record.to_string()),
                x,
                y,
                z,
                focal: knn_data.focal_indices.contains(&idx),
                target_value,
                target_number,
                target_label,
                point_type,
                neighbors,
            })
        })
        .collect()
}

fn feature_value(row: &[f64], display_indices: &[usize], position: usize) -> Option<f64> {
    display_indices
        .get(position)
        .and_then(|feature_idx| row.get(*feature_idx))
        .copied()
        .filter(|value| value.is_finite())
}

fn data_value_label(value: &DataValue) -> String {
    match value {
        DataValue::Number(value) if value.is_finite() => value.to_string(),
        DataValue::Text(value) => value.clone(),
        DataValue::Boolean(value) => value.to_string(),
        DataValue::Null => String::new(),
        DataValue::Number(_) => String::new(),
    }
}

fn target_measure_label(measure: &VariableMeasure) -> &'static str {
    match measure {
        VariableMeasure::Scale => "scale",
        VariableMeasure::Ordinal => "ordinal",
        VariableMeasure::Nominal => "nominal",
        VariableMeasure::Unknown => "unknown",
    }
}
