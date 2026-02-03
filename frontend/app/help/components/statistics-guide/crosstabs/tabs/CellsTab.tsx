import React from 'react';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { Table, Calculator, BarChart3, EyeOff } from 'lucide-react';
import 'katex/dist/katex.min.css';
<<<<<<< HEAD
import { BlockMath, InlineMath } from 'react-katex';

export const CellsTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="CrosstabsCalculator Cell Configuration">
      <p className="text-sm mt-2">
        CellsTab mengonfigurasi display options untuk tabel kontingensi yang dihasilkan CrosstabsCalculator. 
        Setiap opsi menentukan statistik mana yang ditampilkan dalam setiap cell: observed/expected counts, 
        percentages, dan residuals dengan precise rounding sesuai SPSS standards.
      </p>
    </HelpAlert>

    <HelpCard title="Counts Section (Observed & Expected)" icon={Table} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Observed Counts (Checkbox)"
          description="Menampilkan frequency aktual (count) dalam setiap cell. Ini adalah data asli yang weighted dengan case weights."
        />
        <HelpStep
          number={2}
          title="Expected Counts (Checkbox)"
          description="Expected = (row total × column total) / grand total. Rounded to 1 decimal place untuk display, exact untuk computations."
        />
        <HelpStep
          number={3}
          title="Hide Small Counts (Checkbox + Threshold)"
          description="Menyembunyikan cells dengan observed count < threshold. Input field untuk threshold value (disabled jika checkbox unchecked)."
=======
import { BlockMath } from 'react-katex';

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
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        />
      </div>
    </HelpCard>

<<<<<<< HEAD
    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Expected Count Computation Logic</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Expected Count Formula</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'E_{ij} = \\dfrac{\\text{rowTotals}[i] \\times \\text{colTotals}[j]}{W}'} />
            <div className="text-sm text-slate-700 dark:text-slate-300 mt-2">
              <p><strong>Where:</strong></p>
              <p>• <InlineMath math={'E_{ij}'} /> = Expected count for cell (i,j)</p>
              <p>• <InlineMath math={'W'} /> = Grand total (sum of all valid weights)</p>
              <p>• Weighted computation menggunakan case weights jika available</p>
=======
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
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
            </div>
          </div>
        </div>

