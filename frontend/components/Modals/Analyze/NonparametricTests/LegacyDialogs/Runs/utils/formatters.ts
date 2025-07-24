import {
    RunsTestResults,
    RunsTestTable,
    TableColumnHeader,
    TableRow,
    RunsTest,
    DescriptiveStatistics,
    DisplayStatisticsOptions,
} from '../types';

/**
 * Formats runs test table for all test values (median, mean, mode, custom)
 * @param results Runs test results
 * @returns Formatted table
 */
export function formatRunsTestTable(
    results: RunsTestResults,
): RunsTestTable[] {
    if (!results || !results.runsTest || results.runsTest.length === 0) {
        return [{
            title: "Runs Test",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        }];
    }

    const tables: RunsTestTable[] = [];
    
    // Group results by cut point type
    const medianResults = results.runsTest.filter(r => 
        r.cutPoint === 'Median' && r.stats && 'TestValue' in r.stats && r.stats.TestValue !== undefined);
    const meanResults = results.runsTest.filter(r => 
        r.cutPoint === 'Mean' && r.stats && 'TestValue' in r.stats && r.stats.TestValue !== undefined);
    const modeResults = results.runsTest.filter(r => 
        r.cutPoint === 'Mode' && r.stats && 'TestValue' in r.stats && r.stats.TestValue !== undefined);
    const customResults = results.runsTest.filter(r => 
        r.cutPoint === 'Custom' && r.stats && 'TestValue' in r.stats && r.stats.TestValue !== undefined);

    // Create a table for each cut point type that was used
    if (medianResults.length > 0) {
        tables.push(formatSingleRunsTestTable(medianResults, 'Median'));
    }
    
    if (meanResults.length > 0) {
        tables.push(formatSingleRunsTestTable(meanResults, 'Mean'));
    }
    
    if (modeResults.length > 0) {
        tables.push(formatSingleRunsTestTable(modeResults, 'Mode'));
    }
    
    if (customResults.length > 0) {
        tables.push(formatSingleRunsTestTable(customResults, `Custom`));
    }

    // If no tables were created but we have results, format all results in a single table
    if (tables.length === 0 && results.runsTest.length > 0) {
        tables.push(formatSingleRunsTestTable(results.runsTest, 'Test Value'));
    }

    // If still no tables, return a default empty table
    if (tables.length === 0) {
        return [{
            title: "Runs Test",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        }];
    }

    return tables;
}

/**
 * Formats a single runs test table for a specific test value type
 * @param runsTestResults Array of runs test results
 * @param title Title for the table
 * @returns Formatted table
 */
function formatSingleRunsTestTable(
    runsTestResults: RunsTestResults['runsTest'],
    title: string
): RunsTestTable {
    if (!runsTestResults || runsTestResults.length === 0) {
        return {
            title: `Runs Test (${title})`,
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    // Modify title for Custom cut point to include TestValue
    let displayTitle = title;
    if (title === 'Custom' && runsTestResults.length > 0 && runsTestResults[0].stats && 'TestValue' in runsTestResults[0].stats) {
        const testValue = runsTestResults[0].stats.TestValue;
        displayTitle = `Custom (${testValue})`;
    }

    const table: RunsTestTable = {
        title: `Runs Test (${displayTitle})`,
        columnHeaders: [{ header: "", key: "rowHeader" }],
        rows: []
    };
    
    // Add column headers for each variable
    runsTestResults.forEach((result, index) => {
        if (result && result.variable) {
            table.columnHeaders.push({
                header: result.variable.label || result.variable.name || `Variable ${index + 1}`,
                key: `var_${index}`
            });
        }
    });

    // Ensure we have at least one column header
    if (table.columnHeaders.length <= 1) {
        return {
            title: `Runs Test (${title})`,
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    // Create rows for the table
    const testValueRow: TableRow = { rowHeader: ["Test Value"] };
    const casesBelowRow: TableRow = { rowHeader: ["Cases < Test Value"] };
    const casesAboveRow: TableRow = { rowHeader: ["Cases >= Test Value"] };
    const totalCasesRow: TableRow = { rowHeader: ["Total Cases"] };
    const runsRow: TableRow = { rowHeader: ["Number of Runs"] };
    const zRow: TableRow = { rowHeader: ["Z"] };
    const sigRow: TableRow = { rowHeader: ["Asymp. Sig. (2-tailed)"] };

    // Fill in the data for each variable
    runsTestResults.forEach((result, index) => {
        if (!result || !result.stats || !('TestValue' in result.stats)) return;
        
        const stats = result.stats as RunsTest;
        const key = `var_${index}`;
        
        testValueRow[key] = formatNumber(stats.TestValue, 2);
        casesBelowRow[key] = stats.CasesBelow;
        casesAboveRow[key] = stats.CasesAbove;
        totalCasesRow[key] = stats.Total;
        runsRow[key] = stats.Runs;
        zRow[key] = formatNumber(stats.Z, 3);
        sigRow[key] = formatPValue(stats.PValue);
    });

    // Add rows to the table
    table.rows.push(
        testValueRow,
        casesBelowRow,
        casesAboveRow,
        totalCasesRow,
        runsRow,
        zRow,
        sigRow
    );

    return table;
}

/**
 * Formats descriptive statistics table
 * @param results Runs test results
 * @returns Formatted table
 */
export function formatDescriptiveStatisticsTable(
    results: RunsTestResults,
    displayStatistics?: DisplayStatisticsOptions
): RunsTestTable {
    if (!results || !results.descriptiveStatistics || results.descriptiveStatistics.length === 0) {
        return {
            title: "Descriptive Statistics",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const table: RunsTestTable = {
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
        if (!result || !result.stats || !('N' in result.stats)) return;
        
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
 * Formats Z value
 * @param z Z value
 * @returns Formatted Z value
 */
export const formatZ = (z: number | null | undefined) => {
    if (z === null || z === undefined) return null;
    return z.toFixed(3);
};