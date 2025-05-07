// Worker untuk kalkulasi statistik deskriptif (bagian dari Frequencies).

// Impor skrip dependensi dengan error handling.
try {
    importScripts('../statistics.js', '../spssDateConverter.js');
} catch (e) {
    self.postMessage({ success: false, error: `Gagal memuat skrip dependensi: ${e.message}` });
    throw e;
}

// Helper: Format angka, null tetap null.
function formatNumber(value, decimals = 4) {
    if (value === null || value === undefined || isNaN(value)) {
        return null;
    }
    // Gunakan toFixed untuk presisi desimal.
    return parseFloat(value.toFixed(decimals));
}

// Helper: Buat key dari label/nama variabel untuk output.
function createKey(label, name) {
    const base = (label && String(label).trim() !== '') ? label : name;
    // Ganti spasi/non-alphanumeric dengan underscore, lowercase.
    return base.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_');
}


self.onmessage = function(event) {
    try {
        const { variableData, weightVariableData, options } = event.data;

        if (!variableData || !Array.isArray(variableData) || !options) {
            throw new Error("Struktur input data tidak valid atau options hilang.");
        }

        // --- Tahap 1: Persiapan Data dan Header ---
        const variablesToProcess = variableData;
        const columnHeaders = [ { header: "" }, { header: "" } ]; // Kolom untuk hierarki header baris.
        // Map: variableName -> { key, type, decimals, data, numericData, ... }
        const variableMap = new Map();
        // Map: variableName -> validN
        const validNMap = new Map();
        // Map: variableName -> totalN (observasi awal)
        const totalNMap = new Map();

        variablesToProcess.forEach(varItem => {
            const { variable, data } = varItem;
            const title = (variable.label && String(variable.label).trim() !== '') ? variable.label : variable.name;
            const key = createKey(variable.label, variable.name);
            const varType = variable.type;
            const missingDef = variable.missing;
            const header = { header: title, key: key };
            columnHeaders.push(header);

            // --- Persiapan Data Per Variabel ---
            // 1. Dapatkan data mentah valid & bobot valid.
            const { validRawData, validWeights, totalW, validN } = getValidDataAndWeights(
                data, // Data asli
                weightVariableData, // Bobot (atau null)
                varType, // Tipe variabel
                missingDef // Definisi missing
            );
             validNMap.set(variable.name, validN);
             totalNMap.set(variable.name, data.length); // Total observasi awal.

            // 2. Siapkan data KHUSUS untuk kalkulasi statistik numerik.
            let numericDataForStats = [];
            let weightsForStats = validWeights ? [] : null;

            if (varType === 'NUMERIC' || varType === 'DATE') {
                 for (let i = 0; i < validRawData.length; i++) {
                    const rawValue = validRawData[i];
                    const weight = validWeights ? validWeights[i] : 1;
                    let valueForCalc = null;

                    if (varType === 'DATE') {
                        // Konversi string tanggal valid ke detik SPSS.
                        valueForCalc = dateStringToSpssSeconds(rawValue);
                    } else { // NUMERIC
                        // Coba konversi ke angka jika string, pastikan valid.
                        valueForCalc = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
                        if (isNaN(valueForCalc)) valueForCalc = null;
                    }

                    // Hanya tambahkan jika konversi berhasil (bukan null/NaN).
                    if (valueForCalc !== null && !isNaN(valueForCalc)) {
                        numericDataForStats.push(valueForCalc);
                        if (weightsForStats) {
                            weightsForStats.push(weight);
                         }
                     }
                }
                // Catatan: `totalW` dari `getValidDataAndWeights` sudah menghitung bobot
                // untuk nilai NUMERIC asli dan DATE yang *bisa* dikonversi.
            }

            // 3. Simpan data relevan untuk variabel ini.
            variableMap.set(variable.name, {
                key: key,
                type: varType,
                missing: missingDef,
                decimals: variable.decimals,
                data: data, // Data asli lengkap (untuk Mode jika perlu).
                validRawData: validRawData, // Data mentah valid (untuk Mode).
                validWeights: validWeights, // Bobot valid sesuai `validRawData` (untuk Mode).
                numericDataForStats: numericDataForStats, // Data valid & terkonversi numerik.
                weightsForStats: weightsForStats, // Bobot valid sesuai `numericDataForStats`.
                totalW: totalW, // Total bobot untuk data numerik/konvertibel.
                validN: validN // Jumlah total kasus valid.
            });
        });


        // --- Tahap 2: Kalkulasi Statistik & Buat Baris Tabel ---
        const outputRows = [];

        // 1. N (Valid/Missing).
        if (true) { // Selalu tampilkan N.
             const validRow = { rowHeader: [null, "Valid"] };
             const missingRow = { rowHeader: [null, "Missing"] };
             variablesToProcess.forEach(varItem => {
                 const key = variableMap.get(varItem.variable.name).key;
                 const vN = validNMap.get(varItem.variable.name) ?? 0;
                 const tN = totalNMap.get(varItem.variable.name) ?? 0;
                 validRow[key] = vN;
                 missingRow[key] = tN - vN;
             });
             outputRows.push({ rowHeader: ["N", null], children: [validRow, missingRow] });
        }

        // Cache hasil kalkulasi untuk digunakan kembali (misal, Mean dipakai Variance).
        // Map: variableName -> { statName: value, ... }
        const calculatedStatsCache = new Map();

        // Helper: Dapatkan atau kalkulasi statistik (dengan caching).
        const getOrCalculateStat = (varName, statName, calculationFn, ...args) => {
            if (!calculatedStatsCache.has(varName)) {
                calculatedStatsCache.set(varName, {});
            }
            const varCache = calculatedStatsCache.get(varName);
            if (varCache.hasOwnProperty(statName)) {
                return varCache[statName];
            }
            const result = calculationFn(...args);
            varCache[statName] = result;
            return result;
        };

        // Definisi statistik yang akan dijalankan berdasarkan options.
        const statsToRun = [
            // Format untuk DATE: tampilkan sebagai tanggal. Lainnya: format angka.
            { key: 'mean', option: options.centralTendency?.mean, label: "Mean", requiresNumeric: true, calc: (vm) => calculateMean(vm.numericDataForStats, vm.weightsForStats, vm.totalW), format: (v, vm) => vm.type === 'DATE' ? spssSecondsToDateString(v) : formatNumber(v, vm.decimals || 4) },
            // Format untuk DATE: tampilkan sebagai durasi. Lainnya: format angka.
            { key: 'seMean', option: options.dispersion?.stdErrorMean, label: "Std. Error of Mean", requiresNumeric: true, calc: (vm) => {
                const stdDev = getOrCalculateStat(vm.key, 'stdDev', calculateStdDev, getOrCalculateStat(vm.key, 'variance', calculateVariance, vm.numericDataForStats, vm.weightsForStats, vm.totalW, getOrCalculateStat(vm.key, 'mean', calculateMean, vm.numericDataForStats, vm.weightsForStats, vm.totalW)));
                return calculateSEMean(stdDev, vm.totalW);
             }, format: (v, vm) => vm.type === 'DATE' ? secondsToDaysHoursMinutesString(v) : formatNumber(v, 5) },
            { key: 'median', option: options.centralTendency?.median, label: "Median", requiresNumeric: true, calc: (vm) => calculateMedian(vm.numericDataForStats, vm.weightsForStats, vm.totalW), format: (v, vm) => vm.type === 'DATE' ? spssSecondsToDateString(v) : formatNumber(v, vm.decimals || 4) },
            {
                key: 'mode', 
                option: options.centralTendency?.mode, 
                label: "Mode", 
                requiresNumeric: false, // Cek tipe dilakukan di dalam `calc`.
                calc: (vm) => {
                    // Mode tidak dihitung untuk tipe STRING dalam konteks Frequencies ini.
                    if (vm.type === 'STRING') {
                        return null;
                    }
                    // Untuk NUMERIC, DATE, gunakan calculateMode.
                    return calculateMode(vm.data, weightVariableData, vm.type, vm.missing);
                },
                format: (v, vm) => {
                    // Tampilkan string kosong jika mode STRING sengaja null.
                    if (v === null && vm.type === 'STRING') {
                        return "";
                    }
                    // Mode untuk DATE mengembalikan string tanggal asli.
                    if (vm.type === 'DATE') return v;
                    return typeof v === 'number' ? formatNumber(v, vm.decimals || 2) : v;
                } 
            },
            { key: 'stdDev', option: options.dispersion?.stddev, label: "Std. Deviation", requiresNumeric: true, calc: (vm) => {
                const mean = getOrCalculateStat(vm.key, 'mean', calculateMean, vm.numericDataForStats, vm.weightsForStats, vm.totalW);
                const variance = getOrCalculateStat(vm.key, 'variance', calculateVariance, vm.numericDataForStats, vm.weightsForStats, vm.totalW, mean);
                return calculateStdDev(variance);
             }, format: (v, vm) => vm.type === 'DATE' ? secondsToDaysHoursMinutesString(v) : formatNumber(v, 5) },
            { key: 'variance', option: options.dispersion?.variance, label: "Variance", requiresNumeric: true, calc: (vm) => {
                const mean = getOrCalculateStat(vm.key, 'mean', calculateMean, vm.numericDataForStats, vm.weightsForStats, vm.totalW);
                return calculateVariance(vm.numericDataForStats, vm.weightsForStats, vm.totalW, mean);
             }, format: (v, vm) => formatNumber(v, 3) }, // Variance tidak diformat khusus DATE.
            { key: 'skewness', option: options.distribution?.skewness, label: "Skewness", requiresNumeric: true, calc: (vm) => {
                const mean = getOrCalculateStat(vm.key, 'mean', calculateMean, vm.numericDataForStats, vm.weightsForStats, vm.totalW);
                const stdDev = getOrCalculateStat(vm.key, 'stdDev', calculateStdDev, getOrCalculateStat(vm.key, 'variance', calculateVariance, vm.numericDataForStats, vm.weightsForStats, vm.totalW, mean));
                return calculateSkewness(vm.numericDataForStats, vm.weightsForStats, vm.totalW, mean, stdDev);
            }, format: (v, vm) => formatNumber(v, 3) },
            { key: 'seSkewness', option: options.distribution?.stdErrorSkewness, label: "Std. Error of Skewness", requiresNumeric: true, calc: (vm) => calculateSESkewness(vm.totalW), format: (v, vm) => formatNumber(v, 3) },
            { key: 'kurtosis', option: options.distribution?.kurtosis, label: "Kurtosis", requiresNumeric: true, calc: (vm) => {
                 const mean = getOrCalculateStat(vm.key, 'mean', calculateMean, vm.numericDataForStats, vm.weightsForStats, vm.totalW);
                 const stdDev = getOrCalculateStat(vm.key, 'stdDev', calculateStdDev, getOrCalculateStat(vm.key, 'variance', calculateVariance, vm.numericDataForStats, vm.weightsForStats, vm.totalW, mean));
                 return calculateKurtosis(vm.numericDataForStats, vm.weightsForStats, vm.totalW, mean, stdDev);
            }, format: (v, vm) => formatNumber(v, 3) },
            { key: 'seKurtosis', option: options.distribution?.stdErrorKurtosis, label: "Std. Error of Kurtosis", requiresNumeric: true, calc: (vm) => calculateSEKurtosis(vm.totalW), format: (v, vm) => formatNumber(v, 3) },
            // Range untuk DATE adalah durasi dalam detik, format sebagai durasi.
            { key: 'range', option: options.dispersion?.range, label: "Range", requiresNumeric: true, calc: (vm) => {
                const min = getOrCalculateStat(vm.key, 'minimum', calculateMin, vm.numericDataForStats);
                const max = getOrCalculateStat(vm.key, 'maximum', calculateMax, vm.numericDataForStats);
                return calculateRange(min, max);
             }, format: (v, vm) => vm.type === 'DATE' ? secondsToDaysHoursMinutesString(v) : formatNumber(v, vm.decimals || 2) },
            { key: 'minimum', option: options.dispersion?.minimum, label: "Minimum", requiresNumeric: true, calc: (vm) => calculateMin(vm.numericDataForStats), format: (v, vm) => vm.type === 'DATE' ? spssSecondsToDateString(v) : formatNumber(v, vm.decimals || 2) },
            { key: 'maximum', option: options.dispersion?.maximum, label: "Maximum", requiresNumeric: true, calc: (vm) => calculateMax(vm.numericDataForStats), format: (v, vm) => vm.type === 'DATE' ? spssSecondsToDateString(v) : formatNumber(v, vm.decimals || 2) },
            { key: 'sum', option: options.centralTendency?.sum, label: "Sum", requiresNumeric: true, calc: (vm) => calculateSum(vm.numericDataForStats, vm.weightsForStats), format: (v, vm) => vm.type === 'DATE' ? secondsToDaysHoursMinutesString(v) : formatNumber(v, vm.decimals || 2) },
        ];

        // Jalankan kalkulasi statistik yang dipilih.
        statsToRun.forEach(statInfo => {
            if (statInfo.option) {
                const row = { rowHeader: [statInfo.label, null] };
                variablesToProcess.forEach(varItem => {
                    const varMeta = variableMap.get(varItem.variable.name);
                    const key = varMeta.key;
                    let result = null;

                    // Cek tipe & ketersediaan data yang diperlukan untuk kalkulasi.
                    const canCalculate = (
                        (!statInfo.requiresNumeric) ||
                        (statInfo.requiresNumeric && (varMeta.type === 'NUMERIC' || varMeta.type === 'DATE') && varMeta.numericDataForStats && varMeta.numericDataForStats.length > 0)
                    );

                    if (canCalculate && typeof statInfo.calc === 'function') {
                        try {
                            result = getOrCalculateStat(varMeta.key, statInfo.key, statInfo.calc, varMeta);
                        } catch (calcError) {
                            console.error(`Error calculating ${statInfo.label} for ${varMeta.key}:`, calcError);
                            result = null; // Set null jika error kalkulasi.
                        }
                    }
                    // Format hasil.
                    row[key] = statInfo.format ? statInfo.format(result, varMeta) : result;
                });
                outputRows.push(row);
            }
        });

        // 3. Percentiles.
        // Kumpulkan semua nilai persentil yang diminta (Quartiles, Cut Points, Specific).
        const percentileRequests = [];
        if (options.percentileValues?.quartiles) {
            percentileRequests.push({ p: 25, labelSuffix: "th" }, { p: 50, labelSuffix: "th" }, { p: 75, labelSuffix: "th" });
        }
        if (options.percentileValues?.cutPoints && options.percentileValues?.cutPointsN > 1) {
            const N = options.percentileValues.cutPointsN;
            for (let i = 1; i < N; i++) {
                percentileRequests.push({ p: (i / N) * 100, labelSuffix: `(Cut ${i})` });
            }
        }
        if (options.percentileValues?.specificPercentiles && Array.isArray(options.percentileValues.specificPercentiles)) {
            options.percentileValues.specificPercentiles.forEach(pVal => {
                if (typeof pVal === 'number' && pVal >= 0 && pVal <= 100) {
                    percentileRequests.push({ p: pVal, labelSuffix: "th" });
                }
            });
        }

        // Hilangkan duplikat & urutkan permintaan persentil.
        const uniquePercentileRequests = Array.from(new Map(percentileRequests.map(item => [item.p, item])).values())
                                             .sort((a, b) => a.p - b.p);

        if (uniquePercentileRequests.length > 0) {
            const percentileGroupRow = { rowHeader: ["Percentiles", null], children: [] };
            uniquePercentileRequests.forEach(req => {
                const pValue = req.p;
                const pLabel = `${pValue}${req.labelSuffix || 'th'}`;
                const percentileRow = { rowHeader: [null, pLabel] };

                variablesToProcess.forEach(varItem => {
                    const varMeta = variableMap.get(varItem.variable.name);
                    const key = varMeta.key;
                    let result = null;

                    if ((varMeta.type === 'NUMERIC' || varMeta.type === 'DATE') && varMeta.numericDataForStats && varMeta.numericDataForStats.length > 0) {
                        try {
                            // Persentil dikalkulasi dengan p dalam range 0-1.
                            result = calculatePercentile(varMeta.numericDataForStats, varMeta.weightsForStats, pValue / 100, varMeta.totalW);
                        } catch (calcError) {
                            console.error(`Error calculating percentile ${pValue} for ${varMeta.key}:`, calcError);
                            result = null;
                        }
                    }
                    // Format hasil persentil.
                    percentileRow[key] = varMeta.type === 'DATE' ? spssSecondsToDateString(result) : formatNumber(result, varMeta.decimals || 4);
                });
                percentileGroupRow.children.push(percentileRow);
            });
            outputRows.push(percentileGroupRow);
        }

        // --- Tahap 3: Kirim Hasil ---        
        const statisticsTable = {
            title: "Statistics", // Judul tabel statistik.
            columnHeaders: columnHeaders,
            rows: outputRows,
            notes: "Statistics are based on all anayzed variables."
        };

        self.postMessage({
            success: true,
            statisticsTable: statisticsTable
        });

    } catch (error) {
        console.error("Error in Frequencies (descriptive part) worker:", error);
        self.postMessage({ success: false, error: error.message + (error.stack ? `\nStack: ${error.stack}` : '') });
    }
};