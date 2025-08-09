import React from 'react';
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
        'Urutkan variabel secara logis (Sort Variables)',
        'Urutkan kasus jika diperlukan (Sort Cases)',
        'Atur tingkat pengukuran (nominal, ordinal, scale)',
        'Terapkan pembobotan jika ada (Weight Cases)'
      ]
    },
    {
      icon: Shield,
      title: '3. Periksa Kualitas Data',
      description: 'Pastikan data Anda berkualitas tinggi sebelum analisis',
      actions: [
        'Identifikasi missing values dan outliers',
        'Cek duplikat dengan Identify Duplicate Cases',
        'Validasi konsistensi data',
        'Dokumentasikan temuan dan tindakan'
      ]
    }
  ];

  const commonTasks = [
    {
      title: 'Agregasi Data',
      description: 'Buat statistik ringkasan per kelompok',
      icon: BarChart3,
      link: '/help/data-guide/aggregate'
    },
    {
      title: 'Filter Data',
      description: 'Pilih subset data untuk analisis',
      icon: Database,
      link: '/help/data-guide/select-cases'
    },
    {
      title: 'Restrukturisasi',
      description: 'Ubah format data (wide ↔ long)',
      icon: Settings,
      link: '/help/data-guide/restructure'
    },
    {
      title: 'Definisi Tanggal',
      description: 'Atur struktur waktu untuk time series',
      icon: CheckCircle,
      link: '/help/data-guide/define-datetime'
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
            <HelpCard key={index} className="hover:shadow-md transition-shadow cursor-pointer">
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

      {/* Additional Resources */}
      <HelpAlert variant="info" title="Sumber Daya Tambahan">
        <div className="mt-2 space-y-2 text-sm">
          <p><strong>Video Tutorial:</strong> Tonton video panduan manajemen data di channel YouTube Statify</p>
          <p><strong>Template Dataset:</strong> Download template dataset untuk latihan</p>
          <p><strong>Community Forum:</strong> Bergabung dengan komunitas pengguna untuk tips dan trik</p>
          <p><strong>Documentation:</strong> Baca dokumentasi lengkap untuk fitur advanced</p>
        </div>
      </HelpAlert>
    </div>
  );
};

export default QuickStartGuide;