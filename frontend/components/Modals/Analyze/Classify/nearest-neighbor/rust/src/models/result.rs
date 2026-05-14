// result.rs
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NearestNeighborAnalysis {
    pub case_processing_summary: Option<CaseProcessingSummary>,
    pub feature_selection_summary: Option<FeatureSelectionSummary>,
    pub feature_selection_steps: Option<Vec<FeatureSelectionStep>>,
    pub k_feature_selection_summary: Option<Vec<KFeatureSelectionSummary>>,
    pub k_selection_chart: Option<KSelectionChart>,
    pub prediction_results: Option<PredictionResults>,
    pub system_settings: Option<SystemSettings>,
    pub predictor_importance: Option<PredictorImportance>,
    pub classification_table: Option<ClassificationTable>,
    pub error_summary: Option<ErrorSummary>,
    pub predictor_space: Option<PredictorSpace>,
    pub peers_chart: Option<PeersChart>,
    pub nearest_neighbors: Option<NearestNeighbors>,
    pub quadrant_map: Option<QuadrantMap>,
    pub saved_variables: Option<SavedVariables>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FeatureSelectionSummary {
    pub enabled: bool,
    pub method: String,
    pub forced_features: Vec<String>,
    pub candidate_features: Vec<String>,
    pub selected_features: Vec<String>,
    pub removed_features: Vec<String>,
    pub final_error: f64,
    pub stopping_method: String,
    pub stopping_reason: String,
    pub evaluation_strategy: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FeatureSelectionStep {
    pub step_number: usize,
    pub selected_feature: String,
    pub trial_error: f64,
    pub improvement: Option<f64>,
    pub selected_features_after_step: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct KFeatureSelectionSummary {
    pub k: usize,
    pub selected_features: Vec<String>,
    pub error: f64,
    pub stopping_reason: String,
    pub selected: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct KSelectionChart {
    pub candidates: Vec<KSelectionCandidate>,
    pub selected_k: usize,
    pub metric_name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct KSelectionCandidate {
    pub k: usize,
    pub average_error: f64,
    pub selected: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PredictionResults {
    pub rows: Vec<PredictionResultRow>,
    pub target_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PredictionResultRow {
    pub case_id: i32,
    pub row_index: usize,
    pub sample_type: String,
    pub actual: crate::models::data::DataValue,
    pub predicted: crate::models::data::DataValue,
    pub correct: Option<bool>,
    pub probability_predicted_class: Option<f64>,
    pub error: Option<f64>,
    pub squared_error: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CaseProcessingSummary {
    pub training: ProcessingSummaryDetail,
    pub holdout: ProcessingSummaryDetail,
    pub valid: ProcessingSummaryDetail,
    pub excluded: ProcessingSummaryDetail,
    pub total: ProcessingSummaryDetail,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProcessingSummaryDetail {
    pub n: Option<usize>,
    pub percent: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemSettings {
    pub rng: RngSetting,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RngSetting {
    pub keyword: String,
    pub description: String,
    pub setting: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PredictorImportance {
    pub predictors: HashMap<String, f64>,
    pub target: String,
    pub entries: Vec<PredictorImportanceEntry>,
    pub k: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PredictorImportanceEntry {
    pub feature_name: String,
    pub base_error: f64,
    pub error_without_feature: f64,
    pub delta_error: f64,
    pub raw_feature_importance: f64,
    pub normalized_importance: f64,
    pub rank: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClassificationTable {
    pub training: ClassificationPartition,
    pub holdout: ClassificationPartition,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClassificationPartition {
    pub observed: Vec<usize>,
    pub predicted: Vec<usize>,
    pub missing: Vec<usize>,
    pub overall_percent: Vec<f64>,
    pub percent_correct: Vec<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ErrorSummary {
    pub training: f64,
    pub holdout: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PredictorSpace {
    pub model_predictors: usize,
    pub actual_predictors: usize,
    pub target_variable: String,
    pub has_focal_case_identifier: bool,
    pub k_value: usize,
    pub dimensions: Vec<PredictorDimension>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PredictorDimension {
    pub name: String,
    pub points: Vec<DataPoint>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DataPoint {
    pub id: i32,
    pub label: String,
    pub x: f64,
    pub y: f64,
    pub z: f64,
    pub focal: bool,
    pub target_value: bool,
    pub target_label: String,
    pub point_type: String,
    pub neighbors: Vec<NeighborDetail>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NearestNeighbors {
    pub k_value: usize,
    pub distance_metric: String,
    pub weighting_enabled: bool,
    pub prediction_method: Option<String>,
    pub focal_neighbor_sets: Vec<FocalNeighborSet>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PeersChart {
    pub focal_neighbor_sets: Vec<FocalNeighborSet>,
    pub features: HashMap<String, Vec<f64>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QuadrantMap {
    pub focal_neighbor_sets: Vec<FocalNeighborSet>,
    pub features: HashMap<String, Vec<f64>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FocalNeighborSet {
    pub focal_record: i32,
    pub neighbors: Vec<NeighborDetail>,
    pub distances: Vec<f64>,
    pub predicted_value: Option<crate::models::data::DataValue>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NeighborDetail {
    pub id: i32,
    pub distance: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SavedVariables {
    pub variables: Vec<SavedVariable>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SavedVariable {
    pub name: String,
    pub label: String,
    pub variable_type: String,
    pub measure: String,
    pub decimals: i32,
    pub values: Vec<crate::models::data::DataValue>,
}
