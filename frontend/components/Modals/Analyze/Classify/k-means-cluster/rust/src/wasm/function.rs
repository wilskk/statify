use wasm_bindgen::prelude::*;

use crate::models::{ config::KMeansConfig, data::AnalysisData, result::KMeansResult };
use crate::utils::converter::format_result;
use crate::utils::{ log::FunctionLogger, converter::string_to_js_error, error::ErrorCollector };

use crate::stats::core;

pub fn run_analysis(
    data: &AnalysisData,
    config: &KMeansConfig,
    error_collector: &mut ErrorCollector,
    logger: &mut FunctionLogger
) -> Result<Option<KMeansResult>, JsValue> {
    web_sys::console::log_1(&"Memulai analisis K-Means Cluster...".into());
    web_sys::console::log_1(&format!("Konfigurasi: {:?}", config).into());
    web_sys::console::log_1(&format!("Data: {:?}", data).into());

    // --- Langkah 1: Pra-pemrosesan Data ---
    // Tahap ini mempersiapkan data mentah agar siap untuk dianalisis. Proses ini dapat
    // mencakup penanganan data hilang, tergantung pada konfigurasi yang diberikan.
    logger.add_log("preprocess_data");
    let preprocessed_data = match core::preprocess_data(data, config) {
        Ok(processed) => { processed }
        Err(e) => {
            error_collector.add_error("Run Analysis : Preprocess Data", &e);
            return Err(string_to_js_error(e));
        }
    };

    web_sys::console::log_1(&format!("Preprocessed Data: {:?}", preprocessed_data).into());

    // Langkah 2: Inisialisasi Pusat Cluster Awal
    // Jika diaktifkan, langkah ini menentukan posisi awal dari pusat-pusat cluster
    // menggunakan metode yang ditentukan dalam konfigurasi (misalnya, pemilihan acak).
    logger.add_log("initialize_clusters");
    let mut initial_centers = None;
    if config.options.initial_cluster {
        match core::initialize_clusters(&preprocessed_data, config) {
            Ok(centers) => {
                initial_centers = Some(centers);
            }
            Err(e) => {
                error_collector.add_error("Run Analysis : Initialize Clusters", &e);
            }
        };
    }

    // Langkah 3: Menghasilkan Riwayat Iterasi
    // Melacak perubahan posisi pusat cluster dan keanggotaan data di setiap iterasi.
    // Berguna untuk menganalisis konvergensi algoritma.
    logger.add_log("iteration_history");
    let mut iteration_history = None;
    match core::generate_iteration_history(&preprocessed_data, config) {
        Ok(history) => {
            iteration_history = Some(history);
        }
        Err(e) => {
            error_collector.add_error("Run Analysis : Iteration History", &e);
        }
    }

    // Langkah 4: Menentukan Keanggotaan Cluster
    // Menetapkan setiap titik data ke cluster terdekat berdasarkan pusat cluster akhir.
    logger.add_log("cluster_membership");
    let mut cluster_membership = None;
    match core::generate_cluster_membership(&preprocessed_data, config) {
        Ok(membership) => {
            cluster_membership = Some(membership);
        }
        Err(e) => {
            error_collector.add_error("Run Analysis : Cluster Membership", &e);
        }
    }

    // Langkah 5: Menghitung Pusat Cluster Akhir
    // Mengkalkulasi posisi final dari pusat-pusat cluster setelah semua iterasi selesai.
    logger.add_log("final_cluster_centers");
    let mut final_cluster_centers = None;
    match core::generate_final_cluster_centers(&preprocessed_data, config) {
        Ok(centers) => {
            final_cluster_centers = Some(centers);
        }
        Err(e) => {
            error_collector.add_error("Run Analysis : Final Cluster Centers", &e);
        }
    }

    // Langkah 6: Menghitung Jarak Antar Pusat Cluster
    // Mengukur jarak (misalnya Euclidean) antara setiap pasang pusat cluster akhir
    // untuk mengevaluasi seberapa terpisah antar cluster.
    logger.add_log("distances_between_centers");
    let mut distances_between_centers = None;
    match core::calculate_distances_between_centers(&preprocessed_data, config) {
        Ok(distances) => {
            distances_between_centers = Some(distances);
        }
        Err(e) => {
            error_collector.add_error("Run Analysis : Distances Between Centers", &e);
        }
    }

    // Analisis opsional berdasarkan konfigurasi.

    // Opsi: Melakukan Uji ANOVA
    // ANOVA (Analysis of Variance) digunakan untuk menguji apakah ada perbedaan signifikan
    // secara statistik antara rata-rata (mean) dari dua atau lebih kelompok (cluster).
    // Hasilnya membantu memvalidasi apakah pengelompokan yang terbentuk bermakna.
    let mut anova = None;
    if config.options.anova {
        logger.add_log("calculate_anova");
        match core::calculate_anova(&preprocessed_data, &config) {
            Ok(result) => {
                anova = Some(result);
            }
            Err(e) => {
                error_collector.add_error("Run Analysis : Calculate Anova", &e);
            }
        }
    }

    // Opsi: Menghitung Jumlah Kasus per Cluster
    // Memberikan informasi dasar tentang distribusi data, yaitu jumlah titik data (kasus)
    // yang masuk dalam setiap cluster.
    let mut cases_count = None;
    if config.options.cluster_info {
        logger.add_log("generate_case_count");
        match core::generate_case_count(&preprocessed_data, &config) {
            Ok(count) => {
                cases_count = Some(count);
            }
            Err(e) => {
                error_collector.add_error("Run Analysis : Generate Case Count", &e);
            }
        }
    }

    // Opsi: Membuat Plot Cluster
    // Membuat plot untuk visualisasi hasil clustering.
    let mut cluster_plot = None;
    if config.options.cluster_plot {
        logger.add_log("create_cluster_plot");
        match core::create_cluster_plot(&preprocessed_data, &config) {
            Ok(plot) => {
                cluster_plot = Some(plot);
            }
            Err(e) => {
                error_collector.add_error("Run Analysis : Create Cluster Plot", &e);
            }
        }
    }

    // Menggabungkan semua hasil analisis ke dalam satu struktur data.
    let result = KMeansResult {
        initial_centers,
        iteration_history,
        cluster_membership,
        final_cluster_centers,
        distances_between_centers,
        anova,
        cases_count,
        cluster_plot,
    };

    Ok(Some(result))
}

