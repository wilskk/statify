# 🚀 K-Medoids WASM Setup - Langkah Pertama

## ✅ Yang Sudah Selesai

Struktur folder Rust-WASM untuk K-Medoids sudah lengkap:

```
k-medoids-cluster/rust/
├── Cargo.toml                  ✅ Config & dependencies
├── build.bat                   ✅ Build script
├── .gitignore                  ✅ Git ignore rules
├── README.md                   ✅ Dokumentasi lengkap
└── src/
    ├── lib.rs                  ✅ Entry point
    ├── models/mod.rs           ✅ Data structures (KMedoidsInput/Output)
    ├── utils/
    │   ├── mod.rs              ✅ Utility modules
    │   ├── distance.rs         ✅ Distance metrics (euclidean, manhattan)
    │   └── validation.rs       ✅ Input validation
    ├── stats/
    │   ├── mod.rs              ✅ Stats modules
    │   └── evaluation.rs       ✅ Silhouette score calculation
    ├── wasm/
    │   ├── mod.rs              ✅ WASM modules
    │   ├── constructor.rs      ✅ WASM initialization
    │   └── function.rs         ✅ Exported functions (run_k_medoids, test_connection)
    └── test/mod.rs             ✅ Unit tests
```

## 🔧 Langkah Pertama: Install Prerequisites

### 1. Install Rust

```bash
# Download dan install dari:
https://rustup.rs/

# Atau via PowerShell (Windows):
Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile "rustup-init.exe"
.\rustup-init.exe
```

Setelah install, **restart terminal** dan verify:

```bash
rustc --version
cargo --version
```

### 2. Install wasm-pack

```bash
cargo install wasm-pack
```

Verify installation:

```bash
wasm-pack --version
```

## 📝 Langkah Kedua: Compile & Test

### Test Platform (Pastikan Rust sudah terinstall)

```bash
cd d:\Kuliah\skripsi\statify64\frontend\components\Modals\Analyze\Classify\k-medoids-cluster\rust

# Run unit tests
cargo test

# Expected output:
# running 4 tests
# test test::tests::test_euclidean_distance ... ok
# test test::tests::test_manhattan_distance ... ok
# test test::tests::test_validate_input_empty_data ... ok
# test test::tests::test_validate_input_too_many_clusters ... ok
# test test::tests::test_validate_input_valid ... ok
```

### Build WASM Module

```bash
# Build production version
wasm-pack build --target web --out-dir pkg

# Atau gunakan build script yang sudah disediakan:
.\build.bat
```

Output akan ada di folder `pkg/`:

- `wasm.js` - JavaScript glue code
- `wasm_bg.wasm` - Compiled WebAssembly binary
- `wasm.d.ts` - TypeScript type definitions

## 🎯 Langkah Ketiga: Implementasi Algoritma K-Medoids

Sekarang sudah siap untuk implementasi algoritma. Berikut prioritas:

### Priority 1: PAM Algorithm (Partitioning Around Medoids)

File yang perlu dibuat: `src/algorithms/pam.rs`

Implementasi:

1. Initialize medoids (random atau k-means++)
2. Assignment step: assign points to nearest medoid
3. Update step: swap medoids to minimize total cost
4. Repeat until convergence

### Priority 2: FastPAM Optimization

File: `src/algorithms/fastpam.rs`

Optimasi dari PAM dengan kompleksitas yang lebih rendah.

### Priority 3: CLARA & CLARANS

Untuk dataset besar dan data spasial.

## 📊 Testing Strategy

1. **Unit Tests** - Test individual functions (sudah ada)
2. **Integration Tests** - Test full algorithm flow
3. **Benchmark Tests** - Compare dengan implementasi lain
4. **WASM Tests** - Test JavaScript integration

## 🔗 Integrasi dengan Frontend

Setelah build, update service di:
`k-medoids-cluster/services/k-medoids-cluster-analysis.ts`

```typescript
import init, { run_k_medoids } from "../rust/pkg/wasm";

export async function runKMedoidsClustering(data: number[][], options: any) {
  // Initialize WASM module
  await init();

  // Call Rust function
  const result = run_k_medoids({
    data,
    n_clusters: options.numberOfClusters,
    method: options.method, // "PAM", "FastPAM", "CLARA", "CLARANS"
    max_iterations: options.maxIterations,
    distance_metric: options.distanceMetric,
    random_seed: options.randomSeed,
  });

  return result;
}
```

## 📚 References & Resources

- **PAM Algorithm**: https://en.wikipedia.org/wiki/K-medoids
- **FastPAM Paper**: https://arxiv.org/abs/2008.05171
- **Rust Book**: https://doc.rust-lang.org/book/
- **wasm-bindgen Guide**: https://rustwasm.github.io/docs/wasm-bindgen/
- **WebAssembly**: https://webassembly.org/

## ❓ Next Questions to Answer

1. Apakah akan menggunakan random initialization atau k-means++ untuk initial medoids?
2. Apakah perlu implementasi parallel processing untuk dataset besar?
3. Distance metric apa saja yang diprioritaskan? (euclidean, manhattan, minkowski, dll)
4. Apakah perlu validasi khusus untuk missing values?

## 🎉 Summary

**Status**: ✅ Setup Complete - Ready for Algorithm Implementation

**File yang sudah dibuat**: 13 files
**Next Step**: Install Rust & wasm-pack, lalu mulai implementasi PAM algorithm

**Estimasi waktu**:

- Install prerequisites: 10-15 menit
- Implementasi PAM: 2-3 jam
- Testing & optimization: 1-2 jam
- Integration dengan frontend: 30 menit
