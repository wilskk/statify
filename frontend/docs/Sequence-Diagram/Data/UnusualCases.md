### **Sequence Diagram: Identify Unusual Cases**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja fitur "Identify Unusual Cases", yang menggunakan Web Worker untuk analisis intensif.

---

### 1. Alur Proses Identifikasi Kasus Tidak Biasa

Diagram ini menunjukkan bagaimana konfigurasi pengguna dari berbagai tab dikirim ke Web Worker untuk diproses. Hasilnya kemudian dapat memicu pembuatan variabel baru di `DataStore` dan `VariableStore`, serta laporan di `ResultStore`.

```mermaid
sequenceDiagram
    title: Alur Proses Identifikasi Kasus Tidak Biasa
    actor User

    box "Frontend"
        participant Modal as "IdentifyUnusualCases<br>.../UnusualCases/index.tsx"
        participant Hook as "useUnusualCases<br>.../hooks/useUnusualCases.ts"
        participant Worker as "unusualCases.worker.js"
    end

    box "Zustand Stores"
        participant VarStore as "useVariableStore"
        participant DataStore as "useDataStore"
        participant ResultStore as "useResultStore"
    end

    User->>+Modal: Buka modal & konfigurasi opsi di berbagai tab
    User->>Modal: Klik tombol "OK"

    Modal->>+Hook: handleConfirm()
    Hook->>+Worker: new Worker()
    Hook->>Worker: postMessage({ data, configs })

    Worker->>Worker: Melakukan analisis (peer grouping, anomaly index, dll.)
    Worker-->>Hook: onmessage({ results })
    deactivate Worker

    alt Opsi "Save" diaktifkan
        loop untuk setiap variabel baru yang akan disimpan (Anomaly Index, Peer Group, etc.)
            Hook->>+VarStore: addVariable(...)
            deactivate VarStore
            Hook->>+DataStore: updateCells(...)
            deactivate DataStore
        end
    end

    alt Opsi "Output" diaktifkan
        Hook->>+ResultStore: addStatistic(results)
        deactivate ResultStore
    end
    
    Hook->>Modal: onClose()
    deactivate Hook
    deactivate Modal
``` 