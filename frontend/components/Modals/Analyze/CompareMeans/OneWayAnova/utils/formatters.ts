import { 
    OneWayAnovaResults, 
    OneWayAnovaTable, 
    TableColumnHeader, 
    TableRow, 
    MultipleComparisons,
    HomogeneousSubsets,
    OneWayAnova
} from '../types';
import { Variable } from '@/types/Variable';

/**
 * Formats the ANOVA table
 * @param results OneWayAnova results
 * @returns Formatted table
 */
export function formatOneWayAnovaTable(
    results: OneWayAnovaResults
): OneWayAnovaTable {
    if (!results || !results.oneWayAnova || results.oneWayAnova.length === 0) {
        return {
            title: "ANOVA",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    const table: OneWayAnovaTable = {
        title: 'ANOVA',
        columnHeaders: [
            { header: '', key: 'rowHeader' },
            { header: '', key: 'type' },
            { header: 'Sum of Squares', key: 'SumOfSquares' },
            { header: 'df', key: 'df' },
            { header: 'Mean Square', key: 'MeanSquare' },
            { header: 'F', key: 'F' },
            { header: 'Sig.', key: 'Sig' }
        ],
        rows: []
    };

    // Process each result
    results.oneWayAnova.forEach((result) => {
        const { variable, oneWayAnova } = result;
        const { SumOfSquares, df, MeanSquare, F, Sig, withinGroupsSumOfSquares, withinGroupsDf, withinGroupsMeanSquare, totalSumOfSquares, totalDf } = oneWayAnova as OneWayAnova;
        const decimals = variable.decimals;

        // Between Groups row
        table.rows.push({
            rowHeader: [variable.label || variable.name],
            type: 'Between Groups',
            SumOfSquares: formatNumber(SumOfSquares, decimals + 3),
            df: df,
            MeanSquare: formatNumber(MeanSquare, decimals + 3),
            F: formatNumber(F, decimals + 3),
            Sig: formatPValue(Sig)
        });

        // Within Groups row (assuming these values are available)
        table.rows.push({
            rowHeader: [variable.label || variable.name],
            type: 'Within Groups',
            SumOfSquares: formatNumber(withinGroupsSumOfSquares, decimals + 3),
            df: withinGroupsDf,
            MeanSquare: formatNumber(withinGroupsMeanSquare, decimals + 3)
        });

        // Total row
        table.rows.push({
            rowHeader: [variable.label || variable.name],
            type: 'Total',
            SumOfSquares: formatNumber(totalSumOfSquares, decimals + 3),
            df: totalDf
        });
    });

    return table;
}

/**
 * Formats the descriptive statistics table
 * @param results OneWayAnova results
 * @returns Formatted table
 */
export function formatDescriptiveStatisticsTable(
    results: OneWayAnovaResults
): OneWayAnovaTable {
    if (!results || !results.descriptives || results.descriptives.length === 0) {
        return {
            title: "Descriptives",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    const table: OneWayAnovaTable = {
        title: 'Descriptives',
        columnHeaders: [
            { header: '', key: 'rowHeader' },
            { header: '', key: 'factor' },
            { header: 'N', key: 'N' },
            { header: 'Mean', key: 'Mean' },
            { header: 'Std. Deviation', key: 'StdDeviation' },
            { header: 'Std. Error', key: 'StdError' },
            { 
                header: '95% Confidence Interval for Mean', 
                key: 'CI',
                children: [
                    { header: 'Lower Bound', key: 'LowerBound' },
                    { header: 'Upper Bound', key: 'UpperBound' }
                ]
            },
            { header: 'Minimum', key: 'Minimum' },
            { header: 'Maximum', key: 'Maximum' }
        ],
        rows: []
    };

    // Process each variable's descriptive statistics
    results.descriptives.forEach((result) => {
        const { variable, descriptives } = result;
        const variableName = variable.label || variable.name;
        const decimals = variable.decimals;

        // Check if descriptives is an array (new format) or a single object (old format)
        if (Array.isArray(descriptives)) {
            // New format - array of descriptives
            descriptives.forEach((stat) => {
                table.rows.push({
                    rowHeader: [variableName],
                    factor: stat.factor,
                    N: stat.N,
                    Mean: formatNumber(stat.Mean, decimals + 2),
                    StdDeviation: formatNumber(stat.StdDeviation, decimals + 3),
                    StdError: formatNumber(stat.StdError, decimals + 3),
                    LowerBound: formatNumber(stat.LowerBound, decimals + 2),
                    UpperBound: formatNumber(stat.UpperBound, decimals + 2),
                    Minimum: formatNumber(stat.Minimum, decimals),
                    Maximum: formatNumber(stat.Maximum, decimals)
                });
            });
        } else if (descriptives) {
            // Old format - single descriptives object
            const { factor, N, Mean, StdDeviation, StdError, LowerBound, UpperBound, Minimum, Maximum } = descriptives;
            
            table.rows.push({
                rowHeader: [variableName],
                factor: factor || 'Group',
                N: N,
                Mean: formatNumber(Mean, decimals),
                StdDeviation: formatNumber(StdDeviation, decimals),
                StdError: formatNumber(StdError, decimals),
                LowerBound: formatNumber(LowerBound, decimals),
                UpperBound: formatNumber(UpperBound, decimals),
                Minimum: formatNumber(Minimum, decimals),
                Maximum: formatNumber(Maximum, decimals)
            });
        }
    });

    return table;
}

/**
 * Formats the homogeneity of variance table
 * @param results OneWayAnova results
 * @returns Formatted table
 */
export function formatHomogeneityOfVarianceTable(
    results: OneWayAnovaResults
): OneWayAnovaTable {
    if (!results || !results.homogeneityOfVariance || results.homogeneityOfVariance.length === 0) {
        return {
            title: "Test of Homogeneity of Variances",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    const table: OneWayAnovaTable = {
        title: 'Test of Homogeneity of Variances',
        columnHeaders: [
            { header: '', key: 'rowHeader' },
            { header: '', key: 'type' },
            { header: 'Levene Statistic', key: 'LeveneStatistic' },
            { header: 'df1', key: 'df1' },
            { header: 'df2', key: 'df2' },
            { header: 'Sig.', key: 'Sig' },
        ],
        rows: []
    };

    // Process each variable's descriptive statistics
    results.homogeneityOfVariance.forEach((result) => {
        const { variable, homogeneityOfVariance } = result;
        const variableName = variable.label || variable.name;
        const decimals = variable.decimals;

        // Check if descriptives is an array (new format) or a single object (old format)
        if (Array.isArray(homogeneityOfVariance)) {
            // New format - array of descriptives
            homogeneityOfVariance.forEach((stat) => {
                table.rows.push({
                    rowHeader: [variableName],
                    type: stat.type,
                    LeveneStatistic: formatNumber(stat.LeveneStatistic, decimals + 3),
                    df1: formatDF(stat.df1),
                    df2: formatDF(stat.df2),
                    Sig: formatPValue(stat.Sig)
                });
            });
        } else if (homogeneityOfVariance) {
            // Old format - single descriptives object
            const { type, LeveneStatistic, df1, df2, Sig } = homogeneityOfVariance;
            
            table.rows.push({
                rowHeader: [variableName],
                type: type,
                LeveneStatistic: formatNumber(LeveneStatistic, decimals + 3),
                df1: formatDF(df1),
                df2: formatDF(df2),
                Sig: formatPValue(Sig)
            });
        }
    });

    return table;
}

/**
 * Formats the multiple comparisons table
 * @param results OneWayAnova results
 * @returns Formatted table
 */
export function formatMultipleComparisonsTable(
    results: OneWayAnovaResults,
    factorLabel: string
): OneWayAnovaTable {
    if (!results || !results.multipleComparisons || results.multipleComparisons.length === 0) {
        return {
            title: "Multiple Comparisons",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    const table: OneWayAnovaTable = {
        title: 'Multiple Comparisons',
        columnHeaders: [
            { header: 'Dependent Variable', key: 'rowHeader' },
            { header: `(I) ${factorLabel}`, key: 'factor1' },
            { header: `(J) ${factorLabel}`, key: 'factor2' },
            { header: 'Mean Difference (I-J)', key: 'meanDifference' },
            { header: 'Std. Error', key: 'stdError' },
            { header: 'Sig.', key: 'Sig' },
            { header: 'Lower Bound', key: 'lowerBound' },
            { header: 'Upper Bound', key: 'upperBound' }
        ],
        rows: []
    };

    // Group by method
    const groupedByMethod = results.multipleComparisons.reduce((acc, curr) => {
        const { variable } = curr;
        const method = Array.isArray(curr.multipleComparisons) && curr.multipleComparisons.length > 0 
            ? curr.multipleComparisons[0].method 
            : (curr.multipleComparisons as MultipleComparisons)?.method;
        
        if (!method) return acc;
        
        const key = `${variable.name}_${method}`;
        if (!acc[key]) {
            acc[key] = {
                variable,
                method,
                comparisons: []
            };
        }
        
        // Add comparisons to the group
        if (Array.isArray(curr.multipleComparisons)) {
            acc[key].comparisons.push(...curr.multipleComparisons);
        } else {
            acc[key].comparisons.push(curr.multipleComparisons as MultipleComparisons);
        }
        
        return acc;
    }, {} as Record<string, { variable: Variable, method: string, comparisons: MultipleComparisons[] }>);

    // Process each method group
    Object.values(groupedByMethod).forEach(({ variable, method, comparisons }) => {
        const variableName = variable.label || variable.name;
        const decimals = variable.decimals || 3;

        // Add rows for each comparison
        comparisons.forEach((comparison) => {
            const { factor1, factor2, meanDifference, stdError, Sig, lowerBound, upperBound } = comparison;
            
            table.rows.push({
                rowHeader: [`${variableName} (${method})`],
                factor1: factor1,
                factor2: factor2,
                meanDifference: formatNumber(meanDifference, decimals),
                stdError: formatNumber(stdError, decimals),
                Sig: formatPValue(Sig),
                lowerBound: formatNumber(lowerBound, decimals),
                upperBound: formatNumber(upperBound, decimals)
            });
        });
    });

    return table;
}

/**
 * Formats the homogeneous subsets table
 * @param results OneWayAnova results
 * @param index Index of the variable in the results
 * @param variableName Name of the variable to format
 * @returns Formatted table
 */
export function formatHomogeneousSubsetsTable(
    results: OneWayAnovaResults,
    index: number,
    variable: Variable
): OneWayAnovaTable {
    if (!results || !results.homogeneousSubsets || results.homogeneousSubsets.length === 0) {
        return {
            title: variable.label || variable.name,
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    // Ambil semua subset untuk variable ini (bisa lebih dari satu, misal Tukey dan Duncan)
    const variableSubsets = results.homogeneousSubsets.filter(
        (v) => v.variable && (v.variable.name === variable.name || v.variable.label === variable.label)
    );

    // mencari subsetCount terbesar
    const maxSubset = Math.max(...variableSubsets.map(v => v.subsetCount || 1));


    // Determine the number of subsets
    const numSubsets = maxSubset || 1;

    // Create column headers based on the number of subsets
    const subsetHeaders: TableColumnHeader[] = [];
    for (let i = 1; i <= numSubsets; i++) {
        subsetHeaders.push({ header: i.toString(), key: `subset${i}` });
    }

    const table: OneWayAnovaTable = {
        title: variable.label || variable.name,
        columnHeaders: [
            { header: '', key: 'rowHeader' },
            { header: 'Wilayah', key: 'factor' },
            { header: 'N', key: 'N' },
            { 
                header: 'Subset for alpha = 0.05',
                key: 'subsets',
                children: subsetHeaders
            }
        ],
        rows: []
    };

    // Gabungkan semua homogeneousSubsets untuk variable ini, group by method
    if (variableSubsets.length > 0) {
        // Group by method
        const methodGroups: Record<string, any[]> = {};

        // Cast to any[] to handle both array and single object cases
        const subsets = variableSubsets.map(v => v.homogeneousSubsets).flat();

        for (const item of subsets as any[]) {
            const method = item.method;
            if (!method) continue;

            if (!methodGroups[method]) {
                methodGroups[method] = [];
            }

            methodGroups[method].push(item);
        }

        // Untuk urutan output: urutkan method by urutan kemunculan di results.homogeneousSubsets
        const methodOrder: string[] = [];
        for (const item of subsets as any[]) {
            if (item.method && !methodOrder.includes(item.method)) {
                methodOrder.push(item.method);
            }
        }

        // Untuk setiap method, tambahkan rows ke table.rows
        for (const method of methodOrder) {
            const items = methodGroups[method];
            if (!items) continue;

            // Pisahkan factor rows dan sig rows
            const factorItems = items.filter(item => item.factor !== 'Sig.');
            const sigItems = items.filter(item => item.factor === 'Sig.');

            // Buat mapping factor -> subset index array
            const factorToSubsets: Record<string, number[]> = {};
            for (const item of factorItems) {
                const factor = item.factor;
                factorToSubsets[factor] = [];
                for (let i = 1; i <= numSubsets; i++) {
                    const subsetKey = `subset${i}`;
                    if (item[subsetKey] !== undefined) {
                        factorToSubsets[factor].push(i);
                    }
                }
            }

            // Urutkan factorItems: faktor yang ada di subset1 dulu, dst
            factorItems.sort((a, b) => {
                const aSubsets = factorToSubsets[a.factor] || [];
                const bSubsets = factorToSubsets[b.factor] || [];
                const aMin = aSubsets.length > 0 ? Math.min(...aSubsets) : Number.MAX_SAFE_INTEGER;
                const bMin = bSubsets.length > 0 ? Math.min(...bSubsets) : Number.MAX_SAFE_INTEGER;
                return aMin - bMin;
            });

            // Tambahkan row untuk setiap factor
            for (const item of factorItems) {
                const row: TableRow = {
                    rowHeader: [method],
                    factor: item.factor,
                    N: item.N !== undefined && item.N !== null ? item.N.toString() : undefined
                };

                // Untuk setiap subset, jika ada value, masukkan
                for (let i = 1; i <= numSubsets; i++) {
                    const subsetKey = `subset${i}`;
                    if (item[subsetKey] !== undefined) {
                        row[subsetKey] = formatNumber(item[subsetKey], 3);
                    }
                }

                table.rows.push(row);
            }

            // Tambahkan row untuk Sig. jika ada
            if (sigItems.length > 0) {
                const sigRow: TableRow = {
                    rowHeader: [method],
                    factor: 'Sig.'
                };

                // Untuk setiap subset, jika ada value, masukkan
                for (const item of sigItems) {
                    for (let i = 1; i <= numSubsets; i++) {
                        const subsetKey = `subset${i}`;
                        if (item[subsetKey] !== undefined) {
                            sigRow[subsetKey] = formatPValue(item[subsetKey]);
                        }
                    }
                }

                table.rows.push(sigRow);
            }
        }
    }

    console.log("formattedHomogeneousSubsetsTable", JSON.stringify(table));
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