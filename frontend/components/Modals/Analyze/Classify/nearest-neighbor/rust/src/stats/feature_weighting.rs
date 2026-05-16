use std::collections::{HashMap, HashSet};

use crate::models::{config::KnnConfig, data::KnnData};

use super::{
    feature_selection::{expanded_feature_groups, feature_indices_for_variable},
    predictor_importance::compute_knn_feature_importance_for_subset,
};

pub fn calculate_feature_weights(knn_data: &KnnData, config: &KnnConfig) -> Option<Vec<f64>> {
    let selected_features = (0..knn_data.features.len()).collect::<Vec<_>>();
    calculate_feature_weights_for_subset(knn_data, config, &selected_features)
}

pub fn calculate_feature_weights_for_subset(
    knn_data: &KnnData,
    config: &KnnConfig,
    selected_features: &[usize],
) -> Option<Vec<f64>> {
    calculate_feature_weights_for_subset_with_k(
        knn_data,
        config,
        selected_features,
        config.neighbors.specify_k.max(1) as usize,
    )
}

pub fn calculate_feature_weights_for_subset_with_k(
    knn_data: &KnnData,
    config: &KnnConfig,
    selected_features: &[usize],
    k: usize,
) -> Option<Vec<f64>> {
    let feature_count = knn_data.features.len();

    if feature_count == 0 {
        return None;
    }

    let selected_set = selected_features
        .iter()
        .copied()
        .filter(|idx| *idx < feature_count)
        .collect::<HashSet<_>>();

    if !config.neighbors.weight {
        let weights = (0..feature_count)
            .map(|idx| {
                if selected_set.contains(&idx) {
                    1.0
                } else {
                    0.0
                }
            })
            .collect::<Vec<_>>();
        log_final_weights(knn_data, &weights, "weighting_off");
        return Some(weights);
    }

    log_diagnostic(&format!(
        "KNN feature weighting ON: compute_knn_feature_importance_for_subset will run; target_scale={}, selected_features={:?}, k={}",
        knn_data.target_is_numeric_scale(),
        selected_features,
        k.max(1)
    ));

    let mut weights = calculate_importance_distance_weights(knn_data, config, &selected_set, k);
    if !weights.iter().any(|weight| *weight > 0.0) {
        log_diagnostic("KNN feature weighting fallback: no positive final weights after importance calculation");
        weights = equal_original_predictor_weights(knn_data, &selected_set);
    }

    log_final_weights(knn_data, &weights, "weighting_on_final");
    Some(weights)
}

fn calculate_importance_distance_weights(
    knn_data: &KnnData,
    config: &KnnConfig,
    selected_set: &HashSet<usize>,
    k: usize,
) -> Vec<f64> {
    let feature_count = knn_data.features.len();
    let selected_features = selected_set.iter().copied().collect::<Vec<_>>();
    let target_var = config.main.target_var.as_deref().unwrap_or("target");
    let importance = compute_knn_feature_importance_for_subset(
        knn_data,
        config,
        target_var,
        k,
        &selected_features,
    );

    let Ok(importance) = importance else {
        log_diagnostic(
            "KNN feature weighting fallback: compute_knn_feature_importance_for_subset failed",
        );
        return equal_original_predictor_weights(knn_data, selected_set);
    };

    let mut raw_weights = vec![0.0; feature_count];
    let mut normalized_weights = vec![0.0; feature_count];
    let normalized_by_feature = importance
        .entries
        .iter()
        .map(|entry| (entry.feature_name.clone(), entry.normalized_importance))
        .collect::<HashMap<_, _>>();

    for group in expanded_feature_groups(&knn_data.features) {
        let group_indices = feature_indices_for_variable(&knn_data.features, &group)
            .into_iter()
            .filter(|idx| selected_set.contains(idx))
            .collect::<Vec<_>>();

        if group_indices.is_empty() {
            continue;
        }

        let normalized = normalized_by_feature.get(&group).copied().unwrap_or(0.0);

        for idx in group_indices {
            if idx < feature_count {
                raw_weights[idx] = importance
                    .entries
                    .iter()
                    .find(|entry| entry.feature_name == group)
                    .map(|entry| entry.raw_feature_importance)
                    .unwrap_or(0.0);
                normalized_weights[idx] = normalized;
            }
        }
    }

    log_importance(
        knn_data,
        &importance.entries,
        &raw_weights,
        &normalized_weights,
    );
    log_equal_importance_diagnostic(&importance.entries);
    if !has_valid_importance_entries(&importance.entries) {
        log_diagnostic("KNN feature weighting fallback: importance entries are invalid");
        return equal_original_predictor_weights(knn_data, selected_set);
    }

    if !has_valid_positive_sum(&normalized_weights) {
        log_diagnostic(
            "KNN feature weighting fallback: normalized importance empty, invalid, or sum <= 0",
        );
        return equal_original_predictor_weights(knn_data, selected_set);
    }

    normalized_weights
}

