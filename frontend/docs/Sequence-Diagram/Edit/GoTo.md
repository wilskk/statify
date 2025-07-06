### **Sequence Diagram: Go To Case/Variable**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja untuk fitur "Go To Case/Variable".

---

### 1. Alur Proses Go To Case/Variable

Diagram ini menunjukkan bagaimana pengguna menavigasi ke baris (Case) atau kolom (Variable) tertentu dalam grid data.

```mermaid
sequenceDiagram
    title: Alur Proses Go To Case/Variable
    actor User

    box "Frontend Components"
        participant View as "GoToContent<br>.../components/GoToContent.tsx"
        participant Hook as "useGoToForm<br>.../hooks/useGoToForm.ts"
    end
    
    box "Zustand Stores & Refs"
        participant DataStore as "useDataStore"
        participant VarStore as "useVariableStore"
        participant TableRef as "useTableRefStore<br>(Handsontable Instance)"
    end

    User->>+View: Buka dialog "Go To"
    View->>+Hook: Inisialisasi hook
    Hook->>VarStore: Ambil `variables` untuk daftar kolom
    VarStore-->>Hook: Kembalikan variabel
    Hook->>DataStore: Ambil `data` untuk total kasus
    DataStore-->>Hook: Kembalikan data
    Hook-->>-View: Kembalikan state awal & handler
    View-->>User: Tampilkan UI

    alt "Go To Case"
        User->>View: Masukkan nomor kasus
        View->>+Hook: Panggil `handleCaseNumberChange(value)`
        Hook->>Hook: Validasi input terhadap total kasus
        Hook-->>-View: Perbarui state (misal: tampilkan error jika tidak valid)
        
        User->>View: Klik tombol "Go"
        View->>+Hook: Panggil `handleGo()`
        Hook->>Hook: Panggil `navigateToTarget('case')`
        Hook->>+TableRef: Dapatkan instance Handsontable
        TableRef-->>-Hook: Kembalikan instance
        Hook->>TableRef: Panggil `scrollViewportTo(rowIndex, 0)` & `selectRows(rowIndex)`
        Note right of TableRef: Menyorot seluruh baris
        deactivate Hook
    end

    alt "Go To Variable"
        User->>View: Pindah ke tab "Variable"
        View->>+Hook: Panggil `setActiveTab('variable')`
        deactivate Hook

        User->>View: Pilih variabel dari dropdown
        View->>+Hook: Panggil `handleSelectedVariableChange(varName)`
        deactivate Hook
        
        User->>View: Klik tombol "Go"
        View->>+Hook: Panggil `handleGo()`
        Hook->>Hook: Panggil `navigateToTarget('variable')`
        Hook->>VarStore: Dapatkan `columnIndex` dari variabel yang dipilih
        Hook->>+TableRef: Dapatkan instance Handsontable
        TableRef-->>-Hook: Kembalikan instance
        Hook->>TableRef: Panggil `scrollViewportTo(0, colIndex)` & `selectColumns(colIndex)`
        Note right of TableRef: Menyorot seluruh kolom
        deactivate Hook
    end
```

    User->>View: Click "Close"
    View->>-Hook: onClose()
    deactivate View
``` 