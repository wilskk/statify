import React from 'react';

export const Crosstabs = () => {
  return (
    <div className="prose prose-sm max-w-none">
      <h2 className="text-2xl font-bold mb-4">Panduan Analisis Crosstabs (Tabel Silang)</h2>
      
      <p>
        Analisis <strong>Crosstabs</strong>, atau tabel silang, digunakan untuk menguji hubungan antara dua atau lebih variabel kategorikal. Prosedur ini membuat tabel kontingensi, di mana baris dan kolomnya mewakili kategori dari variabel yang berbeda, dan sel-selnya berisi jumlah kasus yang cocok dengan kombinasi kategori tersebut.
      </p>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md my-4">
        <h4 className="font-semibold text-blue-800">Bagaimana Cara Menggunakan Fitur Ini?</h4>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Buka menu <strong>Analyze &gt; Descriptive Statistics &gt; Crosstabs</strong>.</li>
          <li>Di tab <strong>Variables</strong>, pindahkan satu atau lebih variabel ke dalam kotak <strong>Row(s)</strong>.</li>
          <li>Pindahkan satu atau lebih variabel ke dalam kotak <strong>Column(s)</strong>.</li>
          <li>Klik tab <strong>Cells</strong> untuk menyesuaikan informasi yang ditampilkan di setiap sel tabel.</li>
          <li>Klik <strong>OK</strong> untuk menjalankan analisis dan menghasilkan tabel silang.</li>
        </ol>
      </div>

      <h3 className="text-xl font-semibold mt-6 border-b pb-2">Tab Opsi: Cells</h3>
      <p>Tab ini memungkinkan Anda untuk mengontrol konten dari setiap sel dalam tabel kontingensi.</p>
      
      <h4 className="text-lg font-semibold mt-4">Counts</h4>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li><strong>Observed (Teramati):</strong> Ini adalah pilihan default. Menampilkan jumlah kasus aktual (frekuensi) untuk setiap sel.</li>
        <li><strong>Expected (Diharapkan):</strong> Menampilkan jumlah kasus yang diharapkan di setiap sel jika tidak ada hubungan antara variabel baris dan kolom. Nilai ini penting untuk uji Chi-Square.</li>
      </ul>

      <h4 className="text-lg font-semibold mt-4">Percentages</h4>
      <p>Persentase membantu dalam menginterpretasikan hubungan antara variabel dengan menstandarkan frekuensi.</p>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li><strong>Row:</strong> Menampilkan persentase sel sebagai proporsi dari total barisnya. Ini menunjukkan distribusi variabel kolom untuk setiap kategori variabel baris.</li>
        <li><strong>Column:</strong> Menampilkan persentase sel sebagai proporsi dari total kolomnya. Ini menunjukkan distribusi variabel baris untuk setiap kategori variabel kolom.</li>
        <li><strong>Total:</strong> Menampilkan persentase sel sebagai proporsi dari jumlah total kasus dalam tabel.</li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 border-b pb-2">Interpretasi Output</h3>
      <p>
        Output utama adalah tabel silang itu sendiri. Dengan membandingkan frekuensi yang diamati dengan frekuensi yang diharapkan, atau dengan menganalisis persentase baris/kolom, Anda dapat mengidentifikasi pola atau hubungan antara variabel. Misalnya, jika persentase baris sangat berbeda di seluruh kategori, ini menunjukkan adanya hubungan antara variabel baris dan kolom.
      </p>
    </div>
  );
};

