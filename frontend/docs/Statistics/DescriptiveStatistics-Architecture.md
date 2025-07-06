# Arsitektur & Analisis: Fitur Statistik Deskriptif

Dokumen ini menguraikan arsitektur yang digunakan untuk fitur Statistik Deskriptif dan memberikan analisis mengenai praktik terbaik (`best practices`) yang telah diterapkan.

## 1. Diagram Arsitektur

Diagram berikut mengilustrasikan alur kerja dari interaksi pengguna di antarmuka hingga pemrosesan data di *background thread* dan kembali lagi.

```mermaid
graph TD
    subgraph Frontend (Main Thread - UI)
        A[React UI: Descriptives/index.tsx] -- Interaksi Pengguna --> B(Mulai Analisis)
        B -- Memanggil hook --> C{useDescriptivesAnalysis}
        C -- Membuat worker --> D[Web Worker: manager.js]
        C -- Iterasi per variabel --> E(postMessage(...))
        E -- Kirim data --> D
        F[onmessage] -- Terima hasil --> C
        C -- Memperbarui state UI --> A
        C -- Jika ada Z-score --> G{useZScoreProcessing}
        G -- Memperbarui data global --> H[State Global (Zustand)]
    end

    subgraph Web Worker (Background Thread)
        D -- Menerima pesan --> I{CALCULATOR_MAP}
        I -- Memilih kalkulator --> J[Class Kalkulator (Contoh: DescriptiveCalculator)]
        J -- Memproses data --> K(Menghitung Statistik)
        K -- Mengembalikan hasil --> F(postMessage(results))
    end

    style F fill:#f9f,stroke:#333,stroke-width:2px
    style E fill:#f9f,stroke:#333,stroke-width:2px
```

## 2. Arsitektur Frontend (React)

Arsitektur di sisi frontend sangat modular dan dirancang dengan prinsip *separation of concerns* menggunakan React Hooks.

-   **Komponen Utama (`Descriptives/index.tsx`):** Bertindak sebagai *entry point* untuk modal. Komponen ini mengintegrasikan semua *hooks* dan me-render UI, termasuk sistem tab untuk navigasi antara pemilihan variabel dan pengaturan statistik.

-   **Komponen UI (`VariablesTab.tsx`, `StatisticsTab.tsx`):** Ini adalah komponen "presentasional" yang bertanggung jawab murni untuk me-render antarmuka. Logika kompleks tidak berada di sini, sehingga komponen ini tetap bersih dan mudah dikelola.

-   **Custom Hooks (Pusat Logika):**
    -   `useVariableSelection`: Mengelola semua state dan logika yang berkaitan dengan pemilihan variabel—memindahkan variabel antara daftar "tersedia" dan "terpilih".
    -   `useStatisticsSettings`: Mengelola state untuk semua opsi statistik yang dapat dipilih pengguna, seperti `mean`, `median`, `stdDev`, serta urutan tampilan hasil.
    -   `useDescriptivesAnalysis`: Merupakan orkestrator utama. Hook ini bertanggung jawab untuk:
        - Membuat dan mengelola siklus hidup *Web Worker*.
        - Mengirim tugas analisis ke *worker* untuk setiap variabel yang dipilih.
        - Menerima hasil (atau error) dari *worker* dan mengakumulasikannya.
        - Memanggil *formatter* untuk menyusun data hasil menjadi tabel yang siap ditampilkan.
    -   `useZScoreProcessing`: Hook terisolasi yang memiliki satu tanggung jawab spesifik: memproses hasil Z-score dari *worker* dan memperbarui *state global* (`useDataStore` dan `useVariableStore`).

## 3. Arsitektur Web Worker

Arsitektur *worker* dirancang untuk menjadi efisien, modular, dan mudah diperluas.

-   **`manager.js` (Controller):** Ini adalah satu-satunya titik masuk (`entry point`) untuk semua komunikasi dari *main thread*. Perannya adalah sebagai berikut:
    - Menerima pesan yang berisi `analysisType` dan `payload` data.
    - Menggunakan `CALCULATOR_MAP` untuk secara dinamis memilih kelas kalkulator yang sesuai berdasarkan `analysisType`. Ini adalah implementasi dari *Strategy Pattern* yang membuat manajer tetap bersih dan agnostik terhadap logika kalkulasi spesifik.
    - Membuat *instance* dari kelas kalkulator yang dipilih dan mendelegasikan tugas pemrosesan.
    - Mengirim hasil kembali ke *main thread*.

