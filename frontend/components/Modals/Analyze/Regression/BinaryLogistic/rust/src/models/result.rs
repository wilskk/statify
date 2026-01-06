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

// Wrapper untuk menampung semua hasil uji asumsi
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct AssumptionResult {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vif: Option<Vec<VifRow>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub box_tidwell: Option<Vec<BoxTidwellRow>>,
}

// --- Model Summary ---
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ModelSummary {
    pub log_likelihood: f64,
    pub cox_snell_r_square: f64,
    pub nagelkerke_r_square: f64,
    // Field tambahan yang menyebabkan error "missing fields"
    pub converged: bool,
    pub iterations: usize,
}

// --- Classification Table ---
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ClassificationTable {
    // Penamaan harus konsisten dengan yang dipanggil di stats/metrics.rs atau table.rs
    // Error log meminta: observed_0_predicted_0
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

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OmniTests {
    pub chi_square: f64,
    pub df: i32,
    pub sig: f64,
}

// Tambahkan struct ini karena enter.rs mencoba mengimportnya
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

#[derive(Serialize, Deserialize)]
pub struct LogisticResult {
    #[serde(rename = "model_summary")]
    pub summary: ModelSummary,

    pub classification_table: ClassificationTable,

    #[serde(rename = "variables_in_equation")]
    pub variables: Vec<VariableRow>,

    #[serde(rename = "variables_not_in_equation")]
    pub variables_not_in_equation: Vec<VariableNotInEquation>,

    #[serde(rename = "block_0_constant")]
    pub block_0_constant: VariableRow,

    pub omni_tests: OmniTests,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub step_history: Option<Vec<StepHistory>>,

    pub method_used: String,

    #[serde(rename = "assumption_tests", skip_serializing_if = "Option::is_none")]
    pub assumption_tests: Option<AssumptionResult>,
}
