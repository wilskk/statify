# DataProcessingService Documentation

## Overview

`DataProcessingService` adalah service terpisah yang bertanggung jawab untuk memproses raw data (dari CSV/SPSS) menjadi struktur data yang dibutuhkan oleh `ChartService`. Service ini memisahkan concerns antara data processing dan chart configuration.

## Architecture

```
Raw Data (CSV/SPSS) → DataProcessingService → Processed Data → ChartService → Chart JSON
```

## Aggregation Configuration System

`DataProcessingService` menggunakan sistem konfigurasi untuk memastikan aggregation yang digunakan sesuai dengan kebutuhan chart type:

### Konfigurasi Aggregation per Chart Type

- **Full Aggregation Support**: `sum`, `count`, `average`, `none`

  - Vertical Bar Chart, Horizontal Bar Chart, Line Chart, Area Chart, Pie Chart
  - Error Bar Chart, Frequency Polygon, Summary Point Plot

- **Data Mentah Only**: `none`

  - Boxplot, Dot Plot, Violin Plot

- **Limited Aggregation**: `sum`, `none`

  - Stacked/Clustered charts, 3D Bar charts, Difference Area, Bar & Line

- **Count Only**: `count`, `none`

  - Histogram, Stacked Histogram

- **Data Individual Only**: `none`
  - Scatter plots, Range charts, Boxplots, dll

### Validasi Aggregation

Service akan:

1. **Validasi** aggregation yang diminta sesuai konfigurasi chart type
2. **Auto-correct** jika aggregation tidak didukung (gunakan opsi pertama yang didukung)
3. **Force "none"** untuk chart yang hanya mendukung data mentah
4. **Throw error** dengan pesan yang jelas jika aggregation tidak valid

### Contoh Error Handling

```typescript
// ❌ Error: Aggregation "sum" tidak didukung untuk Dot Plot
const result = DataProcessingService.processDataForChart({
  chartType: "Dot Plot",
  aggregation: "sum", // Error!
  // ...
});

// ✅ Auto-correct: Gunakan "none" untuk Dot Plot
const result = DataProcessingService.processDataForChart({
  chartType: "Dot Plot",
  aggregation: "sum", // Akan diubah ke "none" otomatis
  // ...
});
```

## Interface

### DataProcessingInput

```typescript
interface DataProcessingInput {
  // Required
  chartType: string;
  rawData: any[][]; // Raw data dari CSV/SPSS
  variables: Array<{ name: string; type?: string }>; // Variable definitions

  // Chart variables mapping
  chartVariables: {
    x?: string[]; // X-axis variables
    y?: string[]; // Y-axis variables
    z?: string[]; // Z-axis variables (3D)
    groupBy?: string[]; // Grouping variables
    low?: string[]; // Low values (range charts)
    high?: string[]; // High values (range charts)
    close?: string[]; // Close values (financial charts)
    y2?: string[]; // Secondary Y-axis
  };

  // Data processing options
  processingOptions?: {
    aggregation?: "sum" | "count" | "average" | "none";
    filterEmpty?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    limit?: number;
  };
}
```

## Methods

### processDataForChart(input: DataProcessingInput): any[]

Method utama yang memproses raw data berdasarkan chart type dan mengembalikan processed data array.

## Supported Chart Types

### Simple Charts

- Vertical Bar Chart
- Horizontal Bar Chart
- Line Chart
- Area Chart
- Pie Chart
- Boxplot
- Error Bar Chart
- Dot Plot
- Frequency Polygon
- Summary Point Plot
- Violin Plot

### Scatter Charts

- Scatter Plot
- Scatter Plot With Fit Line

### Stacked/Grouped Charts

- Vertical Stacked Bar Chart
- Horizontal Stacked Bar Chart
- Clustered Bar Chart
- Multiple Line Chart
- Stacked Area Chart
- Population Pyramid

### 3D Charts

- 3D Bar Chart
- 3D Bar Chart2
- 3D Scatter Plot
- Clustered 3D Bar Chart
- Stacked 3D Bar Chart

### Grouped Charts

- Grouped Scatter Plot
- Drop Line Chart

### Range Charts

- Simple Range Bar
- High-Low-Close Chart
- Clustered Range Bar

### Special Charts

- Difference Area
- Vertical Bar & Line Chart
- Dual Axes Scatter Plot
- Grouped 3D Scatter Plot
- Histogram
- Density Chart
- Stem And Leaf Plot
- Stacked Histogram
- Clustered Error Bar Chart
- Scatter Plot Matrix
- Clustered Boxplot
- 1-D Boxplot

