# README — Statistics Guide / Frequencies

README ini merangkum isi folder `frontend/app/help/components/statistics-guide/frequencies/`.

 Diperbarui otomatis: 12 Agustus 2025 12:21 WIB

## Isi folder
- `Frequencies.tsx`
- `index.ts`
- `tabs/`
  - `tabs/OverviewTab.tsx`
  - `tabs/VariablesTab.tsx`
  - `tabs/StatisticsTab.tsx`
  - `tabs/ChartsTab.tsx`

## Komponen Utama
- `Frequencies.tsx`
  - Menggunakan `StandardizedGuideLayout` untuk tata letak panduan.
  - Mendefinisikan tab aktif: `overview` (Ringkasan), `variables` (Variabel), `statistics` (Statistik), `charts` (Grafik); `defaultTab="overview"`.

  - `index.ts`
  - Re-eksport `Frequencies`.

## Tabs & Konten (disarikan dari implementasi)
- __OverviewTab (`tabs/OverviewTab.tsx`)__
  - Pengantar “Apa itu Analisis Frekuensi?”
  - Kapan digunakan (inline di mobile, tampil di summary untuk layar besar):
    - Memahami distribusi data kategorikal
    - Mengidentifikasi nilai yang paling umum
    - Memeriksa kualitas data dan nilai yang hilang
    - Mempersiapkan data untuk analisis lebih lanjut
  - Yang akan Anda pelajari: memilih variabel, opsi statistik, opsi grafik, interpretasi hasil.

- __VariablesTab (`tabs/VariablesTab.tsx`)__
  - Langkah UI:
    1) Pilih Variabel — semua tipe didukung (NUMERIC, STRING, DATE)
    2) Tambahkan ke Analisis — seret atau gunakan tombol panah
    3) Display Frequency Tables — centang untuk menampilkan frequency, percent, valid percent, cumulative percent
  - Level pengukuran & output:
    - Nominal & Ordinal: tabel frekuensi, mode, statistik deskriptif terbatas
    - Scale (Numeric): semua statistik tersedia + quartiles, percentiles, extreme values
    - Date variables: otomatis dikonversi ke SPSS seconds, diperlakukan sebagai scale
  - Jenis variabel yang didukung:
    - ✓ Numerik — `NUMERIC`, `COMMA`, `DOT`, `SCIENTIFIC`, `DOLLAR`, `RESTRICTED_NUMERIC`
    - ✓ String — `STRING`
    - ✓ Tanggal — `DATE`, `ADATE`, `EDATE`, `SDATE`, `JDATE`, `QYR`, `MOYR`, `WKYR`, `DATETIME`, `TIME`, `DTIME`
  - Missing & Weights:
    - Missing dipisahkan dalam tabel; `Valid percent` memakai kasus valid saja
    - `Weights` (jika ada) digunakan untuk weighted counts; default bobot = 1
    - `Cumulative percent` dihitung dari valid cases
  - Tips: multiple variables; value labels diterapkan otomatis; sorting numeric/alfabetis; date `dd-mm-yyyy` → SPSS seconds.

