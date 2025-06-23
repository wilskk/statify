use std::collections::{ HashMap, HashSet, BTreeMap };
use itertools::Itertools;
use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ DesignMatrixInfo, GeneralEstimableFunction, GeneralEstimableFunctionEntry },
};

use super::core::*;

/*
 * Menghitung vektor koefisien (L-vektor) untuk rata-rata sel (cell mean) tertentu.
 * Rata-rata sel diekspresikan sebagai kombinasi linear dari parameter model.
 * Fungsi ini menentukan koefisien (0 atau 1) untuk setiap parameter.
 * Koefisien bernilai 1 jika parameter tersebut berkontribusi pada rata-rata sel yang bersangkutan.
 */
fn get_coeffs_for_cell_mean(
    cell_levels: &HashMap<String, String>,
    all_model_param_names: &[String],
    _factor_details: &HashMap<String, FactorDetail>
) -> Vec<i32> {
    let mut coeffs = vec![0; all_model_param_names.len()];

    for (i, model_param_name) in all_model_param_names.iter().enumerate() {
        if model_param_name == "Intercept" {
            coeffs[i] = 1;
            continue;
        }

        let param_factor_levels = parse_parameter_name(model_param_name);

        if param_factor_levels.get("Intercept").is_some() || param_factor_levels.is_empty() {
            continue;
        }

        let mut parameter_contributes_to_cell = true;
        for (p_factor, p_level) in &param_factor_levels {
            match cell_levels.get(p_factor) {
                Some(cell_level_for_this_factor) if cell_level_for_this_factor == p_level => {}
                _ => {
                    parameter_contributes_to_cell = false;
                    break;
                }
            }
        }

        if parameter_contributes_to_cell {
            coeffs[i] = 1;
        }
    }
    coeffs
}

/// Struktur untuk menyimpan detail dari sebuah faktor.
#[derive(Debug, Clone)]
struct FactorDetail {
    /// Nama faktor.
    name: String,
    /// Daftar level yang unik dari faktor ini, diurutkan secara alfabetis/numerik.
    levels: Vec<String>,
    /// Level referensi, yaitu level pertama setelah diurutkan.
    reference_level: String,
    /// Level pivot, yaitu level terakhir setelah diurutkan. Digunakan sebagai dasar perbandingan untuk kontras.
    pivot_level: String,
}

/*
 * Menghasilkan notasi "μ" (mu) yang merepresentasikan sebuah cell mean.
 * Notasi ini digunakan sebagai label yang mudah dibaca. Contoh: μ_ij
 * @param cell_levels - Peta dari nama faktor ke levelnya untuk sel tertentu.
 * @param ordered_factors - Urutan faktor yang menentukan urutan subskrip pada notasi μ.
 */
fn generate_mu_notation(
    cell_levels: &HashMap<String, String>,
    ordered_factors: &[String]
) -> String {
    // Menggunakan BTreeMap untuk iterasi yang terurut demi konsistensi notasi mu.
    let ordered_cell_levels: BTreeMap<_, _> = cell_levels.iter().collect();

    let mut notation = "μ".to_string();
    for factor_name in ordered_factors {
        if let Some(level) = ordered_cell_levels.get(factor_name) {
            notation.push_str(
                &level
                    .chars()
                    .next()
                    .map(|c| c.to_string())
                    .unwrap_or_else(|| "_".to_string())
            );
        } else {
            // Fallback jika sebuah faktor dalam ordered_factors tidak ada di cell_levels.
            notation.push('_');
        }
    }
    notation
}

