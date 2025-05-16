/**
 * frequencies.js
 * Implementasi algoritma FREQUENCIES untuk analisis statistik
 * Mengimpor fungsi-fungsi dari descriptives.js untuk perhitungan statistik dasar
 */

import {
    calculateMean,
    calculateVariance,
    calculateStandardDeviation,
    calculateStandardError,
    calculateSkewness,
    calculateKurtosis
} from './descriptives';

/**
 * Menyortir data dan menghitung frekuensi setiap nilai unik
 * @param {Array<number>} data - Array nilai numerik
 * @param {Array<number>} weights - Array bobot (opsional)
 * @param {Set<number>} missingValues - Set nilai yang dianggap missing (opsional)
 * @return {Object} Objek berisi nilai unik dan frekuensinya
 */
const calculateFrequencies = (data, weights = null, missingValues = new Set()) => {
    // Batasan: Jika ada observasi dengan nilai absolut > 10^13, tidak ada perhitungan
    const MAX_VALUE = 1e13;
    if (data.some(x => x !== null && !isNaN(x) && Math.abs(x) > MAX_VALUE)) {
        throw new Error('Data mengandung nilai dengan absolut lebih besar dari 10^13');
    }

    const useWeights = Array.isArray(weights) && weights.length === data.length;
    const valueMap = new Map(); // Map untuk menyimpan nilai unik dan frekuensinya
    let totalWeight = 0; // Total bobot semua kasus
    let validWeight = 0; // Total bobot kasus valid (non-missing)

    // Hitung frekuensi setiap nilai
    for (let i = 0; i < data.length; i++) {
        const x = data[i];

        // Skip nilai NaN
        if (x === null || isNaN(x)) continue;

        const w = useWeights ? weights[i] : 1;

        // Skip jika bobot 0, negatif, atau NaN
        if (w <= 0 || isNaN(w)) continue;

        totalWeight += w;

        // Cek apakah nilai dianggap missing
        const isMissing = missingValues.has(x);
        if (!isMissing) {
            validWeight += w;
        }

        // Tambahkan ke map
        if (valueMap.has(x)) {
            const entry = valueMap.get(x);
            entry.frequency += w;
            entry.count += 1;
        } else {
            valueMap.set(x, {
                value: x,
                frequency: w,
                count: 1,
                isMissing
            });
        }
    }

    // Konversi map ke array dan urutkan
    const frequencyArray = Array.from(valueMap.values()).sort((a, b) => a.value - b.value);

    return {
        frequencies: frequencyArray,
        totalWeight,
        validWeight
    };
};

/**
 * Menghitung statistik frekuensi: persentase, persentase adjusted, kumulatif
 * @param {Object} freqData - Hasil dari calculateFrequencies
 * @return {Array<Object>} Array berisi statistik frekuensi untuk setiap nilai unik
 */
const calculateFrequencyStatistics = (freqData) => {
    const { frequencies, totalWeight, validWeight } = freqData;

    let cumulativeFreq = 0;
    let cumulativePercent = 0;

    // Hitung statistik untuk setiap nilai
    return frequencies.map(entry => {
        const { value, frequency, isMissing } = entry;

        // Hitung persentase
        const percent = (frequency / totalWeight) * 100;

        // Hitung adjusted persentase (hanya untuk nilai non-missing)
        const adjustedPercent = isMissing ? null : (frequency / validWeight) * 100;

        // Hitung kumulatif (hanya untuk nilai non-missing)
        if (!isMissing) {
            cumulativeFreq += frequency;
            cumulativePercent = (cumulativeFreq / validWeight) * 100;
        }

        return {
            value,
            frequency,
            percent,
            adjustedPercent,
            cumulativeFreq: isMissing ? null : cumulativeFreq,
            cumulativePercent: isMissing ? null : cumulativePercent,
            isMissing
        };
    });
};

/**
 * Menghitung mode dari data
 * @param {Array<Object>} freqStats - Hasil dari calculateFrequencyStatistics
 * @return {number} Nilai mode
 */
const calculateMode = (freqStats) => {
    // Filter nilai non-missing
    const nonMissingStats = freqStats.filter(stat => !stat.isMissing);

    if (nonMissingStats.length === 0) return NaN;

    // Cari frekuensi tertinggi
    let maxFreq = -Infinity;
    let modeValue = NaN;

    for (const stat of nonMissingStats) {
        if (stat.frequency > maxFreq) {
            maxFreq = stat.frequency;
            modeValue = stat.value;
        } else if (stat.frequency === maxFreq && stat.value < modeValue) {
            // Jika frekuensi sama, pilih nilai terkecil
            modeValue = stat.value;
        }
    }

    return modeValue;
};

/**
 * Menghitung percentile dari data
 * @param {Array<Object>} freqStats - Hasil dari calculateFrequencyStatistics
 * @param {number} p - Percentile yang ingin dihitung (0-100)
 * @return {number} Nilai percentile
 */
