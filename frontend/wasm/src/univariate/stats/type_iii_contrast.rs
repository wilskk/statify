use std::collections::{ HashMap, HashSet };
use nalgebra::DMatrix;
use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::DesignMatrixInfo,
};
use super::factor_utils::*;
use super::common::*;

#[derive(Debug, Clone)]
/// Structure to hold Type III contrast information
pub struct TypeIIIContrastInfo {
    pub term_name: String,
    pub factor_levels: HashMap<String, Vec<String>>,
    pub interaction_factors: Vec<String>,
    pub coefficient_matrix: DMatrix<f64>,
}

/// Generate Type III contrast coefficients for a given term
pub fn generate_type_iii_contrast(
    term_name: &str,
    design_info: &DesignMatrixInfo,
    data: &AnalysisData
) -> Result<TypeIIIContrastInfo, String> {
    // Get factor levels for all factors in the term
    let mut factor_levels = HashMap::new();
    let factors = parse_interaction_term(term_name);

    // Get factor levels using get_factor_levels
    for factor in &factors {
        let levels = get_factor_levels(data, factor)?;
        factor_levels.insert(factor.clone(), levels);
    }

    // Get interaction factors (factors that interact with this term)
    let interaction_factors = get_interaction_factors(term_name, &design_info.term_names);

    // Generate coefficient matrix
    let coefficient_matrix = generate_coefficient_matrix(
        term_name,
        &factor_levels,
        &interaction_factors,
        design_info,
        data
    )?;

    Ok(TypeIIIContrastInfo {
        term_name: term_name.to_string(),
        factor_levels,
        interaction_factors,
        coefficient_matrix,
    })
}

/// Get factors that interact with the given term
fn get_interaction_factors(term_name: &str, all_terms: &[String]) -> Vec<String> {
    let factors = parse_interaction_term(term_name);

    // If it's a main effect (single factor), return empty vector
    if factors.len() == 1 {
        return Vec::new();
    }

    let term_factors: HashSet<_> = factors.into_iter().collect();
    let mut interaction_factors = HashSet::new();

    for other_term in all_terms {
        if other_term != term_name {
            let other_factors: HashSet<_> = parse_interaction_term(other_term)
                .into_iter()
                .collect();
            if !other_factors.is_disjoint(&term_factors) {
                // Add only unique factors that are not in the original term
                interaction_factors.extend(other_factors.difference(&term_factors).cloned());
            }
        }
    }

    // Convert HashSet back to Vec and sort for consistent ordering
    let mut result: Vec<String> = interaction_factors.into_iter().collect();
    result.sort();
    result
}

