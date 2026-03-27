use crate::models::config::MultinomialConfig;
use crate::models::result::{
    ClassificationTable, GoodnessOfFit, LikelihoodRatioTest, MultinomialResult, PseudoRSquare,
};
use crate::stats::core::PrimaryResults;
use nalgebra::{DMatrix, DVector};
use statrs::distribution::{ChiSquared, ContinuousCDF, Normal};

/// Format hasil estimasi ke dalam struct output UI MultinomialResult.
pub fn format_results(
    beta: DVector<f64>,
    var_covar: DMatrix<f64>,
    ll: f64,
    null_ll: f64,
    iters: u32,
    conv: bool,
    primary: &PrimaryResults,
    config: &MultinomialConfig,
    classification: ClassificationTable,
    goodness_of_fit: GoodnessOfFit,
    lr_tests: Vec<LikelihoodRatioTest>,
) -> MultinomialResult {
    let J = primary.n_categories;
    let p = primary.n_params;
    let n = primary.n_cases as f64;
    let normal = Normal::new(0.0, 1.0).unwrap();

    // Z critical value untuk confidence intervals
    let alpha = 1.0 - config.confidence_interval;
    let z_crit = normal.inverse_cdf(1.0 - alpha / 2.0);

    let mut coefficients = vec![vec![0.0f64; p]; J - 1];
    let mut std_errors = vec![vec![0.0f64; p]; J - 1];
    let mut wald_stats = vec![vec![0.0f64; p]; J - 1];
    let mut p_values = vec![vec![0.0f64; p]; J - 1];
    let mut exp_beta = vec![vec![0.0f64; p]; J - 1];
    let mut ci_lower = vec![vec![0.0f64; p]; J - 1];
    let mut ci_upper = vec![vec![0.0f64; p]; J - 1];
    let mut exp_ci_lower = vec![vec![0.0f64; p]; J - 1];
    let mut exp_ci_upper = vec![vec![0.0f64; p]; J - 1];

    let chi_sq_1 = ChiSquared::new(1.0).unwrap();

    for j in 0..(J - 1) {
        for k in 0..p {
            let idx = j * p + k;
            let coef = beta[idx];
            let se = var_covar[(idx, idx)].sqrt();
            let z = coef / se;
            let wald = z * z; // SPSS uses Wald = (β/SE)² ~ χ²(1)

            let ci_low = coef - z_crit * se;
            let ci_high = coef + z_crit * se;

            coefficients[j][k] = coef;
            std_errors[j][k] = se;
            wald_stats[j][k] = wald;
            p_values[j][k] = 1.0 - chi_sq_1.cdf(wald.abs());
            // Handle overflow dari complete separation (koefisien sangat besar)
            // SPSS menampilkan ini sebagai "." (system missing) / floating point overflow
            let exp_val = coef.exp();
            exp_beta[j][k] = if exp_val.is_finite() {
                exp_val
            } else {
                f64::INFINITY
            };
            ci_lower[j][k] = ci_low;
            ci_upper[j][k] = ci_high;
            let exp_low = ci_low.exp();
            let exp_high = ci_high.exp();
            exp_ci_lower[j][k] = if exp_low.is_finite() { exp_low } else { 0.0 };
            exp_ci_upper[j][k] = if exp_high.is_finite() {
                exp_high
            } else {
                f64::INFINITY
            };
        }
    }

    // Pseudo R-Square (Formula SPSS)
    let cox_snell = 1.0 - (null_ll - ll).exp().powf(2.0 / n);
    let nagelkerke = cox_snell / (1.0 - (2.0 * null_ll / n).exp());
    let mcfadden = 1.0 - (ll / null_ll);

    MultinomialResult {
        coefficients,
        std_errors,
        wald_stats,
        p_values,
        exp_beta,
        ci_lower,
        ci_upper,
        exp_ci_lower,
        exp_ci_upper,
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
        goodness_of_fit,
        classification_table: classification,
        likelihood_ratio_tests: lr_tests,
    }
}
