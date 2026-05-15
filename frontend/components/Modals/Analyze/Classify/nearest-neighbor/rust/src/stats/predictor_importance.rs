use std::collections::{HashMap, HashSet};

use crate::models::{
    config::KnnConfig,
    data::{AnalysisData, KnnData},
    result::{PredictorImportance, PredictorImportanceEntry},
};

use super::{
    feature_selection::{
        determine_effective_k, expanded_feature_groups, feature_indices_for_variable,
    },
    knn_evaluation::evaluate_knn_error,
    preprocess_data::preprocess_knn_data,
};

pub fn calculate_predictor_importance(
    data: &AnalysisData,
    config: &KnnConfig,
) -> Result<PredictorImportance, String> {
    compute_knn_feature_importance(data, config)
}

pub fn compute_knn_feature_importance(
    data: &AnalysisData,
    config: &KnnConfig,
) -> Result<PredictorImportance, String> {
    let target_var = config.main.target_var.as_ref().ok_or_else(|| {
        "A target variable is required for calculating feature importance".to_string()
    })?;

    if config.features.perform_selection {
        return Err(
            "Feature importance requires finalK and finalFeatureSubset after feature selection"
                .to_string(),
        );
    }

    let knn_data = preprocess_knn_data(data, config)?;
    let k = determine_effective_k(&knn_data, config)?;
    let selected_indices = (0..knn_data.features.len()).collect::<Vec<_>>();

    compute_knn_feature_importance_for_subset(&knn_data, config, target_var, k, &selected_indices)
}

pub fn compute_knn_feature_importance_for_subset(
    knn_data: &KnnData,
    config: &KnnConfig,
    target_var: &str,
    k: usize,
    selected_indices: &[usize],
) -> Result<PredictorImportance, String> {
    if selected_indices.is_empty() {
        return Err("Feature importance requires at least one selected feature".to_string());
    }

    let selected_groups = selected_original_features(&knn_data.features, &selected_indices);
    let base_error = evaluate_knn_error(&knn_data, config, k, &selected_indices)?;
    let m = selected_groups.len().max(1) as f64;
    let target_is_numeric_scale = knn_data.target_is_numeric_scale();
    let evaluation_strategy = if knn_data.holdout_indices.is_empty() {
        "training_loo"
    } else {
        "holdout"
    };
    if target_is_numeric_scale {
        log_debug(&format!(
            "KNN scale feature importance: evaluation_strategy={}, base_error={:.12}",
            evaluation_strategy, base_error
        ));
    }
    let mut entries = Vec::with_capacity(selected_groups.len());

    for feature_name in selected_groups {
        let remove_indices: HashSet<usize> =
            feature_indices_for_variable(&knn_data.features, &feature_name)
                .into_iter()
                .collect();
        let remaining_indices: Vec<usize> = selected_indices
            .iter()
            .copied()
            .filter(|idx| !remove_indices.contains(idx))
            .collect();

        // One original categorical predictor can span multiple one-hot columns.
        let error_without_feature = evaluate_knn_error(&knn_data, config, k, &remaining_indices)?;
        let delta_error = error_without_feature - base_error;
        let raw_feature_importance =
            calculate_raw_importance_spss_style(error_without_feature, base_error, m);
        let error_ratio = if error_without_feature.is_finite()
            && base_error.is_finite()
            && base_error > f64::EPSILON
        {
            error_without_feature / base_error
        } else {
            f64::NAN
        };
        if target_is_numeric_scale {
            log_debug(&format!(
                "KNN scale feature importance [{}]: error_without_feature={:.12}, error_ratio={:.12}, raw_importance={:.12}",
                feature_name, error_without_feature, error_ratio, raw_feature_importance
            ));
        }

        entries.push(PredictorImportanceEntry {
            feature_name,
            base_error,
            error_without_feature,
            delta_error,
            raw_feature_importance,
            normalized_importance: 0.0,
            rank: 0,
        });
    }

    normalize_feature_importance(&mut entries);
    if target_is_numeric_scale {
        let normalized_details = entries
            .iter()
            .map(|entry| format!("{}={:.12}", entry.feature_name, entry.normalized_importance))
            .collect::<Vec<_>>()
            .join(", ");
        log_debug(&format!(
            "KNN scale feature importance normalized weights: {}",
            normalized_details
        ));
    }

    let predictors = entries
        .iter()
        .map(|entry| (entry.feature_name.clone(), entry.normalized_importance))
        .collect::<HashMap<_, _>>();

    Ok(PredictorImportance {
        predictors,
        target: target_var.to_string(),
        entries,
        k,
    })
}

