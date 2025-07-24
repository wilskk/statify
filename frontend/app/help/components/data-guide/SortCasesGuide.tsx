/* eslint-disable react/no-unescaped-entities */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const SortCasesGuide = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fitur: Urutkan Kasus (Sort Cases)</CardTitle>
        <CardDescription>
          Dokumen ini menjelaskan fungsionalitas fitur "Urutkan Kasus", yang
          memungkinkan pengguna untuk menyusun ulang baris (kasus) dalam
          dataset berdasarkan nilai dari satu atau lebih variabel.
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
              semua variabel yang tersedia untuk dijadikan kunci pengurutan.
            </li>
            <li>
              <strong>Daftar Urutkan Berdasarkan (Sort By)</strong>: Daftar ini
              menampung variabel yang telah dipilih sebagai kunci pengurutan.
              Urutan di sini menentukan prioritas pengurutan.
            </li>
            <li>
              <strong>Kontrol Pengurutan</strong>: Saat sebuah variabel di
              dalam daftar "Sort By" disorot:
              <ul className="list-disc list-inside ml-6">
                <li>
                  <strong>Arah Urutan</strong>: Pilihan untuk mengurutkan
                  secara menaik (`Ascending`) atau menurun (`Descending`).
                </li>
                <li>
                  <strong>Prioritas Urutan</strong>: Tombol untuk mengubah
                  prioritas pengurutan variabel.
                </li>
              </ul>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg">
            2. Alur Kerja & Contoh Penggunaan
          </h3>
          <div className="ml-4 mt-2 space-y-4">
            <div>
              <h4 className="font-semibold">Contoh 1: Pengurutan Satu Level</h4>
              <p>
                <strong>Tujuan</strong>: Mengurutkan seluruh dataset berdasarkan{' '}
                `Pendapatan` (`Income`) dari yang tertinggi ke terendah.
              </p>
              <ol className="list-decimal list-inside ml-4">
                <li>Buka dialog "Sort Cases".</li>
                <li>Pindahkan variabel `Income` ke daftar "Sort By".</li>
                <li>Pilih `Descending` pada opsi "Sort Order".</li>
                <li>Klik OK.</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold">Contoh 2: Pengurutan Multi-Level</h4>
              <p>
                <strong>Tujuan</strong>: Mengelompokkan kasus berdasarkan{' '}
                `Departemen` (`Department`), lalu di dalam setiap departemen,
                urutkan berdasarkan `Pendapatan` (`Income`) dari tertinggi ke
                terendah.
              </p>
              <ol className="list-decimal list-inside ml-4">
                <li>
                  Pindahkan variabel `Department` ke daftar "Sort By"
                  (Ascending).
                </li>
                <li>
                  Pindahkan variabel `Income` ke daftar "Sort By" di bawah
                  `Department`.
                </li>
                <li>Ubah arah `Income` menjadi `Descending`.</li>
                <li>Klik OK.</li>
              </ol>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SortCasesGuide; 