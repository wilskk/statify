/**
 * @file /libs/frequencies.js
 * @description
 * Utility functions for calculating frequency tables
 * for nonparametric tests.
 */

import { checkIsMissing, isNumeric } from './utils.js';

/**
 * Calculate frequencies for a variable
 * @param {Object} params - Parameters for calculation
 * @param {Object} params.variable - Variable definition
 * @param {Array} params.data - Data array
 * @param {Object} params.options - Options for calculation
 * @returns {Object} Frequency table
 */
export function calculateFrequencies({ variable, data, options = {} }) {
    if (!variable || !data) {
        return null;
    }
    
    const isNumericType = ['scale', 'date'].includes(variable.measure);
    const expectedRange = options.expectedRange || { getFromData: true, useSpecifiedRange: false };
    const rangeValue = options.rangeValue || { lowerValue: null, upperValue: null };
    const expectedValue = options.expectedValue || { allCategoriesEqual: true, values: false, inputValue: null };
    const expectedValueList = options.expectedValueList || [];
    
    // Filter valid data
    let validData = data
        .filter(value => !checkIsMissing(value, variable.missing, isNumericType) && isNumeric(value))
        .map(value => parseFloat(value));
    
    // Apply range filter if specified
    if (expectedRange.useSpecifiedRange && 
        rangeValue.lowerValue !== null && 
        rangeValue.upperValue !== null) {
        validData = validData
            .map(value => Math.floor(value))
            .filter(value => value >= rangeValue.lowerValue && value <= rangeValue.upperValue);
    }
    
    if (validData.length === 0) {
        return null;
    }
    
    // Count frequencies
    const observedN = {};
    validData.forEach(value => {
        observedN[value] = (observedN[value] || 0) + 1;
    });
    
    // Get category list
    let categoryList;
    if (expectedRange.useSpecifiedRange && 
        rangeValue.lowerValue !== null && 
        rangeValue.upperValue !== null) {
        categoryList = Array.from(
            { length: rangeValue.upperValue - rangeValue.lowerValue + 1 }, 
            (_, i) => rangeValue.lowerValue + i
        );
    } else {
        categoryList = Object.keys(observedN).map(Number).sort((a, b) => a - b);
    }
    
    const countCategories = categoryList.length;
    
    // Calculate expected frequencies
    let expectedN;
    if (expectedValue.values) {
        if (expectedValueList.length !== countCategories) {
            return null;
        }
        const totalExpected = expectedValueList.reduce((a, b) => a + b, 0);
        expectedN = expectedValueList.map(value => (value / totalExpected) * validData.length);
    } else {
        expectedN = validData.length / countCategories;
    }
    
    // Calculate residuals
    const residual = categoryList.map((value, index) => {
        const observed = observedN[value] || 0;
        const expected = Array.isArray(expectedN) ? expectedN[index] : expectedN;
        return observed - expected;
    });
    
    // Format for output
    const observedNList = [];
    const expectedNList = [];
    const residualList = [];
    
    categoryList.forEach((value, index) => {
        const observed = observedN[value] || 0;
        const expected = Array.isArray(expectedN) ? expectedN[index] : expectedN;
        observedNList.push(observed);
        expectedNList.push(expected);
        residualList.push(observed - expected);
    });
    
    return {
        variable,
        categoryList,
        observedN: observedNList,
        expectedN: expectedNList,
        residual: residualList,
        N: data.length,
        Valid: validData.length,
        Missing: data.length - validData.length
    };
}

export default calculateFrequencies; 