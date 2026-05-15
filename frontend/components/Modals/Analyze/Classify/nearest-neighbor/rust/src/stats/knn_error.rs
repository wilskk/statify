use std::collections::HashMap;

use crate::models::data::{DataValue, KnnData};

use super::distance::find_k_nearest_neighbors;
use super::prediction::category_key;

pub fn calculate_knn_error(
    knn_data: &KnnData,
    k: usize,
    use_euclidean: bool,
    excluded_features: Option<&[usize]>,
    weights: Option<&[f64]>,
    use_median: bool,
) -> Result<f64, String> {
    if knn_data.target_values.is_empty()
        || knn_data
            .target_values
            .iter()
            .all(|v| matches!(v, DataValue::Null))
    {
        return Err("Target values are required for error calculation".to_string());
    }

    let target_is_categorical = knn_data.target_is_categorical();

    let mut category_map = HashMap::new();

    if target_is_categorical {
        for value in &knn_data.target_values {
            let Some(category) = category_key(Some(value)) else {
                continue;
            };

            if !category_map.contains_key(&category) {
                let next_idx = category_map.len();
                category_map.insert(category, next_idx);
            }
        }
    }

    let modified_data =
        prepare_data_with_excluded_features(&knn_data.data_matrix, excluded_features);
    let use_holdout = !knn_data.holdout_indices.is_empty();
    let evaluation_strategy = if use_holdout {
        "holdout"
    } else {
        "training_loo"
    };
    let query_indices = if use_holdout {
        knn_data.holdout_indices.clone()
    } else {
        knn_data.training_indices.clone()
    };
    let n_categories = category_map.len();
    let mut total_error = 0.0;
    let mut total_cases = 0;
    let mut neighbor_reference_debug = Vec::with_capacity(query_indices.len());

    for &idx in &query_indices {
        if idx >= knn_data.data_matrix.len() {
            continue;
        }

        let modified_point =
            prepare_point_with_excluded_features(&knn_data.data_matrix[idx], excluded_features);
        let neighbor_reference_indices: Vec<usize> = if use_holdout {
            knn_data.training_indices.clone()
        } else {
            knn_data
                .training_indices
                .iter()
                .filter(|&&candidate_idx| candidate_idx != idx)
                .copied()
                .collect()
        };
        neighbor_reference_debug.push(format!(
            "{}:[{}]",
            idx,
            format_indices(&neighbor_reference_indices)
        ));

        let neighbors = find_k_nearest_neighbors(
            &modified_point,
            &modified_data,
            &neighbor_reference_indices,
            k,
            use_euclidean,
            weights,
            Some(&knn_data.processed_case_indices),
        );

        if target_is_categorical {
            total_error += calculate_classification_error(
                idx,
                &neighbors,
                &knn_data.target_values,
                &category_map,
                n_categories,
            );
        } else {
            total_error +=
                calculate_regression_error(idx, &neighbors, &knn_data.target_values, use_median);
        }

        total_cases += 1;
    }

    let average_error = if total_cases > 0 {
        total_error / (total_cases as f64)
    } else {
        0.0
    };

    log_debug(&format!(
        "KNN error evaluation: evaluation_strategy={}, total_cases={}, total_error={:.12}, average_error={:.12}, query_indices=[{}], neighbor_reference_indices={}",
        evaluation_strategy,
        total_cases,
        total_error,
        average_error,
        format_indices(&query_indices),
        neighbor_reference_debug.join("; ")
    ));

    Ok(average_error)
}

fn prepare_data_with_excluded_features(
    data_matrix: &[Vec<f64>],
    excluded_features: Option<&[usize]>,
) -> Vec<Vec<f64>> {
    data_matrix
        .iter()
        .map(|row| prepare_point_with_excluded_features(row, excluded_features))
        .collect()
}

fn prepare_point_with_excluded_features(
    point: &[f64],
    excluded_features: Option<&[usize]>,
) -> Vec<f64> {
    match excluded_features {
        Some(excluded) => point
            .iter()
            .enumerate()
            .filter_map(|(j, &val)| {
                if excluded.contains(&j) {
                    None
                } else {
                    Some(val)
                }
            })
            .collect(),
        None => point.to_vec(),
    }
}

fn calculate_classification_error(
    idx: usize,
    neighbors: &[(usize, f64)],
    target_values: &[DataValue],
    category_map: &HashMap<String, usize>,
    n_categories: usize,
) -> f64 {
    let actual_value = &target_values[idx];
    let actual_cat = category_key(Some(actual_value)).and_then(|key| category_map.get(&key));

    if let Some(&actual_cat_idx) = actual_cat {
        let mut vote_counts = vec![0; n_categories];

        for &(neighbor_idx, _) in neighbors {
            let neighbor_value = &target_values[neighbor_idx];
            let neighbor_cat =
                category_key(Some(neighbor_value)).and_then(|key| category_map.get(&key));

            if let Some(&cat_idx) = neighbor_cat {
                vote_counts[cat_idx] += 1;
            }
        }

        if let Some((predicted_cat, _)) = vote_counts
            .iter()
            .enumerate()
            .max_by_key(|&(_, count)| count)
        {
            if predicted_cat != actual_cat_idx {
                1.0
            } else {
                0.0
            }
        } else {
            0.0
        }
    } else {
        0.0
    }
}

fn calculate_regression_error(
    idx: usize,
    neighbors: &[(usize, f64)],
    target_values: &[DataValue],
    use_median: bool,
) -> f64 {
    let actual_value = match &target_values[idx] {
        DataValue::Number(n) => *n,
        _ => return 0.0,
    };

    let values: Vec<f64> = neighbors
        .iter()
        .filter_map(|&(neighbor_idx, _)| match target_values[neighbor_idx] {
            DataValue::Number(val) => Some(val),
            _ => None,
        })
        .collect();

    if values.is_empty() {
        return 0.0;
    }

    let predicted = if use_median {
        let mut sorted_values = values.clone();
        sorted_values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

        let n = sorted_values.len();
        if n % 2 == 1 {
            sorted_values[n / 2]
        } else {
            (sorted_values[n / 2 - 1] + sorted_values[n / 2]) / 2.0
        }
    } else {
        values.iter().sum::<f64>() / (values.len() as f64)
    };

    (actual_value - predicted).powi(2)
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
