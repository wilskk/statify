### **Sequence Diagram: File Menu Actions**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja untuk berbagai aksi yang dipicu dari menu "File".

---

### 1. Alur Proses Aksi pada Menu File

Diagram ini menunjukkan bagaimana interaksi pengguna pada `FileMenu` (seperti "New", "Save As", "Exit") di-handle oleh hook `useFileMenuActions` dan bagaimana hook tersebut berinteraksi dengan berbagai store, servis, dan router.

```mermaid
sequenceDiagram
    title: Alur Proses Aksi pada Menu File
    actor User

    box "Frontend"
        participant Menu as "FileMenu<br>/Modals/File/FileMenu.tsx"
        participant Hook as "useFileMenuActions<br>/Modals/File/hooks/useFileMenuActions.ts"
        participant Stores as "Zustand Stores"
        participant Router as "Next.js Router"
        participant API as "API Service<br>/services/api.ts"
    end
    
    box "Backend"
        participant Backend as "Backend API"
    end

    User->>+Menu: Klik sebuah aksi (misal: "New")
    Menu->>+Hook: Panggil `handleAction({ actionType: '...' })`

    alt "New" (Proyek Baru)
        Hook->>Stores: Panggil `resetData()`, `resetVariables()`,<br>`resetMeta()`, `clearAll()`
        Note right of Stores: Membersihkan state aplikasi
        Stores-->>Hook: Selesai
    
    else "Save" (Simpan ke Local Storage)
        Hook->>Stores: Panggil `saveMeta()`, `saveVariables()`, `saveData()`
        Note right of Stores: Menyimpan state ke local storage browser
        Stores-->>Hook: Selesai

    else "Save As" (Simpan sebagai .sav)
        Hook->>Stores: Ambil data, variabel, dan metadata
        Stores-->>Hook: Kembalikan state
        Hook->>Hook: Lakukan sanitasi & transformasi data
        Hook->>+API: Panggil `createSavFile(payload)`
        API->>+Backend: POST /api/sav-upload dengan data JSON
        Backend-->>-API: Kembalikan file dalam bentuk Blob
        API-->>-Hook: Kembalikan Blob
        Hook->>Hook: Panggil `downloadBlobAsFile(blob, 'data.sav')`
        Note right of Hook: Memicu unduhan file di browser

    else "Exit" (Keluar)
        Hook->>Stores: Panggil `resetData()`, `resetVariables()`,<br>`resetMeta()`, `clearAll()`
        Stores-->>Hook: Selesai
        Hook->>Router: Panggil `router.push('/')`
        Router-->>User: Arahkan ke halaman utama
    end

    Hook-->>-Menu: Aksi selesai
    deactivate Hook
    deactivate Menu
``` 