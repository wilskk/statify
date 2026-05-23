use nalgebra::{DMatrix, DVector};

use crate::derivatives::{expected_information, gradient, hessian};
use crate::likelihood::log_likelihood;
use crate::types::{
    EstimationMethod, EstimationOptions, FitResult, IterationHistoryRow, IterationState,
    PlumError, PlumParameters, PlumSpec, ScaleType, StepResult,
};
use crate::utils::{clamp_prob, max_abs, max_abs_vector};

pub fn fit_plum(
    data: &crate::types::AggregatedData,
    spec: &PlumSpec,
    options: &EstimationOptions,
) -> Result<FitResult, PlumError> {
    if spec.is_location_only() {
        fit_location_only(data, spec, options)
    } else {
        fit_general(data, spec, options)
    }
}

pub fn fit_location_only(
    data: &crate::types::AggregatedData,
    spec: &PlumSpec,
    options: &EstimationOptions,
) -> Result<FitResult, PlumError> {
    let mut params = starting_values_location_only(data, spec);
    let mut history = Vec::new();
    let warnings = Vec::new();
    let mut converged = false;
    let mut info_matrix: Option<DMatrix<f64>> = None;

    let mut prev_state = None;

    for iter in 0..options.max_iterations {
        let ll = log_likelihood(&params, data, spec);
        let grad = gradient(&params, data, spec);

        let information = match options.method {
            EstimationMethod::FisherScoring => expected_information(&params, data, spec),
            EstimationMethod::NewtonRaphson => -hessian(&params, data, spec),
        };

        info_matrix = Some(information.clone());

        let delta = solve_linear_system(&information, &grad)
            .ok_or_else(|| PlumError::OptimizationError("Matrix singular".to_string()))?;

        let step_result = step_halving(
            &params,
            &delta,
            ll,
            data,
            spec,
            options,
        );

        params = step_result.params.clone();

        history.push(IterationHistoryRow {
            iteration: iter + 1,
            log_likelihood: step_result.log_likelihood,
            minus2_log_likelihood: -2.0 * step_result.log_likelihood,
            step: step_result.step,
            max_abs_gradient: max_abs_vector(&grad),
            max_abs_delta: max_abs(step_result.delta.as_slice()),
            threshold_adjustments: step_result.threshold_adjustments,
        });

        let next_state = IterationState {
            log_likelihood: step_result.log_likelihood,
            params: params.clone(),
            gradient: grad.clone(),
        };

        if let Some(prev) = &prev_state {
            if has_converged(prev, &next_state, options) {
                converged = true;
                break;
            }
        }
        prev_state = Some(next_state);
    }

    let final_ll = log_likelihood(&params, data, spec);

    Ok(FitResult {
        params,
        information: info_matrix,
        covariance: None,
        correlation: None,
        log_likelihood: final_ll,
        minus2_log_likelihood: -2.0 * final_ll,
        converged,
        iterations: history.len(),
        iteration_history: history,
        warnings,
    })
}

pub fn fit_general(
    data: &crate::types::AggregatedData,
    spec: &PlumSpec,
    options: &EstimationOptions,
) -> Result<FitResult, PlumError> {
    let location_spec = spec.as_location_only();
    let location_fit = fit_location_only(data, &location_spec, options)?;
    let mut params = starting_values_general(&location_fit, spec);

    let mut history = Vec::new();
    let warnings = Vec::new();
    let mut converged = false;
    let mut info_matrix: Option<DMatrix<f64>> = None;
    let mut prev_state = None;

    for iter in 0..options.max_iterations {
        let ll = log_likelihood(&params, data, spec);
        let grad = gradient(&params, data, spec);

        let information = match options.method {
            EstimationMethod::FisherScoring => expected_information(&params, data, spec),
            EstimationMethod::NewtonRaphson => -hessian(&params, data, spec),
        };

        info_matrix = Some(information.clone());

        let delta = solve_linear_system(&information, &grad)
            .ok_or_else(|| PlumError::OptimizationError("Matrix singular".to_string()))?;

        let step_result = step_halving(&params, &delta, ll, data, spec, options);

        params = step_result.params.clone();

        history.push(IterationHistoryRow {
            iteration: iter + 1,
            log_likelihood: step_result.log_likelihood,
            minus2_log_likelihood: -2.0 * step_result.log_likelihood,
            step: step_result.step,
            max_abs_gradient: max_abs_vector(&grad),
            max_abs_delta: max_abs(step_result.delta.as_slice()),
            threshold_adjustments: step_result.threshold_adjustments,
        });

        let next_state = IterationState {
            log_likelihood: step_result.log_likelihood,
            params: params.clone(),
            gradient: grad.clone(),
        };

        if let Some(prev) = &prev_state {
            if has_converged(prev, &next_state, options) {
                converged = true;
                break;
            }
        }
        prev_state = Some(next_state);
    }

    let final_ll = log_likelihood(&params, data, spec);

    Ok(FitResult {
        params,
        information: info_matrix,
        covariance: None,
        correlation: None,
        log_likelihood: final_ll,
        minus2_log_likelihood: -2.0 * final_ll,
        converged,
        iterations: history.len(),
        iteration_history: history,
        warnings,
    })
}

