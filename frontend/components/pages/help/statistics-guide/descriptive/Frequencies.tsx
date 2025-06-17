import React from 'react';

export const Frequencies = () => {
  return (
    <div className="prose prose-sm max-w-none">
      <h2 className="text-2xl font-bold mb-4">Panduan Analisis Frekuensi</h2>
      
      <p>
        Analisis <strong>Frekuensi</strong> menghasilkan tabel ringkasan yang menunjukkan seberapa sering setiap nilai unik dari suatu variabel muncul dalam data. Ini adalah langkah fundamental untuk memeriksa data, terutama untuk variabel kategorikal dan ordinal.
      </p>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md my-4">
        <h4 className="font-semibold text-blue-800">Bagaimana Cara Menggunakan Fitur Ini?</h4>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Buka menu <strong>Analyze &gt; Descriptive Statistics &gt; Frequencies</strong>.</li>
          <li>Pindahkan satu atau lebih variabel yang ingin dianalisis ke dalam kotak <strong>Variable(s)</strong>.</li>
          <li>(Opsional) Buka tab <strong>Statistics</strong> untuk memilih ukuran statistik tambahan.</li>
          <li>(Opsional) Buka tab <strong>Charts</strong> untuk membuat visualisasi dari distribusi frekuensi.</li>
          <li>Klik <strong>OK</strong> untuk menjalankan analisis.</li>
        </ol>
      </div>

      <h3 className="text-xl font-semibold mt-6 border-b pb-2">Output Utama: Tabel Frekuensi</h3>
      <p>Secara default, output akan menampilkan tabel frekuensi untuk setiap variabel, yang berisi:</p>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li><strong>Frequency:</strong> Jumlah mentah (hitungan) untuk setiap nilai.</li>
        <li><strong>Percent:</strong> Persentase setiap nilai dari total kasus, termasuk nilai yang hilang (missing).</li>
        <li><strong>Valid Percent:</strong> Persentase setiap nilai dari total kasus yang valid (tidak termasuk nilai yang hilang).</li>
        <li><strong>Cumulative Percent:</strong> Persentase kumulatif dari nilai-nilai yang valid, yang dijumlahkan dari nilai terendah hingga tertinggi.</li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 border-b pb-2">Rumus yang Digunakan</h3>
      <div className="mt-4 prose-sm">
        <ul className="list-disc list-inside space-y-4">
          <li>
            <strong>Percent:</strong>
            <p className="ml-6 my-1">Menghitung proporsi setiap kategori terhadap total seluruh kasus, termasuk yang hilang (missing).</p>
            <p className="ml-6 font-mono bg-gray-100 p-2 rounded text-sm">
              Percent = (Frequency / Total N) * 100%
            </p>
          </li>
          <li>
            <strong>Valid Percent:</strong>
            <p className="ml-6 my-1">Menghitung proporsi setiap kategori terhadap jumlah kasus yang valid (tidak termasuk yang hilang).</p>
            <p className="ml-6 font-mono bg-gray-100 p-2 rounded text-sm">
              Valid Percent = (Frequency / Valid N) * 100%
            </p>
            <p className="ml-8 text-xs italic">dimana Valid N = Total N - Missing N</p>
          </li>
          <li>
            <strong>Cumulative Percent:</strong>
            <p className="ml-6 my-1">Akumulasi dari 'Valid Percent'. Untuk sebuah kategori, nilainya adalah jumlah 'Valid Percent' kategori itu sendiri ditambah dengan semua 'Valid Percent' dari kategori sebelumnya.</p>
            <p className="ml-6 font-mono bg-gray-100 p-2 rounded text-sm">
              Cumulative Percent? = ? (dari j=1 sampai i) Valid Percent?
            </p>
          </li>
        </ul>
      </div>

      <h3 className="text-xl font-semibold mt-6 border-b pb-2">Contoh Kasus: Survei Demografi</h3>
      <p className="mt-2">
        Bayangkan Anda melakukan survei terhadap 110 orang untuk mengumpulkan data demografi. Salah satu pertanyaan yang Anda ajukan adalah mengenai tingkat pendidikan terakhir responden. Variabel ini kita sebut <strong>`Pendidikan`</strong>.
      </p>
      <p className="mt-2">
        Variabel <strong>`Pendidikan`</strong> adalah variabel kategorikal ordinal, dengan kategori: "SMA", "Diploma", dan "Sarjana (S1)". Setelah data terkumpul, ternyata 10 responden tidak mengisi pertanyaan ini, sehingga data tersebut dianggap hilang (missing).
      </p>
      <p className="mt-2">
        Dengan menjalankan analisis frekuensi pada variabel <strong>`Pendidikan`</strong>, kita akan mendapatkan tabel output seperti di bawah ini.
      </p>

      <h3 className="text-xl font-semibold mt-6 border-b pb-2">Contoh Tabel dan Interpretasi</h3>
      <p className="mt-2">Mari kita lihat contoh tabel frekuensi untuk variabel "Tingkat Pendidikan Terakhir".</p>

      {/* Contoh Tabel Frekuensi */}
      <div className="my-4 overflow-x-auto">
        <p className="font-semibold text-center">Tingkat Pendidikan Terakhir</p>
        <table className="w-full text-sm text-left text-gray-500 mt-2">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3"></th>
              <th scope="col" className="px-6 py-3">Frequency</th>
              <th scope="col" className="px-6 py-3">Percent</th>
              <th scope="col" className="px-6 py-3">Valid Percent</th>
              <th scope="col" className="px-6 py-3">Cumulative Percent</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white border-b">
              <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">SMA</th>
              <td className="px-6 py-4">50</td>
              <td className="px-6 py-4">45.5</td>
              <td className="px-6 py-4">50.0</td>
              <td className="px-6 py-4">50.0</td>
            </tr>
            <tr className="bg-white border-b">
              <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">Diploma</th>
              <td className="px-6 py-4">20</td>
              <td className="px-6 py-4">18.2</td>
              <td className="px-6 py-4">20.0</td>
              <td className="px-6 py-4">70.0</td>
            </tr>
            <tr className="bg-white border-b">
              <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">Sarjana (S1)</th>
              <td className="px-6 py-4">30</td>
              <td className="px-6 py-4">27.3</td>
              <td className="px-6 py-4">30.0</td>
              <td className="px-6 py-4">100.0</td>
            </tr>
            <tr className="bg-gray-50 border-b">
              <th scope="row" className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">Total</th>
              <td className="px-6 py-4 font-bold">100</td>
              <td className="px-6 py-4 font-bold">90.9</td>
              <td className="px-6 py-4 font-bold">100.0</td>
              <td className="px-6 py-4"></td>
            </tr>
            <tr className="bg-white border-b">
              <th scope="row" className="px-6 py-4 font-medium text-gray-500 whitespace-nowrap italic">Missing System</th>
              <td className="px-6 py-4 italic">10</td>
              <td className="px-6 py-4 italic">9.1</td>
              <td className="px-6 py-4"></td>
              <td className="px-6 py-4"></td>
            </tr>
            <tr className="bg-gray-50">
              <th scope="row" className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">Total</th>
              <td className="px-6 py-4 font-bold">110</td>
              <td className="px-6 py-4 font-bold">100.0</td>
              <td className="px-6 py-4"></td>
              <td className="px-6 py-4"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 prose-sm">
        <h4 className="font-semibold">Cara Membaca Tabel:</h4>
        <ul className="list-disc list-inside space-y-2 mt-2">
          <li><strong>Frequency:</strong> Ada 50 responden lulusan SMA, 20 lulusan Diploma, dan 30 lulusan Sarjana (S1). Total ada 100 responden dengan data valid dan 10 data hilang (missing).</li>
          <li><strong>Percent:</strong> 45.5% dari total responden (termasuk yang hilang) adalah lulusan SMA. Data yang hilang mencakup 9.1% dari total kasus.</li>
          <li><strong>Valid Percent:</strong> Ketika data yang hilang diabaikan, 50% dari responden yang valid adalah lulusan SMA. Kolom ini sangat berguna untuk memahami proporsi sebenarnya tanpa bias dari data yang hilang.</li>
          <li><strong>Cumulative Percent:</strong> 70% dari responden yang valid memiliki pendidikan Diploma atau lebih rendah (50% SMA + 20% Diploma). 100% responden memiliki pendidikan Sarjana (S1) atau lebih rendah. Kolom ini berguna untuk data ordinal.</li>
        </ul>
      </div>

      <h3 className="text-xl font-semibold mt-6 border-b pb-2">Tab Opsi: Statistics</h3>
      <p>Anda dapat memilih berbagai statistik deskriptif untuk melengkapi tabel frekuensi Anda.</p>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li><strong>Percentile Values:</strong>
          <ul className="list-disc list-inside ml-6 mt-1">
            <li><strong>Quartiles:</strong> Membagi data menjadi empat bagian yang sama (persentil ke-25, 50, dan 75).</li>
            <li><strong>Cut points for n equal groups:</strong> Membagi data menjadi sejumlah kelompok yang Anda tentukan.</li>
            <li><strong>Percentiles:</strong> Memungkinkan Anda meminta persentil spesifik (misalnya, persentil ke-90).</li>
          </ul>
        </li>
        <li><strong>Central Tendency (Pemusatan):</strong>
          <ul className="list-disc list-inside ml-6 mt-1">
            <li><strong>Mean:</strong> Rata-rata.</li>
            <li><strong>Median:</strong> Nilai tengah.</li>
            <li><strong>Mode:</strong> Nilai yang paling sering muncul.</li>
            <li><strong>Sum:</strong> Jumlah total semua nilai.</li>
          </ul>
        </li>
        <li><strong>Dispersion (Sebaran):</strong>
          <ul className="list-disc list-inside ml-6 mt-1">
            <li><strong>Std. deviation:</strong> Simpangan baku.</li>
            <li><strong>Variance:</strong> Varians.</li>
            <li><strong>Range:</strong> Rentang (Maksimum - Minimum).</li>
            <li><strong>Minimum & Maximum:</strong> Nilai terendah dan tertinggi.</li>
            <li><strong>S.E. mean:</strong> Standard Error dari Mean.</li>
          </ul>
        </li>
        <li><strong>Distribution (Distribusi):</strong>
          <ul className="list-disc list-inside ml-6 mt-1">
            <li><strong>Skewness:</strong> Mengukur kemiringan distribusi.</li>
            <li><strong>Kurtosis:</strong> Mengukur keruncingan puncak distribusi.</li>
          </ul>
        </li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 border-b pb-2">Tab Opsi: Charts</h3>
      <p>Anda dapat membuat grafik untuk memvisualisasikan distribusi.</p>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li><strong>Chart Type:</strong>
          <ul className="list-disc list-inside ml-6 mt-1">
            <li><strong>Bar charts:</strong> Pilihan yang baik untuk variabel kategorikal.</li>
            <li><strong>Pie charts:</strong> Menunjukkan proporsi setiap kategori terhadap keseluruhan.</li>
            <li><strong>Histograms:</strong> Ideal untuk variabel numerik kontinu. Anda juga dapat memilih untuk menampilkan kurva normal di atas histogram untuk membandingkan distribusi data Anda dengan distribusi normal.</li>
          </ul>
        </li>
        <li><strong>Chart Values:</strong> Anda dapat memilih apakah sumbu pada Bar Chart atau Pie Chart akan menampilkan <strong>Frequencies</strong> (hitungan) atau <strong>Percentages</strong> (persentase).</li>
      </ul>
    </div>
  );
};

