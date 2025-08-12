import React from 'react';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
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
        />
      </div>
    </HelpCard>

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

  </div>
);