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
/// 
/// Box-Tidwell test menguji apakah hubungan antara variabel kontinu X dan logit(Y)
/// bersifat linear. Test ini dilakukan dengan menambahkan term X*ln(X) ke model
/// dan menguji signifikansi koefisiennya.
/// 
/// **FULL MODEL APPROACH** (Sesuai teori Box & Tidwell 1962):
/// Model: logit(Y) = β₀ + β₁X₁ + β₂X₂ + ... + βₖXₖ + βᵢₙₜ(Xᵢ*ln(Xᵢ))
/// 
/// Untuk setiap variabel Xᵢ, kita:
/// 1. Fit model dengan SEMUA variabel X + interaction term untuk Xᵢ
/// 2. Uji signifikansi koefisien interaction term
/// 
/// H0: βᵢₙₜ = 0 (hubungan linear untuk variabel Xᵢ)
/// H1: βᵢₙₜ ≠ 0 (hubungan non-linear)
/// 
/// Jika p-value < 0.05, maka asumsi linearitas dilanggar.
/// 
/// CATATAN PENTING:
/// - Variabel dengan nilai <= 0 memerlukan transformasi: tambah 0.001 HANYA untuk nilai <= 0
/// - Variabel biner (hanya 2 nilai unik) akan menghasilkan B ≈ 0, p = 1 (tidak informatif)
/// - Ini konsisten dengan implementasi R
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

    // Loop untuk setiap variabel independen
    for (i, name) in feature_names.iter().enumerate() {
        let col_x = x.column(i);
        
        // Hitung statistik dasar untuk variabel ini
        let x_vals: Vec<f64> = col_x.iter().cloned().collect();
        let x_min = x_vals.iter().cloned().fold(f64::INFINITY, f64::min);
        let x_max = x_vals.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
        
        // Cek apakah variabel memiliki variasi
        if (x_max - x_min).abs() < 1e-10 {
            // Variabel konstan, skip
            results.push(BoxTidwellRow {
                variable: name.clone(),
                interaction_term: format!("{} by ln({})", name, name),
                b: 0.0,
                sig: 1.0,
                is_significant: false,
            });
            continue;
        }
        
        // ================================================================
        // DETEKSI VARIABEL BINER: Jika hanya 2 nilai unik, return 0, 1.0
        // Box-Tidwell tidak informatif untuk variabel biner
        // ================================================================
        let mut unique_vals: Vec<f64> = x_vals.clone();
        unique_vals.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        unique_vals.dedup_by(|a, b| (*a - *b).abs() < 1e-9);
        
        if unique_vals.len() <= 2 {
            // Variabel biner atau hampir biner - tidak informatif untuk Box-Tidwell
            results.push(BoxTidwellRow {
                variable: name.clone(),
                interaction_term: format!("{} by ln({})", name, name),
                b: 0.0,
                sig: 1.0,
                is_significant: false,
            });
            continue;
        }
        
        // ================================================================
        // KONSISTEN DENGAN R: Offset 0.001 HANYA untuk nilai <= 0
        // ================================================================
        // Untuk nilai > 0: gunakan nilai asli
        // Untuk nilai <= 0: tambah 0.001 (untuk menghindari log(0))
        let mut interaction_vec = Vec::with_capacity(rows);
        for &val in col_x.iter() {
            if val <= 0.0 {
                let x_safe = val + 0.001;
                interaction_vec.push(x_safe * x_safe.ln());
            } else {
                interaction_vec.push(val * val.ln());
            }
        }
        let interaction_col = DVector::from_vec(interaction_vec);
        
        // ================================================================
        // FULL MODEL: [Intercept, X₁, X₂, ..., Xₖ, interaction_term]
        // ================================================================
        // Total kolom = 1 (intercept) + cols (semua variabel) + 1 (interaction)
        let total_cols = 1 + cols + 1;
        let mut x_design = DMatrix::zeros(rows, total_cols);
        
        // Kolom 0: Intercept
        for r in 0..rows {
            x_design[(r, 0)] = 1.0;
        }
        
        // Kolom 1 sampai cols: Semua variabel X (original, tanpa shift)
        for j in 0..cols {
            for r in 0..rows {
                x_design[(r, 1 + j)] = x[(r, j)];
            }
        }
        
        // Kolom terakhir: Interaction term X*ln(X) untuk variabel ke-i
        for r in 0..rows {
            x_design[(r, total_cols - 1)] = interaction_col[r];
        }
        
        // Fit model logistik dan uji signifikansi koefisien interaksi
        match fit_logit_box_tidwell(&x_design, y) {
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
            Err(_e) => {
                // Jika gagal konvergen atau ada masalah numerik
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

/// Helper Privat: Melakukan regresi logistik untuk Box-Tidwell test
/// Mengembalikan koefisien dan p-value untuk term interaksi (kolom terakhir)
/// 
/// Model: logit(Y) = β₀ + β₁X + β₂(X*ln(X))
/// Kita menguji H0: β₂ = 0
fn fit_logit_box_tidwell(
    x_design: &DMatrix<f64>,
    y: &DVector<f64>,
) -> Result<(f64, f64), String> {
    let rows = x_design.nrows();
    let total_cols = x_design.ncols();
    
    // Index untuk koefisien interaksi (kolom terakhir)
    let interaction_idx = total_cols - 1;

    // Newton-Raphson / IRLS
    let mut beta = DVector::zeros(total_cols);
    let max_iter = 25;
    let tolerance = 1e-6;
    
    // Clamping untuk mencegah overflow/underflow
    let prob_min = 1e-10;
    let prob_max = 1.0 - 1e-10;

    for iter in 0..max_iter {
        // Linear predictor: η = Xβ
        let linear_pred = x_design * &beta;
        
        // Probabilities: π = 1 / (1 + exp(-η))
        let pi: DVector<f64> = linear_pred.map(|val| {
            let p = 1.0 / (1.0 + (-val).exp());
            p.max(prob_min).min(prob_max)
        });

        // Weights: W = π(1-π)
        let w_diag: DVector<f64> = pi.map(|p| {
            let w = p * (1.0 - p);
            w.max(1e-10)  // Prevent zero weights
        });
        
        // Residuals: y - π
        let residuals = y - &pi;
        
        // Gradient (Score): X'(y - π)
        let gradient = x_design.transpose() * &residuals;

        // Hessian (Information Matrix): X'WX
        let mut hessian = DMatrix::zeros(total_cols, total_cols);
        for r in 0..total_cols {
            for c in r..total_cols {
                let mut sum = 0.0;
                for i in 0..rows {
                    sum += x_design[(i, r)] * x_design[(i, c)] * w_diag[i];
                }
                hessian[(r, c)] = sum;
                if r != c {
                    hessian[(c, r)] = sum;
                }
            }
        }
        
        // Add small ridge for numerical stability
        for j in 0..total_cols {
            hessian[(j, j)] += 1e-8;
        }

        // Solve for step: (X'WX)^{-1} X'(y-π)
        match hessian.clone().try_inverse() {
            Some(inv_hessian) => {
                let step = &inv_hessian * &gradient;
                
                // Update beta
                beta = &beta + &step;

                // Check convergence
                let max_step = step.iter().map(|v| v.abs()).fold(0.0f64, f64::max);
                
                if max_step < tolerance || iter == max_iter - 1 {
                    // Ekstrak koefisien dan SE untuk term interaksi
                    let coeff = beta[interaction_idx];
                    let variance = inv_hessian[(interaction_idx, interaction_idx)];
                    
                    if variance <= 0.0 {
                        return Err("Negative variance for interaction term".into());
                    }
                    
                    let se = variance.sqrt();
                    
                    // Wald test: z = β / SE(β)
                    let z_score = if se > 1e-9 { coeff / se } else { 0.0 };
                    
                    // Two-tailed p-value
                    let p_value = calculate_p_value_from_z(z_score);

                    return Ok((coeff, p_value));
                }
            }
            None => {
                // Try pseudo-inverse or return error
                return Err("Singular Hessian matrix".into());
            }
        }
    }

    Err("Did not converge after max iterations".into())
}

/// Legacy function for backward compatibility
fn fit_logit_interaction(
    x_base: &DMatrix<f64>,
    y: &DVector<f64>,
    interaction_col: &DVector<f64>,
) -> Result<(f64, f64), String> {
    let rows = x_base.nrows();
    let base_cols = x_base.ncols();
    let total_cols = base_cols + 1;

    let x_interaction = DMatrix::from_iterator(rows, 1, interaction_col.iter().cloned());

    // Gabungkan matriks: [x_base | x_interaction]
    let mut x_augmented = DMatrix::zeros(rows, total_cols);
    for c in 0..base_cols {
        x_augmented.set_column(c, &x_base.column(c));
    }
    x_augmented.set_column(base_cols, &x_interaction.column(0));

    fit_logit_box_tidwell(&x_augmented, y)
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
