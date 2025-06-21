# Fitur Modal: Ekspor ke CSV

Dokumen ini memberikan ringkasan teknis untuk fitur **Ekspor ke CSV**, mengikuti panduan arsitektur utama untuk komponen modal.

## 1. Ringkasan Fungsionalitas

Fitur ini memungkinkan pengguna untuk mengekspor dataset aktif ke dalam file CSV (Comma-Separated Values). Pengguna dapat mengonfigurasi beberapa aspek dari file yang dihasilkan, termasuk:

-   Nama file kustom.
-   **Delimiter**: Karakter pemisah nilai (Koma, Titik Koma, Pipa, atau Tab).
-   **Header**: Opsi untuk menyertakan nama variabel dan/atau properti variabel sebagai header.
-   **Enkapsulasi Teks**: Opsi untuk mengapit semua nilai string dengan tanda kutip.
-   **Pengkodean (Encoding)**: Pilihan pengkodean karakter untuk file (UTF-8, UTF-16 LE, dll.).

## 2. Struktur Direktori & Tanggung Jawab

Struktur fitur ini dirancang sesuai dengan *feature-sliced design*.

-   **`/` (Root)**
    -   **`index.tsx`**: **Orchestrator**. Komponen utama yang merakit antarmuka pengguna (UI). Komponen ini tidak mengandung logika bisnis, tetapi menyambungkan state dan *handler* dari `useExportCsv` ke elemen-elemen UI. Ia juga mengintegrasikan *hook* `useTourGuide` untuk fitur tur interaktif.
    -   **`types.ts`**: Mendefinisikan semua tipe dan *interface* TypeScript yang digunakan dalam fitur ini (`ExportCsvProps`, `CsvExportOptions`, dll.).
    -   **`README.md`**: (File ini) Dokumentasi ini.

-   **`hooks/`**
    -   **`useExportCsv.ts`**: **Jantung Logika**. Hook ini mengelola semua *state management* (nama file, opsi ekspor) dan logika inti. Ia berinteraksi dengan *store* Zustand untuk mengambil data, memvalidasi, dan memicu proses ekspor dengan memanggil utilitas `generateCsvContent`.
    -   **`useTourGuide.ts`**: Hook yang didedikasikan untuk mengelola logika dan state dari fitur tur interaktif.

-   **`utils/`**
    -   **`exportCsvUtils.ts`**: Berisi fungsi murni (`pure function`) `generateCsvContent` yang bertanggung jawab untuk membangun konten string CSV dari data mentah berdasarkan opsi yang diberikan.

## 3. Alur Kerja (Workflow)

1.  **Inisialisasi**: Pengguna membuka modal. `index.tsx` dirender, dan `useExportCsv` menginisialisasi *state* dengan nilai *default*.
2.  **Konfigurasi**: Pengguna berinteraksi dengan UI (mengubah nama file, memilih delimiter). Setiap perubahan memanggil *handler* dari `useExportCsv` untuk memperbarui *state*.
3.  **Eksekusi**: Pengguna menekan tombol "Ekspor".
    -   Fungsi `handleExport` di dalam `useExportCsv` dipanggil.
    -   Hook mengambil data terbaru dari `useDataStore` dan `useVariableStore`.
    -   Data dan opsi diteruskan ke utilitas `generateCsvContent` untuk membuat string CSV.
    -   Sebuah `Blob` dibuat dari string tersebut dengan *encoding* yang dipilih.
    -   URL objek dibuat dari `Blob`, dan sebuah elemen `<a>` sementara digunakan untuk memicu unduhan di browser.
4.  **Feedback**: *Toast* notifikasi (sukses atau gagal) ditampilkan. Modal ditutup jika ekspor berhasil.

## 4. Properti Komponen (`ExportCsvProps`)

Komponen `ExportCsv` menerima properti berikut:

-   `onClose: () => void`: **(Wajib)** Fungsi *callback* yang dipanggil untuk menutup modal.
-   `containerType?: "dialog" | "sidebar" | "panel"`: **(Opsional)** Menentukan konteks render, yang digunakan terutama untuk menyesuaikan posisi fitur tur.
-   Selain itu, komponen juga menerima `UseExportCsvOptions` (seperti `initialFilename`, `initialDelimiter`) untuk mengatur nilai awal pada form ekspor.

## 5. Ketergantungan Utama (Dependencies)

-   **Internal**:
    -   Zustand Stores (`useDataStore`, `useVariableStore`) untuk akses data.
    -   `@/hooks/use-toast` untuk menampilkan notifikasi.
    -   `@/hooks/useModal` untuk menutup modal.
    -   Komponen UI dari `@/components/ui/*`.
-   **Eksternal**:
    -   `framer-motion`: Untuk animasi pada fitur tur.
-   **Browser API**:
    -   `Blob` dan `URL.createObjectURL` untuk pembuatan dan pengunduhan file.