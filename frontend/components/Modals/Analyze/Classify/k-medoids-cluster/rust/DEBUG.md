# Panduan Debugging K-Medoids PAM

## Status

✅ Algorithm PAM: **Bekerja** (23 tests passed)
✅ WASM Build: **Berhasil**
✅ HTTP Server: **Running** di port 8080
🔍 Perlu debugging: Interface WASM/JavaScript

## Langkah Debugging

### 1. Buka Browser Test

Buka salah satu file test berikut di browser Anda:

- http://localhost:8080/test-simple.html (test sederhana dengan logging detail)
- http://localhost:8080/test-wasm.html (test original)

### 2. Buka Developer Console

- Tekan **F12** atau **Ctrl+Shift+I**
- Pilih tab **Console**

### 3. Jalankan Test

- Klik tombol **"Run Test"** atau **"Test Clustering"**
- Perhatikan output di console

### 4. Periksa Output

Anda seharusnya melihat:

```
K-Medoids WASM module initialized with panic hook
Loading WASM module...
✓ WASM module loaded successfully!
Testing connection...
Connection: K-Medoids Cluster WASM module connected successfully!
Preparing test data...
Starting K-Medoids clustering...
Processing 6 data points with 2 clusters (method: PAM)
Clustering complete! Iterations: X, Converged: true
✓ Clustering completed!
```

Dan hasil clustering seperti:

```json
{
  "cluster_assignments": [0, 0, 1, 1, 0, 1],
  "medoids_indices": [1, 5],
  "medoids": [[1.5, 1.8], [9.0, 11.0]],
  "distances_to_medoids": [...],
  "total_distance": X.XX,
  "iterations": X,
  "converged": true
}
```

### 5. Jika TIDAK ADA OUTPUT

Periksa console untuk:

- **Red errors** (JavaScript errors)
- **CORS errors** (jika file dibuka dengan file://)
- **Module loading errors**
- **WASM initialization errors**

### 6. Jika Ada Error

Salin error message lengkap dan kirim ke developer. Error sekarang akan lebih detail karena panic hook sudah diaktifkan.

## Test Data yang Digunakan

```javascript
{
    data: [
        [1.0, 2.0],   // Cluster 0
        [1.5, 1.8],   // Cluster 0
        [5.0, 8.0],   // Cluster 1
        [8.0, 8.0],   // Cluster 1
        [1.0, 0.6],   // Cluster 0
        [9.0, 11.0]   // Cluster 1
    ],
    n_clusters: 2,
    method: "PAM",
    max_iterations: 100,
    distance_metric: "euclidean"
}
```

## Hasil yang Diharapkan

- 2 clusters (0 dan 1)
- Points [0, 1, 4] dalam cluster yang sama
- Points [2, 3, 5] dalam cluster yang lain
- 2 medoids dipilih dari data points
- Total distance > 0 dan finite

## Command Line Test (Alternative)

Jika test browser tidak bekerja, jalankan unit test Rust:

```bash
cd frontend/components/Modals/Analyze/Classify/k-medoids-cluster/rust
cargo test test_pam_basic_clustering -- --nocapture
```

## Troubleshooting

### Problem: "Cannot find module './pkg/wasm.js'"

**Solution**: Pastikan WASM sudah di-build:

```bash
wasm-pack build --target web --out-dir pkg
```

### Problem: "WASM module not initialized"

**Solution**: Tunggu beberapa detik setelah halaman dimuat, lalu klik tombol test lagi.

### Problem: "Browser tidak menampilkan hasil"

**Solution**:

1. Periksa apakah HTTP server masih berjalan
2. Refresh halaman (Ctrl+R)
3. Clear cache (Ctrl+Shift+R)
4. Cek console untuk error

### Problem: "Result is undefined/null"

**Solution**: Ini adalah masalah utama yang perlu di-debug:

1. Cek console log - apakah ada error?
2. Cek apakah fungsi run_k_medoids dipanggil?
3. Cek apakah data input valid?
4. Screenshot console dan kirim ke developer

## Kontak Debug

Jika masih ada masalah, berikan informasi berikut:

1. Screenshot console (F12)
2. Error message lengkap (jika ada)
3. Browser dan versi yang digunakan
4. Apakah HTTP server berjalan?
5. Output dari: `cargo test test_pam_basic_clustering`
