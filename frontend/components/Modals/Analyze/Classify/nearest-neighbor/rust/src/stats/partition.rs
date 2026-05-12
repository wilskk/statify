use std::collections::HashMap;

use rand_mt::Mt64;

use crate::models::{
    config::KnnConfig,
    data::{AnalysisData, DataValue},
};

use super::common::split_training_holdout;

pub fn split_training_holdout_by_partition_config(
    data: &AnalysisData,
    config: &KnnConfig,
    processed_case_count: usize,
    processed_case_indices: &[usize],
) -> Result<(Vec<usize>, Vec<usize>), String> {
    if config.partition.use_variable {
        if let Some(ref partition_var) = config.partition.partitioning_variable {
            return split_by_partition_variable(data, partition_var, processed_case_indices);
        }

        return Ok(split_training_holdout_randomly(
            config,
            processed_case_count,
        ));
    }

    if config.partition.use_randomly {
        return Ok(split_training_holdout_randomly(
            config,
            processed_case_count,
        ));
    }

    let indices: Vec<usize> = (0..processed_case_count).collect();
    Ok((indices, Vec::new()))
}

pub fn split_cross_validation_by_partition_config(
    data: &AnalysisData,
    config: &KnnConfig,
    processed_case_indices: &[usize],
) -> Result<Vec<usize>, String> {
    if config.partition.v_fold_use_partitioning_var {
        if let Some(ref fold_var) = config.partition.v_fold_partitioning_variable {
            return split_cross_validation_by_variable(data, fold_var, processed_case_indices);
        }

        return Err("No cross-validation fold variable specified".to_string());
    }

    if config.partition.v_fold_use_randomly {
        return Ok(create_random_folds(
            processed_case_indices.len(),
            config.partition.num_partition,
            config.partition.set_seed,
            config.partition.seed,
        ));
    }

    Ok(create_sequential_folds(processed_case_indices.len(), 10))
}

fn split_training_holdout_randomly(
    config: &KnnConfig,
    processed_case_count: usize,
) -> (Vec<usize>, Vec<usize>) {
    split_training_holdout(
        processed_case_count,
        config.partition.training_number,
        config.partition.set_seed,
        config.partition.seed,
    )
}

fn split_by_partition_variable(
    data: &AnalysisData,
    partition_var: &str,
    processed_case_indices: &[usize],
) -> Result<(Vec<usize>, Vec<usize>), String> {
    let mut training_indices = Vec::new();
    let mut holdout_indices = Vec::new();

    for (processed_idx, &raw_case_idx) in processed_case_indices.iter().enumerate() {
        let value = numeric_partition_value(raw_case_idx, partition_var, data)?;

        if value > 0.0 {
            training_indices.push(processed_idx);
        } else {
            holdout_indices.push(processed_idx);
        }
    }

    if training_indices.is_empty() {
        return Err("No training cases found using partition variable".to_string());
    }

    Ok((training_indices, holdout_indices))
}

fn split_cross_validation_by_variable(
    data: &AnalysisData,
    fold_var: &str,
    processed_case_indices: &[usize],
) -> Result<Vec<usize>, String> {
    let mut raw_fold_values = Vec::with_capacity(processed_case_indices.len());

    for &raw_case_idx in processed_case_indices {
        let value = numeric_partition_value(raw_case_idx, fold_var, data)?;
        if value < 0.0 {
            return Err(format!(
                "Cross-validation fold variable '{}' contains a negative fold value",
                fold_var
            ));
        }

        raw_fold_values.push(value.round() as i64);
    }

    let mut unique_values = raw_fold_values.clone();
    unique_values.sort_unstable();
    unique_values.dedup();

    if unique_values.len() < 2 && processed_case_indices.len() > 1 {
        return Err(format!(
            "Cross-validation fold variable '{}' must contain at least two fold groups",
            fold_var
        ));
    }

    let fold_lookup: HashMap<i64, usize> = unique_values
        .into_iter()
        .enumerate()
        .map(|(fold_idx, raw_value)| (raw_value, fold_idx))
        .collect();

    raw_fold_values
        .into_iter()
        .map(|raw_value| {
            fold_lookup
                .get(&raw_value)
                .copied()
                .ok_or_else(|| format!("Failed to map fold value '{}'", raw_value))
        })
        .collect()
}

fn create_random_folds(
    num_cases: usize,
    requested_num_folds: i32,
    use_seed: bool,
    seed: Option<i64>,
) -> Vec<usize> {
    let mut folds = create_sequential_folds(num_cases, requested_num_folds);

    let mut rng = if use_seed {
        match seed {
            Some(seed) => Mt64::new(seed as u64),
            None => Mt64::new(rand::random::<u64>()),
        }
    } else {
        Mt64::new(rand::random::<u64>())
    };

    for i in (1..folds.len()).rev() {
        let j = (rng.next_u64() % ((i + 1) as u64)) as usize;
        folds.swap(i, j);
    }

    folds
}

fn create_sequential_folds(num_cases: usize, requested_num_folds: i32) -> Vec<usize> {
    if num_cases == 0 {
        return Vec::new();
    }

    let num_folds = requested_num_folds.max(2) as usize;
    let num_folds = num_folds.min(num_cases.max(1));

    (0..num_cases).map(|idx| idx % num_folds).collect()
}

fn numeric_partition_value(case_idx: usize, var: &str, data: &AnalysisData) -> Result<f64, String> {
    match find_partition_value(case_idx, var, data) {
        Some(DataValue::Number(value)) if value.is_finite() => Ok(*value),
        Some(DataValue::Text(value)) => value.trim().parse::<f64>().map_err(|_| {
            format!(
                "Partition variable '{}' contains a non-numeric value at case {}",
                var,
                case_idx + 1
            )
        }),
        Some(_) => Err(format!(
            "Partition variable '{}' contains a non-numeric value at case {}",
            var,
            case_idx + 1
        )),
        None => Err(format!(
            "Partition variable '{}' not found in data at case {}",
            var,
            case_idx + 1
        )),
    }
}

fn find_partition_value<'a>(
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
