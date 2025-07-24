use std::collections::HashMap;

use crate::models::{
    config::KMeansConfig,
    result::{ DistancesBetweenCenters, FinalClusterCenters, ProcessedData },
};

use super::core::*;

/// Menghasilkan pusat cluster final menggunakan algoritma K-Means.
///
/// Algoritma ini secara iteratif memperbarui posisi pusat cluster untuk meminimalkan
/// jarak total antara titik data dan pusat cluster terdekatnya. Proses berhenti ketika
/// perubahan posisi pusat cluster di bawah ambang batas tertentu atau jumlah iterasi maksimum tercapai.
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
    let initial_centers_result = initialize_clusters(data, config)?;
    let mut current_centers = convert_map_to_matrix(
        &initial_centers_result.centers,
        &data.variables
    );

    // Tentukan ambang batas perubahan untuk kriteria konvergensi.
    // Dihitung berdasarkan jarak minimum antar pusat cluster awal untuk memastikan skala yang sesuai.
    let (min_center_dist, _, _) = min_distance_between_centers(&current_centers);
    let min_change_threshold = convergence_criterion * min_center_dist;

    // Langkah 2: Lakukan iterasi untuk menyempurnakan posisi pusat cluster.
    if use_running_means {
        let mut new_centers = current_centers.clone();
        let mut cluster_counts = vec![0; num_clusters];

        for _ in 1..=max_iterations {
            let old_centers_for_change_calc = new_centers.clone();

            for case in &data.data_matrix {
                let closest = find_nearest_cluster(case, &new_centers).0;
                cluster_counts[closest] += 1;
                let count = cluster_counts[closest] as f64;

                for (j, &val) in case.iter().enumerate() {
                    new_centers[closest][j] =
                        new_centers[closest][j] + (val - new_centers[closest][j]) / count;
                }
            }

            let mut max_change: f64 = 0.0;
            for i in 0..num_clusters {
                let change = euclidean_distance(&new_centers[i], &old_centers_for_change_calc[i]);
                max_change = max_change.max(change);
            }

            if max_change <= min_change_threshold {
                break;
            }
        }
        current_centers = new_centers;
    } else {
        for _ in 1..=max_iterations {
            let mut new_centers = vec![vec![0.0; data.variables.len()]; num_clusters];
            let mut cluster_counts = vec![0; num_clusters];

            for case in &data.data_matrix {
                let closest = find_nearest_cluster(case, &current_centers).0;
                cluster_counts[closest] += 1;

                for (j, &val) in case.iter().enumerate() {
                    new_centers[closest][j] += val;
                }
            }

            for i in 0..num_clusters {
                if cluster_counts[i] > 0 {
                    for j in 0..data.variables.len() {
                        new_centers[i][j] /= cluster_counts[i] as f64;
                    }
                }
            }

            for i in 0..num_clusters {
                if cluster_counts[i] == 0 {
                    new_centers[i] = current_centers[i].clone();
                }
            }

            let mut max_change: f64 = 0.0;
            for i in 0..num_clusters {
                let change = euclidean_distance(&new_centers[i], &current_centers[i]);
                max_change = max_change.max(change);
            }

            if max_change <= min_change_threshold {
                current_centers = new_centers;
                break;
            }
            current_centers = new_centers;
        }
    }

    // Langkah 3: Format hasil akhir dari matriks ke dalam bentuk `HashMap` untuk kemudahan penggunaan.
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
pub fn calculate_distances_between_centers(
    data: &ProcessedData,
    config: &KMeansConfig
) -> Result<DistancesBetweenCenters, String> {
    let num_clusters = config.main.cluster as usize;

    // Dapatkan pusat cluster final yang sudah dioptimalkan.
    let final_centers_result = generate_final_cluster_centers(data, config)?;
    let final_centers = convert_map_to_matrix(&final_centers_result.centers, &data.variables);

    // Inisialisasi matriks untuk menyimpan jarak.
    let mut distances = vec![vec![0.0; num_clusters]; num_clusters];

    // Hitung jarak Euclidean untuk setiap pasangan pusat cluster.
    // Rumus Jarak Euclidean: sqrt(sum((p_i - q_i)^2))
    // Tujuan: Mengukur seberapa jauh atau berbeda posisi antar cluster di ruang multidimensi.
    // Interpretasi: Nilai yang lebih besar menunjukkan cluster yang lebih terpisah.
    for i in 0..num_clusters {
        for j in i..num_clusters {
            let dist = if i == j {
                0.0 // Jarak ke diri sendiri adalah nol.
            } else {
                euclidean_distance(&final_centers[i], &final_centers[j])
            };

            // Matriks jarak bersifat simetris, sehingga distances[i][j] == distances[j][i].
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
