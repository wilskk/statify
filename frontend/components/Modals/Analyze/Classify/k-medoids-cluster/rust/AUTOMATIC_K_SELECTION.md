# Automatic K Selection Implementation

**Implementation Date**: March 8, 2026  
**Feature**: Automatic optimal k (number of clusters) selection for K-Medoids clustering

## ✨ What Was Implemented

### Overview

Sebelumnya, K-Medoids cluster hanya mendukung **Manual mode** dimana user harus menentukan jumlah cluster (k) secara eksplisit. Sekarang sudah diimplementasikan **Automatic mode** yang secara otomatis mencari nilai k optimal dalam rentang yang ditentukan user.

### Features Added

#### 1. **Silhouette Score Method**

Metode evaluasi clustering yang mengukur seberapa baik sebuah data point cocok dengan clusternya dibandingkan dengan cluster lainnya.

**Formula:**

```
s(i) = (b(i) - a(i)) / max(a(i), b(i))
```

Where:

- `a(i)` = rata-rata jarak point i ke semua point di cluster yang sama
- `b(i)` = rata-rata jarak point i ke cluster terdekat yang berbeda
- Range: -1 (worst) to +1 (best)
- **Higher is better**

**Implementation**: `calculateSilhouetteScore()`

- Calculate silhouette coefficient untuk setiap data point
- Return rata-rata silhouette score
- Optimal k = k dengan silhouette score tertinggi

#### 2. **Elbow Method**

Metode yang mencari "siku" pada kurva WCSS (Within-Cluster Sum of Squares) vs k.

**Concept:**

- Calculate WCSS untuk setiap k
- WCSS menurun drastis di awal
- Setelah k optimal, penurunan melambat
- "Siku" = titik dimana rate of decrease berubah tajam

**Implementation**:

- `calculateWCSS()` - Hitung within-cluster sum of squares
- `findOptimalKElbow()` - Deteksi elbow point menggunakan second derivative approximation

#### 3. **Automatic K Selection Algorithm**

Main algorithm yang menjalankan process automatic selection:

**Steps:**

1. **Initialize**: Get k range (kMin to kMax) dan evaluation method
2. **Iterate**: Untuk setiap k dalam range:
   - Run clustering dengan k clusters
   - Calculate evaluation metric (Silhouette atau WCSS)
   - Store result dan score
3. **Select**: Pilih k optimal:
   - Silhouette: k dengan score tertinggi
   - Elbow: k di titik "siku" kurva
4. **Return**: Final result dengan k optimal

## 📊 Implementation Details

### File Modified

**`services/k-medoids-cluster-analysis.ts`**

### Functions Added

#### 1. `euclideanDistance(p1: number[], p2: number[]): number`

```typescript
/**
 * Calculate Euclidean distance between two points
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Euclidean distance
 */
```

#### 2. `calculateSilhouetteScore(data: number[][], labels: number[], n_clusters: number): number`

```typescript
/**
 * Calculate Silhouette Score for a clustering result
 * @param data - Data matrix (n x d)
 * @param labels - Cluster assignments (length n)
 * @param n_clusters - Number of clusters
 * @returns Average silhouette score (-1 to 1, higher is better)
 */
```

#### 3. `calculateWCSS(data: number[][], labels: number[], medoidIndices: number[]): number`

```typescript
/**
 * Calculate within-cluster sum of squares (WCSS) for Elbow method
 * @param data - Data matrix
 * @param labels - Cluster assignments
 * @param medoidIndices - Indices of medoids
 * @returns WCSS value (lower indicates tighter clusters)
 */
```

#### 4. `findOptimalKElbow(kValues: number[], wcssValues: number[]): number`

```typescript
/**
 * Find optimal k using Elbow method
 * @param kValues - Array of k values tested
 * @param wcssValues - Array of corresponding WCSS values
 * @returns Optimal k at elbow point
 */
```

### Main Function Updated

**`analyzeKMedoidsCluster()`** - Now supports both modes:

#### Manual Mode (Existing)

```typescript
configData.main.ClusterMode === ClusterMode.Manual;
// Uses configData.main.Cluster (user-specified k)
```

#### Automatic Mode (NEW)

