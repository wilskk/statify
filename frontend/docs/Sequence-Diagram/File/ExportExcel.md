### **Sequence Diagram: Export to Excel**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja fitur ekspor data ke format Excel.

---

### 1. Alur Proses Ekspor ke Excel

Diagram ini menunjukkan interaksi antara komponen UI, hook, utilitas, dan pustaka eksternal saat pengguna mengekspor data.

```mermaid
sequenceDiagram
    title: Alur Proses Ekspor Data ke Excel
    actor User

    box "Frontend Components"
        participant View as "ExportExcel (View)<br>/Modals/File/ExportExcel/index.tsx"
        participant Hook as "useExportExcelLogic<br>/Modals/File/ExportExcel/hooks/useExportExcelLogic.ts"
        participant Utils as "excelExporter<br>/Modals/File/ExportExcel/utils/excelExporter.ts"
    end

    box "Zustand Stores"
        participant DataStore as "useDataStore"
        participant VarStore as "useVariableStore"
        participant MetaStore as "useMetaStore"
    end
    
    box "External Library"
        participant XLSX
    end

    User->>+View: Buka modal "Export to Excel"
    View->>+Hook: Inisialisasi hook `useExportExcelLogic`
    Hook->>MetaStore: Ambil `meta.name` untuk nama file awal
    MetaStore-->>Hook: Kembalikan metadata
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
    Hook->>DataStore: Ambil data
    DataStore-->>Hook: Kembalikan data
    Hook->>VarStore: Ambil variabel
    VarStore-->>Hook: Kembalikan variabel
    Hook->>MetaStore: Ambil metadata
    MetaStore-->>Hook: Kembalikan metadata
    
    Hook->>+Utils: Panggil `generateExcelWorkbook(data, vars, meta, options)`
    Utils-->>-Hook: Kembalikan objek `workbook`
    
    Hook->>+XLSX: Panggil `XLSX.writeFile(workbook, filename)`
    Note right of XLSX: Pustaka menangani pembuatan file<br>dan memicu unduhan di browser.
    XLSX-->>User: Munculkan dialog unduh file
    deactivate XLSX
    
    Hook->>View: Panggil `onClose()`
    deactivate Hook
    View-->>-User: Tutup modal
    deactivate View
``` 