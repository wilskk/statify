# K-Medoids Rust-WASM Source Code

## Structure

```
src/
├── lib.rs              # Main library entry point
├── models/             # Data structures and types
│   └── mod.rs          # KMedoidsInput, KMedoidsOutput, ClusterStatistics
├── utils/              # Utility functions
│   ├── mod.rs
│   ├── distance.rs     # Distance metrics (euclidean, manhattan, etc.)
│   └── validation.rs   # Input validation
├── stats/              # Statistical calculations
│   ├── mod.rs
│   └── evaluation.rs   # Silhouette score, cluster metrics
├── wasm/               # WebAssembly interface
│   ├── mod.rs
│   ├── constructor.rs  # WASM struct initialization
│   └── function.rs     # Exported WASM functions
└── test/               # Unit tests
    └── mod.rs
```

## Next Steps

1. Implement PAM (Partitioning Around Medoids) algorithm
2. Implement FastPAM optimization
3. Implement CLARA (for large datasets)
4. Implement CLARANS (for spatial data)
5. Add comprehensive tests
6. Optimize performance

## Building

```bash
cd rust
wasm-pack build --target web --out-dir pkg
```
