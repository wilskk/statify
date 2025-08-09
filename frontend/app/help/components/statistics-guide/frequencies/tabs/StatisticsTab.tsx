import React from 'react';
import { HelpAlert } from '@/app/help/ui/HelpLayout';
import { Calculator } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

export const StatisticsTab = () => (
  <div className="space-y-6">
    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-blue-500 dark:border-blue-400">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">i</span>
        </div>
        <div>
          <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Formula Matematika</h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">Berikut adalah formula matematika untuk setiap statistik yang dapat dihitung dalam analisis frekuensi.</p>
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
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'\\bar{x} = \\dfrac{\\sum x_i f_i}{\\sum f_i}'} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Rata-rata tertimbang berdasarkan frekuensi setiap nilai.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">xi = nilai, fi = frekuensi nilai tersebut</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Median</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'\\tilde{x} = \\text{nilai tengah dari data terurut}'} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Nilai yang membagi data menjadi dua bagian sama besar.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">Tidak terpengaruh outlier, cocok untuk data skewed</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Mode (Modus)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'\\text{Mode} = \\text{nilai dengan frekuensi tertinggi}'} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Nilai yang paling sering muncul dalam dataset.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">Sangat berguna untuk data kategorikal</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Sum (Jumlah)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'\\text{Sum} = \\sum x_i f_i'} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total tertimbang dari semua nilai berdasarkan frekuensinya.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">xi = nilai, fi = frekuensi nilai tersebut</p>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Ukuran Sebaran (Dispersion)</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Standard Deviation (Simpangan Baku)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'\\sigma = \\sqrt{ \\dfrac{ \\sum (x_i - \\bar{x})^2 f_i }{ \\sum f_i } }'} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Mengukur rata-rata jarak data dari mean dalam analisis frekuensi.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">Dihitung dengan mempertimbangkan frekuensi setiap nilai</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Variance (Varians)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'\\sigma^2 = \\dfrac{ \\sum (x_i - \\bar{x})^2 f_i }{ \\sum f_i }'} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Kuadrat dari standard deviation. Mengukur variabilitas dalam tabel frekuensi.</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Range & Min/Max</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'R = x_{\\max} - x_{\\min}'} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Rentang dari nilai terkecil hingga terbesar dalam distribusi frekuensi.</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">S.E. Mean (Standard Error)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'SE = \\dfrac{ \\sigma }{ \\sqrt{ \\sum f_i } }'} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Standard error dari rata-rata dalam konteks tabel frekuensi.</p>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Bentuk Distribusi</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Skewness (Kemencengan)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'\\text{Skew} = \\dfrac{ \\sum \\left( \\dfrac{x_i - \\bar{x}}{\\sigma} \\right)^3 f_i }{ \\sum f_i }'} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Mengukur asimetri distribusi frekuensi:</p>
          <ul className="text-xs space-y-1 ml-4 text-slate-500 dark:text-slate-500">
            <li>• Skewness = 0: distribusi simetris</li>
            <li>• Skewness &gt; 0: ekor kanan lebih panjang</li>
            <li>• Skewness &lt; 0: ekor kiri lebih panjang</li>
          </ul>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Kurtosis</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'\\text{Kurt} = \\dfrac{ \\sum \\left( \\dfrac{x_i - \\bar{x}}{\\sigma} \\right)^4 f_i }{ \\sum f_i } - 3'} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Mengukur ketajaman puncak distribusi frekuensi:</p>
          <ul className="text-xs space-y-1 ml-4 text-slate-500 dark:text-slate-500">
            <li>• Kurtosis = 0: distribusi normal (mesokurtic)</li>
            <li>• Kurtosis &gt; 0: puncak lebih tajam (leptokurtic)</li>
            <li>• Kurtosis &lt; 0: puncak lebih datar (platykurtic)</li>
          </ul>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Percentiles & Quartiles</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Quartiles</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2 text-slate-700 dark:text-slate-300">
            <div className="text-sm">
              <InlineMath math={'Q_1'} />
              <span className="ml-2">= 25th percentile, </span>
              <InlineMath math={'Q_2'} />
              <span className="ml-2">= 50th percentile (median), </span>
              <InlineMath math={'Q_3'} />
              <span className="ml-2">= 75th percentile</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Membagi distribusi frekuensi menjadi empat bagian sama besar.</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Custom Percentiles</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2 text-slate-700 dark:text-slate-300">
            <InlineMath math={'P_p'} />
            <span className="text-sm ml-2">= nilai dimana </span>
            <InlineMath math={'p\\%'} />
            <span className="text-sm ml-1">data berada di bawahnya</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Anda dapat menambahkan percentile khusus (0-100) sesuai kebutuhan analisis.</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Cut Points</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2 text-slate-700 dark:text-slate-300">
            <span className="text-sm">Membagi data menjadi </span>
            <InlineMath math={'n'} />
            <span className="text-sm ml-1">grup dengan ukuran yang sama</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Berguna untuk membuat kategori atau grup data berdasarkan distribusi yang merata.</p>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Tabel Frekuensi</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Frekuensi Relatif (%)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'\\text{Persentase} = \\dfrac{f_i}{n} \\times 100\\%'} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Persentase kemunculan setiap nilai terhadap total data.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">fi = frekuensi nilai, n = total data valid</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Frekuensi Kumulatif</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'F_k = \\sum_{i \\le k} f_i'} />
            <div className="text-xs text-slate-700 dark:text-slate-300 mt-1">(dari nilai terkecil hingga nilai saat ini)</div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Jumlah akumulatif frekuensi dari nilai terkecil hingga nilai tertentu.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">Berguna untuk menentukan posisi relatif suatu nilai</p>
        </div>
      </div>
    </div>

    <HelpAlert variant="tip" title="Tips Pemilihan Statistik">
      <div className="text-sm space-y-2 mt-2">
        <p>• <strong>Untuk data kategorikal:</strong> Fokus pada frekuensi, persentase, mode, dan quartiles</p>
        <p>• <strong>Untuk data numerik:</strong> Tambahkan mean, median, standard deviation, variance, dan skewness/kurtosis</p>
        <p>• <strong>Untuk data ordinal:</strong> Gunakan median, percentiles, dan quartiles</p>
        <p>• <strong>Outlier detection:</strong> Periksa range, min/max, dan gunakan percentiles untuk identifikasi</p>
        <p>• <strong>Missing values:</strong> Selalu periksa jumlah dan persentase data yang hilang</p>
        <p>• <strong>Custom percentiles:</strong> Tambahkan percentile khusus untuk analisis yang lebih spesifik</p>
      </div>
    </HelpAlert>
  </div>
);