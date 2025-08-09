import React from 'react';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { Table, Database, CheckSquare, AlertTriangle } from 'lucide-react';

export const VariablesTab = () => (
  <div className="space-y-6">
    <HelpCard title="Memilih Variabel Baris dan Kolom" icon={Table} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Pilih Variabel Baris"
          description="Pilih variabel kategorikal pertama yang akan muncul sebagai baris dalam tabel kontingensi."
        />
        <HelpStep
          number={2}
          title="Pilih Variabel Kolom"
          description="Pilih variabel kategorikal kedua yang akan muncul sebagai kolom dalam tabel kontingensi."
        />
        <HelpStep
          number={3}
          title="Periksa Tipe Variabel"
          description="Pastikan kedua variabel bersifat kategorikal (nominal atau ordinal) untuk tabulasi silang yang valid."
        />
      </div>
    </HelpCard>

    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Jenis Variabel yang Sesuai</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Variabel Nominal</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded border text-sm mb-2 text-slate-700 dark:text-slate-300">
            Kategori tanpa urutan tertentu
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p><strong>Contoh:</strong></p>
            <p>• Jenis kelamin: Laki-laki, Perempuan</p>
            <p>• Agama: Islam, Kristen, Hindu, Buddha</p>
            <p>• Warna favorit: Merah, Biru, Hijau</p>
            <p>• Status perkawinan: Belum menikah, Menikah, Cerai</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Variabel Ordinal</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded border text-sm mb-2 text-slate-700 dark:text-slate-300">
            Kategori dengan urutan bermakna
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p><strong>Contoh:</strong></p>
            <p>• Tingkat pendidikan: SD, SMP, SMA, S1, S2</p>
            <p>• Tingkat kepuasan: Sangat tidak puas, Tidak puas, Netral, Puas, Sangat puas</p>
            <p>• Skala Likert: Sangat tidak setuju sampai Sangat setuju</p>
            <p>• Tingkat penghasilan: Rendah, Menengah, Tinggi</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Persyaratan Data</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800">
          <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Frekuensi Minimum</h4>
          <div className="text-sm space-y-2 text-amber-700 dark:text-amber-300">
            <p>• <strong>Frekuensi yang diharapkan:</strong> Minimal 5 di setiap sel untuk validitas Chi-Square</p>
            <p>• <strong>Alternatif:</strong> Gunakan Fisher&apos;s Exact Test jika frekuensi terlalu kecil</p>
            <p>• <strong>Saran:</strong> Kombinasikan kategori dengan frekuensi rendah jika secara konseptual masuk akal</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Independensi Observasi</h4>
          <div className="text-sm space-y-2 text-blue-700 dark:text-blue-300">
            <p>• Setiap observasi harus independen (tidak ada duplikasi data)</p>
            <p>• Satu subjek tidak boleh muncul di beberapa sel secara bersamaan</p>
            <p>• Pengambilan sampel harus acak dan representatif</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">Kategori yang Lengkap</h4>
          <div className="text-sm space-y-2 text-emerald-700 dark:text-emerald-300">
            <p>• Kategori harus saling eksklusif (tidak overlapping)</p>
            <p>• Kategori harus exhaustive (mencakup semua kemungkinan)</p>
            <p>• Hindari kategori &quot;lain-lain&quot; yang terlalu besar</p>
          </div>
        </div>
      </div>
    </div>

    <HelpCard title="Strategi Pemilihan Variabel" icon={Table} variant="feature">
      <div className="space-y-4 mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Variabel Baris (Biasanya Dependen)</h4>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p>• Variabel hasil yang ingin diprediksi</p>
              <p>• Outcome atau response variable</p>
              <p>• Contoh: Status kesembuhan, Kepuasan pelanggan</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Variabel Kolom (Biasanya Independen)</h4>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p>• Variabel prediktor atau explanatory</p>
              <p>• Faktor yang diduga mempengaruhi</p>
              <p>• Contoh: Jenis kelamin, Kelompok umur, Perlakuan</p>
            </div>
          </div>
        </div>
      </div>
    </HelpCard>

    <HelpAlert variant="warning" title="Perhatian Khusus">
      <div className="text-sm space-y-2 mt-2">
        <p>
          <strong>Variabel Kontinu:</strong> Jika Anda memiliki variabel kontinu (seperti umur dalam tahun), 
          Anda perlu mengkategorikannya terlebih dahulu (misalnya: 18-25, 26-35, 36-45, dll.)
        </p>
        <p>
          <strong>Missing Values:</strong> Tentukan bagaimana menangani data yang hilang - 
          apakah akan dikecualikan atau dibuat kategori tersendiri
        </p>
        <p>
          <strong>Urutan Kategori:</strong> Untuk variabel ordinal, pastikan urutan kategori 
          sudah benar sebelum melakukan analisis
        </p>
      </div>
    </HelpAlert>

    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Checklist Persiapan Data</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <input type="checkbox" className="rounded" />
          <span className="text-slate-600 dark:text-slate-400">Kedua variabel bersifat kategorikal</span>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" className="rounded" />
          <span className="text-slate-600 dark:text-slate-400">Kategori saling eksklusif dan lengkap</span>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" className="rounded" />
          <span className="text-slate-600 dark:text-slate-400">Frekuensi setiap kategori memadai (&gt;5)</span>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" className="rounded" />
          <span className="text-slate-600 dark:text-slate-400">Data sudah dibersihkan dari missing values</span>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" className="rounded" />
          <span className="text-slate-600 dark:text-slate-400">Observasi bersifat independen</span>
        </div>
      </div>
    </div>
  </div>
);
