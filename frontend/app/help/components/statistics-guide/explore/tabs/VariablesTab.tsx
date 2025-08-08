import React from 'react';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { HelpCircle, Calculator } from 'lucide-react';

export const VariablesTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="Apa itu Analisis Explore?">
      <p className="text-sm mt-2">
        Analisis Explore memberikan wawasan komprehensif tentang data Anda menggunakan metode statistik yang robust. 
        Ini mengidentifikasi pola, outlier, dan karakteristik distribusi sambil memberikan estimasi yang dapat diandalkan 
        yang tidak terpengaruh oleh nilai ekstrem.
      </p>
    </HelpAlert>

    <HelpCard title="Kapan Menggunakan Analisis Explore" icon={HelpCircle} variant="feature">
      <ul className="text-sm space-y-2 mt-2">
        <li>• Analisis data awal dan pemahaman</li>
        <li>• Deteksi outlier dan penilaian kualitas data</li>
        <li>• Analisis distribusi dan pemeriksaan normalitas</li>
        <li>• Estimasi statistik yang robust</li>
        <li>• Identifikasi pola data</li>
      </ul>
    </HelpCard>

    <HelpCard title="Memilih Variabel untuk Analisis" icon={Calculator} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Variabel Numerik"
          description="Pilih variabel kontinu atau diskrit yang ingin Anda analisis secara mendalam."
        />
        <HelpStep
          number={2}
          title="Variabel Faktor (Opsional)"
          description="Tambahkan variabel kategorikal untuk membandingkan statistik antar kelompok."
        />
        <HelpStep
          number={3}
          title="Pertimbangan Ukuran Sampel"
          description="Pastikan setiap kelompok memiliki ukuran sampel yang memadai untuk analisis yang bermakna."
        />
      </div>
    </HelpCard>

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
              <h4 className="font-medium text-slate-800 dark:text-slate-200">✓ Variabel Dependent (Numerik)</h4>
            </div>
            <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
              <li>• Scale/Interval (umur, tinggi, berat)</li>
              <li>• Ratio (pendapatan, jarak, waktu)</li>
              <li>• Continuous (suhu, tekanan)</li>
              <li>• Discrete numeric (jumlah anak, skor)</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <h4 className="font-medium text-slate-800 dark:text-slate-200">✓ Variabel Factor (Kategorikal)</h4>
            </div>
            <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
              <li>• Nominal (jenis kelamin, agama)</li>
              <li>• Ordinal (pendidikan, rating)</li>
              <li>• String categories (nama kota)</li>
              <li>• Coded categories (1=Ya, 0=Tidak)</li>
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
            <p>• <strong>Untuk eksplorasi tunggal:</strong> Pilih satu variabel numerik untuk analisis mendalam</p>
            <p>• <strong>Untuk perbandingan kelompok:</strong> Tambahkan variabel faktor untuk membandingkan distribusi</p>
            <p>• <strong>Untuk analisis multiple:</strong> Pilih beberapa variabel numerik sekaligus</p>
            <p>• <strong>Untuk deteksi outlier:</strong> Gunakan variabel dengan suspected extreme values</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <HelpCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Penanganan Data Khusus</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-2">Missing Values</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Sistem akan otomatis:</p>
          <ul className="text-sm space-y-1 ml-4 text-slate-600 dark:text-slate-400">
            <li>• Menghitung persentase missing values</li>
            <li>• Mengecualikan missing values dari perhitungan</li>
            <li>• Melaporkan jumlah kasus valid per kelompok</li>
            <li>• Memberikan peringatan jika missing &gt; 20%</li>
          </ul>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-2">Outliers dan Extreme Values</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Analisis Explore akan:</p>
          <ul className="text-sm space-y-1 ml-4 text-slate-600 dark:text-slate-400">
            <li>• Identifikasi outlier secara otomatis</li>
            <li>• Tampilkan nilai ekstrem dalam output</li>
            <li>• Berikan statistik robust yang tidak terpengaruh outlier</li>
            <li>• Visualisasikan outlier dalam boxplot</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);