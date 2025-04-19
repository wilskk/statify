// lib/utils/csvUtils.ts
import { Variable } from "@/types/Variable";
import { DataRow } from "@/stores/useDataStore";

export interface CsvExportOptions {
    delimiter: string;
    includeHeaders: boolean;
    includeVariableProperties: boolean;
    quoteStrings: boolean;
}

const escapeCsvCell = (cellValue: string | number | undefined | null, delimiter: string, quoteStrings: boolean): string => {
    if (cellValue === undefined || cellValue === null) {
        return "";
    }
    const stringValue = String(cellValue);

    const needsQuoting =
        stringValue.includes('"') ||
        stringValue.includes(delimiter) ||
        stringValue.includes('\n') ||
        stringValue.includes('\r');

    const shouldQuote = (typeof cellValue === 'string' && quoteStrings) || needsQuoting;

    if (shouldQuote) {
        const escapedValue = stringValue.replace(/"/g, '""');
        return `"${escapedValue}"`;
    }

    return stringValue;
};

export const generateCsvContent = (
    data: DataRow[],
    variables: Variable[],
    options: CsvExportOptions
): string => {
    const { delimiter, includeHeaders, includeVariableProperties, quoteStrings } = options;
    const lines: string[] = [];

    if (includeVariableProperties && variables.length > 0) {
        lines.push(`# Variable Definitions:`);
        const propHeaders = [
            "Index", "Name", "Type", "Width", "Decimals",
            "Label", "Measure", "Align", "Role", "MissingValues", "ValueLabels"
        ].join(delimiter);
        lines.push(`# ${propHeaders}`);

        variables.forEach(v => {
            const valueLabelsString = v.values.map(vl => `${vl.value}=${vl.label}`).join('; ');
            const missingString = v.missing.join('; ');
            const properties = [
                v.columnIndex, v.name, v.type, v.width, v.decimals,
                v.label || "", v.measure, v.align, v.role, missingString, valueLabelsString
            ].map(prop => escapeCsvCell(prop, delimiter, true))
                .join(delimiter);
            lines.push(`# ${properties}`);
        });
        lines.push('');
    }

    if (includeHeaders && variables.length > 0) {
        const headers = variables.map(v => escapeCsvCell(v.name, delimiter, quoteStrings));
        lines.push(headers.join(delimiter));
    }

    data.forEach(row => {
        const formattedRow = row.map(cell => escapeCsvCell(cell, delimiter, quoteStrings));
        lines.push(formattedRow.join(delimiter));
    });

    return lines.join("\n");
};