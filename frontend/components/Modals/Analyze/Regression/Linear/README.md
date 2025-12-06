## Linear Regression Modal — Developer Guide

Dokumen ini menjelaskan arsitektur, alur data, dependensi, dan titik-ekstensi (extension points) untuk modul Linear Regression di UI. Fokusnya adalah komponen dalam direktori `frontend/components/Modals/Analyze/Regression/Linear` dan relasi dengan store, hooks, serta Web Workers yang berada di `public/workers/Regression/*`.

### Ringkasan Modul
- **Orkestrator**: `ModalLinear.tsx` — mengelola state global tab, pemilihan variabel, parameter, eksekusi analisis (OK), dan konsolidasi hasil (menambahkan statistik/chart ke `useResultStore`).
- **Tab Variabel**: `VariablesLinearTab.tsx` — UI untuk memilih variabel dependenn dan independen.
- **Tab Statistik**: `Statistics.tsx` — toggle statistik dan opsi residual/casewise.
- **Tab Plots**: `PlotsLinear.tsx` — memilih X/Y untuk scatterplot, opsional histogram X.
- **Tab Save**: `SaveLinear.tsx` — memilih tipe nilai Predicted/Residual yang akan disimpan sebagai variabel baru.
- **Tab Options**: `OptionsLinear.tsx` — saat ini: include constant (display) dan strategi missing value (`replaceWithMean` atau listwise deletion).
- **Tab Assumption**: `AssumptionTest.tsx` — menjalankan uji asumsi (linearity, normality, homoscedasticity, multicollinearity, nonautocorrelation) via workers.
- **Tour**: `hooks/tourConfig.ts` — konfigurasi langkah-langkah feature tour.

### Dependensi Inti
- Store: `useVariableStore`, `useDataStore`, `useResultStore`, `useMetaStore` (implisit via hooks lain), serta `useAnalysisData` (membaca data matriks), `useLinear` (perhitungan regresi inti/koefisien).
- Services chart: `ChartService`, `DataProcessingService` — standardisasi pembuatan chart JSON dan preprocessing data.
- Web Workers (Next Public): `public/workers/Regression/*` (mis. `model_summary.js`, `anova.js`, `coefficients.js`, `Save/predictedValues.js`, dll.) dan untuk Assumption Test: `public/workers/Regression/Assumption Test/*.js`.

### Struktur Berkas (ringkas)
- `ModalLinear.tsx` — root modal + tabs + handleAnalyze.
- `VariablesLinearTab.tsx` — pemilihan variabel.
- `Statistics.tsx` — pilihan statistik (estimates, model fit, dsb.).
- `PlotsLinear.tsx` — builder plot sederhana (Scatter/Histogram).
- `SaveLinear.tsx` — opsi penyimpanan Predicted/Residual.
- `OptionsLinear.tsx` — opsi model & handling missing values.
- `AssumptionTest.tsx` — uji asumsi regresi + penyimpanan hasil + pembuatan chart.
- `hooks/` — konfigurasi tour.

### Alur Data Utama (OK/Analyze)
1. Validasi input: harus ada 1 dependent dan minimal 1 independent.
2. Ekstraksi data dari `useAnalysisData()` berdasarkan `columnIndex`.
3. Missing values:
   - Jika `replaceWithMean` aktif: tiap kolom angka yang `NaN` diganti mean kolom.
   - Jika tidak: listwise deletion (filter baris yang mengandung `NaN`).
4. Transform data: transpose independen untuk worker/regresi.
5. Hitung regresi via `useLinear().calculateLinearRegression` (koefisien dipakai oleh workers Save dan plot).
6. Queue Workers statistik berdasarkan pilihan di `Statistics.tsx` (dipush ke `statisticPromises`):
   - Variables (`/workers/Regression/variables.js`)
   - Model Summary (`/workers/Regression/model_summary.js`)
   - ANOVA (`/workers/Regression/anova.js`)
   - Coefficients (`/workers/Regression/coefficients.js`)
   - Tambahan opsional: `rsquare.js`, `confidence_interval.js`, `coefficients_partandpartial.js`, `coefficients_collinearity.js`, `collinearity_diagnostics.js`, `model_durbin.js`, `residuals_statistics.js`, `descriptive_statistics.js`, `correlations.js`.
7. Menyimpan hasil: tiap onmessage worker → panggil `addStatistic(analyticId, {...})` dengan `title`, `components`, dan `output_data` (stringified JSON yang nanti dirender di Output View).
8. Save Predicted/Residuals (opsional tab Save):
   - Jalankan worker `/workers/Regression/Save/predictedValues.js` dan/atau `/workers/Regression/Save/residuals.js`.
   - Buat variabel baru ke `useVariableStore.addVariables()` dengan penamaan otomatis berurutan.
9. Plot (opsional tab Plots): Worker `plotData.worker.js` membangun derived arrays (`zpred`, `zresid`, dst.), kemudian data disalurkan ke `DataProcessingService` → `ChartService` → `addStatistic`.
10. Modal ditutup setelah penjadwalan analisis dimulai; proses worker dan penulisan hasil berjalan asynchronous.

### Konvensi Penamaan Variabel Tersimpan
- Predicted: `PRE_<n>` (unstandardized), `ZPR_<n>` (standardized), `ADJ_<n>` (adjusted), `SEP_<n>` (SE of mean predictions)
- Residuals: `RES_<n>` (unstandardized), `ZRE_<n>` (standardized), `SRE_<n>` (studentized), `DRE_<n>` (deleted), `SDR_<n>` (studentized deleted)

