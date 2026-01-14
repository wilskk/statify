use serde::{Deserialize, Serialize};

// Struktur untuk satu baris hasil VIF
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VifRow {
    pub variable: String,
    pub tolerance: f64, // 1 / VIF
    pub vif: f64,
}

// Struktur untuk satu baris hasil Box-Tidwell
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BoxTidwellRow {
    pub variable: String,         // Nama variabel asli
    pub interaction_term: String, // Nama interaksi (misal: Age * ln(Age))
    pub b: f64,                   // Koefisien
    pub sig: f64,                 // P-value (signifikansi)
    pub is_significant: bool,     // Helper flag (p < 0.05)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CorrelationRow {
    pub variable: String,
    pub values: Vec<f64>, // Nilai korelasi terhadap variabel lain urut index
}

// Wrapper untuk menampung semua hasil uji asumsi
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct AssumptionResult {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vif: Option<Vec<VifRow>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub box_tidwell: Option<Vec<BoxTidwellRow>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub correlation_matrix: Option<Vec<CorrelationRow>>,
}

// --- BARU: Hosmer-Lemeshow Structures ---
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct HosmerLemeshowGroup {
    pub group: usize,
    pub size: usize,
    pub observed_1: usize, // Event terjadi (Y=1)
    pub expected_1: f64,   // Sum of predicted prob
    pub observed_0: usize, // Event tidak terjadi (Y=0)
    pub expected_0: f64,   // Sum of (1 - predicted prob)
    pub total_observed: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct HosmerLemeshowResult {
    pub chi_square: f64,
    pub df: usize,
    pub sig: f64,
    pub contingency_table: Vec<HosmerLemeshowGroup>,
}

// --- Model Summary ---
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ModelSummary {
    pub log_likelihood: f64,
    pub cox_snell_r_square: f64,
    pub nagelkerke_r_square: f64,
    pub converged: bool,
    pub iterations: usize,
}

// --- Classification Table ---
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ClassificationTable {
    pub observed_0_predicted_0: i32, // True Negative
    pub observed_0_predicted_1: i32, // False Positive
    pub percentage_correct_0: f64,

    pub observed_1_predicted_0: i32, // False Negative
    pub observed_1_predicted_1: i32, // True Positive
    pub percentage_correct_1: f64,

    pub overall_percentage: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VariableRow {
    pub label: String,
    pub b: f64,
    pub error: f64,
    pub wald: f64,
    pub df: i32,
    pub sig: f64,
    pub exp_b: f64,
    pub lower_ci: f64,
    pub upper_ci: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VariableNotInEquation {
    pub label: String,
    pub score: f64,
    pub df: i32,
    pub sig: f64,
}

// --- Struktur untuk Model if Term Removed ---
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ModelIfTermRemovedRow {
    pub label: String,
    pub model_log_likelihood: f64, // LL model jika variabel ini dibuang
    pub change_in_neg2ll: f64,     // Selisih -2LL
    pub df: i32,
    pub sig_change: f64, // Signifikansi perubahan
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OmniTests {
    pub chi_square: f64,
    pub df: i32,
    pub sig: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OmnibusResult {
    pub chi_square: f64,
    pub df: i32,
    pub sig: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StepHistory {
    pub step: usize,
    pub action: String,
    pub variable: String,
    pub score_statistic: f64,
    pub improvement_chi_sq: f64,
    pub model_log_likelihood: f64,
    pub nagelkerke_r2: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StepDetail {
    pub step: usize,
    pub action: String, // "Start", "Entered", "Removed"
    pub variable_changed: Option<String>,
    pub summary: ModelSummary,
    pub classification_table: ClassificationTable,
    pub variables_in_equation: Vec<VariableRow>,
    pub variables_not_in_equation: Vec<VariableNotInEquation>,

    // Field untuk Model if Term Removed
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_if_term_removed: Option<Vec<ModelIfTermRemovedRow>>,

    pub remainder_test: Option<RemainderTest>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub omni_tests: Option<OmniTests>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub step_omni_tests: Option<OmniTests>,

    // --- BARU: Hosmer Lemeshow per Step ---
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hosmer_lemeshow: Option<HosmerLemeshowResult>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RemainderTest {
    pub chi_square: f64,
    pub df: i32,
    pub sig: f64,
}

// --- Struktur untuk Output Categorical Variables Codings ---

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FrequencyCount {
    pub category_label: String, // misal: "Male", "Female"
    pub frequency: usize,
    pub parameter_codings: Vec<f64>, // misal: [1.0] atau [0.0]
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CategoricalCoding {
    pub variable_label: String, // misal: "Gender"
    pub categories: Vec<FrequencyCount>,
}

#[derive(Serialize, Deserialize)]
pub struct LogisticResult {
    #[serde(rename = "model_summary")]
    pub summary: ModelSummary,

    pub classification_table: ClassificationTable,

    #[serde(rename = "variables_in_equation")]
    pub variables: Vec<VariableRow>,

    #[serde(rename = "variables_not_in_equation")]
    pub variables_not_in_equation: Vec<VariableNotInEquation>,

    #[serde(
        rename = "overall_remainder_test",
        skip_serializing_if = "Option::is_none"
    )]
    pub overall_remainder_test: Option<RemainderTest>,

    #[serde(rename = "block_0_constant")]
    pub block_0_constant: VariableRow,

    #[serde(
        rename = "block_0_variables_not_in",
        skip_serializing_if = "Option::is_none"
    )]
    pub block_0_variables_not_in: Option<Vec<VariableNotInEquation>>,

    pub omni_tests: OmniTests,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub step_history: Option<Vec<StepHistory>>,

    #[serde(rename = "steps_detail", skip_serializing_if = "Option::is_none")]
    pub steps_detail: Option<Vec<StepDetail>>,

    pub method_used: String,

    #[serde(rename = "assumption_tests", skip_serializing_if = "Option::is_none")]
    pub assumption_tests: Option<AssumptionResult>,

    // --- Field untuk informasi Coding ---
    #[serde(
        rename = "categorical_codings",
        skip_serializing_if = "Option::is_none"
    )]
    pub categorical_codings: Option<Vec<CategoricalCoding>>,

    // --- BARU: Hosmer Lemeshow Final Model ---
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hosmer_lemeshow: Option<HosmerLemeshowResult>,
}
