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

- **Frequency Percent (Persentase Frekuensi)**: `(frequency / W) * 100`
- **Interquartile Range (IQR)**: `Q3 - Q1`
- **Outlier Fences (Batas Outlier)**:
  - **Inner Fences**: `Q1 - 1.5 * IQR` dan `Q3 + 1.5 * IQR`
  - **Outer Fences**: `Q1 - 3 * IQR` dan `Q3 + 3 * IQR`
- **Percentiles (Waverage Method)**: Menggunakan metode rata-rata tertimbang (Definisi 1 SPSS). Formula untuk persentil ke-p adalah:
  $$ x = (1-g_1^*)y_{k_1} + g_1^*y_{k_1+1} $$
  di mana `y` adalah nilai, `k` adalah indeks, dan `g` adalah fraksi interpolasi yang dihitung berdasarkan bobot kumulatif.

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

- **Confidence Interval for Mean**: $$ \bar{y} \pm t_{\alpha/2, W-1} \cdot SE_{mean} $$
  Di mana `t` adalah nilai t-kritis dengan derajat kebebasan `W-1`.


