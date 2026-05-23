// perbaikan 17/1/2026

use std::collections::HashMap;
use nalgebra::DMatrix;
use super::matrix::calculate_raw_variances;
use super::common::chi_square_cdf;
use super::core::{ calculate_matrix, extract_data_matrix, extract_factors, rotate_factors };
use crate::models::{
    config::{FactorAnalysisConfig,ExtractionMethod,},
    data::AnalysisData,
    result::{
        Communalities,
        ComponentCorrelationMatrix,
        ComponentMatrix,
        ComponentScoreCoefficientMatrix,
        ComponentScoreCovarianceMatrix,
        ComponentTransformationMatrix,
        // ExtractionResult,
        GoodnessOfFitTest,
        PatternMatrix,
        ReproducedCorrelations,
        ReproducedCovariances,
        RotatedComponentMatrix,
        RotationResult,
        ScreePlot,
        StructureMatrix,
        TotalVarianceComponent,
        TotalVarianceExplained,
        TotalVarianceBlock,
    },
};



// =========================================================================
// 1. Communalities (FIXED LOGIC ORDER & COVARIANCE HANDLING)
// =========================================================================
pub fn calculate_communalities(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<Communalities, String> {

    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let is_covariance_extraction = config.extraction.covariance;

    let matrix_type = if is_covariance_extraction {
        "covariance"
    } else if config.extraction.correlation {
        "correlation"
    } else {
        "correlation" 
    };

    // 1. Lakukan Ekstraksi Faktor
    let matrix_for_extraction = calculate_matrix(&data_matrix, matrix_type)?; 
    let extraction_result = extract_factors(&matrix_for_extraction, config, &var_names)?;

    // 2. Hitung Varians Murni (Raw Variances) - DIPINDAHKAN KE ATAS
    // Kita butuh ini untuk mengecek validitas Heywood Case pada mode Covariance
    let raw_variances = calculate_raw_variances(&data_matrix)?; 

    // --- LOGIKA SUPPRESS (SPSS BEHAVIOR - REVISED) ---
    // Heywood case hanya menyalakan warning, bukan suppress kolom Extraction.
    let mut heywood_warning_flag = false;

    let suppress_extraction = match config.extraction.method {
        // PAF: pada mode ini, jika Heywood/invalid muncul, kolom Extraction disuppress.
        // Ini menyesuaikan perilaku output yang diharapkan user (Initial-only untuk kasus PAF tertentu).
        ExtractionMethod::PrincipalAxisFactoring => {
            if extraction_result.n_factors == 0 {
                true
            } else {
                let has_fatal_error = extraction_result
                    .communalities
                    .iter()
                    .any(|&c| c.is_nan() || c.is_infinite());

                let has_heywood_or_invalid = extraction_result
                    .communalities
                    .iter()
                    .enumerate()
                    .any(|(i, &val)| {
                        let check_val = if is_covariance_extraction {
                            if raw_variances[i] > 0.0 {
                                val / raw_variances[i]
                            } else {
                                0.0
                            }
                        } else {
                            val
                        };

                        check_val >= 0.9999 || check_val.abs() < 1e-6
                    });

                // Saat PAF disuppress karena Heywood/invalid, jangan tampilkan footnote warning.
                heywood_warning_flag = false;

                has_fatal_error || has_heywood_or_invalid
            }
        }

        // ML/GLS/ULS: Heywood hanya warning, bukan suppress.
        ExtractionMethod::GeneralizedLeastSquares |
        ExtractionMethod::MaximumLikelihood |
        ExtractionMethod::UnweightedLeastSquares => {
            if extraction_result.n_factors == 0 {
                true
            } else {
                let has_fatal_error = extraction_result
                    .communalities
                    .iter()
                    .any(|&c| c.is_nan() || c.is_infinite());

                heywood_warning_flag = extraction_result
                    .communalities
                    .iter()
                    .enumerate()
                    .any(|(i, &val)| {
                        let check_val = if is_covariance_extraction {
                            if raw_variances[i] > 0.0 {
                                val / raw_variances[i]
                            } else {
                                0.0
                            }
                        } else {
                            val
                        };

                        check_val >= 0.9999
                    });

                has_fatal_error
            }
        }

        // GRUP NON-ITERATIF (PCA): Selalu tampil kecuali NaN/Inf
        _ => extraction_result
            .communalities
            .iter()
            .any(|&c| c.is_nan() || c.is_infinite()),
    };

    // --- PERSIAPAN DATA INITIAL ---
    // Hitung SMC untuk Initial Value
    let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;
    let smc_values: Vec<f64> = match corr_matrix.try_inverse() {
        Some(inv) => {
            (0..var_names.len())
                .map(|i| {
                    let r_ii = inv[(i, i)];
                    if r_ii > 0.0 { (1.0 - 1.0 / r_ii).max(0.0) } else { 0.0 }
                })
                .collect()
        },
        None => vec![0.0; var_names.len()] 
    };

    let mut raw_initial = HashMap::new();
    let mut rescaled_initial = HashMap::new();
    let mut extraction = HashMap::new();
    let mut rescaled_extraction = HashMap::new();

    for (i, var_name) in var_names.iter().enumerate() {
        
        // --- LOGIKA INITIAL VALUES ---
        match config.extraction.method {
            ExtractionMethod::PrincipalComponents => {
                rescaled_initial.insert(var_name.clone(), 1.0);
                if is_covariance_extraction {
                    raw_initial.insert(var_name.clone(), raw_variances[i]);
                } else {
                    raw_initial.insert(var_name.clone(), 1.0);
                }
            },
            _ => {
                let smc = if i < smc_values.len() { smc_values[i] } else { 0.0 };
                rescaled_initial.insert(var_name.clone(), smc);

                if is_covariance_extraction {
                    let raw_val = smc * raw_variances[i];
                    raw_initial.insert(var_name.clone(), raw_val);
                } else {
                    raw_initial.insert(var_name.clone(), smc);
                }
            }
        }

        // --- PENGISIAN EXTRACTION VALUES ---
        // Hanya isi jika suppress == false
        if !suppress_extraction {
            if i < extraction_result.communalities.len() {
                let raw_ext_val = extraction_result.communalities[i];
                
                if is_covariance_extraction {
                    // Covariance Mode
                    extraction.insert(var_name.clone(), raw_ext_val); // Raw
                    if raw_variances[i] > 0.0 {
                        rescaled_extraction.insert(var_name.clone(), raw_ext_val / raw_variances[i]);
                    } else {
                        rescaled_extraction.insert(var_name.clone(), 0.0);
                    }
                } else {
                    // Correlation Mode
                    extraction.insert(var_name.clone(), raw_ext_val);
                    rescaled_extraction.insert(var_name.clone(), raw_ext_val);
                }
            }
        }
    }

    Ok(Communalities {
        raw_initial,
        rescaled_initial,
        extraction, 
        rescaled_extraction,
        variable_order: var_names,
        extraction_matrix_type: matrix_type.to_string(),
        suppress_extraction,
        heywood_warning_flag,
    })
}


// =========================================================================
// 2. Total Variance Explained (Fixed: Using matches! macro)
// =========================================================================

// Helper closure
fn create_components(eigenvalues: &[f64], total_variance: f64) -> Vec<TotalVarianceComponent> {
    let mut components = Vec::new();
    let mut cumulative = 0.0;
    
    for &eig in eigenvalues {
        let percent = if total_variance > 0.0 { (eig / total_variance) * 100.0 } else { 0.0 };
        cumulative += percent;
        
        components.push(TotalVarianceComponent {
            total: eig,
            percent_of_variance: percent,
            cumulative_percent: cumulative,
        });
    }
    components
}

// fn calculate_rotated_sums_of_squared_loadings(
//     extraction_result: &ExtractionResult,
//     config: &FactorAnalysisConfig,
// ) -> Result<Vec<f64>, String> {
//     let rotation_result = rotate_factors(extraction_result, config)?;
//     let rotated_loadings = &rotation_result.rotated_loadings;

//     let n_rows = rotated_loadings.nrows();
//     let n_cols = rotated_loadings.ncols();
//     let mut rotated_ssl = Vec::with_capacity(n_cols);

//     for j in 0..n_cols {
//         let mut ssl = 0.0;
//         for i in 0..n_rows {
//             ssl += rotated_loadings[(i, j)].powi(2);
//         }
//         rotated_ssl.push(ssl);
//     }

//     rotated_ssl.sort_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));
//     Ok(rotated_ssl)
// }

// pub fn calculate_total_variance_explained(
//     initial_eigenvalues: &[f64],    
//     extraction_eigenvalues: &[f64], 
//     rotation_eigenvalues: Option<&[f64]>,
//     total_variance: f64,
//     _n_variables: usize,
//     matrix_type: &str,
//     suppress_extraction: bool,
// ) -> TotalVarianceExplained {

//     match matrix_type {
//         "correlation" => {
//             let initial = create_components(initial_eigenvalues, total_variance);
            
//             let (extraction, rotation) = if suppress_extraction {
//                 (Vec::new(), None) // Kosongkan jika ML error
//             } else {
//                 let ext = create_components(extraction_eigenvalues, total_variance);
//                 let rot = rotation_eigenvalues.map(|values| create_components(values, total_variance));
//                 (ext, rot)
//             };

//             TotalVarianceExplained {
//                 blocks: vec![
//                     TotalVarianceBlock {
//                         label: "Component".to_string(),
//                         initial,
//                         extraction,
//                         rotation,
//                     }
//                 ],
//                 extraction_matrix_type: "correlation".to_string(),
//             }
//         }

//         "covariance" => {
//             let raw_initial = create_components(initial_eigenvalues, total_variance);
            
//             let raw_extraction = if suppress_extraction {
//                 Vec::new() // Kosongkan
//             } else {
//                 create_components(extraction_eigenvalues, total_variance)
//             };

//             let rescaled_initial = raw_initial.clone();
//             let rescaled_extraction = raw_extraction.clone();

//             TotalVarianceExplained {
//                 blocks: vec![
//                     TotalVarianceBlock {
//                         label: "Raw".to_string(),
//                         initial: raw_initial,
//                         extraction: raw_extraction,
//                         rotation: None,
//                     },
//                     TotalVarianceBlock {
//                         label: "Rescaled".to_string(),
//                         initial: rescaled_initial,
//                         extraction: rescaled_extraction,
//                         rotation: None,
//                     },
//                 ],
//                 extraction_matrix_type: "covariance".to_string(),
//             }
//         }

//         _ => panic!("Unknown matrix type"),
//     }
// }

// pub fn calculate_total_variance_explained_from_data(
//     data: &AnalysisData,
//     config: &FactorAnalysisConfig,
// ) -> Result<TotalVarianceExplained, String> {

//     let (data_matrix, var_names) = extract_data_matrix(data, config)?;
//     let n_variables = var_names.len();

//     let is_covariance = config.extraction.covariance;
//     let matrix_type = if is_covariance { "covariance" } else { "correlation" };

//     let matrix = calculate_matrix(&data_matrix, matrix_type)?;

//     // STEP A: HITUNG INITIAL EIGENVALUES
//     let eigen_decomp = matrix.clone().symmetric_eigen();
//     let mut initial_eigenvalues: Vec<f64> = eigen_decomp.eigenvalues.data.as_vec().clone();
//     initial_eigenvalues.sort_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));

//     // Hitung Total Variance
//     let total_variance: f64 = if is_covariance {
//         initial_eigenvalues.iter().sum()
//     } else {
//         n_variables as f64
//     };

//     // STEP B: HITUNG EXTRACTION EIGENVALUES
//     let extraction_result = match extract_factors(&matrix, config, &var_names) {
//         Ok(result) => Some(result),
//         Err(e) => {
//             // Konsep SPSS: jika ML gagal konvergen/heywood, tampilkan hanya Initial Eigenvalues.
//             if matches!(config.extraction.method, ExtractionMethod::MaximumLikelihood) {
//                 let empty: Vec<f64> = Vec::new();
//                 return Ok(calculate_total_variance_explained(
//                     &initial_eigenvalues,
//                     &empty,
//                     None,
//                     total_variance,
//                     n_variables,
//                     matrix_type,
//                     true,
//                 ));
//             }
//             return Err(e);
//         }
//     };

//     let extraction_result = extraction_result.expect("extraction_result must exist");

//     let suppress_extraction = match config.extraction.method {
//         ExtractionMethod::MaximumLikelihood => {
//             extraction_result.n_factors == 0 ||
//             extraction_result.communalities.iter().any(|&c| {
//                 c.is_nan() ||
//                 c.is_infinite()
//             })
//         },
//         ExtractionMethod::GeneralizedLeastSquares | ExtractionMethod::PrincipalAxisFactoring => {
//             extraction_result.communalities.iter().any(|&c| {
//                 c.is_nan() ||           // Cek NaN
//                 c.is_infinite() ||      // Cek Infinite
//                 c >= 0.9999 ||          // Cek Heywood Case
//                 c.abs() < 1e-6          // Cek 0
//             })
//         },
//         _ => false
//     };

//     let k = extraction_result.n_factors;
//     let limit = std::cmp::min(k, extraction_result.eigenvalues.len());
//     let extraction_eigenvalues = extraction_result.eigenvalues[0..limit].to_vec();

//     let rotation_eigenvalues = if !is_covariance
//         && !suppress_extraction
//         && !config.rotation.none
//         && config.rotation.rotated_sol
//     {
//         calculate_rotated_sums_of_squared_loadings(&extraction_result, config).ok()
//     } else {
//         None
//     };

//     Ok(calculate_total_variance_explained(
//         &initial_eigenvalues,
//         &extraction_eigenvalues,
//         rotation_eigenvalues.as_deref(),
//         total_variance,
//         n_variables,
//         matrix_type,
//         suppress_extraction, 
//     ))
// }





// =========================================================================
// 2. Total Variance Explained (Diperbarui untuk Rescaling Covariance & Rotasi)
// =========================================================================


pub fn calculate_total_variance_explained(
    initial_eigenvalues: &[f64],    
    extraction_eigenvalues: &[f64], 
    rotation_eigenvalues: Option<&[f64]>,
    total_variance: f64,
    n_variables: usize, // Underscore dihilangkan
    matrix_type: &str,
    suppress_extraction: bool,
    rescaled_extraction_eigenvalues: Option<&[f64]>, // BARU: Menampung nilai rescaled
    rescaled_rotation_eigenvalues: Option<&[f64]>,   // BARU: Menampung nilai rescaled rotasi
) -> TotalVarianceExplained {

    match matrix_type {
        "correlation" => {
            let initial = create_components(initial_eigenvalues, total_variance);
            
            let (extraction, rotation) = if suppress_extraction {
                (Vec::new(), None) 
            } else {
                let ext = create_components(extraction_eigenvalues, total_variance);
                let rot = rotation_eigenvalues.map(|values| create_components(values, total_variance));
                (ext, rot)
            };

            TotalVarianceExplained {
                blocks: vec![
                    TotalVarianceBlock {
                        label: "Component".to_string(),
                        initial,
                        extraction,
                        rotation,
                    }
                ],
                extraction_matrix_type: "correlation".to_string(),
            }
        }

        "covariance" => {
            let raw_initial = create_components(initial_eigenvalues, total_variance);
            
            let raw_extraction = if suppress_extraction {
                Vec::new() 
            } else {
                create_components(extraction_eigenvalues, total_variance)
            };

            let raw_rotation = if suppress_extraction || rotation_eigenvalues.is_none() {
                None
            } else {
                Some(create_components(rotation_eigenvalues.unwrap(), total_variance))
            };

            // SPSS logic: Initial selalu sama antara raw dan rescaled di Covariance
            let rescaled_initial = raw_initial.clone(); 

            // LOGIKA RESCALED: Total varians adalah p (jumlah variabel), bukan total raw varians
            let p_variance = n_variables as f64; 

            let rescaled_extraction = if suppress_extraction || rescaled_extraction_eigenvalues.is_none() {
                Vec::new()
            } else {
                create_components(rescaled_extraction_eigenvalues.unwrap(), p_variance)
            };

            let rescaled_rotation = if suppress_extraction || rescaled_rotation_eigenvalues.is_none() {
                None
            } else {
                Some(create_components(rescaled_rotation_eigenvalues.unwrap(), p_variance))
            };

            TotalVarianceExplained {
                blocks: vec![
                    TotalVarianceBlock {
                        label: "Raw".to_string(),
                        initial: raw_initial,
                        extraction: raw_extraction,
                        rotation: raw_rotation,
                    },
                    TotalVarianceBlock {
                        label: "Rescaled".to_string(),
                        initial: rescaled_initial,
                        extraction: rescaled_extraction,
                        rotation: rescaled_rotation,
                    },
                ],
                extraction_matrix_type: "covariance".to_string(),
            }
        }

        _ => panic!("Unknown matrix type"),
    }
}

pub fn calculate_total_variance_explained_from_data(
    data: &AnalysisData,
    config: &FactorAnalysisConfig,
) -> Result<TotalVarianceExplained, String> {

    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let n_variables = var_names.len();

    let is_covariance = config.extraction.covariance;
    let matrix_type = if is_covariance { "covariance" } else { "correlation" };

    let matrix = calculate_matrix(&data_matrix, matrix_type)?;

    // STEP A: HITUNG INITIAL EIGENVALUES
    let eigen_decomp = matrix.clone().symmetric_eigen();
    let mut initial_eigenvalues: Vec<f64> = eigen_decomp.eigenvalues.data.as_vec().clone();
    initial_eigenvalues.sort_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));

    let total_variance: f64 = if is_covariance {
        initial_eigenvalues.iter().sum()
    } else {
        n_variables as f64
    };

    // Ambil Raw Variances untuk kalkulasi rescale dan deteksi Heywood
    let raw_variances = calculate_raw_variances(&data_matrix)?;

    // STEP B: HITUNG EXTRACTION EIGENVALUES
    let extraction_result = match extract_factors(&matrix, config, &var_names) {
        Ok(result) => Some(result),
        Err(e) => {
            if matches!(config.extraction.method, ExtractionMethod::MaximumLikelihood) {
                let empty: Vec<f64> = Vec::new();
                return Ok(calculate_total_variance_explained(
                    &initial_eigenvalues,
                    &empty,
                    None,
                    total_variance,
                    n_variables,
                    matrix_type,
                    true,
                    None,
                    None, // Format parameter baru
                ));
            }
            return Err(e);
        }
    };

    let extraction_result = extraction_result.expect("extraction_result must exist");

    // LOGIKA PERBAIKAN: Hitung rasio untuk deteksi Heywood Case secara akurat
    let suppress_extraction = match config.extraction.method {
        ExtractionMethod::MaximumLikelihood => {
            extraction_result.n_factors == 0 ||
            extraction_result.communalities.iter().any(|&c| c.is_nan() || c.is_infinite())
        },
        ExtractionMethod::GeneralizedLeastSquares | ExtractionMethod::PrincipalAxisFactoring => {
            extraction_result.communalities.iter().enumerate().any(|(i, &c)| {
                let check_val = if is_covariance {
                    if raw_variances[i] > 0.0 { c / raw_variances[i] } else { 0.0 }
                } else { c };
                
                c.is_nan() || c.is_infinite() || check_val >= 0.9999 || check_val.abs() < 1e-6
            })
        },
        _ => false
    };

    let k = extraction_result.n_factors;
    let limit = std::cmp::min(k, extraction_result.eigenvalues.len());
    let extraction_eigenvalues = extraction_result.eigenvalues[0..limit].to_vec();

    // STEP C: HITUNG RESCALED EIGENVALUES JIKA COVARIANCE
    let mut rescaled_ext_evals = None;
    if is_covariance && !suppress_extraction {
        let mut evals = Vec::with_capacity(k);
        for j in 0..k {
            let mut ssl = 0.0;
            for i in 0..n_variables {
                if raw_variances[i] > 0.0 {
                    let std_load = extraction_result.loadings[(i, j)] / raw_variances[i].sqrt();
                    ssl += std_load.powi(2);
                }
            }
            evals.push(ssl);
        }
        rescaled_ext_evals = Some(evals);
    }

    // STEP D: ROTATION EIGENVALUES (Disesuaikan agar sekaligus hitung Raw & Rescaled)
    let mut raw_rot_evals = None;
    let mut rescaled_rot_evals = None;

    if !suppress_extraction && !config.rotation.none && config.rotation.rotated_sol {
        if let Ok(rot_res) = rotate_factors(&extraction_result, config) {
            let rotated_loadings = &rot_res.rotated_loadings;
            let n_cols = rotated_loadings.ncols();

            let mut raw_ssl_list = Vec::with_capacity(n_cols);
            let mut rescaled_ssl_list = Vec::with_capacity(n_cols);

            for j in 0..n_cols {
                let mut raw_ssl = 0.0;
                let mut rescaled_ssl = 0.0;
                for i in 0..n_variables {
                    let l = rotated_loadings[(i, j)];
                    raw_ssl += l.powi(2);
                    
                    if is_covariance && raw_variances[i] > 0.0 {
                        rescaled_ssl += (l / raw_variances[i].sqrt()).powi(2);
                    }
                }
                raw_ssl_list.push(raw_ssl);
                if is_covariance {
                    rescaled_ssl_list.push(rescaled_ssl);
                }
            }
            
            raw_ssl_list.sort_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));
            raw_rot_evals = Some(raw_ssl_list);

            if is_covariance {
                rescaled_ssl_list.sort_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));
                rescaled_rot_evals = Some(rescaled_ssl_list);
            }
        }
    }

    Ok(calculate_total_variance_explained(
        &initial_eigenvalues,
        &extraction_eigenvalues,
        raw_rot_evals.as_deref(),
        total_variance,
        n_variables,
        matrix_type,
        suppress_extraction, 
        rescaled_ext_evals.as_deref(),
        rescaled_rot_evals.as_deref(),
    ))
}










