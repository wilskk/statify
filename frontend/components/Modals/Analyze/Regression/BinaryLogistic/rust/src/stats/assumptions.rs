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
/// - Variabel biner/kategorik (≤ 2 nilai unik) di-SKIP karena Box-Tidwell tidak berlaku
/// - Variabel dengan sedikit nilai unik (3-4) di-SKIP karena kemungkinan kategorik/ordinal
/// - Variabel dengan nilai ≤ 0 ditangani dengan UNIFORM SHIFT: X_shifted = X - min(X) + 1
///   Shift seragam ke SEMUA nilai menjaga urutan relatif & menghindari log(0)
/// - Variabel konstan di-SKIP
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
        
        // ================================================================
        // KASUS 1: Variabel konstan (tidak ada variasi) → Skip
        // ================================================================
        if (x_max - x_min).abs() < 1e-10 {
            results.push(BoxTidwellRow {
                variable: name.clone(),
                interaction_term: format!("{} by ln({})", name, name),
                b: 0.0,
                sig: 1.0,
                is_significant: false,
                skipped: true,
                skip_reason: "Constant variable (no variation)".to_string(),
                note: String::new(),
            });
            continue;
        }
        
        // Hitung unique values
        let mut unique_vals: Vec<f64> = x_vals.clone();
        unique_vals.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        unique_vals.dedup_by(|a, b| (*a - *b).abs() < 1e-9);
        let n_unique = unique_vals.len();
        
        // ================================================================
        // KASUS 2: Variabel biner (≤ 2 nilai unik) → Skip
        // Box-Tidwell TIDAK berlaku untuk variabel biner/dikotomi.
        // X*ln(X) pada variabel biner tidak punya interpretasi linearitas.
        // ================================================================
        if n_unique <= 2 {
            results.push(BoxTidwellRow {
                variable: name.clone(),
                interaction_term: format!("{} by ln({})", name, name),
                b: 0.0,
                sig: 1.0,
                is_significant: false,
                skipped: true,
                skip_reason: "Binary variable — Box-Tidwell test is not applicable for dichotomous variables. The test only applies to continuous predictors.".to_string(),
                note: String::new(),
            });
            continue;
        }
        
        // ================================================================
        // KASUS 3: Variabel dengan sedikit nilai unik (3–4) → Skip
        // Kemungkinan besar variabel ordinal/kategorik yang dibiarkan numerik.
        // Box-Tidwell secara teori hanya untuk kontinu, dan X*ln(X) pada 
        // variabel diskrit dengan sangat sedikit level bisa misleading.
        // ================================================================
        if n_unique <= 4 {
            results.push(BoxTidwellRow {
                variable: name.clone(),
                interaction_term: format!("{} by ln({})", name, name),
                b: 0.0,
                sig: 1.0,
                is_significant: false,
                skipped: true,
                skip_reason: format!(
                    "Only {} unique values detected — likely a categorical/ordinal variable. Box-Tidwell test only applies to continuous predictors.",
                    n_unique
                ),
                note: String::new(),
            });
            continue;
        }
        
        // ================================================================
        // KASUS 4: Variabel kontinu — jalankan Box-Tidwell
        // ================================================================
        
        // --- Handling Nilai ≤ 0: Uniform Shift ---
        // Jika ada nilai ≤ 0, kita terapkan shift seragam ke SEMUA nilai:
        //   X_shifted = X - min(X) + 1
        // Ini menjaga urutan relatif data dan memastikan semua X_shifted ≥ 1,
        // sehingga ln(X_shifted) terdefinisi dengan baik.
        // Kita menggunakan shift = 1 (bukan 0.001) agar ln(X_shifted) bernilai
        // reasonable (minimal ln(1) = 0) dan tidak membuat interaction term
        // mendekati konstan.
        
        let has_non_positive = x_min <= 0.0;
        let shift = if has_non_positive { -x_min + 1.0 } else { 0.0 };
        let note_text = if has_non_positive {
            format!(
                "Variable contains values ≤ 0 (min={:.3}). A uniform shift of {:.3} was applied to all values (X' = X + {:.3}) before computing X'·ln(X'). This preserves relative ordering.",
                x_min, shift, shift
            )
        } else {
            String::new()
        };
        
        // Hitung interaction term: (X + shift) * ln(X + shift)
        let mut interaction_vec = Vec::with_capacity(rows);
        for &val in col_x.iter() {
            let x_shifted = val + shift;
            // Setelah shift, semua x_shifted >= 1.0 (jika has_non_positive)
            // atau x_shifted > 0 (jika semua asli positif).
            // Safety clamp terhadap floating point edge cases.
            let x_safe = x_shifted.max(1e-10);
            interaction_vec.push(x_safe * x_safe.ln());
        }
        let interaction_col = DVector::from_vec(interaction_vec.clone());
        
        // --- Cek variasi interaction term ---
        // Jika interaction term hampir konstan (misal semua nol), 
        // model augmented akan singular.
        let int_min = interaction_vec.iter().cloned().fold(f64::INFINITY, f64::min);
        let int_max = interaction_vec.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
        if (int_max - int_min).abs() < 1e-10 {
            results.push(BoxTidwellRow {
                variable: name.clone(),
                interaction_term: format!("{} by ln({})", name, name),
                b: 0.0,
                sig: 1.0,
                is_significant: false,
                skipped: true,
                skip_reason: "Interaction term X·ln(X) has no variation after transformation. Test cannot be computed.".to_string(),
                note: note_text,
            });
            continue;
        }
        
        // --- Cek kolinieritas antara X dan X*ln(X) ---
        // Jika korelasi hampir sempurna (|r| > 0.999), model augmented
        // akan nearly singular dan hasil tidak reliable.
        let corr = pearson_correlation(&x_vals, &interaction_vec);
        if corr.abs() > 0.999 {
            results.push(BoxTidwellRow {
                variable: name.clone(),
                interaction_term: format!("{} by ln({})", name, name),
                b: 0.0,
                sig: 1.0,
                is_significant: false,
                skipped: true,
                skip_reason: format!(
                    "Near-perfect collinearity (r={:.4}) between X and X·ln(X). The augmented model is numerically unstable. This typically happens when the variable range is very narrow.",
                    corr
                ),
                note: note_text,
            });
            continue;
        }
        
        // ================================================================
        // FULL MODEL: [Intercept, X₁, X₂, ..., Xₖ, interaction_term]
        // ================================================================
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
        
        // Kolom terakhir: Interaction term (X+shift)*ln(X+shift) untuk variabel ke-i
        for r in 0..rows {
            x_design[(r, total_cols - 1)] = interaction_col[r];
        }
        
        // Fit model logistik dan uji signifikansi koefisien interaksi
        match fit_logit_box_tidwell(&x_design, y) {
            Ok((coeff, p_value)) => {
                let sig_threshold = 0.05;
                results.push(BoxTidwellRow {
                    variable: name.clone(),
                    interaction_term: if has_non_positive {
                        format!("{} by ln({}+{:.1})", name, name, shift)
                    } else {
                        format!("{} by ln({})", name, name)
                    },
                    b: coeff,
                    sig: p_value,
                    is_significant: p_value < sig_threshold,
                    skipped: false,
                    skip_reason: String::new(),
                    note: note_text,
                });
            }
            Err(e) => {
                // Jika gagal konvergen atau ada masalah numerik — report error, don't hide it
                results.push(BoxTidwellRow {
                    variable: name.clone(),
                    interaction_term: format!("{} by ln({})", name, name),
                    b: 0.0,
                    sig: 1.0,
                    is_significant: false,
                    skipped: true,
                    skip_reason: format!("Computation failed: {}", e),
                    note: note_text,
                });
            }
        }
    }

    Ok(results)
}

/// Pearson correlation antara dua vector
fn pearson_correlation(a: &[f64], b: &[f64]) -> f64 {
    let n = a.len() as f64;
    if n < 2.0 { return 0.0; }
    
    let mean_a: f64 = a.iter().sum::<f64>() / n;
    let mean_b: f64 = b.iter().sum::<f64>() / n;
    
    let mut cov = 0.0;
    let mut var_a = 0.0;
    let mut var_b = 0.0;
    
    for i in 0..a.len() {
        let da = a[i] - mean_a;
        let db = b[i] - mean_b;
        cov += da * db;
        var_a += da * da;
        var_b += db * db;
    }
    
    let denom = (var_a * var_b).sqrt();
    if denom < 1e-15 { 0.0 } else { cov / denom }
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
