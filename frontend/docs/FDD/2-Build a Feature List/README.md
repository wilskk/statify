Tentu, berdasarkan dokumen yang Anda berikan, berikut adalah dokumentasi langkah demi langkah tentang cara membuat *Feature List* dalam metodologi Feature-Driven Development (FDD).

Proses ini dijelaskan secara rinci dalam **Bab 8: Build a Features List**.

### Tujuan dan Prinsip Utama

Tujuan dari proses ini adalah untuk melakukan **dekomposisi fungsional** dari domain masalah untuk menghasilkan daftar fitur yang formal dan terstruktur secara hierarkis. Ini bukanlah sesi *brainstorming* (yang sebagian besar terjadi di proses 1: *Develop an Overall Object Model*), melainkan aktivitas untuk merekam persyaratan fungsional secara formal.

Prinsip utamanya adalah:
*   **Fokus pada Nilai Klien:** Fitur harus merupakan bagian kecil dari fungsionalitas yang bernilai bagi klien (pemilik bisnis/proyek).
*   **Hierarki:** Daftar fitur diorganisir dalam tiga tingkat:
    1.  **Area (Major Feature Sets):** Area fungsional utama.
    2.  **Aktivitas (Feature Sets):** Sekelompok fitur yang membentuk satu aktivitas bisnis.
    3.  **Langkah (Features):** Langkah-langkah individual dalam sebuah aktivitas.
*   **Granularitas:** Sebuah fitur harus cukup kecil untuk diselesaikan dalam waktu tidak lebih dari dua minggu. Jika lebih besar, fitur tersebut harus dipecah menjadi langkah-langkah yang lebih kecil.

---

### Langkah-langkah Membuat Feature List

Berikut adalah langkah-langkah praktis untuk membangun *Feature List* sesuai dokumen:

#### Langkah 1: Bentuk Tim Feature List (Form the Features List Team)
Tim ini bertanggung jawab untuk menyusun daftar fitur.
*   **Anggota Utama:** Terutama terdiri dari para **Chief Programmer** yang telah berpartisipasi dalam proses pemodelan objek (Proses 1).
*   **Peran Pendukung:** **Domain Experts** (Ahli Domain) tidak harus terlibat penuh waktu, tetapi harus siap sedia untuk menjawab pertanyaan, memberikan klarifikasi, dan meninjau hasilnya untuk memastikan tidak ada yang terlewat.

(Referensi: Halaman 138, "The Form the Features List Team Task")

#### Langkah 2: Lakukan Dekomposisi Fungsional (Perform Functional Decomposition)
Ini adalah inti dari proses pembuatan *feature list*.
*   **Input:** Gunakan semua informasi yang telah dikumpulkan pada proses sebelumnya, seperti:
    *   Catatan dari *domain walkthrough*.
    *   Diagram sekuensial (jika ada).
    *   Dokumen persyaratan yang sudah ada (spesifikasi fungsional, *use case*, panduan pengguna, dll.).
*   **Proses:** Mulailah dengan dekomposisi tingkat tinggi yang digunakan oleh Domain Experts saat *walkthrough*. Pecah domain menjadi:
    1.  **Area (Major Feature Sets):** Identifikasi area bisnis utama. Contoh dari dokumen: **Manajemen Servis Mobil**.
    2.  **Aktivitas (Feature Sets):** Di dalam setiap area, identifikasi aktivitas-aktivitas bisnis. Contoh dari dokumen: *Penjadwalan Servis*, *Melakukan Servis*, *Penagihan Servis*.
    3.  **Langkah (Features):** Untuk setiap aktivitas, rinci langkah-langkah yang membentuknya. Inilah yang menjadi fitur individual.

(Referensi: Halaman 139, "The Build the Features List Task" dan Halaman 140, "Tips for the Features List Team")

#### Langkah 3: Gunakan Template Penamaan Fitur (Use the Feature Naming Template)
Setiap fitur harus ditulis menggunakan format yang konsisten untuk memastikan kejelasan dan fokus pada nilai bagi klien. Template yang digunakan adalah:

**`<tindakan> <hasil> <objek>`**

Contoh dari dokumen (Halaman 139 & 142):
*   `Calculate the total of a sale` (Menghitung total dari sebuah penjualan).
*   `Record a list of parts used for a service` (Mencatat daftar suku cadang yang digunakan untuk servis).
*   `Send a bill to a customer` (Mengirim tagihan ke pelanggan).

**Tips Khusus (Halaman 141):** Untuk fitur yang terkait dengan pembuatan/penghapusan objek sistem yang signifikan (misalnya, membuat pengguna baru), di mana "untuk apa" tidak jelas, disarankan untuk menggunakan format seperti `Create a new mechanic for a Mechanic List` (Membuat mekanik baru untuk Daftar Mekanik).

#### Langkah 4: Pisahkan Fitur Berdasarkan *Layer*
Dokumen ini menekankan pentingnya memisahkan jenis fitur untuk menjaga fokus.
*   **Daftar Utama:** Berisi fitur-fitur **Problem Domain (PD)**.
*   **Daftar Terpisah:** Buat daftar terpisah untuk fitur **User Interface (UI)** dan fitur **System Interaction (SI)**. Ini membantu dalam menautkan fitur-fitur tersebut ke fitur PD yang relevan nanti.

(Referensi: Halaman 141, "Tips for the Features List Team", Poin 5)

#### Langkah 5: Dokumentasikan Hasilnya
Hasil akhir harus dicatat dalam format yang mudah diakses dan dikelola.
*   **Alat:** Dokumen menyarankan penggunaan *spreadsheet*, *database* sederhana, atau alat manajemen persyaratan formal.
*   **Struktur Tabel:** Minimal, setiap entri fitur harus memiliki kolom berikut (berdasarkan Tabel 8-1 di halaman 142):
    *   **Feature #** (Nomor Fitur)
    *   **Major Feature Set** (Area)
    *   **Feature Set** (Aktivitas)
    *   **Feature Name** (Nama Fitur, sesuai template)
    *   **Requirements Cross-ref** (Referensi Silang ke dokumen persyaratan sumber)

(Referensi: Halaman 142, "Hints for the Features List Team")

---

### Kriteria Keluar (Exit Criteria)

Proses "Build a Features List" dianggap selesai ketika tim telah menghasilkan daftar fitur yang memuaskan Manajer Proyek dan Manajer Pengembangan. Daftar ini harus terdiri dari:
1.  Daftar semua **Major Feature Sets** (area).
2.  Untuk setiap Major Feature Set, daftar semua **Feature Sets** (aktivitas) di dalamnya.
3.  Untuk setiap Feature Set, daftar semua **Features** (langkah) yang mewakili setiap langkah dalam aktivitas tersebut.

(Referensi: Halaman 143, "Exit Criteria")

Dengan mengikuti langkah-langkah ini, tim akan menghasilkan *Feature List* yang terstruktur, komprehensif, dan siap digunakan untuk proses selanjutnya, yaitu **Plan by Feature** (Perencanaan Berdasarkan Fitur).