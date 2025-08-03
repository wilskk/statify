use std::collections::HashMap;

use crate::models::{
    config::KMeansConfig,
    result::{ DistancesBetweenCenters, FinalClusterCenters, ProcessedData },
};

use super::core::*;

/// Menghasilkan pusat cluster final menggunakan algoritma K-Means.
///
/// ## Langkah-langkah Algoritma:
/// 1. **Inisialisasi**: Pilih k pusat cluster awal secara acak atau menggunakan metode tertentu
/// 2. **Assignment**: Setiap titik data ditugaskan ke cluster terdekat berdasarkan jarak Euclidean
/// 3. **Update**: Hitung ulang pusat cluster sebagai mean dari semua titik dalam cluster
/// 4. **Iterasi**: Ulangi langkah 2-3 sampai konvergensi atau iterasi maksimum tercapai
///
/// ## Rumus Matematika:
///
/// ### Jarak Euclidean (untuk assignment):
/// ```
/// d(x, μ) = √(Σ(x_i - μ_i)²)
/// ```
/// Dimana:
/// - x = titik data
/// - μ = pusat cluster
/// - i = dimensi variabel
///
/// ### Update Pusat Cluster (batch mode):
/// ```
/// μ_k^(t+1) = (1/|C_k|) * Σ(x ∈ C_k) x
/// ```
/// Dimana:
/// - μ_k = pusat cluster k
/// - C_k = himpunan titik dalam cluster k
/// - |C_k| = jumlah titik dalam cluster k
///
/// ### Update Pusat Cluster (running mean):
/// ```
/// μ_k^(t+1) = μ_k^t + (1/n_k) * (x - μ_k^t)
/// ```
/// Dimana:
/// - n_k = jumlah titik yang telah ditugaskan ke cluster k
/// - x = titik data baru
pub fn generate_final_cluster_centers(
    data: &ProcessedData,
    config: &KMeansConfig
) -> Result<FinalClusterCenters, String> {
    // Inisialisasi parameter dari konfigurasi.
    let num_clusters = config.main.cluster as usize;
    let max_iterations = config.iterate.maximum_iterations;
    let convergence_criterion = config.iterate.convergence_criterion;
    let use_running_means = config.iterate.use_running_means;

    // Langkah 1: Inisialisasi pusat cluster awal.
    // Menggunakan metode yang ditentukan dalam konfigurasi (biasanya k-means++ atau random)
    let initial_centers_result = initialize_clusters(data, config)?;
    let mut current_centers = convert_map_to_matrix(
        &initial_centers_result.centers,
        &data.variables
    );

    // Tentukan ambang batas perubahan untuk kriteria konvergensi.
    // Dihitung berdasarkan jarak minimum antar pusat cluster awal untuk memastikan skala yang sesuai.
    //
    // Rumus: threshold = convergence_criterion * min_distance_between_centers
    //
    // Tujuan: Memastikan bahwa perubahan posisi pusat cluster cukup signifikan
    // untuk melanjutkan iterasi, namun tidak terlalu kecil sehingga algoritma
    // berhenti terlalu dini.
    let (min_center_dist, _, _) = min_distance_between_centers(&current_centers);
    let min_change_threshold = convergence_criterion * min_center_dist;

    // Langkah 2: Lakukan iterasi untuk menyempurnakan posisi pusat cluster.
    if use_running_means {
        // Implementasi K-Means dengan running means
        //
        // Algoritma:
        // 1. Untuk setiap titik data, update pusat cluster terdekat secara langsung
        // 2. Gunakan rumus: μ_new = μ_old + (1/n) * (x - μ_old)
        // 3. Dimana n adalah jumlah titik yang telah ditugaskan ke cluster tersebut
        let mut new_centers = current_centers.clone();
        let mut cluster_counts = vec![0; num_clusters];

        for _ in 1..=max_iterations {
            let old_centers_for_change_calc = new_centers.clone();

            // Proses setiap titik data dan update pusat cluster secara incremental
            for case in &data.data_matrix {
                // Temukan cluster terdekat menggunakan jarak Euclidean
                let closest = find_nearest_cluster(case, &new_centers).0;
                cluster_counts[closest] += 1;
                let count = cluster_counts[closest] as f64;

                // Update pusat cluster menggunakan running mean
                // Rumus: μ_k^(t+1) = μ_k^t + (1/n_k) * (x - μ_k^t)
                for (j, &val) in case.iter().enumerate() {
                    new_centers[closest][j] =
                        new_centers[closest][j] + (val - new_centers[closest][j]) / count;
                }
            }

            // Hitung perubahan maksimum untuk menentukan konvergensi
            let mut max_change: f64 = 0.0;
            for i in 0..num_clusters {
                let change = euclidean_distance(&new_centers[i], &old_centers_for_change_calc[i]);
                max_change = max_change.max(change);
            }

            // Cek kriteria konvergensi
            if max_change <= min_change_threshold {
                break;
            }
        }
        current_centers = new_centers;
    } else {
        // Implementasi K-Means dengan batch mode (standar)
        //
        // Algoritma:
        // 1. Assignment: Tugaskan setiap titik ke cluster terdekat
        // 2. Update: Hitung ulang pusat cluster sebagai mean dari semua titik dalam cluster
        // 3. Iterasi: Ulangi sampai konvergensi
        for _ in 1..=max_iterations {
            let mut new_centers = vec![vec![0.0; data.variables.len()]; num_clusters];
            let mut cluster_counts = vec![0; num_clusters];

            // Langkah Assignment: Tugaskan setiap titik ke cluster terdekat
            for case in &data.data_matrix {
                let closest = find_nearest_cluster(case, &current_centers).0;
                cluster_counts[closest] += 1;

                // Akumulasi nilai untuk perhitungan mean
                for (j, &val) in case.iter().enumerate() {
                    new_centers[closest][j] += val;
                }
            }

            // Langkah Update: Hitung pusat cluster baru sebagai mean
            // Rumus: μ_k = (1/|C_k|) * Σ(x ∈ C_k) x
            for i in 0..num_clusters {
                if cluster_counts[i] > 0 {
                    for j in 0..data.variables.len() {
                        new_centers[i][j] /= cluster_counts[i] as f64;
                    }
                }
            }

            // Handle cluster kosong: pertahankan posisi pusat cluster sebelumnya
            for i in 0..num_clusters {
                if cluster_counts[i] == 0 {
                    new_centers[i] = current_centers[i].clone();
                }
            }

            // Hitung perubahan maksimum untuk menentukan konvergensi
            let mut max_change: f64 = 0.0;
            for i in 0..num_clusters {
                let change = euclidean_distance(&new_centers[i], &current_centers[i]);
                max_change = max_change.max(change);
            }

            // Cek kriteria konvergensi
            if max_change <= min_change_threshold {
                current_centers = new_centers;
                break;
            }
            current_centers = new_centers;
        }
    }

    // Langkah 3: Format hasil akhir dari matriks ke dalam bentuk `HashMap` untuk kemudahan penggunaan.
    //
    // Transformasi dari format matriks [cluster][variable] ke format HashMap[variable][cluster]
    // untuk memudahkan akses dan interpretasi hasil.
    let mut centers_map = HashMap::new();
    for (i, var) in data.variables.iter().enumerate() {
        let var_values = current_centers
            .iter()
            .map(|center| center[i])
            .collect();
        centers_map.insert(var.clone(), var_values);
    }

    Ok(FinalClusterCenters {
        centers: centers_map,
        note: None,
        interpretation: Some(
            "This table presents the final coordinates for the center of each cluster after the iterative K-Means algorithm has converged. Each row corresponds to a variable, and each column represents a cluster, showing the value of that variable at the cluster's centroid. These centers define the typical profile of a case belonging to each cluster.".to_string()
        ),
    })
}

