use crate::models::{
    config::KnnConfig,
    data::{DataValue, KnnData},
    result::{KSelectionCandidate, KSelectionChart},
};

use super::{
    distance::find_k_nearest_neighbors,
    feature_selection::build_effective_feature_weights,
    partition::EXCLUDED_FOLD,
    prediction::{calculate_mean_prediction, calculate_median_prediction, category_key},
};

pub fn determine_k_value(config: &KnnConfig) -> usize {
    if config.neighbors.specify {
        config.neighbors.specify_k.max(1) as usize
    } else if config.neighbors.auto_selection {
        config.neighbors.min_k.unwrap_or(3).max(1) as usize
    } else {
        3
    }
}

pub fn perform_cross_validation(knn_data: &KnnData, config: &KnnConfig) -> Result<usize, String> {
    Ok(calculate_k_selection_chart(knn_data, config)?
        .map(|chart| chart.selected_k)
        .unwrap_or_else(|| determine_k_value(config)))
}

pub fn calculate_k_selection_chart(
    knn_data: &KnnData,
    config: &KnnConfig,
) -> Result<Option<KSelectionChart>, String> {
    let min_k = config.neighbors.min_k.unwrap_or(3).max(1) as usize;
    let max_k = config
        .neighbors
        .max_k
        .unwrap_or(min_k as i32)
        .max(min_k as i32) as usize;
    let use_euclidean = config.neighbors.metric_eucli;
    let use_median = config.neighbors.predictions_median;
    let use_distance_weights = config.neighbors.weight;
    let weights = build_effective_feature_weights(knn_data, config)?;

    if min_k >= max_k {
        return Ok(Some(KSelectionChart {
            candidates: vec![KSelectionCandidate {
                k: min_k,
                average_error: 0.0,
                selected: true,
            }],
            selected_k: min_k,
            metric_name: "validation_error".to_string(),
        }));
    }

    if knn_data.cross_validation_folds.len() != knn_data.data_matrix.len() {
        return Err("Cross-validation folds do not match the processed data size".to_string());
    }

    let training_fold_pairs: Vec<(usize, usize)> = knn_data
        .training_indices
        .iter()
        .filter_map(|&idx| {
            knn_data
                .cross_validation_folds
                .get(idx)
                .copied()
                .filter(|&fold| fold != EXCLUDED_FOLD)
                .map(|fold| (idx, fold))
        })
        .collect();

    let mut fold_groups: Vec<usize> = training_fold_pairs.iter().map(|(_, fold)| *fold).collect();
    fold_groups.sort_unstable();
    fold_groups.dedup();

    if fold_groups.len() < 2 {
        return Ok(None);
    }

    let mut best_k = min_k;
    let mut min_error = f64::MAX;
    let mut candidates = Vec::new();

    for k in min_k..=max_k {
        let mut total_error = 0.0;
        let mut evaluated_folds = 0;

        for &fold in &fold_groups {
            let validation_indices: Vec<usize> = training_fold_pairs
                .iter()
                .filter_map(
                    |&(idx, fold_num)| {
                        if fold_num == fold {
                            Some(idx)
                        } else {
                            None
                        }
                    },
                )
                .collect();

            let training_indices: Vec<usize> = training_fold_pairs
                .iter()
                .filter_map(
                    |&(idx, fold_num)| {
                        if fold_num != fold {
                            Some(idx)
                        } else {
                            None
                        }
                    },
                )
                .collect();

            if validation_indices.is_empty() || training_indices.is_empty() {
                continue;
            }

            let fold_error = calculate_fold_error(
                knn_data,
                &training_indices,
                &validation_indices,
                k,
                use_euclidean,
                use_median,
                use_distance_weights,
                weights.as_deref(),
            )?;

            total_error += fold_error;
            evaluated_folds += 1;
        }

        if evaluated_folds == 0 {
            continue;
        }

        let avg_error = total_error / (evaluated_folds as f64);
        if avg_error < min_error {
            min_error = avg_error;
            best_k = k;
        }

        candidates.push(KSelectionCandidate {
            k,
            average_error: avg_error,
            selected: false,
        });
    }

    for candidate in &mut candidates {
        candidate.selected = candidate.k == best_k;
    }

    Ok(Some(KSelectionChart {
        candidates,
        selected_k: best_k,
        metric_name: "validation_error".to_string(),
    }))
}

fn calculate_fold_error(
    knn_data: &KnnData,
    training_indices: &[usize],
    validation_indices: &[usize],
    k: usize,
    use_euclidean: bool,
    use_median: bool,
    use_distance_weights: bool,
    weights: Option<&[f64]>,
) -> Result<f64, String> {
    let mut total_error = 0.0;
    let mut count = 0;

    let target_is_categorical = knn_data.target_is_categorical();

    for &idx in validation_indices {
        let neighbors = find_k_nearest_neighbors(
            &knn_data.data_matrix[idx],
            &knn_data.data_matrix,
            training_indices,
            k,
            use_euclidean,
            weights,
        );

        if target_is_categorical {
            let actual = &knn_data.target_values[idx];
            let predicted = super::prediction::calculate_categorical_prediction_with_weights(
                &neighbors,
                &knn_data.target_values,
                use_distance_weights,
            );

            if category_key(Some(actual)) != category_key(Some(&predicted)) {
                total_error += 1.0;
            }
        } else if let DataValue::Number(actual) = knn_data.target_values[idx] {
            let prediction_fn = if use_median {
                calculate_median_prediction
            } else {
                calculate_mean_prediction
            };

            let predicted = if let DataValue::Number(val) =
                prediction_fn(&neighbors, &knn_data.target_values)
            {
                val
            } else {
                0.0
            };

            total_error += (actual - predicted).powi(2);
        }

        count += 1;
    }

    if count > 0 {
        Ok(total_error / (count as f64))
    } else {
        Ok(0.0)
    }
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

    use super::perform_cross_validation;

    #[test]
    fn automatic_k_selection_keeps_smallest_k_on_tie() {
        let knn_data = KnnData {
            features: vec!["x".to_string()],
            data_matrix: vec![vec![0.0], vec![1.0], vec![2.0], vec![3.0]],
            display_matrix: vec![vec![0.0], vec![1.0], vec![2.0], vec![3.0]],
            target_values: vec![
                DataValue::Text("A".to_string()),
                DataValue::Text("A".to_string()),
                DataValue::Text("A".to_string()),
                DataValue::Text("A".to_string()),
            ],
            target_measure: VariableMeasure::Nominal,
            case_identifiers: vec![1, 2, 3, 4],
            case_labels: vec!["1".to_string(), "2".to_string(), "3".to_string(), "4".to_string()],
            processed_case_indices: vec![0, 1, 2, 3],
            training_indices: vec![0, 1, 2, 3],
            holdout_indices: Vec::new(),
            excluded_indices: Vec::new(),
            cross_validation_folds: vec![0, 0, 1, 1],
            focal_indices: Vec::new(),
        };

        let config = test_config();
        assert_eq!(perform_cross_validation(&knn_data, &config).unwrap(), 1);
    }

    fn test_config() -> KnnConfig {
        KnnConfig {
            main: MainConfig {
                target_var: Some("target".to_string()),
                feature_var: Some(vec!["x".to_string()]),
                case_iden_var: None,
                focal_case_iden_var: None,
                norm_covar: false,
            },
            neighbors: NeighborsConfig {
                specify: false,
                auto_selection: true,
                specify_k: 1,
                min_k: Some(1),
                max_k: Some(2),
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
                max_reached: true,
                below_min: false,
                max_to_select: None,
                min_change: 0.01,
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
