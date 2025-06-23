use statrs::statistics::Statistics;
use crate::univariate::models::{ data::AnalysisData, result::StatsEntry };

/// Menghitung nilai rata-rata (mean) dari sekumpulan data.
///
/// Mengembalikan 0.0 jika tidak ada data untuk mencegah kesalahan pembagian dengan nol.
pub fn calculate_mean(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    values.mean()
}

/// Menghitung varians populasi dari suatu set data.
///
/// Varians mengukur seberapa tersebar data dari nilai rata-ratanya. Fungsi ini
/// memungkinkan penggunaan mean yang sudah dihitung sebelumnya (`known_mean`) untuk
/// optimisasi, sehingga kalkulasi ulang yang tidak perlu dapat dihindari.
///
/// # Catatan
/// - Mengembalikan 0.0 jika data kosong.
/// - Varians untuk satu titik data adalah 0 karena tidak ada penyebaran nilai.
pub fn calculate_variance(values: &[f64], known_mean: Option<f64>) -> f64 {
    let n = values.len();
    if n < 2 {
        // Varians untuk 0 atau 1 data adalah 0.
        // `statrs.variance()` akan menghasilkan NaN untuk n=1, jadi ditangani secara manual.
        return 0.0;
    }

    let mean = known_mean.unwrap_or_else(|| values.mean());
    values
        .iter()
        .map(|x| (x - mean).powi(2))
        .sum::<f64>() / (n as f64)
}

/// Menghitung standar deviasi populasi, yang merupakan akar kuadrat dari varians.
///
/// Standar deviasi memberikan gambaran sebaran data dalam unit yang sama dengan data itu sendiri,
/// sehingga lebih mudah diinterpretasikan. Menerima `known_mean` opsional untuk
/// diteruskan ke `calculate_variance` demi efisiensi.
pub fn calculate_std_deviation(values: &[f64], known_mean: Option<f64>) -> f64 {
    calculate_variance(values, known_mean).sqrt()
}

/// Menghitung jumlah total observasi (kasus) dari seluruh grup dalam data analisis.
///
/// Data analisis dapat terdiri dari beberapa grup; fungsi ini menjumlahkan
/// ukuran dari setiap grup untuk mendapatkan total keseluruhan.
pub fn count_total_cases(data: &AnalysisData) -> usize {
    data.dependent_data
        .iter()
        .map(|records| records.len())
        .sum()
}

/// Menghitung statistik deskriptif (rata-rata, standar deviasi, dan jumlah sampel)
/// untuk data yang memiliki bobot (weighted data).
///
/// Fungsi ini penting ketika setiap titik data memiliki tingkat kepentingan yang berbeda,
/// yang direpresentasikan oleh bobotnya.
///
/// # Proses
/// 1. Membersihkan data: Hanya data dengan bobot signifikan (> 1e-9) yang diproses.
/// 2. Menghitung rata-rata tertimbang: `sum(nilai * bobot) / sum(bobot)`.
/// 3. Menghitung standar deviasi tertimbang: Menggunakan formula yang disesuaikan untuk
///    sampel berbobot guna menghasilkan estimasi yang akurat.
///
/// # Mengembalikan
/// `StatsEntry` yang berisi `mean`, `std_deviation`, dan `n` (jumlah sampel efektif).
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
