/// PAM (Partitioning Around Medoids) Algorithm
/// 
/// Uses the `kmedoids` crate for the core PAM computation.
/// 
/// References:
/// - Kaufman, L. and Rousseeuw, P.J. (1990)
///    "Finding Groups in Data: An Introduction to Cluster Analysis"

use crate::models::ClusteringResult;
use crate::utils::distance::{calculate_distance, DistanceMetric};
use crate::utils::validation::validate_clustering_input;
use ndarray::Array2;
#[cfg(target_arch = "wasm32")]
use web_sys::console;

/// Configuration for PAM algorithm
#[derive(Debug, Clone)]
pub struct PAMConfig {
    /// Number of clusters (k)
    pub k: usize,
    
    /// Distance metric to use
    pub metric: DistanceMetric,
    
    /// Maximum iterations for SWAP phase
    pub max_iterations: usize,
    
    /// Random seed for reproducibility (optional)
    pub random_seed: Option<u64>,
    
    /// Use BUILD phase for initialization
    /// If false, uses random initialization (faster but may be less accurate)
    pub use_build_phase: bool,
    
    /// Early stopping: stop if improvement < epsilon
    pub epsilon: f64,
    
    /// Number of times to run with different seeds (n_init)
    pub n_init: usize,
}

impl Default for PAMConfig {
    fn default() -> Self {
        Self {
            k: 2,
            metric: DistanceMetric::Euclidean,
            max_iterations: 100,
            random_seed: None,
            use_build_phase: true,
            epsilon: 1e-6,
            n_init: 10,
        }
    }
}

/// Result from PAM clustering
#[derive(Debug, Clone)]
pub struct PAMResult {
    /// Medoid indices
    pub medoids: Vec<usize>,

    /// Cluster assignments (point index -> cluster index)
    pub assignments: Vec<usize>,

    /// Total cost (sum of distances to nearest medoid)
    pub total_cost: f64,

    /// Number of swap iterations actually performed
    pub iterations: usize,

    /// Cost at each iteration (index 0 = initial cost before any swap)
    pub cost_history: Vec<f64>,

    /// Medoid indices at each step: [0] = initial medoids (after BUILD),
    /// [i] = medoids after the i-th swap.  Mirrors cost_history layout.
    pub medoid_history: Vec<Vec<usize>>,

    /// Per-object silhouette scores computed from the already-built distance
    /// matrix — reuses the O(n²) work already done for PAM, so no extra distance
    /// recomputation is needed.
    pub silhouette_scores: Vec<f64>,

    /// Distance from each point to its assigned medoid, read directly from
    /// the distance matrix built during PAM — no raw-data recomputation needed.
    pub distances_to_medoids: Vec<f64>,

    /// True when the algorithm stopped because no improving swap existed
    /// (converged), false when it stopped because max_iterations was reached.
    pub converged: bool,
}

/// Run PAM clustering algorithm with multiple initializations
/// 
/// Runs the algorithm n_init times (if n_init > 1) with different random seeds
/// and returns the best result (lowest total cost).
/// 
/// # Arguments
/// * `data` - Input data points
/// * `config` - PAM configuration
/// 
/// # Returns
/// * `Ok(PAMResult)` - Best clustering result across all runs
/// * `Err(String)` - Error message
pub fn run_pam(data: &[Vec<f64>], config: &PAMConfig) -> Result<PAMResult, String> {
    // BUILD phase is fully deterministic (ignores the random seed), so running
    // it n_init times produces n_init identical results — a pure waste of time.
    // Only do multiple restarts when using random (non-BUILD) initialisation.
    let effective_n_init = if config.use_build_phase {
        1
    } else {
        config.n_init.max(1)
    };

    if effective_n_init <= 1 || config.random_seed.is_some() {
        return run_pam_single(data, config);
    }

    // Random restarts: build the distance matrix ONCE, reuse across all n_init runs.
    // Previously each run_pam_single() call re-invoked build_distance_matrix(),
    // causing an O(n²) rebuild per restart — the largest per-restart cost.
    validate_clustering_input(data, config.k)?;
    let dist = build_distance_matrix(data, &config.metric);
    let n = data.len();

    let mut best_result: Option<PAMResult> = None;

    for i in 0..effective_n_init {
        let mut run_config = config.clone();
        run_config.random_seed = Some(i as u64);

        match run_pam_with_dist(&dist, n, &run_config, None, None) {
            Ok(result) => {
                if best_result.is_none()
                    || result.total_cost < best_result.as_ref().unwrap().total_cost
                {
                    best_result = Some(result);
                }
            }
            Err(e) => {
                eprintln!("Run {} failed: {}", i, e);
            }
        }
    }

    best_result.ok_or_else(|| "All initialization attempts failed".to_string())
}

