/**
 * @file /libs/utils.js
 * @description
 * Kumpulan fungsi utilitas terpusat yang digunakan oleh berbagai worker Nonparametric Tests.
 */

/**
 * Memeriksa apakah sebuah nilai dapat dianggap numerik.
 * Mendukung angka dan string yang merepresentasikan angka.
 * @param {*} value - Nilai yang akan diperiksa.
 * @returns {boolean} True jika numerik, false jika tidak.
 */
export function isNumeric(value) {
    if (typeof value === 'number' && !isNaN(value)) return true;
    if (typeof value === 'string' && value.trim() !== '') {
        return !isNaN(parseFloat(value));
    }
    return false;
}

/**
 * Memeriksa apakah sebuah nilai dianggap 'missing' berdasarkan definisi variabel.
 * Mendukung missing diskrit (misal: [99, 98]) dan rentang missing (misal: {min: 90, max: 99}).
 * @param {*} value - Nilai yang akan diperiksa.
 * @param {object} definition - Objek definisi missing values dari variabel.
 * @param {boolean} isNumericType - True jika tipe variabel adalah numerik.
 * @returns {boolean} True jika nilai dianggap missing.
 */
export function checkIsMissing(value, definition, isNumericType) {
    if (value === null || value === undefined || (isNumericType && value === '')) return true;
    if (!definition) return false;

    if (definition.discrete && Array.isArray(definition.discrete)) {
        const valueToCompare = isNumericType && typeof value !== 'number' ? parseFloat(value) : value;
        for (const missingVal of definition.discrete) {
            const discreteMissingToCompare = isNumericType && typeof missingVal === 'string' ? parseFloat(missingVal) : missingVal;
            if (valueToCompare === discreteMissingToCompare || String(value) === String(missingVal)) return true;
        }
    }

    if (isNumericType && definition.range) {
        const numValue = typeof value === 'number' ? value : parseFloat(value);
        if (!isNaN(numValue)) {
            const min = parseFloat(definition.range.min);
            const max = parseFloat(definition.range.max);
            if (!isNaN(min) && !isNaN(max) && numValue >= min && numValue <= max) return true;
        }
    }
    return false;
}