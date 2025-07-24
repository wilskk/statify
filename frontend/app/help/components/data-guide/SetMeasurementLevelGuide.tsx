import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const SetMeasurementLevelGuide = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fitur: Atur Tingkat Pengukuran</CardTitle>
        <CardDescription>
          Dokumen ini memberikan gambaran tentang fitur &quot;Atur Tingkat Pengukuran&quot;
          yang memungkinkan pengguna untuk secara efisien
          mendefinisikan tingkat pengukuran (Nominal, Ordinal, atau Scale)
          untuk variabel yang tingkat pengukurannya saat ini &quot;Tidak Diketahui&quot;.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">1. Gambaran Umum</h3>
          <p>
            Fitur ini dirancang untuk mempercepat proses penentuan tipe data.
            Saat dibuka, modal secara otomatis mendeteksi dan menampilkan semua
            variabel dalam dataset yang tingkat pengukurannya belum ditentukan
            (`unknown`). Pengguna dapat dengan mudah memindahkan variabel-variabel
            ini ke kategori yang sesuai menggunakan antarmuka yang intuitif.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">2. Antarmuka dan Komponen</h3>
          <ul className="list-disc list-inside ml-4">
            <li>
              <strong>Daftar Variabel yang Belum Diketahui (Available)</strong>:
              Menampilkan semua variabel dengan tingkat pengukuran `unknown`.
            </li>
            <li>
              <strong>Daftar Target</strong>: Tiga kotak terpisah untuk
              menampung variabel:
              <ul className="list-disc list-inside ml-6">
                <li>
                  <strong>Nominal</strong>: Untuk data kualitatif tanpa urutan
                  (misalnya, &apos;Jenis Kelamin&apos;, &apos;Kota&apos;).
                </li>
                <li>
                  <strong>Ordinal</strong>: Untuk data kualitatif dengan urutan
                  (misalnya, &apos;Tingkat Pendidikan&apos;, &apos;Kepuasan Pelanggan&apos;).
                </li>
                <li>
                  <strong>Scale</strong>: Untuk data kuantitatif/numerik
                  (misalnya, &apos;Usia&apos;, &apos;Pendapatan&apos;).
                </li>
              </ul>
            </li>
            <li>
              <strong>Tombol Panah</strong>: Memungkinkan pemindahan variabel
              yang disorot dari daftar &quot;Available&quot; ke daftar target yang
              sesuai.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg">
            3. Alur Kerja dan Contoh Penggunaan
          </h3>
          <ol className="list-decimal list-inside ml-4">
            <li>
              <strong>Inisialisasi</strong>: Pengguna membuka modal, dan semua
              variabel `unknown` dimuat.
            </li>
            <li>
              <strong>Interaksi Pengguna</strong>: Pengguna memilih satu atau
              lebih variabel dan menggunakan tombol panah untuk memindahkannya ke
              daftar `Nominal`, `Ordinal`, atau `Scale`.
            </li>
            <li>
              <strong>Penyimpanan</strong>: Pengguna mengklik **OK**, dan
              tingkat pengukuran untuk variabel yang dipindahkan diperbarui
              secara permanen.
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default SetMeasurementLevelGuide; 