pub fn starting_values_location_only(
    data: &crate::types::AggregatedData,
    spec: &PlumSpec,
) -> PlumParameters {
    let mut theta = Vec::with_capacity(spec.threshold_count());
    let mut cumulative = vec![0.0; spec.threshold_count()];
    let mut running = 0.0;
    for j in 0..spec.threshold_count() {
        let mut total = 0.0;
        for subpop in &data.subpopulations {
            total += subpop.counts[j];
        }
        running += total;
        cumulative[j] = running / data.total_count.max(1.0);
    }

    for value in cumulative {
        let value = clamp_prob(value);
        theta.push(crate::links::link(value, spec.link_function));
    }

    PlumParameters {
        theta,
        beta: vec![0.0; spec.location_parameter_count()],
        tau: Vec::new(),
    }
}

pub fn starting_values_general(location_fit: &FitResult, spec: &PlumSpec) -> PlumParameters {
    let mut params = location_fit.params.clone();
    if spec.scale_type == ScaleType::NonConstant {
        params.tau = vec![0.0; spec.scale_parameter_count()];
    }
    params
}

pub fn apply_threshold_monotonicity_adjustment(params: &mut PlumParameters) -> usize {
    let mut adjustments = 0;
    for j in 1..params.theta.len() {
        if params.theta[j] <= params.theta[j - 1] {
            params.theta[j] = params.theta[j - 1] + 1e-6;
            adjustments += 1;
        }
    }
    adjustments
}

pub fn step_halving(
    current_params: &PlumParameters,
    delta: &DVector<f64>,
    current_ll: f64,
    data: &crate::types::AggregatedData,
    spec: &PlumSpec,
    options: &EstimationOptions,
) -> StepResult {
    let mut step = 1.0;
    let mut best_params = current_params.clone();
    let mut best_ll = current_ll;
    let mut best_delta = delta.clone();
    let mut best_adjustments = 0;

    for _ in 0..options.max_step_halving {
        let candidate = current_params.to_vector(spec) + delta * step;
        let mut params = PlumParameters::from_vector(&candidate, spec);
        let adjustments = apply_threshold_monotonicity_adjustment(&mut params);
        let ll = log_likelihood(&params, data, spec);
        if ll.is_finite() && ll >= best_ll {
            best_params = params;
            best_ll = ll;
            best_delta = delta.clone() * step;
            best_adjustments = adjustments;
            break;
        }
        step *= 0.5;
    }

    StepResult {
        params: best_params,
        log_likelihood: best_ll,
        step,
        threshold_adjustments: best_adjustments,
        delta: best_delta,
    }
}

pub fn has_converged(
    prev: &IterationState,
    next: &IterationState,
    options: &EstimationOptions,
) -> bool {
    let ll_diff = (next.log_likelihood - prev.log_likelihood).abs();
    let grad_max = max_abs_vector(&next.gradient);
    let delta_max = max_parameter_delta(&prev.params, &next.params);
    ll_diff < options.convergence_tolerance
        || grad_max < options.gradient_tolerance
        || delta_max < options.parameter_tolerance
}

fn max_parameter_delta(prev: &PlumParameters, next: &PlumParameters) -> f64 {
    let mut max_delta: f64 = 0.0;
    for (a, b) in prev.theta.iter().zip(next.theta.iter()) {
        max_delta = max_delta.max((a - b).abs());
    }
    for (a, b) in prev.beta.iter().zip(next.beta.iter()) {
        max_delta = max_delta.max((a - b).abs());
    }
    for (a, b) in prev.tau.iter().zip(next.tau.iter()) {
        max_delta = max_delta.max((a - b).abs());
    }
    max_delta
}

fn solve_linear_system(matrix: &DMatrix<f64>, gradient: &DVector<f64>) -> Option<DVector<f64>> {
    let mut info = matrix.clone();
    let mut ridge = 1e-8;
    for _ in 0..3 {
        if let Some(solution) = info.clone().lu().solve(gradient) {
            return Some(solution);
        }
        let n = info.nrows();
        for i in 0..n {
            info[(i, i)] += ridge;
        }
        ridge *= 10.0;
    }
    None
}
