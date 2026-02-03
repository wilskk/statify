/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection, HelpStep } from '../../ui/HelpLayout';
import { ArrowUpDown, Settings, ListOrdered } from 'lucide-react';

const SortCasesGuide = () => {
  const sections = [
    {
      id: 'how-to-steps',
      title: 'Cara Mengurutkan Kasus',
      description: 'Langkah-langkah untuk mengatur ulang baris berdasarkan kriteria tertentu',
      icon: ListOrdered,
      content: (
        <div className="space-y-4">
          <HelpStep number={1} title="Buka Dialog Urutkan Kasus">
            <p className="text-sm">
              Akses menu <strong>Data → Urutkan Kasus</strong> untuk membuka dialog pengurutan.
            </p>
          </HelpStep>

          <HelpStep number={2} title="Pilih Variabel Pengurutan">
            <p className="text-sm">
              Pindahkan variabel dari daftar tersedia ke daftar "Urutkan Berdasarkan". 
              Variabel pertama akan menjadi kunci utama pengurutan.
            </p>
          </HelpStep>

          <HelpStep number={3} title="Atur Arah Pengurutan">
            <p className="text-sm">
              Pilih arah pengurutan untuk setiap variabel:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li><strong>Menaik</strong>: dari nilai terkecil ke terbesar (A-Z, 1-9)</li>
              <li><strong>Menurun</strong>: dari nilai terbesar ke terkecil (Z-A, 9-1)</li>
            </ul>
          </HelpStep>

          <HelpStep number={4} title="Atur Prioritas (Opsional)">
            <p className="text-sm">
              Untuk pengurutan multi-tingkat, gunakan tombol prioritas untuk mengubah 
              urutan variabel dalam daftar pengurutan.
            </p>
          </HelpStep>

          <HelpStep number={5} title="Terapkan Pengurutan">
            <p className="text-sm">
              Klik tombol <strong>OK</strong> untuk menerapkan pengurutan ke dataset Anda.
            </p>
          </HelpStep>
        </div>
      )
    },
    {
      id: 'interface',
      title: 'Antarmuka & Fungsionalitas Komponen',
      description: 'Komponen dalam dialog Urutkan Kasus',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpSection title="Daftar Variabel Tersedia">
            <p className="text-sm">
              Menampilkan semua variabel yang tersedia untuk digunakan sebagai kunci pengurutan.
            </p>
          </HelpSection>
          
          <HelpSection title="Daftar Urutkan Berdasarkan">
            <p className="text-sm">
              Daftar ini menyimpan variabel yang dipilih sebagai kunci pengurutan.
              Urutan di sini menentukan prioritas pengurutan.
            </p>
          </HelpSection>
          
          <HelpSection title="Kontrol Pengurutan">
            <p className="text-sm mb-3">
              Ketika variabel dalam daftar "Urutkan Berdasarkan" disorot:
            </p>
            <div className="ml-4 space-y-2">
              <HelpCard title="Arah Pengurutan" variant="step">
                <p className="text-sm">
                  Pilih untuk mengurutkan dalam urutan naik atau turun.
                </p>
              </HelpCard>
              <HelpCard title="Prioritas Pengurutan" variant="step">
                <p className="text-sm">
                  Tombol untuk mengubah prioritas pengurutan variabel.
                </p>
              </HelpCard>
            </div>
          </HelpSection>
        </div>
      )
    },
    {
      id: 'workflow',
      title: 'Alur Kerja & Contoh Penggunaan',
      description: 'Contoh praktis menggunakan Urutkan Kasus',
      icon: ArrowUpDown,
      content: (
        <div className="space-y-4">
          <HelpCard title="Contoh 1: Pengurutan Tingkat Tunggal" variant="feature">
            <div className="space-y-3">
              <p className="text-sm">
                <strong>Tujuan</strong>: Urutkan seluruh dataset Anda berdasarkan Pendapatan 
                dari tertinggi ke terendah.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-semibold text-sm mb-2">Langkah:</p>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Buka dialog "Urutkan Kasus"</li>
                  <li>Pindahkan variabel Pendapatan ke daftar "Urutkan Berdasarkan"</li>
                  <li>Pilih Menurun untuk "Urutan Pengurutan"</li>
                  <li>Klik OK</li>
                </ol>
              </div>
            </div>
          </HelpCard>
          
          <HelpCard title="Contoh 2: Pengurutan Multi-Tingkat" variant="feature">
            <div className="space-y-3">
              <p className="text-sm">
                <strong>Tujuan</strong>: Kelompokkan kasus berdasarkan Departemen, kemudian dalam 
                setiap departemen, urutkan berdasarkan Pendapatan dari tertinggi ke terendah.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-semibold text-sm mb-2">Langkah:</p>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Pindahkan variabel Departemen ke "Urutkan Berdasarkan" (Menaik)</li>
                  <li>Pindahkan variabel Pendapatan ke "Urutkan Berdasarkan" di bawah Departemen</li>
                  <li>Ubah arah Pendapatan menjadi Menurun</li>
                  <li>Klik OK</li>
                </ol>
              </div>
            </div>
          </HelpCard>
          
          <HelpAlert variant="info" title="Tips Pengurutan Multi-Tingkat">
            <p className="text-sm mt-2">
              Urutan variabel dalam daftar "Urutkan Berdasarkan" menentukan prioritas pengurutan. 
              Variabel pertama memiliki prioritas tertinggi.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];


  const tips = [
    {
      type: 'tip' as const,
      title: 'Urutan Prioritas Pengurutan',
      content: 'Variabel yang dipilih pertama memiliki prioritas tertinggi dalam pengurutan multi-tingkat. Gunakan tombol prioritas untuk mengatur ulang urutan.'
    },
    {
      type: 'info' as const,
      title: 'Pemahaman Arah Pengurutan',
      content: 'Menaik berarti dari nilai terkecil ke terbesar (A-Z, 1-9). Menurun berarti dari nilai terbesar ke terkecil (Z-A, 9-1).'
    },
    {
      type: 'warning' as const,
      title: 'Perubahan Urutan Permanen',
      content: 'Pengurutan akan mengubah urutan baris dalam dataset Anda secara permanen. Simpan salinan data asli sebelum melakukan pengurutan jika diperlukan.'
    },
    {
      type: 'tip' as const,
      title: 'Pengurutan Data Kosong',
      content: 'Nilai kosong (missing values) akan selalu ditempatkan di akhir daftar, terlepas dari arah pengurutan yang dipilih.'
    }
  ];

  const relatedTopics = [
    { title: 'Manajemen Data', href: '/help/data-guide' },
    { title: 'Pilih Kasus', href: '/help/data-guide/select-cases' },
    { title: 'Urutkan Variabel', href: '/help/data-guide/sort-vars' },
    { title: 'Tingkat Pengukuran', href: '/help/data-guide/set-measurement-level' },
    { title: 'Persiapan Data', href: '/help/data-guide/restructure' }
  ];

  return (
    <HelpGuideTemplate
      title="Urutkan Kasus"
      description="Panduan lengkap untuk mengatur ulang baris (kasus) dalam dataset berdasarkan nilai variabel tertentu"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default SortCasesGuide;