use std::collections::HashMap;

use crate::models::{
    config::KnnConfig,
    data::{DataValue, KnnData},
};

pub fn calculate_feature_weights(knn_data: &KnnData, config: &KnnConfig) -> Option<Vec<f64>> {
    if !config.neighbors.weight {
        return None;
    }

    let n_features = knn_data.features.len();
    if n_features == 0 {
        return None;
    }

    let target_is_numeric = knn_data
        .target_values
        .iter()
        .any(|value| matches!(value, DataValue::Number(n) if n.is_finite()));

    let mut feature_weights = if target_is_numeric {
        numeric_target_feature_weights(knn_data, n_features)
    } else {
        categorical_target_feature_weights(knn_data, n_features)
    };

    let weight_sum: f64 = feature_weights.iter().sum();
    if !weight_sum.is_finite() || weight_sum <= f64::EPSILON {
        feature_weights = vec![1.0; n_features];
    }

    let weight_sum: f64 = feature_weights.iter().sum();
    if weight_sum > 0.0 {
        for w in &mut feature_weights {
            *w = (*w / weight_sum) * (n_features as f64);
        }
    }

    Some(feature_weights)
}

fn numeric_target_feature_weights(knn_data: &KnnData, n_features: usize) -> Vec<f64> {
    let mut weights = vec![0.0; n_features];

    for feature_idx in 0..n_features {
        let mut feature_values = Vec::new();
        let mut target_values = Vec::new();

        for &case_idx in &knn_data.training_indices {
            if let (Some(row), Some(DataValue::Number(target))) = (
                knn_data.data_matrix.get(case_idx),
                knn_data.target_values.get(case_idx),
            ) {
                if let Some(feature_value) = row.get(feature_idx) {
                    if feature_value.is_finite() && target.is_finite() {
                        feature_values.push(*feature_value);
                        target_values.push(*target);
                    }
                }
            }
        }

        weights[feature_idx] = pearson_abs(&feature_values, &target_values);
    }

    weights
}

fn categorical_target_feature_weights(knn_data: &KnnData, n_features: usize) -> Vec<f64> {
    let mut weights = vec![0.0; n_features];

    for feature_idx in 0..n_features {
        let mut groups: HashMap<String, Vec<f64>> = HashMap::new();
        let mut all_values = Vec::new();

        for &case_idx in &knn_data.training_indices {
            let Some(row) = knn_data.data_matrix.get(case_idx) else {
                continue;
            };

            let Some(feature_value) = row.get(feature_idx).copied() else {
                continue;
            };

            if !feature_value.is_finite() {
                continue;
            }

            let Some(target_key) = target_group_key(knn_data.target_values.get(case_idx)) else {
                continue;
            };

            groups.entry(target_key).or_default().push(feature_value);
            all_values.push(feature_value);
        }

        weights[feature_idx] = eta_squared(&all_values, &groups);
    }

    weights
}

fn pearson_abs(x: &[f64], y: &[f64]) -> f64 {
    if x.len() < 2 || x.len() != y.len() {
        return 0.0;
    }

    let n = x.len() as f64;
    let mean_x = x.iter().sum::<f64>() / n;
    let mean_y = y.iter().sum::<f64>() / n;

    let mut numerator = 0.0;
    let mut sum_sq_x = 0.0;
    let mut sum_sq_y = 0.0;

    for (&x_value, &y_value) in x.iter().zip(y.iter()) {
        let dx = x_value - mean_x;
        let dy = y_value - mean_y;
        numerator += dx * dy;
        sum_sq_x += dx * dx;
        sum_sq_y += dy * dy;
    }

    let denominator = (sum_sq_x * sum_sq_y).sqrt();
    if denominator <= f64::EPSILON {
        0.0
    } else {
        (numerator / denominator).abs()
    }
}

fn eta_squared(all_values: &[f64], groups: &HashMap<String, Vec<f64>>) -> f64 {
    if all_values.len() < 2 || groups.len() < 2 {
        return 0.0;
    }

    let overall_mean = all_values.iter().sum::<f64>() / (all_values.len() as f64);
    let total_ss = all_values
        .iter()
        .map(|value| (value - overall_mean).powi(2))
        .sum::<f64>();

    if total_ss <= f64::EPSILON {
        return 0.0;
    }

    let between_ss = groups
        .values()
        .map(|values| {
            let group_mean = values.iter().sum::<f64>() / (values.len() as f64);
            (values.len() as f64) * (group_mean - overall_mean).powi(2)
        })
        .sum::<f64>();

    between_ss / total_ss
}

fn target_group_key(value: Option<&DataValue>) -> Option<String> {
    match value {
        Some(DataValue::Text(text)) if !text.trim().is_empty() => Some(text.clone()),
        Some(DataValue::Boolean(value)) => Some(value.to_string()),
        Some(DataValue::Number(value)) if value.is_finite() => Some(value.to_string()),
        _ => None,
    }
}
