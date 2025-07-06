# Arsitektur & Analisis: Fitur Explore

Dokumen ini menguraikan arsitektur yang digunakan untuk fitur Analisis Eksplorasi (`Explore`) dan memberikan analisis mendalam mengenai praktik terbaik (`best practices`) serta pola desain yang diterapkan untuk menangani fungsionalitas yang kompleks.

## 1. Diagram Arsitektur

Diagram berikut mengilustrasikan alur kerja yang lebih kompleks dari fitur `Explore`, yang melibatkan pengelompokan data dan pemrosesan paralel.

```mermaid
graph TD
    subgraph Frontend (Main Thread - UI)
        A[React UI: Explore/index.tsx] -- Interaksi Pengguna --> B(Mulai Analisis)
        B -- Memanggil hook --> C{useExploreAnalysis}
        C -- Mengelompokkan data berdasarkan faktor --> D(Grouped Data)
        D -- Iterasi per Kelompok & Variabel Dependen --> E{Membuat & Mengirim Tugas Worker}
        E -- postMessage(payload) --> F[Web Worker: manager.js]
        G[onmessage] -- Menerima hasil (Promise diselesaikan) --> H{Promise.allSettled}
        H -- Mengumpulkan semua hasil --> I(Hasil Teragregasi)
        I -- Iterasi per tipe tabel --> J(Memanggil Formatter)
        J -- Menghasilkan tabel terformat --> K(Menyimpan ke ResultStore)
        K -- Memicu update --> L(Tampilan Output)
    end

    subgraph Web Worker (Background Thread)
        F -- Menerima pesan --> M{CALCULATOR_MAP}
        M -- Memilih 'examine' --> N[Class: ExamineCalculator]
        N -- Memproses data --> O(Menghitung Statistik Eksplorasi)
        O -- Mengembalikan hasil --> G(postMessage(results))
    end

    style F fill:#f9f,stroke:#333,stroke-width:2px
    style G fill:#f9f,stroke:#333,stroke-width:2px
```

## 2. Arsitektur Frontend (React)

Arsitektur `Explore` adalah evolusi dari pola yang terlihat di `Descriptives` dan `Crosstabs`, yang dirancang untuk menangani logika yang lebih rumit.

-   **Komponen Utama (`Explore/index.tsx`):** Bertindak sebagai integrator utama. Komponen ini menggabungkan semua *custom hooks* dan me-render UI, termasuk sistem tab. Kompleksitas utamanya telah diabstraksi ke dalam *hooks*.

-   **Komponen UI (`VariablesTab.tsx`, `StatisticsTab.tsx`):** Komponen presentasional murni. `VariablesTab` secara khusus menangani tiga jenis daftar variabel yang berbeda (Dependent, Factor, Label), menunjukkan kemampuan adaptasi dari `VariableListManager` yang mendasarinya.

-   **Custom Hooks (Pusat Logika):**
    -   `useVariableManagement`: Mengelola state dan logika untuk tiga daftar variabel yang berbeda. Ini lebih kompleks daripada manajemen variabel di fitur lain dan ditangani dengan sangat baik di dalam *hook* ini.
    -   `useStatisticsSettings`: Mengelola state untuk opsi statistik seperti *M-estimators*, *outliers*, dan *percentiles*.
    -   `useExploreAnalysis`: Ini adalah *hook* yang paling penting dan canggih. Tanggung jawabnya meliputi:
        - **Pengelompokan Data:** Sebelum analisis, ia menjalankan `groupDataByFactors` di *main thread* untuk membagi dataset berdasarkan variabel faktor yang dipilih.
        - **Pemrosesan Paralel:** Ia membuat array *promises*, di mana setiap *promise* mewakili satu tugas analisis (satu variabel dependen untuk satu kelompok faktor).
        - **Manajemen Worker:** Ia membuat *instance* worker baru untuk setiap tugas. (Lihat catatan di bagian Penilaian).
        - **Agregasi Hasil yang Aman:** Menggunakan `Promise.allSettled` untuk menunggu semua tugas worker selesai. Pola ini sangat kuat karena memastikan bahwa kegagalan satu tugas tidak akan menghentikan seluruh proses analisis.
        - **Pemformatan Multi-Tabel:** Setelah semua hasil terkumpul, ia secara iteratif memanggil serangkaian fungsi `formatter` (`formatCaseProcessingSummary`, `formatDescriptivesTable`, dll.) untuk menghasilkan beberapa tabel output yang berbeda dari satu set data hasil.
        - **Penyimpanan Hasil:** Setiap tabel yang diformat disimpan sebagai entri `statistic` terpisah di `useResultStore`.

