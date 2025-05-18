pub mod bootstrap;
pub mod core;
pub mod common;
pub mod between_subjects_effects;
pub mod contrast_coefficients;
pub mod descriptive_statistics;
pub mod emmeans;
pub mod generate_plots;
pub mod heteroscedasticity;
pub mod lack_of_fit;
pub mod levene_test;
pub mod parameter_estimates;
pub mod posthoc;
pub mod robust;
pub mod save;
pub mod spread_vs_level;
pub mod summary_processing;

// Re-export commonly used functions and types
pub use common::{
    calculate_mean,
    calculate_variance,
    calculate_std_deviation,
    calculate_f_significance,
    calculate_t_significance,
    calculate_t_critical,
    extract_dependent_value,
    data_value_to_string,
};

// Utility functions for parallel processing
pub use rayon;
pub use statrs;
