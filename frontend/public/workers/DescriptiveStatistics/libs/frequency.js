/**
 * @file /libs/frequency.js
 * @class FrequencyCalculator
 * @description
 * Melakukan perhitungan statistik frekuensi dan persentil.
 * Kelas ini menangani data tunggal, data berbobot, dan dapat menghitung
 * persentil menggunakan lima metode berbeda (sesuai standar SPSS).
 * Menggunakan DescriptiveCalculator untuk beberapa statistik dasar (Komposisi).
 */
/* global importScripts, isNumeric, DescriptiveCalculator */
importScripts('/workers/DescriptiveStatistics/libs/utils.js');
// Helper to round numbers based on variable.decimals
function roundToDecimals(number, decimals) {
    if (typeof number !== 'number' || isNaN(number) || !isFinite(number)) return number;
    return parseFloat(number.toFixed(decimals));
}

class FrequencyCalculator {
    /**
     * @param {object} payload - Payload dari manager.
     * @param {object} payload.variable - Objek definisi variabel.
     * @param {Array<any>} payload.data - Array data untuk variabel ini.
     * @param {Array<number>|null} payload.weights - Array bobot yang sesuai dengan data.
     * @param {object} payload.options - Opsi untuk analisis.
     */
    constructor({ variable, data, weights = null, options = {} }) {
        this.variable = variable;
        this.data = data;
        this.weights = weights;
        this.options = options || {};

        this.descCalc = new DescriptiveCalculator({ variable, data, weights, options });
        
        // Memoization cache
        /** @private */
        this.memo = {};
    }

    /**
     * Mengembalikan data yang telah diurutkan, dikelompokkan, dan diagregasi.
     * Ini adalah langkah inti untuk sebagian besar perhitungan frekuensi dan persentil.
     * Hasilnya di-cache untuk efisiensi.
     * @returns {{y: number[], c: number[], cc: number[], W: number}|null}
     * - `y`: Nilai unik yang diurutkan.
     * - `c`: Bobot kumulatif untuk setiap nilai unik.
     * - `cc`: Bobot kumulatif (cumulative sum of c).
     * - `W`: Total bobot (atau jumlah kasus jika tidak ada bobot).
     */
    getSortedData() {
        if (this.memo.sortedData) return this.memo.sortedData;

        const weightedValues = new Map();
        let totalWeight = 0;

        for (let i = 0; i < this.data.length; i++) {
            const value = this.data[i];
            const weight = this.weights ? (this.weights[i] ?? 1) : 1;

            if (!isNumeric(value) || typeof weight !== 'number' || weight <= 0) continue;
            
            const numValue = parseFloat(value);
            weightedValues.set(numValue, (weightedValues.get(numValue) || 0) + weight);
            totalWeight += weight;
        }

        if (weightedValues.size === 0) {
            this.memo.sortedData = null;
            return null;
        }

        const sortedUniqueValues = Array.from(weightedValues.keys()).sort((a, b) => a - b);
        const y = sortedUniqueValues;
        const c = y.map(val => weightedValues.get(val));
        const cc = c.reduce((acc, val) => {
            acc.push((acc.length > 0 ? acc[acc.length - 1] : 0) + val);
            return acc;
        }, []);

        this.memo.sortedData = { y, c, cc, W: totalWeight };
        return this.memo.sortedData;
    }

    /**
     * Menghitung modus (nilai yang paling sering muncul).
     * Jika ada beberapa modus, semua akan dikembalikan dalam array.
     * @returns {number[]|null} Array nilai modus, atau null jika tidak ada data valid.
     */
    getMode() {
        if (this.memo.mode) return this.memo.mode;
        
        const sortedData = this.getSortedData();
        if (!sortedData) {
            this.memo.mode = null;
            return null;
        }
        
        const { y, c } = sortedData;
        const maxFreq = Math.max(...c);
        const modes = y.filter((_, index) => c[index] === maxFreq);

        this.memo.mode = modes;
        return this.memo.mode;
    }

