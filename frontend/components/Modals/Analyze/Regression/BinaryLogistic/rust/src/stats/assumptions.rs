use crate::models::result::{BoxTidwellRow, VifRow};
use nalgebra::{DMatrix, DVector};
use std::f64;

/// Menghitung Variance Inflation Factor (VIF)
/// Rumus: Diagonal dari Invers Matriks Korelasi
pub fn calculate_vif(
    x_matrix: &DMatrix<f64>,
    var_labels: &[String],
) -> Result<Vec<VifRow>, String> {
    let n_cols = x_matrix.ncols();

    // 1. Hitung Matriks Korelasi
    // Kita buat correlation matrix manual karena nalgebra core tidak punya built-in stats correlation
    let mut corr_matrix = DMatrix::zeros(n_cols, n_cols);

    // Hitung mean dan std_dev untuk setiap kolom
    let mut means = vec![0.0; n_cols];
    let mut std_devs = vec![0.0; n_cols];
    let n_rows = x_matrix.nrows() as f64;

    for j in 0..n_cols {
        let col = x_matrix.column(j);
        let sum = col.sum();
        let mean = sum / n_rows;
        let sum_sq_diff: f64 = col.iter().map(|&x| (x - mean).powi(2)).sum();
        let std_dev = (sum_sq_diff / (n_rows - 1.0)).sqrt();

        means[j] = mean;
        std_devs[j] = std_dev;
    }

    // Isi matriks korelasi
    for i in 0..n_cols {
        for j in 0..n_cols {
            if i == j {
                corr_matrix[(i, j)] = 1.0;
            } else {
                let col_i = x_matrix.column(i);
                let col_j = x_matrix.column(j);

                let mut numerator = 0.0;
                for k in 0..x_matrix.nrows() {
                    numerator += (col_i[k] - means[i]) * (col_j[k] - means[j]);
                }

                let denominator = (n_rows - 1.0) * std_devs[i] * std_devs[j];

                // Handle division by zero jika variance 0 (konstanta)
                if denominator.abs() < 1e-9 {
                    corr_matrix[(i, j)] = 0.0;
                } else {
                    corr_matrix[(i, j)] = numerator / denominator;
                }
            }
        }
    }

    // 2. Invers Matriks Korelasi
    // VIF adalah elemen diagonal dari invers matriks korelasi
    let inv_corr = corr_matrix.try_inverse().ok_or(
        "Gagal menghitung VIF: Matriks korelasi singular (Perfect Multicollinearity terdeteksi).",
    )?;

    let mut vif_results = Vec::new();

    for i in 0..n_cols {
        let vif = inv_corr[(i, i)];
        let tolerance = if vif.abs() > 1e-9 { 1.0 / vif } else { 0.0 };

        // Pastikan label ada, skip Intercept/Constant biasanya untuk VIF
        if i < var_labels.len() {
            vif_results.push(VifRow {
                variable: var_labels[i].clone(),
                vif,
                tolerance,
            });
        }
    }

    Ok(vif_results)
}

/// Menyiapkan Augmented Matrix untuk Box-Tidwell
/// Output: Matriks X baru dengan tambahan kolom (x * ln(x))
pub fn prepare_box_tidwell_data(
    x_matrix: &DMatrix<f64>,
    var_labels: &[String],
) -> (DMatrix<f64>, Vec<String>, Vec<usize>) {
    let n_rows = x_matrix.nrows();
    let n_cols = x_matrix.ncols();

    let mut new_columns = Vec::new();
    let mut new_labels = var_labels.to_vec();
    let mut interaction_indices = Vec::new(); // Index kolom interaksi di matriks baru

    // Copy data lama
    let mut augmented_data = x_matrix.clone().data.as_vec().clone();

    // Loop variabel untuk cek transformasi
    for j in 0..n_cols {
        let col = x_matrix.column(j);

        // Cek apakah variabel kontinu (memiliki banyak unique values > 2) dan positif
        // Sederhananya: kita asumsikan semua non-binary adalah kontinu untuk tes ini
        // Box-Tidwell butuh nilai positif untuk ln(x).
        // Strategi: Tambahkan konstanta kecil jika ada 0, atau skip jika negatif.

        let min_val = col.min();
        if min_val > -0.0001 {
            // Asumsi non-negatif
            // Buat term interaksi: x * ln(x + 1) atau x * ln(x)
            // Untuk safety, kita pakai x * ln(x + 1) jika ada 0, atau ln(x) murni

            let mut term_col = Vec::with_capacity(n_rows);
            for &val in col.iter() {
                let transformed = if val <= 0.0 {
                    // Handle 0 values: (x+c) * ln(x+c) or skip?
                    // Standard approach: add small constant e.g. 1.0 to inputs
                    (val + 1.0) * (val + 1.0).ln()
                } else {
                    val * val.ln()
                };
                term_col.push(transformed);
            }

            new_columns.push(term_col);
            new_labels.push(format!("{} * ln({})", var_labels[j], var_labels[j]));

            // Index kolom baru ini (akan ditambahkan di akhir)
            interaction_indices.push(n_cols + new_columns.len() - 1);
        }
    }

    // Gabungkan kolom baru ke matrix
    // Note: Cara efisien di nalgebra adalah resize atau construct baru.
    // Di sini kita construct dari Vec karena lebih mudah.

    // Flatten kolom baru
    for col in new_columns {
        augmented_data.extend(col);
    }

    let final_cols = n_cols + interaction_indices.len();
    let final_matrix = DMatrix::from_vec(n_rows, final_cols, augmented_data);

    (final_matrix, new_labels, interaction_indices)
}
