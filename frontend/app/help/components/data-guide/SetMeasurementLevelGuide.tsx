import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection, HelpStep } from '../../ui/HelpLayout';
import { Ruler, Hash, Settings, ListOrdered } from 'lucide-react';

export default function SetMeasurementLevelGuide() {
  const sections = [
    {
      id: 'how-to-steps',
      title: 'Cara Mengatur Tingkat Pengukuran',
      description: 'Langkah-langkah untuk mendefinisikan tingkat pengukuran variabel',
      icon: ListOrdered,
      content: (
        <div className="space-y-4">
          <HelpStep number={1} title="Buka Dialog Tingkat Pengukuran">
            <p className="text-sm">
              Akses menu <strong>Data → Atur Tingkat Pengukuran</strong> untuk membuka dialog.
              Sistem akan otomatis menampilkan variabel dengan tingkat pengukuran yang belum diketahui.
            </p>
          </HelpStep>

          <HelpStep number={2} title="Identifikasi Jenis Data">
            <p className="text-sm">
              Tentukan jenis data untuk setiap variabel:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li><strong>Nominal</strong>: Kategori tanpa urutan (Jenis Kelamin, Warna, Agama)</li>
              <li><strong>Ordinal</strong>: Kategori dengan urutan (Tingkat Pendidikan, Rating Kepuasan)</li>
              <li><strong>Skala</strong>: Data numerik (Umur, Pendapatan, Tinggi Badan)</li>
            </ul>
          </HelpStep>

          <HelpStep number={3} title="Pilih dan Pindahkan Variabel">
            <p className="text-sm">
              Pilih variabel dari daftar "Tersedia" dan gunakan tombol panah untuk memindahkannya 
              ke kategori yang sesuai (Nominal, Ordinal, atau Skala).
            </p>
          </HelpStep>

          <HelpStep number={4} title="Verifikasi Pengelompokan">
            <p className="text-sm">
              Periksa kembali pengelompokan variabel. Anda dapat memindahkan variabel antar kategori 
              jika diperlukan sebelum menyimpan perubahan.
            </p>
          </HelpStep>

          <HelpStep number={5} title="Simpan Perubahan">
            <p className="text-sm">
              Klik tombol <strong>OK</strong> untuk menyimpan pengaturan tingkat pengukuran secara permanen.
            </p>
          </HelpStep>
        </div>
      )
    },
    {
      id: 'overview',
      title: 'Ringkasan',
      description: 'Pengantar fitur Atur Tingkat Pengukuran',
      icon: Ruler,
      content: (
        <div className="space-y-4">
          <p>
            Fitur ini membantu Anda dengan cepat mendefinisikan tingkat pengukuran untuk variabel Anda.
            Ketika dibuka, fitur ini secara otomatis mendeteksi dan menampilkan semua variabel dalam dataset Anda
            yang belum ditentukan tingkat pengukurannya. Anda dapat dengan mudah memindahkan
            variabel-variabel ini ke kategori yang sesuai menggunakan antarmuka yang intuitif.
          </p>
          
          <HelpAlert variant="info" title="Mengapa Ini Penting">
            <p className="text-sm mt-2">
              Tingkat pengukuran menentukan analisis statistik apa yang dapat Anda lakukan
              dan cara menginterpretasikan hasil Anda. Klasifikasi yang tepat sangat penting
              untuk analisis yang valid.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'interface',
      title: 'Antarmuka dan Komponen',
      description: 'Komponen dalam modal Atur Tingkat Pengukuran',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpCard title="Daftar Variabel Tersedia" variant="feature">
            <p className="text-sm">
              Menampilkan semua variabel dengan tingkat pengukuran yang tidak diketahui.
              Variabel-variabel ini muncul secara otomatis ketika modal dibuka.
            </p>
          </HelpCard>
          
          <HelpCard title="Daftar Target" variant="feature">
            <p className="text-sm mb-3">
              Tiga kotak terpisah untuk menampung variabel berdasarkan tingkat pengukurannya:
            </p>
            <div className="space-y-3">
              <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700 p-3 rounded-lg">
                <p className="font-semibold text-sm mb-1">Nominal</p>
                <p className="text-xs">
                  Untuk data kategorikal tanpa urutan (misalnya, &apos;Jenis Kelamin&apos;, &apos;Kota&apos;).
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-green-200 dark:border-green-700 p-3 rounded-lg">
                <p className="font-semibold text-sm mb-1">Ordinal</p>
                <p className="text-xs">
                  Untuk data kategorikal dengan urutan (misalnya, &apos;Tingkat Pendidikan&apos;, &apos;Kepuasan Pelanggan&apos;).
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-700 p-3 rounded-lg">
                <p className="font-semibold text-sm mb-1">Skala</p>
                <p className="text-xs">
                  Untuk data kuantitatif/numerik (misalnya, &apos;Umur&apos;, &apos;Pendapatan&apos;).
                </p>
              </div>
            </div>
          </HelpCard>
          
          <HelpCard title="Tombol Panah" variant="feature">
            <p className="text-sm">
              Memungkinkan Anda memindahkan variabel yang disorot dari daftar &quot;Tersedia&quot;
              ke daftar target yang sesuai. Pilih variabel terlebih dahulu, kemudian klik
              tombol panah yang menunjuk ke kategori yang Anda inginkan.
            </p>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'workflow',
      title: 'Alur Kerja dan Contoh Penggunaan',
      description: 'Panduan langkah demi langkah untuk menggunakan fitur ini',
      icon: Hash,
      content: (
        <div className="space-y-4">
          <HelpSection title="Langkah 1: Inisialisasi">
            <p className="text-sm">
              Ketika Anda membuka modal, semua variabel dengan tingkat pengukuran yang tidak diketahui
              secara otomatis dimuat ke dalam daftar &quot;Tersedia&quot;.
            </p>
          </HelpSection>
          
          <HelpSection title="Langkah 2: Interaksi Pengguna">
            <p className="text-sm">
              Pilih satu atau lebih variabel dari daftar &quot;Tersedia&quot;
              dan gunakan tombol panah untuk memindahkannya ke kategori yang sesuai
              yaitu Nominal, Ordinal, atau Skala.
            </p>
          </HelpSection>
          
          <HelpSection title="Langkah 3: Simpan Perubahan">
            <p className="text-sm">
              Klik **OK** dan tingkat pengukuran untuk variabel yang dipindahkan
              akan diperbarui secara permanen dalam dataset Anda.
            </p>
          </HelpSection>
          
          <HelpAlert variant="success" title="Tips Penggunaan">
            <div className="text-sm mt-2 space-y-1">
              <p>• Anda dapat memilih beberapa variabel sekaligus melalui antarmuka pemilihan yang tersedia</p>
              <p>• Variabel dapat dipindahkan kembali jika Anda berubah pikiran tentang kategorinya</p>
              <p>• Perubahan hanya disimpan setelah mengklik OK</p>
            </div>
          </HelpAlert>
        </div>
      )
    }
  ];



  const tips = [
    {
      type: 'tip' as const,
      title: 'Identifikasi Jenis Data dengan Cepat',
      content: 'Pertimbangkan sifat data Anda: apakah berupa kategori tanpa urutan (nominal), kategori dengan urutan (ordinal), atau data numerik (skala)?'
    },
    {
      type: 'info' as const,
      title: 'Pemilihan Multiple Variabel',
      content: 'Gunakan fitur seleksi multiple pada dialog untuk memilih beberapa variabel sekaligus dan memindahkannya bersamaan ke kategori yang sama.'
    },
    {
      type: 'warning' as const,
      title: 'Validasi Sebelum Simpan',
      content: 'Selalu periksa kembali kategori yang dipilih sebelum menyimpan perubahan. Tingkat pengukuran yang salah dapat mempengaruhi analisis statistik.'
    },
    {
      type: 'tip' as const,
      title: 'Contoh Praktis Pengelompokan',
      content: 'Nominal: Jenis Kelamin, Agama, Warna. Ordinal: Rating, Tingkat Pendidikan, Skala Likert. Skala: Umur, Pendapatan, Berat Badan.'
    }
  ];

  const relatedTopics = [
    { title: 'Manajemen Data', href: '/help/data-guide' },
    { title: 'Properti Variabel', href: '/help/data-guide/define-var-props' },
    { title: 'Urutkan Kasus', href: '/help/data-guide/sort-cases' },
    { title: 'Statistik Deskriptif', href: '/help/statistics-guide/descriptive' },
    { title: 'Validasi Data', href: '/help/data-guide/unusual-cases' }
  ];

  return (
    <HelpGuideTemplate
      title="Atur Tingkat Pengukuran"
      description="Panduan lengkap untuk mendefinisikan tingkat pengukuran (Nominal, Ordinal, Skala) variabel dalam dataset"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
}