use std::collections::HashMap;
use crate::hierarchical::models::{
    config::ClusterConfig,
    data::AnalysisData,
    result::{ AgglomerationSchedule, Dendrogram, DendrogramNode, DendrogramTreeNode },
};

use super::core::{ extract_case_label, generate_agglomeration_schedule_wrapper };

// Membangun pohon dendrogram dari jadwal aglomerasi
pub fn build_dendrogram_tree(
    agglomeration: &AgglomerationSchedule,
    num_items: usize,
    case_labels: &[String]
) -> DendrogramTreeNode {
    // Pertama, buat node daun untuk setiap item asli
    let mut nodes: HashMap<usize, DendrogramTreeNode> = (1..=num_items)
        .map(|i| (
            i,
            DendrogramTreeNode {
                id: i,
                left: None,
                right: None,
                cases: vec![i - 1], // Simpan indeks kasus berbasis 0
                height: 0.0,
                label: if i <= case_labels.len() {
                    Some(case_labels[i - 1].clone())
                } else {
                    None
                },
            },
        ))
        .collect();

    // Lacak ID node berikutnya
    let mut next_id = num_items + 1;

    // Proses setiap tahap aglomerasi
    for stage in &agglomeration.stages {
        let (cluster1_id, cluster2_id) = stage.clusters_combined;

        // Dapatkan dua node yang digabungkan
        if
            let (Some(node1), Some(node2)) = (
                nodes.remove(&cluster1_id),
                nodes.remove(&cluster2_id),
            )
        {
            // Buat node baru yang mewakili gabungan
            let mut merged_cases = node1.cases.clone();
            merged_cases.extend(node2.cases.clone());

            let merged_node = DendrogramTreeNode {
                id: next_id,
                left: Some(Box::new(node1)),
                right: Some(Box::new(node2)),
                cases: merged_cases,
                height: stage.coefficients,
                label: None,
            };

            // Tambahkan node baru ke map
            nodes.insert(next_id, merged_node);
            next_id += 1;
        }
    }

    // Node terakhir yang tersisa adalah root dari dendrogram
    if nodes.len() == 1 {
        nodes.into_values().next().unwrap()
    } else {
        // Ini seharusnya tidak terjadi dengan jadwal aglomerasi yang valid
        DendrogramTreeNode {
            id: 0,
            left: None,
            right: None,
            cases: (0..num_items).collect(),
            height: 0.0,
            label: None,
        }
    }
}

// Konversi struktur pohon ke daftar node datar dengan posisi
fn flatten_dendrogram(
    node: &DendrogramTreeNode,
    pos: f64,
    width: f64,
    case_labels: &[String]
) -> Vec<DendrogramNode> {
    let mut nodes = Vec::new();

    // Jika ini adalah node daun, tambahkan langsung
    if node.left.is_none() && node.right.is_none() {
        if let Some(label) = &node.label {
            nodes.push(DendrogramNode {
                case: label.clone(),
                linkage_distance: node.height,
            });
        } else if !node.cases.is_empty() && node.cases[0] < case_labels.len() {
            nodes.push(DendrogramNode {
                case: case_labels[node.cases[0]].clone(),
                linkage_distance: node.height,
            });
        }
        return nodes;
    }

    // Proses sub-pohon kiri
    let left_width = if let Some(left) = &node.left {
        ((left.cases.len() as f64) / (node.cases.len() as f64)) * width
    } else {
        0.0
    };

    if let Some(left) = &node.left {
        let left_nodes = flatten_dendrogram(left, pos, left_width, case_labels);
        nodes.extend(left_nodes);
    }

    // Proses sub-pohon kanan
    if let Some(right) = &node.right {
        let right_nodes = flatten_dendrogram(
            right,
            pos + left_width,
            width - left_width,
            case_labels
        );
        nodes.extend(right_nodes);
    }

    nodes
}

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

// Fungsi utama untuk menghasilkan dendrogram
pub fn generate_dendrogram(
    data: &AnalysisData,
    config: &ClusterConfig
) -> Result<Dendrogram, String> {
    // Dapatkan jadwal aglomerasi
    let agglomeration = generate_agglomeration_schedule_wrapper(data, config)?;

    // Dapatkan semua label kasus
    let case_labels = if config.main.cluster_cases {
        let case_count = data.cluster_data
            .get(0)
            .map(|d| d.len())
            .unwrap_or(0);

        (0..case_count).map(|idx| extract_case_label(data, config, idx)).collect()
    } else {
        // Untuk clustering variabel, gunakan nama variabel sebagai label
        config.main.variables
            .as_ref()
            .map(|vars| vars.clone())
            .unwrap_or_else(|| vec![])
    };

    // Bangun pohon hierarkis dendrogram
    let dendrogram_tree = build_dendrogram_tree(&agglomeration, case_labels.len(), &case_labels);

    // Dapatkan urutan kasus yang tepat berdasarkan dendrogram
    let ordering = get_case_ordering(&dendrogram_tree);

    // Buat DendrogramNodes untuk setiap kasus dalam urutan yang benar
    let mut nodes = Vec::with_capacity(case_labels.len());

    // Temukan jarak linkage maksimum untuk normalisasi
    let max_height = agglomeration.stages
        .last()
        .map(|stage| stage.coefficients)
        .unwrap_or(1.0);

    // Buat node untuk semua kasus dengan jarak linkage
    for &case_idx in &ordering {
        if case_idx < case_labels.len() {
            // Temukan tahap di mana kasus ini digabungkan
            let mut linkage_distance = 0.0;

            for stage in &agglomeration.stages {
                let (cluster1, cluster2) = stage.clusters_combined;

                // Jika kasus ini adalah bagian dari cluster, perbarui jarak linkage
                if cluster1 == case_idx + 1 || cluster2 == case_idx + 1 {
                    linkage_distance = stage.coefficients;
                    break;
                }
            }

            // Normalisasi jarak linkage jika diperlukan
            if max_height > 0.0 {
                linkage_distance = linkage_distance / max_height;
            }

            nodes.push(DendrogramNode {
                case: case_labels[case_idx].clone(),
                linkage_distance,
            });
        }
    }

    Ok(Dendrogram { nodes })
}
