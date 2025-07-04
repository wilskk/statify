use nalgebra::{ DMatrix, DVector };

use crate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ ConfidenceInterval, RobustParameterEstimateEntry, RobustParameterEstimates },
};

use super::core::*;

/// Menghitung estimasi parameter dengan robust standard errors.
/// Fungsi ini mengimplementasikan metode "sandwich estimator" untuk menyesuaikan
/// standard error dari koefisien regresi terhadap heteroskedastisitas.
pub fn calculate_robust_parameter_estimates(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<RobustParameterEstimates, String> {
    if !config.options.param_est_rob_std_err {
        return Err("Robust parameter estimates not requested in configuration".to_string());
    }

    // Langkah 1: Membuat matriks desain (X), vektor respons (y), dan bobot (W)
    let design_info = match create_design_response_weights(data, config) {
        Ok(info) => info,
        Err(e) => {
            return Err(format!("Failed to create design matrix for robust SE: {}", e));
        }
    };

    // Langkah 2: Membuat cross-product matrix (Z'WZ) di mana Z = [X y]
    let ztwz_matrix = match create_cross_product_matrix(&design_info) {
        Ok(matrix) => matrix,
        Err(e) => {
            return Err(format!("Failed to create cross-product matrix for robust SE: {}", e));
        }
    };

    // Langkah 3: Melakukan operasi SWEEP pada cross-product matrix untuk mendapatkan
    // estimasi beta (koefisien regresi) dan invers dari (X'WX).
    let swept_info = match
        perform_sweep_and_extract_results(&ztwz_matrix, design_info.p_parameters)
    {
        Ok(info) => info,
        Err(e) => {
            return Err(format!("Failed to perform sweep operation for robust SE: {}", e));
        }
    };

    let x = &design_info.x;
    let y = &design_info.y;
    let n_samples = design_info.n_samples;
    let p_cols_x = design_info.p_parameters;
    let r_x_rank = design_info.r_x_rank;

    // Penanganan kasus jika tidak ada data atau parameter
    if n_samples == 0 || p_cols_x == 0 {
        return Ok(RobustParameterEstimates {
            estimates: Vec::new(),
            notes: vec![
                "No data or parameters for robust estimation (after design matrix creation).".to_string()
            ],
        });
    }

    // Penanganan kasus jika model kosong atau semua parameter redundan
    if r_x_rank == 0 && n_samples > 0 {
        let param_names_result = generate_all_row_parameter_names_sorted(&design_info, data);
        let param_names = param_names_result.unwrap_or_else(|_|
            (0..p_cols_x).map(|i| format!("Param_{}", i + 1)).collect()
        );

        let mut estimates = Vec::new();
        for i in 0..p_cols_x {
            estimates.push(RobustParameterEstimateEntry {
                parameter: param_names
                    .get(i)
                    .cloned()
                    .unwrap_or_else(|| format!("Param_{}", i + 1)),
                b: 0.0,
                robust_std_error: 0.0,
                t_value: f64::NAN,
                significance: f64::NAN,
                confidence_interval: ConfidenceInterval {
                    lower_bound: f64::NAN,
                    upper_bound: f64::NAN,
                },
                is_redundant: true,
            });
        }
        let notes = vec![
            "All parameters are redundant or model is empty (after design matrix creation).".to_string()
        ];
        return Ok(RobustParameterEstimates { estimates, notes });
    }

    let beta_hat = &swept_info.beta_hat;
    let g_inv = &swept_info.g_inv;

    // Langkah 4: Menghitung nilai prediksi (y_hat) dan residual (e)
    // Rumus: y_hat = X * beta_hat
    //        e = y - y_hat
    let y_hat = x * beta_hat;
    let residuals = y - y_hat;

    // Langkah 5: Menghitung leverage (h_ii) untuk setiap observasi.
    // Leverage adalah diagonal dari Hat Matrix (H = X * (X'X)^-1 * X').
    // h_ii mengukur seberapa besar pengaruh observasi i terhadap nilai prediksinya sendiri.
    let h_diag: Vec<f64> = (0..n_samples)
        .map(|i| {
            if g_inv.ncols() > 0 && g_inv.nrows() > 0 {
                let x_i_row_vec = x.row(i);
                if
                    x_i_row_vec.ncols() == g_inv.nrows() &&
                    g_inv.ncols() == x_i_row_vec.transpose().nrows() &&
                    x_i_row_vec.ncols() > 0
                {
                    let h_i_matrix = &x_i_row_vec * g_inv * x_i_row_vec.transpose();
                    h_i_matrix[(0, 0)]
                } else {
                    0.0
                }
            } else {
                0.0
            }
        })
        .collect();

    // Langkah 6: Menghitung elemen diagonal dari matriks Omega (Ω).
    // Omega digunakan untuk menyesuaikan varians residual. Perhitungannya bervariasi
    // tergantung pada metode koreksi heteroskedastisitas (HC) yang dipilih.
    let mut omega_diag_elements_vec = Vec::with_capacity(n_samples);
    let epsilon = 1e-12; // Toleransi untuk perbandingan floating-point

    for i in 0..n_samples {
        let residual_sq = residuals[i].powi(2);
        let g_i = design_info.w.as_ref().map_or(1.0, |w_vec| w_vec[i]);
        let u_i = g_i * residual_sq;
        let current_h_i = h_diag.get(i).cloned().unwrap_or(0.0);

        let omega_val: f64;

        if config.options.hc0 {
            // HC0: Estimator asli dari White. Tidak ada koreksi untuk leverage.
            // Rumus: Ω_i = u_i
            omega_val = u_i;
        } else if config.options.hc1 {
            // HC1: Koreksi untuk sampel terbatas (finite sample).
            // Rumus: Ω_i = u_i * (N / (N - k))
            if (n_samples as f64) > (r_x_rank as f64) + epsilon {
                let denominator_hc1 = (n_samples as f64) - (r_x_rank as f64);
                let factor = (n_samples as f64) / denominator_hc1;
                omega_val = u_i * factor;
            } else {
                omega_val = u_i;
            }
        } else if config.options.hc2 {
            // HC2: Koreksi berbasis leverage.
            // Rumus: Ω_i = u_i / (1 - h_ii)
            let one_minus_h = 1.0 - current_h_i;
            if one_minus_h > epsilon {
                if u_i == 0.0 {
                    omega_val = 0.0;
                } else {
                    omega_val = u_i / one_minus_h;
                }
            } else {
                omega_val = u_i;
            }
        } else if config.options.hc3 {
            // HC3: Estimator jackknife aproksimatif. Memberikan perlindungan lebih
            // terhadap titik-titik dengan leverage tinggi.
            // Rumus: Ω_i = u_i / (1 - h_ii)^2
            let one_minus_h = 1.0 - current_h_i;
            if one_minus_h.abs() < f64::EPSILON || one_minus_h <= f64::EPSILON {
                omega_val = 0.0;
            } else {
                if u_i == 0.0 {
                    omega_val = 0.0;
                } else {
                    omega_val = u_i / one_minus_h.powi(2);
                }
            }
        } else if config.options.hc4 {
            // HC4: Modifikasi HC untuk mengatasi leverage tinggi, terutama dalam sampel kecil.
            // Rumus: Ω_i = u_i / (1 - h_ii)^δ_i, di mana δ_i adalah fungsi dari h_ii.
            let one_minus_h = 1.0 - current_h_i;
            if one_minus_h > epsilon {
                let delta_i_p_param = r_x_rank as f64;
                let delta_i = if delta_i_p_param < epsilon {
                    4.0f64
                } else {
                    (4.0f64).min(((n_samples as f64) * current_h_i) / delta_i_p_param)
                };
                if u_i == 0.0 {
                    omega_val = 0.0;
                } else {
                    omega_val = u_i / one_minus_h.powf(delta_i);
                }
            } else {
                omega_val = u_i;
            }
        } else {
            // Default ke logika HC3 jika tidak ada yang ditentukan secara eksplisit.
            let one_minus_h = 1.0 - current_h_i;
            if one_minus_h.abs() < f64::EPSILON || one_minus_h <= f64::EPSILON {
                omega_val = 0.0;
            } else {
                if u_i == 0.0 {
                    omega_val = 0.0;
                } else {
                    omega_val = u_i / one_minus_h.powi(2);
                }
            }
        }
        omega_diag_elements_vec.push(omega_val);
    }
    let omega_hat_matrix = DMatrix::from_diagonal(&DVector::from_vec(omega_diag_elements_vec));

    // Langkah 7: Membangun "sandwich estimator" untuk matriks kovariansi yang robust.
    // Rumus: Cov(β) = (X'WX)^-1 * (X'W * Ω * WX) * (X'WX)^-1
    //         Bread = (X'WX)^-1 = g_inv
    //         Meat  = X'W * Ω * WX
    let bread = g_inv;
    let meat = {
        let xt = x.transpose();
        let n_samples_for_w = design_info.n_samples;

        let w_sqrt_diag_mat = if let Some(w_vector) = &design_info.w {
            DMatrix::from_diagonal(&w_vector.map(|val| val.sqrt()))
        } else {
            if n_samples_for_w > 0 {
                DMatrix::identity(n_samples_for_w, n_samples_for_w)
            } else {
                DMatrix::zeros(0, 0)
            }
        };

        if
            xt.ncols() == w_sqrt_diag_mat.nrows() &&
            w_sqrt_diag_mat.ncols() == omega_hat_matrix.nrows() &&
            omega_hat_matrix.ncols() == w_sqrt_diag_mat.nrows() &&
            w_sqrt_diag_mat.ncols() == x.nrows() &&
            xt.ncols() > 0 &&
            x.ncols() > 0
        {
            &xt * &w_sqrt_diag_mat * &omega_hat_matrix * &w_sqrt_diag_mat * x
        } else {
            DMatrix::zeros(bread.nrows(), bread.ncols())
        }
    };

    let robust_cov = if
        bread.ncols() == meat.nrows() &&
        meat.ncols() == bread.nrows() &&
        bread.ncols() > 0 &&
        meat.nrows() > 0
    {
        bread * meat * bread
    } else {
        DMatrix::zeros(p_cols_x, p_cols_x)
    };

    // Langkah 8: Menghitung robust standard errors.
    // Ini adalah akar kuadrat dari diagonal matriks kovariansi robust.
    let robust_se_vec: Vec<f64> = (0..p_cols_x)
        .map(|i| {
            if i < robust_cov.nrows() && i < robust_cov.ncols() {
                let cov_val = robust_cov[(i, i)];
                if cov_val.is_nan() {
                    f64::NAN
                } else if cov_val < -epsilon {
                    f64::NAN // Varians negatif tidak valid
                } else {
                    cov_val.max(0.0).sqrt()
                }
            } else {
                f64::NAN
            }
        })
        .collect();

    let parameter_names_result = generate_all_row_parameter_names_sorted(&design_info, data);
    let parameter_names = parameter_names_result.unwrap_or_else(|_err|
        (0..p_cols_x).map(|idx| format!("Parameter {}", idx + 1)).collect()
    );

    // Langkah 9: Memformat hasil akhir, termasuk t-value, signifikansi, dan interval kepercayaan.
    let mut estimates = Vec::new();
    let df_residuals = if n_samples > r_x_rank { (n_samples - r_x_rank) as usize } else { 0 };
    let aliasing_threshold = 1e-9;

    for i in 0..p_cols_x {
        let param_b = if i < beta_hat.len() { beta_hat[i] } else { 0.0 };
        let mut param_robust_se = robust_se_vec.get(i).cloned().unwrap_or(f64::NAN);

        // Menentukan apakah parameter redundan (teraliasi) berdasarkan diagonal matriks G-inverse.
        // Jika nilai diagonal mendekati nol, parameter tersebut dianggap redundan.
        let g_inv_diag_is_small = if i < g_inv.nrows() && i < g_inv.ncols() {
            g_inv[(i, i)].abs() < aliasing_threshold
        } else {
            true
        };
        let is_redundant = g_inv_diag_is_small;

        // Untuk parameter redundan, setel koefisien dan standard error ke nol.
        let final_b = if is_redundant { 0.0 } else { param_b };
        if is_redundant {
            param_robust_se = 0.0;
        }

        // Hitung t-value, signifikansi (p-value), dan interval kepercayaan (CI).
        // T-value: mengukur seberapa banyak standard error koefisien dari nol. Rumus: b / SE
        // Signifikansi: probabilitas mengamati t-value yang lebih ekstrem.
        // CI: rentang di mana nilai parameter populasi sebenarnya kemungkinan besar berada.
        let (t_value, significance, ci_lower, ci_upper) = if
            is_redundant ||
            param_robust_se.is_nan() ||
            param_robust_se.abs() < epsilon ||
            df_residuals == 0
        {
            (f64::NAN, f64::NAN, f64::NAN, f64::NAN)
        } else {
            let t_val = final_b / param_robust_se;
            let sig = calculate_t_significance(t_val, df_residuals);
            let t_critical_res = calculate_t_critical(Some(config.options.sig_level), df_residuals);
            let ci_width = param_robust_se * t_critical_res;
            (t_val, sig, final_b - ci_width, final_b + ci_width)
        };

        estimates.push(RobustParameterEstimateEntry {
            parameter: parameter_names
                .get(i)
                .cloned()
                .unwrap_or_else(|| format!("Parameter {}", i + 1)),
            b: final_b,
            robust_std_error: param_robust_se,
            t_value,
            significance,
            confidence_interval: ConfidenceInterval {
                lower_bound: ci_lower,
                upper_bound: ci_upper,
            },
            is_redundant,
        });
    }

    let mut notes = Vec::new();
    let hc_method_str = if config.options.hc0 {
        "HC0 (White's original estimator)"
    } else if config.options.hc1 {
        "HC1 (Finite sample correction)"
    } else if config.options.hc2 {
        "HC2 (Leverage adjustment)"
    } else if config.options.hc4 {
        "HC4 (Cribari-Neto adjustment)"
    } else {
        "HC3 (Approximate Jackknife estimator - default)"
    };

    notes.push(format!("a. Robust standard errors calculated using {} method.", hc_method_str));
    notes.push(
        format!(
            "b. Confidence intervals and t-tests computed using alpha = {:.3}.",
            config.options.sig_level
        )
    );

    Ok(RobustParameterEstimates { estimates, notes })
}
