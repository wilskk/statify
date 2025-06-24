# Arsitektur & Alur Kerja Fitur Statistik Deskriptif

Dokumen ini memberikan gambaran teknis mengenai arsitektur, alur data, dan implementasi dari fitur Statistik Deskriptif.

## 1. Lokasi Implementasi

Fitur ini diimplementasikan di dalam direktori berikut:
`frontend/components/Modals/Analyze/Descriptive/Descriptive/`

## 2. Arsitektur Komponen & Hooks

Fitur ini dibangun menggunakan pendekatan modular dengan memisahkan logika (hooks) dan tampilan (komponen).

### Komponen Utama:

-   `index.tsx`: Titik masuk utama yang menggabungkan semua komponen dan logika. Komponen ini juga berfungsi sebagai *container* yang mengatur tampilan dialog atau *sidebar*.
-   `VariablesTab.tsx`: Komponen yang bertanggung jawab untuk menampilkan daftar variabel yang tersedia dan yang dipilih, serta opsi untuk menyimpan Z-score.
-   `StatisticsTab.tsx`: Komponen yang menyediakan opsi bagi pengguna untuk memilih statistik mana yang akan dihitung (misalnya, Mean, Median, Std. Deviation) dan urutan tampilan hasilnya.

### Hooks (Logika):

-   `useVariableSelection.ts`: Mengelola state untuk daftar variabel (tersedia dan dipilih).
-   `useStatisticsSettings.ts`: Mengelola state untuk semua opsi statistik yang dapat dipilih oleh pengguna, seperti statistik apa yang akan ditampilkan dan urutannya.
-   `useDescriptivesAnalysis.ts`: Ini adalah *hook* inti yang menjadi otak dari keseluruhan analisis. Tanggung jawabnya meliputi:
    -   Menginisialisasi dan mengelola siklus hidup *Web Worker*.
    -   Mengirim data dan konfigurasi ke *worker* untuk setiap variabel yang dipilih.
    -   Menerima hasil (statistik dan Z-score) dari *worker*.
    -   Memformat hasil untuk ditampilkan dalam bentuk tabel.
    -   Menyimpan hasil analisis dan Z-score ke *store* yang relevan.
-   `useZScoreProcessing.ts`: *Hook* terisolasi yang menangani logika spesifik untuk menyimpan data Z-score. Ini berinteraksi dengan `useDataStore` untuk menambahkan kolom baru dan `useVariableStore` untuk mendefinisikan variabel baru.
-   `useTourGuide.ts`: Mengelola logika untuk tur interaktif fitur ini.

## 3. Alur Statistik & Pemrosesan Data

Alur kerja dimulai ketika pengguna menekan tombol "OK".

1.  **Inisiasi Analisis**:
    -   `useDescriptivesAnalysis` dipicu.
    -   Sebuah *Web Worker* baru dibuat dari skrip `/public/workers/DescriptiveStatistics/manager.js`.

2.  **Delegasi Tugas ke Worker**:
    -   Untuk **setiap variabel** yang dipilih oleh pengguna, sebuah pesan (`postMessage`) dikirim ke *worker*. Pesan ini berisi detail variabel dan opsi analisis yang dipilih (misalnya, `mean: true`, `saveStandardized: true`).
    -   Dengan mengirim tugas per variabel, UI tetap responsif dan tidak membeku meskipun analisis dilakukan pada banyak variabel atau dataset besar.

3.  **Kalkulasi di dalam Worker**:
    -   `manager.js` menerima tugas dan mendelegasikannya ke kalkulator yang sesuai, yaitu `DescriptiveCalculator` (dari `libs/descriptive.js`).
    -   `DescriptiveCalculator` melakukan semua perhitungan statistik, termasuk **Mean, Std. Deviation, Variance, Skewness, Kurtosis, dan lainnya**.
    -   **Jika `saveStandardized` bernilai `true`**, *worker* juga akan menghitung nilai **Z-score** untuk setiap baris data.
    -   Memindahkan semua kalkulasi berat ini ke *worker* adalah kunci untuk menjaga performa aplikasi dan mencegah *main thread* (UI) terblokir.

