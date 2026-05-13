use std::{cmp::Ordering, collections::HashMap};

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
        return calculate_categorical_prediction_with_weights(
            neighbors,
            target_values,
            config.neighbors.weight,
        );
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
    calculate_categorical_prediction_with_weights(neighbors, target_values, false)
}

pub fn calculate_categorical_prediction_with_weights(
    neighbors: &[(usize, f64)],
    target_values: &[DataValue],
    use_distance_weights: bool,
) -> DataValue {
    let probabilities =
        calculate_categorical_probabilities(neighbors, target_values, use_distance_weights);

    probabilities
        .into_iter()
        .max_by(|(left_key, left_prob), (right_key, right_prob)| {
            left_prob
                .partial_cmp(right_prob)
                .unwrap_or(Ordering::Equal)
                .then_with(|| right_key.cmp(left_key))
        })
        .map(|(key, _)| data_value_from_category_key(&key))
        .unwrap_or(DataValue::Null)
}

pub fn calculate_categorical_probabilities(
    neighbors: &[(usize, f64)],
    target_values: &[DataValue],
    use_distance_weights: bool,
) -> Vec<(String, f64)> {
    let categories = sorted_target_categories(target_values);
    if categories.is_empty() {
        return Vec::new();
    }

    let mut votes: HashMap<String, f64> = categories
        .iter()
        .map(|category| (category.clone(), 0.0))
        .collect();

    let has_zero_distance = use_distance_weights
        && neighbors
            .iter()
            .any(|(_, distance)| distance.is_finite() && distance.abs() <= f64::EPSILON);

    for &(idx, distance) in neighbors {
        if idx >= target_values.len() {
            continue;
        }

        let Some(key) = category_key(target_values.get(idx)) else {
            continue;
        };

        let weight = neighbor_vote_weight(distance, use_distance_weights, has_zero_distance);
        if weight > 0.0 {
            *votes.entry(key).or_insert(0.0) += weight;
        }
    }

    let total_votes = votes.values().sum::<f64>();
    if total_votes <= f64::EPSILON {
        categories
            .into_iter()
            .map(|category| (category, 0.0))
            .collect()
    } else {
        categories
            .into_iter()
            .map(|category| {
                let vote = votes.get(&category).copied().unwrap_or(0.0);
                (category, vote / total_votes)
            })
            .collect()
    }
}

pub fn sorted_target_categories(target_values: &[DataValue]) -> Vec<String> {
    let mut categories: Vec<String> = target_values
        .iter()
        .filter_map(|value| category_key(Some(value)))
        .collect();
    categories.sort();
    categories.dedup();
    categories
}

pub fn category_key(value: Option<&DataValue>) -> Option<String> {
    match value {
        Some(DataValue::Text(text)) if !text.trim().is_empty() => Some(text.clone()),
        Some(DataValue::Boolean(value)) => Some(value.to_string()),
        Some(DataValue::Number(value)) if value.is_finite() => Some(value.to_string()),
        _ => None,
    }
}

fn neighbor_vote_weight(distance: f64, use_distance_weights: bool, has_zero_distance: bool) -> f64 {
    if !use_distance_weights {
        return 1.0;
    }

    if has_zero_distance {
        if distance.is_finite() && distance.abs() <= f64::EPSILON {
            1.0
        } else {
            0.0
        }
    } else if distance.is_finite() && distance > 0.0 {
        1.0 / distance
    } else {
        0.0
    }
}

fn data_value_from_category_key(key: &str) -> DataValue {
    if key.eq_ignore_ascii_case("true") {
        DataValue::Boolean(true)
    } else if key.eq_ignore_ascii_case("false") {
        DataValue::Boolean(false)
    } else {
        DataValue::Text(key.to_string())
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

#[cfg(test)]
mod tests {
    use crate::models::data::DataValue;

    use super::{
        calculate_categorical_prediction_with_weights, calculate_categorical_probabilities,
    };

    #[test]
    fn uniform_and_distance_weights_can_choose_different_classes() {
        let targets = vec![
            DataValue::Text("A".to_string()),
            DataValue::Text("B".to_string()),
            DataValue::Text("B".to_string()),
        ];
        let neighbors = vec![(0, 0.1), (1, 10.0), (2, 11.0)];

        assert!(matches!(
            calculate_categorical_prediction_with_weights(&neighbors, &targets, false),
            DataValue::Text(value) if value == "B"
        ));
        assert!(matches!(
            calculate_categorical_prediction_with_weights(&neighbors, &targets, true),
            DataValue::Text(value) if value == "A"
        ));
    }

    #[test]
    fn tie_breaking_uses_lexicographic_class_order() {
        let targets = vec![
            DataValue::Text("B".to_string()),
            DataValue::Text("A".to_string()),
        ];
        let neighbors = vec![(0, 1.0), (1, 1.0)];

        assert!(matches!(
            calculate_categorical_prediction_with_weights(&neighbors, &targets, false),
            DataValue::Text(value) if value == "A"
        ));
    }

    #[test]
    fn categorical_probabilities_sum_to_one() {
        let targets = vec![
            DataValue::Text("A".to_string()),
            DataValue::Text("B".to_string()),
            DataValue::Text("B".to_string()),
        ];
        let neighbors = vec![(0, 1.0), (1, 2.0), (2, 4.0)];

        let total = calculate_categorical_probabilities(&neighbors, &targets, true)
            .iter()
            .map(|(_, probability)| probability)
            .sum::<f64>();

        assert!((total - 1.0).abs() < 1e-12);
    }
}
