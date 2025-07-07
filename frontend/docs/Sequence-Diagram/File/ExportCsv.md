### **Sequence Diagram: Export to CSV**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja fitur ekspor data ke format CSV.

---

### 1. Alur Proses Ekspor ke CSV

Diagram ini menunjukkan interaksi antara komponen UI, hook, utilitas, dan state management saat pengguna mengekspor data.

```mermaid
sequenceDiagram
    title: Alur Proses Ekspor Data ke CSV
    actor User

    box "Frontend Components"
        participant View as "ExportCsv (View)<br>/Modals/File/ExportCsv/index.tsx"
        participant Hook as "useExportCsv<br>/Modals/File/ExportCsv/hooks/useExportCsv.ts"
        participant Utils as "exportCsvUtils<br>/Modals/File/ExportCsv/utils/exportCsvUtils.ts"
    end

    box "Zustand Stores"
        participant DataStore as "useDataStore"
        participant VarStore as "useVariableStore"
    end
    
    box "Browser APIs"
        participant Browser
    end

    User->>+View: Buka modal "Export to CSV"
    View->>+Hook: Inisialisasi hook `useExportCsv`
    Hook-->>-View: Mengembalikan state awal (opsi ekspor)
    View-->>User: Tampilkan modal dengan opsi

    loop Pengguna mengubah opsi
        User->>View: Ubah nama file atau opsi lainnya
        View->>+Hook: Panggil `handleChange()` atau `handleFilenameChange()`
        Hook->>Hook: Perbarui state `exportOptions`
        Hook-->>-View: Kembalikan state yang diperbarui
        deactivate Hook
    end

    User->>View: Klik tombol "Export"
    View->>+Hook: Panggil `handleExport()`
    Hook->>DataStore: Ambil data dari store
    DataStore-->>Hook: Kembalikan data
    Hook->>VarStore: Ambil variabel dari store
    VarStore-->>Hook: Kembalikan variabel
    
    Hook->>+Utils: Panggil `generateCsvContent(data, variables, options)`
    Utils-->>-Hook: Kembalikan konten string CSV
    
    Hook->>+Browser: Buat `new Blob([csvContent])`
    Browser-->>-Hook: Blob object
    Hook->>+Browser: Panggil `URL.createObjectURL(blob)`
    Browser-->>-Hook: Object URL
    Hook->>+Browser: Buat elemen `<a>`, atur `href` & `download`, lalu klik
    Browser-->>User: Munculkan dialog unduh file
    deactivate Browser
    Hook->>+Browser: Panggil `URL.revokeObjectURL(url)`
    deactivate Browser
    
    Hook->>View: Panggil `closeModal()` (via `useModal`)
    deactivate Hook
    View-->>-User: Tutup modal
    deactivate View
``` 