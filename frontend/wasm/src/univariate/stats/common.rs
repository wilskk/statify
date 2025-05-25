use crate::univariate::models::{
    data::{ AnalysisData, DataRecord, DataValue },
    config::UnivariateConfig,
};

/// Mengekstrak nilai numerik dari field bernama dalam record.
pub fn extract_numeric_from_record(record: &DataRecord, field_name: &str) -> Option<f64> {
    record.values.get(field_name).and_then(|value| {
        match value {
            DataValue::Number(n) => Some(*n as f64),
            DataValue::NumberFloat(f) => Some(*f),
            _ => None,
        }
    })
}

/// Mengkonversi DataValue ke representasi String
pub fn data_value_to_string(value: &DataValue) -> String {
    match value {
        DataValue::Number(n) => n.to_string(),
        DataValue::NumberFloat(f) => f.to_string(),
        DataValue::Text(t) => t.clone(),
        DataValue::Boolean(b) => b.to_string(),
        DataValue::Date(d) => d.clone(),
        DataValue::DateTime(dt) => dt.clone(),
        DataValue::Time(t) => t.clone(),
        DataValue::Currency(c) => format!("{:.2}", c),
        DataValue::Scientific(s) => format!("{:e}", s),
        DataValue::Percentage(p) => format!("{}%", p * 100.0),
        DataValue::Null => "null".to_string(),
    }
}

/// Fungsi pembantu untuk mendapatkan nilai numerik dari sumber data tertentu
fn get_numeric_values_from_source(
    data_defs_option: Option<&Vec<Vec<crate::univariate::models::data::VariableDefinition>>>,
    data_records_option: Option<&Vec<Vec<DataRecord>>>,
    variable_name: &str,
    entity_type: &str
) -> Result<Vec<f64>, String> {
    let mut values = Vec::new();
    if let Some(data_defs_groups) = data_defs_option {
        for (i, def_group) in data_defs_groups.iter().enumerate() {
            if def_group.iter().any(|def| def.name == variable_name) {
                if let Some(data_records_groups) = data_records_option {
                    if let Some(data_records_for_group) = data_records_groups.get(i) {
                        for record in data_records_for_group {
                            if let Some(value) = extract_numeric_from_record(record, variable_name) {
                                values.push(value);
                            }
                        }
                    }
                }
                return Ok(values);
            }
        }
    }
    Err(format!("{} '{}' not found in the data", entity_type, variable_name))
}

/// Mendapatkan nilai dependent untuk analisis
pub fn get_dependent_values(data: &AnalysisData, dependent: &str) -> Result<Vec<f64>, String> {
    get_numeric_values_from_source(
        Some(&data.dependent_data_defs),
        Some(&data.dependent_data),
        dependent,
        "Dependent variable"
    )
}

/// Mendapatkan nilai fixed factor untuk analisis
pub fn get_fixed_factor_values(data: &AnalysisData, factor: &str) -> Result<Vec<f64>, String> {
    get_numeric_values_from_source(
        Some(&data.fix_factor_data_defs),
        Some(&data.fix_factor_data),
        factor,
        "Fixed factor"
    )
}

/// Mendapatkan nilai random factor untuk analisis
pub fn get_random_factor_values(data: &AnalysisData, factor: &str) -> Result<Vec<f64>, String> {
    get_numeric_values_from_source(
        data.random_factor_data_defs.as_ref(),
        data.random_factor_data.as_ref(),
        factor,
        "Random factor"
    )
}

/// Mendapatkan nilai kovariat untuk analisis
pub fn get_covariate_values(data: &AnalysisData, covariate: &str) -> Result<Vec<f64>, String> {
    get_numeric_values_from_source(
        data.covariate_data_defs.as_ref(),
        data.covariate_data.as_ref(),
        covariate,
        "Covariate"
    )
}

/// Mendapatkan bobot WLS untuk analisis
pub fn get_wls_weights(data: &AnalysisData, wls_weight: &str) -> Result<Vec<f64>, String> {
    get_numeric_values_from_source(
        data.wls_data_defs.as_ref(),
        data.wls_data.as_ref(),
        wls_weight,
        "WLS weight variable"
    )
}

/// Menerapkan bobot ke nilai (untuk kuadrat terkecil tertimbang)
pub fn apply_weights(values: &[f64], weights: &[f64]) -> Vec<f64> {
    if values.len() != weights.len() {
        return values.to_vec();
    }
    values
        .iter()
        .zip(weights.iter())
        .map(|(v, w)| v * w.sqrt())
        .collect()
}

/// Menerapkan bobot ke analisis jika WLS ditentukan
pub(super) fn apply_wls_to_analysis(
    data: &AnalysisData,
    config: &UnivariateConfig,
    values: &[f64]
) -> Result<Vec<f64>, String> {
    if let Some(wls_weight) = &config.main.wls_weight {
        let weights = get_wls_weights(data, wls_weight)?;
        if weights.len() != values.len() {
            return Err("WLS weights length does not match data length".to_string());
        }
        Ok(apply_weights(values, &weights))
    } else {
        Ok(values.to_vec())
    }
}
