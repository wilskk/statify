use std::collections::HashSet;

use crate::models::{
    config::KnnConfig,
    data::{DataValue, KnnData},
    result::{FeatureSelectionStep, FeatureSelectionSummary, KFeatureSelectionSummary},
};

use super::{
    cross_validation::determine_k_value,
    distance::find_k_nearest_neighbors,
    feature_weighting::calculate_feature_weights,
    prediction::{
        calculate_categorical_prediction_with_weights, calculate_mean_prediction,
        calculate_median_prediction, category_key,
    },
};

pub fn build_effective_feature_weights(
    knn_data: &KnnData,
    config: &KnnConfig,
) -> Result<Option<Vec<f64>>, String> {
    let selection = resolve_feature_selection(knn_data, config)?;
    let selected_features = selection.selected_indices;
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
    Ok(resolve_feature_selection(knn_data, config)?.selected_indices)
}

pub struct FeatureSelectionResolution {
    pub selected_k: usize,
    pub selected_indices: Vec<usize>,
    pub summary: Option<FeatureSelectionSummary>,
    pub steps: Vec<FeatureSelectionStep>,
    pub k_summaries: Vec<KFeatureSelectionSummary>,
}

pub fn resolve_feature_selection(
    knn_data: &KnnData,
    config: &KnnConfig,
) -> Result<FeatureSelectionResolution, String> {
    if !config.features.perform_selection {
        return Ok(FeatureSelectionResolution {
            selected_k: determine_k_value(config),
            selected_indices: (0..knn_data.features.len()).collect(),
            summary: None,
            steps: Vec::new(),
            k_summaries: Vec::new(),
        });
    }

    if config.neighbors.auto_selection && !config.neighbors.specify {
        resolve_combined_k_and_feature_selection(knn_data, config)
    } else {
        let k = determine_k_value(config);
        let run = run_forward_selection_for_k(knn_data, config, k)?;
        Ok(FeatureSelectionResolution {
            selected_k: k,
            selected_indices: run.selected_indices,
            summary: Some(run.summary),
            steps: run.steps,
            k_summaries: Vec::new(),
        })
    }
}

pub fn determine_effective_k(knn_data: &KnnData, config: &KnnConfig) -> Result<usize, String> {
    if config.features.perform_selection
        && config.neighbors.auto_selection
        && !config.neighbors.specify
    {
        return Ok(resolve_feature_selection(knn_data, config)?.selected_k);
    }

    if config.neighbors.auto_selection && !config.neighbors.specify {
        super::cross_validation::perform_cross_validation(knn_data, config)
    } else {
        Ok(determine_k_value(config))
    }
}

pub fn calculate_feature_selection_output(
    knn_data: &KnnData,
    config: &KnnConfig,
) -> Result<
    (
        Option<FeatureSelectionSummary>,
        Option<Vec<FeatureSelectionStep>>,
        Option<Vec<KFeatureSelectionSummary>>,
    ),
    String,
> {
    if !config.features.perform_selection {
        return Ok((None, None, None));
    }

    let resolution = resolve_feature_selection(knn_data, config)?;
    Ok((
        resolution.summary,
        Some(resolution.steps),
        if resolution.k_summaries.is_empty() {
            None
        } else {
            Some(resolution.k_summaries)
        },
    ))
}

struct ForwardSelectionRun {
    selected_indices: Vec<usize>,
    selected_groups: Vec<String>,
    final_error: f64,
    stopping_reason: String,
    summary: FeatureSelectionSummary,
    steps: Vec<FeatureSelectionStep>,
}

