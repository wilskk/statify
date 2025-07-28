importScripts('/workers/DescriptiveStatistics/libs/utils.js');
// Load jStat for statistical functions
importScripts('https://cdn.jsdelivr.net/npm/jstat@latest/dist/jstat.min.js');

// M-estimator weight functions
const M_ESTIMATOR_WEIGHT_FUNCTIONS = {
    huber: (u) => { 
        const abs_u = Math.abs(u); 
        const k = 1.339; 
        return abs_u <= k ? 1 : k / abs_u; 
    },
    hampel: (u) => {
        const abs_u = Math.abs(u);
        const a = 1.7, b = 3.4, c = 8.5; 
        if (abs_u <= a) return 1;
        if (abs_u <= b) return a / abs_u;
        if (abs_u <= c) return (a * (c - abs_u)) / (abs_u * (c - b));
        return 0;
    },
    andrew: (u) => {
        const abs_u = Math.abs(u);
        const c = 1.34 * Math.PI; 
        if (abs_u <= c) {
            if (abs_u < 1e-9) return 1;
            return (c / Math.PI) * Math.sin(Math.PI * u / c) / u;
        }
        return 0;
    },
    tukey: (u) => {
        const abs_u = Math.abs(u);
        const c = 4.685; 
        if (abs_u <= c) {
            const ratio = u / c;
            return Math.pow(1 - ratio * ratio, 2);
        }
        return 0;
    }
};

class ExamineCalculator {
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

