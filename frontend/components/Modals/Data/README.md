# Kategori Modal Data

> **Peringatan:** Arsitektur untuk semua modal di bawah kategori ini diatur oleh [Panduan Arsitektur Utama Modal](../README.md). Dokumen ini hanya berfungsi sebagai ringkasan kategori.

## Tujuan

Direktori ini berisi semua fitur modal yang berhubungan dengan **manipulasi dan manajemen data**. Ini mencakup konfigurasi variabel, operasi pada kasus (baris), dan perubahan struktur dataset.

## Daftar Fitur

-   **Properti Variabel**:
    -   `DefineVarProps`: Mendefinisikan properti variabel.
    -   `SetMeasurementLevel`: Mengatur level pengukuran.
    -   `DefineDateTime`: Mengkonfigurasi format tanggal & waktu.
-   **Operasi Kasus**:
    -   `SortCases`: Mengurutkan kasus.
    -   `DuplicateCases`: Mengelola kasus duplikat.
    -   `UnusualCases`: Menemukan kasus yang tidak biasa.
    -   `WeightCases`: Menerapkan pembobotan kasus.
-   **Operasi Struktur**:
    -   `SortVars`: Mengurutkan variabel.
    -   `Transpose`: Mentransposisi dataset.
    -   `Restructure`: Merestrukturisasi data.
    -   `Aggregate`: Mengagregasi data.

## Registrasi Fitur

Semua modal dalam kategori ini didaftarkan melalui `DataRegistry.tsx`, yang kemudian digabungkan ke dalam sistem modal utama.

---

## 🧪 Test Suite Index

Semua modal di kategori *Data* memiliki folder `__tests__` masing-masing yang menggunakan **Jest** & **React-Testing-Library** (serta utilitas *vitest* di beberapa kasus) untuk memverifikasi UI, hook, dan fungsi murni.  Tabel ringkas di bawah ini membantu Anda menemukan titik masuk tes utama dengan cepat.

| Modal | Fokus Pengujian | Berkas Utama |
|-------|-----------------|--------------|
| **Aggregate** | Komponen modal, hook state (`useAggregateData`), fungsi utilitas | `Aggregate.test.tsx`, `useAggregateData.test.ts`, `Utils.test.ts` |
| **DefineDateTime** | Komponen modal, hook (`useDefineDateTime`), formatter & service pembuat variabel | `DefineDateTime.test.tsx`, `useDefineDateTime.test.ts`, `dateTimeFormatters.test.ts`, `dateTimeService.test.ts` |
| **DefineVarProps** | Wizard tiga-langkah (scan → editor), hook, service & utilitas | `index.test.tsx`, `PropertiesEditor.test.tsx`, `usePropertiesEditor.test.ts`, `useVariablesToScan.test.ts`, `variablePropertiesService.test.ts`, `VariablesToScan.test.tsx` |
| **DuplicateCases** | Komponen modal, hook (`useDuplicateCases`), layanan `duplicateCasesService` | `index.test.tsx`, `useDuplicateCases.test.ts`, `duplicateCasesService.test.ts` |
| **Restructure** | Wizard UI, hook (`useRestructure`), layanan `restructureService` | `Restructure.test.tsx`, `useRestructure.test.ts`, `restructureService.test.ts` |
| **SelectCases** | Modal multi-dialog, evaluator ekspresi, selector sampel & rentang | `SelectCases.test.tsx`, `evaluator.test.ts`, `selectors.test.ts`, `SelectCasesIfCondition.test.tsx`, `SelectCasesRandomSample.test.tsx`, `SelectCasesRange.test.tsx`, `useSelectCases.test.ts` |
| **SetMeasurementLevel** | UI editor level pengukuran, hook | `index.test.tsx`, `SetMeasurementLevelUI.test.tsx`, `useSetMeasurementLevel.test.tsx` |
| **SortCases** | UI pemilahan kasus, hook | `SortCases.test.tsx`, `useSortCases.test.ts` |
| **SortVars** | UI pemilahan variabel, layanan sort, hook | `SortVarsUI.test.tsx`, `sortVarsService.test.ts`, `useSortVariables.test.ts` |
| **Transpose** | UI, hook (`useTranspose`), layanan `transposeService` | `Transpose.test.tsx`, `useTranspose.test.ts`, `transposeService.test.ts` |
| **UnusualCases** | UI tab‐bertahap, hook (`useUnusualCases`) | `index.test.tsx`, `OptionsTab.test.tsx`, `useUnusualCases.test.ts` |
| **WeightCases** | UI, hook (`useWeightCases`) | `index.test.tsx`, `WeightCasesUI.test.tsx`, `useWeightCases.test.ts` |

> 📄  Masing-masing sub-direktori juga memiliki `README.md` spesifik fitur yang menjelaskan use-case & strategi pengujian secara lebih mendalam.

### Menambahkan Pengujian Baru

1. Buat berkas di sub-direktori `__tests__` modul terkait.
2. Gunakan pola penamaan `<NamaFitur>.<scope>.test.ts(x)` agar konsisten.
3. Pastikan impor jalur relatif menggunakan alias `@/` sesuai konfigurasi `tsconfig.json`.
4. Perbarui tabel di atas bila menambah kategori tes baru (mis. *integration* vs *unit*).

Dengan indeks ini, kontributor dapat menavigasi suite pengujian Data modal secara efisien dan menjaga cakupan tetap terorganisir. 