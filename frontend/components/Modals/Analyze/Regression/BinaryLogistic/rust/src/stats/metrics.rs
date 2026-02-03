use nalgebra::DVector;
// BARIS INI YANG SEBELUMNYA KURANG:
use crate::models::result::{ClassificationTable, ModelSummary};

/// Menghitung R Square (Cox & Snell dan Nagelkerke)
pub fn calculate_r_squares(
    neg2ll_null: f64,
    neg2ll_full: f64,
    n_samples: usize,
    converged: bool,
    iterations: usize,
) -> ModelSummary {
    // Cox & Snell R Square: 1 - (L0/L1)^(2/n)
    // L0/L1 ekivalen dengan exp((LL_null - LL_full)) karena input kita -2LL
    let cox_snell = 1.0 - (-(neg2ll_null - neg2ll_full) / n_samples as f64).exp();

    // Nagelkerke R Square (Max scaled)
    let max_cox_snell = 1.0 - (-neg2ll_null / n_samples as f64).exp();

    let nagelkerke = if max_cox_snell > 1e-10 {
        cox_snell / max_cox_snell
    } else {
        0.0
    };

    ModelSummary {
        log_likelihood: neg2ll_full,
        cox_snell_r_square: cox_snell,
        nagelkerke_r_square: nagelkerke,
        converged,
        iterations,
    }
}

/// Menghitung Tabel Klasifikasi
pub fn calculate_classification_table(
    predicted_probs: &DVector<f64>,
    observed_y: &DVector<f64>,
    cutoff: f64,
) -> ClassificationTable {
    let mut tn = 0; // Observed 0, Predicted 0
    let mut fp = 0; // Observed 0, Predicted 1
    let mut fn_val = 0; // Observed 1, Predicted 0
    let mut tp = 0; // Observed 1, Predicted 1

    for (pred_prob, obs) in predicted_probs.iter().zip(observed_y.iter()) {
        let predicted_class = if *pred_prob >= cutoff { 1.0 } else { 0.0 };
        let observed_class = *obs;

        if observed_class == 0.0 {
            if predicted_class == 0.0 {
                tn += 1;
            } else {
                fp += 1;
            }
        } else if observed_class == 1.0 {
            if predicted_class == 0.0 {
                fn_val += 1;
            } else {
                tp += 1;
            }
        }
    }

    // Hitung persentase
    let percentage_correct_0 = if (tn + fp) > 0 {
        (tn as f64 / (tn + fp) as f64) * 100.0
    } else {
        0.0
    };

    let percentage_correct_1 = if (fn_val + tp) > 0 {
        (tp as f64 / (fn_val + tp) as f64) * 100.0
    } else {
        0.0
    };

    let total = (tn + fp + fn_val + tp) as f64;
    let overall_percentage = if total > 0.0 {
        ((tn + tp) as f64 / total) * 100.0
    } else {
        0.0
    };

    ClassificationTable {
        observed_0_predicted_0: tn,
        observed_0_predicted_1: fp,
        percentage_correct_0,
        observed_1_predicted_0: fn_val,
        observed_1_predicted_1: tp,
        percentage_correct_1,
        overall_percentage,
    }
}
