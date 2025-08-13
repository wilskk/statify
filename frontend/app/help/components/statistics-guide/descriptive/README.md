# README — Statistics Guide / Descriptive

README ini merangkum isi folder `frontend/app/help/components/statistics-guide/descriptive/`.

Diperbarui otomatis: 12 Agustus 2025 14:35 WIB

## Isi folder
- `DescriptiveAnalysis.tsx`
- `index.ts`
- `tabs/`
  - `tabs/OverviewTab.tsx`
  - `tabs/VariablesTab.tsx`
  - `tabs/StatisticsTab.tsx`
  - `tabs/ChartsTab.tsx`
  - `tabs/ExamplesTab.tsx`
  - `tabs/FAQTab.tsx`
  - `tabs/TipsTab.tsx`

## Komponen Utama
- `DescriptiveAnalysis.tsx`
  - Menggunakan `StandardizedGuideLayout` untuk tata letak panduan.
  - Mendefinisikan tab: `overview` (Ringkasan), `variables` (Variabel), `statistics` (Statistik); `defaultTab="overview"`.
  - Tidak menggunakan summary aside; konten “Kapan Menggunakan Analisis Deskriptif” sekarang berada di tab Ringkasan (Overview).

- `index.ts`
  - Re-eksport `DescriptiveAnalysis`.

## Tabs & Konten (disarikan dari implementasi)
- __OverviewTab (`tabs/OverviewTab.tsx`)__
  - Pengantar “Apa itu Statistik Deskriptif?”.
  - Kapan digunakan: eksplorasi awal, memahami distribusi, deteksi outlier, cek normalitas, bandingkan variabel, pra-analisis inferensial, validasi kualitas data.
  - Statistik yang dihasilkan: Central Tendency (Mean, Median, Sum), Dispersion (Std. deviation, Variance, Range, Min/Max, S.E. Mean), Distribution (Skewness, Kurtosis), Percentiles (Q1, Q3, IQR).
  - Tips praktis: measurement menentukan ketersediaan statistik, handling missing, weights, dan urutan tampilan.
  - Detail konten (sesuai UI):
    - Intro: Statistik deskriptif merangkum data dengan ukuran kunci seperti rata-rata, sebaran, dan bentuk distribusi untuk memberi wawasan cepat tentang karakteristik data.
    - Kapan Menggunakan Analisis Deskriptif:
      - Eksplorasi awal dataset numerik
      - Memahami distribusi dan karakteristik variabel
      - Mendeteksi outlier dan pola data
      - Mengecek normalitas distribusi
      - Membandingkan statistik antar variabel
      - Persiapan sebelum analisis inferensial
      - Validasi kualitas data
    - Statistik yang Dihasilkan:
      - Central Tendency — "Mean, Median, Sum" (perhitungan berbobot W)
      - Dispersion — "Std. deviation, Variance, Range, Min/Max, S.E. Mean"
      - Distribution — "Skewness, Kurtosis"
      - Percentiles — "Q1, Q3, IQR"
    - Tips Praktis: Level Measurement mempengaruhi ketersediaan statistik; Missing otomatis dikecualikan; Weights digunakan bila ada; Display Order dapat diatur.

