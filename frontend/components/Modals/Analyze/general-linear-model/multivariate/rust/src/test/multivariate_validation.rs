use std::collections::HashMap;

use crate::models::{
    config::MultivariateConfig,
    data::{
        AnalysisData,
        DataRecord,
        DataValue,
        VariableAlign,
        VariableDefinition,
        VariableMeasure,
        VariableRole,
        VariableType,
    },
};
use crate::stats::core::{
    calculate_box_test,
    calculate_multivariate_tests,
    calculate_parameter_estimates,
    calculate_tests_between_subjects_effects,
};
use serde_json::json;

fn numeric_def(name: &str, column_index: usize) -> VariableDefinition {
    VariableDefinition {
        id: None,
        column_index,
        name: name.to_string(),
        r#type: VariableType::Numeric,
        width: 8,
        decimals: 3,
        label: Some(name.to_string()),
        values: vec![],
        missing: vec![],
        columns: 8,
        align: VariableAlign::Right,
        measure: VariableMeasure::Scale,
        role: VariableRole::Input,
    }
}

fn nominal_def(name: &str, column_index: usize) -> VariableDefinition {
    VariableDefinition {
        id: None,
        column_index,
        name: name.to_string(),
        r#type: VariableType::String,
        width: 16,
        decimals: 0,
        label: Some(name.to_string()),
        values: vec![],
        missing: vec![],
        columns: 16,
        align: VariableAlign::Left,
        measure: VariableMeasure::Nominal,
        role: VariableRole::Input,
    }
}

fn build_config(dep_vars: &[&str], factors: &[&str], covars: &[&str]) -> MultivariateConfig {
    let factors_var: Vec<String> = factors
        .iter()
        .map(|v| v.to_string())
        .chain(covars.iter().map(|v| v.to_string()))
        .collect();

    serde_json::from_value(json!({
        "main": {
            "DepVar": dep_vars,
            "FixFactor": factors,
            "Covar": if covars.is_empty() { serde_json::Value::Null } else { json!(covars) },
            "WlsWeight": null
        },
        "model": {
            "NonCust": true,
            "Custom": false,
            "BuildCustomTerm": false,
            "FactorsVar": factors_var,
            "BuildTermMethod": "mainEffects",
            "FactorsModel": factors,
            "TermsVar": null,
            "CovModel": null,
            "RandomModel": null,
            "TermText": null,
            "SumOfSquareMethod": "typeIII",
            "Intercept": true
        },
        "contrast": {
            "FactorList": factors,
            "ContrastMethod": "none",
            "Last": true,
            "First": false
        },
        "plots": {
            "SrcList": null,
            "AxisList": null,
            "LineList": null,
            "PlotList": null,
            "FixFactorVars": null,
            "RandFactorVars": null,
            "LineChartType": false,
            "BarChartType": false,
            "IncludeErrorBars": false,
            "ConfidenceInterval": false,
            "StandardError": false,
            "Multiplier": 2,
            "IncludeRefLineForGrandMean": false,
            "YAxisStart0": false
        },
        "posthoc": {
            "SrcList": null,
            "FixFactorVars": null,
            "Lsd": false,
            "Bonfe": false,
            "Sidak": false,
            "Scheffe": false,
            "Regwf": false,
            "Regwq": false,
            "Snk": false,
            "Tu": false,
            "Tub": false,
            "Dun": false,
            "Hoc": false,
            "Gabriel": false,
            "Waller": false,
            "ErrorRatio": 100,
            "Dunnett": false,
            "CategoryMethod": "last",
            "Twosided": true,
            "LtControl": false,
            "GtControl": false,
            "Tam": false,
            "Dunt": false,
            "Games": false,
            "Dunc": false
        },
        "emmeans": {
            "SrcList": null,
            "TargetList": null,
            "CompMainEffect": false,
            "ConfiIntervalMethod": "lsdNone"
        },
        "save": {
            "ResWeighted": false,
            "PreWeighted": false,
            "StdStatistics": false,
            "CooksD": false,
            "Leverage": false,
            "UnstandardizedRes": false,
            "WeightedRes": false,
            "StandardizedRes": false,
            "StudentizedRes": false,
            "DeletedRes": false,
            "CoeffStats": false,
            "NewDataSet": false,
            "DatasetName": null,
            "WriteNewDataSet": false,
            "FilePath": null
        },
        "options": {
            "DescStats": true,
            "EstEffectSize": true,
            "ObsPower": true,
            "ParamEst": true,
            "SscpMat": false,
            "ResSscpMat": false,
            "HomogenTest": true,
            "SprVsLevel": false,
            "ResPlot": false,
            "LackOfFit": false,
            "GeneralFun": false,
            "SigLevel": 0.05,
            "CoefficientMatrix": false,
            "TransformMat": false
        },
        "bootstrap": {
            "PerformBootStrapping": false,
            "NumOfSamples": 200,
            "Seed": true,
            "SeedValue": 200000,
            "Level": 95.0,
            "Percentile": true,
            "BCa": false,
            "Simple": true,
            "Stratified": false,
            "Variables": null,
            "StrataVariables": null
        }
    }))
    .expect("valid multivariate config")
}

