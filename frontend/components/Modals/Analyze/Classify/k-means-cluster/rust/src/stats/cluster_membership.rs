use crate::models::{
    config::KMeansConfig,
    result::{ ClusterMembership, ProcessedData, ClusterMembershipData },
};

use super::core::*;

/// Menghasilkan keanggotaan cluster untuk setiap kasus dalam data set.
///
/// Fungsi ini menjalankan langkah terakhir dari algoritma K-Means, yaitu menugaskan
/// setiap titik data ke cluster terdekat berdasarkan pusat cluster final yang telah dihitung.
pub fn generate_cluster_membership(
    data: &ProcessedData,
    config: &KMeansConfig
) -> Result<ClusterMembership, String> {
    // Menghitung pusat cluster final menggunakan algoritma K-Means hingga konvergen.
    let final_centers_result = generate_final_cluster_centers(data, config)?;

    // Mengonversi pusat cluster dari format peta (HashMap) ke format matriks.
    let final_centers = convert_map_to_matrix(&final_centers_result.centers, &data.variables);

    // Menentukan keanggotaan cluster untuk setiap kasus (baris) dalam matriks data.
    let membership_data = data.data_matrix
        .iter()
        .enumerate()
        .map(|(idx, case)| {
            // Mencari cluster terdekat untuk kasus saat ini dan menghitung jaraknya.
            let (cluster, distance) = find_nearest_cluster(case, &final_centers);
            let case_name = data.case_names.as_ref().and_then(|names| names.get(idx).cloned());

            ClusterMembershipData {
                case_number: data.case_numbers[idx],
                case_name,
                cluster: (cluster + 1) as i32, // 1-based index
                distance,
            }
        })
        .collect();

    let membership = ClusterMembership {
        data: membership_data,
        note: None,
        interpretation: Some(
            "This indicates which cluster the case belongs to and its Euclidean distance to the cluster's center. A smaller distance implies a better fit of the case to its assigned cluster.".to_string()
        ),
    };

    Ok(membership)
}
