// One-Sample T-Test calculation

// Import external libraries with error handling
let stdlibstatsBaseDistsTCdf, stdlibstatsBaseDistsTQuantile;

try {
    stdlibstatsBaseDistsTCdf = importScripts('https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-t-cdf@0.2.2/+esm');
    stdlibstatsBaseDistsTQuantile = importScripts('https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-t-quantile@0.2.2/+esm');
} catch (e) {
    console.error("Failed to load external libraries:", e);
    // Error will be handled by the main worker
}

/**
 * Calculate One-Sample T-Test results
 * @param {Array} data - Array of data objects
 * @param {Array} variables - Array of variable metadata objects
 * @param {number} testValue - Test value to compare against
 * @returns {Object} - T-Test results in table format
 */
self.resultTest = function(data, variables, testValue) {
    if (!data.length || !variables.length) {
        return { tables: [{ title: 'One-Sample Test', columnHeaders: [], rows: [] }] };
    }

    try {
        const arrays = variables.map(variable => {
            const values = data.map((row, index) => ({
                value: row[variable.name] !== "" && row[variable.name] !== null && row[variable.name] !== undefined ? 
                       parseFloat(row[variable.name]) : null
            })).filter(item => item.value !== null && !isNaN(item.value));
            
            if (values.length === 0) {
                console.warn(`No valid values found for variable ${variable.name}`);
            }
            return values;
        });

        let rows = [];

        arrays.forEach((values, index) => {
            const variable = variables[index];
            const validValues = values.map(item => item.value);
            const n = validValues.length;
            
            if (n === 0) return;
            
            const meanValue = mean(validValues);
            const stdDevValue = n > 1 ? stdDev(validValues, meanValue) : null;
            
            // Skip if we can't calculate standard deviation
            if (stdDevValue === null) {
                console.warn(`Cannot calculate t-test for ${variable.name}: insufficient data or zero variance`);
                return;
            }
            
            const stdError = stdDevValue / Math.sqrt(n);
            const meanDiff = meanValue - testValue;
            const t = meanDiff / stdError;
            const df = n - 1;
            
            // Calculate p-value and confidence intervals
            let sig, lower, upper;
            try {
                const tCritical = stdlibstatsBaseDistsTQuantile(0.975, df);
                sig = 2 * (1 - stdlibstatsBaseDistsTCdf(Math.abs(t), df));
                lower = meanDiff - tCritical * stdError;
                upper = meanDiff + tCritical * stdError;
            } catch (err) {
                console.error(`Error calculating t-test statistics for ${variable.name}:`, err);
                sig = null;
                lower = null;
                upper = null;
            }
            
            rows.push({
                "rowHeader": [variable.label || variable.name],
                "t": formatNumber(t, 3),
                "df": df !== null ? Math.round(df) : "",
                "sig2tailed": sig !== null ? (sig < 0.001 ? "<.001" : formatNumber(sig, 3)) : "",
                "meanDifference": formatNumber(meanDiff, variable.decimals + 3),
                "lower": lower !== null ? formatNumber(lower, variable.decimals + 2) : "",
                "upper": upper !== null ? formatNumber(upper, variable.decimals + 2) : ""
            });
        });

        return {
            tables: [
                {
                    title: "One-Sample Test",
                    columnHeaders: [
                        { header: "", },
                        { 
                            header: `Test Value = ${testValue}`,
                            children: [
                                { header: "t", key: "t" },
                                { header: "df", key: "df" },
                                { header: "Sig. (2-tailed)", key: "sig2tailed" },
                                { header: "Mean Difference", key: "meanDifference" },
                                { 
                                    header: "95% Confidence Interval of the Difference",
                                    children: [
                                        { header: "Lower", key: "lower" },
                                        { header: "Upper", key: "upper" }
                                    ]
                                }
                            ]
                        }
                    ],
                    rows: rows
                }
            ]
        };
    } catch (error) {
        console.error("Error calculating t-test:", error);
        throw new Error(`Failed to calculate t-test: ${error.message}`);
    }
};

/**
 * Calculate mean of an array
 * @param {Array<number>} arr - Array of numeric values
 * @returns {number} - Mean value
 */
function mean(arr) {
    if (!arr || arr.length === 0) return null;
    return arr.reduce((sum, x) => sum + x, 0) / arr.length;
}

/**
 * Calculate standard deviation of an array
 * @param {Array<number>} arr - Array of numeric values
 * @param {number} meanValue - Pre-calculated mean value
 * @returns {number} - Standard deviation
 */
function stdDev(arr, meanValue) {
    if (!arr || arr.length <= 1 || meanValue === null) return null;
    const sumSq = arr.reduce((sum, x) => sum + Math.pow(x - meanValue, 2), 0);
    return Math.sqrt(sumSq / (arr.length - 1));
}

/**
 * Format number to specified decimal places
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted number string
 */
function formatNumber(value, decimals) {
    if (value === null || value === undefined || isNaN(value)) return "";
    return Number(value).toFixed(decimals);
}