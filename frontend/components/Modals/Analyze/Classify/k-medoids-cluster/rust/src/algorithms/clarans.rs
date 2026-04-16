/// CLARANS (Clustering Large Applications based on RANdomized Search)
/// 
/// Randomized search-based K-Medoids algorithm
/// 
/// Algorithm:
/// 1. Start with random set of medoids
/// 2. Randomly sample from neighbors (potential swaps)
/// 3. If better neighbor found, move to it
/// 4. Repeat for multiple local searches
/// 5. Return best result
/// 
/// Time Complexity: O(n² × restarts × max_neighbors)
/// Space Complexity: O(n²) for distance matrix
/// 
/// Advantages:
/// - More efficient than exhaustive PAM for large datasets
/// - Better exploration of solution space than PAM
/// - Good for spatial data
/// 
/// References:
/// - Ng, R.T. and Han, J. (1994)
///   "Efficient and Effective Clustering Methods for Spatial Data Mining"

use crate::algorithms::pam::build_distance_matrix;
use crate::models::ClusteringResult;
use crate::utils::distance::DistanceMetric;
use crate::utils::validation::validate_clustering_input;
use ndarray::Array2;
use rand::seq::SliceRandom;
use rand::Rng;
use rand::SeedableRng;

/// Configuration for CLARANS algorithm
#[derive(Debug, Clone)]
pub struct CLARANSConfig {
    /// Number of clusters (k)
    pub k: usize,
    
    /// Distance metric to use
    pub metric: DistanceMetric,
    
    /// Number of local searches to perform
    pub num_local: usize,
    
    /// Maximum number of neighbors to check per local search
    pub max_neighbors: usize,
    
    /// Random seed for reproducibility
    pub random_seed: Option<u64>,
}

impl Default for CLARANSConfig {
    fn default() -> Self {
        Self {
            k: 2,
            metric: DistanceMetric::Euclidean,
            num_local: 2,
            max_neighbors: 250, // Originally max(250, 1.25% of neighbors)
            random_seed: None,
        }
    }
}

impl CLARANSConfig {
    /// Create config with automatic max_neighbors calculation
    /// Uses max(250, 1.25% of total possible neighbors)
    pub fn new(k: usize, n: usize, metric: DistanceMetric) -> Self {
        let total_neighbors = k * (n - k); // Total possible swaps
        let auto_max_neighbors = 250.max((total_neighbors as f64 * 0.0125) as usize);
        
        Self {
            k,
            metric,
            num_local: 2,
            max_neighbors: auto_max_neighbors,
            random_seed: None,
        }
    }
}

/// Result from CLARANS clustering
#[derive(Debug, Clone)]
pub struct CLARANSResult {
    /// Medoid indices
    pub medoids: Vec<usize>,
    
    /// Cluster assignments (point index -> cluster index)
    pub assignments: Vec<usize>,
    
    /// Total cost (sum of distances to nearest medoid)
    pub total_cost: f64,
    
    /// Number of local searches performed
    pub local_searches: usize,
    
    /// Total number of neighbors checked across all searches
    pub neighbors_checked: usize,
}

