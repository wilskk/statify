### **Sequence Diagram: Sort Variables**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja fitur "Sort Variables", yang memungkinkan pengguna untuk mengurutkan kolom data berdasarkan atribut variabel (misalnya, nama, jenis, label).

---

### 1. Alur Proses Pengurutan Variabel

Diagram ini menunjukkan bagaimana pengguna memilih kriteria pengurutan, yang kemudian digunakan untuk mengurutkan ulang definisi variabel di `VariableStore` dan kolom data di `DataStore`.

```mermaid
sequenceDiagram
    title: Alur Proses Pengurutan Variabel (Kolom)
    actor User

    box "Frontend Components"
        participant UI as "SortVarsUI<br>.../SortVars/SortVarsUI.tsx"
    end

    box "Hooks & Services"
        participant Hook as "useSortVariables<br>.../hooks/useSortVariables.ts"
        participant Service as "sortVarsService<br>.../services/sortVarsService.ts"
    end
    
    box "Zustand Stores"
        participant VarStore as "useVariableStore"
        participant DataStore as "useDataStore"
    end

    User->>+UI: Buka modal "Sort Variables"
    UI->>+Hook: Inisialisasi hook
    Hook-->>-UI: Return state awal
    UI-->>User: Tampilkan modal dengan atribut variabel

    User->>UI: Pilih kolom untuk diurutkan & urutan pengurutan
    UI->>+Hook: handleSelectColumn(...) & setSortOrder(...)
    Hook-->>-UI: Update UI dengan pilihan
    deactivate Hook

    User->>UI: Klik tombol "OK"
    UI->>+Hook: handleOk()

    Hook->>+VarStore: Get variables
    VarStore-->>-Hook: originalVariables
    
    Hook->>Hook: Mengurutkan array variabel berdasarkan kolom yang dipilih
    note right of Hook: Membuat `sortedVariables`

    Hook->>+VarStore: setVariables(sortedVariables)
    deactivate VarStore

    Hook->>+Service: sortDataColumns(data, originalVariables, sortedVariables)
    Service->>Service: Membuat pemetaan dan mengurutkan ulang kolom data
    Service-->>-Hook: Return newData
    deactivate Service

    Hook->>+DataStore: setData(newData)
    deactivate DataStore

    Hook->>UI: onClose()
    deactivate Hook
    deactivate UI
``` 