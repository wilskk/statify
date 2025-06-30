# Arsitektur & Analisis: Fitur Frequencies

Dokumen ini menguraikan arsitektur yang digunakan untuk fitur Analisis Frekuensi (`Frequencies`) dan memberikan analisis mengenai praktik terbaik (`best practices`) yang telah diterapkan.

## 1. Diagram Arsitektur

Diagram berikut mengilustrasikan alur kerja dari interaksi pengguna di antarmuka, penggabungan berbagai opsi, pemrosesan di *background thread*, dan pembuatan beberapa jenis output.

```mermaid
graph TD
    subgraph Frontend (Main Thread - UI)
        A[React UI: Frequencies/index.tsx] -- Interaksi Pengguna --> B(Mulai Analisis)
        B -- Memanggil hook utama --> C{useFrequenciesAnalysis}
        C -- Mengambil opsi dari hooks lain --> D{useStatisticsSettings<br/>useChartsSettings<br/>useDisplaySettings}
        C -- Membuat & mengirim tugas worker --> E[Web Worker: manager.js]
        F[onmessage] -- Menerima hasil --> C
        C -- Iterasi per hasil --> G{Memanggil Formatters}
        G -- Membuat tabel statistik & frekuensi --> H(Menyimpan ke ResultStore)
        H -- Memicu update --> I(Tampilan Output)
    end

    subgraph Web Worker (Background Thread)
        E -- Menerima payload --> J{CALCULATOR_MAP}
        J -- Memilih 'frequencies' --> K[Class: FrequencyCalculator]
        K -- Menggunakan instance --> L[DescriptiveCalculator]
        K -- Memproses data --> M(Menghitung Statistik & Tabel Frekuensi)
        M -- Mengembalikan hasil gabungan --> F(postMessage(results))
    end

    style E fill:#f9f,stroke:#333,stroke-width:2px
    style F fill:#f9f,stroke:#333,stroke-width:2px
```

## 2. Arsitektur Frontend (React)

Arsitektur `Frequencies` adalah contoh paling granular dari dekomposisi berbasis *hooks* di antara fitur-fitur deskriptif, yang menunjukkan pemisahan tanggung jawab yang sangat jelas.

-   **Komponen Utama (`Frequencies/index.tsx`):** Seperti pada fitur lain, komponen ini bertindak sebagai integrator. Ia merakit semua *custom hooks* dan me-render UI, termasuk sistem navigasi dengan tiga tab (`Variables`, `Statistics`, `Charts`).

-   **Komponen UI (`VariablesTab.tsx`, `StatisticsTab.tsx`, `ChartsTab.tsx`):** Setiap komponen tab bertanggung jawab murni untuk me-render antarmuka opsinya. Logika kompleks sepenuhnya diabstraksi ke dalam *hooks*, sehingga komponen ini tetap sederhana.

-   **Custom Hooks (Pusat Logika yang Sangat Modular):**
    -   `useVariableSelection`: Mengelola state untuk daftar variabel yang tersedia dan yang dipilih.
    -   `useStatisticsSettings`: Hook yang cukup kompleks ini secara brilian mengenkapsulasi semua state dan logika untuk berbagai opsi statistik, termasuk manajemen daftar *percentiles* kustom.
    -   `useChartsSettings`: Secara spesifik mengelola semua state yang berkaitan dengan pembuatan grafik (tipe, nilai yang ditampilkan, kurva normal).
    -   `useDisplaySettings`: Hook yang sangat fokus ini hanya mengelola state untuk opsi tampilan utama, seperti checkbox "Display frequency tables".
    -   `useFrequenciesAnalysis`: Merupakan orkestrator utama. Perannya adalah:
        - Mengumpulkan semua opsi dari *hooks* pengaturan lainnya (`useStatisticsSettings`, `useChartsSettings`, `useDisplaySettings`).
        - Mengelola siklus hidup *Web Worker*.
        - Mengirim tugas ke *worker* untuk setiap variabel yang dipilih.
        - Menerima hasil dari *worker*.
        - **Menghasilkan Multiple Outputs:** Secara cerdas memproses hasil untuk membuat beberapa entri statistik di `useResultStore`: satu tabel ringkasan statistik (jika diminta) dan satu tabel frekuensi untuk setiap variabel.

