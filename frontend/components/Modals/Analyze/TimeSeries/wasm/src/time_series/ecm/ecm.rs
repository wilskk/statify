use wasm_bindgen::prelude::*;
#[wasm_bindgen]
pub struct ECM {
    pub(crate) y: Vec<f64>,                    // Dependent variable
    pub(crate) x: Vec<f64>,                    // Independent variable
    pub(crate) max_lag_adf: usize,             // Lag for ADF test
    pub(crate) max_lag_ecm: usize,             // Lag for ECM
    
    // Long-run results
    pub(crate) long_run_beta0: f64,
    pub(crate) long_run_beta1: f64,
    pub(crate) long_run_residuals: Vec<f64>,
    
    // Cointegration test
    pub(crate) adf_statistic: f64,
    pub(crate) is_cointegrated: bool,
    
    // ECM results
    pub(crate) ecm_coefficients: Vec<f64>,
    pub(crate) ecm_residuals: Vec<f64>,
    pub(crate) r_squared: f64,
}
#[wasm_bindgen]
impl ECM {
    #[wasm_bindgen(constructor)]
    pub fn new(y: Vec<f64>, x: Vec<f64>, max_lag_adf: usize, max_lag_ecm: usize) -> ECM {
        ECM {
            y,
            x,
            max_lag_adf,
            max_lag_ecm,
            long_run_beta0: 0.0,
            long_run_beta1: 0.0,
            long_run_residuals: Vec::new(),
            adf_statistic: 0.0,
            is_cointegrated: false,
            ecm_coefficients: Vec::new(),
            ecm_residuals: Vec::new(),
            r_squared: 0.0,
        }
    }
    
    // Getters
    pub fn get_long_run_beta0(&self) -> f64 { self.long_run_beta0 }
    pub fn get_long_run_beta1(&self) -> f64 { self.long_run_beta1 }
    pub fn get_adf_statistic(&self) -> f64 { self.adf_statistic }
    pub fn is_cointegrated(&self) -> bool { self.is_cointegrated }
    pub fn get_is_cointegrated(&self) -> bool { self.is_cointegrated }  // Alias for consistency
    pub fn get_ecm_coefficients(&self) -> Vec<f64> { self.ecm_coefficients.clone() }
    pub fn get_r_squared(&self) -> f64 { self.r_squared }
    
    // Setters
    pub fn set_long_run(&mut self, beta0: f64, beta1: f64, residuals: Vec<f64>) {
        self.long_run_beta0 = beta0;
        self.long_run_beta1 = beta1;
        self.long_run_residuals = residuals;
    }
    pub fn set_cointegration(&mut self, adf: f64, is_coint: bool) {
        self.adf_statistic = adf;
        self.is_cointegrated = is_coint;
    }
}