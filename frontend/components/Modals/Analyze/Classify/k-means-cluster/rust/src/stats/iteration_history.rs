use crate::models::{
    config::KMeansConfig,
    result::{ IterationHistory, IterationStep, ProcessedData },
};

use super::core::*;

/// Menghasilkan riwayat iterasi dari proses K-Means.
///
/// Fungsi ini menjalankan algoritma K-Means dan mencatat perubahan pusat cluster
/// pada setiap langkah iterasi hingga konvergensi tercapai atau batas maksimum
/// iterasi terlampaui.
///
/// # Tracking Iterasi dalam K-Means
///
/// Riwayat iterasi adalah alat penting untuk:
/// 1. **Monitoring Konvergensi**: Melihat seberapa cepat algoritma konvergen
/// 2. **Debugging**: Mengidentifikasi masalah dalam proses clustering
/// 3. **Optimasi Parameter**: Menyesuaikan parameter berdasarkan pola konvergensi
/// 4. **Validasi Hasil**: Memastikan algoritma berjalan dengan benar
/// 5. **Analisis Performa**: Mengevaluasi efisiensi algoritma
///
/// # Metode Tracking
///
/// ## 1. Batch Mode (Standard K-Means)
///
/// Setiap iterasi terdiri dari dua tahap:
/// - **Assignment Step**: Tugaskan setiap titik ke cluster terdekat
/// - **Update Step**: Hitung ulang pusat cluster sebagai mean
///
/// ## 2. Running Means Mode (Online Learning)
///
/// Pusat cluster diperbarui secara inkremental untuk setiap titik data:
/// - Lebih efisien memori untuk dataset besar
/// - Hasil mungkin sedikit berbeda dari batch mode
///
/// # Kriteria Konvergensi
///
/// ## Threshold Calculation:
/// ```
/// threshold = convergence_criterion × min_distance_between_initial_centers
/// ```
///
/// ## Convergence Condition:
/// ```
/// max(||μ_i^(t+1) - μ_i^t||) ≤ threshold
/// ```
/// Dimana:
/// - μ_i^t = pusat cluster i pada iterasi t
/// - ||·|| = norma Euclidean
///
/// # Rumus Matematika
///
/// ## Jarak Euclidean untuk Perubahan Pusat:
/// ```
/// Δμ_i = √(Σ(μ_i,j^(t+1) - μ_i,j^t)²)
/// ```
///
/// ## Running Means Update:
/// ```
/// μ_i^(t+1) = μ_i^t + (1/n_i) × (x - μ_i^t)
/// ```
/// Dimana:
/// - n_i = jumlah titik yang telah ditugaskan ke cluster i
/// - x = titik data baru
///
/// ## Batch Means Update:
/// ```
/// μ_i^(t+1) = (1/|C_i|) × Σ(x ∈ C_i) x
/// ```
/// Dimana:
/// - C_i = himpunan titik dalam cluster i
/// - |C_i| = jumlah titik dalam cluster i
///
/// # Metrik Evaluasi Konvergensi
///
/// ## 1. Maximum Change:
/// ```
/// max_change = max(Δμ_i) untuk semua i
/// ```
///
/// ## 2. Average Change:
/// ```
/// avg_change = (1/k) × Σ(Δμ_i)
/// ```
///
/// ## 3. Convergence Rate:
/// ```
/// rate = log(max_change_t / max_change_0) / t
/// ```
///
/// # Interpretasi Hasil
///
/// ## Pola Konvergensi yang Baik:
/// - **Monotonic Decrease**: Perubahan menurun secara konsisten
/// - **Fast Initial Convergence**: Perubahan besar di awal, kecil di akhir
/// - **Stable Final Steps**: Perubahan minimal di iterasi terakhir
///
/// ## Masalah yang Dapat Diidentifikasi:
/// - **Oscillation**: Perubahan naik-turun tanpa konvergensi
/// - **Slow Convergence**: Perubahan lambat, mungkin perlu lebih banyak iterasi
/// - **No Convergence**: Perubahan tidak menurun, mungkin ada masalah data
///
/// # Sumber:
/// - Lloyd, S. (1982). "Least squares quantization in PCM"
/// - MacQueen, J. (1967). "Some Methods for classification and Analysis of Multivariate Observations"
/// - Bottou, L., & Bengio, Y. (1995). "Convergence properties of the k-means algorithms"
/// - Elkan, C. (2003). "Using the triangle inequality to accelerate k-means"
pub fn generate_iteration_history(
    data: &ProcessedData,
    config: &KMeansConfig
) -> Result<IterationHistory, String> {
    // Inisialisasi parameter dari konfigurasi
    let num_clusters = config.main.cluster as usize; // Jumlah cluster yang diinginkan.
    let max_iterations = config.iterate.maximum_iterations; // Batas maksimum iterasi.
    let convergence_criterion = config.iterate.convergence_criterion; // Kriteria untuk menganggap algoritma telah konvergen.
    let use_running_means = config.iterate.use_running_means; // Opsi untuk menggunakan rata-rata berjalan (running means).

    // Langkah 1: Menentukan posisi awal pusat-pusat cluster berdasarkan data dan konfigurasi.
    //
    // Inisialisasi yang baik dapat mempercepat konvergensi dan mempengaruhi kualitas hasil final.
    // Metode inisialisasi ditentukan dalam konfigurasi (random atau heuristic).
    let initial_centers_result = initialize_clusters(data, config)?;
    let mut current_centers = convert_map_to_matrix(
        &initial_centers_result.centers,
        &data.variables
    );

    // Langkah 2: Menghitung Ambang Batas Konvergensi
    //
    // Ambang batas perubahan pusat cluster dihitung berdasarkan jarak minimum
    // antar pusat cluster awal. Jika perubahan lebih kecil dari ambang ini,
    // iterasi dianggap konvergen.
    //
    // Rumus: threshold = convergence_criterion × min_distance_between_initial_centers
    //
    // Tujuan: Memastikan skala threshold sesuai dengan skala data
    let (min_center_dist, _, _) = min_distance_between_centers(&current_centers);
    let min_change_threshold = convergence_criterion * min_center_dist;

    // Langkah 3: Inisialisasi variabel untuk menyimpan hasil iterasi.
    //
    // Vektor iterations akan menyimpan perubahan pusat cluster pada setiap iterasi.
    // Convergence_note akan berisi catatan tentang kondisi konvergensi.
    let mut iterations = Vec::with_capacity(max_iterations as usize);
    let mut convergence_note = None;

    // Langkah 4: Implementasi algoritma K-Means dengan tracking iterasi
    //
    // Jika menggunakan running means, logika pemrosesan berbeda dari batch mode
    if use_running_means {
        // Implementasi Running Means (Online Learning)
        //
        // Keuntungan: Lebih efisien memori untuk dataset besar
        // Kerugian: Hasil mungkin sedikit berbeda dari batch mode
        //
        // Algoritma: Update pusat cluster secara inkremental untuk setiap titik data
        let mut new_centers = current_centers.clone();
        let mut cluster_counts = vec![0; num_clusters];

        for iteration in 1..=max_iterations {
            let old_centers_for_change_calc = new_centers.clone();

            // Tahap Penugasan dan Pembaruan Inkremental
            //
            // Setiap titik data ditugaskan dan pusat cluster langsung diperbarui.
            // Ini berbeda dari batch mode yang memisahkan tahap assignment dan update.
            for case in &data.data_matrix {
                let closest = find_nearest_cluster(case, &new_centers).0;
                cluster_counts[closest] += 1;
                let count = cluster_counts[closest] as f64;

                // Rumus Rata-rata Berjalan (Running Means):
                // μ_i^(t+1) = μ_i^t + (1/n_i) × (x - μ_i^t)
                //
                // Dimana:
                // - μ_i^t = pusat cluster i pada iterasi t
                // - n_i = jumlah titik yang telah ditugaskan ke cluster i
                // - x = titik data baru
                for (j, &val) in case.iter().enumerate() {
                    new_centers[closest][j] =
                        new_centers[closest][j] + (val - new_centers[closest][j]) / count;
                }
            }

            // Langkah 4a: Menghitung perubahan dari awal iterasi ini
            //
            // Perubahan dihitung menggunakan jarak Euclidean antara pusat cluster
            // sebelum dan sesudah update dalam iterasi ini.
            let mut changes = Vec::with_capacity(num_clusters);
            let mut max_change: f64 = 0.0;
            for i in 0..num_clusters {
                let cluster_change = euclidean_distance(
                    &new_centers[i],
                    &old_centers_for_change_calc[i]
                );
                changes.push((format!("{}", i + 1), cluster_change));
                max_change = max_change.max(cluster_change);
            }

            // Langkah 4b: Catat hasil iterasi dan cek konvergensi
            iterations.push(IterationStep { iteration, changes });

            // Cek kriteria konvergensi: max_change ≤ threshold
            if max_change <= min_change_threshold {
                convergence_note = Some(
                    format!(
                        "Convergence achieved due to no or small change in cluster centers. The maximum absolute coordinate change for any center is {:.15e}. The current iteration is {}. The minimum distance between initial centers is {:.3}.",
                        max_change,
                        iteration,
                        min_center_dist
                    )
                );
                break;
            }

            // Cek apakah maksimum iterasi tercapai
            if iteration == max_iterations {
                convergence_note = Some(
                    format!("Maximum number of iterations ({}) reached without convergence.", max_iterations)
                );
            }
        }
    } else {
        // Implementasi Batch Mode (Standard K-Means)
        //
        // Algoritma standar K-Means dengan dua tahap terpisah:
        // 1. Assignment Step: Tugaskan setiap titik ke cluster terdekat
        // 2. Update Step: Hitung ulang pusat cluster sebagai mean
        for iteration in 1..=max_iterations {
            let mut new_centers = vec![vec![0.0; data.variables.len()]; num_clusters];
            let mut cluster_counts = vec![0; num_clusters];

            // Tahap Penugasan (Assignment Step)
            //
            // Setiap titik data ditugaskan ke cluster terdekat berdasarkan jarak Euclidean.
            // Akumulasi nilai untuk perhitungan mean di tahap berikutnya.
            for case in &data.data_matrix {
                let closest = find_nearest_cluster(case, &current_centers).0;
                cluster_counts[closest] += 1;
                for (j, &val) in case.iter().enumerate() {
                    new_centers[closest][j] += val;
                }
            }

            // Tahap Pembaruan (Update Step)
            //
            // Hitung pusat cluster baru sebagai mean dari semua titik dalam cluster.
            // Rumus: μ_i^(t+1) = (1/|C_i|) × Σ(x ∈ C_i) x
            for i in 0..num_clusters {
                if cluster_counts[i] > 0 {
                    for j in 0..data.variables.len() {
                        new_centers[i][j] /= cluster_counts[i] as f64;
                    }
                }
            }

            // Menangani kluster kosong
            //
            // Jika suatu cluster tidak memiliki anggota, pertahankan posisi pusat cluster sebelumnya.
            // Ini mencegah pusat cluster "hilang" atau bergerak ke posisi yang tidak masuk akal.
            for i in 0..num_clusters {
                if cluster_counts[i] == 0 {
                    new_centers[i] = current_centers[i].clone();
                }
            }

            // Langkah 4a: Menghitung Perubahan Pusat Cluster
            //
            // Perubahan dihitung menggunakan jarak Euclidean antara pusat cluster
            // sebelum dan sesudah update.
            // Rumus: Δμ_i = √(Σ(μ_i,j^(t+1) - μ_i,j^t)²)
            let mut changes = Vec::with_capacity(num_clusters);
            let mut max_change: f64 = 0.0;

            for i in 0..num_clusters {
                let cluster_change = euclidean_distance(&new_centers[i], &current_centers[i]);
                changes.push((format!("{}", i + 1), cluster_change));
                max_change = max_change.max(cluster_change);
            }

            // Langkah 4b: Catat hasil iterasi dan cek konvergensi
            iterations.push(IterationStep { iteration, changes });

            // Cek kriteria konvergensi: max_change ≤ threshold
            if max_change <= min_change_threshold {
                convergence_note = Some(
                    format!(
                        "Convergence achieved due to no or small change in cluster centers. The maximum absolute coordinate change for any center is {:.15e}. The current iteration is {}. The minimum distance between initial centers is {:.3}.",
                        max_change,
                        iteration,
                        min_center_dist
                    )
                );
                break;
            }

            // Update pusat cluster untuk iterasi berikutnya
            current_centers = new_centers;

            // Cek apakah maksimum iterasi tercapai
            if iteration == max_iterations {
                convergence_note = Some(
                    format!("Maximum number of iterations ({}) reached without convergence.", max_iterations)
                );
            }
        }
    }

    // Langkah 5: Pastikan ada catatan konvergensi yang sesuai
    //
    // Handle kasus edge dimana tidak ada iterasi yang dilakukan atau
    // tidak ada catatan konvergensi yang dibuat.
    if iterations.is_empty() {
        convergence_note = Some(String::from("No iterations performed"));
    } else if convergence_note.is_none() {
        convergence_note = Some(
            format!("Maximum number of iterations ({}) reached without convergence.", max_iterations)
        );
    }

    // Langkah 6: Mengembalikan riwayat iterasi yang lengkap.
    //
    // Struktur IterationHistory berisi:
    // - iterations: Vektor perubahan pusat cluster pada setiap iterasi
    // - note: Catatan tentang kondisi konvergensi
    // - interpretation: Penjelasan tentang arti dari data yang ditampilkan
    Ok(IterationHistory {
        iterations,
        note: convergence_note,
        interpretation: Some(
            "This table tracks the movement of cluster centers across iterations. Each row represents an iteration, showing how much each cluster center shifted. The process stops when the changes fall below a convergence threshold or the maximum number of iterations is reached, as detailed in the convergence note.".to_string()
        ),
    })
}