/// Run PAM clustering (single run). Builds dist matrix then delegates to `run_pam_with_dist`.
fn run_pam_single(data: &[Vec<f64>], config: &PAMConfig) -> Result<PAMResult, String> {
    validate_clustering_input(data, config.k)?;
    let dist = build_distance_matrix(data, &config.metric);
    let n = data.len();
    run_pam_with_dist(&dist, n, config, None, None)
}

/// Public entry point that accepts optional per-iteration and initial-medoids callbacks.
/// - `on_iter`: called after each SWAP step with (iteration, cost).
/// - `on_initial_medoids`: called once after the BUILD phase with the initial medoid indices,
///   enabling the UI to stream initial medoids before the SWAP phase completes.
pub fn run_pam_with_progress(
    data: &[Vec<f64>],
    config: &PAMConfig,
    on_iter: Option<&dyn Fn(usize, f64)>,
    on_initial_medoids: Option<&dyn Fn(&[usize])>,
) -> Result<PAMResult, String> {
    validate_clustering_input(data, config.k)?;
    let dist = build_distance_matrix(data, &config.metric);
    let n = data.len();
    run_pam_with_dist(&dist, n, config, on_iter, on_initial_medoids)
}

/// Run PAM on a **pre-built** distance matrix.
/// Call this when you need to test multiple k values on the same data
/// so the O(n²) matrix is only constructed once.
/// - `on_iter`: fired after each SWAP step with (iteration, current_cost).
/// - `on_initial_medoids`: fired once after BUILD initialisation, before any SWAPs.
///   Lets the caller stream initial medoid indices to the UI immediately.
pub(crate) fn run_pam_with_dist(
    dist: &Array2<f64>,
    n: usize,
    config: &PAMConfig,
    on_iter: Option<&dyn Fn(usize, f64)>,
    on_initial_medoids: Option<&dyn Fn(&[usize])>,
) -> Result<PAMResult, String> {
    let k = config.k;

    // ── k-pipeline verification (Rust side) ─────────────────────────────────
    // Log k here so browser DevTools can confirm the exact k that reached
    // run_pam_with_dist — the innermost PAM entry before the BUILD phase.
    // This makes it trivial to detect k-corruption anywhere in the pipeline.
    #[cfg(target_arch = "wasm32")]
    console::log_1(
        &format!("[PAM BUILD entry] k={} n={} use_build={} epsilon={:e}",
            k, n, config.use_build_phase, config.epsilon).into()
    );

    if n < k {
        return Err(format!("Need at least {} points for k={}", k, k));
    }

    // --- Initialization ---
    let mut medoids: Vec<usize> = if config.use_build_phase {
        // kmedoids::pam_build returns (loss, assignments[n], medoids[k]).
        // We need the THIRD element (medoid indices), not the second
        // (per-point cluster assignments).  The original code had these
        // swapped, which caused n-length assignment vectors to be used as
        // initial medoids — the root cause of accuracy regressions.
        let (_, _, initial_medoids): (f64, Vec<usize>, Vec<usize>) =
            kmedoids::pam_build(dist, k);
        // Stream initial medoids to the caller before any SWAP iteration.
        // This lets the UI show something useful while the (potentially slow)
        // O(n² × max_iter) SWAP phase is running.
        if let Some(cb) = on_initial_medoids { cb(&initial_medoids); }
        initial_medoids
    } else {
        random_init_medoids(n, k, config.random_seed)
    };

    // Compute initial cost and record it as "Init" entry in history
    let init_cost = compute_total_cost(dist, &medoids, n);
    let mut cost_history = vec![init_cost];
    let mut medoid_history: Vec<Vec<usize>> = vec![medoids.clone()];
    let mut current_cost = init_cost;
    let mut n_iter = 0usize;

    // --- SWAP phase ---
    // Use a flat boolean slice instead of a HashSet for O(1) medoid membership
    // checks with better cache locality.  The slice is re-initialized every
    // iteration because medoids change; allocation is O(n) but only happens
    // once per iteration (constant factor, small compared to the O(n²) loop).
    //
    // Cycle detection: store each medoid set (sorted) seen so far.  If PAM
    // revisits a state it has already been in (possible when epsilon=0 and
    // floating-point rounding creates near-zero deltas), stop immediately to
    // avoid running all the way to max_iterations.  Memory cost: O(max_iter×k)
    // which is tiny — e.g. k=2, 300 iterations → 600 usize values.
    let mut seen_states: Vec<Vec<usize>> = Vec::new();
    {
        let mut initial_state = medoids.clone();
        initial_state.sort_unstable();
        seen_states.push(initial_state);
    }

    let mut converged = false;
    for _ in 0..config.max_iterations {
        let (best_m_pos, best_x, best_delta) = find_best_swap(dist, &medoids, n);

        if best_delta >= -config.epsilon {
            // No swap improves cost by more than epsilon → converged.
            converged = true;
            break; // Do NOT increment n_iter: no swap was performed.
        }

        medoids[best_m_pos] = best_x;

        // Cycle detection: if this medoid set was already visited, we are
        // in an infinite loop caused by floating-point near-zero deltas.
        // Treat as converged (local optimum) and stop.
        let mut state = medoids.clone();
        state.sort_unstable();
        if seen_states.contains(&state) {
            converged = true;
            break;
        }
        seen_states.push(state);

        current_cost += best_delta;
        if current_cost < 0.0 { current_cost = 0.0; }
        cost_history.push(current_cost);
        medoid_history.push(medoids.clone());
        n_iter += 1;
        // Fire progress callback (iteration number, current cost) so the JS
        // worker can display real-time progress instead of a static spinner.
        if let Some(cb) = on_iter { cb(n_iter, current_cost); }
    }

    let assignments = compute_assignments(dist, &medoids, n, k);

    let final_cost: f64 = (0..n)
        .map(|i| dist[[i, medoids[assignments[i]]]])
        .sum();

    if let Some(last) = cost_history.last_mut() {
        *last = final_cost;
    }

    // Read per-point distances directly from the distance matrix — avoids
    // recomputing O(n × d) raw-data distances in the WASM entry-point layer.
    let distances_to_medoids: Vec<f64> = (0..n)
        .map(|i| dist[[i, medoids[assignments[i]]]])
        .collect();

    // Compute per-object silhouette scores reusing the already-built distance
    // matrix (O(n²) lookups, row-major → cache-friendly).  This avoids
    // re-computing all distances in the JS worker after WASM returns.
    let silhouette_scores = compute_silhouette_from_dist(dist, &assignments, n, k);

    // ── Post-run assertion ────────────────────────────────────────────────
    // Confirm medoids.len() == k to catch any accidental k mutation inside
    // the kmedoids crate (static state, wrong return-value destructuring, etc.).
    #[cfg(target_arch = "wasm32")]
    console::log_1(
        &format!("[PAM DONE] k={} medoids.len()={} iters={} converged={} cost={:.4}",
            k, medoids.len(), n_iter, converged, final_cost).into()
    );
    debug_assert_eq!(medoids.len(), k, "PAM returned {} medoids for k={}", medoids.len(), k);

    Ok(PAMResult {
        medoids,
        assignments,
        total_cost: final_cost,
        iterations: n_iter,
        cost_history,
        medoid_history,
        silhouette_scores,
        distances_to_medoids,
        converged,
    })
}

