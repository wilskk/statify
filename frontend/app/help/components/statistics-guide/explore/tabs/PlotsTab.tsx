import React from 'react';
import { HelpCard, HelpAlert } from '@/app/help/ui/HelpLayout';
import { BarChart3 } from 'lucide-react';

export const PlotsTab = () => (
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
          <h4 className="font-medium text-sm">Descriptive Plots</h4>
          <div className="space-y-2">
            <p className="text-sm"><strong>Stem-and-leaf:</strong> Menampilkan distribusi detail sambil mempertahankan nilai data aktual</p>
            <p className="text-sm"><strong>Histogram:</strong> Menampilkan distribusi frekuensi untuk memahami bentuk dan pola data</p>
          </div>
        </div>
      </div>
    </HelpCard>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Normality Plots</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Normal Q-Q Plot</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border text-sm mb-2 text-slate-700 dark:text-slate-300">
            Plot quantile data vs quantile distribusi normal teoritis
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Jika data normal, titik-titik akan berada di sekitar garis diagonal.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">Penyimpangan dari garis menunjukkan deviasi dari normalitas</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Detrended Normal Q-Q Plot</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border text-sm mb-2 text-slate-700 dark:text-slate-300">
            Plot deviasi dari garis normal Q-Q
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Memudahkan identifikasi pola sistematis dalam deviasi.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">Titik harus tersebar acak di sekitar garis horizontal</p>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Spread vs Level Plots</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Power Estimation</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border text-sm mb-2 text-slate-700 dark:text-slate-300">
            Menganalisis hubungan antara spread dan level data
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Membantu menentukan transformasi yang tepat untuk menstabilkan varians.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">Slope mendekati 0 menunjukkan varians yang stabil</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Untransformed vs Transformed</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border text-sm mb-2 text-slate-700 dark:text-slate-300">
            Perbandingan sebelum dan sesudah transformasi
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Mengevaluasi efektivitas transformasi data.</p>
        </div>
      </div>
    </div>

    <HelpAlert variant="tip" title="Panduan Pemilihan Plot">
      <div className="text-sm space-y-2 mt-2">
        <p>• <strong>Boxplots:</strong> Terbaik untuk membandingkan distribusi antar kelompok</p>
        <p>• <strong>Histograms:</strong> Ideal untuk memahami bentuk distribusi secara keseluruhan</p>
        <p>• <strong>Stem-and-leaf:</strong> Berguna untuk dataset kecil untuk melihat nilai eksak</p>
        <p>• <strong>Q-Q plots:</strong> Essential untuk menguji asumsi normalitas</p>
        <p>• <strong>Spread vs Level:</strong> Penting untuk analisis homoskedastisitas</p>
        <p>• <strong>Kombinasi plot:</strong> Gunakan beberapa jenis plot untuk analisis yang komprehensif</p>
      </div>
    </HelpAlert>

    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">⚠</span>
        </div>
        <div>
          <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Tips Interpretasi Plots</h3>
          <div className="text-sm space-y-2 text-amber-700 dark:text-amber-300">
            <p>• <strong>Boxplot outliers:</strong> Titik di luar whiskers adalah outlier potensial</p>
            <p>• <strong>Histogram shape:</strong> Bentuk bell curve menunjukkan distribusi normal</p>
            <p>• <strong>Q-Q linearity:</strong> Garis lurus = distribusi normal, lengkungan = skewness</p>
            <p>• <strong>Spread consistency:</strong> Varians harus relatif konstan across levels</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);