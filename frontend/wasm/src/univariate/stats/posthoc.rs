use std::collections::{ BTreeSet, HashSet };

use crate::univariate::models::{
    config::{ CategoryMethod, UnivariateConfig },
    data::AnalysisData,
    result::{
        ConfidenceInterval,
        PostHoc,
        PostHocComparison,
        PostHocComparisonEntry,
        PostHocHomogoneous,
        PostHocHomogoneousEntry,
        Subset,
    },
};

use super::core::*;

/// Menyimpan statistik untuk setiap level dari sebuah faktor.
#[derive(Debug, Clone)]
struct LevelStats {
    name: String,
    mean: f64,
    n: usize,
    variance: f64,
    original_index: usize, // Untuk mempertahankan urutan asli jika diperlukan
}

// =================================================================================================
// Fungsi-Fungsi Pembantu untuk Pengambilan dan Perhitungan Statistik Dasar
// =================================================================================================

/// Mengambil nilai variabel dependen untuk level faktor tertentu.
fn get_level_values(
    data: &AnalysisData,
    factor_name: &str,
    level_name: &str,
    dep_var_name: &str
) -> Result<Vec<f64>, String> {
    let mut values = Vec::new();
    let mut factor_group_idx: Option<usize> = None;
    let mut dep_var_group_idx: Option<usize> = None;
    let mut factor_data_source: Option<&Vec<Vec<crate::univariate::models::data::DataRecord>>> =
        None;

    // Cari indeks grup untuk faktor di fixed factors
    for (i, def_group) in data.fix_factor_data_defs.iter().enumerate() {
        if def_group.iter().any(|def| def.name == factor_name) {
            factor_group_idx = Some(i);
            factor_data_source = Some(&data.fix_factor_data);
            break;
        }
    }

    // Jika tidak ditemukan di fixed factors, cari di random factors
    if factor_group_idx.is_none() {
        if let Some(random_defs) = &data.random_factor_data_defs {
            for (i, def_group) in random_defs.iter().enumerate() {
                if def_group.iter().any(|def| def.name == factor_name) {
                    factor_group_idx = Some(i);
                    factor_data_source = data.random_factor_data.as_ref();
                    break;
                }
            }
        }
    }

    // Cari indeks grup untuk variabel dependen
    for (i, def_group) in data.dependent_data_defs.iter().enumerate() {
        if def_group.iter().any(|def| def.name == dep_var_name) {
            dep_var_group_idx = Some(i);
            break;
        }
    }

    if factor_group_idx.is_none() {
        return Err(format!("Factor '{}' not found in data definitions.", factor_name));
    }
    if dep_var_group_idx.is_none() {
        return Err(format!("Dependent variable '{}' not found in data definitions.", dep_var_name));
    }
    if factor_data_source.is_none() {
        return Err(format!("Data source for factor '{}' could not be determined.", factor_name));
    }

    let f_group_idx = factor_group_idx.unwrap();
    let d_group_idx = dep_var_group_idx.unwrap();

    if
        let (Some(factor_records_groups), Some(dep_var_records_group)) = (
            factor_data_source,
            data.dependent_data.get(d_group_idx),
        )
    {
        if let Some(factor_records_group_specific) = factor_records_groups.get(f_group_idx) {
            for (idx, factor_record) in factor_records_group_specific.iter().enumerate() {
                if let Some(factor_value) = factor_record.values.get(factor_name) {
                    if data_value_to_string(factor_value) == level_name {
                        if let Some(dep_var_record) = dep_var_records_group.get(idx) {
                            if
                                let Some(dep_val) = extract_numeric_from_record(
                                    dep_var_record,
                                    dep_var_name
                                )
                            {
                                values.push(dep_val);
                            }
                        }
                    }
                }
            }
        } else {
            return Err(format!("Factor data records not found for group index {}.", f_group_idx));
        }
    } else {
        return Err(
            format!("Data records not found for factor data source or dependent variable group {}.", d_group_idx)
        );
    }

    Ok(values)
}

/// Menghitung statistik (rata-rata, varians, N) untuk satu level.
fn calculate_single_level_stats(
    data: &AnalysisData,
    factor_name: &str,
    level_name: &str,
    dep_var_name: &str,
    original_index: usize
) -> Result<LevelStats, String> {
    let values = get_level_values(data, factor_name, level_name, dep_var_name)?;
    if values.is_empty() {
        return Ok(LevelStats {
            name: level_name.to_string(),
            mean: f64::NAN,
            n: 0,
            variance: f64::NAN,
            original_index,
        });
    }

    let mean = calculate_mean(&values);
    let variance = if values.len() > 1 {
        values
            .iter()
            .map(|x| (x - mean).powi(2))
            .sum::<f64>() / ((values.len() - 1) as f64)
    } else {
        0.0 // Varians adalah 0 untuk satu titik data.
    };

    Ok(LevelStats {
        name: level_name.to_string(),
        mean,
        n: values.len(),
        variance,
        original_index,
    })
}

/// Menghitung statistik gabungan untuk uji post-hoc.
///
/// Menghitung varians gabungan (Mean Squared Error/MSE), derajat kebebasan (df), dan statistik terkait lainnya.
/// - **Tujuan**: MSE digunakan sebagai estimasi varians populasi yang sama (asumsi homoskedastisitas) dalam ANOVA dan uji-t.
/// - **Rumus MSE**: Jumlah kuadrat error (SSE) dibagi dengan derajat kebebasan error (dfe). SSE = Σ((n_i - 1) * s_i^2), dfe = N_total - k.
/// - **Interpretasi**: Nilai MSE yang lebih kecil menunjukkan variasi yang lebih kecil di dalam setiap grup.
fn calculate_pooled_stats_for_posthoc(
    level_stats_list: &[LevelStats]
) -> (f64, usize, f64, f64, usize) {
    let mut sum_sq_error = 0.0;
    let mut total_n: usize = 0;
    let mut num_groups_with_data = 0;

    for stats in level_stats_list {
        if stats.n > 0 {
            total_n += stats.n;
            if stats.n > 1 && !stats.variance.is_nan() {
                sum_sq_error += stats.variance * ((stats.n - 1) as f64);
            }
            num_groups_with_data += 1;
        }
    }

    if num_groups_with_data == 0 || total_n <= num_groups_with_data {
        return (f64::NAN, 0, f64::NAN, f64::NAN, total_n);
    }

    let df_error = total_n - num_groups_with_data;
    if df_error == 0 {
        return (f64::NAN, 0, f64::NAN, f64::NAN, total_n);
    }

    let mse = sum_sq_error / (df_error as f64);
    let s_pp = if mse >= 0.0 { mse.sqrt() } else { f64::NAN };

    let sum_reciprocal_n: f64 = level_stats_list
        .iter()
        .filter(|s| s.n > 0)
        .map(|s| 1.0 / (s.n as f64))
        .sum();

    let n_h = if sum_reciprocal_n > 0.0 {
        (num_groups_with_data as f64) / sum_reciprocal_n
    } else {
        f64::NAN
    };

    (mse, df_error, s_pp, n_h, total_n)
}

