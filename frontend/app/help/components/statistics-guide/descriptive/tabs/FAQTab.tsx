import React from 'react';
import { HelpCircle, MessageCircle, AlertCircle, CheckCircle, Info, BookOpen } from 'lucide-react';

export const FAQTab = () => (
  <div className="space-y-6">
    <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-lg border border-indigo-200 dark:border-indigo-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
          <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">Frequently Asked Questions</h3>
      </div>
      <p className="text-sm text-indigo-800 dark:text-indigo-200">
        Jawaban untuk pertanyaan yang sering ditanyakan tentang analisis statistik deskriptif.
      </p>
    </div>

    {/* Basic Questions */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
        🔰 Pertanyaan Dasar
      </h3>

      <div className="space-y-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <MessageCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                Kapan sebaiknya menggunakan mean vs median?
              </h4>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  <strong>Gunakan Mean ketika:</strong>
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 mb-3">
                  <li>• Data terdistribusi normal atau mendekati normal</li>
                  <li>• Tidak ada outlier yang signifikan</li>
                  <li>• Anda membutuhkan all data points untuk dipertimbangkan</li>
                  <li>• Untuk kalkulasi statistik lanjutan (seperti standard deviation)</li>
                </ul>
                <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-2">
                  <strong>Gunakan Median ketika:</strong>
                </p>
                <ul className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
                  <li>• Data skewed (tidak simetris)</li>
                  <li>• Ada outlier yang ekstrem</li>
                  <li>• Data ordinal</li>
                  <li>• Anda butuh robust measure of central tendency</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <MessageCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                Apa perbedaan antara population dan sample statistics?
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                  <p className="font-medium text-purple-800 dark:text-purple-200 mb-2">Population Statistics:</p>
                  <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                    <li>• Parameter (μ, σ, N)</li>
                    <li>• Seluruh data populasi</li>
                    <li>• Nilai exact/true</li>
                    <li>• Variance: Σ(x-μ)²/N</li>
                  </ul>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                  <p className="font-medium text-green-800 dark:text-green-200 mb-2">Sample Statistics:</p>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• Statistic (x̄, s, n)</li>
                    <li>• Subset dari populasi</li>
                    <li>• Estimasi dari parameter</li>
                    <li>• Variance: Σ(x-x̄)²/(n-1)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <MessageCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                Bagaimana cara menginterpretasi standard deviation?
              </h4>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                  Standard deviation mengukur seberapa jauh data tersebar dari rata-rata:
                </p>
                <div className="space-y-2">
                  <div className="p-2 bg-white dark:bg-green-800/20 rounded">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">SD Kecil (data terkumpul):</p>
                    <p className="text-xs text-green-600 dark:text-green-400">Sebagian besar data dekat dengan mean, variabilitas rendah</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-green-800/20 rounded">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">SD Besar (data tersebar):</p>
                    <p className="text-xs text-green-600 dark:text-green-400">Data lebih bervariasi, tersebar jauh dari mean</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-green-800/20 rounded">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Rule of Thumb (Normal Distribution):</p>
                    <p className="text-xs text-green-600 dark:text-green-400">~68% data dalam 1 SD, ~95% dalam 2 SD, ~99.7% dalam 3 SD</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Technical Questions */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
        ⚙️ Pertanyaan Teknis
      </h3>

      <div className="space-y-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                Bagaimana menangani missing values dalam analisis deskriptif?
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                  <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">Strategi Penanganan:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">1. Listwise Deletion:</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">Hapus seluruh baris dengan missing values</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">2. Pairwise Deletion:</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">Gunakan data available untuk setiap statistik</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">3. Imputation:</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">Isi dengan mean, median, atau nilai prediksi</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">4. Reporting:</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">Selalu laporkan jumlah missing values</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                Kapan hasil statistik deskriptif tidak reliable?
              </h4>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                  <strong>Warning Signs:</strong>
                </p>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  <li>• <strong>Sample size terlalu kecil</strong> (&lt; 30 untuk most cases)</li>
                  <li>• <strong>Missing values &gt; 50%</strong> dari total data</li>
                  <li>• <strong>Extreme outliers</strong> yang mendominasi distribusi</li>
                  <li>• <strong>Data tidak representative</strong> dari populasi target</li>
                  <li>• <strong>Measurement error</strong> yang sistematis</li>
                  <li>• <strong>Mixed data types</strong> dalam satu variabel</li>
                  <li>• <strong>Temporal inconsistency</strong> dalam data collection</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <Info className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                Bagaimana memilih level of precision untuk reporting?
              </h4>
              <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded border border-cyan-200 dark:border-cyan-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-cyan-800 dark:text-cyan-200 mb-2">Guidelines:</p>
                    <ul className="text-sm text-cyan-700 dark:text-cyan-300 space-y-1">
                      <li>• <strong>Mean/Median:</strong> 1-2 decimal places</li>
                      <li>• <strong>Standard Deviation:</strong> 2-3 decimal places</li>
                      <li>• <strong>Percentages:</strong> 1 decimal place</li>
                      <li>• <strong>Large numbers:</strong> Round to meaningful units</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-cyan-800 dark:text-cyan-200 mb-2">Prinsip:</p>
                    <ul className="text-sm text-cyan-700 dark:text-cyan-300 space-y-1">
                      <li>• Jangan lebih presisi dari data input</li>
                      <li>• Konsisten dalam satu laporan</li>
                      <li>• Pertimbangkan audience expertise</li>
                      <li>• Practical significance over statistical precision</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Application Questions */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
        🎯 Pertanyaan Aplikasi
      </h3>

      <div className="space-y-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                Statistik mana yang paling penting untuk business reporting?
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded border border-emerald-200 dark:border-emerald-800">
                  <p className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">Essential Metrics:</p>
                  <ul className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
                    <li>• <strong>Mean:</strong> Average performance</li>
                    <li>• <strong>Median:</strong> Typical value (robust)</li>
                    <li>• <strong>Standard Deviation:</strong> Variability/risk</li>
                    <li>• <strong>Min/Max:</strong> Range of outcomes</li>
                  </ul>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                  <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">Context-Specific:</p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• <strong>Percentiles:</strong> Performance benchmarks</li>
                    <li>• <strong>Coefficient of Variation:</strong> Relative risk</li>
                    <li>• <strong>Skewness:</strong> Distribution shape</li>
                    <li>• <strong>Count/Valid N:</strong> Data quality</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                Bagaimana membandingkan dua atau lebih grup?
              </h4>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  <strong>Strategi Perbandingan:</strong>
                </p>
                <div className="space-y-2">
                  <div className="p-2 bg-white dark:bg-blue-800/20 rounded">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">1. Central Tendency:</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Bandingkan mean/median antar grup</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-blue-800/20 rounded">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">2. Variability:</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Gunakan Coefficient of Variation untuk fair comparison</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-blue-800/20 rounded">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">3. Distribution Shape:</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Periksa skewness dan kurtosis</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-blue-800/20 rounded">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">4. Practical Significance:</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Fokus pada magnitude of difference, bukan hanya statistical</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Quick Reference */}
    <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-4">
        <BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Quick Reference</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 rounded border">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">📊 Choosing Statistics</h4>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <li>• Normal data: Mean ± SD</li>
            <li>• Skewed data: Median + IQR</li>
            <li>• Categorical: Mode + Frequency</li>
            <li>• With outliers: Robust statistics</li>
          </ul>
        </div>
        
        <div className="p-3 bg-white dark:bg-slate-800 rounded border">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">⚠️ Red Flags</h4>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <li>• Mean ≠ Median (skewness)</li>
            <li>• High CV (&gt;50%)</li>
            <li>• |Skewness| &gt; 2</li>
            <li>• Many missing values</li>
          </ul>
        </div>
        
        <div className="p-3 bg-white dark:bg-slate-800 rounded border">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">💡 Best Practices</h4>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <li>• Always visualize data first</li>
            <li>• Check assumptions</li>
            <li>• Report sample size</li>
            <li>• Document methodology</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);
