/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { RefreshCw, ArrowRightLeft, Database, Settings, FileText } from 'lucide-react';

const RestructureGuide = () => {
  const sections = [
    {
      id: 'overview',
      title: 'Ringkasan',
      description: 'Pengantar wizard restrukturisasi data',
      icon: RefreshCw,
      content: (
        <div className="space-y-4">
          <p>
            Fitur ini menyediakan wizard langkah demi langkah untuk dengan mudah merestrukturisasi dataset Anda. 
            Anda dapat mengubah data Anda antara format lebar dan panjang, atau mentranspose seluruh dataset Anda. 
            Ini berguna ketika format data Anda saat ini tidak sesuai dengan persyaratan analisis yang Anda inginkan.
          </p>
          
          <HelpAlert variant="info" title="Kapan Menggunakan Restrukturisasi Data">
            <p className="text-sm mt-2">
              Gunakan restrukturisasi data ketika format Anda saat ini tidak sesuai dengan kebutuhan analisis Anda. 
              Misalnya, analisis pengukuran berulang biasanya memerlukan format panjang, 
              sedangkan beberapa analisis multivariat bekerja lebih baik dengan data format lebar.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'restructure-methods',
      title: 'Metode Restrukturisasi',
      description: 'Opsi restrukturisasi data yang tersedia',
      icon: ArrowRightLeft,
      content: (
        <div className="space-y-4">
          <HelpCard title="Variabel ke Kasus" variant="feature">
            <p className="text-sm">
              Mengubah beberapa variabel (kolom) menjadi lebih sedikit variabel dengan membuat kasus baru (baris). 
              Ini mengonversi data format lebar ke format panjang, umumnya diperlukan untuk analisis pengukuran berulang.
            </p>
          </HelpCard>
          
          <HelpCard title="Kasus ke Variabel" variant="feature">
            <p className="text-sm">
              Kebalikan dari metode sebelumnya - mengubah beberapa kasus (baris) menjadi variabel (kolom). 
              Ini mengonversi data format panjang ke format lebar.
            </p>
          </HelpCard>
          
          <HelpCard title="Transpose All Data" variant="feature">
            <p className="text-sm">
              Simply swap all rows and columns in your dataset. This transposes the entire dataset.
            </p>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'wizard-flow',
      title: 'Alur Wizard',
      description: 'Panduan langkah demi langkah menggunakan wizard restrukturisasi',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p>
            Wizard memandu Anda melalui proses 3 langkah sederhana. Setiap langkah harus diselesaikan 
            sebelum beralih ke langkah berikutnya.
          </p>
          
          <HelpSection title="Langkah 1: Pilih Metode Restrukturisasi">
            <p className="text-sm">
              Pilih salah satu dari tiga metode restrukturisasi yang dijelaskan di atas berdasarkan kebutuhan Anda.
            </p>
          </HelpSection>
          
          <HelpSection title="Langkah 2: Konfigurasi Variabel">
            <p className="text-sm mb-3">
              Berdasarkan metode yang dipilih, konfigurasikan variabel menggunakan antarmuka drag-and-drop:
            </p>
            
            <div className="space-y-3">
              <HelpCard title='Untuk "Variabel ke Kasus"' variant="step">
                <ul className="text-sm space-y-1 mt-2">
                  <li>• Pilih variabel untuk ditransformasi menjadi kasus baru</li>
                  <li>• Beri nama variabel baru yang akan dibuat</li>
                  <li>• Beri nama variabel yang akan berisi nilai asli</li>
                </ul>
              </HelpCard>
              
              <HelpCard title='Untuk "Kasus ke Variabel"' variant="step">
                <ul className="text-sm space-y-1 mt-2">
                  <li>• Pilih variabel identifikasi yang mengelompokkan kasus</li>
                  <li>• Pilih variabel yang berisi nilai untuk variabel baru</li>
                  <li>• Beri nama variabel baru yang akan dibuat</li>
                </ul>
              </HelpCard>
              
              <HelpCard title='Untuk "Transpose Semua Data"' variant="step">
                <ul className="text-sm space-y-1 mt-2">
                  <li>• Tidak diperlukan konfigurasi tambahan</li>
                  <li>• Sistem akan menukar semua baris dan kolom secara otomatis</li>
                </ul>
              </HelpCard>
            </div>
          </HelpSection>
          
          <HelpSection title="Langkah 3: Tinjau dan Konfirmasi">
            <p className="text-sm">
              Sebelum menerapkan perubahan, sistem menampilkan pratinjau hasil. 
              Tinjau dan konfirmasi restrukturisasi sebelum diterapkan secara permanen.
            </p>
          </HelpSection>
          
          <HelpAlert variant="warning" title="Penting">
            <p className="text-sm mt-2">
              Restrukturisasi data dapat mengubah struktur dataset Anda secara signifikan. 
              Pastikan Anda memahami implikasinya sebelum menerapkan perubahan.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'best-practices',
      title: 'Tips dan Praktik Terbaik',
      description: 'Praktik terbaik untuk restrukturisasi data yang efektif',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HelpCard title="Cadangkan Data Anda" variant="step">
              <p className="text-sm">
                Selalu buat cadangan dataset Anda sebelum restrukturisasi besar 
                untuk mencegah kehilangan data.
              </p>
            </HelpCard>
            
            <HelpCard title="Validasi Hasil" variant="step">
              <p className="text-sm">
                Periksa hasil untuk memastikan tidak ada data yang hilang atau terdistorsi selama proses.
              </p>
            </HelpCard>
            
            <HelpCard title="Uji dengan Subset" variant="step">
              <p className="text-sm">
                Coba restrukturisasi dengan subset kecil data Anda terlebih dahulu 
                sebelum menerapkan ke seluruh dataset.
              </p>
            </HelpCard>
            
            <HelpCard title="Dokumentasikan Perubahan" variant="step">
              <p className="text-sm">
                Catat langkah-langkah restrukturisasi Anda untuk reproduktibilitas dan referensi masa depan.
              </p>
            </HelpCard>
          </div>
          
          <HelpAlert variant="success" title="Tips Pro">
            <p className="text-sm mt-2">
              Gunakan fitur pratinjau untuk melihat hasil restrukturisasi sebelum menerapkannya. 
              Ini membantu memastikan hasilnya sesuai ekspektasi Anda.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];


  const tips = [
    {
      type: 'tip' as const,
      title: 'Rencanakan Format Anda',
      content: 'Rencanakan struktur data yang diinginkan sebelum memulai restrukturisasi untuk hasil yang optimal.'
    },
    {
      type: 'info' as const,
      title: 'Kompatibilitas Analisis',
      content: 'Pastikan format data yang dihasilkan kompatibel dengan jenis analisis yang Anda rencanakan.'
    },
    {
      type: 'warning' as const,
      title: 'Validasi Integritas',
      content: 'Selalu validasi integritas data setelah restrukturisasi untuk memastikan tidak ada data yang hilang.'
    }
  ];

  const relatedTopics = [
    { title: 'Manajemen Data', href: '/help/data-guide' },
    { title: 'Transpose Data', href: '/help/data-guide/transpose' },
    { title: 'Urutkan Kasus', href: '/help/data-guide/sort-cases' },
    { title: 'Agregasi Data', href: '/help/statistics-guide/descriptive' }
  ];

  return (
    <HelpGuideTemplate
      title="Panduan Restrukturisasi Data"
      description="Wizard langkah demi langkah untuk merestrukturisasi dataset Anda dengan mudah"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default RestructureGuide;