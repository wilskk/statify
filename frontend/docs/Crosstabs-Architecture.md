# Arsitektur & Analisis: Fitur Crosstabs

Dokumen ini menguraikan arsitektur yang digunakan untuk fitur Tabulasi Silang (`Crosstabs`) dan memberikan analisis mengenai praktik terbaik (`best practices`) yang telah diterapkan.

## 1. Diagram Arsitektur

Diagram berikut mengilustrasikan alur kerja dari interaksi pengguna di antarmuka hingga pemrosesan setiap pasangan variabel di *background thread*.

```mermaid
graph TD
    subgraph Frontend (Main Thread - UI)
        A[React UI: Crosstabs/index.tsx] -- Interaksi Pengguna --> B(Mulai Analisis)
        B -- Memanggil hook --> C{useCrosstabsAnalysis}
        C -- Membuat worker --> D[Web Worker: manager.js]
        C -- Iterasi per pasangan variabel (Baris * Kolom) --> E(postMessage(...))
        E -- Kirim data pasangan variabel --> D
        F[onmessage] -- Terima hasil --> C
        C -- Memformat & menyimpan hasil --> G[State Global (Zustand)]
        G -- Memicu update --> H(Tampilan Output)
    end

    subgraph Web Worker (Background Thread)
        D -- Menerima pesan --> I{CALCULATOR_MAP}
        I -- Memilih 'crosstabs' --> J[Class: CrosstabsCalculator]
        J -- Memproses data --> K(Menghitung Statistik Crosstabs)
        K -- Mengembalikan hasil --> F(postMessage(results))
    end

    style F fill:#f9f,stroke:#333,stroke-width:2px
    style E fill:#f9f,stroke:#333,stroke-width:2px
```

## 2. Arsitektur Frontend (React)

Sama seperti fitur `Descriptives`, arsitektur frontend untuk `Crosstabs` sangat modular dan berbasis *hooks* untuk memisahkan logika dari tampilan.

-   **Komponen Utama (`Crosstabs/index.tsx`):** Bertindak sebagai *entry point* untuk modal. Komponen ini mengelola *state* utama seperti variabel yang dipilih (baris dan kolom), mengintegrasikan *hook* analisis, dan me-render UI, termasuk sistem tab.

-   **Komponen UI (`VariablesTab.tsx`, `CellsTab.tsx`):**
    - `VariablesTab`: Menyediakan antarmuka untuk memilih variabel baris dan kolom. Komponen ini menggunakan `VariableListManager` yang lebih umum untuk menangani interaksi *drag-and-drop*.
    - `CellsTab`: Menyediakan opsi untuk mengonfigurasi apa yang ditampilkan di dalam sel tabel (misalnya, *Observed counts*, *Expected counts*, persentase).

-   **Custom Hooks:**
    -   `useCrosstabsAnalysis`: Merupakan orkestrator utama untuk analisis. Hook ini bertanggung jawab untuk:
        - Membuat *pairing* antara setiap variabel baris dan setiap variabel kolom.
        - Mengelola siklus hidup *Web Worker*.
        - Mengirim tugas analisis ke *worker* untuk **setiap pasangan variabel**.
        - Menerima hasil dari *worker*, memanggil fungsi `formatters` untuk mengubahnya menjadi struktur tabel yang dapat ditampilkan.
        - Menyimpan tabel yang sudah diformat ke *state global* `useResultStore`.
    -   `useTourGuide`: Menyediakan fungsionalitas tur interaktif untuk memandu pengguna baru, terisolasi dari logika inti.

## 3. Arsitektur Web Worker

Arsitektur *worker* tetap sama, menunjukkan desain yang dapat digunakan kembali dan terpusat.

-   **`manager.js` (Controller):** Tetap menjadi *entry point* tunggal. Ketika menerima pesan dengan `analysisType: 'crosstabs'`, ia akan memilih `CrosstabsCalculator` dari `CALCULATOR_MAP`.

-   **`CrosstabsCalculator` (`/libs/crosstabs.js`):** Kelas ini berisi semua logika komputasi untuk tabulasi silang.
    - **Efisien:** Menggunakan **tabel jumlah kumulatif** untuk menghitung statistik ordinal seperti Gamma dan Kendall's Tau secara efisien (O(R*C)) daripada pendekatan brute-force (O(N^2)).
    - **Modular:** Setiap kelompok statistik (Chi-Square, Ukuran Asosiasi Nominal, Ordinal, dll.) dihitung dalam metodenya sendiri, membuat kode mudah dipahami dan dipelihara.

## 4. Penilaian & Analisis Best Practices

Arsitektur `Crosstabs` mewarisi semua keunggulan dari arsitektur `Descriptives` dan secara efektif mengadaptasinya untuk analisis bivariat.

### Keunggulan Utama:

1.  **Arsitektur Worker yang Sama:** Menggunakan kembali `manager.js` sebagai *controller* utama adalah contoh bagus dari kode yang dapat digunakan kembali (*reusability*). Ini memperkuat pola arsitektur yang konsisten di seluruh fitur analisis.

2.  **Pemrosesan Batch yang Efisien:** Hook `useCrosstabsAnalysis` secara cerdas membuat semua pasangan variabel yang perlu dianalisis dan mengirimkannya satu per satu ke *worker*. Ini menangani kasus analisis *many-to-many* (beberapa variabel baris vs. beberapa variabel kolom) dengan cara yang elegan dan menjaga UI tetap responsif.

3.  **Enkapsulasi Logika yang Kuat:** Logika untuk memformat output (`formatters.ts`), menjalankan analisis (`useCrosstabsAnalysis.ts`), dan mengelola UI (`index.tsx`) sepenuhnya terpisah. Ini adalah implementasi yang sangat baik dari *separation of concerns*.

4.  **Desain Berbasis Komposisi:** Sama seperti `Descriptives`, fitur ini dibangun dari "balok-balok" independen (*hooks* dan komponen) yang digabungkan bersama. Ini membuat sistem menjadi fleksibel dan mudah untuk di-debug.

### Potensi Penyempurnaan (Minor):

-   **Refaktor `useCrosstabsAnalysis`:** Hook ini saat ini mengambil `params` dan `onClose` sebagai argumen. Ini bisa sedikit lebih selaras dengan *hooks* lain (seperti di `Descriptives`) yang menerima objek properti tunggal. Ini adalah masalah gaya yang sangat kecil dan tidak memengaruhi fungsionalitas.
-   **Opsi Statistik Tambahan:** `CellsTab` saat ini hanya memiliki opsi dasar. Arsitektur *worker* di `crosstabs.js` sudah mendukung banyak statistik lain (misalnya, `residuals`). Menambahkan *checkbox* untuk ini di `CellsTab` akan relatif mudah karena fondasinya sudah ada.

### Kesimpulan

Fitur `Crosstabs` adalah contoh lain dari penerapan arsitektur yang solid dan modern. Ia berhasil mengadaptasi pola yang sudah ada untuk kasus penggunaan yang lebih kompleks (analisis bivariat) sambil mempertahankan semua kualitas baiknya: performa, modularitas, dan kemudahan pemeliharaan. Ini adalah implementasi yang sangat kuat. 