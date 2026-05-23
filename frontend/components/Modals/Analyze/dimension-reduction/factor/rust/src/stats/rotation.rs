// perbaikan BISA 

use std::collections::HashMap;
use nalgebra::{DMatrix, SVD};
use crate::models::{
    config::{ExtractionMethod, FactorAnalysisConfig},
    data::AnalysisData,
    result::{
        ComponentTransformationMatrix,
        ExtractionResult,
        RotatedComponentMatrix,
        RotationResult,
    },
};

use super::core::{ calculate_matrix, extract_data_matrix, extract_factors };

// Rotate factors using specified method
pub fn rotate_factors(
    extraction_result: &ExtractionResult,
    config: &FactorAnalysisConfig
) -> Result<RotationResult, String> {
    if config.rotation.none {
        // No rotation, return original loadings
        return Ok(RotationResult {
            rotated_loadings: extraction_result.loadings.clone(),
            transformation_matrix: DMatrix::identity(
                extraction_result.n_factors,
                extraction_result.n_factors
            ),
            factor_correlations: None,
        });
    }

    if config.rotation.varimax {
        rotate_varimax(extraction_result, config)
    } else if config.rotation.quartimax {
        rotate_quartimax(extraction_result, config)
    } else if config.rotation.equimax {
        rotate_equimax(extraction_result, config)
    } else if config.rotation.oblimin {
        rotate_oblimin(extraction_result, config)
    } else if config.rotation.promax {
        rotate_promax(extraction_result, config)
    } else {
        // Default to varimax
        rotate_varimax(extraction_result, config)
    }
}





