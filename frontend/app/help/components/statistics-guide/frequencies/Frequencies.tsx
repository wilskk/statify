import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { Calculator, FileText, BarChart3, HelpCircle, Table } from 'lucide-react';

// Tab content components for better organization
const OverviewTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="What is Frequency Analysis?">
      <p className="text-sm mt-2">
        Frequency analysis counts how often each unique value appears in your data. 
        This helps you understand the distribution of values and identify patterns.
      </p>
    </HelpAlert>

    <HelpCard title="When to Use Frequency Analysis" icon={HelpCircle} variant="feature">
      <ul className="text-sm space-y-2 mt-2">
        <li>• Understanding categorical data distribution</li>
        <li>• Identifying the most common values</li>
        <li>• Checking data quality and missing values</li>
        <li>• Preparing data for further analysis</li>
      </ul>
    </HelpCard>

    <HelpCard title="What You'll Learn" icon={FileText} variant="feature">
      <ul className="text-sm space-y-2 mt-2">
        <li>• How to select variables for analysis</li>
        <li>• Available statistics options</li>
        <li>• Chart customization options</li>
        <li>• How to interpret results</li>
      </ul>
    </HelpCard>
  </div>
);

const VariablesTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="Apa itu Analisis Frekuensi?">
      <p className="text-sm mt-2">
        Analisis frekuensi menghitung seberapa sering setiap nilai unik muncul dalam data Anda. 
        Ini membantu memahami distribusi nilai dan mengidentifikasi pola dalam data.
      </p>
    </HelpAlert>

    <HelpCard title="Kapan Menggunakan Analisis Frekuensi" icon={HelpCircle} variant="feature">
      <ul className="text-sm space-y-2 mt-2">
        <li>• Memahami distribusi data kategorikal</li>
        <li>• Mengidentifikasi nilai yang paling umum</li>
        <li>• Memeriksa kualitas data dan missing values</li>
        <li>• Mempersiapkan data untuk analisis lebih lanjut</li>
        <li>• Membuat tabel frekuensi dan persentase</li>
      </ul>
    </HelpCard>

    <HelpCard title="Memilih Variabel" icon={Table} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Pilih Variabel Anda"
          description="Pilih satu atau lebih variabel dari daftar variabel yang tersedia. Ini bisa berupa variabel kategorikal atau numerik."
        />
        <HelpStep
          number={2}
          title="Seret ke Terpilih"
          description="Seret variabel dari daftar yang tersedia ke kotak variabel terpilih, atau gunakan tombol panah untuk memindahkannya."
        />
        <HelpStep
          number={3}
          title="Atur Urutan Jika Diperlukan"
          description="Gunakan panah atas/bawah untuk mengubah urutan variabel jika Anda menganalisis beberapa variabel."
        />
      </div>
    </HelpCard>

    <HelpAlert variant="tip" title="Jenis Variabel">
      <p className="text-sm mt-2">
        Analisis frekuensi bekerja paling baik dengan variabel kategorikal (nominal atau ordinal), 
        tetapi juga dapat digunakan dengan data numerik untuk melihat distribusi nilai.
      </p>
    </HelpAlert>
  </div>
);