/// Menghitung derajat kebebasan (degrees of freedom) Welch-Satterthwaite.
///
/// - **Tujuan**: Digunakan dalam uji-t untuk varians yang tidak sama (heteroskedastisitas), memberikan penyesuaian pada derajat kebebasan.
/// - **Konteks**: Uji seperti Games-Howell menggunakan ini karena tidak mengasumsikan varians yang sama antar kelompok.
fn welch_satterthwaite_df(var_i: f64, n_i: f64, var_j: f64, n_j: f64) -> f64 {
    if n_i <= 1.0 || n_j <= 1.0 || var_i.is_nan() || var_j.is_nan() || var_i < 0.0 || var_j < 0.0 {
        return f64::NAN;
    }
    let term_i = var_i / n_i;
    let term_j = var_j / n_j;

    let numerator = (term_i + term_j).powi(2);
    let denominator_i = if n_i > 1.0 { term_i.powi(2) / (n_i - 1.0) } else { 0.0 };
    let denominator_j = if n_j > 1.0 { term_j.powi(2) / (n_j - 1.0) } else { 0.0 };
    let denominator = denominator_i + denominator_j;

    if denominator.abs() < 1e-12 {
        if numerator.abs() < 1e-12 {
            return (n_i + n_j - 2.0).max(1.0);
        }
        return f64::NAN;
    }
    let df = numerator / denominator;
    df.max(1.0)
}

/// Menghitung signifikansi untuk subset homogen menggunakan uji-F (ANOVA).
///
/// - **Tujuan**: Untuk memverifikasi apakah sekelompok rata-rata (subset) secara statistik tidak berbeda satu sama lain.
/// - **Proses**: Melakukan ANOVA mini pada subset data untuk melihat apakah ada perbedaan signifikan di antara anggota subset.
/// - **Interpretasi**: Nilai p (signifikansi) yang tinggi (misalnya > 0.05) mendukung kesimpulan bahwa subset tersebut homogen.
fn calculate_subset_significance(
    subset_indices: &[usize],
    level_stats_list: &[LevelStats],
    mse: f64,
    df_error: usize
) -> Option<f64> {
    if subset_indices.len() <= 1 {
        return None;
    }

    let subset_stats: Vec<_> = subset_indices
        .iter()
        .map(|&i| &level_stats_list[i])
        .collect();

    let mut total_n_subset = 0;
    let mut weighted_sum_means = 0.0;
    for stats in &subset_stats {
        total_n_subset += stats.n;
        weighted_sum_means += stats.mean * (stats.n as f64);
    }

    if total_n_subset == 0 {
        return None;
    }

    let grand_mean_subset = weighted_sum_means / (total_n_subset as f64);

    let mut ss_between = 0.0;
    for stats in &subset_stats {
        ss_between += (stats.n as f64) * (stats.mean - grand_mean_subset).powi(2);
    }

    let df_between = subset_stats.len() - 1;
    if df_between == 0 {
        return None;
    }

    let ms_between = ss_between / (df_between as f64);

    if mse.abs() < 1e-9 {
        return None;
    }

    let f_value = ms_between / mse;

    Some(calculate_f_significance(df_between, df_error, f_value))
}

// =================================================================================================
// Fungsi Inti untuk Perbandingan Berganda
// =================================================================================================

