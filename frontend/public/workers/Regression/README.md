## Regression Workers — Developer Guide

Dokumen ini menjelaskan katalog Web Workers regresi, pola I/O, konvensi data, serta panduan menambah worker baru. Semua worker diekspose sebagai file statis di `public/` dan diinisialisasi di UI via `new Worker('/workers/Regression/<name>.js')`.

### Tujuan
- Memisahkan perhitungan statistik/regresi dari thread UI.
- Menyeragamkan kontrak data agar mudah dirender ke Output View (tabel/chart).

### Konvensi Umum
- Input melalui `postMessage(payloadObject)`. Gunakan nama properti yang eksplisit: `dependent`, `independent`, `dependentData`, `independentData`, `independentVariableInfos`, dll. Perhatikan tiap worker di bawah.
- Output via `postMessage(result)` dengan salah satu pola berikut:
  - Tabel siap-render: `{ title, components, output_data: stringifiedJSON }` dimana `output_data` memiliki bentuk `{ tables: [{ title, columnHeaders, rows, ... }] }` dan tiap baris memiliki `rowHeader: string[]` serta field kolom keyed sesuai `columnHeaders`.
  - Payload khusus: beberapa worker memuat `success`/`error`, atau properti tambahan seperti `visualizations`, `interpretation`, `results`.
- Validasi: mayoritas worker memeriksa tipe dan ukuran input. Tangani error dengan `postMessage({ error: message })` dan jangan lempar exception ke luar.
- Matriks/Aljabar: banyak worker menggunakan normal equations `(X'X)^(-1)X'y`. Pastikan guard singularitas dan numerik (finite) tersedia.

### Daftar Worker & Kontrak I/O

- anova.js
  - Input: `{ dependentData: number[], independentData: number[][] | number[] }`
  - Output: `{ title: 'ANOVA', components: 'ANOVA', output_data: string }`
  - Catatan: akan memaksa format `independentData` menjadi array-of-arrays, membangun X dengan intercept, menghitung SSR/SSE/SST, F, p-value (F CDF).

- model_summary.js
  - Input: `{ dependent: number[], independent: number[][] }`
  - Output: `{ title: 'Model Summary', components: 'ModelSummary', output_data: string }`

- coefficients.js
  - Input: `{ dependentData: number[], independentData: number[][], independentVariableInfos: Array<{name,label?}> }`
  - Output: `{ success: true, result: { tables: [...] } }` atau `{ success: false, error }`
  - Tabel: "Coefficients" dengan nested headers (Unstandardized/Standardized) dan baris anak per koefisien.

- coefficients_partandpartial.js
  - Input: `{ dependent: number[], independents: number[][], independentVariableInfos: Array<{name,label?}> }`
  - Output: `{ tables: [{ title: 'Coefficients', ... }] }` (Zero-order, Partial, Part correlations).

- coefficients_collinearity.js
  - Input: `{ dependent: number[], independent: number[][], independentVariableInfos: Array<{name,label?}> }`
  - Output: `{ tables: [{ title: 'Coefficients', 'Collinearity Statistics': Tolerance/VIF }] }`

- collinearity_diagnostics.js
  - Input: `{ dependent, independent, dependentVariableInfo, independentVariableInfos }`
  - Output: `{ tables: [{ title: 'Collinearity Diagnostics', ... }] }`
  - Catatan: eigen decomposition (lihat file) untuk variance proportions/condition indices.

- rsquare.js
  - Input: `{ dependent, independent, independentVariableInfos }`
  - Output: `{ title: 'Model Summary (R Square Change)', components: 'RSquareChange', output_data: string }`

- confidence_interval.js
  - Input: `{ dependent, independent, dependentVariableInfo, independentVariableInfos, confidenceLevel: number }`
  - Output: `{ title: 'Confidence Interval', components: 'ConfidenceInterval', output_data: string }`

- descriptive_statistics.js
  - Input: `{ dependent, independent, dependentVariableInfo, independentVariableInfos }`
  - Output: `{ title: 'Descriptive Statistics', components: 'DescriptiveStatistics', output_data: string }`

- correlations.js
  - Input: `{ dependent, independent, dependentVariableInfo, independentVariableInfos }`
  - Output: `{ title: 'Correlations', components: 'Correlations', output_data: string }`

