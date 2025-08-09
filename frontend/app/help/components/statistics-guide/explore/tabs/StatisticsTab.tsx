import React from 'react';
import { HelpCard, HelpAlert } from '@/app/help/ui/HelpLayout';
import { Calculator } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

export const StatisticsTab = () => (
  <div className="space-y-6">
    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-800">
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
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded">
            <div className="mb-3">
              <p className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-1">Mean</p>
              <BlockMath math={'\\bar{x} = \\dfrac{\\sum x}{n}'} />
            </div>
            <div className="mb-3">
              <p className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-1">Standard Deviation</p>
              <BlockMath math={'s = \\sqrt{\\dfrac{\\sum (x - \\bar{x})^2}{n - 1}}'} />
            </div>
            <div>
              <p className="text-slate-700 dark:text-slate-300 text-sm">
                <strong>5% trimmed mean:</strong>
                <span className="ml-1">Mean setelah menghilangkan </span>
                <InlineMath math={'5\\%'} />
                <span className="ml-1">nilai tertinggi dan terendah</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Confidence Interval for Mean</h4>
          <p className="text-sm text-muted-foreground">
            Atur tingkat kepercayaan untuk estimasi mean (biasanya 95% atau 99%).
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded">
            <div className="mb-2">
              <p className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-1">Rumus CI</p>
              <BlockMath math={'\\bar{x} \\pm t \\cdot SE'} />
            </div>
            <div className="text-slate-700 dark:text-slate-300 text-sm">
              <InlineMath math={'SE = \\dfrac{s}{\\sqrt{n}}'} />
              <span className="ml-1">dan t adalah nilai t-tabel</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Outliers</h4>
          <p className="text-sm text-muted-foreground">
            Identifikasi nilai ekstrem yang mungkin memerlukan perhatian khusus dalam analisis.
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded">
            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-2">Kriteria Outlier</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span>•</span>
                <BlockMath math={'x < Q_1 - 1.5 \\times IQR'} />
              </div>
              <div className="flex items-start gap-2">
                <span>•</span>
                <BlockMath math={'x > Q_3 + 1.5 \\times IQR'} />
              </div>
              <div className="text-slate-700 dark:text-slate-300 text-sm">
                <InlineMath math={'IQR = Q_3 - Q_1'} />
              </div>
            </div>
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

    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">💡</span>
        </div>
        <div>
          <h3 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">Rekomendasi Pengaturan</h3>
          <div className="text-sm space-y-2 text-emerald-700 dark:text-emerald-300">
            <p>• <strong>Untuk eksplorasi awal:</strong> Aktifkan Descriptives untuk mendapatkan gambaran umum data</p>
            <p>• <strong>Untuk data bermasalah:</strong> Aktifkan Outliers untuk mengidentifikasi nilai ekstrem</p>
            <p>• <strong>Confidence Interval:</strong> Gunakan 95% untuk analisis standar, 99% untuk analisis konservatif</p>
            <p>• <strong>5% trimmed mean:</strong> Memberikan estimasi mean yang lebih robust terhadap outlier</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);