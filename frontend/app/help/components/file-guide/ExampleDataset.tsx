/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep } from '../../ui/HelpLayout';
import { Database, BookOpen, Lightbulb, FileText } from 'lucide-react';

export const ExampleDataset = () => {
  const sections = [
    {
      id: 'load-steps',
      title: 'Langkah Memuat Dataset Contoh',
      description: 'Panduan step-by-step untuk memuat dataset contoh',
      icon: Database,
      content: (
        <div className="space-y-4">
          <HelpStep
            number={1}
            title="Buka Menu File"
            description="Navigasi ke menu 'File' di toolbar aplikasi utama."
          />
          <HelpStep
            number={2}
            title="Pilih Example Datasets"
            description="Pilih 'Example Datasets' dari dropdown menu yang muncul."
          />
          <HelpStep
            number={3}
            title="Pilih Dataset"
            description="Dialog akan terbuka menampilkan dataset yang tersedia. Setiap dataset memiliki deskripsi singkat tentang isinya."
          />
          <HelpStep
            number={4}
            title="Load Dataset"
            description="Klik pada card dataset untuk memuat langsung ke dalam data editor."
          />
        </div>
      )
    },
    {
      id: 'features',
      title: 'Fitur & Keunggulan',
      description: 'Informasi penting tentang dataset contoh',
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Tidak Perlu Internet">
            <p className="text-sm mt-2">
              Semua dataset contoh sudah terbundel dengan aplikasi, sehingga Anda dapat mengaksesnya bahkan saat offline.
            </p>
          </HelpAlert>
          <HelpAlert variant="tip" title="Eksplorasi Fitur">
            <p className="text-sm mt-2">
              Dataset contoh dirancang khusus untuk membantu Anda mengeksplorasi berbagai fitur analisis statistik dalam Statify.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'tip' as const,
      title: 'Pembelajaran Cepat',
      content: 'Gunakan dataset contoh untuk mempelajari fitur-fitur baru tanpa perlu menyiapkan data sendiri.'
    },
    {
      type: 'info' as const,
      title: 'Variasi Data',
      content: 'Setiap dataset contoh memiliki karakteristik yang berbeda untuk mendemonstrasikan berbagai jenis analisis.'
    }
  ];

  const relatedTopics = [
    { title: 'Import SPSS Files', href: '/help/file-guide/import-sav' },
    { title: 'Import CSV Files', href: '/help/file-guide/import-csv' },
    { title: 'Data Management', href: '/help/data-guide' },
    { title: 'Getting Started', href: '/help/getting-started' }
  ];

  return (
    <HelpGuideTemplate
      title="Menggunakan Dataset Contoh"
      description="Statify menyediakan berbagai dataset contoh untuk membantu Anda mengeksplorasi fitur-fiturnya"
      category="File Management"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};