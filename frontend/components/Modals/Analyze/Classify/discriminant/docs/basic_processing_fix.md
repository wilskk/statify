# Analisis Bug Perhitungan Matematika Discriminant Analysis

## Overview
Dokumen ini menganalisis bug dan masalah dalam implementasi perhitungan matematika discriminant analysis yang menyebabkan perbedaan hasil dengan SPSS.

---

## 1. Bug: Double Counting `both_missing` di basic_processing.rs

### Lokasi
`frontend/components/Modals/Analyze/Classify/discriminant/rust/src/stats/basic_processing.rs:50-61`

### Masalah
Variabel `both_missing` dihitung 2 kali - sekali di blok kondisi dan sekali saat menjumlahkan `excluded_cases`.

```rust
if has_missing_group && has_missing_disc {
    both_missing += 1;  // Counting first time
} else if has_missing_group {
    missing_group_codes += 1;
} else if has_missing_disc {
    missing_disc_vars += 1;
}

let excluded_cases = missing_group_codes + missing_disc_vars + both_missing;  // Counting second time!
```

### Dampak
- `excluded_cases` terlalu besar karena `both_missing` di-count 2 kali
- `valid_cases` menjadi terlalu kecil
- `valid_percent` dan `total_excluded_percent` menjadi tidak akurat

### Status
**NEEDS REVIEW** - Logika struktural sebenarnya sudah benar (masing-masing case hanya masuk satu branch),
tapi perlu diverifikasi apakah ada edge case dimana suatu record dihitung di `both_missing` tapi juga
memenuhi kondisi lain. Perlu dicek apakah ada overlapping logic.

---

## 2. Bug FIXED: Index Mismatch di data extraction (common.rs:172-207)

### Lokasi
`frontend/components/Modals/Analyze/Classify/discriminant/rust/src/stats/common.rs`

### Masalah (SEBELUM)
```rust
if let Some((var_idx, _)) = data.independent_data.iter().enumerate().find(|(idx, _))| {
    *idx < independent_variables.len() && &independent_variables[*idx] == var_name
}) {
    let var_data = &data.independent_data[var_idx];  // var_idx dari independent_variables, bukan independent_data!
```

`var_idx` adalah index dari `independent_variables`, tapi digunakan untuk indexing `data.independent_data`.
Jika urutan variabel berbeda antara `independent_variables` dan `data.independent_data`, akan mengambil data yang salah.

### Fix (SUDAH DITERAPKAN)
```rust
// FIX: Find the correct variable in independent_data by checking if the variable name exists in records
let var_data_opt = data.independent_data.iter().find(|records| {
    records.iter().any(|record| record.values.contains_key(var_name))
});

if let Some(var_data) = var_data_opt {
    // Gunakan var_data langsung
} else {
    // Fallback: coba cari berdasarkan index jika variable tidak ditemukan berdasarkan nama
    if let Some(var_idx) = independent_variables.iter().position(|v| v == var_name) {
        // ... rest of the code
    }
}
```

### Status
**FIXED** ✅

---

## 3. Perbaikan: Standardized Coefficients (canonical_function.rs:392-413)

### Lokasi
`frontend/components/Modals/Analyze/Classify/discriminant/rust/src/stats/canonical_function.rs`

### Penjelasan
Implementasi standardized coefficients menggunakan pooled within-group standard deviation:

```rust
// Standardized coefficients = Unstandardized × Pooled_Within_StD
// This follows SPSS convention for standardized canonical discriminant function coefficients
let std_dev = pooled_within[(i, i)].sqrt();
let std_coef = eigenvectors[var_idx][func_idx] * std_dev;
```

### Status
**DOCUMENTED** - Implementasi sudah benar dan mengikuti konvensi SPSS. Perlu diverifikasi dengan output SPSS yang sebenarnya.

---

## 4. Bug FIXED: Wilks' Lambda Exact F Test (statistical_test.rs:145-178)

### Lokasi
`frontend/components/Modals/Analyze/Classify/discriminant/rust/src/stats/statistical_test.rs`

### Masalah (SEBELUM)
```rust
let df1 = num_variables as i32;
let df2 = 1;  // <-- Selalu 1? Ini salah!
let df3 = (total_cases - num_groups) as i32;

let f_value = ((1.0 - wilks_lambda) / wilks_lambda) * ((df3 as f64) / (df1 as f64));
```

Formula sebelumnya menggunakan df yang terlalu sederhana dan tidak mengikuti formula Rao's F approximation.

### Fix (SUDAH DITERAPKAN)
Menggunakan **Rao's F approximation** untuk Wilks' Lambda:

```rust
// F = ((1 - Λ^(1/s)) / Λ^(1/s)) × ((n - g - p + 1) / (p × (g - 1)))
//
// Where:
// - Λ = Wilks' Lambda
// - s = sqrt((p² × (g-1)² - 4) / (p² + (g-1)² - 5))
// - p = number of variables
// - g = number of groups
// - n = total number of cases

let s = ((p * (g - 1.0)).powi(2) - 4.0 / denominator).sqrt();
let df1 = (p * (g - 1.0)).round() as i32;
let df2 = (s * (n - g - p / 2.0 + 1.0)).round() as i32;

let lambda_power = wilks_lambda.powf(1.0 / s);
let f_value = ((1.0 - lambda_power) * df2) / (lambda_power * df1);
```

### Status
**FIXED** ✅

---

## 5. Bug FIXED: Chi-Square Formula untuk Wilks Lambda (statistical_test.rs)

