import React from 'react';
import { HelpCard, HelpAlert } from '@/app/help/ui/HelpLayout';
import { HelpCircle, FileText, TrendingUp } from 'lucide-react';

export const OverviewTab = () => (
  <div className="space-y-6">
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Apa itu Analisis Explore?</h3>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        Analisis Explore memberikan wawasan komprehensif tentang data Anda menggunakan metode statistik yang robust. 
        Ini mengidentifikasi pola, outlier, dan karakteristik distribusi sambil memberikan estimasi yang dapat diandalkan 
        yang tidak terpengaruh oleh nilai ekstrem.
      </p>
    </div>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
          <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Kapan Menggunakan Analisis Explore</h3>
      </div>
      <ul className="text-sm space-y-2 text-slate-600 dark:text-slate-300">
        <li className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
          <span>Analisis data awal dan pemahaman mendalam</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
          <span>Deteksi outlier dan penilaian kualitas data</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
          <span>Analisis distribusi dan pemeriksaan normalitas</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
          <span>Estimasi statistik yang robust terhadap outlier</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
          <span>Identifikasi pola dan karakteristik data</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
          <span>Perbandingan kelompok menggunakan variabel faktor</span>
        </li>
      </ul>
    </div>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
          <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Apa yang Akan Anda Pelajari</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">Statistik Robust:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Trimmed Mean</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">- Mean yang tidak terpengaruh outlier</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">M-Estimators</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">- Estimasi robust untuk lokasi dan scale</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Confidence Intervals</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">- Interval kepercayaan untuk estimasi</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">Deteksi Outlier:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">IQR Method</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">- Identifikasi outlier dengan quartile</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Box Plot Analysis</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">- Visualisasi outlier dan distribusi</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">Visualisasi Lanjutan:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Stem-and-Leaf</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">- Distribusi dengan nilai eksak</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Normality Tests</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">- Uji normalitas dengan Q-Q plot</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">💡</span>
        </div>
        <div>
          <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Mengapa Explore Berbeda?</h3>
          <div className="text-sm space-y-2 text-amber-700 dark:text-amber-300">
            <p>• <strong>Lebih Robust:</strong> Tidak mudah terpengaruh oleh outlier dan nilai ekstrem</p>
            <p>• <strong>Lebih Komprehensif:</strong> Memberikan lebih banyak informasi tentang distribusi data</p>
            <p>• <strong>Lebih Informatif:</strong> Deteksi outlier otomatis dengan visualisasi yang jelas</p>
            <p>• <strong>Lebih Reliable:</strong> Estimasi yang dapat diandalkan untuk data dengan noise</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);