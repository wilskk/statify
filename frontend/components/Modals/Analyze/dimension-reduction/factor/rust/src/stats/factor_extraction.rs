use nalgebra::DMatrix;

use crate::models::{
    config::{ ExtractionMethod, FactorAnalysisConfig },
    result::ExtractionResult,
};

// Extract factors using specified method
pub fn extract_factors(
    matrix: &DMatrix<f64>,
    config: &FactorAnalysisConfig,
    var_names: &[String]
) -> Result<ExtractionResult, String> {
    match config.extraction.method {
        ExtractionMethod::PrincipalComponents =>
            extract_principal_components(matrix, config, var_names),
        ExtractionMethod::UnweightedLeastSquares =>
            extract_unweighted_least_squares(matrix, config, var_names),
        ExtractionMethod::GeneralizedLeastSquares =>
            extract_generalized_least_squares(matrix, config, var_names),
        ExtractionMethod::MaximumLikelihood =>
            extract_maximum_likelihood(matrix, config, var_names),
        ExtractionMethod::PrincipalAxisFactoring =>
            extract_principal_axis_factoring(matrix, config, var_names),
        ExtractionMethod::AlphaFactoring => extract_alpha_factoring(matrix, config, var_names),
        ExtractionMethod::ImageFactoring => extract_image_factoring(matrix, config, var_names),
    }
}

// Principal Components Analysis extraction - Perbaikan untuk menyesuaikan dengan dokumentasi
pub fn extract_principal_components(
    matrix: &DMatrix<f64>,
    config: &FactorAnalysisConfig,
    var_names: &[String]
) -> Result<ExtractionResult, String> {
    let n_vars = matrix.nrows();

    // Perform eigenvalue decomposition
    let eigen = matrix.clone().symmetric_eigen();

    // Sort eigenvalues and eigenvectors in descending order
    let mut indices: Vec<usize> = (0..n_vars).collect();
    indices.sort_by(|&i, &j|
        eigen.eigenvalues[j].partial_cmp(&eigen.eigenvalues[i]).unwrap_or(std::cmp::Ordering::Equal)
    );

    // Extract all eigenvalues for reporting purposes
    let mut eigenvalues = Vec::with_capacity(n_vars);
    let mut eigenvectors = DMatrix::zeros(n_vars, n_vars);

    for i in 0..n_vars {
        eigenvalues.push(eigen.eigenvalues[indices[i]]);
        for j in 0..n_vars {
            eigenvectors[(j, i)] = eigen.eigenvectors[(j, indices[i])];
        }
    }

    // Determine number of factors to retain
    let n_factors = determine_factors_to_retain(&eigenvalues, config);
    // --- DEBUGGING / LOGGING ---
    // Gunakan ini untuk melihat di Console Browser berapa faktor yang coba diambil Statify
    web_sys::console::log_1(&format!("Statify trying to extract: {} factors", n_factors).into());

    if n_factors == 0 {
        return Err("No factors meet the retention criteria".to_string());
    }

    // Calculate loadings matrix (Lambda_m = Omega_m * Gamma_m^(1/2))
    let mut loadings = DMatrix::zeros(n_vars, n_factors);
    for i in 0..n_vars {
        for j in 0..n_factors {
            loadings[(i, j)] = eigenvectors[(i, j)] * eigenvalues[j].sqrt();
        }
    }

    // Calculate communalities (h_i = sum(|gamma_j| * omega_ij^2))
    let mut communalities = vec![0.0; n_vars];
    for i in 0..n_vars {
        for j in 0..n_factors {
            communalities[i] += eigenvalues[j].abs() * eigenvectors[(i, j)].powi(2);
        }
    }

    // Calculate explained variance
    // Untuk correlation matrix: total_variance = jumlah variabel (p)
    // Untuk covariance matrix: total_variance = sum of all eigenvalues
    let total_variance: f64 = if config.extraction.covariance {
        // Covariance matrix: sum of all eigenvalues represents total variance
        eigenvalues.iter().sum()
    } else {
        // Correlation matrix: total variance is number of variables
        n_vars as f64
    };

    let explained_variance: Vec<f64> = eigenvalues
        .iter()
        .take(n_factors)
        .map(|&val| if total_variance > 0.0 { (val / total_variance) * 100.0 } else { 0.0 })
        .collect();

    // Calculate cumulative variance
    let mut cumulative_variance = vec![0.0; n_factors];
    let mut cum_sum = 0.0;
    for (i, &var) in explained_variance.iter().enumerate() {
        cum_sum += var;
        cumulative_variance[i] = cum_sum;
    }

    Ok(ExtractionResult {
        loadings,
        eigenvalues, // Store all eigenvalues for full reporting
        communalities,
        explained_variance,
        cumulative_variance,
        n_factors,
        var_names: var_names.to_vec(),
        has_heywood_case: false,
    })
}








