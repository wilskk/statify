var STATS_DECIMAL_PLACES = 3;

function checkIsMissing(value, missingValuesDef, isNumeric) {
    if (value === null || value === undefined || (isNumeric && isNaN(value))) {
        return true;
    }
    if (!missingValuesDef) return false;

    if (missingValuesDef.type === 'none') {
        return false;
    }
    if (missingValuesDef.type === 'discrete') {
        return (missingValuesDef.values || []).some(missingVal => 
            String(missingVal) === String(value)
        );
    }
    if (missingValuesDef.type === 'range') {
        const numericValue = Number(value);
        if (isNaN(numericValue)) return false; 
        const { low, high } = missingValuesDef;
        return numericValue >= low && numericValue <= high;
    }
    if (missingValuesDef.type === 'range_discrete') {
        const numericValue = Number(value);
        if (isNaN(numericValue)) {
            return (missingValuesDef.values || []).some(missingVal => 
                String(missingVal) === String(value)
            );
        }
        if ((missingValuesDef.values || []).includes(numericValue)) {
            return true;
        }
        const { low, high } = missingValuesDef;
        return numericValue >= low && numericValue <= high;
    }
    return false;
}

function isNumeric(value) {
    if (value === null || value === undefined || value === '') return false;
    
    // Jika value adalah string tanggal dd-mm-yyyy, konversi ke SPSS seconds
    if (typeof value === 'string' && isDateString(value)) {
        const spssSeconds = dateStringToSpssSeconds(value);
        return spssSeconds !== null;
    }
    
    return !isNaN(parseFloat(value)) && isFinite(value);
}

// Fungsi untuk mengkonversi string tanggal dd-mm-yyyy ke detik SPSS
function dateStringToSpssSeconds(dateString) {
    if (typeof dateString !== 'string') {
        return null;
    }

    const parts = dateString.split('-');
    if (parts.length !== 3) {
        return null; // Format tidak valid
    }

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Validasi dasar hasil parsing
    if (isNaN(day) || isNaN(month) || isNaN(year) || month < 1 || month > 12 || day < 1 || day > 31) {
        return null;
    }

    // Epoch SPSS: 14 Oktober 1582, 00:00:00 UTC
    const SPSS_EPOCH_MILLIS = Date.UTC(1582, 9, 14, 0, 0, 0);
    
    // Hitung timestamp target dalam milidetik sejak epoch JavaScript (gunakan UTC)
    const targetMillis = Date.UTC(year, month - 1, day, 0, 0, 0);

    // Periksa apakah Date.UTC menghasilkan timestamp valid
    const validationDate = new Date(targetMillis);
    if (
        isNaN(targetMillis) ||
        validationDate.getUTCFullYear() !== year ||
        validationDate.getUTCMonth() !== month - 1 ||
        validationDate.getUTCDate() !== day
    ) {
        return null; // Komponen tanggal tidak valid
    }

    // Hitung selisih dalam milidetik
    const diffMillis = targetMillis - SPSS_EPOCH_MILLIS;

    // Konversi selisih ke detik
    const spssSeconds = Math.round(diffMillis / 1000);

    return spssSeconds;
}

// Fungsi untuk mengkonversi detik SPSS kembali ke string tanggal dd-mm-yyyy
function spssSecondsToDateString(spssSeconds) {
    if (typeof spssSeconds !== 'number' || !Number.isFinite(spssSeconds)) {
        return null;
    }

    // Epoch SPSS: 14 Oktober 1582, 00:00:00 UTC
    const SPSS_EPOCH_MILLIS = Date.UTC(1582, 9, 14, 0, 0, 0);
    
    // Hitung timestamp target dalam milidetik sejak epoch JavaScript
    const targetMillis = SPSS_EPOCH_MILLIS + spssSeconds * 1000;

    // Buat objek Date dari timestamp milidetik
    const date = new Date(targetMillis);

    // Periksa apakah tanggal yang dihasilkan valid
    if (isNaN(date.getTime())) {
        return null;
    }

    // Ekstrak komponen tanggal menggunakan metode UTC
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1; // Bulan 0-indexed, jadi tambah 1
    const year = date.getUTCFullYear();

    // Format komponen dengan nol di depan jika perlu
    const dayString = String(day).padStart(2, '0');
    const monthString = String(month).padStart(2, '0');

    return `${dayString}-${monthString}-${year}`;
}

// Fungsi untuk memeriksa apakah string adalah format tanggal dd-mm-yyyy
function isDateString(value) {
    if (typeof value !== 'string') return false;
    
    // Cek format dd-mm-yyyy dengan regex
    const datePattern = /^\d{1,2}-\d{1,2}-\d{4}$/;
    if (!datePattern.test(value)) return false;
    
    // Coba konversi untuk memastikan tanggal valid
    return dateStringToSpssSeconds(value) !== null;
}

function toSPSSFixed(num, decimals) {
    if (typeof num !== 'number' || typeof decimals !== 'number') {
        return num; 
    }
    const shifter = Math.pow(10, decimals);
    const shiftedNum = num * shifter;
    const roundedShiftedNum = Math.round(shiftedNum);
    
    
    if (Math.abs(shiftedNum - roundedShiftedNum) === 0.5) {
        
        // Ini efektif membulatkan ke angka genap terdekat.
        if (roundedShiftedNum % 2 !== 0) {
            return (roundedShiftedNum - 1) / shifter;
        }
    }
    
    return roundedShiftedNum / shifter;
}


function roundToDecimals(number, decimals) {
    if (typeof number !== 'number' || isNaN(number) || !isFinite(number)) return number;
    return parseFloat(number.toFixed(decimals));
}



function mapValueLabel(variable, value) {
    if (variable && Array.isArray(variable.values)) {
        const match = variable.values.find(vl => String(vl.value) === String(value));
        if (match && match.label) return match.label;
    }
    return String(value);
}


function applyValueLabels(frequencyTable, variable) {
    if (!frequencyTable || !variable) return frequencyTable;
    const rows = (frequencyTable.rows || []).map(row => ({
        ...row,
        label: mapValueLabel(variable, row.label)
    }));
    return { ...frequencyTable, rows };
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { isNumeric, checkIsMissing, roundToDecimals, mapValueLabel, applyValueLabels, toSPSSFixed, STATS_DECIMAL_PLACES, dateStringToSpssSeconds, spssSecondsToDateString, isDateString };
}
if (typeof globalThis !== 'undefined') {
  globalThis.isNumeric = isNumeric;
  globalThis.checkIsMissing = checkIsMissing;
  globalThis.roundToDecimals = roundToDecimals;
  globalThis.mapValueLabel = mapValueLabel;
  globalThis.applyValueLabels = applyValueLabels;
  globalThis.toSPSSFixed = toSPSSFixed;
  globalThis.STATS_DECIMAL_PLACES = STATS_DECIMAL_PLACES;
  globalThis.dateStringToSpssSeconds = dateStringToSpssSeconds;
  globalThis.spssSecondsToDateString = spssSecondsToDateString;
  globalThis.isDateString = isDateString;
}