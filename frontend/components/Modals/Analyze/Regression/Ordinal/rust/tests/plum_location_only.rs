use statify_ordinal::{
    aggregate_data, build_plum_output, fit_plum, Category, EstimationOptions, PlumFitInput,
    PlumSpec,
};

fn build_input() -> PlumFitInput {
    let data = vec![
        statify_ordinal::PlumDataRow { y: 1.0, x: vec![0.1], z: None, w: None },
        statify_ordinal::PlumDataRow { y: 1.0, x: vec![0.2], z: None, w: None },
        statify_ordinal::PlumDataRow { y: 1.0, x: vec![0.3], z: None, w: None },
        statify_ordinal::PlumDataRow { y: 2.0, x: vec![0.4], z: None, w: None },
        statify_ordinal::PlumDataRow { y: 2.0, x: vec![0.5], z: None, w: None },
        statify_ordinal::PlumDataRow { y: 2.0, x: vec![0.6], z: None, w: None },
        statify_ordinal::PlumDataRow { y: 3.0, x: vec![0.7], z: None, w: None },
        statify_ordinal::PlumDataRow { y: 3.0, x: vec![0.8], z: None, w: None },
        statify_ordinal::PlumDataRow { y: 3.0, x: vec![0.9], z: None, w: None },
    ];

    PlumFitInput {
        payload: statify_ordinal::OrdinalPlumPayload {
            procedure: "PLUM".to_string(),
            version: "plum-v1".to_string(),
            response: statify_ordinal::ResponseSpec {
                variable: "y".to_string(),
                ordered_categories: vec![
                    Category::Number(1.0),
                    Category::Number(2.0),
                    Category::Number(3.0),
                ],
                category_count: 3,
            },
            model: statify_ordinal::ModelSpec {
                model_type: "location_only".to_string(),
                link_function: "logit".to_string(),
                parameter_vector: Vec::new(),
            },
            location: statify_ordinal::LocationSpec {
                variables: vec!["x1".to_string()],
                parameter_name: "beta".to_string(),
                threshold_name: "theta".to_string(),
            },
            scale: statify_ordinal::ScaleSpec {
                scale_type: "unity".to_string(),
                variables: Vec::new(),
                parameter_name: "tau".to_string(),
            },
            estimation: Some(statify_ordinal::EstimationOptionsPayload {
                method: Some("fisher_scoring".to_string()),
                max_iterations: Some(100),
                max_step_halving: Some(10),
                convergence_tolerance: Some(1e-4),
                parameter_tolerance: Some(1e-4),
                gradient_tolerance: Some(1e-4),
                alpha: Some(0.05),
                zero_cell_correction: Some(0.0),
            }),
            output: None,
        },
        data,
        feature_names: vec!["x1".to_string()],
        scale_feature_names: None,
    }
}

#[test]
fn location_only_fit_converges() {
    let input = build_input();
    let data = aggregate_data(&input).expect("data");
    let spec = PlumSpec::from_input(&input).expect("spec");
    let options = EstimationOptions::from_payload(input.payload.estimation.as_ref());

    let fit = fit_plum(&data, &spec, &options).expect("fit");

    assert!(fit.converged);
    assert_eq!(fit.params.theta.len(), spec.threshold_count());
    assert_eq!(fit.params.beta.len(), spec.location_parameter_count());

    let output = build_plum_output(&input, &data, &spec, &fit).expect("output");
    assert!(!output.parameter_estimates.is_empty());
}
