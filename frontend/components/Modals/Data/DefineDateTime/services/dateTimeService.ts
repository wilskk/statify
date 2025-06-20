import { TimeComponent } from "../types";
import { formatDateString, getDateFormatString } from "../utils/dateTimeFormatters";
import { Variable } from "@/types/Variable";

// This interface is internal to the service
interface DateTimeGenerationResult {
    variablesToCreate: Partial<Variable>[];
    cellUpdates: { row: number; col: number; value: any }[];
}

/**
 * Generates sample data for the new date/time variables.
 * This is a pure function that returns the necessary cell updates.
 */
const generateSampleData = (
    timeComponents: TimeComponent[],
    createdVariables: Partial<Variable>[],
    existingRowCount: number
): { row: number; col: number; value: any }[] => {
    const rowCount = existingRowCount > 0 ? existingRowCount : 20;
    const updates: { row: number; col: number; value: any }[] = [];

    const variableMap = createdVariables.reduce((map, variable) => {
        if (variable.name && variable.columnIndex !== undefined) {
            map[variable.name] = variable;
        }
        return map;
    }, {} as Record<string, Partial<Variable>>);

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        const currentValues: Record<string, number> = {};

        timeComponents.forEach((component) => {
            currentValues[component.name.toLowerCase()] = component.value;
        });

        if (rowIndex > 0) {
            let carry = rowIndex;
            for (let i = timeComponents.length - 1; i >= 0; i--) {
                const component = timeComponents[i];
                const name = component.name.toLowerCase();

                if (component.periodicity) {
                    const baseValue = component.value;
                    const addedValue = carry % component.periodicity;
                    const periodicValue = ((baseValue - 1 + addedValue) % component.periodicity) + 1;
                    currentValues[name] = periodicValue;
                    carry = Math.floor((baseValue - 1 + carry) / component.periodicity);
                    if (carry === 0) break;
                } else {
                    currentValues[name] = component.value + carry;
                    carry = 0;
                    break;
                }
            }
        }

        timeComponents.forEach((component) => {
            const variableName = `${component.name.toUpperCase()}_`;
            const variableColIndex = variableMap[variableName]?.columnIndex;

            if (variableColIndex !== undefined) {
                updates.push({
                    row: rowIndex,
                    col: variableColIndex,
                    value: currentValues[component.name.toLowerCase()],
                });
            }
        });

        const dateColIndex = variableMap["DATE_"]?.columnIndex;
        if (dateColIndex !== undefined) {
            const dateString = formatDateString(currentValues, timeComponents);
            updates.push({
                row: rowIndex,
                col: dateColIndex,
                value: dateString,
            });
        }
    }

    return updates;
};

/**
 * Prepares the definitions for new date/time variables and the sample data to populate them.
 * It does not interact with stores directly.
 */
export const prepareDateVariables = (
    timeComponents: TimeComponent[],
    currentVariables: Variable[],
    existingRowCount: number
): DateTimeGenerationResult => {
    let startColumnIndex = currentVariables.length;
    const variablesToCreate: Partial<Variable>[] = [];

    for (const component of timeComponents) {
        const variableName = `${component.name.toUpperCase()}_`;
        let variableLabel = component.name.toUpperCase();
        if (component.periodicity) {
            variableLabel += `, period ${component.periodicity}`;
        } else {
            variableLabel += ", not periodic";
        }

        const newVariable: Partial<Variable> = {
            columnIndex: startColumnIndex++,
            name: variableName,
            type: "NUMERIC",
            width: 8,
            decimals: 0,
            label: variableLabel,
            columns: 64,
            align: "right",
            measure: "scale",
            role: "input",
        };
        variablesToCreate.push(newVariable);
    }

    const dateFormatString = getDateFormatString(timeComponents);
    const dateVariable: Partial<Variable> = {
        columnIndex: startColumnIndex,
        name: "DATE_",
        type: "STRING",
        width: 20,
        decimals: 0,
        label: `Date. Format: ${dateFormatString}`,
        columns: 64,
        align: "left",
        measure: "nominal",
        role: "input",
    };
    variablesToCreate.push(dateVariable);

    const cellUpdates = generateSampleData(timeComponents, variablesToCreate, existingRowCount);

    return { variablesToCreate, cellUpdates };
}; 