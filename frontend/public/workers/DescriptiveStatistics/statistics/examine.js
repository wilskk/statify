/**
 * examine.js
 * Implementasi algoritma EXAMINE untuk analisis statistik eksploratori
 * Mengimpor fungsi-fungsi dari descriptives.js dan frequencies.js
 */

import {
    calculateMean,
    calculateVariance,
    calculateStandardDeviation,
    calculateStandardError,
    calculateSkewness,
    calculateKurtosis
} from './descriptives';

import {
    calculateMedian,
    calculateFrequencies,
    calculateFrequencyStatistics
} from './frequencies';

/**
 * Menghitung percentile dengan berbagai metode
 * @param {Array<number>} data - Array nilai numerik
 * @param {Array<number>} weights - Array bobot (opsional)
 * @param {number} p - Percentile yang ingin dihitung (0-100)
 * @param {string} method - Metode perhitungan ('WAVERAGE', 'ROUND', 'EMPIRICAL', 'HAVERAGE', 'AEMPIRICAL')
 * @return {number} Nilai percentile
 */
const calculatePercentileExamine = (data, weights = null, p, method = 'HAVERAGE') => {
    if (p < 0 || p > 100) {
        throw new Error('Percentile harus antara 0 dan 100');
    }

    // Siapkan data terurut dan bobot
    const sortedData = [];
    const sortedWeights = [];

    const useWeights = Array.isArray(weights) && weights.length === data.length;

    // Kumpulkan data valid dan urutkan
    for (let i = 0; i < data.length; i++) {
        const x = data[i];

        // Skip nilai yang null atau NaN
        if (x === null || isNaN(x)) continue;

        const w = useWeights ? weights[i] : 1;

        // Skip jika bobot 0, negatif, atau NaN
        if (w <= 0 || isNaN(w)) continue;

        sortedData.push(x);
        sortedWeights.push(w);
    }

    // Urutkan data
    const indices = sortedData.map((_, i) => i);
    indices.sort((a, b) => sortedData[a] - sortedData[b]);

    const xSorted = indices.map(i => sortedData[i]);
    const wSorted = indices.map(i => sortedWeights[i]);

    // Hitung total bobot
    const W = wSorted.reduce((sum, w) => sum + w, 0);

    if (W === 0 || xSorted.length === 0) return NaN;

    // Hitung cumulative frequency
    const cumulativeFreq = [];
    let cumFreq = 0;

    for (let i = 0; i < wSorted.length; i++) {
        cumFreq += wSorted[i];
        cumulativeFreq.push(cumFreq);
    }

    // Hitung np
    const np = (p / 100) * W;

    // Temukan j dan j+1 sesuai kriteria
    let j = 0;
    while (j < cumulativeFreq.length && cumulativeFreq[j] < np) {
        j++;
    }

    // Jika np tepat sama dengan cumulative frequency, atau j adalah 0
    if (j === 0 || cumulativeFreq[j] === np) {
        return xSorted[j];
    }

    // Implementasi metode perhitungan percentile yang berbeda
    switch (method.toUpperCase()) {
        case 'WAVERAGE': // Weighted Average
            const g = np - cumulativeFreq[j - 1];
            if (g === 0) {
                return xSorted[j];
            } else if (g > 0 && cumulativeFreq[j] === cumulativeFreq[j - 1]) {
                return xSorted[j];
            } else if (g > 0 && cumulativeFreq[j] > cumulativeFreq[j - 1]) {
                return xSorted[j - 1] + (g / (cumulativeFreq[j] - cumulativeFreq[j - 1])) * (xSorted[j] - xSorted[j - 1]);
            }
            break;

        case 'ROUND': // Closest Observation
            if (np < (cumulativeFreq[j-1] + cumulativeFreq[j]) / 2) {
                return xSorted[j - 1];
            } else if (np >= (cumulativeFreq[j-1] + cumulativeFreq[j]) / 2) {
                return xSorted[j];
            } else if (np === 0) {
                return xSorted[0];
            } else if (np === W) {
                return xSorted[xSorted.length - 1];
            }
            break;

        case 'EMPIRICAL': // Empirical Distribution Function
            if (np <= cumulativeFreq[0]) {
                return xSorted[0];
            } else {
                return xSorted[j];
            }

        case 'HAVERAGE': // Weighted Average (default)
            if (j === 0) {
                return xSorted[0];
            } else if (j < xSorted.length) {
                const g = np - cumulativeFreq[j - 1];
                if (g === 0) {
                    return xSorted[j - 1];
                } else if (g > 0 && cumulativeFreq[j] === cumulativeFreq[j - 1]) {
                    return xSorted[j - 1];
                } else if (g > 0 && cumulativeFreq[j] > cumulativeFreq[j - 1]) {
                    return xSorted[j - 1] + (g / (cumulativeFreq[j] - cumulativeFreq[j - 1])) * (xSorted[j] - xSorted[j - 1]);
                }
            } else {
                return xSorted[xSorted.length - 1];
            }
            break;

        case 'AEMPIRICAL': // Empirical Distribution Function with Averaging
            if (np === cumulativeFreq[j]) {
                let k = j;
                while (k < cumulativeFreq.length - 1 && cumulativeFreq[k] === cumulativeFreq[j]) {
                    k++;
                }
                const sum = xSorted.slice(j, k + 1).reduce((acc, val) => acc + val, 0);
                return sum / (k - j + 1);
            } else {
                return xSorted[j];
            }

        default:
            throw new Error(`Metode percentile tidak dikenali: ${method}`);
    }

    return NaN; // Fallback jika tidak ada kondisi yang terpenuhi
};

