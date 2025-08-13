import React from 'react';
import { Search, HelpCircle, BookOpen, Target } from 'lucide-react';
import { 
  IntroSection,
  FeatureGrid,
  ConceptSection,
  StepList
} from '../../shared/StandardizedContentLayout';

export const OverviewTab = () => (
  <div className="space-y-6">
    <IntroSection
      title="Apa itu Analisis Explore?"
      description="Analisis Explore adalah metode eksplorasi data yang memberikan gambaran komprehensif tentang distribusi data dengan pendekatan robust. Berbeda dari statistik deskriptif biasa, analisis ini fokus pada identifikasi karakteristik data yang tidak terpengaruh oleh outlier."
      variant="info"
    />

    <FeatureGrid
      features={[
        {
          title: "Kapan Menggunakan Analisis Explore",
          icon: HelpCircle,
          items: [
            "Data exploration awal sebelum analisis lebih lanjut",
            "Mengidentifikasi outlier dan extreme values",
            "Memahami distribusi data yang mungkin tidak normal",
            "Perbandingan karakteristik data antar kelompok",
            "Validasi asumsi sebelum statistical testing",
            "Analisis data dengan potensi nilai ekstrem tinggi"
          ]
        },
        {
          title: "Yang Akan Anda Pelajari",
          icon: BookOpen,
          items: [
            "Cara memilih variabel dependent dan factor",
            "Pengaturan robust statistics dan outlier detection",
            "Interpretasi boxplots dan histogram",
            "Strategi by-group analysis",
            "Best practices untuk exploratory data analysis",
            "Pemahaman confidence intervals untuk robust measures"
          ]
        }
      ]}
      columns={2}
    />

    <ConceptSection
      title="Konsep Dasar yang Akan Dipelajari"
      icon={Search}
      concepts={[
        {
          title: "Robust Statistics",
          formula: "Statistics that are resistant to outliers",
          description: "Metode perhitungan yang memberikan hasil yang stabil meskipun ada nilai ekstrem dalam data.",
          color: "blue"
        },
        {
          title: "Outlier Detection",
          formula: "Systematic identification of extreme values",
          description: "Identifikasi sistematis nilai-nilai yang tidak biasa atau ekstrem dalam dataset.",
          color: "purple"
        },
        {
          title: "By-Group Analysis",
          formula: "Separate analysis for each category level",
          description: "Analisis terpisah untuk setiap level kategori, memungkinkan perbandingan antar kelompok.",
          color: "emerald"
        },
        {
          title: "Distribution Assessment",
          formula: "Shape, spread, and center evaluation",
          description: "Evaluasi menyeluruh tentang bentuk, penyebaran, dan pusat distribusi data.",
          color: "orange"
        }
      ]}
    />

    <StepList
      title="Panduan Cepat Memulai"
      icon={Target}
      steps={[
        {
          number: 1,
          title: "Persiapan Data",
          description: "Pastikan data mengandung minimal satu variabel numerik. Factor variable bersifat opsional untuk analisis by-group."
        },
        {
          number: 2,
          title: "Pilih Variabel",
          description: "Drag variabel NUMERIC ke Dependent List. Tambah variabel kategorikal ke Factor untuk analisis per kelompok."
        },
        {
          number: 3,
          title: "Atur Statistik",
          description: "Di tab Statistics, centang Descriptives + Outliers, set Confidence Interval 95% untuk robust analysis."
        },
        {
          number: 4,
          title: "Pilih Visualisasi",
          description: "Di tab Plots, pilih Boxplot + Histogram untuk memahami distribusi dan mengidentifikasi outlier."
        },
        {
          number: 5,
          title: "Interpretasi Hasil",
          description: "Analisis robust statistics, identifikasi outlier, dan bandingkan karakteristik antar kelompok jika ada factor."
        }
      ]}
    />
  </div>
);