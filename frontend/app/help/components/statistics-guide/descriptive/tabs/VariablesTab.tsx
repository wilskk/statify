import React from 'react';
import { Table, Calculator, HelpCircle } from 'lucide-react';

export const VariablesTab = () => (
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
            <p className="text-sm text-slate-600 dark:text-slate-400">Centang &quot;Save standardized values as variables&quot; jika Anda ingin menyimpan nilai z-score sebagai variabel baru.</p>
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
