/* eslint-disable react/no-unescaped-entities */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const SelectCasesGuide = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fitur Pilih Kasus (Select Cases)</CardTitle>
        <CardDescription>
          Dokumen ini menjelaskan fungsionalitas fitur "Pilih Kasus", yang
          memungkinkan pengguna untuk memfilter atau menghapus baris (kasus)
          berdasarkan berbagai kriteria.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">1. Metode Seleksi</h3>
          <div className="ml-4 mt-2 space-y-4">
            <div>
              <h4 className="font-semibold">a. Semua Kasus</h4>
              <p>
                Pilih opsi ini untuk memilih semua kasus dalam dataset. Opsi
                ini secara efektif akan menghapus filter yang sebelumnya
                diterapkan.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">
                b. Berdasarkan Kondisi (If condition is satisfied)
              </h4>
              <p>
                Opsi ini memungkinkan Anda membuat ekspresi logika untuk
                memfilter kasus. Hanya kasus yang memenuhi kondisi yang akan
                dipilih. Gunakan operator perbandingan (`&gt;`, `&lt;`, `==`, `!=`) dan
                operator logika (`&` untuk AND, `|` untuk OR, `~` untuk NOT).
              </p>
            </div>
            <div>
              <h4 className="font-semibold">
                c. Sampel Acak (Random sample of cases)
              </h4>
              <p>
                Pilih subset acak dari kasus:
                <ul className="list-disc list-inside ml-4">
                  <li>
                    <strong>Perkiraan (Approximately)</strong>: Memilih sekitar
                    persentase tertentu dari total kasus.
                  </li>
                  <li>
                    <strong>Tepat (Exactly)</strong>: Memilih jumlah kasus yang
                    tepat dari N kasus pertama.
                  </li>
                </ul>
              </p>
            </div>
            <div>
              <h4 className="font-semibold">
                d. Berdasarkan Rentang (Based on time or case range)
              </h4>
              <p>
                Memilih kasus berdasarkan posisinya dalam dataset (indeks
                berbasis 1).
              </p>
            </div>
            <div>
              <h4 className="font-semibold">e. Gunakan Variabel Filter</h4>
              <p>
                Menggunakan variabel yang sudah ada sebagai filter. Nilai bukan
                nol/kosong akan dipilih.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg">2. Opsi Output</h3>
          <div className="ml-4 mt-2 space-y-4">
            <div>
              <h4 className="font-semibold">a. Filter Kasus yang Tidak Dipilih</h4>
              <p>
                Filter diterapkan untuk menyembunyikan sementara kasus yang
                tidak dipilih. Variabel filter (`filter_$`) akan dibuat atau
                diperbarui. Dataset asli tetap utuh.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">b. Hapus Kasus yang Tidak Dipilih</h4>
              <p>
                Kasus yang tidak dipilih akan dihapus{' '}
                <strong>secara permanen</strong> dari dataset. Operasi ini tidak
                dapat dibatalkan.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg">3. Contoh Penggunaan</h3>
          <ul className="list-disc list-inside ml-4">
            <li>
              <strong>Filter berdasarkan Kondisi</strong>: Untuk memilih kasus
              dengan `usia &gt; 30` DAN `pendapatan &gt;= 50000`, gunakan ekspresi:{' '}
              <code>age &gt; 30 &amp; income &gt;= 50000</code>.
            </li>
            <li>
              <strong>Membuat Sampel Acak</strong>: Untuk membuat sampel acak
              10%, pilih "Random sample", lalu "Approximately", dan masukkan
              "10".
            </li>
            <li>
              <strong>Memilih Rentang</strong>: Untuk memilih kasus 100 hingga
              500, pilih "Based on... range", lalu masukkan "100" di "First Case"
              dan "500" di "Last Case".
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SelectCasesGuide; 