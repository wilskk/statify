/**
 * Utils Module
 * Mengekspor fungsi-fungsi utilitas yang digunakan oleh modul lain
 */

importScripts('./utils.js');

// Ekspor fungsi-fungsi utils agar dapat digunakan oleh modul lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isValidNumber,
        getValidData,
        calculateWeightedMean,
        calculateWeightedVariance,
        calculateWeightedStandardDeviation,
        calculateWeightedSkewness,
        calculateWeightedKurtosis
    };
} else if (typeof self !== 'undefined') {
    self.UtilsModule = {
        isValidNumber,
        getValidData,
        calculateWeightedMean,
        calculateWeightedVariance,
        calculateWeightedStandardDeviation,
        calculateWeightedSkewness,
        calculateWeightedKurtosis
    };
}