// Varimax rotation (SPSS-compatible)
pub fn rotate_varimax(
    extraction_result: &ExtractionResult,
    config: &FactorAnalysisConfig
) -> Result<RotationResult, String> {

    let is_pca = matches!(config.extraction.method, ExtractionMethod::PrincipalComponents);

    // COPY data loadings agar bisa kita modifikasi (Pre-processing)
    let mut processed_loadings = extraction_result.loadings.clone();
    let n_rows = processed_loadings.nrows(); 
    let n_cols = processed_loadings.ncols(); 

    // =========================================================
    // 0. PRE-PROCESS: Standardize Unrotated Signs (SPSS Fix)
    // =========================================================
    // SPSS memastikan jumlah loading per kolom pada UNROTATED matrix
    // selalu positif. Jika negatif, balik tandanya.
    // Ini memperbaiki tanda pada "Component Transformation Matrix".
    // =========================================================
    // 0. PRE-PROCESS: Standardize Unrotated Signs (SPSS Fix)
    // =========================================================
    // HAPUS blok `if is_pca {` dan terapkan langsung loop di bawah ini:
    
    for j in 0..n_cols {
        let mut col_sum = 0.0;
        for i in 0..n_rows {
            col_sum += processed_loadings[(i, j)];
        }
        
        if col_sum < 0.0 {
            for i in 0..n_rows {
                processed_loadings[(i, j)] *= -1.0;
            }
        }
    }

    // Gunakan processed_loadings sebagai basis perhitungan selanjutnya
    let loadings = &processed_loadings;

    // =========================================================
    // 1. Kaiser normalization
    // =========================================================
    let mut h = vec![0.0; n_rows];
    let mut normalized_loadings = loadings.clone();

    for i in 0..n_rows {
        let mut ss = 0.0;
        for j in 0..n_cols {
            ss += loadings[(i, j)] * loadings[(i, j)];
        }
        h[i] = ss.sqrt().max(1e-12); // avoid divide by zero
        for j in 0..n_cols {
            normalized_loadings[(i, j)] /= h[i];
        }
    }

    // =========================================================
    // 2. Initialize rotation matrix
    // =========================================================
    let mut transformation_matrix = DMatrix::<f64>::identity(n_cols, n_cols);

    let mut max_iterations = if config.rotation.max_iter > 0 {
        config.rotation.max_iter as usize
    } else {
        25
    };
    if !is_pca {
        // ULS/PAF/ML biasanya butuh sweep lebih banyak untuk dekat dengan solusi SPSS.
        max_iterations = max_iterations.max(300);
    }

    let tol = if is_pca { 1e-5 } else { 1e-7 };
    let criterion_tol = if is_pca { 1e-8 } else { 1e-10 };
    let p = n_rows as f64;

    let compute_varimax_criterion = |lambda: &DMatrix<f64>| -> f64 {
        let mut criterion = 0.0;
        for j in 0..n_cols {
            let mut sum_sq = 0.0;
            let mut sum_four = 0.0;
            for i in 0..n_rows {
                let v = lambda[(i, j)];
                let v2 = v * v;
                sum_sq += v2;
                sum_four += v2 * v2;
            }
            criterion += sum_four - (sum_sq * sum_sq) / p;
        }
        criterion
    };

    let mut previous_criterion = compute_varimax_criterion(&normalized_loadings);

    // =========================================================
    // 3. SPSS-like pairwise varimax (orthomax gamma=1)
    // =========================================================
    for _ in 0..max_iterations {
        let mut max_angle: f64 = 0.0;

        for a in 0..n_cols.saturating_sub(1) {
            for b in (a + 1)..n_cols {
                let mut sum_u = 0.0;
                let mut sum_v = 0.0;
                let mut sum_u2_minus_v2 = 0.0;
                let mut sum_2uv = 0.0;

                for i in 0..n_rows {
                    let x = normalized_loadings[(i, a)];
                    let y = normalized_loadings[(i, b)];
                    let u = x * x - y * y;
                    let v = 2.0 * x * y;

                    sum_u += u;
                    sum_v += v;
                    sum_u2_minus_v2 += u * u - v * v;
                    sum_2uv += 2.0 * u * v;
                }

                let numerator = sum_2uv - (2.0 / p) * sum_u * sum_v;
                let denominator = sum_u2_minus_v2 - (sum_u * sum_u - sum_v * sum_v) / p;
                let phi = 0.25 * numerator.atan2(denominator);
                max_angle = max_angle.max(phi.abs());

                if phi.abs() > tol {
                    let c = phi.cos();
                    let s = phi.sin();

                    for i in 0..n_rows {
                        let xa = normalized_loadings[(i, a)];
                        let xb = normalized_loadings[(i, b)];
                        normalized_loadings[(i, a)] = c * xa + s * xb;
                        normalized_loadings[(i, b)] = -s * xa + c * xb;
                    }

                    for i in 0..n_cols {
                        let ta = transformation_matrix[(i, a)];
                        let tb = transformation_matrix[(i, b)];
                        transformation_matrix[(i, a)] = c * ta + s * tb;
                        transformation_matrix[(i, b)] = -s * ta + c * tb;
                    }
                }
            }
        }

        let current_criterion = compute_varimax_criterion(&normalized_loadings);
        let criterion_change = (current_criterion - previous_criterion).abs();
        previous_criterion = current_criterion;

        if max_angle < tol || criterion_change < criterion_tol {
            break;
        }
    }

    // =========================================================
    // 4. De-normalize rotated loadings
    // =========================================================
    let mut rotated_loadings = normalized_loadings.clone();

    // De-normalize (Kaiser)
    for i in 0..n_rows {
        for j in 0..n_cols {
            rotated_loadings[(i, j)] *= h[i];
        }
    }

    // =========================================================
    // 5. SPSS-style sign reflection (Fix Rotated Columns)
    // =========================================================
    for j in 0..n_cols {
        let mut sum = 0.0;
        for i in 0..n_rows {
            sum += rotated_loadings[(i, j)];
        }
        if sum < 0.0 {
            for i in 0..n_rows {
                rotated_loadings[(i, j)] *= -1.0;
            }
            for i in 0..n_cols {
                transformation_matrix[(i, j)] *= -1.0;
            }
        }
    }

    // =========================================================
    // 6. SORT COMPONENTS BY VARIANCE (SPSS STYLE)
    // =========================================================
    
    // 1. Hitung Variance (SSL) untuk setiap kolom
    let mut col_variances: Vec<(usize, f64)> = (0..n_cols)
        .map(|j| {
            let mut ssl = 0.0;
            for i in 0..n_rows {
                ssl += rotated_loadings[(i, j)].powi(2);
            }
            (j, ssl)
        })
        .collect();

    // 2. Urutkan Descending berdasarkan SSL
    col_variances.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

    // 3. Buat Matrix baru yang sudah terurut
    let mut sorted_loadings = DMatrix::<f64>::zeros(n_rows, n_cols);
    let mut sorted_transform = DMatrix::<f64>::zeros(n_cols, n_cols);

    for (new_col_idx, (old_col_idx, _)) in col_variances.iter().enumerate() {
        // Pindahkan kolom loadings
        for i in 0..n_rows {
            sorted_loadings[(i, new_col_idx)] = rotated_loadings[(i, *old_col_idx)];
        }
        // Pindahkan kolom transformation matrix
        for i in 0..n_cols {
            sorted_transform[(i, new_col_idx)] = transformation_matrix[(i, *old_col_idx)];
        }
    }

    Ok(RotationResult {
        rotated_loadings: sorted_loadings,
        transformation_matrix: sorted_transform,
        factor_correlations: None, // orthogonal
    })
}




