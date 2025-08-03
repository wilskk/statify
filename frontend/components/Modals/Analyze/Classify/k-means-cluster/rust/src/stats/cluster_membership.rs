use crate::models::{
    config::KMeansConfig,
    result::{ ClusterMembership, ProcessedData, ClusterMembershipData },
};

use super::core::*;

/// Menghasilkan keanggotaan cluster untuk setiap kasus dalam data set.
///
/// Fungsi ini menjalankan langkah terakhir dari algoritma K-Means, yaitu menugaskan
/// setiap titik data ke cluster terdekat berdasarkan pusat cluster final yang telah dihitung.
///
/// # Algoritma Assignment (Penugasan Cluster)
///
/// Setelah pusat cluster final diperoleh dari algoritma K-Means, setiap titik data
/// ditugaskan ke cluster dengan pusat terdekat berdasarkan jarak Euclidean.
pub fn generate_cluster_membership(
    data: &ProcessedData,
    config: &KMeansConfig
) -> Result<ClusterMembership, String> {
    // Langkah 1: Menghitung pusat cluster final menggunakan algoritma K-Means hingga konvergen.
    //
    // Pusat cluster ini adalah hasil dari iterasi K-Means yang telah mencapai kriteria konvergensi.
    // Pusat ini merepresentasikan "prototype" atau "centroid" dari setiap cluster.
    let final_centers_result = generate_final_cluster_centers(data, config)?;

    // Langkah 2: Mengonversi pusat cluster dari format peta (HashMap) ke format matriks.
    //
    // Transformasi dari format HashMap[variable][cluster] ke format matriks[cluster][variable]
    // untuk memudahkan perhitungan jarak Euclidean dalam fungsi find_nearest_cluster.
    let final_centers = convert_map_to_matrix(&final_centers_result.centers, &data.variables);

    // Langkah 3: Menentukan keanggotaan cluster untuk setiap kasus (baris) dalam matriks data.
    //
    // Proses assignment menggunakan prinsip "nearest neighbor" berdasarkan jarak Euclidean.
    // Setiap titik data ditugaskan ke cluster dengan pusat terdekat.
    let membership_data = data.data_matrix
        .iter()
        .enumerate()
        .map(|(idx, case)| {
            // Langkah 3a: Mencari cluster terdekat untuk kasus saat ini dan menghitung jaraknya.
            //
            // Fungsi find_nearest_cluster melakukan:
            // 1. Menghitung jarak Euclidean dari titik data ke semua pusat cluster
            // 2. Menemukan cluster dengan jarak minimum
            // 3. Mengembalikan indeks cluster (0-based) dan jarak Euclidean
            let (cluster, distance) = find_nearest_cluster(case, &final_centers);

            // Langkah 3b: Ambil nama kasus jika tersedia untuk identifikasi yang lebih mudah
            let case_name = data.case_names.as_ref().and_then(|names| names.get(idx).cloned());

            // Langkah 3c: Buat struktur data keanggotaan cluster
            //
            // Catatan: Indeks cluster dikonversi dari 0-based ke 1-based untuk kemudahan interpretasi
            // pengguna (cluster 1, 2, 3, ... bukan cluster 0, 1, 2, ...)
            ClusterMembershipData {
                case_number: data.case_numbers[idx], // Nomor urut kasus
                case_name, // Nama kasus (opsional)
                cluster: (cluster + 1) as i32, // Cluster yang ditugaskan (1-based)
                distance, // Jarak Euclidean ke pusat cluster
            }
        })
        .collect();

    // Langkah 4: Membungkus hasil dalam struktur ClusterMembership dengan interpretasi
    let membership = ClusterMembership {
        data: membership_data,
        note: None,
        interpretation: Some(
            "This indicates which cluster the case belongs to and its Euclidean distance to the cluster's center. A smaller distance implies a better fit of the case to its assigned cluster.".to_string()
        ),
    };

    Ok(membership)
}
