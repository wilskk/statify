use crate::models::config::LogisticConfig;
use crate::models::result::CasewiseRow;
use crate::stats::irls::FittedModel;
use nalgebra::{DMatrix, DVector};

/// Calculate casewise diagnostics for binary logistic regression
/// Similar to SPSS's Casewise Listing of Residuals
/// 
/// Returns a vector of CasewiseRow, filtered based on config settings:
/// - If casewise_type == "outliers": only cases where |SResid| > casewise_outliers
/// - If casewise_type == "all": all cases
/// 
/// SPSS uses the Studentized Residual (SResid) for filtering, not the Standardized
/// Residual (ZResid). The SPSS formula for SResid is: ZResid * sqrt(1 - h)
/// where h is the leverage (hat value).
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
    // We compute (X'WX)^-1 directly here to ensure correct leverage calculation
    let leverages = calculate_leverages_correct(x_matrix, &model.predictions);
    
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
        // This is the Pearson residual
        let resid_zresid = resid_raw / std_dev;
        
        // 4. Leverage (hat value)
        let leverage = leverages[i];
        
        // 5. Studentized Residual (Correct formula based on Pregibon 1981)
        // Formula: r_student = r_pearson / sqrt(1 - h)
        //
        // This DIVIDES by sqrt(1-h), which INCREASES the residual for high-leverage 
        // points. This is the theoretically correct formula from:
        // - Pregibon, D. (1981). Logistic Regression Diagnostics. The Annals of Statistics.
        // - Hosmer, D.W. & Lemeshow, S. (2000). Applied Logistic Regression.
        //
        // Note: This uses WEIGHTED leverage h = w_i * x_i'(X'WX)^{-1}x_i
        let resid_studentized = if (1.0 - leverage) > 1e-12 {
            resid_zresid / (1.0 - leverage).sqrt()  // DIVIDE, not multiply
        } else {
            resid_zresid // If leverage ≈ 1, just use ZResid
        };
        
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
        
        // 8. Cook's Distance for Logistic Regression (Pregibon 1981, Hosmer & Lemeshow 2000)
        // Formula: D_i = (r_pearson^2 * h) / (1 - h)^2
        //
        // IMPORTANT: Unlike Linear Regression, Logistic Regression does NOT divide by p.
        // We use the Pearson residual (resid_zresid), not the studentized residual.
        //
        // Reference:
        // - Hosmer, D.W. & Lemeshow, S. (2000). Applied Logistic Regression, 2nd Ed.
        // - Pregibon, D. (1981). Logistic Regression Diagnostics.
        let cooks = if (1.0 - leverage) > 1e-12 {
            (resid_zresid.powi(2) * leverage) / (1.0 - leverage).powi(2)
        } else {
            0.0
        };
        
        // --- Apply Filter ---
        // SPSS filters by Studentized Residual (SResid), not ZResid
        // "Cases with studentized residuals greater than [threshold] are listed"
        let include_case = show_all || resid_studentized.abs() > outlier_threshold;
        
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
    
    // Sort by absolute Studentized Residual (SResid) descending (like SPSS)
    casewise_list.sort_by(|a, b| {
        let a_sresid = a.resid_studentized.unwrap_or(0.0).abs();
        let b_sresid = b.resid_studentized.unwrap_or(0.0).abs();
        b_sresid.partial_cmp(&a_sresid).unwrap_or(std::cmp::Ordering::Equal)
    });
    
    casewise_list
}

/// Calculate leverage (hat) values for each observation using the correct formula
/// 
/// The Hat matrix in weighted least squares (which logistic regression uses via IRLS) is:
/// H = W^{1/2} X (X'WX)^{-1} X' W^{1/2}
/// 
/// And the diagonal elements (leverage values) are:
/// h_ii = w_i * x_i' * (X'WX)^{-1} * x_i
/// 
/// where w_i = p_i * (1 - p_i) is the weight for observation i
/// 
/// Reference: Hosmer & Lemeshow (2000), Pregibon (1981)
fn calculate_leverages_correct(
    x_matrix: &DMatrix<f64>,
    predictions: &DVector<f64>,
) -> Vec<f64> {
    let n = x_matrix.nrows();
    let p = x_matrix.ncols();
    
    // Step 1: Compute weights W = diag(p * (1-p))
    let weights: Vec<f64> = predictions.iter()
        .map(|&pi| {
            let w = pi * (1.0 - pi);
            if w < 1e-10 { 1e-10 } else { w }
        })
        .collect();
    
    // Step 2: Compute X'WX
    let mut xt_wx = DMatrix::zeros(p, p);
    for i in 0..n {
        let x_i = x_matrix.row(i).transpose();
        let w_i = weights[i];
        for j in 0..p {
            for k in 0..p {
                xt_wx[(j, k)] += w_i * x_i[j] * x_i[k];
            }
        }
    }
    
    // Step 3: Compute (X'WX)^{-1}
    let xt_wx_inv = match xt_wx.clone().try_inverse() {
        Some(inv) => inv,
        None => {
            let svd = xt_wx.svd(true, true);
            svd.pseudo_inverse(1e-10).unwrap_or_else(|_| DMatrix::identity(p, p))
        }
    };
    
    // Step 4: Compute leverage for each observation
    // h_ii = w_i * x_i' * (X'WX)^{-1} * x_i
    let mut leverages = Vec::with_capacity(n);
    
    for i in 0..n {
        let x_i = x_matrix.row(i).transpose();
        let w_i = weights[i];
        let temp = &xt_wx_inv * &x_i;
        let h_ii = w_i * x_i.dot(&temp);
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
        let x = DMatrix::from_row_slice(3, 2, &[
            1.0, 1.0,
            1.0, 2.0,
            1.0, 3.0,
        ]);
        let predictions = DVector::from_vec(vec![0.5, 0.5, 0.5]);
        
        let leverages = calculate_leverages_correct(&x, &predictions);
        
        assert_eq!(leverages.len(), 3);
        for h in &leverages {
            assert!(*h >= 0.0);
            assert!(*h <= 1.0);
        }
    }
}
