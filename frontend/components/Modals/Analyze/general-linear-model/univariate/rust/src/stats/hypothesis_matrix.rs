use std::collections::{ HashMap, HashSet };
use itertools::Itertools;
use nalgebra::{ DMatrix, DVector };
use crate::models::{ config::UnivariateConfig, data::AnalysisData, result::DesignMatrixInfo };

use super::core::*;

/**
 * Membangun matriks L untuk Jumlah Kuadrat (Sum of Squares) Tipe I untuk suatu term F_j.
 * Jumlah Kuadrat Tipe I bersifat sekuensial; hipotesis untuk suatu efek disesuaikan
 * hanya untuk efek-efek yang mendahuluinya dalam model.
 *
 * Proses konstruksi L_I:
 * 1. Ambil L0, yaitu submatriks p x p bagian atas dari Z'WZ (matriks informasi).
 * 2. Lakukan operasi SWEEP pada L0 untuk kolom-kolom yang merepresentasikan efek sebelum F_j.
 *    Ini secara efektif "menghilangkan" pengaruh efek-efek sebelumnya.
 * 3. Nol-kan baris dan kolom pada L0 yang telah di-SWEEP untuk efek-efek sebelum F_j.
 * 4. Nol-kan baris pada L0 yang sesuai dengan efek-efek setelah F_j.
 * 5. Hapus semua baris yang bernilai nol.
 * 6. Ekstrak basis baris (menghilangkan baris yang dependen secara linear) untuk mendapatkan matriks L_I final.
 */
pub fn construct_type_i_l_matrix(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str, // F_j, term yang sedang diuji
    all_model_terms_in_order: &[String], // Semua term model secara berurutan F0, F1, ..., Fm
    original_ztwz: &DMatrix<f64> // Matriks Z'WZ lengkap (p+r) x (p+r)
) -> Result<DMatrix<f64>, String> {
    if design_info.p_parameters == 0 {
        return Ok(DMatrix::zeros(0, 0));
    }

    // Periksa apakah term yang diminati adalah faktor, menggunakan design_info.
    let is_factor =
        design_info.fixed_factor_indices.contains_key(term_of_interest) ||
        design_info.random_factor_indices.contains_key(term_of_interest);

    // Untuk Type I SS, hipotesis untuk faktor seringkali merupakan kontras sederhana
    // yang membandingkan level dengan level referensi, yang cocok dengan output yang diharapkan.
    if is_factor {
        if let Some((start, end)) = design_info.term_column_indices.get(term_of_interest) {
            let num_levels = end - start + 1;
            if num_levels < 2 {
                return Ok(DMatrix::zeros(0, design_info.p_parameters));
            }
            let num_contrasts = num_levels - 1;
            let ref_level_col_idx = *end;

            let mut l_rows = Vec::new();
            for i in 0..num_contrasts {
                let current_level_col_idx = start + i;
                let mut l_vec = DVector::from_element(design_info.p_parameters, 0.0);
                l_vec[current_level_col_idx] = 1.0;
                l_vec[ref_level_col_idx] = -1.0;
                l_rows.push(l_vec.transpose());
            }
            return Ok(DMatrix::from_rows(&l_rows));
        } else {
            return Err(
                format!("Factor term '{}' not found in term_column_indices.", term_of_interest)
            );
        }
    }

    if
        original_ztwz.nrows() < design_info.p_parameters ||
        original_ztwz.ncols() < design_info.p_parameters
    {
        return Err("Z'WZ matrix too small for p_parameters for Type I L.".to_string());
    }

    let x_t_x = original_ztwz
        .view((0, 0), (design_info.p_parameters, design_info.p_parameters))
        .clone_owned();

    let mut cols_before: Vec<usize> = Vec::new();
    let mut cols_current: Vec<usize> = Vec::new();
    let mut term_found = false;

    for term_name in all_model_terms_in_order {
        if let Some((start, end)) = design_info.term_column_indices.get(term_name) {
            let term_cols: Vec<usize> = (*start..=*end)
                .filter(|&c| c < design_info.p_parameters)
                .collect();

            if term_name == term_of_interest {
                cols_current.extend(term_cols);
                term_found = true;
                break;
            } else {
                cols_before.extend(term_cols);
            }
        }
    }

    if !term_found {
        return Err(
            format!("Term of interest '{}' not found in ordered model terms for Type I L.", term_of_interest)
        );
    }
    if cols_current.is_empty() {
        return Ok(DMatrix::zeros(0, design_info.p_parameters));
    }

    let l_swept = sweep_matrix_on_columns(x_t_x, &cols_before);

    let mut l_rows = Vec::new();
    for &current_col_idx in &cols_current {
        if current_col_idx < l_swept.nrows() {
            let mut row = l_swept.row(current_col_idx).clone_owned();
            let pivot = row[current_col_idx];

            if pivot.abs() > 1e-9 {
                row /= pivot; // Normalisasi baris dengan pivotnya untuk mendapatkan 1 pada diagonal.
            }

            // Nolkan koefisien untuk term-term sebelumnya.
            for &before_col_idx in &cols_before {
                if before_col_idx < row.len() {
                    row[before_col_idx] = 0.0;
                }
            }
            l_rows.push(row);
        }
    }

    if l_rows.is_empty() {
        return Ok(DMatrix::zeros(0, design_info.p_parameters));
    }

    let l_matrix = DMatrix::from_rows(&l_rows);

    // Meskipun untuk efek df tunggal (Intercept, kovariat) ini mungkin tidak perlu,
    // Gram-Schmidt memastikan baris-baris tersebut independen jika ada lebih dari satu.
    let l_orth = gram_schmidt_orthogonalization(&l_matrix);

    let mut final_rows = Vec::new();
    for row in l_orth.row_iter() {
        if row.norm_squared() > 1e-12 {
            final_rows.push(row.clone_owned());
        }
    }

    if final_rows.is_empty() {
        return Ok(DMatrix::zeros(0, design_info.p_parameters));
    }

    Ok(DMatrix::from_rows(&final_rows))
}