const StatisticsTab = () => (
  <div className="space-y-6">
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">i</span>
        </div>
        <div>
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Formula Matematika</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">Berikut adalah formula matematika untuk setiap statistik yang dapat dihitung dalam analisis frekuensi.</p>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Tendensi Sentral</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Mean (Rata-rata)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border font-mono text-sm mb-2 text-slate-700 dark:text-slate-300">
            x̄ = Σ(xi × fi) / Σfi
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Rata-rata tertimbang berdasarkan frekuensi setiap nilai.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">xi = nilai, fi = frekuensi nilai tersebut</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Mode (Modus)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border font-mono text-sm mb-2 text-slate-700 dark:text-slate-300">
            Mode = nilai dengan frekuensi tertinggi
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Nilai yang paling sering muncul dalam dataset.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">Sangat berguna untuk data kategorikal</p>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Tabel Frekuensi</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Frekuensi Relatif (%)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border font-mono text-sm mb-2 text-slate-700 dark:text-slate-300">
            Persentase = (fi / n) × 100%
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Persentase kemunculan setiap nilai terhadap total data.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">fi = frekuensi nilai, n = total data valid</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Frekuensi Kumulatif</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border font-mono text-sm mb-2 text-slate-700 dark:text-slate-300">
            Kumulatif = Σfi (dari nilai terkecil hingga nilai saat ini)
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Jumlah akumulatif frekuensi dari nilai terkecil hingga nilai tertentu.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">Berguna untuk menentukan posisi relatif suatu nilai</p>
        </div>
      </div>
    </div>

    <HelpAlert variant="tip" title="Tips Pemilihan Statistik">
      <div className="text-sm space-y-2 mt-2">
        <p>• <strong>Untuk data kategorikal:</strong> Fokus pada frekuensi, persentase, dan mode</p>
        <p>• <strong>Untuk data numerik:</strong> Tambahkan mean, median, dan ukuran sebaran</p>
        <p>• <strong>Untuk data ordinal:</strong> Gunakan median dan persentil</p>
        <p>• <strong>Missing values:</strong> Selalu periksa jumlah dan persentase data yang hilang</p>
      </div>
    </HelpAlert>
  </div>
);

const ChartsTab = () => (
  <div className="space-y-6">
    <HelpCard title="Opsi Grafik" icon={BarChart3} variant="feature">
      <div className="space-y-4 mt-2">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Menampilkan Grafik</h4>
          <p className="text-sm text-muted-foreground">
            Centang opsi "Display charts" untuk menampilkan visualisasi grafik dalam hasil analisis.
          </p>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Jenis Grafik</h4>
          <div className="text-sm space-y-2">
            <p>• <strong>None:</strong> Tidak menampilkan grafik</p>
            <p>• <strong>Bar charts:</strong> Grafik batang untuk menampilkan frekuensi kategori</p>
            <p>• <strong>Pie charts:</strong> Grafik lingkaran untuk menampilkan proporsi</p>
            <p>• <strong>Histograms:</strong> Histogram untuk data numerik kontinu</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Nilai Grafik</h4>
          <div className="text-sm space-y-2">
            <p>• <strong>Frequencies:</strong> Menampilkan nilai frekuensi absolut</p>
            <p>• <strong>Percentages:</strong> Menampilkan nilai dalam bentuk persentase</p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            *Opsi ini tidak tersedia untuk histogram
          </p>
        </div>
      </div>
    </HelpCard>

    <HelpAlert variant="tip" title="Tips Pemilihan Grafik">
      <div className="text-sm space-y-2 mt-2">
        <p>• <strong>Bar charts:</strong> Ideal untuk data kategorikal dan ordinal</p>
        <p>• <strong>Pie charts:</strong> Terbaik untuk menunjukkan proporsi dari keseluruhan (maksimal 7 kategori)</p>
        <p>• <strong>Histograms:</strong> Cocok untuk data numerik kontinu untuk melihat distribusi</p>
        <p>• <strong>Frequencies vs Percentages:</strong> Gunakan frekuensi untuk nilai absolut, persentase untuk perbandingan</p>
      </div>
    </HelpAlert>
  </div>
);

const QuickStartGuide = () => (
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

export const Frequencies: React.FC = () => {
  const [activeTab, setActiveTab] = useState('variables');

  const tabConfig = [
    { value: 'variables', label: 'Variabel', icon: Table },
    { value: 'statistics', label: 'Statistik', icon: Calculator },
    { value: 'charts', label: 'Grafik', icon: BarChart3 }
  ];

  return (
    <div className="w-full space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Panduan Analisis Frekuensi</h1>
        <p className="text-muted-foreground">
          Pelajari cara membuat dan menginterpretasi tabel frekuensi untuk data Anda
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {tabConfig.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="variables" className="mt-6">
          <VariablesTab />
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          <StatisticsTab />
        </TabsContent>

        <TabsContent value="charts" className="mt-6">
          <ChartsTab />
        </TabsContent>
      </Tabs>

      <QuickStartGuide />
    </div>
  );
};

