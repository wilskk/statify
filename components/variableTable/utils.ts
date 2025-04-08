import { Variable, ValueLabel } from "@/types/Variable";
import { DEFAULT_MIN_ROWS, COLUMN_INDEX_TO_FIELD_MAP } from './constants';

export function formatMissingValuesDisplay(variable: Variable): string {
    if (!Array.isArray(variable.missing) || variable.missing.length === 0) {
        return "";
    }

    const isRange =
        variable.missing.length >= 2 &&
        variable.type !== "STRING" &&
        typeof variable.missing[0] === 'number' &&
        typeof variable.missing[1] === 'number' &&
        variable.missing[0] <= variable.missing[1];

    if (isRange) {
        let display = `${variable.missing[0]} thru ${variable.missing[1]}`;
        if (variable.missing.length > 2 && variable.missing[2] !== undefined) {
            display += `, ${variable.missing[2]}`;
        }
        return display;
    }

    return variable.missing
        .map(m => (m === " " ? "'[Space]'" : m))
        .join(", ");
}

export function formatValueLabelsDisplay(variable: Variable): string {
    if (!Array.isArray(variable.values) || variable.values.length === 0) {
        return "";
    }

    return variable.values
        .map((valueLabel: ValueLabel) =>
            `${valueLabel.value === " " ? "[Space]" : valueLabel.value}: ${valueLabel.label}`
        )
        .join(", ");
}

export function transformVariablesToTableData(variables: Variable[]): (string | number)[][] {
    const maxColumnIndex = variables.length > 0
        ? Math.max(...variables.map(v => v.columnIndex))
        : -1;

    const rowCount = Math.max(DEFAULT_MIN_ROWS, maxColumnIndex + 1);

    return Array.from({ length: rowCount }, (_, index) => {
        const variable = variables.find(v => v.columnIndex === index);

        if (!variable) {
            return Array(COLUMN_INDEX_TO_FIELD_MAP.length).fill("");
        }

        const displayValues = formatValueLabelsDisplay(variable);
        const displayMissing = formatMissingValuesDisplay(variable);

        return COLUMN_INDEX_TO_FIELD_MAP.map(field => {
            if (field === 'values') return displayValues;
            if (field === 'missing') return displayMissing;
            return variable[field as keyof Variable] ?? "";
        });
    });
}