pub fn rotate_quartimax(
    extraction_result: &ExtractionResult,
    config: &FactorAnalysisConfig
) -> Result<RotationResult, String> {

    let loadings = &extraction_result.loadings;
    let n_rows = loadings.nrows();
    let n_cols = loadings.ncols();

    // =========================================================
    // 1. Kaiser normalization (SPSS default)
    // =========================================================
    let mut h = vec![0.0; n_rows];
    let mut normalized_loadings = loadings.clone();

    for i in 0..n_rows {
        let mut ss = 0.0;
        for j in 0..n_cols {
            ss += loadings[(i, j)].powi(2);
        }
        h[i] = ss.sqrt().max(1e-12);
        for j in 0..n_cols {
            normalized_loadings[(i, j)] /= h[i];
        }
    }

    // =========================================================
    // 2. Variabel Kontrol Orthomax
    // =========================================================
    // Gunakan 0.0 untuk Quartimax. 
    // Jika Anda butuh Varimax, cukup ubah nilai ini menjadi 1.0!
    let gamma = 0.0_f64; 
    
    let p_f64 = n_rows as f64;
    let max_iterations = config.rotation.max_iter as usize;
    let tol = 1e-6;

    let mut transformation_matrix = DMatrix::<f64>::identity(n_cols, n_cols);
    let mut rotated_normalized = normalized_loadings.clone();

    // =========================================================
    // 3. Algoritma Jacobi Pairwise Rotation (SPSS Standard)
    // =========================================================
    for _ in 0..max_iterations {
        let mut max_angle = 0.0_f64;

        // Putar berpasangan: kolom j dan kolom k
        for j in 0..n_cols {
            for k in (j + 1)..n_cols {
                let mut a = 0.0;
                let mut b = 0.0;
                let mut c = 0.0;
                let mut d = 0.0;

                for i in 0..n_rows {
                    let x = rotated_normalized[(i, j)];
                    let y = rotated_normalized[(i, k)];
                    
                    let u = x.powi(2) - y.powi(2);
                    let v = 2.0 * x * y;

                    a += u;
                    b += v;
                    c += u.powi(2) - v.powi(2);
                    d += 2.0 * u * v;
                }

                let num = d - (2.0 * gamma * a * b) / p_f64;
                let den = c - (gamma * (a.powi(2) - b.powi(2))) / p_f64;
                
                // Hitung sudut rotasi (SPSS menggunakan atan2)
                let phi = num.atan2(den);
                let angle = phi / 4.0;

                max_angle = max_angle.max(angle.abs());

                // Jika sudut rotasi signifikan, terapkan ke matriks
                if angle.abs() > 1e-6 {
                    let cos_t = angle.cos();
                    let sin_t = angle.sin();

                    // Update loading matrix
                    for i in 0..n_rows {
                        let x = rotated_normalized[(i, j)];
                        let y = rotated_normalized[(i, k)];
                        rotated_normalized[(i, j)] = x * cos_t + y * sin_t;
                        rotated_normalized[(i, k)] = -x * sin_t + y * cos_t;
                    }

                    // Update transformation matrix
                    for i in 0..n_cols {
                        let tx = transformation_matrix[(i, j)];
                        let ty = transformation_matrix[(i, k)];
                        transformation_matrix[(i, j)] = tx * cos_t + ty * sin_t;
                        transformation_matrix[(i, k)] = -tx * sin_t + ty * cos_t;
                    }
                }
            }
        }

        // Konvergensi tercapai jika rotasi maksimum sudah sangat kecil
        if max_angle < tol {
            break;
        }
    }

    // =========================================================
    // 4. De-normalize (Kaiser)
    // =========================================================
    let mut rotated_loadings = rotated_normalized;
    for i in 0..n_rows {
        for j in 0..n_cols {
            rotated_loadings[(i, j)] *= h[i];
        }
    }

    // =========================================================
    // 5. SPSS-style sign reflection (Standardisasi Tanda)
    // =========================================================
    for j in 0..n_cols {
        let mut sum = 0.0;
        for i in 0..n_rows {
            sum += rotated_loadings[(i, j)];
        }
        if sum < 0.0 {
            for i in 0..n_rows {
                rotated_loadings[(i, j)] *= -1.0;
            }
            for i in 0..n_cols {
                transformation_matrix[(i, j)] *= -1.0;
            }
        }
    }

    // TIDAK PERLU STEP 6 (Sorting). 
    // Algoritma Jacobi mempertahankan urutan kolom secara alami.

    Ok(RotationResult {
        rotated_loadings,
        transformation_matrix,
        factor_correlations: None,
    })
}




