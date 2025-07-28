/* eslint-disable react/no-unescaped-entities */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const DefineDateTimeGuide = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fitur Tentukan Tanggal</CardTitle>
        <CardDescription>
          Dokumen ini menguraikan fungsionalitas dan arsitektur fitur "Tentukan
          Tanggal", yang memungkinkan pengguna untuk membuat struktur berbasis
          waktu untuk dataset mereka.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">1. Gambaran Umum</h3>
          <p>
            Fitur "Tentukan Tanggal" menyediakan antarmuka yang ramah pengguna
            untuk membangun kerangka kerja kronologis untuk data deret waktu.
            Ketika pengguna memilih format tanggal dan waktu yang telah
            ditentukan (misalnya, "Tahun, kuartal, bulan"), modul ini secara
            otomatis:
          </p>
          <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
            <li>
              <strong>Membuat Variabel Baru</strong>: Menghasilkan variabel
              terpisah untuk setiap komponen waktu yang ditentukan dalam format
              (misalnya, <code>YEAR_</code>, <code>QUARTER_</code>,{' '}
              <code>MONTH_</code>).
            </li>
            <li>
              <strong>Menghasilkan Variabel Tanggal Berformat</strong>:
              Membuat satu variabel string bernama <code>DATE_</code> yang
              menampilkan entri tanggal lengkap yang diformat untuk setiap
              kasus.
            </li>
            <li>
              <strong>Mengisi dengan Data Sampel</strong>: Mengisi
              variabel-variabel yang baru dibuat dengan nilai tanggal dan waktu
              berurutan untuk 20 baris pertama (atau jumlah total baris yang
              ada jika kurang dari 20) untuk memberikan representasi visual
              langsung dari struktur.
            </li>
            <li>
              <strong>Menyimpan Metadata</strong>: Menyimpan konfigurasi format
              tanggal yang dipilih dalam metadata aplikasi, memungkinkan fitur
              deret waktu lainnya untuk mengenali dan memanfaatkan struktur
              ini.
            </li>
          </ol>
        </div>

        <div>
          <h3 className="font-semibold text-lg">
            2. Spesifikasi & Contoh Fitur
          </h3>
          <p>
            Bagian ini merinci perilaku fitur "Tentukan Tanggal" untuk berbagai
            konfigurasi. Sistem menghasilkan variabel baru berdasarkan pilihan
            pengguna dan mengisinya dengan data berurutan.
          </p>
          <div className="space-y-4 mt-2">
            <div>
              <h4 className="font-semibold">Contoh 1: Tahun dan Bulan</h4>
              <p>
                Contoh ini menunjukkan logika carry-over dari{' '}
                <code>MONTH_</code> ke <code>YEAR_</code>.
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>
                  <strong>Pilihan Pengguna</strong>: <code>Tahun, bulan</code>
                </li>
                <li>
                  <strong>Input Kasus Pertama</strong>:{' '}
                  <code>Tahun: 2022</code>, <code>Bulan: 11</code>
                </li>
                <li>
                  <strong>Variabel Baru yang Dihasilkan</strong>:
                  <ul className="list-disc list-inside ml-6">
                    <li>
                      <code>YEAR_</code> (Numerik, Label: 'YEAR, not periodic')
                    </li>
                    <li>
                      <code>MONTH_</code> (Numerik, Label: 'MONTH, period 12')
                    </li>
                    <li>
                      <code>DATE_</code> (String, Label: 'Date. Format:
                      YYYY-MM')
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">
                Contoh 2: Minggu dan Hari Kerja
              </h4>
              <p>
                Contoh ini menunjukkan periodisitas dengan 5 hari kerja dalam
                seminggu.
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>
                  <strong>Pilihan Pengguna</strong>:{' '}
                  <code>Minggu, hari kerja (5)</code>
                </li>
                <li>
                  <strong>Input Kasus Pertama</strong>: <code>Minggu: 51</code>,{' '}
                  <code>Hari kerja: 4</code>
                </li>
                <li>
                  <strong>Variabel Baru yang Dihasilkan</strong>:
                  <ul className="list-disc list-inside ml-6">
                    <li>
                      <code>WEEK_</code> (Numerik, Label: 'WEEK, not periodic')
                    </li>
                    <li>
                      <code>WORK DAY_</code> (Numerik, Label: 'WORK DAY, period
                      5')
                    </li>
                    <li>
                      <code>DATE_</code> (String, Label: 'Date. Format: WW-D')
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg">3. Fitur yang Diimplementasikan</h3>
          <p>
            Daftar berikut berisi semua format yang saat ini didukung yang
            dapat dipilih dalam daftar "Kasus Adalah". Setiap opsi menghasilkan
            variabel komponen waktu yang sesuai dan variabel <code>DATE_</code>{' '}
            yang diformat.
          </p>
          <ul className="list-disc list-inside ml-4 grid grid-cols-2 gap-x-4">
            <li>Tahun</li>
            <li>Tahun, kuartal</li>
            <li>Tahun, bulan</li>
            <li>Tahun, kuartal, bulan</li>
            <li>Hari</li>
            <li>Minggu, hari</li>
            <li>Minggu, hari kerja (5)</li>
            <li>Minggu, hari kerja (6)</li>
            <li>Jam</li>
            <li>Hari, jam</li>
            <li>Hari, jam kerja (8)</li>
            <li>Minggu, hari, jam</li>
            <li>Minggu, hari kerja, jam</li>
            <li>Menit</li>
            <li>Jam, menit</li>
            <li>Hari, jam, menit</li>
            <li>Detik</li>
            <li>Menit, detik</li>
            <li>Jam, menit, detik</li>
            <li>Tidak bertanggal (Menghapus definisi tanggal yang ada)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DefineDateTimeGuide; 