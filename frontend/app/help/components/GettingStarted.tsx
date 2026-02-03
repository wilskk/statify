import React from "react";
import { HelpGuideTemplate } from "../ui/HelpGuideTemplate";
<<<<<<< HEAD
import { HelpCard, HelpAlert } from "../ui/HelpLayout";
=======
import { HelpCard, HelpAlert, HelpStep } from "../ui/HelpLayout";
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
import { 
  FileVideo, 
  Database, 
  BarChart, 
  LayoutDashboard, 
  Play,
  BookOpen,
<<<<<<< HEAD
  TrendingUp
=======
  TrendingUp,
  ListOrdered
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
} from "lucide-react";

export const GettingStarted = () => {
  const sections = [
    {
<<<<<<< HEAD
=======
      id: 'how-to-start',
      title: 'Cara Memulai dengan Statify',
      description: 'Langkah-langkah awal untuk menggunakan Statify secara efektif',
      icon: ListOrdered,
      content: (
        <div className="space-y-4">
          <HelpStep number={1} title="Persiapan Awal">
            <p className="text-sm">
              Pastikan Anda memiliki file data yang ingin dianalisis. Statify mendukung 
              berbagai format seperti SPSS (.sav), Excel (.xlsx), CSV, dan data clipboard.
            </p>
          </HelpStep>

          <HelpStep number={2} title="Impor Data">
            <p className="text-sm">
              Klik menu <strong>File → Impor</strong> dan pilih format file yang sesuai. 
              Ikuti panduan impor untuk mengatur pengaturan seperti header dan tipe data.
            </p>
          </HelpStep>

          <HelpStep number={3} title="Eksplorasi Data">
            <p className="text-sm">
              Setelah data berhasil diimpor, jelajahi struktur data Anda melalui:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Panel Variabel untuk melihat daftar variabel</li>
              <li>Tampilan Data untuk melihat isi dataset</li>
              <li>Statistik dasar untuk memahami karakteristik data</li>
            </ul>
          </HelpStep>

          <HelpStep number={4} title="Mulai Analisis">
            <p className="text-sm">
              Pilih jenis analisis yang sesuai dari menu <strong>Analisis</strong>. 
              Mulai dengan statistik deskriptif untuk memahami data Anda secara umum.
            </p>
          </HelpStep>
        </div>
      )
    },
    {
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
      id: 'overview',
      title: 'Selamat Datang di Statify',
      description: 'Pengantar singkat tentang Statify',
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <p>
            Statify adalah alat analisis statistik mandiri yang sepenuhnya kompatibel dengan SPSS. 
            Tidak diperlukan pembuatan akun atau registrasi online. Ikuti langkah-langkah berikut untuk mulai menggunakan 
            analitik lanjutan Statify.
          </p>
          
          <HelpAlert variant="success" title="Keunggulan Statify">
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Mendukung format SPSS (.sav), namun beberapa fitur lanjutan masih memiliki keterbatasan</li>
              <li>Tidak memerlukan koneksi internet</li>
              <li>Antarmuka yang intuitif dan mudah digunakan</li>
              <li>Analisis statistik yang komprehensif</li>
            </ul>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'quick-start',
<<<<<<< HEAD
      title: 'Langkah Memulai Cepat',
      description: 'Panduan langkah demi langkah untuk memulai',
      icon: Play,
      steps: [
        {
          title: 'Impor Data Anda',
          description: 'Mulai dengan mengimpor file data Anda ke Statify',
          content: (
            <div className="space-y-3">
              <p>
                Mulai dengan mengimpor file SPSS (.sav) atau format data lain yang didukung langsung ke Statify.
              </p>
              
              <HelpCard title="Format Yang Didukung" variant="step">
                <ul className="text-sm space-y-1">
                  <li>• SPSS (.sav) - Format utama</li>
                  <li>• Excel (.xlsx, .xls)</li>
                  <li>• CSV (.csv)</li>
                  <li>• Data clipboard</li>
                </ul>
              </HelpCard>
            </div>
          )
        },
        {
          title: 'Jelajahi Dashboard',
          description: 'Familiarisasi dengan antarmuka dan fitur utama',
          content: (
            <div className="space-y-3">
              <p>
                Setelah mengimpor data, jelajahi dashboard untuk memahami struktur data dan fitur yang tersedia.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <HelpCard title="Panel Variabel" icon={Database}>
                  <p className="text-sm">Lihat dan kelola semua variabel dalam dataset Anda</p>
                </HelpCard>
                
                <HelpCard title="Tampilan Data" icon={LayoutDashboard}>
                  <p className="text-sm">Tampilkan dan edit data dalam format tabel</p>
                </HelpCard>
              </div>
            </div>
          )
        },
        {
          title: 'Mulai Analisis',
          description: 'Lakukan analisis statistik pertama Anda',
          content: (
            <div className="space-y-3">
              <p>
                Pilih jenis analisis yang sesuai dengan kebutuhan penelitian Anda.
              </p>
              
              <HelpCard title="Analisis Yang Tersedia" variant="feature">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <HelpCard title="Descriptive Statistics" icon={BarChart} variant="feature">
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Frequencies</li>
                      <li>• Descriptives</li>
                      <li>• Explore</li>
                      <li>• Crosstabs</li>
                    </ul>
                  </HelpCard>
                  <HelpCard title="Compare Means" icon={LayoutDashboard} variant="feature">
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• One-Sample T Test</li>
                      <li>• Independent-Samples T Test</li>
                      <li>• Paired-Samples T Test</li>
                      <li>• One-Way ANOVA</li>
                    </ul>
                  </HelpCard>
                  <HelpCard title="Regression & Correlate" icon={TrendingUp} variant="feature">
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Linear Regression</li>
                      <li>• Curve Estimation</li>
                      <li>• Correlate (Bivariate)</li>
                    </ul>
                  </HelpCard>

                  <HelpCard title="General Linear Model" icon={BookOpen} variant="feature">
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• General Linear Model</li>
                    </ul>
                  </HelpCard>
                  <HelpCard title="Classify" icon={Database} variant="feature">
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Classify</li>
                    </ul>
                  </HelpCard>
                  <HelpCard title="Dimension Reduction" icon={LayoutDashboard} variant="feature">
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Dimension Reduction</li>
                    </ul>
                  </HelpCard>
                  <HelpCard title="Nonparametric Tests" icon={FileVideo} variant="feature">
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Legacy Dialogs: Chi-square, Runs, 2 Independent, K Independent, 2 Related, K Related</li>
                    </ul>
                  </HelpCard>
                  <HelpCard title="Time Series" icon={TrendingUp} variant="feature">
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Smoothing, Decomposition, Autocorrelation, Unit Root Test, Box-Jenkins</li>
                    </ul>
                  </HelpCard>
                  <HelpCard title="Graphs" icon={BarChart} variant="feature">
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Chart Builder</li>
                    </ul>
                  </HelpCard>
                </div>
              </HelpCard>
            </div>
          )
        }
      ]
=======
      title: 'Panduan Memulai Cepat',
      description: 'Panduan langkah demi langkah untuk memulai',
      icon: Play,
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Impor Data Anda</h3>
            <p className="text-sm text-muted-foreground">
              Mulai dengan mengimpor file SPSS (.sav) atau format data lain yang didukung langsung ke Statify.
            </p>
            
            <HelpCard title="Format Yang Didukung" variant="step">
              <ul className="text-sm space-y-1">
                <li>• SPSS (.sav) - Format utama</li>
                <li>• Excel (.xlsx, .xls)</li>
                <li>• CSV (.csv)</li>
                <li>• Data clipboard</li>
              </ul>
            </HelpCard>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">2. Jelajahi Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              Setelah mengimpor data, familiarisasi dengan antarmuka dan fitur utama yang tersedia.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <HelpCard title="Panel Variabel" icon={Database}>
                <p className="text-sm">Lihat dan kelola semua variabel dalam dataset Anda</p>
              </HelpCard>
              
              <HelpCard title="Tampilan Data" icon={LayoutDashboard}>
                <p className="text-sm">Tampilkan dan edit data dalam format tabel</p>
              </HelpCard>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">3. Mulai Analisis</h3>
            <p className="text-sm text-muted-foreground">
              Pilih jenis analisis yang sesuai dengan kebutuhan penelitian Anda.
            </p>
            
            <HelpCard title="Analisis Yang Tersedia" variant="feature">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <HelpCard title="Descriptive Statistics" icon={BarChart} variant="feature">
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Frequencies</li>
                    <li>• Descriptives</li>
                    <li>• Explore</li>
                    <li>• Crosstabs</li>
                  </ul>
                </HelpCard>
                <HelpCard title="Compare Means" icon={LayoutDashboard} variant="feature">
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• One-Sample T Test</li>
                    <li>• Independent-Samples T Test</li>
                    <li>• Paired-Samples T Test</li>
                    <li>• One-Way ANOVA</li>
                  </ul>
                </HelpCard>
                <HelpCard title="Regression & Correlate" icon={TrendingUp} variant="feature">
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Linear Regression</li>
                    <li>• Curve Estimation</li>
                    <li>• Correlate (Bivariate)</li>
                  </ul>
                </HelpCard>
                <HelpCard title="Graphs" icon={BarChart} variant="feature">
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Chart Builder</li>
                  </ul>
                </HelpCard>
              </div>
            </HelpCard>
          </div>
        </div>
      )
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
    },
    {
      id: 'key-features',
      title: 'Fitur Utama',
      description: 'Pelajari tentang fitur-fitur penting di Statify',
      icon: TrendingUp,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HelpCard title="Impor Data" icon={FileVideo} variant="feature">
            <p className="text-sm">
              Impor berbagai format data dengan mudah dan cepat.
            </p>
          </HelpCard>

          <HelpCard title="Manajemen Data" icon={Database} variant="feature">
            <p className="text-sm">
              Kelola dan transformasi data dengan alat yang komprehensif.
            </p>
          </HelpCard>

          <HelpCard title="Analisis Statistik" icon={BarChart} variant="feature">
            <p className="text-sm">
              Lakukan berbagai jenis analisis statistik dengan mudah.
            </p>
          </HelpCard>

          <HelpCard title="Visualisasi" icon={TrendingUp} variant="feature">
            <p className="text-sm">
              Buat grafik dan chart yang informatif dan menarik.
            </p>
          </HelpCard>
        </div>
      )
    }
  ];



  const tips = [
    {
<<<<<<< HEAD
  type: 'tip' as const,
  title: 'Tip',
      content: 'Mulai dengan dataset kecil untuk memahami alur kerja Statify sebelum menggunakan dataset yang lebih besar.'
    },

  ];

  const relatedTopics = [
    { title: 'Impor File SPSS', href: '/help/file-guide/import-sav' },
    { title: 'Impor File Excel', href: '/help/file-guide/import-excel' },
    { title: 'Statistik Deskriptif', href: '/help/statistics-guide/descriptive' },
    { title: 'Manajemen Data', href: '/help/data-guide' }
=======
      type: 'tip' as const,
      title: 'Mulai dengan Dataset Kecil',
      content: 'Mulai dengan dataset kecil untuk memahami alur kerja Statify sebelum menggunakan dataset yang lebih besar atau kompleks.'
    },
    {
      type: 'info' as const,
      title: 'Eksplorasi Bertahap',
      content: 'Jelajahi fitur-fitur Statify secara bertahap. Mulai dari import data, kemudian statistik deskriptif, baru ke analisis yang lebih kompleks.'
    },
    {
      type: 'warning' as const,
      title: 'Backup Data Asli',
      content: 'Selalu simpan backup data asli Anda sebelum melakukan transformasi atau manipulasi data di Statify.'
    },
    {
      type: 'tip' as const,
      title: 'Manfaatkan Panduan',
      content: 'Gunakan panduan lengkap untuk setiap fitur yang tersedia di Help Center untuk memaksimalkan penggunaan Statify.'
    }
  ];

  const relatedTopics = [
    { title: 'Panduan File', href: '/help/file-guide' },
    { title: 'Panduan Data', href: '/help/data-guide' },
    { title: 'Panduan Statistik', href: '/help/statistics-guide' },
    { title: 'FAQ - Pertanyaan Umum', href: '/help/faq' },
    { title: 'Umpan Balik & Dukungan', href: '/help/feedback' }
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
  ];

  return (
    <HelpGuideTemplate
      title="Memulai dengan Statify"
      description="Panduan lengkap untuk mulai menggunakan Statify - alat analisis statistik yang kompatibel dengan SPSS"
      lastUpdated="2024-01-15"
      sections={sections}
<<<<<<< HEAD

=======
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};