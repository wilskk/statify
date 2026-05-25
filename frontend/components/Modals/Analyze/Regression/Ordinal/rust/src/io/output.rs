use crate::optimizer::fit_location_only;
use crate::parallel::fit_non_parallel_location_only;
use crate::statistics::{
    actual_probabilities, correlation_matrix, covariance_matrix, displayed_log_likelihood,
    goodness_of_fit, model_fit_statistics, multinomial_log_likelihood_constant,
    parameter_statistics, predicted_cell_counts, predicted_categories, predicted_probabilities,
    LOG_LIKELIHOOD_MODE_KERNEL, LOG_LIKELIHOOD_MODE_SPSS,
};
use crate::types::{
    EstimationOptions, FitResult, IterationHistoryMeta, IterationHistoryOptions, ModelType,
    PlumError, PlumFitOutput, PlumOutputMetadata, PlumOutputOptions, PlumSpec, PlumWorkerPayload,
};
use crate::validation::validate_input;

pub fn build_plum_output(
    input: &PlumWorkerPayload,
    data: &crate::types::AggregatedData,
    spec: &PlumSpec,
    fit: &FitResult,
) -> Result<PlumFitOutput, PlumError> {
    let output_options: Option<PlumOutputOptions> =
        serde_json::from_value(input.output_options.clone()).ok();
    let default_all = output_options.is_none();

    let want_goodness = output_options
        .as_ref()
        .and_then(|opt| opt.goodness_of_fit)
        .unwrap_or(default_all);
    let want_summary = output_options
        .as_ref()
        .and_then(|opt| opt.summary_statistics)
        .unwrap_or(default_all);
    let want_iteration = output_options
        .as_ref()
        .and_then(|opt| opt.print_iteration_history.or(opt.iteration_history))
        .unwrap_or(default_all);
    let want_cell_info = output_options
        .as_ref()
        .and_then(|opt| opt.cell_information)
        .unwrap_or(false);
    let want_predicted_prob = output_options
        .as_ref()
        .and_then(|opt| opt.predicted_probability)
        .unwrap_or(false);
    let want_actual_prob = output_options
        .as_ref()
        .and_then(|opt| opt.actual_probability)
        .unwrap_or(false);
    let want_parameters = output_options
        .as_ref()
        .and_then(|opt| opt.parameter_estimates)
        .unwrap_or(default_all);
    let want_covariance = output_options
        .as_ref()
        .and_then(|opt| opt.asymptotic_correlation)
        .unwrap_or(default_all)
        || want_parameters;
    let want_correlation = want_covariance;
    let want_parallel = output_options
        .as_ref()
        .and_then(|opt| opt.test_of_parallel_lines)
        .unwrap_or(false);
    let iteration_history_every = output_options
        .as_ref()
        .and_then(|opt| opt.iteration_history_every.or(opt.iteration_history_step))
        .unwrap_or(1)
        .max(1);

    let mut warnings = fit.warnings.clone();
    let validation = validate_input(input);
    warnings.extend(validation.warnings);

    let mut covariance = None;
    if let Some(info) = &fit.information {
        if want_covariance || want_correlation || output_options.is_none() {
            if let Ok(matrix) = covariance_matrix(info) {
                covariance = Some(matrix);
            } else {
                warnings.push("Covariance matrix gagal dihitung".to_string());
            }
        }
    }

    let mut correlation = None;
    if let Some(cov) = &covariance {
        if want_correlation {
            correlation = Some(correlation_matrix(cov));
        }
    }

    let mut fit_with_cov = fit.clone();
    fit_with_cov.covariance = covariance.clone();
    fit_with_cov.correlation = correlation.clone();

    let alpha = EstimationOptions::from_payload(Some(&input.estimation_options)).alpha;
    let (parameter_estimates, mut param_warn) = parameter_statistics(&fit_with_cov, spec, alpha);
    warnings.append(&mut param_warn);

    let threshold_estimates: Vec<_> = parameter_estimates
        .iter()
        .filter(|row| row.group == "Threshold")
        .cloned()
        .collect();
    let location_parameter_estimates: Vec<_> = parameter_estimates
        .iter()
        .filter(|row| row.group == "Location")
        .cloned()
        .collect();
    let scale_parameter_estimates: Vec<_> = parameter_estimates
        .iter()
        .filter(|row| row.group == "Scale")
        .cloned()
        .collect();

    let goodness = if want_goodness {
        let (gof, mut gof_warn) = goodness_of_fit(&fit_with_cov, data, spec);
        warnings.append(&mut gof_warn);
        Some(gof)
    } else {
        None
    };

    let display_mode = output_options
        .as_ref()
        .and_then(|opt| opt.print_log_likelihood.as_deref())
        .map(|value| match value {
            "Including" | "SPSS_COMPATIBLE" => LOG_LIKELIHOOD_MODE_SPSS,
            "Excluding" | "KERNEL" => LOG_LIKELIHOOD_MODE_KERNEL,
            _ => LOG_LIKELIHOOD_MODE_KERNEL,
        })
        .unwrap_or(LOG_LIKELIHOOD_MODE_KERNEL);

    let log_likelihood_constant = multinomial_log_likelihood_constant(data);
    let log_likelihood_kernel = fit.log_likelihood;
    let log_likelihood_complete = log_likelihood_kernel + log_likelihood_constant;
    let log_likelihood_displayed =
        displayed_log_likelihood(log_likelihood_kernel, log_likelihood_constant, display_mode);
    let minus2_log_likelihood_displayed = -2.0 * log_likelihood_displayed;

    let summary = if want_summary {
        let intercept_spec = intercept_only_spec(spec);
        let options = EstimationOptions::from_payload(Some(&input.estimation_options));
        let history_off = IterationHistoryOptions::disabled();
        let intercept_fit = fit_location_only(data, &intercept_spec, &options, &history_off)?;
        Some(model_fit_statistics(
            &fit_with_cov,
            &intercept_fit,
            spec,
            &options.method_label(),
            data.total_count,
            log_likelihood_constant,
            display_mode,
        ))
    } else {
        None
    };

    let iteration_history = if want_iteration {
        Some(fit.iteration_history.clone())
    } else {
        None
    };
    let iteration_history_meta = if want_iteration {
        let threshold_names = (0..spec.threshold_count())
            .map(|index| format!("{}", index + 1))
            .collect::<Vec<_>>();
        let location_names = spec.feature_names.clone();
        let scale_names = spec.scale_feature_names.clone();
        Some(IterationHistoryMeta {
            link_function: input.estimation_options.link_function.clone(),
            iteration_history_every,
            threshold_names,
            location_names,
            scale_names,
            last_abs_change_minus2_log_likelihood: fit.last_abs_change_minus2_log_likelihood,
            last_max_abs_change_parameters: fit.last_max_abs_change_parameters,
            converged: fit.converged,
        })
    } else {
        None
    };

    let cell_information = if want_cell_info {
        Some(predicted_cell_counts(&fit_with_cov, data, spec))
    } else {
        None
    };

    let predicted_probability = if want_predicted_prob {
        Some(predicted_probabilities(&fit_with_cov, data, spec))
    } else {
        None
    };

    let actual_probability = if want_actual_prob {
        Some(actual_probabilities(data, spec))
    } else {
        None
    };

    let predicted_category = if want_predicted_prob {
        Some(predicted_categories(&fit_with_cov, data, spec))
    } else {
        None
    };

    let test_of_parallel_lines = if want_parallel && spec.model_type == ModelType::LocationOnly {
        let options = EstimationOptions::from_payload(Some(&input.estimation_options));
        match fit_non_parallel_location_only(data, spec, &options) {
            Ok(non_parallel_fit) => {
                let test = crate::parallel::test_parallel_lines(
                    fit,
                    &non_parallel_fit,
                    spec.location_parameter_count(),
                    spec.category_count,
                );
                Some(test)
            }
            Err(err) => {
                warnings.push(format!("Parallel lines test gagal: {err}"));
                None
            }
        }
    } else {
        None
    };

    let metadata = PlumOutputMetadata {
        model_type: input.metadata.model_type.clone(),
        total_rows: input.metadata.total_rows,
        valid_rows: input.metadata.valid_rows,
        dropped_rows: input.metadata.dropped_rows,
        response_category_count: input.metadata.response_category_count,
        location_parameter_count: input.metadata.location_parameter_count,
        scale_parameter_count: input.metadata.scale_parameter_count,
    };

    Ok(PlumFitOutput {
        converged: fit.converged,
        iterations: fit.iterations,
        log_likelihood: log_likelihood_displayed,
        minus2_log_likelihood: minus2_log_likelihood_displayed,
        log_likelihood_kernel,
        log_likelihood_complete,
        log_likelihood_displayed,
        minus2_log_likelihood_displayed,
        log_likelihood_display_mode: display_mode.to_string(),
        parameter_estimates,
        threshold_estimates,
        location_parameter_estimates,
        scale_parameter_estimates,
        iteration_history: iteration_history.unwrap_or_else(|| Vec::new()),
        iteration_history_meta,
        warnings,
        metadata,
        goodness_of_fit: goodness,
        summary_statistics: summary,
        test_of_parallel_lines,
        cell_information,
        predicted_category,
        predicted_probability,
        actual_probability,
        covariance_matrix: covariance.map(|m| matrix_to_vec(&m)),
        correlation_matrix: correlation.map(|m| matrix_to_vec(&m)),
        errors: Vec::new(),
    })
}

fn intercept_only_spec(spec: &PlumSpec) -> PlumSpec {
    let mut intercept = spec.clone();
    intercept.model_type = ModelType::LocationOnly;
    intercept.feature_names = Vec::new();
    intercept.location_variables = Vec::new();
    intercept
}

fn matrix_to_vec(matrix: &nalgebra::DMatrix<f64>) -> Vec<Vec<f64>> {
    let mut rows = Vec::with_capacity(matrix.nrows());
    for i in 0..matrix.nrows() {
        let mut row = Vec::with_capacity(matrix.ncols());
        for j in 0..matrix.ncols() {
            row.push(matrix[(i, j)]);
        }
        rows.push(row);
    }
    rows
}