fn build_analysis_data(
    records: Vec<DataRecord>,
    dep_vars: &[&str],
    factors: &[&str],
    covars: &[&str],
) -> AnalysisData {
    let dep_defs = dep_vars
        .iter()
        .enumerate()
        .map(|(idx, name)| numeric_def(name, idx))
        .collect::<Vec<_>>();

    let factor_defs = factors
        .iter()
        .enumerate()
        .map(|(idx, name)| vec![nominal_def(name, dep_vars.len() + idx)])
        .collect::<Vec<_>>();

    let covar_defs = if covars.is_empty() {
        None
    } else {
        Some(
            covars
                .iter()
                .enumerate()
                .map(|(idx, name)| vec![numeric_def(name, dep_vars.len() + factors.len() + idx)])
                .collect::<Vec<_>>(),
        )
    };

    AnalysisData {
        dependent_data: vec![records.clone()],
        fix_factor_data: (0..factors.len()).map(|_| records.clone()).collect(),
        covariate_data: if covars.is_empty() {
            None
        } else {
            Some((0..covars.len()).map(|_| records.clone()).collect())
        },
        wls_data: None,
        dependent_data_defs: vec![dep_defs],
        fix_factor_data_defs: factor_defs,
        covariate_data_defs: covar_defs,
        wls_data_defs: None,
    }
}

fn make_record(entries: &[(&str, DataValue)]) -> DataRecord {
    let mut values = HashMap::new();
    for (name, value) in entries {
        values.insert((*name).to_string(), value.clone());
    }
    DataRecord { values }
}

fn dataset_a() -> (AnalysisData, MultivariateConfig) {
    let dep_vars = ["Y1", "Y2"];
    let factors = ["Group"];
    let covars: [&str; 0] = [];

    let mut records = Vec::new();
    let noise_1 = [-1.2, -0.9, -0.6, -0.3, 0.0, 0.2, 0.5, 0.8, 1.1, 1.4];
    let noise_2 = [1.1, 0.8, 0.5, 0.2, 0.0, -0.1, -0.3, -0.6, -0.9, -1.2];
    let groups = ["A", "B", "C"];

    for (g_idx, group) in groups.iter().enumerate() {
        for i in 0..10 {
            let y1 = 10.0 + (g_idx as f64) * 4.0 + noise_1[i];
            let y2 = 20.0 + (g_idx as f64) * 3.0 + noise_2[i];

            records.push(
                make_record(&[
                    ("Group", DataValue::Text((*group).to_string())),
                    ("Y1", DataValue::Number(y1)),
                    ("Y2", DataValue::Number(y2)),
                ])
            );
        }
    }

    (
        build_analysis_data(records, &dep_vars, &factors, &covars),
        build_config(&dep_vars, &factors, &covars),
    )
}

