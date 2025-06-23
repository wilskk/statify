# Fitur: Sort Cases

Dokumen ini menjelaskan fungsionalitas dan arsitektur fitur "Sort Cases", yang memungkinkan pengguna untuk mengurutkan baris (kasus) dalam dataset berdasarkan nilai dari satu atau lebih variabel.

## Ringkasan Fungsionalitas

-   **Pengurutan Multi-Level**: Pengguna dapat memilih beberapa variabel untuk dijadikan dasar pengurutan. Urutan variabel dalam daftar "Sort By" menentukan prioritas pengurutan.
-   **Arah Pengurutan**: Untuk setiap variabel, pengguna dapat menentukan arah pengurutan, yaitu menaik (`Ascending`) atau menurun (`Descending`).
-   **Kontrol UI Intuitif**: Antarmuka memungkinkan pengguna untuk dengan mudah menambah, menghapus, dan mengatur ulang urutan variabel pengurutan.
-   **Penerapan Langsung**: Setelah dikonfirmasi, data dalam `useDataStore` akan diperbarui secara langsung untuk mencerminkan urutan yang baru.

## Arsitektur & Pola Desain

Fitur ini dirancang sesuai dengan panduan arsitektur utama untuk komponen modal, dengan pemisahan tanggung jawab yang jelas.

```
/SortCases
├── 📂 hooks/
│   └── 📄 useSortCases.ts    // Mengelola semua state & logika
├── 📄 index.tsx              // Titik masuk & perakit (Orchestrator)
├── 📄 README.md              // Dokumen ini
├── 📄 SortCasesUI.tsx        // Komponen UI (Presentational)
└── 📄 types.ts              // Definisi tipe TypeScript
```

-   **`index.tsx` (Orchestrator)**:
    -   Bertanggung jawab untuk merakit fitur.
    -   Memanggil *hook* `useSortCases` untuk mendapatkan state dan *handler*.
    -   Merender `SortCasesUI` dan meneruskan *props* yang diperlukan.

-   **`useSortCases.ts` (Hook Logika)**:
    -   Mengelola state untuk daftar variabel yang tersedia dan variabel yang dipilih untuk pengurutan (`sortByConfigs`).
    -   Menyimpan konfigurasi pengurutan untuk setiap variabel (termasuk arah pengurutan).
    -   Menyediakan *handler* untuk memindahkan variabel, mengubah urutan, dan mengubah arah pengurutan.
    -   Memanggil `sortData` dari `useDataStore` saat pengguna mengonfirmasi tindakan.

-   **`SortCasesUI.tsx` (Komponen UI)**:
    -   Komponen presentasi murni yang menerima semua data dan *handler* dari `index.tsx`.
    -   Menggunakan `VariableListManager` untuk menampilkan daftar variabel.
    -   Merender kontrol tambahan (misalnya, tombol radio untuk arah pengurutan) saat sebuah variabel dalam daftar "Sort By" dipilih.
    -   Tidak mengandung logika bisnis apa pun.

-   **`types.ts` (Definisi Tipe)**:
    -   Mendefinisikan *interface* seperti `SortVariableConfig` (untuk menyimpan variabel dan arah pengurutannya).
    -   Mendefinisikan *props* untuk `SortCasesModal` dan `SortCasesUI`, memastikan keamanan tipe.

## Alur Kerja

1.  **Inisialisasi**:
    -   Pengguna membuka modal "Sort Cases".
    -   `useSortCases` mengambil semua variabel dari `useVariableStore` dan menampilkannya di daftar "Available".

2.  **Interaksi Pengguna**:
    -   Pengguna memindahkan satu atau lebih variabel dari daftar "Available" ke daftar "Sort By".
    -   Untuk setiap variabel yang dipindahkan, konfigurasi default (misalnya, `ascending`) diterapkan.
    -   Pengguna dapat memilih variabel di daftar "Sort By" untuk mengubah arah pengurutannya (naik/turun) atau mengubah posisinya dalam antrian prioritas.

3.  **Penyimpanan**:
    -   Pengguna mengklik "OK".
    -   *Handler* `handleOk` di dalam *hook* dipanggil.
    -   Fungsi ini melakukan iterasi melalui `sortByConfigs` sesuai urutannya.
    -   Untuk setiap konfigurasi, ia memanggil `sortData` dari `useDataStore` dengan `columnIndex` dan `direction` yang sesuai.
    -   `useDataStore` memperbarui state datanya, dan perubahan ini secara otomatis tercermin di seluruh aplikasi.
    -   Modal ditutup. 