import React from 'react';
<<<<<<< HEAD
import { BarChart3, Target, Play, Settings, FileText } from 'lucide-react';
import { 
  IntroSection, 
  FeatureGrid, 
  StepList,
  ExampleGrid 
} from '../shared/StandardizedContentLayout';

export const QuickStartGuide = () => (
  <div className="space-y-6">
    <IntroSection
      title="Quick Start - Analisis Statistik dalam 3 Langkah"
      description="Ikuti panduan cepat ini untuk memulai analisis statistik di Statify dalam hitungan menit."
      variant="tip"
    />

    <StepList
      title="Langkah-langkah Analisis"
      icon={Play}
      steps={[
        {
          number: 1,
          title: "Pilih Analisis",
          description: "Tentukan jenis analisis yang sesuai dengan tipe data dan tujuan penelitian Anda."
        },
        {
          number: 2,
          title: "Atur Variabel",
          description: "Pilih dan atur variabel untuk analisis, tentukan peran masing-masing variabel."
        },
        {
          number: 3,
          title: "Interpretasi Hasil",
          description: "Pahami output analisis dan hubungkan dengan konteks penelitian Anda."
        }
      ]}
      variant="step"
    />

    <FeatureGrid
      features={[
        {
          title: "Jenis Analisis Tersedia",
          icon: BarChart3,
          items: [
            "Deskriptif - Mean, median, standar deviasi",
            "Frekuensi - Distribusi data kategorikal",
            "Crosstabs - Hubungan antar variabel kategorikal",
            "Explore - Analisis eksploratori mendalam",
            "Linear Regression - Hubungan linear antar variabel",
            "Univariate - ANOVA dan uji perbandingan grup"
          ]
        },
        {
          title: "Pengaturan Variabel",
          icon: Settings,
          items: [
            "Drag variabel dari daftar ke area analisis",
            "Tentukan peran variabel (dependent/independent)",
            "Atur opsi analisis sesuai kebutuhan",
            "Preview pengaturan sebelum menjalankan",
            "Simpan konfigurasi untuk analisis berulang",
            "Export pengaturan untuk dokumentasi"
          ]
        }
      ]}
      columns={2}
    />

    <ExampleGrid
      title="Jenis Analisis Populer"
      icon={Target}
      examples={[
        {
          title: "Analisis Deskriptif",
          description: "Ringkasan statistik dasar untuk memahami karakteristik data Anda"
        },
        {
          title: "Analisis Frekuensi",
          description: "Distribusi dan proporsi data kategorikal dengan tabel dan grafik"
        },
        {
          title: "Crosstabs",
          description: "Hubungan antara dua variabel kategorikal dengan uji chi-square"
        },
        {
          title: "Explore",
          description: "Analisis eksploratori mendalam dengan deteksi outlier dan normalitas"
        }
      ]}
      columns={2}
    />

    <ExampleGrid
      title="Tips Analisis Efektif"
      icon={FileText}
      examples={[
        {
          title: "Periksa Asumsi",
          description: "Validasi asumsi statistik sebelum menjalankan analisis untuk hasil yang akurat"
        },
        {
          title: "Visualisasi Data",
          description: "Gunakan grafik dan plot untuk memahami pola dan distribusi data"
        },
        {
          title: "Interpretasi Kontekstual",
          description: "Hubungkan hasil statistik dengan konteks penelitian dan domain knowledge"
        },
        {
          title: "Dokumentasi Lengkap",
          description: "Catat semua langkah analisis dan keputusan untuk reproducibility"
        }
      ]}
      columns={2}
    />
  </div>
);
=======
import { BarChart3, Target, Settings, FileText, ListOrdered } from 'lucide-react';
import { HelpGuideTemplate } from '../../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep } from '../../../ui/HelpLayout';

