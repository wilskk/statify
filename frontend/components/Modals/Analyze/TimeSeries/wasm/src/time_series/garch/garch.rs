use wasm_bindgen::prelude::*;
#[wasm_bindgen]
pub struct GARCH {
    pub(crate) data: Vec<f64>,      // Returns
    pub(crate) p: usize,            // GARCH order
    pub(crate) q: usize,            // ARCH order
    omega: f64,          // Constant
    alpha: Vec<f64>,     // ARCH coefficients
    beta: Vec<f64>,      // GARCH coefficients
    variance: Vec<f64>,  // Conditional variance
    aic: f64,
    bic: f64,
    log_likelihood: f64,
}
#[wasm_bindgen]
impl GARCH {
    #[wasm_bindgen(constructor)]
    pub fn new(data: Vec<f64>, p: usize, q: usize) -> GARCH {
        GARCH {
            data,
            p,
            q,
            omega: 0.0,
            alpha: vec![0.0; q],
            beta: vec![0.0; p],
            variance: Vec::new(),
            aic: 0.0,
            bic: 0.0,
            log_likelihood: 0.0,
        }
    }
    // Getters
    pub fn get_data(&self) -> Vec<f64> { self.data.clone() }
    pub fn get_p(&self) -> usize { self.p }
    pub fn get_q(&self) -> usize { self.q }
    pub fn get_omega(&self) -> f64 { self.omega }
    pub fn get_alpha(&self) -> Vec<f64> { self.alpha.clone() }
    pub fn get_beta(&self) -> Vec<f64> { self.beta.clone() }
    pub fn get_variance(&self) -> Vec<f64> { self.variance.clone() }
    pub fn get_aic(&self) -> f64 { self.aic }
    pub fn get_bic(&self) -> f64 { self.bic }
    pub fn get_log_likelihood(&self) -> f64 { self.log_likelihood }
    // Setters
    pub fn set_omega(&mut self, omega: f64) { self.omega = omega; }
    pub fn set_alpha(&mut self, alpha: Vec<f64>) { self.alpha = alpha; }
    pub fn set_beta(&mut self, beta: Vec<f64>) { self.beta = beta; }
    pub fn set_variance(&mut self, variance: Vec<f64>) { self.variance = variance; }
    pub fn set_aic(&mut self, aic: f64) { self.aic = aic; }
    pub fn set_bic(&mut self, bic: f64) { self.bic = bic; }
    pub fn set_log_likelihood(&mut self, ll: f64) { self.log_likelihood = ll; }
}