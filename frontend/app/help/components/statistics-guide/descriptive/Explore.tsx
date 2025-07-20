import React from 'react';
import { HelpContentWrapper } from '../../HelpContentWrapper';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HelpCircle } from 'lucide-react';

export const Explore: React.FC = () => {
  return (
    <HelpContentWrapper
      title="Explore – Algoritma"
      description="Penjelasan inti tentang bagaimana Statify menghitung trimmed mean, M-estimators, percentiles, dan mendeteksi outlier di dialog Explore."
    >
      <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
        <div className="flex">
          <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <AlertTitle className="text-blue-800 font-medium mb-1">Ringkasan</AlertTitle>
            <AlertDescription className="text-blue-700">
              Komputasi dilakukan oleh <code>examine.worker.js</code> menggunakan kelas <code>ExamineCalculator</code> yang
              memanfaatkan <code>DescriptiveCalculator</code> &amp; <code>FrequencyCalculator</code> untuk perhitungan lanjutan.
            </AlertDescription>
          </div>
                    </div>
      </Alert>

      <div className="prose max-w-none">
        <h3>Langkah Algoritma</h3>
        <ol>
          <li>
            <strong>Inisialisasi Kalkulator</strong><br />
            • <code>DescriptiveCalculator</code> → mean, std. dev, dll.<br />
            • <code>FrequencyCalculator</code> → mode, percentiles.<br />
                  </li>
          <li>
            <strong>5% Trimmed Mean</strong><br />
            • Buang 5 % kasus teratas &amp; terbawah berdasar kumulatif bobot.<br />
            • Hitung mean dari data tersisa.
                  </li>
          <li>
            <strong>M-Estimators (lokasi robust)</strong><br />
            • Iteratif (maks 30) menggunakan fungsi bobot (Huber, Hampel, Andrews, Tukey).<br />
            • Konvergensi jika perubahan &lt; ε.
                  </li>
          <li>
            <strong>Percentiles Multi-Metode</strong><br />
            • Metode <em>weighted average</em>, <em>empirical</em>, &amp; <em>round</em> untuk 5-95 %.
                  </li>
          <li>
            <strong>Deteksi Outlier/Extreme</strong><br />
            • Hitung IQR → inner fence (Q1 ± 1.5 × IQR) &amp; outer fence (Q1 ± 3 × IQR).<br />
            • Tandai nilai di luar batas sebagai <em>outlier</em> / <em>extreme</em>.
                  </li>
          <li>
            <strong>Pembulatan &amp; Output</strong><br />
            Nilai numerik di-<em>round</em> ke <code>variable.decimals</code> lewat <code>roundDeep()</code> sebelum dikirim.
                  </li>
        </ol>

        <h3>Pseudocode Ringkas</h3>
        <pre>{`// Trimmed Mean (5%)
const tc = 0.05 * W;          // W = total weight
const k1 = cc.findIndex(cum => cum >= tc);
const k2 = cc.findIndex(cum => cum >= W - tc);
// Hitung mean di antara k1..k2 (termasuk koreksi ujung)

// M-Estimator (Huber)
let T = median;
for (iter = 0; iter < 30; iter++) {
  num = Σ w_i * x_i * ψ(u_i);
  den = Σ w_i * ψ(u_i);
  T1  = den === 0 ? T : num / den;
  if (|T1−T| < ε) break;
  T = T1;
}
`}</pre>

        <h3>File Terkait</h3>
        <ul>
          <li><code>public/workers/DescriptiveStatistics/examine.worker.js</code></li>
          <li><code>public/workers/DescriptiveStatistics/libs/examine.js</code></li>
                  </ul>
                </div>
    </HelpContentWrapper>
  );
};
