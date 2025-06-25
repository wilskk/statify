import type { Variable } from "@/types/Variable";
import { CrosstabsAnalysisParams } from "../types";

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

// --- Type definitions for Crosstabs analysis results ---
export interface CrosstabsWorkerResult {
    summary: {
        valid: number;
        missing: number;
        rowCategories: (string | number)[];
        colCategories: (string | number)[];
        rowTotals: number[];
        colTotals: number[];
        totalCases: number;
    };
    contingencyTable: number[][];
}

/**
 * Formats the Case Processing Summary table for Crosstabs.
 */
export const formatCaseProcessingSummary = (result: CrosstabsWorkerResult, params: CrosstabsAnalysisParams): FormattedTable | null => {
    if (!result || !result.summary) return null;

    const { valid, missing } = result.summary;
    const total = valid + missing;
    
    const rowVarNames = params.rowVariables.map(v => v.label || v.name).join(' * ');
    const colVarNames = params.columnVariables.map(v => v.label || v.name).join(' * ');

    const rows: TableRowData[] = [
        {
            rowHeader: [`${rowVarNames} * ${colVarNames}`],
            valid_n: valid,
            valid_percent: total > 0 ? `${((valid / total) * 100).toFixed(1)}%` : '0.0%',
            missing_n: missing,
            missing_percent: total > 0 ? `${((missing / total) * 100).toFixed(1)}%` : '0.0%',
            total_n: total,
            total_percent: '100.0%',
        }
    ];

    const columnHeaders: ColumnHeader[] = [
        { header: '', key: 'rowHeader' },
        { 
            header: 'Cases', 
            children: [
                { header: 'Valid', children: [{ header: 'N', key: 'valid_n' }, { header: 'Percent', key: 'valid_percent' }] },
                { header: 'Missing', children: [{ header: 'N', key: 'missing_n' }, { header: 'Percent', key: 'missing_percent' }] },
            ]
        },
        {
            header: 'Total',
            children: [
              { header: 'N', key: 'total_n' },
              { header: 'Percent', key: 'total_percent' }
            ]
        }
    ];

    return { title: "Case Processing Summary", columnHeaders, rows };
};


/**
 * Formats the main Crosstabulation table.
 */
export const formatCrosstabulationTable = (result: CrosstabsWorkerResult, params: CrosstabsAnalysisParams): FormattedTable | null => {
    if (!result || !result.summary || !result.contingencyTable) return null;

    const { rowCategories, colCategories, rowTotals, colTotals, totalCases } = result.summary;
    const counts = result.contingencyTable;
    
    const rowVarLabel = params.rowVariables[0]?.label || params.rowVariables[0]?.name;
    const colVarLabel = params.columnVariables[0]?.label || params.columnVariables[0]?.name;

    // Build column headers dynamically from column labels
    const dynamicColumnHeaders: ColumnHeader[] = colCategories.map((label, index) => ({
        header: String(label),
        key: `c${index + 1}`
    }));
    
    const columnHeaders: ColumnHeader[] = [
        { header: "Count", key: "rh1" },
        { header: "", key: "rh2" },
        {
            header: colVarLabel,
            children: dynamicColumnHeaders
        },
        { header: 'Total', key: 'total' }
    ];

    // Build data rows (children of the main variable row)
    const dataRows: any[] = [];
    rowCategories.forEach((label, rowIndex) => {
        const rowData: any = {
            rowHeader: [null, String(label)],
        };
        colCategories.forEach((colLabel, colIndex) => {
            rowData[`c${colIndex + 1}`] = String(counts[rowIndex][colIndex]);
        });
        rowData['total'] = String(rowTotals[rowIndex]);
        dataRows.push(rowData);
    });

    const mainRow = {
        rowHeader: [rowVarLabel, null],
        children: dataRows
    };

    // Add Total row
    const totalRow: any = {
        rowHeader: ['Total', null],
    };
    colCategories.forEach((colLabel, colIndex) => {
        totalRow[`c${colIndex + 1}`] = String(colTotals[colIndex]);
    });
    totalRow['total'] = String(totalCases);
    
    const rows = [mainRow, totalRow];

    const title = `${rowVarLabel} * ${colVarLabel} Crosstabulation`;
    
    return { title, columnHeaders, rows };
}; 