## 3. Arsitektur Web Worker

Arsitektur *worker* tetap konsisten, memanfaatkan `manager.js` sebagai *router* dan kelas kalkulator khusus.

-   **`manager.js` (Controller):** Ketika menerima pesan dengan `analysisType: 'examine'`, ia mendelegasikan tugas ke `ExamineCalculator`.

-   **`ExamineCalculator` (`/libs/examine.js`):** Kelas ini adalah contoh yang sangat baik dari prinsip **Komposisi di atas Pewarisan**. Ia tidak mengimplementasikan ulang logika deskriptif, melainkan **menggunakan instance** dari `DescriptiveCalculator` dan `FrequencyCalculator` secara internal untuk mendapatkan statistik dasar, lalu menambahkan logikanya sendiri untuk statistik yang lebih canggih seperti *Trimmed Mean* dan *M-Estimators*.

## 4. Penilaian & Analisis Best Practices

Arsitektur `Explore` berhasil mengelola kompleksitas yang jauh lebih tinggi dibandingkan fitur deskriptif lainnya dan menerapkan beberapa pola tingkat lanjut.

### Keunggulan Utama:

1.  **Manajemen Kompleksitas yang Sangat Baik:** Fitur ini mampu menangani analisis "Dependents BY Factors", yang secara inheren kompleks. Arsitektur berbasis *hooks* memecah kompleksitas ini menjadi bagian-bagian yang dapat dikelola (`useVariableManagement`, `useExploreAnalysis`).

2.  **Pemrosesan Asinkron yang Kuat:** Penggunaan `Promise.allSettled` adalah pilihan yang sangat tepat dan menunjukkan praktik terbaik. Ini memastikan bahwa aplikasi tetap tangguh, bahkan jika beberapa tugas analisis gagal.

3.  **Modularitas Output:** Memisahkan setiap jenis tabel output (Descriptives, M-Estimators, Percentiles) ke dalam fungsi *formatter*-nya sendiri membuat kode sangat bersih dan mudah untuk diperluas. Jika tabel baru diperlukan di masa depan, hanya perlu menambahkan *formatter* baru dan memanggilnya di `useExploreAnalysis`.

4.  **Komposisi Cerdas:** Penggunaan kembali `DescriptiveCalculator` dan `FrequencyCalculator` di dalam `ExamineCalculator` adalah contoh buku teks dari prinsip desain komposisi yang baik, mengurangi duplikasi kode dan menjaga setiap kelas tetap fokus pada tugasnya.

### Potensi Penyempurnaan & Poin Diskusi:

-   **Instansiasi Worker:** `useExploreAnalysis` saat ini membuat `new Worker()` untuk setiap pasangan dependen/faktor di dalam sebuah *loop*. Meskipun ini memberikan isolasi maksimum, membuat *worker* baru memiliki *overhead*. Untuk skenario dengan banyak sekali kombinasi (misalnya, 10 dependen x 10 grup faktor = 100 *worker*), ini bisa menjadi tidak efisien. Pola alternatif yang bisa dipertimbangkan adalah **Worker Pool**, di mana sejumlah *worker* tetap dibuat dan tugas didistribusikan di antara mereka. Namun, untuk kasus penggunaan umum, pendekatan saat ini lebih sederhana untuk diimplementasikan dan mungkin sudah cukup memadai.

-   **Pengelompokan di Main Thread:** Fungsi `groupDataByFactors` berjalan di *main thread*. Untuk dataset yang sangat besar (jutaan baris), operasi ini berpotensi menyebabkan jeda singkat pada UI sebelum analisis dimulai. Ini adalah trade-off yang wajar. Jika performa untuk dataset masif menjadi prioritas utama di masa depan, bahkan langkah pra-pemrosesan ini dapat di-offload ke *worker* terpisah.

### Kesimpulan

Arsitektur fitur `Explore` adalah yang paling matang dan mengesankan dari ketiganya. Ia tidak hanya menerapkan kembali pola-pola baik dari fitur lain tetapi juga memperkenalkan teknik-teknik yang lebih canggih (`Promise.allSettled`, pemformatan multi-tabel dari satu hasil) untuk mengelola fungsionalitas yang secara signifikan lebih kompleks. Ini adalah contoh yang sangat baik dari desain sistem yang skalabel dan dapat dipelihara. 