import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert } from '../../ui/HelpLayout';
import { FileText, Upload, Download, Database, Clipboard, Printer, BookOpen, FileSpreadsheet } from 'lucide-react';
import { ImportSav } from './ImportSav';
import { ImportCsv } from './ImportCsv';
import { ImportExcel } from './ImportExcel';
import { ImportClipboard } from './ImportClipboard';
import { ExportCsv } from './ExportCsv';
import { ExportExcel } from './ExportExcel';
import { ExampleDataset } from './ExampleDataset';
import { Print } from './Print';

type FileGuideProps = {
  section?: string;
};

export const FileGuide: React.FC<FileGuideProps> = ({ section }) => {
  const renderContent = () => {
    switch (section) {
      case 'import-sav':
        return <ImportSav />;
      case 'import-csv':
        return <ImportCsv />;
      case 'import-excel':
        return <ImportExcel />;
      case 'import-clipboard':
        return <ImportClipboard />;
      case 'export-csv':
        return <ExportCsv />;
      case 'export-excel':
        return <ExportExcel />;
      case 'example-data':
        return <ExampleDataset />;
      case 'print':
        return <Print />;
      default:
        return (
          <HelpGuideTemplate
            title="File Management Guide"
            description="Panduan lengkap untuk mengelola file dan data dalam Statify"
            category="File Management"
            lastUpdated="2024-01-15"
            sections={[
              {
                id: 'overview',
                title: 'Gambaran Umum',
                description: 'Pilih topik dari sidebar untuk melihat panduan spesifik',
                icon: BookOpen,
                content: (
                  <div className="space-y-6">
                    <HelpAlert variant="info" title="Panduan File Management">
                      <p className="text-sm mt-2">
                        Pilih salah satu topik dari sidebar untuk melihat panduan detail tentang pengelolaan file dan data.
                      </p>
                    </HelpAlert>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <HelpCard title="Import Data" icon={Upload} variant="feature">
                        <p className="text-sm text-muted-foreground">
                          Pelajari cara mengimpor data dari berbagai format file seperti SPSS (.sav), CSV, Excel, dan clipboard.
                        </p>
                      </HelpCard>
                      
                      <HelpCard title="Export Data" icon={Download} variant="feature">
                        <p className="text-sm text-muted-foreground">
                          Ekspor hasil analisis Anda ke format CSV atau Excel untuk digunakan di aplikasi lain.
                        </p>
                      </HelpCard>
                      
                      <HelpCard title="Example Dataset" icon={Database} variant="feature">
                        <p className="text-sm text-muted-foreground">
                          Gunakan dataset contoh untuk mempelajari fitur-fitur Statify tanpa perlu menyiapkan data sendiri.
                        </p>
                      </HelpCard>
                      
                      <HelpCard title="Print & Share" icon={Printer} variant="feature">
                        <p className="text-sm text-muted-foreground">
                          Cetak atau bagikan hasil analisis Anda dengan format yang rapi dan profesional.
                        </p>
                      </HelpCard>
                    </div>
                  </div>
                )
              }
            ]}
            tips={[
              {
                type: 'tip' as const,
                title: 'Format File',
                content: 'Pastikan file Anda dalam format yang didukung: .sav, .csv, .xlsx, atau .xls.'
              },
              {
                type: 'info' as const,
                title: 'Ukuran File',
                content: 'Untuk performa optimal, disarankan menggunakan file dengan ukuran maksimal 50MB.'
              }
            ]}
            relatedTopics={[
              { title: 'Data Management', href: '/help/data-guide' },
              { title: 'Getting Started', href: '/help/getting-started' },
              { title: 'Statistics Guide', href: '/help/statistics-guide' },
              { title: 'FAQ', href: '/help/faq' }
            ]}
          />
        );
    }
  };

  return renderContent();
};