# Fitur Modal: Impor dari Clipboard

Dokumen ini memberikan ringkasan teknis untuk fitur **Impor dari Clipboard**, mengikuti panduan arsitektur utama untuk komponen modal.

## 1. Ringkasan Fungsionalitas

Fitur ini memungkinkan pengguna untuk mengimpor data tabular dengan menyalinnya langsung dari clipboard. Prosesnya dibagi menjadi dua tahap utama, mirip dengan fitur "Text to Columns" di Excel:

1.  **Tempel Data**: Pengguna menempelkan teks ke dalam area yang disediakan atau menggunakan tombol untuk membaca dari clipboard API secara otomatis.
2.  **Konfigurasi Impor**: Pengguna mengonfigurasi bagaimana data teks harus diurai, dengan opsi seperti:
    -   **Delimiter**: Karakter pemisah nilai (Tab, Koma, Titik Koma, Spasi, atau kustom).
    -   **Text Qualifier**: Karakter yang membungkus teks (misalnya, kutip ganda).
    -   **Baris Pertama sebagai Header**: Menggunakan baris pertama sebagai nama variabel.
    -   **Pratinjau Data**: Melihat pratinjau data interaktif berdasarkan pengaturan yang dipilih.
    -   Opsi tambahan seperti memangkas spasi dan melewati baris kosong.

## 2. Struktur Direktori & Tanggung Jawab

-   **`/` (Root)**
    -   **`index.tsx`**: **Orchestrator**. Merakit dan menampilkan langkah yang sesuai (`PasteStep` atau `ConfigurationStep`) berdasarkan state yang dikelola oleh `useImportClipboardLogic`.
    -   **`types.ts`**: Mendefinisikan semua tipe dan *interface* TypeScript yang relevan untuk fitur ini.
    -   **`README.md`**: (File ini) Dokumentasi fitur.

-   **`components/`**
    -   **`ImportClipboardPasteStep.tsx`**: Komponen UI untuk tahap pertama. Bertanggung jawab untuk menangani input teks dari pengguna, baik melalui *paste* manual maupun tombol.
    -   **`ImportClipboardConfigurationStep.tsx`**: Komponen UI untuk tahap kedua. Menampilkan opsi konfigurasi *parsing* dan pratinjau data menggunakan `Handsontable`.

-   **`hooks/`**
    -   **`useImportClipboardLogic.ts`**: Mengelola *state* utama modal, seperti tahap saat ini (`paste` atau `configure`), teks yang ditempel, dan navigasi antar-langkah.
    -   **`useImportClipboardProcessor.ts`**: Berisi logika untuk memproses, mengubah, dan mengimpor data. Hook ini dipanggil oleh `ConfigurationStep` untuk finalisasi.

-   **`services/`**
    -   **`services.ts`**: Abstraksi untuk interaksi dengan Browser API, khususnya `navigator.clipboard.readText()` untuk mengakses clipboard secara aman.

-   **`utils/`**
    -   **`utils.ts`**: Berisi fungsi utilitas inti, termasuk fungsi `excelStyleTextToColumns` yang merupakan jantung dari logika *parsing* teks menjadi struktur kolom dan baris.

## 3. Alur Kerja (Workflow)

1.  **Inisialisasi (Paste Step)**: Pengguna membuka modal. `index.tsx` merender `ImportClipboardPasteStep`. Pengguna menempelkan data menggunakan `Ctrl+V` atau tombol "Paste from Clipboard" yang memanggil `services/services.ts`.
2.  **Penyimpanan Teks**: `useImportClipboardLogic` menerima teks yang ditempel dan menyimpannya di dalam *state*.
3.  **Lanjut ke Konfigurasi**: Pengguna menekan "Continue". `useImportClipboardLogic` mengubah *stage* menjadi `configure`.
4.  **Render Konfigurasi & Pratinjau**: `index.tsx` sekarang merender `ImportClipboardConfigurationStep`. Komponen ini segera menggunakan `excelStyleTextToColumns` dari `utils.ts` untuk membuat pratinjau data awal berdasarkan teks yang ditempel dan opsi *default*.
5.  **Penyesuaian Opsi**: Pengguna mengubah opsi *parsing* (misalnya, delimiter). Setiap perubahan memicu pembaruan pratinjau secara *real-time*.
6.  **Finalisasi Impor**: Pengguna menekan "Import".
    -   `ConfigurationStep` memanggil fungsi `processClipboardData` dari *hook* `useImportClipboardProcessor`.
    -   *Hook* ini menjalankan `excelStyleTextToColumns` sekali lagi dengan konfigurasi final.
    -   Hasil *parsing* diubah menjadi struktur data dan variabel yang sesuai.
    -   `overwriteVariables` dan `setData` dari *store* Zustand dipanggil untuk memuat data ke dalam aplikasi.
7.  **Selesai**: Modal ditutup setelah impor berhasil.

## 4. Properti Komponen (`ImportClipboardProps`)

-   `onClose: () => void`: **(Wajib)** Fungsi *callback* yang dipanggil untuk menutup modal.
-   `containerType?: "dialog" | "sidebar"`: **(Opsional)** Menentukan konteks render untuk penyesuaian tata letak.

## 5. Ketergantungan Utama (Dependencies)

-   **Internal**:
    -   Zustand Stores (`useDataStore`, `useVariableStore`).
    -   Komponen UI dari `@/components/ui/*`.
-   **Eksternal**:
    -   `handsontable/react-wrapper`: Untuk menampilkan pratinjau data interaktif.
    -   `framer-motion`: Untuk animasi transisi dan *highlighting* pada fitur *tour*.
