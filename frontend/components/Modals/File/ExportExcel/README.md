# Fitur Modal: Ekspor ke Excel

Dokumen ini memberikan ringkasan teknis untuk fitur **Ekspor ke Excel**, mengikuti panduan arsitektur utama untuk komponen modal.

## 1. Ringkasan Fungsionalitas

Fitur ini memungkinkan pengguna untuk mengekspor dataset aktif ke dalam file Microsoft Excel (`.xlsx` atau `.xls`). Pengguna dapat mengonfigurasi beberapa aspek dari file yang dihasilkan melalui sebuah antarmuka (UI), termasuk:

-   Nama file kustom.
-   Format file (XLSX atau XLS).
-   Penyertaan nama variabel sebagai header.
-   Penyertaan sheet tambahan untuk properti variabel dan metadata file.
-   Opsi styling dasar untuk header.
-   Representasi data yang hilang.

## 2. Struktur Direktori & Tanggung Jawab

Struktur fitur ini dirancang sesuai dengan *feature-sliced design* yang diamanatkan.

-   **`/` (Root)**
    -   **`index.tsx`**: **Orchestrator**. Komponen utama yang merakit UI. Komponen ini tidak mengandung logika bisnis, tetapi menyambungkan state dan *handler* dari `useExportExcelLogic` ke elemen-elemen UI. Juga bertanggung jawab untuk mengelola fitur *tour* interaktif.
    -   **`types.ts`**: Mendefinisikan semua tipe dan *interface* TypeScript yang digunakan dalam fitur ini (`ExportExcelProps`, `ExportExcelLogicState`, dll.).
    -   **`README.md`**: (File ini) Dokumentasi ini.

-   **`hooks/`**
    -   **`useExportExcelLogic.ts`**: **Jantung Logika**. Hook ini mengelola semua *state management* (nama file, opsi ekspor) dan logika inti. Ia berinteraksi dengan *store* Zustand untuk mengambil data, memvalidasi, dan memicu proses ekspor.

-   **`utils/`**
    -   **`excelExporter.ts`**: Berisi fungsi murni (`pure function`) `generateExcelWorkbook` yang bertanggung jawab untuk membangun objek *workbook* Excel dari data mentah menggunakan pustaka `xlsx`.
    -   **`constants.ts`**: Menyimpan konstanta statis seperti format Excel yang didukung dan konfigurasi untuk opsi-opsi di UI.

## 3. Alur Kerja (Workflow)

1.  **Inisialisasi**: Pengguna membuka modal. `index.tsx` dirender, dan `useExportExcelLogic` menginisialisasi *state* dengan nilai *default* (misalnya, mengambil nama file dari `metaStore`).
2.  **Konfigurasi**: Pengguna berinteraksi dengan UI (mengubah nama file, mencentang opsi). Setiap perubahan memanggil *handler* dari `useExportExcelLogic` untuk memperbarui *state*.
3.  **Eksekusi**: Pengguna menekan tombol "Ekspor".
    -   Fungsi `handleExport` di dalam *hook* dipanggil.
    -   *Hook* mengambil data terbaru dari `useDataStore`, `useVariableStore`, dan `useMetaStore`.
    -   Jika data tidak ada, eksekusi berhenti dan *toast* notifikasi error ditampilkan.
    -   Data dan opsi diteruskan ke utilitas `generateExcelWorkbook`.
    -   Fungsi utilitas mengembalikan objek *workbook* `xlsx`.
    -   *Hook* memanggil `XLSX.writeFile` untuk membuat file dan memicu unduhan di browser.
4.  **Feedback**: *Toast* notifikasi (sukses atau gagal) ditampilkan kepada pengguna. Modal ditutup jika ekspor berhasil.

## 4. Properti Komponen (`ExportExcelProps`)

Komponen `ExportExcel` menerima properti berikut dari `ModalRenderer`:

-   `onClose: () => void`: **(Wajib)** Fungsi *callback* yang dipanggil untuk menutup modal.
-   `containerType?: "dialog" | "sidebar"`: **(Opsional)** Menentukan konteks render (dialog atau sidebar), yang digunakan untuk menyesuaikan tata letak dan perilaku, terutama untuk fitur *tour*.

## 5. Ketergantungan Utama (Dependencies)

-   **Internal**:
    -   Zustand Stores (`useDataStore`, `useVariableStore`, `useMetaStore`) untuk akses data.
    -   `@/hooks/use-toast` untuk menampilkan notifikasi.
    -   Komponen UI dari `@/components/ui/*`.
-   **Eksternal**:
    -   `xlsx`: Untuk logika inti pembuatan file Excel.
    -   `framer-motion`: Untuk animasi pada UI, khususnya pada *tour* dan *highlight*.

```tsx
import ExportExcel from "./ExportExcel"; // Adjust path as necessary

// Example usage:
const MyDataPage = () => {
    const handleCloseExcelExport = () => {
        console.log("Export Excel dialog closed");
        // Logic to hide the export UI
    };

    return (
        <ExportExcel
            onClose={handleCloseExcelExport}
            containerType="dialog"
        />
    );
};
```

## Dependencies

- React
- `@/components/ui/button`
- `@/components/ui/checkbox`
- `@/components/ui/label`
- `@/components/ui/input`
- `@/components/ui/select`
- `@/components/ui/tooltip`
- `lucide-react` (for icons like `Loader2`, `HelpCircle`)
- `./hooks/useExportExcelLogic` (custom hook for managing export state and logic)
- `./utils/constants` (for `EXCEL_FORMATS`, `EXCEL_OPTIONS_CONFIG`)
- `./types` (for `ExportExcelProps` and related TypeScript interfaces)

## Structure

- `index.tsx`: The main React component for the UI.
- `types.ts`: TypeScript definitions for props, state, and options.
- `hooks/`: Contains `useExportExcelLogic.ts` which encapsulates the business logic.
- `utils/`: Contains `constants.ts` defining available Excel formats and configuration for checkbox options. May also include other utility functions.
- `services/`: Potentially for services related to data preparation or the actual Excel file generation, if not handled directly in the hook or a utility.
- `components/`: Could house sub-components if the UI were more complex, though in the current structure, most UI elements are directly in `index.tsx`. 