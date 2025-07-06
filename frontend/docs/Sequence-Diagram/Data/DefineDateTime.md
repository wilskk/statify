### **Sequence Diagram: Define Date and Time**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja fitur "Define Date and Time", yang digunakan untuk membuat variabel tanggal dan waktu secara otomatis.

---

### 1. Alur Proses Pembuatan Variabel Tanggal

Diagram ini menunjukkan bagaimana interaksi pengguna dalam dialog memicu pembuatan metadata, definisi variabel baru, dan pengisian data sel terkait.

```mermaid
sequenceDiagram
    title: Alur Proses Pembuatan Variabel Tanggal & Waktu
    actor User

    box "Frontend"
        participant Modal as "DefineDateTime<br>.../DefineDateTime/index.tsx"
        participant Hook as "useDefineDateTime<br>.../hooks/useDefineDateTime.ts"
        participant Service as "dateTimeService<br>.../services/dateTimeService.ts"
        participant Utils as "dateTimeFormatters<br>.../utils/dateTimeFormatters.ts"
    end

    box "Zustand Stores"
        participant MetaStore as "useMetaStore"
        participant VarStore as "useVariableStore"
        participant DataStore as "useDataStore"
    end

    User->>+Modal: Buka modal "Define Dates"
    Modal->>+Hook: Inisialisasi hook
    Hook-->>-Modal: Mengembalikan state awal
    Modal-->>User: Menampilkan dialog

    User->>Modal: Pilih format tanggal & atur nilai awal
    User->>Modal: Klik tombol "OK"

    Modal->>+Hook: handleOk()
    
    alt Jika "Not dated" dipilih
        Hook->>+VarStore: resetVariables()
        deactivate VarStore
        Hook->>+MetaStore: setMeta({ dates: "" })
        deactivate MetaStore
    else
        Hook->>+Utils: formatDateForMetaStore()
        Utils-->>-Hook: dateString
        
        Hook->>+MetaStore: setMeta({ dates: dateString })
        deactivate MetaStore

        Hook->>+Service: prepareDateVariables(timeComponents, ...)
        Service->>Service: Membuat definisi variabel baru
        Service->>+Utils: generateSampleData()
        Utils-->>-Service: cellUpdates
        Service-->>-Hook: Mengembalikan { variablesToCreate, cellUpdates }
        deactivate Service

        loop untuk setiap variabel baru
            Hook->>+VarStore: addVariable(variable)
            deactivate VarStore
        end

        Hook->>+DataStore: updateCells(cellUpdates)
        deactivate DataStore
    end

    Hook->>Modal: onClose()
    deactivate Hook
    deactivate Modal
``` 