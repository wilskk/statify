use std::cmp::Ordering;

use crate::models::{config::KnnConfig, data::DataValue};

pub fn calculate_predictions(
    neighbors: &[(usize, f64)],
    target_values: &[DataValue],
    config: &KnnConfig,
) -> DataValue {
    let first_value = neighbors
        .first()
        .and_then(|&(idx, _)| target_values.get(idx));

    if matches!(
        first_value,
        Some(DataValue::Text(_) | DataValue::Boolean(_))
    ) {
        return calculate_categorical_prediction(neighbors, target_values);
    }

    if matches!(first_value, Some(DataValue::Number(_))) {
        if config.neighbors.predictions_median {
            return calculate_median_prediction(neighbors, target_values);
        }

        return calculate_mean_prediction(neighbors, target_values);
    }

    DataValue::Null
}

pub fn calculate_categorical_prediction(
    neighbors: &[(usize, f64)],
    target_values: &[DataValue],
) -> DataValue {
    let mut votes: std::collections::HashMap<String, usize> = std::collections::HashMap::new();

    for &(idx, _) in neighbors {
        if idx >= target_values.len() {
            continue;
        }

        let key = match &target_values[idx] {
            DataValue::Text(s) => s.clone(),
            DataValue::Boolean(b) => b.to_string(),
            _ => continue,
        };

        *votes.entry(key).or_insert(0) += 1;
    }

    if let Some((key, _)) = votes.into_iter().max_by_key(|&(_, count)| count) {
        if key.to_lowercase() == "true" || key == "1" {
            DataValue::Boolean(true)
        } else if key.to_lowercase() == "false" || key == "0" {
            DataValue::Boolean(false)
        } else {
            DataValue::Text(key)
        }
    } else {
        DataValue::Null
    }
}

pub fn calculate_mean_prediction(
    neighbors: &[(usize, f64)],
    target_values: &[DataValue],
) -> DataValue {
    let mut sum = 0.0;
    let mut count = 0;

    for &(idx, _) in neighbors {
        if idx >= target_values.len() {
            continue;
        }

        if let DataValue::Number(val) = target_values[idx] {
            sum += val;
            count += 1;
        }
    }

    if count > 0 {
        DataValue::Number(sum / (count as f64))
    } else {
        DataValue::Null
    }
}

pub fn calculate_median_prediction(
    neighbors: &[(usize, f64)],
    target_values: &[DataValue],
) -> DataValue {
    let mut values: Vec<f64> = neighbors
        .iter()
        .filter_map(|&(idx, _)| {
            if idx < target_values.len() {
                match target_values[idx] {
                    DataValue::Number(val) => Some(val),
                    _ => None,
                }
            } else {
                None
            }
        })
        .collect();

    if values.is_empty() {
        return DataValue::Null;
    }

    values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(Ordering::Equal));

    let n = values.len();
    if n % 2 == 1 {
        DataValue::Number(values[n / 2])
    } else {
        DataValue::Number((values[n / 2 - 1] + values[n / 2]) / 2.0)
    }
}
