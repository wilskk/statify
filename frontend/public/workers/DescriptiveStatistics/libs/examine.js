/**
 * @file /libs/examine.js
 * @class ExamineCalculator
 * @description
 * Menyediakan analisis eksplorasi data yang mendalam, menggabungkan statistik deskriptif,
 * statistik robust (M-Estimators, Trimmed Mean), dan metode persentil canggih.
 * Menggunakan DescriptiveCalculator dan FrequencyCalculator secara internal (Komposisi).
 */
/* global importScripts, isNumeric, DescriptiveCalculator, FrequencyCalculator */
importScripts('/workers/DescriptiveStatistics/libs/utils.js');
// Calculator lain dimuat oleh manager.js

// Fungsi bobot untuk M-Estimators didefinisikan di luar kelas untuk efisiensi
const M_ESTIMATOR_WEIGHT_FUNCTIONS = {
    huber: (u) => { const abs_u = Math.abs(u); return abs_u <= 1.339 ? 1 : 1.339 / abs_u; },
    hampel: (u) => {
        const abs_u = Math.abs(u);
        if (abs_u <= 1.7) return 1;
        if (abs_u <= 3.4) return 1.7 / abs_u;
        if (abs_u <= 8.5) return (1.7 * (8.5 - abs_u)) / ((8.5 - 3.4) * abs_u);
        return 0;
    },
    andrew: (u) => {
        const abs_u = Math.abs(u);
        const c = 1.34 * Math.PI;
        // Gunakan batas untuk menghindari pembagian dengan nol saat u -> 0
        if (abs_u <= c) return abs_u < 1e-9 ? 1 : Math.sin(u / 1.34) / (u / 1.34);
        return 0;
    },
    tukey: (u) => {
        const abs_u = Math.abs(u);
        const c = 4.685;
        if (abs_u <= c) return Math.pow(1 - Math.pow(u / c, 2), 2);
        return 0;
    }
};

class ExamineCalculator {
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
        this.options = options;
        this.initialized = false;

