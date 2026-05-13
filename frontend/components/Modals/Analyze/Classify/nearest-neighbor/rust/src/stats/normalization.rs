use nalgebra::DMatrix;

/// Normalizes features using adjusted normalization to range [-1, 1]
/// Uses nalgebra for more efficient matrix operations
pub fn normalize_features(data_matrix: &mut Vec<Vec<f64>>) {
    if data_matrix.is_empty() {
        return;
    }

    let n_rows = data_matrix.len();
    let n_features = data_matrix[0].len();

    let mut matrix = DMatrix::zeros(n_rows, n_features);
    for i in 0..n_rows {
        for j in 0..n_features {
            if j < data_matrix[i].len() {
                matrix[(i, j)] = data_matrix[i][j];
            }
        }
    }

    for j in 0..n_features {
        let col = matrix.column(j);
        let min_val = col.min();
        let max_val = col.max();

        if (max_val - min_val).abs() < f64::EPSILON {
            for i in 0..n_rows {
                if j < data_matrix[i].len() {
                    data_matrix[i][j] = 0.0;
                }
            }
            continue;
        }

        for i in 0..n_rows {
            if j < data_matrix[i].len() {
                data_matrix[i][j] =
                    (2.0 * (data_matrix[i][j] - min_val)) / (max_val - min_val) - 1.0;
            }
        }
    }
}
