use crate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ SpreadVsLevelPlots, SpreadVsLevelPoint },
};

use super::core::{ calculate_mean, calculate_std_deviation, extract_numeric_from_record };
use super::design_matrix::create_design_response_weights;
use super::factor_utils::{ generate_level_combinations, get_factor_levels };

/// Menghitung titik-titik untuk plot Sebaran vs. Tingkat (Spread vs. Level).
///
/// Plot ini adalah alat diagnostik yang digunakan untuk memeriksa asumsi homoskedastisitas
/// (varians yang konstan) dalam analisis statistik, khususnya dalam analisis varians (ANOVA).
/// Plot memetakan standar deviasi (sebaran) terhadap rata-rata (tingkat) untuk setiap
/// kombinasi level faktor. Jika varians konstan, titik-titik pada plot akan tersebar secara acak
/// tanpa pola yang jelas.
pub fn calculate_spread_vs_level_plots(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<SpreadVsLevelPlots, String> {
    // Dapatkan nama variabel dependen dari konfigurasi.
    // Variabel ini adalah variabel yang diukur atau diamati dalam analisis.
    let dep_var_name = config.main.dep_var
        .as_ref()
        .ok_or_else(|| "Variabel dependen tidak ditentukan dalam konfigurasi".to_string())?;

    // Buat matriks desain untuk mendapatkan struktur data.
    // Matriks desain merepresentasikan hubungan antara variabel independen (faktor)
    // dan variabel dependen dalam model statistik.
    let design_info = create_design_response_weights(data, config)?;

    // Inisialisasi vektor untuk menyimpan titik-titik plot (rata-rata level vs. standar deviasi).
    let mut points = Vec::new();

    // Kumpulkan level untuk setiap faktor dari data.
    // Faktor adalah variabel independen kategoris. Level adalah nilai-nilai unik dalam faktor tersebut.
    // "Intercept" dan interaksi (istilah yang mengandung '*') diabaikan karena kita hanya
    // tertarik pada faktor-faktor utama untuk plot ini.
    let mut factor_levels = Vec::new();
    for term_name in &design_info.term_names {
        if term_name != "Intercept" && !term_name.contains('*') {
            if let Some(levels) = get_factor_levels(data, term_name).ok() {
                factor_levels.push((term_name.clone(), levels));
            }
        }
    }

    // Buat semua kemungkinan kombinasi dari level-level faktor.
    // Contoh: Jika ada Faktor A (level A1, A2) dan Faktor B (level B1, B2),
    // kombinasinya adalah (A1, B1), (A1, B2), (A2, B1), dan (A2, B2).
    let mut combinations = Vec::new();
    generate_level_combinations(
        &factor_levels,
        &mut std::collections::HashMap::new(),
        0,
        &mut combinations
    );

    // Iterasi melalui setiap kombinasi level faktor untuk mengumpulkan data
    // dan menghitung statistik yang diperlukan.
    for combo in &combinations {
        // Vektor untuk menyimpan nilai-nilai variabel dependen yang sesuai
        // dengan kombinasi level faktor saat ini.
        let mut values = Vec::new();

        // Iterasi melalui setiap baris data (kasus) yang relevan untuk analisis.
        for (row_idx, &case_idx) in design_info.case_indices_to_keep.iter().enumerate() {
            if let Some(records) = data.dependent_data.get(0) {
                if let Some(record) = records.get(case_idx) {
                    let mut matches = true;

                    // Periksa apakah baris data saat ini cocok dengan kombinasi level faktor.
                    // Pencocokan dilakukan dengan memeriksa nilai pada matriks desain.
                    // Nilai 1.0 pada kolom yang sesuai dengan suatu level faktor menunjukkan
                    // bahwa baris data tersebut termasuk dalam level tersebut.
                    for (factor, _level) in combo {
                        if
                            let Some((start_col, end_col)) =
                                design_info.term_column_indices.get(factor)
                        {
                            let mut factor_matches = false;
                            for col in *start_col..=*end_col {
                                if design_info.x[(row_idx, col)] == 1.0 {
                                    factor_matches = true;
                                    break;
                                }
                            }
                            if !factor_matches {
                                matches = false;
                                break;
                            }
                        } else {
                            matches = false;
                            break;
                        }
                    }

                    // Jika baris data cocok, ekstrak nilai numerik dari variabel dependen
                    // dan tambahkan ke dalam vektor `values`.
                    if matches {
                        if let Some(value) = extract_numeric_from_record(record, &dep_var_name) {
                            values.push(value);
                        }
                    }
                }
            }
        }

        // Lakukan perhitungan statistik hanya jika ada lebih dari satu nilai data.
        // Standar deviasi tidak dapat dihitung hanya dengan satu titik data.
        if values.len() > 1 {
            // Hitung rata-rata (mean) dari nilai-nilai data untuk kombinasi level ini.
            // Rumus: Rata-rata (μ) = Σx / n
            // Tujuan: Menjadi ukuran tendensi sentral, merepresentasikan "tingkat" (level) pada plot.
            // Interpretasi: Nilai ini menjadi koordinat-x (sumbu horizontal) pada plot.
            let level_mean = calculate_mean(&values);

            // Hitung standar deviasi (simpangan baku) dari nilai-nilai data.
            // Rumus: Standar Deviasi Sampel (s) = sqrt( Σ(x - μ)² / (n - 1) )
            // Tujuan: Mengukur sebaran atau variabilitas data di sekitar rata-ratanya.
            // Interpretasi: Nilai ini menjadi koordinat-y (sumbu vertikal) pada plot,
            // merepresentasikan "sebaran" (spread).
            let std_deviation = calculate_std_deviation(&values, Some(level_mean));

            // Simpan pasangan (rata-rata, standar deviasi) sebagai satu titik plot.
            points.push(SpreadVsLevelPoint {
                level_mean,
                spread_standard_deviation: std_deviation,
            });
        }
    }

    // Kembalikan struktur hasil yang berisi semua titik plot yang telah dihitung.
    Ok(SpreadVsLevelPlots { points })
}