// =========================================================================
// 3. FUNGSI LAINNYA (Original Code - Tidak Ada Perubahan)
// =========================================================================

pub fn calculate_component_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ComponentMatrix, String> {

    let (data_matrix, var_names) = extract_data_matrix(data, config)?;

    let matrix_type = if config.extraction.covariance {
        "covariance"
    } else {
        "correlation"
    };

    let matrix = calculate_matrix(&data_matrix, matrix_type)?;
    let extraction_result = extract_factors(&matrix, config, &var_names)?;

    let mut loadings = extraction_result.loadings.clone();
    let (n_rows, n_cols) = loadings.shape();

    for col in 0..n_cols {
        let mut sum_cubes = 0.0;
        for row in 0..n_rows {
            sum_cubes += loadings[(row, col)].powi(3);
        }
        if sum_cubes < 0.0 {
            for row in 0..n_rows {
                loadings[(row, col)] *= -1.0;
            }
        }
    }

    let mut components = HashMap::new();
    for (i, var_name) in var_names.iter().enumerate() {
        let mut row = Vec::with_capacity(n_cols);
        for j in 0..n_cols {
            row.push(loadings[(i, j)]);
        }
        components.insert(var_name.clone(), row);
    }

    Ok(ComponentMatrix {
        components,
        variable_order: var_names,
    })
}

