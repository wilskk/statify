/**
 * @file /libs/descriptives.js
 * @description
 * Utility functions for calculating descriptive statistics
 * for nonparametric tests.
 */

import { checkIsMissing, isNumeric } from './utils.js';

/**
 * Calculate descriptive statistics for a variable
 * @param {Object} params - Parameters for calculation
 * @param {Object} params.variable - Variable definition
 * @param {Array} params.data - Data array
 * @param {Object} params.options - Options for calculation
 * @returns {Object} Descriptive statistics
 */
export function calculateDescriptives({ variable, data, options = {} }) {
    if (!variable || !data) {
        return null;
    }
    
    const isNumericType = ['scale', 'date'].includes(variable.measure);
    const displayStatistics = options.displayStatistics || { descriptive: false, quartiles: false };
    
    if (!displayStatistics.descriptive && !displayStatistics.quartiles) {
        return null;
    }
    
    // Filter valid data
    const validData = data
        .filter(value => !checkIsMissing(value, variable.missing, isNumericType) && isNumeric(value))
        .map(value => parseFloat(value));
    
    if (validData.length === 0) {
        return null;
    }
    
    // Calculate basic statistics
    const n = validData.length;
    const sum = validData.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;
    const min = Math.min(...validData);
    const max = Math.max(...validData);
    
    const stats = {
        N: data.length,
        Valid: n,
        Missing: data.length - n,
        Mean: mean,
        Minimum: min,
        Maximum: max
    };
    
    // Calculate additional descriptive statistics if needed
    if (displayStatistics.descriptive) {
        const sumSquaredDeviations = validData.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
        const variance = sumSquaredDeviations / (n - 1);
        const stdDev = Math.sqrt(variance);
        
        stats.StdDev = stdDev;
        stats.SEMean = stdDev / Math.sqrt(n);
        stats.Variance = variance;
    }
    
    // Calculate quartiles if needed
    if (displayStatistics.quartiles) {
        const sortedData = [...validData].sort((a, b) => a - b);
        
        const getPercentile = (arr, p) => {
            const index = (p / 100) * (arr.length - 1);
            if (Number.isInteger(index)) {
                return arr[index];
            } else {
                const lowerIndex = Math.floor(index);
                const upperIndex = Math.ceil(index);
                const weight = index - lowerIndex;
                return arr[lowerIndex] * (1 - weight) + arr[upperIndex] * weight;
            }
        };
        
        stats.Percentile25 = getPercentile(sortedData, 25);
        stats.Percentile50 = getPercentile(sortedData, 50); // Median
        stats.Percentile75 = getPercentile(sortedData, 75);
    }
    
    return {
        variable,
        stats
    };
}

export default calculateDescriptives; 