fn log_equal_importance_diagnostic(entries: &[crate::models::result::PredictorImportanceEntry]) {
    if entries.len() < 2 {
        return;
    }

    let first_error = entries[0].error_without_feature;
    let all_same_error = entries.iter().all(|entry| {
        entry.error_without_feature.is_finite()
            && (entry.error_without_feature - first_error).abs() <= 1e-9
    });
    let first_normalized = entries[0].normalized_importance;
    let all_same_importance = entries.iter().all(|entry| {
        entry.normalized_importance.is_finite()
            && (entry.normalized_importance - first_normalized).abs() <= 1e-9
    });

    if all_same_error && all_same_importance {
        log_diagnostic(
            "KNN feature weighting diagnostic: leave-one-feature-out errors are identical, so normalized distance weights are identical; this is not fallback.",
        );
    }
}

fn equal_original_predictor_weights(knn_data: &KnnData, selected_set: &HashSet<usize>) -> Vec<f64> {
    let feature_count = knn_data.features.len();

    if selected_set.is_empty() {
        return vec![0.0; feature_count];
    }

    let selected_groups = expanded_feature_groups(&knn_data.features)
        .into_iter()
        .filter(|group| {
            feature_indices_for_variable(&knn_data.features, group)
                .into_iter()
                .any(|idx| selected_set.contains(&idx))
        })
        .collect::<Vec<_>>();

    if selected_groups.is_empty() {
        return vec![0.0; feature_count];
    }

    let equal_weight = 1.0 / selected_groups.len() as f64;
    let mut weights = vec![0.0; feature_count];

    for group in selected_groups {
        for idx in feature_indices_for_variable(&knn_data.features, &group) {
            if selected_set.contains(&idx) {
                weights[idx] = equal_weight;
            }
        }
    }

    weights
}

fn has_valid_positive_sum(weights: &[f64]) -> bool {
    weights.iter().all(|weight| weight.is_finite())
        && weights
            .iter()
            .copied()
            .filter(|weight| *weight > 0.0)
            .sum::<f64>()
            > f64::EPSILON
}

fn has_valid_importance_entries(
    entries: &[crate::models::result::PredictorImportanceEntry],
) -> bool {
    !entries.is_empty()
        && entries.iter().all(|entry| {
            entry.base_error.is_finite()
                && entry.error_without_feature.is_finite()
                && entry.raw_feature_importance.is_finite()
                && entry.normalized_importance.is_finite()
        })
}

pub fn normalize_feature_weights(weights: &mut [f64]) {
    let sum = weights
        .iter()
        .copied()
        .filter(|weight| weight.is_finite() && *weight > 0.0)
        .sum::<f64>();

    if sum > 0.0 {
        for weight in weights {
            if weight.is_finite() && *weight > 0.0 {
                *weight /= sum;
            } else {
                *weight = 0.0;
            }
        }
    }
}

