use crate::univariate::models::{ data::{ AnalysisData, DataRecord, DataValue } };

/// Mengekstrak nilai numerik dari field bernama dalam record
///
/// Fungsi ini mengkonversi DataValue ke f64 untuk perhitungan statistik
/// Mendukung tipe Number, NumberFloat, dan mengembalikan None untuk tipe lain
pub fn extract_numeric_from_record(record: &DataRecord, field_name: &str) -> Option<f64> {
    record.values.get(field_name).and_then(|value| {
        match value {
            DataValue::Number(n) => Some(*n as f64),
            DataValue::NumberFloat(f) => Some(*f),
            _ => None,
        }
    })
}

/// Menggabungkan semua record dari berbagai sumber data
///
/// Mengumpulkan record dari:
/// - Dependent data (variabel dependen)
/// - Fixed factor data (faktor tetap)
/// - Random factor data (faktor acak, jika ada)
/// - Covariate data (kovariat, jika ada)
///
/// Returns: Vector berisi referensi ke semua DataRecord
pub fn collect_all_records(data: &AnalysisData) -> Vec<&DataRecord> {
    let mut records = Vec::new();

    // Mengumpulkan record dari dependent data
    for set in &data.dependent_data {
        for rec in set {
            records.push(rec);
        }
    }

    // Mengumpulkan record dari fixed factor data
    for set in &data.fix_factor_data {
        for rec in set {
            records.push(rec);
        }
    }

    // Mengumpulkan record dari random factor data (jika ada)
    if let Some(random_sets) = &data.random_factor_data {
        for set in random_sets {
            for rec in set {
                records.push(rec);
            }
        }
    }

    // Mengumpulkan record dari covariate data (jika ada)
    if let Some(cov_sets) = &data.covariate_data {
        for set in cov_sets {
            for rec in set {
                records.push(rec);
            }
        }
    }

    records
}

/// Mengkonversi DataValue ke representasi String
///
/// Fungsi ini menangani semua tipe DataValue dan mengkonversinya ke format string yang sesuai:
/// - Number/NumberFloat: konversi langsung ke string
/// - Text/Boolean: konversi ke string
/// - Date/DateTime/Time: menggunakan format asli
/// - Currency: format dengan 2 desimal
/// - Scientific: format notasi ilmiah
/// - Percentage: format persentase (dikalikan 100)
/// - Null: string "null"
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
///
/// Fungsi ini mencari variabel dalam definisi data dan mengekstrak nilai numeriknya
///
/// Parameters:
/// - data_defs_option: Definisi variabel (optional)
/// - data_records_option: Record data (optional)
/// - variable_name: Nama variabel yang dicari
/// - entity_type: Tipe entitas untuk pesan error
///
/// Returns: Vector nilai numerik atau error jika variabel tidak ditemukan
pub fn get_numeric_values_from_source(
    data_defs_option: Option<&Vec<Vec<crate::univariate::models::data::VariableDefinition>>>,
    data_records_option: Option<&Vec<Vec<DataRecord>>>,
    variable_name: &str,
    entity_type: &str
) -> Result<Vec<f64>, String> {
    let mut values = Vec::new();

    if let Some(data_defs_groups) = data_defs_option {
        // Iterasi melalui setiap grup definisi data
        for (i, def_group) in data_defs_groups.iter().enumerate() {
            // Cek apakah variabel ada dalam grup ini
            if def_group.iter().any(|def| def.name == variable_name) {
                if let Some(data_records_groups) = data_records_option {
                    if let Some(data_records_for_group) = data_records_groups.get(i) {
                        // Ekstrak nilai numerik dari setiap record dalam grup
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
///
/// Wrapper function untuk mengekstrak nilai variabel dependen dari AnalysisData
pub fn get_dependent_values(data: &AnalysisData, dependent: &str) -> Result<Vec<f64>, String> {
    get_numeric_values_from_source(
        Some(&data.dependent_data_defs),
        Some(&data.dependent_data),
        dependent,
        "Dependent variable"
    )
}

/// Mendapatkan nilai fixed factor untuk analisis
///
/// Wrapper function untuk mengekstrak nilai faktor tetap dari AnalysisData
pub fn get_fixed_factor_values(data: &AnalysisData, factor: &str) -> Result<Vec<f64>, String> {
    get_numeric_values_from_source(
        Some(&data.fix_factor_data_defs),
        Some(&data.fix_factor_data),
        factor,
        "Fixed factor"
    )
}

/// Mendapatkan nilai random factor untuk analisis
///
/// Wrapper function untuk mengekstrak nilai faktor acak dari AnalysisData
/// Mengembalikan error jika random factor tidak dikonfigurasi
pub fn get_random_factor_values(data: &AnalysisData, factor: &str) -> Result<Vec<f64>, String> {
    get_numeric_values_from_source(
        data.random_factor_data_defs.as_ref(),
        data.random_factor_data.as_ref(),
        factor,
        "Random factor"
    )
}

/// Mendapatkan nilai kovariat untuk analisis
///
/// Wrapper function untuk mengekstrak nilai kovariat dari AnalysisData
/// Mengembalikan error jika kovariat tidak dikonfigurasi
pub fn get_covariate_values(data: &AnalysisData, covariate: &str) -> Result<Vec<f64>, String> {
    get_numeric_values_from_source(
        data.covariate_data_defs.as_ref(),
        data.covariate_data.as_ref(),
        covariate,
        "Covariate"
    )
}

/// Mendapatkan bobot WLS untuk analisis
///
/// Wrapper function untuk mengekstrak nilai bobot WLS (Weighted Least Squares) dari AnalysisData
/// Mengembalikan error jika WLS tidak dikonfigurasi
pub fn get_wls_weights(data: &AnalysisData, wls_weight: &str) -> Result<Vec<f64>, String> {
    get_numeric_values_from_source(
        data.wls_data_defs.as_ref(),
        data.wls_data.as_ref(),
        wls_weight,
        "WLS weight variable"
    )
}

/// Menerapkan bobot ke nilai (untuk kuadrat terkecil tertimbang)
///
/// Fungsi ini menerapkan bobot WLS ke nilai data untuk analisis kuadrat terkecil tertimbang
///
/// Rumus: nilai_tertimbang = nilai * √(bobot)
///
/// Jika panjang values dan weights tidak sama, mengembalikan values asli tanpa modifikasi
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