/// Menghitung fungsi estimable umum (General Estimable Functions / GEF).
///
/// GEF menunjukkan bagaimana setiap parameter model yang tidak redundan
/// dapat diestimasi sebagai kombinasi linear dari rata-rata sel yang diamati.
/// Kombinasi linear ini direpresentasikan oleh L-vektor.
///
/// Fungsi ini menghasilkan tabel yang berisi:
/// - Parameter model.
/// - L-vektor yang sesuai.
/// - Deskripsi kontras yang diwakili oleh L-vektor tersebut.
pub fn calculate_general_estimable_function(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<GeneralEstimableFunction, String> {
    // Langkah 1: Membuat matriks desain (X), vektor respons (y), dan bobot.
    // Informasi ini penting untuk memahami struktur model.
    let design_info: DesignMatrixInfo = create_design_response_weights(data, config)?;

    // Penanganan kasus jika tidak ada data atau parameter.
    if design_info.n_samples == 0 || design_info.p_parameters == 0 {
        return Ok(GeneralEstimableFunction {
            estimable_function: GeneralEstimableFunctionEntry {
                parameter: Vec::new(),
                l_label: Vec::new(),
                l_matrix: Vec::new(),
                contrast_information: Vec::new(),
            },
            notes: vec!["Tidak ada data atau parameter dalam model.".to_string()],
        });
    }

    // Mendapatkan semua nama parameter model, diurutkan secara konsisten.
    let all_model_param_names = generate_all_row_parameter_names_sorted(&design_info, data)?;

    // Penanganan kasus jika tidak ada nama parameter yang dihasilkan.
    if all_model_param_names.is_empty() {
        return Ok(GeneralEstimableFunction {
            estimable_function: GeneralEstimableFunctionEntry {
                parameter: Vec::new(),
                l_label: Vec::new(),
                l_matrix: Vec::new(),
                contrast_information: Vec::new(),
            },
            notes: vec![
                "Tidak ada parameter dalam model (setelah pembuatan nama parameter).".to_string()
            ],
        });
    }

    // Langkah 2: Menghitung estimasi parameter dan mengidentifikasi parameter yang redundan.
    // Parameter redundan (non-estimable) tidak dapat diestimasi secara unik.
    let param_estimates_result = calculate_parameter_estimates(data, config)?;
    let is_redundant_vec: Vec<bool> = param_estimates_result.estimates
        .iter()
        .map(|e| e.is_redundant)
        .collect();

    // Langkah 3: Ekstraksi detail faktor dari nama-nama parameter.
    // Mengidentifikasi semua faktor dan levelnya yang ada dalam model.
    let mut factor_details: HashMap<String, FactorDetail> = HashMap::new();
    let mut all_factors_ordered: Vec<String> = Vec::new();

    // Membuat set nama kovariat untuk membedakannya dari faktor.
    let covariate_names_set: HashSet<String> = config.main.covar
        .as_ref()
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .collect();

    // Iterasi melalui semua nama parameter untuk mengekstrak faktor dan level.
    for param_name in &all_model_param_names {
        if param_name == "Intercept" {
            continue;
        }
        let parsed_param_components = parse_parameter_name(param_name);
        for (param_component_name, level) in parsed_param_components {
            if param_component_name == "Intercept" {
                continue;
            }
            // Kovariat tidak dianggap sebagai faktor untuk konstruksi kontras GEF.
            if covariate_names_set.contains(&param_component_name) {
                continue;
            }

            let entry = factor_details.entry(param_component_name.clone()).or_insert_with(|| {
                if !all_factors_ordered.contains(&param_component_name) {
                    all_factors_ordered.push(param_component_name.clone());
                }
                FactorDetail {
                    name: param_component_name.clone(),
                    levels: Vec::new(),
                    reference_level: String::new(),
                    pivot_level: String::new(),
                }
            });
            if !entry.levels.contains(&level) {
                entry.levels.push(level.clone());
            }
        }
    }

    // Mengurutkan level untuk setiap faktor dan menentukan level referensi dan pivot.
    // Level referensi: level pertama (secara leksikografis).
    // Level pivot: level terakhir (secara leksikografis), digunakan untuk kontras.
    for detail in factor_details.values_mut() {
        detail.levels.sort();
        if let Some(first_level) = detail.levels.first() {
            detail.reference_level = first_level.clone();
        }
        if let Some(last_level) = detail.levels.last() {
            detail.pivot_level = last_level.clone();
        } else {
            return Err(
                format!("Faktor {} tidak memiliki level untuk menentukan level pivot.", detail.name)
            );
        }
    }

    // Langkah 4: Menentukan sel referensi (base all-pivot cell).
    // Sel ini adalah sel di mana semua faktor berada pada level pivot-nya.
    // Rata-rata sel ini biasanya diwakili oleh parameter Intercept model.
    let base_all_pivot_levels: HashMap<String, String> = all_factors_ordered
        .iter()
        .filter_map(|fname|
            factor_details.get(fname).map(|d| (fname.clone(), d.pivot_level.clone()))
        )
        .collect();

    // Koleksi untuk menyimpan L-vektor yang dihasilkan beserta deskripsinya.
    let mut collected_l_functions: Vec<(usize, String, Vec<i32>, String)> = Vec::new();
    // Set untuk melacak L-vektor yang sudah ada, untuk menghindari duplikasi.
    let mut encountered_l_vectors: HashSet<Vec<i32>> = HashSet::new();

    // Fungsi pembantu untuk menambahkan L-vektor baru ke koleksi jika valid.
    // Valid artinya tidak semua elemennya nol dan belum pernah ditambahkan sebelumnya.
    let mut add_to_collection_if_valid = |
        l_vec: Vec<i32>,
        description: String,
        expected_l_number: usize,
        expected_l_label: String
    | {
        // Lewati jika L-vektor nol semua atau merupakan duplikat.
        if l_vec.iter().all(|&x| x == 0) || !encountered_l_vectors.insert(l_vec.clone()) {
            return;
        }
        collected_l_functions.push((expected_l_number, expected_l_label, l_vec, description));
    };

    // Langkah 5: Menghasilkan L-vektor untuk setiap parameter model yang tidak redundan.

    // L-vektor untuk Intercept:
    // Merepresentasikan rata-rata dari sel di mana semua faktor berada pada level pivot (sel referensi).
    if let Some(k) = all_model_param_names.iter().position(|p| p == "Intercept") {
        if !is_redundant_vec[k] {
            let l_vec_intercept = get_coeffs_for_cell_mean(
                &base_all_pivot_levels,
                &all_model_param_names,
                &factor_details
            );
            let mu_notation = generate_mu_notation(&base_all_pivot_levels, &all_factors_ordered);
            let desc = format!("Mean of all-pivot cell {}", mu_notation);
            add_to_collection_if_valid(l_vec_intercept, desc, k + 1, format!("L{}", k + 1));
        }
    }

    // L-vektor untuk Kovariat:
    // L-vektor untuk parameter kovariat adalah vektor basis (1 pada posisinya, 0 di tempat lain).
    // Ini menunjukkan bahwa parameter tersebut secara langsung mengestimasi efek kovariat itu sendiri.
    for (k, param_name) in all_model_param_names.iter().enumerate() {
        if param_name == "Intercept" || is_redundant_vec[k] {
            continue; // Lewati intercept (sudah ditangani) dan parameter redundan
        }

        let l_num = k + 1;
        let l_label_str = format!("L{}", l_num);

        if covariate_names_set.contains(param_name) {
            let mut l_vec_covariate = vec![0i32; all_model_param_names.len()];
            l_vec_covariate[k] = 1;
            let description = format!("Covariate: {}", param_name);
            add_to_collection_if_valid(l_vec_covariate, description, l_num, l_label_str);
        }
    }

    // L-vektor untuk Efek Utama (Main Effects):
    // Didefinisikan sebagai kontras antara rata-rata sel pada level non-pivot
    // dengan rata-rata sel pada level pivot, sementara faktor lain dijaga konstan pada level pivotnya.
    // Formula: μ(level_i) - μ(level_pivot)
    for factor_of_interest_name in &all_factors_ordered {
        if let Some(detail_factor_of_interest) = factor_details.get(factor_of_interest_name) {
            let pivot_level_for_factor_of_interest = &detail_factor_of_interest.pivot_level;

            for non_pivot_level in detail_factor_of_interest.levels
                .iter()
                .filter(|l| *l != pivot_level_for_factor_of_interest) {
                let param_to_find = format!("[{}={}]", factor_of_interest_name, non_pivot_level);
                if let Some(k) = all_model_param_names.iter().position(|p| p == &param_to_find) {
                    if is_redundant_vec[k] {
                        continue;
                    }

                    let mut cell_a_levels = base_all_pivot_levels.clone();
                    cell_a_levels.insert(factor_of_interest_name.clone(), non_pivot_level.clone());
                    let cell_b_levels = base_all_pivot_levels.clone();

                    let coeffs_a = get_coeffs_for_cell_mean(
                        &cell_a_levels,
                        &all_model_param_names,
                        &factor_details
                    );
                    let coeffs_b = get_coeffs_for_cell_mean(
                        &cell_b_levels,
                        &all_model_param_names,
                        &factor_details
                    );

                    let l_vec_sme: Vec<i32> = coeffs_a
                        .iter()
                        .zip(coeffs_b.iter())
                        .map(|(a, b)| a - b)
                        .collect();

                    let mu_a_notation = generate_mu_notation(&cell_a_levels, &all_factors_ordered);
                    let mu_b_notation = generate_mu_notation(&cell_b_levels, &all_factors_ordered);
                    let desc = format!(
                        "Main Effect {}({} vs {} | Others at Pivot): {} - {}",
                        factor_of_interest_name,
                        non_pivot_level,
                        pivot_level_for_factor_of_interest,
                        mu_a_notation,
                        mu_b_notation
                    );

                    let l_num = k + 1;
                    let l_label_str = format!("L{}", l_num);
                    add_to_collection_if_valid(l_vec_sme, desc, l_num, l_label_str);
                }
            }
        }
    }

    // L-vektor untuk Efek Interaksi N-arah (N-way Interactions):
    // Didefinisikan sebagai kontras dari kontras.
    // Contoh untuk interaksi 2-arah (A*B): (μ_a1b1 - μ_a1b_pivot) - (μ_a_pivot_b1 - μ_a_pivot_b_pivot)
    // Logika di bawah ini menggeneralisasi formula ini untuk interaksi N-arah.
    for k_interaction_way in 2..=all_factors_ordered.len() {
        for interacting_factors_names_tuple in all_factors_ordered
            .iter()
            .cloned()
            .combinations(k_interaction_way) {
            let mut base_levels_for_interaction_context = base_all_pivot_levels.clone();
            for f_name_interacting in &interacting_factors_names_tuple {
                base_levels_for_interaction_context.remove(f_name_interacting);
            }

            let mut level_choices_for_each_interacting_factor: Vec<Vec<String>> = Vec::new();
            let mut possible_interaction_levels = true;
            for factor_name_in_interaction in &interacting_factors_names_tuple {
                if let Some(detail) = factor_details.get(factor_name_in_interaction) {
                    let non_pivot_levels = detail.levels
                        .iter()
                        .filter(|l| *l != &detail.pivot_level)
                        .cloned()
                        .collect::<Vec<_>>();
                    if non_pivot_levels.is_empty() {
                        possible_interaction_levels = false;
                        break;
                    }
                    level_choices_for_each_interacting_factor.push(non_pivot_levels);
                } else {
                    possible_interaction_levels = false;
                    break;
                }
            }
            if
                !possible_interaction_levels ||
                level_choices_for_each_interacting_factor.len() != k_interaction_way
            {
                continue;
            }

            // Iterasi melalui semua kombinasi level non-pivot dari faktor-faktor yang berinteraksi.
            for specific_non_pivot_levels_for_interaction_instance in level_choices_for_each_interacting_factor
                .into_iter()
                .multi_cartesian_product() {
                let param_name_parts: Vec<String> = interacting_factors_names_tuple
                    .iter()
                    .zip(specific_non_pivot_levels_for_interaction_instance.iter())
                    .map(|(factor_name, level)| format!("[{}={}]", factor_name, level))
                    .collect();
                let param_to_find = param_name_parts.join("*");

                if let Some(k) = all_model_param_names.iter().position(|p| p == &param_to_find) {
                    if is_redundant_vec[k] {
                        continue;
                    }

                    // Konstruksi L-vektor untuk interaksi.
                    // Ini melibatkan penjumlahan dan pengurangan rata-rata sel (μ)
                    // berdasarkan kombinasi level pivot dan non-pivot.
                    let mut l_vec_interaction = vec![0i32; all_model_param_names.len()];
                    let mut contrast_description_terms: Vec<String> = Vec::new();

                    let interaction_levels_desc_parts: Vec<String> = interacting_factors_names_tuple
                        .iter()
                        .zip(specific_non_pivot_levels_for_interaction_instance.iter())
                        .map(|(f_name, non_pivot_level)| {
                            format!(
                                "{} ({} vs {})",
                                f_name,
                                non_pivot_level,
                                factor_details.get(f_name.as_str()).unwrap().pivot_level
                            )
                        })
                        .collect();
                    let full_desc_prefix = format!(
                        "Interaksi {} | Faktor lain pada level pivot",
                        interaction_levels_desc_parts.join(", ")
                    );

                    // Loop ini (0..1 << k_interaction_way) mengiterasi melalui 2^k kombinasi
                    // untuk membangun kontras interaksi. Setiap iterasi mewakili satu term μ.
                    for i_term_construction in 0..1 << k_interaction_way {
                        let mut current_cell_levels_map =
                            base_levels_for_interaction_context.clone();
                        let mut num_pivot_levels_for_interacting_factors_in_this_term = 0;
                        for (
                            idx_in_interaction,
                            interacting_factor_name,
                        ) in interacting_factors_names_tuple.iter().enumerate() {
                            let factor_detail_for_interacting = factor_details
                                .get(interacting_factor_name)
                                .unwrap();
                            let level_for_this_interacting_factor_in_term = if
                                ((i_term_construction >> idx_in_interaction) & 1) == 1
                            {
                                &specific_non_pivot_levels_for_interaction_instance[
                                    idx_in_interaction
                                ]
                            } else {
                                num_pivot_levels_for_interacting_factors_in_this_term += 1;
                                &factor_detail_for_interacting.pivot_level
                            };
                            current_cell_levels_map.insert(
                                interacting_factor_name.clone(),
                                level_for_this_interacting_factor_in_term.clone()
                            );
                        }

                        let cell_coeffs = get_coeffs_for_cell_mean(
                            &current_cell_levels_map,
                            &all_model_param_names,
                            &factor_details
                        );
                        let mu_term_notation = generate_mu_notation(
                            &current_cell_levels_map,
                            &all_factors_ordered
                        );

                        let num_non_pivot_levels_for_interacting_factors_in_this_term =
                            k_interaction_way -
                            num_pivot_levels_for_interacting_factors_in_this_term;

                        // Menentukan tanda (+ atau -) untuk setiap term μ dalam kontras.
                        // Tanda ditentukan oleh paritas jumlah level non-pivot dalam term tersebut.
                        // Genap -> +1, Ganjil -> -1.
                        let sign = if
                            num_non_pivot_levels_for_interacting_factors_in_this_term % 2 == 0
                        {
                            1i32
                        } else {
                            -1i32
                        };

                        if !cell_coeffs.iter().all(|&c| c == 0) {
                            if sign == 1 {
                                contrast_description_terms.push(format!("+{}", mu_term_notation));
                            } else {
                                contrast_description_terms.push(format!("-{}", mu_term_notation));
                            }
                            for (j_coeff_idx, coeff_val) in cell_coeffs.iter().enumerate() {
                                l_vec_interaction[j_coeff_idx] += sign * coeff_val;
                            }
                        }
                    }
                    contrast_description_terms.sort_by_key(|k| k.starts_with('-'));

                    let l_num = k + 1;
                    let l_label_str = format!("L{}", l_num);
                    add_to_collection_if_valid(
                        l_vec_interaction,
                        format!("{}: {}", full_desc_prefix, contrast_description_terms.join(" ")),
                        l_num,
                        l_label_str
                    );
                }
            }
        }
    }

    // Langkah 6: Mengumpulkan semua hasil ke dalam struktur output.
    let mut l_labels: Vec<String> = Vec::new();
    let mut l_matrix_rows: Vec<Vec<i32>> = Vec::new();
    let mut contrast_info_strings: Vec<String> = Vec::new();

    collected_l_functions.sort_by_key(|k| k.0);
    for (_l_num, l_label_str, l_vec_coeffs, desc_str) in collected_l_functions {
        l_labels.push(l_label_str);
        l_matrix_rows.push(l_vec_coeffs);
        contrast_info_strings.push(desc_str);
    }

    // Menambahkan catatan-catatan penting pada hasil akhir.
    let mut notes = Vec::new();
    notes.push(format!("a. Design: {}", generate_design_string(&design_info)));
    if is_redundant_vec.iter().any(|&x| x) {
        notes.push(
            "b. One or more β parameters may be redundant (i.e., non-estimable due to data structure).".to_string()
        );
    }
    notes.push(
        "c. Reference levels are first alphabetically/numerically; Pivot levels are last alphabetically/numerically for each factor.".to_string()
    );
    notes.push(
        format!(
            "e. Factor processing order for effects based on first appearance in parameters: {:?}",
            all_factors_ordered
        )
    );
    notes.push(format!("f. Total unique, non-zero, L-vectors generated: {}", l_matrix_rows.len()));

    let estimable_function_entry = GeneralEstimableFunctionEntry {
        parameter: all_model_param_names.clone(),
        l_label: l_labels,
        l_matrix: l_matrix_rows,
        contrast_information: contrast_info_strings,
    };

    Ok(GeneralEstimableFunction {
        estimable_function: estimable_function_entry,
        notes,
    })
}