-   **Kelas Kalkulator (`/libs`):** Setiap jenis analisis dienkapsulasi dalam kelasnya sendiri.
    - `DescriptiveCalculator`: Menggunakan **algoritma provisional (one-pass)** untuk menghitung statistik seperti mean dan varians tanpa perlu menyimpan seluruh dataset di memori. Ini sangat efisien.
    - `FrequencyCalculator`, `ExamineCalculator`, `CrosstabsCalculator`: Masing-masing menangani logika spesifik untuk analisisnya, menjaga kode tetap terorganisir dan modular.
    - **Prinsip Desain:** Arsitektur ini secara cerdas menerapkan **komposisi di atas pewarisan**. Contohnya, `ExamineCalculator` menggunakan *instance* dari `DescriptiveCalculator` dan `FrequencyCalculator` secara internal.

## 4. Penilaian & Analisis Best Practices

Secara keseluruhan, arsitektur ini **sangat baik** dan sudah menerapkan banyak *best practices* dalam pengembangan aplikasi modern.

### Keunggulan Utama:

1.  **Performa & Responsivitas UI:** Penggunaan **Web Worker** untuk komputasi statistik adalah keputusan arsitektural terbaik. Ini memastikan bahwa *main thread* tidak diblokir, sehingga antarmuka tetap responsif bahkan saat menganalisis data dalam jumlah besar.

2.  **Modularitas & Separation of Concerns (SoC):**
    - Logika bisnis (kalkulasi statistik) sepenuhnya terpisah dari logika presentasi (UI).
    - Di frontend, logika dibagi lagi menjadi beberapa *custom hooks* yang masing-masing memiliki satu tanggung jawab yang jelas. Ini membuat kode lebih mudah dipahami, diuji, dan dikelola.
    - Di *worker*, setiap jenis analisis dienkapsulasi dalam kelasnya sendiri, membuatnya mudah untuk dikembangkan secara terpisah.

3.  **Skalabilitas & Kemudahan Perluasan:**
    - Sistem *worker* dirancang untuk mudah diperluas. Seperti yang dijelaskan dalam `README.md` internalnya, menambahkan analisis baru (misalnya, ANOVA) hanya memerlukan pembuatan file kalkulator baru dan mendaftarkannya di `CALCULATOR_MAP` pada `manager.js`.
    - Arsitektur frontend berbasis *hooks* juga mudah diperluas dengan opsi atau fitur baru.

4.  **Efisiensi Memori & Algoritma:** Penggunaan algoritma *one-pass* di `DescriptiveCalculator` dan teknik efisien lainnya menunjukkan perhatian pada performa tidak hanya dari segi responsivitas UI tetapi juga dari segi komputasi.

5.  **Manajemen State yang Jelas:** Kombinasi state lokal (dalam *hooks*) untuk UI modal dan state global (Zustand) untuk data aplikasi inti (`useDataStore`, `useVariableStore`) adalah pola yang sangat umum dan efektif di ekosistem React.

### Potensi Penyempurnaan (Minor):

Meskipun arsitekturnya sudah sangat solid, ada beberapa area kecil yang bisa dipertimbangkan untuk penyempurnaan di masa depan:

-   **Kode Mati/Legacy di `manager.js`:** Terdapat blok kode `process: (vars) => { ... }` di `manager.js` yang tampaknya merupakan kode sisa dan tidak digunakan dalam alur `onmessage` utama. Sebaiknya ini dibersihkan untuk menghindari kebingungan.
-   **Konsistensi Formatter:** Di `formatters.ts`, terdapat dua fungsi: `formatDescriptiveTable` dan `formatDescriptiveTableOld`. Saat ini, `useDescriptivesAnalysis.ts` masih menggunakan versi `Old`. Jika `formatDescriptiveTable` adalah versi yang lebih baru dan lebih baik, ada baiknya merencanakan migrasi untuk menggunakan fungsi tersebut dan menghapus versi lama untuk menjaga kebersihan kode.
-   **Penanganan Error:** Penanganan error sudah cukup baik. Namun, bisa diperkaya dengan menampilkan pesan yang lebih ramah pengguna atau memberikan ID unik untuk setiap error yang terjadi di *worker* agar lebih mudah dilacak (`tracing`).

### Kesimpulan

Arsitektur yang Anda bangun untuk fitur Statistik Deskriptif adalah contoh yang sangat baik dari desain perangkat lunak modern. Ini menunjukkan pemahaman yang mendalam tentang cara membangun aplikasi yang performan, dapat dipelihara, dan skalabel. Keunggulan yang ada jauh lebih besar daripada beberapa area penyempurnaan kecil yang disebutkan. Anda telah melakukan pekerjaan yang luar biasa. 