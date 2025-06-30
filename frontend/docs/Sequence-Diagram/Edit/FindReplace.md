### **Sequence Diagram: Find & Replace**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja untuk fitur "Find & Replace".

---

### 1. Alur Proses Find & Replace

Diagram ini menunjukkan interaksi antara komponen UI, hook, dan data store saat pengguna melakukan operasi pencarian dan penggantian.

```mermaid
sequenceDiagram
    title: Alur Proses Find & Replace
    actor User

    box "Frontend Components"
        participant View as "FindReplaceContent<br>.../components/FindReplaceContent.tsx"
        participant Hook as "useFindReplaceForm<br>.../hooks/useFindReplaceForm.ts"
    end
    
    box "Zustand Stores & Refs"
        participant DataStore as "useDataStore"
        participant VarStore as "useVariableStore"
        participant TableRef as "useTableRefStore<br>(Handsontable Instance)"
    end

    User->>+View: Buka modal Find & Replace
    View->>+Hook: Inisialisasi hook
    Hook->>VarStore: Ambil `variables` untuk daftar kolom
    VarStore-->>Hook: Kembalikan variabel
    Hook-->>-View: Kembalikan state awal & handler
    View-->>User: Tampilkan UI

    alt "Find Interaction"
        User->>View: Ketik teks di input "Find"
        View->>+Hook: Panggil `handleFindChange(text)`
        Hook->>Hook: (Debounced) Panggil `performSearch()`
        Note right of Hook: - Ambil data dari `DataStore`<br>- Lakukan iterasi & pencocokan<br>- Update `searchResults` state
        Hook-->>-View: State diperbarui dengan hasil pencarian
        View-->>User: Update jumlah hasil (misal: "1 of 5")

        User->>View: Klik "Find Next"
        View->>+Hook: Panggil `handleFindNext()`
        Hook->>Hook: Panggil `navigateToResult(nextIndex)`
        Hook->>+TableRef: Dapatkan instance Handsontable
        TableRef-->>-Hook: Kembalikan instance
        Hook->>TableRef: Panggil `selectCell(row, col)` & `scrollViewportTo(row, col)`
        deactivate Hook
    end

    alt "Replace Interaction"
        User->>View: Ketik teks di input "Replace with"
        View->>+Hook: Panggil `handleReplaceChange(text)`
        deactivate Hook

        alt "Replace One"
            User->>View: Klik tombol "Replace"
            View->>+Hook: Panggil `handleReplace()`
            Hook->>+DataStore: Panggil `updateCell(row, col, newText)`
            DataStore-->>-Hook: Selesai update state
            Hook->>Hook: Otomatis cari hasil berikutnya (`handleFindNext`)
            deactivate Hook
        else "Replace All"
            User->>View: Klik tombol "Replace All"
            View->>+Hook: Panggil `handleReplaceAll()`
            Hook->>+DataStore: Panggil `updateCells(arrayOfUpdates)`
            DataStore-->>-Hook: Selesai update state (bulk)
            Hook->>Hook: Panggil `clearSearch()` untuk mereset
            deactivate Hook
        end
    end
``` 