pub fn rotate_equimax(
    extraction_result: &ExtractionResult,
    config: &FactorAnalysisConfig
) -> Result<RotationResult, String> {

    let loadings = &extraction_result.loadings;
    let n_rows = loadings.nrows();
    let n_cols = loadings.ncols();

    // =========================================================
    // 1. Kaiser normalization (SPSS default)
    // =========================================================
    let mut h = vec![0.0; n_rows];
    let mut normalized_loadings = loadings.clone();

    for i in 0..n_rows {
        let mut ss = 0.0;
        for j in 0..n_cols {
            ss += loadings[(i, j)].powi(2);
        }
        h[i] = ss.sqrt().max(1e-12);
        for j in 0..n_cols {
            normalized_loadings[(i, j)] /= h[i];
        }
    }

    // =========================================================
    // 2. Variabel Kontrol Orthomax (Kunci untuk Equamax)
    // =========================================================
    // Equamax menggunakan gamma = (jumlah kolom) / 2
    let gamma = n_cols as f64 / 2.0; 
    
    let p_f64 = n_rows as f64;
    let max_iterations = config.rotation.max_iter as usize;
    let tol = 1e-6;

    let mut transformation_matrix = DMatrix::<f64>::identity(n_cols, n_cols);
    let mut rotated_normalized = normalized_loadings.clone();

    // =========================================================
    // 3. Algoritma Jacobi Pairwise Rotation (SPSS Standard)
    // =========================================================
    for _ in 0..max_iterations {
        let mut max_angle = 0.0_f64;

        // Putar berpasangan: kolom j dan kolom k
        for j in 0..n_cols {
            for k in (j + 1)..n_cols {
                let mut a = 0.0;
                let mut b = 0.0;
                let mut c = 0.0;
                let mut d = 0.0;

                for i in 0..n_rows {
                    let x = rotated_normalized[(i, j)];
                    let y = rotated_normalized[(i, k)];
                    
                    let u = x.powi(2) - y.powi(2);
                    let v = 2.0 * x * y;

                    a += u;
                    b += v;
                    c += u.powi(2) - v.powi(2);
                    d += 2.0 * u * v;
                }

                let num = d - (2.0 * gamma * a * b) / p_f64;
                let den = c - (gamma * (a.powi(2) - b.powi(2))) / p_f64;
                
                let phi = num.atan2(den);
                let angle = phi / 4.0;

                max_angle = max_angle.max(angle.abs());

                if angle.abs() > 1e-6 {
                    let cos_t = angle.cos();
                    let sin_t = angle.sin();

                    // Update loading matrix
                    for i in 0..n_rows {
                        let x = rotated_normalized[(i, j)];
                        let y = rotated_normalized[(i, k)];
                        rotated_normalized[(i, j)] = x * cos_t + y * sin_t;
                        rotated_normalized[(i, k)] = -x * sin_t + y * cos_t;
                    }

                    // Update transformation matrix
                    for i in 0..n_cols {
                        let tx = transformation_matrix[(i, j)];
                        let ty = transformation_matrix[(i, k)];
                        transformation_matrix[(i, j)] = tx * cos_t + ty * sin_t;
                        transformation_matrix[(i, k)] = -tx * sin_t + ty * cos_t;
                    }
                }
            }
        }

        if max_angle < tol {
            break;
        }
    }

    // =========================================================
    // 4. De-normalize (Kaiser)
    // =========================================================
    let mut rotated_loadings = rotated_normalized;
    for i in 0..n_rows {
        for j in 0..n_cols {
            rotated_loadings[(i, j)] *= h[i];
        }
    }

    // =========================================================
    // 5. SPSS-style sign reflection (Standardisasi Tanda)
    // =========================================================
    for j in 0..n_cols {
        let mut sum = 0.0;
        for i in 0..n_rows {
            sum += rotated_loadings[(i, j)];
        }
        if sum < 0.0 {
            for i in 0..n_rows {
                rotated_loadings[(i, j)] *= -1.0;
            }
            for i in 0..n_cols {
                transformation_matrix[(i, j)] *= -1.0;
            }
        }
    }

    Ok(RotationResult {
        rotated_loadings,
        transformation_matrix,
        factor_correlations: None,
    })
}






// PERBAIKAN 2

