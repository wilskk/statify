// /path/to/your/descriptiveStatsFunctions.js

function getValidDataAndWeights(data, weights) {
    const validData = [];
    const validWeights = weights ? [] : null;
    let totalW = 0;
    let validN = 0;

    for (let i = 0; i < data.length; i++) {
        const dataValue = data[i];
        const isDataMissing = (dataValue === null || dataValue === undefined || dataValue === '');
        const weightValue = weights ? (weights[i] ?? null) : 1;
        const isWeightInvalid = (weightValue === null || weightValue === undefined || weightValue === '' || weightValue <= 0);

        if (!isDataMissing && !isWeightInvalid) {
            validData.push(dataValue);
            if (validWeights) {
                validWeights.push(weightValue);
            }
            totalW += weightValue;
            validN++;
        }
    }
    if (!weights) {
        totalW = validN;
    }
    return { validData, validWeights, totalW, validN };
}

function getTotalValidWeight(data, weights) {
    const { totalW } = getValidDataAndWeights(data, weights);
    return totalW;
}

function getValidN(data, weights) {
    const { validN } = getValidDataAndWeights(data, weights);
    return validN;
}

function calculateSum(data, weights) {
    const { validData, validWeights } = getValidDataAndWeights(data, weights);
    if (validData.length === 0) return 0;
    if (!validWeights) {
        return validData.reduce((sum, val) => sum + val, 0);
    } else {
        return validData.reduce((sum, val, i) => sum + val * validWeights[i], 0);
    }
}

function calculateMean(data, weights) {
    const { totalW } = getValidDataAndWeights(data, weights);
    if (totalW === 0) return null;
    const sum = calculateSum(data, weights);
    return sum / totalW;
}

function calculateVariance(data, weights) {
    const { validData, validWeights, totalW } = getValidDataAndWeights(data, weights);
    if (totalW <= 1) return null;
    const mean = calculateMean(data, weights);
    if (mean === null) return null;
    let sumSqDev = 0;
    if (!validWeights) {
        sumSqDev = validData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    } else {
        sumSqDev = validData.reduce((sum, val, i) => sum + validWeights[i] * Math.pow(val - mean, 2), 0);
    }
    return sumSqDev / (totalW - 1);
}

function calculateStdDev(data, weights) {
    const variance = calculateVariance(data, weights);
    return variance === null || variance < 0 ? null : Math.sqrt(variance);
}

function calculateMin(data) {
    const { validData } = getValidDataAndWeights(data, null);
    if (validData.length === 0) return null;
    return Math.min(...validData);
}

function calculateMax(data) {
    const { validData } = getValidDataAndWeights(data, null);
    if (validData.length === 0) return null;
    return Math.max(...validData);
}

function calculateRange(data) {
    const min = calculateMin(data);
    const max = calculateMax(data);
    return min === null || max === null ? null : max - min;
}

function calculateSEMean(data, weights) {
    const { totalW } = getValidDataAndWeights(data, weights);
    if (totalW <= 1) return null;
    const stdDev = calculateStdDev(data, weights);
    return stdDev === null || totalW <= 0 ? null : stdDev / Math.sqrt(totalW);
}

function calculateSkewness(data, weights) {
    const { validData, validWeights, totalW } = getValidDataAndWeights(data, weights);
    const W = totalW;
    if (W < 3) return null;
    const mean = calculateMean(data, weights);
    const stdDev = calculateStdDev(data, weights);
    if (mean === null || stdDev === null || stdDev <= 1e-15) return null;
    let sumCubedDev = 0;
    if (!validWeights) {
        sumCubedDev = validData.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0);
    } else {
        sumCubedDev = validData.reduce((sum, val, i) => sum + validWeights[i] * Math.pow((val - mean) / stdDev, 3), 0);
    }
    const N = W;
    const denominator = (N - 1) * (N - 2);
    if (denominator === 0) return null;
    return (N / denominator) * sumCubedDev;
}

function calculateKurtosis(data, weights) {
    const { validData, validWeights, totalW } = getValidDataAndWeights(data, weights);
    const W = totalW;
    if (W < 4) return null;
    const mean = calculateMean(data, weights);
    const stdDev = calculateStdDev(data, weights);
    if (mean === null || stdDev === null || stdDev <= 1e-15) return null;
    let sumFourthDev = 0;
    if (!validWeights) {
        sumFourthDev = validData.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0);
    } else {
        sumFourthDev = validData.reduce((sum, val, i) => sum + validWeights[i] * Math.pow((val - mean) / stdDev, 4), 0);
    }
    const N = W;
    const term1Denominator = (N - 1) * (N - 2) * (N - 3);
    const term2Denominator = (N - 2) * (N - 3);
    if (term1Denominator === 0 || term2Denominator === 0) return null;
    const term1 = (N * (N + 1) / term1Denominator) * sumFourthDev;
    const term2 = (3 * Math.pow(N - 1, 2)) / term2Denominator;
    return term1 - term2;
}

function calculateSESkewness(data, weights) {
    const { totalW } = getValidDataAndWeights(data, weights);
    const W = totalW;
    if (W < 3) return null;
    const numerator = 6 * W * (W - 1);
    const denominator = (W - 2) * (W + 1) * (W + 3);
    if (denominator === 0) return null;
    const varianceSkew = numerator / denominator;
    return varianceSkew < 0 ? null : Math.sqrt(varianceSkew);
}

