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
pub fn calculate_box_tidwell(
    x: &DMatrix<f64>,
    y: &DVector<f64>,
    feature_names: &[String],
) -> Result<Vec<BoxTidwellRow>, String> {
    let (rows, cols) = x.shape();

    if rows != y.len() {
        return Err("Dimensi X dan Y tidak sesuai.".to_string());
    }

    let mut results = Vec::new();

    // 1. Siapkan Matrix Base (Intercept + Semua Variabel X Original)
    let mut base_predictors_vec = Vec::with_capacity(rows * (cols + 1));

    // Tambah Intercept column first
    for _ in 0..rows {
        base_predictors_vec.push(1.0);
    }
    // Tambah X original
    for j in 0..cols {
        base_predictors_vec.extend(x.column(j).iter());
    }

    let x_base = DMatrix::from_vec(rows, cols + 1, base_predictors_vec);

    // 2. Loop untuk setiap variabel independen
    for (i, name) in feature_names.iter().enumerate() {
        let col_x = x.column(i);

        // 3. Buat Interaction Term: X * ln(X)
        let mut interaction_vec = Vec::with_capacity(rows);

        // FIX WARNING: Removed 'mut' from is_valid_check
        let is_valid_check = true;

        for &val in col_x.iter() {
            if val <= 0.0 {
                let val_safe = val + 0.001;
                interaction_vec.push(val_safe * val_safe.ln());
            } else {
                interaction_vec.push(val * val.ln());
            }
        }

        if !is_valid_check {
            // Placeholder check
        }

        let interaction_col = DVector::from_vec(interaction_vec);

        // 4. Lakukan Regresi Logistik Sederhana (Internal Solver)
        match fit_logit_interaction(&x_base, y, &interaction_col) {
            Ok((coeff, p_value)) => {
                let sig_threshold = 0.05;
                results.push(BoxTidwellRow {
                    variable: name.clone(),
                    interaction_term: format!("{} by ln({})", name, name),
                    b: coeff,
                    sig: p_value,
                    is_significant: p_value < sig_threshold,
                });
            }
            Err(_) => {
                results.push(BoxTidwellRow {
                    variable: name.clone(),
                    interaction_term: format!("{} by ln({})", name, name),
                    b: 0.0,
                    sig: 1.0,
                    is_significant: false,
                });
            }
        }
    }

    Ok(results)
}

/// Helper Privat: Melakukan regresi logistik cepat menggunakan Newton-Raphson
fn fit_logit_interaction(
    x_base: &DMatrix<f64>,
    y: &DVector<f64>,
    interaction_col: &DVector<f64>,
) -> Result<(f64, f64), String> {
    let rows = x_base.nrows();
    let base_cols = x_base.ncols();
    let total_cols = base_cols + 1;

    // FIX ERROR: Menghapus variabel 'final_data' yang menyebabkan error E0282
    // karena variabel ini tidak pernah digunakan.

    let x_interaction = DMatrix::from_iterator(rows, 1, interaction_col.iter().cloned());

    // Gabungkan matriks: [x_base | x_interaction]
    let mut x_augmented = DMatrix::zeros(rows, total_cols);
    for c in 0..base_cols {
        x_augmented.set_column(c, &x_base.column(c));
    }
    x_augmented.set_column(base_cols, &x_interaction.column(0));

    // Newton-Raphson Init
    let mut beta = DVector::zeros(total_cols);
    let max_iter = 15;
    let tolerance = 1e-5;

    for _ in 0..max_iter {
        let linear_pred = &x_augmented * &beta;
        let pi: DVector<f64> = linear_pred.map(|val| 1.0 / (1.0 + (-val).exp()));

        let w_diag: DVector<f64> = pi.map(|p| p * (1.0 - p));
        let error = y - &pi;
        let gradient = &x_augmented.transpose() * &error;

        let mut hessian = DMatrix::zeros(total_cols, total_cols);
        for r in 0..total_cols {
            for c in r..total_cols {
                let mut sum = 0.0;
                for i in 0..rows {
                    sum += x_augmented[(i, r)] * x_augmented[(i, c)] * w_diag[i];
                }
                hessian[(r, c)] = sum;
                if r != c {
                    hessian[(c, r)] = sum;
                }
            }
        }

        match hessian.try_inverse() {
            Some(inv_hessian) => {
                let step = &inv_hessian * &gradient;
                beta = beta + &step;

                if step.abs().max() < tolerance {
                    let idx = total_cols - 1;
                    let coeff = beta[idx];

                    let variance = inv_hessian[(idx, idx)];
                    if variance < 0.0 {
                        return Err("Negative variance".into());
                    }
                    let se = variance.sqrt();

                    let z_score = if se > 1e-9 { coeff / se } else { 0.0 };
                    let p_value = calculate_p_value_from_z(z_score);

                    return Ok((coeff, p_value));
                }
            }
            None => return Err("Singular Matrix".into()),
        }
    }

    Err("Did not converge".into())
}

fn calculate_p_value_from_z(z: f64) -> f64 {
    let z_abs = z.abs();
    let t = 1.0 / (1.0 + 0.2316419 * z_abs);
    let d = 0.3989422804014337 * (-z_abs * z_abs / 2.0).exp();
    let prob = d
        * t
        * (0.319381530
            + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));

    2.0 * prob
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
