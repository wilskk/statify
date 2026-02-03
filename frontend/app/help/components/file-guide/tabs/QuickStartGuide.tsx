import React from 'react';
<<<<<<< HEAD
import { Zap, Upload, Database } from 'lucide-react';
import { HelpCard, HelpAlert } from '../../../ui/HelpLayout';

export const QuickStartGuide = () => (
  <div className="space-y-6">
    <HelpAlert variant="tip" title="Quick Start - Mulai dalam 3 Langkah">
      <p className="text-sm mt-2">
        Ikuti panduan cepat ini untuk mulai bekerja dengan data di Statify dalam hitungan menit.
      </p>
    </HelpAlert>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <HelpCard title="1. Import Data" icon={Upload} variant="step">
        <div className="space-y-3 text-sm">
          <p className="text-slate-600 dark:text-slate-400">
            Mulai dengan mengimpor data Anda:
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400">
            <li>• Klik <strong>File → Import Data → CSV Data/Excel</strong></li>
            <li>• Pilih file dan atur pengaturan</li>
            <li>• Klik <strong>Import</strong></li>
          </ul>
        </div>
      </HelpCard>

      <HelpCard title="2. Periksa Data" icon={Database} variant="step">
        <div className="space-y-3 text-sm">
          <p className="text-slate-600 dark:text-slate-400">
            Validasi data yang telah diimpor:
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400">
            <li>• Periksa nama dan tipe variabel</li>
            <li>• Cek missing values</li>
            <li>• Validasi format data</li>
            <li>• Atur measurement level</li>
          </ul>
        </div>
      </HelpCard>

      <HelpCard title="3. Mulai Analisis" icon={Zap} variant="step">
        <div className="space-y-3 text-sm">
          <p className="text-slate-600 dark:text-slate-400">
            Siap untuk analisis statistik:
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400">
            <li>• Pilih menu <strong>Analyze</strong></li>
            <li>• Pilih jenis analisis</li>
            <li>• Drag variabel ke dialog</li>
            <li>• Klik <strong>OK</strong> untuk hasil</li>
          </ul>
        </div>
      </HelpCard>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Format File Populer</h3>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-muted/50 rounded border border-border">
            <p className="font-medium text-foreground mb-1">CSV Files</p>
            <p className="text-muted-foreground">Format universal, kompatibel dengan semua aplikasi</p>
          </div>
          
          <div className="p-3 bg-muted/50 rounded border border-border">
            <p className="font-medium text-foreground mb-1">Excel Files</p>
            <p className="text-muted-foreground">Mempertahankan formatting dan multiple sheets</p>
          </div>
          
          <div className="p-3 bg-muted/50 rounded border border-border">
            <p className="font-medium text-foreground mb-1">SPSS Files</p>
            <p className="text-muted-foreground">Import dengan metadata dan label lengkap</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Tips Export</h3>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-muted/50 rounded border border-border">
            <p className="font-medium text-foreground mb-1">Backup Rutin</p>
            <p className="text-muted-foreground">Export data secara berkala untuk backup</p>
          </div>
          
          <div className="p-3 bg-muted/50 rounded border border-border">
            <p className="font-medium text-foreground mb-1">Sharing Results</p>
            <p className="text-muted-foreground">Export ke Excel/PDF untuk berbagi hasil</p>
          </div>
          
          <div className="p-3 bg-muted/50 rounded border border-border">
            <p className="font-medium text-foreground mb-1">Visualizations</p>
            <p className="text-muted-foreground">Simpan grafik dalam format SVG untuk kualitas terbaik</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
=======
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
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
