### **Sequence Diagram: Set Measurement Level**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja fitur "Set Measurement Level", yang memungkinkan pengguna untuk dengan cepat menetapkan level pengukuran untuk variabel yang belum terdefinisi.

---

### 1. Alur Proses Penetapan Level Pengukuran

Diagram ini menunjukkan bagaimana pengguna memindahkan variabel antar-daftar untuk menetapkan level pengukurannya, dan bagaimana perubahan tersebut disimpan ke `VariableStore` saat dikonfirmasi.

```mermaid
sequenceDiagram
    title: Alur Proses Penetapan Level Pengukuran
    actor User

    box "Frontend Components"
        participant UI as "SetMeasurementLevelUI<br>.../SetMeasurementLevel/SetMeasurementLevelUI.tsx"
    end
    
    box "Hooks & Stores"
        participant Hook as "useSetMeasurementLevel<br>.../hooks/useSetMeasurementLevel.ts"
        participant VarStore as "useVariableStore"
    end

    User->>+UI: Buka modal "Set Measurement Level"
    UI->>+Hook: Inisialisasi hook
    Hook->>+VarStore: Get all variables
    deactivate VarStore
    Hook->>Hook: Filter untuk variabel dengan measure 'unknown'
    Hook-->>-UI: Return state awal (unknownVariables)
    UI-->>User: Tampilkan modal dengan variabel yang belum diketahui

    User->>UI: Pindahkan variabel dari 'Unknown' ke 'Nominal'
    UI->>+Hook: handleMoveVariable(...)
    Hook->>Hook: Memperbarui state internal (menghapus dari satu daftar, menambah ke daftar lain)
    Hook-->>-UI: Return state yang diperbarui
    deactivate Hook

    User->>UI: Klik tombol "OK"
    UI->>+Hook: handleSave()

    loop untuk setiap variabel di daftar Nominal, Ordinal, dan Scale
        Hook->>+VarStore: updateMultipleFields(columnIndex, { measure: newMeasure })
        deactivate VarStore
    end

    Hook->>UI: onClose()
    deactivate Hook
    deactivate UI
``` 