## Supported Chart Types & Aggregation Usage

| Chart Type                   | Aggregation Supported? | Supported Aggregation                        |
| ---------------------------- | :--------------------: | -------------------------------------------- |
| Vertical Bar Chart           |           ✅           | `sum`, `count`, `average`, `none`            |
| Horizontal Bar Chart         |           ✅           | `sum`, `count`, `average`, `none`            |
| Line Chart                   |           ✅           | `sum`, `count`, `average`, `none`            |
| Area Chart                   |           ✅           | `sum`, `count`, `average`, `none`            |
| Pie Chart                    |           ✅           | `sum`, `count`, `average`, `none`            |
| Boxplot                      |           ✅           | `none` (data mentah)                         |
| Error Bar Chart              |           ✅           | `sum`, `count`, `average`, `none`            |
| Dot Plot                     |           ✅           | `none` (data individual)                     |
| Frequency Polygon            |           ✅           | `sum`, `count`, `average`, `none`            |
| Summary Point Plot           |           ✅           | `sum`, `count`, `average`, `none`            |
| Violin Plot                  |           ✅           | `none` (data mentah)                         |
| Scatter Plot                 |           ✅           | `none` (data individual)                     |
| Scatter Plot With Fit Line   |           ✅           | `none` (data individual)                     |
| Vertical Stacked Bar Chart   |           ✅           | `sum` (untuk setiap subkategori), `none`     |
| Horizontal Stacked Bar Chart |           ✅           | `sum` (untuk setiap subkategori), `none`     |
| Clustered Bar Chart          |           ✅           | `sum` (untuk setiap subkategori), `none`     |
| Multiple Line Chart          |           ✅           | `sum` (untuk setiap subkategori), `none`     |
| Stacked Area Chart           |           ✅           | `sum` (untuk setiap subkategori), `none`     |
| Population Pyramid           |           ✅           | `sum` (untuk setiap subkategori), `none`     |
| 3D Bar Chart                 |           ✅           | `sum` (untuk kombinasi x-z), `none`          |
| 3D Bar Chart2                |           ✅           | `sum` (untuk kombinasi x-z), `none`          |
| 3D Scatter Plot              |           ✅           | `none` (data individual)                     |
| Clustered 3D Bar Chart       |           ✅           | `sum` (untuk kombinasi kategori), `none`     |
| Stacked 3D Bar Chart         |           ✅           | `sum` (untuk kombinasi kategori), `none`     |
| Grouped Scatter Plot         |           ✅           | `none` (data individual)                     |
| Drop Line Chart              |           ✅           | `none` (data individual)                     |
| Simple Range Bar             |           ✅           | `none` (data individual)                     |
| High-Low-Close Chart         |           ✅           | `none` (data individual)                     |
| Clustered Range Bar          |           ✅           | `none` (data individual)                     |
| Difference Area              |           ✅           | `sum` (untuk value0 dan value1), `none`      |
| Vertical Bar & Line Chart    |           ✅           | `sum` (untuk barValue dan lineValue), `none` |
| Dual Axes Scatter Plot       |           ✅           | `none` (data individual)                     |
| Grouped 3D Scatter Plot      |           ✅           | `none` (data individual)                     |
| Histogram                    |          ✅\*          | `count` (binning di visualisasi), `none`     |
| Density Chart                |           ✅           | `none` (data individual)                     |
| Stacked Histogram            |          ✅\*          | `count` (binning di visualisasi), `none`     |
| Clustered Error Bar Chart    |           ✅           | `sum` (untuk value, error tetap 2), `none`   |
| Scatter Plot Matrix          |           ✅           | `none` (data individual)                     |
| Clustered Boxplot            |           ✅           | `none` (data individual)                     |
| 1-D Boxplot                  |           ✅           | `none` (data individual)                     |
| Stem And Leaf Plot           |           ✅           | `none` (data individual)                     |

> **Catatan:**  
> ✅ = Aggregation parameter digunakan dan berpengaruh pada hasil.  
> ✅\* = Histogram/Stacked Histogram: hanya `count` yang digunakan, binning dilakukan di visualisasi.
>
> **`none` tersedia untuk semua chart type** sebagai opsi dasar untuk data mentah/individual tanpa aggregation.

### Cara Membaca Tabel

