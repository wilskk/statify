### **Sequence Diagram: Edit Menu Actions**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja untuk berbagai aksi yang dipicu dari menu "Edit".

---

### 1. Alur Proses Aksi pada Menu Edit

Diagram ini menunjukkan bagaimana interaksi pengguna pada `EditMenu` di-handle oleh hook `useEditMenuActions` dan bagaimana hook tersebut berinteraksi dengan Handsontable, Zustand store, dan Browser API untuk melakukan berbagai operasi.

```mermaid
sequenceDiagram
    title: Alur Proses Aksi pada Menu Edit
    actor User

    box "Frontend"
        participant Menu as "EditMenu<br>/Modals/Edit/EditMenu.tsx"
        participant Hook as "useEditMenuActions<br>.../hooks/useEditMenuActions.ts"
        participant HOT as "Handsontable Instance"
        participant Store as "useVariableStore"
        participant Clipboard as "Browser Clipboard API"
    end

    User->>+Menu: Klik sebuah item di menu Edit (misal: "Copy with Variable Names")
    Menu->>+Hook: Panggil `handleAction('...')`

    alt "Aksi Dasar" (Undo, Redo, Cut, Copy, Paste, Clear)
        Hook->>HOT: Dapatkan instance plugin `copyPaste`
        Hook->>HOT: Panggil metode yang sesuai<br>(undo, redo, cut, copy, paste, emptySelectedCells)
        Note right of HOT: Aksi ditangani langsung oleh<br>plugin internal Handsontable.

    else "Copy with Headers" (CopyWithVariableNames, CopyWithVariableLabels)
        Hook->>HOT: Dapatkan data dari sel yang dipilih
        HOT-->>Hook: Kembalikan data
        Hook->>+Store: Dapatkan nama/label variabel untuk kolom yang dipilih
        Store-->>-Hook: Kembalikan info variabel
        Hook->>Hook: Format data sebagai string TSV (Tab-Separated Values)
        Hook->>+Clipboard: Panggil `navigator.clipboard.writeText(tsvData)`
        Clipboard-->>-Hook: Selesai menulis ke clipboard

    else "Paste with Headers" (PasteWithVariableNames)
        Hook->>+Clipboard: Panggil `navigator.clipboard.readText()`
        Clipboard-->>-Hook: Kembalikan teks dari clipboard
        Hook->>Hook: Parse teks menjadi header dan baris data
        Hook->>+Store: Panggil `addMultipleVariables(headers)`
        Store-->>-Hook: Selesai menambah variabel (memicu penambahan kolom di grid)
        Hook->>HOT: Panggil `populateFromArray(dataRows)` untuk mengisi data
        
    else "Alterasi Grid" (InsertVariable, InsertCases)
        Hook->>HOT: Dapatkan sel yang dipilih
        Hook->>HOT: Panggil `alter('insert_col_start', ...)` atau `alter('insert_row_below', ...)`
        Note right of HOT: Handsontable menyisipkan baris/kolom baru.
    
    end

    Hook-->>-Menu: Aksi selesai
    deactivate Hook
    deactivate Menu
``` 