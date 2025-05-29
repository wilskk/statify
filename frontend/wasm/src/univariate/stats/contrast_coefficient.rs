use crate::univariate::models::{
    config::{ ContrastMethod, UnivariateConfig },
    data::AnalysisData,
    result::{ ContrastCoefficients, ContrastCoefficientsEntry, DesignMatrixInfo },
};

use super::core::*;

/// Calculate contrast coefficients if requested
pub fn calculate_contrast_coefficients(
    data: &AnalysisData,
    config: &UnivariateConfig,
    design_info: &DesignMatrixInfo
) -> Result<ContrastCoefficients, String> {
    // Skip if no contrast method specified
    if config.contrast.factor_list.is_none() {
        return Err("No contrast method specified".to_string());
    }

    let mut entries = Vec::new();
    let mut notes = Vec::new();

    // Get the list of factors to process from config
    let factors_to_process = if let Some(factor_list) = &config.contrast.factor_list {
        factor_list.clone()
    } else {
        return Err("No factors specified for contrast".to_string());
    };

    // Get all parameter names using generate_all_row_parameter_names_sorted
    let all_parameters = generate_all_row_parameter_names_sorted(design_info, data)?;

    // Process each term in the design matrix
    for term_name in &design_info.term_names {
        // Check if this term contains any of the factors we want to process
        let term_factors: Vec<String> = term_name
            .split('*')
            .map(|s| s.trim().to_string())
            .collect();

        // Find which factors in this term are in our factor_list
        let factors_to_contrast: Vec<String> = term_factors
            .iter()
            .filter(|&f| factors_to_process.iter().any(|spec| spec.starts_with(f)))
            .cloned()
            .collect();

        if factors_to_contrast.is_empty() {
            continue;
        }

        // Get column indices for this term
        let (start_col, end_col) = design_info.term_column_indices
            .get(term_name)
            .ok_or_else(|| format!("Term '{}' not found in design matrix", term_name))?;

        // Process each factor in the term that needs contrast
        for factor_name in &factors_to_contrast {
            // Find the contrast specification for this factor
            let factor_spec = factors_to_process
                .iter()
                .find(|&spec| spec.starts_with(factor_name))
                .ok_or_else(||
                    format!("No contrast specification found for factor '{}'", factor_name)
                )?;

            // Parse factor specification: "variable_name (contrast_method, Ref: Last|First)"
            let parts: Vec<&str> = factor_spec.split(" (").collect();

            // Default contrast method and reference level
            let mut contrast_method = ContrastMethod::None;
            let mut use_first_as_ref = false;

            // If there's a contrast method specification, parse it
            if parts.len() > 1 {
                let settings = parts[1].trim_end_matches(')');
                let settings_parts: Vec<&str> = settings.split(", Ref:").collect();

                let contrast_method_str = settings_parts[0].trim();
                contrast_method = match contrast_method_str {
                    "Deviation" => ContrastMethod::Deviation,
                    "Simple" => ContrastMethod::Simple,
                    "Difference" => ContrastMethod::Difference,
                    "Helmert" => ContrastMethod::Helmert,
                    "Repeated" => ContrastMethod::Repeated,
                    "Polynomial" => ContrastMethod::Polynomial,
                    _ => {
                        return Err(format!("Unknown contrast method: {}", contrast_method_str));
                    }
                };

                use_first_as_ref = if settings_parts.len() > 1 {
                    match settings_parts[1].trim() {
                        "First" => true,
                        "Last" | _ => false, // Default to Last if not specified or unknown
                    }
                } else {
                    false // Default to Last if not specified
                };
            }

            // Get factor levels
            let factor_levels = get_factor_levels(data, factor_name)?;
            let level_count = factor_levels.len();

            // Generate contrast coefficients based on the method
            let mut coefficients = vec![vec![0.0; design_info.p_parameters]; level_count - 1];

            match contrast_method {
                ContrastMethod::Deviation => {
                    // Deviation contrasts: compare each level to the grand mean
                    for i in 0..level_count - 1 {
                        for j in *start_col..=*end_col {
                            coefficients[i][j] = if j == *start_col + i {
                                1.0 - 1.0 / (level_count as f64)
                            } else {
                                -1.0 / (level_count as f64)
                            };
                        }
                    }
                }
                ContrastMethod::Simple => {
                    // Simple contrasts: compare each level to the reference level
                    let ref_level = if use_first_as_ref { 0 } else { level_count - 1 };
                    for i in 0..level_count - 1 {
                        let current_level = if i >= ref_level { i + 1 } else { i };
                        for j in *start_col..=*end_col {
                            coefficients[i][j] = if j == *start_col + current_level {
                                1.0
                            } else if j == *start_col + ref_level {
                                -1.0
                            } else {
                                0.0
                            };
                        }
                    }
                }
                ContrastMethod::Difference => {
                    // Difference contrasts: compare each level to the mean of previous levels
                    for i in 1..level_count {
                        for j in *start_col..=*end_col {
                            if j == *start_col + i {
                                coefficients[i - 1][j] = 1.0;
                            } else if j < *start_col + i {
                                coefficients[i - 1][j] = -1.0 / (i as f64);
                            }
                        }
                    }
                }
                ContrastMethod::Helmert => {
                    // Helmert contrasts: compare each level to the mean of subsequent levels
                    for i in 0..level_count - 1 {
                        for j in *start_col..=*end_col {
                            if j == *start_col + i {
                                coefficients[i][j] = 1.0;
                            } else if j > *start_col + i {
                                coefficients[i][j] = -1.0 / ((level_count - i - 1) as f64);
                            }
                        }
                    }
                }
                ContrastMethod::Repeated => {
                    // Repeated contrasts: compare each level to the next level
                    for i in 0..level_count - 1 {
                        for j in *start_col..=*end_col {
                            if j == *start_col + i {
                                coefficients[i][j] = 1.0;
                            } else if j == *start_col + i + 1 {
                                coefficients[i][j] = -1.0;
                            }
                        }
                    }
                }
                ContrastMethod::Polynomial => {
                    // Generate polynomial contrasts for each degree
                    let max_degree = (level_count - 1).min(3); // Limit to cubic (degree 3)
                    for degree in 1..=max_degree {
                        let polynomial_contrast = generate_polynomial_contrast(level_count, degree);
                        for i in 0..level_count - 1 {
                            for j in *start_col..=*end_col {
                                if j == *start_col + i {
                                    coefficients[i][j] = polynomial_contrast[i];
                                }
                            }
                        }
                    }
                }
                ContrastMethod::None => {
                    // Default to Simple contrast when no method is specified
                    let ref_level = level_count - 1;
                    for i in 0..level_count - 1 {
                        for j in *start_col..=*end_col {
                            coefficients[i][j] = if j == *start_col + i {
                                1.0
                            } else if j == *start_col + ref_level {
                                -1.0
                            } else {
                                0.0
                            };
                        }
                    }
                }
            }

            // Create L labels based on term indices
            let l_labels: Vec<String> = (0..coefficients.len())
                .map(|i| format!("L{}_{}", *start_col + i + 1, term_name))
                .collect();

            // Create the contrast coefficients entry
            let entry = ContrastCoefficientsEntry {
                parameter: all_parameters.clone(),
                l_label: l_labels,
                coefficients,
            };

            entries.push(entry);
            notes.push(
                format!(
                    "Contrast coefficients for factor '{}' in term '{}' using {:?} method",
                    factor_name,
                    term_name,
                    contrast_method
                )
            );
        }
    }

    if entries.is_empty() {
        return Err("No valid contrast coefficients could be generated".to_string());
    }

    Ok(ContrastCoefficients {
        entries,
        notes,
    })
}

