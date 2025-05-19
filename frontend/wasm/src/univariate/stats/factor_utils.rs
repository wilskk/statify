use std::collections::HashMap;

use crate::univariate::models::data::{ AnalysisData, DataValue };
use super::core::*;

/// Parse interaction term (e.g., "A*B") into a vector of factor names
/// Handles both interaction terms (A*B) and nesting terms (A(B) or A WITHIN B)
pub fn parse_interaction_term(interaction_term: &str) -> Vec<String> {
    // Handle nesting format "A WITHIN B"
    if interaction_term.contains("WITHIN") {
        let parts: Vec<&str> = interaction_term.split("WITHIN").collect();
        if parts.len() == 2 {
            return vec![parts[0].trim().to_string(), parts[1].trim().to_string()];
        }
    }

    // Handle nesting format "A(B)"
    if interaction_term.contains('(') && interaction_term.contains(')') {
        let mut factors = Vec::new();
        let mut current_term = interaction_term;

        while let Some(open_paren) = current_term.find('(') {
            // Extract the outer factor (before the parenthesis)
            let outer_factor = current_term[..open_paren].trim();
            if !outer_factor.is_empty() {
                factors.push(outer_factor.to_string());
            }

            // Check for matching closing parenthesis
            if let Some(close_paren) = find_matching_parenthesis(current_term, open_paren) {
                // Extract the inner term
                let inner_term = current_term[open_paren + 1..close_paren].trim();

                // Move to process the inner term
                current_term = inner_term;
            } else {
                // No matching parenthesis, stop processing
                break;
            }
        }

        // Add the innermost term if there is one
        if !current_term.is_empty() && !current_term.contains('(') && !current_term.contains(')') {
            factors.push(current_term.trim().to_string());
        }

        if !factors.is_empty() {
            return factors;
        }
    }

    // Default: standard interaction with "*"
    interaction_term
        .split('*')
        .map(|s| s.trim().to_string())
        .collect()
}

/// Helper function to find the matching closing parenthesis
fn find_matching_parenthesis(text: &str, open_pos: usize) -> Option<usize> {
    let chars: Vec<char> = text.chars().collect();
    let mut depth = 0;

    for i in open_pos..chars.len() {
        match chars[i] {
            '(' => {
                depth += 1;
            }
            ')' => {
                depth -= 1;
                if depth == 0 {
                    return Some(i);
                }
            }
            _ => {}
        }
    }

    None
}

/// Checks if there are missing cells in the design for a factor
pub fn check_for_missing_cells(data: &AnalysisData, factor: &str) -> Result<bool, String> {
    // Get all factors
    let mut all_factors = Vec::new();
    if let Some(fix_factor_defs) = data.fix_factor_data_defs.get(0) {
        for factor_def in fix_factor_defs {
            all_factors.push(factor_def.name.clone());
        }
    }

    // For each other factor, check if all combinations with this factor exist
    for other_factor in &all_factors {
        if other_factor == factor {
            continue;
        }

        let factor_levels = get_factor_levels(data, factor)?;
        let other_levels = get_factor_levels(data, other_factor)?;

        // Generate all possible combinations
        let mut missing_combinations = Vec::new();
        for level in &factor_levels {
            for other_level in &other_levels {
                let mut found = false;

                // Check if this combination exists in the data
                for dep_records in &data.dependent_data {
                    for _dep_record in dep_records {
                        let mut factor_match = false;
                        let mut other_match = false;

                        // Look for this combination in fix_factor_data
                        for fix_factor_group in &data.fix_factor_data {
                            for fix_record in fix_factor_group {
                                if let Some(value) = fix_record.values.get(factor) {
                                    if data_value_to_string(value) == *level {
                                        factor_match = true;
                                    }
                                }

                                if let Some(value) = fix_record.values.get(other_factor) {
                                    if data_value_to_string(value) == *other_level {
                                        other_match = true;
                                    }
                                }
                            }
                        }

                        if factor_match && other_match {
                            found = true;
                            break;
                        }
                    }

                    if found {
                        break;
                    }
                }

                if !found {
                    // This combination is missing
                    missing_combinations.push((level.clone(), other_level.clone()));
                }
            }
        }

        if !missing_combinations.is_empty() {
            return Ok(true);
        }
    }

    Ok(false)
}

/// Calculate degrees of freedom for an interaction effect
pub fn calculate_interaction_df(
    data: &AnalysisData,
    interaction_term: &str
) -> Result<usize, String> {
    let factors = parse_interaction_term(interaction_term);
    let mut df = 1;

    // For each factor in the interaction, multiply by (levels - 1)
    for factor in &factors {
        let factor_levels = get_factor_levels(data, factor)?;
        if factor_levels.len() > 1 {
            df *= factor_levels.len() - 1;
        }
    }

    Ok(df)
}

/// Get values adjusted for previous factors (for Type I SS)
pub fn get_level_values_adjusted(
    residual_values: &[f64],
    data: &AnalysisData,
    factor: &str,
    level: &str,
    _dep_var_name: &str
) -> Result<Vec<f64>, String> {
    let mut level_values = Vec::new();
    let mut i = 0;

    for dep_records in &data.dependent_data {
        for dep_record in dep_records {
            if i >= residual_values.len() {
                continue;
            }

            // Find if this record matches the specified factor level
            let mut factor_level_match = false;

            // Search through fix_factor_data to find if this record corresponds to the specified level
            for fix_factor_group in &data.fix_factor_data {
                for fix_record in fix_factor_group {
                    if let Some(value) = fix_record.values.get(factor) {
                        let current_level = data_value_to_string(value);
                        if current_level == level {
                            factor_level_match = true;
                            break;
                        }
                    }
                }
                if factor_level_match {
                    break;
                }
            }

            if factor_level_match {
                level_values.push(residual_values[i]);
            }

            i += 1;
        }
    }

    Ok(level_values)
}

/// Helper function to generate all lower-order terms from a list of factors
pub fn generate_lower_order_terms(
    factors: &[String],
    size: usize,
    current: &mut Vec<String>,
    start_idx: usize,
    result: &mut Vec<String>
) {
    if current.len() == size {
        result.push(current.join("*"));
        return;
    }

    for i in start_idx..factors.len() {
        current.push(factors[i].clone());
        generate_lower_order_terms(factors, size, current, i + 1, result);
        current.pop();
    }
}

/// Generate all combinations of factor levels for interaction analysis
pub fn generate_level_combinations(
    factor_levels: &[(String, Vec<String>)],
    current_combo: &mut HashMap<String, String>,
    index: usize,
    result: &mut Vec<HashMap<String, String>>
) {
    if index >= factor_levels.len() {
        // We've processed all factors, add this combination
        result.push(current_combo.clone());
        return;
    }

    let (factor, levels) = &factor_levels[index];

    // Process each level for the current factor
    for level in levels {
        current_combo.insert(factor.clone(), level.clone());
        generate_level_combinations(factor_levels, current_combo, index + 1, result);
    }

    // Remove the factor key after processing all its levels
    current_combo.remove(factor);
}
