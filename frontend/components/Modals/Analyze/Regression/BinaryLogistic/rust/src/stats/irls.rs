use nalgebra::{DMatrix, DVector};
use std::error::Error;
use crate::utils::math::sigmoid;

pub struct IrlsOutput {
    pub beta: DVector<f64>,
    pub covariance_matrix: DMatrix<f64>,
    pub final_log_likelihood: f64,
    pub iterations: usize,
    pub converged: bool,
    pub predictions: DVector<f64>,
}

pub fn fit(
    x: &DMatrix<f64>,
    y: &DVector<f64>,
    max_iter: usize,
    tol: f64
) -> Result<IrlsOutput, Box<dyn Error>> {
    let n_samples = x.nrows();
    let n_features = x.ncols();
    
    // 1. Inisialisasi Beta (biasanya 0)
    let mut beta = DVector::zeros(n_features);
    let mut log_likelihood_old = -f64::INFINITY;
    
    let mut converged = false;
    let mut final_iter = 0;
    let mut final_p = DVector::zeros(n_samples);
    let mut cov_matrix = DMatrix::zeros(n_features, n_features);

    for iter in 0..max_iter {
        // 2. Linear Predictor (XB) & Probabilities (p)
        let xb = x * &beta;
        let p: DVector<f64> = xb.map(sigmoid);
        
        // 3. Weight Matrix (W) diagonal
        // W = p * (1 - p)
        let w_diag: Vec<f64> = p.iter().map(|&pi| pi * (1.0 - pi)).collect();
        // Cegah pembagian dengan nol / singularitas
        let w_safe: Vec<f64> = w_diag.iter().map(|&wi| if wi < 1e-10 { 1e-10 } else { wi }).collect();
        let w = DMatrix::from_diagonal(&DVector::from_vec(w_safe));

        // 4. Gradient (Score Vector) => X^T * (y - p)
        let gradient = x.transpose() * (y - &p);

        // 5. Hessian (Information Matrix) => -X^T * W * X
        // Karena kita butuh inverse dari negative hessian untuk update rule Newton-Raphson:
        // beta_new = beta_old + (X^T W X)^-1 * (X^T(y-p))
        let hessian = x.transpose() * &w * x;

        // 6. Update Beta
        // Menggunakan pseudo-inverse atau regular inverse dengan handling error
        let hessian_inv = hessian.try_inverse().ok_or("Matriks Hessian singular, terjadi multikolinearitas sempurna.")?;
        
        let step = &hessian_inv * &gradient;
        beta = &beta + step;

        // 7. Cek Konvergensi (berdasarkan Log Likelihood)
        let log_likelihood: f64 = y.iter().zip(p.iter())
            .map(|(&yi, &pi)| {
                let pi_safe = pi.clamp(1e-10, 1.0 - 1e-10); // Hindari log(0)
                yi * pi_safe.ln() + (1.0 - yi) * (1.0 - pi_safe).ln()
            }).sum();

        if (log_likelihood - log_likelihood_old).abs() < tol {
            converged = true;
            final_iter = iter + 1;
            final_p = p;
            cov_matrix = hessian_inv; // Variance-Covariance Matrix adalah invers dari Fisher Information
            break;
        }
        log_likelihood_old = log_likelihood;
        final_iter = iter + 1;
        final_p = p;
        cov_matrix = hessian_inv;
    }

    Ok(IrlsOutput {
        beta,
        covariance_matrix: cov_matrix,
        final_log_likelihood: log_likelihood_old,
        iterations: final_iter,
        converged,
        predictions: final_p,
    })
}