function calculateSEKurtosis(data, weights) {
    const { totalW } = getValidDataAndWeights(data, weights);
    const W = totalW;
    if (W < 4) return null;
    const numerator = 24 * W * Math.pow(W - 1, 2);
    const denominator = (W - 3) * (W - 2) * (W + 3) * (W + 5);
    if (denominator === 0) return null;
    const varianceKurt = numerator / denominator;
    return varianceKurt < 0 ? null : Math.sqrt(varianceKurt);
}

self.onmessage = function(e) {
    try {
        const { variableData, weightVariableData, params /*, saveStandardized */ } = e.data;

        self.importScripts('../statistics.js', '../spssDateConverter.js');

        const outputTable = {
            title: "Descriptive Statistics",
            columnHeaders: [],
            rows: []
        };

        // Dynamically build columnHeaders based on params and user's example structure
        const columnHeaders = [{ "header": "" }]; // For rowHeader (variable name/label)
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
        if (params.skewness) { // Skewness implies both statistic and std. error typically
            skewnessGroupChildren.push({ "header": "Statistic", "key": "skewness_statistic" });
            skewnessGroupChildren.push({ "header": "Std. Error", "key": "skewness_std_error" });
            columnHeaders.push({ "header": "Skewness", "children": skewnessGroupChildren });
        }

        const kurtosisGroupChildren = [];
        if (params.kurtosis) { // Kurtosis implies both statistic and std. error
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

            // Initialize keys based on columnHeaders to ensure they exist if a stat is requested
            outputTable.columnHeaders.forEach(ch => {
                if (ch.key) rowData[ch.key] = null;
                if (ch.children) {
                    ch.children.forEach(child => { if (child.key) rowData[child.key] = null; });
                }
            });
            
            const {
                validRawData: initialValidRawData,
                validWeights,
                totalW, // This totalW from statistics.js is sum of weights for numerically convertible values
                validN
            } = self.getValidDataAndWeights(rawDataArray, weightVariableData, variableType, missingDefinition);

            rowData.n = validN;

            if (validN > 0 && (variableType === 'NUMERIC' || variableType === 'DATE')) {
                let dataForNumericStats = [];
                if (variableType === 'NUMERIC') {
                    dataForNumericStats = initialValidRawData.map(val => {
                        if (typeof val === 'string') {
                            const num = parseFloat(val);
                            return isNaN(num) ? null : num; // Functions in statistics.js will filter NaNs/nulls
                        }
                        return val; // Pass numbers and nulls as is
                    });
                } else if (variableType === 'DATE') {
                    dataForNumericStats = initialValidRawData.map(val =>
                        typeof val === 'string' ? self.dateStringToSpssSeconds(val) : null
                    );
                }

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

                if (variableType === 'DATE') {
                    if (params.range && rowData.hasOwnProperty('range')) rowData.range = (range !== null) ? self.secondsToDaysHoursMinutesString(range) : null;
                    if (params.minimum && rowData.hasOwnProperty('minimum')) rowData.minimum = (minimum !== null) ? self.spssSecondsToDateString(minimum) : null;
                    if (params.maximum && rowData.hasOwnProperty('maximum')) rowData.maximum = (maximum !== null) ? self.spssSecondsToDateString(maximum) : null;
                    if (params.sum && rowData.hasOwnProperty('sum')) rowData.sum = (sum !== null) ? self.secondsToDaysHoursMinutesString(sum) : null;
                    if (params.mean && rowData.hasOwnProperty('mean_statistic')) rowData.mean_statistic = (mean !== null) ? self.spssSecondsToDateString(mean) : null;
                    if (params.standardError && rowData.hasOwnProperty('mean_std_error')) rowData.mean_std_error = (seMean !== null) ? self.secondsToDaysHoursMinutesString(seMean) : null;
                    if (params.median && rowData.hasOwnProperty('median_statistic')) rowData.median_statistic = (median !== null) ? self.spssSecondsToDateString(median) : null;
                    if (params.stdDev && rowData.hasOwnProperty('std_deviation')) rowData.std_deviation = (stdDev !== null) ? self.secondsToDaysHoursMinutesString(stdDev) : null;
                    if (params.variance && rowData.hasOwnProperty('variance')) rowData.variance = variance;
                } else { // NUMERIC
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
        // Helper to check missing based on statistics.js internal logic (simplified for this context)
        function isValueMissing(value, type, definition) {
            if (value === "" && (type === 'NUMERIC' || type === 'DATE')) return true;
            if (value === null || value === undefined) return true;
            if (!definition) return false;

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
            if ((type === 'NUMERIC' || type === 'DATE') && definition.range) { // DATE also uses numeric range for missings
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
            const numCases = variableData[0].data.length; // Assume all data arrays have same length
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
        // Fill other stat cells with null for listwise row, or leave as is if rowData init covers it
         outputTable.columnHeaders.forEach(ch => {
            if (ch.key && ch.key !== 'n') listwiseRow[ch.key] = null;
            if (ch.children) {
                ch.children.forEach(child => { if (child.key) listwiseRow[child.key] = null; });
            }
        });
        outputTable.rows.push(listwiseRow);

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