// =========================================================
// Direct Oblimin Rotation (With Varimax Warm Start)
// =========================================================
pub fn rotate_oblimin(
    extraction_result: &ExtractionResult,
    config: &FactorAnalysisConfig
) -> Result<RotationResult, String> {
    
    // ---------------------------------------------------------
    // STEP 1: VARIMAX WARM START (RAHASIA SPSS MATCHING)
    // ---------------------------------------------------------
    // Kita jalankan Varimax terlebih dahulu untuk mendapatkan posisi awal 
    // yang mendekati solusi optimal. Ini mencegah terjebak di local minima.
    // Pastikan fungsi rotate_varimax sudah benar (karena Anda bilang sudah match SPSS).
    
    let varimax_result = rotate_varimax(extraction_result, config)?;
    let start_t = varimax_result.transformation_matrix; // Kita pakai T dari Varimax

    // Ambil data dasar
    let unrotated_loadings = &extraction_result.loadings;
    let n_rows = unrotated_loadings.nrows();
    let n_cols = unrotated_loadings.ncols();
    
    // Parameter Gamma/Delta (SPSS Default delta=0)
    let gamma = config.rotation.delta; 

    // ---------------------------------------------------------
    // STEP 2: KAISER NORMALIZATION
    // ---------------------------------------------------------
    let mut h = vec![0.0; n_rows];
    let mut a_mat = unrotated_loadings.clone(); // A = Normalized Loadings
    
    for i in 0..n_rows {
        let mut ss = 0.0;
        for j in 0..n_cols {
            ss += unrotated_loadings[(i, j)].powi(2);
        }
        h[i] = ss.sqrt().max(1e-12); 
        for j in 0..n_cols {
            a_mat[(i, j)] /= h[i];
        }
    }

    // ---------------------------------------------------------
    // STEP 3: INITIALIZATION (MENGGUNAKAN HASIL VARIMAX)
    // ---------------------------------------------------------
    // Disini perbedaannya. Jangan mulai dari Identity.
    // Mulai dari Varimax T.
    let mut t_mat = start_t; 

    // Setup Iterasi
    let max_iter = config.rotation.max_iter as usize;
    let tol = 1e-5;
    let mut alpha = 1.0; // Initial step size

    // ---------------------------------------------------------
    // STEP 4: OBLIMIN GRADIENT OPTIMIZATION
    // ---------------------------------------------------------
    
    // Pre-allocate matrix N untuk Oblimin weight
    // N_jm = 1 (j!=m), 0 (j=m) minus gamma/p
    let mut n_matrix = DMatrix::<f64>::zeros(n_cols, n_cols);
    for j in 0..n_cols {
        for m in 0..n_cols {
            if j != m { n_matrix[(j, m)] = 1.0; }
            n_matrix[(j, m)] -= gamma / n_rows as f64;
        }
    }

    let mut current_obj = oblimin_criterion_gpa(&(&a_mat * &t_mat), &n_matrix);

    for _iter in 0..max_iter {
        // L = A * T
        let l_mat = &a_mat * &t_mat;

        // --- Gradient Calculation (Standard GPA) ---
        // Rumus Gradient Oblimin Standard (sesuai GPArotation R package / Jennrich)
        // dQ = L * (L^2 . N)
        // G  = A' * dQ
        
        let mut l_sq = DMatrix::<f64>::zeros(n_rows, n_cols);
        for i in 0..n_rows {
            for j in 0..n_cols { l_sq[(i, j)] = l_mat[(i, j)].powi(2); }
        }
        
        // Element-wise multiplication implicit in calculation logic
        // Gradient Matrix Q
        let l2_n = &l_sq * &n_matrix;
        let mut dq = DMatrix::<f64>::zeros(n_rows, n_cols);
        for i in 0..n_rows {
            for j in 0..n_cols {
                dq[(i, j)] = l_mat[(i, j)] * l2_n[(i, j)];
            }
        }
        
        // Gradient G
        let g_mat = a_mat.transpose() * &dq;

        // --- Gradient Projection ---
        // P = G - T * diag(inv(T) * G)
        // Untuk Oblique rotation, kita proyeksikan gradient agar T tetap valid
        let t_inv = t_mat.clone().try_inverse().unwrap_or_else(|| DMatrix::identity(n_cols, n_cols));
        let x_mat = &t_inv * &g_mat; 
        
        let mut x_diag = DMatrix::<f64>::zeros(n_cols, n_cols);
        for i in 0..n_cols { x_diag[(i, i)] = x_mat[(i, i)]; }

        let gp = &g_mat - &t_mat * &x_diag;

        // Check Convergence
        let max_grad = gp.iter().map(|x| x.abs()).fold(0.0, f64::max);
        if max_grad < tol { break; }

        // --- Line Search ---
        let mut best_t = t_mat.clone();
        let mut found = false;
        let mut step = alpha;

        for _s in 0..10 {
            let mut t_new = &t_mat - step * &gp;
            
            // Constraint: Kolom T harus memiliki panjang normal di ruang invers
            // diag(inv(T'T)) = 1
            let tt = t_new.transpose() * &t_new;
            if let Some(inv_tt) = tt.try_inverse() {
                 let mut scale_diag = DMatrix::<f64>::zeros(n_cols, n_cols);
                 for k in 0..n_cols {
                     if inv_tt[(k,k)] > 0.0 {
                        scale_diag[(k,k)] = inv_tt[(k,k)].sqrt();
                     } else {
                        scale_diag[(k,k)] = 1.0;
                     }
                 }
                 t_new = t_new * scale_diag;
            }

            let l_new = &a_mat * &t_new;
            let obj_new = oblimin_criterion_gpa(&l_new, &n_matrix);

            if obj_new < current_obj {
                current_obj = obj_new;
                best_t = t_new;
                found = true;
                step *= 1.2; 
                break;
            }
            step *= 0.5;
        }

        t_mat = best_t;
        alpha = step;
        if !found && alpha < 1e-7 { break; }
    }

    // ---------------------------------------------------------
    // STEP 5: DE-NORMALIZATION
    // ---------------------------------------------------------
    let l_final = &a_mat * &t_mat;
    let mut pattern = DMatrix::<f64>::zeros(n_rows, n_cols);
    for i in 0..n_rows {
        for j in 0..n_cols {
            pattern[(i, j)] = l_final[(i, j)] * h[i];
        }
    }

    // ---------------------------------------------------------
    // STEP 6: SIGN REFLECTION (SPSS COMPATIBILITY)
    // ---------------------------------------------------------
    for j in 0..n_cols {
        let mut col_sum = 0.0;
        for i in 0..n_rows {
            // SPSS ULS method usually looks at raw sum or sum of cubes.
            // Kita gunakan raw sum.
            col_sum += pattern[(i, j)];
        }

        if col_sum < 0.0 {
            // Flip Pattern Column
            for i in 0..n_rows { pattern[(i, j)] *= -1.0; }
            // Flip T Column (Agar korelasi ikut terbalik)
            for k in 0..n_cols { t_mat[(k, j)] *= -1.0; }
        }
    }

    // ---------------------------------------------------------
    // STEP 7: CALCULATE PHI & SORTING
    // ---------------------------------------------------------
    let tt = t_mat.transpose() * &t_mat;
    let phi = tt.try_inverse().unwrap_or_else(|| DMatrix::identity(n_cols, n_cols));

    // Sorting by Variance (SSL)
    let mut col_stats: Vec<(usize, f64)> = (0..n_cols)
        .map(|j| {
            let ssl: f64 = (0..n_rows).map(|i| pattern[(i, j)].powi(2)).sum();
            (j, ssl)
        })
        .collect();

    col_stats.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    let new_indices: Vec<usize> = col_stats.iter().map(|x| x.0).collect();

    // Reordering Matrices
    let mut sorted_pattern = DMatrix::<f64>::zeros(n_rows, n_cols);
    let mut sorted_t = DMatrix::<f64>::zeros(n_cols, n_cols);
    
    for (new_idx, &old_idx) in new_indices.iter().enumerate() {
        for i in 0..n_rows { sorted_pattern[(i, new_idx)] = pattern[(i, old_idx)]; }
        for i in 0..n_cols { sorted_t[(i, new_idx)] = t_mat[(i, old_idx)]; }
    }

    // Reorder Correlation Matrix (Symmetric)
    let mut sorted_phi = DMatrix::<f64>::zeros(n_cols, n_cols);
    for (new_row, &old_row) in new_indices.iter().enumerate() {
        for (new_col, &old_col) in new_indices.iter().enumerate() {
            sorted_phi[(new_row, new_col)] = phi[(old_row, old_col)];
        }
    }

    Ok(RotationResult {
        rotated_loadings: sorted_pattern,
        transformation_matrix: sorted_t,
        factor_correlations: Some(sorted_phi),
    })
}