```typescript
configData.main.ClusterMode === ClusterMode.Automatic;
// Tests k from AutoKMin to AutoKMax
// Uses AutoKMethod (Silhouette or Elbow)
// Returns optimal k and evaluation scores
```

## 🎯 Usage Examples

### Example 1: Automatic with Silhouette

```typescript
const result = await analyzeKMedoidsCluster({
  configData: {
    main: {
      ClusterMode: ClusterMode.Automatic,
      AutoKMin: 2,
      AutoKMax: 10,
      AutoKMethod: AutoKMethod.Silhouette,
      DistanceMetric: DistanceMetric.Euclidean,
      // ... other fields
    },
    iterate: {
      Method: KMedoidsMethod.PAM,
      MaximumIterations: 100,
      // ... other fields
    },
  },
  dataVariables: yourData,
  variables: yourVariables,
  onProgress: (progress) => {
    console.log(`${progress.message} (${progress.progress}%)`);
  },
});

// Result includes:
// - result.automaticKSelection.optimalK
// - result.automaticKSelection.scores (array of {k, score})
// - result.automaticKSelection.method
```

### Example 2: Automatic with Elbow

```typescript
const result = await analyzeKMedoidsCluster({
  configData: {
    main: {
      ClusterMode: ClusterMode.Automatic,
      AutoKMin: 3,
      AutoKMax: 15,
      AutoKMethod: AutoKMethod.Elbow, // Use Elbow method
      // ...
    },
    // ...
  },
  // ...
});

// Optimal k found at "elbow" of WCSS curve
console.log("Optimal k:", result.automaticKSelection.optimalK);
```

## 📈 Progress Updates

During automatic k selection, progress updates are sent:

```
Progress 0%:   "Testing k=2 (1/9)..."
Progress 11%:  "Testing k=3 (2/9)..."
Progress 22%:  "Testing k=4 (3/9)..."
...
Progress 90%:  "Testing k=10 (9/9)..."
Progress 95%:  "Optimal k found: 5"
Progress 100%: "Analysis complete!"
```

## 🔄 Algorithm Flow

```
User selects Automatic mode
    ↓
Set kMin = 2, kMax = 10, method = Silhouette
    ↓
┌──────────────────────────────────┐
│ For k = 2 to 10:                 │
│   1. Run clustering with k       │
│   2. Calculate Silhouette Score  │
│   3. Store result & score        │
└──────────────────────────────────┘
    ↓
Find k with highest Silhouette
    ↓
k=5 has best score (0.67)
    ↓
Return clustering result with k=5
```

## 📊 Return Value Structure

### Manual Mode

```typescript
{
    success: true,
    message: "K-Medoids analysis completed successfully",
    result: {
        labels: number[],
        medoids: number[],
        cost: number,
        iterations: number,
        converged: boolean
    },
    config: KMedoidsClusterType
}
```

### Automatic Mode

```typescript
{
    success: true,
    message: "K-Medoids analysis completed successfully (automatic k=5)",
    result: {
        labels: number[],
        medoids: number[],
        cost: number,
        iterations: number,
        converged: boolean
    },
    config: KMedoidsClusterType,
    automaticKSelection: {            // NEW!
        method: "silhouette",
        testedRange: { min: 2, max: 10 },
        scores: [
            { k: 2, score: 0.45 },
            { k: 3, score: 0.58 },
            { k: 4, score: 0.62 },
            { k: 5, score: 0.67 },    // ← Optimal
            { k: 6, score: 0.61 },
            // ...
        ],
        optimalK: 5,
        optimalScore: 0.67
    }
}
```

## 🧪 Testing

### Test Case 1: Small k Range with Silhouette

```typescript
ClusterMode: Automatic
AutoKMin: 2
AutoKMax: 5
AutoKMethod: Silhouette

Expected:
- Runs 4 clustering operations (k=2,3,4,5)
- Calculates silhouette for each
- Returns k with highest silhouette
```

### Test Case 2: Large k Range with Elbow

```typescript
ClusterMode: Automatic
AutoKMin: 2
AutoKMax: 20
AutoKMethod: Elbow

Expected:
- Runs 19 clustering operations
- Calculates WCSS for each
- Detects elbow point in WCSS curve
- Returns k at elbow (typically much less than 20)
```

### Test Case 3: Edge Cases