/// Melakukan perhitungan perbandingan berganda untuk berbagai uji post-hoc.
fn calculate_multiple_comparisons(
    factor_name: &str,
    current_level_stats: &[LevelStats],
    mse: f64,
    df_error_pooled: usize,
    config: &UnivariateConfig,
    alpha: f64,
    k_total_levels_with_data: usize,
    f_factor_value: f64,
    df_factor: usize,
    overall_notes: &mut Vec<String>
) -> Vec<PostHocComparisonEntry> {
    let mut factor_comparison_entries: Vec<PostHocComparisonEntry> = Vec::new();
    let num_levels_with_data = current_level_stats.len();
    let k_pairwise_comparisons = if num_levels_with_data >= 2 {
        (num_levels_with_data * (num_levels_with_data - 1)) / 2
    } else {
        0
    };

    // Fungsi pembantu untuk mengubah hasil perbandingan menjadi format entri yang simetris (i vs j dan j vs i).
    let expand_pairwise = |
        method: String,
        temp_results: Vec<(usize, usize, f64, f64, f64, ConfidenceInterval)>
    | -> PostHocComparisonEntry {
        let mut parameters = Vec::new();
        let mut mean_differences = Vec::new();
        let mut std_errors = Vec::new();
        let mut significances = Vec::new();
        let mut confidence_intervals = Vec::new();

        for (i, j, mean_diff, std_err, sig, ci) in temp_results {
            let level_i_stats = &current_level_stats[i];
            let level_j_stats = &current_level_stats[j];

            // i vs j
            parameters.push(format!("{} vs {}", level_i_stats.name, level_j_stats.name));
            mean_differences.push(mean_diff);
            std_errors.push(std_err);
            significances.push(sig);
            confidence_intervals.push(ci.clone());

            // j vs i
            parameters.push(format!("{} vs {}", level_j_stats.name, level_i_stats.name));
            mean_differences.push(-mean_diff);
            std_errors.push(std_err);
            significances.push(sig);
            confidence_intervals.push(ConfidenceInterval {
                lower_bound: -ci.upper_bound,
                upper_bound: -ci.lower_bound,
            });
        }
        PostHocComparisonEntry {
            method,
            parameter: parameters,
            mean_difference: mean_differences,
            standard_error: std_errors,
            significance: significances,
            confidence_interval: confidence_intervals,
        }
    };

    // Hitung semua perbandingan berpasangan dasar (tidak disesuaikan) sebagai basis untuk uji lainnya.
    let mut all_pairwise_results: Vec<
        (usize, usize, f64, f64, f64, ConfidenceInterval)
    > = Vec::new();

    for i in 0..num_levels_with_data {
        for j in i + 1..num_levels_with_data {
            let level_i_stats = &current_level_stats[i];
            let level_j_stats = &current_level_stats[j];
            let mean_diff = level_i_stats.mean - level_j_stats.mean;
            let n_i = level_i_stats.n as f64;
            let n_j = level_j_stats.n as f64;

            let se = (mse * (1.0 / n_i + 1.0 / n_j)).sqrt();
            let t_value = if se > 0.0 {
                mean_diff / se
            } else {
                f64::INFINITY * mean_diff.signum()
            };
            let p_value_unadjusted = calculate_t_significance(t_value.abs(), df_error_pooled);
            let t_crit_lsd = calculate_t_critical(Some(alpha), df_error_pooled);
            let margin = t_crit_lsd * se;

            all_pairwise_results.push((
                i,
                j,
                mean_diff,
                se,
                p_value_unadjusted,
                ConfidenceInterval {
                    lower_bound: mean_diff - margin,
                    upper_bound: mean_diff + margin,
                },
            ));
        }
    }

    if config.posthoc.lsd {
        // Uji LSD (Least Significant Difference)
        // Tujuan: Mirip dengan melakukan beberapa uji-t antar pasangan kelompok.
        // Catatan: Tidak melakukan koreksi untuk perbandingan berganda, sehingga meningkatkan risiko galat Tipe I.
        let lsd_results = all_pairwise_results
            .iter()
            .map(|(i, j, mean_diff, se, sig, ci)| (*i, *j, *mean_diff, *se, *sig, ci.clone()))
            .collect();
        factor_comparison_entries.push(
            expand_pairwise(format!("LSD ({})", factor_name), lsd_results)
        );
    }

    if config.posthoc.bonfe {
        // Koreksi Bonferroni: Mengontrol family-wise error rate (FWER) dengan membagi alpha dengan jumlah perbandingan.
        // Sangat konservatif.
        let bonf_results = all_pairwise_results
            .iter()
            .map(|(i, j, mean_diff, se, sig, _ci)| {
                let p_adj = (*sig * (k_pairwise_comparisons as f64)).min(1.0);
                let t_crit_bonf = calculate_t_critical(
                    Some(alpha / (k_pairwise_comparisons as f64)),
                    df_error_pooled
                );
                let margin = t_crit_bonf * *se;
                let new_ci = ConfidenceInterval {
                    lower_bound: *mean_diff - margin,
                    upper_bound: *mean_diff + margin,
                };
                (*i, *j, *mean_diff, *se, p_adj, new_ci)
            })
            .collect();
        factor_comparison_entries.push(
            expand_pairwise(format!("Bonferroni ({})", factor_name), bonf_results)
        );
    }

    if config.posthoc.sidak {
        // Koreksi Sidak: Alternatif untuk Bonferroni, sedikit lebih kuat (kurang konservatif).
        let sidak_results = all_pairwise_results
            .iter()
            .map(|(i, j, mean_diff, se, sig, _ci)| {
                let p_adj = (1.0 - (1.0 - *sig).powf(k_pairwise_comparisons as f64)).min(1.0);
                let sidak_alpha = 1.0 - (1.0 - alpha).powf(1.0 / (k_pairwise_comparisons as f64));
                let t_crit_sidak = calculate_t_critical(Some(sidak_alpha), df_error_pooled);
                let margin = t_crit_sidak * *se;
                let new_ci = ConfidenceInterval {
                    lower_bound: *mean_diff - margin,
                    upper_bound: *mean_diff + margin,
                };
                (*i, *j, *mean_diff, *se, p_adj, new_ci)
            })
            .collect();
        factor_comparison_entries.push(
            expand_pairwise(format!("Sidak ({})", factor_name), sidak_results)
        );
    }

    if config.posthoc.scheffe {
        // Uji Scheffe: Sangat konservatif, melindungi dari galat Tipe I untuk semua kemungkinan kontras,
        // bukan hanya perbandingan berpasangan. Berguna jika ada perbandingan kompleks yang direncanakan.
        let scheffe_results = all_pairwise_results
            .iter()
            .map(|(i, j, mean_diff, se, _sig, _ci)| {
                let f_val = (*mean_diff / *se).powi(2);
                let p_adj = calculate_f_significance(
                    df_factor,
                    df_error_pooled,
                    f_val / (df_factor as f64)
                );
                let f_crit = calculate_f_critical(alpha, df_factor, df_error_pooled);
                let margin = *se * (f_crit * (df_factor as f64)).sqrt();
                let new_ci = ConfidenceInterval {
                    lower_bound: *mean_diff - margin,
                    upper_bound: *mean_diff + margin,
                };
                (*i, *j, *mean_diff, *se, p_adj, new_ci)
            })
            .collect();
        factor_comparison_entries.push(
            expand_pairwise(format!("Scheffe ({})", factor_name), scheffe_results)
        );
    }

    if config.posthoc.tu {
        // Uji Tukey HSD (Honestly Significant Difference): Populer untuk perbandingan berpasangan
        // saat varians sama dan ukuran sampel seimbang. Menggunakan distribusi studentized range.
        if
            let Some(q_crit) = studentized_range_critical_value(
                alpha,
                k_total_levels_with_data,
                df_error_pooled
            )
        {
            let tukey_results = all_pairwise_results
                .iter()
                .map(|(i, j, mean_diff, _se, _sig, _ci)| {
                    let n_i = current_level_stats[*i].n as f64;
                    let n_j = current_level_stats[*j].n as f64;
                    let se_tukey = ((mse * (1.0 / n_i + 1.0 / n_j)) / 2.0).sqrt();
                    let q_val = if se_tukey > 0.0 { *mean_diff / se_tukey } else { f64::INFINITY };
                    let margin = q_crit * se_tukey;
                    let new_ci = ConfidenceInterval {
                        lower_bound: *mean_diff - margin,
                        upper_bound: *mean_diff + margin,
                    };
                    let sig = if q_val.abs() >= q_crit { 0.0 } else { 1.0 };
                    (*i, *j, *mean_diff, se_tukey, sig, new_ci)
                })
                .collect();
            factor_comparison_entries.push(
                expand_pairwise(format!("Tukey HSD ({})", factor_name), tukey_results)
            );
        } else {
            overall_notes.push(
                format!(
                    "Tukey HSD tidak dihitung untuk faktor '{}' karena nilai kritis untuk alpha={} tidak ditemukan.",
                    factor_name,
                    alpha
                )
            );
        }
    }

    if config.posthoc.dunnett {
        // Uji Dunnett: Membandingkan beberapa kelompok perlakuan dengan satu kelompok kontrol.
        let control_level_index = match config.posthoc.category_method {
            CategoryMethod::First => 0,
            CategoryMethod::Last => num_levels_with_data - 1,
        };

        let k_dunnett = num_levels_with_data;
        let df_dunnett = df_error_pooled;

        let mut dunnett_results_2sided: Vec<
            (usize, usize, f64, f64, f64, ConfidenceInterval)
        > = Vec::new();
        let mut dunnett_results_lt: Vec<
            (usize, usize, f64, f64, f64, ConfidenceInterval)
        > = Vec::new();
        let mut dunnett_results_gt: Vec<
            (usize, usize, f64, f64, f64, ConfidenceInterval)
        > = Vec::new();

        for i in 0..num_levels_with_data {
            if i == control_level_index {
                continue;
            }

            let control_stats = &current_level_stats[control_level_index];
            let test_stats = &current_level_stats[i];
            let mean_diff = test_stats.mean - control_stats.mean;
            let se = (mse * (1.0 / (test_stats.n as f64) + 1.0 / (control_stats.n as f64))).sqrt();

            if config.posthoc.twosided {
                if let Some(t_crit) = dunnett_critical_value(alpha, k_dunnett, df_dunnett, false) {
                    let t_val = if se > 0.0 { mean_diff.abs() / se } else { f64::INFINITY };
                    let margin = t_crit * se;
                    let ci = ConfidenceInterval {
                        lower_bound: mean_diff - margin,
                        upper_bound: mean_diff + margin,
                    };
                    let sig = if t_val >= t_crit { 0.0 } else { 1.0 };
                    dunnett_results_2sided.push((i, control_level_index, mean_diff, se, sig, ci));
                }
            }
            if config.posthoc.lt_control {
                if let Some(t_crit) = dunnett_critical_value(alpha, k_dunnett, df_dunnett, true) {
                    let t_val = if se > 0.0 { mean_diff / se } else { f64::NEG_INFINITY };
                    let margin = t_crit * se;
                    let ci = ConfidenceInterval {
                        lower_bound: f64::NEG_INFINITY,
                        upper_bound: mean_diff + margin,
                    };
                    let sig = if t_val <= -t_crit { 0.0 } else { 1.0 };
                    dunnett_results_lt.push((i, control_level_index, mean_diff, se, sig, ci));
                }
            }
            if config.posthoc.gt_control {
                if let Some(t_crit) = dunnett_critical_value(alpha, k_dunnett, df_dunnett, true) {
                    let t_val = if se > 0.0 { mean_diff / se } else { f64::INFINITY };
                    let margin = t_crit * se;
                    let ci = ConfidenceInterval {
                        lower_bound: mean_diff - margin,
                        upper_bound: f64::INFINITY,
                    };
                    let sig = if t_val >= t_crit { 0.0 } else { 1.0 };
                    dunnett_results_gt.push((i, control_level_index, mean_diff, se, sig, ci));
                }
            }
        }
        if !dunnett_results_2sided.is_empty() {
            factor_comparison_entries.push(
                expand_pairwise(
                    format!("Dunnett's Two-Sided t ({})", factor_name),
                    dunnett_results_2sided
                )
            );
        }
        if !dunnett_results_lt.is_empty() {
            factor_comparison_entries.push(
                expand_pairwise(
                    format!("Dunnett's One-Sided t (< Control) ({})", factor_name),
                    dunnett_results_lt
                )
            );
        }
        if !dunnett_results_gt.is_empty() {
            factor_comparison_entries.push(
                expand_pairwise(
                    format!("Dunnett's One-Sided t (> Control) ({})", factor_name),
                    dunnett_results_gt
                )
            );
        }
    }

    if config.posthoc.games {
        // Uji Games-Howell: Pilihan yang baik ketika asumsi kesamaan varians tidak terpenuhi.
        // Menggunakan derajat kebebasan Welch-Satterthwaite.
        let games_howell_results = all_pairwise_results
            .iter()
            .map(|(i, j, mean_diff, _se, _sig, _ci)| {
                let n_i = current_level_stats[*i].n as f64;
                let var_i = current_level_stats[*i].variance;
                let n_j = current_level_stats[*j].n as f64;
                let var_j = current_level_stats[*j].variance;
                let se_gh = (var_i / n_i + var_j / n_j).sqrt();
                let df_gh = welch_satterthwaite_df(var_i, n_i, var_j, n_j);
                let q_val = *mean_diff / (se_gh / (2.0_f64).sqrt());

                let p_adj = 1.0; // P-value is complex.
                let q_crit = studentized_range_critical_value(
                    alpha,
                    k_total_levels_with_data,
                    df_gh as usize
                ).unwrap_or(f64::NAN);
                let margin = q_crit * (se_gh / (2.0_f64).sqrt());
                let new_ci = ConfidenceInterval {
                    lower_bound: *mean_diff - margin,
                    upper_bound: *mean_diff + margin,
                };
                let sig = if q_val.abs() >= q_crit { 0.0 } else { 1.0 };

                (*i, *j, *mean_diff, se_gh, sig, new_ci)
            })
            .collect();
        factor_comparison_entries.push(
            expand_pairwise(format!("Games-Howell ({})", factor_name), games_howell_results)
        );
    }

    if config.posthoc.gabriel {
        // Uji Gabriel: Direkomendasikan ketika ukuran sampel sedikit tidak seimbang. Kurang konservatif dari Hochberg GT2.
        let mut gabriel_results = Vec::new();
        if
            let Some(m_crit) = studentized_maximum_modulus_critical_value(
                alpha,
                k_total_levels_with_data as f64,
                df_error_pooled
            )
        {
            for i in 0..num_levels_with_data {
                for j in i + 1..num_levels_with_data {
                    let mean_diff = (
                        current_level_stats[i].mean - current_level_stats[j].mean
                    ).abs();
                    let n1 = current_level_stats[i].n as f64;
                    let n2 = current_level_stats[j].n as f64;
                    let se = (mse * (1.0 / n1 + 1.0 / n2)).sqrt();
                    let sig = if mean_diff / (se / (2.0_f64).sqrt()) >= m_crit { 0.0 } else { 1.0 };
                    let margin = (m_crit * se) / (2.0_f64).sqrt();
                    let ci = ConfidenceInterval {
                        lower_bound: mean_diff - margin,
                        upper_bound: mean_diff + margin,
                    };
                    gabriel_results.push((
                        i,
                        j,
                        current_level_stats[i].mean - current_level_stats[j].mean,
                        se,
                        sig,
                        ci,
                    ));
                }
            }
            factor_comparison_entries.push(
                expand_pairwise(format!("Gabriel ({})", factor_name), gabriel_results)
            );
        }
    }

    if config.posthoc.hoc {
        // Uji Hochberg GT2: Mirip dengan Tukey HSD tetapi lebih toleran terhadap ketidakseimbangan ukuran sampel yang besar.
        let mut gt2_results = Vec::new();
        if
            let Some(m_crit) = studentized_maximum_modulus_critical_value(
                alpha,
                k_total_levels_with_data as f64,
                df_error_pooled
            )
        {
            for i in 0..num_levels_with_data {
                for j in i + 1..num_levels_with_data {
                    let mean_diff = (
                        current_level_stats[i].mean - current_level_stats[j].mean
                    ).abs();
                    let n1 = current_level_stats[i].n as f64;
                    let n2 = current_level_stats[j].n as f64;
                    let se = (mse * (1.0 / n1 + 1.0 / n2)).sqrt();
                    let sig = if mean_diff / se >= m_crit { 0.0 } else { 1.0 };
                    let margin = m_crit * se;
                    let ci = ConfidenceInterval {
                        lower_bound: mean_diff - margin,
                        upper_bound: mean_diff + margin,
                    };
                    gt2_results.push((
                        i,
                        j,
                        current_level_stats[i].mean - current_level_stats[j].mean,
                        se,
                        sig,
                        ci,
                    ));
                }
            }
            factor_comparison_entries.push(
                expand_pairwise(format!("Hochberg GT2 ({})", factor_name), gt2_results)
            );
        }
    }

    if config.posthoc.tam {
        // Uji Tamhane T2: Uji konservatif untuk varians yang tidak sama, tidak memerlukan ukuran sampel yang sama.
        // Berdasarkan uji-t dengan koreksi Bonferroni.
        let mut t2_results = Vec::new();
        for i in 0..num_levels_with_data {
            for j in i + 1..num_levels_with_data {
                let s1 = &current_level_stats[i];
                let s2 = &current_level_stats[j];
                let se = (s1.variance / (s1.n as f64) + s2.variance / (s2.n as f64)).sqrt();
                let t_val = (s1.mean - s2.mean) / se;
                let df = welch_satterthwaite_df(s1.variance, s1.n as f64, s2.variance, s2.n as f64);
                let p_unadj = calculate_t_significance(t_val.abs(), df as usize);
                let sig = (p_unadj * (k_pairwise_comparisons as f64)).min(1.0); // Bonferroni correction

                let t_crit = calculate_t_critical(
                    Some(alpha / (k_pairwise_comparisons as f64)),
                    df as usize
                );
                let margin = t_crit * se;
                let ci = ConfidenceInterval {
                    lower_bound: s1.mean - s2.mean - margin,
                    upper_bound: s1.mean - s2.mean + margin,
                };

                t2_results.push((i, j, s1.mean - s2.mean, se, sig, ci));
            }
        }
        factor_comparison_entries.push(
            expand_pairwise(format!("Tamhane T2 ({})", factor_name), t2_results)
        );
    }

    if config.posthoc.dunt {
        // Uji Dunnett T3: Pilihan lain untuk varians yang tidak sama, dianggap andal bahkan dengan ukuran sampel kecil.
        // Berdasarkan modulus maksimum terstudentisasi.
        let mut t3_results = Vec::new();
        if
            let Some(m_crit) = studentized_maximum_modulus_critical_value(
                alpha,
                k_pairwise_comparisons as f64,
                df_error_pooled
            )
        {
            for i in 0..num_levels_with_data {
                for j in i + 1..num_levels_with_data {
                    let s1 = &current_level_stats[i];
                    let s2 = &current_level_stats[j];
                    let se = (s1.variance / (s1.n as f64) + s2.variance / (s2.n as f64)).sqrt();
                    let sig = if (s1.mean - s2.mean).abs() / se >= m_crit { 0.0 } else { 1.0 };
                    let margin = m_crit * se;
                    let ci = ConfidenceInterval {
                        lower_bound: s1.mean - s2.mean - margin,
                        upper_bound: s1.mean - s2.mean + margin,
                    };
                    t3_results.push((i, j, s1.mean - s2.mean, se, sig, ci));
                }
            }
            factor_comparison_entries.push(
                expand_pairwise(format!("Dunnett T3 ({})", factor_name), t3_results)
            );
        }
    }

    if config.posthoc.dunc {
        // Uji Dunnett C: Uji non-parametrik yang tidak mengasumsikan kesamaan varians.
        // Berdasarkan rentang terstudentisasi.
        let mut c_results = Vec::new();
        if
            let Some(q_crit) = studentized_range_critical_value(
                alpha,
                k_total_levels_with_data,
                df_error_pooled
            )
        {
            for i in 0..num_levels_with_data {
                for j in i + 1..num_levels_with_data {
                    let s1 = &current_level_stats[i];
                    let s2 = &current_level_stats[j];
                    let se = (s1.variance / (s1.n as f64) + s2.variance / (s2.n as f64)).sqrt();
                    let q_val = (s1.mean - s2.mean).abs() / (se / (2.0_f64).sqrt());
                    let sig = if q_val >= q_crit { 0.0 } else { 1.0 };
                    let margin = (q_crit * se) / (2.0_f64).sqrt();
                    let ci = ConfidenceInterval {
                        lower_bound: s1.mean - s2.mean - margin,
                        upper_bound: s1.mean - s2.mean + margin,
                    };
                    c_results.push((i, j, s1.mean - s2.mean, se, sig, ci));
                }
            }
            factor_comparison_entries.push(
                expand_pairwise(format!("Dunnett C ({})", factor_name), c_results)
            );
        }
    }

    if config.posthoc.waller {
        // Uji Waller-Duncan: Pendekatan Bayesian yang mempertimbangkan nilai F dari ANOVA.
        // Kurang konservatif jika F signifikan.
        let k_ratio = config.posthoc.error_ratio as f64;
        if
            let Some(t_crit) = waller_duncan_critical_value(
                k_ratio,
                f_factor_value,
                df_error_pooled,
                k_total_levels_with_data
            )
        {
            let waller_results = all_pairwise_results
                .iter()
                .map(|(i, j, mean_diff, _se, _sig, _ci)| {
                    let n_i = current_level_stats[*i].n;
                    let n_j = current_level_stats[*j].n;

                    let se_wd = if n_i == n_j {
                        ((mse * 2.0) / (n_i as f64)).sqrt()
                    } else {
                        let n_h = 2.0 / (1.0 / (n_i as f64) + 1.0 / (n_j as f64));
                        ((mse * 2.0) / n_h).sqrt()
                    };

                    let w_val = if se_wd > 0.0 { mean_diff.abs() / se_wd } else { f64::INFINITY };

                    let margin = t_crit * se_wd;
                    let ci = ConfidenceInterval {
                        lower_bound: *mean_diff - margin,
                        upper_bound: *mean_diff + margin,
                    };
                    let sig = if w_val >= t_crit { 0.0 } else { 1.0 };
                    (*i, *j, *mean_diff, se_wd, sig, ci)
                })
                .collect();
            factor_comparison_entries.push(
                expand_pairwise(
                    format!("Waller-Duncan (K={}) ({})", k_ratio, factor_name),
                    waller_results
                )
            );
        } else {
            overall_notes.push(
                format!(
                    "Uji Waller-Duncan untuk faktor '{}' dengan K-ratio={} tidak dapat dihitung karena fungsi nilai kritis belum diimplementasikan.",
                    factor_name,
                    k_ratio
                )
            );
        }
    }
    if config.posthoc.regwq {
        overall_notes.push(
            format!("REGWQ test for factor '{}' is not yet implemented. It is a step-down procedure requiring Studentized Range critical values for varying alpha levels, which are not available.", factor_name)
        );
    }
    if config.posthoc.regwf {
        overall_notes.push(
            format!("REGWF test for factor '{}' is not yet implemented. It requires a complex step-down procedure based on F-tests with adjusted alpha levels.", factor_name)
        );
    }
    if config.posthoc.dun {
        overall_notes.push(
            format!("Duncan's multiple range test for factor '{}' is not yet implemented. It requires Studentized Range critical values for alpha levels that vary per comparison, which are not available.", factor_name)
        );
    }

    if config.posthoc.snk {
        // Uji SNK (Student-Newman-Keuls): Uji step-down yang lebih kuat dari Tukey HSD tetapi kurang mengontrol FWER.
        // Cenderung memiliki tingkat galat Tipe I yang lebih tinggi.
        let mut snk_results = Vec::new();
        let mut sorted_stats_with_indices: Vec<(usize, &LevelStats)> = current_level_stats
            .iter()
            .enumerate()
            .collect();
        sorted_stats_with_indices.sort_by(|a, b| a.1.mean.partial_cmp(&b.1.mean).unwrap());

        for i in 0..num_levels_with_data {
            for j in i + 1..num_levels_with_data {
                let p = (j - i + 1) as usize; // Number of steps between means
                if let Some(q_crit) = studentized_range_critical_value(alpha, p, df_error_pooled) {
                    let (idx1, stats1) = sorted_stats_with_indices[i];
                    let (idx2, stats2) = sorted_stats_with_indices[j];

                    let mean_diff_abs = (stats1.mean - stats2.mean).abs();
                    let n1 = stats1.n as f64;
                    let n2 = stats2.n as f64;
                    let se = ((mse * (1.0 / n1 + 1.0 / n2)) / 2.0).sqrt();
                    let sig = if se > 0.0 && mean_diff_abs / se >= q_crit { 0.0 } else { 1.0 };
                    let ci = ConfidenceInterval { lower_bound: f64::NAN, upper_bound: f64::NAN }; // SNK doesn't typically provide CIs
                    snk_results.push((idx1, idx2, stats1.mean - stats2.mean, se, sig, ci));
                }
            }
        }
        factor_comparison_entries.push(
            expand_pairwise(format!("SNK ({})", factor_name), snk_results)
        );
    }

    if config.posthoc.tub {
        // Uji Tukey-b: Kompromi antara SNK dan Tukey HSD dalam hal kekuatan dan kontrol galat Tipe I.
        let mut tub_results = Vec::new();
        let mut sorted_stats_with_indices: Vec<(usize, &LevelStats)> = current_level_stats
            .iter()
            .enumerate()
            .collect();
        sorted_stats_with_indices.sort_by(|a, b| a.1.mean.partial_cmp(&b.1.mean).unwrap());

        if
            let Some(q_crit_tukey) = studentized_range_critical_value(
                alpha,
                k_total_levels_with_data,
                df_error_pooled
            )
        {
            for i in 0..num_levels_with_data {
                for j in i + 1..num_levels_with_data {
                    let p = (j - i + 1) as usize; // Number of steps between means
                    if
                        let Some(q_crit_snk) = studentized_range_critical_value(
                            alpha,
                            p,
                            df_error_pooled
                        )
                    {
                        let q_crit_tub = (q_crit_snk + q_crit_tukey) / 2.0;

                        let (idx1, stats1) = sorted_stats_with_indices[i];
                        let (idx2, stats2) = sorted_stats_with_indices[j];

                        let mean_diff_abs = (stats1.mean - stats2.mean).abs();
                        let n1 = stats1.n as f64;
                        let n2 = stats2.n as f64;
                        let se = ((mse * (1.0 / n1 + 1.0 / n2)) / 2.0).sqrt();

                        let sig = if se > 0.0 && mean_diff_abs / se >= q_crit_tub {
                            0.0
                        } else {
                            1.0
                        };
                        let ci = ConfidenceInterval {
                            lower_bound: f64::NAN,
                            upper_bound: f64::NAN,
                        };

                        tub_results.push((idx1, idx2, stats1.mean - stats2.mean, se, sig, ci));
                    }
                }
            }
        }
        factor_comparison_entries.push(
            expand_pairwise(format!("Tukey-b ({})", factor_name), tub_results)
        );
    }

    factor_comparison_entries
}

