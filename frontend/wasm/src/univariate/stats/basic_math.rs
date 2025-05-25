use statrs::statistics::Statistics;
use crate::univariate::models::{ data::AnalysisData, result::StatsEntry };

/// Menghitung rata-rata nilai menggunakan statrs
pub fn calculate_mean(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    values.mean()
}

/// Menghitung varians populasi dari nilai-nilai.
/// Jika mean disediakan, itu digunakan. Jika tidak, mean dihitung secara internal.
pub fn calculate_variance(values: &[f64], known_mean: Option<f64>) -> f64 {
    let n = values.len();
    if n == 0 {
        return 0.0; // Or f64::NAN
    }
    if n == 1 && known_mean.is_none() {
        // Variance of a single point is 0 if we don't have a known mean to compare against.
        // If a known_mean is provided, we can calculate (value - known_mean)^2.
        // statrs .variance() returns NaN for n=1, .population_variance() would be more explicit.
        return 0.0;
    }

    let mean = known_mean.unwrap_or_else(|| values.mean());
    values
        .iter()
        .map(|x| (x - mean).powi(2))
        .sum::<f64>() / (n as f64)
}

/// Menghitung standar deviasi populasi dari nilai-nilai.
/// Jika mean disediakan, itu digunakan. Jika tidak, mean dihitung secara internal.
pub fn calculate_std_deviation(values: &[f64], known_mean: Option<f64>) -> f64 {
    calculate_variance(values, known_mean).sqrt()
}

/// Menghitung total kasus dalam data
pub fn count_total_cases(data: &AnalysisData) -> usize {
    data.dependent_data
        .iter()
        .map(|records| records.len())
        .sum()
}

/// Menghitung rata-rata tertimbang, standar deviasi, dan N untuk sekumpulan tuple (nilai, bobot).
pub fn calculate_stats_for_values(values_with_weights: &[(f64, f64)]) -> StatsEntry {
    let valid_data: Vec<(f64, f64)> = values_with_weights
        .iter()
        .filter(|(_, w)| *w > 1e-9)
        .cloned()
        .collect();
    let n_effective = valid_data.len();
    if n_effective == 0 {
        return StatsEntry { mean: 0.0, std_deviation: 0.0, n: 0 };
    }
    let sum_of_weights: f64 = valid_data
        .iter()
        .map(|(_, w)| *w)
        .sum();
    if sum_of_weights.abs() < 1e-9 {
        return StatsEntry { mean: 0.0, std_deviation: 0.0, n: n_effective };
    }
    let mean: f64 =
        valid_data
            .iter()
            .map(|(v, w)| v * w)
            .sum::<f64>() / sum_of_weights;
    let std_deviation: f64 = if n_effective > 1 {
        let variance_numerator: f64 = valid_data
            .iter()
            .map(|(v, w)| *w * (v - mean).powi(2))
            .sum();
        let variance_denominator =
            (sum_of_weights * ((n_effective - 1) as f64)) / (n_effective as f64);
        if variance_denominator.abs() > 1e-9 {
            (variance_numerator / variance_denominator).sqrt()
        } else {
            if variance_numerator.abs() < 1e-9 { 0.0 } else { f64::NAN }
        }
    } else {
        0.0
    };
    StatsEntry {
        mean,
        std_deviation,
        n: n_effective,
    }
}
