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
        return Ok(ParameterEstimates { estimates: Vec::new(), notes: Vec::new() });
    }

    let design_info = create_design_response_weights(data, config)?;

    if design_info.n_samples == 0 {
        return Ok(ParameterEstimates { estimates: Vec::new(), notes: Vec::new() });
    }

    if
        design_info.p_parameters == 0 &&
        !config.model.intercept &&
        config.main.fix_factor.as_ref().map_or(true, |ff| ff.is_empty()) &&
        config.main.covar.as_ref().map_or(true, |cv| cv.is_empty())
    {
        return Ok(ParameterEstimates { estimates: Vec::new(), notes: Vec::new() });
    }

    web_sys::console::log_1(&format!("{:?}", design_info).into());

    let ztwz_matrix = create_cross_product_matrix(&design_info)?;
    let swept_info = perform_sweep_and_extract_results(&ztwz_matrix, design_info.p_parameters)?;

    let beta_hat_vec = &swept_info.beta_hat;
    let g_inv_matrix = &swept_info.g_inv;
    let rss = swept_info.s_rss;

    let n_samples = design_info.n_samples;
    let r_x_rank = design_info.r_x_rank;

    let df_error_val = if n_samples > r_x_rank { (n_samples - r_x_rank) as f64 } else { 0.0 };

    if df_error_val < 0.0 {
        return Err(
            format!("Degrees of freedom for error ({}) must be non-negative.", df_error_val)
        );
    }
    let df_error_usize = df_error_val as usize;

    let mse = if df_error_val > 0.0 { rss / df_error_val } else { f64::NAN };
    let mut estimates = Vec::new();
    let sig_level = config.options.sig_level;
    let sig_level_opt = Some(sig_level);

    // Get all parameter names using the design info and data
    let all_parameter_names = generate_all_row_parameter_names_sorted(&design_info, data)?;

    // Create a map for quick lookup of estimated beta values and their indices
    let mut estimated_params_map: HashMap<String, (usize, f64, f64)> = HashMap::new();
    for i in 0..design_info.p_parameters {
        let param_name = &all_parameter_names[i];
        let beta_val = beta_hat_vec.get(i).cloned().unwrap_or(0.0);
        let g_ii = g_inv_matrix.get((i, i)).cloned().unwrap_or(0.0);
        estimated_params_map.insert(param_name.clone(), (i, beta_val, g_ii));
    }

    // Track aliased terms
    let mut term_is_aliased_map: HashMap<String, bool> = HashMap::new();

    // Process each parameter
    for param_name in &all_parameter_names {
        let (
            final_b,
            final_std_err,
            final_t_val,
            final_param_sig,
            final_ci_lower,
            final_ci_upper,
            final_partial_eta_sq,
            final_non_cent_param,
            final_obs_power,
            is_redundant_param,
        ) = if let Some((_idx, beta_val, g_ii)) = estimated_params_map.get(param_name) {
            let is_redundant = g_ii.abs() < 1e-9 || g_ii.is_nan();
            term_is_aliased_map
                .entry(param_name.split('=').next().unwrap_or(param_name).to_string())
                .and_modify(|e| {
                    *e = *e || is_redundant;
                })
                .or_insert(is_redundant);

            if is_redundant {
                (
                    0.0,
                    f64::NAN,
                    f64::NAN,
                    f64::NAN,
                    f64::NAN,
                    f64::NAN,
                    f64::NAN,
                    f64::NAN,
                    f64::NAN,
                    true,
                )
            } else {
                let std_err = if mse.is_nan() || mse < 0.0 || *g_ii < 0.0 {
                    f64::NAN
                } else {
                    (mse * *g_ii).sqrt()
                };
                let t_val = if std_err.is_nan() || std_err.abs() < 1e-9 {
                    f64::NAN
                } else {
                    *beta_val / std_err
                };
                let param_sig = if t_val.is_nan() || df_error_usize == 0 {
                    f64::NAN
                } else {
                    calculate_t_significance(t_val.abs(), df_error_usize)
                };
                let t_crit = if df_error_usize == 0 {
                    f64::NAN
                } else {
                    calculate_t_critical(sig_level_opt, df_error_usize)
                };
                let (ci_lower, ci_upper) = if t_crit.is_nan() || std_err.is_nan() {
                    (f64::NAN, f64::NAN)
                } else {
                    (*beta_val - t_crit * std_err, *beta_val + t_crit * std_err)
                };
                let non_cent_param = if t_val.is_nan() { f64::NAN } else { t_val.abs() };
                let obs_power = if t_val.is_nan() || df_error_usize == 0 {
                    f64::NAN
                } else {
                    calculate_observed_power_t(t_val.abs(), df_error_usize, sig_level_opt)
                };
                let partial_eta_sq_val = if t_val.is_nan() {
                    f64::NAN
                } else if df_error_val == 0.0 {
                    if beta_val.abs() > 1e-9 { 1.0 } else { f64::NAN }
                } else {
                    let t_sq = t_val.powi(2);
                    let den = t_sq + df_error_val;
                    if den.abs() > 1e-12 {
                        (t_sq / den).max(0.0).min(1.0)
                    } else {
                        if t_sq.abs() < 1e-12 { 0.0 } else { f64::NAN }
                    }
                };
                (
                    *beta_val,
                    std_err,
                    t_val,
                    param_sig,
                    ci_lower,
                    ci_upper,
                    partial_eta_sq_val,
                    non_cent_param,
                    obs_power,
                    false,
                )
            }
        } else {
            term_is_aliased_map
                .entry(param_name.split('=').next().unwrap_or(param_name).to_string())
                .or_insert(false);
            (
                0.0,
                f64::NAN,
                f64::NAN,
                f64::NAN,
                f64::NAN,
                f64::NAN,
                f64::NAN,
                f64::NAN,
                f64::NAN,
                false,
            )
        };

        estimates.push(ParameterEstimateEntry {
            parameter: param_name.clone(),
            b: final_b,
            std_error: final_std_err,
            t_value: final_t_val,
            significance: final_param_sig,
            confidence_interval: ConfidenceInterval {
                lower_bound: final_ci_lower,
                upper_bound: final_ci_upper,
            },
            partial_eta_squared: final_partial_eta_sq,
            noncent_parameter: final_non_cent_param,
            observed_power: final_obs_power,
            is_redundant: is_redundant_param,
        });
    }

    // Generate notes
    let mut notes = Vec::new();
    let mut note_letter = 'a';

    // Add dependent variable name to notes for frontend consumption
    notes.push(format!("__DEP_VAR:{}", config.main.dep_var.as_ref().unwrap()));
    notes.push(format!("__SIG_LEVEL:{}", sig_level));

    // Add note about redundant parameters
    let mut aliased_terms_for_note: Vec<String> = term_is_aliased_map
        .iter()
        .filter(|(_, &is_aliased)| is_aliased)
        .map(|(term_name, _)| term_name.clone())
        .collect();
    aliased_terms_for_note.sort();
    aliased_terms_for_note.dedup();

    if !aliased_terms_for_note.is_empty() {
        notes.push(
            format!("{}. This parameter is set to zero because it is redundant.", note_letter)
        );
        note_letter = ((note_letter as u8) + 1) as char;
    }

    // Add note about degrees of freedom
    if df_error_val == 0.0 {
        notes.push(
            format!("{}. Degrees of freedom for error are 0. Statistics depending on df_error (like t-tests, CIs, Obs. Power, Significance) may not be computable or meaningful.", note_letter)
        );
        note_letter = ((note_letter as u8) + 1) as char;
    }

    // Add note about significance level
    notes.push(format!("{}. Computed using alpha = {:.2}", note_letter, sig_level));
    note_letter = ((note_letter as u8) + 1) as char;

    // Add note about observed power
    notes.push(
        format!(
            "{}. Observed Power (for t-tests) is computed using alpha = {:.2} for its critical value.",
            note_letter,
            sig_level
        )
    );

    Ok(ParameterEstimates { estimates, notes })
}
