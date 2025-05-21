use nalgebra::{ DMatrix, DVector, Dyn, OMatrix, U1 };

// Helper to convert Vec<Vec<f64>> to DMatrix<f64>
pub fn to_dmatrix(data: &[Vec<f64>]) -> Result<DMatrix<f64>, String> {
    if data.is_empty() {
        return Ok(DMatrix::from_element(0, 0, 0.0)); // Return 0x0 matrix for empty input
    }

    // Check if the first row is empty. If so, all rows must be empty for a valid 0-column matrix.
    if data[0].is_empty() {
        if data.iter().all(|row| row.is_empty()) {
            return Ok(DMatrix::from_element(data.len(), 0, 0.0)); // Nx0 matrix
        } else {
            return Err(
                "Inconsistent column counts: first row is empty but others are not.".to_string()
            );
        }
    }

    let nrows = data.len();
    let ncols = data[0].len();
    // Ensure all rows have the same number of columns
    if data.iter().any(|row| row.len() != ncols) {
        return Err("Inconsistent number of columns in input data for DMatrix".to_string());
    }
    Ok(DMatrix::from_fn(nrows, ncols, |r, c| data[r][c]))
}

// Helper to convert DMatrix<f64> to Vec<Vec<f64>>
pub fn to_vec_vec(matrix: &DMatrix<f64>) -> Vec<Vec<f64>> {
    matrix
        .row_iter()
        .map(|row| row.iter().cloned().collect())
        .collect()
}

// Helper to convert &[f64] to DVector<f64>
pub fn to_dvector(data: &[f64]) -> DVector<f64> {
    DVector::from_vec(data.to_vec())
}

// Helper to convert DVector<f64> to Vec<f64>
pub fn to_vec(vector: &DVector<f64>) -> Vec<f64> {
    vector.iter().cloned().collect()
}

/// Multiply two matrices
pub fn matrix_multiply(a: &[Vec<f64>], b: &[Vec<f64>]) -> Result<Vec<Vec<f64>>, String> {
    let mat_a = to_dmatrix(a)?;
    let mat_b = to_dmatrix(b)?;

    if mat_a.ncols() != mat_b.nrows() {
        return Err(
            format!(
                "Matrix dimensions don't match for multiplication: {}x{} and {}x{}",
                mat_a.nrows(),
                mat_a.ncols(),
                mat_b.nrows(),
                mat_b.ncols()
            )
        );
    }
    Ok(to_vec_vec(&(mat_a * mat_b)))
}

/// Transpose a matrix
pub fn matrix_transpose(a: &[Vec<f64>]) -> Vec<Vec<f64>> {
    if a.is_empty() || a[0].is_empty() {
        // nalgebra's DMatrix::from_fn would panic with 0 cols/rows without elems
        // Handle empty case explicitly to match original behavior
        return Vec::new();
    }
    match to_dmatrix(a) {
        Ok(mat_a) => to_vec_vec(&mat_a.transpose()),
        Err(_) => Vec::new(), // Or handle error appropriately
    }
}

/// Calculate the inverse of a matrix
pub fn matrix_inverse(a: &[Vec<f64>]) -> Result<Vec<Vec<f64>>, String> {
    let mat_a = to_dmatrix(a)?;
    if !mat_a.is_square() {
        return Err("Matrix must be square for inversion".to_string());
    }
    match mat_a.try_inverse() {
        Some(inv_a) => Ok(to_vec_vec(&inv_a)),
        None => Err("Matrix is singular or nearly singular".to_string()),
    }
}

/// Multiply a matrix by a vector
pub fn matrix_vec_multiply(a: &[Vec<f64>], b: &[f64]) -> Result<Vec<f64>, String> {
    let mat_a = to_dmatrix(a)?;
    let vec_b = to_dvector(b);

    if mat_a.ncols() != vec_b.nrows() {
        return Err(
            format!(
                "Matrix and vector dimensions don't match for multiplication: {}x{} and {}",
                mat_a.nrows(),
                mat_a.ncols(),
                vec_b.nrows()
            )
        );
    }
    Ok(to_vec(&(mat_a * vec_b)))
}

