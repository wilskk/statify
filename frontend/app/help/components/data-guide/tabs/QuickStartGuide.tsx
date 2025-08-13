import React from 'react';
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
  );
};

export default QuickStartGuide;