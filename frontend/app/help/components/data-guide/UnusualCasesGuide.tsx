/* eslint-disable react/no-unescaped-entities */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const UnusualCasesGuide = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fitur Identifikasi Kasus Tidak Biasa</CardTitle>
        <CardDescription>
          Dokumen ini memberikan gambaran komprehensif tentang fitur "Identifikasi
          Kasus Tidak Biasa", yang merinci fungsionalitas, arsitektur, dan
          strategi pengujiannya. Fitur ini dirancang untuk mendeteksi catatan
          anomali dalam dataset dengan membandingkan setiap kasus dengan rekan-rekannya.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">
            2. Panduan Fitur & Komponen UI
          </h3>
          <p>
            Pengguna berinteraksi dengan dialog modal yang diatur dalam lima
            tab. Tur terpandu juga tersedia untuk memandu pengguna melalui
            fungsionalitas utama.
          </p>
          <div className="ml-4 mt-2 space-y-4">
            <div>
              <h4 className="font-semibold">2.1. Tab Variabel</h4>
              <p>
                Ini adalah tab awal di mana pengguna mendefinisikan ruang
                lingkup analisis.
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>
                  <strong>Variabel Analisis</strong>: Pengguna memilih variabel
                  utama (biasanya skala atau numerik) untuk dievaluasi
                  ketidakbiasaannya.
                </li>
                <li>
                  <strong>Variabel Pengenal Kasus</strong>: Variabel tunggal
                  opsional (misalnya, ID atau nama) dapat dipilih untuk melabeli
                  kasus dalam output.
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">2.2. Tab Opsi</h4>
              <p>
                Tab ini memungkinkan pengguna untuk menyempurnakan algoritma
                deteksi.
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>
                  <strong>Kriteria Identifikasi</strong>: Pengguna dapat memilih
                  untuk mengidentifikasi persentase kasus tertentu dengan skor
                  anomali tertinggi atau jumlah kasus yang tetap.
                </li>
                <li>
                  <strong>Alasan</strong>: Menentukan jumlah maksimum alasan
                  untuk dilaporkan mengapa sebuah kasus dianggap tidak biasa.
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">2.3. Tab Output</h4>
              <p>
                Tab ini mengontrol tabel ringkasan dan daftar mana yang
                dihasilkan di penampil output.
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>
                  <strong>Daftar Kasus Tidak Biasa</strong>: Output utama,
                  menunjukkan setiap kasus yang ditandai dan alasan
                  identifikasinya.
                </li>
                <li>
                  <strong>Norma Grup Sejawat</strong>: Tabel yang menunjukkan
                  distribusi nilai variabel dalam setiap grup sejawat.
                </li>
                <li>
                  <strong>Kejadian Alasan</strong>: Tabel yang melaporkan
                  seberapa sering setiap variabel analisis berkontribusi pada
                  kasus yang ditandai.
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">2.4. Tab Simpan</h4>
              <p>
                Tab ini memungkinkan pengguna untuk menyimpan hasil analisis
                kembali ke dataset aktif sebagai variabel baru.
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>
                  <strong>Simpan Indeks Anomali</strong>: Membuat variabel baru
                  yang berisi indeks anomali untuk setiap kasus.
                </li>
                <li>
                  <strong>Simpan Keanggotaan Grup Sejawat</strong>: Membuat
                  variabel baru untuk ID grup sejawat setiap kasus.
                </li>
                <li>
                  <strong>Simpan Alasan</strong>: Membuat satu set variabel
                  baru yang merinci alasan ketidakbiasaan.
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">2.5. Tab Nilai Hilang</h4>
              <p>
                Tab ini mendefinisikan cara menangani data yang hilang dalam
                variabel analisis. Opsi termasuk mengecualikan kasus atau
                mengimputasi nilai yang hilang.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnusualCasesGuide; 