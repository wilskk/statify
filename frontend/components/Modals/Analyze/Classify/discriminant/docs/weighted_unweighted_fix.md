# Fix: Group Statistics Valid N (Unweighted/Weighted) Menampilkan "Invalid"

## Tanggal Fix
12 Mei 2026

## Masalah

Di tabel **Group Statistics** pada output analisis Diskriminan, kolom **Valid N (listwise)** — baik yang **Unweighted** maupun **Weighted** — menampilkan label `"Invalid"` untuk semua baris (setiap grup dan setiap variabel).

### Tampilan Sebelum Fix

| | | Mean | Std. Deviation | Valid N (listwise) | |
|---|---|---|---|---|---|
| | | | | **Unweighted** | **Weighted** |
| Total | var1 | 24.50 | 5.32 | Invalid | Invalid |
| Total | var2 | 18.20 | 4.11 | Invalid | Invalid |
| Group 1 | var1 | 26.10 | 4.88 | Invalid | Invalid |
| Group 1 | var2 | 19.30 | 3.95 | Invalid | Invalid |
| Group 2 | var1 | 22.90 | 5.01 | Invalid | Invalid |
| Group 2 | var2 | 17.10 | 4.22 | Invalid | Invalid |

---

## Analisis Root Cause

Terdapat **dua bug** di dua layer berbeda yang keduanya menyebabkan masalah ini:

### Layer 1 — Rust: `converter.rs`

**File:** `frontend/components/Modals/Analyze/Classify/discriminant/rust/src/utils/converter.rs`

Struct `FormattedGroupStatistics` **tidak mendefinisikan** field `unweighted_n` dan `weighted_n`:

```rust
// ❌ Sebelum — baris 56-61
#[derive(Serialize)]
struct FormattedGroupStatistics {
    groups: Vec<String>,
    variables: Vec<String>,
    means: Vec<GroupValue>,
    std_deviations: Vec<GroupValue>,
    // ← unweighted_n dan weighted_n TIDAK ADA
}
```

Struct `GroupStatistics` **aslinya sudah memiliki** kedua field tersebut (di `models/result.rs`), tapi saat transformasi di `FormatResult::from_analysis_result`, hanya `means` dan `std_deviations` yang di-pass ke output. Field `unweighted_n` dan `weighted_n` diabaikan.

### Layer 2 — TypeScript: `discriminant-analysis-formatter.ts`

**File:** `frontend/components/Modals/Analyze/Classify/discriminant/services/discriminant-analysis-formatter.ts`

Karena Layer 1 tidak pernah mengirim data N, kode formatter meng-hardcode `"Invalid"` sebagai fallback:

```typescript
// ❌ Sebelum — baris 179-180
table.rows.push({
    rowHeader: [group, variableName],
    mean: formatDisplayNumber(meanEntry.values[groupIndex]),
    std_deviation: formatDisplayNumber(stdDevEntry.values[groupIndex]),
    unweighted: "Invalid",  // ← hardcoded
    weighted: "Invalid",    // ← hardcoded
});
```

### Kesimpulan

Perhitungan `unweighted_n` dan `weighted_n` di `stats/group_statistics.rs` **sudah benar**. Nilai count diambil langsung dari panjang vector values per grup:

```rust
// stats/group_statistics.rs — baris 73-76
let count = values.len() as f64;
// unweighted_n dan weighted_n sama karena tidak ada bobot yang diterapkan
(variable.clone(), mean, std_dev, count, count)
```

Masalahnya murni ada di **data transformation pipeline**: data dihitung tapi tidak pernah sampai ke frontend.

---

## Fix

### Fix 1 — Rust: Tambahkan Field N ke Struct Output

**File:** `rust/src/utils/converter.rs`

```diff
 #[derive(Serialize)]
 struct FormattedGroupStatistics {
     groups: Vec<String>,
     variables: Vec<String>,
     means: Vec<GroupValue>,
     std_deviations: Vec<GroupValue>,
+    unweighted_n: Vec<GroupValue>,
+    weighted_n: Vec<GroupValue>,
 }
```

Dan populate datanya di `FormatResult::from_analysis_result`:

