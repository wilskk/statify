### **Sequence Diagrams: Interaksi Menu Edit**

Dokumentasi ini berisi generalisasi diagram sekuens (sequence diagrams) yang menjelaskan alur kerja utama untuk fitur-fitur di bawah menu "Edit".

---

### 1. Alur Umum Aksi Edit pada Grid

Diagram ini menggeneralisasi berbagai aksi edit yang langsung memanipulasi grid, seperti Undo, Redo, Copy, Paste, atau menyisipkan baris dan kolom.

```mermaid
sequenceDiagram
    actor User
    
    box "Frontend"
        participant UI as UI (Menu/Shortcut)
        participant Logic as Logic Hook
        participant Grid as Grid Component (e.g., Handsontable)
        participant Stores as Data/Variable Stores
        participant Browser
    end

    User->>+UI: Memicu aksi (misal: Copy, Paste, Insert Row)
    UI->>+Logic: Memanggil handler aksi yang sesuai
    Logic->>+Grid: Memanggil metode internal grid
    Note right of Grid: Grid menangani operasi inti seperti:<br/>- .copy(), .paste(), .undo()<br/>- .alter('insert_row', ...)<br/>- Mengambil data terpilih
    Grid-->>-Logic: Selesai

    alt Aksi melibatkan data eksternal (misal: Copy with Headers)
        Logic->>+Stores: Mengambil metadata (misal: nama variabel)
        Stores-->>-Logic: Mengembalikan metadata
        Logic->>Logic: Memformat data (misal: membuat string TSV)
        Logic->>Browser: Menulis ke clipboard
    end

    Logic-->>-UI: Aksi selesai
```

---

### 2. Alur Umum Navigasi & Pencarian pada Grid

Diagram berikut merangkum alur kerja untuk fitur yang membantu pengguna menavigasi atau mencari data di dalam grid, seperti "Go To Case/Variable" dan "Find & Replace".

```mermaid
sequenceDiagram
    actor User
    
    box "Frontend"
        participant UI as UI (Modal)
        participant Logic as Logic Hook
        participant Grid as Grid Component (e.g., Handsontable)
        participant Stores as Data/Variable Stores
    end

    User->>+UI: Membuka dialog (Go To / Find) & memasukkan input
    UI->>+Logic: Menginisialisasi state & menangani perubahan input

    alt Pencarian (Find)
        Logic->>+Stores: Mengambil data untuk dicari
        Stores-->>-Logic: Mengembalikan data
        Logic->>Logic: Melakukan pencarian & menyimpan hasil
        Logic->>UI: Memperbarui UI (misal: jumlah hasil)
    end

    User->>UI: Klik tombol aksi (misal: "Go", "Find Next", "Replace All")
    UI->>+Logic: Memanggil handler aksi

    alt Navigasi (Go / Find Next)
        Logic->>+Grid: Memanggil metode navigasi
        Note right of Grid: - .scrollViewportTo(row, col)<br/>- .selectCell(row, col)
        Grid-->>-Logic: Selesai
    else Modifikasi Data (Replace / Replace All)
        Logic->>+Stores: Memanggil aksi untuk memperbarui data sel
        Note right of Stores: Perubahan state di stores<br/>akan memicu re-render pada grid.
        Stores-->>-Logic: Selesai
    end

    Logic-->>-UI: Aksi selesai
``` 