fn resolve_combined_k_and_feature_selection(
    knn_data: &KnnData,
    config: &KnnConfig,
) -> Result<FeatureSelectionResolution, String> {
    let min_k = config.neighbors.min_k.unwrap_or(3).max(1) as usize;
    let max_k = config
        .neighbors
        .max_k
        .unwrap_or(min_k as i32)
        .max(min_k as i32) as usize;

    let mut best_run: Option<(usize, ForwardSelectionRun)> = None;
    let mut k_summaries = Vec::new();

    for k in min_k..=max_k {
        let run = run_forward_selection_for_k(knn_data, config, k)?;
        let is_better = best_run
            .as_ref()
            .map(|(best_k, best)| {
                run.final_error < best.final_error
                    || ((run.final_error - best.final_error).abs() <= f64::EPSILON
                        && (k < *best_k
                            || (k == *best_k
                                && run.selected_groups.len() < best.selected_groups.len())))
            })
            .unwrap_or(true);

        k_summaries.push(KFeatureSelectionSummary {
            k,
            selected_features: run.selected_groups.clone(),
            error: run.final_error,
            stopping_reason: run.stopping_reason.clone(),
            selected: false,
        });

        if is_better {
            best_run = Some((k, run));
        }
    }

    let Some((selected_k, run)) = best_run else {
        return Err("No valid K and feature-selection candidate found".to_string());
    };

    for summary in &mut k_summaries {
        summary.selected = summary.k == selected_k
            && (summary.error - run.final_error).abs() <= f64::EPSILON
            && summary.selected_features == run.selected_groups;
    }

    Ok(FeatureSelectionResolution {
        selected_k,
        selected_indices: run.selected_indices,
        summary: Some(run.summary),
        steps: run.steps,
        k_summaries,
    })
}

fn run_forward_selection_for_k(
    knn_data: &KnnData,
    config: &KnnConfig,
    k: usize,
) -> Result<ForwardSelectionRun, String> {
    let forced_vars = ordered_existing_groups(
        config.features.forced_entry_var.as_deref().unwrap_or(&[]),
        &knn_data.features,
    );
    let forward_vars = ordered_existing_groups(
        config.features.forward_selection.as_deref().unwrap_or(&[]),
        &knn_data.features,
    );
    let forced_var_set: HashSet<&str> = forced_vars.iter().map(String::as_str).collect();
    let candidate_features: Vec<String> = forward_vars
        .iter()
        .filter(|var| !forced_var_set.contains(var.as_str()))
        .cloned()
        .collect();
    let all_groups = expanded_feature_groups(&knn_data.features);

    let mut selected_groups = forced_vars.clone();
    let mut selected_indices = feature_indices_for_variables(&knn_data.features, &selected_groups);
    selected_indices.sort_unstable();
    selected_indices.dedup();

    let mut remaining_features = candidate_features.clone();
    let mut current_error = if selected_indices.is_empty() {
        f64::INFINITY
    } else {
        calculate_holdout_error_with_selected_features(knn_data, config, k, &selected_indices)?
    };
    let mut added_features_count = 0usize;
    let mut steps = Vec::new();
    let stopping_method = if config.features.max_reached {
        "fixed_number"
    } else {
        "minimum_change"
    }
    .to_string();
    let max_features_to_add = config
        .features
        .max_to_select
        .unwrap_or(remaining_features.len() as i32)
        .max(0) as usize;
    let stopping_reason: String;

    loop {
        if remaining_features.is_empty() {
            stopping_reason = "no_remaining_features".to_string();
            break;
        }

        if config.features.max_reached && added_features_count >= max_features_to_add {
            stopping_reason = "fixed_number_reached".to_string();
            break;
        }

        let mut best_feature_pos = None;
        let mut best_error = f64::INFINITY;
        let mut best_indices = Vec::new();

        for (pos, feature) in remaining_features.iter().enumerate() {
            let mut trial_indices = selected_indices.clone();
            trial_indices.extend(feature_indices_for_variable(&knn_data.features, feature));
            trial_indices.sort_unstable();
            trial_indices.dedup();

            if trial_indices.is_empty() {
                continue;
            }

            let trial_error = calculate_holdout_error_with_selected_features(
                knn_data,
                config,
                k,
                &trial_indices,
            )?;

            if trial_error < best_error {
                best_error = trial_error;
                best_feature_pos = Some(pos);
                best_indices = trial_indices;
            }
        }

        let Some(best_pos) = best_feature_pos else {
            stopping_reason = "no_valid_candidate".to_string();
            break;
        };

        let improvement = if current_error.is_infinite() {
            None
        } else {
            Some(current_error - best_error)
        };

        if config.features.below_min
            && improvement.unwrap_or(f64::INFINITY) <= config.features.min_change.max(0.0)
        {
            stopping_reason = "minimum_change_not_met".to_string();
            break;
        }

        let selected_feature = remaining_features.remove(best_pos);
        selected_groups.push(selected_feature.clone());
        selected_indices = best_indices;
        current_error = best_error;
        added_features_count += 1;

        steps.push(FeatureSelectionStep {
            step_number: steps.len() + 1,
            selected_feature,
            trial_error: best_error,
            improvement,
            selected_features_after_step: selected_groups.clone(),
        });
    }

    if current_error.is_infinite() && !selected_indices.is_empty() {
        current_error =
            calculate_holdout_error_with_selected_features(knn_data, config, k, &selected_indices)?;
    }

    let selected_set: HashSet<&str> = selected_groups.iter().map(String::as_str).collect();
    let removed_features = all_groups
        .into_iter()
        .filter(|feature| !selected_set.contains(feature.as_str()))
        .collect();

    let summary = FeatureSelectionSummary {
        enabled: true,
        method: "forward_selection".to_string(),
        forced_features: forced_vars,
        candidate_features,
        selected_features: selected_groups.clone(),
        removed_features,
        final_error: if current_error.is_finite() {
            current_error
        } else {
            0.0
        },
        stopping_method,
        stopping_reason: stopping_reason.clone(),
        evaluation_strategy: "holdout".to_string(),
    };

    Ok(ForwardSelectionRun {
        selected_indices,
        selected_groups,
        final_error: summary.final_error,
        stopping_reason,
        summary,
        steps,
    })
}

