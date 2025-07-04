### **Sequence Diagram: Restructure Data**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja fitur "Restructure Data", yang diimplementasikan sebagai wizard multi-langkah.

---

### 1. Alur Proses Wizard Restructure Data

Diagram ini mengilustrasikan alur interaksi pengguna melalui berbagai langkah wizard, validasi per langkah, dan proses akhir yang mentransformasi data dan skema variabel.

```mermaid
sequenceDiagram
    title: Alur Proses Wizard Restructure Data
    actor User

    box "Frontend Components"
        participant UI as "RestructureUI<br>.../Restructure/RestructureUI.tsx"
    end
    
    box "Hooks & Services"
        participant Hook as "useRestructure<br>.../hooks/useRestructure.ts"
        participant Service as "restructureService<br>.../services/restructureService.ts"
    end
    
    box "Zustand Stores"
        participant VarStore as "useVariableStore"
        participant DataStore as "useDataStore"
    end

    User->>+UI: Buka wizard "Restructure Data"
    UI->>+Hook: Inisialisasi hook
    Hook->>+VarStore: Get variables
    deactivate VarStore
    Hook-->>-UI: Return state awal (Langkah 1)
    UI-->>User: Tampilkan pilihan metode

    User->>UI: Pilih metode & klik "Next"
    UI->>+Hook: handleNext()
    Hook->>Hook: Validasi Langkah 1
    Hook-->>-UI: Return state untuk Langkah 2
    UI-->>User: Tampilkan pemilihan variabel

    User->>UI: Pilih variabel & klik "Next"
    UI->>+Hook: handleNext()
    Hook->>Hook: Validasi Langkah 2
    Hook-->>-UI: Return state untuk Langkah 3
    UI-->>User: Tampilkan Opsi

    User->>UI: Konfigurasi opsi & klik "Finish"
    UI->>+Hook: handleFinish()
    Hook->>Hook: Validasi Langkah 3
    Hook->>+Service: restructureData(data, vars, config)
    Service->>Service: Melakukan transformasi data
    Service-->>-Hook: Return { newData, newVariables }
    deactivate Service

    Hook->>+DataStore: setData(newData)
    deactivate DataStore

    Hook->>+VarStore: overwriteVariables(newVariables)
    deactivate VarStore

    Hook->>UI: onClose()
    deactivate Hook
    deactivate UI
``` 