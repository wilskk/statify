use std::collections::{ HashMap, HashSet };

use crate::univariate::models::data::{ AnalysisData, DataRecord };
use super::core::*;
use crate::univariate::models::config::UnivariateConfig;

pub fn get_factor_levels(data: &AnalysisData, factor_name: &str) -> Result<Vec<String>, String> {
    let mut level_set = HashSet::new();
    let mut factor_definition_found = false;

    for (group_idx, def_group) in data.fix_factor_data_defs.iter().enumerate() {
        if def_group.iter().any(|def| def.name == factor_name) {
            factor_definition_found = true;
            if let Some(data_records_for_group) = data.fix_factor_data.get(group_idx) {
                for record in data_records_for_group {
                    if let Some(value) = record.values.get(factor_name) {
                        level_set.insert(data_value_to_string(value));
                    }
                }
            }
        }
    }

    if let Some(random_defs_groups) = &data.random_factor_data_defs {
        for (group_idx, def_group) in random_defs_groups.iter().enumerate() {
            if def_group.iter().any(|def| def.name == factor_name) {
                factor_definition_found = true;
                if let Some(random_data_groups_vec) = &data.random_factor_data {
                    if let Some(data_records_for_group) = random_data_groups_vec.get(group_idx) {
                        for record in data_records_for_group {
                            if let Some(value) = record.values.get(factor_name) {
                                level_set.insert(data_value_to_string(value));
                            }
                        }
                    }
                }
            }
        }
    }

    if factor_definition_found {
        Ok(level_set.into_iter().collect())
    } else {
        // Check if it's a covariate, which shouldn't be used here
        let is_covariate = data.covariate_data_defs
            .as_ref()
            .map_or(false, |cov_defs_groups| {
                cov_defs_groups
                    .iter()
                    .any(|def_group| def_group.iter().any(|def| def.name == factor_name))
            });

        if is_covariate {
            Err(
                format!("'{}' is defined as a covariate. Covariates do not have discrete levels for this operation. Please use a categorical (fixed or random) factor.", factor_name)
            )
        } else {
            Err(
                format!("Factor '{}' not found or not defined as a categorical (fixed or random) factor.", factor_name)
            )
        }
    }
}

/// Memeriksa apakah record cocok dengan kombinasi faktor tertentu
pub fn matches_combination(record: &DataRecord, combo: &HashMap<String, String>) -> bool {
    for (factor, level) in combo {
        let record_level = record.values.get(factor).map(data_value_to_string);
        match record_level {
            Some(ref r_level) if r_level == level => {
                continue;
            }
            _ => {
                return false;
            }
        }
    }
    true
}

/// Parsing istilah interaksi (misalnya, "A*B") menjadi vektor nama faktor
/// Menangani istilah interaksi (A*B) dan istilah nesting (A(B) atau A WITHIN B)
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