/// Menghitung matriks jarak antara semua pasangan pusat cluster final.
///
/// Fungsi ini pertama-tama menghasilkan pusat cluster final, kemudian menghitung
/// jarak Euclidean antara setiap pasang pusat cluster.
///
/// # Tujuan Analisis
///
/// Matriks jarak antar pusat cluster digunakan untuk:
/// 1. **Evaluasi Kualitas Clustering**: Cluster yang terpisah dengan baik memiliki jarak yang besar
/// 2. **Identifikasi Cluster Overlap**: Jarak kecil menunjukkan cluster yang mungkin tumpang tindih
/// 3. **Validasi Hasil**: Memastikan bahwa algoritma menghasilkan cluster yang berbeda
///
/// # Rumus Matematika
///
/// ## Jarak Euclidean antara dua pusat cluster:
/// ```
/// d(μ_i, μ_j) = √(Σ(μ_i,k - μ_j,k)²)
/// ```
/// Dimana:
/// - μ_i, μ_j = pusat cluster i dan j
/// - k = indeks variabel (dimensi)
/// - d = jarak Euclidean
pub fn calculate_distances_between_centers(
    data: &ProcessedData,
    config: &KMeansConfig
) -> Result<DistancesBetweenCenters, String> {
    let num_clusters = config.main.cluster as usize;

    // Dapatkan pusat cluster final yang sudah dioptimalkan.
    // Pusat ini adalah hasil konvergensi dari algoritma K-Means
    let final_centers_result = generate_final_cluster_centers(data, config)?;
    let final_centers = convert_map_to_matrix(&final_centers_result.centers, &data.variables);

    // Inisialisasi matriks untuk menyimpan jarak.
    // Matriks ini akan bersifat simetris: distances[i][j] = distances[j][i]
    let mut distances = vec![vec![0.0; num_clusters]; num_clusters];

    // Hitung jarak Euclidean untuk setiap pasangan pusat cluster.
    //
    // Rumus Jarak Euclidean: d(μ_i, μ_j) = √(Σ(μ_i,k - μ_j,k)²)
    //
    // Tujuan: Mengukur seberapa jauh atau berbeda posisi antar cluster di ruang multidimensi.
    // Interpretasi: Nilai yang lebih besar menunjukkan cluster yang lebih terpisah.
    //
    // Optimasi: Hanya hitung setengah matriks karena simetris, lalu copy ke bagian lainnya
    for i in 0..num_clusters {
        for j in i..num_clusters {
            let dist = if i == j {
                0.0 // Jarak ke diri sendiri adalah nol (diagonal matriks)
            } else {
                // Hitung jarak Euclidean antara pusat cluster i dan j
                euclidean_distance(&final_centers[i], &final_centers[j])
            };

            // Matriks jarak bersifat simetris, sehingga distances[i][j] == distances[j][i].
            // Ini menghemat perhitungan dan memastikan konsistensi data.
            distances[i][j] = dist;
            distances[j][i] = dist;
        }
    }

    Ok(DistancesBetweenCenters {
        distances,
        note: None,
        interpretation: Some(
            "This table displays the Euclidean distances between the final cluster centers. Each cell (i, j) in the matrix represents the distance between the center of cluster i and the center of cluster j. Larger values indicate that clusters are more distinct and further apart in the multi-dimensional variable space. The diagonal elements are always zero.".to_string()
        ),
    })
}
