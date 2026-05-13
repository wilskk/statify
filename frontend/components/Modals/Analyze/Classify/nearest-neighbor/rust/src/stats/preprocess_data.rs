use std::collections::{HashMap, HashSet};

use crate::models::{
    config::KnnConfig,
    data::{AnalysisData, DataValue, KnnData, VariableDefinition, VariableMeasure},
};

use super::partition::{
    has_valid_partitioning_values, split_cross_validation_by_partition_config,
    split_training_holdout_by_partition_config_detailed,
};

pub fn preprocess_knn_data(data: &AnalysisData, config: &KnnConfig) -> Result<KnnData, String> {
    // Extract feature variables
    let features = match &config.main.feature_var {
        Some(vars) => vars.clone(),
        None => {
            // Auto-detect all feature names from features_data, regardless of null values
            if data.features_data.is_empty() {
                return Err("No features data provided".to_string());
            }

            // Collect all unique feature names across all records
            let mut feature_set = HashSet::new();
            for dataset in &data.features_data {
                for record in dataset {
                    for (key, _) in &record.values {
                        feature_set.insert(key.clone());
                    }
                }
            }

            // Also check target_data for numeric features
            for dataset in &data.target_data {
                for record in dataset {
                    for (key, value) in &record.values {
                        if matches!(value, DataValue::Number(_)) {
                            feature_set.insert(key.clone());
                        }
                    }
                }
            }

            feature_set.into_iter().collect()
        }
    };

    if features.is_empty() {
        return Err("No valid features found".to_string());
    }

    let feature_defs: Vec<VariableDefinition> = data
        .features_data_defs
        .iter()
        .flat_map(|defs| defs.clone())
        .collect();
    let feature_measures = derive_feature_measures(&features, &feature_defs);

    // Get target variable
    let target_var = match &config.main.target_var {
        Some(var) => var.clone(),
        None => return Err("Target variable must be specified for KNN".to_string()),
    };

    // Get number of cases - use maximum length across all datasets
    let num_cases = data
        .features_data
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
        .unwrap_or(0);

    if num_cases == 0 {
        return Err("No cases found in data".to_string());
    }

    // Create data matrix and extract target values
    let mut data_matrix = Vec::with_capacity(num_cases);
    let mut target_values = Vec::with_capacity(num_cases);
    let mut case_identifiers = Vec::with_capacity(num_cases);
    let mut processed_case_indices = Vec::with_capacity(num_cases);

    // Get case identifier variable
    let case_ident_var = &config.main.case_iden_var;

    let valid_case_indices = collect_valid_case_indices(
        data,
        &features,
        &feature_measures,
        Some(target_var.as_str()),
    );
    let analysis_case_indices: Vec<usize> = valid_case_indices
        .into_iter()
        .filter(|&case_idx| has_valid_partitioning_values(data, config, case_idx))
        .collect();

    if analysis_case_indices.is_empty() {
        return Err("No valid data records after preprocessing".to_string());
    }

    let category_maps =
        build_category_maps(data, &features, &feature_measures, &analysis_case_indices);

    let expanded_feature_measures =
        build_expanded_feature_measures(&feature_measures, &category_maps);

    // Process each valid case
    for &case_idx in &analysis_case_indices {
        // Extract feature values for current case
        let row = match extract_feature_values_one_hot(
            case_idx,
            &features,
            &feature_measures,
            &category_maps,
            data,
        ) {
            Some(row) => row,
            None => continue, // Skip case if feature extraction failed
        };

        // Get target value if a target variable is specified
        let target_value = extract_target_value(case_idx, &target_var, data);

        if is_missing_target_value(&target_value) {
            continue;
        }

        // Get case identifier
        let case_id = extract_case_identifier(case_idx, case_ident_var, data);

        // Add the case to the data matrix
        data_matrix.push(row);
        target_values.push(target_value);
        case_identifiers.push(case_id);
        processed_case_indices.push(case_idx);
    }

    if data_matrix.is_empty() {
        return Err("No valid data records after preprocessing".to_string());
    }

    // Normalize features if needed
    if config.main.norm_covar {
        normalize_non_categorical_features(&mut data_matrix, &expanded_feature_measures);
    }

    let (training_indices, holdout_indices, excluded_indices) =
        split_training_holdout_by_partition_config_detailed(
            data,
            config,
            data_matrix.len(),
            &processed_case_indices,
        )?;

    let cross_validation_folds =
        split_cross_validation_by_partition_config(data, config, &processed_case_indices)?;

    // Identify focal cases
    let focal_indices =
        identify_focal_cases(&case_identifiers, data, &config.main.focal_case_iden_var);

    let expanded_features =
        build_expanded_feature_names(&features, &feature_measures, &category_maps);

    Ok(KnnData {
        features: expanded_features,
        data_matrix,
        target_values,
        case_identifiers,
        processed_case_indices,
        training_indices,
        holdout_indices,
        excluded_indices,
        cross_validation_folds,
        focal_indices,
    })
}