- model_durbin.js
  - Input: `{ dependent, independent }`
  - Output: `{ title: 'Model Summary (Durbin-Watson)', components: 'ModelDurbin', output_data: string }`

- residuals_statistics.js
  - Input: `{ dependent, independent }`
  - Output: `{ title: 'Residuals Statistics', components: 'ResidualsStatistics', output_data: string }`

- variables.js
  - Input: `{ dependent, independent, dependentVariableInfo, independentVariableInfos }`
  - Output: Tabel "Variables Entered/Removed" dengan daftar variabel.

- plotData.worker.js
  - Input: `{ independentData: number[][] (n×p), coefficients: number[], dependentData: number[] }`
  - Output: `{ predicted, residuals, zpred, zresid, dresid, sresid, sdresid, ... }` untuk keperluan plot.

#### Save workers
- Save/predictedValues.js
  - Input: `{ independentData: number[][] (n×p), coefficients: number[], dependentData: number[] }`
  - Output: `Array<{ unstandardized, standardized, adjusted, se }>`.

- Save/residuals.js
  - Input: `{ independentData: number[][] (n×p), coefficients: number[], dependentData: number[] }`
  - Output: `Array<{ unstandardized, standardized, studentized, deleted, studentizedDeleted }>`.

#### Assumption Test workers
- Assumption Test/linearity.js (Ramsey RESET)
  - Input: `{ dependentData: number[], independentData: number[][]|number[], maxPower?: number }`
  - Output: `{ title, fStatistic, pValue, isLinear, interpretation }`.

- Assumption Test/normality.js
  - Input: `{ dependentData, independentData, independentVariableInfos }`
  - Output: `{ title, interpretation, isNormal, output_data: string, visualizations: { histogram, qqPlot } }`.

- Assumption Test/homoscedasticity.js (Breusch–Pagan)
  - Input: `{ dependentData, independentData, independentVariableInfos }`
  - Output: `{ title, description, isHomoscedastic, tests, residualStats, visualizations, interpretation, output_data }`.

- Assumption Test/multicollinearity.js (Correlation + VIF)
  - Input: `{ independentData, independentVariableInfos }`
  - Output: `{ title, description, hasMulticollinearity, correlationMatrix, vif, interpretation, output_data }`.

- Assumption Test/nonautocorrelation.js (Durbin–Watson)
  - Input: `{ residuals: number[] }`
  - Output: `{ results: { durbinWatsonStatistic, lowerBound, upperBound, interpretation, output_data } }`.

### Skema Tabel Output (output_data)
`output_data` selalu string JSON dari bentuk berikut:
```json
{
  "tables": [
    {
      "title": "...",
      "columnHeaders": [ { "header": "Model" }, { "header": "F" } ],
      "rows": [
        { "rowHeader": ["1"], "F": "3.141", "p-value": "0.042" }
      ]
    }
  ]
}
```
Catatan: untuk header bertingkat, gunakan `children` pada `columnHeaders` dan/atau `rows[].children` sesuai pola di `coefficients.js`.

### Visualizations Payload
Beberapa worker mengembalikan data tambahan untuk chart:
- normality.js: `visualizations.histogram`, `visualizations.qqPlot`
- homoscedasticity.js: `visualizations.homoscedasticityScatter`, `residualVsFitted`, `residualVsIndependent`, `scaleLocation`
- plotData.worker.js: `zpred`, `sresid`, dll. untuk scatter/histogram di UI

UI akan memproses via `DataProcessingService.processDataForChart` lalu `ChartService.createChartJSON` sebelum menyimpan ke `useResultStore`.

### Praktik Baik
- Periksa panjang dan tipe data (array-of-arrays untuk multi variabel). Beri pesan error yang jelas.
- Tangani singularitas matriks dan ketidakstabilan numerik (cek diagonal, determinan kecil, atau gunakan fallback/approx).
- Jangan lupa `postMessage({ error })` daripada throw ke global. Hindari kebocoran state.
- Hindari log berlebihan di produksi; cukup informasi debug kunci.

### Menambah Worker Baru
1) Buat file baru di `public/workers/Regression/<nama>.js`.
2) Tentukan kontrak input/output sederhana dan dokumentasikan di README ini.
3) Di UI, buat pemanggil worker dan mapping hasil ke `useResultStore.addStatistic()` (atau save variabel baru jika relevan).
4) Jika menghasilkan chart, kembalikan data mentah; pembuatan chart dilakukan di UI.


