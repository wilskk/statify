use crate::models::{
    config::KnnConfig,
    data::{AnalysisData, DataValue},
    result::{DataPoint, PredictorDimension, PredictorSpace},
};

use super::core::{build_effective_feature_weights, determine_effective_k, preprocess_knn_data};

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

    let mut dimensions = Vec::new();

    if displayed_feature_indices.len() >= 3 {
        let feature1_idx = displayed_feature_indices[0];
        let feature2_idx = displayed_feature_indices[1];
        let feature3_idx = displayed_feature_indices[2];
        let mut points = Vec::new();

        for (idx, point) in knn_data.data_matrix.iter().enumerate() {
            if feature1_idx >= point.len()
                || feature2_idx >= point.len()
                || feature3_idx >= point.len()
            {
                continue;
            }

            let x = point[feature1_idx];
            let y = point[feature2_idx];
            let z = point[feature3_idx];

            let point_type = if knn_data.training_indices.contains(&idx) {
                "Training".to_string()
            } else if knn_data.holdout_indices.contains(&idx) {
                "Holdout".to_string()
            } else {
                "Unknown".to_string()
            };

            let focal = knn_data.focal_indices.contains(&idx);

            let target_value = if !knn_data.target_values.is_empty() {
                match &knn_data.target_values[idx] {
                    DataValue::Number(n) => *n > 0.5,
                    DataValue::Boolean(b) => *b,
                    DataValue::Text(s) => s == "1" || s.to_lowercase() == "true",
                    DataValue::Null => false,
                }
            } else {
                false
            };

            points.push(DataPoint {
                x,
                y,
                z,
                focal,
                target_value,
                point_type,
            });
        }

        dimensions.push(PredictorDimension {
            name: format!(
                "{} vs {} vs {}",
                knn_data.features[feature1_idx],
                knn_data.features[feature2_idx],
                knn_data.features[feature3_idx]
            ),
            points,
        });
    } else if displayed_feature_indices.len() >= 2 {
        let feature1_idx = displayed_feature_indices[0];
        let feature2_idx = displayed_feature_indices[1];
        let mut points = Vec::new();

        for (idx, point) in knn_data.data_matrix.iter().enumerate() {
            if feature1_idx >= point.len() || feature2_idx >= point.len() {
                continue;
            }

            let x = point[feature1_idx];
            let y = point[feature2_idx];
            let z = 0.0;

            let point_type = if knn_data.training_indices.contains(&idx) {
                "Training".to_string()
            } else if knn_data.holdout_indices.contains(&idx) {
                "Holdout".to_string()
            } else {
                "Unknown".to_string()
            };

            let focal = knn_data.focal_indices.contains(&idx);

            let target_value = if !knn_data.target_values.is_empty() {
                match &knn_data.target_values[idx] {
                    DataValue::Number(n) => *n > 0.5,
                    DataValue::Boolean(b) => *b,
                    DataValue::Text(s) => s == "1" || s.to_lowercase() == "true",
                    DataValue::Null => false,
                }
            } else {
                false
            };

            points.push(DataPoint {
                x,
                y,
                z,
                focal,
                target_value,
                point_type,
            });
        }

        dimensions.push(PredictorDimension {
            name: format!(
                "{} vs {}",
                knn_data.features[feature1_idx], knn_data.features[feature2_idx]
            ),
            points,
        });
    } else if displayed_feature_indices.len() == 1 {
        let feature_idx = displayed_feature_indices[0];
        let mut points = Vec::new();

        for (idx, point) in knn_data.data_matrix.iter().enumerate() {
            if feature_idx >= point.len() {
                continue;
            }

            let x = point[feature_idx];
            let y = 0.0;
            let z = 0.0;

            let point_type = if knn_data.training_indices.contains(&idx) {
                "Training".to_string()
            } else if knn_data.holdout_indices.contains(&idx) {
                "Holdout".to_string()
            } else {
                "Unknown".to_string()
            };

            let focal = knn_data.focal_indices.contains(&idx);

            let target_value = if !knn_data.target_values.is_empty() {
                match &knn_data.target_values[idx] {
                    DataValue::Number(n) => *n > 0.5,
                    DataValue::Boolean(b) => *b,
                    DataValue::Text(s) => s == "1" || s.to_lowercase() == "true",
                    DataValue::Null => false,
                }
            } else {
                false
            };

            points.push(DataPoint {
                x,
                y,
                z,
                focal,
                target_value,
                point_type,
            });
        }

        dimensions.push(PredictorDimension {
            name: knn_data.features[feature_idx].clone(),
            points,
        });
    }

    Ok(PredictorSpace {
        model_predictors: displayed_feature_indices.len(),
        k_value: k,
        dimensions,
    })
}
