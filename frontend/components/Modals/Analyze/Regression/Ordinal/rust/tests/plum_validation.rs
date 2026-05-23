use statify_ordinal::{validate_input, Category, PlumFitInput};

fn base_input() -> PlumFitInput {
    PlumFitInput {
        payload: statify_ordinal::OrdinalPlumPayload {
            procedure: "PLUM".to_string(),
            version: "plum-v1".to_string(),
            response: statify_ordinal::ResponseSpec {
                variable: "y".to_string(),
                ordered_categories: vec![Category::Number(1.0), Category::Number(2.0)],
                category_count: 2,
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
            estimation: None,
            output: None,
        },
        data: vec![statify_ordinal::PlumDataRow {
            y: 1.0,
            x: vec![0.0],
            z: None,
            w: None,
        }],
        feature_names: vec!["x1".to_string()],
        scale_feature_names: None,
    }
}

#[test]
fn validation_fails_on_category_count() {
    let mut input = base_input();
    input.payload.response.ordered_categories = vec![Category::Number(1.0)];
    input.payload.response.category_count = 1;
    let result = validate_input(&input);
    assert!(!result.valid);
}

#[test]
fn validation_fails_on_x_length() {
    let mut input = base_input();
    input.data[0].x = vec![0.0, 1.0];
    let result = validate_input(&input);
    assert!(!result.valid);
}

#[test]
fn validation_fails_on_missing_z_for_nonconstant() {
    let mut input = base_input();
    input.payload.scale.scale_type = "nonconstant".to_string();
    input.payload.scale.variables = vec!["z1".to_string()];
    let result = validate_input(&input);
    assert!(!result.valid);
}
