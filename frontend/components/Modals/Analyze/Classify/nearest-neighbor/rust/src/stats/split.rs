use super::numpy_random::shuffle_indices_numpy_compatible;

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
    let training_size = (((total_cases as f64) * clamped_percent) / 100.0).floor() as usize;
    let training_size = training_size.min(total_cases);
    let holdout_size = total_cases - training_size;

    let mut indices: Vec<usize> = (0..total_cases).collect();

    let effective_seed = if use_seed { seed } else { None };
    shuffle_indices_numpy_compatible(&mut indices, effective_seed);

    let (holdout_indices, training_indices) = indices.split_at(holdout_size);
    (training_indices.to_vec(), holdout_indices.to_vec())
}

#[cfg(test)]
mod tests {
    use super::split_training_holdout;

    #[test]
    fn random_split_with_seed_is_deterministic_and_uses_floor_size() {
        let first = split_training_holdout(10, 65, true, Some(1234));
        let second = split_training_holdout(10, 65, true, Some(1234));

        assert_eq!(first, second);
        assert_eq!(first.0, vec![0, 8, 4, 5, 6, 3]);
        assert_eq!(first.1, vec![7, 2, 9, 1]);
        assert_eq!(first.0.len(), 6);
        assert_eq!(first.1.len(), 4);
    }

    #[test]
    fn random_split_matches_numpy_permutation_with_seed() {
        let (train, holdout) = split_training_holdout(10, 60, true, Some(1234));

        assert_eq!(train, vec![0, 8, 4, 5, 6, 3]);
        assert_eq!(holdout, vec![7, 2, 9, 1]);
    }
}
