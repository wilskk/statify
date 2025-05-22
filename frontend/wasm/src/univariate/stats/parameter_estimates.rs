use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ ConfidenceInterval, ParameterEstimateEntry, ParameterEstimates },
};
use std::collections::HashMap;

use super::core::*;

/// Calculate parameter estimates using a General Linear Model (GLM) approach.
pub fn calculate_parameter_estimates(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<ParameterEstimates, String> {
    if !config.options.param_est {
        return Err("Parameter estimates not requested in configuration".to_string());
    }

    let design_info = create_design_response_weights(data, config)?;

    if design_info.n_samples == 0 {
        return Ok(ParameterEstimates { estimates: Vec::new() });
    }
    if design_info.p_parameters == 0 && design_info.n_samples > 0 {
        return Ok(ParameterEstimates { estimates: Vec::new() });
    }
    if design_info.p_parameters == 0 && design_info.n_samples == 0 {
        return Ok(ParameterEstimates { estimates: Vec::new() });
    }

    let ztwz_matrix = create_cross_product_matrix(&design_info)?;
    let swept_info = perform_sweep_and_extract_results(&ztwz_matrix, design_info.p_parameters)?;

    let beta_hat_vec = &swept_info.beta_hat;
    let g_inv_matrix = &swept_info.g_inv;
    let rss = swept_info.s_rss;

    let n_samples = design_info.n_samples;
    let r_x_rank = design_info.r_x_rank;

    let df_error_val = if n_samples > r_x_rank {
        (n_samples - r_x_rank) as f64
    } else {
        return Err(
            format!(
                "Cannot calculate parameter estimates: N ({}) must be greater than rank of X ({}). df_error would be <=0.",
                n_samples,
                r_x_rank
            )
        );
    };
    if df_error_val <= 0.0 {
        return Err(format!("Degrees of freedom for error ({}) must be positive.", df_error_val));
    }
    let df_error_usize = df_error_val as usize;

    let mse = rss / df_error_val;
    let mut estimates = Vec::new();
    let sig_level = config.options.sig_level;
    let sig_level_opt = Some(sig_level);

    let mut param_names_map: HashMap<usize, String> = HashMap::new();
    let mut term_is_aliased: HashMap<String, bool> = HashMap::new();
    let mut sorted_term_keys: Vec<String> = design_info.term_column_indices
        .keys()
        .cloned()
        .collect();
    sorted_term_keys.sort();

    for term_key in &sorted_term_keys {
        if let Some(&(start_col, end_col)) = design_info.term_column_indices.get(term_key) {
            if term_key == "Intercept" {
                param_names_map.insert(start_col, "Intercept".to_string());
            } else if config.main.fix_factor.as_ref().map_or(false, |ff| ff.contains(term_key)) {
                let levels = get_factor_levels(data, term_key)?;
                let num_dummies = levels.len().saturating_sub(1);
                for i in 0..num_dummies {
                    let col_idx = start_col + i;
                    if col_idx <= end_col {
                        param_names_map.insert(col_idx, format!("{}={}", term_key, levels[i]));
                    }
                }
            } else if config.main.covar.as_ref().map_or(false, |cv| cv.contains(term_key)) {
                param_names_map.insert(start_col, term_key.clone());
            } else if term_key.contains('*') {
                for i in 0..end_col - start_col + 1 {
                    let col_idx = start_col + i;
                    param_names_map.insert(
                        col_idx,
                        format!("{}_interaction_param{}", term_key, i + 1)
                    );
                }
            }
        }
    }

    for i in 0..design_info.p_parameters {
        let beta_val = beta_hat_vec.get(i).cloned().unwrap_or(0.0);
        let g_jj = g_inv_matrix.get((i, i)).cloned().unwrap_or(0.0);
        let is_aliased = g_jj.abs() < 1e-9;
        let param_name = param_names_map
            .get(&i)
            .cloned()
            .unwrap_or_else(|| format!("Parameter_{}", i + 1));

        let base_term_name = param_name.split('=').next().unwrap_or(&param_name).to_string();
        term_is_aliased
            .entry(base_term_name)
            .and_modify(|e| {
                *e = *e || is_aliased;
            })
            .or_insert(is_aliased);

        let std_err = if is_aliased || mse < 0.0 { 0.0 } else { (mse * g_jj).sqrt() };
        let t_val = if is_aliased || std_err.abs() < 1e-9 { 0.0 } else { beta_val / std_err };
        let param_significance = if is_aliased {
            1.0
        } else {
            calculate_t_significance(t_val, df_error_usize)
        };

        let t_crit = calculate_t_critical(sig_level_opt, df_error_usize);
        let (ci_lower, ci_upper) = if is_aliased {
            (0.0, 0.0)
        } else {
            (beta_val - t_crit * std_err, beta_val + t_crit * std_err)
        };

        let non_centrality_param = if is_aliased { 0.0 } else { t_val.abs() };
        let obs_power = if is_aliased {
            0.0
        } else {
            calculate_observed_power_t(t_val.abs(), df_error_usize, sig_level_opt)
        };

        let partial_eta_sq = if is_aliased || df_error_val <= 0.0 || t_val.is_nan() {
            0.0
        } else {
            let t_sq = t_val.powi(2);
            if (t_sq + df_error_val).abs() > 1e-12 {
                (t_sq / (t_sq + df_error_val)).max(0.0).min(1.0)
            } else if t_sq.abs() < 1e-12 {
                0.0
            } else {
                1.0
            }
        };

        estimates.push(ParameterEstimateEntry {
            parameter: param_name.clone(),
            b: beta_val,
            std_error: std_err,
            t_value: t_val,
            significance: param_significance,
            confidence_interval: ConfidenceInterval {
                lower_bound: ci_lower,
                upper_bound: ci_upper,
            },
            partial_eta_squared: partial_eta_sq,
            noncent_parameter: non_centrality_param,
            observed_power: obs_power,
        });
    }

    if let Some(fixed_factors) = &config.main.fix_factor {
        for factor_name in fixed_factors {
            if !*term_is_aliased.get(factor_name).unwrap_or(&true) {
                let levels = get_factor_levels(data, factor_name)?;
                if !levels.is_empty() {
                    let ref_level_name = levels.last().unwrap();
                    estimates.push(ParameterEstimateEntry {
                        parameter: format!("{}={}", factor_name, ref_level_name),
                        b: 0.0,
                        std_error: 0.0,
                        t_value: 0.0,
                        significance: 1.0,
                        confidence_interval: ConfidenceInterval {
                            lower_bound: 0.0,
                            upper_bound: 0.0,
                        },
                        partial_eta_squared: 0.0,
                        noncent_parameter: 0.0,
                        observed_power: 0.0,
                    });
                }
            }
        }
    }

    Ok(ParameterEstimates { estimates })
}
