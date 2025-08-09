/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep } from '../../ui/HelpLayout';
import { FileSpreadsheet, Upload, Lightbulb, BookOpen, Database, Layers } from 'lucide-react';

export const ImportExcel = () => {
  const sections = [
    {
      id: 'import-steps',
      title: 'Cara Impor File Excel',
      description: 'Panduan langkah demi langkah untuk mengimpor data Excel Anda ke Statify',
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
            title="Pilih Impor Excel"
            description="Pilih 'Buka File Excel' dari opsi dropdown."
          />
          <HelpStep
            number={3}
            title="Pilih File Anda"
            description="Telusuri komputer Anda dan pilih file Excel (.xlsx atau .xls) yang ingin Anda gunakan."
          />
          <HelpStep
            number={4}
            title="Pilih Sheet Anda"
            description="Jika file Excel Anda memiliki beberapa sheet, pilih yang mana yang akan diimpor."
          />
          <HelpStep
            number={5}
            title="Muat Data Anda"
            description="Klik 'Buka' untuk mengimpor data Anda ke editor data Statify."
          />
        </div>
      )
    },
    {
      id: 'features',
      title: 'Format Yang Didukung',
      description: 'Jenis file dan fitur yang dapat Anda gunakan',
      icon: FileSpreadsheet,
      content: (
        <div className="space-y-4">
          <HelpCard title="Jenis File" icon={FileSpreadsheet} variant="feature">
            <ul className="text-sm space-y-1 mt-2">
              <li>• .xlsx (Excel 2007 dan yang lebih baru)</li>
              <li>• .xls (Excel 97-2003)</li>
            </ul>
          </HelpCard>
          
          <HelpCard title="Multiple Worksheet" icon={Layers} variant="feature">
            <p className="text-sm text-muted-foreground">
              Statify dapat menangani file Excel dengan beberapa worksheet dan memungkinkan Anda memilih sheet mana yang akan diimpor.
            </p>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'tips',
      title: 'Informasi Berguna',
      description: 'Apa yang perlu Anda ketahui tentang file Excel',
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Tahukah Anda?">
            <p className="text-sm mt-2">
              Statify bekerja sempurna dengan format .xlsx (Excel 2007+) dan .xls (Excel 97-2003).
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];



  const tips = [
    {
      type: 'tip' as const,
      title: 'Header Kolom',
      content: 'Pastikan baris pertama berisi nama variabel yang jelas untuk hasil impor terbaik.'
    },
    {
      type: 'info' as const,
      title: 'Pemilihan Sheet',
      content: 'Untuk file dengan beberapa worksheet, Anda dapat memilih sheet mana yang akan diimpor.'
    }
  ];

  const relatedTopics = [
    { title: 'Impor File CSV', href: '/help/file-guide/import-csv' },
    { title: 'Impor File SPSS', href: '/help/file-guide/import-sav' },
    { title: 'Ekspor ke Excel', href: '/help/file-guide/export-excel' },
    { title: 'Panduan Manajemen Data', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Impor File Excel"
      description="Panduan lengkap untuk mengimpor data Excel ke Statify"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};