# Arsitektur & Panduan Worker Statistik Deskriptif

Dokumen ini menjelaskan arsitektur dan cara penggunaan sistem worker untuk analisis statistik deskriptif, termasuk prosedur `Descriptives`, `Frequencies`, `Examine`, dan `Crosstabs`.

## Cara Menggunakan Worker

Sistem ini diakses melalui satu entry point, `manager.js`. Dari main thread, Anda membuat instance worker dan mengirim pesan dengan format tertentu.

### 1. Inisiasi Worker
```javascript
// Contoh di dalam React Hook atau komponen
const worker = new Worker(new URL('/workers/DescriptiveStatistics/manager.js', import.meta.url));
```

### 2. Mengirim Tugas Analisis
Gunakan `worker.postMessage()` untuk mengirim tugas. Objek pesan harus berisi `analysisType` dan `payload` yang sesuai dengan analisis yang diminta.

#### Skenario 1: Descriptives, Frequencies, atau Examine (Satu Variabel)
Untuk analisis univariat, kirim definisi satu variabel dan array data mentah.

**Contoh (`analysisType: 'descriptives'`)**:
```javascript
worker.postMessage({
  analysisType: 'descriptives',
  payload: {
    variable: { name: 'Age', measure: 'scale', type: 'numeric' },
    data: [25, 30, 35, 40, null],
    weights: [1, 1, 1, 1, 1] // opsional, kirim null jika tidak ada
  }
});
```
*   **Struktur yang sama berlaku untuk `frequencies` dan `examine`.** Cukup ubah nilai `analysisType`.

#### Skenario 2: Crosstabs (Tabulasi Silang)
Untuk tabulasi silang, `payload.variable` harus berisi definisi variabel baris (`row`) dan kolom (`col`). `payload.data` harus berupa array objek, di mana setiap objek merepresentasikan satu kasus.

**Contoh (`analysisType: 'crosstabs'`)**:
```javascript
worker.postMessage({
  analysisType: 'crosstabs',
  payload: {
    variable: { 
      row: { name: 'Gender', measure: 'nominal' },
      col: { name: 'Vote', measure: 'nominal' }
    },
    data: [ // Array of objects
      { Gender: 'Male', Vote: 'Yes' },
      { Gender: 'Female', Vote: 'No' },
      { Gender: 'Male', Vote: 'No' },
      { Gender: 'Female', Vote: 'Yes' },
    ],
    weights: null // opsional
  }
});
```

#### Skenario 3: Analisis Batch (Banyak Variabel)
Worker ini dirancang untuk memproses satu analisis per panggilan untuk menjaga responsivitas UI. Untuk menganalisis beberapa variabel (misalnya, menghitung deskriptif untuk 'Age', 'Income', dan 'Education'), **lakukan iterasi di main thread** dan kirim beberapa pesan.

**Contoh Pola Iterasi di Main Thread**:
```javascript
const variablesToAnalyze = [
  { name: 'Age', measure: 'scale', type: 'numeric' },
  { name: 'Income', measure: 'scale', type: 'numeric' },
  { name: 'Education', measure: 'ordinal', type: 'numeric' }
];

const allData = [ /* ... array data lengkap ... */ ];
const allWeights = [ /* ... array bobot ... */ ];

variablesToAnalyze.forEach(variable => {
  // Ekstrak data yang relevan untuk variabel ini jika perlu
  const dataForVar = allData.map(row => row[variable.name]);
  
  console.log(`Mengirim tugas untuk variabel: ${variable.name}`);
  worker.postMessage({
    analysisType: 'descriptives',
    payload: {
      variable: variable,
      data: dataForVar,
      weights: allWeights 
    }
  });
});
```
Pola ini memastikan bahwa setiap hasil analisis yang berat dikerjakan secara independen dan hasilnya dapat ditampilkan ke UI satu per satu saat sudah siap.

### 3. Menerima Hasil
Dengarkan event `message` dari worker untuk menerima hasil atau error. Pesan balasan akan berisi `variableName` untuk membantu Anda mencocokkan hasil dengan permintaan aslinya.

```javascript
worker.onmessage = (event) => {
  const { status, variableName, results, error } = event.data;

  if (status === 'success') {
    console.log(`Hasil untuk ${variableName}:`, results);
    // Update state React untuk variabel yang sesuai
  } else {
    console.error(`Error pada ${variableName}:`, error);
  }
};
```

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