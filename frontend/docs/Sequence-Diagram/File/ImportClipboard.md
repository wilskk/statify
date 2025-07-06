### **Sequence Diagram: Import from Clipboard**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja dua tahap untuk fitur impor data dari clipboard.

---

### 1. Tahap 1: Paste Data

Diagram ini menunjukkan bagaimana pengguna memulai proses impor, menempelkan data (baik melalui tombol atau manual), dan melanjutkan ke tahap konfigurasi.

```mermaid
sequenceDiagram
    title: Alur Proses Import dari Clipboard - Tahap 1: Paste Data
    actor User

    box "Frontend"
        participant Modal as "ImportClipboardModal<br>/Modals/File/ImportClipboard/index.tsx"
        participant Logic as "useImportClipboardLogic<br>.../hooks/useImportClipboardLogic.ts"
        participant View as "PasteStep<br>.../components/ImportClipboardPasteStep.tsx"
        participant Service as "ClipboardService<br>.../services/services.ts"
    end

    User->>+Modal: Buka modal "Import from Clipboard"
    Modal->>+Logic: Inisialisasi hook, atur `stage: 'paste'`
    Logic-->>-Modal: Kembalikan state
    Modal->>+View: Render komponen PasteStep
    View-->>-User: Tampilkan UI untuk paste

    alt "Paste via Button"
        User->>View: Klik tombol "Paste from Clipboard"
        View->>+Service: Panggil `readTextFromClipboard()`
        Service-->>-View: Kembalikan teks dari clipboard
        View->>+Logic: Panggil `handleTextPaste(text)`
        Logic-->>-View: Perbarui state `pastedText`
        deactivate Logic
    else "Manual Paste (Ctrl+V)"
        User->>View: Paste teks ke Textarea
        View->>+Logic: Panggil `handleTextPaste(text)`
        Logic-->>-View: Perbarui state `pastedText`
        deactivate Logic
    end

    User->>View: Klik tombol "Continue"
    View->>+Logic: Panggil `handleContinueToConfigure()`
    Logic->>Logic: Atur `stage: 'configure'`
    Logic-->>-Modal: Perbarui state, memicu render ulang
    deactivate Logic
    deactivate View
    deactivate Modal
```

---

### 2. Tahap 2: Konfigurasi & Impor

Setelah data ditempel, diagram ini menjelaskan bagaimana pengguna mengonfigurasi opsi parsing, melihat pratinjau, dan akhirnya mengimpor data ke dalam aplikasi.

```mermaid
sequenceDiagram
    title: Alur Proses Import dari Clipboard - Tahap 2: Konfigurasi & Impor
    actor User

    box "Frontend"
        participant Modal as "ImportClipboardModal<br>/Modals/File/ImportClipboard/index.tsx"
        participant Logic as "useImportClipboardLogic<br>.../hooks/useImportClipboardLogic.ts"
        participant View as "ConfigStep<br>.../components/ImportClipboardConfigurationStep.tsx"
        participant Processor as "useImportClipboardProcessor<br>.../hooks/useImportClipboardProcessor.ts"
        participant Stores as "Zustand Stores"
    end
    
    Modal->>+View: Render ConfigStep dengan `pastedText`
    View->>+Processor: Panggil `excelStyleTextToColumns()` untuk preview awal
    Processor-->>-View: Kembalikan `previewData`
    View-->>User: Tampilkan UI konfiguasi & preview data

    loop Pengguna mengubah opsi
        User->>View: Ubah delimiter, header, dll.
        View->>+Processor: Panggil `excelStyleTextToColumns()` dengan opsi baru
        Processor-->>-View: Kembalikan `previewData` yang diperbarui
        View-->>User: Update tampilan preview
    end

    User->>View: Klik tombol "Import"
    View->>+Processor: Panggil `processClipboardData(text, options)`
    Processor->>Processor: Proses teks menjadi data terstruktur
    Processor->>+Stores: Panggil `setData()` & `overwriteVariables()`
    Stores-->>-Processor: Selesai memperbarui state
    Processor-->>-View: Proses impor selesai
    
    View->>Logic: Panggil `onClose()` (dari props)
    Logic->>Modal: Panggil `handleModalClose()`
    deactivate View
    deactivate Processor
    Modal-->>User: Tutup modal
``` 