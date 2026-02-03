import React from 'react';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
<<<<<<< HEAD
import { HelpCircle, Calculator } from 'lucide-react';

export const VariablesTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="Apa itu Analisis Explore?">
      <p className="text-sm mt-2">
        Analisis Explore menggunakan <strong>ExamineCalculator</strong> untuk memberikan statistik deskriptif yang robust, 
        deteksi outlier dengan Tukey's Hinges, dan M-estimators yang tidak terpengaruh nilai ekstrem. 
        Analisis ini ideal untuk eksplorasi data awal dan identifikasi karakteristik distribusi yang dapat diandalkan.
      </p>
    </HelpAlert>

    <HelpCard title="Kapan Menggunakan Analisis Explore" icon={HelpCircle} variant="feature">
      <ul className="text-sm space-y-2 mt-2">
        <li>• Eksplorasi data awal dengan statistik robust</li>
        <li>• Deteksi outlier menggunakan Tukey's Hinges dan IQR</li>
        <li>• Analisis distribusi dengan 5% trimmed mean</li>
        <li>• Perbandingan kelompok dengan factor variables</li>
        <li>• Confidence interval untuk estimasi mean yang akurat</li>
        <li>• Identifikasi extreme values dengan kriteria SPSS EXAMINE</li>
      </ul>
    </HelpCard>

    <HelpCard title="Memilih Variabel untuk Analisis" icon={Calculator} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Dependent List (Wajib)"
          description="Pilih satu atau lebih variabel NUMERIC untuk analisis. Hanya variabel bertipe NUMERIC yang tersedia dalam available list."
        />
        <HelpStep
          number={2}
          title="Factor List (Opsional)"
          description="Tambahkan variabel kategorikal (semua tipe) untuk membandingkan statistik antar kelompok. Factor variables memungkinkan analisis by-group."
        />
        <HelpStep
          number={3}
          title="Pertimbangan Penggunaan"
          description="Setiap dependent variable akan dianalisis dengan statistik robust. Factor variables akan membagi analisis per level kategori."
=======
import { Calculator, Users, Lightbulb } from 'lucide-react';

export const VariablesTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="Pemilihan Variabel untuk Analisis Explore">
      <p className="text-sm mt-2">
        Analisis Explore memerlukan minimal satu variabel numerik sebagai dependent variable. 
        Factor variables bersifat opsional untuk analisis perbandingan antar kelompok.
      </p>
    </HelpAlert>

    <HelpCard title="Dependent Variables (Wajib)" icon={Calculator} variant="feature">
      <div className="space-y-4 mt-2">
        <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">Variabel yang Dapat Dipilih</h4>
          <ul className="text-sm space-y-1 text-slate-700 dark:text-slate-300">
            <li>• <strong>Hanya variabel NUMERIC</strong> yang tersedia dalam daftar</li>
            <li>• Scale/Interval variables (umur, tinggi, berat, pendapatan)</li>
            <li>• Ordinal variables dengan nilai numerik (rating, score)</li>
            <li>• Continuous dan discrete numeric data</li>
            <li>• <strong>Filtering otomatis:</strong> DATE type dikecualikan dari list</li>
          </ul>
        </div>
        
        <HelpStep
          number={1}
          title="Memilih Single Variable"
          description="Pilih satu variabel numerik untuk analisis mendalam distribusi, outlier detection, dan robust statistics."
        />
        <HelpStep
          number={2}
          title="Memilih Multiple Variables"
          description="Pilih beberapa variabel numerik untuk analisis komparatif. Setiap variabel akan dianalisis secara terpisah dengan statistik yang sama."
>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
        />
      </div>
    </HelpCard>

