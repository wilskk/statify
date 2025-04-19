// lib/utils/excelUtils.ts
import { Variable, ValueLabel } from "@/types/Variable";
import { DataRow } from "@/stores/useDataStore";
import { Meta } from "@/stores/useMetaStore"; // Assuming Meta type exists
import * as XLSX from 'xlsx';

export interface ExcelExportOptions {
    includeHeaders: boolean;
    includeVariablePropertiesSheet: boolean;
    includeMetadataSheet: boolean;
    includeDataLabels: boolean; // Apply value labels to data sheet
    applyHeaderStyling: boolean;
}

// Helper function to apply basic header styling
const applyHeaderStyle = (ws: XLSX.WorkSheet, range: XLSX.Range) => {
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: range.s.r, c: C });
        if (!ws[cellRef]) continue;
        ws[cellRef].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "F7F7F7" } }, // Light gray background
            alignment: { vertical: "center" }
        };
    }
};

// Helper to get value label map for quick lookup
const getValueLabelMap = (values: ValueLabel[]): Map<string | number, string> => {
    return new Map(values.map(vl => [vl.value, vl.label]));
};

/**
 * Generates an Excel Workbook object (using xlsx library) based on data and options.
 * @param data The main data rows.
 * @param variables The variable definitions.
 * 'metadata' Object containing project metadata.
 * @param options Configuration options for the export.
 * @returns An XLSX Workbook object.
 */
export const generateExcelWorkbook = (
    data: DataRow[],
    variables: Variable[],
    metadata: Meta | null, // Allow null for metadata
    options: ExcelExportOptions
): XLSX.WorkBook => {
    const {
        includeHeaders,
        includeVariablePropertiesSheet,
        includeMetadataSheet,
        includeDataLabels,
        applyHeaderStyling
    } = options;

    const wb = XLSX.utils.book_new();

    // --- 1. Create Data Sheet ---
    const dataSheetData: any[][] = [];
    const variableLabelMaps = includeDataLabels ? variables.map(v => getValueLabelMap(v.values)) : [];

    // Add headers if requested
    if (includeHeaders && variables.length > 0) {
        dataSheetData.push(variables.map(v => v.name));
    }

    // Add data rows, applying labels if requested
    data.forEach(row => {
        const processedRow = row.map((cell, colIndex) => {
            if (includeDataLabels && colIndex < variables.length) {
                const labelMap = variableLabelMaps[colIndex];
                if (labelMap.has(cell)) {
                    return labelMap.get(cell); // Return label
                }
            }
            // Attempt to infer type for Excel
            const variableType = variables[colIndex]?.type;
            if (cell === "" || cell === null || cell === undefined) return null; // Use null for empty cells
            if (typeof cell === 'number') return cell;
            if (typeof cell === 'string' && !isNaN(Number(cell)) && (variableType?.startsWith("NUMERIC") || ["COMMA", "DOT", "SCIENTIFIC"].includes(variableType || ''))) {
                return Number(cell); // Convert numeric strings to numbers
            }
            // Add date handling if necessary based on variableType
            // Example: if (variableType === 'DATE' && typeof cell === 'string') { try { return new Date(cell); } catch { /* ignore */ } }
            return cell; // Keep as string otherwise
        });
        dataSheetData.push(processedRow);
    });

    const wsData = XLSX.utils.aoa_to_sheet(dataSheetData);

    // Apply header styling to data sheet
    if (includeHeaders && applyHeaderStyling && dataSheetData.length > 0) {
        const dataRange = XLSX.utils.decode_range(wsData['!ref'] || "A1");
        applyHeaderStyle(wsData, { s: { r: 0, c: dataRange.s.c }, e: { r: 0, c: dataRange.e.c } });
    }

    // Set column widths roughly (optional, can be performance intensive)
    /*
    if (variables.length > 0) {
        const colWidths = variables.map(v => ({ wch: Math.max(v.name.length, v.width || 10) })); // Example width logic
        wsData['!cols'] = colWidths;
    }
    */

    XLSX.utils.book_append_sheet(wb, wsData, "Data");


    // --- 2. Create Variable Definitions Sheet ---
    if (includeVariablePropertiesSheet && variables.length > 0) {
        const varSheetData: any[][] = [];
        const varHeaders = [
            "Index", "Name", "Type", "Label", "Width", "Decimals",
            "Measure", "Align", "Role", "MissingValues", "ValueLabels"
        ];
        varSheetData.push(varHeaders);

        variables.forEach(v => {
            const valueLabelsString = v.values.map(vl => `${vl.value}=${JSON.stringify(vl.label)}`).join('; ');
            const missingString = v.missing.join('; ');
            varSheetData.push([
                v.columnIndex, v.name, v.type, v.label || "", v.width, v.decimals,
                v.measure, v.align, v.role, missingString, valueLabelsString
            ]);
        });

        const wsVar = XLSX.utils.aoa_to_sheet(varSheetData);
        if (applyHeaderStyling && varSheetData.length > 0) {
            const varRange = XLSX.utils.decode_range(wsVar['!ref'] || "A1");
            applyHeaderStyle(wsVar, { s: { r: 0, c: varRange.s.c }, e: { r: 0, c: varRange.e.c } });
        }
        // Optional: Adjust column widths for variable sheet
        // wsVar['!cols'] = varHeaders.map(h => ({ wch: h.length + 5 })); // Example width

        XLSX.utils.book_append_sheet(wb, wsVar, "Variable Definitions");
    }

    // --- 3. Create Metadata Sheet ---
    if (includeMetadataSheet && metadata && Object.keys(metadata).length > 0) {
        const metaSheetData: any[][] = [["Property", "Value"]];
        Object.entries(metadata).forEach(([key, value]) => {
            // Handle potential objects/arrays in metadata value
            const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
            metaSheetData.push([key, displayValue]);
        });

        const wsMeta = XLSX.utils.aoa_to_sheet(metaSheetData);
        if (applyHeaderStyling && metaSheetData.length > 0) {
            const metaRange = XLSX.utils.decode_range(wsMeta['!ref'] || "A1");
            applyHeaderStyle(wsMeta, { s: { r: 0, c: metaRange.s.c }, e: { r: 0, c: metaRange.e.c } });
        }
        // Optional: Adjust column widths for metadata sheet
        // wsMeta['!cols'] = [{wch: 20}, {wch: 50}]; // Example widths

        XLSX.utils.book_append_sheet(wb, wsMeta, "Metadata");
    }

    return wb;
};