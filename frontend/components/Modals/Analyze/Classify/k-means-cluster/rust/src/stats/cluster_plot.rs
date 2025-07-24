use crate::models::{ config::KMeansConfig, result::{ ClusterPlot, ProcessedData } };

use crate::stats::core::*;

pub fn create_cluster_plot(
    data: &ProcessedData,
    config: &KMeansConfig
) -> Result<ClusterPlot, String> {
    if data.variables.len() < 2 {
        return Err("Data must have at least 2 variables to create a plot.".to_string());
    }

    let final_centers_result = generate_final_cluster_centers(data, config)?;
    let centers_matrix = convert_map_to_matrix(&final_centers_result.centers, &data.variables);

    let x_variable = data.variables[0].clone();
    let y_variable = data.variables[1].clone();
    let x_col_index = 0;
    let y_col_index = 1;

    let mut x_coords: Vec<f64> = Vec::with_capacity(data.data_matrix.len() + centers_matrix.len());
    let mut y_coords: Vec<f64> = Vec::with_capacity(data.data_matrix.len() + centers_matrix.len());
    let mut clusters: Vec<i32> = Vec::with_capacity(data.data_matrix.len() + centers_matrix.len());
    let mut is_center: Vec<bool> = Vec::with_capacity(
        data.data_matrix.len() + centers_matrix.len()
    );

    for case in &data.data_matrix {
        x_coords.push(case[x_col_index]);
        y_coords.push(case[y_col_index]);
        let (cluster_index, _) = find_nearest_cluster(case, &centers_matrix);
        clusters.push((cluster_index + 1) as i32); // 1-based index
        is_center.push(false);
    }

    for (i, center) in centers_matrix.iter().enumerate() {
        x_coords.push(center[x_col_index]);
        y_coords.push(center[y_col_index]);
        clusters.push((i + 1) as i32); // 1-based index
        is_center.push(true);
    }

    let mut cluster_labels: Vec<String> = Vec::with_capacity(clusters.len());
    let num_points = data.data_matrix.len();

    if let Some(case_names) = &data.case_names {
        cluster_labels.extend(case_names.iter().cloned());
    } else {
        for i in 0..num_points {
            cluster_labels.push(format!("Cluster {}", clusters[i]));
        }
    }

    for i in 0..centers_matrix.len() {
        cluster_labels.push(format!("Center {}", clusters[num_points + i]));
    }

    Ok(ClusterPlot {
        x: x_coords,
        x_label: x_variable,
        y: y_coords,
        y_label: y_variable,
        cluster: clusters,
        cluster_label: cluster_labels,
        cluster_center: is_center,
        note: None,
        interpretation: Some(
            "This plot visualizes the clusters using the first two variables as axes. Each point represents a case, colored by its assigned cluster. The larger points mark the final cluster centers. This visualization helps to assess the separation and cohesion of the formed clusters.".to_string()
        ),
    })
}
