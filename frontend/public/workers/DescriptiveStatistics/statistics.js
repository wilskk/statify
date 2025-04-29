// /path/to/comprehensiveDescriptiveStats.js
// Kumpulan fungsi untuk menghitung statistik deskriptif dasar.
// Menangani data numerik, string, dan bobot opsional.
// Fungsi numerik (Mean, Median, StdDev, dll.) hanya memproses angka dan mengabaikan tipe lain.
// Mode dapat menangani angka dan string (termasuk format tanggal 'dd-mmm-yyyy').
// Objek Date JavaScript harus dipra-proses menjadi numerik (misal, timestamp atau durasi)
// SEBELUM digunakan dengan fungsi statistik numerik.

/**
 * Helper: Memfilter data berdasarkan nilai yang hilang/kosong dan bobot yang tidak valid.
 * Memperhitungkan definisi missing value user-defined (discrete & range).
 * Menghitung jumlah kasus valid (validN) dan jumlah total bobot untuk data numerik (totalW_numeric).
 * @param {Array<any>} data - Array data input.
 * @param {Array<number|null|undefined>} [weights] - Array bobot opsional.
 * @param {string} variableType - Tipe variabel ('NUMERIC', 'STRING', 'DATE').
 * @param {object|null|undefined} missingDefinition - Definisi missing value dari metadata variabel.
 * @returns {{validRawData: Array<any>, validWeights: Array<number>|null, totalW: number, validN: number}}
 * totalW adalah jumlah bobot HANYA untuk data numerik yang valid (tidak missing).
 * validN adalah jumlah total entri data yang valid (tidak missing).
 */
function getValidDataAndWeights(data, weights, variableType, missingDefinition) {
    const validRawData = [];
    const validWeights = weights ? [] : null;
    let totalW_numeric = 0;
    let validN = 0;
    const n = data ? data.length : 0;

    // Helper internal mirip checkMissing dari frequency.js
    const checkIsMissing = (value, type, definition) => {
        // 1. Cek system missing (string kosong untuk NUMERIC/DATE)
        if (value === "") {
            if (type === 'NUMERIC' || type === 'DATE') {
                return true; // System missing
            }
            // String kosong valid untuk tipe STRING
            return false;
        }

        // 2. Cek null/undefined (dianggap system missing secara umum)
        if (value === null || value === undefined) {
            return true; // System missing
        }

        // 3. Cek user-defined missing
        if (!definition) {
            return false; // Tidak ada definisi, tidak user-defined missing
        }

        // 3a. User-defined Discrete
        if (definition.discrete && Array.isArray(definition.discrete)) {
            let valueToCompare = value;
            // Konversi value ke number jika tipe NUMERIC untuk perbandingan
            if (type === 'NUMERIC' && typeof value !== 'number') {
                const numVal = parseFloat(value);
                if (!isNaN(numVal)) {
                    valueToCompare = numVal;
                }
            }

            for (const missingVal of definition.discrete) {
                let discreteMissingToCompare = missingVal;
                // Konversi discrete missing value ke number jika tipe NUMERIC & missingVal string
                if (type === 'NUMERIC' && typeof missingVal === 'string'){
                    const numMissing = parseFloat(missingVal);
                    if(!isNaN(numMissing)){
                        discreteMissingToCompare = numMissing;
                    }
                }
                // Bandingkan (setelah potensi konversi numerik)
                // Juga cek perbandingan string untuk menangkap kasus seperti '99' vs 99
                if (valueToCompare === discreteMissingToCompare || String(value) === String(missingVal)) {
                    return true; // User-defined discrete missing
                }
            }
        }

        // 3b. User-defined Range (hanya untuk NUMERIC)
        if (type === 'NUMERIC' && definition.range) {
            const numValue = typeof value === 'number' ? value : parseFloat(value);
            if (!isNaN(numValue)) {
                // Pastikan min/max range adalah angka
                const min = typeof definition.range.min === 'number' ? definition.range.min : parseFloat(definition.range.min);
                const max = typeof definition.range.max === 'number' ? definition.range.max : parseFloat(definition.range.max);
                if (!isNaN(min) && !isNaN(max) && numValue >= min && numValue <= max) {
                    return true; // User-defined range missing
                }
            }
        }

        // Jika lolos semua cek, data tidak missing
        return false;
    };


    for (let i = 0; i < n; i++) {
        const dataValue = data[i];
        const weightValue = weights ? (weights[i] ?? null) : 1;
        const isWeightInvalid = (weightValue === null || weightValue === undefined || typeof weightValue !== 'number' || isNaN(weightValue) || weightValue <= 0);

        // Cek apakah data missing berdasarkan tipe dan definisi
        const isDataMissing = checkIsMissing(dataValue, variableType, missingDefinition);

        if (!isDataMissing && !isWeightInvalid) {
            validRawData.push(dataValue);
             if (validWeights) {
                 validWeights.push(weightValue);
             }
            // Hitung total bobot hanya untuk nilai numerik yang valid
            if (variableType === 'NUMERIC' && typeof dataValue === 'number' && !isNaN(dataValue)) {
                 totalW_numeric += weightValue;
            }
            validN++;
        }
    }

     // Jika tidak ada bobot, totalW sama dengan jumlah nilai numerik valid
     if (!weights && variableType === 'NUMERIC') {
         totalW_numeric = validRawData.reduce((sum, val) => sum + (typeof val === 'number' && !isNaN(val) ? 1 : 0), 0);
     } else if (!weights && variableType !== 'NUMERIC') {
         totalW_numeric = 0; // Tidak relevan jika bukan numerik dan tidak ada bobot
     }

    return { validRawData, validWeights, totalW: totalW_numeric, validN };
}

