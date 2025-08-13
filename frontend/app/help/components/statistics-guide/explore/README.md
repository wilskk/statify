# README — Statistics Guide / Explore

README ini merangkum isi folder `frontend/app/help/components/statistics-guide/explore/`.

Diperbarui otomatis: 12 Agustus 2025 13:35 WIB

## Isi folder
- `Explore.tsx`
- `index.ts`
- `tabs/`
  - `tabs/OverviewTab.tsx`
  - `tabs/QuickStartGuide.tsx`
  - `tabs/VariablesTab.tsx`
  - `tabs/StatisticsTab.tsx`
  - `tabs/PlotsTab.tsx`

## Komponen Utama
- `Explore.tsx`
  - Menggunakan `StandardizedGuideLayout` dengan tab aktif: `overview`, `variables`, `statistics`, `plots` (default: `overview`).
  - Sidebar summary memakai `HelpCard` berjudul "Kapan Menggunakan Analisis Explore".
  - Merender `QuickStartGuide` di bawah area utama.
- `index.ts` — Re-eksport `Explore`.

## Tabs & Konten (disarikan dari implementasi)

- __OverviewTab (`tabs/OverviewTab.tsx`)__
- Pengantar: Apa itu Analisis Explore? Memakai "ExamineCalculator" untuk statistik robust (SPSS EXAMINE logic), menggabungkan Descriptive + Frequency + robust methods.
- Komponen yang dipelajari:
  - 5% Trimmed Mean: estimator central tendency yang tahan outlier.
  - Tukey's Hinges IQR: Q1/Q3 berbasis metode Tukey (bukan percentile biasa), dipakai untuk IQR.
  - Outlier Detection: Tukey fences 1.5×IQR (mild) dan 3×IQR (extreme).
  - M-Estimators: Huber, Tukey, Hampel, Andrews (saat ini diaproksimasi dengan 5% trimmed mean).


- __VariablesTab (`tabs/VariablesTab.tsx`)__
- Info: Explore ideal untuk eksplorasi awal, deteksi outlier (Tukey), dan statistik robust.
- Kapan digunakan (ringkasan): robust exploration, deteksi outlier, 5% trimmed mean, by-group (factor), confidence interval.
- Memilih variabel:
  1) Dependent List (wajib): satu/lebih variabel NUMERIC.
  2) Factor List (opsional): variabel kategorikal (semua tipe) untuk by-group analysis.
  3) Tiap dependent dianalisis robust; factor membagi hasil per level.
- Jenis variabel yang didukung:
  - Dependent (NUMERIC only): scale/interval, ordinal numerik, continuous/discrete. Tipe DATE dikecualikan dari perhitungan numerik.
  - Factor (semua tipe): NUMERIC/STRING/DATE; semua measurement level (nominal, ordinal, scale).
- Tips: minimal 1 dependent numeric, factor opsional, multiple dependents dianalisis terpisah, computation per kombinasi dependent×factor, available list otomatis menyaring hanya NUMERIC valid.
- Data & logic:
  - Missing dan valid N dihitung per variabel; computation mendukung weights.
  - Measurement level logic: `isNumeric = (measure==='scale' || measure==='ordinal') && coreType!=='date'`.
  - Nominal/DATE: hanya frequency statistics, tanpa descriptive computations.

