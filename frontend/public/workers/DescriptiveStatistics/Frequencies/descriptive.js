// /workers/DescriptiveStatistics/Frequencies/descriptive.js

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


self.onmessage = function(event) {
    try {
        const { variableData, weightVariableData, options } = event.data;

        if (!variableData || !Array.isArray(variableData) || !options) {
            throw new Error("Struktur input data tidak valid atau options hilang.");
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

            let numericData = null;
            const processedData = []; // Data asli (dengan null untuk invalid/missing awal)
            const weightsForCalc = []; // Bobot yang sesuai dengan processedData

            // Hitung N Valid & N Missing, siapkan data numerik menggunakan definisi missing yang diperbarui
             const { validRawData, validWeights, totalW, validN } = getValidDataAndWeights(data, weightVariableData, varType, missingDef); // Pass type and missing def
             validNMap.set(variable.name, validN);
             totalNMap.set(variable.name, data.length); // Total observasi awal


             // Proses data untuk perhitungan statistik
            if (variable.type === 'NUMERIC' || variable.type === 'DATE') {
                numericData = [];
                const originalValidData = []; // Untuk menyimpan data valid sebelum konversi

                for (let i = 0; i < data.length; i++) {
                    const rawValue = data[i];
                     // Gunakan checkMissing dari frequency worker (jika tersedia) atau logika serupa
                     // Untuk sederhana, kita gunakan getValidDataAndWeights saja
                     // Check data validity for calculations (non-null, non-empty)
                     const weight = weightVariableData ? (weightVariableData[i] ?? null) : 1;
                     const isDataMissingOrInvalid = (rawValue === null || rawValue === undefined || rawValue === '');
                     const isWeightInvalid = (weight === null || typeof weight !== 'number' || isNaN(weight) || weight <= 0);


                     if (!isDataMissingOrInvalid && !isWeightInvalid) {
                         let valueForCalc = null;
                         if (variable.type === 'DATE') {
                             valueForCalc = dateStringToSpssSeconds(rawValue);
                         } else { // NUMERIC
                             valueForCalc = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
                             if (isNaN(valueForCalc)) valueForCalc = null;
                         }

                         if (valueForCalc !== null) {
                             numericData.push(valueForCalc);
                             originalValidData.push(rawValue); // Simpan data asli yg valid
                             // Bobot sudah difilter oleh getValidDataAndWeights
                         }
                     }
                }
                 // Pastikan validWeights dari getValidDataAndWeights sesuai dengan numericData
                 // Ini asumsi getValidDataAndWeights hanya memfilter berdasarkan data dan bobot,
                 // dan tipe DATE/NUMERIC akan valid jika tidak null/kosong.
                 // Perlu penyesuaian jika getValidDataAndWeights lebih kompleks.
                 // Untuk sekarang, kita kalkulasi ulang data valid numerik saja
                  numericData = [];
                  const numericValidWeights = validWeights ? [] : null;
                  for (let i = 0; i < validRawData.length; i++) {
                      const val = validRawData[i];
                       let valueForCalc = null;
                       if (variable.type === 'DATE') {
                           valueForCalc = dateStringToSpssSeconds(val);
                       } else if (typeof val === 'number' && !isNaN(val)) {
                            valueForCalc = val;
                       } else if (typeof val === 'string') { // Coba parse string angka
                           const parsed = parseFloat(val);
                           if (!isNaN(parsed)) valueForCalc = parsed;
                       }

                       if (valueForCalc !== null) {
                           numericData.push(valueForCalc);
                           if (numericValidWeights && validWeights) {
                               numericValidWeights.push(validWeights[i]);
                           }
                       }
                  }


            } else {
                 // Untuk STRING, kita hanya perlu data valid asli untuk Mode
                 numericData = validRawData; // Mode function handles strings
            }


            variableMap.set(variable.name, {
                key: key,
                type: variable.type,
                missing: missingDef, // Store missing def for later use
                decimals: variable.decimals,
                data: data, // Data asli lengkap
                numericData: numericData, // Data numerik valid (atau string valid untuk mode)
                validWeights: validWeights, // Bobot valid sesuai validRawData
            });
        });


        // --- Tahap 2: Kalkulasi Statistik & Buat Baris ---
        const outputRows = [];

        // 1. N (Valid/Missing)
        if (true) { // Selalu tampilkan N
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


        // Mapping opsi ke fungsi dan label baris
        const statsToRun = [
            { option: options.centralTendency?.mean, func: 'calculateMean', label: "Mean", requiresNumeric: true, formatResult: (v, vd) => formatNumber(v, vd.decimals || 4) },
            { option: options.dispersion?.stdErrorMean, func: 'calculateSEMean', label: "Std. Error of Mean", requiresNumeric: true, formatResult: (v, vd) => formatNumber(v, 5) },
            { option: options.centralTendency?.median, func: 'calculateMedian', label: "Median", requiresNumeric: true, formatResult: (v, vd) => vd.type === 'DATE' ? spssSecondsToDateString(v) : formatNumber(v, vd.decimals || 4) },
            { option: options.centralTendency?.mode, func: 'calculateMode', label: "Mode", requiresNumeric: false, formatResult: (v, vd) => vd.type === 'DATE' ? spssSecondsToDateString(v) : (typeof v === 'number' ? formatNumber(v, vd.decimals || 2) : v) },
            { option: options.dispersion?.stddev, func: 'calculateStdDev', label: "Std. Deviation", requiresNumeric: true, formatResult: (v, vd) => formatNumber(v, 5) },
            { option: options.dispersion?.variance, func: 'calculateVariance', label: "Variance", requiresNumeric: true, formatResult: (v, vd) => formatNumber(v, 3) },
            { option: options.distribution?.skewness, func: 'calculateSkewness', label: "Skewness", requiresNumeric: true, formatResult: (v, vd) => formatNumber(v, 3) },
            { option: options.distribution?.stdErrorSkewness, func: 'calculateSESkewness', label: "Std. Error of Skewness", requiresNumeric: true, formatResult: (v, vd) => formatNumber(v, 3) },
            { option: options.distribution?.kurtosis, func: 'calculateKurtosis', label: "Kurtosis", requiresNumeric: true, formatResult: (v, vd) => formatNumber(v, 3) },
            { option: options.distribution?.stdErrorKurtosis, func: 'calculateSEKurtosis', label: "Std. Error of Kurtosis", requiresNumeric: true, formatResult: (v, vd) => formatNumber(v, 3) },
            { option: options.dispersion?.range, func: 'calculateRange', label: "Range", requiresNumeric: true, formatResult: (v, vd) => vd.type === 'DATE' ? null : formatNumber(v, vd.decimals || 2) },
            { option: options.dispersion?.minimum, func: 'calculateMin', label: "Minimum", requiresNumeric: true, formatResult: (v, vd) => vd.type === 'DATE' ? spssSecondsToDateString(v) : formatNumber(v, vd.decimals || 2) },
            { option: options.dispersion?.maximum, func: 'calculateMax', label: "Maximum", requiresNumeric: true, formatResult: (v, vd) => vd.type === 'DATE' ? spssSecondsToDateString(v) : formatNumber(v, vd.decimals || 2) },
            { option: options.centralTendency?.sum, func: 'calculateSum', label: "Sum", requiresNumeric: true, formatResult: (v, vd) => vd.type === 'DATE' ? null : formatNumber(v, vd.decimals || 2) },
        ];

        statsToRun.forEach(statInfo => {
            if (statInfo.option) {
                const row = { rowHeader: [statInfo.label, null] };
                variablesToProcess.forEach(varItem => {
                    const varMeta = variableMap.get(varItem.variable.name);
                    const key = varMeta.key;
                    let result = null;

                    if (statInfo.requiresNumeric && (varMeta.type === 'NUMERIC' || varMeta.type === 'DATE') && varMeta.numericData && varMeta.numericData.length > 0) {
                         // Gunakan numericData yang sudah valid dan terkonversi (untuk DATE)
                         // dan bobot yang sesuai
                         // Perlu memastikan bobot yang dikirim ke fungsi stat sinkron dengan numericData
                         const dataForCalc = varMeta.numericData;
                         const weightsForCalc = varMeta.validWeights; // Asumsi ini sesuai numericData
                         const typeForCalc = varMeta.type;
                         const missingForCalc = varMeta.missing;

                         // Panggil fungsi statistik (misal, calculateMean) langsung karena global
                         // Periksa ketersediaan fungsi di scope global
                         if (typeof self[statInfo.func] === 'function') {
                            result = self[statInfo.func](varMeta.data, weightVariableData, typeForCalc, missingForCalc);
                         }

                    } else if (!statInfo.requiresNumeric && varMeta.data && varMeta.data.length > 0) { // Untuk Mode
                        // Mode juga perlu type dan missing def untuk filter internalnya
                        const typeForCalc = varMeta.type;
                        const missingForCalc = varMeta.missing;
                        if (typeof self[statInfo.func] === 'function') {
                             result = self[statInfo.func](varMeta.data, weightVariableData, typeForCalc, missingForCalc); // Mode handles types internally
                        }
                    }

                    // Format hasil sesuai kebutuhan (angka atau tanggal)
                    row[key] = statInfo.formatResult ? statInfo.formatResult(result, varMeta) : result;
                });
                outputRows.push(row);
            }
        });

        // 3. Percentiles
        if (options.percentileValues?.enablePercentiles) {
            const percentileValues = [];
            if (options.percentileValues.quartiles) {
                percentileValues.push(25, 50, 75);
            }
            if (options.percentileValues.cutPoints && options.percentileValues.cutPointsN > 0) {
                const nCuts = options.percentileValues.cutPointsN;
                for (let i = 1; i <= nCuts; i++) {
                    percentileValues.push((100 * i) / (nCuts + 1));
                }
            }
            if (options.percentileValues.percentilesList && Array.isArray(options.percentileValues.percentilesList)) {
                 options.percentileValues.percentilesList.forEach(pStr => {
                     const pNum = parseFloat(pStr);
                     if (!isNaN(pNum) && pNum > 0 && pNum < 100) {
                         percentileValues.push(pNum);
                     }
                 });
            }

            // Unikkan dan urutkan persentil
            const uniquePercentiles = [...new Set(percentileValues)].sort((a, b) => a - b);

            if (uniquePercentiles.length > 0) {
                const percentileRows = [];
                uniquePercentiles.forEach(p => {
                     // Format persentil agar lebih rapi jika desimal
                     const pLabel = String(p % 1 === 0 ? p : p.toFixed(1)).replace('.0', '');
                     const pRow = { rowHeader: [null, pLabel] };
                     variablesToProcess.forEach(varItem => {
                        const varMeta = variableMap.get(varItem.variable.name);
                        const key = varMeta.key;
                        let result = null;

                        if ((varMeta.type === 'NUMERIC' || varMeta.type === 'DATE') && varMeta.numericData && varMeta.numericData.length > 0) {
                             const dataForCalc = varMeta.numericData;
                             const weightsForCalc = varMeta.validWeights;
                             const typeForCalc = varMeta.type;
                             const missingForCalc = varMeta.missing;
                             if (typeof calculatePercentile === 'function') {
                                result = calculatePercentile(varMeta.data, weightVariableData, p / 100, typeForCalc, missingForCalc);
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