fn derive_feature_measures(
    features: &[String],
    defs: &[VariableDefinition],
) -> Vec<VariableMeasure> {
    features
        .iter()
        .map(|feature| {
            defs.iter()
                .find(|def| def.name == *feature)
                .map(|def| def.measure.clone())
                .unwrap_or(VariableMeasure::Unknown)
        })
        .collect()
}

fn find_feature_value<'a>(
    case_idx: usize,
    var: &str,
    data: &'a AnalysisData,
) -> Option<&'a DataValue> {
    for dataset in &data.features_data {
        if case_idx < dataset.len() {
            if let Some(value) = dataset[case_idx].values.get(var) {
                return Some(value);
            }
        }
    }

    for dataset in &data.target_data {
        if case_idx < dataset.len() {
            if let Some(value) = dataset[case_idx].values.get(var) {
                return Some(value);
            }
        }
    }

    if let Some(case_data) = &data.case_data {
        for dataset in case_data {
            if case_idx < dataset.len() {
                if let Some(value) = dataset[case_idx].values.get(var) {
                    return Some(value);
                }
            }
        }
    }

    None
}

fn count_cases(data: &AnalysisData) -> usize {
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

fn collect_valid_case_indices(
    data: &AnalysisData,
    features: &[String],
    feature_measures: &[VariableMeasure],
    target_var: Option<&str>,
) -> Vec<usize> {
    let mut valid_case_indices = Vec::new();

    for case_idx in 0..count_cases(data) {
        let has_valid_features = features.iter().enumerate().all(|(feature_idx, var)| {
            let measure = feature_measures
                .get(feature_idx)
                .unwrap_or(&VariableMeasure::Unknown);

            match find_feature_value(case_idx, var, data) {
                Some(DataValue::Text(_)) | Some(DataValue::Boolean(_))
                    if *measure == VariableMeasure::Nominal
                        || *measure == VariableMeasure::Ordinal =>
                {
                    true
                }
                Some(DataValue::Number(n))
                    if *measure != VariableMeasure::Nominal
                        && *measure != VariableMeasure::Ordinal
                        && n.is_finite() =>
                {
                    true
                }
                _ => false,
            }
        });

        if !has_valid_features {
            continue;
        }

        if let Some(target_var_name) = target_var {
            let target_value = extract_target_value(case_idx, target_var_name, data);
            if is_missing_target_value(&target_value) {
                continue;
            }
        }

        valid_case_indices.push(case_idx);
    }

    valid_case_indices
}

fn build_category_maps(
    data: &AnalysisData,
    features: &[String],
    feature_measures: &[VariableMeasure],
    valid_case_indices: &[usize],
) -> Vec<HashMap<String, usize>> {
    let mut category_maps: Vec<HashMap<String, usize>> = vec![HashMap::new(); features.len()];

    for &case_idx in valid_case_indices {
        for (feature_idx, var) in features.iter().enumerate() {
            let measure = feature_measures
                .get(feature_idx)
                .unwrap_or(&VariableMeasure::Unknown);

            let is_categorical =
                *measure == VariableMeasure::Nominal || *measure == VariableMeasure::Ordinal;

            if !is_categorical {
                continue;
            }

            let category_opt = match find_feature_value(case_idx, var, data) {
                Some(DataValue::Text(s)) => Some(s.clone()),
                Some(DataValue::Boolean(b)) => Some(b.to_string()),
                _ => None,
            };

            if let Some(category) = category_opt {
                if !category_maps[feature_idx].contains_key(&category) {
                    let next_idx = category_maps[feature_idx].len();
                    category_maps[feature_idx].insert(category, next_idx);
                }
            }
        }
    }

    category_maps
}

fn extract_feature_values_one_hot(
    case_idx: usize,
    features: &[String],
    feature_measures: &[VariableMeasure],
    category_maps: &[HashMap<String, usize>],
    data: &AnalysisData,
) -> Option<Vec<f64>> {
    let mut row = Vec::new();

    for (feature_idx, var) in features.iter().enumerate() {
        let measure = feature_measures
            .get(feature_idx)
            .unwrap_or(&VariableMeasure::Unknown);

        let is_categorical =
            *measure == VariableMeasure::Nominal || *measure == VariableMeasure::Ordinal;

        if is_categorical {
            let category = match find_feature_value(case_idx, var, data) {
                Some(DataValue::Text(s)) => Some(s.clone()),
                Some(DataValue::Boolean(b)) => Some(b.to_string()),
                _ => None,
            }?;

            let category_map = category_maps.get(feature_idx)?;
            let category_idx = category_map.get(&category)?;

            for i in 0..category_map.len() {
                row.push(if i == *category_idx { 1.0 } else { 0.0 });
            }
        } else {
            match find_feature_value(case_idx, var, data) {
                Some(DataValue::Number(n)) if n.is_finite() => row.push(*n),
                _ => return None,
            }
        }
    }

    Some(row)
}

fn build_expanded_feature_measures(
    feature_measures: &[VariableMeasure],
    category_maps: &[HashMap<String, usize>],
) -> Vec<VariableMeasure> {
    let mut expanded = Vec::new();

    for (i, measure) in feature_measures.iter().enumerate() {
        let is_categorical =
            *measure == VariableMeasure::Nominal || *measure == VariableMeasure::Ordinal;

        if is_categorical {
            for _ in 0..category_maps[i].len() {
                expanded.push(measure.clone());
            }
        } else {
            expanded.push(measure.clone());
        }
    }

    expanded
}

fn build_expanded_feature_names(
    features: &[String],
    feature_measures: &[VariableMeasure],
    category_maps: &[HashMap<String, usize>],
) -> Vec<String> {
    let mut expanded = Vec::new();

    for (i, feature) in features.iter().enumerate() {
        let measure = feature_measures.get(i).unwrap_or(&VariableMeasure::Unknown);

        let is_categorical =
            *measure == VariableMeasure::Nominal || *measure == VariableMeasure::Ordinal;

        if is_categorical {
            let mut categories: Vec<(&String, &usize)> = category_maps[i].iter().collect();

            categories.sort_by_key(|(_, idx)| **idx);

            for (category, _) in categories {
                expanded.push(format!("{}={}", feature, category));
            }
        } else {
            expanded.push(feature.clone());
        }
    }

    expanded
}

fn normalize_non_categorical_features(
    data_matrix: &mut [Vec<f64>],
    feature_measures: &[VariableMeasure],
) {
    if data_matrix.is_empty() {
        return;
    }

    let n_features = data_matrix[0].len();
    for j in 0..n_features {
        let measure = feature_measures.get(j).unwrap_or(&VariableMeasure::Unknown);
        if *measure == VariableMeasure::Nominal || *measure == VariableMeasure::Ordinal {
            continue;
        }

        let finite_values: Vec<f64> = data_matrix
            .iter()
            .filter_map(|row| row.get(j).copied())
            .filter(|value| value.is_finite())
            .collect();

        if finite_values.is_empty() {
            continue;
        }

        let min_val = finite_values.iter().copied().fold(f64::INFINITY, f64::min);
        let max_val = finite_values
            .iter()
            .copied()
            .fold(f64::NEG_INFINITY, f64::max);

        if (max_val - min_val).abs() < f64::EPSILON {
            for row in data_matrix.iter_mut() {
                if let Some(value) = row.get_mut(j) {
                    if value.is_finite() {
                        *value = 0.0;
                    }
                }
            }
            continue;
        }

        for row in data_matrix.iter_mut() {
            if let Some(value) = row.get_mut(j) {
                if value.is_finite() {
                    *value = (2.0 * (*value - min_val)) / (max_val - min_val) - 1.0;
                }
            }
        }
    }
}

/// Helper function to extract target value for a case
fn extract_target_value(case_idx: usize, target_var_name: &str, data: &AnalysisData) -> DataValue {
    for dataset in &data.target_data {
        if case_idx < dataset.len() {
            if let Some(val) = dataset[case_idx].values.get(target_var_name) {
                return val.clone();
            }
        }
    }

    DataValue::Null
}

fn is_missing_target_value(value: &DataValue) -> bool {
    match value {
        DataValue::Null => true,
        DataValue::Text(s) => s.trim().is_empty(),
        DataValue::Number(n) => !n.is_finite(),
        DataValue::Boolean(_) => false,
    }
}

/// Helper function to extract case identifier
fn extract_case_identifier(
    case_idx: usize,
    case_ident_var: &Option<String>,
    data: &AnalysisData,
) -> i32 {
    // Default to case index + 1 if no identifier is found
    let default_id = (case_idx + 1) as i32;

    if let Some(id_var) = case_ident_var {
        // Try features_data first
        for dataset in &data.features_data {
            if case_idx < dataset.len() {
                if let Some(DataValue::Number(id)) = dataset[case_idx].values.get(id_var) {
                    return *id as i32;
                }
            }
        }

        // Then try target_data
        for dataset in &data.target_data {
            if case_idx < dataset.len() {
                if let Some(DataValue::Number(id)) = dataset[case_idx].values.get(id_var) {
                    return *id as i32;
                }
            }
        }
    }

    default_id
}

/// Helper function to identify focal cases
fn identify_focal_cases(
    case_identifiers: &[i32],
    data: &AnalysisData,
    focal_var: &Option<String>,
) -> Vec<usize> {
    let mut focal_indices = Vec::new();

    if let Some(focal_var) = focal_var {
        // Create lookup map for faster case identifier matching
        let case_id_map: HashMap<i32, usize> = case_identifiers
            .iter()
            .enumerate()
            .map(|(idx, &id)| (id, idx))
            .collect();

        // Find matching focal cases
        for dataset in &data.focal_case_data {
            for record in dataset {
                if let Some(DataValue::Number(id)) = record.values.get(focal_var) {
                    let case_id = *id as i32;
                    if let Some(&idx) = case_id_map.get(&case_id) {
                        focal_indices.push(idx);
                    }
                }
            }
        }
    }

    // Default to first case if no focal cases found
    if focal_indices.is_empty() && !case_identifiers.is_empty() {
        focal_indices.push(0);
    }

    focal_indices
}

#[cfg(test)]
mod tests {
    use crate::models::data::VariableMeasure;

    use super::normalize_non_categorical_features;

    #[test]
    fn adjusted_normalization_scales_continuous_columns_and_skips_one_hot() {
        let mut matrix = vec![vec![10.0, 1.0], vec![20.0, 0.0], vec![30.0, 1.0]];
        let measures = vec![VariableMeasure::Scale, VariableMeasure::Nominal];

        normalize_non_categorical_features(&mut matrix, &measures);

        assert_eq!(matrix[0], vec![-1.0, 1.0]);
        assert_eq!(matrix[1], vec![0.0, 0.0]);
        assert_eq!(matrix[2], vec![1.0, 1.0]);
    }

    #[test]
    fn adjusted_normalization_constant_continuous_column_becomes_zero() {
        let mut matrix = vec![vec![5.0], vec![5.0], vec![5.0]];
        let measures = vec![VariableMeasure::Scale];

        normalize_non_categorical_features(&mut matrix, &measures);

        assert_eq!(matrix, vec![vec![0.0], vec![0.0], vec![0.0]]);
    }
}