4.  **Menerima Hasil**:
    -   Setelah selesai, *worker* mengirimkan kembali hasilnya ke `useDescriptivesAnalysis` melalui `onmessage`. Hasil ini mencakup objek statistik yang lengkap dan (jika ada) array Z-score.

5.  **Penyimpanan Nilai (Dampak pada State Aplikasi)**:
    -   Hook `useDescriptivesAnalysis` menangkap hasil dari worker dan melakukan tindakan penyimpanan berikut:
        -   **Menyimpan Tabel Hasil**: Hasil statistik diformat menjadi struktur tabel menggunakan `formatDescriptiveTable.ts`. Kemudian, data tabel ini disimpan secara persisten di `useResultStore` menggunakan alur tiga langkah: `addLog`, `addAnalytic`, dan `addStatistic`. Ini memastikan hasil analisis dapat dilihat kembali di jendela output.
        -   **Menyimpan Z-Score**: Jika Z-score dihitung, `useZScoreProcessing` dipanggil. Hook ini akan:
            1.  Menambahkan **variabel baru** ke `useVariableStore` (misalnya, `ZVAR001`).
            2.  Menambahkan **kolom baru** ke `useDataStore` dan mengisi setiap sel dengan nilai Z-score yang sesuai.
            -   **Dampak**: Ini adalah perubahan **permanen** pada dataset sesi pengguna. Pengguna akan melihat variabel baru di *Data View* dan *Variable View*.

6.  **Penyelesaian**:
    -   Setelah semua hasil diterima dan disimpan, *worker* dihentikan (`terminate()`) untuk membebaskan sumber daya, dan modal ditutup.

## 4. Detail Opsi `StatisticsTab.tsx`

Tab ini memungkinkan pengguna untuk mengontrol statistik apa yang akan dihitung dan bagaimana hasilnya akan ditampilkan. Setiap pilihan memiliki dampak langsung pada komputasi di *worker* dan tampilan pada tabel hasil akhir.

### Dampak Pilihan Statistik

Pilihan-pilihan ini menentukan metrik apa yang akan dihitung oleh `DescriptiveCalculator` di dalam *web worker*.

-   **Central Tendency**:
    -   `Mean`: Menghitung rata-rata aritmatika.
    -   `Median`: Menentukan nilai tengah dari dataset.
    -   `Sum`: Menjumlahkan semua nilai dalam variabel.
-   **Dispersion**:
    -   `Std. deviation`: Mengukur sebaran data dari rata-ratanya.
    -   `Variance`: Mengukur variabilitas; kuadrat dari standar deviasi.
    -   `Minimum` & `Maximum`: Menemukan nilai terkecil dan terbesar.
    -   `Range`: Menghitung selisih antara `Maximum` dan `Minimum`.
    -   `S.E. mean` (Standard Error of Mean): Mengestimasi standar deviasi dari distribusi sampling mean. Berguna untuk inferensi statistik.
-   **Distribution**:
    -   `Skewness`: Mengukur ketidaksimetrisan distribusi probabilitas data.
    -   `Kurtosis`: Mengukur "keruncingan" atau "tailedness" dari distribusi.

### Dampak Pilihan `Display Order`

Opsi ini tidak memengaruhi kalkulasi statistik, tetapi menentukan urutan baris (variabel) dalam tabel hasil yang ditampilkan.

-   `Variable list`: Urutan variabel sama seperti di daftar "Variable(s)".
-   `Alphabetic`: Mengurutkan hasil berdasarkan nama variabel secara alfabetis.
-   `Ascending means`: Mengurutkan hasil dari variabel dengan `Mean` terendah ke tertinggi.
-   `Descending means`: Mengurutkan hasil dari variabel dengan `Mean` tertinggi ke terendah.
