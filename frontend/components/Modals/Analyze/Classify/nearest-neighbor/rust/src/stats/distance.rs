use std::cmp::Ordering;

/// Calculates distance between two points using specified metric.
pub fn calculate_distance(
    point1: &[f64],
    point2: &[f64],
    use_euclidean: bool,
    feature_weights: Option<&[f64]>,
) -> f64 {
    let min_len = point1.len().min(point2.len());
    let mut total_weight = 0.0;
    let mut used_weight = 0.0;

    if use_euclidean {
        let sum_squared = (0..min_len)
            .filter_map(|i| {
                let weight = feature_weights
                    .and_then(|w| w.get(i).copied())
                    .unwrap_or(1.0);
                total_weight += weight;
                if !point1[i].is_finite() || !point2[i].is_finite() {
                    return None;
                }

                used_weight += weight;
                let diff = point1[i] - point2[i];
                Some(weight * diff * diff)
            })
            .sum::<f64>();

        if used_weight == 0.0 {
            return f64::INFINITY;
        }

        (sum_squared * (total_weight / used_weight)).sqrt()
    } else {
        let sum = (0..min_len)
            .filter_map(|i| {
                let weight = feature_weights
                    .and_then(|w| w.get(i).copied())
                    .unwrap_or(1.0);
                total_weight += weight;
                if !point1[i].is_finite() || !point2[i].is_finite() {
                    return None;
                }

                used_weight += weight;
                let diff = (point1[i] - point2[i]).abs();
                Some(weight * diff)
            })
            .sum::<f64>();

        if used_weight == 0.0 {
            return f64::INFINITY;
        }

        sum * (total_weight / used_weight)
    }
}

pub fn find_k_nearest_neighbors(
    query_point: &[f64],
    data_matrix: &[Vec<f64>],
    indices: &[usize],
    k: usize,
    use_euclidean: bool,
    feature_weights: Option<&[f64]>,
) -> Vec<(usize, f64)> {
    let mut distances: Vec<(usize, f64)> = indices
        .iter()
        .filter_map(|&idx| {
            if idx < data_matrix.len() {
                let distance = calculate_distance(
                    query_point,
                    &data_matrix[idx],
                    use_euclidean,
                    feature_weights,
                );
                Some((idx, distance))
            } else {
                None
            }
        })
        .collect();

    distances.sort_by(|a, b| {
        a.1.partial_cmp(&b.1)
            .unwrap_or(Ordering::Equal)
            .then_with(|| a.0.cmp(&b.0))
    });
    distances.into_iter().take(k.max(1)).collect()
}

pub fn calculate_euclidean_distance(
    point1: &[f64],
    point2: &[f64],
    feature_weights: Option<&[f64]>,
) -> f64 {
    calculate_distance(point1, point2, true, feature_weights)
}

pub fn calculate_manhattan_distance(
    point1: &[f64],
    point2: &[f64],
    feature_weights: Option<&[f64]>,
) -> f64 {
    calculate_distance(point1, point2, false, feature_weights)
}

#[cfg(test)]
mod tests {
    use super::{calculate_euclidean_distance, calculate_manhattan_distance};

    #[test]
    fn euclidean_and_manhattan_match_sklearn_metrics() {
        let a = [0.0, 0.0];
        let b = [3.0, 4.0];

        assert_eq!(calculate_euclidean_distance(&a, &b, None), 5.0);
        assert_eq!(calculate_manhattan_distance(&a, &b, None), 7.0);
    }
}
