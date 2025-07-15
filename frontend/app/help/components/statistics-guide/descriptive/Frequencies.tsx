import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HelpCircle, BarChart4, Percent, BarChart3, Calculator } from 'lucide-react';

export const Frequencies = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-3">Panduan Analisis Frekuensi</h2>
        <p className="text-muted-foreground">
          Analisis <strong>Frekuensi</strong> menghasilkan tabel ringkasan yang menunjukkan seberapa sering setiap nilai unik 
          dari suatu variabel muncul dalam data. Ini adalah langkah fundamental untuk memeriksa data, terutama untuk 
          variabel kategorikal dan ordinal.
        </p>
      </div>

      <Alert className="bg-blue-50 text-blue-800 border-blue-200">
        <HelpCircle className="h-5 w-5 text-blue-500" />
        <AlertTitle>Bagaimana Cara Menggunakan Fitur Ini?</AlertTitle>
        <AlertDescription className="text-blue-700 mt-2">
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Buka menu <strong>Analyze &gt; Descriptive Statistics &gt; Frequencies</strong></li>
            <li>Pindahkan satu atau lebih variabel yang ingin dianalisis ke dalam kotak <strong>Variable(s)</strong></li>
            <li>(Opsional) Buka tab <strong>Statistics</strong> untuk memilih ukuran statistik tambahan</li>
            <li>(Opsional) Buka tab <strong>Charts</strong> untuk membuat visualisasi dari distribusi frekuensi</li>
            <li>Klik <strong>OK</strong> untuk menjalankan analisis</li>
          </ol>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="table" className="flex gap-2 text-xs sm:text-sm">
            <BarChart4 className="h-4 w-4" /> Tabel Frekuensi
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex gap-2 text-xs sm:text-sm">
            <Calculator className="h-4 w-4" /> Opsi Statistik
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex gap-2 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" /> Visualisasi
          </TabsTrigger>
        </TabsList>

        {/* Tab Tabel Frekuensi */}
        <TabsContent value="table" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Tabel Frekuensi</h3>
            <p className="text-muted-foreground mb-4">
              Secara default, output akan menampilkan tabel frekuensi untuk setiap variabel, yang berisi:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Komponen Tabel Frekuensi</CardTitle>
                <CardDescription>Kolom-kolom utama dalam tabel</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-x-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">•</span>
                    <div>
                      <span className="font-medium">Frequency</span>
                      <p className="text-muted-foreground mt-0.5">Jumlah mentah (hitungan) untuk setiap nilai</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-x-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">•</span>
                    <div>
                      <span className="font-medium">Percent</span>
                      <p className="text-muted-foreground mt-0.5">Persentase setiap nilai dari total kasus, termasuk nilai yang hilang (missing)</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-x-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">•</span>
                    <div>
                      <span className="font-medium">Valid Percent</span>
                      <p className="text-muted-foreground mt-0.5">Persentase setiap nilai dari total kasus yang valid (tidak termasuk nilai yang hilang)</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-x-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">•</span>
                    <div>
                      <span className="font-medium">Cumulative Percent</span>
                      <p className="text-muted-foreground mt-0.5">Persentase kumulatif dari nilai-nilai yang valid, yang dijumlahkan dari nilai terendah hingga tertinggi</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Rumus yang Digunakan</CardTitle>
                <CardDescription>Perhitungan di balik tabel frekuensi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Percent:</h4>
                    <div className="bg-muted/30 p-2 rounded font-mono text-xs">
                      Percent = (Frequency / Total N) × 100%
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Valid Percent:</h4>
                    <div className="bg-muted/30 p-2 rounded font-mono text-xs">
                      Valid Percent = (Frequency / Valid N) × 100%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      dimana Valid N = Total N - Missing N
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Cumulative Percent:</h4>
                    <div className="bg-muted/30 p-2 rounded font-mono text-xs">
                      Cumulative Percent = Σ Valid Percent (dari seluruh kategori sebelumnya)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-xl font-semibold mt-8 mb-4">Contoh Tabel dan Interpretasi</h3>
            <p className="text-muted-foreground mb-6">
              Berikut ini adalah contoh tabel frekuensi untuk variabel &quot;Tingkat Pendidikan Terakhir&quot;.
            </p>
          </div>

          <Card className="overflow-hidden border-border">
            <div className="bg-muted/50 p-3 font-medium text-center">
              Tabel Frekuensi: Tingkat Pendidikan Terakhir
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]"></TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Percent</TableHead>
                    <TableHead>Valid Percent</TableHead>
                    <TableHead>Cumulative Percent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">SMA</TableCell>
                    <TableCell>50</TableCell>
                    <TableCell>45.5</TableCell>
                    <TableCell>50.0</TableCell>
                    <TableCell>50.0</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Diploma</TableCell>
                    <TableCell>20</TableCell>
                    <TableCell>18.2</TableCell>
                    <TableCell>20.0</TableCell>
                    <TableCell>70.0</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Sarjana (S1)</TableCell>
                    <TableCell>30</TableCell>
                    <TableCell>27.3</TableCell>
                    <TableCell>30.0</TableCell>
                    <TableCell>100.0</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-medium">Total</TableCell>
                    <TableCell>100</TableCell>
                    <TableCell>90.9</TableCell>
                    <TableCell>100.0</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-muted-foreground italic">Missing System</TableCell>
                    <TableCell className="italic">10</TableCell>
                    <TableCell className="italic">9.1</TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-medium">Total</TableCell>
                    <TableCell>110</TableCell>
                    <TableCell>100.0</TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Cara Membaca Tabel Frekuensi</CardTitle>
              <CardDescription>Interpretasi hasil analisis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-x-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">1</span>
                  <div>
                    <strong>Frequency:</strong> 
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Ada 50 responden lulusan SMA, 20 lulusan Diploma, dan 30 lulusan Sarjana (S1). 
                      Total ada 100 responden dengan data valid dan 10 data hilang (missing).
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-x-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">2</span>
                  <div>
                    <strong>Percent:</strong> 
                    <p className="text-sm text-muted-foreground mt-0.5">
                      45.5% dari total responden (termasuk yang hilang) adalah lulusan SMA. 
                      Data yang hilang mencakup 9.1% dari total kasus.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-x-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">3</span>
                  <div>
                    <strong>Valid Percent:</strong> 
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Ketika data yang hilang diabaikan, 50% dari responden yang valid adalah lulusan SMA. 
                      Kolom ini sangat berguna untuk memahami proporsi sebenarnya tanpa bias dari data yang hilang.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-x-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">4</span>
                  <div>
                    <strong>Cumulative Percent:</strong> 
                    <p className="text-sm text-muted-foreground mt-0.5">
                      70% dari responden yang valid memiliki pendidikan Diploma atau lebih rendah (50% SMA + 20% Diploma). 
                      100% responden memiliki pendidikan Sarjana (S1) atau lebih rendah. Kolom ini berguna untuk data ordinal.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Opsi Statistik */}
        <TabsContent value="statistics" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Tab Opsi: Statistics</h3>
            <p className="text-muted-foreground mb-4">
              Anda dapat memilih berbagai statistik deskriptif untuk melengkapi tabel frekuensi Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">1</span>
                  Percentile Values
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-x-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5"></span>
                    <div>
                      <span className="font-medium">Quartiles</span>
                      <p className="text-muted-foreground">Membagi data menjadi empat bagian yang sama (persentil ke-25, 50, dan 75)</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-x-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5"></span>
                    <div>
                      <span className="font-medium">Cut points for equal groups</span>
                      <p className="text-muted-foreground">Membagi data menjadi sejumlah kelompok yang Anda tentukan</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-x-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5"></span>
                    <div>
                      <span className="font-medium">Percentiles</span>
                      <p className="text-muted-foreground">Memungkinkan Anda meminta persentil spesifik (misalnya, persentil ke-90)</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">2</span>
                  Central Tendency (Pemusatan)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-x-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5"></span>
                    <div>
                      <span className="font-medium">Mean</span>
                      <p className="text-muted-foreground">Rata-rata nilai</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-x-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5"></span>
                    <div>
                      <span className="font-medium">Median</span>
                      <p className="text-muted-foreground">Nilai tengah</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-x-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5"></span>
                    <div>
                      <span className="font-medium">Mode</span>
                      <p className="text-muted-foreground">Nilai yang paling sering muncul</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-x-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5"></span>
                    <div>
                      <span className="font-medium">Sum</span>
                      <p className="text-muted-foreground">Jumlah total semua nilai</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">3</span>
                  Dispersion (Sebaran)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-x-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5"></span>
                    <div>
                      <span className="font-medium">Std. deviation</span>
                      <p className="text-muted-foreground">Simpangan baku</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-x-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5"></span>
                    <div>
                      <span className="font-medium">Variance</span>
                      <p className="text-muted-foreground">Varians</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-x-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5"></span>
                    <div>
                      <span className="font-medium">Range</span>
                      <p className="text-muted-foreground">Rentang (Maksimum - Minimum)</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-x-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5"></span>
                    <div>
                      <span className="font-medium">Min & Max</span>
                      <p className="text-muted-foreground">Nilai terendah dan tertinggi</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-x-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5"></span>
                    <div>
                      <span className="font-medium">S.E. mean</span>
                      <p className="text-muted-foreground">Standard Error dari Mean</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">4</span>
                  Distribution (Distribusi)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-x-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5"></span>
                    <div>
                      <span className="font-medium">Skewness</span>
                      <p className="text-muted-foreground">Mengukur kemiringan distribusi</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <span className="w-4 h-1.5 bg-primary/60 rounded"></span> &gt; 0: Ekor kanan lebih panjang
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <span className="w-4 h-1.5 bg-primary/60 rounded"></span> &lt; 0: Ekor kiri lebih panjang
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <span className="w-4 h-1.5 bg-primary/60 rounded"></span> = 0: Simetris
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-x-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5"></span>
                    <div>
                      <span className="font-medium">Kurtosis</span>
                      <p className="text-muted-foreground">Mengukur keruncingan puncak distribusi</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <span className="w-4 h-1.5 bg-primary/60 rounded"></span> &gt; 0: Distribusi leptokurtik (runcing)
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <span className="w-4 h-1.5 bg-primary/60 rounded"></span> &lt; 0: Distribusi platikurtik (datar)
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <span className="w-4 h-1.5 bg-primary/60 rounded"></span> = 0: Distribusi mesokurtik (normal)
                      </div>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Visualisasi */}
        <TabsContent value="charts" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Tab Opsi: Charts</h3>
            <p className="text-muted-foreground mb-4">
              Anda dapat membuat grafik untuk memvisualisasikan distribusi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bar Chart</CardTitle>
                <CardDescription>Diagram batang untuk data kategorikal</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-3">
                <div className="aspect-square w-full max-w-[180px] bg-muted/30 rounded-md flex items-center justify-center">
                  <BarChart4 className="h-20 w-20 text-primary/40" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Pilihan yang baik untuk variabel kategorikal
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pie Chart</CardTitle>
                <CardDescription>Diagram lingkaran untuk proporsi</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-3">
                <div className="aspect-square w-full max-w-[180px] bg-muted/30 rounded-md flex items-center justify-center">
                  <Percent className="h-20 w-20 text-primary/40" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Menunjukkan proporsi setiap kategori terhadap keseluruhan
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histogram</CardTitle>
                <CardDescription>Untuk variabel numerik kontinu</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-3">
                <div className="aspect-square w-full max-w-[180px] bg-muted/30 rounded-md flex items-center justify-center">
                  <BarChart3 className="h-20 w-20 text-primary/40" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Ideal untuk variabel numerik kontinu dengan opsi kurva normal
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Opsi Chart Values</CardTitle>
              <CardDescription>Pilihan untuk nilai yang ditampilkan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-md flex flex-col items-center">
                  <span className="font-medium mb-1">Frequencies</span>
                  <p className="text-sm text-muted-foreground text-center">Menampilkan hitungan absolut pada sumbu</p>
                  <div className="flex items-end justify-center gap-2 mt-4">
                    <div className="h-16 w-8 bg-primary/60 rounded"></div>
                    <div className="h-12 w-8 bg-primary/60 rounded"></div>
                    <div className="h-20 w-8 bg-primary/60 rounded"></div>
                  </div>
                  <div className="mt-2 flex justify-between w-full max-w-[8rem] text-xs">
                    <span>50</span>
                    <span>20</span>
                    <span>30</span>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-md flex flex-col items-center">
                  <span className="font-medium mb-1">Percentages</span>
                  <p className="text-sm text-muted-foreground text-center">Menampilkan persentase pada sumbu</p>
                  <div className="flex items-end justify-center gap-2 mt-4">
                    <div className="h-16 w-8 bg-primary/60 rounded"></div>
                    <div className="h-12 w-8 bg-primary/60 rounded"></div>
                    <div className="h-20 w-8 bg-primary/60 rounded"></div>
                  </div>
                  <div className="mt-2 flex justify-between w-full max-w-[8rem] text-xs">
                    <span>50%</span>
                    <span>20%</span>
                    <span>30%</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 text-xs text-muted-foreground px-6 py-3">
              <p>
                Tip: Gunakan persentase saat membandingkan dataset dengan ukuran berbeda, dan frekuensi saat ukuran aktual penting.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

