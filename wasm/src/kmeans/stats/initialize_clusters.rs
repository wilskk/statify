use std::collections::HashMap;

use crate::kmeans::models::{
    config::ClusterConfig,
    result::{ InitialClusterCenters, ProcessedData },
};

use super::core::{
    euclidean_distance,
    find_nearest_cluster,
    find_second_closest_cluster,
    min_distance_between_centers,
    min_distance_from_cluster,
};

pub fn initialize_clusters(
    data: &ProcessedData,
    config: &ClusterConfig
) -> Result<InitialClusterCenters, String> {
    let num_clusters = config.main.cluster as usize;

    if num_clusters == 0 {
        return Err("Number of clusters must be positive".to_string());
    }

    if data.data_matrix.len() < num_clusters {
        return Err(
            format!(
                "Not enough data points ({}) for requested clusters ({})",
                data.data_matrix.len(),
                num_clusters
            )
        );
    }

    let mut initial_centers = Vec::with_capacity(num_clusters);

    // Use first k points as initial centers if specified in config
    if config.main.read_initial {
        initial_centers = data.data_matrix.iter().take(num_clusters).cloned().collect();
    } else {
        // Initialize with first k points
        initial_centers = data.data_matrix.iter().take(num_clusters).cloned().collect();

        // Improve initial centers using a variant of k-means++
        for k in num_clusters..data.data_matrix.len() {
            let x_k = &data.data_matrix[k];

            let (closest, min_dist) = find_nearest_cluster(x_k, &initial_centers);
            let second_closest = find_second_closest_cluster(x_k, &initial_centers, closest);

            let (min_center_dist, m, n) = min_distance_between_centers(&initial_centers);

            if min_dist > min_center_dist {
                if
                    euclidean_distance(x_k, &initial_centers[m]) >
                    euclidean_distance(x_k, &initial_centers[n])
                {
                    initial_centers[m] = x_k.clone();
                } else {
                    initial_centers[n] = x_k.clone();
                }
            } else {
                let dist_to_second = euclidean_distance(x_k, &initial_centers[second_closest]);
                let min_dist_from_closest = min_distance_from_cluster(&initial_centers, closest);

                if dist_to_second > min_dist_from_closest {
                    initial_centers[closest] = x_k.clone();
                }
            }
        }
    }

    // Convert to map format for result
    let mut centers_map = HashMap::new();
    for (i, var) in data.variables.iter().enumerate() {
        let var_values = initial_centers
            .iter()
            .map(|center| center[i])
            .collect();
        centers_map.insert(var.clone(), var_values);
    }

    Ok(InitialClusterCenters { centers: centers_map })
}
