import React from 'react';
import { Calculator, Target } from 'lucide-react';

export const OverviewTab = () => (
  <div className="space-y-6">
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Apa itu Statistik Deskriptif?</h3>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        Statistik deskriptif merangkum data Anda dengan ukuran-ukuran kunci seperti rata-rata, sebaran, 
        dan bentuk distribusi. Mereka memberikan wawasan cepat tentang karakteristik data Anda.
      </p>
    </div>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
          <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Kapan Menggunakan Statistik Deskriptif</h3>
      </div>
      <ul className="text-sm space-y-2 text-slate-600 dark:text-slate-300">
        <li className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
          <span>Memahami tendensi sentral data Anda</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
          <span>Mengukur seberapa tersebar data Anda</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
          <span>Memeriksa kualitas data dan outlier</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
          <span>Membandingkan variabel atau kelompok yang berbeda</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
          <span>Eksplorasi awal sebelum analisis lanjutan</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
          <span>Validasi asumsi untuk uji statistik</span>
        </li>
      </ul>
    </div>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Statistik Utama yang Akan Anda Dapatkan</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">Tendensi Sentral:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Mean (Rata-rata)</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">- Jumlah semua nilai dibagi jumlah data</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Median</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">- Nilai tengah ketika data diurutkan</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Sum</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">- Jumlah total dari semua nilai</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">Ukuran Sebaran:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Standard Deviation</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">- Rata-rata jarak dari mean</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Variance</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">- Kuadrat dari standard deviation</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Range</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">- Selisih antara nilai maksimum dan minimum</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Minimum & Maximum</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">- Nilai terkecil dan terbesar dalam data</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">S.E. Mean</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">- Standard Error dari rata-rata</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">Bentuk Distribusi:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Skewness</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">- Ukuran asimetri distribusi</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Kurtosis</span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">- Ukuran ketajaman puncak distribusi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