pub fn calculate_reproduced_correlations(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ReproducedCorrelations, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;
    let extraction_result = extract_factors(&corr_matrix, config, &var_names)?;

    let k = extraction_result.n_factors;
    let mut reproduced_correlation = HashMap::new();
    let mut residual = HashMap::new();

    let loadings = &extraction_result.loadings;
    let loadings_k = if k < loadings.ncols() {
        loadings.columns(0, k).into_owned()
    } else {
        loadings.clone()
    };

    let reproduced_matrix = &loadings_k * loadings_k.transpose();

    for (i, var_name) in var_names.iter().enumerate() {
        let mut var_reproduced = HashMap::new();
        let mut var_residual = HashMap::new();

        for (j, other_var) in var_names.iter().enumerate() {
            let repro_corr = if i < reproduced_matrix.nrows() && j < reproduced_matrix.ncols() {
                reproduced_matrix[(i, j)]
            } else { 0.0 };
            var_reproduced.insert(other_var.clone(), repro_corr);

            let orig_corr = if i < corr_matrix.nrows() && j < corr_matrix.ncols() {
                corr_matrix[(i, j)]
            } else {
                if i == j { 1.0 } else { 0.0 }
            };

            let residual_corr = orig_corr - repro_corr;
            var_residual.insert(other_var.clone(), residual_corr);
        }
        reproduced_correlation.insert(var_name.clone(), var_reproduced);
        residual.insert(var_name.clone(), var_residual);
    }

    Ok(ReproducedCorrelations {
        reproduced_correlation,
        residual,
        variable_order: var_names,
    })
}



