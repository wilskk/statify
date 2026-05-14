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
    let target_defs: Vec<VariableDefinition> = data
        .target_data_defs
        .iter()
        .flat_map(|defs| defs.clone())
        .collect();
    let target_measure = derive_variable_measure(&target_var, &target_defs);

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
    let mut display_matrix = Vec::with_capacity(num_cases);
    let mut target_values = Vec::with_capacity(num_cases);
    let mut case_identifiers = Vec::with_capacity(num_cases);
    let mut case_labels = Vec::with_capacity(num_cases);
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
        .filter(|&case_idx| {
            has_valid_partitioning_values(data, config, case_idx)
                && has_valid_focal_case_identifier_value(data, config, case_idx)
        })
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
        let case_label = extract_case_label(case_idx, case_ident_var, data);

        // Add the case to the data matrix
        data_matrix.push(row.clone());
        display_matrix.push(row);
        target_values.push(target_value);
        case_identifiers.push(case_id);
        case_labels.push(case_label);
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
        display_matrix,
        target_values,
        target_measure,
        case_identifiers,
        case_labels,
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

fn derive_variable_measure(variable: &str, defs: &[VariableDefinition]) -> VariableMeasure {
    defs.iter()
        .find(|def| def.name == variable)
        .map(|def| def.measure.clone())
        .unwrap_or(VariableMeasure::Unknown)
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
                    if is_categorical(measure) =>
                {
                    true
                }
                Some(DataValue::Number(n)) if is_categorical(measure) && n.is_finite() => true,
                Some(DataValue::Number(n)) if !is_categorical(measure) && n.is_finite() => true,
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

            if !is_categorical(measure) {
                continue;
            }

            let category_opt = category_key(find_feature_value(case_idx, var, data));

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

        if *measure == VariableMeasure::Nominal {
            let category = category_key(find_feature_value(case_idx, var, data))?;

            let category_map = category_maps.get(feature_idx)?;
            let category_idx = category_map.get(&category)?;

            for i in 0..category_map.len() {
                row.push(if i == *category_idx { 1.0 } else { 0.0 });
            }
        } else if *measure == VariableMeasure::Ordinal {
            match find_feature_value(case_idx, var, data) {
                Some(DataValue::Number(n)) if n.is_finite() => row.push(*n),
                Some(DataValue::Text(_)) | Some(DataValue::Boolean(_)) => {
                    let category = category_key(find_feature_value(case_idx, var, data))?;
                    let category_map = category_maps.get(feature_idx)?;
                    let category_idx = category_map.get(&category)?;
                    row.push(*category_idx as f64);
                }
                _ => return None,
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

fn category_key(value: Option<&DataValue>) -> Option<String> {
    match value {
        Some(DataValue::Text(text)) if !text.trim().is_empty() => Some(text.clone()),
        Some(DataValue::Boolean(value)) => Some(value.to_string()),
        Some(DataValue::Number(value)) if value.is_finite() => Some(value.to_string()),
        _ => None,
    }
}

fn build_expanded_feature_measures(
    feature_measures: &[VariableMeasure],
    category_maps: &[HashMap<String, usize>],
) -> Vec<VariableMeasure> {
    let mut expanded = Vec::new();

    for (i, measure) in feature_measures.iter().enumerate() {
        if *measure == VariableMeasure::Nominal {
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

        if *measure == VariableMeasure::Nominal {
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
        if *measure == VariableMeasure::Nominal {
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

fn is_categorical(measure: &VariableMeasure) -> bool {
    *measure == VariableMeasure::Nominal || *measure == VariableMeasure::Ordinal
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
                if let Some(id) = dataset[case_idx]
                    .values
                    .get(id_var)
                    .and_then(data_value_to_identifier)
                {
                    return id;
                }
            }
        }

        // Then try target_data
        for dataset in &data.target_data {
            if case_idx < dataset.len() {
                if let Some(id) = dataset[case_idx]
                    .values
                    .get(id_var)
                    .and_then(data_value_to_identifier)
                {
                    return id;
                }
            }
        }

        // Finally try case_data, which is where the frontend sends CaseIdenVar.
        if let Some(case_data) = &data.case_data {
            for dataset in case_data {
                if case_idx < dataset.len() {
                    if let Some(id) = dataset[case_idx]
                        .values
                        .get(id_var)
                        .and_then(data_value_to_identifier)
                    {
                        return id;
                    }
                }
            }
        }
    }

    default_id
}

fn data_value_to_identifier(value: &DataValue) -> Option<i32> {
    match value {
        DataValue::Number(id) if id.is_finite() => Some(*id as i32),
        DataValue::Text(id) => id.trim().parse::<i32>().ok(),
        _ => None,
    }
}

fn data_value_to_numeric_identifier(value: &DataValue) -> Option<i32> {
    match value {
        DataValue::Number(id) if id.is_finite() => Some(*id as i32),
        _ => None,
    }
}

fn has_valid_focal_case_identifier_value(
    data: &AnalysisData,
    config: &KnnConfig,
    case_idx: usize,
) -> bool {
    let Some(focal_var) = &config.main.focal_case_iden_var else {
        return true;
    };

    find_focal_identifier_value(case_idx, focal_var, data)
        .and_then(data_value_to_numeric_identifier)
        .is_some()
}

fn find_focal_identifier_value<'a>(
    case_idx: usize,
    focal_var: &str,
    data: &'a AnalysisData,
) -> Option<&'a DataValue> {
    for dataset in &data.focal_case_data {
        if case_idx < dataset.len() {
            if let Some(value) = dataset[case_idx].values.get(focal_var) {
                return Some(value);
            }
        }
    }

    None
}

fn extract_case_label(
    case_idx: usize,
    case_ident_var: &Option<String>,
    data: &AnalysisData,
) -> String {
    let default_label = (case_idx + 1).to_string();

    let Some(id_var) = case_ident_var else {
        return default_label;
    };

    for dataset in &data.features_data {
        if case_idx < dataset.len() {
            if let Some(label) = dataset[case_idx].values.get(id_var).and_then(data_value_to_label) {
                return label;
            }
        }
    }

    for dataset in &data.target_data {
        if case_idx < dataset.len() {
            if let Some(label) = dataset[case_idx].values.get(id_var).and_then(data_value_to_label) {
                return label;
            }
        }
    }

    if let Some(case_data) = &data.case_data {
        for dataset in case_data {
            if case_idx < dataset.len() {
                if let Some(label) = dataset[case_idx].values.get(id_var).and_then(data_value_to_label) {
                    return label;
                }
            }
        }
    }

    default_label
}

fn data_value_to_label(value: &DataValue) -> Option<String> {
    match value {
        DataValue::Number(value) if value.is_finite() => Some(value.to_string()),
        DataValue::Text(value) if !value.trim().is_empty() => Some(value.clone()),
        DataValue::Boolean(value) => Some(value.to_string()),
        _ => None,
    }
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
                if let Some(case_id) = record
                    .values
                    .get(focal_var)
                    .and_then(data_value_to_numeric_identifier)
                {
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
    use std::collections::HashMap;

    use crate::models::data::{AnalysisData, DataRecord, DataValue, VariableMeasure};

    use super::{
        build_category_maps, collect_valid_case_indices, extract_case_identifier,
        extract_feature_values_one_hot, has_valid_focal_case_identifier_value,
        identify_focal_cases, normalize_non_categorical_features,
    };

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

    #[test]
    fn numeric_categorical_features_are_one_hot_encoded() {
        let data = AnalysisData {
            target_data: Vec::new(),
            features_data: vec![vec![
                record("group", DataValue::Number(1.0)),
                record("group", DataValue::Number(2.0)),
                record("group", DataValue::Number(1.0)),
            ]],
            focal_case_data: Vec::new(),
            case_data: None,
            target_data_defs: Vec::new(),
            features_data_defs: Vec::new(),
            focal_case_data_defs: Vec::new(),
            case_data_defs: None,
        };
        let features = vec!["group".to_string()];
        let measures = vec![VariableMeasure::Nominal];
        let valid_indices = collect_valid_case_indices(&data, &features, &measures, None);
        let category_maps = build_category_maps(&data, &features, &measures, &valid_indices);

        assert_eq!(valid_indices, vec![0, 1, 2]);
        assert_eq!(
            extract_feature_values_one_hot(0, &features, &measures, &category_maps, &data),
            Some(vec![1.0, 0.0])
        );
        assert_eq!(
            extract_feature_values_one_hot(1, &features, &measures, &category_maps, &data),
            Some(vec![0.0, 1.0])
        );
    }

    #[test]
    fn text_ordinal_features_are_encoded_as_ordered_numbers() {
        let data = AnalysisData {
            target_data: Vec::new(),
            features_data: vec![vec![
                record("education", DataValue::Text("SD".to_string())),
                record("education", DataValue::Text("SMP".to_string())),
                record("education", DataValue::Text("SMA".to_string())),
            ]],
            focal_case_data: Vec::new(),
            case_data: None,
            target_data_defs: Vec::new(),
            features_data_defs: Vec::new(),
            focal_case_data_defs: Vec::new(),
            case_data_defs: None,
        };
        let features = vec!["education".to_string()];
        let measures = vec![VariableMeasure::Ordinal];
        let valid_indices = collect_valid_case_indices(&data, &features, &measures, None);
        let category_maps = build_category_maps(&data, &features, &measures, &valid_indices);

        assert_eq!(
            extract_feature_values_one_hot(0, &features, &measures, &category_maps, &data),
            Some(vec![0.0])
        );
        assert_eq!(
            extract_feature_values_one_hot(1, &features, &measures, &category_maps, &data),
            Some(vec![1.0])
        );
        assert_eq!(
            extract_feature_values_one_hot(2, &features, &measures, &category_maps, &data),
            Some(vec![2.0])
        );
    }

    #[test]
    fn numeric_ordinal_features_are_used_directly() {
        let data = AnalysisData {
            target_data: Vec::new(),
            features_data: vec![vec![record("rank", DataValue::Number(3.0))]],
            focal_case_data: Vec::new(),
            case_data: None,
            target_data_defs: Vec::new(),
            features_data_defs: Vec::new(),
            focal_case_data_defs: Vec::new(),
            case_data_defs: None,
        };
        let features = vec!["rank".to_string()];
        let measures = vec![VariableMeasure::Ordinal];
        let valid_indices = collect_valid_case_indices(&data, &features, &measures, None);
        let category_maps = build_category_maps(&data, &features, &measures, &valid_indices);

        assert_eq!(
            extract_feature_values_one_hot(0, &features, &measures, &category_maps, &data),
            Some(vec![3.0])
        );
    }

    #[test]
    fn case_identifier_is_read_from_case_data() {
        let data = AnalysisData {
            target_data: Vec::new(),
            features_data: vec![vec![
                record("feature", DataValue::Number(10.0)),
                record("feature", DataValue::Number(20.0)),
            ]],
            focal_case_data: Vec::new(),
            case_data: Some(vec![vec![
                record("case_id", DataValue::Number(101.0)),
                record("case_id", DataValue::Number(202.0)),
            ]]),
            target_data_defs: Vec::new(),
            features_data_defs: Vec::new(),
            focal_case_data_defs: Vec::new(),
            case_data_defs: None,
        };

        assert_eq!(
            extract_case_identifier(1, &Some("case_id".to_string()), &data),
            202
        );
    }

    #[test]
    fn focal_cases_match_case_identifiers_from_focal_data() {
        let data = AnalysisData {
            target_data: Vec::new(),
            features_data: Vec::new(),
            focal_case_data: vec![vec![
                record("focal_id", DataValue::Number(202.0)),
                record("focal_id", DataValue::Text("303".to_string())),
            ]],
            case_data: None,
            target_data_defs: Vec::new(),
            features_data_defs: Vec::new(),
            focal_case_data_defs: Vec::new(),
            case_data_defs: None,
        };

        assert_eq!(
            identify_focal_cases(&[101, 202, 303], &data, &Some("focal_id".to_string())),
            vec![1]
        );
    }

    #[test]
    fn focal_case_identifier_requires_numeric_values_for_valid_cases() {
        let data = AnalysisData {
            target_data: Vec::new(),
            features_data: Vec::new(),
            focal_case_data: vec![vec![
                record("focal_id", DataValue::Number(101.0)),
                record("focal_id", DataValue::Text("202".to_string())),
                record("focal_id", DataValue::Null),
            ]],
            case_data: None,
            target_data_defs: Vec::new(),
            features_data_defs: Vec::new(),
            focal_case_data_defs: Vec::new(),
            case_data_defs: None,
        };
        let config = crate::models::config::KnnConfig {
            main: crate::models::config::MainConfig {
                target_var: Some("target".to_string()),
                feature_var: Some(vec!["x".to_string()]),
                case_iden_var: None,
                focal_case_iden_var: Some("focal_id".to_string()),
                norm_covar: false,
            },
            neighbors: crate::models::config::NeighborsConfig {
                specify: true,
                auto_selection: false,
                specify_k: 1,
                min_k: None,
                max_k: None,
                metric_eucli: true,
                metric_manhattan: false,
                weight: false,
                predictions_mean: false,
                predictions_median: false,
            },
            features: crate::models::config::FeaturesConfig {
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
            partition: crate::models::config::PartitionConfig {
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
            save: crate::models::config::SaveConfig {
                auto_name: true,
                custom_name: false,
                max_cats_to_save: None,
                has_target_var: false,
                is_cate_target_var: false,
                random_assign_to_partition: false,
                random_assign_to_fold: false,
            },
            output: crate::models::config::OutputConfig {
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
        };

        assert!(has_valid_focal_case_identifier_value(&data, &config, 0));
        assert!(!has_valid_focal_case_identifier_value(&data, &config, 1));
        assert!(!has_valid_focal_case_identifier_value(&data, &config, 2));
    }

    fn record(name: &str, value: DataValue) -> DataRecord {
        let mut values = HashMap::new();
        values.insert(name.to_string(), value);
        DataRecord { values }
    }
}
