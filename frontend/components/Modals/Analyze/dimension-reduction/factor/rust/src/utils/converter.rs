use wasm_bindgen::JsValue;
use serde::Serialize;

use crate::models::result::{
    ComponentScoreCovarianceMatrix,
    ComponentTransformationMatrix,
    DescriptiveStatistic,
    FactorAnalysisResult,
    KMOBartlettsTest,
    ScreePlot,
    TotalVarianceExplained,
};

pub fn string_to_js_error(error: String) -> JsValue {
    JsValue::from_str(&error)
}

pub fn format_result(result: &Option<FactorAnalysisResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => {
            let formatted = FormatResult::from_analysis_result(result);
            Ok(serde_wasm_bindgen::to_value(&formatted).unwrap())
        }
        None => Err(JsValue::from_str("No analysis results available")),
    }
}

#[derive(Serialize)]
struct FormatResult {
    descriptive_statistics: Option<Vec<DescriptiveStatistic>>,
    scree_plot: Option<ScreePlot>,
    correlation_matrix: Option<FormattedCorrelation>,
    inverse_correlation_matrix: Option<FormattedInverseCorrelation>,
    kmo_bartletts_test: Option<KMOBartlettsTest>,
    anti_image_matrices: Option<FormattedAntiImage>,
    communalities: Option<FormattedCommunalities>,
    total_variance_explained: Option<TotalVarianceExplained>,
    component_matrix: Option<FormattedComponentMatrix>,
    reproduced_correlations: Option<FormattedReproducedCorrelations>,
    rotated_component_matrix: Option<FormattedRotatedComponentMatrix>,
    component_transformation_matrix: Option<ComponentTransformationMatrix>,
    component_score_coefficient_matrix: Option<FormattedComponentScoreCoefficient>,
    component_score_covariance_matrix: Option<ComponentScoreCovarianceMatrix>,
}

#[derive(Serialize)]
struct FormattedCorrelation {
    correlations: Vec<CorrelationEntry>,
    sig_values: Vec<CorrelationEntry>,
}

#[derive(Serialize)]
struct CorrelationEntry {
    variable: String,
    values: Vec<VariableValue>,
}

#[derive(Serialize)]
struct VariableValue {
    variable: String,
    value: f64,
}

#[derive(Serialize)]
struct FormattedInverseCorrelation {
    inverse_correlations: Vec<CorrelationEntry>,
}

#[derive(Serialize)]
struct FormattedAntiImage {
    anti_image_covariance: Vec<CorrelationEntry>,
    anti_image_correlation: Vec<CorrelationEntry>,
}

#[derive(Serialize)]
struct FormattedCommunalities {
    initial: Vec<VariableValue>,
    extraction: Vec<VariableValue>,
}

#[derive(Serialize)]
struct FormattedComponentMatrix {
    components: Vec<ComponentEntry>,
}

#[derive(Serialize)]
struct ComponentEntry {
    variable: String,
    values: Vec<f64>,
}

#[derive(Serialize)]
struct FormattedReproducedCorrelations {
    reproduced_correlation: Vec<CorrelationEntry>,
    residual: Vec<CorrelationEntry>,
}

#[derive(Serialize)]
struct FormattedRotatedComponentMatrix {
    components: Vec<ComponentEntry>,
}

#[derive(Serialize)]
struct FormattedComponentScoreCoefficient {
    components: Vec<ComponentEntry>,
}

