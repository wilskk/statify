# Fitur: Sort Variables

Dokumen ini menjelaskan fungsionalitas dan arsitektur fitur "Sort Variables", yang memungkinkan pengguna untuk mengurutkan daftar variabel di "Variable View" berdasarkan salah satu atributnya.

## Ringkasan Fungsionalitas

-   **Pengurutan Berbasis Atribut**: Pengguna dapat memilih salah satu kolom atribut variabel (seperti "Name", "Type", "Label", dll.) sebagai dasar pengurutan.
-   **Arah Pengurutan**: Pengguna dapat memilih untuk mengurutkan secara menaik (`Ascending`) atau menurun (`Descending`).
-   **Pembaruan Dataset**: Selain mengurutkan daftar variabel, fitur ini juga akan secara cerdas mengatur ulang urutan kolom dalam dataset aktual agar sesuai dengan urutan variabel yang baru.
-   **Penerapan Langsung**: Perubahan pada urutan variabel dan data akan disimpan ke `useVariableStore` dan `useDataStore`.

## Arsitektur & Pola Desain

Fitur ini telah direfaktor untuk mengikuti panduan arsitektur utama proyek.

```
/SortVars
├── 📂 hooks/
│   └── 📄 useSortVariables.ts  // Mengelola state & logika UI
├── 📂 services/
│   └── 📄 sortVarsService.ts   // Logika bisnis untuk mengurutkan data
├── 📄 index.tsx                // Titik masuk & perakit (Orchestrator)
├── 📄 README.md                // Dokumen ini
├── 📄 SortVarsUI.tsx           // Komponen UI (Presentational)
└── 📄 types.ts                // Definisi tipe TypeScript
```

-   **`index.tsx` (Orchestrator)**: Merakit fitur dengan memanggil *hook* `useSortVariables` dan meneruskan hasilnya ke komponen `SortVarsUI`.
-   **`useSortVariables.ts` (Hook Logika)**: Mengelola state UI (kolom mana yang dipilih, arah pengurutan) dan memanggil *service* yang relevan saat pengguna mengonfirmasi tindakan.
-   **`sortVarsService.ts` (Service)**: Berisi logika murni dan kompleks untuk mengatur ulang kolom-kolom dalam dataset (`sortDataColumns`). Ini memisahkan manipulasi data berat dari *hook*.
-   **`SortVarsUI.tsx` (Komponen UI)**: Komponen presentasi yang menampilkan daftar atribut untuk dipilih dan opsi arah pengurutan.
-   **`types.ts` (Definisi Tipe)**: Mendefinisikan *props* untuk komponen dan memastikan keamanan tipe di seluruh fitur.

## Alur Kerja

1.  **Inisialisasi**: Pengguna membuka modal "Sort Variables". `SortVarsUI` menampilkan daftar atribut variabel yang dapat dipilih.
2.  **Interaksi Pengguna**: Pengguna memilih atribut (misalnya, "Name") dan arah pengurutan (misalnya, "Ascending").
3.  **Penyimpanan**:
    -   Pengguna mengklik "OK".
    -   `handleOk` di dalam *hook* `useSortVariables` dipicu.
    -   *Hook* membuat salinan dari daftar variabel asli.
    -   Ia kemudian mengurutkan daftar variabel berdasarkan atribut dan arah yang dipilih, dan memperbarui `useVariableStore` dengan urutan baru ini.
    -   Selanjutnya, ia memanggil `sortDataColumns` dari `sortVarsService`, memberikan data asli, urutan variabel asli, dan urutan variabel yang baru.
    -   *Service* menghitung ulang posisi setiap kolom dan mengembalikan dataset baru yang telah diatur ulang.
    -   *Hook* menyimpan dataset baru ini ke `useDataStore`.
    -   Modal ditutup. 