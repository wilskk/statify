### **Sequence Diagrams: Interaksi Manajemen File**

Dokumentasi ini berisi generalisasi diagram sekuens (sequence diagrams) yang menjelaskan alur kerja utama untuk fitur-fitur manajemen file, seperti impor, ekspor, dan aksi menu lainnya.

---

### 1. Alur Umum Impor Data

Diagram ini menggeneralisasi proses impor data, baik dari file lokal (seperti `.sav`) maupun dari clipboard.

```mermaid
sequenceDiagram
    title: Alur Umum Impor Data (dari File atau Clipboard)
    actor User
    
    box "Frontend"
        participant UI as UI (Modal/Component)
        participant Logic as Logic Hook
        participant Processor as Processor (API/Util)
        participant Stores as Stores (Zustand)
    end

    User->>+UI: Membuka fitur impor & menyediakan input (file/teks)
    UI->>+Logic: Memanggil handler untuk memulai proses
    Logic->>Logic: Mengelola state UI (misal: loading, progress)
    Logic->>+Processor: Meminta pemrosesan data (mengirim file/teks)
    Note right of Processor: Prosesor bisa berupa:<br/>- API call ke backend (untuk .sav)<br/>- Utilitas parsing di frontend (untuk clipboard)
    Processor-->>-Logic: Mengembalikan data terstruktur (JSON)

    Logic->>+Stores: Memperbarui state aplikasi (data, variabel, meta)
    Stores-->>-Logic: Selesai

    Logic-->>-UI: Menutup UI/modal & menampilkan data baru
```

---

### 2. Alur Umum Ekspor Data

Diagram berikut merangkum alur kerja ekspor data ke berbagai format (misalnya CSV, Excel).

```mermaid
sequenceDiagram
    title: Alur Umum Ekspor Data (ke CSV/Excel)
    actor User
    
    box "Frontend"
        participant UI as UI (Modal)
        participant Logic as Logic Hook
        participant Generator as Generator Util
        participant Stores as Stores (Zustand)
        participant Browser
    end

    User->>+UI: Membuka fitur ekspor & memilih opsi
    UI->>+Logic: Memanggil handler untuk memulai ekspor
    Logic->>+Stores: Mengambil data, variabel, dan metadata dari stores
    Stores-->>-Logic: Mengembalikan data yang dibutuhkan

    Logic->>+Generator: Meminta pembuatan konten file (misal: CSV string, workbook object)
    Generator-->>-Logic: Mengembalikan konten file

    Logic->>+Browser: Membuat file (misal: via Blob atau library) & memicu unduhan
    Browser-->>User: Menampilkan dialog unduh file
    deactivate Browser
    Logic-->>-UI: Menutup UI/modal
```

---

### 3. Alur Umum Aksi Menu File

Diagram ini mengilustrasikan alur kerja umum untuk aksi-aksi di menu File yang tidak terkait impor/ekspor, seperti "New", "Save", atau "Exit".

```mermaid
sequenceDiagram
    title: Alur Umum Aksi Menu File
    actor User

    box "Frontend"
        participant Menu as UI (Menu)
        participant Logic as Logic Hook
        participant Services as Stores / Services
    end
    
    Note right of Services: Services bisa berupa:<br/>- Stores (Zustand)<br/>- Next.js Router<br/>- API Service

    User->>+Menu: Klik sebuah aksi (misal: New, Save, Exit)
    Menu->>+Logic: Memanggil handler aksi yang sesuai
    Logic->>+Services: Melakukan operasi yang relevan
    
    alt Operasi State
        Logic->>Services: resetStores() / saveStores()
    else Operasi Navigasi
        Logic->>Services: router.push('/')
    else Operasi API
        Logic->>Services: api.saveFile(data)
    end
    
    Services-->>-Logic: Operasi selesai
    Logic-->>-Menu: Aksi selesai
``` 