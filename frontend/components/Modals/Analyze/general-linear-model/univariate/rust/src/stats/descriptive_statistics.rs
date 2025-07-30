use std::collections::HashMap;

use crate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ DescriptiveStatistics, DescriptiveStatGroup, StatsEntry },
};

use super::core::*;

/**
 * Membangun struktur grup statistik deskriptif secara rekursif.
 *
 * Fungsi ini membuat struktur pohon (tree-like) dari grup statistik. Setiap node dalam pohon
 * merepresentasikan sebuah level dari suatu faktor. Ini memungkinkan penyajian data yang
 * hierarkis, di mana statistik untuk sub-grup ditampilkan di dalam grup utamanya.
 *
 */
fn build_groups_recursive(
    factor_names: &[String],
    factor_levels_map: &HashMap<String, Vec<String>>,
    stats_entries: &HashMap<String, StatsEntry>,
    level: usize,
    current_path: &mut Vec<(String, String)>
) -> Vec<DescriptiveStatGroup> {
    // Kasus dasar: Hentikan rekursi jika semua level faktor telah diproses.
    if level >= factor_names.len() {
        return vec![];
    }

    let factor_name = &factor_names[level];
    let mut levels = factor_levels_map.get(factor_name).cloned().unwrap_or_default();
    // Tambahkan "Total" untuk menghitung statistik agregat pada level ini.
    levels.push("Total".to_string());

    let mut groups = Vec::new();

    for value in levels {
        current_path.push((factor_name.clone(), value.clone()));

        // Kunci untuk 'Total' pada suatu faktor di jalur tertentu adalah jalur hingga faktor tersebut,
        // dengan 'Total' untuk faktor itu dan semua faktor berikutnya.
        let mut key_map = current_path.iter().cloned().collect::<HashMap<_, _>>();
        for i in level + 1..factor_names.len() {
            key_map.insert(factor_names[i].clone(), "Total".to_string());
        }
        // Buat kunci unik untuk mengambil statistik yang sudah dihitung sebelumnya.
        // Kunci ini merepresentasikan kombinasi level faktor, contoh: "FaktorA=Level1;FaktorB=Total"
        let key = factor_names
            .iter()
            .map(|f| format!("{}={}", f, key_map.get(f).unwrap_or(&"Total".to_string())))
            .collect::<Vec<_>>()
            .join(";");

        if let Some(stats) = stats_entries.get(&key) {
            // Panggilan rekursif untuk membangun sub-grup pada level berikutnya.
            let subgroups = build_groups_recursive(
                factor_names,
                factor_levels_map,
                stats_entries,
                level + 1,
                current_path
            );

            groups.push(DescriptiveStatGroup {
                factor_name: factor_name.clone(),
                factor_value: value.clone(),
                stats: stats.clone(),
                subgroups,
                is_total: value == "Total",
            });
        }

        current_path.pop();
    }

    groups
}

/**
 * Menghitung statistik deskriptif untuk analisis univariat.
 *
 * Fungsi ini merupakan titik masuk utama untuk kalkulasi statistik deskriptif.
 * Prosesnya meliputi:
 * 1. Mengidentifikasi variabel dependen dan faktor-faktor dari konfigurasi.
 * 2. Menangani kasus tanpa faktor (hanya grand total).
 * 3. Menghasilkan semua kombinasi level dari faktor-faktor yang ada, termasuk level "Total".
 * 4. Mengagregasi data dari berbagai sumber (dependen, faktor tetap, faktor acak).
 * 5. Menghitung statistik (N, rata-rata, standar deviasi, dll.) untuk setiap kombinasi.
 * 6. Menyusun hasil statistik ke dalam struktur hierarkis menggunakan `build_groups_recursive`.
 *
 * # Arguments
 * * `data` - `AnalysisData` yang berisi data mentah untuk analisis.
 * * `config` - `UnivariateConfig` yang berisi konfigurasi analisis, seperti variabel dan faktor.
 *
 * # Returns
 * `Result<HashMap<String, DescriptiveStatistics>, String>` - Hasil yang berisi statistik deskriptif
 * yang terstruktur, atau pesan error jika terjadi kegagalan.
 */
