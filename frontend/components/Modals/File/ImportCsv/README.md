# Fitur Modal: Impor dari CSV

Dokumen ini memberikan ringkasan teknis untuk fitur **Impor dari CSV**, mengikuti panduan arsitektur utama untuk komponen modal.

## 1. Ringkasan Fungsionalitas

Fitur ini memungkinkan pengguna untuk mengimpor data dari file CSV (`.csv`). Prosesnya dirancang dalam dua tahap untuk memastikan fleksibilitas dan pengalaman pengguna yang baik:

1.  **Pemilihan File**: Pengguna memilih file `.csv` dari sistem lokal mereka melalui dialog file atau dengan mekanisme *drag-and-drop*.
2.  **Konfigurasi Parsing**: Setelah file terbaca, pengguna dapat mengonfigurasi bagaimana data teks harus diurai. Opsi yang tersedia meliputi:
    -   **Baris Pertama sebagai Header**: Menggunakan baris pertama sebagai nama variabel.
    -   **Delimiter**: Karakter pemisah nilai (Koma, Titik Koma, Tab).
    -   **Simbol Desimal**: Karakter yang digunakan untuk angka desimal (Titik atau Koma).
    -   **Text Qualifier**: Karakter yang membungkus teks (misalnya, kutip ganda).
    -   Opsi untuk memangkas spasi di awal dan akhir nilai.

Untuk menjaga responsivitas antarmuka, proses *parsing* CSV yang berat didelegasikan ke **Web Worker**.

## 2. Struktur Direktori & Tanggung Jawab

-   **`/` (Root)**
    -   **`index.tsx`**: **Orchestrator**. Mengelola tahap proses (`select` atau `configure`) dan merender komponen yang sesuai.
    -   **`types.ts`**: Mendefinisikan semua tipe dan *interface* TypeScript yang relevan untuk fitur ini.
    -   **`README.md`**: (File ini) Dokumentasi fitur.
    -   **`importCsvUtils.ts`**: Berisi fungsi utilitas dan kelas *error* kustom.

-   **`components/`**
    -   **`ImportCsvSelection.tsx`**: Komponen UI untuk tahap pemilihan file.
    -   **`ImportCsvConfiguration.tsx`**: Komponen UI untuk tahap konfigurasi *parsing* dan menampilkan pratinjau file.

-   **`hooks/`**
    -   **`useImportCsvFileReader.ts`**: Hook untuk membaca konten file dari `File` object secara asinkron.
    -   **`useImportCsvProcessor.ts`**: Hook yang dipanggil oleh `ConfigurationStep` untuk memulai proses impor final.
    -   **`useCsvWorker.ts`**: (Tidak digunakan secara langsung oleh komponen) Hook yang membungkus logika interaksi dengan Web Worker, menyediakan fungsi `parse`. *Saat ini, `useImportCsvProcessor` memanggil service secara langsung.*

-   **`services/`**
    -   **`services.ts`**: Berisi `importCsvDataService` untuk mengabstraksi pembaruan *store* (reset dan populasi data) dan `parseCsvWithWorker` untuk mengelola interaksi dengan Web Worker. Ini adalah lapisan perantara antara UI dan logika bisnis/data.

-   **`utils/`**
    -   **`importCsvUtils.ts`**: Berisi fungsi utilitas dan kelas *error* kustom. *Catatan: Logika parsing utama sekarang ada di dalam Web Worker.*

-   **`public/workers/file-management/`**
    -   **`csvWorker.js`**: Skrip **Web Worker**. Di sinilah logika *parsing* CSV yang intensif sumber daya dijalankan untuk mencegah pemblokiran *thread* utama.

## 3. Alur Kerja (Workflow)

1.  **Inisialisasi (Selection Step)**: Pengguna membuka modal. `index.tsx` merender `ImportCsvSelection`.
2.  **Pemilihan File**: Pengguna memilih file. `handleFileSelect` di `index.tsx` memperbarui *state* `file`.
3.  **Lanjut ke Konfigurasi**: Pengguna menekan "Continue". Hook `useImportCsvFileReader` dipanggil untuk membaca konten file.
4.  **Render Konfigurasi**: Setelah konten file berhasil dibaca, `index.tsx` mengubah *stage* menjadi `configure` dan merender `ImportCsvConfiguration`, meneruskan konten file.
5.  **Penyesuaian Opsi**: Pengguna menyesuaikan opsi *parsing* di `ImportCsvConfiguration`.
6.  **Finalisasi Impor**: Pengguna menekan "Import".
    -   `ImportCsvConfiguration` memanggil fungsi `processCSV` dari *hook* `useImportCsvProcessor`.
    -   `useImportCsvProcessor` memanggil `importCsvDataService.resetStores()` untuk membersihkan data lama.
    -   Kemudian, ia memanggil `parseCsvWithWorker` dari `services.ts`.
    -   **Web Worker** menerima konten file dan opsi, melakukan *parsing*, lalu mengirim kembali data terstruktur (variabel dan baris data).
    -   Setelah menerima hasil dari *worker*, `useImportCsvProcessor` memanggil `importCsvDataService.populateStores()` untuk mengisi *store* Zustand dengan data baru.
7.  **Selesai**: Modal ditutup setelah impor berhasil.

## 4. Properti Komponen (`ImportCsvProps`)

-   `onClose: () => void`: **(Wajib)** Fungsi *callback* untuk menutup modal.
-   `containerType: "dialog" | "sidebar"`: **(Wajib)** Menentukan konteks render.

## 5. Ketergantungan Utama (Dependencies)

-   **Internal**:
    -   Zustand Stores (`useDataStore`, `useVariableStore`) melalui lapisan layanan.
    -   Komponen UI dari `@/components/ui/*`.
-   **Arsitektural**:
    -   **Web Worker API**: Ketergantungan fundamental untuk *offloading* proses *parsing* CSV dari *thread* utama.

```tsx
import ImportCsv from "./ImportCsv"; // Adjust path as necessary

// Example usage:
const MyDataManagementPage = () => {
    const [isImportCsvModalOpen, setIsImportCsvModalOpen] = React.useState(false);

    const handleOpenImportCsv = () => setIsImportCsvModalOpen(true);
    const handleCloseImportCsv = () => {
        setIsImportCsvModalOpen(false);
        // Optional: refresh data or perform other actions
    };

    return (
        <>
            <Button onClick={handleOpenImportCsv}>Import CSV File</Button>
            {isImportCsvModalOpen && (
                <ImportCsv
                    onClose={handleCloseImportCsv}
                    containerType="dialog"
                />
            )}
        </>
    );
};
```
