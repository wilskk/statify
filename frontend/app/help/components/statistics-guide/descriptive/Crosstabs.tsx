import React from 'react';
import { HelpContentWrapper } from '../../HelpContentWrapper';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HelpCircle } from 'lucide-react';

export const Crosstabs: React.FC = () => {
  return (
    <HelpContentWrapper
      title="Crosstabs – Algoritma"
      description="Ringkasan perhitungan tabel silang, Chi-Square, dan ukuran asosiasi di Statify."
    >
      <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
        <div className="flex">
          <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <AlertTitle className="text-blue-800 font-medium mb-1">Ringkasan</AlertTitle>
            <AlertDescription className="text-blue-700">
              Proses dihitung di <code>crosstabs.worker.js</code> melalui <code>CrosstabsCalculator</code>. Algoritma membuat<br />
              tabel kontingensi berbobot, lalu menghitung Chi-Square, Cramer’s&nbsp;V, Gamma, Tau-b/c, dsb.
            </AlertDescription>
          </div>
        </div>
      </Alert>

      <div className="prose max-w-none">
        <h3>Langkah Algoritma</h3>
        <ol>
          <li>
            <strong>Bangun Tabel Kontingensi</strong><br />
            • Iterasi kasus → tambahkan bobot ke sel <code>f_ij</code>.<br />
            • Simpan <code>rowTotals</code>, <code>colTotals</code>, dan <code>W</code> (grand total).
                  </li>
          <li>
            <strong>Expected Counts</strong><br />
            <code>E_ij = (r_i × c_j) / W</code>
                  </li>
          <li>
            <strong>Hitungan Teramati &amp; Diharapkan</strong><br />
            • Observed: <code>O = f_ij</code><br />
            • Expected: <code>E = (r_i × c_j) / W</code>
          </li>
          <li>
            <strong>Persentase</strong>
            <ul>
              <li><code>%Row = O / r_i × 100</code></li>
              <li><code>%Col = O / c_j × 100</code></li>
              <li><code>%Total = O / W × 100</code></li>
            </ul>
          </li>
          <li>
            <strong>Residuals</strong>
            <ul>
              <li>Unstandardized: <code>O − E</code></li>
              <li>Standardized: <code>(O − E) / √E</code></li>
              <li>Adjusted: <code>(O − E) / √(E × (1−r_i/W) × (1−c_j/W))</code></li>
            </ul>
          </li>
          <li>
            <strong>Concordant / Discordant Pairs</strong><br />
            • Buat matriks kumulatif S &amp; T untuk hitung P dan Q dalam O(RC).<br />
            • Gunakan untuk Gamma, Tau-b, Tau-c, Somers’ D.
            </li>
          <li>
            <strong>Validasi Ukuran Sampel</strong><br />
            • Flag jika &gt;20&nbsp;% sel memiliki <code>E &lt; 5</code> untuk peringatan Chi-Square.
            </li>
          <li>
            <strong>Output</strong><br />
            • Objek JSON berisi <code>table</code>, <code>expected</code>, dan <code>statistics</code> di-round sesuai <code>decimals</code>.
            </li>
        </ol>

        <h3>Pseudocode Inti</h3>
        <pre>{`// Build contingency table
for (i = 0; i < N; i++) {
  if (rowMissing || colMissing) continue;
  let r = rowIndex(rowVal), c = colIndex(colVal);
  table[r][c] += w_i;
  rowTotals[r] += w_i;
  colTotals[c] += w_i;
  W += w_i;
}
// Persentase
rowPct = O / r_i * 100;
colPct = O / c_j * 100;
totPct = O / W   * 100;
`}</pre>

        <h3>File Terkait</h3>
        <ul>
          <li><code>public/workers/DescriptiveStatistics/crosstabs.worker.js</code></li>
          <li><code>public/workers/DescriptiveStatistics/libs/crosstabs.js</code></li>
          </ul>
    </div>
    </HelpContentWrapper>
  );
};

