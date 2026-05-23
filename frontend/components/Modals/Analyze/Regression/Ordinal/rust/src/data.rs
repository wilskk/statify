use std::collections::HashMap;

use crate::types::{AggregatedData, Category, PlumError, PlumFitInput, ScaleType, Subpopulation};
use crate::utils::{is_finite_non_negative, EPS};

pub fn aggregate_data(input: &PlumFitInput) -> Result<AggregatedData, PlumError> {
    let ordered_categories = &input.payload.response.ordered_categories;
    let category_count = input.payload.response.category_count;
    if ordered_categories.len() != category_count {
        return Err(PlumError::DataError(
            "categoryCount tidak sesuai orderedCategories".to_string(),
        ));
    }

    let scale_type = ScaleType::try_from(input.payload.scale.scale_type.as_str())?;
    let mut map: HashMap<String, Subpopulation> = HashMap::new();

    let zero_cell_correction = input
        .payload
        .estimation
        .as_ref()
        .and_then(|opt| opt.zero_cell_correction)
        .unwrap_or(0.0)
        .max(0.0);

    for row in &input.data {
        let weight = row.w.unwrap_or(1.0);
        if !is_finite_non_negative(weight) {
            continue;
        }

        let x = row.x.clone();
        let z = match scale_type {
            ScaleType::Unity => Vec::new(),
            ScaleType::NonConstant => row
                .z
                .clone()
                .ok_or_else(|| PlumError::DataError("z tidak tersedia".to_string()))?,
        };

        let category_index = encode_category(row.y, ordered_categories)?;
        if category_index >= category_count {
            return Err(PlumError::DataError("Kategori y di luar rentang".to_string()));
        }

        let key = build_subpopulation_key(&x, &z);
        let entry = map.entry(key).or_insert_with(|| Subpopulation {
            x: x.clone(),
            z: z.clone(),
            counts: vec![0.0; category_count],
            cumulative_counts: Vec::new(),
            marginal_count: 0.0,
        });

        entry.counts[category_index] += weight;
        entry.marginal_count += weight;
    }

    let mut subpopulations = Vec::with_capacity(map.len());
    let mut total_count = 0.0;
    for mut subpop in map.into_values() {
        if zero_cell_correction > 0.0 && subpop.marginal_count > 0.0 {
            for count in &mut subpop.counts {
                if *count <= EPS {
                    *count += zero_cell_correction;
                    subpop.marginal_count += zero_cell_correction;
                }
            }
        }

        subpop.cumulative_counts = cumulative_counts(&subpop.counts);
        total_count += subpop.marginal_count;
        subpopulations.push(subpop);
    }

    if subpopulations.is_empty() {
        return Err(PlumError::DataError("Tidak ada data valid".to_string()));
    }

    Ok(AggregatedData {
        subpopulations,
        total_count,
        category_count,
        ordered_categories: ordered_categories.clone(),
    })
}

pub fn encode_category(y: f64, ordered_categories: &[Category]) -> Result<usize, PlumError> {
    for (idx, cat) in ordered_categories.iter().enumerate() {
        match cat {
            Category::Number(v) => {
                if (y - v).abs() < 1e-9 {
                    return Ok(idx);
                }
            }
            Category::Text(_) => {}
        }
    }

    let y_int = y.round() as i64;
    if (y_int as f64 - y).abs() < 1e-9 {
        let idx = (y_int - 1) as isize;
        if idx >= 0 && (idx as usize) < ordered_categories.len() {
            return Ok(idx as usize);
        }
    }

    Err(PlumError::DataError(
        "Kategori y tidak cocok dengan orderedCategories".to_string(),
    ))
}

pub fn build_subpopulation_key(x: &[f64], z: &[f64]) -> String {
    let mut key = String::new();
    for value in x {
        key.push_str(&format!("{value:.12}|"));
    }
    key.push('#');
    for value in z {
        key.push_str(&format!("{value:.12}|"));
    }
    key
}

pub fn cumulative_counts(counts: &[f64]) -> Vec<f64> {
    let mut cumulative = Vec::with_capacity(counts.len().saturating_sub(1));
    let mut running = 0.0;
    for (idx, count) in counts.iter().enumerate() {
        running += count;
        if idx + 1 < counts.len() {
            cumulative.push(running);
        }
    }
    cumulative
}
