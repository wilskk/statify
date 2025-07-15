### **Sequence Diagram: Define Variable Properties**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja fitur "Define Variable Properties", sebuah wizard dua langkah untuk memindai dan mengedit properti variabel.

---

### 1. Alur Proses Wizard Define Variable Properties

Diagram ini menunjukkan seluruh alur kerja, mulai dari pemilihan variabel untuk dipindai (Langkah 1) hingga pengeditan properti dan penyimpanan perubahan (Langkah 2).

```mermaid
sequenceDiagram
    title: Alur Proses Wizard Define Variable Properties
    actor User

    box "Frontend Components"
        participant Wrapper as "DefineVariableProps<br>.../index.tsx"
        participant ScanUI as "VariablesToScan<br>.../VariablesToScan.tsx"
        participant EditorUI as "PropertiesEditor<br>.../PropertiesEditor.tsx"
    end

    box "Hooks & Services"
        participant MainHook as "useDefineVarProps<br>.../hooks/useDefineVarProps.ts"
        participant ScanHook as "useVariablesToScan<br>.../hooks/useVariablesToScan.ts"
        participant EditorHook as "usePropertiesEditor<br>.../hooks/usePropertiesEditor.ts"
        participant Service as "variablePropertiesService<br>.../services/variablePropertiesService.ts"
    end

    box "Zustand Stores"
        participant VarStore as "useVariableStore"
        participant DataStore as "useDataStore"
    end

    User->>+Wrapper: Buka modal
    Wrapper->>+MainHook: Inisialisasi hook utama
    MainHook-->>-Wrapper: currentStep = "scan"
    Wrapper->>+ScanUI: Render Langkah 1

    ScanUI->>+ScanHook: Inisialisasi hook pemindaian
    ScanHook->>+VarStore: Get variables
    deactivate VarStore
    ScanHook-->>-ScanUI: Mengembalikan state awal
    ScanUI-->>User: Tampilkan UI pemilihan variabel

    User->>ScanUI: Pilih variabel & klik "Continue"
    ScanUI->>+MainHook: onContinue(selectedVars)
    MainHook->>MainHook: Set selected variables
    MainHook-->>-Wrapper: currentStep = "editor"
    deactivate ScanUI
    deactivate ScanHook

    Wrapper->>+EditorUI: Render Langkah 2
    EditorUI->>+EditorHook: Inisialisasi hook editor
    EditorHook->>+Service: getUniqueValuesWithCounts(...)
    Service->>+DataStore: Get data for unique values
    deactivate DataStore
    Service-->>-EditorHook: unique values
    EditorHook-->>-EditorUI: Mengembalikan state awal
    EditorUI-->>User: Tampilkan editor properti

    User->>EditorUI: Ubah properti (misal: Value Labels) & klik "Paste"
    EditorUI->>+EditorHook: handleSave()
    EditorHook->>+Service: saveVariableProperties(modified, original)
    loop untuk setiap variabel yang diubah
        Service->>+VarStore: updateVariable(variable)
        deactivate VarStore
    end
    Service-->>-EditorHook
    deactivate Service

    EditorHook->>EditorUI: onSave()
    deactivate EditorHook
    EditorUI->>Wrapper: onClose()
    deactivate EditorUI
    deactivate Wrapper
    deactivate MainHook
``` 