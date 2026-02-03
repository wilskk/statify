import React from 'react';
import { Shield, Search, AlertTriangle, CheckCircle, ListOrdered, BarChart3 } from 'lucide-react';
import { HelpGuideTemplate } from '../../../ui/HelpGuideTemplate';
import { HelpAlert, HelpCard, HelpStep } from '../../../ui/HelpLayout';

const DataQualityTab: React.FC = () => {
  const sections = [
    {
      id: 'how-to-check-quality',
      title: 'Cara Memeriksa Kualitas Data',
      description: 'Panduan langkah demi langkah untuk assessment kualitas data',
      icon: ListOrdered,
      content: (
        <div className="space-y-4">
          <HelpStep number={1} title="Audit Kelengkapan Data">
            <p className="text-sm">
              Periksa missing values dan kelengkapan dataset:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Gunakan <strong>Analyze → Descriptive Statistics → Frequencies</strong></li>
              <li>Periksa kolom "Missing" untuk setiap variabel</li>
              <li>Identifikasi pola missing data (MCAR, MAR, MNAR)</li>
              <li>Dokumentasikan temuan dan strategi penanganan</li>
            </ul>
          </HelpStep>

          <HelpStep number={2} title="Deteksi Outlier">
            <p className="text-sm">
              Identifikasi nilai ekstrem yang mungkin error atau anomali:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Gunakan <strong>Analyze → Descriptive Statistics → Explore</strong></li>
              <li>Buat boxplot untuk visualisasi outlier</li>
              <li>Periksa nilai minimum dan maksimum yang tidak wajar</li>
              <li>Investigasi penyebab sebelum menghapus outlier</li>
            </ul>
          </HelpStep>

          <HelpStep number={3} title="Validasi Konsistensi">
            <p className="text-sm">
              Periksa konsistensi antar variabel dan aturan bisnis:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Gunakan <strong>Analyze → Descriptive Statistics → Crosstabs</strong></li>
              <li>Periksa kombinasi nilai yang tidak logis</li>
              <li>Validasi range dan format setiap variabel</li>
              <li>Test aturan bisnis domain-specific</li>
            </ul>
          </HelpStep>

          <HelpStep number={4} title="Profiling dan Dokumentasi">
            <p className="text-sm">
              Buat profil data dan dokumentasi kualitas:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Gunakan <strong>Analyze → Descriptive Statistics → Descriptives</strong></li>
              <li>Dokumentasikan distribusi dan karakteristik data</li>
              <li>Buat report kualitas data komprehensif</li>
              <li>Simpan audit trail untuk reference</li>
            </ul>
          </HelpStep>
        </div>
      )
    },
    {
      id: 'quality-dimensions',
      title: 'Dimensi Kualitas Data',
      description: 'Aspek-aspek penting dalam menilai kualitas data',
      icon: Shield,
      content: (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <HelpCard title="Akurasi" icon={CheckCircle} variant="feature">
            <p className="text-sm">
              Seberapa benar data mencerminkan realitas yang sebenarnya
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Validasi dengan sumber eksternal</li>
              <li>• Cross-check dengan data lain</li>
              <li>• Periksa logical consistency</li>
            </ul>
          </HelpCard>

          <HelpCard title="Kelengkapan" icon={BarChart3} variant="feature">
            <p className="text-sm">
              Proporsi data yang tidak hilang atau kosong
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Hitung persentase missing values</li>
              <li>• Identifikasi pola missing data</li>
              <li>• Evaluasi impact pada analisis</li>
            </ul>
          </HelpCard>

          <HelpCard title="Konsistensi" icon={Shield} variant="feature">
            <p className="text-sm">
              Keseragaman format, nilai, dan struktur data
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Standardisasi format data</li>
              <li>• Unified coding schemes</li>
              <li>• Consistent naming conventions</li>
            </ul>
          </HelpCard>

          <HelpCard title="Validitas" icon={CheckCircle} variant="feature">
            <p className="text-sm">
              Kesesuaian dengan aturan bisnis dan domain
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Range validation rules</li>
              <li>• Business logic checks</li>
              <li>• Referential integrity</li>
            </ul>
          </HelpCard>

          <HelpCard title="Ketepatan Waktu" icon={AlertTriangle} variant="feature">
            <p className="text-sm">
              Seberapa up-to-date dan relevan data tersebut
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Periksa timestamp data</li>
              <li>• Validasi currency data</li>
              <li>• Assess data freshness</li>
            </ul>
          </HelpCard>

          <HelpCard title="Relevansi" icon={Search} variant="feature">
            <p className="text-sm">
              Kesesuaian dengan tujuan dan scope analisis
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Evaluasi fitness for purpose</li>
              <li>• Assess coverage requirements</li>
              <li>• Validate analytical needs</li>
            </ul>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'quality-concepts',
      title: 'Konsep Penting',
      description: 'Pemahaman mendalam tentang aspek kualitas data',
      icon: Search,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="warning" title="Tidak Ada Menu Khusus">
            <p className="text-sm mt-2">
              Saat ini tidak ada menu khusus di Data untuk Missing Values/Outliers/Validation/Profiling/Audit Trail/Quality Metrics. 
              Gunakan kombinasi fitur analisis deskriptif untuk pemeriksaan kualitas manual.
            </p>
          </HelpAlert>

          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            <HelpCard title="Missing Data Patterns" icon={AlertTriangle} variant="step">
              <ul className="text-sm space-y-1">
                <li>• <strong>MCAR:</strong> Missing Completely at Random</li>
                <li>• <strong>MAR:</strong> Missing at Random (depends on observed variables)</li>
                <li>• <strong>MNAR:</strong> Missing Not at Random (depends on unobserved)</li>
                <li>• Analisis pola sebelum imputasi</li>
                <li>• Dokumentasikan asumsi missing mechanism</li>
              </ul>
            </HelpCard>

            <HelpCard title="Outlier Detection" icon={Search} variant="step">
              <ul className="text-sm space-y-1">
                <li>• Gunakan multiple metode (IQR, Z-score, Mahalanobis)</li>
                <li>• Visualisasi dengan boxplot dan scatterplot</li>
                <li>• Investigasi penyebab sebelum penanganan</li>
                <li>• Pertimbangkan robust statistics</li>
                <li>• Dokumentasikan keputusan penanganan</li>
              </ul>
            </HelpCard>
          </div>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'tip' as const,
      title: 'Pemeriksaan Bertahap',
      content: 'Lakukan pemeriksaan kualitas data secara bertahap: completeness → accuracy → consistency → validity untuk hasil yang sistematis.'
    },
    {
      type: 'info' as const,
      title: 'Dokumentasi Temuan',
      content: 'Selalu dokumentasikan temuan kualitas data dan keputusan penanganan untuk audit trail dan reproducibility.'
    },
    {
      type: 'warning' as const,
      title: 'Outlier Investigation',
      content: 'Jangan langsung hapus outlier. Investigasi dulu apakah itu error data atau informasi penting yang perlu dianalisis.'
    },
    {
      type: 'tip' as const,
      title: 'Multiple Methods',
      content: 'Gunakan berbagai metode validasi untuk cross-check temuan dan meningkatkan confidence dalam assessment kualitas.'
    }
  ];

  const relatedTopics = [
    { title: 'Descriptive Statistics', href: '/help/statistics-guide/descriptive' },
    { title: 'Missing Values Analysis', href: '/help/data-guide/missing-values' },
    { title: 'Outlier Detection', href: '/help/data-guide/outliers' },
    { title: 'Data Validation', href: '/help/data-guide/validation' },
    { title: 'Explore Analysis', href: '/help/statistics-guide/explore' }
  ];

  return (
    <HelpGuideTemplate
      title="Kualitas Data"
      description="Praktik pemeriksaan dan assessment kualitas data untuk memastikan validitas dan reliability analisis statistik"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default DataQualityTab;