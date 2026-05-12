use std::collections::{BTreeSet, HashMap};

use crate::models::{
    config::KnnConfig,
    data::{AnalysisData, DataValue},
    result::{SavedVariable, SavedVariables},
};

use super::core::{
    build_effective_feature_weights, calculate_predictions, determine_k_value,
    find_k_nearest_neighbors, perform_cross_validation, preprocess_knn_data,
};

pub fn calculate_saved_variables(
    data: &AnalysisData,
    config: &KnnConfig,
) -> Result<Option<SavedVariables>, String> {
    if !config.save.has_target_var
        && !config.save.is_cate_target_var
        && !config.save.random_assign_to_partition
        && !config.save.random_assign_to_fold
    {
        return Ok(None);
    }

    let knn_data = preprocess_knn_data(data, config)?;
    let total_cases = count_raw_cases(data).max(
        knn_data
            .processed_case_indices
            .iter()
            .copied()
            .max()
            .map(|idx| idx + 1)
            .unwrap_or(0),
    );

    let mut variables = Vec::new();

    if config.save.has_target_var || config.save.is_cate_target_var {
        let k = if config.neighbors.auto_selection && !config.neighbors.specify {
            perform_cross_validation(&knn_data, config)?
        } else {
            determine_k_value(config)
        };
        let weights = build_effective_feature_weights(&knn_data, config)?;
        let predictions = calculate_case_predictions(
            &knn_data.data_matrix,
            &knn_data.target_values,
            &knn_data.training_indices,
            config.neighbors.metric_eucli,
            k,
            weights.as_deref(),
            config,
        );

        if config.save.has_target_var {
            variables.push(build_predicted_value_variable(
                total_cases,
                &knn_data.processed_case_indices,
                &predictions.predicted_values,
                target_is_numeric(&knn_data.target_values),
            ));
        }

        if config.save.is_cate_target_var {
            let max_categories = config.save.max_cats_to_save.unwrap_or(25).max(0) as usize;
            variables.extend(build_probability_variables(
                total_cases,
                &knn_data.processed_case_indices,
                &predictions.category_probabilities,
                max_categories,
            ));
        }
    }

    if config.save.random_assign_to_partition {
        variables.push(build_partition_variable(
            total_cases,
            &knn_data.processed_case_indices,
            &knn_data.training_indices,
            &knn_data.holdout_indices,
        ));
    }

    if config.save.random_assign_to_fold {
        variables.push(build_fold_variable(
            total_cases,
            &knn_data.processed_case_indices,
            &knn_data.cross_validation_folds,
        ));
    }

    if variables.is_empty() {
        Ok(None)
    } else {
        Ok(Some(SavedVariables { variables }))
    }
}

struct CasePredictions {
    predicted_values: Vec<DataValue>,
    category_probabilities: HashMap<String, Vec<f64>>,
}

fn calculate_case_predictions(
    data_matrix: &[Vec<f64>],
    target_values: &[DataValue],
    training_indices: &[usize],
    use_euclidean: bool,
    k: usize,
    weights: Option<&[f64]>,
    config: &KnnConfig,
) -> CasePredictions {
    let categories = collect_target_categories(target_values);
    let mut predicted_values = vec![DataValue::Null; data_matrix.len()];
    let mut category_probabilities: HashMap<String, Vec<f64>> = categories
        .iter()
        .map(|category| (category.clone(), vec![0.0; data_matrix.len()]))
        .collect();

    for (case_idx, point) in data_matrix.iter().enumerate() {
        let candidate_indices: Vec<usize> = training_indices
            .iter()
            .filter(|&&idx| idx != case_idx)
            .copied()
            .collect();

        if candidate_indices.is_empty() {
            continue;
        }

        let neighbors = find_k_nearest_neighbors(
            point,
            data_matrix,
            &candidate_indices,
            k,
            use_euclidean,
            weights,
        );

        predicted_values[case_idx] = calculate_predictions(&neighbors, target_values, config);

        if !categories.is_empty() && !neighbors.is_empty() {
            let mut counts: HashMap<String, usize> = HashMap::new();
            for &(neighbor_idx, _) in &neighbors {
                if let Some(category) = category_key(target_values.get(neighbor_idx)) {
                    *counts.entry(category).or_insert(0) += 1;
                }
            }

            let denominator = neighbors.len() as f64;
            for category in &categories {
                let probability = (*counts.get(category).unwrap_or(&0) as f64) / denominator;
                if let Some(values) = category_probabilities.get_mut(category) {
                    values[case_idx] = probability;
                }
            }
        }
    }

    CasePredictions {
        predicted_values,
        category_probabilities,
    }
}