```typescript
// kMin = kMax (invalid)
AutoKMin: 5
AutoKMax: 5
Expected: Error "AutoKMin must be less than AutoKMax"

// kMin > kMax (invalid)
AutoKMin: 10
AutoKMax: 5
Expected: Error "AutoKMin must be less than AutoKMax"

// Very large range (performance test)
AutoKMin: 2
AutoKMax: 50
Expected: Takes time but completes successfully
```

## 🎨 UI Integration

The UI (dialog.tsx) already has:

- ✅ Radio button for Manual/Automatic mode
- ✅ Input fields for AutoKMin, AutoKMax
- ✅ Dropdown for AutoKMethod (Silhouette/Elbow)
- ✅ Validation to ensure kMin < kMax

The implementation in service layer now **fully supports** these UI features!

## 📝 Performance Considerations

### Time Complexity

- **Manual mode**: One clustering run → O(n²k) for PAM
- **Automatic mode**: (kMax - kMin + 1) clustering runs → O((kMax - kMin) × n²k)
- **Silhouette calculation**: O(n²) per k
- **WCSS calculation**: O(n) per k

### Example Performance

```
Dataset: 1000 points, 5 dimensions
k Range: 2 to 10 (9 values)

PAM per run: ~500ms
Silhouette per k: ~100ms

Total time:
- 9 clustering runs: 9 × 500ms = 4.5s
- 9 silhouette calculations: 9 × 100ms = 0.9s
- Total: ~5.4 seconds

User sees progress updates every ~600ms!
```

### Recommendations

- **Small datasets (<500 points)**: k range 2-10 is fine
- **Medium datasets (500-2000)**: Consider k range 2-8
- **Large datasets (>2000)**: Use CLARA method + k range 2-6
- **Very large (>5000)**: Consider manual mode or preprocess data

## 🎓 Algorithm Comparison

### Silhouette Method

**Pros:**

- ✅ Intuitive interpretation (-1 to 1)
- ✅ Works well for well-separated clusters
- ✅ Penalizes poorly clustered points
- ✅ Widely used and proven

**Cons:**

- ❌ O(n²) complexity (slow for large datasets)
- ❌ Sensitive to outliers
- ❌ May favor smaller k if clusters overlap

**Best for:**

- Small to medium datasets (<2000 points)
- Well-separated clusters
- When cluster quality matters more than speed

### Elbow Method

**Pros:**

- ✅ Fast (O(n) per k)
- ✅ Simple to understand (look for "elbow")
- ✅ Works well with varying cluster sizes
- ✅ Less sensitive to outliers

**Cons:**

- ❌ Elbow point not always clear
- ❌ May suggest too many clusters
- ❌ Subjective interpretation

**Best for:**

- Large datasets (>2000 points)
- Exploratory analysis
- When speed is important
- Initial k estimation

## 📚 References

1. **Silhouette Analysis**:
   - Rousseeuw, P. J. (1987). "Silhouettes: A graphical aid to the interpretation and validation of cluster analysis"
2. **Elbow Method**:
   - Thorndike, R. L. (1953). "Who belongs in the family?"

3. **K-Medoids (PAM)**:
   - Kaufman, L. and Rousseeuw, P.J. (1990). "Finding Groups in Data: An Introduction to Cluster Analysis"

## ✅ Status

- ✅ **Silhouette Score**: Implemented and tested
- ✅ **Elbow Method**: Implemented and tested
- ✅ **Automatic K Selection**: Fully functional
- ✅ **Progress Updates**: Working
- ✅ **Error Handling**: Complete
- ✅ **TypeScript Types**: All typed
- ✅ **Documentation**: Complete
- ✅ **UI Integration**: Compatible

**Production Ready**: YES 🎉

## 🚀 Next Steps

Optional enhancements for future:

1. **Gap Statistic**: Another method for optimal k selection
2. **Davies-Bouldin Index**: Alternative cluster evaluation metric
3. **Parallel Execution**: Run multiple k values in parallel
4. **Visualization**: Plot silhouette/elbow curves
5. **Caching**: Save results for different k values
6. **Smart Range**: Auto-suggest reasonable k range based on data size

---

**Implementation Complete**: All variable section features including automatic k selection are now fully implemented and ready for production use!
