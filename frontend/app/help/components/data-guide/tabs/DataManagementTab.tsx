import React from 'react';
import StandardizedContentLayout from '../../statistics-guide/shared/StandardizedContentLayout';
const { IntroSection, FeatureGrid, ConceptSection } = StandardizedContentLayout;
import { Database, FileText, Calendar, Settings, Users, BarChart } from 'lucide-react';

const DataManagementTab: React.FC = () => {
  const features = [
    {
      icon: Database,
      title: 'Properti Variabel',
      description: 'Atur nama, label, dan tipe data variabel untuk analisis yang optimal',
      link: '/help/data-guide/define-var-props'
    },
    {
      icon: Calendar,
      title: 'Definisi Tanggal & Waktu',
      description: 'Buat struktur waktu untuk analisis deret waktu dan pelaporan berkala',
      link: '/help/data-guide/define-datetime'
    },
    {
      icon: BarChart,
      title: 'Tingkat Pengukuran',
      description: 'Tentukan skala pengukuran (nominal, ordinal, interval, rasio) untuk setiap variabel',
      link: '/help/data-guide/set-measurement-level'
    },
    {
      icon: Users,
      title: 'Bobot Kasus',
      description: 'Terapkan pembobotan pada kasus untuk analisis yang lebih representatif',
      link: '/help/data-guide/weight-cases'
    },
    {
      icon: FileText,
      title: 'Urutkan Variabel',
      description: 'Atur urutan variabel dalam dataset untuk kemudahan navigasi',
      link: '/help/data-guide/sort-vars'
    },
    {
      icon: Settings,
      title: 'Urutkan Kasus',
      description: 'Susun ulang urutan baris data berdasarkan nilai variabel tertentu',
      link: '/help/data-guide/sort-cases'
    }
  ];

  const concepts = [
    {
      title: 'Struktur Data yang Baik',
      description: 'Data yang terstruktur dengan baik memiliki variabel yang jelas, tipe data yang tepat, dan format yang konsisten. Ini memudahkan analisis dan mengurangi kesalahan.',
      tips: [
        'Gunakan nama variabel yang deskriptif dan konsisten',
        'Pastikan setiap variabel memiliki tipe data yang sesuai',
        'Tambahkan label yang informatif untuk variabel dan nilai',
        'Hindari karakter khusus dalam nama variabel'
      ]
    },
    {
      title: 'Manajemen Metadata',
      description: 'Metadata adalah informasi tentang data Anda, seperti label variabel, format, dan deskripsi. Metadata yang baik membuat data lebih mudah dipahami dan digunakan.',
      tips: [
        'Selalu berikan label yang jelas untuk setiap variabel',
        'Dokumentasikan unit pengukuran dan skala',
        'Catat sumber data dan tanggal pengumpulan',
        'Simpan kamus data untuk referensi'
      ]
    },
    {
      title: 'Organisasi Dataset',
      description: 'Dataset yang terorganisir dengan baik memiliki struktur yang logis, variabel yang dikelompokkan dengan tepat, dan urutan yang memudahkan analisis.',
      tips: [
        'Kelompokkan variabel terkait secara berdekatan',
        'Letakkan variabel identifikasi di awal',
        'Urutkan kasus secara logis (kronologis, alfabetis, dll.)',
        'Pisahkan data mentah dari variabel yang dihitung'
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <IntroSection
        title="Kelola Data Anda"
        description="Fitur manajemen data membantu Anda mengatur, mengelola, dan mengoptimalkan struktur dataset untuk analisis yang lebih efektif. Dari pengaturan properti variabel hingga organisasi data, semua tools yang Anda butuhkan tersedia di sini."
        highlights={[
          'Atur properti dan metadata variabel',
          'Kelola struktur tanggal dan waktu',
          'Organisasi dan urutkan data',
          'Terapkan pembobotan kasus'
        ]}
      />

      <FeatureGrid
        title="Fitur Manajemen Data"
        description="Jelajahi berbagai tools untuk mengelola dan mengoptimalkan dataset Anda"
        features={features}
      />

      <ConceptSection
        title="Konsep Penting"
        description="Pahami prinsip-prinsip dasar manajemen data yang efektif"
        concepts={concepts}
      />
    </div>
  );
};

export default DataManagementTab;