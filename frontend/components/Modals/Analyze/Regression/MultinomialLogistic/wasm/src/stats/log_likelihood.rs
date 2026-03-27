use crate::stats::core::PrimaryResults;
use nalgebra::{DMatrix, DVector};

/// Log-Likelihood Function: ℓ(β) = Σ_i Σ_j n_ij log(π_ij)
pub fn calculate_ll(
    X: &DMatrix<f64>,
    beta: &DVector<f64>,
    y: &[f64],
    cats: &[f64],
    weights: &[f64],
    ref_idx: usize,
    p: usize,
) -> f64 {
    let mut ll = 0.0;
    for i in 0..X.nrows() {
        let n_i = weights[i];

        // Log-sum-exp trick — tanpa clamp agar logit tumbuh bebas seperti SPSS
        let mut logits = vec![0.0f64; cats.len()];
        let mut b_offset_inner = 0;
        let mut max_logit_val: f64 = 0.0;

        for j in 0..cats.len() {
            let logit = if j == ref_idx {
                0.0
            } else {
                let bj = beta.rows(b_offset_inner, p);
                b_offset_inner += p;
                bj.dot(&X.row(i).transpose()) // tidak ada clamp
            };
            logits[j] = logit;
            if logit > max_logit_val {
                max_logit_val = logit;
            }
        }

        let mut sum_exp_stable = 0.0;
        let mut target_logit_shifted = 0.0;
        for j in 0..cats.len() {
            let shifted = logits[j] - max_logit_val;
            sum_exp_stable += shifted.exp();
            if (y[i] - cats[j]).abs() < f64::EPSILON {
                target_logit_shifted = shifted;
            }
        }

        // log(pi_ij) = target_shifted - log(sum_exp_stable)
        if sum_exp_stable > 0.0 && sum_exp_stable.is_finite() {
            let log_pi = target_logit_shifted - sum_exp_stable.ln();
            if log_pi.is_finite() {
                ll += n_i * log_pi;
            }
        }
    }
    ll
}

/// Null model (intercept-only) log-likelihood untuk Pseudo R-Square
pub fn calculate_null_log_likelihood(primary: &PrimaryResults) -> f64 {
    let n = primary.n_cases as f64;
    let mut null_ll = 0.0;
    for &cat_val in &primary.category_map {
        let count = primary
            .y_categories
            .iter()
            .filter(|&&y| y == cat_val)
            .count() as f64;
        if count > 0.0 {
            null_ll += count * (count / n).ln();
        }
    }
    null_ll
}