pub fn extract_principal_axis_factoring(
    matrix: &DMatrix<f64>,
    config: &FactorAnalysisConfig,
    var_names: &[String]
) -> Result<ExtractionResult, String> {
    let n_vars = matrix.nrows();
    
    // =========================================================================
    // JALUR 1: ANALYSIS = COVARIANCE (SPSS Logic)
    // =========================================================================
    if config.extraction.covariance {
        
        // 1. Hitung Varians & Standar Deviasi (untuk konversi SMC)
        let mut variances = vec![0.0; n_vars];
        let mut std_devs = vec![0.0; n_vars];
        for i in 0..n_vars {
            variances[i] = matrix[(i, i)];
            if variances[i] <= 0.0 { return Err(format!("Var {} has <= 0 variance", i)); }
            std_devs[i] = variances[i].sqrt();
        }

        // 2. Buat Correlation Matrix SEMENTARA hanya untuk hitung SMC
        let mut temp_corr = DMatrix::zeros(n_vars, n_vars);
        for i in 0..n_vars {
            for j in 0..n_vars {
                temp_corr[(i, j)] = matrix[(i, j)] / (std_devs[i] * std_devs[j]);
            }
        }

        // 3. Hitung Initial Communalities (SMC * Variance)
        let mut communalities = vec![0.0; n_vars];
        
        // FIX ERROR DISINI: Gunakan temp_corr.clone() agar temp_corr asli tidak hilang
        match temp_corr.clone().try_inverse() {
            Some(inv) => {
                for i in 0..n_vars {
                    let r_ii = inv[(i, i)];
                    let smc = if r_ii > 1e-12 { 1.0 - (1.0 / r_ii) } else { 0.0 };
                    let safe_smc = smc.max(0.0).min(0.9999);
                    
                    // Scaling kembali ke unit Covariance
                    communalities[i] = safe_smc * variances[i]; 
                }
            },
            None => {
                // Fallback: Max correlation * Variance
                // temp_corr masih bisa diakses di sini karena di atas pakai clone()
                for i in 0..n_vars {
                    let mut max_r = 0.0;
                    for j in 0..n_vars {
                        if i != j {
                            let r = temp_corr[(i, j)].abs();
                            if r > max_r { max_r = r; }
                        }
                    }
                    communalities[i] = max_r * variances[i];
                }
            }
        }

        // 4. Tentukan Jumlah Faktor (Berdasarkan Eigenvalue Covariance Asli)
        // Gunakan clone() agar matrix asli aman
        let eigen_check = matrix.clone().symmetric_eigen();
        let mut init_evals: Vec<f64> = eigen_check.eigenvalues.iter().cloned().collect();
        init_evals.sort_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));
        let n_factors = determine_factors_to_retain(&init_evals, config);
        
        if n_factors == 0 { return Err("No factors retainable".to_string()); }

        // 5. ITERASI (Langsung pada Covariance Matrix)
        let max_iter = if config.extraction.max_iter > 0 { config.extraction.max_iter as usize } else { 25 };
        let mut final_loadings = DMatrix::zeros(n_vars, n_factors);
        let mut work_matrix = matrix.clone(); 

        for _iter in 0..max_iter {
            // Update diagonal work_matrix
            for i in 0..n_vars {
                work_matrix[(i, i)] = communalities[i];
            }

            // Eigen Decomposition (Work matrix consumed, so clone it)
            let eigen = work_matrix.clone().symmetric_eigen();
            
            let mut indices: Vec<usize> = (0..n_vars).collect();
            indices.sort_by(|&i, &j| 
                eigen.eigenvalues[j].partial_cmp(&eigen.eigenvalues[i]).unwrap_or(std::cmp::Ordering::Equal)
            );

            let sorted_vals: Vec<f64> = indices.iter().map(|&i| eigen.eigenvalues[i]).collect();
            let mut sorted_vecs = DMatrix::zeros(n_vars, n_vars);
            for i in 0..n_vars {
                for j in 0..n_vars {
                    sorted_vecs[(i, j)] = eigen.eigenvectors[(i, indices[j])];
                }
            }

            // Hitung Loadings
            let mut current_loadings = DMatrix::zeros(n_vars, n_factors);
            for i in 0..n_vars {
                for j in 0..n_factors {
                    if sorted_vals[j] > 0.0 {
                        current_loadings[(i, j)] = sorted_vecs[(i, j)] * sorted_vals[j].sqrt();
                    }
                }
            }

            // Hitung Communalities Baru
            let mut new_communalities = vec![0.0; n_vars];
            for i in 0..n_vars {
                let mut sum_sq = 0.0;
                for j in 0..n_factors {
                    sum_sq += current_loadings[(i, j)].powi(2);
                }
                
                // Clamp di bawah Total Variance variabel tersebut
                let limit = variances[i] * 0.9999;
                if sum_sq > limit { sum_sq = limit; }
                new_communalities[i] = sum_sq;
            }

            // Cek Konvergensi
            let mut max_change = 0.0;
            for i in 0..n_vars {
                let denom = if communalities[i].abs() < 1e-10 { 1.0 } else { communalities[i] };
                let change = (new_communalities[i] - communalities[i]).abs() / denom;
                if change > max_change { max_change = change; }
            }

            communalities = new_communalities;
            final_loadings = current_loadings;

            if max_change < 0.001 { break; }
        }

        // 6. Hitung Output Akhir
        let mut extracted_evals = Vec::new();
        let mut explained_pct = Vec::new();
        let total_variance: f64 = matrix.diagonal().sum();

        for j in 0..n_factors {
            let mut col_sq = 0.0;
            for i in 0..n_vars {
                if j < final_loadings.ncols() {
                    col_sq += final_loadings[(i, j)].powi(2);
                }
            }
            extracted_evals.push(col_sq);
            if total_variance > 0.0 {
                explained_pct.push((col_sq / total_variance) * 100.0);
            } else {
                explained_pct.push(0.0);
            }
        }

        let mut cum_sum = 0.0;
        let mut cum_var = Vec::new();
        for &v in &explained_pct {
            cum_sum += v;
            cum_var.push(cum_sum);
        }

        return Ok(ExtractionResult {
            loadings: final_loadings,
            eigenvalues: extracted_evals,
            communalities,
            explained_variance: explained_pct,
            cumulative_variance: cum_var,
            n_factors,
            var_names: var_names.to_vec(),
            has_heywood_case: false,
        });

    } else {
        // =========================================================================
        // JALUR 2: ANALYSIS = CORRELATION (Standard Logic)
        // Ini adalah logika standar jika user TIDAK memilih Covariance
        // =========================================================================
        
        let n_vars = matrix.nrows();
        
        // 1. Initial Communalities (SMC) pada Matrix Input (Correlation)
        let mut communalities = vec![0.0; n_vars];
        match matrix.clone().try_inverse() {
            Some(inv) => {
                for i in 0..n_vars {
                    let r_ii = inv[(i, i)];
                    if r_ii > 1e-12 {
                        communalities[i] = 1.0 - (1.0 / r_ii);
                    } else {
                        communalities[i] = 0.0;
                    }
                    // Clamp standard 0-1 untuk correlation
                    if communalities[i] > 0.9999 { communalities[i] = 0.9999; }
                    if communalities[i] < 0.0 { communalities[i] = 0.0; }
                }
            },
            None => {
                // Fallback Max Corr
                for i in 0..n_vars {
                    let mut max_r = 0.0;
                    for j in 0..n_vars {
                        if i != j {
                            let r = matrix[(i, j)].abs();
                            if r > max_r { max_r = r; }
                        }
                    }
                    communalities[i] = max_r;
                }
            }
        }

        // 2. Determine Factors
        let eigen_check = matrix.clone().symmetric_eigen();
        let mut init_evals: Vec<f64> = eigen_check.eigenvalues.iter().cloned().collect();
        init_evals.sort_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));
        let n_factors = determine_factors_to_retain(&init_evals, config);
        
        if n_factors == 0 { return Err("No factors retainable".to_string()); }

        // 3. Iterasi
        let max_iter = if config.extraction.max_iter > 0 { config.extraction.max_iter as usize } else { 25 };
        let mut final_loadings = DMatrix::zeros(n_vars, n_factors);
        let mut work_matrix = matrix.clone();

        for _iter in 0..max_iter {
            for i in 0..n_vars {
                work_matrix[(i, i)] = communalities[i];
            }

            let eigen = work_matrix.clone().symmetric_eigen();
            
            let mut indices: Vec<usize> = (0..n_vars).collect();
            indices.sort_by(|&i, &j| 
                eigen.eigenvalues[j].partial_cmp(&eigen.eigenvalues[i]).unwrap_or(std::cmp::Ordering::Equal)
            );

            let sorted_vals: Vec<f64> = indices.iter().map(|&i| eigen.eigenvalues[i]).collect();
            let mut sorted_vecs = DMatrix::zeros(n_vars, n_vars);
            for i in 0..n_vars {
                for j in 0..n_vars {
                    sorted_vecs[(i, j)] = eigen.eigenvectors[(i, indices[j])];
                }
            }

            let mut current_loadings = DMatrix::zeros(n_vars, n_factors);
            for i in 0..n_vars {
                for j in 0..n_factors {
                    if sorted_vals[j] > 0.0 {
                        current_loadings[(i, j)] = sorted_vecs[(i, j)] * sorted_vals[j].sqrt();
                    }
                }
            }

            let mut new_communalities = vec![0.0; n_vars];
            for i in 0..n_vars {
                let mut sum_sq = 0.0;
                for j in 0..n_factors {
                    sum_sq += current_loadings[(i, j)].powi(2);
                }
                if sum_sq > 0.9999 { sum_sq = 0.9999; }
                new_communalities[i] = sum_sq;
            }

            let mut max_change = 0.0;
            for i in 0..n_vars {
                let change = (new_communalities[i] - communalities[i]).abs();
                if change > max_change { max_change = change; }
            }

            communalities = new_communalities;
            final_loadings = current_loadings;

            if max_change < 0.001 { break; }
        }

        // 4. Final Output Correlation
        let mut extracted_evals = Vec::new();
        let mut explained_pct = Vec::new();
        let total_variance = n_vars as f64; // Untuk Correlation, total variance = jumlah variabel

        for j in 0..n_factors {
            let mut col_sq = 0.0;
            for i in 0..n_vars {
                if j < final_loadings.ncols() {
                    col_sq += final_loadings[(i, j)].powi(2);
                }
            }
            extracted_evals.push(col_sq);
            if total_variance > 0.0 {
                explained_pct.push((col_sq / total_variance) * 100.0);
            } else {
                explained_pct.push(0.0);
            }
        }

        let mut cum_sum = 0.0;
        let mut cum_var = Vec::new();
        for &v in &explained_pct {
            cum_sum += v;
            cum_var.push(cum_sum);
        }

        return Ok(ExtractionResult {
            loadings: final_loadings,
            eigenvalues: extracted_evals,
            communalities,
            explained_variance: explained_pct,
            cumulative_variance: cum_var,
            n_factors,
            var_names: var_names.to_vec(),
            has_heywood_case: false,
        });
    }
}














