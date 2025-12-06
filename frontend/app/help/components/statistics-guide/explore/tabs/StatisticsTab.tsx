import React from 'react';
import { HelpCard, HelpAlert } from '@/app/help/ui/HelpLayout';
import { Calculator, TrendingUp, Target, BarChart2, AlertTriangle, Lightbulb } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

export const StatisticsTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="Statistik dalam Analisis Explore">
      <p className="text-sm mt-2">
        Analisis Explore menggunakan <strong>ExamineCalculator</strong> yang menghasilkan kombinasi statistik deskriptif standar 
        dan robust statistics yang tahan terhadap outlier. Setiap opsi memberikan insight berbeda tentang karakteristik data.
      </p>
    </HelpAlert>

    <HelpCard title="Descriptives - Statistik Dasar + Robust" icon={Calculator} variant="feature">
      <div className="space-y-4 mt-2">
        <p className="text-sm text-muted-foreground">
          Checkbox Descriptives mengaktifkan statistik deskriptif lengkap dengan tambahan robust estimators 
          yang memberikan gambaran yang lebih reliable tentang pusat dan penyebaran data.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
            <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Statistik Standar</h4>
            <ul className="text-sm space-y-1 text-slate-700 dark:text-slate-300">
              <li>• <strong>N, N Valid, N Missing:</strong> Ukuran sampel dan data availability</li>
              <li>• <strong>Mean:</strong> Rata-rata aritmatik dengan weighted calculation</li>
              <li>• <strong>Std. Deviation:</strong> Standar deviasi populasi atau sampel</li>
              <li>• <strong>Variance:</strong> Varians untuk mengukur penyebaran</li>
              <li>• <strong>Min, Max:</strong> Nilai minimum dan maksimum</li>
              <li>• <strong>Sum:</strong> Total penjumlahan dengan weights</li>
            </ul>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
            <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Robust Statistics</h4>
            <ul className="text-sm space-y-1 text-slate-700 dark:text-slate-300">
              <li>• <strong>5% Trimmed Mean:</strong> Mean setelah buang 5% ekstrem</li>
              <li>• <strong>Median:</strong> Nilai tengah yang tidak terpengaruh outlier</li>
              <li>• <strong>Tukey's Hinges IQR:</strong> Q3-Q1 dengan metode Tukey</li>
              <li>• <strong>Percentiles:</strong> [5, 10, 25, 50, 75, 90, 95] default</li>
              <li>• <strong>Skewness & Kurtosis:</strong> Bentuk distribusi</li>
            </ul>
          </div>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Formula Kunci</h4>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium">5% Trimmed Mean:</span>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Mean yang dihitung setelah menghilangkan 5% nilai tertinggi dan 5% nilai terendah berdasarkan total weight
              </div>
            </div>
            <div>
              <span className="text-sm font-medium">Tukey's Hinges IQR:</span>
              <BlockMath math={'\\text{IQR} = Q_3 - Q_1 \\text{ (using Tukey method, not percentile)}'} />
            </div>
          </div>
        </div>
      </div>
    </HelpCard>

    <HelpCard title="Confidence Interval for Mean" icon={TrendingUp} variant="default">
      <div className="space-y-4 mt-2">
        <p className="text-sm text-muted-foreground">
          Input field numerik yang hanya aktif ketika Descriptives dicentang. Default 95%, 
          dapat diubah ke level kepercayaan lain (90%, 99%, dll.).
        </p>
        
        <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Mengapa Confidence Interval Penting?</h4>
          <ul className="text-sm space-y-1 text-slate-700 dark:text-slate-300">
            <li>• Mengestimasi range nilai true population mean</li>
            <li>• Mengukur presisi estimasi mean dari sample</li>
            <li>• Memberikan informasi tentang statistical significance</li>
            <li>• Membantu dalam interpretasi practical significance</li>
          </ul>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Formula Confidence Interval</h4>
          <BlockMath math={'CI = \\bar{x} \\pm t_{\\alpha/2,df} \\times SE'} />
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1 mt-2">
            <div><InlineMath math={'SE = \\dfrac{s}{\\sqrt{n}}'} /> (Standard Error of Mean)</div>
            <div><InlineMath math={'df = n - 1'} /> (degrees of freedom)</div>
            <div><InlineMath math={'t_{\\alpha/2,df}'} /> menggunakan t-distribution approximation</div>
          </div>
        </div>
      </div>
    </HelpCard>

    <HelpCard title="Outliers - Deteksi Nilai Ekstrem" icon={Target} variant="default">
      <div className="space-y-4 mt-2">
        <p className="text-sm text-muted-foreground">
          Checkbox Outliers mengaktifkan systematic outlier detection menggunakan Tukey's Hinges dengan 
          kriteria 1.5×IQR dan 3×IQR fences. Default menampilkan 5 highest dan 5 lowest extreme values.
        </p>
        
        <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Klasifikasi Outliers</h4>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Mild Outliers:</span>
              <div className="flex gap-4 mt-1">
                <BlockMath math={'x < Q_1 - 1.5 \\times IQR'} />
                <span className="text-sm self-center">atau</span>
                <BlockMath math={'x > Q_3 + 1.5 \\times IQR'} />
              </div>
            </div>
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Extreme Outliers:</span>
              <div className="flex gap-4 mt-1">
                <BlockMath math={'x < Q_1 - 3 \\times IQR'} />
                <span className="text-sm self-center">atau</span>
                <BlockMath math={'x > Q_3 + 3 \\times IQR'} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <h5 className="font-medium text-sm mb-2">Interpretasi Outliers</h5>
            <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
              <li>• Data entry errors atau measurement errors</li>
              <li>• Natural variation dalam populasi</li>
              <li>• Subgroup dengan karakteristik berbeda</li>
              <li>• Extreme events atau special circumstances</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <h5 className="font-medium text-sm mb-2">Langkah Setelah Detect Outliers</h5>
            <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
              <li>• Investigate penyebab nilai ekstrem</li>
              <li>• Verify accuracy of data entry</li>
              <li>• Consider transformation atau robust methods</li>
              <li>• Separate analysis untuk outliers</li>
            </ul>
          </div>
        </div>
      </div>
    </HelpCard>

    <HelpCard title="M-Estimators - Always Computed" icon={BarChart2} variant="default">
      <div className="space-y-4 mt-2">
        <p className="text-sm text-muted-foreground">
          M-Estimators adalah robust location estimators yang otomatis dihitung untuk semua variabel numerik. 
          Saat ini menggunakan 5% trimmed mean sebagai approximation untuk semua tipe M-estimator.
        </p>
        
        <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Jenis M-Estimators</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Huber:</span>
              <p className="text-slate-600 dark:text-slate-400 text-xs">Robust estimator dengan bounded influence function</p>
            </div>
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Tukey:</span>
              <p className="text-slate-600 dark:text-slate-400 text-xs">Bisquare estimator yang menolak outlier secara total</p>
            </div>
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Hampel:</span>
              <p className="text-slate-600 dark:text-slate-400 text-xs">Three-part redescending estimator</p>
            </div>
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Andrews:</span>
              <p className="text-slate-600 dark:text-slate-400 text-xs">Sine-based redescending estimator</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Keunggulan M-Estimators</h4>
          <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
            <li>• <strong>Robust:</strong> Tidak terpengaruh oleh outliers seperti arithmetic mean</li>
            <li>• <strong>Efficient:</strong> Tetap memberikan estimasi yang baik untuk data normal</li>
            <li>• <strong>Breakdown point:</strong> Dapat menahan hingga proporsi tertentu data yang corrupt</li>
            <li>• <strong>Asymptotic normality:</strong> Distribusi sampling mendekati normal untuk sample besar</li>
          </ul>
        </div>
      </div>
    </HelpCard>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <HelpCard title="Rekomendasi Pengaturan Statistics" variant="default" icon={Lightbulb}>
        <div className="text-sm space-y-2">
          <p>• <strong>Selalu aktifkan Descriptives:</strong> Untuk mendapat gambaran lengkap data + robust measures</p>
          <p>• <strong>Confidence Interval 95%:</strong> Standard untuk most analyses, ubah sesuai kebutuhan research</p>
          <p>• <strong>Aktifkan Outliers:</strong> Terutama untuk data exploration atau ketika suspect ada nilai ekstrem</p>
          <p>• <strong>M-Estimators otomatis:</strong> Review nilai-nilai ini untuk comparison dengan classical statistics</p>
          <p>• <strong>Kombinasi optimal:</strong> Descriptives + Outliers + CI 95% untuk comprehensive analysis</p>
        </div>
      </HelpCard>
      
      <HelpCard title="Tips Interpretasi" variant="default" icon={AlertTriangle}>
        <div className="text-sm space-y-2">
          <p>• <strong>Perbandingan Mean vs Trimmed Mean:</strong> Perbedaan besar mengindikasikan adanya outliers</p>
          <p>• <strong>IQR vs Standard Deviation:</strong> Gunakan IQR untuk data skewed atau dengan outliers</p>
          <p>• <strong>Confidence Interval:</strong> CI yang lebar menunjukkan ketidakpastian estimasi yang tinggi</p>
          <p>• <strong>Outlier Detection:</strong> Identifikasi dan investigasi penyebab nilai ekstrem</p>
        </div>
      </HelpCard>
    </div>

  </div>
);