/// Helper function to extract a column from a matrix
pub fn extract_column(matrix: &[Vec<f64>], col_idx: usize) -> Vec<f64> {
    // This can be done more efficiently if matrix is already a DMatrix
    // but for API compatibility with &[Vec<f64>], we convert first.
    if matrix.is_empty() || matrix[0].is_empty() || col_idx >= matrix[0].len() {
        return Vec::new(); // Or handle error
    }
    matrix
        .iter()
        .map(|row| row[col_idx])
        .collect()
}

/// Helper function to add a column to a matrix
/// Note: This function's direct utility might decrease if design matrices are primarily handled as DMatrix.
/// If matrix is Vec<Vec<f64>>, this works. If it's DMatrix, it would be reconstructed.
pub fn add_column_to_matrix(matrix: &mut Vec<Vec<f64>>, column: &[f64]) {
    if matrix.is_empty() && !column.is_empty() {
        // Initialize matrix with the right number of rows, then add the column
        for _ in 0..column.len() {
            matrix.push(Vec::new());
        }
    }
    for (i, row) in matrix.iter_mut().enumerate() {
        if i < column.len() {
            row.push(column[i]);
        } else if !column.is_empty() {
            // This case implies the column is shorter than the matrix.
            // Depending on desired behavior, one might push a default value or error.
            // For now, let's assume it implies an error or needs padding if strict rectangularity is kept.
            // Original code didn't pad, just skipped. We replicate that for now.
        }
    }
}

/// Helper function to calculate quadratic form: v' * M * v
pub fn calculate_quadratic_form(v_data: &[f64], m_data: &[Vec<f64>]) -> Result<f64, String> {
    let vec_v = to_dvector(v_data);
    let mat_m = to_dmatrix(m_data)?;

    if
        vec_v.nrows() != mat_m.nrows() ||
        mat_m.nrows() != mat_m.ncols() ||
        vec_v.nrows() != mat_m.ncols()
    {
        return Err(
            "Dimensions mismatch for quadratic form v'Mv: v must be n, M must be nxn".to_string()
        );
    }

    let vt = vec_v.transpose();
    let vt_m = vt * mat_m;
    let result_matrix: OMatrix<f64, U1, U1> = vt_m * vec_v; // Result is a 1x1 matrix
    Ok(result_matrix[(0, 0)])
}

/// Helper function to create L matrix for a range of columns
pub fn create_l_matrix(
    columns_range: std::ops::RangeInclusive<usize>,
    total_cols: usize
) -> Vec<Vec<f64>> {
    let num_selected_cols = columns_range.end() - columns_range.start() + 1;
    if
        num_selected_cols == 0 ||
        *columns_range.start() >= total_cols ||
        *columns_range.end() >= total_cols
    {
        // Return empty or error if range is invalid or out of bounds
        return Vec::new();
    }

    let mut l_matrix = DMatrix::<f64>::zeros(num_selected_cols, total_cols);
    for (i, col_idx) in columns_range.enumerate() {
        if col_idx < total_cols {
            // Ensure col_idx is within bounds
            l_matrix[(i, col_idx)] = 1.0;
        }
    }
    to_vec_vec(&l_matrix)
}

/// Helper function to calculate L*β
pub fn calculate_l_beta(l_data: &[Vec<f64>], beta_data: &[f64]) -> Result<Vec<f64>, String> {
    let mat_l = to_dmatrix(l_data)?;
    let vec_beta = to_dvector(beta_data);
    if mat_l.ncols() != vec_beta.nrows() {
        return Err("Dimension mismatch for L*beta calculation".to_string());
    }
    Ok(to_vec(&(mat_l * vec_beta)))
}