fn dataset_b() -> (AnalysisData, MultivariateConfig) {
    let dep_vars = ["Y1", "Y2", "Y3"];
    let factors = ["Group", "Treatment"];
    let covars = ["Cov1"];

    let mut records = Vec::new();
    let groups = ["A", "B", "C"];
    let treatments = ["T1", "T2"];
    let noise = [-0.7, -0.5, -0.2, -0.1, 0.0, 0.2, 0.3, 0.5, 0.7, 0.9];

    for (g_idx, group) in groups.iter().enumerate() {
        for (t_idx, treatment) in treatments.iter().enumerate() {
            for i in 0..10 {
                let cov1 = 0.5 + (i as f64) * 0.3 + (g_idx as f64) * 0.2;
                let base = 12.0 + (g_idx as f64) * 2.2 + (t_idx as f64) * 1.7;

                let y1 = base + 0.5 * cov1 + noise[i];
                let y2 = (base * 1.25) - 0.4 * cov1 + noise[9 - i];
                let y3 = 6.0 + (g_idx as f64) * 1.6 - (t_idx as f64) * 1.1 + 0.8 * cov1 + noise[i] * 0.5;

                records.push(
                    make_record(&[
                        ("Group", DataValue::Text((*group).to_string())),
                        ("Treatment", DataValue::Text((*treatment).to_string())),
                        ("Cov1", DataValue::Number(cov1)),
                        ("Y1", DataValue::Number(y1)),
                        ("Y2", DataValue::Number(y2)),
                        ("Y3", DataValue::Number(y3)),
                    ])
                );
            }
        }
    }

    (
        build_analysis_data(records, &dep_vars, &factors, &covars),
        build_config(&dep_vars, &factors, &covars),
    )
}

fn dataset_c() -> (AnalysisData, MultivariateConfig) {
    let dep_vars = ["SepalLength", "SepalWidth"];
    let factors = ["Species"];
    let covars: [&str; 0] = [];

    let mut records = Vec::new();
    let counts = [("setosa", 8usize), ("versicolor", 11usize), ("virginica", 13usize)];

    for (group_idx, (species, n)) in counts.iter().enumerate() {
        for i in 0..*n {
            let phase = (i as f64) * 0.25;
            let sepal_length = 5.0 + (group_idx as f64) * 0.9 + (phase.sin() * 0.3) + (i as f64) * 0.03;
            let sepal_width = 3.4 - (group_idx as f64) * 0.25 + (phase.cos() * 0.2) - (i as f64) * 0.01;

            records.push(
                make_record(&[
                    ("Species", DataValue::Text((*species).to_string())),
                    ("SepalLength", DataValue::Number(sepal_length)),
                    ("SepalWidth", DataValue::Number(sepal_width)),
                ])
            );
        }
    }

    (
        build_analysis_data(records, &dep_vars, &factors, &covars),
        build_config(&dep_vars, &factors, &covars),
    )
}

fn assert_finite(v: f64, label: &str) {
    assert!(v.is_finite(), "{} should be finite, got {}", label, v);
}

#[test]
fn dataset_a_core_tables_are_computable() {
    let (data, config) = dataset_a();

    let box_test = calculate_box_test(&data, &config).expect("box test should compute");
    assert_finite(box_test.box_m, "box_m");
    assert!(box_test.df1 > 0, "df1 should be positive");

    let multivariate = calculate_multivariate_tests(&data, &config)
        .expect("multivariate tests should compute");
    assert!(!multivariate.effects.is_empty(), "multivariate effects should not be empty");
    assert!(multivariate.effects.contains_key("Group"), "Group multivariate effect should exist");

    let between = calculate_tests_between_subjects_effects(&data, &config)
        .expect("between-subjects effects should compute");
    assert!(between.effects.contains_key("Y1"), "Y1 effects should exist");
    assert!(between.effects.contains_key("Y2"), "Y2 effects should exist");

    let y1_group = between.effects
        .get("Y1")
        .and_then(|m| m.get("Group"))
        .expect("Y1 Group effect should exist");
    assert!((y1_group.df as i32) == 2, "Y1 Group df should be 2");
    assert!(y1_group.f_value > 100.0, "Y1 Group F should be strongly significant");

    let params = calculate_parameter_estimates(&data, &config)
        .expect("parameter estimates should compute");
    assert!(params.estimates.contains_key("Y1"), "Y1 parameters should exist");
    assert!(params.estimates.contains_key("Y2"), "Y2 parameters should exist");
    assert_eq!(box_test.df1, 6);
    assert!(box_test.f >= 0.0, "Box F should be non-negative");
}