pub fn calculate_descriptive_statistics(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HashMap<String, DescriptiveStatistics>, String> {
    // --- 1. Inisialisasi dan Pengumpulan Faktor ---
    let dep_var_name = config.main.dep_var
        .as_ref()
        .ok_or_else(|| "Dependent variable not specified in the configuration".to_string())?;

    // Kumpulkan semua faktor (tetap dan acak) dari konfigurasi.
    let mut all_factors = Vec::new();
    if let Some(fix_factors) = &config.main.fix_factor {
        all_factors.extend(fix_factors.clone());
    }
    if let Some(rand_factors) = &config.main.rand_factor {
        all_factors.extend(rand_factors.clone());
    }

    // --- 2. Kasus Khusus: Tidak Ada Faktor (Grand Total) ---
    if all_factors.is_empty() {
        // Jika tidak ada faktor, hitung statistik total (grand total) untuk semua data.
        let mut values_with_weights = Vec::new();
        if !data.dependent_data.is_empty() && !data.dependent_data[0].is_empty() {
            for i in 0..data.dependent_data[0].len() {
                if let Some(dep_rec) = data.dependent_data[0].get(i) {
                    if let Some(val_str) = dep_rec.values.get(dep_var_name) {
                        if let Ok(num) = data_value_to_string(val_str).parse::<f64>() {
                            // Asumsi bobot 1.0 jika tidak ada informasi bobot (misalnya, bukan WLS).
                            values_with_weights.push((num, 1.0));
                        }
                    }
                }
            }
        }
        let stats = calculate_stats_for_values(&values_with_weights);
        return Ok(
            HashMap::from([
                (
                    dep_var_name.clone(),
                    DescriptiveStatistics {
                        dependent_variable: dep_var_name.clone(),
                        groups: vec![DescriptiveStatGroup {
                            factor_name: "".to_string(),
                            factor_value: "Total".to_string(),
                            stats,
                            subgroups: vec![],
                            is_total: true,
                        }],
                        factor_names: all_factors,
                        note: None,
                        interpretation: Some(
                            "Provides the overall mean, standard deviation, and count for the dependent variable across all cases, as no factors were specified.".to_string()
                        ),
                    },
                ),
            ])
        );
    }

    // --- 3. Pengumpulan Data dan Perhitungan Statistik dalam Satu Langkah (Optimized) ---
    let n_obs = data.dependent_data.get(0).map_or(0, |d| d.len());
    if n_obs == 0 {
        return Err("Tidak ada data yang tersedia untuk statistik deskriptif".to_string());
    }

    // Buat peta lokasi untuk pencarian data faktor yang cepat, menghindari iterasi berulang.
    let mut factor_locations: HashMap<String, (bool, usize)> = HashMap::new();
    for factor_name in &all_factors {
        let mut found = false;
        // Cari di faktor tetap
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
        // Cari di faktor acak
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

    // Agregasi nilai berdasarkan kunci kombinasi dalam satu iterasi.
    let mut combo_values: HashMap<String, Vec<(f64, f64)>> = HashMap::new();

    for i in 0..n_obs {
        // Ambil nilai variabel dependen untuk observasi saat ini.
        if
            let Some(dep_val) = data.dependent_data[0]
                .get(i)
                .and_then(|r| r.values.get(dep_var_name))
                .and_then(|val| data_value_to_string(val).parse::<f64>().ok())
        {
            let weight = 1.0; // Asumsi bobot 1.0 (OLS). Bisa diperluas untuk WLS.

            // Dapatkan semua level faktor untuk observasi saat ini.
            let mut observation_levels = HashMap::new();
            let mut skip_obs = false;
            for factor_name in &all_factors {
                if let Some(&(is_fixed, group_idx)) = factor_locations.get(factor_name) {
                    let data_source = if is_fixed {
                        data.fix_factor_data.get(group_idx)
                    } else {
                        data.random_factor_data.as_ref().and_then(|d| d.get(group_idx))
                    };
                    if
                        let Some(value) = data_source
                            .and_then(|g| g.get(i))
                            .and_then(|r| r.values.get(factor_name))
                    {
                        observation_levels.insert(factor_name.clone(), data_value_to_string(value));
                    } else {
                        skip_obs = true; // Lewati observasi jika ada data faktor yang hilang.
                        break;
                    }
                }
            }
            if skip_obs {
                continue;
            }

            // Hasilkan semua "super-kombinasi" (termasuk "Total") untuk observasi ini.
            let mut super_combos: Vec<HashMap<String, String>> = vec![HashMap::new()];
            for factor_name in &all_factors {
                let level = observation_levels.get(factor_name).unwrap();
                let mut next_combos = Vec::with_capacity(super_combos.len() * 2);
                for combo in super_combos {
                    let mut combo_with_level = combo.clone();
                    combo_with_level.insert(factor_name.clone(), level.clone());
                    next_combos.push(combo_with_level);

                    let mut combo_with_total = combo;
                    combo_with_total.insert(factor_name.clone(), "Total".to_string());
                    next_combos.push(combo_with_total);
                }
                super_combos = next_combos;
            }

            // Tambahkan nilai ke setiap kombinasi yang relevan.
            for combo in super_combos {
                let combo_key = all_factors
                    .iter()
                    .map(|f| format!("{}={}", f, combo.get(f).unwrap()))
                    .collect::<Vec<_>>()
                    .join(";");
                combo_values.entry(combo_key).or_default().push((dep_val, weight));
            }
        }
    }

    // Hitung statistik dari nilai-nilai yang telah dikumpulkan.
    let stats_entries: HashMap<String, StatsEntry> = combo_values
        .into_iter()
        .map(|(key, values)| (key, calculate_stats_for_values(&values)))
        .collect();

    // --- Persiapan untuk membangun struktur output ---
    // Dapatkan level-level faktor yang dibutuhkan oleh `build_groups_recursive`.
    let mut factor_levels_map = HashMap::new();
    for factor in &all_factors {
        let mut levels = get_factor_levels(data, factor)?;
        levels.sort();
        factor_levels_map.insert(factor.clone(), levels);
    }

    // --- 6. Penyusunan Hasil Akhir ---
    // Susun statistik yang telah dihitung ke dalam struktur hierarkis.
    let groups = build_groups_recursive(
        &all_factors,
        &factor_levels_map,
        &stats_entries,
        0,
        &mut vec![]
    );

    Ok(
        HashMap::from([
            (
                dep_var_name.clone(),
                DescriptiveStatistics {
                    dependent_variable: dep_var_name.clone(),
                    groups,
                    factor_names: all_factors,
                    note: None,
                    interpretation: Some(
                        "This table displays the mean, standard deviation, and count (N) for the dependent variable, broken down by each level of the specified factors and their combinations.".to_string()
                    ),
                },
            ),
        ])
    )
}
