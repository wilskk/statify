<<<<<<< HEAD
# Daftar Rumus Statistik

Dokumen ini merangkum semua rumus statistik yang digunakan dalam worker `DescriptiveStatistics`, disesuaikan dengan notasi dan metodologi SPSS untuk data berbobot.

## 1. Descriptive (`descriptive.js`)

Kalkulator ini menyediakan statistik deskriptif dasar untuk variabel skala. Simbol `W` atau `W_N` merujuk pada jumlah total bobot (sum of weights).

- **Mean (Rata-rata)**: `sum / W`. Secara komputasi, digunakan algoritma rekursif (provisional means) untuk efisiensi.
- **Variance (Varians)**: `M2 / (W - 1)` (di mana M2 adalah momen kedua dari rata-rata)
- **Standard Deviation (Simpangan Baku)**: `sqrt(variance)`
- **Standard Error of Mean (Kesalahan Baku Rata-rata)**: `stdDev / sqrt(W)`
- **Range (Rentang)**: `maximum - minimum`
- **Z-Score (Skor Z)**: `(value - mean) / stdDev`
- **Skewness (Kemiringan)**: $$g_1 = \frac{W \cdot M_3}{(W-1)(W-2)S^3}$$
- **Standard Error of Skewness**: $$se(g_1) = \sqrt{\frac{6W(W-1)}{(W-2)(W+1)(W+3)}}$$
- **Kurtosis**: $$g_2 = \frac{W(W+1)M_4 - 3M_2^2(W-1)}{(W-1)(W-2)(W-3)S^4}$$
- **Standard Error of Kurtosis**: $$se(g_2) = \sqrt{\frac{4(W^2-1)(se(g_1))^2}{(W-3)(W+5)}}$$

## 2. Frequency (`frequency.js`)

Kalkulator ini menghitung frekuensi, persentase, dan statistik terkait.

- **Percent**: `percent = (frequency / T) * 100` dengan `T` = total bobot semua kasus berbobot valid (termasuk missing) sebagai penyebut; fallback ke `W` bila `T` tidak valid.
- **Valid Percent**: `validPercent = (frequency / W) * 100` dengan `W` = total bobot kasus valid.
- **Cumulative Percent**: `cumulativePercent = (cc[i] / W) * 100`.
- **Mode**: multimodal; semua nilai dengan frekuensi maksimum dikembalikan.
- **Interquartile Range (IQR)**: `Q3 - Q1` (secara default memakai persentil dari metode yang dipilih saat pemanggilan fungsi persentil).
- **Outlier Fences (Batas Outlier)**:
  - **Inner Fences**: `Q1 - 1.5 * IQR` dan `Q3 + 1.5 * IQR`
  - **Outer Fences**: `Q1 - 3 * IQR` dan `Q3 + 3 * IQR`
- **Percentiles**: Mendukung dua metode:
  - `waverage` (SPSS Definition 5 / Excel PERCENTILE.INC): target bobot `t_p = W * p` dan interpolasi dalam sel berbobot.
  - `haverage` (SPSS Definition 1 / AFREQUENCIES): target orde `r = (W + 1) * p` dan interpolasi antar posisi orde bawah/atas.
  Default untuk modul Frequency adalah `waverage` kecuali ditentukan lain saat pemanggilan `getPercentile(p, method)`.

## 3. Crosstabs (`crosstabs.js`)

Kalkulator ini digunakan untuk membuat tabel kontingensi dan statistik terkait.

- **Expected Count (Frekuensi Harapan)**: $$E_{ij} = \frac{r_i \cdot c_j}{W}$$
- **Residual**: `observed - expected`
- **Standardized Residual**: `(observed - expected) / sqrt(expected)`
- **Adjusted Residual**: $$ \frac{O_{ij} - E_{ij}}{\sqrt{E_{ij}(1-r_i/W)(1-c_j/W)}} $$
- **Row Percent**: `100 * (cellCount / rowTotal)`
- **Column Percent**: `100 * (cellCount / columnTotal)`
- **Total Percent**: `100 * (cellCount / W)`

## 4. Examine (`examine.js`)

Kalkulator ini menggabungkan fungsionalitas dari kalkulator lain dan menambahkan statistik inferensial.

- **Percentiles**: default `HAVERAGE` (SPSS Definition 1, target `(W+1)p`), dapat dikonfigurasi via `options.percentileMethod` menjadi `waverage`.
- **Tukey's Hinges (Q1, Q3) dan IQR**: digunakan untuk konstruksi boxplot dan (secara default di sini) untuk pelaporan IQR serta deteksi outlier bila `useHingesForOutliers` tidak diset `false`.
- **5% Trimmed Mean**: memangkas masing-masing 5% bobot dari bawah dan atas (mendukung pemangkasan fraksional) lalu menghitung mean pada data tersisa.
- **Confidence Interval for Mean**: $$ \bar{y} \pm t_{\alpha/2, W-1} \cdot SE_{mean} $$ dengan `df = W - 1`.
- **M-Estimators**: opsional; saat aktif dikembalikan sebagai placeholder yang menyamai trimmed mean (atau mean bila tidak tersedia).


