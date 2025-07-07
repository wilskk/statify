Tentu, berikut adalah dokumentasi lengkap untuk Tahap 5 dari Feature-Driven Development (FDD), yaitu **"Build by Feature" (Membangun berdasarkan Fitur)**. Dokumentasi ini disusun berdasarkan detail dari materi yang Anda berikan, termasuk artefak, laporan, dan aktivitas yang terlibat.

---

### **Dokumentasi Lengkap FDD: Proses 5 - Membangun Berdasarkan Fitur (Build by Feature)**

Proses 5 adalah fase "ruang mesin" dari FDD, di mana desain yang telah dibuat pada Proses 4 diubah menjadi kode yang berfungsi, teruji, dan terintegrasi. Proses ini mengikuti langsung setelah Proses 4 (Design by Feature) untuk sekelompok fitur yang sama. Tujuannya adalah untuk menghasilkan fungsi yang bernilai bagi klien (fitur yang utuh) yang siap untuk diintegrasikan ke dalam build utama.

**Tujuan Utama Proses 5:**
Mengimplementasikan, menguji, memeriksa, dan mempromosikan kode untuk satu atau lebih fitur ke dalam build utama, sehingga fitur tersebut dianggap **"selesai"**.

---

### **Aktivitas, Aset, dan Artefak dalam Proses 5**

Proses 5 terdiri dari beberapa tugas inti yang berurutan. Berikut adalah rincian setiap tugasnya:

#### **1. Implementasi Class dan Method (Implement Classes and Methods)**

Ini adalah aktivitas pengkodean aktual berdasarkan paket desain (design package) dari Proses 4.

*   **Pelaku Utama:** **Class Owner** (Developer yang bertanggung jawab atas sebuah class).
*   **Aktivitas Detail:**
    1.  Class Owner menulis atau memodifikasi kode sumber (source code) untuk class mereka agar sesuai dengan diagram sekuens (sequence diagrams) dan model objek yang telah disempurnakan.
    2.  Jika ada kendala tak terduga yang ditemukan saat pengkodean, Class Owner berdiskusi dengan **Chief Programmer** untuk menentukan tindakan selanjutnya. Masalah kecil mungkin diselesaikan langsung, tetapi masalah besar mungkin memerlukan kembali ke Proses 4 untuk merevisi desain.
    3.  Implementasi ini harus menjadi latihan yang relatif sederhana jika desain pada Proses 4 dilakukan dengan matang.
*   **Aset & Artefak yang Dihasilkan:**
    *   **File Kode Sumber (.java, .cs, .cpp, dll.):** Ini adalah output utama. Kode yang telah diubah atau yang baru dibuat.
    *   **Pembaruan pada *Work Package*:** Versi terbaru dari file kode sumber dicatat dan di-hyperlink dalam *Work Package* untuk penelusuran. Seperti yang terlihat pada **Gambar 11-2**, kolom `Class Version` diperbarui dan bisa di-hyperlink ke file fisik atau repositori.

#### **2. Pengujian Unit (Unit Testing)**

Aktivitas ini memastikan bahwa setiap unit kode (class, method) berfungsi dengan benar secara terisolasi.

*   **Pelaku Utama:** **Class Owner**.
*   **Aktivitas Detail:**
    1.  Class Owner menulis kode pengujian (test code) untuk memverifikasi fungsionalitas baru atau yang diubah.
    2.  FDD bersifat fleksibel; teknik seperti Test-Driven Development (TDD) dari Extreme Programming dapat diadopsi di sini.
    3.  Tes dijalankan untuk memastikan kode lulus semua skenario yang diharapkan.
    4.  Chief Programmer menentukan apakah pengujian level fitur yang lebih luas (melibatkan interaksi beberapa class) diperlukan, terutama untuk fitur yang kompleks.
*   **Aset & Artefak yang Dihasilkan:**
    *   **Kode Pengujian Unit:** File kode yang berisi skrip pengujian.
    *   **Laporan Hasil Pengujian Unit (*Unit Test Results*):** Hasil dari eksekusi tes. Ini tidak harus berupa dokumen formal; sering kali cukup berupa status "Passed" atau "Failed".
    *   **Pembaruan pada *Work Package*:** Kolom `Unit Test Results` di dalam *Work Package* diisi dengan status "Passed", seperti yang ditunjukkan pada **Gambar 11-5**.

#### **3. Inspeksi Kode (Code Inspection)**

Ini adalah tinjauan formal terhadap kode sumber oleh sesama anggota tim untuk mendeteksi cacat (defects).

*   **Pelaku Utama:** **Feature Team** (terdiri dari Chief Programmer dan Class Owners yang terlibat), dimoderasi oleh **Chief Programmer**.
*   **Aktivitas Detail:**
    1.  Chief Programmer menjadwalkan sesi inspeksi.
    2.  Anggota tim meninjau kode sebelum pertemuan untuk mencari kesalahan logika, pelanggaran standar pengkodean, atau potensi bug.
    3.  Selama pertemuan, tim membahas temuan mereka. Fokusnya adalah pada **deteksi cacat**, bukan penyelesaiannya.
    4.  Sesi inspeksi idealnya tidak lebih dari dua jam untuk menjaga efektivitas.