/// Generate coefficient matrix for Type III contrasts
fn generate_coefficient_matrix(
    term_name: &str,
    factor_levels: &HashMap<String, Vec<String>>,
    interaction_factors: &[String],
    design_info: &DesignMatrixInfo,
    data: &AnalysisData
) -> Result<DMatrix<f64>, String> {
    let factors = parse_interaction_term(term_name);
    let mut coefficient_matrix = DMatrix::zeros(design_info.p_parameters, design_info.p_parameters);

    // For main effects
    if factors.len() == 1 {
        let factor = &factors[0];
        if let Some(levels) = factor_levels.get(factor) {
            let n_levels = levels.len();

            // Generate contrast coefficients for each level
            for i in 0..n_levels - 1 {
                // n_levels - 1 contrasts for n levels
                let mut row = vec![0.0; design_info.p_parameters];

                // Set main effect coefficients
                if let Some((start_col, end_col)) = design_info.term_column_indices.get(term_name) {
                    // Set contrast coefficients for main effect
                    row[*start_col + i] = 1.0;
                    row[*start_col + n_levels - 1] = -1.0; // Reference level

                    // Set coefficients for interaction terms
                    for interaction_factor in interaction_factors {
                        let interaction_term = format!("{}*{}", factor, interaction_factor);
                        if
                            let Some((int_start, int_end)) = design_info.term_column_indices.get(
                                &interaction_term
                            )
                        {
                            if
                                let Some(n_int_levels) = factor_levels
                                    .get(interaction_factor)
                                    .map(|l| l.len())
                            {
                                // Set coefficients for interaction terms
                                // For each level of the main factor
                                for j in 0..n_int_levels {
                                    let interaction_idx = *int_start + i * n_int_levels + j;
                                    if interaction_idx <= *int_end {
                                        row[interaction_idx] = 1.0 / (n_int_levels as f64);
                                        // Set reference level interaction coefficient
                                        let ref_interaction_idx =
                                            *int_start + (n_levels - 1) * n_int_levels + j;
                                        if ref_interaction_idx <= *int_end {
                                            row[ref_interaction_idx] = -1.0 / (n_int_levels as f64);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Add row to coefficient matrix
                for j in 0..design_info.p_parameters {
                    coefficient_matrix[(i, j)] = row[j];
                }
            }
        }
    } else {
        // For interaction effects
        // Generate all possible combinations of factor levels
        let mut level_combinations = Vec::new();
        generate_level_combinations(
            &factors
                .iter()
                .map(|f| (f.clone(), factor_levels.get(f).unwrap().clone()))
                .collect::<Vec<_>>(),
            &mut HashMap::new(),
            0,
            &mut level_combinations
        );

        // Calculate degrees of freedom for interaction
        let df = factors
            .iter()
            .map(|f| factor_levels.get(f).unwrap().len() - 1)
            .product::<usize>();

        // Generate contrast coefficients for each degree of freedom
        for i in 0..df {
            let mut row = vec![0.0; design_info.p_parameters];

            // Set interaction effect coefficients
            if let Some((start_col, end_col)) = design_info.term_column_indices.get(term_name) {
                // Set contrast coefficients for interaction
                let n_combinations = level_combinations.len();
                let ref_combo_idx = n_combinations - 1; // Reference combination

                // Set coefficients for current combination
                row[*start_col + i] = 1.0;
                // Set coefficient for reference combination
                row[*start_col + ref_combo_idx] = -1.0;

                // Set coefficients for higher-order interactions
                for higher_order_term in design_info.term_names.iter() {
                    if higher_order_term != term_name && higher_order_term.contains(term_name) {
                        let additional_factors: Vec<_> = parse_interaction_term(higher_order_term)
                            .into_iter()
                            .filter(|f| !factors.contains(f))
                            .collect();

                        if
                            let Some((int_start, int_end)) =
                                design_info.term_column_indices.get(higher_order_term)
                        {
                            let n_additional_levels = additional_factors
                                .iter()
                                .filter_map(|f| factor_levels.get(f).map(|l| l.len()))
                                .product::<usize>();

                            // Set coefficients for higher-order interactions
                            for j in 0..n_additional_levels {
                                let higher_order_idx = *int_start + i * n_additional_levels + j;
                                if higher_order_idx <= *int_end {
                                    row[higher_order_idx] = 1.0 / (n_additional_levels as f64);
                                    // Set reference combination coefficient
                                    let ref_higher_order_idx =
                                        *int_start + ref_combo_idx * n_additional_levels + j;
                                    if ref_higher_order_idx <= *int_end {
                                        row[ref_higher_order_idx] =
                                            -1.0 / (n_additional_levels as f64);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Add row to coefficient matrix
            for j in 0..design_info.p_parameters {
                coefficient_matrix[(i, j)] = row[j];
            }
        }
    }

    Ok(coefficient_matrix)
}

/// Calculate Type III contrast coefficients for all terms
pub fn calculate_type_iii_contrasts(
    design_info: &DesignMatrixInfo,
    data: &AnalysisData
) -> Result<Vec<TypeIIIContrastInfo>, String> {
    let mut contrast_infos = Vec::new();

    for term_name in &design_info.term_names {
        if term_name != "Intercept" {
            let contrast_info = generate_type_iii_contrast(term_name, design_info, data)?;
            contrast_infos.push(contrast_info);
        }
    }

    Ok(contrast_infos)
}