fn build_predicted_value_variable(
    total_cases: usize,
    processed_case_indices: &[usize],
    predictions: &[DataValue],
    numeric_target: bool,
) -> SavedVariable {
    let mut values = vec![DataValue::Null; total_cases];
    for (processed_idx, &raw_idx) in processed_case_indices.iter().enumerate() {
        if raw_idx < values.len() {
            values[raw_idx] = predictions
                .get(processed_idx)
                .cloned()
                .unwrap_or(DataValue::Null);
        }
    }

    SavedVariable {
        name: "KNN_PredictedValue".to_string(),
        label: "KNN predicted value or category".to_string(),
        variable_type: if numeric_target { "NUMERIC" } else { "STRING" }.to_string(),
        measure: if numeric_target { "scale" } else { "nominal" }.to_string(),
        decimals: if numeric_target { 2 } else { 0 },
        values,
    }
}

fn build_probability_variables(
    total_cases: usize,
    processed_case_indices: &[usize],
    category_probabilities: &HashMap<String, Vec<f64>>,
    max_categories: usize,
) -> Vec<SavedVariable> {
    let mut categories: Vec<String> = category_probabilities.keys().cloned().collect();
    categories.sort();
    categories.truncate(max_categories);

    categories
        .iter()
        .map(|category| {
            let mut values = vec![DataValue::Null; total_cases];
            if let Some(probabilities) = category_probabilities.get(category) {
                for (processed_idx, &raw_idx) in processed_case_indices.iter().enumerate() {
                    if raw_idx < values.len() {
                        values[raw_idx] = DataValue::Number(
                            probabilities.get(processed_idx).copied().unwrap_or(0.0),
                        );
                    }
                }
            }

            SavedVariable {
                name: format!("KNN_Probability_{}", sanitize_name_part(category)),
                label: format!("KNN predicted probability for {}", category),
                variable_type: "NUMERIC".to_string(),
                measure: "scale".to_string(),
                decimals: 4,
                values,
            }
        })
        .collect()
}

fn build_partition_variable(
    total_cases: usize,
    processed_case_indices: &[usize],
    training_indices: &[usize],
    holdout_indices: &[usize],
) -> SavedVariable {
    let training_set: BTreeSet<usize> = training_indices.iter().copied().collect();
    let holdout_set: BTreeSet<usize> = holdout_indices.iter().copied().collect();
    let mut values = vec![DataValue::Null; total_cases];

    for (processed_idx, &raw_idx) in processed_case_indices.iter().enumerate() {
        if raw_idx >= values.len() {
            continue;
        }

        if training_set.contains(&processed_idx) {
            values[raw_idx] = DataValue::Number(1.0);
        } else if holdout_set.contains(&processed_idx) {
            values[raw_idx] = DataValue::Number(0.0);
        }
    }

    SavedVariable {
        name: "KNN_Partition".to_string(),
        label: "KNN training or holdout partition".to_string(),
        variable_type: "NUMERIC".to_string(),
        measure: "nominal".to_string(),
        decimals: 0,
        values,
    }
}

fn build_fold_variable(
    total_cases: usize,
    processed_case_indices: &[usize],
    folds: &[usize],
) -> SavedVariable {
    let mut values = vec![DataValue::Null; total_cases];

    for (processed_idx, &raw_idx) in processed_case_indices.iter().enumerate() {
        if raw_idx < values.len() {
            values[raw_idx] =
                DataValue::Number(folds.get(processed_idx).copied().unwrap_or(0) as f64 + 1.0);
        }
    }

    SavedVariable {
        name: "KNN_Fold".to_string(),
        label: "KNN cross-validation fold".to_string(),
        variable_type: "NUMERIC".to_string(),
        measure: "nominal".to_string(),
        decimals: 0,
        values,
    }
}

fn target_is_numeric(target_values: &[DataValue]) -> bool {
    target_values
        .iter()
        .any(|value| matches!(value, DataValue::Number(n) if n.is_finite()))
}

fn collect_target_categories(target_values: &[DataValue]) -> Vec<String> {
    let mut categories = BTreeSet::new();
    for value in target_values {
        if let Some(category) = category_key(Some(value)) {
            categories.insert(category);
        }
    }

    categories.into_iter().collect()
}

fn category_key(value: Option<&DataValue>) -> Option<String> {
    match value {
        Some(DataValue::Text(text)) if !text.trim().is_empty() => Some(text.clone()),
        Some(DataValue::Boolean(value)) => Some(value.to_string()),
        Some(DataValue::Number(value)) if value.is_finite() => Some(value.to_string()),
        _ => None,
    }
}

fn count_raw_cases(data: &AnalysisData) -> usize {
    data.features_data
        .iter()
        .map(|ds| ds.len())
        .chain(data.target_data.iter().map(|ds| ds.len()))
        .chain(
            data.case_data
                .as_ref()
                .into_iter()
                .flat_map(|datasets| datasets.iter().map(|ds| ds.len())),
        )
        .max()
        .unwrap_or(0)
}

fn sanitize_name_part(value: &str) -> String {
    let mut sanitized = value
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() || ch == '_' {
                ch
            } else {
                '_'
            }
        })
        .collect::<String>();

    if sanitized.is_empty() {
        sanitized = "Category".to_string();
    }

    if sanitized
        .chars()
        .next()
        .map(|ch| ch.is_ascii_digit())
        .unwrap_or(true)
    {
        sanitized.insert_str(0, "C_");
    }

    sanitized.chars().take(48).collect()
}
