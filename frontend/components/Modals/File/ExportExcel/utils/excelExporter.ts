import { Variable, ValueLabel, MissingValuesSpec } from "@/types/Variable";
import { DataRow } from "@/types/Data";
import { Meta } from "@/stores/useMetaStore";
import * as XLSX from 'xlsx';
import { ExcelUtilOptions } from "../ExportExcel.types";

const applyHeaderStyle = (ws: XLSX.WorkSheet, range: XLSX.Range) => {
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: range.s.r, c: C });
        if (!ws[cellRef]) continue;
        ws[cellRef].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "F7F7F7" } },
            alignment: { vertical: "center" }
        };
    }
};

const getValueLabelMap = (values: ValueLabel[]): Map<string | number, string> => {
    return new Map(values.map(vl => [vl.value, vl.label]));
};

const formatMissingSpecToString = (spec: MissingValuesSpec | null): string => {
    if (!spec) {
        return "";
    }
    const parts: string[] = [];
    if (spec.range) {
        const { min, max } = spec.range;
        if (min !== undefined && max !== undefined) {
            parts.push(`RANGE(${min} THRU ${max})`);
        } else if (min !== undefined) {
            parts.push(`RANGE(${min} THRU HIGHEST)`);
        } else if (max !== undefined) {
            parts.push(`RANGE(LOWEST THRU ${max})`);
        }
    }
    if (spec.discrete && spec.discrete.length > 0) {
        const discreteFormatted = spec.discrete.map(v => {
            if (typeof v === 'string') {
                 if (v === " ") return "'[SPACE]'";
                 if (v.includes(';') || v.includes(' ') || !isNaN(Number(v))) {
                    return JSON.stringify(v);
                 }
            }
            return String(v);
        });
        parts.push(discreteFormatted.join('; '));
    }
    return parts.join('; ');
};

export const generateExcelWorkbook = (
    data: DataRow[],
    variables: Variable[],
    metadata: Meta | null,
    options: ExcelUtilOptions
): XLSX.WorkBook => {
    const {
        includeHeaders,
        includeVariablePropertiesSheet,
        includeMetadataSheet,
        includeDataLabels,
        applyHeaderStyling
    } = options;

    const wb = XLSX.utils.book_new();

    const dataSheetData: any[][] = [];
    const variableLabelMaps = includeDataLabels ? variables.map(v => getValueLabelMap(v.values)) : [];

    if (includeHeaders && variables.length > 0) {
        dataSheetData.push(variables.map(v => v.name));
    }

    data.forEach(row => {
        const processedRow = row.map((cell, colIndex) => {
            if (includeDataLabels && colIndex < variables.length) {
                const labelMap = variableLabelMaps[colIndex];
                if (labelMap.has(cell)) {
                    return labelMap.get(cell);
                }
            }
            const variableType = variables[colIndex]?.type;
            if (cell === "" || cell === null || cell === undefined) return null;
            if (typeof cell === 'number') return cell;
            if (typeof cell === 'string' && !isNaN(Number(cell)) && (variableType?.startsWith("NUMERIC") || ["COMMA", "DOT", "SCIENTIFIC"].includes(variableType || ''))) {
                return Number(cell);
            }
            return cell;
        });
        dataSheetData.push(processedRow);
    });

    const wsData = XLSX.utils.aoa_to_sheet(dataSheetData);

    if (includeHeaders && applyHeaderStyling && dataSheetData.length > 0) {
        const dataRange = XLSX.utils.decode_range(wsData['!ref'] || "A1");
        applyHeaderStyle(wsData, { s: { r: 0, c: dataRange.s.c }, e: { r: 0, c: dataRange.e.c } });
    }

    XLSX.utils.book_append_sheet(wb, wsData, "Data");

    if (includeVariablePropertiesSheet && variables.length > 0) {
        const varSheetData: any[][] = [];
        const varHeaders = [
            "Index", "Name", "Type", "Label", "Width", "Decimals",
            "Measure", "Align", "Role", "MissingValues", "ValueLabels"
        ];
        varSheetData.push(varHeaders);

        variables.forEach(v => {
            const valueLabelsString = v.values.map(vl => `${vl.value}=${JSON.stringify(vl.label)}`).join('; ');
            const missingString = formatMissingSpecToString(v.missing);
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
        XLSX.utils.book_append_sheet(wb, wsVar, "Variable Definitions");
    }

    if (includeMetadataSheet && metadata && Object.keys(metadata).length > 0) {
        const metaSheetData: any[][] = [["Property", "Value"]];
        Object.entries(metadata).forEach(([key, value]) => {
            const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
            metaSheetData.push([key, displayValue]);
        });

        const wsMeta = XLSX.utils.aoa_to_sheet(metaSheetData);
        if (applyHeaderStyling && metaSheetData.length > 0) {
            const metaRange = XLSX.utils.decode_range(wsMeta['!ref'] || "A1");
            applyHeaderStyle(wsMeta, { s: { r: 0, c: metaRange.s.c }, e: { r: 0, c: metaRange.e.c } });
        }
        XLSX.utils.book_append_sheet(wb, wsMeta, "Metadata");
    }

    return wb;
}; 