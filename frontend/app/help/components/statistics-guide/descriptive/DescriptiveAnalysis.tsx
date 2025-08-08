import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { Calculator, FileText, HelpCircle, TrendingUp, Table, BookOpen, Target, Database } from 'lucide-react';

// Tab content components for descriptive statistics
const OverviewTab = () => (
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

const VariablesTab = () => (
  <div className="space-y-6">
    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <Table className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Memilih Variabel</h3>
      </div>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
          <div>
            <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-1">Pilih Variabel</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Pilih satu atau lebih variabel numerik dari dataset Anda. Statistik deskriptif bekerja optimal dengan data kontinu.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
          <div>
            <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-1">Tambahkan ke Analisis</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Seret variabel ke kotak analisis atau gunakan tombol panah untuk menambahkannya ke analisis deskriptif Anda.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
          <div>
            <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-1">Opsi Standardized Values</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Centang "Save standardized values as variables" jika Anda ingin menyimpan nilai z-score sebagai variabel baru.</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Jenis Variabel yang Didukung</h3>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <h4 className="font-medium text-slate-800 dark:text-slate-200">✓ Variabel Numerik</h4>
            </div>
            <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
              <li>• Scale/Interval (umur, tinggi, berat)</li>
              <li>• Ratio (pendapatan, jarak, waktu)</li>
              <li>• Ordinal numerik (rating 1-10)</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <h4 className="font-medium text-slate-800 dark:text-slate-200">⚠ Perlu Perhatian</h4>
            </div>
            <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
              <li>• Ordinal kategorikal (rendah, sedang, tinggi)</li>
              <li>• Nominal dengan kode numerik</li>
              <li>• Data dengan banyak missing values</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">💡</span>
        </div>
        <div>
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Tips Pemilihan Variabel</h3>
          <div className="text-sm space-y-2 text-blue-700 dark:text-blue-300">
            <p>• <strong>Untuk analisis Descriptives:</strong> Gunakan variabel numerik kontinu</p>
            <p>• <strong>Untuk analisis Frequencies:</strong> Cocok untuk semua jenis variabel</p>
            <p>• <strong>Untuk analisis Examine:</strong> Ideal untuk eksplorasi data numerik dengan outlier detection</p>
            <p>• <strong>Untuk analisis Crosstabs:</strong> Gunakan variabel kategorikal</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <HelpCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Penanganan Missing Values</h3>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Sistem akan otomatis:</p>
        <ul className="text-sm space-y-1 ml-4 text-slate-600 dark:text-slate-400">
          <li>• Menghitung jumlah data valid dan missing</li>
          <li>• Mengecualikan missing values dari perhitungan statistik</li>
          <li>• Melaporkan persentase missing values</li>
          <li>• Memberikan peringatan jika missing values &gt; 50%</li>
        </ul>
      </div>
    </div>
  </div>
);

const StatisticsTab = () => (
  <div className="space-y-6">
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">i</span>
        </div>
        <div>
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Formula Matematika</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">Berikut adalah formula matematika untuk setiap statistik deskriptif yang dihitung oleh sistem.</p>
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
            x̄ = Σx / n
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Jumlah semua nilai dibagi dengan jumlah observasi. Sensitif terhadap outlier.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">Contoh: [2, 4, 6, 8, 10] → Mean = 30/5 = 6</p>
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Median</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border font-mono text-sm mb-2 text-slate-700 dark:text-slate-300">
            Median = nilai tengah dari data terurut
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Tidak terpengaruh outlier, cocok untuk data skewed.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">Contoh: [2, 4, 6, 8, 10] → Median = 6</p>
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Sum (Jumlah)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border font-mono text-sm mb-2 text-slate-700 dark:text-slate-300">
            Sum = Σx
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total dari semua nilai dalam dataset.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">Contoh: [2, 4, 6, 8, 10] → Sum = 30</p>
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
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border font-mono text-sm mb-2 text-slate-700 dark:text-slate-300">
            σ = √(Σ(x - x̄)² / n)
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Mengukur rata-rata jarak data dari mean. Semakin besar nilai, semakin tersebar data.</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">Interpretasi: ~68% data dalam 1 SD, ~95% dalam 2 SD dari mean</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Variance (Varians)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border font-mono text-sm mb-2 text-slate-700 dark:text-slate-300">
            σ² = Σ(x - x̄)² / n
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Kuadrat dari standard deviation. Mengukur variabilitas data.</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Range</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border font-mono text-sm mb-2 text-slate-700 dark:text-slate-300">
            Range = Max - Min
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Selisih antara nilai terbesar dan terkecil. Mudah dihitung tapi sensitif outlier.</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Minimum & Maximum</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border font-mono text-sm mb-2 text-slate-700 dark:text-slate-300">
            Min = nilai terkecil, Max = nilai terbesar
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Nilai ekstrem dalam dataset yang menunjukkan rentang data.</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">S.E. Mean (Standard Error)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border font-mono text-sm mb-2 text-slate-700 dark:text-slate-300">
            SE = σ / √n
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Estimasi standard deviation dari sampling distribution mean.</p>
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
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border font-mono text-sm mb-2 text-slate-700 dark:text-slate-300">
            Skew = Σ((x - x̄)/σ)³ / n
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Mengukur asimetri distribusi data:</p>
          <ul className="text-xs space-y-1 ml-4 text-slate-500 dark:text-slate-500">
            <li>• Skewness = 0: distribusi simetris</li>
            <li>• Skewness &gt; 0: ekor kanan lebih panjang (positively skewed)</li>
            <li>• Skewness &lt; 0: ekor kiri lebih panjang (negatively skewed)</li>
          </ul>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Kurtosis</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border font-mono text-sm mb-2 text-slate-700 dark:text-slate-300">
            Kurt = Σ((x - x̄)/σ)⁴ / n - 3
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Mengukur ketajaman puncak distribusi:</p>
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
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Display Order</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Variable list</h4>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Menampilkan hasil sesuai urutan variabel yang dipilih dalam analisis.</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Alphabetic</h4>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Mengurutkan hasil berdasarkan nama variabel secara alfabetis.</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Ascending means</h4>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Mengurutkan hasil berdasarkan nilai mean dari terkecil ke terbesar.</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Descending means</h4>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Mengurutkan hasil berdasarkan nilai mean dari terbesar ke terkecil.</p>
        </div>
      </div>
    </div>

    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">⚠</span>
        </div>
        <div>
          <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Outlier & Anomali</h3>
          <div className="text-sm space-y-2 text-amber-700 dark:text-amber-300">
            <p>• <strong>Identifikasi outlier:</strong> Nilai yang jauh dari mean (biasanya &gt; 2-3 SD)</p>
            <p>• <strong>Dampak outlier:</strong> Dapat mempengaruhi mean dan standard deviation</p>
            <p>• <strong>Solusi:</strong> Gunakan median dan IQR untuk data dengan outlier</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">📊</span>
        </div>
        <div>
          <h3 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Tips Analisis Lanjutan</h3>
          <ul className="text-sm space-y-2 text-purple-700 dark:text-purple-300">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Transformasi data untuk normalisasi distribusi</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Analisis korelasi antar variabel</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Uji normalitas untuk analisis parametrik</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>M-Estimators dan robust statistics</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">💡</span>
        </div>
        <div>
          <h3 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">Rekomendasi Pengaturan</h3>
          <div className="text-sm space-y-2 text-emerald-700 dark:text-emerald-300">
            <p>• <strong>Untuk eksplorasi awal:</strong> Aktifkan semua statistik yang tersedia</p>
            <p>• <strong>Untuk laporan:</strong> Pilih statistik yang relevan dan atur urutan tampilan</p>
            <p>• <strong>Untuk analisis lanjutan:</strong> Simpan standardized values untuk analisis berikutnya</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Quick Start Guide Component
const QuickStartGuide = () => (
  <div className="space-y-6">
    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800">
      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">Panduan Cepat: Analisis Deskriptif</h3>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Pilih Variabel</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">Seret variabel numerik dari panel kiri ke kotak analisis.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Pilih Statistik</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">Tentukan statistik mana yang ingin ditampilkan dalam hasil.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Jalankan Analisis</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">Klik tombol OK untuk menjalankan analisis dan melihat hasil.</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">Interpretasi Hasil</h3>
      <div className="space-y-3">
        <div className="p-3 bg-white dark:bg-slate-700 rounded border">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Tendensi Sentral</h4>
          <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
            <li>• <strong>Mean:</strong> Rata-rata aritmatika, sensitif terhadap outlier</li>
            <li>• <strong>Median:</strong> Nilai tengah, robust terhadap outlier</li>
            <li>• <strong>Sum:</strong> Total keseluruhan nilai dalam dataset</li>
          </ul>
        </div>
        <div className="p-3 bg-white dark:bg-slate-700 rounded border">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Sebaran Data</h4>
          <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
            <li>• <strong>Standard Deviation:</strong> Ukuran penyebaran rata-rata dari mean</li>
            <li>• <strong>Variance:</strong> Kuadrat dari standard deviation</li>
            <li>• <strong>Range:</strong> Selisih antara nilai maksimum dan minimum</li>
          </ul>
        </div>
        <div className="p-3 bg-white dark:bg-slate-700 rounded border">
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

// Main component
export const DescriptiveAnalysis = () => {
  const [activeTab, setActiveTab] = useState('variables');

  const tabConfig = [
    {
      id: 'overview',
      label: 'Ringkasan',
      icon: BookOpen,
      component: OverviewTab
    },
    {
      id: 'variables',
      label: 'Variabel',
      icon: Database,
      component: VariablesTab
    },
    {
      id: 'statistics',
      label: 'Statistik',
      icon: Calculator,
      component: StatisticsTab
    }
  ];

  return (
    <div className="w-full space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Panduan Analisis Deskriptif</h1>
        <p className="text-muted-foreground">
          Pelajari cara melakukan analisis statistik deskriptif untuk memahami karakteristik data Anda
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {tabConfig.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabConfig.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            <tab.component />
          </TabsContent>
        ))}
      </Tabs>

      <QuickStartGuide />
    </div>
  );
};

export default DescriptiveAnalysis;
