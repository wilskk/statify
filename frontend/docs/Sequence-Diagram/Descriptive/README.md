### **Sequence Diagrams: Interaksi Analisis Deskriptif**

Dokumentasi ini berisi generalisasi diagram sekuens (sequence diagrams) yang menjelaskan alur kerja dan pola interaksi yang umum ditemukan pada semua fitur analisis deskriptif (seperti Frequencies, Descriptives, Crosstabs, dan Explore).

---

### 1. Alur Umum Konfigurasi Analisis

Diagram ini menggeneralisasi proses di mana pengguna mengonfigurasi sebuah analisis sebelum menjalankannya. Ini mencakup pemilihan variabel dan pengaturan opsi spesifik (seperti statistik, sel, atau grafik) melalui antarmuka berbasis tab.

```mermaid
sequenceDiagram
    title: Alur Umum Konfigurasi Analisis Deskriptif
    actor User

    box "Frontend"
        participant View as UI (Modal/View)
        participant Tabs as "Tabs (Variables, Stats, Charts, etc.)"
        participant Hooks as Configuration Hooks
    end

    User->>+View: Membuka dialog analisis
    User->>+Tabs: Berinteraksi dengan elemen UI di dalam tab
    Note left of Tabs: - Memindahkan variabel (drag-n-drop)<br/>- Mencetang checkbox (opsi statistik)<br/>- Memilih radio button (tipe grafik)
    Tabs->>+Hooks: Memanggil fungsi untuk memperbarui state
    Hooks->>Hooks: Mengubah state internal (misal: `setSelectedVariables`, `setOptions`)
    deactivate Hooks
    deactivate Tabs
    deactivate View
    Note right of Hooks: Perubahan state ini akan<br/>digunakan saat analisis dieksekusi.
```

---

### 2. Alur Umum Eksekusi Analisis (via Web Worker)

Diagram berikut merangkum alur kerja utama saat analisis dieksekusi. Pola yang paling penting adalah pendelegasian komputasi statistik yang berat ke **Web Worker** untuk menjaga antarmuka tetap responsif.

```mermaid
sequenceDiagram
    title: Alur Umum Eksekusi Analisis Deskriptif
    actor User

    box "Frontend"
        participant View as UI (Modal/View)
        participant AnalysisHook as "Main Analysis Hook"
        participant Worker as "Web Worker"
        participant ResultStore as "Result Store (Zustand)"
    end

    User->>+View: Klik tombol "OK"
    View->>+AnalysisHook: Memanggil `runAnalysis()`
    AnalysisHook->>AnalysisHook: Mengatur `isCalculating = true`
    AnalysisHook->>ResultStore: `addLog()` & `addAnalytic()` (Menyiapkan entri hasil)
    ResultStore-->>AnalysisHook: Mengembalikan `analyticId`

    AnalysisHook->>+Worker: Create
    AnalysisHook->>Worker: `postMessage({ data, options, ... })`
    Note right of Worker: Komputasi berat terjadi di sini.<br/>Beberapa analisis (Crosstabs, Explore)<br/>dapat mengirim beberapa pesan ke worker<br/>untuk setiap pasangan variabel/kelompok.

    Worker->>Worker: Menghitung statistik...
    Worker-->>AnalysisHook: `onmessage = { results, ... }`

    rect rgb(220, 220, 220)
    note over AnalysisHook, ResultStore: Pemrosesan Hasil
    AnalysisHook->>AnalysisHook: Mengumpulkan dan memformat hasil dari worker
    AnalysisHook->>ResultStore: `addStatistic(analyticId, { formatted_output })`
    Note right of ResultStore: Hasil yang sudah diformat (tabel,<br/>data grafik) disimpan ke store.
    end

    alt Semua hasil sudah diproses
        AnalysisHook->>AnalysisHook: `isCalculating = false`
        AnalysisHook->>Worker: `terminate()`
        AnalysisHook->>View: `onClose()`
    end
    deactivate AnalysisHook
    deactivate View
``` 