<<<<<<< HEAD
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2 mb-3">
            <EyeOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="font-medium text-emerald-800 dark:text-emerald-200">Rounding dan Display Logic</h4>
          </div>
          <div className="text-sm space-y-2 text-emerald-700 dark:text-emerald-300">
            <p>• <strong>Expected display:</strong> toSPSSFixed(expected, 1) - rounded to 1 decimal</p>
            <p>• <strong>Computation:</strong> Menggunakan exact expected value untuk residual calculations</p>
            <p>• <strong>Hide small counts:</strong> Threshold comparison menggunakan observed count</p>
            <p>• <strong>Weight adjustment:</strong> Non-integer weights bisa di-round/truncate di cell level</p>
          </div>
        </div>
      </div>
    </div>
    <HelpCard title="Percentages Section (UI Modal Options)" icon={BarChart3} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="% within Row Variable (Checkbox)"
          description="Persentase setiap cell terhadap row total. Label di UI: '% within [Row Variable Name]' dinamis berdasarkan variable selection."
        />
        <HelpStep
          number={2}
          title="% within Column Variable (Checkbox)"
          description="Persentase setiap cell terhadap column total. Label di UI: '% within [Column Variable Name]' dinamis berdasarkan variable selection."
        />
        <HelpStep
          number={3}
          title="% of Total (Checkbox)"
          description="Persentase setiap cell terhadap grand total. Fixed label karena tidak tergantung variable names."
        />
      </div>
    </HelpCard>

    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">CrosstabsCalculator Percentage Formulas</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Row Percentages (% within Row Variable)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'\\text{rowPct}_{ij} = \\dfrac{\\text{observed}_{ij}}{\\text{rowTotals}[i]} \\times 100'} />
            <div className="text-sm text-slate-700 dark:text-slate-300 mt-2">
              <p>• Weighted: cell weights / row total weights × 100</p>
              <p>• Display: toSPSSFixed(rowPct, 1) - rounded to 1 decimal place</p>
              <p>• UI Label: "% within [rowVariable.name]" - dinamis dari variable selection</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Column Percentages (% within Column Variable)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'\\text{colPct}_{ij} = \\dfrac{\\text{observed}_{ij}}{\\text{colTotals}[j]} \\times 100'} />
            <div className="text-sm text-slate-700 dark:text-slate-300 mt-2">
              <p>• Weighted: cell weights / column total weights × 100</p>
              <p>• Display: toSPSSFixed(colPct, 1) - rounded to 1 decimal place</p>
              <p>• UI Label: "% within [columnVariable.name]" - dinamis dari variable selection</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Total Percentages (% of Total)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'\\text{totalPct}_{ij} = \\dfrac{\\text{observed}_{ij}}{W} \\times 100'} />
            <div className="text-sm text-slate-700 dark:text-slate-300 mt-2">
              <p>• <InlineMath math={'W'} /> = Grand total (sum of all valid weights)</p>
              <p>• Display: toSPSSFixed(totalPct, 1) - rounded to 1 decimal place</p>
              <p>• UI Label: "% of Total" - fixed label, tidak tergantung variable names</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="font-medium text-indigo-800 dark:text-indigo-200">Weight Handling dalam Percentages</h4>
          </div>
          <div className="text-sm space-y-2 text-indigo-700 dark:text-indigo-300">
            <p>• <strong>No weights:</strong> Simple division, frequencies as counts</p>
            <p>• <strong>With weights:</strong> Weighted totals untuk denominators</p>
            <p>• <strong>Precision:</strong> All percentages rounded dengan toSPSSFixed(value, 1)</p>
            <p>• <strong>Missing values:</strong> Excluded from totals sesuai checkIsMissing() logic</p>
          </div>
        </div>
      </div>
    </div>

    <HelpCard title="Residuals Section (Statistical Analysis)" icon={Calculator} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Unstandardized Residual (Checkbox)"
          description="Raw difference: Observed - Expected. Shows magnitude but tidak standardized untuk comparison across cells."
        />
        <HelpStep
          number={2}
          title="Standardized Residual (Checkbox)"
          description="Z-score-like statistic: (O-E)/√E. Values > |2| mengindikasikan significant deviation dari independence."
        />
        <HelpStep
          number={3}
          title="Adjusted Residual (Checkbox)"
          description="Adjusted untuk marginal totals: (O-E)/√(E×(1-rowProp)×(1-colProp)). Most accurate untuk interpreting significance."
        />
      </div>
    </HelpCard>

    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">CrosstabsCalculator Residual Formulas</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Unstandardized Residual</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'\\text{unstandardized}_{ij} = \\text{observed}_{ij} - \\text{expected}_{ij}'} />
            <div className="text-sm text-slate-700 dark:text-slate-300 mt-2">
              <p>• Raw difference between observed dan expected counts</p>
              <p>• Positive: lebih tinggi dari expected, Negative: lebih rendah dari expected</p>
              <p>• Display: toSPSSFixed(residual, 1) - rounded to 1 decimal place</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Standardized Residual</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'\\text{standardized}_{ij} = \\dfrac{\\text{observed}_{ij} - \\text{expected}_{ij}}{\\sqrt{\\text{expected}_{ij}}}'} />
            <div className="text-sm text-slate-700 dark:text-slate-300 mt-2">
              <p>• Z-score-like statistic untuk comparing across cells</p>
              <p>• Values &gt; |2.0| indicate significant deviation dari independence assumption</p>
              <p>• Display: toSPSSFixed(stdResidual, 1) - rounded to 1 decimal place</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Adjusted Residual</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'\\text{adjusted}_{ij} = \\dfrac{\\text{standardized}_{ij}}{\\sqrt{(1 - \\text{rowProp}_i) \\times (1 - \\text{colProp}_j)}}'} />
            <div className="text-sm text-slate-700 dark:text-slate-300 mt-2">
              <p>• <InlineMath math={'\\text{rowProp}_i = \\text{rowTotals}[i] / W'} /></p>
              <p>• <InlineMath math={'\\text{colProp}_j = \\text{colTotals}[j] / W'} /></p>
              <p>• Follows standard normal distribution under independence</p>
              <p>• Values &gt; |1.96| significant at α = 0.05 level</p>
              <p>• Display: toSPSSFixed(adjResidual, 1) - rounded to 1 decimal place</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-teal-200 dark:border-teal-800">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h4 className="font-medium text-teal-800 dark:text-teal-200">Residual Interpretation Guide</h4>
          </div>
          <div className="text-sm space-y-2 text-teal-700 dark:text-teal-300">
            <p>• <strong>Unstandardized:</strong> Shows raw magnitude of deviation</p>
            <p>• <strong>Standardized:</strong> Comparable across cells, |value| &gt; 2 suggests significance</p>
            <p>• <strong>Adjusted:</strong> Most accurate untuk hypothesis testing, distribusi normal standar</p>
            <p>• <strong>Weighted data:</strong> All calculations account untuk case weights properly</p>
            <p>• <strong>SPSS compatibility:</strong> Exact formulas matching SPSS CROSSTABS procedure</p>
          </div>
        </div>
      </div>
    </div>

    <HelpAlert variant="tip" title="CellsTab UI Configuration Summary">
      <div className="text-sm space-y-2 mt-2">
        <p>
          <strong>Counts Options:</strong> Observed (default ON), Expected (default OFF), Hide Small Counts (default OFF dengan threshold)
        </p>
        <p>
          <strong>Percentages Options:</strong> Row/Column labels dinamis berdasarkan variable names, Total percentage fixed label
        </p>
        <p>
          <strong>Residuals Options:</strong> All three types available dengan precise SPSS-compatible formulas dan rounding
        </p>
        <p>
          <strong>Weight Awareness:</strong> Semua calculations properly handle weighted data sesuai CrosstabsCalculator implementation
        </p>
        <p>
          <strong>Display Precision:</strong> Consistent toSPSSFixed(value, 1) rounding untuk semua statistics dalam tabel output
        </p>
=======
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
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
      </div>
    </HelpAlert>
  </div>
);
