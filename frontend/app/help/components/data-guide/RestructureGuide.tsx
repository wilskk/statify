/* eslint-disable react/no-unescaped-entities */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const RestructureGuide = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Panduan Restrukturisasi Data</CardTitle>
        <CardDescription>
          Komponen ini menyediakan wizard multi-langkah yang ramah pengguna
          untuk merestrukturisasi dataset, mirip dengan Panduan Restrukturisasi
          Data yang ditemukan di perangkat lunak statistik seperti SPSS. Ini
          memungkinkan pengguna untuk mengubah data antara format "lebar" dan
          "panjang", atau mentranspos seluruh dataset.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">
            2. Metode Restrukturisasi Dijelaskan
          </h3>
          <div className="ml-4 mt-2 space-y-4">
            <div>
              <h4 className="font-semibold">Variabel menjadi Kasus</h4>
              <p>
                Metode ini mengubah beberapa variabel (kolom) menjadi sejumlah
                kecil variabel baru dengan membuat kasus (baris) baru. Ini
                biasa digunakan untuk mengubah data dari format "lebar" menjadi
                format "panjang", yang sering diperlukan untuk analisis ukuran
                berulang.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Kasus menjadi Variabel</h4>
              <p>
                Ini adalah kebalikan dari metode sebelumnya, mengubah beberapa
                kasus (baris) menjadi variabel (kolom). Ini digunakan untuk
                mengubah data dari format "panjang" menjadi format "lebar".
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Transpos Semua Data</h4>
              <p>
                Metode ini melakukan transposisi sederhana namun lengkap dari
                seluruh dataset, menukar semua baris dan kolom.
              </p>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-lg">3. Logika dan Alur Wizard</h3>
          <p>
            Wizard memandu pengguna melalui proses tiga langkah, yang ditegakkan
            oleh navigasi tab yang diaktifkan atau dinonaktifkan berdasarkan
            penyelesaian langkah.
          </p>
          <div className="ml-4 mt-2 space-y-4">
            <div>
              <h4 className="font-semibold">
                Langkah 1: Pilih Metode Restrukturisasi
              </h4>
              <p>
                Pengguna memilih salah satu dari tiga metode restrukturisasi
                yang dijelaskan di atas.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Langkah 2: Konfigurasi Variabel</h4>
              <p>
                Berdasarkan metode yang dipilih, pengguna mengkonfigurasi
                variabel untuk operasi menggunakan antarmuka seret dan lepas:
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>
                  <strong>Untuk "Variabel menjadi Kasus"</strong>:
                  <ul className="list-disc list-inside ml-6">
                    <li>
                      <strong>Variabel untuk Direstrukturisasi</strong>: Set
                      variabel (kolom) yang akan diubah menjadi baris.
                    </li>
                    <li>
                      <strong>Variabel Indeks</strong>: Variabel yang
                      mengidentifikasi grup kasus baru (misalnya, ID subjek)
                      dan akan diulang untuk setiap baris baru.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Untuk "Kasus menjadi Variabel"</strong>:
                  <ul className="list-disc list-inside ml-6">
                    <li>
                      <strong>Variabel untuk Direstrukturisasi</strong>:
                      Variabel yang nilainya akan direstrukturisasi menjadi
                      kolom baru (misalnya, Skor).
                    </li>
                    <li>
                      <strong>Variabel Pengenal</strong>: Variabel yang nilai
                      uniknya akan membentuk nama kolom baru (misalnya,
                      variabel Waktu dengan nilai 1, 2, 3).
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Untuk "Transpos Semua Data"</strong>: Langkah ini
                  dilewati karena tidak diperlukan pemilihan variabel.
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">
                Langkah 3: Atur Opsi dan Selesaikan
              </h4>
              <p>
                Pengguna mengkonfigurasi opsi akhir yang spesifik untuk metode
                sebelum eksekusi:
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>
                  <strong>Untuk "Variabel menjadi Kasus"</strong>:
                  <ul className="list-disc list-inside ml-6">
                    <li>
                      <code>Buat variabel hitungan</code>: Menambahkan kolom
                      yang menghitung nilai yang tidak hilang dari variabel
                      restrukturisasi asli.
                    </li>
                    <li>
                      <code>Buat variabel indeks</code>: Menambahkan kolom yang
                      mengidentifikasi nama variabel asli untuk setiap kasus
                      baru.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Untuk "Kasus menjadi Variabel"</strong>:
                  <ul className="list-disc list-inside ml-6">
                    <li>
                      <code>Buang variabel kosong</code>: Menghapus kolom baru
                      yang hanya berisi nilai yang hilang setelah
                      restrukturisasi.
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RestructureGuide; 