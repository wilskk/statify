### **Sequence Diagram: Weight Cases**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja fitur "Weight Cases", yang digunakan untuk menerapkan pembobotan kasus berdasarkan variabel frekuensi.

---

### 1. Alur Proses Penetapan Pembobotan Kasus

Diagram ini menunjukkan bagaimana pemilihan variabel oleh pengguna hanya mengubah satu entri di `MetaStore`, yang kemudian akan digunakan oleh fitur analisis lainnya. Tidak ada data sel yang diubah secara langsung oleh fitur ini.

```mermaid
sequenceDiagram
    title: Alur Proses Penetapan Pembobotan Kasus
    actor User

    box "Frontend Components"
        participant Modal as "WeightCasesModal<br>.../WeightCases/index.tsx"
    end

    box "Hooks & Stores"
        participant Hook as "useWeightCases<br>.../hooks/useWeightCases.ts"
        participant VarStore as "useVariableStore"
        participant MetaStore as "useMetaStore"
    end

    User->>+Modal: Buka modal "Weight Cases"
    Modal->>+Hook: Inisialisasi hook
    Hook->>+VarStore: Get variables
    deactivate VarStore
    Hook->>+MetaStore: Get current weight setting
    deactivate MetaStore
    Hook-->>-Modal: Return state awal
    Modal-->>User: Tampilkan modal

    User->>Modal: Pilih variabel frekuensi numerik
    User->>Modal: Klik tombol "OK"

    Modal->>+Hook: handleSave()
    Hook->>+MetaStore: setMeta({ weight: selectedVariableName })
    Note right of MetaStore: Pengaturan bobot disimpan secara global<br>dan akan digunakan oleh fitur analisis lain.
    deactivate MetaStore

    Hook->>Modal: onClose()
    deactivate Hook
    Modal-->>User: Tutup modal
    deactivate Modal
``` 