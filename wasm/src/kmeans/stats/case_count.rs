use crate::kmeans::models::{ config::ClusterConfig, result::{ CaseCountTable, ProcessedData } };

use super::core::generate_cluster_membership;

pub fn generate_case_count(
    data: &ProcessedData,
    config: &ClusterConfig
) -> Result<CaseCountTable, String> {
    let num_clusters = config.main.cluster as usize;
    let membership = generate_cluster_membership(data, config)?;

    let counts = (1..=num_clusters)
        .map(|i| {
            let count = membership
                .iter()
                .filter(|m| m.cluster == (i as i32))
                .count();

            (i.to_string(), count)
        })
        .collect();

    Ok(CaseCountTable {
        valid: membership.len(),
        missing: 0,
        clusters: counts,
    })
}
