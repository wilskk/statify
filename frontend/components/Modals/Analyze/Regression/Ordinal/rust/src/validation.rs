use crate::data::encode_category;
use crate::types::{
    EstimationOptionsPayload, LinkFunction, PlumFitInput, PlumValidationResult, ScaleType,
};
use crate::utils::{correlation, is_finite_non_negative, variance};

pub fn validate_input(input: &PlumFitInput) -> PlumValidationResult {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    if input.payload.procedure != "PLUM" {
        errors.push("payload.procedure harus PLUM".to_string());
    }
    if input.payload.version != "plum-v1" {
        errors.push("payload.version harus plum-v1".to_string());
    }

    let ordered_categories = &input.payload.response.ordered_categories;
    if ordered_categories.len() < 2 {
        errors.push("orderedCategories harus minimal 2".to_string());
    }
    if input.payload.response.category_count != ordered_categories.len() {
        errors.push("categoryCount tidak sesuai orderedCategories".to_string());
    }

    if input.data.is_empty() {
        errors.push("Data kosong".to_string());
    }

    if LinkFunction::try_from(input.payload.model.link_function.as_str()).is_err() {
        errors.push("linkFunction tidak valid".to_string());
    }

    let scale_type = match ScaleType::try_from(input.payload.scale.scale_type.as_str()) {
        Ok(value) => value,
        Err(_) => {
            errors.push("scaleType tidak valid".to_string());
            ScaleType::Unity
        }
    };

    let location_len = input.payload.location.variables.len();
    let scale_len = input.payload.scale.variables.len();

    let mut category_counts = vec![0.0; ordered_categories.len()];
    let mut total_weight = 0.0;

    let mut x_columns: Vec<Vec<f64>> = vec![Vec::new(); location_len];

    for row in &input.data {
        if let Err(err) = encode_category(row.y, ordered_categories) {
            errors.push(err.to_string());
            break;
        }

        if row.x.len() != location_len {
            errors.push("Panjang x tidak sesuai jumlah variabel location".to_string());
            break;
        }

        if scale_type == ScaleType::NonConstant {
            match &row.z {
                Some(values) if values.len() == scale_len => {}
                _ => {
                    errors.push("Panjang z tidak sesuai jumlah variabel scale".to_string());
                    break;
                }
            }
        }

        if let Some(weight) = row.w {
            if !is_finite_non_negative(weight) {
                errors.push("Weight harus numerik dan tidak negatif".to_string());
                break;
            }
        }

        let weight = row.w.unwrap_or(1.0);
        if weight.is_finite() {
            total_weight += weight;
            if let Ok(idx) = encode_category(row.y, ordered_categories) {
                if idx < category_counts.len() {
                    category_counts[idx] += weight;
                }
            }
        }

        for (idx, value) in row.x.iter().enumerate() {
            x_columns[idx].push(*value);
        }
    }

    let default_opts = EstimationOptionsPayload::default();
    let options = input.payload.estimation.as_ref().unwrap_or(&default_opts);
    if let Some(max_iter) = options.max_iterations {
        if max_iter == 0 {
            errors.push("maxIterations harus > 0".to_string());
        }
    }
    if let Some(alpha) = options.alpha {
        if !(0.0..=1.0).contains(&alpha) {
            errors.push("alpha harus antara 0 dan 1".to_string());
        }
    }

    if total_weight < 10.0 {
        warnings.push("Jumlah observasi efektif sangat kecil".to_string());
    }

    for (idx, count) in category_counts.iter().enumerate() {
        if *count <= 0.0 {
            warnings.push(format!("Kategori response {} tidak memiliki observasi", idx + 1));
        }
    }

    for (idx, column) in x_columns.iter().enumerate() {
        if variance(column) < 1e-12 {
            warnings.push(format!("Variabel location {} hampir konstan", idx + 1));
        }
    }

    for i in 0..x_columns.len() {
        for j in (i + 1)..x_columns.len() {
            let corr = correlation(&x_columns[i], &x_columns[j]);
            if corr.abs() > 0.999 {
                warnings.push("Multikolinearitas kuat terdeteksi".to_string());
                break;
            }
        }
    }

    PlumValidationResult {
        valid: errors.is_empty(),
        errors,
        warnings,
    }
}
