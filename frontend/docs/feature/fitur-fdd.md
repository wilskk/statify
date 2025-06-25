# Daftar Fitur FDD untuk Manajemen File

Berikut adalah daftar fitur yang diidentifikasi dari komponen-komponen yang ada, disusun menggunakan format FDD (`<Aksi> <Hasil> <Objek>`) sesuai dengan `panduan-dasar.md`.

## Area Bisnis: Manajemen File & Data

### Aktivitas/Feature Set: Operasi File Dasar

- `Membuat sebuah dataset baru`
- `Menyimpan dataset saat ini ke file`
- `Menyimpan dataset saat ini dengan nama baru`
- `Membuka sebuah file data SPSS (.sav)`
- `Menampilkan dialog untuk membuka file data`
- `Menutup aplikasi Statify`

### Aktivitas/Feature Set: Impor Data dari Berbagai Sumber

#### Sub-Aktivitas: Impor Data dari File CSV
- `Menampilkan dialog untuk impor data dari file CSV`
- `Memilih sebuah file CSV dari penyimpanan lokal`
- `Menampilkan pratinjau konten dari file CSV yang dipilih`
- `Mengatur opsi bahwa baris pertama adalah nama variabel`
- `Mengatur opsi untuk menghapus spasi di awal setiap nilai`
- `Mengatur opsi untuk menghapus spasi di akhir setiap nilai`
- `Memilih sebuah karakter delimiter untuk parsing file`
- `Memilih sebuah karakter penanda desimal untuk nilai numerik`
- `Memilih sebuah karakter pembungkus teks (text qualifier)`
- `Mengimpor data dari file CSV sesuai konfigurasi`

#### Sub-Aktivitas: Impor Data dari File Excel
- `Menampilkan dialog untuk impor data dari file Excel`
- `Memilih sebuah file Excel (.xls, .xlsx) dari penyimpanan lokal`
- `Memilih sebuah worksheet spesifik dari file Excel`
- `Menentukan sebuah rentang sel (range) untuk dibaca dari worksheet`
- `Mengatur opsi bahwa baris pertama adalah nama variabel`
- `Mengatur opsi untuk membaca baris dan kolom tersembunyi`
- `Mengatur perlakuan untuk sel kosong (sebagai string kosong atau nilai sistem)`
- `Menampilkan pratinjau data dari worksheet Excel yang dipilih`
- `Mengimpor data dari file Excel sesuai konfigurasi`

#### Sub-Aktivitas: Impor Data dari Clipboard
- `Menampilkan dialog untuk impor data dari clipboard`
- `Menempelkan (paste) data tabular dari clipboard`
- `Mengambil data teks dari clipboard secara otomatis via API`
- `Mengatur sebuah karakter delimiter untuk parsing data clipboard`
- `Mengatur sebuah karakter pembungkus teks (text qualifier)`
- `Mengatur opsi bahwa baris pertama adalah nama variabel`
- `Mengatur opsi untuk memangkas spasi berlebih (trim whitespace)`
- `Mengatur opsi untuk melewati baris kosong dalam data`
- `Mengatur opsi untuk mendeteksi tipe data (numerik/string) secara otomatis`
- `Menampilkan pratinjau data dari clipboard sesuai konfigurasi`
- `Mengimpor data dari clipboard sesuai konfigurasi`

### Aktivitas/Feature Set: Ekspor Data ke Berbagai Format

#### Sub-Aktivitas: Ekspor Data ke File CSV
- `Menampilkan dialog untuk ekspor data ke format CSV`
- `Menentukan sebuah nama file untuk file CSV yang akan diekspor`
- `Memilih sebuah karakter delimiter untuk file CSV`
- `Menyertakan nama variabel sebagai baris header dalam file`
- `Menyertakan properti variabel sebagai baris metadata di awal file`
- `Membungkus semua nilai string dengan karakter petik`
- `Memilih sebuah pengkodean karakter (encoding) untuk file`
- `Mengekspor data saat ini ke sebuah file CSV`

#### Sub-Aktivitas: Ekspor Data ke File Excel
- `Menampilkan dialog untuk ekspor data ke format Excel`
- `Menentukan sebuah nama file untuk file Excel yang akan diekspor`
- `Memilih sebuah format file Excel (.xlsx atau .xls)`
- `Menyertakan nama variabel sebagai baris header pada sheet data`
- `Menyertakan sebuah sheet terpisah yang berisi properti variabel`
- `Menyertakan sebuah sheet terpisah yang berisi metadata file`
- `Mengekspor label nilai (value labels) daripada nilai data mentah`
- `Menerapkan gaya visual dasar pada baris header`
- `Mengekspor data saat ini ke sebuah file Excel`

### Aktivitas/Feature Set: Mencetak Data dan Hasil

- `Menampilkan dialog untuk mencetak tampilan`
- `Menentukan sebuah nama file untuk output PDF hasil cetak`
- `Memilih bagian aplikasi yang akan dicetak (Data, Variabel, Hasil)`
- `Memilih sebuah ukuran kertas untuk dokumen PDF`
- `Menghasilkan sebuah file PDF untuk dicetak` 