fn calculate_holdout_error_with_selected_features(
    knn_data: &KnnData,
    config: &KnnConfig,
    k: usize,
    selected_features: &[usize],
) -> Result<f64, String> {
    let weights = selected_feature_weights(knn_data, config, selected_features);
    let validation_indices: Vec<usize> = if knn_data.holdout_indices.is_empty() {
        knn_data.training_indices.clone()
    } else {
        knn_data.holdout_indices.clone()
    };

    if validation_indices.is_empty() || knn_data.training_indices.is_empty() {
        return Ok(0.0);
    }

    let target_is_numeric = knn_data
        .target_values
        .iter()
        .any(|value| matches!(value, DataValue::Number(n) if n.is_finite()));
    let mut total_error = 0.0;
    let mut count = 0usize;

    for &idx in &validation_indices {
        let training_indices: Vec<usize> = knn_data
            .training_indices
            .iter()
            .copied()
            .filter(|&candidate_idx| candidate_idx != idx)
            .collect();

        if training_indices.is_empty() {
            continue;
        }

        let neighbors = find_k_nearest_neighbors(
            &knn_data.data_matrix[idx],
            &knn_data.data_matrix,
            &training_indices,
            k,
            config.neighbors.metric_eucli,
            Some(&weights),
        );

        if target_is_numeric {
            let predicted = if config.neighbors.predictions_median {
                calculate_median_prediction(&neighbors, &knn_data.target_values)
            } else {
                calculate_mean_prediction(&neighbors, &knn_data.target_values)
            };

            if let (DataValue::Number(actual), DataValue::Number(predicted)) =
                (&knn_data.target_values[idx], predicted)
            {
                total_error += (*actual - predicted).powi(2);
                count += 1;
            }
        } else {
            let predicted = calculate_categorical_prediction_with_weights(
                &neighbors,
                &knn_data.target_values,
                config.neighbors.weight,
            );

            if category_key(Some(&knn_data.target_values[idx])).is_some() {
                if category_key(Some(&knn_data.target_values[idx]))
                    != category_key(Some(&predicted))
                {
                    total_error += 1.0;
                }
                count += 1;
            }
        }
    }

    Ok(if count > 0 {
        total_error / (count as f64)
    } else {
        0.0
    })
}

