# Fitur: Ekspor ke Excel

Dokumen ini memberikan ringkasan teknis dan fungsional untuk fitur "Ekspor ke Excel", yang memungkinkan pengguna untuk menyimpan dataset aktif mereka ke dalam format file Microsoft Excel.

## 1. Gambaran Umum

Fitur ini menyediakan antarmuka modal di mana pengguna dapat mengonfigurasi dan mengekspor data mereka ke file `.xlsx` atau `.xls`. Fungsionalitas utamanya adalah untuk memberikan portabilitas data, memungkinkan pengguna untuk melakukan analisis lebih lanjut atau berbagi data menggunakan perangkat lunak spreadsheet.

Fitur ini juga dilengkapi dengan tur interaktif untuk memandu pengguna melalui berbagai opsi ekspor yang tersedia.

## 2. Komponen Antarmuka & Fungsionalitas

### a. Opsi Utama
-   **Nama File**: Input teks untuk menentukan nama file yang akan diekspor. Secara default, ini diisi dengan nama proyek dari metadata, atau nama default jika tidak ada. Karakter yang tidak valid untuk nama file secara otomatis dihapus.
-   **Format**: Dropdown untuk memilih format file:
    -   `Excel Workbook (*.xlsx)`: Format modern dan direkomendasikan.
    -   `Excel 97-2003 Workbook (*.xls)`: Untuk kompatibilitas dengan versi Excel yang lebih lama.

### b. Opsi Ekspor
-   **Sertakan Nama Variabel**: Checkbox untuk menyertakan baris header dengan nama variabel di sheet data utama.
-   **Sertakan Properti Variabel**: Checkbox untuk membuat sheet terpisah (`VariableProperties`) yang berisi metadata untuk setiap variabel (tipe, label, format, dll.).
-   **Sertakan Metadata**: Checkbox untuk membuat sheet terpisah (`Metadata`) yang berisi metadata level file/proyek, jika tersedia.
-   **Terapkan Gaya Header**: Checkbox untuk menerapkan format dasar (misalnya, teks tebal) pada baris header untuk meningkatkan keterbacaan.
-   **Representasi Data Hilang**: Checkbox untuk menampilkan teks `SYSMIS` pada sel-sel yang datanya hilang, alih-alih membiarkannya kosong.

## 3. Alur Kerja & Logika

1.  **Inisiasi**: Pengguna membuka modal. Hook `useExportExcelLogic` menginisialisasi state dengan nilai default.
2.  **Konfigurasi**: Pengguna menyesuaikan nama file dan opsi ekspor melalui antarmuka. State diperbarui pada setiap perubahan.
3.  **Eksekusi**: Pengguna menekan tombol "Export".
4.  **Pengambilan Data**: Fungsi `handleExport` di dalam hook mengambil data, variabel, dan metadata terbaru dari Zustand stores (`useDataStore`, `useVariableStore`, `useMetaStore`).
5.  **Pembuatan Workbook**: Data yang diambil dan opsi yang dikonfigurasi diteruskan ke fungsi `generateExcelWorkbook` di `utils/excelExporter.ts`. Fungsi ini membangun objek workbook menggunakan pustaka `xlsx`.
6.  **Pembuatan File**: `XLSX.writeFile` dipanggil untuk mengonversi objek workbook menjadi file Excel dan memicu unduhan di browser.
7.  **Umpan Balik**: Sebuah notifikasi toast ditampilkan untuk memberitahu pengguna apakah ekspor berhasil atau gagal. Modal akan tertutup secara otomatis jika berhasil.

## 4. Rencana Pengembangan di Masa Depan

-   **Ekspor Data yang Difilter**: Menambahkan opsi untuk hanya mengekspor kasus (baris) yang saat ini aktif atau dipilih (setelah filter diterapkan).
-   **Dukungan Styling Lanjutan**: Memungkinkan lebih banyak kustomisasi pada gaya, seperti warna sel, format angka, dan lebar kolom otomatis.
-   **Ekspor ke Google Sheets**: Menambahkan opsi untuk mengekspor langsung ke Google Sheets melalui integrasi API.
-   **Simpan Preset Opsi**: Memungkinkan pengguna untuk menyimpan konfigurasi ekspor favorit mereka sebagai preset untuk digunakan di masa mendatang.