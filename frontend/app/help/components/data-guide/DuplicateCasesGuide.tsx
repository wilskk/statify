/* eslint-disable react/no-unescaped-entities */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const DuplicateCasesGuide = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fitur Identifikasi Kasus Duplikat</CardTitle>
        <CardDescription>
          Dokumen ini menjelaskan fungsionalitas fitur "Identifikasi Kasus
          Duplikat", yang berfungsi untuk mengenali dan menandai kasus-kasus
          duplikat dalam sebuah dataset berdasarkan variabel-variabel
          pencocokan yang telah ditentukan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">1. Gambaran Umum</h3>
          <p>Fitur ini memungkinkan pengguna untuk:</p>
          <ul className="list-disc list-inside ml-4">
            <li>
              Mengidentifikasi kasus duplikat berdasarkan nilai-nilai yang
              identik pada satu atau lebih variabel.
            </li>
            <li>
              Membuat variabel indikator baru untuk menandai mana kasus yang
              "primer" dan mana yang "duplikat".
            </li>
            <li>
              Mengurutkan kasus di dalam grup duplikat untuk menentukan kasus
              primer.
            </li>
            <li>
              Mengelola hasil dengan menyusun ulang data atau memfilter kasus
              duplikat.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg">2. Spesifikasi & Opsi Fitur</h3>
          <div className="ml-4 mt-2 space-y-4">
            <div>
              <h4 className="font-semibold">Variabel Indikator Baru</h4>
              <p>
                Fitur ini dapat membuat dua variabel baru untuk membantu
                analisis duplikasi:
              </p>
              <div className="ml-4 mt-2 space-y-2">
                <h5 className="font-semibold">1. Indikator Kasus Primer</h5>
                <ul className="list-disc list-inside ml-4">
                  <li>
                    <strong>Fungsi</strong>: Membuat variabel (default:{' '}
                    <code>PrimaryLast</code>) yang menandai setiap kasus sebagai
                    primer (nilai 1) atau duplikat (nilai 0).
                  </li>
                  <li>
                    <strong>Pilihan Kasus Primer</strong>: Pengguna dapat
                    menentukan apakah kasus <strong>pertama</strong> atau{' '}
                    <strong>terakhir</strong> dalam setiap grup duplikat yang
                    akan dianggap sebagai primer.
                  </li>
                  <li>
                    <strong>Nama Variabel</strong>: Nama untuk variabel
                    indikator ini dapat disesuaikan.
                  </li>
                </ul>
                <h5 className="font-semibold mt-2">2. Penghitung Berurutan</h5>
                <ul className="list-disc list-inside ml-4">
                  <li>
                    <strong>Fungsi</strong>: Membuat variabel (default:{' '}
                    <code>MatchSequence</code>) yang memberikan nomor urut untuk
                    setiap kasus di dalam grup duplikat (1, 2, 3, ...). Kasus
                    yang unik (tidak memiliki duplikat) akan diberi nilai 0.
                  </li>
                  <li>
                    <strong>Manfaat</strong>: Berguna untuk melihat berapa
                    banyak duplikat yang ada dalam setiap grup.
                  </li>
                  <li>
                    <strong>Nama Variabel</strong>: Nama untuk variabel
                    penghitung ini dapat disesuaikan.
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-semibold">Opsi Manajemen & Tampilan</h4>
              <div className="ml-4 mt-2 space-y-2">
                <h5 className="font-semibold">
                  1. Pindahkan Kasus Duplikat ke Atas
                </h5>
                <p>
                  Jika diaktifkan, semua kasus yang memiliki duplikat akan
                  dipindahkan ke bagian atas file data, memudahkan untuk
                  inspeksi.
                </p>
                <h5 className="font-semibold mt-2">
                  2. Filter Kasus Duplikat
                </h5>
                <p>
                  Jika diaktifkan, setelah proses selesai, dataset akan secara
                  otomatis difilter untuk hanya menampilkan kasus-kasus primer
                  (di mana nilai indikator adalah 1). Ini adalah cara cepat
                  untuk "menghapus" duplikat dari tampilan.
                </p>
                <h5 className="font-semibold mt-2">3. Tampilkan Frekuensi</h5>
                <p>
                  Jika diaktifkan, tabel frekuensi untuk variabel-variabel baru
                  yang dibuat akan ditampilkan di jendela Output. Ini memberikan
                  ringkasan cepat tentang jumlah kasus primer dan duplikat yang
                  ditemukan.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg">3. Contoh Penggunaan</h3>
          <div className="ml-4 mt-2 space-y-4">
            <div>
              <h4 className="font-semibold">
                Skenario 1: Menemukan Duplikat yang Sama Persis
              </h4>
              <ol className="list-decimal list-inside ml-4">
                <li>
                  Pindahkan <strong>semua</strong> variabel ke dalam daftar
                  "Define matching cases by".
                </li>
                <li>
                  Pilih apakah kasus pertama atau terakhir yang akan menjadi
                  primer.
                </li>
                <li>Klik OK.</li>
              </ol>
              <p className="ml-4 mt-1">
                <strong>Hasil</strong>: Variabel <code>PrimaryLast</code> akan
                bernilai 0 untuk setiap baris yang merupakan duplikat persis
                dari baris lain.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">
                Skenario 2: Membuat Dataset Tanpa Duplikat
              </h4>
              <ol className="list-decimal list-inside ml-4">
                <li>
                  Pindahkan variabel kunci (misal: ID Pelanggan, Email) ke
                  daftar "Define matching cases by".
                </li>
                <li>
                  Pada tab <strong>Options</strong>, centang opsi "Filter out
                  duplicate cases after processing".
                </li>
                <li>Klik OK.</li>
              </ol>
              <p className="ml-4 mt-1">
                <strong>Hasil</strong>: Tampilan data akan langsung diperbarui
                dan hanya menunjukkan baris-baris yang unik/primer.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DuplicateCasesGuide; 