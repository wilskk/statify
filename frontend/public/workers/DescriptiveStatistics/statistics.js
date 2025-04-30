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

    // Helper untuk cek apakah nilai bisa dianggap numerik (angka valid atau string tanggal valid)
    const isNumericallyConvertible = (value, type) => {
        if (type === 'NUMERIC') {
            if (typeof value === 'number' && !isNaN(value)) return true;
            if (typeof value === 'string') {
                const numVal = parseFloat(value);
                // Anggap string angka valid jika bisa diparse & bukan string kosong (sudah dicek di missing)
                return !isNaN(numVal);
            }
            return false;
        }
        if (type === 'DATE') {
            // Gunakan fungsi konversi untuk cek validitas format dan tanggal
            // Pastikan dateStringToSpssSeconds tersedia di scope ini atau diimpor
            if (typeof dateStringToSpssSeconds === 'function') {
                 return dateStringToSpssSeconds(value) !== null;
            } else {
                // Fallback jika fungsi tidak ada (misalnya saat testing terisolasi)
                // Ini hanya cek format dasar, bukan validitas tanggal (31-feb-2023)
                return typeof value === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(value);
            }
        }
        return false; // Tipe lain tidak dianggap numerik
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
            validN++;

            // Hitung total bobot HANYA jika nilai valid DAN bisa dikonversi/dianggap numerik
            if (isNumericallyConvertible(dataValue, variableType)) {
                 totalW_numeric += weightValue;
            }
        }
    }

     // Penyesuaian totalW jika tidak ada bobot (case unweighted)
     if (!weights) {
         totalW_numeric = 0; // Reset dan hitung ulang
         for(const val of validRawData) {
            // Hitung 1 untuk setiap item valid yang numerik/convertible
            if (isNumericallyConvertible(val, variableType)) {
                totalW_numeric += 1;
            }
         }
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
function calculateSum(validNumericData, validWeights) {
    // Fungsi ini mengasumsikan input sudah valid dan numerik
    let sum = 0;
    if (!validWeights) {
        for(const val of validNumericData) {
             // Cek lagi tipe karena DATE mungkin masuk sebagai null jika gagal konversi
            if(typeof val === 'number' && !isNaN(val)) {
                sum += val;
            }
        }
    } else {
         for(let i = 0; i < validNumericData.length; i++) {
             // Cek lagi tipe
            if(typeof validNumericData[i] === 'number' && !isNaN(validNumericData[i])) {
                sum += validNumericData[i] * validWeights[i];
            }
        }
    }
    return sum;
}

/**
 * Menghitung rata-rata (Mean) nilai numerik dengan bobot.
 * MEMBUTUHKAN: data numerik valid, bobot valid, dan total bobot valid (totalW).
 * @param {Array<number>} validNumericData - Array data numerik yang sudah valid.
 * @param {Array<number>|null} validWeights - Array bobot valid yang sesuai.
 * @param {number} totalW - Jumlah total bobot yang valid untuk data numerik ini.
 * @returns {number|null} Rata-rata, atau null jika tidak dapat dihitung.
 */
function calculateMean(validNumericData, validWeights, totalW) {
    if (totalW === 0) return null;
    // Hitung Sum dari data yang sudah valid
    let sum = 0;
    if (!validWeights) {
        for(const val of validNumericData) {
            if(typeof val === 'number' && !isNaN(val)) sum += val;
        }
    } else {
         for(let i = 0; i < validNumericData.length; i++) {
             if(typeof validNumericData[i] === 'number' && !isNaN(validNumericData[i])) {
                 sum += validNumericData[i] * validWeights[i];
             }
         }
    }
    return sum / totalW;
}

/**
 * Helper: Menghitung momen pusat ke-r untuk nilai numerik.
 * MEMBUTUHKAN: data numerik valid, bobot valid, dan rata-rata.
 * @param {Array<number>} validNumericData - Array data numerik valid.
 * @param {Array<number>|null} validWeights - Array bobot valid atau null.
 * @param {number} r - Orde momen (mis., 2, 3, 4).
 * @param {number} mean - Rata-rata numerik yang telah dihitung.
 * @returns {number|null} Momen pusat ke-r, atau null jika tidak dapat dihitung.
 */
function calculateCentralMoment(validNumericData, validWeights, r, mean) {
    if (mean === null) return null;
    let moment = 0;
    let numericCount = 0; // Hitung item numerik valid yang diproses

    if (!validWeights) {
        for (const val of validNumericData) {
            // Cek tipe lagi
            if (typeof val === 'number' && !isNaN(val)) {
                moment += Math.pow(val - mean, r);
                numericCount++;
            }
        }
    } else {
        for (let i = 0; i < validNumericData.length; i++) {
             // Cek tipe lagi
             if (typeof validNumericData[i] === 'number' && !isNaN(validNumericData[i])) {
                moment += validWeights[i] * Math.pow(validNumericData[i] - mean, r);
                numericCount++;
            }
        }
    }
    // Kembalikan null jika tidak ada data numerik valid yang diproses
    return numericCount > 0 ? moment : null;
}

/**
 * Menghitung varians untuk nilai numerik.
 * MEMBUTUHKAN: data numerik valid, bobot valid, total bobot valid, dan rata-rata.
 * @param {Array<number>} validNumericData - Array data numerik valid.
 * @param {Array<number>|null} validWeights - Array bobot valid.
 * @param {number} totalW - Jumlah total bobot valid.
 * @param {number} mean - Rata-rata yang telah dihitung.
 * @returns {number|null} Varians, atau null jika tidak dapat dihitung.
 */
function calculateVariance(validNumericData, validWeights, totalW, mean) {
    if (totalW <= 1 || mean === null) return null;

    const M2 = calculateCentralMoment(validNumericData, validWeights, 2, mean);
    if (M2 === null) return null;

    // Hindari pembagian dengan nol atau nilai negatif kecil dekat nol
    const denominator = totalW - 1;
    return denominator > 1e-15 ? (M2 / denominator) : null;
}

/**
 * Menghitung simpangan baku (Standard Deviation) untuk nilai numerik.
 * MEMBUTUHKAN: varians yang telah dihitung.
 * @param {number|null} variance - Varians yang telah dihitung.
 * @returns {number|null} Simpangan baku, atau null jika tidak dapat dihitung.
 */
function calculateStdDev(variance) {
    return variance === null || variance < 0 ? null : Math.sqrt(variance);
}

/**
 * Menghitung nilai minimum (hanya untuk angka).
 * MEMBUTUHKAN: data numerik valid.
 * @param {Array<number>} validNumericData - Array data numerik valid.
 * @returns {number|null} Nilai minimum numerik, atau null jika tidak ada.
 */
function calculateMin(validNumericData) {
    let min = null;
    for (const val of validNumericData) {
      // Cek tipe lagi
      if (typeof val === 'number' && !isNaN(val)) {
        if (min === null || val < min) {
          min = val;
        }
      }
    }
    return min;
}

/**
 * Menghitung nilai maksimum (hanya untuk angka).
 * MEMBUTUHKAN: data numerik valid.
 * @param {Array<number>} validNumericData - Array data numerik valid.
 * @returns {number|null} Nilai maksimum numerik, atau null jika tidak ada.
 */
function calculateMax(validNumericData) {
    let max = null;
    for (const val of validNumericData) {
       // Cek tipe lagi
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
 * MEMBUTUHKAN: nilai min dan max yang telah dihitung.
 * @param {number|null} min - Nilai minimum.
 * @param {number|null} max - Nilai maksimum.
 * @returns {number|null} Jangkauan, atau null jika min/max tidak dapat dihitung.
 */
function calculateRange(min, max) {
    return min === null || max === null ? null : max - min;
}

/**
 * Menghitung kesalahan baku rata-rata (Standard Error of Mean).
 * MEMBUTUHKAN: simpangan baku dan total bobot valid.
 * @param {number|null} stdDev - Simpangan baku yang telah dihitung.
 * @param {number} totalW - Jumlah total bobot valid.
 * @returns {number|null} Kesalahan baku rata-rata, atau null jika tidak dapat dihitung.
 */
function calculateSEMean(stdDev, totalW) {
    if (totalW <= 0 || stdDev === null) return null;
    const sqrtW = Math.sqrt(totalW);
    return sqrtW > 1e-15 ? (stdDev / sqrtW) : null;
}

/**
 * Menghitung Skewness (Kemiringan) untuk nilai numerik.
 * MEMBUTUHKAN: data numerik valid, bobot valid, total bobot valid, rata-rata, dan simpangan baku.
 * @param {Array<number>} validNumericData - Array data numerik valid.
 * @param {Array<number>|null} validWeights - Array bobot valid.
 * @param {number} totalW - Jumlah total bobot valid.
 * @param {number} mean - Rata-rata yang telah dihitung.
 * @param {number} stdDev - Simpangan baku yang telah dihitung.
 * @returns {number|null} Skewness, atau null jika tidak dapat dihitung.
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
 * Menghitung kesalahan baku Skewness (Standard Error of Skewness).
 * MEMBUTUHKAN: total bobot valid.
 * @param {number} totalW - Jumlah total bobot valid.
 * @returns {number|null} Kesalahan baku skewness, atau null jika tidak dapat dihitung.
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
 * Menghitung Kurtosis untuk nilai numerik.
 * MEMBUTUHKAN: data numerik valid, bobot valid, total bobot valid, rata-rata, dan simpangan baku.
 * @param {Array<number>} validNumericData - Array data numerik valid.
 * @param {Array<number>|null} validWeights - Array bobot valid.
 * @param {number} totalW - Jumlah total bobot valid.
 * @param {number} mean - Rata-rata yang telah dihitung.
 * @param {number} stdDev - Simpangan baku yang telah dihitung.
 * @returns {number|null} Kurtosis, atau null jika tidak dapat dihitung.
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
 * Menghitung kesalahan baku Kurtosis (Standard Error of Kurtosis).
 * MEMBUTUHKAN: total bobot valid.
 * @param {number} totalW - Jumlah total bobot valid.
 * @returns {number|null} Kesalahan baku kurtosis, atau null jika tidak dapat dihitung.
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
 * Helper function to find the data value corresponding to a specific rank
 * in weighted, sorted data.
 * @param {number} targetRank - The 1-based rank to find the value for.
 * @param {Array<{value: number, weight: number}>} sortedItems - Array of {value, weight} objects, sorted by value.
 * @param {number} totalW - The total weight W.
 * @returns {number} The data value corresponding to the target rank.
 */
function findValueAtRank(targetRank, sortedItems, totalW) {
    // Handle ranks below 1 (should correspond to the smallest value)
    if (targetRank < 1) {
        return sortedItems[0].value;
    }
    // Handle ranks at or above total weight W (should correspond to the largest value)
    // Using 1e-9 epsilon for comparison due to potential floating point issues
    if (targetRank >= totalW - 1e-9) {
        return sortedItems[sortedItems.length - 1].value;
    }

    let cumulativeWeight = 0;
    for (let k = 0; k < sortedItems.length; k++) {
        cumulativeWeight += sortedItems[k].weight;
        // If the target rank falls within the cumulative weight of this item
        if (targetRank <= cumulativeWeight + 1e-9) {
            return sortedItems[k].value;
        }
    }

    // Fallback: Should theoretically not be reached if targetRank < totalW,
    // but return the largest value just in case.
    return sortedItems[sortedItems.length - 1].value;
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
    // Cek jika semua nilai unik memiliki frekuensi yang sama (tidak ada modus unik)
    if (modes.length === frequencyMap.size && modes.length > 1) {
        // Urutkan untuk mendapatkan yang terkecil
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
        // Kembalikan nilai terkecil dengan asterisk
        // Pastikan dikonversi ke string jika awalnya angka
        return String(modes[0]) + '*';
    }

    // Urutkan untuk mendapatkan yang terkecil jika ada multiple modes (kasus normal)
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
 * Menghitung persentil untuk nilai numerik menggunakan metode WAVERAGE.
 * Memperhitungkan definisi missing value.
 * @param {Array<any>} data - Array nilai.
 * @param {Array<number|null|undefined>} [weights] - Array bobot (opsional).
 * @param {number} p - Persentil yang diinginkan (0 hingga 1).
 * @param {string} variableType - Tipe variabel (harus 'NUMERIC' atau 'DATE' - DATE diperlakukan numerik di sini).
 * @param {object|null|undefined} missingDefinition - Definisi missing.
 * @returns {number|null} Nilai persentil, atau null jika tidak dapat dihitung.
 */
function calculatePercentile(validNumericData, validWeights, p, totalW) {
    if (p < 0 || p > 1) return null;
    // Fungsi ini mengasumsikan input sudah valid dan numerik
    const W = totalW;
    if (W <= 0 || !validNumericData || validNumericData.length === 0) return null;

    const items = [];
    for (let i = 0; i < validNumericData.length; i++) {
        const val = validNumericData[i];
        // Cek tipe lagi
        if (typeof val === 'number' && !isNaN(val)) {
            items.push({ value: val, weight: validWeights ? validWeights[i] : 1 });
        }
    }

    if (items.length === 0) return null;

    // 1. Urutkan data berdasarkan nilai
    items.sort((a, b) => a.value - b.value);

    // Handle P=0 and P=1 directly as edge cases (min and max value)
    if (p === 0) return items[0].value;
    if (p === 1) return items[items.length - 1].value;

    // 2. Hitung Indeks Peringkat (Rank Index) i
    const i_rank = (W + 1) * p;

    // 3. Dekomposisi Indeks i
    const g = Math.floor(i_rank);
    const f = i_rank - g; // Bagian pecahan

    // 5. Handle Edge Cases (berdasarkan rank g dan total weight W)
    // Kasus g=0 (i_rank < 1)
    if (g < 1) {
        return items[0].value; // Nilai terkecil
    }
    // Kasus g >= W (i_rank >= W+1 effectively, karena i=g+f)
    // Check using g, as rank g must exist for interpolation
    if (g >= W) {
         return items[items.length - 1].value; // Nilai terbesar
    }

    // 4. Cari nilai pada rank g (xg) dan rank g+1 (xg1)
    // Gunakan helper function findValueAtRank
    const xg = findValueAtRank(g, items, W);
    const xg1 = findValueAtRank(g + 1, items, W);

    // 6. Lakukan Interpolasi Linier
    // xp = (1 - f) * xg + f * xg1
    const percentileValue = (1 - f) * xg + f * xg1;

    return percentileValue;
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
function calculateMedian(validNumericData, validWeights, totalW) {
    // Median adalah persentil ke-50
    return calculatePercentile(validNumericData, validWeights, 0.5, totalW);
}