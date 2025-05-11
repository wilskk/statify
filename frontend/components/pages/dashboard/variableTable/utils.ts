import { Variable, ValueLabel, MissingValuesSpec } from "@/types/Variable";
import { DEFAULT_MIN_ROWS, COLUMN_INDEX_TO_FIELD_MAP } from './constants';

export function formatMissingValuesDisplay(variable: Variable): string {
    if (!variable.missing) {
        return "";
    }

    const displayParts: string[] = [];

    // Format range
    if (variable.missing.range) {
        const { min, max } = variable.missing.range;
        if (min !== undefined && max !== undefined && typeof min === 'number' && typeof max === 'number' && min <= max) {
            displayParts.push(`${min} thru ${max}`);
        } else if (min !== undefined && max === undefined) {
            displayParts.push(`${min} thru HIGHEST`); // Consider localization or better term
        } else if (min === undefined && max !== undefined) {
            displayParts.push(`LOWEST thru ${max}`); // Consider localization or better term
        }
        // Note: Consider if range should be mutually exclusive with discrete, or how they combine.
        // Current logic allows both range and discrete values to be displayed if present.
    }

    // Format discrete values
    if (variable.missing.discrete && variable.missing.discrete.length > 0) {
        const discreteDisplay = variable.missing.discrete
            .map(m => (m === " " ? "'[Space]'" : m))
            .join(", ");
        displayParts.push(discreteDisplay);
    }


    return displayParts.join(", ");
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