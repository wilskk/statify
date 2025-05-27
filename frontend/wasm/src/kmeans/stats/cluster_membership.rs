use crate::kmeans::models::{ config::ClusterConfig, result::{ ClusterMembership, ProcessedData } };

use super::core::{ convert_map_to_matrix, find_nearest_cluster, generate_final_cluster_centers };

pub fn generate_cluster_membership(
    data: &ProcessedData,
    config: &ClusterConfig
) -> Result<Vec<ClusterMembership>, String> {
    let final_centers_result = generate_final_cluster_centers(data, config)?;
    let final_centers = convert_map_to_matrix(&final_centers_result.centers, &data.variables);

    let membership = data.data_matrix
        .iter()
        .enumerate()
        .map(|(idx, case)| {
            let (cluster, distance) = find_nearest_cluster(case, &final_centers);
            ClusterMembership {
                case_number: data.case_numbers[idx],
                cluster: (cluster + 1) as i32,
                distance,
            }
        })
        .collect();

    Ok(membership)
}
