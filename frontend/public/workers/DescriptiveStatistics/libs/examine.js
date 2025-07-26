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

            // Append extreme values if requested
            ...(this.options.showOutliers && { extremeValues: this.getExtremeValues(this.options.extremeCount || 5) }),
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