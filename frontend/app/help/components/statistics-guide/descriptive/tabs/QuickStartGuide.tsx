import React from 'react';

export const QuickStartGuide = () => (
  <div className="space-y-6">
    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-blue-500 dark:border-blue-400">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Panduan Cepat: Analisis Deskriptif</h3>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Pilih Variabel</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">Seret variabel numerik dari panel kiri ke kotak analisis.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Pilih Statistik</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">Tentukan statistik mana yang ingin ditampilkan dalam hasil.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Jalankan Analisis</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">Klik tombol OK untuk menjalankan analisis dan melihat hasil.</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-500 dark:border-slate-400">
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">Interpretasi Hasil</h3>
      <div className="space-y-3">
        <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Tendensi Sentral</h4>
          <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
            <li>• <strong>Mean:</strong> Rata-rata aritmatika, sensitif terhadap outlier</li>
            <li>• <strong>Median:</strong> Nilai tengah, robust terhadap outlier</li>
            <li>• <strong>Sum:</strong> Total keseluruhan nilai dalam dataset</li>
          </ul>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Sebaran Data</h4>
          <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
            <li>• <strong>Standard Deviation:</strong> Ukuran penyebaran rata-rata dari mean</li>
            <li>• <strong>Variance:</strong> Kuadrat dari standard deviation</li>
            <li>• <strong>Range:</strong> Selisih antara nilai maksimum dan minimum</li>
          </ul>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Bentuk Distribusi</h4>
          <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
            <li>• <strong>Skewness:</strong> Mengukur asimetri distribusi data</li>
            <li>• <strong>Kurtosis:</strong> Mengukur ketajaman puncak distribusi</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);
