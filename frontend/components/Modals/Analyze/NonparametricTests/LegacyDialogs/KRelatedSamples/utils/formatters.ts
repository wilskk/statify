import {
    KRelatedSamplesResults,
    KRelatedSamplesTable,
    TableColumnHeader,
    TableRow,
    TestStatistics,
    DescriptiveStatistics,
    DisplayStatisticsOptions,
} from '../types';

/**
 * Formats ranks table for Friedman and Kendall's W tests
 * @param results Test results
 * @returns Formatted table
 */
export function formatRanksTable(
    results: KRelatedSamplesResults,
): KRelatedSamplesTable {
    if (!results || !results.ranks || results.ranks.length === 0) {
        return {
            title: "Ranks",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    // Use the first result with ranks
    const ranksResult = results.ranks[0];
    
    if (!ranksResult || !ranksResult.ranks || !ranksResult.ranks.groups) {
        return {
            title: "Ranks",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const columnHeaders: TableColumnHeader[] = [
        { header: "", key: "rowHeader" },
        { header: "Mean Rank", key: "meanRank" }
    ];
    
    const rows: TableRow[] = ranksResult.ranks.groups.map(condition => ({
        rowHeader: [condition.label],
        meanRank: condition.meanRank.toFixed(2)
    }));
    
    return {
        title: "Ranks",
        columnHeaders,
        rows
    };
}

/**
 * Formats frequencies table for Cochran's Q test
 * @param results Test results
 * @returns Formatted table
 */
export function formatFrequenciesTable(
    results: KRelatedSamplesResults,
): KRelatedSamplesTable {
    if (!results || !results.frequencies || results.frequencies.length === 0) {
        return {
            title: "Frequencies",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    // Use the first result with frequencies
    const frequenciesResult = results.frequencies[0];
    
    if (!frequenciesResult || !frequenciesResult.frequencies || !frequenciesResult.frequencies.groups) {
        return {
            title: "Frequencies",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const columnHeaders: TableColumnHeader[] = [
        { header: "", key: "rowHeader" },
        { header: "Count", key: "count" }
    ];
    
    const rows: TableRow[] = frequenciesResult.frequencies.groups.map(condition => ({
        rowHeader: [condition.label],
        count: condition.count
    }));
    
    return {
        title: "Frequencies",
        columnHeaders,
        rows
    };
}

/**
 * Formats test statistics table for all tests
 * @param results Test results
 * @param testName Name of the test
 * @returns Formatted table
 */
export function formatTestStatisticsTable(
    results: KRelatedSamplesResults,
    testName: string
): KRelatedSamplesTable {
    if (!results || !results.testStatistics || results.testStatistics.length === 0) {
        return {
            title: "Test Statistics",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    // Filter results by test type
    const filteredResults = results.testStatistics.filter(result => 
        result.testStatistics?.TestType === testName.replace(" Test", "")
    );
    
    if (filteredResults.length === 0) {
        return {
            title: "Test Statistics",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const testStatistics = filteredResults[0].testStatistics;
    
    if (!testStatistics) {
        return {
            title: "Test Statistics",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const columnHeaders: TableColumnHeader[] = [
        { header: "", key: "rowHeader" },
        { header: "Value", key: "value" }
    ];
    
    const rows: TableRow[] = [
        {
            rowHeader: ["N"],
            value: testStatistics.N
        },
        {
            rowHeader: ["Chi-Square"],
            value: testStatistics.TestValue.toFixed(3)
        },
        {
            rowHeader: ["df"],
            value: testStatistics.df
        },
        {
            rowHeader: ["Asymp. Sig."],
            value: testStatistics.PValue < 0.001 ? "<.001" : testStatistics.PValue.toFixed(3)
        }
    ];
    
    // Add Kendall's W value if available
    if (testName === "Kendall's W Test" && testStatistics.W !== undefined) {
        rows.splice(1, 0, {
            rowHeader: ["Kendall's W"],
            value: testStatistics.W.toFixed(3)
        });
    }
    
    return {
        title: "Test Statistics",
        columnHeaders,
        rows
    };
}

/**
 * Formats descriptive statistics table
 * @param results Chi Square results
 * @returns Formatted table
 */
export function formatDescriptiveStatisticsTable (
    results: KRelatedSamplesResults,
    displayStatistics?: DisplayStatisticsOptions
): KRelatedSamplesTable {
    if (!results || !results.descriptiveStatistics || results.descriptiveStatistics.length === 0) {
        return {
            title: "No Data",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const table: KRelatedSamplesTable = {
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
        const stats = result.descriptiveStatistics as DescriptiveStatistics;
        const decimals = typeof result.variable !== "string" && result.variable.decimals ? result.variable.decimals : 2;
        const variableName = typeof result.variable !== "string" ? result.variable.name : result.variable;
        table.rows.push({
            rowHeader: [variableName],
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