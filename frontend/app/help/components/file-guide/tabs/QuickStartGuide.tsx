import React from 'react';
import { Upload, Database, Download, ListOrdered, FileText, Settings } from 'lucide-react';
import { HelpGuideTemplate } from '../../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep } from '../../../ui/HelpLayout';

export const QuickStartGuide = () => {
  const sections = [
    {
      id: 'how-to-import',
      title: 'Cara Mengimpor Data',
      description: 'Panduan langkah demi langkah untuk mengimpor data ke Statify',
      icon: ListOrdered,
      content: (
        <div className="space-y-4">
          <HelpStep number={1} title="Pilih Format Import">
            <p className="text-sm">
              Pilih format file yang sesuai dengan data Anda:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li><strong>CSV</strong>: Format universal, kompatibel dengan semua aplikasi</li>
              <li><strong>Excel</strong>: Mempertahankan formatting dan multiple sheets</li>
              <li><strong>SPSS (.sav)</strong>: Import dengan metadata dan label lengkap</li>
              <li><strong>Clipboard</strong>: Copy-paste data dari aplikasi lain</li>
            </ul>
          </HelpStep>

          <HelpStep number={2} title="Import Data">
            <p className="text-sm">
              Ikuti langkah import sesuai format:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Klik <strong>File → Import Data</strong></li>
              <li>Pilih jenis file (CSV, Excel, SPSS, dll)</li>
              <li>Browse dan pilih file dari komputer</li>
              <li>Atur pengaturan import (header, delimiter, dll)</li>
              <li>Preview data untuk memastikan format benar</li>
              <li>Klik <strong>Import</strong> untuk melanjutkan</li>
            </ul>
          </HelpStep>

          <HelpStep number={3} title="Validasi Data">
            <p className="text-sm">
              Periksa data yang telah diimpor:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Periksa nama dan tipe variabel di Variable View</li>
              <li>Cek missing values dan data anomali</li>
              <li>Validasi format tanggal dan numerik</li>
              <li>Atur measurement level yang sesuai</li>
            </ul>
          </HelpStep>

          <HelpStep number={4} title="Siap Analisis">
            <p className="text-sm">
              Data siap untuk analisis statistik:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Akses menu <strong>Analyze</strong> untuk analisis</li>
              <li>Gunakan <strong>Data</strong> menu untuk transformasi</li>
              <li>Export hasil untuk berbagi atau backup</li>
            </ul>
          </HelpStep>
        </div>
      )
    },
    {
      id: 'file-formats',
      title: 'Format File yang Didukung',
      description: 'Berbagai format data yang dapat diimpor dan diekspor',
      icon: Upload,
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          <HelpCard title="Import Formats" icon={Upload} variant="feature">
            <ul className="text-sm space-y-1">
              <li>• CSV (.csv) - Comma Separated Values</li>
              <li>• Excel (.xlsx, .xls) - Microsoft Excel</li>
              <li>• SPSS (.sav) - SPSS Data Files</li>
              <li>• Clipboard - Copy dari aplikasi lain</li>
            </ul>
          </HelpCard>

          <HelpCard title="Export Formats" icon={Download} variant="feature">
            <ul className="text-sm space-y-1">
              <li>• CSV - Format universal</li>
              <li>• Excel - Dengan formatting</li>
              <li>• PDF - Untuk laporan</li>
              <li>• Print - Cetak langsung</li>
            </ul>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'best-practices',
      title: 'Tips Manajemen File',
      description: 'Praktik terbaik untuk bekerja dengan file data',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Persiapan Data">
            <p className="text-sm mt-2">
              Pastikan data sudah dalam format yang benar sebelum import. 
              Bersihkan data dari karakter khusus dan pastikan konsistensi format.
            </p>
          </HelpAlert>

          <div className="grid gap-4 md:grid-cols-2">
            <HelpCard title="Backup Rutin" icon={Database} variant="step">
              <p className="text-sm">
                Export data secara berkala untuk backup dan dokumentasi
              </p>
            </HelpCard>

            <HelpCard title="Naming Convention" icon={FileText} variant="step">
              <p className="text-sm">
                Gunakan nama file yang deskriptif dengan tanggal untuk tracking versi
              </p>
            </HelpCard>

            <HelpCard title="Format Konsisten" icon={Settings} variant="step">
              <p className="text-sm">
                Pastikan format tanggal, angka, dan teks konsisten dalam dataset
              </p>
            </HelpCard>

            <HelpCard title="Dokumentasi" icon={FileText} variant="step">
              <p className="text-sm">
                Dokumentasikan sumber data dan transformasi yang dilakukan
              </p>
            </HelpCard>
          </div>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'tip' as const,
      title: 'Preview Sebelum Import',
      content: 'Selalu gunakan fitur preview untuk memastikan data diinterpretasi dengan benar sebelum import final.'
    },
    {
      type: 'info' as const,
      title: 'Encoding File',
      content: 'Untuk file dengan karakter khusus, pastikan encoding UTF-8 untuk menghindari masalah karakter.'
    },
    {
      type: 'warning' as const,
      title: 'Ukuran File',
      content: 'File yang sangat besar mungkin memerlukan waktu lebih lama untuk diproses. Pertimbangkan sampling untuk eksplorasi awal.'
    },
    {
      type: 'tip' as const,
      title: 'Backup Data Asli',
      content: 'Selalu simpan backup file asli sebelum melakukan transformasi atau manipulasi data di Statify.'
    }
  ];

  const relatedTopics = [
    { title: 'Import CSV', href: '/help/file-guide/import-csv' },
    { title: 'Import Excel', href: '/help/file-guide/import-excel' },
    { title: 'Import SPSS', href: '/help/file-guide/import-sav' },
    { title: 'Export Data', href: '/help/file-guide/export-csv' },
    { title: 'Data Management', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Quick Start - Manajemen File"
      description="Panduan cepat untuk mengimpor, mengelola, dan mengekspor file data di Statify"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};