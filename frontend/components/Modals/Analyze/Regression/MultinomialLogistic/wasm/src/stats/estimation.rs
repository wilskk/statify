use crate::models::config::MultinomialConfig;
use crate::models::result::{MultinomialResult, PseudoRSquare};
use crate::stats::core::PrimaryResults;
use nalgebra::{DMatrix, DVector};
use statrs::distribution::{ChiSquared, ContinuousCDF, Normal};

pub fn estimate_parameters(
    primary: &PrimaryResults,
    config: &MultinomialConfig,
) -> Result<MultinomialResult, String> {
    let X = &primary.design_matrix;
    let n_cases = primary.n_cases;
    let p = primary.n_params;
    let J = primary.n_categories;
    let ref_idx = primary.reference_index;

    let mut beta = DVector::zeros((J - 1) * p);
    let mut gradient = DVector::zeros((J - 1) * p);
    let mut converged = false;
    let mut iter_count = 0;
    let mut hessian = DMatrix::zeros((J - 1) * p, (J - 1) * p);

    for _ in 0..config.iterations {
        iter_count += 1;
        gradient.fill(0.0); // Reset gradient di setiap iterasi

        // 1. Hitung Probabilitas (Softmax)
        let mut pi = DMatrix::zeros(n_cases, J);
        for i in 0..n_cases {
            let mut sum_exp = 0.0;
            let mut logits = vec![0.0; J];
            let mut b_offset = 0;
            for j in 0..J {
                if j == ref_idx {
                    logits[j] = 0.0;
                } else {
                    let b_j = beta.rows(b_offset, p);
                    logits[j] = b_j.dot(&X.row(i).transpose());
                    b_offset += p;
                }
                sum_exp += logits[j].exp();
            }
            for j in 0..J {
                pi[(i, j)] = logits[j].exp() / sum_exp;
            }
        }

        // 2. Hitung Gradient
        let mut g_offset = 0;
        for j in 0..J {
            if j == ref_idx {
                continue;
            }
            for k in 0..p {
                let mut val = 0.0;
                for i in 0..n_cases {
                    let y_ij = if (primary.y_categories[i] - primary.category_map[j]).abs()
                        < f64::EPSILON
                    {
                        1.0
                    } else {
                        0.0
                    };
                    val += X[(i, k)] * (y_ij - pi[(i, j)]);
                }
                gradient[g_offset + k] = val;
            }
            g_offset += p;
        }

        // 3. Bangun Hessian
        let mut new_hessian = DMatrix::zeros((J - 1) * p, (J - 1) * p);
        let mut j_idx = 0;
        for j in 0..J {
            if j == ref_idx {
                continue;
            }
            let mut m_idx = 0;
            for m in 0..J {
                if m == ref_idx {
                    continue;
                }
                for k in 0..p {
                    for l in 0..p {
                        let mut val = 0.0;
                        for i in 0..n_cases {
                            let delta_jm = if j == m { 1.0 } else { 0.0 };
                            val -= X[(i, k)] * X[(i, l)] * pi[(i, j)] * (delta_jm - pi[(i, m)]);
                        }
                        new_hessian[(j_idx * p + k, m_idx * p + l)] = val;
                    }
                }
                m_idx += 1;
            }
            j_idx += 1;
        }
        hessian = new_hessian;

        // 4. Update Beta (Newton-Raphson Step)
        // [EDIT: Gunakan &gradient agar variabel tidak hilang (move)]
        let delta_beta_vec = hessian
            .clone()
            .try_inverse()
            .map(|inv_h| inv_h * &gradient)
            .ok_or_else(|| "Matriks Hessian singular.".to_string())?;

        beta -= &delta_beta_vec;

        // [EDIT: Gunakan delta_beta_vec untuk cek konvergensi]
        if delta_beta_vec.norm() < config.convergence {
            converged = true;
            break;
        }
    }

    // 5. Hitung Statistik Akhir
    // [EDIT: Hapus inisialisasi current_log_likelihood di atas, langsung assign di sini]
    let current_log_likelihood = calculate_ll(
        X,
        &beta,
        &primary.y_categories,
        &primary.category_map,
        ref_idx,
        p,
    );

    let null_ll = calculate_null_log_likelihood(primary);

    let var_covar = hessian
        .map(|x| -x)
        .try_inverse()
        .ok_or("Gagal menghitung matriks varians-kovarians")?;

    let result = format_results(
        beta,
        var_covar,
        current_log_likelihood,
        null_ll,
        iter_count,
        converged,
        primary,
    );

    Ok(result)
}

