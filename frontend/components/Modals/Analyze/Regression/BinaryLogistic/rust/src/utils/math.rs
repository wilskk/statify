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

pub fn clamp_probability(p: f64) -> f64 {
    let epsilon = 1e-15;
    if p < epsilon {
        epsilon
    } else if p > 1.0 - epsilon {
        1.0 - epsilon
    } else {
        p
    }
}
