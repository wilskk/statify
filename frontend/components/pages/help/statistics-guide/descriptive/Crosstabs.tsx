import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { HelpCircle, Grid, Percent, Calculator, FileBarChart2, Table2 } from 'lucide-react';

export const Crosstabs = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-3">Panduan Analisis Tabel Silang (Crosstabs)</h2>
        <p className="text-muted-foreground">
          Analisis <strong>Crosstabs</strong>, atau tabel silang, digunakan untuk menguji hubungan antara dua atau 
          lebih variabel kategorikal. Prosedur ini membuat tabel kontingensi, di mana baris dan kolomnya mewakili 
          kategori dari variabel yang berbeda, dan sel-selnya berisi jumlah kasus yang cocok dengan kombinasi kategori tersebut.
        </p>
      </div>

      <Alert className="bg-blue-50 text-blue-800 border-blue-200">
        <HelpCircle className="h-5 w-5 text-blue-500" />
        <AlertTitle>Bagaimana Cara Menggunakan Fitur Ini?</AlertTitle>
        <AlertDescription className="text-blue-700 mt-2">
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Buka menu <strong>Analyze &gt; Descriptive Statistics &gt; Crosstabs</strong></li>
            <li>Di tab <strong>Variables</strong>, pindahkan satu atau lebih variabel ke dalam kotak <strong>Row(s)</strong></li>
            <li>Pindahkan satu atau lebih variabel ke dalam kotak <strong>Column(s)</strong></li>
            <li>Klik tab <strong>Cells</strong> untuk menyesuaikan informasi yang ditampilkan di setiap sel tabel</li>
            <li>Klik <strong>OK</strong> untuk menjalankan analisis dan menghasilkan tabel silang</li>
          </ol>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="overview" className="flex gap-2 text-xs sm:text-sm">
            <Table2 className="h-4 w-4" /> Gambaran Umum
          </TabsTrigger>
          <TabsTrigger value="cells" className="flex gap-2 text-xs sm:text-sm">
            <Grid className="h-4 w-4" /> Opsi Sel
          </TabsTrigger>
          <TabsTrigger value="example" className="flex gap-2 text-xs sm:text-sm">
            <FileBarChart2 className="h-4 w-4" /> Contoh
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex gap-2 text-xs sm:text-sm">
            <Calculator className="h-4 w-4" /> Pengujian Statistik
          </TabsTrigger>
        </TabsList>

        {/* Gambaran Umum Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Tabel Silang - Gambaran Umum</h3>
            <p className="text-muted-foreground mb-4">
              Tabel silang adalah salah satu teknik analisis data paling dasar dan serbaguna untuk memeriksa hubungan antara dua variabel kategorikal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Kapan Menggunakan Tabel Silang</CardTitle>
                <CardDescription>Situasi ideal untuk crosstabs</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-x-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">✓</span>
                    <span>Mengidentifikasi hubungan antara variabel kategorikal</span>
                  </li>
                  <li className="flex items-start gap-x-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">✓</span>
                    <span>Meringkas data kategorikal dalam format yang ringkas dan visual</span>
                  </li>
                  <li className="flex items-start gap-x-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">✓</span>
                    <span>Menghitung statistik asosiasi seperti Chi-Square dan Cramer&apos;s V</span>
                  </li>
                  <li className="flex items-start gap-x-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">✓</span>
                    <span>Membandingkan distribusi satu variabel di berbagai subpopulasi</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Struktur Tabel Silang</CardTitle>
                <CardDescription>Komponen-komponen utama</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">Variabel Baris</h4>
                    <p className="text-sm text-muted-foreground">
                      Kategori-kategori variabel ini ditampilkan pada baris tabel.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">Variabel Kolom</h4>
                    <p className="text-sm text-muted-foreground">
                      Kategori-kategori variabel ini ditampilkan pada kolom tabel.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">Sel</h4>
                    <p className="text-sm text-muted-foreground">
                      Berisi jumlah kasus (dan secara opsional, persentase) yang memiliki kombinasi nilai baris dan kolom tertentu.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">Margin</h4>
                    <p className="text-sm text-muted-foreground">
                      Total untuk setiap baris dan kolom, biasa disebut margin baris dan kolom.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Opsi Sel Tab */}
        <TabsContent value="cells" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Tab Opsi: Cells</h3>
            <p className="text-muted-foreground mb-4">
              Tab ini memungkinkan Anda untuk mengontrol konten dari setiap sel dalam tabel kontingensi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Counts (Hitungan)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-primary/80 rounded-full mr-2"></span>
                      <h4 className="font-medium">Observed (Teramati)</h4>
                    </div>
                    <p className="text-sm text-muted-foreground pl-5">
                      Ini adalah pilihan default. Menampilkan jumlah kasus aktual (frekuensi) untuk setiap sel.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-primary/80 rounded-full mr-2"></span>
                      <h4 className="font-medium">Expected (Diharapkan)</h4>
                    </div>
                    <p className="text-sm text-muted-foreground pl-5">
                      Menampilkan jumlah kasus yang diharapkan di setiap sel jika tidak ada hubungan antara 
                      variabel baris dan kolom. Nilai ini penting untuk uji Chi-Square.
                    </p>
                    <div className="pl-5 mt-1 text-xs bg-muted/30 p-2 rounded font-mono">
                      Expected = (Row total × Column total) / Grand total
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  <div className="flex items-center">
                    <Percent className="h-4 w-4 mr-2" /> Percentages (Persentase)
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm">
                  Persentase membantu dalam menginterpretasikan hubungan antara variabel dengan menstandarkan frekuensi.
                </p>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-primary/80 rounded-full mr-2"></span>
                      <h4 className="font-medium">Row (Baris)</h4>
                    </div>
                    <p className="text-sm text-muted-foreground pl-5">
                      Menampilkan persentase sel sebagai proporsi dari total barisnya. Ini menunjukkan distribusi variabel 
                      kolom untuk setiap kategori variabel baris.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-primary/80 rounded-full mr-2"></span>
                      <h4 className="font-medium">Column (Kolom)</h4>
                    </div>
                    <p className="text-sm text-muted-foreground pl-5">
                      Menampilkan persentase sel sebagai proporsi dari total kolomnya. Ini menunjukkan distribusi variabel 
                      baris untuk setiap kategori variabel kolom.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-primary/80 rounded-full mr-2"></span>
                      <h4 className="font-medium">Total</h4>
                    </div>
                    <p className="text-sm text-muted-foreground pl-5">
                      Menampilkan persentase sel sebagai proporsi dari jumlah total kasus dalam tabel.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contoh Tab */}
        <TabsContent value="example" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Contoh Tabel Silang</h3>
            <p className="text-muted-foreground mb-4">
              Berikut ini adalah contoh tabel silang yang menganalisis hubungan antara tingkat pendidikan dan jenis pekerjaan.
            </p>
          </div>

          <Card className="overflow-hidden border-border">
            <div className="bg-muted/50 p-3 font-medium text-center">
              Tabel Silang: Tingkat Pendidikan × Jenis Pekerjaan
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]"></TableHead>
                    <TableHead colSpan={3} className="text-center border-b">Jenis Pekerjaan</TableHead>
                    <TableHead rowSpan={2} className="text-center border-l">Total</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="w-[100px]"></TableHead>
                    <TableHead className="text-center">Kantoran</TableHead>
                    <TableHead className="text-center">Teknis</TableHead>
                    <TableHead className="text-center">Manajerial</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">SMA</TableCell>
                    <TableCell className="text-center">30 (60.0%)</TableCell>
                    <TableCell className="text-center">15 (30.0%)</TableCell>
                    <TableCell className="text-center">5 (10.0%)</TableCell>
                    <TableCell className="text-center border-l">50 (100%)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Diploma</TableCell>
                    <TableCell className="text-center">25 (50.0%)</TableCell>
                    <TableCell className="text-center">20 (40.0%)</TableCell>
                    <TableCell className="text-center">5 (10.0%)</TableCell>
                    <TableCell className="text-center border-l">50 (100%)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Sarjana</TableCell>
                    <TableCell className="text-center">15 (30.0%)</TableCell>
                    <TableCell className="text-center">15 (30.0%)</TableCell>
                    <TableCell className="text-center">20 (40.0%)</TableCell>
                    <TableCell className="text-center border-l">50 (100%)</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-medium">Total</TableCell>
                    <TableCell className="text-center">70 (46.7%)</TableCell>
                    <TableCell className="text-center">50 (33.3%)</TableCell>
                    <TableCell className="text-center">30 (20.0%)</TableCell>
                    <TableCell className="text-center border-l">150 (100%)</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="mt-6">
            <h4 className="font-semibold mb-3">Interpretasi Contoh:</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-x-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">1</span>
                <p>
                  <strong>Tingkat Pendidikan dan Jenis Pekerjaan:</strong> Terlihat bahwa hanya 10% dari lulusan SMA dan Diploma yang bekerja di posisi manajerial, 
                  sementara 40% dari lulusan Sarjana bekerja di posisi manajerial.
                </p>
              </div>
              <div className="flex items-start gap-x-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">2</span>
                <p>
                  <strong>Perbedaan Jenis Pekerjaan:</strong> Pekerjaan kantoran mendominasi untuk lulusan SMA (60%), menurun untuk Diploma (50%), dan semakin 
                  menurun untuk Sarjana (30%).
                </p>
              </div>
              <div className="flex items-start gap-x-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">3</span>
                <p>
                  <strong>Kesimpulan:</strong> Tabel ini menunjukkan pola yang jelas bahwa semakin tinggi tingkat pendidikan, semakin besar kemungkinan seseorang 
                  bekerja di posisi manajerial dan semakin kecil kemungkinan bekerja di posisi kantoran.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Pengujian Statistik Tab */}
        <TabsContent value="tests" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Pengujian Statistik untuk Tabel Silang</h3>
            <p className="text-muted-foreground mb-4">
              Beberapa uji statistik dapat digunakan untuk mengevaluasi hubungan antar variabel dalam tabel silang.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Chi-Square Test</CardTitle>
                <CardDescription>Uji independensi antar variabel</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm mb-3">
                  Uji Chi-Square mengevaluasi apakah terdapat hubungan yang signifikan antara dua variabel kategorikal.
                </p>
                <div className="text-xs bg-muted/30 p-2 rounded font-mono mb-2">
                  χ² = Σ [(O - E)² / E]
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li><strong>O</strong> = Frekuensi yang diamati</li>
                  <li><strong>E</strong> = Frekuensi yang diharapkan</li>
                </ul>
                <Separator className="my-3" />
                <p className="text-sm">
                  <strong>Interpretasi:</strong> Jika nilai p &lt; 0.05, tolak hipotesis nol bahwa variabel-variabel tersebut independen. 
                  Artinya, terdapat hubungan yang signifikan secara statistik antara kedua variabel.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Cramer&apos;s V</CardTitle>
                <CardDescription>Ukuran kekuatan asosiasi</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm mb-3">
                  Cramer&apos;s V mengukur kekuatan hubungan antara dua variabel kategorikal pada skala 0 sampai 1.
                </p>
                <div className="text-xs bg-muted/30 p-2 rounded font-mono mb-2">
                  V = √(χ² / (N × min(r-1, c-1)))
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li><strong>χ²</strong> = Nilai Chi-Square</li>
                  <li><strong>N</strong> = Ukuran sampel</li>
                  <li><strong>r</strong> = Jumlah baris</li>
                  <li><strong>c</strong> = Jumlah kolom</li>
                </ul>
                <Separator className="my-3" />
                <p className="text-sm">
                  <strong>Interpretasi:</strong> Nilai mendekati 0 menunjukkan hubungan yang lemah, sementara nilai mendekati 1 
                  menunjukkan hubungan yang kuat.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="bg-muted/10">
        <CardHeader>
          <CardTitle className="text-lg">Tips Praktis untuk Tabel Silang</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-x-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">1</span>
              <div>
                <strong>Gunakan Persentase dengan Bijak:</strong>
                <p className="text-sm text-muted-foreground mt-1">
                  Persentase baris ideal untuk melihat bagaimana distribusi variabel kolom dalam kategori baris tertentu. 
                  Persentase kolom lebih baik untuk membandingkan distribusi variabel baris di antara kategori kolom.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-x-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">2</span>
              <div>
                <strong>Perhatikan Ukuran Sampel Kecil:</strong>
                <p className="text-sm text-muted-foreground mt-1">
                  Uji Chi-Square tidak disarankan ketika lebih dari 20% sel memiliki frekuensi yang diharapkan kurang dari 5, 
                  atau sel mana pun memiliki frekuensi yang diharapkan kurang dari 1.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-x-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">3</span>
              <div>
                <strong>Tampilkan Data Visual:</strong>
                <p className="text-sm text-muted-foreground mt-1">
                  Melengkapi tabel silang dengan visualisasi seperti diagram batang atau heatmap dapat membantu audiens 
                  memahami pola dalam data dengan lebih cepat.
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

