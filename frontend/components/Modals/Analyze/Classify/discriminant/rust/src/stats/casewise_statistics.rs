use nalgebra::{DMatrix, DVector};
use std::collections::HashMap;

use crate::models::{
    result::{CanonicalFunctions, CasewiseStatistics, HighestGroupStatistics},
    AnalysisData, DiscriminantConfig,
};

use super::core::{
    calculate_canonical_functions, calculate_eigen_statistics, calculate_p_value_from_chi_square,
    calculate_prior_probabilities, extract_analyzed_dataset, get_stepwise_selected_variables,
    EPSILON,
};

/// Calculate detailed statistics for each case
pub fn calculate_casewise_statistics(
    data: &AnalysisData,
    config: &DiscriminantConfig,
) -> Result<CasewiseStatistics, String> {
    web_sys::console::log_1(&"Executing calculate_casewise_statistics".into());

    // Debug: Log full classify config
    web_sys::console::log_1(&format!(
        "[Casewise] Full classify config: all_group_equal={}, group_size={}, case={}, limit={}, limit_value={:?}, summary={}, leave={}",
        config.classify.all_group_equal,
        config.classify.group_size,
        config.classify.case,
        config.classify.limit,
        config.classify.limit_value,
        config.classify.summary,
        config.classify.leave
    ).into());

    if !config.classify.case {
        web_sys::console::log_1(&"[Casewise] case is FALSE - returning early!".into());
        return Err("Casewise statistics not requested in configuration".to_string());
    }

    web_sys::console::log_1(&"[Casewise] case is TRUE - proceeding with calculation".into());

    let dataset = extract_analyzed_dataset(data, config)?;
    let grouping_var = &config.main.grouping_variable;

    // Filter grouping variable dan gunakan variabel Stepwise (Menjawab Poin 3 Claude)
    let variables_to_use: Vec<String> = if config.main.stepwise {
        get_stepwise_selected_variables(data, config)?
    } else {
        config
            .main
            .independent_variables
            .iter()
            .filter(|v| *v != grouping_var)
            .cloned()
            .collect()
    };

    let canonical_functions = calculate_canonical_functions(data, config)?;
    let eigen_stats = calculate_eigen_statistics(data, config)?;
    let num_functions = eigen_stats.eigenvalue.len();

    let mut case_number = Vec::new();
    let mut actual_group = Vec::new();
    let mut predicted_group = Vec::new();

    let mut highest_p_value = Vec::new();
    let mut highest_df = Vec::new();
    let mut highest_p_g_equals_d = Vec::new();
    let mut highest_squared_mahalanobis_distance = Vec::new();
    let mut highest_group = Vec::new();

    let mut second_p_value = Vec::new();
    let mut second_df = Vec::new();
    let mut second_p_g_equals_d = Vec::new();
    let mut second_squared_mahalanobis_distance = Vec::new();
    let mut second_group = Vec::new();

    let mut discriminant_scores: HashMap<String, Vec<f64>> = (1..=num_functions)
        .map(|i| (format!("Function {}", i), Vec::new()))
        .collect();

    let prior_probs = calculate_prior_probabilities(data, config)?;

    // Pengamanan Limit agar tidak pernah bernilai 0
    let limit = if config.classify.limit {
        let val = config.classify.limit_value.unwrap_or(i32::MAX);
        if val <= 0 {
            usize::MAX
        } else {
            val as usize
        }
    } else {
        usize::MAX
    };

    let mut case_idx = 0;
    let mut processed_cases = 0;

    for group_idx in 0..data.group_data.len() {
        for case_record in data.group_data[group_idx].iter() {
            if processed_cases >= limit {
                break;
            }

            case_idx += 1;

            // [PERBAIKAN 1]: Mengambil grup langsung dari urutan dataset
            let actual_group_name = dataset
                .group_labels
                .get(group_idx)
                .cloned()
                .unwrap_or_else(|| format!("Group {}", group_idx + 1));

            // [PERBAIKAN 2 - SANGAT KRUSIAL]: Bulletproof extraction!
            // Tidak akan ada lagi baris data yang di-skip/continue diam-diam.
            let mut case_values = Vec::with_capacity(variables_to_use.len());
            for var in &variables_to_use {
                case_values.push(case_record.values.get(var).and_then(|v| match v {
                    crate::models::data::DataValue::Number(n) => Some(*n),
                    _ => None,
                }).unwrap_or(0.0));
            }

            let disc_scores = calculate_discriminant_scores(
                &case_values,
                &canonical_functions,
                &variables_to_use,
                num_functions,
            );

            for (func_idx, score) in disc_scores.iter().enumerate() {
                if let Some(scores) =
                    discriminant_scores.get_mut(&format!("Function {}", func_idx + 1))
                {
                    scores.push(*score);
                }
            }

            let mut group_probs = Vec::new();
            let mut group_distances = Vec::new();

            for (g_idx, group_name) in dataset.group_labels.iter().enumerate() {
                // [PERBAIKAN 3]: Mahalanobis distance di Discriminant Space = Euclidean distance
                // Jauh lebih akurat, ringan, dan bebas dari error singular matrix!
                let mut d2 = 0.0;
                if let Some(centroid) = canonical_functions.function_at_centroids.get(group_name) {
                    for (func_idx, &score) in disc_scores.iter().enumerate() {
                        if func_idx < centroid.len() {
                            d2 += (score - centroid[func_idx]).powi(2);
                        }
                    }
                }
                group_distances.push((g_idx, d2));

                let prior = if g_idx < prior_probs.prior_probabilities.len() {
                    prior_probs.prior_probabilities[g_idx]
                } else {
                    1.0 / (dataset.num_groups as f64)
                };

                let log_prior = prior.ln();
                let log_prob = log_prior - 0.5 * d2; // Formula ini sudah 100% benar (Poin 2 Claude keliru)
                group_probs.push((g_idx, log_prob));
            }

            // Urutkan probabilitas dari yang tertinggi ke terendah
            group_probs
                .sort_by(|(_, a), (_, b)| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));

            let max_log_prob = group_probs[0].1;
            let mut sum_exp = 0.0;
            for (_, log_prob) in &mut group_probs {
                *log_prob = (*log_prob - max_log_prob).exp();
                sum_exp += *log_prob;
            }

            if sum_exp > 0.0 {
                for (_, prob) in &mut group_probs {
                    *prob /= sum_exp;
                }
            }

            let highest = &group_probs[0];
            let second = if group_probs.len() > 1 {
                &group_probs[1]
            } else {
                highest
            };

            let highest_dist = group_distances
                .iter()
                .find(|(idx, _)| *idx == highest.0)
                .unwrap()
                .1;
            let second_dist = group_distances
                .iter()
                .find(|(idx, _)| *idx == second.0)
                .unwrap()
                .1;

            case_number.push(case_idx);
            actual_group.push(actual_group_name);
            predicted_group.push(dataset.group_labels[highest.0].clone());

            // [PERBAIKAN 4 (Saran Claude Poin 4)]: Mengonversi Jarak Mahalanobis murni ke P-Value (Chi-Square)
            let p_val_highest = calculate_p_value_from_chi_square(highest_dist, num_functions);
            let p_val_second = calculate_p_value_from_chi_square(second_dist, num_functions);

            highest_p_value.push(p_val_highest);
            highest_df.push(num_functions);
            highest_p_g_equals_d.push(highest.1);
            highest_squared_mahalanobis_distance.push(highest_dist);
            highest_group.push(dataset.group_labels[highest.0].clone());

            second_p_value.push(p_val_second);
            second_df.push(num_functions);
            second_p_g_equals_d.push(second.1);
            second_squared_mahalanobis_distance.push(second_dist);
            second_group.push(dataset.group_labels[second.0].clone());

            processed_cases += 1;
        }

        if processed_cases >= limit {
            break;
        }
    }

    Ok(CasewiseStatistics {
        case_number,
        actual_group,
        predicted_group,
        highest_group: HighestGroupStatistics {
            p_value: highest_p_value,
            df: highest_df,
            p_g_equals_d: highest_p_g_equals_d,
            squared_mahalanobis_distance: highest_squared_mahalanobis_distance,
            group: highest_group,
        },
        second_highest_group: HighestGroupStatistics {
            p_value: second_p_value,
            df: second_df,
            p_g_equals_d: second_p_g_equals_d,
            squared_mahalanobis_distance: second_squared_mahalanobis_distance,
            group: second_group,
        },
        discriminant_scores,
    })
}

/// Calculate discriminant scores for a case
fn calculate_discriminant_scores(
    case_values: &[f64],
    canonical_functions: &CanonicalFunctions,
    variables: &[String],
    num_functions: usize,
) -> Vec<f64> {
    let mut discriminant_scores = vec![0.0; num_functions];

    for (var_idx, var_name) in variables.iter().enumerate() {
        if let Some(coefs) = canonical_functions.coefficients.get(var_name) {
            for func_idx in 0..num_functions {
                if func_idx < coefs.len() && var_idx < case_values.len() {
                    discriminant_scores[func_idx] += case_values[var_idx] * coefs[func_idx];
                }
            }
        }
    }

    if let Some(constants) = canonical_functions.coefficients.get("(Constant)") {
        for func_idx in 0..num_functions.min(constants.len()) {
            discriminant_scores[func_idx] += constants[func_idx];
        }
    }

    discriminant_scores
}
