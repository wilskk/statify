use crate::kmeans::models::{ config::ClusterConfig, result::{ CaseCountTable, ProcessedData } };

use super::core::generate_cluster_membership;

/// Menghitung jumlah kasus (data point) untuk setiap cluster.
///
/// # Arguments
///
/// * `data` - Data yang telah diproses dan siap untuk dianalisis.
/// * `config` - Konfigurasi untuk proses clustering.
///
/// # Returns
///
/// Mengembalikan `CaseCountTable` yang berisi jumlah kasus per cluster,
/// atau `Err` jika terjadi kesalahan dalam pembuatan keanggotaan cluster.
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
            let count = membership
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
        valid: membership.len(),
        // `missing` saat ini di-hardcode ke 0, diasumsikan tidak ada data yang hilang.
        missing: 0,
        // `clusters` berisi peta dari nomor cluster ke jumlah kasusnya.
        clusters: counts,
    })
}
