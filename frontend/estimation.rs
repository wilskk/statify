use crate::models::config::MultinomialConfig;
use crate::models::result::MultinomialResult;
use crate::stats::classification::calculate_classification_table;
use crate::stats::core::PrimaryResults;
use crate::stats::format_results::format_results;
use crate::stats::goodness_of_fit::calculate_goodness_of_fit;
use crate::stats::likelihood_ratio::calculate_likelihood_ratio_tests;
use crate::stats::log_likelihood::{calculate_ll, calculate_null_log_likelihood};
use crate::stats::newton_raphson::run_newton_raphson;
use nalgebra::DVector;

pub fn estimate_parameters(
    primary: &PrimaryResults,
    config: &MultinomialConfig,
) -> Result<MultinomialResult, String> {
    let X = &primary.design_matrix;
    let n_cases = primary.n_cases;
    let p = primary.n_params;
    let J = primary.n_categories;
    let ref_idx = primary.reference_index;

    // Initialize beta with SPSS initial values:
    // beta_j0 = log(p_j / p_ref), slope coefficients = 0
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

    // Variance-covariance = inverse of observed information matrix (-H at MLE)
    let var_covar = hessian
        .map(|x| -x)
        .try_inverse()
        .ok_or("Gagal menghitung matriks varians-kovarians")?;

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