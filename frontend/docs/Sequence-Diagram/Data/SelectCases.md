### **Sequence Diagram: Select Cases**

Dokumentasi ini berisi diagram sekuens yang merinci alur kerja fitur "Select Cases", yang memiliki beberapa metode seleksi yang berbeda.

---

### 1. Alur Proses Konfigurasi Metode Seleksi

Diagram ini menunjukkan bagaimana pengguna memilih salah satu dari beberapa metode seleksi yang tersedia (misalnya, "If Condition", "Random Sample", "Range") dan berinteraksi dengan sub-dialog yang sesuai untuk mengonfigurasi kriteria.

```mermaid
sequenceDiagram
    title: Alur Proses Konfigurasi Metode Seleksi
    actor User

    box "Frontend Components"
        participant Modal as "SelectCases<br>.../SelectCases/index.tsx"
        participant Hook as "useSelectCases<br>.../hooks/useSelectCases.ts"
        participant IfDlg as "IfConditionDialog"
        participant SampleDlg as "RandomSampleDialog"
        participant RangeDlg as "RangeDialog"
    end
    
    User->>+Modal: Buka modal "Select Cases"
    
    alt User memilih 'If Condition'
        User->>Modal: Klik tombol "If..."
        Modal->>+Hook: handleIfButtonClick()
        Hook-->>+IfDlg: Buka dialog
        User->>IfDlg: Tentukan ekspresi & klik "Continue"
        IfDlg->>+Hook: handleIfConditionContinue(expression)
        deactivate Hook
        deactivate IfDlg
    else User memilih 'Random Sample'
        User->>Modal: Klik tombol "Sample..."
        Modal->>+Hook: handleSampleButtonClick()
        Hook-->>+SampleDlg: Buka dialog
        User->>SampleDlg: Tentukan kriteria & klik "Continue"
        SampleDlg->>+Hook: handleRandomSampleContinue(config)
        deactivate Hook
        deactivate SampleDlg
    else User memilih 'Range'
        User->>Modal: Klik tombol "Range..."
        Modal->>+Hook: handleRangeButtonClick()
        Hook-->>+RangeDlg: Buka dialog
        User->>RangeDlg: Tentukan rentang & klik "Continue"
        RangeDlg->>+Hook: handleRangeContinue(config)
        deactivate Hook
        deactivate RangeDlg
    end
```

---

### 2. Alur Proses Konfirmasi dan Eksekusi

Setelah kriteria dikonfigurasi, diagram ini menunjukkan bagaimana proses dieksekusi setelah pengguna mengklik "OK". Alur ini mencakup pemanggilan service yang sesuai, pembuatan variabel filter, dan pembaruan data atau metadata.

```mermaid
sequenceDiagram
    title: Alur Proses Konfirmasi dan Eksekusi Seleksi
    actor User

    box "Frontend Components"
        participant Modal as "SelectCases<br>.../SelectCases/index.tsx"
        participant Hook as "useSelectCases<br>.../hooks/useSelectCases.ts"
        participant Service as "selectors<br>.../services/selectors.ts"
    end

    box "Zustand Stores"
        participant VarStore as "useVariableStore"
        participant DataStore as "useDataStore"
        participant MetaStore as "useMetaStore"
    end

    User->>+Modal: Pilih opsi output & klik "OK"
    Modal->>+Hook: handleConfirm()
    
    alt Berdasarkan Metode Seleksi yang Dikonfigurasi
        Hook->>Hook: Memanggil apply...Filter() yang sesuai
        Hook->>+Service: Memanggil selectBy...(data, config)
        Service-->>-Hook: Return selectedIndices
        deactivate Service
    end

    alt Output: 'Filter out unselected cases'
        Hook->>Hook: createFilterVariable(selectedIndices)
        Hook->>+VarStore: addVariable("filter_$")
        deactivate VarStore
        Hook->>+DataStore: updateCells(filterValues)
        deactivate DataStore
        Hook->>+MetaStore: setMeta({ filter: "filter_$" })
        deactivate MetaStore
    else Output: 'Delete unselected cases'
        Hook->>+DataStore: deleteRows(unselectedIndices)
        deactivate DataStore
    end
    
    Hook->>Modal: onClose()
    deactivate Hook
``` 