pub fn calculate_reproduced_covariances(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ReproducedCovariances, String> {
    
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    
    // 1. Ambil Matriks Kovarians (Observed)
    let cov_matrix = calculate_matrix(&data_matrix, "covariance")?;
    
    // 2. Ekstraksi Faktor
    let extraction_result = extract_factors(&cov_matrix, config, &var_names)?;

    let k = extraction_result.n_factors;
    let loadings = &extraction_result.loadings;
    
    // Ambil k kolom pertama (Loadings aktif)
    let loadings_k = if k < loadings.ncols() {
        loadings.columns(0, k).into_owned()
    } else {
        loadings.clone()
    };

    // 3. Hitung REPRODUCED TABLE (untuk ditampilkan)
    // Formula R: reproduced_table <- Lambda %*% t(Lambda)
    // PENTING: TIDAK override diagonal!
    let reproduced_table = &loadings_k * loadings_k.transpose();

    // 4. Hitung REPRODUCED MODEL (untuk residual)
    // Formula R: reproduced_model <- reproduced_table + Psi
    // Di mana Psi = diag(uniquenesses) = diag(Variance - Communality)
    let n = var_names.len();
    let reproduced_model = DMatrix::from_fn(n, n, |i, j| {
        if i == j {
            // Diagonal reproduced_model = Communality + Uniqueness = Variance
            // Ini membuat residual diagonal = 0
            cov_matrix[(i, i)]
        } else {
            reproduced_table[(i, j)]
        }
    });

    let mut reproduced_covariance = HashMap::new();
    let mut residual = HashMap::new();

    for (i, var_name) in var_names.iter().enumerate() {
        let mut var_reproduced = HashMap::new();
        let mut var_residual = HashMap::new();

        for (j, other_var) in var_names.iter().enumerate() {
            // Nilai Reproduced TABLE (untuk ditampilkan)
            let repro_val = if i < reproduced_table.nrows() && j < reproduced_table.ncols() {
                reproduced_table[(i, j)]
            } else { 0.0 };
            var_reproduced.insert(other_var.clone(), repro_val);

            // Nilai Observed (Data Asli)
            let orig_val = if i < cov_matrix.nrows() && j < cov_matrix.ncols() {
                cov_matrix[(i, j)]
            } else { 0.0 };

            // Nilai Reproduced MODEL (untuk residual)
            let repro_model_val = if i < reproduced_model.nrows() && j < reproduced_model.ncols() {
                reproduced_model[(i, j)]
            } else { 0.0 };

            // Nilai Residual = Observed - Reproduced Model
            let residual_val = orig_val - repro_model_val;
            var_residual.insert(other_var.clone(), residual_val);
        }
        reproduced_covariance.insert(var_name.clone(), var_reproduced);
        residual.insert(var_name.clone(), var_residual);
    }

    Ok(ReproducedCovariances {
        reproduced_covariance,
        residual,
        variable_order: var_names,
    })
}






// =========================================================================
// 2b. Goodness-of-fit Test (GLS) - Dikembalikan ke Algoritma Asli Anda (SPSS Standard)
// =========================================================================
pub fn calculate_goodness_of_fit_test(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<GoodnessOfFitTest, String> {
    if !matches!(config.extraction.method, ExtractionMethod::GeneralizedLeastSquares) {
        return Err("Goodness-of-fit test only implemented for GLS.".to_string());
    }

    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let n_cases = data_matrix.nrows();
    let p = var_names.len();
    if n_cases < 2 || p == 0 {
        return Err("Insufficient data for goodness-of-fit test.".to_string());
    }

    let matrix_type = if config.extraction.covariance { "covariance" } else { "correlation" };
    let s_matrix = calculate_matrix(&data_matrix, matrix_type)?;
    let extraction_result = extract_factors(&s_matrix, config, &var_names)?;
    let k = extraction_result.n_factors;
    if k == 0 {
        return Err("No factors retained for goodness-of-fit test.".to_string());
    }

    let loadings = &extraction_result.loadings;
    let mut sigma = loadings * loadings.transpose();

    // LOGIKA ASLI: Diagonal matriks model Sigma adalah (L * L^T) + Uniqueness
    for i in 0..p {
        let variance = if config.extraction.covariance {
            s_matrix[(i, i)]
        } else {
            1.0
        };

        let communality = extraction_result.communalities.get(i).copied().unwrap_or(0.0);
        let uniqueness = (variance - communality).max(1e-9);
        sigma[(i, i)] += uniqueness;
    }

    // Menggunakan .clone() agar tidak bermasalah dengan borrow checker saat di-build ke WASM
    let s_inv = s_matrix
        .clone()
        .try_inverse()
        .ok_or("Failed to invert observed matrix for goodness-of-fit test.")?;

    // GLS discrepancy: F = 0.5 * tr( A * A ), A = (S - Sigma) * S^-1
    let residual = &s_matrix - &sigma;
    let a_matrix = residual * s_inv;
    let a_squared = &a_matrix * &a_matrix;

    let mut trace_val = 0.0;
    for i in 0..p {
        trace_val += a_squared[(i, i)];
    }

    let f_gls = 0.5 * trace_val;

    let mut trace_val = 0.0;
    for i in 0..p {
        trace_val += a_squared[(i, i)];
    }

    let f_gls = 0.5 * trace_val;

    // --- PERBAIKAN: SPSS menggunakan Koreksi Bartlett untuk uji Goodness-of-Fit pada GLS ---
    // Rumus Multiplier = N - 1 - (2p + 5)/6 - 2k/3
    let p_f64 = p as f64;
    let k_f64 = k as f64;
    let multiplier = (n_cases as f64) - 1.0 - ((2.0 * p_f64 + 5.0) / 6.0) - ((2.0 * k_f64) / 3.0);
    
    // Kalikan multiplier dengan nilai fungsi objektif GLS
    let chi_square = multiplier.max(0.0) * f_gls;

    let df = ((p as f64 - k as f64).powi(2) - (p + k) as f64) / 2.0;
    let df_value = if df > 0.0 { df } else { 1.0 };
    let df_usize = df_value.round().max(1.0) as usize;

    let significance = 1.0 - chi_square_cdf(chi_square, df_value);

    Ok(GoodnessOfFitTest {
        chi_square,
        df: df_usize,
        significance,
    })
}









pub fn calculate_scree_plot(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ScreePlot, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let matrix_type = if config.extraction.covariance { "covariance" } else { "correlation" };
    let matrix = calculate_matrix(&data_matrix, matrix_type)?;
    let extraction_result = extract_factors(&matrix, config, &var_names)?;

    let n_variables = var_names.len();
    let mut eigenvalues = extraction_result.eigenvalues.clone();

    // ML/iterative unstable case may suppress extraction (n_factors == 0),
    // which can leave scree values empty. Fallback to initial matrix eigenvalues
    // so scree plot remains visible and informative.
    if extraction_result.n_factors == 0
        || eigenvalues.is_empty()
        || eigenvalues.iter().all(|v| v.abs() < 1e-12)
    {
        let eig = matrix.clone().symmetric_eigen();
        eigenvalues = eig.eigenvalues.data.as_vec().clone();
        eigenvalues.sort_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));
    }

    eigenvalues.resize(n_variables, 0.0);
    let mut component_numbers = Vec::with_capacity(n_variables);
    for i in 0..n_variables {
        component_numbers.push(i + 1);
    }

    Ok(ScreePlot {
        eigenvalues,
        component_numbers,
    })
}


