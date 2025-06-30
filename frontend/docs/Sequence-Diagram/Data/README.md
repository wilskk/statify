### **Sequence Diagrams: Interaksi Transformasi Data**

Dokumentasi ini berisi generalisasi diagram sekuens (sequence diagrams) yang menjelaskan alur kerja dan pola interaksi yang umum ditemukan pada berbagai fitur transformasi data.

---

### 1. Alur Umum Modifikasi Skema dan Data

Diagram ini menggeneralisasi fitur yang mengubah struktur atau konten data secara signifikan. Ini termasuk menambah/mengurutkan variabel, merestrukturisasi, atau mentransposisi data. Pola umumnya adalah memodifikasi definisi variabel (`VariableStore`) terlebih dahulu, kemudian memperbarui atau mengganti seluruh data (`DataStore`).

```mermaid
sequenceDiagram
    title: Alur Umum Modifikasi Skema dan Data
    actor User
    
    box "Frontend"
        participant UI as UI (Modal/Wizard)
        participant Hook as Logic Hook
        participant Service as Processing Service
        participant VarStore as VariableStore
        participant DataStore
    end

    User->>+UI: Membuka fitur & mengonfigurasi opsi
    UI->>+Hook: Memanggil handler untuk memulai proses (misal: `handleOk`)
    Hook->>DataStore: Mengambil data saat ini
    Hook->>VarStore: Mengambil variabel saat ini
    Hook->>+Service: Meminta transformasi data (mengirim data, variabel, dan konfigurasi)
    Note right of Service: Service melakukan logika inti:<br/>- Agregasi, restrukturisasi, transposisi<br/>- Membuat definisi variabel baru
    Service-->>-Hook: Mengembalikan `{ newData, newVariables }`

    Hook->>+VarStore: `overwriteVariables(newVariables)`
    VarStore-->>-Hook: Selesai
    
    Hook->>+DataStore: `setData(newData)`
    DataStore-->>-Hook: Selesai

    Hook-->>-UI: Menutup UI setelah selesai
```

---

### 2. Alur Umum Modifikasi Metadata Saja

Diagram berikut merangkum alur kerja untuk fitur yang hanya mengubah metadata tanpa memengaruhi data sel itu sendiri. Contohnya termasuk mengubah properti variabel (seperti level pengukuran) atau mengatur konfigurasi global (seperti pembobotan kasus).

```mermaid
sequenceDiagram
    title: Alur Umum Modifikasi Metadata Saja
    actor User
    
    box "Frontend"
        participant UI as UI (Modal)
        participant Hook as Logic Hook
        participant Stores as Metadata Stores
    end

    Note right of Stores: Bisa berupa `VariableStore`<br/>atau `MetaStore`.

    User->>+UI: Membuka fitur & mengubah pengaturan
    UI->>+Hook: Memanggil handler untuk menyimpan perubahan
    
    alt Perubahan Properti Variabel
        loop untuk setiap variabel yang diubah
            Hook->>+Stores: `updateVariable(id, { property: newValue })`
            Stores-->>-Hook: Selesai
        end
    else Perubahan Konfigurasi Global
        Hook->>+Stores: `setMeta({ setting: value })`
        Stores-->>-Hook: Selesai
    end
    
    Hook-->>-UI: Menutup UI
```

---

### 3. Alur Umum Identifikasi Kasus (via Worker/Service)

Diagram ini mengilustrasikan fitur yang menganalisis dataset untuk mengidentifikasi kasus tertentu (duplikat, tidak biasa) atau menyaring data. Proses ini seringkali didelegasikan ke *Web Worker* atau *Service* dan dapat menghasilkan variabel indikator baru, memfilter data, atau membuat laporan.

```mermaid
sequenceDiagram
    title: Alur Umum Identifikasi & Penyaringan Kasus
    actor User
    
    box "Frontend"
        participant UI as UI (Modal)
        participant Hook as Logic Hook
        participant Processor as Processor (Worker/Service)
        participant Stores
    end

    User->>+UI: Membuka fitur & mengatur kriteria
    UI->>+Hook: Memanggil handler untuk memulai proses
    Hook->>+Processor: Meminta pemrosesan data (mengirim data & kriteria)
    Note right of Processor: Worker/Service menganalisis data<br/>dan mengembalikan hasilnya (misal:<br/>indeks baris, data yang diurutkan, statistik).
    Processor-->>-Hook: Mengembalikan hasil analisis

    alt Membuat Variabel Baru (misal: Indikator Duplikat)
        Hook->>Stores: `addVariable(newIndicatorVar)`
        Hook->>Stores: `updateCells(indicatorValues)`
    end

    alt Memfilter atau Mengurutkan Data
        Hook->>Stores: `setData(filteredOrSortedData)`
        Hook->>Stores: `setMeta({ filter: 'filter_$' })`
    end

    alt Menampilkan Laporan
        Hook->>Stores: `addStatistic(reportData)`
    end

    Hook-->>-UI: Menutup UI
```