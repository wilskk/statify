SKENARIO TESTING
MODUL REGRESI LINEAR DAN ESTIMASI KURVA
APLIKASI ANALISIS STATISTIK STATIFY

Instruksi umum:
1.	Baca setiap skenario dengan teliti.
2.	Ikuti langkah-langkah sesuai urutan.
3.	Fokus pada kemudahan penggunaan, bukan kecepatan.

Informasi Dataset:
Dataset ini berisi variabel-variabel sebagai berikut:
1.  ID – Nomor Identitas Wilayah
2.  NAMA – Nama Wilayah
3.  KODE – Kode Wilayah
4.  X1 – Luas Wilayah (mil²)
5.  X2 – Jumlah Penduduk (jiwa)
6.  X3 – Persen Penduduk 18-34th
7.  X4 – Persen Penduduk >64th
8.  X5 – Jumlah Dokter
9.  X6 – Jumlah Tempat Tidur RS
10. X7 – Jumlah Kejadian Kriminal
11. X8 – Persen Lulusan SMA
12. X9 – Persen Lulusan Sarjana/Diploma IV
13. X10 – Persen Penduduk dibawah Garis Kemiskinan
14. X11 – Persen Pengangguran
15. X12 – Pendapatan Perkapita
16. X13 – Total Pendapatan Penduduk
17. X14 – Klasifikasi Wilayah
---

### SKENARIO 1: REGRESI LINEAR BERGANDA
Durasi: 10-15 menit
Tujuan: Menguji kemudahan penggunaan antarmuka regresi linear, termasuk pemilihan variabel, pengaturan opsi statistik dan plot, serta validasi output yang dihasilkan.
Tugas: Menganalisis pengaruh variabel "Pendapatan Perkapita" dan "Persen Lulusan Sarjana" terhadap "Jumlah Kejadian Kriminal", serta menyimpan hasil prediksi dan residualnya.

Langkah-langkah:
1.  Buka menu Analyze → Regression → Linear.
2.  Pada tab Variables:
    - Pilih variabel `X7 – Jumlah Kejadian Kriminal` dan pindahkan ke kotak Dependent Variable.
    - Pilih variabel `X12 – Pendapatan Perkapita` dan `X9 – Persen Lulusan Sarjana/Diploma IV`, lalu pindahkan keduanya ke kotak Independent Variable(s).
3.  Pindah ke tab Statistics:
    - Centang kotak Descriptives.
    - Centang kotak Collinearity diagnostics.
4.  Pindah ke tab Plots:
    - Pada bagian Scatterplot, pindahkan variabel `*ZRESID` (Standardized Residual) ke kotak Y-axis.
    - Pindahkan variabel `*ZPRED` (Standardized Predicted Value) ke kotak X-axis.
    - Centang kotak Generate histogram for X-axis variable.
5.  Pindah ke tab Save:
    - Pada bagian Predicted Values, centang Unstandardized.
    - Pada bagian Residuals, centang Unstandardized.
6.  Klik tombol OK untuk menjalankan analisis. Antarmuka akan menutup dan Anda akan diarahkan ke halaman Result.
7.  Periksa output pada halaman Result. Pastikan tabel-tabel berikut muncul dan berisi data:
    - Descriptive Statistics
    - Correlations
    - Variables Entered/Removed
    - Model Summary
    - ANOVA
    - Coefficients
    - Collinearity Diagnostics
    - Residuals Statistics
    - Scatterplot (*ZRESID vs *ZPRED)
    - Histogram (*ZPRED)
8.  Kembali ke halaman Data. Periksa apakah dua variabel baru telah ditambahkan di akhir dataset, yaitu `PRE_1` (Predicted Values) dan `RES_1` (Residuals).

Hasil yang Diharapkan:
-   Antarmuka Regresi Linear berhasil dibuka dan semua opsi dapat diakses.
-   Analisis berjalan tanpa eror dan menghasilkan semua output statistik dan plot yang diminta.
-   Variabel baru (hasil prediksi dan residual) berhasil disimpan ke dalam dataset.

---

### SKENARIO 2: ESTIMASI KURVA
Durasi: 8-12 menit
Tujuan: Menguji kemudahan penggunaan antarmuka estimasi kurva untuk membandingkan beberapa model regresi non-linear.
Tugas: Menemukan model regresi terbaik (antara Kuadratik dan Kubik) untuk menjelaskan hubungan antara "Jumlah Penduduk" dan "Total Pendapatan Penduduk".

Langkah-langkah:
1.  Buka menu Analyze → Regression → Curve Estimation.
2.  Pada tab Variables:
    - Pilih variabel `X13 – Total Pendapatan Penduduk` dan pindahkan ke kotak Dependent Variable.
    - Pilih variabel `X2 – Jumlah Penduduk` dan pindahkan ke kotak Independent Variable.
3.  Pindah ke tab Models:
    - Hapus centang pada model Linear (yang tercentang secara default).
    - Centang model Quadratic.
    - Centang model Cubic.
    - Pastikan opsi Plot models tercentang.
4.  Klik tombol OK untuk menjalankan analisis. Antarmuka akan menutup dan Anda akan diarahkan ke halaman Result.
5.  Periksa output pada halaman Result:
    - Lihat tabel Model Summary. Bandingkan nilai R Square antara model Kuadratik dan Kubik untuk melihat mana yang lebih baik.
    - Lihat Chart yang dihasilkan. Pastikan plot menampilkan titik-titik data serta dua garis kurva (satu untuk model Kuadratik, satu untuk Kubik) yang di-fit terhadap data.
    - Verifikasi legenda pada chart untuk membedakan kedua model.

Hasil yang Diharapkan:
-   Antarmuka Estimasi Kurva berhasil dibuka.
-   Pengguna dapat dengan mudah memilih dan mengganti model regresi.
-   Analisis berjalan tanpa eror, menghasilkan output perbandingan model dan plot visual dengan benar.
-   Plot yang dihasilkan jelas dan mudah diinterpretasikan. 