/// Run PAM for a **range** of k values, building the distance matrix only once.
/// This is the core optimisation for automatic k selection: instead of calling
/// `run_k_medoids` N times (each rebuilding the O(n²) dist matrix), we build
/// it once here and re-use it across all k.
pub fn run_pam_range(
    data: &[Vec<f64>],
    k_min: usize,
    k_max: usize,
    base_config: &PAMConfig,
) -> Result<Vec<(usize, PAMResult)>, String> {
    if data.is_empty() {
        return Err("No data provided".to_string());
    }
    let n = data.len();
    if k_max > n {
        return Err(format!("k_max ({}) cannot exceed n ({})", k_max, n));
    }
    if k_min < 1 || k_min > k_max {
        return Err(format!("Invalid range: k_min={} k_max={}", k_min, k_max));
    }

    // Build the distance matrix once for all k values
    let dist = build_distance_matrix(data, &base_config.metric);

    let mut results = Vec::with_capacity(k_max - k_min + 1);
    for k in k_min..=k_max {
        let mut config = base_config.clone();
        config.k = k;
        match run_pam_with_dist(&dist, n, &config, None, None) {
            Ok(result) => results.push((k, result)),
            Err(e) => return Err(format!("PAM failed for k={}: {}", k, e)),
        }
    }

    Ok(results)
}

