import React from 'react';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { Table, Calculator, BarChart3, EyeOff } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

export const CellsTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="Konfigurasi Cell untuk Analisis Crosstabs">
      <p className="text-sm mt-2">
        CellsTab mengonfigurasi statistik yang ditampilkan dalam setiap cell tabel kontingensi. 
        Pilih kombinasi counts, percentages, dan residuals sesuai kebutuhan analisis dan interpretasi.
      </p>
    </HelpAlert>

    <HelpCard title="Workflow Konfigurasi Cell" icon={Table} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Pilih Counts"
          description="Tentukan jenis count yang ingin ditampilkan: observed (actual), expected (theoretical), atau keduanya."
        />
        <HelpStep
          number={2}
          title="Pilih Percentages"
          description="Pilih jenis persentase: within row, within column, atau total percentage untuk interpretasi yang berbeda."
        />
        <HelpStep
          number={3}
          title="Pilih Residuals"
          description="Tambahkan residual analysis untuk mengevaluasi deviasi dari independence hypothesis."
        />
      </div>
    </HelpCard>

    <HelpCard title="Opsi Counts" icon={Table} variant="feature">
      <div className="space-y-4 mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Table className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Observed Counts</span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
              Menampilkan frekuensi aktual dalam setiap cell
            </p>
            <ul className="text-xs space-y-1 text-blue-600 dark:text-blue-400">
              <li>• Data asli yang weighted dengan case weights</li>
              <li>• Default: ON (selalu ditampilkan)</li>
              <li>• Essential untuk interpretasi basic</li>
            </ul>
          </div>
          
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Expected Counts</span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">
              Expected = (row total × column total) / grand total
            </p>
            <ul className="text-xs space-y-1 text-emerald-600 dark:text-emerald-400">
              <li>• Theoretical frequency under independence</li>
              <li>• Rounded to 1 decimal place untuk display</li>
              <li>• Penting untuk Chi-square analysis</li>
            </ul>
          </div>
        </div>
        
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-2">
            <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Hide Small Counts</span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Menyembunyikan cells dengan observed count kurang dari threshold yang ditentukan. 
            Berguna untuk menyembunyikan kategori dengan frekuensi sangat rendah.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
          <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-2">Expected Count Formula</h4>
          <BlockMath math={'E_{ij} = \\dfrac{\\text{rowTotals}[i] \\times \\text{colTotals}[j]}{W}'} />
          <div className="text-xs text-slate-700 dark:text-slate-300 mt-2">
            <p><strong>Where:</strong> E<sub>ij</sub> = Expected count, W = Grand total</p>
          </div>
        </div>
      </div>
    </HelpCard>
    <HelpCard title="Opsi Percentages" icon={BarChart3} variant="feature">
      <div className="space-y-4 mt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">% within Row</span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
              Persentase setiap cell terhadap row total
            </p>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              <p><strong>Formula:</strong></p>
              <p>cell / row_total × 100</p>
              <p><strong>Label UI:</strong> Dinamis berdasarkan variable name</p>
            </div>
          </div>
          
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">% within Column</span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">
              Persentase setiap cell terhadap column total
            </p>
            <div className="text-xs text-emerald-600 dark:text-emerald-400">
              <p><strong>Formula:</strong></p>
              <p>cell / column_total × 100</p>
              <p><strong>Label UI:</strong> Dinamis berdasarkan variable name</p>
            </div>
          </div>
          
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">% of Total</span>
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">
              Persentase setiap cell terhadap grand total
            </p>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              <p><strong>Formula:</strong></p>
              <p>cell / grand_total × 100</p>
              <p><strong>Label UI:</strong> Fixed "% of Total"</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
          <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-2">Percentage Formulas</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <p><strong>Row %:</strong></p>
              <BlockMath math={'\\dfrac{O_{ij}}{\\text{rowTotals}[i]} \\times 100'} />
            </div>
            <div>
              <p><strong>Column %:</strong></p>
              <BlockMath math={'\\dfrac{O_{ij}}{\\text{colTotals}[j]} \\times 100'} />
            </div>
            <div>
              <p><strong>Total %:</strong></p>
              <BlockMath math={'\\dfrac{O_{ij}}{W} \\times 100'} />
            </div>
          </div>
        </div>
      </div>
    </HelpCard>

    <HelpCard title="Opsi Residuals" icon={Calculator} variant="feature">
      <div className="space-y-4 mt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Unstandardized</span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
              Raw difference: Observed - Expected
            </p>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              <p><strong>Use case:</strong> Shows magnitude</p>
              <p><strong>Interpretation:</strong> Absolute deviation</p>
            </div>
          </div>
          
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Standardized</span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">
              Z-score-like: (O-E)/√E
            </p>
            <div className="text-xs text-emerald-600 dark:text-emerald-400">
              <p><strong>Use case:</strong> Cross-cell comparison</p>
              <p><strong>Interpretation:</strong> |value| &gt; 2 significant</p>
            </div>
          </div>
          
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Adjusted</span>
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">
              Adjusted for marginal totals
            </p>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              <p><strong>Use case:</strong> Most accurate testing</p>
              <p><strong>Interpretation:</strong> |value| &gt; 1.96 significant</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
          <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-2">Residual Formulas</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <p><strong>Unstandardized:</strong></p>
              <BlockMath math={'O_{ij} - E_{ij}'} />
            </div>
            <div>
              <p><strong>Standardized:</strong></p>
              <BlockMath math={'\\dfrac{O_{ij} - E_{ij}}{\\sqrt{E_{ij}}}'} />
            </div>
            <div>
              <p><strong>Adjusted:</strong></p>
              <BlockMath math={'\\dfrac{\\text{std}_{ij}}{\\sqrt{(1-r_i)(1-c_j)}}'} />
            </div>
          </div>
        </div>
      </div>
    </HelpCard>

    <HelpAlert variant="tip" title="Tips Konfigurasi Cell Display">
      <div className="text-sm space-y-2 mt-2">
        <p><strong>Basic analysis:</strong> Observed counts + Row percentages untuk interpretasi dasar</p>
        <p><strong>Chi-square test:</strong> Tambahkan Expected counts untuk melihat theoretical vs actual</p>
        <p><strong>Advanced analysis:</strong> Gunakan Adjusted residuals untuk mengidentifikasi cell yang berkontribusi signifikan</p>
        <p><strong>Presentation:</strong> Pilih 2-3 statistik saja untuk menghindari tabel yang terlalu kompleks</p>
      </div>
    </HelpAlert>
  </div>
);
