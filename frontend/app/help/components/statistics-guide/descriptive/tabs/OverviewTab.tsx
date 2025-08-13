import React from 'react';
import { Calculator, HelpCircle, BookOpen, Target } from 'lucide-react';
import { 
  IntroSection,
  FeatureGrid,
  ConceptSection,
  StepList
} from '../../shared/StandardizedContentLayout';

export const OverviewTab = () => (
  <div className="space-y-6">
    <IntroSection
      title="Apa itu Statistik Deskriptif?"
      description="Statistik deskriptif merangkum data Anda dengan ukuran-ukuran kunci seperti rata-rata, sebaran, dan bentuk distribusi. Mereka memberikan wawasan cepat tentang karakteristik numerik data Anda."
      variant="info"
    />

    <FeatureGrid
      features={[
        {
          title: "Kapan Menggunakan Analisis Deskriptif",
          icon: HelpCircle,
          items: [
            "Eksplorasi awal dataset numerik",
            "Memahami distribusi dan karakteristik variabel",
            "Mendeteksi outlier dan pola data",
            "Mengecek normalitas distribusi",
            "Membandingkan statistik antar variabel",
            "Persiapan sebelum analisis inferensial",
            "Validasi kualitas data numerik"
          ]
        },
        {
          title: "Yang Akan Anda Pelajari",
          icon: BookOpen,
          items: [
            "Cara memilih variabel numerik untuk analisis",
            "Statistik central tendency dan dispersion",
            "Interpretasi skewness dan kurtosis",
            "Penggunaan confidence intervals",
            "Strategi handling missing values",
            "Best practices untuk descriptive analysis"
          ]
        }
      ]}
      columns={2}
    />

    <ConceptSection
      title="Statistik yang Dihasilkan"
      icon={Calculator}
      concepts={[
        {
          title: "Central Tendency", 
          formula: "Mean, Median, Sum - menggunakan weighted calculation dengan bobot W",
          description: "Ukuran nilai pusat distribusi. Mean sensitif outlier, Median robust terhadap outlier.",
          color: "blue"
        },
        {
          title: "Dispersion",
          formula: "Std. deviation, Variance, Range, Min/Max, S.E. Mean", 
          description: "Mengukur variabilitas dan penyebaran data. Standard Error mengukur presisi estimasi mean.",
          color: "purple"
        },
        {
          title: "Distribution",
          formula: "Skewness (kemencengan), Kurtosis (ketajaman puncak)",
          description: "Menggambarkan bentuk distribusi: simetri, ekor panjang, dan ketajaman puncak.",
          color: "orange"
        },
        {
          title: "Percentiles", 
          formula: "25th Percentile (Q1), 75th Percentile (Q3), IQR",
          description: "Membagi data menjadi kuartil. IQR = Q3-Q1 robust measure of spread.",
          color: "emerald"
        }
      ]}
    />

    <StepList
      title="Panduan Cepat Memulai"
      icon={Target}
      steps={[
        {
          number: 1,
          title: "Pilih Variabel Numerik",
          description: "Drag variabel scale/numeric ke Variables list. Pastikan data bersifat kuantitatif untuk mendapatkan statistik yang bermakna."
        },
        {
          number: 2,
          title: "Tentukan Statistik",
          description: "Di tab Statistics, pilih central tendency (mean, median), dispersion (std dev, variance), dan distribution (skewness, kurtosis)."
        },
        {
          number: 3,
          title: "Atur Display Options",
          description: "Pilih format output, missing value treatment, dan confidence interval level sesuai kebutuhan analisis."
        },
        {
          number: 4,
          title: "Interpretasi Hasil",
          description: "Analisis output untuk memahami karakteristik data: normalitas, variabilitas, dan central tendency."
        }
      ]}
    />
  </div>
);