const calculatePercentile = (freqStats, p) => {
    if (p < 0 || p > 100) {
        throw new Error('Percentile harus antara 0 dan 100');
    }

    // Filter nilai non-missing dan urutkan berdasarkan nilai
    const nonMissingStats = freqStats
        .filter(stat => !stat.isMissing)
        .sort((a, b) => a.value - b.value);

    if (nonMissingStats.length === 0) return NaN;

    // Dapatkan total weight
    const validWeight = nonMissingStats[nonMissingStats.length - 1].cumulativeFreq;

    // Hitung target position
    const tp = (p / 100) * validWeight;

    // Cari interval pertama yang mengandung lebih dari tp kasus
    let i = 0;
    while (i < nonMissingStats.length && nonMissingStats[i].cumulativeFreq <= tp) {
        i++;
    }

    if (i === 0) {
        // Jika percentile lebih kecil dari nilai pertama
        return nonMissingStats[0].value;
    } else if (i === nonMissingStats.length) {
        // Jika percentile lebih besar dari nilai terakhir
        return nonMissingStats[nonMissingStats.length - 1].value;
    } else {
        // Hitung interpolasi linear
        const x1 = nonMissingStats[i - 1].value;
        const x2 = nonMissingStats[i].value;

        const c1 = nonMissingStats[i - 1].cumulativeFreq;
        const c2 = nonMissingStats[i].cumulativeFreq;

        // Jika p = 50, ini adalah median
        if (tp === c1) {
            return x1;
        } else if (tp === c2) {
            return x2;
        } else {
            // Interpolasi linear
            return x1 + ((tp - c1) / (c2 - c1)) * (x2 - x1);
        }
    }
};

/**
 * Menghitung semua statistik frequencies untuk data
 * @param {Array<number>} data - Array nilai numerik
 * @param {Array<number>} weights - Array bobot (opsional)
 * @param {Array<number>} missingValues - Array nilai yang dianggap missing (opsional)
 * @param {Array<number>} percentiles - Array percentile yang ingin dihitung (opsional)
 * @return {Object} Objek berisi semua statistik frequencies
 */
const calculateFrequenciesStats = (data, weights = null, missingValues = [], percentiles = [25, 50, 75]) => {
    // Konversi missingValues ke Set untuk pencarian lebih cepat
    const missingSet = new Set(missingValues);

    // Hitung frekuensi dasar
    const freqData = calculateFrequencies(data, weights, missingSet);

    // Hitung statistik frekuensi
    const freqStats = calculateFrequencyStatistics(freqData);

    // Filter nilai non-missing
    const nonMissingStats = freqStats.filter(stat => !stat.isMissing);

    // Jika tidak ada data valid
    if (nonMissingStats.length === 0) {
        return {
            frequencies: freqStats,
            n: freqData.totalWeight,
            nValid: freqData.validWeight,
            min: NaN,
            max: NaN,
            range: NaN,
            mode: NaN,
            percentiles: percentiles.map(p => ({ percentile: p, value: NaN })),
            mean: NaN,
            variance: NaN,
            stdDev: NaN,
            stdError: NaN,
            skewness: NaN,
            kurtosis: NaN
        };
    }

    // Ekstrak nilai dan bobot dari data valid
    const validValues = [];
    const validWeights = [];

    for (let i = 0; i < data.length; i++) {
        const x = data[i];

        // Skip nilai yang null, NaN, atau missing
        if (x === null || isNaN(x) || missingSet.has(x)) continue;

        const w = Array.isArray(weights) ? weights[i] : 1;

        // Skip jika bobot 0, negatif, atau NaN
        if (w <= 0 || isNaN(w)) continue;

        validValues.push(x);
        validWeights.push(w);
    }

    // Hitung statistik dasar
    const min = nonMissingStats[0].value;
    const max = nonMissingStats[nonMissingStats.length - 1].value;
    const range = max - min;
    const mode = calculateMode(freqStats);

    // Hitung percentiles
    const percentileResults = percentiles.map(p => ({
        percentile: p,
        value: calculatePercentile(freqStats, p)
    }));

    // Hitung statistik deskriptif menggunakan fungsi dari descriptives.js
    const mean = calculateMean(validValues, validWeights);
    const variance = calculateVariance(validValues, validWeights);
    const stdDev = calculateStandardDeviation(validValues, validWeights);
    const stdError = calculateStandardError(validValues, validWeights);

    // Hitung skewness jika W >= 3 dan Variance > 0
    let skewness = NaN;
    if (freqData.validWeight >= 3 && variance > 0) {
        const skewnessObj = calculateSkewness(validValues, validWeights);
        skewness = skewnessObj.skewness;
    }

    // Hitung kurtosis jika W >= 4 dan Variance > 0
    let kurtosis = NaN;
    if (freqData.validWeight >= 4 && variance > 0) {
        const kurtosisObj = calculateKurtosis(validValues, validWeights);
        kurtosis = kurtosisObj.kurtosis;
    }

    return {
        frequencies: freqStats,
        n: freqData.totalWeight,
        nValid: freqData.validWeight,
        min,
        max,
        range,
        mode,
        percentiles: percentileResults,
        mean,
        variance,
        stdDev,
        stdError,
        skewness,
        kurtosis
    };
};

/**
 * Menghitung median dari data (shortcut untuk percentile 50)
 * @param {Array<number>} data - Array nilai numerik
 * @param {Array<number>} weights - Array bobot (opsional)
 * @param {Array<number>} missingValues - Array nilai yang dianggap missing (opsional)
 * @return {number} Nilai median
 */
const calculateMedian = (data, weights = null, missingValues = []) => {
    const freqData = calculateFrequencies(data, weights, new Set(missingValues));
    const freqStats = calculateFrequencyStatistics(freqData);
    return calculatePercentile(freqStats, 50);
};

// Export semua fungsi
export {
    calculateFrequencies,
    calculateFrequencyStatistics,
    calculateMode,
    calculatePercentile,
    calculateFrequenciesStats,
    calculateMedian
};