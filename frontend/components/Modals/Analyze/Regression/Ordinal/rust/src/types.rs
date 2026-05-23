use nalgebra::{DMatrix, DVector};
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PlumFitInput {
    pub payload: OrdinalPlumPayload,
    pub data: Vec<PlumDataRow>,
    pub feature_names: Vec<String>,
    pub scale_feature_names: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PlumDataRow {
    pub y: f64,
    pub x: Vec<f64>,
    pub z: Option<Vec<f64>>,
    pub w: Option<f64>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct OrdinalPlumPayload {
    pub procedure: String,
    pub version: String,
    pub response: ResponseSpec,
    pub model: ModelSpec,
    pub location: LocationSpec,
    pub scale: ScaleSpec,
    pub estimation: Option<EstimationOptionsPayload>,
    pub output: Option<OutputOptions>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ResponseSpec {
    pub variable: String,
    pub ordered_categories: Vec<Category>,
    pub category_count: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ModelSpec {
    pub model_type: String,
    pub link_function: String,
    pub parameter_vector: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LocationSpec {
    pub variables: Vec<String>,
    pub parameter_name: String,
    pub threshold_name: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ScaleSpec {
    pub scale_type: String,
    pub variables: Vec<String>,
    pub parameter_name: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct EstimationOptionsPayload {
    pub method: Option<String>,
    pub max_iterations: Option<usize>,
    pub max_step_halving: Option<usize>,
    pub convergence_tolerance: Option<f64>,
    pub parameter_tolerance: Option<f64>,
    pub gradient_tolerance: Option<f64>,
    pub alpha: Option<f64>,
    pub zero_cell_correction: Option<f64>,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct OutputOptions {
    pub parameter_estimates: Option<bool>,
    pub goodness_of_fit: Option<bool>,
    pub pseudo_r_square: Option<bool>,
    pub test_of_parallel_lines: Option<bool>,
    pub iteration_history: Option<bool>,
    pub cell_information: Option<bool>,
    pub covariance_matrix: Option<bool>,
    pub correlation_matrix: Option<bool>,
    pub predicted_probability: Option<bool>,
    pub actual_probability: Option<bool>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum Category {
    Number(f64),
    Text(String),
}

impl Category {
    pub fn as_label(&self) -> String {
        match self {
            Category::Number(v) => {
                let rounded = if v.fract().abs() < 1e-12 { *v as i64 } else { *v as i64 };
                if (rounded as f64 - *v).abs() < 1e-12 {
                    rounded.to_string()
                } else {
                    v.to_string()
                }
            }
            Category::Text(v) => v.clone(),
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum LinkFunction {
    Logit,
    Probit,
    ComplementaryLogLog,
    NegativeLogLog,
    Cauchit,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ModelType {
    LocationOnly,
    General,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ScaleType {
    Unity,
    NonConstant,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum EstimationMethod {
    FisherScoring,
    NewtonRaphson,
}

#[derive(Clone, Debug)]
pub struct PlumSpec {
    pub response_variable: String,
    pub ordered_categories: Vec<Category>,
    pub category_count: usize,
    pub link_function: LinkFunction,
    pub model_type: ModelType,
    pub scale_type: ScaleType,
    pub feature_names: Vec<String>,
    pub scale_feature_names: Vec<String>,
    pub location_variables: Vec<String>,
    pub scale_variables: Vec<String>,
}

impl PlumSpec {
    pub fn from_input(input: &PlumFitInput) -> Result<Self, PlumError> {
        let link_function = LinkFunction::try_from(input.payload.model.link_function.as_str())?;
        let model_type = ModelType::try_from(input.payload.model.model_type.as_str())?;
        let scale_type = ScaleType::try_from(input.payload.scale.scale_type.as_str())?;

        let feature_names = if input.feature_names.is_empty() {
            input.payload.location.variables.clone()
        } else {
            input.feature_names.clone()
        };

        let scale_feature_names = if let Some(names) = &input.scale_feature_names {
            if names.is_empty() {
                input.payload.scale.variables.clone()
            } else {
                names.clone()
            }
        } else {
            input.payload.scale.variables.clone()
        };

        Ok(Self {
            response_variable: input.payload.response.variable.clone(),
            ordered_categories: input.payload.response.ordered_categories.clone(),
            category_count: input.payload.response.category_count,
            link_function,
            model_type,
            scale_type,
            feature_names,
            scale_feature_names,
            location_variables: input.payload.location.variables.clone(),
            scale_variables: input.payload.scale.variables.clone(),
        })
    }

    pub fn threshold_count(&self) -> usize {
        self.category_count.saturating_sub(1)
    }

    pub fn location_parameter_count(&self) -> usize {
        self.location_variables.len()
    }

    pub fn scale_parameter_count(&self) -> usize {
        if self.scale_type == ScaleType::NonConstant {
            self.scale_variables.len()
        } else {
            0
        }
    }

    pub fn parameter_count(&self) -> usize {
        self.threshold_count() + self.location_parameter_count() + self.scale_parameter_count()
    }

    pub fn category_label(&self, idx: usize) -> String {
        self.ordered_categories
            .get(idx)
            .map(Category::as_label)
            .unwrap_or_else(|| format!("{idx}"))
    }

    pub fn is_location_only(&self) -> bool {
        self.model_type == ModelType::LocationOnly || self.scale_type == ScaleType::Unity
    }

    pub fn as_location_only(&self) -> Self {
        let mut spec = self.clone();
        spec.model_type = ModelType::LocationOnly;
        spec.scale_type = ScaleType::Unity;
        spec.scale_feature_names = Vec::new();
        spec.scale_variables = Vec::new();
        spec
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct PlumValidationResult {
    pub valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

#[derive(Clone, Debug)]
pub struct Subpopulation {
    pub x: Vec<f64>,
    pub z: Vec<f64>,
    pub counts: Vec<f64>,
    pub cumulative_counts: Vec<f64>,
    pub marginal_count: f64,
}

#[derive(Clone, Debug)]
pub struct AggregatedData {
    pub subpopulations: Vec<Subpopulation>,
    pub total_count: f64,
    pub category_count: usize,
    pub ordered_categories: Vec<Category>,
}

#[derive(Clone, Debug, Default)]
pub struct PlumParameters {
    pub theta: Vec<f64>,
    pub beta: Vec<f64>,
    pub tau: Vec<f64>,
}

impl PlumParameters {
    pub fn from_vector(vec: &DVector<f64>, spec: &PlumSpec) -> Self {
        let t = spec.threshold_count();
        let p = spec.location_parameter_count();
        let q = spec.scale_parameter_count();
        let theta = vec.rows(0, t).iter().cloned().collect();
        let beta = vec.rows(t, p).iter().cloned().collect();
        let tau = if q > 0 {
            vec.rows(t + p, q).iter().cloned().collect()
        } else {
            Vec::new()
        };
        Self { theta, beta, tau }
    }

    pub fn to_vector(&self, spec: &PlumSpec) -> DVector<f64> {
        let mut values = Vec::with_capacity(spec.parameter_count());
        values.extend_from_slice(&self.theta);
        values.extend_from_slice(&self.beta);
        values.extend_from_slice(&self.tau);
        DVector::from_vec(values)
    }
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IterationHistoryRow {
    pub iteration: usize,
    pub log_likelihood: f64,
    pub minus2_log_likelihood: f64,
    pub step: f64,
    pub max_abs_gradient: f64,
    pub max_abs_delta: f64,
    pub threshold_adjustments: usize,
}

#[derive(Clone, Debug)]
pub struct IterationState {
    pub log_likelihood: f64,
    pub params: PlumParameters,
    pub gradient: DVector<f64>,
}

#[derive(Clone, Debug)]
pub struct StepResult {
    pub params: PlumParameters,
    pub log_likelihood: f64,
    pub step: f64,
    pub threshold_adjustments: usize,
    pub delta: DVector<f64>,
}

#[derive(Clone, Debug)]
pub struct FitResult {
    pub params: PlumParameters,
    pub information: Option<DMatrix<f64>>,
    pub covariance: Option<DMatrix<f64>>,
    pub correlation: Option<DMatrix<f64>>,
    pub log_likelihood: f64,
    pub minus2_log_likelihood: f64,
    pub converged: bool,
    pub iterations: usize,
    pub iteration_history: Vec<IterationHistoryRow>,
    pub warnings: Vec<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ParameterEstimateRow {
    pub group: String,
    pub variable: String,
    pub estimate: f64,
    pub std_error: Option<f64>,
    pub wald: Option<f64>,
    pub sig: Option<f64>,
    pub lower: Option<f64>,
    pub upper: Option<f64>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FitStat {
    pub chi_square: f64,
    pub df: f64,
    pub sig: Option<f64>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GoodnessOfFit {
    pub pearson: FitStat,
    pub deviance: FitStat,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelSummaryRow {
    pub minus2_log_likelihood: f64,
    pub log_likelihood: f64,
    pub converged: bool,
    pub iterations: usize,
    pub method: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InterceptOnlyRow {
    pub minus2_log_likelihood: f64,
    pub log_likelihood: f64,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelChiSquare {
    pub chi_square: f64,
    pub df: f64,
    pub sig: Option<f64>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PseudoRSquare {
    pub cox_snell: f64,
    pub nagelkerke: f64,
    pub mcfadden: f64,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SummaryStatistics {
    pub model: ModelSummaryRow,
    pub intercept_only: InterceptOnlyRow,
    pub model_chi_square: ModelChiSquare,
    pub pseudo_r_square: PseudoRSquare,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ParallelLinesTest {
    pub minus2_log_likelihood_parallel: f64,
    pub minus2_log_likelihood_non_parallel: f64,
    pub chi_square: f64,
    pub df: f64,
    pub sig: Option<f64>,
    pub converged: bool,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CellInfo {
    pub subpopulation: usize,
    pub category: String,
    pub observed: f64,
    pub predicted: f64,
    pub residual: f64,
    pub standardized_residual: Option<f64>,
    pub x: Vec<f64>,
    pub z: Vec<f64>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProbabilityRow {
    pub subpopulation: usize,
    pub category: String,
    pub probability: f64,
    pub x: Vec<f64>,
    pub z: Vec<f64>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PredictedCategoryRow {
    pub subpopulation: usize,
    pub category: String,
    pub probability: f64,
    pub x: Vec<f64>,
    pub z: Vec<f64>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlumFitOutput {
    pub parameter_estimates: Vec<ParameterEstimateRow>,
    pub goodness_of_fit: Option<GoodnessOfFit>,
    pub summary_statistics: Option<SummaryStatistics>,
    pub test_of_parallel_lines: Option<ParallelLinesTest>,
    pub iteration_history: Option<Vec<IterationHistoryRow>>, 
    pub cell_information: Option<Vec<CellInfo>>,
    pub predicted_category: Option<Vec<PredictedCategoryRow>>,
    pub predicted_probability: Option<Vec<ProbabilityRow>>,
    pub actual_probability: Option<Vec<ProbabilityRow>>,
    pub covariance_matrix: Option<Vec<Vec<f64>>>,
    pub correlation_matrix: Option<Vec<Vec<f64>>>,
    pub log_likelihood: f64,
    pub converged: bool,
    pub iterations: usize,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

#[derive(Clone, Debug)]
pub struct EstimationOptions {
    pub method: EstimationMethod,
    pub max_iterations: usize,
    pub max_step_halving: usize,
    pub convergence_tolerance: f64,
    pub parameter_tolerance: f64,
    pub gradient_tolerance: f64,
    pub alpha: f64,
    pub zero_cell_correction: f64,
}

impl EstimationOptions {
    pub fn from_payload(payload: Option<&EstimationOptionsPayload>) -> Self {
        let mut options = EstimationOptions::default();
        if let Some(payload) = payload {
            if let Some(method) = &payload.method {
                options.method = EstimationMethod::try_from(method.as_str()).unwrap_or(options.method);
            }
            if let Some(value) = payload.max_iterations {
                options.max_iterations = value.max(1);
            }
            if let Some(value) = payload.max_step_halving {
                options.max_step_halving = value.max(1);
            }
            if let Some(value) = payload.convergence_tolerance {
                options.convergence_tolerance = value.max(0.0);
            }
            if let Some(value) = payload.parameter_tolerance {
                options.parameter_tolerance = value.max(0.0);
            }
            if let Some(value) = payload.gradient_tolerance {
                options.gradient_tolerance = value.max(0.0);
            }
            if let Some(value) = payload.alpha {
                options.alpha = value.clamp(0.0, 1.0);
            }
            if let Some(value) = payload.zero_cell_correction {
                options.zero_cell_correction = value.max(0.0);
            }
        }
        options
    }

    pub fn method_label(&self) -> String {
        match self.method {
            EstimationMethod::FisherScoring => "fisher_scoring".to_string(),
            EstimationMethod::NewtonRaphson => "newton_raphson".to_string(),
        }
    }
}

impl Default for EstimationMethod {
    fn default() -> Self {
        EstimationMethod::FisherScoring
    }
}

impl Default for EstimationOptions {
    fn default() -> Self {
        EstimationOptions {
            method: EstimationMethod::FisherScoring,
            max_iterations: 50,
            max_step_halving: 10,
            convergence_tolerance: 1e-6,
            parameter_tolerance: 1e-6,
            gradient_tolerance: 1e-6,
            alpha: 0.05,
            zero_cell_correction: 0.0,
        }
    }
}

impl TryFrom<&str> for LinkFunction {
    type Error = PlumError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        match value {
            "logit" => Ok(LinkFunction::Logit),
            "probit" => Ok(LinkFunction::Probit),
            "cloglog" => Ok(LinkFunction::ComplementaryLogLog),
            "nloglog" => Ok(LinkFunction::NegativeLogLog),
            "cauchit" => Ok(LinkFunction::Cauchit),
            _ => Err(PlumError::InvalidInput(format!(
                "Link function tidak dikenal: {value}"
            ))),
        }
    }
}

impl TryFrom<&str> for ModelType {
    type Error = PlumError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        match value {
            "location_only" => Ok(ModelType::LocationOnly),
            "general" => Ok(ModelType::General),
            _ => Err(PlumError::InvalidInput(format!(
                "Model type tidak dikenal: {value}"
            ))),
        }
    }
}

impl TryFrom<&str> for ScaleType {
    type Error = PlumError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        match value {
            "unity" => Ok(ScaleType::Unity),
            "nonconstant" => Ok(ScaleType::NonConstant),
            _ => Err(PlumError::InvalidInput(format!(
                "Scale type tidak dikenal: {value}"
            ))),
        }
    }
}

impl TryFrom<&str> for EstimationMethod {
    type Error = PlumError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        match value {
            "fisher_scoring" => Ok(EstimationMethod::FisherScoring),
            "newton_raphson" => Ok(EstimationMethod::NewtonRaphson),
            _ => Err(PlumError::InvalidInput(format!(
                "Metode estimasi tidak dikenal: {value}"
            ))),
        }
    }
}

#[derive(Error, Debug)]
pub enum PlumError {
    #[error("Input tidak valid: {0}")]
    InvalidInput(String),
    #[error("Data aggregation gagal: {0}")]
    DataError(String),
    #[error("Optimisasi gagal: {0}")]
    OptimizationError(String),
    #[error("Statistik gagal: {0}")]
    StatisticsError(String),
    #[error("Model error: {0}")]
    ModelError(String),
    #[error("Not implemented: {0}")]
    NotImplemented(String),
}
