/* eslint-disable react/no-unescaped-entities */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const DefineVarPropsGuide = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fitur Tentukan Properti Variabel</CardTitle>
        <CardDescription>
          Dokumen ini menjelaskan fungsionalitas dan arsitektur fitur "Tentukan
          Properti Variabel", sebuah modal dua langkah yang dirancang untuk
          konfigurasi variabel terperinci berdasarkan data yang dipindai.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">1. Gambaran Umum</h3>
          <p>
            Fitur "Tentukan Properti Variabel" adalah alat yang kuat yang
            memungkinkan pengguna untuk memeriksa data mereka dan menentukan
            atau mengoreksi metadata untuk beberapa variabel dalam satu alur
            kerja yang disederhanakan. Ini beroperasi dalam dua langkah yang
            berbeda:
          </p>
          <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
            <li>
              <strong>Pemindaian</strong>: Pengguna memilih satu set variabel
              dari dataset mereka dan menentukan batasan untuk proses
              pemindaian. Langkah ini sangat penting untuk mengumpulkan
              informasi yang diperlukan dari data mentah.
            </li>
            <li>
              <strong>Penyuntingan</strong>: Berdasarkan data yang dipindai,
              fitur ini menyajikan editor kaya di mana pengguna dapat memodifikasi
              properti untuk setiap variabel yang dipilih, termasuk nama, label,
              tipe, tingkat pengukuran, label nilai, dan spesifikasi nilai yang
              hilang.
            </li>
          </ol>
          <p className="mt-2">
            Tujuan utamanya adalah untuk menyediakan cara yang efisien untuk
            meningkatkan kualitas data dan memastikan akurasi metadata, yang
            merupakan dasar untuk analisis yang andal.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">2. Alur Kerja</h3>
          <p>
            Alur kerja fitur ini bersifat sekuensial dan dirancang untuk
            memandu pengguna melalui proses secara logis.
          </p>
          <div className="ml-4 mt-2 space-y-4">
            <div>
              <h4 className="font-semibold">
                Langkah 1: Pemilihan & Pemindaian Variabel
              </h4>
              <ul className="list-disc list-inside ml-4">
                <li>
                  Pengguna disajikan dengan manajer variabel dua daftar standar.
                </li>
                <li>
                  Mereka memindahkan variabel yang diinginkan dari daftar
                  "Variabel yang Tersedia" ke daftar "Variabel untuk Dipindai".
                </li>
                <li>
                  Mereka dapat menetapkan batasan pada:
                  <ul className="list-disc list-inside ml-6">
                    <li>Berapa banyak kasus (baris) yang akan dipindai.</li>
                    <li>
                      Berapa banyak nilai unik yang akan ditampilkan per variabel
                      di langkah berikutnya.
                    </li>
                  </ul>
                </li>
                <li>
                  Batasan ini sangat penting untuk menjaga kinerja, terutama
                  dengan dataset besar.
                </li>
                <li>
                  Mengklik "Lanjutkan" memvalidasi bahwa setidaknya satu
                  variabel telah dipilih dan kemudian beralih ke langkah
                  editor, meneruskan variabel yang dipilih dan batasan pindai.
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Langkah 2: Penyuntingan Properti</h4>
              <ul className="list-disc list-inside ml-4">
                <li>
                  Tampilan editor ditampilkan, menunjukkan daftar variabel yang
                  dipindai di sebelah kiri dan properti untuk variabel yang
                  sedang dipilih di sebelah kanan.
                </li>
                <li>
                  <strong>Pengeditan Properti</strong>: Pengguna dapat
                  memodifikasi properti standar:
                  <ul className="list-disc list-inside ml-6">
                    <li>
                      <strong>Nama & Label</strong>: Pengidentifikasi dasar
                      untuk variabel.
                    </li>
                    <li>
                      <strong>Tingkat Pengukuran</strong>: Dapat diatur ke
                      Nominal, Ordinal, atau Skala.
                    </li>
                    <li>
                      <strong>Peran</strong>: Mendefinisikan peran variabel
                      dalam analisis (mis., Input, Target).
                    </li>
                    <li>
                      <strong>Tipe</strong>: Mengatur tipe data (mis., Numerik,
                      String, Tanggal) dan memungkinkan opsi pemformatan
                      tertentu.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Saran Pengukuran</strong>: Tombol "Sarankan Tingkat
                  Pengukuran" tersedia. Ketika diklik, ia akan menganalisis data
                  variabel dan mengembalikan tingkat yang disarankan dengan
                  penjelasan.
                </li>
                <li>
                  <strong>Grid Label Nilai</strong>: Grid menampilkan nilai unik
                  yang ditemukan selama pemindaian, frekuensinya (Hitungan),
                  dan memungkinkan pengguna untuk:
                  <ul className="list-disc list-inside ml-6">
                    <li>
                      Memberikan <code>Label</code> teks untuk setiap{' '}
                      <code>Nilai</code> mentah.
                    </li>
                    <li>
                      Menandai nilai tertentu sebagai <code>Hilang</code>.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Menyimpan</strong>: Ketika pengguna mengklik "OK",
                  perubahan akan disimpan, hanya memperbarui variabel yang
                  telah diubah.
                </li>
              </ul>
            </div>
          </div>
          <p className="mt-2">
            Proses dua langkah ini memastikan bahwa editor diisi dengan
            informasi yang relevan dan didorong oleh data, membuat tugas
            mendefinisikan properti menjadi lebih cepat dan lebih akurat.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DefineVarPropsGuide; 