impl FormatResult {
    fn from_analysis_result(result: &FactorAnalysisResult) -> Self {
        let correlation_matrix = result.correlation_matrix.as_ref().map(|matrix| {
            let correlations = matrix.correlations
                .iter()
                .map(|(var_name, values)| {
                    CorrelationEntry {
                        variable: var_name.clone(),
                        values: values
                            .iter()
                            .map(|(other_var, value)| {
                                VariableValue {
                                    variable: other_var.clone(),
                                    value: *value,
                                }
                            })
                            .collect(),
                    }
                })
                .collect();

            let sig_values = matrix.sig_values
                .iter()
                .map(|(var_name, values)| {
                    CorrelationEntry {
                        variable: var_name.clone(),
                        values: values
                            .iter()
                            .map(|(other_var, value)| {
                                VariableValue {
                                    variable: other_var.clone(),
                                    value: *value,
                                }
                            })
                            .collect(),
                    }
                })
                .collect();

            FormattedCorrelation {
                correlations,
                sig_values,
            }
        });

        let inverse_correlation_matrix = result.inverse_correlation_matrix.as_ref().map(|matrix| {
            let inverse_correlations = matrix.inverse_correlations
                .iter()
                .map(|(var_name, values)| {
                    CorrelationEntry {
                        variable: var_name.clone(),
                        values: values
                            .iter()
                            .map(|(other_var, value)| {
                                VariableValue {
                                    variable: other_var.clone(),
                                    value: *value,
                                }
                            })
                            .collect(),
                    }
                })
                .collect();

            FormattedInverseCorrelation {
                inverse_correlations,
            }
        });

        let anti_image_matrices = result.anti_image_matrices.as_ref().map(|matrices| {
            let anti_image_covariance = matrices.anti_image_covariance
                .iter()
                .map(|(var_name, values)| {
                    CorrelationEntry {
                        variable: var_name.clone(),
                        values: values
                            .iter()
                            .map(|(other_var, value)| {
                                VariableValue {
                                    variable: other_var.clone(),
                                    value: *value,
                                }
                            })
                            .collect(),
                    }
                })
                .collect();

            let anti_image_correlation = matrices.anti_image_correlation
                .iter()
                .map(|(var_name, values)| {
                    CorrelationEntry {
                        variable: var_name.clone(),
                        values: values
                            .iter()
                            .map(|(other_var, value)| {
                                VariableValue {
                                    variable: other_var.clone(),
                                    value: *value,
                                }
                            })
                            .collect(),
                    }
                })
                .collect();

            FormattedAntiImage {
                anti_image_covariance,
                anti_image_correlation,
            }
        });

        let communalities = result.communalities.as_ref().map(|comm| {
            let initial = comm.initial
                .iter()
                .map(|(var_name, value)| {
                    VariableValue {
                        variable: var_name.clone(),
                        value: *value,
                    }
                })
                .collect();

            let extraction = comm.extraction
                .iter()
                .map(|(var_name, value)| {
                    VariableValue {
                        variable: var_name.clone(),
                        value: *value,
                    }
                })
                .collect();

            FormattedCommunalities {
                initial,
                extraction,
            }
        });

        let component_matrix = result.component_matrix.as_ref().map(|matrix| {
            let components = matrix.components
                .iter()
                .map(|(var_name, values)| {
                    ComponentEntry {
                        variable: var_name.clone(),
                        values: values.clone(),
                    }
                })
                .collect();

            FormattedComponentMatrix {
                components,
            }
        });

        let reproduced_correlations = result.reproduced_correlations.as_ref().map(|corr| {
            let reproduced_correlation = corr.reproduced_correlation
                .iter()
                .map(|(var_name, values)| {
                    CorrelationEntry {
                        variable: var_name.clone(),
                        values: values
                            .iter()
                            .map(|(other_var, value)| {
                                VariableValue {
                                    variable: other_var.clone(),
                                    value: *value,
                                }
                            })
                            .collect(),
                    }
                })
                .collect();

            let residual = corr.residual
                .iter()
                .map(|(var_name, values)| {
                    CorrelationEntry {
                        variable: var_name.clone(),
                        values: values
                            .iter()
                            .map(|(other_var, value)| {
                                VariableValue {
                                    variable: other_var.clone(),
                                    value: *value,
                                }
                            })
                            .collect(),
                    }
                })
                .collect();

            FormattedReproducedCorrelations {
                reproduced_correlation,
                residual,
            }
        });

        let rotated_component_matrix = result.rotated_component_matrix.as_ref().map(|matrix| {
            let components = matrix.components
                .iter()
                .map(|(var_name, values)| {
                    ComponentEntry {
                        variable: var_name.clone(),
                        values: values.clone(),
                    }
                })
                .collect();

            FormattedRotatedComponentMatrix {
                components,
            }
        });

        let component_score_coefficient_matrix = result.component_score_coefficient_matrix
            .as_ref()
            .map(|matrix| {
                let components = matrix.components
                    .iter()
                    .map(|(var_name, values)| {
                        ComponentEntry {
                            variable: var_name.clone(),
                            values: values.clone(),
                        }
                    })
                    .collect();

                FormattedComponentScoreCoefficient {
                    components,
                }
            });

        FormatResult {
            descriptive_statistics: result.descriptive_statistics.clone(),
            scree_plot: result.scree_plot.clone(),
            correlation_matrix,
            inverse_correlation_matrix,
            kmo_bartletts_test: result.kmo_bartletts_test.clone(),
            anti_image_matrices,
            communalities,
            total_variance_explained: result.total_variance_explained.clone(),
            component_matrix,
            reproduced_correlations,
            rotated_component_matrix,
            component_transformation_matrix: result.component_transformation_matrix.clone(),
            component_score_coefficient_matrix,
            component_score_covariance_matrix: result.component_score_covariance_matrix.clone(),
        }
    }
}
