# Kategori Modal File

> **Peringatan:** Arsitektur untuk semua modal di bawah kategori ini diatur oleh [Panduan Arsitektur Utama Modal](../README.md). Dokumen ini hanya berfungsi sebagai ringkasan kategori.

## Tujuan

Direktori ini berisi semua fitur modal yang berhubungan dengan **operasi file dan data I/O (Input/Output)**. Ini mencakup impor data dari berbagai format, ekspor data, dan membuka format file asli.

## Daftar Fitur

-   `ImportCsv`: Mengimpor data dari file `.csv`.
-   `ImportExcel`: Mengimpor data dari file `.xls` atau `.xlsx`.
-   `ImportClipboard`: Mengimpor data dari clipboard.
-   `ExportCsv`: Mengekspor dataset saat ini ke format `.csv`.
-   `ExportExcel`: Mengekspor dataset saat ini ke format `.xlsx`.
-   `ExampleDataset`: Menampilkan dataset contoh.
-   `OpenSavFile`: Membuka file berformat SPSS (`.sav`).
-   `Print`: Mencetak output atau data ke PDF.

## Registrasi Fitur

Semua modal dalam kategori ini didaftarkan melalui `FileRegistry.tsx`, yang kemudian digabungkan ke dalam sistem modal utama.

---

## 🧪 Unit Testing – Test Suite Index

This section serves as the single entry-point for every **Jest & React-Testing-Library** test that lives inside `components/Modals/File/*`.  If you need to locate where a particular File-modal feature is validated—​or where to place new coverage—​start here.

### 🗂️ Directory Map

```text
components/Modals/File/
├─ ImportCsv/
│  └─ __tests__/
├─ ImportExcel/
│  └─ __tests__/
├─ ImportClipboard/
│  └─ __tests__/
├─ ExportCsv/
│  └─ __tests__/
├─ ExportExcel/
│  └─ __tests__/
├─ ExampleDataset/
│  └─ __tests__/
├─ OpenSavFile/
│  └─ __tests__/
└─ Print/
   └─ __tests__/
```

Each `__tests__` folder follows a common convention:

1. **Component tests** target the orchestrator / UI surface.
2. **Hook tests** isolate business logic & state management.
3. **Utility / Worker tests** validate pure helpers or off-thread code.

---

### 📥 ImportCsv
Location: `ImportCsv/__tests__/`

| File | Focus |
|------|-------|
| `index.test.tsx` | Orchestrator UI – stage switching, file selection → configuration flow, button states. |
| `useImportCsvFileReader.test.ts` | Hook – FileReader handling, loading / error states. |
| `useImportCsvProcessor.test.ts` | Hook – worker orchestration, store population. |
| `useCsvWorker.test.ts` | Hook – Promise state (processing / error). |
| `importCsv.utils.test.ts` *(optional)* | Pure CSV parsing helpers. |

---

### 📥 ImportExcel
Location: `ImportExcel/__tests__/`

| File | Focus |
|------|-------|
| `ImportExcelSelectionStep.test.tsx` | UI – file chooser interactions, validation errors. |
| `ImportExcelConfigurationStep.test.tsx` | UI – worksheet & range selection, option toggles. |
| `useImportExcelLogic.test.ts` | Hook – state transitions, validation, store writes. |
| `useExcelWorker.test.ts` | Hook – worker lifecycle, progress & error handling. |
| `importExcel.utils.test.ts` | Utility – workbook parsing helpers. |

---

### 📋 ImportClipboard
Location: `ImportClipboard/__tests__/`

| File | Focus |
|------|-------|
| `ImportClipboardPasteStep.test.tsx` | UI – paste interaction, textarea behaviours. |
| `ImportClipboardConfigurationStep.test.tsx` | UI – delimiter & header detection settings. |
| `useImportClipboardLogic.test.ts` | Hook – text handling, validation, stage switching. |
| `useImportClipboardProcessor.test.ts` | Hook – worker call & store population. |
| `importClipboard.utils.test.ts` | Utility – TSV/CSV string parsing edge-cases. |
| `services.test.ts` | Service mocks – clipboard worker messaging. |

---

### 📤 ExportCsv
Location: `ExportCsv/__test__/`

| File | Focus |
|------|-------|
| `index.test.tsx` | UI – form rendering, option toggles, disabled / loading states. |
| `useExportCsv.test.ts` | Hook – option state, validation, export flow. |
| `exportCsvUtils.test.ts` | Utility – `generateCsvContent` formatting correctness. |

---

### 📤 ExportExcel
Location: `ExportExcel/__tests__/`

| File | Focus |
|------|-------|
| `ExportExcel.test.tsx` | UI – main modal rendering, option handling. |
| `useExportExcelLogic.test.ts` | Hook – state, validation, XLSX generation orchestration. |
| `excelExporter.test.ts` | Service – workbook creation & file writing via `xlsx`. |

---

### 📚 ExampleDataset
Location: `ExampleDataset/__tests__/`

| File | Focus |
|------|-------|
| `ExampleDatasetModal.test.tsx` | UI – list rendering, dataset selection, loading & error overlays, cancel flow. |
| `useExampleDatasetLogic.test.ts` | Hook – dataset loading orchestration, store updates, meta handling, error states. |
| `services.test.ts` *(optional)* | Service – network fetch & upload logic. |

---

### 📄 OpenSavFile
Location: `OpenSavFile/__tests__/`

| File | Focus |
|------|-------|
| `OpenSavFileModal.test.tsx` | UI – file selection, validation, OK/Cancel flow. |
| `useOpenSavFileLogic.test.ts` | Hook – file reading, worker calls, error handling. |

---

### 🖨️ Print
Location: `Print/__tests__/`

| File | Focus |
|------|-------|
| `usePrintLogic.test.ts` | Hook – state management & PDF flow orchestration. |
| `pdfPrintService.test.ts` | Service – section rendering, jsPDF calls. |
| `print.utils.test.ts` | Utility – table data transformation helpers. |

---

### Adding New Tests
1. Create the test file inside the appropriate feature's `__tests__` directory.
2. Update the **feature-specific README** *and* **this central index** so others can find it quickly.

---

_Last updated: <!-- KEEP THIS COMMENT: the CI tool replaces it with commit SHA & date -->_
