use crate::models::result::ClassificationTable;
use nalgebra::DVector;

pub fn calculate_classification_table(
    probabilities: &DVector<f64>,
    y_true: &DVector<f64>,
    cutoff: f64,
) -> ClassificationTable {
    let mut tn = 0; // Pred 0, Obs 0
    let mut fn_val = 0; // Pred 0, Obs 1
    let mut fp = 0; // Pred 1, Obs 0
    let mut tp = 0; // Pred 1, Obs 1

    for (prob, &actual) in probabilities.iter().zip(y_true.iter()) {
        let predicted = if *prob >= cutoff { 1.0 } else { 0.0 };
        let actual_int = actual as i32;
        let pred_int = predicted as i32;

        match (pred_int, actual_int) {
            (0, 0) => tn += 1,
            (0, 1) => fn_val += 1,
            (1, 0) => fp += 1,
            (1, 1) => tp += 1,
            _ => {}
        }
    }

    // Hitung Overall Percentage
    let total = tn + fp + fn_val + tp;
    let correct = tn + tp;
    let overall = if total > 0 {
        (correct as f64 / total as f64) * 100.0
    } else {
        0.0
    };

    // Return struct TANPA percentage_correct_0/1
    ClassificationTable {
        predicted_0_observed_0: tn,
        predicted_1_observed_0: fp, // Hati-hati tertukar: Pred 1 Obs 0 (False Positive)
        predicted_0_observed_1: fn_val, // Pred 0 Obs 1 (False Negative)
        predicted_1_observed_1: tp,
        overall_percentage: overall,
    }
}