/// Generate polynomial contrasts of specified degree for a given number of levels
pub fn generate_polynomial_contrast(level_count: usize, degree: usize) -> Vec<f64> {
    let mut contrasts = vec![0.0; level_count];

    // Generate polynomial contrast for the specified degree
    match degree {
        1 => {
            // Linear trend
            let denominator = ((level_count * level_count - 1) as f64) / 12.0;
            let scale = 1.0 / denominator.sqrt();

            // For equally spaced values from -1 to 1
            for i in 0..level_count {
                let x = -1.0 + (2.0 * (i as f64)) / ((level_count - 1) as f64);
                contrasts[i] = x * scale;
            }
        }
        2 => {
            // Quadratic trend
            let denominator = ((level_count * level_count - 1) as f64) / 12.0;
            let scale = 1.0 / denominator.sqrt();

            // For equally spaced values from -1 to 1
            for i in 0..level_count {
                let x = -1.0 + (2.0 * (i as f64)) / ((level_count - 1) as f64);
                contrasts[i] = (x * x - 1.0 / 3.0) * scale;
            }
        }
        3 => {
            // Cubic trend
            let denominator = ((level_count * level_count - 1) as f64) / 12.0;
            let scale = 1.0 / denominator.sqrt();

            // For equally spaced values from -1 to 1
            for i in 0..level_count {
                let x = -1.0 + (2.0 * (i as f64)) / ((level_count - 1) as f64);
                contrasts[i] = (x * x * x - (3.0 / 5.0) * x) * scale;
            }
        }
        _ => {
            // Higher degree polynomials using Gram-Schmidt orthogonalization
            let mut x_values: Vec<f64> = (0..level_count)
                .map(|i| -1.0 + (2.0 * (i as f64)) / ((level_count - 1) as f64))
                .collect();

            // Generate orthogonal polynomial coefficients
            let mut poly_coeffs = vec![vec![1.0; level_count]; degree + 1];

            // Gram-Schmidt process
            for i in 1..=degree {
                // Generate x^i
                for j in 0..level_count {
                    poly_coeffs[i][j] = x_values[j].powi(i as i32);
                }

                // Orthogonalize against previous polynomials
                for j in 0..i {
                    let dot_product: f64 = poly_coeffs[i]
                        .iter()
                        .zip(poly_coeffs[j].iter())
                        .map(|(a, b)| a * b)
                        .sum();

                    let norm_squared: f64 = poly_coeffs[j]
                        .iter()
                        .map(|x| x * x)
                        .sum();

                    if norm_squared > 0.0 {
                        let scale = dot_product / norm_squared;
                        for k in 0..level_count {
                            poly_coeffs[i][k] -= scale * poly_coeffs[j][k];
                        }
                    }
                }

                // Normalize
                let norm: f64 = poly_coeffs[i]
                    .iter()
                    .map(|x| x * x)
                    .sum::<f64>()
                    .sqrt();

                if norm > 0.0 {
                    for j in 0..level_count {
                        poly_coeffs[i][j] /= norm;
                    }
                }
            }

            // Use the coefficients for the requested degree
            contrasts = poly_coeffs[degree].clone();
        }
    }

    contrasts
}
