// One-Sample T-Test Statistics calculation

/**
 * Calculate descriptive statistics for One-Sample T-Test
 * @param {Array} data - Array of data objects
 * @param {Array} variables - Array of variable metadata objects
 * @returns {Object} - Statistics results in table format
 */
self.resultStatistics = function(data, variables) {
    if (!data.length || !variables.length) {
        return { tables: [{ title: 'One-Sample Statistics', columnHeaders: [], rows: [] }] };
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

        let stats = [];

        arrays.forEach((values, index) => {
            const variable = variables[index];
            const validValues = values.map(item => item.value);
            
            const N = validValues.length;
            const meanValue = N > 0 ? mean(validValues) : null;
            const stdDevValue = N > 1 ? stdDev(validValues, meanValue) : null;
            const stdErrMean = (N > 1 && stdDevValue !== null) ? stdError(stdDevValue, N) : null;

            stats.push({
                "rowHeader": [variable.label || variable.name],
                "N": N || "",
                "Mean": meanValue !== null ? formatNumber(meanValue, variable.decimals + 2) : "",
                "Std. Deviation": stdDevValue !== null ? formatNumber(stdDevValue, variable.decimals + 3) : "",
                "Std. Error Mean": stdErrMean !== null ? formatNumber(stdErrMean, variable.decimals + 3) : ""
            });
        });

        return {
            tables: [
                {
                    title: "One-Sample Statistics",
                    columnHeaders: [
                        { header: "" },
                        { header: "N" },
                        { header: "Mean" },
                        { header: "Std. Deviation" },
                        { header: "Std. Error Mean" }
                    ],
                    rows: stats
                }
            ]
        };
    } catch (error) {
        console.error("Error calculating statistics:", error);
        throw new Error(`Failed to calculate statistics: ${error.message}`);
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
 * Calculate standard error of mean
 * @param {number} sd - Standard deviation
 * @param {number} n - Sample size
 * @returns {number} - Standard error of mean
 */
function stdError(sd, n) {
    if (sd === null || n <= 1) return null;
    return sd / Math.sqrt(n);
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
