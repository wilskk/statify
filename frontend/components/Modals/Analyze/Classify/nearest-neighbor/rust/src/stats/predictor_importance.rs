use std::collections::HashMap;

use crate::models::{
    config::KnnConfig,
    data::AnalysisData,
    result::{
        FeatureWeightDetail, PredictorImportance, PredictorImportanceEntry,
        PredictorWeightExpansionDebug,
    },
};

use super::{
    core::{determine_effective_k, preprocess_knn_data},
    feature_selection::evaluate_subset,
};

#[derive(Clone, Debug)]
pub struct PredictorImportanceResult {
    pub importance: PredictorImportance,
    pub expanded_feature_weights: Vec<f64>,
}

pub fn calculate_predictor_importance(
    data: &AnalysisData,
    config: &KnnConfig,
) -> Result<PredictorImportanceResult, String> {
    let predictors = config.main.feature_var.as_deref().unwrap_or(&[]).to_vec();

    if predictors.is_empty() {
        return Err("No predictors are available for weighting".to_string());
    }

    let mut unweighted_config = config.clone();
    unweighted_config.neighbors.weight = false;

    let knn_data = preprocess_knn_data(data, &unweighted_config)?;
    let k = determine_effective_k(&knn_data, &unweighted_config)?;
    let base_error = evaluate_subset(data, &unweighted_config, &predictors)?;

    let predictor_count = predictors.len();
    let minimum_importance = 1.0 / predictor_count as f64;
    let mut raw_entries = Vec::with_capacity(predictor_count);

    for predictor in &predictors {
        let remaining_features = predictors
            .iter()
            .filter(|feature| *feature != predictor)
            .cloned()
            .collect::<Vec<_>>();

        let error_without_feature = if remaining_features.is_empty() {
            base_error
        } else {
            evaluate_subset(data, &unweighted_config, &remaining_features)?
        };
        let raw_feature_importance = error_without_feature + minimum_importance;

        raw_entries.push((
            predictor.clone(),
            error_without_feature,
            raw_feature_importance,
        ));
    }

    let total_importance = raw_entries
        .iter()
        .map(|(_, _, importance)| *importance)
        .sum::<f64>();
    let fallback_weight = 1.0 / predictor_count as f64;
    let mut predictor_weights = HashMap::new();
    let mut entries = raw_entries
        .into_iter()
        .map(
            |(feature_name, error_without_feature, raw_feature_importance)| {
                let normalized_importance = if total_importance > f64::EPSILON {
                    raw_feature_importance / total_importance
                } else {
                    fallback_weight
                };
                predictor_weights.insert(feature_name.clone(), normalized_importance);

                PredictorImportanceEntry {
                    feature_name,
                    base_error,
                    error_without_feature,
                    delta_error: error_without_feature - base_error,
                    raw_feature_importance,
                    normalized_importance,
                    rank: 0,
                    remove_indices: None,
                    remaining_indices: None,
                    error_ratio: if base_error.abs() > f64::EPSILON {
                        Some(error_without_feature / base_error)
                    } else {
                        None
                    },
                }
            },
        )
        .collect::<Vec<_>>();

    entries.sort_by(|left, right| {
        right
            .normalized_importance
            .total_cmp(&left.normalized_importance)
            .then_with(|| left.feature_name.cmp(&right.feature_name))
    });
    for (index, entry) in entries.iter_mut().enumerate() {
        entry.rank = index + 1;
    }

    let (expanded_feature_weights, expansion_debug, final_expanded_feature_weights) =
        expand_predictor_weights(&knn_data.features, &predictors, &predictor_weights);

    Ok(PredictorImportanceResult {
        importance: PredictorImportance {
            predictors: predictor_weights,
            target: config.main.target_var.clone().unwrap_or_default(),
            entries,
            k,
            regression_base_prediction_debug: None,
            weight_expansion_debug: Some(expansion_debug),
            final_expanded_feature_weights: Some(final_expanded_feature_weights),
        },
        expanded_feature_weights,
    })
}

fn expand_predictor_weights(
    expanded_features: &[String],
    predictors: &[String],
    predictor_weights: &HashMap<String, f64>,
) -> (
    Vec<f64>,
    Vec<PredictorWeightExpansionDebug>,
    Vec<FeatureWeightDetail>,
) {
    let fallback_weight = if predictors.is_empty() {
        1.0
    } else {
        1.0 / predictors.len() as f64
    };
    let mut expanded_weights = Vec::with_capacity(expanded_features.len());
    let mut final_details = Vec::with_capacity(expanded_features.len());
    let mut expansion_debug = Vec::new();

    for predictor in predictors {
        let normalized_predictor_weight = predictor_weights
            .get(predictor)
            .copied()
            .unwrap_or(fallback_weight);
        let mut encoded_columns = Vec::new();
        let mut encoded_column_weights = Vec::new();

        for expanded_feature in expanded_features {
            if expanded_feature == predictor
                || expanded_feature.starts_with(&format!("{predictor}="))
            {
                encoded_columns.push(expanded_feature.clone());
                encoded_column_weights.push(FeatureWeightDetail {
                    feature: expanded_feature.clone(),
                    weight: normalized_predictor_weight,
                });
            }
        }

        expansion_debug.push(PredictorWeightExpansionDebug {
            predictor: predictor.clone(),
            normalized_predictor_weight,
            encoded_columns,
            encoded_column_weights,
        });
    }

    for expanded_feature in expanded_features {
        let predictor = predictors.iter().find(|predictor| {
            expanded_feature == *predictor || expanded_feature.starts_with(&format!("{predictor}="))
        });
        let weight = predictor
            .and_then(|predictor| predictor_weights.get(predictor).copied())
            .unwrap_or(fallback_weight);

        expanded_weights.push(weight);
        final_details.push(FeatureWeightDetail {
            feature: expanded_feature.clone(),
            weight,
        });
    }

    (expanded_weights, expansion_debug, final_details)
}
