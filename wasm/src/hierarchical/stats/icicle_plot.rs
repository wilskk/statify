use std::collections::HashMap;
use crate::hierarchical::models::{
    config::ClusterConfig,
    data::AnalysisData,
    result::{ DendrogramNode, IciclePlot, Dendrogram },
};

use super::core::{
    extract_case_label,
    generate_agglomeration_schedule_wrapper,
    generate_cluster_membership,
    generate_dendrogram,
};

// Main function to generate the icicle plot
pub fn generate_icicle_plot(
    data: &AnalysisData,
    config: &ClusterConfig
) -> Result<IciclePlot, String> {
    // Get the number of cases
    let num_cases = data.cluster_data
        .get(0)
        .map(|d| d.len())
        .unwrap_or(0) as i32;

    // Determine plot parameters based on configuration
    let (start_cluster, stop_cluster, step_by) = if config.plots.all_clusters {
        // Process all clusters from 1 to number of cases
        (1, num_cases, 1)
    } else if config.plots.range_clusters {
        // Use configured range
        let start = config.plots.start_cluster;
        let stop = config.plots.stop_cluster.unwrap_or_else(|| num_cases / 2);
        let step = config.plots.step_by_cluster;
        (start, stop, step)
    } else {
        // Use single solution
        let cluster = config.plots.start_cluster;
        (cluster, cluster, 1)
    };

    // Determine orientation
    let orientation = if config.plots.vert_orien { "vertical" } else { "horizontal" };

    // First, generate the dendrogram to get the correct case ordering
    let dendrogram = generate_dendrogram(data, config)?;

    // Get the ordered cases from the dendrogram
    let ordered_cases = dendrogram.ordered_cases.clone();
    let num_items = dendrogram.num_items;
    let case_labels = dendrogram.case_labels.clone();

    // Get agglomeration schedule
    let agglomeration = generate_agglomeration_schedule_wrapper(data, config)?;

    // Create vector of cluster numbers - this represents the number of clusters at each level
    let num_clusters: Vec<usize> = (start_cluster..=stop_cluster)
        .step_by(step_by as usize)
        .map(|c| c as usize)
        .collect();

    // Create a matrix to track cluster assignments at each level
    let mut cluster_assignments = Vec::with_capacity(num_clusters.len());

    // Fill the matrix - for each number of clusters level
    for &num_cluster_count in &num_clusters {
        // Ensure valid cluster count
        let valid_num_clusters = num_cluster_count.max(1).min(num_items);

        // Generate cluster assignments for this number of clusters
        let assignments = generate_cluster_membership(
            &agglomeration.stages,
            num_items,
            valid_num_clusters
        )?;

        cluster_assignments.push(assignments);
    }

    // Prepare data for the icicle plot
    // We need: case labels and numbers in dendrogram order, and merge levels
    let mut ordered_case_labels = Vec::with_capacity(num_items);
    let mut ordered_case_numbers = Vec::with_capacity(num_items);
    let mut merge_levels = Vec::with_capacity(num_items);

    // For each case in dendrogram order
    for &case_idx in &ordered_cases {
        if case_idx < case_labels.len() {
            // Add case label and number (1-based)
            ordered_case_labels.push(case_labels[case_idx].clone());
            ordered_case_numbers.push(case_idx + 1); // Convert to 1-based

            // Determine at which level this case first merges with others
            let mut merge_level = None;

            for (level_idx, assignments) in cluster_assignments.iter().enumerate() {
                if case_idx < assignments.len() {
                    let cluster_id = assignments[case_idx];

                    // Check if any other case is in the same cluster
                    let is_merged = (0..num_items).any(
                        |other_idx|
                            other_idx != case_idx &&
                            other_idx < assignments.len() &&
                            assignments[other_idx] == cluster_id
                    );

                    if is_merged {
                        merge_level = Some(level_idx);
                        break;
                    }
                }
            }

            merge_levels.push(merge_level);
        }
    }

    // Create the IciclePlot structure
    Ok(IciclePlot {
        orientation: orientation.to_string(),
        case_labels: ordered_case_labels,
        case_numbers: ordered_case_numbers,
        num_clusters,
        start_cluster,
        stop_cluster,
        step_by,
        cluster_assignments,
        merge_levels,
    })
}

// Utility function to map node positions for icicle plot
pub fn map_node_to_icicle_position(
    dendrogram: &Dendrogram,
    icicle: &IciclePlot
) -> HashMap<usize, (usize, f64)> {
    let mut position_map = HashMap::new();

    // For each case in the ordered sequence
    for (pos, &case_idx) in dendrogram.ordered_cases.iter().enumerate() {
        if case_idx < dendrogram.case_labels.len() {
            // Get the merge level (if any)
            let merge_level = icicle.merge_levels
                .get(pos)
                .and_then(|&level| level)
                .unwrap_or(icicle.num_clusters.len() - 1);

            // Map the case to its position and merge level
            position_map.insert(case_idx, (pos, merge_level as f64));
        }
    }

    position_map
}

// Extract data for icicle plot visualization
pub fn extract_icicle_visualization_data(
    icicle_plot: &IciclePlot
) -> Vec<(String, usize, usize, Option<usize>)> {
    let mut visualization_data = Vec::with_capacity(icicle_plot.case_labels.len());

    // For each case in display order
    for i in 0..icicle_plot.case_labels.len() {
        visualization_data.push((
            icicle_plot.case_labels[i].clone(),
            icicle_plot.case_numbers[i],
            i, // Position in the display order
            icicle_plot.merge_levels[i], // Level at which this case merges
        ));
    }

    visualization_data
}