=======
# Arsitektur & Panduan Worker Statistik Deskriptif

Dokumen ini menjelaskan arsitektur dan cara penggunaan sistem *Web Worker* untuk analisis statistik deskriptif—meliputi prosedur `Descriptives`, `Frequencies`, `Examine`, dan `Crosstabs`.

## Perubahan Arsitektur (2025-07)
Sejak refaktor terbaru, tiap jenis analisis kini memiliki *worker* terpisah (lebih ringan dan modular):

| Tipe Analisis | Worker Script |
| ------------- | ------------- |
| Descriptives  | `/workers/DescriptiveStatistics/descriptives.worker.js` |
| Frequencies   | `/workers/DescriptiveStatistics/frequencies.worker.js`  |
| Examine       | `/workers/DescriptiveStatistics/examine.worker.js`      |
| Crosstabs     | `/workers/DescriptiveStatistics/crosstabs.worker.js`    |

Dengan pemisahan ini, file `manager.js` sudah **dihapus**.

---

## Cara Menggunakan Worker

### 1. Inisiasi Worker
Contoh inisialisasi *worker* untuk analisis Descriptives di dalam React Hook atau komponen:
```javascript
import { createPooledWorkerClient } from "@/utils/workerClient";

const workerClient = createPooledWorkerClient("descriptives");
```
> `createPooledWorkerClient()` otomatis memilih worker script yang tepat sesuai tabel di atas.

Jika Anda ingin membuat *worker* manual:
```javascript
const worker = new Worker(
  new URL("/workers/DescriptiveStatistics/descriptives.worker.js", import.meta.url)
);
```

### 2. Mengirim Tugas Analisis
Gunakan `workerClient.post()` (atau `worker.postMessage()`) sesuai format masing-masing analisis.

#### Descriptives / Examine / Frequencies (single-variable)
```javascript
workerClient.post({
  variable: { name: "Age", measure: "scale", type: "numeric" },
  data: [25, 30, 35, 40, null],
  weights: [1, 1, 1, 1, 1], // opsional
  options: { /* ... */ }
});
```

#### Crosstabs (tabulasi silang)
```javascript
workerClient.post({
  variable: {
    row: { name: "Gender", measure: "nominal" },
    col: { name: "Vote",   measure: "nominal" }
  },
  data: [
    { Gender: "Male",   Vote: "Yes" },
    { Gender: "Female", Vote: "No"  },
    // ...
  ],
  weights: null,
  options: { /* ... */ }
});
```

#### Frequencies Batch Mode
```javascript
workerClient.post({
  variableData: [
    { variable: ageVarDef, data: ageDataArray },
    { variable: incomeVarDef, data: incomeDataArray }
  ],
  weightVariableData: weightsArray,
  options: { displayFrequency: true, displayDescriptive: true }
});
```

### 3. Menerima Hasil
`workerClient.onMessage(result => { /* ... */ })` – struktur balasan tetap sama seperti sebelumnya.

---

*(Bagian selanjutnya tentang struktur `results` dipertahankan tanpa perubahan.)*

## Struktur Hasil Analisis

Berikut adalah struktur objek `results` yang dikembalikan untuk setiap `analysisType`.

### `analysisType: 'descriptives'`
Mengembalikan satu objek dengan semua statistik deskriptif.
```json
{
  "n": 5,
  "valid": 4,
  "missing": 1,
  "mean": 32.5,
  "sum": 130,
  "stdDev": 6.45,
  "variance": 41.67,
  "seMean": 3.22,
  "min": 25,
  "max": 40,
  "range": 15,
  "skewness": 0,
  "seSkewness": 1.15,
  "kurtosis": -1.2,
  "seKurtosis": 2.3
}
```

### `analysisType: 'frequencies'`
Mengembalikan objek terstruktur dengan ringkasan dan statistik gabungan.
```json
{
  "summary": {
    "n": 5,
    "valid": 4,
    "missing": 1
  },
  "statistics": {
    "mean": 32.5,
    "stdDev": 6.45,
    "variance": 41.67,
    "min": 25,
    "max": 40,
    "range": 15,
    "sum": 130,
    "skewness": 0,
    "seSkewness": 1.15,
    "kurtosis": -1.2,
    "seKurtosis": 2.3,
    "mode": [25, 30, 35, 40],
    "stdErrOfMean": 3.22,
    "percentiles": {
      "25": 27.5,
      "50": 32.5,
      "75": 37.5
    }
  }
}
```

### `analysisType: 'examine'`
Mengembalikan analisis eksplorasi yang kaya, termasuk M-Estimator dan berbagai metode persentil.
```json
{
  "summary": { "n": 5, "valid": 4, "missing": 1 },
  "descriptives": {
    "mean": 32.5,
    "sum": 130,
    "stdDev": 6.45,
    "confidenceInterval": { "lower": 26.1, "upper": 38.9, "level": 95 }
  },
  "trimmedMean": 32.5,
  "mEstimators": {
    "huber": 32.5,
    "hampel": 32.5,
    "andrew": 32.5,
    "tukey": 32.5
  },
  "percentiles": {
    "waverage": { "25": 27.5, "50": 32.5, "75": 37.5 },
    "round": { "25": 30, "50": 35, "75": 40 },
    "empirical": { "25": 25, "50": 30, "75": 35 }
  }
}
```

