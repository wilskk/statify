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
    huber: (u) => { 
        const abs_u = Math.abs(u); 
        const k = 1.339; // Default parameter
        return abs_u <= k ? 1 : k / abs_u; 
    },
    hampel: (u) => {
        const abs_u = Math.abs(u);
        const a = 1.7, b = 3.4, c = 8.5; // Default parameters
        if (abs_u <= a) return 1;
        if (abs_u <= b) return a / abs_u;
        if (abs_u <= c) return (a * (c - abs_u)) / (abs_u * (c - b));
        return 0;
    },
    andrew: (u) => {
        const abs_u = Math.abs(u);
        const c = 1.34 * Math.PI; // Default: c = 1.34π
        if (abs_u <= c) {
            // Untuk u mendekati 0, gunakan limit: lim(u→0) sin(πu/c)/(πu/c) = 1
            if (abs_u < 1e-9) return 1;
            return (c / Math.PI) * Math.sin(Math.PI * u / c) / u;
        }
        return 0;
    },
    tukey: (u) => {
        const abs_u = Math.abs(u);
        const c = 4.685; // Default parameter
        if (abs_u <= c) {
            const ratio = u / c;
            return Math.pow(1 - ratio * ratio, 2);
        }
        return 0;
    }
};

class ExamineCalculator {
    /**
     * @param {object} payload - Payload dari manager.
     * @param {object} payload.variable - Objek definisi variabel.
     * @param {Array<any>} payload.data - Array data untuk variabel ini.
     * @param {Array<number>|null} payload.weights - Array bobot yang sesuai dengan data.
     * @param {Array<number>|null} payload.caseNumbers - Array nomor kasus asli.
     * @param {object} payload.options - Opsi untuk analisis.
     */
    constructor({ variable, data, weights = null, caseNumbers = null, options = {} }) {
        this.variable = variable;
        this.data = data;
        this.weights = weights;
        this.caseNumbers = caseNumbers;
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
     * Implementasi sesuai dengan spesifikasi SPSS EXAMINE algorithms.
     * 
     * @param {string} method - Metode bobot: 'huber', 'hampel', 'andrew', 'tukey'.
     * @returns {number|null} Nilai M-Estimator atau null jika perhitungan gagal.
     */
    getMEstimator(method) {
        this.#initialize();
        
        // Validasi input method
        const validMethods = ['huber', 'hampel', 'andrew', 'tukey'];
        if (!validMethods.includes(method.toLowerCase())) {
            console.warn(`Invalid M-estimator method: ${method}. Using Huber instead.`);
            method = 'huber';
        }
        
        const y_tilde = this.freqCalc.getPercentile(50, 'haverage');
        if (y_tilde === null) return null;
        
        // Hitung Median Absolute Deviation (MAD) dengan faktor skala SPSS
        // Untuk M-estimator, kita membutuhkan median klasik dari absolute deviations individual
        const absoluteDeviations = [];
        for (let i = 0; i < this.data.length; i++) {
            const val = this.data[i];
            const weight = this.weights ? (this.weights[i] ?? 1) : 1;
            if (isNumeric(val) && typeof weight === 'number' && weight > 0) {
                // Expand data berdasarkan weight untuk mendapatkan classical median
                for (let w = 0; w < weight; w++) {
                    absoluteDeviations.push(Math.abs(parseFloat(val) - y_tilde));
                }
            }
        }
        
        if (absoluteDeviations.length === 0) return y_tilde;
        
        // Hitung median klasik (bukan weighted median)
        absoluteDeviations.sort((a, b) => a - b);
        const n = absoluteDeviations.length;
        const mad = n % 2 === 0 
            ? (absoluteDeviations[n/2 - 1] + absoluteDeviations[n/2]) / 2 
            : absoluteDeviations[Math.floor(n/2)];
        
        // Untuk M-estimator, SPSS menggunakan MAD dengan faktor skala 1.4826
        // untuk konsistensi dengan standard normal distribution
        let s = mad !== null && mad > 0 ? mad * 1.4826 : null;
        
        // Jika MAD = 0, gunakan standard deviation sebagai fallback
        if (s === null || s === 0) {
            const stdDev = this.descCalc.getStdDev();
            s = stdDev && stdDev > 0 ? stdDev : 1.0; // Fallback terakhir ke 1.0
        }
        
        // Additional safety check for very small scale values
        if (s <= 1e-10) return y_tilde;

        const getWeight = M_ESTIMATOR_WEIGHT_FUNCTIONS[method.toLowerCase()] || (() => 1);
        let T_k = y_tilde;
        const epsilon = 1e-4; // Toleransi konvergensi sesuai SPSS (lebih longgar)
        const maxIter = 30;

        for (let iter = 0; iter < maxIter; iter++) {
            let numerator = 0, denominator = 0;
            
            for (let i = 0; i < this.data.length; i++) {
                const value = this.data[i];
                const weight = this.weights ? (this.weights[i] ?? 1) : 1;
                
                if (!isNumeric(value) || typeof weight !== 'number' || weight <= 0) continue;

                // Calculate the standardized residual for the weight function
                const residual = (parseFloat(value) - T_k) / s;
                const w_i = getWeight(residual);

                numerator += weight * parseFloat(value) * w_i;
                denominator += weight * w_i;
            }
            
            if (denominator === 0) return T_k;
            
            const T_k_plus_1 = numerator / denominator;
            
            // Kriteria konvergensi yang sesuai dengan SPSS
            const absChange = Math.abs(T_k_plus_1 - T_k);
            // SPSS menggunakan toleransi relatif yang lebih longgar
            const relTolerance = Math.max(epsilon, Math.abs(T_k_plus_1) * epsilon);
            const absTolerance = epsilon * 10; // Toleransi absolut yang lebih longgar
            
            
            if (absChange <= absTolerance || absChange <= relTolerance) {
                return Math.round(T_k_plus_1 * 1000000) / 1000000;
            }
            
            T_k = T_k_plus_1;
        }
        
        return Math.round(T_k * 1000000) / 1000000;
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
            ...(freqStatsResult.stats || {}), // Handle case where freqStatsResult.stats is null
        };

        // For EXAMINE, use haverage (Tukey's hinges) for median to match SPSS
        const medianHaverage = this.freqCalc.getPercentile(50, 'haverage');
        if (medianHaverage !== null) {
            combinedStats.Median = medianHaverage;
        }

        // Re-compute Q1, Q3, and IQR using Tukey's hinges (haverage) to match SPSS Explore
        const q1_hinge = this.freqCalc.getPercentile(25, 'haverage');
        const q3_hinge = this.freqCalc.getPercentile(75, 'haverage');
        if (q1_hinge !== null && q3_hinge !== null) {
            combinedStats.Q1 = q1_hinge;
            combinedStats.Q3 = q3_hinge;
            combinedStats.IQR = q3_hinge - q1_hinge;
        }

        const results = {
            summary: {
                valid: descStatsResult?.stats?.Valid || 0,
                missing: descStatsResult?.stats?.Missing || 0,
                total: descStatsResult?.stats?.N || 0,
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
        const { Mean: mean, SEMean: seMean } = descStatsResult?.stats || {};
        if (seMean !== null && mean !== null && seMean !== undefined && mean !== undefined) {
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
            
            // Gunakan caseNumber dari array jika tersedia, jika tidak, gunakan i + 1
            const caseNumber = this.caseNumbers && this.caseNumbers[i] ? this.caseNumbers[i] : i + 1;
            entries.push({ caseNumber, value: parseFloat(val) });
        }

        if (entries.length === 0) return null;

        // ==== 1. Compute quartiles & IQR (using waverage percentiles like SPSS) ====
        // Recompute quartiles using Tukey's hinges (haverage) for consistency with SPSS Explore
        const q1 = this.freqCalc.getPercentile(25, 'haverage');
        const q3 = this.freqCalc.getPercentile(75, 'haverage');
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
        const lowerOuter = q1 - (2 * step); // 3.0 * IQR total
        const upperOuter = q3 + (2 * step);

        // ==== 2. Identify candidate outliers/extremes ====
        const isHighExtreme = (v) => v > upperOuter;
        const isLowExtreme = (v) => v < lowerOuter;
        const isHighOutlier = (v) => v > upperInner && v <= upperOuter;
        const isLowOutlier = (v) => v < lowerInner && v >= lowerOuter;

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

        // --- Refactored logic for picking extremes and outliers ---

        // 1. Find Highest values: start with extremes, then outliers
        let highest = pickCandidates(sortedDesc, isHighExtreme);
        if (highest.length < extremeCount) {
            const additional = pickCandidates(sortedDesc, isHighOutlier);
            highest.push(...additional.slice(0, extremeCount - highest.length));
        }

        // 2. Find Lowest values: start with extremes, then outliers
        let lowest = pickCandidates(sortedAsc, isLowExtreme);
        if (lowest.length < extremeCount) {
            const additional = pickCandidates(sortedAsc, isLowOutlier);
            lowest.push(...additional.slice(0, extremeCount - lowest.length));
        }

        // 3. Still not enough? Fill with regular values from the sorted lists.
        const fillByValue = (list, source) => {
            const existingCaseNumbers = new Set(list.map(item => item.caseNumber));
            if (list.length >= extremeCount) return list;

            for (const item of source) {
                if (!existingCaseNumbers.has(item.caseNumber)) {
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
        const isOutlier = (v) => (v < lowerInner && v >= lowerOuter) || (v > upperInner && v <= upperOuter);
        const isExtreme = (v) => v < lowerOuter || v > upperOuter;
        
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