// // =========================================================================
// // HELPER: Alignment Check (Memastikan arah skor sesuai loading)
// // =========================================================================
// fn align_coefficients_direction(
//     coefficients: &mut DMatrix<f64>, 
//     pattern_matrix: &DMatrix<f64>
// ) {
//     let (n_rows, n_cols) = coefficients.shape();
//     for j in 0..n_cols {
//         let mut dot_prod = 0.0;
//         // Hitung korelasi arah antara Loading dan Coefficient
//         for i in 0..n_rows {
//             dot_prod += pattern_matrix[(i, j)] * coefficients[(i, j)];
//         }
        
//         // Jika arah berlawanan, balik tanda coefficient
//         if dot_prod < 0.0 {
//             for i in 0..n_rows {
//                 coefficients[(i, j)] *= -1.0;
//             }
//         }
//     }
// }

// =========================================================================
// HELPER: Robust Sqrt (Mencegah Crash pada nilai negatif kecil)
// =========================================================================
pub fn symmetric_matrix_sqrt_robust(matrix: &DMatrix<f64>) -> Option<DMatrix<f64>> {
    let n = matrix.nrows();
    if n != matrix.ncols() { return None; }
    
    let eigen = matrix.clone().symmetric_eigen();
    let mut d_sqrt = DMatrix::zeros(n, n);
    
    for i in 0..n {
        let val = eigen.eigenvalues[i];
        if val < -1e-5 {
            return None; // Error jika matriks benar-benar negatif
        } else {
            d_sqrt[(i, i)] = val.max(0.0).sqrt(); // Toleransi noise negatif
        }
    }
    Some(eigen.eigenvectors.clone() * d_sqrt * eigen.eigenvectors.transpose())
}

// Wrapper agar fungsi lama tetap ada tapi menggunakan logika robust yang baru
pub fn symmetric_matrix_sqrt(matrix: &DMatrix<f64>) -> Option<DMatrix<f64>> {
    symmetric_matrix_sqrt_robust(matrix)
}

// // =========================================================================
// // FUNGSI UTAMA: Calculate Score Coefficients
// // =========================================================================
// pub fn calculate_component_score_coefficient_matrix(
//     data: &AnalysisData,
//     config: &FactorAnalysisConfig
// ) -> Result<ComponentScoreCoefficientMatrix, String> {
//     let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    
//     // 1. Matriks Korelasi (R)
//     let r_matrix = calculate_matrix(&data_matrix, "correlation")?;

//     // Faktor skor dihitung dari variabel terstandar, tetapi pola loading mengikuti
//     // hasil ekstraksi (covariance/correlation) agar selaras dengan output SPSS.
//     let matrix_type = if config.extraction.covariance { "covariance" } else { "correlation" };
//     let base_matrix = calculate_matrix(&data_matrix, matrix_type)?;
//     let extraction_result = extract_factors(&base_matrix, config, &var_names)?;
//     let rotation_result = rotate_factors(&extraction_result, config)?;
    
//     // Pattern Matrix (Loadings)
//     let mut pattern_matrix = rotation_result.rotated_loadings.clone();
//     let (n_rows_load, n_cols_load) = pattern_matrix.shape();

//     // Rescale loadings & communalities when covariance extraction is used
//     let mut rescaled_communalities = extraction_result.communalities.clone();
//     if config.extraction.covariance {
//         for i in 0..n_rows_load {
//             let variance = base_matrix[(i, i)];
//             if variance > 0.0 {
//                 let std_dev = variance.sqrt();
//                 for j in 0..n_cols_load {
//                     pattern_matrix[(i, j)] /= std_dev;
//                 }
//                 rescaled_communalities[i] = extraction_result.communalities[i] / variance;
//             }
//         }
//     }
    
//     // 2. Initial Sign Flipping (Standar SPSS pada Loading)
//     for col in 0..n_cols_load {
//         let mut sum_cubes = 0.0;
//         for row in 0..n_rows_load {
//             sum_cubes += pattern_matrix[(row, col)].powi(3);
//         }
//         if sum_cubes < 0.0 {
//             for row in 0..n_rows_load {
//                 pattern_matrix[(row, col)] *= -1.0;
//             }
//         }
//     }

//     let n_rows = pattern_matrix.nrows();
//     let n_cols = pattern_matrix.ncols();
//     let mut coefficients = DMatrix::zeros(n_rows, n_cols);

//     // Persiapan Matriks Uniqueness (U^-2) - Hanya dipakai Bartlett
//     let mut u_inv_squared = DMatrix::zeros(n_rows, n_rows);
//     for i in 0..n_rows {
//         let h2 = if config.extraction.covariance {
//             if i < rescaled_communalities.len() {
//                 rescaled_communalities[i]
//             } else {
//                 0.0
//             }
//         } else if i < extraction_result.communalities.len() {
//             extraction_result.communalities[i]
//         } else {
//             0.0
//         };
//         let u2 = (1.0 - h2).max(1e-9); 
//         u_inv_squared[(i, i)] = 1.0 / u2;
//     }

