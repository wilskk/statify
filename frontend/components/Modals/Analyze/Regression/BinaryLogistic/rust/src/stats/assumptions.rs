use crate::models::result::{BoxTidwellRow, CorrelationRow, VifRow};
use nalgebra::{DMatrix, DVector};

/// Menghitung VIF (Variance Inflation Factor) dengan OLS
/// VIF_j = 1 / (1 - R_j^2)
pub fn calculate_vif(x: &DMatrix<f64>, feature_names: &[String]) -> Result<Vec<VifRow>, String> {
    let (rows, cols) = x.shape();

    // Minimal 2 variabel untuk mendeteksi multikolinearitas antar variabel
    if cols < 2 {
        return Ok(vec![]);
    }

    let mut results = Vec::new();

    for i in 0..cols {
        // 1. Target (y) adalah kolom ke-i (variabel yang sedang diuji)
        let y_curr = x.column(i).into_owned();

        // 2. Predictors (X) adalah semua kolom SELAIN i, ditambah Intercept
        // Kita perlu menyusun matriks design baru
        let mut predictors_vec = Vec::with_capacity(rows * cols); // (cols-1 + 1 intercept) * rows

        // Tambahkan kolom Intercept (semua bernilai 1.0)
        for _ in 0..rows {
            predictors_vec.push(1.0);
        }

        // Tambahkan kolom predictor lainnya
        for j in 0..cols {
            if i == j {
                continue;
            }
            predictors_vec.extend(x.column(j).iter());
        }

        let x_design = DMatrix::from_vec(rows, cols, predictors_vec);

        // 3. Hitung OLS: b = (X'X)^-1 X'y
        let xt = x_design.transpose();
        let xtx = &xt * &x_design;

        // Gunakan try_inverse untuk menangani singular matrix (multikolinearitas sempurna)
        let (tolerance, vif) = match xtx.try_inverse() {
            Some(xtx_inv) => {
                let xty = &xt * &y_curr;
                let b = &xtx_inv * &xty;

                // 4. Hitung R Squared
                let y_pred = &x_design * b;
                let y_mean = y_curr.mean();

                let sst: f64 = y_curr.iter().map(|&v| (v - y_mean).powi(2)).sum();
                let sse: f64 = (y_curr - y_pred).iter().map(|&v| v.powi(2)).sum();

                // Hindari pembagian nol jika variansi target 0
                let r_sq = if sst.abs() < 1e-9 {
                    1.0
                } else {
                    1.0 - (sse / sst)
                };

                // Batasi R^2 max 1.0
                let r_sq = r_sq.max(0.0).min(1.0);

                let tol = 1.0 - r_sq;
                let v = if tol < 1e-9 { 1000.0 } else { 1.0 / tol }; // Cap max VIF untuk stabilitas

                (tol, v)
            }
            None => (0.0, 999.9), // Kasus singular matrix
        };

        results.push(VifRow {
            variable: feature_names[i].clone(),
            tolerance,
            vif,
        });
    }

    Ok(results)
}

/// Menghitung Box-Tidwell Test untuk asumsi linearitas logit
/// (Kode Box-Tidwell Anda dipertahankan)
pub fn calculate_box_tidwell(
    x: &DMatrix<f64>,
    _y: &DVector<f64>,
    feature_names: &[String],
) -> Result<Vec<BoxTidwellRow>, String> {
    let (_rows, _cols) = x.shape();
    let mut results = Vec::new();

    // Placeholder Logic: Implementasi penuh Box-Tidwell memerlukan iterasi regresi logistik
    // dengan term interaksi x * ln(x). Di sini kita simpan struktur data saja.
    for (_i, name) in feature_names.iter().enumerate() {
        results.push(BoxTidwellRow {
            variable: name.clone(),
            interaction_term: format!("{} by ln({})", name, name),
            b: 0.0,   // dummy coefficient
            sig: 1.0, // dummy p-value
            is_significant: false,
        });
    }

    Ok(results)
}

/// Menghitung Pearson Correlation Matrix
pub fn calculate_correlation_matrix(
    x: &DMatrix<f64>,
    feature_names: &[String],
) -> Result<Vec<CorrelationRow>, String> {
    let (rows, cols) = x.shape();
    if rows < 2 {
        return Err("Not enough data points".to_string());
    }

    let mut result_rows = Vec::new();

    // 1. Hitung Mean dan Standar Deviasi untuk setiap kolom
    let mut means = Vec::new();
    let mut std_devs = Vec::new();

    for j in 0..cols {
        let col = x.column(j);
        let mean = col.mean();
        let variance = col.iter().map(|&v| (v - mean).powi(2)).sum::<f64>() / ((rows - 1) as f64);
        let std_dev = variance.sqrt();

        means.push(mean);
        std_devs.push(std_dev);
    }

    // 2. Hitung Korelasi (Pairwise)
    for i in 0..cols {
        let mut row_values = Vec::new();

        for j in 0..cols {
            if i == j {
                row_values.push(1.0); // Korelasi dengan diri sendiri = 1
            } else {
                let col_i = x.column(i);
                let col_j = x.column(j);

                let mean_i = means[i];
                let mean_j = means[j];
                let sd_i = std_devs[i];
                let sd_j = std_devs[j];

                // Covariance formula: sum((x - mean_x) * (y - mean_y)) / (n-1)
                let covariance: f64 = col_i
                    .iter()
                    .zip(col_j.iter())
                    .map(|(&val_i, &val_j)| (val_i - mean_i) * (val_j - mean_j))
                    .sum::<f64>()
                    / ((rows - 1) as f64);

                // Correlation formula: Covariance / (SD_x * SD_y)
                let corr = if sd_i.abs() < 1e-9 || sd_j.abs() < 1e-9 {
                    0.0 // Avoid division by zero if variance is 0
                } else {
                    covariance / (sd_i * sd_j)
                };

                // Clamp value to range [-1, 1] to handle precision errors
                row_values.push(corr.max(-1.0).min(1.0));
            }
        }

        result_rows.push(CorrelationRow {
            variable: feature_names[i].clone(),
            values: row_values,
        });
    }

    Ok(result_rows)
}