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