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
    pub residuals: DVector<f64>,
    pub weights: DVector<f64>,
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
    let mut residuals = DVector::zeros(n);
    let mut weights_diag = DVector::zeros(n);
    let mut converged = false;
    let mut final_iter = 0;

    for iter in 0..max_iter {
        final_iter = iter + 1;

        // 1. Hitung Prediksi (p)
        let xb = x * &beta;
        let mu = xb.map(|z| {
            let prob = 1.0 / (1.0 + (-z).exp());
            // Clipping untuk mencegah log(0)
            if prob < 1e-12 {
                1e-12
            } else if prob > 1.0 - 1e-12 {
                1.0 - 1e-12
            } else {
                prob
            }
        });

        predictions = mu.clone(); // Update predictions for later use

        // 2. Hitung Matriks Bobot (W) dan Variabel Dependen yang Disesuaikan (z)
        let w_diag = mu.map(|pi| pi * (1.0 - pi));
        weights_diag = w_diag.clone();

        // Residuals: (y - mu)
        residuals = y - &mu;

        // Working response: z = X*beta + (y - mu) / (mu*(1-mu))
        // Tapi di IRLS standar sering pakai update step Newton-Raphson:
        // beta_new = beta_old + (X'WX)^-1 X'(y-mu)

        // Hitung Gradient (Score Vector): X' * (y - mu)
        let gradient = x.transpose() * &residuals;

        // Hitung Hessian (Information Matrix): X' * W * X
        // Optimasi: Kalikan setiap kolom X dengan akar bobot, lalu XtX
        let mut xt_w = x.transpose();
        for (col_index, mut col) in xt_w.column_iter_mut().enumerate() {
            col *= w_diag[col_index];
        }
        let hessian = &xt_w * x;

        // Tambahkan Ridge regularization
        let hessian_reg = &hessian + (identity.scale(lambda));

        // 3. Update Beta
        // PERBAIKAN: Gunakan .clone() agar hessian_reg tidak hilang jika Cholesky gagal
        match hessian_reg.clone().cholesky() {
            Some(cholesky) => {
                let delta = cholesky.solve(&gradient);
                beta += delta;
            }
            None => {
                // Fallback ke LU jika Cholesky gagal
                match hessian_reg.lu().solve(&gradient) {
                    Some(delta) => beta += delta,
                    None => return Err("Gagal inversi Hessian (Singular Matrix)".into()),
                }
            }
        }

        // 4. Cek Konvergensi (Log-Likelihood)
        let xb_new = x * &beta;
        let mu_new = xb_new.map(|z| 1.0 / (1.0 + (-z).exp()));
        let log_likelihood: f64 = y
            .iter()
            .zip(mu_new.iter())
            .map(|(&yi, &mui)| {
                // Safety log
                let mui_safe = if mui < 1e-12 {
                    1e-12
                } else if mui > 1.0 - 1e-12 {
                    1.0 - 1e-12
                } else {
                    mui
                };
                yi * mui_safe.ln() + (1.0 - yi) * (1.0 - mui_safe).ln()
            })
            .sum();

        if (log_likelihood - log_likelihood_prev).abs() < tol {
            converged = true;
            log_likelihood_prev = log_likelihood;
            break;
        }
        log_likelihood_prev = log_likelihood;
    }

    // --- FINAL PASS ---
    // Hitung Covariance Matrix (Inverse Hessian)
    let mut xt_w_final = x.transpose();
    for (col_index, mut col) in xt_w_final.column_iter_mut().enumerate() {
        col *= weights_diag[col_index];
    }
    let hessian_final = &xt_w_final * x + (identity.scale(lambda));

    let covariance_matrix = hessian_final
        .try_inverse()
        .unwrap_or_else(|| DMatrix::identity(p, p)); // Fallback jika gagal

    Ok(FittedModel {
        beta,
        covariance_matrix,
        predictions,
        residuals,
        weights: weights_diag,
        final_log_likelihood: log_likelihood_prev,
        iterations: final_iter,
        converged,
    })
}
