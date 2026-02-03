## Curve Estimation Worker — Developer Guide

File: `public/workers/CurveEstimation/curve_estimation.js`

### Tujuan
- Fitting multi–model (Linear, Logarithmic, Inverse, Quadratic, Cubic, Compound, Power, S, Growth, Exponential, Logistic) terhadap pasangan (X, Y) pada Web Worker.
- Menghasilkan tabel ringkasan dengan statistik model dan parameter, siap dirender di Output View.

### Kontrak I/O
- Input (postMessage):
```js
{
  action: 'runRegression',
  data: {
    models: string[],
    X: number[],
    Y: number[],
    dependentName: string,
    independentNames: string[],
    upperBound?: number // opsional untuk Logistic
  }
}
```

- Output (onmessage):
```js
{
  action: 'regressionResults',
  data: {
    success: true,
    result: { tables: [/* Model Summary and Parameter Estimates */] },
    metadata: {
      dependentVariable: string,
      independentVariables: string[],
      numObservations: number,
      upperBoundUsed: number | undefined
    }
  }
}
```
Pada error: `{ action: 'error', data: { message, stack } }`.

### Urutan Model
Output diurutkan mengikuti konstanta `MODEL_ORDER` agar konsisten: Linear → Logarithmic → Inverse → Quadratic → Cubic → Compound → Power → S → Growth → Exponential → Logistic.

### Transformasi Model (ringkas)
- Linear: Y ~ a + bX
- Logarithmic: Y ~ a + b ln(X) (X > 0)
- Inverse: Y ~ a + b/X (X ≠ 0)
- Quadratic: Y ~ a + bX + cX²
- Cubic: Y ~ a + bX + cX² + dX³
- Power: ln(Y) ~ ln(a) + b ln(X) (X,Y > 0) → Y = a X^b
- Compound: ln(Y) ~ ln(a) + X ln(b) (Y > 0) → Y = a b^X
- S: ln(Y) ~ ln(a) + b (1/X) (Y > 0, X ≠ 0) → Y = a e^{b/X}
- Growth/Exponential: ln(Y) ~ ln(a) + bX (Y > 0) → Y = a e^{bX}
- Logistic: transformasi ln(1/Y − 1/c) dengan batas atas c (lihat di bawah).

### Logistic — Perilaku `upperBound`
- Jika `upperBound` tidak diberikan/invalid atau ≤ max(Y), worker memilih c = 1.02 × max(Y).
- Data difilter ke 0 < Y < c; jika sampel terlalu sedikit, `isEstimated: true` dan statistik (R²/F/p) difallback 0/1.
- Bila `upperBound` tidak diisi, statistik (R²/F/p/df) diselaraskan ke model Growth (meniru perilaku SPSS). Kolom b2 (c) dibiarkan kosong.
- Bila `upperBound` diisi, b2 menampilkan nilai c.

### Statistik yang Dihitung
- Regresi linear sederhana/polinom: normal equations (X'X)^−1X'y, lalu SSE/SST → R², F, df1, df2, p-value via F CDF.
- Model transformasi menghitung pada domain tertransformasi (ln, 1/x) dan memetakan kembali parameter jika perlu (mis. a = exp(b0)).

### Struktur Tabel Output
Tabel: "Model Summary and Parameter Estimates".
- Kolom bertingkat:
  - Equation
  - Model Summary: R Square, F, df1, df2, p-value
  - Parameter Estimates: Constant, b1, b2, b3
- Setiap sel nilai biasanya punya versi dibulatkan dan mentah: mis. `"F"` dan `"F_raw"`, `"Constant"` dan `"Constant_raw"`.

### Catatan Implementasi
- P-value F dihitung dengan `fCDF` (berbasis `betai/gammaln`).
- Operasi matriks memakai Gauss–Jordan sederhana; cek singularitas minimal disediakan.
- Domain tidak valid (X ≤ 0 untuk log, Y ≤ 0 untuk ln(Y), X = 0 untuk inverse/S) menghasilkan baris kosong.

### Menambah/Modifikasi Model
1) Tambah fungsi `try<Model>` baru yang mengembalikan objek dengan kunci minimal: { r2, f, df1, df2, sig, dan parameter a/b/… }.
2) Tambahkan ke `MODEL_ORDER` dan switch di `generateRegressionSummary` agar membangun baris tabel sesuai struktur.
3) Pertahankan pasangan nilai dibulatkan dan nilai raw (`*_raw`) untuk konsistensi UI.


