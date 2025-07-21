use crate::models::data::{ DataRecord, DataValue };

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
