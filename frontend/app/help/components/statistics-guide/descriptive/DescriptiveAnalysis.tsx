import React from 'react';
import { HelpContentWrapper } from '../../HelpContentWrapper';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HelpCircle } from 'lucide-react';

export const DescriptiveAnalysis: React.FC = () => {
  return (
    <HelpContentWrapper
      title="Descriptives – Algoritma"
      description="Cara Statify menghitung statistik deskriptif (mean, median, std. dev., dsb.) menggunakan Web Worker."
    >
      <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
        <div className="flex">
          <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <AlertTitle className="text-blue-800 font-medium mb-1">Ringkasan</AlertTitle>
            <AlertDescription className="text-blue-700">
              Komputasi dilakukan di thread terpisah (<code>descriptives.worker.js</code>) menggunakan kelas <code>DescriptiveCalculator</code> untuk kinerja optimal.
            </AlertDescription>
          </div>
                </div>
      </Alert>

      <div className="prose max-w-none">
        <h3>Langkah Algoritma</h3>
        <ol>
          <li>
            <strong>Validasi &amp; Pembersihan</strong><br />
            • Abaikan nilai non-numerik.<br />
            • Terapkan <em>weights</em> jika tersedia.
                  </li>
          <li>
            <strong>Hitung Ukuran Dasar</strong>
            <ul>
              <li>N (total kasus), Valid, Missing</li>
              <li>Sum dan Mean: <code>μ = Σx / N</code></li>
            </ul>
                  </li>
          <li>
            <strong>Sebaran</strong>
            <ul>
              <li>Variance: <code>σ² = Σ(x−μ)² / (N−1)</code></li>
              <li>Std. Deviation: <code>σ = √σ²</code></li>
              <li>Range: <code>max − min</code></li>
            </ul>
                  </li>
          <li>
            <strong>Ukuran Bentuk Distribusi</strong>
            <ul>
              <li>Skewness: <code>Σ[(x−μ)/σ]³ / N</code></li>
              <li>Kurtosis: <code>Σ[(x−μ)/σ]⁴ / N − 3</code></li>
                </ul>
          </li>
          <li>
            <strong>Rounding &amp; Output</strong><br />
            Objek hasil di-<em>round</em> sesuai <code>variable.decimals</code> sebelum dikirim ke UI.
          </li>
        </ol>

        <h3>Pseudocode Inti</h3>
        <pre>
{`const n = data.length;
const valid = data.filter(isNumeric);
const N = valid.length;
const sum = valid.reduce((a,b) => a + b, 0);
const mean = sum / N;
const variance = valid.reduce((a,b) => a + (b - mean) ** 2, 0) / (N - 1);
const stdDev = Math.sqrt(variance);
const min = Math.min(...valid);
const max = Math.max(...valid);
`}
        </pre>

        <h3>File Terkait</h3>
        <ul>
          <li><code>public/workers/DescriptiveStatistics/descriptives.worker.js</code></li>
          <li><code>public/workers/DescriptiveStatistics/libs/descriptive.js</code></li>
                </ul>
          </div>
    </HelpContentWrapper>
  );
};
