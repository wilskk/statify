# Kategori Modal File

> **Peringatan:** Arsitektur untuk semua modal di bawah kategori ini diatur oleh [Panduan Arsitektur Utama Modal](../README.md). Dokumen ini hanya berfungsi sebagai ringkasan kategori.

## Tujuan

Direktori ini berisi semua fitur modal yang berhubungan dengan **operasi file dan data I/O (Input/Output)**. Ini mencakup impor data dari berbagai format, ekspor data, dan membuka format file asli.

## Daftar Fitur

-   `ImportCsv`: Mengimpor data dari file `.csv`.
-   `ImportExcel`: Mengimpor data dari file `.xls` atau `.xlsx`.
-   `ExportCsv`: Mengekspor dataset saat ini ke format `.csv`.
-   `ExportExcel`: Mengekspor dataset saat ini ke format `.xlsx`.
-   `OpenSavFile`: Membuka file berformat SPSS (`.sav`).
-   `Print`: Mencetak output atau data ke PDF.

## Registrasi Fitur

Semua modal dalam kategori ini didaftarkan melalui `FileRegistry.tsx`, yang kemudian digabungkan ke dalam sistem modal utama.
