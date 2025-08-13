## Curve Estimation Modal — Developer Guide

Dokumen ini menjelaskan arsitektur, alur data, dependensi, serta titik-ekstensi untuk modul Curve Estimation pada UI. Fokus pada berkas di `frontend/components/Modals/Regression/CurveEstimation` dan relasinya dengan store, hooks, serta Web Worker `public/workers/CurveEstimation/curve_estimation.js`.

### Ringkasan Modul
- **Orkestrator**: `ModalCurveEstimation.tsx` — mengelola tab, pemilihan variabel, model regresi, menjalankan kalkulasi via worker, dan menyimpan hasil ke `useResultStore`.
- **Tab Variables**: `VariablesTab.tsx` — UI untuk memilih 1 dependent dan 1 independent (saat ini single X).
- **Tab Models**: `ModelsTab.tsx` — memilih tipe model (Linear, Quadratic, Logarithmic, dll.), opsi include constant, plot models, dan upper bound (khusus Logistic).
- **Tour**: `hooks/tourConfig.ts` — konfigurasi langkah-langkah feature tour.

### Dependensi Inti
- Store/Hooks: `useVariableStore` (metadata variabel), `useAnalysisData` (matriks data), `useResultStore` (log, analytic, statistik), serta utilitas UI/komponen umum.
- Chart: `ChartService` untuk membangun JSON chart; `Chart.register(...registerables)` hadir untuk integrasi Chart.js namun pembuatan plot utama dilakukan via `ChartService`.
- Worker: `public/workers/CurveEstimation/curve_estimation.js` — menjalankan fitting multi-model dan mengembalikan ringkasan hasil.

### Struktur Berkas (ringkas)
- `ModalCurveEstimation.tsx` — root modal + tabs + `handleRunRegression` (menyiapkan data, memanggil worker, menyimpan hasil dan chart).
- `VariablesTab.tsx` — list variabel numerik (non-STRING), pemilihan dependent dan independent.
- `ModelsTab.tsx` — daftar model, opsi include constant, plot models, input upper bound (untuk Logistic).
- `hooks/` — konfigurasi tour.

### Alur Data Utama (OK)
1. Validasi input: wajib pilih 1 dependent dan 1 independent.
2. Ekstraksi data dari `useAnalysisData()` memakai `columnIndex` dari variabel terpilih.
3. Missing values: listwise deletion sederhana — hanya pasangan (X, Y) numeric valid yang disertakan.
4. Siapkan log dan analytic (`useResultStore.addLog()`, `addAnalytic()`).
5. Jalankan worker: `/workers/CurveEstimation/curve_estimation.js` dengan payload:
   - `models: string[]` — daftar model dipilih (mis. ["Linear", "Quadratic"]).
   - `X: number[]`, `Y: number[]` — data setelah filtering.
   - `dependentName`, `independentNames: string[]`.
   - `upperBound?: number` — opsional; hanya untuk Logistic saat diisi.
6. Terima `onmessage` worker dengan action `regressionResults` → simpan tabel ringkasan via `addStatistic`.
7. Bangun Scatter Plot with Multiple Fit Lines:
   - Data scatter: pasangan `{x, y}` dari `X` dan `Y`.
   - Ekstrak parameter model dari hasil worker (mis. `Constant`, `b1`, `b2`, `b3`) untuk menyusun `fitFunctions` (string function + parameter numerik) di `chartConfig`.
   - Gunakan `ChartService.createChartJSON` untuk menghasilkan JSON chart bertipe "Scatter Plot With Multiple Fit Line" → simpan via `addStatistic`.
8. Modal ditutup setelah penjadwalan penyimpanan statistik berhasil; worker di-terminate pada error/close.

### Kontrak Web Worker (ringkas)
- Input (postMessage):
```ts
{
  action: 'runRegression',
  data: {
    models: string[],
    X: number[],
    Y: number[],
    dependentName: string,
    independentNames: string[],
    upperBound?: number,
  }
}
```
- Output (onmessage):
```ts
{ action: 'regressionResults', data: { success: boolean, result?: any, message?: string } }
// result biasanya memuat tables/rows untuk setiap model yang berisi parameter: Constant, b1, b2, b3, dsb.
```

### Plot: Scatter Plot With Multiple Fit Lines
- Dibangun dari pasangan (X, Y) dan fungsi-fit per model, mis.: Linear, Quadratic, Cubic, Logarithmic, Exponential, Inverse, Power, S, Compound, Logistic.
- `fitFunctions` diserialisasi sebagai string lambda (mis. "x => parameters.a + parameters.b * x") + objek `parameters` numerik agar renderer dapat menggambar garis model.

### Titik Ekstensi
- Menambah Model Baru:
  1) Update worker `curve_estimation.js` untuk menghitung parameter model baru dan menuliskan ke `result.tables` (kunci parameter konsisten: `Constant`, `b1`, `b2`, dst.).
  2) Update builder `fitFunctions` di `ModalCurveEstimation.tsx` agar mengenali model baru dan menyusun fungsi-fitnya.
  3) Tambah opsi UI di `ModelsTab.tsx` bila perlu.

- Mengaktifkan includeConstant/displayANOVA:
  - State `includeConstant` dan `displayANOVA` saat ini tidak dikirim ke worker. Untuk mengaktifkan:
    1) Tambahkan field pada payload `postMessage`.
    2) Sesuaikan worker untuk membaca opsi tersebut.
    3) Perbarui log/catatan hasil sesuai output worker.

- Menambah Chart/Visualisasi Lain:
  1) Persiapkan data dari hasil worker atau hitung lokal.
  2) Proses via `DataProcessingService` (opsional) dan bangun chart JSON via `ChartService`.
  3) Simpan ke `useResultStore.addStatistic()`.

### Praktik Baik & Catatan Penting
- Pastikan hanya data numerik finite yang dikirim ke worker; lakukan filtrasi `Number(...)` + `!isNaN`.
- Selalu `terminate()` worker pada semua jalur keluar (sukses/gagal) untuk mencegah kebocoran resource.
- Gunakan `title`, `components`, dan `output_data` yang konsisten saat menyimpan statistik agar renderer Output mengenali komponen yang benar.
- Untuk Logistic: `upperBound` boleh kosong ("") — berarti biarkan worker menentukan/estimasi; jika diisi, harus numeric valid.
- Saat ini hanya mendukung 1 independent. Perlu rancangan tambahan di UI/worker untuk multi-X.

### Known Limitations
- `includeConstant` dan `displayANOVA` belum diteruskan ke worker (catatan pada kode). Implementasi perlu disinkronkan agar opsi ini berdampak pada perhitungan/hasil.
- Perhitungan besar (dataset sangat panjang) bisa berat di browser; pertimbangkan pagination/streaming atau backend-offloading jika diperlukan.

### Quick Start untuk Developer
1) Pastikan worker `public/workers/CurveEstimation/curve_estimation.js` tersedia.
2) Buka modal dari alur UI yang memanggil `ModalCurveEstimation`.
3) Pilih 1 dependent dan 1 independent, pilih model, isi opsi jika perlu, klik OK.
4) Lihat Output View untuk tabel ringkasan dan scatter plot dengan garis fit.


