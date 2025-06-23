# Fitur: Set Measurement Level

Dokumen ini memberikan gambaran tentang fitur "Set Measurement Level", yang memungkinkan pengguna untuk secara efisien mendefinisikan tingkat pengukuran (Nominal, Ordinal, atau Scale) untuk variabel yang tingkat pengukurannya saat ini "Unknown".

## Ringkasan Fungsionalitas

-   **Deteksi Otomatis**: Saat dibuka, modal secara otomatis mendeteksi dan menampilkan semua variabel dalam dataset yang memiliki tingkat pengukuran `unknown`.
-   **Antarmuka Drag-and-Drop**: Pengguna dapat dengan mudah memindahkan variabel dari daftar "Unknown" ke salah satu dari tiga daftar kategori: "Nominal", "Ordinal", atau "Scale".
-   **Pembaruan Terpusat**: Setelah mengklik "OK", tingkat pengukuran untuk semua variabel yang dipindahkan akan diperbarui di seluruh aplikasi melalui `useVariableStore`.
-   **Kinerja**: Dirancang untuk menangani variabel dalam jumlah besar tanpa mengorbankan kinerja UI.

## Arsitektur & Pola Desain

Fitur ini mengikuti panduan arsitektur utama untuk komponen modal, dengan pemisahan tanggung jawab yang jelas.

```
/SetMeasurementLevel
├── 📂 hooks/
│   └── 📄 useSetMeasurementLevel.ts  // Mengelola semua state & logika
├── 📄 index.tsx                      // Titik masuk & perakit (Orchestrator)
├── 📄 README.md                      // Dokumen ini
├── 📄 SetMeasurementLevelUI.tsx      // Komponen UI (Presentational)
└── 📄 types.ts                      // Definisi tipe TypeScript
```

-   **`index.tsx` (Orchestrator)**:
    -   Bertanggung jawab untuk merakit fitur.
    -   Memanggil *hook* `useSetMeasurementLevel` untuk mendapatkan semua state dan *handler*.
    -   Merender `SetMeasurementLevelUI` dan meneruskan *props* yang diperlukan.

-   **`useSetMeasurementLevel.ts` (Hook Logika)**:
    -   Jantung dari fitur ini.
    -   Mengambil variabel dari `useVariableStore`.
    -   Mengelola state untuk setiap daftar variabel (`unknownVariables`, `nominalVariables`, dll.).
    -   Menyediakan *handler* (`handleMoveVariable`, `handleSave`) untuk memanipulasi state.
    -   Saat `handleSave` dipanggil, ia berinteraksi dengan `useVariableStore` untuk memperbarui variabel secara permanen.

-   **`SetMeasurementLevelUI.tsx` (Komponen UI)**:
    -   Komponen "bodoh" (*dumb component*) yang bertanggung jawab murni untuk presentasi.
    -   Menerima semua data dan *handler* sebagai *props* dari `index.tsx`.
    -   Menggunakan komponen `VariableListManager` untuk menampilkan daftar variabel dan menangani interaksi *drag-and-drop*.
    -   Tidak berisi logika bisnis apa pun.

-   **`types.ts` (Definisi Tipe)**:
    -   Mendefinisikan bentuk *props* untuk `SetMeasurementLevel` dan `SetMeasurementLevelUI`.
    -   Menggunakan `ReturnType<typeof useSetMeasurementLevel>` untuk secara dinamis membuat tipe *props* untuk UI, memastikan keamanan tipe antara *hook* dan komponen UI.

## Alur Kerja

1.  **Inisialisasi**:
    -   Pengguna membuka modal "Set Measurement Level".
    -   `useSetMeasurementLevel` dipanggil, mengambil semua variabel dari `useVariableStore`.
    -   *Hook* menyaring variabel-variabel ini untuk menemukan yang memiliki `measure === "unknown"`.
    -   State `unknownVariables` diisi, sementara daftar lainnya (`nominal`, `ordinal`, `scale`) dikosongkan.

2.  **Interaksi Pengguna**:
    -   Pengguna menarik variabel dari daftar "Available" ke salah satu daftar target (`Nominal`, `Ordinal`, `Scale`).
    -   `VariableListManager` memicu *callback* `handleMoveVariable`.
    -   `handleMoveVariable` dalam *hook* memperbarui state, memindahkan variabel dari satu daftar ke daftar lainnya.

3.  **Penyimpanan**:
    -   Pengguna mengklik "OK".
    -   *Handler* `handleSave` dipanggil.
    -   `handleSave` melakukan iterasi pada setiap variabel dalam daftar `nominalVariables`, `ordinalVariables`, dan `scaleVariables`.
    -   Untuk setiap variabel, ia memanggil `updateVariable` dari `useVariableStore` untuk memperbarui properti `measure`-nya.
    -   Modal ditutup. Perubahan secara otomatis tercermin di seluruh aplikasi di mana pun `useVariableStore` digunakan. 