export const QuickStartGuide = () => {
  const sections = [
    {
      id: 'how-to-analyze',
      title: 'Cara Melakukan Analisis Statistik',
      description: 'Panduan langkah demi langkah untuk analisis statistik yang efektif',
      icon: ListOrdered,
      content: (
        <div className="space-y-4">
          <HelpStep number={1} title="Pilih Jenis Analisis">
            <p className="text-sm">
              Tentukan jenis analisis yang sesuai dengan tipe data dan tujuan penelitian Anda:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li><strong>Deskriptif</strong>: Mean, median, standar deviasi untuk ringkasan data</li>
              <li><strong>Frekuensi</strong>: Distribusi data kategorikal</li>
              <li><strong>Crosstabs</strong>: Hubungan antar variabel kategorikal</li>
              <li><strong>Regression</strong>: Hubungan linear antar variabel</li>
            </ul>
          </HelpStep>

          <HelpStep number={2} title="Atur Variabel Analisis">
            <p className="text-sm">
              Pilih dan atur variabel untuk analisis:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Drag variabel dari daftar ke area analisis</li>
              <li>Tentukan peran variabel (dependent/independent)</li>
              <li>Atur opsi analisis sesuai kebutuhan</li>
              <li>Preview pengaturan sebelum menjalankan</li>
            </ul>
          </HelpStep>

          <HelpStep number={3} title="Jalankan dan Interpretasi">
            <p className="text-sm">
              Pahami output analisis dan hubungkan dengan konteks penelitian:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Periksa asumsi statistik yang diperlukan</li>
              <li>Interpretasi hasil dalam konteks penelitian</li>
              <li>Dokumentasikan temuan dan keputusan analisis</li>
              <li>Export hasil untuk pelaporan</li>
            </ul>
          </HelpStep>
        </div>
      )
    },
    {
      id: 'analysis-types',
      title: 'Jenis Analisis Tersedia',
      description: 'Berbagai jenis analisis statistik yang dapat dilakukan',
      icon: BarChart3,
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          <HelpCard title="Descriptive Statistics" icon={BarChart3} variant="feature">
            <ul className="text-sm space-y-1">
              <li>• Frequencies - Distribusi frekuensi</li>
              <li>• Descriptives - Statistik deskriptif</li>
              <li>• Explore - Analisis eksploratori</li>
              <li>• Crosstabs - Tabulasi silang</li>
            </ul>
          </HelpCard>

          <HelpCard title="Regression & Correlation" icon={Target} variant="feature">
            <ul className="text-sm space-y-1">
              <li>• Linear Regression - Regresi linear</li>
              <li>• Curve Estimation - Estimasi kurva</li>
              <li>• Bivariate Correlation - Korelasi bivariat</li>
            </ul>
          </HelpCard>

          <HelpCard title="General Linear Model" icon={Settings} variant="feature">
            <ul className="text-sm space-y-1">
              <li>• Univariate - ANOVA satu arah</li>
              <li>• Multivariate - MANOVA</li>
              <li>• Repeated Measures - Pengukuran berulang</li>
            </ul>
          </HelpCard>

          <HelpCard title="Classification" icon={FileText} variant="feature">
            <ul className="text-sm space-y-1">
              <li>• K-Means Clustering - Pengelompokan data</li>
              <li>• Hierarchical Clustering - Kluster hierarkis</li>
              <li>• Discriminant Analysis - Analisis diskriminan</li>
            </ul>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'quick-tips',
      title: 'Tips Analisis Efektif',
      description: 'Praktik terbaik untuk analisis statistik yang akurat',
      icon: Target,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Persiapan Data">
            <p className="text-sm mt-2">
              Pastikan data sudah bersih dan sesuai dengan asumsi analisis sebelum memulai.
              Periksa missing values, outlier, dan distribusi data.
            </p>
          </HelpAlert>

          <div className="grid gap-4 md:grid-cols-2">
            <HelpCard title="Periksa Asumsi" icon={Settings} variant="step">
              <p className="text-sm">
                Validasi asumsi statistik sebelum menjalankan analisis untuk hasil yang akurat
              </p>
            </HelpCard>

            <HelpCard title="Visualisasi Data" icon={BarChart3} variant="step">
              <p className="text-sm">
                Gunakan grafik dan plot untuk memahami pola dan distribusi data sebelum analisis
              </p>
            </HelpCard>

            <HelpCard title="Interpretasi Kontekstual" icon={Target} variant="step">
              <p className="text-sm">
                Hubungkan hasil statistik dengan konteks penelitian dan domain knowledge
              </p>
            </HelpCard>

            <HelpCard title="Dokumentasi Lengkap" icon={FileText} variant="step">
              <p className="text-sm">
                Catat semua langkah analisis dan keputusan untuk reproducibility
              </p>
            </HelpCard>
          </div>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'tip' as const,
      title: 'Mulai dengan Eksplorasi',
      content: 'Selalu mulai dengan analisis deskriptif dan eksploratori untuk memahami karakteristik data sebelum analisis lanjutan.'
    },
    {
      type: 'info' as const,
      title: 'Validasi Asumsi',
      content: 'Periksa asumsi statistik seperti normalitas, homoskedastisitas, dan independensi sebelum menjalankan analisis inferensial.'
    },
    {
      type: 'warning' as const,
      title: 'Interpretasi Hati-hati',
      content: 'Hasil statistik signifikan tidak selalu berarti signifikan secara praktis. Pertimbangkan ukuran efek dan konteks penelitian.'
    },
    {
      type: 'tip' as const,
      title: 'Visualisasi Penting',
      content: 'Gunakan grafik dan chart untuk memvalidasi temuan statistik dan mengkomunikasikan hasil dengan lebih efektif.'
    }
  ];

  const relatedTopics = [
    { title: 'Descriptive Statistics', href: '/help/statistics-guide/descriptives' },
    { title: 'Frequencies Analysis', href: '/help/statistics-guide/frequencies' },
    { title: 'Linear Regression', href: '/help/statistics-guide/linear' },
    { title: 'Data Preparation', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Quick Start - Analisis Statistik"
      description="Panduan cepat untuk memulai analisis statistik di Statify dalam hitungan menit"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
