# Fitur Modal: Impor dari Excel

Dokumen ini memberikan ringkasan teknis untuk fitur **Impor dari Excel**, mengikuti panduan arsitektur utama untuk komponen modal.

## 1. Ringkasan Fungsionalitas

Fitur ini memungkinkan pengguna untuk mengimpor data dari file Microsoft Excel (`.xls` atau `.xlsx`). Proses impor dibagi menjadi dua tahap utama untuk memberikan kontrol penuh kepada pengguna:

1.  **Pemilihan File**: Pengguna memilih file Excel dari sistem lokal mereka, baik melalui dialog file maupun *drag-and-drop*.
2.  **Konfigurasi Impor**: Setelah file berhasil diparsing di latar belakang oleh Web Worker, pengguna dapat mengonfigurasi impor dengan opsi berikut:
    -   **Pemilihan Worksheet**: Memilih *sheet* mana dari dalam *workbook* yang akan diimpor.
    -   **Rentang Sel (Range)**: Menentukan rentang sel tertentu yang akan dibaca (misalnya, `A1:D50`).
    -   **Baris Pertama sebagai Header**: Menggunakan baris pertama sebagai nama variabel.
    -   **Opsi Tambahan**: Membaca baris dan kolom tersembunyi, serta menentukan bagaimana sel kosong harus diperlakukan (sebagai string kosong atau nilai sistem yang hilang/SYSMIS).

Untuk menjaga responsivitas UI, proses *parsing* file Excel yang intensif dilakukan di dalam **Web Worker**.

## 2. Struktur Direktori & Tanggung Jawab

-   **`/` (Root)**
    -   **`index.tsx`**: **Orchestrator**. Mengelola tahap proses (`select` atau `configure`) dan merender komponen yang sesuai.
    -   **`types.ts`**: Mendefinisikan semua tipe dan *interface* TypeScript yang relevan.
    -   **`README.md`**: (File ini) Dokumentasi fitur.

-   **`components/`**
    -   **`ImportExcelSelectionStep.tsx`**: Komponen UI untuk tahap pemilihan file.
    -   **`ImportExcelConfigurationStep.tsx`**: Komponen UI untuk tahap konfigurasi, termasuk pemilihan *sheet*, penentuan rentang, dan opsi lainnya. Juga menampilkan pratinjau data menggunakan `Handsontable`.

-   **`hooks/`**
    -   **`useImportExcelLogic.ts`**: Hook utama yang mengelola logika dan *state* keseluruhan, seperti file yang dipilih, *stage* saat ini, dan data hasil *parsing* dari *worker*.
    -   **`useExcelWorker.ts`**: Hook yang membungkus interaksi dengan Web Worker, menyediakan antarmuka yang bersih untuk memulai proses *parsing*.

-   **`services/`**
    -   **`services.ts`**: Mengelola pembuatan dan komunikasi dengan `excelWorker.js`. Ini adalah lapisan abstraksi antara *hook* dan Web Worker API.

-   **`utils/`**
    -   **`utils.ts`**: Berisi fungsi utilitas untuk memproses data yang telah diparsing oleh *worker*. Fungsi-fungsi ini digunakan oleh `ConfigurationStep` untuk membuat pratinjau dan mempersiapkan data final untuk diimpor ke *store*.

-   **`public/workers/file-management/`**
    -   **`excelWorker.js`**: Skrip **Web Worker** yang bertanggung jawab untuk melakukan *parsing* file Excel menggunakan pustaka `xlsx` (SheetJS), mencegah pemblokiran *thread* utama.

## 3. Alur Kerja (Workflow)

1.  **Inisialisasi (Selection Step)**: Pengguna membuka modal. `index.tsx` merender `ImportExcelSelectionStep`.
2.  **Pemilihan File**: Pengguna memilih sebuah file Excel. `handleFileSelect` dari `useImportExcelLogic` memperbarui *state*.
3.  **Lanjut ke Konfigurasi (Parsing di Latar)**: Pengguna menekan "Continue".
    -   `useImportExcelLogic` memanggil fungsi `parse` dari *hook* `useExcelWorker`.
    -   `useExcelWorker` (melalui `services.ts`) membuat instance `excelWorker.js` dan mengirimkan file ke sana.
    -   **Web Worker** membaca file sebagai biner dan menggunakan `xlsx` untuk mengekstrak data dari setiap *sheet*. Hasilnya dikirim kembali sebagai array `SheetData`.
4.  **Render Konfigurasi**: Setelah `useImportExcelLogic` menerima data *sheet*, ia mengubah *stage* menjadi `configure`. `index.tsx` kemudian merender `ImportExcelConfigurationStep`, meneruskan data tersebut.
5.  **Penyesuaian Opsi & Pratinjau**: `ConfigurationStep` menampilkan daftar *sheet* dan opsi. Saat pengguna mengubah opsi, pratinjau data diperbarui secara *real-time* dengan memanggil fungsi dari `utils.ts`.
6.  **Finalisasi Impor**: Pengguna menekan "Import Data".
    -   Fungsi `handleImport` di dalam `ConfigurationStep` dipanggil.
    -   Data dari *sheet* yang dipilih diproses sekali lagi menggunakan `utils.ts` dengan konfigurasi final.
    -   Variabel baru dibuat, dan data yang telah diproses dimuat ke dalam *store* Zustand.
7.  **Selesai**: Modal ditutup setelah impor berhasil.

## 4. Properti Komponen (`ImportExcelProps`)

-   `onClose: () => void`: **(Wajib)** Fungsi *callback* untuk menutup modal.
-   `containerType: ContainerType`: **(Wajib)** Menentukan konteks render (`dialog` atau `sidebar`).

## 5. Ketergantungan Utama (Dependencies)

-   **Internal**:
    -   Zustand Stores (`useDataStore`, `useVariableStore`).
    -   Komponen UI dari `@/components/ui/*`.
-   **Eksternal**:
    -   `xlsx` (SheetJS): Pustaka inti untuk *parsing* file Excel, digunakan di dalam Web Worker.
    -   `handsontable/react-wrapper`: Untuk menampilkan pratinjau data interaktif.
    -   `framer-motion`: Untuk animasi pada fitur *tour*.
-   **Arsitektural**:
    -   **Web Worker API**: Ketergantungan fundamental untuk *offloading* proses *parsing* dari *thread* utama.