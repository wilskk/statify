### **Sequence Diagram: Identify Duplicate Cases**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja fitur "Identify Duplicate Cases", yang menggunakan Web Worker untuk pemrosesan latar belakang.

---

### 1. Alur Proses Identifikasi Kasus Duplikat

Diagram ini menunjukkan bagaimana interaksi pengguna memicu proses di Web Worker dan bagaimana hasilnya digunakan untuk memodifikasi state aplikasi, seperti membuat variabel indikator baru, memfilter/mengurutkan data, dan menampilkan laporan.

```mermaid
sequenceDiagram
    title: Alur Proses Identifikasi Kasus Duplikat
    actor User

    box "Frontend"
        participant Modal as "DuplicateCasesModal<br>.../DuplicateCases/index.tsx"
        participant Hook as "useDuplicateCases<br>.../hooks/useDuplicateCases.ts"
        participant Worker as "duplicateCases.worker.js"
    end

    box "Zustand Stores"
        participant VarStore as "useVariableStore"
        participant DataStore as "useDataStore"
        participant ResultStore as "useResultStore"
    end

    User->>+Modal: Buka modal & pilih variabel
    User->>Modal: Klik tombol "OK"

    Modal->>+Hook: handleConfirm()
    Hook->>+Worker: new Worker()
    Hook->>Worker: postMessage({ data, configs })

    Worker->>Worker: Memproses data untuk mencari duplikat
    Worker-->>Hook: onmessage ({ result, statistics })
    deactivate Worker

    alt "moveMatchingToTop" diaktifkan
        Hook->>+DataStore: setData(reorderedData)
        deactivate DataStore
    end

    Hook->>Hook: createIndicatorVariables()
    note right of Hook: Membuat variabel indikator baru
    Hook->>+VarStore: addVariable(...)
    deactivate VarStore
    Hook->>+DataStore: updateCells(...)
    deactivate DataStore

    alt "filterByIndicator" diaktifkan
        Hook->>+DataStore: setData(filteredData)
        deactivate DataStore
    end

    alt "displayFrequencies" diaktifkan
        Hook->>Hook: createOutputLog()
        Hook->>+ResultStore: addLog(), addAnalytic(), addStatistic()
        deactivate ResultStore
    end

    Hook->>Modal: onClose()
    deactivate Hook
    deactivate Modal
``` 