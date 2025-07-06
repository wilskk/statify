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

    for iteration in 1..=max_iterations {
        // Inisialisasi pusat cluster baru dan jumlah anggota untuk setiap cluster.
        let mut new_centers = if use_running_means {
            current_centers.clone()
        } else {
            vec![vec![0.0; data.variables.len()]; num_clusters]
        };
        let mut cluster_counts = vec![0; num_clusters];

        // Tahap Penugasan (Assignment Step) dan Pembaruan Pusat Cluster
        // Setiap titik data ditugaskan ke cluster dengan pusat terdekat.
        for case in &data.data_matrix {
            let closest = find_closest_cluster(case, &current_centers);
            cluster_counts[closest] += 1;

            // Pusat cluster diperbarui. Ada dua metode yang bisa digunakan:
            if use_running_means {
                // Metode Rata-rata Berjalan (Running Means):
                // Pusat cluster diperbarui secara inkremental setelah setiap titik data ditambahkan.
                // Rumus: M_n = M_{n-1} + (x_n - M_{n-1}) / n
                // Tujuan: Memberikan pembaruan yang lebih stabil dan bertahap,
                //         yang bisa lebih efektif untuk beberapa jenis distribusi data.
                let count = cluster_counts[closest] as f64;
                for (j, &val) in case.iter().enumerate() {
                    new_centers[closest][j] =
                        new_centers[closest][j] + (val - new_centers[closest][j]) / count;
                }
            } else {
                // Metode Rata-rata Batch (Batch Means):
                // Menjumlahkan semua nilai titik data dalam satu cluster.
                // Rata-rata dihitung setelah semua titik data diproses (di luar loop ini).
                for (j, &val) in case.iter().enumerate() {
                    new_centers[closest][j] += val;
                }
            }
        }

        // Jika tidak menggunakan rata-rata berjalan, hitung rata-rata batch sekarang.
        if !use_running_means {
            for i in 0..num_clusters {
                if cluster_counts[i] > 0 {
                    for j in 0..data.variables.len() {
                        new_centers[i][j] /= cluster_counts[i] as f64;
                    }
                }
            }
        }

        // Menangani kluster kosong dengan mempertahankan pusat lama mereka
        // untuk menghindari pergeseran ke titik asal (0,0,...).
        for i in 0..num_clusters {
            if cluster_counts[i] == 0 {
                new_centers[i] = current_centers[i].clone();
            }
        }

        // Menghitung Perubahan Pusat Cluster

        // Mengukur seberapa besar pergeseran pusat cluster dari iterasi sebelumnya.
        // Perubahan maksimum di antara semua cluster akan digunakan untuk memeriksa konvergensi.
        let mut changes = Vec::with_capacity(num_clusters);
        let mut max_change: f64 = 0.0;

        for i in 0..num_clusters {
            // Menghitung jarak Euclidean antara pusat cluster lama dan baru.
            let cluster_change = (0..data.variables.len())
                .map(|j| (new_centers[i][j] - current_centers[i][j]).powi(2))
                .sum::<f64>()
                .sqrt();

            changes.push((format!("{}", i + 1), cluster_change));
            max_change = max_change.max(cluster_change);
        }

        // Simpan hasil dari iterasi saat ini.
        iterations.push(IterationStep {
            iteration,
            changes,
        });

        // Pemeriksaan Konvergensi
        if max_change <= min_change_threshold {
            convergence_note = Some(
                format!(
                    "Convergence achieved due to no or small change in cluster centers. The maximum absolute coordinate change for any center is {:.15e}. The current iteration is {}. The minimum distance between initial centers is {:.3}.",
                    max_change,
                    iteration,
                    min_center_dist
                )
            );
            break; // Hentikan iterasi jika sudah konvergen.
        }

        // Perbarui pusat cluster untuk iterasi berikutnya.
        current_centers = new_centers;

        // Periksa apakah iterasi telah mencapai batas maksimum.
        if iteration == max_iterations {
            convergence_note = Some(
                format!("Maximum number of iterations ({}) reached without convergence.", max_iterations)
            );
        }
    }

    // Pastikan ada catatan konvergensi yang sesuai, terutama jika loop tidak berjalan
    // atau selesai tanpa memenuhi kriteria konvergensi secara eksplisit.
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
        convergence_note,
    })
}
