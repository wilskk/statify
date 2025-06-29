// contrast_coefficients.rs
use crate::univariate::models::{
    config::{ ContrastMethod, UnivariateConfig },
    data::AnalysisData,
    result::ContrastCoefficients,
};

use super::core::get_factor_levels;

/// Calculate contrast coefficients if requested
pub fn calculate_contrast_coefficients(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<ContrastCoefficients, String> {
    // Skip if no contrast method specified, no factors, or if ContrastMethod::None
    if config.contrast.factor_list.is_none() {
        return Err("No contrast method specified".to_string());
    }

    let mut parameter = Vec::new();
    let mut coefficients = Vec::new();

    // Add intercept parameter
    if config.model.intercept {
        parameter.push("Intercept".to_string());
    }

    // Process factors based on factor_list if available, otherwise use fix_factor with global contrast method
    let factors_to_process = if let Some(factor_list) = &config.contrast.factor_list {
        factor_list.clone()
    } else if let Some(factors) = &config.main.fix_factor {
        // Use the global contrast method for all factors
        factors
            .iter()
            .map(|f|
                format!("{} ({:?}, Ref: {})", f, config.contrast.contrast_method, if
                    config.contrast.first
                {
                    "First"
                } else {
                    "Last"
                })
            )
            .collect()
    } else {
        return Err("No factors specified for contrast".to_string());
    };

    // Add factor parameters
    let mut factor_info = Vec::new();
    for factor_spec in &factors_to_process {
        // Parse factor specification: "variable_name (contrast_method, Ref: Last|First)"
        let parts: Vec<&str> = factor_spec.split(" (").collect();
        if parts.len() != 2 {
            return Err(format!("Invalid factor specification: {}", factor_spec));
        }

        let factor_name = parts[0].trim();

        // Parse contrast method and reference level
        let settings = parts[1].trim_end_matches(')');
        let settings_parts: Vec<&str> = settings.split(", Ref:").collect();

        let contrast_method_str = settings_parts[0].trim();
        let contrast_method = match contrast_method_str {
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

        let use_first_as_ref = if settings_parts.len() > 1 {
            match settings_parts[1].trim() {
                "First" => true,
                "Last" | _ => false, // Default to Last if not specified or unknown
            }
        } else {
            false // Default to Last if not specified
        };

        // Get factor levels
        let factor_levels = get_factor_levels(data, factor_name)?;

        // Add parameter names
        for level in &factor_levels {
            parameter.push(format!("{}={}", factor_name, level));
        }

        // Store factor info for coefficient calculation
        factor_info.push((
            factor_name.to_string(),
            factor_levels,
            contrast_method,
            use_first_as_ref,
        ));
    }

    // Initialize coefficients
    coefficients = vec![0.0; parameter.len()];

    // Set intercept coefficient
    if config.model.intercept {
        coefficients[0] = 1.0;
    }

    // Set factor coefficients
    let mut param_idx = if config.model.intercept { 1 } else { 0 };

    for (factor_name, factor_levels, contrast_method, use_first_as_ref) in factor_info {
        let level_count = factor_levels.len();

        match contrast_method {
            ContrastMethod::Deviation => {
                // Deviation contrasts: compare each level to the grand mean
                // Set deviation contrast for each level except last
                for i in 0..level_count - 1 {
                    coefficients[param_idx + i] = 1.0 - 1.0 / (level_count as f64);
                }

                // Last level gets -1
                if param_idx + level_count - 1 < coefficients.len() {
                    coefficients[param_idx + level_count - 1] = -1.0;
                }
            }
            ContrastMethod::Simple => {
                // Simple contrasts: compare each level to the reference level
                let ref_level = if use_first_as_ref { 0 } else { level_count - 1 };

                // Set contrast for each level
                for i in 0..level_count {
                    if i == ref_level {
                        coefficients[param_idx + i] = 0.0; // Reference level
                    } else {
                        coefficients[param_idx + i] = 1.0; // Comparison level
                        coefficients[param_idx + ref_level] = -1.0; // Reference level
                    }
                }
            }
            ContrastMethod::Difference => {
                // Difference contrasts: compare each level to the mean of previous levels
                // For each level (except first)
                for i in 1..level_count {
                    // Current level gets weight 1
                    coefficients[param_idx + i] = 1.0;

                    // Previous levels each get weight -1/i
                    for j in 0..i {
                        coefficients[param_idx + j] = -1.0 / (i as f64);
                    }
                }
            }
            ContrastMethod::Helmert => {
                // Helmert contrasts: compare each level to the mean of subsequent levels
                // For each level (except last)
                for i in 0..level_count - 1 {
                    // Current level gets weight 1
                    coefficients[param_idx + i] = 1.0;

                    // Subsequent levels each get weight -1/(level_count-i-1)
                    for j in i + 1..level_count {
                        coefficients[param_idx + j] = -1.0 / ((level_count - i - 1) as f64);
                    }
                }
            }
            ContrastMethod::Repeated => {
                // Repeated contrasts: compare each level to the next level
                // For each level (except last)
                for i in 0..level_count - 1 {
                    // Current level gets weight 1
                    coefficients[param_idx + i] = 1.0;

                    // Next level gets weight -1
                    coefficients[param_idx + i + 1] = -1.0;
                }
            }
            ContrastMethod::Polynomial => {
                // Polynomial contrasts: orthogonal polynomials across levels
                // Generate polynomial contrasts
                // Linear trend: equally spaced contrast
                let linear_contrast = generate_polynomial_contrast(level_count, 1);

                // Apply the contrast
                for i in 0..level_count {
                    if param_idx + i < coefficients.len() {
                        coefficients[param_idx + i] = linear_contrast[i];
                    }
                }
            }
            ContrastMethod::None => {
                // No contrasts for this factor
            }
        }

        param_idx += level_count;
    }

    Ok(ContrastCoefficients {
        parameter,
        coefficients,
    })
}

/// Generate polynomial contrasts of specified degree for a given number of levels
pub fn generate_polynomial_contrast(level_count: usize, degree: usize) -> Vec<f64> {
    let mut contrasts = vec![0.0; level_count];

    // Generate simple linear contrast for degree 1
    if degree == 1 {
        let denominator = ((level_count * level_count - 1) as f64) / 12.0;
        let scale = 1.0 / denominator.sqrt();

        // For equally spaced values from -1 to 1
        for i in 0..level_count {
            let x = -1.0 + (2.0 * (i as f64)) / ((level_count - 1) as f64);
            contrasts[i] = x * scale;
        }
    } else {
        // Higher degree polynomials would need Gram-Schmidt orthogonalization
        // Simplified implementation for higher degrees
        for i in 0..level_count {
            let x = -1.0 + (2.0 * (i as f64)) / ((level_count - 1) as f64);
            contrasts[i] = x.powi(degree as i32);
        }

        // Normalize
        let sum_sq = contrasts
            .iter()
            .map(|x| x * x)
            .sum::<f64>()
            .sqrt();
        if sum_sq > 0.0 {
            for i in 0..level_count {
                contrasts[i] /= sum_sq;
            }
        }
    }

    contrasts
}
