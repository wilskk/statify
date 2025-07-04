### **Sequence Diagram: Open .sav File**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja saat pengguna membuka file data `.sav`.

---

### 1. Alur Proses Membuka File .sav

Diagram ini menunjukkan bagaimana pengguna memilih file, yang kemudian dikirim ke backend untuk diproses. Data yang telah diproses kemudian digunakan untuk memperbarui state aplikasi di frontend.

```mermaid
sequenceDiagram
    title: Alur Proses Membuka File .sav
    actor User

    box "Frontend"
        participant View as "OpenSavFileModal<br>/Modals/File/OpenSavFile/index.tsx"
        participant Hook as "useOpenSavFileLogic<br>.../hooks/useOpenSavFileLogic.ts"
        participant Stores as "Zustand Stores"
        participant API as "APIService<br>.../services/services.ts"
    end

    box "Backend"
        participant Endpoint as "Backend Endpoint<br>POST /api/sav/upload"
    end

    User->>+View: Buka modal & pilih file `.sav`
    View->>+Hook: Panggil `handleFileChange(file)`
    Hook-->>-View: Perbarui state dengan file yang dipilih
    deactivate Hook

    User->>View: Klik tombol "Open"
    View->>+Hook: Panggil `handleSubmit()`
    
    Hook->>+Stores: Reset state: panggil `resetData()`, `resetVariables()`, `resetMeta()`
    Stores-->>-Hook: Selesai reset
    
    Hook->>+API: Panggil `processSavFile(file)`
    API->>+Endpoint: POST request dengan FormData berisi file
    Endpoint->>Endpoint: Parse file .sav
    Endpoint-->>-API: Kembalikan data (variabel, baris, metadata) dalam format JSON
    API-->>-Hook: Kembalikan respons JSON
    
    Hook->>Hook: Memetakan respons JSON ke struktur data frontend
    Note right of Hook: - `sysvars` -> `Variable[]`<br>- `valueLabels` -> `Variable.values`<br>- `rows` -> `string[][]`
    
    Hook->>+Stores: Panggil `overwriteVariables(newVars)`, `setData(newData)`,<br>`setMeta(newMeta)`
    Stores-->>-Hook: Selesai memperbarui state
    
    Hook->>View: Panggil `onClose()`
    deactivate Hook
    View-->>User: Tutup modal dan tampilkan data baru
    deactivate View
``` 