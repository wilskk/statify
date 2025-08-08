import React from 'react';
import { HelpCard } from '@/app/help/ui/HelpLayout';
import { FileText } from 'lucide-react';

export const QuickStartGuide = () => (
  <div className="mt-8 grid gap-4">
    <HelpCard title="Panduan Cepat" icon={FileText} variant="feature">
      <div className="space-y-3">
        <p className="text-sm">Siap membuat tabel frekuensi pertama Anda?</p>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Pilih variabel di tab Variables</li>
          <li>Tentukan statistik di tab Statistics</li>
          <li>Atur grafik di tab Charts</li>
          <li>Klik OK untuk menjalankan analisis frekuensi</li>
        </ol>
      </div>
    </HelpCard>

    <HelpCard title="Related Topics" icon={FileText} variant="feature">
      <div className="space-y-2">
        <p className="text-sm">Learn more about:</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Descriptive Statistics for more advanced analysis</li>
          <li>Cross Tabulation for relationship analysis</li>
          <li>Data Exploration for comprehensive data understanding</li>
        </ul>
      </div>
    </HelpCard>
  </div>
);