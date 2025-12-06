import React from 'react';
import { Database, FileText, Calendar, Settings, Users, BarChart, ListOrdered } from 'lucide-react';
import { HelpGuideTemplate } from '../../../ui/HelpGuideTemplate';
import { HelpAlert, HelpCard, HelpStep } from '../../../ui/HelpLayout';

const DataManagementTab: React.FC = () => {
  const sections = [
    {
      id: 'how-to-manage',
      title: 'Cara Mengelola Data',
      description: 'Panduan langkah demi langkah untuk manajemen data yang efektif',
      icon: ListOrdered,
      content: (
        <div className="space-y-4">
          <HelpStep number={1} title="Atur Properti Variabel">
            <p className="text-sm">
              Mulai dengan mengatur definisi dasar variabel:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Buka <strong>Data → Define Variable Properties</strong></li>
              <li>Atur nama variabel yang deskriptif dan konsisten</li>
              <li>Tambahkan label yang informatif untuk keterbacaan</li>
              <li>Pilih tipe data yang tepat (numeric, string, date)</li>
            </ul>
          </HelpStep>

          <HelpStep number={2} title="Definisi Format Khusus">
            <p className="text-sm">
              Atur format khusus untuk tipe data tertentu:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Gunakan <strong>Data → Define Date and Time</strong> untuk variabel waktu</li>
              <li>Set format dan komponen tanggal/waktu yang sesuai</li>
              <li>Siapkan struktur untuk time series dan pelaporan periodik</li>
            </ul>
          </HelpStep>

          <HelpStep number={3} title="Atur Tingkat Pengukuran">
            <p className="text-sm">
              Tentukan skala pengukuran untuk analisis yang akurat:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Buka <strong>Data → Set Measurement Level</strong></li>
              <li>Pilih skala: nominal, ordinal, interval, atau rasio</li>
              <li>Pastikan seleksi sesuai dengan nature data</li>
            </ul>
          </HelpStep>

          <HelpStep number={4} title="Organisasi dan Pembobotan">
            <p className="text-sm">
              Atur struktur dan bobot data sesuai kebutuhan:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Gunakan <strong>Data → Sort Variables</strong> untuk mengatur urutan</li>
              <li>Gunakan <strong>Data → Sort Cases</strong> untuk mengurutkan baris</li>
              <li>Terapkan <strong>Data → Weight Cases</strong> jika diperlukan representativitas</li>
            </ul>
          </HelpStep>
        </div>
      )
    },
    {
      id: 'data-features',
      title: 'Fitur Manajemen Data',
      description: 'Tools utama untuk mengelola dan mengoptimalkan dataset',
      icon: Database,
      content: (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <HelpCard title="Properti Variabel" icon={Database} variant="feature">
            <p className="text-sm">
              <strong>Data → Define Variable Properties</strong><br />
              Atur nama variabel, label, dan tipe data untuk struktur yang jelas
            </p>
          </HelpCard>

          <HelpCard title="Definisi Tanggal & Waktu" icon={Calendar} variant="feature">
            <p className="text-sm">
              <strong>Data → Define Date and Time</strong><br />
              Set format dan komponen tanggal/waktu untuk time series
            </p>
          </HelpCard>

          <HelpCard title="Tingkat Pengukuran" icon={BarChart} variant="feature">
            <p className="text-sm">
              <strong>Data → Set Measurement Level</strong><br />
              Tentukan skala: nominal, ordinal, interval, rasio
            </p>
          </HelpCard>

          <HelpCard title="Bobot Kasus" icon={Users} variant="feature">
            <p className="text-sm">
              <strong>Data → Weight Cases</strong><br />
              Terapkan bobot untuk representativitas populasi
            </p>
          </HelpCard>

          <HelpCard title="Urutkan Variabel" icon={FileText} variant="feature">
            <p className="text-sm">
              <strong>Data → Sort Variables</strong><br />
              Atur urutan variabel untuk navigasi yang mudah
            </p>
          </HelpCard>

          <HelpCard title="Urutkan Kasus" icon={Settings} variant="feature">
            <p className="text-sm">
              <strong>Data → Sort Cases</strong><br />
              Susun ulang baris berdasarkan variabel kunci
            </p>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'concepts',
      title: 'Konsep Penting',
      description: 'Prinsip-prinsip fundamental dalam manajemen data',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Struktur Data yang Baik">
            <p className="text-sm mt-2">
              Data yang terstruktur dengan baik memiliki variabel yang jelas, tipe data yang tepat, dan format yang konsisten. 
              Ini memudahkan analisis dan mengurangi kesalahan interpretasi.
            </p>
          </HelpAlert>

          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
            <HelpCard title="Struktur Data" icon={Database} variant="step">
              <ul className="text-sm space-y-1">
                <li>• Gunakan nama variabel yang deskriptif</li>
                <li>• Pastikan tipe data yang tepat</li>
                <li>• Tambahkan label informatif</li>
                <li>• Hindari karakter khusus</li>
              </ul>
            </HelpCard>

            <HelpCard title="Manajemen Metadata" icon={FileText} variant="step">
              <ul className="text-sm space-y-1">
                <li>• Berikan label yang jelas</li>
                <li>• Dokumentasikan unit pengukuran</li>
                <li>• Catat sumber dan tanggal</li>
                <li>• Simpan kamus data</li>
              </ul>
            </HelpCard>

            <HelpCard title="Organisasi Dataset" icon={Settings} variant="step">
              <ul className="text-sm space-y-1">
                <li>• Kelompokkan variabel terkait</li>
                <li>• Letakkan ID di awal</li>
                <li>• Urutkan kasus secara logis</li>
                <li>• Pisahkan data mentah vs calculated</li>
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
      title: 'Konsistensi Penamaan',
      content: 'Gunakan konvensi penamaan yang konsisten untuk variabel. Misalnya: age_years, income_monthly, atau education_level.'
    },
    {
      type: 'info' as const,
      title: 'Backup Sebelum Perubahan',
      content: 'Selalu simpan backup file asli sebelum melakukan perubahan struktur data yang signifikan.'
    },
    {
      type: 'warning' as const,
      title: 'Validasi Tipe Data',
      content: 'Pastikan tipe data sesuai dengan nature variabel. Kesalahan tipe data dapat menyebabkan analisis yang tidak akurat.'
    },
    {
      type: 'tip' as const,
      title: 'Dokumentasi Lengkap',
      content: 'Dokumentasikan setiap variabel dengan label, unit, dan deskripsi yang jelas untuk memudahkan interpretasi hasil.'
    }
  ];

  const relatedTopics = [
    { title: 'Define Variable Properties', href: '/help/data-guide/define-var-props' },
    { title: 'Define Date and Time', href: '/help/data-guide/date-time' },
    { title: 'Set Measurement Level', href: '/help/data-guide/measurement-level' },
    { title: 'Weight Cases', href: '/help/data-guide/weight-cases' },
    { title: 'Sort Variables', href: '/help/data-guide/sort-variables' },
    { title: 'Sort Cases', href: '/help/data-guide/sort-cases' }
  ];

  return (
    <HelpGuideTemplate
      title="Manajemen Data"
      description="Fitur manajemen data membantu Anda mengatur, mengelola, dan mengoptimalkan struktur dataset untuk analisis yang lebih efektif"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default DataManagementTab;