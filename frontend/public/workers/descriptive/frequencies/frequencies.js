// frequencies.js

/**
 * Computes frequency statistics for a given dataset.
 * This script is designed to be used in a Web Worker environment.
 */

self.onmessage = function(event) {
    const data = event.data;
    if (!Array.isArray(data) || data.length === 0) {
        self.postMessage({ error: "Input must be a non-empty array of numbers." });
        return;
    }

    // Filter for valid numbers and check constraints 
    const cleanData = [];
    for (const val of data) {
        if (typeof val === 'number' && isFinite(val)) {
            if (Math.abs(val) > 1e13) {
                self.postMessage({ error: `Value ${val} exceeds the absolute limit of 1e13.` });
                return;
            }
            cleanData.push(val);
        }
    }

    if (cleanData.length === 0) {
        self.postMessage({ error: "No valid numeric data found." });
        return;
    }

    // Assuming unweighted cases as per common use case
    const N = cleanData.length;
    const W = N; // Sum of weights is N for unweighted data 

    // Calculate frequency of each distinct value 
    const frequencyMap = new Map();
    for (const val of cleanData) {
        frequencyMap.set(val, (frequencyMap.get(val) || 0) + 1);
    }
    
    // Create sorted frequency table
    const sortedValues = Array.from(frequencyMap.keys()).sort((a, b) => a - b);
    const NV = sortedValues.length; // Number of distinct values 

    let cumulativeFreq = 0;
    const frequencyTable = sortedValues.map(value => {
        const f_j = frequencyMap.get(value);
        cumulativeFreq += f_j;
        return {
            value: value,
            frequency: f_j, // f_j 
            relativePercent: (f_j / W) * 100, // Rf_j, assuming no missing values 
            adjustedPercent: (f_j / W) * 100, // Af_j, assuming no missing values 
            cumulativePercent: (cumulativeFreq / W) * 100, // Based on Cf_j 
        };
    });

    // --- Basic Statistics ---
    const min = sortedValues[0]; // Minimum 
    const max = sortedValues[NV - 1]; // Maximum 
    const range = max - min; // Range 

    // Mode 
    const mode = frequencyTable.reduce((a, b) => (a.frequency >= b.frequency ? a : b)).value;

    // Mean 
    const mean = frequencyTable.reduce((sum, item) => sum + item.value * item.frequency, 0) / W;

    // Moments about the mean 
    let M2 = 0;
    let M3 = 0;
    let M4 = 0;
    for (const item of frequencyTable) {
        const dev = item.value - mean;
        M2 += item.frequency * Math.pow(dev, 2);
        M3 += item.frequency * Math.pow(dev, 3);
        M4 += item.frequency * Math.pow(dev, 4);
    }

    // Variance & Std Dev 
    const variance = (W > 1) ? M2 / (W - 1) : 0;
    const stdDev = Math.sqrt(variance);

    // Standard Error of the Mean 
    const stdErrMean = stdDev / Math.sqrt(W);

    // Skewness 
    let skewness = null;
    let seSkewness = null;
    if (W >= 3 && variance > 0) {
        skewness = (W * M3) / ((W - 1) * (W - 2) * Math.pow(stdDev, 3));
        seSkewness = Math.sqrt((6 * W * (W - 1)) / ((W - 2) * (W + 1) * (W + 3)));
    }

    // Kurtosis 
    let kurtosis = null;
    let seKurtosis = null;
    if (W >= 4 && variance > 0) {
        const term1 = W * (W + 1) * M4;
        const term2 = 3 * (W - 1) * Math.pow(M2, 2);
        const denominator = (W - 1) * (W - 2) * (W - 3) * Math.pow(stdDev, 4);
        kurtosis = (term1 - term2) / denominator;
        if (seSkewness !== null) {
            seKurtosis = Math.sqrt((4 * (Math.pow(W, 2) - 1) * Math.pow(seSkewness, 2)) / ((W - 3) * (W + 5)));
        }
    }

    self.postMessage({
        statistics: {
            n: W,
            min,
            max,
            range,
            mean,
            mode,
            stdErrMean,
            stdDev,
            variance,
            skewness,
            seSkewness,
            kurtosis,
            seKurtosis,
        },
        frequencyTable,
    });
};