/// Mengambil hasil analisis mentah dalam format `KMeansResult`.
/// Fungsi ini mengembalikan data hasil analisis sebelum diformat, cocok untuk
/// pemrosesan lebih lanjut di sisi JavaScript.
pub fn get_results(result: &Option<KMeansResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => Ok(serde_wasm_bindgen::to_value(result).unwrap()),
        None => Err(string_to_js_error("No analysis results available".to_string())),
    }
}

/// Mengambil hasil analisis yang sudah diformat untuk ditampilkan.
/// Fungsi ini memanggil `format_result` untuk mengubah `KMeansResult` menjadi
/// format yang lebih mudah dibaca atau ditampilkan di UI.
pub fn get_formatted_results(result: &Option<KMeansResult>) -> Result<JsValue, JsValue> {
    format_result(result)
}

/// Mengambil semua log fungsi yang telah dieksekusi.
/// Berguna untuk debugging dan melacak alur eksekusi dari sisi JavaScript.
pub fn get_all_log(logger: &FunctionLogger) -> Result<JsValue, JsValue> {
    Ok(serde_wasm_bindgen::to_value(&logger.get_executed_functions()).unwrap_or(JsValue::NULL))
}

/// Mengambil ringkasan semua error yang terjadi selama analisis.
/// Mengembalikan string yang berisi daftar error yang terkumpul.
pub fn get_all_errors(error_collector: &ErrorCollector) -> JsValue {
    JsValue::from_str(&error_collector.get_error_summary())
}

/// Membersihkan (menghapus) semua error yang tersimpan.
/// Fungsi ini akan mengosongkan `ErrorCollector` sehingga siap digunakan untuk analisis baru.
pub fn clear_errors(error_collector: &mut ErrorCollector) -> JsValue {
    error_collector.clear();
    JsValue::from_str("Error collector cleared")
}