- __StatisticsTab (`tabs/StatisticsTab.tsx`)__
- Ringkas: ExamineCalculator = Descriptive + Frequency + robust (5% trimmed, Tukey's Hinges IQR, M-estimators).
- Opsi Statistik:
  - Descriptives (checkbox): aktifkan statistik dasar + 5% trimmed mean; termasuk keluaran DescriptiveCalculator dan FrequencyCalculator.
  - Weighted Mean: x̄_w = Σ(wᵢxᵢ) / Σ(wᵢ).
  - 5% Trimmed Mean: mean setelah menghapus 5% nilai terendah & tertinggi berdasar weight.
  - Tukey's Hinges IQR: IQR = Q3 − Q1 (Tukey method, bukan percentile biasa).
  - Confidence Interval for Mean (input): default 95%; CI = x̄ ± t(α/2,df) × SE, dengan SE = s/√n, df = n−1, t via `getTCriticalApproximation()`.
  - Outliers (checkbox): deteksi mild (1.5×IQR) dan extreme (3×IQR); Q1/Q3 memakai Tukey's Hinges.
  - M-Estimators (always computed): daftar Huber, Tukey, Hampel, Andrews; kini diaproksimasi 5% trimmed mean.
- Percentiles & tambahan:
  - Default percentiles: [5, 10, 25, 50, 75, 90, 95] dengan metode HAVERAGE (default SPSS EXAMINE), dapat diubah via `options.percentileMethod`.
  - Frequency statistics (N, valid, missing) digabungkan dengan descriptive.
- Rekomendasi: aktifkan Descriptives, CI 95% (99% untuk konservatif), Outliers bila diduga ada extreme values, andalkan robust estimators.

- __PlotsTab (`tabs/PlotsTab.tsx`)__
- Opsi Visualisasi Explore:
  - Boxplots (radio): None; Factor levels together; Dependents together; Dependents separately.
  - Descriptives (checkboxes): Stem-and-leaf; Histogram.
  - Normality plots: dihapus dari UI sesuai requirement.
- Panduan/Tips:
  - Boxplot + Outliers: outlier detection memakai Tukey's Hinges.
  - Factor levels together untuk perbandingan antar kelompok; Dependents separately untuk skala variabel berbeda.
  - Stem-and-leaf untuk N kecil-menengah; Histogram untuk N besar; kombinasi Boxplot + Histogram memberi gambaran shape+outliers.

- __QuickStartGuide (`tabs/QuickStartGuide.tsx`)__
- Langkah cepat (6 langkah): Upload data → pilih dependent numeric → tambah factor (opsional) → atur Statistics → atur Plots → Run Analysis.

- Output: Descriptives (Mean, SD, 5% trimmed, CI), Frequencies (N, valid, missing, median, quartiles), M-Estimators, Percentiles [5..95], Extreme values dengan case identification.


## Navigasi & Penambahan Tab
- Layout: `StandardizedGuideLayout` (`title`, `description`, `tabs`, `defaultTab`, `summary`). `QuickStartGuide` dirender setelah layout.
- Menambah tab: buat berkas di `tabs/`, ekspor komponennya, lalu daftarkan pada array `tabs` di `Explore.tsx` (beri `id`, `label`, `icon`, `component`).
- `index.ts`: re-export untuk import terpusat.

## Ketergantungan UI
- Ikon: `lucide-react` (Calculator, BarChart3, Table, BookOpen, HelpCircle, FileText, Zap).
- Rumus: `react-katex` + `katex/dist/katex.min.css` (digunakan di `StatisticsTab.tsx`).
- Komponen bantuan: `HelpCard`, `HelpAlert`, `HelpStep` dari `@/app/help/ui/HelpLayout`.
- Konten standar: `StandardizedGuideLayout` dan `StandardizedContentLayout` (shared components).

## Catatan Teknis
- Weights: semua perhitungan mendukung weights (default weight = 1 jika tidak ada).
- Missing values: nilai non-numeric/missing dikeluarkan; laporan menyertakan N, N valid, N missing per variabel.
- Pemilihan variabel: Dependent hanya NUMERIC; Factor menerima semua tipe (NUMERIC/STRING/DATE). Tipe DATE tidak ikut perhitungan numerik.
- isNumeric check: `(measure==='scale' || measure==='ordinal') && coreType!=='date'`; konversi angka melalui `toNumeric()` bila perlu.
- Percentiles: default HAVERAGE (SPSS EXAMINE); konfigurable via `options.percentileMethod`.
- Outliers: Tukey fences (mild 1.5×IQR, extreme 3×IQR) dengan Q1/Q3 dari Tukey's Hinges.
- Confidence interval: t-distribution, `getTCriticalApproximation()`, pendekatan akurat untuk df > 30.
- Sorting & labels: numeric diurut naik, string alfabetis, date kronologis; value labels diterapkan bila tersedia.
- Measurement mapping (saat measurement unknown, aturan global statistik): numeric → scale; string → nominal; date → scale.

## Catatan
- Daftar di atas berasal dari struktur folder saat pembuatan README.
- Bila menambah tab baru, tambahkan berkas di `tabs/` dan sesuaikan impor/ekspor di komponen terkait bila diperlukan.
