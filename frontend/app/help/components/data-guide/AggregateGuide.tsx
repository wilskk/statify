/* eslint-disable react/no-unescaped-entities */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const AggregateGuide = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fitur Agregasi Data</CardTitle>
        <CardDescription>
          Dokumen ini menjelaskan fungsionalitas fitur Agregasi Data, yang
          memungkinkan pengguna untuk menggabungkan data menjadi statistik
          ringkasan di seluruh grup.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">Gambaran Umum</h3>
          <p>
            Fitur Agregasi Data memungkinkan pengguna untuk mengagregasi data
            dengan membuat statistik ringkasan untuk variabel tertentu dalam
            grup yang ditentukan oleh variabel pemisah. Ini berguna untuk
            meringkas informasi, menghitung rata-rata grup, menemukan nilai
            maksimum per grup, menghitung kemunculan, dan banyak lagi.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">Penjelasan Opsi</h3>
          <div className="ml-4 space-y-2">
            <h4 className="font-semibold">Konfigurasi Variabel</h4>
            <div className="ml-4 space-y-2">
              <h5 className="font-semibold">Variabel Pemisah (Break Variable(s))</h5>
              <p>
                Variabel-variabel ini mendefinisikan grup untuk agregasi.
                Setiap kombinasi unik dari nilai dalam variabel pemisah akan
                membuat sebuah grup. Misalnya, jika "Gender" dan "Region"
                adalah variabel pemisah, data akan diagregasi secara terpisah
                untuk setiap kombinasi Gender-Region.
              </p>
              <h5 className="font-semibold">Variabel Agregat (Aggregated Variables)</h5>
              <p>
                Ini adalah variabel yang akan diringkas. Untuk setiap
                variabel yang dipilih, Anda dapat menerapkan fungsi agregasi
                untuk menghitung statistik untuk setiap grup yang ditentukan
                oleh variabel pemisah.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg">Fungsi Agregasi</h3>
          <p>
            Fitur ini menyediakan beberapa kategori fungsi agregasi:
          </p>
          <div className="ml-4 mt-2 space-y-2">
            <h4 className="font-semibold">Statistik Ringkasan</h4>
            <ul className="list-disc list-inside ml-4">
              <li>
                <strong>Mean</strong>: Menghitung nilai rata-rata di seluruh
                kasus di setiap grup.
              </li>
              <li>
                <strong>Median</strong>: Menemukan nilai tengah di setiap
                grup saat nilai diurutkan.
              </li>
              <li>
                <strong>Sum</strong>: Menghitung total semua nilai di setiap
                grup.
              </li>
              <li>
                <strong>Standard Deviation</strong>: Mengukur jumlah variasi
                di dalam setiap grup.
              </li>
            </ul>

            <h4 className="font-semibold">Nilai Spesifik</h4>
            <ul className="list-disc list-inside ml-4">
              <li>
                <strong>First</strong>: Mengambil nilai pertama yang ditemui
                di setiap grup.
              </li>
              <li>
                <strong>Last</strong>: Mengambil nilai terakhir yang ditemui
                di setiap grup.
              </li>
              <li>
                <strong>Minimum</strong>: Menemukan nilai terkecil di setiap
                grup.
              </li>
              <li>
                <strong>Maximum</strong>: Menemukan nilai terbesar di setiap
                grup.
              </li>
            </ul>
            <h4 className="font-semibold">Jumlah Kasus</h4>
            <p>
              <em>
                Catatan: Istilah "Weighted" dan "Unweighted" didasarkan pada
                terminologi SPSS. Saat ini, fitur ini tidak mendukung
                variabel bobot kasus, sehingga semua hitungan secara efektif
                tidak diboboti.
              </em>
            </p>
            <ul className="list-disc list-inside ml-4">
              <li>
                <strong>Weighted (N)</strong>: Menghitung jumlah kasus di
                setiap grup di mana variabel sumber memiliki nilai yang tidak
                hilang.
              </li>
              <li>
                <strong>Weighted Missing (NMISS)</strong>: Menghitung jumlah
                kasus di setiap grup di mana variabel sumber memiliki nilai
                yang hilang.
              </li>
              <li>
                <strong>Unweighted (NU)</strong>: Menghitung jumlah total
                kasus di setiap grup.
              </li>
              <li>
                <strong>Unweighted Missing (NUMISS)</strong>: Menghitung
                jumlah kasus di setiap grup di mana variabel sumber memiliki
                nilai yang hilang.
              </li>
            </ul>
            <h4 className="font-semibold">Persentase, Fraksi, Hitungan</h4>
            <ul className="list-disc list-inside ml-4">
              <li>
                <strong>Persentase</strong>: Menghitung persentase kasus yang
                memenuhi kriteria tertentu.
                <ul className="list-disc list-inside ml-6">
                  <li>
                    <strong>Di Atas</strong>: Persentase kasus di atas nilai
                    yang ditentukan.
                  </li>
                  <li>
                    <strong>Di Bawah</strong>: Persentase kasus di bawah
                    nilai yang ditentukan.
                  </li>
                  <li>
                    <strong>Di Dalam</strong>: Persentase kasus di antara dua
                    nilai yang ditentukan.
                  </li>
                  <li>
                    <strong>Di Luar</strong>: Persentase kasus di luar
                    rentang nilai yang ditentukan.
                  </li>
                </ul>
              </li>
              <li>
                <strong>Fraksi</strong>: Mirip dengan persentase tetapi
                dinyatakan sebagai proporsi (0-1 bukan 0-100).
              </li>
              <li>
                <strong>Hitungan</strong>: Penghitungan sederhana kasus yang
                memenuhi kriteria.
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AggregateGuide; 