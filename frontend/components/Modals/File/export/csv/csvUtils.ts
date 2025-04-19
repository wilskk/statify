// lib/utils/csvUtils.ts
import { Variable } from "@/types/Variable";
import { DataRow } from "@/stores/useDataStore";

export interface CsvExportOptions {
    delimiter: string;
    includeHeaders: boolean;
    includeVariableProperties: boolean;
    quoteStrings: boolean; // If true, always quote strings. If false, only quote if necessary.
}

/**
 * Escapes a cell value for CSV format.
 * Always wraps the value in double quotes if:
 * - It contains a double quote (escaped as "").
 * - It contains the delimiter.
 * - It contains a newline character.
 * - quoteStrings option is true and the value is a string.
 * @param cellValue The value of the cell.
 * @param delimiter The CSV delimiter.
 * @param quoteStrings Always quote strings if true.
 * @returns Escaped cell value.
 */
const escapeCsvCell = (cellValue: string | number | undefined | null, delimiter: string, quoteStrings: boolean): string => {
    if (cellValue === undefined || cellValue === null) {
        return "";
    }
    const stringValue = String(cellValue);

    // Characters that necessitate quoting
    const needsQuoting =
        stringValue.includes('"') ||
        stringValue.includes(delimiter) ||
        stringValue.includes('\n') ||
        stringValue.includes('\r');

    // Determine if quoting is required based on content or the quoteStrings option
    const shouldQuote = (typeof cellValue === 'string' && quoteStrings) || needsQuoting;

    if (shouldQuote) {
        // Escape existing double quotes by doubling them
        const escapedValue = stringValue.replace(/"/g, '""');
        return `"${escapedValue}"`;
    }

    return stringValue;
};

/**
 * Generates the content for a CSV file based on data, variables, and options.
 * @param data The main data rows.
 * @param variables The variable definitions.
 * @param options Configuration options for the export.
 * @returns A string containing the full CSV content.
 */
export const generateCsvContent = (
    data: DataRow[],
    variables: Variable[],
    options: CsvExportOptions
): string => {
    const { delimiter, includeHeaders, includeVariableProperties, quoteStrings } = options;
    const lines: string[] = [];

    // 1. Add Variable Properties (as commented lines)
    if (includeVariableProperties && variables.length > 0) {
        lines.push(`# Variable Definitions:`);
        // Header for variable properties
        const propHeaders = [
            "Index", "Name", "Type", "Width", "Decimals",
            "Label", "Measure", "Align", "Role", "MissingValues", "ValueLabels"
        ].join(delimiter);
        lines.push(`# ${propHeaders}`);

        variables.forEach(v => {
            const valueLabelsString = v.values.map(vl => `${vl.value}=${vl.label}`).join('; '); // Example format
            const missingString = v.missing.join('; ');
            const properties = [
                v.columnIndex, v.name, v.type, v.width, v.decimals,
                v.label || "", v.measure, v.align, v.role, missingString, valueLabelsString
            ].map(prop => escapeCsvCell(prop, delimiter, true)) // Always quote metadata strings
                .join(delimiter);
            lines.push(`# ${properties}`);
        });
        lines.push(''); // Add an empty line for separation
    }

    // 2. Add Headers (Variable Names)
    if (includeHeaders && variables.length > 0) {
        const headers = variables.map(v => escapeCsvCell(v.name, delimiter, quoteStrings));
        lines.push(headers.join(delimiter));
    }

    // 3. Add Data Rows
    data.forEach(row => {
        const formattedRow = row.map(cell => escapeCsvCell(cell, delimiter, quoteStrings));
        lines.push(formattedRow.join(delimiter));
    });

    return lines.join("\n");
};