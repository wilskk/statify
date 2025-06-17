import React from 'react';

export const Explore = () => {
  return (
    <div className="prose prose-sm max-w-none">
      <h2 className="text-2xl font-bold mb-4">Panduan Analisis Explore</h2>
      
      <p>
        Fitur <strong>Explore</strong> digunakan untuk memeriksa distribusi variabel numerik secara lebih mendalam. Analisis ini sangat berguna untuk mengidentifikasi outlier, memeriksa asumsi normalitas, dan membandingkan distribusi antar kelompok.
      </p>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md my-4">
        <h4 className="font-semibold text-blue-800">Bagaimana Cara Menggunakan Fitur Ini?</h4>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Buka menu <strong>Analyze &gt; Descriptive Statistics &gt; Explore</strong>.</li>
          <li>Masukkan satu atau lebih variabel numerik ke dalam daftar <strong>Dependent List</strong>.</li>
          <li>(Opsional) Masukkan variabel kategorikal ke dalam <strong>Factor List</strong> untuk memisahkan hasil berdasarkan kelompok.</li>
          <li>(Opsional) Gunakan <strong>Label cases by</strong> untuk memberi label pada outlier di plot.</li>
          <li>Klik tab <strong>Statistics</strong> untuk memilih statistik deskriptif yang diinginkan (defaultnya mencakup Mean, Median, Std. Deviation, dll.).</li>
          <li>Klik tab <strong>Plots</strong> untuk memilih visualisasi seperti <strong>Stem-and-leaf</strong> (Batang-Daun) dan <strong>Boxplots</strong>.</li>
          <li>Klik <strong>OK</strong> untuk menjalankan analisis.</li>
        </ol>
      </div>

      <h3 className="text-xl font-semibold mt-6 border-b pb-2">Output: Tabel Deskriptif</h3>
      <p>Tabel ini memberikan ringkasan statistik yang komprehensif untuk setiap variabel dependen (dan untuk setiap kelompok jika faktor ditentukan).</p>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li><strong>Mean, Median, Variance, Std. Deviation, Min, Max, Range:</strong> Statistik deskriptif standar.</li>
        <li><strong>Interquartile Range (IQR):</strong> Selisih antara kuartil ketiga (Q3) dan kuartil pertama (Q1). Berguna untuk mengidentifikasi outlier.</li>
        <li><strong>Skewness & Kurtosis:</strong> Ukuran bentuk distribusi, lengkap dengan standard error-nya untuk menguji signifikansi.</li>
        <li><strong>95% Confidence Interval for Mean:</strong> Estimasi rentang di mana rata-rata populasi sebenarnya kemungkinan besar berada.</li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 border-b pb-2">Output: Plot Batang-Daun (Stem-and-Leaf)</h3>
      <p>Plot ini menampilkan distribusi data dengan cara yang mirip dengan histogram tetapi tetap mempertahankan nilai data asli. Ini memberikan gambaran cepat tentang sebaran, pusat, dan bentuk data.</p>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li><strong>Stem:</strong> Digit terdepan dari nilai data.</li>
        <li><strong>Leaf:</strong> Digit terakhir dari nilai data.</li>
        <li>Setiap baris mewakili "stem", dan jumlah "leaf" di baris itu menunjukkan frekuensi data pada rentang tersebut.</li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 border-b pb-2">Output: Boxplot</h3>
      <p>Boxplot (atau plot kotak) secara visual merangkum distribusi data melalui lima angka utama: minimum, kuartil pertama (Q1), median (Q2), kuartil ketiga (Q3), dan maksimum.</p>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li><strong>Kotak (Box):</strong> Mewakili 50% data di tengah (IQR), dari Q1 hingga Q3.</li>
        <li><strong>Garis di dalam Kotak:</strong> Menandakan median.</li>
        <li><strong>Garis (Whiskers):</strong> Memanjang dari kotak untuk menunjukkan rentang data, biasanya hingga 1.5 kali IQR dari Q1 dan Q3.</li>
        <li><strong>Outlier:</strong> Titik data yang berada di luar jangkauan garis (whiskers) sering digambarkan sebagai titik atau bintang dan dianggap sebagai nilai ekstrem atau outlier.</li>
      </ul>

    </div>
  );
};
