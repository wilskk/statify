// /path/to/comprehensiveDescriptiveStats.js
// Kumpulan fungsi untuk menghitung statistik deskriptif dasar.
// Menangani data numerik, string, dan bobot opsional.
// Fungsi numerik (Mean, Median, StdDev, dll.) hanya memproses angka dan mengabaikan tipe lain.
// Mode dapat menangani angka dan string (termasuk format tanggal 'dd-mmm-yyyy').
// Objek Date JavaScript harus dipra-proses menjadi numerik (misal, timestamp atau durasi)
// SEBELUM digunakan dengan fungsi statistik numerik.

/**
 * Filter data berdasarkan missing values & bobot tidak valid.
 * Mempertimbangkan missing user-defined (discrete & range).
 * Hitung validN & total bobot untuk data numerik (totalW).
 * @param {Array<any>} data - Array data input.
 * @param {Array<number|null|undefined>} [weights] - Array bobot opsional.
 * @param {string} variableType - Tipe variabel ('NUMERIC', 'STRING', 'DATE').
 * @param {object|null|undefined} missingDefinition - Definisi missing value.
 * @returns {{validRawData: Array<any>, validWeights: Array<number>|null, totalW: number, validN: number}}
 * totalW: Jumlah bobot untuk data numerik valid.
 * validN: Jumlah total entri data valid.
 */
function getValidDataAndWeights(data, weights, variableType, missingDefinition) {
    const validRawData = [];
    const validWeights = weights ? [] : null;
    let totalW_numeric = 0;
    let validN = 0;
    const n = data ? data.length : 0;

    // Helper: Cek apakah nilai dianggap missing.
    const checkIsMissing = (value, type, definition) => {
        // Cek system missing: string kosong untuk NUMERIC/DATE.
        if (value === "") {
            if (type === 'NUMERIC' || type === 'DATE') {
                return true;
            }
            // String kosong adalah valid untuk tipe STRING.
            return false;
        }

        // Cek null/undefined (dianggap system missing).
        if (value === null || value === undefined) {
            return true;
        }

        // Cek user-defined missing.
        if (!definition) {
            // Tidak ada definisi missing, maka tidak user-defined missing.
            return false;
        }

        // User-defined Discrete.
        if (definition.discrete && Array.isArray(definition.discrete)) {
            let valueToCompare = value;
            // Konversi `value` ke number jika tipe NUMERIC, untuk perbandingan.
            if (type === 'NUMERIC' && typeof value !== 'number') {
                const numVal = parseFloat(value);
                if (!isNaN(numVal)) {
                    valueToCompare = numVal;
                }
            }

            for (const missingVal of definition.discrete) {
                let discreteMissingToCompare = missingVal;
                // Konversi `missingVal` diskrit ke number jika tipe NUMERIC & `missingVal` adalah string.
                if (type === 'NUMERIC' && typeof missingVal === 'string'){
                    const numMissing = parseFloat(missingVal);
                    if(!isNaN(numMissing)){
                        discreteMissingToCompare = numMissing;
                    }
                }
                // Bandingkan (setelah konversi numerik jika ada). Cek juga perbandingan string.
                if (valueToCompare === discreteMissingToCompare || String(value) === String(missingVal)) {
                    return true; // User-defined discrete missing.
                }
            }
        }

        // User-defined Range (untuk NUMERIC atau DATE).
        if ((type === 'NUMERIC' || type === 'DATE') && definition.range) {
            let numValue;
            if (type === 'DATE') {
                // Untuk DATE, konversi `value` string ke SPSS seconds.
                // `dateStringToSpssSeconds` return null jika invalid.
                if (typeof value === 'string' && typeof dateStringToSpssSeconds === 'function') {
                    numValue = dateStringToSpssSeconds(value);
                } else {
                    // `value` tidak bisa dikonversi atau fungsi tidak ada.
                    numValue = null;
                }
            } else { // NUMERIC
                // Untuk NUMERIC, parse jika string, atau gunakan langsung jika number.
                numValue = typeof value === 'number' ? value : parseFloat(value);
            }

            // Lanjut jika `numValue` adalah angka valid (setelah konversi DATE/parse NUMERIC).
            if (numValue !== null && !isNaN(numValue)) {
                // Pastikan min/max range adalah angka valid.
                const min = typeof definition.range.min === 'number' ? definition.range.min : parseFloat(definition.range.min);
                const max = typeof definition.range.max === 'number' ? definition.range.max : parseFloat(definition.range.max);
                
                if (!isNaN(min) && !isNaN(max) && numValue >= min && numValue <= max) {
                    return true; // User-defined range missing.
                }
            }
        }
        // Bukan missing jika lolos semua cek.
        return false;
    };

    // Helper: Cek apakah nilai bisa dikonversi ke numerik (angka valid atau string tanggal valid).
    const isNumericallyConvertible = (value, type) => {
        if (type === 'NUMERIC') {
            if (typeof value === 'number' && !isNaN(value)) return true;
            if (typeof value === 'string') {
                const numVal = parseFloat(value);
                // String angka dianggap valid jika bisa di-parse & bukan string kosong.
                return !isNaN(numVal);
            }
            return false;
        }
        if (type === 'DATE') {
            // Untuk DATE, gunakan `dateStringToSpssSeconds` untuk cek validitas format & tanggal.
            if (typeof dateStringToSpssSeconds === 'function') {
                 return dateStringToSpssSeconds(value) !== null;
            } else {
                // Fallback: cek format dasar jika `dateStringToSpssSeconds` tidak ada.
                return typeof value === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(value);
            }
        }
        // Tipe lain tidak dianggap numerik.
        return false;
    };

    for (let i = 0; i < n; i++) {
        const dataValue = data[i];
        const weightValue = weights ? (weights[i] ?? null) : 1;
        const isWeightInvalid = (weightValue === null || weightValue === undefined || typeof weightValue !== 'number' || isNaN(weightValue) || weightValue <= 0);

        // Cek apakah data missing.
        const isDataMissing = checkIsMissing(dataValue, variableType, missingDefinition);

        if (!isDataMissing && !isWeightInvalid) {
            validRawData.push(dataValue);
             if (validWeights) {
                 validWeights.push(weightValue);
             }
            validN++;

            // Akumulasi total bobot jika nilai valid & numerik/konvertibel.
            if (isNumericallyConvertible(dataValue, variableType)) {
                 totalW_numeric += weightValue;
            }
        }
    }

     // Jika tidak ada bobot (unweighted), hitung ulang `totalW` sebagai jumlah item numerik valid.
     if (!weights) {
         totalW_numeric = 0;
         for(const val of validRawData) {
            // Tambah 1 untuk tiap item numerik/konvertibel valid.
            if (isNumericallyConvertible(val, variableType)) {
                totalW_numeric += 1;
            }
         }
     }

    return { validRawData, validWeights, totalW: totalW_numeric, validN };
}