/**
 * Menghitung Tukey Hinges (kuartil Tukey)
 * @param {Array<number>} data - Array nilai numerik
 * @param {Array<number>} weights - Array bobot (opsional)
 * @return {Object} Objek berisi kuartil Tukey
 */
const calculateTukeyHinges = (data, weights = null) => {
    // Dapatkan percentile 25, 50, dan 75 dengan metode HAVERAGE
    const p25 = calculatePercentileExamine(data, weights, 25, 'HAVERAGE');
    const p50 = calculatePercentileExamine(data, weights, 50, 'HAVERAGE');
    const p75 = calculatePercentileExamine(data, weights, 75, 'HAVERAGE');

    // Hitung Tukey Hinges
    const useWeights = Array.isArray(weights) && weights.length === data.length;
    const n = data.filter((x, i) => {
        if (x === null || isNaN(x)) return false;
        const w = useWeights ? weights[i] : 1;
        return w > 0 && !isNaN(w);
    }).length;

    let h1, h2;

    if (n % 2 === 0) {
        const n1 = Math.floor((n / 2) + 1);
        h1 = (n1 >= 1) ? calculatePercentileExamine(data, weights, (100 * n1) / n, 'HAVERAGE') : NaN;
        h2 = (n1 >= 1) ? calculatePercentileExamine(data, weights, (100 * (n - n1 + 1)) / n, 'HAVERAGE') : NaN;
    } else {
        h1 = p25;
        h2 = p75;
    }

    return {
        lower: h1,
        median: p50,
        upper: h2
    };
};

/**
 * Menghitung confidence interval untuk mean
 * @param {Array<number>} data - Array nilai numerik
 * @param {Array<number>} weights - Array bobot (opsional)
 * @param {number} confidenceLevel - Tingkat kepercayaan (0-1, default 0.95)
 * @return {Object} Objek berisi batas bawah dan atas confidence interval
 */
const calculateConfidenceInterval = (data, weights = null, confidenceLevel = 0.95) => {
    const mean = calculateMean(data, weights);
    const stdError = calculateStandardError(data, weights);

    if (isNaN(mean) || isNaN(stdError)) {
        return {
            lower: NaN,
            upper: NaN
        };
    }

    // Dapatkan nilai t untuk tingkat kepercayaan
    // Catatan: Kita menggunakan pendekatan normal untuk sampel besar
    // Untuk sampel kecil, seharusnya menggunakan t-distribution, tapi ini cukup untuk aproksimasi
    let z = 1.96; // untuk 95% confidence level

    if (confidenceLevel !== 0.95) {
        // Aproksimasi nilai z untuk confidence level yang berbeda
        if (confidenceLevel === 0.90) z = 1.645;
        else if (confidenceLevel === 0.99) z = 2.576;
        else if (confidenceLevel === 0.999) z = 3.291;
        else z = 1.96; // default ke 95% jika tidak dikenal
    }

    return {
        lower: mean - z * stdError,
        upper: mean + z * stdError
    };
};

/**
 * Menghitung trimmed mean
 * @param {Array<number>} data - Array nilai numerik
 * @param {Array<number>} weights - Array bobot (opsional)
 * @param {number} percent - Persentase yang dipotong (0-50, default 5)
 * @return {number} Nilai trimmed mean
 */
