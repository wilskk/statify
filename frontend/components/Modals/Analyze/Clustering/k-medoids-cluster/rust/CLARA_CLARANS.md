# CLARA & CLARANS Implementation Guide

## Overview

Implementasi lengkap dari dua algoritma K-Medoids lanjutan untuk handling dataset besar:

- **CLARA** (Clustering LARge Applications)
- **CLARANS** (Clustering Large Applications based on RANdomized Search)

Status: ✅ **COMPLETED** (Date: March 8, 2026)

## Implementation Summary

### Files Created

1. `src/algorithms/clara.rs` - CLARA algorithm implementation
2. `src/algorithms/clarans.rs` - CLARANS algorithm implementation
3. `test-algorithms.html` - Interactive comparison test UI

### Files Modified

1. `src/algorithms/mod.rs` - Added CLARA and CLARANS exports
2. `src/wasm/function.rs` - Added CLARA and CLARANS handlers
3. `README.md` - Updated documentation

## Algorithm Details

### CLARA (Clustering LARge Applications)

**Concept**: Sampling-based approach to make K-Medoids scalable

**Algorithm**:

```
1. Draw multiple random samples from dataset
2. Run PAM on each sample
3. For each PAM result, evaluate quality on full dataset
4. Return best clustering
```

**Configuration**:

```rust
CLARAConfig {
    k: usize,              // Number of clusters
    metric: DistanceMetric,
    num_samples: 5,        // Number of samples to try
    sample_size: 40 + 2*k, // Size of each sample
    max_iterations: 100,
    random_seed: Option<u64>,
    use_build_phase: true,
}
```

**Time Complexity**: O(num_samples × sample_size² × k × iterations)
**Space Complexity**: O(n²)

**Features**:

- ✅ Multiple sample runs for better exploration
- ✅ Automatic fallback to PAM for small datasets
- ✅ Configurable sample size
- ✅ Deterministic with seed
- ✅ 4 comprehensive unit tests

**When to Use**:

- Dataset > 1000 points
- Need faster results than PAM
- Quality still important
- Memory not a major constraint

### CLARANS (Clustering Large Applications based on RANdomized Search)

**Concept**: Random search in neighbor space instead of exhaustive search

**Algorithm**:

```
1. Start with random medoids
2. Randomly check neighbors (potential swaps)
3. Move to better neighbor if found
4. Stop after max_neighbors checks without improvement
5. Repeat for multiple local searches
6. Return best result
```

**Configuration**:

```rust
CLARANSConfig {
    k: usize,
    metric: DistanceMetric,
    num_local: 2,          // Number of local searches
    max_neighbors: 250,    // Max neighbors per search
    random_seed: Option<u64>,
}
```

**Auto Configuration**:

```rust
// Automatically calculates max_neighbors
CLARANSConfig::new(k, n, metric)
// max_neighbors = max(250, 1.25% of total neighbors)
```

**Time Complexity**: O(n² × num_local × max_neighbors)
**Space Complexity**: O(n²)

**Features**:

- ✅ Random neighbor sampling (efficient)
- ✅ Multiple local searches for better results
- ✅ Automatic max_neighbors calculation
- ✅ Reset counter on improvement
- ✅ 6 comprehensive unit tests

**When to Use**:

- Spatial/geographic data
- Medium to large datasets
- Need balance between PAM and CLARA
- Quality and speed both important

## Test Results

### Unit Tests

```bash
cargo test

running 33 tests
✅ All tests passed!

CLARA Tests:
  - test_clara_basic_clustering
  - test_clara_small_dataset_uses_pam
  - test_clara_invalid_sample_size
  - test_clara_deterministic_with_seed

CLARANS Tests:
  - test_clarans_basic_clustering
  - test_clarans_deterministic_with_seed
  - test_clarans_auto_max_neighbors
  - test_clarans_single_cluster
  - test_clarans_manhattan_distance
  - test_clarans_invalid_k
```

### WASM Build

```bash
wasm-pack build --target web --out-dir pkg

✅ Build successful!
✅ WASM module: pkg/wasm_bg.wasm (124 KB)
✅ JS bindings: pkg/wasm.js
✅ TypeScript definitions: pkg/wasm.d.ts
```

## JavaScript/WASM Interface

### Exported Functions

