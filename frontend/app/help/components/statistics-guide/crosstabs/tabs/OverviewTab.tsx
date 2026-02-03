import React from 'react';
<<<<<<< HEAD
import { Grid3x3, Target, TrendingUp, HelpCircle } from 'lucide-react';
import { 
  IntroSection, 
  FeatureGrid, 
  ConceptSection, 
  ExampleGrid 
=======
import { Grid3x3, HelpCircle, BookOpen, Target } from 'lucide-react';
import { 
  IntroSection,
  FeatureGrid,
  ConceptSection,
  StepList,
  ExampleGrid
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
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
<<<<<<< HEAD
          ],
        },
        {
          title: "Hasil yang Akan Diperoleh",
          icon: Grid3x3,
          items: [
            "Tabel kontingensi dengan jumlah teramati dan diharapkan",
            "Uji Chi-Square untuk independensi",
            "Persentase baris, kolom, dan total",
            "Ukuran asosiasi (Cramer's V, Gamma, dll.)",
            "Analisis residual untuk signifikansi sel",
            "Interpretasi statistik yang mudah dipahami"
          ]
        }
      ]}
=======
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
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    />

    <ConceptSection
      title="Konsep Dasar Crosstabs"
<<<<<<< HEAD
      icon={Target}
=======
      icon={Grid3x3}
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
      concepts={[
        {
          title: "Tabel Kontingensi",
          formula: "Matriks yang menampilkan frekuensi gabungan dua variabel kategorikal",
          description: "Variabel baris vs variabel kolom dengan interseksi menunjukkan jumlah observasi untuk setiap kombinasi kategori.",
<<<<<<< HEAD
          color: "emerald"
=======
          color: "blue"
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        },
        {
          title: "Uji Chi-Square",
          formula: "χ² = Σ((Observed - Expected)² / Expected)",
          description: "Menguji apakah ada hubungan signifikan antara dua variabel kategorikal.",
<<<<<<< HEAD
          color: "blue"
=======
          color: "purple"
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        },
        {
          title: "Ukuran Asosiasi",
          formula: "Cramer's V, Phi Coefficient, Contingency Coefficient",
          description: "Mengukur kekuatan hubungan antara variabel kategorikal (rentang 0-1).",
<<<<<<< HEAD
          color: "purple"
=======
          color: "emerald"
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        }
      ]}
    />

    <ExampleGrid
      title="Contoh Aplikasi Praktis"
<<<<<<< HEAD
      icon={TrendingUp}
=======
      icon={Target}
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
      examples={[
        {
          title: "Penelitian Medis",
          description: "Menguji hubungan antara jenis kelamin dan kejadian penyakit tertentu",
          color: "blue"
        },
        {
          title: "Survei Konsumen",
          description: "Menganalisis preferensi produk berdasarkan kelompok usia",
<<<<<<< HEAD
          color: "emerald"
=======
          color: "blue"
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        },
        {
          title: "Penelitian Pendidikan",
          description: "Hubungan metode pembelajaran dengan tingkat kelulusan",
<<<<<<< HEAD
          color: "purple"
=======
          color: "blue"
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        },
        {
          title: "Analisis Politik",
          description: "Preferensi voting berdasarkan lokasi geografis",
<<<<<<< HEAD
          color: "amber"
=======
          color: "blue"
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        }
      ]}
    />

<<<<<<< HEAD
    <IntroSection
      title="Tips Pemilihan Variabel"
      description="Variabel Baris: Sering kali merupakan variabel hasil atau dependen yang ingin dijelaskan. Variabel Kolom: Biasanya merupakan variabel prediktor atau independen yang menjelaskan. Pertimbangan: Pastikan kedua variabel bersifat kategorikal dan memiliki kategori yang jelas dan saling eksklusif."
      variant="tip"
=======
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
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    />
  </div>
);
