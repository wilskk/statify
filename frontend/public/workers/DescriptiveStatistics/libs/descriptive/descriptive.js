// importScripts('../utils/utils.js'); // Commented out for tests - utils.js loaded separately

function roundToDecimals(number, decimals) {
    if (typeof number !== 'number' || isNaN(number) || !isFinite(number)) return number;
    return parseFloat(number.toFixed(decimals));
}

class DescriptiveCalculator {
    
    constructor({ variable, data, weights = null, options = {} }) {
        this.variable = variable;
        this.data = data;
        this.weights = weights;
        this.options = options || {}; 
        this.initialized = false;
        
        this.W = 0;
        this.W2 = 0;
        this.M1 = 0;
        this.M2 = 0;
        this.M3 = 0;
        this.M4 = 0;
        this.S = 0;
        this.min = Infinity;
        this.max = -Infinity;
        this.N = 0; 
        
        this.memo = {};
    }

    
    #initialize() {
        if (this.initialized) return;

        const isNumericType = ['scale', 'date'].includes(this.variable.measure);
        
        this.W = 0;
        this.S = 0;
        this.N = 0;
        this.min = Infinity;
        this.max = -Infinity;
        
        const validData = [];

        for (let i = 0; i < this.data.length; i++) {
            const value = this.data[i];
            const weight = this.weights ? (this.weights[i] ?? 1) : 1;
            
            if (checkIsMissing(value, this.variable.missing, isNumericType) || !isNumeric(value) || typeof weight !== 'number' || weight <= 0) {
                continue;
            }
            
            const x = parseFloat(value);
            const w = weight;

            this.W += w;
            this.S += x * w;
            this.N++;
            this.min = Math.min(this.min, x);
            this.max = Math.max(this.max, x);
            validData.push({ value: x, weight: w });
        }

        if (this.W > 0) {
            this.M1 = this.S / this.W; 
        } else {
            this.M1 = null;
        }


        this.M2 = 0;
        this.M3 = 0;
        this.M4 = 0;
        this.W2 = 0;

        if (this.M1 !== null) {
            for (const item of validData) {
                const delta = item.value - this.M1;
                this.M2 += item.weight * Math.pow(delta, 2);
                this.M3 += item.weight * Math.pow(delta, 3);
                this.M4 += item.weight * Math.pow(delta, 4);
                this.W2 += item.weight * item.weight;
            }
        }
        
