use crate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ BPTest, DesignMatrixInfo, FTest, HeteroscedasticityTests, ModifiedBPTest, WhiteTest },
};
use nalgebra::{ DMatrix, DVector };
use rayon::prelude::*;
use std::collections::BTreeSet;
use std::f64;

use super::core::*;

/**
 * Menghitung berbagai uji heteroskedastisitas berdasarkan data dan konfigurasi yang diberikan.
 * Fungsi ini mengorkestrasi seluruh proses, mulai dari persiapan data hingga eksekusi setiap
 * jenis uji yang diminta (White, Breusch-Pagan, dll.).
 *
 * @param data - Referensi ke `AnalysisData` yang berisi data mentah.
 * @param config - Konfigurasi model univariat yang menentukan variabel dan opsi uji.
 * @returns `Result<HeteroscedasticityTests, String>` yang berisi hasil uji atau pesan error.
 */
pub fn calculate_heteroscedasticity_tests(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HeteroscedasticityTests, String> {
    // Langkah 1: Buat matriks desain, vektor respons (y), dan bobot dari data mentah.
    let design_info = create_design_response_weights(data, config).map_err(|e|
        format!("Failed to create design matrix for main model: {}", e)
    )?;

    let dep_var_name = config.main.dep_var.clone().unwrap_or_else(|| "Unknown".to_string());
    let design_string = generate_design_string(&design_info);

    // Langkah 2: Buat matriks cross-product (Z'WZ) untuk model utama.
    let ztwz_matrix = create_cross_product_matrix(&design_info).map_err(|e|
        format!("Failed to create Z'WZ matrix for main model: {}", e)
    )?;

    // Langkah 3: Lakukan operasi SWEEP untuk mendapatkan estimasi parameter (beta) dan RSS dari model utama.
    let swept_info = perform_sweep_and_extract_results(
        &ztwz_matrix,
        design_info.p_parameters
    ).map_err(|e| format!("SWEEP failed for main model: {}", e))?;

    // Langkah 4: Hitung nilai prediksi (y_hat) dan sisaan (residuals) dari model utama.
    // Sisaan = y - y_hat
    let y_hat = &design_info.x * &swept_info.beta_hat;
    let residuals_vec = &design_info.y - &y_hat;
    let n_obs = design_info.n_samples;

    // Langkah 5: Kuadratkan sisaan. Vektor ini akan menjadi variabel dependen (y_aux) untuk regresi pembantu.
    let y_aux_for_tests = residuals_vec.map(|e| e.powi(2));

    // Langkah 6: Buat matriks desain pembantu (Z_p) dari nilai prediksi (y_hat).
    // Matriks ini digunakan untuk uji Breusch-Pagan dan F-test.
    let z_pred_matrix_option = create_predicted_aux_matrix(&y_hat, n_obs);

    // Inisialisasi hasil uji.
    let mut white_test_and_names: Option<(WhiteTest, Vec<String>)> = None;
    let mut bp_test_result = None;
    let mut modified_bp_test_result = None;
    let mut f_test_kb_result = None;

    // Langkah 7: Jalankan uji yang diminta dalam konfigurasi.
    if config.options.white_test {
        white_test_and_names = calculate_white_test(&y_aux_for_tests, &design_info, n_obs);
    }

    if let Some(z_p) = &z_pred_matrix_option {
        if config.options.brusch_pagan {
            bp_test_result = calculate_bp_test(&y_aux_for_tests, z_p, n_obs, swept_info.s_rss);
        }
        if config.options.mod_brusch_pagan {
            modified_bp_test_result = calculate_modified_bp_test(&y_aux_for_tests, z_p, n_obs);
        }
        if config.options.f_test {
            f_test_kb_result = calculate_f_test(&y_aux_for_tests, z_p, n_obs);
        }
    }

    // Langkah 8: Tambahkan metadata ke catatan
    let note_string = format!("Dependent Variable: {}. {}", dep_var_name, design_string);

    let mut white_test_result = None;
    if let Some((mut test, aux_names)) = white_test_and_names {
        if !aux_names.is_empty() {
            let unique_simplified_names: BTreeSet<String> = aux_names
                .iter()
                .skip(1) // Skip "Intercept"
                .map(|term| {
                    term.split('*')
                        .map(|part| part.split('[').next().unwrap_or(part))
                        .collect::<Vec<_>>()
                        .join("*")
                })
                .collect();

            let sorted_terms: Vec<String> = unique_simplified_names.into_iter().collect();
            let white_design = format!("Intercept + {}", sorted_terms.join(" + "));
            test.note = Some(
                format!("Dependent Variable: {}. Design: {}", dep_var_name, white_design)
            );
        } else {
            test.note = Some(note_string.clone());
        }
        white_test_result = Some(test);
    }

    if let Some(test) = &mut bp_test_result {
        test.note = Some(note_string.clone());
    }
    if let Some(test) = &mut modified_bp_test_result {
        test.note = Some(note_string.clone());
    }
    if let Some(test) = &mut f_test_kb_result {
        test.note = Some(note_string.clone());
    }

    Ok(HeteroscedasticityTests {
        white: white_test_result,
        breusch_pagan: bp_test_result,
        modified_breusch_pagan: modified_bp_test_result,
        f_test: f_test_kb_result,
    })
}

/**
 * Menjalankan regresi OLS (Ordinary Least Squares) sederhana untuk regresi pembantu.
 * Regresi pembantu digunakan dalam uji heteroskedastisitas, di mana kuadrat sisaan
 * diregresikan pada variabel-variabel tertentu.
 *
 * @param y_aux_vec - Vektor variabel dependen untuk regresi pembantu (biasanya kuadrat sisaan).
 * @param x_aux_matrix - Matriks desain (prediktor) untuk regresi pembantu.
 * @returns Tuple berisi: (R-kuadrat, ESS, RSS, df prediktor, df sisaan).
 *          - R-kuadrat: Koefisien determinasi.
 *          - ESS (Explained Sum of Squares): Jumlah kuadrat penjelas.
 *          - RSS (Residual Sum of Squares): Jumlah kuadrat sisaan.
 *          - df_regressors_in_aux_Z: Jumlah prediktor dalam model pembantu.
 *          - df_residuals_aux: Derajat kebebasan sisaan.
 */
struct OlsResult {
    r_squared: f64,
    ess: f64,
    df_regressors: usize,
    df_residuals: usize,
}

/// Menjalankan regresi Ordinary Least Squares (OLS) menggunakan dekomposisi QR.
/// Metode ini lebih stabil secara numerik daripada membentuk matriks X'X secara eksplisit.
fn run_simple_ols(
    y_aux_vec: &DVector<f64>,
    x_aux_matrix: &DMatrix<f64>
) -> Result<OlsResult, String> {
    let n_obs = y_aux_vec.nrows();
    let n_predictors = x_aux_matrix.ncols();

    if x_aux_matrix.nrows() != n_obs {
        return Err(
            format!(
                "Dimensi tidak cocok: X memiliki {} baris, Y memiliki {} baris.",
                x_aux_matrix.nrows(),
                n_obs
            )
        );
    }

    // Hitung Total Sum of Squares (TSS) terlebih dahulu.
    // Ini akan dibutuhkan di beberapa skenario.
    let y_mean = if n_obs > 0 { y_aux_vec.mean() } else { 0.0 };
    let centered_y = y_aux_vec.add_scalar(-y_mean);
    let tss = centered_y.norm_squared();

    // Kasus khusus: jika tidak ada prediktor (hanya intercept), R-kuadrat adalah 0.
    if n_predictors == 0 {
        return Ok(OlsResult {
            r_squared: 0.0,
            ess: 0.0,
            df_regressors: 0,
            df_residuals: n_obs,
        });
    }

    // OPTIMASI 1: Menggunakan dekomposisi QR untuk stabilitas numerik.
    // Ini menghindari pembentukan (X'X) yang bisa menjadi tidak stabil.
    // Solusi OLS beta = (X'X)^-1 * X'Y setara dengan menyelesaikan R * beta = Q' * Y
    // di mana X = QR.
    let qr = x_aux_matrix.clone().qr();
    let q = qr.q();
    let r = qr.r();

    // Transpose dari Q dikalikan dengan y
    let qty = q.transpose() * y_aux_vec;

    // Selesaikan sistem R * beta = Q'Y. solve_upper_triangular lebih efisien.
    let beta_aux = r
        .solve_upper_triangular(&qty)
        .ok_or_else(||
            "Gagal menyelesaikan sistem linear dengan dekomposisi QR (matriks singular).".to_string()
        )?;

    // OPTIMASI 2: Menghitung RSS lebih dulu, lalu ESS dari TSS.
    // Ini menghindari satu iterasi penuh untuk menghitung ESS secara manual.
    let residuals = y_aux_vec - x_aux_matrix * &beta_aux;
    let rss = residuals.norm_squared(); // Residual Sum of Squares
    let ess = tss - rss; // Explained Sum of Squares

    // Hitung R-kuadrat: R^2 = ESS / TSS
    let r_squared = if tss.abs() < 1e-12 {
        0.0
    } else {
        (ess / tss).max(0.0).min(1.0) // Clamp untuk stabilitas floating point
    };

    let df_residuals = n_obs.saturating_sub(n_predictors);

    Ok(OlsResult {
        r_squared,
        ess,
        df_regressors: n_predictors,
        df_residuals,
    })
}

/**
 * Membuat matriks desain pembantu untuk Uji White.
 * Matriks ini terdiri dari:
 * 1. Intersep.
 * 2. Prediktor-prediktor asli dari model utama (tanpa intersep).
 * 3. Kuadrat dari prediktor-prediktor kontinu.
 * 4. Hasil kali silang (cross-product) dari semua pasangan prediktor.
 *
 * Tujuannya adalah untuk memeriksa apakah varians sisaan berhubungan secara sistematis
 * dengan prediktor, kuadratnya, atau interaksinya.
 */
fn create_white_aux_matrix(
    design_info: &DesignMatrixInfo,
    n_obs: usize
) -> Result<(DMatrix<f64>, Vec<String>), String> {
    if n_obs == 0 {
        return Ok((DMatrix::zeros(0, 0), Vec::new()));
    }

    let predictors = collect_predictors(design_info);

    let mut aux_cols: Vec<DVector<f64>> = Vec::with_capacity(1 + predictors.len() * 2);
    let mut aux_term_names: Vec<String> = Vec::with_capacity(1 + predictors.len() * 2);

    // 1. Tambahkan Intersep
    aux_cols.push(DVector::from_element(n_obs, 1.0));
    aux_term_names.push("Intercept".to_string());

    // Tambahkan prediktor asli ke model pembantu
    for (name, col) in &predictors {
        aux_cols.push(col.clone());
        aux_term_names.push(name.clone());
    }

    // 3. Tambahkan kuadrat dan interaksi secara paralel
    let interaction_terms: Vec<(DVector<f64>, String)> = (0..predictors.len())
        .into_par_iter()
        .flat_map(|i| {
            let (name1, col1) = &predictors[i];
            let base_name1 = name1.split('[').next().unwrap();

            // Interaksi dengan diri sendiri (kuadrat)
            let squared_term = if design_info.covariate_indices.contains_key(base_name1) {
                vec![(col1.component_mul(col1), format!("{}*{}", name1, name1))]
            } else {
                vec![]
            };

            // Interaksi dengan prediktor lain
            let other_interactions: Vec<(DVector<f64>, String)> = (i + 1..predictors.len())
                .into_par_iter()
                .filter_map(|k| {
                    let (name2, col2) = &predictors[k];
                    let base_name2 = name2.split('[').next().unwrap();
                    if base_name1 != base_name2 {
                        let interaction_col = col1.component_mul(col2);
                        let term_name = format!(
                            "{}*{}",
                            std::cmp::min(name1, name2),
                            std::cmp::max(name1, name2)
                        );
                        Some((interaction_col, term_name))
                    } else {
                        None
                    }
                })
                .collect();

            squared_term.into_iter().chain(other_interactions).collect::<Vec<_>>()
        })
        .collect();

    for (col, name) in interaction_terms {
        aux_cols.push(col);
        aux_term_names.push(name);
    }

    if aux_cols.is_empty() {
        Ok((DMatrix::zeros(n_obs, 0), Vec::new()))
    } else {
        Ok((DMatrix::from_columns(&aux_cols), aux_term_names))
    }
}

/**
 * Mengumpulkan prediktor-prediktor dari matriks desain, menangani faktor dan kovariat.
 * Fungsi ini mengekstrak kolom-kolom relevan dari matriks desain utama,
 * menyesuaikan untuk kolinearitas dengan menghilangkan kolom terakhir dari variabel faktor
 * jika model memiliki intersep.
 *
 * @param design_info - Informasi mengenai matriks desain utama.
 * @returns `Vec<(String, DVector<f64>)>` yang berisi nama dan data kolom untuk setiap prediktor.
 */
fn collect_predictors(design_info: &DesignMatrixInfo) -> Vec<(String, DVector<f64>)> {
    let mut predictors: Vec<(String, DVector<f64>)> = Vec::new();
    let mut processed_term_names: BTreeSet<String> = BTreeSet::new();

    for term_name in &design_info.term_names {
        if term_name == "Intercept" || !processed_term_names.insert(term_name.clone()) {
            continue;
        }

        if let Some(&(start, end)) = design_info.term_column_indices.get(term_name) {
            let is_factor = design_info.fixed_factor_indices.contains_key(term_name);
            let num_cols_for_term = end - start + 1;

            let num_cols_to_take = if
                is_factor &&
                design_info.intercept_column.is_some() &&
                num_cols_for_term > 1
            {
                num_cols_for_term - 1
            } else {
                num_cols_for_term
            };

            for i in 0..num_cols_to_take {
                let col_idx = start + i;
                let col_name = if num_cols_for_term > 1 {
                    format!("{}[{}]", term_name, i)
                } else {
                    term_name.clone()
                };
                predictors.push((col_name, design_info.x.column(col_idx).into_owned()));
            }
        }
    }
    predictors
}

/**
 * Membuat matriks desain pembantu untuk uji yang berbasis nilai prediksi (y_hat).
 * Ini digunakan untuk Uji Breusch-Pagan dan Uji-F.
 * Matriks ini sangat sederhana, hanya terdiri dari:
 * 1. Intersep.
 * 2. Vektor nilai prediksi (y_hat) dari model utama.
 */
fn create_predicted_aux_matrix(y_hat: &DVector<f64>, n_obs: usize) -> Option<DMatrix<f64>> {
    if n_obs == 0 {
        return Some(DMatrix::zeros(0, 0));
    }

    let mut aux_cols = vec![DVector::from_element(n_obs, 1.0)];

    if let Some(first) = y_hat.get(0) {
        let is_constant = y_hat
            .iter()
            .skip(1)
            .all(|&v| (v - first).abs() < 1e-9);
        if !is_constant {
            aux_cols.push(y_hat.clone_owned());
        }
    }

    Some(DMatrix::from_columns(&aux_cols))
}

/**
 * Menghitung Uji White untuk heteroskedastisitas.
 *
 * - **Tujuan**: Mendeteksi heteroskedastisitas tanpa membuat asumsi spesifik tentang bentuknya.
 * - **Rumus**: Statistik Lagrange Multiplier (LM) dihitung sebagai `LM = n * R^2`, di mana `n`
 *   adalah jumlah observasi dan `R^2` adalah koefisien determinasi dari regresi pembantu.
 * - **Distribusi**: Statistik LM mengikuti distribusi Chi-kuadrat dengan derajat kebebasan (df)
 *   sama dengan jumlah prediktor dalam regresi pembantu (tidak termasuk intersep).
 * - **Interpretasi**: Nilai-p yang signifikan (misal, < 0.05) menunjukkan adanya heteroskedastisitas.
 */
fn calculate_white_test(
    y_aux: &DVector<f64>,
    design_info: &DesignMatrixInfo,
    n_obs: usize
) -> Option<(WhiteTest, Vec<String>)> {
    // Uji White tidak dapat diterapkan jika tidak ada prediktor (selain intersep) di model utama.
    if design_info.p_parameters - (if design_info.intercept_column.is_some() { 1 } else { 0 }) == 0 {
        return Some((
            WhiteTest {
                statistic: 0.0,
                df: 0,
                p_value: 1.0,
                note: None,
                interpretation: Some(
                    "The White test requires at least one non-intercept predictor in the model to check for heteroscedasticity. Since none were found, the test was not performed.".to_string()
                ),
            },
            Vec::new(),
        ));
    }

    match create_white_aux_matrix(design_info, n_obs) {
        Ok((z_white_matrix, aux_term_names)) => {
            // Jika model pembantu hanya berisi intersep, tidak ada yang bisa diuji.
            if z_white_matrix.ncols() <= 1 {
                return Some((
                    WhiteTest {
                        statistic: 0.0,
                        df: 0,
                        p_value: 1.0,
                        note: None,
                        interpretation: Some(
                            "The auxiliary regression for the White test has no predictors to test, so the test statistic is zero and the null hypothesis of homoscedasticity is not rejected.".to_string()
                        ),
                    },
                    aux_term_names,
                ));
            }

            match run_simple_ols(y_aux, &z_white_matrix) {
                Ok(ols_result) => {
                    let lm_statistic_white = (n_obs as f64) * ols_result.r_squared;
                    let df_chi_sq_white = ols_result.df_regressors.saturating_sub(1); // df = p - 1

                    if df_chi_sq_white > 0 {
                        let p_value_white = calculate_chi_sq_significance(
                            lm_statistic_white,
                            df_chi_sq_white as u64
                        );
                        Some((
                            WhiteTest {
                                statistic: lm_statistic_white,
                                df: df_chi_sq_white,
                                p_value: p_value_white,
                                note: None,
                                interpretation: Some(
                                    "A significant p-value (< 0.05) suggests that the variance of the errors is not constant, violating the assumption of homoscedasticity.".to_string()
                                ),
                            },
                            aux_term_names,
                        ))
                    } else {
                        Some((
                            WhiteTest {
                                statistic: 0.0,
                                df: 0,
                                p_value: 1.0,
                                note: None,
                                interpretation: Some(
                                    "The auxiliary regression for the White test has no predictors to test, so the test statistic is zero and the null hypothesis of homoscedasticity is not rejected.".to_string()
                                ),
                            },
                            aux_term_names,
                        ))
                    }
                }
                Err(_) =>
                    Some((
                        WhiteTest {
                            statistic: f64::NAN,
                            df: 0,
                            p_value: f64::NAN,
                            note: None,
                            interpretation: Some(
                                "The White test could not be performed due to an error in the auxiliary regression.".to_string()
                            ),
                        },
                        aux_term_names,
                    )),
            }
        }
        Err(_) =>
            Some((
                WhiteTest {
                    statistic: f64::NAN,
                    df: 0,
                    p_value: f64::NAN,
                    note: None,
                    interpretation: Some(
                        "The White test could not be performed because the auxiliary design matrix could not be created.".to_string()
                    ),
                },
                Vec::new(),
            )),
    }
}

/**
 * Menghitung Uji Breusch-Pagan (BP) untuk heteroskedastisitas.
 *
 * - **Tujuan**: Mendeteksi heteroskedastisitas linear, di mana varians sisaan adalah fungsi
 *   linear dari variabel-variabel penjelas. Versi ini menggunakan nilai prediksi (y_hat).
 * - **Rumus**: Statistik BP dihitung sebagai `BP = ESS / (2 * (RSS/n)^2)`, di mana `ESS` adalah
 *   Explained Sum of Squares dari regresi pembantu, `RSS` adalah Residual Sum of Squares dari
 *   *model utama*, dan `n` adalah jumlah observasi.
 * - **Distribusi**: Statistik BP mengikuti distribusi Chi-kuadrat dengan df = 1 (karena hanya
 *   y_hat sebagai prediktor).
 * - **Interpretasi**: Nilai-p yang signifikan menunjukkan adanya heteroskedastisitas.
 */
fn calculate_bp_test(
    y_aux: &DVector<f64>,
    z_pred: &DMatrix<f64>,
    n_obs: usize,
    rss_main_model: f64
) -> Option<BPTest> {
    // Model pembantu harus punya intersep dan y_hat (minimal 2 kolom).
    if z_pred.ncols() < 2 {
        return Some(BPTest {
            statistic: 0.0,
            df: 0,
            p_value: 1.0,
            note: None,
            interpretation: Some(
                "The auxiliary model for the Breusch-Pagan test requires at least two distinct columns (intercept and predicted values). As this condition was not met, the test was not performed.".to_string()
            ),
        });
    }

    match run_simple_ols(y_aux, z_pred) {
        Ok(ols_result) => {
            // sigma^2_mle = RSS / n (Maximum Likelihood Estimate dari varians error model utama)
            let sigma_sq_mle_main = if n_obs > 0 {
                rss_main_model / (n_obs as f64)
            } else {
                f64::NAN
            };

            // Jika varians error adalah nol atau NaN, uji tidak bisa dihitung.
            if sigma_sq_mle_main.is_nan() || sigma_sq_mle_main.abs() < 1e-12 {
                return Some(BPTest {
                    statistic: f64::NAN,
                    df: ols_result.df_regressors.saturating_sub(1),
                    p_value: f64::NAN,
                    note: None,
                    interpretation: Some(
                        "The test could not be computed because the estimated error variance from the main model was zero or not a number, which prevents the calculation of the test statistic.".to_string()
                    ),
                });
            }

            let bp_statistic_val = ols_result.ess / (2.0 * sigma_sq_mle_main.powi(2));
            let df_chi_sq_bp_val = ols_result.df_regressors.saturating_sub(1);

            if df_chi_sq_bp_val > 0 {
                let p_value_bp_val = calculate_chi_sq_significance(
                    bp_statistic_val,
                    df_chi_sq_bp_val as u64
                );
                Some(BPTest {
                    statistic: bp_statistic_val,
                    df: df_chi_sq_bp_val,
                    p_value: p_value_bp_val,
                    note: None,
                    interpretation: Some(
                        "A significant p-value (< 0.05) suggests that the variance of the errors is related to the predicted values, indicating heteroscedasticity.".to_string()
                    ),
                })
            } else {
                Some(BPTest {
                    statistic: 0.0,
                    df: 0,
                    p_value: 1.0,
                    note: None,
                    interpretation: Some(
                        "The auxiliary regression for the Breusch-Pagan test has no predictors to test, so the test statistic is zero and the null hypothesis of homoscedasticity is not rejected.".to_string()
                    ),
                })
            }
        }
        Err(_) =>
            Some(BPTest {
                statistic: f64::NAN,
                df: 0,
                p_value: f64::NAN,
                note: None,
                interpretation: Some(
                    "The Breusch-Pagan test could not be performed due to an error in the auxiliary regression.".to_string()
                ),
            }),
    }
}

/**
 * Menghitung Uji Breusch-Pagan yang Dimodifikasi (versi Koenker-Bassett).
 * Juga dikenal sebagai uji N*R-squared.
 *
 * - **Tujuan**: Sama seperti BP, tetapi lebih robust (tahan) terhadap pelanggaran asumsi
 *   normalitas pada sisaan.
 * - **Rumus**: `LM = n * R^2`, di mana `R^2` berasal dari regresi pembantu (kuadrat sisaan
 *   pada y_hat).
 * - **Distribusi**: Statistik LM mengikuti distribusi Chi-kuadrat dengan df = 1.
 * - **Interpretasi**: Nilai-p yang signifikan menunjukkan adanya heteroskedastisitas.
 */
fn calculate_modified_bp_test(
    y_aux: &DVector<f64>,
    z_pred: &DMatrix<f64>,
    n_obs: usize
) -> Option<ModifiedBPTest> {
    if z_pred.ncols() < 2 {
        return Some(ModifiedBPTest {
            statistic: 0.0,
            df: 0,
            p_value: 1.0,
            note: None,
            interpretation: Some(
                "The auxiliary model for the Modified Breusch-Pagan test requires at least two distinct columns (intercept and predicted values). As this condition was not met, the test was not performed.".to_string()
            ),
        });
    }

    match run_simple_ols(y_aux, z_pred) {
        Ok(ols_result) => {
            let lm_statistic_modbp = (n_obs as f64) * ols_result.r_squared;
            let df_chi_sq_modbp = ols_result.df_regressors.saturating_sub(1);

            if df_chi_sq_modbp > 0 {
                let p_value_modbp = calculate_chi_sq_significance(
                    lm_statistic_modbp,
                    df_chi_sq_modbp as u64
                );
                Some(ModifiedBPTest {
                    statistic: lm_statistic_modbp,
                    df: df_chi_sq_modbp,
                    p_value: p_value_modbp,
                    note: None,
                    interpretation: Some(
                        "This test is robust to non-normal errors. A significant p-value (< 0.05) suggests that the variance of the errors is related to the predicted values, indicating heteroscedasticity.".to_string()
                    ),
                })
            } else {
                Some(ModifiedBPTest {
                    statistic: 0.0,
                    df: 0,
                    p_value: 1.0,
                    note: None,
                    interpretation: Some(
                        "The auxiliary regression for the Modified Breusch-Pagan test has no predictors to test, so the test statistic is zero and the null hypothesis of homoscedasticity is not rejected.".to_string()
                    ),
                })
            }
        }
        Err(_) =>
            Some(ModifiedBPTest {
                statistic: f64::NAN,
                df: 0,
                p_value: f64::NAN,
                note: None,
                interpretation: Some(
                    "The Modified Breusch-Pagan test could not be performed due to an error in the auxiliary regression.".to_string()
                ),
            }),
    }
}

/**
 * Menghitung Uji-F untuk heteroskedastisitas.
 *
 * - **Tujuan**: Alternatif dari uji Chi-kuadrat (seperti BP), sering dianggap memiliki
 *   performa yang lebih baik pada sampel kecil.
 * - **Rumus**: `F = (R^2 / df1) / ((1 - R^2) / df2)`, di mana `R^2` dari regresi pembantu,
 *   `df1` adalah jumlah prediktor di model pembantu (tanpa intersep), dan `df2` adalah
 *   derajat kebebasan sisaan dari model pembantu.
 * - **Distribusi**: Statistik F mengikuti distribusi F dengan derajat kebebasan (df1, df2).
 * - **Interpretasi**: Nilai-p yang signifikan menunjukkan adanya heteroskedastisitas.
 */
fn calculate_f_test(y_aux: &DVector<f64>, z_pred: &DMatrix<f64>, n_obs: usize) -> Option<FTest> {
    if z_pred.ncols() < 2 {
        return Some(FTest {
            statistic: f64::NAN,
            df1: 0,
            df2: n_obs.saturating_sub(z_pred.ncols()),
            p_value: f64::NAN,
            note: None,
            interpretation: Some(
                "The auxiliary model for the F-test requires at least two distinct columns (intercept and predicted values). As this condition was not met, the test was not performed.".to_string()
            ),
        });
    }

    match run_simple_ols(y_aux, z_pred) {
        Ok(ols_result) => {
            let df1_f = ols_result.df_regressors.saturating_sub(1); // df1 = p_aux - 1
            let df2_f = ols_result.df_residuals; // df2 = n - p_aux

            if df1_f > 0 && df2_f > 0 {
                let f_statistic_val =
                    ols_result.r_squared /
                    (df1_f as f64) /
                    ((1.0 - ols_result.r_squared) / (df2_f as f64));
                let p_value_f_val = calculate_f_significance(df1_f, df2_f, f_statistic_val);

                Some(FTest {
                    statistic: f_statistic_val,
                    df1: df1_f,
                    df2: df2_f,
                    p_value: p_value_f_val,
                    note: None,
                    interpretation: Some(
                        "This test is an alternative to the Chi-square based tests and may perform better in small samples. A significant p-value (< 0.05) suggests heteroscedasticity.".to_string()
                    ),
                })
            } else {
                Some(FTest {
                    statistic: f64::NAN,
                    df1: df1_f,
                    df2: df2_f,
                    p_value: f64::NAN,
                    note: None,
                    interpretation: Some(
                        "The F-test could not be performed because the degrees of freedom were invalid (e.g., zero or negative), which can happen with very small sample sizes.".to_string()
                    ),
                })
            }
        }
        Err(_) =>
            Some(FTest {
                statistic: f64::NAN,
                df1: 0,
                df2: 0,
                p_value: f64::NAN,
                note: None,
                interpretation: Some(
                    "The F-test could not be performed due to an error in the auxiliary regression.".to_string()
                ),
            }),
    }
}
