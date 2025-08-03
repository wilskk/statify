use std::collections::HashMap;

use crate::models::{ config::KMeansConfig, result::{ InitialClusterCenters, ProcessedData } };

use super::core::*;

/// Menginisialisasi pusat cluster awal untuk algoritma K-Means.
///
/// Fungsi ini memilih titik-titik data awal yang akan berfungsi sebagai pusat (centroid)
/// untuk setiap cluster. Terdapat dua strategi inisialisasi:
/// 1. Menggunakan 'k' titik data pertama sebagai pusat awal secara langsung.
/// 2. Menggunakan metode heuristik yang terinspirasi dari K-Means++ untuk mendapatkan
///    pusat-pusat yang lebih tersebar dan representatif.
///
/// # Pentingnya Inisialisasi Cluster
///
/// Kualitas inisialisasi pusat cluster sangat mempengaruhi:
/// 1. **Kecepatan Konvergensi**: Inisialisasi yang baik mempercepat konvergensi
/// 2. **Kualitas Hasil Final**: Menghindari local minima yang buruk
/// 3. **Stabilitas**: Hasil yang konsisten antar run
/// 4. **Efisiensi Komputasi**: Mengurangi jumlah iterasi yang diperlukan
///
/// # Metode Inisialisasi
///
/// ## 1. Random Selection (NOINITIAL)
/// ```
/// μ_k = x_i, dimana i ∈ {1, 2, ..., k}
/// ```
/// - **Keuntungan**: Sederhana dan cepat
/// - **Kerugian**: Tidak menjamin sebaran yang baik, dapat menghasilkan cluster kosong
///
/// ## 2. Heuristic Selection (Default)
///
/// Metode ini terinspirasi dari K-Means++ dengan modifikasi untuk efisiensi:
///
/// ### Algoritma:
/// 1. **Inisialisasi**: Pilih k titik pertama sebagai pusat awal
/// 2. **Iterasi**: Untuk setiap titik data x_k (k > num_clusters):
///    - Hitung jarak ke pusat terdekat: d_min = min(d(x_k, μ_i))
///    - Hitung jarak minimum antar pusat: d_centers = min(d(μ_i, μ_j))
///    - Jika d_min > d_centers: Ganti pusat terdekat dengan x_k
///    - Jika tidak: Evaluasi berdasarkan jarak ke pusat kedua terdekat
///
/// ### Kriteria Penggantian:
/// ```
/// Replace μ_closest dengan x_k jika:
/// d(x_k, μ_second_closest) > min(d(μ_closest, μ_other))
/// ```
pub fn initialize_clusters(
    data: &ProcessedData,
    config: &KMeansConfig
) -> Result<InitialClusterCenters, String> {
    let num_clusters = config.main.cluster as usize;

    // Validasi input: Memastikan jumlah titik data cukup untuk jumlah cluster yang diminta.
    //
    // Keterbatasan: Setiap cluster memerlukan minimal 1 titik data sebagai pusat awal.
    // Jika jumlah data < jumlah cluster, algoritma tidak dapat berjalan.
    if data.data_matrix.len() < num_clusters {
        return Err(
            format!(
                "Not enough data points ({}) for requested clusters ({})",
                data.data_matrix.len(),
                num_clusters
            )
        );
    }

    let mut initial_centers: Vec<Vec<f64>>;

    // --- Inisialisasi Pusat Cluster ---
    if !config.options.initial_cluster {
        // Strategi 1: Random Selection (NOINITIAL)
        //
        // Menggunakan 'k' titik data pertama sebagai pusat awal secara langsung.
        // Pendekatan ini sederhana dan cepat, cocok jika urutan data tidak memiliki bias.
        initial_centers = data.data_matrix.iter().take(num_clusters).cloned().collect();
    } else {
        // Strategi 2: Heuristic Selection (Default)
        //
        // Metode heuristik yang terinspirasi dari K-Means++ dengan modifikasi untuk efisiensi.
        // Dimulai dengan 'k' titik pertama, kemudian diperbaiki secara iteratif.
        //
        // Tujuan: Memaksimalkan jarak minimum antar pusat cluster untuk menghindari
        // cluster yang tumpang tindih dan mempercepat konvergensi.
        initial_centers = data.data_matrix.iter().take(num_clusters).cloned().collect();

        // Iterasi melalui sisa titik data untuk memperbaiki pusat awal.
        //
        // Kompleksitas: O((n-k) × k × d) dimana:
        // - n = jumlah titik data
        // - k = jumlah cluster
        // - d = dimensi data
        for k in num_clusters..data.data_matrix.len() {
            let x_k = &data.data_matrix[k];

            // Langkah 1: Menghitung jarak Euclidean dari titik x_k ke semua pusat cluster
            //
            // Metrik umum untuk mengukur jarak garis lurus antara dua titik dalam ruang multidimensi.
            // Rumus: d(x, μ) = √(Σ(x_i - μ_i)²)
            let (closest, min_dist) = find_nearest_cluster(x_k, &initial_centers);
            let second_closest = find_second_closest_cluster(x_k, &initial_centers, closest);

            // Langkah 2: Cari jarak minimum antara dua pusat cluster yang sudah ada
            //
            // Tujuan: Mengetahui seberapa dekat pusat cluster yang sudah ada.
            // Jika pusat cluster terlalu dekat, ada peluang untuk memperbaiki sebaran.
            let (min_center_dist, m, n) = min_distance_between_centers(&initial_centers);

            // Langkah 3: Logika untuk mengganti pusat yang ada dengan titik baru (x_k)
            //
            // Tujuannya adalah untuk memaksimalkan jarak antar pusat cluster,
            // sehingga menghasilkan pusat awal yang lebih tersebar dan representatif.
            if min_dist > min_center_dist {
                // Kondisi 1: Jika jarak titik x_k ke pusat terdekatnya lebih besar dari jarak
                // minimum antar pusat, ganti salah satu dari dua pusat terdekat
                // satu sama lain (m atau n) dengan x_k.
                //
                // Logika: Pilih pusat yang lebih jauh dari x_k untuk diganti,
                // sehingga x_k menjadi pusat baru yang lebih terpisah.
                if
                    euclidean_distance(x_k, &initial_centers[m]) >
                    euclidean_distance(x_k, &initial_centers[n])
                {
                    initial_centers[m] = x_k.clone(); // Ganti pusat m dengan x_k
                } else {
                    initial_centers[n] = x_k.clone(); // Ganti pusat n dengan x_k
                }
            } else {
                // Kondisi 2: Jika tidak memenuhi kondisi pertama, pertimbangkan untuk mengganti
                // pusat terdekat dengan x_k jika x_k cukup jauh dari pusat-pusat lainnya.
                //
                // Kriteria: d(x_k, μ_second_closest) > min(d(μ_closest, μ_other))
                // Tujuan: Memastikan x_k tidak terlalu dekat dengan pusat lain
                let dist_to_second = euclidean_distance(x_k, &initial_centers[second_closest]);
                let min_dist_from_closest = min_distance_from_cluster(&initial_centers, closest);

                if dist_to_second > min_dist_from_closest {
                    initial_centers[closest] = x_k.clone(); // Ganti pusat terdekat dengan x_k
                }
            }
        }
    }

    // Langkah 4: Transformasi format data untuk output
    //
    // Mengubah format pusat cluster dari `Vec<Vec<f64>>` menjadi `HashMap<String, Vec<f64>>`.
    // HashMap ini memetakan setiap nama variabel ke daftar nilai pusatnya di semua cluster,
    // yang merupakan format yang dibutuhkan untuk output dan kemudahan interpretasi.
    let mut centers_map = HashMap::new();
    for (i, var) in data.variables.iter().enumerate() {
        let var_values = initial_centers
            .iter()
            .map(|center| center[i]) // Ekstrak nilai variabel i dari setiap pusat cluster
            .collect();
        centers_map.insert(var.clone(), var_values);
    }

    Ok(InitialClusterCenters {
        centers: centers_map,
        note: None,
        interpretation: Some(
            "This table shows the initial positions of the cluster centers before the iterative optimization process begins. These centers are selected based on the chosen initialization strategy. The quality of these initial centers can influence the final clustering outcome and convergence speed.".to_string()
        ),
    })
}
