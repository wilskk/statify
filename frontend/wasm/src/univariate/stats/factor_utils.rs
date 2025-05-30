use std::collections::{ HashMap, HashSet };

use crate::univariate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::DesignMatrixInfo,
};
use super::core::*;

/// Parsing istilah interaksi (misalnya, "A*B") menjadi vektor nama faktor
/// Menangani istilah interaksi (A*B) dan istilah nesting (A(B) atau A WITHIN B)
pub fn parse_interaction_term(term: &str) -> Vec<String> {
    term.split('*')
        .map(|s| s.trim().to_string())
        .collect()
}

/// Parse parameter names dynamically using design matrix info
pub fn parse_parameter_name(param_str: &str) -> HashMap<String, String> {
    let mut factors = HashMap::new();
    if param_str == "Intercept" {
        factors.insert("Intercept".to_string(), "Intercept".to_string());
        return factors;
    }
    param_str.split('*').for_each(|part| {
        let clean_part = part.trim_matches(|c| (c == '[' || c == ']'));
        if let Some((factor, level)) = clean_part.split_once('=') {
            factors.insert(factor.to_string(), level.to_string());
        }
    });

    factors
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

pub fn get_factor_levels(data: &AnalysisData, factor_name: &str) -> Result<Vec<String>, String> {
    let mut level_set = HashSet::new();
    let mut factor_definition_found = false;

    // Check fixed factors first
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

    // Check random factors if present
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

    // Check covariates if present
    if let Some(covar_defs_groups) = &data.covariate_data_defs {
        for (group_idx, def_group) in covar_defs_groups.iter().enumerate() {
            if def_group.iter().any(|def| def.name == factor_name) {
                factor_definition_found = true;
                if let Some(covar_data_groups_vec) = &data.covariate_data {
                    if let Some(data_records_for_group) = covar_data_groups_vec.get(group_idx) {
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

    if !factor_definition_found {
        return Err(format!("Factor '{}' not found in the data", factor_name));
    }

    // Convert HashSet to sorted Vec
    let mut levels: Vec<String> = level_set.into_iter().collect();
    levels.sort();

    Ok(levels)
}

/// Memeriksa apakah record cocok dengan kombinasi faktor tertentu dan mengembalikan baris yang cocok
pub fn matches_combination(combo: &HashMap<String, String>, data: &AnalysisData) -> Vec<f64> {
    let n_samples = data.dependent_data[0].len();
    let mut row = vec![0.0; n_samples];

    // For each record, check if it matches all factor combinations
    for (i, _) in data.dependent_data[0].iter().enumerate() {
        let mut matches = true;

        for (factor, level) in combo {
            let mut factor_matches = false;

            // Check fixed factors
            for (group_idx, def_group) in data.fix_factor_data_defs.iter().enumerate() {
                if def_group.iter().any(|def| &def.name == factor) {
                    if let Some(data_records) = data.fix_factor_data.get(group_idx) {
                        if let Some(record) = data_records.get(i) {
                            if let Some(value) = record.values.get(factor) {
                                if data_value_to_string(value) == *level {
                                    factor_matches = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            // Check random factors
            if let Some(random_defs_groups) = &data.random_factor_data_defs {
                for (group_idx, def_group) in random_defs_groups.iter().enumerate() {
                    if def_group.iter().any(|def| &def.name == factor) {
                        if let Some(random_data_groups_vec) = &data.random_factor_data {
                            if let Some(data_records) = random_data_groups_vec.get(group_idx) {
                                if let Some(record) = data_records.get(i) {
                                    if let Some(value) = record.values.get(factor) {
                                        if data_value_to_string(value) == *level {
                                            factor_matches = true;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Check covariate
            if let Some(covar_defs_groups) = &data.covariate_data_defs {
                for (group_idx, def_group) in covar_defs_groups.iter().enumerate() {
                    if def_group.iter().any(|def| &def.name == factor) {
                        if let Some(covar_data_groups_vec) = &data.covariate_data {
                            if let Some(data_records) = covar_data_groups_vec.get(group_idx) {
                                if let Some(record) = data_records.get(i) {
                                    if let Some(value) = record.values.get(factor) {
                                        if data_value_to_string(value) == *level {
                                            factor_matches = true;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if !factor_matches {
                matches = false;
                break;
            }
        }

        if matches {
            row[i] = 1.0;
        }
    }

    row
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
    current_combo: &mut HashMap<String, String>,
    index: usize,
    result: &mut Vec<HashMap<String, String>>
) {
    if index == factor_levels.len() {
        result.push(current_combo.clone());
        return;
    }

    let (factor, levels) = &factor_levels[index];
    for level in levels {
        current_combo.insert(factor.clone(), level.clone());
        generate_level_combinations(factor_levels, current_combo, index + 1, result);
    }
}

/// Generate model terms for non-custom model
pub fn generate_non_cust_terms(config: &UnivariateConfig) -> Result<Vec<String>, String> {
    let mut terms = Vec::new();
    let mut factors_for_interaction = Vec::new();

    // Add Covariates as main effects ONLY (not added to factors_for_interaction)
    if let Some(covariates) = &config.main.covar {
        for covar_name in covariates {
            if !terms.contains(covar_name) {
                terms.push(covar_name.clone());
            }
        }
    }

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

    // Add covariates from cov_model as main effects only
    if let Some(cov_model_str) = &config.model.cov_model {
        for term_name in cov_model_str.split_whitespace() {
            if !terms.contains(&term_name.to_string()) {
                terms.push(term_name.to_string());
            }
        }
    }

    // Add main effects from factors_model. These are candidates for interactions.
    if let Some(factors_model) = &config.model.factors_model {
        for factor_name in factors_model {
            if !terms.contains(factor_name) {
                terms.push(factor_name.clone());
            }
        }
    }
    Ok(terms)
}

/// Generate a design string for reporting purposes
pub fn generate_design_string(design_info: &DesignMatrixInfo) -> String {
    let mut design_string = if design_info.term_names.contains(&"Intercept".to_string()) {
        "Design: Intercept".to_string()
    } else {
        "Design: ".to_string()
    };

    // Add all terms except Intercept
    let terms: Vec<_> = design_info.term_names
        .iter()
        .filter(|&term| term != "Intercept")
        .collect();

    for term in terms {
        design_string.push_str(" + ");
        design_string.push_str(term);
    }

    design_string
}

/// Generate L labels dynamically based on design matrix structure
pub fn generate_l_labels(design_info: &DesignMatrixInfo) -> Vec<String> {
    let mut l_labels = Vec::new();
    let mut l_counter = 1;

    // Generate L labels for each term based on its column indices
    for term_name in &design_info.term_names {
        if let Some((start_idx, end_idx)) = design_info.term_column_indices.get(term_name) {
            let num_cols = end_idx - start_idx + 1;
            for _ in 0..num_cols {
                l_labels.push(format!("L{}", l_counter));
                l_counter += 1;
            }
        }
    }

    l_labels
}

/// Generate all parameter names including reference levels, sorted.
pub fn generate_all_row_parameter_names_sorted(
    design_info: &DesignMatrixInfo,
    data: &AnalysisData
) -> Result<Vec<String>, String> {
    let mut all_params = Vec::new();
    let mut factor_levels_map: HashMap<String, Vec<String>> = HashMap::new();

    // Extract unique factor names from design_info.term_names
    let mut unique_factors = HashSet::new();
    for term in &design_info.term_names {
        if term == "Intercept" {
            continue;
        }
        // Split interaction terms and add individual factors
        for factor in term.split('*') {
            unique_factors.insert(factor.trim().to_string());
        }
    }

    // Get levels for each unique factor
    for factor_name in unique_factors {
        match get_factor_levels(data, &factor_name) {
            Ok(levels) => {
                factor_levels_map.insert(factor_name, levels);
            }
            Err(e) => {
                return Err(format!("Error getting levels for factor '{}': {}", factor_name, e));
            }
        }
    }

    // Process each term in the design matrix
    for term_name in &design_info.term_names {
        if term_name == "Intercept" {
            all_params.push("Intercept".to_string());
            continue;
        }

        if let Some((start_idx, end_idx)) = design_info.term_column_indices.get(term_name) {
            let num_cols = end_idx - start_idx + 1;

            if term_name.contains('*') {
                // Handle interaction terms
                let factors_in_term = parse_interaction_term(term_name);

                // Verify all factors have levels defined
                for factor_name in &factors_in_term {
                    if !factor_levels_map.contains_key(factor_name) {
                        return Err(
                            format!(
                                "Levels not found for factor '{}' in interaction '{}'.",
                                factor_name,
                                term_name
                            )
                        );
                    }
                }

                // Get level sets for each factor
                let mut level_sets: Vec<(&String, &Vec<String>)> = Vec::new();
                for factor_name in &factors_in_term {
                    if let Some(levels) = factor_levels_map.get(factor_name) {
                        if levels.is_empty() {
                            return Err(
                                format!(
                                    "Factor '{}' in interaction '{}' has no defined levels.",
                                    factor_name,
                                    term_name
                                )
                            );
                        }
                        level_sets.push((factor_name, levels));
                    }
                }

                // Generate all possible combinations of levels
                let mut current_combination_indices = vec![0; level_sets.len()];
                let mut generated = 0;

                'combo_loop: loop {
                    if generated >= num_cols {
                        break;
                    }

                    let mut param_parts = Vec::new();
                    for (idx, (factor_name, levels)) in level_sets.iter().enumerate() {
                        let level = &levels[current_combination_indices[idx]];
                        param_parts.push(format!("[{}={}]", factor_name, level));
                    }
                    all_params.push(param_parts.join("*"));
                    generated += 1;

                    // Increment combination indices
                    let mut carry = level_sets.len() - 1;
                    loop {
                        current_combination_indices[carry] += 1;
                        if current_combination_indices[carry] < level_sets[carry].1.len() {
                            break;
                        }
                        current_combination_indices[carry] = 0;
                        if carry == 0 {
                            break 'combo_loop;
                        }
                        carry -= 1;
                    }
                }
            } else {
                // Handle main effects
                if let Some(levels) = factor_levels_map.get(term_name) {
                    for level in levels {
                        all_params.push(format!("[{}={}]", term_name, level));
                    }
                } else {
                    // This is a covariate or other term without levels
                    all_params.push(term_name.clone());
                }
            }
        }
    }

    Ok(all_params)
}