- __VariablesTab (`tabs/VariablesTab.tsx`)__
  - Pemilihan variabel numerik (UI hanya menampilkan tipe numerik untuk Descriptives).
  - Opsi “Save standardized values as variables” untuk menyimpan z-score: `z = (x-\bar{x})/s`.
  - Jenis variabel yang didukung:
    - Numerik: `NUMERIC`, `COMMA`, `DOT`, `SCIENTIFIC`, `DOLLAR`, `RESTRICTED_NUMERIC`.
    - Tanggal/waktu: `DATE`, `ADATE`, `EDATE`, `SDATE`, `JDATE`, `QYR`, `MOYR`, `WKYR`, `DATETIME`, `TIME`, `DTIME` — dikonversi ke SPSS seconds untuk perhitungan; string `dd-mm-yyyy` diparse lebih dulu.
  - Measurement & mapping saat measurement tidak diketahui (referensi desain): numeric → scale, string → nominal, date → scale.
  - Missing values otomatis dikecualikan; weights (bila ada) digunakan untuk semua perhitungan; dilaporkan `Valid N`.
  - Langkah UI (sesuai panel di aplikasi):
    1) Pilih Variabel — seret variabel numerik (NUMERIC/COMMA/DOT/SCIENTIFIC/DOLLAR/RESTRICTED_NUMERIC).
    2) Tambahkan ke Analisis — seret ke kotak analisis atau gunakan tombol panah.
    3) Opsi Standardized Values — centang untuk menyimpan z-score tiap variabel: `z_i = (x_i - \bar{x})/s`.
  - Level pengukuran & statistik tersedia:
    - Scale (Interval/Ratio): semua statistik (mean, median, std dev, variance, skewness, kurtosis, dll.)
    - Ordinal: median, percentiles (Q1, Q3), IQR, mode (tanpa mean/std dev)
    - Nominal: mode dan frekuensi
  - Detail dukungan variabel:
    - ✓ Variabel Numerik — tipe di atas; contoh: umur, tinggi, pendapatan, rating 1–10
    - Variabel Tanggal — dianggap scale; otomatis ke SPSS seconds; `dd-mm-yyyy` diparse dulu
    - ✗ Tidak Didukung — STRING (gunakan Frequencies untuk analisis kategorikal teks)
    - ⚠ Perlu Perhatian — banyak missing; nominal berkode numerik (1=pria, 2=wanita); pastikan level measurement benar
  - Missing & Weights (peringatan di UI):
    - Missing dideteksi dari definisi variabel, dikecualikan dari perhitungan
    - Weights digunakan jika tersedia (default bobot = 1)
    - Valid N: jumlah kasus valid yang dipakai
  - Tips pemilihan variabel:
    - Descriptives: variabel numerik kontinu
    - Frequencies: semua jenis variabel
    - Explore: numerik dengan outlier detection
  - Penanganan Missing Values (panel bantuan): hitung valid/missing; keluarkan missing dari statistik; laporkan persen missing; peringatan jika >50%.

- __StatisticsTab (`tabs/StatisticsTab.tsx`)__
  - Notasi terpusat berbobot: total bobot `W`, jumlah berbobot `S=∑wᵢxᵢ`, momen `Mₖ=∑wᵢ(xᵢ-\bar{x})^k`.
  - Central Tendency: Mean `\bar{x}=S/W`, Median (P50) via weighted percentile, Q1/Q3 & IQR, Sum.
  - Dispersion: `s = sqrt(M₂/(W-1))`, Variance `s²=M₂/(W-1)`, Range, Min/Max, S.E. Mean `s/√W` (sample-corrected).
  - Distribution: Skewness dan Kurtosis dengan rumus terstandar dan SE; interpretasi tanda/nilai.
  - Display Order: Variable list, Alphabetic, Ascending means, Descending means.
  - Catatan: Outlier memengaruhi mean dan std.dev; rekomendasi menggunakan Explore untuk deteksi outlier.
  - Detail konten (sesuai UI):
    - Formula Matematika: `W = \sum w_i`, `S = \sum w_i x_i`, `M_k = \sum w_i (x_i - \bar{x})^k`.
    - Central Tendency:
      - Mean: `\bar{x} = S/W = (\sum w_i x_i)/(\sum w_i)`; contoh [2,4,6,8,10] → 6
      - Median (P50): metode persentil; `t_p = (W+1)·p/100`; cari `cc[i] ≥ t_p`; interpolasi linier
      - Q1/Q3 & IQR: `Q1 = P_25`, `Q3 = P_75`; `IQR = Q3 - Q1`
      - Sum: `\mathrm{Sum} = S = \sum w_i x_i`
    - Dispersion:
      - Std. deviation: `s = sqrt(M_2/(W-1))`, dengan `M_2 = \sum w_i (x_i - \bar{x})^2`
      - Variance: `s^2 = M_2/(W-1)`
      - Range: `max(x) - min(x)`; Min & Max ditampilkan terpisah
      - S.E. Mean: `SE_{\bar{x}} = s/\sqrt{W}`; interpretasi: ~68% dalam 1 SD, ~95% dalam 2 SD
    - Distribution:
      - Skewness: `g_1 = (W·M_3)/((W-1)(W-2)·s^3)`; `SE(Skewness) = sqrt(6 W (W-1)/((W-2)(W+1)(W+3)))`
      - Kurtosis: `g_2 = (W(W+1) M_4 - 3 M_2^2 (W-1))/((W-1)(W-2)(W-3)·s^4)`; `SE(Kurtosis) = sqrt(4 (W^2 - 1) (SE_{Skew})^2/((W-3)(W+5)))`
      - Interpretasi: 0=normal/mesokurtic; >0=leptokurtic; <0=platykurtic; skew positif/negatif sesuai ekor panjang
    - Display Order: Variable list; Alphabetic; Ascending means; Descending means
    - Outlier & Anomali: deteksi nilai >2–3 SD; dapat memengaruhi mean/std.dev; gunakan Explore untuk pemeriksaan mendalam
    - Rekomendasi Pengaturan: eksplorasi awal aktifkan semua; untuk laporan pilih yang relevan; untuk analisis lanjut simpan standardized values

