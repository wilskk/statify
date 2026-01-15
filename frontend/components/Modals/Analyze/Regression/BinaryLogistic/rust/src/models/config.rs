use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct AssumptionConfig {
    #[serde(default)]
    pub multicollinearity: bool, // Untuk VIF
    #[serde(default, alias = "boxTidwell")]
    pub box_tidwell: bool, // Untuk Box-Tidwell
}

// --- Enum untuk Metode Kontras ---
#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq)]
pub enum ContrastMethod {
    #[serde(alias = "Indicator")]
    Indicator,
    #[serde(alias = "Simple")]
    Simple,
    #[serde(alias = "Difference")]
    Difference,
    #[serde(alias = "Helmert")]
    Helmert,
    #[serde(alias = "Repeated")]
    Repeated,
    #[serde(alias = "Polynomial")]
    Polynomial,
    #[serde(alias = "Deviation")]
    Deviation,
}

impl Default for ContrastMethod {
    fn default() -> Self {
        Self::Indicator
    }
}

// --- Enum untuk Kategori Referensi ---
#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq)]
pub enum ReferenceCategory {
    #[serde(alias = "First")]
    First,
    #[serde(alias = "Last")]
    Last,
}

impl Default for ReferenceCategory {
    fn default() -> Self {
        Self::Last
    }
}

// --- Konfigurasi per Variabel Kategorik ---
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CategoricalVarConfig {
    #[serde(alias = "columnIndex")]
    pub column_index: usize, // Index kolom pada data mentah

    #[serde(default)]
    pub method: ContrastMethod,

    #[serde(default)]
    pub reference: ReferenceCategory,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq)]
pub enum RegressionMethod {
    #[serde(alias = "Enter")]
    Enter,
    #[serde(alias = "Forward: Conditional", alias = "ForwardConditional")]
    ForwardConditional,
    #[serde(alias = "Forward: LR", alias = "ForwardLR")]
    ForwardLR,
    #[serde(alias = "Forward: Wald", alias = "ForwardWald")]
    ForwardWald,
    #[serde(alias = "Backward: Conditional", alias = "BackwardConditional")]
    BackwardConditional,
    #[serde(alias = "Backward: LR", alias = "BackwardLR")]
    BackwardLR,
    #[serde(alias = "Backward: Wald", alias = "BackwardWald")]
    BackwardWald,
}

impl Default for RegressionMethod {
    fn default() -> Self {
        Self::Enter
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LogisticConfig {
    // --- Data Configuration ---
    #[serde(alias = "dependentIndex")]
    pub dependent_index: usize,

    #[serde(alias = "independentIndices")]
    pub independent_indices: Vec<usize>,

    // --- Daftar Variabel Kategorik ---
    #[serde(alias = "categoricalVariables", default)]
    pub categorical_variables: Vec<CategoricalVarConfig>,

    #[serde(alias = "includeConstant", default = "default_true")]
    pub include_constant: bool,

    #[serde(default = "default_cutoff")]
    pub cutoff: f64,

    // --- Algorithm Settings ---
    #[serde(alias = "maxIterations", default = "default_max_iter")]
    pub max_iterations: usize,

    #[serde(alias = "convergenceThreshold", default = "default_tol")]
    pub convergence_threshold: f64,

    #[serde(alias = "confidenceLevel", default = "default_confidence")]
    pub confidence_level: f64,

    // --- Method Selection ---
    #[serde(default)]
    pub method: RegressionMethod,

    // --- Stepwise Criteria ---
    #[serde(alias = "probEntry", alias = "pEntry", default = "default_p_entry")]
    pub p_entry: f64,

    #[serde(
        alias = "probRemoval",
        alias = "pRemoval",
        default = "default_p_removal"
    )]
    pub p_removal: f64,

    // --- BARU: Output Options ---
    #[serde(default, alias = "classificationPlots")]
    pub classification_plots: bool,

    #[serde(default, alias = "hosmerLemeshow")]
    pub hosmer_lemeshow: bool,

    #[serde(default, alias = "casewiseListing")]
    pub casewise_listing: bool,

    #[serde(default = "default_casewise_outliers", alias = "casewiseOutliers")]
    pub casewise_outliers: f64,

    #[serde(default, alias = "iterationHistory")]
    pub iteration_history: bool,

    #[serde(default)]
    pub correlations: bool,

    // --- Assumptions ---
    #[serde(default)]
    pub assumptions: AssumptionConfig,
}

// ... helper functions ...
fn default_true() -> bool {
    true
}
fn default_cutoff() -> f64 {
    0.5
}
fn default_p_entry() -> f64 {
    0.05
}
fn default_p_removal() -> f64 {
    0.10
}
fn default_max_iter() -> usize {
    20
}
fn default_tol() -> f64 {
    1e-6
}
fn default_confidence() -> f64 {
    0.95
}
// Helper baru untuk casewise outliers
fn default_casewise_outliers() -> f64 {
    2.0
}

impl Default for LogisticConfig {
    fn default() -> Self {
        Self {
            dependent_index: 0,
            independent_indices: Vec::new(),
            categorical_variables: Vec::new(),
            include_constant: true,
            cutoff: 0.5,
            max_iterations: 20,
            convergence_threshold: 1e-6,
            confidence_level: 0.95,
            method: RegressionMethod::Enter,
            p_entry: 0.05,
            p_removal: 0.10,

            // Default untuk field baru
            classification_plots: false,
            hosmer_lemeshow: false,
            casewise_listing: false,
            casewise_outliers: 2.0,
            iteration_history: false,
            correlations: false,

            assumptions: AssumptionConfig::default(),
        }
    }
}
