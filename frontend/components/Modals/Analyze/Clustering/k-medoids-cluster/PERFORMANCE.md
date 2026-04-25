# K-Medoids Clustering - Performance Guide

## Kenapa Lama?

Meskipun sudah menggunakan **Web Worker** (background processing), K-Medoids tetap membutuhkan waktu karena:

### 1. **Multiple Initializations (n_init)**

- Default: **10 runs**
- Algoritma dijalankan 10x dengan random seed berbeda
- Hasil terbaik (cost terendah) yang dipilih
- **Impact**: 10x lebih lama dari single run

### 2. **Computational Complexity**

- **PAM**: O(k × (n-k)² × d × iterations) per run
  - n = jumlah data
  - k = jumlah cluster
  - d = dimensi/variabel
  - iterations = max iterations (default: 300)
- **Distance Matrix**: O(n² × d)
  - Harus dihitung sekali di awal
  - Untuk n=1000: 1 juta distances

### 3. **Iterative Optimization**

- Setiap iterasi mencoba swap semua medoid dengan non-medoid
- Menghitung ulang cost untuk setiap swap
- Berhenti saat konvergen atau max iterations

## Web Worker Berfungsi dengan Benar

Web Worker **TIDAK membuat perhitungan lebih cepat**, tapi:

✅ **UI tetap responsive** (tidak freeze)
✅ User bisa membatalkan operasi
✅ Progress update tetap muncul
✅ Aplikasi bisa di-minimize tanpa crash

Loading yang muncul adalah **waktu eksekusi asli** algoritma, bukan bug!

## Cara Optimasi

### 1. Kurangi Number of Initializations

```
Dataset Kecil (n < 100):    n_init = 10 ✓
Dataset Sedang (n < 500):   n_init = 5
Dataset Besar (n < 1000):   n_init = 3
Dataset Sangat Besar (n ≥ 1000): n_init = 1
```

### 2. Gunakan CLARA untuk Dataset Besar

- CLARA menggunakan sampling
- Lebih cepat untuk n > 1000
- Default sample size: 40 + 2k

### 3. Kurangi Max Iterations

```
Default: 300 iterations
Cukup: 100 iterations (konvergen lebih cepat)
Cepat: 50 iterations
```

### 4. Set Random Seed

Jika `Random Seed` diisi (bukan null):

- n_init otomatis jadi 1 (deterministic)
- Hasil repeatable tapi tidak di-optimasi

## Estimasi Waktu

| n (data) | k   | n_init | Metode | Waktu Estimasi |
| -------- | --- | ------ | ------ | -------------- |
| 100      | 3   | 10     | PAM    | 0.5-1s         |
| 500      | 5   | 10     | PAM    | 5-10s          |
| 1000     | 5   | 10     | PAM    | 20-40s         |
| 1000     | 5   | 3      | PAM    | 6-12s          |
| 5000     | 5   | 5      | CLARA  | 10-20s         |

## Troubleshooting

### "Kenapa loading lama?"

✅ Normal - algoritma memang computational intensive
✅ Web Worker berjalan di background thread
✅ Lihat console log untuk progress detail

### "Kenapa UI tidak freeze?"

✅ Web Worker bekerja dengan baik!
✅ UI thread terpisah dari computation thread

### "Cara mempercepat?"

1. Kurangi n_init ke 1-3
2. Gunakan CLARA jika n > 1000
3. Kurangi max_iterations ke 100
4. Reduce dimensi dengan PCA/feature selection

## Technical Details

### Web Worker Architecture

```
Main Thread (UI)          Worker Thread (WASM)
     │                            │
     ├──> send clustering input ──>│
     │                            │ run_k_medoids()
     │<── progress updates ────────┤ (n_init times)
     │                            │
     │<── final result ────────────┤
     │                            │
     └──> display output
```

### WASM Execution

1. **Initialization**: Load WASM module (~50ms)
2. **Distance Matrix**: O(n²) calculation
3. **For each n_init run**:
   - BUILD phase: greedy medoid selection
   - SWAP phase: iterative optimization
   - Track best cost
4. **Return**: Best result across all runs

## Recommendations

- **Small datasets (< 200)**: Use default settings
- **Medium datasets (200-1000)**: Set n_init=3-5
- **Large datasets (> 1000)**: Use CLARA + n_init=1
- **Very large (> 5000)**: Consider CLARANS or sampling

Web Worker sudah optimal, waktu eksekusi adalah nature dari algoritma K-Medoids!
