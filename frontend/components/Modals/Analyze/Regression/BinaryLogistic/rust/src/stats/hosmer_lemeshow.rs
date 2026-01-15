use crate::models::result::{HosmerLemeshowGroup, HosmerLemeshowResult};
use nalgebra::DVector;

// Helper struct untuk sorting
struct ProbPair {
    y: f64,
    prob: f64,
}

pub fn calculate(
    y_true: &DVector<f64>,
    y_pred_prob: &DVector<f64>,
    g_groups: usize,
) -> Result<HosmerLemeshowResult, String> {
    if y_true.len() != y_pred_prob.len() {
        return Err("Length mismatch between Y true and predicted probabilities".to_string());
    }

    let n = y_true.len();
    if n < g_groups {
        return Err("Sample size too small for Hosmer-Lemeshow test".to_string());
    }

    // 1. Gabungkan dan Sort berdasarkan Probabilitas (Ascending)
    let mut data: Vec<ProbPair> = (0..n)
        .map(|i| ProbPair {
            y: y_true[i],
            prob: y_pred_prob[i],
        })
        .collect();

    // Sort by probability. Handle NaN safety via unwrap (data assumed clean)
    data.sort_by(|a, b| a.prob.partial_cmp(&b.prob).unwrap());

    // 2. Strategi Grouping SPSS-like
    // SPSS cenderung menggunakan ukuran grup = ceil(N / 10) untuk grup-grup awal.
    // Contoh: N=827 -> ceil(82.7) = 83.
    // Grup 1..9 = 83, Grup 10 = Sisanya (80).
    // Selain itu, kita harus menangani Ties (probabilitas sama persis).

    let target_size = (n as f64 / g_groups as f64).ceil() as usize;

    let mut groups_result: Vec<HosmerLemeshowGroup> = Vec::new();
    let mut start_idx = 0;
    let mut chi_square_stat = 0.0;

    for k in 1..=g_groups {
        if start_idx >= n {
            break;
        }

        // Tentukan batas ideal
        let mut end_idx = start_idx + target_size;

        // Jika ini grup terakhir atau melebihi N, ambil semua sisanya
        if k == g_groups || end_idx > n {
            end_idx = n;
        } else {
            // Handle Ties: Jangan memotong di tengah nilai probabilitas yang sama.
            // Strategi SPSS: extend grup saat ini untuk mencakup semua ties.
            while end_idx < n && (data[end_idx].prob - data[end_idx - 1].prob).abs() < 1e-9 {
                end_idx += 1;
            }
        }

        // Safety check (jangan sampai start >= end jika n masih ada)
        if end_idx <= start_idx {
            end_idx = start_idx + 1;
        }
        if end_idx > n {
            end_idx = n;
        }

        let slice = &data[start_idx..end_idx];
        let current_size = slice.len();

        // Hitung statistik per grup
        let mut obs_1 = 0;
        let mut obs_0 = 0;
        let mut sum_prob = 0.0;

        for item in slice {
            if (item.y - 1.0).abs() < 1e-9 {
                obs_1 += 1;
            } else {
                obs_0 += 1;
            }
            sum_prob += item.prob;
        }

        let exp_1 = sum_prob;
        let exp_0 = (current_size as f64) - sum_prob;

        // Hindari pembagian dengan nol atau nilai sangat kecil
        if exp_1 > 1e-9 && exp_0 > 1e-9 {
            let term1 = (obs_1 as f64 - exp_1).powi(2) / exp_1;
            let term0 = (obs_0 as f64 - exp_0).powi(2) / exp_0;
            chi_square_stat += term1 + term0;
        }

        groups_result.push(HosmerLemeshowGroup {
            group: k,
            size: current_size,
            observed_1: obs_1,
            expected_1: exp_1,
            observed_0: obs_0,
            expected_0: exp_0,
            total_observed: current_size,
        });

        start_idx = end_idx;
    }

    // Hitung df: jumlah grup efektif - 2
    let actual_groups = groups_result.len();
    let df = if actual_groups > 2 {
        actual_groups - 2
    } else {
        1
    };

    let sig = crate::utils::probability::chi_square_significance(chi_square_stat, df as i32);

    Ok(HosmerLemeshowResult {
        chi_square: chi_square_stat,
        df,
        sig,
        contingency_table: groups_result,
    })
}