// Helper untuk GPA Oblimin Criterion (Tetap sama, pastikan ada di file)
fn oblimin_criterion_gpa(l_mat: &DMatrix<f64>, n_matrix: &DMatrix<f64>) -> f64 {
    let n_rows = l_mat.nrows();
    let n_cols = l_mat.ncols();
    let mut l_sq = DMatrix::<f64>::zeros(n_rows, n_cols);
    for i in 0..n_rows {
        for j in 0..n_cols {
            l_sq[(i, j)] = l_mat[(i, j)].powi(2);
        }
    }
    let l2_n = &l_sq * n_matrix;
    let mut sum = 0.0;
    for i in 0..n_rows {
        for j in 0..n_cols {
            sum += l_sq[(i, j)] * l2_n[(i, j)];
        }
    }
    sum / 4.0
}






pub fn rotate_promax(
    extraction_result: &ExtractionResult,
    config: &FactorAnalysisConfig
) -> Result<RotationResult, String> {
    
    // 1. Get Varimax Result (Must be strict!)
    let varimax_result = rotate_varimax(extraction_result, config)?;
    let varimax_loadings = &varimax_result.rotated_loadings; // Ini sudah de-normalized
    
    let n_rows = varimax_loadings.nrows();
    let n_cols = varimax_loadings.ncols();
    let kappa = config.rotation.kappa.max(1) as f64; 

    // 2. Re-apply Kaiser Normalization (Konsisten dengan Varimax)
    //    Kita hitung 'h' dari varimax_loadings. Karena rotasi orthogonal,
    //    SS per baris tidak berubah dari data asli.
    let mut h = vec![0.0; n_rows];
    let mut a_norm = varimax_loadings.clone(); 

    for i in 0..n_rows {
        let mut ss = 0.0;
        for j in 0..n_cols {
            ss += varimax_loadings[(i, j)].powi(2);
        }
        h[i] = ss.sqrt().max(1e-12);
        for j in 0..n_cols {
            a_norm[(i, j)] /= h[i];
        }
    }

    // 3. Construct Target Matrix (P)
    //    SPSS: P_ij = |A_ij|^k * sign(A_ij)
    let mut p_mat = DMatrix::<f64>::zeros(n_rows, n_cols);
    for i in 0..n_rows {
        for j in 0..n_cols {
            let val = a_norm[(i, j)];
            p_mat[(i, j)] = val.abs().powf(kappa) * val.signum();
        }
    }

    // 4. Solve for Transformation T:  A * T = P
    //    Kita gunakan SVD Solver untuk stabilitas maksimal pada ULS data.
    let svd = SVD::new(a_norm.clone(), true, true);
    // Menggunakan epsilon kecil untuk threshold singular values
    let mut t_mat = svd.solve(&p_mat, 1e-12).map_err(|_| "SVD Solve failed in Promax")?;

    // 5. Normalize T (Hendrickson-White)
    //    Agar diagonal (Inv(T'T)) bernilai 1.
    let tt = t_mat.transpose() * &t_mat;
    let tt_inv = tt.try_inverse().unwrap_or_else(|| DMatrix::identity(n_cols, n_cols));

    let mut d_diag = DMatrix::<f64>::zeros(n_cols, n_cols);
    for j in 0..n_cols {
        let val = tt_inv[(j, j)];
        d_diag[(j, j)] = if val > 0.0 { val.sqrt() } else { 1.0 };
    }

    // T_final = T * D
    t_mat = &t_mat * &d_diag;

    // 6. Calculate Matrices
    let mut phi = (t_mat.transpose() * &t_mat).try_inverse().unwrap_or_else(|| DMatrix::identity(n_cols, n_cols));
    
    // Force diagonal exactly 1.0
    for i in 0..n_cols { phi[(i, i)] = 1.0; }

    // Pattern = A_norm * T
    let pattern_norm = &a_norm * &t_mat;
    
    // De-normalize Pattern
    let mut pattern = pattern_norm.clone();
    for i in 0..n_rows {
        for j in 0..n_cols {
            pattern[(i, j)] *= h[i];
        }
    }

    // 7. SPSS Sign Reflection
    //    Reflect Pattern -> Reflect T -> Reflect Phi (Row & Col)
    for j in 0..n_cols {
        let mut col_sum = 0.0;
        for i in 0..n_rows { col_sum += pattern[(i, j)]; }

        if col_sum < 0.0 {
            for i in 0..n_rows { pattern[(i, j)] *= -1.0; }
            for i in 0..n_cols { t_mat[(i, j)] *= -1.0; }
            // Flip correlations for this factor
            for k in 0..n_cols {
                if k != j {
                    phi[(j, k)] *= -1.0;
                    phi[(k, j)] *= -1.0;
                }
            }
        }
    }

    // 8. Sorting
    let mut col_stats: Vec<(usize, f64)> = (0..n_cols)
        .map(|j| {
            let ssl = (0..n_rows).map(|i| pattern[(i, j)].powi(2)).sum();
            (j, ssl)
        }).collect();
    
    col_stats.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    let new_indices: Vec<usize> = col_stats.iter().map(|x| x.0).collect();

    let mut sorted_pattern = DMatrix::<f64>::zeros(n_rows, n_cols);
    let mut sorted_t = DMatrix::<f64>::zeros(n_cols, n_cols);
    let mut sorted_phi = DMatrix::<f64>::zeros(n_cols, n_cols);

    for (new_col, &old_col) in new_indices.iter().enumerate() {
        for i in 0..n_rows { sorted_pattern[(i, new_col)] = pattern[(i, old_col)]; }
        for i in 0..n_cols { sorted_t[(i, new_col)] = t_mat[(i, old_col)]; }
        for (new_row, &old_row) in new_indices.iter().enumerate() {
            sorted_phi[(new_row, new_col)] = phi[(old_row, old_col)];
        }
    }

    Ok(RotationResult {
        rotated_loadings: sorted_pattern,
        transformation_matrix: sorted_t,
        factor_correlations: Some(sorted_phi),
    })
}