    /**
     * Menghitung persentil ke-p menggunakan salah satu dari lima metode.
     * @param {number} p - Persentil yang diinginkan (0-100).
     * @param {'waverage'|'haverage'|'aempirical'|'empirical'|'round'} method - Metode perhitungan.
     * @returns {number|null} Nilai persentil.
     */
    getPercentile(p, method) {
        const sortedData = this.getSortedData();
        if (!sortedData) return null;

        const { y, c, cc, W } = sortedData;
        const n = W; // Gunakan total bobot sebagai n

        switch (method.toLowerCase()) {
            case 'waverage': { // Weighted Average (SPSS Definition 1)
                if (W === 0) return null;

                // SPSS Definition 1 (Weighted Average) - Formula from EXAMINE Algorithms
                // tc₁ = W * p / 100
                const tc1 = W * p / 100;
                
                // Handle edge cases first
                if (tc1 <= 0) return y[0];
                if (tc1 >= W) return y[y.length - 1];
                
                // Find k₁ where cc[k₁-1] ≤ tc₁ < cc[k₁]
                let k1 = -1;
                for (let i = 0; i < cc.length; i++) {
                    if (cc[i] >= tc1) {
                        k1 = i;
                        break;
                    }
                }
                
                if (k1 === -1) return y[y.length - 1];
                
                // Get values and cumulative frequencies
                const cc_k1_minus_1 = k1 > 0 ? cc[k1 - 1] : 0;
                const c_k1_plus_1 = c[k1]; // Weight of observation at position k1
                const y_k1 = k1 > 0 ? y[k1 - 1] : y[0]; // Value at position k1-1
                const y_k1_plus_1 = y[k1]; // Value at position k1
                
                // Calculate g₁* = tc₁ - cc[k₁-1]
                const g1_star = tc1 - cc_k1_minus_1;
                
                // Calculate g₁ = g₁* / c[k₁]
                const g1 = c_k1_plus_1 > 0 ? g1_star / c_k1_plus_1 : 0;
                
                // Apply SPSS EXAMINE conditional formula
                // The key insight: g1* represents how far into the current weight group we are
                if (g1_star >= c_k1_plus_1) {
                    // We've gone past the current observation, use next value
                    return y_k1_plus_1;
                } else if (c_k1_plus_1 >= 1) {
                    // Integer weights: use g1_star directly for interpolation
                    return (1 - g1_star) * y_k1 + g1_star * y_k1_plus_1;
                } else {
                    // Fractional weights: use normalized g1 for interpolation
                    return (1 - g1) * y_k1 + g1_star * y_k1_plus_1;
                }
            }
            case 'haverage': { // Tukey's Hinges (SPSS Definition 3 - Simplified Implementation)
                if (W === 0) return null;
                
                // Simplified Tukey's Hinges: use (W+1) formula which is more commonly used
                // This is actually closer to the classical definition and more compatible
                const rank = (p / 100) * (W + 1);
                const k = Math.floor(rank);
                const g = rank - k;
                
                // Handle edge cases
                if (k < 1) return y[0];
                if (k >= y.length) return y[y.length - 1];
                
                // For exact ranks, return the value directly
                if (g === 0) {
                    return y[k - 1]; // k is 1-based, array is 0-based
                }
                
                // Linear interpolation between adjacent values
                const y_k = y[k - 1];     // Value at position k (1-based)
                const y_k_plus_1 = y[k]; // Value at position k+1 (1-based)
                
                return (1 - g) * y_k + g * y_k_plus_1;
            }
            case 'aempirical': { // Empirical with Averaging (SPSS Definition 4)
                if (W === 0) return null;
                const rank = (p / 100) * W;
                const k = Math.floor(rank);
                const g = rank - k;
                
                if (g === 0) {
                     if (k < 1 || k > y.length) return null;
                     const y_k = y[k - 1];
                     const y_k_plus_1 = (k < y.length) ? y[k] : y_k;
                     return (y_k + y_k_plus_1) / 2;
                } else {
                     if (k + 1 > y.length) return y[y.length - 1];
                     return y[k];
                }
            }
             case 'empirical': { // Empirical Distribution Function (SPSS Definition 2)
                if (W === 0) return null;
                const rank = (p / 100) * W;
                const k = Math.ceil(rank);
                if (k < 1) return y[0];
                if (k > y.length) return y[y.length - 1];
                return y[k-1];
            }
            case 'round': { // Round to nearest observation (SPSS Definition 5)
                 if (W === 0) return null;
                 const rank = Math.round((p / 100) * W);
                 if (rank < 1) return y[0];
                 if (rank > y.length) return y[y.length - 1];
                 return y[rank - 1];
            }
            default:
                return null;
        }
    }
    
