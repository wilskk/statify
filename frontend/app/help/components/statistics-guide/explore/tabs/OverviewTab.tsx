import React from 'react';
import { HelpCircle, FileText, TrendingUp } from 'lucide-react';
import { 
  IntroSection, 
  FeatureGrid, 
  ConceptSection 
} from '../../shared/StandardizedContentLayout';

export const OverviewTab = () => (
  <div className="space-y-6">
    <IntroSection
      title="Apa itu Analisis Explore?"
      description="Analisis Explore memberikan wawasan komprehensif tentang data Anda menggunakan metode statistik yang robust. Ini mengidentifikasi pola, outlier, dan karakteristik distribusi sambil memberikan estimasi yang dapat diandalkan yang tidak terpengaruh oleh nilai ekstrem."
      variant="info"
    />

    <FeatureGrid
      features={[
        {
          title: "Kapan Menggunakan Analisis Explore",
          icon: HelpCircle,
          items: [
            "Analisis data awal dan pemahaman mendalam",
            "Deteksi outlier dan penilaian kualitas data",
            "Analisis distribusi dan pemeriksaan normalitas",
            "Estimasi statistik yang robust terhadap outlier",
            "Identifikasi pola dan karakteristik data",
            "Perbandingan kelompok menggunakan variabel faktor"
          ]
        }
      ]}
    />

    <ConceptSection
      title="Apa yang Akan Anda Pelajari"
      icon={FileText}
      concepts={[
        {
          title: "Statistik Robust",
          formula: "Trimmed Mean, M-Estimators, Confidence Intervals",
          description: "Estimasi yang tidak terpengaruh outlier dan memberikan hasil yang dapat diandalkan.",
          color: "purple"
        },
        {
          title: "Deteksi Outlier",
          formula: "IQR Method, Box Plot Analysis",
          description: "Identifikasi nilai ekstrem dengan metode quartile dan visualisasi yang jelas.",
          color: "orange"
        },
        {
          title: "Visualisasi Lanjutan",
          formula: "Stem-and-Leaf, Normality Tests",
          description: "Distribusi dengan nilai eksak dan uji normalitas dengan Q-Q plot.",
          color: "blue"
        }
      ]}
    />

    <IntroSection
      title="Mengapa Explore Berbeda?"
      description="Lebih Robust: Tidak mudah terpengaruh oleh outlier dan nilai ekstrem. Lebih Komprehensif: Memberikan lebih banyak informasi tentang distribusi data. Lebih Informatif: Deteksi outlier otomatis dengan visualisasi yang jelas. Lebih Reliable: Estimasi yang dapat diandalkan untuk data dengan noise."
      variant="tip"
    />
  </div>
);