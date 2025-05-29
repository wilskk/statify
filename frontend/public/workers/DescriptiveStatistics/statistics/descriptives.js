/**
 * descriptives.js
 * Kumpulan fungsi untuk menghitung statistik deskriptif berdasarkan algoritma SPSS
 */

/**
 * Menghitung momen-momen statistik menggunakan algoritma provisional means
 * @param {Array<number>} data - Array nilai numerik
 * @param {Array<number>} weights - Array bobot (opsional)
 * @return {Object} Objek berisi momen-momen statistik
 */
const calculateMoments = (data, weights = null) => {
    const n = data.length;
    let sum = 0;
    let sumOfWeights = 0;
    let mean = 0;
    let m2 = 0;
    let m3 = 0;
    let m4 = 0;

    const useWeights = Array.isArray(weights) && weights.length === n;

    for (let i = 0; i < n; i++) {
        const x = data[i];

        // Skip nilai yang hilang
        if (x === null || isNaN(x)) continue;

        const w = useWeights ? weights[i] : 1;

        // Skip jika bobot 0, negatif, atau NaN
        if (w <= 0 || isNaN(w)) continue;

        sumOfWeights += w;

        // Delta adalah selisih antara nilai saat ini dan means sementara
        const delta = x - mean;
        const deltaN = delta * w / sumOfWeights;

        // Update mean
        mean += deltaN;

        // Update moments
        const deltaN2 = deltaN * deltaN;
        const term1 = delta * deltaN * (sumOfWeights - w);

        // Update m4, m3, m2
        m4 += term1 * deltaN2 * (sumOfWeights * sumOfWeights - 3 * sumOfWeights * w + 3 * w * w) / (sumOfWeights * sumOfWeights * sumOfWeights) +
            6 * deltaN2 * m2 / (sumOfWeights * sumOfWeights) -
            4 * deltaN * m3 / (sumOfWeights * sumOfWeights);

        m3 += term1 * deltaN * (sumOfWeights - 2 * w) / (sumOfWeights * sumOfWeights) -
            3 * deltaN * m2 / sumOfWeights;

        m2 += term1;

        sum += x * w;
    }

    return {
        n: sumOfWeights,
        sum,
        mean,
        m2,
        m3,
        m4
    };
};

/**
 * Menghitung nilai rata-rata (mean)
 * @param {Array<number>} data - Array nilai numerik
 * @param {Array<number>} weights - Array bobot (opsional)
 * @return {number} Nilai rata-rata
 */
const calculateMean = (data, weights = null) => {
    const moments = calculateMoments(data, weights);
    return moments.mean;
};

/**
 * Menghitung varians
 * @param {Array<number>} data - Array nilai numerik
 * @param {Array<number>} weights - Array bobot (opsional)
 * @return {number} Nilai varians
 */
const calculateVariance = (data, weights = null) => {
    const moments = calculateMoments(data, weights);

    if (moments.n <= 1) return NaN;

    return moments.m2 / (moments.n - 1);
};

/**
 * Menghitung standar deviasi
 * @param {Array<number>} data - Array nilai numerik
 * @param {Array<number>} weights - Array bobot (opsional)
 * @return {number} Nilai standar deviasi
 */
const calculateStandardDeviation = (data, weights = null) => {
    const variance = calculateVariance(data, weights);
    return isNaN(variance) ? NaN : Math.sqrt(variance);
};

/**
 * Menghitung standard error of mean
 * @param {Array<number>} data - Array nilai numerik
 * @param {Array<number>} weights - Array bobot (opsional)
 * @return {number} Nilai standard error
 */
const calculateStandardError = (data, weights = null) => {
    const stdDev = calculateStandardDeviation(data, weights);
    const moments = calculateMoments(data, weights);

    if (isNaN(stdDev) || moments.n <= 0) return NaN;

    return stdDev / Math.sqrt(moments.n);
};

/**
 * Menghitung skewness dan standard error of skewness
 * @param {Array<number>} data - Array nilai numerik
 * @param {Array<number>} weights - Array bobot (opsional)
 * @return {Object} Objek berisi skewness dan standard error
 */
const calculateSkewness = (data, weights = null) => {
    const moments = calculateMoments(data, weights);

    if (moments.n <= 2 || moments.m2 === 0) {
        return {
            skewness: NaN,
            standardError: NaN
        };
    }

    const skewness = moments.n * Math.sqrt(moments.n - 1) * moments.m3 / (Math.pow(moments.m2, 1.5) * (moments.n - 2));
    const standardError = Math.sqrt((6 * moments.n * (moments.n - 1)) / ((moments.n - 2) * (moments.n + 1) * (moments.n + 3)));

    return {
        skewness,
        standardError
    };
};

