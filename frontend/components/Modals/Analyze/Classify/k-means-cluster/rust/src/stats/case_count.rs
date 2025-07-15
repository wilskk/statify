use crate::models::{ config::ClusterConfig, result::{ CaseCountTable, ProcessedData } };

use super::core::*;

/// Menghitung jumlah kasus (data point) untuk setiap cluster.
pub fn generate_case_count(
    data: &ProcessedData,
    config: &ClusterConfig
) -> Result<CaseCountTable, String> {
    // Mendapatkan jumlah cluster dari konfigurasi.
    let num_clusters = config.main.cluster as usize;

    // Menghasilkan keanggotaan cluster untuk setiap data point.
    // Fungsi ini menentukan setiap data point masuk ke cluster mana.
    let membership = generate_cluster_membership(data, config)?;

    // Menghitung jumlah data point (kasus) dalam setiap cluster.
    // Proses ini pada dasarnya adalah tabulasi frekuensi sederhana.
    let counts = (1..=num_clusters)
        .map(|i| {
            // Untuk setiap cluster `i`, filter dan hitung anggota dari `membership`.
            let count = membership.data
                .iter()
                .filter(|m| m.cluster == (i as i32))
                .count();

            // Mengembalikan pasangan (nomor cluster, jumlah anggota).
            (i.to_string(), count)
        })
        .collect();

    // Mengkonstruksi hasil akhir dalam bentuk `CaseCountTable`.
    Ok(CaseCountTable {
        // `valid` adalah jumlah total data point yang berhasil diproses.
        valid: membership.data.len(),
        // `missing` saat ini di-hardcode ke 0, diasumsikan tidak ada data yang hilang.
        missing: data.missing_cases,
        // `clusters` berisi peta dari nomor cluster ke jumlah kasusnya.
        clusters: counts,
        note: None,
        interpretation: Some(
            "This table shows the number of cases assigned to each cluster. 'Valid' represents the total count of data points processed, while 'Missing' indicates cases that were excluded. The 'Clusters' field details the specific case count for each cluster.".to_string()
        ),
    })
}
