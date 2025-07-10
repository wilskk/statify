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

Diagram ini merinci proses yang terjadi setelah pengguna mengklik "OK". Ini mencakup pengelompokan data, penghitungan nilai agregat, pembuatan variabel baru, dan pembaruan data di grid dalam satu operasi batch.

```mermaid
sequenceDiagram
    title: Alur Proses Agregasi Data
    actor User

    box "Frontend Components"
        participant View as "AggregateModal<br>.../Aggregate/index.tsx"
        participant Hook as "useAggregateData<br>.../hooks/useAggregateData.ts"
        participant Utils as "aggregateUtils.ts"
    end

    box "Zustand Stores"
        participant VarStore as "useVariableStore"
        participant ModalStore as "useModalStore"
    end

    User->>+View: Klik tombol "OK"
    View->>+Hook: handleConfirm(closeModal)
    Hook->>+ModalStore: setStatisticProgress(true)
    deactivate ModalStore
    
    Hook->>Hook: Mengelompokkan data & menyiapkan array `newVariables` & `bulkUpdates`
    
    loop untuk setiap aggregatedVariable & grup
        Hook->>+Utils: calculateAggregateValue(...)
        Utils-->>-Hook: aggregatedValue
        Hook->>Hook: Mengisi array `newVariables` & `bulkUpdates`
    end

    alt jika "Number of cases" dicentang
        Hook->>Hook: Menambahkan variabel N_BREAK ke `newVariables` & `bulkUpdates`
    end

    note right of Hook: Semua definisi variabel baru & pembaruan sel dikumpulkan.

    Hook->>+VarStore: addVariables(newVariables, bulkUpdates)
    note right of VarStore: Operasi batch untuk menambah variabel<br>dan memperbarui semua sel terkait.
    deactivate VarStore
    
    Hook->>+ModalStore: setStatisticProgress(false)
    deactivate ModalStore
    Hook-->>-View: closeModal()
    deactivate Hook
``` 