const calculateTrimmedMean = (data, weights = null, percent = 5) => {
    if (percent < 0 || percent > 50) {
        throw new Error('Persentase trim harus antara 0 dan 50');
    }

    // Siapkan data terurut dan bobot
    const sortedData = [];
    const sortedWeights = [];

    const useWeights = Array.isArray(weights) && weights.length === data.length;

    // Kumpulkan data valid dan urutkan
    for (let i = 0; i < data.length; i++) {
        const x = data[i];

        // Skip nilai yang null atau NaN
        if (x === null || isNaN(x)) continue;

        const w = useWeights ? weights[i] : 1;

        // Skip jika bobot 0, negatif, atau NaN
        if (w <= 0 || isNaN(w)) continue;

        sortedData.push(x);
        sortedWeights.push(w);
    }

    // Urutkan data
    const indices = sortedData.map((_, i) => i);
    indices.sort((a, b) => sortedData[a] - sortedData[b]);

    const xSorted = indices.map(i => sortedData[i]);
    const wSorted = indices.map(i => sortedWeights[i]);

    // Hitung total bobot
    const W = wSorted.reduce((sum, w) => sum + w, 0);

    if (W === 0 || xSorted.length === 0) return NaN;

    // Hitung cumulative frequency
    const cumulativeFreq = [];
    let cumFreq = 0;

    for (let i = 0; i < wSorted.length; i++) {
        cumFreq += wSorted[i];
        cumulativeFreq.push(cumFreq);
    }

    // Cari batas bawah dan atas trim
    const lowerTrim = (percent / 100) * W;
    const upperTrim = W - lowerTrim;

    // Temukan indeks g dan h yang memenuhi kondisi
    let g = 0;
    while (g < cumulativeFreq.length && cumulativeFreq[g] <= lowerTrim) {
        g++;
    }

    let h = cumulativeFreq.length - 1;
    while (h >= 0 && cumulativeFreq[h] > upperTrim) {
        h--;
    }

    // Jika tidak ada data yang tersisa setelah trim
    if (g > h) return NaN;

    // Hitung trimmed mean
    let sum = 0;
    let trimmedWeight = 0;

    // Kasus khusus untuk g
    if (g > 0 && cumulativeFreq[g-1] < lowerTrim) {
        const partialWeight = wSorted[g] - (lowerTrim - cumulativeFreq[g-1]);
        sum += xSorted[g] * partialWeight;
        trimmedWeight += partialWeight;
    }

    // Data di tengah
    for (let i = g + 1; i < h; i++) {
        sum += xSorted[i] * wSorted[i];
        trimmedWeight += wSorted[i];
    }

    // Kasus khusus untuk h
    if (h < cumulativeFreq.length - 1 && cumulativeFreq[h] < upperTrim) {
        const partialWeight = upperTrim - cumulativeFreq[h];
        sum += xSorted[h+1] * partialWeight;
        trimmedWeight += partialWeight;
    }

    return trimmedWeight > 0 ? sum / trimmedWeight : NaN;
};

/**
 * Menghitung M-Estimator dengan berbagai fungsi (Huber, Hampel, Andrew, Tukey)
 * @param {Array<number>} data - Array nilai numerik
 * @param {Array<number>} weights - Array bobot (opsional)
 * @param {string} type - Tipe estimator ('HUBER', 'HAMPEL', 'ANDREW', 'TUKEY')
 * @param {Object} params - Parameter khusus untuk estimator
 * @return {number} Nilai M-Estimator
 */
const calculateMEstimator = (data, weights = null, type = 'HUBER', params = {}) => {
    const useWeights = Array.isArray(weights) && weights.length === data.length;

    // Filter data valid
    const validData = [];
    const validWeights = [];

    for (let i = 0; i < data.length; i++) {
        const x = data[i];

        // Skip nilai yang null atau NaN
        if (x === null || isNaN(x)) continue;

        const w = useWeights ? weights[i] : 1;

        // Skip jika bobot 0, negatif, atau NaN
        if (w <= 0 || isNaN(w)) continue;

        validData.push(x);
        validWeights.push(w);
    }

    if (validData.length === 0) return NaN;

    // Gunakan median sebagai estimasi awal
    let T = calculateMedian(validData, validWeights);

    // Hitung MAD (Median Absolute Deviation)
    const absDevs = validData.map(x => Math.abs(x - T));
    const MAD = calculateMedian(absDevs, validWeights);

    // Skala MAD untuk konsistensi dengan distribusi normal
    const s = MAD / 0.6745;

    if (s === 0) return T; // Semua nilai sama, return median

    // Fungsi psi untuk berbagai tipe estimator
    const psiFunction = (u, type, params) => {
        switch (type.toUpperCase()) {
            case 'HUBER':
                const k = params.k || 1.339;
                return Math.abs(u) <= k ? u : k * Math.sign(u);

            case 'HAMPEL':
                const a = params.a || 1.7;
                const b = params.b || 3.4;
                const c = params.c || 8.5;

                if (Math.abs(u) <= a) {
                    return u;
                } else if (Math.abs(u) <= b) {
                    return a * Math.sign(u);
                } else if (Math.abs(u) <= c) {
                    return a * Math.sign(u) * (c - Math.abs(u)) / (c - b);
                } else {
                    return 0;
                }

            case 'ANDREW':
                const cAndrew = params.c || 1.339 * Math.PI;
                return Math.abs(u) <= cAndrew ? Math.sin(u / cAndrew) * cAndrew : 0;

            case 'TUKEY':
                const cTukey = params.c || 4.685;
                return Math.abs(u) <= cTukey ? u * Math.pow(1 - Math.pow(u / cTukey, 2), 2) : 0;

            default:
                return u; // Fallback ke fungsi identitas
        }
    };

    // Weight function untuk M-Estimator
    const wFunction = (u, type, params) => {
        return psiFunction(u, type, params) / u;
    };

    // Iterasi untuk menghitung M-Estimator
    const maxIterations = 30;
    const epsilon = 1e-6;

    for (let iter = 0; iter < maxIterations; iter++) {
        // Hitung w-weights
        const wWeights = validData.map((x, i) => {
            const u = (x - T) / s;
            return validWeights[i] * (u !== 0 ? wFunction(u, type, params) : 1);
        });

        // Hitung T baru
        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < validData.length; i++) {
            numerator += validData[i] * wWeights[i];
            denominator += wWeights[i];
        }

        const newT = denominator > 0 ? numerator / denominator : T;

        // Periksa konvergensi
        if (Math.abs(newT - T) < epsilon * Math.max(1, Math.abs(T))) {
            T = newT;
            break;
        }

        T = newT;
    }

    return T;
};