fn log_importance(
    knn_data: &KnnData,
    entries: &[crate::models::result::PredictorImportanceEntry],
    raw_weights: &[f64],
    normalized_weights: &[f64],
) {
    let entry_details = entries
        .iter()
        .map(|entry| {
            format!(
                "{}: base_error={:.12}, error_without={:.12}, raw={:.12}, normalized={:.12}",
                entry.feature_name,
                entry.base_error,
                entry.error_without_feature,
                entry.raw_feature_importance,
                entry.normalized_importance
            )
        })
        .collect::<Vec<_>>()
        .join(" | ");
    log_diagnostic(&format!(
        "KNN feature importance entries: {}",
        if entry_details.is_empty() {
            "(empty)".to_string()
        } else {
            entry_details
        }
    ));
    log_diagnostic(&format!(
        "KNN raw feature importance by distance column: {}",
        named_weights(knn_data, raw_weights)
    ));
    log_diagnostic(&format!(
        "KNN normalized feature importance by distance column: {}",
        named_weights(knn_data, normalized_weights)
    ));
}

fn log_final_weights(knn_data: &KnnData, weights: &[f64], reason: &str) {
    log_diagnostic(&format!(
        "KNN final distance feature weights [{}]: {}",
        reason,
        named_weights(knn_data, weights)
    ));
}

fn named_weights(knn_data: &KnnData, weights: &[f64]) -> String {
    knn_data
        .features
        .iter()
        .enumerate()
        .map(|(idx, feature)| {
            format!(
                "{}={:.12}",
                feature,
                weights.get(idx).copied().unwrap_or(0.0)
            )
        })
        .collect::<Vec<_>>()
        .join(", ")
}

fn log_diagnostic(_message: &str) {
}

#[cfg(test)]
mod tests {
    use crate::models::{
        config::{
            FeaturesConfig, KnnConfig, MainConfig, NeighborsConfig, OutputConfig, PartitionConfig,
            SaveConfig,
        },
        data::{DataValue, KnnData, VariableMeasure},
    };

    use super::calculate_feature_weights;

    #[test]
    fn weighting_off_uses_unit_weights_for_every_feature() {
        let data = test_data(3);
        let mut config = test_config();
        config.neighbors.weight = false;

        assert_eq!(
            calculate_feature_weights(&data, &config).unwrap(),
            vec![1.0, 1.0, 1.0]
        );
    }

    #[test]
    fn weighting_on_defaults_to_equal_normalized_weights() {
        let data = test_data(4);
        let mut config = test_config();
        config.neighbors.weight = true;

        let weights = calculate_feature_weights(&data, &config).unwrap();

        assert!(weights
            .iter()
            .all(|weight| (*weight - 0.25).abs() <= f64::EPSILON));
        assert!((weights.iter().sum::<f64>() - 1.0).abs() <= f64::EPSILON);
    }

    #[test]
    fn weighting_fallback_uses_equal_weights_per_original_predictor() {
        let data = KnnData {
            features: vec![
                "city=jakarta".to_string(),
                "city=bandung".to_string(),
                "device_type=mobile".to_string(),
                "device_type=desktop".to_string(),
                "satisfaction_level".to_string(),
                "age".to_string(),
                "income".to_string(),
            ],
            data_matrix: vec![vec![0.0; 7]],
            display_matrix: vec![vec![0.0; 7]],
            target_values: vec![DataValue::Text("A".to_string())],
            target_measure: VariableMeasure::Nominal,
            case_identifiers: vec![1],
            case_labels: vec!["1".to_string()],
            processed_case_indices: vec![0],
            training_indices: vec![0],
            holdout_indices: Vec::new(),
            excluded_indices: Vec::new(),
            cross_validation_folds: vec![0],
            focal_indices: Vec::new(),
        };
        let mut config = test_config();
        config.neighbors.weight = true;
        config.features.perform_selection = false;

        let weights = calculate_feature_weights(&data, &config).unwrap();

        assert_eq!(weights, vec![0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2]);
    }

