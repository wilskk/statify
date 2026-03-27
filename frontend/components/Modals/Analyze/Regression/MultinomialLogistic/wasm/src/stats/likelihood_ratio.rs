use crate::models::config::MultinomialConfig;
use crate::models::result::LikelihoodRatioTest;
use crate::stats::core::PrimaryResults;
use crate::stats::log_likelihood::calculate_ll;
use crate::stats::newton_raphson::run_newton_raphson_internal;
use nalgebra::{DMatrix, DVector};
use statrs::distribution::{ChiSquared, ContinuousCDF};

/// Hitung Likelihood Ratio Tests untuk setiap variabel.
/// Parameter `full_ll` adalah LL model penuh yang sudah dihitung sebelumnya.
pub fn calculate_likelihood_ratio_tests(
    X: &DMatrix<f64>,
    primary: &PrimaryResults,
    config: &MultinomialConfig,
    full_beta: &DVector<f64>,
    full_ll: f64,
) -> Vec<LikelihoodRatioTest> {
    let mut tests = Vec::new();
    let p = primary.n_params;
    let J = primary.n_categories;

    for var_idx in 0..p {
        if p == 1 {
            continue;
        }

        // Buat reduced design matrix (hapus kolom var_idx)
        let mut reduced_elements = Vec::new();
        for i in 0..primary.n_cases {
            for j in 0..p {
                if j != var_idx {
                    reduced_elements.push(X[(i, j)]);
                }
            }
        }

        let reduced_cols = p - 1;
        if reduced_cols == 0 {
            continue;
        }

        let reduced_X = DMatrix::from_row_slice(primary.n_cases, reduced_cols, &reduced_elements);

        let reduced_primary = PrimaryResults {
            design_matrix: reduced_X.clone(),
            y_categories: primary.y_categories.clone(),
            category_map: primary.category_map.clone(),
            reference_index: primary.reference_index,
            n_cases: primary.n_cases,
            n_params: reduced_cols,
            n_categories: J,
            weights: primary.weights.clone(),
            variable_names: primary.variable_names.clone(),
        };

        let reduced_ll = match run_newton_raphson_internal(&reduced_X, &reduced_primary, config) {
            Ok((beta, _, _, _)) => calculate_ll(
                &reduced_X,
                &beta,
                &primary.y_categories,
                &primary.category_map,
                &primary.weights,
                primary.reference_index,
                reduced_cols,
            ),
            Err(_) => continue,
        };

        // LR statistic: -2(LL_reduced - LL_full)
        let lr_chi2 = -2.0 * (reduced_ll - full_ll);

        if lr_chi2.is_nan() || lr_chi2.is_infinite() || lr_chi2 < 0.0 {
            continue;
        }

        let df = (J - 1) as u32;
        let chi_dist = ChiSquared::new(df as f64).unwrap();
        let p_value = 1.0 - chi_dist.cdf(lr_chi2);

        tests.push(LikelihoodRatioTest {
            effect: primary
                .variable_names
                .get(var_idx)
                .unwrap_or(&format!("X{}", var_idx))
                .clone(),
            chi_square: lr_chi2,
            df,
            p_value,
        });
    }

    tests
}
