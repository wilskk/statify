/**
 * =============================================================================
 * WEB WORKER: REGRESI LOGISTIK ORDINAL (PROPORTIONAL ODDS MODEL)
 * Metode : Maximum Likelihood Estimation (MLE) via Newton-Raphson
 * Model  : logit[P(Y <= j | x)] = zeta_j - beta * x
 * Ref    : Agresti (2010), McCullagh (1980) — identik dengan polr() di R
 * =============================================================================
 *
 * ALUR KERJA:
 *   1. Terima data dari thread utama via self.onmessage
 *   2. Inisialisasi parameter dari quantile empiris kumulatif
 *   3. Iterasi Newton-Raphson: theta += H_LL^{-1} * g_LL
 *   4. Hitung Standard Error via Delta Method dari inverse Hessian
 *   5. Kirim hasil (estimate, SE, Wald, p-value, CI) ke thread utama
 *
 * FORMAT DATA INPUT (e.data):
 *   {
 *     data         : Array<{ y: number, x: number[], w?: number }>
 *                    y = kategori ordinal (1-based), x = prediktor, w = bobot
 *     featureNames : string[]   — nama variabel prediktor
 *     iterations   : number     — maksimum iterasi Newton-Raphson
 *   }
 *
 * FORMAT OUTPUT (postMessage):
 *   { type: "SUCCESS", payload: Array<ResultRow> }
 *   { type: "ERROR",   payload: string }
 *
 * ResultRow: { group, variable, estimate, stdError, wald, sig, lower, upper }
 */