// perbaikan bisa 14/01/2026

pub fn determine_factors_to_retain(eigenvalues: &[f64], config: &FactorAnalysisConfig) -> usize {
    // KASUS 1: User memilih "Fixed number of factors"
    // Kita cek apakah flag 'factor' bernilai true DAN user mengisi angka max_factors
    if config.extraction.factor {
        if let Some(max) = config.extraction.max_factors {
            let max_usize = max as usize;
            // Validasi input: harus > 0 dan tidak boleh melebihi jumlah variabel
            if max_usize > 0 && max_usize <= eigenvalues.len() {
                return max_usize;
            }
        }
    }

    // KASUS 2: User memilih "Based on Eigenvalue" (Default SPSS)
    // Atau jika Kasus 1 gagal (misal user pilih fixed tapi tidak isi angka)
    
    // A. Hitung Rata-rata Eigenvalue (Mean Eigenvalue)
    // Ini adalah kunci agar logika "Based on Eigenvalue" bekerja untuk Covariance Matrix
    let total_eigenvalue: f64 = eigenvalues.iter().sum();
    let n_vars = eigenvalues.len() as f64;
    
    // Hindari pembagian dengan nol
    let mean_eigenvalue = if n_vars > 0.0 { 
        total_eigenvalue / n_vars 
    } else { 
        1.0 
    };

    // B. Ambil nilai pengali dari config (Default 1.0 jika user tidak isi)
    let multiplier = if config.extraction.eigen_val <= 0.0 {
        1.0 
    } else {
        config.extraction.eigen_val
    };

    // C. Hitung Threshold (Ambang Batas)
    // Rumus SPSS: Threshold = (Nilai Input User) * (Mean Eigenvalue)
    let threshold = multiplier * mean_eigenvalue;

    // D. Hitung berapa banyak faktor yang nilainya >= Threshold
    let count = eigenvalues
        .iter()
        .take_while(|&&val| val >= threshold)
        .count();

    // Pastikan minimal 1 faktor diambil agar program tidak error
    if count == 0 {
        1
    } else {
        count
    }
}