//     // -----------------------------------------------------------
//     // LOGIKA UTAMA SKOR FAKTOR
//     // -----------------------------------------------------------

//     // A. Hitung Regression Coefficients (Base untuk Regression & Anderson)
//     // Rumus: B_reg = R^-1 * S
//     let mut regression_coeffs = DMatrix::zeros(n_rows, n_cols);
//     let inv_r = r_matrix.clone().try_inverse();

//     if config.scores.regression || config.scores.anderson {
//         let r_inverse = inv_r.clone().ok_or("Could not invert correlation matrix.")?;
        
//         // Structure Matrix (S)
//         let structure_matrix = if let Some(phi) = &rotation_result.factor_correlations {
//             &pattern_matrix * phi
//         } else {
//             pattern_matrix.clone()
//         };

//         let s_t_r_inv_s = structure_matrix.transpose() * &r_inverse * &structure_matrix;
//         let s_t_r_inv_s_inv = s_t_r_inv_s
//             .try_inverse()
//             .ok_or("Could not invert S'R^-1S matrix for regression scores.")?;
        
//         regression_coeffs = r_inverse * structure_matrix * s_t_r_inv_s_inv;
//     }

//     if config.scores.regression {
//         // --- METODE 1: REGRESSION ---
//         coefficients = regression_coeffs;

//     } else if config.scores.bartlett {
//         // --- METODE 2: BARTLETT ---
//         // W = U^-2 * P * (P' * U^-2 * P)^-1
//         let p = &pattern_matrix;
//         let p_t = p.transpose();
        
//         let term_inner = &p_t * &u_inv_squared * p;
//         let term_inner_inv = term_inner.try_inverse()
//             .ok_or("Could not invert matrix for Bartlett Scores.")?;
            
//         coefficients = &u_inv_squared * p * term_inner_inv;

//     } else if config.scores.anderson {
//         // --- METODE 3: ANDERSON-RUBIN (PERBAIKAN FINAL) ---
//         // Gunakan "Orthonormalized Regression Scores".
//         // Ini bekerja sempurna untuk PCA (dimana Bartlett gagal) DAN ULS.
//         // Formula: W = B_reg * (B_reg' * R * B_reg)^(-1/2)
        
//         let b = &regression_coeffs; // Gunakan koefisien regresi yang sudah dihitung di atas
        
//         // Hitung Kovarians antar skor regresi: G = B' * R * B
//         let g_matrix = b.transpose() * &r_matrix * b;

//         // Hitung G^(-1/2) untuk menghilangkan korelasi
//         let g_sqrt = symmetric_matrix_sqrt_robust(&g_matrix)
//             .ok_or("Failed Anderson-Rubin sqrt. Matrix G unstable.")?;
            
//         let g_sqrt_inv = g_sqrt.try_inverse()
//             .ok_or("Failed Anderson-Rubin inversion.")?;

//         // Hasil Akhir
//         coefficients = b * g_sqrt_inv;
//     }

//     // --- STEP AKHIR: ALIGNMENT CHECK ---
//     // Memastikan tanda (+/-) sama dengan SPSS
//     align_coefficients_direction(&mut coefficients, &pattern_matrix);

//     // Standarisasi koefisien agar varians skor faktor = 1.0 (SPSS-style)
//     let score_cov = coefficients.transpose() * &r_matrix * &coefficients;
//     let n_cols_coeff = coefficients.ncols();
//     for j in 0..n_cols_coeff {
//         let var_val = score_cov[(j, j)];
//         if var_val > 0.0 {
//             let scale = 1.0 / var_val.sqrt();
//             for i in 0..coefficients.nrows() {
//                 coefficients[(i, j)] *= scale;
//             }
//         }
//     }

//     // --- Formatting Output ---
//     let mut result = ComponentScoreCoefficientMatrix {
//         components: HashMap::new(),
//         variable_order: var_names.clone(),
//     };
//     for (i, var_name) in var_names.iter().enumerate() {
//         if i < coefficients.nrows() {
//             let mut row = Vec::with_capacity(n_cols);
//             for j in 0..n_cols {
//                 row.push(coefficients[(i, j)]);
//             }
//             result.components.insert(var_name.clone(), row);
//         }
//     }
//     result.variable_order = var_names;
//     Ok(result)
// }



// =========================================================================
// FUNGSI UTAMA: Calculate Score Coefficients
// =========================================================================
pub fn calculate_component_score_coefficient_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ComponentScoreCoefficientMatrix, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    
    // 1. Matriks Korelasi (R)
    let r_matrix = calculate_matrix(&data_matrix, "correlation")?;

    let matrix_type = if config.extraction.covariance { "covariance" } else { "correlation" };
    let base_matrix = calculate_matrix(&data_matrix, matrix_type)?;
    let extraction_result = extract_factors(&base_matrix, config, &var_names)?;
    let rotation_result = rotate_factors(&extraction_result, config)?;
    
    // Pattern Matrix (Loadings)
    let mut pattern_matrix = rotation_result.rotated_loadings.clone();
    let (n_rows_load, n_cols_load) = pattern_matrix.shape();

    // Rescale loadings & communalities when covariance extraction is used
    let mut rescaled_communalities = extraction_result.communalities.clone();
    if config.extraction.covariance {
        for i in 0..n_rows_load {
            let variance = base_matrix[(i, i)];
            if variance > 0.0 {
                let std_dev = variance.sqrt();
                for j in 0..n_cols_load {
                    pattern_matrix[(i, j)] /= std_dev;
                }
                rescaled_communalities[i] = extraction_result.communalities[i] / variance;
            }
        }
    }
    
    // ---> (Sign Flipping di sini sudah DIHAPUS karena P sudah standar SPSS) <---

    let n_rows = pattern_matrix.nrows();
    let n_cols = pattern_matrix.ncols();
    let mut coefficients = DMatrix::zeros(n_rows, n_cols);

//     // Persiapan Matriks Uniqueness (U^-2)
//     let mut u_inv_squared = DMatrix::zeros(n_rows, n_rows);
//     for i in 0..n_rows {
//         let h2 = if config.extraction.covariance {
//             if i < rescaled_communalities.len() { rescaled_communalities[i] } else { 0.0 }
//         } else if i < extraction_result.communalities.len() {
//             extraction_result.communalities[i]
//         } else { 0.0 };
//         let u2 = (1.0 - h2).max(1e-9); 
//         u_inv_squared[(i, i)] = 1.0 / u2;
//     }

//     let mut regression_coeffs = DMatrix::zeros(n_rows, n_cols);
//     let inv_r = r_matrix.clone().try_inverse();

//     if config.scores.regression || config.scores.anderson {
//         let r_inverse = inv_r.clone().ok_or("Could not invert correlation matrix.")?;
        
//         let structure_matrix = if let Some(phi) = &rotation_result.factor_correlations {
//             &pattern_matrix * phi
//         } else {
//             pattern_matrix.clone()
//         };

//         let s_t_r_inv_s = structure_matrix.transpose() * &r_inverse * &structure_matrix;
//         let s_t_r_inv_s_inv = s_t_r_inv_s
//             .try_inverse()
//             .ok_or("Could not invert S'R^-1S matrix for regression scores.")?;
        
//         regression_coeffs = r_inverse * structure_matrix * s_t_r_inv_s_inv;
//     }

