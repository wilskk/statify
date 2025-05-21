use wasm_bindgen::JsValue;
use serde::Serialize;
use std::collections::HashMap;

use crate::univariate::models::result::{
    ContrastCoefficients,
    GeneralEstimableFunction,
    HeteroscedasticityTests,
    LackOfFitTests,
    LeveneTest,
    ParameterEstimateEntry,
    ParameterEstimates,
    PlotData,
    SavedVariables,
    SpreadVsLevelPoint,
    StatsEntry,
    TestEffectEntry,
    UnivariateResult,
};

pub fn string_to_js_error(error: String) -> JsValue {
    JsValue::from_str(&error)
}

pub fn format_result(result: &Option<UnivariateResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => {
            let formatted = FormatResult::from_univariate_result(result);
            Ok(serde_wasm_bindgen::to_value(&formatted).unwrap())
        }
        None => Err(JsValue::from_str("No univariate analysis results available")),
    }
}

#[derive(Serialize)]
struct FormatResult {
    between_subjects_factors: Option<Vec<FormattedBetweenSubjectFactor>>,
    descriptive_statistics: Option<Vec<FormattedDescriptiveStatistic>>,
    levene_test: Option<Vec<LeveneTest>>,
    heteroscedasticity_tests: Option<HeteroscedasticityTests>,
    tests_of_between_subjects_effects: Option<FormattedTestsBetweenSubjectsEffects>,
    parameter_estimates: Option<ParameterEstimates>,
    general_estimable_function: Option<GeneralEstimableFunction>,
    contrast_coefficients: Option<ContrastCoefficients>,
    lack_of_fit_tests: Option<LackOfFitTests>,
    spread_vs_level_plots: Option<FormattedSpreadVsLevelPlots>,
    posthoc_tests: Option<Vec<FormattedPosthocTest>>,
    emmeans: Option<Vec<FormattedEmmean>>,
    robust_parameter_estimates: Option<ParameterEstimates>,
    plots: Option<Vec<FormattedPlot>>,
    saved_variables: Option<SavedVariables>,
}

#[derive(Serialize)]
struct FormattedBetweenSubjectFactor {
    name: String,
    factors: Vec<FactorEntry>,
}

#[derive(Serialize)]
struct FactorEntry {
    name: String,
    value: usize,
}

#[derive(Serialize)]
struct FormattedDescriptiveStatistic {
    dependent_variable: String,
    flat_entries: HashMap<String, StatsEntry>,
    factor_names: Vec<String>,
}

#[derive(Serialize)]
struct FormattedTestsBetweenSubjectsEffects {
    sources: Vec<SourceEntry>,
    r_squared: f64,
    adjusted_r_squared: f64,
}

#[derive(Serialize)]
struct SourceEntry {
    name: String,
    effect: TestEffectEntry,
}

#[derive(Serialize)]
struct FormattedSpreadVsLevelPlots {
    points: Vec<SpreadVsLevelPoint>,
}

#[derive(Serialize)]
struct FormattedPosthocTest {
    name: String,
    entries: Vec<ParameterEstimateEntry>,
}

#[derive(Serialize)]
struct FormattedEmmean {
    name: String,
    entries: Vec<ParameterEstimateEntry>,
}

#[derive(Serialize)]
struct FormattedPlot {
    name: String,
    plot_data: PlotData,
}

impl FormatResult {
    fn from_univariate_result(result: &UnivariateResult) -> Self {
        let between_subjects_factors = result.between_subjects_factors.as_ref().map(|factors| {
            factors
                .iter()
                .map(|(name, bsf)| {
                    FormattedBetweenSubjectFactor {
                        name: name.clone(),
                        factors: bsf.factors
                            .iter()
                            .map(|(factor_name, value)| {
                                FactorEntry {
                                    name: factor_name.clone(),
                                    value: *value,
                                }
                            })
                            .collect(),
                    }
                })
                .collect()
        });

        let descriptive_statistics = result.descriptive_statistics.as_ref().map(|stats| {
            stats
                .iter()
                .map(|(_, stat)| {
                    FormattedDescriptiveStatistic {
                        dependent_variable: stat.dependent_variable.clone(),
                        flat_entries: stat.stats_entries.clone(),
                        factor_names: stat.factor_names.clone(),
                    }
                })
                .collect()
        });

        let tests_of_between_subjects_effects = result.tests_of_between_subjects_effects
            .as_ref()
            .map(|tests| {
                let sources = tests.source
                    .iter()
                    .map(|(name, effect)| {
                        SourceEntry {
                            name: name.clone(),
                            effect: effect.clone(),
                        }
                    })
                    .collect();

                FormattedTestsBetweenSubjectsEffects {
                    sources,
                    r_squared: tests.r_squared,
                    adjusted_r_squared: tests.adjusted_r_squared,
                }
            });

        let spread_vs_level_plots = result.spread_vs_level_plots.as_ref().map(|plots| {
            FormattedSpreadVsLevelPlots {
                points: plots.points.clone(),
            }
        });

        let posthoc_tests = result.posthoc_tests.as_ref().map(|tests| {
            tests
                .iter()
                .map(|(name, entries)| {
                    FormattedPosthocTest {
                        name: name.clone(),
                        entries: entries.clone(),
                    }
                })
                .collect()
        });

        let emmeans = result.emmeans.as_ref().map(|means| {
            means
                .iter()
                .map(|(name, entries)| {
                    FormattedEmmean {
                        name: name.clone(),
                        entries: entries.clone(),
                    }
                })
                .collect()
        });

        let plots = result.plots.as_ref().map(|plots| {
            plots
                .iter()
                .map(|(name, plot_data)| {
                    FormattedPlot {
                        name: name.clone(),
                        plot_data: plot_data.clone(),
                    }
                })
                .collect()
        });

        FormatResult {
            between_subjects_factors,
            descriptive_statistics,
            levene_test: result.levene_test.clone(),
            heteroscedasticity_tests: result.heteroscedasticity_tests.clone(),
            tests_of_between_subjects_effects,
            parameter_estimates: result.parameter_estimates.clone(),
            general_estimable_function: result.general_estimable_function.clone(),
            contrast_coefficients: result.contrast_coefficients.clone(),
            lack_of_fit_tests: result.lack_of_fit_tests.clone(),
            spread_vs_level_plots,
            posthoc_tests,
            emmeans,
            robust_parameter_estimates: result.robust_parameter_estimates.clone(),
            plots,
            saved_variables: result.saved_variables.clone(),
        }
    }
}