/// Fungsi pembantu untuk menemukan tanda kurung tutup yang sesuai
pub fn find_matching_parenthesis(text: &str, open_pos: usize) -> Option<usize> {
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

/// Helper function to generate lower order terms recursively
pub fn generate_lower_order_terms(
    factors: &[String],
    size: usize,
    current: &mut Vec<String>,
    start: usize,
    result: &mut Vec<String>
) {
    if current.len() == size {
        // Join the factors with "*" to create the interaction term
        result.push(current.join("*"));
        return;
    }

    for i in start..factors.len() {
        current.push(factors[i].clone());
        generate_lower_order_terms(factors, size, current, i + 1, result);
        current.pop();
    }
}

/// Menghasilkan semua kemungkinan istilah interaksi dari daftar faktor
pub fn generate_interaction_terms(factors: &[String]) -> Vec<String> {
    if factors.is_empty() {
        return Vec::new();
    }

    let mut interactions = Vec::new();

    // Generate all possible combinations of factors from size 2 to size N
    for size in 2..=factors.len() {
        // Assuming generate_lower_order_terms is in the same module (factor_utils)
        generate_lower_order_terms(factors, size, &mut Vec::new(), 0, &mut interactions);
    }

    interactions
}

/// Generate all possible combinations of factor levels
pub fn generate_level_combinations(
    factor_levels: &[(String, Vec<String>)],
    current: &mut HashMap<String, String>,
    index: usize,
    result: &mut Vec<HashMap<String, String>>
) {
    if index == factor_levels.len() {
        result.push(current.clone());
        return;
    }

    let (factor_name, levels) = &factor_levels[index];
    for level in levels {
        current.insert(factor_name.clone(), level.clone());
        generate_level_combinations(factor_levels, current, index + 1, result);
    }
}

/// Generate model terms for non-custom model
pub fn generate_non_cust_terms(config: &UnivariateConfig) -> Result<Vec<String>, String> {
    let mut terms = Vec::new();
    let mut factors_for_interaction = Vec::new();

    // Add main effects for Fixed Factors and collect them for interaction generation
    if let Some(fix_factors) = &config.main.fix_factor {
        for factor_name in fix_factors {
            if !terms.contains(factor_name) {
                terms.push(factor_name.clone());
            }
            factors_for_interaction.push(factor_name.clone());
        }
    }

    // Add main effects for Random Factors and collect them for interaction generation
    if let Some(random_factors) = &config.main.rand_factor {
        for factor_name in random_factors {
            if !terms.contains(factor_name) {
                terms.push(factor_name.clone());
            }
            factors_for_interaction.push(factor_name.clone()); // Add to interaction list
        }
    }

    // Add Covariates as main effects ONLY (not added to factors_for_interaction)
    if let Some(covariates) = &config.main.covar {
        for covar_name in covariates {
            if !terms.contains(covar_name) {
                terms.push(covar_name.clone());
            }
        }
    }

    // Add all possible interaction terms among Fixed and Random factors
    if factors_for_interaction.len() > 1 {
        // generate_interaction_terms produces 2-way, 3-way, ..., up to N-way interactions.
        terms.extend(generate_interaction_terms(&factors_for_interaction));
    }

    Ok(terms)
}

/// Generate model terms for custom model
pub fn generate_custom_terms(config: &UnivariateConfig) -> Result<Vec<String>, String> {
    let mut terms = Vec::new();

    // Add main effects from factors_model. These are candidates for interactions.
    if let Some(factors_model) = &config.model.factors_model {
        for factor_name in factors_model {
            if !terms.contains(factor_name) {
                terms.push(factor_name.clone());
            }
        }
    }

    // Add covariates from cov_model as main effects only
    if let Some(cov_model_str) = &config.model.cov_model {
        for term_name in cov_model_str.split_whitespace() {
            if !terms.contains(&term_name.to_string()) {
                terms.push(term_name.to_string());
            }
        }
    }
    Ok(terms)
}

/// Generate a design string for reporting purposes
pub fn generate_design_string(config: &UnivariateConfig) -> String {
    let mut design_string = if config.model.intercept {
        "Design: Intercept".to_string()
    } else {
        "Design: ".to_string()
    };

    // Add covariates
    if let Some(covariates) = &config.main.covar {
        for covariate in covariates {
            design_string.push_str(" + ");
            design_string.push_str(covariate);
        }
    }

    // Add fixed factors
    let fix_factors = config.main.fix_factor.clone().unwrap_or_default();
    for factor in &fix_factors {
        design_string.push_str(" + ");
        design_string.push_str(factor);
    }

    // Add interactions
    if fix_factors.len() > 1 && config.model.term_text.is_none() {
        design_string.push_str(" + Interactions involving fixed factors");
    }

    // Add custom terms if specified
    if let Some(term_text) = &config.model.term_text {
        for term in term_text.split('+') {
            let trimmed = term.trim();
            if trimmed.contains('*') {
                design_string.push_str(" + ");
                design_string.push_str(trimmed);
            }
        }
    }

    design_string
}