//     if config.scores.regression {
//         coefficients = regression_coeffs;
//     } else if config.scores.bartlett {
//         let p = &pattern_matrix;
//         let p_t = p.transpose();
//         let term_inner = &p_t * &u_inv_squared * p;
//         let term_inner_inv = term_inner.try_inverse().ok_or("Could not invert matrix for Bartlett Scores.")?;
//         coefficients = &u_inv_squared * p * term_inner_inv;
//     } else if config.scores.anderson {
//         let b = &regression_coeffs; 
//         let g_matrix = b.transpose() * &r_matrix * b;
//         let g_sqrt = symmetric_matrix_sqrt_robust(&g_matrix).ok_or("Failed Anderson-Rubin sqrt. Matrix G unstable.")?;
//         let g_sqrt_inv = g_sqrt.try_inverse().ok_or("Failed Anderson-Rubin inversion.")?;
//         coefficients = b * g_sqrt_inv;
//     }

//     // ---> (Alignment Check di sini sudah DIHAPUS agar tidak meng-overide) <---

//     // Standarisasi koefisien agar varians skor faktor = 1.0 (SPSS-style)
//     let score_cov = coefficients.transpose() * &r_matrix * &coefficients;
//     let n_cols_coeff = coefficients.ncols();
//     for j in 0..n_cols_coeff {
//         let var_val = score_cov[(j, j)];
//         if var_val > 0.0 {
//             let scale = 1.0 / var_val.sqrt();
//             for i in 0..coefficients.nrows() {
//                 coefficients[(i, j)] *= scale;
//             }
//         }
//     }

//     let mut result = ComponentScoreCoefficientMatrix {
//         components: std::collections::HashMap::new(),
//         variable_order: var_names.clone(),
//     };
//     for (i, var_name) in var_names.iter().enumerate() {
//         if i < coefficients.nrows() {
//             let mut row = Vec::with_capacity(n_cols);
//             for j in 0..n_cols {
//                 row.push(coefficients[(i, j)]);
//             }
//             result.components.insert(var_name.clone(), row);
//         }
//     }
//     result.variable_order = var_names;
//     Ok(result)
// }

    // Persiapan Matriks Uniqueness (U^-2)
    let mut u_inv_squared = DMatrix::zeros(n_rows, n_rows);
    for i in 0..n_rows {
        let h2 = if config.extraction.covariance {
            if i < rescaled_communalities.len() { rescaled_communalities[i] } else { 0.0 }
        } else if i < extraction_result.communalities.len() {
            extraction_result.communalities[i]
        } else { 0.0 };
        let u2 = (1.0 - h2).max(1e-9); 
        u_inv_squared[(i, i)] = 1.0 / u2;
    }

    let mut regression_coeffs = DMatrix::zeros(n_rows, n_cols);
    let inv_r = r_matrix.clone().try_inverse();

    if config.scores.regression || config.scores.anderson {
        let r_inverse = inv_r.clone().ok_or("Could not invert correlation matrix.")?;
        
        let structure_matrix = if let Some(phi) = &rotation_result.factor_correlations {
            &pattern_matrix * phi
        } else {
            pattern_matrix.clone()
        };

        // --- PERBAIKAN: Rumus metode regresi yang benar (R^-1 * S) ---
        regression_coeffs = &r_inverse * &structure_matrix;
    }

    if config.scores.regression {
        coefficients = regression_coeffs.clone();
    } else if config.scores.bartlett {
        let p = &pattern_matrix;
        let p_t = p.transpose();
        let term_inner = &p_t * &u_inv_squared * p;
        let term_inner_inv = term_inner.try_inverse().ok_or("Could not invert matrix for Bartlett Scores.")?;
        coefficients = &u_inv_squared * p * term_inner_inv;
    } else if config.scores.anderson {
        let b = &regression_coeffs; 
        let g_matrix = b.transpose() * &r_matrix * b;
        let g_sqrt = symmetric_matrix_sqrt_robust(&g_matrix).ok_or("Failed Anderson-Rubin sqrt. Matrix G unstable.")?;
        let g_sqrt_inv = g_sqrt.try_inverse().ok_or("Failed Anderson-Rubin inversion.")?;
        coefficients = b * g_sqrt_inv;
    }

    // --- PERBAIKAN: Hanya paksa diagonal menjadi 1.0 jika metode adalah PCA ---
    // SPSS TIDAK menstandardisasi koefisien matriks ULS/PAF/ML.
    let is_pca = matches!(config.extraction.method, ExtractionMethod::PrincipalComponents);
    if is_pca {
        let score_cov = coefficients.transpose() * &r_matrix * &coefficients;
        let n_cols_coeff = coefficients.ncols();
        for j in 0..n_cols_coeff {
            let var_val = score_cov[(j, j)];
            if var_val > 0.0 {
                let scale = 1.0 / var_val.sqrt();
                for i in 0..coefficients.nrows() {
                    coefficients[(i, j)] *= scale;
                }
            }
        }
    }

    let mut result = ComponentScoreCoefficientMatrix {
        components: std::collections::HashMap::new(),
        variable_order: var_names.clone(),
    };
    for (i, var_name) in var_names.iter().enumerate() {
        if i < coefficients.nrows() {
            let mut row = Vec::with_capacity(n_cols);
            for j in 0..n_cols {
                row.push(coefficients[(i, j)]);
            }
            result.components.insert(var_name.clone(), row);
        }
    }
    result.variable_order = var_names;
    Ok(result)
}


pub fn calculate_component_score_covariance_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ComponentScoreCovarianceMatrix, String> {
    
    // 1. Dapatkan Matriks Korelasi (R)
    let (data_matrix, _var_names) = extract_data_matrix(data, config)?;
    let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;

    // 2. Dapatkan Matriks Koefisien Skor (W)
    // PENTING: Kita panggil fungsi yang SUDAH DIPERBAIKI sebelumnya.
    // Ini menjamin logika Regression/Anderson/Bartlett dan Sign Alignment-nya sama persis.
    let coeff_result = calculate_component_score_coefficient_matrix(data, config)?;
    
    // Konversi HashMap hasil coeff_result kembali ke DMatrix untuk perhitungan
    let n_vars = corr_matrix.nrows();
    // Hitung jumlah faktor (dari elemen pertama hashmap)
    let n_factors = coeff_result.components.values().next().map(|v| v.len()).unwrap_or(0);
    
    if n_factors == 0 {
        return Err("No factors found for covariance calculation".to_string());
    }

    // Susun matriks W (Coefficients) sesuai urutan variabel matriks korelasi
    let mut w_matrix = DMatrix::zeros(n_vars, n_factors);
    // coeff_result.variable_order harus sama urutannya dengan data_matrix
    // Kita asumsikan urutan var_names di extract_data_matrix sama dengan di coeff_result
    for (row_idx, var_name) in coeff_result.variable_order.iter().enumerate() {
        if let Some(vals) = coeff_result.components.get(var_name) {
            for (col_idx, &val) in vals.iter().enumerate() {
                if col_idx < n_factors {
                    w_matrix[(row_idx, col_idx)] = val;
                }
            }
        }
    }

    // 3. Hitung Covariance Matrix
    // RUMUS BENAR: Cov = W' * R * W
    let covariance_matrix = w_matrix.transpose() * &corr_matrix * &w_matrix;

    // 4. Format Output ke Struct JSON
    let mut output_components = Vec::new();
    let n_out_rows = covariance_matrix.nrows();
    let n_out_cols = covariance_matrix.ncols();

    for i in 0..n_out_rows {
        let mut row = Vec::new();
        for j in 0..n_out_cols {
            row.push(covariance_matrix[(i, j)]);
        }
        output_components.push(row);
    }

    Ok(ComponentScoreCovarianceMatrix {
        components: output_components,
    })
}







