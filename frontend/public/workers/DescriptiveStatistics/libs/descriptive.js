/**
 * @file /libs/descriptive.js
 * @class DescriptiveCalculator
 * @description
 * Melakukan perhitungan statistik deskriptif menggunakan algoritma provisional (one-pass).
 * Metode ini sangat efisien dalam penggunaan memori, karena tidak perlu menyimpan
 * seluruh data di memori untuk menghitung varians, skewness, atau kurtosis.
 * Mendukung data berbobot dan menangani missing values secara internal.
 */
/* global importScripts, isNumeric, checkIsMissing */
importScripts('/workers/DescriptiveStatistics/libs/utils.js');

class DescriptiveCalculator {
    /**
     * @param {object} variable - Objek definisi variabel.
     * @param {Array<any>} data - Array data untuk variabel ini.
     * @param {Array<number>|null} weights - Array bobot yang sesuai dengan data.
     * @param {object} options - Opsi tambahan dari main thread.
     */
    constructor({ variable, data, weights = null, options = {} }) {
        this.variable = variable;
        this.data = data;
        this.weights = weights;
        this.options = options; // Simpan options untuk penggunaan nanti
        this.initialized = false;
        
        // Properti yang dihitung selama inisialisasi (algoritma provisional)
        this.W = 0;   // Sum of weights
        this.W2 = 0;  // Sum of weights squared
        this.M1 = 0;  // 1st moment (mean * W)
        this.M2 = 0;  // 2nd moment (sum of squared deviations from mean)
        this.M3 = 0;  // 3rd moment
        this.M4 = 0;  // 4th moment
        this.S = 0;   // Sum of values
        this.min = Infinity;
        this.max = -Infinity;
        this.N = 0;   // Total valid cases count

        /** @private */
        this.memo = {};
    }

    /**
     * @private
     * Menginisialisasi kalkulasi menggunakan algoritma provisional.
     * Metode one-pass ini menghitung semua momen yang diperlukan dalam satu iterasi.
     */
    #initialize() {
        if (this.initialized) return;

        const isNumericType = ['scale', 'date'].includes(this.variable.measure);
        
        for (let i = 0; i < this.data.length; i++) {
            const value = this.data[i];
            const weight = this.weights ? (this.weights[i] ?? 1) : 1;
            
            if (checkIsMissing(value, this.variable.missing, isNumericType) || !isNumeric(value) || typeof weight !== 'number' || weight <= 0) {
                continue;
            }
            
            const x = parseFloat(value);
            const w = weight;

            if (this.N === 0) { // Kasus pertama
                this.M1 = x;
                this.W = w;
                this.W2 = w * w;
                this.S = x * w;
                this.min = x;
                this.max = x;
                this.N = 1;
                continue;
            }
            
            const old_W = this.W;
            const new_W = old_W + w;
            const delta = x - this.M1;
            const R = delta * (w / new_W);
            
            this.M1 += R;
            this.M4 += R * (R * R * R * old_W * w * (old_W * old_W - old_W * w + w * w) / (new_W * new_W * new_W)) + 6 * R * R * this.M2 - 4 * R * this.M3;
            this.M3 += R * (R * R * old_W * w * (old_W - w) / (new_W * new_W)) - 3 * R * this.M2;
            this.M2 += old_W * delta * R;

            this.W = new_W;
            this.W2 += w * w;
            this.S += x * w;
            this.min = Math.min(this.min, x);
            this.max = Math.max(this.max, x);
            this.N++;
        }
        
        this.initialized = true;
    }
    
    getN() { this.#initialize(); return this.data.length; }
    getValidN() { this.#initialize(); return this.W; } // For weighted, validN is sum of weights
    getSum() { this.#initialize(); return this.N > 0 ? this.S : null; }
    getMean() { this.#initialize(); return this.N > 0 ? this.M1 : null; }
    getMin() { this.#initialize(); return this.N > 0 ? this.min : null; }
    getMax() { this.#initialize(); return this.N > 0 ? this.max : null; }
    getRange() { this.#initialize(); return this.N > 0 ? this.max - this.min : null; }

    getVariance() {
        if (this.memo.variance) return this.memo.variance;
        this.#initialize();
        if (this.W <= 1) return null;
        
        const denominator = this.W2 < this.W * this.W ? this.W - (this.W2 / this.W) : this.W - 1;
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
        const g1 = (n * this.M3) / ((n - 1) * (n - 2) * Math.pow(variance, 1.5));
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
        const term1 = (n * (n + 1) * this.M4) / ((n - 1) * (n - 2) * (n - 3) * variance * variance);
        const term2 = (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
        const g2 = term1 - term2;
        
        this.memo.kurtosis = g2;
        return g2;
    }

    getSEofKurtosis() {
        this.#initialize();
        const n = this.W;
        if (n < 4) return null;
        return Math.sqrt((24 * n * (n - 1) * (n - 1)) / ((n - 3) * (n - 2) * (n + 3) * (n + 5)));
    }

    /**
     * Mengembalikan ringkasan lengkap statistik deskriptif.
     * @returns {object} Objek hasil analisis.
     */
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

        let median = null;
        if (validValues.length > 0) {
            const mid = Math.floor(validValues.length / 2);
            median = validValues.length % 2 !== 0 
                ? validValues[mid] 
                : (validValues[mid - 1] + validValues[mid]) / 2;
        }

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

        return {
            variable: this.variable,
            stats: {
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
            },
            zScores: zScores,
        };
    }
}

self.DescriptiveCalculator = DescriptiveCalculator; 