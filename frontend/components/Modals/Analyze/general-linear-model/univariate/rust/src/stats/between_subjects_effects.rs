use std::collections::HashMap;
use nalgebra::{ DMatrix, DVector };

use crate::models::{
    config::{ SumOfSquaresMethod, UnivariateConfig },
    data::AnalysisData,
    result::{ DesignMatrixInfo, SweptMatrixInfo, TestEffectEntry, TestsBetweenSubjectsEffects },
};

use super::core::*;

/// Menghitung efek antar-subjek untuk model statistik
///
/// Fungsi ini melakukan analisis varians (ANOVA) untuk menguji efek antar-subjek
/// dengan berbagai metode sum of squares (Type I, II, III, IV)
pub fn calculate_tests_between_subjects_effects(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<TestsBetweenSubjectsEffects, String> {
    // Membuat matriks desain dan informasi terkait untuk analisis
    let design_info = create_design_response_weights(data, config).map_err(|e| {
        format!("Failed to create design matrix for Between Subjects Effects: {}", e)
    })?;

    // Penanganan kasus khusus: tidak ada data atau parameter
    if design_info.n_samples == 0 {
        return create_empty_results(&design_info, config);
    }
    if
        design_info.p_parameters == 0 &&
        config.model.sum_of_square_method != SumOfSquaresMethod::TypeI
    {
        return create_empty_results(&design_info, config);
    }

    // Membuat matriks cross-product (Z'WZ) untuk perhitungan statistik
    let ztwz_matrix = create_cross_product_matrix(&design_info).map_err(|e| {
        format!("Failed to create cross-product matrix: {}", e)
    })?;

    // Melakukan sweep penuh untuk hasil model keseluruhan
    // SWEEP adalah algoritma untuk menyelesaikan sistem persamaan linear
    let swept_info_full_model_option = if design_info.p_parameters > 0 {
        perform_sweep_and_extract_results(&ztwz_matrix, design_info.p_parameters).ok()
    } else {
        // Jika tidak ada parameter, buat matriks kosong dengan RSS dari elemen diagonal
        Some(SweptMatrixInfo {
            g_inv: DMatrix::zeros(0, 0),
            beta_hat: DVector::zeros(0),
            s_rss: ztwz_matrix[(0, 0)],
        })
    };

    let swept_info = swept_info_full_model_option
        .as_ref()
        .ok_or_else(||
            format!(
                "SWEEP info required for {:?} SS but not available.",
                config.model.sum_of_square_method
            )
        )?;

    // HashMap untuk menyimpan hasil tes setiap efek
    let mut current_source_map: HashMap<String, TestEffectEntry> = HashMap::new();

    // ===== PERHITUNGAN STATISTIK DASAR =====

    // Menghitung rata-rata variabel dependen (Y)
    let y_mean = design_info.y.mean();

    // Menghitung Total Sum of Squares (TSS) - jumlah kuadrat deviasi dari rata-rata
    // Rumus: TSS = Σ(yi - ȳ)²
    let ss_total_corrected = design_info.y
        .iter()
        .map(|val| (val - y_mean).powi(2))
        .sum::<f64>();

    // Degrees of freedom untuk total (n-1)
    let df_total = design_info.n_samples.saturating_sub(1);

    // Menghitung komponen error (residual)
    let (ss_error, df_error, ms_error) = calculate_error_terms(&design_info, swept_info)?;

    // Menghitung komponen model (explained variance)
    let (ss_model_corrected, df_model_overall) = calculate_model_terms(
        &design_info,
        ss_total_corrected,
        ss_error
    );

    // Menghitung koefisien determinasi (R²) dan adjusted R²
    let (current_r_squared, current_adj_r_squared) = calculate_r_squared_metrics(
        ss_model_corrected,
        ss_total_corrected,
        df_total,
        df_error,
        df_model_overall
    );

    // ===== PERHITUNGAN EFEK INDIVIDUAL =====

    // Daftar semua term dalam model desain
    let all_model_terms_in_design = &design_info.term_names;

    // Iterasi untuk setiap term dalam model
    for term_name in all_model_terms_in_design {
        // Menghitung sum of squares berdasarkan metode yang dipilih
        let (ss_term, df_term) = (match config.model.sum_of_square_method {
            SumOfSquaresMethod::TypeI =>
                // Type I: Sequential SS - efek dihitung berdasarkan urutan dalam model
                calculate_type_i_ss(
                    &design_info,
                    &term_name,
                    all_model_terms_in_design,
                    &swept_info.beta_hat,
                    &swept_info.g_inv,
                    &ztwz_matrix
                ),
            SumOfSquaresMethod::TypeII =>
                // Type II: Hierarchical SS - efek dihitung dengan mempertimbangkan hierarki
                calculate_type_ii_ss(
                    &design_info,
                    &term_name,
                    all_model_terms_in_design,
                    &swept_info.beta_hat,
                    &swept_info.g_inv
                ),
            SumOfSquaresMethod::TypeIII =>
                // Type III: Partial SS - efek dihitung dengan mengontrol efek lain
                calculate_type_iii_ss(
                    &design_info,
                    &term_name,
                    all_model_terms_in_design,
                    &swept_info.beta_hat,
                    &swept_info.g_inv,
                    data,
                    config
                ),
            SumOfSquaresMethod::TypeIV =>
                // Type IV: Marginal SS - untuk desain tidak seimbang
                calculate_type_iv_ss(
                    &design_info,
                    &term_name,
                    all_model_terms_in_design,
                    &swept_info.beta_hat,
                    &swept_info.g_inv,
                    data,
                    config
                ),
        })?;

        // Jika degrees of freedom = 0, buat entry kosong
        if df_term == 0 {
            current_source_map.insert(term_name.clone(), TestEffectEntry::empty_effect(0));
            continue;
        }

        // Membuat entry efek dengan semua statistik yang diperlukan
        let effect_entry = create_effect_entry(
            ss_term,
            df_term,
            ms_error,
            df_error,
            config.options.sig_level,
            config.options.est_effect_size,
            config.options.obs_power
        );
        current_source_map.insert(term_name.clone(), effect_entry);
    }

    // ===== MENAMBAHKAN RINGKASAN MODEL =====

    // Menambahkan entry untuk model keseluruhan, error, dan total
    add_model_summary_entries(
        &mut current_source_map,
        ss_model_corrected,
        df_model_overall,
        ss_error,
        df_error,
        ms_error,
        ss_total_corrected,
        df_total,
        &design_info,
        config
    );

    // ===== MENYIAPKAN CATATAN DAN METADATA =====

    let mut notes = Vec::new();
    if let Some(dep_var) = &config.main.dep_var {
        notes.push(format!("Dependent Variable: {}", dep_var));
    }
    if config.model.sum_of_square_method == SumOfSquaresMethod::TypeI {
        notes.push("Type I SS placeholder due to missing incremental SWEEP.".to_string());
    }
    notes.push(format!("Computed using alpha = {}", config.options.sig_level));
    notes.push(format!("Sum of Squares Method: {:?}", config.model.sum_of_square_method));

    Ok(TestsBetweenSubjectsEffects {
        source: current_source_map,
        r_squared: current_r_squared,
        adjusted_r_squared: current_adj_r_squared,
        note: Some(notes.join("\n")),
        interpretation: Some(
            "This table tests the hypothesis that each effect (e.g., factor or interaction) in the model is null. A significant F-value (Sig. < .05) suggests that the effect significantly contributes to explaining the variance in the dependent variable. The Partial Eta Squared indicates the proportion of variance uniquely explained by that effect.".to_string()
        ),
    })
}

/// Membuat hasil kosong ketika tidak ada data atau parameter
fn create_empty_results(
    design_info: &DesignMatrixInfo,
    config: &UnivariateConfig
) -> Result<TestsBetweenSubjectsEffects, String> {
    // Menghitung rata-rata dan total sum of squares untuk kasus kosong
    let y_mean = design_info.y.mean();
    let ss_total_corrected = if design_info.n_samples > 0 {
        design_info.y
            .iter()
            .map(|val| (val - y_mean).powi(2))
            .sum::<f64>()
    } else {
        0.0
    };

    // Membuat entry untuk "Corrected Total" dengan nilai default
    let mut source = HashMap::new();
    source.insert("Corrected Total".to_string(), TestEffectEntry {
        sum_of_squares: ss_total_corrected,
        df: design_info.n_samples.saturating_sub(1),
        mean_square: if design_info.n_samples > 1 {
            ss_total_corrected / ((design_info.n_samples - 1) as f64)
        } else {
            0.0
        },
        f_value: f64::NAN,
        significance: f64::NAN,
        partial_eta_squared: f64::NAN,
        noncent_parameter: f64::NAN,
        observed_power: f64::NAN,
    });

    Ok(TestsBetweenSubjectsEffects {
        source,
        r_squared: 0.0,
        adjusted_r_squared: 0.0,
        note: Some(
            format!(
                "No data or parameters to analyze for this model. Alpha = {}.",
                config.options.sig_level
            )
        ),
        interpretation: None,
    })
}

/// Menghitung komponen error (residual) dari model
///
/// Returns: (sum of squares error, degrees of freedom error, mean square error)
fn calculate_error_terms(
    design_info: &DesignMatrixInfo,
    swept_info: &SweptMatrixInfo
) -> Result<(f64, usize, f64), String> {
    // Residual Sum of Squares (RSS) dari hasil SWEEP
    let current_ss_error = swept_info.s_rss;

    // Degrees of freedom error = n - rank(X)
    let current_df_error = design_info.n_samples - design_info.r_x_rank;

    // Validasi degrees of freedom error
    if
        current_df_error <= 0 &&
        !(design_info.n_samples == design_info.r_x_rank && design_info.n_samples > 0)
    {
        return Err(format!("Error degrees of freedom ({}) is not positive.", current_df_error));
    }

    // Mean Square Error (MSE) = RSS / df_error
    let current_ms_error = if current_df_error > 0 {
        current_ss_error / (current_df_error as f64)
    } else {
        0.0
    };

    Ok((current_ss_error, current_df_error, current_ms_error))
}

/// Menghitung komponen model (explained variance)
///
/// Returns: (sum of squares model, degrees of freedom model)
fn calculate_model_terms(
    design_info: &DesignMatrixInfo,
    ss_total_corrected: f64,
    ss_error: f64
) -> (f64, usize) {
    // Model Sum of Squares = Total SS - Error SS
    let ss_model_corrected = (ss_total_corrected - ss_error).max(0.0);

    // Degrees of freedom model = rank(X) - (1 jika ada intercept)
    let df_model_overall =
        design_info.r_x_rank - (if design_info.intercept_column.is_some() { 1 } else { 0 });

    (ss_model_corrected, df_model_overall)
}

/// Menghitung koefisien determinasi (R²) dan adjusted R²
///
/// R² = SS_model / SS_total (proporsi varians yang dijelaskan model)
/// Adjusted R² = 1 - [(1-R²)(n-1)/(n-p-1)] (R² yang disesuaikan untuk jumlah parameter)
fn calculate_r_squared_metrics(
    ss_model_corrected: f64,
    ss_total_corrected: f64,
    df_total: usize,
    df_error: usize,
    df_model_overall: usize
) -> (f64, f64) {
    // Koefisien determinasi (R²)
    let current_r_squared = if ss_total_corrected.abs() > 1e-9 {
        (ss_model_corrected / ss_total_corrected).max(0.0).min(1.0)
    } else {
        0.0
    };

    // Adjusted R² untuk mengatasi bias karena jumlah parameter
    let current_adj_r_squared = if df_total > 0 && df_error > 0 && df_total != df_model_overall {
        (1.0 - ((1.0 - current_r_squared) * (df_total as f64)) / (df_error as f64)).max(0.0)
    } else {
        current_r_squared
    };

    (current_r_squared, current_adj_r_squared)
}

/// Menambahkan entry ringkasan model (Model, Error, Total)
///
/// Entry ini memberikan gambaran keseluruhan performa model statistik
fn add_model_summary_entries(
    current_source_map: &mut HashMap<String, TestEffectEntry>,
    ss_model_corrected: f64,
    df_model_overall: usize,
    ss_error: f64,
    df_error: usize,
    ms_error: f64,
    ss_total_corrected: f64,
    df_total: usize,
    design_info: &DesignMatrixInfo,
    config: &UnivariateConfig
) {
    let has_intercept = config.model.intercept;

    if has_intercept {
        // ===== MODEL DENGAN INTERCEPT =====
        // Entry: Corrected Model, Error, Corrected Total, Total

        if df_model_overall > 0 {
            // Mean Square Model
            let ms_model_corrected = ss_model_corrected / (df_model_overall as f64);

            // F-statistic untuk model: F = MS_model / MS_error
            let f_model_corrected = if ms_error > 1e-9 {
                ms_model_corrected / ms_error
            } else {
                f64::NAN
            };

            // Signifikansi F-test
            let sig_model_corrected = calculate_f_significance(
                df_model_overall,
                df_error,
                f_model_corrected
            );

            // Partial Eta Squared (effect size)
            let pes_model_corrected = if config.options.est_effect_size {
                if ss_total_corrected.abs() > 1e-9 {
                    (ss_model_corrected / ss_total_corrected).max(0.0).min(1.0)
                } else {
                    0.0
                }
            } else {
                f64::NAN
            };

            // Non-centrality parameter dan observed power
            let (ncp_model_corrected, power_model_corrected) = if config.options.obs_power {
                let ncp = calculate_f_non_centrality(
                    f_model_corrected,
                    df_model_overall as f64,
                    df_error as f64
                );
                let power = calculate_observed_power_f(
                    f_model_corrected,
                    df_model_overall as f64,
                    df_error as f64,
                    config.options.sig_level
                );
                (ncp, power)
            } else {
                (f64::NAN, f64::NAN)
            };

            // Entry "Corrected Model"
            current_source_map.insert("Corrected Model".to_string(), TestEffectEntry {
                sum_of_squares: ss_model_corrected,
                df: df_model_overall,
                mean_square: ms_model_corrected,
                f_value: f_model_corrected,
                significance: sig_model_corrected,
                partial_eta_squared: pes_model_corrected,
                noncent_parameter: ncp_model_corrected,
                observed_power: power_model_corrected,
            });
        }

        // Entry "Error" (residual)
        current_source_map.insert("Error".to_string(), TestEffectEntry {
            sum_of_squares: ss_error,
            df: df_error,
            mean_square: ms_error,
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: f64::NAN,
            noncent_parameter: f64::NAN,
            observed_power: f64::NAN,
        });

        // Entry "Corrected Total" (total setelah dikoreksi rata-rata)
        current_source_map.insert("Corrected Total".to_string(), TestEffectEntry {
            sum_of_squares: ss_total_corrected,
            df: df_total,
            mean_square: if df_total > 0 {
                ss_total_corrected / (df_total as f64)
            } else {
                0.0
            },
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: f64::NAN,
            noncent_parameter: f64::NAN,
            observed_power: f64::NAN,
        });

        // Entry "Total" (total tanpa koreksi rata-rata)
        let ss_total_uncorrected = design_info.y
            .iter()
            .map(|val| val.powi(2))
            .sum::<f64>();
        let df_total_uncorrected = design_info.n_samples;
        current_source_map.insert("Total".to_string(), TestEffectEntry {
            sum_of_squares: ss_total_uncorrected,
            df: df_total_uncorrected,
            mean_square: if df_total_uncorrected > 0 {
                ss_total_uncorrected / (df_total_uncorrected as f64)
            } else {
                0.0
            },
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: f64::NAN,
            noncent_parameter: f64::NAN,
            observed_power: f64::NAN,
        });
    } else {
        // ===== MODEL TANPA INTERCEPT =====
        // Entry: Model, Error, Total (tanpa corrected model/total)

        // Total Sum of Squares tanpa koreksi
        let ss_total = design_info.y
            .iter()
            .map(|val| val.powi(2))
            .sum::<f64>();
        let df_total = design_info.n_samples;

        // Model Sum of Squares = Total SS - Error SS
        let ss_model = (ss_total - ss_error).max(0.0);
        let df_model = design_info.r_x_rank;

        if df_model > 0 {
            // Mean Square Model
            let ms_model = ss_model / (df_model as f64);

            // F-statistic
            let f_model = if ms_error > 1e-9 { ms_model / ms_error } else { f64::NAN };
            let sig_model = calculate_f_significance(df_model, df_error, f_model);

            // Partial Eta Squared
            let pes_model = if config.options.est_effect_size {
                if ss_total.abs() > 1e-9 { (ss_model / ss_total).max(0.0).min(1.0) } else { 0.0 }
            } else {
                f64::NAN
            };

            // Non-centrality parameter dan observed power
            let (ncp_model, power_model) = if config.options.obs_power {
                let ncp = calculate_f_non_centrality(f_model, df_model as f64, df_error as f64);
                let power = calculate_observed_power_f(
                    f_model,
                    df_model as f64,
                    df_error as f64,
                    config.options.sig_level
                );
                (ncp, power)
            } else {
                (f64::NAN, f64::NAN)
            };

            // Entry "Model"
            current_source_map.insert("Model".to_string(), TestEffectEntry {
                sum_of_squares: ss_model,
                df: df_model,
                mean_square: ms_model,
                f_value: f_model,
                significance: sig_model,
                partial_eta_squared: pes_model,
                noncent_parameter: ncp_model,
                observed_power: power_model,
            });
        }

        // Entry "Error"
        current_source_map.insert("Error".to_string(), TestEffectEntry {
            sum_of_squares: ss_error,
            df: df_error,
            mean_square: ms_error,
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: f64::NAN,
            noncent_parameter: f64::NAN,
            observed_power: f64::NAN,
        });

        // Entry "Total"
        current_source_map.insert("Total".to_string(), TestEffectEntry {
            sum_of_squares: ss_total,
            df: df_total,
            mean_square: if df_total > 0 {
                ss_total / (df_total as f64)
            } else {
                0.0
            },
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: f64::NAN,
            noncent_parameter: f64::NAN,
            observed_power: f64::NAN,
        });
    }
}

/// Membuat TestEffectEntry dengan statistik yang dihitung
///
/// Fungsi ini menghitung semua statistik yang diperlukan untuk satu efek:
/// - Mean Square (MS = SS/df)
/// - F-statistic (F = MS_effect / MS_error)
/// - Signifikansi (p-value dari distribusi F)
/// - Partial Eta Squared (effect size)
/// - Non-centrality parameter dan observed power
pub fn create_effect_entry(
    sum_of_squares: f64,
    df: usize,
    error_ms: f64,
    error_df: usize,
    sig_level: f64,
    est_effect_size: bool,
    obs_power: bool
) -> TestEffectEntry {
    // Mean Square = Sum of Squares / Degrees of Freedom
    let mean_square = if df > 0 { sum_of_squares / (df as f64) } else { 0.0 };

    // F-statistic = MS_effect / MS_error
    let f_value = if error_ms > 0.0 && mean_square > 0.0 { mean_square / error_ms } else { 0.0 };

    // Signifikansi (p-value) dari distribusi F
    let significance = if f_value > 0.0 {
        calculate_f_significance(df, error_df, f_value)
    } else {
        1.0
    };

    // Partial Eta Squared (effect size)
    // Rumus: η²p = SS_effect / (SS_effect + SS_error)
    let partial_eta_squared = if est_effect_size {
        if sum_of_squares >= 0.0 && error_df > 0 {
            let error_ss = error_ms * (error_df as f64);
            let eta_sq = sum_of_squares / (sum_of_squares + error_ss);
            eta_sq.max(0.0).min(1.0)
        } else {
            0.0
        }
    } else {
        f64::NAN
    };

    // Non-centrality parameter dan observed power
    let (noncent_parameter, observed_power) = if obs_power {
        // Non-centrality parameter = F * df_effect
        let noncent_parameter = if f_value > 0.0 { f_value * (df as f64) } else { 0.0 };

        // Observed power (probabilitas menolak H0 yang salah)
        let observed_power = if f_value > 0.0 {
            calculate_observed_power_f(f_value, df as f64, error_df as f64, sig_level)
        } else {
            0.0
        };
        (noncent_parameter, observed_power)
    } else {
        (f64::NAN, f64::NAN)
    };

    TestEffectEntry {
        sum_of_squares,
        df,
        mean_square,
        f_value,
        significance,
        partial_eta_squared,
        noncent_parameter,
        observed_power,
    }
}
