use wasm_bindgen::JsValue;
use serde::Serialize;

use crate::hierarchical::models::result::{ CaseProcessingSummary, ClusteringResult, IciclePlot };

pub fn string_to_js_error(error: String) -> JsValue {
    JsValue::from_str(&error)
}

pub fn format_result(result: &Option<ClusteringResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => {
            let formatted = FormatResult::from_clustering_result(result);
            Ok(serde_wasm_bindgen::to_value(&formatted).unwrap())
        }
        None => Err(JsValue::from_str("No clustering results available")),
    }
}

#[derive(Serialize)]
struct FormatResult {
    case_processing_summary: CaseProcessingSummary,
    proximity_matrix: Option<FormattedProximityMatrix>,
    agglomeration_schedule: Option<FormattedAgglomerationSchedule>,
    dendrogram: Option<FormattedDendrogram>,
    icicle_plot: Option<IciclePlot>,
    executed_functions: Vec<String>,
    cluster_memberships: Vec<FormattedClusterMembership>,
}

#[derive(Serialize)]
struct FormattedProximityMatrix {
    distances: Vec<DistanceEntry>,
}

#[derive(Serialize)]
struct DistanceEntry {
    case1: String,
    case2: String,
    distance: f64,
}

#[derive(Serialize)]
struct FormattedAgglomerationSchedule {
    stages: Vec<FormattedAgglomerationStage>,
}

#[derive(Serialize)]
struct FormattedAgglomerationStage {
    stage: usize,
    cluster1: usize,
    cluster2: usize,
    coefficient: f64,
    first_appears1: usize,
    first_appears2: usize,
    next_stage: usize,
}

#[derive(Serialize)]
struct FormattedDendrogram {
    nodes: Vec<FormattedDendrogramNode>,
}

#[derive(Serialize)]
struct FormattedDendrogramNode {
    case: String,
    linkage_distance: f64,
}

#[derive(Serialize)]
struct FormattedClusterMembership {
    num_clusters: usize,
    case_assignments: Vec<CaseAssignment>,
}

#[derive(Serialize)]
struct CaseAssignment {
    case_index: usize,
    cluster: usize,
}

impl FormatResult {
    fn from_clustering_result(result: &ClusteringResult) -> Self {
        let proximity_matrix = result.proximity_matrix.as_ref().map(|matrix| {
            let mut distances = Vec::new();

            for ((case1, case2), distance) in &matrix.distances {
                distances.push(DistanceEntry {
                    case1: case1.clone(),
                    case2: case2.clone(),
                    distance: *distance,
                });
            }

            FormattedProximityMatrix {
                distances,
            }
        });

        let agglomeration_schedule = result.agglomeration_schedule.as_ref().map(|schedule| {
            let stages = schedule.stages
                .iter()
                .map(|stage| {
                    FormattedAgglomerationStage {
                        stage: stage.stage,
                        cluster1: stage.clusters_combined.0,
                        cluster2: stage.clusters_combined.1,
                        coefficient: stage.coefficients,
                        first_appears1: stage.cluster_first_appears.0,
                        first_appears2: stage.cluster_first_appears.1,
                        next_stage: stage.next_stage,
                    }
                })
                .collect();

            FormattedAgglomerationSchedule {
                stages,
            }
        });

        let dendrogram = result.dendrogram.as_ref().map(|dend| {
            let nodes = dend.nodes
                .iter()
                .map(|node| {
                    FormattedDendrogramNode {
                        case: node.case.clone(),
                        linkage_distance: node.linkage_distance,
                    }
                })
                .collect();

            FormattedDendrogram {
                nodes,
            }
        });

        let cluster_memberships = result.cluster_memberships
            .iter()
            .map(|membership| {
                let case_assignments = membership.case_assignments
                    .iter()
                    .enumerate()
                    .map(|(idx, &cluster)| {
                        CaseAssignment {
                            case_index: idx,
                            cluster,
                        }
                    })
                    .collect();

                FormattedClusterMembership {
                    num_clusters: membership.num_clusters,
                    case_assignments,
                }
            })
            .collect();

        FormatResult {
            case_processing_summary: result.case_processing_summary.clone(),
            proximity_matrix,
            agglomeration_schedule,
            dendrogram,
            icicle_plot: result.icicle_plot.clone(),
            executed_functions: result.executed_functions.clone(),
            cluster_memberships,
        }
    }
}