Penentuan `<n>`: diambil dari akhiran terbesar yang sudah ada, lalu +1.

### Uji Asumsi (AssumptionTest.tsx)
- Linearity — worker: `/workers/Regression/Assumption Test/linearity.js`
  - Menyimpan tabel summary (F statistic & p-value Ramsey RESET) dan membuat scatter plot ZPRED vs SRESID.
- Normality — worker: `/workers/Regression/Assumption Test/normality.js`
  - Menyimpan hasil (kolom interpretasi). Jika tersedia, membuat Q-Q Plot residual menggunakan `ChartService`.
- Homoscedasticity — worker: `/workers/Regression/Assumption Test/homoscedasticity.js`
  - Menyimpan hasil + membuat scatter ZPRED vs SRESID dari payload `visualizations.homoscedasticityScatter`.
- Multicollinearity — worker: `/workers/Regression/Assumption Test/multicollinearity.js`
  - Membaca hanya independen (≥2), menyimpan hasil (mis. VIF/Tolerance sesuai implementasi worker).
- Nonautocorrelation — worker: `/workers/Regression/Assumption Test/nonautocorrelation.js`
  - Menghitung residual dulu via OLS sederhana di UI, kirim ke worker, simpan hasil (Durbin-Watson) + interpretasi.

Semua uji menulis log/analytic via `useResultStore.addLog()` dan `addAnalytic()` sebelum menyimpan statistik.

### Kontrak Web Worker (ringkas)
- Pemanggilan: `const worker = new Worker('/workers/Regression/...')` (served dari `public/`).
- Pengiriman data: `worker.postMessage(payloadObj)` — hanya data numerik/serializable sederhana.
- Respons: `worker.onmessage = (e) => { const result = e.data; ... }`
- Error: `worker.onerror = (err) => { ... }` — jangan lupa `worker.terminate()` pada semua exit path.

Contoh payload umum:
```ts
// Statistik model
{ dependent: number[], independent: number[][] }

// Save predicted/residuals
{ independentData: number[][], coefficients: number[], dependentData: number[] }

// Assumption tests (contoh normality)
{ dependentData: number[], independentData: number[][], independentVariableInfos: {name: string, label?: string}[] }
```

Contoh response umum:
```ts
// Bentuk tabel siap render
{ title: string, components: string, output_data: string } // output_data adalah JSON string berisi rows/columns

// Visualisasi tambahan
{ visualizations?: { qqPlot?: Array<{ observed: number, theoretical: number }> } }
```

### Titik Ekstensi (Bagaimana menambah fitur)
- Menambah Statistik Baru:
  1) Tambah worker baru di `public/workers/Regression/<nama>.js` dengan kontrak I/O sederhana.
  2) Di `ModalLinear.tsx`, buat helper mirip `pushModelSummaryWorker()` untuk enqueue ke `statisticPromises` dan `addStatistic` hasilnya.
  3) Tambah toggle/opsi di `Statistics.tsx` jika perlu kontrol UI.

- Menambah Uji Asumsi Baru:
  1) Buat tombol/section di `AssumptionTest.tsx`.
  2) Buat worker `public/workers/Regression/Assumption Test/<nama>.js` yang mengembalikan `interpretation`, `output_data` (opsional), dan/atau `visualizations`.
  3) Simpan hasil ke `useResultStore.addStatistic()`; jika perlu chart, gunakan `DataProcessingService` → `ChartService`.

- Menambah Jenis Plot Baru:
  1) Tambah pilihan UI di `PlotsLinear.tsx`.
  2) Siapkan data mentah dari `plotWorker` atau hitung lokal.
  3) Proses via `DataProcessingService.processDataForChart` dan bangun JSON chart via `ChartService.createChartJSON`.

### Praktik Baik & Catatan Penting
- Selalu filter/normalisasi angka dari dataset; banyak worker mengasumsikan input merupakan number finite.
- Pastikan memanggil `worker.terminate()` pada semua path (sukses/error) untuk mencegah kebocoran web worker.
- Simpan hasil ke `useResultStore` dengan `title`/`components` konsisten agar renderer Output dapat memilih komponen tampilan yang tepat.
- Saat menyimpan variabel baru: lakukan agregasi `CellUpdate[]` dan satu kali pemanggilan `useVariableStore.addVariables()` untuk kinerja yang baik.
- Logging: komponen banyak memakai `console.log`/`console.error` dengan payload ringkas untuk debugging.

### Pengujian
- Unit/komponen: lihat folder `frontend/components/.../__tests__` untuk pola testing (React Testing Library/Jest).
- E2E: Playwright di `testing/e2e` dan contoh spesifikasi analisis lain sebagai referensi.

### Known Limitations
- Saat ini, perhitungan OLS sederhana dan beberapa statistik dilakukan di UI/worker berbasis normal equations — hindari dataset sangat besar atau multikolinearitas ekstrem tanpa guard tambahan.
- Semua variabel harus numerik (non-STRING) untuk masuk analisis; variabel STRING difilter di UI.

### Quick Start untuk Developer
1) Pastikan worker yang dirujuk tersedia di `public/workers/Regression/...`.
2) Buka modal dari jalur UI yang memanggil `ModalLinear` (mis. menu Analyze → Regression → Linear).
3) Pilih variabel, set opsi, klik OK, lalu cek Output View untuk tabel/chart.

Jika menambah worker/fitur baru, gunakan pola existing helpers dan jaga kontrak I/O tetap sederhana serta serializable.


