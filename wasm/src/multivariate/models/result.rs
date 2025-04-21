use serde::{ Deserialize, Serialize };
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UnivariateResult {
    pub between_subjects_factors: Option<HashMap<String, BetweenSubjectFactors>>,
    pub descriptive_statistics: Option<HashMap<String, DescriptiveStatistics>>,
    pub levene_test: Option<Vec<LeveneTest>>,
    pub tests_of_between_subjects_effects: Option<TestsBetweenSubjectsEffects>,
    pub parameter_estimates: Option<ParameterEstimates>,
    pub general_estimable_function: Option<GeneralEstimableFunction>,
    pub contrast_coefficients: Option<ContrastCoefficients>,
    pub lack_of_fit_tests: Option<LackOfFitTests>,
    pub spread_vs_level_plots: Option<HashMap<String, SpreadVsLevelPlots>>,
    pub posthoc_tests: Option<HashMap<String, Vec<PostHocTest>>>,
    pub emmeans: Option<HashMap<String, Vec<EstimatedMarginalMean>>>,
    pub robust_parameter_estimates: Option<ParameterEstimates>,
    pub plots: Option<HashMap<String, PlotData>>,
    pub saved_variables: Option<SavedVariables>,
    pub executed_functions: Vec<String>,
    pub box_test: Option<BoxTest>,
    pub bartlett_test: Option<BartlettTest>,
    pub multivariate_tests: Option<MultivariateTests>,
    pub residual_matrix: Option<ResidualMatrix>,
    pub sscp_matrix: Option<SSCPMatrix>,
    pub univariate_tests: Option<UnivariateTests>,
    pub homogeneous_subsets: Option<HashMap<String, HomogeneousSubsets>>,
    pub scatter_plot_matrices: Option<HashMap<String, ScatterPlotMatrix>>,
    pub profile_plots: Option<HashMap<String, PlotData>>,
    pub factor_variables: Option<Vec<String>>,
    pub dependent_variables: Option<Vec<String>>,
    pub model_formula: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BetweenSubjectFactors {
    pub value_counts: HashMap<String, usize>,
    pub n: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DescriptiveStatistics {
    pub dependent_variable: String,
    pub groups: Vec<StatGroup>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StatGroup {
    pub factor_name: String,
    pub factor_value: String,
    pub stats: StatsEntry,
    pub subgroups: Option<Vec<StatGroup>>,
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
    pub levene_statistic: f64,
    pub df1: usize,
    pub df2: usize,
    pub significance: f64,
    pub function: Option<String>,
    pub design: Option<String>,
    pub test_basis: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TestsBetweenSubjectsEffects {
    pub effects: HashMap<String, HashMap<String, TestEffectEntry>>,
    pub r_squared: HashMap<String, f64>,
    pub adjusted_r_squared: HashMap<String, f64>,
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
    pub estimates: HashMap<String, Vec<ParameterEstimateEntry>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ParameterEstimateEntry {
    pub parameter: String,
    pub b: f64,
    pub std_error: f64,
    pub t_value: f64,
    pub significance: f64,
    pub confidence_interval: ConfidenceInterval,
    pub partial_eta_squared: Option<f64>,
    pub noncent_parameter: Option<f64>,
    pub observed_power: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConfidenceInterval {
    pub lower_bound: f64,
    pub upper_bound: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GeneralEstimableFunction {
    pub matrix: HashMap<String, HashMap<String, i32>>,
    pub design: Option<String>,
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
    pub breusch_pagan: Option<BPTest>,
    pub white: Option<WhiteTest>,
    pub modified_breusch_pagan: Option<ModifiedBPTest>,
    pub f_test: Option<FTest>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BPTest {
    pub statistic: f64,
    pub df: usize,
    pub p_value: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WhiteTest {
    pub statistic: f64,
    pub df: usize,
    pub p_value: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModifiedBPTest {
    pub statistic: f64,
    pub df: usize,
    pub p_value: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FTest {
    pub statistic: f64,
    pub df1: usize,
    pub df2: usize,
    pub p_value: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlotData {
    pub title: String,
    pub x_label: String,
    pub y_label: String,
    pub series: Vec<PlotSeries>,
    pub y_axis_starts_at_zero: bool,
    pub includes_reference_line: bool,
    pub reference_line: Option<f64>,
    pub dependent_variable: Option<String>,
    pub plot_type: Option<String>,
    pub groups_label: Option<String>,
    pub model: Option<String>,
    pub error_bars: Option<String>,
    pub legend: Option<Vec<LegendItem>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlotSeries {
    pub name: String,
    pub points: Vec<PlotPoint>,
    pub error_bars: Option<Vec<ConfidenceInterval>>,
    pub series_type: String,
    pub color: Option<String>,
    pub line_style: Option<String>,
    pub marker_style: Option<String>,
    pub is_reference_line: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlotPoint {
    pub x: f64,
    pub y: f64,
    pub label: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SavedVariables {
    pub variable_values: HashMap<String, Vec<f64>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LegendItem {
    pub label: String,
    pub color: Option<String>,
    pub line_style: Option<String>,
    pub marker_style: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScatterPlotMatrix {
    pub dependent_variable: String,
    pub plot_type: String,
    pub model: String,
    pub matrix_dimensions: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BoxTest {
    pub box_m: f64,
    pub f: f64,
    pub df1: usize,
    pub df2: f64,
    pub significance: f64,
    pub design: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BartlettTest {
    pub likelihood_ratio: f64,
    pub approx_chi_square: f64,
    pub df: usize,
    pub significance: f64,
    pub description: Option<String>,
    pub design: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MultivariateTests {
    pub effects: HashMap<String, HashMap<String, MultivariateTestEntry>>,
    pub design: Option<String>,
    pub alpha: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MultivariateTestEntry {
    pub value: f64,
    pub f: f64,
    pub hypothesis_df: f64,
    pub error_df: f64,
    pub significance: f64,
    pub partial_eta_squared: f64,
    pub noncent_parameter: f64,
    pub observed_power: f64,
    pub is_exact_statistic: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ResidualMatrix {
    pub matrix_type: String,
    pub values: HashMap<String, HashMap<String, f64>>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SSCPMatrix {
    pub matrix_type: String,
    pub categories: HashMap<String, HashMap<String, HashMap<String, f64>>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UnivariateTests {
    pub tests: HashMap<String, Vec<UnivariateTestEntry>>,
    pub alpha: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UnivariateTestEntry {
    pub source: String,
    pub sum_of_squares: f64,
    pub df: usize,
    pub mean_square: Option<f64>,
    pub f: Option<f64>,
    pub significance: Option<f64>,
    pub partial_eta_squared: Option<f64>,
    pub noncent_parameter: Option<f64>,
    pub observed_power: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PostHocTest {
    pub dependent_variable: String,
    pub test_type: String,
    pub factor_name: String,
    pub i_level: String,
    pub j_level: String,
    pub mean_difference: f64,
    pub std_error: f64,
    pub significance: f64,
    pub confidence_interval: ConfidenceInterval,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EstimatedMarginalMean {
    pub dependent_variable: String,
    pub factor_name: String,
    pub factor_value: String,
    pub mean: f64,
    pub std_error: f64,
    pub confidence_interval: ConfidenceInterval,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HomogeneousSubsets {
    pub test_name: String,
    pub groups: Vec<HomogeneousSubsetGroup>,
    pub error_term: String,
    pub error_value: f64,
    pub uses_harmonic_mean: bool,
    pub harmonic_mean_sample_size: Option<f64>,
    pub notes: Vec<String>,
    pub alpha: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HomogeneousSubsetGroup {
    pub factor_name: String,
    pub factor_value: String,
    pub n: usize,
    pub subsets: HashMap<usize, f64>,
    pub significance: Option<f64>,
}
