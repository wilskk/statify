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
    let mut result = HashMap::new();

    // Proses Faktor Tetap (Fixed Factors)
    if let Some(fix_factors) = &config.main.fix_factor {
        if !fix_factors.is_empty() {
            let mut factor_counts: HashMap<String, BTreeMap<String, usize>> = HashMap::new();

            // 1. Inisialisasi semua level faktor tetap dengan hitungan 0
            for factor_name in fix_factors {
                let levels = get_factor_levels(data, factor_name)?;
                let level_counts = levels
                    .into_iter()
                    .map(|level| (level, 0))
                    .collect();
                factor_counts.insert(factor_name.clone(), level_counts);
            }

            // 2. Iterasi melalui data sekali untuk mengisi hitungan
            for data_records in &data.fix_factor_data {
                for record in data_records {
                    for (factor_name, value) in &record.values {
                        if let Some(counts) = factor_counts.get_mut(factor_name) {
                            let level = data_value_to_string(value);
                            *counts.entry(level).or_insert(0) += 1;
                        }
                    }
                }
            }

            // 3. Format hasil
            for (factor_name, sorted_counts) in factor_counts {
                result.insert(factor_name, BetweenSubjectFactors {
                    factors: sorted_counts,
                    note: None,
                    interpretation: Some(
                        "This table shows the frequency count (N) for each level of the between-subjects factors. It indicates how many subjects or observations fall into each category.".to_string()
                    ),
                });
            }
        }
    }

    // Proses Faktor Acak (Random Factors)
    if let Some(random_factors) = &config.main.rand_factor {
        if let Some(random_factor_data) = &data.random_factor_data {
            if !random_factors.is_empty() {
                let mut factor_counts: HashMap<String, BTreeMap<String, usize>> = HashMap::new();

                // 1. Inisialisasi semua level faktor acak dengan hitungan 0
                for factor_name in random_factors {
                    let levels = get_factor_levels(data, factor_name)?;
                    let level_counts = levels
                        .into_iter()
                        .map(|level| (level, 0))
                        .collect();
                    factor_counts.insert(factor_name.clone(), level_counts);
                }

                // 2. Iterasi melalui data sekali untuk mengisi hitungan
                for data_records in random_factor_data {
                    for record in data_records {
                        for (factor_name, value) in &record.values {
                            if let Some(counts) = factor_counts.get_mut(factor_name) {
                                let level = data_value_to_string(value);
                                *counts.entry(level).or_insert(0) += 1;
                            }
                        }
                    }
                }

                // 3. Format hasil
                for (factor_name, sorted_counts) in factor_counts {
                    let key = format!("{} (Random)", factor_name);
                    result.insert(key, BetweenSubjectFactors {
                        factors: sorted_counts,
                        note: None,
                        interpretation: Some(
                            "This table shows the frequency count (N) for each level of the between-subjects factors. It indicates how many subjects or observations fall into each category.".to_string()
                        ),
                    });
                }
            }
        }
    }

    // Kembalikan hasil ringkasan yang telah diproses.
    Ok(result)
}
