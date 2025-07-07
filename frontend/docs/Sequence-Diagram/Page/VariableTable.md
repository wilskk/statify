### **Sequence Diagrams: VariableTable**

Dokumentasi ini berisi diagram sekuens (sequence diagrams) yang menjelaskan alur kerja utama dan interaksi komponen dalam fitur `VariableTable` untuk mengelola metadata variabel.

---

### 1. Alur Proses Pengeditan Sel Sederhana

Diagram ini menunjukkan bagaimana perubahan pada sel input sederhana (seperti `Name` atau `Label`) diproses secara asinkron melalui antrean operasi untuk memastikan integritas data.

```mermaid
sequenceDiagram
    title: Alur Proses Pengeditan Sel Sederhana
    actor User

    box "Frontend Components"
        participant View as "VariableTable<br>/variable/components/variableTable/index.tsx"
        participant Events as "useVariableTableEvents<br>.../hooks/useVariableTableEvents.ts"
        participant Updates as "useVariableTableUpdates<br>.../hooks/useVariableTableUpdates.ts"
    end
    
    box "Zustand Stores"
        participant VarStore as "useVariableStore"
    end

    User->>+View: Mengedit sel (misal: "Name", "Label")
    View->>+Events: Memicu `handleBeforeChange(changes)`
    Events->>Events: Validasi perubahan
    Events->>+Updates: `enqueueOperation({ type: 'UPDATE_VARIABLE', payload })`
    
    deactivate Events
    deactivate View

    Note over Updates: Operasi ditambahkan ke antrean<br/>dan diproses secara asinkron.
    
    Updates->>Updates: `processPendingOperations()`
    loop Untuk setiap operasi dalam antrean
        Updates->>+VarStore: `updateMultipleFields(rowIndex, changes)`
    end
    
    deactivate Updates
    VarStore-->>View: Notifikasi perubahan state
```

---

### 2. Alur Proses Pengeditan via Dialog

Diagram berikut menjelaskan proses saat pengguna berinteraksi dengan sel yang memerlukan dialog (seperti `Type`, `Values`, `Missing`), yang juga menggunakan sistem antrean operasi.

```mermaid
sequenceDiagram
    title: Alur Proses Pengeditan via Dialog
    actor User

    box "Frontend Components"
        participant View as "VariableTable<br>.../variableTable/index.tsx"
        participant Events as "useVariableTableEvents<br>.../hooks/useVariableTableEvents.ts"
        participant Dialogs as "useVariableTableDialogs<br>.../hooks/useVariableTableDialogs.ts"
        participant DialogComp as "Dialog Component<br>.../dialog/VariableTypeDialog.tsx"
        participant Updates as "useVariableTableUpdates<br>.../hooks/useVariableTableUpdates.ts"
    end

    User->>+View: Memilih sel pemicu dialog (misal: "Type")
    View->>+Events: Memicu `handleAfterSelectionEnd()`
    Events->>+Dialogs: `openDialogForCell(row, col)`
    
    Dialogs->>Dialogs: Set state untuk menampilkan dialog<br>(misal: `setShowTypeDialog(true)`)
    
    Dialogs-->>View: State dialog diperbarui
    Note right of View: View me-render dialog yang sesuai
    
    View->>DialogComp: Muncul
    User->>DialogComp: Mengubah nilai & klik "OK"
    DialogComp-->>Dialogs: Memanggil handler onSave (misal: `handleTypeChange(payload)`)
    
    Dialogs->>+Updates: `enqueueOperation({ type: 'UPDATE_VARIABLE', ... })`
    Note right of Updates: Operasi ditambahkan ke antrean<br/>dan akan diproses (lihat alur pertama)
    deactivate Updates
    
    Dialogs->>Dialogs: Set state untuk menutup dialog<br>(misal: `setShowTypeDialog(false)`)
    
    deactivate Dialogs
    deactivate Events
    deactivate View
```

---

### 3. Alur Proses Aksi Menu Konteks

Diagram ini mengilustrasikan alur kerja saat pengguna menggunakan menu konteks untuk melakukan aksi seperti "Insert Variable", yang juga diantrekan untuk diproses.

```mermaid
sequenceDiagram
    title: Alur Proses Aksi Menu Konteks (Insert Variable)
    actor User

    box "Frontend Components"
        participant View as "VariableTable<br>.../variableTable/index.tsx"
        participant Logic as "useVariableTableLogic<br>.../hooks/useVariableTableLogic.ts"
        participant Events as "useVariableTableEvents<br>.../hooks/useVariableTableEvents.ts"
        participant Updates as "useVariableTableUpdates<br>.../hooks/useVariableTableUpdates.ts"
    end
    
    box "Zustand Stores"
        participant VarStore as "useVariableStore"
    end

    User->>+View: Klik kanan -> "Insert Variable"
    View->>+Logic: Memicu handler dari `contextMenu`
    Logic->>+Events: `handleInsertVariable()`
    
    Events->>+Updates: `enqueueOperation({ type: 'INSERT_VARIABLE', payload })`
    deactivate Events
    deactivate Logic
    deactivate View
    
    Note over Updates: Operasi ditambahkan ke antrean.
    
    Updates->>Updates: `processPendingOperations()`
    loop Untuk setiap operasi dalam antrean
        Updates->>+VarStore: Memanggil aksi store yang sesuai, misal: `insertVariableAt(index)`
    end
    
    deactivate Updates
    
    Note right of VarStore: Store menangani pembuatan variabel baru dan<br/>memperbarui state.
    
    VarStore-->>View: Notifikasi perubahan state
``` 