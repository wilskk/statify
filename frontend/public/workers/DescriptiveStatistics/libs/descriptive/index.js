/**
 * Descriptive Statistics Module
 * Mengekspor kelas DescriptiveCalculator untuk perhitungan statistik deskriptif
 */

importScripts('./descriptive.js');

// Ekspor kelas DescriptiveCalculator agar dapat digunakan oleh modul lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DescriptiveCalculator };
} else if (typeof self !== 'undefined') {
    self.DescriptiveModule = { DescriptiveCalculator };
}