/// Run CLARANS clustering algorithm
/// 
/// # Arguments
/// * `data` - Input data points
/// * `config` - CLARANS configuration
/// 
/// # Returns
/// * `Ok(CLARANSResult)` - Clustering result
/// * `Err(String)` - Error message
pub fn run_clarans(data: &[Vec<f64>], config: &CLARANSConfig) -> Result<CLARANSResult, String> {
    // Validate input
    validate_clustering_input(data, config.k)?;

    let n = data.len();

    // k == n: every point is its own medoid; SWAP has no candidates → trivial.
    if config.k >= n {
        let medoids: Vec<usize> = (0..n).collect();
        let assignments: Vec<usize> = (0..n).collect();
        return Ok(CLARANSResult {
            medoids,
            assignments,
            total_cost: 0.0,
            local_searches: 0,
            neighbors_checked: 0,
        });
    }

    // Build flat Array2 distance matrix (row-major, cache-friendly).
    // Using pam::build_distance_matrix avoids duplicating the O(n²) loop and
    // gives the same contiguous memory layout as PAM, enabling consistent
    // access patterns across both algorithms.
    let dist: Array2<f64> = build_distance_matrix(data, &config.metric);

    // Initialize RNG
    let mut rng = if let Some(seed) = config.random_seed {
        rand::rngs::StdRng::seed_from_u64(seed)
    } else {
        rand::rngs::StdRng::from_entropy()
    };

    let mut best_medoids: Vec<usize> = Vec::new();
    let mut best_cost = f64::INFINITY;
    let mut total_neighbors_checked = 0;

    // Perform multiple local searches
    for _local_idx in 0..config.num_local {
        let mut current_medoids = random_initial_medoids(n, config.k, &mut rng);
        let mut current_cost = compute_total_cost_array2(&dist, &current_medoids, n);

        // Build a mutable list of non-medoid indices.  Sampling uniformly from
        // this list replaces the old rejection-sampling loop which could spin
        // O(n/(n-k)) times per draw — O(∞) when k approaches n.
        let mut is_medoid = vec![false; n];
        for &m in &current_medoids { is_medoid[m] = true; }
        let mut non_medoids: Vec<usize> = (0..n).filter(|&i| !is_medoid[i]).collect();

        let mut neighbors_checked_this_search = 0;

        loop {
            if neighbors_checked_this_search >= config.max_neighbors || non_medoids.is_empty() {
                break;
            }

            // O(1) sample: pick a random medoid and a random non-medoid by index.
            let medoid_pos = rng.gen_range(0..current_medoids.len());
            let non_medoid_pos = rng.gen_range(0..non_medoids.len());
            let new_medoid = non_medoids[non_medoid_pos];

            let mut neighbor_medoids = current_medoids.clone();
            neighbor_medoids[medoid_pos] = new_medoid;
            let neighbor_cost = compute_total_cost_array2(&dist, &neighbor_medoids, n);

            neighbors_checked_this_search += 1;
            total_neighbors_checked += 1;

            if neighbor_cost < current_cost {
                // Maintain non_medoids in O(1): replace the just-chosen
                // non-medoid slot with the evicted old medoid.
                let old_medoid = current_medoids[medoid_pos];
                non_medoids[non_medoid_pos] = old_medoid;

                current_medoids = neighbor_medoids;
                current_cost = neighbor_cost;
                neighbors_checked_this_search = 0; // reset per CLARANS spec
            }
        }

        if current_cost < best_cost {
            best_cost = current_cost;
            best_medoids = current_medoids;
        }
    }

    if best_medoids.is_empty() {
        return Err("CLARANS failed to find any valid clustering".to_string());
    }

    let final_assignments = assign_to_medoids_array2(&dist, &best_medoids, n);
    let final_cost = compute_total_cost_array2(&dist, &best_medoids, n);

    Ok(CLARANSResult {
        medoids: best_medoids,
        assignments: final_assignments,
        total_cost: final_cost,
        local_searches: config.num_local,
        neighbors_checked: total_neighbors_checked,
    })
}

/// Random initial medoid selection
fn random_initial_medoids<R: Rng>(n: usize, k: usize, rng: &mut R) -> Vec<usize> {
    let mut indices: Vec<usize> = (0..n).collect();
    indices.shuffle(rng);
    indices.into_iter().take(k).collect()
}

/// Assign each point to its nearest medoid; returns cluster index (0..k-1) per point.
///
/// Uses the flat `Array2` matrix for sequential row access (cache-friendly).
fn assign_to_medoids_array2(dist: &Array2<f64>, medoids: &[usize], n: usize) -> Vec<usize> {
    (0..n)
        .map(|i| {
            medoids
                .iter()
                .enumerate()
                .min_by(|&(_, &a), &(_, &b)| {
                    dist[[i, a]]
                        .partial_cmp(&dist[[i, b]])
                        .unwrap_or(std::cmp::Ordering::Equal)
                })
                .map(|(idx, _)| idx)
                .unwrap_or(0)
        })
        .collect()
}

/// Compute total PAM cost: Σ_i d(i, nearest_medoid(i)).
fn compute_total_cost_array2(dist: &Array2<f64>, medoids: &[usize], n: usize) -> f64 {
    (0..n)
        .map(|i| medoids.iter().map(|&m| dist[[i, m]]).fold(f64::INFINITY, f64::min))
        .sum()
}

