use std::collections::{ HashMap, HashSet };

use crate::models::{ config::UnivariateConfig, data::AnalysisData, result::DesignMatrixInfo };
use super::core::*;

/// Mem-parsing sebuah string istilah interaksi (misalnya, "A*B") menjadi komponen faktor individual.
/// Fungsi ini memecah string berdasarkan karakter '*' untuk mengidentifikasi faktor-faktor
/// yang terlibat dalam interaksi.
pub fn parse_interaction_term(term: &str) -> Vec<String> {
    term.split('*')
        .map(|s| s.trim().to_string())
        .collect()
}

/// Mem-parsing nama parameter yang terstruktur (misalnya, "[FaktorA=Level1]*[FaktorB=Level2]")
/// menjadi sebuah `HashMap` di mana kunci adalah nama faktor dan nilai adalah levelnya.
/// Fungsi ini juga menangani kasus khusus untuk "Intercept".
pub fn parse_parameter_name(param_str: &str) -> HashMap<String, String> {
    let mut factors = HashMap::new();
    if param_str == "Intercept" {
        factors.insert("Intercept".to_string(), "Intercept".to_string());
        return factors;
    }
    param_str.split('*').for_each(|part| {
        let clean_part = part.trim_matches(|c| (c == '[' || c == ']'));
        if let Some((factor, level)) = clean_part.split_once('=') {
            factors.insert(factor.to_string(), level.to_string());
        }
    });
    factors
}

/// Mengambil semua level unik untuk sebuah faktor dari data analisis.
///
/// # Arguments
/// * `data` - Referensi ke `AnalysisData` yang berisi semua data yang dibutuhkan.
/// * `factor_name` - Nama faktor yang levelnya ingin dicari.
///
/// # Returns
/// * `Ok(Vec<String>)` - Vektor berisi level-level unik dari faktor jika ditemukan.
///   Jika `factor_name` adalah kovariat, akan mengembalikan vektor kosong.
/// * `Err(String)` - Pesan error jika `factor_name` tidak ditemukan dalam definisi
///   faktor maupun kovariat.
pub fn get_factor_levels(data: &AnalysisData, factor_name: &str) -> Result<Vec<String>, String> {
    let mut level_set = HashSet::new();
    let mut factor_definition_found_in_factors = false;
    let mut factor_definition_found_in_covariates = false;

    // Periksa apakah `factor_name` ada di dalam definisi faktor tetap (fixed factors).
    // Jika ditemukan, kumpulkan semua level uniknya.
    for (group_idx, def_group) in data.fix_factor_data_defs.iter().enumerate() {
        if def_group.iter().any(|def| def.name == factor_name) {
            factor_definition_found_in_factors = true;
            if let Some(data_records_for_group) = data.fix_factor_data.get(group_idx) {
                for record in data_records_for_group {
                    if let Some(value) = record.values.get(factor_name) {
                        level_set.insert(data_value_to_string(value));
                    }
                }
            }
            break; // Ditemukan, tidak perlu lanjut mencari di definisi lain.
        }
    }

    // Jika tidak ditemukan di faktor tetap, periksa di faktor acak (random factors).
    if !factor_definition_found_in_factors {
        if let Some(random_defs_groups) = &data.random_factor_data_defs {
            for (group_idx, def_group) in random_defs_groups.iter().enumerate() {
                if def_group.iter().any(|def| def.name == factor_name) {
                    factor_definition_found_in_factors = true;
                    if let Some(random_data_groups_vec) = &data.random_factor_data {
                        if let Some(data_records_for_group) = random_data_groups_vec.get(group_idx) {
                            for record in data_records_for_group {
                                if let Some(value) = record.values.get(factor_name) {
                                    level_set.insert(data_value_to_string(value));
                                }
                            }
                        }
                    }
                    break; // Ditemukan, tidak perlu lanjut.
                }
            }
        }
    }

    // Secara terpisah, periksa apakah `factor_name` didefinisikan sebagai kovariat.
    if let Some(covar_defs_groups) = &data.covariate_data_defs {
        for def_group in covar_defs_groups {
            if def_group.iter().any(|def| def.name == factor_name) {
                factor_definition_found_in_covariates = true;
                break;
            }
        }
    }

    // Berdasarkan hasil pencarian, kembalikan nilai yang sesuai.
    if factor_definition_found_in_factors {
        // Ini adalah faktor kategorikal, kembalikan level-levelnya yang sudah diurutkan.
        let mut levels: Vec<String> = level_set.into_iter().collect();
        levels.sort();
        Ok(levels)
    } else if factor_definition_found_in_covariates {
        // Ini adalah kovariat (kontinu), kembalikan list kosong.
        Ok(Vec::new())
    } else {
        // Istilah tidak ditemukan di mana pun.
        Err(
            format!("Term \'{}\' not found as a factor or covariate in the data definitions", factor_name)
        )
    }
}

