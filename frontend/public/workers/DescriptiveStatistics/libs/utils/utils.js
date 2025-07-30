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
    return !isNaN(parseFloat(value)) && isFinite(value);
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
  module.exports = { isNumeric, checkIsMissing, roundToDecimals, mapValueLabel, applyValueLabels, toSPSSFixed, STATS_DECIMAL_PLACES };
}
if (typeof globalThis !== 'undefined') {
  globalThis.isNumeric = isNumeric;
  globalThis.checkIsMissing = checkIsMissing;
  globalThis.roundToDecimals = roundToDecimals;
  globalThis.mapValueLabel = mapValueLabel;
  globalThis.applyValueLabels = applyValueLabels;
  globalThis.toSPSSFixed = toSPSSFixed;
  globalThis.STATS_DECIMAL_PLACES = STATS_DECIMAL_PLACES;
}