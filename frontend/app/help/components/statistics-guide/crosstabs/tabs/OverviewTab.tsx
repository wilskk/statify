import React from 'react';
import { HelpCard, HelpAlert } from '@/app/help/ui/HelpLayout';
import { Grid3x3, Target, TrendingUp, HelpCircle } from 'lucide-react';

export const OverviewTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="Tentang Analisis Crosstabs">
      <p className="text-sm mt-2">
        Analisis Crosstabs (tabulasi silang) digunakan untuk menguji hubungan antara dua variabel kategorikal 
        dengan membuat tabel kontingensi. Analisis ini menunjukkan bagaimana frekuensi terdistribusi di antara 
        kategori-kategori dan menguji signifikansi statistik hubungan tersebut.
      </p>
    </HelpAlert>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <HelpCard title="Kapan Menggunakan Crosstabs" icon={HelpCircle} variant="feature">
        <ul className="text-sm space-y-2 mt-2">
          <li>• Menguji hubungan antara dua variabel kategorikal</li>
          <li>• Menganalisis respons survei berdasarkan kelompok demografis</li>
          <li>• Membandingkan proporsi di antara kategori yang berbeda</li>
          <li>• Mengidentifikasi pola dalam data kategorikal</li>
          <li>• Memvalidasi hipotesis tentang independensi variabel</li>
          <li>• Analisis pasar dan segmentasi konsumen</li>
        </ul>
      </HelpCard>

      <HelpCard title="Hasil yang Akan Diperoleh" icon={Grid3x3} variant="feature">
        <ul className="text-sm space-y-2 mt-2">
          <li>• Tabel kontingensi dengan jumlah teramati dan diharapkan</li>
          <li>• Uji Chi-Square untuk independensi</li>
          <li>• Persentase baris, kolom, dan total</li>
          <li>• Ukuran asosiasi (Cramer&apos;s V, Gamma, dll.)</li>
          <li>• Analisis residual untuk signifikansi sel</li>
          <li>• Interpretasi statistik yang mudah dipahami</li>
        </ul>
      </HelpCard>
    </div>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
          <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Konsep Dasar Crosstabs</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Tabel Kontingensi</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border text-sm mb-2 text-slate-700 dark:text-slate-300">
            Matriks yang menampilkan frekuensi gabungan dua variabel kategorikal
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Variabel baris vs variabel kolom dengan interseksi menunjukkan jumlah observasi untuk setiap kombinasi kategori.</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Uji Chi-Square</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border text-sm mb-2 text-slate-700 dark:text-slate-300">
            χ² = Σ((Observed - Expected)² / Expected)
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Menguji apakah ada hubungan signifikan antara dua variabel kategorikal.</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Ukuran Asosiasi</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border text-sm mb-2 text-slate-700 dark:text-slate-300">
            Cramer&apos;s V, Phi Coefficient, Contingency Coefficient
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Mengukur kekuatan hubungan antara variabel kategorikal (rentang 0-1).</p>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Contoh Aplikasi Praktis</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">Penelitian Medis</p>
          <p className="text-sm text-blue-700 dark:text-blue-300">Menguji hubungan antara jenis kelamin dan kejadian penyakit tertentu</p>
        </div>
        
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <p className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">Survei Konsumen</p>
          <p className="text-sm text-emerald-700 dark:text-emerald-300">Menganalisis preferensi produk berdasarkan kelompok usia</p>
        </div>
        
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="font-medium text-purple-800 dark:text-purple-200 mb-2">Penelitian Pendidikan</p>
          <p className="text-sm text-purple-700 dark:text-purple-300">Hubungan metode pembelajaran dengan tingkat kelulusan</p>
        </div>
        
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">Analisis Politik</p>
          <p className="text-sm text-amber-700 dark:text-amber-300">Preferensi voting berdasarkan lokasi geografis</p>
        </div>
      </div>
    </div>

    <HelpAlert variant="tip" title="Tips Pemilihan Variabel">
      <div className="text-sm space-y-2 mt-2">
        <p>
          <strong>Variabel Baris:</strong> Sering kali merupakan variabel hasil atau dependen yang ingin dijelaskan
        </p>
        <p>
          <strong>Variabel Kolom:</strong> Biasanya merupakan variabel prediktor atau independen yang menjelaskan
        </p>
        <p>
          <strong>Pertimbangan:</strong> Pastikan kedua variabel bersifat kategorikal dan memiliki kategori yang jelas dan saling eksklusif
        </p>
      </div>
    </HelpAlert>
  </div>
);
