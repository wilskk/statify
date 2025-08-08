import React from 'react';
import { HelpCard, HelpAlert } from '@/app/help/ui/HelpLayout';
import { Calculator } from 'lucide-react';

export const StatisticsTab = () => (
  <div className="space-y-6">
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">i</span>
        </div>
        <div>
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Statistik Robust untuk Analisis Mendalam</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">Explore menggunakan metode statistik yang tidak mudah terpengaruh outlier untuk memberikan estimasi yang lebih reliable.</p>
        </div>
      </div>
    </div>

    <HelpCard title="Opsi Statistik Deskriptif" icon={Calculator} variant="feature">
      <div className="space-y-4 mt-2">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Descriptives</h4>
          <p className="text-sm text-muted-foreground">
            Statistik deskriptif dasar termasuk mean, median, standar deviasi, dan 5% trimmed mean.
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-sm">
            <p className="text-slate-700 dark:text-slate-300 mb-2"><strong>Mean:</strong> x̄ = Σx / n</p>
            <p className="text-slate-700 dark:text-slate-300 mb-2"><strong>Standard Deviation:</strong> s = √(Σ(x - x̄)² / (n-1))</p>
            <p className="text-slate-700 dark:text-slate-300"><strong>5% Trimmed Mean:</strong> Mean setelah menghilangkan 5% nilai tertinggi dan terendah</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-sm">M-Estimators</h4>
          <p className="text-sm text-muted-foreground">
            Estimasi robust untuk lokasi dan scale yang tidak terpengaruh outlier.
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-sm">
            <p className="text-slate-700 dark:text-slate-300 mb-2"><strong>Huber&apos;s M-Estimator:</strong> Estimasi lokasi robust</p>
            <p className="text-slate-700 dark:text-slate-300 mb-2"><strong>Biweight M-Estimator:</strong> Estimasi lokasi dengan efisiensi tinggi</p>
            <p className="text-slate-700 dark:text-slate-300"><strong>Hampel&apos;s M-Estimator:</strong> Estimasi yang sangat robust</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Confidence Interval for Mean</h4>
          <p className="text-sm text-muted-foreground">
            Atur tingkat kepercayaan untuk estimasi mean (biasanya 95% atau 99%).
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-sm">
            <p className="text-slate-700 dark:text-slate-300 mb-2"><strong>Rumus CI:</strong> mean ± (t × SE)</p>
            <p className="text-slate-700 dark:text-slate-300">dimana SE = std / sqrt(n) dan t adalah nilai t-tabel</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Outliers</h4>
          <p className="text-sm text-muted-foreground">
            Identifikasi nilai ekstrem yang mungkin memerlukan perhatian khusus dalam analisis.
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-sm">
            <p className="text-slate-700 dark:text-slate-300 mb-2"><strong>Kriteria Outlier:</strong></p>
            <p className="text-slate-700 dark:text-slate-300 mb-1">• Nilai kurang dari Q1 - 1.5 × IQR</p>
            <p className="text-slate-700 dark:text-slate-300 mb-1">• Nilai lebih dari Q3 + 1.5 × IQR</p>
            <p className="text-slate-700 dark:text-slate-300">dimana IQR = Q3 - Q1</p>
          </div>
        </div>
      </div>
    </HelpCard>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Tests of Normality</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Kolmogorov-Smirnov Test</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border font-mono text-sm mb-2 text-slate-700 dark:text-slate-300">
            H0: Data mengikuti distribusi normal
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Uji normalitas untuk sampel besar (n &gt; 50).</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">p &lt; 0.05 menunjukkan data tidak normal</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Shapiro-Wilk Test</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border font-mono text-sm mb-2 text-slate-700 dark:text-slate-300">
            H0: Data mengikuti distribusi normal
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Uji normalitas untuk sampel kecil hingga sedang (n ≤ 50).</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">Lebih sensitif daripada Kolmogorov-Smirnov untuk sampel kecil</p>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Percentiles</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Quartiles (25, 50, 75)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border font-mono text-sm mb-2 text-slate-700 dark:text-slate-300">
            Q1 = 25th percentile, Q2 = Median, Q3 = 75th percentile
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Membagi data menjadi empat bagian sama besar.</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Custom Percentiles</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border font-mono text-sm mb-2 text-slate-700 dark:text-slate-300">
            Dapat menentukan percentile khusus (misal: 10th, 90th)
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Berguna untuk menentukan cut-off points atau threshold tertentu.</p>
        </div>
      </div>
    </div>

    <HelpAlert variant="info" title="Memahami Statistik Robust">
      <p className="text-sm mt-2">
        Statistik robust memberikan estimasi yang dapat diandalkan bahkan ketika data Anda mengandung outlier. 
        5% trimmed mean, misalnya, mengecualikan 5% nilai tertinggi dan terendah sebelum menghitung rata-rata, 
        sehingga lebih tahan terhadap pengaruh nilai ekstrem.
      </p>
    </HelpAlert>

    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">💡</span>
        </div>
        <div>
          <h3 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">Rekomendasi Pengaturan</h3>
          <div className="text-sm space-y-2 text-emerald-700 dark:text-emerald-300">
            <p>• <strong>Untuk data bersih:</strong> Aktifkan semua opsi untuk analisis lengkap</p>
            <p>• <strong>Untuk data dengan outlier:</strong> Fokus pada M-estimators dan trimmed mean</p>
            <p>• <strong>Untuk uji normalitas:</strong> Gunakan Shapiro-Wilk untuk n≤50, KS untuk n&gt;50</p>
            <p>• <strong>Untuk perbandingan kelompok:</strong> Pastikan ukuran sampel seimbang</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);