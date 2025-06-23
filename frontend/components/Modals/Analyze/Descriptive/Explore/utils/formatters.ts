import type { Variable, ValueLabel } from "@/types/Variable";
import { ExploreAnalysisParams } from "../types";

// --- Type definitions for Data Table component ---
interface ColumnHeader {
    header: string;
    key?: string;
    children?: ColumnHeader[];
}

interface TableRowData {
    rowHeader: (string | null)[];
    [key: string]: any;
}

export interface FormattedTable {
    title: string;
    columnHeaders: ColumnHeader[];
    rows: TableRowData[];
    footnotes?: string[];
}

// --- Type definitions for Explore analysis results ---

/**
 * The structure of a single result from the 'examine' worker for one dependent variable.
 */
export interface ExamineWorkerResult {
    variable: Variable;
    summary: {
        n: number;
        valid: number;
        missing: number;
    };
    // Other statistics like descriptives, percentiles, etc. will be here.
    [key:string]: any;
}

/**
 * The aggregated results collected by the useExploreAnalysis hook.
 * The key is a string representing the factor group (or 'all_data' if no factors).
 */
export interface ExploreAggregatedResults {
    [factorKey: string]: {
        factorLevels: Record<string, string | number>;
        results: ExamineWorkerResult[];
    }
}

// Helper to get the value label for a factor
const getFactorLabel = (factorVar: Variable, factorValue: any): string => {
    // Ensure we handle both string and number values from the data
    const foundLabel = factorVar.values?.find((vl: ValueLabel) => String(vl.value) === String(factorValue));
    return foundLabel?.label || String(factorValue);
};

const regroupByDepVar = (results: ExploreAggregatedResults): Record<string, any[]> => {
    const resultsByDepVar: Record<string, any[]> = {};
    for (const groupKey in results) {
        for (const result of results[groupKey].results) {
            if (!resultsByDepVar[result.variable.name]) {
                resultsByDepVar[result.variable.name] = [];
            }
            resultsByDepVar[result.variable.name].push({ ...result, factorLevels: results[groupKey].factorLevels });
        }
    }
    return resultsByDepVar;
}

// --- Formatter Functions ---

/**
 * Formats the Case Processing Summary table.
 * @param results - The aggregated results from the analysis hook.
 * @param params - The analysis parameters, used for things like confidence interval level.
 * @returns A formatted table object for the DataTableRenderer component.
 */
