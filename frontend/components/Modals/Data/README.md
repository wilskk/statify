# Kategori Modal Data

> **Peringatan:** Arsitektur untuk semua modal di bawah kategori ini diatur oleh [Panduan Arsitektur Utama Modal](../README.md). Dokumen ini hanya berfungsi sebagai ringkasan kategori.

## Tujuan

Direktori ini berisi semua fitur modal yang berhubungan dengan **manipulasi dan manajemen data**. Ini mencakup konfigurasi variabel, operasi pada kasus (baris), dan perubahan struktur dataset.

## Daftar Fitur

-   **Properti Variabel**:
    -   `DefineVarProps`: Mendefinisikan properti variabel.
    -   `SetMeasurementLevel`: Mengatur level pengukuran.
    -   `DefineDateTime`: Mengkonfigurasi format tanggal & waktu.
-   **Operasi Kasus**:
    -   `SortCases`: Mengurutkan kasus.
    -   `DuplicateCases`: Mengelola kasus duplikat.
    -   `UnusualCases`: Menemukan kasus yang tidak biasa.
    -   `WeightCases`: Menerapkan pembobotan kasus.
-   **Operasi Struktur**:
    -   `SortVars`: Mengurutkan variabel.
    -   `Transpose`: Mentransposisi dataset.
    -   `Restructure`: Merestrukturisasi data.
    -   `Aggregate`: Mengagregasi data.

## Registrasi Fitur

Semua modal dalam kategori ini didaftarkan melalui `DataRegistry.tsx`, yang kemudian digabungkan ke dalam sistem modal utama. 