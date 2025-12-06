import React from 'react';
import { Calculator, TrendingUp, BarChart3, AlertTriangle, Lightbulb } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';
import { HelpCard, HelpAlert } from '@/app/help/ui/HelpLayout';

export const StatisticsTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="Statistik dalam Analisis Descriptive">
      <p className="text-sm mt-2">
        Sistem menghitung statistik dengan dukungan <strong>bobot (weights)</strong>. Notasi: <InlineMath math={'W = \\sum w_i'} /> (total bobot), 
        <InlineMath math={'S = \\sum w_i x_i'} /> (jumlah berbobot), dan <InlineMath math={'M_k = \\sum w_i (x_i - \\bar{x})^k'} /> (momen terpusat berbobot).
      </p>
    </HelpAlert>

    <HelpCard title="Central Tendency" icon={Calculator} variant="feature">
      <div className="space-y-4 mt-2">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Mean (Rata-rata)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border">
            <BlockMath math={'\\bar{x} = \\dfrac{S}{W} = \\dfrac{\\sum w_i x_i}{\\sum w_i}'} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Rata-rata berbobot. Sensitif terhadap outlier.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">Contoh: [2, 4, 6, 8, 10] → Mean = 30/5 = 6</p>
        </div>
        
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Median</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border">
            <InlineMath math={'\\text{Median}'} />
            <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">= nilai tengah dari data terurut (Persentil ke-50)</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Tidak terpengaruh outlier, cocok untuk data skewed.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">Metode persentil: <InlineMath math={'t_p = (W+1) \\cdot p/100'} />, cari indeks kumulatif minimum <InlineMath math={'cc[i] \\ge t_p'} />, lalu interpolasi linier antara <InlineMath math={'x_1'} /> dan <InlineMath math={'x_2'} />.</p>
        </div>
        
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">25th Percentile (Q1) & 75th Percentile (Q3)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border">
            <InlineMath math={'Q1 = P_{25}, \\quad Q3 = P_{75}'} />
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">IQR = Q3 - Q1 (Interquartile Range)</div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Q1: 25% data berada di bawah nilai ini. Q3: 75% data berada di bawah nilai ini.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">IQR mengukur sebaran 50% data tengah, kurang sensitif terhadap outlier</p>
        </div>
        
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Sum (Jumlah)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border">
            <BlockMath math={'\\mathrm{Sum} = S = \\sum w_i x_i'} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total dari semua nilai dalam dataset (dengan bobot jika ada).</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">Contoh: [2, 4, 6, 8, 10] → Sum = 30</p>
        </div>
      </div>
    </HelpCard>

    <HelpCard title="Dispersion" icon={Calculator} variant="default">
      <div className="space-y-4 mt-2">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Std. deviation (Simpangan Baku)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border">
            <BlockMath math={'s = \\sqrt{\\dfrac{M_2}{W-1}}'} />
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-400"><InlineMath math={'M_2 = \\sum w_i (x_i - \\bar{x})^2'} /> (varian sampel berbobot)</div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Mengukur rata-rata jarak data dari mean. Semakin besar nilai, semakin tersebar data.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">Interpretasi: ~68% data dalam 1 SD, ~95% dalam 2 SD dari mean</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Variance (Varians)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border">
            <BlockMath math={'s^2 = \\dfrac{M_2}{W-1}'} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Kuadrat dari standard deviation. Mengukur variabilitas data.</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Range</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border">
            <BlockMath math={'\\mathrm{Range} = \\max(x) - \\min(x)'} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Selisih antara nilai terbesar dan terkecil. Mudah dihitung tapi sensitif outlier.</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Minimum & Maximum</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border">
            <InlineMath math={'\\min(x)'} />
            <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">= nilai terkecil, </span>
            <InlineMath math={'\\max(x)'} />
            <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">= nilai terbesar</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Nilai ekstrem dalam dataset yang menunjukkan rentang data.</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">S.E. Mean (Standard Error)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border">
            <BlockMath math={'\\mathrm{SE}_{\\bar{x}} = \\dfrac{s}{\\sqrt{W}}'} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Estimasi standard deviation dari sampling distribution mean.</p>
        </div>
      </div>
    </HelpCard>

    <HelpCard title="Distribution" icon={Calculator} variant="default">
      <div className="space-y-4 mt-2">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Skewness (Kemencengan)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border">
            <BlockMath math={'g_1 = \\dfrac{W \\cdot M_3}{(W-1)(W-2) \\; s^3}'} />
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-500">SE(Skewness): <InlineMath math={'\\sqrt{\\tfrac{6 W (W-1)}{(W-2)(W+1)(W+3)}}'} /></div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Mengukur asimetri distribusi data:</p>
          <ul className="text-xs space-y-1 ml-4 text-slate-500 dark:text-slate-500">
            <li>• Skewness = 0: distribusi simetris</li>
            <li>• Skewness &gt; 0: ekor kanan lebih panjang (positively skewed)</li>
            <li>• Skewness &lt; 0: ekor kiri lebih panjang (negatively skewed)</li>
          </ul>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Kurtosis</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border">
            <BlockMath math={'g_2 = \\dfrac{W(W+1) M_4 - 3 M_2^2 (W-1)}{(W-1)(W-2)(W-3) \\; s^4}'} />
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-500">SE(Kurtosis): <InlineMath math={'\\sqrt{\\tfrac{4 (W^2 - 1) \\cdot (SE_{Skew})^2}{(W-3)(W+5)}}'} /></div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Mengukur ketajaman puncak distribusi:</p>
          <ul className="text-xs space-y-1 ml-4 text-slate-500 dark:text-slate-500">
            <li>• Kurtosis = 0: distribusi normal (mesokurtic)</li>
            <li>• Kurtosis &gt; 0: puncak lebih tajam (leptokurtic)</li>
            <li>• Kurtosis &lt; 0: puncak lebih datar (platykurtic)</li>
          </ul>
        </div>
      </div>
    </HelpCard>

    <HelpCard title="Display Order" icon={TrendingUp} variant="default">
      <div className="space-y-4 mt-2">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Variable list</h4>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Menampilkan hasil sesuai urutan variabel yang dipilih dalam analisis.</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Alphabetic</h4>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Mengurutkan hasil berdasarkan label/nama variabel secara alfabetis.</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Ascending means</h4>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Mengurutkan hasil berdasarkan nilai mean dari terkecil ke terbesar.</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Descending means</h4>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Mengurutkan hasil berdasarkan nilai mean dari terbesar ke terkecil.</p>
        </div>
      </div>
    </HelpCard>

    <HelpCard title="Visualisasi Data Deskriptif" icon={BarChart3} variant="default">
      <div className="space-y-4 mt-2">
        <HelpAlert variant="info" title="Fitur Visualisasi">
          <div className="text-sm space-y-2 mt-2">
            <p>
              Fitur visualisasi untuk analisis deskriptif sedang dalam tahap pengembangan. 
              Saat ini, Anda dapat melihat hasil statistik dalam bentuk tabel.
            </p>
            <p>
              Untuk visualisasi data, Anda dapat menggunakan fitur <strong>Explore</strong> 
              yang menyediakan histogram dan box plot untuk deteksi outlier.
            </p>
          </div>
        </HelpAlert>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Gunakan Analisis Explore</h4>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p><strong>Kegunaan:</strong> Menyediakan histogram dan box plot untuk visualisasi distribusi data</p>
            <p><strong>Akses:</strong> Melalui menu Analyze → Descriptive → Explore</p>
            <p><strong>Fitur:</strong> Deteksi outlier, uji normalitas, dan statistik deskriptif lengkap</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Export Data untuk Visualisasi External</h4>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p><strong>Format:</strong> Export hasil ke CSV atau Excel</p>
            <p><strong>Tools:</strong> Import ke software visualisasi seperti Excel, R, atau Python</p>
            <p><strong>Keunggulan:</strong> Fleksibilitas dalam membuat berbagai jenis grafik</p>
          </div>
        </div>
      </div>
    </HelpCard>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <HelpCard title="Outlier & Anomali" variant="default" icon={AlertTriangle}>
        <div className="text-sm space-y-2">
          <p>• <strong>Identifikasi outlier:</strong> Nilai yang jauh dari mean (biasanya &gt; 2-3 SD)</p>
          <p>• <strong>Dampak outlier:</strong> Dapat mempengaruhi mean dan standard deviation</p>
          <p>• <strong>Solusi:</strong> Gunakan analisis Explore untuk deteksi outlier yang lebih mendalam</p>
        </div>
      </HelpCard>
      
      <HelpCard title="Rekomendasi Pengaturan" variant="default" icon={Lightbulb}>
        <div className="text-sm space-y-2">
          <p>• <strong>Untuk eksplorasi awal:</strong> Aktifkan semua statistik yang tersedia</p>
          <p>• <strong>Untuk laporan:</strong> Pilih statistik yang relevan dan atur urutan tampilan</p>
          <p>• <strong>Untuk analisis lanjutan:</strong> Simpan standardized values untuk analisis berikutnya</p>
        </div>
      </HelpCard>
    </div>
  </div>
);