pub fn calculate_rotated_component_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<RotatedComponentMatrix, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let matrix_type = if config.extraction.covariance { "covariance" } else { "correlation" };
    let base_matrix = calculate_matrix(&data_matrix, matrix_type)?;
    let extraction_result = extract_factors(&base_matrix, config, &var_names)?;
    let rotation_result = rotate_factors(&extraction_result, config)?;

    let mut components = HashMap::new();
    let rotated_loadings = &rotation_result.rotated_loadings;
    let n_rows = rotated_loadings.nrows();
    let n_cols = rotated_loadings.ncols();

    for (i, var_name) in var_names.iter().enumerate() {
        if i < n_rows {
            let mut loadings = Vec::with_capacity(n_cols);

            for j in 0..n_cols {
                loadings.push(rotated_loadings[(i, j)]);
            }

            components.insert(var_name.clone(), loadings);
        }
    }

    Ok(RotatedComponentMatrix {
        components,
        variable_order: var_names,
    })
}

pub fn calculate_component_transformation_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ComponentTransformationMatrix, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let matrix_type = if config.extraction.covariance { "covariance" } else { "correlation" };
    let base_matrix = calculate_matrix(&data_matrix, matrix_type)?;
    let extraction_result = extract_factors(&base_matrix, config, &var_names)?;
    let rotation_result = rotate_factors(&extraction_result, config)?;

    // Create component transformation matrix directly
    let transformation_matrix = &rotation_result.transformation_matrix;
    let n_rows = transformation_matrix.nrows();
    let n_cols = transformation_matrix.ncols();

    let mut components = Vec::with_capacity(n_rows);

    for i in 0..n_rows {
        let mut row = Vec::with_capacity(n_cols);

        for j in 0..n_cols {
            row.push(transformation_matrix[(i, j)]);
        }

        components.push(row);
    }

    Ok(ComponentTransformationMatrix { components })
}