        this.initialized = true;
    }
    
    getN() { this.#initialize(); return this.data.length; }
    getValidN() { this.#initialize(); return this.W; } 
    getSum() { this.#initialize(); return this.N > 0 ? this.S : null; }
    getMean() { this.#initialize(); return this.N > 0 ? this.M1 : null; }
    getMin() { this.#initialize(); return this.N > 0 ? this.min : null; }
    getMax() { this.#initialize(); return this.N > 0 ? this.max : null; }
    getRange() { this.#initialize(); return this.N > 0 ? this.max - this.min : null; }

    getVariance() {
        if (this.memo.variance) return this.memo.variance;
        this.#initialize();
        if (this.W <= 1) return null;
        
        const denominator = this.W - 1;
        if (denominator <= 0) return null;

        this.memo.variance = this.M2 / denominator;
        return this.memo.variance;
    }
    
    getStdDev() {
        if (this.memo.stdDev) return this.memo.stdDev;
        const variance = this.getVariance();
        this.memo.stdDev = variance !== null ? Math.sqrt(variance) : null;
        return this.memo.stdDev;
    }
    
    getStdErrOfMean() {
        if (this.memo.seMean) return this.memo.seMean;
        const stdDev = this.getStdDev();
        this.#initialize();
        if (stdDev === null || this.W <= 0) return null;
        this.memo.seMean = stdDev / Math.sqrt(this.W);
        return this.memo.seMean;
    }
    
    getSkewness() {
        if (this.memo.skewness) return this.memo.skewness;
        const variance = this.getVariance();
        this.#initialize();
        if (variance === null || variance === 0 || this.W < 3) return null;
        
        const n = this.W;
        const numerator = (n * this.M3);
        const denominator = ((n - 1) * (n - 2) * Math.pow(this.getStdDev(), 3));

        if (denominator === 0) return null;

        const g1 = numerator / denominator;
        this.memo.skewness = g1;
        return g1;
    }
    
    getSEofSkewness() {
        this.#initialize();
        const n = this.W;
        if (n < 3) return null;
        return Math.sqrt((6 * n * (n - 1)) / ((n - 2) * (n + 1) * (n + 3)));
    }
    
    getKurtosis() {
        if (this.memo.kurtosis) return this.memo.kurtosis;
        const variance = this.getVariance();
        this.#initialize();
        if (variance === null || variance === 0 || this.W < 4) return null;
        
        const n = this.W;
        const stdDev = this.getStdDev();

        const numerator = n * (n + 1) * this.M4 - 3 * this.M2 * this.M2 * (n - 1);
        const denominator = (n - 1) * (n - 2) * (n - 3) * Math.pow(stdDev, 4);

        if (denominator === 0) return null;

        const g2 = numerator / denominator;
        
        this.memo.kurtosis = g2;
        return g2;
    }

    getSEofKurtosis() {
        this.#initialize();
        const n = this.W;
        if (n < 4) return null;
        return Math.sqrt((24 * n * (n - 1) * (n - 1)) / ((n - 3) * (n - 2) * (n + 3) * (n + 5)));
    }

    
    getStatistics() {
        this.#initialize();
        const stats = {
            n: this.data.length,
            valid: this.W,
            missing: this.data.length - this.W,
            mean: this.getMean(),
            sum: this.getSum(),
            stdDev: this.getStdDev(),
            variance: this.getVariance(),
            seMean: this.getStdErrOfMean(),
            min: this.getMin(),
            max: this.getMax(),
            range: this.getRange(),
            skewness: this.getSkewness(),
            seSkewness: this.getSEofSkewness(),
            kurtosis: this.getKurtosis(),
            seKurtosis: this.getSEofKurtosis(),
        };

        const isNumericType = ['scale', 'date'].includes(this.variable.measure);
        const validValues = this.data
            .filter(value => !checkIsMissing(value, this.variable.missing, isNumericType) && isNumeric(value))
            .map(value => parseFloat(value));
        validValues.sort((a, b) => a - b);

        // --- Median (50th percentile) using Weighted Average (SPSS Definition 1) ---
        let median = null;
        if (validValues.length > 0) {
            // Build map of value → aggregated weight (handles duplicates & case-weights)
            const weightMap = new Map();
            for (let i = 0; i < this.data.length; i++) {
                const value = this.data[i];
                const weight = this.weights ? (this.weights[i] ?? 1) : 1;

                if (!isNumeric(value) || weight <= 0) continue;

                const numVal = parseFloat(value);
                weightMap.set(numVal, (weightMap.get(numVal) || 0) + weight);
            }

            // Sort unique values
            const y = Array.from(weightMap.keys()).sort((a, b) => a - b);
            const c = y.map(v => weightMap.get(v));
            // Cumulative weights
            const cc = c.reduce((acc, w) => {
                acc.push((acc.length > 0 ? acc[acc.length - 1] : 0) + w);
                return acc;
            }, []);

            const W = cc[cc.length - 1];
            if (W > 0) {
                // SPSS Definition 1 (Weighted Average) - Exact formula for median (p=50)
                // tp = (W + 1) * p / 100 = (W + 1) * 50 / 100 = (W + 1) * 0.5
                const tp = (W + 1) * 0.5;

                // Find x1 and x2 where x2 is the first value with cumulative frequency >= tp
                const i = cc.findIndex(cumulativeWeight => cumulativeWeight >= tp);

                if (i === -1) return y[y.length - 1]; // tp >= all cumulative frequencies
                if (i === 0) return y[0]; // tp <= first cumulative frequency

                const x1 = y[i - 1]; // Value before x2
                const x2 = y[i];     // First value with cumulative frequency >= tp
                const cc1 = cc[i - 1]; // Cumulative frequency up to x1

                // Check if tp - cp1 >= 100/W (where cp1 = cc1/W * 100)
                const cp1 = (cc1 / W) * 100;
                const threshold = 100 / W;

                if (tp - cp1 >= threshold) {
                    median = x2; // Use x2 directly
                } else {
                    // Linear interpolation: {1 - [(W+1)p/100 - cc1]}x1 + [(W+1)p/100 - cc1]x2
                    const weight = (tp - cc1);
                    median = (1 - weight) * x1 + weight * x2;
                }
            }
        }
        // Percentiles are now calculated in FrequencyCalculator
        // to handle options correctly. Median is left here for now,
        // but should ideally be unified.
        
        const shouldSaveZScores = this.options.saveStandardized && stats.stdDev && stats.stdDev > 0;
        let zScores = null;

        if (shouldSaveZScores) {
            zScores = this.data.map(value => {
                if (checkIsMissing(value, this.variable.missing, isNumericType) || !isNumeric(value)) {
                    return ""; // Return empty for missing or non-numeric
                }
                return (parseFloat(value) - stats.mean) / stats.stdDev;
            });
        }
        const statsObj = {
            N: stats.n,
            Valid: stats.valid,
            Missing: stats.missing,
            Mean: stats.mean,
            Sum: stats.sum,
            StdDev: stats.stdDev,
            Variance: stats.variance,
            SEMean: stats.seMean,
            Minimum: stats.min,
            Maximum: stats.max,
            Range: stats.range,
            Skewness: stats.skewness,
            SESkewness: stats.seSkewness,
            Kurtosis: stats.kurtosis,
            SEKurtosis: stats.seKurtosis,
            Median: median,
        };

        

        return {
            variable: this.variable,
            stats: statsObj,
            zScores: zScores,
        };
    }
}

self.DescriptiveCalculator = DescriptiveCalculator;