// =================================================================================================
// Fungsi untuk Membuat Subset Homogen
// =================================================================================================

/// Membuat subset homogen berdasarkan hasil perbandingan berganda.
///
/// - **Tujuan**: Mengelompokkan rata-rata level faktor yang tidak berbeda secara signifikan satu sama lain.
/// - **Proses**:
///   1. Urutkan rata-rata dari yang terkecil hingga terbesar.
///   2. Iterasi melalui rata-rata yang diurutkan, buat subset baru jika perbedaan antara dua rata-rata signifikan secara statistik.
///   3. Gabungkan subset yang tumpang tindih untuk menyederhanakan penyajian.
/// - **Interpretasi**: Level dalam subset yang sama dianggap memiliki rata-rata populasi yang sama.
fn create_homogeneous_subsets(
    display_name: &str,
    factor_name: &str,
    valid_sorted_level_stats: &[LevelStats],
    comparison_entries: &[PostHocComparisonEntry],
    alpha: f64,
    df_error: usize,
    current_level_stats: &[LevelStats],
    mse: f64,
    overall_notes: &mut Vec<String>
) -> Option<PostHocHomogoneousEntry> {
    let num_valid_levels = valid_sorted_level_stats.len();
    if num_valid_levels < 2 {
        return None;
    }

    let search_method_name = format!("{} ({})", display_name, factor_name);
    let comparison = comparison_entries.iter().find(|e| e.method == search_method_name);

    if comparison.is_none() {
        overall_notes.push(
            format!("Catatan: Tidak dapat menemukan hasil perbandingan berganda untuk '{}' untuk membuat subset homogen.", search_method_name)
        );
        return None;
    }
    let comparison = comparison.unwrap();

    let mut subsets: Vec<BTreeSet<usize>> = Vec::new();
    for i in 0..num_valid_levels {
        let mut current_subset: BTreeSet<usize> = BTreeSet::new();
        current_subset.insert(i);
        for j in i + 1..num_valid_levels {
            let level_i_name = &valid_sorted_level_stats[i].name;
            let level_j_name = &valid_sorted_level_stats[j].name;

            let param_fwd = format!("{} vs {}", level_i_name, level_j_name);
            let param_rev = format!("{} vs {}", level_j_name, level_i_name);

            let sig = comparison.parameter
                .iter()
                .position(|p| (p == &param_fwd || p == &param_rev))
                .map(|idx| comparison.significance[idx])
                .unwrap_or(1.0);

            if sig > alpha {
                current_subset.insert(j);
            } else {
                break;
            }
        }
        subsets.push(current_subset);
    }

    // Merge subsets
    let mut merged = true;
    while merged {
        merged = false;
        let mut new_subsets: Vec<BTreeSet<usize>> = Vec::new();
        let mut merged_indices: HashSet<usize> = HashSet::new();

        for i in 0..subsets.len() {
            if merged_indices.contains(&i) {
                continue;
            }
            let mut base_subset = subsets[i].clone();
            for j in i + 1..subsets.len() {
                if merged_indices.contains(&j) {
                    continue;
                }
                if subsets[j].is_subset(&base_subset) {
                    merged_indices.insert(j);
                    merged = true;
                } else if base_subset.is_subset(&subsets[j]) {
                    base_subset = subsets[j].clone();
                    merged_indices.insert(i);
                    merged_indices.insert(j);
                    merged = true;
                }
            }
            new_subsets.push(base_subset);
        }
        if merged {
            subsets = new_subsets;
        }
    }

    let mut final_subsets: Vec<BTreeSet<usize>> = Vec::new();
    let mut assigned_levels: HashSet<usize> = HashSet::new();
    for i in 0..num_valid_levels {
        if assigned_levels.contains(&i) {
            continue;
        }

        let mut best_subset: &BTreeSet<usize> = &BTreeSet::new();
        for subset in &subsets {
            if subset.contains(&i) && subset.len() > best_subset.len() {
                best_subset = subset;
            }
        }
        if !best_subset.is_empty() {
            final_subsets.push(best_subset.clone());
            for &level_idx in best_subset {
                assigned_levels.insert(level_idx);
            }
        }
    }

    let mut subset_columns: Vec<Vec<f64>> =
        vec![
        vec![f64::NAN; num_valid_levels];
        final_subsets.len()
    ];
    for (subset_idx, subset) in final_subsets.iter().enumerate() {
        for &level_idx in subset {
            subset_columns[subset_idx][level_idx] = valid_sorted_level_stats[level_idx].mean;
        }
    }

    let mut subset_sigs = Vec::new();
    for subset in &final_subsets {
        let original_indices: Vec<usize> = subset
            .iter()
            .map(|&sorted_idx| valid_sorted_level_stats[sorted_idx].original_index)
            .collect();
        let sig = calculate_subset_significance(
            &original_indices,
            current_level_stats,
            mse,
            df_error
        );
        subset_sigs.push(sig);
    }

    Some(PostHocHomogoneousEntry {
        method: search_method_name.clone(),
        parameter: valid_sorted_level_stats
            .iter()
            .map(|s| s.name.clone())
            .collect(),
        mean_difference: valid_sorted_level_stats
            .iter()
            .map(|s| s.mean)
            .collect(),
        n: valid_sorted_level_stats
            .iter()
            .map(|s| s.n)
            .collect(),
        subsets: subset_columns
            .into_iter()
            .map(|s| Subset { subset: s })
            .collect(),
        significances: Some(subset_sigs),
    })
}

