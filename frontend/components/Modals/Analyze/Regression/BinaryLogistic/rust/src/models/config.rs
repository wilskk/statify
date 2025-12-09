use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq)]
pub enum RegressionMethod {
    Enter,
    ForwardConditional,
    ForwardWald,
    BackwardLR,
    BackwardConditional,
    BackwardWald,
}

impl Default for RegressionMethod {
    fn default() -> Self {
        Self::Enter
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LogisticConfig {
    // --- Data Configuration ---
    pub include_constant: bool,
    pub cutoff: f64,
    
    // --- Algorithm Settings ---
    pub max_iterations: usize,
    pub convergence_threshold: f64,
    pub confidence_level: f64,

    // --- Method Selection ---
    #[serde(default)] 
    pub method: RegressionMethod,

    // --- Stepwise Criteria (Persiapan) ---
    #[serde(default = "default_p_entry")]
    pub p_entry: f64,
    #[serde(default = "default_p_removal")]
    pub p_removal: f64,
}

fn default_p_entry() -> f64 { 0.05 }
fn default_p_removal() -> f64 { 0.10 }

impl Default for LogisticConfig {
    fn default() -> Self {
        Self {
            include_constant: true,
            cutoff: 0.5,
            max_iterations: 20,
            convergence_threshold: 1e-6,
            confidence_level: 0.95,
            method: RegressionMethod::Enter,
            p_entry: 0.05,
            p_removal: 0.10,
        }
    }
}