/**
 * Menghitung Shapiro-Wilk test untuk normalitas
 * @param {Array<number>} data - Array nilai numerik
 * @param {Array<number>} weights - Array bobot (opsional)
 * @return {Object} Objek berisi statistik W dan signifikansi
 */
const calculateShapiroWilk = (data, weights = null) => {
    const useWeights = Array.isArray(weights) && weights.length === data.length;

    // Untuk Shapiro-Wilk, bobot harus integer, jadi kita bulatkan
    const roundedWeights = useWeights ? weights.map(w => Math.round(w)) : null;

    // Ekspansi data untuk bobot bulat
    const expandedData = [];

    if (useWeights) {
        for (let i = 0; i < data.length; i++) {
            const x = data[i];
            const w = roundedWeights[i];

            // Skip nilai yang null, NaN, atau dengan bobot <= 0
            if (x === null || isNaN(x) || w <= 0) continue;

            // Duplikasi data sesuai bobot
            for (let j = 0; j < w; j++) {
                expandedData.push(x);
            }
        }
    } else {
        // Tanpa bobot, gunakan data asli
        expandedData.push(...data.filter(x => x !== null && !isNaN(x)));
    }

    const n = expandedData.length;

    // Batasan ukuran sampel: 3 <= n <= 5000
    if (n < 3 || n > 5000) {
        return {
            W: NaN,
            significance: NaN
        };
    }

    // Urutkan data
    expandedData.sort((a, b) => a - b);

    // Hitung koefisien a
    const a = [];

    // Koefisien a dihitung berdasarkan tabel Shapiro-Wilk
    // Ini kompleks dan biasanya menggunakan tabel/algoritma tertentu
    // Ini implementasi yang disederhanakan
    for (let i = 0; i < Math.floor(n / 2); i++) {
        const m = i + 1;
        const j = n - m;

        // Aproksimasi koefisien a
        const mTilde = m - 0.5 * (n + 1);
        const standardNormalCDF = (x) => 0.5 * (1 + Math.erf(x / Math.sqrt(2)));
        const inverseCDF = Math.sqrt(2) * erfinv(2 * standardNormalCDF(mTilde / (n + 1)) - 1);

        a.push(inverseCDF);
    }

    // Normalisasi koefisien a
    const sumSquaredA = a.reduce((sum, val) => sum + val * val, 0);
    a.forEach((val, i) => a[i] = val / Math.sqrt(sumSquaredA));

    // Hitung W statistic
    let numerator = 0;
    for (let i = 0; i < Math.floor(n / 2); i++) {
        numerator += a[i] * (expandedData[n - i - 1] - expandedData[i]);
    }

    numerator = numerator * numerator;

    // Hitung varians sampel
    const mean = expandedData.reduce((sum, val) => sum + val, 0) / n;
    const denominator = expandedData.reduce((sum, val) => sum + (val - mean) * (val - mean), 0);

    const W = numerator / denominator;

    // Hitung signifikansi (p-value)
    // Ini kompleks dan biasanya menggunakan tabel/aproksimasi
    // Ini implementasi yang disederhanakan untuk aproksimasi p-value
    let significance;

    if (n <= 11) {
        // Tidak ada aproksimasi yang bagus untuk n kecil, gunakan tabel
        significance = NaN;
    } else {
        // Transformasi W untuk n > 11
        const y = Math.log(1 - W);
        let mu, sigma;

        if (n <= 50) {
            // Koefisien untuk 12 <= n <= 50
            const gamma = 0.459 * n - 2.273;
            mu = -0.0006714 * n * n + 0.025054 * n - 0.39978;
            sigma = Math.exp(0.003328 * n * n - 0.083751 * n - 0.36066);
        } else {
            // Koefisien untuk n > 50
            mu = Math.log(n) - 3.8;
            sigma = 0.6074 / Math.pow(n, 0.45);
        }

        // Transformasi ke distribusi normal
        const z = (y - mu) / sigma;

        // Hitung p-value dari z-score
        significance = 1 - 0.5 * (1 + Math.erf(z / Math.sqrt(2)));

        // Batasan nilai signifikansi
        if (significance < 0.01) significance = 0.01;
        if (significance > 0.99) significance = 0.99;
    }

    return {
        W,
        significance
    };
};