    #[test]
    fn weighting_on_uses_leave_one_feature_out_importance_without_feature_selection() {
        let data = KnnData {
            features: vec!["informative".to_string(), "noisy".to_string()],
            data_matrix: vec![
                vec![0.0, 0.0],
                vec![1.0, 0.0],
                vec![2.0, 0.0],
                vec![3.0, 0.0],
            ],
            display_matrix: vec![
                vec![0.0, 0.0],
                vec![1.0, 0.0],
                vec![2.0, 0.0],
                vec![3.0, 0.0],
            ],
            target_values: vec![
                DataValue::Number(0.0),
                DataValue::Number(1.0),
                DataValue::Number(2.0),
                DataValue::Number(3.0),
            ],
            target_measure: VariableMeasure::Scale,
            case_identifiers: vec![1, 2, 3, 4],
            case_labels: vec![
                "1".to_string(),
                "2".to_string(),
                "3".to_string(),
                "4".to_string(),
            ],
            processed_case_indices: vec![0, 1, 2, 3],
            training_indices: vec![0, 1, 2, 3],
            holdout_indices: Vec::new(),
            excluded_indices: Vec::new(),
            cross_validation_folds: vec![0; 4],
            focal_indices: Vec::new(),
        };
        let mut config = test_config();
        config.neighbors.weight = true;
        config.features.perform_selection = false;

        let weights = calculate_feature_weights(&data, &config).unwrap();

        assert!((weights.iter().sum::<f64>() - 1.0).abs() <= f64::EPSILON);
        assert!(weights[0] > weights[1]);
    }

    #[test]
    fn categorical_dummy_columns_receive_full_original_predictor_weight() {
        let data = KnnData {
            features: vec![
                "cat=red".to_string(),
                "cat=blue".to_string(),
                "num".to_string(),
            ],
            data_matrix: vec![
                vec![1.0, 0.0, 0.0],
                vec![1.0, 0.0, 0.1],
                vec![0.0, 1.0, 5.0],
                vec![0.0, 1.0, 5.1],
                vec![1.0, 0.0, 0.2],
                vec![0.0, 1.0, 5.2],
            ],
            display_matrix: vec![
                vec![1.0, 0.0, 0.0],
                vec![1.0, 0.0, 0.1],
                vec![0.0, 1.0, 5.0],
                vec![0.0, 1.0, 5.1],
                vec![1.0, 0.0, 0.2],
                vec![0.0, 1.0, 5.2],
            ],
            target_values: vec![
                DataValue::Text("A".to_string()),
                DataValue::Text("A".to_string()),
                DataValue::Text("B".to_string()),
                DataValue::Text("B".to_string()),
                DataValue::Text("B".to_string()),
                DataValue::Text("B".to_string()),
            ],
            target_measure: VariableMeasure::Nominal,
            case_identifiers: vec![1, 2, 3, 4, 5, 6],
            case_labels: vec![
                "1".to_string(),
                "2".to_string(),
                "3".to_string(),
                "4".to_string(),
                "5".to_string(),
                "6".to_string(),
            ],
            processed_case_indices: vec![0, 1, 2, 3, 4, 5],
            training_indices: vec![0, 1, 2, 3],
            holdout_indices: vec![4, 5],
            excluded_indices: Vec::new(),
            cross_validation_folds: vec![0; 6],
            focal_indices: Vec::new(),
        };
        let mut config = test_config();
        config.neighbors.weight = true;
        config.features.perform_selection = false;

        let weights = calculate_feature_weights(&data, &config).unwrap();

        assert!(weights[0] > 0.0);
        assert_eq!(weights[0], weights[1]);
        assert!((weights[0] + weights[2] - 1.0).abs() <= f64::EPSILON);
    }

