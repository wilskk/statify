use crate::models::result::{BoxTidwellRow, VifRow};
use nalgebra::{DMatrix, DVector};

/// Menghitung VIF (Variance Inflation Factor)
pub fn calculate_vif(x: &DMatrix<f64>, feature_names: &[String]) -> Result<Vec<VifRow>, String> {
    let (_rows, cols) = x.shape();
    if cols < 2 {
        return Ok(vec![]); // Tidak bisa hitung VIF jika hanya 1 variabel
    }

    let mut results = Vec::new();

    // Placeholder logic untuk VIF
    for (_i, name) in feature_names.iter().enumerate() {
        results.push(VifRow {
            variable: name.clone(),
            tolerance: 1.0, // Nilai dummy
            vif: 1.0,       // Nilai dummy
        });
    }

    Ok(results)
}

/// Menghitung Box-Tidwell Test untuk asumsi linearitas logit
pub fn calculate_box_tidwell(
    x: &DMatrix<f64>,
    _y: &DVector<f64>,
    feature_names: &[String],
) -> Result<Vec<BoxTidwellRow>, String> {
    let (_rows, cols) = x.shape();
    let mut results = Vec::new();

    for (_i, name) in feature_names.iter().enumerate() {
        // PERBAIKAN: Menambahkan field is_significant
        results.push(BoxTidwellRow {
            variable: name.clone(),
            interaction_term: format!("{} by ln({})", name, name),
            b: 0.0,                // dummy coefficient
            sig: 1.0,              // dummy p-value
            is_significant: false, // PERBAIKAN: Field ini sebelumnya hilang
        });
    }

    Ok(results)
}
