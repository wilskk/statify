import React from 'react';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { BarChart3, PieChart, BarChart, TrendingUp } from 'lucide-react';

export const ChartsTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="Opsi Grafik untuk Analisis Frequencies">
      <p className="text-sm mt-2">
        Visualisasi grafik membantu memahami distribusi frekuensi data dengan berbagai format tampilan. 
        Pilih jenis grafik yang sesuai dengan tipe data dan tujuan analisis Anda.
      </p>
    </HelpAlert>

    <HelpCard title="Workflow Pemilihan Grafik" icon={BarChart3} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Aktifkan Display Charts"
          description='Centang opsi "Display charts" untuk menampilkan visualisasi grafik dalam hasil analisis frequencies.'
        />
        <HelpStep
          number={2}
          title="Pilih Jenis Grafik"
          description="Pilih satu jenis grafik yang paling sesuai dengan karakteristik data dan kebutuhan presentasi."
        />
        <HelpStep
          number={3}
          title="Tentukan Nilai Grafik"
          description="Pilih apakah menampilkan frekuensi absolut atau persentase untuk interpretasi yang lebih mudah."
        />
      </div>
    </HelpCard>

    <HelpCard title="Jenis Grafik yang Tersedia" icon={BarChart} variant="feature">
      <div className="space-y-4 mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Bar Charts</span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
              Grafik batang untuk menampilkan frekuensi kategori
            </p>
            <ul className="text-xs space-y-1 text-blue-600 dark:text-blue-400">
              <li>• Ideal untuk data kategorikal dan ordinal</li>
              <li>• Mudah membandingkan frekuensi antar kategori</li>
              <li>• Cocok untuk semua jumlah kategori</li>
            </ul>
          </div>
          
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Pie Charts</span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">
              Grafik lingkaran untuk menampilkan proporsi
            </p>
            <ul className="text-xs space-y-1 text-emerald-600 dark:text-emerald-400">
              <li>• Terbaik untuk menunjukkan proporsi keseluruhan</li>
              <li>• Maksimal 7 kategori untuk keterbacaan</li>
              <li>• Efektif untuk data nominal</li>
            </ul>
          </div>
          
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Histograms</span>
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">
              Histogram untuk data numerik kontinu
            </p>
            <ul className="text-xs space-y-1 text-purple-600 dark:text-purple-400">
              <li>• Cocok untuk melihat distribusi data kontinu</li>
              <li>• Menunjukkan bentuk distribusi (normal, skewed)</li>
              <li>• Ideal untuk variabel scale</li>
            </ul>
          </div>
          
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-4 h-4 text-slate-600 dark:text-slate-400">✗</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">None</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Tidak menampilkan grafik sama sekali - hanya tabel frekuensi
            </p>
          </div>
        </div>
      </div>
    </HelpCard>

    <HelpCard title="Opsi Nilai Grafik" icon={BarChart3} variant="default">
      <div className="space-y-4 mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-2">Frequencies</h4>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Menampilkan nilai frekuensi absolut. Ideal untuk melihat jumlah kasus aktual 
              di setiap kategori dan membandingkan ukuran sampel.
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <h4 className="font-medium text-sm text-emerald-800 dark:text-emerald-200 mb-2">Percentages</h4>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Menampilkan nilai dalam bentuk persentase. Lebih mudah untuk interpretasi 
              proporsi dan perbandingan relatif antar kategori.
            </p>
          </div>
        </div>
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            <strong>Catatan:</strong> Opsi nilai grafik tidak tersedia untuk histogram karena 
            histogram secara otomatis menampilkan frekuensi berdasarkan binning data kontinu.
          </p>
        </div>
      </div>
    </HelpCard>

    <HelpAlert variant="tip" title="Tips Pemilihan Grafik">
      <div className="text-sm space-y-2 mt-2">
        <p>• <strong>Bar charts:</strong> Pilihan terbaik untuk data kategorikal dan ordinal dengan perbandingan yang jelas</p>
        <p>• <strong>Pie charts:</strong> Gunakan untuk menunjukkan proporsi, tapi hindari jika ada terlalu banyak kategori</p>
        <p>• <strong>Histograms:</strong> Essential untuk memahami distribusi data numerik kontinu</p>
        <p>• <strong>Frequencies vs Percentages:</strong> Gunakan frekuensi untuk nilai absolut, persentase untuk perbandingan relatif</p>
      </div>
    </HelpAlert>
  </div>
);