export const formatCaseProcessingSummary = (results: ExploreAggregatedResults, params: ExploreAnalysisParams): FormattedTable | null => {
    console.log("--- [Formatter] formatCaseProcessingSummary ---");
    console.log("Received results:", JSON.parse(JSON.stringify(results)));
    console.log("Received params:", JSON.parse(JSON.stringify(params)));

    const rows: any[] = []; // Can be TableRowData or have children
    const hasFactors = params.factorVariables.length > 0 && params.factorVariables.every(v => v !== null);
    const resultsByDepVar = regroupByDepVar(results);
    
    for (const depVarName in resultsByDepVar) {
        const depVarResults = resultsByDepVar[depVarName];
        
        if (hasFactors) {
            const parentRow: any = {
                rowHeader: [depVarResults[0].variable.label || depVarName, null],
                children: []
            };

            depVarResults.forEach(result => {
                const totalN = result.summary.valid + result.summary.missing;
                const factorVar = params.factorVariables[0];
                const factorValue = result.factorLevels[factorVar.name];
                const factorLabel = getFactorLabel(factorVar, factorValue);

                parentRow.children.push({
                    rowHeader: [null, factorLabel],
                    Valid_N: result.summary.valid,
                    Valid_Percent: totalN > 0 ? `${((result.summary.valid / totalN) * 100).toFixed(1)}%` : '0.0%',
                    Missing_N: result.summary.missing,
                    Missing_Percent: totalN > 0 ? `${((result.summary.missing / totalN) * 100).toFixed(1)}%` : '0.0%',
                    Total_N: totalN,
                    Total_Percent: '100.0%'
                });
            });
            rows.push(parentRow);
        } else {
             // Logic for when there are no factors
             depVarResults.forEach(result => {
                const totalN = result.summary.valid + result.summary.missing;
                rows.push({
                    rowHeader: [result.variable.label || result.variable.name],
                    Valid_N: result.summary.valid,
                    Valid_Percent: totalN > 0 ? `${((result.summary.valid / totalN) * 100).toFixed(1)}%` : '0.0%',
                    Missing_N: result.summary.missing,
                    Missing_Percent: totalN > 0 ? `${((result.summary.missing / totalN) * 100).toFixed(1)}%` : '0.0%',
                    Total_N: totalN,
                    Total_Percent: '100.0%'
                });
            });
        }
    }

    if (rows.length === 0) return null;

    // Define column headers
    const casesHeader: ColumnHeader = {
        header: 'Cases',
        children: [
            { header: 'Valid', children: [{ header: 'N', key: 'Valid_N' }, { header: 'Percent', key: 'Valid_Percent' }] },
            { header: 'Missing', children: [{ header: 'N', key: 'Missing_N' }, { header: 'Percent', key: 'Missing_Percent' }] },
            { header: 'Total', children: [{ header: 'N', key: 'Total_N' }, { header: 'Percent', key: 'Total_Percent' }] }
        ]
    };

    let columnHeaders: ColumnHeader[];
    if (hasFactors) {
        const factorVarName = params.factorVariables[0]?.label || params.factorVariables[0]?.name || '';
        columnHeaders = [
            { header: '', key: 'row_header_col_1' },
            { header: factorVarName, key: 'row_header_col_2' },
            casesHeader
        ];
    } else {
        columnHeaders = [
            { header: '', key: 'row_header_col_1' },
            casesHeader
        ];
    }

    return { title: "Case Processing Summary", columnHeaders, rows };
};

/**
 * Formats the Descriptives statistics table.
 * @param results - The aggregated results from the analysis hook.
 * @param params - The analysis parameters, used for things like confidence interval level.
 * @returns A formatted table object for the DataTableRenderer component.
 */
