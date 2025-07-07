import {
    OneSampleTTestResults,
    OneSampleTTestTable,
    TableColumnHeader,
    TableRow,
    OneSampleStatistics,
    OneSampleTest,
} from '../types';

/**
 * Formats frequencies table based on the specified range option
 * @param results Chi Square results
 * @param specifiedRange Whether a specific range is used
 * @returns Formatted table
 */
export function formatOneSampleStatisticsTable(
    results: OneSampleTTestResults,
): OneSampleTTestTable {
    if (!results || !results.oneSampleStatistics || results.oneSampleStatistics.length === 0) {
        return {
            title: "One-Sample Statistics",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    const table: OneSampleTTestTable = {
        title: 'One-Sample Statistics',
        columnHeaders: [
            { header: '', key: 'rowHeader' },
            { header: 'N', key: 'N' },
            { header: 'Mean', key: 'Mean' },
            { header: 'Std. Deviation', key: 'StdDev' },
            { header: 'Std. Error Mean', key: 'SEMean' }
        ],
        rows: []
    };

    // Process each result
    results.oneSampleStatistics.forEach((result) => {
        const stats = result.stats as OneSampleStatistics;
        const decimals = result.variable.decimals || 2;

        table.rows.push(
            {
                rowHeader: [result.variable.label || result.variable.name],
                N: stats.N,
                Mean: formatNumber(stats.Mean, decimals + 3),
                StdDev: formatNumber(stats.StdDev, decimals + 3),
                SEMean: formatNumber(stats.SEMean, decimals + 3)
            }
        );
    });

    return table;
}

/**
 * Formats descriptive statistics table
 * @param results Chi Square results
 * @returns Formatted table
 */
export function formatOneSampleTestTable (
    results: OneSampleTTestResults
): OneSampleTTestTable {
    if (!results || !results.oneSampleTest || results.oneSampleTest.length === 0) {
        return {
            title: "One-Sample Test",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const testValueLabel = 'Test Value = ' + results.oneSampleTest[0].testValue;

    const table: OneSampleTTestTable = {
        title: 'One-Sample Test',
        columnHeaders: [
            { header: '', key: 'rowHeader' },
            {
                header: testValueLabel,
                key: 'testValue',
                children: [
                    { header: 'T', key: 'T' },
                    { header: 'df', key: 'DF' },
                    { header: 'Sig. (2-tailed)', key: 'PValue' },
                    { header: 'Mean Difference', key: 'MeanDifference' },
                    { 
                        header: '95% Confidence Interval of the Difference',
                        key: 'CI',
                        children: [
                            { header: 'Lower', key: 'Lower' },
                            { header: 'Upper', key: 'Upper' }
                        ]
                    }
                ]
            }
        ],
        rows: []
    };

    // Process each result
    results.oneSampleTest.forEach((result) => {
        const stats = result.stats as OneSampleTest;
        const decimals = result.variable.decimals || 2;
        
        table.rows.push(
            {
                rowHeader: [result.variable.label || result.variable.name],
                T: formatNumber(stats.T, decimals + 3),
                DF: formatDF(stats.DF),
                PValue: formatPValue(stats.PValue),
                MeanDifference: formatNumber(stats.MeanDifference, decimals + 3),
                Lower: formatNumber(stats.Lower, decimals + 3),
                Upper: formatNumber(stats.Upper, decimals + 3)
            }
        );
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