use std::collections::{ BTreeMap, HashMap, HashSet };
use nalgebra::{ DMatrix, DVector };

use crate::models::{
    config::{ CIMethod, UnivariateConfig },
    data::{ AnalysisData, DataValue },
    result::{
        EMMeansResult,
        EMMeansEstimates,
        EMMeansEstimatesEntry,
        PairwiseComparisons,
        PairwiseComparisonsEntry,
        UnivariateTests,
        UnivariateTestsEntry,
        ContrastCoefficientsEntry,
        ConfidenceInterval,
    },
};

use super::core::*;

/*
 * Fungsi ini mengorkestrasi seluruh proses perhitungan EMMeans.
 *
 * Alur Proses:
 * 1.  **Persiapan Desain**: Membuat matriks desain, vektor respons, dan bobot berdasarkan
 *     data dan konfigurasi model (`create_design_response_weights`).
 * 2.  **Ekstraksi Informasi Model**:
 *     - Mendapatkan nama-nama parameter model.
 *     - Mempersiapkan data kovariat dengan menghitung rata-ratanya (`prepare_covariate_data_for_lmatrix`).
 * 3.  **Perhitungan Matriks**: Membuat matriks cross-product (Z'Z) dari matriks desain.
 * 4.  **Solusi Model**: Melakukan operasi SWEEP pada matriks Z'Z untuk mendapatkan estimasi
 *     parameter (β̂), generalized inverse (G_inv), dan Sum of Squares for Error (SSE/s_rss).
 * 5.  **Perhitungan Statistik Dasar**: Menghitung Mean Squared Error (MSE) dan derajat kebebasan (df_error).
 * 6.  **Ekstraksi Faktor**: Mengidentifikasi semua faktor dan levelnya dari model.
 * 7.  **Iterasi & Perhitungan EMMeans**:
 *     - Melakukan iterasi untuk setiap efek (term) yang diminta dalam `config.emmeans.target_list`.
 *     - Untuk setiap efek:
 *       a. Menghasilkan kombinasi level yang relevan (`get_factor_level_combinations`).
 *       b. Membuat vektor-L untuk setiap kombinasi level (`generate_l_vectors_for_emmeans`).
 *       c. Menghasilkan tabel estimasi EMMs, termasuk rata-rata, SE, dan CI (`generate_em_estimates_table`).
 *       d. Jika diminta dan relevan (untuk efek utama), menghasilkan:
 *          - Tabel perbandingan berpasangan (pairwise comparisons) (`generate_pairwise_comparisons_table`).
 *          - Tabel uji univariat (uji-F) (`generate_univariate_test_table`).
 * 8.  **Agregasi Hasil**: Mengumpulkan semua hasil ke dalam struktur `EMMeansResult`.
 */