// --- Fungsi Statistik Utama ---

/**
 * Menghitung jumlah bobot yang valid (W) untuk nilai numerik.
 * Memperhitungkan definisi missing value.
 * @param {Array<any>} data - Array nilai.
 * @param {Array<number|null|undefined>} [weights] - Array bobot (opsional).
 * @param {string} variableType - Tipe variabel.
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number} Jumlah bobot valid untuk nilai numerik.
 */
function getTotalValidWeight(data, weights, variableType, missingDefinition) {
    // Hanya relevan untuk NUMERIC
    if (variableType !== 'NUMERIC') return 0;
    const { totalW } = getValidDataAndWeights(data, weights, variableType, missingDefinition);
    return totalW;
}

/**
 * Menghitung jumlah kasus yang valid (validN) untuk semua tipe data.
 * Memperhitungkan definisi missing value.
 * @param {Array<any>} data - Array nilai.
 * @param {Array<number|null|undefined>} [weights] - Array bobot (opsional).
 * @param {string} variableType - Tipe variabel.
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number} Jumlah kasus valid.
 */
function getValidN(data, weights, variableType, missingDefinition) {
     const { validN } = getValidDataAndWeights(data, weights, variableType, missingDefinition);
     return validN;
}

/**
 * Menghitung jumlah (Sum) dari nilai numerik dengan bobot.
 * Memperhitungkan definisi missing value.
 * @param {Array<any>} data - Array nilai.
 * @param {Array<number|null|undefined>} [weights] - Array bobot (opsional).
 * @param {string} variableType - Tipe variabel (harus 'NUMERIC').
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number} Jumlah nilai numerik dengan bobot.
 */
