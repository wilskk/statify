use serde::{ Deserialize, Serialize };
use std::collections::{ HashMap, BTreeMap };
use nalgebra::{ DMatrix, DVector };

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
    pub posthoc_tests: Option<PostHoc>,
    pub emmeans: Option<EMMeansResult>,
    pub robust_parameter_estimates: Option<RobustParameterEstimates>,
    pub plots: Option<HashMap<String, PlotData>>,
    pub saved_variables: Option<SavedVariables>,
}

#[derive(Debug, Clone)]
pub struct DesignMatrixInfo {
    pub x: DMatrix<f64>,
    pub y: DVector<f64>,
    pub w: Option<DVector<f64>>,
    pub n_samples: usize,
    pub p_parameters: usize,
    pub r_x_rank: usize,
    pub term_column_indices: HashMap<String, (usize, usize)>,
    pub intercept_column: Option<usize>,
    pub term_names: Vec<String>,
    pub case_indices_to_keep: Vec<usize>,
}

#[derive(Debug, Clone)]
pub struct SweptMatrixInfo {
    /// G: p×p symmetric g₂ general inverse of X'WX (after negation of swept result)
    pub g_inv: DMatrix<f64>,
    /// B̂: p×r matrix of parameter estimates
    pub beta_hat: DVector<f64>,
    /// S: symmetric r×r matrix of residual sums of squares and cross-products
    pub s_rss: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BetweenSubjectFactors {
    pub factors: BTreeMap<String, usize>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DescriptiveStatistics {
    pub dependent_variable: String,
    pub groups: Vec<DescriptiveStatGroup>,
    pub factor_names: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DescriptiveStatGroup {
    pub factor_name: String,
    pub factor_value: String,
    pub stats: StatsEntry,
    pub subgroups: Vec<DescriptiveStatGroup>,
    pub is_total: bool,
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
    pub notes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
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

impl TestEffectEntry {
    pub fn empty_effect(df: usize) -> Self {
        TestEffectEntry {
            sum_of_squares: 0.0,
            df,
            mean_square: 0.0,
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: 0.0,
            noncent_parameter: 0.0,
            observed_power: 0.0,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EMMeansResult {
    pub parameter_names: Vec<String>,
    pub contrast_coefficients: Vec<ContrastCoefficientsEntry>,
    pub em_estimates: Vec<EMMeansEstimates>,
    pub pairwise_comparisons: Option<Vec<PairwiseComparisons>>,
    pub univariate_tests: Option<Vec<UnivariateTests>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EMMeansEstimates {
    pub entries: Vec<EMMeansEstimatesEntry>,
    pub notes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EMMeansEstimatesEntry {
    pub levels: Vec<String>,
    pub mean: Vec<f64>,
    pub standard_error: Vec<f64>,
    pub confidence_interval: Vec<ConfidenceInterval>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PostHoc {
    pub factor_names: Vec<String>,
    pub comparison: Vec<PostHocComparison>,
    pub homogoneous: Vec<PostHocHomogoneous>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PostHocComparison {
    pub entries: Vec<PostHocComparisonEntry>,
    pub notes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PostHocComparisonEntry {
    pub method: String,
    pub parameter: Vec<String>,
    pub mean_difference: Vec<f64>,
    pub standard_error: Vec<f64>,
    pub significance: Vec<f64>,
    pub confidence_interval: Vec<ConfidenceInterval>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PostHocHomogoneous {
    pub entries: Vec<PostHocHomogoneousEntry>,
    pub notes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PostHocHomogoneousEntry {
    pub method: String,
    pub parameter: Vec<String>,
    pub mean_difference: Vec<f64>,
    pub n: Vec<usize>,
    pub subsets: Vec<Subset>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Subset {
    pub subset: Vec<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PairwiseComparisons {
    pub entries: Vec<PairwiseComparisonsEntry>,
    pub notes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PairwiseComparisonsEntry {
    pub parameter: Vec<String>,
    pub mean_difference: Vec<f64>,
    pub standard_error: Vec<f64>,
    pub significance: Vec<f64>,
    pub confidence_interval: Vec<ConfidenceInterval>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UnivariateTests {
    pub entries: Vec<UnivariateTestsEntry>,
    pub notes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UnivariateTestsEntry {
    pub source: String,
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
    pub notes: Vec<String>,
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
    pub is_redundant: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RobustParameterEstimates {
    pub estimates: Vec<RobustParameterEstimateEntry>,
    pub notes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RobustParameterEstimateEntry {
    pub parameter: String,
    pub b: f64,
    pub robust_std_error: f64,
    pub t_value: f64,
    pub significance: f64,
    pub confidence_interval: ConfidenceInterval,
    pub is_redundant: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConfidenceInterval {
    pub lower_bound: f64,
    pub upper_bound: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GeneralEstimableFunction {
    pub estimable_function: GeneralEstimableFunctionEntry,
    pub notes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GeneralEstimableFunctionEntry {
    pub parameter: Vec<String>,
    pub l_label: Vec<String>,
    pub l_matrix: Vec<Vec<i32>>,
    pub contrast_information: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContrastCoefficients {
    pub information: Vec<ContrastInformation>,
    pub factor_names: Vec<String>,
    pub contrast_coefficients: Vec<ContrastCoefficientsEntry>,
    pub contrast_result: Vec<ContrastResult>,
    pub contrast_test_result: Vec<ContrastTestResult>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContrastInformation {
    pub contrast_name: String,
    pub transformation_coef: String,
    pub contrast_result: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContrastCoefficientsEntry {
    pub parameter: Vec<String>,
    pub l_label: Vec<String>,
    pub l_matrix: Vec<Vec<f64>>,
    pub contrast_information: Vec<String>,
    pub notes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContrastResult {
    pub parameter: Vec<String>,
    pub contrast_result: Vec<ContrastResultEntry>,
    pub notes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContrastResultEntry {
    pub contrast_estimate: f64,
    pub hypothesized_value: f64,
    pub difference: f64,
    pub standard_error: f64,
    pub significance: f64,
    pub confidence_interval: ConfidenceInterval,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContrastTestResult {
    pub source: Vec<String>,
    pub contrast_result: Vec<ContrastTestResultEntry>,
    pub notes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContrastTestResultEntry {
    pub source: String,
    pub sum_of_squares: f64,
    pub df: usize,
    pub mean_square: f64,
    pub f_value: f64,
    pub significance: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LackOfFitTests {
    pub lack_of_fit: LackOfFitTestsEntries,
    pub pure_error: LackOfFitTestsEntries,
    pub notes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LackOfFitTestsEntries {
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