// --- Fungsi Statistik Utama ---

/**
 * Hitung total bobot valid (W) untuk nilai numerik.
 * Mempertimbangkan missing values.
 * @param {Array<any>} data - Array nilai.
 * @param {Array<number|null|undefined>} [weights] - Array bobot opsional.
 * @param {string} variableType - Tipe variabel.
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number} Total bobot valid untuk nilai numerik.
 */
function getTotalValidWeight(data, weights, variableType, missingDefinition) {
    // Hanya untuk tipe NUMERIC.
    if (variableType !== 'NUMERIC') return 0;
    const { totalW } = getValidDataAndWeights(data, weights, variableType, missingDefinition);
    return totalW;
}

/**
 * Hitung jumlah kasus valid (validN) untuk semua tipe data.
 * Mempertimbangkan missing values.
 * @param {Array<any>} data - Array nilai.
 * @param {Array<number|null|undefined>} [weights] - Array bobot opsional.
 * @param {string} variableType - Tipe variabel.
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number} Jumlah kasus valid.
 */
function getValidN(data, weights, variableType, missingDefinition) {
     const { validN } = getValidDataAndWeights(data, weights, variableType, missingDefinition);
     return validN;
}

/**
 * Hitung Sum dari nilai numerik, dengan bobot.
 * Fungsi ini mengasumsikan input sudah valid dan numerik.
 * @param {Array<number>} validNumericData - Array data numerik valid.
 * @param {Array<number>|null} validWeights - Array bobot valid atau null.
 * @returns {number} Sum nilai numerik terbobot.
 */
