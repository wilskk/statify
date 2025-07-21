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

    // --- 3. Generasi Kombinasi Level Faktor ---
    // Dapatkan semua level unik untuk setiap faktor dari data.
    let mut factor_levels_with_total = Vec::new();
    let mut factor_levels_map = HashMap::new();
    for factor in &all_factors {
        let mut levels = get_factor_levels(data, factor)?;
        levels.sort();
        factor_levels_map.insert(factor.clone(), levels.clone());
        // Tambahkan "Total" untuk memungkinkan perhitungan statistik agregat per faktor.
        levels.push("Total".to_string());
        factor_levels_with_total.push((factor.clone(), levels));
    }

    // Buat semua kemungkinan kombinasi dari level faktor (termasuk "Total").
    // Ini adalah dasar untuk grid statistik yang akan dihitung.
    let mut all_combinations = Vec::new();
    generate_level_combinations(
        &factor_levels_with_total,
        &mut HashMap::new(),
        0,
        &mut all_combinations
    );

    // --- 4. Konsolidasi Data Observasi ---
    // Gabungkan semua data (dependen, faktor tetap, faktor acak) ke dalam satu
    // struktur per observasi untuk mempermudah pemfilteran.
    let n_obs = if !data.dependent_data.is_empty() && !data.dependent_data[0].is_empty() {
        data.dependent_data[0].len()
    } else {
        return Err("Tidak ada data yang tersedia untuk statistik deskriptif".to_string());
    };
    let mut all_records: Vec<HashMap<String, String>> = Vec::with_capacity(n_obs);
    for i in 0..n_obs {
        let mut record = HashMap::new();
        // Variabel dependen
        if let Some(dep) = data.dependent_data[0].get(i) {
            for (k, v) in &dep.values {
                record.insert(k.clone(), data_value_to_string(v));
            }
        }
        // Faktor tetap
        for fix_set in &data.fix_factor_data {
            if let Some(fix) = fix_set.get(i) {
                for (k, v) in &fix.values {
                    record.insert(k.clone(), data_value_to_string(v));
                }
            }
        }
        // Faktor acak
        if let Some(rand_sets) = &data.random_factor_data {
            for rand_set in rand_sets {
                if let Some(rand) = rand_set.get(i) {
                    for (k, v) in &rand.values {
                        record.insert(k.clone(), data_value_to_string(v));
                    }
                }
            }
        }
        all_records.push(record);
    }

    // --- 5. Perhitungan Statistik untuk Setiap Kombinasi ---
    let mut stats_entries = HashMap::new();
    for combo in &all_combinations {
        // Buat kunci yang deterministik dan unik untuk setiap kombinasi.
        // Urutan faktor dipertahankan agar kunci konsisten.
        let combo_key_parts: Vec<String> = all_factors
            .iter()
            .map(|factor_name| {
                let level = combo
                    .get(factor_name)
                    .cloned()
                    .unwrap_or_else(|| "Total".to_string());
                format!("{}={}", factor_name, level)
            })
            .collect();
        let combo_key = combo_key_parts.join(";");

        let mut values_with_weights = Vec::new();
        for record in &all_records {
            // Periksa apakah record cocok dengan kombinasi level faktor saat ini.
            let mut matches = true;
            for (factor, level) in combo {
                if level == "Total" {
                    continue; // "Total" berarti tidak memfilter berdasarkan faktor ini.
                }
                if record.get(factor) != Some(level) {
                    matches = false;
                    break;
                }
            }
            // Jika cocok, tambahkan nilai variabel dependen dan bobotnya.
            if matches {
                let dep_val = record.get(dep_var_name).and_then(|s| s.parse::<f64>().ok());
                let weight = record
                    .get("wls_weight_value")
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or(1.0); // Bobot default 1.0 (untuk OLS).
                if let Some(num) = dep_val {
                    values_with_weights.push((num, weight));
                }
            }
        }
        // Hitung statistik inti (N, rata-rata, std dev, dll.) untuk data yang telah difilter.
        // - Rata-rata (Mean): Ukuran tendensi sentral, menunjukkan nilai "khas".
        // - Standar Deviasi (Std Dev): Ukuran sebaran data, menunjukkan seberapa jauh
        //   data dari rata-ratanya. Nilai kecil berarti data cenderung dekat dengan rata-rata.
        let stats = calculate_stats_for_values(&values_with_weights);
        stats_entries.insert(combo_key, stats);
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
