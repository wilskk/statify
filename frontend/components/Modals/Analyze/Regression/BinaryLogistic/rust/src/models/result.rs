use serde::{Deserialize, Serialize};

// Struct untuk Variabel di dalam Model (B, SE, Wald...)
#[derive(Serialize, Deserialize)]
pub struct VariableRow {
    pub label: String,
    pub b: f64,
    pub se: f64,
    pub wald: f64,
    pub df: i32,
    pub sig: f64,
    pub exp_b: f64,
    pub lower_ci: f64,
    pub upper_ci: f64,
}

// Struct untuk Variabel DI LUAR Model (Score Test, df, Sig)
#[derive(Serialize, Deserialize)]
pub struct VariableNotInEquation {
    pub label: String,
    pub score: f64, // Score statistic
    pub df: i32,
    pub sig: f64,
}

#[derive(Serialize, Deserialize)]
pub struct ModelSummary {
    pub log_likelihood: f64,
    #[serde(rename = "cox_snell_r2")]
    pub cox_snell_r_square: f64,
    #[serde(rename = "nagelkerke_r2")]
    pub nagelkerke_r_square: f64,
    pub iterations: usize,
    pub converged: bool,
}

#[derive(Serialize, Deserialize)]
pub struct ClassificationTable {
    pub predicted_0_observed_0: i32,
    pub predicted_1_observed_0: i32,
    pub predicted_0_observed_1: i32,
    pub predicted_1_observed_1: i32,
    pub overall_percentage: f64,
}

#[derive(Serialize, Deserialize)]
pub struct OmniTests {
    pub chi_square: f64,
    pub df: i32,
    pub sig: f64,
}

// Update Root Struct
#[derive(Serialize, Deserialize)]
pub struct LogisticResult {
    #[serde(rename = "model_summary")]
    pub summary: ModelSummary,

    pub classification_table: ClassificationTable,

    #[serde(rename = "variables_in_equation")]
    pub variables: Vec<VariableRow>,

    // Tambahan Baru untuk SPSS Block 0
    #[serde(rename = "variables_not_in_equation")]
    pub variables_not_in_equation: Vec<VariableNotInEquation>,

    #[serde(rename = "block_0_constant")]
    pub block_0_constant: VariableRow, 

    pub omni_tests: OmniTests,
}