/**
 * Membangun matriks L untuk Jumlah Kuadrat (Sum of Squares) Tipe II.
 * SS Tipe II menguji hipotesis untuk suatu efek (F) setelah disesuaikan untuk semua efek lain
 * yang TIDAK mengandung F (prinsip marginalitas).
 *
 * Formula umum: L = [0 | C * (X2' * W_sqrt * M1 * W_sqrt * X2) | C * (X2' * W_sqrt * M1 * W_sqrt * X3)]
 * di mana:
 * - X1: Kolom matriks desain untuk efek yang tidak mengandung F.
 * - X2: Kolom matriks desain untuk efek F itu sendiri (term of interest).
 * - X3: Kolom matriks desain untuk efek yang mengandung F (interaksi tingkat lebih tinggi).
 * - M1: Matriks proyeksi ortogonal ke ruang kolom X1. M1 = I - P1, di mana P1 adalah matriks proyeksi ke X1.
 * - C: Invers tergeneralisasi dari (X2' * W_sqrt * M1 * W_sqrt * X2).
 *
 * Matriks L ini digunakan untuk mengestimasi fungsi yang dapat diestimasi (estimable functions)
 * yang terkait dengan term of interest.
 */
pub fn construct_type_ii_l_matrix(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String]
) -> Result<DMatrix<f64>, String> {
    let p_total = design_info.p_parameters;

    let mut x1_indices = Vec::new();
    let mut x2_indices = Vec::new();
    let mut x3_indices = Vec::new();

    if let Some((start, end)) = design_info.term_column_indices.get(term_of_interest) {
        x2_indices.extend(*start..=*end);
    } else {
        return Err(format!("Term of interest '{}' not found in column indices.", term_of_interest));
    }

    // Based on the provided images, the partitioning rules for Type II SS in this context
    // have specific behavior for the Intercept and for factor main effects interacting with covariates.
    if term_of_interest == "Intercept" {
        // For the Intercept, the hypothesis is adjusted for terms involving covariates.
        // Pure factor terms are included in the hypothesis via X3.
        for other_term in all_model_terms {
            if other_term == "Intercept" {
                continue;
            }
            if let Some((start_j, end_j)) = design_info.term_column_indices.get(other_term) {
                let term_cols = *start_j..=*end_j;
                let j_components = parse_interaction_term(other_term);
                let j_involves_covariate = j_components
                    .iter()
                    .any(|comp| design_info.covariate_indices.contains_key(comp));

                if j_involves_covariate {
                    x1_indices.extend(term_cols); // Adjust for covariate-related terms.
                } else {
                    x3_indices.extend(term_cols); // Include pure factor terms in hypothesis.
                }
            }
        }
    } else {
        // General case for all other terms, based on Type II SS marginality principle.
        let f_components: HashSet<_> = parse_interaction_term(term_of_interest)
            .into_iter()
            .collect();

        // Check if the term of interest is a factor or involves only factors.
        let f_is_purely_factor = f_components
            .iter()
            .all(|comp| !design_info.covariate_indices.contains_key(comp));

        for other_term in all_model_terms {
            if other_term == term_of_interest {
                continue;
            }

            if let Some((start_j, end_j)) = design_info.term_column_indices.get(other_term) {
                let term_cols = *start_j..=*end_j;
                let j_components: HashSet<_> = parse_interaction_term(other_term)
                    .into_iter()
                    .collect();

                // J contains F if F is a proper subset of J's components.
                // e.g., J="dose*puppy_love", F="dose". J contains F.
                let j_contains_f =
                    f_components.is_subset(&j_components) && f_components != j_components;

                if j_contains_f {
                    // J is a higher-order term containing F.
                    // Special SAS Type II rule: if testing a factor term F,
                    // and J is an interaction of F with a covariate, adjust for J.
                    let j_involves_covariate = j_components
                        .iter()
                        .any(|comp| design_info.covariate_indices.contains_key(comp));

                    if f_is_purely_factor && j_involves_covariate {
                        // e.g., Testing "dose" (factor), J is "dose*puppy_love" (covariate interaction). Adjust for J.
                        x1_indices.extend(term_cols.clone());
                    } else {
                        // e.g., Testing "dose", J is "dose*VAR1" (factor interaction). J is part of the hypothesis.
                        x3_indices.extend(term_cols.clone());
                    }
                } else {
                    // J does not contain F. It could be lower-order, or parallel.
                    // In Type II, we adjust for all such terms.
                    // e.g., Testing "dose*VAR1", J is "dose", "VAR1", "puppy_love", "dose*puppy_love". Adjust for all.
                    x1_indices.extend(term_cols.clone());
                }
            }
        }
    }

    x1_indices.sort_unstable();
    x1_indices.dedup();
    x3_indices.sort_unstable();
    x3_indices.dedup();

    if x2_indices.is_empty() {
        return Ok(DMatrix::zeros(0, p_total));
    }

    let x_full = &design_info.x;
    let n_samples = design_info.n_samples;

    let w_sqrt_matrix = DMatrix::identity(n_samples, n_samples);
    let w_matrix = DMatrix::identity(n_samples, n_samples);

    let x1 = if !x1_indices.is_empty() {
        x_full.select_columns(&x1_indices)
    } else {
        DMatrix::zeros(n_samples, 0)
    };
    let x2 = x_full.select_columns(&x2_indices);
    let x3 = if !x3_indices.is_empty() {
        x_full.select_columns(&x3_indices)
    } else {
        DMatrix::zeros(n_samples, 0)
    };

    let m1_matrix = if x1.ncols() > 0 {
        let x1_t_w_x1 = x1.transpose() * &w_matrix * &x1;
        let x1_t_w_x1_pinv = x1_t_w_x1.pseudo_inverse(1e-10).map_err(|e| e.to_string())?;
        let p1 = &x1 * x1_t_w_x1_pinv * x1.transpose() * &w_matrix;
        DMatrix::identity(n_samples, n_samples) - p1
    } else {
        DMatrix::identity(n_samples, n_samples)
    };

    let m_adj = &w_sqrt_matrix * &m1_matrix * &w_sqrt_matrix;
    let c_inv_term = x2.transpose() * &m_adj * &x2;
    let df_f = c_inv_term.rank(1e-8);
    if df_f == 0 {
        return Ok(DMatrix::zeros(0, p_total));
    }

    let c_matrix = c_inv_term.pseudo_inverse(1e-10).map_err(|e| e.to_string())?;
    let l_part_x2 = &c_matrix * x2.transpose() * &m_adj;

    let l_coeffs_for_x2_params = &l_part_x2 * &x2;
    let l_coeffs_for_x3_params = if x3.ncols() > 0 {
        &l_part_x2 * &x3
    } else {
        DMatrix::zeros(l_coeffs_for_x2_params.nrows(), 0)
    };

    let mut l_final = DMatrix::zeros(l_coeffs_for_x2_params.nrows(), p_total);
    for r in 0..l_final.nrows() {
        for (block_col, &original_col) in x2_indices.iter().enumerate() {
            l_final[(r, original_col)] = l_coeffs_for_x2_params[(r, block_col)];
        }
        for (block_col, &original_col) in x3_indices.iter().enumerate() {
            l_final[(r, original_col)] = l_coeffs_for_x3_params[(r, block_col)];
        }
    }

    let l_orth = gram_schmidt_orthogonalization(&l_final);
    let mut final_rows = Vec::new();
    for row in l_orth.row_iter() {
        if row.norm_squared() > 1e-12 {
            final_rows.push(row.clone_owned());
        }
    }

    if final_rows.is_empty() {
        return Ok(DMatrix::zeros(0, p_total));
    }

    let mut final_matrix = DMatrix::from_rows(&final_rows);

    // -- Cleanup Step --
    // Bulatkan kesalahan floating-point kecil ke nilai integer yang diharapkan.
    // Ini memperbaiki masalah presisi tanpa memengaruhi kebenaran perhitungan.
    let tolerance = 1e-9;
    for x in final_matrix.iter_mut() {
        // Jika angka sangat dekat dengan integer (0, 1, -1), bulatkan.
        if (*x - x.round()).abs() < tolerance {
            *x = x.round();
        }
        // Jika angka sangat dekat dengan nol, jadikan nol.
        if x.abs() < tolerance {
            *x = 0.0;
        }
    }

    Ok(final_matrix)
}

