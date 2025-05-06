use crate::hierarchical::models::{
    config::ClusterConfig,
    data::AnalysisData,
    result::{ DendrogramTreeNode, IciclePlot },
};

use super::core::{
    build_dendrogram_tree,
    extract_case_label,
    generate_agglomeration_schedule_wrapper,
    generate_cluster_membership,
};

// Traversal in-order untuk mendapatkan urutan kasus yang benar
fn get_case_ordering(node: &DendrogramTreeNode) -> Vec<usize> {
    let mut ordering = Vec::new();

    // Jika ini adalah node daun, kembalikan kasusnya
    if node.left.is_none() && node.right.is_none() {
        return node.cases.clone();
    }

    // Traverse anak kiri
    if let Some(left) = &node.left {
        ordering.extend(get_case_ordering(left));
    }

    // Traverse anak kanan
    if let Some(right) = &node.right {
        ordering.extend(get_case_ordering(right));
    }

    ordering
}

// Fungsi utama untuk menghasilkan icicle plot
pub fn generate_icicle_plot(
    data: &AnalysisData,
    config: &ClusterConfig
) -> Result<IciclePlot, String> {
    // Dapatkan jumlah kasus
    let num_cases = data.cluster_data
        .get(0)
        .map(|d| d.len())
        .unwrap_or(0) as i32;

    // Tentukan parameter plot berdasarkan konfigurasi
    let (start_cluster, stop_cluster, step_by) = if config.plots.all_clusters {
        // Proses semua cluster dari 1 hingga jumlah kasus
        (1, num_cases, 1)
    } else if config.plots.range_clusters {
        // Gunakan rentang yang dikonfigurasi
        let start = config.plots.start_cluster;
        let stop = config.plots.stop_cluster.unwrap_or_else(|| num_cases / 2);
        let step = config.plots.step_by_cluster;
        (start, stop, step)
    } else {
        // Gunakan solusi tunggal
        let cluster = config.plots.start_cluster;
        (cluster, cluster, 1)
    };

    // Tentukan orientasi
    let orientation = if config.plots.vert_orien { "vertical" } else { "horizontal" };

    // Dapatkan jadwal aglomerasi
    let agglomeration = generate_agglomeration_schedule_wrapper(data, config)?;

    // Dapatkan label kasus
    let case_labels = if config.main.cluster_cases {
        (0..num_cases as usize)
            .map(|idx| extract_case_label(data, config, idx))
            .collect::<Vec<String>>()
    } else {
        // Untuk clustering variabel, gunakan nama variabel sebagai label
        config.main.variables
            .as_ref()
            .map(|vars| vars.clone())
            .unwrap_or_else(|| vec![])
    };

    let num_items = case_labels.len();

    // Bangun pohon dendrogram untuk menentukan urutan kasus yang tepat
    let dendrogram_tree = build_dendrogram_tree(&agglomeration, num_items, &case_labels);

    // Dapatkan urutan kasus yang tepat berdasarkan dendrogram
    let ordering = get_case_ordering(&dendrogram_tree);

    // Buat vektor jumlah cluster - ini mewakili jumlah cluster pada setiap level
    let num_clusters: Vec<usize> = (start_cluster..=stop_cluster)
        .step_by(step_by as usize)
        .map(|c| c as usize)
        .collect();

    // Buat matriks untuk melacak kapan setiap kasus bergabung dengan cluster
    // Untuk setiap kasus, tentukan pada level clustering mana kasus tersebut bergabung dengan cluster lain
    let mut cluster_merge_matrix = vec![vec![0; num_items]; num_clusters.len()];

    // Isi matriks - untuk setiap jumlah cluster
    for (level_idx, &num_cluster_count) in num_clusters.iter().enumerate() {
        // Pastikan jumlah cluster valid
        let valid_num_clusters = num_cluster_count.max(1).min(num_items);

        // Hasilkan penugasan cluster untuk jumlah cluster ini
        let assignments = generate_cluster_membership(
            &agglomeration.stages,
            num_items,
            valid_num_clusters
        )?;

        // Untuk setiap kasus dalam urutan kita
        for (pos_idx, &case_idx) in ordering.iter().enumerate() {
            if case_idx < assignments.len() {
                let cluster_id = assignments[case_idx];

                // Temukan kasus lain dalam cluster yang sama
                let mut is_merged = false;
                for other_case_idx in 0..num_items {
                    if
                        other_case_idx != case_idx &&
                        other_case_idx < assignments.len() &&
                        assignments[other_case_idx] == cluster_id
                    {
                        is_merged = true;
                        break;
                    }
                }

                // Jika kasus ini digabungkan dengan yang lain, lacak level di mana kasus bergabung
                if is_merged {
                    cluster_merge_matrix[level_idx][pos_idx] = 1;
                }
            }
        }
    }

    // Konversi matriks ke representasi datar untuk struct IciclePlot
    // Untuk setiap kasus, tentukan level pertama di mana kasus tersebut bergabung
    let mut clusters_flat = Vec::with_capacity(num_items);

    for (pos_idx, &case_idx) in ordering.iter().enumerate() {
        if case_idx < case_labels.len() {
            clusters_flat.push(case_labels[case_idx].clone());

            // Temukan level pertama di mana kasus ini bergabung dengan yang lain
            for level_idx in 0..num_clusters.len() {
                if cluster_merge_matrix[level_idx][pos_idx] == 1 {
                    break;
                }
            }
        }
    }

    Ok(IciclePlot {
        orientation: orientation.to_string(),
        clusters: clusters_flat,
        num_clusters: num_clusters,
        start_cluster,
        stop_cluster,
        step_by,
    })
}