pub fn calculate_factor_scores(
    data: &AnalysisData,
    config: &FactorAnalysisConfig,
    coefficients_matrix: &ComponentScoreCoefficientMatrix,
) -> Result<HashMap<String, Vec<f64>>, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let n_rows = data_matrix.nrows();
    let n_cols = data_matrix.ncols();
    let mut z_matrix = DMatrix::zeros(n_rows, n_cols);
    for j in 0..n_cols {
        let col = data_matrix.column(j);
        let sum: f64 = col.sum();
        let mean = sum / n_rows as f64;
        let mut sum_sq_diff = 0.0;
        for i in 0..n_rows {
            sum_sq_diff += (col[i] - mean).powi(2);
        }
        let std_dev = (sum_sq_diff / (n_rows as f64 - 1.0)).sqrt();
        let divisor = if std_dev == 0.0 { 1.0 } else { std_dev };
        for i in 0..n_rows {
            z_matrix[(i, j)] = (col[i] - mean) / divisor;
        }
    }

    let n_factors = coefficients_matrix.components.values().next().map(|v| v.len()).unwrap_or(0);
    if n_factors == 0 {
        return Err("No factors found in coefficient matrix".to_string());
    }

    let mut coeff_mat = DMatrix::zeros(n_cols, n_factors);
    for (row_idx, var_name) in var_names.iter().enumerate() {
        if let Some(coeffs) = coefficients_matrix.components.get(var_name) {
            for (col_idx, &val) in coeffs.iter().enumerate() {
                if col_idx < n_factors {
                    coeff_mat[(row_idx, col_idx)] = val;
                }
            }
        }
    }

    let scores_matrix = z_matrix * coeff_mat;
    let mut result_scores = HashMap::new();
    for factor_idx in 0..n_factors {
        let factor_name = format!("FAC{}_1", factor_idx + 1);
        let mut factor_values = Vec::with_capacity(n_rows);
        for row_idx in 0..n_rows {
            factor_values.push(scores_matrix[(row_idx, factor_idx)]);
        }
        result_scores.insert(factor_name, factor_values);
    }
    Ok(result_scores)
}

// pub fn symmetric_matrix_sqrt(matrix: &DMatrix<f64>) -> Option<DMatrix<f64>> {
//     let n = matrix.nrows();
//     if n != matrix.ncols() { return None; }
//     let eigen = matrix.clone().symmetric_eigen();
//     let mut d_sqrt = DMatrix::zeros(n, n);
//     for i in 0..n {
//         if eigen.eigenvalues[i] < 0.0 { return None; }
//         d_sqrt[(i, i)] = eigen.eigenvalues[i].sqrt();
//     }
//     Some(eigen.eigenvectors.clone() * d_sqrt * eigen.eigenvectors.transpose())
// }

pub fn create_rotated_component_matrix(
    rotation_result: &RotationResult,
    var_names: &[String]
) -> RotatedComponentMatrix {
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
    RotatedComponentMatrix {
        components,
        variable_order: var_names.to_vec(),
    }
}

pub fn create_component_transformation_matrix(
    rotation_result: &RotationResult
) -> ComponentTransformationMatrix {
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
    ComponentTransformationMatrix { components }
}

pub fn create_pattern_matrix(
    rotation_result: &RotationResult,
    var_names: &[String]
) -> PatternMatrix {
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
    PatternMatrix {
        components,
        variable_order: var_names.to_vec(),
    }
}

pub fn create_structure_matrix(
    rotation_result: &RotationResult,
    var_names: &[String]
) -> StructureMatrix {
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
    StructureMatrix {
        components,
        variable_order: var_names.to_vec(),
    }
}

pub fn create_component_correlation_matrix(
    rotation_result: &RotationResult
) -> ComponentCorrelationMatrix {
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
    ComponentCorrelationMatrix { correlations }
}

// #[cfg(test)]
// mod tests {
//     use super::calculate_total_variance_explained;

//     #[test]
//     fn total_variance_uses_rotation_values_when_provided() {
//         let initial_eigenvalues = vec![3.6998, 2.2083, 1.1612];
//         let extraction_eigenvalues = vec![3.6998, 2.2083, 1.1612];
//         let rotation_eigenvalues = vec![2.6950, 2.6269, 1.7474];

//         let result = calculate_total_variance_explained(
//             &initial_eigenvalues,
//             &extraction_eigenvalues,
//             Some(&rotation_eigenvalues),
//             8.0,
//             8,
//             "correlation",
//             false,
//         );

//         let block = &result.blocks[0];
//         let rotation = block.rotation.as_ref().expect("rotation block must exist");

//         assert!((rotation[0].total - 2.6950).abs() < 1e-9);
//         assert!((rotation[1].total - 2.6269).abs() < 1e-9);
//         assert!((rotation[2].total - 1.7474).abs() < 1e-9);

//         assert!((rotation[0].total - block.extraction[0].total).abs() > 1e-6);
//         assert!((rotation[1].total - block.extraction[1].total).abs() > 1e-6);
//     }

//     #[test]
//     fn total_variance_rotation_none_when_not_provided() {
//         let initial_eigenvalues = vec![3.6998, 2.2083, 1.1612];
//         let extraction_eigenvalues = vec![3.6998, 2.2083, 1.1612];

//         let result = calculate_total_variance_explained(
//             &initial_eigenvalues,
//             &extraction_eigenvalues,
//             None,
//             8.0,
//             8,
//             "correlation",
//             false,
//         );

//         assert!(result.blocks[0].rotation.is_none());
//     }
// }



#[cfg(test)]
mod tests {
    use super::calculate_total_variance_explained;

    #[test]
    fn total_variance_uses_rotation_values_when_provided() {
        let initial_eigenvalues = vec![3.6998, 2.2083, 1.1612];
        let extraction_eigenvalues = vec![3.6998, 2.2083, 1.1612];
        let rotation_eigenvalues = vec![2.6950, 2.6269, 1.7474];

        let result = calculate_total_variance_explained(
            &initial_eigenvalues,
            &extraction_eigenvalues,
            Some(&rotation_eigenvalues),
            8.0,
            8,
            "correlation",
            false,
            None, // UPDATE Parameter
            None, // UPDATE Parameter
        );

        let block = &result.blocks[0];
        let rotation = block.rotation.as_ref().expect("rotation block must exist");

        assert!((rotation[0].total - 2.6950).abs() < 1e-9);
        assert!((rotation[1].total - 2.6269).abs() < 1e-9);
        assert!((rotation[2].total - 1.7474).abs() < 1e-9);

        assert!((rotation[0].total - block.extraction[0].total).abs() > 1e-6);
        assert!((rotation[1].total - block.extraction[1].total).abs() > 1e-6);
    }

    #[test]
    fn total_variance_rotation_none_when_not_provided() {
        let initial_eigenvalues = vec![3.6998, 2.2083, 1.1612];
        let extraction_eigenvalues = vec![3.6998, 2.2083, 1.1612];

        let result = calculate_total_variance_explained(
            &initial_eigenvalues,
            &extraction_eigenvalues,
            None,
            8.0,
            8,
            "correlation",
            false,
            None, // UPDATE Parameter
            None, // UPDATE Parameter
        );

        assert!(result.blocks[0].rotation.is_none());
    }
}