        this.descCalc = new DescriptiveCalculator({ variable, data, weights, options });
        this.freqCalc = new FrequencyCalculator({ variable, data, weights, options: { ...options, displayDescriptive: true } });
    }

    /** @private */
    #initialize() {
        if (this.initialized) return;
        // Inisialisasi kalkulator anak
        this.descCalc.getN(); 
        this.freqCalc.getMode();
        this.initialized = true;
    }

    /**
     * Menghitung 5% Trimmed Mean, yaitu rata-rata setelah membuang 5% data terkecil dan 5% data terbesar.
     * @returns {number|null} Nilai 5% Trimmed Mean.
     */
    getTrimmedMean() {
        this.#initialize();
        const sortedData = this.freqCalc.getSortedData();
        if (!sortedData) return null;
        
        const { y, c, cc, W } = sortedData;
        if (W === 0) return null;

        const tc = 0.05 * W;
        const k1 = cc.findIndex(val => val >= tc);
        
        let k2 = -1;
        for(let i = cc.length - 1; i >= 0; i--){
            const cc_i_minus_1 = i > 0 ? cc[i-1] : 0;
            if(cc_i_minus_1 < (W - tc)){
                k2 = i;
                break;
            }
        }
        
        if (k1 === -1 || k2 === -1 || k1 >= k2) return this.descCalc.getMean();

        let sum_tengah = 0;
        for (let i = k1 + 1; i < k2; i++) {
            sum_tengah += c[i] * y[i];
        }

        const term1 = (cc[k1] - tc) * y[k1];
        const term2 = (W - (cc[k2-1] || 0) - tc) * y[k2];
        const total_sum = term1 + term2 + sum_tengah;
        
        const denominator = W - (2 * tc);
        return denominator > 0 ? total_sum / denominator : null;
    }
    
    /**
     * Menghitung M-Estimator untuk lokasi, sebuah statistik robust yang kurang sensitif terhadap outlier.
     * @param {string} method - Metode bobot: 'huber', 'hampel', 'andrew', 'tukey'.
     * @returns {number|null} Nilai M-Estimator.
     */
    getMEstimator(method) {
        this.#initialize();
        const y_tilde = this.freqCalc.getPercentile(50, 'haverage');
        if (y_tilde === null) return null;
        
        // Hitung Median Absolute Deviation (MAD) secara efisien
        const deviations = this.data.filter(v => isNumeric(v)).map(val => Math.abs(parseFloat(val) - y_tilde));
        const madCalc = new FrequencyCalculator({ variable: { ...this.variable, measure: 'scale'}, data: deviations, weights: this.weights, options: this.options });
        const s = madCalc.getPercentile(50, 'haverage');
        
        if (s === null || s === 0) return y_tilde;

        const getWeight = M_ESTIMATOR_WEIGHT_FUNCTIONS[method.toLowerCase()] || (() => 1);
        let T_k = y_tilde;
        const epsilon = 1e-5;
        const maxIter = 30;

        for (let iter = 0; iter < maxIter; iter++) {
            let num = 0, den = 0;
            for(let i=0; i < this.data.length; i++) {
                const value = this.data[i];
                const weight = this.weights ? (this.weights[i] ?? 1) : 1;
                
                if (!isNumeric(value) || typeof weight !== 'number' || weight <= 0) continue;

                const u_i = (parseFloat(value) - T_k) / s;
                const w_i = getWeight(u_i);

                num += weight * parseFloat(value) * w_i;
                den += weight * w_i;
            }
            const T_k_plus_1 = den === 0 ? T_k : num / den;
            if (Math.abs(T_k_plus_1 - T_k) <= epsilon * (Math.abs(T_k_plus_1) + Math.abs(T_k)) / 2) {
                return T_k_plus_1;
            }
            T_k = T_k_plus_1;
        }
        return T_k;
    }

    /**
     * Mengembalikan ringkasan lengkap statistik Examine.
     * @returns {object} Objek hasil analisis.
     */
    getStatistics() {
        this.#initialize();
        const descStatsResult = this.descCalc.getStatistics();
        const freqStatsResult = this.freqCalc.getStatistics();
        
        // Combine stats from both calculators. Descriptive is the base, Frequency adds Mode/Percentiles.
        const combinedStats = {
            ...descStatsResult.stats,
            ...freqStatsResult.stats,
        };

        const results = {
            summary: {
                valid: descStatsResult.stats.Valid,
                missing: descStatsResult.stats.Missing,
                total: descStatsResult.stats.N,
            },
            descriptives: combinedStats,
            trimmedMean: this.getTrimmedMean(),
            mEstimators: {
                huber: this.getMEstimator('huber'),
                hampel: this.getMEstimator('hampel'),
                andrews: this.getMEstimator('andrew'),
                tukey: this.getMEstimator('tukey'),
            },
            percentiles: {
                waverage: { 
                    '5': this.freqCalc.getPercentile(5, 'waverage'),
                    '10': this.freqCalc.getPercentile(10, 'waverage'),
                    '25': this.freqCalc.getPercentile(25, 'waverage'), 
                    '50': this.freqCalc.getPercentile(50, 'waverage'), 
                    '75': this.freqCalc.getPercentile(75, 'waverage'),
                    '90': this.freqCalc.getPercentile(90, 'waverage'),
                    '95': this.freqCalc.getPercentile(95, 'waverage')
                },
                round: { 
                    '5': this.freqCalc.getPercentile(5, 'round'),
                    '10': this.freqCalc.getPercentile(10, 'round'),
                    '25': this.freqCalc.getPercentile(25, 'round'), 
                    '50': this.freqCalc.getPercentile(50, 'round'), 
                    '75': this.freqCalc.getPercentile(75, 'round'),
                    '90': this.freqCalc.getPercentile(90, 'round'),
                    '95': this.freqCalc.getPercentile(95, 'round')
                },
                empirical: { 
                    '5': this.freqCalc.getPercentile(5, 'empirical'),
                    '10': this.freqCalc.getPercentile(10, 'empirical'),
                    '25': this.freqCalc.getPercentile(25, 'empirical'), 
                    '50': this.freqCalc.getPercentile(50, 'empirical'), 
                    '75': this.freqCalc.getPercentile(75, 'empirical'),
                    '90': this.freqCalc.getPercentile(90, 'empirical'),
                    '95': this.freqCalc.getPercentile(95, 'empirical')
                },
                aempirical: {
                    '5': this.freqCalc.getPercentile(5, 'aempirical'),
                    '10': this.freqCalc.getPercentile(10, 'aempirical'),
                    '25': this.freqCalc.getPercentile(25, 'aempirical'), 
                    '50': this.freqCalc.getPercentile(50, 'aempirical'), 
                    '75': this.freqCalc.getPercentile(75, 'aempirical'),
                    '90': this.freqCalc.getPercentile(90, 'aempirical'),
                    '95': this.freqCalc.getPercentile(95, 'aempirical')
                },
                haverage: {
                    '5': this.freqCalc.getPercentile(5, 'haverage'),
                    '10': this.freqCalc.getPercentile(10, 'haverage'),
                    '25': this.freqCalc.getPercentile(25, 'haverage'), 
                    '50': this.freqCalc.getPercentile(50, 'haverage'), 
                    '75': this.freqCalc.getPercentile(75, 'haverage'),
                    '90': this.freqCalc.getPercentile(90, 'haverage'),
                    '95': this.freqCalc.getPercentile(95, 'haverage')
                },
            }
        };

        // Append extreme values if requested
        if (this.options.showOutliers) {
            results.extremeValues = this.getExtremeValues(this.options.extremeCount || 5);
        }

        // Correctly calculate confidence interval using the right stats
        const { Mean: mean, SEMean: seMean } = descStatsResult.stats;
        if (seMean !== null && mean !== null) {
            const t_value = 1.96; // Approximation for 95% CI
            results.descriptives.confidenceInterval = {
                lower: mean - (t_value * seMean),
                upper: mean + (t_value * seMean),
                level: 95
            };
        }
        
        return results;
    }

    getExtremeValues(extremeCount = 5) {
        this.#initialize();

        // Collect valid numeric values with their original case numbers
        const entries = [];
        for (let i = 0; i < this.data.length; i++) {
            const val = this.data[i];
            const weight = this.weights ? (this.weights[i] ?? 1) : 1;
            if (!isNumeric(val) || typeof weight !== 'number' || weight <= 0) continue;
            entries.push({ caseNumber: i + 1, value: parseFloat(val) });
        }

        if (entries.length === 0) return null;

        // ==== 1. Compute quartiles & IQR (using waverage percentiles like SPSS) ====
        const q1 = this.freqCalc.getPercentile(25, 'waverage');
        const q3 = this.freqCalc.getPercentile(75, 'waverage');
        if (q1 === null || q3 === null) return null;
        const iqr = q3 - q1;

        // Guard against zero IQR (no spread)
        if (iqr === 0) {
            // Fall back to simple min/max selection
            const sortedAsc = [...entries].sort((a, b) => a.value - b.value);
            const sortedDesc = [...entries].sort((a, b) => b.value - a.value);
            return buildExtremeValueObject(sortedAsc, sortedDesc, extremeCount);
        }

        const step = 1.5 * iqr;
        const lowerInner = q1 - step;
        const upperInner = q3 + step;
        const lowerOuter = q1 - 2 * step; // 3.0 * IQR total
        const upperOuter = q3 + 2 * step;

        // ==== 2. Identify candidate outliers/extremes ====
        const isExtreme = (v) => v < lowerOuter || v > upperOuter;
        const isOutlier = (v) => (v < lowerInner || v > upperInner) && !isExtreme(v);

        const sortedAsc = [...entries].sort((a, b) => a.value - b.value);
        const sortedDesc = [...entries].sort((a, b) => b.value - a.value);

        // Helper to pick up to extremeCount from a source array filtering by predicate
        function pickCandidates(source, predicate) {
            const arr = [];
            for (const item of source) {
                if (predicate(item.value)) {
                    arr.push(item);
                    if (arr.length === extremeCount) break;
                }
            }
            return arr;
        }

        let lowest = pickCandidates(sortedAsc, isExtreme);
        let highest = pickCandidates(sortedDesc, isExtreme);

        // If not enough extremes, fill with mild outliers
        if (lowest.length < extremeCount) {
            const additional = pickCandidates(sortedAsc, isOutlier).filter(it => !lowest.includes(it));
            lowest = [...lowest, ...additional.slice(0, extremeCount - lowest.length)];
        }
        if (highest.length < extremeCount) {
            const additional = pickCandidates(sortedDesc, isOutlier).filter(it => !highest.includes(it));
            highest = [...highest, ...additional.slice(0, extremeCount - highest.length)];
        }

        // Still not enough? fill with regular extremes by value (closest to fence)
        const fillByValue = (list, source) => {
            if (list.length >= extremeCount) return list;
            for (const item of source) {
                if (!list.includes(item)) {
                    list.push(item);
                    if (list.length === extremeCount) break;
                }
            }
            return list;
        };

        lowest = fillByValue(lowest, sortedAsc);
        highest = fillByValue(highest, sortedDesc);

        // Mark partial lists if ties at boundary
        const checkPartial = (sourceArray, fullSorted, direction) => {
            if (sourceArray.length === 0) return;
            const lastIncluded = sourceArray[sourceArray.length - 1];
            const lastValue = lastIncluded.value;
            const indexInFull = fullSorted.findIndex(e => e.caseNumber === lastIncluded.caseNumber);
            const nextIndex = indexInFull + 1;
            if (nextIndex < fullSorted.length && fullSorted[nextIndex].value === lastValue) {
                lastIncluded.isPartial = true; // footnote handled by formatter
            }
        };

        checkPartial(lowest, sortedAsc, 'lowest');
        checkPartial(highest, sortedDesc, 'highest');

        // Helper to tag each entry type
        const tagType = (arr) => arr.map(item => ({ ...item, type: isExtreme(item.value) ? 'extreme' : (isOutlier(item.value) ? 'outlier' : 'normal') }));

        return {
            highest: tagType(highest),
            lowest: tagType(lowest),
            isTruncated: extremeCount > entries.length,
            fences: {
                lowerInner,
                upperInner,
                lowerOuter,
                upperOuter,
            },
        };

        // === local helper ===
        function buildExtremeValueObject(sortedAsc, sortedDesc, count) {
            const lo = sortedAsc.slice(0, count);
            const hi = sortedDesc.slice(0, count);
            return {
                highest: hi,
                lowest: lo,
                isTruncated: count > entries.length
            };
        }
    }
}

self.ExamineCalculator = ExamineCalculator; 