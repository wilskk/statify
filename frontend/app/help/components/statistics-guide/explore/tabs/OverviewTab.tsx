import React from 'react';
<<<<<<< HEAD
import { HelpCircle, FileText } from 'lucide-react';
import { 
  IntroSection, 
  FeatureGrid, 
  ConceptSection 
=======
import { Search, HelpCircle, BookOpen, Target } from 'lucide-react';
import { 
  IntroSection,
  FeatureGrid,
  ConceptSection,
  StepList
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
} from '../../shared/StandardizedContentLayout';

export const OverviewTab = () => (
  <div className="space-y-6">
    <IntroSection
      title="Apa itu Analisis Explore?"
<<<<<<< HEAD
      description="Analisis Explore menggunakan ExamineCalculator untuk menghasilkan statistik robust berbasis SPSS EXAMINE logic. Menggabungkan DescriptiveCalculator, FrequencyCalculator, dan tambahan algoritma robust: 5% trimmed mean, Tukey's Hinges untuk IQR, M-estimators, dan confidence intervals dengan t-distribution approximation."
=======
      description="Analisis Explore adalah metode eksplorasi data yang memberikan gambaran komprehensif tentang distribusi data dengan pendekatan robust. Berbeda dari statistik deskriptif biasa, analisis ini fokus pada identifikasi karakteristik data yang tidak terpengaruh oleh outlier."
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
      variant="info"
    />

    <FeatureGrid
      features={[
        {
          title: "Kapan Menggunakan Analisis Explore",
          icon: HelpCircle,
          items: [
<<<<<<< HEAD
            "Eksplorasi data dengan statistik robust yang tidak terpengaruh outlier",
            "Deteksi extreme values menggunakan Tukey's Hinges dan IQR criteria",
            "Analisis distribusi dengan 5% trimmed mean dan M-estimators", 
            "Confidence interval untuk mean menggunakan t-distribution",
            "Perbandingan kelompok dengan factor variables (by-group analysis)",
            "Comprehensive outlier analysis dengan mild/extreme classification"
          ]
        }
      ]}
    />

    <ConceptSection
      title="Komponen ExamineCalculator yang Akan Dipelajari"
      icon={FileText}
      concepts={[
        {
          title: "5% Trimmed Mean",
          formula: "Mean after removing 5% highest and lowest values by weight",
          description: "Robust central tendency estimator yang lebih tahan terhadap outlier dibanding arithmetic mean.",
          color: "purple"
        },
        {
          title: "Tukey's Hinges IQR",
          formula: "Q3 - Q1 using Tukey method, not percentile-based",
          description: "Robust measure of spread menggunakan definition Tukey untuk quartiles, bukan percentile 25th/75th.",
          color: "orange"
        },
        {
          title: "Outlier Detection",
          formula: "1.5×IQR (mild) and 3×IQR (extreme) with Tukey fences",
          description: "SPSS EXAMINE compatible outlier detection dengan classification mild/extreme outliers.",
          color: "blue"
        },
        {
          title: "M-Estimators",
          formula: "Huber, Tukey, Hampel, Andrews estimators",
          description: "Robust location estimators yang menolak influence dari outliers (current: 5% trimmed approximation).",
          color: "emerald"
=======
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
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        }
      ]}
    />

<<<<<<< HEAD
    <IntroSection
      title="Mengapa ExamineCalculator Unggul?"
      description="Robust Statistics: Menggunakan 5% trimmed mean dan M-estimators yang tidak terpengaruh outlier. SPSS Compatible: Logic dan algoritma mengikuti standard SPSS EXAMINE procedure. Comprehensive Analysis: Menggabungkan frequency + descriptive + robust statistics dalam satu analisis. Accurate Outlier Detection: Tukey's Hinges memberikan IQR yang lebih robust untuk outlier detection. Weighted Support: Semua computation mendukung case weights untuk survey data atau complex sampling."
      variant="tip"
=======
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
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    />
  </div>
);