use std::collections::{ HashMap };
use std::hash::{ Hash, Hasher };
use std::collections::hash_map::DefaultHasher;
use nalgebra::RowDVector;

use crate::univariate::models::{
    config::UnivariateConfig,
    data::{ AnalysisData },
    result::{ LackOfFitTests, LackOfFitTestsEntries },
};

use super::core::*;

/// Menghitung hash dari sebuah baris `RowDVector<f64>` untuk digunakan sebagai kunci dalam `HashMap`.
///
/// Karena `DVector` atau `RowDVector` yang berisi `f64` tidak dapat di-hash secara langsung
/// (karena `f64` tidak mengimplementasikan `Eq`), fungsi ini mengonversi setiap `f64`
/// ke representasi bit `u64`-nya, yang kemudian dapat di-hash. Ini memungkinkan
/// pengelompokan data berdasarkan kombinasi unik dari nilai-nilai prediktor (baris X).
fn hash_dvector_row(row_vector: &RowDVector<f64>) -> u64 {
    let mut hasher = DefaultHasher::new();
    for val_ref in row_vector.iter() {
        val_ref.to_bits().hash(&mut hasher);
    }
    hasher.finish()
}

/// Menghitung uji "Lack of Fit" (kurangnya kesesuaian) untuk model univariat.
///
/// Uji ini menentukan apakah model yang dipilih sudah cukup baik dalam menjelaskan
/// hubungan antara variabel prediktor (X) dan variabel respons (Y). Uji ini
/// membandingkan variasi di sekitar rata-rata model (error total) dengan variasi
/// murni dalam data (pure error) pada titik-titik data yang sama (replikasi).
///
/// # Arguments
/// * `data` - Data analisis yang berisi matriks X dan vektor Y.
/// * `config` - Konfigurasi analisis univariat.
///
/// # Returns
/// `Ok(LackOfFitTests)` jika berhasil, berisi statistik uji.
/// `Err(String)` jika terjadi kesalahan, misalnya data tidak mencukupi atau
/// uji tidak diminta dalam konfigurasi.
pub fn calculate_lack_of_fit_tests(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<LackOfFitTests, String> {
    // Pastikan uji "Lack of Fit" diminta dalam konfigurasi.
    if !config.options.lack_of_fit {
        return Err("Lack of fit tests not requested in configuration".to_string());
    }

    // Langkah 1: Fit model utama untuk mendapatkan Sum of Squares Error (SSE) Total.

    // Buat matriks desain (X), vektor respons (Y), dan bobot dari data mentah.
    let design_info = create_design_response_weights(data, config).map_err(|e|
        format!("LOF: Failed to create design matrix for main model: {}", e)
    )?;

    if design_info.n_samples == 0 {
        return Err("LOF: No data available for main model fitting.".to_string());
    }

    // p_model_params adalah jumlah parameter dalam model (rank dari matriks X).
    let p_model_params = design_info.r_x_rank;

    // Hitung matriks cross-product (Z'WZ) yang diperlukan untuk operasi SWEEP.
    let ztwz_matrix = create_cross_product_matrix(&design_info).map_err(|e|
        format!("LOF: Failed to create cross-product matrix for main model: {}", e)
    )?;

    // Lakukan operasi SWEEP untuk mendapatkan hasil regresi, termasuk Sum of Squares Error (SSE).
    let swept_info = perform_sweep_and_extract_results(
        &ztwz_matrix,
        design_info.p_parameters
    ).map_err(|e| format!("LOF: Failed during SWEEP operation for main model: {}", e))?;

    // SSE Total (atau SS Error Total) adalah jumlah kuadrat sisaan dari model yang difit.
    // Ini mengukur variabilitas total yang tidak dapat dijelaskan oleh model.
    let ss_error_total = swept_info.s_rss;

    // Derajat kebebasan (df) untuk error total adalah N (jumlah sampel) - p (jumlah parameter).
    let df_error_total = (design_info.n_samples as isize) - (p_model_params as isize);
    if df_error_total < 0 {
        return Err(
            format!(
                "LOF: df_error_total is negative ({}), N={}, p_params={}",
                df_error_total,
                design_info.n_samples,
                p_model_params
            )
        );
    }

    // Langkah 2: Hitung Sum of Squares Pure Error (SS_PE).

    let y_values = &design_info.y;
    let x_matrix = &design_info.x;
    let n_total = design_info.n_samples;

    // Kelompokkan nilai Y berdasarkan baris X yang unik (kombinasi prediktor yang unik).
    // Ini diperlukan untuk menemukan titik-titik data replikasi.
    let mut groups_map: HashMap<u64, Vec<f64>> = HashMap::new();
    for i in 0..n_total {
        let x_row = x_matrix.row(i).into_owned();
        let row_hash = hash_dvector_row(&x_row);
        groups_map.entry(row_hash).or_default().push(y_values[i]);
    }

    let c_unique_combinations = groups_map.len();
    let mut ss_pure_error = 0.0;

    // Hitung SS_PE dengan menjumlahkan kuadrat deviasi setiap nilai Y dari rata-rata grupnya,
    // hanya untuk grup yang memiliki lebih dari satu observasi (replikasi).
    // SS_PE mengukur variabilitas yang melekat dalam data (random error).
    for (_row_hash, y_group) in groups_map.iter() {
        if y_group.len() > 1 {
            let group_mean = calculate_mean(y_group);
            for &y_val in y_group {
                ss_pure_error += (y_val - group_mean).powi(2);
            }
        }
    }

    // Derajat kebebasan (df) untuk pure error adalah N (jumlah sampel) - c (jumlah kombinasi unik X).
    let df_pure_error = (n_total as isize) - (c_unique_combinations as isize);
    if df_pure_error < 0 {
        return Err(
            format!(
                "LOF: df_pure_error is negative ({}), N={}, c_unique={}. This indicates an issue.",
                df_pure_error,
                n_total,
                c_unique_combinations
            )
        );
    }

    // Langkah 3: Hitung statistik Lack of Fit.

    // SS Lack of Fit = SS Error Total - SS Pure Error.
    // Ini mengukur variabilitas yang tidak dapat dijelaskan oleh model, setelah memperhitungkan
    // random error. Nilai yang besar menunjukkan model tidak sesuai.
    let ss_lack_of_fit = (ss_error_total - ss_pure_error).max(0.0);

    // df Lack of Fit = df Error Total - df Pure Error = (N - p) - (N - c) = c - p.
    let df_lack_of_fit = (c_unique_combinations as isize) - (p_model_params as isize);

    if df_lack_of_fit < 0 {
        // Ini bisa terjadi jika jumlah parameter (p) lebih besar dari jumlah kombinasi unik (c),
        // misalnya pada model jenuh (saturated model). Uji LOF tidak valid dalam kasus ini.
    }

    // Mean Square Lack of Fit (MS_LOF)
    let ms_lack_of_fit = if df_lack_of_fit > 0 {
        ss_lack_of_fit / (df_lack_of_fit as f64)
    } else {
        0.0
    };

    // Mean Square Pure Error (MS_PE)
    let ms_pure_error = if df_pure_error > 0 {
        ss_pure_error / (df_pure_error as f64)
    } else {
        0.0 // Jika df_pure_error = 0 (tidak ada replikasi), MS_PE tidak terdefinisi atau 0.
    };

    // F-Value untuk Uji Lack of Fit.
    // Rumus: F = MS_LOF / MS_PE.
    // Tujuan: Menguji hipotesis nol bahwa model sudah cukup (tidak ada "lack of fit").
    // Interpretasi: Nilai F yang besar (dan p-value yang kecil) menunjukkan bukti kuat
    // untuk menolak hipotesis nol, yang berarti model tidak sesuai dengan data.
    let f_value_lof = if ms_pure_error > 1e-9 && df_lack_of_fit > 0 {
        (ms_lack_of_fit / ms_pure_error).max(0.0)
    } else if df_lack_of_fit == 0 && ss_lack_of_fit < 1e-9 {
        0.0 // Tidak ada lack of fit.
    } else {
        f64::NAN // Kasus tidak terdefinisi atau bermasalah.
    };

    // p-value (Significance) untuk F-test.
    let significance_lof = if df_lack_of_fit > 0 && df_pure_error > 0 && !f_value_lof.is_nan() {
        calculate_f_significance(df_lack_of_fit as usize, df_pure_error as usize, f_value_lof)
    } else {
        f64::NAN
    };

    // Ukuran efek: Partial Eta-Squared untuk Lack of Fit.
    // Rumus: η²_p = SS_LOF / (SS_LOF + SS_PE) = SS_LOF / SS_Error_Total.
    // Interpretasi: Proporsi varians dalam error total yang disebabkan oleh "lack of fit".
    let partial_eta_squared_lof = if config.options.est_effect_size {
        if ss_error_total.abs() > 1e-9 {
            (ss_lack_of_fit / ss_error_total).max(0.0).min(1.0)
        } else {
            0.0
        }
    } else {
        f64::NAN
    };

    // Parameter non-sentralitas dan kekuatan statistik yang diamati (Observed Power).
    let (noncent_parameter_lof, observed_power_lof) = if config.options.obs_power {
        let noncent_parameter_lof = if df_lack_of_fit > 0 && !f_value_lof.is_nan() {
            (df_lack_of_fit as f64) * f_value_lof
        } else {
            0.0
        };

        let observed_power_lof = if
            df_lack_of_fit > 0 &&
            df_pure_error > 0 &&
            !f_value_lof.is_nan()
        {
            calculate_observed_power_f(
                f_value_lof,
                df_lack_of_fit as f64,
                df_pure_error as f64,
                config.options.sig_level
            )
        } else {
            f64::NAN
        };
        (noncent_parameter_lof, observed_power_lof)
    } else {
        (f64::NAN, f64::NAN)
    };

    Ok(LackOfFitTests {
        lack_of_fit: LackOfFitTestsEntries {
            sum_of_squares: ss_lack_of_fit,
            df: df_lack_of_fit.max(0) as usize,
            mean_square: ms_lack_of_fit,
            f_value: f_value_lof,
            significance: significance_lof,
            partial_eta_squared: partial_eta_squared_lof,
            noncent_parameter: noncent_parameter_lof,
            observed_power: observed_power_lof,
        },
        pure_error: LackOfFitTestsEntries {
            sum_of_squares: ss_pure_error,
            df: df_pure_error.max(0) as usize,
            mean_square: ms_pure_error,
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: f64::NAN,
            noncent_parameter: f64::NAN,
            observed_power: f64::NAN,
        },
        notes: vec![
            format!(
                "Tingkat signifikansi untuk uji-F dan perhitungan power: {}. Catatan: Partial eta-squared untuk Lack of Fit dihitung sebagai SS_LOF / SS_Error_Total.",
                config.options.sig_level
            )
        ],
    })
}
