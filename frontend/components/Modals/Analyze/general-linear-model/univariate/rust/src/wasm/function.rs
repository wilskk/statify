use wasm_bindgen::prelude::*;

use crate::models::{ config::UnivariateConfig, data::AnalysisData, result::UnivariateResult };
use crate::stats::core;
use crate::utils::{
    converter::{ format_result, string_to_js_error },
    error::ErrorCollector,
    log::FunctionLogger,
};

pub fn run_analysis(
    data: &AnalysisData,
    config: &UnivariateConfig,
    error_collector: &mut ErrorCollector,
    logger: &mut FunctionLogger
) -> Result<Option<UnivariateResult>, JsValue> {
    // Langkah 1: Ringkasan pemrosesan dasar (selalu dieksekusi).
    // Fungsi ini memberikan informasi awal tentang data, seperti jumlah kasus yang valid dan hilang.
    logger.add_log("basic_processing_summary");
    let mut processing_summary = None;
    match core::basic_processing_summary(&data, config) {
        Ok(summary) => {
            processing_summary = Some(summary);
        }
        Err(e) => {
            error_collector.add_error("Run Analysis : Basic Processing Summary", &e);
        }
    }

    // Langkah 2: Statistik deskriptif jika diminta.
    // Menghitung statistik dasar seperti rata-rata, standar deviasi, dll.
    // Ini membantu memberikan gambaran umum tentang distribusi data.
    let mut descriptive_statistics = None;
    if config.options.desc_stats {
        logger.add_log("calculate_descriptive_statistics");
        match core::calculate_descriptive_statistics(&data, config) {
            Ok(stats) => {
                descriptive_statistics = Some(stats);
            }
            Err(e) => {
                error_collector.add_error("Run Analysis : Descriptive Statistics", &e);
            }
        }
    }

    // Langkah 3: Uji Levene untuk Homogenitas Varians jika diminta.
    // Uji Levene digunakan untuk memeriksa apakah varians dari variabel dependen
    // sama di semua kelompok. Asumsi homogenitas varians penting untuk ANOVA.
    // Hasil yang signifikan (p < 0.05) menunjukkan varians tidak homogen.
    let mut levene_test = None;
    if config.options.homogen_test {
        logger.add_log("calculate_levene_test");
        match core::calculate_levene_test(&data, config) {
            Ok(test) => {
                levene_test = Some(test);
            }
            Err(e) => {
                error_collector.add_error("Run Analysis : Levene's Test", &e);
            }
        }
    }

    // Langkah 4: Uji Heteroskedastisitas jika diminta.
    // Uji ini (Breusch-Pagan, White, F-test) mendeteksi apakah varians dari error
    // dalam model regresi tidak konstan (heteroskedastisitas).
    // Ini adalah asumsi penting dalam analisis regresi.
    let mut heteroscedasticity_tests = None;
    if
        config.options.mod_brusch_pagan ||
        config.options.brusch_pagan ||
        config.options.white_test ||
        config.options.f_test
    {
        logger.add_log("calculate_heteroscedasticity_tests");
        match core::calculate_heteroscedasticity_tests(&data, config) {
            Ok(tests) => {
                heteroscedasticity_tests = Some(tests);
            }
            Err(e) => {
                error_collector.add_error("Run Analysis : Heteroscedasticity Tests", &e);
            }
        }
    }

    // Langkah 5: Uji Efek Antar-Subjek (ANOVA).
    // ANOVA digunakan untuk menguji perbedaan rata-rata antara dua atau lebih kelompok.
    // Ini adalah analisis inti untuk model univariat.
    let mut tests_of_between_subjects_effects = None;
    logger.add_log("calculate_tests_between_subjects_effects");
    match core::calculate_tests_between_subjects_effects(&data, config) {
        Ok(tests) => {
            tests_of_between_subjects_effects = Some(tests);
        }
        Err(e) => {
            error_collector.add_error("Run Analysis : Tests of Between-Subjects Effects", &e);
        }
    }

    // Langkah 6: Estimasi Parameter jika diminta.
    // Menghitung koefisien untuk setiap prediktor dalam model,
    // yang menunjukkan hubungan antara prediktor dan variabel dependen.
    let mut parameter_estimates = None;
    if config.options.param_est {
        logger.add_log("calculate_parameter_estimates");
        match core::calculate_parameter_estimates(&data, config) {
            Ok(estimates) => {
                parameter_estimates = Some(estimates);
            }
            Err(e) => {
                error_collector.add_error("Run Analysis : Parameter Estimates", &e);
            }
        }
    }

    // Langkah 7: Koefisien Kontras jika diminta.
    // Kontras digunakan untuk menguji hipotesis spesifik tentang perbedaan
    // antara rata-rata kelompok tertentu.
    let mut contrast_coefficients = None;
    if let Some(factor_list) = &config.contrast.factor_list {
        if !factor_list.is_empty() {
            logger.add_log("calculate_contrast_coefficients");
            match core::calculate_contrast_coefficients(&data, config) {
                Ok(coefficients) => {
                    contrast_coefficients = Some(coefficients);
                }
                Err(e) => {
                    error_collector.add_error("Run Analysis : Contrast Coefficients", &e);
                }
            }
        }
    }

    // Langkah 8: Matriks L Hipotesis jika diminta.
    // Menampilkan matriks yang digunakan untuk menguji hipotesis dalam model linier umum,
    // memberikan transparansi pada perhitungan.
    let mut hypothesis_l_matrices = None;
    if config.options.coefficient_matrix {
        logger.add_log("calculate_hypothesis_l_matrices");
        match core::calculate_hypothesis_l_matrices(&data, config) {
            Ok(matrices) => {
                hypothesis_l_matrices = Some(matrices);
            }
            Err(e) => {
                error_collector.add_error("Run Analysis : Hypothesis L-Matrices", &e);
            }
        }
    }

    // Langkah 9: Uji Lack of Fit jika diminta.
    // Menguji apakah model yang dipilih sudah cukup baik dalam menjelaskan data,
    // atau apakah model yang lebih kompleks diperlukan.
    let mut lack_of_fit_tests = None;
    if config.options.lack_of_fit {
        logger.add_log("calculate_lack_of_fit_tests");
        match core::calculate_lack_of_fit_tests(&data, config) {
            Ok(tests) => {
                lack_of_fit_tests = Some(tests);
            }
            Err(e) => {
                error_collector.add_error("Run Analysis : Lack of Fit Tests", &e);
            }
        }
    }

    // Langkah 13: Rata-rata Marginal Estimasi (EMMeans) jika diminta.
    // Menghitung rata-rata kelompok yang disesuaikan dengan efek kovariat lain,
    // memberikan perbandingan yang lebih adil antar kelompok.
    let mut emmeans = None;
    if config.emmeans.target_list.as_ref().map_or(false, |v| !v.is_empty()) {
        logger.add_log("calculate_emmeans");
        match core::calculate_emmeans(&data, config) {
            Ok(means) => {
                emmeans = Some(means);
            }
            Err(e) => {
                error_collector.add_error("Run Analysis : EMMeans", &e);
            }
        }
    }

    // Langkah 14: Menyimpan variabel baru jika diminta.
    // Menyimpan hasil perhitungan seperti residual, nilai prediksi, atau leverage
    // sebagai variabel baru untuk analisis lebih lanjut.
    let mut saved_variables = None;
    if
        config.save.unstandardized_res ||
        config.save.weighted_res ||
        config.save.standardized_res ||
        config.save.studentized_res ||
        config.save.deleted_res ||
        config.save.unstandardized_pre ||
        config.save.weighted_pre ||
        config.save.leverage ||
        config.save.cooks_d
    {
        logger.add_log("save_variables");
        match core::save_variables(&data, config) {
            Ok(vars) => {
                saved_variables = Some(vars);
            }
            Err(e) => {
                error_collector.add_error("Run Analysis : Save Variables", &e);
            }
        }
    }

    // Langkah 15: Menghitung fungsi estimable umum.
    // Memungkinkan pengujian hipotesis linier kustom yang tidak tersedia secara default.
    let mut general_estimable_function = None;
    if config.options.general_fun {
        logger.add_log("calculate_general_estimable_function");
        match core::calculate_general_estimable_function(&data, config) {
            Ok(gef) => {
                general_estimable_function = Some(gef);
            }
            Err(e) => {
                error_collector.add_error("Run Analysis : General Estimable Function", &e);
            }
        }
    }

    // log error collector

    // Mengumpulkan semua hasil dari langkah-langkah di atas ke dalam satu struktur `UnivariateResult`.
    let result = UnivariateResult {
        between_subjects_factors: processing_summary,
        descriptive_statistics,
        levene_test,
        heteroscedasticity_tests,
        tests_of_between_subjects_effects,
        parameter_estimates,
        general_estimable_function,
        hypothesis_l_matrices,
        contrast_coefficients,
        lack_of_fit_tests,
        emmeans,
        saved_variables,
    };

    Ok(Some(result))
}

/// Mengambil hasil analisis mentah dalam format `JsValue`.
pub fn get_results(result: &Option<UnivariateResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => Ok(serde_wasm_bindgen::to_value(result).unwrap()),
        None => Err(string_to_js_error("No analysis results available".to_string())),
    }
}

/// Mengambil hasil analisis yang sudah diformat untuk ditampilkan.
pub fn get_formatted_results(result: &Option<UnivariateResult>) -> Result<JsValue, JsValue> {
    format_result(result)
}

/// Mengambil ringkasan semua kesalahan yang terjadi selama analisis.
pub fn get_all_errors(error_collector: &ErrorCollector) -> JsValue {
    JsValue::from_str(&error_collector.get_error_summary())
}

/// Mengambil daftar semua fungsi yang telah dieksekusi selama analisis.
pub fn get_all_log(logger: &FunctionLogger) -> Result<JsValue, JsValue> {
    Ok(serde_wasm_bindgen::to_value(&logger.get_executed_functions()).unwrap_or(JsValue::NULL))
}

/// Membersihkan kolektor kesalahan untuk analisis berikutnya.
pub fn clear_errors(error_collector: &mut ErrorCollector) -> JsValue {
    error_collector.clear();
    JsValue::from_str("Error collector cleared")
}