    #[test]
    fn numeric_scale_weighting_uses_holdout_regression_error() {
        let data = KnnData {
            features: vec!["informative".to_string(), "constant".to_string()],
            data_matrix: vec![
                vec![0.0, 0.0],
                vec![10.0, 0.0],
                vec![20.0, 0.0],
                vec![1.0, 0.0],
                vec![19.0, 0.0],
            ],
            display_matrix: vec![
                vec![0.0, 0.0],
                vec![10.0, 0.0],
                vec![20.0, 0.0],
                vec![1.0, 0.0],
                vec![19.0, 0.0],
            ],
            target_values: vec![
                DataValue::Number(0.0),
                DataValue::Number(10.0),
                DataValue::Number(20.0),
                DataValue::Number(1.0),
                DataValue::Number(19.0),
            ],
            target_measure: VariableMeasure::Scale,
            case_identifiers: vec![1, 2, 3, 4, 5],
            case_labels: vec![
                "1".to_string(),
                "2".to_string(),
                "3".to_string(),
                "4".to_string(),
                "5".to_string(),
            ],
            processed_case_indices: vec![0, 1, 2, 3, 4],
            training_indices: vec![0, 1, 2],
            holdout_indices: vec![3, 4],
            excluded_indices: Vec::new(),
            cross_validation_folds: vec![0; 5],
            focal_indices: Vec::new(),
        };
        let mut config = test_config();
        config.neighbors.weight = true;
        config.features.perform_selection = false;

        let weights = calculate_feature_weights(&data, &config).unwrap();

        assert!((weights.iter().sum::<f64>() - 1.0).abs() <= f64::EPSILON);
        assert!(weights[0] > 0.9);
        assert!(weights[1] < 0.1);
    }

    fn test_data(feature_count: usize) -> KnnData {
        KnnData {
            features: (0..feature_count)
                .map(|idx| format!("x{}", idx + 1))
                .collect(),
            data_matrix: vec![vec![0.0; feature_count]],
            display_matrix: vec![vec![0.0; feature_count]],
            target_values: vec![DataValue::Text("A".to_string())],
            target_measure: VariableMeasure::Nominal,
            case_identifiers: vec![1],
            case_labels: vec!["1".to_string()],
            processed_case_indices: vec![0],
            training_indices: vec![0],
            holdout_indices: Vec::new(),
            excluded_indices: Vec::new(),
            cross_validation_folds: vec![0],
            focal_indices: Vec::new(),
        }
    }

    fn test_config() -> KnnConfig {
        KnnConfig {
            main: MainConfig {
                target_var: Some("target".to_string()),
                feature_var: None,
                case_iden_var: None,
                focal_case_iden_var: None,
                norm_covar: false,
            },
            neighbors: NeighborsConfig {
                specify: true,
                auto_selection: false,
                specify_k: 1,
                min_k: Some(1),
                max_k: Some(1),
                metric_eucli: true,
                metric_manhattan: false,
                weight: false,
                predictions_mean: true,
                predictions_median: false,
            },
            features: FeaturesConfig {
                forward_selection: None,
                forced_entry_var: None,
                features_to_evaluate: 0,
                forced_features: 0,
                perform_selection: false,
                max_reached: false,
                below_min: false,
                max_to_select: None,
                min_change: 0.0,
            },
            partition: PartitionConfig {
                src_var: None,
                partitioning_variable: None,
                use_randomly: false,
                use_variable: false,
                v_fold_partitioning_variable: None,
                v_fold_use_randomly: false,
                v_fold_use_partitioning_var: false,
                training_number: 70,
                num_partition: 2,
                set_seed: false,
                seed: None,
            },
            save: SaveConfig {
                auto_name: true,
                custom_name: false,
                max_cats_to_save: None,
                has_target_var: false,
                is_cate_target_var: false,
                random_assign_to_partition: false,
                random_assign_to_fold: false,
            },
            output: OutputConfig {
                case_summary: true,
                feature_selection_summary: true,
                k_selection_chart: true,
                predictor_space: true,
                prediction_results: true,
                confusion_matrix: true,
                show_neighbor_detail: false,
                chart_and_table: true,
                export_model_xml: false,
                xml_file_path: None,
                export_distance: false,
                create_dataset: false,
                write_data_file: false,
                new_data_file_path: None,
                dataset_name: None,
            },
        }
    }
}
