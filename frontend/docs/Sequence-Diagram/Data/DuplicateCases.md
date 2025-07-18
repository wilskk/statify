### **Sequence Diagram: Identify Duplicate Cases**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja fitur "Identify Duplicate Cases", yang memproses data secara sinkron untuk menemukan duplikat.

---

### 1. Alur Proses Identifikasi Kasus Duplikat

Diagram ini menunjukkan bagaimana interaksi pengguna memicu pemrosesan data oleh `duplicateCasesService`. Hasilnya kemudian digunakan untuk memodifikasi state aplikasi, seperti membuat variabel indikator baru dan menampilkan laporan.

```mermaid
sequenceDiagram
    title: Alur Proses Identifikasi Kasus Duplikat
    actor User

    box "Frontend"
        participant Modal as "DuplicateCasesModal<br>.../DuplicateCases/index.tsx"
        participant Hook as "useDuplicateCases<br>.../hooks/useDuplicateCases.ts"
        participant Service as "duplicateCasesService.ts"
    end

    box "Zustand Stores"
        participant VarStore as "useVariableStore"
        participant DataStore as "useDataStore"
        participant ResultStore as "useResultStore"
    end

    User->>+Modal: Buka modal & pilih variabel
    User->>Modal: Klik tombol "OK"

    Modal->>+Hook: handleConfirm()
    Hook->>+Service: processDuplicates({ data, configs })
    Service->>Service: Memproses data untuk mencari duplikat
    Service-->>Hook: onmessage ({ result, statistics })
    deactivate Service

    Hook->>Hook: createIndicatorVariables(result)
    note right of Hook: Membuat variabel indikator baru
    Hook->>+VarStore: addVariables(...)
    note left of VarStore: Batch update untuk menambah<br>variabel & memperbarui sel.
    deactivate VarStore
    
    alt "displayFrequencies" diaktifkan
        Hook->>Hook: createOutputLog(statistics)
        Hook->>+ResultStore: addLog(), addAnalytic(), addStatistic()
        deactivate ResultStore
    end

    Hook->>Modal: onClose()
    deactivate Hook
    deactivate Modal
``` 