#[test]
fn dataset_b_core_tables_are_computable() {
    let (data, config) = dataset_b();

    let box_test = calculate_box_test(&data, &config).expect("box test should compute");
    assert_finite(box_test.box_m, "box_m");
    assert_finite(box_test.f, "box_f");

    let multivariate = calculate_multivariate_tests(&data, &config)
        .expect("multivariate tests should compute");
    assert!(!multivariate.effects.is_empty(), "multivariate effects should not be empty");
    assert!(multivariate.effects.contains_key("Group"), "Group multivariate effect should exist");
    assert!(multivariate.effects.contains_key("Treatment"), "Treatment multivariate effect should exist");
    assert!(multivariate.effects.contains_key("Group*Treatment"), "Interaction multivariate effect should exist");

    let between = calculate_tests_between_subjects_effects(&data, &config)
        .expect("between-subjects effects should compute");
    assert!(between.effects.contains_key("Y1"), "Y1 effects should exist");
    assert!(between.effects.contains_key("Y2"), "Y2 effects should exist");
    assert!(between.effects.contains_key("Y3"), "Y3 effects should exist");

    let params = calculate_parameter_estimates(&data, &config)
        .expect("parameter estimates should compute");
    assert!(params.estimates.contains_key("Y1"), "Y1 parameters should exist");
    assert!(params.estimates.contains_key("Y2"), "Y2 parameters should exist");
    assert!(params.estimates.contains_key("Y3"), "Y3 parameters should exist");

    let y3_group = between.effects
        .get("Y3")
        .and_then(|m| m.get("Group"))
        .expect("Y3 Group effect should exist");
    assert!((y3_group.df as i32) == 2, "Y3 Group df should be 2");
    assert!(box_test.df1 == 30, "Dataset B Box df1 should be 30");
    assert!(box_test.f >= 0.0, "Box F should be non-negative");
}

#[test]
fn dataset_c_core_tables_are_computable() {
    let (data, config) = dataset_c();

    let box_test = calculate_box_test(&data, &config).expect("box test should compute");
    assert_finite(box_test.box_m, "box_m");

    let multivariate = calculate_multivariate_tests(&data, &config)
        .expect("multivariate tests should compute");
    assert!(!multivariate.effects.is_empty(), "multivariate effects should not be empty");
    assert!(multivariate.effects.contains_key("Species"), "Species multivariate effect should exist");

    let between = calculate_tests_between_subjects_effects(&data, &config)
        .expect("between-subjects effects should compute");
    assert!(between.effects.contains_key("SepalLength"), "SepalLength effects should exist");
    assert!(between.effects.contains_key("SepalWidth"), "SepalWidth effects should exist");

    let params = calculate_parameter_estimates(&data, &config)
        .expect("parameter estimates should compute");
    assert!(params.estimates.contains_key("SepalLength"), "SepalLength parameters should exist");
    assert!(params.estimates.contains_key("SepalWidth"), "SepalWidth parameters should exist");
    assert_eq!(box_test.df1, 6);
    assert!(box_test.f > 0.0, "Box F should be positive for dataset C");
}

#[test]
fn multivariate_performance_dataset_b_under_five_seconds() {
    use std::time::Instant;

    let (data, config) = dataset_b();
    let start = Instant::now();

    let _ = calculate_multivariate_tests(&data, &config).expect("multivariate tests should compute");
    let _ = calculate_tests_between_subjects_effects(&data, &config)
        .expect("between-subjects effects should compute");

    let elapsed = start.elapsed();
    assert!(
        elapsed.as_secs_f64() < 5.0,
        "Performance threshold exceeded: {:?}",
        elapsed
    );
}
