// Fungsi Sigmoid yang aman (Numerical Stability)
pub fn sigmoid(z: f64) -> f64 {
    if z > 20.0 {
        1.0
    } else if z < -20.0 {
        0.0
    } else {
        1.0 / (1.0 + (-z).exp())
    }
}