// Unweighted Least Squares (ULS) - SPSS Compatible
pub fn extract_unweighted_least_squares(
    matrix: &DMatrix<f64>,
    config: &FactorAnalysisConfig,
    var_names: &[String]
) -> Result<ExtractionResult, String> {
    let n_vars = matrix.nrows();

    // 1. Initial Estimates: SMC (SPSS default), fallback ke max |r_ij| jika singular.
    let mut communalities: Vec<f64> = if let Some(inv_corr) = matrix.clone().try_inverse() {
        (0..n_vars)
            .map(|i| {
                let diag_inv = inv_corr[(i, i)];
                if diag_inv > 0.0 {
                    (1.0 - 1.0 / diag_inv).clamp(0.0, 0.9999)
                } else {
                    0.0
                }
            })
            .collect()
    } else {
        let mut fallback = vec![0.0; n_vars];
        for i in 0..n_vars {
            let mut max_r = 0.0;
            for j in 0..n_vars {
                if i != j {
                    let r_ij = matrix[(i, j)].abs();
                    if r_ij > max_r {
                        max_r = r_ij;
                    }
                }
            }
            fallback[i] = max_r;
        }
        fallback
    };

    let r_matrix = matrix.clone();
    
    // Konfigurasi Iterasi
    let max_iterations = if config.extraction.max_iter > 0 {
        config.extraction.max_iter as usize
    } else {
        25
    };
    
    // PENTING: SPSS menggunakan tolerance 0.001 untuk Konvergensi Communalities
    // Jangan terlalu ketat (misal 1e-5) karena pada Heywood Case, data akan berosilasi
    let convergence_criterion = 0.001; 

    for _iter in 0..max_iterations {
        // 2. Reduced Correlation Matrix
        let mut reduced_matrix = r_matrix.clone();
        for i in 0..n_vars {
            reduced_matrix[(i, i)] = communalities[i];
        }

        // 3. Eigen Decomposition
        let eigen = reduced_matrix.symmetric_eigen();

        // Sorting Eigenvalues Descending
        let mut indices: Vec<usize> = (0..n_vars).collect();
        indices.sort_by(|&i, &j|
            eigen.eigenvalues[j]
                .partial_cmp(&eigen.eigenvalues[i])
                .unwrap_or(std::cmp::Ordering::Equal)
        );

        let sorted_eigenvalues: Vec<f64> = indices
            .iter()
            .map(|&i| eigen.eigenvalues[i])
            .collect();

        let mut sorted_eigenvectors = DMatrix::zeros(n_vars, n_vars);
        for i in 0..n_vars {
            for j in 0..n_vars {
                sorted_eigenvectors[(i, j)] = eigen.eigenvectors[(i, indices[j])];
            }
        }

        let positive_eigenvalues: Vec<f64> = sorted_eigenvalues.iter().cloned().map(|x| x.max(0.0)).collect();
        let n_factors = determine_factors_to_retain(&positive_eigenvalues, config);
        
        if n_factors == 0 {
            return Err("No factors meet the retention criteria".to_string());
        }

        // 4. Hitung Communalities Baru berdasarkan Loadings sementara
        let mut new_communalities = vec![0.0; n_vars];
        for i in 0..n_vars {
            let mut sum_sq = 0.0;
            for j in 0..n_factors {
                if sorted_eigenvalues[j] > 0.0 {
                    let loading = sorted_eigenvectors[(i, j)] * sorted_eigenvalues[j].sqrt();
                    sum_sq += loading.powi(2);
                }
            }

            // HEYWOOD CASE HANDLING (SPSS STYLE)
            // SPSS membiarkan iterasi berjalan meski > 1, tapi biasanya ada clamping di 1.0
            // Kita clamp di 0.9999 agar matriks tetap positive definite
            if sum_sq > 0.9999 { 
                sum_sq = 0.9999; 
            }
            // Clamp bawah
            if sum_sq < 0.0 { sum_sq = 0.0; }
            
            new_communalities[i] = sum_sq;
        }

        // 5. Cek Konvergensi
        let mut max_change = 0.0;
        for i in 0..n_vars {
            let change = (new_communalities[i] - communalities[i]).abs();
            if change > max_change {
                max_change = change;
            }
        }

        // Update communalities untuk iterasi berikutnya
        communalities = new_communalities;

        if max_change < convergence_criterion {
            break; // Converged
        }
    }

    // Final eigendecomposition HARUS memakai communalities yang sudah di-update.
    // Ini menghindari selisih kecil karena mengambil solusi dari iterasi sebelum update terakhir.
    let mut final_reduced_matrix = r_matrix.clone();
    for i in 0..n_vars {
        final_reduced_matrix[(i, i)] = communalities[i];
    }

    let final_eigen = final_reduced_matrix.symmetric_eigen();
    let mut final_indices: Vec<usize> = (0..n_vars).collect();
    final_indices.sort_by(|&i, &j| {
        final_eigen.eigenvalues[j]
            .partial_cmp(&final_eigen.eigenvalues[i])
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    let final_sorted_evals: Vec<f64> = final_indices
        .iter()
        .map(|&i| final_eigen.eigenvalues[i])
        .collect();

    let mut final_sorted_evecs = DMatrix::zeros(n_vars, n_vars);
    for i in 0..n_vars {
        for j in 0..n_vars {
            final_sorted_evecs[(i, j)] = final_eigen.eigenvectors[(i, final_indices[j])];
        }
    }

    // Hitung jumlah faktor final di luar loop
    let positive_evals: Vec<f64> = final_sorted_evals.iter().cloned().map(|x| x.max(0.0)).collect();
    let n_factors = determine_factors_to_retain(&positive_evals, config);

    // Panggil helper calculation
    calculate_final_result(
        n_vars, 
        n_factors, 
        &final_sorted_evals, 
        &final_sorted_evecs, 
        // Note: Kita tidak pass 'communalities' dari loop, 
        // tapi membiarkan helper menghitung ulang dari loadings agar konsisten.
        var_names
    )
}

// // Helper function untuk menghitung Loading Akhir dan Communalities Akhir
// fn calculate_final_result(
//     n_vars: usize,
//     n_factors: usize,
//     sorted_eigenvalues: &[f64],
//     sorted_eigenvectors: &DMatrix<f64>,
//     var_names: &[String]
// ) -> Result<ExtractionResult, String> {
    
//     // 1. Hitung Loadings Matrix
//     let mut loadings = DMatrix::zeros(n_vars, n_factors);
//     for i in 0..n_vars {
//         for j in 0..n_factors {
//             if sorted_eigenvalues[j] > 0.0 {
//                 loadings[(i, j)] =
//                     sorted_eigenvectors[(i, j)] * sorted_eigenvalues[j].sqrt();
//             }
//         }
//     }

//     // 2. RECALCULATE COMMUNALITIES FROM FINAL LOADINGS
//     // Ini perbaikan krusial. Jangan gunakan communalities dari hasil iterasi terakhir,
//     // tapi hitung ulang dari loadings final. Ini memastikan "Communalities" = "Sum of Squared Loadings".
//     // Pada kasus Heywood, ini akan menunjukkan nilai asli (misal > 1.0) seperti halnya SPSS
//     // yang kadang menunjukkan .999 atau value aslinya di tabel Extraction.
//     let mut final_communalities = vec![0.0; n_vars];
//     for i in 0..n_vars {
//         let mut sum_sq = 0.0;
//         for j in 0..n_factors {
//             sum_sq += loadings[(i, j)].powi(2);
//         }
//         final_communalities[i] = sum_sq; 
//     }

//     // 3. Explained Variance Calculation
//     // Total variance untuk ULS/Correlation analysis adalah jumlah variabel (Trace of R)
//     let total_variance = n_vars as f64;
    
//     let mut explained_variance = Vec::new();
//     let mut extracted_eigenvalues = Vec::new(); // Ini SSL (Sum of Squared Loadings)

//     for j in 0..n_factors {
//         let mut col_sq = 0.0;
//         for i in 0..n_vars {
//             col_sq += loadings[(i, j)].powi(2);
//         }
//         extracted_eigenvalues.push(col_sq);

//         let pct = if total_variance > 0.0 { 
//             (col_sq / total_variance) * 100.0 
//         } else { 0.0 };
//         explained_variance.push(pct);
//     }

//     let mut cumulative_variance = vec![0.0; n_factors];
//     let mut cum_sum = 0.0;
//     for (i, &var) in explained_variance.iter().enumerate() {
//         cum_sum += var;
//         cumulative_variance[i] = cum_sum;
//     }

//     Ok(ExtractionResult {
//         loadings,
//         eigenvalues: extracted_eigenvalues, // Gunakan SSL column sebagai eigenvalues di output extraction
//         communalities: final_communalities,
//         explained_variance,
//         cumulative_variance,
//         n_factors,
//         var_names: var_names.to_vec(),
//         has_heywood_case: false,
//     })
// }



// Helper function untuk menghitung Loading Akhir dan Communalities Akhir
fn calculate_final_result(
    n_vars: usize,
    n_factors: usize,
    sorted_eigenvalues: &[f64],
    sorted_eigenvectors: &DMatrix<f64>,
    var_names: &[String]
) -> Result<ExtractionResult, String> {
    
    let mut loadings = DMatrix::zeros(n_vars, n_factors);
    for i in 0..n_vars {
        for j in 0..n_factors {
            if sorted_eigenvalues[j] > 0.0 {
                loadings[(i, j)] =
                    sorted_eigenvectors[(i, j)] * sorted_eigenvalues[j].sqrt();
            }
        }
    }

    // 2. RECALCULATE COMMUNALITIES FROM FINAL LOADINGS (DENGAN CLAMPING)
    let mut final_communalities = vec![0.0; n_vars];
    let mut has_heywood_case = false; // Flag untuk SPSS Warning Footnote

    for i in 0..n_vars {
        let mut sum_sq = 0.0;
        for j in 0..n_factors {
            sum_sq += loadings[(i, j)].powi(2);
        }
        
        // --- HEYWOOD CLAMPING (SPSS FIX) ---
        // Jika melebihi batas, scale down loadings baris ini agar pas 0.999
        if sum_sq >= 0.999 {
            has_heywood_case = true;
            let scale = (0.999 / sum_sq).sqrt();
            for j in 0..n_factors {
                loadings[(i, j)] *= scale;
            }
            sum_sq = 0.999;
        }
        
        final_communalities[i] = sum_sq; 
    }

    // 3. Explained Variance Calculation
    let total_variance = n_vars as f64;
    let mut explained_variance = Vec::new();
    let mut extracted_eigenvalues = Vec::new(); 

    for j in 0..n_factors {
        let mut col_sq = 0.0;
        for i in 0..n_vars {
            col_sq += loadings[(i, j)].powi(2);
        }
        extracted_eigenvalues.push(col_sq);

        let pct = if total_variance > 0.0 { 
            (col_sq / total_variance) * 100.0 
        } else { 0.0 };
        explained_variance.push(pct);
    }

    let mut cumulative_variance = vec![0.0; n_factors];
    let mut cum_sum = 0.0;
    for (i, &var) in explained_variance.iter().enumerate() {
        cum_sum += var;
        cumulative_variance[i] = cum_sum;
    }

    Ok(ExtractionResult {
        loadings,
        eigenvalues: extracted_eigenvalues, 
        communalities: final_communalities,
        explained_variance,
        cumulative_variance,
        n_factors,
        var_names: var_names.to_vec(),
        has_heywood_case, // Teruskan flag ini ke formatter TypeScript!
    })
}
















// Generalized Least Squares extraction - Disempurnakan dengan Coordinate Descent untuk batas Heywood
pub fn extract_generalized_least_squares(
    matrix: &DMatrix<f64>,
    config: &FactorAnalysisConfig,
    var_names: &[String]
) -> Result<ExtractionResult, String> {
    let n_vars = matrix.nrows();

    // 1. Tentukan jumlah faktor (n_factors)
    let initial_eigen = matrix.clone().symmetric_eigen();
    let mut initial_eigvals: Vec<f64> = initial_eigen.eigenvalues.iter().cloned().collect();
    initial_eigvals.sort_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));

    let n_factors = determine_factors_to_retain(&initial_eigvals, config);
    if n_factors == 0 {
        return Err("No factors meet the retention criteria".to_string());
    }

    // 2. Kalkulasi Matriks Bobot GLS W = R^-1
    let w_matrix = match matrix.clone().try_inverse() {
        Some(inv) => inv,
        None => return Err("Correlation matrix is not invertible. GLS requires a positive definite matrix.".to_string()),
    };

    // Matriks H (Perkalian elemen-ke-elemen Hadamard dari W)
    let mut h_matrix = DMatrix::zeros(n_vars, n_vars);
    for i in 0..n_vars {
        for j in 0..n_vars {
            h_matrix[(i, j)] = w_matrix[(i, j)].powi(2);
        }
    }

    // 3. Initial Psi (Unique Variances) = 1 / W_ii
    let mut psi = vec![0.0; n_vars];
    for i in 0..n_vars {
        let r_ii = w_matrix[(i, i)];
        psi[i] = if r_ii > 0.0 { 1.0 / r_ii } else { 0.5 };
        psi[i] = psi[i].clamp(0.001, 0.999);
    }

    let max_iterations = if config.extraction.max_iter > 25 { config.extraction.max_iter as usize } else { 50 };
    let convergence_criterion = 0.001;

    let mut final_loadings = DMatrix::zeros(n_vars, n_factors);
    let mut has_heywood_case = false;

    // 4. Iterasi EM (Expectation-Maximization)
    for _iteration in 0..max_iterations {
        let mut psi_inv_sqrt = DMatrix::zeros(n_vars, n_vars);
        for i in 0..n_vars {
            psi_inv_sqrt[(i, i)] = 1.0 / psi[i].sqrt();
        }

        // Transformasi matriks target
        let weighted_matrix = &psi_inv_sqrt * matrix * &psi_inv_sqrt;
        let eigen = weighted_matrix.symmetric_eigen();

        let mut indices: Vec<usize> = (0..n_vars).collect();
        indices.sort_by(|&i, &j|
            eigen.eigenvalues[j].partial_cmp(&eigen.eigenvalues[i]).unwrap_or(std::cmp::Ordering::Equal)
        );

        let mut loadings = DMatrix::zeros(n_vars, n_factors);
        for j in 0..n_factors {
            let eig_val = eigen.eigenvalues[indices[j]];
            let scale = if eig_val > 1.0 { (eig_val - 1.0).sqrt() } else { 0.0 };
            
            // Standardisasi tanda eigenvector sesuai konvensi iteratif SPSS
            let mut sum_vec = 0.0;
            for i in 0..n_vars {
                sum_vec += eigen.eigenvectors[(i, indices[j])];
            }
            let sign = if sum_vec < 0.0 { -1.0 } else { 1.0 };

            for i in 0..n_vars {
                loadings[(i, j)] = psi[i].sqrt() * eigen.eigenvectors[(i, indices[j])] * sign * scale;
            }
        }

        // Kalkulasi vektor gradien objektif GLS
        let w_loadings = &w_matrix * &loadings;
        let mut d_vec = vec![0.0; n_vars];
        for i in 0..n_vars {
            let mut sum_sq = 0.0;
            for j in 0..n_factors {
                sum_sq += w_loadings[(i, j)].powi(2);
            }
            d_vec[i] = w_matrix[(i, i)] - sum_sq;
        }

        // === PENGGANTI PENTING: Solusi Sub-problem Coordinate Descent ===
        // Memastikan batasan Heywood terpenuhi dan dialokasikan ulang persis seperti SPSS
        let mut new_psi = psi.clone();
        for _cd_iter in 0..100 {
            let mut max_cd_change = 0.0;
            for i in 0..n_vars {
                let mut sum_h_psi = 0.0;
                for j in 0..n_vars {
                    if i != j {
                        sum_h_psi += h_matrix[(i, j)] * new_psi[j];
                    }
                }
                
                // Rumus iterasi tunggal terhadap matriks Hessian
                let unconstrained = (d_vec[i] - sum_h_psi) / h_matrix[(i, i)];
                
                // Paksa batas minimal 0.001 (Ekivalen dengan max communality 0.999)
                let constrained = unconstrained.clamp(0.001, 0.999);
                
                let diff = (constrained - new_psi[i]).abs();
                if diff > max_cd_change {
                    max_cd_change = diff;
                }
                new_psi[i] = constrained;
            }
            if max_cd_change < 1e-6 { // Konvergensi sub-problem
                break;
            }
        }

        let mut max_change = 0.0;
        has_heywood_case = false;

        for i in 0..n_vars {
            let change = (new_psi[i] - psi[i]).abs();
            if change > max_change {
                max_change = change;
            }
            psi[i] = new_psi[i];
            
            // Tandai jika ada nilai varians terikat erat (communality >= 0.999)
            if psi[i] <= 0.0011 {
                has_heywood_case = true;
            }
        }

        final_loadings = loadings;

        if max_change < convergence_criterion {
            break;
        }
    }

    // 5. Kalkulasi Output Akhir
    let mut communalities = vec![0.0; n_vars];
    for i in 0..n_vars {
        communalities[i] = 1.0 - psi[i];
    }

    let mut extracted_eigenvalues = vec![0.0; n_factors];
    for j in 0..n_factors {
        let mut sum_sq = 0.0;
        for i in 0..n_vars {
            sum_sq += final_loadings[(i, j)].powi(2);
        }
        extracted_eigenvalues[j] = sum_sq;
    }

    let total_variance: f64 = matrix.diagonal().sum();
    
    let explained_variance: Vec<f64> = extracted_eigenvalues
        .iter()
        .map(|&val| if total_variance > 0.0 { (val / total_variance) * 100.0 } else { 0.0 })
        .collect();

    let mut cumulative_variance = vec![0.0; n_factors];
    let mut cum_sum = 0.0;
    for (i, &var) in explained_variance.iter().enumerate() {
        cum_sum += var;
        cumulative_variance[i] = cum_sum;
    }

    Ok(ExtractionResult {
        loadings: final_loadings,
        eigenvalues: extracted_eigenvalues,
        communalities,
        explained_variance,
        cumulative_variance,
        n_factors,
        var_names: var_names.to_vec(),
        has_heywood_case,
    })
}