/// Mencari data yang cocok dengan kombinasi level faktor tertentu dan menghasilkan
/// vektor (kolom matriks desain) yang merepresentasikan kecocokan tersebut.
/// Vektor ini berisi `1.0` untuk baris data yang cocok dan `0.0` untuk yang tidak.
/// Ini adalah proses pembuatan variabel dummy untuk kombinasi level tertentu.
pub fn matches_combination(combo: &HashMap<String, String>, data: &AnalysisData) -> Vec<f64> {
    let n_samples = data.dependent_data[0].len();
    let mut row = vec![0.0; n_samples];

    // Untuk setiap record/baris data, periksa apakah cocok dengan semua kombinasi faktor.
    for (i, _) in data.dependent_data[0].iter().enumerate() {
        let mut matches = true;

        for (factor, level) in combo {
            let mut factor_matches = false;

            // Periksa di faktor tetap (fixed factors)
            for (group_idx, def_group) in data.fix_factor_data_defs.iter().enumerate() {
                if def_group.iter().any(|def| &def.name == factor) {
                    if let Some(data_records) = data.fix_factor_data.get(group_idx) {
                        if let Some(record) = data_records.get(i) {
                            if let Some(value) = record.values.get(factor) {
                                if data_value_to_string(value) == *level {
                                    factor_matches = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            // Periksa di faktor acak (random factors)
            if let Some(random_defs_groups) = &data.random_factor_data_defs {
                for (group_idx, def_group) in random_defs_groups.iter().enumerate() {
                    if def_group.iter().any(|def| &def.name == factor) {
                        if let Some(random_data_groups_vec) = &data.random_factor_data {
                            if let Some(data_records) = random_data_groups_vec.get(group_idx) {
                                if let Some(record) = data_records.get(i) {
                                    if let Some(value) = record.values.get(factor) {
                                        if data_value_to_string(value) == *level {
                                            factor_matches = true;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Periksa di kovariat
            if let Some(covar_defs_groups) = &data.covariate_data_defs {
                for (group_idx, def_group) in covar_defs_groups.iter().enumerate() {
                    if def_group.iter().any(|def| &def.name == factor) {
                        if let Some(covar_data_groups_vec) = &data.covariate_data {
                            if let Some(data_records) = covar_data_groups_vec.get(group_idx) {
                                if let Some(record) = data_records.get(i) {
                                    if let Some(value) = record.values.get(factor) {
                                        if data_value_to_string(value) == *level {
                                            factor_matches = true;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if !factor_matches {
                matches = false;
                break;
            }
        }

        if matches {
            row[i] = 1.0;
        }
    }
    row
}

/// Fungsi pembantu rekursif untuk menghasilkan semua kombinasi istilah dari `factors`
/// dengan ukuran `size` tertentu. Digunakan untuk membuat istilah interaksi.
pub fn generate_lower_order_terms(
    factors: &[String],
    size: usize,
    current: &mut Vec<String>,
    start: usize,
    result: &mut Vec<String>
) {
    if current.len() == size {
        // Gabungkan faktor-faktor dengan "*" untuk membuat istilah interaksi.
        result.push(current.join("*"));
        return;
    }

    for i in start..factors.len() {
        current.push(factors[i].clone());
        generate_lower_order_terms(factors, size, current, i + 1, result);
        current.pop();
    }
}

/// Menghasilkan semua kemungkinan istilah interaksi (orde 2 hingga N) dari daftar faktor yang diberikan.
/// Misalnya, untuk faktor [A, B, C], akan menghasilkan ["A*B", "A*C", "B*C", "A*B*C"].
pub fn generate_interaction_terms(factors: &[String]) -> Vec<String> {
    if factors.is_empty() {
        return Vec::new();
    }
    let mut interactions = Vec::new();

    // Hasilkan semua kombinasi dari ukuran 2 hingga N (jumlah total faktor)
    for size in 2..=factors.len() {
        generate_lower_order_terms(factors, size, &mut Vec::new(), 0, &mut interactions);
    }
    interactions
}

/// Fungsi rekursif untuk menghasilkan semua kemungkinan kombinasi dari level-level faktor.
/// Hasilnya adalah daftar `HashMap`, di mana setiap `HashMap` merepresentasikan satu kombinasi unik.
pub fn generate_level_combinations(
    factor_levels: &[(String, Vec<String>)],
    current_combo: &mut HashMap<String, String>,
    index: usize,
    result: &mut Vec<HashMap<String, String>>
) {
    if index == factor_levels.len() {
        result.push(current_combo.clone());
        return;
    }

    let (factor, levels) = &factor_levels[index];
    for level in levels {
        current_combo.insert(factor.clone(), level.clone());
        generate_level_combinations(factor_levels, current_combo, index + 1, result);
    }
}

/// Menghasilkan daftar istilah model untuk model non-kustom (misalnya, full factorial).
/// Termasuk semua efek utama (main effects) dari faktor dan kovariat, serta semua
/// interaksi yang mungkin antara faktor-faktor (tetap dan acak).
pub fn generate_non_cust_terms(config: &UnivariateConfig) -> Result<Vec<String>, String> {
    let mut terms = Vec::new();
    let mut factors_for_interaction = Vec::new();

    // Tambahkan Kovariat sebagai efek utama. Kovariat tidak diikutkan dalam interaksi.
    if let Some(covariates) = &config.main.covar {
        for covar_name in covariates {
            if !terms.contains(covar_name) {
                terms.push(covar_name.clone());
            }
        }
    }

    // Tambahkan efek utama untuk Faktor Tetap dan kumpulkan untuk generasi interaksi.
    if let Some(fix_factors) = &config.main.fix_factor {
        for factor_name in fix_factors {
            if !terms.contains(factor_name) {
                terms.push(factor_name.clone());
            }
            factors_for_interaction.push(factor_name.clone());
        }
    }

    // Tambahkan efek utama untuk Faktor Acak dan kumpulkan untuk generasi interaksi.
    if let Some(random_factors) = &config.main.rand_factor {
        for factor_name in random_factors {
            if !terms.contains(factor_name) {
                terms.push(factor_name.clone());
            }
            factors_for_interaction.push(factor_name.clone());
        }
    }

    // Tambahkan semua interaksi yang mungkin antara Faktor Tetap dan Acak.
    if factors_for_interaction.len() > 1 {
        terms.extend(generate_interaction_terms(&factors_for_interaction));
    }
    Ok(terms)
}

/// Menghasilkan daftar istilah model berdasarkan konfigurasi model kustom yang ditentukan pengguna.
/// Hanya istilah yang secara eksplisit disebutkan dalam `cov_model` dan `factors_model`
/// yang akan disertakan dalam model.
pub fn generate_custom_terms(config: &UnivariateConfig) -> Result<Vec<String>, String> {
    let mut terms = Vec::new();

    // Tambahkan kovariat dari model kustom sebagai efek utama.
    if let Some(cov_model_str) = &config.model.cov_model {
        for term_name in cov_model_str.split_whitespace() {
            if !terms.contains(&term_name.to_string()) {
                terms.push(term_name.to_string());
            }
        }
    }

    // Tambahkan efek utama dari model faktor kustom.
    // Interaksi harus didefinisikan secara eksplisit oleh pengguna dalam file konfigurasi.
    if let Some(factors_model) = &config.model.factors_model {
        for factor_name in factors_model {
            if !terms.contains(factor_name) {
                terms.push(factor_name.clone());
            }
        }
    }
    Ok(terms)
}

/// Membuat representasi string yang mudah dibaca dari desain model statistik,
/// misalnya, "Design: Intercept + FaktorA + FaktorB". Berguna untuk pelaporan hasil.
pub fn generate_design_string(design_info: &DesignMatrixInfo) -> String {
    let mut design_string = if design_info.term_names.contains(&"Intercept".to_string()) {
        "Design: Intercept".to_string()
    } else {
        "Design: ".to_string()
    };

    // Tambahkan semua istilah selain Intercept ke dalam string.
    let terms: Vec<_> = design_info.term_names
        .iter()
        .filter(|&term| term != "Intercept")
        .collect();

    for term in terms {
        design_string.push_str(" + ");
        design_string.push_str(term);
    }
    design_string
}

/// Menghasilkan label-label (misalnya, "L1", "L2", "L3", ...) secara dinamis untuk setiap
/// kolom dalam matriks desain. Label ini dapat digunakan dalam pengujian kontras atau
/// analisis post-hoc untuk merujuk pada parameter model tertentu.
pub fn generate_l_labels(design_info: &DesignMatrixInfo) -> Vec<String> {
    let mut l_labels = Vec::new();
    let mut l_counter = 1;

    // Hasilkan label untuk setiap kolom berdasarkan istilah modelnya.
    for term_name in &design_info.term_names {
        if let Some((start_idx, end_idx)) = design_info.term_column_indices.get(term_name) {
            let num_cols = end_idx - start_idx + 1;
            for _ in 0..num_cols {
                l_labels.push(format!("L{}", l_counter));
                l_counter += 1;
            }
        }
    }
    l_labels
}

/// Menghasilkan nama parameter lengkap untuk setiap baris/estimasi dalam output statistik.
/// Nama ini mencakup level referensi untuk faktor dan interaksi, dan diurutkan sesuai
/// dengan urutan dalam matriks desain.
/// Contoh: "[FaktorA=Level1]", "[FaktorA=Level2]*[FaktorB=LevelX]", "KovariatC".
pub fn generate_all_row_parameter_names_sorted(
    design_info: &DesignMatrixInfo,
    data: &AnalysisData
) -> Result<Vec<String>, String> {
    let mut all_params = Vec::new();
    let mut factor_levels_map: HashMap<String, Vec<String>> = HashMap::new();

    // 1. Kumpulkan semua nama faktor unik dari semua istilah model.
    let mut unique_factors = HashSet::new();
    for term in &design_info.term_names {
        if term == "Intercept" {
            continue;
        }
        // Pecah istilah interaksi (misal: "A*B") menjadi faktor individual ("A", "B").
        for factor in term.split('*') {
            unique_factors.insert(factor.trim().to_string());
        }
    }

    // 2. Ambil level untuk setiap faktor unik yang telah diidentifikasi.
    for factor_name in unique_factors {
        match get_factor_levels(data, &factor_name) {
            Ok(levels) => {
                // `levels` akan kosong jika `factor_name` adalah kovariat.
                factor_levels_map.insert(factor_name, levels);
            }
            Err(e) => {
                return Err(format!("Error getting levels for factor '{}': {}", factor_name, e));
            }
        }
    }

    // 3. Proses setiap istilah dalam matriks desain untuk membuat nama parameter.
    for term_name in &design_info.term_names {
        if term_name == "Intercept" {
            all_params.push("Intercept".to_string());
            continue;
        }

        if let Some((start_idx, end_idx)) = design_info.term_column_indices.get(term_name) {
            let num_cols = end_idx - start_idx + 1;

            if term_name.contains('*') {
                // Kasus untuk Istilah Interaksi
                let factors_in_term = parse_interaction_term(term_name);

                // Verifikasi bahwa semua faktor dalam interaksi memiliki data level.
                for factor_name in &factors_in_term {
                    if !factor_levels_map.contains_key(factor_name) {
                        return Err(
                            format!(
                                "Levels not found for factor '{}' in interaction '{}'.",
                                factor_name,
                                term_name
                            )
                        );
                    }
                }

                // Siapkan set level untuk setiap faktor dalam interaksi.
                let mut level_sets: Vec<(&String, &Vec<String>)> = Vec::new();
                for factor_name in &factors_in_term {
                    if let Some(levels) = factor_levels_map.get(factor_name) {
                        if levels.is_empty() {
                            return Err(
                                format!(
                                    "Factor '{}' in interaction '{}' has no defined levels (might be a covariate).",
                                    factor_name,
                                    term_name
                                )
                            );
                        }
                        level_sets.push((factor_name, levels));
                    }
                }

                // Hasilkan semua kombinasi level untuk istilah interaksi.
                let mut current_combination_indices = vec![0; level_sets.len()];
                let mut generated = 0;

                'combo_loop: loop {
                    if generated >= num_cols {
                        break;
                    }

                    let mut param_parts = Vec::new();
                    for (idx, (factor_name, levels)) in level_sets.iter().enumerate() {
                        let level = &levels[current_combination_indices[idx]];
                        param_parts.push(format!("[{}={}]", factor_name, level));
                    }
                    all_params.push(param_parts.join("*"));
                    generated += 1;

                    // Logika untuk mendapatkan kombinasi berikutnya (seperti odometer).
                    let mut carry = level_sets.len() - 1;
                    loop {
                        current_combination_indices[carry] += 1;
                        if current_combination_indices[carry] < level_sets[carry].1.len() {
                            break;
                        }
                        current_combination_indices[carry] = 0;
                        if carry == 0 {
                            break 'combo_loop;
                        }
                        carry -= 1;
                    }
                }
            } else {
                // Kasus untuk Efek Utama (Main Effects)
                if let Some(levels) = factor_levels_map.get(term_name) {
                    if levels.is_empty() {
                        // Ini adalah kovariat, karena `get_factor_levels` mengembalikan vec kosong.
                        all_params.push(term_name.clone());
                    } else {
                        // Ini adalah faktor kategorikal, buat nama untuk setiap level.
                        for level in levels {
                            all_params.push(format!("[{}={}]", term_name, level));
                        }
                    }
                } else {
                    // Fallback, seharusnya tidak terjadi jika semua istilah diproses dengan benar.
                    all_params.push(term_name.clone());
                }
            }
        }
    }
    Ok(all_params)
}

/// Mengidentifikasi semua kombinasi unik dari level faktor yang ada dalam data (sel yang tidak kosong).
/// Fungsi ini sangat penting untuk analisis Tipe IV SS, yang sensitif terhadap adanya
/// sel kosong dalam desain.
///
/// # Arguments
/// * `data` - Referensi ke `AnalysisData` yang berisi semua data.
/// * `config` - Konfigurasi univariat untuk mengidentifikasi faktor-faktor dalam model.
///
/// # Returns
/// * `Ok(Vec<HashMap<String, String>>)` - Sebuah vektor di mana setiap `HashMap` merepresentasikan
///   satu sel yang unik dan tidak kosong. Kunci `HashMap` adalah nama faktor dan nilainya adalah level.
/// * `Err(String)` - Pesan error jika terjadi inkonsistensi data.
pub fn get_all_non_empty_cells(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<Vec<HashMap<String, String>>, String> {
    // 1. Kumpulkan semua nama faktor unik dari konfigurasi.
    let mut all_factor_names = HashSet::new();
    if let Some(fix_factors) = &config.main.fix_factor {
        all_factor_names.extend(fix_factors.iter().cloned());
    }
    if let Some(rand_factors) = &config.main.rand_factor {
        all_factor_names.extend(rand_factors.iter().cloned());
    }

    if all_factor_names.is_empty() {
        return Ok(Vec::new());
    }

    // Tentukan jumlah total sampel/baris data.
    let n_samples = if let Some(dep_data_group) = data.dependent_data.get(0) {
        dep_data_group.len()
    } else {
        return Ok(Vec::new()); // Tidak ada data untuk dianalisis.
    };

    if n_samples == 0 {
        return Ok(Vec::new());
    }

    // 2. Buat peta lokasi untuk setiap faktor agar pencarian lebih cepat.
    // Peta ini akan menyimpan: nama_faktor -> (apakah_faktor_tetap, indeks_grup).
    let mut factor_locations = HashMap::new();
    for factor_name in &all_factor_names {
        // Cari di faktor tetap.
        let mut found = false;
        for (group_idx, def_group) in data.fix_factor_data_defs.iter().enumerate() {
            if def_group.iter().any(|def| &def.name == factor_name) {
                factor_locations.insert(factor_name.clone(), (true, group_idx));
                found = true;
                break;
            }
        }
        if found {
            continue;
        }

        // Jika tidak ditemukan, cari di faktor acak.
        if let Some(rand_defs) = &data.random_factor_data_defs {
            for (group_idx, def_group) in rand_defs.iter().enumerate() {
                if def_group.iter().any(|def| &def.name == factor_name) {
                    factor_locations.insert(factor_name.clone(), (false, group_idx));
                    found = true;
                    break;
                }
            }
        }

        if !found {
            return Err(format!("Definisi untuk faktor '{}' tidak ditemukan.", factor_name));
        }
    }

    // 3. Iterasi melalui setiap baris data untuk membangun sel dan kumpulkan yang unik.
    let mut seen_representations = HashSet::new();
    let mut unique_cells = Vec::new();

    for i in 0..n_samples {
        let mut current_cell = HashMap::new();
        for factor_name in &all_factor_names {
            if let Some(&(is_fixed, group_idx)) = factor_locations.get(factor_name) {
                let data_records = if is_fixed {
                    data.fix_factor_data.get(group_idx)
                } else {
                    data.random_factor_data.as_ref().and_then(|d| d.get(group_idx))
                };

                if let Some(record) = data_records.and_then(|g| g.get(i)) {
                    if let Some(value) = record.values.get(factor_name) {
                        current_cell.insert(factor_name.clone(), data_value_to_string(value));
                    } else {
                        return Err(
                            format!(
                                "Inkonsistensi data: Nilai untuk faktor '{}' tidak ditemukan di baris {}.",
                                factor_name,
                                i
                            )
                        );
                    }
                }
            }
        }
        if !current_cell.is_empty() {
            // Buat representasi string kanonis dari sel untuk keperluan hashing.
            // Kunci diurutkan untuk memastikan representasi yang konsisten.
            let mut pairs: Vec<(&String, &String)> = current_cell.iter().collect();
            pairs.sort_unstable_by_key(|(k, _)| *k);
            let representation = pairs
                .into_iter()
                .map(|(k, v)| format!("{}={}", k, v))
                .collect::<Vec<_>>()
                .join(";");

            // Jika representasi ini belum pernah terlihat, tambahkan sel ke daftar unik.
            if seen_representations.insert(representation) {
                unique_cells.push(current_cell);
            }
        }
    }

    // 4. Konversi HashSet yang berisi sel-sel unik menjadi sebuah Vec.
    Ok(unique_cells)
}
