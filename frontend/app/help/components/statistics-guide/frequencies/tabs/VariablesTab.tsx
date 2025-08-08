import React from 'react';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { HelpCircle, Table } from 'lucide-react';

export const VariablesTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="Apa itu Analisis Frekuensi?">
      <p className="text-sm mt-2">
        Analisis frekuensi menghitung seberapa sering setiap nilai unik muncul dalam data Anda. 
        Ini membantu memahami distribusi nilai dan mengidentifikasi pola dalam data.
      </p>
    </HelpAlert>

    <HelpCard title="Kapan Menggunakan Analisis Frekuensi" icon={HelpCircle} variant="feature">
      <ul className="text-sm space-y-2 mt-2">
        <li>• Memahami distribusi data kategorikal</li>
        <li>• Mengidentifikasi nilai yang paling umum</li>
        <li>• Memeriksa kualitas data dan missing values</li>
        <li>• Mempersiapkan data untuk analisis lebih lanjut</li>
        <li>• Membuat tabel frekuensi dan persentase</li>
      </ul>
    </HelpCard>

    <HelpCard title="Memilih Variabel" icon={Table} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Pilih Variabel Anda"
          description="Pilih satu atau lebih variabel dari daftar variabel yang tersedia. Ini bisa berupa variabel kategorikal atau numerik."
        />
        <HelpStep
          number={2}
          title="Seret ke Terpilih"
          description="Seret variabel dari daftar yang tersedia ke kotak variabel terpilih, atau gunakan tombol panah untuk memindahkannya."
        />
        <HelpStep
          number={3}
          title="Atur Urutan Jika Diperlukan"
          description="Gunakan panah atas/bawah untuk mengubah urutan variabel jika Anda menganalisis beberapa variabel."
        />
      </div>
    </HelpCard>

    <HelpAlert variant="tip" title="Jenis Variabel">
      <p className="text-sm mt-2">
        Analisis frekuensi bekerja paling baik dengan variabel kategorikal (nominal atau ordinal), 
        tetapi juga dapat digunakan dengan data numerik untuk melihat distribusi nilai.
      </p>
    </HelpAlert>
  </div>
);