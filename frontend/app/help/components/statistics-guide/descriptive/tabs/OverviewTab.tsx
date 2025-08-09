import React from 'react';
import { Calculator, Target, TrendingUp } from 'lucide-react';
import { 
  IntroSection, 
  FeatureGrid, 
  ConceptSection 
} from '../../shared/StandardizedContentLayout';

export const OverviewTab = () => (
  <div className="space-y-6">
    <IntroSection
      title="Apa itu Statistik Deskriptif?"
      description="Statistik deskriptif merangkum data Anda dengan ukuran-ukuran kunci seperti rata-rata, sebaran, dan bentuk distribusi. Mereka memberikan wawasan cepat tentang karakteristik data Anda."
      variant="info"
    />

    <FeatureGrid
      features={[
        {
          title: "Kapan Menggunakan Statistik Deskriptif",
          icon: Target,
          items: [
            "Memahami tendensi sentral data Anda",
            "Mengukur seberapa tersebar data Anda",
            "Memeriksa kualitas data dan outlier",
            "Membandingkan variabel atau kelompok yang berbeda",
            "Eksplorasi awal sebelum analisis lanjutan",
            "Validasi asumsi untuk uji statistik"
          ]
        }
      ]}
    />

    <ConceptSection
      title="Statistik Utama yang Akan Anda Dapatkan"
      icon={Calculator}
      concepts={[
        {
          title: "Tendensi Sentral",
          formula: "Mean (Rata-rata): Jumlah semua nilai dibagi jumlah data | Sum: Jumlah total dari semua nilai",
          description: "Ukuran yang menunjukkan nilai pusat atau representatif dari distribusi data.",
          color: "blue"
        },
        {
          title: "Ukuran Sebaran",
          formula: "Standard Deviation, Variance, Range, Min/Max, S.E. Mean",
          description: "Mengukur seberapa tersebar atau bervariasi data dari nilai pusatnya.",
          color: "purple"
        },
        {
          title: "Bentuk Distribusi",
          formula: "Skewness: Ukuran asimetri | Kurtosis: Ukuran ketajaman puncak",
          description: "Menggambarkan karakteristik bentuk distribusi data.",
          color: "orange"
        }
      ]}
    />
  </div>
);