// Maximum Likelihood extraction - Fully Optimized for Exact SPSS Heywood Case Replication
pub fn extract_maximum_likelihood(
    matrix: &DMatrix<f64>,
    config: &FactorAnalysisConfig,
    var_names: &[String]
) -> Result<ExtractionResult, String> {
    let n_vars = matrix.nrows();

    // 1. Tentukan jumlah faktor (n_factors) SEBELUM iterasi
    let initial_eigen = matrix.clone().symmetric_eigen();
    let mut initial_eigvals: Vec<f64> = initial_eigen.eigenvalues.iter().cloned().collect();
    initial_eigvals.sort_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));

    let n_factors = determine_factors_to_retain(&initial_eigvals, config);
    if n_factors == 0 {
        return Err("No factors meet the retention criteria".to_string());
    }

    // 2. Initial Communality Estimates (SMC)
    let mut communalities = vec![0.0; n_vars];
    if let Some(inv) = matrix.clone().try_inverse() {
        for i in 0..n_vars {
            let r_ii = inv[(i, i)];
            if r_ii > 0.0 {
                communalities[i] = 1.0 - 1.0 / r_ii;
            } else {
                communalities[i] = 0.5;
            }
        }
    } else {
        for i in 0..n_vars {
            let mut max_r = 0.0;
            for j in 0..n_vars {
                if i != j {
                    let val = matrix[(i, j)].abs();
                    if val > max_r { max_r = val; }
                }
            }
            communalities[i] = max_r;
        }
    }

    for val in &mut communalities {
        if *val >= 1.0 { *val = 0.999; }
        if *val <= 0.0 { *val = 0.001; }
    }

    let mut psi_squared = vec![0.0; n_vars];
    for i in 0..n_vars {
        psi_squared[i] = 1.0 - communalities[i];
    }

    // 3. Iterative solution (Jöreskog EM Procedure with Strict Bounding)
    let max_iterations = if config.extraction.max_iter > 25 {
        config.extraction.max_iter as usize
    } else {
        3000 // Ditingkatkan ke 3000 agar memiliki runway yang cukup untuk menembus dinding Heywood
    };
    
    // Diperketat secara radikal ke 1e-8 untuk mengatasi slow-crawl mendekati konvergensi asli SPSS
    let convergence_criterion = 1e-8; 
    
    let mut final_loadings = DMatrix::zeros(n_vars, n_factors);
    let mut converged = false;
    let mut has_heywood_case = false;

    for _iteration in 0..max_iterations {
        let mut psi_inv_sqrt = DMatrix::zeros(n_vars, n_vars);
        for i in 0..n_vars {
            // Diturunkan ke 0.0001 (Epsilon tinggi) agar varians ekstraksi bisa menyentuh 0.999 tanpa hambatan pembagian
            let val = psi_squared[i].max(0.0001); 
            psi_inv_sqrt[(i, i)] = 1.0 / val.sqrt();
        }

        let weighted_r = &psi_inv_sqrt * matrix * &psi_inv_sqrt;
        let eigen = weighted_r.symmetric_eigen();

        let mut indices: Vec<usize> = (0..n_vars).collect();
        indices.sort_by(|&i, &j|
            eigen.eigenvalues[j]
                .partial_cmp(&eigen.eigenvalues[i])
                .unwrap_or(std::cmp::Ordering::Equal)
        );

        let sorted_eigenvalues: Vec<f64> = indices.iter()
            .map(|&i| eigen.eigenvalues[i].max(0.0))
            .collect();
            
        let mut sorted_eigenvectors = DMatrix::zeros(n_vars, n_vars);
        for i in 0..n_vars {
            for j in 0..n_vars {
                sorted_eigenvectors[(i, j)] = eigen.eigenvectors[(i, indices[j])];
            }
        }

        let mut loadings = DMatrix::zeros(n_vars, n_factors);
        for i in 0..n_vars {
            for j in 0..n_factors {
                let eig_val = sorted_eigenvalues[j];
                let scale_factor = if eig_val > 1.0 { (eig_val - 1.0).sqrt() } else { 0.0 };
                
                let val = psi_squared[i].max(0.0001);
                loadings[(i, j)] = val.sqrt() * sorted_eigenvectors[(i, j)] * scale_factor;
            }
        }

        let mut new_communalities = vec![0.0; n_vars];
        let mut new_psi_squared = vec![0.0; n_vars];
        let mut max_change = 0.0;
        
        has_heywood_case = false;

        for i in 0..n_vars {
            let mut sum_sq = 0.0;
            for j in 0..n_factors {
                sum_sq += loadings[(i, j)].powi(2);
            }

            // Batas Heywood Case SPSS tepat berada di angka 0.999
            if sum_sq >= 0.999 {
                has_heywood_case = true;
                sum_sq = 0.999; // Kunci di posisi batas SPSS
            }
            
            new_communalities[i] = sum_sq;
            new_psi_squared[i] = 1.0 - sum_sq;
            
            let change = (new_communalities[i] - communalities[i]).abs();
            if change > max_change {
                max_change = change;
            }
        }

        communalities = new_communalities;
        psi_squared = new_psi_squared;
        final_loadings = loadings;

        if max_change < convergence_criterion {
            converged = true;
            break;
        }
    }

    if has_heywood_case {
        web_sys::console::log_1(
            &"[ML] Heywood case detected; solution should be interpreted with caution.".into(),
        );
    }

    if !converged {
        web_sys::console::log_1(
            &"[ML] Did not fully converge within internal maximum iterations.".into(),
        );
    }

    // 4. Kalkulasi Output Akhir (Sesuai dengan tabel Extraction SPSS)
    let mut extracted_eigenvalues = vec![0.0; n_factors];
    for j in 0..n_factors {
        let mut sum_sq = 0.0;
        for i in 0..n_vars {
            sum_sq += final_loadings[(i, j)].powi(2);
        }
        extracted_eigenvalues[j] = sum_sq;
    }

    let total_variance: f64 = matrix.diagonal().sum(); 
    
    let explained_variance: Vec<f64> = extracted_eigenvalues
        .iter()
        .map(|&val| if total_variance > 0.0 { (val / total_variance) * 100.0 } else { 0.0 })
        .collect();

    let mut cumulative_variance = vec![0.0; n_factors];
    let mut cum_sum = 0.0;
    for (i, &var) in explained_variance.iter().enumerate() {
        cum_sum += var;
        cumulative_variance[i] = cum_sum;
    }

    Ok(ExtractionResult {
        loadings: final_loadings,
        eigenvalues: extracted_eigenvalues,
        communalities,
        explained_variance,
        cumulative_variance,
        n_factors,
        var_names: var_names.to_vec(),
        has_heywood_case,
    })
}