    /**
     * Mengembalikan ringkasan statistik frekuensi dasar.
     * @returns {object} Objek hasil analisis.
     */
    getStatistics() {
        if (this.memo.allStats) return this.memo.allStats;

        const descStatsResults = this.descCalc.getStatistics();
        const descStats = descStatsResults.stats;

        // === NEW: Build percentile list based on UI options ===
        let percentileObj = {};
        const statOpts = (this.options && this.options.statisticsOptions) ? this.options.statisticsOptions : null;
        if (statOpts && statOpts.percentileValues) {
            const { quartiles, cutPoints, cutPointsN, enablePercentiles, percentilesList } = statOpts.percentileValues;
            let pctList = [];

            // Quartiles → 25, 50, 75
            if (quartiles) pctList.push(25, 50, 75);

            // Cut points for N equal groups → (100 / N) * i  where i = 1..N-1
            if (cutPoints) {
                const n = parseInt(cutPointsN, 10);
                if (!isNaN(n) && n > 1) {
                    for (let i = 1; i < n; i++) {
                        pctList.push((100 / n) * i);
                    }
                }
            }

            // Custom percentiles entered by user
            if (enablePercentiles && Array.isArray(percentilesList)) {
                percentilesList.forEach(pStr => {
                    const p = parseFloat(pStr);
                    if (!isNaN(p)) pctList.push(p);
                });
            }

            // Sanitize: keep 0 < p < 100, unique, sorted
            pctList = Array.from(new Set(pctList.filter(p => p >= 0 && p <= 100)));
            pctList.sort((a, b) => a - b);

            pctList.forEach(p => {
                percentileObj[p] = this.getPercentile(p, 'waverage');
            });
        }

        // Fallback to default quartiles if none requested / computed
        if (Object.keys(percentileObj).length === 0) {
            percentileObj = {
                '25': this.getPercentile(25, 'haverage'),  // Use haverage for Q1 (SPSS consistency)
                '50': this.getPercentile(50, 'haverage'),  // Use haverage for Q2/Median (SPSS consistency)
                '75': this.getPercentile(75, 'haverage'),  // Use haverage for Q3 (SPSS consistency)
            };
        }

        // Combine descriptive statistics with frequency-specific statistics
        const allStatistics = {
            ...descStats,
            Mode: this.getMode(),
            Percentiles: percentileObj,
        };

        // Ensure internal consistency: set Median equal to the 50th percentile (if available)
        if (percentileObj['50'] !== undefined) {
            allStatistics.Median = percentileObj['50'];
        }

        // === Add Interquartile Range (IQR) ===
        const q1 = percentileObj['25'];
        const q3 = percentileObj['75'];
        if (q1 !== undefined && q1 !== null && q3 !== undefined && q3 !== null) {
            allStatistics.IQR = q3 - q1;
        }

        // Display rounding now handled in worker.js files

        const finalResult = {
            variable: this.variable,
            stats: this.options.displayDescriptive ? allStatistics : null,
            frequencyTable: this.options.displayFrequency ? this.getFrequencyTable() : null
        };
        
        this.memo.allStats = finalResult;
        return finalResult;
    }

    /**
     * Menghasilkan tabel frekuensi lengkap.
     * @returns {object|null}
     */
    getFrequencyTable() {
        if (this.memo.frequencyTable) return this.memo.frequencyTable;

        const sortedData = this.getSortedData();
        const descStats = this.descCalc.getStatistics().stats;
        const totalN = descStats.N;            // Total cases
        const validN = descStats.Valid;        // Valid (non-missing) cases
        const missingN = descStats.Missing;

        if (!sortedData || validN === 0) return null;

        const { y, c } = sortedData;
        let cumulativePercent = 0;

        const rows = y.map((value, index) => {
            const frequency = c[index];
            const rawPercent = totalN > 0 ? (frequency / totalN) * 100 : 0;
            const rawValidPercent = validN > 0 ? (frequency / validN) * 100 : 0;

            // SPSS rounds percentages to one decimal place in its output tables
            const percent = parseFloat(rawPercent.toFixed(1));
            const validPercent = parseFloat(rawValidPercent.toFixed(1));
            cumulativePercent = parseFloat((cumulativePercent + validPercent).toFixed(1));

            return {
                label: String(value), // placeholder; worker may convert based on value-labels
                frequency,
                percent,
                validPercent,
                cumulativePercent
            };
        });

        this.memo.frequencyTable = {
            title: this.variable.label || this.variable.name,
            rows,
            summary: {
                valid: validN,
                missing: missingN,
                total: totalN,
            }
        };

        return this.memo.frequencyTable;
    }
}

self.FrequencyCalculator = FrequencyCalculator;