use crate::models::config::{AnalysisData, MultinomialConfig};
use nalgebra::DMatrix;

pub struct PrimaryResults {
    pub design_matrix: DMatrix<f64>,
    pub y_categories: Vec<f64>,
    pub category_map: Vec<f64>, // List kategori unik
    pub reference_index: usize, // Indeks kategori referensi
    pub n_cases: usize,
    pub n_params: usize,             // Jumlah parameter per kategori
    pub n_categories: usize,         // Jumlah kategori (J)
    pub weights: Vec<f64>,           // Case weights
    pub variable_names: Vec<String>, // Nama variabel untuk LR tests
}

pub fn perform_primary_calculation(
    data: &AnalysisData,
    config: &MultinomialConfig,
) -> Result<PrimaryResults, String> {
    // 1. Identifikasi Kategori Unik (J)
    let mut unique_cats: Vec<f64> = data.dependent.clone();
    // Kita urutkan dulu
    unique_cats.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    // Hapus duplikat
    unique_cats.dedup_by(|a, b| (*a - *b).abs() < f64::EPSILON);

    let j_count = unique_cats.len();

    if j_count < 2 {
        return Err("Variabel dependen harus memiliki minimal 2 kategori.".to_string());
    }

    // 2. Tentukan Indeks Kategori Referensi
    let ref_idx = match config.reference_category.as_str() {
        "first" => 0,
        "last" => j_count - 1,
        val => unique_cats
            .iter()
            .position(|&c| c == val.parse::<f64>().unwrap_or(unique_cats[j_count - 1]))
            .unwrap_or(j_count - 1),
    };

    // 3. Bangun Matriks Desain X
    let n_rows = data.dependent.len();
    let n_vars = data.independent.len();
    let mut x_elements = Vec::new();

    for i in 0..n_rows {
        // Tambahkan Intersept (Konstanta) jika dipilih
        if config.include_intercept {
            x_elements.push(1.0);
        }
        // Tambahkan Kovariat
        for j in 0..n_vars {
            x_elements.push(data.independent[j][i]);
        }
    }

    let n_cols_x = if config.include_intercept {
        n_vars + 1
    } else {
        n_vars
    };
    let x_matrix = DMatrix::from_row_slice(n_rows, n_cols_x, &x_elements);

    // Handle case weights (default to 1.0 if not provided)
    let weights = data.weights.clone().unwrap_or_else(|| vec![1.0; n_rows]);

    // Generate variable names for LR tests
    let mut var_names = Vec::new();
    if config.include_intercept {
        var_names.push("Intercept".to_string());
    }

    // Use provided variable names or generate defaults
    if let Some(ref names) = data.variable_names {
        var_names.extend_from_slice(names);
    } else {
        for i in 0..n_vars {
            var_names.push(format!("X{}", i + 1));
        }
    }

    Ok(PrimaryResults {
        design_matrix: x_matrix,
        y_categories: data.dependent.clone(),
        category_map: unique_cats,
        reference_index: ref_idx,
        n_cases: n_rows,
        n_params: n_cols_x,
        n_categories: j_count,
        weights,
        variable_names: var_names,
    })
}
