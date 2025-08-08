import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { Calculator, FileText, BarChart3, HelpCircle, Settings, TrendingUp, Table } from 'lucide-react';

// Tab content components for data exploration
const VariablesTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="Apa itu Analisis Explore?">
      <p className="text-sm mt-2">
        Analisis Explore memberikan wawasan komprehensif tentang data Anda menggunakan metode statistik yang robust. 
        Ini mengidentifikasi pola, outlier, dan karakteristik distribusi sambil memberikan estimasi yang dapat diandalkan 
        yang tidak terpengaruh oleh nilai ekstrem.
      </p>
    </HelpAlert>

    <HelpCard title="Kapan Menggunakan Analisis Explore" icon={HelpCircle} variant="feature">
      <ul className="text-sm space-y-2 mt-2">
        <li>• Analisis data awal dan pemahaman</li>
        <li>• Deteksi outlier dan penilaian kualitas data</li>
        <li>• Analisis distribusi dan pemeriksaan normalitas</li>
        <li>• Estimasi statistik yang robust</li>
        <li>• Identifikasi pola data</li>
      </ul>
    </HelpCard>

    <HelpCard title="Memilih Variabel untuk Analisis" icon={Calculator} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Variabel Numerik"
          description="Pilih variabel kontinu atau diskrit yang ingin Anda analisis secara mendalam."
        />
        <HelpStep
          number={2}
          title="Variabel Faktor (Opsional)"
          description="Tambahkan variabel kategorikal untuk membandingkan statistik antar kelompok."
        />
        <HelpStep
          number={3}
          title="Pertimbangan Ukuran Sampel"
          description="Pastikan setiap kelompok memiliki ukuran sampel yang memadai untuk analisis yang bermakna."
        />
      </div>
    </HelpCard>
  </div>
);

const StatisticsTab = () => (
  <div className="space-y-6">
    <HelpCard title="Opsi Statistik Deskriptif" icon={Calculator} variant="feature">
      <div className="space-y-4 mt-2">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Descriptives</h4>
          <p className="text-sm text-muted-foreground">
            Statistik deskriptif dasar termasuk mean, median, standar deviasi, dan 5% trimmed mean.
          </p>
          <div className="bg-muted p-3 rounded text-sm">
            <p><strong>Mean:</strong> x̄ = Σx / n</p>
            <p><strong>Standard Deviation:</strong> s = √(Σ(x - x̄)² / (n-1))</p>
            <p><strong>5% Trimmed Mean:</strong> Mean setelah menghilangkan 5% nilai tertinggi dan terendah</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Confidence Interval for Mean</h4>
          <p className="text-sm text-muted-foreground">
            Atur tingkat kepercayaan untuk estimasi mean (biasanya 95% atau 99%).
          </p>
          <div className="bg-muted p-3 rounded text-sm">
            <p><strong>Rumus CI:</strong> mean ± (t × SE)</p>
            <p>dimana SE = std / sqrt(n) dan t adalah nilai t-tabel</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Outliers</h4>
          <p className="text-sm text-muted-foreground">
            Identifikasi nilai ekstrem yang mungkin memerlukan perhatian khusus dalam analisis.
          </p>
          <div className="bg-muted p-3 rounded text-sm">
            <p><strong>Kriteria Outlier:</strong></p>
            <p>• Nilai kurang dari Q1 - 1.5 × IQR</p>
            <p>• Nilai lebih dari Q3 + 1.5 × IQR</p>
            <p>dimana IQR = Q3 - Q1</p>
          </div>
        </div>
      </div>
    </HelpCard>

    <HelpAlert variant="info" title="Memahami Statistik Robust">
      <p className="text-sm mt-2">
        Statistik robust memberikan estimasi yang dapat diandalkan bahkan ketika data Anda mengandung outlier. 
        5% trimmed mean, misalnya, mengecualikan 5% nilai tertinggi dan terendah sebelum menghitung rata-rata, 
        sehingga lebih tahan terhadap pengaruh nilai ekstrem.
      </p>
    </HelpAlert>
  </div>
);