### `analysisType: 'crosstabs'`
Mengembalikan struktur data yang komprehensif untuk tabulasi silang.
```json
{
  "summary": {
    "rows": 2,
    "cols": 2,
    "totalCases": 4,
    "rowCategories": ["Female", "Male"],
    "colCategories": ["No", "Yes"],
    "rowTotals": [2, 2],
    "colTotals": [2, 2]
  },
  "contingencyTable": [ [1, 1], [1, 1] ],
  "cellStatistics": [ /* matriks sel dengan {count, expected, rowPercent, ...} */ ],
  "chiSquare": {
    "pearson": { "value": 0, "df": 1 },
    "likelihoodRatio": { "value": 0, "df": 1 }
  },
  "nominalMeasures": {
    "phi": 0,
    "contingencyCoefficient": 0,
    "cramersV": 0
  },
  "ordinalMeasures": { "gamma": 0, "kendallsTauB": 0, "kendallsTauC": 0, "somersD": { /* ... */ } },
  "preMeasures": { "lambda": { /* ... */ }, "goodmanKruskalTau": { /* ... */ } },
  "correlations": { "pearson": 0, "spearman": 0 },
  "agreement": { "kappa": 0 }
}
```
---
## Prinsip Desain Utama

1.  **Modularitas & Enkapsulasi**: Setiap jenis analisis utama (`Descriptives`, `Frequencies`, `Examine`, `Crosstabs`) dienkapsulasi dalam `Class` kalkulatornya sendiri.
2.  **Efisiensi Memori**: `DescriptiveCalculator` menggunakan **algoritma provisional (one-pass)**. `CrosstabsCalculator` menggunakan **tabel jumlah kumulatif** untuk statistik ordinal. Keduanya sangat efisien.
3.  **Komposisi > Pewarisan**: `ExamineCalculator` dan `FrequencyCalculator` **menggunakan instance** dari `DescriptiveCalculator` secara internal. Ini adalah desain yang fleksibel.
4.  **Controller Terpusat**: `manager.js` bertindak sebagai *entry point* tunggal untuk semua permintaan analisis, menyederhanakan logika di *main thread*.
5.  **Constructor Terstandarisasi**: Semua kelas kalkulator menerima satu objek `payload` di `constructor`-nya, membuat `manager.js` sangat bersih dan agnostik.

## Struktur Direktori

```
DescriptiveStatistics/
├── libs/
│   ├── crosstabs.js        # Class CrosstabsCalculator (Tabulasi Silang)
│   ├── descriptive.js      # Class DescriptiveCalculator (Algoritma Provisional)
│   ├── examine.js          # Class ExamineCalculator (M-Estimators, Trimmed Mean)
│   ├── frequency.js        # Class FrequencyCalculator (Persentil, Modus)
│   └── utils.js            # Fungsi utilitas bersama (isNumeric, dll.)
├── manager.js              # Entry point/controller utama untuk worker
└── README.md               # Dokumentasi ini
```

## Alur Kerja Analisis

1.  **Main Thread**: Membuat `Worker` baru dari `manager.js`.
2.  **Main Thread**: Mengirim pesan ke worker via `postMessage` dengan `analysisType` dan `payload` data, biasanya dalam satu loop untuk beberapa variabel.
3.  **Worker (`manager.js`)**: `onmessage` handler menerima data.
4.  **Worker (`manager.js`)**: Memilih `Class` kalkulator yang benar dari `CALCULATOR_MAP` berdasarkan `analysisType`.
5.  **Worker (`manager.js`)**: Membuat instance dari `Class` kalkulator, meneruskan seluruh `payload` dari `event.data`.
6.  **Worker (Kalkulator)**: Metode `getStatistics()` dipanggil, yang secara internal memanggil `#initialize()` (jika perlu) untuk melakukan perhitungan inti.
7.  **Worker (`manager.js`)**: Membungkus hasil dalam objek `{ status: 'success', ... }` dan mengirimkannya kembali ke *main thread*.
8.  **Main Thread**: Menerima hasil atau error dan memperbarui UI secara individual untuk setiap variabel.

## Cara Memperluas Sistem

1.  **Buat Kalkulator Baru**: Buat file baru di `libs/`, misalnya `anova.js`, berisi `class AnovaCalculator`. Pastikan `constructor`-nya menerima satu objek `payload` (`constructor(payload)`).
2.  **Daftarkan di Manager**:
    *   Di `manager.js`, impor skrip baru: `importScripts('./libs/anova.js');`
    *   Tambahkan entri baru ke `CALCULATOR_MAP`: `['anova', self.AnovaCalculator],`
3.  **Panggil dari Main Thread**: Anda sekarang dapat memanggil worker dengan `analysisType: 'anova'`, mengikuti pola pengiriman pesan yang dijelaskan di atas.

Sistem ini dirancang untuk menjadi sangat mudah diperluas sambil menjaga basis kode tetap bersih dan terorganisir. 
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