fn selected_original_features(features: &[String], selected_indices: &[usize]) -> Vec<String> {
    let selected_set: HashSet<usize> = selected_indices.iter().copied().collect();

    expanded_feature_groups(features)
        .into_iter()
        .filter(|feature| {
            feature_indices_for_variable(features, feature)
                .into_iter()
                .any(|idx| selected_set.contains(&idx))
        })
        .collect()
}

fn calculate_raw_importance_spss_style(
    error_without_feature: f64,
    base_error: f64,
    original_feature_count: f64,
) -> f64 {
    if error_without_feature.is_finite() && base_error.is_finite() && base_error > f64::EPSILON {
        (error_without_feature / base_error) + (1.0 / original_feature_count)
    } else {
        f64::NAN
    }
}

pub fn normalize_feature_importance(entries: &mut [PredictorImportanceEntry]) {
    let sum = entries
        .iter()
        .map(|entry| entry.raw_feature_importance.max(0.0))
        .sum::<f64>();

    if sum > f64::EPSILON {
        for entry in entries.iter_mut() {
            entry.normalized_importance = entry.raw_feature_importance.max(0.0) / sum;
        }
    } else {
        for entry in entries.iter_mut() {
            entry.normalized_importance = 0.0;
        }
    }

    entries.sort_by(|left, right| {
        right
            .normalized_importance
            .partial_cmp(&left.normalized_importance)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then_with(|| left.feature_name.cmp(&right.feature_name))
    });

    for (rank, entry) in entries.iter_mut().enumerate() {
        entry.rank = rank + 1;
    }
}

fn log_debug(message: &str) {
    #[cfg(target_arch = "wasm32")]
    web_sys::console::log_1(&message.into());

    #[cfg(not(target_arch = "wasm32"))]
    eprintln!("{}", message);
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

    use super::compute_knn_feature_importance_for_subset;

    #[test]
    fn importance_uses_final_subset_groups_and_spss_raw_formula() {
        let knn_data = KnnData {
            features: vec![
                "cat=red".to_string(),
                "cat=blue".to_string(),
                "num".to_string(),
                "unused".to_string(),
            ],
            data_matrix: vec![
                vec![1.0, 0.0, 0.0, 9.0],
                vec![1.0, 0.0, 0.1, 8.0],
                vec![0.0, 1.0, 5.0, 7.0],
                vec![0.0, 1.0, 5.1, 6.0],
                vec![1.0, 0.0, 0.2, 5.0],
                vec![0.0, 1.0, 5.2, 4.0],
            ],
            display_matrix: vec![
                vec![1.0, 0.0, 0.0, 9.0],
                vec![1.0, 0.0, 0.1, 8.0],
                vec![0.0, 1.0, 5.0, 7.0],
                vec![0.0, 1.0, 5.1, 6.0],
                vec![1.0, 0.0, 0.2, 5.0],
                vec![0.0, 1.0, 5.2, 4.0],
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
        let config = test_config();

        let importance =
            compute_knn_feature_importance_for_subset(&knn_data, &config, "target", 1, &[0, 1, 2])
                .unwrap();

        assert_eq!(importance.k, 1);
        assert_eq!(importance.entries.len(), 2);
        assert!(importance
            .entries
            .iter()
            .all(|entry| entry.feature_name == "cat" || entry.feature_name == "num"));
        assert!(importance
            .entries
            .iter()
            .all(|entry| if entry.base_error > f64::EPSILON {
                let expected =
                    (entry.error_without_feature / entry.base_error) + (1.0 / 2.0);
                (entry.raw_feature_importance - expected).abs() <= f64::EPSILON
            } else {
                entry.raw_feature_importance.is_finite()
            }));

        let normalized_sum = importance
            .entries
            .iter()
            .map(|entry| entry.normalized_importance)
            .sum::<f64>();
        assert!((normalized_sum - 1.0).abs() <= f64::EPSILON);
    }

    fn test_config() -> KnnConfig {
        KnnConfig {
            main: MainConfig {
                target_var: Some("target".to_string()),
                feature_var: Some(vec!["cat".to_string(), "num".to_string()]),
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
                forward_selection: Some(vec!["cat".to_string(), "num".to_string()]),
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