// ── helpers for the custom SWAP loop ─────────────────────────────────────────

/// Find the best (medoid_position, candidate_point) swap.
///
/// Implements **FastPAM1** (Schubert & Rousseeuw, 2021): one O(n) pass per
/// candidate computes delta improvements for ALL k medoids simultaneously,
/// reducing SWAP-phase complexity from O(k × n²) to O(n² + k×n) ≈ O(n²).
///
/// Key formula:
///   delta(h, x) = total_base + bonus_by_h[h]
///   where:
///     total_base    = Σ_i  min( d[i,x] - d1[i],  0 )   (same for every h)
///     bonus_by_h[h] = Σ_{i: nearest_h[i]==h}
///                       ( min(d2[i], d[i,x]) - min(d1[i], d[i,x]) )
///
/// total_base and bonus_by_h[h] are built in a **single** O(n) pass per x,
/// so the inner (h) loop just reads k precomputed values — O(k) per candidate
/// instead of the O(k×n) of the previous approach.
///
/// Access pattern: dist[[i, x]] with fixed x and varying i is a column access
/// (stride = n×8 bytes in row-major layout).  This is unavoidable whichever
/// algorithm is used; the gain of FastPAM1 is eliminating the k times we
/// previously re-read the same stride pattern.
///
/// When the `threading` feature is active, the per-candidate outer loop is
/// parallelised via rayon, giving ~CPU-core-count× speedup for the SWAP phase.
#[cfg(not(feature = "threading"))]
fn find_best_swap(dist: &Array2<f64>, medoids: &[usize], n: usize) -> (usize, usize, f64) {
    let k = medoids.len();

    // Pre-compute nearest and second-nearest medoid per point — O(n × k).
    let mut d1 = vec![f64::INFINITY; n];      // distance to nearest medoid
    let mut d2 = vec![f64::INFINITY; n];      // distance to second-nearest medoid
    let mut nearest_h = vec![0usize; n];      // position in medoids[] that is nearest

    for i in 0..n {
        for (h, &m) in medoids.iter().enumerate() {
            let d = dist[[i, m]];
            if d < d1[i] {
                d2[i] = d1[i];
                d1[i] = d;
                nearest_h[i] = h;
            } else if d < d2[i] {
                d2[i] = d;
            }
        }
    }

    // Boolean slice O(n) membership check — avoids HashSet allocation and
    // gives sequential memory access in the candidate loop below.
    let mut is_medoid = vec![false; n];
    for &m in medoids { is_medoid[m] = true; }

    let mut best_m_pos = 0usize;
    let mut best_x = 0usize;
    let mut best_delta = 0.0_f64; // only accept strictly negative (improving) swaps

    // Per-candidate accumulators — allocated once, reset in O(k) per candidate.
    let mut bonus_by_h = vec![0.0_f64; k];

    for x in 0..n {
        if is_medoid[x] {
            continue;
        }

        // ── FastPAM1: single O(n) pass — one stride access per point ──
        // Computes `total_base` (shared across all h) and per-h `bonus_by_h`
        // without an explicit column-copy buffer.  All arithmetic on d1/d2/
        // nearest_h is sequential in memory.
        let mut total_base = 0.0_f64;
        for b in bonus_by_h.iter_mut() { *b = 0.0; }

        for i in 0..n {
            let d_ix = dist[[i, x]];              // stride access (col x) — unavoidable
            total_base += (d_ix - d1[i]).min(0.0); // base benefit/cost for all h

            // Extra benefit if we remove the cluster that currently owns i:
            // i would fall back to min(d2[i], d_ix) instead of d1[i].
            let h_i = nearest_h[i];
            bonus_by_h[h_i] += d2[i].min(d_ix) - d1[i].min(d_ix);
        }

        // ── O(k) final scan across medoids ──
        for h in 0..k {
            let delta = total_base + bonus_by_h[h];
            if delta < best_delta {
                best_delta = delta;
                best_m_pos = h;
                best_x = x;
            }
        }
    }

    (best_m_pos, best_x, best_delta)
}

