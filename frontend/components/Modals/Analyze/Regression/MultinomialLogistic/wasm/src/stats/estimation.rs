use crate::models::config::MultinomialConfig;
use crate::models::result::MultinomialResult;
use crate::stats::classification::calculate_classification_table;
use crate::stats::core::PrimaryResults;
use crate::stats::format_results::format_results;
use crate::stats::goodness_of_fit::calculate_goodness_of_fit;
use crate::stats::likelihood_ratio::calculate_likelihood_ratio_tests;
use crate::stats::log_likelihood::{calculate_ll, calculate_null_log_likelihood};
use crate::stats::newton_raphson::run_newton_raphson;
use nalgebra::{DMatrix, DVector};

fn invert_information_matrix(
    info: &DMatrix<f64>,
    singularity: f64,
) -> Result<DMatrix<f64>, String> {
    let n = info.nrows();
    if n == 0 || info.ncols() != n {
        return Err("Matriks informasi tidak valid untuk inversi.".to_string());
    }

    // 1) Symmetrize observed information to reduce floating-point asymmetry.
    let info_sym = (info + info.transpose()) * 0.5;

    // 2) Try stable symmetric decomposition first.
    if let Some(chol) = info_sym.clone().cholesky() {
        return Ok(chol.inverse());
    }

    // 3) Fallback to ordinary inverse.
    if let Some(inv) = info_sym.clone().try_inverse() {
        return Ok(inv);
    }

    // 4) Last resort: SVD generalized inverse with relative SPSS-like cutoff.
    let rel_cutoff = if singularity > 0.0 { singularity } else { 1e-8 };
    let svd = info_sym.clone().svd(true, true);
    let u = svd
        .u
        .ok_or_else(|| "Gagal menghitung SVD (U tidak tersedia).".to_string())?;
    let vt = svd
        .v_t
        .ok_or_else(|| "Gagal menghitung SVD (V^T tidak tersedia).".to_string())?;
    let s = svd.singular_values;
    let s_max = s.iter().copied().fold(0.0_f64, f64::max);

    if !s_max.is_finite() || s_max <= 0.0 {
        return Err("Matriks informasi singular total (nilai singular tidak valid).".to_string());
    }

    let cutoff = rel_cutoff * s_max;
    let mut s_inv = DMatrix::<f64>::zeros(n, n);
    for i in 0..s.len() {
        let sv = s[i];
        if sv > cutoff {
            s_inv[(i, i)] = 1.0 / sv;
        }
    }

    // For SVD: A = U * S * V^T => A^+ = V * S^+ * U^T
    let v = vt.transpose();
    let u_t = u.transpose();
    let inv = v * s_inv * u_t;
    Ok((inv.clone() + inv.transpose()) * 0.5)
}

pub fn estimate_parameters(
    primary: &PrimaryResults,
    config: &MultinomialConfig,
) -> Result<MultinomialResult, String> {
    let X = &primary.design_matrix;
    let n_cases = primary.n_cases;
    let p = primary.n_params;
    let J = primary.n_categories;
    let ref_idx = primary.reference_index;

    // Initialize beta with SPSS initial values
    // beta_j0 = log(p_j / p_ref) where p_j = sum_i n_ij / sum_i n_i
    // All slope coefficients = 0
    let mut beta = DVector::zeros((J - 1) * p);

    // Calculate marginal probabilities for intercept initialization
    let mut n_total = 0.0;
    let mut n_j = vec![0.0f64; J];
    for i in 0..n_cases {
        let weight = primary.weights[i];
        n_total += weight;
        for j in 0..J {
            if (primary.y_categories[i] - primary.category_map[j]).abs() < f64::EPSILON {
                n_j[j] += weight;
                break;
            }
        }
    }

    // Set initial intercepts: beta_j0 = log(p_j / p_ref)
    let p_ref = n_j[ref_idx] / n_total;
    for j in 0..J {
        if j == ref_idx {
            continue;
        }
        let p_j = n_j[j] / n_total;
        let intercept_init = if p_j > 0.0 && p_ref > 0.0 {
            (p_j / p_ref).ln()
        } else {
            0.0
        };
        let j_idx = if j < ref_idx { j } else { j - 1 };
        beta[j_idx * p] = intercept_init;
    }

    // Newton-Raphson dengan step-halving
    let (beta, hessian, iter_count, converged) = run_newton_raphson(X, primary, config, beta)?;

    // Variance-covariance = inverse / generalized inverse of observed information matrix (-H at MLE)
    let information = hessian.map(|x| -x);
    let var_covar = invert_information_matrix(&information, config.singularity)?;

    let current_log_likelihood = calculate_ll(
        X,
        &beta,
        &primary.y_categories,
        &primary.category_map,
        &primary.weights,
        ref_idx,
        p,
    );

    let null_ll = calculate_null_log_likelihood(primary);

    let classification = calculate_classification_table(X, &beta, primary);
    let goodness_of_fit = calculate_goodness_of_fit(X, &beta, primary);
    let lr_tests =
        calculate_likelihood_ratio_tests(X, primary, config, &beta, current_log_likelihood);

    Ok(format_results(
        beta,
        var_covar,
        current_log_likelihood,
        null_ll,
        iter_count,
        converged,
        primary,
        config,
        classification,
        goodness_of_fit,
        lr_tests,
    ))
}