/// Helper function to calculate projection matrix P = X(X'X)^-1X'
pub fn calculate_projection_matrix(data_matrix_vec: &[Vec<f64>]) -> Result<Vec<Vec<f64>>, String> {
    let x = to_dmatrix(data_matrix_vec)?;
    let xt = x.transpose();
    let xtx = &xt * &x;

    match xtx.try_inverse() {
        Some(xtx_inv) => {
            let x_xtx_inv = x * xtx_inv;
            let p = x_xtx_inv * xt;
            Ok(to_vec_vec(&p))
        }
        None => Err("Matrix (X'X) inversion failed, cannot compute projection matrix".to_string()),
    }
}

/// Helper function to create identity matrix minus projection matrix (M = I - P)
pub fn calculate_orthogonal_projection(
    projection_data: &[Vec<f64>],
    size: usize
) -> Result<Vec<Vec<f64>>, String> {
    if
        projection_data.is_empty() ||
        projection_data.len() != size ||
        projection_data[0].len() != size
    {
        return Err("Projection matrix must be square and of the given size.".to_string());
    }
    let p = to_dmatrix(projection_data)?;
    let i = DMatrix::<f64>::identity(size, size);
    let m = i - p;
    Ok(to_vec_vec(&m))
}

/// Create a diagonal matrix from a vector
pub fn diagonal_matrix(values: &[f64]) -> Vec<Vec<f64>> {
    if values.is_empty() {
        return Vec::new();
    }
    // Correct way to create a diagonal matrix with nalgebra
    let diag_matrix = DMatrix::from_diagonal(&DVector::from_vec(values.to_vec()));
    to_vec_vec(&diag_matrix)
}

/// Calculate Model Sum of Squares (SS_model)
/// SS_model = β'X'y
/// where design_matrix_cols is X (passed as columns, will be transposed internally)
/// and y_values is the vector of dependent variable observations.
pub(super) fn calculate_model_ss(
    design_matrix_cols: &[Vec<f64>],
    y_values: &[f64]
) -> Result<f64, String> {
    if design_matrix_cols.is_empty() {
        // If the design matrix is empty (e.g., no factors, no intercept), model SS is 0.
        return Ok(0.0);
    }
    if design_matrix_cols[0].is_empty() || design_matrix_cols[0].len() != y_values.len() {
        return Err(
            format!(
                "Invalid design matrix ({} cols, {} rows in first col) or y values ({} values)",
                design_matrix_cols.len(),
                if design_matrix_cols.is_empty() {
                    0
                } else {
                    design_matrix_cols[0].len()
                },
                y_values.len()
            )
        );
    }

    // The design_matrix_cols is currently a Vec<Vec<f64>> where each inner Vec is a COLUMN.
    // For standard matrix operations X'X, X needs to be [rows x cols].
    // So, we need to transpose design_matrix_cols before using it as X.
    let x = matrix_transpose(design_matrix_cols); // X is now rows x cols

    // Calculate X'X
    let x_transpose = matrix_transpose(&x); // This is (design_matrix_cols)
    let xtx = matrix_multiply(&x_transpose, &x)?;

    // Calculate X'y
    let xty = matrix_vec_multiply(&x_transpose, y_values)?;

    // Try to invert X'X
    let xtx_inv = match matrix_inverse(&xtx) {
        Ok(inv) => inv,
        Err(_) => {
            return Err("Could not invert X'X matrix in calculate_model_ss (singular)".to_string());
        }
    };

    // Calculate β = (X'X)^-1 X'y
    let beta = matrix_vec_multiply(&xtx_inv, &xty)?;

    // Calculate SS_model = β'X'y
    let ss_model: f64 = beta
        .iter()
        .zip(xty.iter())
        .map(|(b, y_proj_part)| b * y_proj_part)
        .sum();

    Ok(ss_model.max(0.0)) // Ensure SS is not negative due to float precision
}