/// Parallel FastPAM1 SWAP-phase candidate scan (requires `threading` feature).
///
/// The outer loop over non-medoid candidates `x` is embarrassingly parallel:
/// each x computes its own `total_base` and `bonus_by_h` in isolation.
/// rayon's work-stealing scheduler divides the ~(n-k) candidates across
/// available threads and reduces the (best_h, x, best_delta) tuples via a
/// tournament reduction — O(log T) extra comparisons, negligible vs O(n²) math.
#[cfg(feature = "threading")]
fn find_best_swap(dist: &Array2<f64>, medoids: &[usize], n: usize) -> (usize, usize, f64) {
    use rayon::prelude::*;
    let k = medoids.len();

    // Pre-compute nearest & second-nearest medoid per point — O(n × k), sequential.
    // This is inherently sequential (each row updates d1/d2/nearest_h in-place).
    let mut d1 = vec![f64::INFINITY; n];
    let mut d2 = vec![f64::INFINITY; n];
    let mut nearest_h = vec![0usize; n];

    for i in 0..n {
        for (h, &m) in medoids.iter().enumerate() {
            let d = dist[[i, m]];
            if d < d1[i] {
                d2[i] = d1[i];
                d1[i] = d;
                nearest_h[i] = h;
            } else if d < d2[i] {
                d2[i] = d;
            }
        }
    }

    let is_medoid: Vec<bool> = {
        let mut v = vec![false; n];
        for &m in medoids { v[m] = true; }
        v
    };

    // Parallel candidate scan: each thread evaluates a slice of the n candidates.
    // Returns (best_medoid_pos, best_candidate, best_delta) tuples which are
    // reduced to the global minimum by rayon's built-in tournament.
    (0..n)
        .into_par_iter()
        .filter(|&x| !is_medoid[x])
        .map(|x| {
            // Each task gets its own bonus_by_h so there are no shared mutations.
            let mut bonus_by_h = vec![0.0_f64; k];
            let mut total_base = 0.0_f64;

            for i in 0..n {
                let d_ix = dist[[i, x]];
                total_base += (d_ix - d1[i]).min(0.0);
                let h_i = nearest_h[i];
                bonus_by_h[h_i] += d2[i].min(d_ix) - d1[i].min(d_ix);
            }

            // Best (h, delta) for this candidate x.
            let (best_h, best_delta) = (0..k)
                .map(|h| (h, total_base + bonus_by_h[h]))
                .min_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal))
                .unwrap_or((0, 0.0_f64));

            (best_h, x, best_delta)
        })
        .reduce_with(|a, b| if a.2 < b.2 { a } else { b })
        .unwrap_or((0, 0, 0.0))
}

/// Compute total PAM cost for the given medoids: Σ_i min_m d(i, m).
fn compute_total_cost(dist: &Array2<f64>, medoids: &[usize], n: usize) -> f64 {
    (0..n)
        .map(|i| medoids.iter().map(|&m| dist[[i, m]]).fold(f64::INFINITY, f64::min))
        .sum()
}

/// Assign each point to its nearest medoid; returns cluster index (0..k-1) per point.
fn compute_assignments(dist: &Array2<f64>, medoids: &[usize], n: usize, k: usize) -> Vec<usize> {
    (0..n)
        .map(|i| {
            (0..k)
                .min_by(|&a, &b| {
                    dist[[i, medoids[a]]]
                        .partial_cmp(&dist[[i, medoids[b]]])
                        .unwrap_or(std::cmp::Ordering::Equal)
                })
                .unwrap_or(0)
        })
        .collect()
}

/// Simple random medoid initialization (Fisher-Yates subset).
fn random_init_medoids(n: usize, k: usize, seed: Option<u64>) -> Vec<usize> {
    use rand::SeedableRng;
    use rand::seq::SliceRandom;
    use rand::rngs::StdRng;

    let mut rng: StdRng = match seed {
        Some(s) => StdRng::seed_from_u64(s),
        None    => StdRng::from_entropy(),
    };

    let mut indices: Vec<usize> = (0..n).collect();
    indices.shuffle(&mut rng);
    indices.truncate(k);
    indices
}