// [TAMBAHAN: Fungsi hitung Log-Likelihood]
fn calculate_ll(
    X: &DMatrix<f64>,
    beta: &DVector<f64>,
    y: &[f64],
    cats: &[f64],
    ref_idx: usize,
    p: usize,
) -> f64 {
    let mut ll = 0.0;
    for i in 0..X.nrows() {
        let mut sum_exp = 0.0;
        let mut target_logit = 0.0;
        let mut b_offset = 0;
        for j in 0..cats.len() {
            let logit = if j == ref_idx {
                0.0
            } else {
                let bj = beta.rows(b_offset, p);
                b_offset += p;
                bj.dot(&X.row(i).transpose())
            };
            sum_exp += logit.exp();
            if y[i] == cats[j] {
                target_logit = logit;
            }
        }
        ll += target_logit - sum_exp.ln();
    }
    ll
}

// [TAMBAHAN: Fungsi hitung Baseline model (Null Model) untuk Pseudo R-Square]
fn calculate_null_log_likelihood(primary: &PrimaryResults) -> f64 {
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

// [TAMBAHAN: Fungsi pemetaan hasil ke struct output UI]
fn format_results(
    beta: DVector<f64>,
    var_covar: DMatrix<f64>,
    ll: f64,
    null_ll: f64,
    iters: u32,
    conv: bool,
    primary: &PrimaryResults,
) -> MultinomialResult {
    let J = primary.n_categories;
    let p = primary.n_params;
    let n = primary.n_cases as f64;
    let normal = Normal::new(0.0, 1.0).unwrap();

    let mut coefficients = vec![vec![0.0; p]; J - 1];
    let mut std_errors = vec![vec![0.0; p]; J - 1];
    let mut wald_stats = vec![vec![0.0; p]; J - 1];
    let mut p_values = vec![vec![0.0; p]; J - 1];
    let mut exp_beta = vec![vec![0.0; p]; J - 1];

    for j in 0..(J - 1) {
        for k in 0..p {
            let idx = j * p + k;
            let coef = beta[idx];
            let se = var_covar[(idx, idx)].sqrt();
            let z = coef / se;

            coefficients[j][k] = coef;
            std_errors[j][k] = se;
            wald_stats[j][k] = z;
            p_values[j][k] = 2.0 * (1.0 - normal.cdf(z.abs()));
            exp_beta[j][k] = coef.exp(); // Odds Ratio
        }
    }

    // Hitung Pseudo R-Square (Formula SPSS)
    let cox_snell = 1.0 - (null_ll - ll).exp().powf(2.0 / n);
    let nagelkerke = cox_snell / (1.0 - (2.0 * null_ll / n).exp());
    let mcfadden = 1.0 - (ll / null_ll);

    MultinomialResult {
        coefficients,
        std_errors,
        wald_stats,
        p_values,
        exp_beta,
        log_likelihood: ll,
        null_log_likelihood: null_ll,
        chi_square: 2.0 * (ll - null_ll),
        df: ((J - 1) * (p - 1)) as u32,
        p_value_model: 1.0
            - ChiSquared::new(((J - 1) * (p - 1)) as f64)
                .unwrap()
                .cdf(2.0 * (ll - null_ll)),
        iterations: iters,
        converged: conv,
        pseudo_r_square: PseudoRSquare {
            cox_snell,
            nagelkerke,
            mcfadden,
        },
    }
}
