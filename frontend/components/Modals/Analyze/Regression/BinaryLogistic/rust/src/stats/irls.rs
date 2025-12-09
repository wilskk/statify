use nalgebra::{DMatrix, DVector};
use std::error::Error;

#[derive(Debug, Clone)]
pub struct FittedModel {
    pub beta: DVector<f64>,
    pub covariance_matrix: DMatrix<f64>,
    pub predictions: DVector<f64>,
    pub final_log_likelihood: f64,
    pub iterations: usize,
    pub converged: bool,
}

pub fn fit(
    x: &DMatrix<f64>,
    y: &DVector<f64>,
    max_iter: usize,
    tol: f64,
) -> Result<FittedModel, Box<dyn Error>> {
    let n = x.nrows();
    let p = x.ncols();

    let mut beta = DVector::zeros(p);
    let mut log_likelihood_prev = -f64::INFINITY;

    // Ridge parameter kecil untuk stabilitas inversi matriks
    let lambda = 1e-9;
    let identity = DMatrix::identity(p, p);

    let mut predictions = DVector::from_element(n, 0.5);
    let mut final_cov = DMatrix::identity(p, p);
    let mut converged = false;
    let mut final_iter = 0;

    for iter in 0..max_iter {
        final_iter = iter + 1;

        // 1. Hitung Prediksi (p)
        let xb = x * &beta;
        let mu = xb.map(|z| {
            let prob = 1.0 / (1.0 + (-z).exp());
            // Clamping kuat untuk menghindari log(0)
            if prob < 1e-12 {
                1e-12
            } else if prob > 1.0 - 1e-12 {
                1.0 - 1e-12
            } else {
                prob
            }
        });
        predictions = mu.clone();

        // 2. Hitung W (Diagonal Bobot)
        let w_diag = mu.map(|pi| pi * (1.0 - pi));

        // 3. Gradient (Score Vector U) = X^T * (y - p)
        let residuals = y - &mu;
        let gradient = x.transpose() * &residuals;

        // 4. Hessian (Information Matrix I) = X^T * W * X
        let mut xt_w = x.transpose();
        for (col_index, mut col) in xt_w.column_iter_mut().enumerate() {
            col *= w_diag[col_index];
        }
        let mut hessian = &xt_w * x;

        // Ridge Regularization (mencegah singular matrix)
        hessian += &identity * lambda;

        // 5. Simpan Covariance Matrix (Invers Hessian)
        if let Some(inv_hessian) = hessian.try_inverse() {
            final_cov = inv_hessian.clone();

            // Update Beta: beta = beta + H^-1 * U
            let step = &final_cov * &gradient;
            beta += &step;

            // Cek Log Likelihood
            let log_likelihood: f64 = y
                .iter()
                .zip(mu.iter())
                .map(|(&yi, &mui)| yi * mui.ln() + (1.0 - yi) * (1.0 - mui).ln())
                .sum();

            if (log_likelihood - log_likelihood_prev).abs() < tol {
                converged = true;
                log_likelihood_prev = log_likelihood;
                break;
            }
            log_likelihood_prev = log_likelihood;
        } else {
            return Err("Matriks Singular: Terjadi Multikolinearitas Sempurna.".into());
        }
    }

    // --- FINAL PASS (PENTING) ---
    // Hitung ulang Covariance Matrix dengan Beta Final agar S.E. akurat
    let xb_final = x * &beta;
    let mu_final = xb_final.map(|z| {
        let prob = 1.0 / (1.0 + (-z).exp());
        if prob < 1e-12 {
            1e-12
        } else if prob > 1.0 - 1e-12 {
            1.0 - 1e-12
        } else {
            prob
        }
    });
    let w_diag_final = mu_final.map(|pi| pi * (1.0 - pi));

    let mut xt_w_final = x.transpose();
    for (col_index, mut col) in xt_w_final.column_iter_mut().enumerate() {
        col *= w_diag_final[col_index];
    }
    let mut hessian_final = &xt_w_final * x;
    hessian_final += &identity * lambda; // Tetap pakai ridge

    if let Some(inv_hess_final) = hessian_final.try_inverse() {
        final_cov = inv_hess_final;
    }

    Ok(FittedModel {
        beta,
        covariance_matrix: final_cov,
        predictions: mu_final,
        final_log_likelihood: log_likelihood_prev,
        iterations: final_iter,
        converged,
    })
}
