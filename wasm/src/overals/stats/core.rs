use std::collections::HashMap;
use nalgebra::{ DMatrix, DVector, Dynamic, Matrix, MatrixXx3, OMatrix, SVD, U1, RowDVector };

use crate::overals::models::{
    config::OVERALSAnalysisConfig,
    data::{ AnalysisData, DataRecord, DataValue, VariableDefinition, VariableMeasure },
    result::{
        CaseProcessingSummary,
        CentroidCategory,
        CentroidsResult,
        ComponentLoadings,
        Coordinates,
        Dimensions,
        FitDimensions,
        FitMeasures,
        IterationHistory,
        IterationStep,
        ObjectScores,
        OVERALSAnalysisResult,
        ScalingLevel,
        SummaryAnalysis,
        TransformationPoint,
        TransformationPlots,
        Variable,
        VariableInfo,
        Weights,
    },
};

/// Prepare data for OVERALS analysis by filtering out invalid cases
pub fn prepare_data(
    data: &AnalysisData,
    _config: &OVERALSAnalysisConfig
) -> Result<AnalysisData, String> {
    // Create a copy of the original data
    let mut prepared_data = data.clone();

    // Get the number of cases
    let mut num_cases = 0;
    if let Some(first_set) = data.set_target_data.first() {
        if let Some(first_var) = first_set.first() {
            num_cases = first_var.len();
        }
    }

    if num_cases == 0 {
        return Err("No cases found in data".to_string());
    }

    // Keep track of valid cases for each set
    let mut valid_cases_per_set = Vec::with_capacity(data.set_target_data.len());

    // Process each set
    for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
        let mut valid_cases = vec![true; num_cases];

        // Check each variable in this set
        for (var_idx, var_data) in set_data.iter().enumerate() {
            let var_name = &data.set_target_data_defs[set_idx][var_idx].name;

            // Check each case for this variable
            for (case_idx, record) in var_data.iter().enumerate() {
                if let Some(value) = record.values.get(var_name) {
                    match value {
                        DataValue::Number(num) => {
                            // OVERALS requires positive integers
                            if *num <= 0.0 || (*num - num.floor()).abs() > 1e-10 {
                                valid_cases[case_idx] = false;
                            }
                        }
                        // Non-numeric values are considered invalid
                        _ => {
                            valid_cases[case_idx] = false;
                        }
                    }
                } else {
                    // Variable not found in record
                    valid_cases[case_idx] = false;
                }
            }
        }

        valid_cases_per_set.push(valid_cases);
    }

    // Apply listwise deletion per set
    for (set_idx, set_data) in prepared_data.set_target_data.iter_mut().enumerate() {
        if let Some(valid_cases) = valid_cases_per_set.get(set_idx) {
            for var_data in set_data.iter_mut() {
                // Keep only valid cases
                let filtered_var_data = var_data
                    .iter()
                    .enumerate()
                    .filter_map(|(idx, record)| {
                        if valid_cases[idx] { Some(record.clone()) } else { None }
                    })
                    .collect();

                *var_data = filtered_var_data;
            }
        }
    }

    Ok(prepared_data)
}

/// Calculate the case processing summary for OVERALS analysis
pub fn calculate_case_processing_summary(
    data: &AnalysisData,
    _config: &OVERALSAnalysisConfig
) -> Result<CaseProcessingSummary, String> {
    let mut total_cases = 0;

    // First, determine the total number of cases from the first set and variable
    if let Some(first_set) = data.set_target_data.first() {
        if let Some(first_var_data) = first_set.first() {
            total_cases = first_var_data.len();
        } else {
            return Err("No variable data found in the first set".to_string());
        }
    } else {
        return Err("No set data found".to_string());
    }

    // In OVERALS, a case is excluded if any variable in a set has missing data (listwise deletion per set)
    let mut excluded_cases = Vec::new();

    for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
        let set_defs = &data.set_target_data_defs[set_idx];

        for case_idx in 0..total_cases {
            // Check if this case is already excluded
            if excluded_cases.contains(&case_idx) {
                continue;
            }

            let mut case_has_missing = false;

            // Check each variable in this set for this case
            for (var_idx, var_data) in set_data.iter().enumerate() {
                if let Some(record) = var_data.get(case_idx) {
                    let var_name = &set_defs[var_idx].name;

                    // Check if this variable has a valid value for this case
                    if let Some(value) = record.values.get(var_name) {
                        match value {
                            DataValue::Null => {
                                case_has_missing = true;
                                break;
                            }
                            DataValue::Number(n) => {
                                // Check if the number is valid based on OVERALS requirements
                                // Data must be positive integers. Zeros and negative values are treated as missing
                                if *n <= 0.0 || (*n - n.floor()).abs() > 1e-10 {
                                    case_has_missing = true;
                                    break;
                                }
                            }
                            // For other types, consider them valid for now
                            _ => {}
                        }
                    } else {
                        // Variable not found in record
                        case_has_missing = true;
                        break;
                    }
                } else {
                    // Record not found
                    case_has_missing = true;
                    break;
                }
            }

            if case_has_missing {
                excluded_cases.push(case_idx);
            }
        }
    }

    let cases_used = total_cases - excluded_cases.len();

    Ok(CaseProcessingSummary {
        cases_used_in_analysis: cases_used,
        total_cases,
    })
}

/// Parse the scaling level and range from a variable name pattern
/// Example pattern: "variable_name (ScalingLevel minimum maximum)"
fn parse_variable_scaling_info(
    var_pattern: &str
) -> Result<(String, ScalingLevel, usize, usize), String> {
    // Split the pattern into variable name and scaling info
    let parts: Vec<&str> = var_pattern.split('(').collect();
    if parts.len() != 2 {
        return Err(format!("Invalid variable pattern: {}", var_pattern));
    }

    let var_name = parts[0].trim().to_string();
    let scaling_info = parts[1].trim().trim_end_matches(')');

    // Parse scaling info
    let scaling_parts: Vec<&str> = scaling_info.split_whitespace().collect();
    if scaling_parts.len() != 3 {
        return Err(format!("Invalid scaling info format: {}", scaling_info));
    }

    // Parse scaling level
    let scaling_level = match scaling_parts[0].to_lowercase().as_str() {
        "ordinal" => ScalingLevel::Ordinal,
        "nominal" => ScalingLevel::Nominal,
        "single" => ScalingLevel::Single,
        "multiple" => ScalingLevel::Multiple,
        "numeric" => ScalingLevel::Discrete,
        _ => {
            return Err(format!("Unknown scaling level: {}", scaling_parts[0]));
        }
    };

    // Parse min and max
    let min = scaling_parts[1]
        .parse::<usize>()
        .map_err(|_| format!("Invalid minimum value: {}", scaling_parts[1]))?;
    let max = scaling_parts[2]
        .parse::<usize>()
        .map_err(|_| format!("Invalid maximum value: {}", scaling_parts[2]))?;

    Ok((var_name, scaling_level, min, max))
}

/// Process variables information for OVERALS analysis
pub fn process_variables(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig
) -> Result<Vec<VariableInfo>, String> {
    let mut result = Vec::new();

    // Process each set
    for (set_idx, set_defs) in data.set_target_data_defs.iter().enumerate() {
        let mut var_info = VariableInfo {
            set: format!("Set {}", set_idx + 1),
            variable_name: Vec::new(),
            num_categories: Vec::new(),
            optimal_scaling_level: Vec::new(),
        };

        // Process each variable in the set
        for var_def in set_defs {
            var_info.variable_name.push(var_def.name.clone());

            // Count categories by analyzing data
            let mut categories = HashMap::new();
            if let Some(set_data) = data.set_target_data.get(set_idx) {
                for var_data in set_data {
                    for record in var_data {
                        if let Some(value) = record.values.get(&var_def.name) {
                            match value {
                                DataValue::Number(num) => {
                                    // In OVERALS, data must be positive integers
                                    if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                                        categories.insert(num.to_string(), true);
                                    }
                                }
                                DataValue::Text(text) => {
                                    if let Ok(num) = text.parse::<f64>() {
                                        if num > 0.0 && (num - num.floor()).abs() < 1e-10 {
                                            categories.insert(text.clone(), true);
                                        }
                                    }
                                }
                                _ => {}
                            }
                        }
                    }
                }
            }

            var_info.num_categories.push(categories.len());

            // Determine optimal scaling level
            let scaling_level = determine_scaling_level(var_def, config);
            var_info.optimal_scaling_level.push(scaling_level);
        }

        result.push(var_info);
    }

    Ok(result)
}

/// Determine the scaling level for a variable
fn determine_scaling_level(
    var_def: &VariableDefinition,
    config: &OVERALSAnalysisConfig
) -> ScalingLevel {
    // Look for the variable in the SetTargetVariable configuration
    if let Some(sets) = &config.main.set_target_variable {
        for set in sets {
            for var_pattern in set {
                if
                    let Ok((var_name, scaling_level, _, _)) =
                        parse_variable_scaling_info(var_pattern)
                {
                    if var_name == var_def.name {
                        return scaling_level;
                    }
                }
            }
        }
    }

    // Fallback to measure type if not found in config
    match var_def.measure {
        VariableMeasure::Nominal => ScalingLevel::Nominal,
        VariableMeasure::Ordinal => ScalingLevel::Ordinal,
        VariableMeasure::Scale => ScalingLevel::Discrete,
        _ => ScalingLevel::Nominal, // Default
    }
}