// Alpha Factoring extraction
pub fn extract_alpha_factoring(
    matrix: &DMatrix<f64>,
    config: &FactorAnalysisConfig,
    var_names: &[String]
) -> Result<ExtractionResult, String> {
    let n_vars = matrix.nrows();

    // Check if determinant of correlation matrix is too small
    let determinant = matrix.determinant();
    if determinant.abs() < 1e-8 {
        return Err("Correlation matrix is nearly singular for alpha factoring".to_string());
    }

    // Initial communality estimates
    let mut h_initial = vec![0.0; n_vars];

    // Initialize communalities
    let _inverse_matrix = match matrix.clone().try_inverse() {
        Some(inv) => {
            // Use SMC method
            for i in 0..n_vars {
                h_initial[i] = 1.0 - 1.0 / inv[(i, i)];

                // Ensure valid initial communality
                if h_initial[i] < 0.0 || h_initial[i] > 1.0 {
                    h_initial[i] = 0.5;
                }
            }
            true
        }
        None => {
            // Use maximum correlation method
            for i in 0..n_vars {
                let mut max_corr = 0.0;
                for j in 0..n_vars {
                    if i != j {
                        let corr = matrix[(i, j)].abs();
                        if corr > max_corr {
                            max_corr = corr;
                        }
                    }
                }
                h_initial[i] = max_corr;
            }
            false
        }
    };

    // Setup for iterations
    let max_iterations = config.extraction.max_iter as usize;
    let convergence_criterion = 0.001;

    let mut h_current = h_initial.clone();

    // Iterative solution for Alpha factoring
    for _iteration in 0..max_iterations {
        // Create diagonal matrix H^(1/2)
        let mut h_sqrt = DMatrix::zeros(n_vars, n_vars);
        for i in 0..n_vars {
            h_sqrt[(i, i)] = h_current[i].sqrt();
        }

        // Calculate H^(1/2) * (R-I) * H^(1/2) + I
        let identity = DMatrix::identity(n_vars, n_vars);
        let r_minus_i = matrix - &identity;
        let transformed = &h_sqrt * &r_minus_i * &h_sqrt + identity;

        // Perform eigenvalue decomposition
        let eigen = transformed.symmetric_eigen();

        // Sort eigenvalues and eigenvectors
        let mut indices: Vec<usize> = (0..n_vars).collect();
        indices.sort_by(|&i, &j|
            eigen.eigenvalues[j]
                .partial_cmp(&eigen.eigenvalues[i])
                .unwrap_or(std::cmp::Ordering::Equal)
        );

        let sorted_eigenvalues: Vec<f64> = indices
            .iter()
            .map(|&i| eigen.eigenvalues[i].max(0.0)) // Ensure non-negative
            .collect();

        let mut sorted_eigenvectors = DMatrix::zeros(n_vars, n_vars);
        for i in 0..n_vars {
            for j in 0..n_vars {
                sorted_eigenvectors[(i, j)] = eigen.eigenvectors[(i, indices[j])];
            }
        }

        // Determine number of factors
        let n_factors = determine_factors_to_retain(&sorted_eigenvalues, config);
        if n_factors == 0 {
            return Err("No factors meet the retention criteria".to_string());
        }

        // Calculate new communality estimates - Alpha factoring specific formula
        let mut h_new = vec![0.0; n_vars];
        for k in 0..n_vars {
            let mut sum = 0.0;
            for j in 0..n_factors {
                sum += sorted_eigenvalues[j].abs() * sorted_eigenvectors[(k, j)].powi(2);
            }
            h_new[k] = sum * h_current[k];

            // Check for zero communality
            if h_new[k] < 1e-6 {
                return Err("Zero communality detected in alpha factoring".to_string());
            }
        }

        // Check for convergence
        let mut max_change = 0.0;
        for i in 0..n_vars {
            let change = (h_new[i] - h_current[i]).abs();
            if change > max_change {
                max_change = change;
            }
        }

        if max_change < convergence_criterion {
            // Converged, calculate final loadings
            let mut loadings = DMatrix::zeros(n_vars, n_factors);
            for i in 0..n_vars {
                for j in 0..n_factors {
                    loadings[(i, j)] =
                        h_current[i].sqrt() *
                        sorted_eigenvectors[(i, j)] *
                        sorted_eigenvalues[j].sqrt();
                }
            }

            // Calculate explained variance
            let total_variance: f64 = if config.extraction.covariance {
                // Covariance matrix: sum of all eigenvalues represents total variance
                sorted_eigenvalues.iter().sum()
            } else {
                // Correlation matrix: use sum of communalities for alpha factoring
                h_new.iter().sum()
            };
            let explained_variance: Vec<f64> = sorted_eigenvalues
                .iter()
                .take(n_factors)
                .map(|&val| if total_variance > 0.0 { (val / total_variance) * 100.0 } else { 0.0 })
                .collect();

            // Calculate cumulative variance
            let mut cumulative_variance = vec![0.0; n_factors];
            let mut cum_sum = 0.0;
            for (i, &var) in explained_variance.iter().enumerate() {
                cum_sum += var;
                cumulative_variance[i] = cum_sum;
            }

            return Ok(ExtractionResult {
                loadings,
                eigenvalues: sorted_eigenvalues.into_iter().take(n_factors).collect(),
                communalities: h_new,
                explained_variance,
                cumulative_variance,
                n_factors,
                var_names: var_names.to_vec(),
                has_heywood_case: false,
            });
        }

        // Update communalities for next iteration
        h_current = h_new;
    }

    // If we reach here, we've hit the maximum iterations without converging
    Err("Alpha factoring failed to converge within the maximum iterations".to_string())
}

