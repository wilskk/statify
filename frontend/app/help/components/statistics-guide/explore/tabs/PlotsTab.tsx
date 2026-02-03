import React from 'react';
<<<<<<< HEAD
import { HelpCard, HelpAlert } from '@/app/help/ui/HelpLayout';
import { BarChart3 } from 'lucide-react';

export const PlotsTab = () => (
  <div className="space-y-6">
    <HelpCard title="Opsi Visualisasi Explore" icon={BarChart3} variant="feature">
      <div className="space-y-6 mt-2">
        <div className="space-y-3">
          <h4 className="font-medium text-sm border-b pb-1">Boxplots (Radio Group)</h4>
          <p className="text-sm text-muted-foreground">
            Pilih satu opsi boxplot untuk visualisasi distribusi dan outlier detection. 
            Dapat dikonfigurasi sebelum memilih variables.
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded">
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">None:</span>
                <p className="text-muted-foreground ml-2">Tidak menampilkan boxplot sama sekali</p>
              </div>
              <div>
                <span className="font-medium">Factor levels together:</span>
                <p className="text-muted-foreground ml-2">
                  Menampilkan boxplot per level factor variable dalam satu chart. 
                  Ideal untuk membandingkan distribusi antar kelompok.
                </p>
              </div>
              <div>
                <span className="font-medium">Dependents together:</span>
                <p className="text-muted-foreground ml-2">
                  Menampilkan semua dependent variables dalam satu boxplot chart. 
                  Berguna untuk membandingkan scale multiple variables.
                </p>
              </div>
              <div>
                <span className="font-medium">Dependents separately:</span>
                <p className="text-muted-foreground ml-2">
                  Membuat boxplot terpisah untuk setiap dependent variable. 
                  Optimal ketika variables memiliki scale berbeda.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-sm border-b pb-1">Descriptives (Individual Checkboxes)</h4>
          <div className="space-y-4">
            <div>
              <span className="font-medium text-sm">Stem-and-leaf (Checkbox):</span>
              <p className="text-sm text-muted-foreground mt-1">
                Menampilkan distribusi detail sambil mempertahankan nilai data aktual. 
                Berguna untuk dataset kecil-menengah untuk melihat pola dan nilai spesifik.
              </p>
            </div>
            <div>
              <span className="font-medium text-sm">Histogram (Checkbox):</span>
              <p className="text-sm text-muted-foreground mt-1">
                Menampilkan distribusi frekuensi untuk memahami bentuk (shape) dan pola data. 
                Dapat dikombinasikan dengan boxplot untuk analisis komprehensif.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm border-b pb-1">Normality Plots (Removed)</h4>
          <p className="text-sm text-muted-foreground">
            Opsi normality plots dengan tests telah dihapus dari UI modal sesuai requirement. 
            Focus pada descriptive plots yang tersedia: boxplots, stem-and-leaf, dan histogram.
          </p>
=======
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { BarChart3, TrendingUp, Layers } from 'lucide-react';

export const PlotsTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="Visualisasi untuk Analisis Explore">
      <p className="text-sm mt-2">
        Grafik dalam analisis Explore dirancang untuk memahami distribusi data, mengidentifikasi outlier, 
        dan membandingkan karakteristik antar kelompok dengan pendekatan visual yang robust.
      </p>
    </HelpAlert>

    <HelpCard title="Workflow Pemilihan Plot" icon={BarChart3} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Pilih Boxplot Option"
          description="Tentukan tampilan boxplot: none, factor levels together, dependents together, atau dependents separately."
        />
        <HelpStep
          number={2}
          title="Pilih Descriptive Plots"
          description="Tambahkan stem-and-leaf dan/atau histogram untuk analisis distribusi yang lebih detail."
        />
        <HelpStep
          number={3}
          title="Evaluasi Kombinasi"
          description="Pertimbangkan kombinasi plot yang memberikan insight komprehensif tentang data dan outliers."
        />
      </div>
    </HelpCard>

    <HelpCard title="Opsi Boxplots" icon={BarChart3} variant="feature">
      <div className="space-y-4 mt-2">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Boxplot adalah visualisasi utama dalam analisis Explore menggunakan Tukey's Hinges untuk outlier detection. 
          Pilih satu opsi sesuai tujuan analisis.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-900/20 rounded-lg border border-slate-200 dark:border-slate-800">
            <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">None</h4>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              Tidak menampilkan boxplot. Pilih ini jika hanya ingin fokus pada statistik numerik 
              tanpa representasi visual distribusi.
            </p>
          </div>
          
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Factor levels together</h4>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Menampilkan boxplot untuk setiap level factor variable dalam satu chart. 
              <strong>Ideal untuk:</strong> Membandingkan distribusi dependent variable antar kelompok kategori.
            </p>
          </div>
          
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">Dependents together</h4>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Menampilkan semua dependent variables dalam satu boxplot chart. 
              <strong>Ideal untuk:</strong> Membandingkan distribusi multiple variables dengan scale serupa.
            </p>
          </div>
          
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Dependents separately</h4>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Membuat boxplot terpisah untuk setiap dependent variable. 
              <strong>Ideal untuk:</strong> Variables dengan scale berbeda atau analisis detail per variable.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
          <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-2">Komponen Boxplot dalam Explore</h4>
          <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
            <li>• <strong>Box:</strong> Q1 hingga Q3 menggunakan Tukey's Hinges (bukan percentile)</li>
            <li>• <strong>Median line:</strong> Nilai tengah yang robust terhadap outlier</li>
            <li>• <strong>Whiskers:</strong> Extend hingga 1.5×IQR dari box edges</li>
            <li>• <strong>Outlier points:</strong> Nilai di luar whiskers (mild outliers)</li>
            <li>• <strong>Extreme outliers:</strong> Nilai di luar 3×IQR (extreme outliers)</li>
          </ul>
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        </div>
      </div>
    </HelpCard>

<<<<<<< HEAD
    <HelpAlert variant="tip" title="Panduan Pemilihan Plot untuk Explore Analysis">
      <div className="text-sm space-y-2 mt-2">
        <p>• <strong>Boxplots dengan Outliers:</strong> Ketika Statistics → Outliers diaktifkan, boxplot akan menampilkan outlier detection menggunakan Tukey's Hinges</p>
        <p>• <strong>Factor levels together:</strong> Terbaik untuk melihat perbedaan distribusi antar kelompok factor variable</p>
        <p>• <strong>Dependents separately:</strong> Ideal ketika dependent variables memiliki scale atau range yang sangat berbeda</p>
        <p>• <strong>Stem-and-leaf detail:</strong> Mempertahankan nilai eksak sambil menampilkan shape distribusi, baik untuk data dengan sample size moderat</p>
        <p>• <strong>Histogram interpretation:</strong> Bell curve = normal distribution, skewed = asymmetric distribution</p>
        <p>• <strong>Kombinasi optimal:</strong> Boxplot + Histogram memberikan comprehensive view tentang distribution shape dan outliers</p>
      </div>
    </HelpAlert>

    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">⚠</span>
        </div>
        <div>
          <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Interpretasi Plot dalam Konteks Explore</h3>
          <div className="text-sm space-y-2 text-amber-700 dark:text-amber-300">
            <p>• <strong>Boxplot outliers:</strong> Menggunakan Tukey's Hinges IQR, bukan percentile-based quartiles</p>
            <p>• <strong>Extreme values:</strong> Titik di luar whiskers menggunakan 1.5×IQR dan 3×IQR criteria</p>
            <p>• <strong>Robust statistics view:</strong> Median line di boxplot lebih reliable dibanding mean ketika ada outliers</p>
            <p>• <strong>Multiple dependent variables:</strong> Setiap variable diproses dengan ExamineCalculator secara independen</p>
            <p>• <strong>Factor grouping:</strong> Memungkinkan perbandingan robust statistics antar level kategori</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">💡</span>
        </div>
        <div>
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Tips Konfigurasi Plot Settings</h3>
          <div className="text-sm space-y-2 text-blue-700 dark:text-blue-300">
            <p>• <strong>Pre-configuration:</strong> Plot settings dapat dikonfigurasi sebelum memilih variables</p>
            <p>• <strong>Boxplot + Outliers:</strong> Kombinasi yang powerful untuk robust exploratory analysis</p>
            <p>• <strong>Factor analysis:</strong> "Factor levels together" + "Dependents separately" untuk detailed comparison</p>
            <p>• <strong>Large datasets:</strong> Histogram lebih informatif daripada stem-and-leaf untuk N &gt; 100</p>
            <p>• <strong>Small datasets:</strong> Stem-and-leaf mempertahankan individual values yang berguna untuk analisis detail</p>
          </div>
        </div>
      </div>
    </div>
=======
    <HelpCard title="Opsi Descriptive Plots" icon={TrendingUp} variant="feature">
      <div className="space-y-4 mt-2">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Checkbox individual untuk visualisasi yang memberikan insight mendalam tentang bentuk dan karakteristik distribusi data.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Stem-and-leaf</h4>
            <div className="space-y-2 text-xs text-blue-600 dark:text-blue-400">
              <p><strong>Fungsi:</strong> Menampilkan distribusi detail sambil mempertahankan nilai data aktual</p>
              <p><strong>Keunggulan:</strong> Dapat melihat exact values, pattern, dan clustering data</p>
              <p><strong>Ideal untuk:</strong> Dataset kecil-menengah (N &lt; 100) dengan range nilai terbatas</p>
              <p><strong>Interpretasi:</strong> Panjang baris menunjukkan frekuensi, digit leaf menunjukkan nilai aktual</p>
            </div>
          </div>
          
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">Histogram</h4>
            <div className="space-y-2 text-xs text-emerald-600 dark:text-emerald-400">
              <p><strong>Fungsi:</strong> Menampilkan distribusi frekuensi untuk memahami bentuk (shape) distribusi</p>
              <p><strong>Keunggulan:</strong> Jelas menunjukkan normality, skewness, modality, dan gaps</p>
              <p><strong>Ideal untuk:</strong> Semua ukuran dataset, terutama untuk assessment distribusi</p>
              <p><strong>Interpretasi:</strong> Bell curve = normal, skewed = asymmetric, multiple peaks = multimodal</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
          <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-2">Kombinasi Plot yang Efektif</h4>
          <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
            <li>• <strong>Boxplot + Histogram:</strong> Comprehensive view tentang distribution shape dan outliers</li>
            <li>• <strong>Stem-and-leaf + Boxplot:</strong> Detail values dengan robust summary statistics</li>
            <li>• <strong>Histogram untuk normality check:</strong> Sebelum menentukan statistical tests</li>
            <li>• <strong>Factor boxplots untuk group comparison:</strong> Identifikasi perbedaan distribusi antar kelompok</li>
          </ul>
        </div>
      </div>
    </HelpCard>

    <HelpCard title="Strategi Pemilihan Plot" icon={Layers} variant="step">
      <div className="space-y-4 mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h5 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-2">Data Exploration</h5>
            <ul className="text-xs space-y-1 text-blue-600 dark:text-blue-400">
              <li>• Start dengan Histogram untuk shape assessment</li>
              <li>• Add Boxplot untuk outlier identification</li>
              <li>• Gunakan Factor levels together jika ada grouping variable</li>
              <li>• Stem-and-leaf untuk dataset kecil dengan detail analysis</li>
            </ul>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <h5 className="font-medium text-sm text-emerald-800 dark:text-emerald-200 mb-2">Group Comparison</h5>
            <ul className="text-xs space-y-1 text-emerald-600 dark:text-emerald-400">
              <li>• Factor levels together untuk direct comparison</li>
              <li>• Histogram per group untuk distribution shape differences</li>
              <li>• Focus pada median differences di boxplots</li>
              <li>• Identify group-specific outlier patterns</li>
            </ul>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <h5 className="font-medium text-sm text-purple-800 dark:text-purple-200 mb-2">Multiple Variables</h5>
            <ul className="text-xs space-y-1 text-purple-600 dark:text-purple-400">
              <li>• Dependents separately jika scale sangat berbeda</li>
              <li>• Dependents together untuk comparison direct</li>
              <li>• Individual histograms untuk normality check</li>
              <li>• Consistent outlier patterns across variables</li>
            </ul>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <h5 className="font-medium text-sm text-amber-800 dark:text-amber-200 mb-2">Robust Analysis Focus</h5>
            <ul className="text-xs space-y-1 text-amber-600 dark:text-amber-400">
              <li>• Boxplot essential untuk Tukey outlier detection</li>
              <li>• Compare median vs trimmed mean positioning</li>
              <li>• Assess impact of outliers pada central tendency</li>
              <li>• Visual validation of M-estimator robustness</li>
            </ul>
          </div>
        </div>
      </div>
    </HelpCard>

    <HelpAlert variant="tip" title="Tips Visualisasi Explore">
      <div className="text-sm space-y-2 mt-2">
        <p>• <strong>Always include boxplot:</strong> Essential untuk Tukey outlier detection visual validation</p>
        <p>• <strong>Histogram for distribution shape:</strong> Membantu interpretasi robust vs classical statistics</p>
        <p>• <strong>Factor comparisons:</strong> Gunakan "factor levels together" untuk group analysis</p>
        <p>• <strong>Scale considerations:</strong> "Dependents separately" jika variables memiliki unit berbeda</p>
        <p>• <strong>Outlier focus:</strong> Kombinasi boxplot + stem-and-leaf untuk detailed outlier investigation</p>
      </div>
    </HelpAlert>

>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
  </div>
);