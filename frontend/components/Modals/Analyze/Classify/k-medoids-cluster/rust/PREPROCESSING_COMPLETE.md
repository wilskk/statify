# Preprocessing untuk K-Medoids Clustering

## Status Saat Ini

Dokumen ini sudah disesuaikan dengan implementasi terbaru.

Pipeline preprocessing aktif untuk K-Medoids sekarang berfokus pada **missing value handling** agar konsisten dengan pendekatan K-Means yang dipakai di project ini.

## Cakupan Preprocessing Aktif

### 1. Missing Value Handling (`stats/preprocessing.rs`)

Fungsi utama:

```rust
pub fn preprocess_data(
    data: &[Vec<f64>],
    config: &PreprocessingConfig,
) -> Result<PreprocessedData, String>
```

Konfigurasi:

```rust
pub struct PreprocessingConfig {
    pub handle_missing: MissingValueStrategy,
}
```

Strategi:

```rust
pub enum MissingValueStrategy {
    RemoveRow,
    ReplaceWithMean,
    ReplaceWithMedian,
    ReplaceWithConstant(f64),
    KeepAsIs,
}
```

Output:

```rust
pub struct PreprocessedData {
    pub data: Vec<Vec<f64>>,
    pub original_indices: Vec<usize>,
    pub missing_rows_removed: usize,
}
```

## Alur Pipeline

1. Validasi input dataset.
2. Tangani nilai missing sesuai `handle_missing`.
3. Kembalikan data hasil preprocessing beserta pemetaan indeks asli.

## Catatan Konsistensi

- Normalisasi **tidak** menjadi bagian pipeline preprocessing K-Medoids aktif.
- Outlier detection/removal **tidak** menjadi bagian pipeline preprocessing K-Medoids aktif.
- Modul terkait normalisasi atau outlier dapat tetap ada sebagai utilitas/statistik terpisah, tetapi tidak dipakai pada alur preprocessing utama K-Medoids.

## Contoh Penggunaan

```rust
use crate::stats::preprocessing::{preprocess_data, PreprocessingConfig, MissingValueStrategy};

let config = PreprocessingConfig {
    handle_missing: MissingValueStrategy::RemoveRow,
};

let preprocessed = preprocess_data(&raw_data, &config)?;
```

## Ringkasan

Preprocessing K-Medoids sekarang dibuat minimal dan terfokus: **missing value handling only**.
Ini menghindari ketidaksesuaian dokumentasi vs implementasi, serta menjaga perilaku preprocessing tetap sejalan dengan kebutuhan project saat ini.
