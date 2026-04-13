use crate::models::result::GoodnessOfFit;
use crate::stats::core::PrimaryResults;
use nalgebra::{DMatrix, DVector};
use statrs::distribution::{ChiSquared, ContinuousCDF};
use std::collections::HashMap;

/// Hitung Goodness-of-Fit Tests sesuai spesifikasi SPSS.
///
/// SPSS menggunakan formula berbasis subpopulasi (pola kovariat unik):
///   Pearson: chi2 = sum_i sum_j (n_ij - n_i*pi_ij)^2 / (n_i*pi_ij)
///   Deviance: D = 2 * sum_i sum_j n_ij * log(n_ij / (n_i*pi_ij))
///   df = m*(J-1) - (J-1)*p  dimana m = jumlah pola kovariat unik
pub fn calculate_goodness_of_fit(
    X: &DMatrix<f64>,
    beta: &DVector<f64>,
    primary: &PrimaryResults,
) -> GoodnessOfFit {
    let n = primary.n_cases;
    let J = primary.n_categories;
    let p = primary.n_params;
    let ref_idx = primary.reference_index;

    // --- Agregasi observasi berdasarkan pola kovariat unik ---
    // Key: baris X yang didiskretisasi (x * 1e6 dibulatkan ke i64)
    // Value: (n_i = total observasi di pola ini, n_ij = count per kategori)
    let mut pattern_map: HashMap<Vec<i64>, (f64, Vec<f64>)> = HashMap::new();

    for i in 0..n {
        let weight = primary.weights.get(i).copied().unwrap_or(1.0);
        if !weight.is_finite() || weight <= 0.0 {
            continue;
        }

        let key: Vec<i64> = (0..X.ncols()).map(|j| (X[(i, j)] * 1e6) as i64).collect();
        let obs_cat = primary.y_categories[i];
        let obs_idx = primary
            .category_map
            .iter()
            .position(|&c| c == obs_cat)
            .unwrap();
        let entry = pattern_map.entry(key).or_insert((0.0, vec![0.0; J]));
        entry.0 += weight;
        entry.1[obs_idx] += weight;
    }

    let mut pearson_chi2 = 0.0;
    let mut deviance = 0.0;

    for (key, (n_i, n_ij_vec)) in &pattern_map {
        // Rekonstruksi x_i dari key lalu hitung probabilitas fitted
        let x_i: Vec<f64> = key.iter().map(|&k| k as f64 / 1e6).collect();

        let mut fitted = vec![0.0f64; J];
        let mut sum_exp_pat = 0.0;
        let mut b_off = 0;
        for j in 0..J {
            let logit = if j == ref_idx {
                0.0
            } else {
                let logit_val: f64 = beta
                    .rows(b_off, p)
                    .iter()
                    .zip(x_i.iter())
                    .map(|(b, x)| b * x)
                    .sum();
                b_off += p;
                logit_val
            };
            fitted[j] = logit.exp();
            sum_exp_pat += fitted[j];
        }
        for j in 0..J {
            fitted[j] /= sum_exp_pat;
        }

        // Pearson: sum_j (n_ij - n_i*pi_ij)^2 / (n_i*pi_ij)
        for j in 0..J {
            let expected = n_i * fitted[j];
            if expected > 1e-10 {
                let obs = n_ij_vec[j];
                pearson_chi2 += (obs - expected).powi(2) / expected;
            }
        }

        // Deviance: 2 * sum_j n_ij * log(n_ij / (n_i*pi_ij))
        for j in 0..J {
            let obs = n_ij_vec[j];
            let expected = n_i * fitted[j];
            if obs > 1e-10 && expected > 1e-10 {
                deviance += 2.0 * obs * (obs / expected).ln();
            }
        }
    }

    // df = m*(J-1) - (J-1)*p, dimana m = jumlah pola kovariat unik
    let m = pattern_map.len();
    let df = (m * (J - 1)).saturating_sub((J - 1) * p);
    let df_val = df.max(1) as f64;

    let chi_dist = ChiSquared::new(df_val).unwrap();
    let pearson_p = 1.0 - chi_dist.cdf(pearson_chi2);
    let deviance_p = 1.0 - chi_dist.cdf(deviance);

    GoodnessOfFit {
        pearson_chi_square: pearson_chi2,
        pearson_df: df as u32,
        pearson_p_value: pearson_p,
        deviance,
        deviance_df: df as u32,
        deviance_p_value: deviance_p,
    }
}
