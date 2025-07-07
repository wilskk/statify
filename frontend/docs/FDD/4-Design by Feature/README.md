Tentu, berdasarkan dokumen yang Anda berikan, berikut adalah dokumentasi lengkap dan detail untuk **Tahap 4: Design by Feature (Merancang Berdasarkan Fitur)** dalam metodologi Feature-Driven Development (FDD).

Tahap ini disebut sebagai "ruang mesin" (*engine-room*) dari proyek FDD, di mana fungsi-fungsi yang bernilai bagi klien mulai dirancang secara detail. Tujuannya adalah untuk menghasilkan **"Paket Desain" (Design Package)** yang telah berhasil diinspeksi untuk sekelompok kecil fitur.

---

### **Gambaran Umum Proses 4: Design by Feature**

Proses ini dilakukan secara iteratif untuk setiap paket pekerjaan (Work Package) yang dikelola oleh seorang Chief Programmer. Satu iterasi biasanya berlangsung beberapa hari hingga maksimal dua minggu.

Diagram alir proses ini (berdasarkan Gambar 10-1) terdiri dari beberapa subtugas:
1.  Bentuk Tim Fitur (Form a Feature Team)
2.  Lakukan Penelusuran Domain (Conduct a Domain Walkthrough) - *Opsional*
3.  Pelajari Dokumen Referensi (Study the Referenced Docs) - *Opsional*
4.  Kembangkan Diagram Urutan (Develop the Sequence Diagrams)
5.  Sempurnakan Model Objek (Refine the Object Model)
6.  Tulis Prolog Kelas dan Metode (Write Class and Method Prologue)
7.  Lakukan Inspeksi Desain (Design Inspection)

### **Detail Setiap Subtugas dan Artefak yang Dihasilkan**

Berikut adalah rincian setiap langkah, apa yang harus dilakukan, dan aset/artefak apa yang harus dibuat.

#### **1. Membentuk Tim Fitur (Form a Feature Team)**
*   **Tujuan:** Menentukan fitur-fitur yang akan dikerjakan dalam iterasi ini dan membentuk tim pengembang (Feature Team) yang akan mengerjakannya.
*   **Aktivitas:**
    *   Chief Programmer memilih sekelompok kecil fitur dari daftar tugasnya yang logis untuk dikerjakan bersama.
    *   Berdasarkan fitur-fitur tersebut, Chief Programmer mengidentifikasi kelas-kelas dalam model objek yang akan terpengaruh.
    *   Dengan menggunakan daftar kepemilikan kelas (Class Ownership List), Chief Programmer menentukan para pengembang (Class Owners) yang akan terlibat. Tim inilah yang disebut **Feature Team**.