/// Menghitung subset homogen untuk berbagai metode uji post-hoc.
fn calculate_homogeneous_subsets(
    factor_name: &str,
    current_level_stats: &[LevelStats],
    comparison_entries: &[PostHocComparisonEntry],
    config: &UnivariateConfig,
    alpha: f64,
    mse: f64,
    df_error: usize,
    overall_notes: &mut Vec<String>
) -> Vec<PostHocHomogoneousEntry> {
    let mut homog_entries: Vec<PostHocHomogoneousEntry> = Vec::new();

    let mut sorted_level_stats = current_level_stats.to_vec();
    sorted_level_stats.sort_by(|a, b| a.mean.partial_cmp(&b.mean).unwrap());

    let valid_sorted_level_stats: Vec<LevelStats> = sorted_level_stats
        .into_iter()
        .filter(|s| !s.mean.is_nan())
        .collect();
    if valid_sorted_level_stats.len() < 2 {
        return homog_entries;
    }

    let mut create_subsets_for_method = |display_name: &str| {
        if
            let Some(entry) = create_homogeneous_subsets(
                display_name,
                factor_name,
                &valid_sorted_level_stats,
                comparison_entries,
                alpha,
                df_error,
                current_level_stats,
                mse,
                overall_notes
            )
        {
            homog_entries.push(entry);
        }
    };

    if config.posthoc.tu {
        create_subsets_for_method("Tukey HSD");
    }
    if config.posthoc.gabriel {
        create_subsets_for_method("Gabriel");
    }
    if config.posthoc.hoc {
        create_subsets_for_method("Hochberg GT2");
    }
    if config.posthoc.snk {
        create_subsets_for_method("SNK");
    }
    if config.posthoc.scheffe {
        create_subsets_for_method("Scheffe");
    }
    if config.posthoc.dunc {
        create_subsets_for_method("Dunnett C");
    }
    if config.posthoc.regwq {
        create_subsets_for_method("REGWQ");
    }
    if config.posthoc.regwf {
        create_subsets_for_method("REGWF");
    }
    if config.posthoc.waller {
        create_subsets_for_method("Waller-Duncan");
    }
    if config.posthoc.tub {
        create_subsets_for_method("Tukey-b");
    }
    if config.posthoc.dun {
        create_subsets_for_method("Duncan");
    }

    homog_entries
}

