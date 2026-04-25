// Unit tests for K-Medoids

#[cfg(test)]
mod tests {
    use crate::utils::distance::*;
    use crate::utils::validation::*;
    use crate::models::KMedoidsInput;

    #[test]
    fn test_euclidean_distance() {
        let p1 = vec![0.0, 0.0];
        let p2 = vec![3.0, 4.0];
        let dist = euclidean_distance(&p1, &p2);
        assert!((dist - 5.0).abs() < 1e-10);
    }

    #[test]
    fn test_manhattan_distance() {
        let p1 = vec![0.0, 0.0];
        let p2 = vec![3.0, 4.0];
        let dist = manhattan_distance(&p1, &p2);
        assert!((dist - 7.0).abs() < 1e-10);
    }

    #[test]
    fn test_validate_input_empty_data() {
        let input = KMedoidsInput {
            data: vec![],
            n_clusters: 2,
            method: "PAM".to_string(),
            max_iterations: 100,
            distance_metric: "euclidean".to_string(),
            random_seed: None,
            n_init: 1,
            convergence_tolerance: 0.0,
            clara_num_samples: 5,
            clara_sample_size: None,
        };

        assert!(validate_input(&input).is_err());
    }

    #[test]
    fn test_validate_input_too_many_clusters() {
        let input = KMedoidsInput {
            data: vec![vec![1.0, 2.0], vec![3.0, 4.0]],
            n_clusters: 5,
            method: "PAM".to_string(),
            max_iterations: 100,
            distance_metric: "euclidean".to_string(),
            random_seed: None,
            n_init: 1,
            convergence_tolerance: 0.0,
            clara_num_samples: 5,
            clara_sample_size: None,
        };

        assert!(validate_input(&input).is_err());
    }

    #[test]
    fn test_validate_input_valid() {
        let input = KMedoidsInput {
            data: vec![vec![1.0, 2.0], vec![3.0, 4.0], vec![5.0, 6.0]],
            n_clusters: 2,
            method: "PAM".to_string(),
            max_iterations: 100,
            distance_metric: "euclidean".to_string(),
            random_seed: None,
            n_init: 1,
            convergence_tolerance: 0.0,
            clara_num_samples: 5,
            clara_sample_size: None,
        };

        assert!(validate_input(&input).is_ok());
    }

    // ── Assignment integrity tests ────────────────────────────────────────────
    // These tests guard against the pam_build destructuring bug where the
    // n-length assignment vector was accidentally used as the k-length medoid
    // index list.  If that bug reappears, run_pam returns medoids.len() == n
    // instead of k, causing TypeScript to report k = N clusters in all tables.

    /// 10 points with k=2: verify exactly 2 medoids and valid assignments.
    #[test]
    fn test_run_pam_k2_returns_two_medoids() {
        use crate::algorithms::pam::{run_pam, PAMConfig};
        use crate::utils::distance::DistanceMetric;

        // Two tight clusters well-separated in 2D
        let data: Vec<Vec<f64>> = vec![
            vec![0.0, 0.0], vec![0.1, 0.0], vec![0.0, 0.1], vec![0.1, 0.1], vec![0.05, 0.05],
            vec![5.0, 5.0], vec![5.1, 5.0], vec![5.0, 5.1], vec![5.1, 5.1], vec![5.05, 5.05],
        ];
        let n = data.len(); // 10
        let k = 2;

        let config = PAMConfig {
            k,
            metric: DistanceMetric::Euclidean,
            max_iterations: 50,
            random_seed: Some(42),
            use_build_phase: true,
            epsilon: 0.0,
            n_init: 1,
            use_r_implementation: false,
        };

        let result = run_pam(&data, &config).expect("PAM failed");

        // ── Core invariant: medoids.len() must equal k, NOT n ──
        assert_eq!(
            result.medoids.len(), k,
            "medoids.len()={} but expected k={}. \
             This indicates the pam_build(dist,k) return value is being \
             destructured in the wrong order (taking assi[n] instead of meds[k]).",
            result.medoids.len(), k
        );

        // Every medoid index must be a valid row index
        for &m in &result.medoids {
            assert!(m < n, "medoid index {} out of bounds (n={})", m, n);
        }

        // assignments must have length n with values in 0..k-1
        assert_eq!(result.assignments.len(), n);
        for &a in &result.assignments {
            assert!(a < k, "assignment value {} out of range (k={})", a, k);
        }

        // The two well-separated clusters should each have at least 1 member
        let sizes: Vec<usize> = (0..k)
            .map(|c| result.assignments.iter().filter(|&&a| a == c).count())
            .collect();
        for (c, &sz) in sizes.iter().enumerate() {
            assert!(sz >= 1, "cluster {} is empty — algorithm did not converge to 2 clusters", c);
        }
    }

    /// Random-init path (use_build_phase=false): same invariants must hold.
    #[test]
    fn test_run_pam_random_init_k3_returns_three_medoids() {
        use crate::algorithms::pam::{run_pam, PAMConfig};
        use crate::utils::distance::DistanceMetric;

        let data: Vec<Vec<f64>> = (0..15)
            .map(|i| vec![(i / 5) as f64 * 10.0, (i % 5) as f64])
            .collect();
        let k = 3;

        let config = PAMConfig {
            k,
            metric: DistanceMetric::Euclidean,
            max_iterations: 100,
            random_seed: Some(0),
            use_build_phase: false,
            epsilon: 0.0,
            n_init: 1,
            use_r_implementation: false,
        };

        let result = run_pam(&data, &config).expect("PAM (random init) failed");

        assert_eq!(
            result.medoids.len(), k,
            "random-init PAM: medoids.len()={} expected k={}",
            result.medoids.len(), k
        );
        assert_eq!(result.assignments.len(), data.len());
        for &a in &result.assignments {
            assert!(a < k);
        }
    }

    /// Regression: 500 observations, k=2 must NEVER return 500 medoids.
    #[test]
    fn test_run_pam_n500_k2_does_not_return_n_medoids() {
        use crate::algorithms::pam::{run_pam, PAMConfig};
        use crate::utils::distance::DistanceMetric;

        // Generate 500 2D points split into 2 obvious clusters
        let data: Vec<Vec<f64>> = (0..500_usize)
            .map(|i| {
                let cluster = (i / 250) as f64;
                vec![cluster * 100.0 + (i % 250) as f64 * 0.01,
                     cluster * 100.0 + (i % 250) as f64 * 0.01]
            })
            .collect();
        let n = data.len(); // 500
        let k = 2;

        let config = PAMConfig {
            k,
            metric: DistanceMetric::Euclidean,
            max_iterations: 100,
            random_seed: Some(1),
            use_build_phase: true,
            epsilon: 0.0,
            n_init: 1,
            use_r_implementation: false,
        };

        let result = run_pam(&data, &config).expect("PAM n=500 k=2 failed");

        assert_eq!(
            result.medoids.len(), k,
            "n=500, k=2 regression: medoids.len()={} — algorithm returned k=N instead of k={}",
            result.medoids.len(), k
        );
        assert_ne!(
            result.medoids.len(), n,
            "CRITICAL: medoids.len() == n ({}) — pam_build destructuring bug is back!", n
        );
        assert_eq!(result.assignments.len(), n);
    }
}