export const formatDescriptivesTable = (results: ExploreAggregatedResults, params: ExploreAnalysisParams): FormattedTable | null => {
    console.log("--- [Formatter] formatDescriptivesTable ---");
    console.log("Received results:", JSON.parse(JSON.stringify(results)));
    console.log("Received params:", JSON.parse(JSON.stringify(params)));

    const rows: any[] = [];
    const hasFactors = params.factorVariables.length > 0 && params.factorVariables.every(v => v !== null);
    const ciLabel = `${params.confidenceInterval || '95'}% Confidence Interval for Mean`;
    const resultsByDepVar = regroupByDepVar(results);

    const hasData = Object.values(results).some(g => g.results.some(r => r.descriptives));
    if (!hasData) return null;

    // Build rows in a completely flat structure
    for (const depVarName in resultsByDepVar) {
        const depVarResults = resultsByDepVar[depVarName];
        const depVarLabel = depVarResults[0]?.variable?.label || depVarName;
        
        // Process each dependent variable
        depVarResults.forEach(result => {
            if (!result.descriptives) return;
            const d = result.descriptives;

            // Get factor info if available
            let factorLabel = "";
            if (hasFactors) {
                const factorVar = params.factorVariables[0];
                const factorValue = result.factorLevels[factorVar.name];
                factorLabel = getFactorLabel(factorVar, factorValue);
            }

            // Create row entries (all flat, no nesting)
            // Mean
            rows.push({
                rowHeader: [depVarLabel, factorLabel, "Mean", null],
                statistic: d.Mean?.toFixed(4) || "",
                std_error: d.SEMean?.toFixed(5) || ""
            });
            
            // Confidence Interval - Lower Bound
            if (d.confidenceInterval?.lower !== undefined) {
                rows.push({
                    rowHeader: [depVarLabel, factorLabel, ciLabel, "Lower Bound"],
                    statistic: d.confidenceInterval.lower?.toFixed(4) || "",
                    std_error: ""
                });
            }
            
            // Confidence Interval - Upper Bound
            if (d.confidenceInterval?.upper !== undefined) {
                rows.push({
                    rowHeader: [depVarLabel, factorLabel, ciLabel, "Upper Bound"],
                    statistic: d.confidenceInterval.upper?.toFixed(4) || "",
                    std_error: ""
                });
            }
            
            // 5% Trimmed Mean
            rows.push({
                rowHeader: [depVarLabel, factorLabel, "5% Trimmed Mean", null],
                statistic: result.trimmedMean?.toFixed(4) || "",
                std_error: ""
            });
            
            // Median
            rows.push({
                rowHeader: [depVarLabel, factorLabel, "Median", null],
                statistic: d.Median?.toFixed(4) || "",
                std_error: ""
            });
            
            // Variance
            rows.push({
                rowHeader: [depVarLabel, factorLabel, "Variance", null],
                statistic: d.Variance?.toFixed(3) || "",
                std_error: ""
            });
            
            // Std. Deviation
            rows.push({
                rowHeader: [depVarLabel, factorLabel, "Std. Deviation", null],
                statistic: d.StdDev?.toFixed(5) || "",
                std_error: ""
            });
            
            // Minimum
            rows.push({
                rowHeader: [depVarLabel, factorLabel, "Minimum", null],
                statistic: d.Minimum?.toFixed(2) || "",
                std_error: ""
            });
            
            // Maximum
            rows.push({
                rowHeader: [depVarLabel, factorLabel, "Maximum", null],
                statistic: d.Maximum?.toFixed(2) || "",
                std_error: ""
            });
            
            // Range
            rows.push({
                rowHeader: [depVarLabel, factorLabel, "Range", null],
                statistic: d.Range?.toFixed(2) || "",
                std_error: ""
            });
            
            // Interquartile Range
            rows.push({
                rowHeader: [depVarLabel, factorLabel, "Interquartile Range", null],
                statistic: d.IQR?.toFixed(2) || "",
                std_error: ""
            });
            
            // Skewness
            rows.push({
                rowHeader: [depVarLabel, factorLabel, "Skewness", null],
                statistic: d.Skewness?.toFixed(3) || "",
                std_error: d.SESkew?.toFixed(3) || ""
            });
            
            // Kurtosis
            rows.push({
                rowHeader: [depVarLabel, factorLabel, "Kurtosis", null],
                statistic: d.Kurtosis?.toFixed(3) || "",
                std_error: d.SEKurt?.toFixed(3) || ""
            });
        });
    }

    if (rows.length === 0) return null;
    
    // Define column headers based on whether we have factors or not
    let columnHeaders: ColumnHeader[];
    if (hasFactors) {
        const factorVarName = params.factorVariables[0]?.label || params.factorVariables[0]?.name || '';
        columnHeaders = [
          { header: "", key: "rowHeader1" },
          { header: factorVarName, key: "rowHeader2" },
          { header: "", key: "rowHeader3" },
          { header: "", key: "rowHeader4" },
          { header: "Statistic", key: "statistic" },
          { header: "Std. Error", key: "std_error" }
        ];
    } else {
        columnHeaders = [
          { header: "", key: "rowHeader1" },
          { header: "", key: "rowHeader2" },
          { header: "", key: "rowHeader3" },
          { header: "", key: "rowHeader4" }, // Need all 4 to match expectations
          { header: "Statistic", key: "statistic" },
          { header: "Std. Error", key: "std_error" }
        ];
    }
    
    return { title: "Descriptives", columnHeaders, rows };
}

/**
 * Formats the M-Estimators table.
 * @param results - The aggregated results from the analysis hook.
 * @param params - The analysis parameters to check if the estimators were requested.
 * @returns A formatted table object for the DataTableRenderer component.
 */
