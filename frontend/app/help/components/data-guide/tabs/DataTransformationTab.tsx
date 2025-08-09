import React from 'react';
import StandardizedContentLayout from '../../statistics-guide/shared/StandardizedContentLayout';
const { IntroSection, FeatureGrid, ConceptSection } = StandardizedContentLayout;
import { Shuffle, RotateCcw, Combine, Calculator, Filter, Database } from 'lucide-react';

const DataTransformationTab: React.FC = () => {
  const features = [
    {
      icon: Calculator,
      title: 'Agregasi Data',
      description: 'Buat statistik ringkasan untuk kelompok data tertentu (rata-rata, jumlah, maksimum, dll.)',
      link: '/help/data-guide/aggregate'
    },
    {
      icon: Shuffle,
      title: 'Restrukturisasi Data',
      description: 'Ubah format data dari wide ke long atau sebaliknya untuk kebutuhan analisis berbeda',
      link: '/help/data-guide/restructure'
    },
    {
      icon: RotateCcw,
      title: 'Transpose Data',
      description: 'Tukar baris dan kolom untuk mengubah orientasi dataset',
      link: '/help/data-guide/transpose'
    },
    {
      icon: Filter,
      title: 'Pilih Kasus',
      description: 'Filter dan pilih subset data berdasarkan kriteria tertentu',
      link: '/help/data-guide/select-cases'
    },
    {
      icon: Combine,
      title: 'Identifikasi Duplikat',
      description: 'Temukan dan tangani kasus duplikat dalam dataset',
      link: '/help/data-guide/duplicate-cases'
    },
    {
      icon: Database,
      title: 'Gabung Dataset',
      description: 'Kombinasikan multiple dataset berdasarkan kunci yang sama',
      link: '/help/data-guide/merge'
    }
  ];

  const concepts = [
    {
      title: 'Agregasi dan Ringkasan',
      description: 'Agregasi memungkinkan Anda membuat statistik ringkasan dari data mentah, seperti rata-rata penjualan per bulan atau total transaksi per kategori.',
      tips: [
        'Pilih variabel break yang tepat untuk pengelompokan',
        'Tentukan fungsi agregasi yang sesuai (mean, sum, count, dll.)',
        'Pertimbangkan missing values dalam perhitungan',
        'Validasi hasil agregasi dengan data asli'
      ]
    },
    {
      title: 'Restrukturisasi Data',
      description: 'Mengubah format data dari wide (banyak kolom) ke long (banyak baris) atau sebaliknya, tergantung kebutuhan analisis.',
      tips: [
        'Wide format: satu baris per subjek, multiple variabel',
        'Long format: multiple baris per subjek, satu variabel',
        'Pilih format berdasarkan jenis analisis yang akan dilakukan',
        'Pastikan identifikasi subjek tetap konsisten'
      ]
    },
    {
      title: 'Filtering dan Seleksi',
      description: 'Memilih subset data berdasarkan kriteria tertentu untuk fokus pada analisis yang spesifik.',
      tips: [
        'Definisikan kriteria seleksi dengan jelas',
        'Gunakan operator logika untuk kondisi kompleks',
        'Simpan filter yang sering digunakan',
        'Dokumentasikan alasan filtering untuk reproducibility'
      ]
    },
    {
      title: 'Penanganan Duplikat',
      description: 'Identifikasi dan tangani kasus duplikat yang dapat mempengaruhi validitas analisis statistik.',
      tips: [
        'Tentukan kriteria untuk mendefinisikan duplikat',
        'Periksa apakah duplikat adalah kesalahan atau data valid',
        'Pilih strategi penanganan: hapus, gabung, atau tandai',
        'Dokumentasikan keputusan penanganan duplikat'
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <IntroSection
        title="Transformasi Data"
        description="Tools transformasi data memungkinkan Anda mengubah, memanipulasi, dan merestrukturisasi dataset untuk memenuhi kebutuhan analisis yang berbeda. Dari agregasi sederhana hingga restrukturisasi kompleks, semua tersedia di sini."
        highlights={[
          'Agregasi data untuk statistik ringkasan',
          'Restrukturisasi format data (wide ↔ long)',
          'Filter dan seleksi data berdasarkan kriteria',
          'Identifikasi dan tangani duplikat'
        ]}
      />

      <FeatureGrid
        title="Tools Transformasi"
        description="Jelajahi berbagai tools untuk mentransformasi dan memanipulasi data Anda"
        features={features}
      />

      <ConceptSection
        title="Konsep Transformasi Data"
        description="Pahami berbagai teknik dan strategi transformasi data"
        concepts={concepts}
      />
    </div>
  );
};

export default DataTransformationTab;