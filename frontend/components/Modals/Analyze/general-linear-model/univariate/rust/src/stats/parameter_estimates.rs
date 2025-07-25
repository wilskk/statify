use crate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ ConfidenceInterval, ParameterEstimateEntry, ParameterEstimates },
};
use std::collections::HashMap;

use super::core::*;

/// Menghitung estimasi parameter menggunakan pendekatan General Linear Model (GLM).
///
/// Fungsi ini adalah inti dari analisis regresi dan ANOVA, yang mengestimasi hubungan
/// antara variabel dependen dan independen.
///
/// # Arguments
/// * `data` - Referensi ke `AnalysisData` yang berisi data mentah dan term-term model.
/// * `config` - Referensi ke `UnivariateConfig` yang menyimpan pengaturan analisis.
///
/// # Returns
/// `Result<ParameterEstimates, String>` yang berisi:
/// - `Ok(ParameterEstimates)`: Struct dengan daftar estimasi parameter dan catatan.
/// - `Err(String)`: Pesan error jika terjadi masalah selama perhitungan.
pub fn calculate_parameter_estimates(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<ParameterEstimates, String> {
    // Langkah 1: Persiapan data dan matriks desain
    // Membuat matriks desain (X), vektor respons (y), dan bobot (W) berdasarkan data dan konfigurasi model.
    // `design_info` berisi semua komponen yang diperlukan untuk perhitungan GLM.
    let design_info = create_design_response_weights(data, config)?;

    // Jika tidak ada sampel data yang valid, hentikan proses.
    if design_info.n_samples == 0 {
        return Ok(ParameterEstimates { estimates: Vec::new(), note: None, interpretation: None });
    }

    // Jika tidak ada parameter yang perlu diestimasi (misalnya, model kosong), kembalikan hasil kosong.
    if
        design_info.p_parameters == 0 &&
        !config.model.intercept &&
        config.main.fix_factor.as_ref().map_or(true, |ff| ff.is_empty()) &&
        config.main.covar.as_ref().map_or(true, |cv| cv.is_empty())
    {
        return Ok(ParameterEstimates { estimates: Vec::new(), note: None, interpretation: None });
    }

    // Langkah 2: Perhitungan Inti GLM
    // Membuat matriks cross-product (Z'WZ) yang merupakan dasar untuk estimasi OLS/WLS.
    let ztwz_matrix = create_cross_product_matrix(&design_info)?;

    // Melakukan operasi SWEEP pada matriks cross-product untuk menghitung:
    // - `beta_hat`: Vektor koefisien regresi (estimasi parameter).
    // - `g_inv`: Invers tergeneralisasi dari matriks (X'X).
    // - `s_rss`: Sum of Squared Residuals (RSS) atau Jumlah Kuadrat Galat.
    let swept_info = perform_sweep_and_extract_results(&ztwz_matrix, design_info.p_parameters)?;

    let beta_hat_vec = &swept_info.beta_hat;
    let g_inv_matrix = &swept_info.g_inv;
    let rss = swept_info.s_rss;

    let n_samples = design_info.n_samples;
    let r_x_rank = design_info.r_x_rank;

    // Langkah 3: Menghitung Derajat Kebebasan (Degrees of Freedom) dan Mean Squared Error (MSE)
    // Derajat kebebasan untuk galat (error) dihitung sebagai: df_error = n - rank(X)
    // Di mana n adalah jumlah sampel dan rank(X) adalah rank dari matriks desain.
    let df_error_val = if n_samples > r_x_rank { (n_samples - r_x_rank) as f64 } else { 0.0 };

    if df_error_val < 0.0 {
        return Err(
            format!("Degrees of freedom for error ({}) must be non-negative.", df_error_val)
        );
    }
    let df_error_usize = df_error_val as usize;

    // Mean Squared Error (MSE) dihitung sebagai: MSE = RSS / df_error
    // MSE adalah estimasi dari varians galat (σ^2).
    let mse = if df_error_val > 0.0 { rss / df_error_val } else { f64::NAN };
    let mut estimates = Vec::new();
    let sig_level = config.options.sig_level;

    // Langkah 4: Menghitung statistik untuk setiap parameter
    // Mendapatkan semua nama parameter yang akan diestimasi, diurutkan untuk konsistensi.
    let all_parameter_names = generate_all_row_parameter_names_sorted(&design_info, data)?;

    // Membuat peta (map) untuk menyimpan nilai beta dan elemen diagonal g-inverse (g_ii)
    // agar mudah diakses berdasarkan nama parameter.
    let mut estimated_params_map: HashMap<String, (usize, f64, f64)> = HashMap::new();
    for i in 0..design_info.p_parameters {
        let param_name = &all_parameter_names[i];
        let beta_val = beta_hat_vec.get(i).cloned().unwrap_or(0.0);
        let g_ii = g_inv_matrix.get((i, i)).cloned().unwrap_or(0.0);
        estimated_params_map.insert(param_name.clone(), (i, beta_val, g_ii));
    }

    // Melacak term yang bersifat redundan (aliased)
    let mut term_is_aliased_map: HashMap<String, bool> = HashMap::new();

    // Iterasi melalui setiap parameter untuk menghitung statistik inferensialnya.
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
            // Identifikasi parameter redundan.
            // Parameter dianggap redundan jika elemen diagonal dari matriks g-inverse (g_ii)
            // sangat kecil atau NaN. Ini menandakan multikolinearitas sempurna.
            let is_redundant = g_ii.abs() < 1e-9 || g_ii.is_nan();
            term_is_aliased_map
                .entry(param_name.split('=').next().unwrap_or(param_name).to_string())
                .and_modify(|e| {
                    *e = *e || is_redundant;
                })
                .or_insert(is_redundant);

            if is_redundant {
                // Jika parameter redundan, estimasinya diatur ke 0 dan statistik lainnya
                // diatur ke NaN karena tidak dapat dihitung secara valid.
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
                // Perhitungan untuk parameter yang tidak redundan.

                // Standard Error (SE) dari estimasi beta:
                // Rumus: SE(β) = sqrt(MSE * g_ii)
                // SE mengukur ketidakpastian dalam estimasi koefisien.
                let std_err = if mse.is_nan() || mse < 0.0 || *g_ii < 0.0 {
                    f64::NAN
                } else {
                    (mse * *g_ii).sqrt()
                };

                // Uji-t (t-test) untuk signifikansi koefisien:
                // Rumus: t = β / SE(β)
                // Menguji hipotesis nol bahwa koefisien sama dengan nol.
                let t_val = if std_err.is_nan() || std_err.abs() < 1e-9 {
                    f64::NAN
                } else {
                    *beta_val / std_err
                };

                // p-value (Significance) untuk uji-t:
                // Menghitung probabilitas mendapatkan nilai t yang sama atau lebih ekstrem
                // dari yang diamati, dengan asumsi hipotesis nol benar.
                let param_sig = if t_val.is_nan() || df_error_usize == 0 {
                    f64::NAN
                } else {
                    calculate_t_significance(t_val.abs(), df_error_usize)
                };

                // Nilai Kritis t untuk Interval Kepercayaan:
                // Ditentukan berdasarkan tingkat signifikansi (alpha) dan df_error.
                let t_crit = if df_error_usize == 0 {
                    f64::NAN
                } else {
                    calculate_t_critical(Some(sig_level), df_error_usize)
                };

                // Interval Kepercayaan (Confidence Interval) untuk beta:
                // Rumus: β ± t_crit * SE(β)
                // Memberikan rentang di mana nilai parameter populasi sebenarnya mungkin berada.
                let (ci_lower, ci_upper) = if t_crit.is_nan() || std_err.is_nan() {
                    (f64::NAN, f64::NAN)
                } else {
                    (*beta_val - t_crit * std_err, *beta_val + t_crit * std_err)
                };

                // Partial Eta-Squared sebagai ukuran efek:
                // Rumus: η²_p = t² / (t² + df_error)
                // Mengukur proporsi varians yang dijelaskan oleh suatu variabel.
                let partial_eta_sq_val = if config.options.est_effect_size {
                    if t_val.is_nan() {
                        f64::NAN
                    } else if df_error_val == 0.0 {
                        if beta_val.abs() > 1e-9 { 1.0 } else { f64::NAN }
                    } else {
                        let t_sq = t_val.powi(2);
                        let den = t_sq + df_error_val;
                        if den.abs() > 1e-12 {
                            (t_sq / den).max(0.0).min(1.0)
                        } else if t_sq.abs() < 1e-12 {
                            0.0
                        } else {
                            f64::NAN
                        }
                    }
                } else {
                    f64::NAN
                };

                // Observed Power:
                // Menghitung probabilitas menolak hipotesis nol yang salah, berdasarkan
                // ukuran efek yang diamati di sampel.
                let (non_cent_param, obs_power) = if config.options.obs_power {
                    let non_cent_param = if t_val.is_nan() { f64::NAN } else { t_val.abs() };
                    let obs_power = if t_val.is_nan() || df_error_usize == 0 {
                        f64::NAN
                    } else {
                        calculate_observed_power_t(t_val.abs(), df_error_usize, Some(sig_level))
                    };
                    (non_cent_param, obs_power)
                } else {
                    (f64::NAN, f64::NAN)
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
            // Kasus di mana parameter tidak ditemukan dalam peta estimasi (seharusnya tidak terjadi
            // dalam alur normal, tetapi ditangani sebagai tindakan pengamanan).
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

        // Menyusun hasil perhitungan untuk parameter saat ini ke dalam struct.
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

    // Langkah 5: Membuat catatan akhir untuk output.
    let mut notes = Vec::new();
    let mut note_letter = 'a';

    // Add dependent variable name to notes for frontend consumption
    notes.push(format!("Dependent Variable:{}", config.main.dep_var.as_ref().unwrap()));
    notes.push(format!("Computed using alpha:{}", sig_level));

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

    let note = if notes.is_empty() { None } else { Some(notes.join(" \n")) };
    let interpretation = Some(
        "Parameter estimates (B) represent the change in the dependent variable for a one-unit change in the predictor. The t-test checks if each parameter is significantly different from zero (p < .05). The confidence interval provides a range for the true parameter value. Redundant parameters are set to zero due to multicollinearity.".to_string()
    );

    Ok(ParameterEstimates { estimates, note, interpretation })
}
