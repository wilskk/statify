use serde::{ Deserialize, Serialize };
use std::collections::{ HashMap, BTreeMap };

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UnivariateResult {
    pub between_subjects_factors: Option<HashMap<String, BetweenSubjectFactors>>,
    pub descriptive_statistics: Option<HashMap<String, DescriptiveStatistics>>,
    pub levene_test: Option<Vec<LeveneTest>>,
    pub heteroscedasticity_tests: Option<HeteroscedasticityTests>,
    pub tests_of_between_subjects_effects: Option<TestsBetweenSubjectsEffects>,
    pub parameter_estimates: Option<ParameterEstimates>,
    pub general_estimable_function: Option<GeneralEstimableFunction>,
    pub contrast_coefficients: Option<ContrastCoefficients>,
    pub lack_of_fit_tests: Option<LackOfFitTests>,
    pub spread_vs_level_plots: Option<SpreadVsLevelPlots>,
    pub posthoc_tests: Option<HashMap<String, Vec<ParameterEstimateEntry>>>,
    pub emmeans: Option<HashMap<String, Vec<ParameterEstimateEntry>>>,
    pub robust_parameter_estimates: Option<ParameterEstimates>,
    pub plots: Option<HashMap<String, PlotData>>,
    pub saved_variables: Option<SavedVariables>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BetweenSubjectFactors {
    pub factors: BTreeMap<String, usize>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DescriptiveStatistics {
    pub dependent_variable: String,
    pub stats_entries: HashMap<String, StatsEntry>,
    pub factor_names: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StatsEntry {
    pub mean: f64,
    pub std_deviation: f64,
    pub n: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LeveneTest {
    pub dependent_variable: String,
    pub entries: Vec<LeveneTestEntry>,
    pub design: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LeveneTestEntry {
    pub function: String,
    pub levene_statistic: f64,
    pub df1: usize,
    pub df2: f64,
    pub significance: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TestsBetweenSubjectsEffects {
    pub source: HashMap<String, TestEffectEntry>,
    pub r_squared: f64,
    pub adjusted_r_squared: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TestEffectEntry {
    pub sum_of_squares: f64,
    pub df: usize,
    pub mean_square: f64,
    pub f_value: f64,
    pub significance: f64,
    pub partial_eta_squared: f64,
    pub noncent_parameter: f64,
    pub observed_power: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ParameterEstimates {
    pub estimates: Vec<ParameterEstimateEntry>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ParameterEstimateEntry {
    pub parameter: String,
    pub b: f64,
    pub std_error: f64,
    pub t_value: f64,
    pub significance: f64,
    pub confidence_interval: ConfidenceInterval,
    pub partial_eta_squared: f64,
    pub noncent_parameter: f64,
    pub observed_power: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConfidenceInterval {
    pub lower_bound: f64,
    pub upper_bound: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GeneralEstimableFunction {
    pub matrix: Vec<Vec<i32>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContrastCoefficients {
    pub parameter: Vec<String>,
    pub coefficients: Vec<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LackOfFitTests {
    pub sum_of_squares: f64,
    pub df: usize,
    pub mean_square: f64,
    pub f_value: f64,
    pub significance: f64,
    pub partial_eta_squared: f64,
    pub noncent_parameter: f64,
    pub observed_power: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SpreadVsLevelPlots {
    pub points: Vec<SpreadVsLevelPoint>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SpreadVsLevelPoint {
    pub level_mean: f64,
    pub spread_standard_deviation: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HeteroscedasticityTests {
    pub white: Option<WhiteTest>,
    pub breusch_pagan: Option<BPTest>,
    pub modified_breusch_pagan: Option<ModifiedBPTest>,
    pub f_test: Option<FTest>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WhiteTest {
    pub statistic: f64,
    pub df: usize,
    pub p_value: f64,
    pub note: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BPTest {
    pub statistic: f64,
    pub df: usize,
    pub p_value: f64,
    pub note: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModifiedBPTest {
    pub statistic: f64,
    pub df: usize,
    pub p_value: f64,
    pub note: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FTest {
    pub statistic: f64,
    pub df1: usize,
    pub df2: usize,
    pub p_value: f64,
    pub note: Vec<String>,
}

// Añadir estas nuevas estructuras
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlotData {
    pub title: String,
    pub x_label: String,
    pub y_label: String,
    pub series: Vec<PlotSeries>,
    pub y_axis_starts_at_zero: bool,
    pub includes_reference_line: bool,
    pub reference_line: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlotSeries {
    pub name: String,
    pub points: Vec<PlotPoint>,
    pub error_bars: Option<Vec<ConfidenceInterval>>,
    pub series_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlotPoint {
    pub x: f64,
    pub y: f64,
    pub label: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SavedVariables {
    pub predicted_values: Vec<f64>,
    pub weighted_predicted_values: Vec<f64>,
    pub residuals: Vec<f64>,
    pub weighted_residuals: Vec<f64>,
    pub deleted_residuals: Vec<f64>,
    pub standardized_residuals: Vec<f64>,
    pub studentized_residuals: Vec<f64>,
    pub standard_errors: Vec<f64>,
    pub cook_distances: Vec<f64>,
    pub leverages: Vec<f64>,
}