function calculateSum(data, weights, variableType, missingDefinition) {
    // Fungsi ini hanya valid untuk NUMERIC
    if (variableType !== 'NUMERIC') return 0;
    const { validRawData, validWeights } = getValidDataAndWeights(data, weights, variableType, missingDefinition);
    let sum = 0;
    if (!validWeights) {
        for(const val of validRawData) {
            if(typeof val === 'number' && !isNaN(val)) {
                sum += val;
            }
        }
    } else {
         for(let i = 0; i < validRawData.length; i++) {
            if(typeof validRawData[i] === 'number' && !isNaN(validRawData[i])) {
                sum += validRawData[i] * validWeights[i];
            }
        }
    }
    return sum;
}

/**
 * Menghitung rata-rata (Mean) nilai numerik dengan bobot.
 * Memperhitungkan definisi missing value.
 * @param {Array<any>} data - Array nilai.
 * @param {Array<number|null|undefined>} [weights] - Array bobot (opsional).
 * @param {string} variableType - Tipe variabel (harus 'NUMERIC').
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number|null} Rata-rata, atau null jika tidak dapat dihitung.
 */
function calculateMean(data, weights, variableType, missingDefinition) {
    if (variableType !== 'NUMERIC') return null;
    const { totalW } = getValidDataAndWeights(data, weights, variableType, missingDefinition);
    if (totalW === 0) return null;
    const sum = calculateSum(data, weights, variableType, missingDefinition);
    return sum / totalW;
}

/**
 * Helper: Menghitung momen pusat ke-r untuk nilai numerik.
 * @param {Array<any>} validRawData - Array data valid.
 * @param {Array<number>|null} validWeights - Array bobot valid atau null.
 * @param {number} r - Orde momen (mis., 2, 3, 4).
 * @param {number} mean - Rata-rata numerik yang telah dihitung.
 * @returns {number|null} Momen pusat ke-r, atau null jika tidak dapat dihitung.
 */
function calculateCentralMoment(validRawData, validWeights, r, mean) {
    if (mean === null) return null;
    let moment = 0;
    let numericCount = 0;

    if (!validWeights) {
        for (const val of validRawData) {
            if (typeof val === 'number' && !isNaN(val)) {
                moment += Math.pow(val - mean, r);
                numericCount++;
            }
        }
    } else {
        for (let i = 0; i < validRawData.length; i++) {
             if (typeof validRawData[i] === 'number' && !isNaN(validRawData[i])) {
                moment += validWeights[i] * Math.pow(validRawData[i] - mean, r);
                numericCount++;
            }
        }
    }
    return numericCount > 0 ? moment : null;
}

/**
 * Menghitung varians untuk nilai numerik.
 * Memperhitungkan definisi missing value.
 * @param {Array<any>} data - Array nilai.
 * @param {Array<number|null|undefined>} [weights] - Array bobot (opsional).
 * @param {string} variableType - Tipe variabel (harus 'NUMERIC').
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number|null} Varians, atau null jika tidak dapat dihitung.
 */
function calculateVariance(data, weights, variableType, missingDefinition) {
    if (variableType !== 'NUMERIC') return null;
    const { validRawData, validWeights, totalW } = getValidDataAndWeights(data, weights, variableType, missingDefinition);
    if (totalW <= 1) return null;
    const mean = calculateMean(data, weights, variableType, missingDefinition);
    if (mean === null) return null;

    const M2 = calculateCentralMoment(validRawData, validWeights, 2, mean);
    if (M2 === null) return null;

    return M2 / (totalW - 1);
}

/**
 * Menghitung simpangan baku (Standard Deviation) untuk nilai numerik.
 * Memperhitungkan definisi missing value.
 * @param {Array<any>} data - Array nilai.
 * @param {Array<number|null|undefined>} [weights] - Array bobot (opsional).
 * @param {string} variableType - Tipe variabel (harus 'NUMERIC').
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number|null} Simpangan baku, atau null jika tidak dapat dihitung.
 */
function calculateStdDev(data, weights, variableType, missingDefinition) {
    if (variableType !== 'NUMERIC') return null;
    const variance = calculateVariance(data, weights, variableType, missingDefinition);
    return variance === null || variance < 0 ? null : Math.sqrt(variance);
}

