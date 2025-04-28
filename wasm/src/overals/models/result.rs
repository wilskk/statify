use serde::{ Deserialize, Serialize };
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OVERALSAnalysisResult {
    pub case_processing_summary: CaseProcessingSummary,
    pub variables: Vec<VariableInfo>,
    pub centroids: Vec<CentroidsResult>,
    pub iteration_history: IterationHistory,
    pub summary_analysis: SummaryAnalysis,
    pub weights: Weights,
    pub component_loadings: ComponentLoadings,
    pub fit_measures: FitMeasures,
    pub object_scores: ObjectScores,
    pub transformation_plots: TransformationPlots,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CaseProcessingSummary {
    pub cases_used_in_analysis: usize,
    pub total_cases: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VariableInfo {
    pub set: String,
    pub variable_name: Vec<String>,
    pub num_categories: Vec<usize>,
    pub optimal_scaling_level: Vec<ScalingLevel>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ScalingLevel {
    Ordinal,
    Nominal,
    Single,
    Multiple,
    Discrete,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CentroidsResult {
    pub set: String,
    pub variable_name: String,
    pub centroids: HashMap<String, Vec<CentroidCategory>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CentroidCategory {
    pub marginal_frequency: usize,
    pub projected_centroids: Coordinates,
    pub category_centroids: Coordinates,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Coordinates {
    pub dimension: Vec<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ObjectScores {
    pub scores: HashMap<String, Dimensions>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ComponentLoadings {
    pub set: HashMap<String, Variable>,
    pub loadings: HashMap<String, Dimensions>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Dimensions {
    pub dimensions: Vec<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Weights {
    pub set: HashMap<String, Variable>,
    pub weights: HashMap<String, Dimensions>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Variable {
    pub variable_name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FitMeasures {
    pub set: HashMap<String, Variable>,
    pub multiple_fit: HashMap<String, FitDimensions>,
    pub single_fit: HashMap<String, FitDimensions>,
    pub single_loss: HashMap<String, FitDimensions>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FitDimensions {
    pub dimension: Vec<f64>,
    pub sum: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TransformationPlots {
    pub transformations: HashMap<String, Vec<TransformationPoint>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TransformationPoint {
    pub category: usize,
    pub quantification: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IterationHistory {
    pub iterations: Vec<IterationStep>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IterationStep {
    pub loss: f64,
    pub fit: f64,
    pub difference_from_previous: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SummaryAnalysis {
    pub loss: HashMap<String, f64>,
    pub eigenvalue: HashMap<String, f64>,
    pub fit: HashMap<String, f64>,
}
