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
            case 'waverage': { // Weighted Average (SPSS)
                // SPSS defines the weighted-average percentile as:
                // rank = 1 + p/100 * (n - 1)
                // k    = floor(rank)
                // g    = rank - k
                // P    = y_k + g * (y_{k+1} - y_k)

                const rank = 1 + (p / 100) * (n - 1);
                const k = Math.floor(rank);
                const g = rank - k;

                // Boundary conditions
                if (k <= 1) return y[0];
                if (k >= n) return y[y.length - 1];

                // Locate y_k and y_{k+1} in cumulative counts (1-based ranks)
                const idx_k = cc.findIndex(total => total >= k);
                const idx_k1 = cc.findIndex(total => total >= k + 1);

                const y_k = y[idx_k];
                const y_k1 = idx_k1 !== -1 ? y[idx_k1] : y_k; // fallback if k+1 exceeds

                return y_k + g * (y_k1 - y_k);
            }
            case 'haverage': { // Weighted Average (Harrell-Davis)
                const rank = (n + 1) * (p / 100);
                const k = Math.floor(rank);
                const g = rank - k;
                
                if (k === 0) return y[0];
                if (k >= n) return y[y.length - 1];

                const w_k = cc[cc.findIndex(val => val >= k)];
                const w_k_plus_1 = cc[cc.findIndex(val => val >= k + 1)];

                if (w_k === undefined || w_k_plus_1 === undefined) return null;

                const i_k = cc.indexOf(w_k);
                const i_k_plus_1 = cc.indexOf(w_k_plus_1);
                
                return (1 - g) * y[i_k] + g * y[i_k_plus_1];
            }
            case 'aempirical': { // Empirical with Averaging
                const rank = n * (p / 100);
                const k = Math.floor(rank);
                const g = rank - k;
                
                if (g > 0) {
                     const i = cc.findIndex(val => val > k);
                     return i !== -1 ? y[i] : y[y.length - 1];
                } else { // g === 0
                    const i = cc.findIndex(val => val > k);
                    const j = cc.findIndex(val => val === k);
                    if (j === -1) return y[i];
                    return (y[j] + y[i]) / 2;
                }
            }
             case 'empirical': { // Empirical Distribution Function
                const rank = n * (p / 100);
                const k = Math.ceil(rank);
                const i = cc.findIndex(val => val >= k);
                return i !== -1 ? y[i] : y[y.length - 1];
            }
            case 'round': { // Round to nearest observation
                 const rank = Math.round(n * (p / 100));
                 if (rank === 0) return y[0];
                 const i = cc.findIndex(val => val >= rank);
                 return i !== -1 ? y[i] : y[y.length - 1];
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

        // Gabungkan semua statistik deskriptif dengan statistik frekuensi
        const allStatistics = {
            ...descStats,
            Mode: this.getMode(),
            Percentiles: {
                '25': this.getPercentile(25, 'waverage'),
                '50': this.getPercentile(50, 'waverage'),
                '75': this.getPercentile(75, 'waverage'),
            }
        };

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
                label: String(value), // Placeholder, can be enhanced with value labels
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