/**
 * Menghitung nilai minimum (hanya untuk angka, setelah filter missing).
 * @param {Array<any>} data - Array nilai.
 * @param {string} variableType - Tipe variabel (harus 'NUMERIC').
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number|null} Nilai minimum numerik, atau null jika tidak ada.
 */
function calculateMin(data, variableType, missingDefinition) {
    if (variableType !== 'NUMERIC') return null;
    const { validRawData } = getValidDataAndWeights(data, null, variableType, missingDefinition);
    let min = null;
    for (const val of validRawData) {
      if (typeof val === 'number' && !isNaN(val)) {
        if (min === null || val < min) {
          min = val;
        }
      }
    }
    return min;
}

/**
 * Menghitung nilai maksimum (hanya untuk angka, setelah filter missing).
 * @param {Array<any>} data - Array nilai.
 * @param {string} variableType - Tipe variabel (harus 'NUMERIC').
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number|null} Nilai maksimum numerik, atau null jika tidak ada.
 */
function calculateMax(data, variableType, missingDefinition) {
    if (variableType !== 'NUMERIC') return null;
    const { validRawData } = getValidDataAndWeights(data, null, variableType, missingDefinition);
    let max = null;
    for (const val of validRawData) {
       if (typeof val === 'number' && !isNaN(val)) {
        if (max === null || val > max) {
          max = val;
        }
      }
    }
    return max;
}

/**
 * Menghitung jangkauan (Range) untuk nilai numerik.
 * Memperhitungkan definisi missing value.
 * @param {Array<any>} data - Array nilai.
 * @param {string} variableType - Tipe variabel (harus 'NUMERIC').
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number|null} Jangkauan, atau null jika min/max tidak dapat dihitung.
 */
function calculateRange(data, variableType, missingDefinition) {
    if (variableType !== 'NUMERIC') return null;
    const min = calculateMin(data, variableType, missingDefinition);
    const max = calculateMax(data, variableType, missingDefinition);
    return min === null || max === null ? null : max - min;
}

/**
 * Menghitung kesalahan baku rata-rata (Standard Error of Mean).
 * Memperhitungkan definisi missing value.
 * @param {Array<any>} data - Array nilai.
 * @param {Array<number|null|undefined>} [weights] - Array bobot (opsional).
 * @param {string} variableType - Tipe variabel (harus 'NUMERIC').
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number|null} Kesalahan baku rata-rata, atau null jika tidak dapat dihitung.
 */
function calculateSEMean(data, weights, variableType, missingDefinition) {
    if (variableType !== 'NUMERIC') return null;
    const { totalW } = getValidDataAndWeights(data, weights, variableType, missingDefinition);
    if (totalW <= 0) return null;
    const stdDev = calculateStdDev(data, weights, variableType, missingDefinition);
    return stdDev === null ? null : stdDev / Math.sqrt(totalW);
}

/**
 * Menghitung Skewness (Kemiringan) untuk nilai numerik.
 * Menggunakan formula berbasis Momen Pusat ke-3 dari PDF.
 * Memperhitungkan definisi missing value.
 * @param {Array<any>} data - Array nilai.
 * @param {Array<number|null|undefined>} [weights] - Array bobot (opsional).
 * @param {string} variableType - Tipe variabel (harus 'NUMERIC').
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number|null} Skewness, atau null jika tidak dapat dihitung.
 */
function calculateSkewness(data, weights, variableType, missingDefinition) {
    if (variableType !== 'NUMERIC') return null;
    const { validRawData, validWeights, totalW } = getValidDataAndWeights(data, weights, variableType, missingDefinition);
    const W = totalW;
    if (W < 3) return null;

    const mean = calculateMean(data, weights, variableType, missingDefinition);
    const stdDev = calculateStdDev(data, weights, variableType, missingDefinition);

    if (mean === null || stdDev === null || stdDev <= 1e-15) return null;

    const M3 = calculateCentralMoment(validRawData, validWeights, 3, mean);
    if (M3 === null) return null;

    const denominator = (W - 1) * (W - 2) * Math.pow(stdDev, 3);
    if (Math.abs(denominator) < 1e-15) return null;

    return (W * M3) / denominator;
}

