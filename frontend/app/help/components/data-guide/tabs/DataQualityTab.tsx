import React from 'react';
import StandardizedContentLayout from '../../statistics-guide/shared/StandardizedContentLayout';
const { IntroSection, FeatureGrid, ConceptSection } = StandardizedContentLayout;
import { Shield, Search, AlertTriangle, CheckCircle, Target, TrendingUp } from 'lucide-react';

const DataQualityTab: React.FC = () => {
  const features = [
    {
      icon: Search,
      title: 'Deteksi Missing Values',
      description: 'Identifikasi dan analisis pola data yang hilang dalam dataset',
      link: '/help/data-guide/missing-values'
    },
    {
      icon: AlertTriangle,
      title: 'Identifikasi Outliers',
      description: 'Temukan nilai ekstrem yang mungkin mempengaruhi analisis',
      link: '/help/data-guide/outliers'
    },
    {
      icon: Shield,
      title: 'Validasi Data',
      description: 'Periksa konsistensi dan validitas data berdasarkan aturan bisnis',
      link: '/help/data-guide/data-validation'
    },
    {
      icon: Target,
      title: 'Profiling Data',
      description: 'Analisis distribusi, frekuensi, dan karakteristik setiap variabel',
      link: '/help/data-guide/data-profiling'
    },
    {
      icon: CheckCircle,
      title: 'Audit Trail',
      description: 'Lacak perubahan dan transformasi yang dilakukan pada data',
      link: '/help/data-guide/audit-trail'
    },
    {
      icon: TrendingUp,
      title: 'Quality Metrics',
      description: 'Ukur dan monitor kualitas data dengan berbagai metrik',
      link: '/help/data-guide/quality-metrics'
    }
  ];

  const concepts = [
    {
      title: 'Dimensi Kualitas Data',
      description: 'Kualitas data dapat diukur dari berbagai dimensi yang saling terkait dan mempengaruhi validitas analisis.',
      tips: [
        'Akurasi: Seberapa benar data mencerminkan realitas',
        'Kelengkapan: Proporsi data yang tidak hilang',
        'Konsistensi: Keseragaman format dan nilai',
        'Validitas: Kesesuaian dengan aturan bisnis',
        'Ketepatan waktu: Seberapa up-to-date data tersebut',
        'Relevansi: Kesesuaian dengan tujuan analisis'
      ]
    },
    {
      title: 'Missing Data Patterns',
      description: 'Memahami pola data yang hilang penting untuk memilih strategi penanganan yang tepat.',
      tips: [
        'MCAR (Missing Completely at Random): Hilang secara acak',
        'MAR (Missing at Random): Hilang tergantung variabel lain',
        'MNAR (Missing Not at Random): Hilang karena nilai itu sendiri',
        'Analisis pola missing sebelum imputasi',
        'Dokumentasikan asumsi tentang mekanisme missing'
      ]
    },
    {
      title: 'Outlier Detection',
      description: 'Outlier dapat berupa kesalahan data atau informasi penting yang perlu dianalisis lebih lanjut.',
      tips: [
        'Gunakan multiple metode deteksi (IQR, Z-score, dll.)',
        'Visualisasi outlier dengan boxplot dan scatterplot',
        'Investigasi penyebab outlier sebelum menghapus',
        'Pertimbangkan robust statistics untuk data dengan outlier',
        'Dokumentasikan keputusan penanganan outlier'
      ]
    },
    {
      title: 'Data Validation Rules',
      description: 'Aturan validasi memastikan data memenuhi kriteria bisnis dan logika yang ditetapkan.',
      tips: [
        'Range checks: Nilai dalam rentang yang wajar',
        'Format checks: Sesuai dengan format yang diharapkan',
        'Consistency checks: Konsisten antar variabel terkait',
        'Business rules: Sesuai dengan aturan domain spesifik',
        'Referential integrity: Konsisten dengan data referensi'
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <IntroSection
        title="Kualitas Data"
        description="Pastikan kualitas data Anda dengan tools komprehensif untuk deteksi, validasi, dan monitoring. Data berkualitas tinggi adalah fondasi untuk analisis yang akurat dan insight yang dapat dipercaya."
        highlights={[
          'Deteksi dan analisis missing values',
          'Identifikasi outliers dan anomali',
          'Validasi berdasarkan aturan bisnis',
          'Profiling dan monitoring kualitas'
        ]}
      />

      <FeatureGrid
        title="Tools Kualitas Data"
        description="Jelajahi berbagai tools untuk memastikan dan meningkatkan kualitas data Anda"
        features={features}
      />

      <ConceptSection
        title="Konsep Kualitas Data"
        description="Pahami prinsip-prinsip dan metodologi untuk mengelola kualitas data"
        concepts={concepts}
      />
    </div>
  );
};

export default DataQualityTab;