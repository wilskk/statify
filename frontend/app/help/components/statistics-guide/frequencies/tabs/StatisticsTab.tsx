import React from 'react';
import { HelpAlert } from '@/app/help/ui/HelpLayout';
import { Calculator } from 'lucide-react';

export const StatisticsTab = () => (
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