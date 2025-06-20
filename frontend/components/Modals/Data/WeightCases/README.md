# Fitur: Weight Cases

Dokumen ini menjelaskan fungsionalitas dan arsitektur dari fitur "Weight Cases", yang memungkinkan pengguna untuk memberikan bobot pada kasus (baris) dalam dataset berdasarkan nilai dari sebuah variabel numerik.

## Ringkasan Fungsionalitas

-   **Pembobotan Berdasarkan Variabel**: Pengguna dapat memilih satu variabel numerik dari daftar. Nilai dari variabel ini akan digunakan untuk membobot setiap kasus dalam analisis statistik berikutnya.
-   **Validasi Tipe**: Fitur ini secara otomatis hanya menampilkan variabel numerik sebagai kandidat untuk pembobotan. Jika variabel non-numerik (string) coba digunakan, sebuah pesan kesalahan akan muncul.
-   **Penanganan Kasus Khusus**: Kasus (baris) yang memiliki nilai nol, negatif, atau hilang (*missing*) pada variabel pembobot akan secara otomatis dikecualikan dari analisis yang menggunakan pembobotan ini.
-   **Status Global**: Pengaturan pembobotan ini disimpan secara global di `useMetaStore` dan akan diterapkan pada analisis-analisis lain yang mendukungnya. Pengguna dapat melihat status pembobotan saat ini di dalam dialog.
-   **Menonaktifkan Pembobotan**: Untuk menonaktifkan pembobotan, pengguna cukup menghapus variabel dari kolom "Weight cases by".

## Arsitektur & Pola Desain

Fitur ini telah direfaktor agar selaras dengan panduan arsitektur utama proyek.

```
/WeightCases
├── 📂 hooks/
│   └── 📄 useWeightCases.ts  // Mengelola state & logika UI.
├── 📄 index.tsx              // Titik masuk & perakit (Orchestrator).
├── 📄 README.md              // Dokumen ini.
└── 📄 types.ts              // Definisi tipe TypeScript.
```

-   **`index.tsx` (Orchestrator & UI)**: Karena UI untuk fitur ini cukup sederhana, komponen UI (`WeightCasesContent`) dan perakit (`WeightCasesModal`) digabungkan dalam satu file, namun tetap dengan pemisahan logis. Perakit memanggil *hook* dan menyalurkan *props* ke komponen UI.
-   **`hooks/useWeightCases.ts` (Hook Logika)**: Jantung dari fitur ini. Ia mengelola semua state (variabel yang tersedia, variabel pembobot), menangani interaksi pengguna (memindahkan variabel), dan berkomunikasi dengan `useMetaStore` untuk menyimpan atau menghapus konfigurasi pembobotan.
-   **`types.ts` (Definisi Tipe)**: Mendefinisikan `WeightCasesModalProps` dan `WeightCasesUIProps` (yang diturunkan dari *return type* `useWeightCases`) untuk memastikan keamanan tipe.

## Alur Kerja

1.  **Inisialisasi**: `useWeightCases` diinisialisasi, mengambil daftar variabel dari `useVariableStore` dan status pembobotan saat ini dari `useMetaStore`.
2.  **Seleksi Variabel**: Pengguna menyeret variabel numerik yang valid ke dalam kotak "Weight cases by".
3.  **Konfirmasi**:
    -   Pengguna mengklik "OK".
    -   Fungsi `handleSave` dari *hook* dipanggil.
    -   Nama variabel pembobot disimpan ke dalam `useMetaStore` melalui `setMeta({ weight: 'nama_variabel' })`.
    -   Dialog ditutup.
4.  **Reset/Hapus Pembobotan**:
    -   Pengguna menghapus variabel dari kotak atau mengklik "Reset".
    -   `handleSave` dipanggil (jika OK diklik setelah menghapus) atau `handleReset` dipanggil.
    -   `setMeta({ weight: '' })` dipanggil, menghapus konfigurasi pembobotan dari state global. 