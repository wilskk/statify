/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep } from '../../ui/HelpLayout';
import { Database, Lightbulb, FileText } from 'lucide-react';

export const ExampleDataset = () => {
  const sections = [
    {
      id: 'load-steps',
      title: 'Cara Memuat Dataset Contoh',
      description: 'Panduan langkah demi langkah untuk memuat dataset contoh ke Statify',
      icon: Database,
      content: (
        <div className="space-y-4">
          <HelpStep
            number={1}
            title="Buka Menu File"
            description="Klik 'File' di bilah menu atas aplikasi."
          />
          <HelpStep
            number={2}
            title="Pilih Example Data"
            description="Klik File → Example Data untuk melihat daftar dataset yang tersedia (.sav)."
          />
          <HelpStep
            number={3}
            title="Pilih Dataset"
            description="Pilih dataset (.sav) yang ingin Anda gunakan dari daftar yang tersedia. Setiap dataset memiliki deskripsi singkat tentang isinya."
          />
          <HelpStep
            number={4}
            title="Muat Dataset"
            description="Klik 'Muat' untuk memuat dataset ke dalam editor data Statify."
          />
        </div>
      )
    },
    {
      id: 'features',
      title: 'Fitur & Manfaat',
      description: 'Informasi penting tentang dataset contoh yang tersedia',
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <HelpCard title="Dataset Beragam" icon={FileText} variant="feature">
            <p className="text-sm text-muted-foreground">
              Tersedia berbagai jenis dataset dengan karakteristik yang berbeda untuk mendemonstrasikan berbagai teknik analisis statistik.
            </p>
          </HelpCard>
          
          <HelpAlert variant="info" title="Tidak Perlu Internet">
            <p className="text-sm mt-2">
              Semua dataset contoh disertakan dengan aplikasi, sehingga Anda dapat mengaksesnya bahkan ketika offline.
            </p>
          </HelpAlert>
          
          <HelpAlert variant="tip" title="Eksplorasi Fitur">
            <p className="text-sm mt-2">
              Dataset contoh dirancang khusus untuk membantu Anda menjelajahi berbagai fitur analisis statistik di Statify.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'tip' as const,
      title: 'Pembelajaran Efektif',
      content: 'Gunakan dataset contoh untuk mempelajari fitur baru tanpa perlu menyiapkan data Anda sendiri terlebih dahulu.'
    },
    {
      type: 'info' as const,
      title: 'Variasi Data',
      content: 'Setiap dataset contoh memiliki karakteristik yang berbeda untuk mendemonstrasikan berbagai jenis analisis statistik.'
    },
    {
      type: 'success' as const,
      title: 'Siap Pakai',
      content: 'Dataset sudah dikonfigurasi dengan variabel dan label yang tepat untuk analisis langsung.'
    }
  ];

  const relatedTopics = [
    { title: 'Impor File SPSS', href: '/help/file-guide/import-sav' },
    { title: 'Impor File CSV', href: '/help/file-guide/import-csv' },
    { title: 'Impor File Excel', href: '/help/file-guide/import-excel' },
    { title: 'Panduan Memulai', href: '/help/getting-started' },
    { title: 'Panduan Manajemen Data', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Menggunakan Dataset Contoh"
      description="Panduan lengkap untuk menggunakan dataset contoh yang tersedia di Statify untuk pembelajaran dan eksplorasi fitur"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};