/**
 * Implementasi inverse error function (erfinv) untuk Shapiro-Wilk test
 * @param {number} x - Nilai input (-1 < x < 1)
 * @return {number} Nilai erfinv(x)
 */
const erfinv = (x) => {
    // Ini adalah aproksimasi untuk erfinv
    // Lihat: https://en.wikipedia.org/wiki/Error_function#Inverse_function

    if (x < -1 || x > 1) {
        return NaN;
    }

    const a = 0.147;
    const sign = x >= 0 ? 1 : -1;
    const absX = Math.abs(x);

    const term1 = Math.pow((2 / (Math.PI * a)) + (Math.log(1 - absX) / 2), 0.5);
    const term2 = Math.log(1 - absX) / a;

    return sign * Math.sqrt(term1 - term2);
};

/**
 * Menghitung Kolmogorov-Smirnov test dengan Lilliefors' significance
 * @param {Array<number>} data - Array nilai numerik
 * @param {Array<number>} weights - Array bobot (opsional)
 * @return {Object} Objek berisi statistik D dan signifikansi
 */
const calculateKolmogorovSmirnov = (data, weights = null) => {
    const useWeights = Array.isArray(weights) && weights.length === data.length;

    // Filter data valid
    const validData = [];
    const validWeights = [];

    for (let i = 0; i < data.length; i++) {
        const x = data[i];

        // Skip nilai yang null atau NaN
        if (x === null || isNaN(x)) continue;

        const w = useWeights ? weights[i] : 1;

        // Skip jika bobot 0, negatif, atau NaN
        if (w <= 0 || isNaN(w)) continue;

        validData.push(x);
        validWeights.push(w);
    }

    const n = validData.length;

    if (n === 0) {
        return {
            D: NaN,
            significance: NaN
        };
    }

    // Hitung mean dan std dev dari sampel
    const mean = calculateMean(validData, validWeights);
    const stdDev = calculateStandardDeviation(validData, validWeights);

    if (stdDev === 0) {
        return {
            D: NaN,
            significance: NaN
        };
    }

    // Urutkan data
    const indices = validData.map((_, i) => i);
    indices.sort((a, b) => validData[a] - validData[b]);

    const xSorted = indices.map(i => validData[i]);
    const wSorted = indices.map(i => validWeights[i]);

    // Hitung total bobot
    const W = wSorted.reduce((sum, w) => sum + w, 0);

    // Hitung cumulative frequency
    const cumulativeFreq = [];
    let cumFreq = 0;

    for (let i = 0; i < wSorted.length; i++) {
        cumFreq += wSorted[i];
        cumulativeFreq.push(cumFreq / W);
    }

    // Hitung cumulative normal distribution
    const standardNormalCDF = (x) => 0.5 * (1 + Math.erf(x / Math.sqrt(2)));
    const normalCDF = xSorted.map(x => standardNormalCDF((x - mean) / stdDev));

    // Hitung D statistik (jarak maksimum)
    let D = 0;

    for (let i = 0; i < n; i++) {
        // D+ = max(i/n - Φ(z_i))
        const dPlus = i > 0 ? cumulativeFreq[i-1] - normalCDF[i] : 0 - normalCDF[i];

        // D- = max(Φ(z_i) - (i-1)/n)
        const dMinus = normalCDF[i] - (i === 0 ? 0 : cumulativeFreq[i-1]);

        const maxD = Math.max(Math.abs(dPlus), Math.abs(dMinus));
        if (maxD > D) {
            D = maxD;
        }
    }

    // Hitung signifikansi (p-value) menggunakan aproksimasi Dallal-Wilkinson
    let significance;

    if (n > 100) {
        const a = -7.01256 * Math.pow(n, -0.4756);
        const b = 2.1054 + 0.0002785 * n;

        significance = Math.exp(a - b * D);

        if (significance > 0.1) significance = 0.1;
    } else if (n >= 5) {
        // Aproksimasi untuk n antara 5 dan 100
        const a = -0.37782822 - 1.67819837 * n + 0.50120883 * n * n - 0.00008417* n * n * n;
        const b = 0.4590401 + 0.7599556 * n - 0.091559 * n * n + 0.000041 * n * n * n;

        significance = Math.exp(a + b * D);

        if (significance > 0.2) {
            // Aproksimasi untuk 0.2 < p < 1.0
            significance = 0.2;
        }
    } else {
        // n terlalu kecil untuk aproksimasi yang baik
        significance = NaN;
    }

    return {
        D,
        significance
    };
};

