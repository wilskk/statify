use std::collections::HashSet;

use crate::models::{config::KnnConfig, data::KnnData};

use super::{
    cross_validation::determine_k_value, feature_weighting::calculate_feature_weights,
    knn_error::calculate_knn_error,
};

pub fn build_effective_feature_weights(
    knn_data: &KnnData,
    config: &KnnConfig,
) -> Result<Option<Vec<f64>>, String> {
    let selected_features = perform_forward_selection(knn_data, config)?;
    let selection_is_active = config.features.perform_selection;
    let base_weights = calculate_feature_weights(knn_data, config);

    if !selection_is_active {
        return Ok(base_weights);
    }

    let selected_set: HashSet<usize> = selected_features.into_iter().collect();
    let mut effective_weights = vec![0.0; knn_data.features.len()];

    for (feature_idx, weight) in effective_weights.iter_mut().enumerate() {
        if selected_set.contains(&feature_idx) {
            *weight = base_weights
                .as_ref()
                .and_then(|weights| weights.get(feature_idx).copied())
                .unwrap_or(1.0);
        }
    }

    Ok(Some(effective_weights))
}

pub fn perform_forward_selection(
    knn_data: &KnnData,
    config: &KnnConfig,
) -> Result<Vec<usize>, String> {
    if !config.features.perform_selection {
        return Ok((0..knn_data.features.len()).collect());
    }

    let forced_vars = config.features.forced_entry_var.as_deref().unwrap_or(&[]);
    let forward_vars = config.features.forward_selection.as_deref().unwrap_or(&[]);

    let mut selected_features = feature_indices_for_variables(&knn_data.features, forced_vars);
    selected_features.sort_unstable();
    selected_features.dedup();

    let forced_var_set: HashSet<&str> = forced_vars.iter().map(String::as_str).collect();
    let candidate_vars: Vec<&String> = forward_vars
        .iter()
        .filter(|var| !forced_var_set.contains(var.as_str()))
        .collect();

    let mut candidates: Vec<(String, Vec<usize>)> = candidate_vars
        .into_iter()
        .filter_map(|var| {
            let indices = feature_indices_for_variable(&knn_data.features, var);
            if indices.is_empty() {
                None
            } else {
                Some((var.clone(), indices))
            }
        })
        .collect();

    if candidates.is_empty() {
        return Ok(selected_features);
    }

    let max_to_select = if config.features.max_reached {
        config
            .features
            .max_to_select
            .unwrap_or(candidates.len() as i32)
            .max(0) as usize
    } else {
        candidates.len()
    };

    if max_to_select == 0 {
        return Ok(selected_features);
    }

    let k = determine_k_value(config);
    let use_euclidean = config.neighbors.metric_eucli;
    let use_median = config.neighbors.predictions_median;
    let base_weights = calculate_feature_weights(knn_data, config);

    let baseline_error = if selected_features.is_empty() {
        f64::INFINITY
    } else {
        calculate_knn_error_with_selected_features(
            knn_data,
            k,
            use_euclidean,
            &selected_features,
            base_weights.as_deref(),
            use_median,
        )?
    };

    let min_change = config.features.min_change.max(0.0);
    let mut previous_error = baseline_error;
    let mut added_features = 0;

    while added_features < max_to_select && !candidates.is_empty() {
        let mut best_candidate_pos = None;
        let mut best_error = f64::MAX;
        let mut best_selected_features = Vec::new();

        for (candidate_pos, (_, candidate_indices)) in candidates.iter().enumerate() {
            let mut temp_features = selected_features.clone();
            temp_features.extend(candidate_indices.iter().copied());
            temp_features.sort_unstable();
            temp_features.dedup();

            let error = calculate_knn_error_with_selected_features(
                knn_data,
                k,
                use_euclidean,
                &temp_features,
                base_weights.as_deref(),
                use_median,
            )?;

            if error < best_error {
                best_error = error;
                best_candidate_pos = Some(candidate_pos);
                best_selected_features = temp_features;
            }
        }

        if let Some(candidate_pos) = best_candidate_pos {
            let error_ratio = if previous_error.is_finite() && previous_error > 0.0 {
                (previous_error - best_error) / previous_error
            } else {
                f64::INFINITY
            };

            if config.features.below_min && added_features > 0 && error_ratio.abs() <= min_change {
                break;
            }

            if best_error > previous_error && previous_error.is_finite() {
                break;
            }

            selected_features = best_selected_features;
            previous_error = best_error;
            added_features += 1;
            candidates.remove(candidate_pos);

            if best_error <= f64::EPSILON {
                break;
            }
        } else {
            break;
        }
    }

    Ok(selected_features)
}

fn calculate_knn_error_with_selected_features(
    knn_data: &KnnData,
    k: usize,
    use_euclidean: bool,
    selected_features: &[usize],
    base_weights: Option<&[f64]>,
    use_median: bool,
) -> Result<f64, String> {
    let selected_set: HashSet<usize> = selected_features.iter().copied().collect();
    let mut weights = vec![0.0; knn_data.features.len()];

    for feature_idx in selected_set {
        if feature_idx < weights.len() {
            weights[feature_idx] = base_weights
                .and_then(|base| base.get(feature_idx).copied())
                .unwrap_or(1.0);
        }
    }

    calculate_knn_error(knn_data, k, use_euclidean, None, Some(&weights), use_median)
}

fn feature_indices_for_variables(features: &[String], variables: &[String]) -> Vec<usize> {
    variables
        .iter()
        .flat_map(|var| feature_indices_for_variable(features, var))
        .collect()
}

fn feature_indices_for_variable(features: &[String], variable: &str) -> Vec<usize> {
    let prefix = format!("{}=", variable);

    features
        .iter()
        .enumerate()
        .filter_map(|(idx, feature)| {
            if feature == variable || feature.starts_with(&prefix) {
                Some(idx)
            } else {
                None
            }
        })
        .collect()
}
