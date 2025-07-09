use crate::models::{
    config::ClusterConfig,
    result::{ IterationHistory, IterationStep, ProcessedData },
};

use super::core::*;

/// Menghasilkan riwayat iterasi dari proses K-Means.
///
/// Fungsi ini menjalankan algoritma K-Means dan mencatat perubahan pusat cluster
/// pada setiap langkah iterasi hingga konvergensi tercapai atau batas maksimum
/// iterasi terlampaui.
pub fn generate_iteration_history(
    data: &ProcessedData,
    config: &ClusterConfig
) -> Result<IterationHistory, String> {
    let num_clusters = config.main.cluster as usize; // Jumlah cluster yang diinginkan.
    let max_iterations = config.iterate.maximum_iterations; // Batas maksimum iterasi.
    let convergence_criterion = config.iterate.convergence_criterion; // Kriteria untuk menganggap algoritma telah konvergen.
    let use_running_means = config.iterate.use_running_means; // Opsi untuk menggunakan rata-rata berjalan (running means).

    // Menentukan posisi awal pusat-pusat cluster berdasarkan data dan konfigurasi.
    // Inisialisasi yang baik dapat mempercepat konvergensi.
    let initial_centers_result = initialize_clusters(data, config)?;
    let mut current_centers = convert_map_to_matrix(
        &initial_centers_result.centers,
        &data.variables
    );

    // Menghitung Ambang Batas Konvergensi
    // Ambang batas perubahan pusat cluster dihitung berdasarkan jarak minimum
    // antar pusat cluster awal. Jika perubahan lebih kecil dari ambang ini,
    // iterasi dianggap konvergen.
    let (min_center_dist, _, _) = min_distance_between_centers(&current_centers);
    let min_change_threshold = convergence_criterion * min_center_dist;

    // Inisialisasi variabel untuk menyimpan hasil iterasi.
    let mut iterations = Vec::with_capacity(max_iterations as usize);
    let mut convergence_note = None;

    // Jika menggunakan running means, logika pemrosesan berbeda
    if use_running_means {
        // Inisialisasi pusat cluster dan jumlah anggota.
        // Pusat cluster diperbarui secara inkremental.
        let mut new_centers = current_centers.clone();
        let mut cluster_counts = vec![0; num_clusters];

        for iteration in 1..=max_iterations {
            let old_centers_for_change_calc = new_centers.clone();

            // Tahap Penugasan dan Pembaruan Inkremental
            // Setiap titik data ditugaskan dan pusat cluster langsung diperbarui.
            for case in &data.data_matrix {
                let closest = find_closest_cluster(case, &new_centers);
                cluster_counts[closest] += 1;
                let count = cluster_counts[closest] as f64;

                // Rumus Rata-rata Berjalan (Running Means):
                // M_n = M_{n-1} + (x_n - M_{n-1}) / n
                for (j, &val) in case.iter().enumerate() {
                    new_centers[closest][j] =
                        new_centers[closest][j] + (val - new_centers[closest][j]) / count;
                }
            }

            // Menghitung perubahan dari awal iterasi ini
            let mut changes = Vec::with_capacity(num_clusters);
            let mut max_change: f64 = 0.0;
            for i in 0..num_clusters {
                let cluster_change = (0..data.variables.len())
                    .map(|j| (new_centers[i][j] - old_centers_for_change_calc[i][j]).powi(2))
                    .sum::<f64>()
                    .sqrt();

                changes.push((format!("{}", i + 1), cluster_change));
                max_change = max_change.max(cluster_change);
            }

            iterations.push(IterationStep { iteration, changes });

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

            if iteration == max_iterations {
                convergence_note = Some(
                    format!("Maximum number of iterations ({}) reached without convergence.", max_iterations)
                );
            }
        }
    } else {
        // Logika K-Means standar (Batch)
        for iteration in 1..=max_iterations {
            let mut new_centers = vec![vec![0.0; data.variables.len()]; num_clusters];
            let mut cluster_counts = vec![0; num_clusters];

            // Tahap Penugasan (Assignment Step)
            for case in &data.data_matrix {
                let closest = find_closest_cluster(case, &current_centers);
                cluster_counts[closest] += 1;
                for (j, &val) in case.iter().enumerate() {
                    new_centers[closest][j] += val;
                }
            }

            // Tahap Pembaruan (Update Step)
            for i in 0..num_clusters {
                if cluster_counts[i] > 0 {
                    for j in 0..data.variables.len() {
                        new_centers[i][j] /= cluster_counts[i] as f64;
                    }
                }
            }

            // Menangani kluster kosong
            for i in 0..num_clusters {
                if cluster_counts[i] == 0 {
                    new_centers[i] = current_centers[i].clone();
                }
            }

            // Menghitung Perubahan Pusat Cluster
            let mut changes = Vec::with_capacity(num_clusters);
            let mut max_change: f64 = 0.0;

            for i in 0..num_clusters {
                let cluster_change = (0..data.variables.len())
                    .map(|j| (new_centers[i][j] - current_centers[i][j]).powi(2))
                    .sum::<f64>()
                    .sqrt();
                changes.push((format!("{}", i + 1), cluster_change));
                max_change = max_change.max(cluster_change);
            }

            iterations.push(IterationStep { iteration, changes });

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

            current_centers = new_centers;

            if iteration == max_iterations {
                convergence_note = Some(
                    format!("Maximum number of iterations ({}) reached without convergence.", max_iterations)
                );
            }
        }
    }

    // Pastikan ada catatan konvergensi yang sesuai
    if iterations.is_empty() {
        convergence_note = Some(String::from("No iterations performed"));
    } else if convergence_note.is_none() {
        convergence_note = Some(
            format!("Maximum number of iterations ({}) reached without convergence.", max_iterations)
        );
    }

    // Mengembalikan riwayat iterasi yang lengkap.
    Ok(IterationHistory {
        iterations,
        note: convergence_note,
        interpretation: Some(
            "This table tracks the movement of cluster centers across iterations. Each row represents an iteration, showing how much each cluster center shifted. The process stops when the changes fall below a convergence threshold or the maximum number of iterations is reached, as detailed in the convergence note.".to_string()
        ),
    })
}