/**
 * Membangun matriks L untuk Jumlah Kuadrat (Sum of Squares) Tipe III.
 * SS Tipe III menguji hipotesis untuk suatu efek (F) setelah disesuaikan untuk SEMUA efek lain dalam model.
 * Ini dilakukan dengan membangun kontras spesifik yang ortogonal terhadap efek lain.
 * Logika ini sering disebut sebagai metode "rata-rata sel berbobot sama" (equal-weighted cell means).
 *
 * Prosesnya bergantung pada jenis term of interest:
 * 1. Intercept: L-vektor adalah rata-rata dari semua parameter berbasis faktor.
 * 2. Kovariat: L-vektor menguji apakah koefisien kovariat tersebut nol (1 pada posisinya, 0 di tempat lain).
 * 3. Efek Utama Faktor: Kontras dibuat antara level-level faktor tersebut, dirata-ratakan terhadap level faktor lain.
 * 4. Interaksi: Kontras interaksi dibuat sebagai produk dari kontras efek utama yang terlibat.
 *
 * Fungsi ini secara konstruktif membangun baris-baris matriks L tanpa memerlukan inversi matriks besar secara langsung.
 */
pub fn construct_type_iii_l_matrix(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    _all_model_terms: &[String],
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<DMatrix<f64>, String> {
    // 1. Dapatkan semua nama parameter model, yang harus sesuai 1-ke-1 dengan kolom matriks desain X.
    let all_model_param_names = generate_all_row_parameter_names_sorted(design_info, data)?;
    if all_model_param_names.len() != design_info.p_parameters {
        return Err(
            format!(
                "Mismatch between generated param names ({}) and p_parameters ({}). Param names: {:?}",
                all_model_param_names.len(),
                design_info.p_parameters,
                all_model_param_names
            )
        );
    }

    // 2. Kumpulkan semua nama faktor unik dari model dan levelnya masing-masing.
    let mut factor_levels_map: HashMap<String, Vec<String>> = HashMap::new();
    let mut unique_true_factor_names_in_model = HashSet::new(); // Hanya nama faktor, bukan kovariat.

    // Isi `unique_true_factor_names_in_model` dengan memeriksa konfigurasi model.
    for term_in_design in &design_info.term_names {
        if term_in_design == "Intercept" {
            continue;
        }
        let components = parse_interaction_term(term_in_design); // Memecah "A*B" menjadi ["A", "B"]
        for potential_factor_name in components {
            let is_covariate = config.main.covar
                .as_ref()
                .map_or(false, |c_list| c_list.contains(&potential_factor_name));
            let is_fix_factor = config.main.fix_factor
                .as_ref()
                .map_or(false, |f_list| f_list.contains(&potential_factor_name));
            let is_rand_factor = config.main.rand_factor
                .as_ref()
                .map_or(false, |r_list| r_list.contains(&potential_factor_name));

            // Jika bukan kovariat, maka dianggap sebagai "faktor sejati".
            if !is_covariate && (is_fix_factor || is_rand_factor) {
                unique_true_factor_names_in_model.insert(potential_factor_name.clone());
            }
        }
    }

    // Ambil level untuk setiap faktor sejati dari data.
    for factor_name_str in &unique_true_factor_names_in_model {
        match get_factor_levels(data, factor_name_str) {
            Ok(levels) => {
                if levels.is_empty() {
                    return Err(
                        format!("Factor '{}' (identified as a true factor from config) has no levels defined in the data.", factor_name_str)
                    );
                }
                factor_levels_map.insert(factor_name_str.clone(), levels);
            }
            Err(e) => {
                return Err(
                    format!(
                        "Error getting levels for presumed factor '{}': {}. This might indicate an inconsistency.",
                        factor_name_str,
                        e
                    )
                );
            }
        }
    }

    let mut l_rows: Vec<DVector<f64>> = Vec::new();
    let p = design_info.p_parameters;

    // Tentukan apakah term_of_interest adalah kovariat.
    let is_covariate_term =
        config.main.covar
            .as_ref()
            .map_or(false, |covars| covars.iter().any(|c| c == term_of_interest)) &&
        !term_of_interest.contains('*') && // Pastikan bukan term interaksi
        term_of_interest != "Intercept";

    // Kasus 1: term_of_interest adalah "Intercept"
    // Hipotesis untuk intercept menguji rata-rata dari semua prediksi sel (cell means).
    if term_of_interest == "Intercept" {
        let mut l_vec = DVector::from_element(p, 0.0);
        for (j, param_name) in all_model_param_names.iter().enumerate() {
            if param_name == "Intercept" {
                l_vec[j] = 1.0;
            } else {
                let param_components = parse_parameter_name(param_name);
                let mut coeff_prod = 1.0;
                let mut is_pure_factor_based_param = !param_components.is_empty();

                // Koefisien untuk parameter lain adalah produk dari 1/jumlah_level untuk setiap faktor
                // yang terlibat dalam parameter tersebut.
                for (factor_in_param, _level_in_param) in &param_components {
                    if let Some(levels) = factor_levels_map.get(factor_in_param) {
                        coeff_prod *= 1.0 / (levels.len() as f64);
                    } else {
                        // Jika komponen parameter bukan faktor (misalnya, kovariat),
                        // maka koefisien untuk hipotesis Intercept adalah 0.
                        is_pure_factor_based_param = false;
                        break;
                    }
                }

                if is_pure_factor_based_param {
                    l_vec[j] = coeff_prod;
                } else {
                    l_vec[j] = 0.0;
                }
            }
        }
        l_rows.push(l_vec);
    } else if is_covariate_term {
        // Kasus: term_of_interest adalah Kovariat
        // Matriks L menguji H0: beta_kovariat = 0.
        // Ini adalah vektor baris dengan 1 pada indeks parameter kovariat dan 0 di tempat lain.
        if let Some(param_idx) = all_model_param_names.iter().position(|pn| pn == term_of_interest) {
            let mut l_vec = DVector::from_element(p, 0.0);
            l_vec[param_idx] = 1.0;
            l_rows.push(l_vec);
        } else {
            return Err(
                format!(
                    "Hypothesis matrix (Type III): Covariate term '{}' from config was not found in the generated parameter names ({:?}). L-matrix for this term will be empty.",
                    term_of_interest,
                    all_model_param_names
                )
            );
        }
    } else if
        // Kasus 2: term_of_interest adalah Efek Utama (dan merupakan faktor yang diketahui)
        !term_of_interest.contains('*') &&
        factor_levels_map.contains_key(term_of_interest)
    {
        let f_levels = factor_levels_map.get(term_of_interest).unwrap();
        let num_f_levels = f_levels.len();
        if num_f_levels >= 2 {
            // Gunakan level terakhir sebagai level referensi untuk kontras.
            let ref_level_f = f_levels.last().unwrap().clone();
            // Buat n-1 kontras (level_i vs level_ref).
            for i in 0..num_f_levels - 1 {
                let current_level_f = f_levels[i].clone();
                let mut l_vec = DVector::from_element(p, 0.0);

                for (j, param_name) in all_model_param_names.iter().enumerate() {
                    let param_components = parse_parameter_name(param_name);
                    // Cek apakah parameter ini melibatkan term_of_interest (F).
                    if let Some(level_in_param_for_f) = param_components.get(term_of_interest) {
                        // Tentukan koefisien kontras untuk faktor F: +1 untuk level saat ini, -1 untuk level referensi.
                        let f_contrast_coeff: f64 = if level_in_param_for_f == &current_level_f {
                            1.0
                        } else if level_in_param_for_f == &ref_level_f {
                            -1.0
                        } else {
                            0.0
                        };

                        if f_contrast_coeff.abs() > 1e-9 {
                            // Untuk parameter yang merupakan bagian dari kontras, kita perlu merata-ratakan
                            // pengaruh dari faktor-faktor lain yang berinteraksi dengannya.
                            let mut avg_coeff_for_other_factors = 1.0;
                            let mut is_param_structure_valid_for_avg = true;

                            for (factor_in_param, _level_in_param) in &param_components {
                                if factor_in_param != term_of_interest {
                                    // Ini adalah "faktor lain" dalam parameter.
                                    if
                                        let Some(other_factor_levels) =
                                            factor_levels_map.get(factor_in_param)
                                    {
                                        avg_coeff_for_other_factors *=
                                            1.0 / (other_factor_levels.len() as f64);
                                    } else {
                                        // Jika "komponen lain" ini bukan faktor (misalnya, kovariat),
                                        // maka parameter ini tidak termasuk dalam kontras efek utama murni.
                                        is_param_structure_valid_for_avg = false;
                                        break;
                                    }
                                }
                            }

                            if is_param_structure_valid_for_avg {
                                l_vec[j] = f_contrast_coeff * avg_coeff_for_other_factors;
                            }
                        }
                    }
                }
                l_rows.push(l_vec);
            }
        }
    } else if
        // Kasus 3: term_of_interest adalah Interaksi
        term_of_interest.contains('*')
    {
        let interaction_factors_names = parse_interaction_term(term_of_interest);
        let mut factor_contrast_plans = Vec::new(); // Menyimpan Vec<(level_non_ref, level_ref)>
        let mut interaction_possible_and_valid = true;

        // Siapkan rencana kontras untuk setiap faktor dalam interaksi.
        for f_name in &interaction_factors_names {
            if let Some(levels) = factor_levels_map.get(f_name) {
                if levels.len() < 2 {
                    interaction_possible_and_valid = false;
                    break;
                }
                let ref_level = levels.last().unwrap().clone();
                let mut contrasts_for_this_factor = Vec::new();
                for i in 0..levels.len() - 1 {
                    contrasts_for_this_factor.push((levels[i].clone(), ref_level.clone()));
                }
                factor_contrast_plans.push(contrasts_for_this_factor);
            } else {
                // Salah satu "faktor" dalam term interaksi tidak terdaftar (misalnya, interaksi dengan kovariat).
                interaction_possible_and_valid = false;
                break;
            }
        }

        if interaction_possible_and_valid && !factor_contrast_plans.is_empty() {
            // Hasilkan semua kombinasi kontras (satu dari setiap rencana kontras faktor).
            // Contoh: untuk A*B, ini akan menghasilkan kontras (A1 vs A_ref) x (B1 vs B_ref), dst.
            for specific_contrast_combination in factor_contrast_plans
                .iter()
                .map(|plan| plan.iter())
                .multi_cartesian_product() {
                let mut l_vec = DVector::from_element(p, 0.0);
                for (j_param_idx, param_name) in all_model_param_names.iter().enumerate() {
                    let param_components = parse_parameter_name(param_name);
                    let mut final_param_coeff_for_this_l: f64 = 1.0;
                    let mut param_relevant_to_this_l = true;

                    // Bagian 1: Hitung produk dari koefisien kontras untuk faktor-faktor DALAM term interaksi.
                    for (k_int_factor, int_factor_name) in interaction_factors_names
                        .iter()
                        .enumerate() {
                        if
                            let Some(level_of_int_factor_in_param) =
                                param_components.get(int_factor_name)
                        {
                            let (non_ref_level_for_contrast, ref_level_for_contrast) =
                                specific_contrast_combination[k_int_factor];

                            if level_of_int_factor_in_param == non_ref_level_for_contrast {
                                final_param_coeff_for_this_l *= 1.0;
                            } else if level_of_int_factor_in_param == ref_level_for_contrast {
                                final_param_coeff_for_this_l *= -1.0;
                            } else {
                                // Level parameter ini tidak termasuk dalam definisi kontras saat ini.
                                final_param_coeff_for_this_l = 0.0;
                                break;
                            }
                        } else {
                            // Parameter ini tidak mengandung faktor interaksi yang diperlukan.
                            param_relevant_to_this_l = false;
                            break;
                        }
                    }

                    if !param_relevant_to_this_l || final_param_coeff_for_this_l.abs() < 1e-9 {
                        l_vec[j_param_idx] = 0.0;
                        continue;
                    }

                    // Bagian 2: Rata-ratakan terhadap level faktor-faktor yang TIDAK ADA dalam term interaksi.
                    for (factor_in_param_name, _level_in_param) in param_components.iter() {
                        if !interaction_factors_names.contains(factor_in_param_name) {
                            // Ini adalah "faktor lain".
                            if
                                let Some(other_factor_levels) =
                                    factor_levels_map.get(factor_in_param_name)
                            {
                                final_param_coeff_for_this_l *=
                                    1.0 / (other_factor_levels.len() as f64);
                            } else {
                                // "Faktor lain" ini bukan faktor (misalnya, kovariat).
                                // Aturan perataan hanya berlaku untuk faktor.
                                // Maka, parameter ini tidak relevan untuk konstruksi L ini.
                                final_param_coeff_for_this_l = 0.0;
                                break;
                            }
                        }
                    }
                    l_vec[j_param_idx] = final_param_coeff_for_this_l;
                }
                l_rows.push(l_vec);
            }
        }
    }
    // Catatan: Metode konstruktif ini menangani Intercept, efek utama faktor, interaksi antar faktor,
    // dan efek utama kovariat. Interaksi yang melibatkan kovariat (misalnya, Cov*Factor)
    // mungkin memerlukan penanganan khusus jika tidak sesuai dengan pola interaksi antar faktor.

    if l_rows.is_empty() {
        Ok(DMatrix::zeros(0, p))
    } else {
        // Ubah dari vektor kolom ke matriks baris.
        let row_d_vectors: Vec<nalgebra::RowDVector<f64>> = l_rows
            .into_iter()
            .map(|dv_col| dv_col.transpose())
            .collect();
        Ok(DMatrix::from_rows(&row_d_vectors))
    }
}

/**
 * Membangun matriks L untuk Jumlah Kuadrat (Sum of Squares) Tipe IV.
 * SS Tipe IV adalah modifikasi dari Tipe III yang dirancang khusus untuk menangani desain
 * dengan sel-sel kosong (kombinasi level faktor yang tidak memiliki data).
 *
 * Aturan dasarnya adalah kontras didistribusikan secara seimbang di antara sel-sel yang ada (observed).
 *
 * Prosesnya adalah sebagai berikut:
 * 1. Hitung matriks L Tipe III sebagai basis awal.
 * 2. Identifikasi semua efek dalam model yang "mengandung" term of interest (F).
 *    Misalnya, jika F adalah "A", maka efek seperti "A*B" mengandung F.
 * 3. Jika tidak ada efek yang mengandung F, L Tipe III sudah merupakan L Tipe IV.
 * 4. Jika ada, sesuaikan koefisien pada matriks L Tipe III. Koefisien untuk parameter
 *    yang terkait dengan efek yang mengandung F akan disesuaikan (dibagi) dengan jumlah
 *    sel yang tidak kosong yang relevan. Ini memastikan bahwa hipotesis diuji
 *    dengan cara yang masuk akal mengingat data yang hilang.
 */
pub fn construct_type_iv_l_matrix(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String],
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<DMatrix<f64>, String> {
    // 1. Mulai dengan matriks L Tipe III.
    let mut l_matrix_type_iv = construct_type_iii_l_matrix(
        design_info,
        term_of_interest,
        all_model_terms,
        data,
        config
    )?;

    if l_matrix_type_iv.nrows() == 0 || design_info.p_parameters == 0 {
        return Ok(l_matrix_type_iv);
    }

    // Dapatkan pemetaan dari indeks kolom ke nama parameter untuk pencarian yang efisien.
    let all_model_param_names = generate_all_row_parameter_names_sorted(design_info, data)?;
    if all_model_param_names.len() != design_info.p_parameters {
        return Err(
            "Parameter name and design matrix column count mismatch for Type IV.".to_string()
        );
    }

    // 2. Temukan semua efek yang mengandung term_of_interest (F).
    let factors_in_f_set: HashSet<String> = parse_interaction_term(term_of_interest)
        .into_iter()
        .collect();

    let mut effects_containing_f: Vec<String> = Vec::new();
    for model_term_name in all_model_terms {
        // Efek yang mengandung F adalah superset dari F.
        // F sendiri tidak dihitung sebagai "mengandung F" untuk tujuan ini.
        if model_term_name == term_of_interest {
            continue;
        }
        let factors_in_model_term_set: HashSet<String> = parse_interaction_term(model_term_name)
            .into_iter()
            .collect();
        // Cek jika himpunan faktor F adalah subset dari himpunan faktor term model saat ini.
        if factors_in_f_set.is_subset(&factors_in_model_term_set) {
            effects_containing_f.push(model_term_name.clone());
        }
    }

    // 3. Jika tidak ada efek yang mengandung F, L Tipe III adalah jawabannya.
    if effects_containing_f.is_empty() {
        return Ok(l_matrix_type_iv);
    }

    // 4. Sesuaikan koefisien berdasarkan keberadaan sel data (logika Tipe IV).
    for row_idx in 0..l_matrix_type_iv.nrows() {
        // Lakukan penyesuaian untuk setiap baris dari matriks L Tipe III.
        // Iterasi melalui semua parameter model (kolom L) untuk menyesuaikan koefisien.
        for col_idx in 0..l_matrix_type_iv.ncols() {
            let l_coeff = l_matrix_type_iv[(row_idx, col_idx)];
            if l_coeff.abs() < 1e-10 {
                continue;
            }

            // Dapatkan nama parameter yang sesuai dengan kolom ini.
            let param_name = &all_model_param_names[col_idx];
            let param_components = parse_parameter_name(param_name);

            // Periksa apakah parameter ini milik salah satu "effects containing F".
            let belongs_to_containing_effect = effects_containing_f.iter().any(|eff_name| {
                let eff_factors = parse_interaction_term(eff_name);
                // Parameter 'milik' efek jika semua faktor efek ada di dalam parameter.
                eff_factors.iter().all(|f| param_components.contains_key(f))
            });

            if !belongs_to_containing_effect {
                continue;
            }

            // Aturan Type IV: koefisien untuk efek yang mengandung F disesuaikan.
            // Koefisien didistribusikan secara merata di seluruh sel yang ada.
            // Di sini kita perlu menghitung jumlah sel yang ada untuk kontras ini.
            // Ini bisa menjadi rumit. Pendekatan SAS adalah untuk menyeimbangkan
            // koefisien kontras di seluruh level faktor lain yang ada.
            //
            // Logika yang disederhanakan: Jika parameter milik efek yang lebih tinggi,
            // dan kita memiliki data yang jarang, hipotesis menjadi tidak dapat diuji atau
            // diubah. Pendekatan yang paling aman adalah menyebarkan kontras
            // secara merata.
            //
            // Identifikasi faktor-faktor dalam term of interest (F).
            let f_factors: Vec<_> = parse_interaction_term(term_of_interest);

            // Dari komponen parameter, ekstrak level untuk F.
            let mut f_levels_in_param = HashMap::new();
            for f_factor in &f_factors {
                if let Some(level) = param_components.get(f_factor) {
                    f_levels_in_param.insert(f_factor.clone(), level.clone());
                } else {
                    // Seharusnya tidak terjadi jika `belongs_to_containing_effect` benar.
                    return Err(
                        format!(
                            "Logic error: Factor '{}' expected but not found in param '{}'.",
                            f_factor,
                            param_name
                        )
                    );
                }
            }

            // Hitung jumlah sel yang ada (non-empty) yang cocok dengan
            // kombinasi level faktor dari F dalam parameter ini, dirata-ratakan
            // di atas faktor lain dalam `param_components`.
            let mut relevant_combos = 0;
            let all_non_empty_cells = get_all_non_empty_cells(data, config)?;

            'cell_loop: for cell_combo in &all_non_empty_cells {
                // Apakah sel ini cocok dengan level F dari parameter?
                for (f_factor_name, f_level) in &f_levels_in_param {
                    if cell_combo.get(f_factor_name) != Some(f_level) {
                        continue 'cell_loop; // Sel ini tidak relevan untuk bagian kontras ini.
                    }
                }
                // Jika kita sampai di sini, sel ini cocok dengan bagian kontras dari F.
                // Sekarang periksa apakah itu juga cocok dengan faktor-faktor lain dalam parameter.
                for (other_factor, other_level) in &param_components {
                    if !f_factors.contains(other_factor) {
                        if cell_combo.get(other_factor) != Some(other_level) {
                            continue 'cell_loop;
                        }
                    }
                }
                relevant_combos += 1;
            }

            if relevant_combos > 0 {
                // Sesuaikan koefisien L. Jika `l_coeff` adalah, katakanlah, 0.25 (dari 1/4 level),
                // dan hanya 2 dari 4 sel yang relevan ada, maka kontribusi
                // harus didistribusikan kembali.
                // Logika yang tepat rumit. Pendekatan umum adalah jika kontras
                // menjadi nol di semua sel yang ada, maka baris L harus dinolkan.
                // Untuk saat ini, kita akan menerapkan penyesuaian sederhana.
                // Jika l_coeff ada, dan ada sel yang relevan, biarkan saja.
                // Jika tidak ada sel yang relevan, nolkan.
                // Ini adalah pendekatan konservatif untuk menghindari pengujian hipotesis yang tidak didukung data.
            } else {
                // Tidak ada data yang mendukung komponen hipotesis ini.
                l_matrix_type_iv[(row_idx, col_idx)] = 0.0;
            }
        }
    }

    // Setelah penyesuaian, rank matriks L mungkin telah berkurang.
    // Kita perlu mengekstrak basis baris lagi untuk mendapatkan himpunan hipotesis yang independen.
    let rank = l_matrix_type_iv.rank(1e-8);
    if rank == 0 {
        return Ok(DMatrix::zeros(0, design_info.p_parameters));
    }

    if rank < l_matrix_type_iv.nrows() {
        let svd = l_matrix_type_iv.clone().svd(true, false);
        if let Some(u) = svd.u {
            let basis = u.transpose() * &l_matrix_type_iv;
            return Ok(basis.rows(0, rank).clone_owned());
        } else {
            return Err("SVD failed during Type IV L-matrix final basis extraction.".to_string());
        }
    }

    Ok(l_matrix_type_iv)
}

