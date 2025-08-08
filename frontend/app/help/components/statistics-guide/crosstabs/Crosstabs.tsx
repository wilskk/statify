import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { Calculator, FileText, BarChart3, HelpCircle, Table, Settings } from 'lucide-react';

// Tab content components for cross tabulation analysis

const VariablesTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="Tentang Analisis Crosstabs">
      <p className="text-sm mt-2">
        Analisis Crosstabs (tabulasi silang) digunakan untuk menguji hubungan antara dua variabel kategorikal 
        dengan membuat tabel kontingensi. Analisis ini menunjukkan bagaimana frekuensi terdistribusi di antara 
        kategori-kategori dan menguji signifikansi statistik hubungan tersebut.
      </p>
    </HelpAlert>

    <HelpCard title="Kapan Menggunakan Crosstabs" icon={HelpCircle} variant="feature">
      <ul className="text-sm space-y-2 mt-2">
        <li>• Menguji hubungan antara dua variabel kategorikal</li>
        <li>• Menganalisis respons survei berdasarkan kelompok demografis</li>
        <li>• Membandingkan proporsi di antara kategori yang berbeda</li>
        <li>• Mengidentifikasi pola dalam data kategorikal</li>
      </ul>
    </HelpCard>

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

    <HelpAlert variant="tip" title="Tips Pemilihan Variabel">
      <p className="text-sm mt-2">
        Pilih variabel yang masuk akal untuk dibandingkan. Variabel baris sering kali merupakan variabel 
        hasil atau dependen, sedangkan variabel kolom biasanya merupakan variabel prediktor atau independen.
      </p>
    </HelpAlert>

    <HelpCard title="Hasil yang Akan Diperoleh" icon={FileText} variant="feature">
      <ul className="text-sm space-y-2 mt-2">
        <li>• Tabel kontingensi dengan jumlah teramati dan diharapkan</li>
        <li>• Uji Chi-Square untuk independensi</li>
        <li>• Persentase baris, kolom, dan total</li>
        <li>• Ukuran asosiasi (Cramer's V, Gamma, dll.)</li>
        <li>• Analisis residual untuk signifikansi sel</li>
      </ul>
    </HelpCard>
  </div>
);



const CellsTab = () => (
  <div className="space-y-6">
    <HelpCard title="Opsi Tampilan Sel" icon={Table} variant="feature">
      <div className="space-y-4 mt-2">
        <div className="text-sm font-medium mb-3">Counts (Jumlah)</div>
        <HelpStep
          number={1}
          title="Observed (Teramati)"
          description="Menampilkan frekuensi aktual dalam setiap sel tabel kontingensi."
        />
        <HelpStep
          number={2}
          title="Expected (Diharapkan)"
          description="Menampilkan frekuensi yang diharapkan dengan asumsi variabel independen."
        />
        <HelpStep
          number={3}
          title="Hide Small Counts (Sembunyikan Jumlah Kecil)"
          description="Menyembunyikan sel dengan jumlah di bawah ambang batas tertentu untuk privasi data."
        />
      </div>
    </HelpCard>

    <HelpCard title="Opsi Persentase" icon={Calculator} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="% within Row Variable (% dalam Variabel Baris)"
          description="Menampilkan persentase setiap sel terhadap total barisnya."
        />
        <HelpStep
          number={2}
          title="% within Column Variable (% dalam Variabel Kolom)"
          description="Menampilkan persentase setiap sel terhadap total kolomnya."
        />
        <HelpStep
          number={3}
          title="% of Total (% dari Total)"
          description="Menampilkan persentase setiap sel terhadap total keseluruhan."
        />
      </div>
    </HelpCard>

    <HelpCard title="Residual" icon={BarChart3} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Unstandardized (Tidak Terstandarisasi)"
          description="Selisih antara frekuensi teramati dan diharapkan: Observed - Expected"
        />
        <HelpStep
          number={2}
          title="Standardized Residual (Residual Terstandarisasi)"
          description="Residual dibagi dengan akar kuadrat dari frekuensi yang diharapkan."
        />
        <HelpStep
          number={3}
          title="Adjusted Residual (Residual Disesuaikan)"
          description="Residual terstandarisasi yang disesuaikan dengan varians sel."
        />
      </div>
    </HelpCard>

    <HelpAlert variant="tip" title="Interpretasi Persentase">
      <p className="text-sm mt-2">
        Gunakan persentase baris untuk membandingkan antar kolom, persentase kolom untuk membandingkan 
        antar baris, dan persentase total untuk pola distribusi keseluruhan.
      </p>
    </HelpAlert>
  </div>
);



const QuickStartGuide = () => (
  <div className="mt-8 grid gap-4">
    <HelpCard title="Panduan Cepat" icon={FileText} variant="feature">
      <div className="space-y-3">
        <p className="text-sm">Siap membuat analisis tabulasi silang Anda?</p>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Pilih variabel baris dan kolom di tab Variables</li>
          <li>Konfigurasi tampilan sel di tab Cells</li>
          <li>Klik OK untuk menghasilkan tabulasi silang Anda</li>
        </ol>
      </div>
    </HelpCard>

    <HelpCard title="Interpretasi Hasil" icon={BarChart3} variant="feature">
      <div className="space-y-2">
        <p className="text-sm">Wawasan utama yang perlu dicari:</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Hasil Chi-Square yang signifikan menunjukkan adanya hubungan</li>
          <li>Ukuran asosiasi menunjukkan kekuatan hubungan</li>
          <li>Residual menyoroti perbedaan sel yang signifikan</li>
          <li>Persentase mengungkap pola distribusi</li>
        </ul>
      </div>
    </HelpCard>
  </div>
);

export const Crosstabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('variables');

  const tabConfig = [
    { value: 'variables', label: 'Variables', icon: Table },
    { value: 'cells', label: 'Cells', icon: Table }
  ];

  return (
    <div className="w-full space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Panduan Analisis Crosstabs</h1>
        <p className="text-muted-foreground">
          Pelajari cara menganalisis hubungan antara variabel kategorikal menggunakan tabulasi silang
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {tabConfig.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="variables" className="mt-6">
          <VariablesTab />
        </TabsContent>

        <TabsContent value="cells" className="mt-6">
          <CellsTab />
        </TabsContent>
      </Tabs>

      <QuickStartGuide />
    </div>
  );
};

