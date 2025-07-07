# Fitur: Dataset Contoh (Example Dataset)

Dokumen ini menguraikan fungsionalitas fitur "Dataset Contoh", yang menyediakan akses mudah ke kumpulan data sampel untuk pengguna.

## 1. Gambaran Umum

Fitur ini dirancang untuk memungkinkan pengguna, terutama yang baru, agar dapat segera memulai eksplorasi dan analisis tanpa perlu menyediakan file data mereka sendiri. Sebuah modal menampilkan daftar dataset `.sav` yang telah disiapkan sebelumnya, yang dapat dimuat ke dalam aplikasi hanya dengan satu klik.

## 2. Komponen Antarmuka & Fungsionalitas

-   **Header**: Menampilkan judul "Example Data" dan deskripsi singkat, memberikan konteks kepada pengguna.
-   **Daftar Dataset**: Komponen utama yang menampilkan serangkaian tombol. Setiap tombol mewakili satu file dataset contoh (`.sav`), menampilkan nama filenya dengan jelas.
-   **Indikator Loading**: Saat sebuah dataset sedang diproses, sebuah overlay dengan ikon pemuatan (`Loader2`) akan muncul, menonaktifkan interaksi lebih lanjut hingga proses selesai.
-   **Pesan Error**: Jika terjadi kesalahan selama proses pengambilan atau pemrosesan file, sebuah `Alert` akan ditampilkan di bagian atas, menjelaskan masalah yang terjadi.
-   **Tombol Cancel**: Sebuah tombol di bagian footer yang memungkinkan pengguna untuk menutup modal tanpa memuat dataset apa pun.

## 3. Alur Kerja & Logika

1.  **Inisiasi**: Pengguna membuka modal "Dataset Contoh".
2.  **Pemilihan**: Pengguna mengklik salah satu tombol dataset dari daftar.
3.  **Aksi `loadDataset`**: Fungsi `loadDataset` dari hook `useExampleDatasetLogic` dipanggil dengan path file yang dipilih.
4.  **Pengambilan File**: Logika di dalam `services.ts` melakukan `fetch` ke path publik dari file yang dipilih (misalnya, `/exampleData/accidents.sav`).
5.  **Pengiriman ke Backend**: File yang telah diambil kemudian dibungkus dalam `FormData` dan dikirim ke endpoint API backend yang sama dengan yang digunakan untuk unggahan file manual. Ini memastikan logika pemrosesan file terpusat di backend.
6.  **Pembaruan State**: Setelah backend mengembalikan data yang telah diproses (variabel, matriks data, dan metadata), state global aplikasi (Zustand stores: `useVariableStore`, `useDataStore`, `useMetaStore`) di-overwrite dengan data baru.
7.  **Selesai**: Setelah data berhasil dimuat, modal secara otomatis ditutup (`onClose()`), dan pengguna akan melihat data yang baru dimuat di grid utama.

## 4. Rencana Pengembangan di Masa Depan

-   **Dukungan Tipe File Lain**: Menambahkan dataset contoh dalam format lain seperti `.csv` atau `.xlsx`. Struktur file `example-datasets.ts` sudah siap untuk ini.
-   **Deskripsi Dataset**: Menambahkan deskripsi singkat atau tooltip untuk setiap dataset yang menjelaskan konteks data dan analisis apa yang cocok untuk dilakukan.
-   **Fungsi Pencarian/Filter**: Mengimplementasikan bar pencarian untuk memudahkan pengguna menemukan dataset tertentu, terutama jika daftarnya bertambah banyak.
-   **Pratinjau Data**: Memberikan kemampuan untuk melihat pratinjau beberapa baris dan kolom dari dataset sebelum memutuskan untuk memuatnya secara penuh.

## 5. Strategi Pengujian (Unit Testing)

> Semua pengujian berada di `components/Modals/File/ExampleDataset/__tests__/` dan mengikuti pola umum proyek (React-Testing-Library + Jest).

| Berkas | Fokus |
|--------|-------|
| `ExampleDatasetModal.test.tsx` | Pengujian UI untuk modal: render daftar file, interaksi klik (memanggil `loadDataset`), overlay loading, pesan error, dan tombol Cancel. |
| `useExampleDatasetLogic.test.ts` | Pengujian hook: alur pemuatan dataset (loading state ➜ fetch ➜ overwrite store ➜ close), pemanggilan store (`overwriteAll`, `resetData`, `setMeta`), serta penanganan error. |
| `services.test.ts` *(opsional)* | Pengujian utilitas/service: mock `fetch` dan `uploadSavFile` untuk memastikan alur jaringan berjalan benar. |

### Cara Menambah Pengujian Baru
1. Tambahkan berkas tes di folder `__tests__`.
2. Perbarui tabel di atas **dan** indeks pengujian sentral pada `components/Modals/File/README.md`.

---

_Last updated: <!-- KEEP THIS COMMENT: the CI tool replaces it with commit SHA & date -->_ 