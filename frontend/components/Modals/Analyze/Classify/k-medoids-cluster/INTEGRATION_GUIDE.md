# K-Medoids Comprehensive Output Integration Guide

## 📋 Overview

Sistem output komprehensif K-Medoids yang menyediakan visualisasi lengkap seperti SPSS dan RapidMiner.

### Komponen yang Telah Dibuat

✅ **1. Type Definitions** (`types/output.ts`)

- `KMedoidsOutput`: Interface utama
- 15+ sub-interfaces untuk semua komponen

✅ **2. Data Generator** (`services/k-medoids-cluster-comprehensive-output.ts`)

- Generasi semua data visualisasi
- Fallback TypeScript untuk silhouette calculation
- 764 baris kode lengkap

✅ **3. React Components**

- `SummaryCards.tsx`: 6 kartu metrik ringkasan
- `ChartFormatters.tsx`: 6 formatter untuk chart (scatter, donut, radar, convergence, silhouette, elbow)
- `DistanceMatrix.tsx`: Heatmap jarak antar medoid
- `ClusterProfiles.tsx`: Profil detail tiap cluster dengan progress bars
- `OutputRenderer.tsx`: Main component yang menggabungkan semua

✅ **4. Rust Silhouette Module** (`rust/src/stats/silhouette.rs`)

- Perhitungan silhouette score di Rust
- Export ke WASM (perlu update wasm binding)

---

## 🔧 Langkah Integrasi

### Step 1: Update WASM Output Structure

File: `rust/src/models/mod.rs`

```rust
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct KMedoidsOutput {
    pub cluster_assignments: Vec<usize>,
    pub medoids: Vec<usize>,
    pub total_cost: f64,
    pub iterations: usize,
    pub converged: bool,

    // NEW: Add silhouette scores
    #[serde(skip_serializing_if = "Option::is_none")]
    pub silhouette_scores: Option<Vec<f64>>,

    // NEW: Add iteration history
    #[serde(skip_serializing_if = "Option::is_none")]
    pub iteration_history: Option<Vec<IterationCost>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct IterationCost {
    pub iteration: usize,
    pub cost: f64,
}
```

### Step 2: Update WASM Function Exports

File: `rust/src/wasm/function.rs`

```rust
use crate::stats::silhouette::{calculate_all_silhouettes, calculate_silhouette_per_cluster};

pub fn run_k_medoids(input: KMedoidsInput) -> Result<KMedoidsOutput, String> {
    // ... existing code ...

    // Calculate silhouette scores
    let silhouette_scores = if let Some(ref data) = input.data {
        Some(calculate_all_silhouettes(
            data,
            &result.cluster_assignments,
            &input.distance_metric,
        ))
    } else {
        None
    };

    Ok(KMedoidsOutput {
        cluster_assignments: result.cluster_assignments,
        medoids: result.medoids,
        total_cost: result.total_cost,
        iterations: result.iterations,
        converged: result.converged,
        silhouette_scores,
        iteration_history: result.iteration_history, // If PAM tracks this
    })
}
```

### Step 3: Update Main Analysis Service

File: `services/k-medoids-cluster-analysis.ts`

```typescript
import { generateComprehensiveKMedoidsOutput } from './k-medoids-cluster-comprehensive-output';

export const runKMedoidsAnalysis = async (...) => {
    // ... existing WASM call ...

    // Generate comprehensive output
    await generateComprehensiveKMedoidsOutput(
        data,
        result,
        variables,
        parameters
    );

    // Show success toast
    toast.success("Analysis complete! View comprehensive results below.");
};
```

### Step 4: Update ResultOutput Component

File: `components/Output/ResultOutput.tsx`

```typescript
import { KMedoidsOutputRenderer } from '@/components/Modals/Analyze/Classify/k-medoids-cluster/components/OutputRenderer';

export default function ResultOutput() {
    const selectedResult = useResultStore(state => state.selectedResult);

    // Parse result data
    if (!selectedResult?.data) return null;

    try {
        const parsedData = JSON.parse(selectedResult.data);

        // Check if K-Medoids comprehensive output
        if (parsedData.type === 'k-medoids-comprehensive') {
            return (
                <div className="p-6">
                    <KMedoidsOutputRenderer
                        output={parsedData.data}
                        variables={selectedResult.variables || []}
                    />
                </div>
            );
        }

        // Existing table-based output
        if (parsedData.tables) {
            return <DataTableRenderer data={selectedResult.data} />;
        }

    } catch (error) {
        console.error('Failed to parse result data:', error);
    }

    return <div>Invalid result format</div>;
}
```

### Step 5: Integrate Charts with GeneralChartContainer

File: `components/Output/ResultOutput.tsx` atau `OutputRenderer.tsx`

