use nalgebra::{DMatrix, DVector};

pub fn slice_to_matrix(data: &[f64], rows: usize, cols: usize) -> DMatrix<f64> {
    DMatrix::from_row_slice(rows, cols, data)
}

// Tambahkan underscore pada _rows
pub fn slice_to_vector(data: &[f64], _rows: usize) -> DVector<f64> {
    DVector::from_column_slice(data)
}
