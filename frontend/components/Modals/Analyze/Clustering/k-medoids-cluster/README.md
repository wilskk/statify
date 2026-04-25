# K-Medoids Cluster

## Overview

K-Medoids Cluster adalah algoritma clustering yang mirip dengan K-Means, tetapi menggunakan medoid (data point aktual) sebagai pusat cluster alih-alih rata-rata (centroid).

## Status

🚧 **Dalam Pengembangan** - UI sudah aktif dengan dummy implementation

## Struktur Folder

```
k-medoids-cluster/
├── dialogs/
│   ├── k-medoids-cluster-main.tsx  # Entry point modal
│   ├── dialog.tsx                   # Dialog utama dengan variable manager
│   ├── iterate.tsx                  # Konfigurasi iterasi dan distance metric
│   ├── save.tsx                     # Konfigurasi output yang disimpan
│   └── options.tsx                  # Opsi statistik dan plot
├── services/
│   └── k-medoids-cluster-analysis.ts # Dummy service (TODO: implement)
├── types/
│   └── k-medoids-cluster.ts         # Type definitions
├── constants/
│   └── k-medoids-cluster-default.ts # Default values
└── hooks/                           # (placeholder untuk future hooks)
```

## Parameter Utama

### Iterate Dialog

- **Maximum Iterations**: Jumlah maksimum iterasi (1-999)
- **Convergence Criterion**: Kriteria konvergensi (0-1)
- **Distance Metric**:
  - Euclidean distance
  - Manhattan distance

### Save Dialog

- **Cluster Membership**: Simpan keanggotaan cluster untuk setiap case
- **Distance from Cluster Center**: Simpan jarak dari pusat cluster

### Options Dialog

- **Statistics**:
  - Initial cluster centers
  - ANOVA table
  - Cluster information for each case
- **Plots**: Cluster plot (disabled)
- **Missing Values**: Exclude listwise/pairwise

## TODO

- [ ] Implementasi algoritma K-Medoids
- [ ] Integrasi dengan backend/WASM
- [ ] Formatter untuk hasil analisis
- [ ] Output handler
- [ ] Unit tests
- [ ] Tour guide hooks

## Perbedaan dengan K-Means

1. **Pusat Cluster**: K-Medoids menggunakan data point aktual (medoid), K-Means menggunakan centroid
2. **Robust terhadap outlier**: K-Medoids lebih robust karena medoid adalah data point aktual
3. **Distance Metric**: K-Medoids mendukung Euclidean dan Manhattan distance

## Usage

Modal ini terintegrasi dengan sistem modal terpusat aplikasi melalui `ModalType.ANALYZE_CLASSIFY_K_MEDOIDS_CLUSTER`.

## Related Files

- Registry: `/components/Modals/Analyze/Classify/ClassifyRegistry.tsx`
- IndexedDB Types: `/hooks/useIndexedDB.ts` (AnalysisType: "KMedoidsCluster")