*   **Aset & Artefak yang Dihasilkan:**
    *   **Laporan Inspeksi Kode (*Code Inspection Report*):** Ini adalah artefak krusial dan harus didokumentasikan. Berdasarkan **Gambar 11-3**, laporan ini berisi:
        *   **Informasi Umum:** Reviewer, Lokasi, Tanggal, Waktu Mulai & Selesai.
        *   **Hasil (*Result*):** Salah satu dari:
            *   **Accepted: As is** (Diterima tanpa perubahan).
            *   **Accepted: With Minor Modifications** (Diterima dengan perbaikan kecil, tidak perlu inspeksi ulang).
            *   **Rejected: With Major Changes** (Ditolak, perlu perbaikan besar dan inspeksi ulang).
            *   **Rejected: Total Rework** (Ditolak, perlu pengerjaan ulang total).
        *   **Daftar Cacat (*Defects Found*):** Tabel yang merinci setiap cacat yang ditemukan, berisi:
            *   **Severity** (Tingkat Keparahan: Minor, Major).
            *   **Location** (Lokasi: Nama class dan nomor baris).
            *   **Description** (Deskripsi singkat tentang masalah).
    *   **Pembaruan pada *Work Package*:** Hasil dari inspeksi (misalnya "Accepted: With Minor Changes") dicatat dalam *Work Package* seperti pada **Gambar 11-4**.

#### **4. Promosi ke Build (Promote to the Build)**

Ini adalah langkah terakhir dalam siklus, di mana kode yang sudah selesai secara resmi diintegrasikan ke dalam build utama proyek.

*   **Pelaku Utama:** **Chief Programmer**.
*   **Aktivitas Detail:**
    1.  Chief Programmer memastikan bahwa sebuah fitur telah melewati semua tahap sebelumnya: implementasi selesai, pengujian unit lulus, dan inspeksi kode diterima.
    2.  Chief Programmer mengintegrasikan (check-in) kode sumber dari area kerja tim fitur ke dalam repositori utama (build system).
    3.  Setelah dipromosikan, fitur tersebut menjadi bagian dari build reguler dan tersedia untuk pengujian sistem formal, demonstrasi kepada klien, atau untuk didokumentasikan dalam manual pengguna.
*   **Definisi "Selesai":** Sebuah fitur baru dianggap **"selesai"** setelah berhasil dipromosikan ke build.
*   **Aset & Artefak yang Dihasilkan:**
    *   **Versi Build Baru:** Build utama proyek diperbarui dengan fungsionalitas baru.
    *   ***Work Package* yang Telah Selesai:** Semua kolom tanggal aktual (`Actual`) dalam *Work Package* untuk fitur tersebut terisi. Ini menjadi catatan historis bahwa siklus pengembangan untuk fitur tersebut telah selesai. **Gambar 11-6** menunjukkan contoh *Work Package* yang telah lengkap.

---

### **Ringkasan Laporan dan Artefak Kunci untuk Proses 5**

Untuk menyelesaikan Proses 5, tim harus menghasilkan dan memperbarui beberapa dokumen penting. Semuanya terkonsolidasi dalam **Work Package** untuk kemudahan pelacakan.

1.  **Work Package (Paket Kerja):**
    *   Ini adalah dokumen pusat yang melacak kemajuan fitur dari awal hingga akhir. Pada akhir Proses 5, *Work Package* adalah artefak yang paling lengkap.
    *   **Isi yang Diperbarui pada Proses 5:**
        *   **Class Version:** Versi final dari setiap class yang terlibat.
        *   **Unit Test Results:** Status kelulusan tes unit (misal: "Passed").
        *   **Design Inspection Reports:** Hasil inspeksi desain dari Proses 4 (sebagai referensi).
        *   **Code Inspection Reports:** Laporan hasil inspeksi kode yang baru dibuat.
        *   **Tanggal Aktual:** Semua tanggal penyelesaian aktual untuk setiap milestone (Walkthrough, Design, Design Review, Development, Code Inspection, Promote to Build) diisi.

2.  **Laporan Inspeksi Kode (Code Inspection Report):**
    *   Dokumen terpisah yang merinci temuan dari sesi inspeksi kode. Ini dilampirkan atau di-hyperlink dari *Work Package*.

3.  **Kode Sumber (Source Code) dan Kode Tes (Test Code):**
    *   Aset paling fundamental yang dihasilkan. Disimpan dalam sistem kontrol versi (version control system).

### **Kriteria Keluar (Exit Criteria) dari Proses 5**

Sebuah tim fitur berhasil keluar dari Proses 5 jika:
1.  Pengembangan satu atau lebih fitur yang utuh dan bernilai bagi klien telah selesai.
2.  Semua class yang mendukung fitur tersebut telah berhasil diimplementasikan, diinspeksi kode-nya, dan lulus pengujian unit.
3.  Kode untuk fitur tersebut telah **dipromosikan ke build utama** oleh Chief Programmer.
4.  Tim fitur dibubarkan (untuk iterasi ini), dan Chief Programmer siap untuk memulai siklus Proses 4 & 5 berikutnya untuk set fitur selanjutnya.