/**
 * Menghitung Levene Test untuk homogenitas varians
 * @param {Array<Array<number>>} groups - Array grup data
 * @param {Array<Array<number>>} groupWeights - Array grup bobot (opsional)
 * @param {string} center - Metode untuk menghitung pusat ('MEAN', 'MEDIAN', 'TRIMMED')
 * @param {number} transform - Nilai transformasi (null untuk logaritma natural)
 * @return {Object} Objek berisi statistik W dan signifikansi
 */
const calculateLeveneTest = (groups, groupWeights = null, center = 'MEAN', transform = null) => {
    const k = groups.length; // Jumlah grup

    if (k < 2) {
        return {
            W: NaN,
            significance: NaN,
            robustSignificance: NaN
        };
    }

    const useWeights = Array.isArray(groupWeights) && groupWeights.length === k;

    // Transform data jika diperlukan
    const transformedGroups = groups.map((group, groupIndex) => {
        const weights = useWeights ? groupWeights[groupIndex] : null;

        return group.map((x, i) => {
            // Skip nilai yang null atau NaN
            if (x === null || isNaN(x)) return NaN;

            // Periksa bobot
            if (useWeights) {
                const w = weights[i];
                if (w <= 0 || isNaN(w)) return NaN;
            }

            // Transformasi nilai
            if (transform === null) {
                // Logaritma natural
                if (x <= 0) return NaN;
                return Math.log(x);
            } else if (transform === 0) {
                // Log transform
                if (x <= 0) return NaN;
                return Math.log(x);
            } else if (transform < 0 && Number.isInteger(transform) && x === 0) {
                // Negative integer transform with x = 0
                return NaN;
            } else if (transform < 0 && !Number.isInteger(transform) && x <= 0) {
                // Negative non-integer transform with x <= 0
                return NaN;
            } else if (transform > 0 && !Number.isInteger(transform) && x < 0) {
                // Positive non-integer transform with x < 0
                return NaN;
            } else {
                // Power transform
                return Math.pow(x, transform);
            }
        });
    });

    // Hitung pusat (center) untuk setiap grup
    const centers = transformedGroups.map((group, groupIndex) => {
        const weights = useWeights ? groupWeights[groupIndex] : null;

        switch (center.toUpperCase()) {
            case 'MEAN':
                return calculateMean(group, weights);

            case 'MEDIAN':
                return calculateMedian(group, weights);

            case 'TRIMMED':
                return calculateTrimmedMean(group, weights, 5); // 5% trimmed mean

            default:
                return calculateMean(group, weights);
        }
    });

    // Hitung z_ij = |x_ij - center_i|
    const zGroups = transformedGroups.map((group, groupIndex) => {
        const centerValue = centers[groupIndex];
        return group.map(x => isNaN(x) ? NaN : Math.abs(x - centerValue));
    });

    // Hitung statistik Levene
    let totalWeight = 0;
    const groupWeightSums = [];
    const groupZMeans = [];

    // Hitung bobot total dan mean z untuk setiap grup
    for (let i = 0; i < k; i++) {
        const group = zGroups[i];
        const weights = useWeights ? groupWeights[i] : null;

        let groupWeight = 0;
        let groupZSum = 0;
        let validCount = 0;

        for (let j = 0; j < group.length; j++) {
            const z = group[j];

            if (isNaN(z)) continue;

            const w = useWeights ? weights[j] : 1;

            groupWeight += w;
            groupZSum += z * w;
            validCount++;
        }

        groupWeightSums.push(groupWeight);
        totalWeight += groupWeight;

        // Mean z untuk grup ini
        groupZMeans.push(validCount > 0 ? groupZSum / groupWeight : NaN);
    }

    // Hitung grand mean z
    let grandZSum = 0;
    for (let i = 0; i < k; i++) {
        grandZSum += groupZMeans[i] * groupWeightSums[i];
    }

    const grandZMean = totalWeight > 0 ? grandZSum / totalWeight : NaN;

    // Hitung numerator dan denominator untuk W
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < k; i++) {
        // Numerator: between-group sum of squares
        numerator += groupWeightSums[i] * Math.pow(groupZMeans[i] - grandZMean, 2);

        // Denominator: within-group sum of squares
        const group = zGroups[i];
        const weights = useWeights ? groupWeights[i] : null;

        for (let j = 0; j < group.length; j++) {
            const z = group[j];

            if (isNaN(z)) continue;

            const w = useWeights ? weights[j] : 1;

            denominator += w * Math.pow(z - groupZMeans[i], 2);
        }
    }

    // Hitung degrees of freedom
    const dfBetween = k - 1;
    const dfWithin = totalWeight - k;

    // Menghitung v untuk robust significance
    let v = 0;
    for (let i = 0; i < k; i++) {
        const ni = groupWeightSums[i];
        const num = Math.pow(1 - ni / totalWeight, 2);
        const denom = ni - 1;
        v += num / denom;
    }
    v = dfWithin / v;

    // Hitung W statistik
    const W = dfWithin > 0 ? (numerator / dfBetween) / (denominator / dfWithin) : NaN;

    // Hitung signifikansi (p-value)
    const significance = W > 0 && dfBetween > 0 && dfWithin > 0 ?
        1 - jStat.fCDF(W, dfBetween, dfWithin) : NaN;

    // Hitung robust significance
    const robustSignificance = W > 0 && dfBetween > 0 && v > 0 ?
        1 - jStat.fCDF(W, dfBetween, v) : NaN;

    return {
        W,
        significance,
        robustSignificance,
        dfBetween,
        dfWithin,
        v
    };
};

