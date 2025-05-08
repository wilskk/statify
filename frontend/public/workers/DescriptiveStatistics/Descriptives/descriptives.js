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

self.onmessage = function(e) {
    try {
        // Destructure data input.
        const { variableData, weightVariableData, params /*, saveStandardized */ } = e.data;

        const outputTable = {
            title: "Descriptive Statistics",
            columnHeaders: [],
            rows: []
        };

        // Bangun `columnHeaders` secara dinamis berdasarkan `params`.
        const columnHeaders = [{ "header": "" }]; // Untuk rowHeader (nama/label variabel).
        columnHeaders.push({ "header": "N", "key": "n" });
        if (params.range) columnHeaders.push({ "header": "Range", "key": "range" });
        if (params.minimum) columnHeaders.push({ "header": "Minimum", "key": "minimum" });
        if (params.maximum) columnHeaders.push({ "header": "Maximum", "key": "maximum" });
        if (params.sum) columnHeaders.push({ "header": "Sum", "key": "sum" });

        const meanGroupChildren = [];
        if (params.mean) meanGroupChildren.push({ "header": "Statistic", "key": "mean_statistic" });
        if (params.standardError) meanGroupChildren.push({ "header": "Std. Error", "key": "mean_std_error" });
        if (meanGroupChildren.length > 0) columnHeaders.push({ "header": "Mean", "children": meanGroupChildren });
        
        if (params.median) columnHeaders.push({ "header": "Median", "key": "median_statistic" });
        if (params.stdDev) columnHeaders.push({ "header": "Std. Deviation", "key": "std_deviation" });
        if (params.variance) columnHeaders.push({ "header": "Variance", "key": "variance" });

        const skewnessGroupChildren = [];
        // Jika skewness diminta, biasanya termasuk statistik & std. error.
        if (params.skewness) {
            skewnessGroupChildren.push({ "header": "Statistic", "key": "skewness_statistic" });
            skewnessGroupChildren.push({ "header": "Std. Error", "key": "skewness_std_error" });
            columnHeaders.push({ "header": "Skewness", "children": skewnessGroupChildren });
        }

        const kurtosisGroupChildren = [];
        // Jika kurtosis diminta, biasanya termasuk statistik & std. error.
        if (params.kurtosis) {
            kurtosisGroupChildren.push({ "header": "Statistic", "key": "kurtosis_statistic" });
            kurtosisGroupChildren.push({ "header": "Std. Error", "key": "kurtosis_std_error" });
            columnHeaders.push({ "header": "Kurtosis", "children": kurtosisGroupChildren });
        }
        outputTable.columnHeaders = columnHeaders;

        for (const varInstance of variableData) {
            const currentVariable = varInstance.variable;
            const rawDataArray = varInstance.data;
            const variableType = currentVariable.type;
            const missingDefinition = currentVariable.missing_values;

            const rowData = { rowHeader: [currentVariable.label || currentVariable.name] };

            // Inisialisasi semua key statistik di `rowData` agar ada meski nilainya null.
            outputTable.columnHeaders.forEach(ch => {
                if (ch.key) rowData[ch.key] = null;
                if (ch.children) {
                    ch.children.forEach(child => { if (child.key) rowData[child.key] = null; });
                }
            });
            
            const {
                validRawData: initialValidRawData,
                validWeights,
                totalW, // totalW dari statistics.js: jumlah bobot untuk nilai numerik/konvertibel.
                validN
            } = self.getValidDataAndWeights(rawDataArray, weightVariableData, variableType, missingDefinition);

            rowData.n = validN;

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

                // Kalkulasi statistik yang diminta.
                const mean = params.mean ? self.calculateMean(dataForNumericStats, validWeights, totalW) : null;
                const variance = (params.variance && mean !== null) ? self.calculateVariance(dataForNumericStats, validWeights, totalW, mean) : null;
                const stdDev = (params.stdDev && variance !== null) ? self.calculateStdDev(variance) : null;
                const minimum = params.minimum ? self.calculateMin(dataForNumericStats) : null;
                const maximum = params.maximum ? self.calculateMax(dataForNumericStats) : null;
                const range = (params.range && minimum !== null && maximum !== null) ? self.calculateRange(minimum, maximum) : null;
                const sum = params.sum ? self.calculateSum(dataForNumericStats, validWeights) : null;
                const seMean = (params.standardError && stdDev !== null && totalW > 0) ? self.calculateSEMean(stdDev, totalW) : null;
                const median = params.median ? self.calculateMedian(dataForNumericStats, validWeights, totalW) : null;
                
                const skewnessStat = (params.skewness && mean !== null && stdDev !== null && totalW > 0) ? self.calculateSkewness(dataForNumericStats, validWeights, totalW, mean, stdDev) : null;
                const seSkewness = (params.skewness && skewnessStat !== null && totalW > 0) ? self.calculateSESkewness(totalW) : null;
                const kurtosisStat = (params.kurtosis && mean !== null && stdDev !== null && totalW > 0) ? self.calculateKurtosis(dataForNumericStats, validWeights, totalW, mean, stdDev) : null;
                const seKurtosis = (params.kurtosis && kurtosisStat !== null && totalW > 0) ? self.calculateSEKurtosis(totalW) : null;

                // Format hasil statistik untuk tipe DATE.
                if (variableType === 'DATE') {
                    if (params.range && rowData.hasOwnProperty('range')) rowData.range = (range !== null) ? self.secondsToDaysHoursMinutesString(range) : null;
                    if (params.minimum && rowData.hasOwnProperty('minimum')) rowData.minimum = (minimum !== null) ? self.spssSecondsToDateString(minimum) : null;
                    if (params.maximum && rowData.hasOwnProperty('maximum')) rowData.maximum = (maximum !== null) ? self.spssSecondsToDateString(maximum) : null;
                    if (params.sum && rowData.hasOwnProperty('sum')) rowData.sum = (sum !== null) ? self.secondsToDaysHoursMinutesString(sum) : null;
                    if (params.mean && rowData.hasOwnProperty('mean_statistic')) rowData.mean_statistic = (mean !== null) ? self.spssSecondsToDateString(mean) : null;
                    if (params.standardError && rowData.hasOwnProperty('mean_std_error')) rowData.mean_std_error = (seMean !== null) ? self.secondsToDaysHoursMinutesString(seMean) : null;
                    if (params.median && rowData.hasOwnProperty('median_statistic')) rowData.median_statistic = (median !== null) ? self.spssSecondsToDateString(median) : null;
                    if (params.stdDev && rowData.hasOwnProperty('std_deviation')) rowData.std_deviation = (stdDev !== null) ? self.secondsToDaysHoursMinutesString(stdDev) : null;
                    // Variance tidak diformat khusus untuk DATE.
                    if (params.variance && rowData.hasOwnProperty('variance')) rowData.variance = variance;
                } else { // NUMERIC
                    // Isi hasil statistik untuk tipe NUMERIC.
                    if (params.range && rowData.hasOwnProperty('range')) rowData.range = range;
                    if (params.minimum && rowData.hasOwnProperty('minimum')) rowData.minimum = minimum;
                    if (params.maximum && rowData.hasOwnProperty('maximum')) rowData.maximum = maximum;
                    if (params.sum && rowData.hasOwnProperty('sum')) rowData.sum = sum;
                    if (params.mean && rowData.hasOwnProperty('mean_statistic')) rowData.mean_statistic = mean;
                    if (params.standardError && rowData.hasOwnProperty('mean_std_error')) rowData.mean_std_error = seMean;
                    if (params.median && rowData.hasOwnProperty('median_statistic')) rowData.median_statistic = median;
                    if (params.stdDev && rowData.hasOwnProperty('std_deviation')) rowData.std_deviation = stdDev;
                    if (params.variance && rowData.hasOwnProperty('variance')) rowData.variance = variance;
                }

                // Isi hasil Skewness & Kurtosis jika diminta.
                if (params.skewness) {
                    if(rowData.hasOwnProperty('skewness_statistic')) rowData.skewness_statistic = skewnessStat;
                    if(rowData.hasOwnProperty('skewness_std_error')) rowData.skewness_std_error = seSkewness;
                }
                if (params.kurtosis) {
                    if(rowData.hasOwnProperty('kurtosis_statistic')) rowData.kurtosis_statistic = kurtosisStat;
                    if(rowData.hasOwnProperty('kurtosis_std_error')) rowData.kurtosis_std_error = seKurtosis;
                }
            }
            outputTable.rows.push(rowData);
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
        
        const listwiseRow = { rowHeader: ["Valid N (listwise)"], n: listwiseValidN };
        // Isi sel statistik lain dengan null untuk baris listwise.
         outputTable.columnHeaders.forEach(ch => {
            if (ch.key && ch.key !== 'n') listwiseRow[ch.key] = null;
            if (ch.children) {
                ch.children.forEach(child => { if (child.key) listwiseRow[child.key] = null; });
            }
        });
        outputTable.rows.push(listwiseRow);

        // Kirim hasil kembali ke thread utama.
        self.postMessage({
            success: true,
            statistics: {
                title: "Descriptive Statistics",
                output_data: { tables: [outputTable] },
                components: "DescriptiveStatisticsTable",
                description: `Descriptive statistics calculated for ${variableData.length} variable(s).`
            }
        });

    } catch (error) {
        console.error("Error in Descriptives worker:", error);
        self.postMessage({ success: false, error: error.message + (error.stack ? `\nStack: ${error.stack}` : '') });
    }
};