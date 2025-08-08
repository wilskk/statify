import React from 'react';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { Table, Calculator, BarChart3, Eye, EyeOff } from 'lucide-react';

export const CellsTab = () => (
  <div className="space-y-6">
    <HelpCard title="Opsi Tampilan Sel" icon={Table} variant="feature">
      <div className="space-y-4 mt-2">
        <div className="text-sm font-medium mb-3">Counts (Jumlah)</div>
        <HelpStep
          number={1}
          title="Observed (Teramati)"
          description="Menampilkan frekuensi aktual dalam setiap sel tabel kontingensi."
        />
        <HelpStep
          number={2}
          title="Expected (Diharapkan)"
          description="Menampilkan frekuensi yang diharapkan dengan asumsi variabel independen."
        />
        <HelpStep
          number={3}
          title="Hide Small Counts (Sembunyikan Jumlah Kecil)"
          description="Menyembunyikan sel dengan jumlah di bawah ambang batas tertentu untuk privasi data."
        />
      </div>
    </HelpCard>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Frekuensi Teramati vs Diharapkan</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Frekuensi Teramati (Observed)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border text-sm mb-2 text-slate-700 dark:text-slate-300">
            Oᵢⱼ = Jumlah aktual dalam sel baris i, kolom j
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Ini adalah data asli yang Anda kumpulkan - jumlah observasi yang benar-benar terjadi dalam setiap kombinasi kategori.</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Frekuensi Diharapkan (Expected)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border text-sm mb-2 text-slate-700 dark:text-slate-300">
            Eᵢⱼ = (Total Baris i × Total Kolom j) / Total Keseluruhan
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Frekuensi yang diharapkan jika kedua variabel benar-benar independen (tidak ada hubungan).</p>
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-3">
            <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h4 className="font-medium text-amber-800 dark:text-amber-200">Hide Small Counts</h4>
          </div>
          <div className="text-sm space-y-2 text-amber-700 dark:text-amber-300">
            <p><strong>Tujuan:</strong> Melindungi privasi responden dengan menyembunyikan sel yang memiliki frekuensi rendah</p>
            <p><strong>Ambang batas umum:</strong> Biasanya &lt; 5 atau &lt; 10 observasi</p>
            <p><strong>Catatan:</strong> Penting untuk penelitian dengan data sensitif atau identifiable</p>
          </div>
        </div>
      </div>
    </div>

    <HelpCard title="Opsi Persentase" icon={Calculator} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="% within Row Variable (% dalam Variabel Baris)"
          description="Menampilkan persentase setiap sel terhadap total barisnya."
        />
        <HelpStep
          number={2}
          title="% within Column Variable (% dalam Variabel Kolom)"
          description="Menampilkan persentase setiap sel terhadap total kolomnya."
        />
        <HelpStep
          number={3}
          title="% of Total (% dari Total)"
          description="Menampilkan persentase setiap sel terhadap total keseluruhan."
        />
      </div>
    </HelpCard>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Jenis Persentase dan Interpretasinya</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Row Percentages (Persentase Baris)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border text-sm mb-2 text-slate-700 dark:text-slate-300">
            % Baris = (Sel / Total Baris) × 100%
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p><strong>Interpretasi:</strong> Distribusi variabel kolom dalam setiap kategori variabel baris</p>
            <p><strong>Contoh:</strong> &quot;Dari semua responden laki-laki, 60% memilih produk A dan 40% memilih produk B&quot;</p>
            <p><strong>Gunakan untuk:</strong> Membandingkan pola antar baris</p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Column Percentages (Persentase Kolom)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border text-sm mb-2 text-slate-700 dark:text-slate-300">
            % Kolom = (Sel / Total Kolom) × 100%
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p><strong>Interpretasi:</strong> Distribusi variabel baris dalam setiap kategori variabel kolom</p>
            <p><strong>Contoh:</strong> &quot;Dari semua yang memilih produk A, 70% adalah laki-laki dan 30% perempuan&quot;</p>
            <p><strong>Gunakan untuk:</strong> Membandingkan pola antar kolom</p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Total Percentages (Persentase Total)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border text-sm mb-2 text-slate-700 dark:text-slate-300">
            % Total = (Sel / Total Keseluruhan) × 100%
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p><strong>Interpretasi:</strong> Proporsi setiap sel terhadap seluruh sampel</p>
            <p><strong>Contoh:</strong> &quot;Laki-laki yang memilih produk A mewakili 35% dari seluruh responden&quot;</p>
            <p><strong>Gunakan untuk:</strong> Memahami distribusi keseluruhan</p>
          </div>
        </div>
      </div>
    </div>

    <HelpCard title="Residual" icon={BarChart3} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Unstandardized (Tidak Terstandarisasi)"
          description="Selisih antara frekuensi teramati dan diharapkan: Observed - Expected"
        />
        <HelpStep
          number={2}
          title="Standardized Residual (Residual Terstandarisasi)"
          description="Residual dibagi dengan akar kuadrat dari frekuensi yang diharapkan."
        />
        <HelpStep
          number={3}
          title="Adjusted Residual (Residual Disesuaikan)"
          description="Residual terstandarisasi yang disesuaikan dengan varians sel."
        />
      </div>
    </HelpCard>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Analisis Residual</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Unstandardized Residual</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border text-sm mb-2 text-slate-700 dark:text-slate-300">
            r = Observed - Expected
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Nilai positif menunjukkan frekuensi lebih tinggi dari yang diharapkan, nilai negatif sebaliknya.</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Standardized Residual</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border text-sm mb-2 text-slate-700 dark:text-slate-300">
            sr = (Observed - Expected) / √Expected
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Lebih mudah dibandingkan antar sel. Nilai &gt;|2| menunjukkan deviasi yang signifikan.</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Adjusted Residual</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border text-sm mb-2 text-slate-700 dark:text-slate-300">
            ar = sr / √(1 - p_row)(1 - p_col)
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Mengikuti distribusi normal standar. Nilai &gt;|1.96| signifikan pada α = 0.05.</p>
        </div>
      </div>
    </div>

    <HelpAlert variant="tip" title="Interpretasi Persentase">
      <div className="text-sm space-y-2 mt-2">
        <p>
          <strong>Row Percentages:</strong> Gunakan untuk membandingkan distribusi variabel kolom antar kategori baris 
          (misalnya: perbedaan preferensi produk antara laki-laki dan perempuan)
        </p>
        <p>
          <strong>Column Percentages:</strong> Gunakan untuk membandingkan distribusi variabel baris antar kategori kolom 
          (misalnya: komposisi gender untuk setiap produk)
        </p>
        <p>
          <strong>Total Percentages:</strong> Gunakan untuk memahami proporsi setiap kombinasi kategori dalam populasi keseluruhan
        </p>
        <p>
          <strong>Residual Analysis:</strong> Gunakan untuk mengidentifikasi sel mana yang berkontribusi paling besar terhadap asosiasi yang signifikan
        </p>
      </div>
    </HelpAlert>
  </div>
);
