# Fitur Modal: Cetak ke PDF

Dokumen ini memberikan ringkasan teknis untuk fitur **Cetak ke PDF**, mengikuti panduan arsitektur utama untuk komponen modal.

## 1. Ringkasan Fungsionalitas

Fitur ini memungkinkan pengguna untuk mengekspor data dan hasil analisis ke dalam sebuah file PDF. Fungsionalitas utamanya meliputi:

-   **Pemilihan Konten**: Pengguna dapat memilih bagian mana yang akan disertakan dalam PDF, yaitu *Data View*, *Variable View*, dan *Output Viewer (Results)*.
-   **Konfigurasi Output**: Pengguna dapat menentukan nama file dan memilih ukuran kertas (A4, A3, Letter, Legal).
-   **Generasi Sisi Klien**: Seluruh proses pembuatan PDF dilakukan di sisi klien (*main thread*) menggunakan pustaka `jsPDF` dan `jspdf-autotable`, tanpa interaksi dengan server.

Fitur ini juga menyertakan *product tour* interaktif untuk memandu pengguna baru.

## 2. Struktur Direktori & Tanggung Jawab

Struktur fitur ini mengikuti standar *feature-sliced design* yang telah ditetapkan.

-   **`/` (Root)**
    -   **`index.tsx`**: **Orchestrator**. Merakit komponen UI `PrintOptions` dan menghubungkannya dengan hook `usePrintLogic`.
    -   **`README.md`**: Dokumentasi teknis ini.
    -   **`types.ts`**: Definisi tipe TypeScript untuk fitur ini (misalnya, `PaperSize`, `SelectedOptions`, dan props komponen).
-   **`components/`**
    -   **`PrintOptions.tsx`**: **Komponen UI**. Komponen "dumb" yang menampilkan semua opsi konfigurasi (nama file, konten, ukuran kertas) dan tombol aksi. Juga berisi logika untuk fitur *product tour*.
-   **`hooks/`**
    -   **`usePrintLogic.ts`**: **Hook Logika Utama**. Mengelola semua state (nama file, opsi terpilih, ukuran kertas, status `isGenerating`). Mengambil data dari store Zustand dan memanggil `pdfPrintService` untuk menghasilkan PDF.
-   **`services/`**
    -   **`pdfPrintService.ts`**: **Service PDF**. Berisi logika untuk membuat dokumen PDF menggunakan `jsPDF`. Mengekspor fungsi seperti `addDataGridView` yang bertanggung jawab untuk merender setiap bagian ke dalam PDF.
-   **`utils/`**
    -   **`index.ts`**: **Utilitas**. Menyediakan fungsi murni, terutama `generateAutoTableDataFromString`, yang mengubah output statistik dalam format JSON menjadi struktur data yang dapat digunakan oleh `jspdf-autotable`.

## 3. Alur Kerja

1.  Pengguna membuka modal "Print".
2.  Komponen `index.tsx` dirender, yang kemudian memanggil `usePrintLogic` untuk inisialisasi state dan event handlers.
3.  UI `PrintOptions` ditampilkan, menerima state dan handler dari `usePrintLogic` sebagai props.
4.  Pengguna berinteraksi dengan UI untuk mengubah nama file, memilih konten, atau ukuran kertas. Setiap perubahan memperbarui state di dalam `usePrintLogic`.
5.  Pengguna menekan tombol "Print".
6.  Fungsi `handlePrint` di dalam `usePrintLogic` dieksekusi, yang menyetel state `isGenerating` menjadi `true`.
7.  Hook mengambil data terbaru dari store Zustand (`useDataStore`, `useVariableStore`, `useResultStore`).
8.  Hook memanggil fungsi-fungsi dari `pdfPrintService` secara berurutan untuk membangun dokumen PDF.
9.  Layanan `pdfPrintService` menggunakan utilitas dari `utils/index.ts` untuk memformat data tabel.
10. Setelah PDF selesai dibuat, file diunduh oleh browser. State `isGenerating` direset, dan modal ditutup.

## 4. Interaksi Eksternal

-   **Store (Zustand)**: Fitur ini hanya **membaca** data dari `useDataStore`, `useVariableStore`, dan `useResultStore`. Tidak ada modifikasi state global yang dilakukan.
-   **Web Worker**: Fitur ini **tidak** menggunakan Web Worker. Seluruh proses pembuatan PDF berjalan di *main thread* browser.
-   **API Backend**: Tidak ada interaksi dengan backend.
