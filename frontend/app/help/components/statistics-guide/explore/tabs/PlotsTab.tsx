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

    <HelpAlert variant="tip" title="Panduan Pemilihan Plot">
      <div className="text-sm space-y-2 mt-2">
        <p>• <strong>Boxplots:</strong> Terbaik untuk membandingkan distribusi antar kelompok dan mengidentifikasi outlier</p>
        <p>• <strong>Histograms:</strong> Ideal untuk memahami bentuk distribusi secara keseluruhan</p>
        <p>• <strong>Stem-and-leaf:</strong> Berguna untuk dataset kecil-menengah untuk melihat nilai eksak sekaligus pola distribusi</p>
        <p>• <strong>Factor levels together:</strong> Berguna ketika Anda ingin membandingkan distribusi antar kelompok faktor</p>
        <p>• <strong>Dependents separately:</strong> Ideal ketika variabel dependen memiliki skala atau rentang yang berbeda</p>
        <p>• <strong>Kombinasi plot:</strong> Gunakan beberapa jenis plot untuk analisis yang komprehensif</p>
      </div>
    </HelpAlert>

    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">⚠</span>
        </div>
        <div>
          <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Tips Interpretasi Plots</h3>
          <div className="text-sm space-y-2 text-amber-700 dark:text-amber-300">
            <p>• <strong>Boxplot outliers:</strong> Titik di luar whiskers adalah outlier potensial</p>
            <p>• <strong>Histogram shape:</strong> Bentuk bell curve menunjukkan distribusi normal, bentuk miring menunjukkan skewness</p>
            <p>• <strong>Boxplot comparison:</strong> Bandingkan median (garis tengah) dan IQR (tinggi kotak) antar kelompok</p>
            <p>• <strong>Stem-and-leaf detail:</strong> Mempertahankan nilai aktual sambil menampilkan pola distribusi</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);