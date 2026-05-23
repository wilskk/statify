use statrs::distribution::{ChiSquared, ContinuousCDF};

use crate::types::{EstimationOptions, FitResult, ParallelLinesTest, PlumError, PlumSpec};

pub fn fit_non_parallel_location_only(
    _data: &crate::types::AggregatedData,
    _spec: &PlumSpec,
    _options: &EstimationOptions,
) -> Result<FitResult, PlumError> {
    Err(PlumError::NotImplemented(
        "Non-parallel model belum diimplementasikan".to_string(),
    ))
}

pub fn test_parallel_lines(
    parallel_fit: &FitResult,
    non_parallel_fit: &FitResult,
    p: usize,
    j: usize,
) -> ParallelLinesTest {
    let chi_square = -2.0 * parallel_fit.log_likelihood - (-2.0 * non_parallel_fit.log_likelihood);
    let df = (j as f64 - 2.0) * p as f64;
    let sig = if df > 0.0 {
        let chi = ChiSquared::new(df).unwrap();
        Some(1.0 - chi.cdf(chi_square))
    } else {
        None
    };

    ParallelLinesTest {
        minus2_log_likelihood_parallel: parallel_fit.minus2_log_likelihood,
        minus2_log_likelihood_non_parallel: non_parallel_fit.minus2_log_likelihood,
        chi_square,
        df,
        sig,
        converged: non_parallel_fit.converged,
    }
}
