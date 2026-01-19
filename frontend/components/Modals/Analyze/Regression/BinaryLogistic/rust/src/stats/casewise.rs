use crate::models::config::LogisticConfig;
use crate::models::result::CasewiseRow;
use crate::stats::irls::FittedModel;
use nalgebra::{DMatrix, DVector};

/// Calculate casewise diagnostics for binary logistic regression
/// Similar to SPSS's Casewise Listing of Residuals
/// 
/// Returns a vector of CasewiseRow, filtered based on config settings:
/// - If casewise_type == "outliers": only cases where |ZResid| > casewise_outliers
/// - If casewise_type == "all": all cases
pub fn calculate_casewise_list(
    x_matrix: &DMatrix<f64>,
    y_vector: &DVector<f64>,
    model: &FittedModel,
    config: &LogisticConfig,
    y_label_0: &str,
    y_label_1: &str,
) -> Vec<CasewiseRow> {
    let n = y_vector.len();
    let p = model.beta.len();
    let cutoff = config.cutoff;
    let outlier_threshold = config.casewise_outliers;
    let show_all = config.casewise_type == "all";
    
    let mut casewise_list: Vec<CasewiseRow> = Vec::new();
    
    // Pre-calculate leverage (hat values) for all observations
    // h_ii = x_i' * (X'WX)^-1 * W * x_i
    // Simplified: using covariance matrix already computed
    let leverages = calculate_leverages(x_matrix, &model.weights, &model.covariance_matrix);
    
    for i in 0..n {
        let y_obs = y_vector[i];
        let prob = model.predictions[i];
        
        // Predicted class based on cutoff
        let y_pred = if prob >= cutoff { 1.0 } else { 0.0 };
        let is_incorrect = (y_obs - y_pred).abs() > 0.5;
        
        // --- Calculate Residuals ---
        
        // 1. Raw (Unstandardized) Residual: y - p
        let resid_raw = y_obs - prob;
        
        // 2. Variance: p * (1 - p)
        let variance = prob * (1.0 - prob);
        let std_dev = if variance > 1e-12 { variance.sqrt() } else { 1e-6 };
        
        // 3. Standardized Residual (ZResid): (y - p) / sqrt(p * (1-p))
        let resid_zresid = resid_raw / std_dev;
        
        // 4. Leverage (hat value)
        let leverage = leverages[i];
        
        // 5. Studentized Residual: (y - p) / sqrt(p*(1-p)*(1-h))
        let denom_student = if (1.0 - leverage) > 1e-12 {
            (variance * (1.0 - leverage)).sqrt()
        } else {
            1e-6
        };
        let resid_studentized = resid_raw / denom_student;
        
        // 6. Logit Residual: residual / (p * (1-p))
        let resid_logit = if variance > 1e-12 {
            resid_raw / variance
        } else {
            0.0
        };
        
        // 7. Deviance Residual
        // d_i = sign(y - p) * sqrt(2 * |y*ln(p) + (1-y)*ln(1-p)|)
        let prob_safe = prob.max(1e-12).min(1.0 - 1e-12);
        let log_term = y_obs * prob_safe.ln() + (1.0 - y_obs) * (1.0 - prob_safe).ln();
        let resid_deviance = if resid_raw >= 0.0 {
            ((-2.0 * log_term).max(0.0)).sqrt()
        } else {
            -((-2.0 * log_term).max(0.0)).sqrt()
        };
        
        // 8. Cook's Distance (approximation)
        // D_i ≈ (studentized^2 * h) / (p * (1 - h))
        let cooks = if p > 0 && (1.0 - leverage) > 1e-12 {
            (resid_studentized.powi(2) * leverage) / ((p as f64) * (1.0 - leverage))
        } else {
            0.0
        };
        
        // --- Apply Filter ---
        let include_case = show_all || resid_zresid.abs() > outlier_threshold;
        
        if include_case {
            // Determine labels
            let obs_label = if y_obs > 0.5 { y_label_1 } else { y_label_0 };
            let pred_label = if y_pred > 0.5 { y_label_1 } else { y_label_0 };
            let pred_group = if is_incorrect {
                format!("**{}", pred_label)
            } else {
                pred_label.to_string()
            };
            
            casewise_list.push(CasewiseRow {
                case_number: i + 1, // 1-indexed
                selected: "S".to_string(),
                observed: y_obs,
                observed_label: obs_label.to_string(),
                predicted: y_pred,
                predicted_label: pred_label.to_string(),
                predicted_group: pred_group,
                predicted_probability: prob,
                resid_zresid,
                resid_raw: Some(resid_raw),
                resid_logit: Some(resid_logit),
                resid_studentized: Some(resid_studentized),
                resid_deviance: Some(resid_deviance),
                leverage: Some(leverage),
                cooks_distance: Some(cooks),
                dfbeta: None, // DfBeta requires more computation, optional
            });
        }
    }
    
    // Sort by absolute ZResid descending (like SPSS)
    casewise_list.sort_by(|a, b| {
        b.resid_zresid.abs().partial_cmp(&a.resid_zresid.abs()).unwrap_or(std::cmp::Ordering::Equal)
    });
    
    casewise_list
}

/// Calculate leverage (hat) values for each observation
/// h_ii = w_ii * x_i' * (X'WX)^-1 * x_i
fn calculate_leverages(
    x_matrix: &DMatrix<f64>,
    weights: &DVector<f64>,
    cov_matrix: &DMatrix<f64>,
) -> Vec<f64> {
    let n = x_matrix.nrows();
    let mut leverages = Vec::with_capacity(n);
    
    for i in 0..n {
        let x_i = x_matrix.row(i).transpose();
        let w_i = weights[i];
        
        // h_ii = w_i * x_i' * Cov * x_i
        // Where Cov = (X'WX)^-1
        let temp = cov_matrix * &x_i;
        let h_ii = w_i * x_i.dot(&temp);
        
        // Clamp to [0, 1] range
        leverages.push(h_ii.max(0.0).min(1.0));
    }
    
    leverages
}

#[cfg(test)]
mod tests {
    use super::*;
    use nalgebra::{DMatrix, DVector};
    
    #[test]
    fn test_leverage_calculation() {
        // Simple test with 3 observations, 2 variables
        let x = DMatrix::from_row_slice(3, 2, &[
            1.0, 1.0,
            1.0, 2.0,
            1.0, 3.0,
        ]);
        let weights = DVector::from_vec(vec![0.25, 0.25, 0.25]);
        let cov = DMatrix::from_row_slice(2, 2, &[
            1.0, 0.0,
            0.0, 1.0,
        ]);
        
        let leverages = calculate_leverages(&x, &weights, &cov);
        
        assert_eq!(leverages.len(), 3);
        // All leverages should be positive
        for h in &leverages {
            assert!(*h >= 0.0);
        }
    }
}
