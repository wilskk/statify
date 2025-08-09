import React from 'react';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { Zap } from 'lucide-react';

export const QuickStartGuide = () => (
  <div className="space-y-6">
    <HelpCard title="Panduan Cepat" icon={Zap} variant="feature">
      <div className="space-y-4 mt-4">
        <HelpStep 
          number={1} 
          title="Upload Data" 
          description="Upload file CSV/Excel dengan data yang ingin dianalisis"
        />
        
        <HelpStep 
          number={2} 
          title="Pilih Variabel" 
          description="Pilih variabel dependensnya (data numerik yang ingin dianalisis)"
        />
        
        <HelpStep 
          number={3} 
          title="Tentukan Faktor (Opsional)" 
          description="Pilih variabel kategorik sebagai factor untuk analisis kelompok"
        />
        
        <HelpStep 
          number={4} 
          title="Atur Opsi Statistik" 
          description="Pilih statistik robust (M-estimators, percentiles, confidence intervals)"
        />
        
        <HelpStep 
          number={5} 
          title="Pilih Visualisasi" 
          description="Tentukan jenis plot: boxplots, histograms, Q-Q plots, dll"
        />
        
        <HelpStep 
          number={6} 
          title="Jalankan Analisis" 
          description="Klik tombol untuk menjalankan Descriptive Statistics"
        />
      </div>
    </HelpCard>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Skenario Umum</h3>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-white dark:bg-slate-900 rounded border border-blue-200 dark:border-blue-800">
            <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Exploratory Data Analysis</p>
            <p className="text-blue-700 dark:text-blue-300">Gunakan semua opsi statistik dan plot untuk memahami data secara komprehensif</p>
          </div>
          
          <div className="p-3 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-emerald-800">
            <p className="font-medium text-emerald-800 dark:text-emerald-200 mb-1">Outlier Detection</p>
            <p className="text-emerald-700 dark:text-emerald-300">Aktifkan boxplots dan robust statistics untuk mengidentifikasi outlier</p>
          </div>
          
          <div className="p-3 bg-white dark:bg-slate-900 rounded border border-purple-200 dark:border-purple-800">
            <p className="font-medium text-purple-800 dark:text-purple-200 mb-1">Normality Testing</p>
            <p className="text-purple-700 dark:text-purple-300">Gunakan Q-Q plots dan normality tests untuk menguji distribusi normal</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Tips Praktis</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
            <p className="text-slate-600 dark:text-slate-400">Mulai dengan analisis eksploratori sederhana sebelum analisis mendalam</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
            <p className="text-slate-600 dark:text-slate-400">Gunakan robust statistics jika data mengandung outlier</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2"></span>
            <p className="text-slate-600 dark:text-slate-400">Kombinasikan beberapa plot untuk interpretasi yang lebih akurat</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full mt-2"></span>
            <p className="text-slate-600 dark:text-slate-400">Perhatikan pesan error dan warning untuk troubleshooting</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>
            <p className="text-slate-600 dark:text-slate-400">Validasi hasil dengan metode statistik yang berbeda</p>
          </div>
        </div>
      </div>
    </div>

    <HelpAlert variant="tip" title="Workflow Rekomendasi">
      <div className="text-sm space-y-3 mt-2">
        <div className="space-y-2">
          <p className="font-medium">1. Data Preparation</p>
          <p className="ml-4 text-muted-foreground">• Clean missing values • Check data types • Verify variable scales</p>
        </div>
        
        <div className="space-y-2">
          <p className="font-medium">2. Initial Exploration</p>
          <p className="ml-4 text-muted-foreground">• Basic descriptives • Histograms • Boxplots untuk outlier screening</p>
        </div>
        
        <div className="space-y-2">
          <p className="font-medium">3. Distribution Assessment</p>
          <p className="ml-4 text-muted-foreground">• Q-Q plots • Normality tests • Identify skewness and kurtosis</p>
        </div>
        
        <div className="space-y-2">
          <p className="font-medium">4. Robust Analysis</p>
          <p className="ml-4 text-muted-foreground">• M-estimators • Confidence intervals • Compare with classical measures</p>
        </div>
        
        <div className="space-y-2">
          <p className="font-medium">5. Results Interpretation</p>
          <p className="ml-4 text-muted-foreground">• Document findings • Note outliers • Consider transformations if needed</p>
        </div>
      </div>
    </HelpAlert>

    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Troubleshooting Umum</h3>
      <div className="space-y-3 text-sm">
        <div className="flex gap-3">
          <span className="font-mono text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded min-w-fit">ERROR</span>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200">Data tidak numerik</p>
            <p className="text-slate-600 dark:text-slate-400">Pastikan variabel dependen berupa angka, bukan teks atau kategori</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <span className="font-mono text-amber-600 dark:text-amber-400 text-xs bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded min-w-fit">WARN</span>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200">Outlier ekstrem terdeteksi</p>
            <p className="text-slate-600 dark:text-slate-400">Gunakan robust statistics atau pertimbangkan transformasi data</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <span className="font-mono text-blue-600 dark:text-blue-400 text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded min-w-fit">INFO</span>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200">Distribusi tidak normal</p>
            <p className="text-slate-600 dark:text-slate-400">Hasil Q-Q plot menunjukkan deviasi dari normalitas, gunakan robust methods</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);