- __StatisticsTab (`tabs/StatisticsTab.tsx`)__
  - Aktivasi: centang “Display statistics” untuk menghitung statistik; semua formula menggunakan bobot `W`.
  - Central Tendency:
    - Mean: `\bar{x} = S/W = (\sum w_i x_i)/(\sum w_i)` — scale saja
    - Median: persentil ke-50 (weighted, interpolasi linier) — scale & ordinal
    - Mode: nilai dengan frekuensi tertinggi — semua level (nominal/ordinal/scale)
    - Sum: `\mathrm{Sum} = S = \sum w_i x_i` — scale saja
  - Dispersion (scale saja):
    - Std. deviation: `s = \sqrt{M_2/(W-1)}`
    - Variance: `s^2 = M_2/(W-1)`
    - Range: `\max(x) - \min(x)`
    - Minimum & Maximum: `\min(x), \max(x)`
    - S.E. mean: `SE_{\bar{x}} = s/\sqrt{W}`
  - Distribution (scale saja):
    - Skewness: `g_1 = (W M_3)/((W-1)(W-2) s^3)`
    - Kurtosis: `g_2 = (W(W+1) M_4 - 3 M_2^2 (W-1))/((W-1)(W-2)(W-3) s^4)`
  - Percentiles & Quartiles:
    - Quartiles: `Q1 = P_{25}`, `Q2 = P_{50}`, `Q3 = P_{75}` — scale & ordinal
    - Cut points for equal groups: `P_i` pada `100i/n` — scale & ordinal
    - Percentiles: `P_k` (0–100), dukung multiple percentiles; metode: `waverage`, `tukey`, `haverage`
  - Pembatasan berdasarkan level measurement:
    - Nominal: hanya mode
    - Ordinal: mode, median, quartiles, percentiles
    - Scale: semua statistik (menggunakan DescriptiveCalculator)
    - Extreme values: hanya untuk scale (5 nilai terendah & tertinggi)
  - Tips: default metode persentil `waverage`; statistics menggunakan `weights` jika tersedia; date variabel = scale; missing memengaruhi valid/cumulative percent.

- __ChartsTab (`tabs/ChartsTab.tsx`)__
  - Opsi Grafik: centang “Display charts” untuk menampilkan grafik dalam hasil.
  - Jenis Grafik:
    - None — tanpa grafik
    - Bar charts — frekuensi kategori
    - Pie charts — proporsi kategori
    - Histograms — distribusi data numerik kontinu
  - Nilai Grafik:
    - Frequencies — nilai absolut
    - Percentages — persentase (tidak tersedia untuk histogram)
  - Tips: Bar (kategorikal/ordinal), Pie (proporsi, ≤7 kategori), Histogram (kontinu), pilih frekuensi vs persentase sesuai kebutuhan.

## Navigasi & Penambahan Tab
- Tata letak: `StandardizedGuideLayout` (halaman) dan `StandardizedContentLayout` (bagian/tab) untuk konsistensi UI.
- Menambah tab baru:
  1) Buat komponen di `tabs/` dan export.
  2) Import komponen dan tambahkan ke array `tabs` di `Frequencies.tsx` dengan `{ id, label, icon, component }`.
  3) Gunakan ikon dari `lucide-react` agar konsisten.
- Default tab: `overview`.

## Ketergantungan UI
- `lucide-react` untuk ikon (mis. `Calculator`, `BarChart3`, `Table`, `BookOpen`, `HelpCircle`, `FileText`, `TrendingUp`).
- `react-katex` dan `katex/dist/katex.min.css` untuk formula matematika (digunakan di `StatisticsTab.tsx`).
- Komponen bantuan UI: `HelpCard`, `HelpAlert` dari `@/app/help/ui/HelpLayout`.

## Catatan Teknis
- Perhitungan berbobot: default weight = 1 jika tidak ditentukan.
- Missing values: dipisahkan dari perhitungan; `Valid percent` dan `Cumulative percent` hanya berdasarkan valid cases.
- Percentiles: mendukung metode `waverage` (default), `tukey`, `haverage`; berbasis kumulatif bobot + interpolasi linier.
- Mapping measurement saat tidak diketahui (desain umum): numeric → scale, string → nominal, date → scale.
- Konversi tanggal: string `dd-mm-yyyy` diparse ke SPSS seconds untuk komputasi numerik dan ditampilkan kembali sesuai format.
- Sorting: numeric diurutkan numerik; string alfabetis; date mengikuti urutan waktu.
- Value labels: diterapkan otomatis bila tersedia.
- Batasan statistik: sebagian hanya untuk level `scale` (mean, std dev, variance, range, SE mean, skewness, kurtosis, extreme values).

## Catatan
- Daftar di atas berasal dari struktur folder saat pembuatan README.
- Bila menambah tab baru, tambahkan berkas di `tabs/` dan sesuaikan impor/ekspor di komponen terkait bila diperlukan.
