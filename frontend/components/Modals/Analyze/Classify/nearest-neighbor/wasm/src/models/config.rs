use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Clone)]
pub struct MultinomialConfig {
    pub reference_category: String, // "first", "last", atau value tertentu
    pub confidence_interval: f64,   // default 0.95
    pub iterations: u32,            // default 100
    pub convergence: f64,           // default 1e-6
    pub singularity: f64,           // default 1e-8
    pub include_intercept: bool,    // default true
}

#[derive(Deserialize, Serialize)]
pub struct AnalysisData {
    pub dependent: Vec<f64>,        // Data kolom dependen (Y)
    pub independent: Vec<Vec<f64>>, // Matriks kolom independen (X)
    pub weights: Option<Vec<f64>>,  // Bobot jika ada (Weight Cases)
}
