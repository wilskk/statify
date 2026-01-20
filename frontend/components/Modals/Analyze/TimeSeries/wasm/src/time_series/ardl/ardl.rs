use wasm_bindgen::prelude::*;
#[wasm_bindgen]
pub struct ARDL {
    pub(crate) y: Vec<f64>,
    pub(crate) x_flat: Vec<f64>,  // Flattened 2D array: [x1[0], x1[1], ..., x2[0], x2[1], ...]
    pub(crate) n_vars: usize,     // Number of X variables
    pub(crate) n_obs: usize,      // Number of observations per variable
    pub(crate) p: usize,          // AR order for Y
    pub(crate) q: Vec<usize>,     // DL orders for each X (stored as Vec but passed as flat)
    
    pub(crate) coefficients: Vec<f64>,
    pub(crate) long_run_coef: Vec<f64>,
    pub(crate) bounds_f_stat: f64,
    pub(crate) r_squared: f64,
}
#[wasm_bindgen]
impl ARDL {
    #[wasm_bindgen(constructor)]
    pub fn new(
        y: Vec<f64>, 
        x_flat: Vec<f64>,  // Flattened X matrix
        n_vars: usize,     // Number of X variables
        p: usize,          // AR order
        q_flat: Vec<usize> // DL orders (one per X variable)
    ) -> Result<ARDL, JsValue> {
        let n_obs = y.len();
        
        // Validate dimensions
        if x_flat.len() != n_vars * n_obs {
            return Err(JsValue::from_str(&format!(
                "X dimensions mismatch: expected {} ({}×{}), got {}",
                n_vars * n_obs, n_vars, n_obs, x_flat.len()
            )));
        }
        
        if q_flat.len() != n_vars {
            return Err(JsValue::from_str(&format!(
                "Q length mismatch: expected {} orders for {} variables, got {}",
                n_vars, n_vars, q_flat.len()
            )));
        }
        
        Ok(ARDL {
            y,
            x_flat,
            n_vars,
            n_obs,
            p,
            q: q_flat,
            coefficients: Vec::new(),
            long_run_coef: Vec::new(),
            bounds_f_stat: 0.0,
            r_squared: 0.0,
        })
    }
    
    // Helper: Get X variable i at observation t
    pub fn get_x(&self, var_index: usize, obs_index: usize) -> f64 {
        if var_index >= self.n_vars || obs_index >= self.n_obs {
            return 0.0;
        }
        self.x_flat[var_index * self.n_obs + obs_index]
    }
    
    // Getters
    pub fn get_coefficients(&self) -> Vec<f64> { self.coefficients.clone() }
    pub fn get_long_run_coef(&self) -> Vec<f64> { self.long_run_coef.clone() }
    pub fn get_bounds_f_stat(&self) -> f64 { self.bounds_f_stat }
    pub fn get_r_squared(&self) -> f64 { self.r_squared }
    pub fn get_n_vars(&self) -> usize { self.n_vars }
    pub fn get_n_obs(&self) -> usize { self.n_obs }
}