function calculateSum(validNumericData, validWeights) {
    let sum = 0;
    if (!validWeights) {
        for(const val of validNumericData) {
            // Pastikan nilai adalah number valid sebelum kalkulasi.
            if(typeof val === 'number' && !isNaN(val)) {
                sum += val;
            }
        }
    } else {
         for(let i = 0; i < validNumericData.length; i++) {
            // Pastikan nilai adalah number valid sebelum kalkulasi.
            if(typeof validNumericData[i] === 'number' && !isNaN(validNumericData[i])) {
                sum += validNumericData[i] * validWeights[i];
            }
        }
    }
    return sum;
}

/**
 * Hitung Mean nilai numerik terbobot.
 * Membutuhkan data numerik & bobot valid, dan total bobot valid (totalW).
 * @param {Array<number>} validNumericData - Array data numerik valid.
 * @param {Array<number>|null} validWeights - Array bobot valid yang sesuai.
 * @param {number} totalW - Total bobot valid untuk data numerik ini.
 * @returns {number|null} Mean, atau null jika tidak bisa dihitung.
 */
function calculateMean(validNumericData, validWeights, totalW) {
    if (totalW === 0) return null;
    // Hitung Sum dari data valid.
    let sum = 0;
    if (!validWeights) {
        for(const val of validNumericData) {
            // Pastikan nilai adalah number valid.
            if(typeof val === 'number' && !isNaN(val)) sum += val;
        }
    } else {
         for(let i = 0; i < validNumericData.length; i++) {
            // Pastikan nilai adalah number valid.
             if(typeof validNumericData[i] === 'number' && !isNaN(validNumericData[i])) {
                 sum += validNumericData[i] * validWeights[i];
             }
         }
    }
    return sum / totalW;
}

/**
 * Helper: Hitung momen pusat ke-r untuk nilai numerik.
 * Membutuhkan data numerik & bobot valid, dan mean.
 * @param {Array<number>} validNumericData - Array data numerik valid.
 * @param {Array<number>|null} validWeights - Array bobot valid atau null.
 * @param {number} r - Orde momen (e.g., 2, 3, 4).
 * @param {number} mean - Mean numerik yang sudah dihitung.
 * @returns {number|null} Momen pusat ke-r, atau null jika tidak bisa dihitung.
 */
function calculateCentralMoment(validNumericData, validWeights, r, mean) {
    if (mean === null) return null;
    let moment = 0;
    // Jumlah item numerik valid yang diproses.
    let numericCount = 0;

    if (!validWeights) {
        for (const val of validNumericData) {
            // Pastikan nilai adalah number valid.
            if (typeof val === 'number' && !isNaN(val)) {
                moment += Math.pow(val - mean, r);
                numericCount++;
            }
        }
    } else {
        for (let i = 0; i < validNumericData.length; i++) {
            // Pastikan nilai adalah number valid.
             if (typeof validNumericData[i] === 'number' && !isNaN(validNumericData[i])) {
                moment += validWeights[i] * Math.pow(validNumericData[i] - mean, r);
                numericCount++;
            }
        }
    }
    // Return null jika tidak ada data numerik valid diproses.
    return numericCount > 0 ? moment : null;
}

/**
 * Hitung Variance nilai numerik.
 * Membutuhkan data numerik & bobot valid, total bobot valid, dan mean.
 * @param {Array<number>} validNumericData - Array data numerik valid.
 * @param {Array<number>|null} validWeights - Array bobot valid.
 * @param {number} totalW - Total bobot valid.
 * @param {number} mean - Mean yang sudah dihitung.
 * @returns {number|null} Variance, atau null jika tidak bisa dihitung.
 */
function calculateVariance(validNumericData, validWeights, totalW, mean) {
    if (totalW <= 1 || mean === null) return null;

    const M2 = calculateCentralMoment(validNumericData, validWeights, 2, mean);
    if (M2 === null) return null;

    // Hindari pembagian dengan nol atau nilai sangat kecil.
    const denominator = totalW - 1;
    return denominator > 1e-15 ? (M2 / denominator) : null;
}

/**
 * Hitung Standard Deviation (simpangan baku) nilai numerik.
 * Membutuhkan variance yang sudah dihitung.
 * @param {number|null} variance - Variance yang sudah dihitung.
 * @returns {number|null} Standard deviation, atau null jika tidak bisa dihitung.
 */
