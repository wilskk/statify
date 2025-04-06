import { useCallback } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';

export type EditActionType =
    | "Undo"
    | "Redo"
    | "Cut"
    | "Copy"
    | "CopyWithVariableNames"
    | "CopyWithVariableLabels"
    | "Paste"
    | "PasteVariables"
    | "PasteWithVariableNames"
    | "Clear"
    | "InsertVariable"
    | "InsertCases";

interface EditActionPayload {
    actionType: EditActionType;
}

// Clipboard state (persists between renders but not page reloads)
let clipboardData: {
    data: (string | number)[][],
    variableNames?: string[],
    variableLabels?: string[],
    timestamp: number
} | null = null;

export const useEditActions = () => {
    const {
        data,
        selectedRange,
        updateBulkCells,
        addRow,
        addColumn,
        getSelectedData
    } = useDataStore();

    const {
        variables,
        getVariableByColumnIndex,
        addVariable,
        updateVariable
    } = useVariableStore();

    const handleAction = useCallback(async ({ actionType }: { actionType: EditActionType }) => {
        switch (actionType) {
            case "Undo":
                console.log("Performing Undo action");
                // This would require history management implementation
                break;

            case "Redo":
                console.log("Performing Redo action");
                // This would require history management implementation
                break;

            case "Cut":
                if (!selectedRange) return;

                // Copy data to clipboard
                const cutData = getSelectedData();
                clipboardData = {
                    data: cutData,
                    timestamp: Date.now()
                };

                // Clear the selected cells
                const cutUpdates = [];
                for (let r = selectedRange.from.row; r <= selectedRange.to.row; r++) {
                    for (let c = selectedRange.from.col; c <= selectedRange.to.col; c++) {
                        cutUpdates.push({ row: r, col: c, value: "" });
                    }
                }

                await updateBulkCells(cutUpdates);
                console.log("Cut action completed");
                break;

            case "Copy":
                if (!selectedRange) return;

                // Copy data to clipboard
                const copyData = getSelectedData();
                clipboardData = {
                    data: copyData,
                    timestamp: Date.now()
                };

                console.log("Copy action completed");
                break;

            case "CopyWithVariableNames":
                if (!selectedRange) return;

                // Get data and variable names
                const copyWithNamesData = getSelectedData();
                const variableNames = [];

                for (let c = selectedRange.from.col; c <= selectedRange.to.col; c++) {
                    const variable = getVariableByColumnIndex(c);
                    variableNames.push(variable?.name || `var${c}`);
                }

                clipboardData = {
                    data: copyWithNamesData,
                    variableNames,
                    timestamp: Date.now()
                };

                console.log("Copy with variable names completed");
                break;

            case "CopyWithVariableLabels":
                if (!selectedRange) return;

                // Get data and variable labels
                const copyWithLabelsData = getSelectedData();
                const variableLabels = [];

                for (let c = selectedRange.from.col; c <= selectedRange.to.col; c++) {
                    const variable = getVariableByColumnIndex(c);
                    variableLabels.push(variable?.label || "");
                }

                clipboardData = {
                    data: copyWithLabelsData,
                    variableLabels,
                    timestamp: Date.now()
                };

                console.log("Copy with variable labels completed");
                break;

            case "Paste":
                if (!selectedRange || !clipboardData) return;

                const { from } = selectedRange;
                const pasteUpdates = [];

                // Insert data from clipboard
                for (let r = 0; r < clipboardData.data.length; r++) {
                    for (let c = 0; c < clipboardData.data[r].length; c++) {
                        pasteUpdates.push({
                            row: from.row + r,
                            col: from.col + c,
                            value: clipboardData.data[r][c]
                        });
                    }
                }

                await updateBulkCells(pasteUpdates);
                console.log("Paste action completed");
                break;

            case "PasteVariables":
                if (!selectedRange || !clipboardData) return;

                // Create variables from clipboard data
                const { from: pasteFrom } = selectedRange;
                const columnCount = clipboardData.data[0]?.length || 0;

                // First add columns to dataStore
                for (let c = 0; c < columnCount; c++) {
                    await addColumn(pasteFrom.col + c);
                }

                // Then add variables to variableStore
                for (let c = 0; c < columnCount; c++) {
                    // Prepare variable data
                    const varData = {
                        columnIndex: pasteFrom.col + c,
                        name: clipboardData.variableNames?.[c] || `var${pasteFrom.col + c + 1}`,
                    };

                    // Add the variable
                    await addVariable(varData);
                }

                console.log("Paste variables completed");
                break;

            case "PasteWithVariableNames":
                if (!selectedRange || !clipboardData || !clipboardData.variableNames) return;

                const { from: pasteNameFrom } = selectedRange;

                // First process variable names
                for (let c = 0; c < clipboardData.variableNames.length; c++) {
                    const colIndex = pasteNameFrom.col + c;
                    await updateVariable(colIndex, "name", clipboardData.variableNames[c]);
                }

                // Then paste the data
                const pasteNameUpdates = [];
                for (let r = 0; r < clipboardData.data.length; r++) {
                    for (let c = 0; c < clipboardData.data[r].length; c++) {
                        pasteNameUpdates.push({
                            row: pasteNameFrom.row + r + 1, // Skip first row because it contains variable names
                            col: pasteNameFrom.col + c,
                            value: clipboardData.data[r][c]
                        });
                    }
                }

                await updateBulkCells(pasteNameUpdates);
                console.log("Paste with variable names completed");
                break;

            case "Clear":
                if (!selectedRange) return;

                // Clear selected cells
                const clearUpdates = [];
                for (let r = selectedRange.from.row; r <= selectedRange.to.row; r++) {
                    for (let c = selectedRange.from.col; c <= selectedRange.to.col; c++) {
                        clearUpdates.push({ row: r, col: c, value: "" });
                    }
                }

                await updateBulkCells(clearUpdates);
                console.log("Clear action completed");
                break;

            case "InsertVariable":
                // If selection exists, insert at the selected column
                const insertColIndex = selectedRange ? selectedRange.from.col : variables.length;

                // Add variable to variableStore
                await addVariable({ columnIndex: insertColIndex });

                // Add column to dataStore (since stores are not connected)
                await addColumn(insertColIndex);

                console.log("Insert variable completed at index", insertColIndex);
                break;

            case "InsertCases":
                // If selection exists, insert at the selected row
                const insertRowIndex = selectedRange ? selectedRange.from.row : data.length;
                await addRow(insertRowIndex);
                console.log("Insert case completed at index", insertRowIndex);
                break;

            default:
                console.warn("Unknown edit action:", actionType);
        }
    }, [selectedRange, getSelectedData, updateBulkCells, addRow, addColumn, data, variables, getVariableByColumnIndex, addVariable, updateVariable]);

    // Helper to check if clipboard has data
    const hasClipboardData = useCallback(() => {
        return clipboardData !== null;
    }, []);

    // Helper to get clipboard content for use in UI
    const getClipboardSummary = useCallback(() => {
        if (!clipboardData) return null;

        return {
            rowCount: clipboardData.data.length,
            colCount: clipboardData.data[0]?.length || 0,
            hasVariableNames: !!clipboardData.variableNames,
            hasVariableLabels: !!clipboardData.variableLabels
        };
    }, []);

    return {
        handleAction,
        hasClipboardData,
        getClipboardSummary
    };
};