- __ChartsTab (`tabs/ChartsTab.tsx`)__
  - Visualisasi untuk Descriptives sedang dikembangkan.
  - Alternatif: gunakan modul `Explore` (histogram, box plot, uji normalitas) atau ekspor hasil ke CSV/Excel untuk divisualisasikan di Excel/R/Python.
  - Catatan: komponen ini belum menjadi tab aktif di `DescriptiveAnalysis.tsx` (belum diimpor dalam daftar `tabs`).
  - Rincian alternatif (sesuai konten UI):
    - Gunakan Analisis Explore — histogram dan box plot untuk distribusi & outlier
    - Akses: Analyze → Descriptive → Explore
    - Export untuk visualisasi eksternal — format CSV/Excel; tools: Excel, R, Python; keunggulan: fleksibilitas jenis grafik


- __ExamplesTab (`tabs/ExamplesTab.tsx`)__
  - Status: placeholder (belum ada konten). Rencana: contoh dataset kecil, contoh interpretasi hasil.

- __FAQTab (`tabs/FAQTab.tsx`)__
  - Status: placeholder. Rencana: FAQ tentang perbedaan Descriptives/Frequencies/Explore, dampak outlier, kapan gunakan median vs mean, dsb.

- __TipsTab (`tabs/TipsTab.tsx`)__
  - Status: placeholder. Rencana: best practices pemilihan variabel, pengaturan display order untuk laporan, penanganan missing & weights.

## Navigasi & Penambahan Tab
- Tata letak: `StandardizedGuideLayout` (halaman) dan `StandardizedContentLayout` (bagian/tab) untuk konsistensi UI.
- Menambah tab baru:
  1) Buat komponen di `tabs/` dan export.
  2) Import komponen dan tambahkan ke array `tabs` di `DescriptiveAnalysis.tsx` dengan `{ id, label, icon, component }`.
  3) Gunakan ikon dari `lucide-react` agar konsisten.
- Default tab: `overview`.

## Ketergantungan UI
- `lucide-react` untuk ikon (mis. `BookOpen`, `Database`, `Calculator`, `HelpCircle`).
- `react-katex` dan `katex/dist/katex.min.css` untuk formula matematika (digunakan di `StatisticsTab.tsx` dan `VariablesTab.tsx`).
- Komponen bantuan UI: `HelpCard`, `HelpAlert` dari `@/app/help/ui/HelpLayout`.

## Catatan Teknis
- Perhitungan berbobot: default weight = 1 jika tidak ditentukan.
- Missing values: dikeluarkan dari perhitungan; laporan menyertakan `Valid N` dan persentase missing.
- Percentiles: dihitung menggunakan kumulatif bobot dan interpolasi linier.
- Mapping measurement saat tidak diketahui: numeric → scale, string → nominal, date → scale.
- Konversi tanggal: string `dd-mm-yyyy` diparse ke SPSS seconds untuk komputasi numerik.

## Catatan
- Daftar di atas berasal dari struktur folder saat pembuatan README.
- Bila menambah tab baru, tambahkan berkas di `tabs/` dan sesuaikan impor/ekspor di komponen terkait bila diperlukan.
