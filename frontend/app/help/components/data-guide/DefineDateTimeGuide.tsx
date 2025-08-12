/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep, HelpSection } from '../../ui/HelpLayout';
import { Calendar, Clock, Settings } from 'lucide-react';

const DefineDateTimeGuide = () => {
  const sections = [
    {
      id: 'how-to-steps',
      title: 'Cara Mendefinisikan Tanggal dan Waktu',
      description: 'Panduan langkah demi langkah untuk mengatur struktur tanggal dan waktu',
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <HelpStep
            number={1}
            title="Buka Menu Data"
            description="Klik 'Data' di bilah menu atas aplikasi."
          />
          <HelpStep
            number={2}
            title="Pilih Define Dates"
            description="Klik Data → Define Dates untuk membuka dialog definisi tanggal."
          />
          <HelpStep
            number={3}
            title="Pilih Format Tanggal"
            description="Pilih format tanggal yang sesuai dengan struktur data Anda (misalnya: Tahun, Kuartal, Bulan)."
          />
          <HelpStep
            number={4}
            title="Tinjau Pratinjau"
            description="Periksa pratinjau variabel yang akan dibuat dan contoh data yang ditampilkan."
          />
          <HelpStep
            number={5}
            title="Terapkan Definisi"
            description="Klik 'OK' untuk membuat variabel tanggal baru dalam dataset Anda."
          />
        </div>
      )
    },
    {
      id: 'features',
      title: 'Fitur & Manfaat',
      description: 'Memahami cara kerja dan manfaat fitur definisi tanggal',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpCard title="Pembuatan Variabel Otomatis" variant="feature">
            <p className="text-sm text-muted-foreground">
              Sistem secara otomatis membuat variabel baru untuk setiap komponen waktu yang Anda butuhkan
              (seperti YEAR_, QUARTER_, MONTH_).
            </p>
          </HelpCard>
          
          <HelpCard title="Variabel DATE_ Terformat" variant="feature">
            <p className="text-sm text-muted-foreground">
              Membangun variabel tanggal yang diformat untuk menampilkan tanggal lengkap dalam format yang mudah dibaca.
            </p>
          </HelpCard>
          
          <HelpAlert variant="info" title="Pengaturan Otomatis">
            <p className="text-sm mt-2">
              Setelah Anda memilih format tanggal, sistem secara otomatis mengatur variabel Anda 
              sehingga analisis deret waktu akan bekerja dengan benar dengan data Anda.
            </p>
          </HelpAlert>
          
          <HelpSection title="Contoh: Tahun dan Bulan">
            <HelpCard title="Yang Akan Anda Dapatkan" variant="feature">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Pilihan Anda</strong>: Tahun, bulan</li>
                <li><strong>Nilai awal</strong>: Tahun: 2022, Bulan: 11</li>
                <li><strong>Variabel baru yang dibuat</strong>:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><code>YEAR_</code> - menampilkan tahun (2022)</li>
                    <li><code>MONTH_</code> - menampilkan bulan (11)</li>
                    <li><code>DATE_</code> - menampilkan tanggal terformat (2022-11)</li>
                  </ul>
                </li>
              </ul>
            </HelpCard>
          </HelpSection>
          
          <HelpSection title="Contoh: Minggu dan Hari Kerja">
            <HelpCard title="Yang Akan Anda Dapatkan" variant="feature">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Pilihan Anda</strong>: Minggu, hari kerja (minggu 5 hari)</li>
                <li><strong>Nilai awal</strong>: Minggu: 51, Hari kerja: 4</li>
                <li><strong>Variabel baru yang dibuat</strong>:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><code>WEEK_</code> - menampilkan nomor minggu (51)</li>
                    <li><code>WDAY_</code> - menampilkan hari kerja (4)</li>
                    <li><code>DATE_</code> - menampilkan tanggal terformat (51-4)</li>
                  </ul>
                </li>
              </ul>
            </HelpCard>
          </HelpSection>
        </div>
      )
    },
    {
      id: 'supported-formats',
      title: 'Format yang Tersedia',
      description: 'Pilih format tanggal yang tepat untuk data Anda',
      icon: Clock,
      content: (
        <div className="space-y-4">
          <p>
            Berikut adalah semua format tanggal yang dapat Anda pilih. Setiap opsi membuat
            variabel yang tepat dan variabel DATE_ terformat untuk kebutuhan Anda.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <HelpCard title="Format Dasar" variant="step">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Tahun saja</li>
                <li>Tahun, kuartal</li>
                <li>Tahun, bulan</li>
                <li>Year, quarter, month</li>
                <li>Day only</li>
                <li>Week, day</li>
              </ul>
            </HelpCard>
            
            <HelpCard title="Workday Formats" variant="step">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Week, workday (5-day week)</li>
                <li>Week, workday (6-day week)</li>
                <li>Day, work hours (8-hour)</li>
                <li>Week, workday, hour</li>
              </ul>
            </HelpCard>
            
            <HelpCard title="Time Formats" variant="step">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Hour only</li>
                <li>Day, hour</li>
                <li>Week, day, hour</li>
                <li>Minute only</li>
                <li>Hour, minute</li>
                <li>Day, hour, minute</li>
              </ul>
            </HelpCard>
            
            <HelpCard title="High Precision" variant="step">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Second only</li>
                <li>Minute, second</li>
                <li>Hour, minute, second</li>
                <li>Remove date (clears existing date definition)</li>
              </ul>
            </HelpCard>
          </div>
        </div>
      )
    },
  ];



  const tips = [
    {
      type: 'tip' as const,
      title: 'Perencanaan Format',
      content: 'Pikirkan struktur tanggal yang dibutuhkan sebelum memulai untuk memastikan hasil analisis deret waktu yang optimal.'
    },
    {
      type: 'info' as const,
      title: 'Pratinjau Hasil',
      content: 'Sistem menampilkan contoh data sehingga Anda dapat melihat persis bagaimana struktur tanggal akan terlihat setelah diterapkan.'
    },
    {
      type: 'success' as const,
      title: 'Integrasi Analisis',
      content: 'Variabel tanggal yang dibuat secara otomatis akan kompatibel dengan semua fitur analisis deret waktu di Statify.'
    }
  ];

  const relatedTopics = [
    { title: 'Definisi Properti Variabel', href: '/help/data-guide/define-var-props' },
    { title: 'Restrukturisasi Data', href: '/help/data-guide/restructure' },
    { title: 'Urutkan Kasus', href: '/help/data-guide/sort-cases' },
    { title: 'Panduan Analisis Statistik', href: '/help/statistics-guide' },
    { title: 'Panduan Manajemen Data', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Definisi Tanggal dan Waktu"
      description="Panduan lengkap untuk mengatur struktur berbasis waktu dalam dataset Anda di Statify"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default DefineDateTimeGuide;