/**
 * Menghitung kurtosis dan standard error of kurtosis
 * @param {Array<number>} data - Array nilai numerik
 * @param {Array<number>} weights - Array bobot (opsional)
 * @return {Object} Objek berisi kurtosis dan standard error
 */
const calculateKurtosis = (data, weights = null) => {
    const moments = calculateMoments(data, weights);

    if (moments.n <= 3 || moments.m2 === 0) {
        return {
            kurtosis: NaN,
            standardError: NaN
        };
    }

    const n = moments.n;
    const numerator = n * (n + 1) * (n - 1) * moments.m4;
    const denominator = (n - 2) * (n - 3) * Math.pow(moments.m2, 2);

    const kurtosis = numerator / denominator - 3 * Math.pow(n - 1, 2) / ((n - 2) * (n - 3));
    const standardError = Math.sqrt((24 * n * (n - 1) * (n - 1)) / ((n - 3) * (n - 2) * (n + 3) * (n + 5)));

    return {
        kurtosis,
        standardError
    };
};

/**
 * Menghitung z-scores
 * @param {Array<number>} data - Array nilai numerik
 * @param {number} mean - Nilai rata-rata (opsional)
 * @param {number} stdDev - Nilai standar deviasi (opsional)
 * @return {Array<number>} Array z-scores
 */
const calculateZScores = (data, mean = null, stdDev = null) => {
    if (mean === null) {
        mean = calculateMean(data);
    }

    if (stdDev === null) {
        stdDev = calculateStandardDeviation(data);
    }

    if (isNaN(mean) || isNaN(stdDev) || stdDev === 0) {
        return data.map(() => NaN);
    }

    return data.map(x => {
        if (x === null || isNaN(x)) return NaN;
        return (x - mean) / stdDev;
    });
};

/**
 * Menghitung semua statistik deskriptif untuk data
 * @param {Array<number>} data - Array nilai numerik
 * @param {Array<number>} weights - Array bobot (opsional)
 * @return {Object} Objek berisi semua statistik deskriptif
 */
const calculateDescriptives = (data, weights = null) => {
    const moments = calculateMoments(data, weights);
    const n = moments.n;
    const mean = moments.mean;

    // Hitung variance
    const variance = n > 1 ? moments.m2 / (n - 1) : NaN;

    // Hitung standard deviation
    const stdDev = isNaN(variance) ? NaN : Math.sqrt(variance);

    // Hitung standard error
    const stdError = n > 0 ? stdDev / Math.sqrt(n) : NaN;

    // Cari nilai minimum dan maksimum
    let min = Infinity;
    let max = -Infinity;
    const useWeights = Array.isArray(weights) && weights.length === data.length;

    for (let i = 0; i < data.length; i++) {
        const x = data[i];

        // Skip nilai yang hilang
        if (x === null || isNaN(x)) continue;

        const w = useWeights ? weights[i] : 1;

        // Skip jika bobot 0, negatif, atau NaN
        if (w <= 0 || isNaN(w)) continue;

        if (x < min) min = x;
        if (x > max) max = x;
    }

    // Jika tidak ada data valid
    if (min === Infinity || max === -Infinity) {
        min = NaN;
        max = NaN;
    }

    // Hitung skewness
    let skewness = NaN;
    let skewnessStdError = NaN;

    if (n > 2 && stdDev > 0) {
        skewness = n * Math.sqrt(n - 1) * moments.m3 / (Math.pow(moments.m2, 1.5) * (n - 2));
        skewnessStdError = Math.sqrt((6 * n * (n - 1)) / ((n - 2) * (n + 1) * (n + 3)));
    }

    // Hitung kurtosis
    let kurtosis = NaN;
    let kurtosisStdError = NaN;

    if (n > 3 && stdDev > 0) {
        const numerator = n * (n + 1) * (n - 1) * moments.m4;
        const denominator = (n - 2) * (n - 3) * Math.pow(moments.m2, 2);

        kurtosis = numerator / denominator - 3 * Math.pow(n - 1, 2) / ((n - 2) * (n - 3));
        kurtosisStdError = Math.sqrt((24 * n * (n - 1) * (n - 1)) / ((n - 3) * (n - 2) * (n + 3) * (n + 5)));
    }

    return {
        n,
        sum: moments.sum,
        mean,
        variance,
        stdDev,
        stdError,
        min,
        max,
        skewness,
        skewnessStdError,
        kurtosis,
        kurtosisStdError,
        zScores: calculateZScores(data, mean, stdDev)
    };
};

// Export semua fungsi
export {
    calculateDescriptives,
    calculateMoments,
    calculateMean,
    calculateVariance,
    calculateStandardDeviation,
    calculateStandardError,
    calculateSkewness,
    calculateKurtosis,
    calculateZScores
};