function calculateStdDev(variance) {
    return variance === null || variance < 0 ? null : Math.sqrt(variance);
}

/**
 * Hitung nilai Minimum (hanya untuk angka).
 * Membutuhkan data numerik valid.
 * @param {Array<number>} validNumericData - Array data numerik valid.
 * @returns {number|null} Nilai minimum numerik, atau null jika tidak ada.
 */
function calculateMin(validNumericData) {
    let min = null;
    for (const val of validNumericData) {
      // Pastikan nilai adalah number valid.
      if (typeof val === 'number' && !isNaN(val)) {
        if (min === null || val < min) {
          min = val;
        }
      }
    }
    return min;
}

/**
 * Hitung nilai Maximum (hanya untuk angka).
 * Membutuhkan data numerik valid.
 * @param {Array<number>} validNumericData - Array data numerik valid.
 * @returns {number|null} Nilai maksimum numerik, atau null jika tidak ada.
 */
function calculateMax(validNumericData) {
    let max = null;
    for (const val of validNumericData) {
       // Pastikan nilai adalah number valid.
       if (typeof val === 'number' && !isNaN(val)) {
        if (max === null || val > max) {
          max = val;
        }
      }
    }
    return max;
}

/**
 * Hitung Range (jangkauan) untuk nilai numerik.
 * Membutuhkan nilai min & max yang sudah dihitung.
 * @param {number|null} min - Nilai minimum.
 * @param {number|null} max - Nilai maksimum.
 * @returns {number|null} Range, atau null jika min/max tidak bisa dihitung.
 */
function calculateRange(min, max) {
    return min === null || max === null ? null : max - min;
}

/**
 * Hitung Standard Error of Mean (kesalahan baku rata-rata).
 * Membutuhkan standard deviation dan total bobot valid.
 * @param {number|null} stdDev - Standard deviation yang sudah dihitung.
 * @param {number} totalW - Total bobot valid.
 * @returns {number|null} Standard error of mean, atau null jika tidak bisa dihitung.
 */
function calculateSEMean(stdDev, totalW) {
    if (totalW <= 0 || stdDev === null) return null;
    const sqrtW = Math.sqrt(totalW);
    return sqrtW > 1e-15 ? (stdDev / sqrtW) : null;
}

/**
 * Hitung Skewness (kemiringan) nilai numerik.
 * Membutuhkan data numerik & bobot valid, total bobot, mean, dan stdDev.
 * @param {Array<number>} validNumericData - Array data numerik valid.
 * @param {Array<number>|null} validWeights - Array bobot valid.
 * @param {number} totalW - Total bobot valid.
 * @param {number} mean - Mean yang sudah dihitung.
 * @param {number} stdDev - Standard deviation yang sudah dihitung.
 * @returns {number|null} Skewness, atau null jika tidak bisa dihitung.
 */
function calculateSkewness(validNumericData, validWeights, totalW, mean, stdDev) {
    const W = totalW;
    if (W < 3 || mean === null || stdDev === null || stdDev <= 1e-15) return null;

    const M3 = calculateCentralMoment(validNumericData, validWeights, 3, mean);
    if (M3 === null) return null;

    const denominator = (W - 1) * (W - 2) * Math.pow(stdDev, 3);
    if (Math.abs(denominator) < 1e-15) return null;

    return (W * M3) / denominator;
}

/**
 * Hitung Standard Error of Skewness.
 * Membutuhkan total bobot valid.
 * @param {number} totalW - Total bobot valid.
 * @returns {number|null} Standard error of skewness, atau null jika tidak bisa dihitung.
 */
function calculateSESkewness(totalW) {
    const W = totalW;
    if (W < 3) return null;

    const numerator = 6 * W * (W - 1);
    const denominator = (W - 2) * (W + 1) * (W + 3);

    if (denominator <= 1e-15) return null;

    const varianceSkew = numerator / denominator;
    return varianceSkew < 0 ? null : Math.sqrt(varianceSkew);
}

/**
 * Hitung Kurtosis nilai numerik.
 * Membutuhkan data numerik & bobot valid, total bobot, mean, dan stdDev.
 * @param {Array<number>} validNumericData - Array data numerik valid.
 * @param {Array<number>|null} validWeights - Array bobot valid.
 * @param {number} totalW - Total bobot valid.
 * @param {number} mean - Mean yang sudah dihitung.
 * @param {number} stdDev - Standard deviation yang sudah dihitung.
 * @returns {number|null} Kurtosis, atau null jika tidak bisa dihitung.
 */