/// Compute per-object silhouette scores using an already-built distance matrix.
///
/// Reusing `dist` avoids rebuilding O(n²×d) distances — the matrix is already
/// built by `run_pam_single` so we only pay O(n²) indexed lookups here.
/// Access pattern: dist[[i, j]] with fixed i and varying j is a row access
/// in row-major layout → sequential → cache-friendly.
pub(crate) fn compute_silhouette_from_dist(
    dist: &Array2<f64>,
    assignments: &[usize],
    n: usize,
    k: usize,
) -> Vec<f64> {
    if k <= 1 || n == 0 {
        return vec![0.0; n];
    }

    // Build inverted index: cluster_indices[c] = sorted point indices in cluster c.
    let mut cluster_indices: Vec<Vec<usize>> = vec![vec![]; k];
    for (i, &c) in assignments.iter().enumerate() {
        if c < k {
            cluster_indices[c].push(i);
        }
    }

    let mut scores = vec![0.0f64; n];
    for i in 0..n {
        let ci = assignments[i];
        if ci >= k {
            continue;
        }
        let same = &cluster_indices[ci];
        if same.len() <= 1 {
            continue; // single-element cluster → silhouette undefined → 0
        }

        // a(i): mean distance to other points in the same cluster.
        // Row i is contiguous in memory → sequential reads → cache-friendly.
        let a_i: f64 = same
            .iter()
            .filter(|&&j| j != i)
            .map(|&j| dist[[i, j]])
            .sum::<f64>()
            / (same.len() - 1) as f64;

        // b(i): minimum mean distance to any other cluster.
        let mut b_i = f64::INFINITY;
        for c in 0..k {
            if c == ci {
                continue;
            }
            let other = &cluster_indices[c];
            if other.is_empty() {
                continue;
            }
            let avg = other.iter().map(|&j| dist[[i, j]]).sum::<f64>()
                / other.len() as f64;
            if avg < b_i {
                b_i = avg;
            }
        }

        if b_i < f64::INFINITY {
            let denom = a_i.max(b_i);
            scores[i] = if denom == 0.0 { 0.0 } else { (b_i - a_i) / denom };
        }
    }
    scores
}

/// Build an ndarray distance matrix from raw data.
///
/// When the `threading` feature is enabled (wasm-bindgen-rayon), computes the
/// O(n²/2) upper triangle in parallel across available CPU threads, which is
/// 4-8× faster on multi-core hardware.  Falls back to the sequential loop on
/// single-threaded WASM builds.
#[cfg(not(feature = "threading"))]
pub(crate) fn build_distance_matrix(data: &[Vec<f64>], metric: &DistanceMetric) -> Array2<f64> {
    let n = data.len();
    let mut dist = Array2::<f64>::zeros((n, n));

    for i in 0..n {
        for j in (i + 1)..n {
            let d = calculate_distance(&data[i], &data[j], metric);
            dist[[i, j]] = d;
            dist[[j, i]] = d;
        }
    }

    dist
}

/// Parallel version of build_distance_matrix (requires `threading` feature).
/// Uses rayon to compute the upper triangle concurrently, then writes the
/// symmetric lower triangle in a single sequential pass.
#[cfg(feature = "threading")]
pub(crate) fn build_distance_matrix(data: &[Vec<f64>], metric: &DistanceMetric) -> Array2<f64> {
    use rayon::prelude::*;
    let n = data.len();

    // Compute all upper-triangle (i, j, distance) triples in parallel.
    // Each row i is an independent unit of work; within a row, columns j>i
    // are computed sequentially to avoid spawning n²/2 tasks.
    let pairs: Vec<(usize, usize, f64)> = (0..n)
        .into_par_iter()
        .flat_map(|i| {
            ((i + 1)..n)
                .map(|j| (i, j, calculate_distance(&data[i], &data[j], metric)))
                .collect::<Vec<_>>()
        })
        .collect();

    let mut dist = Array2::<f64>::zeros((n, n));
    for (i, j, d) in pairs {
        dist[[i, j]] = d;
        dist[[j, i]] = d;
    }
    dist
}