```rust
+ let unweighted_n = stats.variables
+     .iter()
+     .map(|var| {
+         let values = stats.groups
+             .iter()
+             .enumerate()
+             .map(|(j, _group)| {
+                 stats.unweighted_n.get(var)
+                     .and_then(|v| v.get(j))
+                     .copied()
+                     .unwrap_or(0.0)
+             })
+             .collect();
+         GroupValue { variable: var.clone(), values }
+     })
+     .collect();
+
+ let weighted_n = stats.variables
+     .iter()
+     .map(|var| {
+         let values = stats.groups
+             .iter()
+             .enumerate()
+             .map(|(j, _group)| {
+                 stats.weighted_n.get(var)
+                     .and_then(|v| v.get(j))
+                     .copied()
+                     .unwrap_or(0.0)
+             })
+             .collect();
+         GroupValue { variable: var.clone(), values }
+     })
+     .collect();

  FormattedGroupStatistics {
      groups: stats.groups.clone(),
      variables: stats.variables.clone(),
      means,
      std_deviations,
+     unweighted_n,
+     weighted_n,
  }
```

### Fix 2 — TypeScript: Lookup Nilai N dari Data

**File:** `services/discriminant-analysis-formatter.ts`

```diff
  // Find the corresponding unweighted_n entry
  const unweightedNEntry =
-     null;
+     data.group_statistics.unweighted_n?.find(
+         (entry: any) => entry.variable === variableName
+     );

  // Find the corresponding weighted_n entry
  const weightedNEntry =
-     null;
+     data.group_statistics.weighted_n?.find(
+         (entry: any) => entry.variable === variableName
+     );

  table.rows.push({
      rowHeader: [group, variableName],
      mean: formatDisplayNumber(meanEntry.values[groupIndex]),
      std_deviation: formatDisplayNumber(stdDevEntry.values[groupIndex]),
-     unweighted: "Invalid",
-     weighted: "Invalid",
+     unweighted: unweightedNEntry
+         ? formatDisplayNumber(unweightedNEntry.values[groupIndex])
+         : "Invalid",
+     weighted: weightedNEntry
+         ? formatDisplayNumber(weightedNEntry.values[groupIndex])
+         : "Invalid",
  });
```

---

## Hasil Setelah Fix

| | | Mean | Std. Deviation | Valid N (listwise) | |
|---|---|---|---|---|---|
| | | | | **Unweighted** | **Weighted** |
| Total | var1 | 24.50 | 5.32 | 50 | 50 |
| Total | var2 | 18.20 | 4.11 | 50 | 50 |
| Group 1 | var1 | 26.10 | 4.88 | 25 | 25 |
| Group 1 | var2 | 19.30 | 3.95 | 25 | 25 |
| Group 2 | var1 | 22.90 | 5.01 | 25 | 25 |
| Group 2 | var2 | 17.10 | 4.22 | 25 | 25 |

---

## Bug #3 — N Counts Tidak Dipopulate Karena Flag `statistics.means`

**File:** `rust/src/stats/group_statistics.rs`

Bagian combine results di-`if config.statistics.means { ... }` — artinya **jika opsi Means dimatikan**, seluruh block tidak dijalankan dan `unweighted_n`/`weighted_n` tidak pernah terisi.

```rust
// ❌ Sebelum — baris 86-95
if config.statistics.means {
    for (group_idx, (group, var_stats)) in statistics.iter().enumerate() {
        for (variable, mean, std_dev, unweighted, weighted) in var_stats {
            result.means.get_mut(variable).unwrap().push(*mean);
            result.std_deviations.get_mut(variable).unwrap().push(*std_dev);
            result.unweighted_n.get_mut(variable).unwrap().push(*unweighted);
            result.weighted_n.get_mut(variable).unwrap().push(*weighted);
        }
    }
}
```

Kolom **Valid N (listwise) tidak bergantung pada opsi Means**. Nilai N harus selalu di-populate, tanpa memandang setting statistik lainnya.

```rust
// ✅ Sesudah — pisahkan populate means/std_dev dari populate N counts
let has_means = config.statistics.means;
for (group_idx, (group, var_stats)) in statistics.iter().enumerate() {
    for (variable, mean, std_dev, unweighted, weighted) in var_stats {
        if has_means {
            result.means.get_mut(variable).unwrap().push(*mean);
            result.std_deviations.get_mut(variable).unwrap().push(*std_dev);
        }
        // N counts are always populated — they are independent of the Means statistic option
        result.unweighted_n.get_mut(variable).unwrap().push(*unweighted);
        result.weighted_n.get_mut(variable).unwrap().push(*weighted);
    }
}
```

### Catatan Tambahan

- **`unweighted_n` dan `weighted_n` bernilai sama** — karena Statify saat ini tidak menerapkan mekanisme weighting pada data. Jika nanti ada fitur weighting, `weighted_n` akan dihitung dari jumlah bobot (sum of weights) per grup, bukan count baris.
- Fallback `"Invalid"` tetap dipertahankan di TypeScript sebagai safety net jika data N tidak tersedia dari backend.
