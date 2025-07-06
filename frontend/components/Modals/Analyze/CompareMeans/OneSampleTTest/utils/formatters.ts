import {
    ChiSquareResults,
    ChiSquareTable,
    TableColumnHeader,
    TableRow,
    Frequencies,
    TestStatistics,
    DescriptiveStatistics,
} from '../types';

/**
 * Formats frequencies table based on the specified range option
 * @param results Chi Square results
 * @param specifiedRange Whether a specific range is used
 * @returns Formatted table
 */
export function formatFrequenciesTable(
    results: ChiSquareResults,
    specifiedRange?: boolean
): ChiSquareTable {
    if (!results || !results.frequencies || results.frequencies.length === 0) {
        return {
            title: "Frequencies",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    // Case 1 & 2: No range specified (getFromData)
    if (!specifiedRange) {
        return formatFrequenciesGetFromData(results);
    }
    // Case 3 & 4: Range specified (useSpecifiedRange)
    else {
        return formatFrequenciesUseSpecifiedRange(results);
    }
}

/**
 * Formats frequencies table for data without specified range
 * @param results Chi Square results
 * @returns Formatted table
 */
function formatFrequenciesGetFromData(
    results: ChiSquareResults
): ChiSquareTable {
    // Single variable case
    if (results.frequencies && results.frequencies.length === 1) {
        const { variable, stats } = results.frequencies[0];
        
        if (!variable || !stats) {
            return {
                title: "Frequencies",
                columnHeaders: [{ header: "No Data", key: "noData" }],
                rows: []
            };
        }
        
        const freqStats = stats as Frequencies;
        const decimals = variable.decimals || 0;
        
        const columnHeaders: TableColumnHeader[] = [
            { header: "", key: "rowHeader" },
            { header: "Observed N", key: "observedN" },
            { header: "Expected N", key: "expectedN" },
            { header: "Residual", key: "residual" }
        ];
        
        // Create rows for each category
        const rows: TableRow[] = [];
        const { categoryList, observedN, expectedN, residual } = freqStats;
        
        if (categoryList && observedN && expectedN && residual) {
            categoryList.forEach((category, index) => {
                const observed = observedN[index] || 0;
                const expected = Array.isArray(expectedN) ? expectedN[index] : expectedN;
                const res = residual[index] || 0;
                
                rows.push({
                    rowHeader: [typeof category === 'number' ? category.toFixed(decimals) : String(category)],
                    observedN: observed,
                    expectedN: expected.toFixed(1),
                    residual: res.toFixed(1)
                });
            });
            
            // Add total row
            rows.push({
                rowHeader: ["Total"],
                observedN: observedN.reduce((sum, val) => sum + val, 0),
                expectedN: ""
            });
        }
        
        return {
            title: variable.label || variable.name,
            columnHeaders,
            rows
        };
    }
    
    // Multiple variables case
    const columnHeaders: TableColumnHeader[] = [
        { header: "", key: "rowHeader" }
    ];
    
    // Add column headers for each variable
    if (results.frequencies) {
        results.frequencies.forEach((result, index) => {
            columnHeaders.push({
                header: result.variable?.label || result.variable?.name || `Variable ${index + 1}`,
                key: `var_${index}`,
                children: [
                    { header: "Observed N", key: `observedN${index}` },
                    { header: "Expected N", key: `expectedN${index}` },
                    { header: "Residual", key: `residual${index}` }
                ]
            });
        });
    }
    
    // Find all unique categories across all variables
    const allCategories = new Set<string | number>();
    if (results.frequencies) {
        results.frequencies.forEach(result => {
            const stats = result.stats as Frequencies;
            if (stats && stats.categoryList) {
                stats.categoryList.forEach(category => allCategories.add(category));
            }
        });
    }
    
    // Sort categories numerically if possible
    const sortedCategories = Array.from(allCategories).sort((a, b) => {
        const numA = Number(a);
        const numB = Number(b);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        return String(a).localeCompare(String(b));
    });
    
    // Create rows for each category
    const rows: TableRow[] = [];
    sortedCategories.forEach(category => {
        const row: TableRow = {
            rowHeader: [String(category)]
        };
        
        // Add data for each variable
        if (results.frequencies) {
            results.frequencies.forEach((result, varIndex) => {
                const { variable, stats } = result;
                
                if (!variable || !stats) {
                    row[`observedN${varIndex}`] = "";
                    row[`expectedN${varIndex}`] = "";
                    row[`residual${varIndex}`] = "";
                    return;
                }
                
                const freqStats = stats as Frequencies;
                const categoryIndex = freqStats.categoryList.findIndex(cat => 
                    typeof cat === 'number' && typeof category === 'number' 
                        ? cat === category 
                        : String(cat) === String(category)
                );
                
                if (categoryIndex !== -1) {
                    const observed = freqStats.observedN[categoryIndex] || 0;
                    const expected = Array.isArray(freqStats.expectedN) 
                        ? freqStats.expectedN[categoryIndex] 
                        : freqStats.expectedN;
                    const res = freqStats.residual[categoryIndex] || 0;
                    
                    row[`observedN${varIndex}`] = observed;
                    row[`expectedN${varIndex}`] = expected.toFixed(1);
                    row[`residual${varIndex}`] = res.toFixed(1);
                } else {
                    row[`observedN${varIndex}`] = 0;
                    row[`expectedN${varIndex}`] = Array.isArray(freqStats.expectedN)
                        ? "0.0"
                        : freqStats.expectedN.toFixed(1);
                    row[`residual${varIndex}`] = "0.0";
                }
            });
        }
        
        rows.push(row);
    });
    
    // Add total row
    const totalRow: TableRow = {
        rowHeader: ["Total"]
    };
    
    if (results.frequencies) {
        results.frequencies.forEach((result, varIndex) => {
            const stats = result.stats as Frequencies;
            if (stats && stats.observedN) {
                totalRow[`observedN${varIndex}`] = stats.observedN.reduce((sum, val) => sum + val, 0);
            } else {
                totalRow[`observedN${varIndex}`] = "";
            }
        });
    }
    
    rows.push(totalRow);
    
    return {
        title: "Frequencies",
        columnHeaders,
        rows
    };
}

/**
 * Formats frequencies table for data with specified range
 * @param results Chi Square results
 * @returns Formatted table
 */
function formatFrequenciesUseSpecifiedRange(
    results: ChiSquareResults
): ChiSquareTable {
    // Get range values from the first variable's analysis options
    let lowerValue: number | null = null;
    let upperValue: number | null = null;
    
    // Try to extract range values from the first result
    const firstResult = results.frequencies && results.frequencies[0];
    if (firstResult && firstResult.variable && (firstResult.variable as any).options?.rangeValue) {
        const rangeValue = (firstResult.variable as any).options.rangeValue;
        lowerValue = rangeValue.lowerValue;
        upperValue = rangeValue.upperValue;
    } else if (firstResult && (firstResult.stats as any)?.rangeValue) {
        const rangeValue = (firstResult.stats as any).rangeValue;
        lowerValue = rangeValue.lowerValue;
        upperValue = rangeValue.upperValue;
    }
    
    // If no range values found, fall back to the regular formatter
    if (lowerValue === null || upperValue === null) {
        return formatFrequenciesGetFromData(results);
    }
    
    // Single variable case
    if (results.frequencies && results.frequencies.length === 1) {
        const { variable, stats } = results.frequencies[0];
        
        if (!variable || !stats) {
            return {
                title: "Frequencies",
                columnHeaders: [{ header: "No Data", key: "noData" }],
                rows: []
            };
        }
        
        const freqStats = stats as Frequencies;
        const decimals = variable.decimals || 0;
        
        const columnHeaders: TableColumnHeader[] = [
            { header: "", key: "rowHeader" },
            { header: "Observed N", key: "observedN" },
            { header: "Expected N", key: "expectedN" },
            { header: "Residual", key: "residual" }
        ];
        
        // Create rows for each value in the range
        const rows: TableRow[] = [];
        
        for (let value = lowerValue; value <= upperValue; value++) {
            const categoryIndex = freqStats.categoryList.findIndex(cat => Number(cat) === value);
            const observed = categoryIndex !== -1 ? freqStats.observedN[categoryIndex] : 0;
            const expected = Array.isArray(freqStats.expectedN) && categoryIndex !== -1
                ? freqStats.expectedN[categoryIndex]
                : freqStats.observedN.reduce((sum, val) => sum + val, 0) / (upperValue - lowerValue + 1);
            const residual = categoryIndex !== -1 ? freqStats.residual[categoryIndex] : -expected;
            
            rows.push({
                rowHeader: [value.toFixed(decimals)],
                observedN: observed,
                expectedN: expected.toFixed(1),
                residual: residual.toFixed(1)
            });
        }
        
        // Add total row
        rows.push({
            rowHeader: ["Total"],
            observedN: freqStats.observedN.reduce((sum, val) => sum + val, 0),
            expectedN: ""
        });
        
        return {
            title: variable.label || variable.name,
            columnHeaders,
            rows
        };
    }
    
    // Multiple variables case
    const table: ChiSquareTable = {
        title: "Frequencies",
        columnHeaders: [{ header: "", key: "rowHeader" }],
        rows: []
    };
    
    // Add column headers for each variable
    if (results.frequencies) {
        results.frequencies.forEach((result, index) => {
            table.columnHeaders.push({
                header: result.variable?.label || result.variable?.name || `Variable ${index + 1}`,
                key: `var_${index}`,
                children: [
                    { header: "Category", key: `category${index}` },
                    { header: "Observed N", key: `observedN${index}` },
                    { header: "Expected N", key: `expectedN${index}` },
                    { header: "Residual", key: `residual${index}` }
                ]
            });
        });
    }
    
    // Create rows for each value in the range
    for (let value = lowerValue, rowIndex = 0; value <= upperValue; value++, rowIndex++) {
        const row: TableRow = {
            rowHeader: [rowIndex + 1]
        };
        
        // Add data for each variable
        if (results.frequencies) {
            results.frequencies.forEach((result, varIndex) => {
                const { variable, stats } = result;
                
                if (!variable || !stats) {
                    row[`category${varIndex}`] = "";
                    row[`observedN${varIndex}`] = "";
                    row[`expectedN${varIndex}`] = "";
                    row[`residual${varIndex}`] = "";
                    return;
                }
                
                const freqStats = stats as Frequencies;
                const decimals = variable.decimals || 0;
                const categoryIndex = freqStats.categoryList.findIndex(cat => Number(cat) === value);
                
                // Set category value
                row[`category${varIndex}`] = value.toFixed(decimals);
                
                if (categoryIndex !== -1) {
                    const observed = freqStats.observedN[categoryIndex] || 0;
                    const expected = Array.isArray(freqStats.expectedN) 
                        ? freqStats.expectedN[categoryIndex] 
                        : freqStats.observedN.reduce((sum, val) => sum + val, 0) / (upperValue - lowerValue + 1);
                    const residual = observed - expected;
                    
                    row[`observedN${varIndex}`] = observed;
                    row[`expectedN${varIndex}`] = expected.toFixed(1);
                    row[`residual${varIndex}`] = residual.toFixed(1);
                } else {
                    const expected = freqStats.observedN.reduce((sum, val) => sum + val, 0) / (upperValue - lowerValue + 1);
                    
                    row[`observedN${varIndex}`] = 0;
                    row[`expectedN${varIndex}`] = expected.toFixed(1);
                    row[`residual${varIndex}`] = (-expected).toFixed(1);
                }
            });
        }
        
        table.rows.push(row);
    }
    
    // Add total row
    const totalRow: TableRow = {
        rowHeader: ["Total"]
    };
    
    if (results.frequencies) {
        results.frequencies.forEach((result, varIndex) => {
            const stats = result.stats as Frequencies;
            if (stats && stats.observedN) {
                totalRow[`observedN${varIndex}`] = stats.observedN.reduce((sum, val) => sum + val, 0);
            } else {
                totalRow[`observedN${varIndex}`] = "";
            }
        });
    }
    
    table.rows.push(totalRow);
    
    return table;
}

/**
 * Formats test statistics table
 * @param results Chi Square results
 * @returns Formatted table
 */
export function formatTestStatisticsTable (
    results: ChiSquareResults
): ChiSquareTable {
    if (!results || !results.testStatistics || results.testStatistics.length === 0) {
        return {
            title: "No Data",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const table: ChiSquareTable = {
        title: 'Chi-Square Test',
        columnHeaders: [
            { header: 'Variable', key: 'variable' },
            { header: 'Chi-Square', key: 'ChiSquare' },
            { header: 'df', key: 'DF' },
            { header: 'Asymp. Sig.', key: 'PValue' }
        ],
        rows: []
    };

    // Process each result
    results.testStatistics.forEach((result) => {
        const stats = result.stats as TestStatistics;
        
        table.rows.push({
            variable: result.variable.name,
            ChiSquare: formatNumber(stats.ChiSquare, 3),
            DF: formatDF(stats.DF),
            PValue: formatPValue(stats.PValue)
        });
    });

    return table;
}

/**
 * Formats descriptive statistics table
 * @param results Chi Square results
 * @returns Formatted table
 */
export function formatDescriptiveStatisticsTable (
    results: ChiSquareResults
): ChiSquareTable {
    if (!results || !results.descriptiveStatistics || results.descriptiveStatistics.length === 0) {
        return {
            title: "No Data",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const table: ChiSquareTable = {
        title: 'Descriptive Statistics',
        columnHeaders: [
            { header: 'Variable', key: 'variable' },
            { header: 'N', key: 'N' },
            { header: 'Mean', key: 'Mean' },
            { header: 'Std. Deviation', key: 'StdDev' },
            { header: 'Std. Error Mean', key: 'SEMean' },
            { header: 'Minimum', key: 'Min' },
            { header: 'Maximum', key: 'Max' }
        ],
        rows: []
    };

    // Process each result
    results.descriptiveStatistics.forEach((result) => {
        const stats = result.stats as DescriptiveStatistics;
        const decimals = result.variable.decimals || 2;
        
        table.rows.push({
            variable: result.variable.name,
            N: stats.N,
            Mean: formatNumber(stats.Mean, decimals + 2),
            StdDev: formatNumber(stats.StdDev, decimals + 3),
            SEMean: formatNumber(stats.SEMean, decimals + 3),
            Min: formatNumber(stats.Min, decimals),
            Max: formatNumber(stats.Max, decimals)
        });
    });

    return table;
}

/**
 * Formats number with specified precision
 * @param value Number to format
 * @param precision Decimal precision
 * @returns Formatted number
 */
export const formatNumber = (value: number | null | undefined, precision: number) => {
    if (value === null || value === undefined) return null;
    return value.toFixed(precision);
};

/**
 * Formats p-value with appropriate notation
 * @param pValue P-value to format
 * @returns Formatted p-value
 */
export const formatPValue = (pValue: number | null | undefined) => {
    if (pValue === null || pValue === undefined) return null;
    
    if (pValue < 0.001) {
        return '<.001';
    } else {
        return pValue.toFixed(3);
    }
};

/**
 * Formats degrees of freedom
 * @param df Degrees of freedom
 * @returns Formatted degrees of freedom
 */
export const formatDF = (df: number | null | undefined) => {
    if (df === null || df === undefined) return null;
    if (Number.isInteger(df)) {
        return df;
    } else {
        return df.toFixed(3);
    }
};

/**
 * Formats error message
 * @param error Error message
 * @returns Formatted error message
 */
export const formatErrorMessage = (error: string): string => {
    return `Error: ${error}`;
};