/// Convert PAMResult to ClusteringResult for compatibility
impl From<PAMResult> for ClusteringResult {
    fn from(pam_result: PAMResult) -> Self {
        ClusteringResult {
            cluster_assignments: pam_result.assignments,
            medoid_indices: pam_result.medoids,
            total_cost: pam_result.total_cost,
            iterations: pam_result.iterations,
            converged: pam_result.converged,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pam_basic_clustering() {
        let data = vec![
            vec![0.0, 0.0],
            vec![1.0, 0.0],
            vec![0.0, 1.0],
            vec![10.0, 10.0],
            vec![11.0, 10.0],
            vec![10.0, 11.0],
        ];

        let config = PAMConfig {
            k: 2,
            metric: DistanceMetric::Euclidean,
            max_iterations: 100,
            use_build_phase: true,
            ..Default::default()
        };

        let result = run_pam(&data, &config).unwrap();

        assert_eq!(result.medoids.len(), 2);
        assert_eq!(result.assignments.len(), 6);

        let cluster0 = result.assignments[0];
        assert_eq!(result.assignments[1], cluster0);
        assert_eq!(result.assignments[2], cluster0);

        let cluster1 = result.assignments[3];
        assert_eq!(result.assignments[4], cluster1);
        assert_eq!(result.assignments[5], cluster1);

        assert_ne!(cluster0, cluster1);
        assert!(result.total_cost > 0.0);
        assert!(result.total_cost.is_finite());
    }

    #[test]
    fn test_pam_build_phase() {
        let data = vec![
            vec![0.0, 0.0],
            vec![1.0, 1.0],
            vec![10.0, 10.0],
            vec![11.0, 11.0],
        ];

        let config = PAMConfig {
            k: 2,
            use_build_phase: true,
            n_init: 1,
            ..Default::default()
        };

        let result = run_pam(&data, &config).unwrap();

        assert_eq!(result.medoids.len(), 2);
        // Medoids should come from different clusters
        assert!(
            (result.medoids[0] < 2 && result.medoids[1] >= 2)
                || (result.medoids[0] >= 2 && result.medoids[1] < 2)
        );
    }

    #[test]
    fn test_pam_random_init() {
        let data = vec![
            vec![0.0, 0.0],
            vec![1.0, 1.0],
            vec![2.0, 2.0],
            vec![3.0, 3.0],
        ];

        let config = PAMConfig {
            k: 2,
            use_build_phase: false,
            random_seed: Some(42),
            ..Default::default()
        };

        let result = run_pam(&data, &config).unwrap();

        assert_eq!(result.medoids.len(), 2);
        // With random init and a seeded RNG the algorithm needs at least 0 or
        // more swaps to converge; we only check that it ran without error and
        // produced a valid clustering.
        assert!(result.total_cost > 0.0);
        assert!(result.total_cost.is_finite());
    }

    #[test]
    fn test_pam_convergence() {
        let data = vec![
            vec![0.0],
            vec![1.0],
            vec![10.0],
            vec![11.0],
        ];

        let config = PAMConfig {
            k: 2,
            epsilon: 0.01,
            ..Default::default()
        };

        let result = run_pam(&data, &config).unwrap();

        for i in 1..result.cost_history.len() {
            assert!(result.cost_history[i] <= result.cost_history[i - 1] + 1e-10);
        }
    }

    #[test]
    fn test_pam_single_cluster() {
        let data = vec![
            vec![0.0, 0.0],
            vec![1.0, 1.0],
            vec![2.0, 2.0],
        ];

        let config = PAMConfig {
            k: 1,
            ..Default::default()
        };

        let result = run_pam(&data, &config).unwrap();

        assert_eq!(result.medoids.len(), 1);
        assert!(result.assignments.iter().all(|&c| c == 0));
    }

    #[test]
    fn test_pam_manhattan_distance() {
        let data = vec![
            vec![0.0, 0.0],
            vec![1.0, 0.0],
            vec![10.0, 10.0],
        ];

        let config = PAMConfig {
            k: 2,
            metric: DistanceMetric::Manhattan,
            ..Default::default()
        };

        let result = run_pam(&data, &config).unwrap();

        assert_eq!(result.medoids.len(), 2);
        assert!(result.total_cost > 0.0);
    }

    #[test]
    fn test_pam_invalid_k() {
        let data = vec![vec![0.0], vec![1.0]];

        let config = PAMConfig {
            k: 3, // k > n
            ..Default::default()
        };

        let result = run_pam(&data, &config);
        assert!(result.is_err());
    }
}