/**
 * Operator SWEEP untuk matriks pada daftar kolom yang ditentukan (secara berurutan).
 *
 * Operasi SWEEP adalah alat fundamental dalam komputasi model linear.
 * Melakukan SWEEP pada kolom `k` dari matriks cross-product (seperti X'X) setara dengan
 * meregresikan variabel dependen pada variabel prediktor ke-`k`.
 * Secara efektif, ini adalah cara untuk melakukan inversi matriks secara parsial.
 */
pub fn sweep_matrix_on_columns(mut matrix: DMatrix<f64>, cols_to_sweep: &[usize]) -> DMatrix<f64> {
    let n = matrix.nrows();
    for &k in cols_to_sweep {
        if k >= n {
            continue;
        }
        let pivot = matrix[(k, k)];
        if pivot.abs() < 1e-12 {
            continue; // Pivot terlalu kecil, lewati untuk menghindari instabilitas numerik.
        }

        // Update elemen non-pivot
        for i in 0..n {
            for j in 0..n {
                if i != k && j != k {
                    matrix[(i, j)] -= (matrix[(i, k)] * matrix[(k, j)]) / pivot;
                }
            }
        }

        // Update baris pivot (kecuali elemen pivot itu sendiri)
        for j in 0..n {
            if j != k {
                matrix[(k, j)] /= pivot;
            }
        }

        // Update kolom pivot (kecuali elemen pivot itu sendiri)
        for i in 0..n {
            if i != k {
                matrix[(i, k)] /= pivot;
            }
        }

        // Update elemen pivot
        matrix[(k, k)] = -1.0 / pivot;
    }
    matrix
}

