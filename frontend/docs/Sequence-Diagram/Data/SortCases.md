### **Sequence Diagram: Sort Cases**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja fitur "Sort Cases", yang memungkinkan pengguna untuk mengurutkan baris data berdasarkan satu atau lebih variabel.

---

### 1. Alur Proses Pengurutan Kasus

Diagram ini mengilustrasikan bagaimana pengguna memilih variabel untuk pengurutan, mengubah arah pengurutan, dan bagaimana perubahan tersebut diterapkan pada `DataStore` setelah konfirmasi.

```mermaid
sequenceDiagram
    title: Alur Proses Pengurutan Kasus (Baris)
    actor User

    box "Frontend Components"
        participant UI as "SortCasesUI<br>.../SortCases/SortCasesUI.tsx"
    end
    
    box "Hooks & Stores"
        participant Hook as "useSortCases<br>.../hooks/useSortCases.ts"
        participant DataStore as "useDataStore"
    end

    User->>+UI: Buka modal "Sort Cases"
    UI->>+Hook: Inisialisasi hook
    Hook-->>-UI: Return state awal
    UI-->>User: Tampilkan modal dengan variabel yang tersedia

    User->>UI: Pindahkan variabel ke daftar 'Sort By'
    UI->>+Hook: handleMoveVariable(...)
    Hook->>Hook: Memperbarui `sortByConfigs` dengan arah default
    Hook-->>-UI: Return state yang diperbarui

    User->>UI: Pilih variabel dan ubah arah pengurutan
    UI->>+Hook: changeSortDirection(tempId, 'desc')
    Hook->>Hook: Memperbarui arah untuk konfigurasi tertentu
    Hook-->>-UI: Return state yang diperbarui
    deactivate Hook

    User->>UI: Klik tombol "OK"
    UI->>+Hook: handleOk()
    Hook->>Hook: performSort()

    Hook->>+DataStore: setData(sortedDataArray)
    deactivate DataStore

    deactivate Hook
    Hook->>UI: onClose()
    deactivate Hook
    deactivate UI
``` 