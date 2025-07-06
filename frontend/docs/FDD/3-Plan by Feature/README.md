Tentu, berikut adalah dokumentasi lengkap dan detail untuk Tahap 3 dari proses Feature-Driven Development (FDD), yaitu **"Plan By Feature" (Merencanakan Berdasarkan Fitur)**, berdasarkan materi yang Anda berikan.

Dokumentasi ini mencakup tujuan, partisipan, aktivitas utama, serta aset dan artefak yang harus dibuat dan dilaporkan.

---

### **Dokumentasi Lengkap Tahap 3 FDD: Plan By Feature (Merencanakan Berdasarkan Fitur)**

**Tujuan Utama:**
Tahap 3 adalah proses terakhir dari tiga proses awal FDD yang bersifat project-wide. Setelah memiliki model objek awal (Tahap 1) dan daftar fitur yang terorganisir (Tahap 2), tujuannya adalah untuk **membuat rencana pengembangan awal**. Rencana ini mencakup:
1.  Menentukan urutan pengembangan fitur.
2.  Menugaskan tanggung jawab untuk setiap set fitur (feature set) kepada Chief Programmer.
3.  Menugaskan kepemilikan kelas (class ownership) kepada masing-masing developer.

Hasil dari tahap ini adalah sebuah rencana konkret yang siap digunakan untuk memulai fase konstruksi (Tahap 4 dan 5).

**Partisipan Utama (Tim Perencana):**
Tim yang terlibat dalam tahap ini biasanya terdiri dari:
*   **Project Manager:** Memfasilitasi proses, memastikan keseimbangan beban kerja, dan bertanggung jawab atas rencana akhir.
*   **Development Manager:** Membantu dalam alokasi sumber daya dan menyeimbangkan kebutuhan tim pengembangan.
*   **Chief Programmers:** Berperan aktif dalam menentukan urutan, mengestimasi kompleksitas, dan "memperebutkan" feature set yang akan mereka pimpin. Pengetahuan mereka dari Tahap 1 sangat krusial di sini.
*   **(Opsional) Domain Experts:** Dilibatkan jika ada perdebatan mengenai prioritas bisnis atau dependensi fungsional antar fitur.

---

### **Aktivitas Utama (Sub-Proses)**

Berdasarkan diagram alur pada Gambar 9-1 (hal. 44), tahap ini memiliki tiga aktivitas utama yang saling terkait dan seringkali dilakukan secara iteratif hingga tercapai keseimbangan.

#### **1. Menentukan Urutan Pengembangan (Determine the Development Sequence)**

*   **Tujuan:** Membuat jadwal kasar kapan setiap *feature set* akan diselesaikan. Ini bukan tentang tanggal pasti, melainkan urutan dan estimasi bulan penyelesaian.
*   **Proses & Pertimbangan (berdasarkan hal. 45 & 46):**
    *   **Dependensi Teknis:** Feature set mana yang harus diselesaikan terlebih dahulu karena feature set lain bergantung pada kelas-kelas di dalamnya.
    *   **Keseimbangan Beban Kerja:** Mendistribusikan pekerjaan secara merata di antara para Chief Programmer dan pemilik kelas (class owner).
    *   **Kompleksitas & Risiko:** Mendahulukan feature set yang berisiko tinggi atau sangat kompleks untuk mengidentifikasi masalah lebih awal.
    *   **Prioritas Bisnis:** Fitur mana yang paling bernilai bagi klien? Tanyakan pada klien/domain expert, "Apa yang Anda inginkan lebih dulu?"
    *   **Minimum Viable Product:** Mengidentifikasi kumpulan fitur minimal yang sudah memberikan nilai dan dapat di-deploy. Prioritaskan ini.
    *   **Milestone Eksternal:** Menyesuaikan jadwal dengan kebutuhan demo, rilis beta, atau laporan kemajuan ke manajemen.

#### **2. Menugaskan Feature Sets ke Chief Programmers (Assign Feature Sets to Chief Programmers)**

*   **Tujuan:** Memberikan tanggung jawab pengembangan sekelompok fitur (feature set) kepada seorang Chief Programmer.
*   **Proses & Pertimbangan (berdasarkan hal. 49):**
    *   Setiap Chief Programmer akan "memiliki" satu atau lebih feature set.
    *   Proses ini seringkali berupa diskusi (bahkan "perdebatan seru") di antara para Chief Programmer untuk mendapatkan feature set yang mereka inginkan, difasilitasi oleh Project Manager.
    *   **Keseimbangan:** Usahakan agar seorang Chief Programmer tidak menangani lebih dari 3 *major feature set* secara bersamaan untuk menghindari *context-switching* yang berlebihan. Sebarkan feature set yang kompleks dan yang sederhana secara merata.
    *   Hasil dari aktivitas ini adalah setiap Chief Programmer memiliki koleksi feature set yang menjadi tanggung jawabnya.

#### **3. Menugaskan Kelas ke Developer (Assign Classes to Developers)**

*   **Tujuan:** Menetapkan "pemilik" untuk setiap kelas dalam model objek. Pemilik kelas bertanggung jawab penuh atas pengembangan dan pemeliharaan kelas tersebut.
*   **Proses & Pertimbangan (berdasarkan hal. 50 & 51):**
    *   **Developer adalah Class Owner:** Ingat, Chief Programmer juga seorang developer dan akan memiliki beberapa kelas.
    *   **Identifikasi Kelas Kunci:** Kelas yang kompleks, berisiko tinggi, atau sering digunakan (high-use) harus diberikan kepada developer yang lebih berpengalaman.
    *   **Keseimbangan:**
        *   Jangan berikan terlalu banyak kelas yang saling terkait erat ke satu orang, karena ini akan membuat tim fitur menjadi sangat kecil (hanya 1-2 orang).
        *   Jangan juga menyebar kelas dari area yang sangat berbeda ke satu orang, karena akan menyebabkan *task-switching*.
    *   **Kecocokan Tim:** Pertimbangkan dinamika personal. Developer yang bekerja sama dengan baik bisa diberikan kelas-kelas yang sering berinteraksi.

