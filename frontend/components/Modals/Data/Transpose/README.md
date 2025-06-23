# Fitur: Transpose Data

Dokumen ini menjelaskan fungsionalitas dan arsitektur dari fitur "Transpose Data", yang memungkinkan pengguna untuk menukar baris dan kolom dalam dataset mereka.

## Ringkasan Fungsionalitas

Fitur Transpose mengubah orientasi dataset, mengubah variabel menjadi kasus dan sebaliknya.

-   **Seleksi Variabel**: Pengguna memilih variabel mana dari dataset yang akan diubah menjadi baris dalam dataset baru.
-   **Variabel Penamaan (Opsional)**: Pengguna dapat memilih satu variabel yang nilainya akan digunakan sebagai nama untuk variabel (kolom) baru yang terbentuk setelah transposisi.
    -   Jika tidak ada variabel penamaan yang dipilih, nama default (`Var1`, `Var2`, dst.) akan dibuat.
-   **Variabel ID Otomatis**: Sebuah variabel baru bernama `case_lbl` akan otomatis dibuat untuk menyimpan nama-nama variabel asli yang ditransposisi, berfungsi sebagai pengidentifikasi untuk baris-baris baru.

## Arsitektur & Pola Desain

Fitur ini mengikuti panduan arsitektur utama untuk komponen modal, dengan pemisahan yang jelas antara logika, UI, dan layanan.

```
/Transpose
├── 📂 hooks/
│   └── 📄 useTranspose.ts       // Mengelola state & logika UI.
├── 📂 services/
│   └── 📄 transposeService.ts  // Logika bisnis inti untuk transposisi data.
├── 📄 index.tsx                 // Titik masuk & perakit (Orchestrator).
├── 📄 README.md                 // Dokumen ini.
├── 📄 TransposeUI.tsx           // Komponen UI (Presentational).
└── 📄 types.ts                 // Definisi tipe TypeScript.
```

-   **`index.tsx` (Orchestrator)**: Hanya bertindak sebagai perakit. Ia memanggil *hook* `useTranspose` dan menyambungkan propertinya ke komponen `TransposeUI`.
-   **`TransposeUI.tsx` (Komponen UI)**: Komponen "bodoh" yang bertanggung jawab untuk menampilkan semua elemen antarmuka pengguna, termasuk daftar variabel dan tombol.
-   **`hooks/useTranspose.ts` (Hook Logika)**: Mengelola state UI (seperti variabel mana yang tersedia, dipilih, dan untuk penamaan) dan menangani interaksi pengguna, mendelegasikan pemrosesan data ke *service*.
-   **`services/transposeService.ts` (Service)**: Berisi fungsi murni `transposeDataService` yang melakukan semua pekerjaan berat: mengambil data, variabel yang dipilih, dan variabel penamaan, lalu mengembalikan dataset dan daftar variabel baru yang sudah ditransposisi.
-   **`types.ts` (Definisi Tipe)**: Mengekspor semua tipe dan *props* yang diperlukan untuk memastikan keamanan tipe di seluruh fitur.

## Alur Kerja

1.  **Inisialisasi**: `useTranspose` mengambil daftar variabel saat ini dari `useVariableStore`.
2.  **Interaksi Pengguna**: Pengguna menyeret variabel ke dalam daftar "Variable(s)" dan (opsional) ke daftar "Name Variable".
3.  **Eksekusi**:
    -   Pengguna mengklik "OK".
    -   `handleOk` di dalam `useTranspose` dipanggil.
    -   Ia memanggil `transposeDataService`, memberikan data saat ini dan variabel yang dipilih pengguna.
    -   *Service* melakukan transposisi, membuat variabel `case_lbl`, dan membuat nama variabel baru.
    -   Hasilnya (data baru dan variabel baru) dikembalikan ke *hook*.
4.  **Pembaruan State**: *Hook* `useTranspose` memperbarui `useDataStore` dan `useVariableStore` dengan data dan variabel baru.
5.  **Selesai**: Modal ditutup.

## Usage Examples

### Simple Transposition

To convert a wide format dataset to long format:
1. Select all variables to transpose
2. Do not specify a name variable
3. Disable "Create Variable Names from First Row"
4. Click OK to process
5. The resulting dataset will have rows and columns switched

### Using Variable Values as Names

To transpose data with meaningful variable names:
1. Select the variables to transpose
2. Select an identifier variable as the "Name Variable"
3. Enable "Keep Original Variable as ID Variable" if needed
4. Click OK to process
5. The resulting dataset will use values from the name variable as the names of the new variables

### Headers from First Row

To use first row values as variable names:
1. Select the variables to transpose
2. Enable "Create Variable Names from First Row of Data"
3. Click OK to process
4. The resulting dataset will use the first row values as variable names, and that row will be excluded from the data

## Notes

- Transposing a dataset can dramatically change its structure and may require additional data preparation before or after the operation.
- Variable types are preserved when possible, but some type conversions may occur if the transposed values are not compatible with the original type.
- Large datasets may take longer to transpose, as the operation requires reorganizing all data.
- If the resulting column names would contain invalid characters, they will be automatically modified to comply with variable naming rules.

## Implementation Details

The Transpose feature is implemented with a focus on flexibility and data integrity:

1. **User Interface**:
   - The UI provides clear selection of variables to transpose
   - Options for naming control help users get the desired output structure
   - Preview capability helps visualize the transformation

2. **Data Processing Flow**:
   - When the user clicks "OK", the selected variables are identified
   - Name sources are determined based on user selections
   - The data matrix is rotated in memory
   - New variables are created with appropriate names and types
   - The transposed data is written to the dataset

3. **Data Type Handling**:
   - Variable types are preserved when possible
   - Mixed types in a column are handled by conversion to the most appropriate common type
   - Missing values are preserved through the transposition process

## Sample Test Data

To test the Transpose feature, you can use the following sample dataset:

```
ID,Year,Q1,Q2,Q3,Q4
1,2020,10,15,20,25
2,2021,12,18,22,28
3,2022,14,21,24,30
```

### Test Scenarios

1. **Basic Transposition**:
   - Variables to Transpose: Q1, Q2, Q3, Q4
   - Expected Result: A dataset with rows for each quarter and columns for each year

2. **Using Year as Names**:
   - Variables to Transpose: Q1, Q2, Q3, Q4
   - Name Variable: Year
   - Expected Result: A dataset with rows for each quarter and columns named by year values

3. **Keeping ID Variable**:
   - Variables to Transpose: Year, Q1, Q2, Q3, Q4
   - Name Variable: ID
   - Keep Original Variable as ID: Checked
   - Expected Result: A dataset with ID as the first column, and transposed data with row names from the ID values

4. **First Row as Variable Names**:
   - Variables to Transpose: All
   - Create Variable Names from First Row: Checked
   - Expected Result: A dataset using the values from the first row as column names

These examples demonstrate how to use the Transpose Data feature for different data restructuring needs and validate the expected outcomes. 