const PlotsTab = () => (
  <div className="space-y-6">
    <HelpCard title="Opsi Visualisasi" icon={BarChart3} variant="feature">
      <div className="space-y-4 mt-2">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Boxplots</h4>
          <p className="text-sm text-muted-foreground">
            Pilih jenis boxplot untuk memvisualisasikan distribusi dan mengidentifikasi outlier.
          </p>
          <div className="text-sm space-y-1 ml-4">
            <p>• <strong>None:</strong> Tidak menampilkan boxplot</p>
            <p>• <strong>Factor levels together:</strong> Boxplot terpisah untuk setiap level faktor</p>
            <p>• <strong>Dependents together:</strong> Semua variabel dependen dalam satu plot</p>
            <p>• <strong>Dependents separately:</strong> Boxplot terpisah untuk setiap variabel dependen</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Descriptives Plots</h4>
          <div className="space-y-2">
            <p className="text-sm"><strong>Stem-and-leaf:</strong> Menampilkan distribusi detail sambil mempertahankan nilai data aktual</p>
            <p className="text-sm"><strong>Histogram:</strong> Menampilkan distribusi frekuensi untuk memahami bentuk dan pola data</p>
          </div>
        </div>
      </div>
    </HelpCard>

    <HelpAlert variant="tip" title="Panduan Pemilihan Plot">
      <div className="text-sm space-y-2 mt-2">
        <p>• <strong>Boxplots:</strong> Terbaik untuk membandingkan distribusi antar kelompok</p>
        <p>• <strong>Histograms:</strong> Ideal untuk memahami bentuk distribusi secara keseluruhan</p>
        <p>• <strong>Stem-and-leaf:</strong> Berguna untuk dataset kecil untuk melihat nilai eksak</p>
        <p>• <strong>Kombinasi plot:</strong> Gunakan beberapa jenis plot untuk analisis yang komprehensif</p>
      </div>
    </HelpAlert>
  </div>
);

const QuickStartGuide = () => (
  <div className="space-y-4">
    <HelpStep
      number={1}
      title="Pilih Variabel"
      description="Pada tab Variables, pilih variabel numerik yang ingin dianalisis dan variabel faktor opsional untuk perbandingan kelompok."
    />
    <HelpStep
      number={2}
      title="Konfigurasi Statistik"
      description="Pada tab Statistics, aktifkan opsi statistik yang diinginkan seperti descriptives, confidence interval, dan outlier detection."
    />
    <HelpStep
      number={3}
      title="Pilih Visualisasi"
      description="Pada tab Plots, pilih jenis plot yang sesuai untuk memvisualisasikan distribusi data Anda."
    />
    <HelpStep
      number={4}
      title="Jalankan Analisis"
      description="Klik tombol Analyze untuk mendapatkan hasil statistik deskriptif dan visualisasi yang komprehensif."
    />
  </div>
);

const Explore = () => {
  const [activeTab, setActiveTab] = useState('variables');

  return (
    <div className="w-full space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Panduan Eksplorasi Data</h1>
        <p className="text-muted-foreground">
          Analisis statistik komprehensif dengan metode robust dan deteksi outlier
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="variables" className="flex items-center gap-2">
            <Table className="w-4 h-4" />
            Variabel
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Statistik
          </TabsTrigger>
          <TabsTrigger value="plots" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Grafik
          </TabsTrigger>
        </TabsList>

        <TabsContent value="variables" className="mt-6">
          <VariablesTab />
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          <StatisticsTab />
        </TabsContent>

        <TabsContent value="plots" className="mt-6">
          <PlotsTab />
        </TabsContent>
      </Tabs>

      <HelpCard title="Quick Start Guide" icon={TrendingUp} variant="feature">
        <QuickStartGuide />
      </HelpCard>
    </div>
  );
};

export default Explore;