---

### **Aset dan Artefak Utama yang Dihasilkan (Deliverables)**

Ini adalah output konkret yang harus dibuat, didokumentasikan, dan dilaporkan pada akhir Tahap 3.

#### **1. Daftar Fitur yang Sudah Diperbarui (Updated Features List)**

Ini adalah artefak utama dari Tahap 2 yang kini diperbarui dengan informasi perencanaan. Berdasarkan **Tabel 9-1 (hal. 53)**, tabel ini minimal memiliki kolom:
*   **Feature #:** ID unik untuk fitur.
*   **Major Feature Set:** Area fungsional utama (cth: Manajemen Servis).
*   **Feature Set:** Aktivitas bisnis di dalam area (cth: Menjadwalkan Servis).
*   **Feature Name:** Deskripsi fitur (cth: Jadwalkan servis untuk sebuah mobil).
*   **Requirements Cross-ref:** Referensi ke dokumen persyaratan.
*   **CP (Chief Programmer):** **(Kolom Baru)** Inisial Chief Programmer yang bertanggung jawab atas feature set ini.
*   **Date:** **(Kolom Baru)** Estimasi bulan dan tahun penyelesaian untuk feature set ini.

**Contoh Struktur Tabel:**
| Feature # | Major Feature Set | Feature Set         | Feature Name                    | CP  | Date  | Requirements Cross-ref |
|-----------|-------------------|---------------------|---------------------------------|-----|-------|------------------------|
| 18        | Service Management| Performing a Service| Record a service performed for a car | SRP | 9/01  | ...                    |
| 19        | Service Management| Performing a Service| Record a list of parts used...  | SRP | 9/01  | Mechanics Handbook     |

#### **2. Daftar Kepemilikan Kelas (Class Owner List)**

Ini adalah tabel sederhana yang memetakan setiap kelas ke developernya. Berdasarkan **Tabel 9-2 (hal. 54)**:

**Contoh Struktur Tabel:**
| Class Name         | Class Owner |
|--------------------|-------------|
| Car                | Barry       |
| CarOrder           | Harry       |
| ServiceReminder    | Carrie      |
| ServiceRepair      | Larry       |
| Mechanic           | Harry       |

#### **3. Laporan "Parking Lot" (Parking Lot Report)**

Ini adalah artefak pelaporan visual yang sangat khas FDD. Laporan ini memberikan gambaran umum kemajuan proyek dalam satu halaman. Berdasarkan **Gambar 9-2 (hal. 55)**, laporan ini berisi:
*   **Area Fungsional Utama (Major Feature Sets):** Dikelompokkan dalam kotak besar (cth: Workshop Management, Sales Management).
*   **Aktivitas/Set Fitur (Feature Sets):** Kotak-kotak yang lebih kecil di dalam setiap area.
*   **Informasi di setiap Kotak Feature Set:**
    *   Nama Feature Set (cth: Scheduling a Service).
    *   Jumlah total fitur di dalamnya (cth: (19)).
    *   **Inisial Chief Programmer (CP)** di pojok kanan atas.
    *   **Tanggal Penyelesaian (Bulan & Tahun)** di bagian bawah.
    *   **Persentase Kemajuan** di tengah (pada akhir Tahap 3, ini masih 0% untuk sebagian besar, kecuali ada pekerjaan yang sudah dimulai).

Artefak ini akan terus diperbarui sepanjang proyek dan menjadi alat pelaporan utama.

#### **4. (Opsional) Gantt Chart**

Jika manajemen atau stakeholder membutuhkan format pelaporan yang lebih tradisional, Gantt Chart dapat dibuat berdasarkan urutan dan tanggal penyelesaian feature set. Ini adalah artefak turunan, bukan artefak inti FDD.

---

### **Pelaporan (Reporting)**

Pada akhir Tahap 3, tim perencana harus melaporkan hal-hal berikut kepada manajemen, sponsor, atau klien:

1.  **Rencana Pengembangan Awal:** Disajikan dalam bentuk **Laporan Parking Lot** dan/atau **Gantt Chart**. Laporan ini menunjukkan:
    *   Apa yang akan dikerjakan (lingkup fitur).
    *   Urutan pengerjaannya.
    *   Estimasi kapan setiap bagian besar akan selesai.
    *   Siapa yang bertanggung jawab (para Chief Programmer).

2.  **Persetujuan untuk Melanjutkan:** Titik ini adalah "gate" penting untuk meninjau situasi. Apakah proyek masih layak secara ekonomi? Apakah lingkupnya sesuai? Manajemen harus memberikan persetujuan untuk melanjutkan ke fase konstruksi (Tahap 4 & 5) berdasarkan rencana yang telah dibuat.

### **Kriteria Keluar (Exit Criteria)**

Tahap 3 dianggap selesai jika:
*   Seluruh feature set telah memiliki estimasi tanggal penyelesaian (bulan & tahun).
*   Setiap feature set telah ditugaskan ke seorang Chief Programmer.
*   Setiap kelas dalam model objek telah memiliki seorang pemilik (developer).
*   Rencana pengembangan telah dibuat dan disetujui oleh Project Manager dan Development Manager, serta siap dipresentasikan kepada stakeholder untuk persetujuan.