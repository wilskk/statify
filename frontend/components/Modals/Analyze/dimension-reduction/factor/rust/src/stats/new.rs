FINAL BENAR - BACKUP


// =========================================================================
// FUNGSI 1: Calculate Component Score Coefficient Matrix
// =========================================================================
pub fn calculate_component_score_coefficient_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ComponentScoreCoefficientMatrix, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let matrix_type = if config.extraction.covariance { "covariance" } else { "correlation" };
    let base_matrix = calculate_matrix(&data_matrix, matrix_type)?;
    let extraction_result = extract_factors(&base_matrix, config, &var_names)?;
    let rotation_result = rotate_factors(&extraction_result, config)?;
    
    let is_pca = matches!(config.extraction.method, ExtractionMethod::PrincipalComponents);

    let n_rows = extraction_result.loadings.nrows();
    let n_cols = extraction_result.loadings.ncols();
    let mut coefficients = DMatrix::zeros(n_rows, n_cols);

    if is_pca {
        // EXACT SPSS ALGORITHM FOR PCA: W = A * D^(-1) * (T^T)^(-1)
        let t_mat = &rotation_result.transformation_matrix;
        let t_inv_t = t_mat.clone().try_inverse()
            .unwrap_or_else(|| DMatrix::identity(n_cols, n_cols))
            .transpose();
        
        for i in 0..n_rows {
            for j in 0..n_cols {
                let mut sum = 0.0;
                for k in 0..n_cols {
                    let a_ik = extraction_result.loadings[(i, k)];
                    let d_k = extraction_result.eigenvalues[k];
                    
                    // Proteksi division by zero yang presisi
                    let ad_ik = if d_k.abs() > 1e-12 { a_ik / d_k } else { 0.0 };
                    sum += ad_ik * t_inv_t[(k, j)];
                }
                coefficients[(i, j)] = sum;
            }
        }
    } else {
        // REGRESSION METHOD FOR NON-PCA (PAF, ML, GLS)
        let r_matrix = calculate_matrix(&data_matrix, "correlation")?;
        let pattern_matrix = rotation_result.rotated_loadings.clone();
        
        // Gunakan pseudoinverse sebagai langkah fallback yang aman
        let r_inverse = match r_matrix.clone().try_inverse() {
            Some(inv) => inv,
            None => compute_pseudoinverse(&r_matrix).unwrap_or_else(|_| DMatrix::zeros(n_rows, n_rows))
        };
        
        let structure_matrix = if let Some(phi) = &rotation_result.factor_correlations {
            &pattern_matrix * phi
        } else {
            pattern_matrix.clone()
        };
        
        if config.scores.regression {
            coefficients = &r_inverse * &structure_matrix;
        } else if config.scores.bartlett {
            let mut u_inv_squared = DMatrix::zeros(n_rows, n_rows);
            for i in 0..n_rows {
                let u2 = (1.0 - extraction_result.communalities[i]).max(1e-9);
                u_inv_squared[(i, i)] = 1.0 / u2;
            }
            let p = &pattern_matrix;
            let term_inner = p.transpose() * &u_inv_squared * p;
            let term_inner_inv = term_inner.try_inverse().unwrap_or_else(|| DMatrix::identity(n_cols, n_cols));
            coefficients = &u_inv_squared * p * term_inner_inv;
        } else if config.scores.anderson {
            let b = &r_inverse * &structure_matrix;
            let g_matrix = b.transpose() * &r_matrix * &b;
            if let Some(g_sqrt) = symmetric_matrix_sqrt_robust(&g_matrix) {
                let g_sqrt_inv = g_sqrt.try_inverse().unwrap_or_else(|| DMatrix::identity(n_cols, n_cols));
                coefficients = b * g_sqrt_inv;
            } else {
                coefficients = b;
            }
        }
    }

    let mut result = ComponentScoreCoefficientMatrix {
        components: std::collections::HashMap::new(),
        variable_order: var_names.clone(),
    };
    for (i, var_name) in var_names.iter().enumerate() {
        if i < coefficients.nrows() {
            let mut row = Vec::with_capacity(n_cols);
            for j in 0..n_cols {
                row.push(coefficients[(i, j)]);
            }
            result.components.insert(var_name.clone(), row);
        }
    }
    Ok(result)
}

