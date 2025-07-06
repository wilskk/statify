# Artefak 1: Model Objek Keseluruhan

Dokumen ini adalah **artefak utama** dari **Proses 1 FDD**. Tujuannya adalah untuk membangun model objek domain yang "dangkal namun luas" (*broad and shallow*) sebagai kerangka konseptual untuk pengembangan selanjutnya.

---

## A. Konteks FDD

Proses ini, *"Mengembangkan Model Objek Keseluruhan"*, berfokus pada identifikasi kelas-kelas domain utama dan hubungan antar kelas tersebut. Model ini berfungsi sebagai peta yang akan memandu proses-proses FDD selanjutnya, terutama dalam penyusunan daftar fitur (Proses 2).

Model ini terdiri dari dua bagian utama:
1.  **Model Domain Statis (UML Class Diagram):** Merepresentasikan entitas inti dalam sistem.
2.  **Model Proses Dinamis (Sequence Diagram):** Menggambarkan pola interaksi utama dalam arsitektur.

---

## B. Model Domain Keseluruhan (UML Class Diagram)

Diagram kelas berikut memvisualisasikan model domain untuk aplikasi Statify. Diagram ini mendefinisikan entitas-entitas inti sistem, atribut utamanya, dan bagaimana mereka saling terhubung. Model ini secara akurat mencerminkan struktur data yang didefinisikan dalam direktori `/types` dan dikelola oleh state management aplikasi (Zustand).

**Diagram Model Domain Statify:**
```mermaid
classDiagram
    direction LR
    Dataset "1" -- "1..*" Variable : has
    Dataset "1" -- "0..*" DataRow : contains
    Dataset "1" -- "0..*" Analysis : "is used in"
    Analysis "1" -- "0..*" Statistics : produces
    Statistics "1" -- "1" OutputData : contains
    Variable "1" -- "0..*" ValueLabel : has
    Variable "1" -- "0..1" MissingValuesSpec : specifies

    class Dataset {
      +String id
      +String name
      +String location
      +Timestamp created
      +String weightVarName
      +String datesVarName
      +String filterVarName
    }
    class Variable {
      +Integer id
      +Integer columnIndex
      +String name
      +String type
      +Integer width
      +Integer decimals
      +String label
      +Integer columns
      +String align
      +String measure
      +String role
    }
    class ValueLabel {
      +Integer id
      +String value
      +String label
    }
    class MissingValuesSpec {
      +String/Integer[] discrete
      +Range range
    }
    class DataRow {
      +Integer RowID
      +Integer DatasetID
      +Integer RowIndex
      +(String|Number)[] RowData
    }
    class Analysis {
      +Integer id
      +String title
      +String type
      +String note
      +jsonb parameters
      +String log
      +Timestamp executedAt
      +String status
    }
    class Statistics {
      +Integer id
      +String title
      +String description
      +OutputData outputData
      +String components
      +Timestamp generatedAt
    }
    class OutputData {
        +String type "'table' or 'chart'"
        +jsonb content
    }
```

---

## C. Diagram Proses Sistem Utama (Sequence Diagram)

Untuk melengkapi model statis, diagram urutan berikut menggambarkan salah satu proses dinamis yang paling fundamental dalam sistem: **menjalankan sebuah analisis**. 

Diagram ini mengilustrasikan pola arsitektur utama yang digunakan di seluruh aplikasi. Pola ini memanfaatkan delegasi komputasi berat ke **Web Worker** untuk menjaga antarmuka pengguna (UI) tetap responsif. Ini menunjukkan interaksi antara komponen UI, logika bisnis (hooks/services), dan pemrosesan latar belakang secara asinkron.

**Skenario: Pola Umum Pemrosesan Analisis Asinkron**
```mermaid
sequenceDiagram
    participant User
    participant PresentationLayer as "React Component (Modal)"
    participant LogicLayer as "Hook/Service"
    participant WorkerManager as "Worker Manager"
    participant AnalysisWorker as "analysis.worker.js"
    participant StatisticsStore as "Zustand (useStatisticsStore)"

    User->>PresentationLayer: Mengisi parameter & klik "Jalankan"
    activate PresentationLayer

    PresentationLayer->>LogicLayer: runAnalysis(analysisType, parameters)
    activate LogicLayer

    LogicLayer->>WorkerManager: postMessage({ type: analysisType, payload: parameters })
    activate WorkerManager

    WorkerManager->>AnalysisWorker: dispatch task
    activate AnalysisWorker

    AnalysisWorker-->>AnalysisWorker: performCalculation()
    AnalysisWorker-->>WorkerManager: postMessage({ statistics: ... })
    deactivate AnalysisWorker
    
    WorkerManager-->>LogicLayer: onMessage(event)
    deactivate WorkerManager

    LogicLayer->>StatisticsStore: addStatistics(event.data.statistics)
    activate StatisticsStore
    
    StatisticsStore-->>PresentationLayer: notify state change
    deactivate StatisticsStore

    PresentationLayer-->>User: Tampilkan Hasil Analisis
    deactivate PresentationLayer
```