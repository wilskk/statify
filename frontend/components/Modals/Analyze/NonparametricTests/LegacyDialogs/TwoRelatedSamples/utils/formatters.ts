import {
    TwoRelatedSamplesResults,
    TwoRelatedSamplesTable,
    TableColumnHeader,
    TableRow,
    RanksFrequencies,
    TestStatistics,
    DescriptiveStatistics,
    DisplayStatistics,
} from '../types';

/**
 * Formats frequencies table for data without specified range
 * @param results Chi Square results
 * @returns Formatted table
 */
export function formatRanksFrequenciesTable(
    results: TwoRelatedSamplesResults,
    testType: string
): TwoRelatedSamplesTable {
    let title = "Frequencies";
    
    if (!results || !results.ranksFrequencies || results.ranksFrequencies.length === 0) {
        return {
            title: title,
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    let columnHeaders: TableColumnHeader[] = [
        { header: "", key: "rowHeader" },
        { header: "", key: "type" },
        { header: "N", key: "N" }
    ];

    if (testType === "WILCOXON") {
        title = "Ranks";
        columnHeaders.push(
            { header: "Mean Rank", key: "MeanRank" },
            { header: "Sum of Ranks", key: "SumRanks" }
        );
    }

    const rows: TableRow[] = [];
    results.ranksFrequencies.forEach((result) => {
        const { variable1, variable2, ranksFrequencies } = result;
        if (!variable1 || !variable2 || !ranksFrequencies) return;

        const { negative, positive, ties, total } = ranksFrequencies as RanksFrequencies;

        const label= `${variable1.label || variable1.name} - ${variable2.label || variable2.name}`;
        const decimals = Math.max(variable1.decimals, variable2.decimals);
        // For M-W, show Mean Rank and Sum of Ranks; for K-S, just N
        if (testType === "WILCOXON") {
            rows.push({
                rowHeader: [label],
                type: "Negative Ranks",
                N: negative.N,
                MeanRank: negative.MeanRank !== undefined ? formatNumber(negative.MeanRank, decimals + 2) : undefined,
                SumRanks: negative.SumOfRanks !== undefined ? formatNumber(negative.SumOfRanks, decimals + 2) : undefined
            });
            rows.push({
                rowHeader: [label],
                type: "Positive Ranks",
                N: positive.N,
                MeanRank: positive.MeanRank !== undefined ? formatNumber(positive.MeanRank, decimals + 2) : undefined,
                SumRanks: positive.SumOfRanks !== undefined ? formatNumber(positive.SumOfRanks, decimals + 2) : undefined
            });
            rows.push({
                rowHeader: [label],
                type: "Ties",
                N: ties.N
            });
            rows.push({
                rowHeader: [label],
                type: "Total",
                N: total.N
            });
        } else {
            // For SIGN, just show N per group
            rows.push({
                rowHeader: [label],
                type: "Negative Differences",
                N: negative.N
            });
            rows.push({
                rowHeader: [label],
                type: "Positive Differences",
                N: positive.N
            });
            rows.push({
                rowHeader: [label],
                type: "Ties",
                N: ties.N
            });
            rows.push({
                rowHeader: [label],
                type: "Total",
                N: total.N
            });
        }
    });

    return {
        title,
        columnHeaders,
        rows
    };
}

/**
 * Formats test statistics table
 * @param results Chi Square results
 * @returns Formatted table
 */
export function formatTestStatisticsTable (
    results: TwoRelatedSamplesResults,
    testType: string
): TwoRelatedSamplesTable {
    if (!results || (!results.testStatisticsWilcoxon && !results.testStatisticsSign)) {
        return {
            title: "No Data",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const table: TwoRelatedSamplesTable = {
        title: 'Test Statistics',
        columnHeaders: [{ header: '', key: 'rowHeader' }],
        rows: []
    };

    // Add column headers for each variable
    if (results.testStatisticsWilcoxon || results.testStatisticsSign) {
        const zRow: TableRow = { rowHeader: ["Z"] };
        const pValueRow: TableRow = { rowHeader: ["P Value"] };

        if (testType === "WILCOXON" && results.testStatisticsWilcoxon) {
            results.testStatisticsWilcoxon.forEach((result, index) => {
                if (result && result.variable1 && result.variable2 && result.testStatisticsWilcoxon) {
                    const stats = result.testStatisticsWilcoxon as TestStatistics;
                    table.columnHeaders.push({
                        header: `${result.variable1.label || result.variable1.name} - ${result.variable2.label || result.variable2.name}`,
                        key: `var_${index}`
                    });
                    zRow[`var_${index}`] = formatNumber(stats.Z, 3);
                    pValueRow[`var_${index}`] = formatPValue(stats.PValue);
                }
            });
        }

        if (testType === "SIGN" && results.testStatisticsSign) {
            results.testStatisticsSign.forEach((result, index) => {
                if (result && result.variable1 && result.variable2 && result.testStatisticsSign) {
                    const stats = result.testStatisticsSign as TestStatistics;
                    table.columnHeaders.push({
                        header: `${result.variable1.label || result.variable1.name} - ${result.variable2.label || result.variable2.name}`,
                        key: `var_${index}`
                    });
                    zRow[`var_${index}`] = formatNumber(stats.Z, 3);
                    pValueRow[`var_${index}`] = formatPValue(stats.PValue);
                }
            });
        }

        table.rows.push(zRow, pValueRow);
    }
    return table;
}

/**
 * Formats descriptive statistics table
 * @param results Chi Square results
 * @returns Formatted table
 */
export function formatDescriptiveStatisticsTable (
    results: TwoRelatedSamplesResults,
    displayStatistics?: DisplayStatistics
): TwoRelatedSamplesTable {
    if (!results || !results.descriptiveStatistics || results.descriptiveStatistics.length === 0) {
        return {
            title: "No Data",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const table: TwoRelatedSamplesTable = {
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

    // Collect all unique variables and their stats
    const uniqueVariables = new Map();
    
    // First collect all variable1 entries
    results.descriptiveStatistics.forEach((result) => {
        const stats = result.descriptiveStatistics as DescriptiveStatistics;
        const var1 = result.variable1;
        
        if (var1 && !uniqueVariables.has(var1.name)) {
            uniqueVariables.set(var1.name, {
                variable: var1,
                N: stats.N1,
                Mean: formatNumber(stats.Mean1, var1.decimals + 2),
                StdDev: formatNumber(stats.StdDev1, var1.decimals + 3),
                Min: formatNumber(stats.Min1, var1.decimals),
                Max: formatNumber(stats.Max1, var1.decimals),
                Percentile25: formatNumber(stats.Percentile25_1, var1.decimals),
                Percentile50: formatNumber(stats.Percentile50_1, var1.decimals),
                Percentile75: formatNumber(stats.Percentile75_1, var1.decimals)
            });
        }
    });
    
    // Then collect any variable2 entries not already included
    results.descriptiveStatistics.forEach((result) => {
        const stats = result.descriptiveStatistics as DescriptiveStatistics;
        const var2 = result.variable2;
        
        if (var2 && !uniqueVariables.has(var2.name)) {
            uniqueVariables.set(var2.name, {
                variable: var2,
                N: stats.N2,
                Mean: formatNumber(stats.Mean2, var2.decimals + 2),
                StdDev: formatNumber(stats.StdDev2, var2.decimals + 3),
                Min: formatNumber(stats.Min2, var2.decimals),
                Max: formatNumber(stats.Max2, var2.decimals),
                Percentile25: formatNumber(stats.Percentile25_2, var2.decimals),
                Percentile50: formatNumber(stats.Percentile50_2, var2.decimals),
                Percentile75: formatNumber(stats.Percentile75_2, var2.decimals)
            });
        }
    });
    
    // Add rows for each unique variable
    uniqueVariables.forEach((stats, varName) => {
        const decimals = stats.variable.decimals || 2;
        
        table.rows.push({
            rowHeader: [stats.variable.label || varName],
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