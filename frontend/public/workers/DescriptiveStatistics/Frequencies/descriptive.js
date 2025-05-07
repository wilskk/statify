// Worker untuk kalkulasi statistik deskriptif (bagian dari Frequencies).

// Impor skrip yang diperlukan (pastikan path ini benar relatif terhadap worker)
try {
    // Asumsi statistics.js dan spssDateConverter.js ada di level yang sama atau path yang benar
    importScripts('../statistics.js', '../spssDateConverter.js');
} catch (e) {
    // Jika gagal import, kirim error dan hentikan worker
    self.postMessage({ success: false, error: `Gagal memuat skrip dependensi: ${e.message}` });
    throw e; // Hentikan eksekusi worker
}

// Helper function untuk memformat angka (null tetap null)
function formatNumber(value, decimals = 4) {
    if (value === null || value === undefined || isNaN(value)) {
        return null;
    }
    // Gunakan toFixed untuk jumlah desimal yang tepat
    return parseFloat(value.toFixed(decimals));
}

// Helper function untuk membuat key dari label/nama variabel
function createKey(label, name) {
    const base = (label && String(label).trim() !== '') ? label : name;
    // Ganti spasi/karakter non-alphanumeric dengan underscore, buat lowercase
    return base.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_');
}

// Fungsi utama worker
self.onmessage = function(event) {
    try {
        // Ambil data dan opsi dari pesan
        const { variableData, weightVariableData, options } = event.data;

        // Validasi input dasar
        if (!variableData || !Array.isArray(variableData) || variableData.length === 0) {
            throw new Error("Data variabel tidak valid atau kosong.");
        }
        if (!options) {
            throw new Error("Opsi tidak disertakan.");
        }

        // --- Tahap 1: Persiapan Data dan Header ---
        const variablesToProcess = variableData; // Proses semua variabel
        const columnHeaders = [ { header: "" }, { header: "" } ];
        const variableMap = new Map(); // Map: variableName -> { key: string, type: string, decimals: number, data: any[], numericData: number[]|null }
        const validNMap = new Map(); // Map: variableName -> validN
        const totalNMap = new Map(); // Map: variableName -> totalN

        variablesToProcess.forEach(varItem => {
            const { variable, data } = varItem;
            const title = (variable.label && String(variable.label).trim() !== '') ? variable.label : variable.name;
            const key = createKey(variable.label, variable.name);
            const varType = variable.type;
            const missingDef = variable.missing; // Get missing definition
            const header = { header: title, key: key };
            columnHeaders.push(header);

            // --- Persiapan Data Per Variabel ---
            // 1. Dapatkan data mentah valid & bobot valid menggunakan definisi missing
            const { validRawData, validWeights, totalW, validN } = getValidDataAndWeights(
                data, // Data asli variabel ini
                weightVariableData, // Bobot (atau null jika tidak ada)
                varType, // Tipe variabel ('NUMERIC', 'STRING', 'DATE')
                missingDef // Definisi missing
            );
             validNMap.set(variable.name, validN);
             totalNMap.set(variable.name, data.length); // Total observasi awal

            // 2. Siapkan data KHUSUS untuk kalkulasi statistik numerik
            let numericDataForStats = [];
            let weightsForStats = validWeights ? [] : null;

            if (varType === 'NUMERIC' || varType === 'DATE') {
                for (let i = 0; i < validRawData.length; i++) {
                    const rawValue = validRawData[i];
                    let valueForCalc = null;

                    if (varType === 'DATE') {
                        // Konversi string tanggal valid ke detik SPSS
                        valueForCalc = dateStringToSpssSeconds(rawValue);
                    } else { // NUMERIC
                        // Coba konversi ke angka jika string, pastikan valid
                        valueForCalc = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
                        if (isNaN(valueForCalc)) valueForCalc = null;
                    }

                    // Hanya tambahkan jika konversi berhasil (bukan null/NaN)
                    if (valueForCalc !== null && !isNaN(valueForCalc)) {
                        numericDataForStats.push(valueForCalc);
                        if (weightsForStats) {
                            weightsForStats.push(validWeights[i]);
                        }
                    }
                }
                // Catatan: totalW dari getValidDataAndWeights sudah menghitung bobot
                // untuk nilai NUMERIC asli dan DATE yang *bisa* dikonversi.
            }

            // 3. Simpan semua data yang relevan untuk variabel ini
            variableMap.set(variable.name, {
                key: key,
                type: varType,
                missing: missingDef,
                decimals: variable.decimals,
                data: data, // Data asli lengkap (untuk Mode jika perlu)
                validRawData: validRawData, // Data mentah valid (untuk Mode)
                validWeights: validWeights, // Bobot valid sesuai validRawData (untuk Mode)
                numericDataForStats: numericDataForStats, // Data valid & terkonversi numerik
                weightsForStats: weightsForStats,         // Bobot valid sesuai numericDataForStats
                totalW: totalW,                           // Total bobot untuk data numerik/konvertibel
                validN: validN                            // Jumlah total kasus valid
            });
        });


        // --- Tahap 2: Kalkulasi Statistik & Buat Baris ---
        const outputRows = [];

        // 1. N (Valid/Missing)
        if (true) { // Selalu tampilkan N
             const validRow = { rowHeader: [null, "Valid"] };
             const missingRow = { rowHeader: [null, "Missing"] };
             variablesToProcess.forEach(varItem => {
                 const varName = varItem.variable.name;
                 const key = variableMap.get(varName).key;
                 validRow[key] = validNMap.get(varName) || 0;
                 missingRow[key] = (totalNMap.get(varName) || 0) - (validNMap.get(varName) || 0);
             });
             outputRows.push({ rowHeader: ["N", null], children: [validRow, missingRow] });
        }

        // Cache hasil kalkulasi untuk digunakan kembali (misal, Mean dipakai Variance, dll)
        const calculatedStatsCache = new Map(); // Map: variableName -> { statName: value, ... }

        // Helper untuk mendapatkan atau mengkalkulasi stat
        const getOrCalculateStat = (varName, statName, calculationFn, ...args) => {
            if (!calculatedStatsCache.has(varName)) {
                calculatedStatsCache.set(varName, {});
            }
            const cache = calculatedStatsCache.get(varName);
            if (cache.hasOwnProperty(statName)) {
                return cache[statName];
            }
            const result = calculationFn(...args);
            cache[statName] = result;
            return result;
        };

        // Definisikan statistik yang akan dijalankan
        const statsToRun = [
            { key: 'mean', option: options.centralTendency?.mean, label: "Mean", requiresNumeric: true, calc: (vm) => calculateMean(vm.numericDataForStats, vm.weightsForStats, vm.totalW), format: (v, vm) => vm.type === 'DATE' ? spssSecondsToDateString(v) : formatNumber(v, vm.decimals || 4) },
            { key: 'seMean', option: options.dispersion?.stdErrorMean, label: "Std. Error of Mean", requiresNumeric: true, calc: (vm) => {
                const stdDev = getOrCalculateStat(vm.key, 'stdDev', calculateStdDev, getOrCalculateStat(vm.key, 'variance', calculateVariance, vm.numericDataForStats, vm.weightsForStats, vm.totalW, getOrCalculateStat(vm.key, 'mean', calculateMean, vm.numericDataForStats, vm.weightsForStats, vm.totalW)));
                return calculateSEMean(stdDev, vm.totalW);
             }, format: (v, vm) => vm.type === 'DATE' ? secondsToDaysHoursMinutesString(v) : formatNumber(v, 5) },
            { key: 'median', option: options.centralTendency?.median, label: "Median", requiresNumeric: true, calc: (vm) => calculateMedian(vm.numericDataForStats, vm.weightsForStats, vm.totalW), format: (v, vm) => vm.type === 'DATE' ? spssSecondsToDateString(v) : formatNumber(v, vm.decimals || 4) },
            // Mode uses original data, not numeric converted data
            { 
                key: 'mode', 
                option: options.centralTendency?.mode, 
                label: "Mode", 
                requiresNumeric: false, // Tetap false karena sekarang dicek tipe, bukan konversi numerik
                calc: (vm) => {
                    // Hanya hitung mode jika tipe variabelnya NUMERIC atau DATE
                    if (vm.type === 'NUMERIC' || vm.type === 'DATE') {
                        return calculateMode(vm.data, weightVariableData, vm.type, vm.missing);
                    }
                    return null; // Jangan hitung mode untuk STRING atau tipe lain
                },
                format: (v, vm) => {
                    if (vm.type === 'DATE') return v; // Mode untuk DATE mengembalikan string tanggal asli
                    return typeof v === 'number' ? formatNumber(v, vm.decimals || 2) : v; // Format angka, atau kembalikan apa adanya
                } 
            },
            { key: 'stdDev', option: options.dispersion?.stddev, label: "Std. Deviation", requiresNumeric: true, calc: (vm) => {
                const mean = getOrCalculateStat(vm.key, 'mean', calculateMean, vm.numericDataForStats, vm.weightsForStats, vm.totalW);
                const variance = getOrCalculateStat(vm.key, 'variance', calculateVariance, vm.numericDataForStats, vm.weightsForStats, vm.totalW, mean);
                return calculateStdDev(variance);
            }, format: (v, vm) => vm.type === 'DATE' ? secondsToDaysHoursMinutesString(v) : formatNumber(v, 3) }, // StdDev untuk DATE adalah durasi
            { key: 'variance', option: options.dispersion?.variance, label: "Variance", requiresNumeric: true, calc: (vm) => {
                const mean = getOrCalculateStat(vm.key, 'mean', calculateMean, vm.numericDataForStats, vm.weightsForStats, vm.totalW);
                return calculateVariance(vm.numericDataForStats, vm.weightsForStats, vm.totalW, mean);
             }, format: (v, vm) => formatNumber(v, 3) },
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
            { key: 'range', option: options.dispersion?.range, label: "Range", requiresNumeric: true, calc: (vm) => {
                const min = getOrCalculateStat(vm.key, 'minimum', calculateMin, vm.numericDataForStats);
                const max = getOrCalculateStat(vm.key, 'maximum', calculateMax, vm.numericDataForStats);
                return calculateRange(min, max);
             }, format: (v, vm) => vm.type === 'DATE' ? secondsToDaysHoursMinutesString(v) : formatNumber(v, vm.decimals || 2) }, // Range for DATE is duration in seconds
            { key: 'minimum', option: options.dispersion?.minimum, label: "Minimum", requiresNumeric: true, calc: (vm) => calculateMin(vm.numericDataForStats), format: (v, vm) => vm.type === 'DATE' ? spssSecondsToDateString(v) : formatNumber(v, vm.decimals || 2) },
            { key: 'maximum', option: options.dispersion?.maximum, label: "Maximum", requiresNumeric: true, calc: (vm) => calculateMax(vm.numericDataForStats), format: (v, vm) => vm.type === 'DATE' ? spssSecondsToDateString(v) : formatNumber(v, vm.decimals || 2) },
            { key: 'sum', option: options.centralTendency?.sum, label: "Sum", requiresNumeric: true, calc: (vm) => calculateSum(vm.numericDataForStats, vm.weightsForStats), format: (v, vm) => vm.type === 'DATE' ? secondsToDaysHoursMinutesString(v) : formatNumber(v, vm.decimals || 2) },
        ];

        // Jalankan kalkulasi yang dipilih
        statsToRun.forEach(statInfo => {
            if (statInfo.option) {
                const row = { rowHeader: [statInfo.label, null] };
                variablesToProcess.forEach(varItem => {
                    const varMeta = variableMap.get(varItem.variable.name);
                    const key = varMeta.key;
                    let result = null;

                    // Periksa tipe dan ketersediaan data yang diperlukan
                    const canCalculate = (
                        (!statInfo.requiresNumeric) || // Mode tidak perlu data numerik spesifik
                        (statInfo.requiresNumeric && (varMeta.type === 'NUMERIC' || varMeta.type === 'DATE') && varMeta.numericDataForStats && varMeta.numericDataForStats.length > 0)
                    );

                    if (canCalculate && typeof statInfo.calc === 'function') {
                        try {
                            // Gunakan helper cache untuk kalkulasi
                            result = getOrCalculateStat(varMeta.key, statInfo.key, statInfo.calc, varMeta);
                        } catch (calcError) {
                            console.error(`Error calculating ${statInfo.label} for ${varMeta.key}:`, calcError);
                            result = null; // Set hasil ke null jika ada error kalkulasi
                        }
                    }

                    // Format hasil
                    row[key] = statInfo.format ? statInfo.format(result, varMeta) : result;
                });
                outputRows.push(row);
            }
        });

        // 3. Percentiles
        if (options.percentileValues?.enablePercentiles || options.percentileValues?.quartiles || (options.percentileValues?.cutPoints && options.percentileValues?.cutPointsN > 1)) {
            const percentileValues = [];
            if (options.percentileValues.quartiles) {
                percentileValues.push(25, 50, 75);
            }
            if (options.percentileValues.cutPoints && options.percentileValues.cutPointsN > 1) {
                const N = options.percentileValues.cutPointsN;
                for (let i = 1; i < N; i++) {
                    percentileValues.push((100 * i) / N);
                }
            }
            if (options.percentileValues.enablePercentiles && options.percentileValues.percentilesList && Array.isArray(options.percentileValues.percentilesList)) {
                options.percentileValues.percentilesList.forEach(pStr => {
                    const pNum = parseFloat(pStr);
                    if (!isNaN(pNum) && pNum > 0 && pNum < 100) {
                        percentileValues.push(pNum);
                    }
                });
            }

            if (percentileValues.length > 0) {
                const uniquePercentiles = [...new Set(percentileValues)].sort((a, b) => a - b);

                const percentileRows = [];
                uniquePercentiles.forEach(p => {
                    // Format persentil agar lebih rapi jika desimal
                    const pLabel = String(p % 1 === 0 ? p : p.toFixed(1)).replace('.0', '');
                    const pRow = { rowHeader: [null, pLabel] };
                    variablesToProcess.forEach(varItem => {
                        const varMeta = variableMap.get(varItem.variable.name);
                        const key = varMeta.key;
                        let result = null;

                        if ((varMeta.type === 'NUMERIC' || varMeta.type === 'DATE') && varMeta.numericDataForStats && varMeta.numericDataForStats.length > 0) {
                            // Panggil calculatePercentile dengan data numerik yang sudah disiapkan
                            if (typeof calculatePercentile === 'function') {
                                result = calculatePercentile(varMeta.numericDataForStats, varMeta.weightsForStats, p / 100, varMeta.totalW);
                            }
                        }

                        // Format hasil (angka atau tanggal)
                        pRow[key] = varMeta.type === 'DATE'
                                        ? spssSecondsToDateString(result)
                                        : formatNumber(result, varMeta.decimals || 4);
                    });
                    percentileRows.push(pRow);
                });
                outputRows.push({ rowHeader: ["Percentiles", null], children: percentileRows });
            }
        }


        // --- Tahap 3: Buat Objek Output Akhir ---
        const descriptiveTable = {
            title: "Statistics", // Judul utama untuk hasil analisis deskriptif secara keseluruhan
            output_data: { // Struktur output_data harus berisi 'tables' array
                tables: [ // Array yang berisi satu tabel deskriptif
                    {
                        title: "Statistik Deskriptif", // Judul spesifik untuk tabel ini
                        columnHeaders: columnHeaders,
                        rows: outputRows
                    }
                ]
            },
            components: ['Descriptive Statistics'],
            description: 'Descriptive statistics summary'
        };

        // Kirim kembali hasil yang sudah diformat
        self.postMessage({ success: true, descriptive: descriptiveTable });

    } catch (error) {
        // Kirim pesan error jika terjadi kesalahan
        self.postMessage({ success: false, error: error.message || "Terjadi kesalahan yang tidak diketahui di Descriptive Worker." });
    }
};