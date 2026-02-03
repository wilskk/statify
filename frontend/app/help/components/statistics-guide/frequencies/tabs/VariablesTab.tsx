import React from 'react';
<<<<<<< HEAD
import { Table, Calculator, HelpCircle } from 'lucide-react';

export const VariablesTab = () => (
  <div className="space-y-6">
    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
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
            <p className="text-sm text-slate-600 dark:text-slate-400">Pilih satu atau lebih variabel dari semua tipe (NUMERIC, STRING, DATE). Frequencies mendukung semua level measurement: nominal, ordinal, dan scale.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
          <div>
            <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-1">Tambahkan ke Analisis</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Seret variabel ke kotak analisis atau gunakan tombol panah untuk menambahkannya ke analisis frekuensi Anda.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
          <div>
            <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-1">Display Frequency Tables</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Centang "Display frequency tables" untuk menampilkan tabel frekuensi lengkap dengan frequency, percent, valid percent, dan cumulative percent.</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Jenis Variabel yang Didukung</h3>
      </div>
      <div className="space-y-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-green-200 dark:border-green-800">
          <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Level Pengukuran dan Output</h4>
          <div className="text-sm space-y-2 text-green-700 dark:text-green-300">
=======
import { Table, Calculator, Database, Type, Calendar, Lightbulb } from 'lucide-react';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';

export const VariablesTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="Pemilihan Variabel untuk Analisis Frequencies">
      <p className="text-sm mt-2">
        Analisis Frequencies mendukung <strong>semua jenis variabel</strong> (NUMERIC, STRING, DATE) dengan 
        level measurement nominal, ordinal, dan scale. Sistem otomatis mendeteksi dan menangani berbagai format data.
      </p>
    </HelpAlert>
    <HelpCard title="Workflow Pemilihan Variabel" icon={Table} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Pilih Variabel"
          description="Pilih satu atau lebih variabel dari semua tipe (NUMERIC, STRING, DATE). Frequencies mendukung semua level measurement: nominal, ordinal, dan scale."
        />
        <HelpStep
          number={2}
          title="Tambahkan ke Analisis"
          description="Seret variabel ke kotak analisis atau gunakan tombol panah untuk menambahkannya ke analisis frekuensi Anda."
        />
        <HelpStep
          number={3}
          title="Display Frequency Tables"
          description="Centang 'Display frequency tables' untuk menampilkan tabel frekuensi lengkap dengan frequency, percent, valid percent, dan cumulative percent."
        />
      </div>
    </HelpCard>

    <HelpCard title="Tipe Data yang Didukung" icon={Database} variant="feature">
      <div className="space-y-4 mt-2">
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">Level Pengukuran dan Output</h4>
          <div className="text-sm space-y-2 text-slate-700 dark:text-slate-300">
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
            <p>• <strong>Nominal & Ordinal:</strong> Tabel frekuensi, mode, statistik deskriptif terbatas</p>
            <p>• <strong>Scale (Numeric):</strong> Semua statistik tersedia + quartiles, percentiles, extreme values</p>
            <p>• <strong>Date Variables:</strong> Otomatis dikonversi ke SPSS seconds, diperlakukan sebagai scale</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
<<<<<<< HEAD
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <h4 className="font-medium text-slate-800 dark:text-slate-200">✓ Variabel Numerik</h4>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Tipe: NUMERIC, COMMA, DOT, SCIENTIFIC, DOLLAR, RESTRICTED_NUMERIC</p>
            <ul className="text-sm space-y-1 text-slate-500 dark:text-slate-500">
=======
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">NUMERIC</span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">
              Tipe: NUMERIC, COMMA, DOT, SCIENTIFIC, DOLLAR, RESTRICTED_NUMERIC
            </p>
            <ul className="text-xs space-y-1 text-emerald-600 dark:text-emerald-400">
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
              <li>• Continuous data (tinggi, berat, skor)</li>
              <li>• Discrete counts (jumlah anak, umur)</li>
              <li>• Rating scales (1-10)</li>
            </ul>
          </div>
<<<<<<< HEAD
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <h4 className="font-medium text-slate-800 dark:text-slate-200">✓ Variabel String</h4>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Tipe: STRING</p>
            <ul className="text-sm space-y-1 text-slate-500 dark:text-slate-500">
=======
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Type className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">STRING</span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">Tipe: STRING</p>
            <ul className="text-xs space-y-1 text-blue-600 dark:text-blue-400">
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
              <li>• Kategori nominal (jenis kelamin, kota)</li>
              <li>• Kategori ordinal (rendah, sedang, tinggi)</li>
              <li>• Labels dan kode</li>
            </ul>
          </div>
<<<<<<< HEAD
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <h4 className="font-medium text-slate-800 dark:text-slate-200">✓ Variabel Tanggal</h4>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Tipe: DATE, ADATE, EDATE, SDATE, JDATE, QYR, MOYR, WKYR, DATETIME, TIME, DTIME</p>
            <div className="text-xs space-y-1 text-slate-500 dark:text-slate-500">
=======
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">DATE</span>
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">
              Tipe: DATE, ADATE, EDATE, SDATE, JDATE, QYR, MOYR, WKYR, DATETIME, TIME, DTIME
            </p>
            <div className="text-xs space-y-1 text-purple-600 dark:text-purple-400">
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
              <li>• Format dd-mm-yyyy string otomatis dikonversi</li>
              <li>• Diperlakukan sebagai scale measurement</li>
            </div>
          </div>
        </div>
      </div>
<<<<<<< HEAD
    </div>

    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">⚠</span>
        </div>
        <div>
          <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Missing Values & Weights</h3>
          <div className="text-sm space-y-2 text-amber-700 dark:text-amber-300">
            <p>• <strong>Missing Values:</strong> Sistem mendeteksi missing values berdasarkan definisi variabel dan memisahkannya dalam tabel frekuensi</p>
            <p>• <strong>Weights:</strong> Jika ada weight variable, frekuensi dihitung dengan weighted counts. Default weight = 1</p>
            <p>• <strong>Valid Percent:</strong> Persentase berdasarkan valid cases saja (tanpa missing)</p>
            <p>• <strong>Cumulative Percent:</strong> Persentase kumulatif dari valid cases</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">💡</span>
        </div>
        <div>
          <h3 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">Tips Penggunaan</h3>
          <div className="text-sm space-y-2 text-emerald-700 dark:text-emerald-300">
            <p>• <strong>Multiple Variables:</strong> Dapat menganalisis beberapa variabel sekaligus</p>
            <p>• <strong>Value Labels:</strong> Sistem otomatis menerapkan value labels jika tersedia</p>
            <p>• <strong>Sorting:</strong> Untuk numeric variables, nilai diurutkan numerik. Untuk string, diurutkan alfabetis</p>
            <p>• <strong>Date Handling:</strong> String format dd-mm-yyyy otomatis dikonversi ke SPSS seconds</p>
          </div>
        </div>
      </div>
    </div>
=======
    </HelpCard>

    <HelpCard title="Missing Values & Weights" icon={Calculator} variant="default">
      <div className="space-y-3 mt-2">
        <div className="text-sm space-y-2 text-slate-700 dark:text-slate-300">
          <p>• <strong>Missing Values:</strong> Sistem mendeteksi missing values berdasarkan definisi variabel dan memisahkannya dalam tabel frekuensi</p>
          <p>• <strong>Weights:</strong> Jika ada weight variable, frekuensi dihitung dengan weighted counts. Default weight = 1</p>
          <p>• <strong>Valid Percent:</strong> Persentase berdasarkan valid cases saja (tanpa missing)</p>
          <p>• <strong>Cumulative Percent:</strong> Persentase kumulatif dari valid cases</p>
        </div>
      </div>
    </HelpCard>

    <HelpCard title="Tips Penggunaan" icon={Lightbulb} variant="step">
      <div className="space-y-3 mt-2">
        <div className="text-sm space-y-2 text-slate-700 dark:text-slate-300">
          <p>• <strong>Multiple Variables:</strong> Dapat menganalisis beberapa variabel sekaligus</p>
          <p>• <strong>Value Labels:</strong> Sistem otomatis menerapkan value labels jika tersedia</p>
          <p>• <strong>Sorting:</strong> Untuk numeric variables, nilai diurutkan numerik. Untuk string, diurutkan alfabetis</p>
          <p>• <strong>Date Handling:</strong> String format dd-mm-yyyy otomatis dikonversi ke SPSS seconds</p>
        </div>
      </div>
    </HelpCard>
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
  </div>
);