/**
 * Menghitung kesalahan baku Skewness (Standard Error of Skewness).
 * Memperhitungkan definisi missing value (melalui totalW).
 * @param {Array<any>} data - Array nilai.
 * @param {Array<number|null|undefined>} [weights] - Array bobot (opsional).
 * @param {string} variableType - Tipe variabel.
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number|null} Kesalahan baku skewness, atau null jika tidak dapat dihitung.
 */
function calculateSESkewness(data, weights, variableType, missingDefinition) {
    // Perhitungan SESkewness hanya bergantung pada W (total bobot valid)
    const { totalW } = getValidDataAndWeights(data, weights, variableType, missingDefinition);
    const W = totalW;
    if (W < 3) return null;

    const numerator = 6 * W * (W - 1);
    const denominator = (W - 2) * (W + 1) * (W + 3);

    if (denominator <= 1e-15) return null;

    const varianceSkew = numerator / denominator;
    return varianceSkew < 0 ? null : Math.sqrt(varianceSkew);
}

/**
 * Menghitung Kurtosis untuk nilai numerik.
 * Menggunakan formula berbasis Momen Pusat ke-4 dari PDF.
 * Memperhitungkan definisi missing value.
 * @param {Array<any>} data - Array nilai.
 * @param {Array<number|null|undefined>} [weights] - Array bobot (opsional).
 * @param {string} variableType - Tipe variabel (harus 'NUMERIC').
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number|null} Kurtosis, atau null jika tidak dapat dihitung.
 */
function calculateKurtosis(data, weights, variableType, missingDefinition) {
    if (variableType !== 'NUMERIC') return null;
    const { validRawData, validWeights, totalW } = getValidDataAndWeights(data, weights, variableType, missingDefinition);
    const W = totalW;
    if (W < 4) return null;

    const mean = calculateMean(data, weights, variableType, missingDefinition);
    const variance = calculateVariance(data, weights, variableType, missingDefinition);
    const stdDev = variance === null || variance < 0 ? null : Math.sqrt(variance);

    if (mean === null || stdDev === null || stdDev <= 1e-15) return null;

    const M4 = calculateCentralMoment(validRawData, validWeights, 4, mean);
     if (M4 === null) return null;

    const term1_num = W * (W + 1) * M4;
    const term1_den = (W - 1) * (W - 2) * (W - 3) * Math.pow(stdDev, 4);
    const term2_num = 3 * Math.pow(W - 1, 2);
    const term2_den = (W - 2) * (W - 3);

    if (Math.abs(term1_den) < 1e-15 || term2_den === 0) {
        return null;
    }

    const term1 = term1_num / term1_den;
    const term2 = term2_num / term2_den;

    return term1 - term2;
}

/**
 * Menghitung kesalahan baku Kurtosis (Standard Error of Kurtosis).
 * Memperhitungkan definisi missing value (melalui totalW).
 * @param {Array<any>} data - Array nilai.
 * @param {Array<number|null|undefined>} [weights] - Array bobot (opsional).
 * @param {string} variableType - Tipe variabel.
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number|null} Kesalahan baku kurtosis, atau null jika tidak dapat dihitung.
 */
function calculateSEKurtosis(data, weights, variableType, missingDefinition) {
    // Perhitungan SEKurtosis hanya bergantung pada W (total bobot valid)
    const { totalW } = getValidDataAndWeights(data, weights, variableType, missingDefinition);
    const W = totalW;
    if (W < 4) return null;

    const numerator = 24 * W * Math.pow(W - 1, 2);
    const denominator = (W - 3) * (W - 2) * (W + 3) * (W + 5);

    if (denominator <= 1e-15) return null;

    const varianceKurt = numerator / denominator;
    return varianceKurt < 0 ? null : Math.sqrt(varianceKurt);
}

