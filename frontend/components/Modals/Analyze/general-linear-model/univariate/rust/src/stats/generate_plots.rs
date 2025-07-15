use std::collections::HashMap;

use crate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ ConfidenceInterval, PlotData, PlotPoint, PlotSeries },
};

use super::core::*;

/// Menghasilkan data plot berdasarkan data analisis dan konfigurasi.
///
/// Fungsi ini memproses permintaan plot untuk variabel dependen berdasarkan
/// satu atau dua variabel faktor (independen).
pub fn generate_plots(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HashMap<String, PlotData>, String> {
    // Validasi awal: Pastikan ada sumber plot yang didefinisikan dalam konfigurasi.
    if config.plots.src_list.is_empty() {
        return Err("No source list specified for plots".to_string());
    }

    // Ambil nama variabel dependen dari konfigurasi.
    let dep_var_name = match &config.main.dep_var {
        Some(name) => name.clone(),
        None => {
            return Err("No dependent variable specified in configuration".to_string());
        }
    };

    let mut result = HashMap::new();

    // Proses setiap sumber plot yang didefinisikan (misalnya, "faktor_A" atau "faktor_A*faktor_B").
    for src in &config.plots.src_list {
        // Pisahkan nama sumber berdasarkan karakter '*' untuk mendeteksi plot interaksi.
        let factors: Vec<&str> = src
            .split('*')
            .map(|s| s.trim())
            .collect();

        // ========================================================================
        // KASUS 1: PLOT SATU ARAH (ONE-WAY PLOT)
        // ========================================================================
        if factors.len() == 1 {
            let factor = factors[0];
            let factor_levels = get_factor_levels(data, factor)?;

            let mut points = Vec::new();
            let mut error_bars = Vec::new();

            // Iterasi melalui setiap level dari faktor.
            for level in &factor_levels {
                // Ekstrak nilai-nilai numerik dari variabel dependen untuk level faktor saat ini.
                let mut values = Vec::new();
                for records in &data.dependent_data {
                    for record in records {
                        let record_level = record.values.get(factor).map(data_value_to_string);

                        if record_level.as_deref() == Some(level) {
                            if let Some(value) = extract_numeric_from_record(record, &dep_var_name) {
                                values.push(value);
                            }
                        }
                    }
                }

                if values.is_empty() {
                    continue; // Lanjutkan ke level berikutnya jika tidak ada data.
                }

                // --- Perhitungan Statistik ---

                // Hitung Rata-rata (Mean).
                // Tujuan: Menemukan nilai pusat dari data.
                let mean = calculate_mean(&values);

                // Hitung Deviasi Standar.
                // Tujuan: Mengukur seberapa tersebar data dari rata-ratanya.
                let std_deviation = calculate_std_deviation(&values, Some(mean));

                // Hitung Standard Error of the Mean (SEM).
                // Rumus: SEM = deviasi standar / sqrt(jumlah sampel)
                // Tujuan: Mengestimasi seberapa akurat rata-rata sampel mewakili rata-rata populasi.
                let std_error = std_deviation / (values.len() as f64).sqrt();

                // Buat titik plot untuk level ini.
                points.push(PlotPoint {
                    x: factor_levels
                        .iter()
                        .position(|l| l == level)
                        .unwrap() as f64,
                    y: mean,
                    label: level.clone(),
                });

                // Tambahkan error bar jika diminta dalam konfigurasi.
                if config.plots.include_error_bars {
                    if config.plots.confidence_interval {
                        // Opsi 1: Error bar berdasarkan Confidence Interval (CI).
                        // CI memberikan rentang di mana rata-rata populasi sebenarnya mungkin berada.
                        let df = values.len() - 1; // Derajat kebebasan (Degrees of Freedom).
                        let t_critical = calculate_t_critical(
                            Some(config.options.sig_level / 2.0), // Alpha dibagi 2 untuk two-tailed test.
                            df
                        );
                        // Lebar CI dihitung sebagai: t * SEM
                        let ci_width = std_error * t_critical;

                        error_bars.push(ConfidenceInterval {
                            lower_bound: mean - ci_width,
                            upper_bound: mean + ci_width,
                        });
                    } else if config.plots.standard_error {
                        // Opsi 2: Error bar berdasarkan Standard Error (SE).
                        // Biasanya digambarkan sebagai mean ± (multiplier * SE).
                        let multiplier = config.plots.multiplier as f64;
                        error_bars.push(ConfidenceInterval {
                            lower_bound: mean - multiplier * std_error,
                            upper_bound: mean + multiplier * std_error,
                        });
                    }
                }
            }

            // --- Menyusun Data Plot ---

            let mut plot_data = PlotData {
                title: format!("Mean of {} for Levels of {}", dep_var_name, factor),
                x_label: factor.to_string(),
                y_label: dep_var_name.clone(),
                series: vec![PlotSeries {
                    name: dep_var_name.clone(),
                    points,
                    error_bars: if config.plots.include_error_bars {
                        Some(error_bars)
                    } else {
                        None
                    },
                    series_type: if config.plots.line_chart_type {
                        "line".to_string()
                    } else {
                        "bar".to_string()
                    },
                }],
                y_axis_starts_at_zero: config.plots.y_axis_start_0,
                includes_reference_line: config.plots.include_ref_line_for_grand_mean,
                reference_line: None,
                note: Some(
                    "This plot displays the mean of the dependent variable for each level of the factor.".to_string()
                ),
                interpretation: Some(
                    "Each point on the plot represents the calculated mean for a specific factor level. Error bars, if included, show the confidence interval or standard error, indicating the precision of the mean estimate. A reference line, if present, shows the grand mean across all levels for comparison.".to_string()
                ),
            };

            // Tambahkan garis referensi untuk grand mean (rata-rata keseluruhan) jika diminta.
            // Ini berguna untuk membandingkan rata-rata setiap level dengan rata-rata total.
            if config.plots.include_ref_line_for_grand_mean {
                let all_values: Vec<f64> = data.dependent_data
                    .iter()
                    .flatten()
                    .filter_map(|record| extract_numeric_from_record(record, &dep_var_name))
                    .collect();

                if !all_values.is_empty() {
                    plot_data.reference_line = Some(calculate_mean(&all_values));
                }
            }

            result.insert(src.clone(), plot_data);

            // ========================================================================
            // KASUS 2: PLOT DUA ARAH (INTERACTION PLOT)
            // ========================================================================
        } else if factors.len() == 2 {
            let factor1 = factors[0]; // Faktor pada sumbu X.
            let factor2 = factors[1]; // Faktor yang menentukan seri/garis yang berbeda.

            let factor1_levels = get_factor_levels(data, factor1)?;
            let factor2_levels = get_factor_levels(data, factor2)?;

            let mut series_vec = Vec::new();

            // Buat satu seri (misalnya, satu garis dalam line chart) untuk setiap level dari `factor2`.
            for f2_level in &factor2_levels {
                let mut points = Vec::new();
                let mut error_bars = Vec::new();

                // Untuk setiap seri, iterasi melalui setiap level dari `factor1` untuk membuat titik pada sumbu X.
                for (x_idx, f1_level) in factor1_levels.iter().enumerate() {
                    // Ekstrak nilai-nilai yang cocok dengan kombinasi level `f1_level` dan `f2_level`.
                    let values: Vec<f64> = data.dependent_data
                        .iter()
                        .flatten()
                        .filter(|record| {
                            let f1_match =
                                record.values.get(factor1).map(data_value_to_string).as_deref() ==
                                Some(f1_level);
                            let f2_match =
                                record.values.get(factor2).map(data_value_to_string).as_deref() ==
                                Some(f2_level);
                            f1_match && f2_match
                        })
                        .filter_map(|record| extract_numeric_from_record(record, &dep_var_name))
                        .collect();

                    if values.is_empty() {
                        continue;
                    }

                    // --- Perhitungan Statistik (sama seperti plot satu arah) ---

                    let mean = calculate_mean(&values);
                    let std_deviation = calculate_std_deviation(&values, Some(mean));
                    let std_error = std_deviation / (values.len() as f64).sqrt();

                    // Buat titik plot.
                    points.push(PlotPoint {
                        x: x_idx as f64,
                        y: mean,
                        label: f1_level.clone(), // Label pada sumbu X adalah level dari faktor 1.
                    });

                    // Tambahkan error bar jika diminta.
                    if config.plots.include_error_bars {
                        if config.plots.confidence_interval {
                            let df = values.len() - 1;
                            let t_critical = calculate_t_critical(
                                Some(config.options.sig_level / 2.0),
                                df
                            );
                            let ci_width = std_error * t_critical;
                            error_bars.push(ConfidenceInterval {
                                lower_bound: mean - ci_width,
                                upper_bound: mean + ci_width,
                            });
                        } else if config.plots.standard_error {
                            let multiplier = config.plots.multiplier as f64;
                            error_bars.push(ConfidenceInterval {
                                lower_bound: mean - multiplier * std_error,
                                upper_bound: mean + multiplier * std_error,
                            });
                        }
                    }
                }

                // Tambahkan seri yang sudah selesai (untuk satu level dari `factor2`) ke vektor seri.
                series_vec.push(PlotSeries {
                    name: format!("{} = {}", factor2, f2_level), // Nama seri menunjukkan level `factor2`.
                    points,
                    error_bars: if config.plots.include_error_bars {
                        Some(error_bars)
                    } else {
                        None
                    },
                    series_type: if config.plots.line_chart_type {
                        "line".to_string()
                    } else {
                        "bar".to_string()
                    },
                });
            }

            // --- Menyusun Data Plot ---

            let plot_data = PlotData {
                title: format!("Mean of {} for {} * {}", dep_var_name, factor1, factor2),
                x_label: factor1.to_string(),
                y_label: dep_var_name.clone(),
                series: series_vec,
                y_axis_starts_at_zero: config.plots.y_axis_start_0,
                includes_reference_line: false, // Garis referensi grand mean tidak umum untuk plot interaksi.
                reference_line: None,
                note: Some(
                    format!(
                        "This plot displays the interaction between {} and {}. Each line represents a level of {}, showing how the mean of {} changes across the levels of {}.",
                        factor1,
                        factor2,
                        factor2,
                        dep_var_name,
                        factor1
                    )
                ),
                interpretation: Some(
                    "This interaction plot helps visualize how the effect of one factor on the dependent variable depends on the level of another factor. Parallel lines suggest no interaction, while lines that are not parallel suggest a possible interaction effect.".to_string()
                ),
            };

            result.insert(src.clone(), plot_data);
        }
    }

    Ok(result)
}
