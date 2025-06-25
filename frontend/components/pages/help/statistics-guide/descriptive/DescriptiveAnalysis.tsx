import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, FileBarChart, Sigma, BarChart, RefreshCcw } from 'lucide-react';

export const DescriptiveAnalysis = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-3">Panduan Statistik Deskriptif</h2>
        <p className="text-muted-foreground">
          Analisis Statistik Deskriptif bertujuan untuk meringkas dan mendeskripsikan fitur utama dari kumpulan data. 
          Ini memberikan ringkasan kuantitatif sederhana tentang sampel dan pengukurannya.
        </p>
      </div>

      <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
        <Info className="h-5 w-5 text-blue-500" />
        <AlertTitle>Cara Menggunakan Fitur Ini</AlertTitle>
        <AlertDescription className="text-blue-700 mt-2">
          <ol className="list-decimal list-inside space-y-1">
            <li>Buka menu <strong>Analyze &gt; Descriptive Statistics &gt; Descriptives</strong></li>
            <li>Pilih satu atau lebih variabel numerik (skala) yang ingin Anda analisis</li>
            <li>Klik tab <strong>Statistics</strong> untuk memilih metrik spesifik yang Anda butuhkan</li>
            <li>Klik <strong>OK</strong> untuk menjalankan analisis. Hasilnya akan muncul di jendela output</li>
          </ol>
        </AlertDescription>
      </Alert>

      <div>
        <h3 className="text-xl font-semibold mb-3 pb-2 border-b">Contoh Kasus dan Interpretasi</h3>
        <p className="mb-4">
          Misalkan seorang guru ingin menganalisis data dari 30 siswa. Guru tersebut mengumpulkan data untuk dua variabel numerik: 
          <strong> Nilai_Ujian_Matematika</strong> (skor 0-100) dan <strong>Jam_Belajar_per_Minggu</strong>.
        </p>

        <Card className="overflow-hidden border-border">
          <div className="bg-muted/50 p-3 font-medium text-center">Descriptive Statistics</div>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[240px]"></TableHead>
                  <TableHead>N</TableHead>
                  <TableHead>Minimum</TableHead>
                  <TableHead>Maximum</TableHead>
                  <TableHead>Mean</TableHead>
                  <TableHead>Std. Deviation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Nilai_Ujian_Matematika</TableCell>
                  <TableCell>30</TableCell>
                  <TableCell>65</TableCell>
                  <TableCell>98</TableCell>
                  <TableCell>82.50</TableCell>
                  <TableCell>8.75</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Jam_Belajar_per_Minggu</TableCell>
                  <TableCell>28</TableCell>
                  <TableCell>2</TableCell>
                  <TableCell>15</TableCell>
                  <TableCell>7.80</TableCell>
                  <TableCell>3.50</TableCell>
                </TableRow>
                <TableRow className="bg-muted/30">
                  <TableCell className="font-medium">Valid N (listwise)</TableCell>
                  <TableCell>28</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-4">
          <h4 className="font-semibold">Cara Membaca Tabel:</h4>
          <ul className="space-y-3">
            <li className="flex items-start gap-x-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">1</span>
              <span><strong>N (Jumlah Kasus):</strong> Terdapat data dari 30 siswa untuk <code>Nilai_Ujian_Matematika</code>, tetapi hanya 28 siswa untuk <code>Jam_Belajar_per_Minggu</code>. Ini berarti ada 2 data yang hilang pada variabel jam belajar. Baris <code>Valid N (listwise)</code> menunjukkan bahwa hanya ada 28 siswa yang memiliki data lengkap untuk <em>kedua</em> variabel tersebut.</span>
            </li>
            <li className="flex items-start gap-x-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">2</span>
              <span><strong>Nilai Ujian Matematika:</strong> Rata-rata nilai (Mean) adalah 82.50 dengan simpangan baku (Std. Deviation) 8.75. Nilai tersebar dari 65 hingga 98. Sebaran nilai relatif sempit, menunjukkan kinerja yang cukup seragam.</span>
            </li>
            <li className="flex items-start gap-x-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">3</span>
              <span><strong>Jam Belajar per Minggu:</strong> Rata-rata siswa belajar selama 7.80 jam per minggu, dengan simpangan baku 3.50. Waktu belajar sangat bervariasi, mulai dari hanya 2 jam hingga 15 jam seminggu. Variasi yang lebih besar ini mungkin menarik untuk dianalisis lebih lanjut.</span>
            </li>
          </ul>
        </div>
      </div>

      <Tabs defaultValue="central" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="central" className="flex gap-2">
            <Sigma className="h-4 w-4" /> Ukuran Pemusatan
          </TabsTrigger>
          <TabsTrigger value="dispersion" className="flex gap-2">
            <BarChart className="h-4 w-4" /> Ukuran Sebaran
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex gap-2">
            <RefreshCcw className="h-4 w-4" /> Ukuran Distribusi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="central" className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-4">Ukuran Pemusatan (Central Tendency)</h3>
            <p className="text-muted-foreground mb-4">
              Ukuran-ukuran ini mewakili titik pusat atau tipikal dari kumpulan data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border">
              <CardContent className="p-4 pt-6">
                <h4 className="font-semibold mb-2">Mean</h4>
                <p className="text-sm text-muted-foreground">
                  Rata-rata aritmatika dari semua nilai. Dihitung sebagai <code>Sum / N</code>.
                </p>
                <div className="mt-2 text-xs bg-muted/30 p-2 rounded font-mono">
                  μ = (Σxᵢ) / N
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sensitif terhadap nilai ekstrim (outlier).
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-border">
              <CardContent className="p-4 pt-6">
                <h4 className="font-semibold mb-2">Median</h4>
                <p className="text-sm text-muted-foreground">
                  Nilai tengah dari data yang telah diurutkan. Jika jumlah data genap, median adalah rata-rata dari dua nilai tengah.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lebih tahan terhadap outlier daripada mean.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-border">
              <CardContent className="p-4 pt-6">
                <h4 className="font-semibold mb-2">Sum</h4>
                <p className="text-sm text-muted-foreground">
                  Jumlah total dari semua nilai dalam variabel.
                </p>
                <div className="mt-2 text-xs bg-muted/30 p-2 rounded font-mono">
                  Sum = Σxᵢ
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dispersion" className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-4">Ukuran Sebaran (Dispersion)</h3>
            <p className="text-muted-foreground mb-4">
              Ukuran ini menggambarkan sejauh mana data tersebar atau menyebar dalam sampel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border">
              <CardContent className="p-4 pt-6">
                <h4 className="font-semibold mb-2">Std. Deviation (Simpangan Baku)</h4>
                <p className="text-sm text-muted-foreground">
                  Ukuran seberapa tersebar data dari meannya. Simpangan baku yang rendah menunjukkan bahwa titik data cenderung dekat dengan mean, sedangkan simpangan baku yang tinggi menunjukkan bahwa titik data tersebar di rentang nilai yang lebih luas.
                </p>
                <div className="mt-2 text-xs bg-muted/30 p-2 rounded font-mono">
                  s = √[ Σ(xᵢ - μ)² / (N - 1) ]
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border">
              <CardContent className="p-4 pt-6">
                <h4 className="font-semibold mb-2">Variance (Varians)</h4>
                <p className="text-sm text-muted-foreground">
                  Kuadrat dari simpangan baku. Ini juga mengukur penyebaran data.
                </p>
                <div className="mt-2 text-xs bg-muted/30 p-2 rounded font-mono">
                  s² = Σ(xᵢ - μ)² / (N - 1)
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border">
              <CardContent className="p-4 pt-6">
                <h4 className="font-semibold mb-2">Range (Rentang)</h4>
                <p className="text-sm text-muted-foreground">
                  Perbedaan antara nilai maksimum dan minimum dalam data.
                </p>
                <div className="mt-2 text-xs bg-muted/30 p-2 rounded font-mono">
                  Range = Maximum - Minimum
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4 pt-6">
                <h4 className="font-semibold mb-2">S.E. Mean</h4>
                <p className="text-sm text-muted-foreground">
                  Standard Error of the Mean memperkirakan simpangan baku dari rata-rata sampel. Menunjukkan seberapa akurat rata-rata sampel dalam merepresentasikan rata-rata populasi.
                </p>
                <div className="mt-2 text-xs bg-muted/30 p-2 rounded font-mono">
                  S.E. Mean = s / √N
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-4">Ukuran Distribusi (Distribution)</h3>
            <p className="text-muted-foreground mb-4">
              Ukuran-ukuran ini memberikan wawasan tentang bentuk distribusi data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardContent className="p-4 pt-6">
                <h4 className="font-semibold mb-2">Skewness</h4>
                <p className="text-sm text-muted-foreground">
                  Mengukur asimetri distribusi data di sekitar meannya.
                </p>
                <div className="mt-2 text-xs bg-muted/30 p-2 rounded font-mono">
                  g₁ ≈ Σ( (xᵢ - μ)/s )³ / N
                </div>
                
                <ul className="mt-3 space-y-1 text-sm">
                  <li className="flex items-center gap-x-1">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <span>Skewness positif: ekor kanan distribusi lebih panjang</span>
                  </li>
                  <li className="flex items-center gap-x-1">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <span>Skewness negatif: ekor kiri lebih panjang</span>
                  </li>
                  <li className="flex items-center gap-x-1">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <span>Nilai 0: distribusi simetris sempurna (seperti &quot;lonceng&quot;)</span>
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Sebagai aturan umum, nilai skewness antara -1 dan 1 dianggap cukup simetris.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-border">
              <CardContent className="p-4 pt-6">
                <h4 className="font-semibold mb-2">Kurtosis</h4>
                <p className="text-sm text-muted-foreground">
                  Mengukur &quot;ketajaman&quot; atau &quot;keruncingan&quot; puncak distribusi.
                </p>
                <div className="mt-2 text-xs bg-muted/30 p-2 rounded font-mono">
                  g₂ ≈ [ Σ( (xᵢ - μ)/s )⁴ / N ] - 3
                </div>
                
                <ul className="mt-3 space-y-1 text-sm">
                  <li className="flex items-center gap-x-1">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <span>Kurtosis tinggi (leptokurtik): banyak varians dari outlier</span>
                  </li>
                  <li className="flex items-center gap-x-1">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <span>Kurtosis rendah (platikurtik): varians dari nilai yang sering terjadi</span>
                  </li>
                  <li className="flex items-center gap-x-1">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <span>Nilai mendekati 0: mirip dengan distribusi normal</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
