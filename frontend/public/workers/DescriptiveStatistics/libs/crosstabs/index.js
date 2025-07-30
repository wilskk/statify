/**
 * Crosstabs Module
 * Mengekspor kelas CrosstabsCalculator untuk analisis tabulasi silang
 */

importScripts('./crosstabs.js');

// Ekspor kelas CrosstabsCalculator agar dapat digunakan oleh modul lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CrosstabsCalculator };
} else if (typeof self !== 'undefined') {
    self.CrosstabsModule = { CrosstabsCalculator };
}