```typescript
export function run_k_medoids(input: {
  data: number[][];
  n_clusters: number;
  method: "PAM" | "CLARA" | "CLARANS";
  max_iterations: number;
  distance_metric: "euclidean" | "manhattan" | "minkowski";
  random_seed?: number;
}): KMedoidsOutput;
```

### Usage Examples

#### CLARA Example

```javascript
const result = run_k_medoids({
  data: largeDataset, // e.g., 5000 points
  n_clusters: 5,
  method: "CLARA",
  max_iterations: 100,
  distance_metric: "euclidean",
  random_seed: 42,
});
```

#### CLARANS Example

```javascript
const result = run_k_medoids({
  data: spatialData, // e.g., GPS coordinates
  n_clusters: 3,
  method: "CLARANS",
  max_iterations: 100,
  distance_metric: "euclidean",
  random_seed: 123,
});
```

## Performance Comparison

### Test Setup

- Dataset sizes: 50, 100, 200 points
- Number of clusters: 3
- Distance metric: Euclidean
- Random seed: 42

### Expected Results

| Algorithm | 50 points | 100 points | 200 points | Best For |
| --------- | --------- | ---------- | ---------- | -------- |
| PAM       | ~5ms      | ~20ms      | ~80ms      | Quality  |
| CLARA     | ~8ms      | ~15ms      | ~25ms      | Speed    |
| CLARANS   | ~6ms      | ~18ms      | ~40ms      | Balance  |

_Note: Actual times vary by hardware_

### Quality Metrics

All three algorithms should produce similar clustering quality (total cost within 5-10% of each other) for well-separated clusters.

## Interactive Testing

Open `test-algorithms.html` in browser:

```bash
python -m http.server 8080
# Navigate to http://localhost:8080/test-algorithms.html
```

**Features**:

- Individual algorithm tests
- Side-by-side comparison
- Performance metrics
- Visual results display
- Auto-generated test data

## Key Implementation Details

### CLARA Optimizations

1. **Small dataset handling**: Automatically uses PAM for datasets smaller than 2× sample size
2. **Sample diversity**: Each sample gets different seed for varied exploration
3. **Full dataset evaluation**: Always evaluates on full dataset, not just sample

### CLARANS Optimizations

1. **Neighbor reset**: Counter resets when improvement found (allows deeper exploration)
2. **Random sampling**: No need to check all neighbors (saves time)
3. **Multiple restarts**: num_local searches for better solution space coverage

### Error Handling

Both algorithms include comprehensive validation:

- Dataset size checks
- k validation (must be ≤ n)
- Sample size validation (CLARA)
- Dimension consistency
- Empty data handling

## Future Enhancements

### Potential Improvements

- [ ] **FastPAM**: Even faster PAM variant
- [ ] **Parallel CLARA**: Run samples in parallel with rayon
- [ ] **Adaptive CLARANS**: Dynamic max_neighbors based on convergence
- [ ] **Silhouette-guided**: Use silhouette score for better medoid selection
- [ ] **Online updates**: Add/remove points without full re-clustering

### Performance Optimizations

- [ ] SIMD for distance calculations
- [ ] GPU acceleration via wgpu
- [ ] Approximate nearest neighbors (for very large datasets)
- [ ] Lazy distance matrix computation

## References

1. Kaufman, L. and Rousseeuw, P.J. (1990)
   "Finding Groups in Data: An Introduction to Cluster Analysis"
   - Original PAM and CLARA algorithms

2. Ng, R.T. and Han, J. (1994)
   "Efficient and Effective Clustering Methods for Spatial Data Mining"
   - CLARANS algorithm

3. Schubert, E. and Rousseeuw, P.J. (2019)
   "Faster k-Medoids Clustering: Improving the PAM, CLARA, and CLARANS Algorithms"
   - Modern optimizations

## Troubleshooting

### Common Issues

**Issue**: CLARA slower than expected
**Solution**: Increase sample_size or reduce num_samples

**Issue**: CLARANS not finding good clusters
**Solution**: Increase num_local or max_neighbors

**Issue**: Results not reproducible
**Solution**: Always set random_seed for deterministic results

**Issue**: Out of memory
**Solution**: Use CLARA with smaller sample_size

## Conclusion

✅ CLARA and CLARANS successfully implemented
✅ All tests passing (33/33)
✅ WASM module compiled and working
✅ Interactive test UI created
✅ Documentation complete

Both algorithms are production-ready and can handle datasets from small (tens of points) to large (thousands of points) efficiently.
