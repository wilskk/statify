import React from 'react';
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
            <p>• <strong>Nominal & Ordinal:</strong> Tabel frekuensi, mode, statistik deskriptif terbatas</p>
            <p>• <strong>Scale (Numeric):</strong> Semua statistik tersedia + quartiles, percentiles, extreme values</p>
            <p>• <strong>Date Variables:</strong> Otomatis dikonversi ke SPSS seconds, diperlakukan sebagai scale</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">NUMERIC</span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">
              Tipe: NUMERIC, COMMA, DOT, SCIENTIFIC, DOLLAR, RESTRICTED_NUMERIC
            </p>
            <ul className="text-xs space-y-1 text-emerald-600 dark:text-emerald-400">
              <li>• Continuous data (tinggi, berat, skor)</li>
              <li>• Discrete counts (jumlah anak, umur)</li>
              <li>• Rating scales (1-10)</li>
            </ul>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Type className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">STRING</span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">Tipe: STRING</p>
            <ul className="text-xs space-y-1 text-blue-600 dark:text-blue-400">
              <li>• Kategori nominal (jenis kelamin, kota)</li>
              <li>• Kategori ordinal (rendah, sedang, tinggi)</li>
              <li>• Labels dan kode</li>
            </ul>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">DATE</span>
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">
              Tipe: DATE, ADATE, EDATE, SDATE, JDATE, QYR, MOYR, WKYR, DATETIME, TIME, DTIME
            </p>
            <div className="text-xs space-y-1 text-purple-600 dark:text-purple-400">
              <li>• Format dd-mm-yyyy string otomatis dikonversi</li>
              <li>• Diperlakukan sebagai scale measurement</li>
            </div>
          </div>
        </div>
      </div>
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
  </div>
);