    #initialize() {
        if (this.initialized) return;
        this.descCalc.getN(); 
        this.freqCalc.getMode();
        this.initialized = true;
    }

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
    
    getMEstimator(method) {
        this.#initialize();
        
        const validMethods = ['huber', 'hampel', 'andrew', 'tukey'];
        if (!validMethods.includes(method.toLowerCase())) {
            method = 'huber';
        }
        
        const y_tilde = this.freqCalc.getPercentile(50, 'haverage');
        if (y_tilde === null) return null;
        
        const absoluteDeviations = [];
        for (let i = 0; i < this.data.length; i++) {
            const val = this.data[i];
            const weight = this.weights ? (this.weights[i] ?? 1) : 1;
            if (isNumeric(val) && typeof weight === 'number' && weight > 0) {
                for (let w = 0; w < weight; w++) {
                    absoluteDeviations.push(Math.abs(parseFloat(val) - y_tilde));
                }
            }
        }
        
        if (absoluteDeviations.length === 0) return y_tilde;
        
        absoluteDeviations.sort((a, b) => a - b);
        const n = absoluteDeviations.length;
        const mad = n % 2 === 0 
            ? (absoluteDeviations[n/2 - 1] + absoluteDeviations[n/2]) / 2 
            : absoluteDeviations[Math.floor(n/2)];
        
        let s = mad !== null && mad > 0 ? mad * 1.4826 : null;
        
        if (s === null || s === 0) {
            const stdDev = this.descCalc.getStdDev();
            s = stdDev && stdDev > 0 ? stdDev : 1.0; 
        }
        
        if (s <= 1e-10) return y_tilde;

        const getWeight = M_ESTIMATOR_WEIGHT_FUNCTIONS[method.toLowerCase()] || (() => 1);
        let T_k = y_tilde;
        const epsilon = 1e-4; 
        const maxIter = 30;

        for (let iter = 0; iter < maxIter; iter++) {
            let numerator = 0, denominator = 0;
            
            for (let i = 0; i < this.data.length; i++) {
                const value = this.data[i];
                const weight = this.weights ? (this.weights[i] ?? 1) : 1;
                
                if (!isNumeric(value) || typeof weight !== 'number' || weight <= 0) continue;

                const residual = (parseFloat(value) - T_k) / s;
                const w_i = getWeight(residual);

                numerator += weight * parseFloat(value) * w_i;
                denominator += weight * w_i;
            }
            
            if (denominator === 0) return T_k;
            
            const T_k_plus_1 = numerator / denominator;
            
            const absChange = Math.abs(T_k_plus_1 - T_k);
            const relTolerance = Math.max(epsilon, Math.abs(T_k_plus_1) * epsilon);
            const absTolerance = epsilon * 10; 
            
            if (absChange <= absTolerance || absChange <= relTolerance) {
                return Math.round(T_k_plus_1 * 1000000) / 1000000;
            }
            
            T_k = T_k_plus_1;
        }
        
        return Math.round(T_k * 1000000) / 1000000;
    }

    getStatistics() {
        this.#initialize();
        const descStatsResult = this.descCalc.getStatistics();
        const freqStatsResult = this.freqCalc.getStatistics();
        
        const combinedStats = {
            ...descStatsResult.stats,
            ...(freqStatsResult.stats || {}), 
        };

        const medianHaverage = this.freqCalc.getPercentile(50, 'haverage');
        if (medianHaverage !== null) {
            combinedStats.Median = medianHaverage;
        }

        const q1_waverage = this.freqCalc.getPercentile(25, 'waverage');
        const q3_waverage = this.freqCalc.getPercentile(75, 'waverage');
        if (q1_waverage !== null && q3_waverage !== null) {
            combinedStats.Q1 = q1_waverage;
            combinedStats.Q3 = q3_waverage;
            combinedStats.IQR = q3_waverage - q1_waverage;
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

        if (this.options.showOutliers) {
            results.extremeValues = this.getExtremeValues(this.options.extremeCount || 5);
        }

        const { Mean: mean, SEMean: seMean, Valid: n } = descStatsResult?.stats || {};
        if (seMean !== null && mean !== null && seMean !== undefined && mean !== undefined && n > 1) {
            const df = n - 1;
            
            const confidenceLevel = this.options.confidenceInterval || 95;
            const alpha = (100 - confidenceLevel) / 100; 
            
            const t_critical = getTCriticalApproximation(df, alpha);
            
            results.descriptives.confidenceInterval = {
                lower: mean - (t_critical * seMean),
                upper: mean + (t_critical * seMean),
                level: confidenceLevel
            };
        }
        
        return results;
    }

    getExtremeValues(extremeCount = 5) {
        this.#initialize();

        const entries = [];
        for (let i = 0; i < this.data.length; i++) {
            const val = this.data[i];
            const weight = this.weights ? (this.weights[i] ?? 1) : 1;
            if (!isNumeric(val) || typeof weight !== 'number' || weight <= 0) continue;
            
            const caseNumber = this.caseNumbers && this.caseNumbers[i] ? this.caseNumbers[i] : i + 1;
            entries.push({ caseNumber, value: parseFloat(val) });
        }

        if (entries.length === 0) return null;

        const q1 = this.freqCalc.getPercentile(25, 'waverage');
        const q3 = this.freqCalc.getPercentile(75, 'waverage');
        if (q1 === null || q3 === null) return null;
        const iqr = q3 - q1;

        if (iqr === 0) {
            const sortedAsc = [...entries].sort((a, b) => a.value - b.value);
            const sortedDesc = [...entries].sort((a, b) => b.value - a.value);
            return buildExtremeValueObject(sortedAsc, sortedDesc, extremeCount);
        }

        const step = 1.5 * iqr;
        const lowerInner = q1 - step;
        const upperInner = q3 + step;
        const lowerOuter = q1 - (2 * step); 
        const upperOuter = q3 + (2 * step);

        const isHighExtreme = (v) => v > upperOuter;
        const isLowExtreme = (v) => v < lowerOuter;
        const isHighOutlier = (v) => v > upperInner && v <= upperOuter;
        const isLowOutlier = (v) => v < lowerInner && v >= lowerOuter;

        const sortedAsc = [...entries].sort((a, b) => a.value - b.value);
        const sortedDesc = [...entries].sort((a, b) => b.value - a.value);

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

        let highest = pickCandidates(sortedDesc, isHighExtreme);
        if (highest.length < extremeCount) {
            const additional = pickCandidates(sortedDesc, isHighOutlier);
            highest.push(...additional.slice(0, extremeCount - highest.length));
        }

        let lowest = pickCandidates(sortedAsc, isLowExtreme);
        if (lowest.length < extremeCount) {
            const additional = pickCandidates(sortedAsc, isLowOutlier);
            lowest.push(...additional.slice(0, extremeCount - lowest.length));
        }

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

        const checkPartial = (sourceArray, fullSorted, direction) => {
            if (sourceArray.length === 0) return;
            const lastIncluded = sourceArray[sourceArray.length - 1];
            const lastValue = lastIncluded.value;
            const indexInFull = fullSorted.findIndex(e => e.caseNumber === lastIncluded.caseNumber);
            const nextIndex = indexInFull + 1;
            if (nextIndex < fullSorted.length && fullSorted[nextIndex].value === lastValue) {
                lastIncluded.isPartial = true; 
            }
        };

        checkPartial(lowest, sortedAsc, 'lowest');
        checkPartial(highest, sortedDesc, 'highest');

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


function getTCriticalApproximation(df, alpha = 0.05) {
    const p = 1 - alpha / 2;
    
    const tTables = {
        // Alpha = 0.01 (99% confidence interval)
        0.01: {
            1: 63.657, 2: 9.925, 3: 5.841, 4: 4.604, 5: 4.032,
            6: 3.707, 7: 3.499, 8: 3.355, 9: 3.250, 10: 3.169,
            11: 3.106, 12: 3.055, 13: 3.012, 14: 2.977, 15: 2.947,
            16: 2.921, 17: 2.898, 18: 2.878, 19: 2.861, 20: 2.845,
            21: 2.831, 22: 2.819, 23: 2.807, 24: 2.797, 25: 2.787,
            26: 2.779, 27: 2.771, 28: 2.763, 29: 2.756, 30: 2.750
        },
        // Alpha = 0.05 (95% confidence interval)
        0.05: {
            1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
            6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
            11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
            16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
            21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060,
            26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045, 30: 2.042
        },
        // Alpha = 0.1 (90% confidence interval)
        0.1: {
            1: 6.314, 2: 2.920, 3: 2.353, 4: 2.132, 5: 2.015,
            6: 1.943, 7: 1.895, 8: 1.860, 9: 1.833, 10: 1.812,
            11: 1.796, 12: 1.782, 13: 1.771, 14: 1.761, 15: 1.753,
            16: 1.746, 17: 1.740, 18: 1.734, 19: 1.729, 20: 1.725,
            21: 1.721, 22: 1.717, 23: 1.714, 24: 1.711, 25: 1.708,
            26: 1.706, 27: 1.703, 28: 1.701, 29: 1.699, 30: 1.697
        }
    };
    
    // Find the closest alpha level we have tables for
    const availableAlphas = Object.keys(tTables).map(Number);
    const closestAlpha = availableAlphas.reduce((prev, curr) => 
        Math.abs(curr - alpha) < Math.abs(prev - alpha) ? curr : prev);
    
    const tTable = tTables[closestAlpha];
    
    // If exact df is in table, return it
    if (tTable[df]) {
        return tTable[df];
    }
    
    // For df > 30, use approximation that approaches z values
    if (df > 30) {
        const zValues = {
            0.01: 2.576,  // 99% CI
            0.05: 1.96,   // 95% CI  
            0.1: 1.645    // 90% CI
        };
        const z = zValues[closestAlpha] || 1.96;
        const t30 = tTable[30] || z;
        return z + (t30 - z) * Math.exp(-0.1 * (df - 30));
    }
    
    // For other cases, interpolate or use closest value
    if (df < 1) return tTable[1] || 12.706; // Use df=1 as minimum
    
    // Find closest values for interpolation
    const lowerDf = Math.floor(df);
    const upperDf = Math.ceil(df);
    
    if (lowerDf === upperDf) {
        // Integer df, find closest in table
        const keys = Object.keys(tTable).map(Number).sort((a, b) => a - b);
        const closest = keys.reduce((prev, curr) => 
            Math.abs(curr - df) < Math.abs(prev - df) ? curr : prev);
        return tTable[closest];
    }
    
    // Linear interpolation
    const lowerT = tTable[lowerDf] || (closestAlpha === 0.05 ? 2.0 : (closestAlpha === 0.01 ? 2.8 : 1.7));
    const upperT = tTable[upperDf] || (closestAlpha === 0.05 ? 2.0 : (closestAlpha === 0.01 ? 2.8 : 1.7));
    const fraction = df - lowerDf;
    
    return lowerT + fraction * (upperT - lowerT);
}