export const formatMEstimatorsTable = (results: ExploreAggregatedResults, params: ExploreAnalysisParams): FormattedTable | null => {
    console.log("--- [Formatter] formatMEstimatorsTable ---");
    console.log("Received results:", JSON.parse(JSON.stringify(results)));
    console.log("Received params:", JSON.parse(JSON.stringify(params)));

    if (!params.showMEstimators) return null;

    const hasData = Object.values(results).some(g => g.results.some(r => r.mEstimators));
    if (!hasData) return null;

    const rows: any[] = [];
    const hasFactors = params.factorVariables.length > 0 && params.factorVariables.every(v => v !== null);
    const resultsByDepVar = regroupByDepVar(results);

    for (const depVarName in resultsByDepVar) {
        const depVarResults = resultsByDepVar[depVarName];
        const depVarLabel = depVarResults[0]?.variable?.label || depVarName;

        if (hasFactors) {
            const factorChildren = depVarResults.map(result => {
                if (!result.mEstimators) return null;
                const m = result.mEstimators;
                const factorVar = params.factorVariables[0];
                const factorValue = result.factorLevels[factorVar.name];
                const factorLabel = getFactorLabel(factorVar, factorValue);
                
                return {
                    rowHeader: [null, factorLabel],
                    huber: m.huber?.toFixed(4),
                    tukey: m.tukey?.toFixed(4),
                    hampel: m.hampel?.toFixed(4),
                    andrews: m.andrew?.toFixed(4),
                };
            }).filter(Boolean);

            if (factorChildren.length > 0) {
                 rows.push({
                    rowHeader: [depVarLabel, null],
                    children: factorChildren
                });
            }
        } else {
            const result = depVarResults[0];
            if (result.mEstimators) {
                const m = result.mEstimators;
                rows.push({
                    rowHeader: [depVarLabel, null],
                    huber: m.huber?.toFixed(4),
                    tukey: m.tukey?.toFixed(4),
                    hampel: m.hampel?.toFixed(4),
                    andrews: m.andrew?.toFixed(4),
                });
            }
        }
    }

    if (rows.length === 0) return null;

    let columnHeaders: ColumnHeader[];
    if (hasFactors) {
        const factorVarName = params.factorVariables[0]?.label || params.factorVariables[0]?.name || '';
        columnHeaders = [
            { header: '', key: 'rowHeader1' },
            { header: factorVarName, key: 'rowHeader2' },
            { header: "Huber's M-Estimator", key: 'huber' },
            { header: "Tukey's Biweight", key: 'tukey' },
            { header: "Hampel's M-Estimator", key: 'hampel' },
            { header: "Andrews' Wave", key: 'andrews' }
        ];
    } else {
        columnHeaders = [
            { header: '', key: 'rowHeader1' },
            { header: "Huber's M-Estimator", key: 'huber' },
            { header: "Tukey's Biweight", key: 'tukey' },
            { header: "Hampel's M-Estimator", key: 'hampel' },
            { header: "Andrews' Wave", key: 'andrews' }
        ];
    }
    
    const footnotes = [
        "a. The weighting constant is 1.339.",
        "b. The weighting constant is 4.685.",
        "c. The weighting constants are 1.700, 3.400, and 8.500.",
        "d. The weighting constant is 1.340*pi."
    ];

    return {
        title: "M-Estimators",
        columnHeaders: columnHeaders,
        rows: rows,
        footnotes: footnotes
    };
};

/**
 * Formats the Percentiles table.
 * @param results - The aggregated results from the analysis hook.
 * @param params - The analysis parameters to check if percentiles were requested.
 * @returns A formatted table object for the DataTableRenderer component.
 */
