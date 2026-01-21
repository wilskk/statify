use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MultinomialResult {
    pub coefficients: Vec<Vec<f64>>, // [kategori][parameter]
    pub std_errors: Vec<Vec<f64>>,
    pub wald_stats: Vec<Vec<f64>>, // Z-stats atau Wald
    pub p_values: Vec<Vec<f64>>,
    pub exp_beta: Vec<Vec<f64>>, // Odds Ratio
    pub log_likelihood: f64,
    pub null_log_likelihood: f64, // Untuk R-Square
    pub chi_square: f64,          // Model Fitting Information
    pub df: u32,
    pub p_value_model: f64,
    pub iterations: u32,
    pub converged: bool,
    pub pseudo_r_square: PseudoRSquare,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PseudoRSquare {
    pub cox_snell: f64,
    pub nagelkerke: f64,
    pub mcfadden: f64,
}
