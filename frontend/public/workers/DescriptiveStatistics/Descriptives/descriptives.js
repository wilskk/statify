// Worker untuk kalkulasi statistik deskriptif.

// Impor skrip dependensi dengan error handling.
try {
    self.importScripts('../statistics.js', '../spssDateConverter.js');
} catch (e) {
    console.error("Worker importScripts failed:", e);
    // Kirim pesan error jika impor gagal & hentikan worker.
    self.postMessage({ success: false, error: `Failed to load dependency scripts: ${e.message}${e.stack ? '\nStack: ' + e.stack : ''}` });
    throw e;
}

/**
 * Fungsi untuk menghitung Z-score dari array data
 * @param {Array} rawDataArray - Array data mentah
 * @param {number} mean - Nilai mean yang sudah dihitung
 * @param {number} stdDev - Nilai standar deviasi yang sudah dihitung
 * @returns {Array} - Array Z-score dengan panjang yang sama dengan rawDataArray
 */
function calculateZScores(rawDataArray, mean, stdDev) {
    // Buat array baru dengan panjang yang sama dengan rawDataArray
    const zScores = new Array(rawDataArray.length);
    
    // Error check: Jika stdDev adalah 0 atau tidak valid, semua Z-score akan jadi 0
    if (stdDev === 0 || !stdDev || isNaN(stdDev)) {
        console.warn("Standard deviation is zero or invalid. Z-scores will be constant zero for non-missing values.");
        for (let i = 0; i < rawDataArray.length; i++) {
            const rawValue = rawDataArray[i];
            // Cek jika nilai valid (tidak null, tidak undefined, bukan string kosong)
            if (rawValue !== null && rawValue !== undefined && rawValue !== "") {
                let numValue = rawValue;
                if (typeof rawValue === 'string') {
                    numValue = parseFloat(rawValue);
                    if (isNaN(numValue)) {
                        zScores[i] = ""; // Nilai invalid, set Z-score ke string kosong
                        continue;
                    }
                }
                // Semua nilai valid akan jadi 0 karena stdDev = 0 (semua nilai sama dengan mean)
                zScores[i] = 0;
            } else {
                // Nilai missing/invalid, set Z-score ke string kosong
                zScores[i] = "";
            }
        }
        return zScores;
    }
    
    // Kasus normal: Hitung Z-score untuk setiap nilai
    for (let i = 0; i < rawDataArray.length; i++) {
        const rawValue = rawDataArray[i];
        // Cek jika nilai valid (tidak null, tidak undefined, bukan string kosong)
        if (rawValue !== null && rawValue !== undefined && rawValue !== "") {
            let numValue = rawValue;
            if (typeof rawValue === 'string') {
                numValue = parseFloat(rawValue);
                if (isNaN(numValue)) {
                    zScores[i] = ""; // Nilai invalid, set Z-score ke string kosong
                    continue;
                }
            }
            
            // Kalkulasi Z-score: (nilai - mean) / stdDev
            zScores[i] = (numValue - mean) / stdDev;
        } else {
            // Nilai missing/invalid, set Z-score ke string kosong
            zScores[i] = "";
        }
    }
    
    return zScores;
}