pub fn calculate_emmeans(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<EMMeansResult, String> {
    // 1. Persiapan Desain
    let design_info = create_design_response_weights(data, config).map_err(|e| {
        format!("Failed to create design matrix for EMMeans: {}", e)
    })?;

    if design_info.p_parameters == 0 {
        return Err("No parameters in the model for EMMeans calculation.".to_string());
    }

    // 2. Ekstraksi Informasi Model
    let all_model_parameters_names = generate_all_row_parameter_names_sorted(
        &design_info,
        data
    ).map_err(|e| { format!("Failed to generate model parameter names for EMMeans: {}", e) })?;

    // Persiapkan matriks data mentah untuk kovariat
    let (raw_covariate_matrix, raw_covariate_headers) = if
        let Some(config_cov_names) = config.main.covar.as_ref().filter(|c| !c.is_empty())
    {
        if
            let Some(cov_data_groups) = data.covariate_data
                .as_ref()
                .filter(|cdg| !cdg.is_empty() && !cdg[0].is_empty())
        {
            let data_records_for_covs = &cov_data_groups[0];
            let n_obs = data_records_for_covs.len();
            let n_covs = config_cov_names.len();
            let mut matrix_values_row_major = Vec::with_capacity(n_obs * n_covs);

            for obs_idx in 0..n_obs {
                let obs_record = &data_records_for_covs[obs_idx];
                for cov_name in config_cov_names {
                    match obs_record.values.get(cov_name) {
                        Some(data_value) => {
                            let val_opt: Option<f64> = match data_value {
                                DataValue::Number(n) => Some(*n as f64),
                                DataValue::NumberFloat(f) => Some(*f),
                                _ => None,
                            };
                            matrix_values_row_major.push(val_opt.unwrap_or(f64::NAN));
                        }
                        None => matrix_values_row_major.push(f64::NAN),
                    }
                }
            }
            (
                DMatrix::from_row_slice(n_obs, n_covs, &matrix_values_row_major),
                config_cov_names.clone(),
            )
        } else {
            (DMatrix::<f64>::zeros(0, 0), Vec::new())
        }
    } else {
        (DMatrix::<f64>::zeros(0, 0), Vec::new())
    };

    let covariate_means_map = prepare_covariate_data_for_lmatrix(
        &raw_covariate_matrix,
        &raw_covariate_headers,
        config.main.covar.as_ref(),
        &all_model_parameters_names
    ).map_err(|e| format!("Failed to prepare covariate data for EMMeans: {}", e))?;

    // 3. Perhitungan Matriks
    let ztz_matrix = create_cross_product_matrix(&design_info).map_err(|e| {
        format!("Failed to create cross-product matrix for EMMeans: {}", e)
    })?;

    // 4. Solusi Model
    let swept_info = perform_sweep_and_extract_results(
        &ztz_matrix,
        design_info.p_parameters
    ).map_err(|e| { format!("Failed to perform sweep operations for EMMeans: {}", e) })?;

    // 5. Perhitungan Statistik Dasar
    let beta_hat = &swept_info.beta_hat;
    let g_inv = &swept_info.g_inv;
    let s_rss = swept_info.s_rss;
    let df_error = (design_info.n_samples as i64) - (design_info.r_x_rank as i64);
    let mse = if df_error > 0 { s_rss / (df_error as f64) } else { f64::NAN };

    if mse.is_nan() || df_error <= 0 {
        return Err(
            "MSE is NaN or df_error is not positive. Cannot proceed with EMMeans.".to_string()
        );
    }

    // 6. Ekstraksi Faktor
    let mut all_factors_in_model_with_their_levels: HashMap<String, Vec<String>> = HashMap::new();
    let mut unique_factors_from_terms: HashSet<String> = HashSet::new();
    for term_name in &design_info.term_names {
        if term_name == "Intercept" {
            continue;
        }
        term_name.split('*').for_each(|f_name_part| {
            let f_name = f_name_part.trim().to_string();
            // Pastikan itu adalah faktor, bukan kovariat, variabel WLS, atau variabel dependen
            let is_covariate = config.main.covar.as_ref().map_or(false, |c| c.contains(&f_name));
            let is_wls = config.main.wls_weight.as_ref().map_or(false, |w| w == &f_name);
            let is_dep_var = config.main.dep_var.as_ref().map_or(false, |d| d == &f_name);

            if !is_covariate && !is_wls && !is_dep_var {
                unique_factors_from_terms.insert(f_name);
            }
        });
    }
    for f_name in unique_factors_from_terms {
        if let Ok(levels) = get_factor_levels(data, &f_name) {
            if !levels.is_empty() {
                all_factors_in_model_with_their_levels.insert(f_name.clone(), levels);
            }
        }
    }

    // 7. Iterasi & Perhitungan EMMeans
    // Tentukan daftar efek yang akan dianalisis. Jika kosong, kembalikan hasil kosong.
    let factors_to_analyze_for_emmeans: Vec<String> = match config.emmeans.target_list.as_ref() {
        Some(targets) if !targets.is_empty() => targets.clone(),
        _ => {
            // Jika `target_list` adalah None atau Some([]), tidak ada yang diproses.
            return Ok(EMMeansResult {
                parameter_names: Vec::new(),
                contrast_coefficients: Vec::new(),
                em_estimates: Vec::new(),
                pairwise_comparisons: None,
                univariate_tests: None,
            });
        }
    };

    let mut emmeans_results_param_names: Vec<String> = Vec::new();
    let mut emmeans_contrast_coeffs_list: Vec<ContrastCoefficientsEntry> = Vec::new();
    let mut emmeans_estimates_list: Vec<EMMeansEstimates> = Vec::new();
    let mut emmeans_pairwise_list: Vec<PairwiseComparisons> = Vec::new();
    let mut emmeans_univariate_tests_list: Vec<UnivariateTests> = Vec::new();

    for factor_spec_emmeans in &factors_to_analyze_for_emmeans {
        emmeans_results_param_names.push(factor_spec_emmeans.clone());

        // Kasus khusus: Grand Mean (Rata-rata Keseluruhan)
        if factor_spec_emmeans == "(OVERALL)" {
            let grand_mean_l_vector = match
                generate_l_vector_for_grand_mean(
                    &all_model_parameters_names,
                    design_info.p_parameters,
                    &all_factors_in_model_with_their_levels,
                    &design_info.term_names,
                    &covariate_means_map,
                    &config.main.covar.as_ref().map_or_else(Vec::new, |v| v.clone())
                )
            {
                Ok(vec) => vec,
                Err(e) => {
                    return Err(format!("Error generating L-vector for Grand Mean: {}", e));
                }
            };

            let grand_mean_em_estimates_table = generate_em_estimates_table(
                &[grand_mean_l_vector.clone()],
                &[BTreeMap::new()],
                beta_hat,
                g_inv,
                mse,
                df_error,
                config.options.sig_level,
                "Grand Mean"
            );
            emmeans_estimates_list.push(grand_mean_em_estimates_table);

            if config.options.coefficient_matrix {
                emmeans_contrast_coeffs_list.push(ContrastCoefficientsEntry {
                    parameter: all_model_parameters_names.clone(),
                    l_label: vec!["Grand Mean".to_string()],
                    l_matrix: vec![grand_mean_l_vector],
                    contrast_information: vec!["L-Matrix for Grand Mean".to_string()],
                    note: Some("Defines the overall estimated grand mean.".to_string()),
                    interpretation: Some(
                        "This L-vector calculates the grand mean of the model, averaging over all factor levels and using the mean of covariates.".to_string()
                    ),
                });
            }
            continue;
        }

        // Parsing spesifikasi efek (bisa berupa efek utama atau interaksi)
        let parsed_terms_in_spec: Vec<String> = parse_interaction_term(factor_spec_emmeans);
        let current_spec_factors: Vec<&str> = parsed_terms_in_spec
            .iter()
            .map(String::as_str)
            .collect();

        if current_spec_factors.is_empty() && factor_spec_emmeans != "Intercept" {
            // Handle case where the specification is not a factor (e.g., a covariate name)
            emmeans_estimates_list.push(EMMeansEstimates {
                entries: Vec::new(),
                note: Some(format!("No level combinations for {}", factor_spec_emmeans)),
                interpretation: Some(
                    "The specified term is not a factor or has no levels, so no estimates can be calculated.".to_string()
                ),
            });
            if config.options.coefficient_matrix {
                emmeans_contrast_coeffs_list.push(ContrastCoefficientsEntry {
                    parameter: all_model_parameters_names.clone(),
                    l_label: Vec::new(),
                    l_matrix: Vec::new(),
                    contrast_information: vec![
                        format!("L-Matrix for EMMEANS of {}", factor_spec_emmeans)
                    ],
                    note: Some(format!("No level combinations for {}.", factor_spec_emmeans)),
                    interpretation: Some(
                        "No L-vectors could be generated as there are no factor levels for the specified term.".to_string()
                    ),
                });
            }
            continue;
        }

        let level_combinations_for_spec = match
            get_factor_level_combinations(
                &current_spec_factors,
                &all_factors_in_model_with_their_levels
            )
        {
            Ok(combos) if combos.is_empty() => {
                emmeans_estimates_list.push(EMMeansEstimates {
                    entries: Vec::new(),
                    note: Some(format!("No level combinations for {}", factor_spec_emmeans)),
                    interpretation: Some(
                        "The specified term is not a factor or has no levels, so no estimates can be calculated.".to_string()
                    ),
                });
                if config.options.coefficient_matrix {
                    emmeans_contrast_coeffs_list.push(ContrastCoefficientsEntry {
                        parameter: all_model_parameters_names.clone(),
                        l_label: Vec::new(),
                        l_matrix: Vec::new(),
                        contrast_information: vec![
                            format!("L-Matrix for EMMEANS of {}", factor_spec_emmeans)
                        ],
                        note: Some(format!("No level combinations for {}.", factor_spec_emmeans)),
                        interpretation: Some(
                            "No L-vectors could be generated as there are no factor levels for the specified term.".to_string()
                        ),
                    });
                }
                continue;
            }
            Ok(combos) => combos,
            Err(e) => {
                return Err(
                    format!(
                        "Error generating level combinations for {}: {}",
                        factor_spec_emmeans,
                        e
                    )
                );
            }
        };

        let (l_matrix_rows_for_emms, l_labels_for_emms) = match
            generate_l_vectors_for_emmeans(
                &level_combinations_for_spec,
                &all_model_parameters_names,
                design_info.p_parameters,
                &all_factors_in_model_with_their_levels,
                &covariate_means_map,
                &config.main.covar.as_ref().map_or_else(Vec::new, |v| v.clone())
            )
        {
            Ok(res) => res,
            Err(e) => {
                return Err(
                    format!("Error generating L-vectors for {}: {}", factor_spec_emmeans, e)
                );
            }
        };

        // Hasilkan tabel Estimasi EMMs
        let em_estimates_table = generate_em_estimates_table(
            &l_matrix_rows_for_emms,
            &level_combinations_for_spec,
            beta_hat,
            g_inv,
            mse,
            df_error,
            config.options.sig_level,
            factor_spec_emmeans
        );
        emmeans_estimates_list.push(em_estimates_table);

        if config.options.coefficient_matrix {
            emmeans_contrast_coeffs_list.push(ContrastCoefficientsEntry {
                parameter: all_model_parameters_names.clone(),
                l_label: l_labels_for_emms,
                l_matrix: l_matrix_rows_for_emms.clone(),
                contrast_information: vec![
                    format!("L-Matrix for EMMEANS of {}", factor_spec_emmeans)
                ],
                note: Some(
                    format!("Defines the EMMs for {}. Each row is an L-vector.", factor_spec_emmeans)
                ),
                interpretation: Some(
                    "These L-vectors are the linear combinations of model parameters used to calculate the Estimated Marginal Means (EMMs) for the specified effect.".to_string()
                ),
            });
        }

        // Hasilkan perbandingan berpasangan dan uji univariat jika itu adalah efek utama
        let is_main_effect_for_pairwise_uni = current_spec_factors.len() == 1;
        if is_main_effect_for_pairwise_uni && config.emmeans.comp_main_effect {
            let main_effect_name = current_spec_factors[0];
            if
                let Some(main_effect_levels) =
                    all_factors_in_model_with_their_levels.get(main_effect_name)
            {
                if
                    let Some(pairwise_table) = generate_pairwise_comparisons_table(
                        main_effect_name,
                        main_effect_levels,
                        &l_matrix_rows_for_emms,
                        beta_hat,
                        g_inv,
                        mse,
                        df_error,
                        config
                    )
                {
                    emmeans_pairwise_list.push(pairwise_table);
                }

                if
                    let Some(univariate_table) = generate_univariate_test_table(
                        main_effect_name,
                        main_effect_levels.len(),
                        &l_matrix_rows_for_emms,
                        beta_hat,
                        g_inv,
                        mse,
                        df_error,
                        design_info.p_parameters,
                        swept_info.s_rss,
                        config.options.sig_level,
                        config.options.est_effect_size,
                        config.options.obs_power
                    )
                {
                    emmeans_univariate_tests_list.push(univariate_table);
                }
            }
        }
    }

    // 8. Agregasi Hasil
    Ok(EMMeansResult {
        parameter_names: emmeans_results_param_names,
        contrast_coefficients: emmeans_contrast_coeffs_list,
        em_estimates: emmeans_estimates_list,
        pairwise_comparisons: if emmeans_pairwise_list.is_empty() {
            None
        } else {
            Some(emmeans_pairwise_list)
        },
        univariate_tests: if emmeans_univariate_tests_list.is_empty() {
            None
        } else {
            Some(emmeans_univariate_tests_list)
        },
    })
}

/*
 * === FUNGSI BANTU: Menghasilkan Vektor-L untuk EMMeans ===
 *
 * Estimated Marginal Means (EMMs) dihitung sebagai kombinasi linear dari parameter model.
 * Fungsi ini bertugas untuk membangun koefisien (vektor-L) untuk setiap kombinasi linear tersebut.
 *
 * Setiap vektor-L mendefinisikan cara menghitung satu EMM spesifik.
 *
 * Prosesnya melibatkan:
 * 1. Iterasi melalui setiap kombinasi level faktor yang diminta (misalnya, EMM untuk "gender=Pria, pendidikan=SMA").
 * 2. Untuk setiap EMM, membuat sebuah vektor-L dengan panjang yang sama dengan jumlah parameter model.
 * 3. Menentukan nilai koefisien untuk setiap parameter model dalam vektor-L berdasarkan aturannya:
 *    - Intercept: Koefisien selalu 1.0.
 *    - Kovariat: Koefisien adalah nilai rata-rata kovariat tersebut.
 *    - Faktor yang levelnya dispesifikasikan dalam EMM: Koefisien 1.0 jika level parameter model cocok, 0.0 jika tidak.
 *    - Faktor yang tidak dispesifikasikan (dirata-ratakan): Koefisien adalah 1.0 dibagi jumlah level faktor tersebut.
 *    - Interaksi: Koefisien adalah hasil perkalian dari koefisien masing-masing komponennya.
 *
 * @param level_combinations_for_spec Kombinasi level untuk setiap EMM yang akan dihitung.
 * @param all_model_parameters_names Nama-nama semua parameter dalam model statistik.
 * @param p_parameters Jumlah total parameter dalam model.
 * @param all_factors_in_model_with_their_levels Peta berisi semua faktor dalam model dan level-levelnya.
 * @param covariate_means_map Peta berisi nama kovariat dan nilai rata-ratanya.
 * @param covariate_names_from_config Daftar nama kovariat dari konfigurasi.
 * @return `Result` yang berisi matriks L (sebagai `Vec<Vec<f64>>`) dan label untuk setiap barisnya.
 */
fn generate_l_vectors_for_emmeans(
    level_combinations_for_spec: &[BTreeMap<String, String>],
    all_model_parameters_names: &[String],
    p_parameters: usize,
    all_factors_in_model_with_their_levels: &HashMap<String, Vec<String>>,
    covariate_means_map: &HashMap<String, f64>,
    covariate_names_from_config: &Vec<String>
) -> Result<(Vec<Vec<f64>>, Vec<String>), String> {
    let mut l_matrix_rows: Vec<Vec<f64>> = Vec::new();
    let mut l_labels: Vec<String> = Vec::new();

    for level_combo_map_for_emm_spec in level_combinations_for_spec {
        let mut l_vector = vec![0.0; p_parameters];
        let mut num_params_in_l = 0; // Menghitung parameter yang berkontribusi pada Vektor-L ini

        let emm_param_name_parts: Vec<String> = level_combo_map_for_emm_spec
            .iter()
            .map(|(f, l)| format!("{}={}", f, l))
            .collect();
        l_labels.push(format!("EMM: {}", emm_param_name_parts.join(", ")));

        for (param_idx, model_param_full_name) in all_model_parameters_names.iter().enumerate() {
            let mut current_param_l_coeff = 1.0;
            let mut matches_current_emm_combo_factors = true; // Asumsikan cocok sampai ditemukan ketidakcocokan

            if model_param_full_name == "Intercept" {
                current_param_l_coeff = 1.0;
            } else if covariate_means_map.contains_key(model_param_full_name) {
                // Kasus: Parameter adalah kovariat murni atau produk murni dari kovariat
                current_param_l_coeff = *covariate_means_map
                    .get(model_param_full_name)
                    .unwrap_or(&0.0);
            } else {
                // Kasus: Parameter berbasis faktor, mungkin berinteraksi dengan faktor atau kovariat lain
                let parsed_model_param_constituents = parse_parameter_name(model_param_full_name);
                if parsed_model_param_constituents.is_empty() {
                    current_param_l_coeff = 0.0; // Tidak dapat diurai, tidak berkontribusi
                    matches_current_emm_combo_factors = false;
                } else {
                    for (
                        factor_or_cov_name_in_param,
                        level_in_param_if_factor,
                    ) in parsed_model_param_constituents {
                        if factor_or_cov_name_in_param == "Intercept" {
                            continue;
                        }

                        if level_combo_map_for_emm_spec.contains_key(&factor_or_cov_name_in_param) {
                            // Faktor dari parameter model INI adalah bagian dari spesifikasi EMM saat ini
                            if
                                level_combo_map_for_emm_spec.get(&factor_or_cov_name_in_param) !=
                                Some(&level_in_param_if_factor)
                            {
                                // Level tidak cocok untuk faktor yang ditentukan -> parameter model ini bernilai nol untuk EMM ini
                                matches_current_emm_combo_factors = false;
                                current_param_l_coeff = 0.0;
                                break;
                            }
                        } else if
                            covariate_names_from_config.contains(&factor_or_cov_name_in_param)
                        {
                            // Bagian dari parameter model ini adalah kovariat
                            current_param_l_coeff *= *covariate_means_map
                                .get(&factor_or_cov_name_in_param)
                                .unwrap_or(&0.0);
                        } else if
                            all_factors_in_model_with_their_levels.contains_key(
                                &factor_or_cov_name_in_param
                            )
                        {
                            // Faktor dari parameter model ini TIDAK ada dalam spesifikasi EMM saat ini (dirata-ratakan)
                            if
                                let Some(other_factor_levels) =
                                    all_factors_in_model_with_their_levels.get(
                                        &factor_or_cov_name_in_param
                                    )
                            {
                                if !other_factor_levels.is_empty() {
                                    // Koefisien dibagi dengan jumlah level untuk mendapatkan rata-rata
                                    current_param_l_coeff /= other_factor_levels.len() as f64;
                                } else {
                                    current_param_l_coeff = 0.0;
                                    matches_current_emm_combo_factors = false;
                                    break;
                                }
                            }
                        } else {
                            // Komponen tidak dikenali (bukan faktor atau kovariat dalam EMM)
                            current_param_l_coeff = 0.0;
                            matches_current_emm_combo_factors = false;
                            break;
                        }
                    }
                }
            }

            if matches_current_emm_combo_factors {
                // Tetapkan koefisien jika semua bagian faktor cocok dengan spesifikasi EMM
                l_vector[param_idx] = current_param_l_coeff;
                if current_param_l_coeff.abs() > 1e-9 {
                    num_params_in_l += 1;
                }
            } else {
                l_vector[param_idx] = 0.0; // Pastikan nol jika spesifikasi tidak cocok
            }
        }

        // Jika tidak ada parameter yang berkontribusi, EMM ini dianggap tidak dapat diestimasi (non-estimable).
        if num_params_in_l == 0 && !l_vector.iter().any(|&x| x.abs() > 1e-9) {
            // Vektor L akan berisi semua nol.
        }
        l_matrix_rows.push(l_vector);
    }
    Ok((l_matrix_rows, l_labels))
}

/*
 * === FUNGSI BANTU: Menghasilkan Tabel Estimasi EMMeans ===
 *
 * Fungsi ini mengambil vektor-L yang telah dihasilkan dan menghitung nilai-nilai statistik utama
 * untuk tabel estimasi EMMs, termasuk rata-rata, standard error, dan interval kepercayaan.
 *
 * Perhitungan Statistik Utama:
 * - Estimated Marginal Mean (EMM):
 *   - Rumus: EMM = L' * β̂
 *   - `L'` adalah transpose dari vektor-L, dan `β̂` (beta_hat) adalah vektor estimasi parameter dari model.
 *   - Ini adalah nilai rata-rata marginal yang diprediksi untuk kombinasi level tertentu.
 *
 * - Standard Error (SE) dari EMM:
 *   - Rumus: SE = sqrt(L' * G_inv * L * MSE)
 *   - `G_inv` adalah generalized inverse dari matriks (X'X), `MSE` adalah Mean Squared Error.
 *   - Mengukur variabilitas atau ketidakpastian dari estimasi EMM.
 *
 * - Confidence Interval (CI):
 *   - Rumus: CI = EMM ± (t_critical * SE)
 *   - `t_critical` adalah nilai t kritis dari distribusi-t untuk tingkat signifikansi dan derajat kebebasan tertentu.
 *   - Memberikan rentang di mana nilai EMM populasi sebenarnya kemungkinan besar berada.
 */
fn generate_em_estimates_table(
    l_matrix_for_emms: &[Vec<f64>],
    level_combinations_for_spec: &[BTreeMap<String, String>],
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>,
    mse: f64,
    df_error: i64,
    sig_level: f64,
    factor_spec_emmeans: &str
) -> EMMeansEstimates {
    let mut emm_estimates_entries = Vec::new();
    let mut emm_levels_collector: Vec<String> = Vec::new();
    let mut emm_means_collector: Vec<f64> = Vec::new();
    let mut emm_std_errors_collector: Vec<f64> = Vec::new();
    let mut emm_ci_collector: Vec<ConfidenceInterval> = Vec::new();

    for (idx, l_vector_data) in l_matrix_for_emms.iter().enumerate() {
        let level_combo_map = &level_combinations_for_spec[idx];
        let emm_param_name_parts: Vec<String> = level_combo_map
            .iter()
            .map(|(f, l)| format!("{}={}", f, l))
            .collect();
        emm_levels_collector.push(emm_param_name_parts.join(", "));

        // Cek jika EMM tidak dapat diestimasi (vektor-L berisi semua nol)
        if l_vector_data.iter().all(|&x| x == 0.0) {
            emm_means_collector.push(f64::NAN);
            emm_std_errors_collector.push(f64::NAN);
            emm_ci_collector.push(ConfidenceInterval {
                lower_bound: f64::NAN,
                upper_bound: f64::NAN,
            });
            continue;
        }

        let l_vector = DVector::from_column_slice(l_vector_data);
        let emm_value_scalar = (l_vector.transpose() * beta_hat)[(0, 0)];

        let variance_of_emm_matrix = l_vector.transpose() * g_inv * &l_vector * mse;
        let std_error_emm = if variance_of_emm_matrix[(0, 0)] >= 0.0 {
            variance_of_emm_matrix[(0, 0)].sqrt()
        } else {
            f64::NAN
        };

        let t_crit_emm = calculate_t_critical(Some(sig_level), df_error as usize);
        let ci_width_emm = if !t_crit_emm.is_nan() && !std_error_emm.is_nan() {
            std_error_emm * t_crit_emm
        } else {
            f64::NAN
        };

        emm_means_collector.push(emm_value_scalar);
        emm_std_errors_collector.push(std_error_emm);
        emm_ci_collector.push(ConfidenceInterval {
            lower_bound: if !ci_width_emm.is_nan() {
                emm_value_scalar - ci_width_emm
            } else {
                f64::NAN
            },
            upper_bound: if !ci_width_emm.is_nan() {
                emm_value_scalar + ci_width_emm
            } else {
                f64::NAN
            },
        });
    }

    if !emm_levels_collector.is_empty() {
        emm_estimates_entries.push(EMMeansEstimatesEntry {
            levels: emm_levels_collector,
            mean: emm_means_collector,
            standard_error: emm_std_errors_collector,
            confidence_interval: emm_ci_collector,
        });
    }

    EMMeansEstimates {
        entries: emm_estimates_entries,
        note: Some(format!("Estimates for {}", factor_spec_emmeans)),
        interpretation: Some(
            "This table shows the Estimated Marginal Means (EMMs), which are the adjusted means for each level of the factor, controlling for other variables in the model. A non-estimable EMM (shown as NaN) indicates that the mean for that level combination cannot be uniquely determined from the data.".to_string()
        ),
    }
}

/*
 * === FUNGSI BANTU: Menghasilkan Tabel Perbandingan Berpasangan (Pairwise Comparisons) ===
 *
 * Fungsi ini membandingkan EMMs dari setiap pasangan level dalam suatu efek utama (main effect).
 * Ini berguna untuk mengetahui apakah ada perbedaan yang signifikan secara statistik antara level-level tersebut.
 *
 * Perhitungan Statistik Utama:
 * - Mean Difference:
 *   - Rumus: EMM_i - EMM_j = (L_i - L_j)' * β̂
 *   - Menunjukkan selisih estimasi rata-rata antara dua level.
 *
 * - Standard Error of the Difference:
 *   - Rumus: SE_diff = sqrt( (L_i - L_j)' * G_inv * (L_i - L_j) * MSE )
 *   - Mengukur ketidakpastian dari selisih rata-rata.
 *
 * - Significance (p-value):
 *   - Dihitung dari t-statistik (Mean Difference / SE_diff).
 *   - Menunjukkan probabilitas mendapatkan selisih yang diamati jika tidak ada perbedaan nyata.
 *   - Dilakukan penyesuaian untuk perbandingan ganda (multiple comparisons) menggunakan metode
 *     seperti Bonferroni, Sidak, atau LSD (tidak ada penyesuaian) untuk mengontrol tingkat kesalahan Tipe I.
 *
 * - Adjusted Confidence Interval:
 *   - Dihitung menggunakan alpha yang telah disesuaikan (misalnya, alpha / jumlah perbandingan untuk Bonferroni).
 */
fn generate_pairwise_comparisons_table(
    main_effect_name: &str,
    main_effect_levels: &[String],
    l_matrix_for_emms: &[Vec<f64>],
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>,
    mse: f64,
    df_error: i64,
    config: &UnivariateConfig
) -> Option<PairwiseComparisons> {
    let num_levels_main_effect = main_effect_levels.len();
    if num_levels_main_effect < 2 {
        return None;
    }

    let mut pairwise_entries = Vec::new();
    let num_pairwise_comparisons = (num_levels_main_effect * (num_levels_main_effect - 1)) / 2;
    if num_pairwise_comparisons == 0 {
        return None;
    }

    // Tentukan tingkat signifikansi (alpha) yang disesuaikan untuk perbandingan ganda
    let alpha_pairwise_sig = match config.emmeans.confi_interval_method {
        CIMethod::Bonferroni => config.options.sig_level / (num_pairwise_comparisons as f64),
        CIMethod::Sidak =>
            1.0 - (1.0 - config.options.sig_level).powf(1.0 / (num_pairwise_comparisons as f64)),
        CIMethod::LsdNone => config.options.sig_level,
    };

    for i in 0..num_levels_main_effect {
        for j in 0..num_levels_main_effect {
            if i == j {
                continue;
            }

            let l_vector_i_data = &l_matrix_for_emms[i];
            let l_vector_j_data = &l_matrix_for_emms[j];

            // Cek jika salah satu EMM non-estimable
            if
                l_vector_i_data.iter().all(|&x| x == 0.0) ||
                l_vector_j_data.iter().all(|&x| x == 0.0)
            {
                pairwise_entries.push(PairwiseComparisonsEntry {
                    parameter: vec![
                        format!("{}={}", main_effect_name, main_effect_levels[i]),
                        format!("{}={}", main_effect_name, main_effect_levels[j])
                    ],
                    mean_difference: vec![f64::NAN],
                    standard_error: vec![f64::NAN],
                    significance: vec![f64::NAN],
                    confidence_interval: vec![ConfidenceInterval {
                        lower_bound: f64::NAN,
                        upper_bound: f64::NAN,
                    }],
                });
                continue;
            }

            let l_vector_i = DVector::from_column_slice(l_vector_i_data);
            let l_vector_j = DVector::from_column_slice(l_vector_j_data);

            let emm_i_val = (l_vector_i.transpose() * beta_hat)[(0, 0)];
            let emm_j_val = (l_vector_j.transpose() * beta_hat)[(0, 0)];
            let mean_diff = emm_i_val - emm_j_val;

            let l_vector_diff = &l_vector_i - &l_vector_j;
            let variance_of_diff_matrix = l_vector_diff.transpose() * g_inv * &l_vector_diff * mse;
            let std_error_diff = if variance_of_diff_matrix[(0, 0)] >= 0.0 {
                variance_of_diff_matrix[(0, 0)].sqrt()
            } else {
                f64::NAN
            };

            let t_value_diff = if !std_error_diff.is_nan() && std_error_diff != 0.0 {
                mean_diff / std_error_diff
            } else {
                f64::NAN
            };

            let raw_significance_diff = if !t_value_diff.is_nan() && df_error > 0 {
                calculate_t_significance(t_value_diff.abs(), df_error as usize)
            } else {
                f64::NAN
            };

            // Sesuaikan p-value berdasarkan metode yang dipilih
            let adjusted_significance_diff = if !raw_significance_diff.is_nan() {
                match config.emmeans.confi_interval_method {
                    CIMethod::Bonferroni =>
                        (raw_significance_diff * (num_pairwise_comparisons as f64)).min(1.0),
                    CIMethod::Sidak =>
                        (
                            1.0 -
                            (1.0 - raw_significance_diff).powf(num_pairwise_comparisons as f64)
                        ).min(1.0),
                    CIMethod::LsdNone => raw_significance_diff,
                }
            } else {
                f64::NAN
            };

            // Hitung CI menggunakan alpha yang telah disesuaikan
            let t_crit_pairwise = calculate_t_critical(
                Some(alpha_pairwise_sig / 2.0),
                df_error as usize
            );
            let ci_width_diff = if !t_crit_pairwise.is_nan() && !std_error_diff.is_nan() {
                std_error_diff * t_crit_pairwise
            } else {
                f64::NAN
            };

            pairwise_entries.push(PairwiseComparisonsEntry {
                parameter: vec![
                    format!("{}={}", main_effect_name, main_effect_levels[i]),
                    format!("{}={}", main_effect_name, main_effect_levels[j])
                ],
                mean_difference: vec![mean_diff],
                standard_error: vec![std_error_diff],
                significance: vec![adjusted_significance_diff],
                confidence_interval: vec![ConfidenceInterval {
                    lower_bound: if !ci_width_diff.is_nan() {
                        mean_diff - ci_width_diff
                    } else {
                        f64::NAN
                    },
                    upper_bound: if !ci_width_diff.is_nan() {
                        mean_diff + ci_width_diff
                    } else {
                        f64::NAN
                    },
                }],
            });
        }
    }
    Some(PairwiseComparisons {
        entries: pairwise_entries,
        note: Some(
            format!(
                "Pairwise comparisons for {}. Adjustment for multiple comparisons: {:?}.",
                main_effect_name,
                config.emmeans.confi_interval_method
            )
        ),
        interpretation: Some(
            "This table compares each pair of levels for a main effect. A significant p-value (typically < .05) indicates a statistically significant difference between the two levels' means. The confidence interval for the mean difference should not contain zero for the difference to be significant.".to_string()
        ),
    })
}

/*
 * === FUNGSI BANTU: Menghasilkan Tabel Uji Univariat ===
 *
 * Fungsi ini melakukan uji-F (mirip ANOVA) untuk efek utama (main effect). Tujuannya adalah untuk
 * menguji hipotesis nol bahwa semua EMMs untuk level-level dari efek tersebut adalah sama.
 *
 * Perhitungan Statistik Utama:
 * - Sum of Squares for Hypothesis (SSH):
 *   - Rumus: SSH = (Lβ̂)' * (L * G_inv * L')⁻¹ * (Lβ̂)
 *   - `L` adalah matriks kontras yang menguji perbedaan antar EMMs.
 *   - Mengukur variasi antar grup (level) yang dijelaskan oleh efek utama.
 *
 * - Mean Square for Hypothesis (MSH):
 *   - Rumus: MSH = SSH / df_hypothesis
 *   - `df_hypothesis` adalah derajat kebebasan untuk hipotesis (jumlah level - 1).
 *
 * - F-value:
 *   - Rumus: F = MSH / MSE
 *   - `MSE` adalah Mean Squared Error dari model.
 *   - Statistik uji yang membandingkan variasi antar grup dengan variasi dalam grup (error).
 *
 * - Partial Eta Squared (η²_p):
 *   - Rumus: η²_p = SSH / (SSH + SSE)
 *   - `SSE` adalah Sum of Squares for Error.
 *   - Ukuran efek yang menunjukkan proporsi variasi variabel dependen yang dapat dijelaskan oleh efek utama.
 *
 * - Observed Power:
 *   - Dihitung dari distribusi F non-sentral.
 *   - Probabilitas untuk mendeteksi efek dengan besar yang sama dengan yang diamati dalam sampel.
 */
fn generate_univariate_test_table(
    main_effect_name: &str,
    num_levels_main_effect: usize,
    l_matrix_for_emms: &[Vec<f64>],
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>,
    mse: f64,
    df_error: i64,
    p_parameters: usize,
    s_rss: f64, // Sum of Squares for Error (SSE)
    sig_level_option: f64,
    est_effect_size: bool,
    obs_power: bool
) -> Option<UnivariateTests> {
    if num_levels_main_effect < 2 {
        return None;
    }
    let df_hypothesis_uni = num_levels_main_effect - 1;

    // Baris "Error" untuk tabel output, menggunakan statistik dari model keseluruhan
    let error_entry = UnivariateTestsEntry {
        source: "Error".to_string(),
        sum_of_squares: s_rss,
        df: df_error as usize,
        mean_square: mse,
        f_value: f64::NAN,
        significance: f64::NAN,
        partial_eta_squared: 0.0,
        noncent_parameter: 0.0,
        observed_power: 0.0,
    };

    if df_hypothesis_uni == 0 {
        // Tidak ada hipotesis yang bisa diuji jika df = 0
        let contrast_entry = UnivariateTestsEntry {
            source: main_effect_name.to_string(),
            sum_of_squares: f64::NAN,
            df: 0,
            mean_square: f64::NAN,
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: 0.0,
            noncent_parameter: 0.0,
            observed_power: 0.0,
        };
        return Some(UnivariateTests {
            entries: vec![contrast_entry, error_entry],
            note: Some(format!("No hypothesis to test for {} (df_hyp=0)", main_effect_name)),
            interpretation: Some(
                "The degrees of freedom for the hypothesis is 0, so no test can be performed.".to_string()
            ),
        });
    }

    // Cek jika semua EMMs non-estimable
    if l_matrix_for_emms.iter().all(|l_vec| l_vec.iter().all(|&x| x == 0.0)) {
        let contrast_entry = UnivariateTestsEntry {
            source: main_effect_name.to_string(),
            sum_of_squares: f64::NAN,
            df: df_hypothesis_uni,
            mean_square: f64::NAN,
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: 0.0,
            noncent_parameter: 0.0,
            observed_power: 0.0,
        };
        return Some(UnivariateTests {
            entries: vec![contrast_entry, error_entry],
            note: Some(
                format!("Cannot perform univariate test for {} (all EMMs non-estimable)", main_effect_name)
            ),
            interpretation: Some(
                "The univariate test could not be performed because all the estimated marginal means for this effect were non-estimable.".to_string()
            ),
        });
    }

    // Buat matriks kontras L untuk uji-F.
    // Setiap baris adalah perbedaan antara EMM level i dan EMM level terakhir.
    let mut l_matrix_uni_test_rows_as_vecs: Vec<Vec<f64>> = Vec::new();
    let l_vector_last_level_data = &l_matrix_for_emms[num_levels_main_effect - 1];

    for i in 0..num_levels_main_effect - 1 {
        let l_vector_i_data = &l_matrix_for_emms[i];
        let diff_row_data: Vec<f64> = l_vector_i_data
            .iter()
            .zip(l_vector_last_level_data.iter())
            .map(|(a, b)| a - b)
            .collect();
        l_matrix_uni_test_rows_as_vecs.push(diff_row_data);
    }

    let num_uni_rows = l_matrix_uni_test_rows_as_vecs.len();
    let num_uni_cols = if num_uni_rows > 0 {
        l_matrix_uni_test_rows_as_vecs[0].len()
    } else {
        p_parameters
    };

    if num_uni_rows == 0 {
        let contrast_entry = UnivariateTestsEntry {
            source: main_effect_name.to_string(),
            sum_of_squares: f64::NAN,
            df: df_hypothesis_uni,
            mean_square: f64::NAN,
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: 0.0,
            noncent_parameter: 0.0,
            observed_power: 0.0,
        };
        return Some(UnivariateTests {
            entries: vec![contrast_entry, error_entry],
            note: Some(
                format!("Cannot perform univariate test for {} (L-matrix has no rows but df_hyp > 0)", main_effect_name)
            ),
            interpretation: Some(
                "The test could not be performed due to an issue in constructing the contrast matrix, which is necessary for the hypothesis test.".to_string()
            ),
        });
    }

    let l_uni_test_nalgebra = DMatrix::from_row_slice(
        num_uni_rows,
        num_uni_cols,
        &l_matrix_uni_test_rows_as_vecs.iter().flatten().cloned().collect::<Vec<f64>>()
    );

    let l_beta_uni: DVector<f64> = &l_uni_test_nalgebra * beta_hat;
    let l_ginv_lt_uni: DMatrix<f64> =
        &l_uni_test_nalgebra * g_inv * l_uni_test_nalgebra.transpose();

    let mut ssh_uni = f64::NAN;
    let mut msh_uni = f64::NAN;
    let mut f_value_uni = f64::NAN;
    let mut sig_uni = f64::NAN;
    let (mut partial_eta_sq_uni, mut noncent_param_uni, mut obs_power_uni) = (
        f64::NAN,
        f64::NAN,
        f64::NAN,
    );

    if let Some(l_ginv_lt_uni_inv) = l_ginv_lt_uni.clone().try_inverse() {
        let ssh_matrix_uni = l_beta_uni.transpose() * l_ginv_lt_uni_inv * &l_beta_uni;
        if ssh_matrix_uni.nrows() == 1 && ssh_matrix_uni.ncols() == 1 {
            ssh_uni = ssh_matrix_uni[(0, 0)];
            if ssh_uni < 0.0 && ssh_uni.abs() > 1e-9 {
                ssh_uni = f64::NAN;
            } else if ssh_uni < 0.0 {
                ssh_uni = 0.0;
            }

            if !ssh_uni.is_nan() && df_hypothesis_uni > 0 {
                msh_uni = ssh_uni / (df_hypothesis_uni as f64);
                if !mse.is_nan() && mse > 1e-12 && df_error > 0 {
                    f_value_uni = msh_uni / mse;

                    if est_effect_size {
                        // Partial Eta Squared = SSH / (SSH + SSE)
                        if !s_rss.is_nan() && (ssh_uni + s_rss).abs() > 1e-12 {
                            partial_eta_sq_uni = ssh_uni / (ssh_uni + s_rss);
                        } else {
                            partial_eta_sq_uni = 0.0;
                        }
                    }

                    if obs_power {
                        // Parameter non-sentralitas (lambda) untuk distribusi F
                        noncent_param_uni = f_value_uni * (df_hypothesis_uni as f64);

                        if df_error > 0 {
                            obs_power_uni = calculate_observed_power_f(
                                f_value_uni,
                                df_hypothesis_uni as f64,
                                df_error as f64,
                                sig_level_option
                            );
                        } else {
                            obs_power_uni = f64::NAN;
                        }
                    }
                } else if mse == 0.0 && msh_uni > 1e-9 {
                    f_value_uni = f64::INFINITY;
                    if est_effect_size {
                        partial_eta_sq_uni = if ssh_uni > 0.0 { 1.0 } else { 0.0 };
                    }
                    if obs_power {
                        noncent_param_uni = f64::INFINITY;
                        obs_power_uni = if ssh_uni > 0.0 { 1.0 } else { 0.0 };
                    }
                }
                if !f_value_uni.is_nan() && df_error > 0 && df_hypothesis_uni > 0 {
                    sig_uni = calculate_f_significance(
                        df_hypothesis_uni,
                        df_error as usize,
                        f_value_uni
                    );
                }
            }
        }
    } else {
        // Handle kasus di mana (L*G_inv*L') tidak dapat di-inverse (singular),
        // yang biasanya terjadi jika hipotesis nol benar (tidak ada perbedaan).
        let is_l_beta_zero = l_beta_uni.iter().all(|&x| x.abs() < 1e-9);
        if is_l_beta_zero {
            ssh_uni = 0.0;
            msh_uni = 0.0;
            f_value_uni = if mse > 0.0 { 0.0 } else { f64::NAN };

            if est_effect_size {
                partial_eta_sq_uni = 0.0;
            }
            if obs_power {
                noncent_param_uni = 0.0;
                obs_power_uni = if !f_value_uni.is_nan() && df_hypothesis_uni > 0 && df_error > 0 {
                    calculate_observed_power_f(
                        f_value_uni,
                        df_hypothesis_uni as f64,
                        df_error as f64,
                        sig_level_option
                    )
                } else {
                    f64::NAN
                };
            }

            if !f_value_uni.is_nan() && df_hypothesis_uni > 0 && df_error > 0 {
                sig_uni = calculate_f_significance(
                    df_hypothesis_uni,
                    df_error as usize,
                    f_value_uni
                );
            }
        }
    }

    let contrast_entry = UnivariateTestsEntry {
        source: main_effect_name.to_string(),
        sum_of_squares: ssh_uni,
        df: df_hypothesis_uni,
        mean_square: msh_uni,
        f_value: f_value_uni,
        significance: sig_uni,
        partial_eta_squared: partial_eta_sq_uni,
        noncent_parameter: noncent_param_uni,
        observed_power: obs_power_uni,
    };

    Some(UnivariateTests {
        entries: vec![contrast_entry, error_entry],
        note: Some(format!("Univariate test for {}", main_effect_name)),
        interpretation: Some(
            "This F-test examines the null hypothesis that the means of all levels of the effect are equal. A significant F-value (Sig. < .05) suggests that there is a statistically significant difference somewhere among the level means.".to_string()
        ),
    })
}

/// Helper untuk menghasilkan semua kombinasi level dari faktor-faktor yang dispesifikasikan.
fn get_factor_level_combinations(
    factors_in_spec: &[&str],
    all_factors_in_model_with_their_levels: &HashMap<String, Vec<String>>
) -> Result<Vec<BTreeMap<String, String>>, String> {
    let mut current_spec_factor_levels_map: HashMap<String, Vec<String>> = HashMap::new();
    for &factor_name_in_spec in factors_in_spec {
        if let Some(levels) = all_factors_in_model_with_their_levels.get(factor_name_in_spec) {
            current_spec_factor_levels_map.insert(factor_name_in_spec.to_string(), levels.clone());
        } else {
            return Err(
                format!("Factor '{}' not found in model or has no levels.", factor_name_in_spec)
            );
        }
    }

    let mut level_combinations_for_spec: Vec<BTreeMap<String, String>> = Vec::new();
    let mut temp_combo_vec: Vec<(String, String)> = Vec::new();

    generate_emmeans_level_combos_recursive(
        factors_in_spec,
        &current_spec_factor_levels_map,
        0,
        &mut temp_combo_vec,
        &mut level_combinations_for_spec
    );
    Ok(level_combinations_for_spec)
}

/// Fungsi rekursif untuk menghasilkan kombinasi level.
fn generate_emmeans_level_combos_recursive(
    factors: &[&str],
    levels_map: &HashMap<String, Vec<String>>,
    current_idx: usize,
    current_path: &mut Vec<(String, String)>,
    output: &mut Vec<BTreeMap<String, String>>
) {
    if current_idx == factors.len() {
        let btree_map: BTreeMap<_, _> = current_path.iter().cloned().collect();
        output.push(btree_map);
        return;
    }

    let factor_name = factors[current_idx];
    if let Some(levels) = levels_map.get(factor_name) {
        for level in levels {
            current_path.push((factor_name.to_string(), level.clone()));
            generate_emmeans_level_combos_recursive(
                factors,
                levels_map,
                current_idx + 1,
                current_path,
                output
            );
            current_path.pop();
        }
    } else {
        // Lanjutkan rekursi untuk faktor lain jika ada
        generate_emmeans_level_combos_recursive(
            factors,
            levels_map,
            current_idx + 1,
            current_path,
            output
        );
    }
}

/// Menghasilkan vektor-L untuk grand mean (rata-rata keseluruhan).
/// Grand mean dihitung dengan merata-ratakan semua efek faktor dan menggunakan rata-rata kovariat.
fn generate_l_vector_for_grand_mean(
    all_model_parameters_names: &[String],
    p_parameters: usize,
    all_factors_in_model_with_their_levels: &HashMap<String, Vec<String>>,
    _design_info_term_names: &[String],
    covariate_means_map: &HashMap<String, f64>,
    covariate_names_from_config: &Vec<String>
) -> Result<Vec<f64>, String> {
    let mut l_vector = vec![0.0; p_parameters];

    for (param_idx, model_param_full_name) in all_model_parameters_names.iter().enumerate() {
        if model_param_full_name == "Intercept" {
            l_vector[param_idx] = 1.0;
        } else if covariate_means_map.contains_key(model_param_full_name) {
            // Parameter adalah kovariat murni atau produk kovariat
            l_vector[param_idx] = *covariate_means_map.get(model_param_full_name).unwrap_or(&0.0);
        } else {
            // Parameter berbasis faktor atau interaksi
            let mut current_param_l_coeff = 1.0;
            let mut is_estimable_component = true;
            let detailed_parsed_param = parse_parameter_name(model_param_full_name);

            if detailed_parsed_param.is_empty() && model_param_full_name != "Intercept" {
                current_param_l_coeff = 0.0; // Tidak relevan atau tidak dapat diurai
            } else {
                for (name_part, _level_part) in detailed_parsed_param {
                    if name_part == "Intercept" {
                        continue;
                    }

                    if covariate_names_from_config.contains(&name_part) {
                        // Komponen adalah kovariat -> gunakan rata-ratanya
                        current_param_l_coeff *= *covariate_means_map
                            .get(&name_part)
                            .unwrap_or(&0.0);
                    } else if
                        let Some(levels) = all_factors_in_model_with_their_levels.get(&name_part)
                    {
                        // Komponen adalah faktor -> bagi dengan jumlah level untuk merata-ratakan
                        if !levels.is_empty() {
                            current_param_l_coeff /= levels.len() as f64;
                        } else {
                            is_estimable_component = false;
                            break;
                        }
                    } else {
                        // Komponen tidak dikenali
                        is_estimable_component = false;
                        break;
                    }
                }
            }
            l_vector[param_idx] = if is_estimable_component { current_param_l_coeff } else { 0.0 };
        }
    }
    Ok(l_vector)
}

/// Mempersiapkan peta (HashMap) yang berisi rata-rata untuk setiap kovariat dan produk antar-kovariat.
fn prepare_covariate_data_for_lmatrix(
    raw_data_matrix: &DMatrix<f64>,
    data_headers: &[String],
    config_covariates: Option<&Vec<String>>,
    all_model_parameter_names: &[String]
) -> Result<HashMap<String, f64>, String> {
    let mut means_map = HashMap::new();
    if raw_data_matrix.nrows() == 0 {
        return Ok(means_map);
    }

    let Some(cfg_covars) = config_covariates else {
        // Jika tidak ada kovariat yang dikonfigurasi, kembali dengan peta kosong.
        return Ok(means_map);
    };

    // 1. Hitung rata-rata untuk kovariat individual dari konfigurasi
    for cov_name in cfg_covars {
        if let Some(col_idx) = data_headers.iter().position(|h| h == cov_name) {
            if raw_data_matrix.ncols() > col_idx {
                let cov_mean = raw_data_matrix.column(col_idx).mean();
                means_map.insert(cov_name.clone(), cov_mean);
            } else {
                return Err(format!("Index kolom kovariat '{}' di luar batas.", cov_name));
            }
        } else {
            if all_model_parameter_names.iter().any(|p| p == cov_name) {
                return Err(
                    format!("Kovariat '{}' ada di model tetapi tidak ditemukan di data.", cov_name)
                );
            }
        }
    }

    // 2. Hitung rata-rata untuk parameter yang merupakan produk dari kovariat (misal, "KovA*KovB")
    for param_name in all_model_parameter_names {
        if means_map.contains_key(param_name) || param_name == "Intercept" {
            continue;
        }

        let constituent_terms = parse_interaction_term(param_name);
        if constituent_terms.len() <= 1 {
            continue; // Bukan istilah produk atau tidak dapat diurai
        }

        let mut is_product_of_known_config_covariates = true;
        let mut col_indices_for_product: Vec<usize> = Vec::new();

        for term_part_name in &constituent_terms {
            if cfg_covars.contains(term_part_name) {
                if let Some(col_idx) = data_headers.iter().position(|h| h == term_part_name) {
                    col_indices_for_product.push(col_idx);
                } else {
                    is_product_of_known_config_covariates = false;
                    break;
                }
            } else {
                is_product_of_known_config_covariates = false;
                break;
            }
        }

        if
            is_product_of_known_config_covariates &&
            col_indices_for_product.len() == constituent_terms.len()
        {
            // Hitung rata-rata dari produk kolom-kolom kovariat
            let mut product_column_values = DVector::from_element(raw_data_matrix.nrows(), 1.0);
            for &col_idx in &col_indices_for_product {
                product_column_values.component_mul_assign(&raw_data_matrix.column(col_idx));
            }
            means_map.insert(param_name.clone(), product_column_values.mean());
        }
    }
    Ok(means_map)
}