// Image Factoring extraction
pub fn extract_image_factoring(
    matrix: &DMatrix<f64>,
    config: &FactorAnalysisConfig,
    var_names: &[String]
) -> Result<ExtractionResult, String> {
    let n_vars = matrix.nrows();

    // Get inverse of correlation matrix
    let r_inverse = match matrix.clone().try_inverse() {
        Some(inv) => inv,
        None => {
            return Err("Correlation matrix is singular for image factoring".to_string());
        }
    };

    // Create S matrix (diagonal matrix of 1/sqrt(r_ii))
    let mut s_matrix = DMatrix::zeros(n_vars, n_vars);
    for i in 0..n_vars {
        s_matrix[(i, i)] = 1.0 / r_inverse[(i, i)].sqrt();
    }

    // Calculate S^(-1) * R * S^(-1)
    let s_inv = s_matrix.clone().try_inverse().unwrap(); // S is diagonal, so inverse should exist
    let transformed = &s_inv * matrix * &s_inv;

    // Perform eigenvalue decomposition
    let eigen = transformed.symmetric_eigen();

    // Sort eigenvalues and eigenvectors
    let mut indices: Vec<usize> = (0..n_vars).collect();
    indices.sort_by(|&i, &j|
        eigen.eigenvalues[j].partial_cmp(&eigen.eigenvalues[i]).unwrap_or(std::cmp::Ordering::Equal)
    );

    let sorted_eigenvalues: Vec<f64> = indices
        .iter()
        .map(|&i| eigen.eigenvalues[i])
        .collect();

    let mut sorted_eigenvectors = DMatrix::zeros(n_vars, n_vars);
    for i in 0..n_vars {
        for j in 0..n_vars {
            sorted_eigenvectors[(i, j)] = eigen.eigenvectors[(i, indices[j])];
        }
    }

    // Determine number of factors - for image factoring, only use eigenvalues > 1
    let mut n_factors = 0;
    for &val in &sorted_eigenvalues {
        if val > 1.0 {
            n_factors += 1;
        } else {
            break;
        }
    }

    if n_factors == 0 {
        return Err("No factors with eigenvalues > 1 in image factoring".to_string());
    }

    // Calculate loadings using image factoring formula
    let mut loadings = DMatrix::zeros(n_vars, n_factors);
    for i in 0..n_vars {
        for j in 0..n_factors {
            loadings[(i, j)] =
                (s_matrix[(i, i)] * sorted_eigenvectors[(i, j)] * (sorted_eigenvalues[j] - 1.0)) /
                sorted_eigenvalues[j].sqrt();
        }
    }

    // Calculate communalities
    let mut communalities = vec![0.0; n_vars];
    for i in 0..n_vars {
        for j in 0..n_factors {
            communalities[i] +=
                ((sorted_eigenvalues[j] - 1.0).powi(2) * sorted_eigenvectors[(i, j)].powi(2)) /
                (sorted_eigenvalues[j] * r_inverse[(i, i)]);
        }
    }

    // Calculate explained variance
    let total_variance = if config.extraction.covariance {
        // Covariance matrix: sum of all eigenvalues represents total variance
        sorted_eigenvalues.iter().sum()
    } else {
        // Correlation matrix: total variance is p
        n_vars as f64
    };
    let explained_variance: Vec<f64> = (0..n_factors)
        .map(|j| if total_variance > 0.0 { (sorted_eigenvalues[j] / total_variance) * 100.0 } else { 0.0 })
        .collect();

    // Calculate cumulative variance
    let mut cumulative_variance = vec![0.0; n_factors];
    let mut cum_sum = 0.0;
    for (i, &var) in explained_variance.iter().enumerate() {
        cum_sum += var;
        cumulative_variance[i] = cum_sum;
    }

    // Calculate image covariance matrix
    // R + S^2 * R^(-1) * S^2 - 2*S^2
    let _image_covar = matrix + &s_matrix * &r_inverse * &s_matrix - &s_matrix * 2.0;

    // Calculate anti-image covariance matrix
    // S^2 * R^(-1) * S^2
    let _anti_image_covar = &s_matrix * &r_inverse * &s_matrix;

    Ok(ExtractionResult {
        loadings,
        eigenvalues: sorted_eigenvalues.into_iter().take(n_factors).collect(),
        communalities,
        explained_variance,
        cumulative_variance,
        n_factors,
        var_names: var_names.to_vec(),
        has_heywood_case: false,
    })
}