// =========================================================================
// FUNGSI 2: Calculate Component Score Covariance Matrix
// =========================================================================
pub fn calculate_component_score_covariance_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ComponentScoreCovarianceMatrix, String> {

    let matrix_type = if config.extraction.covariance {
        "covariance"
    } else {
        "correlation"
    };

    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let base_matrix = calculate_matrix(&data_matrix, matrix_type)?;

    let is_pca = matches!(config.extraction.method, ExtractionMethod::PrincipalComponents);
    let has_rotation = !config.rotation.none && config.rotation.rotated_sol;
    let is_oblique = config.rotation.oblimin || config.rotation.promax;

    // ==========================================================
    // SCORE COVARIANCE MATRIX LOGIC
    // ==========================================================
    let covariance_matrix = if is_pca && (!has_rotation || !is_oblique) {
        // PCA Orthogonal (Varimax/Equamax) -> Matriks Identitas
        let extraction_result = extract_factors(&base_matrix, config, &var_names)?;
        let n_factors = extraction_result.n_factors;
        DMatrix::<f64>::identity(n_factors, n_factors)
    } else if is_pca && is_oblique {
        // ======================================================
        // SPSS ANOMALY REPLICATION FOR PCA OBLIQUE
        // SPSS secara keliru mencetak Kuadrat dari Component Correlation Matrix (Phi^2)
        // ======================================================
        let extraction_result = extract_factors(&base_matrix, config, &var_names)?;
        let rotation_result = rotate_factors(&extraction_result, config)?;
        
        // Ambil Phi (Component Correlation Matrix)
        let phi = rotation_result.factor_correlations
            .clone()
            .unwrap_or_else(|| DMatrix::identity(extraction_result.n_factors, extraction_result.n_factors));
        
        // Hitung Phi * Phi (Phi^2) untuk meniru output SPSS
        let mut cov = &phi * &phi;
        
        // Paksa diagonal kembali menjadi 1.000 untuk menyempurnakan format SPSS
        for i in 0..cov.nrows() {
            cov[(i, i)] = 1.0;
        }
        
        cov
    } else {
        // ======================================================
        // NON-PCA (PAF, ML, GLS)
        // SPSS menggunakan operasi matematis murni W^T * R * W
        // ======================================================
        let coeff_result = calculate_component_score_coefficient_matrix(data, config)?;

        let n_factors = coeff_result.components.values().next().map(|v| v.len()).unwrap_or(0);
        if n_factors == 0 {
            return Err("No factors found for covariance calculation".to_string());
        }

        let n_vars = base_matrix.nrows();
        let mut w_matrix = DMatrix::<f64>::zeros(n_vars, n_factors);

        for (row_idx, var_name) in coeff_result.variable_order.iter().enumerate() {
            if let Some(vals) = coeff_result.components.get(var_name) {
                for (col_idx, &val) in vals.iter().enumerate() {
                    if col_idx < n_factors {
                        w_matrix[(row_idx, col_idx)] = val;
                    }
                }
            }
        }

        // Kalkulasi Eksak: W^T * R * W
        w_matrix.transpose() * &base_matrix * &w_matrix
    };

    // ==========================================================
    // FORMAT OUTPUT
    // ==========================================================
    let mut output_components = Vec::new();

    for i in 0..covariance_matrix.nrows() {
        let mut row = Vec::new();
        for j in 0..covariance_matrix.ncols() {
            row.push(covariance_matrix[(i, j)]);
        }
        output_components.push(row);
    }

    Ok(ComponentScoreCovarianceMatrix {
        components: output_components,
    })
}