```typescript
import GeneralChartContainer from '@/components/Output/Chart/GeneralChartContainer';

// Inside OutputRenderer.tsx, replace placeholder divs:

// Scatter Plot
<GeneralChartContainer
    data={formatScatterPlotData(output, selectedXVar, selectedYVar)}
    height={400}
/>

// Donut Chart
<GeneralChartContainer
    data={formatDonutChartData(output)}
    height={400}
/>

// Radar Chart
<GeneralChartContainer
    data={formatRadarChartData(output, variables)}
    height={400}
/>

// Convergence Chart
<GeneralChartContainer
    data={formatConvergenceChartData(output)}
    height={400}
/>

// Silhouette Bar Chart
<GeneralChartContainer
    data={formatSilhouetteBarChartData(output)}
    height={400}
/>

// Elbow Chart
{output.elbowData && (
    <GeneralChartContainer
        data={formatElbowChartData(output)}
        height={400}
    />
)}
```

---

## 📊 Struktur Data Output

### JSON Format yang Disimpan

```json
{
  "type": "k-medoids-comprehensive",
  "data": {
    "summary": {
      "numClusters": 3,
      "totalCost": 125.45,
      "averageSilhouetteScore": 0.67,
      "converged": true,
      "iterations": 5,
      "largestCluster": { "id": 1, "label": "Cluster 1", "size": 45 },
      "smallestCluster": { "id": 3, "label": "Cluster 3", "size": 15 }
    },

    "assignments": [
      {
        "objectId": 1,
        "clusterId": 0,
        "clusterLabel": "Cluster 1",
        "distanceToMedoid": 12.34,
        "silhouetteScore": 0.72,
        "attributes": { "var1": 10, "var2": 20 },
        "isMedoid": false
      },
      // ... more objects
    ],

    "medoids": [
      {
        "clusterId": 0,
        "clusterLabel": "Cluster 1",
        "medoidId": 5,
        "attributes": { "var1": 15, "var2": 25 }
      },
      // ... more medoids
    ],

    "clusterProfiles": [
      {
        "clusterId": 0,
        "clusterLabel": "Cluster 1",
        "size": 45,
        "percentage": 45.0,
        "medoidId": 5,
        "averageDistanceToMedoid": 18.5,
        "silhouetteScore": 0.68,
        "attributeProfiles": [
          { "variableName": "var1", "mean": 15.2, "min": 5, "max": 25, "normalized": 0.6 }
        ]
      },
      // ... more clusters
    ],

    "iterationHistory": [
      { "iteration": 1, "totalCost": 200.0, "improvement": 0 },
      { "iteration": 2, "totalCost": 150.0, "improvement": 50.0 },
      // ... more iterations
    ],

    "elbowData": [
      { "k": 2, "cost": 250.0 },
      { "k": 3, "cost": 125.45 },
      { "k": 4, "cost": 110.0 }
    ],

    "medoidDistanceMatrix": {
      "medoidIds": [5, 12, 30],
      "clusterLabels": ["Cluster 1", "Cluster 2", "Cluster 3"],
      "distances": [
        [0, 45.2, 67.8],
        [45.2, 0, 52.1],
        [67.8, 52.1, 0]
      ]
    },

    "silhouetteScores": {
      "overall": 0.67,
      "perCluster": [
        { "clusterId": 0, "label": "Cluster 1", "score": 0.68 }
      ],
      "perObject": [0.72, 0.65, 0.81, ...]
    },

    "tables": [
      {
        "key": "medoids",
        "title": "Cluster Medoids",
        "columnHeaders": [...],
        "rows": [...]
      }
    ]
  }
}
```

---

## 🎨 Component Usage Examples

### 1. Summary Cards

```tsx
import { KMedoidsSummaryCards } from "./components/SummaryCards";

<KMedoidsSummaryCards summary={output.summary} />;
```

### 2. Cluster Profiles

```tsx
import { ClusterProfilesComponent } from "./components/ClusterProfiles";

<ClusterProfilesComponent
  profiles={output.clusterProfiles}
  variables={variables}
/>;
```

### 3. Distance Matrix

```tsx
import { DistanceMatrixHeatmap } from "./components/DistanceMatrix";

<DistanceMatrixHeatmap matrix={output.medoidDistanceMatrix} />;
```

### 4. Charts

```tsx
import { formatScatterPlotData, formatDonutChartData } from './components/ChartFormatters';
import GeneralChartContainer from '@/components/Output/Chart/GeneralChartContainer';

// Scatter
<GeneralChartContainer
    data={formatScatterPlotData(output, 'var1', 'var2')}
    height={400}
/>

// Donut
<GeneralChartContainer
    data={formatDonutChartData(output)}
    height={400}
/>
```

---

## 🧪 Testing Checklist

### Unit Tests

- [ ] Test silhouette calculation (Rust)
- [ ] Test output generator with mock data
- [ ] Test chart formatters with edge cases
- [ ] Test component rendering with jest

### Integration Tests

- [ ] Test full analysis flow
- [ ] Test WASM → TypeScript data mapping
- [ ] Test ResultOutput detection of comprehensive type
- [ ] Test chart rendering with GeneralChartContainer

### UI Tests

- [ ] Test responsive layouts (mobile, tablet, desktop)
- [ ] Test tab navigation
- [ ] Test variable selector for scatter plot
- [ ] Test table sorting and pagination
- [ ] Test color accessibility (contrast ratios)

