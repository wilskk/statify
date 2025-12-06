import React from 'react';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { Table, Database, CheckSquare, AlertTriangle, Lightbulb } from 'lucide-react';

export const VariablesTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="Apa itu Crosstabs Analysis?">
      <p className="text-sm mt-2">
        Analisis Crosstabs menggunakan <strong>CrosstabsCalculator</strong> untuk membuat tabel kontingensi 
        dengan dukungan weighted computation, date string conversion, dan berbagai residual statistics. 
        Sistem otomatis mengurutkan kategori dan menangani missing values sesuai SPSS standards.
      </p>
    </HelpAlert>

    <HelpCard title="Memilih Row dan Column Variables" icon={Table} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Row(s) Variables"
          description="Drag variables ke Row(s) list untuk tabel kontingensi. Dapat berupa semua tipe: NUMERIC, STRING, DATE."
        />
        <HelpStep
          number={2}
          title="Column(s) Variables"
          description="Drag variables ke Column(s) list. Sistem akan membuat tabel untuk setiap kombinasi row-column."
        />
        <HelpStep
          number={3}
          title="Automatic Processing"
          description="CrosstabsCalculator otomatis mendeteksi date strings, mengurutkan kategori, dan menangani missing values."
        />
      </div>
    </HelpCard>

    <HelpCard title="Tipe Data yang Didukung" icon={Database} variant="feature">
      <div className="space-y-4 mt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">NUMERIC</span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">
              Nilai numerik yang akan dikategorikan sesuai unique values
            </p>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 space-y-1">
              <p><strong>Processing:</strong></p>
              <p>• Automatic sorting: numeric values sorted numerically</p>
              <p>• Missing values: berdasarkan variable.missing definitions</p>
              <p>• Weighted computation: mendukung case weights untuk survey data</p>
              <p>• <strong>Contoh:</strong> Kode kategori (1,2,3), Rating (1-5), Group numbers</p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">STRING</span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
              Text categories dengan natural sorting menggunakan localeCompare
            </p>
            <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
              <p><strong>Processing:</strong></p>
              <p>• Automatic sorting: alphabetical dengan numeric handling</p>
              <p>• Case sensitive: "Male" ≠ "male" (perhatikan konsistensi)</p>
              <p>• Missing values: berdasarkan exact string match di variable.missing</p>
              <p>• <strong>Contoh:</strong> Gender ("Male","Female"), Cities, Product categories</p>
            </div>
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">DATE (Special)</span>
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">
              Date strings "dd-mm-yyyy" otomatis dikonversi ke SPSS seconds untuk sorting
            </p>
            <div className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
              <p><strong>Special Processing:</strong></p>
              <p>• Detection: isDateString() mengecek format "dd-mm-yyyy"</p>
              <p>• Conversion: dateStringToSpssSeconds() untuk internal computation</p>
              <p>• Display: spssSecondsToDateString() untuk output kategori</p>
              <p>• <strong>Contoh:</strong> "01-01-2023", "15-06-2024" → sorted chronologically</p>
            </div>
          </div>
        </div>
      </div>
    </HelpCard>

    <HelpCard title="Missing Value Handling" icon={AlertTriangle} variant="default">
      <div className="space-y-3 mt-2">
        <div className="text-sm space-y-2 text-slate-700 dark:text-slate-300">
          <p>• <strong>checkIsMissing():</strong> Variable-specific missing value definitions digunakan</p>
          <p>• <strong>Valid vs Missing Weight:</strong> Computed separately untuk case processing summary</p>
          <p>• <strong>Exclusion:</strong> Cases dengan missing di row OR column variable dikecualikan</p>
          <p>• <strong>Weight adjustment:</strong> Non-integer weights dapat diatur dengan roundCase/truncateCase</p>
        </div>
      </div>
    </HelpCard>

    <HelpCard title="Tips Variable Selection untuk Crosstabs" icon={Lightbulb} variant="step">
      <div className="space-y-3 mt-2">
        <div className="text-sm space-y-2 text-slate-700 dark:text-slate-300">
          <p>• <strong>Row variables:</strong> Biasanya independent/predictor variables dengan kategori lebih sedikit</p>
          <p>• <strong>Column variables:</strong> Dependent/outcome variables untuk easy percentage interpretation</p>
          <p>• <strong>Date variables:</strong> Pastikan konsisten format "dd-mm-yyyy" untuk automatic conversion</p>
          <p>• <strong>Mixed analysis:</strong> Bisa mix NUMERIC codes dengan STRING categories dalam satu analisis</p>
          <p>• <strong>Weight considerations:</strong> Jika data weighted, pastikan weight variable sudah dikonfigurasi</p>
        </div>
      </div>
    </HelpCard>
  </div>
);
