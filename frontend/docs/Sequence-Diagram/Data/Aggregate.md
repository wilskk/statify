### **Sequence Diagram: Aggregate Data**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja fitur "Aggregate Data", mulai dari konfigurasi hingga pemrosesan akhir.

---

### 1. Alur Proses Konfigurasi Variabel Agregat

Diagram ini menunjukkan bagaimana pengguna mengonfigurasi fungsi, nama, dan label untuk variabel agregat baru melalui dialog-dialog yang tersedia.

```mermaid
sequenceDiagram
    title: Alur Proses Konfigurasi Variabel Agregat
    actor User

    box "Frontend Components"
        participant View as "VariablesTab<br>.../Aggregate/VariablesTab.tsx"
        participant Hook as "useAggregateData<br>.../hooks/useAggregateData.ts"
        participant FuncDlg as "FunctionDialog<br>.../dialogs/FunctionDialog.tsx"
        participant NameDlg as "NameLabelDialog<br>.../dialogs/NameLabelDialog.tsx"
    end

    User->>+View: Pilih variabel agregat & klik "Function..."
    View->>+Hook: handleFunctionClick()
    Hook->>Hook: setCurrentEditingVariable()
    Hook-->>+FuncDlg: Buka dialog dengan data var
    deactivate Hook

    User->>FuncDlg: Pilih fungsi & klik "Continue"
    FuncDlg->>+Hook: applyFunction()
    Hook->>Hook: Memperbarui state `aggregatedVariables`
    deactivate Hook
    FuncDlg-->>-View: Tutup dialog & update tampilan
    deactivate FuncDlg

    User->>+View: Pilih variabel agregat & klik "Name & Label..."
    View->>+Hook: handleNameLabelClick()
    Hook->>Hook: setCurrentEditingVariable()
    Hook-->>+NameDlg: Buka dialog dengan data var
    deactivate Hook

    User->>NameDlg: Ubah nama/label & klik "Continue"
    NameDlg->>+Hook: applyNameLabel()
    Hook->>Hook: Memperbarui state `aggregatedVariables`
    deactivate Hook
    NameDlg-->>-View: Tutup dialog & update tampilan
    deactivate NameDlg
```

---

### 2. Alur Proses Agregasi Data

Diagram ini merinci proses yang terjadi setelah pengguna mengklik "OK". Ini mencakup pengelompokan data, penghitungan nilai agregat, pembuatan variabel baru, dan pembaruan data di grid.

```mermaid
sequenceDiagram
    title: Alur Proses Agregasi Data
    actor User

    box "Frontend Components"
        participant View as "AggregateModal<br>.../Aggregate/index.tsx"
        participant Hook as "useAggregateData<br>.../hooks/useAggregateData.ts"
        participant Utils as "Utils.ts<br>.../Aggregate/Utils.ts"
    end

    box "Zustand Stores"
        participant VarStore as "useVariableStore"
        participant DataStore as "useDataStore"
        participant ModalStore as "useModalStore"
    end

    User->>+View: Klik tombol "OK"
    View->>+Hook: handleConfirm(closeModal)
    Hook->>+ModalStore: setStatisticProgress(true)
    deactivate ModalStore
    
    Hook->>Hook: Mengelompokkan data dari DataStore
    
    loop untuk setiap aggregatedVariable
        Hook->>+Utils: calculateAggregateValue(func, values, opts)
        Utils-->>-Hook: aggregatedValue
        
        Hook->>+VarStore: addVariable(newAggregatedVariable)
        deactivate VarStore
    end

    alt jika "Number of cases" dicentang
        Hook->>+VarStore: addVariable(nCasesVariable)
        deactivate VarStore
    end

    Hook->>+DataStore: updateCells(bulkUpdates)
    deactivate DataStore
    
    Hook->>+ModalStore: setStatisticProgress(false)
    deactivate ModalStore
    Hook-->>-View: closeModal()
    deactivate Hook
``` 