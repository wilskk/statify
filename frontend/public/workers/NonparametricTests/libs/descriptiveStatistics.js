/**
 * @file /libs/descriptiveStatistics.js
 * @class DescriptiveStatisticsCalculator
 * @description
 * Kelas untuk menghitung statistik deskriptif.
 * Menghitung berbagai statistik deskriptif seperti mean, std deviation, dll.
 */
import { checkIsMissing, isNumeric } from './utils.js';

class DescriptiveStatisticsCalculator {
    /**
     * @param {object} params - Parameter untuk analisis.
     * @param {object} params.variable - Objek definisi variabel.
     * @param {Array<any>} params.data - Array data untuk variabel ini.
     * @param {object} params.options - Opsi tambahan dari main thread.
     */
    constructor({ variable, data, options = {} }) {
        this.variable = variable;
        this.data = data;
        this.options = options;
        this.initialized = false;
        
        // Properti yang akan dihitung
        this.validData = [];
        this.N = 0;
        
        /** @private */
        this.memo = {};
    }
    
    /**
     * @private
     * Memproses data untuk analisis
     */
    #initialize() {
        if (this.initialized) return;

        const isNumericType = ['scale', 'date'].includes(this.variable.measure);

        // Filter data yang valid
        this.validData = this.data
            .filter(value => !checkIsMissing(value, this.variable.missing, isNumericType) && isNumeric(value))
            .map(value => parseFloat(value));
        
        // Hitung Total N
        this.N = this.validData.length;

        this.initialized = true;
    }
    
    /**
     * Menghitung mean dari data
     * @returns {number} Mean
     */
    getMean() {
        if (this.memo.mean !== undefined) return this.memo.mean;
        
        this.#initialize();
        
        if (this.N === 0) return null;
        
        const sum = this.validData.reduce((acc, val) => acc + val, 0);
        const mean = sum / this.N;
        
        this.memo.mean = mean;
        return mean;
    }
    
    /**
     * Menghitung standard deviation dari data
     * @returns {number} Standard deviation
     */
    getStdDev() {
        if (this.memo.stdDev !== undefined) return this.memo.stdDev;
        
        this.#initialize();
        
        if (this.N <= 1) return null;
        
        const mean = this.getMean();
        const sumSq = this.validData.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
        const stdDev = Math.sqrt(sumSq / (this.N - 1));
        
        this.memo.stdDev = stdDev;
        return stdDev;
    }
    
    /**
     * Menghitung standard error mean
     * @returns {number} Standard error mean
     */
    getSEMean() {
        if (this.memo.seMean !== undefined) return this.memo.seMean;
        
        const stdDev = this.getStdDev();
        if (stdDev === null || this.N === 0) return null;
        
        const seMean = stdDev / Math.sqrt(this.N);
        
        this.memo.seMean = seMean;
        return seMean;
    }
    
    /**
     * Menghitung nilai minimum dari data
     * @returns {number} Nilai minimum
     */
    getMin() {
        if (this.memo.min !== undefined) return this.memo.min;
        
        this.#initialize();
        
        if (this.N === 0) return null;
        
        const min = Math.min(...this.validData);
        
        this.memo.min = min;
        return min;
    }
    
    /**
     * Menghitung nilai maximum dari data
     * @returns {number} Nilai maximum
     */
    getMax() {
        if (this.memo.max !== undefined) return this.memo.max;
        
        this.#initialize();
        
        if (this.N === 0) return null;
        
        const max = Math.max(...this.validData);
        
        this.memo.max = max;
        return max;
    }
    
    /**
     * Menghitung percentile tertentu dari data
     * @param {number} percentile - Percentile yang ingin dihitung (0-100)
     * @returns {number} Nilai percentile
     */
    getPercentile(percentile) {
        const key = `percentile_${percentile}`;
        if (this.memo[key] !== undefined) return this.memo[key];
        
        this.#initialize();
        
        if (this.N === 0) return null;
        
        const sorted = [...this.validData].sort((a, b) => a - b);
        const index = (percentile / 100) * (sorted.length + 1);
        
        let result;
        if (Number.isInteger(index)) {
            result = sorted[index - 1];
        } else {
            const lowerIndex = Math.floor(index);
            const upperIndex = Math.ceil(index);
            const weight = index - lowerIndex;
            result = sorted[lowerIndex - 1] * (1 - weight) + sorted[upperIndex - 1] * weight;
        }
        
        this.memo[key] = result;
        return result;
    }
    
    /**
     * Mendapatkan semua statistik deskriptif
     * @returns {object} Objek berisi semua statistik deskriptif
     */
    getDescriptiveStatistics() {
        this.#initialize();
        
        return {
            variable: this.variable,
            N: this.N,
            Mean: this.getMean(),
            StdDev: this.getStdDev(),
            SEMean: this.getSEMean(),
            Min: this.getMin(),
            Max: this.getMax(),
            Percentile25: this.getPercentile(25),
            Percentile50: this.getPercentile(50),
            Percentile75: this.getPercentile(75)
        };
    }
    
    /**
     * Mengambil semua hasil statistik.
     * @returns {Object} Objek hasil yang berisi statistik deskriptif.
     */
    getOutput() {
        const descriptiveStatistics = this.getDescriptiveStatistics();
        
        return {
            descriptiveStatistics
        };
    }
}

// Export the calculator class for ES modules
globalThis.DescriptiveStatisticsCalculator = DescriptiveStatisticsCalculator;
export default DescriptiveStatisticsCalculator;