import React from 'react';
import { HelpContentWrapper } from '../../HelpContentWrapper';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HelpCircle } from 'lucide-react';

export const Frequencies: React.FC = () => {
  return (
    <HelpContentWrapper
      title="Frequencies – Algoritma"
      description="Penjelasan ringkas mengenai cara Statify menghitung tabel frekuensi dan statistik deskriptif dasar."
    >
      <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
        <div className="flex">
          <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <AlertTitle className="text-blue-800 font-medium mb-1">Ringkasan</AlertTitle>
            <AlertDescription className="text-blue-700">
              Statify menggunakan <code>FrequencyCalculator</code> (Web Worker) untuk menghitung frekuensi, persentase, dan persentil secara efisien bahkan pada dataset besar.
            </AlertDescription>
          </div>
                    </div>
      </Alert>

      <div className="prose max-w-none">
        <h3>Langkah Algoritma</h3>
        <ol>
          <li>
            <strong>Prasiapkan Data</strong><br />
            • Gabungkan bobot (jika ada) dengan data mentah.<br />
            • Lewati nilai non-numerik atau hilang.
                  </li>
          <li>
            <strong>Kompilasi Nilai Unik</strong><br />
            Buat <em>map</em> <code>{'{'}value ➜ totalWeight{'}'}</code> untuk menghitung frekuensi berbobot.
                  </li>
          <li>
            <strong>Urutkan Nilai</strong><br />
            Susun kunci <code>value</code> secara menaik untuk mempermudah perhitungan persentil.
                  </li>
          <li>
            <strong>Hitung Hitungan Kumulatif</strong><br />
            <code>cc[i] = cc[i - 1] + c[i]</code>
                  </li>
          <li>
            <strong>Buat Tabel Frekuensi</strong>
            <ul>
              <li>Frequency = <code>c[i]</code></li>
              <li>Percent = <code>frequency / totalN × 100</code></li>
              <li>Valid Percent = <code>frequency / validN × 100</code></li>
              <li>Cumulative Percent = Σ Valid Percent</li>
                </ul>
                  </li>
          <li>
            <strong>Statistik Tambahan</strong><br />
            • Mode: nilai dengan frekuensi tertinggi.<br />
            • Persentil: dihitung dengan metode <em>weighted average</em> (SPSS) atau metode lain yang dipilih.
                  </li>
        </ol>

        <h3>Pseudocode Sederhana</h3>
        <pre>
{`const weighted = new Map();
for (let i = 0; i < data.length; i++) {
  if (!isNumeric(data[i])) continue;
  const w = weights ? weights[i] ?? 1 : 1;
  weighted.set(data[i], (weighted.get(data[i]) || 0) + w);
}
const y = [...weighted.keys()].sort((a, b) => a - b);
const c = y.map(v => weighted.get(v));
const cc = c.reduce((acc, v) => [...acc, (acc.at(-1) ?? 0) + v], []);
`}
        </pre>

        <h3>File Terkait</h3>
        <ul>
          <li><code>public/workers/DescriptiveStatistics/frequencies.worker.js</code></li>
          <li><code>public/workers/DescriptiveStatistics/libs/frequency.js</code></li>
                </ul>
          </div>
    </HelpContentWrapper>
  );
};

