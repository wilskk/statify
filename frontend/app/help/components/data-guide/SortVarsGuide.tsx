/* eslint-disable react/no-unescaped-entities */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const SortVarsGuide = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fitur Urutkan Variabel</CardTitle>
        <CardDescription>
          Dokumen ini menjelaskan fungsionalitas fitur "Urutkan Variabel", yang
          memungkinkan pengguna untuk menyusun ulang variabel dalam "Tampilan
          Variabel" berdasarkan properti salah satu kolomnya.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">1. Fungsionalitas Dijelaskan</h3>
          <ul className="list-disc list-inside ml-4">
            <li>
              <strong>Pengurutan Berbasis Atribut</strong>: Pengguna dapat
              memilih kolom mana pun dari kisi tampilan variabel (misalnya,
              "Nama", "Tipe", "Ukuran") untuk digunakan sebagai kunci
              pengurutan.
            </li>
            <li>
              <strong>Arah Urutan</strong>: Urutan pengurutan `Menaik` dan
              `Menurun` keduanya didukung.
            </li>
            <li>
              <strong>Pembaruan Dataset Penuh</strong>: Fitur ini melakukan
              pembaruan komprehensif. Ini menyusun ulang array `variabel` dan
              secara fisik mengatur ulang kolom data agar sesuai dengan urutan
              variabel baru, memastikan integritas data.
            </li>
            <li>
              <strong>Aplikasi Langsung</strong>: Pengurutan diterapkan
              langsung ke dataset saat ini, dan perubahan disimpan dalam status
              aplikasi.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg">2. Alur Kerja</h3>
          <ol className="list-decimal list-inside ml-4">
            <li>
              <strong>Inisialisasi</strong>: Pengguna membuka modal "Urutkan
              Variabel". UI merender daftar atribut variabel yang dapat diurutkan.
            </li>
            <li>
              <strong>Interaksi Pengguna</strong>: Pengguna memilih atribut
              (misalnya, "Nama") dan arah urutan (misalnya, "Menaik").
            </li>
            <li>
              <strong>Eksekusi</strong>:
              <ul className="list-disc list-inside ml-6">
                <li>Pengguna mengklik tombol "OK".</li>
                <li>
                  Hook menyortir array `variabel` berdasarkan atribut dan arah
                  yang dipilih. `columnIndex` dari setiap variabel diperbarui
                  untuk mencerminkan posisi barunya.
                </li>
                <li>
                  Hook kemudian memanggil layanan untuk menghitung posisi baru
                  untuk setiap kolom data dan mengembalikan dataset baru yang
                  telah diurutkan ulang.
                </li>
                <li>
                  Status aplikasi diperbarui secara atomik dengan daftar
                  variabel baru dan larik data baru.
                </li>
              </ul>
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default SortVarsGuide; 