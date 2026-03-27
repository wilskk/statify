use serde::{Deserialize, Serialize};

fn default_pconverge() -> f64 {
    1e-6 // SPSS NOMREG default PCONVERGE = 1e-6
}
fn default_lconverge() -> f64 {
    0.0 // SPSS NOMREG default LCONVERGE = 0 (disabled)
}
fn default_iterations() -> u32 {
    100 // SPSS NOMREG default MXITER = 100
}

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct MultinomialConfig {
    pub reference_category: String,
    pub confidence_interval: f64,
    #[serde(default = "default_iterations")]
    pub iterations: u32,
    pub tolerance: f64,
    /// SPSS PCONVERGE: max absolute parameter change threshold (default 1e-6)
    #[serde(default = "default_pconverge")]
    pub pconverge: f64,
    /// SPSS LCONVERGE: log-likelihood change threshold (default 0.0 = disabled)
    #[serde(default = "default_lconverge")]
    pub lconverge: f64,
    pub include_intercept: bool,
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisData {
    pub dependent: Vec<f64>,
    pub independent: Vec<Vec<f64>>,
    // Option::unwrap_or digunakan nanti jika null
    pub weights: Option<Vec<f64>>,
    pub variable_names: Option<Vec<String>>,
}
