use std::collections::{ BTreeMap, HashMap };

use crate::models::{ config::UnivariateConfig, data::AnalysisData, result::BetweenSubjectFactors };

use super::core::*;

/// Memproses ringkasan data dasar yang selalu dieksekusi sebagai bagian dari analisis.
///
/// Fungsi ini bertujuan untuk menghitung dan merangkum informasi dasar dari data,
/// seperti jumlah kemunculan setiap level pada faktor tetap (fixed factors) dan
/// faktor acak (random factors). Hasilnya digunakan untuk memberikan gambaran
/// awal mengenai distribusi data antar subjek.
///
/// Perhitungan yang dilakukan adalah frekuensi atau jumlah kemunculan (frequency count)
/// untuk setiap level dari faktor yang dianalisis.
/// - **Tujuan**: Memahami distribusi subjek atau observasi di setiap kategori/level faktor.
/// - **Interpretasi**: Angka yang lebih tinggi menunjukkan lebih banyak data pada level tersebut.
pub fn basic_processing_summary(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HashMap<String, BetweenSubjectFactors>, String> {
    // Inisialisasi HashMap untuk menampung hasil ringkasan.
    let mut result = HashMap::new();

    // Proses Faktor Tetap (Fixed Factors)
    if let Some(fix_factors) = &config.main.fix_factor {
        // Iterasi melalui setiap nama faktor tetap yang telah ditentukan dalam konfigurasi.
        for factor_name in fix_factors {
            // Dapatkan semua level unik untuk faktor saat ini.
            let levels = get_factor_levels(data, factor_name)?;
            let mut level_counts = HashMap::new();

            // Inisialisasi jumlah hitungan untuk setiap level dengan nilai 0.
            // Ini memastikan bahwa semua level akan ada di hasil akhir, bahkan jika jumlahnya 0.
            for level in levels {
                level_counts.insert(level, 0);
            }

            // Cari grup data yang berisi definisi untuk faktor saat ini.
            // Data faktor dikelompokkan, jadi kita perlu menemukan grup yang benar.
            for (group_idx, def_group) in data.fix_factor_data_defs.iter().enumerate() {
                if def_group.iter().any(|def| &def.name == factor_name) {
                    // Jika grup ditemukan, proses setiap catatan data dalam grup tersebut.
                    if let Some(data_records) = data.fix_factor_data.get(group_idx) {
                        for record in data_records {
                            // Jika catatan memiliki nilai untuk faktor ini, tingkatkan hitungannya.
                            if let Some(value) = record.values.get(factor_name) {
                                let level = data_value_to_string(value);
                                *level_counts.entry(level).or_insert(0) += 1;
                            }
                        }
                    }
                }
            }

            // Konversi HashMap ke BTreeMap untuk mengurutkan hasil berdasarkan nama level (kunci).
            // BTreeMap secara otomatis menjaga urutan kunci.
            let sorted_counts = level_counts.into_iter().collect::<BTreeMap<String, usize>>();
            result.insert(factor_name.clone(), BetweenSubjectFactors {
                factors: sorted_counts,
                note: None,
                interpretation: Some(
                    "This table shows the frequency count (N) for each level of the between-subjects factors. It indicates how many subjects or observations fall into each category.".to_string()
                ),
            });
        }
    }

    // Proses Faktor Acak (Random Factors)
    // Proses ini hanya berjalan jika faktor acak didefinisikan dalam konfigurasi.
    if let Some(random_factors) = &config.main.rand_factor {
        if let Some(random_factor_data) = &data.random_factor_data {
            // Logika pemrosesan faktor acak mirip dengan faktor tetap.
            for factor_name in random_factors {
                let levels = get_factor_levels(data, factor_name)?;
                let mut level_counts = HashMap::new();

                for level in levels {
                    level_counts.insert(level, 0);
                }

                // Cari dan proses data untuk faktor acak.
                if let Some(random_defs_groups) = &data.random_factor_data_defs {
                    for (group_idx, def_group) in random_defs_groups.iter().enumerate() {
                        if def_group.iter().any(|def| &def.name == factor_name) {
                            if let Some(data_records) = random_factor_data.get(group_idx) {
                                for record in data_records {
                                    if let Some(value) = record.values.get(factor_name) {
                                        let level = data_value_to_string(value);
                                        *level_counts.entry(level).or_insert(0) += 1;
                                    }
                                }
                            }
                        }
                    }
                }

                // Urutkan dan simpan hasil, tambahkan penanda "(Random)" pada nama faktor.
                let sorted_counts = level_counts.into_iter().collect::<BTreeMap<String, usize>>();
                result.insert(format!("{} (Random)", factor_name), BetweenSubjectFactors {
                    factors: sorted_counts,
                    note: None,
                    interpretation: Some(
                        "This table shows the frequency count (N) for each level of the between-subjects factors. It indicates how many subjects or observations fall into each category.".to_string()
                    ),
                });
            }
        }
    }

    // Kembalikan hasil ringkasan yang telah diproses.
    Ok(result)
}
