### **Sequence Diagrams: Interaksi Halaman Utama**

Dokumentasi ini berisi generalisasi diagram sekuens (sequence diagrams) yang menjelaskan alur kerja dan interaksi komponen utama pada level halaman, yaitu `DataTable`, `VariableTable`, dan `ResultPage`.

Diagram-diagram ini menyederhanakan beberapa alur spesifik menjadi satu pandangan umum untuk menunjukkan pola interaksi utama.

---

### 1. Interaksi Umum pada DataTable

Diagram ini menggeneralisasi berbagai aksi pengguna pada tabel data (seperti mengedit sel, menambah kolom, atau menyisipkan data) ke dalam satu alur interaksi fundamental.

```mermaid
sequenceDiagram
    title: Interaksi Umum pada DataTable
    actor User
    
    box "Frontend"
        participant View as DataTable (View)
        participant Logic as Logic Hooks
        participant Stores as Data Stores (Zustand)
    end

    User->>+View: Melakukan aksi (misal: edit sel, tambah kolom, paste)
    View->>+Logic: Memanggil handler yang sesuai (misal: `handleAfterChange`, `handleInsertColumn`)
    Logic->>Logic: Memproses logika bisnis (validasi, transformasi data)
    Logic->>Stores: Memperbarui state (`useDataStore`, `useVariableStore`)
    Stores-->>View: Notifikasi perubahan state
    deactivate Logic
    deactivate View
    Note right of Stores: State diperbarui secara<br/>langsung atau debounced.
```

---

### 2. Interaksi Umum pada VariableTable

Diagram berikut merangkum alur kerja di tabel variabel. Hampir semua aksi (edit langsung, via dialog, atau menu konteks) disalurkan melalui sebuah antrean operasi asinkron untuk memastikan pembaruan state yang teratur.

```mermaid
sequenceDiagram
    title: Interaksi Umum pada VariableTable
    actor User
    
    box "Frontend"
        participant View as VariableTable (View)
        participant Logic as Event/Logic Hooks
        participant Updates as Update Handler (Queue)
        participant Store as useVariableStore (Zustand)
    end

    User->>+View: Melakukan aksi (edit sel, klik menu konteks, pilih sel dialog)

    alt Aksi Langsung atau via Dialog
        View->>+Logic: Memicu event handler
        Logic->>+Updates: `enqueueOperation({ type: '...', ... })`
        deactivate Logic
    end

    Note right of Updates: Operasi ditambahkan ke antrean<br/>dan diproses secara asinkron.

    Updates->>Updates: `processPendingOperations()`
    Updates->>Store: Memanggil aksi store (misal: `updateMultipleFields`)
    deactivate Updates
    Store-->>View: Notifikasi perubahan state
    deactivate View
```

---

### 3. Interaksi Umum pada Halaman Hasil

Diagram ini mengilustrasikan pola interaksi umum di halaman hasil, di mana pengguna dapat memanipulasi tampilan output (misalnya mengedit deskripsi) atau mengelola daftar analisis (menghapus item).

```mermaid
sequenceDiagram
    title: Interaksi Umum pada Halaman Hasil
    actor User
    
    box "Frontend"
        participant View as Result Components (View)
        participant Store as State Store (Zustand)
    end

    User->>+View: Berinteraksi dengan elemen UI (misal: edit deskripsi, hapus item)
    alt Interaksi Langsung
        View->>+Store: Memanggil aksi untuk memperbarui state (misal: `updateStatistic`)
        Note right of Store: State diperbarui dan dikirim ke backend.
        Store-->>-View: Notifikasi perubahan state
    else Interaksi via Dialog
        participant Dialog
        View->>Dialog: Menampilkan dialog konfirmasi
        User->>Dialog: Konfirmasi aksi
        Dialog->>View: Memicu callback
        View->>+Store: Memanggil aksi (misal: `deleteAnalytic`)
        Note right of Store: State diperbarui dan dikirim ke backend.
        Store-->>-View: Notifikasi perubahan state
    end
    deactivate View
``` 