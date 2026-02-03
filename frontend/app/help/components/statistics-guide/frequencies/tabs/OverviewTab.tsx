import React from 'react';
<<<<<<< HEAD
import { HelpCircle, FileText } from 'lucide-react';
import { 
  IntroSection, 
  FeatureGrid 
=======
import { BarChart3, HelpCircle, BookOpen, Target } from 'lucide-react';
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
      title="Apa itu Analisis Frekuensi?"
<<<<<<< HEAD
      description="Analisis frekuensi menghitung seberapa sering setiap nilai unik muncul dalam data Anda. Ini membantu Anda memahami distribusi nilai dan mengidentifikasi pola."
=======
      description="Analisis frekuensi menghitung seberapa sering setiap nilai unik muncul dalam data Anda. Ini membantu Anda memahami distribusi nilai dan mengidentifikasi pola dalam data kategorikal maupun numerik."
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
      variant="info"
    />

    <FeatureGrid
      features={[
        {
          title: "Kapan Menggunakan Analisis Frekuensi",
          icon: HelpCircle,
          items: [
            "Memahami distribusi data kategorikal",
            "Mengidentifikasi nilai yang paling umum",
            "Memeriksa kualitas data dan nilai yang hilang",
<<<<<<< HEAD
            "Mempersiapkan data untuk analisis lebih lanjut"
=======
            "Mempersiapkan data untuk analisis lebih lanjut",
            "Validasi data entry dan deteksi anomali",
            "Eksplorasi awal sebelum analisis kompleks"
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
          ]
        },
        {
          title: "Yang Akan Anda Pelajari",
<<<<<<< HEAD
          icon: FileText,
          items: [
            "Cara memilih variabel untuk analisis",
            "Opsi statistik yang tersedia",
            "Opsi kustomisasi grafik",
            "Cara menginterpretasi hasil"
          ]
        }
      ]}
=======
          icon: BookOpen,
          items: [
            "Cara memilih variabel untuk analisis",
            "Opsi statistik yang tersedia",
            "Opsi kustomisasi grafik dan visualisasi",
            "Cara menginterpretasi hasil",
            "Strategi analisis data kategorikal",
            "Best practices untuk frequency analysis"
          ]
        }
      ]}
      columns={2}
    />

    <ConceptSection
      title="Konsep Dasar Frequency Analysis"
      icon={BarChart3}
      concepts={[
        {
          title: "Frequency Count",
          formula: "Jumlah kemunculan setiap nilai dalam dataset",
          description: "Perhitungan dasar yang menghitung berapa kali setiap nilai unik muncul dalam variabel.",
          color: "blue"
        },
        {
          title: "Valid Percent",
          formula: "Persentase berdasarkan kasus valid (non-missing)",
          description: "Persentase yang mengeluarkan missing values, memberikan gambaran distribusi sebenarnya.",
          color: "emerald"
        },
        {
          title: "Cumulative Percent",
          formula: "Akumulasi persentase dari nilai terendah hingga tertinggi",
          description: "Berguna untuk memahami distribusi kumulatif dan percentile ranking.",
          color: "purple"
        }
      ]}
    />

    <StepList
      title="Panduan Cepat Memulai"
      icon={Target}
      steps={[
        {
          number: 1,
          title: "Pilih Variabel",
          description: "Drag variabel ke Variables list. Pilih variabel kategorikal atau numerik yang ingin dianalisis distribusinya."
        },
        {
          number: 2,
          title: "Tentukan Statistik",
          description: "Di tab Statistics, pilih ukuran tendensi sentral dan dispersi yang diinginkan seperti mean, median, dan standard deviation."
        },
        {
          number: 3,
          title: "Atur Visualisasi",
          description: "Di tab Charts, pilih jenis grafik (bar chart, pie chart, histogram) untuk memvisualisasikan distribusi frekuensi."
        },
        {
          number: 4,
          title: "Jalankan Analisis",
          description: "Klik Run untuk mendapatkan tabel frekuensi lengkap dengan statistik dan visualisasi yang dipilih."
        }
      ]}
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    />
  </div>
);