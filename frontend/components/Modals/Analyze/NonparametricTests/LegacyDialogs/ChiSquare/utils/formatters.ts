import {
    ChiSquareResults,
    ChiSquareTable,
    TableColumnHeader,
    TableRow,
    Frequencies,
    TestStatistics,
    DescriptiveStatistics,
    DisplayStatisticsOptions,
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
): ChiSquareTable | ChiSquareTable[] {
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
): ChiSquareTable[] {
    if (results.frequencies) {
        const tables: ChiSquareTable[] = [];
        results.frequencies.forEach((result) => {
            const { variable, stats } = result;

            if (variable && stats) {
                const freqStats = stats as Frequencies;
                const decimals = variable.decimals || 0;

                const columnHeaders: TableColumnHeader[] = [
                    { header: "", key: "rowHeader" },
                    { header: "Observed N", key: "observedN" },
                    { header: "Expected N", key: "expectedN" },
                    { header: "Residual", key: "residual" }
                ];

                const rows: TableRow[] = [];
                const { categoryList, observedN, expectedN, residual, N } = freqStats;

                if (categoryList && observedN && expectedN && residual && N) {
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
                        observedN: N,
                        expectedN: "",
                        residual: ""
                    });
                }

                tables.push({
                    title: variable.label || variable.name,
                    columnHeaders,
                    rows
                });
            }
        });

        return tables;
    }

    return [
        {
            title: "Frequencies",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        }
    ];
}

/**
 * Formats frequencies table for data with specified range
 * @param results Chi Square results
 * @returns Formatted table
 */
function formatFrequenciesUseSpecifiedRange(
    results: ChiSquareResults
): ChiSquareTable {
    if (!results || !results.frequencies || results.frequencies.length === 0) {
        return {
            title: "Frequencies",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
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
            if (result && result.variable) {
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
            }
        });
    }

    // Create rows for each value in the range
    if (results.frequencies && results.frequencies.length > 0) {
        const firstResult = results.frequencies[0];
        if (firstResult && firstResult.stats && 'categoryList' in firstResult.stats) {
            const freqStats = firstResult.stats as Frequencies;
            const categoryList = freqStats.categoryList;
            
            categoryList.forEach((value, index) => {
                const row: TableRow = {
                    rowHeader: [index]
                };
                
                results.frequencies!.forEach((result, varIndex) => {
                    const variable = result.variable;
                    const stats = result.stats as Frequencies;
                    
                    if (!variable || !stats || !('categoryList' in stats)) {
                        row[`category${varIndex}`] = "";
                        row[`observedN${varIndex}`] = "";
                        row[`expectedN${varIndex}`] = "";
                        row[`residual${varIndex}`] = "";
                        return;
                    }
                    
                    const decimals = variable.decimals || 0;
                    const categoryIndex = stats.categoryList.findIndex(cat => Number(cat) === Number(value));

                    // Set category value, but if observedN is 0, use ""
                    let observed = 0;
                    if (categoryIndex !== -1) {
                        observed = stats.observedN[categoryIndex] || 0;
                    }

                    if (observed === 0) {
                        row[`category${varIndex}`] = "";
                    } else {
                        row[`category${varIndex}`] = typeof value === 'number' ? value.toFixed(decimals) : String(value);
                    }

                    if (categoryIndex !== -1) {
                        const expected = Array.isArray(stats.expectedN) 
                            ? stats.expectedN[categoryIndex] 
                            : stats.observedN.reduce((sum, val) => sum + val, 0) / stats.categoryList.length;
                        const residual = stats.residual[categoryIndex] || 0;
                        
                        row[`observedN${varIndex}`] = observed;
                        row[`expectedN${varIndex}`] = typeof expected === 'number' ? expected.toFixed(1) : expected;
                        row[`residual${varIndex}`] = residual.toFixed(1);
                    } else {
                        const expected = Array.isArray(stats.expectedN) 
                            ? 0 
                            : stats.observedN.reduce((sum, val) => sum + val, 0) / stats.categoryList.length;
                        
                        row[`observedN${varIndex}`] = 0;
                        row[`expectedN${varIndex}`] = typeof expected === 'number' ? expected.toFixed(1) : expected;
                        row[`residual${varIndex}`] = (-expected).toFixed(1);
                    }
                });
                
                table.rows.push(row);
            });
        }
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
        columnHeaders: [{ header: '', key: 'rowHeader' }],
        rows: []
    };

    // Add column headers for each variable
    if (results.testStatistics) {
        results.testStatistics.forEach((result, index) => {
            if (result && result.variable) {
                table.columnHeaders.push({
                    header: result.variable?.label || result.variable?.name || `Variable ${index + 1}`,
                    key: `var_${index}`
                });
            }
        });
    }

    // Create rows for each value in the range
    if (results.testStatistics) {
        const chiSquareRow: TableRow = { rowHeader: ["Chi-Square"] };
        const dfRow: TableRow = { rowHeader: ["df"] };
        const pValueRow: TableRow = { rowHeader: ["Asymp. Sig."] };

        results.testStatistics.forEach((result, varIndex) => {
            const stats = result.stats as TestStatistics;
            const key = `var_${varIndex}`;
            chiSquareRow[key] = formatNumber(stats.ChiSquare, 3);
            dfRow[key] = formatDF(stats.DF);
            pValueRow[key] = formatPValue(stats.PValue);
        });

        table.rows.push(chiSquareRow, dfRow, pValueRow);
    }

    return table;
}

/**
 * Formats descriptive statistics table
 * @param results Chi Square results
 * @returns Formatted table
 */
export function formatDescriptiveStatisticsTable (
    results: ChiSquareResults,
    displayStatistics?: DisplayStatisticsOptions
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
            { header: '', key: 'rowHeader' },
            { header: 'N', key: 'N' }

        ],
        rows: []
    };

    if (displayStatistics?.descriptive) {
        table.columnHeaders.push(
            { header: 'Mean', key: 'Mean' },
            { header: 'Std. Deviation', key: 'StdDev' },
            { header: 'Minimum', key: 'Min' },
            { header: 'Maximum', key: 'Max' }
        );
    }

    if (displayStatistics?.quartiles) {
        table.columnHeaders.push({
            header: "Percentiles",
            key: "percentiles",
            children: [
                { header: "25th", key: "Percentile25" },
                { header: "50th (Median)", key: "Percentile50" },
                { header: "75th", key: "Percentile75" }
            ]
        });
    }

    // Process each result
    results.descriptiveStatistics.forEach((result) => {
        const stats = result.stats as DescriptiveStatistics;
        const decimals = result.variable.decimals || 2;
        
        table.rows.push({
            rowHeader: [result.variable.name],
            N: stats.N,
            Mean: formatNumber(stats.Mean, decimals + 2),
            StdDev: formatNumber(stats.StdDev, decimals + 3),
            Min: formatNumber(stats.Min, decimals),
            Max: formatNumber(stats.Max, decimals),
            Percentile25: formatNumber(stats.Percentile25, decimals),
            Percentile50: formatNumber(stats.Percentile50, decimals),
            Percentile75: formatNumber(stats.Percentile75, decimals)
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