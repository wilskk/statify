/* eslint-disable react/no-unescaped-entities */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const TransposeGuide = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fitur: Transpose Data</CardTitle>
        <CardDescription>
          Dokumen ini menjelaskan fungsionalitas fitur "Transpose", sebuah alat
          yang kuat untuk merestrukturisasi dataset dengan menukar baris dan
          kolom.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">
            1. Antarmuka & Fungsionalitas Komponen
          </h3>
          <ul className="list-disc list-inside ml-4">
            <li>
              <strong>Daftar Variabel (Available Variables)</strong>: Menampilkan
              semua variabel yang tersedia dalam dataset saat ini.
            </li>
            <li>
              <strong>Variabel yang Akan Ditransposisi (Variable(s))</strong>:
              Daftar ini menampung variabel-variabel yang telah Anda pilih untuk
              diubah menjadi baris dalam dataset yang baru.
            </li>
            <li>
              <strong>Variabel Penamaan (Name Variable)</strong>: Kolom ini
              bersifat opsional. Anda dapat memindahkan <strong>satu</strong>{' '}
              variabel ke sini. Nilai dari setiap baris pada variabel ini akan
              digunakan sebagai nama untuk variabel (kolom) baru yang akan
              dibuat.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg">
            2. Variabel Baru yang Dihasilkan
          </h3>
          <ul className="list-disc list-inside ml-4">
            <li>
              <strong>
                <code>case_lbl</code>
              </strong>
              : Variabel ini dibuat secara otomatis. Kolom ini akan berisi
              nama-nama dari variabel asli yang Anda pilih untuk ditransposisi.
            </li>
            <li>
              <strong>Variabel Kasus Baru</strong>: Variabel-variabel baru
              (kolom) akan dibuat, satu untuk setiap kasus (baris) dalam data
              asli.
              <ul className="list-disc list-inside ml-6">
                <li>
                  Jika <strong>Variabel Penamaan</strong> tidak disediakan,
                  nama-nama kolom baru akan menjadi `Var1`, `Var2`, `Var3`, dan
                  seterusnya.
                </li>
                <li>
                  Jika <strong>Variabel Penamaan</strong> disediakan, nama-nama
                  kolom baru akan diambil dari nilai-nilai pada variabel
                  tersebut.
                </li>
              </ul>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg">3. Contoh Penggunaan</h3>
          <div className="ml-4 mt-2 space-y-4">
            <div>
              <h4 className="font-semibold">
                Skenario 1: Transposisi Sederhana (Wide to Long)
              </h4>
              <p>
                Anda memiliki data penjualan per kuartal dengan kolom `Q1`,
                `Q2`, `Q3`, `Q4`. Anda ingin setiap kuartal menjadi baris.
              </p>
              <ol className="list-decimal list-inside ml-4">
                <li>
                  Pindahkan variabel `Q1`, `Q2`, `Q3`, dan `Q4` ke dalam daftar
                  "Variable(s)".
                </li>
                <li>Biarkan "Name Variable" kosong.</li>
                <li>Klik OK.</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold">
                Skenario 2: Menggunakan Nilai sebagai Nama Kolom
              </h4>
              <p>
                Anda memiliki data tahunan dengan kolom `ID_Produk`,
                `Tahun_2020`, `Tahun_2021`, `Tahun_2022`. Anda ingin setiap tahun
                menjadi baris dan menggunakan `ID_Produk` sebagai nama kolom
                baru.
              </p>
              <ol className="list-decimal list-inside ml-4">
                <li>
                  Pindahkan `Tahun_2020`, `Tahun_2021`, `Tahun_2022` ke daftar
                  "Variable(s)".
                </li>
                <li>Pindahkan `ID_Produk` ke daftar "Name Variable".</li>
                <li>Klik OK.</li>
              </ol>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransposeGuide; 