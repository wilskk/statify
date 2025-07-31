// importScripts('../utils/utils.js'); // Commented out for tests - utils.js loaded separately

function roundToDecimals(number, decimals) {
    if (typeof number !== 'number' || isNaN(number) || !isFinite(number)) return number;
    return parseFloat(number.toFixed(decimals));
}

class FrequencyCalculator {
    constructor({ variable, data, weights = null, options = {} }) {
        this.variable = variable;
        this.data = data;
        this.weights = weights;
        this.options = options || {};

        this.descCalc = new DescriptiveCalculator({ variable, data, weights, options });

        this.memo = {};
    }

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
            case 'haverage': { // Weighted Average (SPSS Definition 4)
                if (W === 0) return null;
                
                // SPSS Definition 4 (Weighted Average) - Formula from EXAMINE Algorithms
                // tc₂ = (W + 1) * p / 100
                const tc2 = (W + 1) * p / 100;
                
                // Handle edge cases first
                if (tc2 <= 0) return y[0];
                if (tc2 >= W) return y[y.length - 1];
                
                // Find k₂ where cc[k₂-1] ≤ tc₂ < cc[k₂]
                let k2 = -1;
                for (let i = 0; i < cc.length; i++) {
                    if (cc[i] >= tc2) {
                        k2 = i;
                        break;
                    }
                }
                
                if (k2 === -1) return y[y.length - 1];
                
                // Get values and cumulative frequencies
                const cc_k2_minus_1 = k2 > 0 ? cc[k2 - 1] : 0;
                const c_k2_plus_1 = c[k2]; // Weight of observation at position k2
                const y_k2 = k2 > 0 ? y[k2 - 1] : y[0]; // Value at position k2-1
                const y_k2_plus_1 = y[k2]; // Value at position k2
                
                // Calculate g₂* = tc₂ - cc[k₂-1]
                const g2_star = tc2 - cc_k2_minus_1;
                
                // Calculate g₂ = g₂* / c[k₂]
                const g2 = c_k2_plus_1 > 0 ? g2_star / c_k2_plus_1 : 0;
                
                // Apply SPSS EXAMINE conditional formula for haverage
                if (g2_star >= c_k2_plus_1) {
                    return y_k2_plus_1;
                } else if (c_k2_plus_1 >= 1) {
                    return (1 - g2_star) * y_k2 + g2_star * y_k2_plus_1;
                } else {
                    return (1 - g2) * y_k2 + g2_star * y_k2_plus_1;
                }
            }
            case 'tukeyhinges': { // Tukey's Hinges - Metode Khusus untuk Kuartil (Q1, Q2, Q3)
                if (W === 0) return null;
                
                // Tukey's Hinges hanya untuk persentil 25, 50, dan 75
                if (p !== 25 && p !== 50 && p !== 75) {
                    // Fallback ke waverage untuk persentil lainnya
                    return this.getPercentile(p, 'waverage');
                }
                
                // Implementasi Tukey's Hinges yang benar
                // Untuk data tanpa bobot (semua c[i] = 1), gunakan metode standar Tukey
                const allWeightsOne = c.every(weight => weight === 1);
                
                if (allWeightsOne) {
                    // Metode Tukey's Hinges standar untuk data tanpa bobot
                    const n = y.length;
                    
                    if (p === 50) {
                        // Median
                        if (n % 2 === 1) {
                            return y[Math.floor(n / 2)];
                        } else {
                            const mid1 = y[n / 2 - 1];
                            const mid2 = y[n / 2];
                            return (mid1 + mid2) / 2;
                        }
                    } else if (p === 25) {
                        // Q1 - median dari lower half (termasuk median jika n ganjil)
                        let lowerHalf;
                        if (n % 2 === 1) {
                            // Include median in lower half
                            lowerHalf = y.slice(0, Math.floor(n / 2) + 1);
                        } else {
                            lowerHalf = y.slice(0, n / 2);
                        }
                        const lowerN = lowerHalf.length;
                        if (lowerN % 2 === 1) {
                            return lowerHalf[Math.floor(lowerN / 2)];
                        } else {
                            const mid1 = lowerHalf[lowerN / 2 - 1];
                            const mid2 = lowerHalf[lowerN / 2];
                            return (mid1 + mid2) / 2;
                        }
                    } else { // p === 75
                        // Q3 - median dari upper half (termasuk median jika n ganjil)
                        let upperHalf;
                        if (n % 2 === 1) {
                            // Include median in upper half
                            upperHalf = y.slice(Math.floor(n / 2));
                        } else {
                            upperHalf = y.slice(n / 2);
                        }
                        const upperN = upperHalf.length;
                        if (upperN % 2 === 1) {
                            return upperHalf[Math.floor(upperN / 2)];
                        } else {
                            const mid1 = upperHalf[upperN / 2 - 1];
                            const mid2 = upperHalf[upperN / 2];
                            return (mid1 + mid2) / 2;
                        }
                    }
                } else {
                    // Untuk data berbobot, fallback ke waverage
                    return this.getPercentile(p, 'waverage');
                }
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
    
    getStatistics() {
        if (this.memo.allStats) return this.memo.allStats;

        const descStatsResults = this.descCalc.getStatistics();
        const descStats = descStatsResults.stats;

        let percentileObj = {};
        const statOpts = (this.options && this.options.statisticsOptions) ? this.options.statisticsOptions : null;
        if (statOpts && statOpts.percentileValues) {
            const { quartiles, cutPoints, cutPointsN, enablePercentiles, percentilesList } = statOpts.percentileValues;
            let pctList = [];

            if (quartiles) pctList.push(25, 50, 75);

            if (cutPoints) {
                const n = parseInt(cutPointsN, 10);
                if (!isNaN(n) && n > 1) {
                    for (let i = 1; i < n; i++) {
                        pctList.push((100 / n) * i);
                    }
                }
            }

            if (enablePercentiles && Array.isArray(percentilesList)) {
                percentilesList.forEach(pStr => {
                    const p = parseFloat(pStr);
                    if (!isNaN(p)) pctList.push(p);
                });
            }

            pctList = Array.from(new Set(pctList.filter(p => p >= 0 && p <= 100)));
            pctList.sort((a, b) => a - b);

            pctList.forEach(p => {
                percentileObj[p] = this.getPercentile(p, 'waverage');
            });
        }

        if (Object.keys(percentileObj).length === 0) {
            percentileObj = {
                '25': this.getPercentile(25, 'waverage'),  
                '50': this.getPercentile(50, 'waverage'),  
                '75': this.getPercentile(75, 'waverage'),  
            };
        }

        const allStatistics = {
            ...descStats,
            Mode: this.getMode(),
            Percentiles: percentileObj,
        };

        if (percentileObj['50'] !== undefined) {
            allStatistics.Median = percentileObj['50'];
        }

        const q1 = percentileObj['25'];
        const q3 = percentileObj['75'];
        if (q1 !== undefined && q1 !== null && q3 !== undefined && q3 !== null) {
            allStatistics.IQR = q3 - q1;
        }

        const finalResult = {
            variable: this.variable,
            stats: this.options.displayDescriptive ? allStatistics : null,
            frequencyTable: this.options.displayFrequency ? this.getFrequencyTable() : null
        };
        
        this.memo.allStats = finalResult;
        return finalResult;
    }

    getFrequencyTable() {
        if (this.memo.frequencyTable) return this.memo.frequencyTable;

        const sortedData = this.getSortedData();
        const descStats = this.descCalc.getStatistics().stats;
        const totalN = descStats.N;            
        const validN = descStats.Valid;        
        
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