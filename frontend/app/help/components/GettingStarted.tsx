import React from "react";
import { HelpGuideTemplate } from "../ui/HelpGuideTemplate";
import { HelpCard, HelpAlert, HelpSection } from "../ui/HelpLayout";
import { 
  FileVideo, 
  Database, 
  BarChart, 
  LayoutDashboard, 
  Lightbulb, 
  CheckCircle2, 
  Play,
  BookOpen,
  Settings,
  TrendingUp
} from "lucide-react";

export const GettingStarted = () => {
  const sections = [
    {
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
              <li>Sepenuhnya kompatibel dengan format SPSS (.sav)</li>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <h5 className="font-semibold mb-1">Deskriptif</h5>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Frekuensi</li>
                      <li>• Deskriptif</li>
                      <li>• Eksplorasi</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-1">Inferensial</h5>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• T-Test</li>
                      <li>• ANOVA</li>
                      <li>• Regresi</li>
                    </ul>
                  </div>
                </div>
              </HelpCard>
            </div>
          )
        }
      ]
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
      type: 'tip' as const,
      title: 'Pro Tip',
      content: 'Mulai dengan dataset kecil untuk memahami alur kerja Statify sebelum menggunakan dataset yang lebih besar.'
    },

  ];

  const relatedTopics = [
    { title: 'Impor File SPSS', href: '/help/file-guide/import-sav' },
    { title: 'Impor File Excel', href: '/help/file-guide/import-excel' },
    { title: 'Statistik Deskriptif', href: '/help/statistics-guide/descriptive' },
    { title: 'Manajemen Data', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Memulai dengan Statify"
      description="Panduan lengkap untuk mulai menggunakan Statify - alat analisis statistik yang kompatibel dengan SPSS"
      lastUpdated="2024-01-15"
      sections={sections}

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};