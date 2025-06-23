use std::collections::HashMap;

use crate::models::{
    config::ClusterConfig,
    result::{ InitialClusterCenters, ProcessedData },
};

use super::core::*;

/// Menginisialisasi pusat cluster awal untuk algoritma K-Means.
///
/// Fungsi ini memilih titik-titik data awal yang akan berfungsi sebagai pusat (centroid)
/// untuk setiap cluster. Terdapat dua strategi inisialisasi:
/// 1. Menggunakan 'k' titik data pertama sebagai pusat awal secara langsung.
/// 2. Menggunakan metode heuristik yang terinspirasi dari K-Means++ untuk mendapatkan
///    pusat-pusat yang lebih tersebar dan representatif.
pub fn initialize_clusters(
    data: &ProcessedData,
    config: &ClusterConfig
) -> Result<InitialClusterCenters, String> {
    let num_clusters = config.main.cluster as usize;

    // --- Validasi Input ---
    // Memastikan jumlah cluster yang diminta lebih dari nol.
    if num_clusters == 0 {
        return Err("Number of clusters must be positive".to_string());
    }

    // Memastikan jumlah titik data cukup untuk jumlah cluster yang diminta.
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
    if config.main.read_initial {
        // Strategi 1: Menggunakan 'k' titik data pertama sebagai pusat awal.
        // Pendekatan ini sederhana dan cepat, cocok jika urutan data tidak memiliki bias.
        initial_centers = data.data_matrix.iter().take(num_clusters).cloned().collect();
    } else {
        // Strategi 2: Heuristik untuk pemilihan pusat yang lebih baik.
        // Dimulai dengan 'k' titik pertama, kemudian diperbaiki secara iteratif.
        initial_centers = data.data_matrix.iter().take(num_clusters).cloned().collect();

        // Iterasi melalui sisa titik data untuk memperbaiki pusat awal.
        for k in num_clusters..data.data_matrix.len() {
            let x_k = &data.data_matrix[k];

            // Menghitung jarak Euclidean: metrik umum untuk mengukur jarak
            // garis lurus antara dua titik dalam ruang multidimensi.
            let (closest, min_dist) = find_nearest_cluster(x_k, &initial_centers);
            let second_closest = find_second_closest_cluster(x_k, &initial_centers, closest);

            // Cari jarak minimum antara dua pusat cluster yang sudah ada.
            let (min_center_dist, m, n) = min_distance_between_centers(&initial_centers);

            // Logika untuk mengganti pusat yang ada dengan titik baru (x_k).
            // Tujuannya adalah untuk memaksimalkan jarak antar pusat cluster,
            // sehingga menghasilkan pusat awal yang lebih tersebar.
            if min_dist > min_center_dist {
                // Jika jarak titik x_k ke pusat terdekatnya lebih besar dari jarak
                // minimum antar pusat, ganti salah satu dari dua pusat terdekat
                // satu sama lain (m atau n) dengan x_k.
                if
                    euclidean_distance(x_k, &initial_centers[m]) >
                    euclidean_distance(x_k, &initial_centers[n])
                {
                    initial_centers[m] = x_k.clone();
                } else {
                    initial_centers[n] = x_k.clone();
                }
            } else {
                // Jika tidak, pertimbangkan untuk mengganti pusat terdekat dengan x_k
                // jika x_k cukup jauh dari pusat-pusat lainnya.
                let dist_to_second = euclidean_distance(x_k, &initial_centers[second_closest]);
                let min_dist_from_closest = min_distance_from_cluster(&initial_centers, closest);

                if dist_to_second > min_dist_from_closest {
                    initial_centers[closest] = x_k.clone();
                }
            }
        }
    }

    // Mengubah format pusat cluster dari `Vec<Vec<f64>>` menjadi `HashMap<String, Vec<f64>>`.
    // HashMap ini memetakan setiap nama variabel ke daftar nilai pusatnya di semua cluster,
    // yang merupakan format yang dibutuhkan untuk output.
    let mut centers_map = HashMap::new();
    for (i, var) in data.variables.iter().enumerate() {
        let var_values = initial_centers
            .iter()
            .map(|center| center[i])
            .collect();
        centers_map.insert(var.clone(), var_values);
    }

    Ok(InitialClusterCenters { centers: centers_map })
}
