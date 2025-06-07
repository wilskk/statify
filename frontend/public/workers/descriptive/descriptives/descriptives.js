// descriptives.js

/**
 * Computes univariate statistics for a given dataset.
 * This script is designed to be used in a Web Worker environment.
 * It receives an array of numbers and returns an object with descriptive statistics.
 */

self.onmessage = function(event) {
    const data = event.data;
    if (!Array.isArray(data) || data.length === 0) {
      self.postMessage({ error: "Input must be a non-empty array of numbers." });
      return;
    }
  
    // Filter out non-numeric and non-finite values
    const numericData = data.filter(item => typeof item === 'number' && isFinite(item));
  
    if (numericData.length === 0) {
      self.postMessage({ error: "No valid numeric data found." });
      return;
    }
  
    const n = numericData.length;
    const weights = Array(n).fill(1); // Assuming unweighted data as per common use case
  
    // --- Core Calculations ---
    const sumOfWeights = weights.reduce((a, b) => a + b, 0);
  
    // Mean 
    const mean = numericData.reduce((sum, val, i) => sum + val * weights[i], 0) / sumOfWeights;
  
    // Moments about the mean 
    let M2 = 0;
    let M3 = 0;
    let M4 = 0;
  
    for (let i = 0; i < n; i++) {
      const dev = numericData[i] - mean;
      M2 += weights[i] * Math.pow(dev, 2);
      M3 += weights[i] * Math.pow(dev, 3);
      M4 += weights[i] * Math.pow(dev, 4);
    }
  
    // --- Basic Statistics ---
    // Variance 
    const variance = (n > 1) ? M2 / (sumOfWeights - 1) : 0;
  
    // Standard Deviation 
    const stdDev = (variance > 0) ? Math.sqrt(variance) : 0;
  
    // Standard Error of the Mean 
    const stdErr = (stdDev > 0) ? stdDev / Math.sqrt(sumOfWeights) : 0;
  
    // Sum 
    const sum = mean * sumOfWeights;
  
    // Minimum & Maximum 
    const min = Math.min(...numericData);
    const max = Math.max(...numericData);
  
    // --- Skewness ---
    let skewness = null;
    let seSkewness = null;
    // 
    if (sumOfWeights > 2 && variance > 1e-20) {
      // 
      skewness = (sumOfWeights * M3) / ((sumOfWeights - 1) * (sumOfWeights - 2) * Math.pow(stdDev, 3));
      // 
      seSkewness = Math.sqrt((6 * sumOfWeights * (sumOfWeights - 1)) / ((sumOfWeights - 2) * (sumOfWeights + 1) * (sumOfWeights + 3)));
    }
  
    // --- Kurtosis ---
    let kurtosis = null;
    let seKurtosis = null;
    // 
    if (sumOfWeights > 3 && variance > 1e-20) {
      const term1 = sumOfWeights * (sumOfWeights + 1) * M4;
      const term2 = 3 * Math.pow(M2, 2) * (sumOfWeights - 1);
      const denominator = (sumOfWeights - 1) * (sumOfWeights - 2) * (sumOfWeights - 3) * Math.pow(stdDev, 4);
      // 
      kurtosis = (term1 - term2) / denominator;
      if (seSkewness !== null) {
          // 
          seKurtosis = Math.sqrt((4 * (Math.pow(sumOfWeights, 2) - 1) * Math.pow(seSkewness, 2)) / ((sumOfWeights - 3) * (sumOfWeights + 5)));
      }
    }
    
    // Z-Scores 
    const zScores = (stdDev > 0) ? numericData.map(x => (x - mean) / stdDev) : numericData.map(() => null);
  
  
    self.postMessage({
      n: sumOfWeights,
      min,
      max,
      sum,
      mean,
      variance,
      stdDev,
      stdErr,
      skewness,
      seSkewness,
      kurtosis,
      seKurtosis,
      zScores,
    });
  };