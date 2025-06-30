# Fitur Modal: Buka File SAV

Dokumen ini memberikan ringkasan teknis untuk fitur **Buka File SAV**, mengikuti panduan arsitektur utama untuk komponen modal.

## 1. Ringkasan Fungsionalitas

Fitur ini menyediakan antarmuka bagi pengguna untuk membuka file data statistik SPSS (`.sav`). Berbeda dengan proses impor CSV atau Excel yang terjadi di sisi klien (menggunakan Web Worker), pemrosesan file `.sav` dilakukan sepenuhnya di **sisi server (backend)**.

Modal ini terdiri dari satu langkah sederhana:

-   **Pemilihan File**: Pengguna memilih file `.sav` dari sistem lokal mereka melalui dialog file atau dengan mekanisme *drag-and-drop*. Setelah dipilih, file tersebut dikirim ke backend untuk diproses.

## 2. Struktur Direktori & Tanggung Jawab

-   **`/` (Root)**
    -   **`index.tsx`**: **Orchestrator**. Merender komponen UI `OpenSavFileStep` dan menghubungkannya dengan `useOpenSavFileLogic`. Bertanggung jawab juga untuk mengelola fitur tur.
    -   **`types.ts`**: Mendefinisikan semua tipe dan *interface* TypeScript yang relevan.
    -   **`README.md`**: (File ini) Dokumentasi fitur.

-   **`hooks/`**
    -   **`useOpenSavFileLogic.ts`**: **Jantung Logika**. Hook ini mengelola seluruh alur kerja:
        -   Mengelola state file yang dipilih, status *loading*, dan pesan *error*.
        -   Memanggil `services.ts` untuk mengirim file ke backend.
        -   Menerima data JSON yang telah diproses dari backend.
        -   Mentransformasi dan memetakan data JSON (metadata, variabel, dan baris data) ke dalam struktur data yang digunakan oleh aplikasi (Zustand stores).
        -   Memperbarui *store* data, variabel, dan meta.

-   **`services/`**
    -   **`services.ts`**: Bertindak sebagai lapisan abstraksi untuk panggilan API. Fungsi `processSavFile` di sini membungkus panggilan API sesungguhnya yang mengirimkan file ke backend.

## 3. Alur Kerja (Workflow)

1.  **Inisialisasi**: Pengguna membuka modal. `index.tsx` merender `OpenSavFileStep`.
2.  **Pemilihan File**: Pengguna memilih sebuah file `.sav`. `handleFileChange` dari `useOpenSavFileLogic` memperbarui *state* dan melakukan validasi ekstensi file sederhana.
3.  **Pengiriman ke Backend**: Pengguna menekan tombol "Open".
    -   Fungsi `handleSubmit` di dalam `useOpenSavFileLogic` dipanggil.
    -   *Store* data dan variabel direset.
    -   Sebuah `FormData` object dibuat yang berisi file tersebut.
    -   `services.ts` dipanggil untuk mengirim `FormData` ke API endpoint di backend.
4.  **Pemrosesan di Backend**: Server menerima file `.sav`, mem-parsing-nya, dan mengembalikan data terstruktur dalam format JSON.
5.  **Pemetaan Data di Frontend**:
    -   `useOpenSavFileLogic` menerima respons JSON.
    -   Hook ini memanggil fungsi utilitas terpusat (`processSavApiResponse` dari `@/utils/savFileUtils.ts`) untuk memetakan `sysvars` (system variables) menjadi `Variable[]`, `valueLabels` menjadi `ValueLabel[]`, dan `rows` menjadi matriks data 2D.
    -   Fungsi dari `@/utils/savFileUtils.ts` dan `spssDateConverter` digunakan selama proses pemetaan.
6.  **Pembaruan Store**: Data dan variabel yang telah ditransformasi dimuat ke dalam *store* Zustand.
7.  **Selesai**: Modal ditutup setelah data berhasil dimuat.

## 4. Properti Komponen (`OpenSavFileProps`)

-   `onClose: () => void`: **(Wajib)** Fungsi *callback* untuk menutup modal.
-   `containerType?: string`: **(Opsional)** Menentukan konteks render.

## 5. Ketergantungan Utama (Dependencies)

-   **Internal**:
    -   Zustand Stores (`useDataStore`, `useVariableStore`, `useMetaStore`).
    -   Komponen UI dari `@/components/ui/*`.
    -   Layanan API (`@/services/api`) yang dipanggil melalui `services.ts`.
-   **Eksternal**:
    -   `framer-motion`: Untuk animasi pada fitur tur.
-   **Arsitektural**:
    -   **API Backend**: Ketergantungan fundamental pada endpoint server yang mampu mem-parsing file `.sav`.

```tsx
import OpenSavFileModal from "./OpenSavFileModal"; // Adjust path as necessary

// Example:
const MyDataApplication = () => {
    const [isSavModalOpen, setIsSavModalOpen] = React.useState(false);

    const handleOpenSavFile = () => setIsSavModalOpen(true);
    const handleCloseSavFile = () => {
        setIsSavModalOpen(false);
        // Actions after modal closes or file is opened
    };

    return (
        <>
            <Button onClick={handleOpenSavFile}>Open .sav File</Button>
            {isSavModalOpen && (
                <OpenSavFileModal
                    onClose={handleCloseSavFile}
                    containerType="dialog"
                />
            )}
        </>
    );
};
```

## Dependencies

-   React
-   `@/components/ui/button`
-   `@/components/ui/alert` (for `Alert`, `AlertDescription`)
-   `lucide-react` (icons: `Loader2`, `Upload`, `FileText`, `X`, `AlertCircle`, `FolderOpen`, `HelpCircle`)
-   `./hooks/useOpenSavFileLogic` (handles the core logic for file selection, processing, and state management)
-   `./types` (for `OpenSavFileProps`, `OpenSavFileStepProps`, `UseOpenSavFileLogicProps`, `UseOpenSavFileLogicOutput`)

## Structure within the Module

-   `index.tsx`: Contains the main `OpenSavFileModal` and the internal `OpenSavFileStep` component.
-   `types.ts`: Defines all TypeScript interfaces related to the component and its hook.
-   `hooks/`: Contains `useOpenSavFileLogic.ts`.
-   `services/`: May contain services for actual `.sav` file parsing if this logic is complex and separated (e.g., interacting with a backend or a WebAssembly SPSS reader).
