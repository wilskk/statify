use std::fmt::Debug;

/// Multiply two matrices
pub fn matrix_multiply(a: &[Vec<f64>], b: &[Vec<f64>]) -> Result<Vec<Vec<f64>>, String> {
    if a.is_empty() || b.is_empty() || a[0].is_empty() || b[0].is_empty() {
        return Err("Cannot multiply empty matrices".to_string());
    }

    let a_rows = a.len();
    let a_cols = a[0].len();
    let b_rows = b.len();
    let b_cols = b[0].len();

    if a_cols != b_rows {
        return Err(
            format!(
                "Matrix dimensions don't match for multiplication: {}x{} and {}x{}",
                a_rows,
                a_cols,
                b_rows,
                b_cols
            )
        );
    }

    let mut result = vec![vec![0.0; b_cols]; a_rows];
    for i in 0..a_rows {
        for j in 0..b_cols {
            let mut sum = 0.0;
            for k in 0..a_cols {
                sum += a[i][k] * b[k][j];
            }
            result[i][j] = sum;
        }
    }

    Ok(result)
}

/// Transpose a matrix
pub fn matrix_transpose(a: &[Vec<f64>]) -> Vec<Vec<f64>> {
    if a.is_empty() || a[0].is_empty() {
        return Vec::new();
    }

    let rows = a.len();
    let cols = a[0].len();
    let mut result = vec![vec![0.0; rows]; cols];

    for i in 0..rows {
        for j in 0..cols {
            result[j][i] = a[i][j];
        }
    }

    result
}

/// Calculate the inverse of a matrix
pub fn matrix_inverse(a: &[Vec<f64>]) -> Result<Vec<Vec<f64>>, String> {
    if a.is_empty() {
        return Err("Cannot invert empty matrix".to_string());
    }

    let n = a.len();
    if n != a[0].len() {
        return Err("Matrix must be square for inversion".to_string());
    }

    // Create augmented matrix [A|I]
    let mut aug = Vec::with_capacity(n);
    for i in 0..n {
        let mut row = Vec::with_capacity(2 * n);
        for j in 0..n {
            row.push(a[i][j]);
        }
        for j in 0..n {
            row.push(if i == j { 1.0 } else { 0.0 });
        }
        aug.push(row);
    }

    // Gaussian elimination
    for i in 0..n {
        // Find pivot
        let mut max_val = aug[i][i].abs();
        let mut max_row = i;
        for j in i + 1..n {
            if aug[j][i].abs() > max_val {
                max_val = aug[j][i].abs();
                max_row = j;
            }
        }

        if max_val < 1e-10 {
            return Err("Matrix is singular or nearly singular".to_string());
        }

        // Swap rows if needed
        if max_row != i {
            aug.swap(i, max_row);
        }

        // Scale pivot row
        let pivot = aug[i][i];
        for j in 0..2 * n {
            aug[i][j] /= pivot;
        }

        // Eliminate other rows
        for j in 0..n {
            if j != i {
                let factor = aug[j][i];
                for k in 0..2 * n {
                    aug[j][k] -= factor * aug[i][k];
                }
            }
        }
    }

    // Extract the inverse from the augmented matrix
    let mut result = vec![vec![0.0; n]; n];
    for i in 0..n {
        for j in 0..n {
            result[i][j] = aug[i][j + n];
        }
    }

    Ok(result)
}

/// Multiply a matrix by a vector
pub fn matrix_vec_multiply(a: &[Vec<f64>], b: &[f64]) -> Result<Vec<f64>, String> {
    if a.is_empty() || a[0].is_empty() || b.is_empty() {
        return Err("Cannot multiply empty matrix or vector".to_string());
    }

    let a_rows = a.len();
    let a_cols = a[0].len();
    let b_len = b.len();

    if a_cols != b_len {
        return Err(
            format!(
                "Matrix and vector dimensions don't match for multiplication: {}x{} and {}",
                a_rows,
                a_cols,
                b_len
            )
        );
    }

    let mut result = vec![0.0; a_rows];
    for i in 0..a_rows {
        let mut sum = 0.0;
        for j in 0..a_cols {
            sum += a[i][j] * b[j];
        }
        result[i] = sum;
    }

    Ok(result)
}

/// Helper function to extract a column from a matrix
pub fn extract_column(matrix: &[Vec<f64>], col_idx: usize) -> Vec<f64> {
    let mut column = Vec::with_capacity(matrix.len());
    for row in matrix {
        column.push(row[col_idx]);
    }
    column
}

/// Helper function to add a column to a matrix
pub fn add_column_to_matrix(matrix: &mut Vec<Vec<f64>>, column: &[f64]) {
    for (i, row) in matrix.iter_mut().enumerate() {
        if i < column.len() {
            row.push(column[i]);
        }
    }
}

/// Helper function to calculate quadratic form: v' * M * v
pub fn calculate_quadratic_form(v: &[f64], m: &[Vec<f64>]) -> f64 {
    let mut result = 0.0;
    for i in 0..v.len() {
        for j in 0..v.len() {
            result += v[i] * m[i][j] * v[j];
        }
    }
    result
}

/// Helper function to create L matrix for a range of columns
pub fn create_l_matrix(
    columns_range: std::ops::RangeInclusive<usize>,
    total_cols: usize
) -> Vec<Vec<f64>> {
    let mut l = Vec::new();
    for col in columns_range {
        let mut row = vec![0.0; total_cols];
        row[col] = 1.0;
        l.push(row);
    }
    l
}

/// Helper function to calculate L*β
pub fn calculate_l_beta(l: &[Vec<f64>], beta: &[f64]) -> Vec<f64> {
    let mut l_beta = Vec::with_capacity(l.len());
    for row in l {
        let sum = row
            .iter()
            .zip(beta.iter())
            .map(|(&l_ij, &b_j)| l_ij * b_j)
            .sum();
        l_beta.push(sum);
    }
    l_beta
}

/// Helper function to calculate projection matrix
pub fn calculate_projection_matrix(
    data_matrix: &[Vec<f64>],
    all_values: &[f64]
) -> Result<Vec<Vec<f64>>, String> {
    let x_transpose = matrix_transpose(data_matrix);
    let xtx = matrix_multiply(&x_transpose, data_matrix)?;

    let xtx_inv = match matrix_inverse(&xtx) {
        Ok(inv) => inv,
        Err(_) => {
            return Err("Matrix inversion failed".to_string());
        }
    };

    let x_xtx_inv = matrix_multiply(data_matrix, &xtx_inv)?;
    matrix_multiply(&x_xtx_inv, &x_transpose)
}

/// Helper function to create identity matrix minus projection matrix
pub fn calculate_orthogonal_projection(projection: &[Vec<f64>], size: usize) -> Vec<Vec<f64>> {
    let mut result = vec![vec![0.0; size]; size];
    for i in 0..size {
        for j in 0..size {
            result[i][j] = if i == j { 1.0 } else { 0.0 };
            result[i][j] -= projection[i][j];
        }
    }
    result
}