export const formatPercentilesTable = (results: ExploreAggregatedResults, params: ExploreAnalysisParams): FormattedTable | null => {
    console.log("--- [Formatter] formatPercentilesTable ---");
    console.log("Received results:", JSON.parse(JSON.stringify(results)));
    console.log("Received params:", JSON.parse(JSON.stringify(params)));

    if (!params.showPercentiles) return null;

    const hasData = Object.values(results).some(g => g.results.some(r => r.percentiles || r.descriptives));
    if (!hasData) return null;

    const rows: any[] = [];
    const hasFactors = params.factorVariables.length > 0 && params.factorVariables.every(v => v !== null);
    const resultsByDepVar = regroupByDepVar(results);

    const methods = [
        { name: 'Weighted Average (Definition 1)', key: 'wa' },
        { name: "Tukey's Hinges", key: 'tukey' }
    ];

    for (const method of methods) {
        const depVarChildren: any[] = [];

        for (const depVarName in resultsByDepVar) {
            const depVarResults = resultsByDepVar[depVarName];
            const depVarLabel = depVarResults[0]?.variable?.label || depVarName;

            const createPercentileRowData = (result: any) => {
                if (method.key === 'wa') {
                    const wa = result.percentiles?.waverage;
                    if (!wa) return null;
                    return {
                        p5: wa[5]?.toFixed(4) || '.',
                        p10: wa[10]?.toFixed(4) || '.',
                        p25: wa[25]?.toFixed(4) || '.',
                        p50: wa[50]?.toFixed(4) || '.',
                        p75: wa[75]?.toFixed(4) || '.',
                        p90: wa[90]?.toFixed(4) || '.',
                        p95: wa[95]?.toFixed(4) || '.',
                    };
                } else { // Tukey
                    const d = result.descriptives;
                    if (!d) return null;
                    return {
                        p25: d.Percentiles?.['25']?.toFixed(4) || '.',
                        p50: d.Median?.toFixed(4) || '.',
                        p75: d.Percentiles?.['75']?.toFixed(4) || '.',
                    };
                }
            };

            if (hasFactors) {
                const factorChildren = depVarResults.map(result => {
                    const rowData = createPercentileRowData(result);
                    if (!rowData) return null;

                    const factorVar = params.factorVariables[0];
                    const factorValue = result.factorLevels[factorVar.name];
                    const factorLabel = getFactorLabel(factorVar, factorValue);
                    
                    return { rowHeader: [null, null, factorLabel], ...rowData };
                }).filter(Boolean);

                if (factorChildren.length > 0) {
                    depVarChildren.push({
                        rowHeader: [null, depVarLabel, null],
                        children: factorChildren
                    });
                }
            } else {
                 const result = depVarResults[0];
                 const rowData = createPercentileRowData(result);
                 if (rowData) {
                     depVarChildren.push({ rowHeader: [null, depVarLabel, null], ...rowData });
                 }
            }
        }

        if (depVarChildren.length > 0) {
            rows.push({
                rowHeader: [method.name, null, null],
                children: depVarChildren
            });
        }
    }

    if (rows.length === 0) return null;

    const percentileHeaders: ColumnHeader = {
        header: 'Percentiles',
        children: [
            { header: '5', key: 'p5' },
            { header: '10', key: 'p10' },
            { header: '25', key: 'p25' },
            { header: '50', key: 'p50' },
            { header: '75', key: 'p75' },
            { header: '90', key: 'p90' },
            { header: '95', key: 'p95' },
        ]
    };
    
    let columnHeaders: ColumnHeader[];
    if (hasFactors) {
        const factorVarName = params.factorVariables[0]?.label || params.factorVariables[0]?.name || '';
        columnHeaders = [
            { header: "", key: "rowHeader1" },
            { header: "", key: "rowHeader2" },
            { header: factorVarName, key: "rowHeader3" },
            percentileHeaders
        ];
    } else {
        columnHeaders = [
            { header: "", key: "rowHeader1" },
            { header: "", key: "rowHeader2" },
            percentileHeaders
        ];
    }

    return {
        title: "Percentiles",
        columnHeaders,
        rows
    };
}

/**
 * Formats the Extreme Values table.
 * @param results - The aggregated results from the analysis hook.
 * @param params - The analysis parameters to check if outliers were requested.
 * @returns A formatted table object for the DataTableRenderer component.
 */
