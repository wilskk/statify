/**
 * @file /libs/utils.js
 * @description
 * Berisi fungsi-fungsi utilitas umum yang digunakan oleh berbagai kalkulator statistik.
 */

var STATS_DECIMAL_PLACES = 3;

/**
 * Memeriksa apakah sebuah nilai dianggap 'missing' berdasarkan definisi variabel.
 * @param {*} value - Nilai yang akan diperiksa.
 * @param {object} missingValuesDef - Definisi nilai hilang dari variabel.
 * @param {boolean} isNumeric - Apakah nilai tersebut bertipe numerik.
 * @returns {boolean} - True jika nilai adalah missing.
 */
function checkIsMissing(value, missingValuesDef, isNumeric) {
    if (value === null || value === undefined || (isNumeric && isNaN(value))) {
        return true;
    }
    if (!missingValuesDef) return false;

    if (missingValuesDef.type === 'none') {
        return false;
    }
    if (missingValuesDef.type === 'discrete') {
        // Hati-hati dengan perbandingan tipe data
        return (missingValuesDef.values || []).some(missingVal => 
            String(missingVal) === String(value)
        );
    }
    if (missingValuesDef.type === 'range') {
        const numericValue = Number(value);
        if (isNaN(numericValue)) return false; // Non-numeric cannot be in a range
        
        const { low, high } = missingValuesDef;
        // Low and high are inclusive
        return numericValue >= low && numericValue <= high;
    }
    if (missingValuesDef.type === 'range_discrete') {
        const numericValue = Number(value);
        if (isNaN(numericValue)) {
            // Check against discrete non-numeric values
            return (missingValuesDef.values || []).some(missingVal => 
                String(missingVal) === String(value)
            );
        }
        // Check against discrete numeric values
        if ((missingValuesDef.values || []).includes(numericValue)) {
            return true;
        }
        // Check against range
        const { low, high } = missingValuesDef;
        return numericValue >= low && numericValue <= high;
    }
    return false;
}

/**
 * Memeriksa apakah suatu nilai dapat diinterpretasikan sebagai numerik.
 * @param {*} value - Nilai yang akan diperiksa.
 * @returns {boolean}
 */
function isNumeric(value) {
    if (value === null || value === undefined || value === '') return false;
    // The second condition handles cases like "  123  " and rejects "" or "   "
    return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Membulatkan angka ke jumlah desimal tertentu dengan metode pembulatan
 * "round half to even" (pembulatan bankir), yang sering digunakan dalam statistik.
 * Ini berbeda dari Math.round() yang selalu membulatkan 0.5 ke atas.
 * @param {number} num - Angka yang akan dibulatkan.
 * @param {number} decimals - Jumlah angka di belakang koma.
 * @returns {number} - Angka yang sudah dibulatkan.
 */
function toSPSSFixed(num, decimals) {
    if (typeof num !== 'number' || typeof decimals !== 'number') {
        return num; // Kembalikan nilai asli jika input tidak valid
    }
    const shifter = Math.pow(10, decimals);
    const shiftedNum = num * shifter;
    const roundedShiftedNum = Math.round(shiftedNum);
    
    // Deteksi kasus 'half' (cth: 2.5, 3.5)
    if (Math.abs(shiftedNum - roundedShiftedNum) === 0.5) {
        // Jika pembulatan standar menghasilkan angka ganjil, kurangi 1 untuk menjadikannya genap.
        // Ini efektif membulatkan ke angka genap terdekat.
        if (roundedShiftedNum % 2 !== 0) {
            return (roundedShiftedNum - 1) / shifter;
        }
    }
    
    return roundedShiftedNum / shifter;
}

// Membulatkan angka ke jumlah desimal tertentu (SPSS-style)
function roundToDecimals(number, decimals) {
    if (typeof number !== 'number' || isNaN(number) || !isFinite(number)) return number;
    return parseFloat(number.toFixed(decimals));
}

// Mendapatkan label teks untuk suatu nilai berdasarkan daftar value-label variabel.
// Jika tidak ada label, kembalikan string dari value.
function mapValueLabel(variable, value) {
    if (variable && Array.isArray(variable.values)) {
        const match = variable.values.find(vl => String(vl.value) === String(value));
        if (match && match.label) return match.label;
    }
    return String(value);
}

// Menerapkan mapping label ke seluruh baris tabel frekuensi.
function applyValueLabels(frequencyTable, variable) {
    if (!frequencyTable || !variable) return frequencyTable;
    const rows = (frequencyTable.rows || []).map(row => ({
        ...row,
        label: mapValueLabel(variable, row.label)
    }));
    return { ...frequencyTable, rows };
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { isNumeric, checkIsMissing, roundToDecimals, mapValueLabel, applyValueLabels };
}
if (typeof globalThis !== 'undefined') {
  globalThis.isNumeric = isNumeric;
  globalThis.checkIsMissing = checkIsMissing;
  globalThis.roundToDecimals = roundToDecimals;
  globalThis.mapValueLabel = mapValueLabel;
  globalThis.applyValueLabels = applyValueLabels;
} 