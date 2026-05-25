use std::collections::HashMap;

use statify_ordinal::{
    aggregate_data, build_plum_output, fit_plum, EstimationOptions, PlumEstimationOptions,
    PlumLocationModel, PlumMetadata, PlumPredictor, PlumResponse, PlumScaleModel, PlumSpec,
    PlumWorkerPayload,
};
use serde_json::json;

fn build_input() -> PlumWorkerPayload {
    let response_vector = vec![
        1.0, 1.0, 1.0, 2.0, 2.0, 2.0, 3.0, 3.0, 3.0,
    ];
    let location_design_matrix = vec![
        vec![0.1],
        vec![0.2],
        vec![0.3],
        vec![0.4],
        vec![0.5],
        vec![0.6],
        vec![0.7],
        vec![0.8],
        vec![0.9],
    ];

    PlumWorkerPayload {
        analysis_type: "ORDINAL_REGRESSION_PLUM".to_string(),
        procedure: "PLUM".to_string(),
        version: "plum-v1".to_string(),
        weights: None,
        response: PlumResponse {
            variable_name: "y".to_string(),
            column_index: 0,
            response_categories: vec![json!(1.0), json!(2.0), json!(3.0)],
            response_vector: response_vector.clone(),
            category_count: 3,
        },
        location_model: PlumLocationModel {
            predictors: vec![PlumPredictor {
                name: "x1".to_string(),
                column_index: 0,
                role: "continuous".to_string(),
                levels: None,
                reference_category: None,
            }],
            location_design_matrix: location_design_matrix.clone(),
            location_term_names: vec!["x1".to_string()],
            parameter_count: 1,
        },
        scale_model: PlumScaleModel {
            enabled: false,
            predictors: Vec::new(),
            scale_design_matrix: Vec::new(),
            scale_term_names: Vec::new(),
            parameter_count: 0,
        },
        estimation_options: PlumEstimationOptions {
            link_function: "Logit".to_string(),
            max_iterations: 100,
            max_step_halving: 10,
            log_likelihood_tolerance: 1e-4,
            parameter_tolerance: 1e-4,
            singularity_tolerance: 1e-6,
            confidence_level: 95.0,
            zero_cell_adjustment: 0.0,
        },
        output_options: serde_json::Value::Null,
        metadata: PlumMetadata {
            model_type: "location_only".to_string(),
            total_rows: response_vector.len(),
            valid_rows: response_vector.len(),
            dropped_rows: 0,
            response_category_count: 3,
            location_parameter_count: 1,
            scale_parameter_count: 0,
            reference_categories: HashMap::new(),
        },
    }
}

#[test]
fn location_only_fit_converges() {
    let input = build_input();
    let data = aggregate_data(&input).expect("data");
    let spec = PlumSpec::from_input(&input).expect("spec");
    let options = EstimationOptions::from_payload(Some(&input.estimation_options));

    let fit = fit_plum(&data, &spec, &options).expect("fit");

    assert!(fit.converged);
    assert_eq!(fit.params.theta.len(), spec.threshold_count());
    assert_eq!(fit.params.beta.len(), spec.location_parameter_count());

    let output = build_plum_output(&input, &data, &spec, &fit).expect("output");
    assert!(!output.parameter_estimates.is_empty());
}