/// Convert CLARANSResult to ClusteringResult for compatibility
impl From<CLARANSResult> for ClusteringResult {
    fn from(clarans_result: CLARANSResult) -> Self {
        ClusteringResult {
            cluster_assignments: clarans_result.assignments,
            medoid_indices: clarans_result.medoids,
            total_cost: clarans_result.total_cost,
            iterations: clarans_result.local_searches,
            converged: true,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_clarans_basic_clustering() {
        // Simple 2D data with 2 clear clusters
        let data = vec![
            vec![0.0, 0.0],
            vec![1.0, 0.0],
            vec![0.0, 1.0],
            vec![10.0, 10.0],
            vec![11.0, 10.0],
            vec![10.0, 11.0],
        ];
        
        let config = CLARANSConfig {
            k: 2,
            metric: DistanceMetric::Euclidean,
            num_local: 2,
            max_neighbors: 10,
            random_seed: Some(42),
        };
        
        let result = run_clarans(&data, &config).unwrap();
        
        // Should find 2 clusters
        assert_eq!(result.medoids.len(), 2);
        assert_eq!(result.assignments.len(), 6);
        
        // Cost should be positive and finite
        assert!(result.total_cost > 0.0);
        assert!(result.total_cost.is_finite());
        
        // Should have performed all local searches
        assert_eq!(result.local_searches, 2);
    }
    
    #[test]
    fn test_clarans_deterministic_with_seed() {
        let data = vec![
            vec![0.0, 0.0],
            vec![1.0, 1.0],
            vec![2.0, 2.0],
            vec![10.0, 10.0],
            vec![11.0, 11.0],
            vec![12.0, 12.0],
        ];
        
        let config = CLARANSConfig {
            k: 2,
            num_local: 2,
            max_neighbors: 10,
            random_seed: Some(123),
            ..Default::default()
        };
        
        let result1 = run_clarans(&data, &config).unwrap();
        let result2 = run_clarans(&data, &config).unwrap();
        
        // Should produce same results with same seed
        assert_eq!(result1.medoids, result2.medoids);
        assert_eq!(result1.assignments, result2.assignments);
        assert_eq!(result1.total_cost, result2.total_cost);
    }
    
    #[test]
    fn test_clarans_auto_max_neighbors() {
        let n = 100;
        let k = 5;
        
        let config = CLARANSConfig::new(k, n, DistanceMetric::Euclidean);
        
        // Should be at least 250 or 1.25% of k*(n-k)
        let expected_min = 250.max((k * (n - k)) / 80); // 1.25% = 1/80
        assert!(config.max_neighbors >= expected_min);
    }
    
    #[test]
    fn test_clarans_single_cluster() {
        let data = vec![
            vec![0.0, 0.0],
            vec![1.0, 1.0],
            vec![2.0, 2.0],
        ];
        
        let config = CLARANSConfig {
            k: 1,
            ..Default::default()
        };
        
        let result = run_clarans(&data, &config).unwrap();
        
        assert_eq!(result.medoids.len(), 1);
        // All points should be in cluster 0
        assert!(result.assignments.iter().all(|&c| c == 0));
    }
    
    #[test]
    fn test_clarans_manhattan_distance() {
        let data = vec![
            vec![0.0, 0.0],
            vec![1.0, 0.0],
            vec![10.0, 10.0],
        ];
        
        let config = CLARANSConfig {
            k: 2,
            metric: DistanceMetric::Manhattan,
            num_local: 2,
            max_neighbors: 10,
            random_seed: Some(42),
        };
        
        let result = run_clarans(&data, &config).unwrap();
        
        assert_eq!(result.medoids.len(), 2);
        assert!(result.total_cost > 0.0);
    }
    
    #[test]
    fn test_clarans_invalid_k() {
        let data = vec![
            vec![0.0],
            vec![1.0],
        ];
        
        let config = CLARANSConfig {
            k: 3, // k > n
            ..Default::default()
        };
        
        let result = run_clarans(&data, &config);
        assert!(result.is_err());
    }
}
