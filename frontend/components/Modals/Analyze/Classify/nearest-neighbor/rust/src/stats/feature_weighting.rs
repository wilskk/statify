use crate::models::{config::KnnConfig, data::KnnData};

pub fn calculate_feature_weights(_knn_data: &KnnData, _config: &KnnConfig) -> Option<Vec<f64>> {
    None
}
