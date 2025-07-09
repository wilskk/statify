# ChartService - Easy Chart Creation 📊

Service ini memungkinkan pembuatan chart JSON dengan **minimal konfigurasi**. Cukup berikan data, sisanya otomatis!

## ✨ Mengapa ChartService?

- **Super Sederhana**: Hanya butuh data array + chart type
- **Auto-Configuration**: Width, height, colors, labels semua otomatis
- **Flexible Data Format**: Terima berbagai format data
- **Multiple Charts**: Bisa bikin banyak chart sekaligus
- **Ready to Use**: Langsung dapat DOM element atau JSON

## 🚀 Quick Start

### Import

```typescript
import { ChartService } from "@/services/chart";
// atau
import { chartService } from "@/services";
```

### Penggunaan Paling Sederhana

```typescript
// Hanya butuh array angka!
const data = [10, 25, 40, 35, 60];
const chart = ChartService.quickChart(data, "Vertical Bar Chart");

// chart berisi semua konfigurasi lengkap!
console.log(chart);
```

## 📖 Examples

### 1. Array Sederhana

```typescript
const simpleData = [10, 25, 40, 35, 60, 45];
const chart = ChartService.quickChart(simpleData, "Line Chart");
```

### 2. Object Data (Auto-Detect Format)

```typescript
const data = [
  { name: "January", sales: 1000 },
  { name: "February", sales: 1500 },
  { name: "March", sales: 1200 },
];

const chart = ChartService.createChartJSON({
  data,
  chartType: "Bar Chart",
});
```

### 3. Dengan Custom Title

```typescript
const chart = ChartService.createChartJSON({
  data: myData,
  chartType: "Pie Chart",
  title: "Sales Distribution",
  subtitle: "Q1 2024",
});
```

### 4. Chart dengan Metadata Detail

```typescript
const chartJSON = ChartService.createChartJSON({
  data: myData,
  chartType: "Area Chart",
  title: "Sales Trend",
  subtitle: "Monthly Data",
});

// Akses metadata chart
console.log(chartJSON.charts[0].chartMetadata.axisInfo);
console.log(chartJSON.charts[0].chartConfig);
```

### 5. Multiple Charts dari Data Sama

```typescript
const charts = ChartService.createMultipleCharts(
  {
    data: myData,
    chartType: "Bar Chart",
  },
  ["Bar Chart", "Line Chart", "Pie Chart"]
);
```

## 🔧 API Reference

### `ChartService.createChartJSON(input)`

Membuat chart JSON dengan konfigurasi otomatis.

**Parameters:**

```typescript
interface ChartInput {
  data: any[]; // Required: Data array
  chartType: string; // Required: Chart type
  title?: string; // Optional: Chart title
  subtitle?: string; // Optional: Chart subtitle
  xAxisLabel?: string; // Optional: X axis label
  yAxisLabel?: string; // Optional: Y axis label
  width?: number; // Optional: Chart width (default: 680)
  height?: number; // Optional: Chart height (default: 550)
  colors?: string[]; // Optional: Custom colors
}
```

**Returns:**

```typescript
interface ChartJSON {
  charts: Array<{
    chartType: string;
    chartMetadata: {
      axisInfo: {
        category?: string;
        value?: string;
        x?: string;
        y?: string;
      };
      description?: string;
      notes?: string;
      title?: string;
      subtitle?: string;
      titleFontSize?: number;
      subtitleFontSize?: number;
    };
    chartData: any[];
    chartConfig: {
      width: number;
      height: number;
      chartColor: string[];
      useAxis: boolean;
      useLegend: boolean;
      axisLabels?: {
        x: string;
        y: string;
      };
    };
  }>;
}
```

### `ChartService.quickChart(data, chartType)`

Shortcut untuk membuat chart dari array angka sederhana.

### `ChartService.createAndRenderChart(input)`

Sama seperti `createChartJSON` tapi langsung render DOM element.

### `ChartService.createMultipleCharts(input, chartTypes)`

Membuat beberapa chart dengan types berbeda dari data yang sama.

## 📊 Supported Chart Types

- `"Vertical Bar Chart"`
- `"Horizontal Bar Chart"`
- `"Line Chart"`
- `"Pie Chart"`
- `"Area Chart"`
- `"Scatter Plot"`
- `"Boxplot"`
- _(Dan chart types lainnya akan ditambahkan)_

## 🎯 Data Format Auto-Detection

ChartService bisa otomatis mendeteksi format data:

### Format 1: Already Formatted

```typescript
[
  { category: "A", value: 30 },
  { category: "B", value: 80 },
];
```

### Format 2: Object dengan Key Bebas

```typescript
[
  { name: "Product A", sales: 1000 },
  { region: "North", revenue: 50000 },
];
```

### Format 3: Array Angka Sederhana

```typescript
[10, 25, 40, 35, 60];
```

## 💡 Untuk Module/Component Lain

Jika teman kamu mau bikin chart dari module lain:

```typescript
// Di module analysis result
import { ChartService } from "@/services/chart";

function createResultChart(analysisResult: any[]) {
  // Cukup satu baris!
  return ChartService.createChartJSON({
    data: analysisResult,
    chartType: "Bar Chart",
    title: "Analysis Results",
  });
}

// Atau pakai helper function
import { createChartForModule } from "@/services/chart/ChartExamples";

const chart = createChartForModule(myData, "Line Chart", "My Custom Title");
```

## 🔥 Advanced Features

### Batch Processing

```typescript
const datasets = [
  { name: "Sales", data: [100, 150, 120], type: "Line Chart" },
  { name: "Users", data: [{...}], type: "Pie Chart" }
];

const charts = datasets.map(dataset =>
  ChartService.createChartJSON({
    data: dataset.data,
    chartType: dataset.type,
    title: dataset.name
  })
);
```

### Custom Configuration Override

```typescript
const chart = ChartService.createChartJSON({
  data: myData,
  chartType: "Bar Chart",
  width: 800, // Override default width
  height: 600, // Override default height
  colors: ["#ff0000", "#00ff00", "#0000ff"], // Custom colors
});
```

## 🎨 Default Configurations

ChartService menggunakan konfigurasi default yang bagus:

- **Width**: 680px
- **Height**: 550px
- **Colors**: Palette warna yang harmonis
- **Axis**: Otomatis enabled
- **Fonts**: Ukuran dan warna yang readable
- **Labels**: Auto-generated dari data

## 🤝 Integrasi dengan Module Lain

Untuk teman yang mau integrasi dengan module analysis:

```typescript
// Di analysis result formatter
import { ChartService } from "@/services/chart";

export function formatAnalysisWithChart(analysisData: any) {
  const chart = ChartService.createChartJSON({
    data: analysisData.results,
    chartType: "Bar Chart",
    title: analysisData.title || "Analysis Results",
  });

  return {
    ...analysisData,
    chart: chart, // Tambahkan chart ke hasil analysis
  };
}
```

## 📝 Notes

- Service ini menggunakan chartUtils yang sudah ada
- Semua chart types yang didukung chartUtils bisa dipakai
- Error handling otomatis dengan fallback ke sample data
- Performance optimized untuk data besar

---

**TL;DR**: Cukup `ChartService.createChartJSON({ data: myData, chartType: "Bar Chart" })` dan chart langsung jadi! 🎉