<<<<<<< HEAD
    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Jenis Variabel yang Didukung</h3>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <h4 className="font-medium text-slate-800 dark:text-slate-200">✓ Dependent Variables (NUMERIC Only)</h4>
            </div>
            <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
              <li>• Hanya variabel bertipe NUMERIC yang muncul di available list</li>
              <li>• Scale/Interval variables (umur, tinggi, berat, suhu)</li>
              <li>• Ordinal variables dengan nilai numerik (rating 1-5)</li>
              <li>• Continuous dan discrete numeric variables</li>
              <li>• Filtered otomatis: DATE type dikecualikan dari numeric computations</li>
            </ul>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <h4 className="font-medium text-slate-800 dark:text-slate-200">✓ Factor Variables (Semua Tipe)</h4>
            </div>
            <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
              <li>• NUMERIC: untuk grouping berdasarkan kode (1=Pria, 2=Wanita)</li>
              <li>• STRING: untuk kategori teks (jenis kelamin, agama, kota)</li>
              <li>• DATE: untuk grouping berdasarkan periode waktu</li>
              <li>• Semua measurement levels: nominal, ordinal, scale</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">💡</span>
        </div>
        <div>
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Tips Pemilihan Variabel</h3>
          <div className="text-sm space-y-2 text-blue-700 dark:text-blue-300">
            <p>• <strong>Dependent List:</strong> Wajib diisi dengan minimal 1 variabel NUMERIC untuk analisis</p>
            <p>• <strong>Factor List:</strong> Opsional, untuk analisis by-group (semua tipe variabel diterima)</p>
            <p>• <strong>Multiple dependents:</strong> Setiap dependent variable akan dianalisis secara terpisah</p>
            <p>• <strong>Dengan factor variables:</strong> Statistik akan dihitung per kombinasi dependent-factor</p>
            <p>• <strong>Filtering otomatis:</strong> Available list hanya menampilkan variabel NUMERIC yang valid</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <HelpCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Penanganan Data dan Computation Logic</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-600">
          <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-2">Missing Values dan Valid N</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">ExamineCalculator akan:</p>
          <ul className="text-sm space-y-1 ml-4 text-slate-600 dark:text-slate-400">
            <li>• Filter nilai non-numeric dan missing values dari computation</li>
            <li>• Hitung N valid untuk setiap dependent variable secara terpisah</li>
            <li>• Menampilkan summary dengan N, N valid, dan N missing per variable</li>
            <li>• Melakukan weighted computation jika weights tersedia</li>
          </ul>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-600">
          <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-2">Measurement Level Logic</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Sistem menentukan computation berdasarkan:</p>
          <ul className="text-sm space-y-1 ml-4 text-slate-600 dark:text-slate-400">
            <li>• <strong>isNumeric check:</strong> (measure === 'scale' || measure === 'ordinal') && coreType !== 'date'</li>
            <li>• <strong>Scale/Ordinal:</strong> Mendapat full descriptive statistics + robust estimators</li>
            <li>• <strong>Nominal/DATE:</strong> Hanya frequency statistics tanpa descriptive computations</li>
            <li>• <strong>Numeric conversion:</strong> Menggunakan toNumeric() function untuk type coercion</li>
          </ul>
        </div>
      </div>
    </div>
=======
    <HelpCard title="Factor Variables (Opsional)" icon={Users} variant="default">
      <div className="space-y-4 mt-2">
        <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">Jenis Factor Variables yang Didukung</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">NUMERIC Factors:</span>
              <p className="text-slate-600 dark:text-slate-400">Kode numerik (1=Pria, 2=Wanita, 3=Lainnya)</p>
            </div>
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">STRING Factors:</span>
              <p className="text-slate-600 dark:text-slate-400">Kategori teks (Gender, Agama, Kota)</p>
            </div>
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">DATE Factors:</span>
              <p className="text-slate-600 dark:text-slate-400">Grouping berdasarkan periode waktu</p>
            </div>
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Measurement Level:</span>
              <p className="text-slate-600 dark:text-slate-400">Nominal, Ordinal, atau Scale</p>
            </div>
          </div>
        </div>

        <HelpStep
          number={1}
          title="Analisis By-Group"
          description="Tambahkan factor variable untuk membandingkan statistik robust antar kelompok kategori. Statistik akan dihitung terpisah untuk setiap level factor."
        />
        <HelpStep
          number={2}
          title="Multiple Factors"
          description="Dapat menambahkan beberapa factor variables. Analisis akan dilakukan untuk setiap kombinasi level dari semua factor variables."
        />
      </div>
    </HelpCard>

    <HelpCard title="Strategi Pemilihan Variabel" icon={Lightbulb} variant="step">
      <div className="space-y-4 mt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-2">Data Exploration</h4>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Pilih variabel-variabel kunci yang ingin dipahami distribusinya. 
              Gunakan factor variables untuk mengidentifikasi perbedaan karakteristik antar kelompok.
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <h4 className="font-medium text-sm text-amber-800 dark:text-amber-200 mb-2">Outlier Detection</h4>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Fokus pada variabel-variabel yang dicurigai memiliki nilai ekstrem. 
              Factor variables membantu mengidentifikasi apakah outlier terkait dengan karakteristik kelompok tertentu.
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <h4 className="font-medium text-sm text-emerald-800 dark:text-emerald-200 mb-2">Comparative Analysis</h4>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Pilih multiple dependent variables dengan karakteristik serupa untuk comparison. 
              Tambahkan factor variables yang relevan untuk analisis stratified.
            </p>
          </div>
        </div>
      </div>
    </HelpCard>

    <HelpCard title="Tips Pemilihan Variabel" icon={Lightbulb} variant="default">
      <div className="space-y-3 mt-2">
        <div className="text-sm space-y-2 text-slate-700 dark:text-slate-300">
          <p>• <strong>Start simple:</strong> Mulai dengan 1-2 dependent variables untuk memahami pattern</p>
          <p>• <strong>Factor relevance:</strong> Pilih factor variables yang secara teoritis mempengaruhi dependent</p>
          <p>• <strong>Scale consideration:</strong> Dependent variables dengan scale sangat berbeda sebaiknya dianalisis terpisah</p>
          <p>• <strong>Sample size:</strong> Untuk factor variables, pastikan setiap level memiliki sample size yang cukup</p>
          <p>• <strong>Missing data:</strong> Periksa pattern missing data sebelum menentukan variabel final</p>
        </div>
      </div>
    </HelpCard>

>>>>>>> 5fc4eb2c1a6bb3a519ea978df15d69574d811c52
  </div>
);