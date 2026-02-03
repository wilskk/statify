import React from 'react';
<<<<<<< HEAD
import { HelpAlert, HelpCard } from '../../../ui/HelpLayout';
import { Database, Settings, Shield, BarChart3, CheckCircle, ArrowRight } from 'lucide-react';

const QuickStartGuide: React.FC = () => {
  const quickSteps = [
    {
      icon: Database,
      title: '1. Atur Properti Data',
      description: 'Mulai dengan mengatur nama variabel, label, dan tipe data yang sesuai',
      actions: [
  'Buka Data → Define Variable Properties',
        'Atur nama variabel yang deskriptif',
        'Tambahkan label yang informatif',
        'Pilih tipe data yang tepat (numeric, string, date)'
      ]
    },
    {
      icon: Settings,
      title: '2. Organisasi Dataset',
      description: 'Susun data Anda agar mudah dianalisis dan dipahami',
      actions: [
  'Buka Data → Sort Variables (urutkan variabel secara logis)',
  'Buka Data → Sort Cases (urutkan kasus jika diperlukan)',
  'Buka Data → Set Measurement Level (atur tingkat pengukuran)',
  'Buka Data → Weight Cases (terapkan pembobotan jika ada)'
      ]
    },
    {
      icon: Shield,
      title: '3. Periksa Kualitas Data',
      description: 'Pastikan data Anda berkualitas tinggi sebelum analisis',
      actions: [
        'Identifikasi missing values dan outliers',
  'Buka Data → Identify Duplicate Cases (cek duplikat)',
        'Validasi konsistensi data',
        'Dokumentasikan temuan dan tindakan'
      ]
    }
  ];

  const commonTasks = [
    {
      title: 'Agregasi Data',
      description: 'Lokasi: Data → Aggregate — buat statistik ringkasan per kelompok',
      icon: BarChart3
    },
    {
      title: 'Filter Data',
      description: 'Lokasi: Data → Select Cases — pilih subset data untuk analisis',
      icon: Database
    },
    {
      title: 'Restrukturisasi',
      description: 'Lokasi: Data → Restructure — ubah format data (wide ↔ long)',
      icon: Settings
    },
    {
      title: 'Definisi Tanggal',
      description: 'Lokasi: Data → Define Date and Time — atur struktur waktu untuk time series',
      icon: CheckCircle
    }
  ];

  const bestPractices = [
    {
      title: 'Penamaan Variabel',
      tips: [
        'Gunakan nama yang deskriptif dan konsisten',
        'Hindari spasi dan karakter khusus',
        'Gunakan konvensi penamaan yang jelas (camelCase, snake_case)',
        'Tambahkan prefix/suffix untuk kategori variabel'
      ]
    },
    {
      title: 'Dokumentasi Data',
      tips: [
        'Selalu berikan label yang informatif',
        'Dokumentasikan unit pengukuran',
        'Catat sumber dan tanggal pengumpulan data',
        'Simpan kamus data (data dictionary)'
      ]
    },
    {
      title: 'Backup dan Versioning',
      tips: [
        'Simpan backup data asli sebelum transformasi',
        'Gunakan versioning untuk track perubahan',
        'Dokumentasikan setiap langkah transformasi',
        'Test transformasi pada subset data terlebih dahulu'
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Quick Start Steps */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Panduan Cepat: 3 Langkah Manajemen Data</h2>
        <p className="text-gray-600 mb-6">
          Ikuti langkah-langkah berikut untuk mempersiapkan data Anda untuk analisis yang optimal.
        </p>
        
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {quickSteps.map((step, index) => (
            <HelpCard key={index} className="relative">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-muted/50 rounded-lg flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-foreground" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 mb-4">{step.description}</p>
                  <ul className="space-y-2">
                    {step.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="flex items-start space-x-2 text-sm text-gray-700">
                        <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </HelpCard>
          ))}
        </div>
      </div>

      {/* Common Tasks */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Tugas Umum Manajemen Data</h2>
        <p className="text-gray-600 mb-6">
          Akses cepat ke fitur-fitur yang paling sering digunakan dalam manajemen data.
        </p>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {commonTasks.map((task, index) => (
            <HelpCard key={index} className="hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="w-12 h-12 bg-muted/50 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <task.icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{task.title}</h3>
                <p className="text-sm text-gray-600">{task.description}</p>
              </div>
            </HelpCard>
          ))}
        </div>
      </div>

      {/* Best Practices */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Practices</h2>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {bestPractices.map((practice, index) => (
            <HelpAlert key={index} variant="tip" title={practice.title}>
              <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                {practice.tips.map((tip, tipIndex) => (
                  <li key={tipIndex}>{tip}</li>
                ))}
              </ul>
            </HelpAlert>
          ))}
        </div>
      </div>

  {/* Additional Resources removed per guidelines */}
    </div>
=======
import { Database, Settings, Shield, BarChart3, ListOrdered, Filter } from 'lucide-react';
import { HelpGuideTemplate } from '../../../ui/HelpGuideTemplate';
import { HelpAlert, HelpCard, HelpStep } from '../../../ui/HelpLayout';

const QuickStartGuide: React.FC = () => {
  const sections = [
    {
      id: 'how-to-manage',
      title: 'Cara Mengelola Data',
      description: 'Panduan langkah demi langkah untuk manajemen data yang efektif',
      icon: ListOrdered,
      content: (
        <div className="space-y-4">
          <HelpStep number={1} title="Atur Properti Data">
            <p className="text-sm">
              Mulai dengan mengatur nama variabel, label, dan tipe data yang sesuai:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Buka <strong>Data → Define Variable Properties</strong></li>
              <li>Atur nama variabel yang deskriptif</li>
              <li>Tambahkan label yang informatif</li>
              <li>Pilih tipe data yang tepat (numeric, string, date)</li>
            </ul>
          </HelpStep>

          <HelpStep number={2} title="Organisasi Dataset">
            <p className="text-sm">
              Susun data Anda agar mudah dianalisis dan dipahami:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Urutkan variabel secara logis dengan <strong>Sort Variables</strong></li>
              <li>Urutkan kasus jika diperlukan dengan <strong>Sort Cases</strong></li>
              <li>Atur tingkat pengukuran dengan <strong>Set Measurement Level</strong></li>
              <li>Terapkan pembobotan jika ada dengan <strong>Weight Cases</strong></li>
            </ul>
          </HelpStep>

          <HelpStep number={3} title="Periksa Kualitas Data">
            <p className="text-sm">
              Pastikan data Anda berkualitas tinggi sebelum analisis:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Identifikasi missing values dan outliers</li>
              <li>Cek duplikat dengan <strong>Identify Duplicate Cases</strong></li>
              <li>Validasi konsistensi data antar variabel</li>
              <li>Dokumentasikan temuan dan tindakan korektif</li>
            </ul>
          </HelpStep>
        </div>
      )
    },
    {
      id: 'common-tasks',
      title: 'Tugas Umum Manajemen Data',
      description: 'Fitur-fitur yang paling sering digunakan dalam manajemen data',
      icon: Settings,
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          <HelpCard title="Agregasi Data" icon={BarChart3} variant="feature">
            <p className="text-sm">
              <strong>Data → Aggregate</strong><br />
              Buat statistik ringkasan per kelompok untuk analisis summary
            </p>
          </HelpCard>

          <HelpCard title="Filter Data" icon={Filter} variant="feature">
            <p className="text-sm">
              <strong>Data → Select Cases</strong><br />
              Pilih subset data berdasarkan kriteria tertentu untuk analisis
            </p>
          </HelpCard>

          <HelpCard title="Restrukturisasi" icon={Settings} variant="feature">
            <p className="text-sm">
              <strong>Data → Restructure</strong><br />
              Ubah format data dari wide ke long atau sebaliknya
            </p>
          </HelpCard>

          <HelpCard title="Definisi Tanggal" icon={Database} variant="feature">
            <p className="text-sm">
              <strong>Data → Define Date and Time</strong><br />
              Atur struktur waktu untuk analisis time series
            </p>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      description: 'Praktik terbaik untuk manajemen data yang efektif',
      icon: Shield,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Persiapan Data">
            <p className="text-sm mt-2">
              Data yang berkualitas adalah foundation untuk analisis yang akurat. 
              Investasi waktu dalam persiapan data akan menghemat waktu di tahap analisis.
            </p>
          </HelpAlert>

          <div className="grid gap-4 md:grid-cols-3">
            <HelpCard title="Penamaan Variabel" icon={Database} variant="step">
              <ul className="text-sm space-y-1">
                <li>• Gunakan nama deskriptif dan konsisten</li>
                <li>• Hindari spasi dan karakter khusus</li>
                <li>• Gunakan konvensi penamaan yang jelas</li>
                <li>• Tambahkan prefix untuk kategori variabel</li>
              </ul>
            </HelpCard>

            <HelpCard title="Dokumentasi Data" icon={Settings} variant="step">
              <ul className="text-sm space-y-1">
                <li>• Berikan label yang informatif</li>
                <li>• Dokumentasikan unit pengukuran</li>
                <li>• Catat sumber dan tanggal pengumpulan</li>
                <li>• Simpan kamus data (data dictionary)</li>
              </ul>
            </HelpCard>

            <HelpCard title="Backup & Versioning" icon={Shield} variant="step">
              <ul className="text-sm space-y-1">
                <li>• Simpan backup data asli</li>
                <li>• Gunakan versioning untuk track perubahan</li>
                <li>• Dokumentasikan setiap transformasi</li>
                <li>• Test pada subset data terlebih dahulu</li>
              </ul>
            </HelpCard>
          </div>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'tip' as const,
      title: 'Mulai dengan Eksplorasi',
      content: 'Selalu mulai dengan mengeksplorasi data menggunakan statistik deskriptif sebelum melakukan transformasi atau analisis lanjutan.'
    },
    {
      type: 'info' as const,
      title: 'Dokumentasi Lengkap',
      content: 'Dokumentasikan setiap langkah transformasi data. Ini penting untuk reproducibility dan audit trail.'
    },
    {
      type: 'warning' as const,
      title: 'Backup Data Asli',
      content: 'Selalu simpan backup data asli sebelum melakukan transformasi. Gunakan Save As untuk membuat versi yang berbeda.'
    },
    {
      type: 'tip' as const,
      title: 'Validasi Setelah Transformasi',
      content: 'Setelah setiap transformasi, lakukan validasi untuk memastikan hasilnya sesuai ekspektasi sebelum melanjutkan.'
    }
  ];

  const relatedTopics = [
    { title: 'Define Variable Properties', href: '/help/data-guide/define-var-props' },
    { title: 'Sort Cases', href: '/help/data-guide/sort-cases' },
    { title: 'Select Cases', href: '/help/data-guide/select-cases' },
    { title: 'Aggregate Data', href: '/help/data-guide/aggregate' },
    { title: 'Set Measurement Level', href: '/help/data-guide/set-measurement-level' }
  ];

  return (
    <HelpGuideTemplate
      title="Quick Start - Manajemen Data"
      description="Panduan cepat untuk mengelola, mentransformasi, dan memastikan kualitas data di Statify"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
  );
};

export default QuickStartGuide;