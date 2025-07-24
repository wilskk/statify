use nalgebra::{ DMatrix, DVector };
use std::collections::HashMap;

use crate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ DesignMatrixInfo, SweptMatrixInfo },
};

use super::core::*;

/// Membuat matriks desain, vektor respons, dan bobot dari data analisis.
///
/// # Parameter
///
/// * `data` - Data analisis yang berisi variabel dependen dan kovariat
/// * `config` - Konfigurasi untuk analisis univariat
///
/// # Hasil
///
/// `DesignMatrixInfo` yang berisi:
/// - x: Matriks desain
/// - y: Vektor respons
/// - w: Vektor bobot opsional
/// - n_samples: Jumlah sampel
/// - p_parameters: Jumlah parameter
/// - r_x_rank: Rank dari matriks desain
/// - term_column_indices: Peta indeks kolom untuk setiap istilah
/// - intercept_column: Indeks kolom untuk intercept (jika ada)
/// - term_names: Nama-nama istilah dalam model
/// - case_indices_to_keep: Indeks kasus yang digunakan dalam analisis
pub fn create_design_response_weights(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<DesignMatrixInfo, String> {
    let dep_var_name = config.main.dep_var
        .as_ref()
        .ok_or_else(|| "Dependent variable not specified.".to_string())?;

    let mut y_values: Vec<f64> = Vec::new();
    let mut wls_weights: Option<Vec<f64>> = if config.main.wls_weight.is_some() {
        Some(Vec::new())
    } else {
        None
    };
    let mut case_indices_to_keep: Vec<usize> = Vec::new();

    for (i, record) in data.dependent_data[0].iter().enumerate() {
        if let Some(dep_val) = extract_numeric_from_record(record, dep_var_name) {
            if let Some(wls_var_name) = &config.main.wls_weight {
                if let Some(wls_val) = extract_numeric_from_record(record, wls_var_name) {
                    if wls_val > 0.0 {
                        y_values.push(dep_val);
                        wls_weights.as_mut().unwrap().push(wls_val);
                        case_indices_to_keep.push(i);
                    }
                } else {
                    return Err(format!("Non-numeric WLS weight for case {}", i));
                }
            } else {
                y_values.push(dep_val);
                case_indices_to_keep.push(i);
            }
        } else {
            return Err(format!("Non-numeric dependent variable value for case {}", i));
        }
    }

    let n_samples_effective = y_values.len();
    if n_samples_effective == 0 {
        return Ok(DesignMatrixInfo {
            x: DMatrix::zeros(0, 0),
            y: DVector::zeros(0),
            w: None,
            n_samples: 0,
            p_parameters: 0,
            r_x_rank: 0,
            term_column_indices: HashMap::new(),
            intercept_column: None,
            term_names: Vec::new(),
            case_indices_to_keep: Vec::new(),
        });
    }

    let y_nalgebra = DVector::from_vec(y_values);
    let w_nalgebra_opt = wls_weights.map(DVector::from_vec);

    // Generate model terms using existing functions
    let mut model_terms = Vec::new();
    if config.model.intercept {
        model_terms.push("Intercept".to_string());
    }

    if config.model.non_cust {
        model_terms.extend(generate_non_cust_terms(config)?);
    } else if config.model.custom || config.model.build_custom_term {
        model_terms.extend(generate_custom_terms(config)?);
    }

    let mut x_matrix_cols: Vec<DVector<f64>> = Vec::new();
    let mut term_column_map: HashMap<String, (usize, usize)> = HashMap::new();
    let mut current_col_idx = 0;
    let mut intercept_col_idx: Option<usize> = None;
    let mut final_term_names: Vec<String> = Vec::new();

    for term_name in &model_terms {
        final_term_names.push(term_name.clone());
        let term_start_col = current_col_idx;
        let mut term_matrix_cols: Vec<DVector<f64>> = Vec::new();

        if term_name == "Intercept" {
            if config.model.intercept {
                let intercept_vec = DVector::from_element(n_samples_effective, 1.0);
                term_matrix_cols.push(intercept_vec);
            } else {
                continue;
            }
        } else if config.main.covar.as_ref().map_or(false, |c| c.contains(term_name)) {
            let mut cov_values_filtered: Vec<f64> = Vec::with_capacity(case_indices_to_keep.len());
            if let Some(cov_data_set_option) = &data.covariate_data {
                if let Some(cov_data_set) = cov_data_set_option.get(0) {
                    for &idx_to_keep in &case_indices_to_keep {
                        if let Some(record) = cov_data_set.get(idx_to_keep) {
                            if let Some(val) = extract_numeric_from_record(record, term_name) {
                                cov_values_filtered.push(val);
                            } else {
                                return Err(format!("Non-numeric covariate '{}'", term_name));
                            }
                        } else {
                            return Err(
                                format!("Record index {} out of bounds for covariate data (original case index)", idx_to_keep)
                            );
                        }
                    }
                } else {
                    return Err(format!("No data found for covariate '{}'", term_name));
                }
            } else {
                return Err(
                    format!("Covariate data structure (covariate_data) is None, but covariate '{}' was specified.", term_name)
                );
            }
            if !cov_values_filtered.is_empty() {
                term_matrix_cols.push(DVector::from_vec(cov_values_filtered));
            }
        } else if term_name.contains('*') {
            let factors = parse_interaction_term(term_name);
            let mut interaction_rows = Vec::new();

            // Get all possible combinations of factor levels
            let mut factor_levels = Vec::new();
            for factor in &factors {
                let levels = get_factor_levels(data, factor)?;
                factor_levels.push((factor.clone(), levels));
            }

            let mut level_combinations = Vec::new();
            generate_level_combinations(
                &factor_levels,
                &mut HashMap::new(),
                0,
                &mut level_combinations
            );

            // Create design matrix rows for each combination
            for combo in &level_combinations {
                let row = matches_combination(combo, data);
                if !row.is_empty() {
                    interaction_rows.push(row);
                }
            }

            if !interaction_rows.is_empty() {
                for row in interaction_rows {
                    term_matrix_cols.push(DVector::from_vec(row));
                }
            }
        } else {
            // Handle main effects
            let levels = get_factor_levels(data, term_name)?;

            // Create columns for ALL levels observed in the data for this factor
            for level in levels {
                let mut combo = HashMap::new();
                combo.insert(term_name.clone(), level);
                let row = matches_combination(&combo, data);
                term_matrix_cols.push(DVector::from_vec(row));
            }
        }

        if !term_matrix_cols.is_empty() {
            for col_vec in term_matrix_cols {
                if col_vec.len() == n_samples_effective {
                    x_matrix_cols.push(col_vec);
                    current_col_idx += 1;
                } else if col_vec.len() == 0 {
                    // This column was empty (e.g. factor level with no data, or aliased out entirely before full matrix built)
                    // Do not add it, do not increment current_col_idx
                } else {
                    return Err(
                        format!(
                            "Column for term '{}' has incorrect length {} (expected {}).",
                            term_name,
                            col_vec.len(),
                            n_samples_effective
                        )
                    );
                }
            }
            if current_col_idx > term_start_col {
                // Only add to map if columns were actually added
                term_column_map.insert(term_name.clone(), (term_start_col, current_col_idx - 1));
            }
        }
    }

    let x_nalgebra = if !x_matrix_cols.is_empty() {
        DMatrix::from_columns(&x_matrix_cols)
    } else {
        DMatrix::zeros(n_samples_effective, 0)
    };

    let p_parameters = x_nalgebra.ncols();
    let r_x_rank = if p_parameters > 0 { x_nalgebra.rank(1e-10) } else { 0 };

    if
        config.model.intercept &&
        x_nalgebra.ncols() > 0 &&
        model_terms.get(0) == Some(&"Intercept".to_string())
    {
        if let Some((start, end)) = term_column_map.get("Intercept") {
            if *start == 0 && *end == 0 {
                intercept_col_idx = Some(0);
            }
        }
    }

    Ok(DesignMatrixInfo {
        x: x_nalgebra,
        y: y_nalgebra,
        w: w_nalgebra_opt,
        n_samples: n_samples_effective,
        p_parameters,
        r_x_rank,
        term_column_indices: term_column_map,
        intercept_column: intercept_col_idx,
        term_names: final_term_names,
        case_indices_to_keep,
    })
}

/// Membuat matriks hasil perkalian silang Z'WZ dimana Z = [X Y].
///
/// Fungsi ini membangun matriks Z'WZ yang menjadi pusat operasi sweep Gauss-Jordan.
/// Z dibentuk dengan menggabungkan matriks desain X dan vektor respons Y:
/// Z = [X Y]
///
/// Matriks Z'WZ yang dihasilkan memiliki struktur:
/// ```text
/// [  X'WX    X'WY  ]
/// [  Y'WX    Y'WY  ]
/// ```
///
/// Ketika Z'WZ di-sweep pada p baris dan kolom pertama (dimana p adalah jumlah parameter),
/// menghasilkan matriks G, B̂, dan S seperti yang dijelaskan dalam fungsi perform_sweep_and_extract_results.
///
/// # Parameter
///
/// * `design_info` - Berisi matriks desain X, vektor respons Y, dan bobot opsional W
///
/// # Hasil
///
/// Matriks Z'WZ yang akan digunakan sebagai input untuk operasi sweep
pub fn create_cross_product_matrix(design_info: &DesignMatrixInfo) -> Result<DMatrix<f64>, String> {
    let x = &design_info.x;
    let y = &design_info.y;
    let n = design_info.n_samples;
    let p = design_info.p_parameters;

    if n == 0 {
        return Ok(DMatrix::zeros(p + 1, p + 1));
    }

    let mut z_parts: Vec<DMatrix<f64>> = Vec::new();
    z_parts.push(x.clone_owned());
    let y_matrix = DMatrix::from_column_slice(y.nrows(), 1, y.as_slice());
    z_parts.push(y_matrix);

    let z_columns: Vec<_> = z_parts
        .iter()
        .flat_map(|m| m.column_iter())
        .collect();
    let z = DMatrix::from_columns(&z_columns);

    if let Some(w_vec) = &design_info.w {
        if w_vec.len() != n {
            return Err("Weight vector length mismatch for Z'WZ.".to_string());
        }
        let w_diag = DMatrix::from_diagonal(w_vec);
        let ztwz = z.transpose() * w_diag * z;
        Ok(ztwz)
    } else {
        let ztz = z.transpose() * z;
        Ok(ztz)
    }
}

/// Melakukan operasi sweep pada matriks Z'WZ dan mengekstrak hasilnya.
///
/// # Operasi Sweep
///
/// Operasi Sweep mengubah matriks Z'WZ (dimana Z = [X Y]) menjadi bentuk yang
/// langsung memberikan estimasi parameter, invers g₂, dan jumlah kuadrat residual.
///
/// Setelah melakukan sweep pada p baris dan kolom pertama dari Z'WZ, matriks yang dihasilkan memiliki bentuk:
/// ```text
/// [  -G    B̂  ]
/// [  B̂'    S  ]
/// ```
/// dimana:
/// - G adalah invers umum g₂ simetris p×p dari X'WX
/// - B̂ adalah matriks p×r dari estimasi parameter
/// - S adalah matriks simetris r×r dari jumlah kuadrat dan perkalian silang residual
///
/// # Algoritma
///
/// Implementasi ini didasarkan pada Algoritma AS 178: "Operator Sweep Gauss-Jordan
/// dengan Deteksi Kolinearitas" oleh M.R.B. Clarke (1982) yang diterbitkan dalam Journal of
/// the Royal Statistical Society. Series C (Applied Statistics).
///
/// Untuk setiap baris/kolom k yang di-sweep:
/// 1. Jika elemen pivot c[k,k] mendekati nol, parameter kemungkinan kolinear
/// 2. Jika tidak, lakukan operasi sweep standar:
///    - c[k,k] = -1/c[k,k]
///    - Untuk elemen lain dalam baris k: c[k,j] = c[k,j]/d
///    - Untuk elemen lain dalam kolom k: c[i,k] = c[i,k]/d
///    - Untuk semua elemen lainnya: c[i,j] = c[i,j] + c[i,k] * c[k,j] * d
///
/// # Parameter
///
/// * `ztwz_matrix` - Matriks Z'WZ dimana Z = [X Y]
/// * `p_params_in_model` - Jumlah parameter p dalam model (kolom dari X)
///
/// # Hasil
///
/// `SweptMatrixInfo` yang berisi:
/// - g_inv: Matriks G (dinegasikan dari hasil sweep langsung)
/// - beta_hat: Matriks B̂ dari estimasi parameter
/// - s_rss: Matriks S (dalam implementasi ini, hanya elemen pertama dari S yang merupakan jumlah kuadrat residual)
///
/// # Referensi
///
/// - Clarke, M.R.B. (1982) "Algoritma AS 178: Operator Sweep Gauss-Jordan dengan Deteksi Kolinearitas"
/// - Ridout, M.S. dan Cobby, J.M. (1989) "Catatan AS R78: Catatan tentang Algoritma AS 178"
pub fn perform_sweep_and_extract_results(
    ztwz_matrix: &DMatrix<f64>,
    p_params_in_model: usize
) -> Result<SweptMatrixInfo, String> {
    if p_params_in_model == 0 {
        let s_rss = if ztwz_matrix.nrows() == 1 && ztwz_matrix.ncols() == 1 {
            ztwz_matrix[(0, 0)]
        } else if ztwz_matrix.nrows() > 0 && ztwz_matrix.ncols() > 0 {
            ztwz_matrix[(0, 0)]
        } else {
            0.0
        };
        return Ok(SweptMatrixInfo {
            g_inv: DMatrix::zeros(0, 0),
            beta_hat: DVector::zeros(0),
            s_rss,
        });
    }

    let total_dims = ztwz_matrix.nrows();
    if total_dims != p_params_in_model + 1 {
        return Err(
            format!(
                "Z'WZ matrix dimensions ({}x{}) inconsistent with p_params_in_model ({}). Expected {}x{}.",
                ztwz_matrix.nrows(),
                ztwz_matrix.ncols(),
                p_params_in_model,
                p_params_in_model + 1,
                p_params_in_model + 1
            )
        );
    }
    if ztwz_matrix.ncols() != total_dims {
        return Err(
            format!("Z'WZ matrix is not square ({}x{}).", ztwz_matrix.nrows(), ztwz_matrix.ncols())
        );
    }

    let mut c_matrix = ztwz_matrix.clone_owned();
    let mut swept_k_flags: Vec<bool> = vec![false; p_params_in_model];
    let mut original_diagonals: Vec<f64> = Vec::with_capacity(p_params_in_model);
    for k in 0..p_params_in_model {
        original_diagonals.push(c_matrix[(k, k)]);
    }
    let mut is_param_aliased: Vec<bool> = vec![false; p_params_in_model];
    let epsilon = 1e-12;

    for k in 0..p_params_in_model {
        let pivot_candidate = c_matrix[(k, k)];
        let s_k = original_diagonals[k];

        if pivot_candidate.abs() <= epsilon * s_k.abs() {
            is_param_aliased[k] = true;
            continue;
        }

        let is_inconsistent =
            (swept_k_flags[k] && pivot_candidate > epsilon) ||
            (!swept_k_flags[k] && pivot_candidate < -epsilon);
        if is_inconsistent {
            is_param_aliased[k] = true;
            continue;
        }

        let pivot_val = c_matrix[(k, k)];

        let mut old_col_k_vals = DVector::zeros(total_dims);
        let mut old_row_k_vals = DVector::zeros(total_dims);
        for i in 0..total_dims {
            old_col_k_vals[i] = c_matrix[(i, k)];
        }
        for j in 0..total_dims {
            old_row_k_vals[j] = c_matrix[(k, j)];
        }

        for i in 0..total_dims {
            if i == k {
                continue;
            }
            for j in 0..total_dims {
                if j == k {
                    continue;
                }
                c_matrix[(i, j)] -= (old_col_k_vals[i] * old_row_k_vals[j]) / pivot_val;
            }
        }

        for j in 0..total_dims {
            if j == k {
                continue;
            }
            c_matrix[(k, j)] /= pivot_val;
        }

        for i in 0..total_dims {
            if i == k {
                continue;
            }
            c_matrix[(i, k)] /= pivot_val;
        }

        c_matrix[(k, k)] = -1.0 / pivot_val;

        swept_k_flags[k] = !swept_k_flags[k];
    }

    let s_rss = c_matrix[(p_params_in_model, p_params_in_model)];

    let mut final_g_inv = DMatrix::zeros(p_params_in_model, p_params_in_model);
    let mut final_beta_hat = DVector::zeros(p_params_in_model);

    for i in 0..p_params_in_model {
        if !is_param_aliased[i] {
            final_beta_hat[i] = c_matrix[(i, p_params_in_model)];
            for j in 0..p_params_in_model {
                if !is_param_aliased[j] {
                    final_g_inv[(i, j)] = -c_matrix[(i, j)];
                } else {
                    final_g_inv[(i, j)] = 0.0;
                }
            }
        } else {
            final_beta_hat[i] = 0.0;
            for r in 0..p_params_in_model {
                final_g_inv[(i, r)] = 0.0;
                final_g_inv[(r, i)] = 0.0;
            }
        }
    }

    Ok(SweptMatrixInfo {
        g_inv: final_g_inv,
        beta_hat: final_beta_hat,
        s_rss,
    })
}

/// Create groups from design matrix for Levene test
pub fn create_groups_from_design_matrix(
    design_info: &DesignMatrixInfo,
    data: &[f64],
    indices: &[usize]
) -> Vec<Vec<f64>> {
    let mut groups: Vec<Vec<f64>> = Vec::new();
    let mut group_indices: Vec<Vec<usize>> = Vec::new();

    // Initialize groups based on design matrix
    for i in 0..design_info.x.nrows() {
        let mut found_group = false;
        for (_group_idx, group) in group_indices.iter_mut().enumerate() {
            if design_info.x.row(i) == design_info.x.row(group[0]) {
                group.push(i);
                found_group = true;
                break;
            }
        }
        if !found_group {
            group_indices.push(vec![i]);
        }
    }

    // Map indices to actual data values
    for group in group_indices {
        let mut group_data = Vec::new();
        for &idx in &group {
            if idx < indices.len() {
                let original_idx = indices[idx];
                if original_idx < data.len() {
                    group_data.push(data[original_idx]);
                }
            }
        }
        if !group_data.is_empty() {
            groups.push(group_data);
        }
    }

    groups
}
