# README — Statistics Guide / Crosstabs

Panduan ini memberikan bantuan kontekstual untuk analisis **Crosstabs (Tabel Silang)** di aplikasi Statistik. Komponen ini dirancang untuk memberikan pemahaman mendalam tentang fitur, penggunaan, dan interpretasi hasil dari analisis crosstabs.

## Struktur Folder

Folder ini berisi komponen-komponen yang menyusun panduan bantuan untuk analisis Crosstabs.

- **`Crosstabs.tsx`**: Komponen utama yang merender keseluruhan antarmuka panduan, termasuk navigasi tab.
- **`README.md`**: Dokumentasi ini.
- **`index.ts`**: Mengekspor komponen `Crosstabs` untuk digunakan di tempat lain dalam aplikasi.
- **`tabs/`**: Subdirektori yang berisi semua komponen tab individual.

### Isi Folder `tabs`

- **`OverviewTab.tsx`**: Memberikan pengenalan umum tentang analisis Crosstabs, tujuan, dan kapan harus menggunakannya.
- **`VariablesTab.tsx`**: Menjelaskan cara memilih dan mengkonfigurasi variabel baris dan kolom untuk analisis.
- **`CellsTab.tsx`**: Panduan tentang cara mengkonfigurasi tampilan sel, termasuk frekuensi, persentase, dan residual.
- **`StatisticsTab.tsx`**: Merinci berbagai uji statistik yang tersedia, seperti Chi-Square dan Fisher's Exact Test, serta ukuran asosiasi.
- **`QuickStartGuide.tsx`**: Menyediakan panduan langkah demi langkah untuk melakukan analisis Crosstabs dari awal hingga akhir.

---
*Terakhir diperbarui: 13 Agustus 2025, 10:15 WIB*

Panduan ini memberikan bantuan kontekstual untuk analisis **Crosstabs (Tabel Silang)** di aplikasi Statistik. Komponen ini dirancang untuk memberikan pemahaman mendalam tentang fitur, penggunaan, dan interpretasi hasil dari analisis crosstabs.

## Struktur Folder

Folder ini berisi komponen-komponen yang menyusun panduan bantuan untuk analisis Crosstabs.

- **`Crosstabs.tsx`**: Komponen utama yang merender keseluruhan antarmuka panduan, termasuk navigasi tab.
- **`README.md`**: Dokumentasi ini.
- **`index.ts`**: Mengekspor komponen `Crosstabs` untuk digunakan di tempat lain dalam aplikasi.
- **`tabs/`**: Subdirektori yang berisi semua komponen tab individual.

### Isi Folder `tabs`

- **`OverviewTab.tsx`**: Memberikan pengenalan umum tentang analisis Crosstabs, tujuan, dan kapan harus menggunakannya.
- **`VariablesTab.tsx`**: Menjelaskan cara memilih dan mengkonfigurasi variabel baris dan kolom untuk analisis.
- **`CellsTab.tsx`**: Panduan tentang cara mengkonfigurasi tampilan sel, termasuk frekuensi, persentase, dan residual.
- **`StatisticsTab.tsx`**: Merinci berbagai uji statistik yang tersedia, seperti Chi-Square dan Fisher's Exact Test, serta ukuran asosiasi.
- **`QuickStartGuide.tsx`**: Menyediakan panduan langkah demi langkah untuk melakukan analisis Crosstabs dari awal hingga akhir.

---
*Terakhir diperbarui: 13 Agustus 2025, 10:15 WIB*
    - Mixed types: konsisten dalam tiap variabel.
  - Expected count & weighting:
    - Rule of thumb: expected ≥ 5 per sel untuk validitas uji Chi-Square.
    - Semua frekuensi & total menggunakan case weights bila tersedia.
    - Non-integer weights dapat di-round/truncate pada level kasus bila diperlukan.
  - Multiple variables:
    - Tiap row variable dipasangkan dengan tiap column variable → tabel terpisah.
    - Penamaan output: "RowVar * ColVar".
  - Tips: row variabel dengan kategori lebih sedikit; kolom untuk outcome memudahkan baca persentase; pastikan format tanggal konsisten; konfigurasikan weight bila data survei.

- __CellsTab (`tabs/CellsTab.tsx`)__
  - Counts:
    - Observed (default ON): frekuensi aktual (weighted).
    - Expected (default OFF): Eij = (row total_i × col total_j) / W, di-display `toSPSSFixed(..., 1)`; komputasi pakai nilai eksak.
    - Hide Small Counts (default OFF + threshold): sembunyikan cell dengan observed < threshold.
  - Percentages:
    - Row: rowPct_ij = observed_ij / rowTotals[i] × 100 (weighted). Display 1 desimal; label dinamis "% within [RowVar]".
    - Column: colPct_ij = observed_ij / colTotals[j] × 100 (weighted). Display 1 desimal; label dinamis "% within [ColVar]".
    - Total: totalPct_ij = observed_ij / W × 100. Display 1 desimal; label tetap "% of Total".
    - Weight handling: denominator menggunakan total berbobot yang sesuai.
  - Residuals:
    - Unstandardized: observed − expected.
    - Standardized: (O − E) / √E, |nilai| > 2 → indikasi deviasi signifikan.
    - Adjusted: standardized / √((1 − rowProp_i) × (1 − colProp_j)), dengan rowProp_i = rowTotals[i]/W dan colProp_j = colTotals[j]/W; |nilai| > 1.96 signifikan (α=0.05).
    - Semua residual di-display 1 desimal; komputasi mengikuti kompatibilitas SPSS.

