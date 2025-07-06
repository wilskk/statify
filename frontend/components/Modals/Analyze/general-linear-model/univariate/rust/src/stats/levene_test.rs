use statrs::distribution::ContinuousCDF;
use rayon::prelude::*;
use crate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ LeveneCenter, LeveneTest, LeveneTestEntry },
};

use super::core::*;

/// Menghitung Uji Levene untuk homogenitas varians jika diminta dalam konfigurasi.
///
/// Uji Levene digunakan untuk menguji asumsi penting dalam statistik parametrik
/// bahwa varians dari beberapa grup adalah sama (homoskedastisitas).
pub fn calculate_levene_test(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<Vec<LeveneTest>, String> {
    // Tentukan variabel dependen yang akan dianalisis.
    let dep_var_name = config.main.dep_var
        .as_ref()
        .ok_or_else(|| "Variabel dependen tidak ditentukan dalam konfigurasi".to_string())?;

    // Buat matriks desain untuk variabel dependen.
    let design_info = match create_design_response_weights(data, config) {
        Ok(info) => info,
        Err(_) => {
            return Err("Failed to create design matrix".to_string());
        }
    };

    let design_string = generate_design_string(&design_info);

    // Tentukan data yang akan digunakan untuk Uji Levene.
    // Jika ada kovariat, gunakan residual dari model regresi.
    // Jika tidak ada, gunakan nilai mentah variabel dependen.
    // Menggunakan residual menghilangkan efek kovariat pada varians.
    let (data_for_levene, indices) = if config.main.covar.as_ref().map_or(true, |c| c.is_empty()) {
        // Tidak ada kovariat, gunakan data mentah.
        (design_info.y.as_slice().to_vec(), design_info.case_indices_to_keep.clone())
    } else {
        // Ada kovariat, hitung residual.
        let ztwz_matrix = create_cross_product_matrix(&design_info).map_err(|e| {
            format!("Failed to create cross product matrix: {}", e)
        })?;
        let swept_info = perform_sweep_and_extract_results(
            &ztwz_matrix,
            design_info.p_parameters
        ).map_err(|e| format!("Failed to perform sweep: {}", e))?;

        let y_hat = &design_info.x * &swept_info.beta_hat;
        let residuals = &design_info.y - y_hat;
        (residuals.as_slice().to_vec(), design_info.case_indices_to_keep.clone())
    };

    // Kelompokkan data berdasarkan faktor (variabel independen).
    let mut groups = create_groups_from_design_matrix(&design_info, &data_for_levene, &indices);

    // Sesuai perilaku SPSS, jika tidak ada kovariat, buang grup dengan N <= 1.
    if config.main.covar.as_ref().map_or(true, |c| c.is_empty()) {
        groups = groups
            .into_iter()
            .filter(|g| g.len() > 1)
            .collect();
    }

    if groups.is_empty() {
        return Err("No groups with more than 1 observation found for Levene's test".to_string());
    }

    // Hitung berbagai jenis statistik Uji Levene.
    let levene_entries = match calculate_levene_entries(&groups, data, config) {
        Some(entries) => if entries.is_empty() {
            return Err("No valid Levene test entries could be calculated".to_string());
        } else {
            entries
        }
        None => {
            return Err("Failed to calculate Levene test entries".to_string());
        }
    };

    let result = LeveneTest {
        dependent_variable: dep_var_name.clone(),
        entries: levene_entries,
        design: design_string,
    };

    Ok(vec![result])
}

/// Menghitung entri-entri spesifik untuk tabel Uji Levene.
///
/// Fungsi ini menentukan jenis-jenis Uji Levene yang akan dihitung berdasarkan
/// ada atau tidaknya kovariat dalam model.
pub fn calculate_levene_entries(
    groups: &[Vec<f64>],
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Option<Vec<LeveneTestEntry>> {
    let mut entries = Vec::new();
    let has_no_covariates = config.main.covar.as_ref().map_or(true, |c| c.is_empty());

    if has_no_covariates {
        // Jika tidak ada kovariat, hitung empat variasi Uji Levene.
        // Ini memberikan analisis yang lebih komprehensif tentang homogenitas varians.

        // 1. Berdasarkan Rata-rata (Mean): Uji Levene klasik.
        if let Ok((f, df1, df2, sig)) = calculate_levene_anova(groups, LeveneCenter::Mean) {
            entries.push(LeveneTestEntry {
                function: "Based on Mean".to_string(),
                levene_statistic: f,
                df1,
                df2: df2 as f64,
                significance: sig,
            });
        }

        // 2. Berdasarkan Median: Uji Brown-Forsythe. Lebih robust terhadap data yang tidak terdistribusi normal.
        if let Ok((f, df1, df2, sig)) = calculate_levene_anova(groups, LeveneCenter::Median) {
            entries.push(LeveneTestEntry {
                function: "Based on Median".to_string(),
                levene_statistic: f,
                df1,
                df2: df2 as f64,
                significance: sig,
            });
        }

        // 3. Berdasarkan Median dengan penyesuaian df: Variasi lain dari Uji Brown-Forsythe.
        //    Memberikan p-value yang lebih akurat untuk distribusi non-normal.
        if let Ok((f, df1, df2, sig)) = calculate_levene_anova_adjusted_df(groups, data, config) {
            entries.push(LeveneTestEntry {
                function: "Based on Median and with adjusted df".to_string(),
                levene_statistic: f,
                df1,
                df2,
                significance: sig,
            });
        }

        // 4. Berdasarkan Rata-rata Terpangkas (Trimmed Mean): Kompromi antara Mean dan Median.
        //    Robust terhadap outlier tetapi masih sensitif terhadap pusat data.
        if
            let Ok((f, df1, df2, sig)) = calculate_levene_anova(
                groups,
                LeveneCenter::TrimmedMean(0.05)
            )
        {
            entries.push(LeveneTestEntry {
                function: "Based on trimmed mean".to_string(),
                levene_statistic: f,
                df1,
                df2: df2 as f64,
                significance: sig,
            });
        }
    } else {
        // Jika ada kovariat, hanya hitung Uji Levene standar (berdasarkan Mean pada residual).
        if let Ok((f, df1, df2, sig)) = calculate_levene_anova(groups, LeveneCenter::Mean) {
            entries.push(LeveneTestEntry {
                function: "Levene".to_string(),
                levene_statistic: f,
                df1,
                df2: df2 as f64,
                significance: sig,
            });
        }
    }

    if entries.is_empty() {
        None
    } else {
        Some(entries)
    }
}

/// Melakukan perhitungan inti ANOVA untuk Uji Levene.
///
/// Fungsi ini menghitung statistik F, derajat kebebasan (df), dan signifikansi (p-value).
///
/// # Rumus Statistik
/// - **Statistik F**: Dihitung sebagai `(SS_between / df1) / (SS_within / df2)`.
///   Statistik F yang tinggi menunjukkan bahwa variasi antar grup lebih besar daripada variasi di dalam grup,
///   yang mengarah pada penolakan hipotesis nol (varians homogen).
/// - **Signifikansi (p-value)**: Probabilitas mendapatkan hasil seekstrem yang diamati jika hipotesis nol benar.
///   Nilai p < 0.05 (standar umum) menunjukkan bukti signifikan untuk menolak hipotesis nol.
fn calculate_levene_anova(
    groups: &[Vec<f64>],
    center_method: LeveneCenter
) -> Result<(f64, usize, usize, f64), String> {
    // Validasi input: pastikan ada setidaknya 2 grup dan tidak ada grup yang kosong.
    if groups.iter().any(|g| g.is_empty()) || groups.len() < 2 {
        return Ok((f64::NAN, 0, 0, f64::NAN));
    }

    // Hitung titik pusat (center) untuk setiap grup sesuai metode yang dipilih.
    let group_centers: Vec<f64> = groups
        .par_iter()
        .map(|group| {
            match center_method {
                LeveneCenter::Mean => calculate_mean(group),
                LeveneCenter::Median => {
                    let mut sorted_group = group.clone();
                    sorted_group.sort_by(|a, b|
                        a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal)
                    );
                    if sorted_group.is_empty() {
                        0.0
                    } else if sorted_group.len() % 2 == 1 {
                        sorted_group[sorted_group.len() / 2]
                    } else {
                        (sorted_group[sorted_group.len() / 2 - 1] +
                            sorted_group[sorted_group.len() / 2]) /
                            2.0
                    }
                }
                LeveneCenter::TrimmedMean(proportion) => {
                    calculate_interpolated_trimmed_mean(group, proportion)
                }
            }
        })
        .collect();

    // Hitung deviasi absolut dari titik pusat untuk setiap nilai dalam setiap grup.
    // Inilah data yang akan dianalisis menggunakan ANOVA.
    let abs_deviations: Vec<Vec<f64>> = groups
        .par_iter()
        .enumerate()
        .map(|(i, group)| {
            let center = group_centers[i];
            group
                .iter()
                .map(|val| (val - center).abs())
                .collect()
        })
        .collect();

    // Hitung jumlah total sampel (N).
    let total_samples = groups
        .iter()
        .map(|group| group.len())
        .sum::<usize>();

    // Hitung rata-rata keseluruhan dari semua deviasi absolut (Grand Mean).
    let all_deviations: Vec<f64> = abs_deviations.iter().flatten().cloned().collect();
    let overall_mean = calculate_mean(&all_deviations);

    // Hitung Sum of Squares Between groups (SS_between).
    // Mengukur variasi rata-rata deviasi antar grup.
    let ss_between = abs_deviations
        .par_iter()
        .enumerate()
        .map(|(i, group)| {
            let group_mean = calculate_mean(group);
            let group_size = groups[i].len() as f64;
            group_size * (group_mean - overall_mean).powi(2)
        })
        .sum::<f64>();

    // Hitung Sum of Squares Within groups (SS_within).
    // Mengukur variasi deviasi di dalam masing-masing grup.
    let ss_within = abs_deviations
        .par_iter()
        .map(|group| {
            let group_mean = calculate_mean(group);
            group
                .iter()
                .map(|val| (val - group_mean).powi(2))
                .sum::<f64>()
        })
        .sum::<f64>();

    // Hitung Derajat Kebebasan (Degrees of Freedom).
    let df1 = groups.len() - 1; // df antar grup
    let df2 = total_samples - groups.len(); // df dalam grup

    if df2 == 0 {
        return Ok((f64::NAN, df1, df2, f64::NAN));
    }

    // Hitung statistik F.
    let f_statistic = if ss_within < 1e-12 {
        if ss_between < 1e-12 {
            // Jika tidak ada variasi sama sekali, F = 0.
            0.0
        } else {
            // Jika variasi dalam grup nol tetapi antar grup ada, F -> tak hingga.
            f64::INFINITY
        }
    } else {
        let ms_between = ss_between / (df1 as f64);
        let ms_within = ss_within / (df2 as f64);
        if ms_within == 0.0 {
            f64::INFINITY
        } else {
            ms_between / ms_within
        }
    };

    // Hitung signifikansi (p-value) menggunakan distribusi F.
    let significance = calculate_f_significance(df1, df2, f_statistic);

    Ok((f_statistic, df1, df2, significance))
}

/// Menghitung Uji Levene berdasarkan Median dengan penyesuaian derajat kebebasan (df).
///
/// Metode ini, sering disebut sebagai Uji Brown-Forsythe dengan median, lebih robust
/// terhadap pelanggaran asumsi normalitas. Penyesuaian df2 (disebut juga `v`)
/// menggunakan formula yang mirip dengan koreksi Welch-Satterthwaite,
/// menghasilkan p-value yang lebih andal ketika varians grup tidak sama.
pub fn calculate_levene_anova_adjusted_df(
    groups: &[Vec<f64>],
    _original_data: &AnalysisData,
    _original_config: &UnivariateConfig
) -> Result<(f64, usize, f64, f64), String> {
    // Langkah 1: Hitung deviasi absolut dari median untuk setiap grup.
    let abs_deviations_b: Vec<Vec<f64>> = groups
        .par_iter()
        .map(|group| {
            if group.is_empty() {
                return Vec::new();
            }
            let mut sorted_group = group.clone();
            sorted_group.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
            let median = if sorted_group.len() % 2 == 1 {
                sorted_group[sorted_group.len() / 2]
            } else {
                (sorted_group[sorted_group.len() / 2 - 1] + sorted_group[sorted_group.len() / 2]) /
                    2.0
            };
            group
                .iter()
                .map(|val| (val - median).abs())
                .collect()
        })
        .collect();

    // Langkah 2: Hitung F-statistik awal menggunakan deviasi absolut dari median.
    let (f_stat, df1, df2_unadjusted, sig_unadjusted) = calculate_levene_anova(
        groups,
        LeveneCenter::Median
    )?;

    if df1 == 0 || groups.iter().all(|g| g.len() <= 1) {
        return Ok((f_stat, df1, df2_unadjusted as f64, sig_unadjusted));
    }

    // Langkah 3: Hitung df2 yang disesuaikan (v).
    let k = groups.len();
    let mut u_values: Vec<f64> = Vec::with_capacity(k);
    let mut v_i_values: Vec<f64> = Vec::with_capacity(k);

    for i in 0..k {
        let z_values_group_i = &abs_deviations_b[i];
        let m_i = z_values_group_i.len();

        if m_i <= 1 {
            u_values.push(0.0);
            v_i_values.push(0.0);
            continue;
        }

        let z_bar_i_b = calculate_mean(z_values_group_i);
        let u_i = z_values_group_i
            .iter()
            .map(|z| (z - z_bar_i_b).powi(2))
            .sum::<f64>();
        u_values.push(u_i);
        v_i_values.push((m_i - 1) as f64);
    }

    let sum_u_i: f64 = u_values.iter().sum();
    let sum_u_i_sq_over_v_i: f64 = u_values
        .iter()
        .zip(v_i_values.iter())
        .map(|(&ui, &vi)| {
            if vi == 0.0 {
                if ui.abs() < 1e-9 { 0.0 } else { f64::NAN }
            } else {
                ui.powi(2) / vi
            }
        })
        .sum();

    let df2_adjusted = if sum_u_i.abs() < 1e-9 {
        // Jika tidak ada variasi sama sekali, df tidak perlu disesuaikan.
        df2_unadjusted as f64
    } else if sum_u_i_sq_over_v_i.is_nan() || sum_u_i_sq_over_v_i.abs() < 1e-9 {
        // Jika penyebut nol (variasi dalam grup sempurna sama) tapi pembilang tidak, df -> tak hingga.
        f64::INFINITY
    } else {
        sum_u_i.powi(2) / sum_u_i_sq_over_v_i
    };

    // Langkah 4: Hitung signifikansi baru menggunakan F(df1, df2_adjusted).
    let significance_adj = if
        f_stat.is_nan() ||
        df1 == 0 ||
        df2_adjusted.is_nan() ||
        df2_adjusted <= 0.0 ||
        df2_adjusted.is_infinite()
    {
        // Jika df tidak valid atau F NaN, signifikansi juga NaN.
        // Jika F sangat besar (karena df2 adjusted infinite), signifikansi -> 0.
        if f_stat > 0.0 && df2_adjusted.is_infinite() {
            0.0
        } else {
            f64::NAN
        }
    } else {
        match statrs::distribution::FisherSnedecor::new(df1 as f64, df2_adjusted) {
            Ok(dist) => 1.0 - dist.cdf(f_stat),
            Err(_) => f64::NAN,
        }
    };

    Ok((f_stat, df1, df2_adjusted, significance_adj))
}

/// Menghitung rata-rata terpangkas (trimmed mean) dengan interpolasi.
///
/// Metode ini membuang sebagian kecil data dari ujung bawah dan atas distribusi
/// sebelum menghitung rata-rata. Ini membuatnya lebih robust terhadap outlier
/// daripada rata-rata biasa. Interpolasi digunakan untuk menangani kasus
/// di mana jumlah data yang akan dipangkas bukan bilangan bulat.
fn calculate_interpolated_trimmed_mean(group: &[f64], proportion_alpha: f64) -> f64 {
    if group.is_empty() {
        return 0.0;
    }
    let n = group.len();
    let n_float = n as f64;

    // Data harus diurutkan untuk pemangkasan.
    let mut sorted_group = group.to_vec();
    sorted_group.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    // Hitung jumlah data yang akan dipangkas dari setiap ujung.
    let trim_target_count_float = proportion_alpha * n_float;
    let g = trim_target_count_float.floor(); // Bagian bulat
    let g_usize = g as usize;
    let fraction = trim_target_count_float - g; // Bagian pecahan

    // Jika pemangkasan terlalu agresif, kembalikan rata-rata biasa.
    let effective_n_for_denominator = n_float * (1.0 - 2.0 * proportion_alpha);
    if effective_n_for_denominator < 1e-9 {
        return calculate_mean(group);
    }
    // Jika semua atau hampir semua data dipangkas, kembalikan median sebagai aproksimasi.
    if n <= 2 * g_usize {
        return if n % 2 == 1 {
            sorted_group[n / 2]
        } else if n > 0 {
            (sorted_group[n / 2 - 1] + sorted_group[n / 2]) / 2.0
        } else {
            0.0
        };
    }

    // Hitung jumlah tertimbang (weighted sum).
    let mut weighted_sum = 0.0;

    // Jumlahkan elemen-elemen tengah yang sepenuhnya disertakan.
    if g_usize + 1 < n - g_usize {
        for i in g_usize + 1..n - g_usize - 1 {
            weighted_sum += sorted_group[i];
        }
    }

    // Tambahkan nilai batas yang diinterpolasi.
    if fraction == 0.0 {
        // Jika tidak ada fraksi, cukup ambil nilai batas.
        weighted_sum += sorted_group[g_usize];
        weighted_sum += sorted_group[n - 1 - g_usize];
    } else {
        // Jika ada fraksi, gunakan bobot (1 - fraksi) untuk nilai batas.
        weighted_sum += (1.0 - fraction) * sorted_group[g_usize];
        weighted_sum += (1.0 - fraction) * sorted_group[n - 1 - g_usize];
    }

    weighted_sum / effective_n_for_denominator
}