### Lokasi
`frontend/components/Modals/Analyze/Classify/discriminant/rust/src/stats/statistical_test.rs`

### Masalah (SEBELUM)
```rust
// Chi-square approximation: χ² = -[n - (p + g)/2 - 1] × ln(Λ)
// Menggunakan (p + g) / 2
let chi_square_val = -(n - ((p + g) as f64) / 2.0 - 1.0) * lambda_k.ln();
```

### Fix (SUDAH DITERAPKAN)
Menggunakan formula Bartlett:
```rust
// χ² = -[n - (p + g + 1)/2] × ln(Λ)
// Menggunakan (p + g + 1) / 2 untuk konsistensi dengan literatur statistik
let chi_square_val = -(n - ((p + g) as f64 + 1.0) / 2.0) * lambda_k.ln();
```

### Status
**FIXED** ✅

---

## 6. Perbaikan: Between-Groups Matrix (canonical_function.rs)

### Lokasi
`frontend/components/Modals/Analyze/Classify/discriminant/rust/src/stats/canonical_function.rs`

### Penjelasan
Fungsi `calculate_between_groups_matrix` disederhanakan untuk menghapus parallel processing
yang tidak konsisten dengan fungsi lain. Sekarang menggunakan sequential loop yang lebih jelas:

```rust
// Formula: B_ij = Σ n_g × (x̄_gi - x̄_i) × (x̄_gj - x̄_j)
// This is consistent with the formula in calculate_between_within_matrices
```

### Status
**REFACTORED** ✅ - Logika matematika tetap sama, hanya struktur kode yang disederhanakan.

---

## 7. Potensi Masalah: Covariance vs Correlation dalam Structure Matrix

### Lokasi
`structure_matrix.rs`

### Masalah
Structure matrix seharusnya berisi **pooled within-group correlations** antara variabel asli
dan discriminant functions, bukan covariances.

### Status
**NEEDS VERIFICATION** - Fungsi `calculate_correlation` perlu dicek apakah menggunakan
sample standard deviation (n-1) atau population standard deviation (n).

---

## 8. Box's M Test df2 Calculation

### Lokasi
`box_m_test.rs:88, 397-405`

### Status
**NEEDS VERIFICATION** - Implementasi sudah mengikuti formula literatur, tapi perlu dicek
dengan output SPSS.

---

## Summary: Status Fix

| Priority | Issue | File | Status |
|----------|-------|------|--------|
| **HIGH** | Index mismatch data extraction | common.rs | ✅ FIXED |
| **HIGH** | Wilks' Lambda F approximation | statistical_test.rs | ✅ FIXED |
| **HIGH** | Chi-square formula | statistical_test.rs | ✅ FIXED |
| MEDIUM | Between-groups matrix | canonical_function.rs | ✅ REFACTORED |
| MEDIUM | Standardized coefficients | canonical_function.rs | ✅ DOCUMENTED |
| LOW | Double counting excluded cases | basic_processing.rs | NEEDS REVIEW |
| LOW | Structure matrix correlation | structure_matrix.rs | NEEDS VERIFICATION |
| LOW | Box's M test | box_m_test.rs | NEEDS VERIFICATION |

---

## Steps untuk Verifikasi dengan SPSS

1. **Ambil dataset test** dengan hasil SPSS yang sudah diverifikasi
2. **Jalankan discriminant analysis** di SPSS dan catat semua output:
   - Case Processing Summary
   - Group Statistics (means, std devs)
   - Pooled Within-Groups Matrices
   - Box's M Test
   - Eigenvalues
   - Wilks' Lambda Tests
   - Canonical Discriminant Functions (coefficients)
   - Structure Matrix
   - Classification Results
3. **Bandingkan** setiap nilai dengan output Rust
4. **Identifikasi** nilai mana yang berbeda
5. **Debug** fungsi yang menghasilkan nilai berbeda tersebut

---

## Referensi Matematika

### Between-Groups Sum of Squares and Cross Products (BSCP)
```
BSCP_ij = Σ(n_g) × (x̄_gi - x̄_i) × (x̄_gj - x̄_j)
```
Dimana:
- n_g = jumlah kasus di grup g
- x̄_gi = rata-rata variabel i di grup g
- x̄_i = rata-rata keseluruhan variabel i

### Within-Groups Sum of Squares and Cross Products (WSCP)
```
WSCP_ij = Σ Σ (x_kgi - x̄_gi) × (x_kgj - x̄_gj)
```
Atau pooled: WSCP_ij = Σ(n_g - 1) × S_gij

### Total SSCP
```
TSSC_ij = WSCP_ij + BSCP_ij
```

### Wilks' Lambda
```
Λ = |W| / |T|
```
Dimana W adalah within-groups covariance matrix dan T adalah total covariance matrix.

### Canonical Correlation
```
r_c = sqrt(λ / (1 + λ))
```
Dimana λ adalah eigenvalue.

### Rao's F Approximation untuk Wilks' Lambda
```
F = ((1 - Λ^(1/s)) / Λ^(1/s)) × ((n - g - p + 1) / (p × (g - 1)))

Dimana:
- s = sqrt((p²(g-1)² - 4) / (p² + (g-1)² - 5))
- p = number of variables
- g = number of groups
- n = total cases
```

### Chi-Square untuk Wilks' Lambda (Bartlett's approximation)
```
χ² = -[n - (p + g + 1)/2] × ln(Λ)
```