fn selected_feature_weights(
    knn_data: &KnnData,
    config: &KnnConfig,
    selected_features: &[usize],
) -> Vec<f64> {
    let base_weights = calculate_feature_weights(knn_data, config);
    let selected_set: HashSet<usize> = selected_features.iter().copied().collect();
    let mut weights = vec![0.0; knn_data.features.len()];

    for feature_idx in selected_set {
        if feature_idx < weights.len() {
            weights[feature_idx] = base_weights
                .as_ref()
                .and_then(|base| base.get(feature_idx).copied())
                .unwrap_or(1.0);
        }
    }

    weights
}

fn feature_indices_for_variables(features: &[String], variables: &[String]) -> Vec<usize> {
    variables
        .iter()
        .flat_map(|var| feature_indices_for_variable(features, var))
        .collect()
}

fn ordered_existing_groups(variables: &[String], features: &[String]) -> Vec<String> {
    let available_groups: HashSet<String> = expanded_feature_groups(features).into_iter().collect();
    let mut result = Vec::new();

    for variable in variables {
        if available_groups.contains(variable) && !result.contains(variable) {
            result.push(variable.clone());
        }
    }

    result
}

fn expanded_feature_groups(features: &[String]) -> Vec<String> {
    let mut groups = Vec::new();

    for feature in features {
        let group = feature
            .split_once('=')
            .map(|(prefix, _)| prefix.to_string())
            .unwrap_or_else(|| feature.clone());

        if !groups.contains(&group) {
            groups.push(group);
        }
    }

    groups
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

#[cfg(test)]
mod tests {
    use crate::models::{
        config::{
            FeaturesConfig, KnnConfig, MainConfig, NeighborsConfig, OutputConfig, PartitionConfig,
            SaveConfig,
        },
        data::{DataValue, KnnData},
    };

    use super::{perform_forward_selection, resolve_feature_selection};

    #[test]
    fn disabled_feature_selection_uses_all_features() {
        let data = base_data(vec!["x1", "x2"], vec![vec![0.0, 1.0], vec![1.0, 0.0]]);
        let mut config = test_config(vec!["x1", "x2"]);
        config.features.perform_selection = false;

        assert_eq!(
            perform_forward_selection(&data, &config).unwrap(),
            vec![0, 1]
        );
    }

    #[test]
    fn forced_features_always_remain_selected() {
        let data = separable_data(vec!["forced", "candidate"]);
        let mut config = test_config(vec!["forced", "candidate"]);
        config.features.forced_entry_var = Some(vec!["forced".to_string()]);
        config.features.max_to_select = Some(1);

        let selected = perform_forward_selection(&data, &config).unwrap();

        assert!(selected.contains(&0));
    }

    #[test]
    fn fixed_number_stopping_limits_added_features() {
        let data = separable_data(vec!["x1", "x2", "x3"]);
        let mut config = test_config(vec!["x1", "x2", "x3"]);
        config.features.max_reached = true;
        config.features.below_min = false;
        config.features.max_to_select = Some(2);

        let resolution = resolve_feature_selection(&data, &config).unwrap();

        assert_eq!(resolution.steps.len(), 2);
        assert_eq!(
            resolution.summary.unwrap().stopping_reason,
            "fixed_number_reached"
        );
    }

    #[test]
    fn minimum_change_stops_without_adding_small_improvement() {
        let data = separable_data(vec!["x1", "x2"]);
        let mut config = test_config(vec!["x1", "x2"]);
        config.features.forced_entry_var = Some(vec!["x1".to_string()]);
        config.features.max_reached = false;
        config.features.below_min = true;
        config.features.min_change = 0.0;

        let resolution = resolve_feature_selection(&data, &config).unwrap();
        let summary = resolution.summary.unwrap();

        assert_eq!(summary.selected_features, vec!["x1"]);
        assert_eq!(summary.stopping_reason, "minimum_change_not_met");
    }

    #[test]
    fn ties_choose_earliest_candidate_feature() {
        let data = separable_data(vec!["early", "late"]);
        let mut config = test_config(vec!["early", "late"]);
        config.features.max_to_select = Some(1);

        let resolution = resolve_feature_selection(&data, &config).unwrap();

        assert_eq!(resolution.steps[0].selected_feature, "early");
    }

    #[test]
    fn categorical_one_hot_columns_are_selected_as_one_group() {
        let data = KnnData {
            features: vec![
                "cat=red".to_string(),
                "cat=blue".to_string(),
                "num".to_string(),
            ],
            data_matrix: vec![
                vec![1.0, 0.0, 5.0],
                vec![1.0, 0.0, 6.0],
                vec![0.0, 1.0, 5.0],
                vec![0.0, 1.0, 6.0],
                vec![1.0, 0.0, 8.0],
                vec![0.0, 1.0, 8.0],
            ],
            target_values: vec![
                DataValue::Text("A".to_string()),
                DataValue::Text("A".to_string()),
                DataValue::Text("B".to_string()),
                DataValue::Text("B".to_string()),
                DataValue::Text("A".to_string()),
                DataValue::Text("B".to_string()),
            ],
            case_identifiers: vec![1, 2, 3, 4, 5, 6],
            processed_case_indices: vec![0, 1, 2, 3, 4, 5],
            training_indices: vec![0, 1, 2, 3],
            holdout_indices: vec![4, 5],
            excluded_indices: Vec::new(),
            cross_validation_folds: vec![0; 6],
            focal_indices: Vec::new(),
        };
        let mut config = test_config(vec!["cat", "num"]);
        config.features.max_to_select = Some(1);

        let selected = perform_forward_selection(&data, &config).unwrap();

        assert_eq!(selected, vec![0, 1]);
    }

    #[test]
    fn auto_k_feature_selection_chooses_lowest_error_and_smallest_k_on_tie() {
        let data = separable_data(vec!["x1", "x2"]);
        let mut config = test_config(vec!["x1", "x2"]);
        config.neighbors.specify = false;
        config.neighbors.auto_selection = true;
        config.neighbors.min_k = Some(1);
        config.neighbors.max_k = Some(2);
        config.features.max_to_select = Some(1);

        let resolution = resolve_feature_selection(&data, &config).unwrap();

        assert_eq!(resolution.selected_k, 1);
        assert!(resolution
            .k_summaries
            .iter()
            .any(|summary| summary.selected && summary.k == 1));
    }

    fn separable_data(features: Vec<&str>) -> KnnData {
        let base_rows = vec![
            vec![0.0; features.len()],
            vec![0.0; features.len()],
            vec![10.0; features.len()],
            vec![10.0; features.len()],
            vec![0.0; features.len()],
            vec![10.0; features.len()],
        ];
        base_data(features, base_rows)
    }

    fn base_data(features: Vec<&str>, data_matrix: Vec<Vec<f64>>) -> KnnData {
        let row_count = data_matrix.len();
        KnnData {
            features: features.into_iter().map(String::from).collect(),
            data_matrix,
            target_values: (0..row_count)
                .map(|idx| match idx % 6 {
                    0 | 1 | 4 => DataValue::Text("A".to_string()),
                    _ => DataValue::Text("B".to_string()),
                })
                .collect(),
            case_identifiers: (1..=row_count as i32).collect(),
            processed_case_indices: (0..row_count).collect(),
            training_indices: (0..row_count.saturating_sub(2)).collect(),
            holdout_indices: ((row_count.saturating_sub(2))..row_count).collect(),
            excluded_indices: Vec::new(),
            cross_validation_folds: vec![0; row_count],
            focal_indices: Vec::new(),
        }
    }

    fn test_config(features: Vec<&str>) -> KnnConfig {
        KnnConfig {
            main: MainConfig {
                target_var: Some("target".to_string()),
                feature_var: Some(features.iter().map(|feature| feature.to_string()).collect()),
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
                forward_selection: Some(features.into_iter().map(String::from).collect()),
                forced_entry_var: Some(Vec::new()),
                features_to_evaluate: 0,
                forced_features: 0,
                perform_selection: true,
                max_reached: true,
                below_min: false,
                max_to_select: Some(10),
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