/**
 * Simplified jStat F-distribution CDF implementation
 * This is just a simplified implementation for Levene's test
 */
const jStat = {
    // Beta regularized function
    ibeta: function(x, a, b) {
        // Simplified implementation for common use cases
        if (x === 0) return 0;
        if (x === 1) return 1;

        // For integer a and b values between 1-30, use beta function approximation
        if (Number.isInteger(a) && Number.isInteger(b) && a >= 1 && a <= 30 && b >= 1 && b <= 30) {
            // Approximate the incomplete beta function for common cases
            // This is greatly simplified for educational purposes
            const beta = Math.exp(this.gammaln(a + b) - this.gammaln(a) - this.gammaln(b));
            const bt = x ** a * (1 - x) ** b / beta;
            return 1 - bt * (a + b - 1) / (a * (1 - x));
        }

        // Fallback for other cases - crude approximation
        return x ** a * (1 - x) ** b;
    },

    // Simplified log-gamma function approximation
    gammaln: function(x) {
        // Lanczo's approximation for gamma function
        const p = [
            0.99999999999980993, 676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059, 12.507343278686905,
            -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
        ];

        let a = p[0];
        const g = 7;

        if (x < 0.5) {
            return Math.log(Math.PI / Math.sin(Math.PI * x)) - this.gammaln(1 - x);
        }

        x -= 1;

        for (let i = 1; i < p.length; i++) {
            a += p[i] / (x + i);
        }

        const t = x + g + 0.5;
        return Math.log(2 * Math.PI) / 2 + Math.log(a) + (x + 0.5) * Math.log(t) - t;
    },

    // F-distribution cumulative distribution function
    fCDF: function(x, df1, df2) {
        // F-distribution CDF using the relationship with the incomplete beta function
        const v1 = df1;
        const v2 = df2;

        if (x <= 0) return 0;

        // F-CDF is related to the beta CDF
        return this.ibeta((v1 * x) / (v1 * x + v2), v1 / 2, v2 / 2);
    }
};

/**
 * Menghitung boxplot statistic
 * @param {Array<number>} data - Array nilai numerik
 * @param {Array<number>} weights - Array bobot (opsional)
 * @return {Object} Objek berisi statistik boxplot
 */
const calculateBoxplot = (data, weights = null) => {
    // Dapatkan Tukey Hinges
    const hinges = calculateTukeyHinges(data, weights);

    // Hitung IQR
    const iqr = hinges.upper - hinges.lower;

    // Hitung batas untuk outlier dan extreme
    const step = 1.5 * iqr;

    const lowerOutlierBound = hinges.lower - step;
    const upperOutlierBound = hinges.upper + step;

    const lowerExtremeBound = hinges.lower - 2 * step;
    const upperExtremeBound = hinges.upper + 2 * step;

    // Temukan outliers dan extremes
    const outliers = [];
    const extremes = [];

    const useWeights = Array.isArray(weights) && weights.length === data.length;

    for (let i = 0; i < data.length; i++) {
        const x = data[i];

        // Skip nilai yang null atau NaN
        if (x === null || isNaN(x)) continue;

        const w = useWeights ? weights[i] : 1;

        // Skip jika bobot 0, negatif, atau NaN
        if (w <= 0 || isNaN(w)) continue;

        if (x < lowerExtremeBound || x > upperExtremeBound) {
            extremes.push({ value: x, weight: w });
        } else if (x < lowerOutlierBound || x > upperOutlierBound) {
            outliers.push({ value: x, weight: w });
        }
    }

    // Hitung whisker bounds (limited by actual data, not including outliers)
    const validData = data.filter((x, i) => {
        if (x === null || isNaN(x)) return false;
        const w = useWeights ? weights[i] : 1;
        return w > 0 && !isNaN(w);
    }).sort((a, b) => a - b);

    // Find whisker ends (largest/smallest values within fence)
    let lowerWhisker = validData[0];
    let upperWhisker = validData[validData.length - 1];

    for (const value of validData) {
        if (value >= lowerOutlierBound) {
            lowerWhisker = value;
            break;
        }
    }

    for (let i = validData.length - 1; i >= 0; i--) {
        if (validData[i] <= upperOutlierBound) {
            upperWhisker = validData[i];
            break;
        }
    }

    return {
        hinges,
        iqr,
        lowerWhisker,
        upperWhisker,
        outliers,
        extremes
    };
};