- **Aggregation Supported?** = ✅: Chart type ini mendukung aggregation, parameter `processingOptions.aggregation` akan digunakan.
- **Supported Aggregation**: Menunjukkan jenis aggregation yang benar-benar didukung oleh implementasi:
  - `sum`, `count`, `average`, `none`: Semua jenis aggregation didukung
  - `sum`, `none`: Hanya penjumlahan dan data mentah yang didukung
  - `count`, `none`: Hanya perhitungan jumlah dan data mentah yang didukung (untuk histogram)
  - `none`: Hanya data mentah/individual yang didukung (untuk chart yang tidak memerlukan aggregation)
  - Keterangan dalam kurung: Penjelasan tambahan tentang bagaimana aggregation diterapkan

**Contoh Penggunaan:**

- Untuk **Vertical Bar Chart**: Bisa menggunakan `sum`, `count`, `average`, atau `none`
- Untuk **Difference Area**: Bisa menggunakan `sum` atau `none` (data mentah)
- Untuk **Scatter Plot**: Hanya `none` yang efektif (data individual)
- Untuk **Histogram**: Bisa menggunakan `count` atau `none` (data mentah)

**Catatan Penting:**

- **`none` tersedia untuk semua chart type** sebagai opsi dasar
- Chart yang sebelumnya tidak mendukung aggregation sekarang mendukung `none`
- Ini memberikan konsistensi API di seluruh service

### Grouping Chart Berdasarkan Processing Function

**Charts dengan Full Aggregation Support** (`processSimpleChartData`):

- Vertical Bar Chart, Horizontal Bar Chart, Line Chart, Area Chart, Pie Chart
- Error Bar Chart, Frequency Polygon, Summary Point Plot
- **Mendukung**: `sum`, `count`, `average`, `none`

**Charts dengan Data Mentah Only** (`processSimpleChartData` dengan override):

- Boxplot, Dot Plot, Violin Plot
- **Mendukung**: `none` (data mentah/individual)

**Charts dengan Limited Aggregation** (fungsi khusus):

- Stacked/Clustered charts: `sum`, `none`
- 3D Bar charts: `sum`, `none`
- Difference Area, Bar & Line: `sum`, `none`
- Histogram: `count`, `none`
- Clustered Error Bar: `sum`, `none`

**Charts dengan Data Individual** (fungsi khusus):

- Scatter plots, Range charts, Boxplots, dll
- **Mendukung**: `none` (data mentah/individual)

## Usage Examples

### Example 1: Simple Bar Chart

```typescript
import { DataProcessingService } from "./Da
taProcessingService";

const rawData = [
  ["A", 30],
  ["B", 80],
  ["C", 45],
  ["D", 60],
];

const variables = [
  { name: "category", type: "string" },
  { name: "value", type: "number" },
];

const processedData = DataProcessingService.processDataForChart({
  chartType: "Vertical Bar Chart",
  rawData: rawData,
  variables: variables,
  chartVariables: {
    x: ["category"],
    y: ["value"],
  },
  processingOptions: {
    aggregation: "sum",
    filterEmpty: true,
  },
});

// Result: [{ category: "A", value: 30 }, { category: "B", value: 80 }, ...]
```

### Example 2: Scatter Plot

```typescript
const rawData = [
  [10, 20],
  [15, 25],
  [20, 30],
  [25, 35],
];

const variables = [
  { name: "x", type: "number" },
  { name: "y", type: "number" },
];

const processedData = DataProcessingService.processDataForChart({
  chartType: "Scatter Plot",
  rawData: rawData,
  variables: variables,
  chartVariables: {
    x: ["x"],
    y: ["y"],
  },
});

// Result: [{ x: 10, y: 20 }, { x: 15, y: 25 }, ...]
```

### Example 2.1: Scatter Plot with "none" aggregation (explicit)

```typescript
const processedData = DataProcessingService.processDataForChart({
  chartType: "Scatter Plot",
  rawData: rawData,
  variables: variables,
  chartVariables: {
    x: ["x"],
    y: ["y"],
  },
  processingOptions: {
    aggregation: "none", // Explicitly specify no aggregation
    filterEmpty: true,
  },
});

// Result: [{ x: 10, y: 20 }, { x: 15, y: 25 }, ...]
```

### Example 3: Bar Chart with "none" aggregation (data mentah)

