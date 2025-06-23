use std::collections::HashMap;

use crate::kmeans::models::{
    config::ClusterConfig,
    result::{ ANOVACluster, ANOVATable, ProcessedData },
};

use super::core::*;

/*
 * Fungsi `calculate_anova`
 *
 * Melakukan analisis varians (ANOVA) satu arah untuk setiap variabel dalam data.
 * Tujuannya adalah untuk menilai seberapa baik setiap variabel dapat membedakan (memisahkan) antar cluster yang terbentuk.
 * Fungsi ini menghasilkan tabel ANOVA yang merangkum statistik penting untuk setiap variabel.
 */
pub fn calculate_anova(data: &ProcessedData, config: &ClusterConfig) -> Result<ANOVATable, String> {
    // Mendapatkan jumlah cluster dari konfigurasi.
    let num_clusters = config.main.cluster as usize;

    // Menentukan keanggotaan cluster untuk setiap kasus data.
    let membership = generate_cluster_membership(data, config)?;

    // Menginisialisasi HashMap untuk menyimpan hasil ANOVA per variabel.
    let mut anova_clusters = HashMap::new();

    // Melakukan iterasi untuk setiap variabel (kolom) dalam data matriks.
    for (var_idx, var_name) in data.variables.iter().enumerate() {
        // Mengekstrak semua nilai untuk variabel saat ini.
        let var_values: Vec<f64> = data.data_matrix
            .iter()
            .map(|row| row[var_idx])
            .collect();

        // Menghitung rata-rata keseluruhan (grand mean) untuk variabel saat ini.
        let overall_mean = mean(&var_values);

        // Mengelompokkan data berdasarkan keanggotaan clusternya.
        let mut cluster_data: Vec<Vec<f64>> = vec![Vec::new(); num_clusters];
        for (idx, case) in data.data_matrix.iter().enumerate() {
            let cluster = (membership[idx].cluster as usize) - 1;
            cluster_data[cluster].push(case[var_idx]);
        }

        // Menghitung rata-rata untuk setiap cluster. Jika cluster kosong, gunakan grand mean.
        let cluster_means: Vec<f64> = cluster_data
            .iter()
            .map(|cluster| if cluster.is_empty() { overall_mean } else { mean(cluster) })
            .collect();

        // --- Perhitungan Statistik ANOVA ---

        /*
         * Sum of Squares Between-groups (SSB)
         *
         * Rumus: Σ nₖ * (μₖ - μ)²
         * nₖ: Jumlah kasus di cluster k
         * μₖ: Rata-rata cluster k
         * μ: Rata-rata keseluruhan (grand mean)
         *
         * Tujuan: Mengukur variabilitas antar rata-rata cluster.
         * Interpretasi: Nilai SSB yang tinggi menunjukkan perbedaan yang besar antar cluster.
         */
        let ssb: f64 = cluster_data
            .iter()
            .enumerate()
            .map(|(i, cluster)| (cluster.len() as f64) * (cluster_means[i] - overall_mean).powi(2))
            .sum();

        /*
         * Sum of Squares Within-groups (SSW) / Sum of Squared Errors (SSE)
         *
         * Rumus: Σ Σ (xᵢₖ - μₖ)²
         * xᵢₖ: Nilai kasus i di cluster k
         * μₖ: Rata-rata cluster k
         *
         * Tujuan: Mengukur variabilitas di dalam masing-masing cluster.
         * Interpretasi: Nilai SSW yang rendah menunjukkan bahwa anggota dalam satu cluster cenderung mirip.
         */
        let ssw: f64 = cluster_data
            .iter()
            .enumerate()
            .map(|(i, cluster)| sum_squared_deviations(cluster, cluster_means[i]))
            .sum();

        // Derajat kebebasan antar-kelompok (jumlah cluster - 1).
        let df_between = (num_clusters as i32) - 1;
        // Derajat kebebasan dalam-kelompok (jumlah total kasus - jumlah cluster).
        let df_within = (data.data_matrix.len() as i32) - (num_clusters as i32);

        // Rata-rata Kuadrat Antar-kelompok (Mean Square Between, MSB), yaitu SSB / df_between.
        let mean_square_between = ssb / (df_between as f64);
        // Rata-rata Kuadrat Dalam-kelompok (Mean Square Within, MSW), yaitu SSW / df_within.
        let mean_square_within = if df_within > 0 { ssw / (df_within as f64) } else { 0.0 };

        /*
         * Statistik F (F-statistic)
         *
         * Rumus: MSB / MSW
         *
         * Tujuan: Menguji apakah ada perbedaan signifikan antara rata-rata cluster.
         * Interpretasi: Nilai F yang besar menunjukkan bahwa variasi antar cluster lebih besar daripada
         * variasi di dalam cluster, yang berarti variabel tersebut efektif dalam membedakan cluster.
         */
        let f_statistic = if mean_square_within > 0.0 {
            mean_square_between / mean_square_within
        } else {
            // Menghindari pembagian dengan nol jika tidak ada varians dalam kelompok.
            f64::MAX
        };

        // Menghitung P-value dari statistik F untuk menentukan signifikansi statistik.
        // P-value < 0.05 umumnya dianggap signifikan secara statistik.
        let p_value = f_test_p_value(f_statistic, df_between, df_within);

        // Menentukan tingkat signifikansi berdasarkan P-value untuk kemudahan interpretasi.
        let significance = if p_value <= 0.001 {
            0.001
        } else if p_value <= 0.01 {
            0.01
        } else if p_value <= 0.05 {
            0.05
        } else {
            // Nilai di atas 0.05 sering dianggap tidak signifikan, di sini diberi batas 0.1.
            0.1
        };

        // Menyimpan hasil perhitungan ANOVA untuk variabel saat ini.
        anova_clusters.insert(var_name.clone(), ANOVACluster {
            mean_square: mean_square_between,
            error_mean_square: mean_square_within,
            df: df_between,
            error_df: df_within,
            f: f_statistic,
            significance,
        });
    }

    // Mengembalikan tabel ANOVA yang lengkap sebagai hasil.
    Ok(ANOVATable {
        clusters: anova_clusters,
        note: Some(
            "The F tests should be used only for descriptive purposes because the clusters have been chosen to maximize the differences among cases in different clusters. The observed significance levels are not corrected for this and thus cannot be interpreted as tests of the hypothesis that the cluster means are equal.".to_string()
        ),
    })
}