- __StatisticsTab (`tabs/StatisticsTab.tsx`)__
  - Uji Chi-Square: hipotesis H₀ (independen) vs H₁ (ada hubungan), df = (r−1)(c−1), interpretasi p-value.
  - Asumsi: expected ≥ 5, observasi independen, sampel acak, kategori saling eksklusif.
  - Ukuran asosiasi & rumus:
    - Cramer’s V: V = √(χ² / (n · min(r−1, c−1))).
    - Phi (φ): φ = √(χ² / n) [khusus 2×2].
    - Contingency Coefficient (C): C = √(χ² / (χ² + n)).
    - Lambda (λ): λ = (E₁ + E₂ − E₀) / (2n − E₀) — PRE (proportional reduction in error).
  - Interpretasi kekuatan (panduan): 0.00–0.09 sangat lemah; 0.10–0.29 lemah; 0.30–0.49 sedang; 0.50–1.00 kuat.
  - Uji alternatif: Fisher’s Exact (bila expected kecil, ideal 2×2); Likelihood Ratio (G² = 2 Σ Oij ln(Oij/Eij)); Linear-by-Linear (keduanya ordinal, df=1).
  - Rekomendasi: 2×2 → Phi; tabel apapun → Cramer’s V; ordinal → Gamma/Tau-b/Tau-c; prediksi asimetrik → Lambda.

- __QuickStartGuide (`tabs/QuickStartGuide.tsx`)__
  - 6 langkah: upload data → pilih baris → pilih kolom → konfigurasi sel → pilih statistik → jalankan.
  - Disertai skenario umum, tips praktis, workflow rekomendasi, panduan interpretasi, dan troubleshooting (expected kecil, efek kecil, banyak sel kosong).

## Navigasi & Penambahan Tab
- __Tambah tab baru__
  - Buat file di `tabs/` dan ekspor komponennya.
  - Tambahkan entri ke array `tabs` di `Crosstabs.tsx` (id, label, icon, component).
  - Jika perlu, perbarui `summary` di `Crosstabs.tsx`.
- __Komponen bersama__
  - Layout: `../shared/StandardizedGuideLayout`.
  - Konten standar: `../../shared/StandardizedContentLayout`.

## Ketergantungan UI
- Ikon: `lucide-react` — `BookOpen`, `Database`, `Table`, `Calculator`, `HelpCircle`, `Grid3x3`, `Target`, `TrendingUp`, `BarChart3`, `EyeOff`, `Zap`.
- Layout & konten: `../shared/StandardizedGuideLayout`, `../../shared/StandardizedContentLayout` (`IntroSection`, `FeatureGrid`, `ConceptSection`, `ExampleGrid`).
- Komponen Help: `HelpCard`, `HelpAlert`, `HelpStep` dari `@/app/help/ui/HelpLayout`.
- Formula: `react-katex` (`BlockMath`, `InlineMath`) + `katex/dist/katex.min.css`.

## Catatan Teknis
- Weighting: seluruh frekuensi, total, expected, dan persentase mendukung case weights; default weight = 1 jika tidak diset. Grand total W = jumlah seluruh bobot valid.
- Missing values: `checkIsMissing()` berbasis definisi variabel; kasus dengan missing di baris ATAU kolom dikeluarkan dari tabel dan ringkasan memisahkan valid vs missing weights.
- Sorting: NUMERIC naik; STRING alfabetis natural (`localeCompare` dengan `numeric: true`); DATE kronologis via SPSS seconds; konsisten per variabel.
- Tanggal: deteksi `isDateString("dd-mm-yyyy")`; konversi `dateStringToSpssSeconds()` untuk komputasi; display via `spssSecondsToDateString()`.
- Expected counts: Eij = (row_i × col_j) / W; rule-of-thumb validitas χ²: expected ≥ 5; display dibulatkan 1 desimal (`toSPSSFixed`).
- Persentase: denominators berbobot; semua display dibulatkan 1 desimal (`toSPSSFixed`).
- Mapping measurement saat tidak diketahui (aturan global): numeric → scale; string → nominal; date → scale.
- Residuals: unstandardized/standardized/adjusted dihitung sesuai formula SPSS; display 1 desimal.
- Multiple variables: setiap pasangan Row*Col menghasilkan tabel terpisah; penamaan output "RowVarName * ColVarName".
- Label UI dinamis: "% within [RowVar]" / "% within [ColumnVar]" mengikuti nama variabel terpilih; "% of Total" tetap.

## Catatan
- Daftar di atas berasal dari struktur folder saat pembuatan README.
- Bila menambah tab baru, tambahkan berkas di `tabs/` dan sesuaikan impor/ekspor di komponen terkait bila diperlukan.
