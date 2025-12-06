import React from 'react';
import { Grid3x3, HelpCircle, BookOpen, Target } from 'lucide-react';
import { 
  IntroSection,
  FeatureGrid,
  ConceptSection,
  StepList,
  ExampleGrid
} from '../../shared/StandardizedContentLayout';

export const OverviewTab = () => (
  <div className="space-y-6">
    <IntroSection
      title="Tentang Analisis Crosstabs"
      description="Analisis Crosstabs (tabulasi silang) digunakan untuk menguji hubungan antara dua variabel kategorikal dengan membuat tabel kontingensi. Analisis ini menunjukkan bagaimana frekuensi terdistribusi di antara kategori-kategori dan menguji signifikansi statistik hubungan tersebut."
      variant="info"
    />

    <FeatureGrid
      features={[
        {
          title: "Kapan Menggunakan Crosstabs",
          icon: HelpCircle,
          items: [
            "Menguji hubungan antara dua variabel kategorikal",
            "Menganalisis respons survei berdasarkan kelompok demografis",
            "Membandingkan proporsi di antara kategori yang berbeda",
            "Mengidentifikasi pola dalam data kategorikal",
            "Memvalidasi hipotesis tentang independensi variabel",
            "Analisis pasar dan segmentasi konsumen"
          ]
        },
        {
          title: "Yang Akan Anda Pelajari",
          icon: BookOpen,
          items: [
            "Cara memilih variabel baris dan kolom",
            "Pengaturan cells: frekuensi, persentase, residual",
            "Interpretasi uji Chi-Square dan ukuran asosiasi",
            "Strategi analisis tabel kontingensi",
            "Best practices untuk categorical data analysis",
            "Pemahaman expected vs observed frequencies"
          ]
        }
      ]}
      columns={2}
    />

    <ConceptSection
      title="Konsep Dasar Crosstabs"
      icon={Grid3x3}
      concepts={[
        {
          title: "Tabel Kontingensi",
          formula: "Matriks yang menampilkan frekuensi gabungan dua variabel kategorikal",
          description: "Variabel baris vs variabel kolom dengan interseksi menunjukkan jumlah observasi untuk setiap kombinasi kategori.",
          color: "blue"
        },
        {
          title: "Uji Chi-Square",
          formula: "χ² = Σ((Observed - Expected)² / Expected)",
          description: "Menguji apakah ada hubungan signifikan antara dua variabel kategorikal.",
          color: "purple"
        },
        {
          title: "Ukuran Asosiasi",
          formula: "Cramer's V, Phi Coefficient, Contingency Coefficient",
          description: "Mengukur kekuatan hubungan antara variabel kategorikal (rentang 0-1).",
          color: "emerald"
        }
      ]}
    />

    <ExampleGrid
      title="Contoh Aplikasi Praktis"
      icon={Target}
      examples={[
        {
          title: "Penelitian Medis",
          description: "Menguji hubungan antara jenis kelamin dan kejadian penyakit tertentu",
          color: "blue"
        },
        {
          title: "Survei Konsumen",
          description: "Menganalisis preferensi produk berdasarkan kelompok usia",
          color: "blue"
        },
        {
          title: "Penelitian Pendidikan",
          description: "Hubungan metode pembelajaran dengan tingkat kelulusan",
          color: "blue"
        },
        {
          title: "Analisis Politik",
          description: "Preferensi voting berdasarkan lokasi geografis",
          color: "blue"
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
          description: "Pastikan ada dua variabel kategorikal dengan kategori yang jelas dan saling eksklusif."
        },
        {
          number: 2,
          title: "Pilih Variabel",
          description: "Drag variabel outcome/dependen ke Rows, dan variabel prediktor/independen ke Columns."
        },
        {
          number: 3,
          title: "Konfigurasi Cells",
          description: "Di tab Cells, atur tampilan frekuensi, persentase baris/kolom, dan residual sesuai kebutuhan."
        },
        {
          number: 4,
          title: "Pilih Statistik",
          description: "Di tab Statistics, pilih Chi-Square, Fisher's Exact test, dan ukuran asosiasi yang relevan."
        },
        {
          number: 5,
          title: "Interpretasi Hasil",
          description: "Analisis tabel kontingensi, signifikansi Chi-Square, dan kekuatan asosiasi untuk menarik kesimpulan."
        }
      ]}
    />
  </div>
);