/// Calculate centroids for OVERALS analysis
pub fn calculate_centroids(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig
) -> Result<Vec<CentroidsResult>, String> {
    // Get dimensions from config
    let dimensions = config.main.dimensions.unwrap_or(2) as usize;

    // Run the OVERALS algorithm to get object scores and category quantifications
    let max_iterations = config.options.max_iter.unwrap_or(100) as usize;
    let convergence_criterion = config.options.conv.unwrap_or(0.00001);
    let use_random_init = config.options.use_randconf;

    // Count number of cases and prepare data structures
    let mut num_cases = 0;
    if let Some(first_set) = data.set_target_data.first() {
        if let Some(first_var) = first_set.first() {
            num_cases = first_var.len();
        }
    }

    if num_cases == 0 {
        return Err("No cases found in data".to_string());
    }

    // Initialize object scores X
    let mut object_scores = if use_random_init {
        // Random initialization
        use rand::Rng;
        let mut rng = rand::thread_rng();
        let mut scores = Vec::with_capacity(num_cases);
        for _ in 0..num_cases {
            let mut row = Vec::with_capacity(dimensions);
            for _ in 0..dimensions {
                row.push(rng.gen::<f64>() * 2.0 - 1.0); // Random between -1 and 1
            }
            scores.push(row);
        }
        scores
    } else {
        // Numerical initialization
        let mut scores = Vec::with_capacity(num_cases);
        for i in 0..num_cases {
            let mut row = Vec::with_capacity(dimensions);
            for d in 0..dimensions {
                // Initialize with successive values
                let value = (((i % 10) as f64) / 10.0) * (if d % 2 == 0 { 1.0 } else { -1.0 });
                row.push(value);
            }
            scores.push(row);
        }
        scores
    };

    // Center and normalize object scores
    center_and_normalize_scores(&mut object_scores);

    // Initialize category quantifications and variable weights
    let mut category_quantifications: HashMap<(usize, usize, usize), f64> = HashMap::new();
    let mut variable_weights: HashMap<(usize, usize), Vec<f64>> = HashMap::new();

    // Initialize category counts and category values
    let mut category_values: HashMap<(usize, usize), Vec<usize>> = HashMap::new();

    // Discover categories for each variable
    for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
        for (var_idx, var_data) in set_data.iter().enumerate() {
            let var_name = &data.set_target_data_defs[set_idx][var_idx].name;
            let mut categories = Vec::new();

            for record in var_data {
                if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                    if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                        let cat_val = *num as usize;
                        if !categories.contains(&cat_val) {
                            categories.push(cat_val);
                        }
                    }
                }
            }

            categories.sort();
            category_values.insert((set_idx, var_idx), categories.clone());

            // Initialize variable weights
            let mut weights = Vec::with_capacity(dimensions);
            for _ in 0..dimensions {
                weights.push(1.0 / (dimensions as f64));
            }
            variable_weights.insert((set_idx, var_idx), weights);

            // Initialize category quantifications
            for (i, &cat_val) in categories.iter().enumerate() {
                // Initial quantification: scale from 0 to 1 based on category order
                let init_quant = if categories.len() > 1 {
                    (i as f64) / ((categories.len() - 1) as f64)
                } else {
                    0.5
                };
                category_quantifications.insert((set_idx, var_idx, cat_val), init_quant);
            }
        }
    }

    // Main iteration loop
    let mut current_loss = f64::MAX;

    for _ in 0..max_iterations {
        // Step 2: Loop across sets and variables
        for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
            for (var_idx, var_data) in set_data.iter().enumerate() {
                let var_name = &data.set_target_data_defs[set_idx][var_idx].name;
                let scaling_level = determine_scaling_level(
                    &data.set_target_data_defs[set_idx][var_idx],
                    config
                );

                // Step 3: Eliminate contributions of other variables
                // Calculate V_kj (sum of contributions of other variables in this set)
                let mut v_kj = vec![vec![0.0; dimensions]; num_cases];

                for (other_var_idx, other_var_data) in set_data.iter().enumerate() {
                    if other_var_idx == var_idx {
                        continue;
                    }

                    let other_var_name = &data.set_target_data_defs[set_idx][other_var_idx].name;

                    // Add contribution of other variable
                    for (case_idx, record) in other_var_data.iter().enumerate() {
                        if let Some(DataValue::Number(num)) = record.values.get(other_var_name) {
                            if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                                let cat_val = *num as usize;
                                if
                                    let Some(quant) = category_quantifications.get(
                                        &(set_idx, other_var_idx, cat_val)
                                    )
                                {
                                    if
                                        let Some(weights) = variable_weights.get(
                                            &(set_idx, other_var_idx)
                                        )
                                    {
                                        for dim in 0..dimensions {
                                            v_kj[case_idx][dim] += quant * weights[dim];
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Step 4: Update category quantifications
                match scaling_level {
                    ScalingLevel::Multiple => {
                        // For multiple nominal, calculate unconstrained quantifications
                        let categories = category_values
                            .get(&(set_idx, var_idx))
                            .unwrap_or(&Vec::new())
                            .clone();

                        for &cat_val in &categories {
                            // Count objects with this category
                            let mut cat_objects = Vec::new();

                            for (case_idx, record) in var_data.iter().enumerate() {
                                if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                                    if (*num as usize) == cat_val {
                                        cat_objects.push(case_idx);
                                    }
                                }
                            }

                            if cat_objects.is_empty() {
                                continue;
                            }

                            // Calculate new quantification for each dimension
                            let mut new_quant = 0.0;
                            let n = cat_objects.len() as f64;

                            for &case_idx in &cat_objects {
                                for dim in 0..dimensions {
                                    new_quant += object_scores[case_idx][dim] - v_kj[case_idx][dim];
                                }
                            }

                            new_quant /= n;
                            category_quantifications.insert((set_idx, var_idx, cat_val), new_quant);
                        }
                    }
                    ScalingLevel::Single | ScalingLevel::Nominal => {
                        // For single nominal, calculate rank-one approximation
                        update_single_nominal_quantifications(
                            set_idx,
                            var_idx,
                            var_name,
                            var_data,
                            &object_scores,
                            &v_kj,
                            &mut category_quantifications,
                            &mut variable_weights,
                            &category_values
                        );
                    }
                    ScalingLevel::Ordinal => {
                        // For ordinal, apply monotonic regression
                        update_ordinal_quantifications(
                            set_idx,
                            var_idx,
                            var_name,
                            var_data,
                            &object_scores,
                            &v_kj,
                            &mut category_quantifications,
                            &mut variable_weights,
                            &category_values
                        );
                    }
                    ScalingLevel::Discrete => {
                        // For numeric (discrete), enforce linear relationship
                        update_numeric_quantifications(
                            set_idx,
                            var_idx,
                            &category_values,
                            &mut category_quantifications
                        );
                    }
                }
            }
        }

        // Step 5: Update object scores
        let mut new_object_scores = vec![vec![0.0; dimensions]; num_cases];

        for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
            for (var_idx, var_data) in set_data.iter().enumerate() {
                let var_name = &data.set_target_data_defs[set_idx][var_idx].name;

                for (case_idx, record) in var_data.iter().enumerate() {
                    if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                        if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                            let cat_val = *num as usize;
                            if
                                let Some(quant) = category_quantifications.get(
                                    &(set_idx, var_idx, cat_val)
                                )
                            {
                                if let Some(weights) = variable_weights.get(&(set_idx, var_idx)) {
                                    for dim in 0..dimensions {
                                        new_object_scores[case_idx][dim] += quant * weights[dim];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Step 6: Orthonormalization
        center_and_normalize_scores(&mut new_object_scores);

        // Calculate loss for this iteration
        let new_loss = calculate_loss(
            &object_scores,
            &new_object_scores,
            &category_quantifications,
            &variable_weights,
            data,
            dimensions
        );

        // Step 7: Convergence test
        let diff = if current_loss == f64::MAX { 0.0 } else { current_loss - new_loss };
        if current_loss != f64::MAX && diff < convergence_criterion {
            break;
        }

        // Update for next iteration
        object_scores = new_object_scores;
        current_loss = new_loss;
    }

    // Step 8: Rotation (skipped for simplicity in this implementation)

    // Now we have object_scores, category_quantifications, and variable_weights
    // Let's calculate the centroids
    let mut results = Vec::new();

    // Process each set
    for (set_idx, set_defs) in data.set_target_data_defs.iter().enumerate() {
        // Process each variable in the set
        for (var_idx, var_def) in set_defs.iter().enumerate() {
            let mut centroid_result = CentroidsResult {
                set: format!("Set {}", set_idx + 1),
                variable_name: var_def.name.clone(),
                centroids: HashMap::new(),
            };

            // Get data for this variable
            if let Some(set_data) = data.set_target_data.get(set_idx) {
                if let Some(var_data) = set_data.get(var_idx) {
                    // Count categories and track which objects belong to each category
                    let mut category_objects: HashMap<String, Vec<usize>> = HashMap::new();
                    let mut category_counts: HashMap<String, usize> = HashMap::new();

                    for (obj_idx, record) in var_data.iter().enumerate() {
                        if let Some(value) = record.values.get(&var_def.name) {
                            if let DataValue::Number(num) = value {
                                // OVERALS requires positive integers
                                if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                                    let category = num.to_string();
                                    category_objects
                                        .entry(category.clone())
                                        .or_default()
                                        .push(obj_idx);
                                    *category_counts.entry(category).or_default() += 1;
                                }
                            }
                        }
                    }

                    // Calculate centroids for each category
                    for (category, objects) in &category_objects {
                        // Skip if no objects in this category
                        if objects.is_empty() {
                            continue;
                        }

                        let mut category_centroids = vec![0.0; dimensions];

                        // Average object scores for this category
                        for &obj_idx in objects {
                            for dim in 0..dimensions {
                                category_centroids[dim] += object_scores[obj_idx][dim];
                            }
                        }

                        // Normalize
                        let num_objects = objects.len() as f64;
                        for dim in 0..dimensions {
                            category_centroids[dim] /= num_objects;
                        }

                        // Calculate projected centroids
                        // For single variables, this is a projection on the line defined by the variable weights
                        let scaling_level = determine_scaling_level(var_def, config);
                        let mut projected_centroids = vec![0.0; dimensions];

                        match scaling_level {
                            | ScalingLevel::Single
                            | ScalingLevel::Ordinal
                            | ScalingLevel::Discrete => {
                                // For single variables, projected centroids are calculated using weights
                                if let Some(weights) = variable_weights.get(&(set_idx, var_idx)) {
                                    let cat_val = category.parse::<usize>().unwrap_or(0);

                                    if
                                        let Some(quantification) = category_quantifications.get(
                                            &(set_idx, var_idx, cat_val)
                                        )
                                    {
                                        for dim in 0..dimensions {
                                            projected_centroids[dim] =
                                                quantification * weights[dim];
                                        }
                                    }
                                }
                            }
                            ScalingLevel::Multiple => {
                                // For multiple nominal, projected centroids equal category centroids
                                projected_centroids = category_centroids.clone();
                            }
                            _ => {
                                // Fallback
                                projected_centroids = category_centroids.clone();
                            }
                        }

                        centroid_result.centroids.insert(
                            category.clone(),
                            vec![CentroidCategory {
                                marginal_frequency: *category_counts.get(category).unwrap_or(&0),
                                projected_centroids: Coordinates { dimension: projected_centroids },
                                category_centroids: Coordinates { dimension: category_centroids },
                            }]
                        );
                    }
                }
            }

            results.push(centroid_result);
        }
    }

    Ok(results)
}

/// Update quantifications for single nominal variables
fn update_single_nominal_quantifications(
    set_idx: usize,
    var_idx: usize,
    var_name: &str,
    var_data: &[DataRecord],
    object_scores: &[Vec<f64>],
    v_kj: &[Vec<f64>],
    category_quantifications: &mut HashMap<(usize, usize, usize), f64>,
    variable_weights: &mut HashMap<(usize, usize), Vec<f64>>,
    category_values: &HashMap<(usize, usize), Vec<usize>>
) {
    let dimensions = object_scores[0].len();
    let categories = category_values.get(&(set_idx, var_idx)).unwrap_or(&Vec::new()).clone();

    // Calculate X - V_kj for each case
    let num_cases = object_scores.len();
    let mut x_minus_v = vec![vec![0.0; dimensions]; num_cases];

    for case_idx in 0..num_cases {
        for dim in 0..dimensions {
            x_minus_v[case_idx][dim] = object_scores[case_idx][dim] - v_kj[case_idx][dim];
        }
    }

    // Prepare matrices for ALS iteration
    let mut y_matrix = DMatrix::zeros(categories.len(), 1);
    let mut x_matrix = DMatrix::zeros(num_cases, dimensions);

    // Fill X matrix with (X - V_kj) values
    for case_idx in 0..num_cases {
        for dim in 0..dimensions {
            x_matrix[(case_idx, dim)] = x_minus_v[case_idx][dim];
        }
    }

    // Calculate variable weights (a_j) using ALS approach
    let mut cat_frequencies = vec![0; categories.len()];

    // Count objects per category
    for (case_idx, record) in var_data.iter().enumerate() {
        if let Some(DataValue::Number(num)) = record.values.get(var_name) {
            let cat_val = *num as usize;
            if let Some(cat_index) = categories.iter().position(|&c| c == cat_val) {
                cat_frequencies[cat_index] += 1;
            }
        }
    }

    // Calculate current category quantifications
    for (i, &cat_val) in categories.iter().enumerate() {
        if let Some(quant) = category_quantifications.get(&(set_idx, var_idx, cat_val)) {
            y_matrix[(i, 0)] = *quant;
        }
    }

    // Build G matrix (indicator matrix)
    let mut g_matrix = DMatrix::zeros(num_cases, categories.len());

    for (case_idx, record) in var_data.iter().enumerate() {
        if let Some(DataValue::Number(num)) = record.values.get(var_name) {
            let cat_val = *num as usize;
            if let Some(cat_index) = categories.iter().position(|&c| c == cat_val) {
                g_matrix[(case_idx, cat_index)] = 1.0;
            }
        }
    }

    // Calculate a_j (variable weights)
    let g_transpose = g_matrix.transpose();
    let g_t_g = &g_transpose * &g_matrix;
    let g_t_x = &g_transpose * &x_matrix;

    // y_j = (G'G)^-1 G'x
    let y_new = match g_t_g.try_inverse() {
        Some(inv) => inv * g_t_x,
        None => {
            // Fallback if matrix is singular
            DMatrix::from_fn(categories.len(), dimensions, |i, j| {
                let n = cat_frequencies[i] as f64;
                if n > 0.0 {
                    let mut sum = 0.0;
                    for case_idx in 0..num_cases {
                        if
                            let Some(DataValue::Number(num)) =
                                var_data[case_idx].values.get(var_name)
                        {
                            if (*num as usize) == categories[i] {
                                sum += x_minus_v[case_idx][j];
                            }
                        }
                    }
                    sum / n
                } else {
                    0.0
                }
            })
        }
    };

    // Calculate a_j
    let mut a_j = vec![0.0; dimensions];
    let y_transpose = y_new.transpose();

    for j in 0..dimensions {
        let mut sum = 0.0;
        let mut weight_sum = 0.0;

        for i in 0..categories.len() {
            let freq = cat_frequencies[i] as f64;
            sum += y_new[(i, j)] * y_matrix[(i, 0)] * freq;
            weight_sum += y_matrix[(i, 0)].powi(2) * freq;
        }

        if weight_sum > 0.0 {
            a_j[j] = sum / weight_sum;
        }
    }

    // Update variable weights
    variable_weights.insert((set_idx, var_idx), a_j.clone());

    // Update category quantifications
    for (i, &cat_val) in categories.iter().enumerate() {
        let new_quant = y_new[(i, 0)];
        category_quantifications.insert((set_idx, var_idx, cat_val), new_quant);
    }
}

/// Update quantifications for ordinal variables using monotonic regression
fn update_ordinal_quantifications(
    set_idx: usize,
    var_idx: usize,
    var_name: &str,
    var_data: &[DataRecord],
    object_scores: &[Vec<f64>],
    v_kj: &[Vec<f64>],
    category_quantifications: &mut HashMap<(usize, usize, usize), f64>,
    variable_weights: &mut HashMap<(usize, usize), Vec<f64>>,
    category_values: &HashMap<(usize, usize), Vec<usize>>
) {
    // First, calculate like single nominal
    update_single_nominal_quantifications(
        set_idx,
        var_idx,
        var_name,
        var_data,
        object_scores,
        v_kj,
        category_quantifications,
        variable_weights,
        category_values
    );

    // Then apply monotonic regression to enforce ordinal constraints
    let categories = category_values.get(&(set_idx, var_idx)).unwrap_or(&Vec::new()).clone();
    let mut cat_quants: Vec<(usize, f64)> = Vec::new();

    for &cat_val in &categories {
        if let Some(&quant) = category_quantifications.get(&(set_idx, var_idx, cat_val)) {
            cat_quants.push((cat_val, quant));
        }
    }

    // Sort by category value
    cat_quants.sort_by(|a, b| a.0.cmp(&b.0));

    // Count objects per category for weights
    let mut cat_frequencies = HashMap::new();
    for record in var_data {
        if let Some(DataValue::Number(num)) = record.values.get(var_name) {
            let cat_val = *num as usize;
            *cat_frequencies.entry(cat_val).or_insert(0) += 1;
        }
    }

    // Apply monotonic regression using up-and-down-blocks algorithm
    let mut monotonic_quants = monotonic_regression(
        &cat_quants
            .iter()
            .map(|(_, q)| *q)
            .collect::<Vec<f64>>(),
        &cat_quants
            .iter()
            .map(|(c, _)| *cat_frequencies.get(c).unwrap_or(&0) as f64)
            .collect::<Vec<f64>>()
    );

    // Normalize
    let mut sum_sq = 0.0;
    let mut sum_weight = 0.0;

    for (i, &cat_val) in categories.iter().enumerate() {
        let weight = *cat_frequencies.get(&cat_val).unwrap_or(&0) as f64;
        sum_sq += monotonic_quants[i].powi(2) * weight;
        sum_weight += weight;
    }

    let norm_factor = (sum_weight / sum_sq).sqrt();
    for i in 0..monotonic_quants.len() {
        monotonic_quants[i] *= norm_factor;
    }

    // Update category quantifications
    for (i, &cat_val) in categories.iter().enumerate() {
        category_quantifications.insert((set_idx, var_idx, cat_val), monotonic_quants[i]);
    }
}

/// Monotonic regression implementation (up-and-down-blocks algorithm)
fn monotonic_regression(values: &[f64], weights: &[f64]) -> Vec<f64> {
    if values.is_empty() {
        return Vec::new();
    }

    let n = values.len();
    let mut result = values.to_vec();
    let mut active = true;

    while active {
        active = false;

        // Up pass
        let mut i = 0;
        while i < n - 1 {
            if result[i] > result[i + 1] {
                // Violates monotonicity, create a block
                let mut block_end = i + 1;
                let mut block_sum = weights[i] * result[i] + weights[i + 1] * result[i + 1];
                let mut block_weight = weights[i] + weights[i + 1];

                // Find end of block
                while block_end < n - 1 && result[block_end] > result[block_end + 1] {
                    block_end += 1;
                    block_sum += weights[block_end] * result[block_end];
                    block_weight += weights[block_end];
                }

                // Calculate block average
                let block_avg = block_sum / block_weight;

                // Update block values
                for j in i..=block_end {
                    result[j] = block_avg;
                }

                i = block_end;
                active = true;
            }
            i += 1;
        }

        // Down pass
        let mut i = n - 1;
        while i > 0 {
            if result[i - 1] > result[i] {
                // Violates monotonicity, create a block
                let mut block_start = i - 1;
                let mut block_sum = weights[i] * result[i] + weights[i - 1] * result[i - 1];
                let mut block_weight = weights[i] + weights[i - 1];

                // Find start of block
                while block_start > 0 && result[block_start - 1] > result[block_start] {
                    block_start -= 1;
                    block_sum += weights[block_start] * result[block_start];
                    block_weight += weights[block_start];
                }

                // Calculate block average
                let block_avg = block_sum / block_weight;

                // Update block values
                for j in block_start..=i {
                    result[j] = block_avg;
                }

                i = block_start;
                active = true;
            }
            i -= 1;
        }
    }

    result
}

/// Update quantifications for numeric variables
fn update_numeric_quantifications(
    set_idx: usize,
    var_idx: usize,
    category_values: &HashMap<(usize, usize), Vec<usize>>,
    category_quantifications: &mut HashMap<(usize, usize, usize), f64>
) {
    let categories = category_values.get(&(set_idx, var_idx)).unwrap_or(&Vec::new()).clone();

    if categories.is_empty() {
        return;
    }

    // For numeric variables, enforce linear relationship with category values
    let min_cat = *categories.iter().min().unwrap_or(&1);
    let max_cat = *categories.iter().max().unwrap_or(&1);

    if min_cat == max_cat {
        // Only one category, set to middle value
        for &cat_val in &categories {
            category_quantifications.insert((set_idx, var_idx, cat_val), 0.0);
        }
        return;
    }

    // Linear transformation from min_cat..max_cat to -1..1
    for &cat_val in &categories {
        let normalized =
            (2.0 * ((cat_val as f64) - (min_cat as f64))) / ((max_cat as f64) - (min_cat as f64)) -
            1.0;
        category_quantifications.insert((set_idx, var_idx, cat_val), normalized);
    }
}

/// Calculate loss for current iteration
fn calculate_loss(
    old_scores: &[Vec<f64>],
    new_scores: &[Vec<f64>],
    category_quantifications: &HashMap<(usize, usize, usize), f64>,
    variable_weights: &HashMap<(usize, usize), Vec<f64>>,
    data: &AnalysisData,
    dimensions: usize
) -> f64 {
    let num_cases = old_scores.len();
    let num_sets = data.set_target_data.len();
    let mut total_loss = 0.0;

    // Calculate loss for each set
    for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
        let mut set_loss = 0.0;

        for case_idx in 0..num_cases {
            let mut expected = vec![0.0; dimensions];

            // Calculate expected value based on quantifications and weights
            for (var_idx, var_data) in set_data.iter().enumerate() {
                if let Some(record) = var_data.get(case_idx) {
                    let var_name = &data.set_target_data_defs[set_idx][var_idx].name;

                    if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                        if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                            let cat_val = *num as usize;
                            if
                                let Some(&quant) = category_quantifications.get(
                                    &(set_idx, var_idx, cat_val)
                                )
                            {
                                if let Some(weights) = variable_weights.get(&(set_idx, var_idx)) {
                                    for dim in 0..dimensions {
                                        expected[dim] += quant * weights[dim];
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Calculate squared difference between expected and actual
            for dim in 0..dimensions {
                set_loss += (old_scores[case_idx][dim] - expected[dim]).powi(2);
            }
        }

        total_loss += set_loss;
    }

    // Average loss across sets
    total_loss / (num_sets as f64)
}

/// Center and normalize object scores
fn center_and_normalize_scores(scores: &mut [Vec<f64>]) {
    let dimensions = scores[0].len();
    let num_cases = scores.len();

    // Center (mean = 0)
    for dim in 0..dimensions {
        let mut mean = 0.0;
        for case_idx in 0..num_cases {
            mean += scores[case_idx][dim];
        }
        mean /= num_cases as f64;

        for case_idx in 0..num_cases {
            scores[case_idx][dim] -= mean;
        }
    }

    // Normalize (standard scores)
    for dim in 0..dimensions {
        let mut sum_sq = 0.0;
        for case_idx in 0..num_cases {
            sum_sq += scores[case_idx][dim].powi(2);
        }

        let std_dev = (sum_sq / (num_cases as f64)).sqrt();
        if std_dev > 1e-10 {
            for case_idx in 0..num_cases {
                scores[case_idx][dim] /= std_dev;
            }
        }
    }

    // Orthogonalize dimensions (Gram-Schmidt process)
    for dim1 in 0..dimensions {
        for dim2 in 0..dim1 {
            let mut dot_product = 0.0;
            for case_idx in 0..num_cases {
                dot_product += scores[case_idx][dim1] * scores[case_idx][dim2];
            }

            for case_idx in 0..num_cases {
                scores[case_idx][dim1] -= dot_product * scores[case_idx][dim2];
            }
        }

        // Normalize again after orthogonalization
        let mut sum_sq = 0.0;
        for case_idx in 0..num_cases {
            sum_sq += scores[case_idx][dim1].powi(2);
        }

        let norm = (sum_sq / (num_cases as f64)).sqrt();
        if norm > 1e-10 {
            for case_idx in 0..num_cases {
                scores[case_idx][dim1] /= norm;
            }
        }
    }
}

/// Calculate iteration history for OVERALS analysis
pub fn calculate_iteration_history(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig
) -> Result<IterationHistory, String> {
    // Prepare main parameters
    let dimensions = config.main.dimensions.unwrap_or(2) as usize;
    let max_iter = config.options.max_iter.unwrap_or(100) as usize;
    let convergence = config.options.conv.unwrap_or(0.00001);
    let use_random_init = config.options.use_randconf;

    // Count number of cases and prepare data structures
    let mut num_cases = 0;
    if let Some(first_set) = data.set_target_data.first() {
        if let Some(first_var) = first_set.first() {
            num_cases = first_var.len();
        }
    }

    if num_cases == 0 {
        return Err("No cases found in data".to_string());
    }

    // Initialize object scores
    let mut object_scores = if use_random_init {
        // Random initialization
        use rand::Rng;
        let mut rng = rand::thread_rng();
        let mut scores = Vec::with_capacity(num_cases);
        for _ in 0..num_cases {
            let mut row = Vec::with_capacity(dimensions);
            for _ in 0..dimensions {
                row.push(rng.gen::<f64>() * 2.0 - 1.0); // Random between -1 and 1
            }
            scores.push(row);
        }
        scores
    } else {
        // Numerical initialization
        let mut scores = Vec::with_capacity(num_cases);
        for i in 0..num_cases {
            let mut row = Vec::with_capacity(dimensions);
            for d in 0..dimensions {
                // Initialize with successive values
                let value = (((i % 10) as f64) / 10.0) * (if d % 2 == 0 { 1.0 } else { -1.0 });
                row.push(value);
            }
            scores.push(row);
        }
        scores
    };

    // Center and normalize initial scores
    center_and_normalize_scores(&mut object_scores);

    // Initialize category quantifications and variable weights
    let mut category_quantifications: HashMap<(usize, usize, usize), f64> = HashMap::new();
    let mut variable_weights: HashMap<(usize, usize), Vec<f64>> = HashMap::new();

    // Initialize category counts and category values
    let mut category_values: HashMap<(usize, usize), Vec<usize>> = HashMap::new();

    // Discover categories for each variable
    for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
        for (var_idx, var_data) in set_data.iter().enumerate() {
            let var_name = &data.set_target_data_defs[set_idx][var_idx].name;
            let mut categories = Vec::new();

            for record in var_data {
                if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                    if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                        let cat_val = *num as usize;
                        if !categories.contains(&cat_val) {
                            categories.push(cat_val);
                        }
                    }
                }
            }

            categories.sort();
            category_values.insert((set_idx, var_idx), categories.clone());

            // Initialize variable weights
            let mut weights = Vec::with_capacity(dimensions);
            for _ in 0..dimensions {
                weights.push(1.0 / (dimensions as f64));
            }
            variable_weights.insert((set_idx, var_idx), weights);

            // Initialize category quantifications
            for (i, &cat_val) in categories.iter().enumerate() {
                // Initial quantification: scale from 0 to 1 based on category order
                let init_quant = if categories.len() > 1 {
                    (i as f64) / ((categories.len() - 1) as f64)
                } else {
                    0.5
                };
                category_quantifications.insert((set_idx, var_idx, cat_val), init_quant);
            }
        }
    }

    // Create iteration history
    let mut iterations = Vec::new();
    let mut current_loss = f64::MAX;

    // Initial iteration (0)
    // Calculate initial loss
    let initial_loss = calculate_loss(
        &object_scores,
        &object_scores,
        &category_quantifications,
        &variable_weights,
        data,
        dimensions
    );

    iterations.push(IterationStep {
        loss: initial_loss,
        fit: (dimensions as f64) - initial_loss,
        difference_from_previous: 0.0,
    });

    current_loss = initial_loss;

    // Main iteration loop
    for _ in 1..=max_iter {
        // Create a copy of object scores for the current iteration
        let current_object_scores = object_scores.clone();

        // Perform one iteration of the OVERALS algorithm

        // Step 2: Loop across sets and variables
        for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
            for (var_idx, var_data) in set_data.iter().enumerate() {
                let var_name = &data.set_target_data_defs[set_idx][var_idx].name;
                let scaling_level = determine_scaling_level(
                    &data.set_target_data_defs[set_idx][var_idx],
                    config
                );

                // Step 3: Eliminate contributions of other variables
                // Calculate V_kj (sum of contributions of other variables in this set)
                let mut v_kj = vec![vec![0.0; dimensions]; num_cases];

                for (other_var_idx, other_var_data) in set_data.iter().enumerate() {
                    if other_var_idx == var_idx {
                        continue;
                    }

                    let other_var_name = &data.set_target_data_defs[set_idx][other_var_idx].name;

                    // Add contribution of other variable
                    for (case_idx, record) in other_var_data.iter().enumerate() {
                        if let Some(DataValue::Number(num)) = record.values.get(other_var_name) {
                            if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                                let cat_val = *num as usize;
                                if
                                    let Some(quant) = category_quantifications.get(
                                        &(set_idx, other_var_idx, cat_val)
                                    )
                                {
                                    if
                                        let Some(weights) = variable_weights.get(
                                            &(set_idx, other_var_idx)
                                        )
                                    {
                                        for dim in 0..dimensions {
                                            v_kj[case_idx][dim] += quant * weights[dim];
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Step 4: Update category quantifications
                match scaling_level {
                    ScalingLevel::Multiple => {
                        // For multiple nominal, calculate unconstrained quantifications
                        let categories = category_values
                            .get(&(set_idx, var_idx))
                            .unwrap_or(&Vec::new())
                            .clone();

                        for &cat_val in &categories {
                            // Count objects with this category
                            let mut cat_objects = Vec::new();

                            for (case_idx, record) in var_data.iter().enumerate() {
                                if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                                    if (*num as usize) == cat_val {
                                        cat_objects.push(case_idx);
                                    }
                                }
                            }

                            if cat_objects.is_empty() {
                                continue;
                            }

                            // Calculate new quantification for each dimension
                            let mut new_quant = 0.0;
                            let n = cat_objects.len() as f64;

                            for &case_idx in &cat_objects {
                                for dim in 0..dimensions {
                                    new_quant += object_scores[case_idx][dim] - v_kj[case_idx][dim];
                                }
                            }

                            new_quant /= n;
                            category_quantifications.insert((set_idx, var_idx, cat_val), new_quant);
                        }
                    }
                    ScalingLevel::Single | ScalingLevel::Nominal => {
                        // For single nominal, calculate rank-one approximation
                        update_single_nominal_quantifications(
                            set_idx,
                            var_idx,
                            var_name,
                            var_data,
                            &object_scores,
                            &v_kj,
                            &mut category_quantifications,
                            &mut variable_weights,
                            &category_values
                        );
                    }
                    ScalingLevel::Ordinal => {
                        // For ordinal, apply monotonic regression
                        update_ordinal_quantifications(
                            set_idx,
                            var_idx,
                            var_name,
                            var_data,
                            &object_scores,
                            &v_kj,
                            &mut category_quantifications,
                            &mut variable_weights,
                            &category_values
                        );
                    }
                    ScalingLevel::Discrete => {
                        // For numeric (discrete), enforce linear relationship
                        update_numeric_quantifications(
                            set_idx,
                            var_idx,
                            &category_values,
                            &mut category_quantifications
                        );
                    }
                }
            }
        }

        // Step 5: Update object scores
        let mut new_object_scores = vec![vec![0.0; dimensions]; num_cases];

        for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
            for (var_idx, var_data) in set_data.iter().enumerate() {
                let var_name = &data.set_target_data_defs[set_idx][var_idx].name;

                for (case_idx, record) in var_data.iter().enumerate() {
                    if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                        if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                            let cat_val = *num as usize;
                            if
                                let Some(quant) = category_quantifications.get(
                                    &(set_idx, var_idx, cat_val)
                                )
                            {
                                if let Some(weights) = variable_weights.get(&(set_idx, var_idx)) {
                                    for dim in 0..dimensions {
                                        new_object_scores[case_idx][dim] += quant * weights[dim];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Step 6: Orthonormalization
        center_and_normalize_scores(&mut new_object_scores);

        // Calculate loss for this iteration
        let new_loss = calculate_loss(
            &current_object_scores,
            &new_object_scores,
            &category_quantifications,
            &variable_weights,
            data,
            dimensions
        );

        let fit = (dimensions as f64) - new_loss;
        let diff = current_loss - new_loss;

        iterations.push(IterationStep {
            loss: new_loss,
            fit,
            difference_from_previous: diff,
        });

        // Update for next iteration
        object_scores = new_object_scores;
        current_loss = new_loss;

        // Check convergence
        if diff < convergence {
            break;
        }
    }

    Ok(IterationHistory { iterations })
}

/// Calculate summary analysis for OVERALS analysis
pub fn calculate_summary_analysis(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig
) -> Result<SummaryAnalysis, String> {
    // Prepare main parameters
    let dimensions = config.main.dimensions.unwrap_or(2) as usize;
    let max_iterations = config.options.max_iter.unwrap_or(100) as usize;
    let convergence_criterion = config.options.conv.unwrap_or(0.00001);
    let use_random_init = config.options.use_randconf;

    // Count number of cases and prepare data structures
    let mut num_cases = 0;
    if let Some(first_set) = data.set_target_data.first() {
        if let Some(first_var) = first_set.first() {
            num_cases = first_var.len();
        }
    }

    if num_cases == 0 {
        return Err("No cases found in data".to_string());
    }

    // Initialize object scores
    let mut object_scores = if use_random_init {
        // Random initialization
        use rand::Rng;
        let mut rng = rand::thread_rng();
        let mut scores = Vec::with_capacity(num_cases);
        for _ in 0..num_cases {
            let mut row = Vec::with_capacity(dimensions);
            for _ in 0..dimensions {
                row.push(rng.gen::<f64>() * 2.0 - 1.0); // Random between -1 and 1
            }
            scores.push(row);
        }
        scores
    } else {
        // Numerical initialization
        let mut scores = Vec::with_capacity(num_cases);
        for i in 0..num_cases {
            let mut row = Vec::with_capacity(dimensions);
            for d in 0..dimensions {
                // Initialize with successive values
                let value = (((i % 10) as f64) / 10.0) * (if d % 2 == 0 { 1.0 } else { -1.0 });
                row.push(value);
            }
            scores.push(row);
        }
        scores
    };

    // Center and normalize object scores
    center_and_normalize_scores(&mut object_scores);

    // Initialize category quantifications and variable weights
    let mut category_quantifications: HashMap<(usize, usize, usize), f64> = HashMap::new();
    let mut variable_weights: HashMap<(usize, usize), Vec<f64>> = HashMap::new();

    // Initialize category counts and category values
    let mut category_values: HashMap<(usize, usize), Vec<usize>> = HashMap::new();

    // Discover categories for each variable
    for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
        for (var_idx, var_data) in set_data.iter().enumerate() {
            let var_name = &data.set_target_data_defs[set_idx][var_idx].name;
            let mut categories = Vec::new();

            for record in var_data {
                if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                    if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                        let cat_val = *num as usize;
                        if !categories.contains(&cat_val) {
                            categories.push(cat_val);
                        }
                    }
                }
            }

            categories.sort();
            category_values.insert((set_idx, var_idx), categories.clone());

            // Initialize variable weights
            let mut weights = Vec::with_capacity(dimensions);
            for _ in 0..dimensions {
                weights.push(1.0 / (dimensions as f64));
            }
            variable_weights.insert((set_idx, var_idx), weights);

            // Initialize category quantifications
            for (i, &cat_val) in categories.iter().enumerate() {
                // Initial quantification: scale from 0 to 1 based on category order
                let init_quant = if categories.len() > 1 {
                    (i as f64) / ((categories.len() - 1) as f64)
                } else {
                    0.5
                };
                category_quantifications.insert((set_idx, var_idx, cat_val), init_quant);
            }
        }
    }

    // Main iteration loop
    let mut current_loss = f64::MAX;

    for _ in 0..max_iterations {
        // Step 2: Loop across sets and variables
        for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
            for (var_idx, var_data) in set_data.iter().enumerate() {
                let var_name = &data.set_target_data_defs[set_idx][var_idx].name;
                let scaling_level = determine_scaling_level(
                    &data.set_target_data_defs[set_idx][var_idx],
                    config
                );

                // Step 3: Eliminate contributions of other variables
                // Calculate V_kj (sum of contributions of other variables in this set)
                let mut v_kj = vec![vec![0.0; dimensions]; num_cases];

                for (other_var_idx, other_var_data) in set_data.iter().enumerate() {
                    if other_var_idx == var_idx {
                        continue;
                    }

                    let other_var_name = &data.set_target_data_defs[set_idx][other_var_idx].name;

                    // Add contribution of other variable
                    for (case_idx, record) in other_var_data.iter().enumerate() {
                        if let Some(DataValue::Number(num)) = record.values.get(other_var_name) {
                            if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                                let cat_val = *num as usize;
                                if
                                    let Some(quant) = category_quantifications.get(
                                        &(set_idx, other_var_idx, cat_val)
                                    )
                                {
                                    if
                                        let Some(weights) = variable_weights.get(
                                            &(set_idx, other_var_idx)
                                        )
                                    {
                                        for dim in 0..dimensions {
                                            v_kj[case_idx][dim] += quant * weights[dim];
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Step 4: Update category quantifications
                match scaling_level {
                    ScalingLevel::Multiple => {
                        // For multiple nominal, calculate unconstrained quantifications
                        let categories = category_values
                            .get(&(set_idx, var_idx))
                            .unwrap_or(&Vec::new())
                            .clone();

                        for &cat_val in &categories {
                            // Count objects with this category
                            let mut cat_objects = Vec::new();

                            for (case_idx, record) in var_data.iter().enumerate() {
                                if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                                    if (*num as usize) == cat_val {
                                        cat_objects.push(case_idx);
                                    }
                                }
                            }

                            if cat_objects.is_empty() {
                                continue;
                            }

                            // Calculate new quantification for each dimension
                            let mut new_quant = 0.0;
                            let n = cat_objects.len() as f64;

                            for &case_idx in &cat_objects {
                                for dim in 0..dimensions {
                                    new_quant += object_scores[case_idx][dim] - v_kj[case_idx][dim];
                                }
                            }

                            new_quant /= n;
                            category_quantifications.insert((set_idx, var_idx, cat_val), new_quant);
                        }
                    }
                    ScalingLevel::Single | ScalingLevel::Nominal => {
                        // For single nominal, calculate rank-one approximation
                        update_single_nominal_quantifications(
                            set_idx,
                            var_idx,
                            var_name,
                            var_data,
                            &object_scores,
                            &v_kj,
                            &mut category_quantifications,
                            &mut variable_weights,
                            &category_values
                        );
                    }
                    ScalingLevel::Ordinal => {
                        // For ordinal, apply monotonic regression
                        update_ordinal_quantifications(
                            set_idx,
                            var_idx,
                            var_name,
                            var_data,
                            &object_scores,
                            &v_kj,
                            &mut category_quantifications,
                            &mut variable_weights,
                            &category_values
                        );
                    }
                    ScalingLevel::Discrete => {
                        // For numeric (discrete), enforce linear relationship
                        update_numeric_quantifications(
                            set_idx,
                            var_idx,
                            &category_values,
                            &mut category_quantifications
                        );
                    }
                }
            }
        }

        // Step 5: Update object scores
        let mut new_object_scores = vec![vec![0.0; dimensions]; num_cases];

        for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
            for (var_idx, var_data) in set_data.iter().enumerate() {
                let var_name = &data.set_target_data_defs[set_idx][var_idx].name;

                for (case_idx, record) in var_data.iter().enumerate() {
                    if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                        if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                            let cat_val = *num as usize;
                            if
                                let Some(quant) = category_quantifications.get(
                                    &(set_idx, var_idx, cat_val)
                                )
                            {
                                if let Some(weights) = variable_weights.get(&(set_idx, var_idx)) {
                                    for dim in 0..dimensions {
                                        new_object_scores[case_idx][dim] += quant * weights[dim];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Step 6: Orthonormalization
        center_and_normalize_scores(&mut new_object_scores);

        // Calculate loss for this iteration
        let new_loss = calculate_loss(
            &object_scores,
            &new_object_scores,
            &category_quantifications,
            &variable_weights,
            data,
            dimensions
        );

        // Step 7: Convergence test
        let diff = if current_loss == f64::MAX { 0.0 } else { current_loss - new_loss };
        if current_loss != f64::MAX && diff < convergence_criterion {
            break;
        }

        // Update for next iteration
        object_scores = new_object_scores;
        current_loss = new_loss;
    }

    // Step 8: Rotation (skipped for simplicity in this implementation)

    // Number of sets
    let num_sets = data.set_target_data.len();

    // Create result structure
    let mut loss = HashMap::new();
    let mut eigenvalue = HashMap::new();
    let mut fit = HashMap::new();

    // Calculate loss per set and dimension
    for set_idx in 0..num_sets {
        let mut set_loss_by_dim = vec![0.0; dimensions];
        let mut total_set_cases = 0;

        if let Some(set_data) = data.set_target_data.get(set_idx) {
            // Calculate loss for each case in this set
            for case_idx in 0..object_scores.len() {
                let mut case_has_data = false;
                let mut case_loss_by_dim = vec![0.0; dimensions];

                // Calculate expected scores based on quantifications for this set
                let mut expected_scores = vec![vec![0.0; dimensions]; object_scores.len()];

                for (var_idx, var_data) in set_data.iter().enumerate() {
                    if let Some(record) = var_data.get(case_idx) {
                        let var_name = &data.set_target_data_defs[set_idx][var_idx].name;

                        if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                            if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                                let cat_val = *num as usize;
                                case_has_data = true;

                                if
                                    let Some(&quant) = category_quantifications.get(
                                        &(set_idx, var_idx, cat_val)
                                    )
                                {
                                    if
                                        let Some(weights) = variable_weights.get(
                                            &(set_idx, var_idx)
                                        )
                                    {
                                        for dim in 0..dimensions {
                                            expected_scores[case_idx][dim] += quant * weights[dim];
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // If case has data, calculate loss
                if case_has_data {
                    for dim in 0..dimensions {
                        case_loss_by_dim[dim] = (
                            object_scores[case_idx][dim] - expected_scores[case_idx][dim]
                        ).powi(2);
                        set_loss_by_dim[dim] += case_loss_by_dim[dim];
                    }
                    total_set_cases += 1;
                }
            }

            // Normalize by number of cases
            if total_set_cases > 0 {
                for dim in 0..dimensions {
                    set_loss_by_dim[dim] /= total_set_cases as f64;
                }
            }

            // Store loss per dimension for this set
            let mut set_loss = 0.0;
            for dim in 0..dimensions {
                loss.insert(
                    format!("Set {} Dimension {}", set_idx + 1, dim + 1),
                    set_loss_by_dim[dim]
                );
                set_loss += set_loss_by_dim[dim];
            }

            // Store total set loss
            loss.insert(format!("Set {}", set_idx + 1), set_loss);
        }
    }

    // Calculate mean loss per dimension
    for dim in 0..dimensions {
        let mut dim_loss = 0.0;
        for set_idx in 0..num_sets {
            if
                let Some(&set_dim_loss) = loss.get(
                    &format!("Set {} Dimension {}", set_idx + 1, dim + 1)
                )
            {
                dim_loss += set_dim_loss;
            }
        }
        let mean_dim_loss = dim_loss / (num_sets as f64);
        loss.insert(format!("Dimension {}", dim + 1), mean_dim_loss);

        // Calculate eigenvalues (1 - mean loss per dimension)
        eigenvalue.insert(format!("Dimension {}", dim + 1), 1.0 - mean_dim_loss);
    }

    // Calculate total mean loss
    let mut total_loss = 0.0;
    for set_idx in 0..num_sets {
        if let Some(&set_loss) = loss.get(&format!("Set {}", set_idx + 1)) {
            total_loss += set_loss;
        }
    }
    let mean_loss = total_loss / (num_sets as f64);
    loss.insert("Mean".to_string(), mean_loss);

    // Calculate total fit (sum of eigenvalues)
    let mut total_fit = 0.0;
    for dim in 0..dimensions {
        if let Some(&eigen) = eigenvalue.get(&format!("Dimension {}", dim + 1)) {
            total_fit += eigen;
        }
    }
    fit.insert("Total".to_string(), total_fit);

    Ok(SummaryAnalysis {
        loss,
        eigenvalue,
        fit,
    })
}

/// Calculate weights for OVERALS analysis
pub fn calculate_weights(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig
) -> Result<Weights, String> {
    // Prepare main parameters
    let dimensions = config.main.dimensions.unwrap_or(2) as usize;
    let max_iterations = config.options.max_iter.unwrap_or(100) as usize;
    let convergence_criterion = config.options.conv.unwrap_or(0.00001);
    let use_random_init = config.options.use_randconf;

    // Count number of cases and prepare data structures
    let mut num_cases = 0;
    if let Some(first_set) = data.set_target_data.first() {
        if let Some(first_var) = first_set.first() {
            num_cases = first_var.len();
        }
    }

    if num_cases == 0 {
        return Err("No cases found in data".to_string());
    }

    // Initialize object scores
    let mut object_scores = if use_random_init {
        // Random initialization
        use rand::Rng;
        let mut rng = rand::thread_rng();
        let mut scores = Vec::with_capacity(num_cases);
        for _ in 0..num_cases {
            let mut row = Vec::with_capacity(dimensions);
            for _ in 0..dimensions {
                row.push(rng.gen::<f64>() * 2.0 - 1.0); // Random between -1 and 1
            }
            scores.push(row);
        }
        scores
    } else {
        // Numerical initialization
        let mut scores = Vec::with_capacity(num_cases);
        for i in 0..num_cases {
            let mut row = Vec::with_capacity(dimensions);
            for d in 0..dimensions {
                // Initialize with successive values
                let value = (((i % 10) as f64) / 10.0) * (if d % 2 == 0 { 1.0 } else { -1.0 });
                row.push(value);
            }
            scores.push(row);
        }
        scores
    };

    // Center and normalize object scores
    center_and_normalize_scores(&mut object_scores);

    // Initialize category quantifications and variable weights
    let mut category_quantifications: HashMap<(usize, usize, usize), f64> = HashMap::new();
    let mut variable_weights: HashMap<(usize, usize), Vec<f64>> = HashMap::new();

    // Initialize category counts and category values
    let mut category_values: HashMap<(usize, usize), Vec<usize>> = HashMap::new();

    // Discover categories for each variable
    for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
        for (var_idx, var_data) in set_data.iter().enumerate() {
            let var_name = &data.set_target_data_defs[set_idx][var_idx].name;
            let mut categories = Vec::new();

            for record in var_data {
                if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                    if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                        let cat_val = *num as usize;
                        if !categories.contains(&cat_val) {
                            categories.push(cat_val);
                        }
                    }
                }
            }

            categories.sort();
            category_values.insert((set_idx, var_idx), categories.clone());

            // Initialize variable weights
            let mut weights = Vec::with_capacity(dimensions);
            for _ in 0..dimensions {
                weights.push(1.0 / (dimensions as f64));
            }
            variable_weights.insert((set_idx, var_idx), weights);

            // Initialize category quantifications
            for (i, &cat_val) in categories.iter().enumerate() {
                // Initial quantification: scale from 0 to 1 based on category order
                let init_quant = if categories.len() > 1 {
                    (i as f64) / ((categories.len() - 1) as f64)
                } else {
                    0.5
                };
                category_quantifications.insert((set_idx, var_idx, cat_val), init_quant);
            }
        }
    }

    // Main iteration loop
    let mut current_loss = f64::MAX;

    for _ in 0..max_iterations {
        // Step 2: Loop across sets and variables
        for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
            for (var_idx, var_data) in set_data.iter().enumerate() {
                let var_name = &data.set_target_data_defs[set_idx][var_idx].name;
                let scaling_level = determine_scaling_level(
                    &data.set_target_data_defs[set_idx][var_idx],
                    config
                );

                // Step 3: Eliminate contributions of other variables
                // Calculate V_kj (sum of contributions of other variables in this set)
                let mut v_kj = vec![vec![0.0; dimensions]; num_cases];

                for (other_var_idx, other_var_data) in set_data.iter().enumerate() {
                    if other_var_idx == var_idx {
                        continue;
                    }

                    let other_var_name = &data.set_target_data_defs[set_idx][other_var_idx].name;

                    // Add contribution of other variable
                    for (case_idx, record) in other_var_data.iter().enumerate() {
                        if let Some(DataValue::Number(num)) = record.values.get(other_var_name) {
                            if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                                let cat_val = *num as usize;
                                if
                                    let Some(quant) = category_quantifications.get(
                                        &(set_idx, other_var_idx, cat_val)
                                    )
                                {
                                    if
                                        let Some(weights) = variable_weights.get(
                                            &(set_idx, other_var_idx)
                                        )
                                    {
                                        for dim in 0..dimensions {
                                            v_kj[case_idx][dim] += quant * weights[dim];
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Step 4: Update category quantifications
                match scaling_level {
                    ScalingLevel::Multiple => {
                        // For multiple nominal, calculate unconstrained quantifications
                        let categories = category_values
                            .get(&(set_idx, var_idx))
                            .unwrap_or(&Vec::new())
                            .clone();

                        for &cat_val in &categories {
                            // Count objects with this category
                            let mut cat_objects = Vec::new();

                            for (case_idx, record) in var_data.iter().enumerate() {
                                if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                                    if (*num as usize) == cat_val {
                                        cat_objects.push(case_idx);
                                    }
                                }
                            }

                            if cat_objects.is_empty() {
                                continue;
                            }

                            // Calculate new quantification for each dimension
                            let mut new_quant = 0.0;
                            let n = cat_objects.len() as f64;

                            for &case_idx in &cat_objects {
                                for dim in 0..dimensions {
                                    new_quant += object_scores[case_idx][dim] - v_kj[case_idx][dim];
                                }
                            }

                            new_quant /= n;
                            category_quantifications.insert((set_idx, var_idx, cat_val), new_quant);
                        }
                    }
                    ScalingLevel::Single | ScalingLevel::Nominal => {
                        // For single nominal, calculate rank-one approximation
                        update_single_nominal_quantifications(
                            set_idx,
                            var_idx,
                            var_name,
                            var_data,
                            &object_scores,
                            &v_kj,
                            &mut category_quantifications,
                            &mut variable_weights,
                            &category_values
                        );
                    }
                    ScalingLevel::Ordinal => {
                        // For ordinal, apply monotonic regression
                        update_ordinal_quantifications(
                            set_idx,
                            var_idx,
                            var_name,
                            var_data,
                            &object_scores,
                            &v_kj,
                            &mut category_quantifications,
                            &mut variable_weights,
                            &category_values
                        );
                    }
                    ScalingLevel::Discrete => {
                        // For numeric (discrete), enforce linear relationship
                        update_numeric_quantifications(
                            set_idx,
                            var_idx,
                            &category_values,
                            &mut category_quantifications
                        );
                    }
                }
            }
        }

        // Step 5: Update object scores
        let mut new_object_scores = vec![vec![0.0; dimensions]; num_cases];

        for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
            for (var_idx, var_data) in set_data.iter().enumerate() {
                let var_name = &data.set_target_data_defs[set_idx][var_idx].name;

                for (case_idx, record) in var_data.iter().enumerate() {
                    if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                        if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                            let cat_val = *num as usize;
                            if
                                let Some(quant) = category_quantifications.get(
                                    &(set_idx, var_idx, cat_val)
                                )
                            {
                                if let Some(weights) = variable_weights.get(&(set_idx, var_idx)) {
                                    for dim in 0..dimensions {
                                        new_object_scores[case_idx][dim] += quant * weights[dim];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Step 6: Orthonormalization
        center_and_normalize_scores(&mut new_object_scores);

        // Calculate loss for this iteration
        let new_loss = calculate_loss(
            &object_scores,
            &new_object_scores,
            &category_quantifications,
            &variable_weights,
            data,
            dimensions
        );

        // Step 7: Convergence test
        let diff = if current_loss == f64::MAX { 0.0 } else { current_loss - new_loss };
        if current_loss != f64::MAX && diff < convergence_criterion {
            break;
        }

        // Update for next iteration
        object_scores = new_object_scores;
        current_loss = new_loss;
    }

    // Step 8: Rotation (skipped for simplicity in this implementation)

    // Prepare result structure
    let mut set = HashMap::new();
    let mut weights_result = HashMap::new();

    // Process each set
    for (set_idx, set_defs) in data.set_target_data_defs.iter().enumerate() {
        // Process each variable in the set
        for (var_idx, var_def) in set_defs.iter().enumerate() {
            // Skip multiple nominal variables as per the documentation
            let scaling_level = determine_scaling_level(var_def, config);
            if matches!(scaling_level, ScalingLevel::Multiple) {
                continue;
            }

            // Create entry in results
            let var_key = format!("Set{}_Var{}", set_idx + 1, var_idx + 1);
            set.insert(var_key.clone(), Variable {
                variable_name: var_def.name.clone(),
            });

            // Get weights from algorithm results
            if let Some(weights) = variable_weights.get(&(set_idx, var_idx)) {
                weights_result.insert(var_key, Dimensions {
                    dimensions: weights.clone(),
                });
            }
        }
    }

    Ok(Weights {
        set,
        weights: weights_result,
    })
}

/// Calculate component loadings for OVERALS analysis
pub fn calculate_component_loadings(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig
) -> Result<ComponentLoadings, String> {
    // Prepare main parameters
    let dimensions = config.main.dimensions.unwrap_or(2) as usize;
    let max_iterations = config.options.max_iter.unwrap_or(100) as usize;
    let convergence_criterion = config.options.conv.unwrap_or(0.00001);
    let use_random_init = config.options.use_randconf;

    // Count number of cases and prepare data structures
    let mut num_cases = 0;
    if let Some(first_set) = data.set_target_data.first() {
        if let Some(first_var) = first_set.first() {
            num_cases = first_var.len();
        }
    }

    if num_cases == 0 {
        return Err("No cases found in data".to_string());
    }

    // Initialize object scores
    let mut object_scores = if use_random_init {
        // Random initialization
        use rand::Rng;
        let mut rng = rand::thread_rng();
        let mut scores = Vec::with_capacity(num_cases);
        for _ in 0..num_cases {
            let mut row = Vec::with_capacity(dimensions);
            for _ in 0..dimensions {
                row.push(rng.gen::<f64>() * 2.0 - 1.0); // Random between -1 and 1
            }
            scores.push(row);
        }
        scores
    } else {
        // Numerical initialization
        let mut scores = Vec::with_capacity(num_cases);
        for i in 0..num_cases {
            let mut row = Vec::with_capacity(dimensions);
            for d in 0..dimensions {
                // Initialize with successive values
                let value = (((i % 10) as f64) / 10.0) * (if d % 2 == 0 { 1.0 } else { -1.0 });
                row.push(value);
            }
            scores.push(row);
        }
        scores
    };

    // Center and normalize object scores
    center_and_normalize_scores(&mut object_scores);

    // Initialize category quantifications and variable weights
    let mut category_quantifications: HashMap<(usize, usize, usize), f64> = HashMap::new();
    let mut variable_weights: HashMap<(usize, usize), Vec<f64>> = HashMap::new();

    // Initialize category counts and category values
    let mut category_values: HashMap<(usize, usize), Vec<usize>> = HashMap::new();

    // Discover categories for each variable
    for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
        for (var_idx, var_data) in set_data.iter().enumerate() {
            let var_name = &data.set_target_data_defs[set_idx][var_idx].name;
            let mut categories = Vec::new();

            for record in var_data {
                if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                    if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                        let cat_val = *num as usize;
                        if !categories.contains(&cat_val) {
                            categories.push(cat_val);
                        }
                    }
                }
            }

            categories.sort();
            category_values.insert((set_idx, var_idx), categories.clone());

            // Initialize variable weights
            let mut weights = Vec::with_capacity(dimensions);
            for _ in 0..dimensions {
                weights.push(1.0 / (dimensions as f64));
            }
            variable_weights.insert((set_idx, var_idx), weights);

            // Initialize category quantifications
            for (i, &cat_val) in categories.iter().enumerate() {
                // Initial quantification: scale from 0 to 1 based on category order
                let init_quant = if categories.len() > 1 {
                    (i as f64) / ((categories.len() - 1) as f64)
                } else {
                    0.5
                };
                category_quantifications.insert((set_idx, var_idx, cat_val), init_quant);
            }
        }
    }

    // Main iteration loop
    let mut current_loss = f64::MAX;

    for _ in 0..max_iterations {
        // Step 2: Loop across sets and variables
        for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
            for (var_idx, var_data) in set_data.iter().enumerate() {
                let var_name = &data.set_target_data_defs[set_idx][var_idx].name;
                let scaling_level = determine_scaling_level(
                    &data.set_target_data_defs[set_idx][var_idx],
                    config
                );

                // Step 3: Eliminate contributions of other variables
                // Calculate V_kj (sum of contributions of other variables in this set)
                let mut v_kj = vec![vec![0.0; dimensions]; num_cases];

                for (other_var_idx, other_var_data) in set_data.iter().enumerate() {
                    if other_var_idx == var_idx {
                        continue;
                    }

                    let other_var_name = &data.set_target_data_defs[set_idx][other_var_idx].name;

                    // Add contribution of other variable
                    for (case_idx, record) in other_var_data.iter().enumerate() {
                        if let Some(DataValue::Number(num)) = record.values.get(other_var_name) {
                            if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                                let cat_val = *num as usize;
                                if
                                    let Some(quant) = category_quantifications.get(
                                        &(set_idx, other_var_idx, cat_val)
                                    )
                                {
                                    if
                                        let Some(weights) = variable_weights.get(
                                            &(set_idx, other_var_idx)
                                        )
                                    {
                                        for dim in 0..dimensions {
                                            v_kj[case_idx][dim] += quant * weights[dim];
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Step 4: Update category quantifications
                match scaling_level {
                    ScalingLevel::Multiple => {
                        // For multiple nominal, calculate unconstrained quantifications
                        let categories = category_values
                            .get(&(set_idx, var_idx))
                            .unwrap_or(&Vec::new())
                            .clone();

                        for &cat_val in &categories {
                            // Count objects with this category
                            let mut cat_objects = Vec::new();

                            for (case_idx, record) in var_data.iter().enumerate() {
                                if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                                    if (*num as usize) == cat_val {
                                        cat_objects.push(case_idx);
                                    }
                                }
                            }

                            if cat_objects.is_empty() {
                                continue;
                            }

                            // Calculate new quantification for each dimension
                            let mut new_quant = 0.0;
                            let n = cat_objects.len() as f64;

                            for &case_idx in &cat_objects {
                                for dim in 0..dimensions {
                                    new_quant += object_scores[case_idx][dim] - v_kj[case_idx][dim];
                                }
                            }

                            new_quant /= n;
                            category_quantifications.insert((set_idx, var_idx, cat_val), new_quant);
                        }
                    }
                    ScalingLevel::Single | ScalingLevel::Nominal => {
                        // For single nominal, calculate rank-one approximation
                        update_single_nominal_quantifications(
                            set_idx,
                            var_idx,
                            var_name,
                            var_data,
                            &object_scores,
                            &v_kj,
                            &mut category_quantifications,
                            &mut variable_weights,
                            &category_values
                        );
                    }
                    ScalingLevel::Ordinal => {
                        // For ordinal, apply monotonic regression
                        update_ordinal_quantifications(
                            set_idx,
                            var_idx,
                            var_name,
                            var_data,
                            &object_scores,
                            &v_kj,
                            &mut category_quantifications,
                            &mut variable_weights,
                            &category_values
                        );
                    }
                    ScalingLevel::Discrete => {
                        // For numeric (discrete), enforce linear relationship
                        update_numeric_quantifications(
                            set_idx,
                            var_idx,
                            &category_values,
                            &mut category_quantifications
                        );
                    }
                }
            }
        }

        // Step 5: Update object scores
        let mut new_object_scores = vec![vec![0.0; dimensions]; num_cases];

        for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
            for (var_idx, var_data) in set_data.iter().enumerate() {
                let var_name = &data.set_target_data_defs[set_idx][var_idx].name;

                for (case_idx, record) in var_data.iter().enumerate() {
                    if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                        if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                            let cat_val = *num as usize;
                            if
                                let Some(quant) = category_quantifications.get(
                                    &(set_idx, var_idx, cat_val)
                                )
                            {
                                if let Some(weights) = variable_weights.get(&(set_idx, var_idx)) {
                                    for dim in 0..dimensions {
                                        new_object_scores[case_idx][dim] += quant * weights[dim];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Step 6: Orthonormalization
        center_and_normalize_scores(&mut new_object_scores);

        // Calculate loss for this iteration
        let new_loss = calculate_loss(
            &object_scores,
            &new_object_scores,
            &category_quantifications,
            &variable_weights,
            data,
            dimensions
        );

        // Step 7: Convergence test
        let diff = if current_loss == f64::MAX { 0.0 } else { current_loss - new_loss };
        if current_loss != f64::MAX && diff < convergence_criterion {
            break;
        }

        // Update for next iteration
        object_scores = new_object_scores;
        current_loss = new_loss;
    }

    // Step 8: Rotation (skipped for simplicity in this implementation)

    // Prepare result structure
    let mut set = HashMap::new();
    let mut loadings = HashMap::new();

    // Process each set
    for (set_idx, set_defs) in data.set_target_data_defs.iter().enumerate() {
        if let Some(set_data) = data.set_target_data.get(set_idx) {
            // Process each variable in the set
            for (var_idx, var_def) in set_defs.iter().enumerate() {
                if let Some(var_data) = set_data.get(var_idx) {
                    // Add variable to results
                    let var_key = format!("Set{}_Var{}", set_idx + 1, var_idx + 1);
                    set.insert(var_key.clone(), Variable {
                        variable_name: var_def.name.clone(),
                    });

                    // Calculate loadings (correlations between quantified variables and object scores)
                    let mut var_loadings = vec![0.0; dimensions];
                    let var_name = &var_def.name;

                    // Create quantified variable values
                    let mut quant_values = vec![vec![0.0; dimensions]; object_scores.len()];

                    for (case_idx, record) in var_data.iter().enumerate() {
                        if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                            let cat_val = *num as usize;

                            match determine_scaling_level(var_def, config) {
                                ScalingLevel::Multiple => {
                                    // For multiple nominal, loadings are direct correlations
                                    if
                                        let Some(&quant) = category_quantifications.get(
                                            &(set_idx, var_idx, cat_val)
                                        )
                                    {
                                        for dim in 0..dimensions {
                                            quant_values[case_idx][dim] = quant;
                                        }
                                    }
                                }
                                _ => {
                                    // For single variables, use weights
                                    if
                                        let Some(&quant) = category_quantifications.get(
                                            &(set_idx, var_idx, cat_val)
                                        )
                                    {
                                        if
                                            let Some(weights) = variable_weights.get(
                                                &(set_idx, var_idx)
                                            )
                                        {
                                            for dim in 0..dimensions {
                                                quant_values[case_idx][dim] = quant * weights[dim];
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Calculate correlation between quantified variable and object scores for each dimension
                    for dim in 0..dimensions {
                        var_loadings[dim] = calculate_correlation(
                            &quant_values
                                .iter()
                                .map(|qv| qv[dim])
                                .collect::<Vec<f64>>(),
                            &object_scores
                                .iter()
                                .map(|os| os[dim])
                                .collect::<Vec<f64>>()
                        );
                    }

                    loadings.insert(var_key, Dimensions {
                        dimensions: var_loadings,
                    });
                }
            }
        }
    }

    Ok(ComponentLoadings {
        set,
        loadings,
    })
}

/// Calculate fit measures for OVERALS analysis
pub fn calculate_fit_measures(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig
) -> Result<FitMeasures, String> {
    // Prepare main parameters
    let dimensions = config.main.dimensions.unwrap_or(2) as usize;
    let max_iterations = config.options.max_iter.unwrap_or(100) as usize;
    let convergence_criterion = config.options.conv.unwrap_or(0.00001);
    let use_random_init = config.options.use_randconf;

    // Count number of cases and prepare data structures
    let mut num_cases = 0;
    if let Some(first_set) = data.set_target_data.first() {
        if let Some(first_var) = first_set.first() {
            num_cases = first_var.len();
        }
    }

    if num_cases == 0 {
        return Err("No cases found in data".to_string());
    }

    // Initialize object scores
    let mut object_scores = if use_random_init {
        // Random initialization
        use rand::Rng;
        let mut rng = rand::thread_rng();
        let mut scores = Vec::with_capacity(num_cases);
        for _ in 0..num_cases {
            let mut row = Vec::with_capacity(dimensions);
            for _ in 0..dimensions {
                row.push(rng.gen::<f64>() * 2.0 - 1.0); // Random between -1 and 1
            }
            scores.push(row);
        }
        scores
    } else {
        // Numerical initialization
        let mut scores = Vec::with_capacity(num_cases);
        for i in 0..num_cases {
            let mut row = Vec::with_capacity(dimensions);
            for d in 0..dimensions {
                // Initialize with successive values
                let value = (((i % 10) as f64) / 10.0) * (if d % 2 == 0 { 1.0 } else { -1.0 });
                row.push(value);
            }
            scores.push(row);
        }
        scores
    };

    // Center and normalize object scores
    center_and_normalize_scores(&mut object_scores);

    // Initialize category quantifications and variable weights
    let mut category_quantifications: HashMap<(usize, usize, usize), f64> = HashMap::new();
    let mut variable_weights: HashMap<(usize, usize), Vec<f64>> = HashMap::new();

    // Initialize category counts and category values
    let mut category_values: HashMap<(usize, usize), Vec<usize>> = HashMap::new();

    // Discover categories for each variable
    for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
        for (var_idx, var_data) in set_data.iter().enumerate() {
            let var_name = &data.set_target_data_defs[set_idx][var_idx].name;
            let mut categories = Vec::new();

            for record in var_data {
                if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                    if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                        let cat_val = *num as usize;
                        if !categories.contains(&cat_val) {
                            categories.push(cat_val);
                        }
                    }
                }
            }

            categories.sort();
            category_values.insert((set_idx, var_idx), categories.clone());

            // Initialize variable weights
            let mut weights = Vec::with_capacity(dimensions);
            for _ in 0..dimensions {
                weights.push(1.0 / (dimensions as f64));
            }
            variable_weights.insert((set_idx, var_idx), weights);

            // Initialize category quantifications
            for (i, &cat_val) in categories.iter().enumerate() {
                // Initial quantification: scale from 0 to 1 based on category order
                let init_quant = if categories.len() > 1 {
                    (i as f64) / ((categories.len() - 1) as f64)
                } else {
                    0.5
                };
                category_quantifications.insert((set_idx, var_idx, cat_val), init_quant);
            }
        }
    }

    // Main iteration loop
    let mut current_loss = f64::MAX;

    for _ in 0..max_iterations {
        // Step 2: Loop across sets and variables
        for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
            for (var_idx, var_data) in set_data.iter().enumerate() {
                let var_name = &data.set_target_data_defs[set_idx][var_idx].name;
                let scaling_level = determine_scaling_level(
                    &data.set_target_data_defs[set_idx][var_idx],
                    config
                );

                // Step 3: Eliminate contributions of other variables
                // Calculate V_kj (sum of contributions of other variables in this set)
                let mut v_kj = vec![vec![0.0; dimensions]; num_cases];

                for (other_var_idx, other_var_data) in set_data.iter().enumerate() {
                    if other_var_idx == var_idx {
                        continue;
                    }

                    let other_var_name = &data.set_target_data_defs[set_idx][other_var_idx].name;

                    // Add contribution of other variable
                    for (case_idx, record) in other_var_data.iter().enumerate() {
                        if let Some(DataValue::Number(num)) = record.values.get(other_var_name) {
                            if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                                let cat_val = *num as usize;
                                if
                                    let Some(quant) = category_quantifications.get(
                                        &(set_idx, other_var_idx, cat_val)
                                    )
                                {
                                    if
                                        let Some(weights) = variable_weights.get(
                                            &(set_idx, other_var_idx)
                                        )
                                    {
                                        for dim in 0..dimensions {
                                            v_kj[case_idx][dim] += quant * weights[dim];
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Step 4: Update category quantifications
                match scaling_level {
                    ScalingLevel::Multiple => {
                        // For multiple nominal, calculate unconstrained quantifications
                        let categories = category_values
                            .get(&(set_idx, var_idx))
                            .unwrap_or(&Vec::new())
                            .clone();

                        for &cat_val in &categories {
                            // Count objects with this category
                            let mut cat_objects = Vec::new();

                            for (case_idx, record) in var_data.iter().enumerate() {
                                if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                                    if (*num as usize) == cat_val {
                                        cat_objects.push(case_idx);
                                    }
                                }
                            }

                            if cat_objects.is_empty() {
                                continue;
                            }

                            // Calculate new quantification for each dimension
                            let mut new_quant = 0.0;
                            let n = cat_objects.len() as f64;

                            for &case_idx in &cat_objects {
                                for dim in 0..dimensions {
                                    new_quant += object_scores[case_idx][dim] - v_kj[case_idx][dim];
                                }
                            }

                            new_quant /= n;
                            category_quantifications.insert((set_idx, var_idx, cat_val), new_quant);
                        }
                    }
                    ScalingLevel::Single | ScalingLevel::Nominal => {
                        // For single nominal, calculate rank-one approximation
                        update_single_nominal_quantifications(
                            set_idx,
                            var_idx,
                            var_name,
                            var_data,
                            &object_scores,
                            &v_kj,
                            &mut category_quantifications,
                            &mut variable_weights,
                            &category_values
                        );
                    }
                    ScalingLevel::Ordinal => {
                        // For ordinal, apply monotonic regression
                        update_ordinal_quantifications(
                            set_idx,
                            var_idx,
                            var_name,
                            var_data,
                            &object_scores,
                            &v_kj,
                            &mut category_quantifications,
                            &mut variable_weights,
                            &category_values
                        );
                    }
                    ScalingLevel::Discrete => {
                        // For numeric (discrete), enforce linear relationship
                        update_numeric_quantifications(
                            set_idx,
                            var_idx,
                            &category_values,
                            &mut category_quantifications
                        );
                    }
                }
            }
        }

        // Step 5: Update object scores
        let mut new_object_scores = vec![vec![0.0; dimensions]; num_cases];

        for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
            for (var_idx, var_data) in set_data.iter().enumerate() {
                let var_name = &data.set_target_data_defs[set_idx][var_idx].name;

                for (case_idx, record) in var_data.iter().enumerate() {
                    if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                        if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                            let cat_val = *num as usize;
                            if
                                let Some(quant) = category_quantifications.get(
                                    &(set_idx, var_idx, cat_val)
                                )
                            {
                                if let Some(weights) = variable_weights.get(&(set_idx, var_idx)) {
                                    for dim in 0..dimensions {
                                        new_object_scores[case_idx][dim] += quant * weights[dim];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Step 6: Orthonormalization
        center_and_normalize_scores(&mut new_object_scores);

        // Calculate loss for this iteration
        let new_loss = calculate_loss(
            &object_scores,
            &new_object_scores,
            &category_quantifications,
            &variable_weights,
            data,
            dimensions
        );

        // Step 7: Convergence test
        let diff = if current_loss == f64::MAX { 0.0 } else { current_loss - new_loss };
        if current_loss != f64::MAX && diff < convergence_criterion {
            break;
        }

        // Update for next iteration
        object_scores = new_object_scores;
        current_loss = new_loss;
    }

    // Prepare result structure
    let mut set = HashMap::new();
    let mut multiple_fit = HashMap::new();
    let mut single_fit = HashMap::new();
    let mut single_loss = HashMap::new();

    // Process each set
    for (set_idx, set_defs) in data.set_target_data_defs.iter().enumerate() {
        if let Some(set_data) = data.set_target_data.get(set_idx) {
            // Process each variable in the set
            for (var_idx, var_def) in set_defs.iter().enumerate() {
                if let Some(var_data) = set_data.get(var_idx) {
                    let var_name = &var_def.name;

                    // Add variable to results
                    let var_key = format!("Set{}_Var{}", set_idx + 1, var_idx + 1);
                    set.insert(var_key.clone(), Variable {
                        variable_name: var_def.name.clone(),
                    });

                    // Calculate multiple fit (for all scaling levels)
                    let mut multi_fit_dims = vec![0.0; dimensions];
                    let scaling_level = determine_scaling_level(var_def, config);

                    // Create indicator matrix and category-case mapping
                    let mut category_cases = HashMap::new();

                    for (case_idx, record) in var_data.iter().enumerate() {
                        if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                            let cat_val = *num as usize;
                            category_cases.entry(cat_val).or_insert(Vec::new()).push(case_idx);
                        }
                    }

                    // Calculate multiple fit
                    for dim in 0..dimensions {
                        let mut dim_fit = 0.0;
                        let mut total_cases = 0;

                        for (cat_val, cases) in &category_cases {
                            if
                                let Some(&quant) = category_quantifications.get(
                                    &(set_idx, var_idx, *cat_val)
                                )
                            {
                                let n_cases = cases.len();

                                // For multiple fit, use variance explained by category quantifications
                                let mut sum_sq = 0.0;
                                for &case_idx in cases {
                                    sum_sq += (quant - object_scores[case_idx][dim]).powi(2);
                                }

                                dim_fit += 1.0 - sum_sq / (n_cases as f64);
                                total_cases += n_cases;
                            }
                        }

                        // Normalize by number of cases
                        if total_cases > 0 {
                            multi_fit_dims[dim] = dim_fit / (total_cases as f64);
                        }
                    }

                    // Calculate single fit (for non-multiple scaling levels)
                    let mut sing_fit_dims = vec![0.0; dimensions];

                    if !matches!(scaling_level, ScalingLevel::Multiple) {
                        for dim in 0..dimensions {
                            let mut dim_fit = 0.0;
                            let mut total_cases = 0;

                            for (cat_val, cases) in &category_cases {
                                if
                                    let Some(&quant) = category_quantifications.get(
                                        &(set_idx, var_idx, *cat_val)
                                    )
                                {
                                    if
                                        let Some(weights) = variable_weights.get(
                                            &(set_idx, var_idx)
                                        )
                                    {
                                        let n_cases = cases.len();

                                        // For single fit, use variance explained by single-rank approximation
                                        let mut sum_sq = 0.0;
                                        for &case_idx in cases {
                                            sum_sq += (
                                                quant * weights[dim] -
                                                object_scores[case_idx][dim]
                                            ).powi(2);
                                        }

                                        dim_fit += 1.0 - sum_sq / (n_cases as f64);
                                        total_cases += n_cases;
                                    }
                                }
                            }

                            // Normalize by number of cases
                            if total_cases > 0 {
                                sing_fit_dims[dim] = dim_fit / (total_cases as f64);
                            }
                        }
                    } else {
                        // For multiple nominal, single fit is the same as multiple fit
                        sing_fit_dims = multi_fit_dims.clone();
                    }

                    // Calculate single loss (multiple_fit - single_fit)
                    let mut loss_dims = vec![0.0; dimensions];
                    for dim in 0..dimensions {
                        loss_dims[dim] = multi_fit_dims[dim] - sing_fit_dims[dim];
                    }

                    // Calculate sums
                    let multi_fit_sum = multi_fit_dims.iter().sum();
                    let sing_fit_sum = sing_fit_dims.iter().sum();
                    let loss_sum = loss_dims.iter().sum();

                    // Add to results
                    multiple_fit.insert(var_key.clone(), FitDimensions {
                        dimension: multi_fit_dims,
                        sum: multi_fit_sum,
                    });

                    single_fit.insert(var_key.clone(), FitDimensions {
                        dimension: sing_fit_dims,
                        sum: sing_fit_sum,
                    });

                    single_loss.insert(var_key.clone(), FitDimensions {
                        dimension: loss_dims,
                        sum: loss_sum,
                    });
                }
            }
        }
    }

    Ok(FitMeasures {
        set,
        multiple_fit,
        single_fit,
        single_loss,
    })
}

/// Calculate object scores for OVERALS analysis
pub fn calculate_object_scores(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig
) -> Result<ObjectScores, String> {
    // Prepare main parameters
    let dimensions = config.main.dimensions.unwrap_or(2) as usize;
    let max_iterations = config.options.max_iter.unwrap_or(100) as usize;
    let convergence_criterion = config.options.conv.unwrap_or(0.00001);
    let use_random_init = config.options.use_randconf;

    // Count number of cases and prepare data structures
    let mut num_cases = 0;
    if let Some(first_set) = data.set_target_data.first() {
        if let Some(first_var) = first_set.first() {
            num_cases = first_var.len();
        }
    }

    if num_cases == 0 {
        return Err("No cases found in data".to_string());
    }

    // Initialize object scores
    let mut object_scores = if use_random_init {
        // Random initialization
        use rand::Rng;
        let mut rng = rand::thread_rng();
        let mut scores = Vec::with_capacity(num_cases);
        for _ in 0..num_cases {
            let mut row = Vec::with_capacity(dimensions);
            for _ in 0..dimensions {
                row.push(rng.gen::<f64>() * 2.0 - 1.0); // Random between -1 and 1
            }
            scores.push(row);
        }
        scores
    } else {
        // Numerical initialization
        let mut scores = Vec::with_capacity(num_cases);
        for i in 0..num_cases {
            let mut row = Vec::with_capacity(dimensions);
            for d in 0..dimensions {
                // Initialize with successive values
                let value = (((i % 10) as f64) / 10.0) * (if d % 2 == 0 { 1.0 } else { -1.0 });
                row.push(value);
            }
            scores.push(row);
        }
        scores
    };

    // Center and normalize object scores
    center_and_normalize_scores(&mut object_scores);

    // Initialize category quantifications and variable weights
    let mut category_quantifications: HashMap<(usize, usize, usize), f64> = HashMap::new();
    let mut variable_weights: HashMap<(usize, usize), Vec<f64>> = HashMap::new();

    // Initialize category counts and category values
    let mut category_values: HashMap<(usize, usize), Vec<usize>> = HashMap::new();

    // Discover categories for each variable
    for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
        for (var_idx, var_data) in set_data.iter().enumerate() {
            let var_name = &data.set_target_data_defs[set_idx][var_idx].name;
            let mut categories = Vec::new();

            for record in var_data {
                if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                    if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                        let cat_val = *num as usize;
                        if !categories.contains(&cat_val) {
                            categories.push(cat_val);
                        }
                    }
                }
            }

            categories.sort();
            category_values.insert((set_idx, var_idx), categories.clone());

            // Initialize variable weights
            let mut weights = Vec::with_capacity(dimensions);
            for _ in 0..dimensions {
                weights.push(1.0 / (dimensions as f64));
            }
            variable_weights.insert((set_idx, var_idx), weights);

            // Initialize category quantifications
            for (i, &cat_val) in categories.iter().enumerate() {
                // Initial quantification: scale from 0 to 1 based on category order
                let init_quant = if categories.len() > 1 {
                    (i as f64) / ((categories.len() - 1) as f64)
                } else {
                    0.5
                };
                category_quantifications.insert((set_idx, var_idx, cat_val), init_quant);
            }
        }
    }

    // Main iteration loop
    let mut current_loss = f64::MAX;

    for _ in 0..max_iterations {
        // Step 2: Loop across sets and variables
        for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
            for (var_idx, var_data) in set_data.iter().enumerate() {
                let var_name = &data.set_target_data_defs[set_idx][var_idx].name;
                let scaling_level = determine_scaling_level(
                    &data.set_target_data_defs[set_idx][var_idx],
                    config
                );

                // Step 3: Eliminate contributions of other variables
                // Calculate V_kj (sum of contributions of other variables in this set)
                let mut v_kj = vec![vec![0.0; dimensions]; num_cases];

                for (other_var_idx, other_var_data) in set_data.iter().enumerate() {
                    if other_var_idx == var_idx {
                        continue;
                    }

                    let other_var_name = &data.set_target_data_defs[set_idx][other_var_idx].name;

                    // Add contribution of other variable
                    for (case_idx, record) in other_var_data.iter().enumerate() {
                        if let Some(DataValue::Number(num)) = record.values.get(other_var_name) {
                            if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                                let cat_val = *num as usize;
                                if
                                    let Some(quant) = category_quantifications.get(
                                        &(set_idx, other_var_idx, cat_val)
                                    )
                                {
                                    if
                                        let Some(weights) = variable_weights.get(
                                            &(set_idx, other_var_idx)
                                        )
                                    {
                                        for dim in 0..dimensions {
                                            v_kj[case_idx][dim] += quant * weights[dim];
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Step 4: Update category quantifications
                match scaling_level {
                    ScalingLevel::Multiple => {
                        // For multiple nominal, calculate unconstrained quantifications
                        let categories = category_values
                            .get(&(set_idx, var_idx))
                            .unwrap_or(&Vec::new())
                            .clone();

                        for &cat_val in &categories {
                            // Count objects with this category
                            let mut cat_objects = Vec::new();

                            for (case_idx, record) in var_data.iter().enumerate() {
                                if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                                    if (*num as usize) == cat_val {
                                        cat_objects.push(case_idx);
                                    }
                                }
                            }

                            if cat_objects.is_empty() {
                                continue;
                            }

                            // Calculate new quantification for each dimension
                            let mut new_quant = 0.0;
                            let n = cat_objects.len() as f64;

                            for &case_idx in &cat_objects {
                                for dim in 0..dimensions {
                                    new_quant += object_scores[case_idx][dim] - v_kj[case_idx][dim];
                                }
                            }

                            new_quant /= n;
                            category_quantifications.insert((set_idx, var_idx, cat_val), new_quant);
                        }
                    }
                    ScalingLevel::Single | ScalingLevel::Nominal => {
                        // For single nominal, calculate rank-one approximation
                        update_single_nominal_quantifications(
                            set_idx,
                            var_idx,
                            var_name,
                            var_data,
                            &object_scores,
                            &v_kj,
                            &mut category_quantifications,
                            &mut variable_weights,
                            &category_values
                        );
                    }
                    ScalingLevel::Ordinal => {
                        // For ordinal, apply monotonic regression
                        update_ordinal_quantifications(
                            set_idx,
                            var_idx,
                            var_name,
                            var_data,
                            &object_scores,
                            &v_kj,
                            &mut category_quantifications,
                            &mut variable_weights,
                            &category_values
                        );
                    }
                    ScalingLevel::Discrete => {
                        // For numeric (discrete), enforce linear relationship
                        update_numeric_quantifications(
                            set_idx,
                            var_idx,
                            &category_values,
                            &mut category_quantifications
                        );
                    }
                }
            }
        }

        // Step 5: Update object scores
        let mut new_object_scores = vec![vec![0.0; dimensions]; num_cases];

        for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
            for (var_idx, var_data) in set_data.iter().enumerate() {
                let var_name = &data.set_target_data_defs[set_idx][var_idx].name;

                for (case_idx, record) in var_data.iter().enumerate() {
                    if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                        if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                            let cat_val = *num as usize;
                            if
                                let Some(quant) = category_quantifications.get(
                                    &(set_idx, var_idx, cat_val)
                                )
                            {
                                if let Some(weights) = variable_weights.get(&(set_idx, var_idx)) {
                                    for dim in 0..dimensions {
                                        new_object_scores[case_idx][dim] += quant * weights[dim];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Step 6: Orthonormalization
        center_and_normalize_scores(&mut new_object_scores);

        // Calculate loss for this iteration
        let new_loss = calculate_loss(
            &object_scores,
            &new_object_scores,
            &category_quantifications,
            &variable_weights,
            data,
            dimensions
        );

        // Step 7: Convergence test
        let diff = if current_loss == f64::MAX { 0.0 } else { current_loss - new_loss };
        if current_loss != f64::MAX && diff < convergence_criterion {
            break;
        }

        // Update for next iteration
        object_scores = new_object_scores;
        current_loss = new_loss;
    }

    // Prepare result structure
    let mut scores = HashMap::new();

    // Add object scores to results
    for (i, score) in object_scores.iter().enumerate() {
        scores.insert(format!("Case{}", i + 1), Dimensions {
            dimensions: score.clone(),
        });
    }

    Ok(ObjectScores { scores })
}

/// Generate transformation plots data for OVERALS analysis
pub fn generate_transformation_plots(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig
) -> Result<TransformationPlots, String> {
    // Prepare main parameters
    let dimensions = config.main.dimensions.unwrap_or(2) as usize;
    let max_iterations = config.options.max_iter.unwrap_or(100) as usize;
    let convergence_criterion = config.options.conv.unwrap_or(0.00001);
    let use_random_init = config.options.use_randconf;

    // Count number of cases and prepare data structures
    let mut num_cases = 0;
    if let Some(first_set) = data.set_target_data.first() {
        if let Some(first_var) = first_set.first() {
            num_cases = first_var.len();
        }
    }

    if num_cases == 0 {
        return Err("No cases found in data".to_string());
    }

    // Initialize object scores
    let mut object_scores = if use_random_init {
        // Random initialization
        use rand::Rng;
        let mut rng = rand::thread_rng();
        let mut scores = Vec::with_capacity(num_cases);
        for _ in 0..num_cases {
            let mut row = Vec::with_capacity(dimensions);
            for _ in 0..dimensions {
                row.push(rng.gen::<f64>() * 2.0 - 1.0); // Random between -1 and 1
            }
            scores.push(row);
        }
        scores
    } else {
        // Numerical initialization
        let mut scores = Vec::with_capacity(num_cases);
        for i in 0..num_cases {
            let mut row = Vec::with_capacity(dimensions);
            for d in 0..dimensions {
                // Initialize with successive values
                let value = (((i % 10) as f64) / 10.0) * (if d % 2 == 0 { 1.0 } else { -1.0 });
                row.push(value);
            }
            scores.push(row);
        }
        scores
    };

    // Center and normalize object scores
    center_and_normalize_scores(&mut object_scores);

    // Initialize category quantifications and variable weights
    let mut category_quantifications: HashMap<(usize, usize, usize), f64> = HashMap::new();
    let mut variable_weights: HashMap<(usize, usize), Vec<f64>> = HashMap::new();

    // Initialize category counts and category values
    let mut category_values: HashMap<(usize, usize), Vec<usize>> = HashMap::new();

    // Discover categories for each variable
    for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
        for (var_idx, var_data) in set_data.iter().enumerate() {
            let var_name = &data.set_target_data_defs[set_idx][var_idx].name;
            let mut categories = Vec::new();

            for record in var_data {
                if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                    if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                        let cat_val = *num as usize;
                        if !categories.contains(&cat_val) {
                            categories.push(cat_val);
                        }
                    }
                }
            }

            categories.sort();
            category_values.insert((set_idx, var_idx), categories.clone());

            // Initialize variable weights
            let mut weights = Vec::with_capacity(dimensions);
            for _ in 0..dimensions {
                weights.push(1.0 / (dimensions as f64));
            }
            variable_weights.insert((set_idx, var_idx), weights);

            // Initialize category quantifications
            for (i, &cat_val) in categories.iter().enumerate() {
                // Initial quantification: scale from 0 to 1 based on category order
                let init_quant = if categories.len() > 1 {
                    (i as f64) / ((categories.len() - 1) as f64)
                } else {
                    0.5
                };
                category_quantifications.insert((set_idx, var_idx, cat_val), init_quant);
            }
        }
    }

    // Main iteration loop
    let mut current_loss = f64::MAX;

    for _ in 0..max_iterations {
        // Step 2: Loop across sets and variables
        for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
            for (var_idx, var_data) in set_data.iter().enumerate() {
                let var_name = &data.set_target_data_defs[set_idx][var_idx].name;
                let scaling_level = determine_scaling_level(
                    &data.set_target_data_defs[set_idx][var_idx],
                    config
                );

                // Step 3: Eliminate contributions of other variables
                // Calculate V_kj (sum of contributions of other variables in this set)
                let mut v_kj = vec![vec![0.0; dimensions]; num_cases];

                for (other_var_idx, other_var_data) in set_data.iter().enumerate() {
                    if other_var_idx == var_idx {
                        continue;
                    }

                    let other_var_name = &data.set_target_data_defs[set_idx][other_var_idx].name;

                    // Add contribution of other variable
                    for (case_idx, record) in other_var_data.iter().enumerate() {
                        if let Some(DataValue::Number(num)) = record.values.get(other_var_name) {
                            if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                                let cat_val = *num as usize;
                                if
                                    let Some(quant) = category_quantifications.get(
                                        &(set_idx, other_var_idx, cat_val)
                                    )
                                {
                                    if
                                        let Some(weights) = variable_weights.get(
                                            &(set_idx, other_var_idx)
                                        )
                                    {
                                        for dim in 0..dimensions {
                                            v_kj[case_idx][dim] += quant * weights[dim];
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Step 4: Update category quantifications
                match scaling_level {
                    ScalingLevel::Multiple => {
                        // For multiple nominal, calculate unconstrained quantifications
                        let categories = category_values
                            .get(&(set_idx, var_idx))
                            .unwrap_or(&Vec::new())
                            .clone();

                        for &cat_val in &categories {
                            // Count objects with this category
                            let mut cat_objects = Vec::new();

                            for (case_idx, record) in var_data.iter().enumerate() {
                                if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                                    if (*num as usize) == cat_val {
                                        cat_objects.push(case_idx);
                                    }
                                }
                            }

                            if cat_objects.is_empty() {
                                continue;
                            }

                            // Calculate new quantification for each dimension
                            let mut new_quant = 0.0;
                            let n = cat_objects.len() as f64;

                            for &case_idx in &cat_objects {
                                for dim in 0..dimensions {
                                    new_quant += object_scores[case_idx][dim] - v_kj[case_idx][dim];
                                }
                            }

                            new_quant /= n;
                            category_quantifications.insert((set_idx, var_idx, cat_val), new_quant);
                        }
                    }
                    ScalingLevel::Single | ScalingLevel::Nominal => {
                        // For single nominal, calculate rank-one approximation
                        update_single_nominal_quantifications(
                            set_idx,
                            var_idx,
                            var_name,
                            var_data,
                            &object_scores,
                            &v_kj,
                            &mut category_quantifications,
                            &mut variable_weights,
                            &category_values
                        );
                    }
                    ScalingLevel::Ordinal => {
                        // For ordinal, apply monotonic regression
                        update_ordinal_quantifications(
                            set_idx,
                            var_idx,
                            var_name,
                            var_data,
                            &object_scores,
                            &v_kj,
                            &mut category_quantifications,
                            &mut variable_weights,
                            &category_values
                        );
                    }
                    ScalingLevel::Discrete => {
                        // For numeric (discrete), enforce linear relationship
                        update_numeric_quantifications(
                            set_idx,
                            var_idx,
                            &category_values,
                            &mut category_quantifications
                        );
                    }
                }
            }
        }

        // Step 5: Update object scores
        let mut new_object_scores = vec![vec![0.0; dimensions]; num_cases];

        for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
            for (var_idx, var_data) in set_data.iter().enumerate() {
                let var_name = &data.set_target_data_defs[set_idx][var_idx].name;

                for (case_idx, record) in var_data.iter().enumerate() {
                    if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                        if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                            let cat_val = *num as usize;
                            if
                                let Some(quant) = category_quantifications.get(
                                    &(set_idx, var_idx, cat_val)
                                )
                            {
                                if let Some(weights) = variable_weights.get(&(set_idx, var_idx)) {
                                    for dim in 0..dimensions {
                                        new_object_scores[case_idx][dim] += quant * weights[dim];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Step 6: Orthonormalization
        center_and_normalize_scores(&mut new_object_scores);

        // Calculate loss for this iteration
        let new_loss = calculate_loss(
            &object_scores,
            &new_object_scores,
            &category_quantifications,
            &variable_weights,
            data,
            dimensions
        );

        // Step 7: Convergence test
        let diff = if current_loss == f64::MAX { 0.0 } else { current_loss - new_loss };
        if current_loss != f64::MAX && diff < convergence_criterion {
            break;
        }

        // Update for next iteration
        object_scores = new_object_scores;
        current_loss = new_loss;
    }

    // Prepare result structure
    let mut transformations = HashMap::new();

    // Process each set
    for (set_idx, set_defs) in data.set_target_data_defs.iter().enumerate() {
        // Process each variable in the set
        for (var_idx, var_def) in set_defs.iter().enumerate() {
            // Get categories for this variable
            let mut categories = Vec::new();

            if let Some(set_data) = data.set_target_data.get(set_idx) {
                if let Some(var_data) = set_data.get(var_idx) {
                    for record in var_data {
                        if let Some(DataValue::Number(num)) = record.values.get(&var_def.name) {
                            let cat_val = *num as usize;
                            if !categories.contains(&cat_val) {
                                categories.push(cat_val);
                            }
                        }
                    }
                }
            }

            // Sort categories
            categories.sort();

            // Skip if no categories
            if categories.is_empty() {
                continue;
            }

            // Create transformation points
            let mut points = Vec::new();

            for &cat_val in &categories {
                if let Some(&quant) = category_quantifications.get(&(set_idx, var_idx, cat_val)) {
                    points.push(TransformationPoint {
                        category: cat_val,
                        quantification: quant,
                    });
                }
            }

            // Add to results if points exist
            if !points.is_empty() {
                transformations.insert(var_def.name.clone(), points);
            }
        }
    }

    Ok(TransformationPlots { transformations })
}

/// Calculate Pearson correlation coefficient
fn calculate_correlation(x: &[f64], y: &[f64]) -> f64 {
    if x.len() != y.len() || x.is_empty() {
        return 0.0;
    }

    let n = x.len() as f64;

    // Calculate means
    let mean_x = x.iter().sum::<f64>() / n;
    let mean_y = y.iter().sum::<f64>() / n;

    // Calculate covariance and variances
    let mut cov = 0.0;
    let mut var_x = 0.0;
    let mut var_y = 0.0;

    for i in 0..x.len() {
        let dx = x[i] - mean_x;
        let dy = y[i] - mean_y;
        cov += dx * dy;
        var_x += dx * dx;
        var_y += dy * dy;
    }

    // Calculate correlation
    if var_x > 0.0 && var_y > 0.0 {
        cov / (var_x.sqrt() * var_y.sqrt())
    } else {
        0.0
    }
}
