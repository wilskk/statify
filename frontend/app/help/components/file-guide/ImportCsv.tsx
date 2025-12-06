/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep } from '../../ui/HelpLayout';
import { FileSpreadsheet, Upload, Lightbulb } from 'lucide-react';

export const ImportCsv = () => {
  const sections = [
    {
      id: 'import-steps',
      title: 'Cara Impor File CSV',
      description: 'Panduan langkah demi langkah untuk mengimpor data CSV Anda ke Statify',
      icon: Upload,
      content: (
        <div className="space-y-4">
          <HelpStep
            number={1}
            title="Buka Menu File"
            description="Klik 'File' di bilah menu atas aplikasi."
          />
          <HelpStep
            number={2}
            title="Pilih Import Data → CSV Data"
            description="Klik File → Import Data → CSV Data."
          />
          <HelpStep
            number={3}
            title="Pilih File Anda"
            description="Telusuri komputer Anda dan pilih file CSV (.csv) yang ingin Anda gunakan."
          />
          <HelpStep
            number={4}
            title="Lanjut ke Konfigurasi"
            description="Klik 'Continue' untuk membuka layar konfigurasi impor."
          />
          <HelpStep
            number={5}
            title="Atur Opsi Impor"
            description="Sesuaikan opsi: First line contains variable names, Remove leading/trailing spaces, Delimiter, Decimal Symbol for Numerics, dan Text Qualifier."
          />
          <HelpStep
            number={6}
            title="Tinjau Data Preview"
            description="Periksa pratinjau data (max 100 rows) untuk memastikan pengaturan sudah benar."
          />
          <HelpStep
            number={7}
            title="Impor"
            description="Klik tombol 'Import' untuk menyelesaikan proses impor."
          />
        </div>
      )
    },
    {
      id: 'features',
      title: 'Fitur & Informasi',
      description: 'Informasi penting tentang format CSV dan cara kerjanya',
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Tahukah Anda?">
            <p className="text-sm mt-2">
              File CSV adalah file teks sederhana yang bekerja dengan hampir semua program spreadsheet dan perangkat lunak statistik.
            </p>
          </HelpAlert>
          
          <HelpCard title="Tentang Format CSV" icon={FileSpreadsheet} variant="feature">
            <p className="text-sm text-muted-foreground">
              CSV singkatan dari Comma-Separated Values. Menggunakan koma untuk memisahkan kolom data Anda dan baris baru untuk setiap baris data.
            </p>
          </HelpCard>
        </div>
      )
    }
  ];



  const tips = [
    {
      type: 'tip' as const,
      title: 'Encoding File',
      content: 'Gunakan encoding UTF-8 untuk file dengan karakter khusus atau simbol untuk memastikan tampilan yang benar.'
    },
    {
      type: 'info' as const,
      title: 'Deteksi Pemisah Otomatis',
      content: 'Statify secara otomatis mendeteksi apakah file menggunakan koma, titik koma, atau tab sebagai pemisah data.'
    },
    {
      type: 'success' as const,
      title: 'Kompatibilitas Luas',
      content: 'Format CSV didukung oleh hampir semua aplikasi spreadsheet dan perangkat lunak analisis data.'
    }
  ];

  const relatedTopics = [
    { title: 'Impor File SPSS', href: '/help/file-guide/import-sav' },
    { title: 'Impor File Excel', href: '/help/file-guide/import-excel' },
    { title: 'Impor dari Clipboard', href: '/help/file-guide/import-clipboard' },
    { title: 'Ekspor ke CSV', href: '/help/file-guide/export-csv' },
    { title: 'Panduan Manajemen Data', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Impor File CSV"
      description="Panduan lengkap untuk mengimpor data CSV ke Statify"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};