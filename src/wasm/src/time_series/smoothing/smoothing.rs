use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Smoothing {
    data_header: String, // Header data
    data: Vec<f64>,      // Data input
}

#[wasm_bindgen]
impl Smoothing{
    #[wasm_bindgen(constructor)]
    pub fn new(data_header: String, data: Vec<f64>) -> Smoothing {
        Smoothing {
            data_header,
            data,
        }
    }

    // Getter
    pub fn get_data_header(&self) -> String {
        self.data_header.clone()
    }
    pub fn get_data(&self) -> Vec<f64> {
        self.data.clone()
    }

    // Setter
    pub fn set_data_header(&mut self, data_header: String) {
        self.data_header = data_header;
    }
    pub fn set_data(&mut self, data: Vec<f64>) {
        self.data = data;
    }
}