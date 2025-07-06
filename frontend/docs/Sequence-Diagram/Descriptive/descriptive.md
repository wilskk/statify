### **Sequence Diagrams: Descriptive Statistics**

Dokumentasi ini berisi diagram sekuens (sequence diagrams) yang menjelaskan alur kerja utama dan interaksi komponen dalam fitur `Descriptive Statistics`.

---

### 1. Alur Proses Pemilihan Variabel

Diagram ini menunjukkan bagaimana pengguna memilih variabel untuk dianalisis, yang dikelola oleh hook `useVariableSelection`.

```mermaid
sequenceDiagram
    title: Alur Proses Pemilihan Variabel
    actor User

    box "Frontend Components"
        participant View as "VariablesTab<br>/Descriptive/components/VariablesTab.tsx"
        participant Hook as "useVariableSelection<br>/Descriptive/hooks/useVariableSelection.ts"
    end

    User->>+View: Memindahkan variabel ke daftar "Variable(s)"
    View->>+Hook: Memanggil `moveToSelectedVariables(variable)`
    Hook->>Hook: Memperbarui state `availableVariables` & `selectedVariables`
    deactivate Hook
    Note right of View: Perubahan state memicu re-render.
    deactivate View
```

---

### 2. Alur Proses Menjalankan Analisis

Diagram berikut menjelaskan proses utama saat pengguna memulai analisis, termasuk pendelegasian komputasi ke Web Worker dan agregasi hasil.

```mermaid
sequenceDiagram
    title: Alur Proses Menjalankan Analisis Deskriptif
    actor User

    box "Frontend"
        participant View as "DescriptiveContent<br>/Descriptive/index.tsx"
        participant Hook as "useDescriptivesAnalysis<br>/.../hooks/useDescriptivesAnalysis.ts"
        participant Worker as "Web Worker<br>/workers/DescriptiveStatistics/manager.js"
        participant Store as "useResultStore"
    end

    User->>+View: Klik tombol "OK"
    View->>+Hook: Memanggil `runAnalysis()`

    Hook->>Hook: `isCalculating = true`
    Hook->>+Worker: Create

    loop untuk setiap variabel yang dipilih
        Hook->>Worker: `postMessage({ analysisType: 'descriptives', ... })`
    end

    rect rgb(211, 211, 211)
    note over Hook, Worker: Mengumpulkan Hasil
        loop untuk setiap pesan dari worker
            Worker-->>Hook: `onmessage = { results, ... }`
            Hook->>Hook: Menyimpan hasil di `resultsRef` & `zScoresRef`
        end
    end

    alt Semua hasil sudah diterima
        Hook->>Hook: Memproses Z-Scores (jika diminta) via `useZScoreProcessing`
        Hook->>Hook: Memformat tabel hasil (`formatDescriptiveTableOld`)
        Hook->>Store: `addLog()`
        Store-->>Hook: `logId`
        Hook->>Store: `addAnalytic(logId)`
        Store-->>Hook: `analyticId`
        Hook->>Store: `addStatistic(analyticId, { output_data })`
        Hook->>Hook: `isCalculating = false`
        Hook->>Worker: `terminate()`
        Hook->>View: `onClose()`
    end
    deactivate Hook
    deactivate View
```

---

### 3. Alur Proses Penyimpanan Z-Scores

Diagram ini mengilustrasikan logika spesifik yang dieksekusi oleh `useZScoreProcessing` ketika opsi "Save standardized values as variables" diaktifkan.

```mermaid
sequenceDiagram
    title: Alur Proses Penyimpanan Z-Scores
    participant AnalysisHook as "useDescriptivesAnalysis<br>/.../hooks/useDescriptivesAnalysis.ts"
    participant ZScoreHook as "useZScoreProcessing<br>/.../hooks/useZScoreProcessing.ts"
    participant VariableStore as "useVariableStore"
    participant DataStore as "useDataStore"

    AnalysisHook->>AnalysisHook: Menerima hasil (termasuk Z-scores) dari Worker
    AnalysisHook->>+ZScoreHook: Memanggil `processZScoreData(zScoresRef.current)`

    rect rgb(220, 220, 220)
    note over ZScoreHook, DataStore: Pemrosesan Z-Score
    ZScoreHook->>ZScoreHook: Memvalidasi data & menyiapkan variabel baru
    ZScoreHook->>VariableStore: `addMultipleVariables(newVariables)`
    Note right of VariableStore: Menambahkan definisi variabel baru (misal: ZVar1)
    
    ZScoreHook->>DataStore: `ensureColumns(newIndex)`
    Note right of DataStore: Memastikan kolom matriks data ada
    
    ZScoreHook->>DataStore: `updateCells(bulkCellUpdates)`
    Note right of DataStore: Mengisi nilai Z-score ke sel-sel yang sesuai
    end

    ZScoreHook-->>-AnalysisHook: Selesai
``` 