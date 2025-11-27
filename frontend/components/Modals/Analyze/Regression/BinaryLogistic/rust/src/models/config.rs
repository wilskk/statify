use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct LogisticConfig {
    pub max_iterations: usize,
    pub convergence_threshold: f64,
    pub include_constant: bool,
    pub confidence_level: f64,
    pub cutoff: f64, // <-- Tambahkan field ini
}

impl Default for LogisticConfig {
    fn default() -> Self {
        Self {
            max_iterations: 20,
            convergence_threshold: 1e-6,
            include_constant: true,
            confidence_level: 0.95,
            cutoff: 0.5, // <-- Default cutoff
        }
    }
}
