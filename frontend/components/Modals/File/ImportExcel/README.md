# Penjelasan UI Import Excel dan Efeknya

Berikut adalah penjelasan setiap bagian UI pada proses import Excel, efek jika dilakukan/dicentang, algoritma di baliknya, dan status implementasi:

## 1. Pilih File Excel
- **UI:** Tombol/area klik dan drag-and-drop file Excel (.xls/.xlsx)
- **Efek:** File yang dipilih akan dibaca dan diparsing, nama & ukuran file muncul di UI.
- **Algoritma:**
  - Validasi ekstensi file.
  - File dibaca sebagai binary, diproses oleh worker SheetJS/xlsx.
- **Status:** Sudah diimplementasikan

## 2. Pilih Worksheet (Sheet)
- **UI:** Dropdown daftar sheet yang ada di file Excel.
- **Efek:** Sheet yang dipilih akan digunakan untuk preview dan import data.
- **Algoritma:**
  - SheetJS membaca semua sheet, nama sheet diambil dari workbook.
- **Status:** Sudah diimplementasikan

## 3. Range Sel (Read Range)
- **UI:** Input teks (misal: A1:D10, atau kosong untuk seluruh sheet)
- **Efek:** Hanya range sel yang diinput yang akan diambil untuk preview/import.
- **Algoritma:**
  - Range diteruskan ke SheetJS untuk membatasi parsing.
- **Status:** Sudah diimplementasikan

## 4. Opsi "First row as variable names"
- **UI:** Checkbox
- **Efek:** Baris pertama dianggap sebagai nama variabel (header kolom).
- **Algoritma:**
  - Jika dicentang, header diambil dari baris pertama, data mulai baris kedua.
  - Jika tidak, header default (A, B, C, ...).
- **Status:** Sudah diimplementasikan

## 5. Opsi "Read hidden rows & columns"
- **UI:** Checkbox
- **Efek:** Data dari baris/kolom tersembunyi juga diambil.
- **Algoritma:**
  - Opsi diteruskan ke SheetJS (`skipHidden: false`).
- **Status:** Sudah diimplementasikan

## 6. Opsi "Read empty cells as"
- **UI:** Dropdown ("Empty string" / "System missing (SYSMIS)")
- **Efek:**
  - "Empty string": sel kosong diisi "" (string kosong)
  - "SYSMIS": sel kosong diisi "SYSMIS" (untuk deteksi missing value)
- **Algoritma:**
  - Opsi diteruskan ke SheetJS dan normalisasi data.
- **Status:** Sudah diimplementasikan

## 7. Preview Data
- **UI:** Tabel preview (max 100 baris, Handsontable)
- **Efek:** Menampilkan data hasil parsing sesuai opsi di atas.
- **Algoritma:**
  - Data diambil dari SheetJS, dipotong 100 baris pertama.
- **Status:** Sudah diimplementasikan

## 8. Tombol Navigasi (Back, Reset, Import Data)
- **UI:** Tombol Back, Reset, Import Data
- **Efek:**
  - Back: Kembali ke pemilihan file
  - Reset: Opsi parsing kembali ke default
  - Import Data: Data diimpor ke store aplikasi
- **Algoritma:**
  - Back/reset hanya mengubah state UI.
  - Import Data: Data diproses penuh, variabel di-generate otomatis, data masuk ke store.
- **Status:** Sudah diimplementasikan

## 9. Error Handling
- **UI:** Pesan error jika file tidak valid, parsing gagal, atau data kosong.
- **Efek:** Proses import dibatalkan, user diberi tahu masalahnya.
- **Algoritma:**
  - Error ditangkap di setiap tahap, ditampilkan di UI.
- **Status:** Sudah diimplementasikan

---

Semua fitur di atas sudah diimplementasikan sesuai algoritma yang dijelaskan. Jika ada opsi baru, tambahkan penjelasan dan algoritmanya di sini.