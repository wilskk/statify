import React from 'react';

export const DescriptiveAnalysis = () => {
  return (
    <div className="prose prose-sm max-w-none">
      <h2 className="text-2xl font-bold mb-4">Panduan Statistik Deskriptif</h2>
      
      <p>
        Analisis Statistik Deskriptif bertujuan untuk meringkas dan mendeskripsikan fitur utama dari kumpulan data. Ini memberikan ringkasan kuantitatif sederhana tentang sampel dan ukuran. Di Statify, analisis ini sangat efisien, menggunakan algoritma <em>one-pass</em> untuk menghitung statistik bahkan pada dataset besar tanpa mengorbankan kinerja.
      </p>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md my-4">
        <h4 className="font-semibold text-blue-800">Bagaimana Cara Menggunakan Fitur Ini?</h4>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Buka menu <strong>Analyze &gt; Descriptive Statistics &gt; Descriptives</strong>.</li>
          <li>Pilih satu atau lebih variabel numerik (skala) yang ingin Anda analisis.</li>
          <li>Klik tab <strong>Statistics</strong> untuk memilih metrik spesifik yang Anda butuhkan.</li>
          <li>Klik <strong>OK</strong> untuk menjalankan analisis. Hasilnya akan muncul di jendela output.</li>
        </ol>
      </div>

      <h3 className="text-xl font-semibold mt-6 border-b pb-2">Contoh Kasus dan Interpretasi</h3>
      <p className="mt-2">
        Misalkan seorang guru ingin menganalisis data dari 30 siswa. Guru tersebut mengumpulkan data untuk dua variabel numerik: <strong>`Nilai_Ujian_Matematika`</strong> (skor 0-100) dan <strong>`Jam_Belajar_per_Minggu`</strong>. Dengan menjalankan analisis deskriptif untuk kedua variabel ini secara bersamaan, guru mendapatkan tabel output berikut:
      </p>

      {/* Contoh Tabel Deskriptif */}
      <div className="my-4 overflow-x-auto">
        <p className="font-semibold text-center mb-2">Descriptive Statistics</p>
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3"></th>
              <th scope="col" className="px-6 py-3">N</th>
              <th scope="col" className="px-6 py-3">Minimum</th>
              <th scope="col" className="px-6 py-3">Maximum</th>
              <th scope="col" className="px-6 py-3">Mean</th>
              <th scope="col" className="px-6 py-3">Std. Deviation</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white border-b">
              <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">Nilai_Ujian_Matematika</th>
              <td className="px-6 py-4">30</td>
              <td className="px-6 py-4">65</td>
              <td className="px-6 py-4">98</td>
              <td className="px-6 py-4">82.50</td>
              <td className="px-6 py-4">8.75</td>
            </tr>
            <tr className="bg-white border-b">
              <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">Jam_Belajar_per_Minggu</th>
              <td className="px-6 py-4">28</td>
              <td className="px-6 py-4">2</td>
              <td className="px-6 py-4">15</td>
              <td className="px-6 py-4">7.80</td>
              <td className="px-6 py-4">3.50</td>
            </tr>
            <tr className="bg-gray-50">
              <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">Valid N (listwise)</th>
              <td className="px-6 py-4">28</td>
              <td className="px-6 py-4"></td>
              <td className="px-6 py-4"></td>
              <td className="px-6 py-4"></td>
              <td className="px-6 py-4"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 prose-sm">
        <h4 className="font-semibold">Cara Membaca Tabel:</h4>
        <ul className="list-disc list-inside space-y-2 mt-2">
          <li><strong>N (Jumlah Kasus):</strong> Terdapat data dari 30 siswa untuk `Nilai_Ujian_Matematika`, tetapi hanya 28 siswa untuk `Jam_Belajar_per_Minggu`. Ini berarti ada 2 data yang hilang (missing) pada variabel jam belajar. Baris `Valid N (listwise)` menunjukkan bahwa hanya ada 28 siswa yang memiliki data lengkap untuk *kedua* variabel tersebut.</li>
          <li><strong>Nilai Ujian Matematika:</strong> Rata-rata nilai (Mean) adalah 82.50 dengan simpangan baku (Std. Deviation) 8.75. Nilai tersebar dari 65 hingga 98. Sebaran nilai relatif sempit, menunjukkan kinerja yang cukup seragam.</li>
          <li><strong>Jam Belajar per Minggu:</strong> Rata-rata siswa belajar selama 7.80 jam per minggu, dengan simpangan baku 3.50. Waktu belajar sangat bervariasi, mulai dari hanya 2 jam hingga 15 jam seminggu. Variasi yang lebih besar ini (dibandingkan dengan nilai ujian) mungkin menarik untuk dianalisis lebih lanjut.</li>
        </ul>
      </div>

      <h3 className="text-xl font-semibold mt-6 border-b pb-2">Ukuran Pemusatan (Central Tendency)</h3>
      <p>Ukuran ini mewakili titik pusat atau tipikal dari kumpulan data.</p>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li><strong>Mean:</strong> Rata-rata aritmatika dari semua nilai. Dihitung sebagai <code>Sum / N</code>. Ini sensitif terhadap nilai ekstrem (outlier).</li>
        <li><strong>Median:</strong> Nilai tengah dari data yang telah diurutkan. Jika jumlah data genap, median adalah rata-rata dari dua nilai tengah. Median lebih tahan terhadap outlier daripada mean.</li>
        <li><strong>Sum:</strong> Jumlah total dari semua nilai dalam variabel.</li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 border-b pb-2">Ukuran Sebaran (Dispersion)</h3>
      <p>Ukuran ini menggambarkan sejauh mana data tersebar atau menyebar.</p>
      <ul className="list-disc list-inside space-y-4 mt-2">
        <li>
          <strong>Std. Deviation (Simpangan Baku):</strong> Ukuran seberapa tersebar data dari meannya. Simpangan baku yang rendah menunjukkan bahwa titik data cenderung dekat dengan mean, sedangkan simpangan baku yang tinggi menunjukkan bahwa titik data tersebar di rentang nilai yang lebih luas.
          <p className="ml-6 my-1 font-mono bg-gray-100 p-2 rounded text-sm">s = √[ Σ(xᵢ - μ)² / (N - 1) ]</p>
        </li>
        <li>
          <strong>Variance (Varians):</strong> Kuadrat dari simpangan baku. Ini juga mengukur penyebaran data.
          <p className="ml-6 my-1 font-mono bg-gray-100 p-2 rounded text-sm">s² = Σ(xᵢ - μ)² / (N - 1)</p>
        </li>
        <li><strong>Range (Rentang):</strong> Perbedaan antara nilai maksimum dan minimum dalam data (<code>Maximum - Minimum</code>).</li>
        <li><strong>Minimum:</strong> Nilai terendah dalam kumpulan data.</li>
        <li><strong>Maximum:</strong> Nilai tertinggi dalam kumpulan data.</li>
        <li><strong>S.E. Mean (Standard Error of the Mean):</strong> Memperkirakan simpangan baku dari rata-rata sampel. Ini menunjukkan seberapa akurat rata-rata sampel Anda dalam merepresentasikan rata-rata populasi. Dihitung sebagai <code>Std. Deviation / sqrt(N)</code>.</li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 border-b pb-2">Ukuran Distribusi (Distribution)</h3>
      <p>Ukuran ini memberikan wawasan tentang bentuk distribusi data.</p>
      <ul className="list-disc list-inside space-y-4 mt-2">
        <li>
          <strong>Skewness:</strong> Mengukur asimetri distribusi data di sekitar meannya.
          <p className="ml-6 my-1 font-mono bg-gray-100 p-2 rounded text-sm">g₁ ≈ Σ( (xᵢ - μ)/s )³ / N</p>
          <ul className="list-disc list-inside ml-6 mt-1">
            <li>Skewness positif berarti ekor di sisi kanan distribusi lebih panjang.</li>
            <li>Skewness negatif berarti ekor di sisi kiri lebih panjang.</li>
            <li>Nilai mendekati nol menunjukkan distribusi yang cukup simetris.</li>
          </ul>
          <p className="ml-6 mt-1 text-xs italic">Catatan: Implementasi aktual menggunakan koreksi untuk sampel kecil guna mengurangi bias.</p>
          Statify juga menyediakan <strong>Standard Error of Skewness</strong> untuk membantu menentukan signifikansi statistik dari nilai skewness.
        </li>
        <li>
          <strong>Kurtosis:</strong> Mengukur "ketajaman" atau "keruncingan" puncak distribusi.
          <p className="ml-6 my-1 font-mono bg-gray-100 p-2 rounded text-sm">g₂ ≈ [ Σ( (xᵢ - μ)/s )⁴ / N ] - 3</p>
          <ul className="list-disc list-inside ml-6 mt-1">
            <li>Kurtosis tinggi (leptokurtik) berarti ada lebih banyak varians yang disebabkan oleh outlier yang jarang terjadi.</li>
            <li>Kurtosis rendah (platikurtik) berarti lebih banyak varians yang disebabkan oleh nilai-nilai yang cukup sering tetapi tidak ekstrem.</li>
            <li>Nilai kurtosis (excess) mendekati 0 menunjukkan keruncingan yang mirip dengan distribusi normal.</li>
          </ul>
          <p className="ml-6 mt-1 text-xs italic">Nilai yang ditampilkan adalah 'excess kurtosis' (dikurangi 3), di mana nilai 0 merepresentasikan kurtosis distribusi normal. Ini adalah standar di banyak paket statistik.</p>
          Sama seperti skewness, <strong>Standard Error of Kurtosis</strong> juga dihitung untuk menilai signifikansinya.
        </li>
      </ul>
    </div>
  );
};