/**
 * Menghitung statistic deskriptif menggunakan metode EXAMINE
 * @param {Array<number>} data - Array nilai numerik
 * @param {Array<number>} weights - Array bobot (opsional)
 * @param {number} confidenceLevel - Tingkat kepercayaan (0-1, default 0.95)
 * @param {string} percentileMethod - Metode perhitungan percentile ('HAVERAGE', 'WAVERAGE', 'ROUND', 'EMPIRICAL', 'AEMPIRICAL')
 * @param {Array<number>} percentiles - Array percentile yang ingin dihitung (opsional)
 * @return {Object} Objek berisi semua statistik deskriptif
 */
const calculateExamine = (data, weights = null, confidenceLevel = 0.95, percentileMethod = 'HAVERAGE', percentiles = [5, 10, 25, 50, 75, 90, 95]) => {
    // Basic statistics
    const mean = calculateMean(data, weights);
    const variance = calculateVariance(data, weights);
    const stdDev = calculateStandardDeviation(data, weights);
    const stdError = calculateStandardError(data, weights);

    // Confidence interval
    const confidenceInterval = calculateConfidenceInterval(data, weights, confidenceLevel);

    // Percentiles
    const percentileResults = percentiles.map(p => ({
        percentile: p,
        value: calculatePercentileExamine(data, weights, p, percentileMethod)
    }));

    // Tukey Hinges
    const tukeyHinges = calculateTukeyHinges(data, weights);

    // Skewness and Kurtosis
    const skewnessObj = calculateSkewness(data, weights);
    const kurtosisObj = calculateKurtosis(data, weights);

    // 5% Trimmed Mean
    const trimmedMean = calculateTrimmedMean(data, weights, 5);

    // M-Estimators
    const huber = calculateMEstimator(data, weights, 'HUBER');
    const hampel = calculateMEstimator(data, weights, 'HAMPEL');
    const andrew = calculateMEstimator(data, weights, 'ANDREW');
    const tukey = calculateMEstimator(data, weights, 'TUKEY');

    // Normality tests
    const shapiroWilk = calculateShapiroWilk(data, weights);
    const ksLilliefors = calculateKolmogorovSmirnov(data, weights);

    // Boxplot
    const boxplot = calculateBoxplot(data, weights);

    // Get min, max, and range
    let min = Infinity;
    let max = -Infinity;

    const useWeights = Array.isArray(weights) && weights.length === data.length;

    for (let i = 0; i < data.length; i++) {
        const x = data[i];

        // Skip nilai yang null atau NaN
        if (x === null || isNaN(x)) continue;

        const w = useWeights ? weights[i] : 1;

        // Skip jika bobot 0, negatif, atau NaN
        if (w <= 0 || isNaN(w)) continue;

        if (x < min) min = x;
        if (x > max) max = x;
    }

    const range = max - min;

    // Count valid values
    const validCount = data.filter((x, i) => {
        if (x === null || isNaN(x)) return false;
        const w = useWeights ? weights[i] : 1;
        return w > 0 && !isNaN(w);
    }).length;

    return {
        n: validCount,
        mean,
        variance,
        stdDev,
        stdError,
        min,
        max,
        range,
        confidenceInterval,
        percentiles: percentileResults,
        median: percentileResults.find(p => p.percentile === 50)?.value || NaN,
        tukeyHinges,
        interquartileRange: tukeyHinges.upper - tukeyHinges.lower,
        skewness: skewnessObj.skewness,
        skewnessStdError: skewnessObj.standardError,
        kurtosis: kurtosisObj.kurtosis,
        kurtosisStdError: kurtosisObj.standardError,
        trimmedMean,
        mEstimators: {
            huber,
            hampel,
            andrew,
            tukey
        },
        normalityTests: {
            shapiroWilk,
            ksLilliefors
        },
        boxplot
    };
};

// Export semua fungsi
export {
    calculatePercentileExamine,
    calculateTukeyHinges,
    calculateConfidenceInterval,
    calculateTrimmedMean,
    calculateMEstimator,
    calculateShapiroWilk,
    calculateKolmogorovSmirnov,
    calculateLeveneTest,
    calculateBoxplot,
    calculateExamine
};