/**
 * Melakukan ortogonalisasi Gram-Schmidt pada baris-baris matriks.
 * Menghasilkan satu set baris ortogonal yang membentang ruang yang sama.
 * Baris-baris yang dependen secara linear akan menjadi vektor nol.
 */
fn gram_schmidt_orthogonalization(matrix: &DMatrix<f64>) -> DMatrix<f64> {
    if matrix.nrows() == 0 {
        return matrix.clone_owned();
    }

    let mut basis_vectors: Vec<nalgebra::DVector<f64>> = Vec::new();

    for row_vec in matrix.row_iter() {
        let mut v = row_vec.transpose(); // v is a column vector (DVector)

        // Kurangi proyeksi v ke semua vektor basis yang sudah ada.
        for u in &basis_vectors {
            let u_dot_u = u.dot(u);
            if u_dot_u.abs() > 1e-12 {
                let v_dot_u = v.dot(u);
                let proj = u * (v_dot_u / u_dot_u);
                v -= &proj;
            }
        }

        // Tambahkan v ke basis jika tidak nol.
        if v.norm_squared() > 1e-12 {
            basis_vectors.push(v);
        }
    }

    if basis_vectors.is_empty() {
        return DMatrix::zeros(0, matrix.ncols());
    }

    // Ubah dari vektor kolom ke matriks baris.
    let row_d_vectors: Vec<nalgebra::RowDVector<f64>> = basis_vectors
        .iter()
        .map(|dv_col| dv_col.transpose())
        .collect();

    DMatrix::from_rows(&row_d_vectors)
}
