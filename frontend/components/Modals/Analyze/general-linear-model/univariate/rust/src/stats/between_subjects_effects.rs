use nalgebra::{ DMatrix, DVector };

use crate::models::{
    config::{ SumOfSquaresMethod, UnivariateConfig },
    data::AnalysisData,
    result::{
        DesignMatrixInfo,
        SourceEntry,
        SweptMatrixInfo,
        TestEffectEntry,
        TestsBetweenSubjectsEffects,
    },
};

use super::core::*;

/// Menghitung efek antar-subjek untuk model statistik
pub fn calculate_tests_between_subjects_effects(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<TestsBetweenSubjectsEffects, String> {
    // Langkah 1: Membuat matriks desain dan informasi terkait untuk analisis
    let design_info = create_design_response_weights(data, config).map_err(|e| {
        format!("Failed to create design matrix for Between Subjects Effects: {}", e)
    })?;

    // Langkah 2: Membuat matriks cross-product (Z'WZ) untuk perhitungan statistik
    let ztwz_matrix = create_cross_product_matrix(&design_info).map_err(|e| {
        format!("Failed to create cross-product matrix: {}", e)
    })?;

    // Langkah 3: Melakukan sweep penuh untuk hasil model keseluruhan
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

    // Langkah 4: Inisialisasi vektor untuk menyimpan hasil tes setiap efek
    let mut final_sources: Vec<SourceEntry> = Vec::new();

    // Langkah 5: Menghitung rata-rata variabel dependen (Y)
    let y_mean = design_info.y.mean();

    // Langkah 6: Menghitung Total Sum of Squares (TSS) - jumlah kuadrat deviasi dari rata-rata
    let ss_total_corrected = design_info.y
        .iter()
        .map(|val| (val - y_mean).powi(2))
        .sum::<f64>();

    // Degrees of freedom untuk total (n-1)
    let df_total = design_info.n_samples.saturating_sub(1);

    // Langkah 7: Menghitung komponen error (residual)
    let (ss_error, df_error, ms_error) = calculate_error_terms(&design_info, swept_info)?;

    // Langkah 8: Menghitung komponen model (explained variance)
    let (ss_model_corrected, df_model_overall) = calculate_model_terms(
        &design_info,
        ss_total_corrected,
        ss_error
    );

    // Langkah 9: Menghitung koefisien determinasi (R²) dan adjusted R²
    let (current_r_squared, current_adj_r_squared) = calculate_r_squared_metrics(
        ss_model_corrected,
        ss_total_corrected,
        df_total,
        df_error,
        df_model_overall
    );

    // Langkah 10: Daftar semua term dalam model desain
    let all_model_terms_in_design = &design_info.term_names;

    // Langkah 11: Iterasi untuk setiap term dalam model
    for term_name in all_model_terms_in_design {
        // Menghitung sum of squares berdasarkan metode yang dipilih
        let (ss_term, df_term) = (match config.model.sum_of_square_method {
            SumOfSquaresMethod::TypeI => {
                // Type I: Sequential SS - efek dihitung berdasarkan urutan dalam model
                calculate_type_i_ss(
                    &design_info,
                    &term_name,
                    all_model_terms_in_design,
                    &swept_info.beta_hat,
                    &swept_info.g_inv,
                    &ztwz_matrix
                )
            }
            SumOfSquaresMethod::TypeII => {
                // Type II: Hierarchical SS - efek dihitung dengan mempertimbangkan hierarki
                calculate_type_ii_ss(
                    &design_info,
                    &term_name,
                    all_model_terms_in_design,
                    &swept_info.beta_hat,
                    &swept_info.g_inv
                )
            }
            SumOfSquaresMethod::TypeIII => {
                // Type III: Partial SS - efek dihitung dengan mengontrol efek lain
                calculate_type_iii_ss(
                    &design_info,
                    &term_name,
                    all_model_terms_in_design,
                    &swept_info.beta_hat,
                    &swept_info.g_inv,
                    data,
                    config
                )
            }
            SumOfSquaresMethod::TypeIV => {
                // Type IV: Marginal SS - untuk desain tidak seimbang
                calculate_type_iv_ss(
                    &design_info,
                    &term_name,
                    all_model_terms_in_design,
                    &swept_info.beta_hat,
                    &swept_info.g_inv,
                    data,
                    config
                )
            }
        })?;

        // Langkah 12: Jika degrees of freedom = 0, buat entry kosong
        if df_term == 0 {
            final_sources.push(SourceEntry {
                name: term_name.clone(),
                effect: TestEffectEntry::empty_effect(0),
            });
            continue;
        }

        // Langkah 13: Membuat entry efek dengan semua statistik yang diperlukan
        //
        // Statistik yang dihitung: Mean Square, F-statistic, signifikansi, effect size, power
        let effect_entry = create_effect_entry(
            ss_term,
            df_term,
            ms_error,
            df_error,
            config.options.sig_level,
            config.options.est_effect_size,
            config.options.obs_power
        );
        final_sources.push(SourceEntry { name: term_name.clone(), effect: effect_entry });
    }

    // Langkah 14: Menambahkan entry untuk model keseluruhan, error, dan total
    add_model_summary_entries(
        &mut final_sources,
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

    // Langkah 15: Mengurutkan hasil sesuai urutan standar
    final_sources.sort_by_key(|s| {
        match s.name.as_str() {
            "Corrected Model" | "Model" => 0,
            "Intercept" => 1,
            s if s.contains('*') => 3, // Efek interaksi
            "Error" => 4,
            "Total" => 5,
            "Corrected Total" => 6,
            _ => 2, // Efek utama
        }
    });

    // Langkah 16: Menyiapkan catatan dan metadata
    //
    // Catatan berisi informasi tentang variabel dependen, level signifikansi, metode SS, dan R²
    let mut notes = Vec::new();
    if let Some(dep_var) = &config.main.dep_var {
        notes.push(format!("Dependent Variable: {}", dep_var));
    }
    notes.push(format!("Computed using alpha = {}", config.options.sig_level));
    notes.push(format!("Sum of Squares Method: {:?}", config.model.sum_of_square_method));
    notes.push(format!("R Squared = {:.4}", current_r_squared));
    notes.push(format!("Adjusted R Squared = {:.4}", current_adj_r_squared));

    // Langkah 17: Mengembalikan hasil analisis ANOVA
    //
    // Struktur TestsBetweenSubjectsEffects berisi:
    // - sources: Daftar semua efek yang diuji dengan statistik lengkap
    // - note: Catatan tentang parameter analisis
    // - interpretation: Penjelasan tentang arti dari hasil
    Ok(TestsBetweenSubjectsEffects {
        sources: final_sources,
        note: Some(notes.join("\n")),
        interpretation: Some(
            "This table tests the hypothesis that each effect (e.g., factor or interaction) in the model is null. A significant F-value (Sig. < .05) suggests that the effect significantly contributes to explaining the variance in the dependent variable. The Partial Eta Squared indicates the proportion of variance uniquely explained by that effect.".to_string()
        ),
    })
}

/// Menghitung komponen error (residual) dari model
fn calculate_error_terms(
    design_info: &DesignMatrixInfo,
    swept_info: &SweptMatrixInfo
) -> Result<(f64, usize, f64), String> {
    // Residual Sum of Squares (RSS) dari hasil SWEEP
    let current_ss_error = swept_info.s_rss;

    // Degrees of freedom error = n - rank(X)
    //
    // df_error = n - p, dimana n = jumlah observasi, p = rank matriks desain
    // df_error mengukur derajat kebebasan untuk estimasi error
    let current_df_error = design_info.n_samples - design_info.r_x_rank;

    // Validasi degrees of freedom error
    //
    // df_error harus positif untuk estimasi yang valid
    // Kecuali dalam kasus khusus ketika n = rank(X) dan n > 0
    if
        current_df_error <= 0 &&
        !(design_info.n_samples == design_info.r_x_rank && design_info.n_samples > 0)
    {
        return Err(format!("Error degrees of freedom ({}) is not positive.", current_df_error));
    }

    // Mean Square Error (MSE) = RSS / df_error
    //
    // MSE adalah estimasi varian error yang tidak bias
    // MSE digunakan sebagai denominator dalam F-statistic
    let current_ms_error = if current_df_error > 0 {
        current_ss_error / (current_df_error as f64)
    } else {
        0.0
    };

    Ok((current_ss_error, current_df_error, current_ms_error))
}

/// Menghitung komponen model (explained variance)
fn calculate_model_terms(
    design_info: &DesignMatrixInfo,
    ss_total_corrected: f64,
    ss_error: f64
) -> (f64, usize) {
    // Model Sum of Squares = Total SS - Error SS
    //
    // MSS mengukur variabilitas yang dapat dijelaskan oleh model
    // MSS tidak boleh negatif (dibatasi ke minimum 0)
    let ss_model_corrected = (ss_total_corrected - ss_error).max(0.0);

    // Degrees of freedom model = rank(X) - (1 jika ada intercept)
    //
    // df_model = p - 1 jika ada intercept, p jika tidak ada intercept
    // dimana p = rank matriks desain
    let df_model_overall =
        design_info.r_x_rank - (if design_info.intercept_column.is_some() { 1 } else { 0 });

    (ss_model_corrected, df_model_overall)
}

/// Menghitung koefisien determinasi (R²) dan adjusted R²
fn calculate_r_squared_metrics(
    ss_model_corrected: f64,
    ss_total_corrected: f64,
    df_total: usize,
    df_error: usize,
    df_model_overall: usize
) -> (f64, f64) {
    // Koefisien determinasi (R²)
    //
    // R² = SS_model / SS_total
    // R² dibatasi antara 0 dan 1
    let current_r_squared = if ss_total_corrected.abs() > 1e-9 {
        (ss_model_corrected / ss_total_corrected).max(0.0).min(1.0)
    } else {
        0.0
    };

    // Adjusted R² untuk mengatasi bias karena jumlah parameter
    //
    // R²_adj = 1 - [(1-R²)(n-1)/(n-p-1)]
    // R²_adj menyesuaikan R² untuk kompleksitas model
    let current_adj_r_squared = if df_total > 0 && df_error > 0 && df_total != df_model_overall {
        (1.0 - ((1.0 - current_r_squared) * (df_total as f64)) / (df_error as f64)).max(0.0)
    } else {
        current_r_squared
    };

    (current_r_squared, current_adj_r_squared)
}

/// Menambahkan entry ringkasan model (Model, Error, Total)
fn add_model_summary_entries(
    final_sources: &mut Vec<SourceEntry>,
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
        // Model dengan Intercept
        // Entry: Corrected Model, Error, Corrected Total, Total
        //
        // Model dengan intercept mengoreksi rata-rata dalam perhitungan SS

        if df_model_overall > 0 {
            // Mean Square Model
            //
            // MS_model = SS_model / df_model
            let ms_model_corrected = ss_model_corrected / (df_model_overall as f64);

            // F-statistic untuk model: F = MS_model / MS_error
            //
            // F-statistic menguji signifikansi keseluruhan model
            let f_model_corrected = if ms_error > 1e-9 {
                ms_model_corrected / ms_error
            } else {
                f64::NAN
            };

            // Signifikansi F-test
            //
            // p-value dari distribusi F dengan df_model dan df_error
            let sig_model_corrected = calculate_f_significance(
                df_model_overall,
                df_error,
                f_model_corrected
            );

            // Partial Eta Squared (effect size)
            //
            // η²p = SS_model / SS_total
            // Effect size mengukur kekuatan efek
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
            //
            // Non-centrality parameter = F * df_model
            // Observed power = probabilitas menolak H0 yang salah
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
            final_sources.push(SourceEntry {
                name: "Corrected Model".to_string(),
                effect: TestEffectEntry {
                    sum_of_squares: ss_model_corrected,
                    df: df_model_overall,
                    mean_square: ms_model_corrected,
                    f_value: f_model_corrected,
                    significance: sig_model_corrected,
                    partial_eta_squared: pes_model_corrected,
                    noncent_parameter: ncp_model_corrected,
                    observed_power: power_model_corrected,
                },
            });
        }

        // Entry "Error" (residual)
        //
        // Error entry tidak memiliki F-statistic karena merupakan denominator
        final_sources.push(SourceEntry {
            name: "Error".to_string(),
            effect: TestEffectEntry {
                sum_of_squares: ss_error,
                df: df_error,
                mean_square: ms_error,
                f_value: f64::NAN,
                significance: f64::NAN,
                partial_eta_squared: f64::NAN,
                noncent_parameter: f64::NAN,
                observed_power: f64::NAN,
            },
        });

        // Entry "Corrected Total" (total setelah dikoreksi rata-rata)
        //
        // Corrected total = SS_total - SS_intercept
        final_sources.push(SourceEntry {
            name: "Corrected Total".to_string(),
            effect: TestEffectEntry {
                sum_of_squares: ss_total_corrected,
                df: df_total,
                mean_square: f64::NAN,
                f_value: f64::NAN,
                significance: f64::NAN,
                partial_eta_squared: f64::NAN,
                noncent_parameter: f64::NAN,
                observed_power: f64::NAN,
            },
        });

        // Entry "Total" (total tanpa koreksi rata-rata)
        //
        // Total tanpa koreksi = Σy²
        let ss_total_uncorrected = design_info.y
            .iter()
            .map(|val| val.powi(2))
            .sum::<f64>();
        let df_total_uncorrected = design_info.n_samples;
        final_sources.push(SourceEntry {
            name: "Total".to_string(),
            effect: TestEffectEntry {
                sum_of_squares: ss_total_uncorrected,
                df: df_total_uncorrected,
                mean_square: f64::NAN,
                f_value: f64::NAN,
                significance: f64::NAN,
                partial_eta_squared: f64::NAN,
                noncent_parameter: f64::NAN,
                observed_power: f64::NAN,
            },
        });
    } else {
        // Model Tanpa Intercept
        // Entry: Model, Error, Total (tanpa corrected model/total)
        //
        // Model tanpa intercept tidak mengoreksi rata-rata

        // Total Sum of Squares tanpa koreksi
        //
        // Total = Σy² (tanpa koreksi rata-rata)
        let ss_total = design_info.y
            .iter()
            .map(|val| val.powi(2))
            .sum::<f64>();
        let df_total = design_info.n_samples;

        // Model Sum of Squares = Total SS - Error SS
        //
        // Model SS = SS_total - SS_error
        let ss_model = (ss_total - ss_error).max(0.0);
        let df_model = design_info.r_x_rank;

        if df_model > 0 {
            // Mean Square Model
            //
            // MS_model = SS_model / df_model
            let ms_model = ss_model / (df_model as f64);

            // F-statistic
            //
            // F = MS_model / MS_error
            let f_model = if ms_error > 1e-9 { ms_model / ms_error } else { f64::NAN };
            let sig_model = calculate_f_significance(df_model, df_error, f_model);

            // Partial Eta Squared
            //
            // η²p = SS_model / SS_total
            let pes_model = if config.options.est_effect_size {
                if ss_total.abs() > 1e-9 { (ss_model / ss_total).max(0.0).min(1.0) } else { 0.0 }
            } else {
                f64::NAN
            };

            // Non-centrality parameter dan observed power
            //
            // Non-centrality parameter dan observed power untuk model tanpa intercept
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
            final_sources.push(SourceEntry {
                name: "Model".to_string(),
                effect: TestEffectEntry {
                    sum_of_squares: ss_model,
                    df: df_model,
                    mean_square: ms_model,
                    f_value: f_model,
                    significance: sig_model,
                    partial_eta_squared: pes_model,
                    noncent_parameter: ncp_model,
                    observed_power: power_model,
                },
            });
        }

        // Entry "Error"
        //
        // Error entry untuk model tanpa intercept
        final_sources.push(SourceEntry {
            name: "Error".to_string(),
            effect: TestEffectEntry {
                sum_of_squares: ss_error,
                df: df_error,
                mean_square: ms_error,
                f_value: f64::NAN,
                significance: f64::NAN,
                partial_eta_squared: f64::NAN,
                noncent_parameter: f64::NAN,
                observed_power: f64::NAN,
            },
        });

        // Entry "Total"
        //
        // Total entry untuk model tanpa intercept
        final_sources.push(SourceEntry {
            name: "Total".to_string(),
            effect: TestEffectEntry {
                sum_of_squares: ss_total,
                df: df_total,
                mean_square: f64::NAN,
                f_value: f64::NAN,
                significance: f64::NAN,
                partial_eta_squared: f64::NAN,
                noncent_parameter: f64::NAN,
                observed_power: f64::NAN,
            },
        });
    }
}

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
    //
    // MS_effect = SS_effect / df_effect
    // Mean square adalah estimasi varian yang tidak bias
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
        // λ = F * df_effect
        let noncent_parameter = if f_value > 0.0 { f_value * (df as f64) } else { 0.0 };

        let observed_power = if f_value > 0.0 {
            calculate_observed_power_f(f_value, df as f64, error_df as f64, sig_level)
        } else {
            0.0
        };
        (noncent_parameter, observed_power)
    } else {
        (f64::NAN, f64::NAN)
    };

    // Mengembalikan TestEffectEntry dengan semua statistik yang dihitung
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