/**
 * Menghitung modus (Mode) untuk semua tipe data valid (angka, string).
 * Termasuk string format tanggal "dd-mmm-yyyy".
 * Memperhitungkan definisi missing value.
 * @param {Array<any>} data - Array nilai.
 * @param {Array<number|null|undefined>} [weights] - Array bobot (opsional).
 * @param {string} variableType - Tipe variabel.
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number|string|null} Modus (nilai terkecil jika ada multiple mode), atau null jika tidak ada data/mode.
 */
function calculateMode(data, weights, variableType, missingDefinition) {
    // Gunakan data yang sudah difilter missing
    const { validRawData, validWeights, validN } = getValidDataAndWeights(data, weights, variableType, missingDefinition);
    if (validN === 0) return null;

    const frequencyMap = new Map();
    let maxFrequency = 0;
    const modes = [];

    if (!validWeights) {
        for (const val of validRawData) {
            const key = typeof val === 'number' && isNaN(val) ? 'NaN' : val; // Handle NaN numbers as key
            const currentFreq = (frequencyMap.get(key) || 0) + 1;
            frequencyMap.set(key, currentFreq);

            if (currentFreq > maxFrequency) {
                maxFrequency = currentFreq;
                modes.length = 0;
                modes.push(val);
            } else if (Math.abs(currentFreq - maxFrequency) < 1e-9 && !modes.some(m => m === val)) {
                modes.push(val);
            }
        }
    } else {
        for (let i = 0; i < validRawData.length; i++) {
            const val = validRawData[i];
            const weightValue = validWeights[i];
            const key = typeof val === 'number' && isNaN(val) ? 'NaN' : val;
            const currentFreq = (frequencyMap.get(key) || 0) + weightValue;
            frequencyMap.set(key, currentFreq);

             if (currentFreq > maxFrequency) {
                maxFrequency = currentFreq;
                modes.length = 0;
                modes.push(val);
            } else if (Math.abs(currentFreq - maxFrequency) < 1e-9 && !modes.some(m => m === val)) {
                modes.push(val);
            }
        }
    }

    if (modes.length === 0 || maxFrequency <= 1e-9) return null;
    if (modes.length === frequencyMap.size && modes.length > 1) return null; // No mode if all unique frequencies

    // Urutkan untuk mendapatkan yang terkecil jika ada multiple modes
    modes.sort((a, b) => {
        // Coba urutkan sebagai angka jika memungkinkan
        const numA = Number(a);
        const numB = Number(b);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        // Fallback ke string comparison
        const stringA = String(a);
        const stringB = String(b);
        if (stringA < stringB) return -1;
        if (stringA > stringB) return 1;
        return 0;
    });

    return modes[0];
}

/**
 * Menghitung persentil untuk nilai numerik menggunakan metode HAVERAGE.
 * Memperhitungkan definisi missing value.
 * @param {Array<any>} data - Array nilai.
 * @param {Array<number|null|undefined>} [weights] - Array bobot (opsional).
 * @param {number} p - Persentil yang diinginkan (0 hingga 1).
 * @param {string} variableType - Tipe variabel (harus 'NUMERIC' atau 'DATE' - DATE diperlakukan numerik di sini).
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number|null} Nilai persentil, atau null jika tidak dapat dihitung.
 */