use crate::models::result::{PatternMatrix, StructureMatrix, ComponentCorrelationMatrix};

pub fn calculate_pattern_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<PatternMatrix, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let matrix_type = if config.extraction.covariance { "covariance" } else { "correlation" };
    let base_matrix = calculate_matrix(&data_matrix, matrix_type)?;
    let extraction_result = extract_factors(&base_matrix, config, &var_names)?;
    let rotation_result = rotate_factors(&extraction_result, config)?;

    let mut components = HashMap::new();
    let pattern_loadings = &rotation_result.rotated_loadings;
    let n_rows = pattern_loadings.nrows();
    let n_cols = pattern_loadings.ncols();

    for (i, var_name) in var_names.iter().enumerate() {
        if i < n_rows {
            let mut loadings = Vec::with_capacity(n_cols);

            for j in 0..n_cols {
                loadings.push(pattern_loadings[(i, j)]);
            }

            components.insert(var_name.clone(), loadings);
        }
    }

    Ok(PatternMatrix {
        components,
        variable_order: var_names,
    })
}

pub fn calculate_structure_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<StructureMatrix, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let matrix_type = if config.extraction.covariance { "covariance" } else { "correlation" };
    let base_matrix = calculate_matrix(&data_matrix, matrix_type)?;
    let extraction_result = extract_factors(&base_matrix, config, &var_names)?;
    let rotation_result = rotate_factors(&extraction_result, config)?;

    let pattern_loadings = &rotation_result.rotated_loadings;
    let n_rows = pattern_loadings.nrows();
    let n_cols = pattern_loadings.ncols();

    let mut structure_loadings = pattern_loadings.clone();

    if let Some(factor_correlations) = &rotation_result.factor_correlations {
        structure_loadings = pattern_loadings * factor_correlations;
    }

    let mut components = HashMap::new();

    for (i, var_name) in var_names.iter().enumerate() {
        if i < n_rows {
            let mut loadings = Vec::with_capacity(n_cols);

            for j in 0..n_cols {
                loadings.push(structure_loadings[(i, j)]);
            }

            components.insert(var_name.clone(), loadings);
        }
    }

    Ok(StructureMatrix {
        components,
        variable_order: var_names,
    })
}

pub fn calculate_component_correlation_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ComponentCorrelationMatrix, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let matrix_type = if config.extraction.covariance { "covariance" } else { "correlation" };
    let base_matrix = calculate_matrix(&data_matrix, matrix_type)?;
    let extraction_result = extract_factors(&base_matrix, config, &var_names)?;
    let rotation_result = rotate_factors(&extraction_result, config)?;

    let mut correlations = Vec::new();

    if let Some(factor_corrs) = &rotation_result.factor_correlations {
        let n_cols = factor_corrs.ncols();

        for i in 0..n_cols {
            let mut row = Vec::with_capacity(n_cols);

            for j in 0..n_cols {
                row.push(factor_corrs[(i, j)]);
            }

            correlations.push(row);
        }
    }

    Ok(ComponentCorrelationMatrix {
        correlations,
    })
}
