use rand_mt::Mt64;

/// Splits data into training and holdout sets
pub fn split_training_holdout(
    total_cases: usize,
    training_percent: i32,
    use_seed: bool,
    seed: Option<i64>,
) -> (Vec<usize>, Vec<usize>) {
    if total_cases == 0 {
        return (Vec::new(), Vec::new());
    }

    let clamped_percent = training_percent.max(0).min(100) as f64;
    let training_size = (((total_cases as f64) * clamped_percent) / 100.0).round() as usize;
    let training_size = training_size.min(total_cases);

    let mut indices: Vec<usize> = (0..total_cases).collect();

    let mut rng = if use_seed {
        match seed {
            Some(s) => Mt64::new(s as u64),
            None => Mt64::new(rand::random::<u64>()),
        }
    } else {
        Mt64::new(rand::random::<u64>())
    };

    for i in (1..indices.len()).rev() {
        let j = (rng.next_u64() % ((i + 1) as u64)) as usize;
        indices.swap(i, j);
    }

    let (training_indices, holdout_indices) = indices.split_at(training_size);
    (training_indices.to_vec(), holdout_indices.to_vec())
}