// =================================================================================================
// Fungsi Utama Eksekusi Uji Post-Hoc
// =================================================================================================

/// Fungsi utama untuk menghitung semua uji post-hoc yang diminta dalam konfigurasi.
pub fn calculate_posthoc_tests(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<PostHoc, String> {
    let dep_var_name = config.main.dep_var
        .as_ref()
        .ok_or_else(|| "No dependent variable specified for post-hoc.".to_string())?;

    let factors_for_posthoc = match &config.posthoc.fix_factor_vars {
        Some(factors) if !factors.is_empty() => factors.clone(),
        _ => {
            return Ok(PostHoc {
                factor_names: Vec::new(),
                comparison: Vec::new(),
                homogoneous: Vec::new(),
            });
        }
    };

    let alpha = config.options.sig_level;
    let mut processed_factor_names: Vec<String> = Vec::new();
    let mut collected_comparisons: Vec<PostHocComparison> = Vec::new();
    let mut collected_homog_subsets: Vec<PostHocHomogoneous> = Vec::new();
    let mut overall_notes: Vec<String> = Vec::new();

    for factor_name_ref in &factors_for_posthoc {
        let factor_name = factor_name_ref.to_string();
        let factor_levels_names_initial = get_factor_levels(data, &factor_name)?;
        if factor_levels_names_initial.len() < 2 {
            overall_notes.push(
                format!("Factor '{}' has fewer than 2 levels initially, skipping post-hoc.", factor_name)
            );
            continue;
        }

        let mut current_level_stats: Vec<LevelStats> = Vec::new();
        for (idx, level_name) in factor_levels_names_initial.iter().enumerate() {
            let stats = calculate_single_level_stats(
                data,
                &factor_name,
                level_name,
                dep_var_name,
                idx
            )?;
            if stats.n > 0 {
                current_level_stats.push(stats);
            }
        }

        if current_level_stats.len() < 2 {
            overall_notes.push(
                format!("Factor '{}' has fewer than 2 levels with data, skipping post-hoc.", factor_name)
            );
            continue;
        }

        current_level_stats.sort_by(|a, b| a.original_index.cmp(&b.original_index));

        let (mse, df_error_pooled, _s_pp, _n_h, total_n_for_factor) =
            calculate_pooled_stats_for_posthoc(&current_level_stats);

        if mse.is_nan() || df_error_pooled == 0 {
            overall_notes.push(
                format!("Could not calculate pooled MSE or its df_error is 0 for factor '{}'. This may affect equal variance tests.", factor_name)
            );
        }

        let mut f_factor_value = f64::NAN;
        let mut df_factor = 0;

        // Hitung nilai F untuk faktor, diperlukan untuk beberapa uji seperti Waller-Duncan
        if !mse.is_nan() && mse >= 0.0 && total_n_for_factor > 0 && current_level_stats.len() > 1 {
            let grand_sum: f64 = current_level_stats
                .iter()
                .map(|s| s.mean * (s.n as f64))
                .sum();
            let grand_n = total_n_for_factor as f64;

            if grand_n > 0.0 {
                let grand_mean = grand_sum / grand_n;
                let ss_factor: f64 = current_level_stats
                    .iter()
                    .map(|s| (s.n as f64) * (s.mean - grand_mean).powi(2))
                    .sum();
                df_factor = current_level_stats.len() - 1;
                if df_factor > 0 {
                    let ms_factor = ss_factor / (df_factor as f64);
                    if mse > 1e-9 {
                        f_factor_value = ms_factor / mse;
                    } else if ms_factor > 1e-9 {
                        f_factor_value = f64::INFINITY;
                    } else {
                        f_factor_value = f64::NAN;
                    }
                }
            }
        }

        let num_levels_with_data_for_k = current_level_stats.len();

        let mut current_factor_multiple_comparison_notes: Vec<String> = Vec::new();
        let factor_comparison_results = calculate_multiple_comparisons(
            &factor_name,
            &current_level_stats,
            mse,
            df_error_pooled,
            config,
            alpha,
            num_levels_with_data_for_k,
            f_factor_value,
            df_factor,
            &mut current_factor_multiple_comparison_notes
        );
        overall_notes.extend(current_factor_multiple_comparison_notes.clone());

        let mut current_factor_homog_notes: Vec<String> = Vec::new();
        let factor_homog_results = calculate_homogeneous_subsets(
            &factor_name,
            &current_level_stats,
            &factor_comparison_results,
            config,
            alpha,
            mse,
            df_error_pooled,
            &mut current_factor_homog_notes
        );
        overall_notes.extend(current_factor_homog_notes.clone());

        processed_factor_names.push(factor_name.clone());
        if !factor_comparison_results.is_empty() {
            collected_comparisons.push(PostHocComparison {
                entries: factor_comparison_results,
                notes: Vec::new(),
            });
        }
        if !factor_homog_results.is_empty() {
            collected_homog_subsets.push(PostHocHomogoneous {
                entries: factor_homog_results,
                notes: Vec::new(),
            });
        }
    }

    let mut unique_notes = Vec::new();
    let mut seen_notes = HashSet::new();
    for note in overall_notes {
        if seen_notes.insert(note.clone()) {
            unique_notes.push(note);
        }
    }

    for comp in &mut collected_comparisons {
        comp.notes = unique_notes.clone();
    }
    for homog in &mut collected_homog_subsets {
        homog.notes = unique_notes.clone();
    }

    Ok(PostHoc {
        factor_names: processed_factor_names,
        comparison: collected_comparisons,
        homogoneous: collected_homog_subsets,
    })
}
