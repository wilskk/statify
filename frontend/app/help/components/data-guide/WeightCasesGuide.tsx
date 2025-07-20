/* eslint-disable react/no-unescaped-entities */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const WeightCasesGuide = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fitur Pembobotan Kasus</CardTitle>
        <CardDescription>
          Dokumen ini menjelaskan fungsionalitas fitur "Pembobotan Kasus", yang
          memungkinkan pengguna untuk menerapkan bobot kasus ke dataset
          berdasarkan nilai dari variabel numerik.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">1. Fungsionalitas Dijelaskan</h3>
          <ul className="list-disc list-inside ml-4">
            <li>
              <strong>Pembobotan berdasarkan Variabel</strong>: Pengguna dapat
              memilih satu variabel numerik dari daftar variabel yang tersedia.
              Nilai dari variabel ini akan digunakan untuk memboboti setiap
              kasus.
            </li>
            <li>
              <strong>Validasi Tipe</strong>: Dialog secara otomatis memfilter
              daftar untuk hanya menampilkan variabel numerik sebagai kandidat
              yang valid untuk pembobotan.
            </li>
            <li>
              <strong>Pengecualian Kasus</strong>: Setiap kasus yang memiliki
              nilai nol, negatif, atau hilang untuk variabel pembobotan yang
              dipilih akan secara otomatis dikecualikan dari analisis yang
              menggunakan bobot ini.
            </li>
            <li>
              <strong>Status Global</strong>: Konfigurasi pembobotan adalah
              pengaturan global. Dialog menampilkan variabel pembobotan yang
              aktif saat ini, atau "Jangan boboti kasus" jika tidak ada yang
              dipilih.
            </li>
            <li>
              <strong>Menonaktifkan Pembobotan</strong>: Untuk mematikan
              pembobotan, pengguna cukup menghapus variabel dari daftar "Boboti
              kasus dengan" dan mengkonfirmasi dengan mengklik "OK".
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg">2. Alur Kerja</h3>
          <ol className="list-decimal list-inside ml-4">
            <li>
              <strong>Inisialisasi</strong>: Modal diinisialisasi, mengambil
              daftar variabel dan status bobot saat ini.
            </li>
            <li>
              <strong>Rendering</strong>: Komponen UI merender dialog dengan
              variabel yang tersedia dan variabel bobot yang dipilih saat ini
              (jika ada).
            </li>
            <li>
              <strong>Pemilihan</strong>: Pengguna memindahkan variabel numerik
              ke dalam daftar target "Boboti kasus dengan".
            </li>
            <li>
              <strong>Konfirmasi</strong>: Pengguna mengklik "OK". Ini memicu
              penyimpanan status bobot global.
            </li>
            <li>
              <strong>Pembaruan Status Global</strong>: Status global di
              penyimpanan diperbarui dengan nama variabel pembobotan baru (atau
              string kosong jika tidak ada yang dipilih).
            </li>
            <li>
              <strong>Pembersihan</strong>: Dialog ditutup.
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeightCasesGuide; 