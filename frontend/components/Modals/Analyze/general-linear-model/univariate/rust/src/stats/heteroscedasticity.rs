use crate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ BPTest, DesignMatrixInfo, FTest, HeteroscedasticityTests, ModifiedBPTest, WhiteTest },
};
use nalgebra::{ DMatrix, DVector };
use std::collections::HashSet;
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

    if design_info.n_samples == 0 {
        return Err("No data for main model fitting in heteroscedasticity tests.".to_string());
    }

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
    let squared_residuals_data: Vec<f64> = residuals_vec
        .iter()
        .map(|e| e.powi(2))
        .collect();
    let y_aux_for_tests = DVector::from_vec(squared_residuals_data);

    // Langkah 6: Buat matriks desain pembantu (Z_p) dari nilai prediksi (y_hat).
    // Matriks ini digunakan untuk uji Breusch-Pagan dan F-test.
    let z_pred_matrix_option = create_predicted_aux_matrix(&y_hat, n_obs);

    // Inisialisasi hasil uji.
    let mut white_test_result = None;
    let mut bp_test_result = None;
    let mut modified_bp_test_result = None;
    let mut f_test_kb_result = None;

    // Langkah 7: Jalankan uji yang diminta dalam konfigurasi.
    if config.options.white_test {
        white_test_result = calculate_white_test(&y_aux_for_tests, &design_info, config, n_obs);
    }

    if config.options.brusch_pagan {
        if let Some(z_p) = &z_pred_matrix_option {
            bp_test_result = calculate_bp_test(&y_aux_for_tests, z_p, n_obs, swept_info.s_rss);
        } else {
            bp_test_result = Some(BPTest {
                statistic: f64::NAN,
                df: 0,
                p_value: f64::NAN,
                note: Some(
                    "BP Test (on Z_pred): Failed to construct aux matrix from predicted values.".to_string()
                ),
                interpretation: Some(
                    "The test could not be performed because the auxiliary matrix, which is based on the model's predicted values, could not be created.".to_string()
                ),
            });
        }
    }

    if config.options.mod_brusch_pagan {
        if let Some(z_p) = &z_pred_matrix_option {
            modified_bp_test_result = calculate_modified_bp_test(&y_aux_for_tests, z_p, n_obs);
        } else {
            modified_bp_test_result = Some(ModifiedBPTest {
                statistic: f64::NAN,
                df: 0,
                p_value: f64::NAN,
                note: Some(
                    "Modified BP (N*R-sq on Z_pred): Failed to construct aux matrix.".to_string()
                ),
                interpretation: Some(
                    "The test could not be performed because the auxiliary matrix, which is based on the model's predicted values, could not be created.".to_string()
                ),
            });
        }
    }

    if config.options.f_test {
        if let Some(z_p) = &z_pred_matrix_option {
            f_test_kb_result = calculate_f_test(&y_aux_for_tests, z_p, n_obs);
        } else {
            f_test_kb_result = Some(FTest {
                statistic: f64::NAN,
                df1: 0,
                df2: 0,
                p_value: f64::NAN,
                note: Some(
                    "F-Test (on Z_pred): Failed to construct aux matrix from predicted values.".to_string()
                ),
                interpretation: Some(
                    "The test could not be performed because the auxiliary matrix, which is based on the model's predicted values, could not be created.".to_string()
                ),
            });
        }
    }

    // Langkah 8: Tambahkan metadata ke catatan hasil untuk konsumsi di frontend.
    let note_suffix = format!("\n__DEP_VAR:{}\n__DESIGN:{}", dep_var_name, design_string);
    if let Some(ref mut test) = white_test_result {
        if let Some(note) = test.note.as_mut() {
            note.push_str(&note_suffix);
        }
    }
    if let Some(ref mut test) = bp_test_result {
        if let Some(note) = test.note.as_mut() {
            note.push_str(&note_suffix);
        }
    }
    if let Some(ref mut test) = modified_bp_test_result {
        if let Some(note) = test.note.as_mut() {
            note.push_str(&note_suffix);
        }
    }
    if let Some(ref mut test) = f_test_kb_result {
        if let Some(note) = test.note.as_mut() {
            note.push_str(&note_suffix);
        }
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
fn run_simple_ols(
    y_aux_vec: &DVector<f64>,
    x_aux_matrix: &DMatrix<f64>
) -> Result<(f64, f64, f64, usize, usize), String> {
    let n_obs = y_aux_vec.len();
    if n_obs == 0 {
        return Ok((0.0, 0.0, 0.0, 0, 0));
    }
    if x_aux_matrix.nrows() != n_obs {
        return Err(format!("Aux OLS: X nrows ({}) != Y len ({}).", x_aux_matrix.nrows(), n_obs));
    }

    // Jika tidak ada prediktor, R-kuadrat adalah 0.
    if x_aux_matrix.ncols() == 0 {
        let y_mean_aux = y_aux_vec.mean();
        let rss = y_aux_vec
            .iter()
            .map(|&yi| (yi - y_mean_aux).powi(2))
            .sum::<f64>();
        return Ok((0.0, 0.0, rss, 0, n_obs));
    }

    // Perhitungan standar OLS: beta = (X'X)^-1 * X'Y
    let xtx = x_aux_matrix.transpose() * x_aux_matrix;
    let xtx_inv = xtx
        .svd(true, true)
        .pseudo_inverse(1e-10)
        .map_err(|e| format!("Matrix pseudo-inversion failed in run_simple_ols: {}", e))?;
    let beta_aux = &xtx_inv * x_aux_matrix.transpose() * y_aux_vec;
    let y_hat_aux = x_aux_matrix * beta_aux;
    let residuals_aux_vec = y_aux_vec - &y_hat_aux;

    // Hitung jumlah kuadrat (Sum of Squares)
    let y_mean_aux = y_aux_vec.mean();
    let ess = y_hat_aux
        .iter()
        .map(|&yh| (yh - y_mean_aux).powi(2))
        .sum::<f64>(); // Explained
    let rss = residuals_aux_vec
        .iter()
        .map(|&e| e.powi(2))
        .sum::<f64>(); // Residual
    let tss = y_aux_vec
        .iter()
        .map(|&yi| (yi - y_mean_aux).powi(2))
        .sum::<f64>(); // Total

    // Hitung R-kuadrat: R^2 = ESS / TSS
    let r_squared = if tss.abs() < 1e-9 { 0.0 } else { ess / tss };

    // Tentukan derajat kebebasan
    let df_regressors_in_z = x_aux_matrix.ncols();
    let df_residuals = n_obs.saturating_sub(df_regressors_in_z);

    Ok((r_squared.max(0.0).min(1.0), ess, rss, df_regressors_in_z, df_residuals))
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
    config: &UnivariateConfig,
    n_obs: usize
) -> Result<DMatrix<f64>, String> {
    if n_obs == 0 {
        return Ok(DMatrix::zeros(0, 0));
    }

    let mut aux_cols: Vec<DVector<f64>> = Vec::new();
    let mut existing_col_hashes: HashSet<Vec<u64>> = HashSet::new();

    // Uji White memerlukan intersep dalam regresi pembantunya agar statistik N*R^2 valid.
    let intercept_col = DVector::from_element(n_obs, 1.0f64);
    let hash_repr: Vec<u64> = intercept_col
        .iter()
        .map(|&val| val.to_bits())
        .collect();
    if existing_col_hashes.insert(hash_repr) {
        aux_cols.push(intercept_col);
    }

    // Kumpulkan kolom prediktor asli (non-intersep) dari model utama.
    let mut original_non_intercept_predictors: Vec<(usize, DVector<f64>)> = Vec::new();
    for j in 0..design_info.x.ncols() {
        if design_info.intercept_column != Some(j) {
            let col = design_info.x.column(j).into_owned();
            original_non_intercept_predictors.push((j, col.clone()));

            // Tambahkan kolom asli ke matriks pembantu jika belum ada.
            let hash_repr: Vec<u64> = col
                .iter()
                .map(|&val| val.to_bits())
                .collect();
            if existing_col_hashes.insert(hash_repr) {
                aux_cols.push(col);
            }
        }
    }

    if original_non_intercept_predictors.is_empty() {
        return if !aux_cols.is_empty() {
            Ok(DMatrix::from_columns(&aux_cols))
        } else {
            Ok(DMatrix::zeros(n_obs, 0))
        };
    }

    // Tambahkan kuadrat dari prediktor-prediktor kontinu.
    for (original_idx, predictor_col) in &original_non_intercept_predictors {
        // Cek apakah kolom adalah variabel kontinu.
        let is_continuous = if design_info.intercept_column == Some(*original_idx) {
            false
        } else {
            let mut is_cont = false;
            for (term_name, (start_idx, end_idx)) in &design_info.term_column_indices {
                if *original_idx >= *start_idx && *original_idx <= *end_idx {
                    if
                        config.main.covar
                            .as_ref()
                            .map_or(false, |covars| covars.contains(term_name))
                    {
                        is_cont = true;
                        break;
                    }
                }
            }
            is_cont
        };

        if is_continuous {
            let squared_col = predictor_col.map(|val| val * val);
            let hash_repr: Vec<u64> = squared_col
                .iter()
                .map(|&val| val.to_bits())
                .collect();
            if existing_col_hashes.insert(hash_repr) {
                aux_cols.push(squared_col);
            }
        }
    }

    // Tambahkan hasil kali silang (cross-products) antar prediktor.
    for i in 0..original_non_intercept_predictors.len() {
        for k in i + 1..original_non_intercept_predictors.len() {
            let (_, predictor1) = &original_non_intercept_predictors[i];
            let (_, predictor2) = &original_non_intercept_predictors[k];
            let cross_product_col = predictor1.component_mul(predictor2);

            let hash_repr: Vec<u64> = cross_product_col
                .iter()
                .map(|&val| val.to_bits())
                .collect();
            if existing_col_hashes.insert(hash_repr) {
                aux_cols.push(cross_product_col);
            }
        }
    }

    if aux_cols.is_empty() {
        Ok(DMatrix::zeros(n_obs, 0))
    } else {
        Ok(DMatrix::from_columns(&aux_cols))
    }
}

/**
 * Membuat matriks desain pembantu untuk uji yang berbasis nilai prediksi (y_hat).
 * Ini digunakan untuk Uji Breusch-Pagan dan Uji-F.
 * Matriks ini sangat sederhana, hanya terdiri dari:
 * 1. Intersep.
 * 2. Vektor nilai prediksi (y_hat) dari model utama.
 */
fn create_predicted_aux_matrix(y_hat: &DVector<f64>, n_obs: usize) -> Option<DMatrix<f64>> {
    let mut aux_cols: Vec<DVector<f64>> = Vec::new();
    let mut existing_col_hashes: HashSet<Vec<u64>> = HashSet::new();

    // Regresi pembantu untuk uji ini harus memiliki intersepnya sendiri.
    let intercept_col = DVector::from_element(n_obs, 1.0f64);
    let hash_repr: Vec<u64> = intercept_col
        .iter()
        .map(|&val| val.to_bits())
        .collect();
    if existing_col_hashes.insert(hash_repr) {
        aux_cols.push(intercept_col);
    }

    // Tambahkan nilai prediksi (y_hat) sebagai prediktor.
    let y_hat_hash_repr: Vec<u64> = y_hat
        .iter()
        .map(|&val| val.to_bits())
        .collect();
    if existing_col_hashes.insert(y_hat_hash_repr) {
        aux_cols.push(y_hat.clone_owned());
    }

    if !aux_cols.is_empty() && aux_cols[0].len() == n_obs {
        Some(DMatrix::from_columns(&aux_cols))
    } else {
        None
    }
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
    config: &UnivariateConfig,
    n_obs: usize
) -> Option<WhiteTest> {
    // Uji White tidak dapat diterapkan jika tidak ada prediktor (selain intersep) di model utama.
    if design_info.p_parameters - (if design_info.intercept_column.is_some() { 1 } else { 0 }) == 0 {
        return Some(WhiteTest {
            statistic: 0.0,
            df: 0,
            p_value: 1.0,
            note: Some(
                "White test not applicable: No non-intercept predictors in the main model.".to_string()
            ),
            interpretation: Some(
                "The White test requires at least one non-intercept predictor in the model to check for heteroscedasticity. Since none were found, the test was not performed.".to_string()
            ),
        });
    }

    match create_white_aux_matrix(design_info, config, n_obs) {
        Ok(z_white) => {
            // Jika model pembantu hanya berisi intersep, tidak ada yang bisa diuji.
            if z_white.ncols() <= 1 {
                return Some(WhiteTest {
                    statistic: 0.0,
                    df: 0,
                    p_value: 1.0,
                    note: Some(
                        "White test: Auxiliary model only contains an intercept.".to_string()
                    ),
                    interpretation: Some(
                        "The auxiliary regression for the White test has no predictors to test, so the test statistic is zero and the null hypothesis of homoscedasticity is not rejected.".to_string()
                    ),
                });
            }

            match run_simple_ols(y_aux, &z_white) {
                Ok((r_sq_aux, _, _, k_total_aux_white, _)) => {
                    let lm_statistic_white = (n_obs as f64) * r_sq_aux;
                    let df_chi_sq_white = k_total_aux_white.saturating_sub(1); // df = p - 1

                    if df_chi_sq_white > 0 {
                        let p_value_white = calculate_chi_sq_significance(
                            lm_statistic_white,
                            df_chi_sq_white as u64
                        );
                        Some(WhiteTest {
                            statistic: lm_statistic_white,
                            df: df_chi_sq_white,
                            p_value: p_value_white,
                            note: Some(
                                "Auxiliary regression on original predictors, their squares, and cross-products.".to_string()
                            ),
                            interpretation: Some(
                                "A significant p-value (< 0.05) suggests that the variance of the errors is not constant, violating the assumption of homoscedasticity.".to_string()
                            ),
                        })
                    } else {
                        Some(WhiteTest {
                            statistic: 0.0,
                            df: 0,
                            p_value: 1.0,
                            note: Some(
                                "White test: No non-intercept regressors in aux model.".to_string()
                            ),
                            interpretation: Some(
                                "The auxiliary regression for the White test has no predictors to test, so the test statistic is zero and the null hypothesis of homoscedasticity is not rejected.".to_string()
                            ),
                        })
                    }
                }
                Err(e) =>
                    Some(WhiteTest {
                        statistic: f64::NAN,
                        df: 0,
                        p_value: f64::NAN,
                        note: Some(format!("White test aux regression failed: {}", e)),
                        interpretation: Some(
                            "The White test could not be performed due to an error in the auxiliary regression.".to_string()
                        ),
                    }),
            }
        }
        Err(e) =>
            Some(WhiteTest {
                statistic: f64::NAN,
                df: 0,
                p_value: f64::NAN,
                note: Some(format!("Failed to create White test aux matrix: {}", e)),
                interpretation: Some(
                    "The White test could not be performed because the auxiliary design matrix could not be created.".to_string()
                ),
            }),
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
            note: Some(
                "BP Test (on Z_pred): Aux model (intercept, y_hat) has < 2 distinct columns.".to_string()
            ),
            interpretation: Some(
                "The auxiliary model for the Breusch-Pagan test requires at least two distinct columns (intercept and predicted values). As this condition was not met, the test was not performed.".to_string()
            ),
        });
    }

    match run_simple_ols(y_aux, z_pred) {
        Ok((_, ess_aux, _, k_total_aux, _)) => {
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
                    df: k_total_aux.saturating_sub(1),
                    p_value: f64::NAN,
                    note: Some(
                        "BP Test: Main model sigma^2 (MLE) is zero or NaN. Test cannot be computed.".to_string()
                    ),
                    interpretation: Some(
                        "The test could not be computed because the estimated error variance from the main model was zero or not a number, which prevents the calculation of the test statistic.".to_string()
                    ),
                });
            }

            let bp_statistic_val = ess_aux / (2.0 * sigma_sq_mle_main.powi(2));
            let df_chi_sq_bp_val = k_total_aux.saturating_sub(1);

            if df_chi_sq_bp_val > 0 {
                let p_value_bp_val = calculate_chi_sq_significance(
                    bp_statistic_val,
                    df_chi_sq_bp_val as u64
                );
                Some(BPTest {
                    statistic: bp_statistic_val,
                    df: df_chi_sq_bp_val,
                    p_value: p_value_bp_val,
                    note: Some(
                        "Breusch-Pagan test. Auxiliary regression on an intercept and predicted values.".to_string()
                    ),
                    interpretation: Some(
                        "A significant p-value (< 0.05) suggests that the variance of the errors is related to the predicted values, indicating heteroscedasticity.".to_string()
                    ),
                })
            } else {
                Some(BPTest {
                    statistic: 0.0,
                    df: 0,
                    p_value: 1.0,
                    note: Some(
                        "BP Test: No non-intercept regressors in auxiliary model.".to_string()
                    ),
                    interpretation: Some(
                        "The auxiliary regression for the Breusch-Pagan test has no predictors to test, so the test statistic is zero and the null hypothesis of homoscedasticity is not rejected.".to_string()
                    ),
                })
            }
        }
        Err(e) =>
            Some(BPTest {
                statistic: f64::NAN,
                df: 0,
                p_value: f64::NAN,
                note: Some(format!("BP test auxiliary regression failed: {}", e)),
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
            note: Some(
                "ModBP (N*R-sq on Z_pred): Aux model (intercept,y_hat) has < 2 distinct columns.".to_string()
            ),
            interpretation: Some(
                "The auxiliary model for the Modified Breusch-Pagan test requires at least two distinct columns (intercept and predicted values). As this condition was not met, the test was not performed.".to_string()
            ),
        });
    }

    match run_simple_ols(y_aux, z_pred) {
        Ok((r_sq_aux, _, _, k_total_aux, _)) => {
            let lm_statistic_modbp = (n_obs as f64) * r_sq_aux;
            let df_chi_sq_modbp = k_total_aux.saturating_sub(1);

            if df_chi_sq_modbp > 0 {
                let p_value_modbp = calculate_chi_sq_significance(
                    lm_statistic_modbp,
                    df_chi_sq_modbp as u64
                );
                Some(ModifiedBPTest {
                    statistic: lm_statistic_modbp,
                    df: df_chi_sq_modbp,
                    p_value: p_value_modbp,
                    note: Some(
                        "Modified Breusch-Pagan (N*R-sq). Auxiliary regression on an intercept and predicted values.".to_string()
                    ),
                    interpretation: Some(
                        "This test is robust to non-normal errors. A significant p-value (< 0.05) suggests that the variance of the errors is related to the predicted values, indicating heteroscedasticity.".to_string()
                    ),
                })
            } else {
                Some(ModifiedBPTest {
                    statistic: 0.0,
                    df: 0,
                    p_value: 1.0,
                    note: Some(
                        "Modified BP Test: No non-intercept terms in auxiliary model.".to_string()
                    ),
                    interpretation: Some(
                        "The auxiliary regression for the Modified Breusch-Pagan test has no predictors to test, so the test statistic is zero and the null hypothesis of homoscedasticity is not rejected.".to_string()
                    ),
                })
            }
        }
        Err(e) =>
            Some(ModifiedBPTest {
                statistic: f64::NAN,
                df: 0,
                p_value: f64::NAN,
                note: Some(format!("Modified BP (N*R-sq) auxiliary regression failed: {}", e)),
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
            note: Some(
                "F-Test (on Z_pred): Aux model (intercept,y_hat) has < 2 distinct columns.".to_string()
            ),
            interpretation: Some(
                "The auxiliary model for the F-test requires at least two distinct columns (intercept and predicted values). As this condition was not met, the test was not performed.".to_string()
            ),
        });
    }

    match run_simple_ols(y_aux, z_pred) {
        Ok((r_sq_aux, _, _, k_total_aux, df_res_aux)) => {
            let df1_f = k_total_aux.saturating_sub(1); // df1 = p_aux - 1
            let df2_f = df_res_aux; // df2 = n - p_aux

            if df1_f > 0 && df2_f > 0 {
                let f_statistic_val =
                    r_sq_aux / (df1_f as f64) / ((1.0 - r_sq_aux) / (df2_f as f64));
                let p_value_f_val = calculate_f_significance(df1_f, df2_f, f_statistic_val);

                Some(FTest {
                    statistic: f_statistic_val,
                    df1: df1_f,
                    df2: df2_f,
                    p_value: p_value_f_val,
                    note: Some(
                        "F-test. Auxiliary regression on an intercept and predicted values.".to_string()
                    ),
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
                    note: Some("F-Test: Degrees of freedom for the test are invalid.".to_string()),
                    interpretation: Some(
                        "The F-test could not be performed because the degrees of freedom were invalid (e.g., zero or negative), which can happen with very small sample sizes.".to_string()
                    ),
                })
            }
        }
        Err(e) =>
            Some(FTest {
                statistic: f64::NAN,
                df1: 0,
                df2: 0,
                p_value: f64::NAN,
                note: Some(format!("F-test auxiliary regression failed: {}", e)),
                interpretation: Some(
                    "The F-test could not be performed due to an error in the auxiliary regression.".to_string()
                ),
            }),
    }
}
