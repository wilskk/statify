import React from 'react';
import { Shuffle, RotateCcw, Calculator, Filter, ListOrdered, Settings, Copy } from 'lucide-react';
import { HelpGuideTemplate } from '../../../ui/HelpGuideTemplate';
import { HelpAlert, HelpCard, HelpStep } from '../../../ui/HelpLayout';

const DataTransformationTab: React.FC = () => {
  const sections = [
    {
      id: 'how-to-transform',
      title: 'Cara Mentransformasi Data',
      description: 'Panduan langkah demi langkah untuk transformasi data yang efektif',
      icon: ListOrdered,
      content: (
        <div className="space-y-4">
          <HelpStep number={1} title="Analisis Kebutuhan Transformasi">
            <p className="text-sm">
              Tentukan jenis transformasi yang diperlukan:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Identifikasi struktur data saat ini vs yang dibutuhkan</li>
              <li>Pertimbangkan requirements analisis yang akan dilakukan</li>
              <li>Evaluasi format data: wide vs long</li>
              <li>Tentukan level agregasi yang diperlukan</li>
            </ul>
          </HelpStep>

          <HelpStep number={2} title="Backup dan Persiapan">
            <p className="text-sm">
              Lakukan backup sebelum transformasi:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Simpan file asli dengan <strong>File → Save As</strong></li>
              <li>Buat versioning yang jelas (v1, v2, dll.)</li>
              <li>Dokumentasikan transformasi yang akan dilakukan</li>
              <li>Test pada subset data jika dataset besar</li>
            </ul>
          </HelpStep>

          <HelpStep number={3} title="Lakukan Transformasi">
            <p className="text-sm">
              Pilih dan terapkan transformasi yang sesuai:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Gunakan <strong>Data → Aggregate</strong> untuk ringkasan per kelompok</li>
              <li>Gunakan <strong>Data → Restructure</strong> untuk ubah format</li>
              <li>Gunakan <strong>Data → Select Cases</strong> untuk filtering</li>
              <li>Gunakan <strong>Data → Transpose</strong> untuk orientasi berbeda</li>
            </ul>
          </HelpStep>

          <HelpStep number={4} title="Validasi Hasil">
            <p className="text-sm">
              Periksa hasil transformasi untuk memastikan akurasi:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Bandingkan statistik summary sebelum dan sesudah</li>
              <li>Periksa ukuran dataset dan struktur baru</li>
              <li>Validasi logical consistency hasil transformasi</li>
              <li>Test dengan analisis sederhana untuk memastikan format benar</li>
            </ul>
          </HelpStep>
        </div>
      )
    },
    {
      id: 'transformation-tools',
      title: 'Tools Transformasi Data',
      description: 'Fitur-fitur utama untuk transformasi dan manipulasi data',
      icon: Settings,
      content: (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <HelpCard title="Agregasi Data" icon={Calculator} variant="feature">
            <p className="text-sm">
              <strong>Data → Aggregate</strong><br />
              Buat statistik ringkasan per kelompok (mean, sum, max, dll.)
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Pilih variabel break untuk pengelompokan</li>
              <li>• Tentukan fungsi agregasi yang sesuai</li>
            </ul>
          </HelpCard>

          <HelpCard title="Restrukturisasi Data" icon={Shuffle} variant="feature">
            <p className="text-sm">
              <strong>Data → Restructure</strong><br />
              Ubah format wide ↔ long sesuai kebutuhan analisis
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Wide: satu baris per subjek</li>
              <li>• Long: multiple baris per subjek</li>
            </ul>
          </HelpCard>

          <HelpCard title="Transpose Data" icon={RotateCcw} variant="feature">
            <p className="text-sm">
              <strong>Data → Transpose</strong><br />
              Tukar baris dan kolom untuk ubah orientasi dataset
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Untuk tabel ringkas tertentu</li>
              <li>• Ubah orientasi data matrix</li>
            </ul>
          </HelpCard>

          <HelpCard title="Pilih Kasus" icon={Filter} variant="feature">
            <p className="text-sm">
              <strong>Data → Select Cases</strong><br />
              Filter subset data berdasarkan kriteria tertentu
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Gunakan operator logika kompleks</li>
              <li>• Simpan filter yang sering dipakai</li>
            </ul>
          </HelpCard>

          <HelpCard title="Identifikasi Duplikat" icon={Copy} variant="feature">
            <p className="text-sm">
              <strong>Data → Identify Duplicate Cases</strong><br />
              Temukan dan tangani kasus duplikat
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Definisikan kriteria duplikat</li>
              <li>• Dokumentasikan penanganan</li>
            </ul>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'transformation-concepts',
      title: 'Konsep Transformasi',
      description: 'Pemahaman mendalam tentang berbagai jenis transformasi data',
      icon: Shuffle,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Prinsip Transformasi">
            <p className="text-sm mt-2">
              Transformasi data harus preserve informasi penting sambil mengubah format untuk memenuhi kebutuhan analisis. 
              Selalu validasi hasil untuk memastikan tidak ada informasi yang hilang.
            </p>
          </HelpAlert>

          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            <HelpCard title="Agregasi dan Ringkasan" icon={Calculator} variant="step">
              <ul className="text-sm space-y-1">
                <li>• Pilih variabel break yang tepat</li>
                <li>• Tentukan fungsi agregasi sesuai</li>
                <li>• Pertimbangkan missing values</li>
                <li>• Validasi hasil dengan data asli</li>
                <li>• Dokumentasikan level agregasi</li>
              </ul>
            </HelpCard>

            <HelpCard title="Restrukturisasi Format" icon={Shuffle} variant="step">
              <ul className="text-sm space-y-1">
                <li>• Wide format: satu baris per subjek</li>
                <li>• Long format: multiple baris per subjek</li>
                <li>• Pilih based on analysis requirements</li>
                <li>• Pastikan ID tetap konsisten</li>
                <li>• Test dengan subset data dulu</li>
              </ul>
            </HelpCard>

            <HelpCard title="Filtering dan Seleksi" icon={Filter} variant="step">
              <ul className="text-sm space-y-1">
                <li>• Definisikan kriteria seleksi dengan jelas</li>
                <li>• Gunakan operator logika untuk kondisi kompleks</li>
                <li>• Simpan filter yang sering digunakan</li>
                <li>• Dokumentasikan alasan filtering</li>
                <li>• Monitor impact pada sample size</li>
              </ul>
            </HelpCard>

            <HelpCard title="Penanganan Duplikat" icon={Copy} variant="step">
              <ul className="text-sm space-y-1">
                <li>• Tentukan kriteria mendefinisikan duplikat</li>
                <li>• Periksa apakah duplikat valid atau error</li>
                <li>• Pilih strategi: hapus, gabung, atau tandai</li>
                <li>• Dokumentasikan keputusan penanganan</li>
                <li>• Validasi impact pada analysis</li>
              </ul>
            </HelpCard>
          </div>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'tip' as const,
      title: 'Test pada Subset',
      content: 'Selalu test transformasi kompleks pada subset data kecil terlebih dahulu untuk memastikan hasil sesuai ekspektasi.'
    },
    {
      type: 'info' as const,
      title: 'Dokumentasi Transformasi',
      content: 'Dokumentasikan setiap step transformasi dengan detail untuk reproducibility dan audit trail yang baik.'
    },
    {
      type: 'warning' as const,
      title: 'Backup Data Asli',
      content: 'Jangan lupa backup data asli sebelum transformasi. Beberapa transformasi tidak bisa di-undo dengan mudah.'
    },
    {
      type: 'tip' as const,
      title: 'Validasi Hasil',
      content: 'Selalu validasi hasil transformasi dengan membandingkan statistik summary sebelum dan sesudah transformasi.'
    }
  ];

  const relatedTopics = [
    { title: 'Aggregate Data', href: '/help/data-guide/aggregate' },
    { title: 'Restructure Data', href: '/help/data-guide/restructure' },
    { title: 'Select Cases', href: '/help/data-guide/select-cases' },
    { title: 'Transpose Data', href: '/help/data-guide/transpose' },
    { title: 'Identify Duplicate Cases', href: '/help/data-guide/duplicates' }
  ];

  return (
    <HelpGuideTemplate
      title="Transformasi Data"
      description="Tools transformasi data memungkinkan Anda mengubah, memanipulasi, dan merestrukturisasi dataset untuk memenuhi kebutuhan analisis yang berbeda"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default DataTransformationTab;