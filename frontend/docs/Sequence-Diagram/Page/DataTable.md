### **Sequence Diagrams: DataTable**

Dokumentasi ini berisi diagram sekuens (sequence diagrams) yang menjelaskan alur kerja utama dan interaksi komponen dalam fitur `DataTable`.

---

### 1. Alur Proses Pengeditan Sel pada DataTable

Diagram ini menunjukkan bagaimana perubahan data oleh pengguna pada satu sel diproses dari antarmuka hingga disimpan dalam state management (Zustand), termasuk mekanisme *debouncing*.

```mermaid
sequenceDiagram
    title: Alur Proses Pengeditan Sel pada DataTable
    actor User
    
    box "Frontend Components"
        participant View as "DataTable (View)<br>/data/components/dataTable/index.tsx"
        participant Logic as "useDataTableLogic<br>/data/components/dataTable/hooks/useDataTableLogic.ts"
        participant Updates as "useTableUpdates<br>/data/components/dataTable/hooks/useTableUpdates.ts"
    end

    box "Zustand Stores"
        participant DataStore as "useDataStore"
    end

    User->>+View: Mengedit nilai sel di tabel
    View->>+Logic: Memicu event Handsontable `afterChange`
    
    Logic->>+Updates: Memanggil `handleAfterChange(changes, source)`
    
    Note over Updates: Source bukan 'loadData'
    Updates->>Updates: 1. `mapChangesToUpdates(changes)`
    Updates->>Updates: 2. `handleNewColumns()` jika perlu
    Updates->>Updates: 3. `applyTruncation(updates)`
    
    Note over Updates: `debouncedUpdateCells` dipanggil (debounce 100ms)
    Updates->>DataStore: 4. `updateCells(updates)`
    
    deactivate Updates
    deactivate Logic
    deactivate View
    
    DataStore->>DataStore: Memperbarui state `data`
    Note right of DataStore: UI akan re-render jika perlu
```

---

### 2. Alur Proses Penambahan Kolom Baru

Diagram berikut menjelaskan proses transaksional saat pengguna menambahkan kolom baru, yang melibatkan pembaruan pada `useVariableStore` dan `useDataStore`.

```mermaid
sequenceDiagram
    title: Alur Proses Penambahan Kolom Baru
    actor User
    
    box "Frontend Components"
        participant View as "DataTable (View)<br>/data/components/dataTable/index.tsx"
        participant ContextMenu as "useContextMenuLogic<br>/data/components/dataTable/hooks/useContextMenuLogic.ts"
        participant Service as "contextMenuService<br>/data/components/dataTable/services/contextMenuService.ts"
    end
    
    box "Zustand Stores"
        participant VarStore as "useVariableStore"
        participant DataStore as "useDataStore"
    end

    User->>+View: Klik kanan -> "Insert column"
    View->>+ContextMenu: Memicu `handleInsertColumn(isLeft)`
    ContextMenu->>ContextMenu: Menentukan index penyisipan
    ContextMenu->>+Service: Memanggil `insertColumn(index)`
    
    rect rgb(220, 220, 220)
        note over Service, DataStore: Transaksi Penambahan Kolom
        Service->>+VarStore: 1. `addVariable({ columnIndex })`
        VarStore-->>-Service: Variabel baru ditambahkan
        
        Service->>+DataStore: 2. `addColumns([index])`
        DataStore-->>-Service: Kolom baru ditambahkan
    end
    
    note over Service: Jika terjadi error, `finally` block<br/>akan melakukan rollback pada state.
    
    deactivate Service
    deactivate ContextMenu
    deactivate View

    VarStore-->>View: Notifikasi state update
    DataStore-->>View: Notifikasi state update
```

---

### 3. Alur Proses Menyisipkan Data ke Kolom Baru

Diagram ini mengilustrasikan logika saat pengguna melakukan *paste* data yang mencakup kolom-kolom baru. Sistem akan secara otomatis membuat variabel baru dengan tipe data yang diinferensi.

```mermaid
sequenceDiagram
    title: Alur Proses Menyisipkan Data ke Kolom Baru (Paste)
    actor User

    box "Frontend Components"
        participant View as "DataTable (View)<br>/data/components/dataTable/index.tsx"
        participant Logic as "useDataTableLogic<br>/data/components/dataTable/hooks/useDataTableLogic.ts"
        participant Updates as "useTableUpdates<br>/data/components/dataTable/hooks/useTableUpdates.ts"
    end
    
    box "Zustand Stores"
        participant VarStore as "useVariableStore"
        participant DataStore as "useDataStore"
    end

    User->>+View: Menyisipkan (paste) data ke area kolom baru
    View->>+Logic: Memicu event Handsontable `afterChange`
    Logic->>+Updates: Memanggil `handleAfterChange(changes)`
    
    activate Updates
    Updates->>Updates: 1. `mapChangesToUpdates(changes)`
    
    alt Jika ada kolom baru
        Updates->>Updates: 2. `handleNewColumns(updates)`
        activate Updates
        Updates->>Updates: Inferensi tipe & properti variabel baru
        Updates->>+VarStore: `addMultipleVariables(varsToAdd)`
        deactivate VarStore
        Updates->>+DataStore: `addColumns(newCols)`
        deactivate DataStore
        deactivate Updates
    end

    Updates->>Updates: 3. `applyTruncation(updates)`
    
    Note over Updates: `debouncedUpdateCells` dipanggil
    Updates->>DataStore: 4. `updateCells(updates)`
    
    deactivate Updates
    deactivate Logic
    deactivate View
    
    Note right of VarStore: Variabel baru ditambahkan
    Note right of DataStore: Kolom & sel baru diperbarui
``` 