### Performance Tests

- [ ] Test with large datasets (1000+ objects)
- [ ] Test with many clusters (10+)
- [ ] Test chart rendering performance
- [ ] Test memory usage

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot read property 'assignments' of undefined"

**Solution**: Check that output format is correct:

```typescript
if (parsedData.type === "k-medoids-comprehensive" && parsedData.data) {
  // Safe to use parsedData.data.assignments
}
```

### Issue 2: Silhouette scores all 0

**Solution**:

1. Check WASM is exporting silhouette_scores
2. Fallback TypeScript calculation should work
3. Verify distance calculations are correct

### Issue 3: Charts not rendering

**Solution**:

1. Check GeneralChartContainer accepts chart type
2. Verify chart data format matches expected structure
3. Check for console errors in browser

### Issue 4: Tables showing [object Object]

**Solution**:

```typescript
// Ensure proper object-to-string conversion
rows: data.map((item) => ({
  ...item,
  // Convert objects to strings
  attribute: JSON.stringify(item.attribute),
}));
```

---

## 📈 Future Enhancements

### Priority 1: Essential

- [ ] Export results to CSV/Excel
- [ ] Print-friendly layout
- [ ] Save chart as image
- [ ] Advanced filtering in tables

### Priority 2: Nice-to-Have

- [ ] 3D scatter plot visualization
- [ ] Animated transitions between clusters
- [ ] Cluster comparison tool
- [ ] Custom color palettes
- [ ] Annotate medoids with custom labels

### Priority 3: Advanced

- [ ] Interactive cluster editing
- [ ] Outlier detection highlighting
- [ ] Cluster stability analysis
- [ ] Multi-run comparison
- [ ] Cluster merging/splitting suggestions

---

## 📚 References

### Silhouette Score Interpretation

- **0.7 - 1.0**: Very strong cluster structure
- **0.5 - 0.7**: Strong cluster structure
- **0.3 - 0.5**: Moderate cluster structure (consider different K)
- **< 0.3**: Weak cluster structure (reconsider clustering)

### Distance Matrix Interpretation

- **Green (low distance)**: Clusters very similar, may need merging
- **Yellow (medium distance)**: Moderately separated clusters
- **Red (high distance)**: Well-separated clusters (ideal)

### Chart Types

1. **Scatter Plot**: 2D projection with medoid markers (★)
2. **Donut Chart**: Cluster size distribution
3. **Radar Chart**: Mean attribute values per cluster
4. **Line Chart**: Convergence history (cost reduction)
5. **Bar Chart**: Silhouette scores per cluster
6. **Elbow Chart**: Optimal K selection

---

## 🔗 Related Files

### Core Files

- [`types/output.ts`](types/output.ts) - Type definitions
- [`services/k-medoids-cluster-comprehensive-output.ts`](services/k-medoids-cluster-comprehensive-output.ts) - Data generator
- [`components/OutputRenderer.tsx`](components/OutputRenderer.tsx) - Main renderer

### Component Files

- [`components/SummaryCards.tsx`](components/SummaryCards.tsx)
- [`components/ClusterProfiles.tsx`](components/ClusterProfiles.tsx)
- [`components/DistanceMatrix.tsx`](components/DistanceMatrix.tsx)
- [`components/ChartFormatters.tsx`](components/ChartFormatters.tsx)

### Rust Files

- [`rust/src/stats/silhouette.rs`](../../rust/src/stats/silhouette.rs)
- [`rust/src/models/mod.rs`](../../rust/src/models/mod.rs)
- [`rust/src/wasm/function.rs`](../../rust/src/wasm/function.rs)

---

## ✅ Integration Complete Checklist

- [x] Type definitions created
- [x] Silhouette calculation implemented (Rust)
- [x] Comprehensive output generator created
- [x] All React components created (5 components)
- [x] Main renderer component created
- [ ] WASM updated to export silhouette scores
- [ ] WASM updated to export iteration history
- [ ] ResultOutput.tsx updated to detect comprehensive type
- [ ] Charts integrated with GeneralChartContainer
- [ ] Testing completed
- [ ] Documentation reviewed

**Status**: 70% Complete - Ready for integration and testing

---

## 🚀 Quick Start

1. **Rebuild WASM** (after updating Rust code):

   ```bash
   cd rust
   wasm-pack build --target web --out-dir ../frontend/wasm
   ```

2. **Test output generator** (in TypeScript):

   ```typescript
   import { generateComprehensiveKMedoidsOutput } from "./services/...";

   await generateComprehensiveKMedoidsOutput(data, result, variables, params);
   ```

3. **Check saved output**:
   - Open IndexedDB browser dev tools
   - Check `results` store
   - Find entry with `type: "k-medoids-comprehensive"`

4. **View in UI**:
   - Run analysis
   - Check Results sidebar
   - Click on result to see comprehensive output

---

_Last Updated: [Current Date]_  
_Maintained by: K-Medoids Module Development Team_
