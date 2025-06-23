use crate::models::{ config::ClusterConfig, result::{ ClusterMembership, ProcessedData } };

use super::core::*;

/// Menghasilkan keanggotaan cluster untuk setiap kasus dalam data set.
///
/// Fungsi ini menjalankan langkah terakhir dari algoritma K-Means, yaitu menugaskan
/// setiap titik data ke cluster terdekat berdasarkan pusat cluster final yang telah dihitung.
pub fn generate_cluster_membership(
    data: &ProcessedData,
    config: &ClusterConfig
) -> Result<Vec<ClusterMembership>, String> {
    // Menghitung pusat cluster final menggunakan algoritma K-Means.
    // Langkah ini merupakan inti dari proses clustering di mana posisi akhir dari setiap pusat cluster ditentukan.
    let final_centers_result = generate_final_cluster_centers(data, config)?;

    // Mengonversi pusat cluster dari format peta (HashMap) ke format matriks.
    // Perubahan format ini mempermudah perhitungan jarak dalam langkah selanjutnya.
    let final_centers = convert_map_to_matrix(&final_centers_result.centers, &data.variables);

    // Menentukan keanggotaan cluster untuk setiap kasus (baris) dalam matriks data.
    let membership = data.data_matrix
        .iter()
        .enumerate()
        .map(|(idx, case)| {
            // Mencari cluster terdekat untuk kasus saat ini dan menghitung jaraknya.
            // Rumus yang digunakan umumnya adalah Jarak Euclidean untuk menentukan kedekatan.
            let (cluster, distance) = find_nearest_cluster(case, &final_centers);
            let case_name = data.case_names.as_ref().and_then(|names| names.get(idx).cloned());

            // Membuat struct `ClusterMembership` yang menyimpan hasil penugasan cluster.
            ClusterMembership {
                case_number: data.case_numbers[idx],
                case_name,
                // Cluster diubah menjadi 1-based index untuk kemudahan interpretasi.
                cluster: (cluster + 1) as i32,
                distance,
            }
        })
        .collect();

    Ok(membership)
}
