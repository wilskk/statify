/* eslint-disable react/no-unescaped-entities */
<<<<<<< HEAD
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert } from '../../ui/HelpLayout';
=======
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep, HelpSection } from '../../ui/HelpLayout';
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
import { Database, Settings, Calculator } from 'lucide-react';

const AggregateGuide = () => {
  const sections = [
    {
      id: 'overview',
<<<<<<< HEAD
      title: 'Ringkasan',
      description: 'Memahami konsep dasar agregasi data',
      icon: Database,
      content: (
        <div className="space-y-4">
          <p>
            Fitur Agregasi Data memungkinkan pengguna untuk mengagregasi data dengan membuat
            statistik ringkasan untuk variabel tertentu dalam kelompok yang didefinisikan oleh
            variabel break. Ini berguna untuk meringkas informasi, menghitung
            rata-rata kelompok, mencari nilai maksimum per kelompok, menghitung kejadian,
            dan banyak lagi.
          </p>
=======
      title: 'Cara Menggunakan Agregasi Data',
      description: 'Panduan langkah demi langkah untuk mengagregasi data dalam Statify',
      icon: Database,
      content: (
        <div className="space-y-4">
          <HelpStep
            number={1}
            title="Buka Menu Data"
            description="Klik 'Data' di bilah menu atas aplikasi."
          />
          <HelpStep
            number={2}
            title="Pilih Aggregate"
            description="Klik Data → Aggregate untuk membuka dialog agregasi data."
          />
          <HelpStep
            number={3}
            title="Pilih Variabel Break"
            description="Seret variabel yang akan digunakan untuk mengelompokkan data ke daftar 'Break Variable(s)'."
          />
          <HelpStep
            number={4}
            title="Pilih Variabel untuk Diagregasi"
            description="Seret variabel yang akan diringkas ke daftar 'Aggregated Variables'."
          />
          <HelpStep
            number={5}
            title="Tentukan Fungsi Agregasi"
            description="Pilih variabel dalam daftar agregasi dan klik 'Function...' untuk memilih jenis statistik (Mean, Sum, Max, dll.)."
          />
          <HelpStep
            number={6}
            title="Jalankan Agregasi"
            description="Klik 'OK' untuk memproses agregasi dan membuat dataset baru."
          />
        </div>
      )
    },
    {
      id: 'features',
      title: 'Fitur & Konsep',
      description: 'Memahami konsep dasar dan manfaat agregasi data',
      icon: Calculator,
      content: (
        <div className="space-y-4">
          <HelpCard title="Apa itu Agregasi Data" variant="feature">
            <p className="text-sm text-muted-foreground">
              Agregasi data memungkinkan Anda membuat statistik ringkasan untuk variabel tertentu dalam kelompok yang didefinisikan oleh variabel break.
            </p>
          </HelpCard>
          
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
          <HelpAlert variant="tip" title="Kapan Menggunakan Agregasi">
            Gunakan agregasi data ketika Anda ingin:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Menghitung statistik per kelompok (rata-rata, jumlah, dll.)</li>
              <li>Meringkas dataset besar menjadi informasi yang lebih mudah dipahami</li>
              <li>Membuat laporan ringkasan berdasarkan kategori tertentu</li>
            </ul>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'configuration',
      title: 'Konfigurasi Variabel',
<<<<<<< HEAD
      description: 'Cara mengatur variabel untuk agregasi',
      icon: Settings,
      steps: [
        {
          title: 'Pilih Variabel Break',
          description: 'Tentukan variabel yang digunakan untuk mengelompokkan data',
          content: (
            <div className="space-y-3">
              <p>
                Variabel ini mendefinisikan kelompok untuk agregasi.
                Setiap kombinasi unik dari nilai dalam variabel break akan
                membuat sebuah kelompok.
              </p>
              
              <HelpCard title="Contoh" variant="step">
                <p className="text-sm">
                  Jika "Jenis Kelamin" dan "Wilayah" adalah variabel break, data akan
                  diagregasi secara terpisah untuk setiap kombinasi Jenis Kelamin-Wilayah
                  (Laki-laki-Jakarta, Perempuan-Jakarta, Laki-laki-Surabaya, dll.).
                </p>
              </HelpCard>
            </div>
          )
        },
        {
          title: 'Pilih Variabel yang Diagregasi',
          description: 'Tentukan variabel yang akan diringkas',
          content: (
            <div className="space-y-3">
              <p>
                Ini adalah variabel yang akan diringkas. Untuk setiap
                variabel yang dipilih, Anda dapat menerapkan fungsi agregasi
                untuk menghitung statistik untuk setiap kelompok yang didefinisikan oleh variabel break.
              </p>
            </div>
          )
        }
      ]
=======
      description: 'Cara mengatur variabel untuk agregasi yang efektif',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpSection title="Pilih Variabel Break">
            <p className="text-sm mb-3">
              Variabel ini mendefinisikan kelompok untuk agregasi.
              Setiap kombinasi unik dari nilai dalam variabel break akan
              membuat sebuah kelompok.
            </p>
            
            <HelpCard title="Contoh Praktis" variant="step">
              <p className="text-sm">
                Jika "Jenis Kelamin" dan "Wilayah" adalah variabel break, data akan
                diagregasi secara terpisah untuk setiap kombinasi Jenis Kelamin-Wilayah
                (Laki-laki-Jakarta, Perempuan-Jakarta, Laki-laki-Surabaya, dll.).
              </p>
            </HelpCard>
          </HelpSection>
          
          <HelpSection title="Pilih Variabel yang Diagregasi">
            <p className="text-sm">
              Ini adalah variabel yang akan diringkas. Untuk setiap
              variabel yang dipilih, Anda dapat menerapkan fungsi agregasi
              untuk menghitung statistik untuk setiap kelompok yang didefinisikan oleh variabel break.
            </p>
          </HelpSection>
        </div>
      )
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    },
    {
      id: 'ui-variables',
      title: 'Tab: Variabel (Variables)',
<<<<<<< HEAD
      description: 'Kontrol utama di tab Variables',
      icon: Settings,
      steps: [
        {
          title: 'Variabel Pemisah (Break Variable(s))',
          description: 'Daftar variabel pengelompokan',
          content: (
=======
      description: 'Kontrol utama dalam tab Variables untuk konfigurasi agregasi',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpSection title="Variabel Pemisah (Break Variable(s))">
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
            <div className="text-sm space-y-2">
              <p>Seret variabel dari daftar Available ke daftar <strong>Break Variable(s)</strong> untuk mendefinisikan kelompok.</p>
              <p>Gunakan urutan variabel break sesuai prioritas pengelompokan.</p>
            </div>
<<<<<<< HEAD
          )
        },
        {
          title: 'Variabel yang Diagregasi (Aggregated Variables)',
          description: 'Daftar variabel yang akan diringkas',
          content: (
=======
          </HelpSection>
          
          <HelpSection title="Variabel yang Diagregasi (Aggregated Variables)">
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
            <div className="text-sm space-y-2">
              <p>Seret variabel dari Available ke <strong>Aggregated Variables</strong>.</p>
              <p>Pilih satu item di daftar ini untuk mengaktifkan tombol:</p>
              <ul className="list-disc list-inside ml-4">
                <li><strong>Function...</strong> — memilih fungsi agregasi (Mean, Sum, Max, dsb.).</li>
                <li><strong>Name & Label...</strong> — mengatur nama/label variabel hasil.</li>
              </ul>
            </div>
<<<<<<< HEAD
          )
        },
        {
          title: 'Jumlah Kasus (Number of cases)',
          description: 'Opsi pembuatan variabel jumlah kasus per kelompok',
          content: (
=======
          </HelpSection>
          
          <HelpSection title="Jumlah Kasus (Number of cases)">
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
            <div className="text-sm space-y-1">
              <p>Centang <strong>Number of cases</strong> untuk membuat variabel hitung kasus per kelompok.</p>
              <p>Isikan <strong>Name:</strong> untuk nama variabel output.</p>
            </div>
<<<<<<< HEAD
          )
        }
      ]
=======
          </HelpSection>
        </div>
      )
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    },
    {
      id: 'functions',
      title: 'Fungsi Agregasi',
      description: 'Berbagai jenis fungsi agregasi yang tersedia',
      icon: Calculator,
      content: (
        <div className="space-y-6">
          <p>
            Fitur ini menyediakan beberapa kategori fungsi agregasi:
          </p>
          
          <HelpCard title="Statistik Ringkasan" variant="feature">
            <ul className="space-y-2">
              <li><strong>Rata-rata</strong>: Menghitung nilai rata-rata pada kasus dalam setiap kelompok</li>
              <li><strong>Median</strong>: Menemukan nilai tengah dalam setiap kelompok ketika nilai diurutkan</li>
              <li><strong>Jumlah</strong>: Menghitung total dari semua nilai dalam setiap kelompok</li>
              <li><strong>Deviasi Standar</strong>: Mengukur jumlah variasi dalam setiap kelompok</li>
            </ul>
          </HelpCard>

          <HelpCard title="Nilai Spesifik" variant="feature">
            <ul className="space-y-2">
              <li><strong>Maksimum</strong>: Menemukan nilai tertinggi dalam setiap kelompok</li>
              <li><strong>Minimum</strong>: Menemukan nilai terendah dalam setiap kelompok</li>
              <li><strong>Pertama</strong>: Mengambil nilai pertama yang muncul dalam setiap kelompok</li>
              <li><strong>Terakhir</strong>: Mengambil nilai terakhir yang muncul dalam setiap kelompok</li>
            </ul>
          </HelpCard>

          <HelpCard title="Jumlah Kasus" variant="feature">
            <HelpAlert variant="info" title="Memahami Penghitungan">
              Opsi penghitungan ini membantu Anda memahami berapa banyak kasus dalam setiap kelompok:
              - Gunakan N untuk menghitung respons yang valid
              - Gunakan NMISS untuk menghitung respons yang hilang
              - NU memberikan total hitungan termasuk nilai yang hilang
            </HelpAlert>
            
            <ul className="space-y-2 mt-4">
              <li><strong>Berbobot (N)</strong>: Menghitung jumlah kasus dalam setiap kelompok dengan nilai non-missing</li>
              <li><strong>Berbobot Hilang (NMISS)</strong>: Menghitung jumlah kasus dengan nilai yang hilang</li>
              <li><strong>Tidak Berbobot (NU)</strong>: Menghitung total jumlah kasus dalam setiap kelompok</li>
            </ul>
          </HelpCard>

          <HelpCard title="Persentase, Fraksi, Hitungan" variant="feature">
            <div className="space-y-4">
              <div>
                <h5 className="font-semibold mb-2">Persentase</h5>
                <p className="text-sm text-muted-foreground mb-2">
                  Menghitung persentase kasus yang memenuhi kriteria tertentu:
                </p>
                <ul className="space-y-1 text-sm ml-4">
                  <li><strong>Di Atas</strong>: Persentase kasus di atas nilai yang ditentukan</li>
                  <li><strong>Di Bawah</strong>: Persentase kasus di bawah nilai yang ditentukan</li>
                  <li><strong>Di Antara</strong>: Persentase kasus di antara dua nilai yang ditentukan</li>
                  <li><strong>Di Luar</strong>: Persentase kasus di luar rentang nilai yang ditentukan</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <p><strong>Fraksi</strong>: Mirip dengan persentase tetapi dinyatakan sebagai proporsi (0-1 bukan 0-100)</p>
                <p><strong>Hitungan</strong>: Penghitungan sederhana dari kasus yang memenuhi kriteria</p>
              </div>
            </div>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'ui-options',
      title: 'Tab: Opsi (Options)',
      description: 'Opsi performa untuk dataset besar',
      icon: Settings,
      content: (
        <div className="space-y-3 text-sm">
          <ul className="list-disc list-inside space-y-1">
            <li><strong>File is already sorted on break variable(s)</strong></li>
            <li><strong>Sort file before aggregating</strong></li>
          </ul>
          <HelpAlert variant="info" title="Catatan">
            Opsi ini tersedia di UI untuk dokumentasi workflow. Saat ini tidak mengubah proses agregasi di belakang layar.
          </HelpAlert>
        </div>
      )
    },
  ];

<<<<<<< HEAD


  const prerequisites = [
    'Data Anda telah dimuat di Statify',
    'Anda mengetahui variabel mana yang ingin dikelompokkan',
    'Anda memahami apa yang diwakili setiap variabel'
  ];

  const tips = [
    {
      type: 'tip' as const,
      title: 'Jaga Kesederhanaan',
      content: 'Mulai dengan hanya satu variabel break untuk melihat bagaimana agregasi bekerja sebelum menambahkan pengelompokan yang lebih kompleks.'
    },
    {
      type: 'warning' as const,
      title: 'Periksa Hasil Anda',
      content: 'Selalu tinjau hasil agregasi Anda untuk memastikan mereka masuk akal untuk analisis Anda.'
    },
    {
      type: 'tip' as const,
      title: 'Simpan Pekerjaan Anda',
      content: 'Simpan dataset Anda sebelum menjalankan agregasi, sehingga Anda selalu dapat kembali ke data asli Anda.'
=======
  const tips = [
    {
      type: 'tip' as const,
      title: 'Mulai Sederhana',
      content: 'Mulai dengan hanya satu variabel break untuk memahami cara kerja agregasi sebelum menambahkan pengelompokan yang lebih kompleks.'
    },
    {
      type: 'warning' as const,
      title: 'Validasi Hasil',
      content: 'Selalu tinjau hasil agregasi untuk memastikan hasilnya masuk akal dan sesuai dengan tujuan analisis Anda.'
    },
    {
      type: 'info' as const,
      title: 'Backup Data',
      content: 'Simpan dataset asli sebelum menjalankan agregasi sehingga Anda dapat kembali ke data mentah jika diperlukan.'
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    }
  ];

  const relatedTopics = [
<<<<<<< HEAD
    { title: 'Impor Data', href: '/help/file-guide/import-sav' },
    { title: 'Definisi Variabel', href: '/help/data-guide/define-var-props' },
    { title: 'Statistik Deskriptif', href: '/help/statistics-guide/descriptive' }
=======
    { title: 'Urutkan Kasus', href: '/help/data-guide/sort-cases' },
    { title: 'Pilih Kasus', href: '/help/data-guide/select-cases' },
    { title: 'Definisi Properti Variabel', href: '/help/data-guide/define-var-props' },
    { title: 'Statistik Deskriptif', href: '/help/statistics-guide/descriptive' },
    { title: 'Panduan Manajemen Data', href: '/help/data-guide' }
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
  ];

  return (
    <HelpGuideTemplate
<<<<<<< HEAD
      title="Fitur Agregasi Data"
      description="Dokumen ini menjelaskan fungsionalitas fitur Agregasi Data, yang memungkinkan pengguna untuk menggabungkan data menjadi statistik ringkasan lintas kelompok."
      lastUpdated="2024-01-15"
      sections={sections}
      prerequisites={prerequisites}
=======
      title="Agregasi Data"
      description="Panduan lengkap untuk mengagregasi data menjadi statistik ringkasan berdasarkan kelompok dalam Statify"
      lastUpdated="2024-01-15"
      sections={sections}
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default AggregateGuide;