function calculateKurtosis(validNumericData, validWeights, totalW, mean, stdDev) {
    const W = totalW;
    if (W < 4 || mean === null || stdDev === null || stdDev <= 1e-15) return null;

    const M4 = calculateCentralMoment(validNumericData, validWeights, 4, mean);
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
 * Hitung Standard Error of Kurtosis.
 * Membutuhkan total bobot valid.
 * @param {number} totalW - Total bobot valid.
 * @returns {number|null} Standard error of kurtosis, atau null jika tidak bisa dihitung.
 */
function calculateSEKurtosis(totalW) {
    const W = totalW;
    if (W < 4) return null;

    const numerator = 24 * W * Math.pow(W - 1, 2);
    const denominator = (W - 3) * (W - 2) * (W + 3) * (W + 5);

    if (denominator <= 1e-15) return null;

    const varianceKurt = numerator / denominator;
    return varianceKurt < 0 ? null : Math.sqrt(varianceKurt);
}

/**
 * Helper: Cari nilai data pada rank tertentu dalam data terurut & terbobot.
 * @param {number} targetRank - Rank (1-based) yang dicari nilainya.
 * @param {Array<{value: number, weight: number}>} sortedItems - Array objek {value, weight}, terurut berdasarkan value.
 * @param {number} totalW - Total bobot W.
 * @returns {number} Nilai data pada targetRank.
 */
function findValueAtRank(targetRank, sortedItems, totalW) {
    // Handle rank < 1: return nilai terkecil.
    if (targetRank < 1) {
        return sortedItems[0].value;
    }
    // Handle rank >= totalW: return nilai terbesar (gunakan epsilon untuk float comparison).
    if (targetRank >= totalW - 1e-9) {
        return sortedItems[sortedItems.length - 1].value;
    }

    let cumulativeWeight = 0;
    for (let k = 0; k < sortedItems.length; k++) {
        cumulativeWeight += sortedItems[k].weight;
        // Jika target rank masuk dalam cumulative weight item ini.
        if (targetRank <= cumulativeWeight + 1e-9) {
            return sortedItems[k].value;
        }
    }

    // Fallback (seharusnya tidak tercapai jika targetRank < totalW): return nilai terbesar.
    return sortedItems[sortedItems.length - 1].value;
}

/**
 * Hitung Mode untuk semua tipe data valid (angka, string).
 * Termasuk string tanggal format "dd-mmm-yyyy".
 * Mempertimbangkan missing values.
 * @param {Array<any>} data - Array nilai.
 * @param {Array<number|null|undefined>} [weights] - Array bobot opsional.
 * @param {string} variableType - Tipe variabel.
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number|string|null} Mode (nilai terkecil jika ada multiple mode), atau null jika tidak ada data/mode.
 */
function calculateMode(data, weights, variableType, missingDefinition) {
    // Gunakan data yang sudah difilter dari missing values.
    const { validRawData, validWeights, validN } = getValidDataAndWeights(data, weights, variableType, missingDefinition);
    if (validN === 0) return null;

    const frequencyMap = new Map();
    let maxFrequency = 0;
    const modes = [];

    if (!validWeights) {
        for (const val of validRawData) {
            // Handle NaN sebagai key map.
            const key = typeof val === 'number' && isNaN(val) ? 'NaN' : val;
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
            // Handle NaN sebagai key map.
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
    // Jika semua nilai unik punya frekuensi sama (tidak ada mode unik).
    if (modes.length === frequencyMap.size && modes.length > 1) {
        // Urutkan untuk dapat nilai terkecil.
        modes.sort((a, b) => {
            const numA = Number(a);
            const numB = Number(b);
            if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
            }
            const stringA = String(a);
            const stringB = String(b);
            if (stringA < stringB) return -1;
            if (stringA > stringB) return 1;
            return 0;
        });
        // Return nilai terkecil + '*' (pastikan string).
        return String(modes[0]) + '*';
    }

    // Urutkan untuk dapat nilai terkecil jika ada multiple modes.
    modes.sort((a, b) => {
        // Urutkan sebagai angka jika bisa.
        const numA = Number(a);
        const numB = Number(b);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        // Fallback ke perbandingan string.
        const stringA = String(a);
        const stringB = String(b);
        if (stringA < stringB) return -1;
        if (stringA > stringB) return 1;
        return 0;
    });

    return modes[0];
}

/**
 * Hitung Persentil nilai numerik (metode WAVERAGE).
 * Fungsi ini mengasumsikan input (data & bobot) sudah valid dan numerik.
 * @param {Array<number>} validNumericData - Array data numerik valid.
 * @param {Array<number>|null} validWeights - Array bobot valid atau null.
 * @param {number} p - Persentil yang dicari (0 hingga 1).
 * @param {number} totalW - Total bobot valid.
 * @returns {number|null} Nilai persentil, atau null jika tidak bisa dihitung.
 */
function calculatePercentile(validNumericData, validWeights, p, totalW) {
    if (p < 0 || p > 1) return null;
    const W = totalW;
    if (W <= 0 || !validNumericData || validNumericData.length === 0) return null;

    const items = [];
    for (let i = 0; i < validNumericData.length; i++) {
        const val = validNumericData[i];
        // Pastikan nilai adalah number valid.
        if (typeof val === 'number' && !isNaN(val)) {
            items.push({ value: val, weight: validWeights ? validWeights[i] : 1 });
        }
    }

    if (items.length === 0) return null;

    // 1. Urutkan data berdasarkan nilai.
    items.sort((a, b) => a.value - b.value);

    // Handle P=0 (min) dan P=1 (max) sebagai edge case.
    if (p === 0) return items[0].value;
    if (p === 1) return items[items.length - 1].value;

    // 2. Hitung Rank Index i.
    const i_rank = (W + 1) * p;

    // 3. Dekomposisi Index i.
    const g = Math.floor(i_rank);
    // Bagian pecahan f.
    const f = i_rank - g;

    // 4. Handle Edge Cases (berdasarkan rank g dan totalW).
    // Kasus g < 1 (i_rank < 1).
    if (g < 1) {
        // Return nilai terkecil.
        return items[0].value;
    }
    // Kasus g >= W.
    if (g >= W) {
        // Return nilai terbesar.
         return items[items.length - 1].value;
    }

    // 5. Cari nilai pada rank g (xg) dan g+1 (xg1) menggunakan findValueAtRank.
    const xg = findValueAtRank(g, items, W);
    const xg1 = findValueAtRank(g + 1, items, W);

    // 6. Interpolasi Linier: xp = (1 - f) * xg + f * xg1.
    const percentileValue = (1 - f) * xg + f * xg1;

    return percentileValue;
}

/**
 * Hitung Median (persentil ke-50) nilai numerik.
 * Fungsi ini mengasumsikan input (data & bobot) sudah valid dan numerik.
 * @param {Array<number>} validNumericData - Array data numerik valid.
 * @param {Array<number>|null} validWeights - Array bobot valid atau null.
 * @param {number} totalW - Total bobot valid.
 * @returns {number|null} Median, atau null jika tidak bisa dihitung.
 */
function calculateMedian(validNumericData, validWeights, totalW) {
    // Median adalah persentil ke-50.
    return calculatePercentile(validNumericData, validWeights, 0.5, totalW);
}

// Ekspor fungsi ke global worker scope.
// calculateCentralMoment & findValueAtRank diekspor meski tidak langsung dipakai descriptives.js, berguna sebagai bagian dari library.
self.getValidDataAndWeights = getValidDataAndWeights;
self.getTotalValidWeight = getTotalValidWeight;
self.getValidN = getValidN;
self.calculateSum = calculateSum;
self.calculateMean = calculateMean;
self.calculateCentralMoment = calculateCentralMoment;
self.calculateVariance = calculateVariance;
self.calculateStdDev = calculateStdDev;
self.calculateMin = calculateMin;
self.calculateMax = calculateMax;
self.calculateRange = calculateRange;
self.calculateSEMean = calculateSEMean;
self.calculateSkewness = calculateSkewness;
self.calculateSESkewness = calculateSESkewness;
self.calculateKurtosis = calculateKurtosis;
self.calculateSEKurtosis = calculateSEKurtosis;
self.findValueAtRank = findValueAtRank;
self.calculateMode = calculateMode;
self.calculatePercentile = calculatePercentile;
self.calculateMedian = calculateMedian;