```typescript
const rawData = [
  ["A", 30],
  ["B", 80],
  ["C", 45],
  ["D", 60],
];

const variables = [
  { name: "category", type: "string" },
  { name: "value", type: "number" },
];

const processedData = DataProcessingService.processDataForChart({
  chartType: "Vertical Bar Chart",
  rawData: rawData,
  variables: variables,
  chartVariables: {
    x: ["category"],
    y: ["value"],
  },
  processingOptions: {
    aggregation: "none",
    filterEmpty: true,
  },
});

// Result: [{ category: "A", value: 30 }, { category: "B", value: 80 }, ...]
```

### Example 4: Stacked Bar Chart

```typescript
const rawData = [
  ["A", "Group1", 30],
  ["A", "Group2", 20],
  ["B", "Group1", 25],
  ["B", "Group2", 15],
];

const variables = [
  { name: "category", type: "string" },
  { name: "group", type: "string" },
  { name: "value", type: "number" },
];

const processedData = DataProcessingService.processDataForChart({
  chartType: "Vertical Stacked Bar Chart",
  rawData: rawData,
  variables: variables,
  chartVariables: {
    x: ["category"],
    y: ["group"],
  },
});

// Result: [
//   { category: "A", subcategory: "Group1", value: 30 },
//   { category: "A", subcategory: "Group2", value: 20 },
//   ...
// ]
```

## Processing Options

### aggregation

- `'sum'`: Menjumlahkan nilai untuk kategori yang sama
- `'count'`: Menghitung jumlah data untuk kategori yang sama
- `'average'`: Menghitung rata-rata untuk kategori yang sama
- `'none'`: **Tidak melakukan aggregation** - data diproses satu per satu (data mentah/individual)

**Catatan tentang `none`:**

- Tersedia untuk **semua chart type** sebagai opsi dasar
- Untuk chart yang tidak memerlukan aggregation (scatter, boxplot, dll), `none` adalah pilihan yang tepat
- Untuk chart yang mendukung aggregation, `none` memberikan data mentah tanpa grouping
- **Penting**: Ketika menggunakan `none`, chart harus menampilkan **semua data point** termasuk yang category-nya sama (bisa dengan stacked, grouped, atau jitter)
- Memberikan konsistensi API di seluruh service

### **Behavior "none" Aggregation:**

**Charts dengan Full Aggregation Support:**

- `none` = Tampilkan semua data point apa adanya
- Jika ada category sama → chart harus handle dengan stacked/grouped/jitter
- User bisa melihat distribusi data yang sebenarnya

**Charts dengan Data Individual:**

- `none` = Data mentah tanpa modifikasi
- Setiap data point ditampilkan sesuai posisinya

**Contoh:**

```typescript
const data = [
  { category: "A", value: 10 },
  { category: "A", value: 15 }, // Category sama
  { category: "B", value: 20 },
];

// aggregation: "sum" → [{ category: "A", value: 25 }, { category: "B", value: 20 }]
// aggregation: "none" → [{ category: "A", value: 10 }, { category: "A", value: 15 }, { category: "B", value: 20 }]
```

### filterEmpty

- `true`: Filter data yang kosong/null/undefined
- `false`: Include semua data termasuk yang kosong

### sortBy

- Nama variable untuk sorting

### sortOrder

- `'asc'`: Ascending order
- `'desc'`: Descending order

### limit

- Jumlah maksimum data yang akan diproses

## Error Handling

Service akan throw error jika:

1. `rawData` kosong atau bukan array
2. `variables` kosong atau bukan array
3. Variable yang direferensikan di `chartVariables` tidak ditemukan dalam `variables`

## Integration with ChartService

```typescript
import { DataProcessingService } from "./DataProcessingService";
import { ChartService } from "./ChartService";

// Step 1: Process raw data
const processedData = DataProcessingService.processDataForChart({
  chartType: "Vertical Bar Chart",
  rawData: rawData,
  variables: variables,
  chartVariables: chartVariables,
});

// Step 2: Generate chart JSON
const chartJSON = ChartService.createChartJSON({
  chartType: "Vertical Bar Chart",
  chartData: processedData,
  chartVariables: chartVariables,
  chartMetadata: {
    title: "My Chart",
  },
});
```

## Benefits

1. **Separation of Concerns**: Data processing terpisah dari chart configuration
2. **Reusability**: DataProcessingService bisa digunakan untuk berbagai chart types
3. **Testability**: Mudah untuk unit test data processing logic
4. **Maintainability**: Logic data processing terpusat di satu tempat
5. **Flexibility**: Mendukung berbagai chart types dan processing options
