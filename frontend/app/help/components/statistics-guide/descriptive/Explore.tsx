import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HelpCircle, BarChart4, Activity, Microscope, Box, LineChart } from 'lucide-react';

export const Explore = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-3">Panduan Analisis Explore</h2>
        <p className="text-muted-foreground">
          Fitur <strong>Explore</strong> digunakan untuk memeriksa distribusi variabel numerik secara lebih mendalam. 
          Analisis ini sangat berguna untuk mengidentifikasi outlier, memeriksa asumsi normalitas, dan membandingkan 
          distribusi antar kelompok.
        </p>
      </div>

      <Alert className="bg-blue-50 text-blue-800 border-blue-200">
        <HelpCircle className="h-5 w-5 text-blue-500" />
        <AlertTitle>Bagaimana Cara Menggunakan Fitur Ini?</AlertTitle>
        <AlertDescription className="text-blue-700 mt-2">
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Buka menu <strong>Analyze &gt; Descriptive Statistics &gt; Explore</strong></li>
            <li>Masukkan satu atau lebih variabel numerik ke dalam daftar <strong>Dependent List</strong></li>
            <li>(Opsional) Masukkan variabel kategorikal ke dalam <strong>Factor List</strong> untuk memisahkan hasil berdasarkan kelompok</li>
            <li>(Opsional) Gunakan <strong>Label cases by</strong> untuk memberi label pada outlier di plot</li>
            <li>Klik tab <strong>Statistics</strong> untuk memilih statistik deskriptif yang diinginkan</li>
            <li>Klik tab <strong>Plots</strong> untuk memilih visualisasi seperti <strong>Stem-and-leaf</strong> (Batang-Daun) dan <strong>Boxplots</strong></li>
            <li>Klik <strong>OK</strong> untuk menjalankan analisis</li>
          </ol>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="statistics" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="statistics" className="flex gap-2 text-xs sm:text-sm">
            <BarChart4 className="h-4 w-4" /> Statistik Deskriptif
          </TabsTrigger>
          <TabsTrigger value="plots" className="flex gap-2 text-xs sm:text-sm">
            <Box className="h-4 w-4" /> Plot & Visualisasi
          </TabsTrigger>
          <TabsTrigger value="examples" className="flex gap-2 text-xs sm:text-sm">
            <Microscope className="h-4 w-4" /> Contoh Interpretasi
          </TabsTrigger>
        </TabsList>

        {/* Tab Statistik Deskriptif */}
        <TabsContent value="statistics" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Output: Tabel Deskriptif</h3>
            <p className="text-muted-foreground mb-4">
              Tabel ini memberikan ringkasan statistik yang komprehensif untuk setiap variabel dependen (dan untuk setiap kelompok jika faktor ditentukan).
            </p>
          </div>

          <Card className="overflow-hidden border-border">
            <div className="bg-muted/50 p-3 font-medium text-center">Contoh Output Tabel Deskriptif: Nilai Ujian</div>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Statistik</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead className="hidden sm:table-cell">Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Mean</TableCell>
                    <TableCell>75.3</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">Rata-rata nilai ujian</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">95% CI for Mean (Lower)</TableCell>
                    <TableCell>73.1</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">Batas bawah interval kepercayaan 95%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">95% CI for Mean (Upper)</TableCell>
                    <TableCell>77.5</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">Batas atas interval kepercayaan 95%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">5% Trimmed Mean</TableCell>
                    <TableCell>75.8</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">Mean yang dihitung setelah membuang 5% nilai tertinggi dan 5% nilai terendah</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Median</TableCell>
                    <TableCell>76.0</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">Nilai tengah</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Variance</TableCell>
                    <TableCell>64.3</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">Varians</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Std. Deviation</TableCell>
                    <TableCell>8.02</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">Simpangan baku</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Statistik Lokasi & Pemusatan</CardTitle>
                <CardDescription>Mengukur titik pusat data</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-x-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">•</span>
                    <div>
                      <span className="font-medium">Mean, Median</span>
                      <p className="text-muted-foreground mt-0.5">Ukuran pemusatan data yang umum digunakan</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-x-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">•</span>
                    <div>
                      <span className="font-medium">5% Trimmed Mean</span>
                      <p className="text-muted-foreground mt-0.5">Mean yang dihitung setelah membuang 5% nilai tertinggi dan 5% nilai terendah, mengurangi pengaruh outlier</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-x-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">•</span>
                    <div>
                      <span className="font-medium">95% Confidence Interval for Mean</span>
                      <p className="text-muted-foreground mt-0.5">Rentang di mana mean populasi sebenarnya kemungkinan besar berada</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Statistik Sebaran & Variabilitas</CardTitle>
                <CardDescription>Mengukur penyebaran data</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-x-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">•</span>
                    <div>
                      <span className="font-medium">Variance, Std. Deviation</span>
                      <p className="text-muted-foreground mt-0.5">Mengukur seberapa jauh data tersebar dari mean</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-x-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">•</span>
                    <div>
                      <span className="font-medium">Min, Max, Range</span>
                      <p className="text-muted-foreground mt-0.5">Nilai terkecil, nilai terbesar, dan selisihnya</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-x-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">•</span>
                    <div>
                      <span className="font-medium">Interquartile Range (IQR)</span>
                      <p className="text-muted-foreground mt-0.5">Rentang antara kuartil ketiga (Q3) dan kuartil pertama (Q1), berguna untuk mengidentifikasi outlier</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Plot & Visualisasi */}
        <TabsContent value="plots" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Plot dan Visualisasi</h3>
            <p className="text-muted-foreground mb-4">
              Fitur Explore menyediakan beberapa visualisasi untuk membantu memahami distribusi data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plot Batang-Daun (Stem-and-Leaf)</CardTitle>
                <CardDescription>Menampilkan distribusi data sekaligus mempertahankan nilai asli</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/20 p-3 rounded-md font-mono text-xs md:text-sm">
                  <div className="mb-2 font-medium">Stem-and-Leaf Plot: Nilai Ujian</div>
                  <div className="grid grid-cols-[auto_1fr] gap-x-4">
                    <div>Frequency</div><div>Stem &nbsp; Leaf</div>
                    <div>3.00</div><div>6 &nbsp;&nbsp; 0 2 5</div>
                    <div>5.00</div><div>7 &nbsp;&nbsp; 0 3 5 7 8</div>
                    <div>4.00</div><div>8 &nbsp;&nbsp; 1 3 5 8</div>
                    <div>2.00</div><div>9 &nbsp;&nbsp; 0 5</div>
                  </div>
                  <div className="mt-2 text-muted-foreground">Stem width: 10</div>
                  <div className="text-muted-foreground">Each leaf: 1 case</div>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-sm">
                    <strong>Cara Membaca:</strong> Untuk nilai 60, &quot;6&quot; adalah stem (batang) dan &quot;0&quot; adalah leaf (daun). 
                    Plot ini menunjukkan bahwa nilai ujian berkisar dari 60 hingga 95, dengan frekuensi paling tinggi di range 70-79.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Boxplot</CardTitle>
                <CardDescription>Ringkasan visual dari distribusi data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video bg-muted/30 rounded-md flex items-center justify-center">
                  <Box className="h-24 w-24 text-primary/40" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Komponen Boxplot:</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-x-2">
                      <span className="w-3 h-3 bg-primary/80 rounded-full"></span>
                      <span><strong>Kotak (Box):</strong> Mewakili 50% data di tengah (IQR), dari Q1 hingga Q3</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <span className="w-3 h-3 bg-primary/80 rounded-full"></span>
                      <span><strong>Garis di dalam Kotak:</strong> Menandakan median</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <span className="w-3 h-3 bg-primary/80 rounded-full"></span>
                      <span><strong>Garis (Whiskers):</strong> Memanjang hingga 1.5 kali IQR dari Q1 dan Q3</span>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <span className="w-3 h-3 bg-primary/80 rounded-full"></span>
                      <span><strong>Titik:</strong> Mengidentifikasi outlier di luar jangkauan garis</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 px-6 py-3 text-xs text-muted-foreground">
                Boxplot sangat berguna untuk membandingkan distribusi antara beberapa kelompok dan mengidentifikasi outlier.
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tests of Normality</CardTitle>
              <CardDescription>Pengujian untuk memeriksa normalitas data</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Prosedur Explore juga menyediakan beberapa tes formal untuk mengecek apakah data mengikuti distribusi normal:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">1. Kolmogorov-Smirnov</h4>
                  <p className="text-sm text-muted-foreground">
                    Membandingkan distribusi kumulatif dari data dengan distribusi kumulatif normal teoritis. 
                    Nilai signifikansi &gt; 0.05 menunjukkan distribusi normal.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">2. Shapiro-Wilk</h4>
                  <p className="text-sm text-muted-foreground">
                    Lebih disukai untuk sampel kecil (n &lt; 50). Memiliki kekuatan statistik yang lebih baik 
                    daripada Kolmogorov-Smirnov dalam mendeteksi ketidaknormalan.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">3. Normal Q-Q Plot</h4>
                  <p className="text-sm text-muted-foreground">
                    Plot yang membandingkan kuantil dari data dengan kuantil distribusi normal teoritis. 
                    Data yang mengikuti garis lurus menunjukkan distribusi normal.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">4. Detrended Normal Q-Q Plot</h4>
                  <p className="text-sm text-muted-foreground">
                    Menampilkan deviasi dari garis normal. Penyimpangan yang lebih besar dari garis horizontal 
                    menunjukkan deviasi dari normalitas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Contoh Interpretasi */}
        <TabsContent value="examples" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Contoh Interpretasi Output Explore</h3>
            <p className="text-muted-foreground mb-4">
              Berikut adalah contoh bagaimana menginterpretasikan hasil dari analisis Explore pada data nilai ujian siswa 
              berdasarkan jenis sekolah.
            </p>
          </div>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Skenario: Perbandingan Nilai Ujian Berdasarkan Jenis Sekolah</CardTitle>
              <CardDescription>
                Data berisi nilai ujian matematika untuk 90 siswa dari tiga jenis sekolah: Negeri, Swasta, dan Internasional
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">1. Melihat Statistik Deskriptif</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Temuan:</strong> Rata-rata nilai ujian tertinggi adalah dari sekolah Internasional (85.6), 
                  diikuti oleh sekolah Swasta (76.2), dan sekolah Negeri (72.8).
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Interpretasi:</strong> Ada perbedaan rata-rata nilai antara ketiga jenis sekolah. 
                  Namun, kita perlu memeriksa apakah perbedaan ini signifikan secara statistik dengan uji lanjutan seperti ANOVA.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">2. Memeriksa Boxplot</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Temuan:</strong> Boxplot menunjukkan bahwa sekolah Internasional memiliki median tertinggi dan 
                  varians terkecil (kotak lebih pendek). Sekolah Negeri memiliki beberapa outlier di sisi bawah.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Interpretasi:</strong> Siswa sekolah Internasional tidak hanya memiliki nilai rata-rata yang lebih tinggi 
                  tetapi juga lebih konsisten (variasi nilai lebih kecil). Ada beberapa siswa sekolah Negeri dengan nilai yang sangat rendah.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">3. Memeriksa Normalitas</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Temuan:</strong> Tes Shapiro-Wilk menunjukkan p-value &gt; 0.05 untuk semua kelompok, dan plot Q-Q cukup mengikuti garis lurus.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Interpretasi:</strong> Data nilai ujian untuk ketiga jenis sekolah cukup mengikuti distribusi normal. 
                  Ini memungkinkan kita untuk menggunakan uji parametrik seperti ANOVA untuk analisis lebih lanjut.
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-blue-50 text-blue-800 border-t border-blue-100 p-4">
              <Activity className="h-5 w-5 mr-2 text-blue-500" /> 
              <div>
                <p className="text-sm font-medium">Kesimpulan Analisis:</p>
                <p className="text-xs mt-1">
                  Dari analisis Explore, kita dapat menyimpulkan bahwa terdapat perbedaan dalam distribusi nilai ujian 
                  di antara tiga jenis sekolah. Sekolah Internasional menunjukkan performa terbaik dengan nilai rata-rata 
                  tertinggi dan variasi terkecil. Untuk konfirmasi statistik tentang signifikansi perbedaan ini, 
                  lanjutkan dengan analisis ANOVA.
                </p>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
