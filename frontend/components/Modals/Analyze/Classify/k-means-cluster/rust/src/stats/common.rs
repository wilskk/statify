use std::collections::HashMap;

use statrs::distribution::{ FisherSnedecor, ContinuousCDF };

pub fn mean(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    values.iter().sum::<f64>() / (values.len() as f64)
}

pub fn sum_squared_deviations(values: &[f64], from_value: f64) -> f64 {
    values
        .iter()
        .map(|x| (x - from_value).powi(2))
        .sum()
}

pub fn f_test_p_value(f_stat: f64, df1: i32, df2: i32) -> f64 {
    if df1 <= 0 || df2 <= 0 || f_stat <= 0.0 {
        return 1.0;
    }

    match FisherSnedecor::new(df1 as f64, df2 as f64) {
        Ok(dist) => 1.0 - dist.cdf(f_stat),
        Err(_) => 0.5,
    }
}

pub fn euclidean_distance(a: &[f64], b: &[f64]) -> f64 {
    a.iter()
        .zip(b.iter())
        .map(|(x, y)| (x - y).powi(2))
        .sum::<f64>()
        .sqrt()
}

pub fn find_nearest_cluster(point: &[f64], centers: &[Vec<f64>]) -> (usize, f64) {
    centers
        .iter()
        .enumerate()
        .map(|(i, center)| (i, euclidean_distance(point, center)))
        .min_by(|a, b| a.1.partial_cmp(&b.1).unwrap())
        .unwrap_or((0, f64::MAX))
}

pub fn find_second_closest_cluster(point: &[f64], centers: &[Vec<f64>], closest: usize) -> usize {
    centers
        .iter()
        .enumerate()
        .filter(|(i, _)| *i != closest)
        .map(|(i, center)| (i, euclidean_distance(point, center)))
        .min_by(|a, b| a.1.partial_cmp(&b.1).unwrap())
        .map(|(i, _)| i)
        .unwrap_or_else(|| if closest == 0 { 1 } else { 0 })
}

pub fn min_distance_between_centers(centers: &[Vec<f64>]) -> (f64, usize, usize) {
    (0..centers.len())
        .flat_map(|i|
            (i + 1..centers.len()).map(move |j| (
                i,
                j,
                euclidean_distance(&centers[i], &centers[j]),
            ))
        )
        .min_by(|a, b| a.2.partial_cmp(&b.2).unwrap())
        .map(|(i, j, dist)| (dist, i, j))
        .unwrap_or((f64::MAX, 0, 1))
}

pub fn min_distance_from_cluster(centers: &[Vec<f64>], cluster_idx: usize) -> f64 {
    centers
        .iter()
        .enumerate()
        .filter(|(i, _)| *i != cluster_idx)
        .map(|(_, center)| euclidean_distance(&centers[cluster_idx], center))
        .min_by(|a, b| a.partial_cmp(b).unwrap())
        .unwrap_or(f64::MAX)
}

pub fn convert_map_to_matrix(
    centers_map: &HashMap<String, Vec<f64>>,
    variables: &[String]
) -> Vec<Vec<f64>> {
    let num_clusters = centers_map
        .values()
        .next()
        .map_or(0, |v| v.len());
    if num_clusters == 0 {
        return Vec::new();
    }

    let mut matrix = vec![vec![0.0; variables.len()]; num_clusters];

    for (var_idx, var) in variables.iter().enumerate() {
        if let Some(values) = centers_map.get(var) {
            for (cluster_idx, value) in values.iter().enumerate().take(matrix.len()) {
                matrix[cluster_idx][var_idx] = *value;
            }
        }
    }

    matrix
}