*   **Aset/Artefak yang Dihasilkan:**
    *   **Pembaruan pada Work Package:** Chief Programmer memulai sebuah **Work Package** baru atau memperbarui yang sudah ada. Bagian awal dari work package ini diisi dengan:
        *   Daftar fitur yang akan diimplementasikan (misal: Fitur #0004, #0005, #0018 pada Gambar 10-2).
        *   Daftar anggota Feature Team beserta kelas yang mereka miliki.
        *   Tanggal rencana (Planned Date) untuk setiap milestone dalam iterasi (Walkthrough, Design, Design Review, dll.).

#### **2. Melakukan Penelusuran Domain (Conduct a Domain Walkthrough) - *Opsional***
*   **Tujuan:** Memastikan seluruh anggota Feature Team memiliki pemahaman detail dan mendalam tentang algoritma, aturan bisnis, dan data yang diperlukan untuk fitur yang sedang dirancang.
*   **Aktivitas:**
    *   Chief Programmer menjadwalkan sesi dengan Domain Expert.
    *   Domain Expert menjelaskan secara rinci detail teknis dan bisnis dari fitur tersebut kepada seluruh Feature Team.
    *   Tim dapat bertanya untuk mengklarifikasi keraguan.
*   **Aset/Artefak yang Dihasilkan:**
    *   **Catatan Rapat (Meeting Notes):** Dokumentasi hasil diskusi, bisa berupa notulensi rapat, daftar Q&A, atau catatan informal lainnya.
    *   **Pembaruan pada Work Package:** Menambahkan referensi ke dokumen catatan rapat (seperti "CS1 Walkthrough Notes" pada Gambar 10-3).

#### **3. Mempelajari Dokumen Referensi (Study the Referenced Documents) - *Opsional***
*   **Tujuan:** Mempelajari dokumentasi teknis atau bisnis yang ada (misalnya, spesifikasi fungsional, manual kebijakan, use case) untuk memahami detail fitur.
*   **Aktivitas:** Feature Team secara bersama-sama atau individual membaca dan menganalisis dokumen-dokumen yang relevan.
*   **Aset/Artefak yang Dihasilkan:**
    *   **Peningkatan Pemahaman Tim:** Hasil utama adalah pemahaman yang lebih baik, bukan dokumen baru.
    *   **Pembaruan pada Work Package:** Menambahkan daftar dokumen yang direferensikan ke dalam work package (seperti "Manufacturers Handbook for Mechanics" pada Gambar 10-4).

#### **4. Mengembangkan Diagram Urutan (Develop the Sequence Diagrams)**
*   **Tujuan:** Merancang interaksi antar objek secara detail untuk mengimplementasikan setiap fitur.
*   **Aktivitas:**
    *   Feature Team bekerja sama di depan papan tulis (whiteboard) untuk merancang alur interaksi objek.
    *   Mereka membuat **UML Sequence Diagram** untuk setiap fitur.
    *   Setiap Class Owner bertanggung jawab atas perilaku objek dari kelas yang dimilikinya.
    *   Setiap alternatif desain atau keputusan penting didokumentasikan.
*   **Aset/Artefak yang Dihasilkan:**
    *   **UML Sequence Diagram:** Satu atau lebih diagram untuk setiap fitur (lihat contoh pada Gambar 10-5).
    *   **Catatan Alternatif Desain:** Dokumentasi untuk setiap pilihan desain yang dipertimbangkan dan alasan mengapa desain akhir yang dipilih.
    *   **Pembaruan pada Work Package:** Menambahkan daftar Sequence Diagram yang telah dibuat (lihat Gambar 10-6).

#### **5. Menyempurnakan Model Objek (Refine the Object Model)**
*   **Tujuan:** Memperbarui model objek keseluruhan dengan kelas, atribut, dan operasi baru yang ditemukan selama pembuatan sequence diagram.
*   **Aktivitas:** Chief Programmer (atau anggota tim yang ditunjuk) memperbarui diagram kelas di alat pemodelan (modeling tool). Ini termasuk menambahkan:
    *   Kelas-kelas baru yang mungkin diperlukan.
    *   Atribut dan metode (operasi) baru pada kelas yang sudah ada.
    *   Memperbarui hubungan antar kelas jika ada perubahan.
*   **Aset/Artefak yang Dihasilkan:**
    *   **Model Objek yang Diperbarui (Updated Object Model):** Versi terbaru dari diagram kelas (Class Diagram) yang mencerminkan desain detail (lihat contoh pada Gambar 10-7).
    *   **Pembaruan pada Work Package:** Menambahkan referensi ke diagram kelas yang telah diperbarui (lihat Gambar 10-8).

#### **6. Menulis Prolog Kelas dan Metode (Write Class and Method Prologue)**
*   **Tujuan:** Mendokumentasikan *apa* yang akan dilakukan oleh kelas dan metode sebelum kode sebenarnya ditulis.
*   **Aktivitas:** Setiap Class Owner membuka file source code untuk kelasnya dan menambahkan komentar dokumentasi standar (seperti Javadoc) untuk setiap kelas, atribut, dan metode baru yang telah diidentifikasi pada langkah sebelumnya.
*   **Aset/Artefak yang Dihasilkan:**
    *   **Source Code dengan Prolog:** File kode yang sudah berisi kerangka dan dokumentasi, namun implementasi metodenya masih kosong.
    *   **Dokumentasi yang Dihasilkan Otomatis (misal: Javadoc HTML):** Ini dapat di-hyperlink dari work package.

#### **7. Melakukan Inspeksi Desain (Design Inspection)**
*   **Tujuan:** Memverifikasi bahwa desain yang telah dibuat sudah benar, lengkap, konsisten, dan siap untuk diimplementasikan.
*   **Aktivitas:** Seluruh Feature Team (dan terkadang Chief Programmer lain jika dampaknya luas) melakukan tinjauan formal terhadap seluruh artefak yang dihasilkan dalam **Design Package**. Mereka mencari cacat (defect), bukan solusi.
*   **Aset/Artefak yang Dihasilkan:**
    *   **Laporan Inspeksi Desain (Design Inspection Report):** Dokumen formal yang berisi:
        *   Informasi sesi (inspektor, tanggal, lokasi).
        *   Daftar semua cacat, saran, dan komentar yang ditemukan.
        *   Hasil keseluruhan (misal: Diterima, Diterima dengan revisi minor, Ditolak dengan revisi mayor).
        *   Tanda tangan jika diperlukan.
    *   **Daftar Tugas (To-Do List):** Daftar tindakan konkret yang harus dilakukan untuk memperbaiki cacat yang ditemukan.
    *   **Pembaruan Final pada Work Package:** Mengisi tanggal aktual (Actual Date) untuk milestone "Design Review" dan menambahkan hasil inspeksi (lihat Gambar 10-9).

---

### **Aset dan Artefak Utama yang Harus Dibuat dan Dilaporkan**

Secara ringkas, inilah aset dan artefak kunci dari Tahap 4:

1.  **Work Package (Paket Pekerjaan)**
    *   **Deskripsi:** Ini adalah artefak sentral yang berfungsi sebagai **laporan kemajuan internal** untuk iterasi. Ini adalah dokumen hidup yang diperbarui di setiap subtugas.
    *   **Isi:** Daftar fitur, tim, jadwal, referensi ke dokumen lain, dan status (Planned vs. Actual).
    *   **Pelaporan:** Laporan kemajuan kepada Chief Programmer dan anggota tim lainnya tentang sejauh mana iterasi telah berjalan.

2.  **Design Package (Paket Desain)**
    *   **Deskripsi:** Ini adalah **output utama dan final** dari seluruh Proses 4. Ini adalah kumpulan semua hasil desain yang siap diserahkan ke Proses 5 (Build by Feature).
    *   **Isi (berdasarkan Exit Criteria pada Gambar 10-9 dan halaman 76):**
        *   **Memo Pengantar (Covering Memo):** Menjelaskan isi paket desain.
        *   **Dokumen Persyaratan Terkait (Referenced Requirements):** Link ke dokumen spesifikasi, catatan walkthrough, dll.
        *   **Diagram Urutan (Sequence Diagram(s)):** Artefak desain utama yang menunjukkan interaksi objek.
        *   **Catatan Alternatif Desain (Design Alternatives):** Penjelasan untuk keputusan desain yang signifikan.
        *   **Model Objek yang Diperbarui (Updated Object Model):** Class diagram terbaru.
        *   **Prolog Kelas dan Metode:** Output dari tool dokumentasi (misal: Javadoc).
        *   **Daftar Tugas (To-Do List):** Hasil dari inspeksi desain.
    *   **Pelaporan:** Ini adalah laporan desain formal yang menjadi input untuk tahap implementasi.

3.  **Laporan Inspeksi Desain (Design Inspection Report)**
    *   **Deskripsi:** Laporan formal yang mendokumentasikan hasil dari aktivitas verifikasi kritis.
    *   **Isi:** Detail tentang cacat yang ditemukan dan hasil akhir inspeksi.
    *   **Pelaporan:** Melaporkan kualitas desain kepada Chief Programmer dan memastikan semua masalah dicatat sebelum melangkah ke tahap pengkodean.

Dengan menyelesaikan semua langkah ini dan menghasilkan artefak-artefak tersebut, tim telah berhasil menyelesaikan Proses 4 dan siap untuk mulai menulis kode di Proses 5.