self.onmessage = function (e) {
  try {
    const { data, featureNames, iterations } = e.data;

    // =========================================================================
    // BAGIAN 0: VALIDASI INPUT
    // =========================================================================
    if (!data || data.length === 0) throw new Error("Data kosong.");
    if (!featureNames || featureNames.length === 0) throw new Error("featureNames kosong.");

    // =========================================================================
    // BAGIAN 1: PERSIAPAN DIMENSI DAN STRUKTUR DATA
    // =========================================================================

    const n   = data.length;                             // Jumlah baris observasi
    const p   = featureNames.length;                     // Jumlah prediktor
    const yVals = data.map(d => d.y);                   // Array nilai Y (1-based)

    // Identifikasi semua kategori unik Y, urutkan ascending
    const categories = [...new Set(yVals)].sort((a, b) => a - b);
    const J  = categories.length;                        // Jumlah kategori total
    const J1 = J - 1;                                   // Jumlah cut-points (zeta)

    // Guard: model ordinal membutuhkan minimal 2 kategori (J1 >= 1 cut-point)
    if (J < 2) throw new Error(
      `Variabel dependen hanya memiliki ${J} kategori unik. ` +
      "Regresi Ordinal membutuhkan minimal 2 kategori."
    );
    // Peta nilai kategori asli -> indeks 0-based
    // Contoh: {1:0, 2:1, 3:2}
    const catToIdx = new Map(categories.map((c, i) => [c, i]));

    // Bobot frekuensi: gunakan w jika ada, default 1
    const weights = data.map(d => (d.w !== undefined ? d.w : 1));

    // Matriks prediktor X: (n x p), setiap baris = satu observasi
    const X = data.map(d => d.x);

    // Matriks indikator Y (one-hot): Y_mat[i][j] = 1 jika observasi i ada di kategori j
    // Direpresentasikan sebagai array of arrays (n x J)
    const Y_mat = data.map(d => {
      const row = new Array(J).fill(0);
      row[catToIdx.get(d.y)] = 1;
      return row;
    });

    // =========================================================================
    // BAGIAN 2: FUNGSI UTILITAS MATRIKS (pengganti numpy)
    // =========================================================================

    /**
     * Fungsi sigmoid (logistic CDF):  F(x) = 1 / (1 + exp(-x))
     * Clip ke [-500, 500] untuk mencegah overflow pada Math.exp().
     */
    function logistic(x) {
      return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
    }

    /**
     * Dot product dua vektor: sum(a[i] * b[i])
     */
    function dot(a, b) {
      let s = 0;
      for (let i = 0; i < a.length; i++) s += a[i] * b[i];
      return s;
    }

    /**
     * Matriks inisialisasi nol: rows x cols
     */
    function zeros(rows, cols) {
      return Array.from({ length: rows }, () => new Array(cols).fill(0));
    }

    /**
     * Transpose matriks: A[i][j] -> A[j][i]
     */
    function transpose(A) {
      const rows = A.length, cols = A[0].length;
      const T = zeros(cols, rows);
      for (let i = 0; i < rows; i++)
        for (let j = 0; j < cols; j++)
          T[j][i] = A[i][j];
      return T;
    }

    /**
     * Perkalian dua matriks: C = A @ B
     * A: (m x k), B: (k x n) => C: (m x n)
     */
    function matMul(A, B) {
      const m = A.length, k = A[0].length, nc = B[0].length;
      const C = zeros(m, nc);
      for (let i = 0; i < m; i++)
        for (let j = 0; j < nc; j++)
          for (let l = 0; l < k; l++)
            C[i][j] += A[i][l] * B[l][j];
      return C;
    }

    /**
     * Invers matriks persegi via eliminasi Gauss-Jordan dengan partial pivoting.
     * Bekerja untuk matriks (J1+p) x (J1+p) yang umumnya berukuran kecil.
     * Menghasilkan null jika matriks singular.
     */
    function matInv(A) {
      const n = A.length;
      // Augmented matrix [A | I]
      const M = A.map((row, i) => {
        const aug = [...row, ...new Array(n).fill(0)];
        aug[n + i] = 1;
        return aug;
      });

      for (let col = 0; col < n; col++) {
        // Partial pivoting: cari baris dengan nilai absolut terbesar di kolom ini
        let maxVal = Math.abs(M[col][col]);
        let maxRow = col;
        for (let row = col + 1; row < n; row++) {
          if (Math.abs(M[row][col]) > maxVal) {
            maxVal = Math.abs(M[row][col]);
            maxRow = row;
          }
        }
        // Swap baris
        [M[col], M[maxRow]] = [M[maxRow], M[col]];

        // Cek singularitas
        if (Math.abs(M[col][col]) < 1e-12) return null;

        // Normalisasi baris pivot
        const pivot = M[col][col];
        for (let j = 0; j < 2 * n; j++) M[col][j] /= pivot;

        // Eliminasi kolom
        for (let row = 0; row < n; row++) {
          if (row === col) continue;
          const factor = M[row][col];
          for (let j = 0; j < 2 * n; j++)
            M[row][j] -= factor * M[col][j];
        }
      }

      // Ekstrak bagian kanan sebagai hasil invers
      return M.map(row => row.slice(n));
    }

    /**
     * Selesaikan sistem linear Ax = b via invers: x = A^{-1} b
     * Mengembalikan null jika A singular.
     */
    function solve(A, b) {
      const Ainv = matInv(A);
      if (!Ainv) return null;
      // x[i] = sum_j Ainv[i][j] * b[j]
      return Ainv.map(row => dot(row, b));
    }

    // =========================================================================
    // BAGIAN 3: REPARAMETERISASI CUT-POINTS (menjamin monotonisitas)
    //
    // polr() di R menggunakan reparameterisasi:
    //   zeta[0]   = thetaRaw[0]                     (bebas)
    //   zeta[j]   = zeta[j-1] + exp(thetaRaw[j])   (selalu monoton naik)
    //
    // Karena exp() > 0, selisih antar cut-point selalu positif.
    // Ini menjamin zeta_1 < zeta_2 < ... < zeta_{J-1} sepanjang iterasi.
    // =========================================================================

    /**
     * Konversi parameter internal thetaRaw -> cut-points zeta yang monoton.
     * thetaRaw: array (J1,) -> zeta: array (J1,)
     */
    function thetaToZeta(thetaRaw) {
      const zeta = new Array(J1);
      zeta[0] = thetaRaw[0];
      for (let j = 1; j < J1; j++)
        zeta[j] = zeta[j - 1] + Math.exp(thetaRaw[j]);
      return zeta;
    }

    /**
     * Invers: konversi cut-points zeta -> parameterisasi internal thetaRaw.
     * Digunakan untuk mengkonversi nilai awal empiris ke ruang theta.
     * zeta: array (J1,) -> thetaRaw: array (J1,)
     */
    function zetaToTheta(zeta) {
      const thetaRaw = new Array(J1);
      thetaRaw[0] = zeta[0];
      for (let j = 1; j < J1; j++)
        thetaRaw[j] = Math.log(Math.max(zeta[j] - zeta[j - 1], 1e-10));
      return thetaRaw;
    }

    // =========================================================================
    // BAGIAN 4: FUNGSI PROBABILITAS
    //
    // Model: P(Y <= j | x) = logistic(zeta[j] - x @ beta)
    //
    // Probabilitas sel: P(Y = j | x) = P(Y<=j) - P(Y<=j-1)
    // Dengan sentinal: P(Y<=0) = 0, P(Y<=J) = 1
    // =========================================================================

    /**
     * Hitung probabilitas kumulatif F dan probabilitas sel pi untuk semua observasi.
     *
     * @param {number[]} zeta  - Cut-points (J1,)
     * @param {number[]} beta  - Koefisien prediktor (p,)
     * @returns {{ F: number[][], pi: number[][] }}
     *   F  : probabilitas kumulatif (n x J1), F[i][j] = P(Y <= j+1 | x_i)
     *   pi : probabilitas sel (n x J), pi[i][j] = P(Y = j+1 | x_i), di-clip ke [1e-15, 1]
     */
    function computeProbs(zeta, beta) {
      const F  = zeros(n, J1);   // Probabilitas kumulatif (n x J1)
      const pi = zeros(n, J);    // Probabilitas sel (n x J)

      for (let i = 0; i < n; i++) {
        const xb = dot(X[i], beta);    // x_i @ beta (skalar)

        // Hitung F[i][j] = P(Y <= j+1 | x_i) = logistic(zeta[j] - x_i @ beta)
        for (let j = 0; j < J1; j++)
          F[i][j] = logistic(zeta[j] - xb);

        // pi[i][0] = F[i][0] - 0            (sentinal kiri = 0)
        pi[i][0] = Math.max(F[i][0], 1e-15);

        // pi[i][j] = F[i][j] - F[i][j-1]   untuk j = 1,...,J-2
        for (let j = 1; j < J1; j++)
          pi[i][j] = Math.max(F[i][j] - F[i][j - 1], 1e-15);

        // pi[i][J-1] = 1 - F[i][J-2]       (sentinal kanan = 1)
        pi[i][J - 1] = Math.max(1 - F[i][J1 - 1], 1e-15);
      }

      return { F, pi };
    }

    // =========================================================================
    // BAGIAN 5: LOG-LIKELIHOOD
    //
    // LL = sum_i { w_i * sum_j [ y_ij * log(pi_ij) ] }
    // =========================================================================

    /**
     * Hitung weighted log-likelihood.
     * params: [thetaRaw (J1), beta (p)]
     */
    function logLikelihood(params) {
      const thetaRaw = params.slice(0, J1);
      const beta     = params.slice(J1);
      const zeta     = thetaToZeta(thetaRaw);
      const { pi }   = computeProbs(zeta, beta);

      let ll = 0;
      for (let i = 0; i < n; i++) {
        let rowLL = 0;
        for (let j = 0; j < J; j++)
          rowLL += Y_mat[i][j] * Math.log(pi[i][j]);  // y_ij * log(pi_ij)
        ll += weights[i] * rowLL;
      }
      return ll;
    }

    // =========================================================================
    // BAGIAN 6: GRADIENT (SCORE VECTOR) ANALITIK
    //
    // RUMUS:
    //   Definisikan:
    //     f_{ij}     = F_{ij} * (1 - F_{ij})            [PDF logistik]
    //     mu_{ij}    = y_{ij} / pi_{ij}                 [weighted residual]
    //     dm_{ij}    = mu_{ij} - mu_{i,j+1}             [net score per cut-point]
    //
    //   Gradient terhadap zeta_j (sebelum reparameterisasi):
    //     g_zeta[j] = sum_i { w_i * f_{ij} * dm_{ij} }
    //
    //   Gradient terhadap beta_k:
    //     g_beta[k] = -sum_i { w_i * x_{ik} * sum_j(f_{ij} * dm_{ij}) }
    //     (tanda negatif dari d(eta)/d(beta) = -x)
    //
    //   Chain rule ke thetaRaw:
    //     g_theta[0] = sum_j { g_zeta[j] }
    //     g_theta[k] = exp(thetaRaw[k]) * sum_{j>=k} { g_zeta[j] }  untuk k>=1
    // =========================================================================

    /**
     * Hitung gradient LL terhadap semua parameter.
     * @returns {number[]} gradient panjang (J1 + p)
     */
    function computeGradient(params, zeta, beta, F, pi) {
      const thetaRaw = params.slice(0, J1);

      // f[i][j] = F[i][j] * (1 - F[i][j]) = PDF logistik
      const f = F.map(Fi => Fi.map(Fij => Fij * (1 - Fij)));

      // mu[i][j] = y_ij / pi_ij
      const mu = Y_mat.map((yi, i) => yi.map((yij, j) => yij / pi[i][j]));

      // dm[i][j] = mu[i][j] - mu[i][j+1]  untuk j = 0,...,J1-1
      const dm = mu.map(mi => Array.from({ length: J1 }, (_, j) => mi[j] - mi[j + 1]));

      // --- Gradient terhadap zeta (sebelum chain rule) ---
      const g_zeta = new Array(J1).fill(0);
      for (let j = 0; j < J1; j++)
        for (let i = 0; i < n; i++)
          g_zeta[j] += weights[i] * f[i][j] * dm[i][j];

      // --- Gradient terhadap beta ---
      const g_beta = new Array(p).fill(0);
      for (let i = 0; i < n; i++) {
        // score_i = sum_j { f_{ij} * dm_{ij} }
        let scoreI = 0;
        for (let j = 0; j < J1; j++) scoreI += f[i][j] * dm[i][j];
        // g_beta[k] += -w_i * x_{ik} * score_i
        for (let k = 0; k < p; k++)
          g_beta[k] -= weights[i] * X[i][k] * scoreI;
      }

      // --- Chain rule: g_zeta -> g_thetaRaw ---
      // Hitung cumulative sum dari kanan: cumRight[j] = sum_{l=j}^{J1-1} g_zeta[l]
      const cumRight = new Array(J1).fill(0);
      cumRight[J1 - 1] = g_zeta[J1 - 1];
      for (let j = J1 - 2; j >= 0; j--)
        cumRight[j] = cumRight[j + 1] + g_zeta[j];

      const g_theta = new Array(J1);
      g_theta[0] = cumRight[0];                           // sum semua g_zeta
      for (let k = 1; k < J1; k++)
        g_theta[k] = Math.exp(thetaRaw[k]) * cumRight[k]; // exp(theta[k]) * sum_{j>=k}

      return [...g_theta, ...g_beta];    // Panjang: J1 + p
    }

    // =========================================================================
    // BAGIAN 7: HESSIAN (NEGATIVE OBSERVED INFORMATION MATRIX) ANALITIK
    //
    // H di sini adalah -H_LL (positive definite), yaitu Information Matrix.
    // Dibangun dalam 4 blok:
    //
    //   [H_zz  H_zb]   (zeta-zeta)  (zeta-beta)
    //   [H_bz  H_bb]   (beta-zeta)  (beta-beta)
    //
    // Kemudian ditransformasi dari ruang zeta ke ruang thetaRaw via Jacobian.
    //
    // RUMUS BLOK (dalam ruang zeta, sebelum transformasi):
    //
    //   H_zz[j,j]   = sum_i { w_i * [f_ij^2*(1/pi_j + 1/pi_{j+1}) - df_ij*dm_ij] }
    //   H_zz[j,j+1] = sum_i { w_i * f_ij * f_{i,j+1} / pi_{i,j+1} }  (bersebelahan)
    //   H_zb[j,k]   = -sum_i { w_i * x_{ik} * [f_ij^2*(1/pi_j+1/pi_{j+1}) - df_ij*dm_ij] }
    //   H_bb[k,l]   = sum_i { w_i * x_{ik} * x_{il} * sum_j [f_ij^2*(1/pi_j+1/pi_{j+1})] }
    //
    // TRANSFORMASI KE RUANG thetaRaw:
    //   Jacobian: Jmat[a][k] = d(zeta_a)/d(thetaRaw[k])
    //     Jmat[a][0] = 1                        (semua zeta bergantung theta[0])
    //     Jmat[a][k] = exp(thetaRaw[k])  k<=a   (zeta[a] bergantung theta[k] jika k<=a)
    //     Jmat[a][k] = 0                 k>a
    //
    //   H_theta_zz = Jmat.T @ H_zz @ Jmat  (+koreksi second-order)
    //   H_theta_zb = Jmat.T @ H_zb
    // =========================================================================

    /**
     * Hitung Information Matrix (-Hessian LL) dalam ruang thetaRaw.
     * @returns {number[][]} matriks (J1+p) x (J1+p)
     */
    function computeHessian(params, zeta, beta, F, pi, g_zeta_orig) {
      const thetaRaw = params.slice(0, J1);
      const totalDim = J1 + p;

      // f[i][j] = PDF logistik
      const f  = F.map(Fi => Fi.map(Fij => Fij * (1 - Fij)));
      // df[i][j] = d(f)/d(eta) = f*(1-2F)  (turunan kedua CDF)
      const df = F.map((Fi, i) => Fi.map((Fij, j) => f[i][j] * (1 - 2 * Fij)));

      // mu[i][j] = y_ij/pi_ij
      const mu = Y_mat.map((yi, i) => yi.map((yij, j) => yij / pi[i][j]));
      // dm[i][j] = mu[i][j] - mu[i][j+1]
      const dm = mu.map(mi => Array.from({ length: J1 }, (_, j) => mi[j] - mi[j + 1]));

      // Inisialisasi Hessian dalam ruang zeta: (J1+p) x (J1+p)
      const H_z = zeros(totalDim, totalDim);

      for (let i = 0; i < n; i++) {
        const wi   = weights[i];
        const pi_i = pi[i];
        const f_i  = f[i];
        const df_i = df[i];
        const dm_i = dm[i];
        const x_i  = X[i];

        for (let j = 0; j < J1; j++) {
          // Faktor diagonal: f_j^2*(1/pi_j + 1/pi_{j+1}) - df_j*dm_j
          const diagFactor = f_i[j] ** 2 * (1 / pi_i[j] + 1 / pi_i[j + 1])
                           - df_i[j] * dm_i[j];

          // --- Blok (zeta_j, zeta_j): diagonal ---
          H_z[j][j] += wi * diagFactor;

          // --- Blok (zeta_j, zeta_{j+1}): off-diagonal bersebelahan ---
          if (j < J1 - 1) {
            const offVal = wi * f_i[j] * f_i[j + 1] / pi_i[j + 1];
            H_z[j][j + 1] += offVal;    // Simetris
            H_z[j + 1][j] += offVal;
          }

          // --- Blok (zeta_j, beta_k): cross-term ---
          // H_zb[j][k] = -w * x_k * diagFactor
          for (let k = 0; k < p; k++) {
            const crossVal = -wi * x_i[k] * diagFactor;
            H_z[j][J1 + k] += crossVal;      // Baris zeta, kolom beta
            H_z[J1 + k][j] += crossVal;      // Simetris (beta baris, zeta kolom)
          }
        }

        // --- Blok (beta_k, beta_l): ---
        // Faktor skalar: sum_j [f_j^2*(1/pi_j + 1/pi_{j+1})]
        let betaFactor = 0;
        for (let j = 0; j < J1; j++)
          betaFactor += f_i[j] ** 2 * (1 / pi_i[j] + 1 / pi_i[j + 1]);

        // H_bb += w * x_i * x_i.T * betaFactor  (outer product)
        for (let k = 0; k < p; k++)
          for (let l = 0; l < p; l++)
            H_z[J1 + k][J1 + l] += wi * x_i[k] * x_i[l] * betaFactor;
      }

      // -----------------------------------------------------------------------
      // TRANSFORMASI: ruang zeta -> ruang thetaRaw
      //
      // Bangun Jacobian Jmat[a][k] = d(zeta_a)/d(thetaRaw[k])
      // -----------------------------------------------------------------------
      const Jmat = zeros(J1, J1);
      for (let a = 0; a < J1; a++) {
        Jmat[a][0] = 1;                                  // theta[0] mempengaruhi semua zeta
        for (let k = 1; k <= a; k++)
          Jmat[a][k] = Math.exp(thetaRaw[k]);            // exp(theta[k]) untuk k<=a
      }

      // Blok zeta-zeta: H_theta_zz = Jmat.T @ H_zz @ Jmat
      const H_zz    = H_z.slice(0, J1).map(row => row.slice(0, J1));
      const JmatT   = transpose(Jmat);
      const H_th_zz = matMul(matMul(JmatT, H_zz), Jmat);

      // Koreksi second-order untuk diagonal thetaRaw[k>=1]:
      // Term tambahan: exp(thetaRaw[k]) * sum_{j>=k} { g_zeta_orig[j] }
      // g_zeta_orig adalah gradient LL terhadap zeta asli (sebelum chain rule)
      for (let k = 1; k < J1; k++) {
        let sumGzeta = 0;
        for (let j = k; j < J1; j++) sumGzeta += g_zeta_orig[j];
        H_th_zz[k][k] += Math.exp(thetaRaw[k]) * sumGzeta;
      }

      // Blok zeta-beta: H_theta_zb = Jmat.T @ H_zb
      const H_zb    = H_z.slice(0, J1).map(row => row.slice(J1));
      const H_th_zb = matMul(JmatT, H_zb);

      // Blok beta-zeta (transpose dari zeta-beta): H_theta_bz = H_bz @ Jmat
      const H_bz    = H_z.slice(J1).map(row => row.slice(0, J1));
      const H_th_bz = matMul(H_bz, Jmat);

      // Blok beta-beta: tidak berubah
      const H_bb = H_z.slice(J1).map(row => row.slice(J1));

      // Rakit Hessian akhir dalam ruang thetaRaw
      const H_final = zeros(totalDim, totalDim);
      for (let i = 0; i < J1; i++) {
        for (let j = 0; j < J1; j++) H_final[i][j]         = H_th_zz[i][j];
        for (let j = 0; j < p;  j++) H_final[i][J1 + j]    = H_th_zb[i][j];
      }
      for (let i = 0; i < p; i++) {
        for (let j = 0; j < J1; j++) H_final[J1 + i][j]    = H_th_bz[i][j];
        for (let j = 0; j < p;  j++) H_final[J1 + i][J1 + j] = H_bb[i][j];
      }

      return H_final;
    }

    // =========================================================================
    // BAGIAN 8: INISIALISASI NILAI AWAL
    //
    // Mengikuti konvensi polr() di R:
    //   zeta_j_init = logit( P_empiris(Y <= j) )
    //               = log( cumProp[j] / (1 - cumProp[j]) )
    //
    // beta diinisialisasi = 0 untuk semua koefisien.
    // =========================================================================

    const totalWeight = weights.reduce((s, w) => s + w, 0);

    // Hitung proporsi kumulatif tertimbang: cumProp[j] = P(Y <= j+1)
    const cumProp = Array.from({ length: J1 }, (_, j) => {
      // Jumlah bobot untuk observasi dengan Y <= kategori j+1
      let cumW = 0;
      for (let i = 0; i < n; i++) {
        for (let jj = 0; jj <= j; jj++) cumW += weights[i] * Y_mat[i][jj];
      }
      return Math.min(Math.max(cumW / totalWeight, 0.005), 0.995);  // clip [0.005, 0.995]
    });

    // logit(p) = log(p / (1-p)) sebagai nilai awal cut-points
    const zeta_init = cumProp.map(p => Math.log(p / (1 - p)));

    // Konversi ke parameterisasi internal thetaRaw
    const thetaRaw_init = zetaToTheta(zeta_init);

    // Parameter awal: [thetaRaw (J1), beta=0 (p)]
    let params = [...thetaRaw_init, ...new Array(p).fill(0)];

    // =========================================================================
    // BAGIAN 9: ITERASI NEWTON-RAPHSON
    //
    // UPDATE RULE:
    //   theta_{t+1} = theta_t + H_LL^{-1} * g_LL
    //              = theta_t + (−H_negLL)^{-1} * g_LL
    //
    // Karena H_negLL = -H_LL (positive definite), dan g_LL = gradient LL:
    //   delta = solve(H_negLL, g_LL)   [H_negLL * delta = g_LL]
    //   theta_{t+1} = theta_t + delta
    //
    // Backtracking line search (Armijo): pastikan LL selalu naik.
    // Konvergensi: |LL_{t+1} - LL_t| < 1e-7
    // =========================================================================

    const maxIter = iterations || 100;
    const tol     = 1e-7;
    let llPrev    = null;

    for (let iter = 0; iter < maxIter; iter++) {
      const thetaRaw = params.slice(0, J1);
      const beta     = params.slice(J1);
      const zeta     = thetaToZeta(thetaRaw);

      // Hitung probabilitas
      const { F, pi } = computeProbs(zeta, beta);

      // Hitung LL saat ini
      const llNow = logLikelihood(params);

      // Cek konvergensi
      if (llPrev !== null && Math.abs(llNow - llPrev) < tol) break;
      llPrev = llNow;

      // Hitung g_zeta_orig (gradient LL terhadap zeta asli, untuk koreksi Hessian)
      const f_raw = F.map(Fi => Fi.map(Fij => Fij * (1 - Fij)));
      const mu_raw = Y_mat.map((yi, i) => yi.map((yij, j) => yij / pi[i][j]));
      const dm_raw = mu_raw.map(mi => Array.from({ length: J1 }, (_, j) => mi[j] - mi[j + 1]));
      const g_zeta_orig = new Array(J1).fill(0);
      for (let j = 0; j < J1; j++)
        for (let i = 0; i < n; i++)
          g_zeta_orig[j] += weights[i] * f_raw[i][j] * dm_raw[i][j];

      // Hitung gradient LL
      const grad = computeGradient(params, zeta, beta, F, pi);

      // Hitung Hessian (-H_LL = Information Matrix)
      const H = computeHessian(params, zeta, beta, F, pi, g_zeta_orig);

      // Regularisasi diagonal kecil untuk stabilitas numerik (Tikhonov)
      const totalDim = J1 + p;
      for (let i = 0; i < totalDim; i++) H[i][i] += 1e-8;

      // Selesaikan: H * delta = grad  =>  delta = H^{-1} * grad
      const delta = solve(H, grad);
      if (!delta) break;   // Hessian singular, berhenti

      // Backtracking line search: kurangi step size sampai LL naik
      let step   = 1.0;
      const gradNorm = Math.sqrt(grad.reduce((s, g) => s + g * g, 0));
      for (let halfIt = 0; halfIt < 20; halfIt++) {
        const paramsNew = params.map((p_, k) => p_ + step * delta[k]);
        const llNew     = logLikelihood(paramsNew);
        // Armijo condition: LL cukup naik
        if (llNew > llNow - 1e-4 * step * gradNorm * gradNorm) {
          params = paramsNew;
          break;
        }
        step *= 0.5;
      }
    }

    // =========================================================================
    // BAGIAN 10: EKSTRAK HASIL AKHIR
    // =========================================================================

    const thetaRaw_final = params.slice(0, J1);
    const beta_final     = params.slice(J1);
    const zeta_final     = thetaToZeta(thetaRaw_final);
    const ll_final       = logLikelihood(params);

    // =========================================================================
    // BAGIAN 11: STANDARD ERROR via DELTA METHOD
    //
    // Var(theta) = H^{-1}  (inverse Information Matrix = Var-Cov matrix)
    //
    // SE(beta_k)  = sqrt(Var[J1+k][J1+k])
    //
    // SE(zeta_j) menggunakan Delta Method karena zeta = g(thetaRaw):
    //   Var(zeta) = Jmat @ Var(thetaRaw_block) @ Jmat.T
    //   SE(zeta_j) = sqrt(Var_zeta[j][j])
    // =========================================================================

    // Hitung Hessian final dan inverse-nya
    const { F: F_final, pi: pi_final } = computeProbs(zeta_final, beta_final);

    // g_zeta_orig untuk Hessian final
    const f_fin = F_final.map(Fi => Fi.map(Fij => Fij * (1 - Fij)));
    const mu_fin = Y_mat.map((yi, i) => yi.map((yij, j) => yij / pi_final[i][j]));
    const dm_fin = mu_fin.map(mi => Array.from({ length: J1 }, (_, j) => mi[j] - mi[j + 1]));
    const g_zeta_fin = new Array(J1).fill(0);
    for (let j = 0; j < J1; j++)
      for (let i = 0; i < n; i++)
        g_zeta_fin[j] += weights[i] * f_fin[i][j] * dm_fin[i][j];

    const H_fin = computeHessian(params, zeta_final, beta_final, F_final, pi_final, g_zeta_fin);

    // Regularisasi dan invers untuk Var-Cov matrix
    const totalDim = J1 + p;
    for (let i = 0; i < totalDim; i++) H_fin[i][i] += 1e-8;
    const VarCov = matInv(H_fin);

    // SE untuk beta (langsung dari diagonal blok beta)
    const se_beta = VarCov
      ? beta_final.map((_, k) => Math.sqrt(Math.abs(VarCov[J1 + k][J1 + k])))
      : beta_final.map(() => NaN);

    // SE untuk zeta via Delta Method:
    // Var(zeta) = Jmat @ Var(thetaRaw_block) @ Jmat.T
    let se_zeta = zeta_final.map(() => NaN);
    if (VarCov) {
      // Bangun Jacobian Jmat
      const Jmat = zeros(J1, J1);
      for (let a = 0; a < J1; a++) {
        Jmat[a][0] = 1;
        for (let k = 1; k <= a; k++)
          Jmat[a][k] = Math.exp(thetaRaw_final[k]);
      }
      // Var(thetaRaw) adalah blok kiri-atas dari VarCov
      const Var_theta = VarCov.slice(0, J1).map(row => row.slice(0, J1));
      // Var(zeta) = Jmat @ Var_theta @ Jmat.T
      const Var_zeta = matMul(matMul(Jmat, Var_theta), transpose(Jmat));
      se_zeta = zeta_final.map((_, j) => Math.sqrt(Math.abs(Var_zeta[j][j])));
    }

    // =========================================================================
    // BAGIAN 12: STATISTIK INFERENSI
    //
    // Wald statistic: W = (estimate / SE)^2  ~  chi-squared(df=1)
    // p-value (two-sided normal): 2 * (1 - Phi(|z|))
    //   Approx: 2 * exp(-0.5 * z^2) / sqrt(2*pi) * correction  -- atau gunakan:
    //   p ≈ erfc(|z| / sqrt(2))
    // 95% CI: estimate ± 1.96 * SE
    // =========================================================================

    /**
     * Aproximasi p-value dua sisi dari z-score via erfc.
     * erfc(x) = 2/sqrt(pi) * integral_x^inf exp(-t^2) dt
     * Menggunakan Horner's approximation untuk erfc.
     */
    function pValueFromZ(z) {
      // Gunakan relasi: p = erfc(|z| / sqrt(2))
      const x = Math.abs(z) / Math.SQRT2;
      // Aproximasi Abramowitz & Stegun (error < 1.5e-7)
      const t = 1 / (1 + 0.3275911 * x);
      const poly = t * (0.254829592
                 + t * (-0.284496736
                 + t * (1.421413741
                 + t * (-1.453152027
                 + t * 1.061405429))));
      return Math.max(2 * poly * Math.exp(-x * x), 0);
    }

    const z96 = 1.96;   // Kuantil normal untuk 95% CI

    // =========================================================================
    // BAGIAN 13: SUSUN HASIL OUTPUT
    //
    // PENTING — FORMAT KONTRAK dengan formatOrdinalResult() di formatter.ts:
    //
    //   payload harus berupa Array<ResultRow> yang FLAT, identik dengan
    //   format yang dikonsumsi formatter (bukan object {sections:[...]}).
    //
    //   formatOrdinalResult() menerima Array<ResultRow> lalu membangun
    //   sections secara internal. Setiap ResultRow:
    //
    //   {
    //     group    : "Threshold" | "Location"   ← pemisah antar blok tabel
    //     variable : string                      ← nama baris
    //     estimate : number                      ← nilai estimasi parameter
    //     stdError : number                      ← standard error
    //     wald     : number                      ← Wald chi-square = (est/SE)^2
    //     sig      : number                      ← p-value dua sisi
    //     lower    : number                      ← batas bawah 95% CI
    //     upper    : number                      ← batas atas 95% CI
    //   }
    //
    // ⚠️  JANGAN bungkus dalam object { sections: [...] }.
    //     formatOrdinalResult() yang akan mengubahnya menjadi sections.
    //     Jika dibungkus, formatter akan membaca payload.sections = undefined
    //     → undefined.length → "Cannot read properties of undefined" ERROR.
    // =========================================================================

    /** Baris hasil untuk satu parameter. */
    const buildRow = (group, variable, estimate, se) => {
      const z  = isFinite(se) && se > 0 ? estimate / se : 0;
      const w  = z * z;                  // Wald statistic = z² ~ chi-squared(1)
      const pv = pValueFromZ(z);         // p-value dua sisi
      return {
        group,
        variable,
        estimate,
        stdError : se,
        wald     : w,
        sig      : pv,
        lower    : estimate - z96 * se,  // Batas bawah 95% CI
        upper    : estimate + z96 * se,  // Batas atas 95% CI
      };
    };

    // --- Threshold rows: cut-points zeta ---
    // Label konvensi polr R: "kategori_j|kategori_{j+1}", contoh "1|2", "2|3"
    const thresholdRows = zeta_final.map((zeta_j, i) =>
      buildRow(
        "Threshold",
        `${categories[i]}|${categories[i + 1]}`,
        zeta_j,
        se_zeta[i]
      )
    );

    // --- Location rows: koefisien beta ---
    const locationRows = beta_final.map((beta_k, i) =>
      buildRow("Location", featureNames[i], beta_k, se_beta[i])
    );

    // Flat array — inilah yang diharapkan formatOrdinalResult()
    const results = [...thresholdRows, ...locationRows];

    // Kirim flat Array<ResultRow> ke thread utama.
    // OrdinalMain akan meneruskannya ke formatOrdinalResult(payload).
    self.postMessage({ type: "SUCCESS", payload: results });

  } catch (err) {
    self.postMessage({ type: "ERROR", payload: err.message });
  }
};