self.onmessage = function(e) {
    try {
        // Destructure data input.
        const { variableData, weightVariableData, params, saveStandardized } = e.data;

        // Hasil statistik dalam bentuk objek, bukan tabel
        const resultStatistics = {
            variables: {},
            listwiseValidN: 0
        };
        
        // Objek untuk menyimpan data Z-score, hanya jika saveStandardized aktif
        const zScoreData = saveStandardized ? {} : null;

        // ---- Hitung statistik deskriptif untuk setiap variabel ----
        for (const varInstance of variableData) {
            const currentVariable = varInstance.variable;
            const rawDataArray = varInstance.data;
            const variableType = currentVariable.type;
            const missingDefinition = currentVariable.missing_values;
            const variableName = currentVariable.name;
            const variableLabel = currentVariable.label || currentVariable.name;

            // Inisialisasi hasil statistik untuk variabel saat ini
            resultStatistics.variables[variableName] = {
                name: variableName,
                label: variableLabel,
                type: variableType,
                n: 0
            };

            const {
                validRawData: initialValidRawData,
                validWeights,
                totalW, // totalW dari statistics.js: jumlah bobot untuk nilai numerik/konvertibel.
                validN
            } = self.getValidDataAndWeights(rawDataArray, weightVariableData, variableType, missingDefinition);

            resultStatistics.variables[variableName].n = validN;

            // Kalkulasi statistik hanya jika ada data valid dan tipe variabel NUMERIC atau DATE.
            if (validN > 0 && (variableType === 'NUMERIC' || variableType === 'DATE')) {
                let dataForNumericStats = [];
                if (variableType === 'NUMERIC') {
                    dataForNumericStats = initialValidRawData.map(val => {
                        if (typeof val === 'string') {
                            const num = parseFloat(val);
                            // Fungsi di statistics.js akan filter NaN/null.
                            return isNaN(num) ? null : num;
                        }
                        return val; // Angka dan null diteruskan.
                    });
                } else if (variableType === 'DATE') {
                    // Konversi string tanggal ke SPSS seconds; null jika invalid.
                    dataForNumericStats = initialValidRawData.map(val =>
                        typeof val === 'string' ? self.dateStringToSpssSeconds(val) : null
                    );
                }

                // Simpan hasil statistik dalam bentuk objek dengan format yang konsisten
                const stats = resultStatistics.variables[variableName];
                
                // Hitung mean terlebih dahulu jika diperlukan untuk kalkulasi lain
                // Mean diperlukan untuk: variance, skewness, kurtosis
                const needMean = params.mean || 
                                 params.variance || 
                                 params.stdDev || 
                                 params.skewness || 
                                 params.kurtosis || 
                                 saveStandardized; // Mean selalu dibutuhkan jika saveStandardized aktif
                                  
                const mean = needMean ? 
                    self.calculateMean(dataForNumericStats, validWeights, totalW) : null;
                
                // Hitung variance jika diperlukan untuk stdDev
                const needVariance = params.variance || params.stdDev || saveStandardized; // Variance dibutuhkan untuk standardisasi
                const variance = (needVariance && mean !== null) ? 
                    self.calculateVariance(dataForNumericStats, validWeights, totalW, mean) : null;
                
                // Hitung stdDev jika diperlukan untuk SEmean, skewness, atau kurtosis
                const needStdDev = params.stdDev || 
                                  params.standardError || 
                                  params.skewness || 
                                  params.kurtosis || 
                                  saveStandardized; // StdDev dibutuhkan untuk standardisasi
                const stdDev = (needStdDev && variance !== null) ? 
                    self.calculateStdDev(variance) : null;
                
                // Hitung statistik yang diminta oleh pengguna
                if (params.minimum) {
                    const minimum = self.calculateMin(dataForNumericStats);
                    if (variableType === 'DATE') {
                        stats.minimum = (minimum !== null) ? self.spssSecondsToDateString(minimum) : null;
                    } else {
                        stats.minimum = minimum;
                    }
                }
                
                if (params.maximum) {
                    const maximum = self.calculateMax(dataForNumericStats);
                    if (variableType === 'DATE') {
                        stats.maximum = (maximum !== null) ? self.spssSecondsToDateString(maximum) : null;
                    } else {
                        stats.maximum = maximum;
                    }
                }
                
                if (params.range && params.minimum && params.maximum) {
                    // Gunakan nilai min dan max yang sudah dihitung jika tersedia
                    const min = stats.minimum !== undefined ? 
                        (variableType === 'DATE' ? self.dateStringToSpssSeconds(stats.minimum) : stats.minimum) : 
                        self.calculateMin(dataForNumericStats);
                    
                    const max = stats.maximum !== undefined ? 
                        (variableType === 'DATE' ? self.dateStringToSpssSeconds(stats.maximum) : stats.maximum) : 
                        self.calculateMax(dataForNumericStats);
                    
                    const range = (min !== null && max !== null) ? self.calculateRange(min, max) : null;
                    
                    if (variableType === 'DATE') {
                        stats.range = (range !== null) ? self.secondsToDaysHoursMinutesString(range) : null;
                    } else {
                        stats.range = range;
                    }
                }
                
                if (params.sum) {
                    const sum = self.calculateSum(dataForNumericStats, validWeights);
                    if (variableType === 'DATE') {
                        stats.sum = (sum !== null) ? self.secondsToDaysHoursMinutesString(sum) : null;
                    } else {
                        stats.sum = sum;
                    }
                }
                
                if (params.mean) {
                    if (variableType === 'DATE') {
                        stats.mean = (mean !== null) ? self.spssSecondsToDateString(mean) : null;
                    } else {
                        stats.mean = mean;
                    }
                }
                
                if (params.standardError && stdDev !== null && totalW > 0) {
                    const seMean = self.calculateSEMean(stdDev, totalW);
                    if (variableType === 'DATE') {
                        stats.standardError = (seMean !== null) ? self.secondsToDaysHoursMinutesString(seMean) : null;
                    } else {
                        stats.standardError = seMean;
                    }
                }
                
                if (params.median) {
                    const median = self.calculateMedian(dataForNumericStats, validWeights, totalW);
                    if (variableType === 'DATE') {
                        stats.median = (median !== null) ? self.spssSecondsToDateString(median) : null;
                    } else {
                        stats.median = median;
                    }
                }
                
                if (params.stdDev) {
                    if (variableType === 'DATE') {
                        stats.stdDev = (stdDev !== null) ? self.secondsToDaysHoursMinutesString(stdDev) : null;
                    } else {
                        stats.stdDev = stdDev;
                    }
                }
                
                if (params.variance) {
                    stats.variance = variance;
                }
                
                if (params.skewness && mean !== null && stdDev !== null && totalW > 0) {
                    const skewnessStat = self.calculateSkewness(dataForNumericStats, validWeights, totalW, mean, stdDev);
                    stats.skewness = skewnessStat;
                    
                    if (skewnessStat !== null) {
                        const seSkewness = self.calculateSESkewness(totalW);
                        stats.skewnessStdError = seSkewness;
                    }
                }
                
                if (params.kurtosis && mean !== null && stdDev !== null && totalW > 0) {
                    const kurtosisStat = self.calculateKurtosis(dataForNumericStats, validWeights, totalW, mean, stdDev);
                    stats.kurtosis = kurtosisStat;
                    
                    if (kurtosisStat !== null) {
                        const seKurtosis = self.calculateSEKurtosis(totalW);
                        stats.kurtosisStdError = seKurtosis;
                    }
                }
                
                // Hitung Z-score values jika saveStandardized aktif
                // Tipe data harus NUMERIC dan harus ada mean & stdDev
                if (saveStandardized && variableType === 'NUMERIC' && mean !== null && stdDev !== null) {
                    // Gunakan fungsi terpisah untuk menghitung Z-scores
                    const zScores = calculateZScores(rawDataArray, mean, stdDev);
                    
                    // Simpan Z-scores untuk variabel ini
                    zScoreData[variableName] = {
                        scores: zScores,
                        variableInfo: {
                            name: `Z${variableName}`,
                            label: `Zscore: ${variableLabel}`,
                            type: "NUMERIC", // Z-scores selalu numeric
                            width: 11,       // Lebar kolom untuk Z-score
                            decimals: 5,     // 5 desimal untuk presisi Z-score
                            measure: "scale" // Z-scores selalu berskala rasio/interval
                        }
                    };
                }
            }
        }
        
        // --- Valid N (listwise) ---
        // Helper: Cek missing value (mirip logic di statistics.js, disederhanakan untuk konteks ini).
        function isValueMissing(value, type, definition) {
            // System missing: string kosong untuk NUMERIC/DATE.
            if (value === "" && (type === 'NUMERIC' || type === 'DATE')) return true;
            // System missing: null/undefined.
            if (value === null || value === undefined) return true;
            if (!definition) return false;

            // User-defined discrete missing.
            if (definition.discrete && Array.isArray(definition.discrete)) {
                let valueToCompare = value;
                if (type === 'NUMERIC' && typeof value !== 'number') {
                    const numVal = parseFloat(value);
                    if (!isNaN(numVal)) valueToCompare = numVal;
                }
                for (const missingVal of definition.discrete) {
                    let discreteMissingToCompare = missingVal;
                    if (type === 'NUMERIC' && typeof missingVal === 'string'){
                        const numMissing = parseFloat(missingVal);
                        if(!isNaN(numMissing)) discreteMissingToCompare = numMissing;
                    }
                    if (valueToCompare === discreteMissingToCompare || String(value) === String(missingVal)) return true;
                }
            }
            // User-defined range missing (DATE juga pakai range numerik untuk missing).
            if ((type === 'NUMERIC' || type === 'DATE') && definition.range) {
                 const numValue = (type === 'DATE') ? self.dateStringToSpssSeconds(String(value)) : 
                                (typeof value === 'number' ? value : parseFloat(value));

                if (numValue !== null && !isNaN(numValue)) {
                    const min = typeof definition.range.min === 'number' ? definition.range.min : parseFloat(definition.range.min);
                    const max = typeof definition.range.max === 'number' ? definition.range.max : parseFloat(definition.range.max);
                    if (!isNaN(min) && !isNaN(max) && numValue >= min && numValue <= max) return true;
                }
            }
            return false;
        }

        let listwiseValidN = 0;
        if (variableData.length > 0) {
            // Asumsi semua array data punya panjang sama.
            const numCases = variableData[0].data.length;
            for (let i = 0; i < numCases; i++) {
                let isCaseListwiseValid = true;
                const currentWeight = weightVariableData ? (weightVariableData[i] ?? null) : 1;
                const isWeightInvalid = (currentWeight === null || typeof currentWeight !== 'number' || isNaN(currentWeight) || currentWeight <= 0);

                if (isWeightInvalid) {
                    isCaseListwiseValid = false;
                } else {
                    for (const varInstance of variableData) {
                        const dataValue = varInstance.data[i];
                        if (isValueMissing(dataValue, varInstance.variable.type, varInstance.variable.missing_values)) {
                            isCaseListwiseValid = false;
                            break;
                        }
                    }
                }
                if (isCaseListwiseValid) {
                    listwiseValidN++;
                }
            }
        }
        
        resultStatistics.listwiseValidN = listwiseValidN;

        // Kirim hasil kembali ke thread utama.
        self.postMessage({
            success: true,
            statistics: {
                title: "Descriptive Statistics",
                output_data: resultStatistics,
                components: "DescriptiveStatisticsTable",
                description: `Descriptive statistics calculated for ${variableData.length} variable(s).`
            },
            zScoreData: zScoreData
        });

    } catch (error) {
        console.error("Error in Descriptives worker:", error);
        self.postMessage({ success: false, error: error.message + (error.stack ? `\nStack: ${error.stack}` : '') });
    }
};