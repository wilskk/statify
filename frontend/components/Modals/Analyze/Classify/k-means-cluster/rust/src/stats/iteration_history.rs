use crate::models::{
    config::KMeansConfig,
    result::{ IterationHistory, IterationStep, ProcessedData },
};

use super::core::*;

pub fn generate_iteration_history(
    data: &ProcessedData,
    config: &KMeansConfig
) -> Result<IterationHistory, String> {
    let num_clusters = config.main.cluster as usize;
    let max_iterations = config.iterate.maximum_iterations;
    let convergence_criterion = config.iterate.convergence_criterion;
    let use_running_means = config.iterate.use_running_means;

    let initial_centers_result = initialize_clusters(data, config)?;
    let mut current_centers = convert_map_to_matrix(
        &initial_centers_result.centers,
        &data.variables
    );

    // Ambang Batas Konvergensi
    let (min_center_dist, _, _) = min_distance_between_centers(&current_centers);
    let min_change_threshold = convergence_criterion * min_center_dist;

    let mut iterations = Vec::with_capacity(max_iterations as usize);
    let mut convergence_note = None;

    if use_running_means {
        let mut new_centers = current_centers.clone();
        let mut cluster_counts = vec![0; num_clusters];

        for iteration in 1..=max_iterations {
            let old_centers_for_change_calc = new_centers.clone();

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

            // Menghitung perubahan pusat cluster
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
        for iteration in 1..=max_iterations {
            let mut new_centers = vec![vec![0.0; data.variables.len()]; num_clusters];
            let mut cluster_counts = vec![0; num_clusters];

            for case in &data.data_matrix {
                let closest = find_nearest_cluster(case, &current_centers).0;
                cluster_counts[closest] += 1;
                for (j, &val) in case.iter().enumerate() {
                    new_centers[closest][j] += val;
                }
            }

            // Hitung pusat cluster baru sebagai mean dari semua titik dalam cluster.
            for i in 0..num_clusters {
                if cluster_counts[i] > 0 {
                    for j in 0..data.variables.len() {
                        new_centers[i][j] /= cluster_counts[i] as f64;
                    }
                }
            }

            // Jika suatu cluster tidak memiliki anggota, pertahankan posisi pusat cluster sebelumnya.
            for i in 0..num_clusters {
                if cluster_counts[i] == 0 {
                    new_centers[i] = current_centers[i].clone();
                }
            }

            let mut changes = Vec::with_capacity(num_clusters);
            let mut max_change: f64 = 0.0;

            for i in 0..num_clusters {
                let cluster_change = euclidean_distance(&new_centers[i], &current_centers[i]);
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

            // Update pusat cluster
            current_centers = new_centers;

            if iteration == max_iterations {
                convergence_note = Some(
                    format!("Maximum number of iterations ({}) reached without convergence.", max_iterations)
                );
            }
        }
    }

    if iterations.is_empty() {
        convergence_note = Some(String::from("No iterations performed"));
    } else if convergence_note.is_none() {
        convergence_note = Some(
            format!("Maximum number of iterations ({}) reached without convergence.", max_iterations)
        );
    }

    Ok(IterationHistory {
        iterations,
        note: convergence_note,
        interpretation: Some(
            "This table tracks the movement of cluster centers across iterations. Each row represents an iteration, showing how much each cluster center shifted. The process stops when the changes fall below a convergence threshold or the maximum number of iterations is reached, as detailed in the convergence note.".to_string()
        ),
    })
}