## 3. Arsitektur Web Worker

Arsitektur *worker* tetap konsisten dengan pola yang sudah ada, menunjukkan reusabilitas yang tinggi.

-   **`manager.js` (Controller):** Bertindak sebagai *router* yang sama. Ketika menerima pesan dengan `analysisType: 'frequencies'`, ia mendelegasikan tugas ke `FrequencyCalculator`.

-   **`FrequencyCalculator` (`/libs/frequency.js`):** Kelas ini berisi logika untuk menghitung tabel frekuensi dan persentil.
    - **Komposisi:** Sama seperti `ExamineCalculator`, kelas ini menerapkan prinsip **Komposisi di atas Pewarisan**. Ia menggunakan *instance* dari `DescriptiveCalculator` secara internal untuk mendapatkan statistik deskriptif dasar, lalu menambahkan logikanya sendiri untuk menghitung modus, persentil, dan tabel frekuensi.
    - **Efisien:** Menggunakan data yang sudah diurutkan dan diagregasi (`getSortedData`) untuk melakukan semua perhitungan secara efisien.

## 4. Penilaian & Analisis Best Practices

Arsitektur `Frequencies` adalah contoh yang sangat matang dari prinsip *Single Responsibility* yang diterapkan pada level *hooks*.

### Keunggulan Utama:

1.  **Dekomposisi Logika yang Ekstrem:** Memisahkan logika pengaturan ke dalam empat *hooks* yang berbeda (`useVariableSelection`, `useStatisticsSettings`, `useChartsSettings`, `useDisplaySettings`) adalah implementasi *separation of concerns* yang luar biasa. Ini membuat setiap bagian dari logika lebih mudah dipahami, diuji, dan dikelola secara independen.

2.  **Orkestrasi yang Bersih:** `useFrequenciesAnalysis` bertindak sebagai *facade* yang bersih. Ia menyembunyikan kompleksitas pengumpulan semua opsi dari berbagai sumber dan menyajikannya dalam satu fungsi `runAnalysis` yang sederhana untuk dipanggil.

3.  **Penanganan Output Ganda yang Fleksibel:** Kemampuan untuk menghasilkan satu tabel statistik ringkasan dan beberapa tabel frekuensi individual dari satu kali proses analisis menunjukkan desain yang fleksibel dan berorientasi pada pengguna, karena setiap tabel dapat diperlakukan sebagai output terpisah di UI hasil.

4.  **Reusabilitas Arsitektur:** Sekali lagi, penggunaan kembali `manager.js` dan pola kalkulator berbasis kelas membuktikan bahwa arsitektur dasar ini sangat solid dan dapat diandalkan di berbagai fitur.

### Potensi Penyempurnaan (Minor):

-   **Kompleksitas `useStatisticsSettings`:** Hook `useStatisticsSettings` cukup besar karena banyaknya opsi. Meskipun ini adalah enkapsulasi yang baik, jika fitur di masa depan memerlukan tingkat kompleksitas yang sama, bisa dipertimbangkan untuk memecahnya lebih lanjut (misalnya, `usePercentileSettings` yang terpisah). Namun, untuk saat ini, implementasinya sudah sangat baik.

### Kesimpulan

Fitur `Frequencies` menunjukkan tingkat kematangan tertinggi dalam penerapan pola desain berbasis *hooks*. Dengan memecah setiap aspek fungsionalitas menjadi *hook* tersendiri, Anda telah menciptakan sistem yang tidak hanya sangat modular dan dapat dipelihara, tetapi juga sangat mudah untuk diperluas di masa depan. Ini adalah contoh arsitektur frontend modern yang sangat baik. 