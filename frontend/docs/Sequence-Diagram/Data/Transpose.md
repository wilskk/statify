### **Sequence Diagram: Transpose Data**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja fitur "Transpose", yang mengubah baris data menjadi kolom dan sebaliknya.

---

### 1. Alur Proses Transposisi Data

Diagram ini menunjukkan bagaimana interaksi pengguna memicu layanan transposisi, yang menghasilkan data dan skema variabel yang sepenuhnya baru, yang kemudian digunakan untuk menimpa state di `DataStore` dan `VariableStore`.

```mermaid
sequenceDiagram
    title: Alur Proses Transposisi Data
    actor User

    box "Frontend Components"
        participant UI as "TransposeUI<br>.../Transpose/TransposeUI.tsx"
    end

    box "Hooks & Services"
        participant Hook as "useTranspose<br>.../hooks/useTranspose.ts"
        participant Service as "transposeService<br>.../services/transposeService.ts"
    end
    
    box "Zustand Stores"
        participant VarStore as "useVariableStore"
        participant DataStore as "useDataStore"
    end

    User->>+UI: Buka modal "Transpose Data"
    UI->>+Hook: Inisialisasi hook
    Hook->>+VarStore: Get variables
    deactivate VarStore
    Hook-->>-UI: Return state awal
    UI-->>User: Tampilkan modal

    User->>UI: Pilih variabel untuk ditransposisi
    User->>UI: (Opsional) Pilih 'Name Variable'
    User->>UI: Klik tombol "OK"

    UI->>+Hook: handleOk()
    Hook->>+DataStore: Get current data
    Hook->>+Service: transposeDataService(data, selectedVars, nameVar)
    Service-->>-Hook: Return { transposedData, finalTransposedVariables }
    deactivate Service
    deactivate DataStore

    Hook->>+DataStore: setData(transposedData)
    deactivate DataStore

    Hook->>+VarStore: overwriteVariables(finalTransposedVariables)
    deactivate VarStore

    Hook->>UI: onClose()
    deactivate Hook
    deactivate UI
``` 