function calculatePercentile(data, weights, p, variableType, missingDefinition) {
    if (p < 0 || p > 1) return null;
    // Hanya relevan untuk tipe yang dianggap numerik (NUMERIC, DATE)
    if (variableType !== 'NUMERIC' && variableType !== 'DATE') return null;

    // Gunakan data yang sudah difilter missing
    const { validRawData, validWeights, totalW } = getValidDataAndWeights(data, weights, variableType, missingDefinition);
    // Untuk persentil, W adalah total bobot dari nilai numerik yang valid
    const W = totalW;
    if (W <= 0) return null;

    const items = [];
    for (let i = 0; i < validRawData.length; i++) {
        const val = validRawData[i];
        if (typeof val === 'number' && !isNaN(val)) {
            items.push({ value: val, weight: validWeights ? validWeights[i] : 1 });
        }
    }

    if (items.length === 0) return null;

    items.sort((a, b) => a.value - b.value);

    if (p === 0) return items[0].value;
    if (p === 1) return items[items.length - 1].value;

    // Target Cumulative Weight (TCW) menggunakan formula HAVERAGE (W+1)p
    const targetCumulativeWeight = (W + 1) * p;
    let cumulativeWeight = 0;
    let targetIndex = -1;

    // Cari indeks di mana TCW jatuh
    for (let i = 0; i < items.length; i++) {
        const currentItemCumulative = cumulativeWeight + items[i].weight;
        // Jika TCW jatuh sebelum atau tepat di akhir bobot item ini
        if (targetCumulativeWeight <= currentItemCumulative + 1e-9) { // Gunakan epsilon
            targetIndex = i;
            break;
        }
        cumulativeWeight = currentItemCumulative;
    }

     // Handle jika TCW sedikit melebihi total W karena floating point atau p=1
    if (targetIndex === -1) {
         return items[items.length - 1].value;
    }

    // Hitung bobot kumulatif *sebelum* targetIndex
    let cumulativeWeightBefore = 0;
    for(let i = 0; i < targetIndex; i++) {
        cumulativeWeightBefore += items[i].weight;
    }

    const value1 = items[targetIndex].value;
    let value2 = value1; // Default jika item terakhir
    if (targetIndex + 1 < items.length) {
        value2 = items[targetIndex + 1].value;
    }

    // Jika TCW tepat sama dengan bobot kumulatif sebelum item saat ini, gunakan nilai item sebelumnya
    if (Math.abs(targetCumulativeWeight - cumulativeWeightBefore) < 1e-9 && targetIndex > 0) {
       // Ini berarti p menunjuk tepat ke batas *atas* item sebelumnya
       // Tergantung definisi SPSS, mungkin perlu nilai item sebelumnya atau saat ini.
       // Menggunakan nilai item saat ini (value1) umumnya lebih konsisten dengan interpolasi
       return value1; // Atau items[targetIndex-1].value tergantung konvensi
    }

    const currentItemWeight = items[targetIndex].weight;
    let interpolationFactor = 0;

    if (currentItemWeight > 1e-9) {
        // Posisi relatif di dalam rentang bobot item saat ini
        interpolationFactor = (targetCumulativeWeight - cumulativeWeightBefore) / currentItemWeight;
        interpolationFactor = Math.max(0, Math.min(1, interpolationFactor)); // Clamp
    } else if (targetCumulativeWeight > cumulativeWeightBefore + 1e-9) {
        // Jika bobot item 0 tapi target > cumW sebelumnya, artinya kita harus di item berikutnya
        interpolationFactor = 1;
    }

    // Interpolasi linier
    return value1 + interpolationFactor * (value2 - value1);
}

/**
 * Menghitung median (persentil ke-50) untuk nilai numerik.
 * Memperhitungkan definisi missing value.
 * @param {Array<any>} data - Array nilai.
 * @param {Array<number|null|undefined>} [weights] - Array bobot (opsional).
 * @param {string} variableType - Tipe variabel (harus 'NUMERIC' atau 'DATE').
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number|null} Median, atau null jika tidak dapat dihitung.
 */
function calculateMedian(data, weights, variableType, missingDefinition) {
    return calculatePercentile(data, weights, 0.5, variableType, missingDefinition);
}