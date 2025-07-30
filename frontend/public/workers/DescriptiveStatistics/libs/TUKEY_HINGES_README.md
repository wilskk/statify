# Tukey's Hinges Implementation

## Overview
Implementasi Tukey's Hinges telah ditambahkan ke dalam sistem perhitungan persentil di `frequency.js` dan `examine.js`.

## Metode yang Tersedia

### 1. FrequencyCalculator
- **Method**: `getPercentile(p, 'tukeyhinges')`
- **Supported percentiles**: 25, 50, 75 (Q1, Q2, Q3)
- **Fallback**: Untuk persentil lainnya, otomatis menggunakan metode `waverage`

### 2. ExamineCalculator
- **Method**: Tersedia dalam hasil `getStatistics()` sebagai `percentiles.tukeyhinges`
- **Output**: Objek dengan persentil 5, 10, 25, 50, 75, 90, 95

## Algoritma

### Untuk Data Tanpa Bobot (c[i] = 1 untuk semua i)
Menggunakan metode Tukey's Hinges standar:

1. **Q2 (Median)**:
   - Jika n ganjil: `y[floor(n/2)]`
   - Jika n genap: `(y[n/2-1] + y[n/2]) / 2`

2. **Q1 (Lower Hinge)**:
   - Ambil lower half data (termasuk median jika n ganjil)
   - Hitung median dari lower half

3. **Q3 (Upper Hinge)**:
   - Ambil upper half data (termasuk median jika n ganjil)
   - Hitung median dari upper half

### Untuk Data Berbobot
Otomatis fallback ke metode `waverage` (Weighted Average Definition 1).

## Contoh Penggunaan

```javascript
// Membuat calculator
const calc = new FrequencyCalculator({
    variable: { name: 'test', measure: 'scale' },
    data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
});

// Menghitung kuartil dengan Tukey's Hinges
const Q1 = calc.getPercentile(25, 'tukeyhinges'); // 3
const Q2 = calc.getPercentile(50, 'tukeyhinges'); // 5.5
const Q3 = calc.getPercentile(75, 'tukeyhinges'); // 8

// Persentil lainnya (fallback ke waverage)
const P10 = calc.getPercentile(10, 'tukeyhinges'); // sama dengan waverage
```

## Hasil Test

### Data [1,2,3,4,5,6,7,8,9,10]
- **Q1**: 3 (median dari [1,2,3,4,5])
- **Q2**: 5.5 (median dari [1,2,3,4,5,6,7,8,9,10])
- **Q3**: 8 (median dari [6,7,8,9,10])

### Perbandingan dengan Waverage
- **Tukey's Hinges**: Q1=3, Q2=5.5, Q3=8
- **Waverage**: Q1=2.5, Q2=5, Q3=7.5

## Referensi
- Tukey's Hinges menggunakan metode "inclusive quartiles" <mcreference link="https://www.icalcu.com/stat/fivenum.html" index="5">5</mcreference>
- SPSS menggunakan Tukey's Hinges untuk boxplot <mcreference link="https://www.ibm.com/support/pages/boxplots-hinges-and-quartiles" index="1">1</mcreference>
- Berbeda dengan metode persentil lainnya karena tidak menggunakan interpolasi <mcreference link="https://www.researchgate.net/post/reporting_interquartile_range-weighted_average_or_tukey_hinges-which_one_to_report_as_spss_gives_both_and_the_values_are_different_by_each_method" index="3">3</mcreference>