export const formatExtremeValuesTable = (results: ExploreAggregatedResults, params: ExploreAnalysisParams): FormattedTable | null => {
    console.log("--- [Formatter] formatExtremeValuesTable ---");
    console.log("Received results:", JSON.parse(JSON.stringify(results)));
    console.log("Received params:", JSON.parse(JSON.stringify(params)));
    
    if (!params.showOutliers) return null;

    const hasData = Object.values(results).some(g => g.results.some(r => r.extremeValues));
    if (!hasData) return null;

    const rows: any[] = [];
    let isPartialA = false, isPartialB = false, isTruncated = false;
    const hasFactors = params.factorVariables.length > 0 && params.factorVariables.every(v => v !== null);
    const resultsByDepVar = regroupByDepVar(results);

    for (const depVarName in resultsByDepVar) {
        const depVarResults = resultsByDepVar[depVarName];
        const depVarLabel = depVarResults[0]?.variable?.label || depVarName;

        const createExtremeValueRows = (result: any) => {
            if (!result.extremeValues) return [];
            const ex = result.extremeValues;
            if (ex.isTruncated) isTruncated = true;

            const extremeRows: any[] = [];
            
            if (ex.highest && ex.highest.length > 0) {
                const highestChildren = ex.highest.map((val: any, i: number) => {
                    if (val.isPartial) isPartialA = true;
                    return { rowHeader: [null, null, null, (i + 1).toString()], case_number: val.caseNumber, value: val.value.toFixed(2) };
                });
                extremeRows.push({ rowHeader: [null, null, 'Highest', null], children: highestChildren });
            }

            if (ex.lowest && ex.lowest.length > 0) {
                 const lowestChildren = ex.lowest.map((val: any, i: number) => {
                    if (val.isPartial) isPartialB = true;
                    return { rowHeader: [null, null, null, (i + 1).toString()], case_number: val.caseNumber, value: val.value.toFixed(2) };
                });
                extremeRows.push({ rowHeader: [null, null, 'Lowest', null], children: lowestChildren });
            }
            return extremeRows;
        };

        if (hasFactors) {
            const factorChildren = depVarResults.map(result => {
                const extremeValueContent = createExtremeValueRows(result);
                if (extremeValueContent.length === 0) return null;

                const factorVar = params.factorVariables[0];
                const factorValue = result.factorLevels[factorVar.name];
                const factorLabel = getFactorLabel(factorVar, factorValue);
                
                return {
                    rowHeader: [null, factorLabel, null, null],
                    children: extremeValueContent
                };
            }).filter(Boolean);

            if (factorChildren.length > 0) {
                rows.push({
                    rowHeader: [depVarLabel, null, null, null],
                    children: factorChildren
                });
            }
        } else {
            const result = depVarResults[0];
            const extremeValueContent = createExtremeValueRows(result);
            if (extremeValueContent.length > 0) {
                rows.push({
                    rowHeader: [depVarLabel, null, null, null],
                    children: extremeValueContent
                });
            }
        }
    }

    if (rows.length === 0) return null;

    const footnotes: string[] = [];
    if(isTruncated) footnotes.push("The requested number of extreme values exceeds the number of data points. A smaller number of extremes is displayed.");
    if(isPartialA) footnotes.push("a. Only a partial list of cases with the value ... are shown in the table of upper extremes.");
    if(isPartialB) footnotes.push("b. Only a partial list of cases with the value ... are shown in the table of lower extremes.");

    let columnHeaders: ColumnHeader[];
    if (hasFactors) {
        const factorVarName = params.factorVariables[0]?.label || params.factorVariables[0]?.name || '';
        columnHeaders = [
            { header: "", key: "rh1" },
            { header: factorVarName, key: "rh2" },
            { header: "", key: "rh3" },
            { header: "", key: "rh4" },
            { header: "Case Number", key: "case_number" },
            { header: "Value", key: "value" }
        ];
    } else {
        columnHeaders = [
            { header: "", key: "rh1" },
            { header: "", key: "rh2" },
            { header: "", key: "rh3" },
            { header: "Case Number", key: "case_number" },
            { header: "Value", key: "value" }
        ];
    }
    
    return {
        title: "Extreme Values",
        columnHeaders: columnHeaders,
        rows: rows,
        footnotes: footnotes.length > 0 ? footnotes : undefined,
    };
}; 